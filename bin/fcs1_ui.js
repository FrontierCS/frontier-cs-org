/* FrontierCS (v1) page: the two problem animations, leaderboard tabs and the sub-nav. */
(() => {
// three hues, each [dark, light], on the page's white
const HUES = __HUES__;
const INK = '#3c4043', dpr = () => window.devicePixelRatio || 1;
const mix = (a, b, t) => '#' + [1, 3, 5].map(k => Math.round(parseInt(a.substr(k, 2), 16) * (1 - t) + parseInt(b.substr(k, 2), 16) * t).toString(16).padStart(2, '0')).join('');
const LABEL = 40;   // the strip at the foot of a tile that holds its label
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = v => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v), lerp = (a, b, t) => a + (b - a) * t;
// a tile's canvas fills its figure; `paint(ctx, w, h, t)` draws one frame in CSS pixels, t in seconds (-1: the last frame, for reduced motion)
function tile(id, hue, paint) { const c = document.getElementById(id); if (!c) return;
  const ground = '#fff';
  let w = 0, h = 0, t0 = 0, on = false;
  const frame = now => { const r = dpr(); if (c.clientWidth !== w || c.clientHeight !== h) { w = c.clientWidth; h = c.clientHeight; c.width = w * r; c.height = h * r; }
    const g = c.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.fillStyle = ground; g.fillRect(0, 0, w, h);
    paint(g, w, h, reduced ? -1 : (now - t0) / 1000); if (on && !reduced) requestAnimationFrame(frame); };
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !on) { on = true; t0 = t0 || performance.now(); requestAnimationFrame(frame); } else if (!v) on = false; }).observe(c);
  addEventListener('resize', () => { if (!on || reduced) requestAnimationFrame(frame); }); }

// ---- Polyomino Packing (problem 0): one local search of ours, recorded at every improvement and replayed on a log clock.
// [iteration, score, W, H, placements], five characters per piece: orientation, then x and y in base 36.
// The pieces are regenerated here from the search's seed (bin/fcs1_search.js made the record).
const PK = __DATA__;
__GEN__
{ const pieces = pkInstance(PK.n, pkRng(PK.seed)).pieces, TONES = HUES.flat();
  for (const os of pieces) for (const o of os) { const has = new Set(o.c.map(c => c.join())); o.edges = [];   // the outline of each orientation, for the seams
    for (const [x, y] of o.c) { if (!has.has([x + 1, y].join())) o.edges.push([x + 1, y, 0, 1]); if (!has.has([x - 1, y].join())) o.edges.push([x, y, 0, 1]);
      if (!has.has([x, y + 1].join())) o.edges.push([x, y + 1, 1, 0]); if (!has.has([x, y - 1].join())) o.edges.push([x, y, 1, 0]); } }
  const snaps = PK.hist.map(([it, score, W, H, s]) => ({it, score, W, H, at: pieces.map((os, id) => ({o: os[+s[5 * id]], x: parseInt(s.substr(5 * id + 1, 2), 36), y: parseInt(s.substr(5 * id + 3, 2), 36)}))}));
  const STEP = .2, HOLD = 4, N = snaps.length - 1, label = document.getElementById('pklabel');
  tile('pktile', 0, (g, w, h, t) => { const f = t < 0 ? N : Math.min(N, (t % (N * STEP + HOLD)) / STEP), k = Math.min(N - 1, Math.floor(f)), a = ease(f - k), A = snaps[k], B = snaps[k + 1];
    // every packing is drawn on its side (the rectangles are taller than wide), and the view zooms in as the rectangle tightens
    const W = lerp(A.H, B.H, a), H = lerp(A.W, B.W, a), pad = 28, hh = h - LABEL, cell = Math.min((w - 2 * pad) / W, (hh - pad) / H), x0 = (w - W * cell) / 2, y0 = pad / 2 + (hh - H * cell) / 2;
    g.fillStyle = '#fff'; g.fillRect(x0, y0, W * cell, H * cell);
    const P = A.at.map((p, id) => { const q = B.at[id]; return {o: a < .5 ? p.o : q.o, x: lerp(p.y, q.y, a), y: lerp(p.x, q.x, a)}; });
    P.forEach((p, id) => { g.fillStyle = TONES[id % TONES.length]; for (const [cx, cy] of p.o.c) g.fillRect(x0 + (p.x + cy) * cell - .3, y0 + (p.y + cx) * cell - .3, cell + .6, cell + .6); });
    if (cell >= 4) { g.fillStyle = '#fff'; for (const p of P) for (const [ex, ey, dx, dy] of p.o.edges) g.fillRect(x0 + (p.x + ey) * cell - .5, y0 + (p.y + ex) * cell - .5, dy * cell + 1, dx * cell + 1); }
    g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x0 - 1, y0 - 1, W * cell + 2, H * cell + 2);
    label.firstChild.textContent = 'Score ' + lerp(A.score, B.score, a).toFixed(1); }); }

// ---- World Map (problem 6): two valid maps of one of the task's test cases (14 countries, 28 borders), a walk laid
// out one column per step and the same walk laid along diagonals. Both satisfy the checker's rule.
const WM = {"n":14,"e":[[1,2],[2,3],[2,4],[4,5],[5,6],[2,7],[7,8],[6,9],[4,10],[4,11],[7,12],[6,13],[13,14],[2,13],[11,14],[9,11],[1,8],[5,12],[7,14],[2,14],[4,6],[3,9],[5,10],[2,12],[6,11],[8,12],[5,8],[9,13]]};
function wmSequence(n, edges) {
  const adj = Array.from({length: n + 1}, () => []);
  edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const ord = new Array(n + 1).fill(-1), seq = []; let t = 0;
  const visit = (v, parent) => {
    ord[v] = t++;
    const back = adj[v].filter(u => ord[u] >= 0 && u !== parent);
    seq.push({c: v}); if (back.length) seq.push({c: v, sp: back}, {c: v});
    adj[v].forEach(u => { if (ord[u] < 0) { visit(u, v); seq.push({c: v}); } });
  };
  visit(1, 0);
  return seq;
}
// every tour entry is a full column; a vertex's remaining neighbours sit on alternate cells of one column of its colour
function wmRows(n, edges) {
  const seq = wmSequence(n, edges), K = Math.max(seq.length, ...seq.map(s => s.sp ? 2 * s.sp.length + 1 : 1));
  return Array.from({length: K}, (_, i) => Array.from({length: K}, (_, j) => {
    const s = seq[Math.min(j, seq.length - 1)];
    return s.sp && i % 2 === 1 && (i - 1) / 2 < s.sp.length ? s.sp[(i - 1) / 2] : s.c; }));
}
// the same tour laid along anti-diagonals: cells of one diagonal never touch, so a whole diagonal can hold neighbours
function wmDiagonal(n, edges) {
  const seq = wmSequence(n, edges);
  for (let K = Math.ceil((seq.length + 1) / 2); K <= 240; K++) {
    const D = 2 * K - 1, off = Math.floor((D - seq.length) / 2); let ok = true;
    const C = Array.from({length: K}, () => new Array(K));
    for (let d = 0; d < D && ok; d++) {
      const s = seq[Math.max(0, Math.min(seq.length - 1, d - off))], i0 = Math.max(0, d - K + 1), len = Math.min(d, K - 1) - i0 + 1;
      const sp = d - off >= 0 && d - off < seq.length ? s.sp : null;
      if (sp && sp.length > len) ok = false;
      for (let k = 0; k < len; k++) C[i0 + k][d - i0 - k] = sp && k < sp.length ? sp[k] : s.c;
    }
    if (ok) return C;
  }
  return wmRows(n, edges);
}
{ const maps = [wmRows(WM.n, WM.e), wmDiagonal(WM.n, WM.e)], K0 = maps[0].length, K1 = maps[1].length, label = document.getElementById('wmlabel');
  // each hue in five steps from its dark to near white: fifteen colours for the fourteen countries
  const PAL = HUES.flatMap(([d, l]) => [0, .3, .6, .85, 1.15].map(t => t <= 1 ? mix(d, l, t) : mix(l, '#ffffff', .5))), tone = c => PAL[(c * 4) % 15];
  const score = K => Math.max(0, Math.min(100, (6 - K / WM.n) / 4.5 * 100));
  const T = [3.2, 1.8, .9, 3.2, 4.4], CY = T.reduce((a, b) => a + b);   // draw the first map, hold, let it fade to an outline, draw the second inside it, hold
  tile('wmtile', 1, (g, w, h, t) => { const u = t < 0 ? CY - .01 : t % CY, hh = h - LABEL, pad = 28, cell = Math.min(w - 2 * pad, hh - pad) / K0;
    const box = K => [(w - K * cell) / 2, pad / 2 + (hh - K * cell) / 2], draw = (C, p, alpha, key) => { const K = C.length, [x0, y0] = box(K); g.globalAlpha = alpha;
      g.fillStyle = '#fff'; g.fillRect(x0, y0, K * cell, K * cell);
      for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) { const d = (p - key(i, j, K)) * 14; if (d <= 0) continue;   // a soft front sweeps across
        g.globalAlpha = alpha * Math.min(1, d); g.fillStyle = tone(C[i][j]); g.fillRect(x0 + j * cell - .3, y0 + i * cell - .3, cell + .6, cell + .6); }
      g.globalAlpha = alpha; g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x0 - 1, y0 - 1, K * cell + 2, K * cell + 2); g.globalAlpha = 1; };
    const t1 = T[0] + T[1], t2 = t1 + T[2], second = u >= t2;
    if (!second) draw(maps[0], ease(u / T[0]) * 1.08, u < t1 ? 1 : 1 - ease((u - t1) / T[2]), (i, j, K) => j / K);
    if (u >= t1) { const [x0, y0] = box(K0); g.globalAlpha = second ? 1 : ease((u - t1) / T[2]); g.setLineDash([5, 5]); g.strokeStyle = '#9aa0a6'; g.lineWidth = 1.5; g.strokeRect(x0, y0, K0 * cell, K0 * cell); g.setLineDash([]); g.globalAlpha = 1; }
    if (second) draw(maps[1], ease((u - t2) / T[3]) * 1.08, 1, (i, j, K) => (i + j) / (2 * K));
    const K = second ? K1 : K0; label.firstChild.textContent = `K = ${K} · score ${score(K).toFixed(1)}`; }); }

// ---- Permutation (problem 2): a hidden permutation, and queries answered only with the number of positions that match.
// A simple strategy of ours on n = 8: one pass with two values finds where 1 and 2 sit; after that 1 is a filler that
// can never match elsewhere, so each further value is found by halving the positions still unknown.
{ const HID = [3, 7, 1, 8, 5, 2, 6, 4], n = HID.length, steps = [], known = {}, ask = q => q.filter((v, i) => v === HID[i]).length;
  const push = (q, probe, v) => steps.push({q, probe, v, ans: ask(q), known: {...known}});
  for (let i = 0; i < n && !(1 in known && 2 in known); i++) { const q = HID.map((_, j) => j === i ? 1 : 2), a = ask(q);
    if (a === 2) known[1] = i; if (a === 0) known[2] = i; push(q, [i], 1); steps[steps.length - 1].known = {...known}; }
  for (let v = 3; v <= n; v++) { let cand = HID.map((_, i) => i).filter(i => !Object.values(known).includes(i));
    while (cand.length > 1) { const S = cand.slice(0, cand.length >> 1), q = HID.map((_, j) => S.includes(j) ? v : j === known[1] ? 2 : 1);
      cand = ask(q) ? S : cand.filter(i => !S.includes(i)); if (cand.length === 1) known[v] = cand[0]; push(q, S, v); steps[steps.length - 1].known = {...known}; }
    known[v] = cand[0]; if (v === n) steps[steps.length - 1].known = {...known}; }
  const STEP = .85, HOLD = 3.5, label = document.getElementById('pmlabel');
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  tile('pmtile', 2, (g, w, h, t) => { const f = t < 0 ? steps.length - .001 : Math.min(steps.length - .001, (t % (steps.length * STEP + HOLD)) / STEP), k = Math.floor(f), a = f - k, s = steps[k], before = k ? steps[k - 1].known : {};
    const hh = h - LABEL, gap = Math.max(4, Math.min(12, w / 60)), cw = Math.min(64, (w - 56 - (n - 1) * gap) / (n + 1.6)), x0 = (w - (n * cw + (n - 1) * gap) - cw * 1.6) / 2, y1 = hh / 2 - cw * 1.25, y2 = hh / 2 + cw * .45;
    const now = Object.fromEntries(Object.entries(s.known).map(([v, i]) => [i, +v])), was = Object.fromEntries(Object.entries(before).map(([v, i]) => [i, +v]));
    const qin = ease(a / .3), ain = ease((a - .35) / .2), turn = ease((a - .6) / .35);   // the query slides in, the answer appears, new cards turn over
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) { const x = x0 + i * (cw + gap), fresh = now[i] && !was[i], v = fresh ? (turn > .5 ? now[i] : 0) : now[i], hue = v && HUES[v % 3], sx = fresh ? Math.abs(1 - 2 * turn) : 1;
      g.save(); g.translate(x + cw / 2, 0); g.scale(Math.max(.04, sx), 1);                                                                  // the hidden permutation
      rr(g, -cw / 2, y1, cw, cw * 1.25, 8); g.fillStyle = v ? hue[1] : '#fff'; g.fill(); g.strokeStyle = v ? hue[0] : '#bdc1c6'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = v ? INK : '#9aa0a6'; g.font = `600 ${Math.round(cw * .42)}px 'Hanken Grotesk', sans-serif`; g.fillText(v || '?', 0, y1 + cw * .64); g.restore();
      const probe = s.probe.includes(i), dy = (1 - qin) * cw * .35; g.globalAlpha = qin;                                                    // the query
      rr(g, x + cw * .12, y2 + dy, cw * .76, cw * .76, 6); g.fillStyle = probe ? HUES[0][0] : '#fff'; g.fill(); if (!probe) { g.strokeStyle = '#dadce0'; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = probe ? '#fff' : '#5f6368'; g.font = `600 ${Math.round(cw * .34)}px 'Hanken Grotesk', sans-serif`; g.fillText(s.q[i], x + cw / 2, y2 + dy + cw * .4); g.globalAlpha = 1; }
    const ax = x0 + n * (cw + gap) + cw * .2; g.globalAlpha = ain; g.fillStyle = INK; g.font = `600 ${Math.round(cw * .34)}px 'Hanken Grotesk', sans-serif`; g.textAlign = 'left';
    g.fillText('→ ' + s.ans, ax, y2 + cw * .4); g.globalAlpha = 1;                                                                            // the answer: how many positions match
    label.firstChild.textContent = `${k + 1} ${k ? 'queries' : 'query'}`; }); }

// the hero terminal: one submission line per lap of the loop beside it (6 s a lap, five laps, then it starts over)
{ const lf = document.querySelector('.lf'), lines = lf ? [...lf.querySelectorAll('[data-k]')] : [];
  if (lf && !reduced) { lf.classList.add('live'); const t0 = performance.now();
    const tick = () => { const t = ((performance.now() - t0) / 1000) % 30;
      lines.forEach(l => l.classList.toggle('on', t >= (l.dataset.k - 1) * 6 + (l.classList.contains('tok') ? 4.8 : 3.4))); };
    tick(); setInterval(tick, 200); } }

// leaderboard tabs
const tabs = [...document.querySelectorAll('#lbtabs .chip')];
tabs.forEach(t => t.onclick = () => { tabs.forEach(x => x.setAttribute('aria-pressed', x === t ? 'true' : 'false'));
  document.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== t.dataset.t); });

// sub-nav scrollspy, as on the FrontierCS 2 page
const links = [...document.querySelectorAll('#subnav a')], secs = links.map(a => document.querySelector(a.getAttribute('href')));
const spy = () => { const bar = document.querySelector('.sub').getBoundingClientRect().bottom + 24, end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  const cur = end ? secs[secs.length - 1] : secs.filter(e => e.getBoundingClientRect().top <= bar).pop() || secs[0];
  links.forEach((a, i) => a.classList.toggle('on', secs[i] === cur)); };
addEventListener('scroll', spy, {passive: true}); spy();
})();
