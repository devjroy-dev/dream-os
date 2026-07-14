-- 0072_draft_meta.sql — TDW_02 write-first drafts, typed plane.
-- AMENDED per TDW_02 Amendment One CE-3 (2026-07-14): LEADS ONLY. The spec's
-- original invoice half is retired — post-Phase-4 flip, invoices live on the
-- records plane (engine.records money-IN binders; completeness = read-time
-- missing_cells in P3). public.invoices holds minted numbered documents and
-- carries no draft state.
--
-- Sequencing (executor's recorded choice, spec P1.4): apply this BEFORE
-- deploying TDW_02 P1 code. The P1 code also degrades gracefully if the
-- column is absent (writes land without draft_meta, warn logged) — the
-- migration-first order is the intended path, the fallback is the floor.
--
-- Convention: draft_meta NULL = complete row.
--   Else {"missing":["field",...],"source":"victor|harvest","harvested":["field",...]}
-- Expected set for leads (src/engine/src/core/draftContracts.ts, twin lands P3):
--   name, phone, wedding_date, wedding_city, budget_max.

alter table public.leads add column if not exists draft_meta jsonb;

comment on column public.leads.draft_meta is
'NULL = complete. Else {"missing":["field",...],"source":"victor|harvest","harvested":["field",...]}';

create index if not exists leads_draft_idx
  on public.leads (vendor_id) where draft_meta is not null;
