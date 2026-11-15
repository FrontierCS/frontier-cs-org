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
  d-article .cs-chart .chead { display: flex; justify-content: space-between; gap: 12px; font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  d-article .cs-chart .bb-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--ink); margin-bottom: 12px; }
  d-article .cs-chart .bb-legend span { display: inline-flex; align-items: center; gap: 7px; }
  d-article .cs-chart .bb-legend i { width: 12px; height: 12px; display: inline-block; }
  d-article .cs-chart .bb-plot { position: relative; }
  d-article .cs-chart .bb-plot svg { display: block; width: 100%; height: auto; overflow: visible; font-family: var(--sans); }
  d-article .cs-chart .bb-tip { position: absolute; z-index: 5; pointer-events: none; background: #fff; border: 1px solid var(--line-2); box-shadow: 0 6px 18px rgba(32,33,36,.14); border-radius: 6px; padding: 8px 10px; font-size: 13px; line-height: 1.4; white-space: nowrap; color: var(--ink); }
  d-article .cs-chart .cfoot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted-2); }
  d-article .cs-chart .cfoot .clogo { display: inline-flex; align-items: center; gap: 6px; flex: none; white-space: nowrap; font: 500 15px/1 'Instrument Sans', var(--sans); letter-spacing: -.01em; color: var(--ink); }
  d-article .cs-chart .cfoot .clogo svg { width: 13px; height: 13px; min-width: 0; display: inline; }
---

<!-- Source: the public release FrontierCS2/FrontierCS-2-runs (results, run traces, metadata of 14 November 2026). -->

FrontierCS 2 runs 25 agents, each a model inside a coding harness, on 48 research tasks, one run per agent and task. Every run gets 5 hours and a budget of 3 to 100 submissions for feedback on a dev set. Each submission returns a score and a set of checks. A run passes only if its final patch beats the human reference on every hidden workload and metric. The median agent used 41% of its time and 29% of its submission budget.

<figure class="cs-fig cs-chart"><div class="chead"><span>Share of the budget each agent used</span></div><div class="bb-legend"><span><i style="background:#00a5a6"></i>Time (5 hours per task)</span><span><i style="background:#034752"></i>Submissions for dev feedback</span></div><div class="bb-plot" id="budget-plot"></div><div class="cfoot">{% include chart_logo.html %}<span>Wenhao Chai</span></div></figure>

MiniMax-M3.1-Flash used the largest share of its time, Kimi K2.7 the largest share of its submissions, and Qwen 3.8 Max the smallest share of both. Across the 25 agents the two shares are unrelated, with a rank correlation of -0.02. The number of submissions also barely changes with the budget. On the 25 tasks with a budget of 100 submissions, the median run used 6. On the 7 tasks with a budget of 3, it used all 3.

The median run started its final evaluation 1.84 hours into its 5 hours. Many runs stopped while the dev checks still showed that the work was not done. In 780 runs the final patch had not passed every dev check, because a check failed, the patch was never sent to the dev set, or there was no final patch. Of these runs, 81% stopped with at least an hour left, at a median of 2.01 hours.

The dev checks predict the hidden result. Of the 420 runs whose final patch passed every dev check, 64.5% passed the hidden test. Of the other 780 runs, 5.4% did. Unused time and submissions are unused chances to check the work.

For people who build agents, this suggests showing the agent the time and submissions it has left, and having it spend them while a dev check fails. For benchmarks, it suggests reporting how much of the budget each agent uses next to its score.

## Method

All numbers come from the public [FrontierCS 2 run dataset](https://huggingface.co/datasets/FrontierCS2/FrontierCS-2-runs), metadata of 14 November 2026. Time used is the hour at which the final evaluation started, capped at 5 hours, averaged over the 48 runs of an agent and divided by 5 hours. Submissions used is the number of submissions sent for dev feedback divided by the budget of that task, averaged over the 48 tasks. The budget of each run is the one the platform reported to the agent.

The analysis is observational, with one formal run per agent and task.

<!-- The chart data: fcs2-time-submit scripts/export_budget_shares.py (time and submission shares per agent, each averaged over its 48 tasks). -->
<script type="application/json" id="budget-data">[{"model":"MiniMax-M3.1-Flash","harness":"Claude Code","time":79.0,"subs":24.0},{"model":"Gemini 4 Carbon","harness":"Antigravity","time":67.5,"subs":28.6},{"model":"Gemini 4 Hydrogen","harness":"Antigravity","time":66.7,"subs":28.6},{"model":"Step 5 Preview","harness":"Step Code","time":53.9,"subs":20.5},{"model":"Gemini 4 Argon","harness":"Antigravity","time":52.7,"subs":30.1},{"model":"GLM 5.3 Flash","harness":"ZCode","time":51.7,"subs":26.0},{"model":"Kimi K2.7","harness":"Kimi Code","time":51.2,"subs":54.5},{"model":"Claude Sonnet 5.5","harness":"Claude Code","time":48.1,"subs":32.3},{"model":"Gemini 4 Argon","harness":"Pi","time":47.2,"subs":22.3},{"model":"Claude Opus 5.5","harness":"Claude Code","time":43.6,"subs":30.4},{"model":"Kimi K3","harness":"Kimi Code","time":42.0,"subs":27.5},{"model":"Kimi K3.1 Pro","harness":"Kimi Code","time":41.2,"subs":39.4},{"model":"Claude Fable 5.1","harness":"Claude Code","time":41.2,"subs":30.7},{"model":"GLM 5.3","harness":"ZCode","time":39.5,"subs":25.5},{"model":"Muse Spark 1.3","harness":"Muse Code","time":38.0,"subs":29.0},{"model":"GPT-6.1 Sol","harness":"Codex CLI","time":37.5,"subs":42.3},{"model":"Muse Wonder 1.0","harness":"Muse Code","time":37.0,"subs":40.2},{"model":"DeepSeek V4.1 Flash","harness":"DeepSeek Harness","time":36.5,"subs":28.9},{"model":"DeepSeek V4.1 Flash 1017","harness":"DeepSeek Harness","time":35.4,"subs":32.4},{"model":"Inkling 2 Small","harness":"Pi","time":34.8,"subs":23.6},{"model":"GPT-6 Astra","harness":"Codex CLI","time":34.4,"subs":36.2},{"model":"GPT-6.1 Terra","harness":"Codex CLI","time":31.2,"subs":44.7},{"model":"Inkling 2 Small","harness":"Claude Code","time":30.5,"subs":22.4},{"model":"Inkling 2 Small","harness":"OpenCode","time":30.1,"subs":22.5},{"model":"Qwen 3.8 Max","harness":"Qwen Code","time":29.0,"subs":19.1}]</script>
<script defer src="{{ '/assets/js/blog-budget-share.js' | relative_url }}"></script>
