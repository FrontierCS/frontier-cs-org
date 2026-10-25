import json
# verifier/evidence.tar!/measurement.json: measurement.metrics.final_candidate_elapsed_seconds[i] /
# final_reference_elapsed_seconds[i] per final_workload_identities[i] (seconds, per-workload medians of repeated runs).
# beat from beat_spec_workload_passes[].metrics.elapsed_seconds. Strict C<R rule: no required margin
# (elapsed_seconds_margin_by_workload is the achieved R-C, not a threshold, so it is not emitted).
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/measurement.json')
    if raw is None:
        return []
    m = (json.loads(raw).get('measurement') or {}).get('metrics') or {}
    ids = m.get('final_workload_identities') or []
    c = m.get('final_candidate_elapsed_seconds') or []
    r = m.get('final_reference_elapsed_seconds') or []
    passes = {p.get('workload'): (p.get('metrics') or {}).get('elapsed_seconds') for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for i, w in enumerate(ids):
        row = dict(metric='elapsed_seconds', workload=w, value=c[i] if i < len(c) else None,
                   reference_value=r[i] if i < len(r) else None, unit='seconds')
        if isinstance(passes.get(w), bool):
            row['beat'] = passes[w]
        rows.append(row)
    return rows
