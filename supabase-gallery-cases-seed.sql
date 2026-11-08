-- ============================================================
-- The Perfect Smile — Gallery cases (before/after), one per topic:
--   Direct composite veneers · Veneers · Zirconia crowns ·
--   Root canal treatment · Extraction
--
-- Run once in Supabase → SQL Editor → Run  (safe to re-run:
-- a case is skipped if one with the same title already exists).
--
-- Photos are left empty on purpose — open Admin → Gallery, edit each
-- case and upload its BEFORE and AFTER photo.
-- ============================================================

-- 1. Allow the two new treatment types (root canal, extraction).
alter table public.gallery_cases drop constraint if exists gallery_cases_treatment_check;
alter table public.gallery_cases add constraint gallery_cases_treatment_check
  check (treatment in ('veneers','whitening','implants','braces','crowns','makeover','root-canal','extraction'));

-- 2. Cases (one per topic).
insert into public.gallery_cases (category, title, description, treatment, icon)
select v.category, v.title, v.description, v.treatment, v.icon
from (values
  ('Veneers',
   'Direct Composite Veneers in Faisalabad — Same-Day Smile',
   'Chipped, discoloured and uneven front teeth reshaped with direct composite veneers in a single visit at The Perfect Smile, Faisalabad. Minimal tooth preparation, natural shade matching and an instantly brighter smile.',
   'veneers', 'fa-gem'),

  ('Veneers',
   'Porcelain Veneers Smile Makeover in Faisalabad',
   'Stained and worn front teeth transformed with custom porcelain veneers, designed for shape, length and shade to suit the patient''s face. Long-lasting, stain-resistant results from our cosmetic dentist in Faisalabad.',
   'veneers', 'fa-gem'),

  ('Crowns',
   'Zirconia Crowns in Faisalabad — Strong, Natural-Looking Teeth',
   'Broken and heavily filled teeth restored with metal-free zirconia crowns. Excellent strength for chewing, no grey line at the gum and a natural tooth colour — by our crown & bridge specialist in Faisalabad.',
   'crowns', 'fa-crown'),

  ('Root Canal',
   'Root Canal Treatment in Faisalabad — Saving the Natural Tooth',
   'A deeply decayed, painful tooth saved with root canal treatment under local anaesthesia, then protected with a crown. Root canal treatment at our Faisalabad clinic lets you keep your own tooth instead of removing it.',
   'root-canal', 'fa-syringe'),

  ('Extraction',
   'Tooth Extraction in Faisalabad — Gentle and Careful',
   'A broken-down tooth that could not be saved removed gently under local anaesthesia, with clear aftercare instructions for smooth healing. Safe tooth extraction at The Perfect Smile Dental Clinic, Faisalabad.',
   'extraction', 'fa-teeth-open')
) as v(category, title, description, treatment, icon)
where not exists (
  select 1 from public.gallery_cases g where g.title = v.title
);
