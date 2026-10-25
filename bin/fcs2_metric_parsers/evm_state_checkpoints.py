# Spectrum: verifier/evidence.tar!/metrics.json keeps only one aggregate per metric over the 3 final workloads
# (metrics.committed_tps, checkpoint_create_ns, checkpoint_restore_ns, retained_bytes_per_checkpoint; correctness =
# metrics.correct), no per-workload values and no reference values (the site's ref is profiled) -> workload='*' rows.
# Per-workload pass flags exist (metrics.beat_spec_workload_passes) but carry no numbers.
# A failed run has only diagnostics/failure.json -> [].
import json
KEY = 'verifier/evidence.tar!/metrics.json'
MAP = {'committed_tps': 'committed_tps', 'checkpoint_create_ns': 'checkpoint_create_ns',
       'checkpoint_restore_ns': 'checkpoint_restore_ns', 'retained_bytes_per_checkpoint': 'retained_bytes_per_checkpoint',
       'correctness': 'correct'}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    return [dict(metric=metric, workload='*', value=m[k], reference_value=None)
            for metric, k in MAP.items() if m.get(k) is not None]
