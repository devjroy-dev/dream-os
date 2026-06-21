// recordPrimitives.ts — Donna's primitive write-atoms over the wide `records` table.
//
// LOGICLESS BUILD: each primitive writes ONE category to a record. No gate (no Mike),
// no placement-matching, no canonical-order enforcement — the soul alone governs
// where things go. This is the experiment: does the humanized archivist file clean
// on instinct, with raw atoms and no logic?
//
// COMPOSITION: every write tool takes an optional binder_id. Omit it → a new row.
// Supply it → add this field to THAT row (same spreadsheet row). That is the only
// mechanism here; it does NOT encode what an event/deadline IS — Donna composes that
// herself and tells Harvey the structure if it matters.
//
// "money" = amount + direction (in/out), written only by donna_money.
// CRUH: create (the writes), edit (donna_edit), hide (donna_hide), retrieve
// (donna_retrieve) — never hard delete; nothing is destroyed, only set aside.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome, SnapshotItem } from '../snapshotTypes.js';

// One snapshot line per record row — generalized (the wide table holds every kind).
function recordItem(row: {
  id: string; amount?: number | null; client?: string | null; date?: string | null;
  direction?: string | null; note?: string | null; phone?: string | null; stage?: string | null;
  amount_received?: number | null; amount_pending?: number | null; payment_status?: string | null;
}): SnapshotItem {
  const bits: string[] = [];
  if (row.client) bits.push(row.client);
  if (row.amount != null) bits.push(`Rs ${row.amount}${row.direction ? ' ' + row.direction : ''}`);
  if (row.amount_received != null) bits.push(`received Rs ${row.amount_received}`);
  if (row.amount_pending != null) bits.push(`pending Rs ${row.amount_pending}`);
  if (row.payment_status) bits.push(`payment ${row.payment_status}`);
  if (row.date) bits.push(row.date);
  if (row.stage) bits.push(`stage ${row.stage}`);
  if (row.note) bits.push(row.note);
  const text = bits.join(' — ') || 'record';
  return {
    id: `record:${row.id}`,
    kind: 'loop',
    text,
    status: 'open',
    horizon: row.date ?? null,
    ref_type: 'records',
    ref_id: row.id,
  };
}

const SELECT = 'id, amount, client, date, direction, note, phone, stage, amount_received, amount_pending, payment_status, reason_for_action, followup_on, followup_note, repeat_every';

// The event log — one dated line per confirmed write, into the `events` audit table.
// Best-effort by design: the write is the truth and never fails because the log
// hiccuped; the log is the binder's spine that donna_history reads back. This is the
// Bible's audit trail ("how do you know that") going live at the write site.
async function logEvent(agentId: string, action: string, recordId: string, summary: string): Promise<void> {
  try {
    await supabase.from('events').insert({
      agent_id: agentId, actor: 'agent', action,
      entity_type: 'records', entity_id: recordId, summary,
    });
  } catch { /* never let the audit line break the write */ }
}

// ── Money parsing & speech ────────────────────────────────────────────────────
// THE ONLY ARITHMETIC AT THIS BOUNDARY. Donna relays the figure as it arrived —
// "2.5L", "90k", "1.2cr", or plain rupees — and THIS code does the multiplication,
// deterministically, never her head. Unparseable → clean refusal, never a guess.
function parseMoney(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.round(v);
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(/[,₹\s]/g, '').replace(/^rs\.?/, '');
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)(l|lakh|lakhs|lac|lacs|cr|crore|crores|k|thousand)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = m[2] ?? '';
  const mult = suf.startsWith('cr') ? 10000000 : (suf === 'k' || suf === 'thousand') ? 1000 : suf ? 100000 : 1;
  return Math.round(n * mult);
}

// Indian digit grouping: 1100000 -> "11,00,000".
function inr(n: number): string {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3), tail = s.slice(-3);
  return head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail;
}

// Money spoken back in words — the echo her judgment reads. Crore is CAPITALISED
// so a misplaced zero screams off the page.
function moneyWords(n: number): string {
  if (n >= 10000000) return `Rs ${inr(n)} (${(n / 10000000).toFixed(n % 10000000 ? 2 : 0)} CRORE)`;
  if (n >= 100000) return `Rs ${inr(n)} (${(n / 100000).toFixed(n % 100000 ? 2 : 0)} lakh)`;
  if (n >= 1000) return `Rs ${inr(n)} (${(n / 1000).toFixed(n % 1000 ? 1 : 0)} thousand)`;
  return `Rs ${inr(n)}`;
}

// One line: the binder as it NOW stands — the windscreen. Echoed after every write
// so a silent loss is impossible: what the row truly holds rides back every time.
function binderLine(r: {
  client?: string | null; amount?: number | null; direction?: string | null;
  amount_received?: number | null; amount_pending?: number | null; payment_status?: string | null;
  date?: string | null; stage?: string | null; note?: string | null;
}): string {
  const bits: string[] = [];
  if (r.client) bits.push(`client "${r.client}"`);
  if (r.amount != null) bits.push(`${moneyWords(r.amount)}${r.direction ? ' ' + r.direction : ''}`);
  if (r.amount_received != null) bits.push(`received ${moneyWords(r.amount_received)}`);
  if (r.amount_pending != null) bits.push(`pending ${moneyWords(r.amount_pending)}`);
  if (r.payment_status) bits.push(`payment ${r.payment_status}`);
  if (r.date) bits.push(`date ${r.date}`);
  if (r.stage) bits.push(`stage ${r.stage}`);
  if (r.note) bits.push(`note "${r.note.length > 140 ? r.note.slice(0, 140) + '…' : r.note}"`);
  return bits.join(' · ') || 'empty binder';
}

// reason_for_action is Donna's own diary — why she did what she did — so it ALWAYS
// accumulates, whichever tool writes it, and is never erased. The note is different:
// it is the CURRENT TRUTH about the binder, a state descriptor, not a claim ledger —
// so donna_note (and donna_edit) REPLACE it in place, and it only stacks when she
// deliberately adds a line via donna_note_append. Append is opt-in per write; only
// the diary appends unconditionally. (The claim-vs-proof "keep the old until verified"
// discipline lives in the money cells + supersession, not in this descriptor.)
const ALWAYS_APPEND = ['reason_for_action'] as const;

// Core write: set the given fields on a row. binder_id omitted → insert; given → update.
async function writeFields(
  agentId: string,
  recordId: string | undefined,
  fields: Record<string, unknown>,
  label: string,
  appendAlso?: Set<string>,
): Promise<ToolOutcome> {
  if (recordId) {
    // What appends on this write = the always-append diary (reason_for_action) plus any
    // field the calling tool opted to append (donna_note_append opts in 'note'). Everything
    // else — note included, via donna_note/donna_edit — is replaced in place. Edit means
    // edit; the note carries current truth, not a stack. The diary never erases.
    const patch: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };
    const appendSet = new Set<string>(ALWAYS_APPEND as readonly string[]);
    if (appendAlso) for (const f of appendAlso) appendSet.add(f);
    const appending = [...appendSet].filter(
      (f) => typeof patch[f] === 'string' && (patch[f] as string).trim(),
    );
    if (appending.length) {
      const { data: prior } = await supabase
        .from('records')
        .select(appending.join(', '))
        .eq('id', recordId).eq('agent_id', agentId)
        .single();
      for (const f of appending) {
        const existing = ((prior as Record<string, string | null> | null)?.[f] ?? '').trim();
        if (existing) patch[f] = `${existing}\n${(patch[f] as string).trim()}`;
      }
    }
    const { data, error } = await supabase
      .from('records')
      .update(patch)
      .eq('id', recordId).eq('agent_id', agentId)
      .select(SELECT).single();
    if (error) return { display: `ERROR updating record: ${error.message}` };
    await logEvent(agentId, 'update', data.id, label);
    return { display: `Updated record ${data.id} — ${label}.\n  binder now reads: ${binderLine(data)}`, item: recordItem(data) };
  }
  const { data, error } = await supabase
    .from('records')
    .insert({ agent_id: agentId, ...fields })
    .select(SELECT).single();
  if (error) return { display: `ERROR creating record: ${error.message}` };
  await logEvent(agentId, 'create', data.id, label);
  return { display: `Record ${data.id} created — ${label}.\n  binder now reads: ${binderLine(data)}`, item: recordItem(data) };
}

// ── The atoms ────────────────────────────────────────────────────────────────

export const DONNA_MONEY_TOOL: Anthropic.Tool = {
  name: 'donna_money',
  description:
    "File money on a binder: the amount and its direction (in = money received/owed to the owner, out = money the owner pays). THE SHAPE OF THE CABINET: one binder carries ONE money story — its amount+direction is THE money of that engagement; a different money (a vendor's payable beside a client's contract) is its OWN binder (omit binder_id to open one). Writing money onto a binder that already carries a figure REPLACES the standing figure — and the change is confessed back to you old → new, in words, and written into the binder's note and the event trail, so no figure is ever silently lost. Write the amount as it arrived: plain rupees (250000) or notation ('2.5L', '90k', '1.2cr') — the conversion is computed for you and echoed back in words.",
  input_schema: {
    type: 'object',
    properties: {
      amount: { type: 'string', description: "The figure as given: plain rupees or notation — '2.5L', '2.5 lakh', '90k', '1.2cr', '250000'. Never do the zeros yourself; this hand computes them." },
      direction: { type: 'string', enum: ['in', 'out'], description: 'in = received/owed to owner; out = owner pays.' },
      binder_id: { type: 'string', description: 'Existing binder to file this money on. Omit to open a new binder for a different money.' },
    },
    required: ['amount', 'direction'],
  },
};
export const DONNA_DATE_TOOL: Anthropic.Tool = {
  name: 'donna_date',
  description: 'Record a date on a record (YYYY-MM-DD). Omit binder_id to start a new record; give binder_id to add the date to an existing one (e.g. dating something you already created).',
  input_schema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD.' }, binder_id: { type: 'string' } }, required: ['date'] },
};
export const DONNA_CLIENT_TOOL: Anthropic.Tool = {
  name: 'donna_client',
  description: "Record a client/person name on a record. Omit binder_id to start a new record; give binder_id to attach the client to an existing one.",
  input_schema: { type: 'object', properties: { client: { type: 'string' }, binder_id: { type: 'string' } }, required: ['client'] },
};
export const DONNA_NOTE_TOOL: Anthropic.Tool = {
  name: 'donna_note',
  description: "Write the note on a record — what this record is, a decision, a preference, an enquiry, anything in plain words. The note holds the current truth about the binder: what you write here stands as the note, replacing whatever was there before. (To grow the note instead of rewriting it — keeping the old lines and adding beneath — use donna_note_append.) Omit binder_id to start a new record; give binder_id to write the note on an existing one.",
  input_schema: { type: 'object', properties: { note: { type: 'string' }, binder_id: { type: 'string' } }, required: ['note'] },
};
export const DONNA_PHONE_TOOL: Anthropic.Tool = {
  name: 'donna_phone',
  description: 'Record a phone number on a record. Omit binder_id to start a new record; give binder_id to attach it to an existing one.',
  input_schema: { type: 'object', properties: { phone: { type: 'string' }, binder_id: { type: 'string' } }, required: ['phone'] },
};
export const DONNA_DOC_TOOL: Anthropic.Tool = {
  name: 'donna_doc',
  description: "File WHICH document a binder rests on: write a Brief id (from donna_shelf) or a storage ref/url into the binder's doc_ref cell — so a review binder points at the exact Brief it was measured against and the citation chain is queryable, not just prose. Omit binder_id to start a new record; give binder_id to attach it.",
  input_schema: { type: 'object', properties: { doc_ref: { type: 'string', description: 'A Brief id (preferred — the shelf gives them) or a storage ref/url.' }, binder_id: { type: 'string' } }, required: ['doc_ref'] },
};
export const DONNA_STAGE_TOOL: Anthropic.Tool = {
  name: 'donna_stage',
  description: "Set the stage of a record — where it sits in its lifecycle. The stage words depend on the field of work (a lead moves new→contacted→quoted→won→lost; an audit moves planning→fieldwork→review→signoff; a matter moves intake→drafting→filed→judgment). Use the true stage word for THIS record's kind of work — file it as it actually is, never force it into a word that doesn't fit. Omit binder_id to start a new record; give binder_id to update an existing one's stage.",
  input_schema: { type: 'object', properties: { stage: { type: 'string', description: 'The lifecycle stage, in the words that fit this field of work.' }, binder_id: { type: 'string' } }, required: ['stage'] },
};
export const DONNA_REASONFORACTION_APPEND_TOOL: Anthropic.Tool = {
  name: 'donna_write_reasonforaction_append',
  description: "Your note-to-self on a record — why you did what you did, what you're holding and why, the thinking behind where this stands. It accumulates: each line is added beneath the last, never overwriting, so the binder keeps its own trail of how it got here. Omit binder_id to start a new record; give binder_id to add to an existing one.",
  input_schema: { type: 'object', properties: { reason_for_action: { type: 'string', description: 'A short, plain line: why this, why now.' }, binder_id: { type: 'string' } }, required: ['reason_for_action'] },
};

export const DONNA_OVERWRITE_NOTE_TOOL: Anthropic.Tool = {
  name: 'donna_note_append',
  description: "Add a line to the note on a record — kept beneath what's already there, so the note grows rather than being rewritten. For when you mean to accumulate, not replace. (To rewrite the note to current truth instead, use donna_note.) Needs binder_id.",
  input_schema: { type: 'object', properties: { note: { type: 'string' }, binder_id: { type: 'string' } }, required: ['note', 'binder_id'] },
};

// CRUH: edit (set any fields), hide (set aside, recoverable), retrieve (bring back).
export const DONNA_EDIT_TOOL: Anthropic.Tool = {
  name: 'donna_edit',
  description:
    "Edit the non-money cells of an existing binder: client, date, stage, phone, doc_ref — and the note, WHICH GROWS: a note written here is added beneath what already stands, so the binder's story accumulates instead of being erased (to rewrite the note clean to current truth, use donna_note). Money cells are not edited here — money corrections go through donna_money_edit, the one witnessed door. Always needs binder_id.",
  input_schema: {
    type: 'object',
    properties: {
      binder_id: { type: 'string' },
      client: { type: 'string' }, date: { type: 'string' }, note: { type: 'string', description: 'A line added beneath the existing note — the story grows.' },
      phone: { type: 'string' }, doc_ref: { type: 'string' },
      stage: { type: 'string' },
      reason_for_action: { type: 'string', description: 'Note-to-self; appends, never overwrites.' },
    },
    required: ['binder_id'],
  },
};
export const DONNA_HIDE_TOOL: Anthropic.Tool = {
  name: 'donna_hide',
  description: 'Set a record aside — archive it out of the active picture. It is NEVER destroyed, only hidden, and can always be retrieved. Use when something is finished, cancelled, or no longer active.',
  input_schema: { type: 'object', properties: { binder_id: { type: 'string' } }, required: ['binder_id'] },
};
export const DONNA_RETRIEVE_TOOL: Anthropic.Tool = {
  name: 'donna_unarchive',
  description: 'Bring an archived (set-aside) binder back into the active picture. The mirror of donna_hide — nothing is ever lost, only set aside. (Looking something up is donna_find; this hand un-archives.)',
  input_schema: { type: 'object', properties: { binder_id: { type: 'string' } }, required: ['binder_id'] },
};

export const DONNA_REPEATFOLLOWUP_TOOL: Anthropic.Tool = {
  name: 'donna_repeatfollowup',
  description:
    "Set a record to come BACK on a date — a follow-up that resurfaces when it's due (a deadline to chase, a payment to confirm, a check-in). Give follow_on (YYYY-MM-DD: when it should return to attention) and why (a short line: what to do then). For something that RECURS — a monthly retainer, a quarterly filing, a weekly check-in — also give repeat ('1 month', '7 days', '3 months'): when it comes due and is handled, it automatically sets its own next date. This is what makes a stored date actually return; without it, a date just sits. Needs binder_id (the record this follow-up belongs to).",
  input_schema: {
    type: 'object',
    properties: {
      binder_id: { type: 'string', description: 'The record this follow-up belongs to.' },
      follow_on: { type: 'string', description: 'YYYY-MM-DD — when this should come back to attention.' },
      why: { type: 'string', description: 'Short line: what needs doing when it returns.' },
      repeat: { type: 'string', description: "Recurrence rhythm if it repeats: '1 month', '7 days', '3 months'. Omit for one-time." },
    },
    required: ['binder_id', 'follow_on'],
  },
};

export const DONNA_MERGE_TOOL: Anthropic.Tool = {
  name: 'donna_merge',
  description:
    "Merge two records that are the same thing into one — when a client or matter got logged twice and the truth is split across both. You name which record SURVIVES (survivor_id) and which one is RETIRED (retire_id), and you give the values that should stand on the survivor — cell by cell, your judgment decides what is true. Anything you name is written onto the survivor; anything you don't name keeps the survivor's existing value. The retired record is set aside (hidden, never destroyed) with a note saying where it went, so if the merge was wrong you can always bring it back with donna_retrieve. Read both records first (donna_find) so you know what each holds before you decide what survives.",
  input_schema: {
    type: 'object',
    properties: {
      survivor_id: { type: 'string', description: 'The record that stays — the one you are merging INTO.' },
      retire_id: { type: 'string', description: 'The duplicate to retire — set aside after its truth is folded into the survivor.' },
      client: { type: 'string', description: "Value to stand on the survivor, if you're setting it." },
      amount: { type: 'number' }, direction: { type: 'string', enum: ['in', 'out'] },
      date: { type: 'string' }, note: { type: 'string' }, phone: { type: 'string' },
      doc_ref: { type: 'string' }, stage: { type: 'string' },
      amount_received: { type: 'number' }, amount_pending: { type: 'number' }, payment_status: { type: 'string' },
      reason_for_action: { type: 'string', description: 'Your note-to-self on the survivor about what you merged and why.' },
    },
    required: ['survivor_id', 'retire_id'],
  },
};

export const DONNA_SPLIT_TOOL: Anthropic.Tool = {
  name: 'donna_split',
  description:
    "Split one record that turns out to be TWO real things — when two people or matters got tangled into one binder (a name shared, a contradiction of phone or city that means two real people) and the truth must be separated. You name the source record (source_id) and you give the cells that belong to the SECOND thing — those are written onto a brand-new record, and a dated line is left on both binders saying what was separated and where it went, so the split is always traceable both ways. The source keeps everything it has: after the split, correct the source with donna_edit if any of its cells truly belonged to the one that left. The mirror of donna_merge. Read the record first (donna_find / donna_history) so you know exactly what belongs to whom before you separate.",
  input_schema: {
    type: 'object',
    properties: {
      source_id: { type: 'string', description: 'The tangled record being split — it stays, minus what you separate out.' },
      client: { type: 'string', description: 'The second entity\'s name — goes on the NEW record.' },
      amount: { type: 'number' }, direction: { type: 'string', enum: ['in', 'out'] },
      date: { type: 'string' }, note: { type: 'string' }, phone: { type: 'string' },
      doc_ref: { type: 'string' }, stage: { type: 'string' },
      amount_received: { type: 'number' }, amount_pending: { type: 'number' }, payment_status: { type: 'string' },
      reason_for_action: { type: 'string', description: 'Your note-to-self on the NEW record about why it was separated.' },
    },
    required: ['source_id'],
  },
};

export const DONNA_MONEY_EDIT_TOOL: Anthropic.Tool = {
  name: 'donna_money_edit',
  description:
    "The ONE door for correcting money already on a binder — deliberate, witnessed, never silent. Give binder_id and only the money cells you are changing: amount (notation or plain rupees), direction, amount_received, amount_pending, payment_status. Every change is confessed back old → new, in words, and a dated line is added to the binder's note so the story carries its own corrections. The old value is never lost — the event trail keeps it forever. Use this for: a figure filed wrong, a refund changing what was received, a contract value revised, a payment landing (claimed → received).",
  input_schema: {
    type: 'object',
    properties: {
      binder_id: { type: 'string', description: 'The binder whose money is being corrected.' },
      amount: { type: 'string', description: "New amount, as given: plain rupees or notation ('2.5L', '11L', '90k')." },
      direction: { type: 'string', enum: ['in', 'out'] },
      amount_received: { type: 'string', description: 'New received figure (notation or plain rupees).' },
      amount_pending: { type: 'string', description: 'New pending figure (notation or plain rupees).' },
      payment_status: { type: 'string', description: 'Where the money stands, in your own word (claimed, outstanding, partial, received, refunded).' },
    },
    required: ['binder_id'],
  },
};

export const DONNA_INVOICE_PDF_TOOL: Anthropic.Tool = {
  name: 'donna_invoice_pdf',
  description: "Produce the formal, numbered invoice document for a binder — the proper PDF the client receives, stamped with the next number in the house series. Use this when Harvey asks for the invoice document itself (the thing to hand the client), not merely the money record on the binder. Omit binder_id to act on the binder you're working; give binder_id to name a specific one.",
  input_schema: { type: 'object', properties: { binder_id: { type: 'string' } } },
};

export const DONNA_BOOK_EVENT_TOOL: Anthropic.Tool = {
  name: 'donna_book_event',
  description: "Place a date on the vendor's calendar — a booking the vendor keeps: a shoot, a trial, a fitting, a recce, an appointment, a meeting, a ceremony. Give title (whose, and what — e.g. \"Kaaya - trial\"), event_date (YYYY-MM-DD), and the kind that fits THIS vendor's craft. Optionally event_time (HH:MM, 24h) and a short note. Use it when the vendor says book, block, schedule, or pencil in a date. The calendar is the vendor's spine — this is how a confirmed date stops living only in talk and becomes a kept appointment.",
  input_schema: {
    type: 'object',
    properties: {
      title:      { type: 'string', description: 'Whose booking and what - e.g. "Kaaya - trial", "Sharma sangeet recce".' },
      event_date: { type: 'string', description: 'The date, YYYY-MM-DD.' },
      event_time: { type: 'string', description: 'Optional time, HH:MM 24-hour.' },
      kind:       { type: 'string', description: "The kind that fits this craft: shoot, trial, fitting, recce, meeting, ceremony, family, social, other. Name it from the vendor's field; if unsure, leave it and a neutral booking is kept." },
      notes:      { type: 'string', description: 'Optional short note for the booking.' },
    },
    required: ['title', 'event_date'],
  },
};

export const DONNA_EDIT_EVENT_TOOL: Anthropic.Tool = {
  name: 'donna_edit_event',
  description: "Change a booking already on the calendar — reschedule it (new date and/or time) or fix its details (title, kind, note). Give event_id (the [handle] shown beside each booking in the calendar you can see) and only the fields that change. Use it when the vendor says move, reschedule, push, change, or rename a booking. The booking must be one you can see on the calendar.",
  input_schema: {
    type: 'object',
    properties: {
      event_id:   { type: 'string', description: 'The booking handle, exactly as shown in [brackets] beside it in the calendar.' },
      title:      { type: 'string', description: 'New title, if it changed.' },
      event_date: { type: 'string', description: 'New date YYYY-MM-DD, if rescheduled.' },
      event_time: { type: 'string', description: 'New time HH:MM 24-hour, if changed.' },
      kind:       { type: 'string', description: 'New kind, if it changed.' },
      notes:      { type: 'string', description: 'New note, if it changed.' },
    },
    required: ['event_id'],
  },
};

export const DONNA_CANCEL_EVENT_TOOL: Anthropic.Tool = {
  name: 'donna_cancel_event',
  description: "Cancel a booking on the calendar — it is marked cancelled, not destroyed (recoverable). Give event_id (the [handle] shown beside each booking in the calendar you can see). Use it when the vendor says cancel, call off, drop, or scrap a booking. The booking must be one you can see on the calendar.",
  input_schema: {
    type: 'object',
    properties: {
      event_id: { type: 'string', description: 'The booking handle, exactly as shown in [brackets] beside it in the calendar.' },
    },
    required: ['event_id'],
  },
};

export const RECORD_TOOLS: Anthropic.Tool[] = [
  DONNA_MONEY_TOOL, DONNA_DATE_TOOL, DONNA_CLIENT_TOOL, DONNA_NOTE_TOOL,
  DONNA_PHONE_TOOL, DONNA_DOC_TOOL, DONNA_STAGE_TOOL, DONNA_REASONFORACTION_APPEND_TOOL,
  DONNA_OVERWRITE_NOTE_TOOL,
  DONNA_EDIT_TOOL, DONNA_HIDE_TOOL, DONNA_RETRIEVE_TOOL, DONNA_REPEATFOLLOWUP_TOOL,
  DONNA_MERGE_TOOL, DONNA_SPLIT_TOOL, DONNA_MONEY_EDIT_TOOL,
  DONNA_INVOICE_PDF_TOOL, DONNA_BOOK_EVENT_TOOL, DONNA_EDIT_EVENT_TOOL, DONNA_CANCEL_EVENT_TOOL,
];

// ── Executors ────────────────────────────────────────────────────────────────
type Id = { binder_id?: string };

export async function executeRecordTool(agentId: string, name: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  const rid = (input as Id).binder_id;
  switch (name) {
    case 'donna_money': {
      const parsed = parseMoney(input.amount);
      if (parsed == null) return { display: `ERROR: could not read amount "${String(input.amount)}". Give plain rupees (250000) or notation ('2.5L', '90k', '1.2cr') — never compute the zeros yourself.` };
      const dirIn = input.direction === 'in' || input.direction === 'out' ? input.direction : null;
      if (!dirIn) return { display: 'ERROR: donna_money needs direction (in or out).' };
      if (rid) {
        const { data: existing, error: exErr } = await supabase.from('records')
          .select(SELECT).eq('id', rid).eq('agent_id', agentId).single();
        if (exErr || !existing) return { display: `ERROR: binder ${rid} not found.` };
        if (existing.amount != null) {
          // WITNESSED REPLACE — Dev's design: money is never silently lost. The write
          // happens; the old figure is confessed old → new in words, preserved into the
          // binder's own story (note, appended) and the event trail. Her judgment sees
          // everything and is overridden by nothing.
          const today = new Date().toISOString().slice(0, 10);
          const oldLine = `${moneyWords(existing.amount)}${existing.direction ? ' ' + existing.direction : ''}`;
          const newLine = `${moneyWords(parsed)} ${dirIn}`;
          const confess = `money replaced: ${oldLine} → ${newLine}`;
          const outcome = await writeFields(
            agentId, rid,
            { amount: parsed, direction: dirIn, note: `[money replaced ${today}] ${oldLine} → ${newLine}.` },
            confess, new Set(['note']),
          );
          if (outcome.display.startsWith('ERROR')) return outcome;
          return { display: `MONEY REPLACED on ${rid} — ${oldLine} → ${newLine} (old figure kept in the story and the event trail).\n${outcome.display.split('\n').slice(1).join('\n')}`, item: outcome.item };
        }
      }
      return writeFields(agentId, rid, { amount: parsed, direction: dirIn }, `money ${moneyWords(parsed)} ${dirIn}`);
    }
    case 'donna_date':
      return writeFields(agentId, rid, { date: input.date }, `date ${input.date}`);
    case 'donna_client':
      return writeFields(agentId, rid, { client: input.client }, `client ${input.client}`);
    case 'donna_note':
      if (typeof input.note !== 'string' || !input.note.trim()) return { display: 'ERROR: donna_note needs the note text — what should this binder say?' };
      return writeFields(agentId, rid, { note: input.note }, `note`);
    case 'donna_note_append':
      if (!rid) return { display: 'ERROR: donna_note_append needs binder_id.' };
      if (typeof input.note !== 'string' || !input.note.trim()) return { display: 'ERROR: donna_note_append needs the line to add.' };
      return writeFields(agentId, rid, { note: input.note }, `note line added`, new Set(['note']));
    case 'donna_phone':
      return writeFields(agentId, rid, { phone: input.phone }, `phone`);
    case 'donna_doc':
      return writeFields(agentId, rid, { doc_ref: input.doc_ref }, `doc`);
    case 'donna_stage':
      if (typeof input.stage !== 'string' || !input.stage.trim()) return { display: 'ERROR: donna_stage needs the stage word — where does this binder stand?' };
      return writeFields(agentId, rid, { stage: input.stage }, `stage ${input.stage}`);
    case 'donna_write_reasonforaction_append':
      return writeFields(agentId, rid, { reason_for_action: input.reason_for_action }, `reason noted`);
    case 'donna_money_edit': {
      if (!rid) return { display: 'ERROR: donna_money_edit needs binder_id.' };
      const { data: before, error: befErr } = await supabase.from('records')
        .select(SELECT).eq('id', rid).eq('agent_id', agentId).single();
      if (befErr || !before) return { display: `ERROR: binder ${rid} not found.` };
      const patch: Record<string, unknown> = {};
      const confess: string[] = [];
      const moneyFields: Array<['amount' | 'amount_received' | 'amount_pending', string]> = [
        ['amount', 'amount'], ['amount_received', 'received'], ['amount_pending', 'pending'],
      ];
      for (const [field, word] of moneyFields) {
        if (field in input) {
          const parsed = parseMoney(input[field]);
          if (parsed == null) return { display: `ERROR: could not read ${field} "${String(input[field])}". Give plain rupees or notation ('2.5L', '90k', '1.2cr').` };
          patch[field] = parsed;
          const old = before[field] as number | null;
          confess.push(`${word}: ${old != null ? moneyWords(old) : '(empty)'} → ${moneyWords(parsed)}`);
        }
      }
      if (typeof input.direction === 'string' && (input.direction === 'in' || input.direction === 'out')) {
        patch.direction = input.direction;
        if (before.direction !== input.direction) confess.push(`direction: ${before.direction ?? '(empty)'} → ${input.direction}`);
      }
      if (typeof input.payment_status === 'string' && input.payment_status.trim()) {
        patch.payment_status = input.payment_status.trim();
        if (before.payment_status !== patch.payment_status) confess.push(`payment: ${before.payment_status ?? '(empty)'} → ${patch.payment_status}`);
      }
      if (!Object.keys(patch).length) return { display: 'ERROR: donna_money_edit needs at least one money cell to change.' };
      // The story carries its own corrections: one dated line appended to the note.
      const today = new Date().toISOString().slice(0, 10);
      if (confess.length) patch.note = `[money corrected ${today}] ${confess.join('; ')}.`;
      const outcome = await writeFields(agentId, rid, patch, `money corrected — ${confess.join('; ') || 'no change'}`, new Set(['note']));
      if (outcome.display.startsWith('ERROR')) return outcome;
      return { display: `MONEY CORRECTED on ${rid} — ${confess.join('; ')}.\n${outcome.display.split('\n').slice(1).join('\n')}`, item: outcome.item };
    }
    case 'donna_edit': {
      if (!rid) return { display: 'ERROR: donna_edit needs binder_id.' };
      const patch: Record<string, unknown> = {};
      for (const k of ['client', 'date', 'note', 'phone', 'doc_ref', 'stage', 'reason_for_action']) {
        if (k in input) patch[k] = input[k];
      }
      const moneyKeys = ['amount', 'direction', 'amount_received', 'amount_pending', 'payment_status'].filter((k) => k in input);
      if (moneyKeys.length && !Object.keys(patch).length) {
        return { display: `REFUSED — money cells (${moneyKeys.join(', ')}) are not edited here. Money corrections go through donna_money_edit, the one witnessed door.` };
      }
      if (!Object.keys(patch).length) return { display: 'ERROR: donna_edit needs at least one cell to change.' };
      const dropped = moneyKeys.length ? ` (money cells ${moneyKeys.join(', ')} NOT touched — those go through donna_money_edit)` : '';
      const outcome = await writeFields(agentId, rid, patch, `edited ${Object.keys(patch).join(', ')}${dropped}`, new Set(['note']));
      return outcome;
    }
    case 'donna_invoice_pdf': {
      if (!rid) return { display: 'ERROR: donna_invoice_pdf needs binder_id (which binder to invoice).' };
      // Signal only — the host stamps the next number, renders the PDF, files it.
      // Donna's hand asks for the document; the number + PDF return through the door.
      return { display: `Invoice document requested for record ${rid} — it is being prepared and will appear in the invoices list.` };
    }
    case 'donna_book_event': {
      const title = typeof input.title === 'string' ? input.title.trim() : '';
      const date  = typeof input.event_date === 'string' ? input.event_date.trim() : '';
      if (!title) return { display: 'ERROR: donna_book_event needs a title (whose booking and what).' };
      if (!date)  return { display: 'ERROR: donna_book_event needs event_date (YYYY-MM-DD).' };
      // Signal only — the door writes the calendar row (public.events, vendor-keyed) and confirms.
      // Donna's hand asks for the booking; the kept date returns through the door.
      const at = typeof input.event_time === 'string' && input.event_time.trim() ? ` at ${input.event_time.trim()}` : '';
      return { display: `Booking requested: ${title} on ${date}${at} — it is being placed on the calendar.` };
    }
    case 'donna_edit_event': {
      const eid = typeof input.event_id === 'string' ? input.event_id.trim() : '';
      if (!eid) return { display: 'ERROR: donna_edit_event needs event_id (the booking handle from the calendar).' };
      const fields = ['title', 'event_date', 'event_time', 'kind', 'notes'];
      const changed = fields.filter((k) => typeof input[k] === 'string' && (input[k] as string).trim());
      if (changed.length === 0) return { display: 'ERROR: donna_edit_event needs at least one field to change (date, time, title, kind, or note).' };
      // Signal only — the door applies the change to public.events (vendor-scoped) and confirms.
      return { display: `Change requested to booking ${eid}: ${changed.join(', ')} — it is being updated on the calendar.` };
    }
    case 'donna_cancel_event': {
      const eid = typeof input.event_id === 'string' ? input.event_id.trim() : '';
      if (!eid) return { display: 'ERROR: donna_cancel_event needs event_id (the booking handle from the calendar).' };
      // Signal only — the door marks the calendar row cancelled (recoverable) and confirms.
      return { display: `Cancellation requested for booking ${eid} — it is being called off on the calendar.` };
    }
    case 'donna_hide': {
      if (!rid) return { display: 'ERROR: donna_hide needs binder_id.' };
      const { error } = await supabase.from('records')
        .update({ hidden: true, hidden_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', rid).eq('agent_id', agentId);
      if (error) return { display: `ERROR hiding record: ${error.message}` };
      await logEvent(agentId, 'hide', rid, 'set aside (archived, recoverable)');
      return { display: `Record ${rid} set aside (archived, recoverable).`, remove: `record:${rid}` };
    }
    case 'donna_unarchive':
    case 'donna_retrieve': {  // old name accepted during the transition — same hand
      if (!rid) return { display: 'ERROR: donna_retrieve needs binder_id.' };
      const { data, error } = await supabase.from('records')
        .update({ hidden: false, hidden_at: null, updated_at: new Date().toISOString() })
        .eq('id', rid).eq('agent_id', agentId).select(SELECT).single();
      if (error) return { display: `ERROR retrieving record: ${error.message}` };
      await logEvent(agentId, 'retrieve', rid, 'brought back into the active picture');
      return { display: `Record ${rid} brought back into the active picture.`, item: recordItem(data) };
    }
    case 'donna_merge': {
      const survivorId = typeof input.survivor_id === 'string' ? input.survivor_id.trim() : '';
      const retireId = typeof input.retire_id === 'string' ? input.retire_id.trim() : '';
      if (!survivorId || !retireId) return { display: 'ERROR: donna_merge needs survivor_id and retire_id.' };
      if (survivorId === retireId) return { display: 'ERROR: survivor_id and retire_id are the same record — nothing to merge.' };
      // Fold the values she named onto the survivor (replace path — she names the truth per cell).
      const patch: Record<string, unknown> = {};
      for (const k of ['client', 'direction', 'date', 'note', 'phone', 'doc_ref', 'stage', 'payment_status', 'reason_for_action']) {
        if (k in input) patch[k] = input[k];
      }
      for (const k of ['amount', 'amount_received', 'amount_pending']) {
        if (k in input) {
          const parsed = parseMoney(input[k]);
          if (parsed == null) return { display: `ERROR: could not read ${k} "${String(input[k])}". Give plain rupees or notation ('2.5L', '90k').` };
          patch[k] = parsed;
        }
      }
      let survivorItem: SnapshotItem | null | undefined = undefined;
      if (Object.keys(patch).length) {
        const survivorOutcome = await writeFields(agentId, survivorId, patch, `merged from ${retireId}`);
        if (survivorOutcome.display.startsWith('ERROR')) return survivorOutcome;
        survivorItem = survivorOutcome.item;
      }
      // Retire the duplicate: hide it (never destroyed — recoverable via donna_retrieve), with a
      // breadcrumb on its own reason_for_action saying where it went. Append, so its trail is kept.
      const { data: prior } = await supabase.from('records')
        .select('reason_for_action').eq('id', retireId).eq('agent_id', agentId).single();
      const existingReason = ((prior as { reason_for_action: string | null } | null)?.reason_for_action ?? '').trim();
      const breadcrumb = `Merged into ${survivorId} on ${new Date().toISOString().slice(0, 10)} — set aside, recoverable.`;
      const mergedReason = existingReason ? `${existingReason}\n${breadcrumb}` : breadcrumb;
      const { error: retErr } = await supabase.from('records')
        .update({ hidden: true, hidden_at: new Date().toISOString(), reason_for_action: mergedReason, updated_at: new Date().toISOString() })
        .eq('id', retireId).eq('agent_id', agentId);
      if (retErr) return { display: `Survivor updated, but ERROR retiring ${retireId}: ${retErr.message}` };
      await logEvent(agentId, 'merge_retire', retireId, `merged into ${survivorId}, set aside`);
      return {
        display: `Merged ${retireId} into ${survivorId} — ${Object.keys(patch).length ? Object.keys(patch).join(', ') + ' folded onto survivor; ' : ''}duplicate set aside (recoverable).`,
        item: survivorItem,
        remove: `record:${retireId}`,
      };
    }
    case 'donna_split': {
      const sourceId = typeof input.source_id === 'string' ? input.source_id.trim() : '';
      if (!sourceId) return { display: 'ERROR: donna_split needs source_id.' };
      // The source must really exist and be hers — never split a phantom.
      const { data: src, error: srcErr } = await supabase.from('records')
        .select('id, reason_for_action').eq('id', sourceId).eq('agent_id', agentId).single();
      if (srcErr || !src) return { display: `ERROR: source record ${sourceId} not found.` };
      // The cells she names belong to the SECOND thing — they open the new binder.
      const newFields: Record<string, unknown> = {};
      for (const k of ['client', 'direction', 'date', 'note', 'phone', 'doc_ref', 'stage', 'payment_status']) {
        if (k in input) newFields[k] = input[k];
      }
      for (const k of ['amount', 'amount_received', 'amount_pending']) {
        if (k in input) {
          const parsed = parseMoney(input[k]);
          if (parsed == null) return { display: `ERROR: could not read ${k} "${String(input[k])}". Give plain rupees or notation ('2.5L', '90k').` };
          newFields[k] = parsed;
        }
      }
      if (Object.keys(newFields).length === 0) return { display: 'ERROR: donna_split needs at least one cell for the new record (whose truth is being separated out?).' };
      const today = new Date().toISOString().slice(0, 10);
      const newReason = typeof input.reason_for_action === 'string' && input.reason_for_action.trim()
        ? `${input.reason_for_action.trim()}\nSplit from ${sourceId} on ${today}.`
        : `Split from ${sourceId} on ${today}.`;
      const created = await writeFields(agentId, undefined, { ...newFields, reason_for_action: newReason }, `split from ${sourceId}`);
      if (created.display.startsWith('ERROR')) return created;
      const newId = created.item?.ref_id ?? '(unknown)';
      // Breadcrumb on the source, appended — its trail is never erased.
      const existing = ((src as { reason_for_action: string | null }).reason_for_action ?? '').trim();
      const crumb = `Split: ${newId} separated from this binder on ${today}.`;
      const { error: crumbErr } = await supabase.from('records')
        .update({ reason_for_action: existing ? `${existing}\n${crumb}` : crumb, updated_at: new Date().toISOString() })
        .eq('id', sourceId).eq('agent_id', agentId);
      if (crumbErr) return { display: `New record ${newId} created, but ERROR marking source: ${crumbErr.message}` };
      await logEvent(agentId, 'split_out', sourceId, `split: ${newId} separated out`);
      return {
        display: `Split ${sourceId}: new record ${newId} opened with ${Object.keys(newFields).join(', ')}; both binders carry the trail. If any of the source's cells belonged to the one that left, correct the source with donna_edit.`,
        item: created.item,
      };
    }
    case 'donna_repeatfollowup': {
      if (!rid) return { display: 'ERROR: donna_repeatfollowup needs binder_id.' };
      const followOn = typeof input.follow_on === 'string' ? input.follow_on.trim() : '';
      if (!followOn) return { display: 'ERROR: donna_repeatfollowup needs follow_on (YYYY-MM-DD).' };
      const fields: Record<string, unknown> = { followup_on: followOn };
      if (typeof input.why === 'string' && input.why.trim()) fields.followup_note = input.why.trim();
      if (typeof input.repeat === 'string' && input.repeat.trim()) fields.repeat_every = input.repeat.trim();
      const rpt = fields.repeat_every ? `, repeats ${fields.repeat_every}` : '';
      return writeFields(agentId, rid, fields, `follow-up on ${followOn}${rpt}`);
    }
    default:
      return { display: `Unknown record tool: ${name}` };
  }
}
