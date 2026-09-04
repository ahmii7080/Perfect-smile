/**
 * Article-body HTML helpers, shared by the admin editor and the public
 * article page.
 *
 * Kept free of Angular and of any direct `document` reference so the same
 * code runs in three places: the browser (paste handling), the Node
 * prerender pass (`/blog/:slug` is prerendered), and vitest.
 */

/** Tags allowed to survive a paste or a hand-edit in the HTML source box.
 *
 *  Deliberately small — these are the only tags `blog-detail.scss` styles,
 *  and the only ones `SeoAnalysisService` looks for. Anything else is
 *  unwrapped (its text is kept) rather than dropped, so pasting from Word
 *  never silently loses a sentence.
 *
 *  H1 is absent on purpose: the article template already renders the post
 *  title as the page's single <h1>. Word documents almost always open with
 *  a Heading 1, so it is demoted to H2 rather than shipping a second H1 —
 *  two H1s on one page is a real SEO defect. */
export const ALLOWED_TAGS = new Set([
  'P', 'BR', 'H2', 'H3', 'H4', 'STRONG', 'EM', 'U',
  'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'HR',
]);

/** Per-tag attribute allowlist. Everything else — style, class, lang, id,
 *  and Word's mso-* soup — is stripped. */
export const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
};

/** Legacy/presentational tags mapped onto their semantic equivalent. */
export const RENAME_TAGS: Record<string, string> = {
  B: 'STRONG', I: 'EM', H1: 'H2', H5: 'H4', H6: 'H4', DIV: 'P',
};

/** True when the string already carries block-level markup — i.e. it was
 *  written in the rich-text editor rather than the old plain textarea. */
export function looksLikeHtml(v: string): boolean {
  return /<(p|h[1-6]|ul|ol|blockquote|div|br)\b/i.test(v);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Wrap plain text into paragraphs on blank lines.
 *
 * Every post written before the rich-text editor existed is stored as plain
 * text. Without this they render as one undifferentiated wall — the public
 * page used to make that worse by wrapping the whole article in a single
 * <p>.
 */
export function htmlFromPlainText(v: string): string {
  return v
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => `<p>${escapeHtml(block)}</p>`)
    .join('');
}

/** Render any stored `content` value as HTML: pass real markup through,
 *  upgrade legacy plain text to paragraphs. */
export function toArticleHtml(raw: string | null | undefined): string {
  const v = raw ?? '';
  return looksLikeHtml(v) ? v : htmlFromPlainText(v);
}

/**
 * Depth-first scrub: rename legacy tags, strip attributes, unwrap anything
 * outside the allowlist.
 *
 * `doc` is passed in rather than reaching for a global so this works under
 * jsdom and in the browser alike.
 */
function scrub(node: Element, doc: Document): void {
  for (const child of Array.from(node.children)) {
    scrub(child, doc);

    let el = child;
    const renamed = RENAME_TAGS[el.tagName];

    if (renamed) {
      const replacement = doc.createElement(renamed);
      while (el.firstChild) replacement.appendChild(el.firstChild);
      el.replaceWith(replacement);
      el = replacement;
    }

    if (!ALLOWED_TAGS.has(el.tagName)) {
      // Unwrap: keep the text, drop the tag. This is what rescues content
      // pasted as endless <span style="mso-..."> wrappers.
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }

    const keep = ALLOWED_ATTRS[el.tagName];
    for (const attr of Array.from(el.attributes)) {
      if (!keep?.has(attr.name.toLowerCase())) el.removeAttribute(attr.name);
    }
  }
}

/**
 * Reduce arbitrary pasted HTML to the allowlist above.
 *
 * Word and Google Docs put a whole HTML document on the clipboard — <o:p>
 * tags, class="MsoNormal", and inline mso-* styles that bloat the stored
 * article and defeat the SEO analyser's heading parser.
 */
export function cleanPastedHtml(raw: string, doc: Document): string {
  const parsed = new DOMParser().parseFromString(raw, 'text/html');

  parsed.body.querySelectorAll('style, script, meta, link, title').forEach(n => n.remove());
  scrub(parsed.body, doc);

  // Word leaves a trail of empty paragraphs between real blocks.
  parsed.body.querySelectorAll('p, h2, h3, h4, li').forEach(n => {
    if (!n.textContent?.trim() && !n.querySelector('br')) n.remove();
  });

  return parsed.body.innerHTML.trim();
}
