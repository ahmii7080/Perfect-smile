-- ============================================================
-- Migration: add before/after photo columns to gallery_cases
--
-- Run this in Supabase → SQL Editor → Run
-- (only once — it's idempotent thanks to IF NOT EXISTS)
-- ============================================================

alter table public.gallery_cases
  add column if not exists before_image text,
  add column if not exists after_image  text;

-- Done. New columns are nullable, so the 9 existing seeded rows
-- stay unchanged and continue rendering via the SVG illustration.
