/* One illustration per task, after Epoch AI's article thumbnails: a full-bleed field in the task's domain hue, one large
   motif in thick strokes of a lighter tone of that hue, a few white accents on what the task is about, a faint dot grid.
   viewBox 300 x 200, deterministic (a seeded generator per task), no text. */
// the task map's hues (AFILL / AINK), inverted: field = the 600 tone, motif = 300, nodes = 200, accents white (owner, 2026-10-09)
(() => {
const HUE = {sys:['#1a73e8','#8ab4f8','#aecbfa','#fff'], ml:['#1e8e3e','#81c995','#a8dab5','#fff'], pl:['#9334e6','#c58af9','#d7aefb','#fff'],
  sec:['#d93025','#f28b82','#f6aea9','#fff'], db:['#e37400','#fcc934','#fdd663','#fff'], rb:['#5f6368','#bdc1c6','#dadce0','#fff']};
function rng(seed) { let a = 0; for (const ch of seed) a = (a * 31 + ch.charCodeAt(0)) | 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const at = o => Object.entries(o).map(([k, v]) => `${k}="${typeof v === 'number' ? +v.toFixed(1) : v}"`).join(' ');
const C = (x, y, r, o = {}) => `<circle ${at({cx:x, cy:y, r, ...o})}/>`;
const Pa = (d, o = {}) => `<path ${at({d, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round', ...o})}/>`;
const Rc = (x, y, w, h, o = {}) => `<rect ${at({x, y, width:w, height:h, ...o})}/>`;
const r1 = v => +v.toFixed(1);
const arc = (cx, cy, r, a0, a1) => `M${r1(cx + r * Math.cos(a0))},${r1(cy + r * Math.sin(a0))}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r1(cx + r * Math.cos(a1))},${r1(cy + r * Math.sin(a1))}`;
const W = 300, H = 200; let WHITE = '#fff';   // the accent colour, set per task to its domain's ink

const ART = {
  // a query point and its nearest neighbours: rings of distance around the query, white dots on the four nearest
  'knn kernel'(R, [bg, s1, s2]) {
    const q = [118, 104]; let g = '';
    for (let r = 16; r < 260; r += 15) { let a = R() * 6.28; const end = a + 6.28;
      while (a < end) { const len = .25 + R() * 1.1, gap = .12 + R() * .35; g += Pa(arc(q[0], q[1], r, a, Math.min(a + len, end - .05)), {stroke:s1, 'stroke-width':6}); a += len + gap; } }
    const nb = [[16, -2.3], [31, .5], [31, 2.6], [46, -.9]].map(([r, a]) => [q[0] + r * Math.cos(a), q[1] + r * Math.sin(a)]);
    return g + nb.map(p => C(p[0], p[1], 7, {fill:WHITE})).join('') + C(q[0], q[1], 10, {fill:WHITE});
  },
  // a lattice from a skewed basis, a target off the lattice in white, and the closest lattice point it must find
  'Structured LWE'(R, [bg, s1, s2]) {
    let g = ''; const b1 = [38, 11], b2 = [14, 34];
    for (let i = -6; i < 12; i++) for (let j = -4; j < 9; j++) { const x = -20 + i * b1[0] + j * b2[0], y = -10 + i * b1[1] + j * b2[1];
      if (x > -10 && x < W + 10 && y > -10 && y < H + 10) g += Pa(`M${r1(x - 7)},${r1(y)}H${r1(x + 7)}M${r1(x)},${r1(y - 7)}V${r1(y + 7)}`, {stroke:s1, 'stroke-width':5}); }
    const o = [-20 + 4 * 38 + 2 * 14, -10 + 4 * 11 + 2 * 34], t = [o[0] + 17, o[1] + 12];
    return g + C(o[0], o[1], 15, {fill:'none', stroke:WHITE, 'stroke-width':4}) + Pa(`M${t}L${o[0] + 6},${o[1] + 4}`, {stroke:WHITE, 'stroke-width':3, 'stroke-dasharray':'2 6'}) + C(t[0], t[1], 8, {fill:WHITE});
  },
  // an expression tree in thick branches; two of its nodes found equal and joined in one white e-class
  egg(R, [bg, s1, s2]) {
    const N = {r:[150, 30], a:[90, 80], b:[210, 80], c:[50, 135], d:[120, 135], e:[180, 135], f:[250, 135], g:[30, 185], h:[80, 185], i:[150, 185], j:[200, 185], k:[270, 185]};
    const E = [['r','a'],['r','b'],['a','c'],['a','d'],['b','e'],['b','f'],['c','g'],['c','h'],['d','i'],['e','i'],['f','j'],['f','k']];
    let g = E.map(([u, v]) => Pa(`M${N[u]}C${N[u][0]},${(N[u][1] + N[v][1]) / 2} ${N[v][0]},${(N[u][1] + N[v][1]) / 2} ${N[v]}`, {stroke:s1, 'stroke-width':7})).join('');
    g += Object.entries(N).map(([k, p]) => C(p[0], p[1], 11, {fill:'de'.includes(k) ? WHITE : s2})).join('');
    return g + Rc(98, 115, 104, 40, {rx:20, fill:'none', stroke:WHITE, 'stroke-width':3.5, 'stroke-dasharray':'9 7'});
  },
  // Dynamic Tanh: a family of tanh curves of different slopes, one in white
  DyT(R, [bg, s1, s2]) {
    let g = ''; const curve = (k, dy) => { let d = ''; for (let x = -10; x <= W + 10; x += 6) { const y = H / 2 + dy - 62 * Math.tanh((x - W / 2) * k); d += `${d ? 'L' : 'M'}${x},${r1(y)}`; } return d; };
    [.006, .009, .013, .019, .028, .045, .08].forEach((k, i) => g += Pa(curve(k, (i - 3) * 9), {stroke:i === 4 ? WHITE : s1, 'stroke-width':i === 4 ? 8 : 6}));
    return g;
  },
  // an acyclic join: four tables of rows linked in a tree; the semi-join pass keeps the rows in white
  Yannakakis(R, [bg, s1, s2]) {
    const T = [[34, 40], [160, 22], [160, 112], [250, 70]], keep = [[1, 3], [0, 2, 4], [1], [2, 3]]; let g = '';
    g += Pa(`M84,64C120,64 120,46 160,46M84,74C120,74 120,136 160,136M210,46C232,46 230,92 250,92`, {stroke:s1, 'stroke-width':6});
    T.forEach(([x, y], t) => { for (let r = 0; r < 5; r++) g += Rc(x, y + r * 13, 50, 9, {rx:4.5, fill:keep[t].includes(r) ? WHITE : s1}); });
    return g;
  },
  // Diffusion Policy: noisy action trajectories denoised into one smooth white path to the goal
  'Diffusion Policy'(R, [bg, s1, s2]) {
    let g = ''; const path = j => { let d = ''; for (let i = 0; i <= 60; i++) { const t = i / 60, x = 24 + t * 246, base = 160 - 120 * Math.sin(t * 1.4) * t, n = (1 - t) ** 1.5 * j * 30 * Math.sin(t * 7 + j);
      d += `${d ? 'L' : 'M'}${r1(x)},${r1(base + n)}`; } return d; };
    [-2.4, -1.6, -.8, .8, 1.6, 2.4].forEach(j => g += Pa(path(j), {stroke:s1, 'stroke-width':6}));
    return g + Pa(path(0), {stroke:WHITE, 'stroke-width':8}) + C(270, 160 - 120 * Math.sin(1.4), 11, {fill:WHITE});
  },
};
function art(task, area) {
  const fn = ART[task], [bg, s1, s2, ink] = HUE[area] || HUE.rb; if (!fn) return '';
  WHITE = ink;
  let dots = ''; for (let x = 6; x < W; x += 12) for (let y = 6; y < H; y += 12) dots += `M${x},${y}h.01`;
  return `<svg class="art" viewBox="0 0 ${W} ${H}" role="img" aria-label="${task}"><rect width="${W}" height="${H}" fill="${bg}"/>`
    + `<path d="${dots}" stroke="${s2}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>${fn(rng(task), [bg, s1, s2])}</svg>`;
}

// shared helpers for the motifs below
const Tx = (x, y, s, size, fill, o = {}) => `<text ${at({x, y, 'text-anchor':'middle', 'font-size':size, 'font-weight':700, fill, 'font-family':'Google Sans, system-ui, sans-serif', ...o})}>${s}</text>`;
const curveEdge = (a, b, o) => Pa(`M${a}C${a[0]},${(a[1] + b[1]) / 2} ${b[0]},${(a[1] + b[1]) / 2} ${b}`, o);
const isoCube = (x, y, s, o) => { const h = s * .5; return Pa(`M${x},${y}l${s},${-h}l${s},${h}l${-s},${h}ZM${x},${y}v${s}l${s},${h}l${s},${-h}v${-s}M${x + s},${y + h}v${s}`, o); };
const lerp = (a, b, t) => a + (b - a) * t;

/* Programming Languages, Security, Cryptography */
Object.assign(ART, {
  // two programs with a common piece; the shared subtree is lifted out as one white abstraction
  BABBLE(R, [bg, s1, s2]) {
    const tree = (ox, hi) => { const N = [[ox, 34], [ox - 40, 84], [ox + 40, 84], [ox - 62, 138], [ox - 18, 138], [ox + 18, 138], [ox + 62, 138], [ox + 4, 184], [ox + 32, 184]];
      const E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [5, 7], [5, 8]], sub = [2, 5, 6, 7, 8];
      return E.map(([u, v]) => curveEdge(N[u], N[v], {stroke:sub.includes(u) && sub.includes(v) && hi ? WHITE : s1, 'stroke-width':7})).join('')
        + N.map((p, i) => C(p[0], p[1], 10, {fill:sub.includes(i) && hi ? WHITE : s2})).join(''); };
    return tree(78, true) + tree(222, true) + Pa('M118,72C150,40 150,40 182,72', {stroke:WHITE, 'stroke-width':3.5, 'stroke-dasharray':'8 7'});
  },
  // Szalinski: a row of repeated CAD solids, folded back into one loop (white)
  Szalinski(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 5; i++) g += isoCube(14 + i * 56, 100, 28, {stroke:i === 0 ? WHITE : s1, 'stroke-width':i === 0 ? 7 : 6});
    return g + Pa('M42,78C42,26 266,26 266,78', {stroke:WHITE, 'stroke-width':6}) + Pa('M254,64L266,80L278,64', {stroke:WHITE, 'stroke-width':6});
  },
  // Polygon: two SQL queries as two tables; the counterexample row where they differ is white
  Polygon(R, [bg, s1, s2]) {
    let g = ''; [[30, 30], [170, 30]].forEach(([x0, y0], t) => { for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
      const hit = r === 3 && (t === 0 || c !== 1); g += Rc(x0 + c * 34, y0 + r * 24, 28, 16, {rx:5, fill:r === 3 ? (hit ? WHITE : 'none') : s1, stroke:r === 3 && !hit ? WHITE : 'none', 'stroke-width':3}); } });
    return g + Pa('M138,110H162', {stroke:WHITE, 'stroke-width':5}) + Pa('M144,100L156,120', {stroke:WHITE, 'stroke-width':5});
  },
  // Ruler: rewrite rules, each a pair of small trees joined by an arrow; the one being inferred is white
  Ruler(R, [bg, s1, s2]) {
    const mini = (x, y, c) => [[x, y - 18], [x - 16, y + 12], [x + 16, y + 12]].map((p, i, A) => (i ? curveEdge(A[0], p, {stroke:c, 'stroke-width':5}) : '')).join('') + [[x, y - 18], [x - 16, y + 12], [x + 16, y + 12]].map(p => C(p[0], p[1], 7, {fill:c})).join('');
    let g = ''; [[48, 0], [100, 1], [152, 0]].forEach(([y, hi]) => { const c = hi ? WHITE : s1; g += mini(70, y, c) + mini(230, y, c) + Pa(`M118,${y}H178M168,${y - 9}L180,${y}L168,${y + 9}`, {stroke:c, 'stroke-width':5}); });
    return g;
  },
  // MBA e-graphs: a mixed boolean-arithmetic soup simplifies to one white operator
  'MBA e-graphs'(R, [bg, s1, s2]) {
    const sym = ['⊕', '∧', '∨', '¬', '×', '−', '≪', '⊕', '∧', '∨', '×', '¬'], P = [[42, 64], [104, 44], [196, 46], [262, 74], [36, 150], [92, 186], [208, 182], [266, 156], [150, 30], [150, 194], [110, 118], [196, 120]];
    return P.map((p, i) => Tx(p[0], p[1], sym[i], 44 + (i % 3) * 10, s1)).join('') + Tx(150, 128, '+', 96, WHITE);
  },
  // Glenside: a stack of tensor planes and the white access window sliding over it
  Glenside(R, [bg, s1, s2]) {
    const plane = (oy, c, w) => { let d = ''; for (let i = 0; i <= 6; i++) d += `M${60 + i * 26},${oy}l-40,40`; for (let j = 0; j <= 4; j++) d += `M${60 - j * 10},${oy + j * 10}h156`;
      return Pa(d, {stroke:c, 'stroke-width':w}); };
    return plane(36, s1, 4) + plane(84, s1, 4) + plane(132, s1, 4) + Pa('M112,84l52,0l-20,20l-52,0Z', {fill:WHITE, stroke:WHITE, 'stroke-width':5, 'stroke-linejoin':'round'})
      + Pa('M138,60V80M138,108V128', {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 7'});
  },
  // TenSat: a tensor graph of operator boxes; a rewritten subgraph is white
  TenSat(R, [bg, s1, s2]) {
    const N = [[150, 24], [80, 74], [220, 74], [44, 128], [128, 128], [194, 128], [256, 128], [100, 180], [210, 180]], E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 7], [3, 7], [5, 8], [6, 8]], w = [4, 5];
    return E.map(([u, v]) => curveEdge(N[u], N[v], {stroke:s1, 'stroke-width':6})).join('') + N.map((p, i) => Rc(p[0] - 24, p[1] - 13, 48, 26, {rx:13, fill:w.includes(i) ? WHITE : s2})).join('')
      + Rc(96, 106, 130, 44, {rx:22, fill:'none', stroke:WHITE, 'stroke-width':3.5, 'stroke-dasharray':'9 7'});
  },
  // ACC Saturator: a nest of loops as indented code lines; the statements moved out of the loop are white
  'ACC Saturator'(R, [bg, s1, s2]) {
    const L = [[0, 120], [1, 150], [2, 90], [3, 130], [3, 70], [2, 110], [1, 60], [0, 80]]; let g = '';
    L.forEach(([d, w], i) => g += Rc(36 + d * 28, 26 + i * 20, w, 11, {rx:5.5, fill:(i === 3 || i === 4) ? WHITE : s1}));
    return g + Pa('M150,77C230,77 240,40 240,30', {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 8'}) + C(240, 26, 7, {fill:WHITE});
  },
  // type-constrained decoding: a tree of next tokens; ill-typed branches stop short, one well-typed path is white
  'Type-constrained decoding'(R, [bg, s1, s2]) {
    let g = ''; const grow = (x, y, d, on) => { if (d > 4) return; [-1, 1].forEach(s => { const nx = x + 52, ny = y + s * 64 / (d + 1), keep = on && s === (d % 2 ? 1 : -1);
      g += curveEdge2([x, y], [nx, ny], keep ? WHITE : s1, keep ? 7 : 5); if (!keep && d > 1 && R() < .6) g += Pa(`M${nx - 6},${ny - 6}l12,12M${nx + 6},${ny - 6}l-12,12`, {stroke:s2, 'stroke-width':4}); else grow(nx, ny, d + 1, keep); }); };
    const curveEdge2 = (a, b, c, w) => Pa(`M${a}C${(a[0] + b[0]) / 2},${a[1]} ${(a[0] + b[0]) / 2},${b[1]} ${b}`, {stroke:c, 'stroke-width':w});
    grow(22, 100, 0, true); return g + C(22, 100, 10, {fill:WHITE});
  },
  // Generative Compilation: code written line by line, each line checked by the compiler as it appears
  'Generative Compilation'(R, [bg, s1, s2]) {
    let g = ''; const w = [150, 110, 180, 90, 140, 60];
    w.forEach((v, i) => { const y = 30 + i * 26, last = i === w.length - 1; g += Rc(40, y, v, 12, {rx:6, fill:last ? WHITE : s1});
      g += last ? Rc(40 + v + 8, y - 4, 5, 20, {rx:2.5, fill:WHITE}) : Pa(`M${210 + 14},${y + 6}l7,7l13,-14`, {stroke:WHITE, 'stroke-width':4.5}); });
    return g;
  },
  // CIll: the reachable states inside a white invariant; a counterexample to induction pushes against its edge
  CIll(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 70; i++) { const a = R() * 6.28, r = Math.sqrt(R()), x = 150 + Math.cos(a) * r * 92, y = 100 + Math.sin(a) * r * 62; g += C(x, y, 5, {fill:s1}); }
    for (let i = 0; i < 18; i++) { const x = 10 + R() * 280, y = 10 + R() * 180; if (((x - 150) / 118) ** 2 + ((y - 100) / 82) ** 2 > 1.08) g += C(x, y, 5, {fill:s2, 'fill-opacity':.6}); }
    return g + `<ellipse cx="150" cy="100" rx="112" ry="78" fill="none" stroke="${WHITE}" stroke-width="5"/>` + Pa('M272,40C252,52 250,60 246,66', {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 7'}) + C(276, 36, 8, {fill:WHITE});
  },
  // Spectre: access times across memory lines; the one cached by speculation is fast, short and white
  Spectre(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 20; i++) { const h = i === 13 ? 44 : 110 + R() * 50; g += Rc(16 + i * 13.6, 186 - h, 10, h, {rx:5, fill:i === 13 ? WHITE : s1}); }
    return g;
  },
  // adaptive attacks: rings of defence with gaps; the white attack path finds its way through to the centre
  'Adaptive attacks'(R, [bg, s1, s2]) {
    let g = ''; const c = [150, 100]; [30, 54, 78, 102, 126].forEach((r, i) => { const gap = .5 + i * 1.3; g += Pa(arc(c[0], c[1], r, gap + .35, gap + 6.28 - .35), {stroke:s1, 'stroke-width':9}); });
    return g + Pa('M296,40C250,20 240,60 230,82C214,96 200,40 172,62C150,80 132,70 150,100', {stroke:WHITE, 'stroke-width':5, 'stroke-dasharray':'3 9'}) + C(150, 100, 11, {fill:WHITE});
  },
  // Progent: an agent and its tools; privilege rules let some calls through (white) and stop the rest
  Progent(R, [bg, s1, s2]) {
    const c = [150, 100]; let g = ''; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 - 1.2, x = c[0] + Math.cos(a) * 112, y = c[1] + Math.sin(a) * 78, ok = [0, 3, 5].includes(i);
      const mx = lerp(c[0], x, .62), my = lerp(c[1], y, .62);
      g += Pa(`M${c}L${ok ? `${r1(x)},${r1(y)}` : `${r1(mx)},${r1(my)}`}`, {stroke:ok ? WHITE : s1, 'stroke-width':ok ? 6 : 5});
      if (!ok) g += Pa(`M${r1(mx - 9 * Math.sin(a))},${r1(my + 9 * Math.cos(a))}L${r1(mx + 9 * Math.sin(a))},${r1(my - 9 * Math.cos(a))}`, {stroke:s2, 'stroke-width':6});
      g += Rc(x - 13, y - 13, 26, 26, {rx:7, fill:ok ? WHITE : s1}); }
    return g + C(c[0], c[1], 18, {fill:WHITE});
  },
  // Opal: private memory as blocks, accessed obliviously; the white path visits blocks in a pattern that hides which one is read
  Opal(R, [bg, s1, s2]) {
    let g = ''; const P = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { const x = 30 + c * 40, y = 30 + r * 40; P.push([x + 12, y + 12]); g += Rc(x, y, 24, 24, {rx:6, fill:s1}); }
    const path = [0, 9, 3, 12, 20, 15, 25, 18, 27].map(i => P[i]);
    return g + Pa(`M${path.map(p => p.join(',')).join('L')}`, {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 8'}) + path.map(p => Rc(p[0] - 12, p[1] - 12, 24, 24, {rx:6, fill:'none', stroke:WHITE, 'stroke-width':3.5})).join('') + Rc(P[15][0] - 12, P[15][1] - 12, 24, 24, {rx:6, fill:WHITE});
  },
  // Hacking Blind: the stack read one byte at a time; bytes found are white, the next one is being probed
  'Hacking Blind'(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 8; i++) { const x = 14 + i * 35.5, s = i < 3 ? 'k' : i === 3 ? 'q' : 'u';
      g += Rc(x, 64, 29, 72, {rx:7, fill:s === 'k' ? WHITE : s === 'q' ? 'none' : s1, stroke:s === 'q' ? WHITE : 'none', 'stroke-width':4, 'stroke-dasharray':s === 'q' ? '7 6' : ''}); }
    return g + Pa('M130,48C130,24 154,24 154,44', {stroke:WHITE, 'stroke-width':5}) + Pa('M146,38L154,50L162,38', {stroke:WHITE, 'stroke-width':5});
  },
  // Zelda: two servers each hold the database; the client asks both and recovers one entry (white)
  Zelda(R, [bg, s1, s2]) {
    let g = ''; [[30, 1], [230, 4]].forEach(([x, hit]) => { for (let r = 0; r < 7; r++) g += Rc(x, 16 + r * 25, 40, 18, {rx:6, fill:r === hit ? WHITE : s1}); });
    return g + Pa('M74,43C120,43 120,100 136,100M226,118C180,118 180,100 164,100', {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 8'}) + C(150, 100, 15, {fill:WHITE});
  },
  // QuarterPIR: the database split into hint sets in advance; one set (white) answers the query
  QuarterPIR(R, [bg, s1, s2]) {
    let g = ''; for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const on = (c * 7 + r * 3) % 5 === 1; g += Rc(22 + c * 29, 22 + r * 27, 22, 20, {rx:5, fill:on ? WHITE : s1, 'fill-opacity':on ? 1 : (.55 + ((c + r) % 3) * .2)}); }
    return g;
  },
  // Piano: one server, a long database row; the client fetches a white set that hides the one entry it wants
  Piano(R, [bg, s1, s2]) {
    let g = ''; const pick = [2, 7, 11, 16, 22, 27, 33]; for (let i = 0; i < 36; i++) { const x = 18 + (i % 12) * 22.5, y = 40 + Math.floor(i / 12) * 44;
      g += Rc(x, y, 16, 32, {rx:5, fill:pick.includes(i) ? WHITE : s1}); }
    return g;
  },
  // CKKS noise: an encrypted signal with a band of noise that widens with each operation
  'CKKS noise'(R, [bg, s1, s2]) {
    let top = '', bot = '', mid = ''; for (let x = 0; x <= W; x += 5) { const y = 100 + 34 * Math.sin(x / 26), w = 6 + (x / W) ** 2 * 46;
      top += `${top ? 'L' : 'M'}${x},${r1(y - w)}`; bot = `L${x},${r1(y + w)}` + bot; mid += `${mid ? 'L' : 'M'}${x},${r1(y)}`; }
    let g = Pa(top + bot.replace(/^L/, 'L') + 'Z', {fill:s1, 'fill-opacity':.55, stroke:'none'});
    for (let x = 60; x < W; x += 60) g += Pa(`M${x},14V186`, {stroke:s2, 'stroke-width':3, 'stroke-dasharray':'3 8'});
    return g + Pa(mid, {stroke:WHITE, 'stroke-width':6});
  },
});

/* Software Engineering, Robotics, Database */
Object.assign(ART, {
  // QFuzz: inputs sorted into timing classes; the fuzzer looks for inputs that split them further (white)
  QFuzz(R, [bg, s1, s2]) {
    let g = ''; const H0 = [40, 70, 110, 80, 50, 30, 60, 120, 140, 90, 50, 26, 44, 96, 130, 70];
    H0.forEach((h, i) => g += Rc(18 + i * 17, 168 - h, 12, h, {rx:6, fill:[7, 8, 13, 14].includes(i) ? WHITE : s1}));
    [86, 154, 222].forEach(x => g += Pa(`M${x},20V178`, {stroke:s2, 'stroke-width':3, 'stroke-dasharray':'3 8'}));
    return g;
  },
  // CUTE: the tree of paths through a program; concolic execution follows one path and flips a branch to reach a new one
  CUTE(R, [bg, s1, s2]) {
    let g = ''; const go = (x, y, d, w, on) => { if (d > 2) return; [-1, 1].forEach(s => { const nx = x + s * w, ny = y + 54, hot = on && s === (d === 1 ? 1 : -1);
      g += Pa(`M${x},${y}L${nx},${ny}`, {stroke:hot ? WHITE : s1, 'stroke-width':hot ? 7 : 5}); g += C(nx, ny, hot ? 8 : 6, {fill:hot ? WHITE : s2}); go(nx, ny, d + 1, w / 2, hot); }); };
    go(150, 20, 0, 80, true); return g + C(150, 20, 11, {fill:WHITE});
  },
  // ItyFuzz: a chain of saved states; fuzzing restarts from snapshots, and one new branch (white) finds a new state
  ItyFuzz(R, [bg, s1, s2]) {
    let g = ''; const xs = [30, 90, 150, 210, 270];
    g += Pa('M30,120H270', {stroke:s1, 'stroke-width':7});
    xs.slice(0, 4).forEach((x, i) => { g += Pa(`M${x},120C${x + 10},70 ${x + 40},60 ${x + 52},${54 + (i % 2) * 20}`, {stroke:s1, 'stroke-width':5}); g += C(x + 52, 54 + (i % 2) * 20, 6, {fill:s2}); });
    g += Pa('M150,120C160,170 200,176 226,170', {stroke:WHITE, 'stroke-width':6}) + C(228, 170, 10, {fill:WHITE});
    return g + xs.map(x => C(x, 120, 12, {fill:s2, stroke:bg, 'stroke-width':3})).join('') + C(150, 120, 12, {fill:WHITE});
  },
  // Zest: structured inputs as nested blocks; a mutation changes one subtree and keeps the input valid (white)
  Zest(R, [bg, s1, s2]) {
    const box = (x, y, w, h, c, f) => Rc(x, y, w, h, {rx:10, fill:f ? c : 'none', stroke:c, 'stroke-width':5});
    return box(20, 20, 260, 160, s1) + box(40, 44, 110, 116, s1) + box(166, 44, 94, 54, s1) + box(166, 112, 94, 48, WHITE, true)
      + box(56, 62, 78, 30, s1, true) + box(56, 108, 78, 34, s1, true);
  },
  // MuJoCo Playground: a legged robot learning to walk; earlier poses fade behind the white one
  'MuJoCo Playground'(R, [bg, s1, s2]) {
    const bot = (x, ph, c, w) => { const L = [[-24, ph], [-10, -ph], [10, ph], [24, -ph]];
      return L.map(([dx, p]) => { const kx = x + dx + 9 * Math.sin(p), fx = x + dx - 4 + 13 * Math.sin(p + 1), fy = 164 - 9 * Math.max(0, Math.sin(p));
        return Pa(`M${x + dx},104L${r1(kx)},${134}L${r1(fx)},${r1(fy)}`, {stroke:c, 'stroke-width':w}); }).join('')
        + Pa(`M${x - 28},104H${x + 28}`, {stroke:c, 'stroke-width':w + 8}) + C(x + 34, 86, 11, {fill:c}); };
    return Pa('M0,168H300', {stroke:s1, 'stroke-width':4}) + bot(54, .2, s1, 5) + bot(148, 1.1, s1, 5) + bot(242, 2.2, WHITE, 6);
  },
  // ScaleGPM: a large graph; sampling finds copies of one small pattern (white triangles)
  ScaleGPM(R, [bg, s1, s2]) {
    const N = Array.from({length:30}, (_, i) => [16 + (i % 6) * 54 + (R() - .5) * 26, 18 + Math.floor(i / 6) * 42 + (R() - .5) * 20]); let g = '';
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) if (Math.hypot(N[i][0] - N[j][0], N[i][1] - N[j][1]) < 64 && R() < .55) g += Pa(`M${r1(N[i][0])},${r1(N[i][1])}L${r1(N[j][0])},${r1(N[j][1])}`, {stroke:s1, 'stroke-width':4});
    const tri = [[7, 8, 13], [16, 22, 23]]; tri.forEach(t => g += Pa(`M${t.map(i => N[i].map(r1).join(',')).join('L')}Z`, {stroke:WHITE, 'stroke-width':6, fill:WHITE, 'fill-opacity':.25}));
    return g + N.map((p, i) => C(p[0], p[1], 7, {fill:tri.flat().includes(i) ? WHITE : s2})).join('');
  },
  // SCOPE: around one node, count the small subgraphs it belongs to; its neighbourhood is ringed, the counted motifs white
  SCOPE(R, [bg, s1, s2]) {
    const c = [150, 100], nb = Array.from({length:8}, (_, i) => [c[0] + Math.cos(i * .785 + .3) * 70, c[1] + Math.sin(i * .785 + .3) * 62]); let g = '';
    nb.forEach((p, i) => { g += Pa(`M${c}L${r1(p[0])},${r1(p[1])}`, {stroke:[0, 1, 4, 5].includes(i) ? WHITE : s1, 'stroke-width':6}); const q = nb[(i + 1) % 8]; if (i % 2 === 0) g += Pa(`M${r1(p[0])},${r1(p[1])}L${r1(q[0])},${r1(q[1])}`, {stroke:[0, 4].includes(i) ? WHITE : s1, 'stroke-width':6}); });
    nb.forEach(p => { const o = [p[0] + (p[0] - c[0]) * .6, p[1] + (p[1] - c[1]) * .6]; g += Pa(`M${r1(p[0])},${r1(p[1])}L${r1(o[0])},${r1(o[1])}`, {stroke:s1, 'stroke-width':4}) + C(o[0], o[1], 5, {fill:s2}); });
    return `<ellipse cx="150" cy="100" rx="92" ry="82" fill="none" stroke="${s2}" stroke-width="3" stroke-dasharray="4 9"/>` + g + nb.map((p, i) => C(p[0], p[1], 9, {fill:[0, 1, 4, 5].includes(i) ? WHITE : s2})).join('') + C(c[0], c[1], 13, {fill:WHITE});
  },
  // Seer: a chain of blocks of transactions; fine-grained branch prediction runs the likely path ahead (white)
  Seer(R, [bg, s1, s2]) {
    let g = ''; [24, 100, 176].forEach((x, b) => { g += Rc(x, 50, 64, 100, {rx:10, fill:'none', stroke:s1, 'stroke-width':5}); for (let r = 0; r < 4; r++) g += Rc(x + 12, 64 + r * 20, 40, 10, {rx:5, fill:b === 2 && r < 2 ? WHITE : s1}); });
    g += Pa('M88,100H100M164,100H176', {stroke:s1, 'stroke-width':6});
    return g + Pa('M240,100C262,100 262,60 284,60', {stroke:WHITE, 'stroke-width':6}) + Pa('M240,100C262,100 262,140 284,140', {stroke:s1, 'stroke-width':5, 'stroke-dasharray':'3 8'}) + C(284, 60, 8, {fill:WHITE});
  },
  // Spectrum: transactions run in parallel lanes; the deterministic order is kept where two of them conflict (white)
  Spectrum(R, [bg, s1, s2]) {
    let g = ''; const lanes = [[[20, 90], [130, 70], [220, 60]], [[40, 60], [120, 110], [250, 30]], [[20, 120], [160, 50], [230, 50]], [[60, 80], [160, 100]]];
    lanes.forEach((L, i) => L.forEach(([x, w], j) => g += Rc(x, 28 + i * 40, w - 8, 24, {rx:12, fill:(i === 1 && j === 1) || (i === 2 && j === 1) ? WHITE : s1})));
    return g + Pa('M176,92C176,104 190,104 190,116', {stroke:WHITE, 'stroke-width':4}) + Pa('M184,108L190,118L196,108', {stroke:WHITE, 'stroke-width':4});
  },
  // SemJoin: two lists joined by meaning rather than equal keys; the matched pairs are white
  SemJoin(R, [bg, s1, s2]) {
    let g = ''; const L = [0, 1, 2, 3, 4, 5].map(i => [40, 26 + i * 30]), Rr = [0, 1, 2, 3, 4, 5].map(i => [200, 26 + i * 30]), M = [[0, 2], [2, 0], [3, 5], [5, 3]];
    M.forEach(([a, b]) => g += Pa(`M${L[a][0] + 64},${L[a][1] + 8}C150,${L[a][1] + 8} 150,${Rr[b][1] + 8} ${Rr[b][0]},${Rr[b][1] + 8}`, {stroke:WHITE, 'stroke-width':5}));
    return g + L.map((p, i) => Rc(p[0], p[1], 64, 16, {rx:8, fill:M.some(m => m[0] === i) ? WHITE : s1})).join('') + Rr.map((p, i) => Rc(p[0], p[1], 64, 16, {rx:8, fill:M.some(m => m[1] === i) ? WHITE : s1})).join('');
  },
});

/* Machine Learning, Language Modeling, Medical AI */
const wave = (f, x0 = 0, x1 = W, step = 4) => { let d = ''; for (let x = x0; x <= x1; x += step) d += `${d ? 'L' : 'M'}${r1(x)},${r1(f(x))}`; return d; };
Object.assign(ART, {
  // MIRA: an irregularly sampled medical signal; the model forecasts its continuation (white)
  MIRA(R, [bg, s1, s2]) {
    const f = x => 112 - (Math.abs(((x + 30) % 70) - 35) < 4 ? 70 * (1 - Math.abs(((x + 30) % 70) - 35) / 4) : 0) + 6 * Math.sin(x / 9);
    let g = Pa(wave(f, 0, 196, 2), {stroke:s1, 'stroke-width':5}) + Pa(wave(f, 196, 300, 2), {stroke:WHITE, 'stroke-width':6, 'stroke-dasharray':'2 0'});
    [12, 30, 61, 74, 103, 131, 140, 172, 188].forEach(x => g += C(x, f(x), 6, {fill:s2, stroke:bg, 'stroke-width':2}));
    return g + Pa('M196,20V180', {stroke:s1, 'stroke-width':3, 'stroke-dasharray':'3 8'});
  },
  // nanoslm: a hybrid stack of attention and recurrent layers; the chosen mix is the design (white attention layers)
  nanoslm(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 8; i++) { const y = 18 + i * 21, att = i % 3 === 2; g += Rc(70, y, 160, 15, {rx:7.5, fill:att ? WHITE : s1}); if (!att) g += Pa(`M84,${y + 7.5}h132`, {stroke:s2, 'stroke-width':3, 'stroke-dasharray':'1 9'}); }
    return g + Pa('M50,180V20M42,30L50,18L58,30', {stroke:s1, 'stroke-width':5});
  },
  // nanowm speedup: a world model's rollout as a strip of frames, generated faster (white motion lines)
  'nanowm speedup'(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 5; i++) { const x = 20 + i * 54; g += Rc(x, 60, 46, 80, {rx:8, fill:s1}); g += C(x + 14 + i * 4, 100 - i * 6, 8, {fill:s2}); }
    return g + Pa('M60,38H250M90,166H280M30,24H170', {stroke:WHITE, 'stroke-width':5}) + Pa('M240,28L252,38L240,48', {stroke:WHITE, 'stroke-width':5});
  },
  // nanowm stability: long rollouts drift apart; the stable one (white) stays on track
  'nanowm stability'(R, [bg, s1, s2]) {
    let g = ''; [-3, -2, -1, 1, 2, 3].forEach(j => g += Pa(wave(x => 100 + 30 * Math.sin(x / 40) + j * (x / 300) ** 2 * 40 * (1 + .3 * Math.sin(x / 13)), 0, 300, 4), {stroke:s1, 'stroke-width':5}));
    return g + Pa(wave(x => 100 + 30 * Math.sin(x / 40), 0, 300, 4), {stroke:WHITE, 'stroke-width':7});
  },
  // Polar Express: polynomial steps push the singular values toward 1; each pass narrows them (white end)
  'Polar Express'(R, [bg, s1, s2]) {
    let g = ''; const ys = [30, 66, 102, 138, 174], spread = [1, .62, .35, .16, .05];
    ys.forEach((y, k) => { g += Pa(`M30,${y}H270`, {stroke:s2, 'stroke-width':3}); for (let i = 0; i < 9; i++) { const v = 150 + (i - 4) * 28 * spread[k] + (R() - .5) * 18 * spread[k]; g += C(v, y, 7, {fill:k === 4 ? WHITE : s1}); } });
    return g + Pa('M150,14V190', {stroke:WHITE, 'stroke-width':3, 'stroke-dasharray':'3 7'});
  },
  // LeJEPA: embeddings spread into an isotropic Gaussian; rings of density with samples, the centre white
  LeJEPA(R, [bg, s1, s2]) {
    let g = ''; [80, 60, 40, 20].forEach((r, i) => g += C(150, 100, r, {fill:'none', stroke:s1, 'stroke-width':5, 'stroke-opacity':.5 + i * .15}));
    for (let i = 0; i < 46; i++) { const a = R() * 6.28, r = Math.abs((R() + R() + R() - 1.5) * 64); g += C(150 + Math.cos(a) * r, 100 + Math.sin(a) * r, 5, {fill:s2}); }
    return g + C(150, 100, 10, {fill:WHITE});
  },
  // HRM: a slow high-level loop driving fast low-level loops
  HRM(R, [bg, s1, s2]) {
    let g = C(150, 100, 74, {fill:'none', stroke:WHITE, 'stroke-width':6}) + Pa('M214,58L224,64L216,74', {stroke:WHITE, 'stroke-width':6});
    for (let i = 0; i < 6; i++) { const a = i * 1.047, x = 150 + Math.cos(a) * 74, y = 100 + Math.sin(a) * 74; g += C(x, y, 17, {fill:bg, stroke:s1, 'stroke-width':5}); }
    return g + C(150, 100, 22, {fill:s1});
  },
  // MoM: a router sends each token to one of several memories; the chosen one is white
  MoM(R, [bg, s1, s2]) {
    let g = ''; const M = [30, 70, 110, 150].map(y => [210, y]);
    M.forEach(([x, y], i) => { g += Pa(`M92,100C150,100 150,${y + 10} ${x},${y + 10}`, {stroke:i === 2 ? WHITE : s1, 'stroke-width':i === 2 ? 6 : 4}); g += Rc(x, y, 64, 22, {rx:8, fill:i === 2 ? WHITE : s1}); });
    return g + Rc(40, 82, 52, 36, {rx:12, fill:s2}) + C(66, 100, 8, {fill:WHITE});
  },
  // Nano World Model: past frames in, the next frame predicted (white)
  'Nano World Model'(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 3; i++) { const x = 18 + i * 66; g += Rc(x, 56, 56, 88, {rx:9, fill:s1}); g += C(x + 18 + i * 8, 120 - i * 14, 9, {fill:s2}); }
    return g + Pa('M218,100H232M226,92L234,100L226,108', {stroke:WHITE, 'stroke-width':5}) + Rc(240, 56, 56, 88, {rx:9, fill:'none', stroke:WHITE, 'stroke-width':5}) + C(258 + 24, 120 - 3 * 14, 9, {fill:WHITE});
  },
  // DFlash: a block of draft tokens proposed at once; the target model accepts a prefix of them (white)
  DFlash(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 4; i++) g += Rc(20 + i * 34, 84, 28, 32, {rx:7, fill:s1});
    for (let i = 0; i < 4; i++) g += Rc(164 + i * 32, 84, 26, 32, {rx:7, fill:i < 3 ? WHITE : 'none', stroke:i < 3 ? 'none' : s1, 'stroke-width':4});
    return g + Pa('M164,64C200,40 260,40 284,64', {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 7'}) + Pa('M150,74V126', {stroke:s2, 'stroke-width':4});
  },
  // RAGEN: an agent and an environment in a loop over many turns; the trajectory through it is white
  RAGEN(R, [bg, s1, s2]) {
    let g = Rc(30, 66, 64, 68, {rx:16, fill:s1}) + Rc(206, 66, 64, 68, {rx:16, fill:s1});
    g += Pa('M98,84C140,50 160,50 202,84', {stroke:WHITE, 'stroke-width':6}) + Pa('M192,76L204,86L190,92', {stroke:WHITE, 'stroke-width':6});
    g += Pa('M202,116C160,150 140,150 98,116', {stroke:WHITE, 'stroke-width':6}) + Pa('M108,124L96,114L110,108', {stroke:WHITE, 'stroke-width':6});
    return g + C(62, 100, 12, {fill:WHITE}) + Rc(224, 86, 28, 28, {rx:6, fill:s2});
  },
  // JiT: an image transformer denoising pixels directly; noise on the left becomes a clean patch grid on the right
  JiT(R, [bg, s1, s2]) {
    let g = ''; for (let c = 0; c < 10; c++) for (let r = 0; r < 6; r++) { const t = c / 9, x = 16 + c * 27.5, y = 18 + r * 28, clean = (r + c) % 3 === 0;
      const j = (1 - t) * 9; g += Rc(x + (R() - .5) * j, y + (R() - .5) * j, 22, 22, {rx:5, fill:t > .7 && clean ? WHITE : s1, 'fill-opacity':t > .7 ? 1 : .35 + t * .6}); }
    return g;
  },
  // CLIPPO: text rendered as pixels and an image, encoded by one tower and pulled together (white link)
  CLIPPO(R, [bg, s1, s2]) {
    let g = Rc(26, 46, 100, 108, {rx:12, fill:s1});
    [64, 84, 104, 124].forEach((y, i) => g += Rc(42, y, [70, 54, 64, 40][i], 9, {rx:4.5, fill:s2}));
    g += Rc(174, 46, 100, 108, {rx:12, fill:s1}) + Pa('M184,140L210,104L228,124L246,96L266,140Z', {fill:s2, stroke:'none'}) + C(250, 70, 10, {fill:s2});
    return g + Pa('M130,100H170', {stroke:WHITE, 'stroke-width':6}) + C(130, 100, 7, {fill:WHITE}) + C(170, 100, 7, {fill:WHITE});
  },
  // MoE overfitting: on repeated data the experts model overfits; its loss curve turns back up (white)
  'MoE overfitting'(R, [bg, s1, s2]) {
    let g = ''; for (let k = 1; k < 5; k++) g += Pa(`M${k * 60},14V186`, {stroke:s2, 'stroke-width':3, 'stroke-dasharray':'3 8'});
    g += Pa(wave(x => 200 - (30 + 120 * Math.exp(-x / 70)), 10, 290, 4), {stroke:s1, 'stroke-width':6});
    return g + Pa(wave(x => 200 - (24 + 130 * Math.exp(-x / 55) + (x / 300) ** 2 * 90), 10, 290, 4), {stroke:WHITE, 'stroke-width':7});
  },
  // ACE: a context playbook that grows by small edits; new bullets (white) are added, nothing is rewritten wholesale
  ACE(R, [bg, s1, s2]) {
    let g = Rc(70, 14, 160, 172, {rx:12, fill:s1, 'fill-opacity':.45});
    [36, 60, 84, 108, 132, 156].forEach((y, i) => { const nw = i === 2 || i === 5; g += C(92, y + 5, 5, {fill:nw ? WHITE : s1}) + Rc(104, y, [96, 80, 104, 70, 90, 100][i], 10, {rx:5, fill:nw ? WHITE : s1}); });
    return g + Pa('M244,64h22M255,53v22', {stroke:WHITE, 'stroke-width':5});
  },
  // Meta Context Engineering: skills evolve as a tree of context documents; the best branch is white
  'Meta Context Engineering'(R, [bg, s1, s2]) {
    const N = [[40, 100], [110, 54], [110, 146], [180, 30], [180, 82], [180, 130], [250, 60], [250, 110], [250, 160]], E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 6], [4, 7], [5, 8]], hot = [0, 1, 4, 7];
    return E.map(([u, v]) => Pa(`M${N[u]}C${(N[u][0] + N[v][0]) / 2},${N[u][1]} ${(N[u][0] + N[v][0]) / 2},${N[v][1]} ${N[v]}`, {stroke:hot.includes(u) && hot.includes(v) ? WHITE : s1, 'stroke-width':6})).join('')
      + N.map((p, i) => Rc(p[0] - 14, p[1] - 17, 28, 34, {rx:6, fill:hot.includes(i) ? WHITE : s2})).join('');
  },
  // Meta-Harness: the harness around a model, optimised end to end in an outer loop (white)
  'Meta-Harness'(R, [bg, s1, s2]) {
    let g = Rc(120, 74, 60, 52, {rx:12, fill:s1}) + Rc(84, 46, 132, 108, {rx:22, fill:'none', stroke:s1, 'stroke-width':6});
    g += Pa(arc(150, 100, 88, .4, 5.9), {stroke:WHITE, 'stroke-width':6}) + Pa('M226,52L232,66L218,68', {stroke:WHITE, 'stroke-width':6});
    return g + C(150, 100, 9, {fill:s2});
  },
  // Self-Harness: a harness that rewrites itself; each turn of the spiral is a better version (white)
  'Self-Harness'(R, [bg, s1, s2]) {
    let d = ''; for (let t = 0; t <= 6.28 * 3; t += .1) { const r = 8 + t * 4.2; d += `${d ? 'L' : 'M'}${r1(150 + Math.cos(t) * r * 1.3)},${r1(100 + Math.sin(t) * r)}`; }
    return Pa(d, {stroke:s1, 'stroke-width':6}) + Pa(wave(x => 0, 0, 0), {}) + C(150 + Math.cos(18.8) * 87 * 1.3, 100 + Math.sin(18.8) * 87, 11, {fill:WHITE}) + C(150, 100, 8, {fill:WHITE});
  },
  // KV compaction: a long KV cache compressed into a few entries that match its attention (white)
  'KV compaction'(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 24; i++) { const h = 30 + R() * 90; g += Rc(14 + i * 7.6, 100 - h / 2, 4.5, h, {rx:2.2, fill:s1}); }
    g += Pa('M206,100H222M214,92L224,100L214,108', {stroke:WHITE, 'stroke-width':5});
    [0, 1, 2].forEach(i => g += Rc(234 + i * 20, 54, 12, 92, {rx:6, fill:WHITE}));
    return g;
  },
  // DepthBench: a deep stack of layers; residual connections carry computation through it (white skips)
  DepthBench(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 8; i++) g += Rc(40 + i * 30, 70, 18, 60, {rx:6, fill:s1});
    for (let i = 0; i < 7; i++) g += Pa(`M${49 + i * 30},66C${49 + i * 30},${40 - (i % 2) * 12} ${79 + i * 30},${40 - (i % 2) * 12} ${79 + i * 30},66`, {stroke:WHITE, 'stroke-width':4});
    return g + Pa('M20,100H290', {stroke:s2, 'stroke-width':4, 'stroke-dasharray':'2 7'});
  },
  // Gigatoken: bytes merged pairwise into longer tokens, layer by layer (the top token white)
  Gigatoken(R, [bg, s1, s2]) {
    let g = ''; const rows = [[16, 16], [8, 32], [4, 64], [2, 128], [1, 256]];
    rows.forEach(([n, w], k) => { for (let i = 0; i < n; i++) g += Rc(22 + i * w * 1.0, 170 - k * 36, w - 6, 24, {rx:7, fill:k === 4 ? WHITE : s1, 'fill-opacity':k === 4 ? 1 : .55 + k * .1}); });
    return g;
  },
  // WeirdML: many small odd machine-learning problems; a scatter of different shapes, one solved (white)
  WeirdML(R, [bg, s1, s2]) {
    let g = ''; const shapes = [(x, y, c) => C(x, y, 13, {fill:c}), (x, y, c) => Rc(x - 12, y - 12, 24, 24, {rx:4, fill:c}), (x, y, c) => Pa(`M${x},${y - 14}L${x + 14},${y + 11}L${x - 14},${y + 11}Z`, {fill:c, stroke:'none'}), (x, y, c) => Pa(`M${x - 12},${y}H${x + 12}M${x},${y - 12}V${y + 12}`, {stroke:c, 'stroke-width':7})];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const i = r * 6 + c; g += shapes[(i * 7 + r) % 4](34 + c * 46 + (r % 2) * 10, 30 + r * 46, i === 15 ? WHITE : (i % 3 ? s1 : s2)); }
    return g;
  },
  // synthetic pre-pretraining: nested brackets of a formal language first, then natural text lines (white)
  'Synthetic pre-pretraining'(R, [bg, s1, s2]) {
    let g = ''; const br = '(([()])([]))((()))'; [...br].forEach((ch, i) => g += Tx(22 + i * 15.5, 76, ch, 34, s1));
    [110, 134, 158].forEach((y, i) => g += Rc(22, y, [256, 200, 230][i], 12, {rx:6, fill:WHITE}));
    return g;
  },
  // nanoswe: a code diff, removed lines and added lines (white), from an agent trained on a fixed budget
  nanoswe(R, [bg, s1, s2]) {
    let g = ''; const L = [[0, 150], [0, 110], [-1, 170], [-1, 120], [1, 180], [1, 130], [1, 90], [0, 140]];
    L.forEach(([k, w], i) => { const y = 22 + i * 21; g += Rc(60, y, w, 12, {rx:6, fill:k === 1 ? WHITE : k === -1 ? s2 : s1, 'fill-opacity':k === -1 ? .7 : 1});
      if (k) g += Pa(k > 0 ? `M34,${y + 6}h14M41,${y - 1}v14` : `M34,${y + 6}h14`, {stroke:k > 0 ? WHITE : s1, 'stroke-width':4}); });
    return g;
  },
  // SWE-2 reward: runs trading cost against success; reward shaping moves the Pareto frontier (white)
  'SWE-2 reward'(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 26; i++) { const x = 20 + R() * 260, y = 180 - (x / 300) ** .5 * 140 * (.45 + R() * .55); g += C(x, y, 6, {fill:s1}); }
    g += Pa(wave(x => 186 - (x / 300) ** .5 * 150, 14, 290, 4), {stroke:s2, 'stroke-width':4, 'stroke-dasharray':'3 8'});
    return g + Pa(wave(x => 180 - (x / 300) ** .42 * 166, 14, 290, 4), {stroke:WHITE, 'stroke-width':6});
  },
  // Local Support Learning: a function built from many local bumps; one bump (white) shapes its region only
  'Local Support Learning'(R, [bg, s1, s2]) {
    let g = ''; const cs = [30, 66, 102, 138, 174, 210, 246, 282], hs = cs.map(() => 30 + R() * 70);
    cs.forEach((c, i) => g += Pa(wave(x => 176 - hs[i] * Math.exp(-(((x - c) / 18) ** 2)), c - 60, c + 60, 3), {stroke:i === 4 ? WHITE : s1, 'stroke-width':i === 4 ? 6 : 5}));
    return g + Pa(wave(x => 150 - cs.reduce((a, c, i) => a + hs[i] * .5 * Math.exp(-(((x - c) / 18) ** 2)), 0), 0, 300, 3), {stroke:s2, 'stroke-width':4, 'stroke-dasharray':'2 7'});
  },
});

/* Systems: Network, MLSys, Architecture, HPC */
const blob = (R, cx, cy, sx, sy, n) => Array.from({length:n}, () => { const a = R() * 6.283, r = Math.sqrt(R()); return [cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy]; });
const grid = (n, m, x0, y0, s, fill, gap = 3) => { let g = ''; for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) { const f = fill(r, c); if (f) g += Rc(x0 + c * s, y0 + r * s, s - gap, s - gap, {rx:Math.min(5, s / 4), ...f}); } return g; };
Object.assign(ART, {
  // MetaOpt: a heuristic and the optimum across inputs; the search finds the input with the widest gap (white)
  MetaOpt(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 10; i++) { const x = 24 + i * 27, o = 120 + R() * 40, hv = i === 6 ? o - 92 : o - 8 - R() * 22;
      g += Rc(x, 184 - o, 18, o, {rx:9, fill:'none', stroke:s2, 'stroke-width':3}) + Rc(x + 3, 184 - hv, 12, hv - 3, {rx:6, fill:s1}); }
    const x = 24 + 6 * 27 + 9; return g + Pa(`M${x + 22},${184 - 138}V${184 - 52}M${x + 15},${184 - 128}l7,-10l7,10M${x + 15},${184 - 62}l7,10l7,-10`, {stroke:WHITE, 'stroke-width':5});
  },

  // Shockwave: jobs scheduled on a GPU cluster over time; one job's allocation is resized as it runs (white)
  Shockwave(R, [bg, s1, s2]) {
    let g = ''; const rows = [[[10, 80], [96, 60], [164, 120]], [[10, 40], [56, 140], [204, 80]], [[10, 110], [128, 70], [206, 84]], [[10, 60], [76, 100], [184, 106]]];
    rows.forEach((L, i) => L.forEach(([x, w], j) => g += Rc(x, 30 + i * 38, w - 6, 26, {rx:13, fill:(i === 1 && j === 1) ? WHITE : s1})));
    return g + Rc(56, 106, 134, 26, {rx:13, fill:WHITE, 'fill-opacity':.55});
  },
  // BBQ: packets sorted into priority buckets in hardware; the lowest bucket's head leaves first (white)
  BBQ(R, [bg, s1, s2]) {
    let g = ''; [3, 1, 4, 2, 0, 3, 1, 2].forEach((n, i) => { const x = 18 + i * 35; g += Rc(x, 40, 26, 140, {rx:8, fill:s2, 'fill-opacity':.6});
      for (let j = 0; j < n; j++) g += Rc(x + 4, 160 - j * 24, 18, 16, {rx:5, fill:i === 0 && j === n - 1 ? WHITE : s1}); });
    return g + Pa('M31,104C31,40 70,22 110,24', {stroke:WHITE, 'stroke-width':5, 'stroke-dasharray':'2 8'}) + Rc(112, 16, 18, 16, {rx:5, fill:WHITE});
  },
  // RedTE: traffic engineering on a network; each router splits its traffic across paths (white flows)
  RedTE(R, [bg, s1, s2]) {
    const N = [[30, 100], [100, 40], [100, 160], [180, 70], [180, 140], [270, 100]], E = [[0, 1, 9], [0, 2, 5], [1, 3, 7], [2, 3, 3], [2, 4, 5], [3, 5, 8], [4, 5, 6], [1, 4, 2]];
    return E.map(([u, v, w], i) => Pa(`M${N[u]}L${N[v]}`, {stroke:[0, 2, 5].includes(i) ? WHITE : s1, 'stroke-width':w + 2})).join('') + N.map(p => C(p[0], p[1], 14, {fill:s2, stroke:bg, 'stroke-width':3})).join('');
  },
  // SVG-EAR: sparse attention over video tokens; kept blocks white, skipped ones compensated by a linear estimate (light)
  'SVG-EAR'(R, [bg, s1, s2]) {
    return grid(7, 12, 18, 14, 22.5, (r, c) => ((r * 5 + c * 3) % 7 === 0 || r === c % 7) ? {fill:WHITE} : {fill:s1, 'fill-opacity':.3 + ((r + c) % 4) * .15});
  },
  // AWQ: a weight matrix; the few channels that matter most for activations are kept precise (white), the rest quantized
  AWQ(R, [bg, s1, s2]) {
    let g = ''; for (let c = 0; c < 18; c++) { const hot = [3, 11, 14].includes(c); for (let r = 0; r < 8; r++) { const v = hot ? 1 : Math.round(R() * 3) / 3; g += Rc(18 + c * 15, 18 + r * 21, 11, 17, {rx:3, fill:hot ? WHITE : s1, 'fill-opacity':hot ? 1 : .35 + v * .6}); } }
    return g;
  },
  // StreamingLLM: attention in a long stream keeps the first tokens (the sink, white) and a recent window
  StreamingLLM(R, [bg, s1, s2]) {
    let g = ''; const n = 11, s = 16.5, x0 = 60, y0 = 8;
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { const sink = j < 1, win = i - j < 3; g += Rc(x0 + j * s, y0 + i * s, s - 3, s - 3, {rx:3, fill:sink ? WHITE : win ? s1 : s2, 'fill-opacity':sink || win ? 1 : .35}); }
    return g;
  },
  // KIVI: the KV cache in 2 bits; keys quantized per channel (columns), values per token (rows); one group full precision (white)
  KIVI(R, [bg, s1, s2]) {
    return grid(6, 6, 16, 30, 23, (r, c) => ({fill:s1, 'fill-opacity':.35 + (c % 3) * .3})) + grid(6, 6, 160, 30, 23, (r, c) => ({fill:c === 5 ? WHITE : s1, 'fill-opacity':c === 5 ? 1 : .35 + (r % 3) * .3}));
  },

  // GPU DBSCAN: dense clusters of points; core points ringed by their radius (white), noise apart
  'dbscan kernel'(R, [bg, s1, s2]) {
    const A = blob(R, 92, 104, 64, 52, 34), B = blob(R, 226, 76, 42, 40, 18); let g = '';
    g += A.map(p => C(p[0], p[1], 6, {fill:s1})).join('') + B.map(p => C(p[0], p[1], 6, {fill:s1})).join('');
    [A[0], A[3], B[1]].forEach(p => g += C(p[0], p[1], 24, {fill:'none', stroke:WHITE, 'stroke-width':3.5, 'stroke-dasharray':'5 5'}) + C(p[0], p[1], 8, {fill:WHITE}));
    for (let i = 0; i < 7; i++) g += C(14 + R() * 272, 14 + R() * 172, 5, {fill:'none', stroke:s1, 'stroke-width':3});
    return g;
  },
  // IVF-PQ: the space cut into cells around centroids; the query searches only the nearest cells (white)
  'ivf_pq kernel'(R, [bg, s1, s2]) {
    const S = [[40, 40], [120, 30], [210, 44], [275, 30], [60, 130], [150, 110], [230, 140], [30, 190], [130, 185], [280, 110]]; let g = '';
    for (let x = 3; x < 300; x += 6) for (let y = 3; y < 200; y += 6) { const d = S.map(s => Math.hypot(s[0] - x, s[1] - y)), j = d.indexOf(Math.min(...d)); const d2 = [...d].sort((a, b) => a - b);
      if (d2[1] - d2[0] < 5) g += Rc(x - 3, y - 3, 6, 6, {fill:s1}); else if (j === 5 || j === 2) g += Rc(x - 3, y - 3, 6, 6, {fill:WHITE, 'fill-opacity':.25}); }
    return g + S.map((p, i) => C(p[0], p[1], 8, {fill:i === 5 || i === 2 ? WHITE : s2})).join('') + C(178, 84, 9, {fill:'none', stroke:WHITE, 'stroke-width':4});
  },
  // GPU k-means: points pulled to their nearest centroid; the centroids move to the cluster means (white)
  'kmeans kernel'(R, [bg, s1, s2]) {
    const cs = [[80, 70], [214, 60], [150, 150]]; let g = '';
    cs.forEach(([x, y], j) => { blob(R, x, y, 56, 38, 18).forEach(p => g += Pa(`M${r1(p[0])},${r1(p[1])}L${x},${y}`, {stroke:s2, 'stroke-width':2, 'stroke-opacity':.7}) + C(p[0], p[1], 6, {fill:s1})); });
    cs.forEach(([x, y]) => g += Pa(`M${x - 22},${y + 16}L${x - 4},${y + 3}`, {stroke:WHITE, 'stroke-width':4, 'stroke-dasharray':'2 6'}) + Pa(`M${x - 10},${y}H${x + 10}M${x},${y - 10}V${y + 10}`, {stroke:WHITE, 'stroke-width':7}));
    return g;
  },
  // Hydragen: many sequences share one prompt prefix; attention over the shared trunk (white) is computed once
  Hydragen(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 7; i++) { const y = 22 + i * 26; g += Pa(`M140,100C180,100 180,${y} 220,${y}H284`, {stroke:s1, 'stroke-width':7}); g += C(284, y, 6, {fill:s2}); }
    return g + Pa('M16,100H140', {stroke:WHITE, 'stroke-width':14});
  },
  // Wanda: prune weights by size times input norm; the removed ones become outlines, the kept ones white
  Wanda(R, [bg, s1, s2]) {
    return grid(7, 12, 16, 14, 23, (r, c) => { const v = R(); return v < .45 ? {fill:'none', stroke:s1, 'stroke-width':2.5} : v > .85 ? {fill:WHITE} : {fill:s1}; });
  },
  // FastV: image tokens through the layers; after layer 2 half of them are dropped, the kept ones white
  FastV(R, [bg, s1, s2]) {
    let g = ''; for (let L = 0; L < 6; L++) for (let r = 0; r < 8; r++) { const keep = L < 2 || (r * 7 + L) % 2 === 0 || r % 3 === 0;
      if (keep) g += Rc(28 + L * 44, 16 + r * 22, 30, 16, {rx:5, fill:L >= 2 ? WHITE : s1}); }
    return g + Pa('M106,8V192', {stroke:s1, 'stroke-width':3, 'stroke-dasharray':'3 8'});
  },
  // DeepCache: a U-Net denoiser; the high-level features are cached across steps and only the shallow path recomputed (white)
  DeepCache(R, [bg, s1, s2]) {
    const lv = [[34, 34, 132], [78, 64, 72], [118, 92, 30]]; let g = '';
    lv.forEach(([x, y, h], i) => { const f = i ? s1 : WHITE, o = i ? .55 : 1; g += Rc(x, y, 30, h, {rx:8, fill:f, 'fill-opacity':o}) + Rc(300 - x - 30, y, 30, h, {rx:8, fill:f, 'fill-opacity':o}); });
    g += Pa('M70,52H230', {stroke:WHITE, 'stroke-width':6}) + Pa('M112,80H188', {stroke:s2, 'stroke-width':5, 'stroke-dasharray':'3 8'});
    return g + Rc(96, 58, 108, 80, {rx:22, fill:'none', stroke:s2, 'stroke-width':3, 'stroke-dasharray':'6 6'});
  },

  // Sparse VideoGen2: tokens permuted so tokens of the same meaning sit together; attention then hits dense blocks (white)
  SVG2(R, [bg, s1, s2]) {
    let g = ''; const mix = [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1];
    [[24, 0], [52, 1]].forEach(([y, k]) => mix.forEach((v, i) => g += Rc(18 + i * 17, y + k * 0, 13, 20, {rx:4, fill:(k ? 1 - v : v) ? WHITE : s1})));
    g += Pa('M150,82V112M140,102L150,114L160,102', {stroke:WHITE, 'stroke-width':5});
    const srt = [...mix].sort((a, b) => b - a); [[128, 0], [156, 1]].forEach(([y, k]) => srt.forEach((v, i) => g += Rc(18 + i * 17, y, 13, 20, {rx:4, fill:(k ? 1 - srt[15 - i] : v) ? WHITE : s1})));
    return g;
  },

  // lookahead decoding: n-gram guesses generated in parallel in a 2D window; one verified n-gram is white
  Lookahead(R, [bg, s1, s2]) {
    let g = ''; for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const on = r === 2 && c >= 2 && c <= 5; g += Rc(30 + c * 36, 22 + r * 34, 28, 26, {rx:7, fill:on ? WHITE : s1, 'fill-opacity':on ? 1 : .4 + ((r + c) % 3) * .2}); }
    return g;
  },
  // SliceGPT: delete rows and columns of every weight matrix; the smaller dense matrix left behind is white
  SliceGPT(R, [bg, s1, s2]) {
    const cut = c => [2, 6, 9].includes(c), cutr = r => [1, 5].includes(r);
    return grid(7, 12, 16, 14, 23, (r, c) => cut(c) || cutr(r) ? {fill:'none', stroke:s1, 'stroke-width':2.5, 'stroke-dasharray':'3 4'} : {fill:WHITE});
  },
  // Continuum: an agent's turns with tool calls in between; the KV cache is kept alive across the pause for a time-to-live (white)
  Continuum(R, [bg, s1, s2]) {
    let g = ''; [[24, 0], [24, 1], [24, 2]].forEach(([x], i) => { const y = 44 + i * 50; const seg = [[x, 70], [x + 100, 50], [x + 190, 62]];
      seg.forEach(([sx, w]) => g += Rc(sx, y, w, 22, {rx:11, fill:s1}));
      g += Pa(`M${x + 74},${y + 11}H${x + 96}M${x + 154},${y + 11}H${x + 186}`, {stroke:i === 1 ? WHITE : s2, 'stroke-width':i === 1 ? 7 : 4, 'stroke-dasharray':i === 1 ? '' : '3 6'}); });
    return g;
  },
  // LeapQuant: the recurrent state of linear attention, quantized step by step without drifting (white)
  LeapQuant(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 6; i++) { const x = 16 + i * 48; g += Rc(x, 34, 36, 64, {rx:8, fill:i === 5 ? WHITE : s1}); if (i < 5) g += Pa(`M${x + 38},66H${x + 46}`, {stroke:s1, 'stroke-width':5}); }
    const f = x => 150 + 26 * Math.sin(x / 34); let st = ''; for (let x = 16; x <= 290; x += 18) { const y = Math.round(f(x + 9) / 10) * 10; st += `${st ? 'H' + x + 'V' + y : 'M' + x + ',' + y}`; } st += 'H290';
    return g + Pa(wave(f, 16, 290, 3), {stroke:s2, 'stroke-width':4}) + Pa(st, {stroke:WHITE, 'stroke-width':5});
  },

  // cluster-wise SpGEMM: a sparse matrix reordered so its nonzeros gather into dense clusters (white)
  'Clusterwise SpGEMM'(R, [bg, s1, s2]) {
    let g = ''; for (let i = 0; i < 70; i++) g += Rc(14 + Math.floor(R() * 12) * 10, 30 + Math.floor(R() * 14) * 10, 7, 7, {rx:2, fill:s1});
    g += Pa('M148,100H166M158,92L168,100L158,108', {stroke:WHITE, 'stroke-width':5});
    [[180, 30, 4], [220, 70, 4], [252, 110, 3], [196, 150, 3]].forEach(([x, y, n]) => g += grid(n, n, x, y, 10, () => ({fill:WHITE}), 3));
    return g;
  },
  // Stream-K: output tiles of a matrix product dealt to the GPU's cores; the split tiles share work evenly (white)
  'Stream-K'(R, [bg, s1, s2]) {
    let g = ''; const s = 36; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { const t = i * 6 + j, x = 42 + j * s, y = 30 + i * s;
      if (t === 9 || t === 16) g += Rc(x, y, s / 2 - 3, s - 4, {rx:5, fill:WHITE}) + Rc(x + s / 2, y, s / 2 - 4, s - 4, {rx:5, fill:s2});
      else g += Rc(x, y, s - 4, s - 4, {rx:5, fill:t % 2 ? s1 : s2}); }
    return g;
  },
  // KAMI: a matrix product kept inside one GPU's registers and shared memory; the blocks that move are white
  KAMI(R, [bg, s1, s2]) {
    let g = grid(4, 4, 10, 52, 24, (r, c) => ({fill:r === 1 ? WHITE : s1})) + Tx(117, 112, '×', 34, s2) + grid(4, 4, 134, 52, 24, (r, c) => ({fill:c === 2 ? WHITE : s1}));
    return g + Tx(242, 112, '=', 34, s2) + grid(4, 4, 258, 70, 10, (r, c) => ({fill:r === 1 && c === 2 ? WHITE : s1}), 2);
  },

  // Berti prefetcher: a stream of memory accesses; the prefetcher learns the local deltas and fetches the next line early (white)
  'Berti prefetcher'(R, [bg, s1, s2]) {
    let g = Pa('M14,130H286', {stroke:s1, 'stroke-width':5}); const xs = [24, 60, 96, 132, 168, 204, 240];
    xs.forEach((x, i) => { if (i < 6) g += Pa(`M${x},122C${x},84 ${xs[i + 1]},84 ${xs[i + 1]},122`, {stroke:i === 5 ? WHITE : s1, 'stroke-width':i === 5 ? 6 : 4}); g += Rc(x - 9, 121, 18, 18, {rx:5, fill:i === 6 ? WHITE : s2}); });
    return g + Pa('M246,108l4,10l10,-4', {stroke:WHITE, 'stroke-width':4}) + Rc(266, 121, 18, 18, {rx:5, fill:'none', stroke:WHITE, 'stroke-width':3.5, 'stroke-dasharray':'4 4'});
  },
  // RUNLTS: a branch history of taken and not taken; nested tables predict the next outcome (white)
  RUNLTS(R, [bg, s1, s2]) {
    const hist = [1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1]; let d = 'M14,' + (hist[0] ? 60 : 110);
    hist.forEach((h, i) => d += `H${14 + (i + 1) * 22}V${hist[i + 1] === undefined ? (h ? 60 : 110) : hist[i + 1] ? 60 : 110}`);
    let g = Pa(d, {stroke:s1, 'stroke-width':6});
    [0, 1, 2].forEach(k => g += Rc(40 + k * 18, 140 - k * 0, 220 - k * 36, 14, {rx:7, fill:s2, 'fill-opacity':.5 + k * .2}));
    return g + Pa('M256,110V60', {stroke:WHITE, 'stroke-width':7, 'stroke-dasharray':'3 8'}) + C(272, 60, 10, {fill:WHITE});
  },
  // RegionsSort: parallel in-place radix sort; keys move into their digit's region (white region in place)
  RegionsSort(R, [bg, s1, s2]) {
    let g = ''; const h = Array.from({length:24}, () => 20 + R() * 120);
    h.forEach((v, i) => g += Rc(14 + i * 11.5, 100 - v / 2, 8, v / 2, {rx:3, fill:s1}));
    [...h].sort((a, b) => a - b).forEach((v, i) => g += Rc(14 + i * 11.5, 108, 8, v / 2, {rx:3, fill:i >= 8 && i < 16 ? WHITE : s2}));
    return g;
  },
  // parallel DBSCAN: points bucketed into grid cells; dense cells become cores of a cluster (white)
  'Parallel DBSCAN'(R, [bg, s1, s2]) {
    let g = ''; for (let x = 0; x <= 300; x += 40) g += Pa(`M${x},0V200`, {stroke:s1, 'stroke-width':2, 'stroke-opacity':.6}); for (let y = 0; y <= 200; y += 40) g += Pa(`M0,${y}H300`, {stroke:s1, 'stroke-width':2, 'stroke-opacity':.6});
    [[40, 40], [80, 40], [40, 80], [80, 80], [200, 120], [240, 120]].forEach(([x, y]) => g += Rc(x + 2, y + 2, 36, 36, {rx:4, fill:'none', stroke:WHITE, 'stroke-width':3}));
    return g + blob(R, 82, 82, 44, 40, 26).map(p => C(p[0], p[1], 5.5, {fill:s2})).join('') + blob(R, 240, 140, 40, 18, 14).map(p => C(p[0], p[1], 5.5, {fill:s2})).join('')
      + [[60, 62], [100, 100], [224, 138]].map(p => C(p[0], p[1], 8, {fill:WHITE})).join('');
  },

  // Hygra: hyperedges join any number of vertices; drawn as soft hulls, one hyperedge white
  Hygra(R, [bg, s1, s2]) {
    const N = [[50, 60], [104, 34], [120, 104], [176, 58], [234, 40], [250, 120], [180, 160], [70, 150]];
    const E = [[0, 1, 2], [2, 3, 6], [3, 4, 5], [0, 7, 2]];
    return E.map((e, j) => `<g opacity="${j === 1 ? .8 : .45}">` + Pa(`M${e.map(i => N[i].join(',')).join('L')}Z`, {fill:j === 1 ? WHITE : s1, stroke:j === 1 ? WHITE : s1, 'stroke-width':34}) + '</g>').join('')
      + N.map(p => C(p[0], p[1], 9, {fill:WHITE, stroke:bg, 'stroke-width':3})).join('');
  },

  // ParButterfly: a bipartite graph; the butterflies (complete 2-by-2 subgraphs) are counted, one white
  ParButterfly(R, [bg, s1, s2]) {
    const U = [30, 90, 150, 210, 270].map(x => [x, 40]), V = [30, 90, 150, 210, 270].map(x => [x, 160]);
    const E = [[0, 0], [0, 2], [1, 0], [1, 3], [2, 4], [3, 1], [3, 4], [4, 2], [4, 3], [0, 1], [2, 0]], B = [[1, 1], [1, 2], [2, 1], [2, 2]];
    return E.map(([a, b]) => Pa(`M${U[a]}L${V[b]}`, {stroke:s1, 'stroke-width':4})).join('') + B.map(([a, b]) => Pa(`M${U[a]}L${V[b]}`, {stroke:WHITE, 'stroke-width':7})).join('')
      + [...U, ...V].map((p, i) => C(p[0], p[1], 11, {fill:[1, 2, 6, 7].includes(i) ? WHITE : s2, stroke:bg, 'stroke-width':3})).join('');
  },
  // ConnectIt: connected components found by union-find; each component's tree hooks to one root (white roots)
  ConnectIt(R, [bg, s1, s2]) {
    const comps = [[[60, 46], [28, 110], [74, 112], [50, 168]], [[160, 40], [124, 100], [168, 104], [200, 160], [140, 164]], [[256, 64], [234, 130], [276, 140]]]; let g = '';
    comps.forEach(cp => { cp.slice(1).forEach(p => g += Pa(`M${p}L${cp[0]}`, {stroke:s1, 'stroke-width':6})); g += cp.slice(1).map(p => C(p[0], p[1], 10, {fill:s2, stroke:bg, 'stroke-width':3})).join('') + C(cp[0][0], cp[0][1], 13, {fill:WHITE}); });
    return g;
  },
});
window.taskArt = art;
window.ART_FIELD = Object.fromEntries(Object.entries(HUE).map(([k, v]) => [k, v[0]]));
})();
