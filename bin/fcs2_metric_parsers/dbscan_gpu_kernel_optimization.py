# dbscan kernel: verifier/evidence.tar!/metrics.json -> metrics.comparison_details[] (one per final workload, 6 in eval).
# value/ref = candidate.<metric> / reference.<metric> (latency = median of 3 timed reps in ms; ARI = min over reps;
# noise_mismatch_fraction = max over reps); beat = comparison_details[].metrics.<metric>.
import json
KEY = 'verifier/evidence.tar!/metrics.json'
METRICS = ('adjusted_rand_index', 'dbscan_latency_ms', 'noise_mismatch_fraction')
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    rows = []
    for w in m.get('comparison_details') or []:
        c, r, p = w.get('candidate') or {}, w.get('reference') or {}, w.get('metrics') or {}
        for k in METRICS:
            row = dict(metric=k, workload=w.get('workload'), value=c.get(k), reference_value=r.get(k), beat=p.get(k))
            if k == 'dbscan_latency_ms': row['unit'] = 'milliseconds'
            rows.append(row)
    return rows
