import json
# verifier/evidence.tar!/metrics.json: metrics.queries{<split>/<n>: q}; the site uses only the 19 hidden 'final/*'
# queries (the 20 'dev/*' public queries are also in the graded suite but excluded from the site means).
#   median_latency: q.candidate_median_us vs q.reference_median_us (microseconds; metrics.duration_unit),
#                   beat = q.latency_pass
#   exact_result:   1.0 if q.correctness_pass else 0.0; reference = 1.0 iff every
#                   correctness_measurements.matches_original.Reference is true; beat = q.correctness_pass
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    unit = m.get('duration_unit') or 'microseconds'
    rows = []
    for wl, q in (m.get('queries') or {}).items():
        if not wl.startswith('final/'): continue
        rows.append(dict(metric='median_latency', workload=wl, value=q.get('candidate_median_us'),
                         reference_value=q.get('reference_median_us'), unit=unit,
                         **({'beat': bool(q['latency_pass'])} if q.get('latency_pass') is not None else {})))
        cp = q.get('correctness_pass')
        refm = ((q.get('correctness_measurements') or {}).get('matches_original') or {}).get('Reference')
        rows.append(dict(metric='exact_result', workload=wl, value=None if cp is None else (1.0 if cp else 0.0),
                         reference_value=None if not refm else (1.0 if all(refm) else 0.0),
                         **({'beat': bool(cp)} if cp is not None else {})))
    return rows
