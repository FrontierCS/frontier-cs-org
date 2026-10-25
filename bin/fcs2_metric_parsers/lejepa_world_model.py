import json
# verifier/evidence.tar!/metrics.json: the evaluator stores only the candidate's MEAN over the final workloads
# (metrics.<name> = sum(row[name])/len(rows), judge/evaluator.py) -- per-workload candidate values are not in the
# evidence. Per-workload reference values are metrics.reference_<name>[i]; pass flags metrics.<name>_clear_by_workload[i]
# (workload ids from metrics.beat_spec_workload_passes[i].workload). So per metric we emit per-workload rows
# (value=None, reference_value, beat) plus a workload='*' row with the aggregate (candidate mean, mean of references),
# which is what the site shows.
METRICS = ('r2_zh', 'r2_hz', 'orth_err_normalized', 'epsilon', 'delta', 'procrustes_mse')
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    wl = [p.get('workload') for p in m.get('beat_spec_workload_passes') or []]
    rows = []
    for k in METRICS:
        refs = m.get('reference_' + k) or []
        clears = m.get(k + '_clear_by_workload') or []
        if m.get(k) is None and not refs: continue
        for i, rv in enumerate(refs):
            row = dict(metric=k, workload=wl[i] if i < len(wl) else 'w%d' % i, value=None, reference_value=rv)
            if i < len(clears): row['beat'] = bool(clears[i])
            rows.append(row)
        rows.append(dict(metric=k, workload='*', value=m.get(k),
                         reference_value=sum(refs) / len(refs) if refs else None))
    return rows
