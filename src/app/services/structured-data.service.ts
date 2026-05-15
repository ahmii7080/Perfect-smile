import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';
import { CLINIC_INFO } from '../data/clinic-info';
import { BreadcrumbItem } from '../components/breadcrumb/breadcrumb.component';

/** Schema.org root context. */
const SCHEMA_CTX = 'https://schema.org';

/** Attribute used to track our injected scripts so we can replace/remove them. */
const TAG_ATTR = 'data-seo-schema';

/** A single FAQ Q&A pair. */
export interface FaqEntry {
  question: string;
  answer:   string;
}

/** Optional input for the per-service MedicalProcedure schema. */
export interface ProcedureOptions {
  /** Service name as the patient sees it (e.g. "Dental Implants"). */
  name: string;
  /** Slug, used to build the canonical URL. */
  slug: string;
  /** 1-2 sentence summary — same as page meta description is fine. */
  description: string;
  /** Outcome the patient gets — keep clinical, e.g. "Restores chewing function and aesthetics." */
  expectedBenefit?: string;
  /** Step-by-step procedure (numbered ordered list on the page). */
  steps?: string[];
  /** Optional total cost range as a free-form string (e.g. "PKR 80,000 – 250,000"). */
  estimatedCost?: string;

  /**
   * Alternate names by which patients search for this procedure —
   * regional spellings, FSD/Faisalabad variants, layperson terms.
   * Surfaced as Schema.org `alternateName`, which Google uses to
   * widen entity-matching for queries like "zirconia crown FSD" or
   * "zirconia tooth cap Faisalabad". Keep to 4-8 actual user-typed
   * phrases — this is NOT a place to keyword-stuff.
   */
  alternateNames?: string[];
}

/** Optional input for an Article schema on blog posts. */
export interface ArticleOptions {
  headline:     string;
  slug:         string;
  description:  string;
  image?:       string;
  datePublished: string;   // ISO 8601
  dateModified?: string;
  authorName?:  string;
}

/**
 * Injects JSON-LD `<script type="application/ld+json">` blocks into
 * `<head>` so Google can parse structured data from the prerendered HTML.
 *
 * **SSR-safe by design**: writes via the injected `DOCUMENT` token, which
 * Angular wires to a universal DOM during prerender. The scripts end up in
 * the static HTML files in `dist/perfect-smile/browser/`, exactly where
 * Googlebot reads them — not added at hydration time (which Google may or
 * may not see depending on render budget).
 *
 * Each call to a `set...` method **replaces** any prior schema with the
 * same `id`. Call `clearPageSchemas()` when navigating between routes
 * to remove page-specific entries (root-level Organization/WebSite stay
 * mounted for the session).
 */
@Injectable({ providedIn: 'root' })
export class StructuredDataService {
  private readonly document = inject(DOCUMENT);

  // ============================================================
  //  Site-wide schemas — call once from app.ts on bootstrap
  // ============================================================

  /**
   * `Dentist` (subclass of LocalBusiness + MedicalBusiness). Carries the
   * clinic NAP, geo, hours, social `sameAs`. Earns the local-pack listing
   * + Knowledge Panel.
   */
  setDentist(): void {
    const schema = {
      '@context': SCHEMA_CTX,
      '@type': 'Dentist',
      '@id': `${environment.siteUrl}/#dentist`,
      name: CLINIC_INFO.name,
      description: CLINIC_INFO.description,
      url: environment.siteUrl,
      telephone: CLINIC_INFO.telephone,
      email: `mailto:${CLINIC_INFO.email}`,
      priceRange: CLINIC_INFO.priceRange,
      image: this.absolute(CLINIC_INFO.ogImagePath),
      logo:  this.absolute(CLINIC_INFO.logoPath),
      address: {
        '@type': 'PostalAddress',
        ...CLINIC_INFO.address
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude:  CLINIC_INFO.geo.latitude,
        longitude: CLINIC_INFO.geo.longitude
      },
      openingHoursSpecification: CLINIC_INFO.openingHours.map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dayOfWeek,
        opens:     h.opens,
        closes:    h.closes
      })),
      medicalSpecialty: CLINIC_INFO.medicalSpecialty,
      sameAs: CLINIC_INFO.sameAs,
      // ContactPoint array carries every common written form of the clinic
      // phone number — international (`+92 324...`), E.164 (`+923247734135`),
      // local Pakistani (`03247734135`, `0324 7734135`, `0324-7734135`).
      // Pakistani patients type any of these into Google; including all
      // variants here makes the entity match all search queries against
      // the same business listing. Same phone, different surfaces — not
      // separate contact channels.
      contactPoint: CLINIC_INFO.telephoneVariants.map(num => ({
        '@type':       'ContactPoint',
        telephone:     num,
        contactType:   'customer service',
        availableLanguage: ['en', 'ur', 'pa'],
        areaServed:    'PK'
      })),
      // Real reviews from GBP — `aggregateRating` is what unlocks the
      // gold star row beneath your SERP listing. Update the count in
      // clinic-info.ts as the GBP review count grows.
      aggregateRating: {
        '@type':     'AggregateRating',
        ratingValue: CLINIC_INFO.reviews.ratingValue,
        reviewCount: CLINIC_INFO.reviews.reviewCount,
        bestRating:  5,
        worstRating: 1
      },
      areaServed: [
        { '@type': 'City',               name: 'Faisalabad' },
        // Neighborhood-level entries surface for "dentist near {area}"
        // queries. D Ground and Satyana Road are the clinic's two
        // closest commercial landmarks; Jaranwala Road covers the
        // east-side patient base.
        { '@type': 'Place',              name: 'D Ground, Faisalabad' },
        { '@type': 'Place',              name: 'Satyana Road, Faisalabad' },
        { '@type': 'Place',              name: 'Jaranwala Road, Faisalabad' },
        { '@type': 'City',               name: 'Jhang' },
        { '@type': 'City',               name: 'Sargodha' },
        { '@type': 'City',               name: 'Toba Tek Singh' },
        { '@type': 'AdministrativeArea', name: 'Punjab' }
      ],
      // `knowsAbout` lets Google associate the clinic with specific
      // treatments. When a user searches "zirconia crown Faisalabad" or
      // "root canal in FSD", Google's local-entity matcher checks this
      // list to decide whether to surface the clinic in the local pack.
      // Keep terms specific (treatment name + location variant) without
      // descending into stuffing — 12-18 terms is the sweet spot.
      knowsAbout: [
        'Dental implants',
        'Zirconia crowns',
        'Porcelain veneers',
        'Crown and bridge',
        'Root canal treatment',
        'Endodontics',
        'Orthodontics',
        'Invisalign',
        'Clear aligners',
        'Teeth whitening',
        'Pediatric dentistry',
        'Cosmetic dentistry',
        'Smile makeover',
        'Dental scaling',
        'Tooth extraction',
        'Emergency dental care'
      ],
      // Slogan surfaces in the Knowledge Panel when present. Keeping it
      // location-anchored ("Faisalabad") helps local matching without
      // appearing in the page body where it would feel marketing-heavy.
      slogan: "Faisalabad's multi-specialist dental & implant clinic"
    };
    this.inject('dentist', schema);
  }

  /**
   * `WebSite` with `SearchAction` — enables the Google sitelinks searchbox
   * (the inline search bar that sometimes appears under brand-search results).
   */
  setWebSite(): void {
    const schema = {
      '@context': SCHEMA_CTX,
      '@type': 'WebSite',
      '@id': `${environment.siteUrl}/#website`,
      url: environment.siteUrl,
      name: CLINIC_INFO.name,
      inLanguage: ['en-PK', 'ur-PK'],
      publisher: { '@id': `${environment.siteUrl}/#dentist` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${environment.siteUrl}/blog?q={search_term_string}`
        },
        // Required string literal per Schema.org spec
        'query-input': 'required name=search_term_string'
      }
    };
    this.inject('website', schema);
  }

  // ============================================================
  //  Per-page schemas — call from each page's ngOnInit
  // ============================================================

  /**
   * `BreadcrumbList` — inner pages should call this. Accepts the same
   * `BreadcrumbItem[]` array that the visible `<app-breadcrumb>` component
   * consumes, so the DOM crumb and the JSON-LD crumb never drift.
   */
  setBreadcrumb(steps: readonly BreadcrumbItem[]): void {
    const schema = {
      '@context': SCHEMA_CTX,
      '@type': 'BreadcrumbList',
      itemListElement: steps.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.label,            // schema.org wants `name`; UI calls it `label`
        item: this.absolute(s.path)
      }))
    };
    this.inject('breadcrumb', schema);
  }

  /** `MedicalProcedure` — call from each service-detail page. */
  setMedicalProcedure(opts: ProcedureOptions): void {
    const url = this.absolute(`/services/${opts.slug}`);
    const schema: Record<string, unknown> = {
      '@context': SCHEMA_CTX,
      '@type': 'MedicalProcedure',
      name: opts.name,
      description: opts.description,
      url,
      procedureType: 'https://schema.org/TherapeuticProcedure',
      relevantSpecialty: 'Dentistry',
      provider: { '@id': `${environment.siteUrl}/#dentist` }
    };
    if (opts.alternateNames?.length) schema['alternateName'] = opts.alternateNames;
    if (opts.expectedBenefit) schema['benefitsHealth'] = opts.expectedBenefit;
    if (opts.steps?.length) {
      schema['howPerformed'] = opts.steps.join(' ');
      schema['step'] = opts.steps.map((text, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        text
      }));
    }
    if (opts.estimatedCost) {
      schema['estimatedCost'] = {
        '@type': 'MonetaryAmount',
        currency: 'PKR',
        value: opts.estimatedCost
      };
    }
    this.inject('procedure', schema);
  }

  /** `FAQPage` — call this for any page with a 3+ Q&A section. */
  setFaqPage(faqs: FaqEntry[]): void {
    if (!faqs.length) {
      this.remove('faq');
      return;
    }
    const schema = {
      '@context': SCHEMA_CTX,
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    };
    this.inject('faq', schema);
  }

  /** `Article` — call from blog-detail pages. */
  setArticle(opts: ArticleOptions): void {
    const url = this.absolute(`/blog/${opts.slug}`);
    const schema: Record<string, unknown> = {
      '@context': SCHEMA_CTX,
      '@type': 'Article',
      headline: opts.headline,
      description: opts.description,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      datePublished: opts.datePublished,
      dateModified: opts.dateModified ?? opts.datePublished,
      publisher: { '@id': `${environment.siteUrl}/#dentist` }
    };
    if (opts.image)      schema['image']  = this.absolute(opts.image);
    if (opts.authorName) schema['author'] = { '@type': 'Person', name: opts.authorName };
    this.inject('article', schema);
  }

  // ============================================================
  //  Maintenance
  // ============================================================

  /**
   * Clear all per-page schemas (breadcrumb, procedure, faq, article) on
   * route change. Keeps site-wide entries (dentist, website) mounted.
   */
  clearPageSchemas(): void {
    for (const id of ['breadcrumb', 'procedure', 'faq', 'article']) this.remove(id);
  }

  // ============================================================
  //  Private — DOM plumbing
  // ============================================================

  private absolute(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${environment.siteUrl}${path}`;
  }

  /** Insert (or replace) a `<script type="application/ld+json">` tag in `<head>`. */
  private inject(id: string, schema: unknown): void {
    this.remove(id);
    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute(TAG_ATTR, id);
    // textContent + JSON.stringify is XSS-safe (no markup interpolation).
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  private remove(id: string): void {
    const existing = this.document.head.querySelector(`script[${TAG_ATTR}="${id}"]`);
    if (existing) existing.remove();
  }
}
