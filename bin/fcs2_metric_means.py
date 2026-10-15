#!/usr/bin/env python3
"""Per task, metric and model, the run's mean on the hidden final workloads and the human reference's: assets/js/fcs2-metrics.js.

usage: python3 bin/fcs2_metric_means.py path/to/metric_aggregates.jsonl [--db=platform.db] [--values=metric_values.jsonl]
       [--margins=workload_margins.jsonl] [--reference=reference_profile.jsonl ...]

With --db, only rows of the runs the database holds count (by run id), so a task rerun since the export shows no
mean rather than the old run's (Qiuyang, 2026-10-15).

With --values (the export's per-workload rows: run, metric, workload, value, reference_value, beat), a task in WORKLOADS
also gets each workload's numbers (Qiuyang, 2026-10-15: CREST's two programs differ tenfold, so a mean over them says
little): per metric, "w" = {workload: {"ref": the reference's median, "margin": the median margin a run had to beat it
by (from --margins, where the evidence states one), "by": {model id: [value, reference value, beat, margin]}}}.

With --reference (one row per task and metric: task, metric, reference_mean, task_version_id, source), a metric whose
runs give no reference value takes the profiled one (Qiuyang, 2026-10-15: measured in a run of the human reference alone,
or read from existing evidence), where the row names no task version or one that the task's runs used; "profiled"
marks it, as it is no median over runs. --reference may repeat; a later file's row replaces an earlier one's. A metric in
REF_SCOPE takes only a row whose "scope" lists the workloads its runs' means cover.

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
# a direction the export lacks (its direction file predates this task version), as every workload decision follows it
BETTER = {('Adaptive attacks', 'attack_bytes'): 'lower', ('Adaptive attacks', 'attack_success_rate'): 'higher',
          ('Adaptive attacks', 'successful_normalized_diversity'): 'higher'}
# penalty terms the evidence keeps as negative rewards (higher is better): the page shows their size as a cost, lower is
# better (Qiuyang, 2026-10-15: "-0.00497, higher is better" reads backwards)
NEGATE = {('MuJoCo Playground', 'action_rate'), ('MuJoCo Playground', 'energy')}
UNIT_NAME = {'milliseconds': 'ms', 'microseconds': 'µs', 'seconds': 's'}   # the export's unit, for keys without a unit suffix
# metrics whose runs keep a mean over only some workloads: a profiled reference counts only with the same "scope"
# (Polar Express keeps these two over the original six of its twelve cases; Qiuyang, 2026-10-15)
SIX = {'square_0', 'square_1', 'tall_0', 'tall_1', 'wide_0', 'wide_1'}
REF_SCOPE = {('Polar Express', 'relative_polar_factor_error'): SIX, ('Polar Express', 'worst_case_scalar_error'): SIX}
# the human reference's value by decision where no human implementation exists (Qiuyang, 2026-10-15: Structured LWE
# counts as solving every instance, as its final score is 100); "fixed" marks it
REF_FIXED = {('Structured LWE', 'valid_witness'): 1}
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
        if (t, metric) in BETTER: s['better'] = BETTER[t, metric]
        if (t, metric) in NEGATE and s['better'] == 'higher':
            neg = lambda v: None if v is None else -v
            s['ref'], s['by'], s['better'] = neg(s['ref']), {k: [neg(a), neg(b)] for k, (a, b) in s['by'].items()}, 'lower'
live_ver = {}   # per task, the task versions of the runs counted
for r in rows:
    if not dbp or r['run_id'] in live: live_ver.setdefault(r['task'], set()).add(r.get('task_version_id'))
profiled = 0
refpaths = [a[12:] for a in sys.argv[2:] if a.startswith('--reference=')]
for p in (json.loads(l) for f in refpaths for l in open(f) if l.strip()):
    if p['task'] not in TASK or p['reference_mean'] is None or p.get('task_version_id') not in live_ver.get(p['task'], set()) | {None}: continue
    t = TASK[p['task']][1] or p['task']
    s = out.get(t, {}).get(p['metric'])
    if (t, p['metric']) in REF_SCOPE and set(p.get('scope') or ()) != REF_SCOPE[t, p['metric']]: continue
    if s is not None and (s['ref'] is None or s.get('profiled')):   # a later file's row replaces an earlier one's
        s['ref'], s['profiled'] = r4(p['reference_mean']), True; profiled += 1
for (t, metric), v in REF_FIXED.items():
    s = out.get(t, {}).get(metric)
    if s is not None and s['ref'] is None: s['ref'], s['fixed'] = v, True
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
      + (f'; numbers of {stale} rows dropped, their runs not in {dbp}' if dbp else '')
      + (f'; {profiled} reference means from {", ".join(refpaths)}' if refpaths else ''))
