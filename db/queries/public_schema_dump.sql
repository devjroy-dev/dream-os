-- REPO: devjroy-dev/dream-os  ·  db/queries/public_schema_dump.sql
-- ════════════════════════════════════════════════════════════════════
-- THE PUBLIC SCHEMA DUMP (READ-ONLY) — the twin of engine_schema_dump.sql
-- TDW_04 Part B, SPINE sitting. CE-ruled 2026-07-16 (Q-SP-3): F-04.57's cure,
-- rides ZIP B's FRONT — "eight columns get read from a witnessed list or not at all."
--
-- ── WHY THIS FILE EXISTS. F-04.57. ──────────────────────────────────────
--
-- The masterplan records the blind-SQL class as "dead structurally" on
-- ENGINE_SCHEMA.md's arrival at B0. IT IS HALF-DEAD, and the spine sitting proved
-- it by needing the other half:
--
--   · docs/db/ENGINE_SCHEMA.md — the `engine` schema ONLY. 25 tables, 242 columns.
--     Witnessed, exact, and it does not contain public.vendors, public.events or
--     public.leads.
--   · db/BASELINE.md           — table -> column COUNT ("vendors | 36"). NO NAMES.
--   · docs/SCHEMA.md:5         — "Latest migration applied: 0064 (2026-05-30)".
--     STALE: the ladder is at 0077, applied.
--
-- So 0076_capacity was written against public.vendors with NO witnessed column
-- list. It landed clean — it named exactly ONE column, CREATED rather than read
-- it, guarded with `if not exists`, and proved itself by information_schema.
-- THAT MITIGATION DOES NOT GENERALISE. The occupancy checker reads public.events
-- on EVERY call — event_date, slot, kind, state, deleted_at, vendor_id,
-- linked_binder_id, ready_by — EIGHT columns, horizon-blind, directly, by ruling.
-- Writing those from SCHEMA.md's prose is the exact posture the B3 handoff's §0.1
-- calls the disease wearing the cure's uniform.
--
-- The engine twin's own header names the two specimens that built it:
-- `vendor_activity_log.detail` (truth: `summary`) and `agent_snapshot.rebuilt_at`
-- (truth: a KEY INSIDE the note jsonb). Both were column names guessed from prose
-- into founder-run SQL. BOTH OF THOSE TABLES LIVE ON THE PLANE THIS FILE COVERS —
-- vendor_activity_log is public. The cure was built on the engine plane and the
-- specimens were on this one.
--
-- ── WHY IT IS SHAPED LIKE THIS (F-04.29, learned the hard way at B0) ─────
--
-- ONE ROW PER TABLE, never one row per column. The engine dump's first version was
-- row-per-column (~180 rows); the Supabase editor applies its toolbar row cap
-- ("Limit 100 rows") to the QUERY, so the result was truncated to 99 rows BEFORE
-- export — cutting mid-table and dropping 12 tables, including the two the whole
-- defect class was about. Export does not bypass the cap; it exports the capped
-- result. A reference that silently returns a PARTIAL truth is the disease it was
-- built to cure.
--
-- ── HOW THIS TWIN DEPARTS FROM ITS ORIGINAL, DELIBERATELY (disclosed) ────
--
-- The engine dump hardcodes its guard: "Confirm the result says 25 rows." THIS FILE
-- CANNOT DO THAT AND MUST NOT PRETEND TO. The public table count is exactly the
-- fact this file exists to establish, and every number available to the executor is
-- stale or wrong for the job:
--   · BASELINE.md:57 says "public schema — 58 tables" — generated 2026-07-14, and
--     0077 has since DROPPED public.vendor_availability (applied at the B1 seal).
--     So the true count is probably 57 — and "probably" is not a guard.
-- Hardcoding a stale 58 would be an executor asserting a document's number into
-- founder-run SQL: F-04.57's own disease, inside F-04.57's cure.
--
-- SO THE GUARD COMPUTES ITSELF. Column 1 of EVERY row is `tables_expected` — a
-- scalar subquery counting public's BASE TABLEs. It is computed by the database,
-- not by the executor, and a scalar subquery CANNOT be capped.
--
--     IF the number of rows returned  ==  tables_expected  ->  COMPLETE. Hand it back.
--     IF the number of rows returned  <   tables_expected  ->  THE CAP BIT.
--                                                              DO NOT COMMIT THE OUTPUT.
--
-- Nobody has to remember a number, and the file cannot go stale the way a
-- hardcoded 25 can. If public ever grows past the editor's cap, this guard SAYS SO
-- instead of silently lying — which is the only property that matters here.
--
-- ── HOW TO USE ──────────────────────────────────────────────────────────
--
-- 1. Run in the Supabase SQL editor (founder). It is ONE statement, so the editor's
--    single result pane shows it whole.
-- 2. CHECK THE GUARD: does the row count equal `tables_expected`? If not, STOP —
--    raise the editor's Limit and re-run. Do not hand back a capped result.
-- 3. Hand the output back. The executor commits it as docs/db/PUBLIC_SCHEMA.md
--    under a header naming it a witnessed prod snapshot with its date, project and
--    role — the ENGINE_SCHEMA.md header's shape exactly.
-- 4. NEVER HAND-EDITED. A hand-edited snapshot is prose again, and prose is what
--    this file exists to kill. Regenerate on demand by re-running this file.
--
-- SCOPE, stated so the next reader does not misread the silence: BASE TABLEs only,
-- exactly as the engine twin does. Views are deliberately absent. The occupancy
-- checker reads the TABLE by ruling, never a surface's view (F-04.47,
-- horizon-blind by construction), so tables are the plane this reference must
-- cover. If a future session needs the view list, that is its own query and its own
-- ruling — not a silent widening of this one.
--
-- READ-ONLY: one SELECT over information_schema. No DDL, no DML. It cannot mutate
-- anything. No credentials appear in this file and none are needed — it runs inside
-- an authenticated editor session (standing security rule: founder-run recipes never
-- echo live credentials into transcripts).
-- ════════════════════════════════════════════════════════════════════
select
  -- THE SELF-COMPUTING GUARD. A scalar subquery: one value, evaluated by the
  -- database, repeated on every row, and structurally immune to the row cap that
  -- truncates the result set around it. Compare it to the row count. They must match.
  (select count(*)
     from information_schema.tables
    where table_schema = 'public'
      and table_type   = 'BASE TABLE')                     as tables_expected,
  c.table_name,
  count(*)                                                 as columns,
  string_agg(
    c.ordinal_position || '. ' || c.column_name || ' ' || c.data_type
    || case when c.is_nullable = 'NO' then ' NOT NULL' else '' end
    || case when coalesce(c.column_default, '') <> ''
            then ' default ' || c.column_default else '' end,
    E'\n' order by c.ordinal_position
  )                                                        as columns_detail
from information_schema.columns c
join information_schema.tables t
  on  t.table_schema = c.table_schema
  and t.table_name   = c.table_name
where c.table_schema = 'public'
  and t.table_type   = 'BASE TABLE'
group by c.table_name
order by c.table_name;
-- A gap in ordinal_position is NOT an error: it is a dropped column's fingerprint
-- (the engine twin's example — documents jumps 8 -> 10, and that hole is 0074's
-- scope_org_id). Expect one such hole in public.vendors' neighbourhood too: 0074
-- dropped scope_org_id across the estate.
--
-- EXPECTED, at the time of writing (2026-07-16, dream-os 674ac6c) — stated as a
-- PREDICTION TO BE FALSIFIED BY THE GUARD, never as a number to trust:
--   · tables_expected is expected to read 57 — BASELINE.md:57's 58, minus
--     public.vendor_availability, which 0077 dropped at the B1 seal. IF IT READS
--     ANYTHING ELSE, THE GUARD IS RIGHT AND THIS COMMENT IS WRONG. Believe the
--     database. Tell the executor, who will record the delta as a finding rather
--     than quietly adjust this line.
--   · public.vendors is expected to carry 37 columns — BASELINE.md's 36, plus
--     slot_capacity, which 0076 added this sitting and which the founder's own
--     information_schema proof witnessed on 2026-07-16.
