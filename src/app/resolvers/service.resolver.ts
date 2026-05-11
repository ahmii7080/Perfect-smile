import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../services/data.service';
import { ServiceItem } from '../models/service.model';

/**
 * Route resolver for `/services/:slug`. Fetches the matching service from
 * Supabase BEFORE the component activates — guarantees the data is ready
 * when the page renders, which in turn guarantees the SEO-tag updates
 * (title, description, MedicalProcedure JSON-LD, FAQPage) are applied
 * before SSR/prerender captures the HTML.
 *
 * Without a resolver, the data fetch happens inside `ngOnInit`, asynchronously,
 * and the prerender process can capture the page before the subscription fires —
 * which is exactly what we saw: detail pages prerendered with "Service not found"
 * because the signal was still undefined at capture time.
 */
export const serviceResolver: ResolveFn<ServiceItem | undefined> = (route) => {
  const slug = route.paramMap.get('slug') ?? '';
  return firstValueFrom(inject(DataService).getServiceBySlug(slug));
};
