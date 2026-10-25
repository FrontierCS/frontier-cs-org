import json
# verifier/evidence.tar!/metrics.json -> metrics.<metric> scalars only. The final evidence carries NO per-workload numbers
# and NO reference values (only per-workload pass flags in beat_spec_workload_passes), so each metric is one
# workload='*' row with the evidence's own suite mean; reference_value=None (the site's ref is a profiled one).
# relative_polar_factor_error and worst_case_scalar_error are the evidence's means over only the original six cases
# (square_0/1, tall_0/1, wide_0/1; REF_SCOPE in bin/fcs2_metric_means.py); the other three are the evidence's suite
# means (the six original + six paper-regime cases, per the beat spec v3). Per-workload beat flags cannot be attached to
# a '*' row, so they are not emitted.
METRICS = ['polar_cosine_similarity', 'relative_polar_factor_error', 'spectral_polar_error',
           'top_subspace_polar_error', 'worst_case_scalar_error']
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None:
        return []
    m = json.loads(raw).get('metrics') or {}
    return [dict(metric=k, workload='*', value=m[k], reference_value=None)
            for k in METRICS if isinstance(m.get(k), (int, float)) and not isinstance(m.get(k), bool)]
