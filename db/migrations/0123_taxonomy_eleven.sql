-- 0123_taxonomy_eleven.sql
-- ARC OB · THE TAXONOMY CHARTER — the 16 become ELEVEN.
-- Supabase project: nvzkbagqxbysoeszxent (Mumbai)  ·  plane: PUBLIC
-- Applied: 2026-08-12 — founder-run, Supabase SQL editor, verify blocks 1-3
--          witnessed green (results recorded at the foot). A migration header
--          that still says [date to be filled] AFTER it is applied is this
--          arc's own defect class: a comment asserting an untrue DB fact.
--          categories.js:10 said "not a DB constraint" for three months and
--          mispriced a whole sitting. THE LINE MOVES WITH THE APPLY.
--
-- ── WHY THIS FILE EXISTS AT ALL ─────────────────────────────────────────────
-- The kickoff priced this sitting NO-DDL, off a `vendors.category` census. A
-- census of that column cannot see a CHECK constraint. Two of them carry the old
-- sixteen:
--     0048_collab.sql:17   collab_posts.requirement_type
--     0096_collab_planner.sql:11   collab_post_items.requirement_type
-- and `collabItems.postMatchesCategory` compares those columns to
-- `vendors.category` by RAW EQUALITY. Retiring a vendor token without moving the
-- CHECK does not error — it makes a whole craft's collab feed match nothing and
-- SAY NOTHING. The chair refused that arm on principle (a silent empty feed is
-- F-09.173's disease wearing a new surface) and ruled the migration.
--
-- ── PRICING WITNESS ─────────────────────────────────────────────────────────
-- Founder-pasted collab census, 2026-08-12:
--     collab_posts       : makeup 5 · photography 3 · attire 1 · catering 1
--     collab_post_items  : makeup 5 · photography 3 · attire 1 · catering 1 · jewellery 1
-- Only TWO tokens actually move (attire, catering). The backfill nevertheless
-- arms ALL TEN remapped tokens — CE-32's ruling: an arm over an empty token is
-- free, and a row minted between the census and this apply must not strand
-- against the new CHECK.
--
-- ── ORDER (CE-32, fixed) ────────────────────────────────────────────────────
--   1. drop the old CHECKs   2. backfill both tables   3. add the new CHECKs
--   4. verify SELECTs at the foot
-- Backfilling before the constraint moves is the only order that works: the old
-- CHECK forbids the new tokens, the new CHECK forbids the old rows.
--
-- F-OB.4 IS CURED HERE BY CONSTRUCTION: these columns said 'attire' where
-- src/agent/categories.js said 'designer' — a mirrored map disagreeing with
-- itself, live since 0048. The `attire -> designer` arm ends it, and
-- collabItems.js now IMPORTS the canonical list instead of typing it out again.
--
-- LD-8: 0113 stays a hole. Migrations are never renumbered.

BEGIN;

-- ── 1 · DROP THE OLD CHECKS ─────────────────────────────────────────────────
-- Named constraints created inline by CREATE TABLE take Postgres's default name
-- `<table>_<column>_check`. IF EXISTS so a re-run is not a failure.
ALTER TABLE public.collab_posts
  DROP CONSTRAINT IF EXISTS collab_posts_requirement_type_check;

ALTER TABLE public.collab_post_items
  DROP CONSTRAINT IF EXISTS collab_post_items_requirement_type_check;

-- ── 2 · BACKFILL — ten arms, old token -> new token ─────────────────────────
-- Idempotent: every arm's WHERE clause is false once it has run.
UPDATE public.collab_posts SET requirement_type = 'photography'
  WHERE requirement_type = 'videography';
UPDATE public.collab_posts SET requirement_type = 'venue_catering'
  WHERE requirement_type IN ('catering', 'venue');
UPDATE public.collab_posts SET requirement_type = 'performer'
  WHERE requirement_type IN ('music_dj', 'music_live', 'choreography');
UPDATE public.collab_posts SET requirement_type = 'other'
  WHERE requirement_type IN ('mehendi', 'transport', 'invitations');
UPDATE public.collab_posts SET requirement_type = 'designer'
  WHERE requirement_type = 'attire';

UPDATE public.collab_post_items SET requirement_type = 'photography'
  WHERE requirement_type = 'videography';
UPDATE public.collab_post_items SET requirement_type = 'venue_catering'
  WHERE requirement_type IN ('catering', 'venue');
UPDATE public.collab_post_items SET requirement_type = 'performer'
  WHERE requirement_type IN ('music_dj', 'music_live', 'choreography');
UPDATE public.collab_post_items SET requirement_type = 'other'
  WHERE requirement_type IN ('mehendi', 'transport', 'invitations');
UPDATE public.collab_post_items SET requirement_type = 'designer'
  WHERE requirement_type = 'attire';

-- ── 3 · THE NEW CHECKS — the eleven, verbatim from src/agent/categories.js ───
ALTER TABLE public.collab_posts
  ADD CONSTRAINT collab_posts_requirement_type_check
  CHECK (requirement_type IN (
    'planning', 'designer', 'photography', 'makeup', 'hairstylist',
    'jewellery', 'decor', 'venue_catering', 'performer', 'content_creator',
    'other'
  ));

ALTER TABLE public.collab_post_items
  ADD CONSTRAINT collab_post_items_requirement_type_check
  CHECK (requirement_type IN (
    'planning', 'designer', 'photography', 'makeup', 'hairstylist',
    'jewellery', 'decor', 'venue_catering', 'performer', 'content_creator',
    'other'
  ));

COMMIT;

-- ═══ 4 · VERIFY ═══════════════════════════════════════════════════════════
--
-- ⚠ POST-APPLY AMENDMENT (2026-08-12, same day). THE DDL ABOVE IS BYTE-FROZEN —
--   it ran, it is applied, LD-8. ONLY THIS FOOT WAS RE-AUTHORED, and the reason
--   is a defect worth carrying rather than quietly fixing:
--
--   THE VERIFY BLOCK ORIGINALLY SHIPPED AS ONE PASTE OF TWO STATEMENTS. The
--   Supabase editor renders ONLY THE LAST statement's result set. So (i) — the
--   zero-outside-eleven assertion, the one the migration's own header calls the
--   one that binds — NEVER RENDERED. The founder saw (ii) and asked why the SQL
--   was batched when only the last one runs. A verify that is not its own paste
--   boundary is not a verify; that is the same law this estate applies to a STOP,
--   applied here to a SELECT. Each block below is now its own paste.
--
--   AND THE DEEPER ONE: every verify here read ROWS. NOT ONE READ THE CONSTRAINT.
--   A backfill can succeed and the ADD CONSTRAINT can be other than intended, and
--   a row-only foot shows green either way. Block 3 exists because of that gap,
--   and it is the block that actually proves this migration did what it says.
--
--   WITNESSED RESULTS, founder-run 2026-08-12, pasted back:
--     Block 1 → 0 rows. "Success. No rows returned."
--     Block 2 → makeup 5 · photography 3 · designer 1 · venue_catering 1
--               (collab_post_items also jewellery 1). ZERO DRIFT from the census:
--               attire 1 → designer 1 and catering 1 → venue_catering 1 in both
--               tables, exactly as priced.
--     Block 3 → both constraints present, each `= ANY (ARRAY[...])` over exactly
--               the eleven; no attire, catering, venue, videography, music_dj,
--               music_live, choreography, mehendi, transport, invitations.
--   0123 IS SEALED.

-- ── BLOCK 1 · THE ASSERTION THAT BINDS ─────────────────────── paste alone ───
-- Zero rows outside the eleven, either table. Drift-proof: true whatever was
-- minted between census and apply. EXPECT ZERO ROWS.
SELECT 'collab_posts' AS tbl, requirement_type, count(*) AS rows
  FROM public.collab_posts
 WHERE requirement_type NOT IN ('planning','designer','photography','makeup','hairstylist',
                                'jewellery','decor','venue_catering','performer','content_creator','other')
 GROUP BY 2
UNION ALL
SELECT 'collab_post_items', requirement_type, count(*)
  FROM public.collab_post_items
 WHERE requirement_type NOT IN ('planning','designer','photography','makeup','hairstylist',
                                'jewellery','decor','venue_catering','performer','content_creator','other')
 GROUP BY 2;

-- ── BLOCK 2 · THE MOVED COUNTS ─────────────────────────────── paste alone ───
-- As-of-census expectation: designer 1 (was attire 1) · venue_catering 1 (was
-- catering 1), both tables. LIVE DRIFT BETWEEN CENSUS AND APPLY CHANGES THESE
-- TWO NUMBERS LAWFULLY — a higher count is a row minted in the gap, not a
-- failure. It never touches Block 1, which is the one that binds.
SELECT 'collab_posts' AS tbl, requirement_type, count(*) AS rows
  FROM public.collab_posts GROUP BY 2
UNION ALL
SELECT 'collab_post_items', requirement_type, count(*)
  FROM public.collab_post_items GROUP BY 2
 ORDER BY 1, 3 DESC, 2;

-- ── BLOCK 3 · THE CONSTRAINT ITSELF ────────────────────────── paste alone ───
-- The block the original foot lacked. Reads the DDL back out of the catalogue
-- instead of inferring it from rows. EXPECT 2 ROWS, each def carrying exactly
-- the eleven and none of the ten retired tokens.
SELECT conrelid::regclass AS tbl, conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
 WHERE conname IN ('collab_posts_requirement_type_check',
                   'collab_post_items_requirement_type_check')
 ORDER BY 1;
