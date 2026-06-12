---
layout: distill
title: Evaluating Evolving Agent Systems at Scale with Frontier-CS
description: "Evolving agent systems are advancing fast, but evaluation hasn't kept up. We show how Frontier-CS enables comprehensive, large-scale benchmarking of evolving agents—moving beyond small case studies for comparison at scale."

date: 2026-03-10
date_display: "Mar 10, 2026"
image: assets/img/2026-03-06-agent-evaluation/preview.png
thumbnail: assets/img/2026-03-06-agent-evaluation/preview.png
og_image: assets/img/2026-03-06-agent-evaluation/preview.png
htmlwidgets: true

authors:
  - name: Qiuyang Mang
    url: "https://joyemang33.github.io/"
    affiliations:
      name: University of California, Berkeley
  - name: Shu Liu
    url: "https://shulynnliu.com/"
    affiliations:
      name: University of California, Berkeley
  - name: Mert Cemri
    url: "https://people.eecs.berkeley.edu/~mert_cemri/"
    affiliations:
      name: University of California, Berkeley
  - name: Shubham Agarwal
    url: "https://skejriwal44.github.io/"
    affiliations:
      name: University of California, Berkeley
  - name: Hanchen Li
    url: "https://hanchenli.github.io/"
    affiliations:
      name: University of California, Berkeley
  - name: Qizheng Zhang
    url: "https://alex-q-z.github.io/"
    affiliations:
      name: Stanford University
  - name: Jingzhuo Hu
  - name: Frontier-CS team
    url: "https://frontier-cs.org"

toc:
  - name: Evolving Agents Are the Next Frontier for LLMs
  - name: A Promising Direction, Bottlenecked by Evaluation
  - name: Why the Evaluation Gap?
  - name: Frontier-CS as the Standard Benchmark for Evolving Agents
  - name: From Small Case Studies to Comprehensive Evaluation
  - name: "Use Case 1: Online Evolution"
  - name: "Use Case 2: Offline Learning"

_styles: >
  d-article img {
    height: auto;
    display: block;
    margin: 1.5rem auto;
    border-radius: 6px;
  }
  d-article p img {
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
---
<div style="text-align: center;">
  <img src="https://raw.githubusercontent.com/FrontierCS/Frontier-CS/main/assets/logo.png" style="width: 80%; border-radius: 6px;" alt="Frontier-CS Logo">
</div>

## Evolving Agents Are the Next Frontier for LLMs

Evolving agent systems—including methods based on **continual learning**, **memory evolution**, and **context refinement**—are emerging as a promising path toward agents that improve through experience rather than relying on a fixed policy. This matters especially in discovery-style settings, where the agent must learn from prior failures, accumulate useful knowledge, and adapt its future behavior over long horizons. Recent work such as [GEPA](https://arxiv.org/abs/2507.19457) and [ACE (Agentic Context Evolution)](https://arxiv.org/abs/2601.08747), [SkyDiscover](https://skydiscover-ai.github.io/) reflects this trend.

### A Promising Direction, Bottlenecked by Evaluation
However, evaluation has not kept up. Most prior work demonstrates gains on **only ~10 tasks**, often selected case studies or small benchmark subsets. That is a weak test for evolving systems: improvement on three or four tasks does not tell us whether a method can generalize across a broad task distribution, remain stable over many iterations, or handle the kinds of long-horizon, high-difficulty reasoning that make evolution necessary in the first place.

Worse still, many tasks used in prior evolving-agent papers are not expert-crafted and saturate far too quickly. As a result, they fail to measure continued progress in the domain. Circle packing is a telling example: [ThetaEvolve](https://arxiv.org/abs/2511.23473), [TTT-Discover](https://arxiv.org/abs/2601.16175), [AdaEvolve](https://arxiv.org/abs/2602.20133), and [EvoX](https://arxiv.org/abs/2602.23413) all converge to essentially the same value, **2.635983**. Once multiple methods collapse to the same endpoint, the benchmark no longer measures open-ended improvement—it only measures how fast a system reaches saturation.

<div style="text-align: center; margin-bottom: 0;">
  <figure style="margin-bottom: 0;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/circle-packing.png' | relative_url }}" style="width: 30%; border-radius: 6px;" alt="Circle Packing" data-zoomable>
    <figcaption style="margin-top: 0.5rem; font-size: 0.9em; font-weight: bold;">Existing LLM evolving work converges to the same best for the circle-packing task.</figcaption>
  </figure>
</div>

### Why Current Evaluation Fails?
We identify two core failure reasons. First, many existing tasks are community-contributed and community-maintained, resulting in limited scale and inconsistent quality. Second, many of these tasks do not have enough difficulty or headroom to meaningfully measure continued progress. Their search spaces are often too small. 

Circle packing is a representative case: the core solution is typically just a **~100-line Python program**, and most methods **differ only in how they wrap existing SLSQP-based optimization routines**.

<div style="text-align: center; margin-bottom: 0;">
  <figure style="margin-bottom: 0;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/circle-packing-code.png' | relative_url }}" style="width: 50%; border-radius: 6px;" alt="Circle Packing Code" data-zoomable>
    <figcaption style="margin-top: 0.5rem; font-size: 0.9em; font-weight: bold;">The only difference across methods in circle-packing problem is how they construct the initial configuration (<code>cons</code>).</figcaption>
  </figure>
</div>

## Frontier-CS as the Standard Benchmark for Evolving Agents

Frontier-CS is built to solve exactly the failures of current evaluation. It includes **172 algorithmic tasks** and **68 research tasks**, all **expert-designed** by **ICPC World Finalists** and **CS PhDs**. That gives it both the **scale** and the **quality consistency** missing from small, community-maintained benchmark sets.

Each Frontier-CS task is a distinct, open-ended problem with its own environment, yet still admits **deterministic scoring**. As a result, Frontier-CS can evaluate evolving agents **comprehensively**, **at scale**, and on tasks that are difficult enough to meaningfully measure continued progress.

**[Permutation](https://github.com/FrontierCS/Frontier-CS/blob/main/algorithmic/problems/2/statement.txt)** is a good example of the kind of task Frontier-CS is built around. In this interactive problem, the agent must recover a hidden permutation of length <d-math>n</d-math>. In each round, it may propose any length-<d-math>n</d-math> sequence over <d-math>\{1,\dots,n\}</d-math>, and receives only a single number: how many positions match the hidden target. The objective is to identify the full permutation using as few queries as possible.

<div style="text-align: center; margin-bottom: 0;">
  <figure style="margin-bottom: 0;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/permutation.png' | relative_url }}" style="width: 50%; border-radius: 6px;" alt="Permutation Task" data-zoomable>
  </figure>
</div>

What makes this task valuable is not just its combinatorial scale, but the form of interaction itself. The agent has substantial freedom in **what to ask**, **what information to extract from each response**, and **how to adapt future queries based on past feedback**. In other words, the task creates real room for strategy design, information-efficient exploration, and long-horizon reasoning. **This is very different from tasks like circle packing, where the search often collapses quickly into a fairly standard optimization problem with limited room for fundamentally different solution strategies**. At the same time, Permutation still admits **deterministic scoring** through query count, enabling clean and scalable comparison across methods.

### From Small Case Studies to Comprehensive Evaluation

Frontier-CS is already helping push the field toward real large-scale evaluation. [SkyDiscover](https://skydiscover-ai.github.io/blog.html) uses it in a **200+ task** benchmark suite, including **172 Frontier-CS programming problems**, to compare methods under the same framework, models, and budgets. That is a sharp contrast to earlier evaluations built around only a small handful of tasks. With Frontier-CS, evolving-agent systems can finally be compared **comprehensively, fairly, and at scale**. 

<div style="display: flex; justify-content: center; align-items: center; gap: 2rem; flex-wrap: wrap;">
  <figure style="text-align: center; margin: 0; flex: 1; max-width: 45%;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/baby-giant.png' | relative_url }}" style="width: 100%; border-radius: 6px;" alt="Baby-Giant" data-zoomable>
    <figcaption style="margin-top: 0.5rem; font-size: 0.85em; font-weight: bold;">Frontier-CS enables large-scale evolving agent benchmarking.</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0; flex: 1; max-width: 45%;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/result.png' | relative_url }}" style="width: 100%; border-radius: 6px;" alt="Result" data-zoomable>
    <figcaption style="margin-top: 0.5rem; font-size: 0.85em; font-weight: bold;">New evolving frameworks clearly outperform prior method on Frontier-CS.</figcaption>
  </figure>
</div>


### Use Case 1: Online Evolution
<p style="margin-top: -0.5rem; font-size: 0.85em; color: #666; font-style: italic;">✍️ Shu Liu, Mert Cemri, and Shubham Agarwal · <a href="https://skydiscover-ai.github.io/blog.html" style="color: #4a90d9;">SkyDiscover Team</a></p>

Many discovery problems operate in **online evolutionary settings**: the system repeatedly proposes solutions, receives feedback, and refines future candidates over long horizons. The key capability here is not just producing good solutions, but **learning to improve from experience over time**.

In practice, progress depends heavily on the **search strategy**—how prior solutions are selected and how new candidates are generated. However, most existing systems (e.g., [GEPA](https://arxiv.org/abs/2507.19457), [ShinkaEvolve](https://arxiv.org/abs/2602.12877), [OpenEvolve](https://github.com/codelion/openevolve)) rely on **fixed strategies with manually tuned parameters** such as explore–exploit ratios or elite selection rules. While these can work well initially, they often **stagnate** when the search landscape shifts—either across tasks or across different stages of the same optimization.

This motivates **adaptive evolutionary algorithms** that modify their own search behavior during optimization. [SkyDiscover](https://skydiscover-ai.github.io/blog.html) provides a modular framework for implementing such adaptive strategies, including **AdaEvolve** and **EvoX**:

- **AdaEvolve** adjusts search intensity and resource allocation based on real-time progress signals.
- **EvoX** goes further—letting the LLM evolve the strategy itself that governs how past experiences are selected and reused.

Across the full Frontier-CS benchmark, **adaptive evolution consistently outperforms fixed-strategy methods** such as OpenEvolve, GEPA, and ShinkaEvolve. The results highlight that adaptive search becomes increasingly important when evaluating evolving agents **at scale**, where task diversity and difficulty expose the brittleness of static strategies.

A concrete example illustrates this well. On a **polyomino packing** task from Frontier-CS, the adaptive algorithm starts from a simple baseline and gradually discovers improved placement strategies—better ordering, symmetry handling, and local compaction—leading to progressively denser layouts over time:

<div style="text-align: center; margin-bottom: 0;">
  <figure style="margin-bottom: 0;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/evolution.gif' | relative_url }}" style="width: 40%; border-radius: 6px;" alt="Online Evolution on Polyomino Packing">
    <figcaption style="margin-top: 0.5rem; font-size: 0.9em; font-weight: bold;">Adaptive evolution progressively discovers denser packing strategies on a polyomino task.</figcaption>
  </figure>
</div>

<div style="background: #f0f4fa; border-left: 4px solid #4a90d9; padding: 1rem 1.2rem; border-radius: 6px; margin: 1.5rem 0; color: #1a1a1a;">
📢 This task is far from saturated. A human expert achieves a packing score of <strong>92</strong>, while the best current evolving agent reaches only the low 80s—leaving substantial room for improvement. This stands in sharp contrast to benchmarks like circle packing, where all major methods have already converged to the same ceiling. Frontier-CS tasks are designed with deep search spaces and high expert-level ceilings, ensuring they remain meaningful as methods improve. We encourage the community to develop <strong>stronger online evolution strategies</strong> and push toward—and beyond—the human expert frontier.
</div>

### Use Case 2: Offline Learning
<p style="margin-top: -0.5rem; font-size: 0.85em; color: #666; font-style: italic;">✍️ Qizheng Zhan and Jingzhuo Hu · <a href="https://arxiv.org/abs/2510.04618" style="color: #4a90d9;">ACE Team</a></p>

The central goal of using **ACE** offline is to improve an agent by training an evolving context, or we call it **playbook**, on traces from previous agent runs. Instead of updating model weights, ACE updates the agent’s context through three stages: the **Generator** attempts to solve problems, the **Reflector** extracts useful lessons from successes and failures, and the **Curator** merges these lessons into a structured playbook. Over time, the playbook accumulates reusable strategies, common mistakes, and code patterns that can be transferred to unseen tasks. This follows the central ACE design principle that contexts should function as **evolving playbooks** rather than short static prompts.

In the offline setting, this adaptation occurs entirely on the training split. In our experiments, the dataset contains **120 training problems, 25 validation problems, and 27 test problems**. The validation set is used to select the best playbook checkpoint during training, and the selected best playbook is then evaluated on held-out test problems. Intuitively, offline ACE resembles studying from a growing notebook before an exam: the model’s parameters remain unchanged, but it enters evaluation equipped with a richer collection of structured strategies.

During offline training, ACE continuously expands its playbook of strategies. These entries are stored as structured bullets such as strategies, heuristics, code templates, and common mistakes. This playbook corresponds to the evolving context memory described in ACE, where knowledge accumulates through repeated cycles of generation, reflection, and curation.

<div style="text-align: center; margin-bottom: 0;">
  <figure style="margin-bottom: 0;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/playbook.png' | relative_url }}" style="width: 80%; border-radius: 6px;" alt="Permutation Task" data-zoomable>
  </figure>
</div>

Over the course of training, the playbook grows substantially—from roughly **2k tokens to about 62k tokens**. However, the best-performing checkpoint occurs when the playbook is around **20k tokens**, suggesting that larger contexts do not necessarily lead to better performance. Moreover, most of the content of playbook is relatively specific, only around 13 out of 110 could be applied generally. Aggressive accumulation may introduce redundancy or noise that weakens the usefulness of the stored knowledge.

We observe that the best performance occurs at **epoch 1, step 70**, after which training begins to degrade. In some cases, the no-training accuracy is actually higher than the trained accuracy, indicating that the playbook may start to **overfit the training tasks**. Overall improvements remain relatively modest (around **2% on average**), suggesting that extremely large playbooks can dilute useful signals. In practice, **pruning or filtering low-value entries** may help maintain a more effective context.
<div style="text-align: center; margin-bottom: 0;">
  <figure style="margin-bottom: 0;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/offline-table.png' | relative_url }}" style="width: 70%; border-radius: 6px;" alt="Score Comparison" data-zoomable>
  </figure>
</div>

<div style="display: flex; justify-content: center; align-items: flex-start; gap: 2rem; flex-wrap: wrap;">
  <figure style="text-align: center; margin: 0; flex: 1; max-width: 45%;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/offline-validation-score.png' | relative_url }}" style="width: 100%; border-radius: 6px;" alt="Validation Score" data-zoomable>
    <figcaption style="margin-top: 0.5rem; font-size: 0.5em; font-weight: bold;">Validation mean score over training steps. The best checkpoint occurs early, after which performance plateaus.</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0; flex: 1; max-width: 45%;">
    <img src="{{ 'assets/img/2026-03-06-agent-evaluation/pre-post-train-accuracy.png' | relative_url }}" style="width: 100%; border-radius: 6px;" alt="Pre/Post Train Accuracy" data-zoomable>
    <figcaption style="margin-top: 0.5rem; font-size: 0.5em; font-weight: bold;">Training accuracy before and after each playbook update, cumulated by epoch. Post-train accuracy often falls below pre-train, suggesting overfitting.</figcaption>
  </figure>
</div>


Our offline results suggest that the main bottleneck is not simply **how much knowledge** the playbook stores, but **what kind of knowledge** it stores and how that knowledge is used.

First, many playbook entries are **too task-specific**, capturing narrow solution details rather than reusable strategies. Future work may need stronger **abstraction mechanisms** that distill concrete experiences into higher-level algorithmic principles that transfer across tasks.

Second, as the playbook grows, performance does not necessarily improve. In our experiments, the playbook expands from roughly **2k tokens to 62k tokens**, but the best-performing checkpoint occurs around **20k tokens**. This suggests that context evolution should focus on **selective accumulation** rather than simply growing larger contexts.

Finally, a key limitation is **weak credit assignment**. Because the model outputs only code, it is difficult to determine which playbook entries actually contributed to a solution. Future systems may benefit from better attribution or retrieval mechanisms that track which strategies are used and activate only the most relevant knowledge for each task.

This experiment highlights that Frontier-CS can serve as a useful feedback platform for evolving agents to measure their performance and continuously improve the design to achieve better quality in the future.

<div style="background: #f0f4fa; border-left: 4px solid #4a90d9; padding: 1rem 1.2rem; border-radius: 6px; margin: 1.5rem 0; color: #1a1a1a;">
📢 Overall, these results suggest that the next generation of evolving-agent systems may depend less on building larger playbooks and more on learning how to construct <strong>more structured, reusable, and selectively activated knowledge</strong>.
Many discovery problems operate in <strong>online evolutionary settings</strong>: the system repeatedly proposes solutions, receives feedback, and refines future candidates over long horizons. The key capability here is not just producing good solutions, but <strong>learning to improve from experience over time</strong>.
</div>
