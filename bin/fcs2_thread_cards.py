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
.tcard .tc-brand svg{width:13px; height:13px; color:#0b57d0}
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
  document.querySelectorAll('.tcard').forEach(e => e.remove());
  const c = document.createElement('div'); c.className = `tcard fcs2 ${layout}`;
  c.innerHTML = `<div class="tc-top"><div class="tc-brand"><svg viewBox="49 47 81 100"><path d="M59.78 135.86 L75.94 71.24 A17.5 17.5 0 0 1 92.89 58 L118.5 58" fill="none" stroke="currentColor" stroke-width="21" stroke-linecap="round"/><circle cx="109" cy="97" r="10.5" fill="currentColor"/></svg>FrontierCS</div><div class="tc-url">frontier-cs.org</div></div>
    <div class="tc-body"><div class="tc-hd">${h ? `<div class="tc-h">${h}</div>` : ''}${sub ? `<p class="tc-sub">${sub}</p>` : ''}</div><div class="tc-vis"></div>${note && layout === 'stack' ? `<div class="tc-note">${note}</div>` : ''}</div>${note && layout === 'side' ? `<div class="tc-note">${note}</div>` : ''}`;
  document.body.append(c); return c.querySelector('.tc-vis');
};
// the visual's free height; charts are drawn to it (fcs2.js and fcs2-task.js read window.CHART_H at draw time)
window.fit = (v, key, minus = 0) => { CHART_H[key] = Math.floor(v.clientHeight - minus); };
window.PRE = 'Preliminary results';
// row charts (mean score, FECI): drop the harness line under each model name and centre the name on its row
window.oneLine = svg => svg.querySelectorAll('text.lab').forEach(l => { const n = l.nextElementSibling;
  if (n && n.tagName === 'text' && /12px/.test(n.getAttribute('style') || '')) { l.setAttribute('y', +l.getAttribute('y') + 7); n.remove(); } });
// layout audit, run on every card: visible text boxes must not overlap each other, must stay inside the card, and in a
// row chart each model name must sit level with its row's mean dot
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
  c.querySelectorAll('#lbsvg, #ecisvg').forEach(svg => {
    const dots = [...svg.querySelectorAll('circle')].map(d => d.getBoundingClientRect()).filter(r => r.width >= 11);
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
    # a teaser before the release (owner: only the picture and "FrontierCS 2, coming soon"; the logo and the address in
    # their usual places): the top bar as on every card, the name and "Coming soon" on the left, and on the right a wall of
    # the tasks' paper first pages on the site's tilted plane, sharper (800 px renders) and larger than the site's, the most
    # colourful pages (figures on the first page) nearest the centre
    '00-teaser': """() => {
      const v = card('side', '', '', ''), c = v.closest('.tcard'), hd = c.querySelector('.tc-hd');
      hd.style.width = '410px';
      hd.innerHTML = `<div style="font-size:56px; font-weight:600; letter-spacing:-.02em; line-height:1; white-space:nowrap">FrontierCS 2</div>
        <div style="font-size:24px; font-weight:500; color:#0b57d0; margin-top:16px">Coming soon</div>`;
      const cols = 5, rows = 5, pw = 168, ph = Math.round(pw * 1.294), gap = 16, cells = [];
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) cells.push([q, r, Math.hypot(q - (cols - 1) / 2, (r - (rows - 1) / 2) * 1.2)]);
      cells.sort((a, b) => a[2] - b[2]);
      const pages = cells.map(([q, r], i) => `<img src="${PAGES[i % PAGES.length]}" style="position:absolute; max-width:none; left:${(q - cols / 2) * (pw + gap)}px; top:${(r - rows / 2) * (ph + gap) + (q % 2) * ph * .35}px; width:${pw}px; height:${ph}px; border-radius:3px; box-shadow:0 2px 8px rgba(32,33,36,.18), 0 0 0 1px rgba(32,33,36,.08); background:#fff">`).join('');
      const w = document.createElement('div');
      w.className = 'twall';
      w.innerHTML = `<div style="position:absolute; left:50%; top:50%; transform-style:preserve-3d; transform:rotateX(50deg) rotateZ(-32deg)">${pages}</div>`;
      c.append(w); hd.parentElement.style.zIndex = 1;
    }""",
    # research is a loop: on one task, each model's longest run as its best development score so far (a step line) with
    # every valid submission as a dot, over spend in US$ (log). The task: most models with a run of 15+ valid
    # research is a loop: the task map's evolution card (the task's illustration, best-so-far step lines, no axes) with
    # several models on one task. Each model's longest run: its best development score so far as a step line in the
    # model's colour, a dot at every valid submission, over spend in US$ (log, shared). The illustration sits under a light
    # white veil so the colours read. The task: most models with a run of 15+ valid submissions, then the most valid
    # research is a loop: the task map's evolution card (the task's illustration, best-so-far step lines, no axes) with
    # several models on one task. Each model's longest run: its best development score so far as a step line in the
    # model's colour against submission number (owner, 2026-10-10), from its first valid submission, the score axis spanning
    # only the scores reached; a dot at every submission from there, failed ones included, and
    # the model's name just above its line's end, right-aligned to it, instead of a legend (owner); the task name
    # bottom right (owner). The illustration sits under a light white veil so
    # the colours read. The task: among tasks with 4+ models that have a run of 15+ valid submissions, the most models whose
    # best score rises 10+ points over their first valid submission, then the most submissions. The score range starts at
    # the 10th percentile of the plotted points, so the climb and the plateau fill the tile.
    '02-run': """() => {
      const valid = r => r[6].filter(q => q[1] > 0);
      const longest = t => MODELS.map(m => TRAJ.filter(r => r[1] === t.s && r[0] === m.id).sort((a, b) => valid(b).length - valid(a).length)[0]).filter(r => r && valid(r).length >= 15);
      const gain = r => Math.max(...r[6].map(q => q[1])) - valid(r)[0][1], better = t => longest(t).filter(r => gain(r) >= 10).length;
      const subs = t => longest(t).reduce((a, r) => a + r[6].length, 0);
      const t = TASKS.filter(t => longest(t).length >= 4).sort((a, b) => better(b) - better(a) || subs(b) - subs(a))[0], runs = longest(t), n = runs.reduce((a, r) => a + r[6].length, 0), k = AREA_OF[t.d].k;
      console.assert(runs.length >= 4, 'run card: too few models', t.s, runs.length);
      const v = card('side', 'Agents don’t one-shot research.',
        `${runs.length} models, ${n} submissions on ${esc(t.s)}. Every dot is a try.`, '');
      const W = 470, H = 360, svgNS = 'http://www.w3.org/2000/svg', col = id => getComputedStyle(document.documentElement).getPropertyValue(`--m-${id}`).trim();
      v.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block; font-family:'Hanken Grotesk'"></svg>`;
      const svg = v.querySelector('svg');
      // room on the right for the longest name
      const meas = str => { const e = document.createElementNS(svgNS, 'text'); e.setAttribute('font-size', 14); e.setAttribute('font-weight', 600); e.textContent = str; svg.append(e); const w = e.getComputedTextLength(); e.remove(); return w; };
      // a line starts at its run's first valid submission; the score range is the scores the lines reach, in tens
      const first = r => r[6].findIndex(q => q[1] > 0), best = r => Math.max(...r[6].map(q => q[1]));
      // score range: from the 10th percentile of all plotted points (lower starts leave through the bottom edge) to the top
      const pts = runs.flatMap(r => { let m = -1; return r[6].slice(first(r)).map(q => (m = Math.max(m, q[1]))); }).sort((a, b) => a - b);
      const lo = Math.floor(pts[Math.floor(pts.length * .1)] / 5) * 5, hi = Math.min(100, Math.ceil(Math.max(...runs.map(best)) / 5) * 5 + 2);
      const PL = 24, PR = 24, PT = 34, PB = 52, N = Math.max(...runs.map(r => r[6].length));
      const X = i => PL + (i - 1) / (N - 1) * (W - PL - PR), Y = s => PT + (1 - (s - lo) / (hi - lo)) * (H - PT - PB);
      let g = `<defs><clipPath id="rc"><rect width="${W}" height="${H}" rx="12"/></clipPath><clipPath id="band"><rect x="0" y="0" width="${W}" height="${H - PB + 8}"/></clipPath></defs><g clip-path="url(#rc)">${taskArt(t.s, k).replace('<svg class="art"', `<svg width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"`)}
        <rect width="${W}" height="${H}" fill="#fff" opacity=".84"/></g><text x="${W - 20}" y="${H - 18}" text-anchor="end" fill="${AINK[k]}" font-size="19" font-weight="600">${esc(t.s)}</text>`;
      const ends = [];
      runs.forEach(r => { const c = col(r[0]); let b = -1, d = '', dots = '';
        r[6].forEach(([, s], i) => { if (i < first(r)) return; b = Math.max(b, s); const x = X(i + 1).toFixed(1), y = Y(b).toFixed(1);
          d += i > first(r) ? `H${x}V${y}` : `M${x},${y}`; dots += `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}" stroke="#fff" stroke-width="1.1"/>`; });
        g += `<g clip-path="url(#band)"><path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}</g>`;
        ends.push({m:r[0], c, x:X(r[6].length), y:Y(b) - 10}); });
      // each name right-aligned to its line's end, just above it; a name that would touch another moves up (or down) in 2 px steps
      const placed = [], hit = (a, b) => a.x - a.w - 8 < b.x + 8 && b.x - b.w - 8 < a.x + 8 && Math.abs(a.y - b.y) < 21;
      ends.sort((a, b) => a.y - b.y).forEach(e => { e.w = meas(MNAME[e.m]);
        for (let dy = 0; dy < 200; dy += 2) { const dn = {...e, y:e.y + dy}, up = {...e, y:e.y - dy};
          if (!placed.some(p => hit(up, p)) && up.y > 18) { e.y = up.y; break; }
          if (!placed.some(p => hit(dn, p)) && dn.y < H - 44) { e.y = dn.y; break; } }
        placed.push(e);
        // a white chip under the name, as on the task map, so lines and dots behind it do not show through
        g += `<rect x="${(e.x - e.w - 7).toFixed(1)}" y="${(e.y - 14).toFixed(1)}" width="${(e.w + 14).toFixed(1)}" height="19" rx="9.5" fill="#fff" opacity=".94"/>`
          + `<text x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" text-anchor="end" font-size="14" font-weight="600" fill="${e.c}">${esc(MNAME[e.m])}</text>`; });
      svg.innerHTML = g;
    }""",
    # pass rate against cost: the overview's chart
    '03-pass-cost': """() => {
      const top = RANKED.reduce((a, b) => PASS[a.id][0] >= PASS[b.id][0] ? a : b), ratio = COST.ds[0] / COST.sol[0];
      console.assert(top.id === 'astra' && Math.abs(PASS.ds[0] - PASS.sol[0]) < 1 && ratio > .15 && ratio < .25, 'pass/cost wording');
      const v = card('stack', 'Pass rate vs. price',
        'One dot per model.',
        `${PRE} · a pass beats the authors’ code on every hidden workload`);
      fit(v, 'pc'); v.append(document.getElementById('pcplot')); drawPassCost();
    }""",
    # mean final score: the overview's chart, grouped by model
    '04-mean-score': """() => {
      const sc = m => RUNS.filter(r => r.m === m.id).map(r => r.s), mu = m => mean(sc(m)), top = [...MODELS].sort((a, b) => mu(b) - mu(a));
      const hi = Math.floor(Math.min(...MODELS.map(m => Math.max(...sc(m))))), lo = Math.ceil(Math.max(...MODELS.map(m => Math.min(...sc(m)))));
      console.assert(hi >= 95 && lo <= 10, 'mean-score wording', hi, lo);
      const v = card('stack', 'Mean score by model',
        'One dot per run.',
        `${PRE} · the large dot is the model’s mean`);
      CHART_H.lbLane = Math.floor((v.clientHeight - 54) / MODELS.length); v.append(document.getElementById('lbplot')); drawLB(); oneLine(document.getElementById('lbsvg'));
    }""",
    # FECI: the overview's chart; the headline names the models whose whole 90% interval is above Human
    '05-feci': """() => {
      const above = RANKED.filter(m => ECI[m.id][1] > ECI_HUMAN).map(m => m.name);
      const near = RANKED.filter(m => ECI[m.id][1] <= ECI_HUMAN && ECI[m.id][2] >= ECI_HUMAN).length;
      console.assert(above.length === 2 && near === MODELS.length - 2, 'FECI wording', above, near);
      const v = card('stack', 'Two models beat the authors',
        `${above.join(' and ')} clear the authors’ code. The rest are within noise.`,
        `${PRE} · FECI, fitted with Epoch AI’s ECI code`);
      CHART_H.eciLane = Math.floor((v.clientHeight - 60) / MODELS.length); v.append(document.getElementById('eciplot')); drawECI(); oneLine(document.getElementById('ecisvg'));
    }""",
    # test-time scaling: the overview's chart; budgets where two models come within 1 point of their final FECI
    '06-scaling': """() => {
      const reach = id => { const c = SCALE[id], f = c.at(-1)[1]; return c.find(p => p[1] >= f - 1)[0]; };
      const ds = reach('ds'), astra = reach('astra'); console.assert(ds < 1 && astra > 5, 'scaling wording', ds, astra);
      const v = card('stack', 'FECI vs. budget per run',
        'Each run counts its latest valid submission at the budget.',
        PRE);
      fit(v, 'tts', 30); v.append(document.getElementById('ttsplot'), document.getElementById('ttslegend')); drawTTS();
    }""",
    # where to look: a sample of task illustrations
    '07-explore': """() => {
      const v = card('side', `Explore all ${TASKS.length} tasks`,
        'Each with its paper and every model’s runs.', '');
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
            ctx.add_init_script('window.CHART_H = {};')
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
