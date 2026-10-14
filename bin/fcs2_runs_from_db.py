#!/usr/bin/env python3
"""Rewrite the FrontierCS 2 data block in assets/js/fcs2-data.js from a preview-result sqlite.db.

The block sits between the BEGIN/END converter markers; the rest of the file (task list, helpers) is hand-written.
Task descriptions come from bin/fcs2_descriptions.tsv, a copy of the paper repo's notes/descriptions_{a,b,c}.tsv.

usage: python3 bin/fcs2_runs_from_db.py path/to/sqlite.db [--json=out.json]   (needs numpy, scipy, pandas, tqdm)
--json also writes every number the page shows, for the paper's figures, and the raw-score fit described below.

The database lists one run per (model, task version) in `cells`. A run's score is `display_score`:
the verifier's final score, with timeouts shown as 0. Runs without a score are left out.
Tasks are matched to the paper's task list by display name (TASK below): the domain is the
task's folder under tasks/frontier-cs-2.0-demo/problems/ in FrontierCS-2.0-Preview, and the
short name is the paper's name for the task, or the database name when the paper list has none.

ECI, the leaderboard's main number, is fitted on pass and fail (Qiuyang, 2026-10-14): Epoch AI's ECI idea, a Rasch model
P(model m passes task t) = sigmoid(theta_m - beta_t), with every scored run of every model one observation (hidden models
too: they are respondents, never shown). Strengths theta and difficulties beta, in logits, are fitted together by
penalised maximum likelihood with penalty LAM/2 (sum theta^2 + sum beta^2), LAM = 0.35 as in the site's in-browser TDIFF.
A strength is shown as ECI = PASS_ZERO_VALUE + PASS_UNIT * (theta_m - theta of PASS_ZERO), the constants at the top.
The 90% interval resamples task columns with replacement (BOOT draws, seeds 0..BOOT-1), refits, maps each draw the same
way, and takes the 5th and 95th percentiles.

Task difficulty (DIFF, and the pass curves in TFIT) puts passes first; a run's final score enters only as a win against the
human reference r_t, the median reference_score over the task's runs (0 or less: the task has none). A win w is 1 when
the score is above r_t + TIE_EPS, 0 when below r_t - TIE_EPS, otherwise 1/2. With the strengths held at the fit above,
each task has a pass threshold b_t, P(pass) = sigmoid(theta_m - b_t), and a beat-the-human threshold h_t,
P(win) = sigmoid(a (theta_m - h_t)). Priors: h_t ~ N(mean theta, PRIOR_SD^2) and b_t = h_t + delta_t with
delta_t ~ N(DELTA, TAU^2); a task without a reference has b_t ~ N(mean theta, PRIOR_SD^2). a, DELTA and TAU maximise the
marginal likelihood of passes and wins over the tasks with a reference (a and TAU on a log scale, TAU >= 0.25). A task's
difficulty D is the posterior median of b_t on a grid (GRID, around the mean strength), its interval the 5th and 95th
posterior percentiles; all are mapped to ECI points like the strengths.

The raw-score fit that the leaderboard showed before 2026-10-14 runs only with --json (feci_score, task_fit_score). It is
Epoch AI's own ECI code (bin/eci_fitting.py, vendored from epoch-research/eci-public): every task is one benchmark with
score/100 = sigmoid(slope_t * (capability_m - difficulty_t)), fitted by bounded least squares with Epoch's defaults
(L2 penalty 0.1 over the parameter count, scores clipped to [0.001, 0.999]). Epoch pins one benchmark's slope to 1; here
that is the task with the most observations (ties: first by name). Respondents are the models (mean score over their runs
on a task) and the authors' reference r_t (tasks without one are left out). Capabilities are mapped linearly so that
the authors' reference is HUMAN_VALUE and PASS_ZERO is PASS_ZERO_VALUE. Its 90% interval follows Epoch's bootstrap:
each respondent's task results are resampled with replacement and the fit is redone from the central solution (BOOT
draws); Epoch's code raises when a draw puts the anchors in the wrong order, and those draws are left out and counted.

Test-time scaling (SCALE): at a budget B of US$ (usd() below), a run counts as passed only when it has ended within B
(its spend at the end is at most B) and its verdict is PASS; otherwise it counts as failed (Qiuyang, 2026-10-14).
ECI(model, B) holds every task's difficulty beta_t at the leaderboard fit and solves the model's one strength with the
same penalty, so it equals the leaderboard ECI at full budget; it is mapped with the leaderboard's theta of PASS_ZERO.
Its 90% interval resamples the model's tasks (SCALE_BOOT draws, difficulties held fixed).

Pass rate is the share of scored runs whose verdict is PASS: the final submission meets the task's
beat-the-reference criteria on every workload. It is a plain count, so it has no interval.
"""
import json, re, sqlite3, sys
from collections import Counter, defaultdict
import numpy as np
from scipy.optimize import brentq, minimize
from scipy.special import expit, log_expit
import pandas as pd
import os
os.environ.setdefault('TQDM_DISABLE', '1')   # Epoch's bootstrap bar, once per draw here
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eci_fitting import fit_eci_model
from datetime import datetime

# The ECI scale (Qiuyang, 2026-10-14): ECI = PASS_ZERO_VALUE + PASS_UNIT * (theta - theta of PASS_ZERO), theta in logits.
# ECI, SCALE, TFIT, DIFF and DIFF_FIT all follow from these three.
PASS_ZERO = 'Kimi K2.7 Code'   # the 0 point; it is hidden (HIDDEN below) but stays in every fit
PASS_ZERO_VALUE = 0
PASS_UNIT = 1.0                # ECI points per logit
TIE_EPS = 0                    # a final score within TIE_EPS of the human reference is half a win; 0: only an exact tie

# database display name -> (domain folder, paper short name or None)
TASK = {
    'Access-Pattern Rewriting': ('Programming Language', 'Glenside'),
    'Binary Fuse Filter Construction and Lookup': ('Theory', None),
    'CKKS Precision Propagation at 2,048 Slots': ('Crypto', 'CKKS noise'),
    'Exact Sequence Alignment': ('Bioinformatics', None),
    'Go1 Joystick Policy Training': ('Robotics', 'MuJoCo Playground'),
    'Private Set List Decoding': ('Crypto', 'QuarterPIR'),
    'Register-aware Branch Prediction': ('Arch', 'RUNLTS'),
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
    'Muse Code - Muse Spark 1.3': ('muse', 'Muse Spark 1.3', 'Muse Spark 1.3', 'Muse Code', 'Meta'),
    'Kimi K3 (Modal)': ('k3', 'Kimi K3', 'Kimi K3', 'Kimi Code', 'Kimi'),
    'Kimi K2.7 Code': ('k27', 'Kimi K2.7', 'Kimi K2.7', 'Kimi CLI', 'Kimi'),   # shown as Kimi K2.7 (owner, 2026-10-14)
    'Qwen 3.8 Max Code': ('qwen', 'Qwen 3.8 Max', 'Qwen 3.8 Max', '', 'Qwen'),   # shown without 'Code' (owner, 2026-10-09)
    'DeepSeek V4.1 Flash (DSH)': ('ds', 'DeepSeek V4.1 Flash', 'DeepSeek V4.1 Flash', 'DSH', 'DeepSeek'),
    'GLM 5.3 (ZCode)': ('glm', 'GLM 5.3', 'GLM 5.3', 'ZCode', 'Z.ai'),
    'Claude Code · Opus 5.5 (Subscription, max effort)': ('opus', 'Claude Opus 5.5', 'Opus 5.5', 'Claude Code', 'Anthropic'),
    'Muse Code · Muse Wonder 1.0': ('wonder', 'Muse Wonder 1.0', 'Muse Wonder 1.0', 'Muse Code', 'Meta'),
    'Codex · Qwen 3.8 Max': ('qwen', 'Qwen 3.8 Max', 'Qwen 3.8 Max', 'Codex CLI', 'Qwen'),
    'GLM 5.3 Flash (ZCode)': ('glmf', 'GLM 5.3 Flash', 'GLM 5.3 Flash', 'ZCode', 'Z.ai'),
}

HIDDEN = {'Kimi K2.7 Code'}                    # owner's call, 2026-10-09: off the leaderboard, kept in the fits (it is the ECI's 0 point)
for a in sys.argv[2:]:   # optional: --low='Model name=value' to try another 0 point
    if a.startswith('--low='): PASS_ZERO, PASS_ZERO_VALUE = a[6:].rsplit('=', 1)[0], float(a[6:].rsplit('=', 1)[1])


LAM = 0.35                       # L2 penalty on every strength and difficulty of the pass fit, as the site's in-browser TDIFF
BOOT = 500
PRIOR_SD = 6                     # logits: prior sd of a task's beat-the-human threshold, or of its pass threshold without a reference
GRID = np.arange(-30, 36.001, 0.02)   # logits from the mean strength: the grid of the task posteriors, 5 prior sd each side and room for DELTA
HUMAN_VALUE = 25                 # the raw-score fit only (--json): the authors' reference is HUMAN_VALUE (owner, 2026-10-13)


def on_scale(theta, theta0):
    """Logits to ECI points, theta0 being PASS_ZERO's strength in the same fit."""
    return PASS_ZERO_VALUE + PASS_UNIT * (np.asarray(theta) - theta0)


def fit_data(rows):
    """The fits' data: one (model, task, passed, score) per scored run, hidden models included, and each task's
    reference r_t, the median reference_score over its runs (tasks where it is 0 or less have none)."""
    obs, ref = [], defaultdict(list)
    for cand, task, score, verdict, fj in rows:
        if score is not None: obs.append((cand, task, int(verdict == 'PASS'), score))
        f = json.loads(fj) if fj else {}
        if f.get('reference_score') is not None: ref[task].append(f['reference_score'])
    return obs, {t: float(np.median(v)) for t, v in ref.items() if np.median(v) > 0}


def win(score, ref):
    """A run against the human reference: 1 above it, 0 below it, 1/2 within TIE_EPS of it."""
    return 1.0 if score > ref + TIE_EPS else 0.0 if score < ref - TIE_EPS else 0.5


def rasch(mi, ti, y, nm, nt):
    """Penalised ML of P(pass) = sigmoid(theta_m - beta_t), one term per run, penalty LAM/2 (sum theta^2 + sum beta^2).
    Newton's method with step halving; the objective is strictly concave. Returns (theta, beta) in logits."""
    x = np.zeros(nm + nt)
    obj = lambda x: np.sum(y * log_expit(x[mi] - x[nm + ti]) + (1 - y) * log_expit(x[nm + ti] - x[mi])) - LAM / 2 * x @ x
    for _ in range(200):
        q = expit(x[mi] - x[nm + ti]); w = q * (1 - q)
        g = np.concatenate([np.bincount(mi, y - q, nm), -np.bincount(ti, y - q, nt)]) - LAM * x
        if np.abs(g).max() < 1e-11: break
        H = np.diag(np.concatenate([np.bincount(mi, w, nm), np.bincount(ti, w, nt)]) + LAM)   # minus the Hessian
        C = np.zeros((nm, nt)); np.add.at(C, (mi, ti), w)
        H[:nm, nm:], H[nm:, :nm] = -C, -C.T
        step, f0 = np.linalg.solve(H, g), obj(x)
        while obj(x + step) < f0 and np.abs(step).max() > 1e-12: step /= 2
        x = x + step
    return x[:nm], x[nm:]


def pass_eci(obs):
    """The leaderboard fit. Per model: (ECI, 90% low, 90% high, tasks); plus every model's strength and every task's
    difficulty in logits, and PASS_ZERO's strength."""
    M, T = list(dict.fromkeys(o[0] for o in obs)), sorted({o[1] for o in obs})
    assert PASS_ZERO in M, f'{PASS_ZERO} has no scored runs'
    mi, ti = np.array([M.index(o[0]) for o in obs]), np.array([T.index(o[1]) for o in obs])
    y, z = np.array([o[2] for o in obs], float), M.index(PASS_ZERO)
    th, b = rasch(mi, ti, y, len(M), len(T))
    cols, draws = [np.flatnonzero(ti == k) for k in range(len(T))], []
    for seed in range(BOOT):   # a draw is a set of task columns, a task drawn twice being two columns
        pick = np.random.default_rng(seed).integers(0, len(T), len(T))
        idx = np.concatenate([cols[k] for k in pick])
        d, _ = rasch(mi[idx], np.repeat(np.arange(len(T)), [len(cols[k]) for k in pick]), y[idx], len(M), len(T))
        draws.append(on_scale(d, d[z]))
    point, (lo, hi) = on_scale(th, th[z]), np.percentile(draws, [5, 95], axis=0)
    out = {m: (round(float(point[i]), 2), round(float(lo[i]), 2), round(float(hi[i]), 2), len({o[1] for o in obs if o[0] == m}))
           for i, m in enumerate(M)}
    return out, dict(zip(M, th)), dict(zip(T, b)), th[z]


def task_difficulty(obs, ref, theta):
    """Per task (database name): (D, 90% low, 90% high) in logits, the posterior of its pass threshold b_t given who
    passes and who beats the human reference, strengths held at theta (see the docstring); and the fitted (a, DELTA, TAU)."""
    T = sorted({o[1] for o in obs})
    th, ti = np.array([theta[o[0]] for o in obs]), np.array([T.index(o[1]) for o in obs])
    y = np.array([o[2] for o in obs], float)
    w = np.array([win(o[3], ref[o[1]]) if o[1] in ref else np.nan for o in obs]); has = ~np.isnan(w); w = np.nan_to_num(w)
    R = np.array([t in ref for t in T])
    tbar = float(np.mean(list(theta.values()))); G, dx = tbar + GRID, GRID[1] - GRID[0]
    A = (ti[None, :] == np.arange(len(T))[:, None]).astype(float)   # task x run
    Z = th[:, None] - G[None, :]                                    # run x grid: strength minus threshold
    LP = A @ (y[:, None] * log_expit(Z) + (1 - y)[:, None] * log_expit(-Z))   # log L_pass(b)
    prior = -0.5 * ((G - tbar) / PRIOR_SD) ** 2 - np.log(PRIOR_SD * np.sqrt(2 * np.pi))
    # log L_win(h) + log N(h; mean theta, PRIOR_SD^2); rows of tasks without a reference are unused
    LH = lambda a: (A * has) @ (w[:, None] * log_expit(a * Z) + (1 - w)[:, None] * log_expit(-a * Z)) + prior
    DIF = G[:, None] - G[None, :]                                   # b - h

    def kernel(d, tau):   # N(b - h; d, tau^2) on the grid, b by row
        K = (DIF - d) / tau; K *= K; K *= -0.5; np.exp(K, out=K); K /= tau * np.sqrt(2 * np.pi)
        return K

    def loglik(p):   # sum over tasks with a reference of log of the double integral over b and h
        a, d, tau = np.exp(p[0]), p[1], np.exp(p[2])
        lh, lp = LH(a)[R], LP[R]; mh, mp = lh.max(1), lp.max(1)
        v = np.exp(lh - mh[:, None]) @ kernel(d, tau).T
        return float(np.sum(np.log(np.sum(np.exp(lp - mp[:, None]) * v, 1)) + mh + mp) + R.sum() * 2 * np.log(dx))

    fit = minimize(lambda p: -loglik(p), [np.log(.5), 2.8, np.log(2)], method='L-BFGS-B',
                   bounds=[(np.log(1e-3), np.log(1e3)), (-30, 30), (np.log(.25), np.log(30))])
    assert fit.success, fit.message
    a, d, tau = np.exp(fit.x[0]), fit.x[1], np.exp(fit.x[2])
    K, lh, out = kernel(d, tau), LH(a), {}
    for k, t in enumerate(T):
        if R[k]: post = np.exp(LP[k] - LP[k].max()) * (K @ np.exp(lh[k] - lh[k].max()))
        else: post = np.exp(LP[k] + prior - (LP[k] + prior).max())
        cdf = np.cumsum(post); cdf /= cdf[-1]   # the mass up to the right edge of each grid cell
        out[t] = tuple(float(v) for v in np.interp([.5, .05, .95], cdf, G + dx / 2))
    return out, (float(a), float(d), float(tau)), -fit.fun


def eci_score(rows):
    """The raw-score fit (--json only). Per respondent: (ECI, 90% low, 90% high, tasks); plus the number of bootstrap
    draws kept and dropped, the pinned task and the task curves."""
    sc, ref = defaultdict(list), defaultdict(list)
    for cand, task, score, verdict, fj in rows:
        if score is not None: sc[(cand, task)].append(score)
        f = json.loads(fj) if fj else {}
        if f.get('reference_score') is not None: ref[task].append(f['reference_score'])
    recs = [(m, t, float(np.mean(v)) / 100) for (m, t), v in sc.items()]
    recs += [('reference', t, float(np.median(v)) / 100) for t, v in ref.items() if np.median(v) > 0]
    df = pd.DataFrame(recs, columns=['Model', 'benchmark', 'performance'])
    df['model_id'], df['benchmark_id'] = df['Model'], df['benchmark']
    counts = df['benchmark'].value_counts()
    pinned = sorted(counts.index, key=lambda t: (-counts[t], t))[0]
    kw = dict(anchor_benchmark=pinned, anchor_model_low=PASS_ZERO, anchor_eci_low=float(PASS_ZERO_VALUE),
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

# US$ per million tokens, list prices found 2026-10-09: (output, cache read).
# DeepSeek is its off-peak rate (peak hours double it). Sources: eesel.ai and yottalabs.ai (GPT-6 Astra, GPT-6.1 Sol, Kimi K3,
# DeepSeek), anotherwrapper.com and QwenCloud (Qwen implicit cache), pricepertoken.com (GLM), anotherwrapper.com (Muse output). Muse lists no cache price; its cache read is the $0.15 that the preview's LiteLLM gateway charged (owner, 2026-10-09).
PRICE = {'astra': (50.00, 1.00), 'sol': (10.00, 0.10), 'k3': (15.00, 0.30), 'qwen': (6.00, 0.25),
         'ds': (0.60, 0.003), 'glm': (4.40, 0.26), 'muse': (4.25, 0.15)}


def usd(m, total, output):
    """Owner's approximation (2026-10-09): output tokens at the output price plus every token at the cache-read price,
    as if all input were a cache hit. Tool-reported total tokens count cached input differently per tool, so they enter
    only here, never as an axis."""
    if output is None: return (total or 0) / 1e6   # bin/fcs2_db_from_platform.py stores US$ directly (as micro-dollars)
    if m not in PRICE: return 0.0
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


def strength(y, b):
    """The one strength theta (logits) that maximises sum [y log sigmoid(theta - b) + (1 - y) log(1 - sigmoid(theta - b))]
    - LAM theta^2 / 2 with the difficulties b fixed: the root of its derivative, which falls in theta."""
    y, b = np.asarray(y, float), np.asarray(b, float)
    return brentq(lambda x: np.sum(y - expit(x - b)) - LAM * x, -200, 200, xtol=1e-13)


def scaling(db, beta, theta0):
    """{model id: [[US$ budget, ECI, 90% low, 90% high, share of runs still going], ...]}; spend from usd().
    beta: the leaderboard fit's task difficulties (logits, by database task name); theta0: PASS_ZERO's strength there."""
    info = {r: (c, t, v == 'PASS') for r, c, t, s, v in db.execute('''select r.id, cd.name, t.name, r.display_score, r.display_verdict from cells ce
        join runs r on r.id = ce.run_id join candidates cd on cd.id = ce.candidate_id join tasks t on t.id = ce.task_id''') if s is not None and c not in HIDDEN}
    pts = {(r, sid): (tt, ot) for r, sid, tt, ot in db.execute('select run_id, submission_id, total_tokens, output_tokens from score_points')}
    end = {}   # a run's spend at its end: usd() at its last submission with a score point, 0 if none
    for r, sid in db.execute('select run_id, id from submissions order by run_id, ordinal'):
        if r in info and (r, sid) in pts: end[r] = usd(MODEL[info[r][0]][0], *pts[(r, sid)])
    out = {}
    for c in sorted({v[0] for v in info.values()}, key=lambda c: MODEL[c][0]):
        runs = [r for r in info if info[r][0] == c]; tasks = sorted({info[r][1] for r in runs}); ends = [end.get(r, 0) for r in runs]
        if not max(ends): continue   # no spend reported: no curve
        rng, curve = np.random.default_rng(3), []
        # budgets are rounded up to the stored precision before use, so each point is exact at its stored budget
        for B in np.ceil(np.geomspace(1e-3, max(ends), SCALE_POINTS) * 1e5) / 1e5:
            # at B a run has passed only if it has ended within B with verdict PASS (Qiuyang, 2026-10-14)
            y = {t: [float(info[r][2] and end.get(r, 0) <= B) for r in runs if info[r][1] == t] for t in tasks}
            eci = lambda ts: float(on_scale(strength([v for t in ts for v in y[t]], [beta[t] for t in ts for _ in y[t]]), theta0))
            lo, hi = np.percentile([eci(rng.choice(tasks, len(tasks))) for _ in range(SCALE_BOOT)], [5, 95])
            curve.append([float(B), round(eci(tasks), 2), round(float(lo), 2), round(float(hi), 2), round(float(np.mean([e > B for e in ends])), 2)])
        out[MODEL[c][0]] = curve
    return out


def hidden_json(generated, hidden):   # one run per line, so a refresh diffs by run
    head = {'note': 'Runs of models kept off the site (HIDDEN in bin/fcs2_runs_from_db.py), in the columns of RUNS in assets/js/fcs2-data.js. '
            'Timeouts score 0; unscored runs are left out. Not shown on any page.',
            'generated_at': generated, 'models': {MODEL[c][0]: MODEL[c][1] for c in MODEL if c in HIDDEN},
            'columns': ['model', 'domain', 'task', 'score', 'passed']}
    return json.dumps(head, ensure_ascii=False, indent=1)[:-2] + ',\n "runs": [\n' + ',\n'.join('  ' + json.dumps(r, ensure_ascii=False) for r in hidden) + '\n ]\n}\n'


db = sqlite3.connect(sys.argv[1])
generated = db.execute('select generated_at from release').fetchone()[0]
rows = db.execute('''select c.name, t.name, r.display_score, r.state, r.display_verdict from cells ce
  join runs r on r.id = ce.run_id join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id
  order by c.ordinal, t.ordinal''').fetchall()
missing = {r[1] for r in rows} - set(TASK)
assert not missing, f'unmapped tasks: {missing}'
assert not {c for c, *_ in rows} - set(MODEL), 'unmapped model'
MODEL = {c: v for c, v in MODEL.items() if c in {r[0] for r in rows} or c == PASS_ZERO}   # only the models this database has

runs = []
for cand, task, score, state, verdict in rows:
    if score is None or cand in HIDDEN: continue
    folder, short = TASK[task]
    runs.append([MODEL[cand][0], SHOWN.get(folder, folder), short or task.split(' — ')[0], round(score, 2), int(verdict == 'PASS')])
dropped = Counter(r[3] for r in rows if r[2] is None and r[0] not in HIDDEN)
# the hidden models' runs in RUNS's columns, for fits made outside this script: Kimi K2.7 is the FECI 0 point but not on the
# site (Qiuyang, 2026-10-14). _data/ is never published as a file, and no page reads this one.
hidden = [[MODEL[c][0], SHOWN.get(TASK[t][0], TASK[t][0]), TASK[t][1] or t.split(' — ')[0], round(s, 2), int(v == 'PASS')]
          for c, t, s, st, v in rows if s is not None and c in HIDDEN]


def trajectories(db):
    """One entry per scored run, for the overview's run curve and the task pages:
    [model id, task short name, final score, passed, US$ at the run's end, hours, [[US$ spent, dev score], ...]].
    Each point is a development submission in order; its spend is usd() at that submission; failed ones score 0."""
    pts = {(r, sid): (sc, tt, ot) for r, sid, sc, tt, ot in db.execute('select run_id, submission_id, score, total_tokens, output_tokens from score_points')}
    subs = defaultdict(list)
    for r, sid, kind in db.execute('select run_id, id, kind from submissions order by run_id, ordinal'): subs[r].append((sid, kind))
    out = []
    for r, c, t, s, v, el in db.execute('''select r.id, cd.name, t.name, r.display_score, r.display_verdict, r.elapsed_seconds from cells ce join runs r on r.id = ce.run_id
        join candidates cd on cd.id = ce.candidate_id join tasks t on t.id = ce.task_id order by r.id'''):
        if s is None or c in HIDDEN: continue
        m = MODEL[c][0]
        seq = [[round(usd(m, pts[(r, sid)][1], pts[(r, sid)][2]), 4), round(pts[(r, sid)][0], 1)] for sid, kind in subs[r] if kind == 'train' and (r, sid) in pts]
        end = max((usd(m, p[1], p[2]) for (rr, _), p in pts.items() if rr == r), default=0)
        out.append([m, TASK[t][1] or t.split(' — ')[0], round(s, 1), int(v == 'PASS'), round(end, 4), round((el or 0) / 3600, 2), seq])
    return out


short = lambda t: TASK[t][1] or t.split(' — ')[0]   # database task name -> the name RUNS and the page use
assert len({short(t) for t in {r[1] for r in rows}}) == len({r[1] for r in rows}), 'two tasks share a short name'


def task_reference(db):
    """Per task short name: the authors' reference score (median reference_score over its runs, left out when 0)."""
    ref = defaultdict(list)
    for t, fj in db.execute('select t.name, r.feedback_json from cells ce join runs r on r.id = ce.run_id join tasks t on t.id = ce.task_id'):
        f = json.loads(fj) if fj else {}
        if f.get('reference_score') is not None: ref[short(t)].append(f['reference_score'])
    return {t: round(float(np.median(v)), 1) for t, v in sorted(ref.items()) if np.median(v) > 0}


def task_fits(D, fit, ref, theta0):
    """TFIT, DIFF and DIFF_FIT from task_difficulty()'s output, on the ECI scale. TFIT[task] = [D, slope], the pass curve
    P(pass) = 1 / (1 + exp(-slope (ECI - D))); DIFF[task] = [D, 90% low, 90% high, passes, wins, runs], counting the runs
    the page shows (RUNS), wins null without a reference."""
    a, d, tau = fit
    TFIT, DIFF = {}, {}
    for t, v in D.items():
        rs = [(s, p) for c, tt, s, st, p in rows if tt == t and s is not None and c not in HIDDEN]
        e = [round(float(x), 2) for x in on_scale(v, theta0)]
        TFIT[short(t)] = [e[0], round(1 / PASS_UNIT, 4)]
        DIFF[short(t)] = e + [sum(p == 'PASS' for s, p in rs), round(sum(win(s, ref[t]) for s, p in rs), 1) if t in ref else None, len(rs)]
    return dict(sorted(TFIT.items())), dict(sorted(DIFF.items())), {'a': round(a, 3), 'delta': round(PASS_UNIT * d, 2), 'tau': round(PASS_UNIT * tau, 2)}


def task_checks(db):
    """Per task short name: what its judge checks, from the run feedback's check labels (suite/workload/metric, or a bare
    metric for an aggregate): {'metrics': [metric names in first-seen order], 'final': distinct final-suite workloads}.
    A run passes only when every check on the final suite passes; the thresholds themselves are not in the database."""
    out = {}
    for t, fj in db.execute('select t.name, r.feedback_json from cells ce join runs r on r.id = ce.run_id join tasks t on t.id = ce.task_id where r.feedback_json is not null'):
        o = out.setdefault(TASK[t][1] or t.split(' — ')[0], {'metrics': [], 'final': set()})
        for ch in json.loads(fj).get('checks', []):
            p = ch['label'].split('/')
            if p[-1] not in o['metrics']: o['metrics'].append(p[-1])
            if len(p) == 3 and p[0] == 'final': o['final'].add(p[1])
    return {t: {'metrics': o['metrics'], 'final': len(o['final'])} for t, o in sorted(out.items())}


def descriptions():
    """Task short name -> description, from bin/fcs2_descriptions.tsv (tab-separated: short, description)."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fcs2_descriptions.tsv')
    rows = [l.rstrip('\n').split('\t') for l in open(path, encoding='utf-8')][1:]
    return {r[0]: r[1] for r in rows if len(r) == 2}


def pass_rate(runs):
    """Per model: [percent PASS, runs that pass, runs]."""
    out = {}
    for m in sorted({r[0] for r in runs}):
        p = [r[4] for r in runs if r[0] == m]
        out[m] = [round(100 * sum(p) / len(p), 1), sum(p), len(p)]
    return out

js_path = 'assets/js/fcs2-data.js'
when = datetime.fromisoformat(generated[:19])
models = [MODEL[c] for c in MODEL if c not in HIDDEN]
fit_rows = db.execute('''select c.name, t.name, r.display_score, r.display_verdict, r.feedback_json from cells ce
  join runs r on r.id = ce.run_id join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id''').fetchall()
obs, task_ref = fit_data(fit_rows)
E, THETA, BETA, theta0 = pass_eci(obs)
D, dfit, dll = task_difficulty(obs, task_ref, THETA)
TFIT, DIFF, DIFF_FIT = task_fits(D, dfit, task_ref, theta0)
SC, CO = scaling(db, BETA, theta0), cost(db)
REF = task_reference(db)
CHECKS = task_checks(db)
eci_js = {MODEL[c][0]: list(E[c]) for c in MODEL if c not in HIDDEN}
zero = MODEL[PASS_ZERO][1]
block = (f'// One entry per scored run in the preview results database of {when:%Y-%m-%d} (bin/fcs2_runs_from_db.py):\n'
         f'// model, domain, task, final score (0-100, the task\'s own scale), passed (1 = verdict PASS). Timeouts score 0; {sum(dropped.values())} unscored runs are left out' + ''.join(f'; {MODEL[c][1]} is left out (only the ECI 0 point)' for c in sorted(HIDDEN)) + '.\n'
         f'const RUNS = {json.dumps(runs, ensure_ascii=False)}.map(([m, d, t, s, p]) => ({{m, d, t, s, p}}));\n'
         'const MODELS = [\n' + ''.join(f"  {{id:'{i}', name:'{n}', short:'{s}', h:'{h}', lab:'{l}'}},\n" for i, n, s, h, l in models) + '];\n'
         f"const UPDATED = '{when:%B} {when.day}, {when.year}';\n"
         f"// Pass rate per model: [percent, runs that pass, runs].\nconst PASS = {json.dumps(pass_rate(runs))};\n"
         f"// ECI per model: [point, 90% low, 90% high, tasks], fitted on pass and fail: P(model passes task) = 1 / (1 + exp(-(strength - difficulty))), every run of every model one observation ({zero} too), L2 penalty {LAM:g}; ECI = {PASS_ZERO_VALUE:g} + {PASS_UNIT:g} x (strength - {zero}'s strength), strengths in logits (ECI_LOW, ECI_LOW_VALUE, ECI_UNIT); the interval resamples tasks ({BOOT} bootstrap draws).\n"
         f"const ECI = {json.dumps(eci_js)};\nconst ECI_LOW = '{MODEL[PASS_ZERO][0]}', ECI_LOW_NAME = '{zero}', ECI_LOW_VALUE = {PASS_ZERO_VALUE:g}, ECI_UNIT = {PASS_UNIT:g};\n"
         f"// Test-time scaling per model: [US$ budget per run, ECI, 90% low, 90% high, share of runs still going]; at a budget a run has passed only if it ended within it with verdict PASS, task difficulties held at the ECI fit (see the converter's docstring).\nconst SCALE = {json.dumps(SC, separators=(',', ':'))};\n"
         f"// Cost per model: [mean US$ per scored run, runs]; output tokens x output price + every token x cache-read price (PRICE above).\nconst COST = {json.dumps(CO)};\nconst PRICE = {json.dumps(PRICE)};\n"
         f"// Every scored run: [model, task, final score, passed, US$ at end, hours, [[US$, dev score] per development submission]].\nconst TRAJ = {json.dumps(trajectories(db), separators=(',', ':'), ensure_ascii=False)};\n"
         f"// Per task: the authors' reference score, the median over the task's runs (tasks without one are left out).\nconst REF = {json.dumps(REF, ensure_ascii=False)};\n"
         f"// Per task: its pass curve [D, slope], P(pass) = 1 / (1 + exp(-slope (ECI - D))), with D from DIFF.\nconst TFIT = {json.dumps(TFIT, ensure_ascii=False)};\n"
         f"// Per task: [D, 90% low, 90% high, passes, wins, runs] in RUNS. D, the difficulty, is the ECI at which a model passes half the time: the posterior median of the task's pass threshold given who passes and, through an easier beat-the-human threshold (DIFF_FIT), whose final score beats the human reference (a win; a tie is half; wins is null without a reference).\nconst DIFF = {json.dumps(DIFF, ensure_ascii=False)};\n"
         f"// The difficulty fit's shared parameters, by marginal likelihood over the tasks with a reference: a, the slope of P(win) over that of P(pass); delta and tau, the mean and sd of the pass threshold minus the beat-the-human threshold, in ECI points.\nconst DIFF_FIT = {json.dumps(DIFF_FIT)};\n"
         f"// Per task: the metrics its judge checks and the number of hidden final workloads; a run passes only when every check passes on every final workload.\nconst CHECKS = {json.dumps(CHECKS, ensure_ascii=False, separators=(',', ':'))};\n"
         f"// Task descriptions from the paper repo (bin/fcs2_descriptions.tsv).\nconst DESC = {json.dumps(descriptions(), ensure_ascii=False)};\n")
js = open(js_path, encoding='utf-8').read()   # read late: the fits above take a while
BEGIN, END = '// BEGIN converter block (bin/fcs2_runs_from_db.py writes everything up to END)\n', '// END converter block\n'
assert js.count(BEGIN) == 1 and js.count(END) == 1, 'converter markers not found'
js = js[:js.index(BEGIN) + len(BEGIN)] + block + js[js.index(END):]
open(js_path, 'w', encoding='utf-8').write(js)
hid_path = '_data/fcs2_runs_hidden.json'
open(hid_path, 'w', encoding='utf-8').write(hidden_json(generated, hidden))
print('PASS', pass_rate(runs))
print('ECI', eci_js)
print('DIFF_FIT', DIFF_FIT, f'(logits: a {dfit[0]:.4f}, delta {dfit[1]:.4f}, tau {dfit[2]:.4f}; log marginal likelihood {dll:.3f})')
print(f'{len(runs)} runs, {len({r[2] for r in runs})} tasks, {len(models)} models; dropped {dict(dropped)}; generated {generated}')

for a in sys.argv[2:]:
    if a.startswith('--json='):
        S, nboot, nbad, pinned, curves = eci_score(fit_rows)   # the raw-score fit, kept for the paper only
        out = {'source': sys.argv[1], 'generated_at': generated, 'runs_columns': ['model', 'domain', 'task', 'score', 'passed'], 'runs': runs,
               'models': [dict(zip(['id', 'name', 'short', 'harness', 'lab'], m)) for m in models], 'dropped': dict(dropped),
               'pass': pass_rate(runs), 'cost_usd': CO, 'price_per_mtok': PRICE, 'eci': eci_js, 'eci_unit': PASS_UNIT,
               'eci_low': [PASS_ZERO, PASS_ZERO_VALUE], 'eci_penalty': LAM, 'eci_boot': BOOT,
               'scaling_columns': ['usd', 'eci', 'lo90', 'hi90', 'share_running'], 'scaling': SC,
               'task_reference': REF, 'task_fit_columns': ['difficulty', 'slope'], 'task_fit': TFIT,
               'task_difficulty_columns': ['difficulty', 'lo90', 'hi90', 'passes', 'wins', 'runs'], 'task_difficulty': DIFF,
               'difficulty_fit': DIFF_FIT, 'task_checks': CHECKS,
               'feci_score_columns': ['eci', 'lo90', 'hi90'], 'feci_score': {MODEL[c][0]: list(S[c][:3]) for c in MODEL if c not in HIDDEN},
               'feci_score_anchors': {'reference': HUMAN_VALUE, PASS_ZERO: PASS_ZERO_VALUE}, 'feci_score_boot_kept': nboot,
               'feci_score_boot_dropped': nbad, 'feci_score_pinned_task': pinned, 'feci_score_reference_tasks': S['reference'][3],
               'task_fit_score_columns': ['difficulty', 'slope'],   # expected score = 100 / (1 + exp(-slope (feci_score - difficulty)))
               'task_fit_score': dict(sorted({short(b): [round(float(e), 2), round(float(k), 4)]
                                              for b, e, k in zip(curves['benchmark'], curves['edi'], curves['discriminability_scaled'])}.items()))}
        json.dump(out, open(a[7:], 'w'), indent=1)
        print('wrote', a[7:])
