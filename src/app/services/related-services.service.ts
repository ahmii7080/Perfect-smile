import { Injectable } from '@angular/core';

/**
 * Hand-curated "if a patient is reading about service X, recommend Y, Z, W"
 * map. Drives the `<app-related-services>` block at the bottom of every
 * service-detail page.
 *
 * Why hand-pick instead of "show any 3 other services":
 *   1. **Topical SEO**: linking *clinically relevant* services (e.g.
 *      Implants ↔ Dentures ↔ Extractions) tells Google these pages cover
 *      the same intent cluster — much stronger ranking signal than random
 *      cross-links.
 *   2. **Patient journey**: someone reading about extractions is genuinely
 *      considering implants/dentures next. The link helps them and reduces
 *      bounce rate.
 *
 * Keys + values are Supabase service slugs (from `services.slug`). Update
 * when adding a new service.
 */
@Injectable({ providedIn: 'root' })
export class RelatedServicesService {
  private readonly map: Readonly<Record<string, readonly string[]>> = {
    'dental-implants':            ['full-partial-dentures', 'cosmetic-dentistry', 'simple-extraction'],
    'orthodontics':               ['cosmetic-dentistry', 'teeth-whitening', 'scaling-polishing'],
    'cosmetic-dentistry':         ['teeth-whitening', 'orthodontics', 'full-partial-dentures'],
    'teeth-whitening':            ['cosmetic-dentistry', 'scaling-polishing', 'orthodontics'],
    'scaling-polishing':          ['teeth-whitening', 'cosmetic-dentistry', 'advanced-general-dentistry'],
    'simple-extraction':          ['wisdom-tooth-extraction', 'dental-implants', 'full-partial-dentures'],
    'wisdom-tooth-extraction':    ['simple-extraction', 'dental-implants', 'advanced-general-dentistry'],
    'root-canal':                 ['cosmetic-dentistry', 'scaling-polishing', 'advanced-general-dentistry'],
    'composite-filling':          ['scaling-polishing', 'root-canal', 'cosmetic-dentistry'],
    'full-partial-dentures':      ['dental-implants', 'advanced-general-dentistry', 'cosmetic-dentistry'],
    'pediatric-dentistry':        ['scaling-polishing', 'advanced-general-dentistry', 'composite-filling'],
    'advanced-general-dentistry': ['scaling-polishing', 'composite-filling', 'root-canal']
  };

  /** Up to 3 related slugs for `currentSlug`. Empty array if slug is unmapped. */
  forSlug(currentSlug: string): readonly string[] {
    return this.map[currentSlug] ?? [];
  }
}
