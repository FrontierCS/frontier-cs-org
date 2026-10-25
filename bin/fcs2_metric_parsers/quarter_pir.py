import json, statistics
# verifier/evidence.tar!/metrics.json -> metrics.*. Two workload groups (beat_spec):
#  RPC group, metrics.private_workload_measurements[] (4000 queries, workload 'wNNNNN'):
#    online_communication_bytes = candidate_bytes / reference_bytes
#    server_compute_time_ns     = median(candidate_ns) / median(reference_ns) (5 runs each)
#  experiment group, metrics.private_experiment_measurements[] (4 experiments 'eNNNNN'), from .candidate / .reference:
#    client_storage_bytes              = client_storage_bytes
#    end_to_end_online_time_ms         = values.end_to_end_online_time_ms (= online_elapsed_ns / 1e6 / actual_queries)
#    preprocessing_client_time_minutes = values.preprocessing_client_time_minutes (= offline_elapsed_ns / 6e10)
# Site = plain mean over each metric's workloads. beat from beat_spec_workload_passes[].metrics.<metric>.
# client_storage_bytes clears with a +32768-byte jitter allowance (beat_spec STORAGE_JITTER_BYTES; not in evidence).
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None:
        return []
    m = json.loads(raw).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    med = lambda xs: statistics.median(xs) if xs else None
    rows = []
    def add(metric, w, v, r, unit=None):
        row = dict(metric=metric, workload=w, value=v, reference_value=r)
        if unit: row['unit'] = unit
        b = passes.get(w, {}).get(metric)
        if isinstance(b, bool): row['beat'] = b
        rows.append(row)
    for x in m.get('private_workload_measurements') or []:
        w = x.get('workload')
        add('online_communication_bytes', w, x.get('candidate_bytes'), x.get('reference_bytes'))
        add('server_compute_time_ns', w, med(x.get('candidate_ns') or []), med(x.get('reference_ns') or []), 'nanoseconds')
    def exp_val(side, metric):
        if not isinstance(side, dict) or side.get('valid') is False and not side.get('values'):
            return None
        if metric == 'client_storage_bytes':
            return side.get('client_storage_bytes')
        v = (side.get('values') or {}).get(metric)
        if v is not None:
            return v
        n = side.get('actual_queries')
        if metric == 'end_to_end_online_time_ms' and side.get('online_elapsed_ns') is not None and n:
            return side['online_elapsed_ns'] / 1e6 / n
        if metric == 'preprocessing_client_time_minutes' and side.get('offline_elapsed_ns') is not None:
            return side['offline_elapsed_ns'] / 6e10
        return None
    for e in m.get('private_experiment_measurements') or []:
        w = e.get('workload')
        for metric, unit in (('client_storage_bytes', None), ('end_to_end_online_time_ms', 'milliseconds'),
                             ('preprocessing_client_time_minutes', 'minutes')):
            add(metric, w, exp_val(e.get('candidate'), metric), exp_val(e.get('reference'), metric), unit)
    return rows
