#!/usr/bin/env python3
"""Update PASSBY (assets/js/fcs2-checks.js, and _data/fcs2_checks_hidden.json for models kept off the site) for the records
a newer public release changed, from that release's per-metric checks.

usage: python3 bin/fcs2_checks_from_release.py formal-results.json BASE.json
       formal-results.json: metadata/formal-results.json of the new release (Hugging Face FrontierCS2/FrontierCS-2-runs);
       BASE.json: the same file at the release revision the site's PASSBY was built from.

A record changed when its run, score, verdict, reference score or checks differ from BASE. Its PASSBY entry becomes the
release's checks, {metric: [passed, total]}; a changed record without checks (no final) loses its entry, so it beats no
metric. Every other entry is kept: for the 2026-10-31 release (10a1e897) the release's checks equal PASSBY on 910 of 912
records, and the other two have no entry where the release lists every workload unbeaten.
Where a task's changed records check metrics that a kept record passing the task was never measured on (a task version
that added metrics: Robust Image Tokenizer's LPIPS metrics), the kept record gets each added metric as beaten on all its
workloads, as its published PASS says it beat every metric; bin/fcs2_runs_from_db.py stops unless PASS is every metric
beaten. The script prints these cells. Entries of models in HIDDEN are kept in the hidden file only (moved there when a
model is hidden), as bin/fcs2_checks_from_platform.py splits them.
"""
import ast, collections, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
new, base = json.load(open(sys.argv[1])), {r['record_id']: r for r in json.load(open(sys.argv[2]))['runs']}
lit = {}
for n in ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text()).body:   # the first, literal assignment of each
    for t in getattr(n, 'targets', []):
        if isinstance(t, ast.Name) and t.id in ('TASK', 'MODEL', 'HIDDEN') and t.id not in lit: lit[t.id] = ast.literal_eval(n.value)
TASK, MODEL, HIDDEN = lit['TASK'], lit['MODEL'], lit['HIDDEN']
short = lambda t: TASK[t][1] or t.split(' — ')[0]
BY_SHORT = collections.defaultdict(list)
for t in TASK: BY_SHORT[short(t)].append(t)
alias = {'vllm_llm_serving_optimization': 'Continuum', 'progent_privilege_control': 'Progent', 'fast_kv_compaction': 'KV Compaction', 'lrr': 'LRR'}
RELEASE_ID = {'fable51': 'fable', 'carbon-g': 'carbon'}   # release model ids that differ from the converter's
hidden = {MODEL[c][0] for c in HIDDEN}
key = {t['task']: short(t['display_name']) if t['display_name'] in TASK else short(BY_SHORT[t['site_task_name'] or alias[t['task']]][0])
       for t in new['tasks']}
sig = lambda r: (r['run_id'], r['score'], r['verdict'], r.get('reference_score'), json.dumps(r.get('checks'), sort_keys=True))
changed = {r['record_id'] for r in new['runs'] if r['record_id'] not in base or sig(r) != sig(base[r['record_id']])}

path = ROOT / 'assets/js/fcs2-checks.js'
js = path.read_text()
PB = json.loads(re.search(r'^const PASSBY = (.*);$', js, re.M).group(1))
HJ = json.load(open(ROOT / '_data/fcs2_checks_hidden.json'))
HPB = HJ['passby']
mid = lambda r: RELEASE_ID.get(r['model_id'], r['model_id'])
table = lambda r: HPB if mid(r) in hidden else PB
n_set = n_del = 0
for r in new['runs']:
    if r['record_id'] not in changed: continue
    k, tgt = key[r['task']], table(r)
    if r.get('checks'):
        tgt.setdefault(k, {})[mid(r)] = {c['label']: [c['passed'], c['total']] for c in r['checks']}; n_set += 1
    elif mid(r) in tgt.get(k, {}):
        del tgt[k][mid(r)]; n_del += 1
moved = 0   # entries of models now kept off the site (HIDDEN) go to the hidden file, and back when a model is shown again
for k in set(PB) | set(HPB):
    for m in list(PB.get(k, {})):
        if m in hidden: HPB.setdefault(k, {})[m] = PB[k].pop(m); moved += 1
    for m in list(HPB.get(k, {})):
        if m not in hidden: PB.setdefault(k, {})[m] = HPB[k].pop(m); moved += 1
for t in (PB, HPB):
    for k in [k for k, v in t.items() if not v]: del t[k]
HJ['models'] = {MODEL[c][0]: MODEL[c][1] for c in MODEL if c in HIDDEN}
imputed = []
for task in sorted({r['task'] for r in new['runs'] if r['record_id'] in changed}):
    k = key[task]
    labels = set().union(*[set(v) for v in list(PB.get(k, {}).values()) + list(HPB.get(k, {}).values())])
    for r in new['runs']:
        if r['task'] != task or r['record_id'] in changed or r['verdict'] != 'PASS': continue
        cur = table(r).get(k, {}).get(mid(r), {})
        add = sorted(labels - set(cur))
        if add:
            n = max(v[1] for v in cur.values()) if cur else 1
            for a in add: cur[a] = [n, n]
            table(r).setdefault(k, {})[mid(r)] = cur; imputed.append((r['record_id'], add))
path.write_text(js[:js.index('const PASSBY = ')] + 'const PASSBY = ' + json.dumps(PB, separators=(',', ':')) + ';\n')
(ROOT / '_data/fcs2_checks_hidden.json').write_text(json.dumps(HJ, ensure_ascii=False, indent=1) + '\n')   # as bin/fcs2_checks_from_platform.py writes it
print(f'{len(changed)} changed records: PASSBY entries set {n_set}, removed {n_del}; moved between shown and hidden {moved}; added metrics counted as beaten for kept PASS records: {imputed}')
