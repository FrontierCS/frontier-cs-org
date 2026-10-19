#!/usr/bin/env python3
"""Typeset the formulas in task diagrams as TeX (Qiuyang, 2026-10-19: formulas in a proper math face).

usage: python3 bin/fcs2_fig_tex.py assets/img/fcs2-tasks/<slug>.svg ...
(needs node with mathjax-full@3.2.2, see bin/fcs2_tex2svg.js, and Playwright's Chromium, which measures the page's text)

In a diagram, write a line's math between dollar signs, as in LaTeX: <text class="n" x="18" y="126">singular values
$\\sigma$</text>. This script replaces the line with a group that keeps the source (data-tex, data-attrs) and draws it:
the text in the page's own face, each formula as MathJax's TeX glyphs drawn as paths (an <svg class="tex">), on the
line's baseline, scaled so the formula's x-height matches the text's, and placed by the line's anchor (start, or the
mid and end classes). Run again, it redraws every group from its source, so a group is edited by editing data-tex.
A formula takes the line's colour (classes n and ak; .fig2 .tex in assets/css/fcs2.css). Bold lines keep TeX's weight.
"""
import html, json, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = re.compile(r'<text ([^>]*)>([^<]*\$[^<]*)</text>')
GROUP = re.compile(r'<g data-tex="([^"]*)" data-attrs="([^"]*)">.*?</g><!--tex-->', re.S)
FONTS = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Google+Sans+Code:wght@400;500;700&display=swap'
TEX_XH = 0.442   # x-height of MathJax's TeX font, in em
COLOUR = ('n', 'ak')   # the classes that colour a line; its formulas take the same colour


def attrs(s):
    return dict(re.findall(r'([\w:-]+)="([^"]*)"', s))


def lines(svg):
    """Every line to typeset: (span to replace, attribute string, source)."""
    out = [(m.span(), html.unescape(m.group(2)), html.unescape(m.group(1))) for m in GROUP.finditer(svg)]
    out += [(m.span(), m.group(1), m.group(2)) for m in TEXT.finditer(svg)]
    return sorted(out)


def parts(src):
    """'a $x$ b' -> [('t', 'a '), ('m', 'x'), ('t', ' b')]; text keeps its XML escapes, TeX is unescaped."""
    bits = src.split('$')
    if len(bits) % 2 == 0: sys.exit(f'unbalanced $ in: {src}')
    return [(('t', b) if i % 2 == 0 else ('m', html.unescape(b))) for i, b in enumerate(bits) if b]


def main(paths):
    work = {p: (open(p, encoding='utf-8').read(), ) for p in paths}
    todo = {p: lines(s[0]) for p, s in work.items()}
    texs = sorted({b for L in todo.values() for _, _, src in L for k, b in parts(src) if k == 'm'})
    js = subprocess.run(['node', os.path.join(ROOT, 'bin', 'fcs2_tex2svg.js')], input=json.dumps(texs), capture_output=True, text=True)
    if js.returncode: sys.exit(js.stderr)
    tex = dict(zip(texs, json.loads(js.stdout)))
    css = open(os.path.join(ROOT, 'assets', 'css', 'fcs2.css'), encoding='utf-8').read()
    fig = '\n'.join(l for l in css.split('\n') if l.startswith('.fig2'))
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get('CHROME') or None)
        pg = b.new_page()
        pg.set_content(f'<html><head><link rel="stylesheet" href="{FONTS}"><style>:root{{--font-code:"Google Sans Code",monospace}}'
                       f'body{{font-family:"Hanken Grotesk",sans-serif}}{fig}</style></head><body><svg class="fig2" width="800" height="100"></svg></body></html>')
        # load the faces before measuring: fonts.ready alone resolves before any text has asked for them
        pg.evaluate('''() => Promise.all(['400 13px "Hanken Grotesk"', '600 13px "Hanken Grotesk"', '400 12px "Google Sans Code"']
            .map(f => document.fonts.load(f)))''')
        assert pg.evaluate('''() => document.fonts.check('400 13px "Hanken Grotesk"') && document.fonts.check('600 13px "Hanken Grotesk"')'''), 'Hanken Grotesk did not load'
        # per line class: font size, and the text's x-height in em
        measure = lambda cls, s: pg.evaluate('''([cls, s]) => { const svg = document.querySelector('svg');
            svg.innerHTML = `<text class="${cls}" x="0" y="50" xml:space="preserve">${s}</text>`; const t = svg.firstChild, cs = getComputedStyle(t);
            const c = document.createElement('canvas').getContext('2d'); c.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
            return [t.getComputedTextLength(), parseFloat(cs.fontSize), c.measureText('x').actualBoundingBoxAscent / 100]; }''', [cls, s])
        for p, L in todo.items():
            svg = work[p][0]
            for (i, j), at, src in reversed(L):
                a = attrs(at); cls = a.get('class', ''); base = ' '.join(c for c in cls.split() if c not in ('mid', 'end'))
                anchor = 'middle' if 'mid' in cls.split() or a.get('text-anchor') == 'middle' else 'end' if 'end' in cls.split() or a.get('text-anchor') == 'end' else 'start'
                _, fs, xh = measure(base, 'x')
                scale = fs * xh / TEX_XH / 1000   # px per TeX unit
                segs = [(k, v, measure(base, v)[0] if k == 't' else tex[v]['w'] * scale) for k, v in parts(src)]
                x = float(a['x']) - {'start': 0, 'middle': .5, 'end': 1}[anchor] * sum(w for *_, w in segs); y = float(a['y'])
                colour = ' '.join(c for c in cls.split() if c in COLOUR)
                out = []
                for k, v, w in segs:
                    if k == 't':
                        out.append(f'<text{f" class=\"{base}\"" if base else ""} x="{x:.1f}" y="{y:g}" xml:space="preserve">{v}</text>')
                    else:
                        t = tex[v]; inner = re.sub(r' data-[\w-]+="[^"]*"', '', t['inner'])
                        out.append(f'<svg class="tex{" " + colour if colour else ""}" x="{x:.1f}" y="{y + t["vy"] * scale:.2f}" width="{w:.2f}" height="{t["h"] * scale:.2f}" '
                                   f'viewBox="{t["vx"]:g} {t["vy"]:g} {t["w"]:g} {t["h"]:g}" overflow="visible">{inner}</svg>')
                    x += w
                svg = svg[:i] + f'<g data-tex="{html.escape(src)}" data-attrs="{html.escape(at)}">' + ''.join(out) + '</g><!--tex-->' + svg[j:]
            open(p, 'w', encoding='utf-8').write(svg)
            print(p, len(L), 'lines')
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:])
