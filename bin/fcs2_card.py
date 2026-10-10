#!/usr/bin/env python3
"""Draw the FrontierCS 2 share card for X and other link previews: assets/img/fcs2-card.png, 1200 x 630 CSS px at 2x.

Left: the FrontierCS brand, the page's name, what the benchmark is, the address. Right: the overview's task map, one
illustration per task (assets/js/fcs2-art.js) tiled by domain with white name chips, laid out as drawMap() in
assets/js/fcs2.js does. Task list and areas come from assets/js/fcs2-data.js, so the card follows the site's data.
Run on a vis node with Playwright: python bin/fcs2_card.py   (fonts load from Google Fonts)
"""
import pathlib
import tempfile

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
JS = ROOT / 'assets' / 'js'
OUT = ROOT / 'assets' / 'img' / 'fcs2-card.png'
W, H, MW, MH = 1200, 630, 640, 550           # card, and the map inside it (40 px from the top, right and bottom edges)

PAGE = f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=block">
<style>
html,body{{margin:0}}
.card{{position:relative; width:{W}px; height:{H}px; background:#fff; color:#1f1f1f; font-family:'Hanken Grotesk',sans-serif; overflow:hidden}}
.txt{{position:absolute; left:56px; top:52px; bottom:52px; width:{W - MW - 40 - 56 - 48}px; display:flex; flex-direction:column}}
.brand{{display:flex; align-items:center; gap:12px; font-size:26px; font-weight:500; letter-spacing:-.015em}}
.brand svg{{width:17px; height:17px; color:#0b57d0}}
h1{{font-size:64px; font-weight:600; line-height:1; letter-spacing:-.02em; margin:auto 0 18px}}
.sub{{font-size:29px; font-weight:500; line-height:1.2; margin:0 0 20px}}
.lead{{font-size:21px; line-height:1.35; color:#5f6368; margin:0 0 auto}}
.url{{font-size:20px; font-weight:500; color:#0b57d0}}
svg#map{{position:absolute; right:40px; top:40px; width:{MW}px; height:{MH}px}}
svg#map text{{font-family:'Hanken Grotesk',sans-serif}}
</style>
<script src="{(JS / 'fcs2-data.js').as_uri()}"></script><script src="{(JS / 'fcs2-art.js').as_uri()}"></script></head>
<body><div class="card">
<div class="txt">
  <div class="brand"><svg viewBox="49 47 81 100"><path d="M59.78 135.86 L75.94 71.24 A17.5 17.5 0 0 1 92.89 58 L118.5 58" fill="none" stroke="currentColor" stroke-width="21" stroke-linecap="round"/><circle cx="109" cy="97" r="10.5" fill="currentColor"/></svg>FrontierCS</div>
  <h1>FrontierCS 2</h1>
  <p class="sub">A benchmark for agentic computer&#8209;science R&amp;D</p>
  <p class="lead" id="lead"></p>
  <div class="url">frontier-cs.org</div>
</div>
<svg id="map" xmlns="http://www.w3.org/2000/svg"></svg>
</div><script>
document.getElementById('lead').textContent = `${{TASKS.length}} open-ended tasks in ${{DOMAINS.length}} domains, each built from a published paper. The authors’ own code is the bar to beat.`;
function squarify(vals, x, y, w, h) {{
  const tot = vals.reduce((a, b) => a + b, 0), areas = vals.map(v => v * w * h / tot), out = [];
  const worst = (row, side) => {{ const s = row.reduce((a, b) => a + b, 0); return Math.max(...row.map(r => Math.max(side * side * r / (s * s), s * s / (side * side * r)))); }};
  let i = 0;
  while (i < areas.length) {{
    const side = Math.min(w, h); let row = [areas[i]], j = i + 1;
    while (j < areas.length && worst([...row, areas[j]], side) <= worst(row, side)) row.push(areas[j++]);
    const s = row.reduce((a, b) => a + b, 0);
    if (w >= h) {{ const rw = s / h; let yy = y; row.forEach(r => {{ out.push([x, yy, rw, r / rw]); yy += r / rw; }}); x += rw; w -= rw; }}
    else {{ const rh = s / w; let xx = x; row.forEach(r => {{ out.push([xx, y, r / rh, rh]); xx += r / rh; }}); y += rh; h -= rh; }}
    i = j;
  }}
  return out;
}}
// drawMap() of the overview, without the hover card
function draw() {{
  const svg = document.getElementById('map'), W = {MW}, H = {MH}; svg.setAttribute('viewBox', `0 0 ${{W}} ${{H}}`);
  const byArea = AREAS.map(a => ({{a, n:a.d.reduce((s, d) => s + N_IN(d), 0)}})).sort((p, q) => q.n - p.n), G = 6, tol = .5;
  let unlabeled = [];
  squarify(byArea.map(x => x.n), 0, 0, W, H).forEach((ar, k) => {{
    const a = byArea[k].a, doms = [...a.d].sort((p, q) => N_IN(q) - N_IN(p));
    squarify(doms.map(N_IN), ...ar).forEach(([x, y, w, h], j) => {{
      const d = doms[j], n = N_IN(d);
      const x0 = x + (x > tol ? G / 2 : 0), y0 = y + (y > tol ? G / 2 : 0), x1 = x + w - (x + w < W - tol ? G / 2 : 0), y1 = y + h - (y + h < H - tol ? G / 2 : 0), bw = x1 - x0, bh = y1 - y0;
      const g = sv('g'), ts = TASKS.filter(t => t.d === d), gap = 2, cid = `clip${{k}}_${{j}}`;
      let rows = 1, sc = 1e9; for (let r = 1; r <= n; r++) {{ const c = Math.ceil(n / r), v = Math.abs(Math.log((bw / c) / (bh / r) / 1.5)); if (v < sc) {{ sc = v; rows = r; }} }}
      let i = 0, tiles = '';
      for (let r = 0; r < rows; r++) {{ const cnt = Math.floor(n / rows) + (r < n % rows ? 1 : 0), th = (bh - gap * (rows - 1)) / rows, tw = (bw - gap * (cnt - 1)) / cnt;
        for (let c = 0; c < cnt; c++, i++) tiles += taskArt(ts[i].s, a.k).replace('<svg class="art"', `<svg class="tile" x="${{(x0 + c * (tw + gap)).toFixed(1)}}" y="${{(y0 + r * (th + gap)).toFixed(1)}}" width="${{tw.toFixed(1)}}" height="${{th.toFixed(1)}}" preserveAspectRatio="xMidYMid slice"`); }}
      g.insertAdjacentHTML('beforeend', `<clipPath id="${{cid}}"><rect x="${{x0}}" y="${{y0}}" width="${{bw}}" height="${{bh}}" rx="8"/></clipPath><g clip-path="url(#${{cid}})"><rect x="${{x0}}" y="${{y0}}" width="${{bw}}" height="${{bh}}" fill="#fff"/>${{tiles}}</g>`);
      svg.append(g);
      const ink = AINK[a.k], meas = (str, fs) => {{ const t = sv('text', {{x:-999, y:-999, 'font-size':fs, 'font-weight':600}}, str); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; }};
      let labeled = false;
      for (const rot of [false, true]) {{ let done = false;
        for (const cnt of [true, false]) {{ for (const fs of [15, 13, 11]) {{
          const pw = meas(cnt ? `${{d}}  ${{n}}` : d, fs) + fs * 1.2, ph = fs * 1.75, m = fs < 13 ? 4 : 8, along = rot ? bh : bw, across = rot ? bw : bh;
          if (pw + 2 * m > along || ph + 2 * m > across) continue;
          const ox = x0 + m, oy = rot ? y0 + bh - m : y0 + m, chip = sv('g', {{transform:rot ? `rotate(-90 ${{ox}} ${{oy}})` : null}});
          chip.append(sv('rect', {{x:ox, y:oy, width:pw.toFixed(1), height:ph.toFixed(1), rx:(ph / 2).toFixed(1), fill:'#fff'}}));
          const t = sv('text', {{x:(ox + fs * .6).toFixed(1), y:(oy + ph * .68).toFixed(1), 'font-size':fs, 'font-weight':600, fill:ink}}, d);
          if (cnt) t.append(sv('tspan', {{'font-weight':400, dx:fs * .45}}, n));
          chip.append(t); g.append(chip); done = labeled = true; break; }}
          if (done) break; }}
        if (done) break; }}
      if (!labeled) unlabeled.push(d);
    }});
  }});
  window.UNLABELED = unlabeled; window.DONE = true;
}}
document.fonts.ready.then(draw);
</script></body></html>"""

with tempfile.NamedTemporaryFile('w', suffix='.html', dir=ROOT / 'bin', delete=False) as f:
    f.write(PAGE)
page = pathlib.Path(f.name)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(page.as_uri(), wait_until='networkidle')
        pg.wait_for_function('window.DONE === true', timeout=20000)
        assert not errs, errs
        assert not pg.evaluate('window.UNLABELED.length'), pg.evaluate('window.UNLABELED')
        assert pg.evaluate("document.fonts.check('600 64px \"Hanken Grotesk\"')"), 'Hanken Grotesk did not load'
        n = pg.evaluate("[document.querySelectorAll('svg.tile').length, TASKS.length]")
        assert n[0] == n[1], n
        pg.locator('.card').screenshot(path=str(OUT))
        b.close()
finally:
    page.unlink()
print(OUT, f'{W}x{H} at 2x, {n[0]} tiles')
