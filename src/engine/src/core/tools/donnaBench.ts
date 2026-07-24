// donnaBench.ts — two more of Donna's hands, both READS: the calculator and the ledger.
//
// donna_tally — the calculator hand. Arithmetic belongs in the tool, judgment in
// Donna: she names the slice (a client, a stage, a direction, a date range) and the
// tool COMPUTES the totals deterministically — count, money in, money out, received,
// pending — and shows her exactly which rows went into the sum, ids included, so the
// aggregate is auditable, never an impression. Rows that carry no amount are counted
// and declared, not silently skipped: a tally that hides what it skipped is false
// certainty wearing math.
//
// donna_history — the provenance hand. One binder's whole story: every filled cell,
// the diary (reason_for_action, in full — her own trail of why), the timestamps, and
// the event log of every confirmed write that ever touched it. This is "how do you
// know that" made reachable: when Harvey is asked to show his sources, this is the
// hand that opens the binder's spine.
//
// Both are READS: they never mutate, never patch the snapshot.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome, ViewRow } from '../snapshotTypes.js';
import { arrivalStamp } from '../today.js'; // TDW_06 M-1 (P1 + F-06.27): the estate's ONE arrival derivation

// TDW_06 M-1. THE ZONE, AND WHY IT IS A CONSTANT HERE AND NOT THE OWNER'S FIELD.
// loop.ts:384 renders the clock from `agent.timezone` because the loop already holds
// the agent row (:230). A tool does not — it is handed an agentId and nothing else,
// and buying the owner's zone would cost a query on every hand. The estate's shipped
// precedent for exactly this position is consultAccess.ts:14 (`const IST =
// 'Asia/Kolkata'`), and it is followed rather than invented. DISCLOSED, NOT HIDDEN:
// if a non-IST owner ever lands, these stamps render in IST while the clock line
// renders in his zone — a divergence with no live subject today (the estate is
// India-only) whose real cure is threading the owner's zone to the tool layer, a
// wider change than M-1 charters. Named here so nobody re-derives it as a surprise.
const IST = 'Asia/Kolkata';

export const DONNA_TALLY_TOOL: Anthropic.Tool = {
  name: 'donna_tally',
  description:
    "Have the totals COMPUTED over a slice of the cabinet — never sum in your head; this hand does the arithmetic exactly. Name the slice with any of: a term (matched across client/note/doc/phone, like your find), a stage, a direction (in/out), a date range. It returns the count and the computed totals — money in, money out, received, pending — AND lists the rows that went into the sum with their binder ids, so you can see exactly what was counted. Rows in the slice that carry no amount are declared (counted as records, excluded from money totals) — nothing is silently skipped. Archived records are excluded unless you ask for them. Use it whenever Harvey needs a number over more than one binder: how much has X paid in total, what's outstanding this month, how much went out on vendors.",
  input_schema: {
    type: 'object',
    properties: {
      term: { type: 'string', description: 'A name/company/word to slice by — matched (case-insensitive) across client, note, doc and phone, like your find.' },
      stage: { type: 'string', description: 'Only records at this stage.' },
      direction: { type: 'string', enum: ['in', 'out'], description: 'Only money in this direction.' },
      date_from: { type: 'string', description: 'Only records dated on/after this (YYYY-MM-DD).' },
      date_to: { type: 'string', description: 'Only records dated on/before this (YYYY-MM-DD).' },
      include_hidden: { type: 'boolean', description: 'Also count archived (set-aside) records. Default false.' },
    },
  },
};

export const DONNA_HISTORY_TOOL: Anthropic.Tool = {
  name: 'donna_history',
  description:
    "Open one binder's whole story — every filled cell as it stands now, your own diary on it (every reason-for-action line, in order), when it was created and last touched, whether it is set aside, and the log of every confirmed write that ever touched it, dated. This is the hand for 'how do you know that': when a fact needs its provenance — when it was filed, what changed and when — this shows the binder's spine. Needs binder_id (your find gives you ids).",
  input_schema: {
    type: 'object',
    properties: {
      binder_id: { type: 'string', description: 'The record whose story to open.' },
    },
    required: ['binder_id'],
  },
};

export const BENCH_READ_TOOLS: Anthropic.Tool[] = [DONNA_TALLY_TOOL, DONNA_HISTORY_TOOL];
export const BENCH_READ_NAMES = new Set<string>(BENCH_READ_TOOLS.map((t) => t.name));

type TallyRow = {
  id: string; client: string | null; amount: number | null; direction: string | null;
  amount_received: number | null; amount_pending: number | null; payment_status: string | null;
  date: string | null; stage: string | null; note: string | null; doc_ref: string | null;
  phone: string | null; hidden: boolean | null;
};

const TALLY_SELECT = 'id, client, amount, direction, amount_received, amount_pending, payment_status, date, stage, note, doc_ref, phone, hidden';
const TALLY_FETCH_LIMIT = 500; // computation cap, declared in the result if hit
const TALLY_LIST_LIMIT = 15;   // rows itemized in the display; the rest summarized

function toViewRow(r: TallyRow): ViewRow {
  return {
    id: r.id, client: r.client, direction: r.direction, amount: r.amount,
    amount_received: r.amount_received, amount_pending: r.amount_pending,
    payment_status: r.payment_status, date: r.date, stage: r.stage,
    note: r.note, doc_ref: r.doc_ref, phone: r.phone, hidden: r.hidden ?? false,
  };
}

export async function executeTally(agentId: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  const term = typeof input.term === 'string' ? input.term.trim() : '';
  const stage = typeof input.stage === 'string' ? input.stage.trim() : '';
  const direction = input.direction === 'in' || input.direction === 'out' ? input.direction : '';
  const dateFrom = typeof input.date_from === 'string' ? input.date_from.trim() : '';
  const dateTo = typeof input.date_to === 'string' ? input.date_to.trim() : '';
  const includeHidden = input.include_hidden === true;

  let q = supabase.from('records').select(TALLY_SELECT).eq('agent_id', agentId).limit(TALLY_FETCH_LIMIT);
  if (!includeHidden) q = q.eq('hidden', false);
  if (term) {
    const esc = term.replace(/[%_,]/g, ' ').trim();
    if (esc) q = q.or(`client.ilike.%${esc}%,note.ilike.%${esc}%,doc_ref.ilike.%${esc}%,phone.ilike.%${esc}%`);
  }
  if (stage) q = q.ilike('stage', stage);
  if (direction) q = q.eq('direction', direction);
  if (dateFrom) q = q.gte('date', dateFrom);
  if (dateTo) q = q.lte('date', dateTo);

  const { data, error } = await q;
  if (error) return { display: `ERROR tallying: ${error.message}` };
  const rows = (data ?? []) as TallyRow[];

  // The computation — deterministic, in code, never in the model's head.
  let sumIn = 0, sumOut = 0, sumReceived = 0, sumPending = 0;
  let withAmount = 0, withoutAmount = 0;
  for (const r of rows) {
    if (r.amount != null) {
      withAmount++;
      if (r.direction === 'out') sumOut += r.amount; else sumIn += r.amount;
    } else {
      withoutAmount++;
    }
    if (r.amount_received != null) sumReceived += r.amount_received;
    if (r.amount_pending != null) sumPending += r.amount_pending;
  }

  const sliceBits: string[] = [];
  if (term) sliceBits.push(`term "${term}"`);
  if (stage) sliceBits.push(`stage ${stage}`);
  if (direction) sliceBits.push(`direction ${direction}`);
  if (dateFrom || dateTo) sliceBits.push(`dated ${dateFrom || '…'}→${dateTo || '…'}`);
  if (includeHidden) sliceBits.push('archived included');
  const slice = sliceBits.length ? sliceBits.join(', ') : 'whole cabinet';

  const lines: string[] = [];
  lines.push(`TALLY (${slice}) — computed over ${rows.length} record${rows.length === 1 ? '' : 's'}:`);
  lines.push(`  money in: Rs ${sumIn} · money out: Rs ${sumOut} · received: Rs ${sumReceived} · pending: Rs ${sumPending}`);
  if (withoutAmount > 0) lines.push(`  note: ${withoutAmount} record${withoutAmount === 1 ? '' : 's'} in this slice carry no amount — counted above, excluded from money totals.`);
  if (rows.length >= TALLY_FETCH_LIMIT) lines.push(`  note: computation capped at ${TALLY_FETCH_LIMIT} rows — narrow the slice for an exact total.`);
  const listed = rows.slice(0, TALLY_LIST_LIMIT);
  for (const r of listed) {
    const bits: string[] = [];
    if (r.client) bits.push(r.client);
    if (r.amount != null) bits.push(`Rs ${r.amount}${r.direction ? ' ' + r.direction : ''}`);
    if (r.amount_received != null) bits.push(`recv Rs ${r.amount_received}`);
    if (r.amount_pending != null) bits.push(`pend Rs ${r.amount_pending}`);
    if (r.date) bits.push(r.date);
    if (r.hidden) bits.push('[ARCHIVED]');
    lines.push(`  - ${r.id} — ${bits.join(' · ') || 'record'}`);
  }
  if (rows.length > TALLY_LIST_LIMIT) lines.push(`  …and ${rows.length - TALLY_LIST_LIMIT} more in the count.`);
  if (rows.length === 0) lines.push('  No records match this slice.');

  return { display: lines.join('\n'), found: rows.length ? rows.map(toViewRow) : undefined };
}

type EventRow = { action: string | null; summary: string | null; created_at: string };

export async function executeHistory(agentId: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  const binderId = typeof input.binder_id === 'string' ? input.binder_id.trim() : '';
  if (!binderId) return { display: 'ERROR: donna_history needs binder_id.' };

  const { data: row, error } = await supabase
    .from('records')
    .select('id, client, amount, direction, amount_received, amount_pending, payment_status, date, stage, note, doc_ref, phone, reason_for_action, followup_on, followup_note, repeat_every, hidden, hidden_at, created_at, updated_at')
    .eq('id', binderId).eq('agent_id', agentId).single();
  if (error || !row) return { display: `ERROR opening history: ${error?.message ?? 'record not found'}` };

  const { data: ev } = await supabase
    .from('events')
    .select('action, summary, created_at')
    .eq('agent_id', agentId).eq('entity_type', 'records').eq('entity_id', binderId)
    .order('created_at', { ascending: true })
    .limit(50);
  const events = (ev ?? []) as EventRow[];

  const r = row as TallyRow & {
    reason_for_action: string | null; followup_on: string | null; followup_note: string | null;
    repeat_every: string | null; hidden_at: string | null; created_at: string; updated_at: string;
  };
  const lines: string[] = [];
  lines.push(`BINDER ${r.id}${r.hidden ? ' [ARCHIVED]' : ''} — the story as it stands:`);
  const cells: string[] = [];
  if (r.client) cells.push(`client "${r.client}"`);
  if (r.amount != null) cells.push(`Rs ${r.amount}${r.direction ? ' ' + r.direction : ''}`);
  if (r.amount_received != null) cells.push(`received Rs ${r.amount_received}`);
  if (r.amount_pending != null) cells.push(`pending Rs ${r.amount_pending}`);
  if (r.payment_status) cells.push(`payment ${r.payment_status}`);
  if (r.date) cells.push(`date ${r.date}`);
  if (r.stage) cells.push(`stage ${r.stage}`);
  if (r.phone) cells.push(`phone ${r.phone}`);
  if (r.doc_ref) cells.push(`doc ${r.doc_ref}`);
  if (r.followup_on) cells.push(`returns ${r.followup_on}${r.repeat_every ? ` (repeats ${r.repeat_every})` : ''}${r.followup_note ? ` — ${r.followup_note}` : ''}`);
  lines.push(`  now: ${cells.join(' · ') || 'no cells filled'}`);
  if (r.note) lines.push(`  note: "${r.note}"`);
  if (r.reason_for_action) {
    lines.push('  diary (reason-for-action, in order):');
    for (const ln of r.reason_for_action.split('\n')) if (ln.trim()) lines.push(`    · ${ln.trim()}`);
  }
  // TDW_06 M-1 · P1 + F-06.27. Was three raw `.slice(0, 10)` UTC slices; every row
  // born 00:00–05:30 IST read as YESTERDAY. Now the estate's one tz-correct stamp,
  // in the founder's locked register (dd-mm-yy HH:MM IST). The minute matters here and
  // not only the day: this hand is what lets a recency ask be answered honestly, and a
  // date alone cannot tell 35 minutes from 20 hours — CE-71's own words. A row whose
  // timestamp will not parse renders NO stamp rather than a wrong one.
  const createdAt = arrivalStamp(r.created_at, IST);
  const touchedAt = arrivalStamp(r.updated_at, IST);
  const asideAt = arrivalStamp(r.hidden_at, IST);
  lines.push(`  created ${createdAt ?? 'unknown'} · last touched ${touchedAt ?? 'unknown'}${asideAt ? ` · set aside ${asideAt}` : ''}`);
  if (events.length) {
    lines.push('  writes (the event log, oldest first):');
    for (const e of events) lines.push(`    ${arrivalStamp(e.created_at, IST) ?? 'unknown'} — ${e.summary || e.action || 'write'}`);
  } else {
    lines.push('  writes: no event log on this binder yet (logging began with this bench — older writes predate it).');
  }

  return { display: lines.join('\n'), found: [toViewRow(r)] };
}
