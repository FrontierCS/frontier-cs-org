#!/usr/bin/env python3
"""Build the sqlite.db that bin/fcs2_runs_from_db.py reads, straight from the evaluation platform's read-only API.

usage: python3 bin/fcs2_db_from_platform.py out.db [--api=http://127.0.0.1:18080/api/v1/] [--min-scored=40] [--claude-usage=recovered.json]
       [--trace-usage=fcs2-trace-usage-recovered-20261022.json] [--run-cost=ds1017-tokens.json] [--only='candidate name']

--only collects one candidate's evaluation, for a platform that does not hold the others (since 2026-10-24 the evaluations
of the first 13 models are on no platform): add the result to the site's snapshot with bin/fcs2_db_add_snapshot.py. The
checks that the override tables below still meet their runs then cover only that candidate's runs.
--run-cost=FILE: a run's US$ as its model provider billed it, which replaces every estimate below: JSON whose "rows" give
run_id and openrouter_actual_usd (DeepSeek V4.1 Flash 1017: ~/fcs2-ops/cost/ds1017-tokens.json, the cost OpenRouter
returned for each request, from the gateway's spend logs, plus OpenRouter's own record for the 19 requests the gateway
logged without it; the gateway's estimate misses those, and it has no usage at all for the Progent run), or run_id and
usd (Gemini 4 Argon on agy: ~/fcs2-ops/cost/gemini-agy-spend.json, the gateway's spend log summed per run, which also
covers the four runs whose platform record has no usage; GPT-6.1 Terra: ~/fcs2-ops/cost/terra-tokens.json, the token usage
of every agent request in the run's evidence at OpenAI's list price, as it was billed by OpenAI directly and has no
gateway estimate; Kimi K3.1 Pro: ~/fcs2-ops/cost/k31-tokens.json, the same from its evidence at Kimi's list price;
Claude Fable 5.1: ~/fcs2-ops/cost/fable-tokens.json, the cost Claude Code reports for itself in the result event of the
run's evidence trace, or, for a run whose trace has no result event, the trace's token usage at the rates those reports
imply; Gemini 4 Carbon on agy: ~/fcs2-ops/cost/carbon-tokens.json, the gateway's token counts per run at Gemini 4 Argon's
prices, as no public carbon-g price exists). Repeatable.

Takes every formal evaluation of the full task set (47 tasks or more) that is not archived and has at least --min-scored scored runs (one per model;
the newest wins), and writes the tables the converter queries: release, candidates, tasks, cells, runs, submissions,
score_points. Only GET requests are made.

What the API does not give, and what stands in for it:
- Spend per submission. The API reports a run's total tokens and, for some models, the gateway's estimated cost.
  A run's spend is that estimated cost when it is above 0, else the cost Claude Code reports for itself
  (claude_trace.usage), else total tokens at the model's cache-read list price (a lower bound: output tokens are
  not reported). Spend at a development submission is the run's spend times the
  share of the run's wall time elapsed at that submission. It is stored as total_tokens = US$ * 1e6
  with output_tokens NULL, which the converter's usd() reads as US$ directly.
- The patch behind the final submission. Development payload ids do not match the final checkpoint's, so no
  development score is paired with the hidden score and the converter applies no dev-to-hidden calibration.
- Check labels. feedback_json.checks lists the metric names of metrics.private.beat_spec_progress.
- Refusals. feedback_json.refusal is true for a run whose adjudication cause is provider_refusal_no_final: the model's
  provider refused, so no final submission came. The converter leaves such runs out of FCI and FDI (Qiuyang, 2026-10-16).
"""
import json, sqlite3, sys, urllib.request, os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

API, MIN, ONLY = 'http://127.0.0.1:18080/api/v1/', 40, None
for a in sys.argv[2:]:
    if a.startswith('--api='): API = a[6:]
    if a.startswith('--min-scored='): MIN = int(a[13:])
    if a.startswith('--only='): ONLY = a[7:]
# cache-read US$ per million tokens, as PRICE in the converter, keyed by the platform's candidate name
CACHE = {'GPT-6 Astra': 1.00, 'GPT-6.1 Sol': 0.10, 'Kimi K3 (Modal)': 0.30, 'DeepSeek V4.1 Flash (DSH)': 0.003, 'Muse Code - Muse Spark 1.3': 0.15, 'GLM 5.3 (ZCode)': 0.26,
         'Claude Code · Opus 5.5 (Subscription, max effort)': None, 'Kimi K2.7 Code': None, 'Muse Code · Muse Wonder 1.0': None,
         'Codex · Qwen 3.8 Max': 0.25,           # as 'qwen' in the converter's PRICE
         'Qwen Code CLI · Qwen 3.8 Max': 0.25,   # the same model on Qwen Code (Qiuyang, 2026-10-14)
         'GLM 5.3 Flash (ZCode)': 0.03,
         'pi · Gemini 4': None,                  # its gateway reports the cost of every run (Qiuyang, 2026-10-16)          # list cached-input rate, eesel.ai's GLM-5.3-Flash pricing write-up, found 2026-10-13   # None: run on a subscription, the platform reports no usage
         'Step Code - Step 5 Preview': None,     # so does its gateway (Qiuyang, 2026-10-17)
         # DeepSeek V4.1 Flash 1017 (2026-10-25): its runs' costs come from --run-cost; this is Crusoe's fp8 cache-read
         # rate, the provider OpenRouter routed 7,999 of the 8,238 requests of its campaign to (output 1.2, uncached input 0.29)
         'DeepSeek Harness (deepseek-v4.1-flash-1017)': 0.007,
         # Gemini 4 Argon on the Antigravity CLI (2026-10-25): its gateway reports the cost of every run, and --run-cost gives
         # the four its platform record lacks
         'Antigravity CLI agy (gemini-4-argon)': None,
         # GPT-6.1 Terra on Codex 0.162.1, reasoning xhigh, official OpenAI API (2026-10-26): its runs' costs come from
         # --run-cost (OpenAI bills it directly, the platform estimates US$0); this is OpenAI's cached-input rate for it
         'GPT-6.1 Terra': 0.05,
         # Kimi K3.1 Pro on Kimi Code 2.3.3, effort max, official Kimi API (2026-10-26): its runs' costs come from --run-cost
         # (Kimi bills it directly, the platform estimates US$0); this is Kimi's cached-input rate for it
         'Kimi Code (kimi-k3.1-pro)': 0.20,
         # Claude Fable 5.1 on Claude Code 2.1.296, effort max, Claude subscription (2026-10-25): its runs' costs come from
         # --run-cost (the cost Claude Code reports for itself, from each run's evidence), as Claude Opus 5.5's from its CLI
         'Claude Code · Fable 5.1 (Subscription)': None,
         # Gemini 4 Carbon (carbon-g) on the Antigravity CLI (2026-10-27): its runs' costs come from --run-cost, its gateway
         # token counts at Gemini 4 Argon's prices (no public carbon-g price)
         'Antigravity CLI agy (carbon-g)': None}
# A candidate whose formal run of the task set spans several evaluations, collected as one: Gemini 4 Argon on agy ran six
# CPU tasks first in a batch of their own and the other 42 in its formal evaluation; together they are its 48 (Qiuyang,
# 2026-10-25). The first evaluation listed is the formal one.
EVALUATIONS = {'Antigravity CLI agy (gemini-4-argon)': ('eval_01M5RHJYJ0Z12JB8D3R4YCG9M2', 'eval_01M5R40BHHJHRTSNBV7FB6P6JV')}


def get(path):
    for attempt in range(3):
        try: return json.load(urllib.request.urlopen(API + path, timeout=30))
        except Exception as e: err = e
    raise err

ts = lambda s: datetime.fromisoformat(s[:19]).replace(tzinfo=timezone.utc).timestamp()
evs = {}
def evaluations():
    """Every evaluation: the list is paged, 200 at a time, with the next page's cursor in the x-next-cursor header."""
    out, cursor = [], None
    while True:
        r = urllib.request.urlopen(API + 'evaluations?limit=200' + (f'&cursor={cursor}' if cursor else ''), timeout=30)
        out += json.load(r); cursor = r.headers.get('x-next-cursor')
        if not cursor: return out

for e in sorted(evaluations(), key=lambda e: e['created_at']):
    if e['is_formal'] and e['total_runs'] >= 47 and not e['archived_at'] and e['candidate_name'] in CACHE and ONLY in (None, e['candidate_name']): evs[e['candidate_name']] = e
items = {c: get('evaluations/' + e['id'])['items'] for c, e in evs.items()}
for c, ids in EVALUATIONS.items():
    if ONLY not in (None, c): continue
    got = [get('evaluations/' + i) for i in ids]
    assert got[0]['is_formal'] and not any(g['archived_at'] for g in got) and len({g['candidate_version_id'] for g in got}) == 1, f'{c}: evaluations {ids}'
    evs[c], items[c] = got[0], [i for g in got for i in g['items']]
    assert len({i['task_name'] for i in items[c]}) == len(items[c]), f'{c}: a task in two of {ids}'
done = lambda i: i['score'] is not None or i['run_state'] == 'TIMED_OUT'   # a timeout is a result: it scores 0
items = {c: v for c, v in items.items() if sum(map(done, v)) >= MIN}
# Tasks whose runs are not collected. Off the site (Qiuyang, 2026-10-19: Security keeps only Progent and LRR): the other four
# Security tasks, and Progent's old name. Tasks still being built were here too, listed on the site with no runs and left out of
# FCI, FDI and every total, until their runs were final: vLLM, shown as Continuum (Qiuyang, 2026-10-19: "VLLM这个题ready了"),
# Progent (its 13 formal runs final and rescored, 2026-10-20, SCORE below) and KV Cache Compaction (Qiuyang, 2026-10-20: Opus's
# rejudged run accepted, RERUN below). LRR (Localized Regex Repair) was never here: its formal runs are collected as they land
# (Qiuyang, 2026-10-20: "LRR可以先不管gemini").
OFF_SITE = {'Argument-aware runtime privilege control',
            'Adaptive Robustness Evaluation for Prompt-Injection Defense', 'BROP: Hacking Blind — Return-Oriented Programming Without Binary Knowledge',
            'Enclave-Resident Admissible-Set Filter', 'Safe Abstract Trace-Cut — Coupled Optimization'}
# A run that stands in for the formal evaluation's run of a task, keyed by (candidate, task): a rerun on the task's current
# version that ran in an evaluation of its own. Gemini 4's Sparse Video Attention Policy follows the task's new version
# (cfg-e01e1a2f6173) as every other model's does (Qiuyang, 2026-10-18); its first try there died at start-up and was rerun.
# Claude Opus 5.5's KV Cache Compaction is its selected-final rejudge in the same evaluation (61.55, FAIL); the evaluation's item
# points at a later attempt with no score (Qiuyang, 2026-10-20: accepted).
# Gemini 4 Argon on agy's Robust Image Tokenizer: the agent stored a final (checkpoint-3) and the platform selected it, but
# its final evaluation found the verifier GPU quota used up; a FINAL-only recovery evaluation judged that stored final on the
# same task version (73.52, PASS), and it counts as the formal result (Qiuyang, 2026-10-25). ORIGIN below gives the run the
# agent worked in.
# Kimi K3.1 Pro's Learned Transformer Layer Mapping (DyT) and Localized Regex Repair: the agent stored a final, but the final
# evaluation found the verifier's GPU backend unavailable (verifier_gpu_error, the run FAILED with no score); FINAL-only
# recoveries judged the stored finals on the same task versions (50.86 and 23.19, both FAIL), and they count as the formal
# results, as Gemini 4 Argon on agy's Robust Image Tokenizer does (owner, 2026-10-27: ~/fcs2-ops/terra-k31/dispositions.json).
# Claude Fable 5.1's Clusterwise SpGEMM: the agent finished and stored a final (checkpoint-12), but its final verifier, which
# needs a whole 64-CPU node, never started (verifier_startup_timeout, the run FAILED with no score); a FINAL-only recovery
# judged that stored final on the same task version (64.40, PASS), and it counts as the formal result (owner, 2026-10-26:
# ~/fcs2-ops/fable51/dispositions.json).
# Gemini 4 Carbon's Learned Transformer Layer Mapping (DyT), Robust Image Tokenizer and Future Video Sampling: the same, after
# verifier_gpu_error on the final evaluation (70.00 PASS, 73.79 FAIL, 78.53 FAIL).
# Gemini 4 Carbon's Robust Image Tokenizer was rerun on 2026-10-30 (run_01M66YKCB8AH368BS290AP3WJ0): the first run's GPU
# verifier and runner returned HTTP 502 on both train calls and the final, so it had no development feedback. The rerun's
# final also hit verifier_gpu_error; a FINAL-only recovery (run_01M67HBD3STYJYNXEXTBR332DR) judged its stored final, 78.36
# PASS. The site's entry for it was written from the public release with bin/fcs2_db_from_release.py, its spend estimated
# at US$45.0757 (the gateway's token counts in its evidence at prices fitted to the other Carbon runs' costs); replace it
# from ~/fcs2-ops/cost/carbon-tokens.json when that file has the run.
RERUN = {('pi · Gemini 4', 'Sparse Video Attention Policy'): 'run_01M56053RVYXEC4EZTF9RWM8RK',
         ('Claude Code · Opus 5.5 (Subscription, max effort)', 'KV Cache Compaction'): 'run_01M5BMPCS19PVWJRAGZSF9ED8P',
         ('Antigravity CLI agy (gemini-4-argon)', 'Robust Image Tokenizer'): 'run_01M5SC18YDXQDSN33H4N4CR39K',
         ('Kimi Code (kimi-k3.1-pro)', 'Learned Transformer Layer Mapping'): 'run_01M5XMEAPJQ4WQMDT3P0V9WSNN',
         ('Kimi Code (kimi-k3.1-pro)', 'Localized Regex Repair'): 'run_01M5XMEF4254K0SF10T5XNER5H',
         ('Claude Code · Fable 5.1 (Subscription)', 'Fixed-Length Clustered Sparse Multiplication'): 'run_01M5XF64559G0EM66DV9KETQX9',
         ('Antigravity CLI agy (carbon-g)', 'Learned Transformer Layer Mapping'): 'run_01M60AP334JAY550WYY3AFV3R0',
         ('Antigravity CLI agy (carbon-g)', 'Robust Image Tokenizer'): 'run_01M6263SD4KAQ8TT2RDH80Q77J',
         ('Antigravity CLI agy (carbon-g)', 'Future Video Sampling'): 'run_01M6268V2F85C6C9KTA4CSG1K9',
         # Gemini 4 Carbon's KV Cache Compaction, GPU k-NN and SQL Counterexample Search: rerun with agy --print-timeout 6h
         # (eval_01M638Z49PG6MABGQEW3P4WCJK, 2026-10-29); the rerun is the result of record
         ('Antigravity CLI agy (carbon-g)', 'KV Cache Compaction'): 'run_01M638Z49R90XSREJ32SZ2QNYW',
         ('Antigravity CLI agy (carbon-g)', 'GPU Brute-Force k-NN Kernel Optimization'): 'run_01M638Z49RRKC0ZBVAD6VE47HY',
         ('Antigravity CLI agy (carbon-g)', 'SQL Counterexample Search'): 'run_01M638Z49Q4T7NCE1JBKSTGQR5'}
# A run that only judged another run's stored final (a FINAL-only recovery, on a candidate of its own that runs no agent):
# its score, verdict, reference and checks are the cell's; its wall time, spend and development scores are the original
# run's, given here.
ORIGIN = {'run_01M5SC18YDXQDSN33H4N4CR39K': 'run_01M5RHJYJ7N3JMSRHSR3PBXW9C',
          'run_01M5XMEAPJQ4WQMDT3P0V9WSNN': 'run_01M5WW43VKCX28S8T9ZZ5FZCEM', 'run_01M5XMEF4254K0SF10T5XNER5H': 'run_01M5WW43VNG86BDMKB8DWKBQWE',
          'run_01M5XF64559G0EM66DV9KETQX9': 'run_01M5VAJHMZ2T9FX5Y34ZDJ36ET',
          'run_01M60AP334JAY550WYY3AFV3R0': 'run_01M5ZHWA8RAXQNJCSQ1KJ5QTSW', 'run_01M6263SD4KAQ8TT2RDH80Q77J': 'run_01M61SR0CCCAQS13DD4FPWCNC8',
          'run_01M6268V2F85C6C9KTA4CSG1K9': 'run_01M61SR0PXEE665RDGSV1JCXYR'}
# Runs that ended with no score and that Qiuyang judged the candidate's own failure: they score 0 and fail, as a timeout does.
# Kimi K3's vLLM run: the agent exited without a final submission, and it is not retried (Qiuyang, 2026-10-19). Kimi K3's
# LRR run: it ended FAILED with no score and no adjudication cause (Qiuyang, 2026-10-20: "就是0").
# DeepSeek V4.1 Flash 1017 (eval_01M5QR7T4F49NGYJQMS5WR45BH; Qiuyang, 2026-10-24: a run that never submitted a final stays
# 0/FAIL, no checkpoint is judged in its place): Residual State Advancement and BABBLE, the agent container OOM-killed within
# the task's memory limit (exit 137); Continuum, the model wrote its last tool call as malformed DSML text, so the harness
# ended with no final; EVM State Checkpoints and Glenside, the agent filled the task's 8 GiB workspace and was evicted;
# MuJoCo Playground, the model's own code sent SIGTERM to every process whose command line matched, the harness included.
# Evidence per run: ~/fcs2-ops/ds1017/dispositions.json (the evaluation monitor).
# Gemini 4 Argon on agy's KV Cache Compaction: the model answered with plain text instead of a tool call, so agy ended the
# session after one turn with no final (eval_01M5RHJYJ0Z12JB8D3R4YCG9M2; same rule, 2026-10-25).
# Claude Fable 5.1 (eval_01M5VAJHMRE1PZRN6NKP0G24RZ; owner, 2026-10-26: "按照规则给他标记"): BABBLE and Parallel DBSCAN, the agent
# container OOM-killed within the task's limit (8 GiB on BABBLE, 4 GiB on Parallel DBSCAN; exit 137) before any submission; Diffusion Policy, the agent installed
# PyTorch into the task's 4 GiB workspace and was evicted (exit 143) before any submission. Evidence per run:
# ~/fcs2-ops/fable51/dispositions.json.
# Gemini 4 Carbon (eval_01M5ZHWA8HFDS1QY8JGVN0RKMM; same rule): Parallel DBSCAN and BABBLE, the agent container OOM-killed
# within the task's limit (4 GiB on Parallel DBSCAN, 8 GiB on BABBLE; exit 137) before any submission.
ZERO = {'run_01M5A2T1WJSCR64W2ZP34T8KHV', 'run_01M5C2J5QNEPEYAWMQY3HD7MF4',
        'run_01M5QR7T4M65RY0VAYMQDN6TP2', 'run_01M5QR7T4PJ4ZR9KSZN1X28WC7', 'run_01M5QR7T4N5K0QKQSCH6PXW660',
        'run_01M5QR7T4MKQYAT9R6AE36HH2B', 'run_01M5QR7T4P9BAF9GZ9NPSQAGM7', 'run_01M5QR7T4PE4CXY3CM4Y95WE31',
        'run_01M5RHJYJ60FQPMFRZZ4HGZC0Q',
        'run_01M5VAJHMZ7XW1E850Z2M0SM3K', 'run_01M5VAJHMZXCEMGN8RREPEAVCB', 'run_01M5VAJHMZSTXYEGRP3ZVF9R9K',
        'run_01M61SQZJ5A7HWMZMM975PG4V8', 'run_01M61SR17DTR7FS5GE4HM2EQDJ'}
# Why a run in ZERO ended without a final, as the overview's kebab says it (from the evaluation monitor's disposition of
# each run, ~/fcs2-ops/ds1017/dispositions.json).
WHY = {'run_01M5QR7T4M65RY0VAYMQDN6TP2': 'Out of memory (exit 137)',            # within the task's 16 GiB limit
       'run_01M5QR7T4PJ4ZR9KSZN1X28WC7': 'Out of memory (exit 137)',            # within the task's 8 GiB limit
       'run_01M5QR7T4N5K0QKQSCH6PXW660': 'Malformed tool calls, no final',      # its last tool call was malformed DSML text
       'run_01M5QR7T4MKQYAT9R6AE36HH2B': 'Workspace over 8 GiB, evicted',
       'run_01M5QR7T4P9BAF9GZ9NPSQAGM7': 'Workspace over 8 GiB, evicted',
       'run_01M5QR7T4PE4CXY3CM4Y95WE31': 'Killed its own harness, no final',    # its code sent SIGTERM to matching processes
       'run_01M5RHJYJ60FQPMFRZZ4HGZC0Q': 'Ended without a final (text-only turn)',
       'run_01M5VAJHMZ7XW1E850Z2M0SM3K': 'Out of memory (exit 137)',            # within the task's 8 GiB limit (BABBLE)
       'run_01M5VAJHMZXCEMGN8RREPEAVCB': 'Out of memory (exit 137)',            # within the task's 4 GiB limit
       'run_01M5VAJHMZSTXYEGRP3ZVF9R9K': 'Workspace over 4 GiB, evicted',
       'run_01M61SQZJ5A7HWMZMM975PG4V8': 'Out of memory (exit 137)',            # within the task's 4 GiB limit
       'run_01M61SR17DTR7FS5GE4HM2EQDJ': 'Out of memory (exit 137)'}            # within the task's 8 GiB limit (BABBLE)
# Runs the platform marks FAILED whose selected final was rejudged and accepted: they completed, so the site shows no failure
# for them. Claude Opus 5.5's KV Cache Compaction (61.55; Qiuyang, 2026-10-20: "kebab上的opus kv compaction信息是否不对").
COMPLETED = {'run_01M5BMPCS19PVWJRAGZSF9ED8P'}
# Scores that replace the platform's, by run: KV Compaction and Progent, rescored on absolute scales from each run's own
# final-verification measurements (Qiuyang, 2026-10-21; no run was re-executed, verdicts unchanged, all fail). They replace
# the platform's relative scores, which pinned the human reference at 0, and Progent's scheme-R remap of 2026-10-20.
# KV Compaction (the formula Qiuyang chose): per article, accuracy x (0.75 + 0.25 e), accuracy = correct / questions and
# e = clip(0.5 + log10(r) / 6, 0, 1), where in time mode r = (reference seconds / candidate seconds) x min(1, reference bytes /
# candidate bytes), bytes and seconds swapped in bytes mode; 100 x the mean over the 24 articles. Accuracy dominates and
# efficiency is a bounded bonus. Runs with no scored final stay 0. Progent: per suite, utility under attack x (1 - breached /
# attacked); 100 x the mean over the 4 suites. Values and detail: reports/rescore-kv-progent-20261021.json (the evaluation
# monitor). DeepSeek V4.1 Flash 1017's KV Compaction (run_01M5QR7T4N2JSP0D7T2W3MC749, 61.9873) and Progent
# (run_01M5QR7T4QP75TZWX1A8XGFRYE, 49.3222), and their references and development scores below, by the same formulas from each
# run's final and train evidence (2026-10-25; the formulas reproduce the 2026-10-21 values of DeepSeek V4.1 Flash's and GLM 5.3's
# released runs to the fourth decimal); both still fail. Gemini 4 Argon on agy's Progent (run_01M5RHJYJ8CC2Y5BMAWWEHNM5A,
# 56.2725, reference 40.033) and its two development scores, by the same formula (2026-10-25, ~/fcs2-ops/site-gemini-agy/
# rescore.py, which reproduces DeepSeek V4.1 Flash 1017's values above exactly); it passes, as the platform judged it.
# GPT-6.1 Terra's KV Compaction (run_01M5WSAM360SH8XJMCPBXXSNEM, 50.3647, reference 60.6278, and its seven scored development
# submissions) and Progent (run_01M5WSAM37K6GZP7FYGDJR0G47, 26.7725, reference 37.6631; its one development submission failed
# and has no score), by the same formulas from each run's own final and train measurements (2026-10-27,
# ~/fcs2-ops/site-terra/rescore.py; KV reads paired_workload_metrics, the task version's name for the measurements); both
# fail, as the platform judged them. Kimi K3.1 Pro's KV Compaction (run_01M5WW43VKTD5EPYXPDB9W5VMD, 56.7017, reference 60.6278,
# five development scores) and Progent (run_01M5WW43VND5W5SATXS9PDAJ6W, 45.4725, reference 39.8199, two development scores),
# the same way (2026-10-27); both fail, as the platform judged them (Progent above the reference but not on every metric).
# Claude Fable 5.1's KV Compaction (run_01M5ZE82Z39XH8G29CKJJDSMCS, 52.1786, reference 60.6278, eight development scores) and
# Progent (run_01M5VAJHMZYCT2SKZ0BFTRMKPZ, 56.1778, reference 41.0058, four development scores), the same way (2026-10-28,
# ~/fcs2-ops/site-fable/rescore.py); both fail, as the platform judged them (Progent above the reference but not on every metric).
# Gemini 4 Carbon's Progent (run_01M5ZHWA8SSY4TD8QXDXNMBVQZ, 53.365, reference 40.268, three development scores), the same way
# (2026-10-29); it passes, as the platform judged it. Its KV Compaction (run_01M638Z49R90XSREJ32SZ2QNYW, 58.7449, reference
# 60.6278, four development scores, the last 0: that submission's compaction crashed), the same way (2026-10-29); it fails, as the platform judged it.
SCORE = {'run_01M5B6757V0VMSXB5QZGAWXB6C': 56.8798, 'run_01M5970STDD1FKW0ECD8Q2XD28': 55.7482,
         'run_01M59RP96FT226RGXVGBP05MGT': 55.3904, 'run_01M5AZ52W78HS5FPKF2HZ30ZMG': 50.4422,
         'run_01M5BPM6CGT9G16Z0KKXDV1192': 49.4521, 'run_01M5B71VP4ZTTXEDZTSJRWHCF2': 48.7175,
         'run_01M5BK617HDNV0WQTAD3NCN4FV': 47.5928, 'run_01M59M7AQSZ72Q1M636KB5H5H6': 46.535,
         'run_01M5AM6HJ0RDC319S3659NYS5J': 44.7325, 'run_01M5A0ECGVTSPMT687NJQKGCXA': 43.6441,
         'run_01M5972EXRM8BNEA6192D4WPMJ': 43.169, 'run_01M59KZ1ASYHPCSNM1GF2C360N': 36.8325,
         'run_01M5A0BA07T7WEQS9K0PTCR7TT': 36.1468, 'run_01M5BMPCS19PVWJRAGZSF9ED8P': 68.1994,
         'run_01M5BP6WGY6VJ137N8KBKYJ6ST': 63.7368, 'run_01M5B3M1E5MSE78KE480G6HARS': 61.8734,
         'run_01M5BGJMS0CVMZQN2KBE6JY8P2': 59.0941, 'run_01M5BPFMHBVMKV3TBTB5HW2XD2': 56.8701,
         'run_01M5B3Q2GAQQA222W6DRZDP0R7': 51.7117, 'run_01M5BGMM8NF591Z8ZPT5MMF1VD': 46.8766,
         'run_01M5BPACVQ0VFV9S4N37Y5H4QZ': 46.9225, 'run_01M5B3Z6EHETQBZF3GSPQJJZGN': 52.2678,
         'run_01M5BMR4VSNRK7GCBTE729E9E5': 52.5936, 'run_01M5BPC4T5EBT3A9MG03Q9N88V': 0.0,
         'run_01M5BP8MTSK6ZWWNTGY2SPW5BX': 0.0, 'run_01M5BMSWSWFN9RFSZMBHQ2M7PQ': 0.0,
         'run_01M5QR7T4N2JSP0D7T2W3MC749': 61.9873, 'run_01M5QR7T4QP75TZWX1A8XGFRYE': 49.3222,
         'run_01M5RHJYJ8CC2Y5BMAWWEHNM5A': 56.2725,
         'run_01M5WSAM360SH8XJMCPBXXSNEM': 50.3647, 'run_01M5WSAM37K6GZP7FYGDJR0G47': 26.7725,
         'run_01M5WW43VKTD5EPYXPDB9W5VMD': 56.7017, 'run_01M5WW43VND5W5SATXS9PDAJ6W': 45.4725,
         'run_01M5ZE82Z39XH8G29CKJJDSMCS': 52.1786, 'run_01M5VAJHMZYCT2SKZ0BFTRMKPZ': 56.1778,
         'run_01M5ZHWA8SSY4TD8QXDXNMBVQZ': 53.365, 'run_01M638Z49R90XSREJ32SZ2QNYW': 58.7449}
# The human reference's score on the same scales, measured in each run (KV Compaction's frozen captures give 60.63 in every
# run, 87.5 x its mean accuracy; Progent's reference policy is measured live, 38.9 to 41.8); the site shows the median over the
# task's runs, as for every task. The platform reports 0 for both, its relative scale.
REFERENCE = {'run_01M5B6757V0VMSXB5QZGAWXB6C': 40.635, 'run_01M5970STDD1FKW0ECD8Q2XD28': 40.2956,
             'run_01M59RP96FT226RGXVGBP05MGT': 39.8665, 'run_01M5AZ52W78HS5FPKF2HZ30ZMG': 40.9445,
             'run_01M5BPM6CGT9G16Z0KKXDV1192': 41.0416, 'run_01M5B71VP4ZTTXEDZTSJRWHCF2': 41.1292,
             'run_01M5BK617HDNV0WQTAD3NCN4FV': 40.4349, 'run_01M59M7AQSZ72Q1M636KB5H5H6': 40.3874,
             'run_01M5AM6HJ0RDC319S3659NYS5J': 40.2264, 'run_01M5A0ECGVTSPMT687NJQKGCXA': 39.1359,
             'run_01M5972EXRM8BNEA6192D4WPMJ': 41.3253, 'run_01M59KZ1ASYHPCSNM1GF2C360N': 38.8663,
             'run_01M5A0BA07T7WEQS9K0PTCR7TT': 41.7748, 'run_01M5BMPCS19PVWJRAGZSF9ED8P': 60.6278,
             'run_01M5BP6WGY6VJ137N8KBKYJ6ST': 60.6278, 'run_01M5B3M1E5MSE78KE480G6HARS': 60.6278,
             'run_01M5BGJMS0CVMZQN2KBE6JY8P2': 60.6278, 'run_01M5BPFMHBVMKV3TBTB5HW2XD2': 60.6278,
             'run_01M5B3Q2GAQQA222W6DRZDP0R7': 60.6278, 'run_01M5BGMM8NF591Z8ZPT5MMF1VD': 60.6278,
             'run_01M5BPACVQ0VFV9S4N37Y5H4QZ': 60.6278, 'run_01M5B3Z6EHETQBZF3GSPQJJZGN': 60.6278,
             'run_01M5BMR4VSNRK7GCBTE729E9E5': 60.6278,
             'run_01M5QR7T4N2JSP0D7T2W3MC749': 60.6278, 'run_01M5QR7T4QP75TZWX1A8XGFRYE': 39.5199,
             'run_01M5RHJYJ8CC2Y5BMAWWEHNM5A': 40.033,
             'run_01M5WSAM360SH8XJMCPBXXSNEM': 60.6278, 'run_01M5WSAM37K6GZP7FYGDJR0G47': 37.6631,
             'run_01M5WW43VKTD5EPYXPDB9W5VMD': 60.6278, 'run_01M5WW43VND5W5SATXS9PDAJ6W': 39.8199,
             'run_01M5ZE82Z39XH8G29CKJJDSMCS': 60.6278, 'run_01M5VAJHMZYCT2SKZ0BFTRMKPZ': 41.0058,
             'run_01M5ZHWA8SSY4TD8QXDXNMBVQZ': 40.268, 'run_01M638Z49R90XSREJ32SZ2QNYW': 60.6278}
# Development scores that replace the platform's, by verification: KV Compaction's and Progent's train submissions,
# rescored with the same formulas as their finals above (the evaluation monitor, 2026-10-21:
# reports/rescore-kv-progent-train-20261021.json; Qiuyang approved the formulas). Evaluations that failed at the time had no
# score then and have none here; they still count 0. Progent's development suites are smaller than its final suite, so its
# development scores can exceed its final ones.
TRAIN = {'verification_01M59D1KBE7X37J6RAZ70V52F8': 61.1975, 'verification_01M59S4HN8ZF22QFYZRGJRCK6D': 50.8707,
         'verification_01M59TFAHKKSW3HX68X08W0Q54': 49.9, 'verification_01M59VNT98GPY40J3SPVAR65XY': 52.3666,
         'verification_01M59VPRBYP47B6198R5CJBQHF': 59.6994, 'verification_01M5A4QD0YXC70V9A7BCFZE5V9': 54.8356,
         'verification_01M5A5SAT0CH6RR6N6J0Z38626': 55.6001, 'verification_01M5A6BEKCKA9J8RQRRCQTQDVY': 53.1462,
         'verification_01M5A6ZTDPBYSWAV1BC5FH4WHH': 53.9241, 'verification_01M5A7J8QCYNBGHV7XK11445D3': 52.4657,
         'verification_01M5BA05HJ5JXMG52AH06QQB12': 71.4225, 'verification_01M5BBSVJBP7DYB51V7KX33C3K': 71.6475,
         'verification_01M5BDBF5FZQTG926QY512DDGA': 80.535, 'verification_01M5BEGDASJ0NN916HJQQ9EAS7': 80.2175,
         'verification_01M5AZPWWGXGV1QT83JWJSQ8FN': 52.6267, 'verification_01M5B18C7DR72ZMP45GZ5QX9WJ': 55.7536,
         'verification_01M5BBKNRC1MGV2MC4XQ977ERY': 55.1275, 'verification_01M5BCSCF6RVYGZPJJ7JK25B77': 56.6573,
         'verification_01M5BDW35S3QNWY11SEP56E77A': 54.7343, 'verification_01M5BKJEDE4ZZMBB836WXXDZC5': 32.8547,
         'verification_01M5BMBC34AT9YDN8ZXHNYH17P': 52.3302, 'verification_01M5BMYJ89WVY6WZQ09WDGP92F': 54.0525,
         'verification_01M5BNGXQ7DTV4NE0C93QNPX37': 53.05, 'verification_01M5BP34EKBH6F8BQKJYAAM6GD': 53.345,
         'verification_01M5BVVQPCT62HFBHP14W0ESG8': 54.3325, 'verification_01M5BXE0XA39MFE376HDFRRPK9': 58.01,
         'verification_01M5BHV6JBNKXWR3VVBD7P9JB3': 46.7941, 'verification_01M5BPPG57NYQT7DNQ4ZZ59YPF': 45.3335,
         'verification_01M5BR5M3N5RCYHWV07K5C5T4T': 46.7915, 'verification_01M5BS10402B7S4VZK5S4ZT91N': 46.5539,
         'verification_01M5BT11T209PTPNCAEYRM623Q': 60.7359, 'verification_01M5BTQEC1RG6CSM27A96AMSCM': 59.8088,
         'verification_01M5BH6HMGJKTDFKH6323Z6H5M': 46.2005, 'verification_01M5BS4Q12NW3RMBJK2RDE2261': 48.3257,
         'verification_01M5BWTCVB5ZBFZW82CWCES7JA': 48.3134, 'verification_01M5BPZRHQD0MH6HCX46NTSGSZ': 63.0248,
         'verification_01M5BS3TWPXY6J9NWMJRTEC26J': 60.7959, 'verification_01M5BVM9PA2VZNQWD84C8GGQWM': 58.8972,
         'verification_01M5BWDDCBJNABTRPZZ8EPQ0WN': 61.6511, 'verification_01M5BX1K2GNX113PN955P1VM2Y': 66.292,
         'verification_01M5BXT4HG85FAA5V4N8DXYEWE': 66.2511, 'verification_01M5BYEYVB4D9YE9PVSPTKKYAF': 71.1002,
         'verification_01M5BZA331XT3SE88S9AD4JHE7': 66.7901, 'verification_01M5B44QAQYAGE7PKHH5XHV57A': 52.3916,
         'verification_01M5B4PSJGXQNRSF8BKVT5G8CD': 52.7401, 'verification_01M5B58CXPXAFV0DWH06AYHM0P': 55.2921,
         'verification_01M5B5ZG5WCBDM80PJY8PZHPCA': 51.261, 'verification_01M5B73CJV3MMHMK7PQQKKBZAQ': 55.9311,
         'verification_01M5B81HVTFV6TA5P7HY9N3J68': 58.9441, 'verification_01M5BFD7MXM4RDSH38MJZ7MGG7': 55.6271,
         'verification_01M5BH7NHVWRSF58CGK471Q04R': 58.5929, 'verification_01M5BAJ08PAF5BQGVYSWZ4PB5B': 62.6745,
         'verification_01M5B3YJAMCKEFK320HBA6RSPQ': 51.1882, 'verification_01M5B5P7JS1WJRGYGY34FN5DSK': 48.1974,
         'verification_01M5B6KETDR08739SSTP3GBBVS': 53.9417, 'verification_01M5BA865RP094ZDJBCGHEH618': 0.0,
         'verification_01M5BAQHWVVDSP56N6CKCHG1A5': 53.5476, 'verification_01M5BENDNWMBY72XVBXPVW4W8R': 53.1527,
         'verification_01M5BFQ2JFK4Z7HC8EYRSYK1CQ': 55.3606, 'verification_01M5BKT4S19DR38AZG3TC4XHVE': 50.5726,
         'verification_01M5BXPGEZPP8D4RSFH60RCPQA': 48.0909, 'verification_01M5C2PPBVVGSCKECAYNDFG0WM': 46.6898,
         'verification_01M5C3PVT62CWWY3RE2H10AXQK': 51.488, 'verification_01M5C561ADXNAZ0EPK9Q4RK20G': 47.3868,
         'verification_01M5BQKXS4213YRGHA6QTPG24C': 41.6615, 'verification_01M5BSC6JH1JVZY1SG0Y2F9AYA': 44.0513,
         'verification_01M5BV2R97P3RRB7H6C8ATTT5H': 54.1767, 'verification_01M5BXJXY4AH9T98T4A65G91V4': 56.9397,
         'verification_01M5C0SN68M80QD33DSZQHJC19': 57.1524, 'verification_01M5C517VHMDXKV670QP7XNKGJ': 57.1704,
         'verification_01M5BQJHA9GDNYMDTBQHP437B7': 58.1269, 'verification_01M5BRT0ASMZW02EHPZ6QHJSNS': 59.8786,
         'verification_01M5BV7ZNS1CJG5MZGFD3G17DB': 64.406, 'verification_01M5BW190829G7BMVWK8JK74NX': 62.983,
         'verification_01M5BWS5J3R254VQSGGKFASDDE': 64.962, 'verification_01M5BYQJ7VG77D9NBMKK5G83CJ': 62.2323,
         'verification_01M5BQ1VG8X9YMP21F71V98FTQ': 0.0, 'verification_01M5BQX6GGZN4DWZGKBD452D4E': 39.0847,
         'verification_01M5BXB8Y7SSKKK9HF9QA7DTNZ': 49.4566, 'verification_01M5BZRM30G7SYZ0362DJ06FA4': 53.4738,
         'verification_01M5BQF4F9V9VTQP15NS5FFN47': 0.0, 'verification_01M5C1NH2A2CQT8B5ZDJ8VK9ER': 0.0,
         'verification_01M5C3KBC1FNK4JVA0TFC0P9JN': 0.0, 'verification_01M5C42XK2BSJBXM90WRG85YGE': 0.0,
         'verification_01M5BY8V5VHG2FZ2Y921MFXSW6': 55.1433, 'verification_01M5C27FWHFWQ36CW4MA14X3S3': 59.5979,
         # DeepSeek V4.1 Flash 1017's (2026-10-25): KV Compaction, then Progent
         'verification_01M5R0KBD3J1A7GMF6GC8F5Z61': 50.6754, 'verification_01M5R4HJC04YAVHW4Y2PQNRXFC': 53.2471,
         'verification_01M5R6F0HKKMRP4N7M7W8PQEQB': 57.0905, 'verification_01M5R79S65FEWJNYBK7PJR1HMM': 60.94,
         'verification_01M5R85RYE4832TXGSRP56360T': 58.024, 'verification_01M5R8XD0KW4HPHB62GEQFHCQA': 65.4983,
         'verification_01M5R9SHX74F0865K3WTB5ZYV0': 51.6925, 'verification_01M5R8YED816C29J513T3X469F': 50.36,
         'verification_01M5RAPV2VK6JRBGG67RRMBS19': 59.4675, 'verification_01M5RBJNNK6Q6G4F4N0EZ2RAVZ': 58.3875,
         # Gemini 4 Argon on agy's (2026-10-25): Progent
         'verification_01M5S0BNTSEDZ4TCBAJM7VP1BE': 58.8025, 'verification_01M5S3CRKZWWA7W44CHYK204MG': 59.365,
         # GPT-6.1 Terra's (2026-10-27): KV Compaction
         'verification_01M5WSSWGGM5YKQD207C54HM47': 44.3583, 'verification_01M5WTDSQZ8W2W5NG6W6XVD76C': 42.6851,
         'verification_01M5WV02C8C198VK23RRHTZXHD': 41.4058, 'verification_01M5WVM8YF7JKHA8D6N3CF3AJ7': 48.9485,
         'verification_01M5WW7B79BJ5Q1XTXMXZ1AZVF': 51.0075, 'verification_01M5WWSX5VF9T01N0V21TK90D7': 52.2608,
         'verification_01M5WXHMGBGHMQ1G0RHFTDAE05': 55.1489,
         'verification_01M5X8KNT0T36YWDZN578PSXDK': 47.9044, 'verification_01M5XAZTAADNZXARYKP97ZJPY8': 52.4564,
         'verification_01M5XBHDMB35VYKAQN2TS9A6TF': 54.0028, 'verification_01M5XDV9TCQJZA650QWNJ8YS1V': 55.0152,
         'verification_01M5XFMFNC928QWV7KRHF18PAB': 57.1142,
         'verification_01M5XBJ5FZZQZNZZQ4XHRW2EK9': 36.9625, 'verification_01M5XD1XCQP9HFM8N7PVNZ8SYC': 53.985,
         # Claude Fable 5.1's (2026-10-28): KV Compaction, then Progent
         'verification_01M61A3CSM9EC51D3QSV1D3VW9': 48.1577, 'verification_01M61BFBCQFZKCA1MACYCSQHEY': 53.547,
         'verification_01M61CGWH22JJG3CPNZ3CNBJGP': 50.8517, 'verification_01M61DWMD8VKDHARJHHV243BBB': 49.1397,
         'verification_01M61F1QR7XKHP1TQR3PMPBTDM': 50.1886, 'verification_01M61G4BN0P0JW4TC0AX0GDVPH': 51.2325,
         'verification_01M61GW14NAZTRMA938Z4TQHAA': 50.0068, 'verification_01M61HVZSRJKTHQ8KW3Z6ZGM52': 50.7556,
         'verification_01M5XHAVNA0M5S8XV1P2JDK8RB': 58.8, 'verification_01M5XK9CNPCC49DYJGPGDNB5AW': 61.015,
         'verification_01M5XKZFDVJV1YDJ0V7F4FHC0V': 61.3825, 'verification_01M5XN1RZMX5GFDF1SZ3KPRJG4': 59.4275,
         # Gemini 4 Carbon's (2026-10-29): Progent
         'verification_01M60F554CK8Z9C3RQWQJJC7S5': 55.1475, 'verification_01M60GRQV6SCVHEGS0E2CDERHZ': 57.6775,
         'verification_01M60JSW4QJNT0YS78SA2G85YP': 56.83,
         # Gemini 4 Carbon's (2026-10-29): KV Compaction
         'verification_01M63DPNRBA6K364REB6R2P2K7': 56.7467, 'verification_01M63KPT145AFB1G06MTS9SRMF': 62.7603,
         'verification_01M63R0HVWNV3F7GDAFQ4SM9NC': 57.2769,
         'verification_01M63S3324DE65Y30XP6C5BXG6': 0.0}   # its compaction crashed (EngineDeadError): no answers, 0 on either scale
# The rescored runs the platform judged PASS: the rescore changes the score only, never the verdict.
SCORE_PASS = {'run_01M5RHJYJ8CC2Y5BMAWWEHNM5A', 'run_01M5ZHWA8SSY4TD8QXDXNMBVQZ'}
rids = [(c, RERUN.get((c, i['task_name']), i['run_id'])) for c, v in items.items() for i in v if i.get('run_id') and i['task_name'] not in OFF_SITE]
with ThreadPoolExecutor(16) as ex:
    pulled = list(ex.map(lambda cr: (cr[0], get('runs/' + cr[1]), get(f'runs/{ORIGIN.get(cr[1], cr[1])}/events?limit=500')), rids))
    origin = dict(ex.map(lambda r: (r, get('runs/' + ORIGIN[r])), [r for _, r in rids if r in ORIGIN]))
# A rerun may use another version of the same candidate only where listed: Gemini 4 Carbon's 2026-10-29 reruns ran on a version
# that differs from the formal one only in agy's --print-timeout (6h instead of 0, so agy no longer stops a background command
# 30 minutes after the turn ends).
RERUN_VERSION = {'Antigravity CLI agy (carbon-g)': {'candver_5RCWKAF54KH9KJS5465YS8EGD3'}}
assert all((origin[r['id']] if r['id'] in ORIGIN else r)['candidate_version_id'] in {evs[c]['candidate_version_id'], *RERUN_VERSION.get(c, ())}
           for c, r, _ in pulled if r['id'] in RERUN.values()), 'a rerun of another candidate version'
assert all(origin[r['id']]['task_version_id'] == r['task_version_id'] for _, r, _ in pulled if r['id'] in ORIGIN), 'a recovery on another task version'
ids = {r['id'] for _, r, _ in pulled}
if ONLY:   # the tables' other runs belong to candidates not collected: every rescored run collected has all its development scores
    assert all(e['payload']['verification_id'] in TRAIN for _, r, ev in pulled if r['id'] in SCORE for e in ev
               if e['kind'] == 'VERIFIER_TRAIN_COMPLETED' and e['payload'].get('raw_score') is not None), 'a rescored run\'s development score is not rescored'
else: assert set(SCORE) <= ids, 'a rescored run is no longer its formal evaluation\'s'
assert all(r['verdict'] == ('PASS' if r['id'] in SCORE_PASS else 'FAIL') for _, r, _ in pulled if r['id'] in SCORE), 'a rescored run\'s verdict changed'

# Claude Code usage with tokens but no cost (a run without the CLI's final result): price the four token kinds at the
# rates implied by the runs that report both, per model (least squares; the CLI's cost is linear in them).
KINDS = ('input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens')
claude = lambda r: (r.get('claude_trace') or {}).get('usage') or {}
RATE = {}
for c in items:
    both = [claude(r) for cc, r, _ in pulled if cc == c and claude(r).get('estimated_cost_usd')]
    if len(both) >= 8:
        import numpy as np
        RATE[c] = np.linalg.lstsq(np.array([[u.get(k) or 0 for k in KINDS] for u in both], float), np.array([u['estimated_cost_usd'] for u in both]), rcond=None)[0]
# --claude-usage=FILE: usage recovered from saved Claude Code traces (schema frontiercs2.opus55-usage-recovered/v1), for runs
# the API has no usage for. An exact run keeps its reported cost. A lower-bound run (the trace stops before the run ends)
# is priced from the token classes of the saved part at OPUS_RATE, scaled up by the file's estimate of the run's total
# tokens; the missing part of the trace is the only estimate in it.
# OPUS_RATE, US$ per million tokens (output, cache read, cache write): the cost Claude Code reports for Opus 5.5 equals
# these rates exactly on 32 of the file's 34 exact runs (to the cent); the other two report about $2 more than the rates give.
OPUS_RATE = (20.0, 0.20, 8.0)
RECOVERED = {}
for a in sys.argv[2:]:
    if a.startswith('--claude-usage='):
        for x in json.load(open(a[15:]))['runs']:
            if x['usage_status'] == 'exact': RECOVERED[x['run_id']] = x['estimated_cost_usd']
            else:
                known = (x['known_output_tokens'] * OPUS_RATE[0] + x['cache_read_input_tokens'] * OPUS_RATE[1] + x['cache_creation_input_tokens'] * OPUS_RATE[2]) / 1e6
                RECOVERED[x['run_id']] = known * x['estimated_total_tokens'] / x['known_total_tokens']
# --trace-usage=FILE: costs computed from the released traces for runs the platform has no usage for (Qiuyang, 2026-10-22).
for a in sys.argv[2:]:
    if a.startswith('--trace-usage='):
        for x in json.load(open(a[14:]))['runs']: RECOVERED[x['run_id']] = x['estimated_cost_usd']

RUN_COST = {}
for a in sys.argv[2:]:
    if a.startswith('--run-cost='): RUN_COST.update({x['run_id']: x['openrouter_actual_usd'] if 'openrouter_actual_usd' in x else x['usd'] for x in json.load(open(a[11:]))['rows'] if x.get('run_id')})


def agent_usd(c, r):
    if r['id'] in RECOVERED: return RECOVERED[r['id']]
    u = claude(r)
    if u.get('estimated_cost_usd'): return u['estimated_cost_usd']
    return float(max(0, RATE[c] @ [u.get(k) or 0 for k in KINDS])) if u and c in RATE else 0

# A refresh without --claude-usage loses the Opus 5.5 costs recovered from saved traces (2026-10-20: two snapshots
# dropped them, and five Opus runs lost their cost; restored from exports/opus-usage/opus55-usage-recovered.json). Stop
# instead, unless every Claude Code run has usage of its own.
# A FINAL-only recovery runs no agent: the run it judged (ORIGIN) carries the usage, as below.
noclaude = [o['id'] for c, r, _ in pulled for o in [origin.get(r['id'], r)] if c.startswith('Claude Code') and o['id'] not in RUN_COST and not agent_usd(c, o) and not any(k.get('estimated_cost_usd') or k.get('total_tokens') for k in (o.get('model_usage') or {}).get('keys', []))]
if noclaude and not RECOVERED:
    sys.exit(f'{len(noclaude)} Claude Code runs have no usage: pass --claude-usage=<opus55-usage-recovered.json> ({", ".join(noclaude[:5])} ...)')
if os.path.exists(sys.argv[1]): os.remove(sys.argv[1])
db = sqlite3.connect(sys.argv[1])
db.executescript('''create table release(generated_at text);
create table candidates(id text primary key, name text, ordinal int); create table tasks(id text primary key, name text, ordinal int);
create table cells(run_id text, candidate_id text, task_id text);
create table runs(id text primary key, display_score real, state text, display_verdict text, elapsed_seconds real, feedback_json text);
create table submissions(run_id text, id text, kind text, patch_sha256 text, ordinal int);
create table score_points(run_id text, submission_id text, score real, total_tokens real, output_tokens real);''')
db.execute('insert into release values (?)', (datetime.now(timezone.utc).isoformat(),))
for n, c in enumerate(items): db.execute('insert into candidates values (?,?,?)', (c, c, n))
tasks = {}
used = set()   # TRAIN entries that met their verification
for c, r, events in pulled:
    tasks.setdefault(r['task_id'], r['task_name'])
    o = origin.get(r['id'], r)   # the run the agent worked in: its time, spend and development scores
    start, end = (ts(o[k]) if o.get(k) else None for k in ('started_at', 'finished_at'))
    usage = (o.get('model_usage') or {}).get('keys', [])
    agent = agent_usd(c, o)   # Claude Code reports its own usage
    usd = RUN_COST.get(o['id']) or sum(k.get('estimated_cost_usd') or 0 for k in usage) or agent or sum(k.get('total_tokens') or 0 for k in usage) * (CACHE[c] or 0) / 1e6
    units = lambda x: x * 1e6
    priv = (r.get('metrics') or {}).get('private') or {}
    fb = {'reference_score': REFERENCE.get(r['id'], priv.get('reference_score')), 'checks': [{'label': k} for k in (priv.get('beat_spec_progress') or {})]}
    if (r.get('adjudication') or {}).get('cause') == 'provider_refusal_no_final': fb['refusal'] = True   # the model's provider refused and no final came
    if r['id'] in WHY: fb['why'] = WHY[r['id']]
    zero = r['score'] is None and (r['state'] == 'TIMED_OUT' or r['id'] in ZERO)
    db.execute('insert into runs values (?,?,?,?,?,?)', (r['id'], SCORE.get(r['id'], 0.0 if zero else r['score']), 'COMPLETED' if r['id'] in COMPLETED else r['state'], 'FAIL' if zero and r['id'] in ZERO else r['verdict'], end - start if start and end else None, json.dumps(fb)))
    db.execute('insert into cells values (?,?,?)', (r['id'], c, r['task_id']))
    n = 0
    for e in events:
        if e['kind'] != 'VERIFIER_TRAIN_COMPLETED' or not (start and end): continue
        p = e['payload']; frac = min(1, max(0, (ts(e['occurred_at']) - start) / max(end - start, 1)))
        db.execute('insert into submissions values (?,?,?,?,?)', (r['id'], p['verification_id'], 'train', p['payload_id'], n)); n += 1
        if p['verification_id'] in TRAIN: used.add(p['verification_id'])
        db.execute('insert into score_points values (?,?,?,?,null)', (r['id'], p['verification_id'], TRAIN.get(p['verification_id'], p.get('raw_score') or 0), units(usd * frac)))
    # The run's whole spend sits on its end point. A run with no final score has none, so its spend shows only up to its
    # last development submission, except a run billed through --run-cost: it keeps its whole spend, scoring 0 (Qiuyang,
    # 2026-10-25, for DeepSeek V4.1 Flash 1017 only; the other models' runs stay as they are).
    if (r['score'] is not None or o['id'] in RUN_COST) and usd:
        db.execute('insert into submissions values (?,?,?,?,?)', (r['id'], 'final', 'final', 'final:' + r['id'], n))
        db.execute('insert into score_points values (?,?,?,?,null)', (r['id'], 'final', SCORE.get(r['id'], 0.0 if r['score'] is None else r['score']), units(usd)))
for n, (t, name) in enumerate(sorted(tasks.items(), key=lambda kv: kv[1])): db.execute('insert into tasks values (?,?,?)', (t, name, n))
assert ONLY or used == set(TRAIN), f'{len(set(TRAIN) - used)} rescored development scores met no verification'
db.commit()
for c, v in items.items(): print(f"{c}: {sum(map(done, v))} scored of {len(v)} (evaluation {', '.join(EVALUATIONS.get(c, [evs[c]['id']]))})")
