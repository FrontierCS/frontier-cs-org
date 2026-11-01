import json
# verifier/evidence.tar!/metrics.json: metrics.paired_measurements[] per trace workload:
#   br_mis_pki = candidate (= misp_br*1000/instr); reference = reference_misp_br*1000/reference_instr
#   cyc_wp_pki = candidate (= cyc_wp*1000/instr); reference = reference_cyc_wp*1000/reference_instr
# (means equal metrics.final_*_mean / reference_final_*_mean). beat from metrics.beat_spec_workload_passes.
# logical_storage_bits is one per-predictor number (metrics.logical_storage_bits), emitted as '*'. Its reference is the
# task source's constant judge/source_policy.py REFERENCE_BITS (the original allocation, 1570890 bits); the pass rule
# for this metric is the fixed cap 1572864 bits (CAP_BITS), not a comparison with the reference.
REFERENCE_BITS = 1570890
def _pki(num, den):
    return None if num is None or not den else num * 1000.0 / den
def parse(ev):
    raw = ev.get('verifier/evidence.tar!/metrics.json')
    if raw is None: return []
    m = json.loads(raw).get('metrics') or {}
    passes = {p['workload']: p.get('metrics', {}) for p in m.get('beat_spec_workload_passes') or []}
    rows = []
    for w in m.get('paired_measurements') or []:
        name = w.get('workload')
        for k, num in (('br_mis_pki', 'misp_br'), ('cyc_wp_pki', 'cyc_wp')):
            v = w.get(k)
            if v is None: v = _pki(w.get(num), w.get('instr'))
            r = dict(metric=k, workload=name, value=v,
                     reference_value=_pki(w.get('reference_' + num), w.get('reference_instr')))
            if k in passes.get(name, {}): r['beat'] = bool(passes[name][k])
            rows.append(r)
    if m.get('logical_storage_bits') is not None:
        rows.append(dict(metric='logical_storage_bits', workload='*', value=m['logical_storage_bits'],
                         reference_value=REFERENCE_BITS, unit='bits'))
    return rows
