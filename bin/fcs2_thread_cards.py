#!/usr/bin/env python3
"""Draw a thread of post cards for X in the share card's style (bin/fcs2_card.py): white, the FrontierCS brand top left,
the address top right, a headline and one line of context, one visual. 16:9, 960 x 540 CSS px saved at 1600 x 900.

One card per chart worth sharing from the site and the paper; no flowcharts, tables or single-task case studies (owner,
2026-10-10). Charts are drawn inside the built overview by the page's own code (assets/js/fcs2.js), so colours and label
placement match the site, and every number in a headline is computed from the page's data (fcs2-data.js) when the card is
drawn; console.assert stops the run if the data no longer support a headline's wording.
usage (vis node, Playwright):  python bin/fcs2_thread_cards.py [built _site dir] [output dir]
"""
import pathlib
import socket
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

SITE = sys.argv[1] if len(sys.argv) > 1 else '/scratch/gpfs/KARTHIKN/wc9403/tmp/fcsite/_site'
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else '/scratch/gpfs/KARTHIKN/wc9403/tmp/fcsite/thread')
OUT.mkdir(parents=True, exist_ok=True)
CW, CH = 960, 540


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
.tcard #ecisvg text[style*="12px"], .tcard #lbsvg text[style*="12px"]{display:none}
.tcard .tip{display:none}
.tcard .legend{font-size:14px; margin-top:6px}
.tcard .papers{height:100%; width:100%}
.tcard .pcol{animation-play-state:paused !important}
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
window.PRE = 'Preliminary results from the FrontierCS 2 preview';
"""

OVERVIEW = {
    # what it is: the name over the task map, drawn by the overview's drawMap()
    '01-cover': """() => {
      const v = card('stack', '', '', '');
      v.parentElement.querySelector('.tc-hd').innerHTML = `<div style="font-size:54px; font-weight:600; letter-spacing:-.02em; line-height:1">FrontierCS 2</div>
        <p class="tc-sub" style="margin-top:12px; font-size:19px">Can an AI agent do computer-science research? ${TASKS.length} tasks, each judged against its authors’ own code.</p>`;
      v.append(document.getElementById('map')); document.getElementById('map').style.width = '864px'; drawMap();
    }""",
    # where tasks come from: the wall of paper first pages
    '02-papers': """() => {
      const v = card('side', 'Rebuild the paper. Beat its authors.',
        'Most tasks delete a published paper’s contribution from its own repository. The agent writes it back; the authors’ code is the bar.', '');
      v.append(document.getElementById('papers')); drawPapers();
    }""",
    # one real run's best development score over its spend, on its task's illustration (the task map's hover card)
    '03-run': """() => {
      const best = r => { let m = -1; return r[6].map(q => (m = Math.max(m, q[1]))); };
      const steps = r => new Set(best(r)).size, gain = r => best(r).at(-1) - best(r)[0];
      const runs = TRAJ.filter(r => r[6].length >= 8 && steps(r) >= 6 && r[3] === 1).sort((a, b) => gain(b) - gain(a));
      console.assert(runs.length, 'no rising run');
      const [m, t, , , end, , seq] = runs[0], k = AREA_OF[TASKS.find(q => q.s === t).d].k;
      const v = card('side', 'Research is a loop, not a single shot',
        `The agent submits whenever it likes, measures, and tries again. Here: ${MNAME[m]} on ${esc(t)}, ${seq.length} submissions.`, '');
      const W = 470, H = 340, PL = 30, PR = 30, PT = 56, PB = 52, x0 = seq[0][0], x1 = Math.max(end, ...seq.map(q => q[0]));
      const X = u => PL + (u - x0) / (x1 - x0 || 1) * (W - PL - PR), Y = s => PT + (1 - s / 100) * (H - PT - PB);
      let b = -1, d = ''; seq.forEach(([u, s], i) => { b = Math.max(b, s); d += i ? `H${X(u).toFixed(1)}V${Y(b).toFixed(1)}` : `M${X(u).toFixed(1)},${Y(b).toFixed(1)}`; }); d += `H${X(x1).toFixed(1)}`;
      v.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block"><defs><clipPath id="rc"><rect width="${W}" height="${H}" rx="12"/></clipPath></defs>
        <g clip-path="url(#rc)">${taskArt(t, k).replace('<svg class="art"', `<svg width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"`)}
        <rect width="${W}" height="${H}" fill="${ART_FIELD[k]}" opacity=".7"/></g>
        <path d="${d}" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(x1)}" cy="${Y(b)}" r="7.5" fill="#fff"/>
        <text x="20" y="34" fill="#fff" font-size="19" font-weight="600" font-family="Hanken Grotesk">${esc(t)}</text>
        <text x="${W - 20}" y="${H - 20}" fill="#fff" font-size="16" font-weight="600" text-anchor="end" font-family="Hanken Grotesk">${esc(MNAME[m])}</text></svg>
        <div class="tc-cap">Best development score so far, one step each time a submission beats it, over the run’s spend in US$.</div>`;
    }""",
    # pass rate against cost: the overview's chart
    '04-pass-cost': """() => {
      const top = RANKED.reduce((a, b) => PASS[a.id][0] >= PASS[b.id][0] ? a : b), ratio = COST.ds[0] / COST.sol[0];
      console.assert(top.id === 'astra' && Math.abs(PASS.ds[0] - PASS.sol[0]) < 1 && ratio > .15 && ratio < .25, 'pass/cost wording');
      const v = card('stack', 'Spending more doesn’t buy a pass',
        `DeepSeek V4.1 Flash passes as often as GPT-6.1 Sol (${Math.round(PASS.ds[0])}%) at a fifth of the cost. GPT-6 Astra leads at ${Math.round(PASS.astra[0])}%.`,
        `${PRE} · a run passes when its final submission meets the task’s criteria on every hidden workload · cost from tokens and list prices`);
      fit(v, 'pc'); v.append(document.getElementById('pcplot')); drawPassCost();
    }""",
    # a pass needs every workload: share of the runs that beat the authors' code on the overall score yet do not pass
    '05-every-workload': """() => {
      const beat = RUNS.filter(r => REF[r.t] > 0 && r.s > REF[r.t]), miss = beat.filter(r => !r.p), pct = Math.round(miss.length / beat.length * 100);
      const v = card('side', 'Better on average is not good enough',
        `A pass means beating the authors’ code on every workload. ${pct} of every 100 runs that win on the overall score still miss one.`, PRE);
      let sq = ''; for (let i = 0; i < 100; i++) { const x = (i % 10) * 30, y = Math.floor(i / 10) * 30;
        sq += `<rect x="${x}" y="${y}" width="26" height="26" rx="4" fill="${i < 100 - pct ? '#0b57d0' : '#f6aea9'}"/>`; }
      v.style.display = 'flex'; v.style.flexDirection = 'column'; v.style.justifyContent = 'center'; v.style.alignItems = 'flex-start';
      v.innerHTML = `<svg viewBox="0 0 296 296" width="296" height="296" style="display:block">${sq}</svg>
        <div class="legend" style="display:flex; gap:22px; margin-top:16px; font-size:15px"><span><i style="display:inline-block; width:12px; height:12px; border-radius:3px; background:#0b57d0; margin-right:7px"></i>Passed</span>
        <span><i style="display:inline-block; width:12px; height:12px; border-radius:3px; background:#f6aea9; margin-right:7px"></i>Fell short on a workload</span></div>`;
    }""",
    # mean final score: the overview's chart, grouped by model
    '06-mean-score': """() => {
      const sc = m => RUNS.filter(r => r.m === m.id).map(r => r.s), mu = m => mean(sc(m)), top = [...MODELS].sort((a, b) => mu(b) - mu(a));
      const hi = Math.floor(Math.min(...MODELS.map(m => Math.max(...sc(m))))), lo = Math.ceil(Math.max(...MODELS.map(m => Math.min(...sc(m)))));
      console.assert(hi >= 95 && lo <= 10, 'mean-score wording', hi, lo);
      const v = card('stack', 'The run matters more than the model',
        `Every model has a run above ${hi} and one below ${lo}, yet the means differ by only ${(mu(top[0]) - mu(top.at(-1))).toFixed(0)} points (${mu(top.at(-1)).toFixed(1)}–${mu(top[0]).toFixed(1)}). One dot per run; the large dot is the mean.`,
        `${PRE} · scores on each task’s own 0–100 scale; a run that times out scores 0`);
      CHART_H.lbLane = Math.floor((v.clientHeight - 54) / MODELS.length); v.append(document.getElementById('lbplot')); drawLB();
    }""",
    # FECI: the overview's chart; the headline names the models whose whole 90% interval is above Human
    '07-feci': """() => {
      const above = RANKED.filter(m => ECI[m.id][1] > ECI_HUMAN).map(m => m.name);
      console.assert(above.length === 2, 'FECI wording', above);
      const v = card('stack', 'Only two models clear the authors’ bar',
        `On FECI the authors’ code sits at ${ECI_HUMAN}. ${above.join(' and ')} are the only models whose 90% interval lies entirely above it.`,
        `${PRE} · FECI, the FrontierCS Epoch Capabilities Index, fitted with Epoch AI’s ECI code · bars are 90% intervals`);
      CHART_H.eciLane = Math.floor((v.clientHeight - 60) / MODELS.length); v.append(document.getElementById('eciplot')); drawECI();
    }""",
    # test-time scaling: the overview's chart; budgets where two models come within 1 point of their final FECI
    '08-scaling': """() => {
      const reach = id => { const c = SCALE[id], f = c.at(-1)[1]; return c.find(p => p[1] >= f - 1)[0]; };
      const ds = reach('ds'), astra = reach('astra'); console.assert(ds < 1 && astra > 5, 'scaling wording', ds, astra);
      const v = card('stack', 'Cheap models plateau early. GPT-6 Astra keeps climbing.',
        `FECI at each budget per run: DeepSeek V4.1 Flash is within a point of its final score by ${usdfmt(ds)}; GPT-6 Astra keeps improving until about ${usdfmt(astra)}.`,
        `${PRE} · development scores calibrated to the hidden suite · bands are 90% intervals`);
      fit(v, 'tts', 30); v.append(document.getElementById('ttsplot'), document.getElementById('ttslegend')); drawTTS();
    }""",
    # where to look: a sample of task illustrations
    '09-explore': """() => {
      const v = card('side', `${TASKS.length} tasks. Pick one.`,
        'Each has its own page: the paper, the description, and every model’s runs and scores.', '');
      const pick = AREAS.flatMap(a => TASKS.filter(t => a.d.includes(t.d)).slice(0, 2).map(t => [t, a.k])).slice(0, 12);
      const cols = 3, gw = 470, gap = 6, tw = (gw - gap * (cols - 1)) / cols, th = tw / 1.5;
      v.style.display = 'grid'; v.style.gridTemplateColumns = `repeat(${cols}, ${tw}px)`; v.style.gap = `${gap}px`; v.style.alignContent = 'center';
      v.innerHTML = pick.map(([t, k]) => `<div style="position:relative; width:${tw}px; height:${th}px; border-radius:8px; overflow:hidden">${taskArt(t.s, k).replace('<svg class="art"', `<svg width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice"`)}
        <span style="position:absolute; left:6px; top:6px; background:#fff; color:${AINK[k]}; border-radius:99px; padding:2px 8px; font-size:11.5px; font-weight:600; max-width:${tw - 24}px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${esc(t.s)}</span></div>`).join('');
    }""",
}

s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '-d', SITE, '-b', '127.0.0.1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
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
            pg.evaluate(js); pg.wait_for_timeout(700)
            assert not errs and not logs, (name, errs, logs)
            pg.locator('.tcard').screenshot(path=str(OUT / f'{name}.png'))
            print(name, 'ok')
            ctx.close()
        b.close()
finally:
    srv.kill()
print('cards in', OUT)
