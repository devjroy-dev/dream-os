-- db/migrations/0127_engagements_pair_key.sql
-- TDW_16 · P1 RIDER — THE KEY LOSES ITS THIRD COLUMN.
-- Ruled R-35.32 (arm a), curing F-16.17. Founder-run.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- THIS ONE SITS AT THE LADDER TIP. NO REGISTER ROW IS OWED.
-- ═════════════════════════════════════════════════════════════════════════════
-- 0090 was a below-tip redemption and took its row in
-- db/migrations/OUT_OF_ORDER.json accordingly. 0127 is the NEXT number after
-- the applied tip 0126, so it trips PUBLIC_SCHEMA.md's arithmetic check the
-- ordinary way and F-SW.3's blind spot never opens. Adding a record for it
-- would in fact ABORT the formatter, which refuses any record whose number is
-- not BELOW the tip — that is what out-of-order MEANS (OUT_OF_ORDER.json's own
-- _README). The 0090 row STAYS: its debt is unpaid until the next PAIR regen
-- actually describes public.engagements.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHY THE THIRD COLUMN IS LEAVING, DERIVED AT THE ROWS AND NOT ARGUED
-- ═════════════════════════════════════════════════════════════════════════════
-- 0090 keyed this table (couple_id, vendor_id, category) because
-- TDW_16_BRIDGE_FINAL.md §3 said so on 2026-07-14. Nobody had asked whether the
-- third column discriminates anything. IT DOES NOT: `public.vendors.category`
-- is a SINGLE free-text column (PUBLIC_SCHEMA.md, public.vendors:4; and
-- src/agent/categories.js:26 states in its own words that the column is free
-- text held only by the door and the extractor). A vendor holds exactly ONE
-- category. So the triple adds no rows over the pair — it adds only the ability
-- to FRAGMENT when he edits his profile.
--
-- AND HE ALREADY DID. The founder's fixture of 2026-08-21, at the rows:
--   couple_enquiries 34c5434d-359f-4ea5-b300-ed08c7391c6b, written 2026-07-31,
--     snapshot: vendor_name 'Dev Test Studio', vendor_category 'Event planner'
--   vendors 23165e38-6510-4639-ab6a-9f35bab93742, live today:
--     business_name 'Dev Roy Photography', category 'photography'
-- Under the triple key, her next enquiry with that same vendor would have
-- minted a SECOND engagement on 'photography' while the first stood on
-- 'planning' — one relationship, two rows — and BOTH would have carried
-- enquiry_id 34c5434d, because couple_enquiries upserts on (couple_id,
-- vendor_id) and hands the same row back. One artifact, claimed twice.
--
-- THE PAIR IS THE ESTATE'S OWN COMMITTED ANSWER, already standing in exactly
-- these words: `couple_enquiries_couple_vendor_uidx` is UNIQUE (couple_id,
-- vendor_id). This migration stops the engagement plane disagreeing with the
-- enquiry plane about what a relationship is.
--
-- ── WHAT `category` IS NOW, STATED SO NOBODY RE-LITIGATES IT FROM MEMORY ────
-- It is a TRACKING SNAPSHOT, not history. src/lib/engagements.js refreshes it
-- on EVERY write, from the vendor's own live category, so the column follows
-- him: the day he becomes a photographer, her engagement says photography.
-- HISTORY LIVES IN THE ARTIFACTS — couple_enquiries.vendor_category holds what
-- he was when she enquired, couple_bookings.category holds what she booked him
-- for, and both are reachable through this row's own refs. This column is not
-- trying to be either of them.
-- IF MULTI-CATEGORY VENDORS EVER BECOME REAL, the key question REOPENS BY ITS
-- OWN MIGRATION — not by anyone's recollection of this one.

BEGIN;

-- ── THE PRE-CHECK. The ADD below cannot succeed if two rows share a pair, and
-- a bare failure would tell the founder only that something is wrong. This
-- names WHICH rows, before anything is dropped.
DO $$
DECLARE
  v_dupes integer;
  v_detail text;
BEGIN
  SELECT count(*), coalesce(string_agg(format('(couple %s, vendor %s) x%s', couple_id, vendor_id, n), '; '), '')
    INTO v_dupes, v_detail
    FROM (
      SELECT couple_id, vendor_id, count(*) AS n
        FROM public.engagements
       GROUP BY couple_id, vendor_id
      HAVING count(*) > 1
    ) d;

  IF v_dupes > 0 THEN
    RAISE EXCEPTION 'RE-KEY REFUSED: % relationship(s) already hold more than one engagement row — %. The fragmentation F-16.17 predicts has already occurred and a merge must be RULED before the pair key can be added.', v_dupes, v_detail;
  END IF;
END $$;

ALTER TABLE public.engagements
  DROP CONSTRAINT IF EXISTS engagements_couple_vendor_category_uidx;

ALTER TABLE public.engagements
  ADD CONSTRAINT engagements_couple_vendor_uidx UNIQUE (couple_id, vendor_id);

-- ── THE COUNTS ASSERT IN-FILE ───────────────────────────────────────────────
-- Priced against the founder's fixture of 2026-08-21: TWO engagement rows, both
-- Sarah's (couple 9f1f84d5), on TWO DIFFERENT vendors — 23165e38 on 'planning'
-- and a8c52506 on 'makeup'. Two distinct pairs, so the re-key collapses NOTHING
-- and the row count must be unchanged on both sides of it. If production moved,
-- this refuses rather than quietly re-keying a shape nobody measured.
DO $$
DECLARE
  v_rows  integer;
  v_pairs integer;
BEGIN
  SELECT count(*), count(DISTINCT (couple_id, vendor_id)) INTO v_rows, v_pairs
    FROM public.engagements;

  IF v_rows <> 2 OR v_pairs <> 2 THEN
    RAISE EXCEPTION 'RE-KEY ASSERTION FAILED: expected 2 rows over 2 distinct pairs from the fixture, found % row(s) over % pair(s). Re-derive before applying.', v_rows, v_pairs;
  END IF;

  RAISE NOTICE '0127: key moved to (couple_id, vendor_id). % rows, % pairs, zero collapse.', v_rows, v_pairs;
END $$;

COMMIT;

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFY. THREE BLOCKS, EACH ITS OWN PASTE.
-- 0123's post-apply amendment (0123:101-111): the Supabase editor renders only
-- the last statement's result set, so a batched verify is not a verify. And its
-- deeper lesson (0123:112-115): a row-only foot shows green whatever the DDL
-- actually did. BLOCK 2 is the one that proves this migration — it reads the
-- CONSTRAINT. BLOCK 3 proves the OLD key is gone by trying to violate what the
-- NEW one forbids.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · THE ROWS SURVIVED THE RE-KEY ─────────────────────── paste alone ───
-- Expect the SAME two rows, same ids, same categories, nothing collapsed.
--
-- select id, couple_id, vendor_id, category, status, source,
--        (enquiry_id is not null) as enquiry_stamped
--   from public.engagements
--  order by created_at;

-- ── BLOCK 2 · THE KEY IS THE PAIR, AND THE TRIPLE IS GONE ──────── paste alone ───
-- THE ONE THAT PROVES THIS FILE. Expect exactly ONE unique constraint:
-- engagements_couple_vendor_uidx UNIQUE (couple_id, vendor_id).
-- engagements_couple_vendor_category_uidx must NOT appear. If both are listed,
-- the DROP did not fire and the fragmentation is still live.
--
-- select con.conname, pg_get_constraintdef(con.oid) as definition
--   from pg_constraint con
--   join pg_class rel on rel.oid = con.conrelid
--   join pg_namespace nsp on nsp.oid = rel.relnamespace
--  where nsp.nspname = 'public' and rel.relname = 'engagements'
--    and con.contype = 'u'
--  order by con.conname;

-- ── BLOCK 3 · THE NEW KEY REFUSES, PROVEN BY EXECUTION ─────────── paste alone ───
-- This inserts a row that the OLD triple key would have HAPPILY ACCEPTED — same
-- couple, same vendor, DIFFERENT category. That is precisely the fragmentation
-- F-16.17 named. The expected result is an ERROR:
--   duplicate key value violates unique constraint "engagements_couple_vendor_uidx"
-- If this block SUCCEEDS, the re-key did not take and the disease is still here.
-- It rolls itself back either way.
--
-- begin;
-- insert into public.engagements (couple_id, vendor_id, category, status, source)
-- select couple_id, vendor_id,
--        case when category = 'other' then 'decor' else 'other' end,
--        'proposal', 'direct'
--   from public.engagements limit 1;
-- rollback;
