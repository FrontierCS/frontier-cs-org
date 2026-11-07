#!/usr/bin/env python3
"""The leaderboard chart of the FrontierCS 2 update post (_posts/2026-11-06-frontiercs-2-update.md), in the style of
bin/blog_carbon_figures.py: FCI of every model on the leaderboard with its 90% interval, the four models this update adds in
their lab colours and the rest in grey. Two widths, 760 and 360 (phones), as SVG files in assets/img/blog/frontiercs-2-update/
and inline in the post between <!-- update-fci --> and <!-- /update-fci -->.
    python3 bin/blog_update_figures.py [path/to/fcs2-data.js]   (default: this tree's assets/js/fcs2-data.js)"""
import html, json, os, re, sys

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(SITE, 'assets', 'img', 'blog', 'frontiercs-2-update')
POST = os.path.join(SITE, '_posts', '2026-11-06-frontiercs-2-update.md')
DATA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SITE, 'assets', 'js', 'fcs2-data.js')
FONT = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif"
INK, MUTED, FAINT, BAR, GRID = '#1f1f1f', '#5f6368', '#9aa0a6', '#bdc1c6', '#eceff1'
NEW = ('sonnet55', 'fable', 'inkling', 'minimax')        # the models this update adds

def text(x, y, s, size, fill=INK, weight=400, anchor='start'):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}"'
            + (f' text-anchor="{anchor}"' if anchor != 'start' else '') + f'>{html.escape(s, quote=False)}</text>')

def svg(narrow, W, H, label, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" class="{"narrow" if narrow else "wide"}" viewBox="0 0 {W} {H:.0f}" '
            f'font-family="{html.escape(FONT)}" role="img" aria-label="{html.escape(label)}">{body}</svg>')

def lab_colour():
    """--m-<id> of every model, from _sass/_fcs.scss (the overview's colours)."""
    tree = os.path.join(os.path.dirname(os.path.abspath(DATA)), '..', '..')   # the tree the data comes from carries its models' colours
    scss = open(os.path.join(tree, '_sass', '_fcs.scss')).read()
    return dict(re.findall(r'--m-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})', scss.split('.taskpage')[0]))

def fci(narrow):
    src = open(DATA).read()
    eci = json.JSONDecoder().raw_decode(src, re.search(r'^const ECI = ', src, re.M).end())[0]
    models = {i: (n, h) for i, n, h in re.findall(r"\{id:'([a-z0-9-]+)', name:'([^']+)', short:'[^']*', h:'([^']+)'", src)}
    assert set(NEW) <= set(eci) <= set(models), (sorted(set(NEW) - set(eci)), sorted(set(eci) - set(models)))
    twice = {n for n, _ in models.values() if sum(m[0] == n for m in models.values()) > 1}
    name = lambda i: models[i][0] + (f' ({models[i][1]})' if models[i][0] in twice else '')   # one model on two harnesses
    col = lab_colour()
    rows = sorted(eci, key=lambda i: (-eci[i][0], name(i)))
    W, L, R, RH, BH, FS = (360, 150, 14, 24, 12, 11.5) if narrow else (760, 236, 20, 27, 15, 13)
    lo = min(0, min(eci[i][1] for i in rows)); hi = max(eci[i][2] for i in rows)
    xmin, xmax = (lo // 10) * 10, (hi // 10 + 1) * 10
    T, B = 6, 30
    H = T + RH * len(rows) + B
    X = lambda v: L + (v - xmin) / (xmax - xmin) * (W - L - R)
    g = ''
    for v in range(int(xmin), int(xmax) + 1, 10):
        g += f'<line x1="{X(v):.1f}" x2="{X(v):.1f}" y1="{T}" y2="{T + RH * len(rows)}" stroke="{GRID}" stroke-width="1"/>'
        g += text(X(v), H - B + 18, f'{v}', FS, MUTED, 400, 'middle')
    for k, i in enumerate(rows):
        y, (v, a, b, _) = T + RH * k + RH / 2, eci[i]
        on = i in NEW
        c = col.get(i, BAR) if on else BAR
        g += text(0, y + FS * .36, name(i), FS, INK, 600 if on else 400)
        g += f'<rect x="{min(X(0), X(v)):.1f}" y="{y - BH / 2:.1f}" width="{abs(X(v) - X(0)):.1f}" height="{BH}" rx="2" fill="{c}"/>'
        wy = y + BH / 2 + 3                                     # the 90% interval: a thin line just under the bar
        wc = INK if on else FAINT
        g += (f'<line x1="{X(a):.1f}" x2="{X(b):.1f}" y1="{wy:.1f}" y2="{wy:.1f}" stroke="{wc}" stroke-width="1"/>'
              f'<line x1="{X(a):.1f}" x2="{X(a):.1f}" y1="{wy - 2.5:.1f}" y2="{wy + 2.5:.1f}" stroke="{wc}" stroke-width="1"/>'
              f'<line x1="{X(b):.1f}" x2="{X(b):.1f}" y1="{wy - 2.5:.1f}" y2="{wy + 2.5:.1f}" stroke="{wc}" stroke-width="1"/>')
        lab, tw = f'{v:.1f}', FS * .62 * len(f'{v:.1f}')          # approximate text width
        if X(v) - X(0) >= tw + 10:                              # inside the bar, at its end
            g += text(X(v) - 5, y + FS * .36, lab, FS, '#fff' if on else INK, 600 if on else 500, 'end')
        else:                                                   # too short: right after the bar
            g += text(max(X(v), X(0)) + 5, y + FS * .36, lab, FS, INK if on else MUTED, 600 if on else 400)
    g += f'<line x1="{X(0):.1f}" x2="{X(0):.1f}" y1="{T}" y2="{T + RH * len(rows)}" stroke="{FAINT}" stroke-width="1"/>'
    label = 'FCI with 90% interval, by model: ' + ', '.join(f'{name(i)} {eci[i][0]:.1f}' for i in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- Glenside: how much of each run's code is the human reference, line for line ----------
GLENSIDE = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blog_update_glenside.json')))['runs']
RELEASE_ID = {'fable51': 'fable', 'carbon-g': 'carbon'}          # release model id -> site id

def site_models():
    src = open(DATA).read()
    models = {i: (n, h) for i, n, h in re.findall(r"\{id:'([a-z0-9-]+)', name:'([^']+)', short:'[^']*', h:'([^']+)'", src)}
    twice = {n for n, _ in models.values() if sum(m[0] == n for m in models.values()) > 1}
    return {i: models[i][0] + (f' ({models[i][1]})' if models[i][0] in twice else '') for i in models}

def glenside(narrow):
    """Share of identical long lines, one bar per model shown on the site (hidden models left out), GLM 5.3 Flash in its colour."""
    names, col = site_models(), lab_colour()
    rows = [(RELEASE_ID.get(m, m), r) for m, r in GLENSIDE.items() if RELEASE_ID.get(m, m) in names]
    rows.sort(key=lambda x: (-x[1]['identical_pct'], names[x[0]]))
    W, L, R, RH, BH, FS = (360, 150, 40, 22, 12, 11.5) if narrow else (760, 236, 54, 24, 14, 13)
    T, B = 6, 30
    H = T + RH * len(rows) + B
    X = lambda v: L + v / 100 * (W - L - R)
    g = ''
    for v in range(0, 101, 25):
        g += f'<line x1="{X(v):.1f}" x2="{X(v):.1f}" y1="{T}" y2="{T + RH * len(rows)}" stroke="{GRID}" stroke-width="1"/>'
        g += text(X(v), H - B + 18, f'{v}%', FS, MUTED, 400, 'middle')
    for k, (i, r) in enumerate(rows):
        y, v, on = T + RH * k + RH / 2, r['identical_pct'], i == 'glmf'
        g += text(0, y + FS * .36, names[i], FS, INK, 600 if on else 400)
        g += f'<rect x="{X(0):.1f}" y="{y - BH / 2:.1f}" width="{max(X(v) - X(0), 1.5):.1f}" height="{BH}" rx="2" fill="{col["glmf"] if on else BAR}"/>'
        g += text(X(v) + 5, y + FS * .36, f'{v:.0f}%' if v >= 1 else '<1%', FS, INK if on else MUTED, 600 if on else 400)
    label = 'Glenside, share of each run\'s added long lines identical to the human reference: ' + ', '.join(f'{names[i]} {r["identical_pct"]:.0f}%' for i, r in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- RAGEN: where the patch takes the model out of its own training loop ----------
def ragen(narrow):
    """Four boxes left to right (top to bottom on phones): the model's answer, the patched parser, the game, the training batch;
    the search the patch adds feeds the parser, and the model's moves stop there."""
    ACC, SOFT, RED = '#0b57d0', '#d3e3fd', '#b3261e'
    steps = [('The model answers', 'its moves for this turn'), ('The patched file', 'parses the answer'),
             ('Sokoban', 'plays the moves'), ('PPO', 'trains on the history')]
    if narrow:
        W, BW, BHh, GAP, x0 = 360, 200, 54, 26, 10
        H = 4 * BHh + 3 * GAP + 20
        g = ''
        for k, (a, b) in enumerate(steps):
            y = 10 + k * (BHh + GAP); hot = k == 1
            g += f'<rect x="{x0}" y="{y}" width="{BW}" height="{BHh}" rx="6" fill="{SOFT if hot else "#fff"}" stroke="{ACC if hot else BAR}" stroke-width="{2 if hot else 1.2}"/>'
            g += text(x0 + 12, y + 22, a, 12.5, INK, 600) + text(x0 + 12, y + 40, b, 11.5, MUTED)
            if k < 3:
                g += f'<line x1="{x0 + BW / 2}" x2="{x0 + BW / 2}" y1="{y + BHh}" y2="{y + BHh + GAP - 4}" stroke="{INK}" stroke-width="1.4"/>'
        y1 = 10 + (BHh + GAP)
        g += f'<rect x="{x0 + BW + 22}" y="{y1}" width="{W - x0 - BW - 32}" height="{BHh}" rx="6" fill="#fff" stroke="{RED}" stroke-width="1.6"/>'
        g += text(x0 + BW + 32, y1 + 22, 'A search', 12.5, RED, 600) + text(x0 + BW + 32, y1 + 40, 'solves the board', 11.5, MUTED)
        g += f'<line x1="{x0 + BW + 22}" x2="{x0 + BW + 4}" y1="{y1 + BHh / 2}" y2="{y1 + BHh / 2}" stroke="{RED}" stroke-width="1.6"/>'
        g += text(x0 + BW / 2 + 8, y1 - 8, 'moves dropped', 11.5, RED, 600)
        return svg(True, W, H, 'RAGEN: the patched file replaces the model\'s moves with a search\'s, so PPO trains on moves the model never chose.', g)
    W, H, BW, BHh = 760, 210, 150, 64
    xs = [10, 207, 404, 601]; y = 26
    g = ''
    for k, ((a, b), x) in enumerate(zip(steps, xs)):
        hot = k == 1
        g += f'<rect x="{x}" y="{y}" width="{BW}" height="{BHh}" rx="6" fill="{SOFT if hot else "#fff"}" stroke="{ACC if hot else BAR}" stroke-width="{2 if hot else 1.2}"/>'
        g += text(x + 12, y + 26, a, 13, INK, 600) + text(x + 12, y + 46, b, 12, MUTED)
        if k < 3:
            g += (f'<line x1="{x + BW}" x2="{xs[k + 1] - 6}" y1="{y + BHh / 2}" y2="{y + BHh / 2}" stroke="{INK}" stroke-width="1.4"/>'
                  f'<path d="M{xs[k + 1] - 6} {y + BHh / 2 - 4} L{xs[k + 1]} {y + BHh / 2} L{xs[k + 1] - 6} {y + BHh / 2 + 4} Z" fill="{INK}"/>')
    sx = xs[1]; sy = 140
    g += f'<rect x="{sx}" y="{sy}" width="{BW}" height="{BHh - 8}" rx="6" fill="#fff" stroke="{RED}" stroke-width="1.6"/>'
    g += text(sx + 12, sy + 24, 'A search the patch adds', 12.5, RED, 600) + text(sx + 12, sy + 42, 'solves each board', 12, MUTED)
    g += (f'<line x1="{sx + BW / 2}" x2="{sx + BW / 2}" y1="{sy}" y2="{y + BHh + 6}" stroke="{RED}" stroke-width="1.6"/>'
          f'<path d="M{sx + BW / 2 - 4} {y + BHh + 6} L{sx + BW / 2} {y + BHh} L{sx + BW / 2 + 4} {y + BHh + 6} Z" fill="{RED}"/>')
    g += f'<line x1="{xs[0] + BW + 14}" x2="{xs[1] - 18}" y1="{y + BHh / 2 - 9}" y2="{y + BHh / 2 + 9}" stroke="{RED}" stroke-width="2"/>'
    g += text(xs[0] + BW + 8, y + BHh + 22, 'moves dropped', 12, RED, 600)
    g += text(xs[2], sy + 24, 'The game is solved and PPO runs,', 12.5, INK, 500) + text(xs[2], sy + 42, 'but on moves the model never chose.', 12.5, INK, 500)
    return svg(False, W, H, 'RAGEN: the patched file replaces the model\'s moves with a search\'s, so PPO trains on moves the model never chose.', g)

# ---------- SCOPE: the cache spreads through ten agents ----------
def spread(narrow):
    """Agents caching, out of ten, over the minutes of the run: 0, then 1 from minute 47, then 9 by minute 98. Only these
    points are known (Preview #637); the rise between minute 78 and 98 is drawn as a band, not a line."""
    ACC = '#0b57d0'
    W, L, R, T, B, FS = (360, 34, 14, 18, 40, 11.5) if narrow else (760, 40, 20, 22, 44, 13)
    H = 230 if narrow else 250
    X = lambda m: L + m / 110 * (W - L - R)
    Y = lambda n: T + (10 - n) / 10 * (H - T - B)
    g = ''
    for n in (0, 5, 10):
        g += f'<line x1="{L}" x2="{W - R}" y1="{Y(n):.1f}" y2="{Y(n):.1f}" stroke="{GRID}" stroke-width="1"/>' + text(L - 8, Y(n) + 4, f'{n}', FS, MUTED, 400, 'end')
    for m in (0, 30, 60, 90):
        g += text(X(m), H - B + 18, f'{m} min', FS, MUTED, 400, 'middle')
    g += f'<path d="M{X(0):.1f} {Y(0):.1f} L{X(47):.1f} {Y(0):.1f} L{X(47):.1f} {Y(1):.1f} L{X(78):.1f} {Y(1):.1f}" fill="none" stroke="{ACC}" stroke-width="2"/>'
    g += f'<path d="M{X(78):.1f} {Y(1):.1f} L{X(98):.1f} {Y(9):.1f} L{X(98):.1f} {Y(1):.1f} Z" fill="{ACC}" opacity=".14"/>'
    g += f'<line x1="{X(98):.1f}" x2="{X(110):.1f}" y1="{Y(9):.1f}" y2="{Y(9):.1f}" stroke="{ACC}" stroke-width="2"/>'
    for m, n in ((47, 1), (78, 1), (98, 9)):
        g += f'<circle cx="{X(m):.1f}" cy="{Y(n):.1f}" r="4.5" fill="{ACC}" stroke="#fff" stroke-width="2"/>'
    if narrow:
        g += text(X(47) - 4, Y(1) - 10, 'one agent caches', FS, INK, 500, 'end') + text(X(78) - 4, Y(2.2), 'it tells the others', FS, INK, 500, 'end')
        g += text(X(98) - 6, Y(9) - 10, 'nine of ten', FS, INK, 600, 'end')
    else:
        g += text(X(47) - 6, Y(1) - 12, 'minute 47: one agent caches', FS, INK, 500, 'end')
        g += text(X(78) + 10, Y(1) - 12, 'minute 78: it tells the others', FS, INK, 500)
        g += text(X(98) - 8, Y(9) - 12, 'minute 98: nine of ten cache', FS, INK, 600, 'end')
    g += text(L, H - 6, 'Agents caching, out of ten', FS, MUTED, 500)
    return svg(narrow, W, H, 'SCOPE, ten agents side by side: one caches its answers at minute 47 and tells the others at minute 78; by minute 98 nine of ten cache.', g)


# ---------- Pass rate: tasks where the model beats the human reference ----------
def passrate(narrow):
    """Share of the 48 tasks each model passes (PASS in fcs2-data.js), the four new models in their lab colours."""
    src = open(DATA).read()
    pas = json.JSONDecoder().raw_decode(src, re.search(r'^const PASS = ', src, re.M).end())[0]
    eci = json.JSONDecoder().raw_decode(src, re.search(r'^const ECI = ', src, re.M).end())[0]
    names, col = site_models(), lab_colour()
    rows = sorted([i for i in eci if i in pas], key=lambda i: (-pas[i][0], -eci[i][0], names[i]))
    W, L, R, RH, BH, FS = (360, 150, 44, 24, 12, 11.5) if narrow else (760, 236, 64, 27, 15, 13)
    T, B = 6, 30
    H = T + RH * len(rows) + B
    X = lambda v: L + v / 60 * (W - L - R)
    g = ''
    for v in range(0, 61, 20):
        g += f'<line x1="{X(v):.1f}" x2="{X(v):.1f}" y1="{T}" y2="{T + RH * len(rows)}" stroke="{GRID}" stroke-width="1"/>'
        g += text(X(v), H - B + 18, f'{v}%', FS, MUTED, 400, 'middle')
    for k, i in enumerate(rows):
        y, (v, n, tot), on = T + RH * k + RH / 2, pas[i], i in NEW
        g += text(0, y + FS * .36, names[i], FS, INK, 600 if on else 400)
        g += f'<rect x="{X(0):.1f}" y="{y - BH / 2:.1f}" width="{max(X(v) - X(0), 1.5):.1f}" height="{BH}" rx="2" fill="{col.get(i, BAR) if on else BAR}"/>'
        g += text(X(v) + 5, y + FS * .36, f'{n} of {tot}', FS, INK if on else MUTED, 600 if on else 400)
    label = 'Tasks passed out of 48, by model: ' + ', '.join(f'{names[i]} {pas[i][1]}' for i in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- One format: the shared code that every task used to carry its own copy of ----------
# Counted in FrontierCS/FrontierCS-2 at 1e6dfa12 (before the task-format move) and 3d02f24d (after): every copy of
# these files under the task folders, its distinct versions (git blobs) and its lines; after the move, the shared copy
# plus any task that still keeps its own.
REBASE = [  # file, copies before, versions before, lines before, copies after, lines after
    ('fcs2_verifier.py', 44, 30, 26908, 1, 836),
    ('submission_patch.py', 59, 14, 18991, 1, 193),
    ('beat_spec_feedback.py', 49, 8, 16206, 1, 162),
    ('fcs2_verifier_gpu.py', 15, 10, 12121, 1, 2018),
    ('fcs2_submission.py', 18, 1, 1890, 1, 103),
    ('make_submission.sh', 89, 47, 1618, 13, 198),
    ('verify.py', 48, 45, 1618, 2, 364),
    ('prepare_workspace.sh', 49, 10, 1113, 1, 26),
]

def rebase(narrow):
    ACC = '#0b57d0'
    W, L, R, RH, FS = (360, 128, 10, 40, 11) if narrow else (760, 190, 20, 34, 13)
    T, B = 26, 30
    H = T + RH * len(REBASE) + B
    top = 34000 if narrow else 30000
    X = lambda v: L + v / top * (W - L - R)
    g = ''
    for v in range(0, top + 1, 10000):
        g += f'<line x1="{X(v):.1f}" x2="{X(v):.1f}" y1="{T - 8}" y2="{T + RH * len(REBASE)}" stroke="{GRID}" stroke-width="1"/>'
        g += text(X(v), H - B + 18, f'{v // 1000}k' if v else '0', FS, MUTED, 400, 'middle')
    g += f'<rect x="{L}" y="4" width="10" height="10" rx="2" fill="{BAR}"/>' + text(L + 15, 13, 'before', FS - 1, MUTED, 500)
    g += f'<rect x="{L + (70 if narrow else 80)}" y="4" width="10" height="10" rx="2" fill="{ACC}"/>' + text(L + (85 if narrow else 95), 13, 'after', FS - 1, MUTED, 500)
    for k, (f, c0, v0, l0, c1, l1) in enumerate(REBASE):
        y = T + RH * k + 4
        g += text(0, y + 9, f, FS, INK, 600)
        g += text(0, y + 9 + FS + 3, f'{c0} copies, {v0} versions', FS - 1.5, MUTED, 400)
        bh = 10 if narrow else 11
        g += f'<rect x="{X(0):.1f}" y="{y:.1f}" width="{max(X(l0) - X(0), 1.5):.1f}" height="{bh}" rx="2" fill="{BAR}"/>'
        g += f'<rect x="{X(0):.1f}" y="{y + bh + 2:.1f}" width="{max(X(l1) - X(0), 1.5):.1f}" height="{bh}" rx="2" fill="{ACC}"/>'
        g += text(X(l0) + 5, y + bh - 1.5, f'{l0:,}', FS - 1.5, MUTED, 400)
        g += text(X(l1) + 5, y + 2 * bh + .5, f'{l1:,}', FS - 1.5, INK, 600)
    label = ('Lines of shared code carried by the tasks, before and after the move: ' +
             ', '.join(f'{f} {c0} copies in {v0} versions, {l0} lines, now {l1}' for f, c0, v0, l0, c1, l1 in REBASE) + '.')
    return svg(narrow, W, H, label, g)

# ---------- Isolation: the judge runs the candidate's code in a sandbox of its own ----------
def isolate(narrow):
    ACC, RED = '#0b57d0', '#c5221f'
    box = lambda x, y, w, h, fill, stroke, dash='': f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{stroke}" stroke-width="1.5"{dash}/>'
    rules = ["reads only its own tree and inputs", "writes only its result folder", "no network, no extra processes",
             "a fresh instance for every run: nothing", "survives from one timing round to the next"]
    lab = "The judge runs the candidate's code inside a sandbox of its own, which cannot read the judge's files or keep anything between runs."
    cross = lambda x, y: f'<path d="M{x - 11} {y - 11} L{x + 11} {y + 11} M{x + 11} {y - 11} L{x - 11} {y + 11}" stroke="{RED}" stroke-width="3"/>'
    if narrow:
        W, H, FS = 360, 430, 11.5
        g = box(1, 1, 358, 428, '#f8f9fa', '#dadce0')
        g += text(14, 24, 'The judge (trusted)', FS + 1, INK, 700)
        g += box(14, 38, 332, 54, '#ffffff', '#dadce0')
        g += text(28, 60, 'judge files: hidden workloads,', FS, INK, 500) + text(28, 78, 'the human reference, the scoring code', FS, INK, 500)
        g += f'<line x1="180" x2="180" y1="176" y2="100" stroke="{RED}" stroke-width="2"/><path d="M173 110 L180 98 L187 110" fill="none" stroke="{RED}" stroke-width="2"/>'
        g += cross(180, 138) + text(200, 143, 'blocked', FS, RED, 600)
        g += box(14, 182, 332, 170, '#e8f0fe', ACC, ' stroke-dasharray="5 4"')
        g += text(28, 206, "isolate: the candidate's code", FS + 1, ACC, 700)
        for k, r in enumerate(rules):
            g += text(28, 232 + 22 * k, r, FS, INK, 500)
        g += text(14, 380, 'Attack submissions that read the judge, hide', FS, INK, 500) + text(14, 398, 'from its checks or keep state between rounds', FS, INK, 500) + text(14, 416, 'all score 0.', FS, INK, 500)
        return svg(True, W, H, lab, g)
    W, H, FS = 760, 262, 13
    g = box(1, 1, 758, 260, '#f8f9fa', '#dadce0')
    g += text(20, 30, 'The judge (trusted)', FS + 2, INK, 700)
    g += box(20, 66, 250, 96, '#ffffff', '#dadce0')
    g += text(36, 96, 'judge files', FS, INK, 700) + text(36, 120, 'hidden workloads, the human', FS, MUTED, 400) + text(36, 140, 'reference, the scoring code', FS, MUTED, 400)
    g += box(400, 20, 340, 176, '#e8f0fe', ACC, ' stroke-dasharray="5 4"')
    g += text(418, 48, "isolate: the candidate's code", FS + 2, ACC, 700)
    for k, r in enumerate(rules):
        g += text(418, 80 + 24 * k, r, FS, INK, 500)
    g += f'<line x1="394" x2="280" y1="114" y2="114" stroke="{RED}" stroke-width="2"/><path d="M292 107 L278 114 L292 121" fill="none" stroke="{RED}" stroke-width="2"/>'
    g += cross(337, 114) + text(337, 148, 'blocked', FS, RED, 600, 'middle')
    g += f'<line x1="20" x2="740" y1="216" y2="216" stroke="#dadce0" stroke-width="1"/>'
    g += text(20, 242, 'Attack submissions that read the judge, hide from its checks or keep state between rounds all score 0.', FS, INK, 500)
    return svg(False, W, H, lab, g)

CHARTS = {'update-pass': ('pass', passrate), 'update-fci': ('fci', fci), 'update-rebase': ('rebase', rebase), 'update-isolate': ('isolate', isolate), 'update-glenside': ('glenside', glenside), 'update-ragen': ('ragen', ragen), 'update-spread': ('spread', spread)}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    src = open(POST).read()
    for marker, (stem, draw) in CHARTS.items():
        wide, narrow = draw(False), draw(True)
        open(os.path.join(OUT, f'{stem}.svg'), 'w').write(wide + '\n')
        open(os.path.join(OUT, f'{stem}-narrow.svg'), 'w').write(narrow + '\n')
        src, n = re.subn(rf'(<!-- {marker} -->).*?(<!-- /{marker} -->)', lambda m: m.group(1) + wide + narrow + m.group(2), src, flags=re.S)
        assert n == 1, marker
    open(POST, 'w').write(src)
