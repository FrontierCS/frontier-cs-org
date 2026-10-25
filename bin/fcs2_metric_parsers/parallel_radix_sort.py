import json, statistics
# verifier/evidence.tar!/measurement.json -> metrics.measurements[] (one per final workload):
#   region_graph_ns  = candidate_region_graph_ns / reference_region_graph_ns   (site: plain mean over workloads)
#   auxiliary_bytes  = candidate_aux_bytes / reference_aux_bytes (raw bytes; the clear rule is A_w <= 0.05*input_bytes_w,
#                      a bound, not a margin over the reference, so no 'margin' is emitted)
#   sort_time_ns     = candidate_ns / reference_ns per workload, BUT the site shows the evidence's own aggregate
#                      metrics.sort_time_ns / metrics.reference_sort_time_ns, which is the MEDIAN over workloads, not the
#                      mean -> a workload='*' row carries it (the harness prefers '*'); the per-workload rows are kept
#                      for beat flags. Fallback when the aggregate fields are absent: median of the per-workload values.
# beat from metrics.beat_spec_workload_passes[].metrics.<metric>.
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/measurement.json')
    if raw is None:
        return []
    m = json.loads(raw).get('metrics') or {}
    meas = m.get('measurements') or []
    if not meas:
        return []
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    spec = [('sort_time_ns', 'candidate_ns', 'reference_ns', 'nanoseconds'),
            ('region_graph_ns', 'candidate_region_graph_ns', 'reference_region_graph_ns', 'nanoseconds'),
            ('auxiliary_bytes', 'candidate_aux_bytes', 'reference_aux_bytes', None)]
    rows = []
    for metric, ck, rk, unit in spec:
        for x in meas:
            w = x.get('workload')
            row = dict(metric=metric, workload=w, value=x.get(ck), reference_value=x.get(rk))
            if unit: row['unit'] = unit
            b = passes.get(w, {}).get(metric)
            if isinstance(b, bool): row['beat'] = b
            rows.append(row)
    med = lambda k: (lambda v: statistics.median(v) if v else None)([x[k] for x in meas if x.get(k) is not None])
    sv = m.get('sort_time_ns'); sr = m.get('reference_sort_time_ns')
    rows.append(dict(metric='sort_time_ns', workload='*', value=sv if sv is not None else med('candidate_ns'),
                     reference_value=sr if sr is not None else med('reference_ns'), unit='nanoseconds'))
    return rows
