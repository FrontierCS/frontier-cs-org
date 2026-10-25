# DyT: verifier/evidence.tar!/metrics.json -> metrics.per_workload_metrics.<final_a|b|c> (same as
# metrics.all_final_metrics.workloads): top1_accuracy_pct = candidate_/reference_accuracy, training_latency_ms =
# candidate_/reference_latency (median of 11 timed blocks, ms), inference_latency_ms = candidate_/reference_inference_latency.
# beat from metrics.beat_spec_workload_passes. A failed candidate has only all_final_metrics.candidate_failure -> [].
import json
KEY = 'verifier/evidence.tar!/metrics.json'
MAP = {'top1_accuracy_pct': ('accuracy', None), 'training_latency_ms': ('latency', 'milliseconds'),
       'inference_latency_ms': ('inference_latency', 'milliseconds')}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    wls = m.get('per_workload_metrics') or (m.get('all_final_metrics') or {}).get('workloads') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for wl, w in sorted(wls.items()):
        for metric, (k, unit) in MAP.items():
            row = dict(metric=metric, workload=wl, value=w.get('candidate_' + k), reference_value=w.get('reference_' + k))
            if metric in passes.get(wl, {}): row['beat'] = passes[wl][metric]
            if unit: row['unit'] = unit
            rows.append(row)
    return rows
