// FrontierCS 2 task page (_pages/fcs2-task.md). /task/#<slug> renders one task from fcs2-data.js, loaded first;
// /task/ with no slug lists every task by domain. For a task with runs: the description, the run count and pass count,
// the final score of every run against the authors' code, every run's development score against its cost, the task's
// FECI curve with each model's mean score at its FECI, and a table of the runs. assets/css/fcs2.css holds the styles.

const RANK = Object.fromEntries(RANKED.map((m, i) => [m.id, i]));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const figure = (id, head, right = '') => `<figure class="chart tchart"><div class="chead"><span>${head}</span><span class="r">${right}</span></div>
  <div class="plot" id="${id}plot"><svg id="${id}svg" role="img" aria-label="${esc(head)}"></svg><div class="tip" id="${id}tip" hidden></div></div>
  <div class="legend" id="${id}legend"></div><p class="cnote" id="${id}note"></p></figure>`;
let cur = null;   // the task on show and its runs

function drawPage() {
  const t = TASK_BY_SLUG[decodeURIComponent(location.hash.slice(1))];
  if (!t) return drawIndex();
  const runs = TRAJ.filter(r => r[1] === t.s).sort((a, b) => RANK[a[0]] - RANK[b[0]] || b[2] - a[2]);
  cur = {t, runs};
  document.title = `${t.name} · FrontierCS 2`;
  $('#crumbdom').innerHTML = `<span>/</span><span>${esc(t.d)}</span>`;
  $('#tmeta').innerHTML = `<span class="tag">${esc(t.d)}</span>`;
  $('#tname').textContent = t.name;
  $('#tpaper').textContent = t.t;
  $('#tlinks').innerHTML = (t.p ? `<a class="pill" href="${esc(t.p)}" target="_blank" rel="noopener">${t.t ? t.src : 'Project'}</a>` : '')
    + (t.r ? `<a class="pill" href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : '');
  const desc = DESC[t.s] ? `<p class="tdesc">${esc(DESC[t.s])}</p>` : '<p class="tdesc tbd">A description of this task will appear here.</p>';
  if (!runs.length) { $('#tbody').innerHTML = desc + '<p class="tbd">No runs on this task yet.</p>'; scrollTo(0, 0); return; }
  const ref = REF[t.s], pass = runs.filter(r => r[3]).length, models = new Set(runs.map(r => r[0]));
  $('#tbody').innerHTML = desc
    + `<dl class="tstats"><div><dt>Runs</dt><dd>${runs.length}</dd><span>by ${plural(models.size, 'model')}</span></div>`
    + `<div><dt>Passed</dt><dd>${pass} of ${runs.length}</dd><span>${Math.round(pass / runs.length * 100)}% of runs</span></div>`
    + `<div><dt>Best final score</dt><dd>${f1(Math.max(...runs.map(r => r[2])))}</dd><span>on the task’s own scale</span></div>`
    + (ref != null ? `<div><dt>Human baseline</dt><dd>${f1(ref)}</dd><span>the authors’ code, the bar to beat</span></div>` : '') + '</dl>'
    + (CHECKS[t.s] ? `<section class="tcrit"><h2 class="th2">Pass criteria</h2><p>A run passes only when its final submission beats the human baseline on <b>every</b> metric below, on every hidden workload. A higher total score alone is not a pass.</p>`
      + `<ul class="crit">${CHECKS[t.s].metrics.map(m => `<li>${esc(m.replace(/_/g, ' '))}</li>`).join('')}</ul>`
      + `<p class="tbd tthr">The threshold each metric must meet, relative to the human baseline, will appear here.</p>`   // placeholder until the task configs are in (owner, 2026-10-11)
      + `<p class="tbd tthr">The threshold each metric must meet, relative to the human baseline, will appear here.</p>`   // placeholder until the task configs are in (owner, 2026-10-11)
      + `<p class="tnote">The agent submits as often as it likes on the development workloads and picks one version for the hidden evaluation workloads. A wrong pick is not corrected: choosing what to submit is part of the task, so only the final submission counts.</p></section>` : '')
    + figure('fs', 'Final score by model', plural(runs.length, 'run'))
    + figure('dc', 'Development score against cost')
    + (TFIT[t.s] ? figure('fc', 'Expected score on this task, by FECI') : '')
    + `<h2 class="th2">Runs</h2><div class="res-scroll"><table class="res num" id="rtbl"></table></div>`;
  drawCharts();
  $('#rtbl').innerHTML = '<tr><th>Model</th><th>Final score</th><th>Passed</th><th>Scored <span class="full">development </span>submissions</th><th>Cost (US$<span class="full">, estimated</span>)</th><th>Hours</th></tr>'
    + runs.map(r => `<tr><td><span class="sq" style="background:${MCOL[r[0]]}"></span>${esc(MNAME[r[0]])}</td><td>${f1(r[2])}</td><td>${r[3] ? 'Yes' : 'No'}</td>`
      + `<td>${r[6].length}</td><td>${r[4].toFixed(2)}</td><td>${r[5].toFixed(1)}</td></tr>`).join('');
  scrollTo(0, 0);
}

function drawIndex() {
  cur = null;
  document.title = 'Tasks · FrontierCS 2';
  $('#crumbdom').innerHTML = ''; $('#tmeta').innerHTML = ''; $('#tlinks').innerHTML = '';
  $('#tname').textContent = 'Tasks';
  $('#tpaper').textContent = `${TASKS.length} tasks in ${DOMAINS.filter(d => N_IN(d)).length} domains. Select a task for its description and results.`;
  $('#tbody').innerHTML = DOMAINS.filter(d => N_IN(d)).map(d => `<section class="tgroup"><h2>${esc(d)}</h2><ul>`
    + TASKS.filter(t => t.d === d).map(t => `<li><a href="#${slug(t.s)}">${esc(t.name)}</a></li>`).join('')
    + '</ul></section>').join('');
}

function drawCharts() {
  if (!cur || !cur.runs.length) return;
  drawFinal(); drawDev(); if (TFIT[cur.t.s]) drawFit();
}

/* One bar per model, ranked by FECI: its best final score on this task, in its colour (owner, 2026-10-11: a model that
   ran the task more than once shows its best run). The human baseline, the authors' code, is a bar of its own on top, outlined
   (owner, 2026-10-11: bars, no passed / did-not-pass marks, no vertical line). */
function drawFinal() {
  const {t, runs} = cur, ref = REF[t.s], ms = RANKED.filter(m => runs.some(r => r[0] === m.id));
  const svg = $('#fssvg'), W = Math.max(300, $('#fsplot').clientWidth), narrow = W < 560, lane = 34, bh = 18;
  svg.replaceChildren();
  // on phones the name column fits the longest model name shown, so no name is cut
  const nw = narrow ? Math.max(...ms.map(m => { const q = sv('text', {class:'lab', x:-999, y:-999}, m.short); svg.append(q); return q.getComputedTextLength(); })) : 0;
  const rows = (ref != null ? 1 : 0) + ms.length;
  const L = narrow ? Math.max(118, Math.ceil(nw) + 24) : 168, R = narrow ? 64 : 120, T = 12, B = 40, H = T + rows * lane + B;
  const xmax = Math.max(100, ...runs.map(r => r[2])), X = v => L + v / xmax * (W - L - R);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= xmax + 1e-9; v += 25) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 18, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 4, 'text-anchor':'middle'}, 'Final score, on the task’s own scale'));
  const pts = [];
  if (ref != null) {
    const yc = T + lane / 2;
    svg.append(sv('text', {class:'lab', x:L - 12, y:yc + 4, 'text-anchor':'end'}, 'Human baseline'));
    svg.append(sv('rect', {class:'hbar', x:L + .75, y:yc - bh / 2 + .75, width:Math.max(1.5, X(ref) - L - 1.5), height:bh - 1.5, rx:2, fill:'#fff', stroke:'var(--ink)', 'stroke-width':1.5}));
    svg.append(sv('text', {class:'val', x:X(ref) + 8, y:yc + 4.5, fill:'var(--ink-2)'}, f1(ref)));
    pts.push({x:X(ref), y:yc, mean:true, html:`<b>Human baseline</b>, the authors’ code<br>Score <b>${f1(ref)}</b>`});
  }
  ms.forEach((m, i) => {
    const yc = T + (i + (ref != null ? 1 : 0)) * lane + lane / 2, rs = runs.filter(r => r[0] === m.id), sc = rs.map(r => r[2]), mu = Math.max(...sc), np = rs.filter(r => r[3]).length;
    svg.append(sv('text', {class:'lab', x:L - 12, y:yc + 4, 'text-anchor':'end'}, narrow ? m.short : m.name));
    svg.append(sv('rect', {class:'mbar', x:L, y:yc - bh / 2, width:Math.max(1.5, X(mu) - L), height:bh, rx:2, fill:MCOL[m.id], opacity:.88}));
    svg.append(sv('text', {class:'val', x:X(mu) + 8, y:yc + 4.5, fill:'var(--ink-2)'}, f1(mu)));
    pts.push({x:X(mu), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>Final score <b>${f1(mu)}</b>${rs.length > 1 ? `, best of ${rs.length} runs (${sc.map(f1).join(', ')})` : ''}<br>${np ? `Passed in ${np} of ${rs.length}` : 'Did not pass'}`});
  });
  attachTip(svg, W, H, pts, $('#fstip'));
  $('#fslegend').innerHTML = '';
  $('#fsnote').textContent = 'Each bar is a model’s best final score on this task. A run passes only when its final submission beats the human baseline on every metric of every hidden workload, so a bar longer than the human baseline’s is not always a pass.';
}

/* Every run's development score at each submission against its estimated spend so far, US$ on a log scale. */
function drawDev() {
  const {runs} = cur, rs = runs.filter(r => r[6].length);
  const svg = $('#dcsvg'), W = Math.max(300, $('#dcplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 280 : 340;
  const all = rs.flatMap(r => r[6]).filter(p => p[0] > 0);
  if (!all.length) { svg.replaceChildren(); $('#dcnote').textContent = 'No development submission was scored on this task.'; return; }
  const x0 = Math.floor(Math.log10(Math.min(...all.map(p => p[0]))) * 2) / 2, x1 = Math.max(x0 + 1, Math.ceil(Math.log10(Math.max(...all.map(p => p[0]))) * 2) / 2);
  const ymax = Math.max(100, Math.ceil(Math.max(...all.map(p => p[1])) / 20) * 20);
  const X = v => L + (Math.log10(Math.max(v, 10 ** x0)) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= ymax; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let k = Math.ceil(x0); k <= Math.floor(x1); k++) {
    svg.append(sv('line', {x1:X(10 ** k), x2:X(10 ** k), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(10 ** k), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(10 ** k)));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost so far in US$, log scale'));
  const pts = [];
  [...rs].reverse().forEach(r => {
    const seq = r[6].filter(p => p[0] > 0);
    svg.append(sv('path', {d:seq.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(''), fill:'none', stroke:MCOL[r[0]], 'stroke-width':1.6, 'stroke-linejoin':'round', opacity:.85}));
    const e = seq[seq.length - 1];
    if (e) svg.append(sv('circle', {cx:X(e[0]), cy:Y(e[1]), r:3.5, fill:MCOL[r[0]]}));
    seq.forEach((p, i) => pts.push({x:X(p[0]), y:Y(p[1]), html:`<b>${esc(MNAME[r[0]])}</b><br>Submission ${i + 1}: development score <b>${f1(p[1])}</b><br>${money(p[0])} spent`}));
  });
  attachTip(svg, W, H, pts, $('#dctip'));
  $('#dclegend').innerHTML = RANKED.filter(m => rs.some(r => r[0] === m.id)).map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');
  $('#dcnote').textContent = 'Development scores come from the task’s development workloads, which the agent sees while it works; a failed build or check scores 0. Costs are estimates from list prices.';
}

/* The task's curve from the FECI fit: the score a model of a given FECI is expected to reach. Dots: each model's mean final
   score on this task at the model's FECI, and the authors' code at Human = 60. */
function drawFit() {
  const {t, runs} = cur, [d, k] = TFIT[t.s], ref = REF[t.s];
  const svg = $('#fcsvg'), W = Math.max(300, $('#fcplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 280 : 320;
  const xmax = Math.max(100, Math.ceil(Math.max(...RANKED.map(m => ECI[m.id][0])) / 20) * 20);
  const X = v => L + v / xmax * (W - L - R), Y = v => T + (1 - v / 100) * (H - T - B), f = x => 100 / (1 + Math.exp(-k * (x - d)));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= 100; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let v = 0; v <= xmax; v += 20) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FECI'));
  const n = 120, path = Array.from({length:n + 1}, (_, i) => { const x = xmax * i / n; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`; }).join('');
  svg.append(sv('path', {d:path, fill:'none', stroke:'var(--ink-2)', 'stroke-width':2.5}));
  // the task's difficulty: where the curve crosses an expected score of 50
  if (d >= 0 && d <= xmax) {
    svg.append(sv('circle', {cx:X(d), cy:Y(50), r:4.5, fill:'#fff', stroke:'var(--ink-2)', 'stroke-width':2}));
    // above and left of its point, which is off a rising curve
    svg.append(sv('text', {class:'val halo', x:X(d) - 10, y:Y(50) - 12, 'text-anchor':'end', fill:'var(--ink-2)'}, `Difficulty ${f1(d)}`));
  }
  const pts = [];
  RANKED.filter(m => runs.some(r => r[0] === m.id)).forEach(m => {
    const sc = mean(runs.filter(r => r[0] === m.id).map(r => r[2])), x = ECI[m.id][0];
    svg.append(sv('circle', {cx:X(x), cy:Y(sc), r:6, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':1.5}));
    pts.push({x:X(x), y:Y(sc), html:`<b>${esc(m.name)}</b><br>FECI ${f1(x)}<br>Mean final score here <b>${f1(sc)}</b><br>Expected from the curve ${f1(f(x))}`});
  });
  if (ref != null) {
    svg.append(sv('rect', {x:X(ECI_HUMAN) - 5.5, y:Y(ref) - 5.5, width:11, height:11, fill:'var(--ink)', stroke:'#fff', 'stroke-width':1.5}));
    pts.push({x:X(ECI_HUMAN), y:Y(ref), html:`<b>Human baseline</b>, the authors’ code<br>Human = ${ECI_HUMAN} on the FECI scale<br>Score <b>${f1(ref)}</b>`});
  }
  attachTip(svg, W, H, pts, $('#fctip'));
  $('#fclegend').innerHTML = RANKED.filter(m => runs.some(r => r[0] === m.id)).map(m => `<span><i style="background:${MCOL[m.id]}; border-radius:50%"></i>${esc(m.name)}</span>`).join('')
    + (ref != null ? '<span><i style="background:var(--ink)"></i>Human baseline</span>' : '');
  $('#fcnote').textContent = `The line is the score a model is expected to reach on this task at each FECI, from the FECI fit; it crosses 50 at the task’s difficulty, ${f1(d)}. Each dot is a model’s mean final score here, placed at its FECI; the square is the human baseline, the authors’ code, at FECI ${ECI_HUMAN}.`;
}

addEventListener('hashchange', drawPage);
drawPage();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawCharts, 120); });
