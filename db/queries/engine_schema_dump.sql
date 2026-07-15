-- ════════════════════════════════════════════════════════════════════
-- db/queries/engine_schema_dump.sql — THE ENGINE SCHEMA DUMP (READ-ONLY)
-- TDW_04 B0 (CE-ruled 2026-07-15) — F-04.22/F-04.23's structural cure.
-- REWRITTEN at B0's seal: the first version was ROW-SHAPED and silently truncated.
--
-- WHY THIS FILE EXISTS. The engine schema's 25 tables had NO documented DDL anywhere:
-- not in the ladder (db/migrations/ 0001-0074 is public-only), not in docs/SCHEMA.md
-- (whose `messages` table is public.messages — 17 columns, the WhatsApp shape — NOT
-- engine.messages, 6 columns). Two blocks running, an executor guessed a column name
-- from prose into founder-run SQL: `vendor_activity_log.detail` (truth `summary`, A4)
-- and `agent_snapshot.rebuilt_at` (truth: a KEY INSIDE the note jsonb — the table is
-- (agent_id, note, updated_at, created_at); B0). Same repeat-class defect, because the
-- reference did not exist.
--
-- WHY IT IS SHAPED LIKE THIS (F-04.29, learned the hard way 2026-07-15). The original
-- returned ONE ROW PER COLUMN — ~180 rows. The Supabase editor applies its toolbar row
-- cap ("Limit 100 rows") to the QUERY, so the result set was truncated to 99 rows BEFORE
-- export, cutting mid-table at donna_review_binder and dropping 12 tables — including
-- engine.messages and engine.records, the two the whole defect class was about. Export
-- does not bypass the cap; it exports the capped result. A reference that silently
-- returns a PARTIAL truth is the disease it was built to cure.
-- Cure: ONE ROW PER TABLE (25 rows), which fits under any cap the UI can impose.
--
-- THE STANDING RULE IT ENABLES (CE-ruled, binds every session including the one that
-- wrote it): founder-run SQL is written ONLY against witnessed column lists —
-- docs/db/ENGINE_SCHEMA.md, db/BASELINE.md, docs/SCHEMA.md — never against prose.
--
-- HOW TO USE: run in the Supabase SQL editor. **Confirm the result says 25 rows** — if
-- it says fewer, the cap bit again and the output MUST NOT be committed. Hand back the
-- output; the executor commits it verbatim as docs/db/ENGINE_SCHEMA.md under a header
-- naming it a witnessed prod snapshot and its date. Regenerated on demand by re-running
-- this file. NEVER hand-edited — a hand-edited snapshot is prose again.
--
-- READ-ONLY: one SELECT over information_schema. No DDL, no DML. Cannot mutate.
-- ════════════════════════════════════════════════════════════════════
select
  c.table_name,
  count(*)                                                as columns,
  string_agg(
    c.ordinal_position || '. ' || c.column_name || ' ' || c.data_type
    || case when c.is_nullable = 'NO' then ' NOT NULL' else '' end
    || case when coalesce(c.column_default, '') <> ''
            then ' default ' || c.column_default else '' end,
    E'\n' order by c.ordinal_position
  )                                                       as columns_detail
from information_schema.columns c
join information_schema.tables t
  on  t.table_schema = c.table_schema
  and t.table_name   = c.table_name
where c.table_schema = 'engine'
  and t.table_type   = 'BASE TABLE'
group by c.table_name
order by c.table_name;
-- Expect exactly 25 rows. A gap in ordinal_position is not an error: it is a dropped
-- column's fingerprint (e.g. documents jumps 8 -> 10 — that hole is 0074's scope_org_id).
