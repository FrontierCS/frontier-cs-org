# Diffusion Policy: verifier/evidence.tar!/metrics.json -> metrics.private_measurements.{candidate,reference}.<workload>.<metric>
# over all 4 final workloads (public0/1, private0/1 -- the site's mean includes the public ones too); beat from
# metrics.beat_spec_workload_passes[].metrics.
import json
KEY = 'verifier/evidence.tar!/metrics.json'
UNIT = {'complete_workload_wall_seconds': 'seconds', 'mean_predict_action_seconds': 'seconds'}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    pm = m.get('private_measurements') or {}
    cand, ref = pm.get('candidate') or {}, pm.get('reference') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for wl in sorted(set(cand) | set(ref)):
        c, r = cand.get(wl) or {}, ref.get(wl) or {}
        for k in sorted(set(c) | set(r)):
            row = dict(metric=k, workload=wl, value=c.get(k), reference_value=r.get(k))
            if k in passes.get(wl, {}): row['beat'] = passes[wl][k]
            if k in UNIT: row['unit'] = UNIT[k]
            rows.append(row)
    return rows
