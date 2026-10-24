---
layout: default
title: Team
og_image: assets/img/cards/team.png
description: The authors of FrontierCS, the institutions they come from, and the sponsors who support the project.
permalink: /team/
---
{%- assign t = site.data.team.fcs1 -%}
{%- assign everyone = t.contributors | concat: t.advisors -%}
{%- assign fs = site.data.team.fsmith -%}


<section class="journal team-sec team-top">
<div class="page">
  <h1 class="vh" id="main" tabindex="-1">Team</h1>
  {%- assign t2 = site.data.team.fcs2 %}
  <div class="team-fold team-open">   <!-- the newest project first, not folded (owner, 2026-10-17) -->
    <h3 class="team-group">FrontierCS 2 <span>{{ t2.venue }} · {{ t2.contributors.size | plus: t2.advisors.size }} authors</span></h3>
    <p class="team-note"><a href="{{ t2.url }}" target="_blank" rel="noopener noreferrer">{{ t2.title }}</a>, in paper order.</p>
    <h4 class="team-sub">Contributors <span>{{ t2.contributors.size }}</span></h4>
    <ul class="team-grid">
      {%- for p in t2.contributors %}{% include team_person.html p=p eq="Equal contribution" %}{% endfor %}
    </ul>
    <h4 class="team-sub">Advisors <span>{{ t2.advisors.size }}</span></h4>
    <ul class="team-grid">
      {%- for p in t2.advisors %}{% include team_person.html p=p %}{% endfor %}
    </ul>
    <p class="team-note">* Equal contribution.</p>
  </div>
  {%- assign later = "easyppo,tts,fsmith" | split: "," -%}
  {%- for k in later %}{% assign pp = site.data.team[k] %}
  <details class="team-fold">
    <summary><h3 class="team-group">{{ pp.short }} <span>{{ pp.venue }} · {{ pp.authors.size }} authors</span></h3></summary>
    <p class="team-note"><a href="{{ pp.url }}" target="_blank" rel="noopener noreferrer">{{ pp.title }}</a>, in paper order.</p>
    <ul class="team-grid">
      {%- for p in pp.authors %}{% include team_person.html p=p eq="Equal contribution" %}{% endfor %}
    </ul>
    <p class="team-note">* Equal contribution.</p>
  </details>
  {%- endfor %}
  <details class="team-fold">
    <summary><h3 class="team-group">FrontierCS <span>{{ t.venue }} · {{ everyone.size }} authors</span></h3></summary>
    <p class="team-note"><a href="{{ t.url }}" target="_blank" rel="noopener noreferrer">{{ t.title }}</a>, in paper order.</p>
    <h4 class="team-sub">Contributors <span>{{ t.contributors.size }}</span></h4>
    <ul class="team-grid">
      {%- for p in t.contributors %}{% include team_person.html p=p eq="Equal contribution" %}{% endfor %}
    </ul>
    <h4 class="team-sub">Advisors <span>{{ t.advisors.size }}</span></h4>
    <ul class="team-grid">
      {%- for p in t.advisors %}{% include team_person.html p=p eq="Equal advising" %}{% endfor %}
    </ul>
    <p class="team-note">* Equal contribution among contributors; equal advising among advisors.</p>
  </details>

  {%- assign earlier = "lcbpro" | split: "," -%}
  {%- for k in earlier %}{% assign pp = site.data.team[k] %}
  <details class="team-fold">
    <summary><h3 class="team-group">{{ pp.short }} <span>{{ pp.venue }} · {{ pp.authors.size }} authors</span></h3></summary>
    <p class="team-note"><a href="{{ pp.url }}" target="_blank" rel="noopener noreferrer">{{ pp.title }}</a>, in paper order.</p>
    <ul class="team-grid">
      {%- for p in pp.authors %}{% include team_person.html p=p eq="Equal contribution" %}{% endfor %}
    </ul>
    <p class="team-note">* Equal contribution.</p>
  </details>
  {%- endfor %}
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Institutions</h2>
  </div></div>
  <ul class="logo-wall">
    {%- for i in site.data.team.institutions %}
    <li><img src="{{ 'assets/img/institutions/wordmarks/' | append: i.logo | relative_url }}" alt="{{ i.name }}" style="--h:{{ i.h }}px; --h-sm:{{ i.h | times: 0.75 }}px"></li>
    {%- endfor %}
  </ul>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><h2 class="sec-title">Partners</h2></div>
  <ul class="sponsor-row even">
    <li><a href="https://www.kaggle.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/partners/kaggle.svg' | relative_url }}" class="kaggle" alt="Kaggle"></a></li>
    <li><a class="partner" href="https://openrsi.foundation/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/partners/openrsi.svg' | relative_url }}" class="openrsi" alt=""><span>OpenRSI</span></a></li>
    <li><a href="https://www.yukon.org/frontiercs" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/partners/yukon.svg' | relative_url }}" class="yukon" alt="Yukon"></a></li>
    <li><a class="partner harbor" href="https://www.harborframework.com/" target="_blank" rel="noopener noreferrer"><span>harbor</span></a></li>
    <li><a href="https://x-camp.academy/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/partners/xcamp.svg' | relative_url }}" class="xcamp" alt="X-Camp Academy"></a></li>
  </ul>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><h2 class="sec-title">Sponsors</h2></div>
  <div class="sponsor-lead">   <!-- Modal leads, larger and on its own row, as in the paper's acknowledgments (owner, 2026-10-20) -->
    <a href="https://modal.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/modal.svg' | relative_url }}" alt="Modal"></a>
    <p>Our lead sponsor, providing the compute for FrontierCS 2.</p>
  </div>
  <p class="sponsor-sub">Also supported by</p>
  <ul class="sponsor-row even">
    <li><a href="https://www.kaggle.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/partners/kaggle.svg' | relative_url }}" class="kaggle" alt="Kaggle"></a></li>
    <li><a href="https://www.laude.org/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/laude-institute-wordmark.png' | relative_url }}" class="laude" alt="Laude Institute"></a></li>
    <li><a href="https://scale.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/scale.svg' | relative_url }}" class="scale" alt="Scale AI"></a></li>
    <li><a href="https://snorkel.ai/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/snorkel.svg' | relative_url }}" class="snorkel" alt="Snorkel AI"></a></li>
  </ul>
</div>
</section>

<section class="journal team-sec" id="contact">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Contact</h2>
    <p class="sec-intro">Send questions and leaderboard submissions to either of us.</p>
  </div></div>
  <ul class="team-grid contact-grid">
    <li class="tm"><img class="tm-av" src="{{ 'assets/img/workshop/qiuyang-mang.jpg' | relative_url }}" alt="" width="144" height="144" loading="lazy"><span class="tm-tx"><a class="tm-n" href="https://joyemang33.github.io" target="_blank" rel="noopener noreferrer">Qiuyang Mang</a><span class="tm-a">UC Berkeley</span><a class="tm-mail" href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a></span></li>
    <li class="tm"><img class="tm-av" src="{{ 'assets/img/workshop/wenhao-chai.jpg' | relative_url }}" alt="" width="144" height="144" loading="lazy"><span class="tm-tx"><a class="tm-n" href="https://wenhaochai.com/" target="_blank" rel="noopener noreferrer">Wenhao Chai</a><span class="tm-a">Princeton</span><a class="tm-mail" href="mailto:wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a></span></li>
  </ul>
</div>
</section>
