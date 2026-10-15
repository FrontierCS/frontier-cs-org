#!/usr/bin/env python3
"""Build the sqlite.db that bin/fcs2_runs_from_db.py reads, straight from the evaluation platform's read-only API.

usage: python3 bin/fcs2_db_from_platform.py out.db [--api=http://127.0.0.1:18080/api/v1/] [--min-scored=40] [--claude-usage=recovered.json]

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

API, MIN = 'http://127.0.0.1:18080/api/v1/', 40
for a in sys.argv[2:]:
    if a.startswith('--api='): API = a[6:]
    if a.startswith('--min-scored='): MIN = int(a[13:])
# cache-read US$ per million tokens, as PRICE in the converter, keyed by the platform's candidate name
CACHE = {'GPT-6 Astra': 1.00, 'GPT-6.1 Sol': 0.10, 'Kimi K3 (Modal)': 0.30, 'DeepSeek V4.1 Flash (DSH)': 0.003, 'Muse Code - Muse Spark 1.3': 0.15, 'GLM 5.3 (ZCode)': 0.26,
         'Claude Code · Opus 5.5 (Subscription, max effort)': None, 'Kimi K2.7 Code': None, 'Muse Code · Muse Wonder 1.0': None,
         'Codex · Qwen 3.8 Max': 0.25,           # as 'qwen' in the converter's PRICE
         'Qwen Code CLI · Qwen 3.8 Max': 0.25,   # the same model on Qwen Code (Qiuyang, 2026-10-14)
         'GLM 5.3 Flash (ZCode)': 0.03,
         'pi · Gemini 4': None}                  # its gateway reports the cost of every run (Qiuyang, 2026-10-16)          # list cached-input rate, eesel.ai's GLM-5.3-Flash pricing write-up, found 2026-10-13   # None: run on a subscription, the platform reports no usage


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
    if e['is_formal'] and e['total_runs'] >= 47 and not e['archived_at'] and e['candidate_name'] in CACHE: evs[e['candidate_name']] = e
items = {c: get('evaluations/' + e['id'])['items'] for c, e in evs.items()}
done = lambda i: i['score'] is not None or i['run_state'] == 'TIMED_OUT'   # a timeout is a result: it scores 0
items = {c: v for c, v in items.items() if sum(map(done, v)) >= MIN}
rids = [(c, i['run_id']) for c, v in items.items() for i in v if i.get('run_id')]
with ThreadPoolExecutor(16) as ex:
    pulled = list(ex.map(lambda cr: (cr[0], get('runs/' + cr[1]), get(f'runs/{cr[1]}/events?limit=500')), rids))

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

def agent_usd(c, r):
    if r['id'] in RECOVERED: return RECOVERED[r['id']]
    u = claude(r)
    if u.get('estimated_cost_usd'): return u['estimated_cost_usd']
    return float(max(0, RATE[c] @ [u.get(k) or 0 for k in KINDS])) if u and c in RATE else 0

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
for c, r, events in pulled:
    tasks.setdefault(r['task_id'], r['task_name'])
    start, end = (ts(r[k]) if r.get(k) else None for k in ('started_at', 'finished_at'))
    usage = (r.get('model_usage') or {}).get('keys', [])
    agent = agent_usd(c, r)   # Claude Code reports its own usage
    usd = sum(k.get('estimated_cost_usd') or 0 for k in usage) or agent or sum(k.get('total_tokens') or 0 for k in usage) * (CACHE[c] or 0) / 1e6
    units = lambda x: x * 1e6
    priv = (r.get('metrics') or {}).get('private') or {}
    fb = {'reference_score': priv.get('reference_score'), 'checks': [{'label': k} for k in (priv.get('beat_spec_progress') or {})]}
    if (r.get('adjudication') or {}).get('cause') == 'provider_refusal_no_final': fb['refusal'] = True   # the model's provider refused and no final came
    db.execute('insert into runs values (?,?,?,?,?,?)', (r['id'], 0.0 if r['score'] is None and r['state'] == 'TIMED_OUT' else r['score'], r['state'], r['verdict'], end - start if start and end else None, json.dumps(fb)))
    db.execute('insert into cells values (?,?,?)', (r['id'], c, r['task_id']))
    n = 0
    for e in events:
        if e['kind'] != 'VERIFIER_TRAIN_COMPLETED' or not (start and end): continue
        p = e['payload']; frac = min(1, max(0, (ts(e['occurred_at']) - start) / max(end - start, 1)))
        db.execute('insert into submissions values (?,?,?,?,?)', (r['id'], p['verification_id'], 'train', p['payload_id'], n)); n += 1
        db.execute('insert into score_points values (?,?,?,?,null)', (r['id'], p['verification_id'], p.get('raw_score') or 0, units(usd * frac)))
    if r['score'] is not None and usd:
        db.execute('insert into submissions values (?,?,?,?,?)', (r['id'], 'final', 'final', 'final:' + r['id'], n))
        db.execute('insert into score_points values (?,?,?,?,null)', (r['id'], 'final', r['score'], units(usd)))
for n, (t, name) in enumerate(sorted(tasks.items(), key=lambda kv: kv[1])): db.execute('insert into tasks values (?,?,?)', (t, name, n))
db.commit()
for c, v in items.items(): print(f"{c}: {sum(map(done, v))} scored of {len(v)} (evaluation {evs[c]['id']})")
