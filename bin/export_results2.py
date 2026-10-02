#!/usr/bin/env python3
"""Export a public, normalized results snapshot from private campaign CSVs.

Repeat --model ID LABEL CSV for each model. CSV columns may be score/verdict or
<ID>_score/<ID>_pass_fail. --evidence-index accepts a private JSON mapping run IDs
to {private_archive, artifact_sha256}; archive hashes are checked before parsing.
The API is read-only. No endpoint, run ID, archive path, or raw model text is
copied to the public output. Missing measurements remain null.
"""
import argparse
import csv
from datetime import datetime, timezone, timedelta
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tarfile
import urllib.request
import urllib.parse


def number(value, integer=False):
    if value in (None, ''):
        return None
    if isinstance(value, bool):
        raise ValueError('Boolean is not a measurement')
    result = float(value)
    if not math.isfinite(result):
        raise ValueError('Measurement must be finite')
    if integer and (result < 0 or not result.is_integer()):
        raise ValueError('Count must be a nonnegative integer')
    return int(result) if integer else result


def instant(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')) if value else None


def seconds(start, end):
    return max(0, (instant(end) - instant(start)).total_seconds()) if start and end else None


def parse_usage(response):
    """Usage is cumulative within one response; take its last usage object."""
    objects = []
    try:
        objects.append(json.loads(response))
    except (ValueError, UnicodeDecodeError):
        for line in response.splitlines():
            if line.startswith(b'data:'):
                try:
                    objects.append(json.loads(line[5:].strip()))
                except (ValueError, UnicodeDecodeError):
                    pass
    found = None
    for obj in objects:
        usage = obj.get('usage') if isinstance(obj, dict) else None
        if not isinstance(usage, dict):
            continue
        inp = number(usage.get('prompt_tokens', usage.get('input_tokens')), True)
        out = number(usage.get('completion_tokens', usage.get('output_tokens')), True)
        total = number(usage.get('total_tokens'), True)
        if total is None and inp is not None and out is not None:
            total = inp + out
        if total is not None:
            found = (inp, out, total)
    return found


def usage_timestamp(session):
    started = instant(session.get('started_at'))
    duration = number(session.get('duration_millis'))
    if started is None or duration is None or duration < 0:
        return None
    return started + timedelta(milliseconds=duration)


def archive_usage(evidence):
    if not evidence:
        return None
    path = Path(evidence['private_archive'])
    expected = evidence['artifact_sha256'].removeprefix('sha256:')
    with path.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != expected:
            raise ValueError('Evidence archive hash mismatch')
    sessions, responses = {}, {}
    with subprocess.Popen(['zstd', '-dc', str(path)], stdout=subprocess.PIPE) as proc:
        with tarfile.open(fileobj=proc.stdout, mode='r|') as archive:
            for member in archive:
                match = re.fullmatch(r'models/[^/]+/traffic/([^/]+)\.(session\.json|response\.bin)', member.name)
                if not match or not member.isfile():
                    continue
                key = member.name.rsplit('.', 2)[0]
                data = archive.extractfile(member).read()
                if match[2] == 'session.json':
                    sessions[key] = json.loads(data)
                else:
                    responses[key] = parse_usage(data)
        if proc.wait() != 0:
            raise ValueError('Evidence decompression failed')
    records = []
    for key, session in sessions.items():
        # A response lacking usage makes totals unknown rather than undercounted.
        usage = responses.get(key)
        records.append({'at': usage_timestamp(session), 'usage': usage})
    if not sessions or set(responses) != set(sessions):
        return None
    return records


def sum_usage(records, until=None):
    if records is None:
        return (None, None, None)
    selected = []
    for record in records:
        if until is not None:
            if record['at'] is None:
                return (None, None, None)
            if record['at'] > until:
                continue
        if record['usage'] is None:
            return (None, None, None)
        selected.append(record['usage'])
    return tuple(sum(u[i] for u in selected) if all(u[i] is not None for u in selected) else None for i in range(3))


def normalize(row, model_id, run, events, usage, observed_at):
    score = number(row.get(model_id + '_score', row.get('score')))
    verdict = row.get(model_id + '_pass_fail', row.get('verdict'))
    verdict = verdict if verdict in ('PASS', 'FAIL') else None
    state = run.get('state', row.get('run_state', 'QUEUED'))
    if score is not None and row.get('run_state') != 'COMPLETED':
        raise ValueError('CSV score belongs to a non-completed run')
    if verdict is not None and score is None:
        raise ValueError('CSV verdict has no final score')
    if run:
        if row.get('run_state') != state:
            raise ValueError('CSV/live run states disagree; refresh the private ledger')
        live_score = number(run.get('score'))
        if ((score is None) != (live_score is None) or
                (score is not None and (state != 'COMPLETED' or not math.isclose(score, live_score, rel_tol=1e-12, abs_tol=1e-12)))):
            raise ValueError('CSV/live final scores disagree; refresh the private ledger')
        if run.get('verdict') in ('PASS', 'FAIL') and verdict != run['verdict']:
            raise ValueError('CSV/live final verdicts disagree')
    status = ('completed' if state == 'COMPLETED' else 'failed' if state in ('FAILED', 'CANCELLED', 'TIMED_OUT') else 'pending' if state == 'QUEUED' else 'running')
    start = run.get('started_at')
    finish = run.get('finished_at')
    history, submissions = [], None
    if events is not None:
        # Count distinct verifier requests, not model calls or infrastructure retries.
        started = {}
        for event in events:
            if event.get('kind') in ('VERIFIER_TRAIN_STARTED', 'VERIFIER_TRAIN_COMPLETED'):
                key = event.get('payload', {}).get('verification_id')
                if key:
                    started.setdefault(key, event.get('occurred_at', ''))
        order = {key: i + 1 for i, (key, _) in enumerate(sorted(started.items(), key=lambda item: item[1]))}
        seen = set()
        for event in sorted(events, key=lambda item: item.get('occurred_at', '')):
            payload = event.get('payload', {})
            key = payload.get('verification_id')
            if event.get('kind') != 'VERIFIER_TRAIN_COMPLETED' or key in seen or key not in order:
                continue
            seen.add(key)
            value = number(payload.get('raw_score'))
            if value is not None and payload.get('status') == 'success':
                at = event.get('occurred_at')
                history.append({'submission': order[key], 'elapsed_seconds': seconds(start, at), 'total_tokens': sum_usage(usage, instant(at))[2], 'score': value, 'phase': 'train'})
        submissions = len(order)
        if score is not None and state == 'COMPLETED':
            submissions += 1
            accepted = next((e.get('occurred_at') for e in events if e.get('kind') == 'RESULT_ACCEPTED'), None)
            history.append({'submission': submissions, 'elapsed_seconds': seconds(start, accepted), 'total_tokens': sum_usage(usage, instant(accepted))[2] if accepted else None, 'score': score, 'phase': 'final'})
    inp, out, total = sum_usage(usage)
    return {'task_id': row['task'], 'model_id': model_id, 'score': score, 'verdict': verdict, 'status': status, 'input_tokens': inp, 'output_tokens': out, 'total_tokens': total, 'elapsed_seconds': seconds(start, finish or (observed_at if status == 'running' else None)), 'submissions': submissions, 'history': history}


def fetch(base, run_id, suffix=''):
    if not re.fullmatch(r'run_[A-Za-z0-9]+', run_id):
        raise ValueError('Invalid run ID')
    with urllib.request.urlopen(base.rstrip('/') + '/api/v1/runs/' + run_id + suffix, timeout=30) as response:
        return json.load(response)


def fetch_events(base, run_id):
    if not re.fullmatch(r'run_[A-Za-z0-9]+', run_id):
        raise ValueError('Invalid run ID')
    events, cursors, cursor = {}, set(), None
    while True:
        query = {'limit': 500}
        if cursor:
            query['cursor'] = cursor
        url = base.rstrip('/') + '/api/v1/runs/' + run_id + '/events?' + urllib.parse.urlencode(query)
        with urllib.request.urlopen(url, timeout=30) as response:
            page = json.load(response)
            cursor = response.headers.get('x-next-cursor')
        if not isinstance(page, list):
            raise ValueError('Unexpected event page')
        prior_count = len(events)
        for event in page:
            if event.get('run_id') != run_id or not event.get('id'):
                raise ValueError('Unexpected event identity')
            if event['id'] in events and events[event['id']] != event:
                raise ValueError('Conflicting event identity')
            events[event['id']] = event
        if page and prior_count == len(events):
            raise ValueError('Event pagination did not advance')
        if not cursor:
            break
        if cursor in cursors or not page:
            raise ValueError('Event pagination did not advance')
        cursors.add(cursor)
    if not any(e.get('kind') == 'RUN_CREATED' for e in events.values()):
        raise ValueError('Event history is incomplete; cannot count submissions')
    return sorted(events.values(), key=lambda event: event['sequence'])


def publishable(row, result, run, approval, proof):
    if not approval or run.get('state') != 'COMPLETED' or run.get('outcome') != 'SUCCEEDED':
        return False
    if result['score'] is None or result['verdict'] not in ('PASS', 'FAIL'):
        return False
    if run.get('id') != row.get('run_id'):
        return False
    expected = {'task_id': row['task'], 'model_id': result['model_id'],
                'run_id': row.get('run_id'), 'candidate_version_id': run.get('candidate_version_id'),
                'task_version_id': run.get('task_version_id'), 'evaluation_id': run.get('evaluation_id')}
    if any(not value or approval.get(key) != value for key, value in expected.items()):
        return False
    if row.get('task_version_id') != run.get('task_version_id'):
        return False
    if row.get('verdict_source') == 'management':
        return run.get('verdict') == result['verdict']
    if row.get('verdict_source') != 'final_verifier_evidence' or not proof:
        return False
    if (proof.get('artifact_hash_verified') is not True or proof.get('id') != run.get('id')
            or proof.get('mode') != 'eval' or proof.get('task_version_id') != run.get('task_version_id')
            or proof.get('candidate_version_id') != run.get('candidate_version_id')):
        return False
    raw = number(proof.get('raw_score'))
    beat = proof.get('beats_reference')
    return (raw is not None and math.isclose(raw, result['score'], rel_tol=1e-12, abs_tol=1e-12)
            and beat in (0, 1) and result['verdict'] == ('PASS' if beat == 1 else 'FAIL'))


def export(specs, base, evidence, observed_at, private_rows=None, publication=None):
    models, tasks, results, seen = [], {}, [], set()
    for model_id, label, csv_path in specs:
        if not re.fullmatch(r'[a-zA-Z0-9_-]+', model_id) or model_id in seen:
            raise ValueError('Model IDs must be unique simple identifiers')
        seen.add(model_id)
        models.append({'id': model_id, 'label': label})
        model_tasks = set()
        with open(csv_path, newline='') as stream:
            for row in csv.DictReader(stream):
                task_id = row['task']
                if task_id in model_tasks:
                    raise ValueError('Duplicate task/model pair')
                model_tasks.add(task_id)
                run_id = row.get('run_id')
                run = fetch(base, run_id) if base and run_id else {}
                events = fetch_events(base, run_id) if base and run_id else None
                task = {'id': task_id, 'label': run.get('task_name') or row.get('label') or task_id.replace('_', ' ').title(), 'category': row['category'].rsplit('/', 1)[-1]}
                if task_id in tasks and tasks[task_id]['category'] != task['category']:
                    raise ValueError('Conflicting task category')
                tasks.setdefault(task_id, task)
                proof = evidence.get(run_id)
                if proof and base and run_id:
                    artifacts = [a for a in fetch(base, run_id, '/artifacts') if a.get('kind') == 'platform-evidence']
                    if len(artifacts) != 1 or artifacts[0].get('sha256') != proof.get('artifact_sha256'):
                        raise ValueError('Archive does not match the accepted run artifact')
                result = normalize(row, model_id, run, events, archive_usage(proof), observed_at)
                if publishable(row, result, run, (publication or {}).get(run_id), proof):
                    results.append(result)
                if private_rows is not None:
                    private_rows.append({**{k: v for k, v in result.items() if k != 'history'}, 'run_id': run_id, 'task_version_id': row.get('task_version_id'), 'source_commit': row.get('source_commit'), 'replaces_run_id': row.get('replaces_run_id'), 'observed_at': observed_at})
    return {'schema_version': 1, 'updated_at': observed_at, 'models': models, 'tasks': list(tasks.values()), 'results': results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', nargs=3, action='append', required=True, metavar=('ID', 'LABEL', 'CSV'))
    parser.add_argument('--api-base', default=None, help='Optional private Management endpoint; read-only GETs')
    parser.add_argument('--evidence-index', type=Path)
    parser.add_argument('--publication-index', required=True, type=Path, help='Private reviewed campaign binding allowlist; never publish this file')
    parser.add_argument('--output', type=Path, default=Path('assets/data/results2.json'))
    parser.add_argument('--private-csv', type=Path, help='Optional normalized private ledger; keep outside website repository')
    args = parser.parse_args()
    evidence = json.loads(args.evidence_index.read_text()) if args.evidence_index else {}
    publication = json.loads(args.publication_index.read_text())
    private_rows = []
    result = export(args.model, args.api_base, evidence, datetime.now(timezone.utc).isoformat(), private_rows, publication)
    if args.private_csv:
        args.private_csv.parent.mkdir(parents=True, exist_ok=True)
        with os.fdopen(os.open(args.private_csv, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            writer = csv.DictWriter(stream, fieldnames=list(private_rows[0]) if private_rows else ['task_id', 'model_id', 'run_id'])
            writer.writeheader()
            writer.writerows(private_rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp = args.output.with_suffix('.json.tmp')
    temp.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    temp.replace(args.output)
    print(f'Exported {len(result["results"])} task/model results')


if __name__ == '__main__':
    main()
