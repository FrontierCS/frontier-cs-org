---
layout: default
title: FrontierCS 2
description: A benchmark of 48 open-ended computer-science R&D tasks built from published papers, where the authors’ own code is the reference to beat.
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
  <h1>FrontierCS 2: A benchmark for agentic computer-science R&amp;D</h1>
  <p class="lead">Each task deletes a published paper’s contribution from the repository its authors released. The agent writes it back, and the authors’ own code is the reference it must beat.</p>

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
    <div class="cfoot">{% include chart_logo.html %}<span>Preliminary · a run passes only when its final submission beats the human baseline on every metric of every hidden workload, not on its total score · cost is estimated from tokens and list prices</span></div>
  </figure>

  <details class="tbl-wrap fold" id="domains">
    <summary><h3>Pass rate by domain</h3></summary>
    <div class="res-scroll"><table class="res num" id="restbl"></table></div>
    <p class="cfoot" style="border-top:0; margin-top:10px; padding-top:0">Share of each model’s runs that pass. A dash means no run yet. Bold marks the best in a row.</p>
  </details>

  <div class="tbl-wrap" id="meanscore">
    <h3>Mean score</h3>
  <div class="cgrid">
    <figure class="chart" style="margin:0">
      <div class="chead"><span id="ylab">Final score, mean over runs</span></div>
      <div class="plot" id="lbplot"><svg id="lbsvg" role="img" aria-label="Leaderboard chart"></svg><div class="tip" id="lbtip" hidden></div></div>
      <div class="legend" id="lblegend" hidden></div>
      <button class="pill lg custom" id="custom" type="button" aria-expanded="false" aria-controls="settings">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Customize graph</button>
      <div class="cfoot">{% include chart_logo.html %}<span id="lbnote">Preliminary · scores on each task’s own 0–100 scale</span></div>
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

  <div class="tbl-wrap" id="eci">
    <h3>FECI</h3>
    <figure class="chart" style="margin:0">
      <div class="chead"><span>FrontierCS Epoch Capabilities Index (FECI)</span></div>
      <div class="plot" id="eciplot"><svg id="ecisvg" role="img" aria-label="FECI chart"></svg><div class="tip" id="ecitip" hidden></div></div>
      <div class="cfoot">{% include chart_logo.html %}<span id="ecinote">Preliminary · Human = 60 (the authors’ reference code), Kimi K2.7 Code = 0 (in the fit, not shown) · whiskers are 90% intervals</span></div>
    </figure>
    <details class="fold how" id="feci-how">
      <summary><h3>How FECI works</h3></summary>
      <div class="how-body">
        <div class="how-row">
          <div class="how-txt">
            <p class="how-step"><span>1</span>One curve per task</p>
            <p>FECI puts every model and the authors’ code on one scale. Each task gets an S-shaped curve: a model’s expected score on the task rises from 0 to 100 as its FECI passes the task’s difficulty, the FECI at which the expected score is 50.</p>
            <div class="how-eq">\[\text{expected score} = \frac{100}{1 + e^{-k\,(\text{FECI} - \text{difficulty})}}\]</div>
          </div>
          <figure class="chart how-fig">
            <div class="chead"><span>Expected score on three tasks</span></div>
            <div class="plot" id="howaplot"><svg id="howasvg" role="img" aria-label="Expected score against FECI on three tasks"></svg><div class="tip" id="howatip" hidden></div></div>
            <div class="legend" id="howalegend"></div>
          </figure>
        </div>
        <p class="how-step"><span>2</span>Why FECI</p>
        <ul class="how-why">
          <li><b>It is fair to models that ran different tasks.</b> Each model ran its own set, <span id="how-ntasks">19 to 40</span> of the <span id="how-nall">42</span> tasks with runs. A mean score or a pass rate rewards a model that drew easy tasks; FECI weighs each score by how hard its task is.</li>
          <li><b>It has a human anchor.</b> Every task scores on its own scale. FECI turns them into one number, and 60 always means the authors’ code.</li>
          <li><b>It has room at the top.</b> The hardest task sits at difficulty <span id="how-dmax">206</span>, far above every model, so the scale does not saturate the way a 0 to 100 average does.</li>
          <li><b>The method is tested.</b> FECI is item response theory, the model behind standardized tests that compare students who answered different questions. Epoch AI uses it in the <a href="https://epoch.ai/benchmarks/eci" target="_blank" rel="noopener">Epoch Capabilities Index</a> to combine many benchmarks into one scale, and Anthropic tracks how fast its models’ capabilities rise with a fork of Epoch’s index, the Anthropic ECI, in its <a href="https://www.anthropic.com/system-cards" target="_blank" rel="noopener">system cards</a>.</li>
        </ul>
      </div>
    </details>
  </div>

  <div class="tbl-wrap" id="tts">
    <h3>Test-time scaling</h3>
    <figure class="chart" style="margin:0" id="scaling">
      <div class="chead"><span>Test-time scaling: FECI against cost budget per run</span></div>
      <div class="plot" id="ttsplot"><svg id="ttssvg" role="img" aria-label="Test-time scaling chart"></svg><div class="tip" id="ttstip" hidden></div></div>
      <div class="legend" id="ttslegend"></div>
      <div class="cfoot">{% include chart_logo.html %}<span>Preliminary · within a budget, a run counts its latest valid submission, scored on the development workloads · each curve is the best level reached by that budget · bands are 90% intervals</span></div>
    </figure>
  </div>
</section>

<section class="sec" id="tasks">
  <h2>Tasks</h2>
  <div class="idx">
    <div class="filter" id="filter">
      <h3>Filter</h3>
      <button class="ftoggle" type="button" id="ftoggle" aria-expanded="false">Filter by domain <span id="fcount"></span></button>
      <div class="fbody">
        <h4>Domain</h4>
        <div class="checks" id="checks"></div>
      </div>
    </div>
    <div>
      <div class="bar">
        <label class="field" for="q"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <input id="q" type="search" placeholder="Search" autocomplete="off"></label>
      </div>
      <div class="rows" id="rows"></div>
      <button class="pill lg showmore" type="button" id="showmore">Show more</button>
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
  <p class="pcontact">Questions about the private set: write to Qiuyang Mang at <a href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a> or Wenhao Chai at <a href="mailto:wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a>.</p>
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
      <details id="q-built"><summary>How is a task built?</summary><div class="ans"><p>We delete a paper’s contribution from its own repository. The agent writes it back and is scored against the authors’ code.</p></div></details>
      <details id="q-see"><summary>What does the agent see?</summary><div class="ans"><p>It sees its repository and, for each patch it submits, a score on the development workloads and one message. The development and evaluation sets are separate: the evaluator, the hidden evaluation workloads and the reference stay with the judge. At the end the agent picks one of its versions as its final submission, and only that version is scored on the hidden workloads. Each run has a wall-clock budget of 5 hours.</p></div></details>
      <details id="q-pick"><summary>What if the agent picks the wrong version?</summary><div class="ans"><p>We report it as it is. Agents sometimes end on a version that fails although an earlier one would have passed. Choosing which version to submit is part of the work we measure, so we do not correct the choice: every run is scored by the submission the agent chose.</p></div></details>
      <details id="q-bar"><summary>What counts as a pass?</summary><div class="ans"><p>A run passes only when its final submission beats the human baseline, the authors’ code, on every metric the task checks and on every hidden workload. A higher total score is not enough: a run that is faster on average but worse on one metric or one workload does not pass. The criteria are set from the reference’s own measurements. For SVG-EAR, its latency must be at most 0.96 of the reference’s, with PSNR, SSIM and LPIPS within fixed bands. Each task’s page lists the metrics its judge checks.</p></div></details>
      <details id="q-score"><summary>How are scores computed?</summary><div class="ans"><p>The leaderboard’s main number is pass rate, the share of runs that pass by the criteria above. Each task’s evaluator also scores the final submission on the hidden suite, from 0 to 100, and a run that times out scores 0. The mean score chart averages these scores. FECI, the FrontierCS Epoch Capabilities Index, is fitted with Epoch AI’s own ECI code. It fits one logistic curve per task to every model’s score and to the human reference, the authors’ own code, then scales the result so Human is 60 and Kimi K2.7 Code is 0. Kimi K2.7 Code takes part in the fit as this 0 point but is not on the leaderboard. Above 60 means above the authors’ code on each task’s own scale. FECI’s bars are 90% intervals from Epoch’s bootstrap, which resamples each model’s task results. Costs are estimates; “How is cost estimated?” below gives the method. The results are preliminary: <span data-fill="summary">263 runs on 42 tasks by 7 models</span>.</p></div></details>
      <details id="q-scaling"><summary>How is test-time scaling computed?</summary><div class="ans"><p>The agent submits many times during a run, and each submission is scored on the task’s development workloads. At a cost budget, a run counts its latest valid submission within that budget, the latest whose development score is above 0, or a score of 0 if it has none yet. One submission in ten scores 0, mostly from a failed build, validation or correctness gate, and agents usually recover from it; counting such a failure as the run’s result would score an experiment instead of the agent’s working code. Taking the best submission so far instead would choose with hindsight, and agents keep their best development submission as the final one in only 72% of runs. Development scores run above hidden-suite scores, so we shift them by each task’s average gap between the final submission’s development and hidden scores. This leaves an error of 5.5 points per run, against 8.9 without the shift. Once the budget covers a whole run, its hidden final score counts, so every curve ends at the model’s leaderboard value. The budget is the estimated cost, as the next answer explains.</p></div></details>
      <details id="q-cost"><summary>How is cost estimated?</summary><div class="ans"><p>The results record tokens, not dollars. We price a run’s output tokens at the model’s output price and every token it used at the cache-read price, as if all input were a cache hit. Muse Spark 1.3 lists no cache price, so we use the cache-read price its model gateway charged. Prices are list prices in US$ per million tokens, found on October 9, 2026, output and then cache read: GPT-6 Astra 50 and 1.00, GPT-6.1 Sol 10 and 0.10, Kimi K3 15 and 0.30, Qwen 3.8 Max 6 and 0.25, DeepSeek V4.1 Flash 0.60 and 0.003 (off-peak), GLM 5.3 4.40 and 0.26, Muse Spark 1.3 4.25 and 0.15 (gateway). Each agent tool counts tokens its own way, so costs compare orders of magnitude better than small gaps.</p></div></details>
      <details id="q-run"><summary>Can I run it?</summary><div class="ans"><p>We will release the tasks, evaluators and judge as one evaluation environment.</p></div></details>
    </div>
  </div>
</section>
</div>
</div>
<script defer src="{{ '/assets/js/fcs2-data.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-art.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2.js' | relative_url }}"></script>
