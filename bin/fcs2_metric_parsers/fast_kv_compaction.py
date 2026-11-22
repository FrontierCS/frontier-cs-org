import json
# verifier/evidence.tar!/metrics.json: paired_workload_metrics.workloads[] (24 QuALITY articles, final)
#   qa_correct          = candidate.correct  vs target.correct   (min over repetitions, questions)
#   compaction_seconds  = candidate.seconds  vs target.seconds   (median wall time, s)
#   compact_cache_bytes = candidate.bytes    vs target.bytes
# beat flags from metrics.beat_spec_workload_passes[].metrics[<metric>].
MAP = {'qa_correct': ('correct', None), 'compaction_seconds': ('seconds', 'seconds'),
       'compact_cache_bytes': ('bytes', 'bytes')}
# the final set: 24 articles, 441 questions in all (paired_workload_metrics.workloads[].candidate.questions of every
# platform record on this dataset)
WORKLOADS, QUESTIONS = 24, 441
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    d = json.loads(ev[k])
    W = (d.get('paired_workload_metrics') or {}).get('workloads') or []
    passes = {p.get('workload'): p.get('metrics', {}) for p in (d.get('metrics') or {}).get('beat_spec_workload_passes') or []}
    rows = []
    M = d.get('metrics') or {}
    if not W and passes and isinstance(M.get('dev_compact_cache_bytes'), list):
        # a Pumpkin record keeps no paired block, only the final workloads' candidate values (sorted, dev_*) and the
        # accuracy over all their questions: the run's means as '*' rows (qa_correct = accuracy x QUESTIONS / workloads,
        # the mean correct count), no reference in the run, and each workload's beat flag without a value
        n = len(passes)
        lists = {'compact_cache_bytes': M.get('dev_compact_cache_bytes'), 'compaction_seconds': M.get('dev_compaction_seconds')}
        for metric, (f, unit) in MAP.items():
            vs = lists.get(metric)
            v = (sum(vs) / len(vs) if vs and len(vs) == n else None) if metric != 'qa_correct' else \
                (M['dev_qa_accuracy'] * QUESTIONS / n if M.get('dev_qa_accuracy') is not None and n == WORKLOADS else None)
            if v is not None: rows.append(dict(metric=metric, workload='*', value=v, reference_value=None) | ({'unit': unit} if unit else {}))
            for wl, fl in passes.items():
                if metric in fl: rows.append(dict(metric=metric, workload=str(wl), value=None, reference_value=None, beat=bool(fl[metric])) | ({'unit': unit} if unit else {}))
        return rows
    for w in W:
        c, t, wl = w.get('candidate') or {}, w.get('target') or {}, str(w.get('workload'))
        for metric, (f, unit) in MAP.items():
            r = dict(metric=metric, workload=wl, value=c.get(f), reference_value=t.get(f))
            if unit: r['unit'] = unit
            b = passes.get(wl, {}).get(metric)
            if b is not None: r['beat'] = bool(b)
            rows.append(r)
    return rows
