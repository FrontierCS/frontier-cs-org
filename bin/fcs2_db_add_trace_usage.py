#!/usr/bin/env python3
"""Add the costs of a --trace-usage file (see bin/fcs2_db_from_platform.py) to an existing snapshot database.

usage: python3 bin/fcs2_db_add_trace_usage.py snapshot.db fcs2-trace-usage-recovered-20261022.json
"""
import json, sqlite3, sys

B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
def ulid_seconds(i):
    n = 0
    for ch in i.rsplit('_', 1)[-1][:10].upper(): n = n * 32 + B32.index(ch)
    return n / 1000

db, doc = sqlite3.connect(sys.argv[1]), json.load(open(sys.argv[2]))
for x in doc['runs']:
    r = db.execute('select display_score, elapsed_seconds from runs where id = ?', (x['run_id'],)).fetchone()
    if not r or db.execute('select 1 from score_points where run_id = ? and total_tokens > 0', (x['run_id'],)).fetchone(): continue
    (score, elapsed), usd, start = r, x['estimated_cost_usd'], ulid_seconds(x['run_id'])
    # as fcs2_db_from_platform.py: each development point carries the cost spent by its verification, in micro-dollars
    for sid, in db.execute("select submission_id from score_points where run_id = ? and submission_id != 'final'", (x['run_id'],)).fetchall():
        frac = min(1, max(0, (ulid_seconds(sid) - start) / max(elapsed or 0, 1))) if elapsed else 1
        db.execute('update score_points set total_tokens = ? where run_id = ? and submission_id = ?', (usd * frac * 1e6, x['run_id'], sid))
    if score is not None:
        n, = db.execute('select count(*) from submissions where run_id = ?', (x['run_id'],)).fetchone()
        db.execute('insert into submissions values (?,?,?,?,?)', (x['run_id'], 'final', 'final', 'final:' + x['run_id'], n))
        db.execute('insert into score_points values (?,?,?,?,null)', (x['run_id'], 'final', score, usd * 1e6))
    print(f"{x['task']} {x['model_id']}: US${usd:.2f}")
db.commit()
