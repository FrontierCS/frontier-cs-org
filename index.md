---
layout: default
title: Frontier-CS
permalink: /
---

<section class="fc-hero fc-hero-bench">
  <div class="fc-hero-copy">
    <h1><span>Frontier-CS</span><span>Benchmark</span></h1>
    <p class="fc-hero-tagline">A benchmark that doesn't saturate.</p>
    <div class="fc-hero-features">
      <div class="fc-hero-feature">
        <span class="fc-hero-feature-num">01</span>
        <p class="fc-hero-feature-label">Unsolved</p>
        <p class="fc-hero-feature-body">No solution has achieved perfect scores.</p>
      </div>
      <div class="fc-hero-feature">
        <span class="fc-hero-feature-num">02</span>
        <p class="fc-hero-feature-label">Open-ended</p>
        <p class="fc-hero-feature-body">Research and optimization challenges.</p>
      </div>
      <div class="fc-hero-feature">
        <span class="fc-hero-feature-num">03</span>
        <p class="fc-hero-feature-label">Verifiable</p>
        <p class="fc-hero-feature-body">Continuous scoring, always room to improve.</p>
      </div>
      <div class="fc-hero-feature">
        <span class="fc-hero-feature-num">04</span>
        <p class="fc-hero-feature-label">Diverse</p>
        <p class="fc-hero-feature-body">Systems, ML, algorithms, security, and more.</p>
      </div>
    </div>
    <p class="fc-release-link">→ Read our blog <a href="{{ '/blog/feb-release/' | relative_url }}">here</a>.</p>
    <p class="fc-release-link">→ Read our paper <a href="{{ '/blog/feb-release/' | relative_url }}">here</a>.</p>
    <p class="fc-release-link">→ View our GitHub <a href="https://github.com/FrontierCS/Frontier-CS" target="_blank" rel="noopener noreferrer">here</a>.</p>
  </div>

  <div class="fc-terminal-card" aria-label="Frontier-CS Harbor agent evaluation preview">
    <div class="fc-terminal-top">
      <span></span>
      <span></span>
      <span></span>
      <p>frontier-cs · harbor trial · 2.0</p>
    </div>
    <div class="fc-terminal-body">
      <p class="fc-terminal-line fc-terminal-comment" style="--line-delay: 0.1s;"># Run a Frontier-CS 2.0 task through Harbor</p>
      <p class="fc-terminal-line" style="--line-delay: 0.45s;"><span class="fc-prompt">$</span> uv run frontier harbor trial 2.0 erdos_unit_distance \
    -a codex -m gpt-5.5 --json</p>
      <p class="fc-terminal-line fc-terminal-spacer" style="--line-delay: 1.025s;" aria-hidden="true">&nbsp;</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 1.15s;">generating frontier-cs-2-0-erdos-unit-distance</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 1.45s;">starting Harbor trial with iterative submissions...</p>
      <p class="fc-terminal-line fc-terminal-rule-line" style="--line-delay: 1.85s;" aria-hidden="true"></p>
      <p class="fc-terminal-line fc-terminal-run-row" style="--line-delay: 2.15s;">submit #1 <span>score: 55.80</span><i class="fc-terminal-bar fc-terminal-bar-warn"></i></p>
      <p class="fc-terminal-line fc-terminal-run-row" style="--line-delay: 2.65s;">submit #2 <span>score: 78.50</span><i class="fc-terminal-bar fc-terminal-bar-long"></i></p>
      <p class="fc-terminal-line fc-terminal-rule-line" style="--line-delay: 2.8s;" aria-hidden="true"></p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 3.1s;">trial_status=scored  agent_status=completed</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 3.4s;">reward=0.7850  cost=$1.94  submissions=2</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 3.7s;">tokens: 1.51M input / 19.9K output</p>
      <p class="fc-terminal-line fc-terminal-rule-line" style="--line-delay: 4.1s;" aria-hidden="true"></p>
      <p class="fc-terminal-line fc-terminal-success" style="--line-delay: 4.55s;">✓ Harbor trial scored: 78.50</p>
      <p class="fc-terminal-line fc-terminal-success" style="--line-delay: 5.05s;">✓ result.json and verifier artifacts saved</p>
    </div>
  </div>
</section>

<section class="fc-section fc-latest">
  <div class="fc-section-heading fc-section-heading-row">
    <div>
      <h2>Recent blog posts</h2>
    </div>
  </div>

  {% assign latest_posts = site.posts | sort: "date" | reverse %}

  <div class="fc-post-grid">
    {% assign featured_shown = 0 %}
    {% for post in latest_posts %}
      {% unless post.path contains "2025-04-28-distill-example" %}
        {% if featured_shown < 3 %}
          {% include blog_card.html post=post variant="compact" %}
          {% assign featured_shown = featured_shown | plus: 1 %}
        {% endif %}
      {% endunless %}
    {% endfor %}
  </div>

  <ul class="fc-post-list" aria-label="More recent posts">
    {% assign list_shown = 0 %}
    {% assign list_skipped = 0 %}
    {% for post in latest_posts %}
      {% unless post.path contains "2025-04-28-distill-example" %}
        {% if list_skipped < 3 %}
          {% assign list_skipped = list_skipped | plus: 1 %}
        {% elsif list_shown < 5 %}
          <li class="fc-post-list-item">
            <a href="{{ post.url | relative_url }}">
              <span class="fc-post-list-date">{{ post.date | date: '%b %-d, %Y' }}</span>
              <span class="fc-post-list-title">{{ post.title }}</span>
              <span class="fc-post-list-arrow" aria-hidden="true">→</span>
            </a>
          </li>
          {% assign list_shown = list_shown | plus: 1 %}
        {% endif %}
      {% endunless %}
    {% endfor %}
  </ul>

  <p class="fc-blog-cta">
    <a href="{{ '/blog/' | relative_url }}">Read more posts <span aria-hidden="true">→</span></a>
  </p>
</section>

<section id="leaderboard" class="fc-section fc-leaderboard">
  <div class="fc-section-heading fc-section-heading-row">
    <div>
      <h2>Leaderboard</h2>
    </div>
    <span>Updated 2026-05-13</span>
  </div>

  <div class="fc-leaderboard-tabs" role="tablist" aria-label="Leaderboard tracks">
    <button class="fc-leaderboard-tab is-active" type="button" role="tab" aria-selected="true" data-fc-leaderboard-tab="algorithmic">Algorithmic</button>
    <button class="fc-leaderboard-tab" type="button" role="tab" aria-selected="false" data-fc-leaderboard-tab="research">Research</button>
    <button class="fc-leaderboard-tab" type="button" role="tab" aria-selected="false" data-fc-leaderboard-tab="agent">Agent</button>
  </div>

  <div class="fc-leaderboard-grid">
    <article class="fc-leaderboard-card fc-leaderboard-panel is-active" data-fc-leaderboard-panel="algorithmic">
      <div class="fc-leaderboard-card-header">
        <h3>Algorithmic Track</h3>
        <p>172 problems</p>
      </div>
      <div class="fc-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Model</th>
              <th>Score@1</th>
              <th>Avg@5</th>
              <th>Score@5</th>
              <th>Elo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-google" aria-hidden="true">G</span><span class="fc-model-name">gemini-3.0-pro</span></span></td>
              <td>33.12</td>
              <td>34.58</td>
              <td>56.09</td>
              <td>1265</td>
            </tr>
            <tr>
              <td>2</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5.2-thinking</span></span></td>
              <td>32.40</td>
              <td>33.11</td>
              <td>47.19</td>
              <td>1242</td>
            </tr>
            <tr>
              <td>3</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5-thinking</span></span></td>
              <td>23.10</td>
              <td>22.58</td>
              <td>39.73</td>
              <td>1196</td>
            </tr>
            <tr>
              <td>4</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-deepseek" aria-hidden="true">DS</span><span class="fc-model-name">deepseek-3.2</span></span></td>
              <td>24.83</td>
              <td>23.89</td>
              <td>41.44</td>
              <td>1193</td>
            </tr>
            <tr>
              <td>5</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-xai" aria-hidden="true">xAI</span><span class="fc-model-name">grok-4</span></span></td>
              <td>24.04</td>
              <td>22.98</td>
              <td>36.81</td>
              <td>1174</td>
            </tr>
            <tr>
              <td>6</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-google" aria-hidden="true">G</span><span class="fc-model-name">gemini-2.5-pro</span></span></td>
              <td>20.34</td>
              <td>19.32</td>
              <td>36.65</td>
              <td>1167</td>
            </tr>
            <tr>
              <td>7</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5.1-thinking</span></span></td>
              <td>20.64</td>
              <td>21.49</td>
              <td>34.76</td>
              <td>1164</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="fc-human-reference">Human reference: 86.99 (Score@1)</p>
    </article>

    <article class="fc-leaderboard-card fc-leaderboard-panel" data-fc-leaderboard-panel="research">
      <div class="fc-leaderboard-card-header">
        <h3>Research Track</h3>
        <p>68 problems</p>
      </div>
      <div class="fc-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Model</th>
              <th>Score@1</th>
              <th>Avg@5</th>
              <th>Score@5</th>
              <th>Elo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-google" aria-hidden="true">G</span><span class="fc-model-name">gemini-3.0-pro</span></span></td>
              <td>46.55</td>
              <td>43.14</td>
              <td>59.22</td>
              <td>1283</td>
            </tr>
            <tr>
              <td>2</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5-thinking</span></span></td>
              <td>30.91</td>
              <td>34.94</td>
              <td>55.25</td>
              <td>1218</td>
            </tr>
            <tr>
              <td>3</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5.1-thinking</span></span></td>
              <td>32.12</td>
              <td>33.70</td>
              <td>56.79</td>
              <td>1214</td>
            </tr>
            <tr>
              <td>4</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5.2-thinking</span></span></td>
              <td>30.29</td>
              <td>34.09</td>
              <td>58.90</td>
              <td>1210</td>
            </tr>
            <tr>
              <td>5</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-google" aria-hidden="true">G</span><span class="fc-model-name">gemini-2.5-pro</span></span></td>
              <td>21.66</td>
              <td>25.74</td>
              <td>51.57</td>
              <td>1180</td>
            </tr>
            <tr>
              <td>6</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-xai" aria-hidden="true">xAI</span><span class="fc-model-name">grok-4</span></span></td>
              <td>26.75</td>
              <td>24.01</td>
              <td>48.15</td>
              <td>1149</td>
            </tr>
            <tr>
              <td>7</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-deepseek" aria-hidden="true">DS</span><span class="fc-model-name">deepseek-3.2</span></span></td>
              <td>21.51</td>
              <td>21.76</td>
              <td>44.41</td>
              <td>1146</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="fc-leaderboard-card fc-leaderboard-panel" data-fc-leaderboard-panel="agent">
      <div class="fc-leaderboard-card-header">
        <h3>Agent Track</h3>
        <p>178 tasks</p>
      </div>
      <div class="fc-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Agent</th>
              <th>Score</th>
              <th>Avg Steps</th>
              <th>Avg Tools</th>
              <th>Avg Tokens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-kimi" aria-hidden="true">K</span><span class="fc-model-name">Kimi K2.6</span></span></td>
              <td>46.9</td>
              <td>67.2</td>
              <td>70.6</td>
              <td>155.6K</td>
            </tr>
            <tr>
              <td>2</td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-anthropic" aria-hidden="true">C</span><span class="fc-model-name">Claude Code Opus 4.7</span></span></td>
              <td>43.0</td>
              <td>77.2</td>
              <td>42.2</td>
              <td>251K</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="fc-human-reference">Preview Harbor runs with a 5-hour timeout per task. See the <a href="{{ '/blog/harbor/' | relative_url }}">release blog</a> for trace-level analysis.</p>
    </article>
  </div>

  <p class="fc-leaderboard-cta">
    <a href="https://github.com/FrontierCS/Frontier-CS" target="_blank" rel="noopener noreferrer">View benchmark on GitHub <span aria-hidden="true">→</span></a>
  </p>
</section>

<script>
  (function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-fc-leaderboard-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-fc-leaderboard-panel]"));

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-fc-leaderboard-tab");

        tabs.forEach(function (item) {
          var isActive = item === tab;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-fc-leaderboard-panel") === target);
        });
      });
    });
  })();
</script>

<section class="fc-section fc-tasks">
  <div class="fc-section-heading fc-section-heading-row">
    <div>
      <h2>Example tasks</h2>
      <p class="fc-task-intro">Frontier-CS tasks are open-ended, verifiable optimization challenges: agents can inspect the task, iterate on submissions, and climb a continuous score instead of passing a single hidden test.</p>
    </div>
    <a href="https://github.com/FrontierCS/Frontier-CS" target="_blank" rel="noopener noreferrer">Browse tasks →</a>
  </div>

  <div class="fc-task-grid">
    <a class="fc-task-card" href="https://github.com/FrontierCS/Frontier-CS/tree/main/2.0/problems/erdos_unit_distance" target="_blank" rel="noopener noreferrer">
      <div class="fc-task-visual fc-task-visual-showcase">
        <img src="{{ 'assets/img/example-tasks/erdos-unit-distance.gif' | relative_url }}" alt="Animated Erdos unit distance task visualization">
      </div>
      <div class="fc-task-body">
        <div class="fc-task-meta">
          <h3>Erdos Unit Distance</h3>
          <span>View task →</span>
        </div>
        <p>Place a fixed set of planar points so that as many pairs as possible sit exactly one unit apart. The task rewards geometric search, symmetry-aware construction, and steady agent iteration.</p>
      </div>
    </a>

    <a class="fc-task-card" href="https://github.com/FrontierCS/Frontier-CS/blob/main/algorithmic/problems/0/statement.txt" target="_blank" rel="noopener noreferrer">
      <div class="fc-task-visual fc-task-visual-showcase">
        <img src="{{ 'assets/img/example-tasks/polyomino-packing-square.gif' | relative_url }}" alt="Animated polyomino packing task visualization">
      </div>
      <div class="fc-task-body">
        <div class="fc-task-meta">
          <h3>Polyomino Packing</h3>
          <span>View task →</span>
        </div>
        <p>Pack thousands of small geometric pieces into the tightest possible rectangle. The task rewards heuristic design, rotation/reflection handling, and long-horizon layout improvement.</p>
      </div>
    </a>
  </div>
</section>

<section class="fc-section fc-contributors">
  <h2>100+ Contributors from</h2>
  <p class="fc-contributors-label">Academic institutions</p>
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
</section>

<section class="fc-section fc-contributors fc-sponsors">
  <h2>Sponsors</h2>
  <div class="fc-sponsor-grid" aria-label="Frontier-CS sponsors">
    <a class="fc-sponsor-card" href="https://www.laude.org/" target="_blank" rel="noopener noreferrer">
      <img src="{{ 'assets/img/sponsors/laude-institute.svg' | relative_url }}" alt="Laude Institute logo">
      <p>Laude Institute</p>
    </a>
  </div>
</section>
