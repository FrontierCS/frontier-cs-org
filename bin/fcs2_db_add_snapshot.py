#!/usr/bin/env python3
"""Add the candidates of one snapshot database to another: base.db gains every row of add.db.

usage: python3 bin/fcs2_db_add_snapshot.py base.db add.db

For a platform that holds only some evaluations (2026-10-25: DeepSeek V4.1 Flash 1017 ran on a new platform; the first 13
models' runs are rebuilt by bin/fcs2_db_from_release.py): build add.db with bin/fcs2_db_from_platform.py --only=<candidate>,
then add it here. Its tasks are matched to base.db's by name, else by the converter's short name (the platforms name some
tasks differently, and the release's task ids differ from the platform's); a task base.db lacks is added. Candidates are
appended in add.db's order. The release time becomes the later of the two. A candidate already in base.db stops the script.
"""
import ast, pathlib, sqlite3, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TASK = next(ast.literal_eval(n.value) for n in ast.parse((ROOT / 'bin' / 'fcs2_runs_from_db.py').read_text()).body
            for t in getattr(n, 'targets', []) if isinstance(t, ast.Name) and t.id == 'TASK')
short = lambda t: TASK[t][1] or t.split(' — ')[0]
db = sqlite3.connect(sys.argv[1])
db.execute('attach ? as a', (sys.argv[2],))
old = {c for c, in db.execute('select name from main.candidates')}
new = [c for c, in db.execute('select name from a.candidates order by ordinal')]
assert not old & set(new), f'already in {sys.argv[1]}: {sorted(old & set(new))}'
base = {name: tid for tid, name in db.execute('select id, name from main.tasks')}
by_short = {short(n): tid for n, tid in base.items()}
tid, added = {}, []
for t, name in db.execute('select id, name from a.tasks').fetchall():
    tid[t] = base.get(name) or by_short.get(short(name))
    if tid[t] is None:   # a task base.db lacks
        tid[t] = t; added.append(name); db.execute('insert into main.tasks values (?,?,0)', (t, name))
for n, (tt, name) in enumerate(sorted(db.execute('select id, name from main.tasks').fetchall(), key=lambda kv: kv[1])):
    db.execute('update main.tasks set ordinal = ? where id = ?', (n, tt))   # by name, as bin/fcs2_db_from_platform.py orders them
k, = db.execute('select count(*) from main.candidates').fetchone()
for n, c in enumerate(new): db.execute('insert into main.candidates values (?,?,?)', (c, c, k + n))
db.executemany('insert into main.cells values (?,?,?)', [(r, c, tid[t]) for r, c, t in db.execute('select * from a.cells').fetchall()])
for table in ('runs', 'submissions', 'score_points'): db.execute(f'insert into main.{table} select * from a.{table}')
later = max(g for g, in db.execute('select generated_at from main.release union select generated_at from a.release'))
db.execute('update main.release set generated_at = ?', (later,))
db.commit()
print(f'added {", ".join(new)}: {db.execute("select count(*) from a.cells").fetchone()[0]} runs; '
      f'new tasks: {added or "none"}; generated {later} -> {sys.argv[1]}')
