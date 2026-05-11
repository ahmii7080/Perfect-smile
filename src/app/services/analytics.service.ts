import { Injectable, afterNextRender, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

/** Google Analytics 4 property ID — keep aligned with the snippet in `index.html`. */
const GA_ID = 'G-971NCTBVY9';

/** Minimal type for the global `gtag` function loaded by gtag.js. */
type GtagFn = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/**
 * Sends a `page_view` to Google Analytics 4 every time the Angular router
 * finishes a navigation. The gtag snippet in `index.html` only fires once
 * (on first paint) — without this hook, the SPA route changes
 * (`/services/dental-implants`, `/blog/x`, etc.) would NOT show up as
 * separate pageviews in GA, so the Real-time and Pages reports would only
 * ever show the landing URL.
 *
 * Bootstrapped from `app.ts` by being injected — it has no public API.
 * Runs in the browser only (`afterNextRender` guards against SSR/prerender).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private router = inject(Router);

  constructor() {
    afterNextRender(() => {
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(e => {
          const url = e.urlAfterRedirects;
          // `gtag` may be undefined briefly if the GA script is still loading;
          // we drop those pageviews rather than queue (next nav covers it).
          window.gtag?.('config', GA_ID, {
            page_path: url,
            page_location: window.location.href,
            page_title: document.title
          });
        });
    });
  }
}
