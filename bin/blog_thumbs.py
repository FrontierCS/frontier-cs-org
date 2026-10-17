#!/usr/bin/env python3
"""Blog list thumbnails: one 1600x1000 schematic per post, in the manner of the experiment thumbnails on wenhaochai.com
(a flat ground, ink outlines slightly roughened, fills printed a little off-register) in the site's blues.
Writes assets/img/blog-thumbs/<slug>.svg; a post picks its own with `thumbnail:` in its front matter.
    python3 bin/blog_thumbs.py"""
import math, os

BG, INK, MINT, SKY, BLUE, WHITE = '#edf2fa', '#1f1f1f', '#d3e3fd', '#a8c7fa', '#0b57d0', '#ffffff'
R = 'filter="url(#rough)"'

def box(x, y, w, h, fill=MINT, rx=14, sw=7, off=12):
    return (f'<rect x="{x + off}" y="{y + off}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" {R}/>')

def path(d, sw=7, dotted=False, colour=INK):
    dash = ' stroke-dasharray="1 17"' if dotted else ''
    return f'<path d="{d}" fill="none" stroke="{colour}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"{dash} {R}/>'

def line(x1, y1, x2, y2, **k): return path(f'M{x1} {y1} L{x2} {y2}', **k)

def arrow(x1, y1, x2, y2, **k):
    a = math.atan2(y2 - y1, x2 - x1); h = 22
    p = lambda da: f'{x2 - h * math.cos(a + da):.1f} {y2 - h * math.sin(a + da):.1f}'
    return line(x1, y1, x2, y2, **k) + path(f'M{p(.5)} L{x2} {y2} L{p(-.5)}', sw=k.get('sw', 7), colour=k.get('colour', INK))

def dot(x, y, r=16, fill=INK, ring=True):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"' + (f' stroke="{INK}" stroke-width="6" {R}' if ring else '') + '/>'

def lines(x, y, w, n, gap=32, sw=6, short=.64):
    return ''.join(line(x, y + i * gap, x + (w if i % 2 == 0 else w * short), y + i * gap, sw=sw) for i in range(n))

def poly(pts, **k): return path('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts), **k)

def axes(x0, y0, x1, y1): return path(f'M{x0} {y0} L{x0} {y1} L{x1} {y1}')

def humans():   # two curves on one axis: the agent's flattens, the human's keeps climbing
    ag = [(300 + i * 26, 760 - 380 * (1 - math.exp(-i / 6))) for i in range(41)]
    hu = [(300 + i * 26, 780 - 40 * i ** .5 - 9.5 * i) for i in range(41)]
    return (axes(260, 170, 1380, 820) + poly(ag, colour=BLUE, sw=9) + poly(hu, sw=9)
            + ''.join(dot(*hu[i], 15, WHITE) for i in (8, 18, 28, 38)) + ''.join(dot(*ag[i], 15, SKY) for i in (8, 18, 28, 38)))

def roadmap():  # three environments, each larger than the last: a task, a feedback loop, a repository
    return (box(150, 400, 200, 200, MINT) + lines(190, 450, 120, 4)
            + arrow(385, 500, 505, 500)
            + box(540, 330, 300, 340, SKY) + box(600, 390, 180, 90, WHITE, off=0) + box(600, 530, 180, 90, WHITE, off=0)
            + path('M800 435 Q880 500 800 575', dotted=True) + path('M580 575 Q500 500 580 435', dotted=True)
            + arrow(875, 500, 995, 500)
            + box(1030, 220, 420, 560, MINT) + ''.join(box(1080 + (i % 2) * 170, 270 + (i // 2) * 160, 130, 120, WHITE if i != 3 else BLUE, off=0) + (lines(1100 + (i % 2) * 170, 305 + (i // 2) * 160, 90, 3, 26, 5) if i != 3 else '') for i in range(6)))

def smith():    # one closed problem goes in, a fan of open-ended ones comes out
    out = ''.join(box(1010 + i * 34, 250 + i * 110, 300, 150, [MINT, SKY, MINT, SKY][i]) + lines(1050 + i * 34, 295 + i * 110, 200, 3, 30) for i in range(4))
    return (box(170, 380, 260, 240, WHITE) + path('M240 500 L285 545 L365 455', sw=10, colour=BLUE)
            + arrow(465, 500, 585, 500)
            + path('M620 330 L860 430 L860 570 L620 670 Z') + f'<path d="M632 342 L872 442 L872 582 L632 682 Z" fill="{BLUE}" opacity=".9"/>' + path('M620 330 L860 430 L860 570 L620 670 Z')
            + ''.join(arrow(895, 500, 990, 330 + i * 110, sw=6) for i in range(4)) + out)

def harbor():   # an agent and a judge in a loop, and the score of each submission
    bars = ''.join(box(990 + i * 100, 720 - h, 62, h, BLUE if i == 4 else SKY, rx=8, off=8) for i, h in enumerate((120, 210, 260, 380, 470)))
    return (box(170, 250, 330, 220, MINT) + lines(215, 305, 240, 4, 36) + box(170, 590, 330, 190, WHITE) + path('M250 690 L305 735 L420 635', sw=10, colour=BLUE)
            + path('M540 330 Q760 460 540 650', sw=7) + path('M518 640 L540 650 L548 626', sw=7)
            + path('M130 650 Q-10 460 130 330', dotted=True)
            + axes(940, 200, 1500, 740) + bars)

def calico():   # a hall of contestants, one of them ahead of the machine
    people = ''.join(dot(180 + c * 74, 250 + r * 100, 22, BLUE if (r, c) == (2, 7) else (MINT if (r * 5 + c * 3) % 4 else SKY)) for r in range(6) for c in range(12))
    return people + box(1180, 380, 250, 240, WHITE) + dot(1255, 470, 16, INK, False) + dot(1355, 470, 16, INK, False) + line(1250, 550, 1360, 550) + line(1305, 380, 1305, 320) + dot(1305, 300, 16, SKY)

def alma():     # an agent that writes what it learns to a memory and reads it back
    stack = ''.join(box(1000, 260 + i * 130, 400, 96, [MINT, SKY, MINT, BLUE][i], rx=48, off=10) for i in range(4))
    return (box(200, 340, 360, 320, WHITE) + dot(320, 450, 18, INK, False) + dot(440, 450, 18, INK, False) + path('M310 550 Q380 610 450 550')
            + arrow(600, 430, 960, 360) + path('M960 640 Q780 640 600 570', dotted=True) + path('M624 558 L600 570 L616 592', sw=7) + stack)

def evolving():  # generations of candidate agents; one lineage carries on
    out, gen = '', [[(260, 500)], [(560, 330), (560, 670)], [(860, 220), (860, 440), (860, 610), (860, 800)], [(1160, 160), (1160, 330), (1160, 500), (1160, 690)], [(1400, 330)]]
    keep = {(260, 500), (560, 330), (860, 440), (1160, 330), (1400, 330)}
    for a, b in zip(gen, gen[1:]):
        for i, q in enumerate(b):
            p = a[min(i * len(a) // len(b), len(a) - 1)]
            out += line(p[0] + 44, p[1], q[0] - 44, q[1], dotted=not (p in keep and q in keep), sw=7)
    return out + ''.join(box(x - 40, y - 40, 80, 80, BLUE if (x, y) in keep else MINT, rx=16, off=8) for g in gen for x, y in g)

def negative():  # the score over turns: up at first, then the model optimises it away
    pts = [(300 + i * 54, 760 - 430 * math.sin(min(i, 8) / 8 * math.pi / 2) + max(0, i - 8) ** 1.45 * 13) for i in range(20)]
    return (axes(260, 170, 1380, 820) + line(260, 330, 1380, 330, dotted=True) + poly(pts, sw=9, colour=BLUE)
            + ''.join(dot(x, y, 15, WHITE if i <= 8 else SKY) for i, (x, y) in enumerate(pts) if i % 2 == 0))

def pipeline():  # submissions queue up, run on a pool of machines, and land in a score table
    q = ''.join(box(150, 240 + i * 140, 220, 96, WHITE if i else MINT, off=8) + lines(185, 272 + i * 140, 150, 2, 30) for i in range(4))
    pool = ''.join(box(640, 250 + i * 190, 260, 130, SKY, off=10) + dot(700, 315 + i * 190, 14, BLUE if i == 1 else WHITE) + line(740, 315 + i * 190, 850, 315 + i * 190) for i in range(3))
    table = box(1130, 250, 330, 510, WHITE) + ''.join(line(1130, 350 + i * 82, 1460, 350 + i * 82, sw=5) for i in range(5)) + ''.join(f'<rect x="1320" y="{372 + i * 82}" width="{[110, 86, 70, 44, 30][i]}" height="34" rx="6" fill="{BLUE if i == 0 else SKY}"/>' + line(1160, 390 + i * 82, 1280, 390 + i * 82, sw=6) for i in range(5)) + line(1160, 302, 1420, 302, sw=8)
    return q + arrow(410, 500, 600, 500) + pool + arrow(940, 500, 1090, 500) + table

def release():   # the task set as a grid, and a ranking beside it
    grid = ''.join(f'<rect x="{180 + c * 62}" y="{220 + r * 62}" width="46" height="46" rx="8" fill="{BLUE if (r * 7 + c * 5) % 11 == 0 else (SKY if (r + c * 3) % 4 == 0 else MINT)}"/>' for r in range(10) for c in range(12))
    rank = ''.join(box(1020, 240 + i * 112, [460, 400, 320, 250, 190][i], 70, BLUE if i == 0 else (SKY if i < 3 else MINT), rx=10, off=8) for i in range(5))
    return grid + line(950, 200, 950, 820, dotted=True) + rank

def pir():       # a hint, one entry in each row of the database, and the two checksums that replace a list in every reply
    picks = {(0, 1), (1, 2), (2, 0), (3, 2)}
    grid = ''.join(f'<rect x="{190 + c * 130}" y="{190 + r * 160}" width="100" height="120" rx="12" fill="{BLUE if (r, c) in picks else MINT}"/>' for r in range(4) for c in range(4))
    return (grid + arrow(730, 500, 950, 500)
            + box(1000, 260, 400, 180, SKY) + lines(1050, 320, 300, 3, 30)
            + box(1000, 560, 400, 180, WHITE) + lines(1050, 620, 300, 3, 30))

POSTS = {'humans-still-beat-ai': humans, 'frontiercs-2-roadmap': roadmap, 'frontiersmith': smith, 'harbor': harbor, 'calico': calico,
         'alma': alma, 'agent-evaluation': evolving, 'negative-optimization': negative, 'evaluation': pipeline, 'feb-release': release,
         'quarterpir-two-checksums': pir}

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img', 'blog-thumbs'); os.makedirs(out, exist_ok=True)
    for slug, draw in POSTS.items():
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><filter id="rough" filterUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1000">'
               f'<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="4.5"/></filter></defs>'
               f'<rect width="1600" height="1000" fill="{BG}"/>{draw()}</svg>\n')
        open(os.path.join(out, slug + '.svg'), 'w').write(svg)
