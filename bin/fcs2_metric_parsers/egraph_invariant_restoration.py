# egg: verifier/evidence.tar!/metrics.json -> metrics.private_timing_evidence.<workload>: wall_clock_seconds =
# candidate_/reference_median_seconds, congruence_seconds = candidate_/reference_median_congruence_seconds (medians over
# 9 paired repetitions). The final suite is DEV + FINAL (6 workloads) and the site's mean is over all 6.
# beat: metrics.beat_spec_workload_passes names workloads workload_1..6 in the evaluator's suite order
# (judge/evaluator.py DEV + FINAL), not by key, so map positions through that order.
import json
KEY = 'verifier/evidence.tar!/metrics.json'
SUITE = ['dev_ematching', 'dev_diff_explanations', 'dev_associative',
         'final_integration', 'final_radical', 'final_factorization']
MAP = {'wall_clock_seconds': 'median_seconds', 'congruence_seconds': 'median_congruence_seconds'}
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    pt = m.get('private_timing_evidence') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for wl, w in pt.items():
        p = passes.get(f'workload_{SUITE.index(wl) + 1}', {}) if wl in SUITE else {}
        for metric, k in MAP.items():
            row = dict(metric=metric, workload=wl, value=w.get('candidate_' + k),
                       reference_value=w.get('reference_' + k), unit='seconds')
            if metric in p: row['beat'] = p[metric]
            rows.append(row)
    return rows
