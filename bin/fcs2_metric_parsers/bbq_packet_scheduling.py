import json
# verifier/evidence.tar!/metrics.json: final evidence has NO per-workload throughput/latency numbers.
# metrics.beat_spec_workload_passes[] gives only pass flags per workload (dev_a..d, hidden_0..3, hidden_scale);
# per-workload period_ps is in metrics.resource_diagnostics.{candidate,reference}.<wl>.period_ps but cycle counts
# (cycles, count, latency_cycles) are not exported; only dev-subset candidate scalars (dev_min_throughput_*,
# dev_max_latency_*) exist. So value/reference_value are None; only 'beat' flags are emitted.
# (Observed: site throughput mean == raw_score * const, const ~8.78e6, since efficiency = 100*span*800ps/(cycles*period)
#  and count/offered_span is fixed per trace -- but that constant is not in the evidence.)
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    rows = []
    for w in m.get('beat_spec_workload_passes', []):
        for metric, ok in (w.get('metrics') or {}).items():
            row = dict(metric=metric, workload=w.get('workload'), value=None, reference_value=None, beat=bool(ok))
            if metric == 'latency_seconds': row['unit'] = 'seconds'
            rows.append(row)
    return rows
