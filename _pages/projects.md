---
layout: default
title: Research
permalink: /paper/
---

<section class="page-hero one-line">
  <div class="page" id="main" tabindex="-1">
    <h1>Research</h1>
    <p class="lede">Papers from the FrontierCS team.</p>
  </div>
</section>

<section class="journal">
  <div class="page">
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
        <a class="paper-pg" href="https://arxiv.org/abs/2609.15309" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="{{ '/assets/img/fcs1-papers/2609.15309.jpg' | relative_url }}" alt="" width="440" height="570" loading="lazy"></a>
        <div>
          <div class="post-meta"><span class="venue plain">arXiv 2026</span></div>
          <h2 class="post-title"><a href="https://arxiv.org/abs/2609.15309" target="_blank" rel="noopener noreferrer">When Agents Slow Down: Understanding LLM Agents&rsquo; Test-Time Strategies via Elo-per-token Analysis</a></h2>
          <p class="post-desc">Follows the best solution as the token budget grows, and finds where an agent falls behind independent sampling.</p>
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

<!-- Research by others on the benchmark, moved from the FrontierCS page; kept below the team's papers and quieter: no images, small type, two columns (owner, 2026-10-11) -->
<section class="journal built-sec">
  <div class="page">
    <h2 class="built-h">Built on FrontierCS</h2>
    <p class="built-lede">Research that uses the FrontierCS benchmarks.</p>
    <div class="built">
      <div class="built-grp"><h3>Test-time scaling</h3><ul>
        <li><a href="https://arxiv.org/abs/2609.21032" target="_blank" rel="noopener noreferrer">Scaling Discovery through Test-Time Communication</a><span class="au">Park et al.</span><p>Compares a team of agents that share findings with the best of as many independent agents. On Polyomino Packing the team reaches 0.945, above the best score reported before it.</p></li>
        <li><a href="https://arxiv.org/abs/2610.07447" target="_blank" rel="noopener noreferrer">Fork-and-Flush: Escaping Idea Basins in Autoresearch Agents</a><span class="au">Cai et al.</span><p>Periodically forks an agent&rsquo;s run and clears its context so it leaves a plateau. Nine of its thirteen tasks come from FrontierCS; its normalized average is 0.78, against 0.47 for a single run.</p></li>
        <li><a href="https://arxiv.org/abs/2610.07625" target="_blank" rel="noopener noreferrer">Stateless Language Agents: Scaling Long-Horizon Automated Research</a><span class="au">Zhang et al.</span><p>Keeps the research state in the harness and builds a fresh context for every agent call. On a FrontierCS algorithm-design problem it scores 59.5 at 200M tokens, against 58.0 for the strongest baseline.</p></li>
      </ul></div>
      <div class="built-grp"><h3>Search scaffolds</h3><ul>
        <li><a href="https://arxiv.org/abs/2602.20133" target="_blank" rel="noopener noreferrer">AdaEvolve: Adaptive LLM Driven Zeroth-Order Optimization</a><span class="au">Cemri et al.</span><p>Compares evolutionary search methods on the FrontierCS algorithmic problems with 50 GPT-5 calls each. AdaEvolve averages 61.33, against 50.75 for OpenEvolve and 20.64 for a single call.</p></li>
        <li><a href="https://arxiv.org/abs/2602.23413" target="_blank" rel="noopener noreferrer">EvoX: Meta-Evolution for Automated Discovery</a><span class="au">Liu et al.</span><p>Evolves the search strategy during a run as well as the solutions. On the FrontierCS algorithmic problems, with 100 iterations each, it reaches a mean of 62.6 and a median of 75.5.</p></li>
        <li><a href="https://arxiv.org/abs/2604.01658" target="_blank" rel="noopener noreferrer">CORAL: Towards Autonomous Multi-Agent Evolution for Open-Ended Discovery</a><span class="au">Qu et al.</span><p>Replaces fixed evolutionary rules with long-running agents that share memory. On Polyomino Packing, four agents reach 89.4% coverage, against 56.0% for a single attempt.</p></li>
        <li><a href="https://arxiv.org/abs/2610.00675" target="_blank" rel="noopener noreferrer">LabBook: Harnessing Experimental History for Efficient LLM-Driven Discovery</a><span class="au">Yuan et al.</span><p>Reuses the history of earlier experiments to guide the search. On 49 FrontierCS algorithmic problems its mean best score is 6.13 points above the strongest baseline with DeepSeek V4 Flash.</p></li>
      </ul></div>
      <div class="built-grp"><h3>Post-training</h3><ul>
        <li><a href="https://arxiv.org/abs/2606.29082" target="_blank" rel="noopener noreferrer">Evolution Fine-Tuning: Learning to Discover Across 371 Optimization Tasks</a><span class="au">Lee et al.</span><p>Turns evolutionary search runs into training data; nearly half of its 371 tasks derive from FrontierCS. On held-out problems its 9B model averages 46.01, against 32.46 for the base model.</p></li>
      </ul></div>
    </div>
  </div>
</section>
