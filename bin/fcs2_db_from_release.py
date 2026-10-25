#!/usr/bin/env python3
"""Rebuild the snapshot database the live site was built from, without the platform that held its runs.

usage: python3 bin/fcs2_db_from_release.py out.db formal-results.json REV
       (REV: the commit whose site the snapshot built; 99df6b5 for the site before DeepSeek V4.1 Flash 1017)

When the platform that ran the formal evaluations is gone (2026-10-24: the old host and its last snapshot, a scratch file,
went with it; the new platform holds only the evaluations run on it), this writes the tables bin/fcs2_db_from_platform.py
writes, from what was published:
- formal-results.json, the run table of the public release (metadata/formal-results.json in the Hugging Face dataset
  FrontierCS2/FrontierCS-2-runs): per (task, model) the run id, state, verdict, final score at full precision, the human
  reference's score measured in the run, the run's start and end, the final submission's check labels and, for the
  models on a paid API, the run's cost at full precision (used where it matches TRAJ's, to the cent's hundredth);
- assets/js/fcs2-data.js (TRAJ) at REV: each scored run's spend and development scores, as the site shows them (US$ to
  4 decimals, scores to 1), and _data/fcs2_runs_hidden.json at REV for the generation time;
- the override tables of bin/fcs2_db_from_platform.py (SCORE, REFERENCE, ZERO, COMPLETED), read from its source.
Checked 2026-10-25 at 99df6b5: the converter on this database writes that commit's _data/fcs2_runs_hidden.json byte for
byte and every value of its converter block (runs, pass rates, FCI, FDI, metric groups, costs, trajectories, references)
except 43 of SCALE's 384 budgets, which move by at most US$0.00002 (TRAJ keeps a run's largest spend to 4 decimals).
Development submissions get placeholder ids (train-<n>), as nothing reads them. Add the candidates of a newer platform
with bin/fcs2_db_add_snapshot.py.
"""
import ast, json, pathlib, re, sqlite3, subprocess, sys, os
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
lit = {}
for f, names in (('fcs2_db_from_platform.py', ('SCORE', 'REFERENCE', 'ZERO', 'COMPLETED')), ('fcs2_runs_from_db.py', ('TASK', 'MODEL'))):
    for n in ast.parse((ROOT / 'bin' / f).read_text()).body:   # the first, literal assignment of each
        for t in getattr(n, 'targets', []):
            if isinstance(t, ast.Name) and t.id in names and t.id not in lit: lit[t.id] = ast.literal_eval(n.value)
SCORE, REFERENCE, ZERO, COMPLETED, TASK, MODEL = (lit[k] for k in ('SCORE', 'REFERENCE', 'ZERO', 'COMPLETED', 'TASK', 'MODEL'))
short = lambda t: TASK[t][1] or t.split(' — ')[0]
BY_SHORT = {}
for t in TASK: BY_SHORT.setdefault(short(t), []).append(t)

rel = json.load(open(sys.argv[2]))
REV = sys.argv[3]   # the commit whose published files the snapshot was built for
show = lambda path: subprocess.run(['git', '-C', str(ROOT), 'show', f'{REV}:{path}'], check=True, capture_output=True).stdout.decode('utf-8')
TRAJ = json.loads(re.search(r'^const TRAJ = (.*);$', show('assets/js/fcs2-data.js'), re.M).group(1))
generated = json.loads(show('_data/fcs2_runs_hidden.json'))['generated_at']


def task_name(t):
    """The platform's name of a release task: its display name where the converter knows it, else the converter's one
    name for the task's site name (four tasks were renamed on the platform after the release named them)."""
    if t['display_name'] in TASK: return t['display_name']
    alias = {'vllm_llm_serving_optimization': 'Continuum', 'progent_privilege_control': 'Progent', 'fast_kv_compaction': 'KV Compaction', 'lrr': 'LRR'}
    names = BY_SHORT[t['site_task_name'] or alias[t['task']]]
    assert len(names) == 1, f'{t["task"]}: more than one database name {names}'
    return names[0]


def candidate(r):
    if r['candidate_name'] in MODEL: return r['candidate_name']
    names = [c for c, v in MODEL.items() if v[0] == r['model_id']]
    assert len(names) == 1, f'{r["model_id"]}: more than one database name {names}'
    return names[0]


# The human reference's score where the release gives that of a later evaluation and the snapshot had the run's own: GLM
# 5.3's QuarterPIR run was re-timed in a separate evaluation (its score is the re-timing's; the release's reference_score,
# 29.31, too), and its own final evidence (verifier/evidence.tar in its released trace) measured 24.729; with it the
# task's median reference is the site's 27.3.
OWN_REFERENCE = {'run_01M4S7JEYT18MATA3S7FZ2R5FV': 24.729120955810853}
ts = lambda s: datetime.fromisoformat(s[:19]).replace(tzinfo=timezone.utc).timestamp()   # as bin/fcs2_db_from_platform.py: whole seconds

tasks = {t['task']: (t['task_id'], task_name(t)) for t in rel['tasks']}
traj = {(x[0], x[1]): x for x in TRAJ}
assert len(traj) == len(TRAJ), 'two TRAJ entries for one model and task'
if os.path.exists(sys.argv[1]): os.remove(sys.argv[1])
db = sqlite3.connect(sys.argv[1])
db.executescript('''create table release(generated_at text);
create table candidates(id text primary key, name text, ordinal int); create table tasks(id text primary key, name text, ordinal int);
create table cells(run_id text, candidate_id text, task_id text);
create table runs(id text primary key, display_score real, state text, display_verdict text, elapsed_seconds real, feedback_json text);
create table submissions(run_id text, id text, kind text, patch_sha256 text, ordinal int);
create table score_points(run_id text, submission_id text, score real, total_tokens real, output_tokens real);''')
db.execute('insert into release values (?)', (generated,))
cands = [candidate(m | {'model_id': m['model_id']}) for m in rel['models']]   # the release lists the models in the evaluations' order
for n, c in enumerate(cands): db.execute('insert into candidates values (?,?,?)', (c, c, n))
for n, (tid, name) in enumerate(sorted(set(tasks.values()), key=lambda kv: kv[1])): db.execute('insert into tasks values (?,?,?)', (tid, name, n))
used = set()
for r in sorted(rel['runs'], key=lambda r: (cands.index(candidate(r)), tasks[r['task']][1])):
    c, (tid, tname), rid = candidate(r), tasks[r['task']], r['run_id']
    zero = r['score'] is None and (r['platform_state'] == 'TIMED_OUT' or rid in ZERO)
    score = SCORE.get(rid, 0.0 if zero else r['score'])
    fb = {'reference_score': REFERENCE.get(rid, OWN_REFERENCE.get(rid, r['reference_score'])), 'checks': [{'label': k['label']} for k in r.get('checks') or []]}
    if 'provider refused' in r['result_source']: fb['refusal'] = True   # the platform's cause provider_refusal_no_final
    verdict = 'FAIL' if zero and rid in ZERO else r['verdict']
    db.execute('insert into runs values (?,?,?,?,?,?)', (rid, score, 'COMPLETED' if rid in COMPLETED else r['platform_state'], verdict, ts(r['finished_at']) - ts(r['started_at']) if r['started_at'] and r['finished_at'] else None, json.dumps(fb)))
    db.execute('insert into cells values (?,?,?)', (rid, c, tid))
    t = traj.get((MODEL[c][0], short(tname)))
    if t is None: continue   # a hidden model's run: the site keeps no spend for it
    used.add((MODEL[c][0], short(tname)))
    assert round(score, 1) == t[2] and int(verdict == 'PASS') == t[3], f'{rid}: the release and TRAJ disagree'
    for n, (usd, dev) in enumerate(t[6]):
        db.execute('insert into submissions values (?,?,?,?,?)', (rid, f'train-{n}', 'train', None, n))
        db.execute('insert into score_points values (?,?,?,?,null)', (rid, f'train-{n}', dev, usd * 1e6))
    if t[4]:   # the spend at the run's end; where the platform gave no final score it equals the last development point's
        usd = r['provider_cost_usd'] if r.get('provider_cost_usd') is not None and round(r['provider_cost_usd'], 4) == t[4] else t[4]
        db.execute('insert into submissions values (?,?,?,?,?)', (rid, 'final', 'final', 'final:' + rid, len(t[6])))
        db.execute('insert into score_points values (?,?,?,?,null)', (rid, 'final', score, usd * 1e6))
assert used == set(traj), f'TRAJ entries without a release run: {sorted(set(traj) - used)}'
db.commit()
print(f'{len(rel["runs"])} runs of {len(cands)} models on {len(set(tasks.values()))} tasks; generated {generated} -> {sys.argv[1]}')
