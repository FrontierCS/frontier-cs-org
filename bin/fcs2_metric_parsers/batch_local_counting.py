import json
# verifier/evidence.tar!/metrics.json: metrics.beat_spec_workload_passes[] holds only per-workload pass flags
# (exact_counts, batch_latency_seconds) for the 6 graph x pattern-size workloads.
#  - exact_counts: per workload value = 1.0 if the exact-output flag is true else 0.0; reference = 1.0 (the
#    reference output is the correctness target by definition; evaluator validates naive == reference).
#  - batch_latency_seconds: the final evidence has NO per-workload (or reference) seconds; only candidate-only
#    full-suite medians (median_seconds, naive_median_seconds) and score-derived speedups. The site's per-workload
#    means cannot be re-derived exactly (median_seconds/6 is within ~5%), so value/reference are None and only
#    the per-workload beat flags are emitted.
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    rows = []
    for w in m.get('beat_spec_workload_passes', []):
        f = w.get('metrics') or {}
        if 'exact_counts' in f:
            rows.append(dict(metric='exact_counts', workload=w['workload'], value=1.0 if f['exact_counts'] else 0.0,
                             reference_value=1.0, beat=bool(f['exact_counts'])))
        if 'batch_latency_seconds' in f:
            rows.append(dict(metric='batch_latency_seconds', workload=w['workload'], value=None, reference_value=None,
                             beat=bool(f['batch_latency_seconds']), unit='seconds'))
    return rows
