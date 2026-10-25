import json
# verifier/evidence.tar!/metrics.json: metrics.comparison_details[] (8 final workloads):
#   candidate.<metric> vs reference.<metric> for iso_recall, nn_recall, search_latency_ms (median of timed samples, ms);
#   beat flags = comparison_details[].metrics[<metric>] (same as beat_spec_workload_passes).
METRICS = {'iso_recall': None, 'nn_recall': None, 'search_latency_ms': 'milliseconds'}
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    rows = []
    for d in m.get('comparison_details') or []:
        c, r_, flags = d.get('candidate') or {}, d.get('reference') or {}, d.get('metrics') or {}
        wl = d.get('workload') or c.get('id')
        for metric, unit in METRICS.items():
            r = dict(metric=metric, workload=wl, value=c.get(metric), reference_value=r_.get(metric))
            if unit: r['unit'] = unit
            if metric in flags: r['beat'] = bool(flags[metric])
            rows.append(r)
    return rows
