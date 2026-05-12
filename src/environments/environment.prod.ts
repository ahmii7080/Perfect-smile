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
   * **Must match the canonical host that's actually attached and serving.**
   * `www` is the canonical here because that's what's attached as the
   * primary domain in Vercel. The apex (`theperfectsmileclinic.com`) is
   * configured in the Vercel Dashboard to 301-redirect to www, so any
   * visitor or crawler that hits apex lands on www anyway. Keeping these
   * two strings out of sync produces the dreaded
   * "canonical link points to a different page" Seobility error.
   */
  siteUrl: 'https://www.theperfectsmileclinic.com'
};
