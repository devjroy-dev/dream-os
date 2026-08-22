-- db/migrations/0128_engagements_lead_idx.sql
-- M-LEADS-TRUTH · the badge's read gets its index. Ruled R-35.35. Founder-run.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- AT THE LADDER TIP. NO REGISTER ROW, AND THAT IS DERIVED, NOT ASSUMED.
-- ═════════════════════════════════════════════════════════════════════════════
-- The applied tip is 0127; this is 0128, the next number. It therefore trips
-- PUBLIC_SCHEMA.md's ordinary arithmetic check and F-SW.3's blind spot never
-- opens. A record in db/migrations/OUT_OF_ORDER.json would in fact ABORT the
-- formatter, which refuses any record whose number is not BELOW the tip — that
-- is what out-of-order MEANS (that file's own _README). 0090's row stays where
-- it is, OUTSTANDING, until the next PAIR regen describes public.engagements.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- WHAT R-35.37 ORDERED ME TO DERIVE, AND WHAT THE TREE SAID
-- ═════════════════════════════════════════════════════════════════════════════
-- The ruling said: "does engagements carry updated_at, and does the writer move
-- it? If absent, add the column in 0128 beside the index."
--
-- IT IS NOT ABSENT, so this file does not add it. Derived at 0f83d97:
--   · 0090_engagements.sql:89 — `updated_at timestamptz NOT NULL DEFAULT now()`
--   · src/lib/engagements.js moves it at EVERY write: :146 (mint), :174
--     (recordEnquiry's patch, unconditional — it rides the same statement that
--     stamps the refs), :236 and :245 (both recordBooking updates).
--   · And it is proven in production by the walk itself, on ONE row:
--       16:41:57  the backfill
--       18:03:02  her re-enquiry on glass
--       18:12:47  the booking
--     Three writes, three timestamps, one relationship.
-- So the spine ALREADY records "she enquired again" with a moving clock, which
-- is exactly why R-35.37 could kill the activity row: the durable record
-- existed before anyone proposed writing a second one.
--
-- ── WHY THIS INDEX, PRICED ───────────────────────────────────────────────────
-- The Business Leads handler now asks one extra question per page: "which of
-- these lead ids has an engagement behind it?" — a single batched
-- `.in('lead_id', pageLeadIds)` scoped to one vendor (R-35.35: one query per
-- page, NEVER one per row). engagements carries only couple_idx and vendor_idx
-- today, so that predicate would fall back to a scan. It is a two-row table
-- this week and a scan costs nothing this week; the index is here because the
-- SHAPE is O(1) queries and should not quietly become O(n) rows.
-- vendor_id leads the index because the handler always knows the vendor and
-- the filter is (vendor_id, lead_id) — the same order the query asks in.

BEGIN;

CREATE INDEX IF NOT EXISTS engagements_lead_idx
  ON public.engagements USING btree (vendor_id, lead_id)
  WHERE lead_id IS NOT NULL;

COMMIT;

-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFY. TWO BLOCKS, EACH ITS OWN PASTE.
-- 0123's law: the editor renders only the last statement's result set, so a
-- batched verify is not a verify. BLOCK 2 is the one that proves this file —
-- it reads the PLAN, not the rows, because an index nobody proved the planner
-- uses is a comment with a disk cost.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── BLOCK 1 · THE INDEX EXISTS AND IS PARTIAL ─────────────────── paste alone ───
-- Expect exactly three rows: couple_idx, vendor_idx, lead_idx — the last
-- carrying its WHERE clause. A lead_idx WITHOUT the predicate means the partial
-- was dropped somewhere between here and the database.
--
-- select indexname, indexdef
--   from pg_indexes
--  where schemaname = 'public' and tablename = 'engagements'
--    and indexname like 'engagements_%_idx'
--  order by indexname;

-- ── BLOCK 2 · THE PLANNER ACTUALLY REACHES FOR IT ─────────────── paste alone ───
-- THE ONE THAT PROVES THIS FILE. On two rows Postgres will rationally choose a
-- Seq Scan and that is CORRECT, not a failure — so this block does not demand
-- an Index Scan. It asks the planner to consider one, so the index is proven
-- USABLE for this exact predicate rather than merely present.
-- Expect: with enable_seqscan off, the plan names engagements_lead_idx.
-- If it names nothing, the predicate and the index disagree and the badge read
-- will scan forever as the table grows.
--
-- begin;
-- set local enable_seqscan = off;
-- explain
-- select lead_id from public.engagements
--  where vendor_id = '23165e38-6510-4639-ab6a-9f35bab93742'
--    and lead_id in ('8df93b99-a519-429e-abec-cd004bf408ce');
-- rollback;
