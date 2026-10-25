import json
# verifier/evidence.tar!/metrics.json: metrics.runtime_evidence[] events with kind='policy evaluation' carry
# report.metrics.{episode_reward,tracking_lin_vel,tracking_ang_vel,energy,action_rate} per workload ('final-0'..'final-14')
# and side 'candidate' / 'reference'; pass flags from metrics.beat_spec_workload_passes. Values keep the evidence's
# sign (energy/action_rate are negative penalties; NEGATE downstream flips them). The candidate means equal
# metrics.development_mean_<name> (misleadingly named; it is the final suite). Fallback when no per-workload events:
# development_mean_<name> as a workload='*' row with no reference.
METRICS = ('episode_reward', 'tracking_lin_vel', 'tracking_ang_vel', 'energy', 'action_rate')
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    vals, order = {}, []
    for e in m.get('runtime_evidence') or []:
        if e.get('kind') != 'policy evaluation' or e.get('side') not in ('candidate', 'reference'): continue
        w = e.get('workload') or (e.get('phase') or '').replace('eval-', '', 1)
        if w not in vals: vals[w] = {}; order.append(w)
        vals[w][e['side']] = (e.get('report') or {}).get('metrics') or {}
    flags = {p.get('workload'): p.get('metrics') or {} for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for k in METRICS:
        if order:
            for w in order:
                c, r = vals[w].get('candidate', {}), vals[w].get('reference', {})
                row = dict(metric=k, workload=w, value=c.get(k), reference_value=r.get(k))
                if k in flags.get(w, {}): row['beat'] = bool(flags[w][k])
                rows.append(row)
        elif m.get('development_mean_' + k) is not None:
            rows.append(dict(metric=k, workload='*', value=m['development_mean_' + k], reference_value=None))
    return rows
