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

Astra measures the error instead. Every fourth denoising step, it takes 32 query tokens as probes, at equal spacing over the tokens in cluster order. It computes their exact attention over every key. It then rebuilds their output the sparse way, under three caps. Each query cluster may compute 12%, 25% or 50% of the keys.

Each head runs at the lowest cap that passes a bound. The mean squared gap must stay under 0.0005 times the mean square of the exact output. A head that fails even at 50% runs dense attention until the next check.

Inside its cap, a head ranks blocks by estimated weight, the older rule, not by error. It keeps blocks until they hold 98% of that weight or fill the cap. Astra moves the error check from blocks to heads. The paper checks each block with a cluster's average query, inside a budget fixed in advance. Astra checks each head with real queries, and lets that error set the budget.

<!-- TODO Figure 3 (not drawn; see the report): Astra's loop for one head; every fourth step, 32 probes run exact attention and the sparse path under caps of 12%, 25% and 50%; the lowest cap within the bound wins, and a head that fails all three runs dense. -->

## A Term the Paper Leaves Out

Return to cluster B, and suppose the budget leaves no room to compute it. Its estimate, 5.4, falls short of the true 8.4. The shortfall has a fixed sign. A score is linear in the key, so the centroid's score is the average of the scores. The curve $$e^x$$ bends upward, so the average of $$e^{s_j}$$ is never below $$e^{\bar s}$$. The centroid guesses low, and more so when the scores spread wide.

A second-order expansion of each $$e^{s_j}$$ around $$\bar s$$ gives the size of the gap:

$$\frac{1}{n} \sum_j e^{s_j} \approx e^{\bar s} \Big( 1 + \frac{\sigma^2}{2} \Big) \approx e^{\bar s + \sigma^2/2},$$

where $$\sigma^2$$ is the variance of the query's scores over the cluster's keys. The last form puts the fix inside the score. A kernel that already scores each centroid adds one term, and nothing else changes.

In terms of the keys, $$\sigma^2 = q^\top \Sigma\, q / d$$, where $$\Sigma$$ is the covariance of the cluster's keys. Every run in this section keeps one variance per key coordinate, and ignores how coordinates move together:

$$\sigma^2 \approx \frac{1}{d} \sum_{i=1}^{d} q_i^2 \operatorname{Var}(k_i).$$

B's two scores, 0 and 2, have variance 1. The corrected estimate is about 9.0, against the true 8.4. It overshoots here, but it lands far closer than 5.4.

SVG-EAR gives a skipped cluster the weight $$n\, e^{\bar s}$$, with no variance term [1]. Astra adds the term to every block it estimates, at a strength it sets per head. On the probes it tries the term at 0, ½, 1 and 1½ times its full size. It keeps the strength with the smallest error.

Two runs off the leaderboard found the same term on their own. They come from a batch of exploration runs, which the leaderboard does not count. GPT-6.1 Sol's exploration run adds the full term to every estimated score, capped at 2. It scored 49.28 there, and it failed as well. Claude Opus 5.5's exploration run uses the same form at half strength, and on HunyuanVideo only. All three runs use the plain average of the values, with no correction.

<div class="cs-pair" markdown="1">
<div markdown="1">
<p class="cs-cap">GPT-6 Astra, leaderboard run: <code>svg/solver_extensions/adaptive.py</code>, lines 67 to 74</p>

```python
group_scores = sampled_queries @ key_means.float().transpose(-2, -1) / dim**.5
variance_scores = sampled_queries.square() @ key_vars.float().transpose(-2, -1) / (2 * dim)
group_scores += col_sizes.clamp_min(1).float().log().unsqueeze(-2)
tail_candidates = []
for factor in (0., .5, 1., 1.5):
    group_weights = (group_scores + factor * variance_scores - maximum).exp()
    group_weights.masked_fill_(col_sizes.unsqueeze(-2) == 0, 0.)
    tail_candidates.append(group_weights)
```

</div>
<div markdown="1">
<p class="cs-cap">GPT-6.1 Sol, exploration run off the leaderboard: <code>svg/solver_extensions/clustered.py</code>, lines 85 to 89</p>

```python
scores = tl.dot(queries, keys) * (dim ** -0.5)
if corrected:
    variances = tl.load(variance + (head_idx * key_clusters + key_idx[None, :]) * dim + channels[:, None],
                        (key_idx[None, :] < key_clusters) & (channels[:, None] < dim), 0)
    scores += 0.5 * tl.minimum(tl.dot(queries_squared, variances) / dim, 4.0)
```

</div>
</div>

In both, the new term is the squared query against the per-coordinate key variances, over $$2d$$. Astra's excerpt is the probe check, which tries four strengths for each head. Its kernel in <code>sparse.py</code> then applies the chosen strength. Sol's excerpt sits in its kernel and applies one strength everywhere.

## Results

Astra beat the human reference on speed on all twelve clips. Its clips took 728.6 seconds on average, against 891.0. On average it beat the reference on all three image scores as well. Its PSNR was 23.77 dB against 21.67, its SSIM 0.7973 against 0.7665, and its LPIPS 0.1864 against 0.215.

Five checks fell short: LPIPS on two clips, SSIM on two and PSNR on one. No run was faster on average. Only GPT-6.1 Sol, with exact attention, came closer to the dense videos.

All five fell on two Wan clips. On Wan clip 2 it missed all three image scores, and on Wan clip 5 it missed LPIPS and SSIM. On the Wan clips it took 0.78 to 0.80 of the reference's time. On HunyuanVideo it took 0.94 to 0.95, close to the limit of 0.96. Away from those two clips it often beat the reference by a wide margin. On HunyuanVideo clip 3 its PSNR was 28.96 dB, against 24.76.

<!-- Per-clip numbers: the platform's per-workload export of the leaderboard runs' final evidence (exports/metric-values-1018a, merged), final suite only. -->

<!-- TODO Figure 4 (not drawn; see the report): each model's mean time per clip against its mean PSNR, with the human reference as a cross; GPT-6 Astra low and right, GPT-6.1 Sol high and right. -->

Astra saves time outside the estimate too. Its dense steps and dense heads run on FlashInfer's dense kernel, the one Sol uses below. It reclusters the tokens every other step, with 12 k-means rounds at the start and 1 per step. The human reference runs 50 and 2.

The task scored the run 48.59, the highest on this task, against 33.9 for the human reference. The run cost $77.24, the most of any run here.

The patch below is the final submission, the code the hidden workloads scored.

<div class="tsol taskpage cs-patch" data-patch data-model="GPT-6 Astra"><a href="{{ '/assets/patches/cases/svg-ear-astra.json' | relative_url }}" hidden></a></div>
<script defer src="{{ '/assets/js/fcs2-patch.js' | relative_url }}"></script>

## GPT-6.1 Sol: Exact Attention as a Yardstick

GPT-6.1 Sol's leaderboard run ended with no sparse attention at all. Both of its processors return exact attention before any clustering. They call FlashInfer's dense kernel and ask first for its FlashAttention 3 backend. The sparse path is still in the files, behind a switch set to dense.

Its clips took 941.8 seconds on average, against 891.0, so it lost all twelve speed checks. Its fidelity was the best of any run: PSNR 25.38 dB, SSIM 0.808 and LPIPS 0.1721. Its clips are not copies of the dense targets: an identical clip has infinite PSNR.

Sol beat the reference's PSNR on 11 clips, its LPIPS on 10 and its SSIM on 9. Exact attention missed six fidelity checks, and Astra's sparse attention missed five. Skipping work is not the only way to miss the bands.

The misses fell where Astra's did. Exact attention missed all three image scores on Wan clip 2, and LPIPS and SSIM on Wan clip 5. These are the five checks Astra missed. Sol missed one more, SSIM on Wan clip 1. On those two clips, then, Astra's misses do not come from skipping work. Exact attention misses them too.

The score makes a second point. It has no thresholds. It rewards fidelity, and speed against the dense run that made each target. A clip with perfect fidelity, no faster than that run, scores 25. Sol beat the time of the dense runs and kept its fidelity high. It scored 38.42, above the human reference's 33.9, and does not pass.

## Gemini 4 Argon: Skipping Without an Estimate

Gemini 4 Argon went back to Sparse VideoGen2. Its SVG-EAR processors only call the Sparse VideoGen2 processors they inherit from. Those compute the blocks with the most weight and drop the rest. The routine meant to merge in the estimate computes the chosen blocks and nothing more. This is the first move of the toy example, where A's weight was lost.

It passed all twelve speed checks, at 833.0 seconds per clip on average. It lost on fidelity. It beat the reference's LPIPS on 4 of the 12 clips, and its PSNR and SSIM on 5. Its mean PSNR was 21.21 dB, against 21.67.

Its misses covered all four HunyuanVideo clips, on every image score, and four of the eight Wan clips. On HunyuanVideo its PSNR fell below the reference's on every clip, while Astra's rose above it on every clip. Gemini 4 Argon kept no estimate of the dropped blocks; Astra kept one.

Dropping the estimate did not buy the most speed. Astra's clips, estimates and all, took 728.6 seconds. Gemini 4 Argon's run scored 34.98.

## How the Other Models Did

No model passed SVG-EAR. Seven runs beat the human reference on speed on all twelve clips: GPT-6 Astra, Claude Opus 5.5, Kimi K3, DeepSeek V4.1 Flash, GLM 5.3 Flash, Qwen 3.8 Max and Gemini 4 Argon. Apart from Astra and Sol, no run beat the reference on more than 8 clips in any image score.

Claude Opus 5.5 rebuilt the paper's error-aware choice. Its budget covers a share of the estimated error, not of the weight. It passed every speed check. It beat the reference's SSIM on 8 clips, its PSNR on 7 and its LPIPS on 5. It scored 37.42.

Five more runs scored above the human reference, from 34.25 to 36.86. They are Kimi K3, DeepSeek V4.1 Flash, Muse Spark 1.3, GLM 5.3 Flash and Muse Wonder 1.0. Qwen 3.8 Max, GLM 5.3 and Step 5 Preview scored 20.91, 15.35 and 7.39. GLM 5.3 and Step 5 Preview lost every speed check.

<!-- TODO Figure 5 (not drawn; see the report): for each model, the clips out of 12 on which it beat the human reference, one column per measure (time, PSNR, SSIM, LPIPS). -->

## References

1. Xuanyi Zhou, Qiuyang Mang, Shuo Yang, Haocheng Xi, Jintao Zhang, Huanzhi Mao, Joseph E. Gonzalez, Kurt Keutzer, Ion Stoica and Alvin Cheung. SVG-EAR: Parameter-free linear compensation for sparse video generation via error-aware routing. In *European Conference on Computer Vision, ECCV 2026*. [arXiv 2603.08982](https://arxiv.org/abs/2603.08982).
2. S. Yang, H. Xi, Y. Zhao and others. Sparse VideoGen2: Accelerate video generation with sparse attention via semantic-aware permutation. *arXiv preprint*, 2025. [arXiv 2505.18875](https://arxiv.org/abs/2505.18875).
