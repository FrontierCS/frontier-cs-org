#!/usr/bin/env python3
"""Per task, metric and model, the run's mean on the hidden final workloads and the human reference's: assets/js/fcs2-metrics.js.

usage: python3 bin/fcs2_metric_means.py path/to/metric_aggregates.jsonl [--db=platform.db] [--values=metric_values.jsonl]
       [--margins=workload_margins.jsonl]

With --db, only rows of the runs the database holds count (by run id), so a task rerun since the export shows no
mean rather than the old run's (Qiuyang, 2026-10-15).

With --values (the export's per-workload rows: run, metric, workload, value, reference_value, beat), a task in WORKLOADS
also gets each workload's numbers (Qiuyang, 2026-10-15: CREST's two programs differ tenfold, so a mean over them says
little): per metric, "w" = {workload: {"ref": the reference's median, "margin": the median margin a run had to beat it
by (from --margins, where the evidence states one), "by": {model id: [value, reference value, beat, margin]}}}.

The input is an export of the platform's final evidence (GET /api/v1/runs/<id>/submission/evidence?submission_id=final),
one JSON row per run and metric: task and candidate (database names), metric (the key PASSBY and CHECKS use), better
("higher" or "lower", from the task's judge/beat_spec.json), value (the run's arithmetic mean over its hidden final
workloads, null where its final evidence has no numbers) and reference_value (the human reference's mean, measured in
the same run's evaluation, null where absent). The reference is measured again in every run, so for timing metrics it
varies from run to run; the page shows the median over a task's runs, and each run's own as a tooltip.

Names go through the TASK and MODEL maps of bin/fcs2_runs_from_db.py, as bin/fcs2_checks_from_platform.py does; runs of
models in HIDDEN (Kimi K2.7) and of candidates the maps do not know are left out. Numbers keep 4 significant digits.
"""
import ast, json, pathlib, statistics, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text())
lit = {}
for n in src.body:   # the first, literal assignment of each (MODEL is narrowed later in that script)
    for t in getattr(n, 'targets', []):
        if isinstance(t, ast.Name) and t.id in ('TASK', 'MODEL', 'HIDDEN') and t.id not in lit: lit[t.id] = ast.literal_eval(n.value)
TASK, MODEL, HIDDEN = lit['TASK'], lit['MODEL'], lit['HIDDEN']

r4 = lambda v: None if v is None else float(f'{v:.4g}')
# checks that must equal an exact answer: the page says so instead of a direction (Qiuyang, 2026-10-15; ParButterfly's
# judge lists "higher" only as an equivalent under its exactness guard)
EXACT = {('ParButterfly', 'butterfly_count'), ('SCOPE', 'exact_counts')}
UNIT_NAME = {'milliseconds': 'ms', 'microseconds': 'µs', 'seconds': 's'}   # the export's unit, for keys without a unit suffix
WORKLOADS = {'CREST'}   # tasks whose page shows each hidden workload apart (their names are in assets/js/fcs2-task.js)
rows = [json.loads(line) for line in open(sys.argv[1]) if line.strip()]
dbp = next((a[5:] for a in sys.argv[2:] if a.startswith('--db=')), None)
if dbp:
    import sqlite3
    live = {r for r, in sqlite3.connect(dbp).execute('select run_id from cells')}
    stale = sum(r['run_id'] not in live for r in rows)
    for r in rows:   # a rerun's row from the old run: keep its direction, drop its numbers
        if r['run_id'] not in live: r['value'] = r['reference_value'] = None
arg = lambda k: next((a[len(k) + 3:] for a in sys.argv[2:] if a.startswith(f'--{k}=')), None)
wrows = [json.loads(l) for l in open(arg('values'))] if arg('values') else []
margin = {(m['run_id'], m['metric'], m['workload']): m['margin'] for m in map(json.loads, open(arg('margins')))} if arg('margins') else {}
out, skipped = {}, {}
for r in rows:
    task, cand, metric = r['task'], r['candidate'], r['metric']
    if task not in TASK: skipped[task] = skipped.get(task, 0) + 1; continue
    s = out.setdefault(TASK[task][1] or task.split(' — ')[0], {}).setdefault(metric, {'better': r['better'], 'ref': None, 'by': {}, 'refs': []})
    if s['better'] != r['better']: sys.exit(f'{task} {metric}: "better" differs between runs')
    if r.get('unit') in UNIT_NAME: s['unit'] = UNIT_NAME[r['unit']]
    if cand in HIDDEN or cand not in MODEL: skipped[cand] = skipped.get(cand, 0) + 1; continue
    s['by'][MODEL[cand][0]] = [r4(r['value']), r4(r['reference_value'])]
    if r['reference_value'] is not None: s['refs'].append(r['reference_value'])
for t, metrics in out.items():
    for metric, s in metrics.items():
        refs = s.pop('refs')
        s['ref'] = r4(statistics.median(refs)) if refs else None
        s['by'] = dict(sorted(s['by'].items()))
        if (t, metric) in EXACT: s['exact'] = True
for r in wrows:   # each workload apart, for the tasks in WORKLOADS
    task, cand = r['task'], r['candidate']
    if task not in TASK or (TASK[task][1] or task) not in WORKLOADS or cand in HIDDEN or cand not in MODEL: continue
    if dbp and r['run_id'] not in live: continue
    s = out.get(TASK[task][1] or task, {}).get(r['metric'])
    if s is None: continue
    w = s.setdefault('w', {}).setdefault(r['workload'], {'by': {}, 'refs': [], 'margins': []})
    mg = margin.get((r['run_id'], r['metric'], r['workload']))
    w['by'][MODEL[cand][0]] = [r4(r['value']), r4(r['reference_value']), r['beat'], r4(mg)]
    if r['reference_value'] is not None: w['refs'].append(r['reference_value'])
    if mg is not None: w['margins'].append(mg)
for metrics in out.values():
    for s in metrics.values():
        for w in s.get('w', {}).values():
            refs, mgs = w.pop('refs'), w.pop('margins')
            w['ref'], w['margin'] = (r4(statistics.median(refs)) if refs else None), (r4(statistics.median(mgs)) if mgs else None)
            w['by'] = dict(sorted(w['by'].items()))
        if 'w' in s: s['w'] = dict(sorted(s['w'].items()))
out = {t: dict(sorted(m.items())) for t, m in sorted(out.items())}

path = ROOT / 'assets' / 'js' / 'fcs2-metrics.js'
path.write_text('// Written by bin/fcs2_metric_means.py from an export of the platform\'s final evidence: per task and metric, whether\n'
                '// higher or lower is better, the human reference\'s mean (the median over the task\'s runs, as it is measured again in\n'
                '// every run), and per model [the run\'s mean over its hidden final workloads, the human reference\'s mean in that run].\n'
                'const METRIC_STATS = ' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n')
print(f'{len(rows)} rows, {sum(len(m) for m in out.values())} metrics on {len(out)} tasks -> {path}; left out: {skipped}'
      + (f'; numbers of {stale} rows dropped, their runs not in {dbp}' if dbp else ''))
