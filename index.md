---
layout: default
title: Frontier-CS
permalink: /
---

<section class="fc-hero fc-hero-bench">
  <div class="fc-hero-copy">
    <h1><span>Frontier-CS</span><span>Benchmark</span></h1>
    <div class="fc-hero-points">
      <p><em>Unsolved:</em> no solution has achieved perfect scores</p>
      <p><em>Open-ended:</em> research &amp; optimization challenges</p>
      <p><em>Verifiable:</em> continuous scoring, always room to improve</p>
      <p><em>Diverse:</em> systems, ML, algorithms, security, and more</p>
    </div>
    <p class="fc-release-link">→ Read our blog <a href="{{ '/blog/feb-release/' | relative_url }}">here</a>.</p>
    <p class="fc-release-link">→ Read our paper <a href="{{ '/blog/feb-release/' | relative_url }}">here</a>.</p>
  </div>

  <div class="fc-terminal-card" aria-label="Frontier-CS command line benchmark preview">
    <div class="fc-terminal-top">
      <span></span>
      <span></span>
      <span></span>
      <p>frontier-cs · codebase_adaptation · evaluation</p>
    </div>
    <div class="fc-terminal-body">
      <p class="fc-terminal-line fc-terminal-comment" style="--line-delay: 0.2s;"># Run with any standard agent CLI</p>
      <p class="fc-terminal-line" style="--line-delay: 0.9s;"><span class="fc-prompt">$</span> uv run harbor run -d frontier-cs-algorithm \
    -a claude-code -m "anthropic/claude-opus-4-6"</p>
      <p class="fc-terminal-line fc-terminal-spacer" style="--line-delay: 2.05s;" aria-hidden="true">&nbsp;</p>
      <p class="fc-terminal-line fc-terminal-comment" style="--line-delay: 2.3s;"># Try your own solution!</p>
      <p class="fc-terminal-line" style="--line-delay: 3.65s;"><span class="fc-prompt">$</span> uv run frontier eval algorithmic 0 &lt;your_solution.cpp&gt;</p>
      <p class="fc-terminal-line fc-terminal-spacer" style="--line-delay: 4.1s;" aria-hidden="true">&nbsp;</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 4.35s;">track.algorithmic  problem.0  backend.docker</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 5s;">continuous scoring enabled...</p>
      <p class="fc-terminal-line fc-terminal-muted" style="--line-delay: 5.65s;">running public test instances...</p>
      <p class="fc-terminal-line fc-terminal-rule-line" style="--line-delay: 6.25s;" aria-hidden="true"></p>
      <div class="fc-terminal-line fc-terminal-test-block" style="--line-delay: 6.85s;">
        <div class="fc-terminal-run-row">test 5 / 10 <span>score: 43.2</span><i class="fc-terminal-bar fc-terminal-bar-warn"></i></div>
        <div class="fc-terminal-run-row">test 10 / 10 <span>score: 57.8</span><i class="fc-terminal-bar"></i></div>
      </div>
      <p class="fc-terminal-line fc-terminal-rule-line" style="--line-delay: 8s;" aria-hidden="true"></p>
      <p class="fc-terminal-line fc-terminal-success" style="--line-delay: 10.1s;">✓ Score@1 72.6</p>
      <p class="fc-terminal-line fc-terminal-success" style="--line-delay: 11.4s;">✓ leaderboard submission ready</p>
    </div>
  </div>
</section>

<section class="fc-section fc-latest">
  <div class="fc-section-heading fc-section-heading-row">
    <div>
      <h2>Recent blog posts</h2>
    </div>
  </div>
  <div class="fc-post-carousel" data-fc-carousel>
    <button class="fc-carousel-button fc-carousel-button-prev" type="button" data-fc-carousel-prev aria-label="Previous blog">←</button>
    <div class="fc-post-carousel-viewport">
      <div class="fc-post-grid fc-post-track">
    {% assign latest_posts = site.posts | sort: "date" | reverse %}
    {% for post in latest_posts %}
      {% unless post.path contains "2025-04-28-distill-example" %}
      {% include blog_card.html post=post variant="compact" %}
      {% endunless %}
    {% endfor %}
      </div>
    </div>
    <button class="fc-carousel-button fc-carousel-button-next" type="button" data-fc-carousel-next aria-label="Next blog">→</button>
  </div>
</section>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-fc-carousel]").forEach(function (carousel) {
      var track = carousel.querySelector(".fc-post-track");
      var section = carousel.closest(".fc-latest");
      if (!track || !section) return;

      var previous = section.querySelector("[data-fc-carousel-prev]");
      var next = section.querySelector("[data-fc-carousel-next]");
      var card = track.querySelector(".fc-post-card");

      function updateCarouselButtons() {
        var maxScroll = track.scrollWidth - track.clientWidth;
        var hasOverflow = maxScroll > 1;

        if (previous) previous.hidden = !hasOverflow || track.scrollLeft <= 1;
        if (next) next.hidden = !hasOverflow || track.scrollLeft >= maxScroll - 1;
      }

      function scrollByCard(direction) {
        var styles = window.getComputedStyle(track);
        var gap = parseFloat(styles.columnGap || styles.gap) || 0;
        var amount = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
        track.scrollBy({ left: direction * amount, behavior: "smooth" });
      }

      if (previous) previous.addEventListener("click", function () { scrollByCard(-1); });
      if (next) next.addEventListener("click", function () { scrollByCard(1); });
      track.addEventListener("scroll", updateCarouselButtons);
      window.addEventListener("resize", updateCarouselButtons);
      updateCarouselButtons();
    });
  });
</script>

<section id="leaderboard" class="fc-section fc-leaderboard">
  <div class="fc-section-heading fc-section-heading-row">
    <div>
      <h2>Leaderboard</h2>
    </div>
    <span>Updated 2026-05-04</span>
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
              <td><span class="fc-medal">🥇</span></td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-google" aria-hidden="true">G</span><span class="fc-model-name">gemini-3.0-pro</span></span></td>
              <td>33.12</td>
              <td>34.58</td>
              <td>56.09</td>
              <td>1265</td>
            </tr>
            <tr>
              <td><span class="fc-medal">🥈</span></td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5.2-thinking</span></span></td>
              <td>32.40</td>
              <td>33.11</td>
              <td>47.19</td>
              <td>1242</td>
            </tr>
            <tr>
              <td><span class="fc-medal">🥉</span></td>
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
              <td><span class="fc-medal">🥇</span></td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-google" aria-hidden="true">G</span><span class="fc-model-name">gemini-3.0-pro</span></span></td>
              <td>46.55</td>
              <td>43.14</td>
              <td>59.22</td>
              <td>1283</td>
            </tr>
            <tr>
              <td><span class="fc-medal">🥈</span></td>
              <td><span class="fc-model-entry"><span class="fc-model-logo fc-model-logo-openai" aria-hidden="true">OA</span><span class="fc-model-name">gpt-5-thinking</span></span></td>
              <td>30.91</td>
              <td>34.94</td>
              <td>55.25</td>
              <td>1218</td>
            </tr>
            <tr>
              <td><span class="fc-medal">🥉</span></td>
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
        <p>Coming soon</p>
      </div>
      <div class="fc-leaderboard-empty">
        <p>Agent results will appear here once the track is released.</p>
      </div>
    </article>
  </div>
</section>

<script>
  document.addEventListener("DOMContentLoaded", function () {
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
  });
</script>

<section class="fc-section fc-tasks">
  <div class="fc-section-heading fc-section-heading-row">
    <div>
      <h2>Example tasks</h2>
    </div>
  </div>

  <div class="fc-task-grid">
    <a class="fc-task-card" href="https://github.com/FrontierCS/Frontier-CS/blob/main/algorithmic/problems/2/statement.txt" target="_blank" rel="noopener noreferrer">
      <div class="fc-task-placeholder" aria-hidden="true">
        <span>?</span>
      </div>
      <div class="fc-task-body">
        <h3>Permutation Recovery</h3>
        <p>Recover a hidden permutation using as few adaptive queries as possible. The task tests information-efficient probing, feedback-driven planning, and reasoning under sparse signals.</p>
        <span>View task →</span>
      </div>
    </a>

    <a class="fc-task-card" href="https://github.com/FrontierCS/Frontier-CS" target="_blank" rel="noopener noreferrer">
      <div class="fc-task-visual">
        <img src="{{ 'assets/img/2026-03-06-agent-evaluation/evolution.gif' | relative_url }}" alt="Polyomino packing evolution preview">
      </div>
      <div class="fc-task-body">
        <h3>Polyomino Packing</h3>
        <p>Pack geometric pieces into increasingly dense layouts. The task rewards iterative search, heuristic design, symmetry handling, and long-horizon improvement.</p>
        <span>View task →</span>
      </div>
    </a>
  </div>
</section>

<section class="fc-section fc-contributors">
  <h2>100+ Contributors from</h2>
  <p class="fc-contributors-label">Academic institutions</p>
  <div class="fc-logo-marquee" aria-label="Contributing academic institutions">
    <div class="fc-logo-track">
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/berkeley.svg' | relative_url }}" alt="UC Berkeley logo">
        <p>UC Berkeley</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/princeton.svg' | relative_url }}" alt="Princeton University logo">
        <p>Princeton University</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/ucsd.svg' | relative_url }}" alt="UCSD logo">
        <p>UCSD</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/gatech.svg' | relative_url }}" alt="Georgia Tech logo">
        <p>Georgia Tech</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/stanford.svg' | relative_url }}" alt="Stanford University logo">
        <p>Stanford University</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/washington.png' | relative_url }}" alt="University of Washington logo">
        <p>University of Washington</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/ntu.svg' | relative_url }}" alt="Nanyang Technological University logo">
        <p>Nanyang Technological University</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/toronto.svg' | relative_url }}" alt="University of Toronto logo">
        <p>University of Toronto</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/uiuc.png' | relative_url }}" alt="UIUC logo">
        <p>UIUC</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/michigan.svg' | relative_url }}" alt="University of Michigan logo">
        <p>University of Michigan</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/nyu.svg' | relative_url }}" alt="New York University logo">
        <p>New York University</p>
      </div>
      <div class="fc-school-card">
        <img src="{{ 'assets/img/institutions/mit.svg' | relative_url }}" alt="MIT logo">
        <p>MIT</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/berkeley.svg' | relative_url }}" alt="">
        <p>UC Berkeley</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/princeton.svg' | relative_url }}" alt="">
        <p>Princeton University</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/ucsd.svg' | relative_url }}" alt="">
        <p>UCSD</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/gatech.svg' | relative_url }}" alt="">
        <p>Georgia Tech</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/stanford.svg' | relative_url }}" alt="">
        <p>Stanford University</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/washington.png' | relative_url }}" alt="">
        <p>University of Washington</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/ntu.svg' | relative_url }}" alt="">
        <p>Nanyang Technological University</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/toronto.svg' | relative_url }}" alt="">
        <p>University of Toronto</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/uiuc.png' | relative_url }}" alt="">
        <p>UIUC</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/michigan.svg' | relative_url }}" alt="">
        <p>University of Michigan</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/nyu.svg' | relative_url }}" alt="">
        <p>New York University</p>
      </div>
      <div class="fc-school-card" aria-hidden="true">
        <img src="{{ 'assets/img/institutions/mit.svg' | relative_url }}" alt="">
        <p>MIT</p>
      </div>
    </div>
  </div>
</section>

