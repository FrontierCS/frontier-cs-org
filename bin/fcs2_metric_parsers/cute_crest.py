# CREST: verifier/evidence.tar!/metrics.json -> metrics.per_workload_comparisons[] (one per final program w0/w1).
# value/ref = candidate_/reference_mean_coverage and candidate_/reference_mean_overhead_seconds (means over 30 seeds);
# margin = coverage_margin_required / overhead_margin_required_seconds; beat from metrics.beat_spec_workload_passes[].metrics.
import json
KEY = 'verifier/evidence.tar!/metrics.json'
def parse(ev):
    if KEY not in ev: return []
    m = json.loads(ev[KEY]).get('metrics') or {}
    passes = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for w in m.get('per_workload_comparisons') or []:
        wl = w.get('workload'); p = passes.get(wl, {})
        rows.append(dict(metric='branches_covered', workload=wl, value=w.get('candidate_mean_coverage'),
                         reference_value=w.get('reference_mean_coverage'), beat=p.get('branches_covered'),
                         margin=w.get('coverage_margin_required')))
        rows.append(dict(metric='search_overhead_seconds', workload=wl, value=w.get('candidate_mean_overhead_seconds'),
                         reference_value=w.get('reference_mean_overhead_seconds'), beat=p.get('search_overhead_seconds'),
                         margin=w.get('overhead_margin_required_seconds'), unit='seconds'))
    return rows
