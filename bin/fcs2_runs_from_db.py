#!/usr/bin/env python3
"""Rewrite the FrontierCS 2 leaderboard data in assets/js/fcs2.js from a preview-result sqlite.db.

usage: python3 bin/fcs2_runs_from_db.py path/to/sqlite.db   (needs numpy, scipy, pandas, tqdm)

The database lists one run per (model, task version) in `cells`. A run's score is `display_score`:
the verifier's final score, with timeouts shown as 0. Runs without a score are left out.
Tasks are matched to the paper's task list by display name (TASK below): the domain is the
task's folder under tasks/frontier-cs-2.0-demo/problems/ in FrontierCS-2.0-Preview, and the
short name is the paper's name for the task, or the database name when the paper list has none.

FrontierCS ECI, the leaderboard's main number, is fitted with Epoch AI's own ECI code (bin/eci_fitting.py, vendored
from epoch-research/eci-public): every task is one benchmark with score/100 = sigmoid(slope_t * (capability_m - difficulty_t)),
fitted by bounded least squares with Epoch's defaults (L2 penalty 0.1 over the parameter count, scores clipped to [0.001, 0.999]).
Epoch pins one benchmark's slope to 1; here that is the task with the most observations (ties: first by name).
Respondents are the models (mean score over their runs on a task) and the authors' reference
(median reference_score over the task's runs; references of 0 mean the task has none and are left out).
Capabilities are mapped linearly so that Human (the authors' reference) is HUMAN_VALUE and LOW_ANCHOR is LOW_VALUE.
The 90% interval follows Epoch's bootstrap: each respondent's task results are resampled with replacement and the fit
is redone from the central solution (BOOT draws, seeds 0..BOOT-1). Epoch's code raises when a draw puts the anchors in the
wrong order; those draws are left out and counted.

Pass rate is the share of scored runs whose verdict is PASS: the final submission meets the task's
beat-the-reference criteria on every workload. It is a plain count, so it has no interval.
"""
import json, re, sqlite3, sys
from collections import Counter, defaultdict
import numpy as np
import pandas as pd
import os
os.environ.setdefault('TQDM_DISABLE', '1')   # Epoch's bootstrap bar, once per draw here
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eci_fitting import fit_eci_model
from datetime import datetime

# database display name -> (domain folder, paper short name or None)
TASK = {
    'Adaptive Robustness Evaluation for Prompt-Injection Defense': ('Security', 'Adaptive attacks'),
    'Approximate-MIPS Query Stopping': ('Database', None),
    'Argument-aware runtime privilege control': ('Security', 'Progent'),
    'BBQ bitmap traversal': ('Network', 'BBQ'),
    'BROP: Hacking Blind — Return-Oriented Programming Without Binary Knowledge': ('Security', 'Hacking Blind'),
    'Batch Local Counting': ('Database', 'SCOPE'),
    'Bounded EVM Path Prediction': ('Database', 'Seer'),
    'Closed-loop action sampling': ('Robotics', 'Diffusion Policy'),
    'Differentiable Population Statistics': ('Machine Learning', None),
    'Dynamic GPU Allocation': ('Network', 'Shockwave'),
    'E-Graph Invariant Restoration': ('Programming Language', 'egg'),
    'EVM State Checkpoints': ('Database', 'Spectrum'),
    'Enclave-Resident Admissible-Set Filter': ('Security', 'Opal'),
    'Exact DBSCAN Connectivity': ('HPC', 'Parallel DBSCAN'),
    'FARGO paper-aligned query core': ('Database', None),
    'Fixed-Length Clustered Sparse Multiplication': ('Arch', 'Clusterwise SpGEMM'),
    'Future Video Sampling': ('Machine Learning', 'Nano World Model'),
    'GPU Brute-Force k-NN Kernel Optimization': ('MLSys', 'knn kernel'),
    'GPU DBSCAN Kernel Optimization': ('MLSys', 'dbscan kernel'),
    'GPU IVF-PQ Search Kernel Optimization': ('MLSys', 'ivf_pq kernel'),
    'GPU K-Means Kernel Optimization': ('MLSys', 'kmeans kernel'),
    'Go1 Command-Conditioned Behavior': ('Robotics', 'MuJoCo Playground'),
    'Graph Mining Method Selection': ('Database', 'ScaleGPM'),
    'Hypergraph Core Numbers': ('HPC', 'Hygra'),
    'In-place Integer Redistribution': ('HPC', 'RegionsSort'),
    'Join-Tree Rewriting': ('Database', 'Yannakakis'),
    'KAMI FP64 Block GEMM — trusted batched harness adaptation': ('Arch', 'KAMI'),
    'Latent Objective Recovery': ('Machine Learning', 'LeJEPA'),
    'Learned Transformer Layer Mapping': ('Machine Learning', 'DyT'),
    'MetaOpt Combined-TE Gap Search': ('Network', 'MetaOpt'),
    'Multi-turn Trajectory Batches': ('Machine Learning', 'RAGEN'),
    'OCR Distillation Trajectory Sampling': ('Machine Learning', None),
    'ParButterfly Exact Counting': ('HPC', 'ParButterfly'),
    'Persistent Treap Update Engine': ('Database', None),
    'Polar-Factor Approximation': ('Machine Learning', 'Polar Express'),
    'Residual State Advancement': ('Database', None),
    'Reusable Library Candidates': ('Programming Language', 'BABBLE'),
    'Robust Image Tokenizer': ('Machine Learning', None),
    'SQL Counterexample Search': ('Programming Language', 'Polygon'),
    'Safe Abstract Trace-Cut — Coupled Optimization': ('Security', 'Spectre'),
    'Sparse Video Attention Policy': ('MLSys', 'SVG-EAR'),
    'Structured-LWE Public Witness Recovery': ('Crypto', 'Structured LWE'),
}
SHOWN = {'Arch': 'Architecture', 'Crypto': 'Cryptography', 'Programming Language': 'Programming Languages'}

# database candidate name -> (id, shown name, short name for phones, harness, lab); order = legend order within a lab
MODEL = {
    'GPT-6 Astra': ('astra', 'GPT-6 Astra', 'GPT-6 Astra', 'Codex CLI', 'OpenAI'),
    'GPT-6.1 Sol': ('sol', 'GPT-6.1 Sol', 'GPT-6.1 Sol', 'Codex CLI', 'OpenAI'),
    'Muse Code - Muse Spark 1.3': ('muse', 'Muse Spark 1.3', 'Muse Spark', 'Muse Code', 'Meta'),
    'Kimi K3 (Modal)': ('k3', 'Kimi K3', 'Kimi K3', 'Kimi Code', 'Kimi'),
    'Kimi K2.7 Code': ('k27', 'Kimi K2.7 Code', 'Kimi K2.7', 'Kimi CLI', 'Kimi'),
    'Qwen 3.8 Max Code': ('qwen', 'Qwen 3.8 Max Code', 'Qwen 3.8 Max', '', 'Qwen'),
    'DeepSeek V4.1 Flash (DSH)': ('ds', 'DeepSeek V4.1 Flash', 'DeepSeek V4.1', 'DSH', 'DeepSeek'),
    'GLM 5.3 (ZCode)': ('glm', 'GLM 5.3', 'GLM 5.3', 'ZCode', 'Z.ai'),
}

HUMAN_VALUE = 25                               # owner's choice, 2026-10-09 (was 100, then 60; K2.7 was 20)
HIDDEN = {'Kimi K2.7 Code'}                    # owner's call, 2026-10-09: off the leaderboard, kept in the ECI fit as its 0 point
LOW_ANCHOR, LOW_VALUE = 'Kimi K2.7 Code', 0   # Kimi K3 = 20 is degenerate on the 2026-10-08 data: K3 scores level with the reference
for a in sys.argv[2:]:   # optional: --low='Model name=value' to try another anchor
    if a.startswith('--low='): LOW_ANCHOR, LOW_VALUE = a[6:].rsplit('=', 1)[0], float(a[6:].rsplit('=', 1)[1])


BOOT = 500


def eci(rows):
    """Per respondent: (ECI, 90% low, 90% high, tasks); plus the number of bootstrap draws kept and dropped."""
    sc, ref = defaultdict(list), defaultdict(list)
    for cand, task, score, fj in rows:
        if score is not None: sc[(cand, task)].append(score)
        f = json.loads(fj) if fj else {}
        if f.get('reference_score') is not None: ref[task].append(f['reference_score'])
    recs = [(m, t, float(np.mean(v)) / 100) for (m, t), v in sc.items()]
    recs += [('reference', t, float(np.median(v)) / 100) for t, v in ref.items() if np.median(v) > 0]
    df = pd.DataFrame(recs, columns=['Model', 'benchmark', 'performance'])
    df['model_id'], df['benchmark_id'] = df['Model'], df['benchmark']
    counts = df['benchmark'].value_counts()
    pinned = sorted(counts.index, key=lambda t: (-counts[t], t))[0]
    kw = dict(anchor_benchmark=pinned, anchor_model_low=LOW_ANCHOR, anchor_eci_low=float(LOW_VALUE),
              anchor_model_high='reference', anchor_eci_high=float(HUMAN_VALUE))
    central, _, _ = fit_eci_model(df, bootstrap_samples=0, **kw)
    point = dict(zip(central['Model'], central['eci']))
    draws, dropped = [], 0
    for seed in range(BOOT):
        try:
            _, _, d = fit_eci_model(df, bootstrap_samples=1, bootstrap_seed=seed, **kw)
            draws.append(dict(zip(d['model_names'], d['eci'][0])))
        except ValueError:
            dropped += 1
    ntask = Counter(df['Model'])
    out = {}
    for m in point:
        lo, hi = np.percentile([d[m] for d in draws], [5, 95])
        out[m] = (round(float(point[m]), 1), round(float(lo), 1), round(float(hi), 1), int(ntask[m]))
    return out, len(draws), dropped, pinned


db = sqlite3.connect(sys.argv[1])
generated = db.execute('select generated_at from release').fetchone()[0]
rows = db.execute('''select c.name, t.name, r.display_score, r.state, r.display_verdict from cells ce
  join runs r on r.id = ce.run_id join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id
  order by c.ordinal, t.ordinal''').fetchall()
missing = {r[1] for r in rows} - set(TASK)
assert not missing, f'unmapped tasks: {missing}'
assert not {c for c, *_ in rows} - set(MODEL), 'unmapped model'

runs = []
for cand, task, score, state, verdict in rows:
    if score is None or cand in HIDDEN: continue
    folder, short = TASK[task]
    runs.append([MODEL[cand][0], SHOWN.get(folder, folder), short or task.split(' — ')[0], round(score, 2), int(verdict == 'PASS')])
dropped = Counter(r[3] for r in rows if r[2] is None and r[0] not in HIDDEN)


def pass_rate(runs):
    """Per model: [percent PASS, runs that pass, runs]."""
    out = {}
    for m in sorted({r[0] for r in runs}):
        p = [r[4] for r in runs if r[0] == m]
        out[m] = [round(100 * sum(p) / len(p), 1), sum(p), len(p)]
    return out

js_path = 'assets/js/fcs2.js'
js = open(js_path, encoding='utf-8').read()
when = datetime.fromisoformat(generated[:19])
models = [MODEL[c] for c in MODEL if c not in HIDDEN]
E, nboot, nbad, pinned = eci(db.execute('''select c.name, t.name, r.display_score, r.feedback_json from cells ce
  join runs r on r.id = ce.run_id join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id''').fetchall())
eci_js = {MODEL[c][0]: list(E[c]) for c in MODEL if c not in HIDDEN}
block = (f'// One entry per scored run in the preview results database of {when:%Y-%m-%d} (bin/fcs2_runs_from_db.py):\n'
         f'// model, domain, task, final score (0-100, the task\'s own scale), passed (1 = beats the reference). Timeouts score 0; {sum(dropped.values())} unscored runs are left out' + ''.join(f'; {c} is left out (only the ECI 0 point)' for c in sorted(HIDDEN)) + '.\n'
         f'const RUNS = {json.dumps(runs, ensure_ascii=False)}.map(([m, d, t, s, p]) => ({{m, d, t, s, p}}));\n'
         'const MODELS = [\n' + ''.join(f"  {{id:'{i}', name:'{n}', short:'{s}', h:'{h}', lab:'{l}'}},\n" for i, n, s, h, l in models) + '];\n'
         f"const UPDATED = '{when:%B} {when.day}, {when.year}';\n"
         f"// FrontierCS ECI per model: [point, 90% low, 90% high, tasks]; Human (the authors' reference) is {HUMAN_VALUE:g} and {LOW_ANCHOR} is {LOW_VALUE:g} ({nboot} bootstrap draws kept, {nbad} dropped with the anchors inverted; pinned slope: {pinned}).\n"
         f"// Pass rate per model: [percent, runs that pass, runs].\nconst PASS = {json.dumps(pass_rate(runs))};\n"
         f"const ECI = {json.dumps(eci_js)};\nconst ECI_HUMAN = {HUMAN_VALUE:g}, ECI_LOW = '{MODEL[LOW_ANCHOR][0]}', ECI_LOW_NAME = '{MODEL[LOW_ANCHOR][1]}', ECI_LOW_VALUE = {LOW_VALUE:g}, ECI_REF_TASKS = {E['reference'][3]};\n")
js, n = re.subn(r'// One entry per .*?\nconst MODELS = \[\n.*?\];\n(const UPDATED = .*?\n)?(// (FrontierCS )?ECI per model.*?\n(// Pass rate.*?\nconst PASS = .*?\n)?const ECI = .*?\nconst (ECI_HUMAN = .*?, )?ECI_LOW = .*?\n)?', lambda m: block, js, flags=re.S)
assert n == 1, 'RUNS block not found'
open(js_path, 'w', encoding='utf-8').write(js)
print('PASS', pass_rate(runs))
print('ECI', eci_js, 'reference tasks', E['reference'][3])
print(f'{len(runs)} runs, {len({r[2] for r in runs})} tasks, {len(models)} models; dropped {dict(dropped)}; generated {generated}')
