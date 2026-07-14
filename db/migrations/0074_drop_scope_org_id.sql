-- 0074_drop_scope_org_id.sql — TDW_02 Amendment One ruling 9 (CE, 2026-07-14).
-- The scope_org_id verdict: DROP. The dream-engine org-scoping era's last residue —
-- six columns, all-NULL (audit Q4: zero rows beneath five; the sixth sat on
-- engine.compliance_deadlines, a ghost table), zero constraints anywhere
-- (audit G1: pg_constraint scan returned no rows).
--
-- Authored ONLY AFTER the ruling-8 ghost drops executed (founder run,
-- 2026-07-14, five DROPPED notices + five-null post-check are the record) so
-- this migration names only real tables. compliance_deadlines therefore does
-- not appear here — its column left with its table.
--
-- Guarded per column (ruling 9): `if exists` on both table and column, so a
-- re-run or a hygiene-side table drop landing first is harmless.
-- Apply via Supabase SQL editor; confirm with the query at the bottom.
-- 0073 remains reserved for TDW_02 P5 (llm config seed) — holes-harmless, LD-8.

alter table if exists engine.facts         drop column if exists scope_org_id;
alter table if exists engine.leads         drop column if exists scope_org_id;
alter table if exists engine.documents     drop column if exists scope_org_id;
alter table if exists engine.money_entries drop column if exists scope_org_id;
alter table if exists engine.open_loops    drop column if exists scope_org_id;

-- Confirmation (expect zero rows):
-- select table_name, column_name from information_schema.columns
-- where table_schema='engine' and column_name='scope_org_id';
