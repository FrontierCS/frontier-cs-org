import json
# verifier/evidence.tar!/case-evidence.json: case_ids[i], candidate_gaps[i], reference_gaps[i] (30 final instances:
# public15 + hidden15), pass flags beat_spec_workload_passes[case_id].gap. Mean of candidate_gaps == metrics.json
# metrics.mean_gap. Fallback when case-evidence.json is absent: metrics.json metrics.mean_gap as a workload='*' row
# (no reference). The reference is the same run's per-instance reference_gaps[i].
def parse(ev):
    c = ev.get('verifier/evidence.tar!/case-evidence.json')
    if c:
        d = json.loads(c)
        ids, cg, rg = d.get('case_ids') or [], d.get('candidate_gaps') or [], d.get('reference_gaps') or []
        passes = d.get('beat_spec_workload_passes') or {}
        rows = []
        for i, w in enumerate(ids):
            row = dict(metric='gap', workload=w, value=cg[i] if i < len(cg) else None,
                       reference_value=rg[i] if i < len(rg) else None)
            f = (passes.get(w) or {}).get('gap') if isinstance(passes, dict) else None
            if f is not None: row['beat'] = bool(f)
            rows.append(row)
        if rows: return rows
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    if m.get('mean_gap') is None: return []
    return [dict(metric='gap', workload='*', value=m['mean_gap'], reference_value=None)]
