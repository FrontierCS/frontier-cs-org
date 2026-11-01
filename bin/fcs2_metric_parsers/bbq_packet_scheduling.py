import json
# verifier/evidence.tar!/metrics.json: metrics.beat_spec_workload_passes[] (dev_a..d, hidden_0..3, hidden_scale).
# Newer evidence holds each workload's .candidate and .reference values (latency_seconds, throughput_ops_per_second);
# a workload where the candidate produced nothing has an empty .candidate (an invalid workload, value None).
# Older evidence gives only the pass flags: per-workload period_ps is in metrics.resource_diagnostics.{candidate,
# reference}.<wl>.period_ps but cycle counts are not exported, so value/reference_value are None there; the numbers
# then come from a re-run of the stored final (bin/fcs2_metric_replays.jsonl) or the carry file.
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if not raw: return []
    m = json.loads(raw).get('metrics') or {}
    rows = []
    for w in m.get('beat_spec_workload_passes', []):
        c, r = w.get('candidate'), w.get('reference')
        for metric, ok in (w.get('metrics') or {}).items():
            row = dict(metric=metric, workload=w.get('workload'), value=(c or {}).get(metric) if c is not None else None,
                       reference_value=(r or {}).get(metric) if r is not None else None, beat=bool(ok))
            if metric == 'latency_seconds': row['unit'] = 'seconds'
            rows.append(row)
    return rows
