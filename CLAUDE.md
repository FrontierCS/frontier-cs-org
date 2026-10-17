# CLAUDE.md

Guidance for Claude Code when working in this repository. `README.md` describes the site, its pages, deployment and the FrontierCS 2 data pipeline; read it first. This file says how to work here.

## Workflow

- Work on `redesign`. `main` is the live site: never push to it. Never force-push any branch.
- Fetch before every edit and before every push; collaborators push to the same branches. If the branch moved, merge it in first.
- One change per commit. The message says what changed and why, and credits who asked for it (for example "(owner)").
- Open pull requests against `redesign`, one topic each. The body states what changed, what you checked, and a preview link. Do not merge a pull request unless the owner asks.
- To fix a conflicting pull request, add commits to its branch (revert what is not wanted, merge `redesign` in, resolve) and push without force.

## Build and check

- Build with `bundle exec jekyll build`, or serve with `bundle exec jekyll serve`.
- Before calling a change done, open every page it touches in a browser at 1280 px and at 390 px. Check for script errors, horizontal overflow, clipped or overlapping text, and look at a screenshot of what changed.
- Task pages load their diagrams with `fetch`, so check them over HTTP, not from `file://`.
- Put a site URL that a script needs in a real link (`<a href=... hidden>`) and read its `href`. A URL in a `data-` attribute or a string is not rewritten for previews or base URLs.

## Data

- The FrontierCS 2 numbers come from `bin/fcs2_runs_from_db.py` and the other `bin/fcs2_*` scripts (see README). Change the scripts, not their output. If a hand edit of the converter block in `assets/js/fcs2-data.js` is unavoidable, make the converter produce the same result, so the next run keeps it.
- Task descriptions live in `bin/fcs2_descriptions.tsv` and in the `DESC` copy in `fcs2-data.js`; edit both.
- The platform API is read-only for this site. Never commit credentials, private evaluation data or raw model output beyond what a page shows. `_data/fcs2_runs_hidden.json` is for fits only and is never shown.
- Fill numbers in page text from the data (`data-fill`) where you can, so they cannot drift from the charts.

## Design

The FrontierCS 2 overview (`index.md`) sets the design; match it everywhere.

- Type is Instrument Sans; colours are Google Material tones. A model's colour is its `--m-<id>` in `_sass/_fcs.scss`, nothing else.
- Links are underlined text or pills. Never use arrow characters (← → ‹ › ↗) as links or separators; breadcrumbs use "/".
- Draw checkboxes, radios and menus in Material 3 style; never leave the browser's default. The task filter's checkboxes and the mean-score settings' radios share one look.
- The same kind of element looks the same on every page.
- Subtract. Do not add a second way to do the same thing, and do not add grey notes that repeat a chart title, a legend or the questions.
- Charts follow Epoch AI's grammar: a light grid, labels on the marks, the source note and wordmark under the chart. Model names are never shortened.
- Task diagrams (`assets/img/fcs2-tasks/<slug>.svg`) use only the `fig2` classes in `assets/css/fcs2.css`: what is given on grey, the agent's part on its domain's tone, 760 wide, no frame, and no text outside its region.

## Words

- "FrontierCS", never "Frontier-CS" (except in repository names and URLs); "FrontierCS 2", never "2.0".
- The authors' code is the "human reference". The model at the 0 point of FCI is "Kimi K2.7".
- In headlines and share cards, write no contractions and no possessive apostrophes.
- Task names show in title case; internal keys never reach the page.
