/* The chart of the post "Agents do not budget their time or their submissions" (_posts/2026-11-14-budget-blind-agents.md):
   for each agent, the share of its time and of its submission budget it used, drawn in the page from the JSON in
   #budget-data and redrawn when its width changes. Epoch AI's chart grammar: the model name with the harness in grey
   below, a light grid, only the baseline axis, the values on hover or tap. Colours: Epoch teal 500 (time) and 700
   (submissions), as in the share card. */
(function () {
  var box = document.getElementById('budget-plot'), src = document.getElementById('budget-data');
  if (!box || !src) return;
  var D = JSON.parse(src.textContent);
  var C = { time: '#00a5a6', subs: '#034752', ink: '#1f1f1f', muted: '#5f6368', grid: '#eceff1', axis: '#9aa0a6', hover: '#f1f3f4' };
  var NS = 'http://www.w3.org/2000/svg', lastW = 0, tip = document.createElement('div');
  tip.className = 'bb-tip'; tip.hidden = true; box.appendChild(tip);
  var ctx = document.createElement('canvas').getContext('2d');
  var font = getComputedStyle(box).fontFamily;
  function textW(s, px, wt) { ctx.font = (wt || 400) + ' ' + px + 'px ' + font; return ctx.measureText(s).width; }
  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function pct(v) { return Math.round(v) + '%'; }

  function draw() {
    var W = Math.round(box.clientWidth);
    if (!W || W === lastW) return;
    lastW = W;
    var narrow = W < 520, fn = narrow ? 12 : 13, fh = narrow ? 11 : 12, pitch = narrow ? 38 : 40, bar = narrow ? 10 : 11;
    var L = 0;
    D.forEach(function (r) { L = Math.max(L, textW(r.model, fn, 400), textW(r.harness, fh, 400)); });
    L = Math.ceil(L);
    var x0 = L + 12, x1 = W - 14, top = 6, n = D.length, base = top + n * pitch, H = base + 46;
    var X = function (v) { return x0 + (x1 - x0) * v / 100; };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img',
      'aria-label': 'Share of the budget each agent used. ' + D.map(function (r) {
        return r.model + ' in ' + r.harness + ': time ' + pct(r.time) + ', submissions ' + pct(r.subs); }).join('; ') + '.' });
    var hl = el('rect', { x: 0, y: 0, width: W, height: pitch, fill: C.hover, opacity: 0 });
    svg.appendChild(hl);
    [0, 25, 50, 75, 100].forEach(function (v) {
      svg.appendChild(el('line', { x1: X(v), x2: X(v), y1: top - 4, y2: base, stroke: C.grid, 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: X(v), y: base + 18, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted }, String(v)));
    });
    svg.appendChild(el('line', { x1: x0, x2: x1, y1: base, y2: base, stroke: C.axis, 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: (x0 + x1) / 2, y: base + 40, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 500, fill: C.ink },
      'Share of the budget used (%)'));
    D.forEach(function (r, i) {
      var y = top + i * pitch;
      svg.appendChild(el('text', { x: L, y: y + 15, 'text-anchor': 'end', 'font-size': fn, fill: C.ink }, r.model));
      svg.appendChild(el('text', { x: L, y: y + 30, 'text-anchor': 'end', 'font-size': fh, fill: C.muted }, r.harness));
      svg.appendChild(el('rect', { x: x0, y: y + 7, width: X(r.time) - x0, height: bar, fill: C.time }));
      svg.appendChild(el('rect', { x: x0, y: y + 9 + bar, width: X(r.subs) - x0, height: bar, fill: C.subs }));
      var hit = el('rect', { x: 0, y: y, width: W, height: pitch, fill: 'transparent' });
      hit.dataset.i = i;
      svg.appendChild(hit);
    });
    function show(e) {
      var i = +e.target.dataset.i;
      if (isNaN(i)) return;
      var r = D[i], b = box.getBoundingClientRect();
      hl.setAttribute('y', top + i * pitch); hl.setAttribute('opacity', 1);
      tip.innerHTML = '<b>' + r.model + '</b> ' + r.harness + '<br>Time used ' + pct(r.time) + '<br>Submissions used ' + pct(r.subs);
      tip.hidden = false;
      var tx = Math.min(Math.max(e.clientX - b.left + 14, 0), W - tip.offsetWidth), ty = top + i * pitch + pitch + 4;
      if (ty + tip.offsetHeight > H) ty = top + i * pitch - tip.offsetHeight - 4;
      tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
    }
    function hide() { tip.hidden = true; hl.setAttribute('opacity', 0); }
    svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerdown', show);
    svg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    var old = box.querySelector('svg');
    if (old) box.replaceChild(svg, old); else box.insertBefore(svg, tip);
    hide();
  }
  document.addEventListener('pointerdown', function (e) { if (!box.contains(e.target)) { tip.hidden = true; var h = box.querySelector('svg rect'); if (h) h.setAttribute('opacity', 0); } });
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastW = 0; draw(); });
  if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(draw); }).observe(box);
  else window.addEventListener('resize', draw);
})();
