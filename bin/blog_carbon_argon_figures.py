#!/usr/bin/env python3
"""Figures 3 and 4 of the Gemini 4 Carbon post (_posts/2026-10-29-gemini-4-carbon.md): Carbon against Gemini 4 Argon in
Antigravity, the same harness. Same style and file layout as bin/blog_carbon_figures.py (figures 1 and 2): each chart in
two widths, 760 and 360 (phones), as SVG files in assets/img/blog/gemini-4-carbon/ and inline in the post between
<!-- name --> and <!-- /name -->.
Data: bin/blog_carbon_argon.json, taken from metadata/formal-results.json of the public release FrontierCS2/FrontierCS-2-runs:
final score (0 to 100), verdict, and whether a final submission was scored (result_source not "no final submission").
    python3 bin/blog_carbon_argon_figures.py"""
import html, json, os, re, statistics

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(SITE, 'assets', 'img', 'blog', 'gemini-4-carbon')
POST = os.path.join(SITE, '_posts', '2026-10-29-gemini-4-carbon.md')
FONT = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif"
INK, MUTED, FAINT, BAR, LINE, GRID = '#1f1f1f', '#5f6368', '#9aa0a6', '#bdc1c6', '#dadce0', '#eceff1'
CARBON = '#34a853'
CARBON_TXT = '#' + ''.join(f'{round(int(CARBON[i:i + 2], 16) * .78):02x}' for i in (1, 3, 5))
ARGON = '#80868b'   # grey: both models are Google green on the site, so Argon steps back to grey here
C_ID, A_ID = 'carbon', 'gemini-agy'

def text(x, y, s, size, fill=INK, weight=400, anchor='start'):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}"'
            + (f' text-anchor="{anchor}"' if anchor != 'start' else '') + f'>{html.escape(s, quote=False)}</text>')

def svg(narrow, W, H, label, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" class="{"narrow" if narrow else "wide"}" viewBox="0 0 {W} {H:.0f}" '
            f'font-family="{html.escape(FONT)}" role="img" aria-label="{html.escape(label)}">{body}</svg>')

REL = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blog_carbon_argon.json')))
RUN = {tuple(k.split('|')): {'score': v[0], 'verdict': v[1], 'submitted': v[2]} for k, v in REL['runs'].items()}
def site_names():
    """Task short names as the site shows them: TASKS_RAW in assets/js/fcs2-data.js ([domain, short, paper, ..., display
    name]), matched to the release by display name, else by the release's site_task_name."""
    src = open(os.path.join(SITE, 'assets', 'js', 'fcs2-data.js')).read()
    raw = json.JSONDecoder().raw_decode(src, re.search(r'^const TASKS_RAW = ', src, re.M).end())[0]
    by_disp, shorts = {row[-1]: row[1] for row in raw}, {row[1] for row in raw}
    out = {}
    for t in REL['tasks']:
        # the four tasks the platform renamed after the release, as in bin/fcs2_db_from_release.py
        alias = {'vllm_llm_serving_optimization': 'Continuum', 'progent_privilege_control': 'Progent', 'fast_kv_compaction': 'KV Compaction', 'lrr': 'LRR'}
        n = by_disp.get(t['display_name']) or (t.get('site_task_name') if t.get('site_task_name') in shorts else None) or alias.get(t['task'])
        assert n, (t['task'], t['display_name'], t.get('site_task_name'))
        out[t['task']] = n
    return out
NAME = site_names()
TASKS = sorted({t for t, _ in RUN})
score = lambda t, m: RUN[(t, m)]['score'] or 0.0
submitted = lambda t, m: RUN[(t, m)]['submitted']

def legend(x0, y, FS, items):
    g, x = '', x0
    for lab, col in items:
        g += f'<circle cx="{x + 5:.1f}" cy="{y - FS * .32:.1f}" r="4.5" fill="{col}"/>' + text(x + 14, y, lab, FS, INK, 500)
        x += 14 + len(lab) * FS * .56 + 18
    return g

# ---------- Figure 3: Carbon minus Argon on each task ----------
def paired(narrow):
    """One row per task: Carbon final score minus Argon final score, as a bar from 0, green where Carbon is higher and
    grey where Argon is. Rows go from the largest Carbon gain to the largest Argon gain (owner: the difference only)."""
    rows = sorted(TASKS, key=lambda t: (-(score(t, C_ID) - score(t, A_ID)), NAME[t]))
    W, L, R, RH, BH, FS = (360, 146, 30, 16, 10, 12) if narrow else (760, 280, 40, 17, 11, 13)
    T = 10 + 20 + 20 + (20 if narrow else 0)
    H = T + RH * len(rows) + 46
    lim = 100
    X = lambda v: L + (v + lim) / (2 * lim) * (W - L - R)
    g = legend(0, 14, FS, [('Carbon higher', CARBON), ('Argon higher', ARGON)])
    # a grey task name: one of the two runs ended with nothing submitted, so it scores 0 (owner: mark those)
    nx = 0 if narrow else 300
    g += text(nx, 14 + (20 if narrow else 0), 'Grey name: a run that submitted nothing', FS, FAINT, 500)
    for v in range(-100, 101, 50):
        g += f'<line x1="{X(v):.1f}" x2="{X(v):.1f}" y1="{T - 4}" y2="{T + RH * len(rows) + 4}" stroke="{FAINT if v == 0 else GRID}" stroke-width="1"/>'
        g += text(X(v), T - 10, f'{v:+d}' if v else '0', FS, MUTED, 400, 'middle') + text(X(v), T + RH * len(rows) + 20, f'{v:+d}' if v else '0', FS, MUTED, 400, 'middle')
    g += text(L + (W - L - R) / 2, H - 6, 'Final score of Carbon minus that of Argon', FS, INK, 500, 'middle')
    for k, t in enumerate(rows):
        y, d = T + RH * k + RH / 2, score(t, C_ID) - score(t, A_ID)
        nm = NAME[t] if not narrow or len(NAME[t]) <= 22 else NAME[t][:21].rstrip() + '\u2026'
        g += text(0, y + FS * .36, nm, FS, INK if submitted(t, C_ID) and submitted(t, A_ID) else FAINT, 500)
        x0, x1 = sorted((X(0), X(d)))
        g += f'<rect x="{x0:.1f}" y="{y - BH / 2:.1f}" width="{max(x1 - x0, .8):.1f}" height="{BH}" rx="1.5" fill="{CARBON if d >= 0 else ARGON}"/>'
        if abs(d) >= 10:
            g += text(X(d) + (5 if d > 0 else -5), y + FS * .36, f'{d:+.0f}', FS - 1, CARBON_TXT if d > 0 else MUTED, 600, 'start' if d > 0 else 'end')
    label = 'Final score of Gemini 4 Carbon minus that of Gemini 4 Argon on each task: ' + '; '.join(f'{NAME[t]} ' + (f'{round(score(t, C_ID) - score(t, A_ID)):+d}' if round(score(t, C_ID) - score(t, A_ID)) else '0') for t in rows) + '.'
    return svg(narrow, W, H, label, g)

# ---------- Figure 4: all tasks against the tasks where both submitted ----------
def submitted_only(narrow):
    """Pass rate and mean final score of each model, on all 48 tasks and on the tasks where both models submitted a final.
    Two panels side by side (stacked on phones), two groups each, a bar per model."""
    both = [t for t in TASKS if submitted(t, C_ID) and submitted(t, A_ID)]
    sets = [(f'All {len(TASKS)} tasks', TASKS), (f'{len(both)} tasks, both submitted', both)]
    val = {'pass': lambda m, ts: 100 * sum(RUN[(t, m)]['verdict'] == 'PASS' for t in ts) / len(ts),
           'mean': lambda m, ts: statistics.mean(score(t, m) for t in ts)}
    W, FS = (360, 12) if narrow else (760, 13)
    PW = W                                                          # one panel
    PH, BW, GAP = 190, (34 if narrow else 44), 10
    panels = [('Mean final score', 'mean')]   # owner: the mean score only
    g = legend(0, 14, FS, [('Gemini 4 Carbon', CARBON), ('Gemini 4 Argon', ARGON)])
    H = 34 + PH + 70
    for p, (title, key) in enumerate(panels):
        ox, oy = 0, 34
        base, top = oy + 24 + PH, oy + 24
        Y = lambda v: base - v / 70 * PH
        g += text(ox, oy + 12, title, FS, INK, 600)
        for v in range(0, 71, 20):
            g += f'<line x1="{ox:.1f}" x2="{ox + PW:.1f}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="{GRID}" stroke-width="1"/>'
            g += text(ox, Y(v) - 3, f'{v}', FS - 1, MUTED)
        gw = 2 * BW + GAP
        for s, (lab, ts) in enumerate(sets):
            cx = ox + PW * (s + .5) / 2
            for b, (m, col) in enumerate(((C_ID, CARBON), (A_ID, ARGON))):
                v = val[key](m, ts); x = cx - gw / 2 + b * (BW + GAP)
                g += f'<rect x="{x:.1f}" y="{Y(v):.1f}" width="{BW}" height="{base - Y(v):.1f}" rx="2" fill="{col}"/>'
                g += text(x + BW / 2, Y(v) - 5, f'{v:.1f}', FS, CARBON_TXT if m == C_ID else MUTED, 600, 'middle')
            g += text(cx, base + 18, lab, FS - (1 if narrow else 0), INK, 500, 'middle')
        g += f'<line x1="{ox:.1f}" x2="{ox + PW:.1f}" y1="{base:.1f}" y2="{base:.1f}" stroke="{FAINT}" stroke-width="1"/>'
    parts = [f'{title.lower()} on {lab}: Carbon {val[key](C_ID, ts):.1f}, Argon {val[key](A_ID, ts):.1f}' for title, key in panels for lab, ts in sets]
    return svg(narrow, W, H, 'Gemini 4 Carbon against Gemini 4 Argon, ' + '; '.join(parts) + '.', g)

CHARTS = {'carbon-vs-argon': ('vs-argon', paired), 'carbon-submitted': ('submitted', submitted_only)}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    src = open(POST).read()
    for marker, (stem, draw) in CHARTS.items():
        wide, narrow = draw(False), draw(True)
        open(os.path.join(OUT, f'{stem}.svg'), 'w').write(wide + '\n')
        open(os.path.join(OUT, f'{stem}-narrow.svg'), 'w').write(narrow + '\n')
        if f'<!-- {marker} -->' in src:   # embed once the post has the markers
            src = re.sub(rf'(<!-- {marker} -->).*?(<!-- /{marker} -->)', lambda m: m.group(1) + wide + narrow + m.group(2), src, flags=re.S)
    open(POST, 'w').write(src)
