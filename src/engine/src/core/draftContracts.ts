// draftContracts.ts — TDW_02 draft expected-sets, engine (TS) side.
// TWIN: src/lib/draftContracts.js — the CommonJS mirror for the door + harvest,
// landing in P3/P4. Keep BOTH files <=40 lines so drift stays visible (spec P3).
// Landed at P1 because donna_lead writes draft_meta on insert/update.
//
// draft_meta convention (migration 0072, leads only per Amendment One CE-3):
//   NULL = complete row.
//   Else { missing: string[], source: 'victor'|'harvest', harvested?: string[] }.
// Invoice completeness lives on the records plane (missing_cells, read-time) —
// public.invoices carries no draft state.

export const LEAD_EXPECTED = ['name', 'phone', 'wedding_date', 'wedding_city', 'budget_max'] as const;

export type DraftMeta = { missing: string[]; source: 'victor' | 'harvest'; harvested?: string[] };

// The missing set for a lead-shaped row (null/undefined/'' count as absent).
export function leadMissing(row: Record<string, unknown>): string[] {
  return LEAD_EXPECTED.filter((f) => row[f] == null || row[f] === '');
}

// The draft_meta value for a write: null when complete (promotion to full row).
export function leadDraftMeta(row: Record<string, unknown>, source: 'victor' | 'harvest'): DraftMeta | null {
  const missing = leadMissing(row);
  return missing.length ? { missing, source } : null;
}
