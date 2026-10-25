import json
# verifier/evidence.tar!/metrics.json: paired_workload_metrics.workloads[] (24 QuALITY articles, final)
#   qa_correct          = candidate.correct  vs target.correct   (min over repetitions, questions)
#   compaction_seconds  = candidate.seconds  vs target.seconds   (median wall time, s)
#   compact_cache_bytes = candidate.bytes    vs target.bytes
# beat flags from metrics.beat_spec_workload_passes[].metrics[<metric>].
MAP = {'qa_correct': ('correct', None), 'compaction_seconds': ('seconds', 'seconds'),
       'compact_cache_bytes': ('bytes', 'bytes')}
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    d = json.loads(ev[k])
    W = (d.get('paired_workload_metrics') or {}).get('workloads') or []
    passes = {p.get('workload'): p.get('metrics', {}) for p in (d.get('metrics') or {}).get('beat_spec_workload_passes') or []}
    rows = []
    for w in W:
        c, t, wl = w.get('candidate') or {}, w.get('target') or {}, str(w.get('workload'))
        for metric, (f, unit) in MAP.items():
            r = dict(metric=metric, workload=wl, value=c.get(f), reference_value=t.get(f))
            if unit: r['unit'] = unit
            b = passes.get(wl, {}).get(metric)
            if b is not None: r['beat'] = bool(b)
            rows.append(r)
    return rows
