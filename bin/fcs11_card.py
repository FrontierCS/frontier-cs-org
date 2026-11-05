"""Share card of the FrontierCS page (/v1/), 1200 x 630 CSS px at 2x: the lockup, FrontierCS 1.1 and one line, among stickers and
confetti in the page's hues (assets/js/fcs1.js HUES: blue, purple, teal). Each sticker is a motif from the page, drawn here as SVG:
polyomino packing, the stripe and diagonal colourings, the query boxes, the 60 + ln(r) score curve, leaderboard bars (owner, 2026-11-04).
Confetti and stickers use a fixed seed, so a rerun draws the same card.
usage (vis node, Playwright):  python bin/fcs11_card.py   writes assets/img/cards/frontiercs-1-1.png
"""
import pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'img' / 'cards' / 'frontiercs-1-1.png'
MARK = '<svg class="mk" viewBox="-5.5 -69.2 74.7 74.7"><path d="M0 -50 A50 50 0 0 1 50 0" fill="none" stroke="#1f1f1f" stroke-width="11" stroke-linecap="round"/><rect x="45.2" y="-69.2" width="24" height="24" rx="5.5" fill="#0b57d0"/></svg>'
# (motif, hue, centre x, centre y, rotation, size): one large and one small sticker per corner, as on the FrontierCS 2 card
S = [('pack', 'b', 150, 150, -8, 168), ('query', 'p', 352, 92, 7, 96), ('curve', 't', 1050, 150, 7, 168), ('diag', 'b', 848, 92, -6, 96),
     ('stripes', 'p', 150, 486, 6, 160), ('bars', 't', 352, 538, -5, 92), ('pieces', 't', 1050, 486, -7, 160), ('graph', 'p', 848, 538, 5, 92)]
st = ''.join(f'<div class="st" data-m="{m}" data-h="{h}" style="left:{x - w / 2}px;top:{y - w / 2}px;width:{w}px;height:{w}px;transform:rotate({r}deg);border-radius:{w * .14:.0f}px"></div>' for m, h, x, y, r, w in S)
HTML = f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=block">
<style>*{{box-sizing:border-box;margin:0}}
body{{width:1200px;height:630px;overflow:hidden;font-family:'Hanken Grotesk',sans-serif;color:#1f1f1f;position:relative;background:#fbfbfc}}
#conf{{position:absolute;left:0;top:0;width:1200px;height:630px}}
.st{{position:absolute;overflow:hidden;border:5px solid #fff;box-shadow:0 1px 3px rgba(60,64,67,.16),0 10px 26px rgba(60,64,67,.16)}}
.st svg{{width:100%;height:100%;display:block}}
.c{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:28px}}
.lock{{display:flex;align-items:center;font-size:38px;font-weight:500;letter-spacing:-.015em;line-height:1}}
.lock .mk{{width:1.18em;height:1.18em;margin-right:.34em}}
h1{{font-size:112px;font-weight:600;letter-spacing:-.03em;line-height:1;margin-top:30px;white-space:nowrap}}
.sub{{font-size:28px;color:#5f6368;margin-top:20px}}
</style></head><body><svg id="conf" viewBox="0 0 1200 630"></svg>{st}
<div class="c"><div class="lock">{MARK}<span>FrontierCS</span></div><h1>FrontierCS 1.1</h1><p class="sub">179 Open-Ended Algorithmic Problems</p></div>
<script>
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const HUE = {{b: ['#1a73e8', '#8ab4f8', '#d2e3fc'], p: ['#8e5bef', '#c5a8f7', '#e6dcfd'], t: ['#12a3a3', '#7fd1cf', '#cdeeed']}};
const W = (o, f = '#fff') => `fill="${{f}}" fill-opacity="${{o}}"`;
const M = {{
  pack: h => {{ let s = ''; const g = 10; for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {{ const r = rnd(); if (r < .78) s += `<rect x="${{x * g + .8}}" y="${{y * g + .8}}" width="8.4" height="8.4" rx="1.6" ${{W(r < .2 ? 1 : r < .5 ? .55 : .28)}}/>`; }} return s; }},
  pieces: h => {{ const P = [[[0,0],[1,0],[2,0],[1,1]], [[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[1,1],[2,1]], [[0,0],[1,0],[0,1],[1,1]], [[1,0],[0,1],[1,1],[2,1],[1,2]]];
    const pos = [[8,10],[52,8],[30,38],[66,44],[10,62],[48,70]]; return pos.map((p, i) => P[i % P.length].map(([a, b]) => `<rect x="${{p[0] + a * 10}}" y="${{p[1] + b * 10}}" width="9" height="9" rx="1.8" ${{W(i % 2 ? .95 : .5)}}/>`).join('')).join(''); }},
  stripes: h => {{ let s = '', x = 0; while (x < 100) {{ const w = 4 + Math.floor(rnd() * 9); s += `<rect x="${{x}}" y="0" width="${{w - 1.2}}" height="100" ${{W([.85, .5, .25, .65][Math.floor(rnd() * 4)])}}/>`; x += w; }} return s; }},
  diag: h => {{ let s = ''; for (let k = -10; k < 22; k++) s += `<path d="M${{k * 7}} 0 L${{k * 7 + 100}} 100" stroke="#fff" stroke-opacity="${{[.9, .45, .2][((k % 3) + 3) % 3]}}" stroke-width="5"/>`; return s; }},
  query: h => {{ let s = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {{ const on = (i * 3 + j) % 4 === 1; s += `<rect x="${{9 + j * 29}}" y="${{9 + i * 29}}" width="24" height="24" rx="5" fill="${{on ? '#fff' : 'none'}}" stroke="#fff" stroke-width="2.4"/><text x="${{21 + j * 29}}" y="${{27.5 + i * 29}}" font-size="15" font-weight="700" text-anchor="middle" font-family="Hanken Grotesk" fill="${{on ? HUE[h][0] : '#fff'}}">${{on ? (i + j) % 4 + 1 : '?'}}</text>`; }} return s; }},
  curve: h => `<path d="M12 88 H90 M12 88 V10" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M12 40 H90" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 4"/><path d="M12 88 C 26 70, 34 48, 46 40 S 70 26, 90 22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="46" cy="40" r="5.5" fill="#fff"/>`,
  bars: h => [78, 64, 58, 47, 40].map((w, i) => `<rect x="12" y="${{12 + i * 16}}" width="${{w}}" height="10" rx="3" ${{W(i ? .45 + .1 * (4 - i) : 1)}}/>`).join(''),
  graph: h => {{ const n = [[20,22],[52,14],[80,30],[34,52],[66,58],[22,82],[56,86],[84,76]], e = [[0,1],[1,2],[0,3],[1,3],[2,4],[3,4],[3,5],[4,6],[5,6],[4,7],[6,7],[1,4]];
    return e.map(([a, b]) => `<line x1="${{n[a][0]}}" y1="${{n[a][1]}}" x2="${{n[b][0]}}" y2="${{n[b][1]}}" stroke="#fff" stroke-opacity=".6" stroke-width="2.6"/>`).join('') + n.map(([x, y], i) => `<circle cx="${{x}}" cy="${{y}}" r="${{i % 3 ? 5 : 7}}" fill="#fff" fill-opacity="${{i % 3 ? .75 : 1}}"/>`).join(''); }},
}};
document.querySelectorAll('.st').forEach(e => {{ const h = e.dataset.h, F = HUE[h][0];
  const dots = Array.from({{length: 64}}, (_, i) => `<circle cx="${{(i % 8) * 12.5 + 6}}" cy="${{Math.floor(i / 8) * 12.5 + 6}}" r=".9" fill="#fff" fill-opacity=".18"/>`).join('');
  e.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="${{F}}"/>${{dots}}${{M[e.dataset.m](h)}}</svg>`; }});
// confetti in the three hues, kept out of the oval around the text
const conf = document.getElementById('conf'), cols = ['#1a73e8', '#8e5bef', '#12a3a3', '#8ab4f8', '#c5a8f7', '#7fd1cf'];
const free = (x, y) => ((x - 600) / 400) ** 2 + ((y - 288) / 170) ** 2 > 1;
for (let j = 0; j < 160; j++) {{ let x, y; do {{ x = 12 + rnd() * 1176; y = 12 + rnd() * 606; }} while (!free(x, y));
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', [2.5, 3, 3.5, 4, 5][Math.floor(rnd() * 5)]);
  c.setAttribute('fill', cols[Math.floor(rnd() * 6)]); c.setAttribute('opacity', (.22 + rnd() * .2).toFixed(2)); conf.append(c); }}
document.fonts.ready.then(() => window.DONE = true);
</script></body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.set_content(HTML, wait_until='networkidle'); pg.wait_for_function('window.DONE === true', timeout=30000); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT), timeout=90000); b.close()
assert not errs, errs
print(OUT)
