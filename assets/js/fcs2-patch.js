// The patch viewer of the FrontierCS 2 pages, shared by the task pages (assets/js/fcs2-task.js, loaded after this) and the
// case studies (Qiuyang, 2026-10-17: a case study shows its run's patch as the task pages do). assets/css/fcs2-patch.css
// holds its styles. It needs nothing else from the site's scripts and exposes window.PatchView. On a page, a block with
// data-patch and a hidden link to a patch file (bin/fcs2_patches_from_platform.py) gets the model line and the folded patch.
window.PatchView = (() => {
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;   // the patch counts files

// a patch without git's own header (a plain unified diff) gets one per file, so it shows its file names too
const withHeads = t => t.includes('diff --git ') ? t : t.replace(/^--- (?:a\/)?(.+)\n\+\+\+ (?:b\/)?(.+)$/gm, (m, a, b) => `diff --git a/${b} b/${b}\n${m}`);
// a line longer than LONG characters (one-line JSON answers) shows its start and how much follows
const LONG = 600, cut = l => l.length > LONG ? `${esc(l.slice(0, LONG))}<i class="dmore"> … ${(l.length - LONG).toLocaleString('en-US')} more characters</i>` : esc(l);
const lines = n => `<b>${n}</b> ${n === 1 ? 'line' : 'lines'}`;

/* The patch as Claude Code shows an edit (Qiuyang, 2026-10-14: concise and strong, in Claude Code's design): for each file
   "Update(path)", or "Write(path)" for a new one, an elbow line with its counts, then numbered rows, the old line's number
   on a removal and the new one's otherwise, "…" between hunks, and Claude Code's light-theme colours. Within a removed
   line and the added line that replaces it, the changed words are marked, unless most of the line changed. A file longer
   each file folds on its own, its two head lines as the fold's summary, open when it is the patch's only file (Qiuyang,
   2026-10-14); an open file's rows scroll in a box as the task list on the overview does: its drawn rail, the foot
   fading until the end, no frame. */
function parsePatch(text) {
  const files = []; let f = null, o = 0, n = 0, inHunk = false;
  for (const l of withHeads(text).split('\n')) {
    if (l.startsWith('diff --git ')) { f = {path: l.replace(/^diff --git a\/.*? b\//, ''), kind: 'Update', rows: [], add: 0, del: 0}; files.push(f); inHunk = false; continue; }
    if (!f) continue;
    const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (h) { if (f.rows.length) f.rows.push({t: 'g'}); o = +h[1]; n = +h[2]; inHunk = true; continue; }
    if (!inHunk) {   // the file's header lines
      if (l.startsWith('new file mode') || l === '--- /dev/null') f.kind = 'Write';
      else if (l.startsWith('deleted file mode') || l === '+++ /dev/null') f.kind = 'Delete';
      else if (l.startsWith('Binary files') || l.startsWith('GIT binary patch')) f.binary = true;
      continue;
    }
    if (l[0] === '+') { f.rows.push({t: 'a', n: n++, s: l.slice(1)}); f.add++; }
    else if (l[0] === '-') { f.rows.push({t: 'd', n: o++, s: l.slice(1)}); f.del++; }
    else if (l[0] === ' ') { f.rows.push({t: 'c', n: n++, s: l.slice(1)}); o++; }
  }
  files.forEach(f => f.rows.forEach((r, i) => {   // a run of removals, then the additions that replace them, line for line
    if (r.t !== 'd' || (f.rows[i - 1] || {}).t === 'd') return;
    let j = i; while (f.rows[j] && f.rows[j].t === 'd') j++;
    for (let k = 0; k < j - i && f.rows[j + k] && f.rows[j + k].t === 'a'; k++) marks(f.rows[i + k], f.rows[j + k]);
  }));
  return files;
}
const toks = s => s.match(/\s+|\w+|[^\s\w]/g) || [];
function marks(d, a) {
  if (d.s.length > LONG || a.s.length > LONG) return;
  const x = toks(d.s), y = toks(a.s); let i = 0, j = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  while (j < x.length - i && j < y.length - i && x[x.length - 1 - j] === y[y.length - 1 - j]) j++;
  const mx = x.slice(i, x.length - j).join(''), my = y.slice(i, y.length - j).join('');
  if (mx.length + my.length > .4 * (d.s.length + a.s.length)) return;   // mostly rewritten: no marks, as Claude Code does
  const wrap = (t, m) => esc(t.slice(0, i).join('')) + (m ? `<mark>${esc(m)}</mark>` : '') + esc(t.slice(t.length - j).join(''));
  d.h = wrap(x, mx); a.h = wrap(y, my);
}
function fileHTML(f, i, all) {
  const w = f.kind === 'Write';
  const sum = f.binary ? 'Binary file' : w ? `Wrote ${lines(f.add)}` : f.kind === 'Delete' ? `Removed ${lines(f.del)}`
    : [f.add ? `Added ${lines(f.add)}` : '', f.del ? `${f.add ? 'removed' : 'Removed'} ${lines(f.del)}` : ''].filter(Boolean).join(', ');
  const nw = String(Math.max(1, ...f.rows.map(r => r.n || 0))).length;
  const rows = f.rows.map(r => r.t === 'g' ? '<div class="r g"><span class="n"></span><span class="s"></span><span class="c">…</span></div>'
    : `<div class="r ${r.t}"><span class="n">${r.n}</span><span class="s">${r.t === 'a' ? '+' : r.t === 'd' ? '-' : ''}</span>`
      + `<span class="c">${r.h != null ? r.h : cut(r.s)}</span></div>`).join('');
  const head = `<span class="cct"><b>${f.kind}</b>(${esc(f.path)})</span><span class="ccs">${sum}</span>`;
  if (!f.rows.length) return `<div class="ccf"><span class="cch">${head}</span></div>`;   // nothing to unfold: a binary file
  return `<details class="fold ccf"${all.length === 1 ? ' open' : ''}><summary><span class="cch">${head}</span></summary>`
    + `<div class="ccwrap"><div class="ccbox" tabindex="0"><div class="ccd" style="--nw:${nw + 2}ch">${rows}</div></div>`
    + '<div class="rail" hidden><i></i></div></div></details>';
}
// a box that scrolls with the overview's drawn rail (fcs2.js, the task list): the thumb's height is the visible share, its
// top the share scrolled; dragging it scrolls in step, a press on the rail centres the thumb there first; the foot fades
// until the end. Returns the function that redraws it, for a scroll, an opened fold or a resize.
function railed(box, rail) {
  const th = rail.firstElementChild;
  const at = () => { box.classList.toggle('at-end', box.scrollTop + box.clientHeight >= box.scrollHeight - 2);
    const over = box.scrollHeight > box.clientHeight + 1; rail.hidden = !over;
    if (over) { const h = Math.max(36, box.clientHeight * box.clientHeight / box.scrollHeight); th.style.height = `${h}px`;
      th.style.top = `${(box.clientHeight - h) * box.scrollTop / (box.scrollHeight - box.clientHeight)}px`; } };
  box.addEventListener('scroll', at, {passive:true});
  rail.addEventListener('pointerdown', e => { const r = rail.getBoundingClientRect(), span = box.clientHeight - th.offsetHeight;
    const per = (box.scrollHeight - box.clientHeight) / (span || 1);
    if (e.target !== th) box.scrollTop = (e.clientY - r.top - th.offsetHeight / 2) * per;
    const y0 = e.clientY, s0 = box.scrollTop; rail.classList.add('drag'); rail.setPointerCapture(e.pointerId); e.preventDefault();
    const move = ev => { box.scrollTop = s0 + (ev.clientY - y0) * per; };
    const up = () => { rail.classList.remove('drag'); rail.removeEventListener('pointermove', move); rail.removeEventListener('pointerup', up); rail.removeEventListener('pointercancel', up); };
    rail.addEventListener('pointermove', move); rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up); });
  return at;
}
const counts = p => `${plural(p.files.length || parsePatch(p.patch).length, 'file')} changed, <b class="a">+${p.add}</b> <b class="d">−${p.del}</b>`;

// a run's patch in its box: each file, a note when the patch was cut, and each file's rail, redrawn when the file opens;
// returns the function that redraws them all, for the whole patch opening and a resize
function fill(view, p) {
  view.innerHTML = parsePatch(p.patch).map(fileHTML).join('')
    + (p.truncated ? `<p class="ccn">The first ${Math.round(p.patch.length / 1000)} kB of ${Math.round(p.bytes / 1000)} kB</p>` : '');
  const ends = [...view.querySelectorAll('details.ccf')].map(d => { const at = railed(d.querySelector('.ccbox'), d.querySelector('.rail'));
    d.addEventListener('toggle', at); return at; });
  const redraw = () => ends.forEach(at => at()); redraw();
  return redraw;
}

// a case study's patch: <div class="tsol taskpage" data-patch data-model="Muse Wonder 1.0"> holding a hidden link to the
// file. It gets the task page's model line (the model's task-page shade, whether it passes, its final score) and the patch,
// folded as on a task page
function mount(el) {
  const src = el.querySelector('a[hidden]');
  if (!src) return;
  fetch(src.href).then(r => r.ok ? r.json() : null).then(d => {
    if (!d) return;
    const [mid, p] = Object.entries(d.runs)[0];
    el.insertAdjacentHTML('beforeend', `<p class="tsum"><span class="sq" style="background:var(--m-${mid})"></span><b>${esc(el.dataset.model)}</b>`
      + ` · ${p.verdict === 'PASS' ? 'passes' : 'does not pass'}` + (p.score != null ? ` · final score <b>${p.score.toFixed(1)}</b>` : '') + '</p>'
      + `<details class="fold pfold"><summary><h3>The patch</h3><span class="pd">${counts(p)}</span></summary><div class="pmeta"></div><div class="cc"></div></details>`);
    const fold = el.querySelector('.pfold'), redraw = fill(fold.querySelector('.cc'), p);
    fold.addEventListener('toggle', redraw);
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(redraw, 120); });
  }).catch(() => {});
}
document.querySelectorAll('[data-patch]').forEach(mount);

return {parsePatch, fileHTML, railed, counts, fill};
})();
