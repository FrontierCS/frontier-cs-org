import json, math
# verifier/evidence.tar!/metrics.json: top-level paired_workload_metrics[] (NOT under 'metrics'):
#   candidate.<metric> -> value, reference.<metric> -> reference_value, per video workload.
# beat from metrics.beat_spec_workload_passes. (metrics.<metric> lists are the same candidate values
# but SORTED, i.e. de-identified from workloads, and carry no reference; so the paired block is used.)
# The evaluator writes psnr_db == inf as the string 'positive_infinity'; mapped to float('inf').
# Reference values are pinned targets (identical across runs).
METRICS = ('e2e_latency_seconds', 'lpips', 'psnr_db', 'ssim')
UNITS = {'e2e_latency_seconds': 'seconds', 'psnr_db': 'dB'}
def _f(v):
    return math.inf if v == 'positive_infinity' else v
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None: return []
    d = json.loads(raw)
    m = d.get('metrics') or {}
    passes = {p['workload']: p.get('metrics', {}) for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for w in d.get('paired_workload_metrics') or []:
        name = w.get('workload'); c = w.get('candidate') or {}; r = w.get('reference') or {}
        for k in METRICS:
            row = dict(metric=k, workload=name, value=_f(c.get(k)), reference_value=_f(r.get(k)))
            if k in UNITS: row['unit'] = UNITS[k]
            if k in passes.get(name, {}): row['beat'] = bool(passes[name][k])
            rows.append(row)
    return rows
