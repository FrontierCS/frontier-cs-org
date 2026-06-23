---
layout: distill
title: "Humans Still Beat AI in the Long Horizon: Revisiting Test-Time Scaling in the Agent Era"
description: "Agents can spend test-time compute by trying, observing, and revising. We derive an Elo reference for repeated sampling, then show that in a 2022 two-week coding marathon, current agents plateau within 24 hours while top humans keep improving."
image: assets/img/2026-06-16-humans-still-beat-ai/human-vs-agent-elo.png
thumbnail: assets/img/2026-06-16-humans-still-beat-ai/human-vs-agent-elo.png
og_image: assets/img/2026-06-16-humans-still-beat-ai/human-vs-agent-elo.png

date: 2026-06-16
date_display: "June 16, 2026"
htmlwidgets: true

authors:
  - name: Qiuyang Mang
    url: "https://joyemang33.github.io/"
    affiliations:
      name: UC Berkeley
  - name: Kaiyuan Liu
    url: "mailto:lky04@cs.washington.edu"
    affiliations:
      name: University of Washington
  - name: Bo Peng
    affiliations:
      name: Princeton University
  - name: Shreyas Pimpalgaonkar
    affiliations:
      name: Bespoke Labs
  - name: Luke Zettlemoyer
    affiliations:
      name: University of Washington
  - name: Alex Dimakis
    url: "https://people.eecs.berkeley.edu/~alexdimakis/"
    affiliations:
      name: UC Berkeley and Bespoke Labs
  - name: Alvin Cheung
    url: "https://people.eecs.berkeley.edu/~akcheung/"
    affiliations:
      name: UC Berkeley

toc:
  - name: Agents Bring Intrinsic Test-Time Strategies
  - name: A Simple Model for Test-Time Scaling
  - name: Agents Struggle, Humans Do More Than Sample
    subsections:
      - name: Methodology
      - name: Results
  - name: Takeaways for Agentic Test-Time Scaling
  - name: Citing Us

_styles: >
  .post.distill > .fc-post-hero {
    display: none;
  }
  d-article img {
    height: auto;
    display: block;
    margin: 1.5rem auto 0.6rem;
    border-radius: 6px;
  }
  d-article img.w60 {
    max-width: 60%;
  }
  d-article img.w62 {
    max-width: 62%;
  }
  d-article img.w70 {
    max-width: 70%;
  }
  d-article img.full {
    max-width: 100%;
  }
  d-article .caption {
    color: #5b6575;
    font-size: 0.9em;
    line-height: 1.45;
    text-align: center;
    margin: 0 auto 1.5rem;
  }
  d-article .tldr {
    font-size: 1rem;
    line-height: 1.65;
    margin: 0 0 1.5rem;
  }
  d-article .takeaways {
    padding-left: 1.1rem;
    margin-left: 0;
  }
  d-article .takeaways li + li {
    margin-top: 0.65rem;
  }
  d-article .citation-code-block pre,
  d-article .citation-code-block code,
  d-article .citation-code-block .highlight,
  d-article .citation-code-block .highlight * {
    color: #111827 !important;
  }
  d-article .citation-code-block pre {
    background-color: rgba(0, 50, 98, 0.04);
    border: 1px solid #d8dee9;
    padding: 0.9rem 1rem;
    border-radius: 6px;
  }
  @media (max-width: 720px) {
    d-article img.w60,
    d-article img.w62,
    d-article img.w70 {
      max-width: 100%;
    }
  }
---

<p class="tldr"><strong>TL;DR.</strong> Agents can spend test-time compute by trying, observing, and revising, so we ask whether their gains come from a better internal strategy or from something close to repeated sampling. We derive a simple Elo reference line: repeated sampling is linear in log test-time compute. In a 2022 two-week coding marathon, current agents plateau within 24 hours, while top humans keep improving over the official two weeks. The takeaway is that humans still do much better long-horizon test-time adaptation, and agent strategies have a lot of room to improve.</p>

## Agents Bring Intrinsic Test-Time Strategies

OpenAI's [o1 report](https://openai.com/index/learning-to-reason-with-llms/) showed that more test-time compute can improve model performance. Many papers followed, especially on verifiable tasks like code and math ([Snell et al.](https://arxiv.org/abs/2408.03314), [Large Language Monkeys](https://arxiv.org/abs/2407.21787), [Noam Brown's recent post](https://x.com/polynoamial/status/2064210146558136827)). The common plot is success rate versus the log number of trials, or log test-time compute. These curves often rise superlinearly before they saturate.

<img class="w60" src="{{ 'assets/img/2026-06-16-humans-still-beat-ai/large-language-monkeys-math-oracle-verifier.png' | relative_url }}" alt="MATH oracle verifier coverage as the number of samples increases">

<p class="caption">Coverage on MATH with an oracle verifier as the number of samples increases, from <a href="https://arxiv.org/abs/2407.21787">Large Language Monkeys</a>.</p>

These studies measure model performance under an external test-time strategy. The strategy is fixed outside the model: sample many candidate solutions, check them with a verifier, and report pass@k or coverage.

However, agents change this setup. During a run, an agent can try a solution, observe the result, reflect on what failed, and revise its next attempt. This raises the question we study: <strong>when an agent improves with more test-time compute, is it using a better test-time strategy, or is it mostly reproducing repeated sampling?</strong>

<img class="w70" src="{{ 'assets/img/2026-06-16-humans-still-beat-ai/agent-vs-repeated-sampling-loop.png' | relative_url }}" alt="External repeated sampling versus an agent internal test-time loop">

<p class="caption">Repeated sampling is fixed outside the model, while an agent can use feedback inside the run.</p>

## A Simple Model for Test-Time Scaling

We first write down the simplest model behind the usual pass@k curves: repeated sampling. The model treats each attempt as an independent draw from the same continuous score distribution. For one task, let $$X$$ be the score of one sample and let $$\tau$$ be the threshold for success. Then one sample succeeds with probability

$$
p = \operatorname{Pr}(X \geq \tau).
$$

With $$k$$ independent samples, pass@k is

$$
\operatorname{Pr}\left(\max_{1 \leq i \leq k} X_i \geq \tau\right)
= 1 - (1 - p)^k.
$$

For a dataset with multiple tasks, the usual test-time scaling curve averages this quantity across tasks. This gives a curve of mean pass@k, or coverage, as a function of the number of samples.

However, this evaluation is awkward for agents. An agent usually stops once it solves the task, so it is not natural to keep asking for more independent samples after success. For open-ended tasks such as [FrontierCS](https://frontier-cs.org/), we could instead compare runs by the task's own score. But raw-score gains are hard to interpret. In circle-packing tasks studied by [AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/), improving the objective value from 1 to 2 can be trivial, while improving it from 2.35 to 2.36 can require a much harder improvement. The score number does not by itself tell us how much capability changed. We therefore want a comparison that asks a simpler question: <strong>when one candidate spends more test-time compute than another candidate on the same task, how often does it produce the better answer?</strong>

Following the same repeated-sampling model, this becomes a pairwise question. If one candidate gets $$k_a$$ independent attempts and another gets $$k_b$$ independent attempts, the pairwise win probability is

$$
\operatorname{Pr}\left(\max_{1 \leq i \leq k_a} X_i > \max_{1 \leq j \leq k_b} X'_j\right)
= \frac{k_a}{k_a + k_b},
$$

where $$X_i$$ and $$X'_j$$ are independent attempts on the same task.

Now comes the useful part. A Bradley-Terry model converts pairwise win rates into a one-dimensional strength scale. If candidate $$a$$ has BT log-strength $$\theta_a$$ and candidate $$b$$ has BT log-strength $$\theta_b$$, then

$$
\operatorname{Pr}(a \text{ beats } b)
= \frac{\exp(\theta_a)}{\exp(\theta_a) + \exp(\theta_b)}.
$$

We can see that, for repeated sampling, the pairwise win probability above is exactly matched by

$$
\theta_a = \log k_a + c,
$$

for any constant $$c$$.

<strong>Thus, repeated sampling is a test-time strategy whose Elo is linear in log test-time compute.</strong> This is super helpful because it gives us a reference line. To judge an agent's intrinsic test-time strategy, we can plot its Elo curve as test-time compute increases and compare it to this line. If the curve is above, below, or close to linear, the agent's strategy is better than, worse than, or equivalent to repeated sampling.

<img class="w60" src="{{ 'assets/img/2026-06-16-humans-still-beat-ai/repeated-sampling-elo-reference.png' | relative_url }}" alt="Repeated sampling forms a linear Elo reference line as log test-time compute increases">

<p class="caption">Repeated sampling gives a linear reference line in Elo versus log test-time compute.</p>

## Agents Struggle, Humans Do More Than Sample

With this reference line in hand, we can ask what happens in real long-horizon tasks. We compare agent trajectories against the repeated-sampling line, and we also ask: <strong>how do they compare to top humans working on the same tasks?</strong>

We study [AtCoder Heuristic Contest 014: RectJoin](https://atcoder.jp/contests/ahc014/tasks/ahc014_a), <strong>a long-horizon coding and optimization contest in 2022</strong>. Human contestants write algorithms and can submit many code solutions during the contest, and the leaderboard keeps the best score they achieve. Since the contest happened before modern coding agents were widely available, these human trajectories are not assisted by AI agents. The task is open-ended: there is no known optimal solution, only better and worse scores.

At a high level, RectJoin starts with marked dots on a grid. A solver repeatedly chooses three existing dots and one empty grid point that form a valid axis-aligned or 45-degree rectangle, then marks the new point and draws the rectangle boundary. The objective is to maximize a weighted score over the final marked dots, where dots farther from the center have larger weight.

<img class="w62" src="{{ 'assets/img/2026-06-16-humans-still-beat-ai/ahc014-rectjoin-example.gif' | relative_url }}" alt="AtCoder Heuristic Contest 014 RectJoin visualization">

<p class="caption">Visualization of RectJoin from <a href="https://atcoder.jp/contests/ahc014/tasks/ahc014_a">AtCoder Heuristic Contest 014</a>.</p>

### Methodology

<em>Human trajectories.</em> For humans, we study two groups from the final standings: <strong>the top 10 contestants</strong> and <strong>the top 50 contestants</strong>. At each checkpoint, we compute prefix-best scores. This gives one vector for each human group at each checkpoint, where each entry is a contestant's best score up to that time.

<em>Agent setting.</em> We recreate the contest setting for agents. Using the [FrontierCS](https://frontier-cs.org/) evaluation layer, each agent runs in a continuous 24-hour loop. It can keep submitting candidates, observe scores, and revise its next attempt, just like a human contestant. If it stops early, we resume the same session rather than starting a fresh run.

We test two agent systems: <strong>Claude Opus 4.6 with Claude Code</strong>, and <strong>GPT-5.5 with Codex</strong>. For each agent system, we run five independent 24-hour trials. At every wall-clock checkpoint we care about, we collect the prefix-best score from each trial. This gives a length-5 vector for each agent system at each checkpoint.

Once we have these vectors, we can estimate pairwise win rates directly. For example, one vector might contain the prefix-best scores of the top 10 human contestants at 24 hours, while another contains the prefix-best scores from the five Claude Code trials at 5 hours. We want to know how often the 24-hour top-human scores beat the 5-hour Claude Code scores. If the two vectors are

$$
u = (u_1, \ldots, u_n), \qquad v = (v_1, \ldots, v_m),
$$

we define the empirical probability that $$u$$ beats $$v$$ by comparing all pairs:

$$
\widehat{\operatorname{Pr}}(u \text{ beats } v)
= \frac{1}{nm}\sum_{i=1}^{n}\sum_{j=1}^{m} \mathbf{1}[u_i > v_j].
$$

These pairwise win rates are the inputs to the Elo fit.

### Results

We fit Elo ratings from these pairwise win rates using [L-BFGS](https://doi.org/10.1007/BF01589116). All agent systems and human groups are placed in one joint Bradley-Terry fit, so their ratings are directly comparable. For agents, we use the 24-hour trajectories from our runs. For humans, we use the full trajectories from the official two weeks.

<img class="full" src="{{ 'assets/img/2026-06-16-humans-still-beat-ai/human-vs-agent-elo.png' | relative_url }}" alt="Elo trajectories comparing human contestants and agent systems">

<p class="caption">Elo trajectories for top humans and agent systems on <a href="https://atcoder.jp/contests/ahc014/tasks/ahc014_a">RectJoin</a>, the long-horizon coding task introduced above.</p>

The result is sharp. Agents improve quickly in the first few hours, but their Elo curves flatten by the 24-hour mark, even though a single agent trial can use up to 100M tokens. <strong>Top humans improve more slowly at first, but they keep climbing for days and eventually pass the agent systems by a large margin. This suggests that current agents can sprint early, but they still lack the long-horizon test-time adaptation that strong human contestants use during an extended contest.</strong>

We can also ask a more local question for each participant system. If we only look at one system at a time, the repeated-sampling model gives a reference line for what would happen if that system simply drew more independent samples from its own output distribution. Comparing the observed Elo curve against this line tells us whether the system's test-time strategy is more or less efficient than repeated sampling from itself.

<img class="full" src="{{ 'assets/img/2026-06-16-humans-still-beat-ai/per-source-elo-vs-repeated-sampling.png' | relative_url }}" alt="Per-source Elo curves compared with the repeated-sampling reference line">

<p class="caption">Per-source Elo curves compared with the repeated-sampling reference line implied by the model.</p>

The gray dashed line is the repeated-sampling reference. Curves above this line gain Elo faster than independent sampling from the same source distribution. Curves below it gain Elo more slowly. The agent systems become <strong>sublinear</strong> relative to this reference by the end of the 24-hour run. In contrast, the human curves become <strong>superlinear</strong> over longer horizons. <strong>Humans do not just sample; current agents still have a long way to go on long-horizon test-time scaling.</strong>

## Takeaways for Agentic Test-Time Scaling

<ul class="takeaways">
  <li><strong>Agents have their own test-time strategies.</strong> We should evaluate whether performance improves with more compute and what strategy produced that improvement.</li>
  <li><strong>Use repeated sampling as a reference line.</strong> If an agent's Elo grows linearly with log compute, it may be doing little more than repeated sampling. Deviations from that line are the signal.</li>
  <li><strong>Keep humans as a long-horizon reference.</strong> Top humans still show adaptive improvement over long horizons, which gives us a useful target for agentic test-time scaling.</li>
  <li><strong>Study more open-ended long-horizon tasks.</strong> We need more tasks, longer run trajectories, and careful failure analysis to understand where agents still fall short.</li>
</ul>

## Citing Us

Our full paper is coming soon. In the meantime, please cite this blog post if you found it helpful. For discussion, contact <a href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a> or <a href="mailto:lky04@cs.washington.edu">lky04@cs.washington.edu</a>.

<div class="citation-code-block" markdown="1">

```bibtex
@misc{mang2026humansstillbeatai,
  title  = {Humans Still Beat AI in the Long Horizon: Revisiting Test-Time Scaling in the Agent Era},
  author = {Qiuyang Mang and Kaiyuan Liu and Bo Peng and Shreyas Pimpalgaonkar and Luke Zettlemoyer and Alex Dimakis and Alvin Cheung},
  year   = {2026},
  url    = {https://joyemang33.github.io/blog/2026/humans-dont-just-sample/}
}
```

</div>
