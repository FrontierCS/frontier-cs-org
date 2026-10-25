import json
# verifier/evidence.tar!/metrics.json: metrics.psnr / ssim / lpips are the candidate's MEAN over the 6 final clips
# (judge/evaluator.py: sum(row[k])/len(candidate)); per-clip candidate values and all reference values are not in the
# evidence (the reference rows are judge-owned; the site's ref is profiled). Emit per-clip rows (value/reference None)
# with pass flags from metrics.beat_spec_workload_passes, plus one workload='*' row with the candidate mean.
METRICS = ('psnr', 'ssim', 'lpips')
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    rows = []
    for k in METRICS:
        if m.get(k) is None: continue
        for p in m.get('beat_spec_workload_passes') or []:
            f = p.get('metrics') or {}
            if k in f:
                rows.append(dict(metric=k, workload=p.get('workload'), value=None, reference_value=None, beat=bool(f[k])))
        rows.append(dict(metric=k, workload='*', value=m[k], reference_value=None))
    return rows
