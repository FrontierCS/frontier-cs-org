import json
# verifier/evidence.tar!/metrics.json: metrics.per_workload_candidate_metrics[group][metric] (candidate)
# vs metrics.reference_<metric>[group] (reference); beat from metrics.beat_spec_workload_passes.
# No per-workload margin in evidence (metrics.margin is a single score-level number).
METRICS = ('average_episodic_reward', 'success_rate')
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None: return []
    m = json.loads(raw).get('metrics') or {}
    cand = m.get('per_workload_candidate_metrics') or {}
    passes = {p['workload']: p.get('metrics', {}) for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for w, cm in cand.items():
        for k in METRICS:
            r = dict(metric=k, workload=w, value=cm.get(k),
                     reference_value=(m.get('reference_' + k) or {}).get(w))
            if k in passes.get(w, {}): r['beat'] = bool(passes[w][k])
            rows.append(r)
    return rows
