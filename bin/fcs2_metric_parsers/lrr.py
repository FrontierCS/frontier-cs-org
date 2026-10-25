import json
# verifier/evidence.tar!/metrics.json: the evaluator stores only item-count-weighted aggregates of the candidate over
# the final workloads (judge/evaluator.py: weighted[name] = sum(cand[w][name]*len(items_w))/total) under the (misleading)
# keys train_<rate> / train_mean_<metric>, even in eval mode. Per-workload candidate values and ALL reference metric
# values are absent (only reference_score), so we emit one workload='*' row per metric with reference_value=None,
# plus per-workload rows (value/reference None) carrying the pass flags from metrics.beat_spec_workload_passes when present.
KEYS = {'vulnerability_elimination_rate': 'train_vulnerability_elimination_rate', 'repair_rate': 'train_repair_rate',
        'well_formed_rate': 'train_well_formed_rate', 'rli': 'train_mean_rli', 'nls': 'train_mean_nls',
        'jaccard': 'train_mean_jaccard', 'precision': 'train_mean_precision', 'recall': 'train_mean_recall'}
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    rows = []
    for k, src in KEYS.items():
        if src not in m: continue
        for p in m.get('beat_spec_workload_passes') or []:
            f = p.get('metrics') or {}
            if k in f:
                rows.append(dict(metric=k, workload=p.get('workload'), value=None, reference_value=None, beat=bool(f[k])))
        rows.append(dict(metric=k, workload='*', value=m[src], reference_value=None))
    return rows
