// TeX to SVG paths for the task diagrams (bin/fcs2_fig_tex.py runs it): MathJax 3.2.2, the version family the site's
// pages typeset their formulas with, in its TeX fonts, drawn as paths so a diagram needs no font to show them.
// Reads a JSON list of TeX strings on stdin; writes a JSON list of {inner, vx, vy, w, h}: the SVG's content and viewBox,
// in units of 1/1000 em, the baseline at y = 0. Needs mathjax-full@3.2.2 where node finds it (npm install, or NODE_PATH).
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');
const adaptor = liteAdaptor(); RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {InputJax: new TeX({packages: AllPackages}), OutputJax: new SVG({fontCache: 'none'})});
const out = JSON.parse(require('fs').readFileSync(0, 'utf8')).map(tex => {
  const svg = adaptor.firstChild(doc.convert(tex, {display: false}));
  const [vx, vy, w, h] = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
  if (adaptor.innerHTML(svg).includes('data-mjx-error')) throw new Error('TeX error in ' + tex);
  return {inner: adaptor.innerHTML(svg), vx, vy, w, h};
});
process.stdout.write(JSON.stringify(out));
