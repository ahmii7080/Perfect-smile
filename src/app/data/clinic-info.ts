/**
 * Single source of truth for the clinic's identity — NAP (Name, Address,
 * Phone), social profiles, opening hours, geo. Consumed by:
 *
 *   - `StructuredDataService` (JSON-LD)
 *   - `SeoService` (default fallback meta values)
 *   - Footer / Navbar / Contact templates (when refactored)
 *   - `sitemap.xml` generator
 *
 * **Update this file in ONE place** to keep NAP consistency across the
 * site, Google Business Profile, and all directory listings. Inconsistent
 * NAP across the web is the #1 local-SEO killer.
 */

/** ISO 8601 weekday strings (Schema.org `dayOfWeek` expects these). */
export type Weekday =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'
  | 'Friday' | 'Saturday' | 'Sunday';

export interface OpeningHours {
  dayOfWeek: Weekday[];
  opens: string;   // "17:00" (24h, local time)
  closes: string;  // "22:00"
}

export const CLINIC_INFO = {
  /** Legal/brand name — must match Google Business Profile exactly. */
  name: 'The Perfect Smile Dental Clinic',

  /** Short tagline used in og:site_name and footer. */
  shortName: 'The Perfect Smile',

  /** Plain-English description, used as default meta description fallback. */
  description:
    'Premium dental & implant clinic in Faisalabad offering multi-disciplinary specialist care — implants, orthodontics, crown & bridge, cosmetic dentistry, scaling, whitening and extractions.',

  /** International + local phone formats. */
  telephone:  '+923247734135',
  telephoneDisplay: '+92 324 7734135',

  /** Business email (one canonical address — keep aligned with mailto: links). */
  email: 'faizanwaris765@gmail.com',

  /**
   * Postal address — kept identical to the Google Business Profile entry
   * for NAP consistency (the #1 local-pack ranking factor).
   *
   * NOTE: GBP currently writes "Stayana" — likely a typo for "Satyana"
   * (the official Faisalabad road name). Keeping "Stayana" here so the
   * schema matches GBP word-for-word; once you fix the typo on GBP, also
   * update this file in the same edit.
   */
  address: {
    streetAddress: 'Adjacent Rehman Garden Gate No. 1, Fish Farm, Stayana Road',
    addressLocality: 'Faisalabad',
    addressRegion: 'Punjab',
    postalCode: '38000',
    addressCountry: 'PK'
  },

  /**
   * Geo coordinates of the clinic — extracted from the Google Maps embed
   * on the contact page. Used by `Dentist` schema for local-pack ranking.
   */
  geo: {
    latitude: 31.3861163,
    longitude: 73.1242184
  },

  /** Mon–Sat 5pm–10pm, Sunday closed (per footer). */
  openingHours: [
    {
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as Weekday[],
      opens: '17:00',
      closes: '22:00'
    }
  ] satisfies OpeningHours[],

  /** Schema.org `priceRange` — rough indicator only, $ to $$$$. */
  priceRange: '$$',

  /**
   * Aggregate review snapshot pulled from Google Business Profile.
   * Update the count as reviews grow — Google's algorithm checks that this
   * roughly matches what your live GBP shows, so don't inflate. Fake
   * `aggregateRating` triggers a manual penalty.
   */
  reviews: {
    ratingValue: 5.0,
    reviewCount: 9
  },

  /**
   * Social / off-site profile URLs — used as `sameAs` in JSON-LD so Google
   * can link them to your Knowledge Panel.
   */
  sameAs: [
    'https://www.facebook.com/share/1E8Z7uagMK/',
    'https://www.instagram.com/perfect_smile_dental_.clinic',
    'https://wa.me/923247734135'
  ],

  /** Logo + default OG image — relative to siteUrl. */
  logoPath:    '/assets/images/logo.png',
  ogImagePath: '/assets/images/og-default.jpg',

  /**
   * Medical specialties this clinic offers — used in `Dentist` schema.
   * Order matters: most specialized → most general.
   */
  medicalSpecialty: [
    'Dentistry',
    'CosmeticDentistry',
    'Orthodontics',
    'OralAndMaxillofacialSurgery'
  ]
} as const;

/** Bare hostname (no scheme) — useful for some directory listings. */
export const CLINIC_DOMAIN = 'theperfectsmileclinic.com';

/**
 * Faisalabad neighborhoods/areas the clinic serves. Surfaced in:
 *   - JSON-LD `Dentist.areaServed` (Google local-pack signal)
 *   - A natural "Areas we serve" line on home/about (visible text Googlebot
 *     reads; lets the page rank for "dentist near {neighborhood}" queries)
 *
 * Keep these to actual catchment areas, not aspirational ones — Google
 * cross-references with patient-reviews + GBP service-area config.
 */
export const AREAS_SERVED = [
  'D Ground',
  'Satellite Town',
  'Madina Town',
  'Peoples Colony',
  'Susan Road',
  'Jaranwala Road',
  'Samanabad',
  'Gulistan Colony',
  'Civil Lines',
  'Kohinoor Town',
  'Faisalabad'
] as const;

/**
 * Site-wide keyword pool. Per-page SEO calls cherry-pick the relevant
 * subset and pass to `seoService.set({ keywords: [...] })`.
 *
 * Patterns that ALL Faisalabad searchers use (informed by GBP search-
 * queries data + Pakistani-Urdu mixed search behaviour):
 *   - English "best dentist in Faisalabad"
 *   - Abbreviation "FSD" (locally-familiar short for Faisalabad)
 *   - "near me" suffix (Google handles geographically via location; including
 *     it in keywords helps long-tail directory matches like sulekha.pk)
 *   - Neighborhood landmark ("near D Ground")
 *   - Service + city ("zirconia crown Faisalabad", "root canal in FSD")
 *   - Common Urdu transliterations would go here too — left out because the
 *     site UI is English; add when Urdu landing pages launch.
 */
export const SITE_KEYWORDS = {
  /** Used on home page + about — broad brand/locality reach. */
  brand: [
    'best dentist in Faisalabad',
    'best dentist in FSD',
    'best dentist Faisalabad',
    'best dentist near me',
    'best dental clinic in Faisalabad',
    'top dental clinic Faisalabad',
    'dental clinic near D Ground',
    'dental clinic near D Ground Faisalabad',
    'dentist near me Faisalabad',
    'dentist in Satellite Town Faisalabad',
    'dentist in Madina Town',
    'family dentist Faisalabad',
    'dental implant clinic Faisalabad',
    'cosmetic dentist Faisalabad',
    'multi specialist dentist Faisalabad'
  ],

  /**
   * Per-service keyword fragments. Service-detail.ts builds the final
   * keywords list by combining a service-specific entry with `brand[0..2]`
   * so every page gets brand + service+location coverage without
   * duplicating the entire bag.
   *
   * Key = lowercase service slug. Values target the long-tail query
   * variations Faisalabad searchers actually type.
   */
  perService: {
    'zirconia-crowns': [
      'zirconia crown Faisalabad',
      'zirconia crown in Faisalabad',
      'zirconia crown in FSD',
      'zirconia crown FSD',
      'zirconia crown near me',
      'zirconia crown Faisalabad price',
      'best zirconia crown Faisalabad',
      'tooth crown Faisalabad'
    ],
    'root-canal-treatment': [
      'root canal Faisalabad',
      'root canal in Faisalabad',
      'root canal in FSD',
      'root canal FSD',
      'root canal near me Faisalabad',
      'RCT Faisalabad',
      'painless root canal Faisalabad',
      'best root canal Faisalabad'
    ],
    'dental-implants': [
      'dental implant Faisalabad',
      'dental implants in Faisalabad',
      'dental implant FSD',
      'dental implant near me',
      'best dental implant Faisalabad',
      'tooth implant Faisalabad',
      'implant dentist Faisalabad'
    ],
    'orthodontics': [
      'braces Faisalabad',
      'orthodontist Faisalabad',
      'invisalign Faisalabad',
      'clear aligners Faisalabad',
      'braces FSD',
      'best orthodontist Faisalabad'
    ],
    'cosmetic-dentistry': [
      'cosmetic dentist Faisalabad',
      'veneers Faisalabad',
      'porcelain veneers Faisalabad',
      'smile design Faisalabad',
      'smile makeover FSD',
      'best cosmetic dentist Faisalabad'
    ],
    'teeth-whitening': [
      'teeth whitening Faisalabad',
      'teeth whitening in FSD',
      'teeth bleaching Faisalabad',
      'professional whitening Faisalabad',
      'teeth whitening near me'
    ],
    'pediatric-dentistry': [
      'pediatric dentist Faisalabad',
      'kids dentist Faisalabad',
      'children dentist FSD',
      'best pediatric dentist Faisalabad'
    ],
    'advanced-general-dentistry': [
      'dentist Faisalabad',
      'dental check up Faisalabad',
      'scaling polishing Faisalabad',
      'family dentist FSD',
      'dental cleaning Faisalabad'
    ]
  } as Readonly<Record<string, readonly string[]>>
} as const;

/**
 * Common "People Also Ask"-style questions for the home page. Rendered as
 * a visible FAQ accordion (FAQPage schema), which earns:
 *  - Rich-result eligibility (expandable FAQs directly in Google SERP)
 *  - Long-tail keyword coverage in body content — answers naturally
 *    repeat phrases like "best dentist in Faisalabad" without stuffing
 */
export const LOCAL_FAQS = [
  {
    q: 'Who is the best dentist in Faisalabad?',
    a: 'The Perfect Smile is led by Dr. Faizan Sheikh — a multi-disciplinary specialist holding diplomas in Crown & Bridge, Orthodontics, and Implantology. Most patients describe us as the best dental clinic in Faisalabad because every treatment plan is delivered under one roof, with transparent pricing and unhurried, gentle care.'
  },
  {
    q: 'Where is The Perfect Smile dental clinic located?',
    a: 'The clinic is on Stayana Road, adjacent to Rehman Garden Gate No. 1 (Fish Farm area), Faisalabad — a short drive from D Ground, Satellite Town, Madina Town, and Peoples Colony. Walk-in patients from across Faisalabad and FSD-adjacent cities (Lahore, Jhang, Sargodha) visit us regularly.'
  },
  {
    q: 'How much does a zirconia crown cost in Faisalabad?',
    a: "Zirconia crown pricing in Faisalabad varies by case complexity, lab provenance, and the number of units. We provide a written, itemised quote at the free initial consultation — no surprises later. Book a free WhatsApp consult to get a tailored estimate."
  },
  {
    q: 'Is root canal treatment painful?',
    a: 'Modern root canal treatment at our Faisalabad clinic is virtually painless. We use computer-controlled local anaesthesia and modern rotary endodontic instruments, so the procedure feels comparable to a routine filling. Most patients drive home themselves the same day.'
  },
  {
    q: 'Do you offer dental implants in FSD?',
    a: 'Yes — Dr. Faizan Sheikh holds a Certificate in Implantology and places premium-system dental implants in Faisalabad using computer-guided 3D placement. Same-day temporary teeth are available for most cases. Free consultation includes a digital scan and treatment plan.'
  },
  {
    q: 'Do you treat children?',
    a: "Yes. We're a family-friendly clinic and one of the top choices for paediatric dentistry in Faisalabad — calm rooms, gentle approach, and a fear-free experience designed specifically for young patients."
  }
] as const;
