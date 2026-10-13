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
const SECS = ['overview','leaderboard','tasks','cases','private','sponsors','questions'].map(id => document.getElementById(id));
let spyRaf = 0;
const spy = () => { spyRaf = 0;
  const bar = $('.sub').getBoundingClientRect().bottom + 24, end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const cur = end ? SECS[SECS.length - 1] : SECS.filter(e => e.getBoundingClientRect().top <= bar).pop() || SECS[0];
  subLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
  const on = subLinks.find(a => a.classList.contains('on')); on && reveal(on); };
addEventListener('scroll', () => { spyRaf ||= requestAnimationFrame(spy); }, {passive:true}); spy();

/* ---------- scroll-in animation ----------
   The mean-score, FECI and test-time scaling charts play once when they first come into view (owner, 2026-10-11): bars
   grow from 0, run dots appear one after another and then the mean (owner, 2026-10-11), curves are uncovered left to right.
   A chart starts once 65% of it is on screen, or, if it is taller than that, once it fills 65% of the window (owner: 30% was too early). A chart drawn again later (resize,
   fonts) is drawn still. Off with reduced motion, without IntersectionObserver, and for the thread cards (CHART_H). */
const shown = new Set(), moving = !matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window && !window.CHART_H;
const io = moving && new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting || (e.intersectionRatio < .65 && e.intersectionRect.height < innerHeight * .65)) return;
  const svg = e.target; io.unobserve(svg); shown.add(svg.id); svg.getBoundingClientRect();
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('pre'))); }), {threshold:[...Array(21).keys()].map(k => k / 20)});
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
function drawPassCost() {
  const svg = $('#pcsvg'), W = Math.max(300, $('#pcplot').clientWidth), narrow = W < 560;
  const L = 44, R = narrow ? 12 : 24, T = 14, B = 46, H = CHART_H.pc || (narrow ? 320 : 400);
  const ms = MODELS.filter(m => COST[m.id]), tx = ms.map(m => COST[m.id][0]);
  // the axis runs 0.15 decade past the outermost dots and no further (owner, 2026-10-10: half-decade rounding left
  // the range loose); an edge dot whose label has no room on its outer side takes another spot
  // (on phones the right side keeps more, so the labels of the dots near the right edge fit on their right)
  const x0 = Math.log10(Math.min(...tx)) - .15, x1 = Math.log10(Math.max(...tx)) + (narrow ? .74 : .15);
  const ymax = 100;   // the full scale, so the room left above the best model shows (owner, 2026-10-13)
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
  // the Pareto frontier: the models no cheaper model matches or beats on pass rate
  const front = [...ms].sort((p, q) => COST[p.id][0] - COST[q.id][0] || PASS[q.id][0] - PASS[p.id][0]).filter((m, i, a) => a.slice(0, i).every(o => PASS[o.id][0] < PASS[m.id][0]));
  order.forEach(m => {
    const [cx, cy] = at(m), name = narrow ? m.short : m.name;
    // the frontier reads from the dots themselves, with no line: a model on it has a larger dot and a bold name, a model
    // under it a smaller dot and a regular name, both at full colour (owner, 2026-10-13: keep the chart clean)
    const lead = front.includes(m);
    svg.append(sv('circle', {cx, cy, r:lead ? 7.5 : 5, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2, 'data-m':m.id}));
    const lab = sv('text', {class:'lab halo', x:cx, y:cy}, name); svg.append(lab);
    const w = lab.getComputedTextLength() + 2;
    // right, left, above, below, the four diagonals, then the same one and two lines further out; the first spot clear of every dot and placed label wins
    const spots = [[cx + 12, cy + 4.5, 'start'], [cx - 12, cy + 4.5, 'end'], [cx, cy - 13, 'middle'], [cx, cy + 22, 'middle'],
      [cx + 8, cy - 11, 'start'], [cx - 8, cy - 11, 'end'], [cx + 8, cy + 20, 'start'], [cx - 8, cy + 20, 'end'],
      [cx, cy - 31, 'middle'], [cx, cy + 40, 'middle'], [cx + 6, cy - 29, 'start'], [cx - 6, cy - 29, 'end'], [cx + 6, cy + 38, 'start'], [cx - 6, cy + 38, 'end'],
      [cx, cy - 49, 'middle'], [cx, cy + 58, 'middle'], [cx - 6, cy - 47, 'end'], [cx - 6, cy + 56, 'end']];
    const box = ([x, y, an]) => ({x:an === 'start' ? x : an === 'end' ? x - w : x - w / 2, y:y - 11, w, h:14});   // the glyphs' own height, so a label can sit beside its dot in a tight cluster
    const hit = q => boxes.some(o => q.x < o.x + o.w && o.x < q.x + q.w && q.y < o.y + o.h && o.y < q.y + q.h) || q.x < L || q.x + q.w > W || q.y < 0;
    const spot = spots.find(sp => !hit(box(sp)));
    if (spot) { boxes.push(box(spot)); lab.setAttribute('x', spot[0]); lab.setAttribute('y', spot[1]); lab.setAttribute('text-anchor', spot[2]);
      // a label wears its dot's colour, darkened to read on white, so a crowded patch still pairs each name with its dot
      lab.style.fill = `color-mix(in srgb, ${MCOL[m.id]} 78%, #000)`; if (lead) lab.style.fontWeight = 600; }
    else lab.remove();
    const pct = PASS[m.id][0];
    pts.push({x:cx, y:cy, mean:true, html:`<b>${esc(m.name)}</b><br>Pass rate <b>${f1(pct)}%</b><br>${usdfmt(COST[m.id][0])} per run, mean`});
  });
  attachTip(svg, W, H, pts, $('#pctip'));
}

/* On phones the model column is as wide as the longest model name, so every name shows in full (owner: "DeepSeek V4.1 Flash", not cut). */
const nameCol = svg => { svg.replaceChildren(); const w = Math.max(...MODELS.map(m => { const t = sv('text', {class:'lab', x:-999, y:-999}, m.short); svg.append(t); return t.getComputedTextLength(); })); svg.replaceChildren(); return Math.max(112, Math.ceil(w) + 12); };

/* FECI: one row per model ranked by ECI, a bar from 0 to its FECI and its 90% interval as a whisker. */
function drawECI() {
  const order = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
  const svg = $('#ecisvg'), W = Math.max(300, $('#eciplot').clientWidth), narrow = W < 560;
  const L = narrow ? nameCol(svg) : 190, R = 34, T = 14, B = 46, lane = CHART_H.eciLane || (narrow ? 56 : 64);
  const xmax = Math.ceil(Math.max(...MODELS.map(m => ECI[m.id][2])) / 20) * 20, step = narrow && xmax > 120 ? 40 : 20;
  const H = T + order.length * lane + B, an = animates(svg), bh = narrow ? 16 : 18;
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
    const bar = sv('rect', {class:'ebar', x:X(0), y:yc - bh / 2, width:Math.max(0, X(e) - X(0)), height:bh, fill:MCOL[m.id], 'data-m':m.id});
    const wk = sv('path', {class:'ewhisk', d:`M${X(lo)},${yc}H${X(hi)}M${X(lo)},${yc - 5}v10M${X(hi)},${yc - 5}v10`, fill:'none', stroke:'var(--ink)', 'stroke-width':1.5});
    const val = sv('text', {class:'val halo', x:X(e), y:yc - bh / 2 - 6, fill:MCOL[m.id], 'text-anchor':'middle'}, String(Math.round(e)));
    svg.append(bar, wk, val);
    if (an) { mark(bar, 'a-bar', i * .07); mark(wk, 'a-fade', .55 + i * .07); mark(val, 'a-fade', .55 + i * .07); }
    pts.push({x:X(e), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(e)}</b><br>90% interval ${Math.round(lo)}–${Math.round(hi)}`});
  });
  attachTip(svg, W, H, pts, $('#ecitip'));
}

/* Test-time scaling: FECI when every run stops at a US$ budget (SCALE, from bin/fcs2_runs_from_db.py).
   Every model's curve is drawn in its colour, with no band: eight 90% bands on one plot read as mud (owner, 2026-10-13).
   The legend is the control: hovering a name shows that model alone with its band, the others in light grey; a click takes
   a model off (grey) or puts it back. On first view the curves draw one after another, from the cheapest model to the
   dearest. Values below 0 leave the plot through its bottom edge. */
// A curve through every point with no overshoot (monotone cubic, Fritsch-Carlson, as d3's curveMonotoneX): between two
// samples it never goes above the higher or below the lower, so the smoothing adds no value the data does not have.
function smooth(P) {
  const n = P.length; if (n < 3) return P.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const dx = [], sl = []; for (let i = 0; i < n - 1; i++) { dx.push(P[i + 1][0] - P[i][0]); sl.push((P[i + 1][1] - P[i][1]) / (dx[i] || 1)); }
  const t = [sl[0]]; for (let i = 1; i < n - 1; i++) t.push(sl[i - 1] * sl[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / sl[i - 1] + (dx[i] + 2 * dx[i - 1]) / sl[i]));
  t.push(sl[n - 2]);
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3;
    d += `C${(P[i][0] + h).toFixed(1)},${(P[i][1] + h * t[i]).toFixed(1)} ${(P[i + 1][0] - h).toFixed(1)},${(P[i + 1][1] - h * t[i + 1]).toFixed(1)} ${P[i + 1][0].toFixed(1)},${P[i + 1][1].toFixed(1)}`; }
  return d;
}
// The curves plotted are the running maximum of SCALE over the budget (value and both ends of its interval): the best level a
// model has reached by that budget. The converter already holds each run at its best development score so far, capped
// at its hidden final score; the running maximum here only removes what little the capability fit can still wobble.
const TTS = Object.fromEntries(Object.entries(SCALE).map(([id, c]) => { let v = -Infinity, lo = -Infinity, hi = -Infinity;
  return [id, c.map(p => [p[0], v = Math.max(v, p[1]), lo = Math.max(lo, p[2]), hi = Math.max(hi, p[3]), p[4]])]; }));
const TTS_Y0 = 40, ttsOn = new Set(RANKED.filter(m => SCALE[m.id]).map(m => m.id));
let ttsHover = null;
function drawTTS() {
  const svg = $('#ttssvg'), W = Math.max(300, $('#ttsplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = CHART_H.tts || (narrow ? 300 : 380);
  const all = Object.values(TTS).flat(), shown = m => ttsHover ? ttsHover === m.id : ttsOn.has(m.id), band1 = m => ttsHover === m.id || ttsOn.size === 1 && ttsOn.has(m.id);
  // the axis starts a little before the first budget at which any model rises above 0
  const x0 = Math.log10(Math.min(...all.filter(p => p[1] >= 0).map(p => p[0]))) - 0.3, x1 = Math.log10(Math.max(...all.map(p => p[0])));
  const ymax = Math.max(65, Math.ceil((Math.max(...all.map(p => p[1])) + 2) / 5) * 5);
  // the value axis widens as it goes up: 0 to 40 takes the bottom 10% of the plot, 40 to 50 the next 10%, 50 to 60 the next
  // 26%, and 60 to the top the remaining 54%, since the curves finish and crowd between 50 and 70; each curve's climb
  // from 0 still shows (owner, 2026-10-13)
  const KN = [[0, 0], [TTS_Y0, .10], [50, .20], [60, .46], [ymax, 1]];
  const yf = v => { let i = 1; while (i < KN.length - 1 && v > KN[i][0]) i++; const [a, fa] = KN[i - 1], [b, fb] = KN[i]; return fa + (v - a) / (b - a) * (fb - fa); };
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - yf(v)) * (H - T - B);
  const an = animates(svg);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const clip = sv('clipPath', {id:'ttsclip'}), cr = sv('rect', {x:L, y:T - 4, width:W - L - R + 11, height:H - T - B + 5}); clip.append(cr); svg.append(clip);
  for (const v of [0, 20, 40, ...Array.from({length:(ymax - 50) / 5 + 1}, (_, i) => 50 + i * 5)]) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:v === 50 || v === 60 ? 'var(--line)' : 'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let k = Math.ceil(x0); k <= Math.floor(x1); k++) {
    svg.append(sv('line', {x1:X(10 ** k), x2:X(10 ** k), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(10 ** k), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(10 ** k)));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost budget per run in US$, log scale'));
  const g = sv('g', {'clip-path':'url(#ttsclip)'}); svg.append(g);
  const pts = [], ms = [...RANKED].reverse().filter(m => SCALE[m.id]);   // a model with no reported spend has no curve
  const ends = [];
  const seq = [...ms].sort((p, q) => TTS[p.id].at(-1)[0] - TTS[q.id].at(-1)[0]).map(m => m.id);   // drawing order: by final spend
  // the grey curves first, then the picked ones over them, the leader last
  [...ms.filter(m => !shown(m)), ...ms.filter(shown)].forEach(m => {
    const c = TTS[m.id], on = shown(m), path = smooth(c.map(p => [X(p[0]), Y(p[1])]));
    const e = c[c.length - 1];
    const focus = band1(m);
    if (focus) {   // the band's edges take the same curve as the line
      const hi = smooth(c.map(p => [X(p[0]), Y(p[3])])), lo = smooth([...c].reverse().map(p => [X(p[0]), Y(p[2])]));
      g.append(sv('path', {d:hi + 'L' + lo.slice(1) + 'Z', fill:MCOL[m.id], opacity:.13}));
    }
    // a white casing under each line keeps crossings legible; the line itself has round ends and joins
    const wd = !on ? 1.5 : focus ? 3.6 : 2.8;
    if (on) g.append(mark(sv('path', {d:path, pathLength:1, fill:'none', stroke:'#fff', 'stroke-width':wd + 3, 'stroke-linejoin':'round', 'stroke-linecap':'round'}), 'a-draw', an ? .15 + seq.indexOf(m.id) * .42 : 0));
    const lp = sv('path', {d:path, pathLength:1, fill:'none', stroke:on ? MCOL[m.id] : '#c9ccd1', 'stroke-width':wd, 'stroke-linejoin':'round', 'stroke-linecap':'round'});
    // the end of a curve: the same white-ringed dot as on the pass-rate chart
    const end = sv('circle', {cx:X(e[0]), cy:Y(e[1]), r:!on ? 3 : focus ? 7.5 : 6.5, fill:on ? MCOL[m.id] : '#c9ccd1', stroke:'#fff', 'stroke-width':on ? 2 : 1});
    g.append(lp); ends.push(end);   // the dots go on last, over every line
    if (an) { const t0 = .15 + seq.indexOf(m.id) * .42; mark(lp, 'a-draw', t0); mark(end, 'a-fade', t0 + .8); }   // one curve after another
    c.forEach(p => { if (p[1] >= 0) pts.push({x:X(p[0]), y:Y(p[1]), html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(p[1])}</b> at ${usdfmt(p[0])} per run`
      + `<br>90% interval ${Math.round(Math.max(p[2], 0))}–${Math.round(p[3])}<br>${Math.round(p[4] * 100)}% of runs still going`}); });
  });
  g.append(...ends);
  attachTip(svg, W, H, pts, $('#ttstip'));
  $('#ttslegend').querySelectorAll('button').forEach(b => { const on = ttsOn.has(b.dataset.m); b.setAttribute('aria-pressed', on); b.classList.toggle('off', !on); });
}
// the legend is the chart's control: a button per model, in its colour when picked
$('#ttslegend').innerHTML = RANKED.filter(m => SCALE[m.id]).map(m => `<button type="button" data-m="${m.id}"><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</button>`).join('');
$('#ttslegend').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const id = b.dataset.m;
  if (ttsOn.has(id)) ttsOn.delete(id); else ttsOn.add(id); ttsHover = null; drawTTS(); });
$('#ttslegend').addEventListener('pointerover', e => { const b = e.target.closest('button'); if (!b || e.pointerType !== 'mouse' || ttsHover === b.dataset.m) return; ttsHover = b.dataset.m; drawTTS(); });
$('#ttslegend').addEventListener('pointerleave', () => { if (ttsHover) { ttsHover = null; drawTTS(); } });

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
  const lane = group === 'model' ? (CHART_H.lbLane || (narrow ? 64 : 76)) : 30;
  const rowH = () => lane;
  const H = T + rows.reduce((a, r) => a + rowH(r), 0) + B, an = animates(svg) && group === 'model';
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
      // the play: this row's run dots pop in one after another, lowest score first, over 1.1 s, rows 0.06 s apart; then the range line, the mean and its value
      const d = ri * .06, dn = 1.1 / Math.max(1, it.runs.length), dm = d + 1.25, rank = new Map([...it.runs].sort((a, b) => a.s - b.s).map((x, k) => [x, k]));
      if (ss.length > 1) { const rg = sv('line', {x1:X(Math.min(...ss)), x2:X(Math.max(...ss)), y1:yc, y2:yc, stroke:MCOL[it.m], 'stroke-width':2, opacity:.35});
        svg.append(rg); if (an) mark(rg, 'a-fade', dm - .2); }
      if (showRuns) it.runs.forEach((x, j) => {
        const jy = ((j * 37) % 17 - 8) * (narrow ? .9 : 1.2);
        const c = sv('circle', {cx:X(x.s), cy:yc + jy, r:4.5, fill:MCOL[it.m], opacity:.4});
        svg.append(c); if (an) mark(c, 'a-pop', d + rank.get(x) * dn); pts.push({x:X(x.s), y:yc + jy, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(x.t)} · ${esc(x.d)}<br>Final score <b>${f1(x.s)}</b>`});
      });
      const dot = sv('circle', {cx:X(mu), cy:yc, r:8, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':2});
      pts.push({x:X(mu), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>Mean <b>${f1(mu)}</b>`, mean:true});
      // the mean sits above its own dot, with a white halo over the run dots
      const val = sv('text', {class:'val halo', x:X(mu), y:yc - 15, fill:MCOL[it.m], 'text-anchor':'middle'}, f1(mu));
      svg.append(dot, val);
      if (an) { mark(dot, 'a-pop', dm); mark(val, 'a-fade', dm + .15); }
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

/* ---------- How FECI works: a fold under the FECI chart (owner, 2026-10-11) ----------
   A: three tasks' fitted curves, expected score = 100 / (1 + exp(-k (FECI - d))) from TFIT, picked in code as the tasks
   with a clear S (k >= 0.03) whose difficulty is nearest 20, 60 and 110, so the picture follows the data.
   (owner, 2026-10-11: the second step, task difficulties beside the models' FECI, is gone) */
function drawHow() {
  const box = $('#feci-how'); if (!box || !box.open) return;
  const fits = Object.entries(TFIT), clear = fits.filter(([, [, k]]) => k >= .03);
  const counts = RANKED.map(m => ECI[m.id][3]);
  $('#how-ntasks').textContent = `${Math.min(...counts)} to ${Math.max(...counts)}`;
  $('#how-nall').textContent = fits.length;
  $('#how-dmax').textContent = Math.round(Math.max(...fits.map(([, [d]]) => d)));
  const INKS = ['#8ab4f8', '#1a73e8', '#174ea6'];   // easy to hard: Google blue 300, 600, 900
  // A
  let svg = $('#howasvg'), W = Math.max(300, $('#howaplot').clientWidth), narrow = W < 560;
  let L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 240 : 270;
  const X = v => L + v / 160 * (W - L - R), Y = v => T + (1 - v / 100) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= 100; v += 25) { svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1})); svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v)); }
  for (let v = 0; v <= 160; v += 40) svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, v));
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FECI'));
  const picks = [20, 60, 110].map(t => clear.slice().sort((a, b) => Math.abs(a[1][0] - t) - Math.abs(b[1][0] - t))[0]);
  const pts = [];
  picks.forEach(([s, [d, k]], i) => {
    const f = x => 100 / (1 + Math.exp(-k * (x - d)));
    svg.append(sv('path', {d:Array.from({length:161}, (_, x) => `${x ? 'L' : 'M'}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(''), fill:'none', stroke:INKS[i], 'stroke-width':2.5}));
    svg.append(sv('circle', {cx:X(d), cy:Y(50), r:5, fill:INKS[i], stroke:'#fff', 'stroke-width':2}));   // the difficulty: expected score 50
    for (let x = 0; x <= 160; x += 4) pts.push({x:X(x), y:Y(f(x)), html:`<b>${esc(NAME(s))}</b><br>Difficulty ${f1(d)}, slope ${k.toFixed(3)}<br>At FECI ${x}: expected score <b>${f1(f(x))}</b>`});
  });
  attachTip(svg, W, H, pts, $('#howatip'));
  $('#howalegend').innerHTML = picks.map(([s, [d]], i) => `<span><i style="background:${INKS[i]}"></i>${esc(NAME(s))}, difficulty ${Math.round(d)}</span>`).join('');
}
$('#feci-how').addEventListener('toggle', drawHow);
redraws.push(drawHow);

/* ---------- questions ---------- */
const fqHash = () => { const d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({block:'start'}); } };
addEventListener('hashchange', fqHash); fqHash();

/* ---------- task index ---------- */
let picked = new Set(), q = '', limit = 5;
$('#checks').innerHTML = DOMAINS.map(d => `<label><input type="checkbox" value="${esc(d)}"> ${esc(d)} (${N_IN(d)})</label>`).join('');
$('#checks').addEventListener('change', e => { e.target.checked ? picked.add(e.target.value) : picked.delete(e.target.value); limit = 5; drawRows(); });
$('#ftoggle').addEventListener('click', () => { const f = $('#filter'), o = !f.classList.contains('open'); f.classList.toggle('open', o); $('#ftoggle').setAttribute('aria-expanded', String(o)); });
$('#q').addEventListener('input', e => { q = e.target.value; limit = 5; drawRows(); });
$('#showmore').addEventListener('click', () => { limit += 20; drawRows(); });
function hits() {
  const w = q.toLowerCase().split(/\s+/).filter(Boolean);
  let h = TASKS.filter(t => (!picked.size || picked.has(t.d)) && w.every(x => (t.s + ' ' + t.name + ' ' + t.t + ' ' + t.n + ' ' + t.d).toLowerCase().includes(x)));
  // hardest first by the FECI fit's task difficulty (owner, 2026-10-11); tasks without runs have none and follow by domain
  const dif = t => TDIFF[t.s] ? -TDIFF[t.s].rank : null;   // hardest first, by the pass/fail difficulty (TDIFF)
  return [...h].sort((a, b) => (dif(b) ?? -1e9) - (dif(a) ?? -1e9) || DOMAINS.indexOf(a.d) - DOMAINS.indexOf(b.d) || a.s.localeCompare(b.s));
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
const CHIP_SHORT = {'Programming Languages':'Languages', 'Machine Learning':'ML', 'Bioinformatics':'Bio', 'Cryptography':'Crypto', 'Architecture':'Arch'};   // map chips only, where the full name does not fit
function drawMap() {
  stopPlay(false);
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
    if (KEYM[s]) { panel.append(sv('text', {x:p.x + PX, y:y + 12, 'font-size':11.5, 'font-weight':500, fill:'#fff', 'fill-opacity':.75, 'letter-spacing':'.04em'}, 'SCORED ON'));
      // one row per metric: a small line icon for its kind, then its plain name
      KEYM[s].forEach(([ic, label], i) => { const cy = y + 33 + i * 22, ix = p.x + PX + 8;
        panel.append(sv('path', {d:KEY_ICON[ic](ix, cy), fill:'none', stroke:'#fff', 'stroke-width':1.6, 'stroke-linecap':'round', 'stroke-linejoin':'round'}),
          sv('text', {x:ix + 16, y:cy + 5, 'font-size':14.5, 'font-weight':500, fill:'#fff'}, label)); }); }
    if (t.t) lines(t.t, p.y + p.h - 34 - (wrapText(svg, t.t, inner, 12.5, 400).length > 1 ? 17 : 0), 12.5, 400, 17, 2, .8);   // the source sits at the foot of the card
  } else if (p.k === 1) {   // every model: a tick or a cross in a disc, then its name; two columns, in leaderboard order
    const rs = RANKED.map(m => [m, p.runs.find(r => r.m === m.id)]).filter(x => x[1]), half = Math.ceil(rs.length / 2), lh = Math.min(30, (p.h - 96) / half);
    panel.append(sv('text', {x:p.x + PX, y:top + 4, 'font-size':13, 'font-weight':500, fill:'#fff', 'fill-opacity':.85}, `${rs.filter(x => x[1].p).length} of ${rs.length} models pass`));
    rs.forEach(([m, r], i) => { const cx = p.x + PX + 9 + (i >= half ? inner / 2 + 6 : 0), cy = top + 30 + (i % half) * lh, R = 8.5;
      panel.append(sv('circle', {cx, cy, r:R, fill:r.p ? '#fff' : 'none', stroke:'#fff', 'stroke-width':1.6, 'stroke-opacity':r.p ? 1 : .8}),
        sv('path', {d:r.p ? `M${cx - R * .46},${cy + R * .04}l${R * .32},${R * .34}l${R * .6},${-R * .7}` : `M${cx - R * .36},${cy - R * .36}l${R * .72},${R * .72}M${cx + R * .36},${cy - R * .36}l${-R * .72},${R * .72}`,
          fill:'none', stroke:r.p ? field : '#fff', 'stroke-width':2, 'stroke-linecap':'round', 'stroke-linejoin':'round', 'stroke-opacity':r.p ? 1 : .85}),
        sv('text', {x:cx + 17, y:cy + 4.5, 'font-size':13.5, 'font-weight':r.p ? 600 : 400, fill:'#fff', 'fill-opacity':r.p ? 1 : .85}, narrow ? m.short : m.name)); });
  } else {   // difficulty by who passes (TDIFF): the rank, and a strip with every task in rank order and this one as a disc
    const D = TDIFF[s], N = Object.keys(TDIFF).length;
    panel.append(sv('text', {x:p.x + PX, y:top + 4, 'font-size':13, 'font-weight':500, fill:'#fff', 'fill-opacity':.85}, 'Difficulty'));
    if (!D) panel.append(sv('text', {x:p.x + PX, y:top + 52, 'font-size':16, fill:'#fff'}, 'No runs yet'));
    else { const rank = D.rank, X = r => p.x + PX + (N - r) / (N - 1 || 1) * inner, sy = p.y + p.h - 74;
      const ord = `${rank}${[, 'st', 'nd', 'rd'][rank % 100 > 10 && rank % 100 < 14 ? 0 : rank % 10] || 'th'}`;
      panel.append(sv('text', {x:p.x + PX, y:top + 62, 'font-size':52, 'font-weight':600, fill:'#fff'}, rank === 1 ? 'Hardest' : ord),
        sv('text', {x:p.x + PX, y:top + 90, 'font-size':14, fill:'#fff', 'fill-opacity':.92}, `${rank === 1 ? '' : 'hardest '}of ${N} tasks · ${D.pass} of ${D.n} models pass`),
        sv('line', {x1:p.x + PX, x2:p.x + PX + inner, y1:sy, y2:sy, stroke:'#fff', 'stroke-opacity':.45, 'stroke-width':1.5}));
      for (let r = 1; r <= N; r++) panel.append(sv('line', {x1:X(r), x2:X(r), y1:sy - 5, y2:sy + 5, stroke:'#fff', 'stroke-opacity':.5, 'stroke-width':1.5}));
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
  }, p.k === 0 ? 4200 : 3200);
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
  $('#rows').innerHTML = h.slice(0, limit).map(t => `<article class="trow" data-s="${esc(t.s)}"><span class="tag">${esc(t.d)}</span>
    <h3><a class="stretch" href="${esc(taskHref(t.s))}">${esc(t.name)}</a></h3><p>${esc(t.t)}</p><div class="lk">${t.p ? `<a href="${esc(t.p)}" target="_blank" rel="noopener">${t.t ? t.src : 'Project'}</a>` : '<span>No paper link</span>'}${t.r ? `<a href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : ''}</div></article>`).join('')
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
drawPassCost(); drawTable(); drawLB(); drawECI(); drawTTS(); drawMap(); drawRows();
// labels are placed by measured text width, so draw again once the web font has loaded and the widths are final
if (document.fonts) document.fonts.ready.then(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); drawPapers(); redraws.forEach(f => f()); }, 120); });
