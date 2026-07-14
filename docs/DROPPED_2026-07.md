# DROPPED — 2026-07 (Block TDW_01, Chief Engineer record)
**Constraints (engine.orgs cluster — dead objects on live tables; referenced table empty, all FK values NULL):**
compliance_deadlines_scope_org_id_fkey · documents_scope_org_id_fkey · facts_scope_org_id_fkey · leads_scope_org_id_fkey · money_entries_scope_org_id_fkey · open_loops_scope_org_id_fkey · org_members_org_id_fkey

**Tables:** engine.org_members, engine.orgs (dream-engine advisory-era scoping; concept unused) · cover_photos (superseded by landing_slides; backend never built; orphaned admin page deleted this block) · pending_actions (0002-era) · demo_muse_pool, demo_profile_views (demo-era) · binder_events (0068 — expected already absent; archived migration notes it)

**Residue (owned, assigned):** the prod inventory held ~4 further zero-row, zero-referenced candidates whose names live only in that inventory. Harmless as-is; TDW_02's audit-first sitting (protocol §3.5) sweeps them with the inventory in hand, under the standing guarded-drop pattern.

**Retained by column, ruled to TDW_02:** scope_org_id on facts, leads, documents, money_entries, open_loops, compliance_deadlines — all-NULL, unconstrained.
**SQL notices + final table count:** recorded in the founder's run output (handover thread).
