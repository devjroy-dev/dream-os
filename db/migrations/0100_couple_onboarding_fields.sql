-- ═══════════════════════════════════════════════════════════════════════════════════
-- 0100_couple_onboarding_fields.sql  —  TDW_05 · F-05.18 · CE-64
-- Adds the TWO columns ruled at fork A3. Additive only. No data is moved or dropped.
--
-- ── PROVENANCE (SQL-provenance law: a column with no witness is an assumption) ─────
-- Every column named below was read from docs/db/PUBLIC_SCHEMA.md — the WITNESSED prod
-- snapshot taken 2026-07-23, founder-run, 63 tables / 698 columns, guard passed 63=63,
-- applied ladder tip 0099. Section read: "public.couples · 21 columns", which lists:
--   id · user_id · partner_name · wedding_date · wedding_city · budget_total ·
--   events_planned · planning_state · created_at · updated_at · onboarding_state ·
--   nudge_sent_at · pin_hash · pin_failed_attempts · pin_locked_until ·
--   taste_quiz_done · aesthetic_tags · tier · function_count · wedding_days · functions
-- NEITHER residence_city NOR wedding_style appears in that list. That absence is the
-- witness this migration stands on. The readback at the foot of this file is the
-- settling witness; if it disagrees with the above, the doc is stale and THIS FILE IS
-- WRONG — stop and say so rather than proceeding.
--
-- ── WHY ONLY TWO, when the form posted five orphan fields ─────────────────────────
--   wedding_country  → NO column. It holds a CITY (the field renders under "Where will
--                      your wedding take place?", fed by a city dropdown). It resolves
--                      to the EXISTING couples.wedding_city. A second column beside
--                      that one would be a name that reads as correct — F-05.20's
--                      disease minted into a schema.
--   name             → NO column. public.couples has none and never did; the bride's
--                      name lives at users.name (witnessed above: public.users · 9
--                      columns, col 3 `name text`), and PATCH /couple/me already writes
--                      it there.
--   user_segment     → NO column, ruled U3. It is derivable from the two place fields
--                      and a census found ZERO readers estate-wide on both planes. A
--                      column that does not exist cannot go stale. When a reader is
--                      born, it derives on read.
--   residence_city   → NEW. No existing home.
--   wedding_style    → NEW. No existing home.
--
-- ── TYPES ─────────────────────────────────────────────────────────────────────────
-- Nullable text, no default — matching the witnessed neighbours these two sit beside
-- (couples col 3 `partner_name text`, col 5 `wedding_city text`). Every column in this
-- table that carries a default has a semantic reason to; these two do not.
--
-- ── NO CHECK CONSTRAINT ON wedding_style (CE ruling, deliberate) ──────────────────
-- Three test accounts exist; rigidity now is speculative. The vocabulary is documented
-- in the column comment instead, so it is readable without archaeology.
--
-- IMMUTABILITY: once applied, NEVER edit this file. Corrections ride a new number.
-- Holes in the ladder are harmless; renumbering is forbidden.
-- ═══════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1 · residence_city — "Where do you live?" on the couple onboarding form.
--     Holds a city or country string from the same dropdown wedding_city is fed by,
--     hence the same shape and the same 80-char discipline at the handler.
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS residence_city text;

-- 2 · wedding_style — "What's your wedding style?" Stored lowercased, as the form sends.
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS wedding_style text;

-- 3 · The vocabulary, in the database itself rather than in a spec nobody will find.
COMMENT ON COLUMN public.couples.residence_city IS
  'F-05.18/0100. Where the couple lives. City or country string from the onboarding city dropdown. Was posted as the orphan field residence_country; the value is a city, so the column is named for what it holds.';

COMMENT ON COLUMN public.couples.wedding_style IS
  'F-05.18/0100. Wedding tradition, stored lowercased. Expected values as of this migration, witnessed from the onboarding form WEDDING_STYLES list: hindu, muslim, christian, sikh, jain, buddhist, jewish, civil, fusion, other. Deliberately NOT constrained by CHECK — the list is expected to grow and three accounts exist.';

COMMIT;

-- ── THE READBACK. This is S0's evidence. Run it and paste the rows. ───────────────
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'couples'
ORDER BY ordinal_position;

-- ── THE REVERSE DIRECTION — FULLY COMMENTED, DO NOT RUN ───────────────────────────
-- It exists because a one-way migration with no stated reverse is a decision nobody
-- can revisit. It is commented rather than runnable because anything runnable left in
-- a transcript gets run, and these two ALTERs destroy any data already captured.
-- TO USE: only on a CE ruling. Delete the leading '-- ' from the two lines below,
-- confirm the readback above shows the columns empty, then run.
--
-- ALTER TABLE public.couples DROP COLUMN IF EXISTS residence_city;
-- ALTER TABLE public.couples DROP COLUMN IF EXISTS wedding_style;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- RUN RECORD (appended at commit time; the DDL above is byte-as-run and UNEDITED)
-- ═══════════════════════════════════════════════════════════════════════════════════
-- APPLIED: 2026-07-23, founder-run in the Supabase SQL editor, project
-- nvzkbagqxbysoeszxent / main (PRODUCTION), role postgres (by-screen).
--
-- THE READBACK RETURNED 23 ROWS. The first 21 matched PUBLIC_SCHEMA.md's witnessed
-- list ONE-FOR-ONE IN ORDER, every default included — the starting witness and the
-- settling witness agreed. The two new columns landed at ordinals 22 and 23:
--
--   22. residence_city  text  YES  (no default)
--   23. wedding_style   text  YES  (no default)
--
-- WITNESSED LIVE THE SAME EVENING, on the founder's own walk (+919625759924):
-- the web onboarding form wrote residence_city='Delhi' and wedding_style='hindu'
-- through the real rail, while wedding_city took 'Mumbai' over a prior WhatsApp-era
-- value and budget_total survived untouched at 2000000. Both columns are reachable
-- from the product, not merely present in the catalog.
--
-- DOC-GAP NAMED: PUBLIC_SCHEMA.md's header still reads "applied ladder tip 0099" and
-- is stale by one migration from this moment. It regenerates at its own next birth
-- through the PAIR (public_schema_dump.sql + format_public_schema.js). NEVER
-- hand-patched — a hand-edited snapshot is prose again.
-- ═══════════════════════════════════════════════════════════════════════════════════
