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
