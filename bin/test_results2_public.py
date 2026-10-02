"""Validate the exact public artifact, including its privacy boundary."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PublicSnapshotTests(unittest.TestCase):
    def test_snapshot_is_allowlisted_and_normalized(self):
        raw = (ROOT / 'assets/data/results2.json').read_text()
        data = json.loads(raw)
        self.assertEqual(set(data), {'schema_version', 'updated_at', 'models', 'tasks', 'results'})
        self.assertEqual(data['schema_version'], 1)
        models, tasks, pairs = set(), set(), set()
        for model in data['models']:
            self.assertEqual(set(model), {'id', 'label'})
            self.assertNotIn(model['id'], models)
            models.add(model['id'])
        for task in data['tasks']:
            self.assertEqual(set(task), {'id', 'label', 'category'})
            self.assertNotIn(task['id'], tasks)
            tasks.add(task['id'])
        for result in data['results']:
            self.assertEqual(set(result), {'task_id', 'model_id', 'score', 'verdict', 'status', 'input_tokens', 'output_tokens', 'total_tokens', 'elapsed_seconds', 'submissions', 'history'})
            self.assertIn(result['task_id'], tasks)
            self.assertIn(result['model_id'], models)
            pair = result['task_id'], result['model_id']
            self.assertNotIn(pair, pairs)
            pairs.add(pair)
            self.assertIn(result['verdict'], (None, 'PASS', 'FAIL'))
            if result['status'] != 'completed':
                self.assertIsNone(result['score'])
                self.assertIsNone(result['verdict'])
            for key in ('input_tokens', 'output_tokens', 'total_tokens', 'elapsed_seconds', 'submissions'):
                if result[key] is not None:
                    self.assertGreaterEqual(result[key], 0)
            for point in result['history']:
                self.assertEqual(set(point), {'submission', 'elapsed_seconds', 'total_tokens', 'score', 'phase'})
                self.assertIn(point['phase'], ('train', 'final'))
        for private_marker in ('run_01', 'attempt_01', 'taskver_', 's3://', 'arn:aws:', 'http://127.0.0.1', '/home/ubuntu/', 'Bearer ', 'api_key'):
            self.assertNotIn(private_marker, raw)

    def test_page_is_unlisted(self):
        page = (ROOT / '_pages/results2.html').read_text()
        self.assertIn('sitemap: false', page)
        self.assertIn('noindex, nofollow', page)
        self.assertNotIn('/results2', (ROOT / '_includes/header.html').read_text())


if __name__ == '__main__':
    unittest.main()
