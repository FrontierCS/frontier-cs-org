---
layout: default
title: FrontierCS 2 tasks
description: One FrontierCS 2 task at a time, the paper it starts from, what the agent must write back, and the score of every run on it.
permalink: /task/
page_css: fcs2
---
<div class="fcs2 taskpage">
<div class="col" id="main" tabindex="-1">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="{{ '/' | relative_url }}">FrontierCS 2</a><span>/</span><a href="{{ '/' | relative_url }}#tasks">Tasks</a><span id="crumbdom"></span></nav>
  <header class="thead">
    <div class="meta" id="tmeta"></div>
    <h1 id="tname">Tasks</h1>
    <p class="ptitle" id="tpaper"></p>
    <div class="links" id="tlinks"></div>
  </header>
  <div id="tbody"></div>
</div>
</div>
<script defer src="{{ '/assets/js/fcs2-data.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/fcs2-task.js' | relative_url }}"></script>
