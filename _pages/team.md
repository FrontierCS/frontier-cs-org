---
layout: default
title: Team
description: The authors of FrontierCS, the institutions they come from, and the sponsors who support the project.
permalink: /team/
---
{%- assign t = site.data.team.fcs1 -%}
{%- assign everyone = t.contributors | concat: t.advisors -%}
{%- assign fs = site.data.team.fsmith -%}

<section class="page-hero">
  <div class="page" id="main" tabindex="-1">
    <h1>Team</h1>
    <p class="lede">The people who build FrontierCS, the institutions they come from, and the sponsors who support the project.</p>
  </div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Authors</h2>
  </div></div>

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

  <details class="team-fold">
    <summary><h3 class="team-group">FrontierSmith <span>{{ fs.venue }} · {{ fs.authors.size }} authors</span></h3></summary>
    <p class="team-note"><a href="{{ fs.url }}" target="_blank" rel="noopener noreferrer">{{ fs.title }}</a>, in paper order.</p>
    <ul class="team-grid">
      {%- for p in fs.authors %}{% include team_person.html p=p eq="Equal contribution" %}{% endfor %}
    </ul>
    <p class="team-note">* Equal contribution.</p>
  </details>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Institutions</h2>
  </div></div>
  <ul class="logo-wall">
    {%- for i in site.data.team.institutions %}
    <li><img src="{{ 'assets/img/institutions/wordmarks/' | append: i.logo | relative_url }}" alt="{{ i.name }}" style="--h:{{ i.h }}px"></li>
    {%- endfor %}
  </ul>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><h2 class="sec-title">Sponsors</h2></div>
  <ul class="sponsor-row">
    <li><a href="https://modal.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/modal.svg' | relative_url }}" class="modal" alt="Modal"></a></li>
    <li><a href="https://www.laude.org/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/laude-institute-wordmark.png' | relative_url }}" class="laude" alt="Laude Institute"></a></li>
  </ul>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Contact</h2>
    <p class="sec-intro">Send questions and leaderboard submissions to either of us.</p>
  </div></div>
  <ul class="team-grid contact-grid">
    <li class="tm"><span class="tm-tx"><a class="tm-n" href="https://joyemang33.github.io" target="_blank" rel="noopener noreferrer">Qiuyang Mang</a><span class="tm-a">UC Berkeley</span><a class="tm-mail" href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a></span></li>
    <li class="tm"><span class="tm-tx"><a class="tm-n" href="https://wenhaochai.com/" target="_blank" rel="noopener noreferrer">Wenhao Chai</a><span class="tm-a">Princeton</span><a class="tm-mail" href="mailto:wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a></span></li>
  </ul>
  <div class="fc-pills"><a class="pill" href="https://discord.com/invite/k4hd2nU4UE" target="_blank" rel="noopener noreferrer">Discord</a></div>
</div>
</section>
