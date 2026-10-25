import json
# verifier/evidence.tar!/metrics.json: metrics.<metric> is a list of per-trace candidate values, positionally
# aligned with metrics.beat_spec_workload_passes[i].workload (final_a, final_b) which also gives beat.
# No reference values in the evidence (live refs are profiled) -> reference_value None.
METRICS = ('average_jct_seconds', 'makespan_seconds', 'unfair_job_fraction_percent',
           'worst_finish_time_fairness_rho')
UNITS = {'average_jct_seconds': 'seconds', 'makespan_seconds': 'seconds', 'unfair_job_fraction_percent': 'percent'}
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None: return []
    m = json.loads(raw).get('metrics') or {}
    passes = m.get('beat_spec_workload_passes') or []
    rows = []
    for k in METRICS:
        vals = m.get(k)
        if vals is None: continue
        if not isinstance(vals, list): vals = [vals]
        for i, v in enumerate(vals):
            p = passes[i] if i < len(passes) else {}
            r = dict(metric=k, workload=p.get('workload', str(i)), value=v, reference_value=None)
            if k in UNITS: r['unit'] = UNITS[k]
            if k in p.get('metrics', {}): r['beat'] = bool(p['metrics'][k])
            rows.append(r)
    return rows
