#!/usr/bin/env python3
import csv
from datetime import datetime, timezone
import json
import math
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import export_results2 as subject

START = '2026-10-01T00:00:00Z'
END = '2026-10-01T00:10:00Z'


class ExportTest(unittest.TestCase):
    def setUp(self):
        self.catalog = patch.dict(subject.TASK_CATALOG, {'task_one': {'label': 'Official task title', 'category': 'systems', 'labels': ['Systems', 'Optimization']}})
        self.catalog.start()
        self.addCleanup(self.catalog.stop)

    def test_score_transport_accepts_only_one_ulp(self):
        score = 93.4485590924286
        adjacent = math.nextafter(score, math.inf)
        self.assertEqual(adjacent, 93.44855909242861)
        for left, right in [(score, score), (score, adjacent), (adjacent, score), (0.0, -0.0)]:
            self.assertTrue(subject.same_score(left, right))
        for other in [math.nextafter(adjacent, math.inf), score + 1e-10, None, True, '93.4485590924286', math.inf, -math.inf, math.nan]:
            self.assertFalse(subject.same_score(score, other))
        for value in [True, False, math.inf, -math.inf, math.nan]:
            self.assertFalse(subject.same_score(value, value))
        row = self.row(m_score=str(score), m_pass_fail='FAIL')
        result = subject.normalize(row, 'm', {'state': 'COMPLETED', 'score': adjacent}, [], None, END)
        self.assertEqual(result['score'], score)
        with self.assertRaisesRegex(ValueError, 'scores disagree'):
            subject.normalize(row, 'm', {'state': 'COMPLETED', 'score': math.nextafter(adjacent, math.inf)}, [], None, END)

    def test_official_title_and_multiple_labels(self):
        metadata = subject.task_metadata('task_one')
        self.assertEqual(metadata['label'], 'Official task title')
        self.assertEqual(metadata['labels'], ['Systems', 'Optimization'])
        with self.assertRaisesRegex(ValueError, 'reviewed official title'):
            subject.task_metadata('unreviewed_snake_case_id')

    def row(self, **extra):
        return {'task': 'task_one', 'category': 'preview/systems', 'm_score': '0', 'm_pass_fail': 'FAIL', 'run_state': 'COMPLETED', **extra}

    def test_zero_is_real_and_unknown_is_not_zero(self):
        result = subject.normalize(self.row(), 'm', {}, None, None, END)
        self.assertEqual(result['score'], 0)
        self.assertEqual(result['verdict'], 'FAIL')
        self.assertIsNone(result['total_tokens'])
        self.assertIsNone(result['submissions'])
        self.assertEqual(result['history'], [])

    def test_train_final_and_submission_count(self):
        events = [
            {'kind': 'VERIFIER_TRAIN_STARTED', 'occurred_at': '2026-10-01T00:01:00Z', 'payload': {'verification_id': 'v1'}},
            {'kind': 'VERIFIER_TRAIN_COMPLETED', 'occurred_at': '2026-10-01T00:02:00Z', 'payload': {'verification_id': 'v1', 'raw_score': 42, 'status': 'success'}},
            {'kind': 'VERIFIER_TRAIN_COMPLETED', 'occurred_at': '2026-10-01T00:02:00Z', 'payload': {'verification_id': 'v1', 'raw_score': 42, 'status': 'success'}},
            {'kind': 'RESULT_ACCEPTED', 'occurred_at': '2026-10-01T00:08:00Z'},
        ]
        usage = [{'at': subject.instant('2026-10-01T00:01:30Z'), 'usage': (10, 5, 15)}, {'at': subject.instant('2026-10-01T00:03:00Z'), 'usage': (20, 5, 25)}]
        result = subject.normalize(self.row(), 'm', {'started_at': START, 'finished_at': END, 'state': 'COMPLETED', 'score': 0}, events, usage, END)
        self.assertEqual(result['submissions'], 2)
        self.assertEqual(result['elapsed_seconds'], 600)
        self.assertEqual(result['history'], [
            {'submission': 1, 'elapsed_seconds': 120, 'total_tokens': 15, 'score': 42, 'phase': 'train'},
            {'submission': 2, 'elapsed_seconds': 480, 'total_tokens': 40, 'score': 0, 'phase': 'final'},
        ])

    def test_missing_final_timestamp_not_invented(self):
        result = subject.normalize(self.row(), 'm', {'started_at': START, 'finished_at': END, 'state': 'COMPLETED', 'score': 0}, [], [], END)
        self.assertIsNone(result['history'][0]['elapsed_seconds'])
        self.assertIsNone(result['history'][0]['total_tokens'])

    def test_unknown_usage_never_partially_summed(self):
        records = [{'at': subject.instant(START), 'usage': (10, 2, 12)}, {'at': subject.instant(END), 'usage': None}]
        self.assertEqual(subject.sum_usage(records), (None, None, None))
        self.assertEqual(subject.sum_usage(records, subject.instant(START)), (10, 2, 12))

    def test_sse_usage_is_cumulative_not_additive(self):
        data = b'data: {"usage":{"prompt_tokens":10,"completion_tokens":2,"total_tokens":12}}\n\ndata: {"usage":{"prompt_tokens":10,"completion_tokens":4,"total_tokens":14}}\n\ndata: [DONE]\n'
        self.assertEqual(subject.parse_usage(data), (10, 4, 14))
        self.assertIsNone(subject.parse_usage(b'data: {"choices":[]}\n'))

    def test_multi_model_and_private_allowlist(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'input.csv'
            row = self.row(run_id='run_PRIVATE', secret='SECRET', task_version_id='INTERNAL')
            with path.open('w') as stream:
                writer = csv.DictWriter(stream, fieldnames=list(row)); writer.writeheader(); writer.writerow(row)
            ledger = []
            result = subject.export([('m', 'Model M', path), ('n', 'Model N', path)], None, {}, END, ledger)
            serialized = json.dumps(result)
            self.assertNotIn('SECRET', serialized)
            self.assertNotIn('run_PRIVATE', serialized)
            self.assertNotIn('INTERNAL', serialized)
            self.assertEqual(len(result['tasks']), 1)
            self.assertEqual(len(result['results']), 0)
            self.assertIsNone(ledger[1]['score'])
            self.assertEqual(ledger[0]['run_id'], 'run_PRIVATE')
            with self.assertRaises(ValueError):
                subject.export([('m', 'M', path), ('m', 'M', path)], None, {}, END)

    def test_corrupt_evidence_rejected_before_parsing(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'private.tar.zst'; path.write_bytes(b'private')
            with self.assertRaisesRegex(ValueError, 'hash mismatch'):
                subject.archive_usage({'private_archive': str(path), 'artifact_sha256': 'sha256:' + '0' * 64})

    def test_invalid_numbers_rejected(self):
        for value in ('nan', 'inf', '-inf', True):
            with self.assertRaises(ValueError):
                subject.number(value)
        with self.assertRaises(ValueError):
            subject.number(-1, integer=True)

    def test_live_csv_mismatch_rejected(self):
        for run in [
            {'state': 'RUNNING', 'score': 0},
            {'state': 'COMPLETED', 'score': 1},
            {'state': 'COMPLETED', 'score': None},
            {'state': 'COMPLETED', 'score': 0, 'verdict': 'PASS'},
        ]:
            with self.subTest(run=run), self.assertRaises(ValueError):
                subject.normalize(self.row(), 'm', run, [], None, END)
        with self.assertRaises(ValueError):
            subject.normalize(self.row(m_score='', m_pass_fail=''), 'm', {'state': 'COMPLETED', 'score': 0}, [], None, END)

    def test_missing_token_timing_stays_unknown(self):
        for session in [{}, {'started_at': START}, {'duration_millis': 100}, {'started_at': START, 'duration_millis': -1}]:
            self.assertIsNone(subject.usage_timestamp(session))
        self.assertEqual(subject.usage_timestamp({'started_at': START, 'duration_millis': 0}), subject.instant(START))
        records = [{'at': None, 'usage': (1, 2, 3)}]
        self.assertEqual(subject.sum_usage(records), (1, 2, 3))
        self.assertEqual(subject.sum_usage(records, subject.instant(END)), (None, None, None))

    @staticmethod
    def response(events, cursor=None):
        response = io.BytesIO(json.dumps(events).encode())
        response.headers = {'x-next-cursor': cursor} if cursor else {}
        return response

    @staticmethod
    def event(sequence):
        return {'id': 'event_' + str(sequence), 'sequence': sequence, 'run_id': 'run_TEST', 'kind': 'RUN_CREATED' if sequence == 1 else 'OTHER'}

    def test_more_than_500_events_are_fetched(self):
        pages = [self.response([self.event(i) for i in range(102, 602)], 'older'), self.response([self.event(i) for i in range(1, 102)])]
        with patch.object(subject.urllib.request, 'urlopen', side_effect=pages) as opened:
            events = subject.fetch_events('http://localhost', 'run_TEST')
        self.assertEqual(len(events), 601)
        self.assertEqual(events[0]['kind'], 'RUN_CREATED')
        self.assertIn('cursor=older', opened.call_args_list[1].args[0])

    def test_duplicate_page_or_cursor_rejected(self):
        for cursor in ('older', 'another'):
            pages = [self.response([self.event(2)], 'older'), self.response([self.event(2)], cursor)]
            with patch.object(subject.urllib.request, 'urlopen', side_effect=pages), self.assertRaisesRegex(ValueError, 'did not advance'):
                subject.fetch_events('http://localhost', 'run_TEST')

    def test_incomplete_events_not_zero_submissions(self):
        for events in ([], [self.event(2)]):
            with patch.object(subject.urllib.request, 'urlopen', return_value=self.response(events)), self.assertRaisesRegex(ValueError, 'incomplete'):
                subject.fetch_events('http://localhost', 'run_TEST')

    def test_publication_gate_excludes_contaminated_results(self):
        row = self.row(run_id='run_TEST', task_version_id='taskver_REAL', verdict_source='management')
        run = {'id': 'run_TEST', 'state': 'COMPLETED', 'outcome': 'SUCCEEDED', 'score': 0, 'verdict': 'FAIL', 'task_version_id': 'taskver_REAL', 'candidate_version_id': 'candidate_REAL', 'evaluation_id': 'eval_REAL'}
        result = subject.normalize(row, 'm', run, [], None, END)
        approval = {'task_id': 'task_one', 'model_id': 'm', 'run_id': 'run_TEST', 'task_version_id': 'taskver_REAL', 'candidate_version_id': 'candidate_REAL', 'evaluation_id': 'eval_REAL'}
        self.assertTrue(subject.publishable(row, result, run, approval, None))
        for dirty in [dict(run, state='RUNNING'), dict(run, outcome='FAILED'), dict(run, id='run_DEBUG'), dict(run, evaluation_id='eval_SMOKE'), dict(run, candidate_version_id='candidate_OTHER'), dict(run, verdict=None)]:
            with self.subTest(dirty=dirty):
                self.assertFalse(subject.publishable(row, result, dirty, approval, None))
        self.assertFalse(subject.publishable(row, result, run, None, None))
        self.assertFalse(subject.publishable(dict(row, verdict_source='guessed'), result, run, approval, None))

    def test_hidden_verdict_requires_bound_verified_proof(self):
        row = self.row(run_id='run_TEST', task_version_id='taskver_REAL', verdict_source='final_verifier_evidence')
        run = {'id': 'run_TEST', 'state': 'COMPLETED', 'outcome': 'SUCCEEDED', 'score': 0, 'verdict': None, 'task_version_id': 'taskver_REAL', 'candidate_version_id': 'candidate_REAL', 'evaluation_id': 'eval_REAL'}
        result = subject.normalize(row, 'm', run, [], None, END)
        approval = {'task_id': 'task_one', 'model_id': 'm', 'run_id': 'run_TEST', 'task_version_id': 'taskver_REAL', 'candidate_version_id': 'candidate_REAL', 'evaluation_id': 'eval_REAL'}
        proof = {'artifact_hash_verified': True, 'id': 'run_TEST', 'mode': 'eval', 'task_version_id': 'taskver_REAL', 'candidate_version_id': 'candidate_REAL', 'raw_score': 0, 'beats_reference': 0}
        self.assertTrue(subject.publishable(row, result, run, approval, proof))
        for key, value in [('artifact_hash_verified', False), ('mode', 'train'), ('id', 'run_OTHER'), ('raw_score', 1), ('beats_reference', 1)]:
            with self.subTest(key=key):
                self.assertFalse(subject.publishable(row, result, run, approval, dict(proof, **{key: value})))

    def test_infrastructure_failure_is_not_scientific_zero(self):
        events = [{'kind': 'VERIFIER_TRAIN_COMPLETED', 'occurred_at': END, 'payload': {'verification_id': 'v1', 'raw_score': 0, 'status': 'failure'}}]
        result = subject.normalize(self.row(m_score='', m_pass_fail='', run_state='RUNNING'), 'm', {}, events, None, END)
        self.assertEqual(result['submissions'], 1)
        self.assertEqual(result['history'], [])


if __name__ == '__main__':
    unittest.main()
