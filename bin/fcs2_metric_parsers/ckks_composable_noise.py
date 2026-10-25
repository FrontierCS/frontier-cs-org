import json
# verifier/evidence.tar!/metrics.json: per-workload dicts keyed by workload id (29 final workloads):
#   metrics.avg_log2_prec_l2_abs_discrepancy_bits[w], metrics.std_log2_prec_l2_abs_discrepancy_bits[w] (numbers),
#   metrics.estimator_seconds[w] (list of 3 repeat timings -> arithmetic mean per workload),
#   and the same under metrics.reference_<name>[w].
# beat = metrics.beat_spec_workload_passes[].metrics.<metric>. Means equal metrics.candidate_*_mean fields.
METRICS = ('avg_log2_prec_l2_abs_discrepancy_bits', 'std_log2_prec_l2_abs_discrepancy_bits', 'estimator_seconds')
def _v(x):
    if isinstance(x, list):
        x = [v for v in x if isinstance(v, (int, float))]
        return sum(x) / len(x) if x else None
    return x if isinstance(x, (int, float)) else None
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    flags = {w.get('workload'): (w.get('metrics') or {}) for w in m.get('beat_spec_workload_passes', [])}
    rows = []
    for metric in METRICS:
        cand, ref = m.get(metric), m.get('reference_' + metric) or {}
        if not isinstance(cand, dict): continue
        for w, x in cand.items():
            row = dict(metric=metric, workload=w, value=_v(x), reference_value=_v(ref.get(w)))
            if metric in flags.get(w, {}): row['beat'] = bool(flags[w][metric])
            if metric == 'estimator_seconds': row['unit'] = 'seconds'
            rows.append(row)
    return rows
