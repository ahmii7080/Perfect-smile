import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { DataService } from '../../services/data.service';
import { RelatedServicesService } from '../../services/related-services.service';
import { ServiceItem } from '../../models/service.model';

/**
 * Below-the-fold internal-link block, rendered at the bottom of each
 * service-detail page. Uses **descriptive anchor text** ("Learn more
 * about Dental Implants →") rather than generic "click here" — clean
 * signal for both search engines and assistive tech about what the
 * linked page actually covers.
 *
 * Icons come from Font Awesome classes already loaded site-wide (each
 * service in Supabase has an `icon` column like `fa-tooth`). We chose
 * FA over `NgOptimizedImage` for these because:
 *   - they're tiny (CSS, no extra network requests)
 *   - they avoid managing 12 separate PNG/AVIF/WebP files for service tiles
 *   - they remain crisp at every viewport
 */
@Component({
  selector: 'app-related-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './related-services.component.html',
  styleUrl: './related-services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatedServicesComponent {
  private readonly data    = inject(DataService);
  private readonly related = inject(RelatedServicesService);

  /** Slug of the current service-detail page (parent passes this in). */
  currentServiceSlug = input.required<string>();

  /**
   * All services from Supabase, exposed as a signal. `getServices()` is
   * cached via `shareReplay(1)` so by the time service-detail renders,
   * the value emits synchronously and we get instant cards.
   */
  private readonly services = toSignal(this.data.getServices(), {
    initialValue: [] as ServiceItem[]
  });

  /** Up to 3 ServiceItems matching the recommended-slug list. */
  cards = computed<ServiceItem[]>(() => {
    const wanted = this.related.forSlug(this.currentServiceSlug());
    if (wanted.length === 0) return [];
    const all = this.services();
    return wanted
      .map(slug => all.find(s => s.slug === slug))
      .filter((s): s is ServiceItem => !!s);
  });
}
