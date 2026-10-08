// Frontier-CS — shared page behaviour (ported from wenhaochai.com site.js).
// Topbar shadow, mobile nav, article contents scrollspy,
// heading ids for the contents links, and small shims for distill.pub tags.
(function () {
  // Topbar: hairline shadow once the page is scrolled.
  var bar = document.querySelector('header.topbar');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 4); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile nav: the hamburger drops the nav down as a panel.
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.topbar .nav-aux');
  if (toggle && nav) {
    var close = function () { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) close();
    });
    window.addEventListener('resize', close);
  }

  // Article body: make sure every h2/h3 carries the id the contents column links to.
  var article = document.querySelector('d-article') || document.querySelector('.post-content');
  if (article) {
    article.querySelectorAll('h2, h3').forEach(function (h) {
      var slug = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');   // same as Jekyll's slugify, which builds the contents links
      if (slug && (!h.id || document.querySelector('.ar-toc a[href="#' + slug + '"]'))) h.id = slug;
    });

    // <d-math>x</d-math> → inline TeX for MathJax.
    article.querySelectorAll('d-math').forEach(function (m) {
      if (m.getAttribute('block') !== null) m.textContent = '\\[' + m.textContent + '\\]';
      else m.textContent = '\\(' + m.textContent + '\\)';
    });

    // <d-footnote> → numbered margin notes, as in the report layout.
    var n = 0;
    article.querySelectorAll('d-footnote').forEach(function (f) {
      n += 1;
      var host = f.closest('p, li, figcaption, div') || f.parentNode;
      var sup = document.createElement('sup');
      sup.className = 'fn';
      sup.textContent = n;
      f.parentNode.insertBefore(sup, f);
      var note = document.createElement('aside');
      note.className = 'fnote';
      note.setAttribute('data-n', n);
      note.innerHTML = f.innerHTML;
      f.remove();
      if (host.classList) host.classList.add('fnp');
      host.appendChild(note);
    });

    // <d-cite key="a,b"> → the cited keys, since no bibliography element is rendered.
    article.querySelectorAll('d-cite').forEach(function (c) {
      if (!c.textContent.trim()) c.textContent = (c.getAttribute('key') || '').split(',').join(', ');
    });
  }

  // Contents column: highlight the section in view.
  var toc = document.querySelector('.ar-toc');
  if (toc && article && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) { byId[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
    var heads = Array.prototype.slice.call(article.querySelectorAll('h2[id], h3[id]')).filter(function (h) { return byId[h.id]; });
    var setActive = function (id) {
      links.forEach(function (a) { a.classList.toggle('active', a === byId[id]); });
    };
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= 120) current = heads[i].id;
      }
      if (current) setActive(current);
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });
    window.addEventListener('scroll', function () {
      var current = null;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].getBoundingClientRect().top <= 120) current = heads[i].id;
      }
      if (current) setActive(current);
    }, { passive: true });
  }
})();
