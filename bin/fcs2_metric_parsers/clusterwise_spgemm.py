"""Clusterwise SpGEMM. verifier/evidence.tar!/metrics.json: metrics.private_workload_measurements[] (8 workloads), each
with candidate_ms, reference_ms and flop; execution_time_ms = candidate_ms / reference_ms, throughput_mflops =
flop / ms / 1000 (the beat_spec's definition); beat from metrics.beat_spec_workload_passes."""
import json
def parse(ev):
    s = ev.get('verifier/evidence.tar!/metrics.json')
    if not s: return []
    m = json.loads(s).get('metrics') or {}
    beat = {p['workload']: p.get('metrics', {}) for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for w in m.get('private_workload_measurements') or []:
        c, r, f, b = w['candidate_ms'], w['reference_ms'], w['flop'], beat.get(w['workload'], {})
        rows.append(dict(metric='execution_time_ms', workload=w['workload'], value=c, reference_value=r, beat=b.get('execution_time_ms')))
        rows.append(dict(metric='throughput_mflops', workload=w['workload'], value=f / c / 1000, reference_value=f / r / 1000, beat=b.get('throughput_mflops')))
    return rows
