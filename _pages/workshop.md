---
layout: default
title: Workshop
description: "How Far Are AI Agents from Becoming Computer Scientists? A proposed ICLR 2027 workshop on how a research agent learns what to improve, what to trust, and what to explore."
permalink: /workshop/
page_css: fcs2
---
<div class="fcs2 ws2">
<nav class="sub" aria-label="Sections"><div class="col" id="subnav">
  <a href="#overview" class="on">Overview</a><a href="#topics">Topics</a><a href="#speakers">Speakers</a><a href="#challenge">Challenge</a><a href="#submit">Submit</a><a href="#organizers">Organizers</a>
</div></nav>

<div class="col" id="main" tabindex="-1">
<section class="intro" id="overview">
  <p class="ws-st"><span class="venue hl">Proposal</span><span class="venue">ICLR 2027 workshop</span></p>
  <h1>How Far Are AI Agents from Becoming Computer Scientists?</h1>
  <p class="lead">Agents make progress when a person specifies the task and supplies a check on every answer. Real research often gives neither. This workshop is about what an agent does then.</p>
  <p class="ws-prop">This is a proposal. The dates below are tentative until ICLR decides on November 29, 2026.</p>
  <dl class="tstats">
    <div><dt>Format</dt><dd>Full day</dd><span>In person, non-archival</span></div>
    <div><dt>Submit by, tentative</dt><dd>Feb 1, 2027</dd><span>11:59 p.m. AoE</span></div>
    <div><dt>Challenge, tentative</dt><dd>Feb 2&ndash;8, 2027</dd><span>Problem to be announced</span></div>
    <div><dt>Decisions, tentative</dt><dd>Feb 26, 2027</dd><span>Posted on OpenReview</span></div>
  </dl>

  <div class="lv">
    <article style="--h:#1a73e8; --l:#d2e3fc">
      <span class="lv-n">1</span><h2>What to improve</h2>
      <ul class="lv-g"><li class="on">Task given</li><li class="on">Feedback verifiable</li></ul>
      <p>Today&rsquo;s successes. How do harnesses, teams of agents, people in the loop and post-training get more out of the same setup?</p>
    </article>
    <article style="--h:#8e5bef; --l:#e6dcfd">
      <span class="lv-n">2</span><h2>What to trust</h2>
      <ul class="lv-g"><li class="on">Task given</li><li>Feedback sparse</li></ul>
      <p>Most real research. How does an agent verify, replicate and try to refute a result it produced itself?</p>
    </article>
    <article style="--h:#12a3a3; --l:#cdeeed">
      <span class="lv-n">3</span><h2>What to explore</h2>
      <ul class="lv-g"><li>No task</li><li>No feedback</li></ul>
      <p>The last mile. How does an agent choose a question, judge its novelty and decide when to drop it?</p>
    </article>
  </div>
</section>

<section class="sec" id="topics">
  <h2>Topics</h2>
  <ul class="tp">
    <li>Scaling at test time: harnesses, search, sampling, evolution</li>
    <li>Multi-agent research: coordination, division of work, review</li>
    <li>Training research agents: post-training, RL, synthetic data</li>
    <li>Verification and trust: replication, falsification, self-made evidence</li>
    <li>Failure modes: reward hacking, leakage, gains that do not transfer</li>
    <li>Choosing questions: hypotheses, novelty, research taste</li>
    <li>People and agents: collaborators, verifiers, sources of taste</li>
    <li>Benchmarks and environments for open-ended CS tasks</li>
    <li>Applied agents: systems, kernels, algorithm discovery</li>
  </ul>
</section>

<section class="sec" id="speakers">
  <h2>Invited speakers <span class="venue">Confirmed</span></h2>
  <ul class="spk">
    <li><img src="{{ '/assets/img/workshop/alex-dimakis.jpg' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Alex Dimakis</b><span>UC Berkeley · Bespoke Labs</span></li>
    <li><img src="{{ '/assets/img/workshop/yuandong-tian.png' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Yuandong Tian</b><span>Recursive Superintelligence</span></li>
    <li><img src="{{ '/assets/img/workshop/matei-zaharia.jpg' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Matei Zaharia</b><span>UC Berkeley · Databricks</span></li>
    <li><img src="{{ '/assets/img/workshop/azalia-mirhoseini.jpg' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Azalia Mirhoseini</b><span>Stanford · Ricursive Intelligence</span></li>
  </ul>
</section>

<section class="sec" id="challenge">
  <div class="chb">
    <p class="ws-st"><span class="venue hl">One-week challenge</span><span class="venue">Problem to be announced</span></p>
    <h2>An open-ended problem in AI for AI R&amp;D</h2>
    <p>Every team gets the same problem and the same budget, and lets its research agents work on it for a week. The winners present at the workshop.</p>
    <dl class="tstats">
      <div><dt>Window, tentative</dt><dd>Feb 2&ndash;8, 2027</dd></div>
      <div><dt>Budget</dt><dd>Equal for every team</dd></div>
      <div><dt>You submit</dt><dd>Code and a report</dd></div>
      <div><dt>We do</dt><dd>Rerun the top entries</dd></div>
    </dl>
  </div>
</section>

<section class="sec" id="submit">
  <h2>Submit</h2>
  <div class="sb">
    <div>
      <h3>What</h3>
      <ul class="kv">
        <li><b>Papers and extended abstracts</b><span>Empirical, methods, systems, benchmark or position work</span></li>
        <li><b>Challenge reports and artifacts</b><span>Runnable entries with a short account, negative results included</span></li>
        <li><b>Tiny and short papers</b><span>Small results, replications, early findings; human-written only</span></li>
      </ul>
    </div>
    <div>
      <h3>Who wrote it</h3>
      <ul class="kv">
        <li><b>Fully AI-written</b><span>An agent is the primary author</span></li>
        <li><b>AI-written, human-reviewed</b><span>People reviewed it before submission</span></li>
        <li><b>Human-written</b><span>AI assistance only as ICLR allows</span></li>
      </ul>
    </div>
  </div>
  <p class="tbd sb-n">Every submission states its track. People review every submission and make every decision. The OpenReview link will be posted here if the workshop is accepted.</p>
</section>

<section class="sec" id="organizers">
  <h2>Organizers</h2>
  <ul class="orgs">
    <li><img src="{{ '/assets/img/workshop/wenhao-chai.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://wenhaochai.com/" target="_blank" rel="noopener noreferrer">Wenhao Chai</a></b><span>Princeton · Google DeepMind</span><i>General lead</i></div></li>
    <li><img src="{{ '/assets/img/workshop/melissa-pan.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://melissa-pan.github.io/" target="_blank" rel="noopener noreferrer">Melissa Pan</a></b><span>UC Berkeley</span><i>Outreach and panel</i></div></li>
    <li><em aria-hidden="true">XW</em><div><b><a href="https://peppaking8.github.io/" target="_blank" rel="noopener noreferrer">Xianbang Wang</a></b><span>MIT</span><i>Challenge</i></div></li>
    <li><img src="{{ '/assets/img/workshop/qiuyang-mang.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://joyemang33.github.io/" target="_blank" rel="noopener noreferrer">Qiuyang Mang</a></b><span>UC Berkeley</span><i>Challenge evaluation and review</i></div></li>
    <li><img src="{{ '/assets/img/workshop/dingning-cao.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://diannedaian.github.io/" target="_blank" rel="noopener noreferrer">Dingning Cao</a></b><span>MIT</span><i>Student volunteer</i></div></li>
    <li><img src="{{ '/assets/img/workshop/joseph-gonzalez.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://people.eecs.berkeley.edu/~jegonzal" target="_blank" rel="noopener noreferrer">Joseph E. Gonzalez</a></b><span>UC Berkeley</span><i>Senior advisor</i></div></li>
    <li><img src="{{ '/assets/img/workshop/alvin-cheung.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://people.eecs.berkeley.edu/~akcheung" target="_blank" rel="noopener noreferrer">Alvin Cheung</a></b><span>UC Berkeley</span><i>Senior advisor</i></div></li>
  </ul>
  <p class="tbd sb-n">Questions: <a href="mailto:wc9403@princeton.edu">wc9403@princeton.edu</a> or <a href="mailto:qmang@berkeley.edu">qmang@berkeley.edu</a>.</p>
</section>
</div>
</div>
<script>
(() => { const links = [...document.querySelectorAll('#subnav a')], secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const spy = () => { const bar = document.querySelector('.sub').getBoundingClientRect().bottom + 24, end = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    const cur = end ? secs[secs.length - 1] : secs.filter(e => e.getBoundingClientRect().top <= bar).pop() || secs[0];
    links.forEach((a, i) => a.classList.toggle('on', secs[i] === cur)); };
  addEventListener('scroll', spy, {passive: true}); spy(); })();
</script>
