-- ═══════════════════════════════════════════════════════════════════════════════════
-- 0101_profile_controls.sql  —  TDW_07 · D-1 + D-5 · Block 07 P1
-- Additive only. No data is moved or dropped. Safe to run once, in the Supabase editor.
--
-- ── WHY 0101 AND NOT THE SPEC'S 0081 ──────────────────────────────────────────────
-- TDW_07_DISCOVER_FINAL.md §2 reserves 0081 for this file. 0081 IS OCCUPIED:
-- db/migrations/0081_message_meta.sql (TDW_06's CE-23 rider) holds that address.
-- Protocol §3.3 / LD-8: reservations are law, holes are harmless, RENUMBERING IS
-- FORBIDDEN, a number is never reused. The ladder tail derived by command at fea5e4d
-- is 0100_couple_onboarding_fields.sql, and `ls db/migrations/ | grep '^0101'` returns
-- nothing — so this file takes 0101. Recorded here because the spec still says 0081 and
-- the next reader must find the reason, not the contradiction.
--
-- ── PROVENANCE (SQL-provenance law: a column with no witness is an assumption) ─────
-- Every column below was read from docs/db/PUBLIC_SCHEMA.md — the WITNESSED prod
-- snapshot (2026-07-23, founder-run, 63 tables / 698 columns, guard passed 63=63,
-- applied ladder tip 0099). STALENESS SETTLED BY COMMAND: the only migration applied
-- after that snapshot is 0100, which touches public.couples ALONE — so every table
-- named below is current in that doc at this tip. The readback at the foot of this
-- file is the SETTLING witness; if it disagrees with the above, the doc is stale and
-- THIS FILE IS WRONG — stop and say so rather than proceeding.
--
-- Section read: "public.vendors · 38 columns" — which lists, in order:
--   id · user_id · business_name · category · vertical · city · upi_id · gstin ·
--   status · tier · founding_cohort · created_at · updated_at · onboarding_state ·
--   routing_handle · instagram_handle · open_to_travel · travel_notes ·
--   briefing_enabled · invoice_prefix · invoice_counter · style_notes · pin_hash ·
--   pin_failed_attempts · pin_locked_until · aesthetic_tags · rate_min · rate_max ·
--   discover_preview · discover_eligible · discover_request_state · couture_eligible ·
--   featured_eligible · about · base_fee_min · base_fee_max · slot_capacity ·
--   assistant_name
-- NEITHER rate_display NOR discover_paused appears in that list. That absence is the
-- witness these two statements stand on.
--
-- ── WHAT THE SPEC ASKED FOR THAT IS *NOT* HERE, AND WHY ───────────────────────────
--   portfolio photo `caption text`  →  STRUCK. IT ALREADY EXISTS.
--     Witness, verbatim from the same snapshot: "public.vendor_portfolio · 13 columns"
--     lists at ordinal 4: `caption text`. It is already written and allowlisted in
--     code (src/lib/vendor/portfolio.js:64 on insert, :92 on update, :78 on read).
--     The spec named a column it already had; adding it again would either error or,
--     with IF NOT EXISTS, ship a statement that does nothing while claiming to. This
--     strike is the SQL-provenance law working: the column was authored against prose
--     and the derivation caught it.
--
-- ── A NAME COLLISION, NAMED SO NOBODY CONFLATES THE TWO ───────────────────────────
--   public.demo_vendors.rate_display  is  `text`     (snapshot, demo_vendors col 8) —
--       a human string like "From Rs 1,50,000", which is precisely why the feed skips
--       the budget filter for demo cards (src/api/couple/discover.js:93 says so).
--   public.vendors.rate_display       is  `boolean`  (THIS FILE) —
--       a show/hide switch over vendors.rate_min.
-- SAME NAME · DIFFERENT TABLE · DIFFERENT TYPE · DIFFERENT MEANING. Any future query
-- that joins or unions the two planes must read the schema name, never the column name
-- alone. (The estate has paid for this class before: ENGINE_SCHEMA.md's own header
-- records `engine.events` vs `public.events`.)
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ── 1 · vendors.rate_display ──────────────────────────────────────────────────────
-- D-1: the vendor chooses whether the feed shows their starting price.
-- DEFAULT true, NOT NULL: every existing vendor keeps TODAY'S behaviour byte-for-byte
-- (the feed has always shown rate_min). Only an explicit false hides. A nullable column
-- would make "not yet decided" and "chose to hide" the same value, and the feed would
-- have to guess — which is the class of guess this estate files findings about.
alter table public.vendors
  add column if not exists rate_display boolean not null default true;

-- ── 2 · vendors.discover_paused ───────────────────────────────────────────────────
-- D-1: hidden from Discover, APPROVAL RETAINED. This is deliberately a SECOND column
-- and not a reuse of discover_eligible: eligibility is the admin's grant
-- (src/api/admin/discover.js:36 grants it, :62 revokes it) and pause is the vendor's
-- own switch. Collapsing them would make a vendor's pause indistinguishable from an
-- admin revocation, and un-pausing would silently re-grant approval.
-- DEFAULT false, NOT NULL: nobody is paused on arrival.
alter table public.vendors
  add column if not exists discover_paused boolean not null default false;

-- ── 3 · the feed predicate's partial index ────────────────────────────────────────
-- The exact predicate src/api/couple/discover.js's real-vendor query now runs:
--   .eq('discover_eligible', true).eq('discover_paused', false)
-- A partial index over the live rows only — the visible set is a small fraction of
-- vendors and stays so, which is what makes a partial index the right shape here.
create index if not exists vendors_discover_live_idx
  on public.vendors (created_at desc)
  where discover_eligible and not discover_paused;


-- ── 4 · the three ranking weights (D-5, "hand-tunable") ───────────────────────────
-- PROVENANCE: docs/db/PUBLIC_SCHEMA.md · "public.admin_config · 4 columns" —
--   1. key text NOT NULL · 2. value text NOT NULL · 3. description text ·
--   4. updated_at timestamptz NOT NULL default now()
-- `value` is TEXT, so the weights are stored and read as strings; src/lib/discover/
-- ranking.js coerces and falls back per-term. NO DDL is needed — admin_config is a KV
-- store and these are rows.
--
-- WHY THE SEEDS SHIP WITH THE DDL AND NOT LATER: src/api/admin/config.js:31-32 returns
-- 404 for a key with no row, and the router exposes NO insert route. An unseeded key
-- therefore cannot be created by any founder thumb-path that exists — seeding is a
-- PRECONDITION of the admin flip, not a convenience. Seeds are the spec's own
-- 0.5 / 0.25 / 0.25.
--
-- ON CONFLICT DO NOTHING: re-running this file must never stomp a weight the founder
-- has since tuned. The seed is a floor, not a reset.
insert into public.admin_config (key, value, description) values
  ('discover.rank.w_spotlight',    '0.5',  'Discover ranking weight: active spotlight card (TDW_07 D-5)'),
  ('discover.rank.w_freshness',    '0.25', 'Discover ranking weight: vendor activity recency (TDW_07 D-5)'),
  ('discover.rank.w_completeness', '0.25', 'Discover ranking weight: profile completeness (TDW_07 D-5)')
on conflict (key) do nothing;


-- ── 5 · READBACK — the settling witness. Run it; paste the output back. ───────────
-- Expect exactly TWO rows from the first query and THREE from the second.
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'vendors'
   and column_name in ('rate_display', 'discover_paused')
 order by column_name;

select key, value
  from public.admin_config
 where key like 'discover.rank.%'
 order by key;
