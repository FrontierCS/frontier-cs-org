import json
# verifier/evidence.tar!/metrics.json: the evidence carries NO per-workload numbers (beat_spec_workload_passes
# has only pass flags for 48 operating points), only candidate aggregates across the final suite:
# metrics.mean_recall / mean_ratio / mean_time_ms / mean_candidates. Emitted as workload='*' aggregates.
# Reference values are not in the evidence (site takes them from a profile: 'profiled': true) -> None.
# Per-workload 'beat' flags are emitted as value-less rows (value=None) so they don't affect the mean.
MAP = {'recall': 'mean_recall', 'overall_ratio': 'mean_ratio',
       'query_time_ms': 'mean_time_ms', 'candidates_verified': 'mean_candidates'}
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    rows = []
    for metric, key in MAP.items():
        if key not in m: continue
        row = dict(metric=metric, workload='*', value=m[key], reference_value=None)
        if metric == 'query_time_ms': row['unit'] = 'milliseconds'
        rows.append(row)
    if not rows: return []
    for w in m.get('beat_spec_workload_passes', []):
        for metric, ok in (w.get('metrics') or {}).items():
            rows.append(dict(metric=metric, workload=w.get('workload'), value=None, reference_value=None, beat=bool(ok)))
    return rows
