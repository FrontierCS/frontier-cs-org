---
layout: default
title: FrontierCS 2
description: A benchmark of 92 open-ended computer-science R&D tasks built from published papers, where the authors’ own code is the reference to beat.
permalink: /
page_css: fcs2
---
<div class="fcs2">
<nav class="sub" aria-label="Sections"><div class="col" id="subnav">
  <a href="#overview" class="on">Overview</a><a href="#leaderboard">Leaderboard</a><a href="#cases">Case studies</a><a href="#tasks">Tasks</a><a href="#questions">Questions</a>
</div></nav>

<div class="col" id="main" tabindex="-1">
<section class="intro" id="overview">
  <p class="upd"><i></i><span data-fill="updated">Last updated: October 8, 2026</span></p>
  <h1>FrontierCS 2: A benchmark for agentic computer-science R&amp;D</h1>
  <p class="lead">Each task deletes a published paper’s contribution from the repository its authors released. The agent writes it back, and the authors’ own code is the reference it must beat.</p>

  <div class="links"><a class="pill lg" id="paperlink" aria-disabled="true">Paper (coming soon)</a></div>
  <a id="taskbase" href="{{ '/task/' | relative_url }}" hidden></a>

  <div class="example" id="example">
    <div class="ex-task">
      <div class="meta"><span class="tag" id="extag"></span><span class="exlab">Example run</span></div>
      <h3 class="ex-name"><a id="exname" href="{{ '/task/' | relative_url }}"></a></h3>
      <p class="ex-paper" id="expaper"></p>
      <p class="ex-desc" id="exdesc"></p>
      <figure class="chart ex-strip">
        <div class="chead"><span>Final scores on this task</span><span class="r" id="exstriplab"></span></div>
        <div class="plot" id="stripplot"><svg id="stripsvg" role="img" aria-label="Final score of every run on this task, and the authors’ code"></svg><div class="tip" id="striptip" hidden></div></div>
      </figure>
    </div>
    <figure class="chart ex-run" id="runcurve">
      <div class="chead"><span id="runhead">Development score against cost</span></div>
      <div class="plot" id="runplot"><svg id="runsvg" role="img" aria-label="Development score against cost for one run"></svg><div class="tip" id="runtip" hidden></div></div>
      <div class="cfoot"><span id="runnote"></span><button class="pill" type="button" id="runnext">Another run</button></div>
    </figure>
  </div>

  <figure class="chart" id="teaser">
    <div class="chead"><span>Tasks</span><span class="r" id="tzhint">Select a domain to filter the list</span></div>
    <div class="map" id="map"><svg id="mapsvg" aria-label="The 92 tasks by domain. Select a domain to filter the list."></svg><div class="tip" id="maptip" hidden></div></div>
    <div class="areas" id="areas"></div>
  </figure>
</section>

<section class="sec" id="leaderboard">
  <h2>Leaderboard</h2>
  <figure class="chart" style="margin:0">
    <div class="chead"><span>Pass rate against cost per run</span><span class="r" data-fill="nruns">263 runs</span></div>
    <div class="plot" id="pcplot"><svg id="pcsvg" role="img" aria-label="Pass rate against cost per run"></svg><div class="tip" id="pctip" hidden></div></div>
    <div class="legend" id="pclegend"></div>
    <div class="cfoot"><b>FRONTIERCS 2</b><span>Preliminary · a run passes when its final submission meets the task’s pass criteria on every workload · cost is estimated from tokens and list prices</span></div>
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
      <div class="chead"><span id="ylab">Final score, mean over runs</span><span class="r" id="nres">263 runs</span></div>
      <div class="plot" id="lbplot"><svg id="lbsvg" role="img" aria-label="Leaderboard chart"></svg><div class="tip" id="lbtip" hidden></div></div>
      <div class="legend" id="lblegend"></div>
      <button class="pill lg custom" id="custom" type="button" aria-expanded="false" aria-controls="settings">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Customize graph</button>
      <div class="cfoot"><b>FRONTIERCS 2</b><span id="lbnote">Preliminary · scores on each task’s own 0–100 scale</span></div>
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
      <div class="cfoot"><b>FRONTIERCS 2</b><span id="ecinote">Preliminary · Human = 60 (the authors’ reference code), Kimi K2.7 Code = 0 (in the fit, not shown) · bars are 90% intervals</span></div>
    </figure>
    <figure class="chart" style="margin:40px 0 0" id="scaling">
      <div class="chead"><span>Test-time scaling: FECI against cost budget per run</span></div>
      <div class="plot" id="ttsplot"><svg id="ttssvg" role="img" aria-label="Test-time scaling chart"></svg><div class="tip" id="ttstip" hidden></div></div>
      <div class="legend" id="ttslegend"></div>
      <div class="cfoot"><b>FRONTIERCS 2</b><span>Preliminary · within a budget, a run counts its latest valid submission, scored on the development workloads and calibrated to the hidden suite · bands are 90% intervals</span></div>
    </figure>
  </div>
</section>

<section class="sec" id="cases">
  <h2>Case studies</h2>
  <p class="tbd">Case studies of single runs from the preview will appear here.</p>
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
        <select class="sel" id="sort" aria-label="Sort tasks"><option value="domain">By domain</option><option value="name">A–Z</option><option value="runs">With runs first</option></select>
        <span class="cnt num" id="cnt">92 tasks</span>
      </div>
      <div class="rows" id="rows"></div>
      <button class="pill lg showmore" type="button" id="showmore">Show more</button>
    </div>
  </div>
</section>

<section class="sec" id="questions">
  <div class="faq">
    <h2>Questions</h2>
    <div class="fqlist">
      <details id="q-built"><summary>How is a task built?</summary><div class="ans"><p>We delete a paper’s contribution from its own repository. The agent writes it back and is scored against the authors’ code.</p></div></details>
      <details id="q-see"><summary>What does the agent see?</summary><div class="ans"><p>It sees its repository and, for each patch, a development score and one message. The evaluator, the hidden suite and the reference stay with the judge. Each run has a wall-clock budget of 5 hours.</p></div></details>
      <details id="q-bar"><summary>What counts as a pass?</summary><div class="ans"><p>A run passes when its final submission meets the task’s pass criteria on every workload. The criteria are set from the reference’s own measurements. For SVG-EAR, its latency must be at most 0.96 of the reference’s, with PSNR, SSIM and LPIPS within fixed bands.</p></div></details>
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
<script defer src="{{ '/assets/js/fcs2.js' | relative_url }}"></script>
