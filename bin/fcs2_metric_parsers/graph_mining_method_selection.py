import json
# verifier/evidence.tar!/metrics.json (metrics.*). Per-pattern (triangle/4clique) runtimes are withheld from the
# evidence, so emit suite-wide aggregates as workload='*':
#   selected_runtime_seconds: value = geomean_selected_runtime_seconds (all 112 cases);
#     reference = value * reference_regret / geomean_runtime_regret  (regret = geomean selected / geomean oracle,
#     so this is the reference selector's geomean selected runtime).
#   accuracy_qualified: value = fraction of workloads whose beat_spec_workload_passes flag for accuracy_qualified is
#     true (the evidence's only per-workload accuracy qualification); reference not in evidence (site ref is profiled).
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    rows = []
    g = m.get('geomean_selected_runtime_seconds')
    if g is not None:
        cr, rr = m.get('geomean_runtime_regret'), m.get('reference_regret')
        ref = g * rr / cr if cr and rr is not None else None
        rows.append(dict(metric='selected_runtime_seconds', workload='*', value=g, reference_value=ref, unit='seconds'))
    passes = m.get('beat_spec_workload_passes') or []
    for p in passes:
        wl, pm = p.get('workload'), p.get('metrics') or {}
        if 'accuracy_qualified' in pm:
            rows.append(dict(metric='accuracy_qualified', workload=wl, value=1.0 if pm['accuracy_qualified'] else 0.0,
                             reference_value=None, beat=bool(pm['accuracy_qualified'])))
    return rows
