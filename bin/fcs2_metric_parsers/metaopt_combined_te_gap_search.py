import json
# verifier/evidence.tar!/case-evidence.json: case_ids[i], candidate_gaps[i], reference_gaps[i] (30 final instances:
# public15 + hidden15), pass flags beat_spec_workload_passes[case_id].gap. Mean of candidate_gaps == metrics.json
# metrics.mean_gap. Fallback when case-evidence.json is absent: metrics.json metrics.mean_gap as a workload='*' row
# (no reference). NOTE: the live site has reference cells null and a profiled ref (26.0) because its extractor only
# read metrics.json; the same-run per-instance reference gaps in case-evidence.json average exactly 26.0 in every run.
# reference_value is left None so the site keeps the profiled 26.0 and the run cells stay as they are.
def parse(ev):
    c = ev.get('verifier/evidence.tar!/case-evidence.json')
    if c:
        d = json.loads(c)
        ids, cg, rg = d.get('case_ids') or [], d.get('candidate_gaps') or [], d.get('reference_gaps') or []
        passes = d.get('beat_spec_workload_passes') or {}
        rows = []
        for i, w in enumerate(ids):
            row = dict(metric='gap', workload=w, value=cg[i] if i < len(cg) else None,
                       reference_value=None)
            f = (passes.get(w) or {}).get('gap') if isinstance(passes, dict) else None
            if f is not None: row['beat'] = bool(f)
            rows.append(row)
        if rows: return rows
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    if m.get('mean_gap') is None: return []
    return [dict(metric='gap', workload='*', value=m['mean_gap'], reference_value=None)]
