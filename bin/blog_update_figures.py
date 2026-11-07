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
    lo = min(0, min(eci[i][0] for i in rows)); hi = max(eci[i][0] for i in rows)
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
        lab, tw = f'{v:.1f}', FS * .62 * len(f'{v:.1f}')          # approximate text width
        if X(v) - X(0) >= tw + 10:                              # inside the bar, at its end
            g += text(X(v) - 5, y + FS * .36, lab, FS, '#fff' if on else INK, 600 if on else 500, 'end')
        else:                                                   # too short: right after the bar
            g += text(max(X(v), X(0)) + 5, y + FS * .36, lab, FS, INK if on else MUTED, 600 if on else 400)
    g += f'<line x1="{X(0):.1f}" x2="{X(0):.1f}" y1="{T}" y2="{T + RH * len(rows)}" stroke="{FAINT}" stroke-width="1"/>'
    label = 'FCI by model: ' + ', '.join(f'{name(i)} {eci[i][0]:.1f}' for i in rows) + '.'
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
        failed = r['verdict'] != 'PASS'
        g += text(0, y + FS * .36, names[i], FS, INK if not failed or on else MUTED, 600 if on else 400)
        fill = col["glmf"] if on else ('#e3e5e8' if failed else BAR)
        g += f'<rect x="{X(0):.1f}" y="{y - BH / 2:.1f}" width="{max(X(v) - X(0), 1.5):.1f}" height="{BH}" rx="2" fill="{fill}"/>'
        pct = f'{v:.0f}%' if v >= 1 else '<1%'
        if on:   # the copy: its share and its line count, inside the bar's end
            n = round(r['added_long_lines'] * v / 100)
            g += text(X(v) - 6, y + FS * .36, f'{pct}, {n:,} of {r["added_long_lines"]:,} lines' if not narrow else pct, FS, '#fff', 600, 'end')
        else:
            g += text(X(v) + 5, y + FS * .36, pct + (' · did not pass' if failed and not narrow else ''), FS, MUTED, 400)
    label = 'Glenside, share of each run\'s added long lines identical to the human reference: ' + ', '.join(f'{names[i]} {r["identical_pct"]:.0f}%' for i, r in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- RAGEN: where the patch takes the model out of its own training loop ----------
def ragen(narrow):
    """The data path of one RAGEN turn: the model answers, the patched parser drops its moves for a search's, Sokoban plays
    them and PPO trains on them; under it, the check the judge now makes, a replay of every episode from its seed."""
    ACC, SOFT, RED, GREEN = '#0b57d0', '#d3e3fd', '#b3261e', '#146c2e'
    MONO = "'Google Sans Code', ui-monospace, monospace"
    def chip(x, y, s, col, strike=False, size=12):
        w = 9 + len(s) * size * .62
        out = (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{size + 9}" rx="4" fill="#fff" stroke="{col}" stroke-width="1.2"/>'
               f'<text x="{x + 5:.1f}" y="{y + size + 2:.1f}" font-size="{size}" font-family="{html.escape(MONO)}" fill="{col}">{html.escape(s)}</text>')
        if strike:
            out += f'<line x1="{x + 3:.1f}" x2="{x + w - 3:.1f}" y1="{y + (size + 9) / 2:.1f}" y2="{y + (size + 9) / 2:.1f}" stroke="{RED}" stroke-width="1.6"/>'
        return out
    def board(x, y, c):   # a 4 x 4 Sokoban board: walls, a box, its goal and the player
        cells = ['####', '#@.#', '#$ #', '####']
        out = ''
        for r, row in enumerate(cells):
            for k, ch in enumerate(row):
                cx, cy = x + k * c, y + r * c
                if ch == '#': out += f'<rect x="{cx}" y="{cy}" width="{c - 1}" height="{c - 1}" rx="1.5" fill="#bdc1c6"/>'
                elif ch == '$': out += f'<rect x="{cx + 2}" y="{cy + 2}" width="{c - 5}" height="{c - 5}" rx="2" fill="#a8743a"/>'
                elif ch == '.': out += f'<circle cx="{cx + c / 2 - .5}" cy="{cy + c / 2 - .5}" r="{c / 5}" fill="{GREEN}"/>'
                elif ch == '@': out += f'<circle cx="{cx + c / 2 - .5}" cy="{cy + c / 2 - .5}" r="{c / 3}" fill="{INK}"/>'
        return out
    arrow = lambda x1, y1, x2, y2, col: (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="1.5"/>'
                                          + (f'<path d="M{x2 - 6} {y2 - 4} L{x2} {y2} L{x2 - 6} {y2 + 4} Z" fill="{col}"/>' if y1 == y2 else
                                             f'<path d="M{x2 - 4} {y2 + (6 if y2 < y1 else -6)} L{x2} {y2} L{x2 + 4} {y2 + (6 if y2 < y1 else -6)} Z" fill="{col}"/>'))
    box = lambda x, y, w, h, hot=False: f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{SOFT if hot else "#fff"}" stroke="{ACC if hot else BAR}" stroke-width="{1.8 if hot else 1.2}"/>'
    label = "RAGEN: the patched parser drops the model's moves and passes on a search's; Sokoban plays them and PPO trains on them. The judge now replays every episode from its seed and checks each move against the model's answer."
    if narrow:
        W, H = 360, 506
        g = box(10, 10, 340, 62) + text(22, 32, 'The model', 13, INK, 600) + chip(22, 40, '↑ ← ←', INK)
        g += arrow(180, 72, 180, 84, INK)
        g += box(10, 84, 340, 92, True) + text(22, 106, 'The patched parser', 13, INK, 600)
        g += chip(22, 116, '↑ ← ←', MUTED, True) + chip(96, 116, '→ ↓ ↓ → ↑', RED)
        g += text(22, 160, 'from a search the patch adds', 12, RED, 600)
        g += arrow(180, 176, 180, 198, RED)
        g += box(10, 198, 160, 84) + text(22, 220, 'Sokoban', 13, INK, 600) + board(22, 230, 11)
        g += box(190, 198, 160, 84) + text(202, 220, 'PPO trains on', 13, INK, 600) + chip(202, 232, '→ ↓ ↓ → ↑', RED)
        g += f'<rect x="10" y="300" width="340" height="196" rx="8" fill="#e6f4ea" stroke="{GREEN}" stroke-width="1.2"/>'
        g += text(22, 324, 'Now the judge replays every episode', 12.5, GREEN, 700)
        g += box(22, 336, 150, 66) + text(32, 356, 'seed, fresh board', 12, INK, 600) + chip(32, 368, 'seed 7', INK, size=11) + board(120, 366, 8)
        g += arrow(172, 369, 188, 369, GREEN)
        g += box(188, 336, 150, 66) + text(198, 356, 'played', 11.5, INK, 600) + chip(262, 343, '→↓↓→↑', RED, size=11)
        g += text(198, 386, 'answered', 11.5, INK, 600) + chip(262, 373, '↑←←', INK, size=11)
        g += f'<rect x="22" y="414" width="316" height="68" rx="8" fill="#fff" stroke="{RED}" stroke-width="1.6"/>' + text(34, 440, 'they differ, so it scores 0', 13, RED, 700) + text(34, 462, 'the judge recomputes the reward itself', 12, INK, 500)
        return svg(True, W, H, label, g)
    W, H = 760, 318
    g = box(10, 20, 124, 92) + text(22, 44, 'The model', 13.5, INK, 600) + chip(22, 60, '↑ ← ←', INK)
    g += arrow(134, 66, 166, 66, INK)
    g += box(166, 20, 238, 92, True) + text(178, 44, 'The patched parser', 13.5, INK, 600)
    g += chip(178, 60, '↑ ← ←', MUTED, True) + chip(248, 60, '→ ↓ ↓ → ↑', RED)
    g += box(166, 132, 238, 40) + text(178, 157, 'A search the patch adds', 13, RED, 600)
    g += arrow(285, 132, 285, 112, RED)
    g += arrow(404, 66, 432, 66, RED)
    g += box(432, 20, 130, 92) + text(444, 44, 'Sokoban', 13.5, INK, 600) + board(444, 54, 12)
    g += arrow(562, 66, 598, 66, RED)
    g += box(598, 20, 152, 92) + text(610, 44, 'PPO trains on', 13.5, INK, 600) + chip(610, 60, '→ ↓ ↓ → ↑', RED)
    GB = '#e6f4ea'
    g += f'<rect x="10" y="196" width="740" height="112" rx="8" fill="{GB}" stroke="{GREEN}" stroke-width="1.2"/>'
    g += text(24, 220, 'Now the judge replays every episode', 13.5, GREEN, 700)
    g += box(24, 234, 112, 60) + text(36, 256, 'episode seed', 12.5, INK, 600) + chip(36, 264, 'seed 7', INK, size=11)
    g += arrow(136, 264, 164, 264, GREEN)
    g += box(164, 234, 112, 60) + text(176, 256, 'fresh board', 12.5, INK, 600) + board(176, 262, 7)
    g += arrow(276, 264, 304, 264, GREEN)
    g += box(304, 234, 206, 60) + text(316, 254, 'moves played', 12, INK, 600) + chip(412, 240, '→ ↓ ↓ → ↑', RED, size=11)
    g += text(316, 282, 'model answered', 12, INK, 600) + chip(412, 268, '↑ ← ←', INK, size=11)
    g += arrow(510, 264, 538, 264, GREEN)
    g += f'<rect x="538" y="234" width="198" height="60" rx="8" fill="#fff" stroke="{RED}" stroke-width="1.6"/>' + text(550, 258, 'they differ, so it scores 0', 13, RED, 700) + text(550, 280, 'reward recomputed by the judge', 12, INK, 500)
    return svg(False, W, H, label, g)

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
    """The judge diagram of the FrontierCS 2 README (docs/assets/judge.png) with the new inside layer: in the Judge, the
    agent's code runs in a sandbox of its own (isolate)."""
    BF, BT, PF, PT, GF = '#d3e3fd', '#0b57d0', '#f9dedc', '#b3261e', '#f1f3f4'
    def node(x, y, w, h, fill, label, col, size=13.5, weight=600, r=10):
        return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"/>'
                + text(x + w / 2, y + h / 2 + size * .36, label, size, col, weight, 'middle'))
    def arr(x1, y1, x2, y2):
        if y1 == y2:
            d = 1 if x2 > x1 else -1
            head = f'<path d="M{x2 - 7 * d} {y2 - 4} L{x2} {y2} L{x2 - 7 * d} {y2 + 4} Z" fill="{MUTED}"/>'
        else:
            d = 1 if y2 > y1 else -1
            head = f'<path d="M{x2 - 4} {y2 - 7 * d} L{x2} {y2} L{x2 + 4} {y2 - 7 * d} Z" fill="{MUTED}"/>'
        return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{MUTED}" stroke-width="1.4"/>' + head
    def inner(x, y, w, h, fs, lines):
        out = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{BF}" stroke="{BT}" stroke-width="1.4" stroke-dasharray="5 4"/>'
               + text(x + 12, y + fs + 9, "The agent's code, in isolate", fs, BT, 700))
        for k, t in enumerate(lines):
            out += text(x + 12, y + fs + 9 + (fs + 7) * (k + 1), t, fs - 1, INK, 400)
        return out
    rules = ['its own files and inputs only', 'no network', 'a fresh copy for every run']
    label = ("The FrontierCS 2 judge: the Agent sends patches to the Driver; the Driver forwards them to the Judge, which holds the "
             "held-out suite and the reference. Inside the Judge, the agent's code now runs in a sandbox of its own, isolate.")
    if narrow:
        W, H = 360, 410
        g = node(10, 10, 100, 40, BF, 'Agent', BT) + text(10, 68, 'No network but the Driver', 11, MUTED, 400)
        g += node(130, 10, 100, 40, GF, 'Driver', INK) + node(250, 10, 100, 40, GF, 'Model API', INK, 12.5)
        g += arr(110, 24, 128, 24) + arr(128, 38, 112, 38) + arr(230, 30, 248, 30)
        g += f'<rect x="10" y="90" width="340" height="310" rx="14" fill="{GF}"/>' + text(24, 114, 'Evaluator', 12.5, MUTED, 600)
        g += arr(180, 50, 180, 126)
        g += f'<rect x="24" y="128" width="312" height="174" rx="10" fill="{PF}"/>' + text(38, 152, 'Judge', 14, PT, 700)
        g += text(38, 172, 'Held-out suite, reference score', 11.5, PT, 400)
        g += inner(38, 186, 284, 102, 12.5, rules)
        g += node(24, 318, 148, 40, PF, 'Judge GPU', PT, 12.5) + node(188, 318, 148, 40, PF, 'Test sandboxes', PT, 12.5)
        g += text(98, 378, 'GPU tasks only', 11.5, MUTED, 400, 'middle') + text(262, 378, 'Some tasks only', 11.5, MUTED, 400, 'middle')
        return svg(True, W, H, label, g)
    W, H = 760, 330
    g = node(296, 8, 112, 38, GF, 'Model API', INK, 13)
    g += node(10, 112, 116, 42, BF, 'Agent', BT) + text(68, 176, 'No network but the Driver', 12, MUTED, 400, 'middle')
    g += node(296, 112, 112, 42, GF, 'Driver', INK)
    g += arr(126, 124, 294, 124) + arr(294, 142, 128, 142)
    g += text(210, 116, 'Patch to the allowed files', 12, INK, 500, 'middle') + text(210, 160, 'Development score, sanitized', 12, INK, 500, 'middle')
    g += arr(352, 112, 352, 48)
    g += node(296, 210, 112, 40, BF, 'Agent GPU', BT, 13) + text(352, 270, 'GPU tasks only', 12, MUTED, 400, 'middle')
    g += arr(352, 154, 352, 208)
    g += f'<rect x="426" y="20" width="324" height="300" rx="16" fill="{GF}"/>' + text(442, 44, 'Evaluator', 12.5, MUTED, 600)
    g += f'<rect x="442" y="56" width="292" height="166" rx="12" fill="{PF}"/>' + text(456, 80, 'Judge', 14.5, PT, 700)
    g += text(720, 80, 'Held-out suite, reference', 12, PT, 400, 'end')
    g += inner(456, 94, 264, 104, 12.5, rules)
    g += arr(408, 124, 440, 124) + arr(440, 142, 410, 142)
    g += node(442, 240, 136, 40, PF, 'Judge GPU', PT, 13) + node(598, 240, 136, 40, PF, 'Test sandboxes', PT, 13)
    g += text(510, 300, 'GPU tasks only', 12, MUTED, 400, 'middle') + text(666, 300, 'Some tasks only', 12, MUTED, 400, 'middle')
    return svg(False, W, H, label, g)

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
