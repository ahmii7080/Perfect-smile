/**
 * snapshot-supabase.mjs
 *
 * Pulls all admin-managed tables from Supabase and writes them as static
 * JSON files into `src/assets/data/`. These JSON files are what the public
 * site reads at runtime — Supabase is NEVER queried from a patient-facing
 * page. The result: navigation between pages is instant (a single CDN
 * fetch of a tiny JSON file vs. a 200-800 ms Supabase round-trip).
 *
 * Trade-off: content updates require a redeploy to appear on the live site.
 * For a clinic with a handful of services, ~30 blog posts and ~50 gallery
 * cases that change weekly at most, that's a fine price to pay for the
 * instant-feel UX and the resilience-against-Supabase-downtime bonus.
 *
 * Hooked into `npm run build` via the `prebuild` script, so every Vercel
 * deploy refreshes the snapshot automatically. Can also be run manually:
 *
 *   npm run snapshot
 *
 * Auto-redeploy on admin save: configure a Supabase Database Webhook on
 * each table that POSTs to a Vercel Deploy Hook URL. Then admin saves
 * trigger a rebuild → ~2 minutes later the change is live.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = resolve(__dirname, '..');
const OUT_DIR    = resolve(REPO_ROOT, 'src/assets/data');

// Same anon credentials as src/environments/environment.prod.ts. Safe to
// commit — Supabase enforces row-level-security policies server-side, and
// the anon key only grants the privileges your RLS rules explicitly allow.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cgmvvpfrfdwbficxuknc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbXZ2cGZyZmR3YmZpY3h1a25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDE5MTIsImV4cCI6MjA5MzgxNzkxMn0.O9IopmZLpxDQuHJzmAqw7ybLaCPIRMtMUDwXIDNkqRs';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

/* ────────────────────────────────────────────────────────────────────
 *  Mappers — keep IDENTICAL to the row→model mappings in DataService.
 *  Drift between these two will silently break the public site.
 *  ──────────────────────────────────────────────────────────────────── */

const mapService = row => ({
  slug:        row.slug,
  title:       row.title,
  tagline:     row.tagline ?? '',
  icon:        row.icon,
  color:       row.color,
  summary:     row.summary,
  description: row.description ?? '',
  benefits:    row.benefits ?? [],
  procedure:   row.procedure_steps ?? [],
  faqs:        row.faqs ?? []
});

const mapBlog = row => ({
  slug:     row.slug,
  title:    row.title,
  excerpt:  row.excerpt,
  date:     row.date,
  readTime: row.read_time,
  category: row.category,
  author:   row.author,
  color:    row.color,
  content:  row.content,
  ...(row.image ? { image: row.image } : {})
});

const mapTeam = row => ({
  name:     row.name,
  role:     row.role,
  initials: row.initials,
  color:    row.color,
  ...(row.image ? { image: row.image } : {})
});

const mapGallery = row => ({
  id:          row.id,
  category:    row.category,
  title:       row.title,
  description: row.description,
  treatment:   row.treatment,
  icon:        row.icon,
  ...(row.before_image ? { beforeImage: row.before_image } : {}),
  ...(row.after_image  ? { afterImage:  row.after_image  } : {})
});

const mapConsultant = row => ({
  id:             row.id,
  name:           row.name,
  qualifications: row.qualifications,
  specialty:      row.specialty,
  initials:       row.initials,
  color:          row.color,
  ...(row.image ? { image: row.image } : {})
});

/* ────────────────────────────────────────────────────────────────────
 *  Pull plan — one entry per output file.
 *  ──────────────────────────────────────────────────────────────────── */

const PLAN = [
  // `services` keeps `sort_order ASC` — admin manually controls service-tile
  // order, and chronology would shuffle a curated list every time we tweak
  // an old row. Every other content table is newest-first so freshly added
  // rows surface to the top of their respective public-site lists.
  { table: 'services',             order: 'sort_order',  out: 'services.json',    map: mapService    },
  { table: 'blog_posts',           order: 'date',        desc: true, out: 'blog.json',     map: mapBlog },
  { table: 'team_members',         order: 'created_at',  desc: true, out: 'team.json',        map: mapTeam       },
  { table: 'gallery_cases',        order: 'created_at',  desc: true, out: 'gallery.json',     map: mapGallery    },
  { table: 'visiting_consultants', order: 'created_at',  desc: true, out: 'consultants.json', map: mapConsultant }
];

async function snapshot({ table, order, desc = false, out, map }) {
  const { data, error } = await db.from(table).select('*').order(order, { ascending: !desc });
  if (error) {
    // Surface the error but DON'T overwrite the file — keeping the previous
    // good snapshot is strictly better than shipping `[]` to production.
    // Vercel will see the non-zero exit and abort the deploy, so a broken
    // Supabase query never silently empties the live site.
    throw new Error(`Failed to read ${table}: ${error.message}`);
  }
  const mapped = (data ?? []).map(map);
  const path   = resolve(OUT_DIR, out);
  await writeFile(path, JSON.stringify(mapped, null, 2) + '\n', 'utf8');
  console.log(`  ✓ ${out.padEnd(20)} ${mapped.length} rows`);
  return mapped.length;
}

async function main() {
  console.log('▸ snapshot-supabase: pulling tables → src/assets/data/');
  await mkdir(OUT_DIR, { recursive: true });

  const started = Date.now();
  let total = 0;
  for (const job of PLAN) {
    total += await snapshot(job);
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(2);
  console.log(`▸ snapshot-supabase: ${total} rows across ${PLAN.length} tables in ${elapsed}s`);
}

main().catch(err => {
  console.error('✗ snapshot-supabase failed:', err.message);
  process.exit(1);
});
