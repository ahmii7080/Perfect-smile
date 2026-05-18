import { Injectable } from '@angular/core';

/* ============================================================================
 * SeoAnalysisService — pure-function content analyser, no dependencies.
 *
 * Mirrors the Yoast SEO / Rank Math editor sidebar that ships in WordPress.
 * Every method here is platform-agnostic and side-effect-free, so it runs
 * the same in the browser, during prerender, or in a Node script if we ever
 * want offline blog-post audits.
 *
 * Why a service (not just functions): Angular's DI lets the admin form
 * inject this once; signals downstream can call its methods on every
 * keystroke without rebuilding closures or worrying about `this` binding.
 *
 * Companion: SeoAnalysisTab + SeoMetaTab components consume these results.
 * Companion (later): a plagiarism check feature will plug into the same
 * service via an `external` namespace — kept out of v1 so we ship faster.
 * ========================================================================= */

/** Length cap used in SERP-title length validation (matches Google's pixel
 *  budget at typical glyph widths — see also SeoService.MAX_TITLE_CHARS). */
export const SEO_TITLE_MAX = 60;

/** Meta-description length cap before Google truncates the SERP snippet. */
export const META_DESC_MAX = 160;

/** Minimum article length for serious-content SEO. Below this Google
 *  flags the page as "thin content"; rarely ranks. */
export const MIN_CONTENT_WORDS = 300;

export type IssueLevel = 'pass' | 'warn' | 'fail';

export interface SeoIssue {
  id: string;
  level: IssueLevel;
  title: string;
  hint: string;
}

export interface SeoStats {
  words:      number;
  characters: number;
  paragraphs: number;
  /** Estimated read time in minutes. Floor 1 min so the UI never says "0 min". */
  readMinutes: number;
}

export interface SeoHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text:  string;
}

export interface SeoLinkAudit {
  /** Anchors with same-host or relative href. */
  internal: number;
  /** Anchors with a different absolute host. */
  external: number;
}

export interface SeoKeywordAudit {
  /** The focus keyword as entered. Empty string means none set. */
  keyword:        string;
  /** True if the keyword (case-insensitive) appears in the SEO title. */
  inTitle:        boolean;
  /** True if it appears in the meta description. */
  inDescription:  boolean;
  /** True if it appears anywhere in the visible body content. */
  inBody:         boolean;
  /** True if it appears in the URL slug. */
  inSlug:         boolean;
  /** True if it appears in any H2/H3 subheading. */
  inSubheading:   boolean;
  /** Raw occurrence count in the body. */
  occurrences:    number;
  /** Body density as a percentage. 0.5–2.5% is the natural-prose sweet
   *  spot — over 3% reads as keyword stuffing to Google. */
  densityPercent: number;
}

export interface SeoReadability {
  /** Flesch Reading Ease score (higher = easier). 60–70 ≈ "plain English". */
  flesch:           number;
  /** Average words per sentence. Above ~22 starts to feel academic. */
  averageSentence:  number;
  /** Average syllables per word. Above ~1.6 leans technical. */
  averageSyllables: number;
}

/** One-stop bundle of every analysis for a draft. The admin sidebar
 *  re-derives this on every change in the form. */
export interface SeoReport {
  stats:       SeoStats;
  headings:    SeoHeading[];
  links:       SeoLinkAudit;
  keyword:     SeoKeywordAudit;
  readability: SeoReadability;
  issues:      SeoIssue[];
  /** 0–100 score aggregated from the issues list. Same colour bands as
   *  Yoast: <50 red ("poor"), 50–80 orange ("ok"), 80+ green ("good"). */
  score:       number;
}

/* -------------------------------------------------------------------------
 *  Tiny text helpers. Kept pure and not exported — internal building blocks.
 *  ----------------------------------------------------------------------- */

/** Strip HTML to plain text. We accept rich HTML from the editor and
 *  need plain words for counting / density. Decoding entities is good
 *  enough for the small set the editor produces (`&amp;`, `&nbsp;`). */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsOf(text: string): string[] {
  if (!text) return [];
  return text.split(/\s+/).filter(w => w.length > 0);
}

/** Rough syllable counter — vowel-group heuristic. Good enough for
 *  Flesch scoring; not perfect for edge cases ("queue", "people") but
 *  the rank-order of "easy vs hard prose" stays meaningful. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  // Strip trailing silent 'e' and 'es'/'ed' endings.
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, '');
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

function countSentences(text: string): number {
  if (!text) return 0;
  return text.split(/[.!?]+\s/).filter(s => s.trim().length > 0).length || 1;
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* -------------------------------------------------------------------------
 *  The service
 *  ----------------------------------------------------------------------- */

@Injectable({ providedIn: 'root' })
export class SeoAnalysisService {

  /** Word / character / paragraph counts + read-time estimate. */
  stats(htmlContent: string): SeoStats {
    const plain = stripHtml(htmlContent);
    const words = wordsOf(plain);
    // Paragraph count comes from the raw HTML (the editor wraps every
    // block in <p>) — more accurate than splitting on newlines.
    const paragraphMatches = (htmlContent || '').match(/<p\b/gi);
    return {
      words:       words.length,
      characters:  plain.length,
      paragraphs:  paragraphMatches?.length ?? 0,
      // ~200 wpm is the cited average reading speed for desktop content;
      // mobile readers are slightly slower but rounding compensates.
      readMinutes: Math.max(1, Math.round(words.length / 200))
    };
  }

  /** Extract all `<h1>` … `<h6>` elements as `{level, text}`. */
  headings(htmlContent: string): SeoHeading[] {
    if (!htmlContent) return [];
    const out: SeoHeading[] = [];
    const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(htmlContent)) !== null) {
      out.push({
        level: Number(m[1]) as SeoHeading['level'],
        text:  stripHtml(m[2])
      });
    }
    return out;
  }

  /** Count internal vs external anchor tags. `siteHost` is the canonical
   *  origin (e.g. "www.theperfectsmileclinic.com") — used to decide
   *  whether an absolute URL counts as internal. */
  links(htmlContent: string, siteHost = 'theperfectsmileclinic.com'): SeoLinkAudit {
    if (!htmlContent) return { internal: 0, external: 0 };
    const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    let internal = 0;
    let external = 0;
    while ((m = re.exec(htmlContent)) !== null) {
      const href = m[1].trim();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      if (/^https?:\/\//i.test(href)) {
        external += href.toLowerCase().includes(siteHost.toLowerCase()) ? 0 : 1;
        if (href.toLowerCase().includes(siteHost.toLowerCase())) internal++;
      } else {
        internal++;                     // root-relative or relative path
      }
    }
    return { internal, external };
  }

  /** Inspect every place the focus keyword should appear. Used by the
   *  Yoast-style "keyword analysis" sidebar tab. */
  keyword(
    keyword:     string,
    seoTitle:    string,
    description: string,
    htmlContent: string,
    slug:        string
  ): SeoKeywordAudit {
    const kw   = (keyword || '').trim();
    const body = stripHtml(htmlContent);
    const headingTexts = this.headings(htmlContent)
      .filter(h => h.level === 2 || h.level === 3)
      .map(h => h.text)
      .join(' ');

    if (!kw) {
      // Empty keyword — return a benign all-false bundle.
      return {
        keyword: '', inTitle: false, inDescription: false, inBody: false,
        inSlug: false, inSubheading: false, occurrences: 0, densityPercent: 0
      };
    }

    const re = new RegExp(escapeForRegex(kw), 'gi');
    const occurrences = (body.match(re)?.length) ?? 0;
    const words       = wordsOf(body).length;
    const density     = words > 0 ? (occurrences / words) * 100 : 0;

    return {
      keyword:        kw,
      inTitle:        re.test(seoTitle),
      inDescription:  re.test(description),
      inBody:         occurrences > 0,
      inSlug:         (slug || '').toLowerCase().includes(kw.toLowerCase().replace(/\s+/g, '-')),
      inSubheading:   re.test(headingTexts),
      occurrences,
      densityPercent: +density.toFixed(2)
    };
  }

  /** Flesch Reading Ease + sentence/syllable averages. */
  readability(htmlContent: string): SeoReadability {
    const plain = stripHtml(htmlContent);
    const words = wordsOf(plain);
    const wordCount = words.length;
    if (wordCount === 0) {
      return { flesch: 0, averageSentence: 0, averageSyllables: 0 };
    }
    const sentenceCount  = countSentences(plain);
    const syllableCount  = words.reduce((sum, w) => sum + syllables(w), 0);
    const averageSentence  = wordCount / sentenceCount;
    const averageSyllables = syllableCount / wordCount;
    // Flesch Reading Ease formula (US):
    //   206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words)
    const flesch = 206.835 - 1.015 * averageSentence - 84.6 * averageSyllables;
    return {
      flesch:           +flesch.toFixed(1),
      averageSentence:  +averageSentence.toFixed(1),
      averageSyllables: +averageSyllables.toFixed(2)
    };
  }

  /** Run every check and roll up into a single report. */
  analyse(input: {
    seoTitle:        string;
    metaDescription: string;
    htmlContent:     string;
    slug:            string;
    focusKeyword:    string;
    imageAlt?:       string;
    featuredImage?:  string;
  }): SeoReport {
    const stats       = this.stats(input.htmlContent);
    const headings    = this.headings(input.htmlContent);
    const links       = this.links(input.htmlContent);
    const keyword     = this.keyword(
      input.focusKeyword,
      input.seoTitle,
      input.metaDescription,
      input.htmlContent,
      input.slug
    );
    const readability = this.readability(input.htmlContent);
    const issues      = this.buildIssues({ stats, headings, links, keyword, readability, ...input });
    const score       = this.scoreFromIssues(issues);
    return { stats, headings, links, keyword, readability, issues, score };
  }

  /* -----------------------------------------------------------------------
   *  Issue rules — the heart of the analyzer. Each rule returns one
   *  SeoIssue; severity is `pass` (green check), `warn` (orange) or
   *  `fail` (red). Keep the messages short and actionable — they appear
   *  verbatim in the editor sidebar.
   *  --------------------------------------------------------------------- */

  private buildIssues(ctx: {
    seoTitle:        string;
    metaDescription: string;
    focusKeyword:    string;
    imageAlt?:       string;
    featuredImage?:  string;
    stats:           SeoStats;
    headings:        SeoHeading[];
    links:           SeoLinkAudit;
    keyword:         SeoKeywordAudit;
    readability:     SeoReadability;
  }): SeoIssue[] {
    const out: SeoIssue[] = [];
    const t = (ctx.seoTitle || '').trim();
    const d = (ctx.metaDescription || '').trim();
    const w = ctx.stats.words;

    /* --- SEO title length --- */
    if (!t) {
      out.push({ id: 'title-empty', level: 'fail', title: 'SEO title length', hint: 'Add a title' });
    } else if (t.length > SEO_TITLE_MAX) {
      out.push({ id: 'title-long',  level: 'warn', title: 'SEO title length', hint: `Too long — trim to ${SEO_TITLE_MAX} chars (currently ${t.length})` });
    } else if (t.length < 25) {
      out.push({ id: 'title-short', level: 'warn', title: 'SEO title length', hint: `Quite short (${t.length} chars). Aim for 40-60` });
    } else {
      out.push({ id: 'title-ok',    level: 'pass', title: 'SEO title length', hint: `${t.length} characters — good` });
    }

    /* --- Meta description length --- */
    if (!d) {
      out.push({ id: 'desc-empty', level: 'fail', title: 'Meta description length', hint: 'Add a meta description' });
    } else if (d.length > META_DESC_MAX) {
      out.push({ id: 'desc-long',  level: 'warn', title: 'Meta description length', hint: `Too long — trim to ${META_DESC_MAX} chars` });
    } else if (d.length < 70) {
      out.push({ id: 'desc-short', level: 'warn', title: 'Meta description length', hint: `Quite short (${d.length} chars). Aim for 120-155` });
    } else {
      out.push({ id: 'desc-ok',    level: 'pass', title: 'Meta description length', hint: `${d.length} characters — good` });
    }

    /* --- Content length --- */
    if (w === 0) {
      out.push({ id: 'content-empty', level: 'fail', title: 'Content length', hint: '0 words — too short for SEO' });
    } else if (w < MIN_CONTENT_WORDS) {
      out.push({ id: 'content-thin', level: 'warn', title: 'Content length', hint: `${w} words — below ${MIN_CONTENT_WORDS}. Longer posts rank better` });
    } else {
      out.push({ id: 'content-ok', level: 'pass', title: 'Content length', hint: `${w} words — strong` });
    }

    /* --- Heading structure --- */
    const h2s = ctx.headings.filter(h => h.level === 2).length;
    if (h2s === 0) {
      out.push({ id: 'h2-missing', level: 'fail', title: 'Heading structure', hint: 'Add H2 subheadings to structure your content' });
    } else {
      out.push({ id: 'h2-ok', level: 'pass', title: 'Heading structure', hint: `${h2s} H2 subheading${h2s > 1 ? 's' : ''}` });
    }

    /* --- Internal links --- */
    if (ctx.links.internal === 0) {
      out.push({ id: 'links-internal-missing', level: 'warn', title: 'Internal links', hint: 'Add internal links to related content' });
    } else {
      out.push({ id: 'links-internal-ok', level: 'pass', title: 'Internal links', hint: `${ctx.links.internal} internal link${ctx.links.internal > 1 ? 's' : ''}` });
    }

    /* --- External links --- */
    if (ctx.links.external === 0) {
      out.push({ id: 'links-external-missing', level: 'warn', title: 'External links', hint: 'Consider linking to authoritative external sources' });
    } else {
      out.push({ id: 'links-external-ok', level: 'pass', title: 'External links', hint: `${ctx.links.external} external link${ctx.links.external > 1 ? 's' : ''}` });
    }

    /* --- Focus keyword (only run if user set one) --- */
    if (ctx.focusKeyword.trim()) {
      const k = ctx.keyword;
      if (!k.inTitle)        out.push({ id: 'kw-not-in-title', level: 'warn', title: 'Keyword in title',        hint: 'Add the focus keyword to the SEO title' });
      if (!k.inDescription)  out.push({ id: 'kw-not-in-desc',  level: 'warn', title: 'Keyword in description',  hint: 'Mention the keyword in the meta description' });
      if (!k.inSlug)         out.push({ id: 'kw-not-in-slug',  level: 'warn', title: 'Keyword in URL slug',     hint: 'Use the keyword in the post URL slug' });
      if (!k.inSubheading)   out.push({ id: 'kw-not-in-h2',    level: 'warn', title: 'Keyword in subheading',   hint: 'Use the keyword in at least one H2/H3' });
      if (!k.inBody)         out.push({ id: 'kw-not-in-body',  level: 'fail', title: 'Keyword in body',         hint: 'The focus keyword does not appear in the post body' });
      if (k.densityPercent > 3) {
        out.push({ id: 'kw-stuffing', level: 'warn', title: 'Keyword density',
          hint: `${k.densityPercent}% — looks like stuffing. Aim for 0.5%-2.5%` });
      } else if (k.densityPercent >= 0.5 && k.densityPercent <= 2.5) {
        out.push({ id: 'kw-density-ok', level: 'pass', title: 'Keyword density',
          hint: `${k.densityPercent}% — natural` });
      }
    }

    /* --- Featured image alt --- */
    if (ctx.featuredImage && !ctx.imageAlt?.trim()) {
      out.push({ id: 'img-alt-missing', level: 'warn', title: 'Featured image alt text',
        hint: 'Add descriptive alt text for SEO + accessibility' });
    }

    /* --- Readability --- */
    if (w >= 100) {  // only meaningful with some content
      if (ctx.readability.flesch < 50) {
        out.push({ id: 'read-hard', level: 'warn', title: 'Readability',
          hint: `Flesch ${ctx.readability.flesch} — fairly hard. Try shorter sentences` });
      } else if (ctx.readability.flesch >= 60) {
        out.push({ id: 'read-ok', level: 'pass', title: 'Readability',
          hint: `Flesch ${ctx.readability.flesch} — easy to read` });
      }
    }

    return out;
  }

  /** Roll up issues to a 0-100 score. Failures hurt more than warnings;
   *  passes recover. Floored at 0 so we never display "−5%". */
  private scoreFromIssues(issues: SeoIssue[]): number {
    if (!issues.length) return 0;
    let score = 100;
    for (const it of issues) {
      if (it.level === 'fail') score -= 12;
      else if (it.level === 'warn') score -= 5;
      // passes leave score untouched (the base is 100)
    }
    return Math.max(0, Math.min(100, score));
  }
}
