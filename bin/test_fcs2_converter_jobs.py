"""The converter's parallel loops give what the sequential ones give: python3 -m unittest discover -s bin -p 'test_fcs2*.py'

bin/fcs2_runs_from_db.py converts a database as soon as it is loaded, so the test loads only its definitions (everything
above the line that opens the database). Skipped where numpy, scipy or pandas is missing."""
import importlib.util, sys, types, unittest
from pathlib import Path

SRC = Path(__file__).resolve().parent / 'fcs2_runs_from_db.py'


def definitions():
    src = SRC.read_text(encoding='utf-8')
    mod = types.ModuleType('fcs2_runs_from_db_definitions')
    mod.__file__ = str(SRC)
    sys.modules[mod.__name__] = mod   # the workers' entry point is looked up by module name
    argv, sys.argv = sys.argv, [str(SRC)]
    try: exec(compile(src[:src.index('\ndb = sqlite3.connect(')], str(SRC), 'exec'), mod.__dict__)
    finally: sys.argv = argv
    return mod


class ConverterJobsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        missing = [m for m in ('numpy', 'scipy', 'pandas', 'tqdm') if importlib.util.find_spec(m) is None]
        if missing: raise unittest.SkipTest(f'the converter needs {missing}')
        cls.c = definitions()

    def run_with(self, jobs, fn):
        self.c.JOBS = jobs
        return fn()

    def test_in_order_keeps_index_order_and_seeds(self):
        import numpy as np
        fn = lambda i: (i, np.random.default_rng(i).standard_normal(3))
        one, four = (self.run_with(j, lambda: self.c.in_order(fn, 23)) for j in (1, 4))
        self.assertEqual([i for i, _ in four], list(range(23)))
        for (_, a), (_, b) in zip(one, four): self.assertEqual(a.tobytes(), b.tobytes())

    def test_in_order_raises_a_worker_error(self):
        def fn(i):
            if i == 5: raise ArithmeticError('five')
            return i
        for jobs in (1, 3):
            with self.assertRaises(ArithmeticError): self.run_with(jobs, lambda: self.c.in_order(fn, 8))

    def tasks(self, nM=5):
        """Six tasks, every model one run on each: two metric groups, then the margin and its code."""
        import numpy as np
        rng, strength, TL = np.random.default_rng(0), np.linspace(-2, 2, nM), []
        for t in range(6):
            G = (rng.random((nM, 2)) < 1 / (1 + np.exp(-(strength[:, None] - rng.normal(0, 1, 2))))).astype(float)
            ok, y = G.all(1), rng.normal(0, 1, nM)
            O = np.column_stack([G, np.where(ok | (y < 0), y, 0.0), np.where(ok | (y < 0), 0.0, 1.0)])
            TL.append({'O': O, 'k': 2, 'mi': np.arange(nM), 'x': np.zeros(3)})
        return TL

    def test_joint_mode_with_task_workers_is_the_sequential_one(self):
        import numpy as np
        c, hyp, got = self.c, (1.5, 1.0, 1.4, 3.3, 1.0), []
        for jobs in (1, 3):
            c.JOBS, TL, used = jobs, self.tasks(), []
            with c.task_workers(TL):
                used.append(c._POOL is not None)
                th, ll = c.joint_cold(TL, hyp, np.zeros(5))
                th, ll2 = c.joint_mode(TL, (1.4, 1.1, 1.3, 3.0, 0.9), th)
            self.assertEqual(used, [jobs > 1])
            self.assertIsNone(c._POOL)
            got.append(th.tobytes() + np.array([ll, ll2]).tobytes() + b''.join(T['x'].tobytes() + T['A'].tobytes() for T in TL))
        self.assertEqual(got[0], got[1])

    def test_fci_bootstrap_draws_do_not_depend_on_jobs(self):
        import numpy as np
        c, nM, hyp, TL = self.c, 5, (1.5, 1.0, 1.4, 3.3, 1.0), self.tasks()
        c.JOBS = 1
        th, _ = c.joint_cold(TL, hyp, np.zeros(nM))
        c.BOOT = 16
        also = lambda Tb, pick, d: (list(map(int, pick)), float(d.sum()), Tb[0]['x'].tobytes())
        (d1, e1, s1), (d3, e3, s3) = (self.run_with(j, lambda: c.fci_draws(TL, hyp, th, 0, also)) for j in (1, 3))
        self.assertEqual(s1, s3)
        self.assertEqual(e1, e3)
        self.assertEqual(len(e1), len(d1))
        self.assertEqual(len(d1) + s1, 16)
        self.assertGreater(len(d1), 0)
        self.assertEqual(len(d1), len(d3))
        for a, b in zip(d1, d3): self.assertEqual(a.tobytes(), b.tobytes())
        self.assertFalse(np.array_equal(d1[0], d1[1]))   # different seeds, different draws


if __name__ == '__main__':
    unittest.main()
