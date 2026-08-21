-- 0126_couple_booking_taxonomy_eleven.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- F-15.10 · THE COUPLE PLANE'S CATEGORY VOCABULARY, MOVED TO THE ONE HOME.
-- Chartered CE-35, ruled R-35.26/.27a/.27b/.28/.29, 2026-08-21.
--
-- `couple_bookings_category_check` carried the pre-0123 eleven — photographer ·
-- videographer · mua · designer · venue · caterer · decor · florist · music ·
-- planner · other. Only `designer`, `decor` and `other` agree with the canonical
-- eleven at src/agent/categories.js:37-47. EIGHT canonical tokens were refused
-- at the door: planning · photography · makeup · hairstylist · jewellery ·
-- venue_catering · performer · content_creator. This migration moves the CHECK
-- to that list and backfills the retired eight.
--
-- ⚠ THIS MIGRATION IS ONE HALF OF A CO-REQUIRED PAIR (R-35.29). The pwa booking
--   picker at components/frost/blooms/vendors.tsx defaulted to `photographer` —
--   a token this migration RETIRES. Between this apply and the pwa push, an
--   add-booking on the default picker value is refused by this CHECK. The window
--   is minutes and it is stated honestly rather than engineered away: the
--   union-CHECK two-migration alternative was priced and refused as complexity
--   the live traffic (three test accounts, no paying brides) does not warrant.
--   ORDER: this migration → dream-os push → dreamos-pwa push, back to back.
--
-- ── THE BACKFILL IS EIGHT MAPPINGS AND ONLY TWO OF THEM MOVE ROWS ────────────
-- Founder-run census, witnessed 2026-08-21 before this file was authored:
--     music 2 · caterer 1 · decor 1 · other 1   (5 rows, 4 tokens)
-- So `music → performer` (2) and `caterer → venue_catering` (1) are the only
-- statements that touch a row today. `decor` and `other` are already canonical
-- and are not named below at all.
--
-- The other SIX statements are DRIFT GUARDS, expected ZERO, and they are not a
-- guessed legacy set: every token they name is witnessed at the constraint's own
-- line, docs/db/PUBLIC_SCHEMA.md:1373. They exist because the pwa picker's
-- default is `photographer` and Mira's tools still offer all eleven retired
-- tokens until their pushes land — a row minted between census and apply would
-- otherwise fail the ADD CONSTRAINT mid-migration. Authoring against the rows
-- alone would have been the narrower reading of the census law and the wrong one
-- here; authoring tokens from memory would have been the defect it guards.
--
-- Mappings follow 0123's own semantics, each read from categories.js:
--   photographer, videographer → photography     (:39, merged 2026-08-12)
--   mua                        → makeup          (:40)
--   venue, caterer             → venue_catering  (:44, merged)
--   florist                    → decor           (:43, merged 2026-05-15)
--   music                      → performer       (:45, live music merged)
--   planner                    → planning        (:37)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.couple_bookings
  DROP CONSTRAINT IF EXISTS couple_bookings_category_check;

-- ── THE TWO THAT MOVE ROWS (census: 2 and 1) ────────────────────────────────
UPDATE public.couple_bookings SET category = 'performer'
 WHERE category = 'music';

UPDATE public.couple_bookings SET category = 'venue_catering'
 WHERE category IN ('venue', 'caterer');

-- ── THE SIX DRIFT GUARDS (census: zero each) ────────────────────────────────
UPDATE public.couple_bookings SET category = 'photography'
 WHERE category IN ('photographer', 'videographer');

UPDATE public.couple_bookings SET category = 'makeup'
 WHERE category = 'mua';

UPDATE public.couple_bookings SET category = 'decor'
 WHERE category = 'florist';

UPDATE public.couple_bookings SET category = 'planning'
 WHERE category = 'planner';

-- Anything the guards did not catch — an unforeseen token — becomes `other`
-- rather than failing the ADD CONSTRAINT. `other` is honest here: it is the
-- founder's own fold-everything-else token (categories.js:47), and a booking
-- landing there keeps her row and her money visible.
UPDATE public.couple_bookings SET category = 'other'
 WHERE category NOT IN ('planning','designer','photography','makeup','hairstylist',
                        'jewellery','decor','venue_catering','performer',
                        'content_creator','other');

ALTER TABLE public.couple_bookings
  ADD CONSTRAINT couple_bookings_category_check
  CHECK (category = ANY (ARRAY[
    'planning'::text, 'designer'::text, 'photography'::text, 'makeup'::text,
    'hairstylist'::text, 'jewellery'::text, 'decor'::text, 'venue_catering'::text,
    'performer'::text, 'content_creator'::text, 'other'::text
  ]));

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY. THREE BLOCKS, EACH ITS OWN PASTE — 0123's post-apply amendment
-- (0123:101-111) is law here: the Supabase editor renders ONLY the last
-- statement's result set, so a batched verify is not a verify. And 0123's
-- deeper lesson (0123:112-115): a row-only foot shows green whatever the
-- ADD CONSTRAINT actually did. BLOCK 3 is the one that proves this migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── BLOCK 1 · THE ASSERTION THAT BINDS ─────────────────────── paste alone ───
-- Zero rows outside the canonical eleven. Drift-proof: true whatever was minted
-- between the census and this apply. EXPECT ZERO ROWS.
SELECT category, count(*) AS rows
  FROM public.couple_bookings
 WHERE category NOT IN ('planning','designer','photography','makeup','hairstylist',
                        'jewellery','decor','venue_catering','performer',
                        'content_creator','other')
 GROUP BY 1;

-- ── BLOCK 2 · THE DISTRIBUTION, PRICED AGAINST THE CENSUS ──── paste alone ───
-- Census before apply was: music 2 · caterer 1 · decor 1 · other 1 (5 rows).
-- EXPECT EXACTLY: performer 2 · venue_catering 1 · decor 1 · other 1 (5 rows).
-- Any other shape means rows were minted between census and apply — read them
-- before moving on; the total must still be 5 or the difference must be
-- explainable by bookings the founder himself made in the window.
SELECT category, count(*) AS rows
  FROM public.couple_bookings
 GROUP BY 1
 ORDER BY 2 DESC, 1;

-- ── BLOCK 3 · THE BLOCK THAT PROVES THE MIGRATION ──────────── paste alone ───
-- 0123's deeper lesson (0123:112-115): every verify there read ROWS, and NOT ONE
-- READ THE CONSTRAINT. A backfill can succeed while the ADD CONSTRAINT is other
-- than intended, and a row-only foot shows green either way. This block reads
-- the constraint's own definition back out of the catalogue.
-- EXPECT ONE ROW: couple_bookings_category_check, its CHECK naming exactly the
-- canonical eleven, and NONE of photographer · videographer · mua · venue ·
-- caterer · florist · music · planner.
SELECT conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
 WHERE conrelid = 'public.couple_bookings'::regclass
   AND conname  = 'couple_bookings_category_check';
