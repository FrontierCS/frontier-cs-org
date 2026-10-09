#!/usr/bin/env python3
"""Rewrite the FrontierCS 2 leaderboard data in assets/js/fcs2.js from a preview-result sqlite.db.

usage: python3 bin/fcs2_runs_from_db.py path/to/sqlite.db [--json=out.json]   (needs numpy, scipy, pandas, tqdm)
--json also writes every number the page shows, for the paper's figures.

The database lists one run per (model, task version) in `cells`. A run's score is `display_score`:
the verifier's final score, with timeouts shown as 0. Runs without a score are left out.
Tasks are matched to the paper's task list by display name (TASK below): the domain is the
task's folder under tasks/frontier-cs-2.0-demo/problems/ in FrontierCS-2.0-Preview, and the
short name is the paper's name for the task, or the database name when the paper list has none.

FECI, the leaderboard's main number, is fitted with Epoch AI's own ECI code (bin/eci_fitting.py, vendored
from epoch-research/eci-public): every task is one benchmark with score/100 = sigmoid(slope_t * (capability_m - difficulty_t)),
fitted by bounded least squares with Epoch's defaults (L2 penalty 0.1 over the parameter count, scores clipped to [0.001, 0.999]).
Epoch pins one benchmark's slope to 1; here that is the task with the most observations (ties: first by name).
Respondents are the models (mean score over their runs on a task) and the authors' reference
(median reference_score over the task's runs; references of 0 mean the task has none and are left out).
Capabilities are mapped linearly so that Human (the authors' reference) is HUMAN_VALUE and LOW_ANCHOR is LOW_VALUE.
The 90% interval follows Epoch's bootstrap: each respondent's task results are resampled with replacement and the fit
is redone from the central solution (BOOT draws, seeds 0..BOOT-1). Epoch's code raises when a draw puts the anchors in the
wrong order; those draws are left out and counted.

Test-time scaling (SCALE) uses development scores, the score each submission gets on the task's development
workloads while the agent runs. At a budget B of US$ (usd() below), a run's submission is its latest
valid submission, the latest with a dev score above 0 (a failed build or validation scores 0), or nothing (score 0)
if it has none yet; once B passes the run's end, its hidden final
score. Dev scores are calibrated to the hidden suite per task: hidden - dev of the final patch, averaged over the
task's runs with 1 pseudo-run of the global average (leave-one-out RMSE 5.4 points, against 8.6 uncalibrated).
ECI(model, B) keeps every task's curve from the leaderboard fit and solves one capability per (model, budget) by
least squares, so it is on the FECI scale and equals the leaderboard value at full budget. Its 90% interval
resamples the model's tasks (SCALE_BOOT draws, task curves held fixed).

Pass rate is the share of scored runs whose verdict is PASS: the final submission meets the task's
beat-the-reference criteria on every workload. It is a plain count, so it has no interval.
"""
import json, re, sqlite3, sys
from collections import Counter, defaultdict
import numpy as np
from scipy.optimize import minimize_scalar
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
    'Qwen 3.8 Max Code': ('qwen', 'Qwen 3.8 Max', 'Qwen 3.8 Max', '', 'Qwen'),   # shown without 'Code' (owner, 2026-10-09)
    'DeepSeek V4.1 Flash (DSH)': ('ds', 'DeepSeek V4.1 Flash', 'DeepSeek V4.1', 'DSH', 'DeepSeek'),
    'GLM 5.3 (ZCode)': ('glm', 'GLM 5.3', 'GLM 5.3', 'ZCode', 'Z.ai'),
}

HUMAN_VALUE = 60                               # owner's choice, 2026-10-09 (tried 100 and 25; K2.7 was 20)
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
    central, curves, _ = fit_eci_model(df, bootstrap_samples=0, **kw)
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
    return out, len(draws), dropped, pinned, curves


SCALE_BOOT, SCALE_POINTS = 100, 32

# US$ per million tokens, list prices found 2026-10-09: (output, cache read; the input price where no cache price is listed).
# DeepSeek is its off-peak rate (peak hours double it). Sources: eesel.ai and yottalabs.ai (GPT-6 Astra, GPT-6.1 Sol, Kimi K3,
# DeepSeek), anotherwrapper.com and QwenCloud (Qwen implicit cache), pricepertoken.com (GLM), anotherwrapper.com (Muse, no cache price).
PRICE = {'astra': (50.00, 1.00), 'sol': (10.00, 0.10), 'k3': (15.00, 0.30), 'qwen': (6.00, 0.25),
         'ds': (0.60, 0.003), 'glm': (4.40, 0.26), 'muse': (4.25, 1.25)}


def usd(m, total, output):
    """Owner's approximation (2026-10-09): output tokens at the output price plus every token at the cache-read price,
    as if all input were a cache hit. Tool-reported total tokens count cached input differently per tool, so they enter
    only here, never as an axis."""
    po, pc = PRICE[m]
    return (output * po + total * pc) / 1e6


def cost(db):
    """Per model: [mean US$ per scored run, runs with token counts]; a run's tokens are its last cumulative values."""
    end = {r: (t, o) for r, t, o in db.execute('select run_id, max(total_tokens), max(output_tokens) from score_points group by run_id')}
    by = defaultdict(list)
    for r, c, s in db.execute('''select r.id, cd.name, r.display_score from cells ce join runs r on r.id = ce.run_id
        join candidates cd on cd.id = ce.candidate_id'''):
        if s is not None and c not in HIDDEN and end.get(r) and end[r][0]: by[MODEL[c][0]].append(usd(MODEL[c][0], *end[r]))
    return {m: [round(float(np.mean(v)), 4), len(v)] for m, v in sorted(by.items())}


def scaling(db, curves):
    """{model id: [[US$ budget, ECI, 90% low, 90% high, share of runs still going], ...]}; spend from usd()."""
    EDI = dict(zip(curves['benchmark'], curves['edi'])); SL = dict(zip(curves['benchmark'], curves['discriminability_scaled']))
    info = {r: (c, t, s) for r, c, t, s in db.execute('''select r.id, cd.name, t.name, r.display_score from cells ce join runs r on r.id = ce.run_id
        join candidates cd on cd.id = ce.candidate_id join tasks t on t.id = ce.task_id''') if s is not None and c not in HIDDEN}
    pts = {(r, sid): (sc, tt, ot) for r, sid, sc, tt, ot in db.execute('select run_id, submission_id, score, total_tokens, output_tokens from score_points')}
    subs = defaultdict(list)
    for r, sid, kind, ph in db.execute('select run_id, id, kind, patch_sha256 from submissions order by run_id, ordinal'): subs[r].append((sid, kind, ph))
    # calibration pairs: dev score of the final patch, hidden final score
    gaps = defaultdict(list)
    for r, (c, t, hidden) in info.items():
        dev = {ph: pts[(r, sid)][0] for sid, kind, ph in subs[r] if kind == 'train' and (r, sid) in pts}
        fin = [ph for sid, kind, ph in subs[r] if kind == 'final']
        if fin and fin[0] in dev: gaps[t].append(hidden - dev[fin[0]])
    g = np.mean([x for v in gaps.values() for x in v]); off = {t: (sum(v) + g) / (len(v) + 1) for t, v in gaps.items()}

    def cap(ys):
        t = list(ys); y = np.clip(np.array([ys[k] for k in t]) / 100, 1e-3, 1 - 1e-3)
        e = np.array([EDI[k] for k in t]); sl = np.array([SL[k] for k in t])
        return minimize_scalar(lambda x: np.sum((1 / (1 + np.exp(-sl * (x - e))) - y) ** 2), bounds=(-400, 400), method='bounded').x

    out = {}
    for axis in ('usd',):
        traj = {}
        for r, (c, t, hidden) in info.items():
            seq, end = [], 0
            for sid, kind, ph in subs[r]:
                if (r, sid) not in pts: continue
                p = pts[(r, sid)]; end = usd(MODEL[c][0], p[1], p[2])
                if kind == 'train' and p[0] > 0: seq.append((end, float(np.clip(p[0] + off.get(t, g), 0, 100))))
            traj[r] = (seq, end, hidden)
        # stopped at B, the run's result is its latest valid submission: the latest with a dev score above 0 (owner, 2026-10-09)
        at = lambda r, B: traj[r][2] if B >= traj[r][1] else next((d for spend, d in reversed(traj[r][0]) if spend <= B), 0.0)
        out[axis] = {}
        for c in sorted({v[0] for v in info.values()}, key=lambda c: MODEL[c][0]):
            runs = [r for r in info if info[r][0] == c]; tasks = sorted({info[r][1] for r in runs}); ends = [traj[r][1] for r in runs]
            rng, curve = np.random.default_rng(3), []
            # budgets are rounded up to the stored precision before use, so each point is exact at its stored budget
            for B in np.ceil(np.geomspace(1e-3, max(ends), SCALE_POINTS) * 1e5) / 1e5:
                ys = {t: float(np.mean([at(r, B) for r in runs if info[r][1] == t])) for t in tasks}
                lo, hi = np.percentile([cap({t: ys[t] for t in rng.choice(tasks, len(tasks))}) for _ in range(SCALE_BOOT)], [5, 95])
                curve.append([float(B), round(float(cap(ys)), 1), round(float(lo), 1), round(float(hi), 1), round(float(np.mean([e > B for e in ends])), 2)])
            out[axis][MODEL[c][0]] = curve
    return out['usd']


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
when = datetime.fromisoformat(generated[:19])
models = [MODEL[c] for c in MODEL if c not in HIDDEN]
E, nboot, nbad, pinned, curves = eci(db.execute('''select c.name, t.name, r.display_score, r.feedback_json from cells ce
  join runs r on r.id = ce.run_id join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id''').fetchall())
SC, CO = scaling(db, curves), cost(db)
eci_js = {MODEL[c][0]: list(E[c]) for c in MODEL if c not in HIDDEN}
block = (f'// One entry per scored run in the preview results database of {when:%Y-%m-%d} (bin/fcs2_runs_from_db.py):\n'
         f'// model, domain, task, final score (0-100, the task\'s own scale), passed (1 = verdict PASS). Timeouts score 0; {sum(dropped.values())} unscored runs are left out' + ''.join(f'; {c} is left out (only the ECI 0 point)' for c in sorted(HIDDEN)) + '.\n'
         f'const RUNS = {json.dumps(runs, ensure_ascii=False)}.map(([m, d, t, s, p]) => ({{m, d, t, s, p}}));\n'
         'const MODELS = [\n' + ''.join(f"  {{id:'{i}', name:'{n}', short:'{s}', h:'{h}', lab:'{l}'}},\n" for i, n, s, h, l in models) + '];\n'
         f"const UPDATED = '{when:%B} {when.day}, {when.year}';\n"
         f"// FECI per model: [point, 90% low, 90% high, tasks]; Human (the authors' reference) is {HUMAN_VALUE:g} and {LOW_ANCHOR} is {LOW_VALUE:g} ({nboot} bootstrap draws kept, {nbad} dropped with the anchors inverted; pinned slope: {pinned}).\n"
         f"// Pass rate per model: [percent, runs that pass, runs].\nconst PASS = {json.dumps(pass_rate(runs))};\n"
         f"const ECI = {json.dumps(eci_js)};\nconst ECI_HUMAN = {HUMAN_VALUE:g}, ECI_LOW = '{MODEL[LOW_ANCHOR][0]}', ECI_LOW_NAME = '{MODEL[LOW_ANCHOR][1]}', ECI_LOW_VALUE = {LOW_VALUE:g}, ECI_REF_TASKS = {E['reference'][3]};\n"
         f"// Test-time scaling per model: [US$ budget per run, ECI, 90% low, 90% high, share of runs still going] (see the converter's docstring).\nconst SCALE = {json.dumps(SC, separators=(',', ':'))};\n"
         f"// Cost per model: [mean US$ per scored run, runs]; output tokens x output price + every token x cache-read price (PRICE above).\nconst COST = {json.dumps(CO)};\nconst PRICE = {json.dumps(PRICE)};\n")
js = open(js_path, encoding='utf-8').read()   # read late: the fits above take minutes
js, n = re.subn(r'// One entry per .*?\nconst MODELS = \[\n.*?\];\n(const UPDATED = .*?\n)?(// (FrontierCS |F)?ECI per model.*?\n(// Pass rate.*?\nconst PASS = .*?\n)?const ECI = .*?\nconst (ECI_HUMAN = .*?, )?ECI_LOW = .*?\n(// Test-time scaling.*?\nconst SCALE = .*?\n((// Tokens|// Cost) per model.*?\nconst (TOK|COST) = .*?\n(const PRICE = .*?\n)?)?)?)?', lambda m: block, js, flags=re.S)
assert n == 1, 'RUNS block not found'
open(js_path, 'w', encoding='utf-8').write(js)
print('PASS', pass_rate(runs))
print('ECI', eci_js, 'reference tasks', E['reference'][3])
print(f'{len(runs)} runs, {len({r[2] for r in runs})} tasks, {len(models)} models; dropped {dict(dropped)}; generated {generated}')

for a in sys.argv[2:]:
    if a.startswith('--json='):
        out = {'source': sys.argv[1], 'generated_at': generated, 'runs_columns': ['model', 'domain', 'task', 'score', 'passed'], 'runs': runs,
               'models': [dict(zip(['id', 'name', 'short', 'harness', 'lab'], m)) for m in models], 'dropped': dict(dropped),
               'pass': pass_rate(runs), 'cost_usd': CO, 'price_per_mtok': PRICE, 'eci': eci_js, 'eci_human': HUMAN_VALUE,
               'eci_low': [LOW_ANCHOR, LOW_VALUE], 'eci_boot_kept': nboot, 'eci_boot_dropped': nbad, 'eci_pinned_task': pinned,
               'eci_reference_tasks': E['reference'][3], 'scaling_columns': ['usd', 'eci', 'lo90', 'hi90', 'share_running'], 'scaling': SC}
        json.dump(out, open(a[7:], 'w'), indent=1)
        print('wrote', a[7:])
