import { RenderMode, ServerRoute } from '@angular/ssr';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

/**
 * Build-time Supabase client (Node) — used ONLY by `getPrerenderParams`
 * below to discover dynamic slugs so each detail page can be emitted as
 * static HTML at `ng build` time. No session persistence: this client lives
 * for one build and exits.
 */
const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

/** Fetch every `slug` column from `table` for use as a prerender param list. */
async function getSlugsFrom(table: string): Promise<{ slug: string }[]> {
  const { data, error } = await supabase.from(table).select('slug');
  if (error) {
    // Don't fail the whole build if one table is briefly unreachable —
    // just skip those routes (they'll fall back to client rendering on first visit).
    console.error(`[prerender] failed to fetch slugs from ${table}:`, error.message);
    return [];
  }
  return (data ?? []).filter(r => !!r.slug).map(row => ({ slug: row.slug as string }));
}

export const serverRoutes: ServerRoute[] = [
  // Admin shell + login: auth-gated, no SEO value — keep them out of the
  // prerender list and render entirely on the client. Both the bare login
  // (/adminauthlogin) and every sub-route (/adminauthlogin/team, etc.)
  // are CSR-only.
  { path: 'adminauthlogin',    renderMode: RenderMode.Client },
  { path: 'adminauthlogin/**', renderMode: RenderMode.Client },

  // Dynamic detail routes — fetch every slug from Supabase at build time
  // and prerender one HTML file per row.
  {
    path: 'services/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => getSlugsFrom('services')
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => getSlugsFrom('blog_posts')
  },

  // Everything else (home, about, services list, doctors, team, gallery,
  // blog list, appointment, contact) → plain static prerender.
  { path: '**', renderMode: RenderMode.Prerender }
];
