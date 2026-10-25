import json
# verifier/evidence.tar!/metrics.json: metrics.compression_ratio[] and metrics.runtime_seconds[] are candidate-only
# lists aligned with metrics.beat_spec_workload_passes[] (10 workloads, corpus-1..10) -> workload name taken from
# the pass list at the same index; beat = that row's metrics.<metric>.
# Reference per-workload values are not in the evidence (site uses a profile: 'profiled': true) -> None.
# A failed run has only verifier/evidence.tar!/diagnostics/failure.json -> [].
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    passes = m.get('beat_spec_workload_passes', [])
    rows = []
    for metric in ('compression_ratio', 'runtime_seconds'):
        vals = m.get(metric)
        if not isinstance(vals, list): continue
        for i, v in enumerate(vals):
            p = passes[i] if i < len(passes) else {}
            row = dict(metric=metric, workload=p.get('workload', str(i)), value=v, reference_value=None)
            f = p.get('metrics') or {}
            if metric in f: row['beat'] = bool(f[metric])
            if metric == 'runtime_seconds': row['unit'] = 'seconds'
            rows.append(row)
    return rows
