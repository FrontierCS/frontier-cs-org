// FrontierCS 2 overview page (index.md): leaderboard charts, the task map (whose tiles play their runs on hover) and task index.
// Data and shared helpers are in fcs2-data.js, loaded first; assets/css/fcs2.css holds the styles.
/* numbers in the page text come from the data, so they cannot drift from the chart */
document.querySelectorAll('[data-fill]').forEach(el => { el.textContent = {updated:`Last updated: ${UPDATED}`, runs:String(RUNS.length),
  runtasks:`on ${NTASK(RUNS)} tasks`, models:`${MODELS.length} models from ${new Set(MODELS.map(m => m.lab)).size} labs have run so far.`,
  summary:`${RUNS.length} runs on ${NTASK(RUNS)} tasks by ${MODELS.length} models`,
  ntasks:String(TASKS.length), ndomains:String(new Set(TASKS.map(t => t.d)).size), dmax:fe(Math.max(...Object.values(FDI))), zero:tick(ECI_LOW_VALUE), cunit:DIFF_FIT.c.toFixed(1)}[el.dataset.fill]; });
// Bring a tab into view inside its own horizontal strip only. scrollIntoView would also scroll the page,
// which fought the reader's scrolling whenever the section spy fired.
const reveal = el => { const p = el.parentElement, pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
  if (er.left < pr.left) p.scrollLeft += er.left - pr.left - 16; else if (er.right > pr.right) p.scrollLeft += er.right - pr.right + 16; };

/* ---------- sub-nav scrollspy ---------- */
const subLinks = [...document.querySelectorAll('#subnav a')];
// The section on screen is the last one whose top has passed just under the sticky bar; at the page's end, the last section.
// (A band in mid-screen picked the next section whenever a short one, like the case-studies placeholder, sat at the top.)
const SECS = ['overview','leaderboard','tasks','cases','private','sponsors','questions'].map(id => document.getElementById(id));
let spyRaf = 0;
const spy = () => { spyRaf = 0;
  const bar = $('.sub').getBoundingClientRect().bottom + 24, end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const cur = end ? SECS[SECS.length - 1] : SECS.filter(e => e.getBoundingClientRect().top <= bar).pop() || SECS[0];
  subLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
  const on = subLinks.find(a => a.classList.contains('on')); on && reveal(on); };
addEventListener('scroll', () => { spyRaf ||= requestAnimationFrame(spy); }, {passive:true}); spy();

/* ---------- scroll-in animation ----------
   The mean-score, FCI and test-time scaling charts play once when they first come into view (owner, 2026-10-11): bars
   grow from 0, run dots appear one after another and then the mean (owner, 2026-10-11), curves are uncovered left to right.
   A chart starts once 65% of it is on screen, or, if it is taller than that, once it fills 65% of the window (owner: 30% was too early). A chart drawn again later (resize,
   fonts) is drawn still. Off with reduced motion, without IntersectionObserver, and for the thread cards (CHART_H). */
const shown = new Set(), moving = !matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window && !window.CHART_H;
const io = moving && new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting || (e.intersectionRatio < .65 && e.intersectionRect.height < innerHeight * .65)) return;
  const svg = e.target; io.unobserve(svg); shown.add(svg.id); svg.getBoundingClientRect();
  requestAnimationFrame(() => requestAnimationFrame(() => { svg.classList.remove('pre'); svg.dispatchEvent(new Event('shown')); })); }), {threshold:[...Array(21).keys()].map(k => k / 20)});
// whether this draw of the chart animates; call before drawing its children
const animates = svg => { const on = moving && !shown.has(svg.id); svg.classList.toggle('anim', on); svg.classList.toggle('pre', on); if (on) io.observe(svg); return on; };
// mark an element: kind a-bar | a-wipe | a-fade | a-pop | a-draw (a path with pathLength 1), delay in s, dx a start offset in px (unused for now)
const mark = (el, kind, d = 0, dx = 0) => { el.classList.add(kind); el.style.setProperty('--d', d.toFixed(2) + 's'); if (dx) el.style.setProperty('--dx', dx.toFixed(1) + 'px'); return el; };

/* ---------- leaderboard chart ---------- */
// Chart heights the page can override (bin/fcs2_thread_cards.py sets them to fit its 16:9 cards); the page itself sets none.
const CHART_H = window.CHART_H || {};
let group = 'model', dom = 'All', showRuns = true;
const DOMS_WITH_RUNS = DOMAINS.filter(d => RUNS.some(r => r.d === d));
$('#domradios').innerHTML = ['All', ...DOMS_WITH_RUNS].map(d => `<label><input type="radio" name="dom" value="${esc(d)}" ${d === 'All' ? 'checked' : ''}>${d === 'All' ? 'All domains' : esc(d)}</label>`).join('');
$('#domradios').addEventListener('change', e => { dom = e.target.value; drawLB(); });
$('#groupby').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; group = b.dataset.g;
  [...$('#groupby').children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); drawLB(); });
$('#showruns').addEventListener('change', e => { showRuns = e.target.checked; drawLB(); });
$('#custom').addEventListener('click', () => { const s = $('#settings'); const o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#custom').setAttribute('aria-expanded', String(o)); });
$('#lblegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* Main chart: pass rate against mean cost per run in US$, one dot per model (PASS, COST); the dots on the Pareto frontier are emphasised. Each label takes the first
   spot right, left, above or below its dot that clears every dot, every placed label and the edges; a dot with no free
   spot keeps no label (the tooltip still names it). No legend: the labels name the dots. */
const passPct = m => PASS[m.id][0];   // pass rate in %; both leaderboard charts show it alone (owner, 2026-10-16: no FCI switch)
function drawPassCost() {
  const svg = $('#pcsvg'), W = Math.max(300, $('#pcplot').clientWidth), narrow = W < 560;
  const L = 44, R = narrow ? 12 : 24, T = 14, B = 46, H = CHART_H.pc || (narrow ? 320 : 400);
  const ms = MODELS.filter(m => COST[m.id]), tx = ms.map(m => COST[m.id][0]);
  // the axis runs 0.15 decade past the outermost dots and no further (owner, 2026-10-10: half-decade rounding left
  // the range loose); an edge dot whose label has no room on its outer side takes another spot
  // (on phones the right side keeps more, so the labels of the dots near the right edge fit on their right)
  const x0 = Math.log10(Math.min(...tx)) - .15, x1 = Math.log10(Math.max(...tx)) + (narrow ? .74 : .15);
  const val = passPct, ystep = 20, ymax = Math.min(100, Math.ceil((Math.max(...ms.map(val)) + 5) / 20) * 20);
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= ymax + ystep / 2; v += ystep) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v + '%'));
  }
  // ticks at 1, 2 and 5 times each power of ten; a range under one decade still gets several
  for (let k = Math.floor(x0); k <= Math.ceil(x1); k++) [1, 2, 5].forEach(f => { const v = f * 10 ** k, lv = Math.log10(v);
    if (lv < x0 - 1e-9 || lv > x1 + 1e-9 || (narrow && f !== 1 && x1 - x0 > 2.5) || (narrow && f === 2 && x1 - x0 > 1.5)) return;   // phones: over 2.5 decades, powers of ten only, so labels do not crowd
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(v))); });
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost per run in US$, mean, log scale'));
  const pts = [], order = [...ms].sort((a, b) => val(b) - val(a));
  const at = m => [X(COST[m.id][0]), Y(Math.max(0, val(m)))];
  const boxes = order.map(m => { const [cx, cy] = at(m); return {x:cx - 9, y:cy - 9, w:18, h:18}; });
  // the Pareto frontier: the models no cheaper model matches or beats on pass rate
  const front = [...ms].sort((p, q) => COST[p.id][0] - COST[q.id][0] || val(q) - val(p)).filter((m, i, a) => a.slice(0, i).every(o => val(o) < val(m)));
  order.forEach(m => {
    const [cx, cy] = at(m), name = narrow ? m.short : m.name;
    // the frontier reads from the names, with no line: a model on it has a bold name, a model under it a regular name;
    // every dot is the same size, at full colour (owner, 2026-10-13: keep the chart clean; 2026-10-16: one dot size)
    const lead = front.includes(m);
    svg.append(sv('circle', {cx, cy, r:6.5, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2, 'data-m':m.id}));   // one dot size for every model (owner, 2026-10-16); the frontier keeps its bold names
    labelDot(svg, boxes, cx, cy, name, {l:L, r:W, t:T, b:H - B}, MTXT(m.id), lead);   // fcs2-data.js
    pts.push({x:cx, y:cy, mean:true, html:`<b>${esc(m.name)}</b><br>Pass rate <b>${f1(val(m))}%</b><br>${usdfmt(COST[m.id][0])} per run, mean`});
  });
  attachTip(svg, W, H, pts, $('#pctip'));
}

/* On phones the model column is as wide as the longest model name, so every name shows in full (owner: "DeepSeek V4.1 Flash", not cut). */
const nameCol = svg => { svg.replaceChildren(); const w = Math.max(...MODELS.map(m => { const t = sv('text', {class:'lab', x:-999, y:-999}, m.short); svg.append(t); return t.getComputedTextLength(); })); svg.replaceChildren(); return Math.max(112, Math.ceil(w) + 12); };

/* Pass rate as bars, first in the leaderboard (owner, 2026-10-16, after Artificial Analysis's index charts): one column per
   model, highest first, in the model's colour with rounded top corners; the pass rate as a whole number in the middle of
   the bar, the exact value in the tooltip; under each bar the lab's logo on a light tile, the name and the harness.
   Dashed grid lines, no axis numbers: the bars carry them. */
const LOGO = {OpenAI:'openai', Anthropic:'anthropic', Google:'google', Meta:'meta', Kimi:'kimi', DeepSeek:'deepseek', 'Z.ai':'zai', Qwen:'qwen'};
const LOGO_DIR = (document.querySelector('script[src*="fcs2.js"]') || {src:''}).src.replace(/js\/fcs2\.js.*$/, 'img/models/');
const lightCol = id => { const h = getComputedStyle(document.documentElement).getPropertyValue(`--m-${id}`).trim().replace('#', '');
  if (h.length !== 6) return false; const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return .2126 * r + .7152 * g + .0722 * b > .6; };   // white as Artificial Analysis has it, dark ink only on the lightest (Sol's grey, GLM Flash's pink)
function drawPassBars() {
  const val = passPct, order = [...MODELS].sort((a, b) => val(b) - val(a));
  const svg = $('#fcibsvg'), W = Math.max(300, $('#fcibplot').clientWidth), an = animates(svg);
  svg.setAttribute('viewBox', `0 0 ${W} 10`); svg.replaceChildren();
  const measure = (txt, size, cls = 'lab') => { const t = sv('text', {class:cls, x:-999, y:-999, 'font-size':size}, txt); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
  // second style (owner, 2026-10-16): the value large in the middle of its bar, the logo on a light tile, and under it the
  // name and, in grey, the harness, both upright and wrapped to the column; where the columns are too narrow for upright
  // names (phones), the name alone, slanted
  const R = 4, T = 10, band0 = (W - 8) / order.length, flat = band0 >= 72, fs = flat ? 14 : 11, ang = 55, cos = Math.cos(ang * Math.PI / 180);
  const wrap = (txt, size, maxw) => txt.split(' ').reduce((ls, w) => { const l = ls[ls.length - 1]; if (l && measure(l + ' ' + w, size) <= maxw) ls[ls.length - 1] = l + ' ' + w; else ls.push(w); return ls; }, []);
  const tile = flat ? 34 : 22, lead = fs * 1.3;
  let L = 4, B;
  if (flat) {
    const lines = order.map(m => [wrap(m.name, fs, band0 - 8), m.h ? wrap(`(${m.h})`, fs - 1, band0 - 8) : []]);
    order.forEach((m, k) => { m._nl = lines[k]; });
    B = 14 + tile + 12 + Math.max(...lines.map(([a, b]) => a.length + b.length)) * lead + 6;
  } else {
    const lens = order.map(m => measure(m.short, fs));
    const over = l => Math.max(0, ...lens.map((n, k) => n * cos - fs * .35 - (W - l - R) / order.length * (k + .5) + 2));
    for (let k = 0; k < 3; k++) L = 4 + over(L);
    B = 10 + tile + 10 + Math.max(...lens) * Math.sin(ang * Math.PI / 180) + 8;
  }
  const PH = CHART_H.fcib || (flat ? 320 : 220), H = T + PH + B;
  const top = Math.max(...order.map(val)), step = eciStep(top, 4), ymax = top * 1.06;   // the tallest bar near the top: no axis numbers to round to
  const band = (W - L - R) / order.length, bw = Math.min(96, band * .76), base = T + PH, Y = v => T + (1 - Math.max(0, v) / ymax) * PH;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H);
  for (let v = step; v <= ymax; v += step) svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1, 'stroke-dasharray':'4 4'}));
  svg.append(sv('line', {x1:L, x2:W - R, y1:base, y2:base, stroke:'var(--ink-2)', 'stroke-width':1}));
  const pts = [], vs = flat ? 26 : 13;   // the value's size
  order.forEach((m, i) => {
    const e = val(m), cx = L + band * (i + .5), x = cx - bw / 2, y = Y(e), h = base - y, r = Math.min(6, bw / 6, h);
    const bar = sv('path', {d:`M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${base}Z`, fill:MCOL[m.id], 'data-m':m.id});
    const inside = h > vs * 1.8, vtx = sv('text', {x:cx, y:inside ? y + h / 2 + vs * .36 : y - 8, 'text-anchor':'middle', 'font-size':inside ? vs : Math.round(vs * .75), 'font-weight':600,
      fill:inside ? (lightCol(m.id) ? 'var(--ink)' : '#fff') : 'var(--ink)'}, String(Math.round(e)));
    svg.append(bar, vtx);
    const ty = base + (flat ? 14 : 10);
    svg.append(sv('rect', {x:cx - tile / 2, y:ty, width:tile, height:tile, rx:tile * .2, fill:'#f1f3f4'}));
    if (LOGO[m.lab]) { const lg = tile * .58; svg.append(sv('image', {href:LOGO_DIR + LOGO[m.lab] + '.svg', x:cx - lg / 2, y:ty + (tile - lg) / 2, width:lg, height:lg})); }
    if (flat) {
      const [nl, hl] = m._nl; let ly = ty + tile + 12 + fs;
      nl.forEach(l => { svg.append(sv('text', {class:'lab', x:cx, y:ly, 'font-size':fs, 'text-anchor':'middle', fill:'var(--ink)'}, l)); ly += lead; });
      hl.forEach(l => { svg.append(sv('text', {x:cx, y:ly, 'font-size':fs - 1, 'text-anchor':'middle', fill:'var(--muted)'}, l)); ly += lead; });
    } else {
      const ny = ty + tile + 12;
      svg.append(sv('text', {class:'lab', x:cx + fs * .35, y:ny, 'font-size':fs, 'text-anchor':'end', transform:`rotate(${-ang} ${cx + fs * .35} ${ny})`}, m.short));
    }
    if (an) { mark(bar, 'a-rise', i * .05); mark(vtx, 'a-fade', .5 + i * .05); }
    pts.push({x:cx, y, box:[cx - band / 2, cx + band / 2, T, H], html:`<b>${esc(m.name)}</b>${m.h ? ` · ${esc(m.h)}` : ''}<br>Pass rate <b>${f1(e)}%</b>`});   // the whole column, bar, logo and name, shows the tooltip
  });
  attachTip(svg, W, H, pts, $('#fcibtip'));
}

/* FCI: one row per model ranked by ECI, a bar from 0 (Kimi K2.7) to its FCI and its 90% interval as a whisker. */
function drawECI() {
  const order = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
  const svg = $('#ecisvg'), W = Math.max(300, $('#eciplot').clientWidth), narrow = W < 560;
  const L = narrow ? nameCol(svg) : 190, R = 34, T = 14, B = 46, lane = CHART_H.eciLane || (narrow ? 56 : 64);
  // the axis holds 0 and every whisker, on a grid of about six steps (four on phones) whatever the scale's unit
  const bot = Math.min(0, ...MODELS.map(m => ECI[m.id][1])), top = Math.max(...MODELS.map(m => ECI[m.id][2])), step = eciStep(top - bot, narrow ? 4 : 6);
  const xmin = Math.floor(bot / step) * step, xmax = Math.ceil(top / step) * step;
  const H = T + order.length * lane + B, an = animates(svg), bh = narrow ? 24 : 28;   // bars near half the lane (owner, 2026-10-14: 18 px read too thin)
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const X = v => L + (v - xmin) / (xmax - xmin) * (W - L - R);
  for (let i = 0, v = xmin; v <= xmax + step / 2; v = xmin + ++i * step) {   // the 0 line, Kimi K2.7, is darker when the axis runs below it
    const zero = xmin < 0 && Math.abs(v) < step / 2;
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:zero ? 'var(--ink-2)' : 'var(--grid)', 'stroke-width':zero ? 1.2 : 1}));
    svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, tick(v)));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FCI'));
  const pts = [];
  order.forEach((m, i) => {
    const [e, lo, hi] = ECI[m.id], y0 = T + i * lane, yc = y0 + lane / 2;
    if (i) svg.append(sv('line', {x1:0, x2:W - R, y1:y0, y2:y0, stroke:'var(--line)', 'stroke-width':1}));
    svg.append(sv('text', {class:'lab', x:0, y:yc + (m.h ? -3 : 4)}, narrow ? m.short : m.name));
    if (m.h) svg.append(sv('text', {x:0, y:yc + 14, 'font-size':12}, m.h));
    const bar = sv('rect', {class:'ebar', x:Math.min(X(0), X(e)), y:yc - bh / 2, width:Math.abs(X(e) - X(0)), height:bh, fill:MCOL[m.id], 'data-m':m.id});
    if (e < 0) bar.style.transformOrigin = 'right center';   // a bar below Kimi K2.7 grows leftwards from 0
    const wk = sv('path', {class:'ewhisk', d:`M${X(lo)},${yc}H${X(hi)}M${X(lo)},${yc - 7}v14M${X(hi)},${yc - 7}v14`, fill:'none', stroke:'var(--ink)', 'stroke-width':1.5});
    const val = sv('text', {class:'val halo', x:X(e), y:yc - bh / 2 - 6, fill:MTXT(m.id), 'text-anchor':'middle'}, fe(e));   // as many decimals as keep the models apart
    svg.append(bar, wk, val);
    if (an) { mark(bar, 'a-bar', i * .07); mark(wk, 'a-fade', .55 + i * .07); mark(val, 'a-fade', .55 + i * .07); }
    pts.push({x:X(e), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>FCI <b>${fe(e)}</b><br>90% interval ${fe(lo)}–${fe(hi)}`});
  });
  attachTip(svg, W, H, pts, $('#ecitip'));
}

/* Test-time scaling: the FCI a model would have if every run stopped at a US$ budget (SCALE, from
   bin/fcs2_runs_from_db.py); a run that has ended within the budget counts what it beat, and a run still going counts
   as beating nothing (Qiuyang, 2026-10-14). Straight segments and one legend (owner, 2026-10-13).
   Every model with reported spend is in the legend; at first only each lab's model with the highest FCI is drawn and the
   others are greyed in the legend; a click on an entry shows or hides its curve (owner, 2026-10-14). A model's 90% band
   shows only while the pointer is on its curve or its legend entry (owner, 2026-10-13: no bands otherwise).
   Each curve starts at its first budget on the scale, FCI 0 or more, as a plain line with no start mark (owner, 2026-10-14; Qiuyang: the
   values under 0 drew every curve in from the bottom edge as a comb of near-vertical strokes). When the chart first comes
   into view a moving focus plays (Melissa's and Qiuyang's idea, 2026-10-14): a budget cursor sweeps right, slow where
   curves start or rise and quick across empty stretches; the view follows it, zoomed in on cheap budgets first and
   widening to the whole range; curves rising at the cursor are drawn in full and named at their tip while the others
   step back. At rest nothing is named in the plot: the legend names the curves. */
let ttsHover = null, ttsRun = 0;
const TTSM = RANKED.filter(m => SCALE[m.id]);   // a model with no reported spend has no curve
const ttsOn = new Set(TTSM.filter((m, i, a) => a.findIndex(o => o.lab === m.lab) === i).map(m => m.id));
const ttsBands = () => document.querySelectorAll('#ttssvg .tband').forEach(b => b.setAttribute('opacity', b.dataset.m === ttsHover ? .12 : 0));
const ttsCurve = id => SCALE[id].filter(p => p[1] >= 0);   // [US$, FCI, 90% low, 90% high, share still going], from FCI 0 up
// a curve up to log budget lx, ending on the point interpolated there
function ttsUpTo(c, lx) {
  const out = [];
  for (let i = 0; i < c.length; i++) {
    const l = Math.log10(c[i][0]);
    if (l <= lx) { out.push(c[i]); continue; }
    if (i) { const a = c[i - 1], la = Math.log10(a[0]), f = (lx - la) / (l - la); out.push([10 ** lx, a[1] + f * (c[i][1] - a[1])]); }
    break;
  }
  return out;
}
// the focus's pacing was tuned on the old Human = 25 scale, about 7 of its points to a logit of the pass-based one
const TTS_PT = 7 / ECI_UNIT;
const ttsEase = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
// the cursor's log budget at time t: a stretch takes time in proportion to how much happens in it (curves starting, FCI
// gained), with a floor, so the sweep slows through the busy stretches and hurries across the empty ones
function ttsSweep(cs, x0, x1, t) {
  const n = 240, w = [0], at = (c, lx) => { const v = ttsUpTo(c, lx); return v.length ? v[v.length - 1][1] : null; };
  for (let k = 1; k <= n; k++) {
    const a = x0 + (x1 - x0) * (k - 1) / n, b = x0 + (x1 - x0) * k / n;
    let act = .6;
    cs.forEach(c => { const s0 = Math.log10(c[0][0]); if (s0 > a && s0 <= b) act += 30;
      const ya = at(c, a), yb = at(c, b); if (ya != null && yb != null) act += Math.abs(yb - ya) * 6 * TTS_PT; });
    w.push(w[k - 1] + act);
  }
  const target = w[n] * t; let k = 1; while (k < n && w[k] < target) k++;
  return x0 + (x1 - x0) * (k - 1 + (target - w[k - 1]) / ((w[k] - w[k - 1]) || 1)) / n;
}
function ttsPlay(run) {
  const t0 = performance.now(), D = 3400;
  const step = now => { if (run !== ttsRun) return; const t = Math.min(1, (now - t0) / D); drawTTS(t); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
// drawTTS() draws at rest, or at time 0 waiting to play when the chart has not been seen yet; drawTTS(t) draws one frame
function drawTTS(t) {
  const svg = $('#ttssvg'), W = Math.max(300, $('#ttsplot').clientWidth), narrow = W < 560;
  if (t == null) { const run = ++ttsRun; t = 1; if (animates(svg)) { t = 0; svg.addEventListener('shown', () => ttsPlay(run), {once:true}); } }
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = CHART_H.tts || (narrow ? 300 : 380);
  const all = TTSM.flatMap(m => ttsCurve(m.id));   // the y axis holds every model, so showing one moves it not
  const vis = TTSM.filter(m => ttsOn.has(m.id)).flatMap(m => ttsCurve(m.id)), xs = (vis.length ? vis : all).map(p => p[0]);   // the x axis spans the shown curves (owner, 2026-10-16)
  const x0 = Math.log10(Math.min(...xs)) - .15, x1 = Math.log10(Math.max(...xs));
  /* A broken axis (owner, 2026-10-16): the longest stretch of budgets where no model's curve runs, if over half a decade,
     shrinks to a short gap (GU decades of the drawn axis), marked by two slanted strokes on the axis as on the task chart's
     broken axis; nothing is drawn inside it. Only the shown curves count, so the axis is laid out again when one is shown or hidden (owner, 2026-10-16). */
  const spans = TTSM.filter(m => ttsOn.has(m.id)).map(m => ttsCurve(m.id)).filter(c => c.length).map(c => [Math.log10(c[0][0]), Math.log10(c[c.length - 1][0])]).sort((a, b) => a[0] - b[0]);
  let brk = null;
  for (let i = 0, end = -Infinity; i + 1 < spans.length; i++) { end = Math.max(end, spans[i][1]); const s = spans[i + 1][0];
    if (s - end > .5 && (!brk || s - end > brk[1] - brk[0])) brk = [end, s]; }
  if (brk) brk = [brk[0] + .1, brk[1] - .1];
  const GU = .12, U = lx => !brk || lx <= brk[0] ? lx : lx >= brk[1] ? lx - (brk[1] - brk[0]) + GU : brk[0] + (lx - brk[0]) / (brk[1] - brk[0]) * GU;
  const ytop = Math.max(...all.map(p => p[3])), ystep = eciStep(ytop, narrow ? 4 : 5), ymax = Math.ceil(ytop / ystep) * ystep;   // about five steps from 0, whatever the scale's unit
  const ms = [...TTSM].reverse().filter(m => ttsOn.has(m.id)), cs = ms.map(m => ttsCurve(m.id));
  const play = t < 1, sweep = play ? ttsSweep(cs, x0, x1, ttsEase(t)) : x1;
  const vx1 = play ? Math.min(x1, Math.max(x0 + 1.1, sweep + .45)) : x1;   // the view: at least a decade wide, just past the cursor
  const X = v => L + (U(Math.log10(v)) - U(x0)) / (U(vx1) - U(x0)) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  const gapPx = brk && vx1 > brk[0] ? [X(10 ** brk[0]), vx1 >= brk[1] ? X(10 ** brk[1]) : W - R] : null;   // the gap in pixels, once in view
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const clip = sv('clipPath', {id:'ttsclip'}); clip.append(sv('rect', {x:L, y:T - 6, width:W - L - R + 10, height:H - T - B + 6})); svg.append(clip);
  for (let i = 0, v = 0; v <= ymax + ystep / 2; v = ++i * ystep) {
    for (const [x1, x2] of gapPx ? [[L, gapPx[0]], [gapPx[1], W - R]] : [[L, W - R]]) svg.append(sv('line', {x1, x2, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, tick(v)));
  }
  // ticks at powers of ten on each side of the gap; a side with fewer than two adds 2 and 5 times a power of ten
  const segs = !brk ? [[x0, vx1]] : vx1 > brk[1] ? [[x0, brk[0]], [brk[1], vx1]] : [[x0, Math.min(vx1, brk[0])]];
  segs.forEach(([a, b]) => { const tk = [], in_ = v => Math.log10(v) >= a - 1e-9 && Math.log10(v) <= b + 1e-9;
    for (let k = Math.floor(a); k <= Math.ceil(b); k++) if (in_(10 ** k)) tk.push(10 ** k);
    if (tk.length < 2) for (let k = Math.floor(a); k <= Math.ceil(b); k++) [2, 5].forEach(f => in_(f * 10 ** k) && tk.push(f * 10 ** k));
    tk.forEach(v => { svg.append(sv('line', {x1:X(v), x2:X(v), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
      svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(v))); }); });
  if (gapPx) [gapPx[0], vx1 >= brk[1] ? gapPx[1] : null].forEach(x => x != null &&
    svg.append(sv('line', {x1:x - 3, y1:H - B + 6, x2:x + 3, y2:H - B - 6, stroke:'var(--ink-2)', 'stroke-width':1.5})));
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost budget per run in US$, log scale'));
  const g = sv('g', {'clip-path':'url(#ttsclip)'}), gb = sv('g'), gl = sv('g'); g.append(gb, gl); svg.append(g);   // bands under every line
  // rising at the cursor: started within the last 0.35 decade, or 2 old points (2 / TTS_PT FCI) gained over it; nothing steps back while nothing rises
  const rising = c => { const s0 = Math.log10(c[0][0]); if (s0 > sweep) return false; const e = ttsUpTo(c, sweep), b = ttsUpTo(c, sweep - .35);
    return s0 > sweep - .35 || e[e.length - 1][1] - b[b.length - 1][1] >= 2 / TTS_PT; };
  const anyRising = play && cs.some(rising), pts = [], tips = [];
  ms.forEach((m, k) => {
    const c = cs[k], vis = play ? ttsUpTo(c, sweep) : c;
    if (!vis.length) return;
    const lit = !anyRising || rising(c), op = lit ? null : .28;
    const path = vis.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    if (!play) gb.append(sv('path', {class:'tband', 'data-m':m.id, opacity:0, fill:MCOL[m.id],
      d:c.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[3]).toFixed(1)}`).join('') + [...c].reverse().map(p => `L${X(p[0]).toFixed(1)},${Y(p[2]).toFixed(1)}`).join('') + 'Z'}));
    const e = vis[vis.length - 1];
    gl.append(sv('path', {d:path, fill:'none', stroke:MCOL[m.id], 'stroke-width':2.2, 'stroke-linejoin':'round', opacity:op}),
      sv('circle', {cx:X(e[0]), cy:Y(e[1]), r:4.5, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':1.5, opacity:op}));
    if (play && anyRising && lit) tips.push({m, e});
    if (!play) c.forEach(p => pts.push({x:X(p[0]), y:Y(p[1]), m:m.id, html:`<b>${esc(m.name)}</b><br>FCI <b>${fe(p[1])}</b> at ${usdfmt(p[0])} per run`
      + `<br>90% interval ${fe(Math.max(p[2], 0))}–${fe(p[3])}<br>${Math.round(p[4] * 100)}% of runs still going`}));
  });
  // while the focus moves, the rising curves are named at their tips, off every line where there is room
  if (tips.length) {
    const fr = {l:L, r:W, t:T, b:H - B}, boxes = tips.map(({e}) => ({x:X(e[0]) - 7, y:Y(e[1]) - 7, w:14, h:14})), near = [];
    gl.querySelectorAll('path').forEach(el => { const n = el.getTotalLength(); for (let l = 0; l <= n; l += 6) { const q = el.getPointAtLength(l); near.push({x:q.x - 2, y:q.y - 2, w:4, h:4}); } });
    tips.sort((a, b) => b.e[1] - a.e[1]).forEach(({m, e}) => { const both = boxes.concat(near), name = narrow ? m.short : m.name;
      if (labelDot(svg, both, X(e[0]), Y(e[1]), name, fr, MTXT(m.id), false)) boxes.push(both[both.length - 1]);
      else labelDot(svg, boxes, X(e[0]), Y(e[1]), name, fr, MTXT(m.id), false); });
  }
  $('#ttslegend').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', ttsOn.has(x.dataset.m)));
  if (play) { svg.onpointermove = svg.onpointerdown = svg.onpointerleave = null; return; }
  attachTip(svg, W, H, pts, $('#ttstip'));
  // the curve under the pointer: the nearest point within 28 px, as the tooltip picks it; set as properties, so a redraw replaces them
  const tipMove = svg.onpointermove, tipLeave = svg.onpointerleave;
  svg.onpointermove = svg.onpointerdown = ev => { tipMove(ev); const rc = svg.getBoundingClientRect(), px = (ev.clientX - rc.left) * W / rc.width, py = (ev.clientY - rc.top) * H / rc.height;
    let best = null, bd = 28; pts.forEach(p => { const d = Math.hypot(p.x - px, p.y - py); if (d < bd) { bd = d; best = p; } });
    const m = best ? best.m : null; if (m !== ttsHover) { ttsHover = m; ttsBands(); } };
  svg.onpointerleave = ev => { tipLeave(ev); ttsHover = null; ttsBands(); };
  ttsBands();
}
$('#ttslegend').innerHTML = TTSM.map(m => `<button type="button" data-m="${m.id}" aria-pressed="false"><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</button>`).join('');
$('#ttslegend').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  const m = b.dataset.m; ttsOn.has(m) ? ttsOn.delete(m) : ttsOn.add(m); drawTTS(); });
$('#ttslegend').addEventListener('pointerover', e => { const b = e.target.closest('button'); if (b && e.pointerType === 'mouse') { ttsHover = b.dataset.m; ttsBands(); } });
$('#ttslegend').addEventListener('pointerleave', () => { ttsHover = null; ttsBands(); });

const TASK_OF = Object.fromEntries(TASKS.map(t => [t.s, t]));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Mean score, as the difference from the human reference (owner, 2026-10-14): each run's final score minus the human
   reference's score on the same task, in points of that task's 0-100 scale; 0 is the human reference. Tasks
   without a human reference score are left out. s holds the difference, raw the score itself. */
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
function drawLB() {
  const runs = RUNS.filter(r => (dom === 'All' || r.d === dom) && REF[r.t] != null).map(r => ({...r, raw:r.s, s:r.s - REF[r.t]}));
  // grouped by model, the row labels name the models; grouped by task, the dots need the legend
  $('#lblegend').hidden = group === 'model';
  let rows;
  if (group === 'model') {
    rows = MODELS.map(m => ({label:m.name, short:m.short, sub:m.h, items:[{m:m.id, runs:runs.filter(r => r.m === m.id)}]})).filter(r => r.items[0].runs.length);
    rows.forEach(r => r.best = mean(r.items[0].runs.map(x => x.s)));
  } else {
    // one line per task, one dot per model: the model's mean over its runs on that task
    const ts = [...new Set(runs.map(r => r.t))];
    rows = ts.map(t => ({label:NAME(t), sub:runs.find(r => r.t === t).d, items:MODELS.map(m => ({m:m.id, runs:runs.filter(r => r.t === t && r.m === m.id)})).filter(i => i.runs.length)}));
    rows.forEach(r => r.best = Math.max(...r.items.map(i => mean(i.runs.map(x => x.s)))));
  }
  rows.sort((a, b) => b.best - a.best);
  const svg = $('#lbsvg'), box = $('#lbplot'), W = Math.max(300, box.clientWidth), narrow = W < 560;
  const L = narrow ? (group === 'model' ? nameCol(svg) : 112) : 190, R = 34, T = 8, B = 46;
  const lane = group === 'model' ? (CHART_H.lbLane || (narrow ? 64 : 76)) : 30;
  const rowH = () => lane;
  const H = T + rows.reduce((a, r) => a + rowH(r), 0) + B, an = animates(svg) && group === 'model';
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  // the axis covers every run, shown or not, on a grid of 20 points with 0 in view: each model's range line spans its runs
  // either way, and the axis stays put when the runs are switched off (owner, 2026-10-14: the lines ran off the chart)
  const vs = runs.map(r => r.s), step = 20;
  const xlo = Math.min(0, Math.floor(Math.min(...vs) / step) * step), xhi = Math.max(0, Math.ceil(Math.max(...vs) / step) * step);
  const X = v => L + (v - xlo) / (xhi - xlo) * (W - L - R);
  for (let v = xlo; v <= xhi; v += step) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:v === 0 ? 'var(--ink-2)' : 'var(--grid)', 'stroke-width':v === 0 ? 1.2 : 1}));
    if (!narrow || v % 40 === 0) svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0'));   // phones label every 40
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Final score minus the human reference'));
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
        pts.push({x:X(ms[k]), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(r.label)} · ${esc(r.sub)}<br><b>${sgn(ms[k])}</b> against the human reference`, mean:true});
      });
      const edge = X(Math.max(...ms)) + 10, right = edge + 34 > W;
      svg.append(sv('text', {class:'val', x: right ? X(Math.min(...ms)) - 10 : edge, y:yc + 4.5, fill:'var(--ink-2)', 'text-anchor': right ? 'end' : 'start'}, sgn(Math.max(...ms))));
      y0 += h; return;
    }
    r.items.forEach((it, k) => {
      const yc = y0 + h / 2;
      const ss = it.runs.map(x => x.s), mu = mean(ss);
      // the play: this row's run dots pop in one after another, lowest score first, over 1.1 s, rows 0.06 s apart; then the range line, the mean and its value
      const d = ri * .06, dn = 1.1 / Math.max(1, it.runs.length), dm = d + 1.25, rank = new Map([...it.runs].sort((a, b) => a.s - b.s).map((x, k) => [x, k]));
      if (ss.length > 1) { const rg = sv('line', {x1:X(Math.min(...ss)), x2:X(Math.max(...ss)), y1:yc, y2:yc, stroke:MCOL[it.m], 'stroke-width':2, opacity:.35});
        svg.append(rg); if (an) mark(rg, 'a-fade', dm - .2); }
      if (showRuns) it.runs.forEach((x, j) => {
        const jy = ((j * 37) % 17 - 8) * (narrow ? .9 : 1.2);
        const c = sv('circle', {cx:X(x.s), cy:yc + jy, r:4.5, fill:MCOL[it.m], opacity:.4});
        svg.append(c); if (an) mark(c, 'a-pop', d + rank.get(x) * dn); pts.push({x:X(x.s), y:yc + jy, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(NAME(x.t))} · ${esc(x.d)}<br><b>${sgn(x.s)}</b>: final score ${f1(x.raw)}, human reference ${f1(REF[x.t])}`});
      });
      const dot = sv('circle', {cx:X(mu), cy:yc, r:8, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':2});
      pts.push({x:X(mu), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>Mean <b>${sgn(mu)}</b> against the human reference`, mean:true});
      // the mean sits above its own dot, with a white halo over the run dots
      const val = sv('text', {class:'val halo', x:X(mu), y:yc - 15, fill:MTXT(it.m), 'text-anchor':'middle'}, sgn(mu));
      svg.append(dot, val);
      if (an) { mark(dot, 'a-pop', dm); mark(val, 'a-fade', dm + .15); }
    });
    y0 += h;
  });
  attachTip(svg, W, H, pts);
}

/* ---------- results by domain ---------- */
/* Pass rate by domain: one row per model, in leaderboard order, one column per domain after all tasks, each domain headed by
   its task count (owner, 2026-10-14: models down the side, domains across). Bold marks the best model in each column. */
function drawTable() {
  const cols = ['All', ...DOMS_WITH_RUNS];
  const rate = (m, d) => { const s = RUNS.filter(r => r.m === m.id && (d === 'All' || r.d === d)).map(r => r.p * 100); return s.length ? mean(s) : null; };
  const grid = RANKED.map(m => cols.map(d => rate(m, d)));
  const best = cols.map((_, j) => { const v = grid.map(row => row[j]).filter(x => x != null); const top = Math.max(...v); return v.length > 1 && top > 0 ? top : null; });   // no bold when every model is at 0%
  const head = `<tr><th>Model</th>${cols.map(d => `<th class="${d === 'All' ? 'all' : 'dom'}">${d === 'All' ? 'All tasks' : esc(d)}<span class="tk">${NTASK(RUNS.filter(r => d === 'All' || r.d === d))}</span></th>`).join('')}</tr>`;
  const rows = RANKED.map((m, i) => `<tr><td><span class="sq" style="background:${MCOL[m.id]}"></span><span class="full">${esc(m.name)}</span><span class="short">${esc(m.short)}</span></td>`
    + grid[i].map((v, j) => v == null ? '<td class="e">–</td>' : `<td class="${[j === 0 ? 'all' : '', v === best[j] ? 'best' : ''].join(' ').trim()}">${Math.round(v)}%</td>`).join('') + '</tr>').join('');
  $('#restbl').innerHTML = head + rows;
}

/* ---------- every run: a kebab (Qiuyang, 2026-10-16), named a kebab rather than Terminal-Bench's waffle: each cell is one skewer of squares ----------
   One row per task, easiest first by FDI, the tasks held off the fits (no FDI) last; one column per model in FCI order. A cell
   holds one square per metric the task checks: blue when the run's final submission beat the human reference on every hidden
   workload, grey when it did not, so a run passes when all its squares are blue. The counts are PASSBY's (fcs2-checks.js),
   summed per metric as the converter sums them. A run that failed or was refused (STATE) takes that colour on all its squares;
   a run that timed out shows its metrics like any other (Qiuyang: no timeout state). A task's squares keep one order in every column, the metric the most runs beat first. */
const KSTATE = {failed:['fa', 'Run failed', 'The run failed: final score 0'],
  refused:['rf', 'Refused by the model provider', 'The model provider refused the task: left out of FCI and FDI'], unscored:['un', 'Not scored yet', 'Not scored yet']};
function drawKebab() {
  const st = typeof STATE === 'undefined' ? {} : STATE, used = new Set();
  const tasks = [...RAN].sort((a, b) => (FDI[a] ?? 1e9) - (FDI[b] ?? 1e9) || NAME(a).localeCompare(NAME(b)));
  const cells = [];
  const body = tasks.map(t => {
    // per model, per metric: [hidden workloads beaten, in all]; 'dev/' keys are development workloads, not judged
    const per = Object.fromEntries(RANKED.map(m => { const agg = {};
      for (const [k, [b, n]] of Object.entries((PASSBY[t] || {})[m.id] || {})) { if (k.startsWith('dev/')) continue;
        const j = k.slice(k.lastIndexOf('/') + 1), a = agg[j] ||= [0, 0]; a[0] += b; a[1] += n; }
      return [m.id, agg]; }));
    const won = (m, j) => { const a = per[m][j]; return !!a && a[1] > 0 && a[0] === a[1]; };
    const order = CHECKS[t] ? CHECKS[t].metrics : [];
    const stems = [...new Set([...order, ...RANKED.flatMap(m => Object.keys(per[m.id]))])];
    const nwon = j => RANKED.filter(m => won(m.id, j)).length;
    stems.sort((a, b) => nwon(b) - nwon(a) || order.indexOf(a) - order.indexOf(b));
    const tds = RANKED.map(m => {
      const run = RUNS.find(r => r.t === t && r.m === m.id), s = (st[t] || {})[m.id];
      if (!run && !s) return '<td></td>';
      const k = stems.filter(j => won(m.id, j)).length, n = stems.length;
      let html = `<b>${esc(m.name)}</b><br>${esc(NAME(t))}<br>`;
      if (s) { used.add(s); html += KSTATE[s][2]; }
      else html += (k === n ? `<b>Passes</b>: beats ${n === 1 ? 'its one metric' : `all ${n} metrics`}` : `Beats ${k} of ${n} metric${n === 1 ? '' : 's'}`)
        + `<br>Final score ${f1(run.s)}${REF[t] != null ? `, human reference ${f1(REF[t])}` : ''}`;
      cells.push(html);
      return `<td data-i="${cells.length - 1}"><span class="sqs">${stems.map(j => `<i class="${s ? KSTATE[s][0] : won(m.id, j) ? 'y' : 'n'}"></i>`).join('')}</span></td>`;
    }).join('');
    return `<tr><td class="kt"><a href="${esc(taskHref(t))}">${esc(NAME(t))}</a></td><td class="kf">${FDI[t] != null ? fe(FDI[t]) : '–'}</td>${tds}</tr>`;
  }).join('');
  $('#kebtbl').innerHTML = `<colgroup><col class="kt"><col class="kf">${RANKED.map(() => '<col>').join('')}</colgroup>`
    + `<thead><tr><th class="kt">Task</th><th class="kf">FDI</th>${RANKED.map(m => `<th class="km"><span class="nm">${esc(m.name)}</span></th>`).join('')}</tr></thead><tbody>${body}</tbody>`;
  $('#keblegend').innerHTML = [['y', 'Beaten on every hidden workload'], ['n', 'Not beaten'], ...Object.entries(KSTATE).filter(([k]) => used.has(k)).map(([, v]) => v)]
    .map(([c, l]) => `<span><i class="${c}"></i>${l}</span>`).join('');
  const box = $('#kebplot'), tip = $('#kebtip');
  const show = ev => { const td = ev.target.closest && ev.target.closest('td[data-i]'); if (!td) { tip.hidden = true; return; }
    const rc = td.getBoundingClientRect(), pr = box.getBoundingClientRect();
    tip.innerHTML = cells[td.dataset.i]; tip.hidden = false; tip.style.left = (rc.left + rc.width / 2 - pr.left) + 'px'; tip.style.top = (rc.top - pr.top + 4) + 'px'; };
  box.onpointermove = box.onpointerdown = show;
  box.onpointerleave = () => { if (!isTouch) tip.hidden = true; };
  $('#kebscroll').onscroll = () => { tip.hidden = true; };
  fitKebab();
}
// The cost scatter and the kebab share one figure, switched by its tabs (Qiuyang, 2026-10-16); #kebab in the address opens
// the kebab. A hidden chart has no width, so each is fitted again when its tab opens.
const PCTITLE = {scatter:$('#pctitle').textContent, kebab:'Every run: one square per metric the task checks'};
function pcView(v) {
  [...$('#pcview').children].forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === v)));
  $('#pctitle').textContent = PCTITLE[v]; $('#pcplot').hidden = v !== 'scatter'; $('#kebab').hidden = v !== 'kebab';
  if (v === 'scatter') drawPassCost(); else fitKebab();
}
$('#pcview').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) pcView(b.dataset.v); });
// the table scrolls sideways only when it does not fit, since a scrolling box would keep its header from sticking under the section bar
function fitKebab() {
  const sc = $('#kebscroll'); sc.classList.remove('scroll'); sc.classList.toggle('scroll', $('#kebtbl').offsetWidth > sc.clientWidth + 1);
  $('#kebtbl').style.setProperty('--ktop', $('.sub').offsetHeight + 'px');
  // model names run up at 40 degrees, each on one line (Qiuyang); the header is as tall as the longest one needs
  const w = Math.max(0, ...[...document.querySelectorAll('#kebtbl .nm')].map(e => e.offsetWidth)), a = 40 * Math.PI / 180;
  if (w) $('#kebtbl').style.setProperty('--kh', Math.ceil(w * Math.sin(a) + 16 * Math.cos(a) + 12) + 'px');
}

/* ---------- case studies: a placeholder until the preview runs have their own (owner, 2026-10-09) ---------- */
const redraws = [fitKebab];

/* ---------- How FCI works: a fold under the FCI chart (owner, 2026-10-11) ----------
   Three tasks' pass curves, the joint model's own (passChance, fcs2-data.js): an easy, a middle and a hard one, the tasks a sixth, a half and five sixths of the way up the FDI order, so the picture
   follows the data (Qiuyang, 2026-10-14). A dashed line marks the scale's fixed point, Kimi K2.7 = 0. */
function drawHow() {
  const box = $('#fci-how'); if (!box || !box.open) return;
  const INKS = ['#8ab4f8', '#1a73e8', '#174ea6'];   // easy to hard: Google blue 300, 600, 900
  let svg = $('#howasvg'), W = Math.max(300, $('#howaplot').clientWidth), narrow = W < 560;
  let L = 44, R = narrow ? 12 : 24, T = 26, B = 46, H = narrow ? 254 : 284;
  const up = Object.keys(FDI).filter(s => passChance(s, FDI[s]) != null).sort((a, b) => FDI[a] - FDI[b]);
  if (up.length < 3) return;   // no pass curves in the data
  const picks = [1 / 6, 1 / 2, 5 / 6].map(q => up[Math.round(q * (up.length - 1))]);
  // the axis runs from 10% on the easy curve to 90% on the hard one, with Kimi K2.7 and every model in view
  const es = MODELS.map(m => ECI[m.id][0]), lo = Math.min(ECI_LOW_VALUE, passAt(picks[0], .1), ...es), hi = Math.max(passAt(picks[2], .9), ...es);
  const step = eciStep(hi - lo, narrow ? 4 : 6), X0 = Math.floor(lo / step) * step, X1 = Math.ceil(hi / step) * step;
  const X = v => L + (v - X0) / (X1 - X0) * (W - L - R), Y = v => T + (1 - v / 100) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= 100; v += 25) { svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1})); svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v + '%')); }
  for (let i = 0, v = X0; v <= X1 + step / 2; v = X0 + ++i * step) svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, tick(v)));
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FCI'));
  svg.append(sv('line', {x1:X(ECI_LOW_VALUE), x2:X(ECI_LOW_VALUE), y1:T - 4, y2:H - B, stroke:'var(--ink-2)', 'stroke-width':1, 'stroke-dasharray':'3 3', opacity:.6}),
    sv('text', {x:X(ECI_LOW_VALUE), y:T - 10, 'text-anchor':'middle'}, `${ECI_LOW_NAME} = ${tick(ECI_LOW_VALUE)}`));
  const pts = [], n = 240;
  picks.forEach((s, i) => {
    const d = FDI[s], f = x => 100 * passChance(s, x);
    svg.append(sv('path', {d:Array.from({length:n + 1}, (_, j) => { const x = X0 + (X1 - X0) * j / n; return `${j ? 'L' : 'M'}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`; }).join(''), fill:'none', stroke:INKS[i], 'stroke-width':2.5}));
    svg.append(sv('circle', {cx:X(d), cy:Y(50), r:5, fill:INKS[i], stroke:'#fff', 'stroke-width':2}));   // the FDI: passes half the time
    for (let j = 0; j <= 60; j++) { const x = X0 + (X1 - X0) * j / 60;
      pts.push({x:X(x), y:Y(f(x)), html:`<b>${esc(NAME(s))}</b><br>FDI ${fe(d)}<br>At FCI ${fe(x)}: passes <b>${Math.round(f(x))}%</b> of the time`}); }
  });
  attachTip(svg, W, H, pts, $('#howatip'));
  $('#howalegend').innerHTML = picks.map((s, i) => `<span><i style="background:${INKS[i]}"></i>${esc(NAME(s))}, FDI ${fe(FDI[s])}</span>`).join('');
}
$('#fci-how').addEventListener('toggle', drawHow);
redraws.push(drawHow);

/* ---------- questions ---------- */
const fqHash = () => { const d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({block:'start'}); } };
addEventListener('hashchange', fqHash); fqHash();

/* ---------- task index ----------
   One compact row per task: its name over its domain, what the agent must do (GOAL) over the paper it comes from, its
   FDI, and the links. The filter is by domain; the search also
   reads goals and venues; the order is the reader's choice, hardest first to begin with. */
let picked = new Set(), q = '', order = 'hard';
// the domain filter: checkboxes drawn as Material 3 ones, any number checked (owner, design audit: chips did not look good, 4B)
$('#checks').innerHTML = DOMAINS.map(d => `<label><input type="checkbox" value="${esc(d)}"><span>${esc(d)} <span class="cn">${N_IN(d)}</span></span></label>`).join('');
$('#q').placeholder = `Search ${TASKS.length} tasks`;
const again = () => { drawRows(); $('#rows').scrollTop = 0; atEnd(); };
$('#checks').addEventListener('change', e => { e.target.checked ? picked.add(e.target.value) : picked.delete(e.target.value); again(); });
// the sort menu: a button in the search field's style and a menu of its own, as the native list cannot take the page's design
// (owner, 2026-10-14); arrow keys move, Enter or Space picks, Escape or a click outside closes
(() => { const dd = $('#tsort'), btn = dd.querySelector('.dd-btn'), menu = dd.querySelector('.dd-menu'), opts = [...menu.children];
  opts.forEach(o => o.tabIndex = -1);
  const close = (refocus) => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); };
  const open = () => { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); (opts.find(o => o.getAttribute('aria-selected') === 'true') || opts[0]).focus(); };
  const pick = o => { opts.forEach(x => x.setAttribute('aria-selected', String(x === o))); dd.querySelector('.dd-val').textContent = o.textContent;
    close(true); if (order !== o.dataset.v) { order = o.dataset.v; again(); } };
  btn.addEventListener('click', () => menu.hidden ? open() : close(false));
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
  menu.addEventListener('click', e => { const o = e.target.closest('[role=option]'); if (o) pick(o); });
  menu.addEventListener('keydown', e => { const i = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); opts[(i + (e.key === 'ArrowDown' ? 1 : opts.length - 1)) % opts.length].focus(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); opts[e.key === 'Home' ? 0 : opts.length - 1].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) pick(opts[i]); }
    else if (e.key === 'Escape' || e.key === 'Tab') close(e.key === 'Escape'); });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !dd.contains(e.target)) close(false); });
})();
$('#ftoggle').addEventListener('click', () => { const f = $('#filter'), o = !f.classList.contains('open'); f.classList.toggle('open', o); $('#ftoggle').setAttribute('aria-expanded', String(o)); });
$('#q').addEventListener('input', e => { q = e.target.value; again(); });
// the list scrolls in its own box, all tasks in it (owner, 2026-10-14: no Show more button); the foot fades until the end is reached
const atEnd = () => { const r = $('#rows'); r.classList.toggle('at-end', r.scrollTop + r.clientHeight >= r.scrollHeight - 2);
  // the page's own scroll bar: the thumb's height is the visible share of the list, its top the share scrolled
  const rail = $('#rail'), th = rail.firstElementChild, over = r.scrollHeight > r.clientHeight + 1; rail.hidden = !over;
  if (over) { const h = Math.max(36, r.clientHeight * r.clientHeight / r.scrollHeight); th.style.height = `${h}px`;
    th.style.top = `${(r.clientHeight - h) * r.scrollTop / (r.scrollHeight - r.clientHeight)}px`; }
  // the head line ends where the rows do: past them is the list's own padding, which holds the scroll rail
  $('#lhead').style.paddingRight = getComputedStyle(r).paddingRight; };
$('#rows').addEventListener('scroll', atEnd, {passive:true}); addEventListener('resize', atEnd);
// dragging the thumb scrolls the list in step; a press on the rail away from the thumb centres the thumb there first
$('#rail').addEventListener('pointerdown', e => { const r = $('#rows'), rail = $('#rail'), th = rail.firstElementChild, box = rail.getBoundingClientRect();
  const span = r.clientHeight - th.offsetHeight, per = (r.scrollHeight - r.clientHeight) / (span || 1);
  if (e.target !== th) r.scrollTop = (e.clientY - box.top - th.offsetHeight / 2) * per;
  const y0 = e.clientY, s0 = r.scrollTop; rail.classList.add('drag'); rail.setPointerCapture(e.pointerId); e.preventDefault();
  const move = ev => { r.scrollTop = s0 + (ev.clientY - y0) * per; };
  const up = () => { rail.classList.remove('drag'); rail.removeEventListener('pointermove', move); rail.removeEventListener('pointerup', up); rail.removeEventListener('pointercancel', up); };
  rail.addEventListener('pointermove', move); rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up); });
function hits() {
  const w = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = t => [t.s, t.name, t.t, t.n, t.d, GOAL[t.s] || '', VENUE[t.s] || ''].join(' ').toLowerCase();
  const h = TASKS.filter(t => (!picked.size || picked.has(t.d)) && w.every(x => hay(t).includes(x)));
  // difficulty is the FDI rank (FRANK, 1 = hardest); a task without a FDI has none and comes last either way
  const rank = t => FRANK[t.s] ?? null, dom = (a, b) => DOMAINS.indexOf(a.d) - DOMAINS.indexOf(b.d), nm = (a, b) => a.name.localeCompare(b.name);
  const hard = (a, b) => (rank(a) ?? 1e9) - (rank(b) ?? 1e9) || dom(a, b) || nm(a, b), easy = (a, b) => (rank(b) ?? -1) - (rank(a) ?? -1) || dom(a, b) || nm(a, b);
  return [...h].sort({hard, easy, domain:(a, b) => dom(a, b) || hard(a, b), name:nm}[order]);
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
const CHIP_SHORT = {'Programming Languages':'Languages', 'Machine Learning':'ML', 'Bioinformatics':'Bio', 'Cryptography':'Crypto', 'Architecture':'Arch', 'Software Engineering':'SE'};   // map chips only, where the full name does not fit
function drawMap() {
  stopPlay(false);
  const svg = $('#mapsvg'), W = $('#map').clientWidth, narrow = W < 640, H = narrow ? Math.round(W * 1.15) : Math.round(W * 0.36);
  svg.setAttribute('aria-label', `The ${TASKS.length} tasks by domain`);   // the count from the data, not the markup
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
      // a white chip at the top left: name and count, then the name alone, lying flat, then standing up along the left edge.
      // The large sizes are tried in all four forms before the small one, so a tall narrow block gets a standing chip at full
      // size instead of a tiny flat one; a block too small for the full name takes its short name (CHIP_SHORT).
      const ink = AINK[a.k], meas = (str, fs) => { const t = sv('text', {x:-999, y:-999, 'font-size':fs, 'font-weight':600}, str); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
      const big = narrow ? [13, 11] : [15, 13], small = narrow ? [10] : [11];
      const forms = [];
      for (const [sizes, name] of [[big, d], [small, d], [small, CHIP_SHORT[d]]]) if (name)
        for (const rot of [false, true]) for (const cnt of [true, false]) for (const fs of sizes) forms.push({name, rot, cnt, fs});
      for (const {name, rot, cnt, fs} of forms) {
        const pw = meas(cnt ? `${name}  ${n}` : name, fs) + fs * 1.2, ph = fs * 1.75, m = fs < 11 ? 3 : fs < 13 ? 4 : 8, along = rot ? bh : bw, across = rot ? bw : bh;
        if (pw + 2 * m > along || ph + 2 * m > across) continue;
        const ox = x0 + m, oy = rot ? y0 + bh - m : y0 + m, chip = sv('g', {'pointer-events':'none', transform:rot ? `rotate(-90 ${ox} ${oy})` : null});
        chip.append(sv('rect', {x:ox, y:oy, width:pw.toFixed(1), height:ph.toFixed(1), rx:(ph / 2).toFixed(1), fill:'#fff'}));
        const t = sv('text', {x:(ox + fs * .6).toFixed(1), y:(oy + ph * .68).toFixed(1), 'font-size':fs, 'font-weight':600, fill:ink}, name);
        if (cnt) t.append(sv('tspan', {'font-weight':400, dx:fs * .45}, n));
        chip.append(t); g.append(chip); break; }
    });
  });
}
/* Hovering a task's tile lifts it into a card and plays its runs (owner, 2026-10-10): the card grows from the tile to
   1.7 times its size (at least 260 px wide, kept inside the map), its illustration goes under a 70% veil of the domain
   hue while the rest of the map fades under a 60% white veil, and each run's best development score so far draws itself as a white step line from the first to the last
   submission (spending on x, 0 to 100 on y), then holds; with several runs they follow in a
   loop. White words only: the task's name at the top left, the model of the run on screen at the bottom right (owner,
   2026-10-10). Clicking the card opens the task page. Mouse only; reduced motion shows the card and each line at once.
   Leaving, the card shrinks back into its tile and the veil fades out; moving from tile to tile keeps the veil up, so the
   map does not flash (owner, 2026-10-11: the return to normal was too abrupt). */
let play = null, veil = null, playN = 0, wait = null;   // wait: the tile the pointer rests on, and its timer
// one white veil per map, under the cards; its opacity eases to op (0.6 behind a card, 0 when none)
function veilTo(op) {
  const svg = $('#mapsvg'), [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
  if (!veil || !veil.isConnected) {
    veil = sv('rect', {x:0, y:0, width:W, height:H, fill:'#fff', 'pointer-events':'none'});
    veil.style.opacity = 0; svg.append(veil); veil.getBoundingClientRect();
  }
  veil.style.transition = calm ? 'none' : `opacity ${op ? 220 : 320}ms ease`;
  veil.style.opacity = op;
}
function stopPlay(fade = true) {
  if (!play) return;
  const p = play; play = null; clearTimeout(p.t);
  if (calm || !fade) { p.g.remove(); return; }
  p.g.classList.remove('play'); p.g.style.pointerEvents = 'none';
  p.card.animate([{transform:'none', opacity:1}, {transform:p.back, opacity:0}], {duration:200, easing:'cubic-bezier(.3,0,.8,.15)', fill:'forwards'}).onfinish = () => p.g.remove();
}
function startPlay(tile) {
  const s = tile.dataset.s, k = tile.dataset.k, runs = RUNS.filter(r => r.t === s), svg = $('#mapsvg'), narrow = $('#map').clientWidth < 640;
  const [tx, ty, tw, th] = ['x', 'y', 'width', 'height'].map(a => +tile.getAttribute(a)), [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
  const w = Math.min(W - 8, narrow ? 340 : 440), h = Math.min(H - 8, narrow ? 250 : 290), x = Math.min(W - w - 4, Math.max(4, tx + tw / 2 - w / 2)), y = Math.min(H - h - 4, Math.max(4, ty + th / 2 - h / 2));
  const root = sv('g', {class:'play', style:'cursor:pointer'}), card = sv('g'), cid = `playclip${++playN}`;   // own id: the leaving card keeps its clip for 0.2 s
  card.innerHTML = `<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" filter="drop-shadow(0 6px 16px rgba(32,33,36,.35))"/>`
    + `<g clip-path="url(#${cid})">${taskArt(s, k).replace('<svg class="art"', `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"`)}`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ART_FIELD[k]}" opacity=".88"/></g>`;
  const who = sv('text', {x:x + w - 14, y:y + h - 14, 'text-anchor':'end', 'font-size':14, 'font-weight':600, fill:'#fff'});
  card.append(sv('text', {x:x + 14, y:y + 26, 'font-size':14, 'font-weight':600, fill:'#fff'}, NAME(s)), who);
  // the rest of the map fades behind the card; the veil lets the pointer through to the other tiles
  veilTo(.6); root.append(card); svg.append(root);
  card.style.transformOrigin = `${x + w / 2}px ${y + h / 2}px`;
  const back = `translate(${tx + tw / 2 - x - w / 2}px,${ty + th / 2 - y - h / 2}px) scale(${tw / w})`;   // the card's size and place as its tile
  if (!calm) card.animate([{transform:back, opacity:.6}, {transform:'none', opacity:1}], {duration:220, easing:'cubic-bezier(.2,0,0,1)', fill:'forwards'});
  play = {tile, g:root, card, who, runs, k:0, x, y, w, h, back, narrow};
  play.t = setTimeout(showRun, calm ? 0 : 200);
}
// The card tells a task in three panels that follow one another: the paper and, in one sentence, what the agent has to
// do; which models passed (a tick) and which failed (a cross); and where the task ranks by difficulty among
// all tasks (owner, 2026-10-13: the run curves said too little for the room they took).
// Icons for the kinds of metric a task is scored on (KEYM), each a path in a 14 px box centred on (x, y).
const KEY_KIND = {Latency:'time', Throughput:'speed', Accuracy:'quality', Quality:'quality', 'Success rate':'quality', Reward:'quality',
  Memory:'size', Size:'size', Compression:'size', Communication:'size', Fairness:'balance', Coverage:'count'};
const KEY_ICON = {
  time:(x, y) => `M${x - 6.5},${y}a6.5,6.5 0 1,0 13,0a6.5,6.5 0 1,0 -13,0M${x},${y - 3.6}V${y}l2.6,1.8`,                    // a clock
  speed:(x, y) => `M${x + 1.5},${y - 7}l-5.5,8h4l-1.5,6l5.5,-8h-4z`,                                                        // a bolt
  quality:(x, y) => `M${x - 6.5},${y}a6.5,6.5 0 1,0 13,0a6.5,6.5 0 1,0 -13,0M${x - 2.2},${y}a2.2,2.2 0 1,0 4.4,0a2.2,2.2 0 1,0 -4.4,0`,   // a target
  size:(x, y) => `M${x - 6},${y - 2.5}l6,-3.2l6,3.2l-6,3.2zM${x - 6},${y + 1}l6,3.2l6,-3.2M${x - 6},${y + 4.2}l6,3.2l6,-3.2`,   // stacked layers
  count:(x, y) => `M${x - 3},${y - 6}v12M${x + 3},${y - 6}v12M${x - 6.5},${y - 2.5}h13M${x - 6.5},${y + 2.5}h13`,              // a hash
  balance:(x, y) => `M${x},${y - 6.5}v13M${x - 4},${y + 6.5}h8M${x - 6.5},${y - 4}h13M${x - 6.5},${y - 4}l-1.2,5h5l-1.2,-5M${x + 6.5},${y - 4}l-1.2,5h-2.6`,   // scales
};
function wrapText(svg, str, width, fs, weight) {   // greedy line breaking by measured width
  const probe = sv('text', {x:-999, y:-999, 'font-size':fs, 'font-weight':weight}); svg.append(probe);
  const lines = []; let cur = '';
  for (const word of str.split(' ')) { probe.textContent = cur ? cur + ' ' + word : word;
    if (cur && probe.getComputedTextLength() > width) { lines.push(cur); cur = word; } else cur = probe.textContent; }
  if (cur) lines.push(cur); probe.remove(); return lines;
}
function showRun() {
  const p = play, s = p.tile.dataset.s, t = TASK_OF[s], svg = $('#mapsvg'), field = ART_FIELD[p.tile.dataset.k];
  const PX = 18, top = p.y + 48, inner = p.w - 2 * PX, n = 3, panel = sv('g', {class:'pline'}), narrow = p.narrow;
  const lines = (str, y, fs, weight, lh, max, op = 1) => { let L = wrapText(svg, str, inner, fs, weight);
    if (L.length > max) { L = L.slice(0, max); L[max - 1] = L[max - 1].replace(/[\s,;:.]*\S*$/, '') + '…'; }
    L.forEach((ln, i) => panel.append(sv('text', {x:p.x + PX, y:y + i * lh, 'font-size':fs, 'font-weight':weight, fill:'#fff', 'fill-opacity':op}, ln))); return y + L.length * lh; };
  if (p.k === 0) {   // the goal in large type, what the task is scored on, and the paper (or blog post) as a small line at the foot
    let y = lines(GOAL[s] || t.n, top + 12, narrow ? 19 : 21, 600, narrow ? 25 : 27, 4);
    let foot = y;   // where the text above the source line ends
    if (KEYM[s]) { panel.append(sv('text', {x:p.x + PX, y:y + 12, 'font-size':11.5, 'font-weight':500, fill:'#fff', 'fill-opacity':.75, 'letter-spacing':'.04em'}, 'SCORED ON'));
      // one row per metric: a small line icon for its kind, then its name
      KEYM[s].forEach((label, i) => { const cy = y + 33 + i * 22, ix = p.x + PX + 8, ic = KEY_KIND[label] || 'quality';
        panel.append(sv('path', {d:KEY_ICON[ic](ix, cy), fill:'none', stroke:'#fff', 'stroke-width':1.6, 'stroke-linecap':'round', 'stroke-linejoin':'round'}),
          sv('text', {x:ix + 16, y:cy + 5, 'font-size':14.5, 'font-weight':500, fill:'#fff'}, label)); });
      foot = y + 33 + (KEYM[s].length - 1) * 22 + 12; }
    // the source sits at the foot of the card, on as many lines as the room above leaves: two, one, or none
    const ttl = t.t || (VENUE[s] ? t.name : '');   // a paper whose title is the task's short name still shows, with its venue
    if (ttl) { const v = VENUE[s], src = v ? `${v} · ${ttl}` : ttl, base = p.y + p.h - 34, two = wrapText(svg, src, inner, 12.5, 400).length > 1, room = base - foot, n0 = panel.childNodes.length;
      if (two && room >= 17 + 18) lines(src, base - 17, 12.5, 400, 17, 2, .8); else if (room >= 18) lines(src, base, 12.5, 400, 17, 1, .8);
      // the venue leads the source line in bold
      const first = panel.childNodes[n0];
      if (v && first && first.textContent.startsWith(v)) { const rest = first.textContent.slice(v.length); first.textContent = '';
        first.append(sv('tspan', {'font-weight':600, 'fill-opacity':1}, v), sv('tspan', {}, rest)); } }
  } else if (p.k === 1) {   // every model: a tick or a cross in a disc, then its name; two columns, in leaderboard order
    const rs = RANKED.map(m => [m, p.runs.find(r => r.m === m.id)]).filter(x => x[1]), half = Math.ceil(rs.length / 2), lh = Math.min(30, (p.h - 96) / half);
    panel.append(sv('text', {x:p.x + PX, y:top + 4, 'font-size':13, 'font-weight':500, fill:'#fff', 'fill-opacity':.85}, `${rs.filter(x => x[1].p).length} of ${rs.length} models pass`));
    rs.forEach(([m, r], i) => { const cx = p.x + PX + 9 + (i >= half ? inner / 2 + 6 : 0), cy = top + 30 + (i % half) * lh, R = 8.5;
      panel.append(sv('circle', {cx, cy, r:R, fill:r.p ? '#fff' : 'none', stroke:'#fff', 'stroke-width':1.6, 'stroke-opacity':r.p ? 1 : .8}),
        sv('path', {d:r.p ? `M${cx - R * .46},${cy + R * .04}l${R * .32},${R * .34}l${R * .6},${-R * .7}` : `M${cx - R * .36},${cy - R * .36}l${R * .72},${R * .72}M${cx + R * .36},${cy - R * .36}l${-R * .72},${R * .72}`,
          fill:'none', stroke:r.p ? field : '#fff', 'stroke-width':2, 'stroke-linecap':'round', 'stroke-linejoin':'round', 'stroke-opacity':r.p ? 1 : .85}),
        sv('text', {x:cx + 17, y:cy + 4.5, 'font-size':13.5, 'font-weight':r.p ? 600 : 400, fill:'#fff', 'fill-opacity':r.p ? 1 : .85}, narrow ? m.short : m.name)); });
  } else {   // difficulty: the FDI rank (FRANK), and a strip with every task in rank order and this one as a disc; DIFF gives who passes
    const D = FRANK[s] ? {rank:FRANK[s], pass:DIFF[s][3], n:DIFF[s][5]} : null, N = Object.keys(FRANK).length;
    panel.append(sv('text', {x:p.x + PX, y:top + 4, 'font-size':13, 'font-weight':500, fill:'#fff', 'fill-opacity':.85}, 'Difficulty'));
    if (!D) panel.append(sv('text', {x:p.x + PX, y:top + 52, 'font-size':16, fill:'#fff'}, 'No runs yet'));
    else { const rank = D.rank, X = r => p.x + PX + (N - r) / (N - 1 || 1) * inner, sy = p.y + p.h - 74;
      // the hardest and the easiest are named as the task page names them; tasks of the same shown FDI share a rank
      const end = rank === 1 ? 'Hardest' : rank === FLAST ? 'Easiest' : null;
      panel.append(sv('text', {x:p.x + PX, y:top + 62, 'font-size':52, 'font-weight':600, fill:'#fff'}, end || ordinal(rank)),
        sv('text', {x:p.x + PX, y:top + 90, 'font-size':14, fill:'#fff', 'fill-opacity':.92}, `${end ? '' : 'hardest '}of ${N} tasks · ${D.pass} of ${D.n} models pass`),
        sv('line', {x1:p.x + PX, x2:p.x + PX + inner, y1:sy, y2:sy, stroke:'#fff', 'stroke-opacity':.45, 'stroke-width':1.5}));
      Object.values(FRANK).forEach(r => panel.append(sv('line', {x1:X(r), x2:X(r), y1:sy - 5, y2:sy + 5, stroke:'#fff', 'stroke-opacity':.5, 'stroke-width':1.5})));   // a tick per task
      panel.append(sv('circle', {cx:X(rank), cy:sy, r:8, fill:'#fff'}),
        sv('text', {x:p.x + PX, y:sy + 26, 'font-size':12, fill:'#fff', 'fill-opacity':.85}, 'easier'), sv('text', {x:p.x + PX + inner, y:sy + 26, 'text-anchor':'end', 'font-size':12, fill:'#fff', 'fill-opacity':.85}, 'harder')); }
  }
  // which panel this is: three small dots at the bottom
  for (let i = 0; i < n; i++) panel.append(sv('circle', {cx:p.x + p.w / 2 + (i - 1) * 14, cy:p.y + p.h - 16, r:3.2, fill:'#fff', 'fill-opacity':i === p.k ? 1 : .4}));
  p.card.querySelector('.pline')?.remove(); p.card.append(panel); p.who.textContent = '';
  if (!calm) panel.animate([{opacity:0, transform:'translateY(6px)'}, {opacity:1, transform:'none'}], {duration:280, easing:'cubic-bezier(.2,0,0,1)', fill:'both'});
  p.t = setTimeout(() => {
    const go = () => { if (play !== p) return; p.k = (p.k + 1) % n; showRun(); };
    if (calm) go(); else panel.animate([{opacity:1}, {opacity:0}], {duration:220, fill:'forwards'}).onfinish = go;
  }, p.k === 0 ? 2500 : 1800);   // owner, 2026-10-13: faster (was 4.2 s and 3.2 s, then 3.4 s and 2.6 s)
}
$('#mapsvg').addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  if (play && e.target.closest('.play')) return;   // the card stays while the pointer is on it
  const tile = e.target.closest('svg.tile');
  // what the pointer rests on for 0.1 s takes effect, a tile's card or none, so a pointer crossing tiles or the seams
  // between them changes nothing on the way (owner, 2026-10-11: switching jumped)
  const want = tile || null, now = play ? play.tile : null;
  if (want === now) { if (wait) { clearTimeout(wait.t); wait = null; } }
  else if (!wait || wait.tile !== want) {
    clearTimeout(wait?.t);
    wait = {tile:want, t:setTimeout(() => { wait = null; stopPlay(); if (want) startPlay(want); else veilTo(0); }, calm ? 0 : 100)};
  }
});   // no box for a domain: its chip already names it and counts its tasks (owner, 2026-10-11)
$('#mapsvg').addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; clearTimeout(wait?.t); wait = null; stopPlay(); veilTo(0); });
// touch and pen have no hover: a tap on a tile opens its card, a tap on the card opens the task, a tap anywhere else closes it
let lastPointer = 'mouse';
$('#mapsvg').addEventListener('pointerdown', e => { lastPointer = e.pointerType; });
$('#mapsvg').addEventListener('click', e => {
  if (play && e.target.closest('.play')) { location.href = taskHref(play.tile.dataset.s); return; }
  if (lastPointer === 'mouse') return;
  const tile = e.target.closest('svg.tile');
  stopPlay(); if (tile) startPlay(tile); else veilTo(0);
});
document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && play && !e.target.closest('#mapsvg')) { stopPlay(); veilTo(0); } });

function drawRows() {
  const h = hits(); $('#fcount').textContent = picked.size ? `(${picked.size})` : '';
  $('#lhead').innerHTML = `<span>${h.length === TASKS.length ? `${TASKS.length} tasks` : `${h.length} of ${TASKS.length} tasks`}</span><span></span>`
    + `<span title="FDI, the FrontierCS Difficulty Index: the FCI at which a model passes the task half the time">FDI</span><span></span>`;
  $('#rows').innerHTML = h.map(t => { const s = t.s, v = VENUE[s], goal = GOAL[s], ttl = t.t || (v ? t.name : '');
    // with a goal, the source is the small line under it (venue in bold, then the title); without one (Security), the title is the main line
    const main = goal || ttl, small = goal ? (v && ttl ? `<b>${esc(v)}</b> · ${esc(ttl)}` : esc(v || ttl)) : v ? `<b>${esc(v)}</b>` : '';
    // the task's FDI in place of the pass rate (owner, 2026-10-14)
    const pass = FDI[s] != null ? `<a class="tp" href="${esc(taskHref(s))}" tabindex="-1"><span class="pr">${fe(FDI[s])}</span></a>` : '<span></span>';
    return `<article class="trow" data-s="${esc(s)}"><div class="tn"><h3><a class="stretch" href="${esc(taskHref(s))}">${esc(t.name)}</a></h3><span class="td" style="--a:${AINK[AREA_OF[t.d].k]}">${esc(t.d)}</span></div>
    <div class="tx">${main ? `<p>${esc(main)}</p>` : ''}${small ? `<p class="src">${small}</p>` : ''}</div>${pass}
    <div class="lk">${t.p ? `<a href="${esc(t.p)}" target="_blank" rel="noopener">${t.t ? t.src : 'Project'}</a>` : ''}${t.r ? `<a href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : ''}</div></article>`; }).join('')
    || `<p class="empty">No task matches. Clear the filter or try another word.</p>`;
  atEnd();
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
    // only about four neighbouring columns are in view at once, so the papers are dealt over four columns and the deal repeats:
    // every paper passes through the frame, whichever columns it shows
    let own = ts.filter((t, i) => i % 4 === c % 4); while (own.length < 8) own = own.concat(own);   // tall enough to cover the frame
    const list = own.map(card).join('');
    h += `<div class="pcol${c % 2 ? ' dn' : ''}" style="left:${(c - cols / 2) * (pw + gap)}px;top:${-(own.length * (pw * 1.3 + gap)) / 2 + (c % 3) * 40}px;animation-duration:${44 + (c % 4) * 7}s">${list}${list}</div>`;
  }
  $('#pplane').innerHTML = h;
}
drawPapers();

/* The private set (owner, 2026-10-10: a separate set of tasks that is not released; no count): task illustrations blurred
   past recognition, each under a lock, the same picture as the private-set post card. Decorative for assistive technology. */
(() => { const all = AREAS.flatMap(a => TASKS.filter(t => a.d.includes(t.d)).map(t => [t, a.k]));
  const lock = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="#3c4043"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#3c4043" stroke-width="2.2" stroke-linecap="round"/></svg>';
  $('#locked').innerHTML = Array.from({length:6}, (_, i) => all[Math.floor((i + .5) * all.length / 6)]).map(([t, k]) =>
    `<div class="lk-tile" style="background:${ART_FIELD[k]}"><div class="lk-art">${taskArt(t.s, k).replace('<svg class="art"', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"')}</div><span class="lk-lock">${lock}</span></div>`).join(''); })();
drawPassCost(); drawTable(); drawKebab(); drawLB(); drawPassBars(); drawECI(); drawTTS(); drawMap(); drawRows();
if (location.hash === '#kebab') { pcView('kebab'); $('#pcfig').scrollIntoView(); }
// labels are placed by measured text width, so draw again once the web font has loaded and the widths are final
if (document.fonts) document.fonts.ready.then(() => { drawPassCost(); drawLB(); drawPassBars(); drawECI(); drawTTS(); drawMap(); });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawPassCost(); drawLB(); drawPassBars(); drawECI(); drawTTS(); drawMap(); drawPapers(); redraws.forEach(f => f()); }, 120); });
