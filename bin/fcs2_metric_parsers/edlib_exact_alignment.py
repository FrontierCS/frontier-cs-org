# Exact Sequence Alignment: verifier/evidence.tar!/metrics.json -> metrics.<metric>_candidate_by_workload /
# <metric>_reference_by_workload (dicts over all 60 final workloads, 30 public-* + 30 heldout-*; the site's mean is over
# all 60) for cpu_time_seconds and core_peak_live_bytes; beat from metrics.beat_spec_workload_passes.
import json
KEY = 'verifier/evidence.tar!/metrics.json'
METRICS = {'cpu_time_seconds': 'seconds', 'core_peak_live_bytes': None}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for k, unit in METRICS.items():
        c = m.get(k + '_candidate_by_workload') or {}
        r = m.get(k + '_reference_by_workload') or {}
        for wl in sorted(set(c) | set(r)):
            row = dict(metric=k, workload=wl, value=c.get(wl), reference_value=r.get(wl))
            if k in passes.get(wl, {}): row['beat'] = passes[wl][k]
            if unit: row['unit'] = unit
            rows.append(row)
    return rows
