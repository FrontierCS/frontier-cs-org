// Initialize medium zoom on zoomable figures.
(function () {
  if (typeof mediumZoom !== 'function') return;
  var paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#F6F3EC';
  mediumZoom('[data-zoomable]', { margin: 100, background: paper + 'ee' });
})();
