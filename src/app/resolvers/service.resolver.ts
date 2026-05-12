import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../services/data.service';
import { ServiceItem } from '../models/service.model';

/**
 * Route resolver for `/services/:slug`.
 *
 * Two execution modes depending on platform:
 *
 *  - **Server (prerender / SSR)**: blocks on Supabase via `firstValueFrom`
 *    so the data is available synchronously inside the component. This is
 *    what bakes per-service SEO tags (title, description, MedicalProcedure
 *    JSON-LD, FAQPage) into the prerendered HTML — Googlebot sees them in
 *    the initial response without needing JavaScript.
 *
 *  - **Browser**: returns `undefined` immediately. We deliberately do NOT
 *    block navigation in the browser — the resolver pattern was making
 *    "click nav link → 1-2s freeze" the default UX, especially on the
 *    first hit before `shareReplay` warms up. The detail component instead
 *    subscribes to `getServiceBySlug(slug)` in `ngOnInit` and renders a
 *    skeleton state while the request is in flight, then swaps to real
 *    content when it lands. Feels instant.
 *
 * NOTE: The page-load order is unchanged for crawlers and direct deep
 * links — those typically hit the prerendered HTML, where the data was
 * already inlined at build time.
 */
export const serviceResolver: ResolveFn<ServiceItem | undefined> = (route) => {
  if (isPlatformBrowser(inject(PLATFORM_ID))) return undefined;
  const slug = route.paramMap.get('slug') ?? '';
  return firstValueFrom(inject(DataService).getServiceBySlug(slug));
};
