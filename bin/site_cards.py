#!/usr/bin/env python3
"""Draw the link-preview cards (Open Graph and X) of the pages that have no card of their own: assets/img/cards/<name>.png,
1200 x 630 CSS px at 2x, in the style of the FrontierCS 2 card (bin/fcs2_card.py): white, the brand top left, the page's
name, one line, the address, and one picture on the right taken from the page itself.

The FrontierCS 2 overview and the task pages use assets/img/fcs2-card.png, drawn by bin/fcs2_card.py.
Run with Playwright:  python bin/site_cards.py   (fonts load from Google Fonts)
"""
import base64, pathlib, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / 'assets' / 'img'
OUT = IMG / 'cards'
W, H, PW, PH = 1200, 630, 620, 550   # card, and the picture on the right (40 px from the top, right and bottom edges)

BRAND = ('<div class="brand"><svg viewBox="-5.5 -69.2 74.7 74.7">'
         '<path d="M0 -50 A50 50 0 0 1 50 0" fill="none" stroke="#1f1f1f" stroke-width="11" stroke-linecap="round"/><rect x="45.2" y="-69.2" width="24" height="24" rx="5.5" fill="#0b57d0"/>'
         '</svg>FrontierCS</div>')   # the arc and the tile beyond it (owner: proposal 7)

def uri(p):
    p = IMG / p; kind = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg'}[p.suffix]
    return f'data:{kind};base64,' + base64.b64encode(p.read_bytes()).decode()

def tiles(paths, cols, ratio, gap=10, fit='cover', pad=0, bg='#fff'):
    """A grid of pictures filling the right panel."""
    rows = -(-len(paths) // cols); tw = (PW - gap * (cols - 1)) / cols; th = min(tw / ratio, (PH - gap * (rows - 1)) / rows)
    return (f'<div class="grid" style="grid-template-columns:repeat({cols},{tw:.0f}px); grid-auto-rows:{th:.0f}px; gap:{gap}px">'
            + ''.join(f'<div class="tile" style="background:{bg}; padding:{pad}px"><img src="{uri(p)}" style="object-fit:{fit}"></div>' for p in paths) + '</div>')

def one(path):
    return f'<div class="one"><img src="{uri(path)}"></div>'

def workshop_art():   # the challenge chart of the workshop page, as drawn there
    s = (ROOT / '_pages' / 'workshop.md').read_text()
    svg = re.search(r'<svg class="chg-art".*?</svg>', s, re.S).group(0)
    return '<div class="one art">' + svg.replace('class="chg-art"', 'class="chg-art" width="100%"') + '</div>'

papers = sorted(p.relative_to(IMG) for p in (IMG / 'fcs1-papers').glob('*.jpg'))[:6]
marks = ['berkeley', 'princeton', 'stanford', 'mit', 'washington', 'ucsd', 'nyu', 'uiuc', 'michigan', 'toronto', 'gatech', 'ntu']
CARDS = {
    'frontiercs': ('FrontierCS', 'Open-ended algorithmic problems',
                   '180 problems where any valid answer is accepted and a better one scores higher.', one('blog-thumbs/feb-release.svg')),
    'workshop': ('Workshop', 'How Far Are AI Agents from Becoming Computer Scientists?',
                 'A proposed ICLR 2027 workshop and challenge.', workshop_art()),
    'research': ('Research', 'Papers from the FrontierCS team',
                 'The benchmarks, and the work built on them.', tiles(papers, 3, 0.78, pad=0, bg='#f1f3f4')),
    'team': ('Team', 'The people behind FrontierCS',
             'Authors, institutions, partners and sponsors.', tiles([f'institutions/wordmarks/{m}.png' for m in marks], 3, 2.2, gap=14, fit='contain', pad=14)),
    'blog': ('Blog', 'Notes from FrontierCS',
             'Research notes, releases and agent evaluations.', tiles([f'blog-thumbs/{n}.svg' for n in ['humans-still-beat-ai', 'frontiercs-2-roadmap', 'calico', 'frontiersmith', 'alma', 'negative-optimization']], 2, 1.6)),
    'post-alma': ('Blog', 'Evaluating ALMA on FrontierCS', 'Auto building agent memory for open algorithm problems.', one('blog-thumbs/alma.svg')),
    'post-harbor': ('Blog', 'Open-ended problems in Harbor', 'A long-horizon agent leaderboard on 178 algorithmic tasks.', one('blog-thumbs/harbor.svg')),
}

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=block">
<style>
html,body{margin:0}
.card{position:relative; width:%(W)dpx; height:%(H)dpx; background:#fff; color:#1f1f1f; font-family:'Hanken Grotesk',sans-serif; overflow:hidden}
.txt{position:absolute; left:56px; top:52px; bottom:52px; width:%(TW)dpx; display:flex; flex-direction:column}
.brand{display:flex; align-items:center; gap:12px; font-size:26px; font-weight:500; letter-spacing:-.015em}
.brand svg{width:26px; height:26px}
h1{font-size:60px; font-weight:600; line-height:1.02; letter-spacing:-.02em; margin:auto 0 18px; text-wrap:balance}
.sub{font-size:29px; font-weight:500; line-height:1.2; margin:0 0 20px; text-wrap:balance}
.lead{font-size:21px; line-height:1.35; color:#5f6368; margin:0 0 auto}
.url{font-size:20px; font-weight:500; color:#0b57d0}
.pic{position:absolute; right:40px; top:40px; width:%(PW)dpx; height:%(PH)dpx; display:flex; align-items:center; justify-content:center}
.grid{display:grid; justify-content:center; align-content:center}
.tile{border-radius:10px; overflow:hidden; box-sizing:border-box; display:flex}
.tile img{width:100%%; height:100%%}
.one{width:100%%; border-radius:14px; overflow:hidden; background:#edf2fa}
.one img{display:block; width:100%%}
.one.art{background:#fff; padding:20px; box-sizing:border-box}
.one.art .chg-run{stroke-dasharray:none}
</style></head>
<body><div class="card"><div class="txt">%(BRAND)s<h1>%(t)s</h1><p class="sub">%(s)s</p><p class="lead">%(l)s</p><div class="url">frontier-cs.org</div></div>
<div class="pic">%(pic)s</div></div></body></html>"""

OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
    for name, (t, s, l, pic) in CARDS.items():
        pg.set_content(PAGE % dict(W=W, H=H, PW=PW, PH=PH, TW=W - PW - 40 - 56 - 44, BRAND=BRAND, t=t, s=s, l=l, pic=pic), wait_until='networkidle')
        pg.evaluate('document.fonts.ready')
        over = pg.evaluate("""[...document.querySelectorAll('.txt > *')].some(e => e.scrollWidth > e.clientWidth + 1)
          || document.querySelector('.txt').scrollHeight > document.querySelector('.txt').clientHeight + 1""")
        assert not over, f'{name}: the text does not fit'
        pg.locator('.card').screenshot(path=str(OUT / f'{name}.png'))
        print(OUT / f'{name}.png')
    b.close()
