// cabinet.ts — the read-side bucketing engine.
//
// Universal `records` in, domain-grouped columns out. This is the engine behind the
// cabinet: it reads a field's manifest (the FORM layer, table domain_manifests;
// the inline Manifest shape below IS the canonical spec — the MANIFEST_SPEC.md
// document was never ported with the engine; code is truth, CE ruling 2026-07-14)
// and groups the owner's universal rows into the columns that
// manifest declares. The manifest decides the grouping; this engine only applies it.
//
// Cardinal discipline (Bible): READ-ONLY. Never mutates, never touches Donna, never
// patches a snapshot. Donna files universal cells + her free-form note exactly as
// before; nothing here is taught to her. The intelligence is entirely on the read side.
//
// Two guarantees (canon lives in this file), enforced here:
//   • FIRST MATCH WINS — columns are walked in order; a record lands in exactly one.
//   • NO HUSK — anything matching no column falls to the catch_all column and still
//     shows; a field with no manifest falls back to DEFAULT_MANIFEST (cards). Worst
//     case is "generic but complete", never "lost".
import { supabase } from './db.js';
import { resolveField } from './handbook.js';
import { loadRecords, OwnerRecord } from './recordsView.js';

// ── manifest shape (CANONICAL — the doc this once mirrored was never ported) ─────
type Tone = 'warm' | 'go' | 'cool';
interface MatchRule {
  stage_in?: string[];
  direction?: 'in' | 'out';
  payment_status_in?: string[];
  has?: string[];
  missing?: string[];
}
type Match = MatchRule | 'catch_all';
interface ColumnSpec {
  key: string;
  label: string;
  noun?: { singular: string; plural: string };
  match: Match;
}
export interface Manifest {
  field: string;
  type: 'vertical' | 'functional';
  default_skin: string;
  default_density?: string;
  record_noun?: { singular: string; plural: string };
  stages?: { word: string; tone: Tone }[];
  columns: ColumnSpec[];
  showroom?: Record<string, unknown>[]; // example rows shown when the agent has no real records
  lift?: { label: string; aliases: string[] }[];
  money?: { primary_amount: string; in_label: string; out_label: string };
}

// The fallback when a field has no manifest: the universal flat cabinet (cards).
// The solopreneurs_smb fallback, authored here — canonical. Generic but complete.
const DEFAULT_MANIFEST: Manifest = {
  field: 'solopreneurs_smb',
  type: 'vertical',
  default_skin: 'cards',
  record_noun: { singular: 'record', plural: 'records' },
  columns: [
    { key: 'clients', label: 'Clients', match: { stage_in: ['new', 'active', 'ongoing'] } },
    { key: 'work', label: 'Work', match: { stage_in: ['in progress', 'pending', 'done'] } },
    { key: 'money', label: 'Money', match: { has: ['payment_status'] } },
    { key: 'followups', label: 'Follow-ups', match: { has: ['followup_on'] } },
    { key: 'unfiled', label: 'Everything else', match: 'catch_all' },
  ],
  money: { primary_amount: 'amount', in_label: 'Received', out_label: 'Paid' },
};

// ── matching ────────────────────────────────────────────────────────────────────
// Case-insensitive, token/substring on free-text fields. All present clauses must be
// true (AND). 'catch_all' matches anything. Empty/null cells never satisfy a clause.
function has(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '';
}
function softIncludes(value: string | null | undefined, words: string[]): boolean {
  if (!has(value)) return false;
  const v = String(value).toLowerCase();
  return words.some((w) => {
    const t = w.toLowerCase().trim();
    return t.length > 0 && (v.includes(t) || t.includes(v));
  });
}
function matches(rec: OwnerRecord, m: Match): boolean {
  if (m === 'catch_all') return true;
  if (m.stage_in && !softIncludes(rec.stage, m.stage_in)) return false;
  if (m.direction && rec.direction !== m.direction) return false;
  if (m.payment_status_in && !softIncludes(rec.payment_status, m.payment_status_in)) return false;
  if (m.has && !m.has.every((cell) => has((rec as unknown as Record<string, unknown>)[cell]))) return false;
  if (m.missing && !m.missing.every((cell) => !has((rec as unknown as Record<string, unknown>)[cell]))) return false;
  return true;
}

// ── bucket: records -> columns (first match wins; every column returned, even empty) ─
export interface CabinetColumn {
  key: string;
  label: string;
  noun?: { singular: string; plural: string };
  count: number;
  records: OwnerRecord[];
}
export function bucket(records: OwnerRecord[], manifest: Manifest): CabinetColumn[] {
  const cols: CabinetColumn[] = manifest.columns.map((c) => ({
    key: c.key, label: c.label, noun: c.noun, count: 0, records: [],
  }));
  for (const rec of records) {
    const idx = manifest.columns.findIndex((c) => matches(rec, c.match));
    // findIndex is safe: a well-formed manifest ends in catch_all, so idx >= 0.
    // Defensive: if somehow nothing matched, drop into the last column (no husk).
    const target = idx >= 0 ? idx : cols.length - 1;
    cols[target].records.push(rec);
  }
  for (const c of cols) c.count = c.records.length;
  return cols;
}

// ── manifest fetch ────────────────────────────────────────────────────────────────
export async function loadManifest(field: string | null): Promise<Manifest | null> {
  if (!field) return null;
  const { data, error } = await supabase
    .from('domain_manifests')
    .select('manifest')
    .eq('field', field)
    .maybeSingle();
  if (error || !data) return null;
  return (data.manifest as Manifest) ?? null;
}

// ── the endpoint entry: agentId -> a fully-shaped Cabinet ───────────────────────────
export interface Cabinet {
  field: string;
  type: 'vertical' | 'functional';
  default_skin: string;
  skin: string; // agent override, else manifest default
  manifest_present: boolean;
  showroom: boolean; // true => columns hold authored example rows, not real records // false => DEFAULT_MANIFEST fallback was used
  columns: CabinetColumn[];
  stages: { word: string; tone: Tone }[];
  lift: { label: string; aliases: string[] }[];
  money: { primary_amount: string; in_label: string; out_label: string } | null;
}
export async function writeCabinetSkin(agentId: string, skin: string): Promise<void> {
  const allowed = ['workbench', 'cards', 'accounts'];
  if (!allowed.includes(skin)) throw new Error('invalid skin');
  const { error } = await supabase.from('agents').update({ cabinet_skin: skin }).eq('id', agentId);
  if (error) throw new Error(error.message);
}

export async function buildCabinet(agentId: string): Promise<Cabinet> {
  // Resolve the agent's field from its profession_preset (same mapping Harvey uses).
  const { data: agent } = await supabase
    .from('agents')
    .select('profession_preset, cabinet_skin')
    .eq('id', agentId)
    .maybeSingle();
  const field = resolveField(agent?.profession_preset ?? null);

  const found = await loadManifest(field);
  const manifest = found ?? DEFAULT_MANIFEST;
  const realRecords = await loadRecords(agentId);
  const isShowroom =
    realRecords.length === 0 &&
    Array.isArray(manifest.showroom) &&
    (manifest.showroom as unknown[]).length > 0;
  const source = isShowroom
    ? (manifest.showroom as unknown as OwnerRecord[])
    : realRecords;
  const columns = bucket(source, manifest);

  return {
    field: manifest.field,
    type: manifest.type,
    default_skin: manifest.default_skin,
    skin: ((agent as { cabinet_skin?: string | null } | null)?.cabinet_skin) ?? manifest.default_skin,
    manifest_present: !!found,
    showroom: isShowroom,
    columns,
    stages: manifest.stages ?? [],
    lift: manifest.lift ?? [],
    money: manifest.money ?? null,
  };
}
