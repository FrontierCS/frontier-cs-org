import json
# verifier/evidence.tar!/metrics.json: metrics.private_execution_runs[<run>].ocr_rewards[] (one OCR reward per final
# workload, 8 workloads), workload names in order from metrics.beat_spec_workload_passes[].workload.
# The reference is not run in the evidence: the site's ref is profiled (metrics.reference_score/100 is that profile
# mean, 0.6177), so per-run reference_value is None.
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
        r = dict(metric='ocr_reward', workload=p.get('workload', str(i)), value=v, reference_value=None)
        b = (p.get('metrics') or {}).get('ocr_reward')
        if b is not None: r['beat'] = bool(b)
        rows.append(r)
    return rows
