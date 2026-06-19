// glance.ts — "The Brief." The notes the operator has left for Harvey.
//
// Not arithmetic (Louis is long gone), and not a dedicated note column either. The Brief
// reads what Donna ALREADY writes — the `note` on each record, in her own working voice —
// and surfaces the last three she touched. The owner reaches Harvey's room, opens the
// folder on his desk, and finds the operator's notes to him: raw, current, hers. No new
// behaviour to learn, no second voice in the room — just the back-office desk, shown.
import { loadRecords } from './recordsView.js';

export interface BriefNote {
  client: string | null;
  note: string;
}
export interface GlanceResult {
  notes: BriefNote[];
}

export async function loadGlance(agentId: string): Promise<GlanceResult> {
  const rows = await loadRecords(agentId); // active, newest-updated first
  const notes: BriefNote[] = [];
  for (const r of rows) {
    const n = (r.note ?? '').trim();
    if (!n) continue;
    notes.push({ client: r.client, note: n });
    if (notes.length === 3) break;
  }
  return { notes };
}
