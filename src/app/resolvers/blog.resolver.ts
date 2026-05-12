import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../services/data.service';
import { BlogPost } from '../models/appointment.model';

/**
 * Route resolver for `/blog/:slug`. Same dual-mode strategy as
 * `serviceResolver`:
 *
 *  - **Server**: blocks on Supabase so Article schema + article:* OG meta
 *    tags + per-post canonical/description land in the prerendered HTML.
 *  - **Browser**: returns `undefined` instantly to keep navigation
 *    non-blocking. The component subscribes and renders a skeleton until
 *    the post arrives.
 */
export const blogResolver: ResolveFn<BlogPost | undefined> = (route) => {
  if (isPlatformBrowser(inject(PLATFORM_ID))) return undefined;
  const slug = route.paramMap.get('slug') ?? '';
  return firstValueFrom(inject(DataService).getBlogBySlug(slug));
};
