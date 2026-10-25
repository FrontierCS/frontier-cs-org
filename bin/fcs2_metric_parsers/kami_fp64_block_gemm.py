import json
# verifier/evidence.tar!/metrics.json: metrics.paired_reference_tflops[] (8 final workloads):
#   candidate_tflops vs reference_tflops (each = geomean of per-order medians of paired samples);
#   beat from beat_spec_workload_passes; margin = metrics.reference_improvement_ratio (clears iff C >= ratio * R).
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    margin = m.get('reference_improvement_ratio')
    rows = []
    for p in m.get('paired_reference_tflops') or []:
        wl = p.get('workload')
        r = dict(metric='tflops', workload=wl, value=p.get('candidate_tflops'), reference_value=p.get('reference_tflops'))
        if margin is not None: r['margin'] = margin
        b = passes.get(wl, {}).get('tflops')
        if b is not None: r['beat'] = bool(b)
        rows.append(r)
    return rows
