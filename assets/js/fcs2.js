// FrontierCS 2 overview page (index.md): leaderboard charts, the task map (whose tiles play their runs on hover) and task index.
// Data and shared helpers are in fcs2-data.js, loaded first; assets/css/fcs2.css holds the styles.
/* numbers in the page text come from the data, so they cannot drift from the chart */
document.querySelectorAll('[data-fill]').forEach(el => { el.textContent = {updated:`Last updated: ${UPDATED}`, runs:String(RUNS.length),
  runtasks:`on ${NTASK(RUNS)} tasks`, models:`${MODELS.length} models from ${new Set(MODELS.map(m => m.lab)).size} labs have run so far.`,
  summary:`${RUNS.length} runs on ${NTASK(RUNS)} tasks by ${MODELS.length} models`}[el.dataset.fill]; });
// Bring a tab into view inside its own horizontal strip only. scrollIntoView would also scroll the page,
// which fought the reader's scrolling whenever the section spy fired.
const reveal = el => { const p = el.parentElement, pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
  if (er.left < pr.left) p.scrollLeft += er.left - pr.left - 16; else if (er.right > pr.right) p.scrollLeft += er.right - pr.right + 16; };

/* ---------- sub-nav scrollspy ---------- */
const subLinks = [...document.querySelectorAll('#subnav a')];
// The section on screen is the last one whose top has passed just under the sticky bar; at the page's end, the last section.
// (A band in mid-screen picked the next section whenever a short one, like the case-studies placeholder, sat at the top.)
const SECS = ['overview','leaderboard','tasks','cases','questions'].map(id => document.getElementById(id));
let spyRaf = 0;
const spy = () => { spyRaf = 0;
  const bar = $('.sub').getBoundingClientRect().bottom + 24, end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const cur = end ? SECS[SECS.length - 1] : SECS.filter(e => e.getBoundingClientRect().top <= bar).pop() || SECS[0];
  subLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
  const on = subLinks.find(a => a.classList.contains('on')); on && reveal(on); };
addEventListener('scroll', () => { spyRaf ||= requestAnimationFrame(spy); }, {passive:true}); spy();

/* ---------- leaderboard chart ---------- */
let group = 'model', dom = 'All', showRuns = true;
const DOMS_WITH_RUNS = DOMAINS.filter(d => RUNS.some(r => r.d === d));
$('#domradios').innerHTML = ['All', ...DOMS_WITH_RUNS].map(d => `<label><input type="radio" name="dom" value="${esc(d)}" ${d === 'All' ? 'checked' : ''}>${d === 'All' ? 'All domains' : esc(d)}</label>`).join('');
$('#domradios').addEventListener('change', e => { dom = e.target.value; drawLB(); });
$('#groupby').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; group = b.dataset.g;
  [...$('#groupby').children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); drawLB(); });
$('#showruns').addEventListener('change', e => { showRuns = e.target.checked; drawLB(); });
$('#custom').addEventListener('click', () => { const s = $('#settings'); const o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#custom').setAttribute('aria-expanded', String(o)); });
$('#lblegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* Main chart: pass rate against mean cost per run in US$, one dot per model (PASS, COST). Each label takes the first
   spot right, left, above or below its dot that clears every dot, every placed label and the edges; a dot with no free
   spot keeps no label (the tooltip still names it). No legend: the labels name the dots. */
function drawPassCost() {
  const svg = $('#pcsvg'), W = Math.max(300, $('#pcplot').clientWidth), narrow = W < 560;
  const L = 44, R = narrow ? 12 : 24, T = 14, B = 46, H = narrow ? 320 : 400;
  const ms = MODELS.filter(m => COST[m.id]), tx = ms.map(m => COST[m.id][0]);
  // the axis runs to the half decade past the outermost dot plus 0.15 decade, so an edge dot keeps room for its label
  const x0 = Math.floor((Math.log10(Math.min(...tx)) - .15) * 2) / 2, x1 = Math.ceil((Math.log10(Math.max(...tx)) + .15) * 2) / 2;
  const ymax = Math.min(100, Math.ceil((Math.max(...ms.map(m => PASS[m.id][0])) + 5) / 20) * 20);
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= ymax; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v + '%'));
  }
  // ticks at 1, 2 and 5 times each power of ten; a range under one decade still gets several
  for (let k = Math.floor(x0); k <= Math.ceil(x1); k++) [1, 2, 5].forEach(f => { const v = f * 10 ** k, lv = Math.log10(v);
    if (lv < x0 - 1e-9 || lv > x1 + 1e-9 || (narrow && f === 2 && x1 - x0 > 1.5)) return;
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(v))); });
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost per run in US$, mean, log scale'));
  const pts = [], order = [...ms].sort((a, b) => PASS[b.id][0] - PASS[a.id][0]);
  const at = m => [X(COST[m.id][0]), Y(PASS[m.id][0])];
  const boxes = order.map(m => { const [cx, cy] = at(m); return {x:cx - 9, y:cy - 9, w:18, h:18}; });
  order.forEach(m => {
    const [cx, cy] = at(m), name = narrow ? m.short : m.name;
    svg.append(sv('circle', {cx, cy, r:7, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2, 'data-m':m.id}));
    const lab = sv('text', {class:'lab halo', x:cx, y:cy}, name); svg.append(lab);
    const w = lab.getComputedTextLength() + 2;
    // right, left, above, below, the four diagonals, then the same a line further out; the first spot clear of every dot and placed label wins
    const spots = [[cx + 12, cy + 4.5, 'start'], [cx - 12, cy + 4.5, 'end'], [cx, cy - 13, 'middle'], [cx, cy + 22, 'middle'],
      [cx + 8, cy - 11, 'start'], [cx - 8, cy - 11, 'end'], [cx + 8, cy + 20, 'start'], [cx - 8, cy + 20, 'end'],
      [cx, cy - 29, 'middle'], [cx, cy + 38, 'middle'], [cx + 6, cy - 27, 'start'], [cx - 6, cy - 27, 'end'], [cx + 6, cy + 36, 'start'], [cx - 6, cy + 36, 'end']];
    const box = ([x, y, an]) => ({x:an === 'start' ? x : an === 'end' ? x - w : x - w / 2, y:y - 12, w, h:16});
    const hit = q => boxes.some(o => q.x < o.x + o.w && o.x < q.x + q.w && q.y < o.y + o.h && o.y < q.y + q.h) || q.x < L || q.x + q.w > W || q.y < 0;
    const spot = spots.find(sp => !hit(box(sp)));
    if (spot) { boxes.push(box(spot)); lab.setAttribute('x', spot[0]); lab.setAttribute('y', spot[1]); lab.setAttribute('text-anchor', spot[2]); }
    else lab.remove();
    const pct = PASS[m.id][0];
    pts.push({x:cx, y:cy, mean:true, html:`<b>${esc(m.name)}</b><br>Pass rate <b>${f1(pct)}%</b><br>${usdfmt(COST[m.id][0])} per run, mean`});
  });
  attachTip(svg, W, H, pts, $('#pctip'));
}

/* On phones the model column is as wide as the longest model name, so every name shows in full (owner: "DeepSeek V4.1 Flash", not cut). */
const nameCol = svg => { svg.replaceChildren(); const w = Math.max(...MODELS.map(m => { const t = sv('text', {class:'lab', x:-999, y:-999}, m.short); svg.append(t); return t.getComputedTextLength(); })); svg.replaceChildren(); return Math.max(112, Math.ceil(w) + 12); };

/* FECI: one row per model ranked by ECI, its 90% interval as a bar. */
function drawECI() {
  const order = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
  const svg = $('#ecisvg'), W = Math.max(300, $('#eciplot').clientWidth), narrow = W < 560;
  const L = narrow ? nameCol(svg) : 190, R = 34, T = 14, B = 46, lane = narrow ? 56 : 64;
  const xmax = Math.ceil(Math.max(...MODELS.map(m => ECI[m.id][2])) / 20) * 20, step = narrow && xmax > 120 ? 40 : 20;
  const H = T + order.length * lane + B;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const X = v => L + v / xmax * (W - L - R);
  for (let v = 0; v <= xmax; v += step) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FECI'));
  const pts = [];
  order.forEach((m, i) => {
    const [e, lo, hi] = ECI[m.id], y0 = T + i * lane, yc = y0 + lane / 2;
    if (i) svg.append(sv('line', {x1:0, x2:W - R, y1:y0, y2:y0, stroke:'var(--line)', 'stroke-width':1}));
    svg.append(sv('text', {class:'lab', x:0, y:yc + (m.h ? -3 : 4)}, narrow ? m.short : m.name));
    if (m.h) svg.append(sv('text', {x:0, y:yc + 14, 'font-size':12}, m.h));
    svg.append(sv('line', {x1:X(lo), x2:X(hi), y1:yc, y2:yc, stroke:MCOL[m.id], 'stroke-width':6, 'stroke-linecap':'round', opacity:.25}));
    svg.append(sv('circle', {cx:X(e), cy:yc, r:7, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2}));
    svg.append(sv('text', {class:'val halo', x:X(e), y:yc - 13, fill:MCOL[m.id], 'text-anchor':'middle'}, String(Math.round(e))));
    pts.push({x:X(e), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(e)}</b><br>90% interval ${Math.round(lo)}–${Math.round(hi)}`});
  });
  attachTip(svg, W, H, pts, $('#ecitip'));
}

/* Test-time scaling: FECI when every run stops at a US$ budget (SCALE, from bin/fcs2_runs_from_db.py).
   Values below 0 leave the plot through its bottom edge. */
function drawTTS() {
  const svg = $('#ttssvg'), W = Math.max(300, $('#ttsplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 300 : 380;
  const all = Object.values(SCALE).flat();
  // the axis starts half a decade before the first budget at which any model rises above 0
  const x0 = Math.log10(Math.min(...all.filter(p => p[1] >= 0).map(p => p[0]))) - 0.5, x1 = Math.log10(Math.max(...all.map(p => p[0])));
  const ymax = Math.ceil(Math.max(...all.map(p => p[3])) / 20) * 20;
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const clip = sv('clipPath', {id:'ttsclip'}); clip.append(sv('rect', {x:L, y:T - 4, width:W - L - R + 8, height:H - T - B + 4})); svg.append(clip);
  for (let v = 0; v <= ymax; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let k = Math.ceil(x0); k <= Math.floor(x1); k++) {
    svg.append(sv('line', {x1:X(10 ** k), x2:X(10 ** k), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(10 ** k), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(10 ** k)));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost budget per run in US$, log scale'));
  const g = sv('g', {'clip-path':'url(#ttsclip)'}); svg.append(g);
  const pts = [];
  [...RANKED].reverse().forEach(m => {
    const c = SCALE[m.id], path = c.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    const band = c.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[3]).toFixed(1)}`).join('')
      + [...c].reverse().map(p => `L${X(p[0]).toFixed(1)},${Y(p[2]).toFixed(1)}`).join('') + 'Z';
    g.append(sv('path', {d:band, fill:MCOL[m.id], opacity:.12}));
    g.append(sv('path', {d:path, fill:'none', stroke:MCOL[m.id], 'stroke-width':2.2, 'stroke-linejoin':'round'}));
    const e = c[c.length - 1];
    g.append(sv('circle', {cx:X(e[0]), cy:Y(e[1]), r:4.5, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':1.5}));
    c.forEach(p => { if (p[1] >= 0) pts.push({x:X(p[0]), y:Y(p[1]), html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(p[1])}</b> at ${usdfmt(p[0])} per run`
      + `<br>90% interval ${Math.round(Math.max(p[2], 0))}–${Math.round(p[3])}<br>${Math.round(p[4] * 100)}% of runs still going`}); });
  });
  attachTip(svg, W, H, pts, $('#ttstip'));
}
$('#ttslegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

const TASK_OF = Object.fromEntries(TASKS.map(t => [t.s, t]));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawLB() {
  const runs = RUNS.filter(r => dom === 'All' || r.d === dom);
  // grouped by model, the row labels name the models; grouped by task, the dots need the legend
  $('#lblegend').hidden = group === 'model';
  let rows;
  if (group === 'model') {
    rows = MODELS.map(m => ({label:m.name, short:m.short, sub:m.h, items:[{m:m.id, runs:runs.filter(r => r.m === m.id)}]})).filter(r => r.items[0].runs.length);
    rows.forEach(r => r.best = mean(r.items[0].runs.map(x => x.s)));
  } else {
    // one line per task, one dot per model: the model's mean over its runs on that task
    const ts = [...new Set(runs.map(r => r.t))];
    rows = ts.map(t => ({label:t, sub:runs.find(r => r.t === t).d, items:MODELS.map(m => ({m:m.id, runs:runs.filter(r => r.t === t && r.m === m.id)})).filter(i => i.runs.length)}));
    rows.forEach(r => r.best = Math.max(...r.items.map(i => mean(i.runs.map(x => x.s)))));
  }
  rows.sort((a, b) => b.best - a.best);
  const svg = $('#lbsvg'), box = $('#lbplot'), W = Math.max(300, box.clientWidth), narrow = W < 560;
  const L = narrow ? (group === 'model' ? nameCol(svg) : 112) : 190, R = 34, T = 8, B = 46;
  const lane = group === 'model' ? (narrow ? 64 : 76) : 30;
  const rowH = () => lane;
  const H = T + rows.reduce((a, r) => a + rowH(r), 0) + B;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const X = v => L + v / 100 * (W - L - R);
  for (let v = 0; v <= 100; v += 20) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Final score'));
  const pts = [];
  let y0 = T;
  rows.forEach((r, ri) => {
    const h = rowH(r);
    if (ri) svg.append(sv('line', {x1:0, x2:W - R, y1:y0, y2:y0, stroke:'var(--line)', 'stroke-width':1}));
    const two = group === 'model' && r.sub;
    const name = narrow && r.short ? r.short : r.label, maxc = Math.floor((L - 14) / 7.4);
    const short = group === 'task' && name.length > maxc ? name.slice(0, maxc - 1).trimEnd() + '…' : name;
    const lab = sv('text', {class:'lab', x:0, y:y0 + h / 2 + (two ? -3 : 4)}, short);
    if (short !== r.label) lab.append(sv('title', {}, r.label));
    svg.append(lab);
    if (two) svg.append(sv('text', {x:0, y:y0 + h / 2 + 14, 'font-size':12}, r.sub));
    if (group === 'task') {
      const ms = r.items.map(i => mean(i.runs.map(x => x.s))), yc = y0 + h / 2;
      if (ms.length > 1) svg.append(sv('line', {x1:X(Math.min(...ms)), x2:X(Math.max(...ms)), y1:yc, y2:yc, stroke:'var(--line)', 'stroke-width':2}));
      r.items.forEach((it, k) => {
        svg.append(sv('circle', {cx:X(ms[k]), cy:yc, r:5.5, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':1.5}));
        pts.push({x:X(ms[k]), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(r.label)} · ${esc(r.sub)}<br>${it.runs.length > 1 ? `Mean <b>${f1(ms[k])}</b>` : `Final score <b>${f1(ms[k])}</b>`}`, mean:true});
      });
      const edge = X(Math.max(...ms)) + 10, right = edge + 34 > W;
      svg.append(sv('text', {class:'val', x: right ? X(Math.min(...ms)) - 10 : edge, y:yc + 4.5, fill:'var(--ink-2)', 'text-anchor': right ? 'end' : 'start'}, f1(Math.max(...ms))));
      y0 += h; return;
    }
    r.items.forEach((it, k) => {
      const yc = y0 + h / 2;
      const ss = it.runs.map(x => x.s), mu = mean(ss);
      if (ss.length > 1) svg.append(sv('line', {x1:X(Math.min(...ss)), x2:X(Math.max(...ss)), y1:yc, y2:yc, stroke:MCOL[it.m], 'stroke-width':2, opacity:.35}));
      if (showRuns) it.runs.forEach((x, j) => {
        const jy = ((j * 37) % 17 - 8) * (narrow ? .9 : 1.2);
        const c = sv('circle', {cx:X(x.s), cy:yc + jy, r:4.5, fill:MCOL[it.m], opacity:.4});
        svg.append(c); pts.push({x:X(x.s), y:yc + jy, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(x.t)} · ${esc(x.d)}<br>Final score <b>${f1(x.s)}</b>`});
      });
      svg.append(sv('circle', {cx:X(mu), cy:yc, r:8, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':2}));
      pts.push({x:X(mu), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>Mean <b>${f1(mu)}</b>`, mean:true});
      // the mean sits above its own dot, with a white halo over the run dots
      svg.append(sv('text', {class:'val halo', x:X(mu), y:yc - 15, fill:MCOL[it.m], 'text-anchor':'middle'}, f1(mu)));
    });
    y0 += h;
  });
  attachTip(svg, W, H, pts);
}

/* ---------- results by domain ---------- */
function drawTable() {
  const head = `<tr><th>Domain</th><th class="tk">Tasks run</th>${RANKED.map(m => `<th><span class="mn" style="background:${MCOL[m.id]}"></span><span class="full">${m.name}</span><span class="short">${m.short}</span></th>`).join('')}</tr>`;
  const line = (d, cls) => {
    const vals = RANKED.map(m => { const s = RUNS.filter(r => r.m === m.id && (d === 'All' || r.d === d)).map(r => r.p * 100); return s.length ? mean(s) : null; });
    const best = Math.max(...vals.filter(v => v != null));
    const n = NTASK(RUNS.filter(r => d === 'All' || r.d === d));
    return `<tr class="${cls || ''}"><td>${d === 'All' ? 'All tasks' : esc(d)}</td><td class="tk">${n}</td>${vals.map(v => v == null ? '<td class="e">–</td>' : `<td class="${v === best && vals.filter(x => x != null).length > 1 ? 'best' : ''}">${Math.round(v)}%</td>`).join('')}</tr>`;
  };
  $('#restbl').innerHTML = head + DOMS_WITH_RUNS.map(d => line(d)).join('') + line('All', 'all');
}

/* ---------- case studies: a placeholder until the preview runs have their own (owner, 2026-10-09) ---------- */
const redraws = [];

/* ---------- questions ---------- */
const fqHash = () => { const d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({block:'start'}); } };
addEventListener('hashchange', fqHash); fqHash();

/* ---------- task index ---------- */
let picked = new Set(), q = '', sort = 'domain', limit = 5;
$('#checks').innerHTML = DOMAINS.map(d => `<label><input type="checkbox" value="${esc(d)}"> ${esc(d)} (${N_IN(d)})</label>`).join('');
$('#checks').addEventListener('change', e => { e.target.checked ? picked.add(e.target.value) : picked.delete(e.target.value); limit = 5; drawRows(); });
$('#ftoggle').addEventListener('click', () => { const f = $('#filter'), o = !f.classList.contains('open'); f.classList.toggle('open', o); $('#ftoggle').setAttribute('aria-expanded', String(o)); });
$('#q').addEventListener('input', e => { q = e.target.value; limit = 5; drawRows(); });
$('#sort').addEventListener('change', e => { sort = e.target.value; drawRows(); });
$('#showmore').addEventListener('click', () => { limit += 20; drawRows(); });
function hits() {
  const w = q.toLowerCase().split(/\s+/).filter(Boolean);
  let h = TASKS.filter(t => (!picked.size || picked.has(t.d)) && w.every(x => (t.s + ' ' + t.t + ' ' + t.d).toLowerCase().includes(x)));
  if (sort === 'name') h = [...h].sort((a, b) => a.s.localeCompare(b.s, 'en', {sensitivity:'base'}));
  else if (sort === 'runs') h = [...h].sort((a, b) => RAN.has(b.s) - RAN.has(a.s));
  else h = [...h].sort((a, b) => DOMAINS.indexOf(a.d) - DOMAINS.indexOf(b.d));
  return h;
}
function squarify(vals, x, y, w, h) {
  const tot = vals.reduce((a, b) => a + b, 0), areas = vals.map(v => v * w * h / tot), out = [];
  const worst = (row, side) => { const s = row.reduce((a, b) => a + b, 0); return Math.max(...row.map(r => Math.max(side * side * r / (s * s), s * s / (side * side * r)))); };
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(w, h); let row = [areas[i]], j = i + 1;
    while (j < areas.length && worst([...row, areas[j]], side) <= worst(row, side)) row.push(areas[j++]);
    const s = row.reduce((a, b) => a + b, 0);
    if (w >= h) { const rw = s / h; let yy = y; row.forEach(r => { out.push([x, yy, rw, r / rw]); yy += r / rw; }); x += rw; w -= rw; }
    else { const rh = s / w; let xx = x; row.forEach(r => { out.push([xx, y, r / rh, rh]); xx += r / rh; }); y += rh; h -= rh; }
    i = j;
  }
  return out;
}
const nRan = d => TASKS.filter(t => t.d === d && RAN.has(t.s)).length;
function drawMap() {
  stopPlay();
  const svg = $('#mapsvg'), W = $('#map').clientWidth, narrow = W < 640, H = narrow ? Math.round(W * 1.15) : Math.round(W * 0.36);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const byArea = AREAS.map(a => ({a, n:a.d.reduce((s, d) => s + N_IN(d), 0)})).sort((p, q) => q.n - p.n), G = narrow ? 4 : 6, tol = .5;
  squarify(byArea.map(x => x.n), 0, 0, W, H).forEach((ar, k) => {
    const a = byArea[k].a, doms = [...a.d].sort((p, q) => N_IN(q) - N_IN(p));
    squarify(doms.map(N_IN), ...ar).forEach(([x, y, w, h], j) => {
      const d = doms[j], n = N_IN(d);
      const x0 = x + (x > tol ? G / 2 : 0), y0 = y + (y > tol ? G / 2 : 0), x1 = x + w - (x + w < W - tol ? G / 2 : 0), y1 = y + h - (y + h < H - tol ? G / 2 : 0), bw = x1 - x0, bh = y1 - y0;
      const g = sv('g', {class:'blk', 'aria-label':`${d}, ${n} task${n > 1 ? 's' : ''}`, 'data-d':d});
      // the block holds one illustration per task (fcs2-art.js), in rows that keep each tile closest to 3:2, framed by thin white seams
      const ts = TASKS.filter(t => t.d === d), gap = 2, cid = `mapclip${k}_${j}`;
      let rows = 1, sc = 1e9; for (let r = 1; r <= n; r++) { const c = Math.ceil(n / r), v = Math.abs(Math.log((bw / c) / (bh / r) / 1.5)); if (v < sc) { sc = v; rows = r; } }
      let i = 0, tiles = '';
      for (let r = 0; r < rows; r++) { const cnt = Math.floor(n / rows) + (r < n % rows ? 1 : 0), th = (bh - gap * (rows - 1)) / rows, tw = (bw - gap * (cnt - 1)) / cnt;
        for (let c = 0; c < cnt; c++, i++) tiles += taskArt(ts[i].s, a.k).replace('<svg class="art"', `<svg class="tile" data-s="${esc(ts[i].s)}" data-k="${a.k}" x="${(x0 + c * (tw + gap)).toFixed(1)}" y="${(y0 + r * (th + gap)).toFixed(1)}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}" preserveAspectRatio="xMidYMid slice"`); }
      g.insertAdjacentHTML('beforeend', `<clipPath id="${cid}"><rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="${narrow ? 6 : 8}"/></clipPath><g clip-path="url(#${cid})"><rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="#fff"/>${tiles}</g>`);
      svg.append(g);
      // a white chip at the top left: name and count, then the name alone, lying flat, then standing up along the left edge
      const ink = AINK[a.k], meas = (str, fs) => { const t = sv('text', {x:-999, y:-999, 'font-size':fs, 'font-weight':600}, str); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
      for (const rot of [false, true]) { let done = false;
        for (const cnt of [true, false]) { for (const fs of narrow ? [13, 11, 10] : [15, 13, 11]) {
          const pw = meas(cnt ? `${d}  ${n}` : d, fs) + fs * 1.2, ph = fs * 1.75, m = fs < 13 ? 4 : 8, along = rot ? bh : bw, across = rot ? bw : bh;
          if (pw + 2 * m > along || ph + 2 * m > across) continue;
          const ox = x0 + m, oy = rot ? y0 + bh - m : y0 + m, chip = sv('g', {'pointer-events':'none', transform:rot ? `rotate(-90 ${ox} ${oy})` : null});
          chip.append(sv('rect', {x:ox, y:oy, width:pw.toFixed(1), height:ph.toFixed(1), rx:(ph / 2).toFixed(1), fill:'#fff'}));
          const t = sv('text', {x:(ox + fs * .6).toFixed(1), y:(oy + ph * .68).toFixed(1), 'font-size':fs, 'font-weight':600, fill:ink}, d);
          if (cnt) t.append(sv('tspan', {'font-weight':400, dx:fs * .45}, n));
          chip.append(t); g.append(chip); done = true; break; }
          if (done) break; }
        if (done) break; }
    });
  });
}
/* Hovering a task's tile lifts it into a card and plays its runs (owner, 2026-10-10): the card grows from the tile to
   1.7 times its size (at least 260 px wide, kept inside the map), its illustration goes under a 70% veil of the domain
   hue while the rest of the map fades under a 60% white veil, and each run's best development score so far draws itself as a white step line from the first to the last
   submission (spending on x, 0 to 100 on y), then holds; with several runs they follow in a
   loop. White words only: the task's name at the top left, the model of the run on screen at the bottom right (owner,
   2026-10-10). Clicking the card opens the task page. Mouse only; reduced motion shows the card and each line at once. */
const mapTip = $('#maptip');
let play = null;
function stopPlay() { if (!play) return; clearTimeout(play.t); play.g.remove(); play = null; }
function startPlay(tile) {
  const s = tile.dataset.s, k = tile.dataset.k, runs = TRAJ.filter(r => r[1] === s && r[6].length), svg = $('#mapsvg');
  const [tx, ty, tw, th] = ['x', 'y', 'width', 'height'].map(a => +tile.getAttribute(a)), [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
  const w = Math.min(W - 8, Math.max(260, tw * 1.7)), h = w / 1.5, x = Math.min(W - w - 4, Math.max(4, tx + tw / 2 - w / 2)), y = Math.min(H - h - 4, Math.max(4, ty + th / 2 - h / 2));
  const root = sv('g', {class:'play', style:'cursor:pointer'}), card = sv('g'), cid = 'playclip';
  // the rest of the map fades behind the card; the veil lets the pointer through to the other tiles
  const mute = sv('rect', {x:0, y:0, width:W, height:H, fill:'#fff', opacity:calm ? .6 : 0, 'pointer-events':'none'});
  card.innerHTML = `<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" filter="drop-shadow(0 6px 16px rgba(32,33,36,.35))"/>`
    + `<g clip-path="url(#${cid})">${taskArt(s, k).replace('<svg class="art"', `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"`)}`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ART_FIELD[k]}" opacity="${runs.length ? .7 : .35}"/></g>`;
  const who = sv('text', {x:x + w - 14, y:y + h - 14, 'text-anchor':'end', 'font-size':14, 'font-weight':600, fill:'#fff'});
  card.append(sv('text', {x:x + 14, y:y + 26, 'font-size':14, 'font-weight':600, fill:'#fff'}, s), who);
  root.append(mute, card); svg.append(root);
  card.style.transformOrigin = `${x + w / 2}px ${y + h / 2}px`;
  if (!calm) {
    mute.animate([{opacity:0}, {opacity:.6}], {duration:220, fill:'forwards'});
    card.animate([{transform:`translate(${tx + tw / 2 - x - w / 2}px,${ty + th / 2 - y - h / 2}px) scale(${tw / w})`, opacity:.6}, {transform:'none', opacity:1}],
      {duration:220, easing:'cubic-bezier(.2,0,0,1)', fill:'forwards'});
  }
  play = {tile, g:root, card, who, runs, k:0, x, y, w, h};
  if (runs.length) play.t = setTimeout(showRun, calm ? 0 : 200);
}
function showRun() {
  const p = play, [m, , , , end, , seq] = p.runs[p.k], n = p.runs.length;
  const PL = 24, PR = 24, PT = 44, PB = 44, sw = 4;
  const x0 = seq[0][0], x1 = Math.max(end, ...seq.map(q => q[0]));
  const X = v => p.x + PL + (v - x0) / (x1 - x0 || 1) * (p.w - PL - PR), Y = v => p.y + PT + (1 - v / 100) * (p.h - PT - PB);
  let best = -1, d = '';
  seq.forEach(([u, v], i) => { best = Math.max(best, v); d += i ? `H${X(u).toFixed(1)}V${Y(best).toFixed(1)}` : `M${X(u).toFixed(1)},${Y(best).toFixed(1)}`; });
  d += `H${X(x1).toFixed(1)}`;
  const line = sv('g', {class:'pline'}), path = sv('path', {d, pathLength:1, fill:'none', stroke:'#fff', 'stroke-width':sw, 'stroke-linejoin':'round', 'stroke-linecap':'round'});
  const dot = sv('circle', {cx:X(x1), cy:Y(best), r:6.5, fill:'#fff', opacity:calm ? 1 : 0});
  line.append(path, dot); p.card.querySelector('.pline')?.remove(); p.card.append(line);
  p.who.textContent = MNAME[m];
  const draw = calm ? 0 : 1100, hold = 1300;
  if (!calm) {
    path.setAttribute('stroke-dasharray', '1 1');
    path.animate([{strokeDashoffset:1}, {strokeDashoffset:0}], {duration:draw, easing:'cubic-bezier(.6,0,.3,1)', fill:'forwards'});
    dot.animate([{opacity:0}, {opacity:1}], {duration:200, delay:draw - 100, fill:'forwards'});
  }
  if (n > 1) p.t = setTimeout(() => {
    const go = () => { if (play !== p) return; p.k = (p.k + 1) % n; showRun(); };
    if (calm) go(); else line.animate([{opacity:1}, {opacity:0}], {duration:250, fill:'forwards'}).onfinish = go;
  }, draw + hold);
}
$('#mapsvg').addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') { mapTip.hidden = true; return; }
  if (play && e.target.closest('.play')) { mapTip.hidden = true; return; }   // the card stays while the pointer is on it
  const g = e.target.closest('.blk'), tile = e.target.closest('svg.tile');
  if (!play || play.tile !== tile) { stopPlay(); if (tile) startPlay(tile); }
  if (!g || tile) { mapTip.hidden = true; return; }
  const d = g.dataset.d, r = $('#map').getBoundingClientRect();
  mapTip.innerHTML = `<b>${esc(d)}</b><br>${N_IN(d)} task${N_IN(d) > 1 ? 's' : ''}${nRan(d) ? ` · ${nRan(d)} with runs` : ''}`;
  mapTip.hidden = false; mapTip.style.left = (e.clientX - r.left) + 'px'; mapTip.style.top = (e.clientY - r.top) + 'px'; });
$('#mapsvg').addEventListener('pointerleave', () => { mapTip.hidden = true; stopPlay(); });
$('#mapsvg').addEventListener('click', e => { if (play && e.target.closest('.play')) location.href = taskHref(play.tile.dataset.s); });

function drawRows() {
  const h = hits(); $('#cnt').textContent = `${h.length} task${h.length === 1 ? '' : 's'}`; $('#fcount').textContent = picked.size ? `(${picked.size})` : '';
  $('#rows').innerHTML = h.slice(0, limit).map(t => `<article class="row" data-s="${esc(t.s)}"><div class="meta"><span class="tag">${esc(t.d)}</span>${RAN.has(t.s) ? '<span class="ran"><i></i>Has runs</span>' : ''}</div>
    <h3><a class="stretch" href="${esc(taskHref(t.s))}">${esc(t.s)}</a></h3>${t.t ? `<p>${esc(t.t)}</p>` : ''}<div class="lk">${t.p ? `<a href="${esc(t.p)}" target="_blank" rel="noopener">Paper</a>` : '<span>No paper link</span>'}${t.r ? `<a href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : ''}</div></article>`).join('')
    || `<p class="empty">No task matches. Clear the filter or try another word.</p>`;
  $('#showmore').hidden = h.length <= limit;
  $('#showmore').textContent = `Show more (${h.length - limit} left)`;
}

/* Beside the title (under it on narrow screens): the first pages of the tasks' papers laid on a tilted plane, in columns that drift up and down and
   loop (owner, 2026-10-10: version A of five 3D sketches). Pages come from assets/img/fcs2-papers/<slug>.webp (first
   page of the arXiv PDF, 320 px wide); a task without one is left out. Each page links to its task; hovering pauses the
   wall and lifts the page; reduced motion keeps it still. The wall is decorative for assistive technology (the task
   list below carries the same links). */
function drawPapers() {
  const have = new Set(window.PAPER_IMGS || []), ts = TASKS.filter(t => have.has(slug(t.s))), box = $('#papers');
  if (!ts.length) { box.hidden = true; return; }
  const narrow = box.clientWidth < 640, cols = box.clientWidth < 800 ? 7 : 11, pw = narrow ? 110 : 150, gap = narrow ? 12 : 18;
  const card = t => `<a class="pg" href="${esc(taskHref(t.s))}" tabindex="-1"><img src="${PAPER_DIR}${slug(t.s)}.webp" alt="" decoding="async" width="150" height="194"></a>`;
  let h = '';
  for (let c = 0; c < cols; c++) {
    let own = ts.filter((t, i) => i % cols === c); while (own.length < 8) own = own.concat(own);   // tall enough to cover the frame
    const list = own.map(card).join('');
    h += `<div class="pcol${c % 2 ? ' dn' : ''}" style="left:${(c - cols / 2) * (pw + gap)}px;top:${-(own.length * (pw * 1.3 + gap)) / 2 + (c % 3) * 40}px;animation-duration:${44 + (c % 4) * 7}s">${list}${list}</div>`;
  }
  $('#pplane').innerHTML = h;
}
drawPapers();
drawPassCost(); drawTable(); drawLB(); drawECI(); drawTTS(); drawMap(); drawRows();
// labels are placed by measured text width, so draw again once the web font has loaded and the widths are final
if (document.fonts) document.fonts.ready.then(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); drawPapers(); redraws.forEach(f => f()); }, 120); });
