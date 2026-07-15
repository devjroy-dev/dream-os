-- ════════════════════════════════════════════════════════════════════
-- db/queries/engine_schema_dump.sql — THE ENGINE SCHEMA DUMP (READ-ONLY)
-- TDW_04 B0 (CE-ruled 2026-07-15, F-04.22/F-04.23's structural cure).
--
-- WHY THIS FILE EXISTS. The engine schema's 25 tables had NO documented DDL
-- anywhere: not in the ladder (db/migrations/ 0001-0074 is public-only), not in
-- docs/SCHEMA.md (which documents the PUBLIC schema — its `messages` table is
-- public.messages, 17 columns, the WhatsApp shape, NOT engine.messages, 6 columns).
-- Two blocks running, an executor guessed a column name from prose into a
-- founder-run query: `vendor_activity_log.detail` (truth: `summary`, A4) and
-- `agent_snapshot.rebuilt_at` (truth: a KEY INSIDE the note JSON; the table is
-- (agent_id, note) — B0). Same repeat-class defect, because the reference did not
-- exist. This makes it exist.
--
-- THE STANDING RULE IT ENABLES (CE-ruled, binds every session including the one
-- that wrote it): founder-run SQL is written ONLY against witnessed column lists —
-- docs/db/ENGINE_SCHEMA.md, db/BASELINE.md, docs/SCHEMA.md — never against prose.
--
-- HOW TO USE: the founder runs this in the Supabase SQL editor and hands back the
-- output; the executor commits it verbatim as docs/db/ENGINE_SCHEMA.md with a header
-- naming it a witnessed prod snapshot and its date. Regenerated on demand by re-running
-- this file. NEVER hand-edited — a hand-edited snapshot is prose again.
--
-- READ-ONLY: one SELECT over information_schema. No DDL, no DML. Cannot mutate.
-- ════════════════════════════════════════════════════════════════════
select
  c.table_name,
  c.ordinal_position                                as pos,
  c.column_name,
  c.data_type,
  coalesce(c.character_maximum_length::text,
           c.numeric_precision::text, '')           as size,
  c.is_nullable,
  coalesce(c.column_default, '')                    as column_default
from information_schema.columns c
join information_schema.tables t
  on  t.table_schema = c.table_schema
  and t.table_name   = c.table_name
where c.table_schema = 'engine'
  and t.table_type   = 'BASE TABLE'
order by c.table_name, c.ordinal_position;
