// FrontierCS 2 overview page (index.md): leaderboard charts, the rotating example run, the task map and task index.
// Data and shared helpers are in fcs2-data.js, loaded first; assets/css/fcs2.css holds the styles.
/* numbers in the page text come from the data, so they cannot drift from the chart */
document.querySelectorAll('[data-fill]').forEach(el => { el.textContent = {updated:`Last updated: ${UPDATED}`, runs:String(RUNS.length),
  runtasks:`on ${NTASK(RUNS)} tasks`, models:`${MODELS.length} models from ${new Set(MODELS.map(m => m.lab)).size} labs have run so far.`,
  summary:`${RUNS.length} runs on ${NTASK(RUNS)} tasks by ${MODELS.length} models`, nruns:`${RUNS.length} runs`}[el.dataset.fill]; });
// Bring a tab into view inside its own horizontal strip only. scrollIntoView would also scroll the page,
// which fought the reader's scrolling whenever the section spy fired.
const reveal = el => { const p = el.parentElement, pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
  if (er.left < pr.left) p.scrollLeft += er.left - pr.left - 16; else if (er.right > pr.right) p.scrollLeft += er.right - pr.right + 16; };

/* ---------- sub-nav scrollspy ---------- */
const subLinks = [...document.querySelectorAll('#subnav a')];
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) {
  subLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  const on = subLinks.find(a => a.classList.contains('on')); on && reveal(on); } }), {rootMargin:'-45% 0px -50% 0px'});
['overview','leaderboard','cases','tasks','questions'].forEach(id => spy.observe(document.getElementById(id)));

/* ---------- leaderboard chart ---------- */
let group = 'model', dom = 'All', showRuns = true;
const DOMS_WITH_RUNS = DOMAINS.filter(d => RUNS.some(r => r.d === d));
$('#domradios').innerHTML = ['All', ...DOMS_WITH_RUNS].map(d => `<label><input type="radio" name="dom" value="${esc(d)}" ${d === 'All' ? 'checked' : ''}>${d === 'All' ? 'All domains' : esc(d)}<span class="n num">${RUNS.filter(r => d === 'All' || r.d === d).length}</span></label>`).join('');
$('#domradios').addEventListener('change', e => { dom = e.target.value; drawLB(); });
$('#groupby').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; group = b.dataset.g;
  [...$('#groupby').children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); drawLB(); });
$('#showruns').addEventListener('change', e => { showRuns = e.target.checked; drawLB(); });
$('#custom').addEventListener('click', () => { const s = $('#settings'); const o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#custom').setAttribute('aria-expanded', String(o)); });
$('#lblegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* Main chart: pass rate against mean cost per run in US$, one dot per model (PASS, COST). Each label takes the first
   spot right, left, above or below its dot that clears every dot, every placed label and the edges; a dot with no free
   spot keeps no label (the legend and the tooltip still name it). */
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
    // right, left, above, below, then the four diagonals; the first spot clear of every dot and placed label wins
    const spots = [[cx + 12, cy + 4.5, 'start'], [cx - 12, cy + 4.5, 'end'], [cx, cy - 13, 'middle'], [cx, cy + 22, 'middle'],
      [cx + 8, cy - 11, 'start'], [cx - 8, cy - 11, 'end'], [cx + 8, cy + 20, 'start'], [cx - 8, cy + 20, 'end']];
    const box = ([x, y, an]) => ({x:an === 'start' ? x : an === 'end' ? x - w : x - w / 2, y:y - 12, w, h:16});
    const hit = q => boxes.some(o => q.x < o.x + o.w && o.x < q.x + q.w && q.y < o.y + o.h && o.y < q.y + q.h) || q.x < L || q.x + q.w > W || q.y < 0;
    const spot = spots.find(sp => !hit(box(sp)));
    if (spot) { boxes.push(box(spot)); lab.setAttribute('x', spot[0]); lab.setAttribute('y', spot[1]); lab.setAttribute('text-anchor', spot[2]); }
    else lab.remove();
    const [pct, np, n] = PASS[m.id];
    pts.push({x:cx, y:cy, mean:true, html:`<b>${esc(m.name)}</b><br>Pass rate <b>${f1(pct)}%</b>, ${np} of ${n} runs pass<br>${usdfmt(COST[m.id][0])} per run, mean of ${COST[m.id][1]} runs`});
  });
  attachTip(svg, W, H, pts, $('#pctip'));
}
$('#pclegend').innerHTML = [...MODELS].sort((a, b) => PASS[b.id][0] - PASS[a.id][0]).map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* FECI: one row per model ranked by ECI, its 90% interval as a bar. */
function drawECI() {
  const order = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
  const svg = $('#ecisvg'), W = Math.max(300, $('#eciplot').clientWidth), narrow = W < 560;
  const L = narrow ? 112 : 190, R = 34, T = 14, B = 46, lane = narrow ? 56 : 64;
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
    const mine = RUNS.filter(r => r.m === m.id);
    pts.push({x:X(e), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(e)}</b><br>90% interval ${Math.round(lo)}–${Math.round(hi)}<br>${mine.length} runs on ${NTASK(mine)} tasks`});
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

/* Overview: an example run, rotating. Left: the task's domain, name (a link to its page) and paper. Right, in Epoch's
   data-insight grammar (owner, 2026-10-09: like Epoch AI): the legend row on top, the axis title above, a light grid,
   the run's development score at each submission as a line with dots against what it had spent, the authors' code as
   a dashed line, the final score as a ringed dot at the run's last dollar with an in-chart note and a curved arrow, and
   the source note and wordmark below. Each new run draws itself from left to right; runs follow in order every 7 s,
   the dots below jump to one, hovering or focusing pauses, and reduced motion shows the line at once. The pool keeps
   clean, rising traces only (owner, 2026-10-09: no ugly traces): the task has a description; the run has at most 15
   submissions, at least 4 valid ones (score above 0) and no failed one after its first valid one; its score rises by
   15 points or more (from 0 if it opened with failed submissions, else from its first score), never drops by more
   than 5, and ends within 5% of its best; its final score is at least the authors' code. */
function cleanTrace([, task, fin, , , , seq]) {
  const ys = seq.map(p => p[1]), k = ys.findIndex(v => v > 0);
  if (k < 0 || ys.length > 15) return false;
  const body = ys.slice(k), best = Math.max(...body);
  return body.length >= 4 && !body.includes(0) && best - (k ? 0 : body[0]) >= 15
    && body.every((v, i) => !i || body[i - 1] - v <= 5) && body[body.length - 1] >= .95 * best
    && (REF[task] == null || fin >= REF[task]);
}
const RUNPOOL = TRAJ.filter(r => DESC[r[1]] && cleanTrace(r));
const TASK_OF = Object.fromEntries(TASKS.map(t => [t.s, t]));
let runIx = -1, runTimer = null, runHold = false, runAnim = 0;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
function runPick(k) {
  runIx = k == null ? (runIx + 1) % RUNPOOL.length : k;
  const box = $('#example');
  if (calm) { drawExample(false); return; }
  box.classList.add('fade'); setTimeout(() => { drawExample(true); box.classList.remove('fade'); }, 200);
}
function drawExample(animate) {
  if (runIx < 0) return;
  const [m, task] = RUNPOOL[runIx], t = TASK_OF[task];
  $('#extag').textContent = t.d;
  const a = $('#exname'); a.textContent = task; a.href = taskHref(task);
  $('#expaper').textContent = t.t || '';
  $('#exlegend').innerHTML = `<span><i style="background:${MCOL[m]}"></i>${esc(MNAME[m])}</span>`
    + (REF[task] != null ? '<span><i class="dash"></i>Authors’ code</span>' : '');
  $('#exdots').innerHTML = RUNPOOL.map((r, i) => `<button type="button" class="${i === runIx ? 'on' : ''}" data-i="${i}" aria-label="Example ${i + 1} of ${RUNPOOL.length}: ${esc(MNAME[r[0]])} on ${esc(r[1])}"${i === runIx ? ' aria-current="true"' : ''}></button>`).join('');
  drawRun(animate);
}
function drawRun(animate) {
  const [m, task, fin, , end, , seq] = RUNPOOL[runIx], ref = REF[task], col = MCOL[m];
  const svg = $('#runsvg'), W = Math.max(280, $('#runplot').clientWidth), narrow = W < 520;
  const H = narrow ? 260 : 340, L = 34, R = narrow ? 14 : 24, T = 10, B = 46, x1 = Math.max(end, ...seq.map(p => p[0]));
  const X = v => L + v / x1 * (W - L - R), Y = v => T + (1 - v / 100) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= 100; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:v ? 'var(--grid)' : 'var(--line-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  // dollar ticks on a round step (1, 2 or 5 times a power of ten), about five across
  const raw = x1 / (narrow ? 3 : 5), p10 = 10 ** Math.floor(Math.log10(raw)), stp = [1, 2, 5, 10].map(f => f * p10).find(v => v >= raw);
  for (let v = 0; v <= x1 + 1e-9; v += stp) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(v)));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Spent so far in US$, estimated'));
  if (ref != null) svg.append(sv('line', {x1:L, x2:W - R, y1:Y(ref), y2:Y(ref), stroke:'var(--ink-2)', 'stroke-width':1.5, 'stroke-dasharray':'6 4'}));
  const clip = sv('clipPath', {id:'exclip'}), cr = sv('rect', {x:0, y:0, width:animate && !calm ? L : W, height:H});
  clip.append(cr); const defs = sv('defs'); defs.append(clip); svg.append(defs);
  const g = sv('g', {'clip-path':'url(#exclip)'}), pts = seq.map(([u, v]) => [X(u), Y(v)]);
  g.append(sv('path', {d:pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(''), fill:'none', stroke:col, 'stroke-width':2.5, 'stroke-linejoin':'round'}));
  pts.forEach(([x, y]) => g.append(sv('circle', {cx:x, cy:y, r:3.5, fill:col})));
  svg.append(g);
  // the final score: a ringed dot at the run's last dollar, an in-chart note and a curved arrow to it
  const endg = sv('g', {class:'exend' + (animate && !calm ? '' : ' on')}), fx = X(end), fy = Y(fin);
  const up = fin < 55, tx = fx - (narrow ? 34 : 64), ty = up ? fy - (narrow ? 58 : 72) : fy + (narrow ? 52 : 62);
  endg.append(sv('path', {d:`M${tx + 4},${ty + (up ? 10 : -22)}Q${fx - 6},${ty + (up ? 10 : -22)} ${fx - 3},${fy + (up ? -11 : 11)}`, fill:'none', stroke:'var(--ink-2)', 'stroke-width':1.2}));
  const ah = up ? [[fx - 3, fy - 9], [fx - 7.5, fy - 16], [fx + 1.5, fy - 15.5]] : [[fx - 3, fy + 9], [fx - 7.5, fy + 16], [fx + 1.5, fy + 15.5]];
  endg.append(sv('path', {d:`M${ah[0]}L${ah[1]}L${ah[2]}Z`, fill:'var(--ink-2)'}));
  endg.append(sv('circle', {cx:fx, cy:fy, r:6, fill:'#fff', stroke:col, 'stroke-width':2.5}));
  endg.append(sv('text', {class:'exnote halo', x:tx, y:ty + (up ? 0 : -12), 'text-anchor':'end'}, `Final score ${Math.round(fin)}`));
  svg.append(endg);
  if (animate && !calm) {
    const id = ++runAnim, t0 = performance.now(), dur = 1200, ease = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
    const step = now => { if (id !== runAnim) return; const u = Math.min(1, (now - t0) / dur);
      cr.setAttribute('width', (L + (W - L) * ease(u)).toFixed(1)); if (u < 1) requestAnimationFrame(step); else endg.classList.add('on'); };
    requestAnimationFrame(step);
  }
}

function drawLB() {
  const runs = RUNS.filter(r => dom === 'All' || r.d === dom);
  $('#nres').textContent = `${runs.length} run${runs.length === 1 ? '' : 's'}`;
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
  const L = narrow ? 112 : 190, R = 34, T = 8, B = 46;
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
    const short = name.length > maxc ? name.slice(0, maxc - 1).trimEnd() + '…' : name;
    const lab = sv('text', {class:'lab', x:0, y:y0 + h / 2 + (two ? -3 : 4)}, short);
    if (short !== r.label) lab.append(sv('title', {}, r.label));
    svg.append(lab);
    if (two) svg.append(sv('text', {x:0, y:y0 + h / 2 + 14, 'font-size':12}, r.sub));
    if (group === 'task') {
      const ms = r.items.map(i => mean(i.runs.map(x => x.s))), yc = y0 + h / 2;
      if (ms.length > 1) svg.append(sv('line', {x1:X(Math.min(...ms)), x2:X(Math.max(...ms)), y1:yc, y2:yc, stroke:'var(--line)', 'stroke-width':2}));
      r.items.forEach((it, k) => {
        svg.append(sv('circle', {cx:X(ms[k]), cy:yc, r:5.5, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':1.5}));
        pts.push({x:X(ms[k]), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(r.label)} · ${esc(r.sub)}<br>${it.runs.length > 1 ? `Mean <b>${f1(ms[k])}</b> over ${it.runs.length} runs` : `Final score <b>${f1(ms[k])}</b>`}`, mean:true});
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
      pts.push({x:X(mu), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>Mean <b>${f1(mu)}</b> over ${ss.length} run${ss.length > 1 ? 's' : ''} on ${NTASK(it.runs)} task${NTASK(it.runs) > 1 ? 's' : ''}`, mean:true});
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
function syncChecks() { [...$('#checks').querySelectorAll('input')].forEach(i => i.checked = picked.has(i.value)); $('#fcount').textContent = picked.size ? `(${picked.size})` : ''; }
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
$('#areas').innerHTML = AREAS.map(a => `<span><i style="background:${AFILL[a.k]}"></i>${esc(a.name)}</span>`).join('');
const nRan = d => TASKS.filter(t => t.d === d && RAN.has(t.s)).length;
function drawMap() {
  const svg = $('#mapsvg'), W = $('#map').clientWidth, narrow = W < 640, H = narrow ? Math.round(W * 1.15) : Math.round(W * 0.36);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const byArea = AREAS.map(a => ({a, n:a.d.reduce((s, d) => s + N_IN(d), 0)})).sort((p, q) => q.n - p.n), G = narrow ? 4 : 6, tol = .5;
  squarify(byArea.map(x => x.n), 0, 0, W, H).forEach((ar, k) => {
    const a = byArea[k].a, doms = [...a.d].sort((p, q) => N_IN(q) - N_IN(p));
    squarify(doms.map(N_IN), ...ar).forEach(([x, y, w, h], j) => {
      const d = doms[j], n = N_IN(d), on = picked.has(d);
      const x0 = x + (x > tol ? G / 2 : 0), y0 = y + (y > tol ? G / 2 : 0), x1 = x + w - (x + w < W - tol ? G / 2 : 0), y1 = y + h - (y + h < H - tol ? G / 2 : 0), bw = x1 - x0, bh = y1 - y0;
      const g = sv('g', {class:'blk', tabindex:0, role:'button', 'aria-pressed':String(on), 'aria-label':`${d}, ${n} task${n > 1 ? 's' : ''}`, 'data-d':d, opacity: picked.size && !on ? .32 : 1});
      g.append(sv('rect', {x:x0, y:y0, width:bw, height:bh, rx:narrow ? 6 : 8, fill:AFILL[a.k]}));
      svg.append(g);
      // label: the largest size at which some layout fits. Layouts: name over count, name on two lines over count,
      // name and count on one line, the same stood up along the left edge, the name alone stood up
      const ink = AINK[a.k], words = d.split(' '), sizes = narrow ? [20, 16, 13, 11, 9.5] : [30, 24, 19, 15, 12, 10.5];
      const meas = (str, fs, wt) => { const t = sv('text', {x:-999, y:-999, 'font-size':fs, 'font-weight':wt}, str); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
      const put = (str, x, y, fs, wt, rot) => g.append(sv('text', {x, y, 'font-size':fs, 'font-weight':wt, fill:ink, transform: rot ? `rotate(-90 ${x} ${y})` : null}, str));
      let done = false;
      for (const fs of sizes) {
        const pad = fs < 13 ? 6 : narrow ? 10 : 14, lh = fs * 1.15, nameW = meas(d, fs, 600), both = meas(`${d}  ${n}`, fs, 600);
        const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words.at(-1)] : null;
        const tx = x0 + pad, ty = y0 + pad + fs * .8;
        if (nameW + 2 * pad <= bw && lh * 2 + pad * 1.4 <= bh) { put(d, tx, ty, fs, 600); put(n, tx, ty + lh, fs, 400); done = true; }
        else if (lines && Math.max(...lines.map(l => meas(l, fs, 600))) + 2 * pad <= bw && lh * 3 + pad * 1.4 <= bh) { put(lines[0], tx, ty, fs, 600); put(lines[1], tx, ty + lh, fs, 600); put(n, tx, ty + 2 * lh, fs, 400); done = true; }
        else if (both + 2 * pad <= bw && lh + pad * 1.4 <= bh) { put(`${d}  ${n}`, tx, ty, fs, 600); done = true; }
        else if (both + 2 * pad <= bh && fs + 2 * pad <= bw) { put(`${d}  ${n}`, x0 + pad + fs * .8, y1 - pad, fs, 600, true); done = true; }
        else if (fs === sizes.at(-1) && nameW + 8 <= bh && fs + 6 <= bw) { put(d, x0 + 3 + fs * .8, y1 - 4, fs, 600, true); done = true; }
        if (done) break;
      }
    });
  });
}
const mapTip = $('#maptip');
$('#mapsvg').addEventListener('pointermove', e => { const g = e.target.closest('.blk'); if (!g || e.pointerType !== 'mouse') { mapTip.hidden = true; return; }
  const d = g.dataset.d, r = $('#map').getBoundingClientRect();
  mapTip.innerHTML = `<b>${esc(d)}</b><br>${N_IN(d)} task${N_IN(d) > 1 ? 's' : ''}${nRan(d) ? ` · ${nRan(d)} with runs` : ''}`;
  mapTip.hidden = false; mapTip.style.left = (e.clientX - r.left) + 'px'; mapTip.style.top = (e.clientY - r.top) + 'px'; });
$('#mapsvg').addEventListener('pointerleave', () => { mapTip.hidden = true; });
const pickDom = d => { picked.has(d) ? picked.delete(d) : picked.add(d); syncChecks(); limit = 5; drawRows(); };
$('#mapsvg').addEventListener('click', e => { const g = e.target.closest('.blk'); if (g) pickDom(g.dataset.d); });
$('#mapsvg').addEventListener('keydown', e => { const g = e.target.closest('.blk'); if (g && (e.key === 'Enter' || e.key === ' ')) { const d = g.dataset.d; pickDom(d); $(`#mapsvg .blk[data-d="${CSS.escape(d)}"]`).focus(); e.preventDefault(); } });

function drawRows() {
  drawMap();
  $('#tzhint').textContent = picked.size ? `${[...picked].join(', ')} selected. Select again to clear.` : 'Select a domain to filter the list';
  const h = hits(); $('#cnt').textContent = `${h.length} task${h.length === 1 ? '' : 's'}`; $('#fcount').textContent = picked.size ? `(${picked.size})` : '';
  $('#rows').innerHTML = h.slice(0, limit).map(t => `<article class="row" data-s="${esc(t.s)}"><div class="meta"><span class="tag">${esc(t.d)}</span>${RAN.has(t.s) ? '<span class="ran"><i></i>Has runs</span>' : ''}</div>
    <h3><a class="stretch" href="${esc(taskHref(t.s))}">${esc(t.s)}</a></h3>${t.t ? `<p>${esc(t.t)}</p>` : ''}<div class="lk">${t.p ? `<a href="${esc(t.p)}" target="_blank" rel="noopener">Paper</a>` : '<span>No paper link</span>'}${t.r ? `<a href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : ''}</div></article>`).join('')
    || `<p class="empty">No task matches. Clear the filter or try another word.</p>`;
  $('#showmore').hidden = h.length <= limit;
  $('#showmore').textContent = `Show more (${h.length - limit} left)`;
}

drawPassCost(); drawTable(); drawLB(); drawECI(); drawTTS(); drawRows(); runPick(Math.floor(Math.random() * RUNPOOL.length));
// labels are placed by measured text width, so draw again once the web font has loaded and the widths are final
if (document.fonts) document.fonts.ready.then(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); drawExample(false); });
const rotate = () => { clearInterval(runTimer); runTimer = calm ? null : setInterval(() => { if (!runHold && !document.hidden) runPick(); }, 7000); };
$('#exdots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { runPick(+b.dataset.i); rotate(); } }); rotate();
['pointerenter', 'focusin'].forEach(e => $('#example').addEventListener(e, () => runHold = true));
['pointerleave', 'focusout'].forEach(e => $('#example').addEventListener(e, () => runHold = false));
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); drawExample(false); redraws.forEach(f => f()); }, 120); });
