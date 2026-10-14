---
layout: default
title: FrontierCS 2 problems
description: One FrontierCS 2 problem at a time, the paper it starts from, what the agent must write back, and the score of every run on it.
permalink: /task/
page_css: fcs2
---
<div class="fcs2 taskpage">
<div class="col" id="main" tabindex="-1">
  <nav class="crumbs" aria-label="Back"><a href="{{ '/' | relative_url }}#tasks">All problems</a></nav>
  <div class="thero nofig" id="thero">
    <header class="thead">
      <div class="meta" id="tmeta"></div>
      <h1 id="tname">Problems</h1>
      <p class="tgoal" id="tgoal" hidden></p>
      <p class="ptitle" id="tpaper"></p>
      <div class="tkeys" id="tkeys"></div>
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
<script defer src="{{ '/assets/js/fcs2-task.js' | relative_url }}"></script>
