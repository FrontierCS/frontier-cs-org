#!/usr/bin/env python3
"""Build the sqlite.db that bin/fcs2_runs_from_db.py reads, straight from the evaluation platform's read-only API.

usage: python3 bin/fcs2_db_from_platform.py out.db [--api=http://127.0.0.1:18080/api/v1/] [--min-scored=40]

Takes every formal 47-task evaluation that is not archived and has at least --min-scored scored runs (one per model;
the newest wins), and writes the tables the converter queries: release, candidates, tasks, cells, runs, submissions,
score_points. Only GET requests are made.

What the API does not give, and what stands in for it:
- Spend per submission. The API reports a run's total tokens and, for some models, the gateway's estimated cost.
  A run's spend is that estimated cost when it is above 0, else total tokens at the model's cache-read list price
  (a lower bound: output tokens are not reported). Spend at a development submission is the run's spend times the
  share of the run's wall time elapsed at that submission. It is stored as total_tokens = US$ * 1e6 / cache-read price
  with output_tokens = 0, so the converter's usd() returns the US$ figure unchanged.
- The patch behind the final submission. Development payload ids do not match the final checkpoint's, so no
  development score is paired with the hidden score and the converter applies no dev-to-hidden calibration.
- Check labels. feedback_json.checks lists the metric names of metrics.private.beat_spec_progress.
"""
import json, sqlite3, sys, urllib.request, os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

API, MIN = 'http://127.0.0.1:18080/api/v1/', 40
for a in sys.argv[2:]:
    if a.startswith('--api='): API = a[6:]
    if a.startswith('--min-scored='): MIN = int(a[13:])
# cache-read US$ per million tokens, as PRICE in the converter, keyed by the platform's candidate name
CACHE = {'GPT-6 Astra': 1.00, 'GPT-6.1 Sol': 0.10, 'Kimi K3 (Modal)': 0.30, 'DeepSeek V4.1 Flash (DSH)': 0.003, 'Muse Code - Muse Spark 1.3': 0.15}


def get(path):
    for attempt in range(3):
        try: return json.load(urllib.request.urlopen(API + path, timeout=30))
        except Exception as e: err = e
    raise err

ts = lambda s: datetime.fromisoformat(s[:19]).replace(tzinfo=timezone.utc).timestamp()
evs = {}
for e in sorted(get('evaluations'), key=lambda e: e['created_at']):
    if e['is_formal'] and e['total_runs'] == 47 and not e['archived_at'] and e['candidate_name'] in CACHE: evs[e['candidate_name']] = e
items = {c: get('evaluations/' + e['id'])['items'] for c, e in evs.items()}
items = {c: v for c, v in items.items() if sum(i['score'] is not None for i in v) >= MIN}
rids = [(c, i['run_id']) for c, v in items.items() for i in v if i.get('run_id')]
with ThreadPoolExecutor(16) as ex:
    pulled = list(ex.map(lambda cr: (cr[0], get('runs/' + cr[1]), get(f'runs/{cr[1]}/events?limit=500')), rids))

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
    usd = sum(k.get('estimated_cost_usd') or 0 for k in usage) or sum(k.get('total_tokens') or 0 for k in usage) * CACHE[c] / 1e6
    units = lambda x: x * 1e6 / CACHE[c]
    priv = (r.get('metrics') or {}).get('private') or {}
    fb = {'reference_score': priv.get('reference_score'), 'checks': [{'label': k} for k in (priv.get('beat_spec_progress') or {})]}
    db.execute('insert into runs values (?,?,?,?,?,?)', (r['id'], r['score'], r['state'], r['verdict'], end - start if start and end else None, json.dumps(fb)))
    db.execute('insert into cells values (?,?,?)', (r['id'], c, r['task_id']))
    n = 0
    for e in events:
        if e['kind'] != 'VERIFIER_TRAIN_COMPLETED' or not (start and end): continue
        p = e['payload']; frac = min(1, max(0, (ts(e['occurred_at']) - start) / max(end - start, 1)))
        db.execute('insert into submissions values (?,?,?,?,?)', (r['id'], p['verification_id'], 'train', p['payload_id'], n)); n += 1
        db.execute('insert into score_points values (?,?,?,?,0)', (r['id'], p['verification_id'], p.get('raw_score') or 0, units(usd * frac)))
    if r['score'] is not None and usd:
        db.execute('insert into submissions values (?,?,?,?,?)', (r['id'], 'final', 'final', 'final:' + r['id'], n))
        db.execute('insert into score_points values (?,?,?,?,0)', (r['id'], 'final', r['score'], units(usd)))
for n, (t, name) in enumerate(sorted(tasks.items(), key=lambda kv: kv[1])): db.execute('insert into tasks values (?,?,?)', (t, name, n))
db.commit()
for c, v in items.items(): print(f"{c}: {sum(i['score'] is not None for i in v)} scored of {len(v)} (evaluation {evs[c]['id']})")
