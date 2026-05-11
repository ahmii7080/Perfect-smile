import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../services/data.service';
import { BlogPost } from '../models/appointment.model';

/**
 * Route resolver for `/blog/:slug`. Same rationale as `serviceResolver`:
 * loads the blog post from Supabase before the route activates so the
 * Article schema, OG `article:*` meta tags, and per-post title/description
 * all make it into the prerendered HTML.
 */
export const blogResolver: ResolveFn<BlogPost | undefined> = (route) => {
  const slug = route.paramMap.get('slug') ?? '';
  return firstValueFrom(inject(DataService).getBlogBySlug(slug));
};
