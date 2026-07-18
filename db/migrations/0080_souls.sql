-- REPO: devjroy-dev/dream-os  ·  db/migrations/0080_souls.sql
-- ════════════════════════════════════════════════════════════════════
-- Migration 0080 — Advisor-mode toggle + concierge name (TDW_06 P6a, S-10)
-- Date:    2026-07-18
-- Author:  TDW_06 Advisor sitting executor session
-- Ruling:  A-1 (CE, this sitting, recorded verbatim in the sitting log):
--            "R-1 SITING: SHAPE (a) RULED. engine.agents.victor_mode text
--             NOT NULL default 'business' CHECK (victor_mode IN
--             ('business','advisor')). Shape (c) REFUSED (the CHECK rejects
--             every live row; the advisory/advisor homograph). Shape (b)
--             REFUSED on the cross-plane cost. … You now author 0080 ONCE:
--             the victor_mode statement + public.vendors.assistant_name text
--             (S-3's rung, consumed later by P3), in-file verify SELECTs,
--             revert fully commented per §9, founder-run."
--          The name `victor_mode` also discharges the read-first's drift 5
--          (three existing `mode` columns estate-wide: engine.agents.mode,
--          engine.conversations.mode, public.conversations.mode) — it dodges
--          all three by construction.
--
-- PRECEDENCE (A-1, ruled WITH the column — this sentence is sited here AND at
--   the loop.ts read seam in the engine ZIP that follows this migration's green):
--     mode='consult' rooms IGNORE victor_mode (inert — the dreamai consult
--     switch stays sovereign; consultantHarveySoul, no Donna, no tools).
--     mode='advisory' rooms are GOVERNED by victor_mode (the TDW vendor's
--     Business·Advisor toggle). No row is ever both: 'consult' is written only
--     by signup.ts:186; every TDW-provisioned vendor agent carries the
--     'advisory' default and is the sole population victor_mode governs.
--
-- PLANE (F-04.30/F-04.31, standing law): TWO planes are touched, each statement
--   schema-qualified so the question cannot arise.
--     · engine.agents  (ENGINE plane) — the agent substrate the engine reads.
--     · public.vendors (PUBLIC plane) — the product/vendor row.
--   The engine reads victor_mode directly from engine.agents at loop.ts:204's
--   own select (shape (a)'s whole point: zero cross-plane read, no new runTurn
--   arg). assistant_name lands on public.vendors now and is consumed later by
--   P3's Concierge (`vendors.assistant_name ?? 'Mira'`, S-3); it is inert until
--   then — this rung ships early per the spec's own migration table.
--
-- WITNESSED COLUMNS (F-04.23/F-04.57's standing rule; nothing below inferred
--   from prose):
--     · engine.agents — 10 columns per docs/db/ENGINE_SCHEMA.md, col 9 =
--       `mode text NOT NULL default 'advisory'::text` (no CHECK today). Neither
--       `victor_mode` nor any Business·Advisor column present. VERIFIED at
--       bcaa39e by command.
--     · public.vendors — 37 columns per docs/db/PUBLIC_SCHEMA.md:888 (CE-
--       corrected from the read-first's 45). No `assistant_name`, no `mode`,
--       no `victor_mode` present. VERIFIED at bcaa39e by command.
--
-- ── WHAT THIS FILE DOES, IN ONE PARAGRAPH ───────────────────────────────
-- Adds two columns. (1) engine.agents.victor_mode — the server-persisted
-- Business·Advisor toggle for TDW vendors, NOT NULL default 'business' with a
-- named CHECK restricting it to ('business','advisor'). Because it is a NEW
-- column with a default, every existing agent row is backfilled 'business' on
-- ADD and satisfies the CHECK immediately — this is exactly why shape (a) was
-- ruled over shape (c): shape (c)'s CHECK on the existing `mode` column would
-- have been rejected by every live row ('advisory'/'consult' ∉ the set). (2)
-- public.vendors.assistant_name — nullable text, the concierge name (null →
-- 'Mira' in P3's code, never here). No data is dropped or rewritten; no row is
-- touched beyond the default backfill the ADD performs.
--
-- ── DESTRUCTIVE ACTIONS IN THIS FILE ────────────────────────────────────
-- NONE in the forward run. Two column ADDs; nothing is dropped, nothing that
-- holds data is destroyed, no CSV export is owed. The REVERT block at the foot
-- of this file DOES drop the two columns (destructive — it would discard live
-- victor_mode toggles once the estate is using them); it is WITHHELD per §9's
-- conditional-withheld rule — fully commented, run only on a CE revert ruling,
-- and only after the founder's sign-off + a CSV/SQL export of the columns per
-- house law. It is NOT runnable as delivered.
--
-- FOUNDER-RUN, Supabase SQL editor, protocol §6. Idempotent by construction —
-- a re-run is a no-op at every statement. No credentials appear in this file.
-- ════════════════════════════════════════════════════════════════════


-- ── STATEMENT 1 — engine.agents.victor_mode (the toggle column). ──────────
-- ADD IF NOT EXISTS with a default backfills every existing row 'business';
-- the CHECK is added separately in STATEMENT 2 so it is ensured even if a prior
-- partial run left the column bare (0078's column+guarded-constraint method).
alter table engine.agents
  add column if not exists victor_mode text not null default 'business';


-- ── STATEMENT 2 — the named CHECK (business|advisor). Guarded on pg_constraint
--    so a re-run — or a run where STATEMENT 1 was a no-op — is safe. ─────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agents_victor_mode_check'
      and conrelid = 'engine.agents'::regclass
  ) then
    alter table engine.agents
      add constraint agents_victor_mode_check
      check (victor_mode in ('business', 'advisor'));
    raise notice '0080: agents_victor_mode_check added.';
  else
    raise notice '0080: agents_victor_mode_check already present — skipped.';
  end if;
end $$;


-- ── STATEMENT 3 — public.vendors.assistant_name (S-3's Mira rung; nullable).
--    Consumed later by P3; inert until then. null is the lawful 'Mira' state —
--    no default is set here, the fallback lives in P3's code, never in the DB. ─
alter table public.vendors
  add column if not exists assistant_name text;


-- ════════════════════════════════════════════════════════════════════
-- VERIFY (run after; each line states exactly what to expect)
-- ════════════════════════════════════════════════════════════════════
-- 1) victor_mode exists, NOT NULL, default 'business' -> expect exactly 1 row:
--    column_name=victor_mode | data_type=text | is_nullable=NO | column_default='business'::text
--    select column_name, data_type, is_nullable, column_default
--      from information_schema.columns
--     where table_schema='engine' and table_name='agents'
--       and column_name='victor_mode';
--
-- 2) the CHECK exists -> expect 1 row naming victor_mode IN ('business','advisor'):
--    select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid='engine.agents'::regclass and conname='agents_victor_mode_check';
--
-- 3) every existing agent backfilled to the default -> expect ONLY 'business'
--    rows (a population read, recorded not predicted for the count column):
--    select victor_mode, count(*) from engine.agents group by victor_mode order by victor_mode;
--
-- 4) assistant_name exists, nullable -> expect exactly 1 row:
--    column_name=assistant_name | data_type=text | is_nullable=YES
--    select column_name, data_type, is_nullable
--      from information_schema.columns
--     where table_schema='public' and table_name='vendors'
--       and column_name='assistant_name';


-- ════════════════════════════════════════════════════════════════════
-- REVERT — WITHHELD per §9 (conditional-withheld rule). DO NOT RUN unless the
--   CE rules a revert AND the founder has signed off + exported both columns
--   (destructive: discards live victor_mode toggles + any set assistant_name).
--   To revert, uncomment the three lines and run in the Supabase editor:
-- ════════════════════════════════════════════════════════════════════
--   alter table engine.agents  drop constraint if exists agents_victor_mode_check;
--   alter table engine.agents  drop column if exists victor_mode;
--   alter table public.vendors drop column if exists assistant_name;
