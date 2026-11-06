---
layout: distill
title: "FrontierCS 2 Update: Four New Models and a Cleaner Benchmark"
description: "Claude Sonnet 5.5, Inkling 2 Small, Claude Fable 5.1 and MiniMax-M3.1-Flash join the leaderboard. We closed reward-hacking paths in several tasks, rebuilt all 48 tasks on one format, and welcome Handshake and Snorkel AI as sponsors."
thumbnail: assets/img/blog-thumbs/frontiercs-2-november-update.svg
tags: [FrontierCS 2, Update]

date: 2026-11-07
date_display: "November 7, 2026"

authors:
  - name: FrontierCS 2 Team

toc:
  - name: Key points
  - name: New models
  - name: Reward-hacking fixes
  - name: One task format for all 48 tasks
  - name: New sponsors
---

## Key points

- Four models joined the leaderboard. Claude Sonnet 5.5 passes 24 of 48 tasks, the most of the four; Inkling 2 Small, released this week by Thinking Machines, passes 4.
- We closed reward-hacking paths: agents no longer reach the internet, timing rounds cannot replay cached output, and a perceptual metric now stops blurry images from scoring as good reconstructions.
- All 48 tasks now share one task format, one verifier and one submission check. Every task was re-judged after the move and scores as before.
- Handshake and Snorkel AI join our sponsors.

## New models

Each model ran all 48 tasks once, with a 5-hour budget per task. A task counts as passed when the final submission beats the human reference on every metric the task checks.

| Model | Lab | Agent harness | Tasks passed | Mean score |
| --- | --- | --- | --- | --- |
| Claude Sonnet 5.5 | Anthropic | Claude Code, max effort | 24 / 48 | 53.6 |
| Claude Fable 5.1 | Anthropic | Claude Code, max effort | 17 / 48 | 50.4 |
| Inkling 2 Small | Thinking Machines | Pi, effort xhigh | 4 / 48 | 36.7 |
| MiniMax-M3.1-Flash | MiniMax | Claude Code | 4 / 48 | 29.0 |

Mean score counts a task with no valid final submission as 0. FCI, the leaderboard's ability estimate, is on the [leaderboard]({{ '/' | relative_url }}#leaderboard).

**Claude Sonnet 5.5** passes 19 of the 32 CPU tasks and 5 of the 16 GPU tasks. Three runs scored 0 because the agent ran out of memory before it submitted anything.

**Inkling 2 Small** ran on the Pi agent harness, which Thinking Machines used for its own kernel benchmark, at the effort and temperature of its evaluation. It often submitted its final answer within the first hour of a 5-hour budget. In many tasks its score is above the reference overall, but it does not beat the reference on every metric. Four runs scored 0. In two of them, with about 800,000 tokens of context, the model returned an empty reply and the harness ended the session.

## Reward-hacking fixes

A reward hack is a submission that scores well without solving the task. We count only measurement gaming: specializing to the task's workloads is allowed, faking the measurement is not. This round closed these paths:

- **Internet access.** In Glenside, an agent cloned the task's upstream repository from GitHub and copied the human reference. Agents now run with no external network, and every task that downloaded dependencies at build time ships them in its image.
- **Cached output between timing rounds.** In Batch Local Counting, a submission could save its outputs in the first timing round and copy them back in later rounds, scoring about 83 against a reference of about 18. The verifier now runs each round from a clean state. Parallel DBSCAN got the same guard.
- **Blurry reconstructions.** In Robust Image Tokenizer, PSNR alone rewards smoothing. The task now also checks LPIPS, a perceptual metric.
- **Earlier write-ups.** [QuarterPIR]({% post_url 2026-10-17-quarterpir-two-checksums %}), [BBQ]({% post_url 2026-10-18-bbq-two-faster-clocks %}) and [Sparse Video Attention]({% post_url 2026-10-19-svg-ear-measured-error %}) describe how we checked three high-scoring results that turned out to be real.

Each task's re-verification now includes attack submissions, for example a submission that reads the judge's files or one that tries to hide from its checks. Each must score 0.

## One task format for all 48 tasks

The 48 tasks had grown apart: some shared files existed in up to 30 diverging copies, and tasks described themselves in several overlapping files. We rebuilt every task on one format:

- **One definition per task.** A single `task.toml` holds each task's settings, with shared defaults written out in one place.
- **Shared verifier and agent images.** Tasks build on common base images instead of carrying their own copies of the shared code. A change to the shared code reaches every task at once.
- **One submission check.** Every submission is applied to a clean copy of the starter code, and only the files the task allows are kept. A submission that edits anything else scores 0, with the same public rejection categories in every task.
- **Isolated GPU sandboxes.** Tasks that run reinforcement learning or other heavy candidate code now run it on a separate GPU machine. The trusted judge scores the result on its own machine.
- **Re-verified against history.** After the move, each task re-judged its human reference and earlier submissions. All 48 matched their previous results.

## New sponsors

We thank [Handshake](https://joinhandshake.com/) and [Snorkel AI](https://snorkel.ai/) for joining Modal, the Laude Institute and Scale AI in supporting FrontierCS 2.
