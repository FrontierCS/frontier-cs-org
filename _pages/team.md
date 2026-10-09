---
layout: default
title: Team
description: The authors of FrontierCS, the institutions they come from, and the sponsors who support the project.
permalink: /team/
---
{%- assign t = site.data.team.fcs1 -%}
{%- assign everyone = t.contributors | concat: t.advisors -%}

<section class="page-hero">
  <div class="page" id="main" tabindex="-1">
    <h1>Team</h1>
    <p class="lede">The people who build FrontierCS, the institutions they come from, and the sponsors who support the project.</p>
  </div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">FrontierCS 1</h2>
    <p class="sec-intro">The {{ everyone.size }} authors of <a href="{{ t.url }}" target="_blank" rel="noopener noreferrer">{{ t.title }}</a>, {{ t.venue }}, in paper order.</p>
  </div></div>

  <h3 class="team-group">Contributors <span>{{ t.contributors.size }}</span></h3>
  <ul class="team-grid">
    {%- for p in t.contributors %}{% include team_person.html p=p eq="Equal contribution" %}{% endfor %}
  </ul>

  <h3 class="team-group">Advisors <span>{{ t.advisors.size }}</span></h3>
  <ul class="team-grid">
    {%- for p in t.advisors %}{% include team_person.html p=p eq="Equal advising" %}{% endfor %}
  </ul>
  <p class="team-note">* Equal contribution among contributors; equal advising among advisors.</p>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Institutions</h2>
    <p class="sec-intro">Number of FrontierCS 1 authors at each institution. {% assign ind = everyone | where_exp: "p", "p.affil contains 'Independent'" %}{{ ind.size }} authors are independent researchers.</p>
  </div></div>
  <ul class="inst-grid">
    {%- for i in site.data.team.institutions %}
    {%- assign n = everyone | where_exp: "p", "p.affil contains i.name" %}
    <li>
      {% if i.logo %}<img src="{{ 'assets/img/institutions/' | append: i.logo | relative_url }}" alt="{{ i.name }} logo"><span class="inst-n">{{ i.name }}</span>{% else %}<b class="inst-word">{{ i.name }}</b>{% endif %}<span class="inst-c">{{ n.size }} {% if n.size == 1 %}author{% else %}authors{% endif %}</span>
    </li>
    {%- endfor %}
  </ul>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><h2 class="sec-title">Sponsors</h2></div>
  <ul class="inst-grid sponsor-grid">
    <li><a href="https://www.laude.org/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/laude-institute.png' | relative_url }}" class="badge" alt="Laude Institute logo"><span class="inst-n">Laude Institute</span></a></li>
    <li><a href="https://modal.com/" target="_blank" rel="noopener noreferrer"><img src="{{ 'assets/img/sponsors/modal.svg' | relative_url }}" alt="Modal logo"><span class="inst-n">Modal</span></a></li>
  </ul>
</div>
</section>

<section class="journal team-sec">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Contact</h2>
    <p class="sec-intro">Send questions and leaderboard submissions to any of these 4 people.</p>
  </div></div>
  <ul class="team-grid contact-grid">
    <li class="tm"><span class="tm-av" aria-hidden="true">QM</span><span class="tm-tx"><a class="tm-n" href="https://joyemang33.github.io" target="_blank" rel="noopener noreferrer">Qiuyang Mang</a><span class="tm-a">UC Berkeley</span><a class="tm-mail" href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a></span></li>
    <li class="tm"><span class="tm-av" aria-hidden="true">WC</span><span class="tm-tx"><a class="tm-n" href="https://wenhaochai.com/" target="_blank" rel="noopener noreferrer">Wenhao Chai</a><span class="tm-a">Princeton</span><a class="tm-mail" href="mailto:wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a></span></li>
    <li class="tm"><span class="tm-av" aria-hidden="true">HM</span><span class="tm-tx"><span class="tm-n">Huanzhi Mao</span><span class="tm-a">UC Berkeley</span><a class="tm-mail" href="mailto:huanzhimao@berkeley.edu">huanzhimao@berkeley.edu</a></span></li>
    <li class="tm"><span class="tm-av" aria-hidden="true">ZL</span><span class="tm-tx"><a class="tm-n" href="https://andylizf.github.io/" target="_blank" rel="noopener noreferrer">Zhifei Li</a><span class="tm-a">UC Berkeley</span><a class="tm-mail" href="mailto:zhifei.li@berkeley.edu">zhifei.li@berkeley.edu</a></span></li>
  </ul>
  <p class="team-join">We are looking for engineering collaborators to design tasks, build environments and run evaluations. Core contributors are eligible for co-authorship.</p>
  <div class="fc-pills"><a class="pill" href="{{ '/get-involved/' | relative_url }}">Get involved</a><a class="pill" href="https://discord.com/invite/k4hd2nU4UE" target="_blank" rel="noopener noreferrer">Discord</a></div>
</div>
</section>
