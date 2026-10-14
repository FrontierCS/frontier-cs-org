---
layout: default
title: FrontierCS 2
description: A benchmark of 48 open-ended computer science R&D tasks built from published papers, where the human reference, the code released with each paper, is the bar to beat.
permalink: /
page_css: fcs2
og_image: assets/img/fcs2-card.png   # share card for X and other link previews, drawn by bin/fcs2_card.py
---
<div class="fcs2">
<nav class="sub" aria-label="Sections"><div class="col" id="subnav">
  <a href="#overview" class="on">Overview</a><a href="#leaderboard">Leaderboard</a><a href="#tasks">Tasks</a><a href="#cases">Case studies</a><a href="#private">Private set</a><a href="#sponsors">Sponsors</a><a href="#questions">Questions</a>
</div></nav>

<div class="col" id="main" tabindex="-1">
<section class="intro" id="overview">
  <div class="hero">
  <div class="hero-text">
  <p class="upd"><i></i><span>Last updated: {{ site.time | date: "%B %-d, %Y" }}</span></p>
  <h1>FrontierCS 2: A Benchmark for Computer Science R&amp;D</h1>
  <p class="lead">FrontierCS 2 evaluates AI agents on their ability to do CS research. Each task removes the key contribution of a paper from the code released with it. An agent passes a task only if its implementation beats the original one on all metrics of our hidden workloads.</p>

  <div class="links"><a class="pill lg" id="paperlink" aria-disabled="true">Paper (coming soon)</a></div>
  <a id="taskbase" href="{{ '/task/' | relative_url }}" hidden></a>
  </div>
  <div class="papers" id="papers" aria-hidden="true"><div class="pplane" id="pplane"></div></div>
  <script>window.PAPER_DIR = "{{ '/assets/img/fcs2-papers/' | relative_url }}"; window.PAPER_IMGS = [{% for f in site.static_files %}{% if f.path contains '/assets/img/fcs2-papers/' %}"{{ f.basename }}",{% endif %}{% endfor %}];</script>
  </div>

  <figure class="chart" id="teaser">
    <div class="chead"><span>Tasks</span></div>
    <div class="map" id="map"><svg id="mapsvg" aria-label="The 48 tasks by domain"></svg></div>
  </figure>
</section>

<section class="sec" id="leaderboard">
  <h2>Leaderboard</h2>
  <figure class="chart" style="margin:0">
    <div class="chead"><span>Pass rate (over human)</span></div>
    <div class="plot" id="pcplot"><svg id="pcsvg" role="img" aria-label="Pass rate (over human) against cost per run"></svg><div class="tip" id="pctip" hidden></div></div>
    <div class="cfoot">{% include chart_logo.html %}</div>
  </figure>

  <details class="tbl-wrap fold" id="domains">
    <summary><h3>Pass rate by domain</h3></summary>
    <div class="res-scroll"><table class="res num" id="restbl"></table></div>
    <p class="cfoot" style="border-top:0; margin-top:10px; padding-top:0">Bold marks the best in a column.</p>
  </details>

  <div class="tbl-wrap" id="eci">
    <h3>FCI</h3>
    <figure class="chart" style="margin:0">
      <div class="chead"><span>FrontierCS Capabilities Index (FCI)</span></div>
      <div class="plot" id="eciplot"><svg id="ecisvg" role="img" aria-label="FCI chart"></svg><div class="tip" id="ecitip" hidden></div></div>
      <div class="cfoot">{% include chart_logo.html %}<span id="ecinote">Human = 25, Kimi K2.7 = 0 · whiskers are 90% intervals</span></div>
    </figure>
    <p class="pcontact">To add your model, email its score on every task to both <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">qmang@berkeley.edu</a> and <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a>.</p>
    <details class="fold how" id="fci-how">
      <summary><h3>How FCI works</h3></summary>
      <div class="how-body">
        <div class="how-row">
          <div class="how-txt">
            <p class="how-step"><span>1</span>One curve per task</p>
            <p>FCI puts every model and the human reference on one scale with two fixed points: Human = 25, the human reference, and Kimi K2.7 = 0. Each task gets an S-shaped curve: a model’s expected score on the task rises from 0 to 100 as its FCI passes the task’s FEDI.</p>
            <p><b>FEDI</b>, the FrontierCS Epoch Difficulty Index, is the FCI at which the expected score is 50, so tasks and models share one scale. A model whose FCI equals a task’s FEDI is expected to score 50 on it. Above 25, a model at the level of the human reference is expected to score under 50; below 0, even a model at the level of Kimi K2.7 is expected to score over 50.</p>
            <div class="how-eq">\[\text{expected score} = \frac{100}{1 + e^{-k\,(\text{FCI} - \text{FEDI})}}\]</div>
          </div>
          <figure class="chart how-fig">
            <div class="chead"><span>Expected score on three tasks</span></div>
            <div class="plot" id="howaplot"><svg id="howasvg" role="img" aria-label="Expected score against FCI on three tasks"></svg><div class="tip" id="howatip" hidden></div></div>
            <div class="legend" id="howalegend"></div>
          </figure>
        </div>
        <p class="how-step"><span>2</span>Why FCI</p>
        <ul class="how-why">
          <li><b>It weighs each score by difficulty.</b> A mean score counts a point on an easy task the same as a point on a hard one. FCI weighs each score by how hard its task is.</li>
          <li><b>It has a human anchor.</b> Every task scores on its own scale. FCI turns them into one number, and 25 always means the human reference.</li>
          <li><b>It has room at the top.</b> The hardest task sits at FEDI <span id="how-dmax">57</span>, far above every model, so the scale does not saturate the way a 0 to 100 average does.</li>
          <li><b>It builds on an established index.</b> FCI is a fork of Epoch AI’s <a href="https://epoch.ai/benchmarks/eci" target="_blank" rel="noopener">Epoch Capabilities Index</a> (ECI) and runs Epoch’s released code; we thank Epoch AI for both. This kind of fit, item response theory, has become a standard for AI capabilities: Anthropic tracks its models with its own fork, the AECI, in its <a href="https://www.anthropic.com/system-cards" target="_blank" rel="noopener">system cards</a>, and Google tracks its Gemini models with the GCI in its <a href="https://storage.googleapis.com/deepmind-media/gemini/gemini_4_safety_report.pdf" target="_blank" rel="noopener">Gemini 4 safety report</a>.</li>
        </ul>
      </div>
    </details>
  </div>

  <div class="tbl-wrap" id="tts">
    <h3>Test-time scaling</h3>
    <figure class="chart" style="margin:0" id="scaling">
      <div class="chead"><span>Test-time scaling: FCI against cost budget per run</span></div>
      <div class="plot" id="ttsplot"><svg id="ttssvg" role="img" aria-label="Test-time scaling chart"></svg><div class="tip" id="ttstip" hidden></div></div>
      <div class="legend" id="ttslegend"></div>
      <div class="cfoot">{% include chart_logo.html %}</div>
    </figure>
  </div>
  <div class="tbl-wrap" id="meanscore">
    <h3>Mean score</h3>
  <div class="cgrid">
    <figure class="chart" style="margin:0">
      <div class="chead"><span id="ylab">Final score minus the human reference, mean over runs</span></div>
      <div class="plot" id="lbplot"><svg id="lbsvg" role="img" aria-label="Leaderboard chart"></svg><div class="tip" id="lbtip" hidden></div></div>
      <div class="legend" id="lblegend" hidden></div>
      <button class="pill lg custom" id="custom" type="button" aria-expanded="false" aria-controls="settings">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Customize graph</button>
      <div class="cfoot">{% include chart_logo.html %}</div>
    </figure>
    <aside class="settings" id="settings" aria-label="Graph settings">
      <h3>Settings</h3>
      <label class="toggle"><input type="checkbox" id="showruns" checked> Show individual runs</label>
      <h4>Group by</h4>
      <div class="chips" id="groupby"><button class="chip" type="button" data-g="model" aria-pressed="true">Model</button><button class="chip" type="button" data-g="task" aria-pressed="false">Task</button></div>
      <h4>Domain</h4>
      <div class="radios" id="domradios"></div>
    </aside>
  </div>
  </div>
</section>

<section class="sec" id="tasks">
  <h2>Tasks</h2>
  <div class="idx">
    <div class="filter" id="filter" aria-label="Filter by domain">
      <button class="ftoggle" type="button" id="ftoggle" aria-expanded="false">Filter <span id="fcount"></span></button>
      <div class="fbody">
        <div class="checks" id="checks"></div>
      </div>
    </div>
    <div>
      <div class="bar">
        <label class="field" for="q"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <input id="q" type="search" placeholder="Search" autocomplete="off"></label>
        <div class="dd" id="tsort">
          <button class="dd-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Sort tasks"><span class="dd-val">Hardest first</span><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <ul class="dd-menu" role="listbox" aria-label="Sort tasks" hidden><li role="option" data-v="hard" aria-selected="true">Hardest first</li><li role="option" data-v="easy" aria-selected="false">Easiest first</li><li role="option" data-v="domain" aria-selected="false">By domain</li><li role="option" data-v="name" aria-selected="false">By name</li></ul>
        </div>
      </div>
      <div class="lhead" id="lhead"></div>
      <div class="rwrap"><div class="rows" id="rows" role="region" aria-label="Task list" tabindex="0"></div><div class="rail" id="rail" aria-hidden="true"><i></i></div></div>
    </div>
  </div>
</section>

<section class="sec" id="cases">
  <h2>Case studies</h2>
  <p class="tbd">Case studies of single runs from the preview will appear here.</p>
</section>

<section class="sec" id="private">
  <h2>Private set</h2>
  <p class="tbd">Tasks we don’t release.</p>
  <div class="locked" id="locked" aria-hidden="true"></div>
  <p class="pcontact">For questions about the private set, email both <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">qmang@berkeley.edu</a> and <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a>.</p>
</section>

<section class="sec" id="sponsors">
  <h2>Sponsors</h2>
  <ul class="sponsor-row">
    <li><a href="https://modal.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/modal.svg' | relative_url }}" class="modal" alt="Modal"></a></li>
    <li><a href="https://www.laude.org/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/laude-institute-wordmark.png' | relative_url }}" class="laude" alt="Laude Institute"></a></li>
  </ul>
</section>

<section class="sec" id="questions">
  <div class="faq">
    <h2>Questions</h2>
    <div class="fqlist">
      <details id="q-built"><summary>How is a task built?</summary><div class="ans"><p>We delete a paper’s contribution from its own repository. The agent writes it back and is scored against the human reference, the code released with the paper.</p></div></details>
      <details id="q-see"><summary>What does the agent see?</summary><div class="ans"><p>It sees its repository and, for each patch it submits, a score on the development workloads and one message. The development and evaluation sets are separate: the evaluator, the hidden evaluation workloads and the reference stay with the judge. At the end the agent picks one of its versions as its final submission, and only that version is scored on the hidden workloads. Each run has a wall-clock budget of 5 hours.</p></div></details>
      <details id="q-pick"><summary>What if the agent picks the wrong version?</summary><div class="ans"><p>We report it as it is. Agents sometimes end on a version that fails although an earlier one would have passed. Choosing which version to submit is part of the work we measure, so we do not correct the choice: every run is scored by the submission the agent chose.</p></div></details>
      <details id="q-bar"><summary>What counts as a pass?</summary><div class="ans"><p>A run passes only when its final submission beats the human reference on every metric the task checks and on every hidden workload. A higher total score is not enough: a run that is faster on average but worse on one metric or one workload does not pass. The criteria are set from the reference’s own measurements. For SVG-EAR, its latency must be at most 0.96 of the reference’s, with PSNR, SSIM and LPIPS within fixed bands. Each task’s page lists the metrics its judge checks.</p></div></details>
      <details id="q-score"><summary>How are scores computed?</summary><div class="ans"><p>The leaderboard’s main number is pass rate, the share of runs that pass by the criteria above. Each task’s evaluator also scores the final submission on the hidden suite, from 0 to 100, and a run that times out scores 0. The mean score chart averages each run’s score minus the human reference’s score on the same task, so 0 means level with the human reference. FCI, the FrontierCS Capabilities Index, is fitted with Epoch AI’s own ECI code. It fits one logistic curve per task to every model’s score and to the human reference, then scales the result so Human is 25 and Kimi K2.7 is 0. Kimi K2.7 takes part in the fit as this 0 point but is not on the leaderboard. Above 25 means above the human reference on each task’s own scale. FCI’s bars are 90% intervals from Epoch’s bootstrap, which resamples each model’s task results. Costs are estimates; “How is cost estimated?” below gives the method. The results cover <span data-fill="summary">480 runs on 48 tasks by 10 models</span>.</p></div></details>
      <details id="q-scaling"><summary>How is test-time scaling computed?</summary><div class="ans"><p>The agent submits many times during a run, and each submission is scored on the task’s development workloads. At a cost budget, a run counts its latest valid submission within that budget, the latest whose development score is above 0, or a score of 0 if it has none yet. One submission in ten scores 0, mostly from a failed build, validation or correctness gate, and agents usually recover from it; counting such a failure as the run’s result would score an experiment instead of the agent’s working code. Taking the best submission so far instead would choose with hindsight. Development scores are not adjusted to the hidden suite, because the platform does not score the final submission on the development workloads. Once the budget covers a whole run, its hidden final score counts, so every curve ends at the model’s leaderboard value. The budget is the estimated cost, as the next answer explains.</p></div></details>
      <details id="q-cost"><summary>How is cost estimated?</summary><div class="ans"><p>Cost per run comes from three sources. For GPT-6 Astra, GPT-6.1 Sol, Muse Spark 1.3 and Muse Wonder 1.0 it is the cost their model gateway estimated. For Claude Opus 5.5 it is the cost Claude Code reports for itself; where a run’s saved trace stops before the run ends, its tokens are priced at the rates Claude Code’s complete reports follow and scaled to the whole run. Kimi K3, DeepSeek V4.1 Flash, GLM 5.3, GLM 5.3 Flash and Qwen 3.8 Max report tokens but no cost, so we price every token at the model’s cache-read list price, in US$ per million tokens: Kimi K3 0.30, DeepSeek V4.1 Flash 0.003 (off-peak), GLM 5.3 0.26, GLM 5.3 Flash 0.03 and Qwen 3.8 Max 0.25, found on October 9, 2026, and for GLM 5.3 Flash on October 13. Their output tokens are not counted apart, so their costs are lower bounds. The platform gives no spend per development submission; the test-time scaling chart splits a run’s spend by the share of its wall time elapsed. Costs compare orders of magnitude better than small gaps.</p></div></details>
      <details id="q-run"><summary>Can I run it?</summary><div class="ans"><p>We will release the tasks, evaluators and judge as one evaluation environment.</p></div></details>
    </div>
  </div>
</section>
</div>
</div>
<script defer src="{{ '/assets/js/fcs2-data.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-art.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2.js' | relative_url }}"></script>
