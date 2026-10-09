# FrontierCS 2 evaluation results

`/results2/` is an unlisted public page, excluded from the sitemap and marked
`noindex, nofollow`. It is not an authenticated page. It never connects a visitor
to private evaluation APIs. Merging the website PR triggers the existing Jekyll
production deployment to `gh-pages`, which serves `frontier-cs.org`.

## Publish a snapshot

Run from the website checkout, against the canonical private campaign CSV:

```sh
python3 bin/export_results2.py \
  --model kimi_k2_7 'Kimi K2.7' /private/campaign/results.csv \
  --api-base http://127.0.0.1:18080 \
  --evidence-index /private/verified-evidence/index.json \
  --publication-index /private/verified-evidence/publication.json \
  --private-csv /private/results-normalized.csv
```

Repeat `--model ID LABEL CSV` to compare more models. Each input is a selected
result per task/model, not a list of infrastructure retry attempts. Columns may
be `score` and `verdict`, or `<model_id>_score` and `<model_id>_pass_fail` (for the
existing campaign CSV). The website derives a model matrix from normalized
records; no model-specific columns are added to the public schema.

The required private publication index explicitly allowlists reviewed formal campaign runs, binding each to its task, model, Candidate, TaskVersion and evaluation. Only completed, successful evaluations with a finite accepted final score and a verified scientific verdict are published. Running, failed, superseded, debug and smoke runs remain private. The normalized internal CSV still keeps all rows.

A publication index is an object keyed by run ID; each entry contains
`task_id`, `model_id`, `run_id`, `candidate_version_id`, `task_version_id`, and
`evaluation_id`. Establish these bindings from the reviewed frozen campaign,
not from arbitrary recently discovered runs. Replacements require explicit
review and an updated index. The exporter also requires a matching accepted
artifact and verified final-verdict proof when Management does not expose the
scientific verdict.

The optional evidence index maps private run IDs to `private_archive` and
`artifact_sha256`. The exporter hash-checks archives, reads only model traffic
session timestamps and provider usage, and outputs aggregates. It does not
publish prompts, raw responses, artifact links, credentials, cloud identifiers,
or run identifiers. Keep the index, archives and normalized CSV outside this
repository. The private CSV retains provenance and is written with mode 600.

The public `assets/data/results2.json` contains schema version 1, snapshot time,
model and task catalogs, and normalized task/model results. Missing measurements
are JSON null. `history` has one row per observed score with its phase,
submission number, elapsed seconds, and cumulative tokens when available.
Commit reviewed changes to that JSON through the ordinary PR process. The page
Refresh button fetches the latest **published snapshot**, not live run state.

## Measurement semantics

- Final score and pass/fail remain separate. A valid zero is preserved. Failed
  infrastructure runs and unfinished evaluations do not become scientific FAIL
  or score zero. Mean scores use only the scored-task intersection of selected
  models; coverage and the number of shared tasks are shown beside the mean.
- Train history comes from successful verifier events with finite scores, with one entry per
  verification ID. Failed requests still count toward submission totals, even
  when no numeric score is available. A scored final evaluation counts once.
- Final history uses the accepted final score and RESULT_ACCEPTED timestamp.
  It never substitutes a best training score. No event time means no point on
  the time axis. The submission axis can still show a score.
- Elapsed seconds start at the Management run start. They include infrastructure
  and judging, not only Agent compute. Row-level duration may also include
  cleanup; final curve time stops at result acceptance.
- Tokens sum provider-reported input/output usage across responses, including
  cached input where included by the provider. Reasoning tokens are included
  only through provider completion-token accounting; no additional estimate is
  added. Missing usage for any response makes full totals unknown, not zero.
  Token curves sum responses finished by the relevant score event.
- Curves connect actual measurements within one phase; they do not estimate
  intermediate scores. Train and final scores use separate controls.

## Verify

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s bin -p 'test_results2*.py'
node --check assets/js/results2.js
JEKYLL_ENV=production bundle exec jekyll build
python3 -m http.server 18082 --bind 127.0.0.1 --directory _site
# In another shell, with Playwright and Chromium installed:
node bin/test_results2_browser.cjs
```

`RESULTS2_URL` overrides the page URL; `RESULTS2_PLAYWRIGHT` can point to a
Playwright package installed outside the repository. `RESULTS2_SCREENSHOTS`
optionally selects a screenshots directory. Browser checks cover mobile overflow,
filters, valid zero scores, train/final curves, CSV download, multiple models,
and a failed refresh. Synthetic model records exist only inside browser routing
for tests, never in the published snapshot.

The dedicated Evaluation results workflow runs exporter tests, a production Jekyll
build and browser checks. The legacy ICLR submission-only workflow ignores this
narrow maintenance surface; its unrelated blog submission rules are unchanged.

## Official task names and subject labels

`bin/results2-task-catalog.json` records each task's exact first-level title from
its scientific statement (`agent-base/frontier/task/repo/README.md`) and subject
labels from the Preview source directory taxonomy. The catalog pins the source
commit, statement path and content hash for review. The public task schema adds
`labels: string[]`; the table renders these as chips and the filter matches any
label. It does not show namespace categories or derive titles from task IDs.

The exporter rejects uncatalogued tasks rather than applying automatic title
case. Add and review a new catalog entry when publishing another task. Multiple
subject labels are supported; only source-supported labels should be assigned.

## Analysis dashboard

The results page uses a compact task/model table with persistent column visibility
and sorting. Table values are sorted at full numeric precision; hover reveals
exact values and CSV exports retain them. Row selection updates three linked
score-versus-time, tokens and submission charts. Each chart can expand, and
train/final measurements stay separate. Best train score is derived only from
verified training points and never changes the final score. Train request count
is the verified total minus the observed final evaluation count.

Model selectors control table rows, comparison coverage, summaries and all
charts. Export CSV follows the current table filters; chart CSV follows the
selected task, models and train/final split. Missing measurements stay unknown.
Operational metadata remains excluded from both public exports.

Score consistency checks accept only identical or immediately adjacent finite
binary64 values (one ULP) to accommodate a JSON numeric round trip. They reject
broader tolerances, booleans and non-finite values, and never rewrite the accepted
API score or verifier evidence to force a match.
