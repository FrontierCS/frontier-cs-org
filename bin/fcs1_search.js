// FrontierCS (v1) page: the packing search behind the replay. node bin/fcs1_search.js <seed> <iterations> <out.json>,
// then python3 bin/fcs1_build.py <out.json> <iterations> assets/js/fcs1.js (the page uses seed 4, 1,000,000 iterations).
/* Polyomino Packing (FrontierCS algorithmic problem 0) as a live search: pieces are dropped in order at the first place
   they fit, and the search keeps changing the order and the width, keeping what makes the rectangle smaller. */
function pkRng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pkOrientations(cells) {
  const seen = new Map();
  for (let f = 0; f < 2; f++) for (let r = 0; r < 4; r++) {
    let c = cells.map(([x, y]) => { if (f) x = -x; for (let k = 0; k < r; k++) [x, y] = [y, -x]; return [x, y]; });
    const mx = Math.min(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1]));
    c = c.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    seen.set(c.join(';'), {c, w: Math.max(...c.map(p => p[0])) + 1, h: Math.max(...c.map(p => p[1])) + 1});
  }
  return [...seen.values()];
}
function pkInstance(n, R) {
  const pieces = []; let total = 0;
  for (let i = 0; i < n; i++) { const k = 1 + Math.floor(R() * 10), cells = [[0, 0]], has = new Set(['0,0']);
    while (cells.length < k) { const [x, y] = cells[Math.floor(R() * cells.length)], [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(R() * 4)];
      if (!has.has(`${x + dx},${y + dy}`)) { has.add(`${x + dx},${y + dy}`); cells.push([x + dx, y + dy]); } }
    pieces.push(pkOrientations(cells)); total += k; }
  return {pieces, total};
}
// Compaction search. Start: every piece in its own box on shelves. Step: lift one piece (usually one on the outer
// edge of the rectangle) and put it back where it reaches least far from the corner; keep the move if it reaches no farther.
function pkSearch(seed, n) {
  const R = pkRng(seed), inst = pkInstance(n, R), S = Math.ceil(Math.sqrt(inst.total) * 1.75), HM = 3 * S;
  const g = new Int16Array(S * HM).fill(-1), pos = [];
  let sx = 0, sy = 0, sh = 0;
  inst.pieces.forEach((os, id) => { const o = os[0]; if (sx + o.w > S) { sx = 0; sy += sh + 1; sh = 0; }
    pos[id] = {o, x: sx, y: sy}; for (const [cx, cy] of o.c) g[(sy + cy) * S + sx + cx] = id; sx += o.w + 1; sh = Math.max(sh, o.h); });
  const box = () => { let W = 0, H = 0; for (const p of pos) { W = Math.max(W, p.x + p.o.w); H = Math.max(H, p.y + p.o.h); } return [W, H]; };
  const snap = it => { const [W, H] = box(), cells = new Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells[y * W + x] = g[y * S + x];
    return [it, 100 * inst.total / (W * H), W, H, pos.map((p, i) => [inst.pieces[i].indexOf(p.o), p.x, p.y])]; };
  const reach = (x, y, o, W, H) => Math.max((x + o.w) / W, (y + o.h) / H);
  let [W, H] = box(), it = 1; const St = {inst, it: 1, hist: [snap(1)],
    step() { St.it = ++it; let id;
      let shake = 0;   // an inner piece may move a little outwards: that reshuffles the holes the edge pieces need
      if (R() < .75) { const edge = []; pos.forEach((p, i) => { if (p.x + p.o.w === W || p.y + p.o.h === H) edge.push(i); }); id = edge[Math.floor(R() * edge.length)]; }
      else { id = Math.floor(R() * n); shake = .06; }
      const p = pos[id]; for (const [cx, cy] of p.o.c) g[(p.y + cy) * S + p.x + cx] = -1;
      const old = reach(p.x, p.y, p.o, W, H) + (p.x + p.y) * 1e-4; let best = old + shake, to = null;
      for (const o of inst.pieces[id]) for (let y = 0; y + o.h <= H; y++) for (let x = 0; x + o.w <= W; x++) {
        const c = reach(x, y, o, W, H) + (x + y) * 1e-4 + R() * (shake || 2e-4); if (c >= best || (shake && (x + o.w === W || y + o.h === H))) continue; let ok = true;
        for (const [cx, cy] of o.c) if (g[(y + cy) * S + x + cx] >= 0) { ok = false; break; }
        if (ok) { best = c; to = {o, x, y}; } }
      if (to) pos[id] = to; const q = pos[id]; for (const [cx, cy] of q.o.c) g[(q.y + cy) * S + q.x + cx] = id;
      if (to) { const [w, h] = box(); if (w * h < W * H) { W = w; H = h; St.hist.push(snap(it)); return true; } W = w; H = h; }
      return false; } };
  return St;
}
const seed=+process.argv[2], N=+process.argv[3]; const S=pkSearch(seed,300); const t=Date.now(); for(let i=0;i<N;i++)S.step();
require('fs').writeFileSync(process.argv[4],JSON.stringify({seed,n:300,total:S.inst.total,hist:S.hist}));
console.log(Date.now()-t,'ms',S.hist.length,S.hist.slice(-6).map(h=>h[0]+':'+h[1].toFixed(1)).join(' '));
