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
    scss = open(os.path.join(SITE, '_sass', '_fcs.scss')).read()
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
    W, L, R, RH, BH, FS = (360, 150, 30, 22, 12, 11.5) if narrow else (760, 236, 40, 25, 14, 13)
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
        g += (f'<line x1="{X(a):.1f}" x2="{X(b):.1f}" y1="{y:.1f}" y2="{y:.1f}" stroke="{INK if on else FAINT}" stroke-width="1"/>'
              f'<line x1="{X(a):.1f}" x2="{X(a):.1f}" y1="{y - 4:.1f}" y2="{y + 4:.1f}" stroke="{INK if on else FAINT}" stroke-width="1"/>'
              f'<line x1="{X(b):.1f}" x2="{X(b):.1f}" y1="{y - 4:.1f}" y2="{y + 4:.1f}" stroke="{INK if on else FAINT}" stroke-width="1"/>')
        g += text(X(b) + 5, y + FS * .36, f'{v:.1f}', FS, INK if on else MUTED, 600 if on else 400)
    g += f'<line x1="{X(0):.1f}" x2="{X(0):.1f}" y1="{T}" y2="{T + RH * len(rows)}" stroke="{FAINT}" stroke-width="1"/>'
    label = 'FCI with 90% interval, by model: ' + ', '.join(f'{name(i)} {eci[i][0]:.1f}' for i in rows) + '.'
    return svg(narrow, W, H, label, g)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    wide, narrow = fci(False), fci(True)
    open(os.path.join(OUT, 'fci.svg'), 'w').write(wide + '\n')
    open(os.path.join(OUT, 'fci-narrow.svg'), 'w').write(narrow + '\n')
    src = open(POST).read()
    src, n = re.subn(r'(<!-- update-fci -->).*?(<!-- /update-fci -->)', lambda m: m.group(1) + wide + narrow + m.group(2), src, flags=re.S)
    assert n == 1
    open(POST, 'w').write(src)
