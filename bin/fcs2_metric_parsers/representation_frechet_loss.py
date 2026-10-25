import json
# verifier/evidence.tar!/metrics.json: metrics.runtime_evidence[] event log. Each
# {event:'phase_started', phase:'eval', side, workload} is followed by
# {event:'phase_completed', phase:'eval', report:{metrics:{<x>_fdr: ...}}} -> per-workload value
# (side=candidate) / reference_value (side=reference). beat from metrics.beat_spec_workload_passes.
# (metrics.development_mean_<metric> equals the candidate mean, but there is no reference aggregate,
#  so the per-workload event log is used for both.)
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None: return []
    m = json.loads(raw).get('metrics') or {}
    vals = {}  # (workload, side) -> metrics
    cur = None
    for e in m.get('runtime_evidence') or []:
        if e.get('event') == 'phase_started': cur = (e.get('phase'), e.get('workload'), e.get('side'))
        elif e.get('event') == 'phase_completed' and e.get('phase') == 'eval' and cur and cur[0] == 'eval':
            mm = (e.get('report') or {}).get('metrics')
            if isinstance(mm, dict): vals[(cur[1], cur[2])] = mm
    passes = {p['workload']: p.get('metrics', {}) for p in m.get('beat_spec_workload_passes') or []}
    workloads = []
    for (w, _s) in vals:
        if w not in workloads: workloads.append(w)
    rows = []
    for w in workloads:
        c, r = vals.get((w, 'candidate'), {}), vals.get((w, 'reference'), {})
        for k in sorted(set(c) | set(r)):
            row = dict(metric=k, workload=w, value=c.get(k), reference_value=r.get(k))
            if k in passes.get(w, {}): row['beat'] = bool(passes[w][k])
            rows.append(row)
    return rows
