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

VIOLET, VIOLET_L, TEAL, TEAL_L = '#8e5bef', '#e6dcfd', '#12a3a3', '#cdeeed'

def B(x, y, w, h, label, fill='#fff', stroke=INK, size=16, weight=500, sub=None, tc=INK):
    """A labelled box, its text centred; `sub` is a second, lighter line."""
    t = T(x + w / 2, y + h / 2 + (6 if not sub else -3), label, size, weight, tc, 'middle')
    if sub: t += T(x + w / 2, y + h / 2 + 17, sub, 13, 400, MUTED, 'middle')
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{stroke}" stroke-width="2"/>' + t
def head(x, title, sub):
    return T(x, 52, title, 24, 600, anchor='middle') + T(x, 82, sub, 17, 400, MUTED, 'middle')
def chain(x, y, w, h, gap, items, vertical=False):
    g = ''
    for k, it in enumerate(items):
        lab, fill, stroke = (it + (None, None))[:3] if isinstance(it, tuple) else (it, None, None)
        bx, by = (x, y + k * (h + gap)) if vertical else (x + k * (w + gap), y)
        g += B(bx, by, w, h, lab, fill or '#fff', stroke or INK)
        if k: g += arrow(bx + w / 2, by - gap + 4, bx + w / 2, by - 4) if vertical else arrow(bx - gap + 4, by + h / 2, bx - 4, by + h / 2)
    return g

def eval_pipeline():
    """Hero of the evaluation post: different kinds of problem enter one pipeline, run on cluster pools, and leave as scores."""
    g = ''
    for k, lab in enumerate(('CUDA kernel', 'Cache policy', 'Parallel sort')): g += B(40, 80 + k * 90, 190, 60, lab, SOFT, LINE) + arrow(236, 110 + k * 90, 322, 200)
    g += B(330, 150, 200, 100, 'Evaluation pipeline', BLUE_L, BLUE, 17, 600) + arrow(536, 200, 596, 200)
    g += B(604, 110, 190, 180, '', '#fff', INK) + T(699, 140, 'Cluster pools', 16, 600, anchor='middle')
    for k, (c, n) in enumerate(((BLUE, 3), (VIOLET, 2), (TEAL, 1))):
        for j in range(n): g += R(630 + j * 48, 160 + k * 40, 38, 26, c, 5)
    g += arrow(800, 200, 860, 200)
    for k, v in enumerate((82, 46, 12)): g += R(868, 130 + k * 50, 1.4 * v, 26, BLUE if k == 0 else BLUE_L, 5)   # bar lengths are illustrative
    return g + T(930, 110, 'Scores', 16, 600, anchor='middle'), 1040, 340

def eval_traditional_vs_fcs():
    """A pass/fail benchmark runs a test; FrontierCS has to provision hardware, install dependencies and run a scoring harness to get a continuous score."""
    g = head(210, 'Traditional benchmark', 'Run the tests, read pass or fail') + head(730, 'FrontierCS', 'Each problem needs its own hardware and harness') + L(420, 30, 420, 470, LINE, 2)
    g += chain(110, 130, 200, 54, 26, ['Code', 'Tests', ('Pass or fail', SOFT, LINE)], True)
    g += chain(630, 118, 200, 48, 20, ['Code', ('Provision hardware', BLUE_L, BLUE), ('Install dependencies', BLUE_L, BLUE), ('Run scoring harness', BLUE_L, BLUE), ('Continuous score', SOFT, LINE)], True)
    return g, 1040, 490

def eval_pools():
    """Problems are grouped by the resources they need; each group gets its own pool of clusters, sized to the group."""
    g = T(40, 44, 'Problems grouped by resources', 20, 600) + T(640, 44, 'Cluster pools', 20, 600)
    for k, (lab, c, cl, n, pool) in enumerate((('GPU problems', BLUE, BLUE_L, 3, 'GPU pool'), ('CPU-heavy problems', VIOLET, VIOLET_L, 2, 'CPU pool'), ('Lightweight problems', TEAL, TEAL_L, 1, 'Small pool'))):
        y = 80 + k * 100
        g += B(40, y, 330, 64, lab, cl, c, 17, 600) + arrow(378, y + 32, 628, y + 32, c) + T(640, y + 18, pool, 15, 500, MUTED)
        for j in range(n): g += R(640 + j * 110, y + 28, 96, 36, c, 6)
    return g, 1040, 380

def eval_pin_hash():
    """Pin the environment, hash the solution and the problem, tag the result; any change invalidates the score and the run repeats."""
    cx, cy, r = 520, 250, 150; g = ''
    steps = (('Pin', 'hardware, drivers, deps'), ('Hash', 'solution + problem'), ('Tag', 'result carries hashes'), ('Invalidate', 'on any change, rerun'))
    pos = [(cx, cy - r), (cx + r * 1.7, cy), (cx, cy + r), (cx - r * 1.7, cy)]
    for k, ((a, b), (x, y)) in enumerate(zip(steps, pos)):
        x2, y2 = pos[(k + 1) % 4]
        g += P(f'M{x + (95 if k in (0, 2) else 0) * (1 if k == 0 else -1)} {y + (36 if k in (1, 3) else 0) * (1 if k == 1 else -1)} Q{(cx + (x2 - cx + x - cx) * .78):.0f} {(cy + (y2 - cy + y - cy) * .78):.0f} {x2 + (95 if (k + 1) % 4 in (0, 2) else 0) * (-1 if (k + 1) % 4 == 2 else 1) * (1 if k != 3 else -1)} {y2 + (36 if (k + 1) % 4 in (1, 3) else 0) * (-1 if (k + 1) % 4 == 1 else 1)}', BLUE, 2.5)
    for k, ((a, b), (x, y)) in enumerate(zip(steps, pos)): g += B(x - 95, y - 34, 190, 68, a, RED_L if k == 3 else BLUE_L, RED if k == 3 else BLUE, 18, 600, b)
    return g + T(cx, cy - 4, 'Same pinned', 16, 500, MUTED, 'middle') + T(cx, cy + 18, 'conditions', 16, 500, MUTED, 'middle'), 1040, 500

def eval_agentic():
    """Today a submission is a file that crosses a clear boundary into evaluation; an agent writes, runs, observes and iterates, so generating and evaluating interleave."""
    g = head(260, 'Today', 'A file crosses one boundary') + head(780, 'Agentic', 'Generation and evaluation interleave') + L(520, 30, 520, 430, LINE, 2)
    g += chain(60, 220, 120, 56, 24, ['LLM', 'Source file']) + L(338, 150, 338, 330, RED, 2, '6 6') + T(338, 140, 'boundary', 14, 500, RED, 'middle')
    g += arrow(308, 248, 368, 248) + B(376, 220, 120, 56, 'Sandbox', BLUE_L, BLUE) + arrow(436, 282, 436, 330) + B(376, 338, 120, 50, 'Score', SOFT, LINE)
    cx, cy = 780, 265; labs = ('Write code', 'Run it', 'Observe', 'Revise'); pos = [(cx - 150, cy - 70), (cx + 150, cy - 70), (cx + 150, cy + 70), (cx - 150, cy + 70)]
    for k, (x, y) in enumerate(pos):
        x2, y2 = pos[(k + 1) % 4]
        g += arrow(x + (70 if k == 0 else -70 if k == 2 else 0), y + (28 if k == 1 else -28 if k == 3 else 0), x2 + (-70 if k == 0 else 70 if k == 2 else 0), y2 + (-28 if k == 1 else 28 if k == 3 else 0), BLUE)
    for k, (x, y) in enumerate(pos): g += B(x - 66, y - 26, 132, 52, labs[k], BLUE_L, BLUE)
    return g + T(cx, cy + 6, 'Agent', 18, 600, anchor='middle'), 1040, 440

def suite_scale():
    """Earlier evaluations of evolving agents used a handful of tasks; the suite in the post has 200+ tasks, 172 of them FrontierCS problems."""
    g = head(210, 'Earlier evaluations', 'A handful of tasks') + head(730, 'With FrontierCS', '200+ tasks, 172 of them FrontierCS problems') + L(420, 30, 420, 430, LINE, 2)
    for k in range(8): g += R(138 + (k % 4) * 38, 210 + (k // 4) * 38, 28, 28, MUTED, 5)
    for k in range(204): g += R(460 + (k % 24) * 23, 130 + (k // 24) * 23, 17, 17, BLUE if k < 172 else LINE, 3)
    return g + R(460, 352, 17, 17, BLUE, 3) + T(486, 366, 'FrontierCS problem', 15) + R(680, 352, 17, 17, LINE, 3) + T(706, 366, 'other task', 15), 1040, 440

def permutation_task():
    """The Permutation task: a query is any sequence of length n, and the only reply is how many positions match the hidden permutation."""
    hid, q = [3, 4, 1, 6, 5, 2], [1, 4, 2, 6, 5, 3]; g = ''
    for k in range(6):
        x = 250 + k * 78; m = hid[k] == q[k]
        g += B(x, 70, 62, 72, '?', SOFT, LINE, 26, 600, tc=MUTED) + B(x, 220, 62, 72, str(q[k]), BLUE_L if m else '#fff', BLUE if m else INK, 26, 600)
        if m: g += L(x + 31, 148, x + 31, 214, BLUE, 2, '3 6')
    g += T(230, 114, 'Hidden permutation', 17, 600, anchor='end') + T(230, 264, 'Query', 17, 600, anchor='end')
    g += arrow(724, 256, 790, 256) + B(798, 224, 190, 64, '3 positions match', BLUE_L, BLUE, 17, 600)
    return g + T(520, 350, 'The agent sees only the number, never which positions matched. Fewer queries score higher.', 16, 400, MUTED, 'middle'), 1040, 380

def memory_or_not():
    """Without memory each iteration sees only the one before it; with memory every iteration reads and writes what all the earlier ones learned."""
    g = head(260, 'Without memory', 'Each step sees only the last idea and result') + head(780, 'With memory', 'Each step reads and writes what came before') + L(520, 30, 520, 400, LINE, 2)
    for side, x0 in ((0, 60), (1, 580)):
        for k in range(4):
            x = x0 + k * 104
            g += B(x, 150, 84, 60, f'Step {k + 1}', '#fff', INK, 15)
            if k: g += arrow(x - 18, 180, x - 3, 180)
            if side: g += arrow(x + 30, 214, x + 30, 286, BLUE) + arrow(x + 54, 286, x + 54, 214, BLUE)
        if side: g += B(x0, 292, 396, 60, 'Memory', BLUE_L, BLUE, 17, 600)
        else: g += T(x0 + 198, 320, 'Earlier steps are forgotten', 16, 400, MUTED, 'middle')
    return g, 1040, 410

def memory_designs():
    """Different objectives need different memory designs: one tuned to a single problem in a field, or one that carries knowledge across problems."""
    g = T(40, 44, 'Objective', 20, 600) + T(520, 44, 'Memory design it calls for', 20, 600)
    rows = (('One problem in chemistry', BLUE, BLUE_L), ('One problem in biology', VIOLET, VIOLET_L), ('One problem in computer science', TEAL, TEAL_L), ('Knowledge across problems', INK, SOFT))
    for k, (lab, c, cl) in enumerate(rows):
        y = 74 + k * 84; g += B(40, y, 380, 58, lab, cl, c, 17, 600) + arrow(428, y + 29, 508, y + 29, c)
        if k == 0: g += ''.join(L(540 + a * 60, y + 12 + (a % 2) * 34, 540 + b * 60, y + 12 + (b % 2) * 34, c, 2) for a, b in ((0, 1), (1, 2), (2, 3), (1, 3), (0, 2))) + ''.join(C(540 + a * 60, y + 12 + (a % 2) * 34, 8, c) for a in range(4))
        if k == 1: g += ''.join(R(530 + i * 52, y + 6 + j * 17, 46, 12, c if j == 0 else cl, 3) for i in range(4) for j in range(3))
        if k == 2: g += ''.join(R(530, y + 6 + j * 17, [210, 150, 180][j], 12, c if j == 0 else cl, 3) for j in range(3))
        if k == 3: g += ''.join(L(630, y + 8, 550 + a * 80, y + 48, MUTED, 2) for a in range(3)) + C(630, y + 8, 8, c) + ''.join(C(550 + a * 80, y + 48, 8, c) for a in range(3))
    return g + T(790, 240, 'The four sketches stand for', 15, 400, MUTED) + T(790, 262, 'different designs, not real ones', 15, 400, MUTED), 1040, 420

FIGS = {'2026-02-14-negative-optimization/closed-vs-open.svg': closed_vs_open, '2026-02-14-negative-optimization/query-budget.svg': query_budget,
        '2026-02-14-negative-optimization/best-of-n.svg': best_of_n, '2026-02-14-negative-optimization/binary-vs-continuous.svg': binary_vs_continuous,
        '2026-02-10-evaluation/pipeline.svg': eval_pipeline, '2026-02-10-evaluation/traditional-vs-frontiercs.svg': eval_traditional_vs_fcs,
        '2026-02-10-evaluation/cluster-pools.svg': eval_pools, '2026-02-10-evaluation/pin-hash-invalidate.svg': eval_pin_hash, '2026-02-10-evaluation/file-vs-agentic.svg': eval_agentic,
        '2026-03-06-agent-evaluation/suite-scale.svg': suite_scale, '2026-03-06-agent-evaluation/permutation-task.svg': permutation_task,
        '2026-03-15-alma/memory-or-not.svg': memory_or_not, '2026-03-15-alma/memory-designs.svg': memory_designs}

if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
    for path, draw in FIGS.items():
        body, w, h = draw()
        open(os.path.join(root, path), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" {FONT}><rect width="{w}" height="{h}" fill="#fff"/>{body}</svg>\n')
