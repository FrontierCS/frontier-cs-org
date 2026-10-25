import json
# verifier/evidence.tar!/metrics.json: metrics.paired_measurements[] (144 workloads) with candidate/reference per
# workload: build_ns, lookup_ns, resident_bytes (plain numbers); effective_fpr, space_overhead_pct as
# {lower, point, upper} -> use .point. beat from metrics.beat_spec_workload_passes[].metrics.<metric>.
# Means equal metrics.mean_build_ns / mean_lookup_ns / mean_effective_fpr / mean_resident_bytes.
# (The FPR/space non-inferiority anchors live in judge/statistical_calibration.json, not in the evidence -> no margin.)
METRICS = ('build_ns', 'effective_fpr', 'lookup_ns', 'resident_bytes', 'space_overhead_pct')
UNIT = {'build_ns': 'nanoseconds', 'lookup_ns': 'nanoseconds'}
def _v(x):
    if isinstance(x, dict): return x.get('point')
    return x
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    flags = {w.get('workload'): (w.get('metrics') or {}) for w in m.get('beat_spec_workload_passes', [])}
    rows = []
    for w in m.get('paired_measurements', []):
        c, r, name = w.get('candidate') or {}, w.get('reference') or {}, w.get('workload')
        f = flags.get(name, {})
        for metric in METRICS:
            row = dict(metric=metric, workload=name, value=_v(c.get(metric)), reference_value=_v(r.get(metric)))
            if metric in f: row['beat'] = bool(f[metric])
            if metric in UNIT: row['unit'] = UNIT[metric]
            rows.append(row)
    return rows
