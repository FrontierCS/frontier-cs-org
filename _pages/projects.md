---
layout: default
title: Research
description: Featured research from the team, research built on FrontierCS, and the infrastructure that runs it.
permalink: /paper/
---

<section class="page-hero one-line">
  <div class="page" id="main" tabindex="-1">
    <h1>Research</h1>
    <p class="lede">Featured work from the team, research built on FrontierCS, and the infrastructure that runs it.</p>
  </div>
</section>

<section class="journal research-sec" id="featured">
  <div class="page">
    <div class="sec-head"><h2 class="sec-title">Featured by the team</h2></div>
    <div class="paper-list">
      <article class="paper-row">
        <a class="paper-pg" href="https://arxiv.org/abs/2512.15699" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2512.15699.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue">ICML 2026</span></div>
          <h2 class="post-title"><a href="https://arxiv.org/abs/2512.15699" target="_blank" rel="noopener noreferrer">FrontierCS: Evolving Challenges for Evolving Intelligence</a></h2>
          <p class="post-desc">The benchmark paper: how the problems are built and scored, and how models compare with human experts.</p>
        </div>
      </article>
      <article class="paper-row">
        <a class="paper-pg" href="https://arxiv.org/abs/2605.14445" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2605.14445.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue">NeurIPS 2026</span><span class="venue hl">Spotlight</span></div>
          <h2 class="post-title"><a href="https://arxiv.org/abs/2605.14445" target="_blank" rel="noopener noreferrer">FrontierSmith: Synthesizing Open-Ended Coding Problems at Scale</a></h2>
          <p class="post-desc">Turns closed-ended coding problems into open-ended ones for training, with results on FrontierCS and ALE-bench.</p>
        </div>
      </article>
      <article class="paper-row">
        <a class="paper-pg" href="https://arxiv.org/abs/2506.11928" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2506.11928.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue">NeurIPS 2025</span></div>
          <h2 class="post-title"><a href="https://arxiv.org/abs/2506.11928" target="_blank" rel="noopener noreferrer">LiveCodeBench Pro: How Do Olympiad Medalists Judge LLMs in Competitive Programming?</a></h2>
          <p class="post-desc">Competitive-programming problems from live contests, annotated by Olympiad medalists, to find where LLMs still fall short of experts.</p>
        </div>
      </article>
      <article class="paper-row">
        <a class="paper-pg" href="https://arxiv.org/abs/2609.36802" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2609.36802.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
          <h2 class="post-title"><a href="https://arxiv.org/abs/2609.36802" target="_blank" rel="noopener noreferrer">EasyPPO: Stabilizing the Critic Is Key</a></h2>
          <p class="post-desc">A stable PPO for language models, trained with FrontierCS&rsquo;s continuous score among its rewards.</p>
        </div>
      </article>
    </div>
  </div>
</section>

<section class="journal research-sec" id="built">
  <div class="page">
    <div class="sec-head"><div>
      <h2 class="sec-title">Built on FrontierCS</h2>
      <p class="sec-intro">Work that uses the benchmark. Some of it asks how far an agent gets with more time and tokens, some compares search methods, and some trains models on the tasks.</p>
    </div></div>

    <div class="grp">
      <h3>Test-time scaling</h3>
      <div class="paper-list">
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2609.15309" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2609.15309.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2609.15309" target="_blank" rel="noopener noreferrer">When Agents Slow Down: Understanding LLM Agents&rsquo; Test-Time Strategies via Elo-per-token Analysis</a></h2>
            <p class="post-desc">Tracks the best solution at every token budget in sessions of up to 100M tokens. On Polyomino Packing, splitting 100M tokens across parallel sessions gains 264 Elo over one long session.</p>
          </div>
        </article>
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2609.21032" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2609.21032.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2609.21032" target="_blank" rel="noopener noreferrer">Scaling Discovery through Test-Time Communication</a></h2>
            <p class="post-desc">Compares a team of agents that share findings with the best of as many independent agents. On Polyomino Packing the team reaches 0.945, above the best score reported before it.</p>
          </div>
        </article>
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2610.07447" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2610.07447.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2610.07447" target="_blank" rel="noopener noreferrer">Fork-and-Flush: Escaping Idea Basins in Autoresearch Agents</a></h2>
            <p class="post-desc">Periodically forks an agent&rsquo;s run and clears its context so it leaves a plateau. Nine of its thirteen tasks come from FrontierCS; its normalized average is 0.78, against 0.47 for a single run.</p>
          </div>
        </article>
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2610.07625" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2610.07625.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2610.07625" target="_blank" rel="noopener noreferrer">Stateless Language Agents: Scaling Long-Horizon Automated Research</a></h2>
            <p class="post-desc">Keeps the research state in the harness and builds a fresh context for every agent call. On a FrontierCS algorithm-design problem it scores 59.5 at 200M tokens, against 58.0 for the strongest baseline.</p>
          </div>
        </article>
      </div>
    </div>

    <div class="grp">
      <h3>Search scaffolds</h3>
      <div class="paper-list">
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2602.20133" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2602.20133.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2602.20133" target="_blank" rel="noopener noreferrer">AdaEvolve: Adaptive LLM Driven Zeroth-Order Optimization</a></h2>
            <p class="post-desc">Compares evolutionary search methods on the FrontierCS algorithmic problems with 50 GPT-5 calls each. AdaEvolve averages 61.33, against 50.75 for OpenEvolve and 20.64 for a single call.</p>
          </div>
        </article>
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2602.23413" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2602.23413.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2602.23413" target="_blank" rel="noopener noreferrer">EvoX: Meta-Evolution for Automated Discovery</a></h2>
            <p class="post-desc">Evolves the search strategy during a run as well as the solutions. On the FrontierCS algorithmic problems, with 100 iterations each, it reaches a mean of 62.6 and a median of 75.5.</p>
          </div>
        </article>
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2604.01658" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2604.01658.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2604.01658" target="_blank" rel="noopener noreferrer">CORAL: Towards Autonomous Multi-Agent Evolution for Open-Ended Discovery</a></h2>
            <p class="post-desc">Replaces fixed evolutionary rules with long-running agents that share memory. On Polyomino Packing, four agents reach 89.4% coverage, against 56.0% for a single attempt.</p>
          </div>
        </article>
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2610.00675" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2610.00675.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2610.00675" target="_blank" rel="noopener noreferrer">LabBook: Harnessing Experimental History for Efficient LLM-Driven Discovery</a></h2>
            <p class="post-desc">Reuses the history of earlier experiments to guide the search. On 49 FrontierCS algorithmic problems its mean best score is 6.13 points above the strongest baseline with DeepSeek V4 Flash.</p>
          </div>
        </article>
      </div>
    </div>

    <div class="grp">
      <h3>Post-training</h3>
      <div class="paper-list">
        <article class="paper-row">
          <a class="paper-pg" href="https://arxiv.org/abs/2606.29082" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2606.29082.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
          <div>
            <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
            <h2 class="post-title"><a href="https://arxiv.org/abs/2606.29082" target="_blank" rel="noopener noreferrer">Evolution Fine-Tuning: Learning to Discover Across 371 Optimization Tasks</a></h2>
            <p class="post-desc">Turns evolutionary search runs into training data; nearly half of its 371 tasks derive from FrontierCS. On held-out problems its 9B model averages 46.01, against 32.46 for the base model.</p>
          </div>
        </article>
      </div>
    </div>
  </div>
</section>

<section class="journal research-sec" id="infra">
  <div class="page">
    <div class="sec-head"><div>
      <h2 class="sec-title">Infra for FrontierCS</h2>
      <p class="sec-intro">The systems that score a solution and run an agent on the problems.</p>
    </div></div>
    <div class="paper-list">
      <article class="paper-row">
        <a class="paper-pg note" href="{{ '/blog/evaluation/' | relative_url }}" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/blog-thumbs/evaluation.svg' | relative_url }}" alt="" width="1600" height="1000" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue plain">Blog</span></div>
          <h2 class="post-title"><a href="{{ '/blog/evaluation/' | relative_url }}">Evaluating the Hardest CS Problems in the Age of LLMs</a></h2>
          <p class="post-desc">The evaluation behind the leaderboard: resume from hashes, group machines by the hardware a problem needs, and pin the environment so a score can be reproduced.</p>
        </div>
      </article>
      <article class="paper-row">
        <a class="paper-pg note" href="{{ '/blog/harbor/' | relative_url }}" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/blog-thumbs/harbor.svg' | relative_url }}" alt="" width="1600" height="1000" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue plain">Blog</span></div>
          <h2 class="post-title"><a href="{{ '/blog/harbor/' | relative_url }}">Your Next Long-Context Recipe: Open-Ended Problems</a></h2>
          <p class="post-desc">FrontierCS runs inside Harbor, with a preview leaderboard of long-horizon agent runs on the open-ended algorithmic tasks.</p>
        </div>
      </article>
    </div>
  </div>
</section>
