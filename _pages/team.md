---
layout: default
title: Team
description: The people behind FrontierCS, the institutions they come from, and the sponsors who support the project.
permalink: /team/
---

<section class="page-hero">
  <div class="page" id="main" tabindex="-1">
    <h1>Team</h1>
    <p class="lede">FrontierCS is built by more than 100 contributors from universities and research labs.</p>
  </div>
</section>

<section class="journal">
<div class="page">
  <div class="sec-head"><h2 class="sec-title">Contacts</h2></div>
  <div class="people-grid">
    <div class="person"><a href="https://joyemang33.github.io" target="_blank" rel="noopener noreferrer">Qiuyang Mang</a><span>UC Berkeley</span><a class="mail" href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a></div>
    <div class="person"><a href="https://wenhaochai.com/" target="_blank" rel="noopener noreferrer">Wenhao Chai</a><span>Princeton University</span><a class="mail" href="mailto:wenhao.chai@princeton.edu">wenhao.chai@princeton.edu</a></div>
    <div class="person"><b>Huanzhi Mao</b><span>UC Berkeley</span><a class="mail" href="mailto:huanzhimao@berkeley.edu">huanzhimao@berkeley.edu</a></div>
    <div class="person"><a href="https://andylizf.github.io/" target="_blank" rel="noopener noreferrer">Zhifei Li</a><span>UC Berkeley</span><a class="mail" href="mailto:zhifei.li@berkeley.edu">zhifei.li@berkeley.edu</a></div>
  </div>
</div>
</section>

<section class="journal">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Authors</h2>
    <p class="sec-intro">The {{ site.data.team.authors.size }} authors of <a href="https://arxiv.org/abs/2512.15699" target="_blank" rel="noopener noreferrer">FrontierCS: Evolving Challenges for Evolving Intelligence</a>, ICML 2026, in paper order.</p>
  </div></div>
  <ol class="author-grid">
    {%- for a in site.data.team.authors %}
    <li>{% if a.url %}<a href="{{ a.url }}" target="_blank" rel="noopener noreferrer">{{ a.name }}</a>{% else %}{{ a.name }}{% endif %}</li>
    {%- endfor %}
  </ol>
</div>
</section>

<section class="journal fc-contributors">
<div class="page">
  <div class="sec-head">
    <h2 class="sec-title">Institutions</h2>
  </div>
  <p class="sec-intro">More than 100 contributors come from these universities and others.</p>
  <div class="fc-school-grid" aria-label="Contributing academic institutions">
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/berkeley.svg' | relative_url }}" alt="UC Berkeley logo">
      <p>UC Berkeley</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/princeton.svg' | relative_url }}" alt="Princeton University logo">
      <p>Princeton</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/stanford.svg' | relative_url }}" alt="Stanford University logo">
      <p>Stanford</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/mit.svg' | relative_url }}" alt="MIT logo">
      <p>MIT</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/ucsd.svg' | relative_url }}" alt="UCSD logo">
      <p>UCSD</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/washington.png' | relative_url }}" alt="University of Washington logo">
      <p>UW</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/gatech.svg' | relative_url }}" alt="Georgia Tech logo">
      <p>Georgia Tech</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/michigan.svg' | relative_url }}" alt="University of Michigan logo">
      <p>Michigan</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/nyu.svg' | relative_url }}" alt="New York University logo">
      <p>NYU</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/uiuc.png' | relative_url }}" alt="UIUC logo">
      <p>UIUC</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/toronto.svg' | relative_url }}" alt="University of Toronto logo">
      <p>Toronto</p>
    </div>
    <div class="fc-school-card">
      <img src="{{ 'assets/img/institutions/ntu.svg' | relative_url }}" alt="Nanyang Technological University logo">
      <p>NTU</p>
    </div>
  </div>
</div>
</section>

<section class="journal fc-sponsors">
<div class="page">
  <div class="sec-head">
    <h2 class="sec-title">Sponsors</h2>
  </div>
  <div class="fc-sponsor-grid" aria-label="Frontier-CS sponsors">
    <a class="fc-sponsor-card" href="https://www.laude.org/" target="_blank" rel="noopener noreferrer">
      <img src="{{ 'assets/img/sponsors/laude-institute.png' | relative_url }}" alt="Laude Institute logo">
      <p>Laude Institute</p>
    </a>
    <a class="fc-sponsor-card" href="https://modal.com/" target="_blank" rel="noopener noreferrer">
      <img class="fc-modal-logo fc-modal-logo--dark" src="{{ 'assets/img/sponsors/modal.svg' | relative_url }}" alt="">
      <img class="fc-modal-logo fc-modal-logo--light" src="{{ 'assets/img/sponsors/modal-light.svg' | relative_url }}" alt="">
      <p>Modal</p>
    </a>
  </div>
</div>
</section>

<section class="journal">
<div class="page">
  <div class="sec-head"><div>
    <h2 class="sec-title">Join us</h2>
    <p class="sec-intro">We are looking for engineering collaborators to design tasks, build environments and run evaluations. Core contributors are eligible for co-authorship.</p>
  </div></div>
  <div class="fc-pills" style="margin-top:0"><a class="pill" href="{{ '/get-involved/' | relative_url }}">Get involved</a><a class="pill" href="https://discord.com/invite/k4hd2nU4UE" target="_blank" rel="noopener noreferrer">Discord</a></div>
</div>
</section>
