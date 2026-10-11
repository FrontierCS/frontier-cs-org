#!/usr/bin/env python3
"""Redrawn figures for blog posts, in the site's colours: plain schematics that replace early generated illustrations.
Each figure states only what its post states. Writes SVGs beside the post's other images.
    python3 bin/blog_figures.py"""
import math, os, random

INK, MUTED, LINE, SOFT = '#1f1f1f', '#5f6368', '#dadce0', '#f1f3f4'
BLUE, BLUE_L, RED, RED_L, GREEN, GREEN_L = '#0b57d0', '#d3e3fd', '#d93025', '#fad2cf', '#188038', '#ceead6'
FONT = "font-family=\"'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif\""

def T(x, y, s, size=20, w=400, fill=INK, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{w}" fill="{fill}" text-anchor="{anchor}">{s}</text>'
def L(x1, y1, x2, y2, c=INK, sw=2, dash=''):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{sw}" stroke-linecap="round"' + (f' stroke-dasharray="{dash}"' if dash else '') + '/>'
def R(x, y, w, h, fill, rx=6, stroke='none'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'
def C(x, y, r, fill, stroke='none', sw=2):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def P(d, c=INK, sw=2.5, fill='none', dash=''):
    return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' + (f' stroke-dasharray="{dash}"' if dash else '') + '/>'
def arrow(x1, y1, x2, y2, c=INK, sw=2.5):
    a = math.atan2(y2 - y1, x2 - x1); h = 11
    p = lambda da: f'{x2 - h * math.cos(a + da):.1f} {y2 - h * math.sin(a + da):.1f}'
    return L(x1, y1, x2, y2, c, sw) + P(f'M{p(.45)} L{x2} {y2} L{p(-.45)}', c, sw)

def closed_vs_open():
    """Hero: a closed-ended problem has one answer and a verifier that rejects the rest; an open-ended one has many valid answers of different quality."""
    g = T(260, 52, 'Closed-ended problem', 24, 600, anchor='middle') + T(260, 82, 'One answer; the verifier rejects the rest', 17, 400, MUTED, 'middle')
    g += T(780, 52, 'Open-ended problem', 24, 600, anchor='middle') + T(780, 82, 'Many valid answers; some score higher', 17, 400, MUTED, 'middle')
    g += L(520, 30, 520, 470, LINE, 2)
    s = (90, 290)
    for k, y in enumerate((150, 220, 360, 430)):
        g += P(f'M{s[0] + 18} {s[1]} C210 {s[1]} 240 {y} 360 {y}', RED, 2.5, dash='2 9') + P(f'M366 {y - 9} L384 {y + 9} M384 {y - 9} L366 {y + 9}', RED, 3)
    g += arrow(s[0] + 18, s[1], 372, 290, GREEN, 4) + C(402, 290, 22, GREEN_L, GREEN, 2.5) + P('M391 290 L399 299 L414 281', GREEN, 3.5)
    g += C(*s, 16, '#fff', INK, 2.5)
    s2 = (610, 290); ends = [(930, 140, 34), (950, 215, 58), (960, 290, 91), (950, 365, 72), (930, 440, 47)]
    for x, y, v in ends:
        g += P(f'M{s2[0] + 18} {s2[1]} C720 {s2[1]} 760 {y} {x - 20 - v * .12:.0f} {y}', BLUE, 2.5)
        g += C(x, y, 9 + v * .12, BLUE_L, BLUE, 2.5) + T(x, y + 6, str(v), 15, 600, BLUE, 'middle')
    return g + C(*s2, 16, '#fff', INK, 2.5), 1040, 500

def query_budget():
    """The Hedgehog Graph case: round 1 finishes near 1,200 queries (about 20 points); round 2 spends 800 on staged guesses, then the same search runs past the 2,500 limit."""
    X = lambda q: 110 + q * .29; g = ''
    g += T(110, 44, 'Hedgehog Graph: queries used out of a budget of 2,500', 22, 600)
    for q, lab in ((0, '0'), (500, '500'), (1200, '1,200'), (2000, '2,000'), (2500, '2,500')):
        g += L(X(q), 92, X(q), 340, LINE, 1.5, '3 6' if q not in (0, 2500) else '') + T(X(q), 366, lab, 15, 400, MUTED, 'middle')
    g += T(X(250), 84, '100 points', 14, 500, GREEN, 'middle') + T(X(1500), 84, 'score falls quadratically', 14, 400, MUTED, 'middle') + T(X(2500) + 12, 84, '0 points', 14, 500, RED)
    g += L(X(2500), 92, X(2500), 340, RED, 2.5)
    g += T(100, 162, 'Round 1', 17, 600, anchor='end') + R(X(0), 138, X(1200) - X(0), 40, BLUE) + T(X(1200) + 12, 164, 'random collisions · about 20 points', 16, 500)
    g += T(100, 262, 'Round 2', 17, 600, anchor='end') + R(X(0), 238, X(800) - X(0), 40, RED_L, stroke=RED) + T(X(400), 264, 'staged guesses', 15, 500, RED, 'middle')
    g += R(X(800), 238, X(2000) - X(800), 40, BLUE) + f'<path d="M{X(2000)} 238 H{X(2500) + 60} V278 H{X(2000)} Z" fill="{BLUE}" opacity=".35"/>'
    g += T(X(1400), 264, 'the same random search', 15, 500, '#fff', 'middle') + T(X(2500) + 12, 310, 'over the limit', 16, 600, RED)
    return g, 1040, 390

def best_of_n():
    """Best-of-N keeps only the top-scoring rollout, so a wide spread wins over a narrow one with the same average."""
    rnd = random.Random(4); g = T(110, 44, 'Best-of-N keeps the highest score, which rewards spread', 22, 600)
    X = lambda v: 250 + v * 6.6
    g += L(X(0), 300, X(100), 300, INK, 2) + ''.join(L(X(v), 300, X(v), 308, INK, 2) + T(X(v), 330, str(v), 15, 400, MUTED, 'middle') for v in (0, 25, 50, 75, 100)) + T(X(50), 358, 'score of one rollout', 15, 400, MUTED, 'middle')
    rows = (('Steady policy', [44, 47, 50, 52, 49, 55, 46, 53], 130, MUTED), ('Risky policy', [3, 8, 96, 14, 61, 5, 22, 88], 220, BLUE))
    for name, vals, y, c in rows:
        g += T(230, y + 6, name, 17, 600, anchor='end') + L(X(0), y, X(100), y, LINE, 1.5)
        top = max(vals)
        for v in vals: g += C(X(v), y + rnd.uniform(-3, 3), 9, c if v == top and c == BLUE else '#fff', c, 2.5)
        g += T(X(100) + 22, y + 6, f'best: {top}', 16, 600, c)
    g += P(f'M{X(96)} 196 V172', BLUE, 2) + T(X(96), 162, 'kept', 14, 600, BLUE, 'middle')
    return g, 1040, 380

def binary_vs_continuous():
    """A pass/fail benchmark puts different systems in the same bucket; a continuous score separates them."""
    g = T(260, 52, 'Pass or fail', 24, 600, anchor='middle') + T(260, 82, 'Different systems land in one bucket', 17, 400, MUTED, 'middle')
    g += T(780, 52, 'Continuous score', 24, 600, anchor='middle') + T(780, 82, 'The same systems are told apart', 17, 400, MUTED, 'middle') + L(520, 30, 520, 400, LINE, 2)
    cols = [BLUE, '#8e5bef', '#12a3a3', '#e8710a', MUTED, GREEN]
    g += R(70, 130, 170, 200, SOFT, 10, LINE) + R(280, 130, 170, 200, SOFT, 10, LINE) + T(155, 362, 'fail', 17, 600, anchor='middle') + T(365, 362, 'pass', 17, 600, anchor='middle')
    for k, (x, y) in enumerate(((330, 190), (400, 190), (330, 250), (400, 250), (365, 300), (155, 230))): g += C(x, y, 15, cols[k], '#fff', 3)
    g += L(600, 250, 960, 250, INK, 2.5) + ''.join(L(600 + i * 90, 250, 600 + i * 90, 260, INK, 2) for i in range(5)) + T(600, 290, 'low', 15, 400, MUTED, 'middle') + T(960, 290, 'high', 15, 400, MUTED, 'middle')
    for k, v in enumerate((.86, .71, .64, .52, .43, .12)): g += L(600 + v * 360, 250, 600 + v * 360, 200, cols[k], 2) + C(600 + v * 360, 186, 15, cols[k], '#fff', 3)
    return g, 1040, 420

FIGS = {'2026-02-14-negative-optimization/closed-vs-open.svg': closed_vs_open, '2026-02-14-negative-optimization/query-budget.svg': query_budget,
        '2026-02-14-negative-optimization/best-of-n.svg': best_of_n, '2026-02-14-negative-optimization/binary-vs-continuous.svg': binary_vs_continuous}

if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
    for path, draw in FIGS.items():
        body, w, h = draw()
        open(os.path.join(root, path), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" {FONT}><rect width="{w}" height="{h}" fill="#fff"/>{body}</svg>\n')
