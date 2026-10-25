import json
# verifier/evidence.tar!/metrics.json: metrics.raw_per_workload_<metric>{workload: v} vs
# metrics.reference_<metric>{workload: v} for the 14 graded final workloads; beat from beat_spec_workload_passes.
METRICS = {'egraph_node_growth': None, 'im2col_discovery': None, 'rewrite_time_seconds': 'seconds'}
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for metric, unit in METRICS.items():
        cand = m.get('raw_per_workload_' + metric) or {}
        ref = m.get('reference_' + metric) or {}
        for wl in list(cand) + [w for w in ref if w not in cand]:
            r = dict(metric=metric, workload=wl, value=cand.get(wl), reference_value=ref.get(wl))
            if unit: r['unit'] = unit
            b = passes.get(wl, {}).get(metric)
            if b is not None: r['beat'] = bool(b)
            rows.append(r)
    return rows
