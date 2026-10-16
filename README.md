# frontier-cs.org

The source of [frontier-cs.org](https://frontier-cs.org), the website of the FrontierCS benchmarks. It is a Jekyll site, originally forked from the [al-folio](https://github.com/alshedivat/al-folio) theme and since rebuilt.

- **FrontierCS 2** evaluates AI agents on computer science research. Each of its 48 tasks removes the key contribution of a published paper from the code released with it. An agent passes only if its version beats that code, the human reference, on every metric of every hidden workload.
- **FrontierCS** is the first benchmark: open-ended algorithmic problems where any valid answer is accepted and a better one scores higher.

## Pages

| Path | Source | Contents |
|---|---|---|
| `/` | `index.md`, `assets/js/fcs2.js`, `assets/css/fcs2.css` | FrontierCS 2: the task map, the leaderboard (pass rate, pass rate by domain, FCI, test-time scaling, mean score), the task list, the private set, sponsors and questions |
| `/task/#<slug>` | `_pages/fcs2-task.md`, `assets/js/fcs2-task.js` | One FrontierCS 2 task: its diagram and description, results, pass criteria, charts and the solution in words. `/task/` alone goes to the task list |
| `/v1/` | `_pages/v1.md`, `assets/js/fcs1.js` | FrontierCS: leaderboard, example problems and questions |
| `/blog/` | `_pages/blog.md`, `_posts/` | Blog list and posts |
| `/paper/` | `_pages/projects.md` | Research: the team's papers and work built on FrontierCS |
| `/workshop/` | `_pages/workshop.md` | The proposed ICLR 2027 workshop |
| `/team/` | `_pages/team.md` | Publications, institutions, partners, sponsors and contacts |
| `/results2/` | `_pages/results2.html` | An unlisted results page; see `bin/README-results2.md` |

Shared parts are in `_includes/` (header, footer, the blog article frame) and `_layouts/`. Site-wide styles and colour tokens are in `_sass/_fcs.scss`.

## Run it locally

```sh
bundle install
bundle exec jekyll serve          # http://localhost:4000
```

or, with Docker, `./bin/docker_run.sh` (http://localhost:8080). A production build is `JEKYLL_ENV=production bundle exec jekyll build`, which writes `_site/`.

## Branches and deployment

- `main` is the live site. A push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to the `gh-pages` branch; `CNAME` serves it at frontier-cs.org.
- `redesign` is the working branch for the current version of the site. Open pull requests against `redesign`, one topic per pull request, with a preview and what you checked (desktop and a 390 px phone width).

## FrontierCS 2 data

The FrontierCS 2 pages read static files; nothing on the site calls the evaluation platform. The files come from the platform's read-only API through these scripts, run in order:

1. `bin/fcs2_db_from_platform.py out.db` collects the formal evaluations into a SQLite database.
2. `bin/fcs2_checks_from_platform.py out.db` writes `assets/js/fcs2-checks.js`: for each run and metric, on how many hidden workloads the final submission beat the human reference. The counts of models kept off the leaderboard (Kimi K2.7) go to `_data/fcs2_checks_hidden.json` instead, for fits only; the converter reads both.
3. `bin/fcs2_runs_from_db.py out.db` rewrites the block between the converter markers in `assets/js/fcs2-data.js`: runs, costs, FCI, test-time scaling, task difficulty and descriptions. Task difficulty reads `assets/js/fcs2-checks.js` and `_data/fcs2_checks_hidden.json`, so step 2 comes first. It also writes `_data/fcs2_runs_hidden.json`, the runs of models kept off the leaderboard (Kimi K2.7, the 0 point of FCI). Files in `_data/` are not published. With `--json=out.json` it also writes every number for the paper's figures, and keeps there the earlier FCI fitted on raw scores (`feci_score`), which the site no longer shows.
4. `bin/fcs2_metric_means.py metric_aggregates.jsonl --db=out.db --values=metric_values.jsonl --margins=workload_margins.jsonl --reference=reference_profile.jsonl --reference=reference_profile_polar.jsonl --reference=reference_profile_replay.jsonl` writes `assets/js/fcs2-metrics.js`: for each task and metric, whether higher or lower is better and, per run, its mean over the hidden final workloads and the human reference's mean in the same evaluation. The input is an export of each run's final evidence from the platform (`GET /api/v1/runs/<id>/submission/evidence?submission_id=final`, one row per run and metric). The human reference is measured again in every run, so its mean varies from run to run; the task page shows the median over the task's runs. Where no run's evidence holds the human reference's numbers, `--reference` gives them: one row per task and metric, measured in a run of the human reference alone or read from earlier evidence, used only on the task version the runs had.
5. `bin/fcs2_patches_from_platform.py` writes `assets/patches/<slug>.json`, the final patch of each run. The site does not show patches; they are the source for the solutions below.

These files are written by hand:

- `assets/js/fcs2-data.js`, outside the converter block: the task list, domains and shared helpers.
- `bin/fcs2_descriptions.tsv`: task descriptions, a copy of the paper repository's notes. The converter copies them into `fcs2-data.js`.
- `assets/js/fcs2-solutions.js`: how a model's final submission solves each task, in 3 to 5 steps, written from its patch.
- `assets/img/fcs2-tasks/<slug>.svg`: one diagram per task, inlined into the page. Diagrams use only the `fig2` classes in `assets/css/fcs2.css`, never inline colours or fonts. What is given sits on grey, the part the agent writes on the tonal colour of the task's domain.
- `assets/js/fcs2-art.js`: the illustration of each task in the map.

### Definitions

- **Pass**: the final submission beats the human reference on every metric the task checks and on every hidden workload.
- **FCI** (FrontierCS Capabilities Index) and **FDI** (FrontierCS Difficulty Index) come from one model, Epoch AI's ECI idea fitted on what each run achieves. A run passes only if it beats the human reference on every metric the task checks, so the model looks at each metric (from `assets/js/fcs2-checks.js`); metrics that the same runs beat share one difficulty (`GROUP_TOL` in the converter). A run's final score counts by how far above the human reference it is when the run passes, in units of the task's score spread (at least the median spread over tasks), and by how far below it when the run does not pass and falls short; a run that does not pass but scores above the human reference counts as at least level, as its metrics did not confirm more. A run's metrics and its final score come from the same measurements, so they share one fitted run effect. Every run of every model, Kimi K2.7 included, enters the fit.
  - A model's **FCI** is its strength, with Kimi K2.7 at 0 and ten points per logit (`PASS_ZERO`, `PASS_ZERO_VALUE` and `PASS_UNIT` in the converter). Its 90% interval comes from a bootstrap over tasks that refits the model.
  - A task's **FDI** is the FCI at which a model passes it half the time, with a 90% interval. The task chart draws each task's pass curve from its metric groups' difficulties (`GROUPS`). With `--json` the converter also writes a progress curve per task, the expected share of its hidden checks a model beats (`progress_curve`).
- **Security tasks** are left out of FCI, FDI and test-time scaling until their tasks are fixed (`OFF_FIT_DOMAINS` in the converter). Their pages still list every run.
- **Refusals**: a run whose model provider refused, so that no final submission came (the platform's adjudication cause `provider_refusal_no_final`), is left out of FCI, FDI and test-time scaling. The task page still lists it as a failed run.
- **Test-time scaling**: a model's FCI with every run stopped at a budget in US$. A run that has ended within the budget counts what it achieved; a run still going counts as beating nothing (every metric group unbeaten, no win). Task difficulties stay as in the leaderboard fit, so at full budget it is the model's FCI.
- **Cost**: how each model's cost is estimated is stated on the site under "How is cost estimated?".

## Images for sharing

These need Python with Playwright; each script's docstring gives its use.

- `bin/fcs2_card.py` draws `assets/img/fcs2-card.png`, the link preview of the FrontierCS 2 page.
- `bin/fcs2_thread_cards.py` draws post cards from the site's charts.
- `bin/blog_thumbs.py` draws the blog thumbnails in `assets/img/blog-thumbs/`.
- `bin/blog_figures.py` redraws figures used in blog posts.

## Write a blog post

1. Add `_posts/YYYY-MM-DD-<slug>.md` with `layout: distill`. Copy the front matter of a recent post: `title`, `description`, `date`, `date_display`, `authors` (name, url, affiliations), `thumbnail`, `og_image`, and `toc` for the contents list.
2. Put images in `assets/img/YYYY-MM-DD-<slug>/`.
3. Add a thumbnail with `bin/blog_thumbs.py`, or point `thumbnail` at an existing image.

## Conventions

- Write "FrontierCS" (no hyphen) and "FrontierCS 2"; the hyphen stays only in repository names and URLs. The authors' code is the "human reference".
- Colours come from Google's palettes. Each model's colour is defined once, as `--m-<id>` in `_sass/_fcs.scss`.
- Links are plain underlined text or pills, never arrow characters. Checkboxes, radios and menus are drawn in the site's style, not left to the browser.
- Check every change at desktop width and at 390 px.

## License

MIT, see `LICENSE`. The theme this site started from is [al-folio](https://github.com/alshedivat/al-folio) by Maruan Al-Shedivat and contributors, also MIT.
