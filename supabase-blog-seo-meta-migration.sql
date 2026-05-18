-- ---------------------------------------------------------------------------
-- Migration: add SEO meta columns to blog_posts.
--
-- Powers the new Yoast-style sidebar in the admin blog editor:
--   - focus_keyword     — primary keyword the post targets
--   - seo_title         — custom <title>, falls back to `title`
--   - meta_description  — custom <meta description>, falls back to `excerpt`
--   - seo_tags          — comma-separated keyword bag for <meta keywords>
--   - image_alt         — alt text for the featured image
--
-- All NULL-able so the migration is non-destructive — existing rows keep
-- working unchanged, and the public site/SeoService fall back to title /
-- excerpt when these columns are empty.
--
-- Run once via Supabase SQL editor or the CLI:
--   supabase db push  (if you've wired migrations)
--   — or paste the block below into the SQL editor and click Run.
-- ---------------------------------------------------------------------------

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS focus_keyword     TEXT,
  ADD COLUMN IF NOT EXISTS seo_title         TEXT,
  ADD COLUMN IF NOT EXISTS meta_description  TEXT,
  ADD COLUMN IF NOT EXISTS seo_tags          TEXT,
  ADD COLUMN IF NOT EXISTS image_alt         TEXT;

-- Optional: helpful index for admin "filter by focus keyword" UI later.
CREATE INDEX IF NOT EXISTS idx_blog_posts_focus_keyword
  ON blog_posts (focus_keyword)
  WHERE focus_keyword IS NOT NULL;

-- Verify columns exist:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'blog_posts' AND column_name IN
--     ('focus_keyword','seo_title','meta_description','seo_tags','image_alt');
