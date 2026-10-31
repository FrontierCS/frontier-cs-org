import json
# verifier/evidence.tar!/metrics.json: metrics.beat_spec_workload_passes[] (final: 12 disclosed-grid workloads
# capacity=100/200/400/800 + 12 'capacity=final-only-N' workloads), candidate/reference per workload,
# beat = metrics.<metric> pass flag.
#  - value and reference_value: per workload, read from .candidate / .reference, on every workload where that metric is
#    a beat-spec comparison: all 24 workloads for the 3 deterministic metrics, only the 12 disclosed ones for
#    mean_query_time (final-only rows carry no time comparison).
MAP = {'last_result_inner_product_ratio': 'last_result_inner_product_ratio',
       'mean_query_time': 'mean_query_time_ms',
       'recall_at_50': 'recall_at_50',
       'verified_candidate_count': 'mean_verified_candidate_count'}
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    rows = []
    for w in m.get('beat_spec_workload_passes', []):
        name = w.get('workload', '')
        final_only = 'final-only' in name
        c, r, f = w.get('candidate') or {}, w.get('reference') or {}, w.get('metrics') or {}
        for metric, key in MAP.items():
            if final_only and metric not in f: continue
            row = dict(metric=metric, workload=name, value=c.get(key), reference_value=r.get(key))
            if metric in f: row['beat'] = bool(f[metric])
            if metric == 'mean_query_time': row['unit'] = 'milliseconds'
            rows.append(row)
    return rows
