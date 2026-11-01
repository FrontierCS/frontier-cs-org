# Robust Image Tokenizer: verifier/evidence.tar!/metrics.json.
# Evidence with metrics.per_workload_measurements[i] (one entry per final workload): .candidate and .reference hold all
# five metrics (the two PSNRs, the two LPIPS and the method's wall time), beat from metrics.beat_spec_workload_passes;
# the candidate's mean over them equals metrics.development_mean_<metric>.
# Older evidence keeps no per-workload numbers, only the candidate's mean over the final workloads as
# metrics.development_mean_<metric> (despite the name, the eval-mode final means): one workload='*' row per metric and
# no reference numbers (the site's ref is profiled).
import json
KEY = 'verifier/evidence.tar!/metrics.json'
METRICS = ('ema_quantized_png_psnr_db', 'method_process_wall_seconds', 'ordinary_quantized_png_psnr_db')
BETTER = {'ema_quantized_png_lpips': 'lower', 'ordinary_quantized_png_lpips': 'lower', 'ema_quantized_png_psnr_db': 'higher',
          'ordinary_quantized_png_psnr_db': 'higher', 'method_process_wall_seconds': 'lower'}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    rows = []
    pw = m.get('per_workload_measurements')
    if pw:
        passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
        for w in pw:
            c, r, name = w.get('candidate') or {}, w.get('reference') or {}, w.get('workload')
            for k, better in BETTER.items():
                row = dict(metric=k, workload=name, value=c.get(k), reference_value=r.get(k), better=better)
                if k in passes.get(name, {}): row['beat'] = bool(passes[name][k])
                if k == 'method_process_wall_seconds': row['unit'] = 'seconds'
                rows.append(row)
        return rows
    for k in METRICS:
        v = m.get('development_mean_' + k)
        if v is None: continue
        row = dict(metric=k, workload='*', value=v, reference_value=None)
        if k == 'method_process_wall_seconds': row['unit'] = 'seconds'
        rows.append(row)
    return rows
