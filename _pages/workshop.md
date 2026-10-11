---
layout: default
title: "Workshop & Challenge"
description: "How Far Are AI Agents from Becoming Computer Scientists? A proposed ICLR 2027 workshop on how a research agent learns what to improve, what to trust, and what to explore."
permalink: /workshop/
page_css: fcs2
---
<div class="fcs2 ws2">
<nav class="sub" aria-label="Sections"><div class="col" id="subnav">
  <a href="#overview" class="on">Overview</a><a href="#topics">Topics</a><a href="#speakers">Speakers</a><a href="#challenge">Challenge</a><a href="#organizers">Organizers</a>
</div></nav>

<div class="col" id="main" tabindex="-1">
<section class="intro" id="overview">
  <p class="ws-st"><span class="venue hl">Proposal</span><span class="venue">ICLR 2027 workshop</span></p>
  <h1>How Far Are AI Agents from Becoming Computer Scientists?</h1>
  <p class="lead">Agents make progress when a person specifies the task and supplies a check on every answer. Real research often gives neither. This workshop is about what an agent does then.</p>
  <p class="ws-prop">We have proposed this workshop and its challenge for ICLR 2027. ICLR decides on November 29, 2026.</p>

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
  <div class="tpw"><ul class="tpr"><li style="--i:0; --h:#1a73e8; --l:#d2e3fc"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/></svg></span><b>Scaling at test time</b><span>Harnesses, search, sampling, evolution</span></li><li style="--i:1; --h:#8e5bef; --l:#e6dcfd"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M10.8 7.1 6.2 15.9M13.2 7.1l4.6 8.8M7.4 18h9.2"/></svg></span><b>Multi-agent research</b><span>Coordination, division of work, review</span></li><li style="--i:2; --h:#12a3a3; --l:#cdeeed"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/></svg></span><b>Training research agents</b><span>Post-training, RL, synthetic data</span></li><li style="--i:3; --h:#1a73e8; --l:#d2e3fc"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/></svg></span><b>Verification and trust</b><span>Replication, falsification, self-made evidence</span></li><li style="--i:4; --h:#8e5bef; --l:#e6dcfd"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/></svg></span><b>Failure modes</b><span>Reward hacking, leakage, gains that do not transfer</span></li><li style="--i:5; --h:#12a3a3; --l:#cdeeed"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M8.2 14.5A6 6 0 1 1 15.8 14.5c-.6.6-.8 1.2-.8 2H9c0-.8-.2-1.4-.8-2z"/></svg></span><b>Choosing questions</b><span>Hypotheses, novelty, research taste</span></li><li style="--i:6; --h:#1a73e8; --l:#d2e3fc"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M2.5 20c.4-3.4 2.6-5.5 5.5-5.5 1.2 0 2.3.4 3.2 1"/><rect x="13.5" y="11" width="8" height="7" rx="2"/><path d="M17.5 11V8.5M15.8 14.3v.4M19.2 14.3v.4"/></svg></span><b>People and agents</b><span>Collaborators, verifiers, sources of taste</span></li><li style="--i:7; --h:#8e5bef; --l:#e6dcfd"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></svg></span><b>Benchmarks and environments</b><span>Verifiable, open-ended CS tasks</span></li><li style="--i:8; --h:#12a3a3; --l:#cdeeed"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/><path d="M10 3v3.5M14 3v3.5M10 17.5V21M14 17.5V21M3 10h3.5M3 14h3.5M17.5 10H21M17.5 14H21"/></svg></span><b>Applied research agents</b><span>Systems, kernels, algorithm discovery</span></li><li style="--i:0; --h:#1a73e8; --l:#d2e3fc" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/></svg></span><b>Scaling at test time</b><span>Harnesses, search, sampling, evolution</span></li><li style="--i:1; --h:#8e5bef; --l:#e6dcfd" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M10.8 7.1 6.2 15.9M13.2 7.1l4.6 8.8M7.4 18h9.2"/></svg></span><b>Multi-agent research</b><span>Coordination, division of work, review</span></li><li style="--i:2; --h:#12a3a3; --l:#cdeeed" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2"/></svg></span><b>Training research agents</b><span>Post-training, RL, synthetic data</span></li><li style="--i:3; --h:#1a73e8; --l:#d2e3fc" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/></svg></span><b>Verification and trust</b><span>Replication, falsification, self-made evidence</span></li><li style="--i:4; --h:#8e5bef; --l:#e6dcfd" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/></svg></span><b>Failure modes</b><span>Reward hacking, leakage, gains that do not transfer</span></li><li style="--i:5; --h:#12a3a3; --l:#cdeeed" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M8.2 14.5A6 6 0 1 1 15.8 14.5c-.6.6-.8 1.2-.8 2H9c0-.8-.2-1.4-.8-2z"/></svg></span><b>Choosing questions</b><span>Hypotheses, novelty, research taste</span></li><li style="--i:6; --h:#1a73e8; --l:#d2e3fc" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M2.5 20c.4-3.4 2.6-5.5 5.5-5.5 1.2 0 2.3.4 3.2 1"/><rect x="13.5" y="11" width="8" height="7" rx="2"/><path d="M17.5 11V8.5M15.8 14.3v.4M19.2 14.3v.4"/></svg></span><b>People and agents</b><span>Collaborators, verifiers, sources of taste</span></li><li style="--i:7; --h:#8e5bef; --l:#e6dcfd" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></svg></span><b>Benchmarks and environments</b><span>Verifiable, open-ended CS tasks</span></li><li style="--i:8; --h:#12a3a3; --l:#cdeeed" aria-hidden="true"><span class="tpi"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/><path d="M10 3v3.5M14 3v3.5M10 17.5V21M14 17.5V21M3 10h3.5M3 14h3.5M17.5 10H21M17.5 14H21"/></svg></span><b>Applied research agents</b><span>Systems, kernels, algorithm discovery</span></li></ul></div>
</section>

<section class="sec" id="speakers">
  <h2>Invited speakers <span class="venue">Confirmed</span></h2>
  <ul class="spk">
    <li><img src="{{ '/assets/img/workshop/alex-dimakis.jpg' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Alex Dimakis</b><span>UC Berkeley · Bespoke Labs</span></li>
    <li><img src="{{ '/assets/img/workshop/azalia-mirhoseini.jpg' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Azalia Mirhoseini</b><span>Stanford · Ricursive Intelligence</span></li>
    <li><img src="{{ '/assets/img/workshop/yuandong-tian.png' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Yuandong Tian</b><span>Recursive Superintelligence</span></li>
    <li><img src="{{ '/assets/img/workshop/matei-zaharia.jpg' | relative_url }}" alt="" width="240" height="240" loading="lazy"><b>Matei Zaharia</b><span>UC Berkeley · Databricks</span></li>
  </ul>
</section>

<section class="sec" id="challenge">
  <div class="chb">
    <div class="chb-t">
      <p class="chb-k">Challenge <span>Problem to be announced</span></p>
      <h2>An open-ended problem in AI for AI R&amp;D</h2>
      <p>Every team gets the same problem and the same budget, and lets its research agents work on it. The winners present at the workshop.</p>
    </div>
    <svg class="chb-art" viewBox="0 0 420 240" aria-hidden="true">
      <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 216H404" stroke-opacity=".35" stroke-width="1.5"/><path d="M24 40H404" stroke-opacity=".35" stroke-width="1.5" stroke-dasharray="2 8"/>
        <path d="M24 196H74V168H128V150H170V118H236V100H280V78H352V62H404" stroke-opacity=".3" stroke-width="3"/>
        <path class="chb-run" pathLength="100" d="M24 196H74V168H128V150H170V118H236V100H280V78H352V62H404" stroke-width="3"/>
      </g>
      <g fill="#fff"><circle cx="74" cy="168" r="5"/><circle cx="128" cy="150" r="5"/><circle cx="170" cy="118" r="5"/><circle cx="236" cy="100" r="5"/><circle cx="280" cy="78" r="5"/><circle cx="352" cy="62" r="5"/></g>
    </svg>
    <ol class="chb-s">
      <li><b>Same start</b><span>One problem and one budget for every team</span></li>
      <li><b>Your agents</b><span>Submit runnable code and a short report</span></li>
      <li><b>Our rerun</b><span>We rerun the top entries before the workshop</span></li>
    </ol>
  </div>
</section>

<section class="sec" id="organizers">
  <h2>Organizers</h2>
  <ul class="orgs">
    <li><img src="{{ '/assets/img/workshop/wenhao-chai.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://wenhaochai.com/" target="_blank" rel="noopener noreferrer">Wenhao Chai</a></b><span>Princeton · Google DeepMind</span><i>General lead</i></div></li>
    <li><img src="{{ '/assets/img/workshop/melissa-pan.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://melissa-pan.github.io/" target="_blank" rel="noopener noreferrer">Melissa Pan</a></b><span>UC Berkeley</span><i>Outreach and panel</i></div></li>
    <li><img src="{{ '/assets/img/workshop/xianbang-wang.jpg' | relative_url }}" alt="" width="176" height="176" loading="lazy"><div><b><a href="https://peppaking8.github.io/" target="_blank" rel="noopener noreferrer">Xianbang Wang</a></b><span>MIT</span><i>Challenge</i></div></li>
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
