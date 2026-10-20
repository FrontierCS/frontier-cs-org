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
    <div class="map" id="map"><svg id="mapsvg" aria-label="The tasks by domain"></svg></div>
  </figure>
</section>

<section class="sec" id="leaderboard">
  <h2>Leaderboard</h2>
  <!-- First in the leaderboard (owner, 2026-10-16): one bar per model, Artificial Analysis style, the pass rate as a whole
       number in the bar, the exact value in the tooltip; no FCI switch (owner, 2026-10-16) -->
  <figure class="chart" style="margin:0">
    <div class="chead"><span>Pass rate (beat reference)</span></div>
    <div class="plot" id="fcibplot"><svg id="fcibsvg" role="img" aria-label="Pass rate (beat reference) by model"></svg><div class="tip" id="fcibtip" hidden></div></div>
    <div class="cfoot">{% include chart_logo.html %}</div>   <!-- the bars keep their FrontierCS row (owner, 2026-10-16, on #89) -->
  </figure>
  <figure class="chart" style="margin:56px 0 0">   <!-- the gap of the blocks around it, so it does not run into the bars' footer (owner, 2026-10-16) -->
    <div class="chead"><span>Pass rate (beat reference)</span></div>
    <div class="plot" id="pcplot"><svg id="pcsvg" role="img" aria-label="Pass rate (beat reference) against cost per run"></svg><div class="tip" id="pctip" hidden></div></div>
    <div class="cfoot">{% include chart_logo.html %}</div>
  </figure>
  <p class="pcontact">To add your model, email its score on every task to <strong>both</strong> <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">qmang@berkeley.edu</a> and <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a>.</p>

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
      <div class="cfoot">{% include chart_logo.html %}<span id="ecinote">Kimi K2.7 = <span data-fill="zero"></span> · whiskers are 90% intervals</span></div>
    </figure>
    <details class="fold how" id="fci-how">
      <summary><h3>How FCI works</h3></summary>
      <div class="how-body">
        <div class="how-row">
          <div>
            <p class="how-step"><span>1</span>What it measures</p>
            <p>A run passes a task when its final submission beats the human reference on every metric the task checks, on every hidden workload. Pass rate counts those passes, but it weighs an easy task like a hard one, and a model that passes everything has nowhere left to climb. FCI puts models and tasks on one scale instead, from two kinds of evidence in every run: which metrics it beat, and how far its final score landed from the human reference’s.</p>
          </div>
          <div>
            <p class="how-step"><span>2</span>Beating a metric</p>
            <p>\(\theta_m\) is the strength of model \(m\), \(\beta_g\) the difficulty of metric \(g\), and \(u_r\) how well this one run went; it is shared by all of the run’s metrics, which come from the same submission. When strength equals difficulty, the chance is one half, and every unit of strength above it multiplies the odds by \(e\). Metrics that every run beats or misses together count once. A run passes when it beats every metric, and a task’s <b>FDI</b>, the FrontierCS Difficulty Index, is the strength at which a model passes it half the time.</p>
          </div>
        </div>
        <div class="how-eq">\[ P(\text{run } r \text{ beats metric } g) = \frac{1}{1 + e^{-(\theta_m + u_r - \beta_g)}} \]</div>
        <figure class="chart how-fig">
          <div class="chead"><span>Chance of passing on three tasks</span></div>
          <div class="plot" id="howaplot"><svg id="howasvg" role="img" aria-label="Chance of passing against FCI on three tasks"></svg><div class="tip" id="howatip" hidden></div></div>
          <div class="legend" id="howalegend"></div>
        </figure>
        <div class="how-row">
          <div>
            <p class="how-step"><span>3</span>How far past the human reference</p>
            <div class="how-eq">\[ y_r = \frac{\text{final score}_r - \text{human reference}_t}{\max(\mathrm{sd}_t,\ c)} \]</div>
            <div class="how-eq">\[ y_r \sim \mathcal{N}\big(a\,(\theta_m + u_r - h_t),\ \sigma^2\big) \]</div>
            <p>A pass says that a run beat the human reference, not by how much; the final score says how much. Its margin over the human reference’s is measured in units of the task’s score spread \(\mathrm{sd}_t\), at least \(c =\) <span data-fill="cunit"></span> points, so tasks with different scoring scales weigh alike. \(h_t\) is the strength at which a run lands level with the human reference. A run that passes counts its margin in full. A run that does not pass counts how far it fell short, and if its final score is above the human reference’s, it counts only as at least level, \(P(y_r \ge 0)\): its metrics did not confirm more. Without this term, a model that passed every task would sit at the ceiling, and tasks that no model passes could not be told apart.</p>
          </div>
          <div>
            <p class="how-step"><span>4</span>One fit for models and tasks</p>
            <div class="how-eq">\[ \beta_g \sim \mathcal{N}(h_t + \Delta,\ \tau^2) \]</div>
            <div class="how-eq">\[ \mathrm{FCI}_m = 10\,(\theta_m - \theta_{\text{Kimi K2.7}}) \]</div>
            <p>A task’s metrics sit near its human level, so its metrics and its final scores inform each other. All strengths, difficulties and levels are fitted at once; the few constants left, \(a\), \(\Delta\), \(\tau\), \(\sigma\) and the spread of \(u_r\), take the values under which the results are most likely. FCI is strength in points: Kimi K2.7 sits at 0, and a model 10 points higher has \(e \approx 2.7\) times the odds of beating any metric. The 90% intervals come from refitting on the tasks drawn again with replacement, 500 times. A run whose model provider refused the task is left out, and so, for now, are the Security tasks.</p>
          </div>
        </div>
        <p class="how-step"><span>5</span>Why FCI</p>
        <ul class="how-why">
          <li><b>It puts models and tasks on one scale.</b> A task’s FDI is the FCI a model needs to pass it half the time, so a model’s FCI says which tasks it can be expected to pass.</li>
          <li><b>It has room at the top.</b> The hardest task sits at FDI <span data-fill="dmax"></span>, above every model, so the scale does not saturate the way a pass rate does.</li>
          <li><b>It builds on an established index.</b> FCI is a fork of Epoch AI’s <a href="https://epoch.ai/benchmarks/eci" target="_blank" rel="noopener">Epoch Capabilities Index</a> (ECI), fitted on what decides a pass, each metric’s beat or miss against the human reference, and on how far each final score lands from it, instead of raw scores; we thank Epoch AI for the index and its released code. This kind of fit, item response theory, has become a standard for AI capabilities: Anthropic tracks its models with its own fork, the AECI, in its <a href="https://www.anthropic.com/system-cards" target="_blank" rel="noopener">system cards</a>, and Google tracks its Gemini models with the GCI in its <a href="https://storage.googleapis.com/deepmind-media/gemini/gemini_4_safety_report.pdf" target="_blank" rel="noopener">Gemini 4 safety report</a>.</li>
        </ul>
      </div>
    </details>
  </div>

  <div class="tbl-wrap" id="tts">
    <h3>Test-time scaling</h3>
    <figure class="chart" style="margin:0" id="scaling">
      <div class="chead"><span>Test-time scaling: FCI against cost budget per run</span></div>
      <div class="plot" id="ttsplot"><svg id="ttssvg" role="img" aria-label="Test-time scaling chart"></svg><div class="tip" id="ttstip" hidden></div></div>
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
        <div class="chips" id="tview" role="tablist" aria-label="View"><button class="chip" type="button" role="tab" data-v="list" aria-pressed="true">List</button><button class="chip" type="button" role="tab" data-v="kebab" aria-pressed="false">Kebab</button></div>
      </div>
      <div class="lhead" id="lhead"></div>
      <div class="rwrap"><div class="rows" id="rows" role="region" aria-label="Task list" tabindex="0"></div><div class="rail" id="rail" aria-hidden="true"><i></i></div></div>
    </div>
    <!-- every run, one square per metric, the tasks the filter, search and order above pick (Qiuyang, 2026-10-16: the kebab belongs with the tasks) -->
    <div class="kebab" id="kebab" hidden>
      <div class="chead"><span>Every run: one square per metric the task checks</span></div>
      <div class="legend" id="keblegend"></div>
      <div class="plot" id="kebplot"><div class="keb-scroll" id="kebscroll"><table class="keb" id="kebtbl"></table></div><div class="tip" id="kebtip" hidden></div></div>
    </div>
  </div>
</section>

<section class="sec" id="cases">
  <h2>Case studies</h2>
  {%- assign cases = site.posts | where_exp: "p", "p.tags contains 'Case study'" %}
  <ul class="cases">
    {%- for p in cases %}
    {% assign cth = p.case.thumbnail | default: p.thumbnail %}<li>{% if cth %}<a class="cth" href="{{ p.url | relative_url }}" tabindex="-1" aria-hidden="true"><img src="{{ cth | relative_url }}" alt=""></a>{% endif %}
      <div class="ctx"><a class="ctt" href="{{ p.url | relative_url }}">{{ p.title }}</a>{% if p.case.summary %}<p>{{ p.case.summary }}</p>{% endif %}<span class="cmt">{{ p.case.task }}, {{ p.case.model }}, {{ p.date | date: "%B %-d, %Y" }}</span></div>
      {%- if p.case.result %}<div class="cres"><b>{{ p.case.result }}</b><span>{{ p.case.result_note }}</span></div>{% endif %}</li>
    {%- endfor %}
  </ul>
</section>

<section class="sec" id="private">
  <h2>Private set</h2>
  <p class="tbd">Tasks and domains we don’t release. The private set has more than 100 tasks and will be announced in the future.</p>
  <div class="locked" id="locked" aria-hidden="true"></div>
  <p class="pcontact">For questions about the private set, email <strong>both</strong> <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">qmang@berkeley.edu</a> and <a class="mail" href="mailto:qmang@berkeley.edu,wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a>.</p>
</section>

<section class="sec" id="sponsors">
  <h2>Sponsors</h2>
  <div class="sponsor-lead">   <!-- Modal leads, larger and on its own row, as in the paper's acknowledgments (owner, 2026-10-20) -->
    <a href="https://modal.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/modal.svg' | relative_url }}" alt="Modal"></a>
    <p>Our lead sponsor, providing the compute for FrontierCS 2.</p>
  </div>
  <p class="sponsor-sub">Also supported by</p>
  <ul class="sponsor-row">
    <li><a href="https://www.kaggle.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/partners/kaggle.svg' | relative_url }}" class="kaggle" alt="Kaggle"></a></li>
    <li><a href="https://www.laude.org/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/laude-institute-wordmark.png' | relative_url }}" class="laude" alt="Laude Institute"></a></li>
    <li><a href="https://scale.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/scale.svg' | relative_url }}" class="scale" alt="Scale AI"></a></li>
  </ul>
</section>

<section class="sec" id="questions">
  <div class="faq">
    <h2>Questions</h2>
    <div class="fqlist">
      <details id="q-built"><summary>How is a task built?</summary><div class="ans"><p>We delete a paper’s contribution from its own repository. The agent writes it back and is scored against the human reference, the code released with the paper.</p></div></details>
      <details id="q-see"><summary>What does the agent see?</summary><div class="ans"><p>It sees its repository and, for each patch it submits, a score on the development workloads and one message. The hidden evaluation adds workloads the agent never sees, and the evaluator, the hidden workloads and the reference stay with the judge. At the end the agent picks one of its versions as its final submission, and only that version is scored on the hidden workloads. Each run has a wall-clock budget of 5 hours.</p></div></details>
      <details id="q-pick"><summary>What if the agent picks the wrong version?</summary><div class="ans"><p>We report it as it is. An agent may end on a version that fails although an earlier one would have passed. Choosing which version to submit is part of the work we measure, so we do not correct the choice: every run is scored by the submission the agent chose.</p></div></details>
      <details id="q-bar"><summary>What counts as a pass?</summary><div class="ans"><p>A run passes only when its final submission beats the human reference on every metric the task checks and on every hidden workload. A higher total score is not enough: a run that is faster on average but worse on one metric or one workload does not pass. The criteria are set from the reference’s own measurements. For SVG-EAR, its latency must be at most 0.96 of the reference’s, with PSNR, SSIM and LPIPS within fixed bands. Each task’s page lists the metrics its judge checks.</p></div></details>
      <details id="q-score"><summary>How are scores computed?</summary><div class="ans"><p>The leaderboard’s main number is pass rate, the share of runs that pass by the criteria above. Each task’s evaluator also scores the final submission on the hidden suite, from 0 to 100, and a run that ends without a final submission scores 0. The mean score chart averages each run’s score minus the human reference’s score on the same task, so 0 means level with the human reference. FCI, the FrontierCS Capabilities Index, applies the idea of Epoch AI’s ECI to what decides a pass. One fit, over each run’s beat or miss on every metric the task checks and how far its final score is above or below the human reference’s (a run that does not pass but scores above the human reference counts only as at least level with it), gives every model an FCI and every task an FDI. Kimi K2.7 is the <span data-fill="zero"></span> point; its runs take part in the fit, but it is not on the leaderboard. The human reference has no FCI, since its code cannot pass against itself. FCI’s whiskers are 90% intervals from a bootstrap that resamples the tasks. Costs are estimates. The results cover <span data-fill="summary"></span>.</p></div></details>
      <details id="q-scaling"><summary>How is test-time scaling computed?</summary><div class="ans"><p>Each curve is the FCI a model would have if every run were stopped at a cost budget. A run that has ended within the budget counts what it beat; a run still going at the budget counts as a run that ended there without a final submission: it beats nothing and scores 0. So no curve falls as the budget grows. The chart shows each lab’s model with the highest FCI. Every task’s difficulty stays as in the leaderboard fit, so once the budget covers all of a model’s runs, its curve ends at its leaderboard value. The budget is the estimated cost.</p></div></details>
      <details id="q-run"><summary>Can I run it?</summary><div class="ans"><p>We will release the public tasks, evaluators and judge as one evaluation environment.</p></div></details>
    </div>
  </div>
</section>
</div>
</div>
<script defer src="{{ '/assets/js/fcs2-data.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-checks.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-art.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2.js' | relative_url }}"></script>
