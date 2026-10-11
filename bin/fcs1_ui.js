/* FrontierCS (v1) page: the two problem animations, leaderboard tabs and the sub-nav. */
(() => {
// three hues, each [dark, light], on a soft ground
const HUES = __HUES__;
const FIELD = '#f1f3f4', DEEP = '#ffffff', INK = '#3c4043', dpr = () => window.devicePixelRatio || 1;
const LABEL = 64;   // the strip at the foot of a tile that holds its label
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// a tile's canvas fills its figure; `paint(ctx, w, h, t)` draws one frame in CSS pixels, t in seconds (-1: the last frame, for reduced motion)
function tile(id, paint) { const c = document.getElementById(id); if (!c) return;
  let w = 0, h = 0, t0 = 0, on = false;
  const frame = now => { const r = dpr(); if (c.clientWidth !== w || c.clientHeight !== h) { w = c.clientWidth; h = c.clientHeight; c.width = w * r; c.height = h * r; }
    const g = c.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.fillStyle = FIELD; g.fillRect(0, 0, w, h);
    paint(g, w, h, reduced ? -1 : (now - t0) / 1000); if (on && !reduced) requestAnimationFrame(frame); };
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !on) { on = true; t0 = t0 || performance.now(); requestAnimationFrame(frame); } else if (!v) on = false; }).observe(c);
  addEventListener('resize', () => { if (!on || reduced) requestAnimationFrame(frame); }); }

// ---- Polyomino Packing (problem 0): one local search of ours, recorded at every improvement and replayed on a log clock.
// [iteration, score, W, H, placements], five characters per piece: orientation, then x and y in base 36.
// The pieces are regenerated here from the search's seed (bin/fcs1_search.js made the record).
const PK = __DATA__;
__GEN__
{ const pieces = pkInstance(PK.n, pkRng(PK.seed)).pieces, TONES = HUES.flat();
  const snaps = PK.hist.map(([it, score, W, H, s]) => { const g = new Int16Array(W * H).fill(-1);
    pieces.forEach((os, id) => { const o = os[+s[5 * id]], x = parseInt(s.substr(5 * id + 1, 2), 36), y = parseInt(s.substr(5 * id + 3, 2), 36);
      for (const [cx, cy] of o.c) g[(y + cy) * W + x + cx] = id; });
    return {it, score, W, H, g}; });
  const L = Math.log10(PK.iters), RUN = 14, HOLD = 4, label = document.getElementById('pklabel');
  tile('pktile', (g, w, h, t) => { const u = t < 0 ? 1 : Math.min(1, (t % (RUN + HOLD)) / RUN), it = 10 ** (u * L); let k = 0; while (k + 1 < snaps.length && snaps[k + 1].it <= it) k++;
    const r = snaps[k], flip = r.H > r.W, s = flip ? {W: r.H, H: r.W, g: {}} : r, at = (x, y) => flip ? r.g[x * r.W + y] : r.g[y * r.W + x];   // drawn on its side when taller than wide
    const pad = 28, hh = h - LABEL, cell = Math.max(1, Math.floor(Math.min((w - 2 * pad) / s.W, (hh - pad) / s.H))), x0 = Math.round((w - s.W * cell) / 2), y0 = Math.round(pad / 2 + (hh - s.H * cell) / 2);
    g.fillStyle = DEEP; g.fillRect(x0, y0, s.W * cell, s.H * cell);
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) { const id = at(x, y); if (id < 0) continue; g.fillStyle = TONES[id % TONES.length]; g.fillRect(x0 + x * cell, y0 + y * cell, cell, cell); }
    if (cell >= 4) { g.fillStyle = '#fff';   // seams between different pieces
      for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) { const id = at(x, y);
        if (x + 1 < s.W && at(x + 1, y) !== id) g.fillRect(x0 + (x + 1) * cell - .5, y0 + y * cell, 1, cell);
        if (y + 1 < s.H && at(x, y + 1) !== id) g.fillRect(x0 + x * cell, y0 + (y + 1) * cell - .5, cell, 1); } }
    g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x0 - 1, y0 - 1, s.W * cell + 2, s.H * cell + 2);
    label.firstChild.textContent = 'Score ' + r.score.toFixed(1); label.lastChild.textContent = `${s.W} × ${s.H} · iteration ${Math.round(it).toLocaleString('en-US')}`; }); }

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
{ const maps = [wmRows(WM.n, WM.e), wmDiagonal(WM.n, WM.e)], K0 = maps[0].length, label = document.getElementById('wmlabel');
  // each hue in five steps from its dark to near white: fifteen colours for the fourteen countries
  const mix = (a, b, t) => '#' + [1, 3, 5].map(k => Math.round(parseInt(a.substr(k, 2), 16) * (1 - t) + parseInt(b.substr(k, 2), 16) * t).toString(16).padStart(2, '0')).join('');
  const PAL = HUES.flatMap(([d, l]) => [0, .3, .6, .85, 1.15].map(t => t <= 1 ? mix(d, l, t) : mix(l, '#ffffff', .5))), tone = c => PAL[(c * 4) % 15];
  const score = K => Math.max(0, Math.min(100, (6 - K / WM.n) / 4.5 * 100)), ease = v => v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v);
  const T = [3.5, 2.5, 3.5, 4.5], CY = T.reduce((a, b) => a + b);   // draw the first, hold, draw the second, hold
  tile('wmtile', (g, w, h, t) => { const u = t < 0 ? CY - .01 : t % CY, second = u >= T[0] + T[1], C = maps[second ? 1 : 0], K = C.length, pad = 28;
    const hh = h - LABEL, cell = Math.max(1, Math.floor(Math.min(w - 2 * pad, hh - pad) / K0)), x0 = Math.round((w - K * cell) / 2), y0 = Math.round(pad / 2 + (hh - K * cell) / 2);
    const p = ease(second ? (u - T[0] - T[1]) / T[2] : u / T[0]);   // the first map appears column by column, the second diagonal by diagonal
    g.fillStyle = DEEP; g.fillRect(x0, y0, K * cell, K * cell);
    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) { if ((second ? (i + j) / (2 * K - 2) : j / (K - 1)) > p) continue; g.fillStyle = tone(C[i][j]); g.fillRect(x0 + j * cell, y0 + i * cell, cell, cell); }
    g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x0 - 1, y0 - 1, K * cell + 2, K * cell + 2);
    label.firstChild.textContent = 'Score ' + score(K).toFixed(1); label.lastChild.textContent = `K = ${K} for ${WM.n} countries`; }); }

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
  const STEP = .55, HOLD = 3.5, label = document.getElementById('pmlabel');
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  tile('pmtile', (g, w, h, t) => { const k = t < 0 ? steps.length - 1 : Math.min(steps.length - 1, Math.floor((t % (steps.length * STEP + HOLD)) / STEP)), s = steps[k];
    const hh = h - LABEL, gap = Math.max(4, Math.min(12, w / 60)), cw = Math.min(64, (w - 56 - (n - 1) * gap) / (n + 1.6)), x0 = (w - (n * cw + (n - 1) * gap) - cw * 1.6) / 2, y1 = hh / 2 - cw * 1.25, y2 = hh / 2 + cw * .45;
    const at = Object.fromEntries(Object.entries(s.known).map(([v, i]) => [i, +v]));
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) { const x = x0 + i * (cw + gap), v = at[i], hue = v && HUES[v % 3];
      rr(g, x, y1, cw, cw * 1.25, 8); g.fillStyle = v ? hue[1] : '#fff'; g.fill(); g.strokeStyle = v ? hue[0] : '#bdc1c6'; g.lineWidth = 1.5; g.stroke();   // the hidden permutation
      g.fillStyle = v ? INK : '#9aa0a6'; g.font = `600 ${Math.round(cw * .42)}px 'Hanken Grotesk', sans-serif`; g.fillText(v || '?', x + cw / 2, y1 + cw * .64);
      const probe = s.probe.includes(i); rr(g, x + cw * .12, y2, cw * .76, cw * .76, 6); g.fillStyle = probe ? HUES[0][0] : '#e8eaed'; g.fill();                  // the query
      g.fillStyle = probe ? '#fff' : '#5f6368'; g.font = `600 ${Math.round(cw * .34)}px 'Hanken Grotesk', sans-serif`; g.fillText(s.q[i], x + cw / 2, y2 + cw * .4); }
    const ax = x0 + n * (cw + gap) + cw * .2; g.fillStyle = INK; g.font = `600 ${Math.round(cw * .34)}px 'Hanken Grotesk', sans-serif`; g.textAlign = 'left';
    g.fillText('→ ' + s.ans, ax, y2 + cw * .4);                                                                                                                      // the answer: how many positions match
    label.firstChild.textContent = `${k + 1} ${k ? 'queries' : 'query'}`; label.lastChild.textContent = `${Object.keys(s.known).length} of ${n} positions known`; }); }

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
