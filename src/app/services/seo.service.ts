import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { CLINIC_INFO } from '../data/clinic-info';

/**
 * Options for a single page's SEO surface. `path` is the only required
 * field besides `title` and `description` — everything else falls back to
 * sensible clinic-level defaults.
 */
export interface SeoOptions {
  /** Page-specific title. Format applied automatically: "{title} | {brand}". */
  title: string;

  /** Meta description — keep under 160 characters for full Google snippet. */
  description: string;

  /**
   * Path-only URL for this page (no origin), e.g. `/services/dental-implants`.
   * Combined with `environment.siteUrl` to produce absolute canonical + og:url.
   * Leading slash optional, trailing slash will be stripped.
   */
  path: string;

  /**
   * Absolute or root-relative URL of the Open Graph image (1200×630 ideal).
   * Falls back to the clinic default OG image.
   */
  image?: string;

  /** `og:type` — defaults to `'website'`; use `'article'` for blog posts. */
  type?: 'website' | 'article' | 'profile';

  /** Article-only: ISO date string of when the post was first published. */
  publishedTime?: string;

  /** Article-only: ISO date string of last edit. */
  modifiedTime?: string;

  /** Article-only: author name. */
  author?: string;

  /**
   * If true, instructs crawlers NOT to index this page. Use for admin login,
   * 404 fallbacks, or thin pages — never for service/blog pages.
   */
  noindex?: boolean;

  /**
   * If true, the page's title is used verbatim — no "| {brand}" appended.
   * Use on the home page (where the brand is the title itself) to avoid
   * "Dental Clinic" appearing twice in the SERP listing.
   */
  noBrandSuffix?: boolean;

  /**
   * Optional `<meta name="keywords">` content. Google has explicitly
   * ignored this tag since 2009, but Bing, Yandex, DuckDuckGo, and many
   * local-business aggregators still consume it — at zero on-page cost
   * it's worth populating for the long tail of non-Google referrals.
   *
   * Pass an array of phrases; do NOT keyword-stuff. 5-10 specific terms
   * per page is the right ceiling. Mixing exact-match local variants
   * ("best dentist Faisalabad", "best dentist FSD", "best dentist near
   * D Ground") is fine here — that's exactly the tag's purpose.
   *
   * The real local-SEO heavy lifting happens via JSON-LD `knowsAbout` +
   * `areaServed` in StructuredDataService — those are what Google
   * actually reads to match local-pack queries.
   */
  keywords?: string[];
}

/**
 * Centralized SEO surface for the site.
 *
 * **One call per page** — `seo.set({ title, description, path })` — sets
 * `<title>`, meta description, canonical link, full Open Graph + Twitter
 * Card stack, and robots directives. Because Angular's `Meta`/`Title`
 * services work via the injected `DOCUMENT`, this is **SSR-safe by
 * construction** — the tags land in the prerendered HTML response that
 * Googlebot, Facebook crawler, and WhatsApp link-preview bot actually read.
 *
 * Call once per `ngOnInit` (or inside a `Resolve` for data-driven pages).
 * No manual cleanup needed — each call replaces every tag this service
 * manages.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title    = inject(Title);
  private readonly meta     = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /** Title suffix appended to every page. Pulled from clinic info. */
  private readonly brandSuffix = `${CLINIC_INFO.name} Faisalabad`;

  /** Set the full SEO surface for the current page in one call. */
  set(opts: SeoOptions): void {
    const fullTitle  = opts.noBrandSuffix ? opts.title : `${opts.title} | ${this.brandSuffix}`;
    const url        = this.absoluteUrl(opts.path);
    const image      = this.absoluteUrl(opts.image ?? CLINIC_INFO.ogImagePath);
    const type       = opts.type ?? 'website';
    const robots     = opts.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    // --- Primary tags ---
    this.title.setTitle(fullTitle);
    this.upsertName('description', opts.description);
    this.upsertName('robots', robots);

    // Keywords are optional. When omitted on a page we remove any prior
    // tag so a stale value from a previous route doesn't carry over.
    if (opts.keywords?.length) {
      this.upsertName('keywords', opts.keywords.join(', '));
    } else {
      this.meta.removeTag('name="keywords"');
    }

    // --- Geo tags (legacy but still consumed by some local-search crawlers
    //     and Pakistani directory aggregators). Static — clinic location
    //     doesn't change per page.
    this.upsertName('geo.region',    'PK-PB');           // Punjab, Pakistan (ISO 3166-2)
    this.upsertName('geo.placename', 'Faisalabad');
    this.upsertName('geo.position',  '31.3861163;73.1242184');
    this.upsertName('ICBM',          '31.3861163, 73.1242184');

    // --- Contact phone (multiple formats) ---
    // Single canonical phone in the standard `contact:phone_number` meta
    // (the format Facebook + LinkedIn + some crawlers expect), plus a
    // comma-joined "contact:phone_alt" carrying every common variant
    // Pakistani searchers might Google. This makes the page indexable for
    // queries like "03247734135" without changing what's visible in the UI.
    this.upsertName('contact:phone_number', CLINIC_INFO.telephoneDisplay);
    this.upsertName('contact:phone_alt',    CLINIC_INFO.telephoneVariants.join(', '));

    // --- Canonical (single, absolute, https) ---
    this.upsertCanonical(url);

    // --- Open Graph ---
    this.upsertProperty('og:title',       fullTitle);
    this.upsertProperty('og:description', opts.description);
    this.upsertProperty('og:url',         url);
    this.upsertProperty('og:image',       image);
    this.upsertProperty('og:type',        type);
    this.upsertProperty('og:site_name',   CLINIC_INFO.name);
    this.upsertProperty('og:locale',      'en_PK');
    // Also surface for Urdu speakers who share to fb.com — Facebook respects
    // multiple `og:locale:alternate` declarations.
    this.upsertProperty('og:locale:alternate', 'ur_PK');

    // --- Article-specific OG (only set when relevant; otherwise clear) ---
    if (type === 'article') {
      if (opts.publishedTime) this.upsertProperty('article:published_time', opts.publishedTime);
      else                    this.removeProperty('article:published_time');

      if (opts.modifiedTime)  this.upsertProperty('article:modified_time',  opts.modifiedTime);
      else                    this.removeProperty('article:modified_time');

      if (opts.author)        this.upsertProperty('article:author',         opts.author);
      else                    this.removeProperty('article:author');
    } else {
      this.removeProperty('article:published_time');
      this.removeProperty('article:modified_time');
      this.removeProperty('article:author');
    }

    // --- Twitter Card ---
    this.upsertName('twitter:card',        'summary_large_image');
    this.upsertName('twitter:title',       fullTitle);
    this.upsertName('twitter:description', opts.description);
    this.upsertName('twitter:image',       image);
  }

  /** Build an absolute URL from a path or pass through an already-absolute one. */
  private absoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    // Strip trailing slash from path (except root) to keep canonical URLs identical.
    const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    return `${environment.siteUrl}${normalized}`;
  }

  /** Add or replace a `<meta name="...">` tag. */
  private upsertName(name: string, content: string): void {
    const selector = `name="${name}"`;
    if (this.meta.getTag(selector)) this.meta.updateTag({ name, content });
    else                            this.meta.addTag({ name, content });
  }

  /** Add or replace a `<meta property="...">` tag (Open Graph + article:*). */
  private upsertProperty(property: string, content: string): void {
    const selector = `property="${property}"`;
    if (this.meta.getTag(selector)) this.meta.updateTag({ property, content }, selector);
    else                            this.meta.addTag({ property, content });
  }

  /** Remove a `<meta property="...">` tag (used when leaving article context). */
  private removeProperty(property: string): void {
    this.meta.removeTag(`property="${property}"`);
  }

  /**
   * Add or replace `<link rel="canonical">`. Angular's Meta service only
   * handles `<meta>` tags, so we manipulate `<head>` directly via DOCUMENT —
   * SSR-safe because Angular's universal DOM impl supports this.
   */
  private upsertCanonical(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
