$(document).ready(function() {
    // Safety net: ensure d-byline gets populated even if the distill
    // Controller's DOMContentLoaded callback never fires (observed when the
    // page is loaded inside a sandboxed iframe where readyState transitions
    // happen before the listener attaches).
    (function ensureBylinePopulated() {
        var byline = document.querySelector('d-byline');
        var fmEl = document.querySelector('d-front-matter');
        if (!byline || !fmEl) return;
        if (byline.innerHTML && byline.innerHTML.length > 0) return;
        var script = fmEl.querySelector('script');
        if (!script) return;
        try {
            var data = JSON.parse(script.textContent);
            byline.frontMatter = data;
            var appendix = document.querySelector('distill-appendix');
            if (appendix && (!appendix.innerHTML || appendix.innerHTML.length === 0)) {
                appendix.frontMatter = data;
            }
        } catch (e) { /* silent fallback */ }
    })();

    // Use custom date display (e.g. "周二, Feb 3, 2026") when set on body
    var dateDisplay = document.body.getAttribute('data-date-display');
    if (dateDisplay) {
        var byline = document.querySelector('d-byline');
        if (byline && byline.shadowRoot) {
            var paragraphs = byline.shadowRoot.querySelectorAll('.byline p');
            if (paragraphs.length) paragraphs[paragraphs.length - 1].textContent = dateDisplay;
        }
    }
    // Override styles of the footnotes.
    document.querySelectorAll("d-footnote").forEach(function(footnote) {
        footnote.shadowRoot.querySelector("sup > span")
            .setAttribute("style", "color: var(--global-theme-color);");
        footnote.shadowRoot.querySelector("d-hover-box").shadowRoot.querySelector("style").sheet
            .insertRule(".panel {background-color: var(--global-bg-color) !important;}");
        footnote.shadowRoot.querySelector("d-hover-box").shadowRoot.querySelector("style").sheet
            .insertRule(".panel {border-color: var(--global-divider-color) !important;}");
    });
    // Override styles of the citations.
    document.querySelectorAll("d-cite").forEach(function(cite) {
        cite.shadowRoot.querySelector("div > span")
            .setAttribute("style", "color: var(--global-theme-color);");
        cite.shadowRoot.querySelector("style").sheet
            .insertRule("ul li a {color: var(--global-text-color) !important; text-decoration: none;}");
        cite.shadowRoot.querySelector("style").sheet
            .insertRule("ul li a:hover {color: var(--global-theme-color) !important;}");
        cite.shadowRoot.querySelector("d-hover-box").shadowRoot.querySelector("style").sheet
            .insertRule(".panel {background-color: var(--global-bg-color) !important;}");
        cite.shadowRoot.querySelector("d-hover-box").shadowRoot.querySelector("style").sheet
            .insertRule(".panel {border-color: var(--global-divider-color) !important;}");
    });
})