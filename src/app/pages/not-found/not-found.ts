import { Component, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

/**
 * 404 surface for unknown routes.
 *
 * Why this isn't a `redirectTo: ''` (the previous wildcard behaviour):
 *
 *   - Honest 404 → less user confusion ("where did my deep link go?")
 *   - Honest 404 → Google removes the dead URL from the index instead of
 *     treating every typo as a duplicate of the homepage (which would
 *     spread thin-content signals across the brand)
 *   - `noindex` on this page → mistyped URLs don't compete for SERP slots
 *
 * The component itself is intentionally tiny — most of the work happens in
 * the `seo.set(...)` call (sets `<meta name="robots" content="noindex,
 * nofollow">` via SeoService) and in the route definition where
 * `path: '**'` catches everything not matched by an earlier route.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFoundPage {
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  /** The path the user actually requested — shown back to them so they can
   *  spot a typo (e.g. "/srvices" instead of "/services") and self-correct. */
  attemptedPath = '';

  constructor() {
    // SSR-safe: ActivatedRoute is available during prerender too. We grab
    // the URL via `snapshot` so the value is locked at activation time.
    this.attemptedPath = '/' + this.route.snapshot.url.map((s) => s.path).join('/');

    this.seo.set({
      title: 'Page Not Found',
      description:
        'The page you are looking for does not exist on The Perfect Smile Dental Clinic.',
      path: '/404',
      noindex: true,
    });
  }
}
