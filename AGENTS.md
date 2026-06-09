# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Overview

This repository hosts the ICLR 2025 Blogposts Track website, built on the al-folio Jekyll theme. It's designed to publish and showcase academic blog posts submitted to the ICLR conference. The site uses Jekyll for static site generation and supports both Markdown and HTML blog posts with rich features like citations, interactive HTML figures, and math typesetting.

## Key Commands

### Local Development

**Using Docker (Recommended):**
```bash
./bin/docker_run.sh
```
This builds a Docker container and serves the site locally at `http://localhost:8080` using `_config_local.yml`.

**Using Jekyll directly:**
```bash
bundle install
bundle exec jekyll serve --future
```
Serves the site locally at `http://localhost:4000` using `_config.yml`.

### Building

```bash
bundle exec jekyll build
```
Generates the static site in the `_site/` directory. For production builds, set `JEKYLL_ENV=production` first.

### Deployment

```bash
./bin/deploy
```
Manual deployment script that builds the site and pushes to the `gh-pages` branch. The script will prompt for confirmation and checks for uncommitted changes.

**Automated deployment:** The repository uses GitHub Actions to automatically deploy when changes are pushed. Check `.github/workflows/deploy.yml` for configuration.

## Blog Post Structure

### File Organization

Each blog post requires files in specific locations:

1. **Main post file:** `_posts/2025-04-28-[SUBMISSION_NAME].md` (or `.html`)
2. **Images:** `assets/img/2025-04-28-[SUBMISSION_NAME]/`
3. **Interactive HTML figures:** `assets/html/2025-04-28-[SUBMISSION_NAME]/`
4. **Bibliography:** `assets/bibliography/2025-04-28-[SUBMISSION_NAME].bib`

The date prefix `2025-04-28` is standardized for all ICLR 2025 submissions.

### Post Front Matter

Every post must have YAML front matter with required fields:
- `layout:` (typically `distill` or `post`)
- `title:` Post title
- `description:` Brief description
- `date:` Publication date
- `authors:` List of authors with names and affiliations
- `bibliography:` Path to .bib file (e.g., `2025-04-28-[SUBMISSION_NAME].bib`)

### Citations

- Use BibTeX format in `assets/bibliography/2025-04-28-[SUBMISSION_NAME].bib`
- Reference citations in posts using `<d-cite key="citation_key"></d-cite>` tags
- Jekyll Scholar plugin automatically processes citations

### Interactive Content

- Place interactive HTML visualizations in `assets/html/2025-04-28-[SUBMISSION_NAME]/`
- Embed using `<iframe>` tags in the post
- Supports Plotly, D3.js, and other JavaScript-based visualizations

## Configuration Files

### `_config.yml`

Main configuration file for production deployment:
- `url:` https://iclr-blogposts.github.io
- `baseurl:` /2025
- Site metadata, theme settings, and plugin configuration

### `_config_local.yml`

Used for local development with Docker. Overrides production settings for localhost serving.

## Architecture

### Collections

- **`_news/`**: News items displayed on homepage
- **`_projects/`**: Project showcase pages (not heavily used in this blog track)
- **`_posts/`**: Main blog posts collection

### Layouts

- **`distill.html`**: Primary layout for blog posts with distill.pub styling
- **`post.html`**: Standard blog post layout
- **`about.html`**: Used for the about page
- **`page.html`**: Generic page layout

### Key Directories

- **`_includes/`**: Reusable HTML components (headers, footers, citations, etc.)
- **`_layouts/`**: Page templates
- **`_sass/`**: SCSS styling files
- **`assets/`**: All static assets (images, CSS, JS, bibliography, HTML embeds)
- **`_pages/`**: Standalone pages (about, call, submitting, reviewer guidelines)

### Jekyll Plugins

Important plugins configured in `_config.yml`:
- **jekyll-scholar**: Handles BibTeX citations
- **jekyll-paginate-v2**: Pagination for blog listing
- **jekyll-archives**: Tag/category archives
- **jekyll-feed**: RSS feed generation
- **jekyll-imagemagick**: Responsive image processing
- **jekyll-minifier**: Asset minification

## Submission Workflow

### For New Submissions

1. Fork the repository or work on a branch
2. Create post files following the naming convention: `2025-04-28-[SUBMISSION_NAME]`
3. Add all assets (images, HTML, bibliography) in corresponding directories
4. **DO NOT modify any files outside your submission's specific directories**
5. Test locally using Docker or Jekyll
6. Create a pull request with title: `_posts/2025-04-28-[SUBMISSION_NAME]`
7. Automated GitHub Action builds the post and comments the preview URL

### File Filtering

The repository uses `bin/filterpaths.py` to validate pull requests. Only changes to:
- New files in `_posts/`
- New directories/files in `assets/img/`, `assets/html/`, `assets/bibliography/`

Any other modifications will cause the PR to be rejected automatically.

## Important Notes

### Math Support

MathJax 3.2.0 is enabled for LaTeX math rendering. Use `$$...$$` for display math and `$...$` for inline math.

### Dark Mode

The theme includes dark mode support (`enable_darkmode: true`). Custom visualizations should consider both light and dark themes.

### Responsive Images

The `jekyll-imagemagick` plugin automatically generates responsive WebP versions of images. Original images in `.jpg`, `.jpeg`, `.png`, `.tiff` formats are processed.

### Review Process

Blog posts are submitted via pull request AND OpenReview. The GitHub PR generates a public preview URL for reviewers while maintaining double-blind review on OpenReview. Authors should ensure no identifying information in the post content during review.

## Common Issues

### Port Already in Use

If Docker can't start due to port 8080 being in use, edit `bin/docker_run.sh` to change the port mapping.

### Build Failures

- Check that all image paths are relative and use correct directory structure
- Ensure `.bib` file exists and is properly formatted
- Verify all required front matter fields are present

### GitHub Actions Failing

- Confirm PR only modifies allowed files (use `git diff` to check)
- Ensure post filename matches directory names in assets
- Check that no sensitive files or large binaries are committed
