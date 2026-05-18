export const environment = {
  production: true,
  supabaseUrl: 'https://cgmvvpfrfdwbficxuknc.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbXZ2cGZyZmR3YmZpY3h1a25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDE5MTIsImV4cCI6MjA5MzgxNzkxMn0.O9IopmZLpxDQuHJzmAqw7ybLaCPIRMtMUDwXIDNkqRs',
  storageBucket: 'clinic-images',
  /**
   * Production origin — used by SeoService for canonical/OG URLs and by
   * sitemap.xml.
   *
   * **Apex (non-www) is the canonical** — that's the form the clinic
   * owner actually types and shares, and Vercel serves the site
   * identically from both `theperfectsmileclinic.com` and
   * `www.theperfectsmileclinic.com`. Both URLs work for visitors, but
   * `<link rel="canonical">` here tells Google which one to surface in
   * the SERP, preventing duplicate-content split.
   *
   * If you later switch to www-canonical, also update:
   *   - scripts/generate-sitemap.mjs   (SITE_URL constant)
   *   - public/robots.txt              (Sitemap line)
   */
  siteUrl: 'https://theperfectsmileclinic.com'
};
