import { JSDOM } from 'jsdom';
import { cleanPastedHtml, looksLikeHtml, toArticleHtml } from './content-html';

/**
 * `cleanPastedHtml` needs a DOM. In the browser that's the real document;
 * here jsdom supplies both `document` and the `DOMParser` the function
 * constructs internally.
 */
const dom = new JSDOM('<!doctype html><body></body>');
const doc = dom.window.document;
(globalThis as unknown as { DOMParser: typeof dom.window.DOMParser }).DOMParser =
  dom.window.DOMParser;

describe('toArticleHtml', () => {
  it('wraps legacy plain text into paragraphs on blank lines', () => {
    const out = toArticleHtml('First para.\n\nSecond para.');
    expect(out).toBe('<p>First para.</p><p>Second para.</p>');
  });

  it('passes real markup through untouched', () => {
    const html = '<h2>Cost</h2><p>Varies by case.</p>';
    expect(toArticleHtml(html)).toBe(html);
  });

  it('escapes stray angle brackets in plain text so they cannot inject markup', () => {
    expect(toArticleHtml('5 < 10 & rising')).toBe('<p>5 &lt; 10 &amp; rising</p>');
  });

  it('handles null/empty content', () => {
    expect(toArticleHtml(null)).toBe('');
    expect(toArticleHtml('')).toBe('');
  });

  it('detects block markup', () => {
    expect(looksLikeHtml('<p>x</p>')).toBe(true);
    expect(looksLikeHtml('just words')).toBe(false);
  });
});

describe('cleanPastedHtml — Microsoft Word', () => {
  // Trimmed but structurally faithful sample of what Word puts on the
  // clipboard: mso-* inline styles, MsoNormal classes, <o:p> filler, a
  // <style> block, and <b>/<i> instead of <strong>/<em>.
  const WORD = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office">
    <head><style><!-- p.MsoNormal {mso-style-parent:""; font-size:12.0pt;} --></style></head>
    <body lang=EN-GB>
      <h1 style='mso-outline-level:1'><span style='mso-bidi-font-size:14.0pt'>Dental Implants in Faisalabad</span></h1>
      <p class=MsoNormal style='margin-bottom:0cm'><span lang=EN-US>An implant replaces the
        <b style='mso-bidi-font-weight:normal'>root</b> of a missing tooth.<o:p></o:p></span></p>
      <p class=MsoNormal><o:p>&nbsp;</o:p></p>
      <h2 style='mso-outline-level:2'>What it costs</h2>
      <ul style='margin-top:0cm' type=disc>
        <li class=MsoNormal style='color:#333'><i>Single</i> implant</li>
        <li class=MsoNormal>Full arch</li>
      </ul>
    </body></html>`;

  const out = cleanPastedHtml(WORD, doc);

  it('demotes Word H1 to H2 so the page keeps exactly one H1', () => {
    expect(out).toContain('<h2>Dental Implants in Faisalabad</h2>');
    expect(out).not.toContain('<h1');
  });

  it('keeps the heading structure the SEO analyser looks for', () => {
    expect(out).toContain('<h2>What it costs</h2>');
  });

  it('converts presentational b/i to semantic strong/em', () => {
    expect(out).toContain('<strong>root</strong>');
    expect(out).toContain('<em>Single</em>');
    expect(out).not.toContain('<b>');
    expect(out).not.toContain('<i>');
  });

  it('preserves list structure', () => {
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>');
    expect(out).toContain('Full arch');
  });

  it('strips every Word artefact — mso styles, classes, o:p, style blocks', () => {
    expect(out).not.toMatch(/mso-/i);
    expect(out).not.toMatch(/MsoNormal/i);
    expect(out).not.toMatch(/<o:p/i);
    expect(out).not.toMatch(/style=/i);
    expect(out).not.toMatch(/class=/i);
    expect(out).not.toMatch(/lang=/i);
    expect(out).not.toMatch(/<style/i);
  });

  it('keeps the prose intact while unwrapping the spans around it', () => {
    expect(out).toContain('An implant replaces the');
    expect(out).toContain('of a missing tooth.');
    expect(out).not.toContain('<span');
  });

  it('drops the empty spacer paragraphs Word emits', () => {
    expect(out).not.toMatch(/<p>\s*<\/p>/);
  });
});

describe('cleanPastedHtml — links and scripts', () => {
  it('keeps href/target/rel on links and drops everything else', () => {
    const out = cleanPastedHtml(
      `<p><a href="https://example.com" target="_blank" rel="noopener"
          class="x" style="color:red" onclick="steal()">book</a></p>`,
      doc,
    );
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toMatch(/class=|style=/i);
  });

  it('removes script elements entirely', () => {
    const out = cleanPastedHtml('<p>safe</p><script>alert(1)</script>', doc);
    expect(out).toContain('<p>safe</p>');
    expect(out).not.toMatch(/script|alert/i);
  });

  it('unwraps unknown tags but keeps their text', () => {
    const out = cleanPastedHtml('<p>See <mark><cite>this</cite></mark> case</p>', doc);
    expect(out).toBe('<p>See this case</p>');
  });
});
