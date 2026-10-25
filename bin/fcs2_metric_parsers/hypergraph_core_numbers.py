import json
# verifier/evidence.tar!/metrics.json: metrics.<metric>_per_workload{w} (median of 7 timed runs) vs
# metrics.reference_<metric>_per_workload{w}, over all 4 measured workloads (feedback-a/b, graded-a/b);
# beat from beat_spec_workload_passes; margin = metrics.required_speedup_fraction (clears iff C <= (1-margin)*R).
METRICS = ('runtime_seconds', 'sequential_runtime_seconds')
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    margin = m.get('required_speedup_fraction')
    rows = []
    for metric in METRICS:
        cand = m.get(metric + '_per_workload') or {}
        ref = m.get('reference_' + metric + '_per_workload') or {}
        for wl in list(cand) + [w for w in ref if w not in cand]:
            r = dict(metric=metric, workload=wl, value=cand.get(wl), reference_value=ref.get(wl), unit='seconds')
            if margin is not None: r['margin'] = margin
            b = passes.get(wl, {}).get(metric)
            if b is not None: r['beat'] = bool(b)
            rows.append(r)
    return rows
