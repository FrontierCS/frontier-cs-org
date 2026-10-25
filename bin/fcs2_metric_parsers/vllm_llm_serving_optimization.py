import json
# verifier/evidence.tar!/phase/operator-result.json: result.reference_verdict.groups[<group>] for the four
# groups (swe/public, swe/hidden, bfcl/public, bfcl/hidden); one row per group:
#   p90/p95/p99      = candidate_tails[p] vs reference_tails[p]   (request latency tails, seconds)
#   correctness      = candidate_correct / observed_instances vs reference_correct / observed_instances
#   paired_timing    = paired_speedup_over_reference vs 1.0 (reference against itself)
#   beat             = comparisons[metric]
# Site value = plain mean over the 4 groups. (The run's final evidence has no metrics.json; the operator
# result is the only numeric source.) Reference correctness/tails are a fixed envelope from three
# reference runs (reference_values_are_fixed_envelope), identical across model runs.
TAILS = ('p90', 'p95', 'p99')
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/phase/operator-result.json')
    if raw is None: return []
    res = json.loads(raw).get('result') or {}
    groups = (res.get('reference_verdict') or {}).get('groups') or {}
    rows = []
    for g, v in groups.items():
        cmp_ = v.get('comparisons') or {}
        ct, rt = v.get('candidate_tails') or {}, v.get('reference_tails') or {}
        def add(metric, value, ref, unit=None):
            r = dict(metric=metric, workload=g, value=value, reference_value=ref)
            if unit: r['unit'] = unit
            if metric in cmp_: r['beat'] = bool(cmp_[metric])
            rows.append(r)
        for p in TAILS:
            add(p, ct.get(p), rt.get(p), 'seconds')
        n = v.get('observed_instances') or v.get('expected_instances')
        cc, rc = v.get('candidate_correct'), v.get('reference_correct')
        add('correctness', None if cc is None or not n else cc / n, None if rc is None or not n else rc / n)
        sp = v.get('paired_speedup_over_reference')
        add('paired_timing', sp, 1.0 if sp is not None else None)
    return rows
