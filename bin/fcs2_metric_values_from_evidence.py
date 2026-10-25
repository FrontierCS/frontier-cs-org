#!/usr/bin/env python3
"""The input of bin/fcs2_metric_means.py, rebuilt from the runs' released evidence: metric_aggregates.jsonl,
metric_values.jsonl and workload_margins.jsonl.

usage: python3 -I bin/fcs2_metric_values_from_evidence.py RELEASE_DIR OUT_DIR [--tasks=PROBLEMS_DIR] [--models=a,b,...]
       [--only=slug,...] [--results=formal-results.json]

RELEASE_DIR has the layout of the public dataset FrontierCS2/FrontierCS-2-runs: metadata/formal-results.json (one run
per task and model) and traces/<slug>/<model>/evidence.tar.zst. Of each archive only the final verifier evidence is
read (member verifier/evidence.tar, the platform's GET /api/v1/runs/<id>/submission/evidence?submission_id=final);
where the run's own final has no numbers (an infrastructure or evaluator failure) and
traces/<slug>/<model>/selected-final-rejudge/evidence.tar.zst exists, the rejudge's verifier evidence stands in (KV
Compaction Opus, Polygon Gemini); a run whose final scored keeps its own numbers though a rejudge exists (ParButterfly
Muse, QuarterPIR GLM), as the live page had it on 2026-10-22. PROBLEMS_DIR (default: the FrontierCS-2 release's
tasks/frontier-cs-2.0-demo/problems) gives each metric's direction from <category>/<slug>/judge/beat_spec.json.

Every verifier writes its own metrics.json (or measurement.json), so each task has its own reader in
bin/fcs2_metric_parsers/<slug>.py: parse(members) -> rows {metric, workload, value, reference_value[, beat, margin,
unit]}, one per hidden final workload, or one row with workload "*" where the site's number is not a mean over
workloads. A run's value is the arithmetic mean of its workload rows (nulls left out); a metric some run of the task has
and this run lacks (no final, a failed verification) gets null. The readers were rebuilt on 2026-10-25 from the
evidence of the 12 models then on the site, against the live assets/js/fcs2-metrics.js (the 2026-10-22 export chain,
exports/metric-values-1022/extract_1022.py on the old host, is lost); each reader's docstring says where its numbers
live and what it does not reproduce.

Evidence archives are untrusted: they are streamed (zstd -dc, tarfile in memory, nested tars opened from bytes), never
extracted and nothing in them is run; run this with python3 -I from a directory that is not an evidence folder.
"""
import ast, importlib.util, io, json, pathlib, subprocess, sys, tarfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
_src = ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text())
MODEL = next(ast.literal_eval(n.value) for n in _src.body for t in getattr(n, 'targets', []) if isinstance(t, ast.Name) and t.id == 'MODEL')
CANDIDATE = {}   # model id -> candidate name in the database (first MODEL key with that id), as fcs2_metric_means.py maps names
for c, v in MODEL.items(): CANDIDATE.setdefault(v[0], c)
PARSERS = ROOT / 'bin' / 'fcs2_metric_parsers'
# release slug -> task name in the database (TASK keys of bin/fcs2_runs_from_db.py), where formal-results.json's
# display_name is not one
TASK_NAME = {'progent_privilege_control': 'Privilege Control for Tool-Using LLM Agents', 'fast_kv_compaction': 'KV Cache Compaction',
             'lrr': 'Localized Regex Repair', 'vllm_llm_serving_optimization': 'GPU vLLM Serving Optimization',
             'mujoco_playground_cpu': 'Go1 Joystick Policy Training'}
# a run's numbers the released final evidence does not hold, carried from the live page (run id, metric -> [value, reference]):
# SCOPE's per-workload batch latency and BBQ's throughput and latency, which the 2026-10-16 export had and the verifiers'
# metrics.json does not (it keeps only suite medians and per-workload pass flags). Used only where the evidence gives
# nothing, and only for the run it names.
CARRY = {(c['run_id'], c['metric']): (c['value'], c['reference_value'])
         for c in map(json.loads, open(ROOT / 'bin' / 'fcs2_metric_carry.jsonl')) if c}
NEST = ('.tar', '.tar.gz', '.tgz', '.tar.zst')
MAX_MEMBER = 64 << 20    # a file inside the verifier evidence
MAX_ARCHIVE = 1 << 30    # the verifier evidence tar itself (vLLM's is a few hundred MB)


def members(path):
    """{member path: text} of the archive's final verifier evidence; nested tars as 'outer!/inner'."""
    out = {}
    def walk(tf, prefix, depth):
        for m in tf:
            if not m.isfile() or m.size > (MAX_ARCHIVE if m.name.endswith(NEST) else MAX_MEMBER): continue
            name, data = prefix + m.name, tf.extractfile(m).read()
            if m.name.endswith(NEST) and depth < 4:
                if m.name.endswith('.zst'): data = subprocess.run(['zstd', '-dcq'], input=data, capture_output=True).stdout
                try:
                    with tarfile.open(fileobj=io.BytesIO(data)) as t2: walk(t2, name + '!/', depth + 1)
                except tarfile.TarError: pass
                continue
            try: out[name] = data.decode()
            except UnicodeDecodeError: pass
    src = open(path, 'rb')   # through stdin: zstd skips a path that is a symlink
    p = subprocess.Popen(['zstd', '-dcq'], stdin=src, stdout=subprocess.PIPE)
    with tarfile.open(fileobj=p.stdout, mode='r|') as tf:
        for m in tf:
            if not m.isfile() or not m.name.startswith('verifier/') or m.size > MAX_ARCHIVE: continue
            data = tf.extractfile(m).read()
            if m.name.endswith('.tar'):
                with tarfile.open(fileobj=io.BytesIO(data)) as t2: walk(t2, m.name + '!/', 1)
            else:
                try: out[m.name] = data.decode()
                except UnicodeDecodeError: pass
    p.wait(); src.close()
    return out


def parser(slug):
    f = PARSERS / f'{slug}.py'
    if not f.exists(): return None
    spec = importlib.util.spec_from_file_location(f'fcs2_metric_parsers.{slug}', f)
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod.parse


def directions(problems, slug):
    for f in problems.glob(f'*/{slug}/judge/beat_spec.json'):
        return {m['name']: m.get('better') for m in json.load(open(f)).get('metrics', []) if isinstance(m, dict) and 'name' in m}
    return {}


def main():
    pos = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = dict(a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)
    if len(pos) != 2: sys.exit(__doc__)
    rel, out = pathlib.Path(pos[0]), pathlib.Path(pos[1]); out.mkdir(parents=True, exist_ok=True)
    problems = pathlib.Path(opt.get('tasks', pathlib.Path.home() / 'src/release/tasks/frontier-cs-2.0-demo/problems'))
    res = json.load(open(opt.get('results', rel / 'metadata' / 'formal-results.json')))
    tname = {t['task']: TASK_NAME.get(t['task'], t['display_name']) for t in res['tasks']}
    models = set(opt['models'].split(',')) if 'models' in opt else None
    only = set(opt['only'].split(',')) if 'only' in opt else None
    runs = [r for r in res['runs'] if (models is None or r['model_id'] in models) and (only is None or r['task'] in only)]
    per_task = {}
    for r in runs:
        slug = r['task']; parse = parser(slug)
        d = rel / 'traces' / slug / r['model_id']
        rows, arch = [], None
        for a in (d / 'evidence.tar.zst', d / 'selected-final-rejudge' / 'evidence.tar.zst'):
            if parse and a.exists() and not rows:
                try: rows, arch = parse(members(a)) or [], a
                except (KeyError, IndexError, TypeError, ValueError, ZeroDivisionError) as e:   # evidence of another shape: no numbers
                    print(f'{slug}/{r["model_id"]}: {a.name} unreadable ({e!r})', file=sys.stderr); rows, arch = [], a
        per_task.setdefault(slug, []).append((r, rows, arch.relative_to(rel).as_posix() if arch else None))
        print(f'{slug}/{r["model_id"]}: {len(rows)} rows', file=sys.stderr)
    fa, fv, fm = (open(out / n, 'w') for n in ('metric_aggregates.jsonl', 'metric_values.jsonl', 'workload_margins.jsonl'))
    for slug, items in sorted(per_task.items()):
        better = directions(problems, slug)
        metrics = sorted({x['metric'] for _, rows, _ in items for x in rows})
        unit = {x['metric']: x['unit'] for _, rows, _ in items for x in rows if x.get('unit')}
        for r, rows, src in items:
            base = {'run_id': r['run_id'], 'task': tname[slug], 'candidate': CANDIDATE.get(r['model_id'], r['candidate_name']), 'model_id': r['model_id']}
            for metric in metrics:
                mine = [x for x in rows if x['metric'] == metric]
                star = [x for x in mine if x['workload'] == '*']
                if star: v, rv = star[0]['value'], star[0].get('reference_value')
                else:
                    vs = [x['value'] for x in mine if x['value'] is not None]
                    rs = [x['reference_value'] for x in mine if x.get('reference_value') is not None]
                    v, rv = (sum(vs) / len(vs) if vs else None), (sum(rs) / len(rs) if rs else None)
                if v is None and rv is None and (r['run_id'], metric) in CARRY: v, rv = CARRY[r['run_id'], metric]
                b = next((x['better'] for x in mine if x.get('better')), None) or better.get(metric)
                fa.write(json.dumps({**base, 'metric': metric, 'better': b, 'unit': unit.get(metric), 'value': v,
                                     'reference_value': rv, 'workloads': len([x for x in mine if x['workload'] != '*']), 'source': src}) + '\n')
                for x in mine:
                    if x['workload'] == '*': continue
                    fv.write(json.dumps({**base, 'metric': metric, 'workload': x['workload'], 'value': x['value'],
                                         'reference_value': x.get('reference_value'), 'beat': x.get('beat')}) + '\n')
                    if x.get('margin') is not None:
                        fm.write(json.dumps({'run_id': r['run_id'], 'metric': metric, 'workload': x['workload'], 'margin': x['margin']}) + '\n')
    for f in (fa, fv, fm): f.close()
    print(f'{len(runs)} runs on {len(per_task)} tasks -> {out}', file=sys.stderr)


if __name__ == '__main__':
    main()
