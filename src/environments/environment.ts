/**
 * Default environment file (used by `ng serve` and the dev build).
 * NOTE: the anon key is safe to expose in frontend code — Supabase enforces
 * row-level security (RLS) policies server-side. Never paste the
 * service_role key here.
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://cgmvvpfrfdwbficxuknc.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbXZ2cGZyZmR3YmZpY3h1a25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDE5MTIsImV4cCI6MjA5MzgxNzkxMn0.O9IopmZLpxDQuHJzmAqw7ybLaCPIRMtMUDwXIDNkqRs',

  /** Public bucket for clinic-uploaded images (blog, team, etc). */
  storageBucket: 'clinic-images',

  /**
   * Public origin used for canonical URLs, sitemap, Open Graph + Twitter
   * absolute URLs, and JSON-LD `@id` references. Must include scheme + host,
   * NO trailing slash, NO path. Dev uses localhost so social preview tools
   * don't accidentally hit the live site.
   */
  siteUrl: 'http://localhost:4200'
};
