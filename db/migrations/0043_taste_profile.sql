-- 0043_taste_profile.sql
-- Bride taste profile for Surprise Me feature.
--
-- taste_quiz_done (on couples) — true after she sets her aesthetic tags.
--   Overlay never shows again after first submission.
-- aesthetic_tags (on couples) — her selected tags e.g. ['moody','editorial','pastel']
--   Used to match against vendor portfolios and curated image pool.
--
-- taste_quiz_images table dropped — not needed. Curated surprise images
--   are fetched at runtime from vendor portfolios + external sources.
--
-- Admin image pool management: B-Admin session.

ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS aesthetic_tags text[] NOT NULL DEFAULT '{}';
