import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { HoverPreloadStrategy } from './services/hover-preload.strategy';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // `withFetch()` makes HttpClient use the native `fetch` API instead of
    // XHR. Required for SSR: Node has fetch built-in, and Angular's transfer
    // cache (which avoids double-fetching during hydration) only works with
    // the fetch backend. Also prevents server-side requests from hanging
    // indefinitely on missing assets — fetch has a sane default timeout.
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
      // Selective hover-triggered preloading. Strategy returns EMPTY for
      // un-flagged routes; PrefetchOnHoverDirective flags them on hover
      // and then triggers a `RouterPreloader.preload()` pass.
      withPreloading(HoverPreloadStrategy),
    ),
    provideClientHydration(withEventReplay()),
  ],
};
