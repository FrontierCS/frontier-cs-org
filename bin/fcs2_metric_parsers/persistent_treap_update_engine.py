import json, statistics
# verifier/evidence.tar!/metrics.json -> metrics.*
#   value: metrics.<metric>[] {workload, value} (candidate's per-workload median of 5 timed runs)
#   reference_value: median(metrics.performance_measurements[w].reference_<field>) over its 5 samples, where
#     case_throughput_ktps <- reference_throughput_ktps, historical_query_us <- reference_historical_query_us,
#     peak_memory_mib <- reference_peak_memory_mib. Site = plain mean over the 24 case/thread/client workloads.
# beat from metrics.beat_spec_workload_passes[].metrics.<metric>.
FIELD = {'case_throughput_ktps': 'throughput_ktps', 'historical_query_us': 'historical_query_us',
         'peak_memory_mib': 'peak_memory_mib'}
UNIT = {'historical_query_us': 'microseconds'}
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None:
        return []
    m = json.loads(raw).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    pm = {p.get('workload'): p for p in m.get('performance_measurements') or []}
    rows = []
    for metric, f in FIELD.items():
        cand = {x.get('workload'): x.get('value') for x in m.get(metric) or [] if isinstance(x, dict)}
        for w in cand.keys() | {w for w in pm if pm[w].get('candidate_' + f)}:
            v = cand.get(w)
            if v is None and pm.get(w, {}).get('candidate_' + f):
                v = statistics.median(pm[w]['candidate_' + f])
            rs = (pm.get(w) or {}).get('reference_' + f) or []
            row = dict(metric=metric, workload=w, value=v, reference_value=statistics.median(rs) if rs else None)
            if metric in UNIT: row['unit'] = UNIT[metric]
            b = passes.get(w, {}).get(metric)
            if isinstance(b, bool): row['beat'] = b
            rows.append(row)
    return sorted(rows, key=lambda r: (r['metric'], r['workload']))
