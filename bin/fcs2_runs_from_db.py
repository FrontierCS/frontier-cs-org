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

FCI, the leaderboard's main number, and FDI (the FrontierCS Difficulty Index), the task difficulty, come from one model
(Qiuyang, 2026-10-14), fitted to every scored run of every model (hidden models too: they are respondents, never shown).
A run passes only when it beats the human reference on every workload of every metric its task checks, and each metric
has its own difficulty. The per-metric counts come from PASSBY in assets/js/fcs2-checks.js and, for hidden models,
_data/fcs2_checks_hidden.json, which bin/fcs2_checks_from_platform.py must refresh before this script runs. Keys of
development workloads ('dev/...', which Yannakakis lists) are dropped: PASS is judged on the hidden final workloads. A
metric is a check key's stem, the text after its last '/', with its counts summed over its keys; a run beats it (z = 1)
when it beats every workload, and a run without counts (it failed before the hidden evaluation) beats none. The script
stops unless PASS is exactly "every metric beaten" for every run. Metrics that pass and fail together cannot be told
apart by the data, and counting each separately makes a task look harder than it is (Qiuyang): metrics whose outcomes
over the task's runs differ in at most GROUP_TOL runs are linked, a group is a connected set of them (recomputed from
the data on every run), and the model treats each group as one item that a run beats when it beats every member. A run's
final score counts by how far above the human reference r_t it is when the run passes, by how far below it when it does not pass and falls short, and as at least level when it does not pass but scores above r_t (rule E, Qiuyang, 2026-10-16): its margin over the human reference r_t it is (r_t
the median reference_score over the task's runs; 0 or less: REF_DEFAULT's value, else the task has none), in units of
the task's score spread, at least the median spread over tasks: y = (score - r_t) / unit_t, unit_t = max(sd_t, c), sd_t
the sd of the task's final scores strictly between 0 and 100 (all of them when fewer than 3), c the median sd_t over the
tasks with a reference. A run that does not pass contributes its metric groups and its margin: how far short it fell, or, above r_t, only that it got there, P(y' >= 0), its metrics not confirming more (rule E, Qiuyang, 2026-10-16). Tasks in OFF_FIT_DOMAINS (Security, until its tasks are fixed) are left out of every fit too. A run the model's provider refused (feedback_json.refusal: no final submission came) is left out of every fit, FCI, FDI and test-time scaling alike; the page still lists it (Qiuyang, 2026-10-16). The final score comes from the same
measurements as the metrics, so a run's metric groups and its margin share one run effect u ~ N(0, SIGMA_U^2). With
theta_m the model's strength in logits (prior N(0, 1/LAM), LAM = 0.35 as in the site's in-browser TDIFF), a run's
likelihood is the integral over u, by Gauss-Hermite quadrature (64 nodes; 24 stall Newton near SIGMA_U = 3.7), of prod_j
sigmoid(theta_m + u - beta_tj)^z (1 - sigmoid(.))^(1 - z), j over the task's metric groups, times, for a run that
passes, or does not pass and scores below r_t, the normal density of y with mean a (theta_m + u - h_t) and sd S_E, and
for a run that does not pass but scores above r_t, the probability that y is at least 0; h_t is the task's beat-the-human level. Priors: h_t ~ N(0, PRIOR_SD^2) and beta_tj ~ N(h_t + DELTA,
TAU^2); a task without a reference has no margin and no h_t, and beta_tj ~ N(0, PRIOR_SD^2). For given SIGMA_U, a,
DELTA, TAU and S_E, the strengths and every task's parameters are fitted together at their joint posterior mode
(Newton's method, the strengths' block solved through the Schur complement); SIGMA_U, a, DELTA, TAU and S_E maximise the
profile log marginal likelihood: per task the Laplace approximation over its parameters at that mode, summed, plus the
strengths' log prior (Nelder-Mead from two starts; all but DELTA on a log scale; SIGMA_U at most 7; a cold start eases
S_E in from 16 times its value). A strength is shown as FCI = PASS_ZERO_VALUE + PASS_UNIT * (theta_m - theta of
PASS_ZERO), the constants at the top. FCI's 90% interval resamples tasks with replacement (BOOT draws, seeds 0..BOOT-1),
refits the strengths and every task's parameters with the hyperparameters held at the full fit, maps each draw the same
way and takes the 5th and 95th percentiles; a draw whose mode is not found is left out and counted. D, a task's
difficulty, is the strength at which a run beats every metric half the time, integral prod_j sigmoid(D + u - beta_tj)
N(u; 0, SIGMA_U^2) du = 1/2, with beta at the mode. Its 90% interval comes from IS_DRAWS draws of the task's parameters
from the Laplace Gaussian (strengths held), weighted by the exact posterior over the Gaussian's density (the posterior
of a metric nobody beats is one-sided): the weighted 5th and 95th percentiles of D. TFIT's slope (--json only) is that
of the logistic matched to the pass curve at D, 4 dP(pass)/dtheta there. All are mapped to FCI points like the
strengths. GROUPS gives each task's metric-group difficulties at the mode, on the FCI scale, so the task chart can draw
the model's own pass curve, which crosses 1/2 at the task's FDI (the script checks this on the rounded values, to 0.06
points). TFIT (the logistic matched to that curve at FDI) and PROG are written to --json only (task_fit,
progress_curve). PROG gives each task a progress curve (Qiuyang): the expected share of the task's hidden checks a model
beats (summed over its final workloads; a run without counts beats none), E[share | theta] = f_t + (1 - f_t) integral
sigmoid(kappa_t (theta - g_t) + u) N(u; 0, SIGMA_U^2) du, with a floor f_t in [0, 0.95], a slope kappa_t (log kappa_t ~
N(0, PROG_K_SD^2)) and g_t (weak prior N(0, PRIOR_SD^2)), fitted by fractional-logit quasi-likelihood with strengths and
SIGMA_U held at the joint fit.

The raw-score fit that the leaderboard showed before 2026-10-14 runs only with --json (feci_score, task_fit_score). It is
Epoch AI's own ECI code (bin/eci_fitting.py, vendored from epoch-research/eci-public): every task is one benchmark with
score/100 = sigmoid(slope_t * (capability_m - difficulty_t)), fitted by bounded least squares with Epoch's defaults
(L2 penalty 0.1 over the parameter count, scores clipped to [0.001, 0.999]). Epoch pins one benchmark's slope to 1; here
that is the task with the most observations (ties: first by name). Respondents are the models (mean score over their runs
on a task) and the authors' reference r_t (tasks without one are left out). Capabilities are mapped linearly so that
the authors' reference is HUMAN_VALUE and PASS_ZERO is PASS_ZERO_VALUE. Its 90% interval follows Epoch's bootstrap:
each respondent's task results are resampled with replacement and the fit is redone from the central solution (BOOT
draws); Epoch's code raises when a draw puts the anchors in the wrong order, and those draws are left out and counted.

Test-time scaling (SCALE): the same model with every task's parameters held at the leaderboard fit (Qiuyang,
2026-10-14). At a budget B of US$ (usd() below), a run that has ended within B (its spend at the end is at most B)
contributes its metric groups and its margin; a run still going is scored as if it timed out at B, as a timeout scores 0:
no group beaten, and with a reference a final score of 0, its margin counted as it is (Qiuyang, 2026-10-16; before, it
counted no margin, so a run that ended below the reference could pull a curve down). A run's evidence then only improves
as B grows, and the likelihood is monotone in it, so a curve never falls. FCI(model, B) is the strength that maximises the model's likelihood under the same prior, so it equals the
leaderboard FCI at full budget; it is mapped with the leaderboard's theta of PASS_ZERO. Its 90% interval resamples the
model's tasks (SCALE_BOOT draws, task parameters held).

Pass rate is the share of scored runs whose verdict is PASS: the final submission meets the task's
beat-the-reference criteria on every workload. It is a plain count, so it has no interval.
"""
import json, re, sqlite3, sys
from collections import Counter, defaultdict
import numpy as np
from scipy.optimize import minimize
from scipy.special import expit, log_expit, logsumexp, log_ndtr
import pandas as pd
import os
os.environ.setdefault('TQDM_DISABLE', '1')   # Epoch's bootstrap bar, once per draw here
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eci_fitting import fit_eci_model
from datetime import datetime

# The FCI scale (Qiuyang, 2026-10-14): FCI = PASS_ZERO_VALUE + PASS_UNIT * (theta - theta of PASS_ZERO), theta in logits.
# FCI, SCALE, DIFF, GROUPS and DIFF_FIT all follow from these three.
PASS_ZERO = 'Kimi K2.7 Code'   # the 0 point; it is hidden (HIDDEN below) but stays in every fit
PASS_ZERO_VALUE = 0
PASS_UNIT = 10                 # FCI points per logit (Qiuyang, 2026-10-14; was 1)
DEC = max(0, int(np.ceil(2 - np.log10(PASS_UNIT) - 1e-9)))   # decimals of FCI points: a hundredth of a logit or finer, 1 at 10 per logit
TIE_EPS = 0                    # a final score within TIE_EPS of the human reference is half a win; 0: only an exact tie
# the human reference (by short name) where the database has none: Structured LWE by Qiuyang's decision (2026-10-14);
# ParButterfly and RegionsSort as measured in runs of the human reference alone on the runs' task version
# (run_01M4RVT5V4D3SR83YXW0B4EYP6, run_01M4HGFJEHVPJN04RVH9WEPYV1; Qiuyang, 2026-10-15)
OFF_FIT_DOMAINS = {'Security'}   # Qiuyang, 2026-10-16: off FCI, FDI and test-time scaling until their tasks are fixed; the pages still list their runs
REF_DEFAULT = {'Structured LWE': 100, 'ParButterfly': 30.51, 'RegionsSort': 50.26}

# database display name -> (domain folder, paper short name or None)
TASK = {
    'Access-Pattern Rewriting': ('Programming Language', 'Glenside'),
    'Search Strategy for Concolic Testing': ('SE', 'CREST'),   # scored from 2026-10-15: Burnim and Sen, ASE 2008; Software Engineering (Qiuyang)
    'Binary Fuse Filter Construction and Lookup': ('Theory', None),
    'CKKS Precision Propagation at 2,048 Slots': ('Crypto', 'CKKS noise'),
    'Exact Sequence Alignment': ('Bioinformatics', None),
    'Go1 Joystick Policy Training': ('Robotics', 'MuJoCo Playground'),
    'Private Set List Decoding': ('Crypto', 'QuarterPIR'),
    'Register-aware Branch Prediction': ('Arch', 'RUNLTS'),
    'Approximate-MIPS Query Stopping': ('Database', None),
    'Privilege Control for Tool-Using LLM Agents': ('Security', 'Progent'),   # renamed on the platform 2026-10-19 (was 'Argument-aware runtime privilege control')
    'BBQ bitmap traversal': ('Network', 'BBQ'),
    'Batch Local Counting': ('Database', 'SCOPE'),
    'Bounded EVM Path Prediction': ('Database', 'Seer'),
    'Closed-loop action sampling': ('Robotics', 'Diffusion Policy'),
    'Differentiable Population Statistics': ('Machine Learning', None),
    'Dynamic GPU Allocation': ('Network', 'Shockwave'),
    'E-Graph Invariant Restoration': ('Programming Language', 'egg'),
    'EVM State Checkpoints': ('Database', 'Spectrum'),
    'Exact DBSCAN Connectivity': ('HPC', 'Parallel DBSCAN'),
    'FARGO paper-aligned query core': ('Database', None),
    'Fixed-Length Clustered Sparse Multiplication': ('Arch', 'Clusterwise SpGEMM'),
    'Future Video Sampling': ('Machine Learning', 'Nano World Model'),
    'GPU Brute-Force k-NN Kernel Optimization': ('MLSys', 'knn kernel'),
    'GPU DBSCAN Kernel Optimization': ('MLSys', 'dbscan kernel'),
    'GPU IVF-PQ Search Kernel Optimization': ('MLSys', 'ivf_pq kernel'),
    'GPU K-Means Kernel Optimization': ('MLSys', 'kmeans kernel'),
    'GPU vLLM Serving Optimization': ('MLSys', 'Continuum'),   # shown as Continuum, in MLSys (Qiuyang, 2026-10-18)
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
    'Sparse Video Attention Policy': ('MLSys', 'SVG-EAR'),
    'Structured-LWE Public Witness Recovery': ('Crypto', 'Structured LWE'),
}
SHOWN = {'Arch': 'Architecture', 'Crypto': 'Cryptography', 'Programming Language': 'Programming Languages', 'SE': 'Software Engineering'}
short = lambda t: TASK[t][1] or t.split(' — ')[0]   # database task name -> the name RUNS and the page use

# database candidate name -> (id, shown name, short name for phones, harness, lab); order = legend order within a lab
MODEL = {
    'GPT-6 Astra': ('astra', 'GPT-6 Astra', 'GPT-6 Astra', 'Codex CLI', 'OpenAI'),
    'GPT-6.1 Sol': ('sol', 'GPT-6.1 Sol', 'GPT-6.1 Sol', 'Codex CLI', 'OpenAI'),
    'Muse Code - Muse Spark 1.3': ('muse', 'Muse Spark 1.3', 'Muse Spark 1.3', 'Muse Code', 'Meta'),
    'Kimi K3 (Modal)': ('k3', 'Kimi K3', 'Kimi K3', 'Kimi Code', 'Kimi'),
    'Kimi K2.7 Code': ('k27', 'Kimi K2.7', 'Kimi K2.7', 'Kimi CLI', 'Kimi'),   # shown as Kimi K2.7 (owner, 2026-10-14)
    'Qwen 3.8 Max Code': ('qwen', 'Qwen 3.8 Max', 'Qwen 3.8 Max', '', 'Qwen'),   # shown without 'Code' (owner, 2026-10-09)
    'DeepSeek V4.1 Flash (DSH)': ('ds', 'DeepSeek V4.1 Flash', 'DeepSeek V4.1 Flash', 'DeepSeek Harness', 'DeepSeek'),   # DSH, DeepSeek's open-source agent harness (Qiuyang, 2026-10-14)
    'GLM 5.3 (ZCode)': ('glm', 'GLM 5.3', 'GLM 5.3', 'ZCode', 'Z.ai'),
    'Claude Code · Opus 5.5 (Subscription, max effort)': ('opus', 'Claude Opus 5.5', 'Opus 5.5', 'Claude Code', 'Anthropic'),
    'Muse Code · Muse Wonder 1.0': ('wonder', 'Muse Wonder 1.0', 'Muse Wonder 1.0', 'Muse Code', 'Meta'),
    'Codex · Qwen 3.8 Max': ('qwen', 'Qwen 3.8 Max', 'Qwen 3.8 Max', 'Codex CLI', 'Qwen'),
    'Qwen Code CLI · Qwen 3.8 Max': ('qwen', 'Qwen 3.8 Max', 'Qwen 3.8 Max', 'Qwen Code', 'Qwen'),   # re-run on Qwen Code (Qiuyang, 2026-10-14)
    'GLM 5.3 Flash (ZCode)': ('glmf', 'GLM 5.3 Flash', 'GLM 5.3 Flash', 'ZCode', 'Z.ai'),
    'pi · Gemini 4': ('gemini', 'Gemini 4 Argon', 'Gemini 4 Argon', 'Pi', 'Google'),   # on the Pi agent harness (Qiuyang, 2026-10-16); shown as Gemini 4 Argon (owner, 2026-10-16)
    'Step Code - Step 5 Preview': ('step', 'Step 5 Preview', 'Step 5 Preview', 'Step Code', 'StepFun'),   # on StepFun's Step Code agent (Qiuyang, 2026-10-17)
}

HIDDEN = {'Kimi K2.7 Code'}                    # owner's call, 2026-10-09: off the leaderboard, kept in the fits (it is the FCI's 0 point)
for a in sys.argv[2:]:   # optional: --low='Model name=value' to try another 0 point
    if a.startswith('--low='): PASS_ZERO, PASS_ZERO_VALUE = a[6:].rsplit('=', 1)[0], float(a[6:].rsplit('=', 1)[1])


LAM = 0.35                       # the strengths' prior is N(0, 1/LAM), the penalty of the site's in-browser TDIFF
BOOT = 500
PRIOR_SD = 6                     # logits: prior sd of a task's beat-the-human level, or of its metric difficulties without a reference
GROUP_TOL = 0                    # metrics whose outcomes differ in at most GROUP_TOL runs are fitted as one group (below 0: no groups)
PROG_K_SD = 0.5                  # prior sd of a progress curve's log slope (per logit, centred on 1)
IS_DRAWS = 2000                  # importance-weighted posterior draws per task for the interval of its difficulty
GH_U, GH_W = np.polynomial.hermite.hermgauss(64)   # E f(u), u ~ N(0, 1), is the sum over nodes of exp(GH_LW) f(GH_U); 24 nodes stall Newton near s_u = 3.7
GH_U, GH_LW, LOG2PI = np.sqrt(2) * GH_U, np.log(GH_W / np.sqrt(np.pi)), np.log(2 * np.pi)
HUMAN_VALUE = 25                # the raw-score fit only (--json): the authors' reference is HUMAN_VALUE (owner, 2026-10-13)


def on_scale(theta, theta0):
    """Logits to FCI points, theta0 being PASS_ZERO's strength in the same fit."""
    return PASS_ZERO_VALUE + PASS_UNIT * (np.asarray(theta) - theta0)


def fit_data(rows):
    """The fits' data: one (model, task, passed, score) per scored run, hidden models included, and each task's
    reference r_t, the median reference_score over its runs; where that is 0 or less, REF_DEFAULT's value, else none."""
    obs, ref = [], defaultdict(list)
    for cand, task, score, verdict, fj in rows:
        if score is not None: obs.append((cand, task, int(verdict == 'PASS'), score))
        f = json.loads(fj) if fj else {}
        if f.get('reference_score') is not None: ref[task].append(f['reference_score'])
    out = {t: float(np.median(v)) for t, v in ref.items() if np.median(v) > 0}
    return obs, {**{t: float(REF_DEFAULT[short(t)]) for t in {r[1] for r in rows} if short(t) in REF_DEFAULT}, **out}


def win(score, ref):
    """A run against the human reference: 1 above it, 0 below it, 1/2 within TIE_EPS of it."""
    return 1.0 if score > ref + TIE_EPS else 0.0 if score < ref - TIE_EPS else 0.5


def passby():
    """PASSBY from bin/fcs2_checks_from_platform.py (run before this script): per task short name and model id, per check
    key, [hidden workloads on which the final submission beat the reference, in all]. The models on the site are in
    assets/js/fcs2-checks.js, the hidden ones in _data/fcs2_checks_hidden.json; the fit uses both."""
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    shown = json.loads(re.search(r'^const PASSBY = (.*);$', open(os.path.join(root, 'assets', 'js', 'fcs2-checks.js'), encoding='utf-8').read(), re.M).group(1))
    hidden = json.load(open(os.path.join(root, '_data', 'fcs2_checks_hidden.json'), encoding='utf-8'))['passby']
    return {t: {**shown.get(t, {}), **hidden.get(t, {})} for t in {**shown, **hidden}}


def metric_tasks(obs, ref, PB):
    """Per task (database name): its metric stems, their outcomes Z (run x metric), its metric groups, the models of
    its runs and their outcomes O (run x item). The items are the task's metric groups, then, with a reference, the
    margin of a passing run's final score over the human reference. A metric is a check key's stem, the text after its last '/' (Yannakakis's keys are per workload;
    'dev/' keys are dropped), with its counts summed over its keys; a run beats it (z = 1) when it beats every workload.
    A run without counts failed before the hidden evaluation and beats none. Metrics whose outcomes over the task's runs
    differ in at most GROUP_TOL runs are linked, a group is a connected set of them, and a run beats a group when it
    beats every member; with every run's PASS equal to all metrics beaten, it is also all groups beaten. With a reference r_t
    the outcome row ends [y, cen]: y = (score - r_t) / unit_t for a run that passes, unit_t = max(sd_t, c), sd_t the sd of the
    task's final scores strictly between 0 and 100 (all of them when fewer than 3), c the median sd_t over the tasks with a
    reference; cen 0 when the margin counts as it is (a run that passes, or one that does not pass and scores below r_t),
    1 for a run that does not pass and scores above r_t (y = 0, a lower bound: at least level), 2 for a tie (no margin).
    Returns the tasks and c."""
    n = Counter((MODEL[o[0]][0], o[1]) for o in obs)
    assert max(n.values()) == 1, 'PASSBY has one entry per task and model: two runs of one model on a task cannot be told apart'
    spread = {}
    for t in {o[1] for o in obs}:
        sc = np.array([o[3] for o in obs if o[1] == t]); mid = sc[(sc > 0) & (sc < 100)]
        spread[t] = float(np.std(mid if len(mid) >= 3 else sc))
    unit0 = float(np.median([spread[t] for t in ref]))   # Qiuyang, 2026-10-15: unit_t = max(sd_t, c), c the median sd over tasks
    out = {}
    for t in sorted({o[1] for o in obs}):
        rs, cnt = [o for o in obs if o[1] == t], []
        for c, *_ in rs:
            agg = defaultdict(lambda: [0, 0])
            for key, (b, tot) in PB.get(short(t), {}).get(MODEL[c][0], {}).items():
                if key.startswith('dev/'): continue   # PASS is judged on the hidden final workloads; Yannakakis also lists its dev ones
                agg[key.rsplit('/', 1)[-1]][0] += b; agg[key.rsplit('/', 1)[-1]][1] += tot
            cnt.append(agg)
        stems = sorted({j for a in cnt for j in a})
        assert stems, f'{t}: no metric counts; refresh assets/js/fcs2-checks.js'
        Z = np.array([[float(a[j][0] == a[j][1] > 0) if j in a else 0.0 for j in stems] for a in cnt])
        bad = [o[0] for o, z in zip(rs, Z) if o[2] != z.all()]
        assert not bad, f'{t}: PASS is not "every metric beaten" for {bad}; refresh assets/js/fcs2-checks.js'
        up = list(range(len(stems)))   # union-find over linked metrics, recomputed from the data on every run
        root = lambda i: i if up[i] == i else root(up[i])
        for i in range(len(stems)):
            for j in range(i):
                if np.sum(Z[:, i] != Z[:, j]) <= GROUP_TOL: up[root(i)] = root(j)
        groups = [[stems[i] for i in range(len(stems)) if root(i) == r] for r in dict.fromkeys(root(i) for i in range(len(stems)))]
        G = np.array([[min(z[stems.index(m)] for m in g) for g in groups] for z in Z])
        share = np.array([sum(v[0] for v in a.values()) / max(1, sum(v[1] for v in a.values())) for a in cnt])   # of hidden checks beaten
        O, w, unit = G, None, None
        if t in ref:   # the final score's margin over the human reference (Qiuyang, 2026-10-16, rule E): a run that passes
            # counts it, however far; a run that does not pass counts how far short it fell, and above the human reference
            # only that it got there, y >= 0 (at least level), its metrics not confirming more; a tie counts no margin
            sc, unit, ok = np.array([o[3] for o in rs]), max(spread[t], unit0), G.all(1)
            y, below, above = (sc - ref[t]) / unit, sc < ref[t] - TIE_EPS, sc > ref[t] + TIE_EPS
            O, w = (np.column_stack([G, np.where(ok | below, y, 0.0), np.where(ok | below, 0.0, np.where(above, 1.0, 2.0))]),
                    np.array([win(o[3], ref[t]) for o in rs]))
        out[t] = {'stems': stems, 'Z': Z, 'groups': groups, 'models': [o[0] for o in rs], 'O': O, 'k': len(groups),
                  'np': len(groups) + (t in ref), 'share': share, 'wins': w, 'unit': unit, 'ref': ref.get(t)}
    return out, unit0


def task_prior(x, k, has_ref, hyp):
    """Log prior of a task's parameter rows x (N x items), with its gradient and Hessian at the first row:
    h ~ N(0, PRIOR_SD^2) and beta_j ~ N(h + d, tau^2); without a reference beta_j ~ N(0, PRIOR_SD^2)."""
    d, tau, n = hyp[2], hyp[3], x.shape[1]
    if has_ref:
        e, h = x[:, :k] - x[:, k:] - d, x[:, k]
        f = -0.5 * (e ** 2).sum(1) / tau ** 2 - k * np.log(tau) - 0.5 * h ** 2 / PRIOR_SD ** 2 - np.log(PRIOR_SD) - (k + 1) / 2 * LOG2PI
        g = np.r_[-e[0] / tau ** 2, e[0].sum() / tau ** 2 - h[0] / PRIOR_SD ** 2]
        H = np.zeros((n, n)); H[:k, :k] = -np.eye(k) / tau ** 2; H[:k, k] = H[k, :k] = 1 / tau ** 2; H[k, k] = -k / tau ** 2 - 1 / PRIOR_SD ** 2
    else:
        f = -0.5 * (x ** 2).sum(1) / PRIOR_SD ** 2 - k * np.log(PRIOR_SD) - k / 2 * LOG2PI
        g, H = -x[0] / PRIOR_SD ** 2, -np.eye(k) / PRIOR_SD ** 2
    return f, g, H


def margin_terms(A, y, cen, s_e):
    """Per entry: the log density of a margin y with mean A, y ~ N(A, s_e^2), and its first and second derivatives in A.
    cen 0: y observed; 1: y a lower bound (P(y' >= y)); -1: an upper bound; 2: no margin (the run did not pass), 0."""
    v = (y - A) / s_e
    lo = -0.5 * v ** 2 - np.log(s_e) - 0.5 * LOG2PI
    g, h = v / s_e, np.full(np.broadcast(v, cen).shape, -1 / s_e ** 2)
    w = np.where(cen < 0, v, -v)                          # P = Phi(w) for a censored entry
    lc = log_ndtr(w)
    lam = np.exp(-0.5 * w ** 2 - 0.5 * LOG2PI - lc)       # inverse Mills ratio phi(w) / Phi(w)
    gc, hc = np.where(cen < 0, -lam / s_e, lam / s_e), -lam * (w + lam) / s_e ** 2
    c, skip = cen != 0, cen == 2
    lo, g, h = np.where(c, lc, lo), np.where(c, gc, g), np.where(c, hc, h)
    return np.where(skip, 0.0, lo), np.where(skip, 0.0, g), np.where(skip, 0.0, h)


def task_lj(x, th, O, k, hyp):
    """Log joint of one task's outcomes and parameters at parameter rows x (N x params): its metric-group difficulties
    beta, then, with a reference, its beat-the-human level h; th holds its runs' strengths. A run is one integral over
    its run effect u ~ N(0, s_u^2) (Gauss-Hermite): group j at slope 1, P = sigmoid(theta + u - beta_j), and for a run
    that passes, its margin y ~ N(a (theta + u - h), s_e^2) (margin_terms)."""
    s_u, a, s_e = hyp[0], hyp[1], hyp[4]
    A = th[:, None, None] + s_u * GH_U[:, None] - x[:, None, None, :k]                  # draw x run x node x group
    Ok = O[:, None, :k]
    lf = (Ok * log_expit(A) + (1 - Ok) * log_expit(-A)).sum(3) + GH_LW
    has = O.shape[1] > k
    if has:
        Am = a * (th[:, None] + s_u * GH_U[None, :] - x[:, k][:, None, None])           # draw x run x node
        lf = lf + margin_terms(Am, O[:, k][:, None], O[:, k + 1][:, None], s_e)[0]
    return logsumexp(lf, axis=2).sum(1) + task_prior(x, k, has, hyp)[0]


def task_derivs(x, tv, O, k, hyp):
    """One task at parameters x, its runs' strengths tv: the log joint, its gradient and Hessian in x, and per run the
    first and second derivative in the run's strength and the cross derivatives with x."""
    s_u, a, s_e = hyp[0], hyp[1], hyp[4]
    A = tv[:, None, None] + s_u * GH_U[:, None] - x[:k]                                 # run x node x group
    Ok = O[:, None, :k]
    lf = (Ok * log_expit(A) + (1 - Ok) * log_expit(-A)).sum(2) + GH_LW
    p = expit(A)
    G, W = p - Ok, p * (1 - p)                                                          # d log f / dx; -d2 log f / dx2
    has = O.shape[1] > k
    if has:
        Am = a * (tv[:, None] + s_u * GH_U[None, :] - x[k])                             # run x node
        lm, gA, hA = margin_terms(Am, O[:, k][:, None], O[:, k + 1][:, None], s_e)
        lf = lf + lm
        G = np.concatenate([G, (-a * gA)[:, :, None]], 2)
        W = np.concatenate([W, (-a * a * hA)[:, :, None]], 2)
    ell = logsumexp(lf, axis=1)
    q = np.exp(lf - ell[:, None])                                                       # node weights given the outcomes
    Gt = -G.sum(2)                                                                      # d log f / dtheta
    gx, gt = np.einsum('ri,rin->rn', q, G), (q * Gt).sum(1)
    fp, gp, Hp = task_prior(x[None], k, has, hyp)
    Hxx = np.einsum('ri,rim,rin->mn', q, G, G) - gx.T @ gx - np.diag(np.einsum('ri,rin->n', q, W)) + Hp
    Htx = np.einsum('ri,rin->rn', q, W + Gt[:, :, None] * G) - gt[:, None] * gx
    Htt = (q * (Gt ** 2 - W.sum(2))).sum(1) - gt ** 2
    return ell.sum() + fp[0], gx.sum(0) + gp, Hxx, gt, Htt, Htx


def joint_mode(TL, hyp, th):
    """The joint posterior mode of the strengths th (prior N(0, 1/LAM)) and every task's parameters (each task's 'x',
    updated in place), by Newton's method with the strengths' block solved through the Schur complement and step
    halving. Returns the strengths and the profile log marginal likelihood: per task the Laplace approximation over its
    parameters, summed, plus the strengths' log prior. Leaves minus each task's Hessian in its 'A'."""
    nM = len(th)
    F = lambda th, xs: sum(float(task_lj(x[None], th[T['mi']], T['O'], T['k'], hyp)[0]) for T, x in zip(TL, xs)) - LAM / 2 * th @ th
    xs = [T['x'] for T in TL]
    f = F(th, xs)
    for _ in range(100):
        D = [task_derivs(x, th[T['mi']], T['O'], T['k'], hyp) for T, x in zip(TL, xs)]
        gth, Hd, S, r, Ys = -LAM * th, np.full(nM, -LAM), np.zeros((nM, nM)), np.zeros(nM), []
        for T, (_, gx, Hxx, gt, Htt, Htx) in zip(TL, D):
            np.add.at(gth, T['mi'], gt); np.add.at(Hd, T['mi'], Htt)
            C = np.zeros((nM, len(gx))); C[T['mi']] = Htx                              # one run per model and task
            Y = np.linalg.solve(Hxx, np.column_stack([gx, C.T]))
            S -= C @ Y[:, 1:]; r += C @ Y[:, 0]; Ys.append(Y)
        gm = max(np.abs(gth).max(), max(np.abs(d_[1]).max() for d_ in D))
        if gm < 1e-9: break
        dth = np.linalg.solve(S + np.diag(Hd), r - gth)
        dxs, step = [-Y[:, 0] - Y[:, 1:] @ dth for Y in Ys], 1.0
        if gm < 1e-6:   # close in, the objective's gain is below its rounding: full Newton steps
            th, xs = th + dth, [x + dx for x, dx in zip(xs, dxs)]
            f = F(th, xs)
            continue
        while True:
            th1, xs1 = th + step * dth, [x + step * dx for x, dx in zip(xs, dxs)]
            f1 = F(th1, xs1)
            if f1 >= f: break
            if step < 1e-10: raise ArithmeticError('the joint mode stalled')
            step /= 2
        th, xs, f = th1, xs1, f1
    else: raise ArithmeticError('the joint mode did not converge')
    ll = -LAM / 2 * th @ th + len(th) / 2 * np.log(LAM / (2 * np.pi))
    for T, x, (ft, _, Hxx, *_) in zip(TL, xs, D):
        sign, logdet = np.linalg.slogdet(-Hxx)
        if sign <= 0: raise ArithmeticError('no concave mode: the quadrature is too coarse for this s_u')
        T['x'], T['A'] = x, -Hxx
        ll += ft + len(x) / 2 * LOG2PI - logdet / 2
    return th, ll


def joint_cold(TL, hyp, th):
    """joint_mode from a cold start: the margin's sd s_e eased in from 16 times its value, each solve warm-starting the
    next (from zeros at the fitted hyperparameters Newton stalls; 2026-10-15)."""
    for m in (16, 8, 4, 2, 1): th, ll = joint_mode(TL, hyp[:4] + (hyp[4] * m,), th)
    return th, ll


def joint_fit(obs, ref, PB):
    """FCI and FDI from one model (see the docstring). Returns per model (FCI, 90% low, 90% high, tasks), the strengths
    in logits and PASS_ZERO's; per task (database name) metric_tasks()'s fields and its fit, in logits: 'x' (the mode),
    'D', 'lo', 'hi', 'ess', 'slope' (dP(pass)/dtheta at D), 'ci' (per parameter, its 90% interval); the hyperparameters
    (s_u, a, d, tau, s_e), the profile log marginal likelihood, each start's result, the margin unit c (points) and the
    number of bootstrap draws that did not converge (left out)."""
    tasks, unit0 = metric_tasks(obs, ref, PB)
    M = list(dict.fromkeys(o[0] for o in obs)); nM = len(M)
    assert PASS_ZERO in M, f'{PASS_ZERO} has no scored runs'
    for T in tasks.values(): T['mi'], T['x'] = np.array([M.index(m) for m in T['models']]), np.zeros(T['np'])
    TL, state = list(tasks.values()), {'th': np.zeros(nM)}
    hyp = lambda p: (float(np.exp(p[0])), float(np.exp(p[1])), float(p[2]), float(np.exp(p[3])), float(np.exp(p[4])))

    def total(p):   # warm-started at the last mode; -inf where the mode is not found
        try: state['th'], ll = joint_mode(TL, hyp(p), state['th'])
        except (ArithmeticError, np.linalg.LinAlgError): return -np.inf
        return ll

    starts = [(1.85, 1.0, 1.4, 3.3, 1.0), (1.0, 0.5, 1.0, 2.0, 0.5)]   # (s_u, a, d, tau, s_e)
    bounds = [(np.log(1e-3), np.log(7)), (np.log(1e-2), np.log(20)), (-20, 30), (np.log(.05), np.log(20)), (np.log(.02), np.log(20))]
    state['th'], _ = joint_cold(TL, hyp([np.log(v) if i != 2 else v for i, v in enumerate(starts[0])]), state['th'])
    fits = [minimize(lambda p: -total(p), [np.log(s[0]), np.log(s[1]), s[2], np.log(s[3]), np.log(s[4])], method='Nelder-Mead',
                     bounds=bounds, options={'xatol': 1e-3, 'fatol': 1e-6, 'maxiter': 4000}) for s in starts]
    hb = hyp(min(fits, key=lambda r: r.fun).x)
    th, ll = joint_mode(TL, hb, state['th'])
    s_u, z = hb[0], M.index(PASS_ZERO)
    for i, T in enumerate(TL):
        x, k, n = T['x'], T['k'], len(T['x'])
        # the Laplace Gaussian, reweighted to the exact posterior: metric groups nobody beats have one-sided posteriors
        eps = np.random.default_rng(i).standard_normal((IS_DRAWS, n))
        X = x + eps @ np.linalg.cholesky(np.linalg.inv(T['A'])).T
        lw = task_lj(X, th[T['mi']], T['O'], k, hb) + 0.5 * (eps ** 2).sum(1)   # constants cancel when normalised
        w = np.exp(lw - lw.max()); w /= w.sum()
        D = float(fdi(x[None, :k], s_u)[0])
        S = expit(D + s_u * GH_U[:, None] - x[:k])
        T.update(D=D, ess=float(1 / (w @ w)), slope=float(np.exp(GH_LW) @ (S.prod(1) * (1 - S).sum(1))),
                 ci=[tuple(wpct(X[:, j], w, [.05, .95])) for j in range(n)])
        T['lo'], T['hi'] = wpct(fdi(X[:, :k], s_u), w, [.05, .95])
    # the FCI interval: resample tasks, refit the strengths and every task's parameters, hyperparameters held
    full, draws, skipped = [T['x'].copy() for T in TL], [], 0
    for seed in range(BOOT):
        pick = np.random.default_rng(seed).integers(0, len(TL), len(TL))
        try: d, _ = joint_mode([dict(TL[j], x=full[j].copy()) for j in pick], hb, th.copy())
        except (ArithmeticError, np.linalg.LinAlgError): skipped += 1; continue   # left out and counted (should be none)
        draws.append(on_scale(d, d[z]))
    point, (lo, hi) = on_scale(th, th[z]), np.percentile(draws, [5, 95], axis=0)
    out = {m: (round(float(point[i]), DEC), round(float(lo[i]), DEC), round(float(hi[i]), DEC), len({o[1] for o in obs if o[0] == m}))
           for i, m in enumerate(M)}
    return out, dict(zip(M, th)), th[z], tasks, hb, ll, [(hyp(r.x), -r.fun) for r in fits], unit0, skipped


def p_pass(D, B, s_u, gh=None):
    """P(pass) at strength D with metric difficulties B (both logits, one per row): E_u prod_j sigmoid(D + u - beta_j)."""
    gu, glw = gh or (GH_U, GH_LW)
    return np.exp(logsumexp(log_expit(D[:, None, None] + s_u * gu[:, None] - B[:, None, :]).sum(2) + glw, axis=1))


def fdi(B, s_u, gh=None):
    """Per row of metric difficulties B: the strength D at which P(pass) = 1/2, by bisection (P rises with D)."""
    lo, hi = B.min(1) - 40 - 8 * s_u, B.max(1) + 40 + 8 * s_u
    for _ in range(64):
        mid = (lo + hi) / 2; up = p_pass(mid, B, s_u, gh) > .5
        lo, hi = np.where(up, lo, mid), np.where(up, mid, hi)
    return (lo + hi) / 2


def wpct(v, w, qs):
    """Weighted percentiles (qs in [0, 1]) of values v with weights w."""
    o = np.argsort(v); c = np.cumsum(w[o]) - w[o] / 2
    return np.interp(qs, c / w.sum(), v[o])


def progress(tasks, theta, hyp):
    """Per task (database name): the progress curve of its chart (Qiuyang, 2026-10-14), (g, kappa, f) in logits: a model's
    expected share of hidden checks beaten is f + (1 - f) integral sigmoid(kappa (theta - g) + u) N(u; 0, s_u^2) du, f the
    floor in [0, 0.95], kappa the slope per logit, g where the rising part is half way. Fitted to every run's share by
    fractional-logit quasi-likelihood, strengths and s_u held at the joint fit, with log kappa ~ N(0, PROG_K_SD^2) and a
    weak g ~ N(0, PRIOR_SD^2), so a task where every run is at 0 or at 100% stays finite."""
    s_u, out = hyp[0], {}
    for t, T in tasks.items():
        th, y = np.array([theta[m] for m in T['models']]), T['share']
        def nq(p):   # minus the quasi-log-likelihood plus the priors; p = (g, log kappa, logit of f / 0.95)
            f = .95 * expit(p[2])
            mu = np.clip(f + (1 - f) * (np.exp(GH_LW) @ expit(np.exp(p[1]) * (th[None, :] - p[0]) + s_u * GH_U[:, None])), 1e-12, 1 - 1e-12)
            return -np.sum(y * np.log(mu) + (1 - y) * np.log(1 - mu)) + p[0] ** 2 / (2 * PRIOR_SD ** 2) + p[1] ** 2 / (2 * PROG_K_SD ** 2)
        fits = [minimize(nq, [g0, 0.0, f0], method='L-BFGS-B', bounds=[(-60, 60), (-5, 5), (-15, 15)])
                for g0 in np.percentile(th, [10, 50, 90]) for f0 in (-6.0, 0.0)]
        g, lk, lf = min(fits, key=lambda r: r.fun).x
        out[t] = (float(g), float(np.exp(lk)), float(.95 * expit(lf)))
    return out


def eci_score(rows):
    """The raw-score fit (--json only). Per respondent: (FCI, 90% low, 90% high, tasks); plus the number of bootstrap
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


def theta_at(items, counts, hyp):
    """Per row of counts (row x task): the strength that maximises sum_t counts * log l_t(theta) - LAM theta^2 / 2, each
    task's parameters x and the run's outcomes o held (items: (x, o, k) per task: its metric groups, then with a reference
    the margin and its code, as in metric_tasks); Newton's method, steps clipped to 2 logits (the objective is concave)."""
    s_u, a, s_e = hyp[0], hyp[1], hyp[4]
    th = np.zeros(len(counts))
    for _ in range(200):
        G, H = -LAM * th, np.full(len(th), -LAM)
        for j, (x, o, k) in enumerate(items):
            A = th[:, None, None] + s_u * GH_U[:, None] - x[:k]                        # row x node x group
            lf = (o[:k] * log_expit(A) + (1 - o[:k]) * log_expit(-A)).sum(2) + GH_LW
            p = expit(A)
            gi, hi = (o[:k] - p).sum(2), -(p * (1 - p)).sum(2)
            if len(o) > k:   # the margin of a run that passed, in theta: slope a
                lm, gA, hA = margin_terms(a * (th[:, None] + s_u * GH_U[None, :] - x[k]), o[k], o[k + 1], s_e)
                lf, gi, hi = lf + lm, gi + a * gA, hi + a * a * hA
            q = np.exp(lf - logsumexp(lf, axis=1)[:, None])
            g = (q * gi).sum(1)
            G += counts[:, j] * g; H += counts[:, j] * ((q * (hi + gi ** 2)).sum(1) - g ** 2)
        step = np.clip(G / -H, -2, 2); th = th + step
        if np.abs(step).max() < 1e-11: return th
    raise ArithmeticError('theta_at did not converge')


# a run still going at a budget, scored as if it timed out there: no group beaten and, with a reference, a final score of 0
notyet = lambda T: np.r_[np.zeros(T['k']), [-T['ref'] / T['unit'], 0.0]] if T['ref'] is not None else np.zeros(T['k'])


refused = lambda fj: bool(fj) and bool(json.loads(fj).get('refusal'))   # bin/fcs2_db_from_platform.py marks a provider refusal


def scaling(db, tasks, hyp, theta0):
    """{model id: [[US$ budget, FCI, 90% low, 90% high, share of runs still going], ...]}; spend from usd(). The joint
    model with every task's parameters held at the leaderboard fit: at budget B a run that has ended contributes its
    metric groups and its margin; a run still going is scored as a timeout at B (notyet): no group, a final score of 0.
    Each curve is checked to never fall."""
    info = {r: (c, t) for r, c, t, s, fj in db.execute('''select r.id, cd.name, t.name, r.display_score, r.feedback_json from cells ce
        join runs r on r.id = ce.run_id join candidates cd on cd.id = ce.candidate_id join tasks t on t.id = ce.task_id''') if s is not None and c not in HIDDEN and not refused(fj) and TASK[t][0] not in OFF_FIT_DOMAINS}
    pts = {(r, sid): (tt, ot) for r, sid, tt, ot in db.execute('select run_id, submission_id, total_tokens, output_tokens from score_points')}
    end = {}   # a run's spend at its end: usd() at its last submission with a score point, 0 if none
    for r, sid in db.execute('select run_id, id from submissions order by run_id, ordinal'):
        if r in info and (r, sid) in pts: end[r] = usd(MODEL[info[r][0]][0], *pts[(r, sid)])
    out = {}
    for c in sorted({v[0] for v in info.values()}, key=lambda c: MODEL[c][0]):
        runs = {info[r][1]: r for r in info if info[r][0] == c}   # one run per model and task (metric_tasks asserts it)
        tl = sorted(runs); ends = [end.get(runs[t], 0) for t in tl]
        if not max(ends): continue   # no spend reported: no curve
        O = {t: tasks[t]['O'][tasks[t]['models'].index(c)] for t in tl}
        rng, curve = np.random.default_rng(3), []
        # budgets are rounded up to the stored precision before use, so each point is exact at its stored budget
        for B in np.ceil(np.geomspace(1e-3, max(ends), SCALE_POINTS) * 1e5) / 1e5:
            items = [(tasks[t]['x'], O[t] if end.get(runs[t], 0) <= B else notyet(tasks[t]), tasks[t]['k']) for t in tl]
            counts = np.array([np.ones(len(tl))] + [np.bincount([tl.index(t) for t in rng.choice(tl, len(tl))], minlength=len(tl)) for _ in range(SCALE_BOOT)])
            v = on_scale(theta_at(items, counts, hyp), theta0)
            lo, hi = np.percentile(v[1:], [5, 95])
            curve.append([float(B), round(float(v[0]), DEC), round(float(lo), DEC), round(float(hi), DEC), round(float(np.mean([e > B for e in ends])), 2)])
        drop = max([a[1] - b[1] for a, b in zip(curve, curve[1:])] + [0])
        assert drop <= 10 ** -DEC, f'{MODEL[c][0]}: test-time FCI falls by {drop} between budgets'
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
    folder, paper = TASK[task]
    runs.append([MODEL[cand][0], SHOWN.get(folder, folder), paper or task.split(' — ')[0], round(score, 2), int(verdict == 'PASS')])
dropped = Counter(r[3] for r in rows if r[2] is None and r[0] not in HIDDEN)
# the hidden models' runs in RUNS's columns, for fits made outside this script: Kimi K2.7 is the FCI 0 point but not on the
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


assert len({short(t) for t in {r[1] for r in rows}}) == len({r[1] for r in rows}), 'two tasks share a short name'


def task_reference(db):
    """Per task short name: the authors' reference score (median reference_score over its runs; where that is 0 or
    less, REF_DEFAULT's value, else left out)."""
    ref = defaultdict(list)
    for t, fj in db.execute('select t.name, r.feedback_json from cells ce join runs r on r.id = ce.run_id join tasks t on t.id = ce.task_id'):
        f = json.loads(fj) if fj else {}
        if f.get('reference_score') is not None: ref[short(t)].append(f['reference_score'])
    out = {t: round(float(np.median(v)), 1) for t, v in ref.items() if np.median(v) > 0}
    tasks = {short(t) for t, in db.execute('select name from tasks')}
    return dict(sorted({**{t: float(v) for t, v in REF_DEFAULT.items() if t in tasks}, **out}.items()))


def task_fits(tasks, fit, theta0, unit0):
    """TFIT, DIFF, the metrics' difficulties, the metric groups and DIFF_FIT from joint_fit()'s output, on the FCI scale.
    TFIT[task] = [D, slope], the logistic matched to the pass curve at D: P(pass) ~ 1 / (1 + exp(-slope (FCI - D))),
    slope = 4 dP/dFCI there. DIFF[task] = [D, 90% low, 90% high, passes, wins, runs] and METRIC[task][stem] =
    [its group's difficulty, 90% low, 90% high, runs that beat the metric, group], counting the runs the page shows
    (RUNS); wins null without a reference. GROUPS[task] lists the groups' metrics, group 1 first."""
    s_u, a, d, tau, s_e = fit
    TFIT, DIFF, METRIC, GROUPS = {}, {}, {}, {}
    for t, T in tasks.items():
        shown = [m not in HIDDEN for m in T['models']]
        O, Z, k = T['O'][shown], T['Z'][shown], T['k']
        wins = None if T['wins'] is None else T['wins'][shown]
        e = [round(float(v), DEC) for v in on_scale([T['D'], T['lo'], T['hi']], theta0)]
        TFIT[short(t)] = [e[0], round(4 * T['slope'] / PASS_UNIT, 4)]
        DIFF[short(t)] = e + [int(O[:, :k].all(1).sum()), None if wins is None else round(float(wins.sum()), 1), len(O)]
        METRIC[short(t)] = {m: [round(float(v), DEC) for v in on_scale([T['x'][g], *T['ci'][g]], theta0)] + [int(Z[:, T['stems'].index(m)].sum()), g + 1]
                            for g, ms in enumerate(T['groups']) for m in ms}
        GROUPS[short(t)] = T['groups']
    return (dict(sorted(TFIT.items())), dict(sorted(DIFF.items())), dict(sorted(METRIC.items())), dict(sorted(GROUPS.items())),
            {'a': round(a, 3), 'delta': round(PASS_UNIT * d, 2), 'tau': round(PASS_UNIT * tau, 2), 'sigma_u': round(PASS_UNIT * s_u, 2), 's_e': round(s_e, 3), 'c': round(unit0, 2)})


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


def run_states(db):
    """Per task short name and model id on the site, how a run ended when it was not an ordinary evaluation, for the
    overview's kebab, which shows it in place of the run's metrics: 'failed' from the run's state (it scores 0), 'refused'
    where the model's provider refused the task (left out of the fits), 'unscored' for a run not yet scored. A run that timed
    out shows its metrics like any other (Qiuyang, 2026-10-16: no timeout state). A run that completed with a score but no
    verdict, so no metrics either (Step 5 Preview's Egg run, scored 0), is 'failed' too: the site counts it a fail with 0."""
    out = defaultdict(dict)
    for c, t, st, s, v, fj in db.execute('''select c.name, t.name, r.state, r.display_score, r.display_verdict, r.feedback_json from cells ce
      join runs r on r.id = ce.run_id join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id'''):
        if c in HIDDEN: continue
        k = 'refused' if refused(fj) else 'unscored' if s is None else 'failed' if st == 'FAILED' or (st == 'COMPLETED' and v is None) else None
        if k: out[TASK[t][1] or t.split(' — ')[0]][MODEL[c][0]] = k
    return dict(sorted(out.items()))


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
# a run the model's provider refused (no final submission) says nothing about the model's ability on the task: it is left
# out of FCI and FDI, though the page still lists it (Qiuyang, 2026-10-16)
fit_rows = [x for x in fit_rows if not refused(x[4]) and TASK[x[1]][0] not in OFF_FIT_DOMAINS]
obs, task_ref = fit_data(fit_rows)
E, THETA, theta0, MT, dfit, dll, dstarts, UNIT0, nskip = joint_fit(obs, task_ref, passby())
TFIT, DIFF, METRIC, MGROUPS, DIFF_FIT = task_fits(MT, dfit, theta0, UNIT0)
# each task's metric-group difficulties at the mode, on the FCI scale: the task chart draws the exact pass curve from them (Qiuyang);
# one decimal more than FDI, so the curve from these rounded values crosses 1/2 within 0.06 points of the rounded FDI
GROUPS = {short(t): sorted((round(float(v), DEC + 1) for v in on_scale(T['x'][:T['k']], theta0)), reverse=True) for t, T in sorted(MT.items(), key=lambda kv: short(kv[0]))}
PROG = {short(t): [round(float(on_scale(g, theta0)), DEC), round(k / PASS_UNIT, 4), round(f, 3)] for t, (g, k, f) in sorted(progress(MT, THETA, dfit).items(), key=lambda kv: short(kv[0]))}
SC, CO = scaling(db, MT, dfit, theta0), cost(db)
REF = task_reference(db)
CHECKS = task_checks(db)
STATE = run_states(db)
eci_js = {MODEL[c][0]: list(E[c]) for c in MODEL if c not in HIDDEN}
zero = MODEL[PASS_ZERO][1]
# no task or model may drop out of the fits in an update, but for the domains held off them (OFF_FIT_DOMAINS)
lost = {k: sorted({r[2] for r in runs if r[1] not in OFF_FIT_DOMAINS} - set(v)) for k, v in (('DIFF', DIFF), ('GROUPS', GROUPS))}
assert not any(lost.values()), f'tasks in RUNS without a difficulty: {lost}'
half = {t: float(fdi(np.array([b]) / PASS_UNIT, DIFF_FIT['sigma_u'] / PASS_UNIT)[0]) * PASS_UNIT for t, b in GROUPS.items()}
gap = max(abs(half[t] - DIFF[t][0]) for t in GROUPS)
# FDI is shown to 0.1, so its rounding alone moves it up to 0.05 from the crossing; the rounding of GROUPS and sigma_u adds a hair
assert gap <= 0.06, f'the pass curve from GROUPS misses FDI by {gap:.3f} points'
u24, w24 = np.polynomial.hermite.hermgauss(48)   # the pages integrate with 48 nodes (GH48; 24 missed by 0.09 at rule B's s_u): their curve may differ by a hair more
half24 = {t: float(fdi(np.array([b]) / PASS_UNIT, DIFF_FIT['sigma_u'] / PASS_UNIT, (np.sqrt(2) * u24, np.log(w24 / np.sqrt(np.pi))))[0]) * PASS_UNIT for t, b in GROUPS.items()}
gap24 = max(abs(half24[t] - DIFF[t][0]) for t in GROUPS)
assert gap24 <= 0.06, f'the pages\' 48-node pass curve misses FDI by {gap24:.3f} points'
assert {m[0] for m in models} <= set(eci_js), f'models without an FCI: {sorted({m[0] for m in models} - set(eci_js))}'
block = (f'// One entry per scored run in the preview results database of {when:%Y-%m-%d} (bin/fcs2_runs_from_db.py):\n'
         f'// model, domain, task, final score (0-100, the task\'s own scale), passed (1 = verdict PASS). Timeouts score 0; {sum(dropped.values())} unscored runs are left out' + ''.join(f'; {MODEL[c][1]} is left out (only the FCI 0 point)' for c in sorted(HIDDEN)) + '.\n'
         f'const RUNS = {json.dumps(runs, ensure_ascii=False)}.map(([m, d, t, s, p]) => ({{m, d, t, s, p}}));\n'
         'const MODELS = [\n' + ''.join(f"  {{id:'{i}', name:'{n}', short:'{s}', h:'{h}', lab:'{l}'}},\n" for i, n, s, h, l in models) + '];\n'
         f"const UPDATED = '{when:%B} {when.day}, {when.year}';\n"
         f"// Pass rate per model: [percent, runs that pass, runs].\nconst PASS = {json.dumps(pass_rate(runs))};\n"
         f"// FCI per model: [point, 90% low, 90% high, tasks], from the model that also gives FDI: every run's metric groups and how far its final score is from the human reference (a run that does not pass counts at most as level), in units of the task's score spread (at least the median spread over tasks), with a run effect shared by both and a strength prior N(0, 1/{LAM:g}), every model a respondent ({zero} too); FCI = {PASS_ZERO_VALUE:g} + {PASS_UNIT:g} x (strength - {zero}'s strength), strengths in logits (ECI_LOW, ECI_LOW_VALUE, ECI_UNIT); the interval resamples tasks and refits ({BOOT} bootstrap draws).\n"
         f"const ECI = {json.dumps(eci_js)};\nconst ECI_LOW = '{MODEL[PASS_ZERO][0]}', ECI_LOW_NAME = '{zero}', ECI_LOW_VALUE = {PASS_ZERO_VALUE:g}, ECI_UNIT = {PASS_UNIT:g};\n"
         f"// Test-time scaling per model: [US$ budget per run, FCI, 90% low, 90% high, share of runs still going]; at a budget a run that has ended counts its metric groups and its margin (at most level if it did not pass); a run still going counts as timed out at the budget (no group, final score 0), so a curve never falls; task parameters held at the FCI fit (see the converter's docstring).\nconst SCALE = {json.dumps(SC, separators=(',', ':'))};\n"
         f"// Cost per model: [mean US$ per scored run, runs]; output tokens x output price + every token x cache-read price (PRICE above).\nconst COST = {json.dumps(CO)};\nconst PRICE = {json.dumps(PRICE)};\n"
         f"// Every scored run: [model, task, final score, passed, US$ at end, hours, [[US$, dev score] per development submission]].\nconst TRAJ = {json.dumps(trajectories(db), separators=(',', ':'), ensure_ascii=False)};\n"
         f"// Per task: the authors' reference score, the median over the task's runs; where the database has none, the converter's REF_DEFAULT (" + ', '.join(f'{k}: {v:g}' for k, v in REF_DEFAULT.items()) + f"), else the task is left out.\nconst REF = {json.dumps(REF, ensure_ascii=False)};\n"
         f"// Per task: its metric groups' difficulties [beta_g, ...], highest first, on the FCI scale. A run passes when it beats every group, so the pass curve is P(pass | FCI) = integral of prod_g 1 / (1 + exp(-((FCI - beta_g) / ECI_UNIT + u))) N(u; 0, (sigma_u / ECI_UNIT)^2) du, sigma_u from DIFF_FIT (48-node Gauss-Hermite); it is 1/2 at the task's FDI.\nconst GROUPS = {json.dumps(GROUPS, ensure_ascii=False)};\n"
         f"// Per task: [D, 90% low, 90% high, passes, wins, runs] in RUNS. D, the difficulty, is the FCI at which a model passes half the time, a pass being every metric beaten at once. It comes from each metric's own difficulty (metrics that pass and fail together share one), fitted on which metrics each run beats and how far its final score is from the human reference (a run that does not pass counts at most as level), in units of the task's score spread (at least the median spread over tasks), with a run effect shared by both (DIFF_FIT). wins counts the runs whose final score beats the reference (a tie is half; null without a reference).\nconst DIFF = {json.dumps(DIFF, ensure_ascii=False)};\n"
         f"// The FCI and FDI model's shared parameters, by Laplace marginal likelihood over all tasks: sigma_u, the sd of a run's effect on its metrics and its margin; a, the margin's slope per logit of strength; delta and tau, the mean and sd of a metric's difficulty above the task's beat-the-human level (sigma_u, delta and tau in FCI points); s_e, the margin's sd in units of the score spread; c, the smallest spread unit, in score points.\nconst DIFF_FIT = {json.dumps(DIFF_FIT)};\n"
         f"// Per task: the metrics its judge checks and the number of hidden final workloads; a run passes only when every check passes on every final workload.\nconst CHECKS = {json.dumps(CHECKS, ensure_ascii=False, separators=(',', ':'))};\n"
         f"// Per task and model, how a run ended when it was not an ordinary evaluation: failed (it scores 0), refused (the model's provider refused the task; left out of FCI and FDI), unscored (not yet scored).\nconst STATE = {json.dumps(STATE, ensure_ascii=False, separators=(',', ':'))};\n"
         f"// Task descriptions from the paper repo (bin/fcs2_descriptions.tsv).\nconst DESC = {json.dumps(descriptions(), ensure_ascii=False)};\n")
js = open(js_path, encoding='utf-8').read()   # read late: the fits above take a while
BEGIN, END = '// BEGIN converter block (bin/fcs2_runs_from_db.py writes everything up to END)\n', '// END converter block\n'
assert js.count(BEGIN) == 1 and js.count(END) == 1, 'converter markers not found'
js = js[:js.index(BEGIN) + len(BEGIN)] + block + js[js.index(END):]
open(js_path, 'w', encoding='utf-8').write(js)
hid_path = '_data/fcs2_runs_hidden.json'
open(hid_path, 'w', encoding='utf-8').write(hidden_json(generated, hidden))
print('PASS', pass_rate(runs))
print('FCI', eci_js)
print('DIFF_FIT', DIFF_FIT, '(logits: sigma_u {:.4f}, a {:.4f}, delta {:.4f}, tau {:.4f}, s_e {:.4f}; profile log marginal likelihood {:.3f})'.format(*dfit, dll))
print(f'FCI bootstrap: {BOOT - nskip} draws, {nskip} skipped (no convergence)')
print(f'pass curves from GROUPS reach 1/2 within {gap:.3f} points of FDI ({gap24:.3f} with the pages\' 48 nodes)')
print('starts', [(tuple(round(float(v), 4) for v in h), round(float(l), 3)) for h, l in dstarts])
print('importance sampling: smallest effective sample size', round(min(T['ess'] for T in MT.values())), 'of', IS_DRAWS,
      '; below 200:', [short(t) for t, T in MT.items() if T['ess'] < 200])
print(f'{len(runs)} runs, {len({r[2] for r in runs})} tasks, {len(models)} models; dropped {dict(dropped)}; generated {generated}')

for a in sys.argv[2:]:
    if a.startswith('--json='):
        S, nboot, nbad, pinned, curves = eci_score(fit_rows)   # the raw-score fit, kept for the paper only
        out = {'source': sys.argv[1], 'generated_at': generated, 'runs_columns': ['model', 'domain', 'task', 'score', 'passed'], 'runs': runs,
               'models': [dict(zip(['id', 'name', 'short', 'harness', 'lab'], m)) for m in models], 'dropped': dict(dropped),
               'pass': pass_rate(runs), 'cost_usd': CO, 'price_per_mtok': PRICE, 'eci': eci_js, 'eci_unit': PASS_UNIT,
               'eci_low': [PASS_ZERO, PASS_ZERO_VALUE], 'eci_penalty': LAM, 'eci_boot': BOOT, 'eci_boot_skipped': nskip,
               'scaling_columns': ['usd', 'eci', 'lo90', 'hi90', 'share_running'], 'scaling': SC,
               'task_reference': REF, 'task_fit_columns': ['difficulty', 'slope'], 'task_fit': TFIT,
               'task_difficulty_columns': ['difficulty', 'lo90', 'hi90', 'passes', 'wins', 'runs'], 'task_difficulty': DIFF,
               'difficulty_fit': DIFF_FIT, 'progress_curve_columns': ['g', 'k', 'f'], 'progress_curve': PROG, 'metric_difficulty_columns': ['difficulty', 'lo90', 'hi90', 'passes', 'group'], 'metric_difficulty': METRIC,
               'metric_groups': MGROUPS, 'group_difficulty': GROUPS,
               'task_checks': CHECKS, 'run_state': STATE,
               'feci_score_columns': ['eci', 'lo90', 'hi90'], 'feci_score': {MODEL[c][0]: list(S[c][:3]) for c in MODEL if c not in HIDDEN},
               'feci_score_anchors': {'reference': HUMAN_VALUE, PASS_ZERO: PASS_ZERO_VALUE}, 'feci_score_boot_kept': nboot,
               'feci_score_boot_dropped': nbad, 'feci_score_pinned_task': pinned, 'feci_score_reference_tasks': S['reference'][3],
               'task_fit_score_columns': ['difficulty', 'slope'],   # expected score = 100 / (1 + exp(-slope (feci_score - difficulty)))
               'task_fit_score': dict(sorted({short(b): [round(float(e), 2), round(float(k), 4)]
                                              for b, e, k in zip(curves['benchmark'], curves['edi'], curves['discriminability_scaled'])}.items()))}
        json.dump(out, open(a[7:], 'w'), indent=1)
        print('wrote', a[7:])
