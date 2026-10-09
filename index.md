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

  <div class="stats">
    <article class="stat"><h3>Tasks</h3><div class="big"><b class="num">92</b><span>open-ended</span></div>
      <p>90 start from a published paper. Structured LWE and Gigatoken have none.</p><a class="pill" href="#tasks">Browse tasks</a></article>
    <article class="stat"><h3>Domains</h3><div class="big"><b class="num">13</b><span>areas of computer science</span></div>
      <p>The largest are Machine Learning, with 22 tasks, and MLSys, with 17.</p><a class="pill" href="#domains">Results by domain</a></article>
    <article class="stat"><h3>Runs</h3><div class="big"><b class="num" data-fill="runs">263</b><span data-fill="runtasks">on 42 tasks</span></div>
      <p data-fill="models">7 models from 6 labs have run so far.</p><a class="pill" href="#leaderboard">Go to leaderboard</a></article>
  </div>
</section>

<section class="sec" id="leaderboard">
  <h2>Leaderboard</h2>
  <div class="chips mtabs" id="metric" role="group" aria-label="Metric"><button class="chip" type="button" data-k="eci" aria-pressed="true">FrontierCS ECI</button><button class="chip" type="button" data-k="pass" aria-pressed="false">Pass rate</button><button class="chip" type="button" data-k="score" aria-pressed="false">Mean score</button></div>
  <div class="cgrid one">
    <figure class="chart" style="margin:0">
      <div class="chead"><span id="ylab">FrontierCS ECI, a capabilities index</span><span class="r" id="nres">263 runs</span></div>
      <div class="plot" id="lbplot"><svg id="lbsvg" role="img" aria-label="Leaderboard chart"></svg><div class="tip" id="lbtip" hidden></div></div>
      <div class="legend" id="lblegend"></div>
      <button class="pill lg custom" id="custom" type="button" aria-expanded="false" aria-controls="settings" hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Customize graph</button>
      <div class="cfoot"><b>FRONTIERCS 2</b><span id="lbnote">Preliminary · Human = 25 (the authors’ reference code), Kimi K2.7 Code = 0 (in the fit, not shown) · bars are 90% intervals</span></div>
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

  <div class="tbl-wrap" id="domains">
    <h3 id="tbltitle">Pass rate by domain</h3>
    <div class="res-scroll"><table class="res num" id="restbl"></table></div>
    <p class="cfoot" style="border-top:0; margin-top:10px; padding-top:0" id="tblnote">Share of each model’s runs that pass. A dash means no run yet. Bold marks the best in a row.</p>
  </div>
</section>

<section class="sec" id="cases">
  <h2>Case studies</h2>
  <div class="ctabs" id="ctabs" role="tablist" aria-label="Case study"></div>
  <article class="case" role="tabpanel">
    <div class="meta" id="cmeta"></div>
    <h3 id="ctitle"></h3>
    <p class="desc" id="cdesc"></p>
    <div class="clegend" id="clegend"></div>
    <div class="cplot" id="cplot"><svg id="csvg" role="img" aria-label="Development submissions of one GPT-6 Astra run"></svg><div class="ctip" id="ctip" hidden></div></div>
    <p class="cnote" id="cnote"></p>
    <div class="cfoot"><b>FRONTIERCS 2</b><span>GPT-6 Astra, one run per task</span></div>
  </article>
</section>

<section class="sec" id="tasks">
  <div class="tz">
    <div class="tz-head"><h2>Tasks</h2><span id="tzhint">Select a domain to filter the list</span></div>
    <div class="map" id="map"><svg id="mapsvg" aria-label="The 92 tasks by domain. Select a domain to filter the list."></svg><div class="tip" id="maptip" hidden></div></div>
    <div class="areas" id="areas"></div>
  </div>
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
      <details id="q-see"><summary>What does the agent see?</summary><div class="ans"><p>It sees its repository and, for each patch, a development score and one message. The evaluator, the hidden suite and the reference stay with the judge.</p></div></details>
      <details id="q-bar"><summary>What counts as a pass?</summary><div class="ans"><p>A run passes when its final submission meets the task’s pass criteria on every workload. The criteria are set from the reference’s own measurements. For SVG-EAR, its latency must be at most 0.96 of the reference’s, with PSNR, SSIM and LPIPS within fixed bands.</p></div></details>
      <details id="q-score"><summary>How are scores computed?</summary><div class="ans"><p>Each task’s evaluator scores the final submission on the hidden suite, from 0 to 100, and a run that times out scores 0. The leaderboard’s main number is FrontierCS ECI, a capabilities index fitted with Epoch AI’s own ECI code. It fits one logistic curve per task to every model’s score and to the human reference, the authors’ own code, then scales the result so Human is 25 and Kimi K2.7 Code is 0. Kimi K2.7 Code takes part in the fit as this 0 point but is not on the leaderboard. Above 25 means above the authors’ code on each task’s own scale. FrontierCS ECI’s bars are 90% intervals from Epoch’s bootstrap, which resamples each model’s task results. Pass rate is the share of runs that pass, by the criteria above. The results are preliminary: <span data-fill="summary">263 runs on 42 tasks by 7 models</span>.</p></div></details>
      <details id="q-run"><summary>Can I run it?</summary><div class="ans"><p>We will release the tasks, evaluators and judge as one evaluation environment.</p></div></details>
    </div>
  </div>
</section>
</div>
</div>
<script defer src="{{ '/assets/js/fcs2.js' | relative_url }}"></script>
