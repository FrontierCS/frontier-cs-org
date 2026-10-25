# Robust Image Tokenizer: verifier/evidence.tar!/metrics.json keeps no per-workload numbers, only the candidate's mean
# over the final workloads as metrics.development_mean_<metric> (despite the name, these are the eval-mode final means
# and are what the site shows). So one workload='*' row per metric. No reference numbers in the evidence (the site's
# ref is profiled). Per-workload pass flags (metrics.beat_spec_workload_passes) exist but carry no values.
import json
KEY = 'verifier/evidence.tar!/metrics.json'
METRICS = ('ema_quantized_png_psnr_db', 'method_process_wall_seconds', 'ordinary_quantized_png_psnr_db')
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    rows = []
    for k in METRICS:
        v = m.get('development_mean_' + k)
        if v is None: continue
        row = dict(metric=k, workload='*', value=v, reference_value=None)
        if k == 'method_process_wall_seconds': row['unit'] = 'seconds'
        rows.append(row)
    return rows
