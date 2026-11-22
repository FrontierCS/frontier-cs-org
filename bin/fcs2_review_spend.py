#!/usr/bin/env python3
"""Write bin/fcs2_review_spend.jsonl: for every scored run on the Antigravity CLI, the US$ of agy's safety review.

usage: python3 bin/fcs2_review_spend.py RELEASE_DIR [--rows=CACHE_DIR] [--jobs=N]
       RELEASE_DIR: a copy of the Hugging Face dataset FrontierCS2/FrontierCS-2-runs with metadata/formal-results.json and
       traces/<task>/<model>/evidence.tar.zst of the Antigravity models; zstd must be on PATH.
       --rows: keeps each run's per-request rows there (<task>.<model>.json) and reuses them on the next call.

Before each command or file edit, the agy CLI asks the same model whether the pending tool call is safe: a pre-filter
request with the pending call, and a reviewer request with the whole trajectory so far (owner, 2026-11-22: show that
review's cost apart from the model's). The run pays for both, so the site's US$ for an Antigravity run (TRAJ in
assets/js/fcs2-data.js) includes them. For each run this reads every model request in its evidence: Gemini 4 Neon's
Pumpkin record (model/N.request, model/items, log.jsonl) or the gateway traffic of the older ones
(models/primary/traffic/NNNNN.{request,response}.bin). A request is the review when its first message is the rater's
prompt ("safety and security rater"); the conversation-title request and the agent's own count as the model's.

A run's review US$ is its US$ times the review's share of the run's requests priced per model: uncached input, cached
input and output tokens at the US$ per million tokens that fit the model's runs (least squares on the runs' US$, prices
held at 0 or more; fit printed). Requests whose reply carries no usage (the gateway streamed none: most of Gemini 4
Carbon's review requests, about half of Argon's and Hydrogen's) are counted from their size: prompt tokens = request
bytes x the model's tokens per byte for that kind of request, its cached share and its mean output per request, from its
requests of that kind that have usage; where it has fewer than 50 (Carbon's review requests), the other models' pooled
values and no cache. Requests of another model (an agent's own evaluation calling gpt-4o-mini) are priced at that model's
list price and are the model's.
"""
import ast, collections, itertools, json, os, re, subprocess, sys, tarfile
from concurrent.futures import ProcessPoolExecutor
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REL = sys.argv[1]
CACHE = next((a[7:] for a in sys.argv[2:] if a.startswith('--rows=')), None)
JOBS = int(next((a[7:] for a in sys.argv[2:] if a.startswith('--jobs=')), 4))
RELEASE_ID = {'fable51': 'fable', 'carbon-g': 'carbon'}   # release model ids that differ from the converter's, as bin/fcs2_checks_from_release.py
OTHER = {'gpt-4o-mini': (0.15, 0.075, 0.60), 'openai/gpt-4o-mini': (0.15, 0.075, 0.60)}   # list US$ per million tokens: uncached, cached, output
KINDS = ('agent', 'title', 'review-pre', 'review')


def kind(head):
    """The kind of a request from the start of its first message (or of its body)."""
    if 'safety pre-filter' in head: return 'review-pre'
    if 'safety and security rater' in head or 'JETSKI_TRAJECTORY' in head: return 'review'
    if 'conversation title generator' in head: return 'title'
    return 'agent'


def rows_of(path):
    """Per request in order: [seq, kind, model, prompt tokens, cached tokens, output tokens, no usage (1/0), request bytes]."""
    p = subprocess.Popen(['zstd', '-dc', path], stdout=subprocess.PIPE, bufsize=1 << 20)
    heads, size, sse = {}, {}, {}             # gateway traffic
    reqs, items, log = {}, {}, []             # Pumpkin record
    with tarfile.open(fileobj=p.stdout, mode='r|', bufsize=1 << 20) as tf:
        for m in tf:
            if not m.isfile(): continue
            f = None
            t = re.search(r'models/primary/traffic/(\d+)\.(request|response)\.bin$', m.name)
            if t:
                n, f = int(t.group(1)), tf.extractfile(m)
                if t.group(2) == 'request': heads[n] = f.read(65536).decode('utf-8', 'replace'); size[n] = m.size
                else: sse[n] = f.read()
                continue
            t = re.search(r'(?:^|/)model/(\d+)\.request$', m.name)
            if t: reqs[int(t.group(1))] = json.loads(tf.extractfile(m).read()); continue
            t = re.search(r'(?:^|/)model/items/([0-9a-f]{64})$', m.name)
            if t: items[t.group(1)] = tf.extractfile(m).read(600).decode('utf-8', 'replace'); continue
            if re.search(r'(?:^|/)log\.jsonl$', m.name): log = tf.extractfile(m).read().decode('utf-8').splitlines()
    p.wait()
    out = []
    if reqs:   # Pumpkin record: usage from log.jsonl, kind from the first message
        U = {}
        for line in log:
            e = json.loads(line).get('event') or {}
            if e.get('caller') == 'agent' and e.get('kind') == 'model_answered': U[e['request']] = (e.get('model'), e.get('usage'))
        for n in sorted(reqs):
            ms = reqs[n].get('messages') or []
            head = items.get(ms[0].split(':', 1)[1], '') if ms else ''
            mdl, u = U.get(n, (reqs[n].get('model'), None))
            u = u or {}
            out.append([n, kind(head[:400]), mdl or reqs[n].get('model'), u.get('input_tokens') or 0, u.get('cached_tokens') or 0,
                        u.get('output_tokens') or 0, int(not U.get(n, (0, None))[1]), 0])
        return out
    for n in sorted(set(heads) | set(sse)):   # gateway traffic: usage from the reply's stream, kind from the request body
        u = None
        for line in (sse.get(n) or b'').decode('utf-8', 'replace').splitlines():
            if line.startswith('data: {') and '"usage"' in line:
                try: u = json.loads(line[6:]).get('usage') or u
                except ValueError: pass
        h = heads.get(n, ''); mdl = re.search(r'"model"\s*:\s*"([^"]+)"', h); uu = u or {}
        out.append([n, kind(h), mdl.group(1) if mdl else None, uu.get('prompt_tokens') or 0,
                    (uu.get('prompt_tokens_details') or {}).get('cached_tokens') or 0, uu.get('completion_tokens') or 0, int(u is None), size.get(n, 0)])
    return out


def cached_rows(job):
    path, cache = job
    if cache and os.path.exists(cache): return json.load(open(cache))['rows']
    rows = rows_of(path)
    if cache: json.dump({'src': path, 'rows': rows}, open(cache, 'w'))
    return rows


def nnls3(X, y):
    """Least squares with every price at 0 or more (three columns: try each set of free prices)."""
    best = None
    for keep in itertools.chain.from_iterable(itertools.combinations(range(3), r) for r in (3, 2, 1)):
        p = np.zeros(3); p[list(keep)] = np.linalg.lstsq(X[:, list(keep)], y, rcond=None)[0]
        if (p >= 0).all() and (best is None or ((X @ p - y) ** 2).sum() < best[0]): best = (((X @ p - y) ** 2).sum(), p)
    return best[1]


lit = {}
for node in ast.parse(open(os.path.join(ROOT, 'bin/fcs2_runs_from_db.py')).read()).body:   # the first, literal assignment of each
    for t in getattr(node, 'targets', []):
        if isinstance(t, ast.Name) and t.id in ('TASK', 'MODEL') and t.id not in lit: lit[t.id] = ast.literal_eval(node.value)
TASK, MODEL = lit['TASK'], lit['MODEL']
short = lambda t: TASK[t][1] or t.split(' — ')[0]
BY_SHORT = collections.defaultdict(list)
for t in TASK: BY_SHORT[short(t)].append(t)
alias = {'vllm_llm_serving_optimization': 'Continuum', 'progent_privilege_control': 'Progent', 'fast_kv_compaction': 'KV Compaction', 'lrr': 'LRR'}
rel = json.load(open(os.path.join(REL, 'metadata/formal-results.json')))
key = {t['task']: short(t['display_name']) if t['display_name'] in TASK else short(BY_SHORT[t['site_task_name'] or alias[t['task']]][0]) for t in rel['tasks']}
agy = {v[0] for v in MODEL.values() if v[3] == 'Antigravity'}
TRAJ = {(r[0], r[1]): r for r in json.loads(re.search(r'^const TRAJ = (.*);$', open(os.path.join(ROOT, 'assets/js/fcs2-data.js')).read(), re.M).group(1))}
todo = [r for r in rel['runs'] if RELEASE_ID.get(r['model_id'], r['model_id']) in agy and (RELEASE_ID.get(r['model_id'], r['model_id']), key[r['task']]) in TRAJ]
if CACHE: os.makedirs(CACHE, exist_ok=True)
jobs = [(os.path.join(REL, 'traces', r['task'], r['model_id'], 'evidence.tar.zst'), CACHE and os.path.join(CACHE, f"{r['task']}.{r['model_id']}.json")) for r in todo]
with ProcessPoolExecutor(JOBS) as ex: ROWS = list(ex.map(cached_rows, jobs))
runs = collections.defaultdict(list)
for r, rows in zip(todo, ROWS):
    target = collections.Counter(x[2] for x in rows if x[1] == 'agent').most_common(1)[0][0]
    runs[r['model_id']].append(dict(run_id=r['run_id'], task=r['task'], U=TRAJ[(RELEASE_ID.get(r['model_id'], r['model_id']), key[r['task']])][4], rows=rows, target=target))

cal = {}   # per model and kind, from the requests with usage: tokens per request byte, cached share, mean output
for m, R in runs.items():
    for k in KINDS:
        q = [x for run in R for x in run['rows'] if x[1] == k and not x[6] and x[2] == run['target']]
        nb = sum(x[7] for x in q)
        cal[(m, k)] = dict(n=len(q), tpb=sum(x[3] for x in q if x[7]) / nb if nb else None,
                           cached=sum(x[4] for x in q) / max(1, sum(x[3] for x in q)), out=float(np.mean([x[5] for x in q])) if q else None)


def calib(m, k, f):
    if cal[(m, k)]['n'] >= 50 and cal[(m, k)][f] is not None: return cal[(m, k)][f]
    if f == 'cached': return 0.0
    pool = [cal[(o, k)] for o in runs if o != m and cal[(o, k)]['n'] >= 50 and cal[(o, k)][f] is not None]
    return sum(c[f] * c['n'] for c in pool) / sum(c['n'] for c in pool)


out = []
for m in sorted(runs):
    R = runs[m]
    for run in R:   # token sums in millions [uncached, cached, output]: all requests of the model, and the review's
        A, Rv, other, est = np.zeros(3), np.zeros(3), 0.0, 0
        for n, k, mdl, p, c, o, nou, size in run['rows']:
            if mdl != run['target'] and mdl in OTHER:
                pu, pc, po = OTHER[mdl]; other += ((p - c) * pu + c * pc + o * po) / 1e6; continue
            if nou and size:
                p = calib(m, k, 'tpb') * size; c = calib(m, k, 'cached') * p; o = calib(m, k, 'out'); est += 1
            v = np.array([p - c, c, o]) / 1e6
            A += v
            if k.startswith('review'): Rv += v
        run.update(A=A, Rv=Rv, other=other, est=est)
    fit = [run for run in R if run['U'] > 0]
    X, y = np.array([run['A'] for run in fit]), np.array([run['U'] - run['other'] for run in fit])
    price = nnls3(X, y)
    r2 = 1 - ((X @ price - y) ** 2).sum() / ((y - y.mean()) ** 2).sum()
    for run in R:
        T = float(run['A'] @ price) + run['other']
        share = float(run['Rv'] @ price) / T if T > 0 else 0.0
        out.append(dict(run_id=run['run_id'], record=f"{run['task']}/{m}", usd=round(run['U'], 4), review_usd=round(run['U'] * share, 4),
                        review_requests=sum(1 for x in run['rows'] if x[1].startswith('review')), requests=len(run['rows']), estimated_requests=run['est']))
    mine = [x for x in out if x['record'].endswith('/' + m)]
    print(f"{m}: {len(R)} runs; US$ per million tokens: uncached {price[0]:.3f}, cached {price[1]:.3f}, output {price[2]:.3f} (R2 {r2:.4f}); "
          f"US$ per run: {np.mean([x['usd'] for x in mine]):.2f}, of which review {np.mean([x['review_usd'] for x in mine]):.2f} "
          f"({sum(x['review_usd'] for x in mine) / sum(x['usd'] for x in mine):.1%}); requests counted from their size: {sum(x['estimated_requests'] for x in mine)} of {sum(x['requests'] for x in mine)}")
with open(os.path.join(ROOT, 'bin/fcs2_review_spend.jsonl'), 'w') as f:
    for x in sorted(out, key=lambda x: x['record']): f.write(json.dumps(x) + '\n')
print(f"{len(out)} runs -> bin/fcs2_review_spend.jsonl")
