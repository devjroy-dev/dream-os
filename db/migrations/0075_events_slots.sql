-- ════════════════════════════════════════════════════════════════════
-- Migration 0075 — calendar slots, ready_by, and the block guarantee
--                  (TDW_04 Part B, sitting B2)
-- Date:    2026-07-15
-- Author:  TDW_04 executor session (B2)
-- Ruling:  TDW_04_LEDGER_AND_CALENDAR_FINAL.md L-7 ("Part B's two reservations
--          shift to 0075 + 0076 with this dated note") + TDW_04_CALENDAR_FINAL.md
--          §2's reservation table (its 0074 row, renumbered by L-7) +
--          F-04.32's cure, CE-ratified 2026-07-15 (the UNIQUE partial index).
--
-- PLANE (F-04.30 / F-04.31, CE-ruled 2026-07-15):
--   Targets public.events — THE CALENDAR (15 cols at HEAD). engine.events is an
--   UNRELATED agent audit trail (8 cols: agent_id, actor, action, entity_type,
--   entity_id, summary, created_at) and is never a calendar. The plane is proven
--   by the client in scope, never by the table name (B1's ratified method). This
--   file names its schema explicitly on every statement so the question cannot
--   arise: `public.events`, always.
--
-- ════════════════════════════════════════════════════════════════════
-- LADDER SPLIT — THE OTHER HALF OF 0077's CROSS-NOTE (CE-ruled 2026-07-15)
-- ════════════════════════════════════════════════════════════════════
--   0077's header (:16-27) carries the first half and points here. This is its
--   answer, and the two headers are meant to be read as one note.
--
--   v1's §2 ordered slots(0074) -> convergence(0075). The L-7 renumbering
--   flipped it: convergence shipped as 0077 at B1; slots are 0075, here, at B2.
--   Applying migrations BACKWARDS against their own numbers is a wound LD-8
--   should not be stretched to bless — so the ORDER was corrected rather than
--   the numbers renamed (LD-8: applied numbers never rename).
--
--   The correction's mechanic: 0077 carried a BARE `slot text` column —
--   structure only, no constraint, no index — so that converged and newly
--   created blocks write slot='full_day' FROM DAY ONE and NO NULL-SLOT ERA EVER
--   EXISTS. This migration owns everything 0077 deliberately did not: `ready_by`,
--   the slot CHECK, the partial index, F-04.32's UNIQUE partial index, and the
--   guarded backfill.
--
--   THE CORRECTION PROVED ITSELF, TWICE. First at B1 (the first converged row
--   carried slot='full_day'). Second here: statement 4's backfill is a WITNESSED
--   no-op — see its header for the founder-run artifact. 0075 applies AFTER 0077
--   by number and by date. The ladder reads forward.
--
-- ════════════════════════════════════════════════════════════════════
-- WITNESSED COLUMNS (F-04.23's standing rule, binding every session including
--   this one: founder-run SQL is written ONLY against witnessed column lists —
--   docs/db/ENGINE_SCHEMA.md, db/BASELINE.md, docs/SCHEMA.md — NEVER against
--   prose. The rule exists because the same guessed-column defect shipped in two
--   consecutive blocks.)
--
--   public.events, per docs/SCHEMA.md:277-293 (14 columns: id, vendor_id,
--   couple_id, title, event_date, event_time, kind, linked_lead_id,
--   linked_binder_id, state, notes, created_at, updated_at, deleted_at) —
--   reconciles db/BASELINE.md's `events | 14`. PLUS `slot text`, added by 0077's
--   applied statement 2 (read from the migration file, not from a doc; SCHEMA.md
--   does not yet document it — that rider rides THIS ZIP per Q-B2-2).
--   Every column this file touches is on that list. Nothing is inferred.
--
-- NON-DESTRUCTIVE. Adds one column, one constraint, two indexes; updates zero
--   rows (statement 4 is a witnessed no-op). Nothing is dropped, nothing is
--   renamed. No sign-off under the destructive law is required, and none is
--   claimed here.
-- ════════════════════════════════════════════════════════════════════


-- ── STATEMENT 1 — PRE-FLIGHT ASSERTS. SELF-ENFORCING. ──────────────────────
--
-- 0077's precedent, followed deliberately: "a count from the past is not a count
-- at run time." A founder-run read cleared both of this migration's data-
-- dependent statements BEFORE it was authored (2026-07-15, prod
-- nvzkbagqxbysoeszxent/main, role postgres):
--     leg 1 — duplicate live blocks per (vendor_id, event_date):  0 rows
--     leg 2 — non-conforming non-null slot values:                0 rows
--
-- That read is a PLAN INPUT, not a proof this migration may lean on. It ran
-- while the Supabase status banner read "investigating a technical issue" — the
-- exact ambiguous state the proof-evidence law calls VOID, not weak. So this
-- migration does not trust it. It re-asserts both preconditions AT RUN TIME and
-- aborts the whole transaction if either moved. The gate is enforced by the
-- migration, not by memory, and not by a screenshot.
do $$
declare
  n_dupe integer;
  n_bad  integer;
  bad_vals text;
begin
  -- (a) gates STATEMENT 6. A UNIQUE index cannot be built over duplicate keys.
  --     F-04.32: B1's ALREADY_BLOCKED is a READ-BEFORE-WRITE and is racy BY
  --     DISCLOSURE (src/lib/vendor/availability.js:77-104). If that race ever
  --     landed, two live blocks share a (vendor_id, event_date) and statement 6
  --     fails. Better to fail HERE, loudly, having changed nothing.
  select count(*) into n_dupe from (
    select 1
    from public.events
    where kind = 'blocked' and deleted_at is null
    group by vendor_id, event_date
    having count(*) > 1
  ) d;
  if n_dupe > 0 then
    raise exception
      'ABORT 0075: % (vendor_id, event_date) pair(s) hold MORE THAN ONE live block. F-04.32''s UNIQUE partial index (statement 6) cannot be created over them. This is the disclosed read-before-write race having landed. Nothing has been changed. Export the rows, return to the CE for a data-repair leg, then re-run.', n_dupe;
  end if;

  -- (b) gates STATEMENT 5. A CHECK is validated against existing rows at ADD
  --     time. NULL passes (NULL IN (...) -> NULL -> not false -> accepted), so
  --     NULLs are statement 4's business, not this assert's. A non-NULL value
  --     outside the four would abort the ALTER halfway through the file.
  select count(*), coalesce(string_agg(distinct slot, ', '), '')
    into n_bad, bad_vals
  from public.events
  where slot is not null
    and slot not in ('morning', 'noon', 'evening', 'full_day');
  if n_bad > 0 then
    raise exception
      'ABORT 0075: % row(s) carry a slot value outside the C2 set — found: [%]. The CHECK (statement 5) cannot be added over them. Nothing has been changed. Repair or widen the ruling, then re-run.', n_bad, bad_vals;
  end if;

  raise notice '0075: pre-flight clean at run time — 0 duplicate live blocks, 0 non-conforming slot values. Proceeding.';
end $$;


-- ── STATEMENT 2 — events.ready_by ──────────────────────────────────────────
-- C3: delivery vendors (jeweller, designer) run on DEADLINES, not occupancy.
-- Their "date" IS the deadline. Nullable: function artists never set it.
-- `if not exists` so a re-run is harmless. Occupancy/clustering read this at B3;
-- nothing reads it today, and that is correct — the column lands with the
-- migration that owns it (L-7), not with its first consumer.
alter table public.events add column if not exists ready_by date;

comment on column public.events.ready_by is
  'Delivery-vendor deadline (C3). Nullable — function artists do not set it. Occupancy mode "delivery" files occupying kinds against this date and runs C9''s >3-in-7-days clustering advisory over it. Added by 0075 (TDW_04 B2).';


-- ── STATEMENT 3 — no-op placeholder retained for statement numbering ───────
-- (Intentionally empty. The numbering below matches the charter's §1.2 list so a
--  reviewer can read the ruling and this file side by side without arithmetic.)


-- ── STATEMENT 4 — the guarded, idempotent backfill. A WITNESSED NO-OP. ─────
--
-- The charter calls this "a no-op if B1 did its job; it exists to catch
-- stragglers." That was a PREDICTION. Here is the ARTIFACT — founder-run against
-- prod 2026-07-15, BEFORE this migration was authored (assert-the-artifact,
-- never a predicted count):
--
--     blocked_null_slot = 0  |  blocked_live_total = 4  |  blocked_all_total = 5
--
-- ZERO null-slot blocks. Every block in production carries its slot. 0077's bare
-- column did exactly what the CE's ladder correction said it would, and the
-- correction is now proven by an artifact rather than argued from a design.
--
-- This statement therefore changes NOTHING today. It ships anyway, and it is not
-- theatre: it is idempotent, it costs one scan of a partial-indexed predicate,
-- and it is the only thing standing between a NULL-slot block arriving from a
-- path nobody has written yet and a slot-derived calendar surface at B5 that
-- would silently fail to render it. A guard that fires zero times is a guard
-- that held.
update public.events
   set slot = 'full_day'
 where kind = 'blocked'
   and slot is null;


-- ── STATEMENT 5 — the slot CHECK (C2's boundaries, enforced) ───────────────
-- C2: morning (until 12:00) · noon (12:00-15:59) · evening (16:00 onwards) ·
-- plus full_day. Nullable BY DESIGN and the spec is literal about it
-- ("`events.slot text check (slot in (...)) ` nullable"): an APPOINTMENT with no
-- time carries slot NULL and is timeline-only (P3's derivation rule). NULL passes
-- this CHECK by SQL's own semantics — that is the intent, not an oversight.
--
-- `add constraint` has no IF NOT EXISTS in Postgres, so the guard is explicit —
-- a re-run must not error.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_slot_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_slot_check
      check (slot in ('morning', 'noon', 'evening', 'full_day'));
    raise notice '0075: events_slot_check added.';
  else
    raise notice '0075: events_slot_check already present — skipped.';
  end if;
end $$;

comment on column public.events.slot is
  'Calendar slot: morning | noon | evening | full_day. Added bare by 0077 (B1) so converged blocks carry full_day from day one; CHECK + indexes added by 0075 (B2). NULL is lawful and means timeline-only (an appointment with no time — P3''s derivation rule). TDW_04.';


-- ── STATEMENT 6a — the block lookup index (v1 §2's reservation) ────────────
-- The partial index the reservation table named. Serves availability.js's
-- read-before-write guard, listBlocks' range scans, and B5's grid.
create index if not exists events_vendor_date_blocked_idx
  on public.events (vendor_id, event_date)
  where kind = 'blocked';


-- ── STATEMENT 6b — F-04.32's CURE. THE ONE THAT MATTERS. ──────────────────
--
-- WHAT WAS LOST. public.vendor_availability carried `unique (vendor_id,
-- blocked_date)`. A duplicate insert raised 23505 and the door turned it into
-- 409 ALREADY_BLOCKED — ATOMICALLY. That constraint DIED WITH THE TABLE at 0077.
-- B1 shipped a read-before-write emulation, disclosed it inside its own diff,
-- and routed the cure here. The wire held (409 witnessed in prod); the GUARANTEE
-- did not.
--
-- WHY NOT A NAIVE UNIQUE. `unique (vendor_id, event_date)` would be a disaster —
-- a vendor legitimately has many events on one date (a shoot AND a recce AND a
-- call). The predicate is what makes uniqueness correct: it applies ONLY to
-- blocks, and ONLY to live ones.
--
-- WHY `deleted_at is null` IS LOAD-BEARING, NOT DECORATION. Unblock is a SOFT
-- delete (Q-B1-7's covenant, availability.js:36-40). Production holds 5 blocks
-- of which 4 are live — one soft-deleted block exists RIGHT NOW (founder-run,
-- 2026-07-15). Without this clause that dead row would permanently poison its
-- (vendor, date) against ever being blocked again, and unblock-then-re-block —
-- witnessed passing in B1's own smoke — would start failing 23505.
--
-- AFTER THIS INDEX: two concurrent blocks on one date cannot both land. The
-- loser gets 23505. Note honestly what this does NOT do: availability.js's door
-- still returns its 409 from the read-before-write, and a 23505 escaping the
-- insert is not yet translated to ALREADY_BLOCKED. The RACE is closed here (the
-- database now refuses the second row); the door's 23505->409 translation is
-- eventWrite's to own when blockDate becomes a thin caller. The guarantee is
-- restored at the layer that can actually keep it.
create unique index if not exists events_vendor_date_blocked_unique_idx
  on public.events (vendor_id, event_date)
  where kind = 'blocked' and deleted_at is null;


-- ════════════════════════════════════════════════════════════════════
-- VERIFY (run after; each line states exactly what to expect)
-- ════════════════════════════════════════════════════════════════════
-- 1) ready_by exists -> expect 1 row: ready_by | date | YES
--    select column_name, data_type, is_nullable from information_schema.columns
--     where table_schema='public' and table_name='events' and column_name='ready_by';
--
-- 2) the CHECK exists -> expect 1 row naming the four values
--    select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid='public.events'::regclass and conname='events_slot_check';
--
-- 3) both indexes exist -> expect EXACTLY 2 rows
--    select indexname, indexdef from pg_indexes
--     where schemaname='public' and tablename='events'
--       and indexname in ('events_vendor_date_blocked_idx',
--                         'events_vendor_date_blocked_unique_idx')
--     order by indexname;
--
-- 4) the backfill changed nothing and blocks are whole -> expect 0 | 4 | 5
--    (matching the pre-write read exactly; a MOVED count is not a failure, it is
--     a POPULATION change to be listed row by row, never inferred — §3.6)
--    select count(*) filter (where kind='blocked' and slot is null)      as blocked_null_slot,
--           count(*) filter (where kind='blocked' and deleted_at is null) as blocked_live_total,
--           count(*) filter (where kind='blocked')                        as blocked_all_total
--      from public.events;
