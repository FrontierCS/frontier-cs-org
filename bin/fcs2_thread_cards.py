#!/usr/bin/env python3
"""Draw a thread of post cards for X in the share card's style (bin/fcs2_card.py): white, the FrontierCS brand top left,
the address top right, a headline and one line of context, one visual. 16:9, 960 x 540 CSS px saved at 1600 x 900.

One card per chart worth sharing from the site and the paper; no flowcharts, tables or single-task case studies (owner,
2026-10-10). Charts are drawn inside the built overview by the page's own code (assets/js/fcs2.js), so colours and label
placement match the site, and every number in a headline is computed from the page's data (fcs2-data.js) when the card is
drawn; console.assert stops the run if the data no longer support a headline's wording. The first card is the share
card (assets/img/fcs2-card.png, 1200 x 630), copied as it is.
usage (vis node, Playwright):  python bin/fcs2_thread_cards.py [built _site dir] [output dir]
"""
import pathlib
import shutil
import socket
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

SITE = sys.argv[1] if len(sys.argv) > 1 else '/scratch/gpfs/KARTHIKN/wc9403/tmp/fcsite/_site'
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else '/scratch/gpfs/KARTHIKN/wc9403/tmp/fcsite/thread')
OUT.mkdir(parents=True, exist_ok=True)
CW, CH = 960, 540
HI = pathlib.Path('/scratch/gpfs/KARTHIKN/wc9403/tmp/fcsite/papers/img-hi')   # papers/render_hi.py: 800 px first pages, colour.json


def pages():
    """The 800 px first pages as data URIs, most colourful first, duplicates (one paper behind several tasks) dropped."""
    import base64, hashlib, json
    colour, seen, out = json.load(open(HI / 'colour.json')), set(), []
    for stem in sorted(colour, key=lambda k: -colour[k]):
        b = (HI / f'{stem}.webp').read_bytes(); h = hashlib.md5(b).hexdigest()
        if h in seen: continue
        seen.add(h); out.append('data:image/webp;base64,' + base64.b64encode(b).decode())
    return out




CSS = """
.tcard{position:fixed; left:0; top:0; width:960px; height:540px; background:#fff; z-index:99999; overflow:hidden;
  font-family:'Hanken Grotesk',sans-serif; color:#1f1f1f}
.tcard .tc-top{position:absolute; left:48px; right:48px; top:34px; display:flex; justify-content:space-between; align-items:center}
.tcard .tc-brand{display:flex; align-items:center; gap:10px; font-size:20px; font-weight:500; letter-spacing:-.015em}
.tcard .tc-brand svg{width:20px; height:20px}
.tcard .tc-url{font-size:15px; font-weight:500; color:#0b57d0}
.tcard .tc-h{font-size:34px; font-weight:600; line-height:1.12; letter-spacing:-.015em; margin:0 0 12px}
.tcard .tc-sub{font-size:17px; line-height:1.4; color:#5f6368; margin:0}
.tcard .tc-body{position:absolute; left:48px; right:48px; top:78px; bottom:20px; display:flex}
.tcard.stack .tc-body{flex-direction:column}
.tcard.stack .tc-vis{flex:1; min-height:0; margin-top:20px; display:flex; flex-direction:column; justify-content:center}
.tcard.side .tc-body{flex-direction:row; align-items:center; gap:40px; bottom:40px}
.tcard.side .tc-hd{width:340px; flex:none}
.tcard.side .tc-vis{flex:1; min-width:0; align-self:stretch; display:flex; flex-direction:column; justify-content:center}
.tcard .tc-note{font-size:12.5px; line-height:1.4; color:#80868b; margin-top:12px}
.tcard.side .tc-note{position:absolute; left:48px; right:48px; bottom:20px; margin:0}
.tcard .plot text{font-size:14px}
.tcard .plot .lab{font-size:15px}
.tcard #pcsvg .lab{font-size:13.5px}   /* the price card's dots crowd at the right: smaller names keep each beside its own dot */
.tcard .tip{display:none}
.tcard .legend{font-size:14px; margin-top:6px}
.tcard .papers{height:100%; width:100%}
.tcard .pcol{animation-play-state:paused !important}
.tcard .twall{position:absolute; right:0; top:64px; bottom:0; width:500px; overflow:hidden; perspective:1500px; z-index:0;
  -webkit-mask-image:linear-gradient(transparent,#000 14%,#000 86%,transparent),linear-gradient(90deg,transparent,#000 14%,#000 92%,transparent);
  -webkit-mask-composite:source-in;
  mask-image:linear-gradient(transparent,#000 14%,#000 86%,transparent),linear-gradient(90deg,transparent,#000 14%,#000 92%,transparent);
  mask-composite:intersect}
.tcard .tc-cap{font-size:13px; line-height:1.4; color:#80868b; margin-top:10px}
"""

# Card shell: brand and address on top; 'stack' puts the visual under the headline, 'side' beside it.
SHELL = """
window.card = (layout, h, sub, note) => {
  console.assert(![h, sub, note].some(t => /[’']/.test(t || '')), 'no apostrophes on a card (owner, 2026-10-13)', h, sub, note);
  document.querySelectorAll('.tcard').forEach(e => e.remove());
  const c = document.createElement('div'); c.className = `tcard fcs2 ${layout}`;
  c.innerHTML = `<div class="tc-top"><div class="tc-brand"><svg viewBox="-5.5 -69.2 74.7 74.7"><path d="M0 -50 A50 50 0 0 1 50 0" fill="none" style="stroke:var(--mk-in,#1f1f1f)" stroke-width="11" stroke-linecap="round"/><rect class="mk-piece" x="45.2" y="-69.2" width="24" height="24" rx="5.5" style="fill:var(--mk-out,#0b57d0)"/></svg>FrontierCS</div><div class="tc-url">frontier-cs.org</div></div>
    <div class="tc-body"><div class="tc-hd">${h ? `<div class="tc-h">${h}</div>` : ''}${sub ? `<p class="tc-sub">${sub}</p>` : ''}</div><div class="tc-vis"></div>${note && layout === 'stack' ? `<div class="tc-note">${note}</div>` : ''}</div>${note && layout === 'side' ? `<div class="tc-note">${note}</div>` : ''}`;
  document.body.append(c); return c.querySelector('.tc-vis');
};
// the visual's free height; charts are drawn to it (fcs2.js and fcs2-task.js read window.CHART_H at draw time)
window.fit = (v, key, minus = 0) => { CHART_H[key] = Math.floor(v.clientHeight - minus); };
// row charts (mean score, FCI): drop the harness line under each model name and centre the name on its row
window.oneLine = svg => svg.querySelectorAll('text.lab').forEach(l => { const n = l.nextElementSibling;
  if (n && n.tagName === 'text' && /12px/.test(n.getAttribute('style') || '')) { l.setAttribute('y', +l.getAttribute('y') + 7); n.remove(); } });
// row charts on a card: the lanes are too tight for a value above its mark (it would sit in the row above), so each value
// moves beside its row's mark, to the right of the mean dot (mean score) or of the whisker's end (FCI)
window.sideVals = svg => svg.querySelectorAll('text.val').forEach(v => { const m = v.previousElementSibling; if (!m) return;
  const yc = m.tagName === 'circle' ? +m.getAttribute('cy') : m.getBBox().y + m.getBBox().height / 2;
  const x = m.tagName === 'circle' ? +m.getAttribute('cx') + +m.getAttribute('r') + 5 : m.getBBox().x + m.getBBox().width + 7;
  v.setAttribute('x', x.toFixed(1)); v.setAttribute('y', (yc + 5).toFixed(1)); v.setAttribute('text-anchor', 'start'); });
// layout audit, run on every card: visible text boxes must not overlap each other, must stay inside the card, and in a
// row chart each model name must sit level with its row's mean dot or bar
window.audit = () => {
  const c = document.querySelector('.tcard'), cb = c.getBoundingClientRect(), bad = [];
  const texts = [...c.querySelectorAll('text, .tc-h, .tc-sub, .tc-note, .tc-cap, .tc-brand, .tc-url, .legend span, td, th, span')]
    .filter(e => (e.tagName === 'text' || [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) && e.getClientRects().length)
    .filter(e => !e.closest('svg.tile, svg.art, .papers'));
  const box = e => { const r = e.getBoundingClientRect(); return {l:r.left, r:r.right, t:r.top, b:r.bottom, e}; };
  const bs = texts.map(box).filter(b => b.r - b.l > 1 && b.b - b.t > 1);
  bs.forEach(b => { if (b.l < cb.left - 1 || b.r > cb.right + 1 || b.t < cb.top - 1 || b.b > cb.bottom + 1) bad.push('outside: ' + b.e.textContent.slice(0, 30)); });
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
    if (ox > 1 && oy > 2) bad.push(`overlap: "${a.e.textContent.slice(0, 24)}" / "${b.e.textContent.slice(0, 24)}"`); }
  const pc = c.querySelector('#pcsvg'); if (pc && pc.querySelectorAll('text.lab').length < MODELS.length) bad.push(`price card: ${MODELS.length - pc.querySelectorAll('text.lab').length} dots without a name`);
  c.querySelectorAll('#lbsvg, #ecisvg').forEach(svg => {
    // the row's mark: the mean dot (mean score chart) or the bar (FCI chart)
    const dots = [...svg.querySelectorAll('circle, rect.ebar')].map(d => d.getBoundingClientRect()).filter(r => r.width >= 11);
    svg.querySelectorAll('text.lab').forEach(l => { const r = l.getBoundingClientRect(), cy = (r.top + r.bottom) / 2;
      const near = Math.min(...dots.map(d => Math.abs((d.top + d.bottom) / 2 - cy)));
      if (near > 4) bad.push(`label off its row by ${near.toFixed(1)}px: ${l.textContent}`); }); });
  return bad;
};
0;   // end on a value: Playwright calls a string's result when it is a function
"""

OVERVIEW = {
    # a teaser before the release, built on the paper card (owner: the paper wall suits a teaser): the wall large and
    # a teaser before the release: the paper card's layout unchanged (owner: the paper card suits a teaser), teaser
    # a teaser before the release (owner: only the picture and "FrontierCS 2, coming soon"): the paper card's wall on the
    # a teaser before the release (owner: only the picture and "FrontierCS 2, coming soon"; the logo and the address in
    # a teaser before the release (owner: the picture, "FrontierCS 2", a little context, "Coming soon"; the logo and the
    # address in their usual places): the top bar as on every card, the name, "AI for Computer Science R&D" (the owner's
    # words) and "Coming soon" on the left, and on the right a wall of
    # the tasks' paper first pages on the site's tilted plane, sharper (800 px renders) and larger than the site's, the most
    # colourful pages (figures on the first page) nearest the centre
    '00-teaser': """() => {
      const v = card('side', '', '', ''), c = v.closest('.tcard'), hd = c.querySelector('.tc-hd');
      hd.style.width = '410px';
      hd.innerHTML = `<div style="font-size:56px; font-weight:600; letter-spacing:-.02em; line-height:1; white-space:nowrap">FrontierCS 2</div>
        <div style="font-size:24px; font-weight:500; color:#5f6368; margin-top:14px; white-space:nowrap">AI for Computer Science R&amp;D</div>
        <div style="font-size:24px; font-weight:500; color:#0b57d0; margin-top:26px">Coming soon</div>`;
      const cols = 5, rows = 5, pw = 168, ph = Math.round(pw * 1.294), gap = 16, cells = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) cells.push([q, r, Math.hypot(q - (cols - 1) / 2, (r - (rows - 1) / 2) * 1.2)]);
      cells.sort((a, b) => a[2] - b[2]);
      const pages = cells.map(([q, r], i) => `<img src="${PAGES[i % PAGES.length]}" style="position:absolute; max-width:none; left:${(q - cols / 2) * (pw + gap)}px; top:${(r - rows / 2) * (ph + gap) + (q % 2) * ph * .35}px; width:${pw}px; height:${ph}px; border-radius:3px; box-shadow:0 2px 8px rgba(32,33,36,.18), 0 0 0 1px rgba(32,33,36,.08); background:#fff">`).join('');
      const w = document.createElement('div');
      w.className = 'twall';
      w.innerHTML = `<div style="position:absolute; left:50%; top:50%; transform-style:preserve-3d; transform:rotateX(50deg) rotateZ(-32deg)">${pages}</div>`;
      c.append(w); hd.parentElement.style.zIndex = 1;
    }""",
    # the evolution card is gone (owner, 2026-10-20: '这个卡片删掉吧'); the thread runs cover, pass rate, price, score, FCI, scaling, private, explore
    # pass rate by model: the leaderboard's first chart, one bar per model with its lab's logo and harness (owner, 2026-10-20:
    # the bar chart added on 2026-10-16 had no card); the line under the headline names the model with the highest pass rate
    '02-pass-rate': """() => {
      const top = [...MODELS].sort((a, b) => passPct(b) - passPct(a))[0];
      const v = card('stack', 'Pass rate', `${top.name} passes ${Math.round(passPct(top))}% of its runs.`,
        'A pass beats the human reference on every metric of every hidden workload.');
      CHART_H.fcibFlat = true; CHART_H.fcib = Math.floor(v.clientHeight - 150); v.append(document.getElementById('fcibplot')); drawPassBars();   // upright names and harnesses, as on a desktop page
    }""",
    # pass rate against cost: the overview's chart
    '03-pass-cost': """() => {
      const v = card('stack', 'Pass rate vs. cost per run',
        'One dot per model.',
        'A pass beats the human reference on every metric of every hidden workload.');
      fit(v, 'pc'); v.append(document.getElementById('pcplot')); drawPassCost();
    }""",
    # mean final score: the overview's chart, grouped by model
    '04-mean-score': """() => {
      const sc = m => RUNS.filter(r => r.m === m.id).map(r => r.s), mu = m => mean(sc(m)), top = [...MODELS].sort((a, b) => mu(b) - mu(a));
      const v = card('stack', 'Score against the human reference',   // owner, 2026-10-14: the overview's mean score is the difference
        'One dot per run, the large dot the mean of each model.',
        '');   /* the axis title already says what the score is */
      CHART_H.lbLane = Math.floor((v.clientHeight - 54) / MODELS.length); CHART_H.lbR = 76; v.append(document.getElementById('lbplot')); drawLB(); oneLine(document.getElementById('lbsvg'));
      // each model's mean as text in a column right of the plot, level with its row and off the dots, which would hide it
      // (owner, 2026-10-20: the score card keeps its score text)
      const lsvg = document.getElementById('lbsvg'), xr = Math.max(...[...lsvg.querySelectorAll('line')].map(l => +l.getAttribute('x2')));
      lsvg.querySelectorAll('text.val').forEach(t => { const m = t.previousElementSibling, yc = m && m.tagName === 'circle' ? +m.getAttribute('cy') : null;
        if (yc != null) { t.setAttribute('x', (xr + 14).toFixed(1)); t.setAttribute('y', (yc + 5).toFixed(1)); t.setAttribute('text-anchor', 'start'); t.style.fontWeight = 600; } });
    }""",
    # FCI: the overview's chart; the line under the headline names the model with the highest FCI and its value (the
    # human reference has no FCI on the pass-based scale, so the old count of models above it is gone; Qiuyang, 2026-10-14)
    '05-fci': """() => {
      const top = RANKED[0];
      console.assert(fe(ECI[top.id][0]) !== fe(ECI[RANKED[1].id][0]), 'FCI wording: a tie at the top', top.id, RANKED[1].id);
      const v = card('stack', 'FCI (FrontierCS Capabilities Index)',   // owner, 2026-10-13: the index's name as the headline
        `${top.name} is highest, at ${fe(ECI[top.id][0])}.`,
        `FCI, fitted on the beat or miss of each metric. ${ECI_LOW_NAME} = ${ECI_LOW_VALUE}.`);
      CHART_H.eciLane = Math.floor((v.clientHeight - 60) / MODELS.length); v.append(document.getElementById('eciplot')); drawECI(); oneLine(document.getElementById('ecisvg')); sideVals(document.getElementById('ecisvg'));
    }""",
    # test-time scaling: the overview's chart
    '06-scaling': """() => {
      const v = card('stack', 'FCI vs. budget per run',
        'A run that ended within the budget counts what it beat; one still going counts as beating nothing.',
        'One curve per lab, its model with the highest FCI, as on the site.');
      fit(v, 'tts', 8); CHART_H.ttsR = 150; v.append(document.getElementById('ttsplot')); drawTTS();   // the chart names its curves; it has no legend since 2026-10-17
    }""",
    # the private set (owner, 2026-10-10: a separate set of unreleased tasks; 2026-10-20: the card says 100+ tasks): task illustrations
    # blurred past recognition, each under a white lock, in the closing card's grid
    '07-private': """() => {
      const v = card('side', '100+ private tasks.', 'Held back, to be announced in the future.', '');
      const all = AREAS.flatMap(a => TASKS.filter(t => a.d.includes(t.d)).map(t => [t, a.k])), pick = Array.from({length:12}, (_, i) => all[Math.floor((i + .5) * all.length / 12)]);
      const cols = 3, gw = 470, gap = 6, tw = (gw - gap * (cols - 1)) / cols, th = tw / 1.5;
      const lock = `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="#3c4043"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#3c4043" stroke-width="2.2" stroke-linecap="round"/></svg>`;
      v.style.display = 'grid'; v.style.gridTemplateColumns = `repeat(${cols}, ${tw}px)`; v.style.gap = `${gap}px`; v.style.alignContent = 'center';
      v.innerHTML = pick.map(([t, k]) => `<div style="position:relative; width:${tw}px; height:${th}px; border-radius:8px; overflow:hidden; background:${ART_FIELD[k]}">
          <div style="position:absolute; inset:-12%; filter:blur(9px) saturate(1.1)">${taskArt(t.s, k).replace('<svg class="art"', `<svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice"`)}</div>
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:38px; height:38px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(32,33,36,.2)">${lock}</div></div>`).join('');
    }""",
    # where to look: a sample of task illustrations
    '08-explore': """() => {
      const v = card('side', `Explore all ${TASKS.length} tasks`,
        'Each built from a published paper.', '');
      const pick = AREAS.flatMap(a => TASKS.filter(t => a.d.includes(t.d)).slice(0, 2).map(t => [t, a.k])).slice(0, 12);
      const cols = 3, gw = 470, gap = 6, tw = (gw - gap * (cols - 1)) / cols, th = tw / 1.5;
      v.style.display = 'grid'; v.style.gridTemplateColumns = `repeat(${cols}, ${tw}px)`; v.style.gap = `${gap}px`; v.style.alignContent = 'center';
      v.innerHTML = pick.map(([t, k]) => `<div style="position:relative; width:${tw}px; height:${th}px; border-radius:8px; overflow:hidden">${taskArt(t.s, k).replace('<svg class="art"', `<svg width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice"`)}
        <span style="position:absolute; left:6px; top:6px; background:#fff; color:${AINK[k]}; border-radius:99px; padding:2px 8px; font-size:11.5px; font-weight:600; max-width:${tw - 24}px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${esc(t.s)}</span></div>`).join('');
    }""",
}

PAGES = pages()
s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '-d', SITE, '-b', '127.0.0.1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        failed = []
        for name, js in OVERVIEW.items():
            ctx = b.new_context(viewport={'width': CW, 'height': CH}, device_scale_factor=1600 / CW, reduced_motion='reduce')
            # an empty CHART_H the cards fill with the free height before drawing (fcs2.js and fcs2-task.js read it)
            ctx.add_init_script('window.CHART_H = {}; window.LABEL_LH = 1.25;')   # labels keep whole text boxes apart (labelDot in fcs2-data.js)
            pg = ctx.new_page(); errs, logs = [], []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: m.type in ('assert', 'error') and logs.append(m.text))
            pg.goto(f'http://127.0.0.1:{port}/', wait_until='networkidle')
            pg.evaluate('document.fonts.ready')
            pg.add_style_tag(content=CSS); pg.evaluate(SHELL)
            pg.evaluate('p => { window.PAGES = p; }', PAGES)
            pg.evaluate(js); pg.wait_for_timeout(700)
            # every image on the card decoded before the screenshot (data URIs decode asynchronously)
            pg.wait_for_function("[...document.querySelectorAll('.tcard img')].every(i => i.complete && i.naturalWidth > 0)", timeout=20000)
            assert not errs and not logs, (name, errs, logs)
            bad = pg.evaluate('audit()')
            if bad: print(name, 'LAYOUT', bad[:12]); failed.append(name)
            pg.locator('.tcard').screenshot(path=str(OUT / f'{name}.png'))
            print(name, 'ok')
            ctx.close()
        b.close()
        assert not failed, f'layout audit failed: {failed}'
finally:
    srv.kill()
# the first card is the share card itself (owner: reuse it, 2026-10-10)
shutil.copy(pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'img' / 'fcs2-card.png', OUT / '01-cover.png')
print('01-cover copied from assets/img/fcs2-card.png; cards in', OUT)
