-- 0043_taste_quiz.sql
-- Taste quiz for Surprise Me feature.
--
-- WHAT THIS ADDS
--   taste_quiz_images  — curated image pool, managed via admin portal (B-Admin session)
--   couples.taste_quiz_done — boolean flag, prevents quiz showing twice
--
-- ARCHITECTURE
--   Same 10 images shown to every new bride on first Surprise Me open.
--   Liked images → muse_saves (source_type='image', saved_by_role='bride')
--   Skipped images → nothing stored
--   After quiz → taste profile exists, Surprise Me canvas shows liked saves
--
-- ADMIN NOTE: Image pool UI deferred to B-Admin session.
--   Until then: insert rows directly via Supabase SQL editor.
--   API falls back to hardcoded seed images if table is empty.
--
-- IMMUTABILITY: never edit this file. Changes go in 0044+.

-- ── taste_quiz_images ─────────────────────────────────────────────────────────
create table if not exists taste_quiz_images (
  id              uuid primary key default uuid_generate_v4(),
  image_url       text not null,
  caption         text,
  aesthetic_tags  text[] not null default '{}',
  active          boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Only active images, in order
create index if not exists taste_quiz_images_active_order_idx
  on taste_quiz_images(sort_order) where active = true;

-- ── couples.taste_quiz_done ───────────────────────────────────────────────────
alter table couples
  add column if not exists taste_quiz_done boolean not null default false;

-- ── Seed: 10 curated images (replace URLs with real editorial picks) ──────────
-- These are placeholder Unsplash images covering the full aesthetic range.
-- Dev/Swati replace via admin portal once it ships (B-Admin session).
insert into taste_quiz_images (image_url, caption, aesthetic_tags, sort_order) values
  ('https://images.unsplash.com/photo-1519741497674-611481863552?w=1080&q=85', 'Grand ballroom, OTT florals', array['grand','ott','opulent'], 1),
  ('https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1080&q=85', 'Soft pastel lehenga, natural light', array['pastel','minimal','editorial'], 2),
  ('https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1080&q=85', 'Moody candlelit mandap', array['moody','intimate','editorial'], 3),
  ('https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1080&q=85', 'Rustic outdoor ceremony', array['rustic','natural','candid'], 4),
  ('https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1080&q=85', 'Minimal modern decor', array['minimal','modern','clean'], 5),
  ('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=85', 'Editorial couple portrait', array['editorial','moody','cinematic'], 6),
  ('https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1080&q=85', 'Grand floral arch, destination', array['grand','floral','destination'], 7),
  ('https://images.unsplash.com/photo-1529636798458-92182e662485?w=1080&q=85', 'Intimate mehndi, warm tones', array['intimate','warm','candid'], 8),
  ('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1080&q=85', 'Pastel sangeet, festive', array['festive','pastel','vibrant'], 9),
  ('https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1080&q=85', 'Dramatic dark editorial', array['moody','dramatic','editorial'], 10)
on conflict do nothing;
