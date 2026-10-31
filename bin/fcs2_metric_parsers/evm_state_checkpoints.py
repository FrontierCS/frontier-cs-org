# Spectrum: verifier/evidence.tar!/metrics.json.
# Evidence with metrics.workload_values[<workload>] (every final workload: the Spectrum workloads and checkpoint-micro
# per seed): .candidate and .reference hold throughput, create_ns, restore_ns and retained_bytes, the values each
# workload's decision compares (beat from metrics.beat_spec_workload_passes) -> one row per workload and metric.
# These are not the run-level metrics.committed_tps (a geometric mean over the Spectrum workloads) or
# metrics.checkpoint_* / retained_bytes_per_checkpoint (the checkpoint-micro profile); the site's mean is the arithmetic
# mean over the workloads, as for every task.
# Evidence without workload_values keeps one aggregate per metric (metrics.committed_tps, checkpoint_create_ns,
# checkpoint_restore_ns, retained_bytes_per_checkpoint) -> workload='*' rows, no reference (the site's ref is profiled).
# Correctness is run-level only (metrics.correct) -> a workload='*' row in every case.
# A failed run has only diagnostics/failure.json -> [].
import json
KEY = 'verifier/evidence.tar!/metrics.json'
MAP = {'committed_tps': 'committed_tps', 'checkpoint_create_ns': 'checkpoint_create_ns',
       'checkpoint_restore_ns': 'checkpoint_restore_ns', 'retained_bytes_per_checkpoint': 'retained_bytes_per_checkpoint'}
WORKLOAD_FIELD = {'committed_tps': 'throughput', 'checkpoint_create_ns': 'create_ns', 'checkpoint_restore_ns': 'restore_ns',
                  'retained_bytes_per_checkpoint': 'retained_bytes'}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    rows = []
    wv = m.get('workload_values')
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    if wv:
        for w, x in wv.items():
            c, r = x.get('candidate') or {}, x.get('reference') or {}
            for metric, f in WORKLOAD_FIELD.items():
                row = dict(metric=metric, workload=w, value=c.get(f), reference_value=r.get(f))
                if metric in passes.get(w, {}): row['beat'] = bool(passes[w][metric])
                rows.append(row)
    else:
        rows = [dict(metric=metric, workload='*', value=m[k], reference_value=None)
                for metric, k in MAP.items() if m.get(k) is not None]
    if m.get('correct') is not None:
        rows.append(dict(metric='correctness', workload='*', value=m['correct'], reference_value=None))
    return rows
