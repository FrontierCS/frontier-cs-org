# Vendored verbatim from https://github.com/epoch-research/eci-public (src/eci/fitting.py, commit e937446).
# Used by bin/fcs2_runs_from_db.py for FrontierCS ECI. Do not edit; copy again to update.
#
# MIT License
#
# Copyright (c) 2025 Epoch AI
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

"""
Fitting for the Epoch Capabilities Index (ECI).

The model assumes benchmark performance follows a logistic curve:

    performance = sigmoid(discriminability * (capability - difficulty))

with one capability per model and one (difficulty, discriminability) pair
per benchmark. The anchor benchmark's discriminability is pinned to
identify the multiplicative scale; the L2 penalty resolves the remaining
translation freedom.

Results are reported on the ECI scale, defined by two anchor models
(Claude 3.5 Sonnet -> 130, GPT-5 -> 150) via the affine map
``eci = a + b * capability``. The same map sends benchmark difficulties to
EDI, and dividing discriminabilities by ``b`` preserves the predictions.
Every fit - the central one and each bootstrap refit - is mapped with the
(a, b) derived from its own anchor capabilities, so the anchor models sit
at exactly 130/150 in every draw; their CI cells are NaN.
"""

import numpy as np
import pandas as pd
from scipy.optimize import least_squares
from scipy.sparse import coo_matrix
from tqdm import tqdm

DEFAULT_ANCHOR_BENCHMARK = "Winogrande"
DEFAULT_ANCHOR_DISCRIMINABILITY = 1.0

# The anchor model names are matched against the "Model" column of the fit
# input, i.e. the Airtable "Model aggregation" names. Renaming an aggregation
# in Airtable requires a coordinated change here (the fit raises if an anchor
# is missing).
DEFAULT_ANCHOR_MODEL_LOW = "Claude 3.5 Sonnet"
DEFAULT_ANCHOR_ECI_LOW = 130.0
DEFAULT_ANCHOR_MODEL_HIGH = "GPT-5"
DEFAULT_ANCHOR_ECI_HIGH = 150.0

_MIN_ANCHOR_SPREAD = 1e-12


def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))


def _affine_map(cap_low: float, cap_high: float, eci_low: float, eci_high: float):
    """(a, b) of the map ``eci = a + b * capability`` sending cap_low to
    eci_low and cap_high to eci_high."""
    spread = cap_high - cap_low
    if not spread > _MIN_ANCHOR_SPREAD:  # also catches NaN
        raise ValueError(
            f"anchor capabilities (low={cap_low}, high={cap_high}) do not "
            "define a scale: the high anchor must sit above the low anchor"
        )
    b = (eci_high - eci_low) / spread
    return eci_low - b * cap_low, b


def _irt_jacobian(
    params: np.ndarray,
    capability: np.ndarray,
    difficulty: np.ndarray,
    discriminability: np.ndarray,
    model_idx: np.ndarray,
    bench_idx: np.ndarray,
    anchor_idx: int,
    n_models: int,
    n_benchmarks: int,
    regularization_strength: float,
):
    """Sparse Jacobian of the residual vector: one row per observation plus
    the regularization row.

    This exists purely for speed: without it, least_squares estimates the
    Jacobian by finite differences, at one residual evaluation per parameter
    per optimizer step.
    """
    n_obs = len(model_idx)
    n_params = params.size
    s = sigmoid(discriminability[bench_idx] * (capability[model_idx] - difficulty[bench_idx]))
    ds = s * (1 - s)
    obs_rows = np.arange(n_obs)

    cap_vals = ds * discriminability[bench_idx]
    diff_vals = -ds * discriminability[bench_idx]
    discrim_vals = ds * (capability[model_idx] - difficulty[bench_idx])

    # Discriminability parameter columns exist only for non-anchor benchmarks
    free = bench_idx != anchor_idx
    discrim_cols = (
        n_models + n_benchmarks
        + np.where(bench_idx < anchor_idx, bench_idx, bench_idx - 1)
    )

    rows = [obs_rows, obs_rows, obs_rows[free]]
    cols = [model_idx, n_models + bench_idx, discrim_cols[free]]
    vals = [cap_vals, diff_vals, discrim_vals[free]]

    n_rows = n_obs
    if regularization_strength > 0:
        n_rows += 1
        penalty = regularization_strength * np.sum(params**2) / n_params
        if penalty > 0:
            scale = regularization_strength / (n_params * np.sqrt(penalty))
            rows.append(np.full(n_params, n_obs))
            cols.append(np.arange(n_params))
            vals.append(scale * params)

    jac = coo_matrix(
        (np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))),
        shape=(n_rows, n_params),
    )
    return jac.tocsr()


def fit_eci_model(
    df: pd.DataFrame,
    anchor_benchmark: str = DEFAULT_ANCHOR_BENCHMARK,
    anchor_discriminability: float = DEFAULT_ANCHOR_DISCRIMINABILITY,
    regularization_strength: float = 0.1,
    performance_clip_eps: float = 1e-3,
    bootstrap_samples: int = 500,
    bootstrap_seed: int = 12345,
    use_analytical_jacobian: bool = True,
    *,
    anchor_model_low: str = DEFAULT_ANCHOR_MODEL_LOW,
    anchor_eci_low: float = DEFAULT_ANCHOR_ECI_LOW,
    anchor_model_high: str = DEFAULT_ANCHOR_MODEL_HIGH,
    anchor_eci_high: float = DEFAULT_ANCHOR_ECI_HIGH,
    ci_level: float = 0.90,
) -> tuple[pd.DataFrame, pd.DataFrame, "dict | None"]:
    """
    Fit the IRT model and return ECI-scale scores with bootstrap CIs.

    Args:
        df: DataFrame with columns model_id, benchmark_id, performance,
            benchmark, Model.
        anchor_benchmark: benchmark whose discriminability is pinned to
            identify the raw fit.
        anchor_discriminability: the pinned value.
        regularization_strength: L2 penalty on the parameter vector.
        performance_clip_eps: clip performance into [eps, 1 - eps].
        bootstrap_samples: number of bootstrap refits (0 to skip). Refits
            hold the set of models fixed and resample each model's benchmark
            results with replacement, so every model keeps its observation
            count in every resample.
        bootstrap_seed: random seed for the resampling.
        use_analytical_jacobian: use the analytical sparse Jacobian (fast);
            False uses finite differences (slower, and may converge along a
            slightly different optimizer path).
        anchor_model_low / anchor_eci_low / anchor_model_high /
            anchor_eci_high: the models that define the ECI scale and their
            fixed values.
        ci_level: central quantile mass for the CIs (0.90 -> 5th/95th).

    Returns:
        (eci_df, edi_df, draws), everything on the ECI scale:
        - eci_df: model_id, Model, eci, and eci_ci_low / eci_ci_high when
          bootstrapping (NaN for the anchor models, whose values are fixed
          by definition rather than estimated). Sorted by eci descending.
        - edi_df: benchmark_id, benchmark, is_anchor, edi,
          discriminability_scaled, each of the latter two with _ci_low /
          _ci_high columns when bootstrapping. Sorted by edi.
        - draws: None without bootstrapping, else a dict with model_ids,
          model_names, benchmark_ids, benchmark_names, the
          (bootstrap_samples, n) arrays eci, edi, slope, and the per-draw
          map coefficients a, b.

    Raises if any fit - central or bootstrap - fails to converge or lands
    its anchor capabilities coincident or inverted (no scale is defined).
    """
    df = df.copy()
    if df["performance"].isna().any():
        raise ValueError("Performance data contains NaN values")
    if (df["performance"] < 0).any() or (df["performance"] > 1).any():
        raise ValueError("Performance scores must be in [0, 1] range")
    if performance_clip_eps > 0:
        df["performance"] = df["performance"].clip(
            performance_clip_eps, 1 - performance_clip_eps
        )

    model_ids = df["model_id"].unique()
    benchmark_ids = df["benchmark_id"].unique()
    n_models = len(model_ids)
    n_benchmarks = len(benchmark_ids)
    n_params = n_models + n_benchmarks + (n_benchmarks - 1)

    model_to_idx = {m: i for i, m in enumerate(model_ids)}
    bench_to_idx = {b: i for i, b in enumerate(benchmark_ids)}
    model_idx = np.array([model_to_idx[m] for m in df["model_id"]])
    bench_idx = np.array([bench_to_idx[b] for b in df["benchmark_id"]])
    performance = df["performance"].values

    id_to_model = df.drop_duplicates("model_id").set_index("model_id")["Model"]
    id_to_bench = df.drop_duplicates("benchmark_id").set_index("benchmark_id")["benchmark"]
    model_names = [id_to_model[m] for m in model_ids]
    bench_names = [id_to_bench[b] for b in benchmark_ids]

    try:
        anchor_bench_id = df.loc[df["benchmark"] == anchor_benchmark, "benchmark_id"].iloc[0]
    except IndexError:
        raise ValueError(f"Anchor benchmark '{anchor_benchmark}' not found in data")
    anchor_idx = bench_to_idx[anchor_bench_id]

    try:
        anchor_low_idx = model_names.index(anchor_model_low)
        anchor_high_idx = model_names.index(anchor_model_high)
    except ValueError as e:
        raise ValueError(f"Anchor model not found in data: {e}") from None

    def unpack_params(params: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Split the flat vector [capabilities, difficulties, free
        discriminabilities], re-inserting the anchor benchmark's pinned
        discriminability (it is not a parameter)."""
        capability = params[:n_models]
        difficulty = params[n_models:n_models + n_benchmarks]
        discriminability = np.insert(
            params[n_models + n_benchmarks:], anchor_idx, anchor_discriminability
        )
        return capability, difficulty, discriminability

    def residuals(params, performance, model_idx, bench_idx):
        capability, difficulty, discriminability = unpack_params(params)
        pred = sigmoid(discriminability[bench_idx] * (capability[model_idx] - difficulty[bench_idx]))
        resid = pred - performance
        if regularization_strength > 0:
            penalty = regularization_strength * np.sum(params**2) / n_params
            resid = np.append(resid, np.sqrt(penalty))
        return resid

    def jacobian(params, performance, model_idx, bench_idx):
        capability, difficulty, discriminability = unpack_params(params)
        return _irt_jacobian(
            params, capability, difficulty, discriminability,
            model_idx, bench_idx, anchor_idx,
            n_models, n_benchmarks, regularization_strength,
        )

    lower = np.concatenate([
        np.full(n_models, -10.0),
        np.full(n_benchmarks, -10.0),
        np.full(n_benchmarks - 1, 0.1),  # discriminability stays positive
    ])
    upper = np.concatenate([
        np.full(n_models, 10.0),
        np.full(n_benchmarks, 10.0),
        np.full(n_benchmarks - 1, 10.0),
    ])

    def fit_and_scale(x0, performance, model_idx, bench_idx):
        """Run one least-squares fit and map its solution onto the ECI
        scale with the (a, b) from its own anchor capabilities. Returns
        (x, eci, edi, slope, a, b), where x is the raw solution vector
        (used to warm-start subsequent fits)."""
        result = least_squares(
            residuals,
            x0,
            jac=jacobian if use_analytical_jacobian else "2-point",
            args=(performance, model_idx, bench_idx),
            bounds=(lower, upper),
            method="trf",
        )
        if not result.success:
            raise RuntimeError(f"Optimization failed: {result.message}")
        capability, difficulty, discriminability = unpack_params(result.x)
        a, b = _affine_map(
            capability[anchor_low_idx], capability[anchor_high_idx],
            anchor_eci_low, anchor_eci_high,
        )
        return result.x, a + b * capability, a + b * difficulty, discriminability / b, a, b

    init_rng = np.random.default_rng(42)
    init_params = np.concatenate([
        init_rng.normal(0.0, 0.1, n_models),
        init_rng.normal(0.0, 0.1, n_benchmarks),
        np.full(n_benchmarks - 1, 1.0),
    ])

    x_hat, eci_hat, edi_hat, slope_hat, _, _ = fit_and_scale(
        init_params, performance, model_idx, bench_idx
    )

    draws = None
    if bootstrap_samples > 0:
        rng = np.random.default_rng(bootstrap_seed)
        rows_by_model = [np.flatnonzero(model_idx == m) for m in range(n_models)]
        samples = []
        for _ in tqdm(range(bootstrap_samples), desc="Bootstrap", unit="sample"):
            # Resample each model's observations with replacement
            idx = np.concatenate([
                rng.choice(rows, size=rows.size, replace=True)
                for rows in rows_by_model
            ])
            # Warm-start each refit from the central solution
            samples.append(
                fit_and_scale(x_hat, performance[idx], model_idx[idx], bench_idx[idx])[1:]
            )
        eci_s, edi_s, slope_s, a_s, b_s = (np.array(v) for v in zip(*samples))
        draws = {
            "model_ids": list(model_ids),
            "model_names": model_names,
            "benchmark_ids": list(benchmark_ids),
            "benchmark_names": bench_names,
            "eci": eci_s,
            "edi": edi_s,
            "slope": slope_s,
            "a": a_s,
            "b": b_s,
        }

    # Rows and draw columns are both in fit order here; sorting for
    # presentation happens only after the CI columns are attached
    eci_df = pd.DataFrame({"model_id": model_ids, "Model": model_names, "eci": eci_hat})
    edi_df = pd.DataFrame({
        "benchmark_id": benchmark_ids,
        "benchmark": bench_names,
        "is_anchor": [b == anchor_bench_id for b in benchmark_ids],
        "edi": edi_hat,
        "discriminability_scaled": slope_hat,
    })
    if draws is not None:
        tail = (1.0 - ci_level) / 2.0
        lo, hi = np.quantile(draws["eci"], [tail, 1.0 - tail], axis=0)
        eci_df["eci_ci_low"] = lo
        eci_df["eci_ci_high"] = hi
        # The anchor models' values are fixed by definition, not estimated
        anchor_rows = eci_df["Model"].isin([anchor_model_low, anchor_model_high])
        eci_df.loc[anchor_rows, ["eci_ci_low", "eci_ci_high"]] = np.nan
        lo, hi = np.quantile(draws["edi"], [tail, 1.0 - tail], axis=0)
        edi_df["edi_ci_low"] = lo
        edi_df["edi_ci_high"] = hi
        lo, hi = np.quantile(draws["slope"], [tail, 1.0 - tail], axis=0)
        edi_df["discriminability_scaled_ci_low"] = lo
        edi_df["discriminability_scaled_ci_high"] = hi

    return (
        eci_df.sort_values("eci", ascending=False),
        edi_df.sort_values("edi"),
        draws,
    )
