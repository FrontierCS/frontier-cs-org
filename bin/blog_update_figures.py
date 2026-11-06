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

CHARTS = {'update-fci': ('fci', fci), 'update-glenside': ('glenside', glenside), 'update-ragen': ('ragen', ragen), 'update-spread': ('spread', spread)}

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
