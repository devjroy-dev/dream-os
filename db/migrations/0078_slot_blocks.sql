-- REPO: devjroy-dev/dream-os  ·  db/migrations/0078_slot_blocks.sql
-- ════════════════════════════════════════════════════════════════════
-- Migration 0078 — per-SLOT blocking (TDW_04 Part B, surfaces sitting S2)
-- Date:    2026-07-17
-- Author:  TDW_04 executor session (B6 surfaces S2)
-- Ruling:  R-B6-17 (CE, recorded at the S1 seal, re-recorded at S2 open):
--            "one live block per (vendor_id, event_date, slot); full_day
--             EXCLUSIVE both directions, refused at the write path naming the
--             existing block."
--          + R-B6-26 (CE, S2 open): "the redundant events_vendor_date_blocked_idx
--            DROP rides INSIDE 0078's migration file — census §2 cited in the
--            header, the one-line recreate stated as the revert path; the
--            founder's run of 0078 after reading its header is the
--            destructive-action sign-off."
--          F-04.63's STOP (the per-slot migration, filed at B5, chartered here
--          and nowhere earlier by R-B6-2's own words) is discharged by this file.
--
-- PLANE (F-04.30 / F-04.31, standing law): targets public.events — THE CALENDAR.
--   engine.events is an unrelated agent audit trail and is never a calendar.
--   Every statement names `public.events` explicitly, per 0075/0076/0077's
--   discipline, so the question cannot arise.
--
-- WITNESSED COLUMNS (F-04.23/F-04.57's standing rule): public.events per
--   docs/db/PUBLIC_SCHEMA.md (16 columns incl. `slot text` with CHECK
--   events_slot_check in ('morning','noon','evening','full_day'), nullable).
--   Existing indexes per the same doc's constraints addendum, read WITH their
--   predicates: events_vendor_date_blocked_unique_idx UNIQUE (vendor_id,
--   event_date) WHERE kind='blocked' AND deleted_at IS NULL (0075 st.6b) and
--   events_vendor_date_blocked_idx (vendor_id, event_date) WHERE kind='blocked'
--   (0075 st.6a). Nothing below is inferred from prose.
--
-- ── WHAT THIS FILE DOES, IN ONE PARAGRAPH ───────────────────────────────
-- The day sheet's ratified actions are `Block morning/noon/evening/day` — four
-- toggles against a unique index that permits ONE live block per DATE. This file
-- moves the uniqueness key from (vendor_id, event_date) to (vendor_id,
-- event_date, slot): a vendor may hold a morning block AND an evening block on
-- one date. What the DATABASE enforces after this file: at most one live block
-- per (vendor, date, slot). What it deliberately does NOT enforce: full_day's
-- cross-slot exclusivity (a full_day block vs a morning block are DIFFERENT slot
-- values — no btree unique index can refuse the pair). That rule is R-B6-17's
-- "refused at the write path": it lives in eventWrite.js::findExistingBlock, the
-- one home every block write already routes through (blockDate -> writeEvent;
-- blockHands -> blockDate; there is no other block writer at HEAD — the WA door
-- makes no blocks, verified: recordPrimitives offers nine kinds, none 'blocked',
-- and chat.js's door erases an invented one). The residual race — one vendor
-- concurrently blocking full_day and a slot from two devices — is read-before-
-- write only, disclosed exactly as 0075 disclosed its own pre-index race. An
-- EXCLUDE-USING-gist constraint could close it at the cost of the btree_gist
-- extension; proposed to the CE in the ZIP's disclosure, NOT taken here.
--
-- ── DESTRUCTIVE ACTIONS IN THIS FILE (two index drops; standing law) ────
-- Nothing that holds DATA is dropped — both objects are INDEXES, rebuildable
-- from their one-line definitions below. No CSV export is owed (no rows are
-- touched); the founder's run after reading this header is the sign-off, per
-- R-B6-26's own mechanism.
--
--   DROP 1 — events_vendor_date_blocked_unique_idx (0075 statement 6b).
--     WHY IT MUST GO: it is UNIQUE on (vendor_id, event_date) for live blocks.
--     Left in place, the SECOND slot block on a date — the entire point of this
--     migration — dies 23505 against it. Its guarantee is not lost: statement 3
--     below recreates it WIDENED (slot joins the key), created BEFORE the drop
--     so no moment exists with no guarantee at all.
--     REVERT PATH (one line, the 0075 original):
--       create unique index events_vendor_date_blocked_unique_idx on public.events (vendor_id, event_date) where kind = 'blocked' and deleted_at is null;
--
--   DROP 2 — events_vendor_date_blocked_idx (0075 statement 6a) — R-B6-26's.
--     WHY: the S1 reader census, §2 (docs/specs/TDW_04_B6_S1_READER_CENSUS.md),
--     walked every read path and found NO code path names or depends on it;
--     every blocked-row read (listBlocks / liveRowsOn / blockedCheck) is covered
--     by the unique partial sibling with the tighter predicate. Redundant beside
--     its sibling; ruled dropped by R-B6-26.
--     REVERT PATH (one line, the 0075 original):
--       create index events_vendor_date_blocked_idx on public.events (vendor_id, event_date) where kind = 'blocked';
--
-- FOUNDER-RUN, Supabase SQL editor, protocol §6. Idempotent by construction —
-- a re-run is a no-op at every statement. No credentials appear in this file.
-- ════════════════════════════════════════════════════════════════════


-- ── STATEMENT 1 — PRE-FLIGHT ASSERTS. SELF-ENFORCING (0075/0077's method:
--    a count from the past is not a count at run time). Aborts having changed
--    nothing if either precondition moved. ─────────────────────────────────
do $$
declare
  n_dupe integer;
  n_null integer;
begin
  -- (a) gates STATEMENT 3. The widened UNIQUE index cannot be built over
  --     duplicate (vendor_id, event_date, slot) live-block triples. Today's
  --     narrower index makes duplicates impossible in the common case, but
  --     "impossible" is a claim — assert it.
  select count(*) into n_dupe from (
    select 1
    from public.events
    where kind = 'blocked' and deleted_at is null
    group by vendor_id, event_date, slot
    having count(*) > 1
  ) d;
  if n_dupe > 0 then
    raise exception
      'ABORT 0078: % (vendor_id, event_date, slot) triple(s) hold MORE THAN ONE live block. Statement 3''s UNIQUE index cannot be created over them. Nothing has been changed. Export the rows, return to the CE for a data-repair leg, then re-run.', n_dupe;
  end if;

  -- (b) gates STATEMENTS 2 and 3. A live block with slot NULL would ESCAPE the
  --     widened unique index entirely (NULL is never equal to NULL in a btree
  --     unique key) — a hole in the very guarantee this file exists to give.
  --     0075's backfill witnessed zero of these; 0077's bare-column design means
  --     none should exist; assert it AT RUN TIME anyway.
  select count(*) into n_null
  from public.events
  where kind = 'blocked' and deleted_at is null and slot is null;
  if n_null > 0 then
    raise exception
      'ABORT 0078: % live block(s) carry slot NULL and would escape the per-slot unique guarantee. Nothing has been changed. Run 0075 statement 4''s backfill shape (set slot=''full_day'' where kind=''blocked'' and slot is null), verify, then re-run this file.', n_null;
  end if;

  raise notice '0078: pre-flight clean at run time — 0 duplicate live-block triples, 0 null-slot live blocks. Proceeding.';
end $$;


-- ── STATEMENT 2 — blocks always carry a slot (the guarantee's closing brick) ─
-- A CHECK so the null-slot hole statement 1(b) asserts empty can never refill:
-- every block row must name its slot. Non-blocks are untouched (slot stays
-- nullable for them — an appointment with no time is timeline-only, P3's rule,
-- unchanged). Guarded: `add constraint` has no IF NOT EXISTS.
-- NOT NULL on the whole column was considered and refused: it would break the
-- lawful timeline-only NULL for appointments. This CHECK is the narrow truth.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_blocked_slot_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_blocked_slot_check
      check (kind <> 'blocked' or slot is not null);
    raise notice '0078: events_blocked_slot_check added.';
  else
    raise notice '0078: events_blocked_slot_check already present — skipped.';
  end if;
end $$;


-- ── STATEMENT 3 — the WIDENED unique guarantee (R-B6-17's ruled shape).
--    Created BEFORE the old index drops: no window with no guarantee. ───────
-- One live block per (vendor_id, event_date, slot). The 23505 an insert takes
-- against this index is translated to ALREADY_BLOCKED by eventWrite's existing
-- race-path handler — same code, same wire, wider key.
create unique index if not exists events_vendor_date_slot_blocked_unique_idx
  on public.events (vendor_id, event_date, slot)
  where kind = 'blocked' and deleted_at is null;


-- ── STATEMENT 4 — DROP 1 (see header). The narrow unique index retires. ────
drop index if exists public.events_vendor_date_blocked_unique_idx;


-- ── STATEMENT 5 — DROP 2 (R-B6-26; census §2 cited in the header). ─────────
drop index if exists public.events_vendor_date_blocked_idx;


-- ════════════════════════════════════════════════════════════════════
-- VERIFY (run after; each line states exactly what to expect)
-- ════════════════════════════════════════════════════════════════════
-- 1) exactly ONE blocked-partial index remains, the widened unique -> expect 1 row:
--    events_vendor_date_slot_blocked_unique_idx | CREATE UNIQUE INDEX ... (vendor_id, event_date, slot) WHERE ...
--    select indexname, indexdef from pg_indexes
--     where schemaname='public' and tablename='events'
--       and indexname in ('events_vendor_date_blocked_idx',
--                         'events_vendor_date_blocked_unique_idx',
--                         'events_vendor_date_slot_blocked_unique_idx')
--     order by indexname;
--
-- 2) the CHECK exists -> expect 1 row naming kind <> 'blocked' OR slot IS NOT NULL
--    select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid='public.events'::regclass and conname='events_blocked_slot_check';
--
-- 3) blocks are whole -> expect blocked_null_slot = 0 (the other two counts are
--    a POPULATION read, recorded not predicted — §3.6's rule)
--    select count(*) filter (where kind='blocked' and slot is null and deleted_at is null) as blocked_null_slot,
--           count(*) filter (where kind='blocked' and deleted_at is null)                  as blocked_live_total,
--           count(*) filter (where kind='blocked')                                          as blocked_all_total
--      from public.events;
