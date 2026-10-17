---
layout: default
title: FrontierCS 2 tasks
description: One FrontierCS 2 task at a time, the paper it starts from, what the agent must write back, and the score of every run on it.
permalink: /task/
page_css: [fcs2, fcs2-patch]
---
<div class="fcs2 taskpage">
<div class="col" id="main" tabindex="-1">
  <nav class="crumbs" aria-label="Breadcrumb"><span class="trail"><a class="home" href="{{ '/' | relative_url }}">FrontierCS 2</a><span class="sep home">/</span><a id="tolist" href="{{ '/' | relative_url }}#tasks">Tasks</a><span class="sep" id="tcsep">/</span><span class="here" id="tcrumb"></span></span><span class="pager" id="tpager"></span></nav>
  <div class="thero nofig" id="thero">
    <header class="thead">
      <div class="meta" id="tmeta"></div>
      <h1 id="tname">Tasks</h1>
      <p class="tgoal" id="tgoal" hidden></p>
      <p class="ptitle" id="tpaper"></p>
      <div class="tkeys" id="tkeys"></div>
      <p class="tfdi" id="tfdi"></p>
      <a id="howlink" href="{{ '/#fci-how' | relative_url }}" hidden></a>
      <div class="links" id="tlinks"></div>
    </header>
    <figure class="tfig" id="tfig" hidden></figure>
  </div>
  <div id="tbody"></div>
</div>
</div>
<script>window.PATCH_DIR = "{{ '/assets/patches/' | relative_url }}"; window.FIG_DIR = "{{ '/assets/img/fcs2-tasks/' | relative_url }}";</script>
<script defer src="{{ '/assets/js/fcs2-data.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-checks.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-metrics.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-solutions.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-patch.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-task.js' | relative_url }}"></script>
