// recordsView.ts — the read-only window the owner's shell loads from.
//
// The shell is a glance INTO what the chat already did (Bible: CRUD is a read-only
// window, never the way you work). It loads the owner's active records once on open
// and DERIVES its views client-side — the glance totals, the money truth-status list,
// the agenda, the board. The engine stays primitive: it returns rows, it does not
// compute the views. Values live in the table; meaning is derived where it's shown.
//
// Read-only: never mutates, never patches a snapshot. Active records only (hidden=false);
// archived ones are recovered through Harvey via donna_retrieve, not surfaced here.
//
// Trust posture matches /chat (service-role; the security pass that turns RLS on also
// verifies the session token here).
import { supabase } from './db.js';

const RECORDS_SELECT =
  'id, client, direction, amount, amount_received, amount_pending, payment_status, ' +
  'date, stage, note, doc_ref, phone, followup_on, followup_note, reason_for_action, ' +
  'created_at, updated_at';

export interface OwnerRecord {
  id: string;
  client: string | null;
  direction: 'in' | 'out' | null;
  amount: number | null;
  amount_received: number | null;
  amount_pending: number | null;
  payment_status: string | null;
  date: string | null;
  stage: string | null;
  note: string | null;
  doc_ref: string | null;
  phone: string | null;
  followup_on: string | null;
  followup_note: string | null;
  reason_for_action: string | null;
  created_at: string;
  updated_at: string;
}

export async function loadRecords(agentId: string): Promise<OwnerRecord[]> {
  const { data, error } = await supabase
    .from('records')
    .select(RECORDS_SELECT)
    .eq('agent_id', agentId)
    .eq('hidden', false)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OwnerRecord[];
}
