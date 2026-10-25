import json
# verifier/evidence.tar!/metrics.json: metrics.comparison_details[] (8 final workloads) gives candidate/reference
# latency_ms, worst_ball_recall, worst_exact_recall and the boolean distance_consistent (emitted as 1.0/0.0);
# per-workload pass flags in .metrics. (metrics.margin is the score margin, not per-workload.)
SRC = {'latency_ms': 'latency_ms', 'worst_ball_recall': 'worst_ball_recall',
       'worst_exact_recall': 'worst_exact_recall', 'distance_consistency': 'distance_consistent'}
def _num(v):
    if isinstance(v, bool): return 1.0 if v else 0.0
    return v
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    rows = []
    for d in m.get('comparison_details') or []:
        c, r, f = d.get('candidate') or {}, d.get('reference') or {}, d.get('metrics') or {}
        for k, src in SRC.items():
            row = dict(metric=k, workload=d.get('workload'), value=_num(c.get(src)), reference_value=_num(r.get(src)))
            if k in f: row['beat'] = bool(f[k])
            if k == 'latency_ms': row['unit'] = 'milliseconds'
            rows.append(row)
    return rows
