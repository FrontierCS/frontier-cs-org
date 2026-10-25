import json
# verifier/evidence.tar!/metrics.json -> metrics.wall_time_seconds[i] and metrics.refuted_pairs[i] (0/1), position i
# naming the workload of metrics.beat_spec_workload_passes[i] (else 'workload-<i+1>'). Site = plain mean over the 21
# workloads. The evidence carries NO reference values (live ref is profiled), so reference_value=None.
# beat from beat_spec_workload_passes[i].metrics.<metric>. The clear rule's allowance (original records:
# ref + max(0.03, 0.2*ref); hard records: < 0.5*ref) needs the reference time, which the evidence lacks -> no margin.
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None:
        return []
    m = json.loads(raw).get('metrics') or {}
    passes = m.get('beat_spec_workload_passes') or []
    rows = []
    for metric, key, unit in (('wall_time_seconds', 'wall_time_seconds', 'seconds'), ('refuted_pair', 'refuted_pairs', None)):
        vals = m.get(key)
        if not isinstance(vals, list):
            continue
        for i, v in enumerate(vals):
            p = passes[i] if i < len(passes) else {}
            row = dict(metric=metric, workload=p.get('workload') or f'workload-{i + 1}', value=v, reference_value=None)
            if unit: row['unit'] = unit
            b = (p.get('metrics') or {}).get(metric)
            if isinstance(b, bool): row['beat'] = b
            rows.append(row)
    return rows
