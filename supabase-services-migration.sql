-- ============================================================
-- Services table — admin-managed clinic services
-- Run this in Supabase → SQL Editor → Run
-- (idempotent — safe to run again, won't duplicate)
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists public.services (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  tagline         text not null default '',
  icon            text not null default 'fa-tooth',
  color           text not null default '#0EA5E9',
  summary         text not null,
  description     text not null default '',
  benefits        text[] not null default '{}',
  procedure_steps text[] not null default '{}',
  faqs            jsonb  not null default '[]'::jsonb,
  sort_order      int    not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists services_sort_idx on public.services (sort_order);

-- updated_at auto trigger (re-uses the function from earlier setup)
drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();

-- ===== RLS =====
alter table public.services enable row level security;
drop policy if exists "public read" on public.services;
drop policy if exists "auth full"   on public.services;
create policy "public read" on public.services for select to anon, authenticated using (true);
create policy "auth full"   on public.services for all    to authenticated         using (true) with check (true);

-- ===== Seed data — 12 services =====
insert into public.services (slug, title, tagline, icon, color, summary, description, benefits, procedure_steps, sort_order) values
  ('advanced-general-dentistry', 'Advanced General Dentistry', 'Comprehensive care for every stage of your smile',
    'fa-stethoscope', '#0EA5E9',
    'Routine check-ups, oral exams, preventive care and modern restorative treatment — the foundation of long-term dental health.',
    'Our general dentistry programme covers everything from your six-monthly check-up to early decay management and personalised home-care advice. Every visit begins with a thorough exam and an honest, easy-to-understand treatment plan.',
    array['Six-monthly check-ups & oral exams','Digital x-rays as required','Personalised home-care advice','Honest, transparent treatment plans'],
    array['Comprehensive exam','Digital x-rays where needed','Hygiene assessment','Personalised treatment plan'],
    1),

  ('orthodontics', 'Orthodontics', 'Straighter teeth, on your schedule',
    'fa-grip-lines', '#0284C7',
    'From traditional braces to clear aligners — discreet, predictable tooth alignment for teens and adults.',
    'Dr. Faizan holds a Certificate in Orthodontics and offers the full alignment spectrum. Treatment plans are designed individually after careful records, x-rays and clinical assessment.',
    array['Metal & ceramic braces','Clear aligners','Adult & teen treatment','Personalised retention to lock in your result'],
    array['Records, x-rays & clinical assessment','Personalised treatment plan','Monthly progress visits','Retention to maintain your smile'],
    2),

  ('cosmetic-dentistry', 'Cosmetic Dentistry', 'Where dentistry meets artistry',
    'fa-wand-magic-sparkles', '#0EA5E9',
    'Smile design, veneers, composite bonding and gum aesthetics — built around your natural facial proportions.',
    'Cosmetic cases are planned around your face, lip line and natural tooth shape so the result looks like you — only better. We discuss every option and walk you through pros and cons before any treatment begins.',
    array['Personalised smile design','Veneers & composite bonding','Gum aesthetics','Honest preview of your final result'],
    array['Smile consultation & photography','Treatment plan & cost estimate','Tooth preparation if needed','Bonding & polish'],
    3),

  ('full-partial-dentures', 'Full & Partial Dentures', 'Comfortable, lifelike removable replacements',
    'fa-teeth', '#14B8A6',
    'Custom-made removable dentures — full or partial — fitted for natural appearance and comfortable function.',
    'Modern dentures are precisely fitted, lightweight and natural-looking. We take detailed records, fit a try-in, and adjust until you''re happy with the look, fit and bite.',
    array['Full upper / lower dentures','Partial dentures around existing teeth','Try-in stage for approval','Comfort-fit adjustments included'],
    array['Records & shade selection','Try-in & adjustment','Final delivery','Follow-up comfort review'],
    4),

  ('composite-filling', 'Composite Filling', 'Tooth-coloured fillings that blend in',
    'fa-palette', '#38BDF8',
    'Modern white composite fillings — strong, mercury-free and shade-matched to your natural tooth.',
    'Composite fillings restore decayed or chipped teeth with a tooth-coloured material that bonds directly to enamel. The result is a virtually invisible repair with no metal, no shadows.',
    array['Tooth-coloured, virtually invisible','Mercury-free','Bonded directly to tooth structure','Same-day completion'],
    array['Diagnosis & shade match','Decay removal under local anaesthesia','Bonding & shaping','Polish to finish'],
    5),

  ('root-canal', 'Root Canal Therapy', 'Save your tooth from extraction',
    'fa-syringe', '#0284C7',
    'Modern endodontic treatment to relieve pain and preserve a tooth that would otherwise need to be extracted.',
    'Root canal therapy treats infection or inflammation inside the tooth. With modern instruments and proper anaesthesia, the procedure is comfortable and predictable.',
    array['Saves the natural tooth','Resolves long-standing pain','Performed under local anaesthesia','Followed up with a protective restoration'],
    array['Diagnosis with digital x-rays','Local anaesthesia & isolation','Cleaning, shaping & disinfection','Sealing & post-op restoration'],
    6),

  ('pediatric-dentistry', 'Pediatric Dentistry', 'Gentle dentistry for growing smiles',
    'fa-child-reaching', '#14B8A6',
    'A friendly, anxiety-free environment for children''s first visits and ongoing dental care.',
    'Children''s first dental experiences shape their attitude to oral care for life. We focus on prevention, fluoride, sealants and gentle treatment in a calm, welcoming setting.',
    array['Calm, child-friendly visits','Preventive sealants & fluoride','Behaviour management approach','Early monitoring for orthodontic needs'],
    array['Welcome & gentle introduction','Show-tell-do exam','Cleaning & fluoride if needed','Home-care coaching for parents'],
    7),

  ('wisdom-tooth-extraction', 'Wisdom Tooth Extraction', 'Safe, careful surgical removal',
    'fa-tooth', '#0EA5E9',
    'Surgical removal of impacted or problematic wisdom teeth, planned with x-rays for a safe, comfortable procedure.',
    'Impacted or partially erupted wisdom teeth can cause pain, infection or damage to neighbouring teeth. We assess each case carefully with x-rays and only recommend extraction when it''s clinically warranted.',
    array['Pre-operative x-ray assessment','Local anaesthesia','Detailed post-op care plan','Follow-up review'],
    array['X-ray assessment','Local anaesthesia','Surgical removal','Post-op review'],
    8),

  ('dental-implants', 'Dental Implants', 'Permanent replacements for missing teeth',
    'fa-tooth', '#0284C7',
    'Titanium implants restored with custom crowns — engineered to look, feel and function like your own teeth.',
    'Dr. Faizan holds a Certificate in Implantology and places implants for single missing teeth, multiple gaps and full-arch cases. Each plan is based on x-ray assessment, bone evaluation and a detailed discussion of options.',
    array['Single & multiple-tooth replacement','X-ray-guided treatment planning','Custom-made final crown','Detailed aftercare programme'],
    array['Consultation & x-ray assessment','Implant placement under sterile protocol','Healing period','Final crown fitted'],
    9),

  ('scaling-polishing', 'Scaling & Polishing', 'A professional clean for healthier gums',
    'fa-leaf', '#14B8A6',
    'Professional removal of plaque and stains, followed by a gentle polish — for fresher breath and healthier gums.',
    'Even with the best home care, plaque and tartar build up over time. A professional scaling and polishing visit removes buildup, freshens breath and helps keep gum disease at bay.',
    array['Removes hardened tartar','Reduces surface stains','Freshens breath','Helps prevent gum disease'],
    array['Periodontal assessment','Ultrasonic scaling','Polish & finish','Personalised home-care advice'],
    10),

  ('teeth-whitening', 'Teeth Whitening', 'Brighten your smile, safely',
    'fa-sun', '#38BDF8',
    'Professionally supervised whitening that lightens your teeth without damaging enamel.',
    'Professional whitening uses dental-grade gels at controlled concentrations under clinical supervision. Results are noticeably brighter and last significantly longer than over-the-counter alternatives.',
    array['Enamel-safe formulation','Noticeably brighter result','In-chair or take-home options','Desensitiser included'],
    array['Shade record & gum protection','Whitening gel application','Take-home maintenance instructions','Follow-up review'],
    11),

  ('simple-extraction', 'Simple Extraction', 'Comfortable removal of damaged teeth',
    'fa-truck-medical', '#0EA5E9',
    'Gentle, non-surgical tooth removal under local anaesthesia — with clear aftercare guidance.',
    'When a tooth cannot be saved, a simple extraction provides relief and prevents further problems. We perform the procedure under local anaesthesia with detailed aftercare to support smooth healing.',
    array['Performed under local anaesthesia','Clear aftercare instructions','Quick recovery for most patients','Replacement options discussed upfront'],
    array['Diagnosis & x-ray','Local anaesthesia','Gentle extraction','Aftercare guidance'],
    12)
on conflict (slug) do nothing;
