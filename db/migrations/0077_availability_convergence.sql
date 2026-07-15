-- ════════════════════════════════════════════════════════════════════
-- Migration 0077 — availability convergence (TDW_04 Part B, sitting B1)
-- Date:    2026-07-15
-- Author:  TDW_04 executor session
-- Ruling:  TDW_04_LEDGER_AND_CALENDAR_FINAL.md L-7 (extended 2026-07-15, founder
--          ruling relayed at the §3.5 audit) + the audit's §9 addendum ("0077
--          COLLAPSES to guarded structural convergence... ships standalone").
--
-- PLANE (F-04.30 / F-04.31, CE-ruled 2026-07-15):
--   Targets public.events. engine.events is an unrelated agent audit trail —
--   never a calendar (F-04.30/F-04.31).
--
-- LADDER SPLIT (CE-ruled 2026-07-15 — read this before touching 0075):
--   v1's §2 ordered slots(0074) -> convergence(0075). The L-7 renumbering flipped
--   it: convergence is 0077 at B1, slots are 0075 at B2. Applying migrations
--   backwards against their numbers is a wound LD-8 should not be stretched to
--   bless, so the order is CORRECTED, not ratified: THIS migration carries the
--   bare `slot` column (structure only — no constraint, no index) so converged and
--   newly-created blocks write slot='full_day' from day one and NO NULL-SLOT ERA
--   EVER EXISTS. 0075 at B2 then owns: `ready_by`, the partial index, any slot
--   CHECK/constraint tightening, and a guarded idempotent backfill
--   (`set slot='full_day' where kind='blocked' and slot is null`) which is a no-op
--   if this migration did its job.
--
-- DESTRUCTIVE: this drops public.vendor_availability. Founder approval given BY
--   NAME (Dev, 2026-07-15). CSV export waived — the table is verified EMPTY, and
--   the waiver is CE-ratified explicitly, citing the BASELINE precedent
--   ("CSV exports waived as compliance theatre on empty tables", TDW_01 Phase C).
--   The waiver is NOT assumed: statement 1 below re-verifies emptiness AT RUN TIME
--   and aborts the whole migration if a single row exists.
-- ════════════════════════════════════════════════════════════════════

-- ── STATEMENT 1 — the zero-row assert. SELF-ENFORCING. ──────────────────────
-- The audit read zero rows hours before this was written; a count from the past is
-- not a count at run time. If ANY row exists, this RAISEs and the transaction
-- aborts — statements 2 and 3 never run, nothing is dropped, and the export
-- happens first. The destructive law is enforced by the migration, not by memory.
do $$
declare n integer;
begin
  select count(*) into n from public.vendor_availability;
  if n > 0 then
    raise exception
      'ABORT 0077: public.vendor_availability holds % row(s). The CE-ratified CSV waiver covers an EMPTY table ONLY. Export the rows first, return to the CE for a data-preservation leg, and re-run. Nothing has been dropped.', n;
  end if;
  raise notice '0077: vendor_availability verified empty at run time (0 rows) — waiver conditions met.';
end $$;

-- ── STATEMENT 2 — the slot column (structure only). ─────────────────────────
-- Bare text column: NO check constraint, NO index. 0075 (B2) owns the constraint
-- tightening and the partial index. `if not exists` so a re-run is harmless.
alter table public.events add column if not exists slot text;

comment on column public.events.slot is
  'Calendar slot: morning | noon | evening | full_day. Added bare by 0077 (B1) so converged blocks carry full_day from day one; CHECK constraint + partial index land in 0075 (B2). TDW_04.';

-- ── STATEMENT 3 — retire the parallel store. ────────────────────────────────
-- Availability now lives in public.events as kind='blocked' (C1). The blocks
-- table is unreferenced after this delivery: src/lib/vendor/availability.js reads
-- and writes events, and src/api/vendor/availability.js resolves ownership via
-- events (its DELETE door's auth previously read THIS table — see the B1
-- handover). Verified 2026-07-15: no Discover/couple reader exists anywhere
-- (exhaustive grep, re-verified at HEAD — the audit's B-2 holds).
drop table public.vendor_availability;

-- ── VERIFY (run after; expect exactly what each line says) ──────────────────
-- 1) the table is gone  -> expect 0 rows:
--    select table_name from information_schema.tables
--     where table_schema='public' and table_name='vendor_availability';
-- 2) the slot column exists -> expect 1 row, data_type 'text', is_nullable 'YES':
--    select column_name, data_type, is_nullable from information_schema.columns
--     where table_schema='public' and table_name='events' and column_name='slot';
