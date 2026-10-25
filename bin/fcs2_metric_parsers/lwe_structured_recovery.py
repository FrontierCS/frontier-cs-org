import json
# verifier/evidence.tar!/metrics.json (top-level, schema frontier.lwe-structured-recovery-evidence/v1):
# workloads = beat_spec_workload_passes[].workload (the 200 public instances); per instance
# valid_witness = 1 if the id is in metrics.solved_ids else 0 (falls back to the per-instance pass flag, which is
# equivalent because the frozen empty reference scores 0 everywhere). Site value = mean = solved_count/instance_count.
# The evidence states no per-instance reference value (only reference_score 0.0), so reference_value=None;
# the site's ref (=1, "fixed") is applied downstream (REF_FIXED in fcs2_metric_means.py).
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    d = json.loads(s)
    m = d.get('metrics') or {}
    passes = d.get('beat_spec_workload_passes') or m.get('beat_spec_workload_passes') or []
    solved = m.get('solved_ids')
    solved = set(solved) if isinstance(solved, list) else None
    rows = []
    for p in passes:
        w = p.get('workload'); f = (p.get('metrics') or {}).get('valid_witness')
        if solved is not None: v = 1.0 if w in solved else 0.0
        elif f is not None: v = 1.0 if f else 0.0
        else: v = None
        row = dict(metric='valid_witness', workload=w, value=v, reference_value=None)
        if f is not None: row['beat'] = bool(f)
        rows.append(row)
    if not rows and m.get('instance_count'):
        rows.append(dict(metric='valid_witness', workload='*',
                         value=(m.get('solved_count') or 0) / m['instance_count'], reference_value=None))
    return rows
