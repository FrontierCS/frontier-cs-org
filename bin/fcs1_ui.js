/* FrontierCS (v1) page: the packing search replay, leaderboard tabs and the sub-nav. */
(() => {
// One local search on Polyomino Packing (problem 0's rules, 300 random pieces of 1 to 10 cells), recorded at every
// improvement: [iteration, score, W, H, placements], five characters per piece: orientation, then x and y in base 36.
// The pieces themselves are regenerated here from the search's seed (bin/fcs1_search.js made the record).
const PK = __DATA__;
const TONES = ['#1a73e8', '#8ab4f8', '#4285f4', '#aecbfa', '#185abc', '#669df6'];
const $ = id => document.getElementById(id), canvas = $('pkcanvas');
__GEN__
if (canvas) {
  const pieces = pkInstance(PK.n, pkRng(PK.seed)).pieces;
  const snaps = PK.hist.map(([it, score, W, H, s]) => { const g = new Int16Array(W * H).fill(-1);
    pieces.forEach((os, id) => { const o = os[+s[5 * id]], x = parseInt(s.substr(5 * id + 1, 2), 36), y = parseInt(s.substr(5 * id + 3, 2), 36);
      for (const [cx, cy] of o.c) g[(y + cy) * W + x + cx] = id; });
    return {it, score, W, H, g}; });
  const LAST = PK.iters, L = Math.log10(LAST);
  let shown = -1;
  const draw = k => { const s = snaps[k], box = canvas.parentNode, dpr = window.devicePixelRatio || 1;
    const cell = Math.max(2, Math.floor(Math.min(box.clientWidth / s.W, 460 / s.H))), px = Math.round(cell * dpr);   // each packing fills the box
    canvas.width = s.W * px + 2; canvas.height = s.H * px + 2; canvas.style.width = (canvas.width / dpr) + 'px'; canvas.style.height = (canvas.height / dpr) + 'px';
    const c = canvas.getContext('2d'); c.translate(1, 1); c.fillStyle = '#f1f3f4'; c.fillRect(0, 0, s.W * px, s.H * px);
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) { const id = s.g[y * s.W + x]; if (id < 0) continue;
      c.fillStyle = TONES[id % TONES.length]; c.fillRect(x * px, y * px, px, px); }
    c.fillStyle = '#fff'; const lw = Math.max(1, Math.round(dpr));   // white seams between different pieces
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) { const id = s.g[y * s.W + x];
      if (x + 1 < s.W && s.g[y * s.W + x + 1] !== id) c.fillRect((x + 1) * px - lw / 2, y * px, lw, px);
      if (y + 1 < s.H && s.g[(y + 1) * s.W + x] !== id) c.fillRect(x * px, (y + 1) * px - lw / 2, px, lw); }
    c.strokeStyle = '#3c4043'; c.lineWidth = lw; c.strokeRect(0, 0, s.W * px, s.H * px);
    $('pkscore').textContent = s.score.toFixed(1); $('pkrect').textContent = `${s.W} × ${s.H}`; };

  // score against iterations, log scale: the whole run in grey, the part replayed so far in blue
  const svg = $('pksvg'), Y0 = Math.floor(snaps[0].score / 20) * 20, M = {l: 40, r: 16, t: 12, b: 40};
  let Wc = 0, Hc = 0; const X = it => M.l + Math.log10(it) / L * (Wc - M.l - M.r), Y = v => M.t + (100 - v) / (100 - Y0) * (Hc - M.t - M.b);
  const path = upto => { let d = `M${X(1).toFixed(1)},${Y(snaps[0].score).toFixed(1)}`;
    for (let k = 1; k < snaps.length && snaps[k].it <= upto; k++) d += `H${X(snaps[k].it).toFixed(1)}V${Y(snaps[k].score).toFixed(1)}`;
    return d + `H${X(upto).toFixed(1)}`; };
  const frame = () => { Wc = svg.parentNode.clientWidth; Hc = Math.max(220, Math.min(320, Wc * .5)); svg.setAttribute('viewBox', `0 0 ${Wc} ${Hc}`); svg.setAttribute('height', Hc);
    let h = ''; for (let v = Y0; v <= 100; v += 20) h += `<line x1="${M.l}" x2="${Wc - M.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${M.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    for (let e = 0; e <= L; e++) h += `<text x="${X(10 ** e)}" y="${Hc - M.b + 18}" text-anchor="middle">${e < 3 ? 10 ** e : e < 6 ? 10 ** (e - 3) + 'k' : 10 ** (e - 6) + 'M'}</text>`;
    h += `<text class="ax" x="${(M.l + Wc - M.r) / 2}" y="${Hc - 4}" text-anchor="middle">Search iterations, log scale</text>`;
    h += `<path d="${path(LAST)}" fill="none" stroke="var(--line)" stroke-width="2"/><path id="pkline" fill="none" stroke="var(--teal)" stroke-width="2.5" stroke-linejoin="round"/><circle id="pkdot" r="5" fill="var(--teal)" stroke="#fff" stroke-width="2"/>`;
    svg.innerHTML = h; };
  const show = it => { let k = 0; while (k + 1 < snaps.length && snaps[k + 1].it <= it) k++;
    if (k !== shown) draw(shown = k);
    $('pkiter').textContent = Math.round(it).toLocaleString('en-US'); $('pkline').setAttribute('d', path(it));
    $('pkdot').setAttribute('cx', X(it)); $('pkdot').setAttribute('cy', Y(snaps[k].score)); };
  let raf = 0, t0 = 0; const DUR = 16000;
  const tick = now => { const t = Math.min(1, (now - t0) / DUR); show(10 ** (t * L)); raf = t < 1 ? requestAnimationFrame(tick) : 0; };
  const play = () => { cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(tick); };
  frame(); show(LAST);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); play(); } }, {threshold: .4}); io.observe(canvas); }
  $('pkreplay').onclick = play;
  addEventListener('resize', () => { frame(); shown = -1; if (!raf) show(LAST); });
}

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
