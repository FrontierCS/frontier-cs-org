// FrontierCS 2 task page (_pages/fcs2-task.md). /task/#<slug> renders one task from fcs2-data.js, loaded first;
// /task/ with no slug lists every task by domain. For a task with runs: what the agent must do and what it is scored on,
// a results table (pass or fail, final score against the Human reference, cost), the solution each shown model handed in,
// the pass criteria, every run's development score against its spend, and the task's FECI curve. assets/css/fcs2.css holds the styles.

const RANK = Object.fromEntries(RANKED.map((m, i) => [m.id, i]));
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
  // the domain above the name, with its square in the map's colour, as in the task list; a back link replaces the breadcrumb
  $('#tmeta').innerHTML = `<span class="tdom" style="--a:${AINK[AREA_OF[t.d].k]}">${esc(t.d)}</span>`;
  $('#tname').textContent = t.name; $('#tcrumb').textContent = t.name; $('#tcsep').hidden = false;
  // the source as the task list gives it: venue in bold, then the title
  const v = VENUE[t.s], ttl = t.t || (v ? t.name : '');
  $('#tpaper').innerHTML = v && ttl ? `<b>${esc(v)}</b> · ${esc(ttl)}` : esc(v || ttl);
  $('#tlinks').innerHTML = (t.p ? `<a class="pill" href="${esc(t.p)}" target="_blank" rel="noopener">${t.t ? t.src : 'Project'}</a>` : '')
    + (t.r ? `<a class="pill" href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : '');
  // the top block: what the agent must do in one line (GOAL) under the name, the paper, what it is scored on (KEYM) and
  // the links; beside them the problem's diagram, the agent's part marked in blue, fetched from
  // assets/img/fcs2-tasks/<slug>.svg and set inline so it takes the page's type (Qiuyang, 2026-10-14)
  const goal = GOAL[t.s], key = KEYM[t.s];
  $('#tgoal').textContent = goal || ''; $('#tgoal').hidden = !goal;
  // the problem's FEDI and its rank, with a link to what FEDI is (owner, 2026-10-14); the address comes from a real link in the
  // markup, so it follows the site's base URL and the preview's relative links alike
  const fr = FRANK[t.s], fe = $('#tfedi');
  fe.innerHTML = fr ? `<span>FEDI</span><b>${f1(FEDI[t.s])}</b><span>the ${fr === Object.keys(FRANK).length ? 'easiest' : (fr === 1 ? '' : ordinal(fr) + ' ') + 'hardest'} of ${Object.keys(FRANK).length} problems</span><a href="${esc($('#howlink').getAttribute('href'))}">What is FEDI?</a>` : '';
  $('#tkeys').innerHTML = key ? `<span class="lab">Scored on</span>${key.map(k => `<span class="k">${esc(k)}</span>`).join('')}` : '';
  $('#tfig').hidden = true; $('#tfig').innerHTML = ''; $('#thero').classList.add('nofig');
  // a rewritten description (three paragraphs split by ¶) sits under the top block, one column each: the idea, what the
  // agent writes, how it is judged; an older one stays folded (open when there is no goal line, as on Security problems)
  const parts = NEWDESC(t.s) ? DESC[t.s].split(/\s*¶\s*/) : [];
  const lead = parts.length ? `<section class="tabout">${parts.map((p, i) => `<div><h3>${['The idea', 'What the agent writes', 'How it is judged'][i] || ''}</h3><p>${esc(p)}</p></div>`).join('')}</section>`
    : DESC[t.s] ? `<details class="tdet"${goal ? '' : ' open'}><summary>Problem details</summary><p>${esc(DESC[t.s])}</p></details>` : '';
  if (!runs.length) { $('#tbody').innerHTML = lead + '<p class="tbd">No runs on this problem yet.</p>'; loadFig(t); drawPager(t); scrollTo(0, 0); return; }
  const ref = REF[t.s], ms = new Set(runs.map(r => r[0])), np = new Set(runs.filter(r => r[3]).map(r => r[0])).size;
  const best = runs.reduce((a, r) => r[2] > a[2] ? r : a);
  const sum = [`<b>${np} of ${ms.size}</b> models pass`, `best final score <b>${f1(best[2])}</b>, by ${esc(MNAME[best[0]])}`]
    .concat(ref != null ? [`human reference <b>${f1(ref)}</b>`] : [], []);
  $('#tbody').innerHTML = lead
    + `<section class="tres"><h2 class="th2">Results</h2><p class="tsum">${sum.join(' · ')}</p><div class="res-scroll"><table class="res rtab" id="rtbl"></table></div></section>`
    + (CHECKS[t.s] ? `<section class="tcrit"><h2 class="th2">Pass criteria</h2><p>A run passes only if its final submission beats the human reference on every metric, on every hidden workload. Each cell counts the hidden workloads on which it did.</p>`
      + `<div class="res-scroll"><table class="res ctab" id="ctbl"></table></div></section>` : '')   // no general submission note (owner audit, 2026-10-14)
    + figure('dc', 'Development score against spend')
    + (TFIT[t.s] ? figure('fc', 'Expected score by FECI') : '')
    + solutionHTML(t, runs);   // the solution last (owner, 2026-10-14)
  drawResults(); if (CHECKS[t.s]) drawCriteria(); drawCharts(); loadFig(t); drawPager(t);
  scrollTo(0, 0);
}
const NEWDESC = s => (DESC[s] || '').includes('¶');
function loadFig(t) {
  const box = $('#tfig'); if (!box) return;
  fetch(`${window.FIG_DIR || '/assets/img/fcs2-tasks/'}${slug(t.s)}.svg`).then(r => r.ok ? r.text() : '').then(svg => {
    if (svg && cur && cur.t === t && svg.trim().startsWith('<svg')) { box.innerHTML = svg; box.hidden = false; $('#thero').classList.remove('nofig');
      // the agent's part takes the problem's domain colours, as the domain square beside its name does
      const k = AREA_OF[t.d].k; box.style.setProperty('--a', AINK[k]); box.style.setProperty('--af', AFILL[k]); } }).catch(() => {});
}
/* Previous and next problem, in the problem list's first order: hardest first (FEDI), then by domain and name
   (Qiuyang, 2026-10-14). A pager beside the back link, a larger pair at the foot of the page, and the arrow keys. */
const ORDER = [...TASKS].sort((a, b) => (FRANK[a.s] ?? 1e9) - (FRANK[b.s] ?? 1e9)
  || DOMAINS.indexOf(a.d) - DOMAINS.indexOf(b.d) || a.name.localeCompare(b.name));
function drawPager(t) {
  const i = ORDER.indexOf(t), prev = ORDER[i - 1], next = ORDER[i + 1], href = x => `#${slug(x.s)}`;
  // two chevron buttons around the position (Qiuyang, 2026-10-14: icons over names); the names show on hover
  const chev = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`, L = chev('M10 3.5 5.5 8l4.5 4.5'), R = chev('M6 3.5l4.5 4.5L6 12.5');
  const btn = (x, cls, icon, word) => x ? `<a class="pbtn ${cls}" href="${href(x)}" title="${word}: ${esc(x.name)}" aria-label="${word} problem: ${esc(x.name)}">${icon}</a>`
    : `<span class="pbtn ${cls} off" aria-hidden="true">${icon}</span>`;
  $('#tpager').innerHTML = btn(prev, 'prev', L, 'Previous') + `<span class="pos">${i + 1} / ${ORDER.length}</span>` + btn(next, 'next', R, 'Next');
  $('#tbody').insertAdjacentHTML('beforeend', `<nav class="tfoot" aria-label="Previous and next problem">`
    + (prev ? `<a class="prev" href="${href(prev)}" title="${esc(prev.name)}">‹ Previous problem</a>` : '<span></span>')
    + (next ? `<a class="next" href="${href(next)}" title="${esc(next.name)}">Next problem ›</a>` : '<span></span>') + '</nav>');
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

/* Per model (rows, leaderboard order, with its verdict) and metric (columns): on how many hidden workloads its final
   submission beat the Human reference (PASSBY, bin/fcs2_checks_from_platform.py, the same runs as the scores). A full count
   is green, a short one red; a run with no hidden evaluation has a dash. */
function drawCriteria() {
  const {t, runs} = cur, ms = CHECKS[t.s].metrics, by = (typeof PASSBY === 'undefined' ? {} : PASSBY)[t.s] || {};
  const short = Object.fromEntries(RANKED.map(m => [m.id, m.short]));
  $('#ctbl').innerHTML = `<thead><tr><th>Model</th>${ms.map(m => `<th title="${esc(m)}">${esc(metric(m))}</th>`).join('')}</tr></thead><tbody>`
    + runs.map(r => { const c = by[r[0]] || {};
      return `<tr><td>${r[3] ? TICK : CROSS}<span class="full">${esc(MNAME[r[0]])}</span><span class="short">${esc(short[r[0]])}</span></td>`
        + ms.map(m => { const v = c[m]; return v ? `<td class="${v[0] === v[1] ? 'cy' : 'cn'}">${v[0]}/${v[1]}</td>` : '<td class="e">—</td>'; }).join('') + '</tr>'; }).join('')
    + '</tbody>';
}

// pass and fail as a green tick and a red cross (Qiuyang, 2026-10-14), with the word for screen readers
const TICK = '<svg class="ri y" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.6l3.1 3.1 6.5-7.4"/></svg><span class="vh">Pass</span>';
const CROSS = '<svg class="ri n" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.3 4.3l7.4 7.4M11.7 4.3l-7.4 7.4"/></svg><span class="vh">Fail</span>';
function drawResults() {
  const {t, runs} = cur, ref = REF[t.s], xmax = Math.max(100, ref ?? 0, ...runs.map(r => r[2]));
  // the score sits at the end of its bar (owner, 2026-10-14: beside the bar, not at the right edge of the column)
  const bar = (v, style) => { const w = (Math.max(0, v) / xmax * 100).toFixed(1);
    return `<span class="rb"><i style="width:${w}%;${style}"></i><span class="rn" style="left:${w}%">${f1(v)}</span></span>`; };
  const short = Object.fromEntries(RANKED.map(m => [m.id, m.short]));
  $('#rtbl').innerHTML = '<thead><tr><th>Model</th><th class="rv">Pass</th><th class="rs">Final score</th><th>Cost</th></tr></thead><tbody>'
    + (ref != null ? `<tr class="rref"><td><span class="sq"></span>Human reference</td><td class="rv"></td><td class="rs">${bar(ref, '')}</td><td></td></tr>` : '')
    + [...runs].sort((p, q) => q[2] - p[2]).map(r => `<tr><td><span class="sq" style="background:${MCOL[r[0]]}"></span><span class="full">${esc(MNAME[r[0]])}</span><span class="short">${esc(short[r[0]])}</span></td>`
      + `<td class="rv">${r[3] ? TICK : CROSS}</td><td class="rs">${bar(r[2], `background:${MCOL[r[0]]}`)}</td><td>$${r[4].toFixed(2)}</td></tr>`).join('')
    + '</tbody>';
}

function drawIndex() {
  cur = null;
  document.title = 'Problems · FrontierCS 2';
  $('#tmeta').innerHTML = ''; $('#tlinks').innerHTML = ''; $('#tkeys').innerHTML = ''; $('#tfedi').innerHTML = ''; $('#tgoal').hidden = true; $('#tpager').innerHTML = '';
  $('#tfig').hidden = true; $('#tfig').innerHTML = ''; $('#thero').classList.add('nofig');
  $('#tname').textContent = 'Problems'; $('#tcrumb').textContent = ''; $('#tcsep').hidden = true;
  $('#tpaper').textContent = `${TASKS.length} problems in ${DOMAINS.filter(d => N_IN(d)).length} domains. Select a problem for its description and results.`;
  $('#tbody').innerHTML = DOMAINS.filter(d => N_IN(d)).map(d => `<section class="tgroup"><h2>${esc(d)}</h2><ul>`
    + TASKS.filter(t => t.d === d).map(t => `<li><a href="#${slug(t.s)}">${esc(t.name)}</a></li>`).join('')
    + '</ul></section>').join('');
}

function drawCharts() {
  if (!cur || !cur.runs.length) return;
  drawDev(); if (TFIT[cur.t.s]) drawFit();
}

/* Every run's development score at each submission against its estimated spend so far, US$ on a log scale. */
function drawDev() {
  const {runs} = cur, rs = runs.filter(r => r[6].length);
  const svg = $('#dcsvg'), W = Math.max(300, $('#dcplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 280 : 340;
  const all = rs.flatMap(r => r[6]).filter(p => p[0] > 0);
  if (!all.length) { svg.replaceChildren(); $('#dcnote').textContent = 'No development submission was scored on this problem.'; return; }
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
  $('#dcnote').textContent = 'Each line is one run: its score on the development workloads after each submission, against its estimated spend so far. A failed build or check scores 0.';
}

/* The task's curve from the FECI fit: the score a model of a given FECI is expected to reach. Dots: each model's mean final
   score on this task at the model's FECI, and the Human reference at FECI ECI_HUMAN. */
function drawFit() {
  const {t, runs} = cur, [d, k] = TFIT[t.s], ref = REF[t.s];
  const svg = $('#fcsvg'), W = Math.max(300, $('#fcplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 280 : 320;
  // the axis holds 0 to 50, every model, and the problem's FEDI with 10 to spare on each side (owner, 2026-10-14: a FEDI
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
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FECI'));
  const n = 120, path = Array.from({length:n + 1}, (_, i) => { const x = xmin + (xmax - xmin) * i / n; return `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`; }).join('');
  svg.append(sv('path', {d:path, fill:'none', stroke:'var(--ink-2)', 'stroke-width':2.5}));
  // the problem's FEDI: where the curve crosses an expected score of 50
  // a dashed drop to the axis marks it there; the label sits above and left of the point, which is off a rising curve
  svg.append(sv('line', {x1:X(d), x2:X(d), y1:Y(50), y2:H - B, stroke:'var(--ink-2)', 'stroke-width':1, 'stroke-dasharray':'3 3', opacity:.7}));
  svg.append(sv('circle', {cx:X(d), cy:Y(50), r:4.5, fill:'#fff', stroke:'var(--ink-2)', 'stroke-width':2}));
  const left = X(d) - L > 90;   // near the left edge the label goes right of the point
  svg.append(sv('text', {class:'val halo', x:X(d) + (left ? -10 : 10), y:Y(50) - 12, 'text-anchor':left ? 'end' : 'start', fill:'var(--ink-2)'}, `FEDI ${f1(d)}`));
  const pts = [];
  RANKED.filter(m => runs.some(r => r[0] === m.id)).forEach(m => {
    const sc = mean(runs.filter(r => r[0] === m.id).map(r => r[2])), x = ECI[m.id][0];
    svg.append(sv('circle', {cx:X(x), cy:Y(sc), r:6, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':1.5}));
    pts.push({x:X(x), y:Y(sc), html:`<b>${esc(m.name)}</b><br>FECI ${f1(x)}<br>Mean final score here <b>${f1(sc)}</b><br>Expected from the curve ${f1(f(x))}`});
  });
  if (ref != null) {
    svg.append(sv('rect', {x:X(ECI_HUMAN) - 5.5, y:Y(ref) - 5.5, width:11, height:11, fill:'var(--ink)', stroke:'#fff', 'stroke-width':1.5}));
    pts.push({x:X(ECI_HUMAN), y:Y(ref), html:`<b>Human reference</b><br>FECI ${ECI_HUMAN} by definition<br>Score <b>${f1(ref)}</b>`});
  }
  attachTip(svg, W, H, pts, $('#fctip'));
  $('#fclegend').innerHTML = RANKED.filter(m => runs.some(r => r[0] === m.id)).map(m => `<span><i style="background:${MCOL[m.id]}; border-radius:50%"></i>${esc(m.name)}</span>`).join('')
    + (ref != null ? '<span><i style="background:var(--ink)"></i>Human reference</span>' : '');
  $('#fcnote').textContent = `The curve is the score expected at each FECI, from the fit. Dots are the models’ final scores here at their FECI.`;
}

/* The solution in words (SOLUTION, assets/js/fcs2-solutions.js; owner, 2026-10-14: no code, the idea): which model,
   whether it passed and its final score, then its steps, laid out as the reasons under How FECI works on the overview. */
function solutionHTML(t, runs) {
  const so = typeof SOLUTION === 'undefined' ? null : SOLUTION[t.s], r = so && runs.find(x => x[0] === so.m);
  if (!so || !r) return '';
  return `<section class="tsol"><h2 class="th2">Solution</h2><p class="tsum"><span class="sq" style="background:${MCOL[so.m]}"></span>`
    + `<b>${esc(MNAME[so.m])}</b> · ${r[3] ? 'passes' : 'does not pass'} · final score <b>${f1(r[2])}</b></p>`
    + `<ol class="how-why tsteps">${so.steps.map(([h, x], i) => `<li><b><span>${i + 1}</span>${esc(h)}</b>${esc(x)}</li>`).join('')}</ol></section>`;
}

addEventListener('hashchange', drawPage);
drawPage();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawCharts, 120); });
