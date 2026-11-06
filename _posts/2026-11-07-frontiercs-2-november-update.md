---
layout: distill
title: "FrontierCS 2 Update: Four New Models and a Benchmark That Is Harder to Game"
description: "Claude Sonnet 5.5, Claude Fable 5.1, Inkling 2 Small and MiniMax-M3.1-Flash join the leaderboard. We closed several ways to score without solving a task, rebuilt all 48 tasks on one format, and welcome Handshake and Snorkel AI as sponsors."
thumbnail: assets/img/blog-thumbs/frontiercs-2-november-update.svg
tags: [FrontierCS 2, Update]

date: 2026-11-07
date_display: "November 7, 2026"

authors:
  - name: FrontierCS 2 Team

toc:
  - name: Four new models
  - name: Fewer ways to cheat
  - name: One format for every task
  - name: New sponsors
---

Four more models now have results on FrontierCS 2. Before running them, we closed several ways an agent could score well without solving a task. We also rebuilt all 48 tasks on a single format, so that every task is judged the same way.

## Four new models

Claude Sonnet 5.5 is the strongest of the four. It beats the human reference on 24 of the 48 tasks. Each model ran every task once, with five hours per task.

| Model | Lab | Agent | Tasks passed | Mean score |
| --- | --- | --- | --- | --- |
| Claude Sonnet 5.5 | Anthropic | Claude Code | 24 of 48 | 53.6 |
| Claude Fable 5.1 | Anthropic | Claude Code | 17 of 48 | 50.4 |
| Inkling 2 Small | Thinking Machines | Pi | 4 of 48 | 36.7 |
| MiniMax-M3.1-Flash | MiniMax | Claude Code | 4 of 48 | 29.0 |

A task counts as passed only if the final submission beats the human reference on every metric. A run that ends with no valid submission scores 0. The [leaderboard]({{ '/' | relative_url }}#leaderboard) ranks all models together.

Inkling 2 Small often stopped early. It usually submitted its final answer within the first hour of its five. On many tasks its score is above the reference overall, yet it falls short on one metric, so the task does not count as passed. In two runs it stopped replying after about 800,000 tokens of context, and the session ended with nothing submitted.

Claude Sonnet 5.5 lost three tasks before submitting anything. In each, the agent ran out of memory and the run was stopped.

## Fewer ways to cheat

We care about one kind of cheating: faking the measurement. Tuning a solution to the task's test inputs is fine. Three fixes in this round:

- **No internet.** In Glenside, an agent downloaded the paper's original code from GitHub and copied the human reference. Agents now run offline.
- **No replayed answers.** In Batch Local Counting, a submission could save its outputs in the first timing round and copy them back in the next four. It scored 83 against a reference of 18. Each timing round now starts with no saved outputs.
- **No blurry images.** In Robust Image Tokenizer, the old quality score rewarded smoothing. The task now also checks perceived similarity, which blur does not fool.

Every task also faces a set of attack submissions before it goes live. One reads the judge's files. Another tries to hide from the judge's checks. Each must score 0.

Some high scores are real. Our posts on [QuarterPIR]({% post_url 2026-10-17-quarterpir-two-checksums %}), [BBQ]({% post_url 2026-10-18-bbq-two-faster-clocks %}) and [Sparse Video Attention]({% post_url 2026-10-19-svg-ear-measured-error %}) show how we checked three of them.

## One format for every task

The 48 tasks had drifted apart. Code that every task needs existed in up to 30 slightly different copies. A fix to one copy did not reach the others.

Every task now uses the same building blocks. A single file describes each task. All tasks share one judge and one set of agent tools. A change to the shared parts reaches every task at once.

Every submission is now checked the same way. The judge starts from a clean copy of the starter code. It keeps only the files the task lets the agent change. A submission that touches anything else scores 0.

Heavy experiments now run on a separate GPU machine. In two tasks, the agent's code trains a model. That code now runs on a machine of its own, and the judge scores the result on another.

The move did not change any result. After the move, each task re-judged its human reference and earlier submissions. All 48 tasks gave the same results as before.

## New sponsors

[Handshake](https://joinhandshake.com/) and [Snorkel AI](https://snorkel.ai/) now support FrontierCS 2. They join Modal, the Laude Institute and Scale AI. Thank you.
