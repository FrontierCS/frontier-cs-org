import json
# verifier/evidence.tar!/metrics.json: metrics.comparison_details[] gives per-workload candidate/reference values
# for each beat-spec metric; per-workload pass flags in .metrics. (metrics.margin is the score margin, not per-workload.)
METRICS = ('lloyd_loop_latency_ms', 'labeled_inertia', 'label_mismatch_fraction')
UNITS = {'lloyd_loop_latency_ms': 'milliseconds'}
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    rows = []
    for d in m.get('comparison_details') or []:
        c, r, f = d.get('candidate') or {}, d.get('reference') or {}, d.get('metrics') or {}
        for k in METRICS:
            row = dict(metric=k, workload=d.get('workload'), value=c.get(k), reference_value=r.get(k))
            if k in f: row['beat'] = bool(f[k])
            if k in UNITS: row['unit'] = UNITS[k]
            rows.append(row)
    return rows
