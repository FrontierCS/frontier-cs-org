#!/usr/bin/env python3
"""Export every leaderboard run's final patch, one JSON file per task: assets/patches/<slug>.json, read by the task page.

usage: python3 bin/fcs2_patches_from_platform.py [out_dir] [--api=http://127.0.0.1:18080/api/v1/] [--models=opus,astra|all]

Read-only on the platform API. The evaluations are the ones bin/fcs2_db_from_platform.py takes (formal, 47 runs or more,
not archived, latest per model), named through the TASK and MODEL maps of bin/fcs2_runs_from_db.py. For each run the patch
is the submission the platform judged (the run's default submission): its evidence bundle (tar.zst) holds the payload
(payloads/<id>/payload.tar), whose payload/solution.patch is kept. Security tasks are left out. A patch longer than CAP
bytes is cut there and marked; its line counts are of the whole patch.
Only Claude Opus 5.5 by default (owner, 2026-10-14): task versions still change and other models' runs on a task may be of
earlier versions, so the site shows one model's patches until the runs settle; --models= takes model ids, or all.
"""
import ast, io, json, pathlib, re, subprocess, sys, tarfile, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(next((a for a in sys.argv[1:] if not a.startswith('--')), ROOT / 'assets' / 'patches'))
API = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--api=')), 'http://127.0.0.1:18080/api/v1/')
BASE = API.split('/api/v1/')[0]
CAP = 300_000
WANT = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--models=')), 'opus')

# the converter's name maps, read without running it
src = ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text())
lit = {}
for n in src.body:   # the first, literal assignment of each (MODEL is narrowed later in that script)
    for t in getattr(n, 'targets', []):
        if isinstance(t, ast.Name) and t.id in ('TASK', 'MODEL', 'HIDDEN') and t.id not in lit: lit[t.id] = ast.literal_eval(n.value)
TASK, MODEL, HIDDEN = lit['TASK'], lit['MODEL'], lit.get('HIDDEN', set())
slug = lambda s: re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))

def get(path):
    return json.load(urllib.request.urlopen(API + path, timeout=60))

def evaluations():
    out, cursor = [], None
    while True:
        r = urllib.request.urlopen(API + 'evaluations?limit=200' + (f'&cursor={cursor}' if cursor else ''), timeout=60)
        out += json.load(r); cursor = r.headers.get('x-next-cursor')
        if not cursor: return out

def patch_of(run):
    """(submission label, patch text) of the submission the platform judged, or (None, reason)."""
    subs = get(f"runs/{run['run_id']}/submissions")
    pick = [s for s in subs.get('items', []) if s['id'] == subs.get('default_submission_id')]
    if not pick: return None, (run.get('failure_code') or run['run_state']).replace('_', ' ')
    s = pick[0]
    if s.get('content_kind') != 'patch' or s.get('status') != 'available': return None, f"submission {s.get('status')}"
    raw = urllib.request.urlopen(BASE + s['evidence_url'], timeout=300).read()
    tar_bytes = subprocess.run(['zstd', '-dc'], input=raw, capture_output=True, check=True).stdout
    with tarfile.open(fileobj=io.BytesIO(tar_bytes)) as outer:
        inner = outer.extractfile(f"payloads/{s['payload_id']}/payload.tar").read()
    with tarfile.open(fileobj=io.BytesIO(inner)) as t:
        m = next(m for m in t.getmembers() if m.isfile() and m.name.endswith('.patch'))
        return s.get('label') or s['id'], t.extractfile(m).read().decode('utf-8', 'replace')

def one(job):
    key, mid, run = job
    try: label, patch = patch_of(run)
    except Exception as x: label, patch = None, f'not exported ({type(x).__name__})'
    rec = {'run': run['run_id'], 'verdict': run.get('verdict'), 'score': run.get('score')}
    if label is None: return key, mid, {**rec, 'missing': patch}
    lines = patch.splitlines()
    files = [l.split(' b/', 1)[-1] for l in lines if l.startswith('diff --git ')]
    add = sum(l.startswith('+') and not l.startswith('+++') for l in lines); rem = sum(l.startswith('-') and not l.startswith('---') for l in lines)
    big = len(patch.encode()) > CAP
    return key, mid, {**rec, 'submission': label, 'files': files, 'add': add, 'del': rem, 'bytes': len(patch.encode()),
                      'truncated': big, 'patch': patch.encode()[:CAP].decode('utf-8', 'ignore') if big else patch}

evs = {}
for e in sorted(evaluations(), key=lambda e: e['created_at']):
    if e['is_formal'] and e['total_runs'] >= 47 and not e['archived_at'] and e['candidate_name'] in MODEL and e['candidate_name'] not in HIDDEN \
            and (WANT == 'all' or MODEL[e['candidate_name']][0] in WANT.split(',')):
        evs[e['candidate_name']] = e
jobs = []
for cand, e in evs.items():
    for it in get('evaluations/' + e['id'])['items']:
        dom, key = TASK.get(it['task_name'], (None, None))
        if dom is None or dom == 'Security' or not it.get('run_id'): continue
        jobs.append((key or it['task_name'], MODEL[cand][0], it))
with ThreadPoolExecutor(6) as ex: done = list(ex.map(one, jobs))
OUT.mkdir(parents=True, exist_ok=True)
by = {}
for key, mid, rec in done: by.setdefault(key, {})[mid] = rec
stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
for key, runs in by.items():
    (OUT / f'{slug(key)}.json').write_text(json.dumps({'task': key, 'generated_at': stamp, 'runs': runs}, ensure_ascii=False, separators=(',', ':')))
miss = [(k, m, r['missing']) for k, ms in by.items() for m, r in ms.items() if 'missing' in r]
print(f"{len(by)} tasks, {len(done)} runs, {len(done) - len(miss)} patches, {sum(r.get('truncated', False) for _, _, r in done)} cut at {CAP} bytes; missing: {miss}")
