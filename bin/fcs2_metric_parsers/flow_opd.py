import json
# verifier/evidence.tar!/metrics.json: metrics.private_execution_runs[<run>].ocr_rewards[] (one OCR reward per final
# workload, 8 workloads), workload names in order from metrics.beat_spec_workload_passes[].workload.
# The reference is not run in the evidence: each final workload's reference OCR reward is frozen in the task source,
# judge/judge/reference_cache.json workloads[<workload>].ocr_reward (sha256 e57f77b9adb6cc10...5d2785ef), copied here.
# Its mean is the profiled 0.6177 the page showed before.
REFERENCE = {'final-00-0': 1.0, 'final-00-1': 1.0, 'final-01-0': 0.23076923076923073, 'final-01-1': 0.23076923076923073,
             'final-02-0': 0.8235294117647058, 'final-02-1': 0.8235294117647058, 'final-03-0': 0.8333333333333334,
             'final-03-1': 0.0}
def parse(ev):
    k = 'verifier/evidence.tar!/metrics.json'
    if k not in ev: return []
    m = json.loads(ev[k]).get('metrics') or {}
    passes = m.get('beat_spec_workload_passes') or []
    rewards = []
    for run in (m.get('private_execution_runs') or {}).values():
        rewards.extend((run or {}).get('ocr_rewards') or [])
    rows = []
    for i, v in enumerate(rewards):
        p = passes[i] if i < len(passes) else {}
        w = p.get('workload', str(i))
        r = dict(metric='ocr_reward', workload=w, value=v, reference_value=REFERENCE.get(w))
        b = (p.get('metrics') or {}).get('ocr_reward')
        if b is not None: r['beat'] = bool(b)
        rows.append(r)
    return rows
