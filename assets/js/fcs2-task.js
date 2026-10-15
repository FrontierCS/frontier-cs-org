// FrontierCS 2 task page (_pages/fcs2-task.md). /task/#<slug> renders one task from fcs2-data.js, loaded first;
// /task/ with no slug lists every task by domain. For a task with runs: what the agent must do and what it is scored on,
// a results table (pass or fail, final score against the Human reference, cost), the solution each shown model handed in,
// the pass criteria, every run's final score against its cost, and the task's FCI curve. assets/css/fcs2.css holds the styles.

const RANK = Object.fromEntries(RANKED.map((m, i) => [m.id, i]));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;   // the patch counts files
const figure = (id, head, right = '') => `<figure class="chart tchart"><div class="chead"><span>${head}</span><span class="r">${right}</span></div>
  <div class="plot" id="${id}plot"><svg id="${id}svg" role="img" aria-label="${esc(head)}"></svg><div class="tip" id="${id}tip" hidden></div></div>
  <div class="legend" id="${id}legend"></div><p class="cnote" id="${id}note"></p></figure>`;
let cur = null;   // the task on show and its runs

function drawPage() {
  const t = TASK_BY_SLUG[decodeURIComponent(location.hash.slice(1))];
  // no task named (or an unknown one): the list on the overview is the index (owner, design audit 11A)
  if (!t) { location.replace($('#tolist').href); return; }
  const runs = TRAJ.filter(r => r[1] === t.s).sort((a, b) => RANK[a[0]] - RANK[b[0]] || b[2] - a[2]);
  cur = {t, runs};
  document.title = `${t.name} · FrontierCS 2`;
  // the domain above the name, with its square in the map's colour, as in the task list; a back link replaces the breadcrumb
  $('#tmeta').innerHTML = `<span class="tdom" style="--a:${AINK[AREA_OF[t.d].k]}">${esc(t.d)}</span>`;
  $('#tname').textContent = t.name; $('#tcrumb').textContent = t.name; $('#tcsep').hidden = false;
  // the source as the task list gives it: venue in bold, then the title
  const v = VENUE[t.s], ttl = t.t || (v ? t.name : '');
  $('#tpaper').innerHTML = v && ttl ? `<b>${esc(v)}</b> · ${esc(ttl)}` : esc(v || ttl);
  $('#tlinks').innerHTML = (t.p ? `<a class="pill" href="${esc(t.p)}" target="_blank" rel="noopener">${t.t ? t.src : 'Project'}</a>` : '')
    + (t.r ? `<a class="pill" href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : '');
  // the top block: what the agent must do in one line (GOAL) under the name, the paper, what it is scored on (KEYM) and
  // the links; beside them the task's diagram, the agent's part marked in blue, fetched from
  // assets/img/fcs2-tasks/<slug>.svg and set inline so it takes the page's type (Qiuyang, 2026-10-14)
  const goal = GOAL[t.s], key = KEYM[t.s];
  $('#tgoal').textContent = goal || ''; $('#tgoal').hidden = !goal;
  // the task's FEDI and its rank, with a link to what FEDI is (owner, 2026-10-14); the address comes from a real link in the
  // markup, so it follows the site's base URL and the preview's relative links alike
  const fr = FRANK[t.s], fe = $('#tfedi');
  fe.innerHTML = fr ? `<span>FEDI</span><b>${f1(FEDI[t.s])}</b><span>the ${fr === Object.keys(FRANK).length ? 'easiest' : (fr === 1 ? '' : ordinal(fr) + ' ') + 'hardest'} of ${Object.keys(FRANK).length} tasks</span><a href="${esc($('#howlink').getAttribute('href'))}">What is FEDI?</a>` : '';
  $('#tkeys').innerHTML = key ? `<span class="lab">Scored on</span>${key.map(k => `<span class="k">${esc(k)}</span>`).join('')}` : '';
  $('#tfig').hidden = true; $('#tfig').innerHTML = ''; $('#thero').classList.add('nofig');
  // a rewritten description (three paragraphs split by ¶) sits under the top block, one column each: the idea, what the
  // agent writes, how it is judged; an older one stays folded (open when there is no goal line, as on Security tasks)
  const parts = NEWDESC(t.s) ? DESC[t.s].split(/\s*¶\s*/) : [];
  const lead = parts.length ? `<section class="tabout">${parts.map((p, i) => `<div><h3>${['The idea', 'What the agent writes', 'How it is judged'][i] || ''}</h3><p>${esc(p)}</p></div>`).join('')}</section>`
    : DESC[t.s] ? `<details class="fold tdet"${goal ? '' : ' open'}><summary><h3>Task details</h3></summary><p>${esc(DESC[t.s])}</p></details>` : '';
  if (!runs.length) { $('#tbody').innerHTML = lead + '<p class="tbd">No runs on this task yet.</p>'; loadFig(t); drawPager(t); scrollTo(0, 0); return; }
  const ref = REF[t.s], ms = new Set(runs.map(r => r[0])), np = new Set(runs.filter(r => r[3]).map(r => r[0])).size;
  const best = runs.reduce((a, r) => r[2] > a[2] ? r : a);
  const sum = [`<b>${np} of ${ms.size}</b> models pass`, `best final score <b>${f1(best[2])}</b>, by ${esc(MNAME[best[0]])}`]
    .concat(ref != null ? [`human reference <b>${f1(ref)}</b>`] : [], []);
  $('#tbody').innerHTML = lead
    + `<section class="tres"><h2 class="th2">Results</h2><p class="tsum">${sum.join(' · ')}</p>`
      + (CHECKS[t.s] ? '<p class="tnote">A run passes only if its final submission beats the human reference on every metric, on every hidden workload. Each metric column gives the run’s mean over its hidden workloads, in green when it beat the human reference on every one and in red otherwise.</p>' : '')
      + `<div class="res-scroll"><table class="res rtab${CHECKS[t.s] ? ' wm' : ''}" id="rtbl"></table></div></section>`   // results and pass criteria in one table (owner, 2026-10-15)
    + figure('sc', 'Final score against cost')
    + (TFIT[t.s] ? figure('fc', 'Expected score by FCI') : '')
    + solutionHTML(t, runs);   // the solution last (owner, 2026-10-14)
  drawResults(); drawCharts(); loadPatches(t); loadFig(t); drawPager(t);
  scrollTo(0, 0);
}
const NEWDESC = s => (DESC[s] || '').includes('¶');
function loadFig(t) {
  const box = $('#tfig'); if (!box) return;
  fetch(`${window.FIG_DIR || '/assets/img/fcs2-tasks/'}${slug(t.s)}.svg`).then(r => r.ok ? r.text() : '').then(svg => {
    if (svg && cur && cur.t === t && svg.trim().startsWith('<svg')) { box.innerHTML = svg; box.hidden = false; $('#thero').classList.remove('nofig');
      // the agent's part takes the task's domain colours, as the domain square beside its name does
      const k = AREA_OF[t.d].k; box.style.setProperty('--a', AINK[k]); box.style.setProperty('--af', AFILL[k]); } }).catch(() => {});
}
/* Previous and next task, in the task list's first order: hardest first (FEDI), then by domain and name
   (Qiuyang, 2026-10-14). A pager beside the breadcrumb, and the arrow keys. */
const ORDER = [...TASKS].sort((a, b) => (FRANK[a.s] ?? 1e9) - (FRANK[b.s] ?? 1e9)
  || DOMAINS.indexOf(a.d) - DOMAINS.indexOf(b.d) || a.name.localeCompare(b.name));
function drawPager(t) {
  const i = ORDER.indexOf(t), prev = ORDER[i - 1], next = ORDER[i + 1], href = x => `#${slug(x.s)}`;
  // two chevron buttons around the position (Qiuyang, 2026-10-14: icons over names); the names show on hover
  const chev = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`, L = chev('M10 3.5 5.5 8l4.5 4.5'), R = chev('M6 3.5l4.5 4.5L6 12.5');
  const btn = (x, cls, icon, word) => x ? `<a class="pbtn ${cls}" href="${href(x)}" title="${word}: ${esc(x.name)}" aria-label="${word} task: ${esc(x.name)}">${icon}</a>`
    : `<span class="pbtn ${cls} off" aria-hidden="true">${icon}</span>`;
  $('#tpager').innerHTML = btn(prev, 'prev', L, 'Previous') + `<span class="pos">${i + 1} / ${ORDER.length}</span>` + btn(next, 'next', R, 'Next');
  // no second pair at the foot (owner, design audit 2A: it repeated the pager with arrow characters); the arrow keys still page
}
addEventListener('keydown', e => {
  if (!cur || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
  const i = ORDER.indexOf(cur.t), to = e.key === 'ArrowLeft' ? ORDER[i - 1] : e.key === 'ArrowRight' ? ORDER[i + 1] : null;
  if (to) location.hash = slug(to.s);
});
const ordinal = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

/* One row per run, highest final score first (owner, 2026-10-14; ties keep leaderboard order), under the Human reference: pass or fail, the final score as a bar on the task's own scale, and the run's
   estimated cost; the Human reference (the authors' code; owner, 2026-10-14: that name everywhere) is a bar of its own on top, hatched grey (owners, 2026-10-11: bars, no vertical line;
   2026-10-14: grey hatching).
   This replaces the final-score chart and the runs table (Qiuyang, 2026-10-14: per model, readers want cost, score and
   pass or fail). */
// the verifier's metric identifiers in words (Qiuyang, 2026-10-14: identifiers are not for readers); an unknown one is spelled out
const METRIC = {"accuracy_qualified":"Estimate accuracy", "action_rate":"Action smoothness", "adaptive_probe_redirection_rate":"Redirection rate, adaptive probes", "adjusted_rand_index":"Adjusted Rand index", "auxiliary_bytes":"Extra memory", "average_episodic_reward":"Average episode reward", "average_jct_seconds":"Average job completion time", "avg_log2_prec_l2_abs_discrepancy_bits":"Mean precision error (bits)", "batch_latency_seconds":"Batch latency", "br_mis_pki":"Mispredictions per 1K instructions", "branch_accuracy":"Branch prediction accuracy", "build_ns":"Build time", "butterfly_count":"Exact butterfly count", "canary_integrity_accuracy":"Canary integrity accuracy", "candidates_verified":"Candidates verified", "case_throughput_ktps":"Throughput", "checkpoint_create_ns":"Checkpoint creation time", "checkpoint_restore_ns":"Checkpoint restore time", "client_storage_bytes":"Client storage", "clip_fdr":"Fréchet distance, CLIP", "committed_tps":"Committed transactions per second", "complete_workload_wall_seconds":"Wall time, whole workload", "compression_ratio":"Compression ratio", "congruence_seconds":"Congruence-closure time", "convnext_fdr":"Fréchet distance, ConvNeXt", "core_peak_live_bytes":"Peak memory", "correctness":"Correctness", "cost":"Cost", "counting_seconds":"Counting time", "cpu_time_seconds":"CPU time", "cyc_wp_pki":"Wrong-path cycles per 1K instructions", "dbscan_latency_ms":"Latency", "delta":"δ", "dinov2_fdr":"Fréchet distance, DINOv2", "distance_consistency":"Distance consistency", "duration_seconds":"Duration", "e2e_latency_seconds":"End-to-end latency", "effective_fpr":"False-positive rate", "egraph_node_growth":"E-graph growth", "elapsed_seconds":"Run time", "ema_quantized_png_psnr_db":"PSNR, EMA weights", "end_to_end_online_time_ms":"Online time, end to end", "energy":"Energy", "enforcement_seconds":"Enforcement time", "episode_reward":"Episode reward", "episode_success_rate":"Success rate", "epsilon":"ε", "estimator_seconds":"Estimator time", "evaluation_honesty_gap":"Evaluation honesty gap", "exact_counts":"Exact counts", "exact_result":"Exact result", "execution_time_ms":"Execution time", "gap":"Gap found", "historical_query_us":"Historical query latency", "im2col_discovery":"Finds im2col", "inception_fdr":"Fréchet distance, Inception", "inference_latency_ms":"Inference latency", "iso_recall":"Recall at matched cost", "label_mismatch_fraction":"Label mismatch", "labeled_inertia":"Inertia", "last_result_inner_product_ratio":"Inner-product ratio, last result", "latency_ms":"Latency", "latency_seconds":"Latency", "lloyd_loop_latency_ms":"Lloyd-iteration latency", "logical_storage_bits":"Predictor storage", "lookup_ns":"Lookup time", "lpips":"LPIPS", "mae_fdr":"Fréchet distance, MAE", "makespan_seconds":"Makespan", "mean_episode_max_reward":"Mean best reward per episode", "mean_predict_action_seconds":"Action prediction time", "mean_query_time":"Mean query time", "median_latency":"Median latency", "method_process_wall_seconds":"Wall time", "nn_recall":"Nearest-neighbour recall", "noise_mismatch_fraction":"Noise-point mismatch", "ocr_reward":"OCR reward", "online_communication_bytes":"Online communication", "oram_blocks_per_access":"ORAM blocks per access", "ordinary_quantized_png_psnr_db":"PSNR", "orth_err_normalized":"Orthogonality error", "overall_ratio":"Overall ratio", "peak_memory_mib":"Peak memory", "permitted_call_utility":"Utility on permitted calls", "polar_cosine_similarity":"Cosine similarity to the polar factor", "policy_enforcement_precision":"Enforcement precision", "policy_enforcement_recall":"Enforcement recall", "preprocessing_client_time_minutes":"Client preprocessing time", "procrustes_mse":"Procrustes error", "psnr":"PSNR", "psnr_db":"PSNR", "pssu_strength":"PSSU strength", "query_time_ms":"Query time", "r2_hz":"R², h from z", "r2_zh":"R², z from h", "recall":"Recall", "recall_at_50":"Recall@50", "refuted_pair":"Pairs refuted", "region_graph_ns":"Region-graph time", "relative_polar_factor_error":"Relative polar-factor error", "report_coverage":"Report coverage", "resident_bytes":"Memory", "residual_update_seconds":"Residual update time", "retained_bytes_per_checkpoint":"Memory per checkpoint", "retrieval_hit":"Retrieval hits", "rewrite_time_seconds":"Rewrite time", "rmse_error":"RMSE", "runtime_seconds":"Run time", "search_latency_ms":"Search latency", "selected_runtime_seconds":"Run time", "sequential_runtime_seconds":"Sequential run time", "server_compute_time_ns":"Server compute time", "siglip_fdr":"Fréchet distance, SigLIP", "sort_time_ns":"Sort time", "space_overhead_pct":"Space overhead", "spectral_polar_error":"Spectral polar error", "ssim":"SSIM", "static_probe_redirection_rate":"Redirection rate, static probes", "std_log2_prec_l2_abs_discrepancy_bits":"Spread of precision error (bits)", "success_rate":"Success rate", "tflops":"TFLOPS", "throughput_mflops":"Throughput", "throughput_ops_per_second":"Throughput", "top1_accuracy_pct":"Top-1 accuracy", "top_subspace_polar_error":"Top-subspace polar error", "trace_shape_match":"Trace-shape match", "tracking_ang_vel":"Angular-velocity tracking", "tracking_lin_vel":"Linear-velocity tracking", "training_latency_ms":"Training latency"};
const metric = m => METRIC[m] || m.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

/* Results and pass criteria in one table (owner, 2026-10-15). Rows: the Human reference, then every run by final score, each
   with its verdict (tick or cross); one column per metric, then its final score as a bar and its cost. Each metric: on how many hidden
   workloads the final submission beat the Human reference (PASSBY, bin/fcs2_checks_from_platform.py, the same runs as the
   scores) sets the colour of the run's mean (green on every workload, red otherwise), a dash for a run with no hidden evaluation. */
/* Each metric's mean (Qiuyang, 2026-10-15): METRIC_STATS (assets/js/fcs2-metrics.js, bin/fcs2_metric_means.py) gives
   per metric whether higher or lower is better, the human reference's mean (the median over the task's runs, as it is
   measured again in every run) and per model [the run's mean over its hidden workloads, the reference's mean in that
   run]. The header names the metric with its unit and says which way is better; a first row gives the human
   reference; each model cell is the run's mean, coloured by its count, with the count and the reference's mean in that
   run as its tooltip. */
const UNIT = {ms:'ms', seconds:'s', ns:'ns', us:'µs', minutes:'min', bytes:'bytes', mib:'MiB', pct:'%', db:'dB'};
const metricHead = (m, s) => { const label = metric(m), u = UNIT[(/_([a-z]+)$/.exec(m) || [])[1]] || (s && s.unit);   // the key's suffix, else the export's unit
  return u && !/\(.*\)\s*$/.test(label) ? `${label} (${u})` : label; };   // a label that already names its unit keeps it
// a mean: 3 significant digits with thousands separators; under 0.001 or from a million up, ×10 to a power in
// superscript digits, which also reads in a tooltip; a true minus sign throughout
const SUPD = {'-':'⁻', 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹'};
const num = v => { const r = +v.toPrecision(3), a = Math.abs(r);   // judged after rounding, so 999,999 is 1×10⁶
  if (a && (a < 1e-3 || a >= 1e6)) { const [mt, ex] = r.toExponential(2).split('e'); return `${String(+mt).replace('-', '−')}×10${String(+ex).replace(/[-\d]/g, c => SUPD[c])}`; }
  return r.toLocaleString('en-US', {maximumSignificantDigits:3}).replace('-', '−'); };

// pass and fail as a green tick and a red cross (Qiuyang, 2026-10-14), with the word for screen readers
const TICK = '<svg class="ri y" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.6l3.1 3.1 6.5-7.4"/></svg><span class="vh">Pass</span>';
const CROSS = '<svg class="ri n" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.3 4.3l7.4 7.4M11.7 4.3l-7.4 7.4"/></svg><span class="vh">Fail</span>';
function drawResults() {
  const {t, runs} = cur, ref = REF[t.s], xmax = Math.max(100, ref ?? 0, ...runs.map(r => r[2]));
  const ms = CHECKS[t.s] ? CHECKS[t.s].metrics : [], by = (typeof PASSBY === 'undefined' ? {} : PASSBY)[t.s] || {};
  const st = (typeof METRIC_STATS === 'undefined' ? {} : METRIC_STATS)[t.s] || {};
  // the score sits at the end of its bar (owner, 2026-10-14: beside the bar, not at the right edge of the column)
  const bar = (v, style) => { const w = (Math.max(0, v) / xmax * 100).toFixed(1);
    return `<span class="rb"><i style="width:${w}%;${style}"></i><span class="rn" style="left:${w}%">${f1(v)}</span></span>`; };
  const short = Object.fromEntries(RANKED.map(m => [m.id, m.short]));
  // an exactness check (it must equal the exact answer) has no better direction (Qiuyang, 2026-10-15)
  const dir = m => st[m] ? `<span class="dir">${st[m].exact ? 'Must be exact' : st[m].better === 'lower' ? 'Lower is better' : 'Higher is better'}</span>` : '';
  const mcls = () => 'mc';
  // a metric's cell: the run's mean, green when it beat the human reference on every hidden workload, red otherwise
  // (owner, 2026-10-15: values); under a red cell a thin bar gives the share of workloads it won, since a better mean can
  // still miss one (Qiuyang); a run without a mean shows its count; the count and the reference's mean in that run go to
  // the tooltip
  const cell = (r, m, i) => { const v = (by[r[0]] || {})[m], [mean, rref] = (st[m] && st[m].by[r[0]]) || [];
    if (!v) return `<td class="${mcls(i)} e">—</td>`;
    const tip = `Beat the human reference on ${v[0]} of ${v[1]} hidden workloads` + (rref != null ? `; human reference in this run: ${num(rref)}` : '');
    const all = v[0] === v[1], bar = all ? '' : `<span class="mbar"><i style="width:${(100 * v[0] / v[1]).toFixed(0)}%"></i></span>`;
    return `<td class="${mcls(i)} ${all ? 'cy' : 'cn'}" title="${tip}">` + (mean != null ? `<b>${num(mean)}</b>${bar}` : `<b>${v[0]}/${v[1]}</b>`) + '</td>'; };
  // the metrics first, then the final score and the cost (owner, 2026-10-15)
  $('#rtbl').innerHTML = '<thead><tr><th>Model</th>'
    + ms.map((m, i) => `<th class="${mcls(i)}" title="${esc(m)}">${esc(metricHead(m, st[m]))}${dir(m)}</th>`).join('') + '<th class="rs">Final score</th><th class="rc">Cost</th></tr></thead><tbody>'
    + (ref != null || ms.some(m => st[m] && st[m].ref != null)
      ? '<tr class="rref"><td><span class="sq"></span>Human reference</td>'
        + ms.map((m, i) => st[m] && st[m].ref != null ? `<td class="${mcls(i)}"><b>${num(st[m].ref)}</b></td>` : `<td class="${mcls(i)} e">—</td>`).join('')
        + `<td class="rs">${ref != null ? bar(ref, '') : ''}</td><td class="rc"></td></tr>` : '')
    + [...runs].sort((p, q) => q[2] - p[2]).map(r => `<tr><td>${r[3] ? TICK : CROSS}<span class="full">${esc(MNAME[r[0]])}</span><span class="short">${esc(short[r[0]])}</span></td>`
      + ms.map((m, i) => cell(r, m, i)).join('') + `<td class="rs">${bar(r[2], `background:${MCOL[r[0]]}`)}</td><td class="rc">$${r[4].toFixed(2)}</td></tr>`).join('')
    + '</tbody>';
}

function drawCharts() {
  if (!cur || !cur.runs.length) return;
  drawScore(); if (TFIT[cur.t.s]) drawFit();
}

/* Final score against cost (Qiuyang, 2026-10-14: in place of the development score against spend, drawn as the overview's
   pass rate chart): one dot per run, a model's one run on the task, its final score against its cost in US$ on a log
   scale. The runs no cheaper run matches or beats on final score have a larger dot and a bold name; labels sit beside the
   dots (labelDot, fcs2-data.js), and the Human reference is a dashed line named in the legend, not among the runs' names
   (Qiuyang, 2026-10-14). */
function drawScore() {
  const {t, runs} = cur, ref = REF[t.s], rs = runs.filter(r => r[4] > 0);
  const svg = $('#scsvg'), W = Math.max(300, $('#scplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 14, B = 46, H = narrow ? 320 : 400;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  if (!rs.length) { $('#scnote').textContent = 'No run on this task has a cost.'; return; }
  const tx = rs.map(r => r[4]);
  // as the overview: 0.15 decade past the outermost dots, more on the right on phones so the labels there fit
  const x0 = Math.log10(Math.min(...tx)) - .15, x1 = Math.log10(Math.max(...tx)) + (narrow ? .74 : .15);
  const ymax = Math.min(100, Math.ceil((Math.max(...rs.map(r => r[2]), ref != null ? ref : 0) + 5) / 20) * 20);
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  for (let v = 0; v <= ymax; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let k = Math.floor(x0); k <= Math.ceil(x1); k++) [1, 2, 5].forEach(f => { const v = f * 10 ** k, lv = Math.log10(v);
    // phones drop the 2s past a decade and a half, as the overview does, and the 5s past two and a half: one run's cost spans more
    if (lv < x0 - 1e-9 || lv > x1 + 1e-9 || (narrow && ((f === 2 && x1 - x0 > 1.5) || (f === 5 && x1 - x0 > 2.5)))) return;
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(v))); });
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost of the run in US$, log scale'));
  const at = r => [X(r[4]), Y(r[2])], order = [...rs].sort((a, b) => b[2] - a[2]);
  const boxes = order.map(r => { const [cx, cy] = at(r); return {x:cx - 9, y:cy - 9, w:18, h:18}; });
  // the Human reference: a dashed line, named in the legend; no run's name is written across it
  if (ref != null) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(ref), y2:Y(ref), stroke:'var(--ink-2)', 'stroke-width':1.2, 'stroke-dasharray':'4 4'}));
    boxes.push({x:L, y:Y(ref) - 2, w:W - R - L, h:4});
  }
  $('#sclegend').innerHTML = ref != null ? '<span><i class="dash"></i>Human reference</span>' : '';
  // the frontier: the runs no cheaper run matches or beats on final score
  const front = [...rs].sort((p, q) => p[4] - q[4] || q[2] - p[2]).filter((r, i, a) => a.slice(0, i).every(o => o[2] < r[2]));
  const pts = [];
  order.forEach(r => {
    const [cx, cy] = at(r), m = MODELS.find(x => x.id === r[0]), lead = front.includes(r);
    svg.append(sv('circle', {cx, cy, r:lead ? 7.5 : 5, fill:MCOL[r[0]], stroke:'#fff', 'stroke-width':2}));
    labelDot(svg, boxes, cx, cy, narrow ? m.short : m.name, {l:L, r:W, t:T, b:H - B}, MTXT(r[0]), lead);
    pts.push({x:cx, y:cy, mean:true, html:`<b>${esc(m.name)}</b><br>Final score <b>${f1(r[2])}</b>, ${r[3] ? 'passes' : 'does not pass'}<br>${money(r[4])}`});
  });
  attachTip(svg, W, H, pts, $('#sctip'));
}

/* The task's curve from the FCI fit: the score a model of a given FCI is expected to reach. Dots: each model's mean final
   score on this task at the model's FCI, and the Human reference at FCI ECI_HUMAN. */
function drawFit() {
  const {t, runs} = cur, [d, k] = TFIT[t.s], ref = REF[t.s];
  const svg = $('#fcsvg'), W = Math.max(300, $('#fcplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 280 : 320;
  // the axis holds 0 to 50, every model, and the task's FEDI with 10 to spare on each side (owner, 2026-10-14: a FEDI
  // of 57 or of -49 fell off the old 0 to 50 axis); grid every 10, every 20 past a span of 80
  const es = RANKED.map(m => ECI[m.id][0]), lo = Math.min(0, d - 10, ...es), hi = Math.max(50, d + 10, ...es), step = hi - lo > 80 ? 20 : 10;
  const xmin = Math.floor(lo / step) * step, xmax = Math.ceil(hi / step) * step;
  const X = v => L + (v - xmin) / (xmax - xmin) * (W - L - R), Y = v => T + (1 - v / 100) * (H - T - B), f = x => 100 / (1 + Math.exp(-k * (x - d)));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= 100; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let v = xmin; v <= xmax; v += step) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FCI'));
  const n = 120, path = Array.from({length:n + 1}, (_, i) => { const x = xmin + (xmax - xmin) * i / n; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`; }).join('');
  svg.append(sv('path', {d:path, fill:'none', stroke:'var(--ink-2)', 'stroke-width':2.5}));
  // the task's FEDI: where the curve crosses an expected score of 50
  // a dashed drop to the axis marks it there; the label sits above and left of the point, which is off a rising curve
  svg.append(sv('line', {x1:X(d), x2:X(d), y1:Y(50), y2:H - B, stroke:'var(--ink-2)', 'stroke-width':1, 'stroke-dasharray':'3 3', opacity:.7}));
  svg.append(sv('circle', {cx:X(d), cy:Y(50), r:4.5, fill:'#fff', stroke:'var(--ink-2)', 'stroke-width':2}));
  const left = X(d) - L > 90;   // near the left edge the label goes right of the point
  svg.append(sv('text', {class:'val halo', x:X(d) + (left ? -10 : 10), y:Y(50) - 12, 'text-anchor':left ? 'end' : 'start', fill:'var(--ink-2)'}, `FEDI ${f1(d)}`));
  const pts = [];
  RANKED.filter(m => runs.some(r => r[0] === m.id)).forEach(m => {
    const sc = mean(runs.filter(r => r[0] === m.id).map(r => r[2])), x = ECI[m.id][0];
    svg.append(sv('circle', {cx:X(x), cy:Y(sc), r:6, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':1.5}));
    pts.push({x:X(x), y:Y(sc), html:`<b>${esc(m.name)}</b><br>FCI ${f1(x)}<br>Mean final score here <b>${f1(sc)}</b><br>Expected from the curve ${f1(f(x))}`});
  });
  if (ref != null) {
    svg.append(sv('rect', {x:X(ECI_HUMAN) - 5.5, y:Y(ref) - 5.5, width:11, height:11, fill:'var(--ink)', stroke:'#fff', 'stroke-width':1.5}));
    pts.push({x:X(ECI_HUMAN), y:Y(ref), html:`<b>Human reference</b><br>FCI ${ECI_HUMAN} by definition<br>Score <b>${f1(ref)}</b>`});
  }
  attachTip(svg, W, H, pts, $('#fctip'));
  $('#fclegend').innerHTML = RANKED.filter(m => runs.some(r => r[0] === m.id)).map(m => `<span><i style="background:${MCOL[m.id]}; border-radius:50%"></i>${esc(m.name)}</span>`).join('')
    + (ref != null ? '<span><i style="background:var(--ink)"></i>Human reference</span>' : '');
  $('#fcnote').textContent = `The curve is the score expected at each FCI, from the fit. Dots are the models’ final scores here at their FCI.`;
}

/* The solution in words (SOLUTION, assets/js/fcs2-solutions.js; owner, 2026-10-14: no code, the idea): which model,
   whether it passed and its final score, then its steps, laid out as the reasons under How FCI works on the overview. */
function solutionHTML(t, runs) {
  const so = typeof SOLUTION === 'undefined' ? null : SOLUTION[t.s], r = so && runs.find(x => x[0] === so.m);
  if (!so || !r) return '';
  return `<section class="tsol"><h2 class="th2">Solution</h2><p class="tsum"><span class="sq" style="background:${MCOL[so.m]}"></span>`
    + `<b>${esc(MNAME[so.m])}</b> · ${r[3] ? 'passes' : 'does not pass'} · final score <b>${f1(r[2])}</b></p>`
    + `<ol class="how-why tsteps">${so.steps.map(([h, x], i) => `<li><b><span>${i + 1}</span>${esc(h)}</b>${esc(x)}</li>`).join('')}</ol></section>`;
}

/* ---------- the patch ----------
   The patch each model handed in, from assets/patches/<slug>.json (bin/fcs2_patches_from_platform.py), fetched when the
   task is opened, folded under the solution in words (Qiuyang, 2026-10-14: the patch stays on the page, folded). A
   task with no words gets a Solution section of its own, the model line and the folded patch. One chip per model when
   the file holds more than one; for now it holds Claude Opus 5.5 alone. A task with no file (Security) shows neither. */
const PATCHES = {};
function loadPatches(t) {
  const s = slug(t.s), show = d => { if (cur && cur.t === t) drawPatches(d); };
  if (PATCHES[s]) return show(PATCHES[s]);
  fetch(`${window.PATCH_DIR || '/assets/patches/'}${s}.json`).then(r => r.ok ? r.json() : null).then(d => { if (d) { PATCHES[s] = d; show(d); } }).catch(() => {});
}
// a patch without git's own header (a plain unified diff) gets one per file, so it shows its file names too
const withHeads = t => t.includes('diff --git ') ? t : t.replace(/^--- (?:a\/)?(.+)\n\+\+\+ (?:b\/)?(.+)$/gm, (m, a, b) => `diff --git a/${b} b/${b}\n${m}`);
// a line longer than LONG characters (one-line JSON answers) shows its start and how much follows
const LONG = 600, cut = l => l.length > LONG ? `${esc(l.slice(0, LONG))}<i class="dmore"> … ${(l.length - LONG).toLocaleString('en-US')} more characters</i>` : esc(l);
const lines = n => `<b>${n}</b> ${n === 1 ? 'line' : 'lines'}`;

/* The patch as Claude Code shows an edit (Qiuyang, 2026-10-14: concise and strong, in Claude Code's design): for each file
   "Update(path)", or "Write(path)" for a new one, an elbow line with its counts, then numbered rows, the old line's number
   on a removal and the new one's otherwise, "…" between hunks, and Claude Code's light-theme colours. Within a removed
   line and the added line that replaces it, the changed words are marked, unless most of the line changed. A file longer
   each file folds on its own, its two head lines as the fold's summary, open when it is the patch's only file (Qiuyang,
   2026-10-14); an open file's rows scroll in a box as the task list on the overview does: its drawn rail, the foot
   fading until the end, no frame. */
function parsePatch(text) {
  const files = []; let f = null, o = 0, n = 0, inHunk = false;
  for (const l of withHeads(text).split('\n')) {
    if (l.startsWith('diff --git ')) { f = {path: l.replace(/^diff --git a\/.*? b\//, ''), kind: 'Update', rows: [], add: 0, del: 0}; files.push(f); inHunk = false; continue; }
    if (!f) continue;
    const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { if (f.rows.length) f.rows.push({t: 'g'}); o = +h[1]; n = +h[2]; inHunk = true; continue; }
    if (!inHunk) {   // the file's header lines
      if (l.startsWith('new file mode') || l === '--- /dev/null') f.kind = 'Write';
      else if (l.startsWith('deleted file mode') || l === '+++ /dev/null') f.kind = 'Delete';
      else if (l.startsWith('Binary files') || l.startsWith('GIT binary patch')) f.binary = true;
      continue;
    }
    if (l[0] === '+') { f.rows.push({t: 'a', n: n++, s: l.slice(1)}); f.add++; }
    else if (l[0] === '-') { f.rows.push({t: 'd', n: o++, s: l.slice(1)}); f.del++; }
    else if (l[0] === ' ') { f.rows.push({t: 'c', n: n++, s: l.slice(1)}); o++; }
  }
  files.forEach(f => f.rows.forEach((r, i) => {   // a run of removals, then the additions that replace them, line for line
    if (r.t !== 'd' || (f.rows[i - 1] || {}).t === 'd') return;
    let j = i; while (f.rows[j] && f.rows[j].t === 'd') j++;
    for (let k = 0; k < j - i && f.rows[j + k] && f.rows[j + k].t === 'a'; k++) marks(f.rows[i + k], f.rows[j + k]);
  }));
  return files;
}
const toks = s => s.match(/\s+|\w+|[^\s\w]/g) || [];
function marks(d, a) {
  if (d.s.length > LONG || a.s.length > LONG) return;
  const x = toks(d.s), y = toks(a.s); let i = 0, j = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  while (j < x.length - i && j < y.length - i && x[x.length - 1 - j] === y[y.length - 1 - j]) j++;
  const mx = x.slice(i, x.length - j).join(''), my = y.slice(i, y.length - j).join('');
  if (mx.length + my.length > .4 * (d.s.length + a.s.length)) return;   // mostly rewritten: no marks, as Claude Code does
  const wrap = (t, m) => esc(t.slice(0, i).join('')) + (m ? `<mark>${esc(m)}</mark>` : '') + esc(t.slice(t.length - j).join(''));
  d.h = wrap(x, mx); a.h = wrap(y, my);
}
function fileHTML(f, i, all) {
  const w = f.kind === 'Write';
  const sum = f.binary ? 'Binary file' : w ? `Wrote ${lines(f.add)}` : f.kind === 'Delete' ? `Removed ${lines(f.del)}`
    : [f.add ? `Added ${lines(f.add)}` : '', f.del ? `${f.add ? 'removed' : 'Removed'} ${lines(f.del)}` : ''].filter(Boolean).join(', ');
  const nw = String(Math.max(1, ...f.rows.map(r => r.n || 0))).length;
  const rows = f.rows.map(r => r.t === 'g' ? '<div class="r g"><span class="n"></span><span class="s"></span><span class="c">…</span></div>'
    : `<div class="r ${r.t}"><span class="n">${r.n}</span><span class="s">${r.t === 'a' ? '+' : r.t === 'd' ? '-' : ''}</span>`
      + `<span class="c">${r.h != null ? r.h : cut(r.s)}</span></div>`).join('');
  const head = `<span class="cct"><b>${f.kind}</b>(${esc(f.path)})</span><span class="ccs">${sum}</span>`;
  if (!f.rows.length) return `<div class="ccf"><span class="cch">${head}</span></div>`;   // nothing to unfold: a binary file
  return `<details class="fold ccf"${all.length === 1 ? ' open' : ''}><summary><span class="cch">${head}</span></summary>`
    + `<div class="ccwrap"><div class="ccbox" tabindex="0"><div class="ccd" style="--nw:${nw + 2}ch">${rows}</div></div>`
    + '<div class="rail" hidden><i></i></div></div></details>';
}
// a box that scrolls with the overview's drawn rail (fcs2.js, the task list): the thumb's height is the visible share, its
// top the share scrolled; dragging it scrolls in step, a press on the rail centres the thumb there first; the foot fades
// until the end. Returns the function that redraws it, for a scroll, an opened fold or a resize.
let patchEnd = () => {};
function railed(box, rail) {
  const th = rail.firstElementChild;
  const at = () => { box.classList.toggle('at-end', box.scrollTop + box.clientHeight >= box.scrollHeight - 2);
    const over = box.scrollHeight > box.clientHeight + 1; rail.hidden = !over;
    if (over) { const h = Math.max(36, box.clientHeight * box.clientHeight / box.scrollHeight); th.style.height = `${h}px`;
      th.style.top = `${(box.clientHeight - h) * box.scrollTop / (box.scrollHeight - box.clientHeight)}px`; } };
  box.addEventListener('scroll', at, {passive:true});
  rail.addEventListener('pointerdown', e => { const r = rail.getBoundingClientRect(), span = box.clientHeight - th.offsetHeight;
    const per = (box.scrollHeight - box.clientHeight) / (span || 1);
    if (e.target !== th) box.scrollTop = (e.clientY - r.top - th.offsetHeight / 2) * per;
    const y0 = e.clientY, s0 = box.scrollTop; rail.classList.add('drag'); rail.setPointerCapture(e.pointerId); e.preventDefault();
    const move = ev => { box.scrollTop = s0 + (ev.clientY - y0) * per; };
    const up = () => { rail.classList.remove('drag'); rail.removeEventListener('pointermove', move); rail.removeEventListener('pointerup', up); rail.removeEventListener('pointercancel', up); };
    rail.addEventListener('pointermove', move); rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up); });
  return at;
}
const counts = p => `${plural(p.files.length || parsePatch(p.patch).length, 'file')} changed, <b class="a">+${p.add}</b> <b class="d">−${p.del}</b>`;
function drawPatches(d) {
  const ms = RANKED.filter(m => d.runs[m.id]);
  if (!ms.length) return;
  const passed = m => d.runs[m.id].verdict === 'PASS', has = m => d.runs[m.id].patch != null, one = ms.length === 1;
  let sec = $('#tbody .tsol');
  if (!sec) {   // no words for this task: the section holds the model line, as the words' section does, and the patch
    const m = ms[0], p = d.runs[m.id];
    $('#tbody').insertAdjacentHTML('beforeend', `<section class="tsol"><h2 class="th2">Solution</h2>` + (one
      ? `<p class="tsum"><span class="sq" style="background:${MCOL[m.id]}"></span><b>${esc(m.name)}</b> · ${passed(m) ? 'passes' : 'does not pass'}`
        + (p.score != null ? ` · final score <b>${f1(p.score)}</b>` : '') + '</p>' : '') + '</section>');
    sec = $('#tbody .tsol');
  }
  sec.querySelectorAll('.pfold').forEach(x => x.remove());
  // folded: the summary names whose patch it is when the words above are another model's, and its size
  const words = typeof SOLUTION !== 'undefined' && SOLUTION[cur.t.s], m0 = ms[0], p0 = d.runs[m0.id];
  const who = one && words && words.m !== m0.id ? `${esc(m0.name)}’s patch` : one ? 'The patch' : 'The patches';
  sec.insertAdjacentHTML('beforeend', `<details class="fold pfold"><summary><h3>${who}</h3>`
    + (one && has(m0) ? `<span class="pd">${counts(p0)}</span>` : '') + '</summary>'
    + `<div class="pchips" id="pchips"${one ? ' hidden' : ''}></div><div class="pmeta" id="pmeta"></div><div class="cc" id="pview"></div></details>`);
  sec.querySelector('.pfold').addEventListener('toggle', () => patchEnd());
  if (!one) $('#pchips').innerHTML = ms.map(m => { const p = d.runs[m.id];
    return `<button type="button" class="pchip" data-m="${m.id}" aria-pressed="false"><i style="background:${MCOL[m.id]}"></i><span>${esc(m.name)}</span>`
      + `<span class="pv ${passed(m) ? 'y' : 'n'}">${passed(m) ? 'Pass' : 'Fail'}</span>`
      + (has(m) ? `<span class="pd"><b class="a">+${p.add}</b> <b class="d">−${p.del}</b></span>` : '<span class="pd">no solution</span>') + '</button>'; }).join('');
  const pick = id => {
    const m = ms.find(x => x.id === id), p = d.runs[id];
    $('#pchips').querySelectorAll('.pchip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === id)));
    if (!has(m)) { $('#pmeta').innerHTML = ''; $('#pview').innerHTML = `<p class="pempty">${esc(m.name)} handed in no solution on this task (${esc(p.missing || 'none')}).</p>`; return; }
    $('#pmeta').innerHTML = one ? '' : `<b>${esc(m.name)}</b> · ${esc(p.submission)} · ${counts(p)}`;
    $('#pview').innerHTML = parsePatch(p.patch).map(fileHTML).join('')
      + (p.truncated ? `<p class="ccn">The first ${Math.round(p.patch.length / 1000)} kB of ${Math.round(p.bytes / 1000)} kB</p>` : '');
    // each file's box gets its rail, redrawn when the file or the whole patch opens, and on a resize
    const ends = [...$('#pview').querySelectorAll('details.ccf')].map(d => { const at = railed(d.querySelector('.ccbox'), d.querySelector('.rail'));
      d.addEventListener('toggle', at); return at; });
    patchEnd = () => ends.forEach(at => at()); patchEnd();
  };
  $('#pchips').onclick = e => { const b = e.target.closest('.pchip'); if (b) pick(b.dataset.m); };
  pick((ms.find(m => passed(m) && has(m)) || ms.find(has) || ms[0]).id);
}

addEventListener('hashchange', drawPage);
drawPage();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawCharts(); patchEnd(); }, 120); });
