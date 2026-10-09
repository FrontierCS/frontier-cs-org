---
layout: distill
title: "Roadmap to FrontierCS 2"
description: "FrontierCS 2 extends open-ended evaluation from static sandboxed tasks to Harbor-based feedback loops and repo-level environments."
image: assets/img/2026-06-11-frontiercs-2-roadmap/benchmark-environment-evolution.jpg
thumbnail: assets/img/2026-06-11-frontiercs-2-roadmap/benchmark-environment-evolution.jpg
og_image: assets/img/2026-06-11-frontiercs-2-roadmap/benchmark-environment-evolution.jpg

date: 2026-06-11
date_display: "Jun 11, 2026"
htmlwidgets: true

authors:
  - name: FrontierCS Team
    url: "https://frontier-cs.org"
    affiliations:
      name: FrontierCS

toc:
  - name: "What's New in FrontierCS 2"
  - name: "The Feedback Loop in Three Settings"
  - name: "Why This Direction"
  - name: "From Static Harbor to Feedback"
  - name: "What We Mean by Repo-Level"
  - name: "Serverless GPUs as an Evaluation Boundary"
  - name: "What We Want Researchers to Try"

_styles: >
  .post.distill > .fc-post-hero {
    display: none;
  }
  .post.distill d-article {
    line-height: 1.48 !important;
  }
  .post.distill d-article > p,
  .post.distill d-article > ul,
  .post.distill d-article > ol,
  .post.distill d-article > h2,
  .post.distill d-article > h3,
  .post.distill d-article > div,
  .post.distill d-article > table {
    max-width: 860px;
  }
  .post.distill d-article > p {
    margin-top: 0.62rem !important;
    margin-bottom: 0.62rem !important;
    line-height: 1.48 !important;
  }
  .post.distill d-article > ul,
  .post.distill d-article > ol {
    margin-top: 0.45rem !important;
    margin-bottom: 0.8rem !important;
  }
  .post.distill d-article li {
    margin-bottom: 0.24rem !important;
    line-height: 1.42 !important;
  }
  .post.distill d-article h2 {
    margin-top: 1.75rem !important;
    margin-bottom: 0.58rem !important;
    line-height: 1.12 !important;
  }
  .post.distill d-article h3 {
    margin-top: 1rem !important;
    margin-bottom: 0.38rem !important;
    line-height: 1.18 !important;
  }
  d-article img {
    max-width: 82%;
    height: auto;
    display: block;
    margin: 0.95rem auto 0.42rem;
    border-radius: 7px;
  }
  d-article img.full {
    max-width: 100%;
  }
  d-article img.diagram {
    max-width: 72%;
  }
  d-article img.gpu-diagram {
    max-width: 84%;
  }
  d-article .caption {
    max-width: 82%;
    margin: 0 auto 1.05rem;
    color: #5b6575;
    font-size: 0.9em;
    line-height: 1.34;
    text-align: center;
  }
  d-article .callout {
    background: #f2f5f7;
    border-left: 4px solid #111;
    padding: 1rem 1.2rem;
    border-radius: 0 6px 6px 0;
    margin: 1.5rem 0;
    line-height: 1.55;
  }
  d-article .thesis-box {
    background: #eef3f8;
    border-left: 4px solid #1f5d8f;
    padding: 0.48rem 0.9rem;
    border-radius: 0 7px 7px 0;
    margin: 0.55rem 0 1rem;
  }
  d-article .thesis-box p {
    margin: 0 !important;
    line-height: 1.38 !important;
  }
  .post.distill d-article .thesis-box p {
    margin: 0 !important;
    line-height: 1.35 !important;
  }
  d-article .update-grid,
  d-article .repo-grid,
  d-article .pattern-grid {
    display: grid;
    gap: 0.65rem;
    margin: 0.85rem 0 0.95rem;
  }
  d-article .update-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  d-article .repo-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  d-article .pattern-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  d-article .pattern-grid span {
    border-left: 3px solid rgba(31, 93, 143, 0.55);
    padding: 0.18rem 0.7rem;
    color: #2c3748;
    line-height: 1.28;
  }
  d-article .update-item,
  d-article .repo-item {
    background: rgba(255,255,255,0.48);
    border: 1px solid rgba(26, 38, 52, 0.12);
    border-radius: 8px;
    padding: 0.65rem 0.8rem;
  }
  d-article .repo-item {
    display: flex;
    flex-direction: column;
    min-height: 150px;
  }
  d-article .update-item h3,
  d-article .repo-item h3 {
    font-size: 1.02rem !important;
    margin: 0 0 0.35rem !important;
    line-height: 1.16 !important;
  }
  d-article .update-item p,
  d-article .repo-item p {
    margin: 0 !important;
    line-height: 1.38 !important;
  }
  d-article .repo-item p {
    font-size: 0.84em !important;
    line-height: 1.3 !important;
  }
  d-article .repo-item .repo-meta {
    color: #5b6575;
    font-size: 0.78em !important;
    margin-top: 0.38rem !important;
  }
  .post.distill d-article .repo-item p {
    font-size: 0.84em !important;
    line-height: 1.3 !important;
    margin: 0 !important;
  }
  .post.distill d-article .repo-item .repo-meta {
    font-size: 0.78em !important;
    line-height: 1.25 !important;
    margin-top: 0.38rem !important;
  }
  d-article .showcase-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
    margin: 0.95rem 0 0.85rem;
  }
  d-article .showcase-grid figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  d-article .showcase-grid .showcase-media {
    width: 100%;
    min-height: 390px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  d-article .showcase-grid img {
    max-width: 100%;
    margin: 0 auto 0.35rem;
    border-radius: 7px;
  }
  d-article .showcase-grid figcaption {
    color: #5b6575;
    font-size: 0.82em;
    line-height: 1.26;
    text-align: center;
  }
  d-article .showcase-grid figure:nth-child(3) img {
    width: 88%;
  }
  d-article table {
    font-size: 0.92em;
  }
  @media (max-width: 860px) {
    d-article .update-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      margin: 0.65rem 0 0.75rem;
    }
    d-article .pattern-grid {
      grid-template-columns: 1fr 1fr;
      gap: 0.45rem;
    }
    d-article .pattern-grid span {
      padding: 0.12rem 0.55rem;
    }
    d-article .update-item {
      background: transparent;
      border: 0;
      border-left: 3px solid rgba(31, 93, 143, 0.55);
      border-radius: 0;
      padding: 0.05rem 0 0.12rem 0.75rem;
    }
    d-article .repo-item {
      padding: 0.62rem 0.72rem;
      min-height: 0;
    }
    d-article .repo-grid {
      grid-template-columns: 1fr;
    }
    d-article .update-item h3,
    d-article .repo-item h3 {
      margin-bottom: 0.25rem;
    }
    d-article .showcase-grid {
      grid-template-columns: 1fr;
      gap: 0.7rem;
      margin: 0.8rem 0 0.7rem;
    }
    d-article .showcase-grid .showcase-media {
      min-height: 0;
    }
    d-article .showcase-grid figure:nth-child(3) img {
      width: 100%;
    }
    d-article img,
    d-article .caption {
      max-width: 100%;
    }
    d-article img.diagram {
      max-width: 100%;
    }
    d-article img.gpu-diagram {
      max-width: 100%;
    }
  }
---

### Toward feedback-driven, repo-level open-ended tasks

<div class="thesis-box">
  <p><strong>TL;DR:</strong> FrontierCS rethought <strong>problem</strong> and <strong>score</strong>, moving benchmarks from closed-ended exam tasks toward open-ended research tasks, or <em>what to solve</em>; FrontierCS 2 rethinks <strong>environment</strong> and <strong>scope</strong>, or <em>how to solve</em>.</p>
</div>

FrontierCS made two bets: open-ended problems and continuous scoring. Those bets still look right. Frontier models are strong on exam-style tasks, but open-ended research and engineering tasks still expose a different failure mode: agents often know many local moves, but struggle to keep improving.

FrontierCS 2 makes the next two bets: feedback-driven environments and repo-level scope.

## What's New in FrontierCS 2

This FrontierCS 2 update includes four changes.

<div class="update-grid">
  <div class="update-item">
    <h3>Agent-native tasks</h3>
    <p>FrontierCS algorithmic tasks now run as containerized Harbor-compatible tasks.</p>
  </div>
  <div class="update-item">
    <h3>Released private tests</h3>
    <p>We are releasing the private test cases for FrontierCS algorithmic tasks.</p>
  </div>
  <div class="update-item">
    <h3>Controlled feedback</h3>
    <p>Agents can receive evaluator feedback during execution without direct evaluator access; GPU-backed tasks can run through Modal.</p>
  </div>
  <div class="update-item">
    <h3>Repo-level previews</h3>
    <p>We are releasing 10 preview tasks for richer repo-level open-ended work.</p>
  </div>
</div>

The short version is simple: open-ended evaluation remains the core idea. FrontierCS 2 changes the environment around it.

## The Feedback Loop in Three Settings

The same evaluation pattern appears in settings that are easy to see: the agent proposes an artifact, receives feedback, and improves it over time.

<div class="showcase-grid">
  <figure>
    <div class="showcase-media">
      <img src="{{ 'assets/img/2026-06-11-frontiercs-2-roadmap/polyomino-packing-square@2x-homepage.gif' | relative_url }}" alt="Polyomino packing long-horizon improvement">
    </div>
    <figcaption><strong>Polyomino Packing.</strong> Codex + GPT-5.5 improves a fixed square-ish case from roughly 63.7 to 82.5 using record-high submissions.</figcaption>
  </figure>
  <figure>
    <div class="showcase-media">
      <img src="{{ 'assets/img/2026-06-11-frontiercs-2-roadmap/homepage-showcase-erdos100-2x.gif' | relative_url }}" alt="Erdos unit distance 100-point visual task">
    </div>
    <figcaption><strong>Erdős Unit Distance.</strong> A small 100-point visual task where the agent searches for better geometric constructions under a measurable objective.</figcaption>
  </figure>
  <figure>
    <div class="showcase-media">
      <img src="{{ 'assets/img/2026-06-11-frontiercs-2-roadmap/generals-io-strategy.gif' | relative_url }}" alt="Generals.io bot strategy replay">
    </div>
    <figcaption><strong>Generals.io Strategy.</strong> A dynamic replay where the artifact is not a static solution, but a policy playing out over time.</figcaption>
  </figure>
</div>

These settings have different artifacts. A packing layout. A geometric construction. A game strategy. A database patch. A serving scheduler. The common structure is the same: the agent needs to try, measure, revise, and keep improving.

## Why This Direction

The next generation of agent evaluation should not only ask whether a model can answer harder questions. It should ask whether an agent can make sustained progress in an environment.

This is becoming more visible in frontier research. [OpenAI's recent Erdős unit distance result](https://www.theguardian.com/technology/2026/may/21/openai-paul-erdos-maths-problem-breakthrough) put construction-style mathematical discovery in the spotlight. The problem asks how many pairs of points can be exactly one unit apart. OpenAI announced an AI-generated counterexample to a long-standing Erdős unit distance conjecture, and mathematicians later published a [human-verified explanation](https://arxiv.org/abs/2605.20695).

The exact maximum remains open. That is the important part. Progress in these settings is not a one-shot answer. It comes from search, construction, verification, and refinement.

That is the type of behavior FrontierCS 2 is built to study.

## From Static Harbor to Feedback

Our first step was to make the original FrontierCS algorithmic tasks work as Harbor tasks. The agent enters a sandbox, reads the task, works with files and tools, and submits a final solution. This is the static Harbor setting.

Static Harbor is already a large step beyond single-turn prompting. The agent can act inside an environment. But the evaluator still sits outside the run. The agent works, submits, and only then gets scored.

FrontierCS 2 builds on Harbor and changes this interface. For open-ended tasks, final-only scoring is often too weak. The agent needs feedback while it is still searching.

The key is control. We do not expose the evaluator directly. We do not leak hidden answers. We do not want agents to optimize against quirks of the scoring script. We want a safe feedback channel: enough signal for iteration, enough isolation to preserve benchmark integrity.

![The evolution of benchmark environments]({{ 'assets/img/2026-06-11-frontiercs-2-roadmap/benchmark-environment-evolution.jpg' | relative_url }}){: .diagram}
<div class="caption">FrontierCS 2 builds on the sandbox idea: agents get more room to iterate, while evaluators stay isolated.</div>

## What We Mean by Repo-Level

Repo-level does not mean letting an agent edit everything.

It means the repo is part of the task environment. The agent can read real code, understand existing abstractions, build or serve the system, and edit a controlled part of the implementation. The full repo gives context. The patch policy keeps the benchmark fair.

This is the pattern we want:

<div class="pattern-grid">
  <span>realistic codebase context</span>
  <span>clear task objective</span>
  <span>runnable workflow</span>
  <span>controlled feedback during the run</span>
  <span>narrow writable surface</span>
  <span>hidden final evaluation</span>
</div>

Here are three examples.

<div class="repo-grid">
  <div class="repo-item">
    <h3>DuckDB E2E Query Optimization</h3>
    <p>Improve analytical query performance while preserving SQL correctness.</p>
    <p class="repo-meta">Patch surface: optimizer/execution only; no TPC-H hard-coding or environment tricks.</p>
  </div>
  <div class="repo-item">
    <h3>Vector DB ANN</h3>
    <p>Build a Rust ANN service under fixed API, CPU, memory, recall, and QPS constraints.</p>
    <p class="repo-meta">Patch surface: hidden vectors and ground truth; must satisfy <code>recall@10 >= 0.95</code>.</p>
  </div>
  <div class="repo-item">
    <h3>vLLM LLM-Serving Optimization</h3>
    <p>Speed up mini-swe-agent serving while preserving task accuracy, following <a href="https://arxiv.org/abs/2511.02230">Continuum</a>.</p>
    <p class="repo-meta">Patch surface: scheduling, batching, KV-cache, request path, and nearby serving logic.</p>
  </div>
</div>

The vLLM task shows how this control works. The agent is given the full vLLM repo because the optimization requires real systems context. It needs to understand serving, scheduling, batching, KV-cache behavior, and the OpenAI-compatible request path.

The objective is not just to make vLLM faster. The patched server must speed up a mini-swe-agent workload while preserving task-solving accuracy close to the vanilla vLLM baseline. We use accuracy on the downstream agent task as the correctness proxy: a faster server that changes model behavior or hurts task quality should not score well.

We also control where the agent can patch. The intended writable surface is online serving efficiency: request scheduling, batching, prefix or prompt-cache reuse, KV-cache management, preemption, admission control, and nearby scheduler/execution wiring. The evaluator rejects changes to CUDA/C++, build systems, packaging, tests, benchmark files, secrets, model implementations, distributed internals, and benchmark-specific shortcuts.

That is the target shape for FrontierCS 2: real systems work, controlled patch surfaces, and feedback loops that reward genuine improvement.

## Serverless GPUs as an Evaluation Boundary

Some repo-level tasks need GPUs. That adds another benchmark boundary: even if the agent container and evaluator container are isolated, a shared GPU can still leak state through warm processes, caches, contention, or scheduling noise.

For the vLLM task, we use [Modal](https://modal.com) for that boundary. The agent and judge containers stay CPU-only. The model server runs on an on-demand NVIDIA L40S and exposes an OpenAI-compatible endpoint, so the agent can use the service without owning the GPU.

![Serverless GPU evaluation boundary]({{ 'assets/img/2026-06-11-frontiercs-2-roadmap/serverless-gpu-evaluation.png' | relative_url }}){: .gpu-diagram}
<div class="caption">The agent can use GPU-backed serving through a controlled endpoint, while the GPU itself stays outside the agent container.</div>

Each submitted patch is baked into a Modal image. vLLM precompiled CUDA kernels keep builds fast and enforce the Python-only patch policy. Baseline and patched servers are measured serially on the same GPU class, never concurrently: baseline is measured and cached; the patched server is launched, health-checked, measured, and stopped. Modal volumes cache model weights and vLLM artifacts without exposing hidden evaluator state. The goal is reproducible GPU serving evaluation, not just cheaper hosting.

## What We Want Researchers to Try

FrontierCS 2 is aimed at frontier labs and agent researchers who care about long-horizon evaluation.

If you build agents, use these tasks to test more than final success. Look at how your agent uses feedback. Does it recover from bad submissions? Does it overfit public signals? Does it keep a useful search state? Does it improve the artifact, or only learn to game the harness?

If you build benchmarks, we think this is the important interface: agents should get enough feedback to make progress, but not enough access to corrupt the evaluator.

Open-ended evaluation was the right direction for FrontierCS. FrontierCS 2 keeps that bet, and moves it into the environment.

<div class="callout">
  <strong>FrontierCS 2 in one line:</strong> more room for agents to search, build, and iterate; still hard to cheat.
</div>
