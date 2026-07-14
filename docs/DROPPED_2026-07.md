# DROPPED — 2026-07 (Block TDW_01, Chief Engineer record)
**Constraints (engine.orgs cluster — dead objects on live tables; referenced table empty, all FK values NULL):**
compliance_deadlines_scope_org_id_fkey · documents_scope_org_id_fkey · facts_scope_org_id_fkey · leads_scope_org_id_fkey · money_entries_scope_org_id_fkey · open_loops_scope_org_id_fkey · org_members_org_id_fkey

**Tables:** engine.org_members, engine.orgs (dream-engine advisory-era scoping; concept unused) · cover_photos (superseded by landing_slides; backend never built; orphaned admin page deleted this block) · pending_actions (0002-era) · demo_muse_pool, demo_profile_views (demo-era) · binder_events (0068 — expected already absent; archived migration notes it)

**Residue — RESOLVED (TDW_02 audit, 2026-07-14):** the "~4 further candidates" were in fact FIVE engine tables that TDW_01's drop run recorded as executed but never dropped (Amendment One D12/D13): engine.compliance_deadlines, engine.agent_modules, engine.briefing_schedule, engine.briefing_sessions, engine.reconciliations. **Dropped 2026-07-14 via TDW02_GHOST_DROPS** (TDW_01 reopener, Amendment One ruling 8) — guarded per-table, each re-verified empty at run time; founder's five DROPPED notices + five-null post-check are the record. db/BASELINE.md carries the corrected drop history.

**Retained by column, ruled to TDW_02 — RESOLVED:** scope_org_id on facts, leads, documents, money_entries, open_loops — verdict DROP (Amendment One ruling 9), executed as migration 0074 (2026-07-14); compliance_deadlines' column left with its table above.
**SQL notices + final table count:** recorded in the founder's run output (handover thread).
