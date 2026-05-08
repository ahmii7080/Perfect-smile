-- ============================================================
-- The Perfect Smile — Supabase setup
--
-- 1. Create your admin user FIRST in Supabase Dashboard:
--      Authentication → Users → Add user → Create new user
--      (auto-confirm checked)
--
-- 2. Storage bucket (run in Dashboard, NOT in this SQL editor):
--      Storage → New bucket → name: clinic-images → ✅ Public bucket
--
-- 3. Then paste THIS WHOLE FILE into Supabase → SQL Editor → Run.
-- ============================================================

-- =================== 1. EXTENSIONS ===================
create extension if not exists "uuid-ossp";

-- =================== 2. TABLES ===================

-- Blog posts ----------------------------------------------------
create table if not exists public.blog_posts (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  title       text not null,
  excerpt     text not null,
  date        date not null default current_date,
  read_time   text not null default '5 min',
  category    text not null default 'General',
  author      text not null default 'Dr. Faizan Sheikh',
  color       text not null default '#0EA5E9',
  content     text not null,
  image       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists blog_posts_date_idx     on public.blog_posts (date desc);
create index if not exists blog_posts_category_idx on public.blog_posts (category);

-- Team members --------------------------------------------------
create table if not exists public.team_members (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text not null,
  initials    text not null,
  color       text not null default '#0EA5E9',
  image       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Gallery cases -------------------------------------------------
create table if not exists public.gallery_cases (
  id           uuid primary key default uuid_generate_v4(),
  category     text not null,
  title        text not null,
  description  text not null,
  treatment    text not null check (treatment in ('veneers','whitening','implants','braces','crowns','makeover')),
  icon         text not null default 'fa-tooth',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists gallery_category_idx on public.gallery_cases (category);

-- Visiting consultants -----------------------------------------
create table if not exists public.visiting_consultants (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  qualifications  text not null,
  specialty       text not null,
  initials        text not null,
  color           text not null default '#0284C7',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =================== 3. UPDATED_AT TRIGGER ===================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated         on public.blog_posts;
drop trigger if exists trg_team_members_updated       on public.team_members;
drop trigger if exists trg_gallery_cases_updated      on public.gallery_cases;
drop trigger if exists trg_visiting_consultants_updated on public.visiting_consultants;

create trigger trg_blog_posts_updated         before update on public.blog_posts         for each row execute function public.set_updated_at();
create trigger trg_team_members_updated       before update on public.team_members       for each row execute function public.set_updated_at();
create trigger trg_gallery_cases_updated      before update on public.gallery_cases      for each row execute function public.set_updated_at();
create trigger trg_visiting_consultants_updated before update on public.visiting_consultants for each row execute function public.set_updated_at();

-- =================== 4. ROW-LEVEL SECURITY ===================
-- Enable RLS, then allow:
--   • anyone (anon) to SELECT  → public site reads
--   • authenticated users to ALL → admin dashboard writes
alter table public.blog_posts          enable row level security;
alter table public.team_members        enable row level security;
alter table public.gallery_cases       enable row level security;
alter table public.visiting_consultants enable row level security;

-- Drop any old versions of these policies before recreating
drop policy if exists "public read"        on public.blog_posts;
drop policy if exists "auth full"          on public.blog_posts;
drop policy if exists "public read"        on public.team_members;
drop policy if exists "auth full"          on public.team_members;
drop policy if exists "public read"        on public.gallery_cases;
drop policy if exists "auth full"          on public.gallery_cases;
drop policy if exists "public read"        on public.visiting_consultants;
drop policy if exists "auth full"          on public.visiting_consultants;

create policy "public read" on public.blog_posts          for select to anon, authenticated using (true);
create policy "auth full"   on public.blog_posts          for all    to authenticated         using (true) with check (true);

create policy "public read" on public.team_members        for select to anon, authenticated using (true);
create policy "auth full"   on public.team_members        for all    to authenticated         using (true) with check (true);

create policy "public read" on public.gallery_cases       for select to anon, authenticated using (true);
create policy "auth full"   on public.gallery_cases       for all    to authenticated         using (true) with check (true);

create policy "public read" on public.visiting_consultants for select to anon, authenticated using (true);
create policy "auth full"   on public.visiting_consultants for all    to authenticated         using (true) with check (true);

-- =================== 5. STORAGE POLICIES ===================
-- Make sure you've already created the `clinic-images` bucket as PUBLIC
-- in the Storage UI before running these.
drop policy if exists "public read clinic-images" on storage.objects;
drop policy if exists "auth write clinic-images"  on storage.objects;

create policy "public read clinic-images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'clinic-images');

create policy "auth write clinic-images"
  on storage.objects for all to authenticated
  using (bucket_id = 'clinic-images')
  with check (bucket_id = 'clinic-images');

-- =================== 6. SEED DATA ===================

-- ---- Visiting consultants (the 2 you gave me) ----
insert into public.visiting_consultants (name, qualifications, specialty, initials, color) values
  ('Dr. Sheroz Khan', 'FCPS Orthodontics',     'Orthodontist',                  'SK', '#0284C7'),
  ('Dr. Usama Malik', 'Maxillofacial Surgeon', 'Oral & Maxillofacial Surgery',  'UM', '#14B8A6')
on conflict do nothing;

-- ---- Team (1 member) ----
insert into public.team_members (name, role, initials, color, image) values
  ('Muhammad Asad Jameel', 'Dental Assistant', 'MA', '#0EA5E9', null)
on conflict do nothing;

-- ---- Gallery cases (9) ----
insert into public.gallery_cases (category, title, description, treatment, icon) values
  ('Veneers',    'Full-arch porcelain veneers',         '8 hand-layered porcelain veneers — closing diastema and balancing tooth proportions.', 'veneers', 'fa-gem'),
  ('Whitening',  '6-shade in-chair whitening',          'Single 90-minute session — A3.5 to BL2.',                                              'whitening', 'fa-sun'),
  ('Implants',   'Single-tooth implant + crown',        'Computer-guided placement, ceramic crown bonded at 3 months.',                          'implants', 'fa-tooth'),
  ('Braces',     'Invisalign clear aligners',           '14-month treatment — moderate crowding to ideal alignment.',                            'braces', 'fa-grip-lines'),
  ('Crowns',     'Posterior zirconia crowns',           'Two molars rebuilt with monolithic zirconia — natural shade match.',                    'crowns', 'fa-crown'),
  ('Veneers',    'Minimal-prep smile makeover',         '6 ultra-thin veneers — minimal enamel reduction.',                                      'makeover', 'fa-wand-magic-sparkles'),
  ('Implants',   'All-on-4 full-arch reconstruction',   'Four implants supporting a full hybrid bridge — life-changing result.',                 'implants', 'fa-tooth'),
  ('Whitening',  'Take-home tray whitening',            '3 weeks of guided home whitening with desensitiser.',                                   'whitening', 'fa-sun'),
  ('Braces',     'Lingual braces, 18 months',           'Hidden behind teeth — invisible orthodontics.',                                         'braces', 'fa-grip-lines')
on conflict do nothing;

-- ---- Blog posts (8) ----
insert into public.blog_posts (slug, title, excerpt, date, read_time, category, author, color, content) values
  ('what-makes-modern-implants-different',
    'What Makes Modern Implants Different (And Why It Matters)',
    'Implant dentistry has changed dramatically in the last decade. Here''s what guided surgery, premium implant systems, and digital workflows mean for your treatment outcome.',
    '2026-04-12','6 min','Implants','Dr. Faizan Sheikh','#0284C7',
    'Modern implant dentistry rests on three pillars: careful x-ray planning, precise placement, and quality implant systems. Combined, they have transformed implants from a multi-surgery ordeal into a precise, predictable procedure that often takes a single afternoon. In this article we walk through what each of these advances actually means in practice — and how they affect your healing, longevity, and final aesthetic result.'),

  ('digital-smile-design-explained',
    'Smile Design: Plan Your New Smile Before You Commit',
    'Smile design lets you preview — and approve — your new smile before a single tooth is touched. Here''s how the process works.',
    '2026-04-02','5 min','Cosmetic','Dr. Faizan Sheikh','#0EA5E9',
    'Smile design is the gold standard for cosmetic case planning. Your face, lips, and existing smile are photographed and analysed against design principles like facial midline, smile arc, and golden proportion. We then mock up the proposed result and discuss what''s possible. Only when you approve the plan do we begin definitive treatment.'),

  ('are-clear-aligners-right-for-you',
    'Are Clear Aligners Right for You?',
    'Clear aligners aren''t for everyone. We break down which cases respond beautifully — and which still benefit from braces.',
    '2026-03-18','4 min','Orthodontics','Dr. Faizan Sheikh','#14B8A6',
    'Clear aligners have democratised orthodontics — but they aren''t a universal solution. Mild-to-moderate crowding, spacing, and certain bite issues respond beautifully. Severe rotations, large vertical movements, and complex skeletal cases may still need traditional braces or hybrid treatment. The honest assessment matters more than the brand on the box.'),

  ('child-first-dental-visit',
    'Your Child''s First Dental Visit — A Parent''s Guide',
    'When should the first visit happen? How do we keep it fear-free? Practical advice for parents.',
    '2026-03-04','5 min','Pediatric','Dr. Faizan Sheikh','#0EA5E9',
    'The first dental visit is recommended by age one or within six months of the first tooth appearing. The visit is gentle, short, and focused on familiarising your child with the environment — not on procedures. We use a show-tell-do approach to build trust from day one.'),

  ('5-foods-that-stain-your-teeth',
    '5 Surprising Foods That Stain Your Teeth (And What to Do About It)',
    'Coffee and red wine are well-known culprits, but these everyday foods may be quietly dulling your smile.',
    '2026-02-20','3 min','Lifestyle','Dr. Faizan Sheikh','#0284C7',
    'Most people know about coffee, tea, and red wine — but foods like balsamic vinegar, soy sauce, beetroot, curry, and dark berries are notorious staining agents. The good news: a few small habits (rinsing after meals, using a straw with cold drinks, regular hygiene visits) keep them from leaving permanent marks.'),

  ('why-bleeding-gums-matter',
    'Why Bleeding Gums Are Never ''Normal''',
    'Bleeding gums are the earliest sign of gum disease — the leading cause of tooth loss in adults. Don''t ignore them.',
    '2026-02-06','4 min','Hygiene','Dr. Faizan Sheikh','#14B8A6',
    'If your gums bleed when you brush or floss, that''s a sign of inflammation — and inflammation is the first stage of gum disease. The good news: caught early, gingivitis is fully reversible with professional scaling and a refreshed home-care routine. Left alone, it can quietly progress to bone loss.'),

  ('all-on-4-vs-traditional-implants',
    'Full-Arch Reconstruction: All-on-4 vs Traditional Implants',
    'Full-arch reconstruction has multiple paths. Here''s how All-on-4 compares to multiple individual implants.',
    '2026-01-22','7 min','Implants','Dr. Faizan Sheikh','#0284C7',
    'All-on-4 uses just four strategically angled implants to support a full-arch bridge — often without the need for bone grafting. It''s faster, less invasive, and more affordable than 8 individual implants. But it isn''t ideal for every patient. We compare both approaches and the situations where each one wins.'),

  ('post-extraction-recovery-tips',
    'Post-Extraction Recovery: 7 Tips for Faster Healing',
    'What to eat, what to avoid, and how to spot early warning signs after a tooth extraction.',
    '2026-01-08','4 min','General','Dr. Faizan Sheikh','#0EA5E9',
    'Most extractions heal beautifully on their own, but a few simple habits make a big difference. Stay upright for the first day, avoid hot drinks and straws (they dislodge the protective clot), eat soft cool foods, and take prescribed medication on schedule. If pain peaks on day 3–4 instead of fading, call us — that may be a dry socket and is easily treated.')
on conflict (slug) do nothing;

-- =================== Done ===================
-- You should now see seeded data in:
--   • Table editor → blog_posts (8 rows)
--   • Table editor → team_members (1 row)
--   • Table editor → gallery_cases (9 rows)
--   • Table editor → visiting_consultants (2 rows)
