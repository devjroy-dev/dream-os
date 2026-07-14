// draftContracts.js — TDW_02 draft expected-sets, door (CommonJS) side.
// TWIN: src/engine/src/core/draftContracts.ts — the engine (TS) mirror,
// landed at P1. Keep BOTH files <=40 lines so drift stays visible (spec P3).
// Imported by the typed CRUD doors (lib/vendor/leads.js) and P4's harvest.
//
// draft_meta convention (migration 0072, leads only per Amendment One CE-3):
//   NULL = complete row.
//   Else { missing: string[], source: 'victor'|'harvest'|'owner', harvested?: string[] }.
// Invoice completeness lives on the records plane (read-time) —
// public.invoices carries no draft state.
'use strict';

const LEAD_EXPECTED = ['name', 'phone', 'wedding_date', 'wedding_city', 'budget_max'];

// The missing set for a lead-shaped row (null/undefined/'' count as absent).
function leadMissing(row) {
  return LEAD_EXPECTED.filter((f) => row[f] == null || row[f] === '');
}

// The draft_meta value for a write: null when complete (promotion to full row).
function leadDraftMeta(row, source) {
  const missing = leadMissing(row);
  return missing.length ? { missing, source } : null;
}

module.exports = { LEAD_EXPECTED, leadMissing, leadDraftMeta };
