---
layout: default
title: Blog
permalink: /blog/
nav: true
nav_order: 1
pagination:
  enabled: true
  collection: posts
  permalink: /blog/page/:num/
  per_page: 24
  sort_field: date
  sort_reverse: true
  trail:
    before: 1
    after: 2
# Keep blog list focused on current release year.
show_year: 2026
---

<section class="blog-hero">
  <h1>Blog Posts</h1>
  <p>Research notes, benchmark releases, and agent evaluation insights.</p>
</section>

{% if page.show_year %}
{% assign year_str = page.show_year | append: '' %}
{% assign posts_to_iterate = site.posts | sort: "date" | reverse %}
{% else %}
{% assign posts_to_iterate = paginator.posts %}
{% endif %}

<section class="blog-list-grid">
  {% for post in posts_to_iterate %}
  {% assign post_year = post.date | date: "%Y" %}
  {% unless page.show_year %}{% assign show_post = true %}{% else %}{% if post_year == year_str %}{% assign show_post = true %}{% else %}{% assign show_post = false %}{% endif %}{% endunless %}
  {% if show_post %}
  {% include blog_card.html post=post %}
  {% endif %}
  {% endfor %}
</section>

{% unless page.show_year %}
{% include pagination.html %}
{% endunless %}
