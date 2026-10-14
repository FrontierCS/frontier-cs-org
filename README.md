# frontier-cs.org

The source of [frontier-cs.org](https://frontier-cs.org), the website of the FrontierCS benchmarks. It is a Jekyll site, originally forked from the [al-folio](https://github.com/alshedivat/al-folio) theme and since rebuilt.

- **FrontierCS 2** evaluates AI agents on computer science research. Each of its 48 problems removes the key contribution of a published paper from the code released with it. An agent passes only if its version beats that code, the human reference, on every metric of every hidden workload.
- **FrontierCS** is the first benchmark: open-ended algorithmic problems where any valid answer is accepted and a better one scores higher.

## Pages

| Path | Source | Contents |
|---|---|---|
| `/` | `index.md`, `assets/js/fcs2.js`, `assets/css/fcs2.css` | FrontierCS 2: the problem map, the leaderboard (pass rate, pass rate by domain, FECI, test-time scaling, mean score), the problem list, the private set, sponsors and questions |
| `/task/#<slug>` | `_pages/fcs2-task.md`, `assets/js/fcs2-task.js` | One FrontierCS 2 problem: its diagram and description, results, pass criteria, charts and the solution in words. `/task/` alone goes to the problem list |
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
2. `bin/fcs2_runs_from_db.py out.db` rewrites the block between the converter markers in `assets/js/fcs2-data.js`: runs, costs, FECI, test-time scaling, per-problem fits and descriptions. It also writes `_data/fcs2_runs_hidden.json`, the runs of models kept off the leaderboard (Kimi K2.7, the 0 point of FECI). Files in `_data/` are not published.
3. `bin/fcs2_checks_from_platform.py out.db` writes `assets/js/fcs2-checks.js`: for each run and metric, on how many hidden workloads the final submission beat the human reference.
4. `bin/fcs2_patches_from_platform.py` writes `assets/patches/<slug>.json`, the final patch of each run. The site does not show patches; they are the source for the solutions below.

These files are written by hand:

- `assets/js/fcs2-data.js`, outside the converter block: the problem list, domains and shared helpers.
- `bin/fcs2_descriptions.tsv`: problem descriptions, a copy of the paper repository's notes. The converter copies them into `fcs2-data.js`.
- `assets/js/fcs2-solutions.js`: how a model's final submission solves each problem, in 3 to 5 steps, written from its patch.
- `assets/img/fcs2-tasks/<slug>.svg`: one diagram per problem, inlined into the page. Diagrams use only the `fig2` classes in `assets/css/fcs2.css`, never inline colours or fonts. What is given sits on grey, the part the agent writes on the tonal colour of the problem's domain.
- `assets/js/fcs2-art.js`: the illustration of each problem in the map.

### Definitions

- **Pass**: the final submission beats the human reference on every metric the problem checks and on every hidden workload.
- **FECI** (FrontierCS Epoch Capabilities Index): fitted with Epoch AI's ECI code (`bin/eci_fitting.py`) on each model's mean score per problem and the human reference's score, then scaled so that Human = 25 and Kimi K2.7 = 0. Intervals are 90% bootstrap intervals.
- **FEDI** (FrontierCS Epoch Difficulty Index): a problem's difficulty on the FECI scale.
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
