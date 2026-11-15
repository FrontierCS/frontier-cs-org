---
layout: distill
title: "Agents do not budget their time or their submissions"
description: "Across 1,200 FrontierCS 2 runs, the median agent used 41% of its time and 29% of its submission budget, and its use of submissions barely changes with the size of the budget."
tags: [FrontierCS 2, Evaluation]
thumbnail: assets/img/blog-thumbs/budget-blind-agents.jpg
og_image: assets/img/blog/budget-blind-agents/share-card.jpg

date: 2026-11-14
date_display: "November 14, 2026"

authors:
  - name: Wenhao Chai on behalf of FrontierCS 2 Team

_styles: >
  d-article .cs-fig { margin-block: 36px; }
  .ar-main .cs-fig img.cs-tall { width: 100% !important; max-width: 600px !important; height: auto; max-height: none; }   /* a tall chart: past the 520 px cap of post images */
---

<!-- Source: the public release FrontierCS2/FrontierCS-2-runs (results, run traces, metadata of 14 November 2026). -->

FrontierCS 2 runs 25 agents, each a model inside a coding harness, on 48 research tasks, one run per agent and task. Every run gets 5 hours and a budget of 3 to 100 submissions for feedback on a dev set. Each submission returns a score and a set of checks. A run passes only if its final patch beats the human reference on every hidden workload and metric. The median agent used 41% of its time and 29% of its submission budget.

<figure class="cs-fig"><img class="cs-tall" src="{{ '/assets/img/blog/budget-blind-agents/budget-share.png' | relative_url }}" width="1600" height="3420" alt="Bar chart of the share of its budget each of the 25 agents used, averaged over its 48 FrontierCS 2 tasks. Time used ranges from 29% for Qwen 3.8 Max to 79% for MiniMax-M3.1-Flash, with a median of 41%. Submissions used range from 19% for Qwen 3.8 Max to 55% for Kimi K2.7, with a median of 29%."></figure>

MiniMax-M3.1-Flash used the largest share of its time, Kimi K2.7 the largest share of its submissions, and Qwen 3.8 Max the smallest share of both. Across the 25 agents the two shares are unrelated, with a rank correlation of -0.02. The number of submissions also barely changes with the budget. On the 25 tasks with a budget of 100 submissions, the median run used 6. On the 7 tasks with a budget of 3, it used all 3.

The median run started its final evaluation 1.84 hours into its 5 hours. Many runs stopped while the dev checks still showed that the work was not done. In 780 runs the final patch had not passed every dev check, because a check failed, the patch was never sent to the dev set, or there was no final patch. Of these runs, 81% stopped with at least an hour left, at a median of 2.01 hours.

The dev checks predict the hidden result. Of the 420 runs whose final patch passed every dev check, 64.5% passed the hidden test. Of the other 780 runs, 5.4% did. Unused time and submissions are unused chances to check the work.

For people who build agents, this suggests showing the agent the time and submissions it has left, and having it spend them while a dev check fails. For benchmarks, it suggests reporting how much of the budget each agent uses next to its score.

## Method

All numbers come from the public [FrontierCS 2 run dataset](https://huggingface.co/datasets/FrontierCS2/FrontierCS-2-runs), metadata of 14 November 2026. Time used is the hour at which the final evaluation started, capped at 5 hours, averaged over the 48 runs of an agent and divided by 5 hours. Submissions used is the number of submissions sent for dev feedback divided by the budget of that task, averaged over the 48 tasks. The budget of each run is the one the platform reported to the agent.

The analysis is observational, with one formal run per agent and task.
