#!/usr/bin/env python3
"""The two charts of the Gemini 4 Carbon post (_posts/2026-10-29-gemini-4-carbon.md), in the style of bin/blog_figures.py.
Each chart comes in two widths, 760 and 360 (phones), as SVG files in assets/img/blog/gemini-4-carbon/ and inline in
the post between <!-- name --> and <!-- /name -->, so the page font applies. Every style is an attribute: the files
render alone the same as in the post.
    python3 bin/blog_carbon_figures.py"""
import html, json, os, re, subprocess

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(SITE, 'assets', 'img', 'blog', 'gemini-4-carbon')
POST = os.path.join(SITE, '_posts', '2026-10-29-gemini-4-carbon.md')
FONT = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif"
INK, MUTED, FAINT, BAR, LINE, GRID = '#1f1f1f', '#5f6368', '#9aa0a6', '#bdc1c6', '#dadce0', '#eceff1'
CARBON = '#34a853'                                                               # --m-carbon in _sass/_fcs.scss
CARBON_TXT = '#' + ''.join(f'{round(int(CARBON[i:i + 2], 16) * .78):02x}' for i in (1, 3, 5))   # MTXT: 78% colour, 22% black

def text(x, y, s, size, fill=INK, weight=400, anchor='start'):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}"'
            + (f' text-anchor="{anchor}"' if anchor != 'start' else '') + f'>{html.escape(s, quote=False)}</text>')

def svg(narrow, W, H, label, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" class="{"narrow" if narrow else "wide"}" viewBox="0 0 {W} {H:.0f}" '
            f'font-family="{html.escape(FONT)}" role="img" aria-label="{html.escape(label)}">{body}</svg>')

# ---------- Figure 1: pass rate of every leaderboard model ----------
def site_data():
    """assets/js/fcs2-data.js. This branch was cut before Carbon joined the leaderboard; main has it."""
    src = open(os.path.join(SITE, 'assets', 'js', 'fcs2-data.js')).read()
    if "id:'carbon'" not in src:
        src = subprocess.run(['git', '-C', SITE, 'show', 'origin/main:assets/js/fcs2-data.js'], capture_output=True, text=True, check=True).stdout
    return src

def pass_rate(narrow):
    """Pass rate (PASS) of each model in MODELS, as horizontal bars, highest first; Carbon in its colour."""
    src = site_data()
    rate = json.JSONDecoder().raw_decode(src, re.search(r'^const PASS = ', src, re.M).end())[0]
    models = {i: (n, h) for i, n, h in re.findall(r"\{id:'([a-z0-9-]+)', name:'([^']+)', short:'[^']*', h:'([^']+)'", src)}
    assert set(rate) == set(models) and len(models) == 18, (sorted(rate), sorted(models))
    name = lambda i: models[i][0] + (f' ({models[i][1]})' if models[i][0] == 'Gemini 4 Argon' else '')   # two harnesses
    rows = sorted(rate, key=lambda i: (-rate[i][0], name(i)))
    W, L, R, RH, BH, FS = (360, 168, 34, 22, 13, 12) if narrow else (760, 230, 44, 26, 15, 13)
    T, xmax = 2, 60
    H = T + RH * len(rows) + 2
    X = lambda v: L + v / xmax * (W - L - R)
    g = ''
    for k, i in enumerate(rows):
        y, v, on = T + RH * k + RH / 2, rate[i][0], i == 'carbon'
        g += text(0, y + FS * .36, name(i), FS, INK, 600 if on else 500)
        g += f'<rect x="{X(0):.1f}" y="{y - BH / 2:.1f}" width="{X(v) - X(0):.1f}" height="{BH}" rx="2" fill="{CARBON if on else BAR}"/>'
        g += text(X(v) + 6, y + FS * .36, f'{v:.0f}%', FS, CARBON_TXT if on else MUTED, 600)
    g += f'<line x1="{X(0):.1f}" x2="{X(0):.1f}" y1="{T}" y2="{H - 2}" stroke="{FAINT}" stroke-width="1"/>'
    label = 'Pass rate on 48 tasks, by model: ' + ', '.join(f'{name(i)} {rate[i][0]:.0f}%' for i in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- Figure 2: every Carbon run over time ----------
# One run per task: (site short name, record verdict, hours from the record's started_at to its finished_at, hour of the
# final call or None, hours of the development submissions), in bin/blog_carbon_runs.json, from the public release and
# each run trace (FrontierCS2/FrontierCS-2-runs).
RUNS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blog_carbon_runs.json')))['runs']

def runs(narrow):
    """One row per run: a dot per development submission, a large mark at the final call (green if the run passes, grey if
    not), and for a run with no final call a hollow mark, in the same colours, where the session ended. Rows go by the
    hour of the final call, then the runs with no final call by the hour they ended."""
    rows = sorted(RUNS.values(), key=lambda r: (r[3] is None, r[3] if r[3] is not None else r[2], r[0]))
    W, L, R, RH, FS = (360, 146, 10, 16, 12) if narrow else (760, 260, 16, 17, 13)
    rd, rf, rh = (1.9, 4.2, 3.6) if narrow else (2.3, 5, 4.3)
    end = lambda r: r[3] if r[3] is not None else r[2]
    xmax = max(5, max(end(r) for r in rows) + .08)
    LG = 4 if narrow else 2                                      # legend lines
    T = 10 + 20 * LG + 20                                        # legend, then the top hour labels
    H = T + RH * len(rows) + 46
    X = lambda h: L + h / xmax * (W - L - R)
    g = ''
    # legend
    items = [('dot', 'Development submission'), ('pass', 'Final call, pass'), ('fail', 'Final call, fail'),
             ('open-pass', 'No final call, stored submission passed'), ('open-fail', 'No final call, fail')]
    mark = lambda kind, x, y, s=1: (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rd * s}" fill="{MUTED}"/>' if kind == 'dot' else
                                    f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rh * s}" fill="#fff" stroke="{CARBON if kind == "open-pass" else FAINT}" stroke-width="1.6"/>' if kind.startswith('open') else
                                    f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rf * s}" fill="{CARBON if kind == "pass" else FAINT}" stroke="#fff" stroke-width="1"/>')
    pos = [(0, 0), (178, 0), (0, 1), (0, 2), (0, 3)] if narrow else [(0, 0), (190, 0), (330, 0), (0, 1), (300, 1)]
    for (kind, lab), (x, line) in zip(items, pos):
        y = 14 + 20 * line
        g += mark(kind, x + 6, y - FS * .32) + text(x + 16, y, lab, FS, INK, 500)
    # hours
    for v in range(0, 6):
        g += f'<line x1="{X(v):.1f}" x2="{X(v):.1f}" y1="{T - 4}" y2="{T + RH * len(rows) + 4}" stroke="{GRID}" stroke-width="1"/>'
        g += text(X(v), T - 10, f'{v} h', FS, MUTED, 400, 'middle') + text(X(v), T + RH * len(rows) + 20, f'{v} h', FS, MUTED, 400, 'middle')
    g += text(L + (W - L - R) / 2, H - 6, 'Hours since the run started', FS, INK, 500, 'middle')
    for k, (name, verdict, ended, final, dev) in enumerate(rows):
        y, ok = T + RH * k + RH / 2, verdict == 'PASS'
        nm = name if not narrow or len(name) <= 22 else name[:21].rstrip() + '\u2026'   # phones: long names are cut, not run into the plot
        g += text(0, y + FS * .36, nm, FS, INK, 500)
        g += f'<line x1="{X(0):.1f}" x2="{X(end(rows[k])):.1f}" y1="{y:.1f}" y2="{y:.1f}" stroke="{LINE}" stroke-width="1"/>'
        g += ''.join(f'<circle cx="{X(h):.1f}" cy="{y:.1f}" r="{rd}" fill="{MUTED}"/>' for h in dev)
        g += (f'<circle cx="{X(final):.1f}" cy="{y:.1f}" r="{rf}" fill="{CARBON if ok else FAINT}" stroke="#fff" stroke-width="1"/>' if final is not None else
              f'<circle cx="{X(ended):.1f}" cy="{y:.1f}" r="{rh}" fill="#fff" stroke="{CARBON if ok else FAINT}" stroke-width="1.6"/>')
    fmt = lambda r: (f'{r[0]}: {len(r[4])} development submissions, ' + (f'final call at {r[3]:.1f} h' if r[3] is not None else f'no final call, ended at {r[2]:.1f} h')
                     + (', passes' if r[1] == 'PASS' else ', fails'))
    label = 'Gemini 4 Carbon, one row per task, by hour of the final call: ' + '; '.join(fmt(r) for r in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- write the files and the post ----------
CHARTS = {'carbon-pass-rate': ('pass-rate', pass_rate), 'carbon-runs': ('runs', runs)}

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
