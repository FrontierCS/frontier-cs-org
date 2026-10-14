#!/usr/bin/env python3
"""Per run and metric, on how many hidden workloads the final submission beat the authors' code: assets/js/fcs2-checks.js.

usage: python3 bin/fcs2_checks_from_platform.py platform.db [--api=http://127.0.0.1:18080/api/v1/]

Read-only on the platform API. The runs are the ones in the database bin/fcs2_db_from_platform.py built, so the counts
belong to the same runs as the site's scores; names go through the TASK and MODEL maps of bin/fcs2_runs_from_db.py. The
counts are the run's metrics.private.beat_spec_progress: per metric, workloads passed and workloads in all. A run with
no hidden evaluation (it failed before one) has none.
"""
import ast, json, pathlib, sqlite3, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
API = next((a.split('=', 1)[1] for a in sys.argv[2:] if a.startswith('--api=')), 'http://127.0.0.1:18080/api/v1/')
src = ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text())
lit = {}
for n in src.body:   # the first, literal assignment of each (MODEL is narrowed later in that script)
    for t in getattr(n, 'targets', []):
        if isinstance(t, ast.Name) and t.id in ('TASK', 'MODEL') and t.id not in lit: lit[t.id] = ast.literal_eval(n.value)
TASK, MODEL = lit['TASK'], lit['MODEL']

db = sqlite3.connect(sys.argv[1])
cells = db.execute('select ce.run_id, c.name, t.name from cells ce join candidates c on c.id = ce.candidate_id join tasks t on t.id = ce.task_id').fetchall()

def one(cell):
    rid, cand, task = cell
    if cand not in MODEL or task not in TASK: return None
    m = json.load(urllib.request.urlopen(API + 'runs/' + rid, timeout=60)).get('metrics') or {}
    prog = ((m.get('private') or {}).get('beat_spec_progress')) or {}
    return TASK[task][1] or task.split(' — ')[0], MODEL[cand][0], {k: [v.get('passed', 0), v.get('total', 0)] for k, v in prog.items()}

with ThreadPoolExecutor(8) as ex: got = [g for g in ex.map(one, cells) if g]
out = {}
for task, mid, prog in got:
    if prog: out.setdefault(task, {})[mid] = prog
path = ROOT / 'assets' / 'js' / 'fcs2-checks.js'
path.write_text('// Written by bin/fcs2_checks_from_platform.py: per task and model, per metric, [hidden workloads on which the final\n'
                '// submission beat the authors\' code, hidden workloads in all].\nconst PASSBY = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print(f'{len(got)} runs, {sum(len(v) for v in out.values())} with counts, {len(out)} tasks -> {path}')
