-- 0043_taste_profile.sql
-- Bride taste profile for Surprise Me feature.
--
-- COLUMNS ADDED TO couples:
--   taste_quiz_done  boolean default false
--     → true after she submits aesthetic tags. Overlay never shows again.
--   aesthetic_tags   jsonb default '[]'
--     → her selected tags e.g. ["moody","editorial","pastel"]
--     → jsonb to match muse_saves, vendors, vendor_portfolio (schema consistency)
--     → used to match against vendor portfolio images in /taste/surprise
--
-- NOTE: taste_quiz_images table (from original 0043 draft) was dropped.
--   Curated fallback images are hardcoded in taste.js.
--   Admin image pool management UI deferred to B-Admin session.
--
-- TYPE FIX APPLIED OUT OF BAND:
--   aesthetic_tags was initially created as text[] then converted to jsonb
--   via: ALTER COLUMN DROP DEFAULT → ALTER COLUMN TYPE → SET DEFAULT '[]'::jsonb

ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS taste_quiz_done  boolean NOT NULL DEFAULT false;

ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS aesthetic_tags   jsonb   NOT NULL DEFAULT '[]'::jsonb;
