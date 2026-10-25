import json, statistics
# verifier/evidence.tar!/metrics.json -> metrics.*
#   butterfly_count: per workload private_counts_per_workload[w].candidate / .reference; site = plain mean over the 8
#                    graphs (exact check; equal to the oracle when beat).
#   counting_seconds: per workload median(private_timing_samples[w].candidate_reference_pair) /
#                    median(private_timing_samples[w].reference) (31 paired reps). The site shows the evidence's own
#                    aggregate metrics.counting_seconds / metrics.reference_counting_seconds, which is the MEDIAN over
#                    workloads of those per-workload medians (verified), not their mean -> a workload='*' row carries it.
#                    Clear rule (beat_spec): median paired ratio ref/cand > 1.05 (not restated per workload in evidence).
# beat from metrics.beat_spec_workload_passes[].metrics.<metric>. Final with only diagnostics/failure.json -> [].
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None:
        return []
    m = json.loads(raw).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    def add(metric, w, v, r, unit=None):
        row = dict(metric=metric, workload=w, value=v, reference_value=r)
        if unit: row['unit'] = unit
        b = passes.get(w, {}).get(metric)
        if isinstance(b, bool): row['beat'] = b
        rows.append(row)
    for w, c in (m.get('private_counts_per_workload') or {}).items():
        add('butterfly_count', w, c.get('candidate'), c.get('reference'))
    med = lambda xs: statistics.median(xs) if xs else None
    cm, rm = [], []
    for w, s in (m.get('private_timing_samples') or {}).items():
        c, r = med(s.get('candidate_reference_pair') or []), med(s.get('reference') or [])
        add('counting_seconds', w, c, r, 'seconds')
        if c is not None: cm.append(c)
        if r is not None: rm.append(r)
    cv, rv = m.get('counting_seconds'), m.get('reference_counting_seconds')
    if cv is not None or rv is not None or cm:
        rows.append(dict(metric='counting_seconds', workload='*', value=cv if cv is not None else med(cm),
                         reference_value=rv if rv is not None else med(rm), unit='seconds'))
    return rows
