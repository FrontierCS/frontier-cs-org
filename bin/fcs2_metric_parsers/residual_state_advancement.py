import json
# verifier/evidence.tar!/metrics.json: metrics.workload_measurements[] with
#   candidate_/reference_ {elapsed_seconds, residual_update_seconds} (median of 4 paired reps) and
#   candidate_rmse_error (max over reps; no reference rmse in evidence -> live ref is profiled).
# beat from metrics.beat_spec_workload_passes.
# The live site does NOT show the per-workload mean as the candidate value for elapsed_seconds and
# rmse_error: it shows the run's top-level metrics.elapsed_seconds (evaluator score aggregate = SUM over
# workloads of the min of the scoring repetitions) and metrics.rmse_error (MAX over workloads), while the
# elapsed_seconds reference is the mean of per-workload reference medians. To reproduce the live cells we
# emit '*' rows for those two metrics: value = top-level aggregate, reference = per-workload mean (elapsed)
# / None (rmse). Note the elapsed_seconds value/ref pair is therefore sum-vs-mean (not comparable).
# Per-workload rows are emitted for all three metrics (with beat flags); for elapsed/rmse the '*' row
# takes precedence in the harness. ds1017 final evidence is diagnostics/failure.json only -> [].
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None: return []
    m = json.loads(raw).get('metrics') or {}
    W = m.get('workload_measurements') or []
    passes = {p['workload']: p.get('metrics', {}) for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for w in W:
        name = w.get('workload')
        for k in ('elapsed_seconds', 'residual_update_seconds', 'rmse_error'):
            r = dict(metric=k, workload=name, value=w.get('candidate_' + k),
                     reference_value=w.get('reference_' + k), unit='seconds' if k != 'rmse_error' else None)
            if r['unit'] is None: del r['unit']
            if k in passes.get(name, {}): r['beat'] = bool(passes[name][k])
            rows.append(r)
    refs = [w['reference_elapsed_seconds'] for w in W if w.get('reference_elapsed_seconds') is not None]
    if m.get('elapsed_seconds') is not None:
        rows.insert(0, dict(metric='elapsed_seconds', workload='*', value=m['elapsed_seconds'],
                            reference_value=sum(refs) / len(refs) if refs else None, unit='seconds'))
    if m.get('rmse_error') is not None:
        rows.insert(0, dict(metric='rmse_error', workload='*', value=m['rmse_error'], reference_value=None))
    return rows
