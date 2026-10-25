#!/usr/bin/env python3
"""Per run and metric, on how many hidden workloads the final submission beat the authors' code: assets/js/fcs2-checks.js.

usage: python3 bin/fcs2_checks_from_platform.py platform.db [--api=http://127.0.0.1:18080/api/v1/] [--only='candidate name']

--only fetches one candidate's runs and keeps every other entry of the current files, for a platform that does not hold
the other candidates' runs (see --only in bin/fcs2_db_from_platform.py).

Read-only on the platform API. The runs are the ones in the database bin/fcs2_db_from_platform.py built, so the counts
belong to the same runs as the site's scores; names go through the TASK and MODEL maps of bin/fcs2_runs_from_db.py. The
counts are the run's metrics.private.beat_spec_progress: per metric, workloads passed and workloads in all. A run with
no hidden evaluation (it failed before one) has none.

Models kept off the site (HIDDEN in bin/fcs2_runs_from_db.py, Kimi K2.7) are left out of assets/js/fcs2-checks.js, which
every browser loads, and written to _data/fcs2_checks_hidden.json instead, which Jekyll does not publish (Qiuyang,
2026-10-14). bin/fcs2_runs_from_db.py reads both for its difficulty fit.
"""
import ast, json, pathlib, sqlite3, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = next((a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--api=')), 'http://127.0.0.1:18080/api/v1/')
ONLY = next((a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--only=')), None)
src = ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text())
lit = {}
for n in src.body:   # the first, literal assignment of each (MODEL is narrowed later in that script)
    for t in getattr(n, 'targets', []):
        if isinstance(t, ast.Name) and t.id in ('TASK', 'MODEL', 'HIDDEN') and t.id not in lit: lit[t.id] = ast.literal_eval(n.value)
TASK, MODEL, HIDDEN = lit['TASK'], lit['MODEL'], lit['HIDDEN']
PATH, HIDDEN_PATH = ROOT / 'assets' / 'js' / 'fcs2-checks.js', ROOT / '_data' / 'fcs2_checks_hidden.json'


def write(out):
    """out: {task: {model id: {check key: [beaten, in all]}}}. The models on the site go to assets/js/fcs2-checks.js, the
    hidden ones to _data/fcs2_checks_hidden.json, in the same shape and order."""
    hid = {MODEL[c][0] for c in HIDDEN}
    part = lambda keep: {t: by for t, by in ((t, {m: v for m, v in by.items() if keep(m)}) for t, by in out.items()) if by}
    PATH.write_text('// Written by bin/fcs2_checks_from_platform.py: per task and model, per metric, [hidden workloads on which the final\n'
                    '// submission beat the authors\' code, hidden workloads in all]. Models kept off the site are left out.\n'
                    'const PASSBY = ' + json.dumps(part(lambda m: m not in hid), separators=(',', ':')) + ';\n')
    HIDDEN_PATH.write_text(json.dumps({'note': 'Per-metric counts of models kept off the site (HIDDEN in bin/fcs2_runs_from_db.py), in the shape of '
                                               'PASSBY in assets/js/fcs2-checks.js. For fits only; not shown on any page.',
                                       'models': {MODEL[c][0]: MODEL[c][1] for c in MODEL if c in HIDDEN},
                                       'passby': part(lambda m: m in hid)}, ensure_ascii=False, indent=1) + '\n')


# Counts for runs whose platform record has no metrics, by run: Claude Opus 5.5's KV Compaction is a selected-final rejudge
# (run_01M5C4AXWSCXAY5BBMFQHGZNF5, verification_01M5C4FE21CK8CPD92KG84YVZR) whose evidence keeps only these counts (the
# evaluation monitor, 2026-10-20: 22 of 24 articles beat the reference)
PROGRESS = {'run_01M5BMPCS19PVWJRAGZSF9ED8P': {'compact_cache_bytes': {'passed': 24, 'total': 24},
                                              'compaction_seconds': {'passed': 24, 'total': 24},
                                              'qa_correct': {'passed': 22, 'total': 24}},
            # Gemini 4 Argon's Polygon: its final evaluation failed with a ReferenceFailure; these are the selected-final rejudge's
            'run_01M4YAV50Q717NGG917XBQH5FR': {'refuted_pair': {'passed': 21, 'total': 21},
                                              'wall_time_seconds': {'passed': 19, 'total': 21}}}


def one(cell):
    rid, cand, task = cell
    if cand not in MODEL or task not in TASK: return None
    m = json.load(urllib.request.urlopen(API + 'runs/' + rid, timeout=60)).get('metrics') or {}
    prog = PROGRESS.get(rid) or ((m.get('private') or {}).get('beat_spec_progress')) or {}
    return TASK[task][1] or task.split(' — ')[0], MODEL[cand][0], {k: [v.get('passed', 0), v.get('total', 0)] for k, v in prog.items()}


if __name__ == '__main__':
    db = sqlite3.connect(sys.argv[1])
    cells = db.execute('select ce.run_id, c.name, t.name from cells ce join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id').fetchall()
    out = {}
    if ONLY:   # the current entries, the shown ones then the hidden ones, in their order; this candidate's are replaced
        import re
        shown = json.loads(re.search(r'^const PASSBY = (.*);$', PATH.read_text(), re.M).group(1))
        for part in (shown, json.loads(HIDDEN_PATH.read_text())['passby']):
            for t, by in part.items(): out.setdefault(t, {}).update({m: v for m, v in by.items() if m != MODEL[ONLY][0]})
        cells = [c for c in cells if c[1] == ONLY]
    with ThreadPoolExecutor(8) as ex: got = [g for g in ex.map(one, cells) if g]
    for task, mid, prog in got:
        if prog: out.setdefault(task, {})[mid] = prog
    write(out)
    print(f'{len(got)} runs, {sum(len(v) for v in out.values())} with counts, {len(out)} tasks -> {PATH}, {HIDDEN_PATH}')
