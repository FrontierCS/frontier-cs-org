---
layout: distill
page_css: fcs2-patch   # the patch viewer of the task pages
title: "Sparse Video Attention That Measures Its Own Error"
description: "SVG-EAR, an ECCV 2026 method, speeds up video models by computing part of attention and estimating the rest from cluster averages. GPT-6 Astra measured each head's error as it ran, and added a variance term the method lacks. We build the method up from a one-query example to show how."
# TODO: thumbnail: assets/img/blog-thumbs/svg-ear-measured-error.svg (not drawn yet)
tags: [FrontierCS 2, Case study]
case:
  # TODO: thumbnail: assets/img/case-thumbs/svg-ear-measured-error.svg, in the MLSys tones (not drawn yet)
  task: SVG-EAR
  model: GPT-6 Astra
  # the overview's Case studies row: a one-line summary and the key result beside the thumbnail
  summary: "SVG-EAR speeds up video models by estimating the attention it skips. GPT-6 Astra measured each head's error as it ran, and added a variance term the method lacks."
  result: "18% less time"
  result_note: "per clip than the human reference on average, 891.0 s to 728.6 s; 43 of 48 checks, so no pass"

date: 2026-10-19
date_display: "October 19, 2026"

authors:
  - name: FrontierCS 2 Team

toc:
  - name: The Task
  - name: Attention for One Query
  - name: Estimating What Is Skipped
  - name: Spending the Budget Where Estimates Fail
  - name: "GPT-6 Astra: A Budget Measured per Head"
  - name: A Term the Paper Leaves Out
  - name: Results
  - name: "GPT-6.1 Sol: Exact Attention as a Yardstick"
  - name: "Gemini 4 Argon: Skipping Without an Estimate"
  - name: How the Other Models Did
  - name: References

_styles: >
  d-article .cs-fig { margin-block: 36px; }
  /* two code excerpts side by side, one above the other on phones */
  d-article .cs-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 28px 0; }
  @media (max-width: 760px) { d-article .cs-pair { grid-template-columns: 1fr; } }
  d-article .cs-pair > div { min-width: 0; }
  d-article .cs-pair .cs-cap { font-size: 15px; font-weight: 600; line-height: 1.4; margin: 0 0 8px; }
  d-article .cs-pair pre { overflow-x: auto; font-size: 12.5px; }
  /* the patch viewer of the task pages (assets/css/fcs2-patch.css); the article's own p and h3 rules would set its
     model line and heading larger than a task page does */
  d-article .cs-patch { margin: 28px 0 8px; }
  d-article .cs-patch .tsum { font-size: 15px; line-height: 1.5; margin: 0 0 12px; }
  d-article .cs-patch .pfold summary h3 { line-height: 1.5; }
---

GPT-6 Astra ran the SVG-EAR task once in [FrontierCS 2]({{ '/#leaderboard' | relative_url }}). It made the attention of two video models faster than the human reference on all twelve test clips. Its clips took 728.6 seconds on average, against 891.0, and came out closer to the exact video. Five of its 48 checks fell short, all on fidelity, so the run does not pass. No model passed this task.

Astra changed two things in the paper's method. It measures each head's error as it runs, and sets that head's budget from the measurement. When it estimates the attention it skips, it corrects for the spread inside each cluster, a term the paper lacks. Two more runs, outside the leaderboard, found the same term on their own.

## The Task

FrontierCS 2 removes the core of a paper's released code, and an agent writes it back. The authors' code is the human reference. A run passes only if its final version beats it on every metric of every hidden workload.

A video diffusion model makes a clip from noise in 50 steps. Each step runs a transformer over the clip's tokens, and a 720p clip of 81 frames has 75,600 of them. In attention, every token looks at every other token. That is the main cost [1]. With full attention, a 720p clip from Wan 2.2 takes 29 minutes on one H100 GPU [1].

SVG-EAR, a method by Zhou, Mang and colleagues at ECCV 2026 [1], computes part of attention and estimates the rest. It sorts similar tokens into clusters. It computes the pairs where an estimate would go wrong, and estimates the others from cluster averages. On the same Wan 2.2 clip it takes 16 minutes [1].

The [task]({{ '/task/#svg-ear' | relative_url }}) keeps two video models, Wan 2.1 and HunyuanVideo. It removes the SVG-EAR attention layer of each, and three routines the two share. The agent writes them back, or writes any other attention behind the same interfaces.

The judge makes twelve clips with the agent's code: eight with Wan and four with HunyuanVideo. It compares each with the clip that full attention makes from the same prompt and seed. Three image scores measure the match. Higher PSNR and SSIM are better, and lower LPIPS is better.

A pass needs every clip to take at least 4% less time than with the human reference. Its PSNR may fall at most 0.25 dB below the reference's, and its SSIM at most 0.01. Its LPIPS may rise at most 0.005. Twelve clips and four measures make 48 checks.

## Attention for One Query

Take one query token and four key tokens. The query gives each key a score: the dot product of the two vectors, over $$\sqrt d$$. Here $$d$$ is the vector length. Each key also carries a value vector. The output averages the values, and each value counts with weight $$e$$ to its score:

$$o = \frac{\sum_j e^{s_j}\, v_j}{\sum_j e^{s_j}}, \qquad s_j = \frac{q \cdot k_j}{\sqrt d}.$$

In our example the four keys fall into two clusters. Cluster A holds two keys that both score 1. Cluster B holds two keys that score 0 and 2. The weights come to about 5.4 in A and 8.4 in B, 13.8 in all.

<!-- TODO Figure 1 (not drawn; see the report): one query and four keys in two clusters, A with scores 1 and 1, B with scores 0 and 2; under each cluster its exact weight, its centroid estimate and its error. -->

The cheapest move is to skip a cluster. Sparse VideoGen2 [2], the method SVG-EAR builds on, computes the clusters with the most weight and drops the others. Drop A here, and 5.4 of the query's 13.8 is gone. The output becomes an average over B alone.

## Estimating What Is Skipped

SVG-EAR keeps an estimate of every cluster it skips. It replaces each key of the cluster with the cluster's average key, its centroid. A skipped cluster of $$n$$ keys, whose centroid scores $$\bar s$$, then gets the weight

$$n\, e^{\bar s},$$

and its values are replaced by their average. The estimate needs one score per cluster, not one per key.

In the example both centroids score 1, so the method estimates both clusters at about 5.4. For A that is exact, since its two keys score the same. For B it falls short of the true 8.4 by about 3.

## Spending the Budget Where Estimates Fail

Now suppose there is room to compute one cluster in full. A rule that ranks clusters by estimated weight sees a tie at 5.4. SVG-EAR ranks them by how wrong the estimate would be. A's estimate has no error and B's is off by 3. It computes B, estimates A, and the toy query comes out exact.

Real attention has many queries, and they form clusters too. SVG-EAR sorts the tokens so that each cluster sits together. Attention then splits into blocks, one for each pair of a query cluster and a key cluster. The task uses 300 query clusters for Wan, 400 for HunyuanVideo and 1,000 key clusters.

<!-- TODO Figure 2 (not drawn; see the report): the attention map before and after sorting by cluster, as a grid of blocks; computed blocks in the agent tone, estimated blocks hatched. -->

Checking every query against every key would cost as much as attention itself. SVG-EAR checks one probe per query cluster: the cluster's average query. It scores the probe against each key of a block and adds up the gap between estimate and truth,

$$\sum_{j \in \text{block}} \big\| e^{\bar s}\, \bar v - e^{s_j}\, v_j \big\|^2,$$

where $$s_j$$ is the probe's score for key $$j$$, and $$\bar s$$ and $$\bar v$$ belong to the key's cluster. The method divides this error by the number of token pairs in the block [1].

The size of the budget comes from Sparse VideoGen2. For each query cluster, it counts the token pairs in the blocks that hold 90% of the estimated weight. SVG-EAR spends those pairs on the blocks with the most error per pair, and estimates the rest. On Wan 2.2, the paper reports a PSNR of 24.995 dB against 23.556 for Sparse VideoGen2, at a lower density [1].

## GPT-6 Astra: A Budget Measured per Head

The 90% rule is the same for every head of every layer. Heads differ. Some attend to a few nearby tokens, and others spread over the whole clip. A share of estimated weight says little about how much error a head will make.

Astra measures the error instead. Every few denoising steps it takes a small set of real queries as probes. It computes their exact attention and compares it with its sparse result. That gives each head a measured error. Each head then runs at the lowest density cap whose error stays within a bound. A head whose cap would come out too high runs dense attention.

<!-- TODO (verify against Astra's patch, which is not in assets/patches/svg-ear.json): the brief gives "every 4 steps" and "32 probe queries"; confirm both and state them here. Confirm that the probes are query tokens, not cluster averages, and say how the bound and the caps are set. -->

Astra's probes differ from the paper's in two ways. They are real queries, where the paper uses each query cluster's average. They measure the error of a whole head. The paper estimates error block by block, inside a budget set in advance.

<!-- TODO Figure 3 (not drawn; see the report): Astra's loop for one head; every few steps, probes run exact and sparse attention, the gap sets the density cap, and a cap above the limit switches the head to dense. -->

## A Term the Paper Leaves Out

Return to cluster B, and suppose the budget leaves no room to compute it. Its estimate, 5.4, falls short of the true 8.4. The shortfall has a fixed sign. A score is linear in the key, so the centroid's score is the average of the scores. The curve $$e^x$$ bends upward, so the average of $$e^{s_j}$$ is never below $$e^{\bar s}$$. The centroid guesses low, and more so when the scores spread wide.

A second-order expansion of each $$e^{s_j}$$ around $$\bar s$$ gives the size of the gap:

$$\frac{1}{n} \sum_j e^{s_j} \approx e^{\bar s} \Big( 1 + \frac{\sigma^2}{2} \Big),$$

where $$\sigma^2$$ is the variance of the query's scores over the cluster's keys. Since a score is linear in the key, $$\sigma^2 = q^\top \Sigma\, q / d$$, where $$\Sigma$$ is the covariance of the cluster's keys. B's two scores, 0 and 2, have variance 1. The corrected estimate for B is about 8.2, against the true 8.4.

SVG-EAR gives a skipped cluster the weight $$n\, e^{\bar s}$$, with no variance term [1]. Astra adds the term to every block it estimates. Two more runs found the same correction on their own, one by GPT-6.1 Sol and one by Claude Opus 5.5. Neither is a leaderboard run. The excerpts below show the term in Astra's code and in Sol's.

<!-- TODO (verify against the patches): which form each run uses, the factor 1 + σ²/2 or the exponent e^(σ²/2); how each computes σ² (full covariance, per-dimension variances or one variance per cluster); and whether either also corrects the averaged values. -->

<div class="cs-pair" markdown="1">
<div markdown="1">
<p class="cs-cap">GPT-6 Astra, leaderboard run</p>

<!-- TODO: Astra leaderboard-run snippet. Its final patch is not in assets/patches/svg-ear.json, which holds Claude Opus 5.5's patch alone; export it first. -->

</div>
<div markdown="1">
<p class="cs-cap">GPT-6.1 Sol, a run outside the leaderboard</p>

<!-- TODO: Sol exploration-run snippet -->

</div>
</div>

## Results

Astra beat the human reference on speed on all twelve clips. Its clips took 728.6 seconds on average, against 891.0. On average it beat the reference on all three image scores as well. Its PSNR was 23.77 dB against 21.67, its SSIM 0.7973 against 0.7665, and its LPIPS 0.1864 against 0.215.

Five checks fell short: LPIPS on two clips, SSIM on two and PSNR on one. No run was faster on average. Only GPT-6.1 Sol, with exact attention, came closer to the dense videos.

<!-- TODO (needs a per-clip export; the site files hold means and counts): the brief says the misses are on two Wan clips, wan_2 and wan_5; that Astra runs at 0.78 to 0.80 times the reference's time on Wan and 0.94 on HunyuanVideo, against the 0.96 limit; and that its hunyuan_3 PSNR is 28.96 dB against 24.76. -->

<!-- TODO Figure 4 (not drawn; see the report): each model's mean time per clip against its mean PSNR, with the human reference as a cross; GPT-6 Astra low and right, GPT-6.1 Sol high and right. -->

The task scored the run 48.59, the highest on this task, against 33.9 for the human reference. The run cost $77.24, the most of any run here.

<!-- TODO: export GPT-6 Astra's final patch to assets/patches/cases/svg-ear-astra.json (bin/fcs2_patches_from_platform.py --export=DIR, as for the BBQ case study), then uncomment the three lines below.
The patch below is the final submission, the code the hidden workloads scored.
<div class="tsol taskpage cs-patch" data-patch data-model="GPT-6 Astra"><a href="{{ '/assets/patches/cases/svg-ear-astra.json' | relative_url }}" hidden></a></div>
<script defer src="{{ '/assets/js/fcs2-patch.js' | relative_url }}"></script>
-->

## GPT-6.1 Sol: Exact Attention as a Yardstick

GPT-6.1 Sol's leaderboard run ended with no sparse attention at all. Its final version computes every clip with exact attention, through a faster dense kernel.

<!-- TODO (verify against Sol's leaderboard patch, not in the repo): that the final version is dense on every layer and step, and which kernel it calls; the brief says FlashAttention 3. -->

Its clips took 941.8 seconds on average, against 891.0, so it lost all twelve speed checks. Its fidelity was the best of any run: PSNR 25.38 dB, SSIM 0.808 and LPIPS 0.1721. Its clips are not copies of the dense targets: an identical clip has infinite PSNR.

Sol beat the reference's PSNR on 11 clips, its LPIPS on 10 and its SSIM on 9. Exact attention missed six fidelity checks, and Astra's sparse attention missed five. Skipping work is not the only way to miss the bands.

<!-- TODO (needs a per-clip export): the brief says Sol misses on the same two clips as Astra, wan_2 and wan_5. Sol misses SSIM on three clips, so its misses cover at least three clips. -->

The score makes a second point. It has no thresholds. It rewards fidelity, and speed against the dense run that made each target. A clip with perfect fidelity, no faster than that run, scores 25. Sol beat the time of the dense runs and kept its fidelity high. It scored 38.42, above the human reference's 33.9, and does not pass.

## Gemini 4 Argon: Skipping Without an Estimate

Gemini 4 Argon went back to Sparse VideoGen2. It computes the blocks with the most weight and drops the rest, with no estimate. This is the first move of the toy example, where A's weight was lost.

<!-- TODO (verify against Gemini 4 Argon's leaderboard patch, not in the repo): that it keeps no estimate of the dropped blocks. -->

It passed all twelve speed checks, at 833.0 seconds per clip on average. It lost on fidelity. It beat the reference's LPIPS on 4 of the 12 clips, and its PSNR and SSIM on 5. Its mean PSNR was 21.21 dB, against 21.67.

<!-- TODO (needs a per-clip export): the brief says all four HunyuanVideo clips fail on fidelity. The counts above mean LPIPS misses on eight clips, so the misses reach at least four Wan clips too. -->

Dropping the estimate did not buy the most speed. Astra's clips, estimates and all, took 728.6 seconds. Gemini 4 Argon's run scored 34.98.

## How the Other Models Did

No model passed SVG-EAR. Seven runs beat the human reference on speed on all twelve clips: GPT-6 Astra, Claude Opus 5.5, Kimi K3, DeepSeek V4.1 Flash, GLM 5.3 Flash, Qwen 3.8 Max and Gemini 4 Argon. Apart from Astra and Sol, no run beat the reference on more than 8 clips in any image score.

Claude Opus 5.5 rebuilt the paper's error-aware choice. Its budget covers a share of the estimated error, not of the weight. It passed every speed check. It beat the reference's SSIM on 8 clips, its PSNR on 7 and its LPIPS on 5. It scored 37.42.

Five more runs scored above the human reference, from 34.25 to 36.86. They are Kimi K3, DeepSeek V4.1 Flash, Muse Spark 1.3, GLM 5.3 Flash and Muse Wonder 1.0. Qwen 3.8 Max, GLM 5.3 and Step 5 Preview scored 20.91, 15.35 and 7.39. GLM 5.3 and Step 5 Preview lost every speed check.

<!-- TODO Figure 5 (not drawn; see the report): for each model, the clips out of 12 on which it beat the human reference, one column per measure (time, PSNR, SSIM, LPIPS). -->

## References

1. Xuanyi Zhou, Qiuyang Mang, Shuo Yang, Haocheng Xi, Jintao Zhang, Huanzhi Mao, Joseph E. Gonzalez, Kurt Keutzer, Ion Stoica and Alvin Cheung. SVG-EAR: Parameter-free linear compensation for sparse video generation via error-aware routing. In *European Conference on Computer Vision, ECCV 2026*. [arXiv 2603.08982](https://arxiv.org/abs/2603.08982).
2. S. Yang, H. Xi, Y. Zhao and others. Sparse VideoGen2: Accelerate video generation with sparse attention via semantic-aware permutation. *arXiv preprint*, 2025. [arXiv 2505.18875](https://arxiv.org/abs/2505.18875).
