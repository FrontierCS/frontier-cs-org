import json
# verifier/evidence.tar!/metrics.json.
# Site rule (matches all old models):
#  - branch_accuracy, transaction_path_accuracy: workload='*' aggregate = top-level metrics.branch_accuracy /
#    metrics.transaction_path_accuracy, i.e. the evaluator's pooled per-record mean over the scored window
#    (final: epoch 400 = blocks 201-400, both categories), NOT a mean over the 6 category-epoch workloads.
#    Per-workload rows are also emitted (epoch_measurements.<epoch>.<category>.branch_ticks|transaction_ticks
#    / observations / 100, the printed hundredths) for detail; the '*' row is what the site mean uses.
#  - report_coverage: mean over the 6 workloads (epochs 200/400/600 x complex/normal) of
#    epoch_measurements.<epoch>.<category>.observations.
# beat = beat_spec_workload_passes[].metrics.<metric>, workload name '<epoch>-<category>' -> 'epoch<e>-<c>'.
# Reference values are not in the evidence (site uses a profile: 'profiled': true) -> None.
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    E = m.get('epoch_measurements') or {}
    if not E and 'branch_accuracy' not in m: return []
    flags = {w.get('workload'): (w.get('metrics') or {}) for w in m.get('beat_spec_workload_passes', [])}
    rows = []
    for metric in ('branch_accuracy', 'transaction_path_accuracy'):
        if m.get(metric) is not None:
            rows.append(dict(metric=metric, workload='*', value=m[metric], reference_value=None))
    for epoch, cats in sorted(E.items(), key=lambda kv: int(kv[0])):
        for cat, v in sorted(cats.items()):
            name = f'epoch{epoch}-{cat}'
            f = flags.get(name, {})
            obs = v.get('observations')
            per = {'report_coverage': obs}
            if obs:
                per['branch_accuracy'] = v['branch_ticks'] / obs / 100
                per['transaction_path_accuracy'] = v['transaction_ticks'] / obs / 100
            for metric, val in per.items():
                row = dict(metric=metric, workload=name, value=val, reference_value=None)
                if metric in f: row['beat'] = bool(f[metric])
                rows.append(row)
    return rows
