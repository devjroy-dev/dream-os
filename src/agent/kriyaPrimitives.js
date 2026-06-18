// ─────────────────────────────────────────────────────────────────────────────
// src/agent/kriyaPrimitives.js
// Kriya's hands — the free-form binder primitives. JS port of dreamai's
// recordPrimitives.ts, faithful to the mechanism, adapted to dream-os:
//   * table `binders`, keyed by vendor_id
//   * audit trail -> `binder_events` (NOT the calendar `events` table)
//
// THE LAW (carried over verbatim in spirit):
//   * Every write tool takes an optional binder_id. Omit -> insert; given -> update.
//   * Money parsing is the ONLY arithmetic at this boundary; deterministic, never
//     the model's head. Unparseable -> clean refusal, never a guess.
//   * Money is never silently lost: writing money onto a binder that already holds
//     a figure REPLACES it, confessed old -> new in words, into the note + event trail.
//   * reason_for_action is Kriya's diary — ALWAYS appends, never erased.
//     note is current truth — REPLACED in place, unless kriya_note_append opts in.
//   * binderLine — the windscreen — echoes the binder as it NOW stands after every
//     write, so a silent loss is impossible.
//
// Tool NAMES are the whole interface (Kriya's cardinal rule): no procedural logic
// baked in, no "if X then Y". She reads the bench and picks the hand.
'use strict';

const SELECT =
  'id, amount, client, date, direction, note, phone, stage, amount_received, amount_pending, payment_status, reason_for_action, followup_on, followup_note, repeat_every, doc_ref';

const ALWAYS_APPEND = ['reason_for_action'];

// ── Money parsing & speech ──────────────────────────────────────────────────
function parseMoney(v) {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.round(v);
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(/[,₹\s]/g, '').replace(/^rs\.?/, '');
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)(l|lakh|lakhs|lac|lacs|cr|crore|crores|k|thousand)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = m[2] || '';
  const mult = suf.startsWith('cr') ? 10000000 : (suf === 'k' || suf === 'thousand') ? 1000 : suf ? 100000 : 1;
  return Math.round(n * mult);
}

// Indian digit grouping: 1100000 -> "11,00,000".
function inr(n) {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3), tail = s.slice(-3);
  return head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + tail;
}

// Money in words — crore CAPITALISED so a misplaced zero screams off the page.
function moneyWords(n) {
  if (n >= 10000000) return `Rs ${inr(n)} (${(n / 10000000).toFixed(n % 10000000 ? 2 : 0)} CRORE)`;
  if (n >= 100000)   return `Rs ${inr(n)} (${(n / 100000).toFixed(n % 100000 ? 2 : 0)} lakh)`;
  if (n >= 1000)     return `Rs ${inr(n)} (${(n / 1000).toFixed(n % 1000 ? 1 : 0)} thousand)`;
  return `Rs ${inr(n)}`;
}

// One line: the binder as it NOW stands — echoed after every write.
function binderLine(r) {
  const bits = [];
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

// ── The event log — one dated line per confirmed write. Best-effort. ─────────
async function logEvent(supabase, vendorId, action, binderId, summary) {
  try {
    await supabase.from('binder_events').insert({
      vendor_id: vendorId, actor: 'agent', action, binder_id: binderId, summary,
    });
  } catch { /* never let the audit line break the write */ }
}

// ── Core write: insert (no binder_id) or update (binder_id given). ───────────
async function writeFields(supabase, vendorId, binderId, fields, label, appendAlso) {
  if (binderId) {
    const patch = { ...fields, updated_at: new Date().toISOString() };
    const appendSet = new Set(ALWAYS_APPEND);
    if (appendAlso) for (const f of appendAlso) appendSet.add(f);
    const appending = [...appendSet].filter(
      (f) => typeof patch[f] === 'string' && patch[f].trim()
    );
    if (appending.length) {
      const { data: prior } = await supabase
        .from('binders').select(appending.join(', '))
        .eq('id', binderId).eq('vendor_id', vendorId).single();
      for (const f of appending) {
        const existing = ((prior && prior[f]) || '').trim();
        if (existing) patch[f] = `${existing}\n${patch[f].trim()}`;
      }
    }
    const { data, error } = await supabase
      .from('binders').update(patch)
      .eq('id', binderId).eq('vendor_id', vendorId)
      .select(SELECT).single();
    if (error) return { display: `ERROR updating binder: ${error.message}`, error: true };
    await logEvent(supabase, vendorId, 'update', data.id, label);
    return { display: `Updated binder ${data.id} — ${label}.\n  binder now reads: ${binderLine(data)}`, mutated: true, binder_id: data.id };
  }
  const { data, error } = await supabase
    .from('binders').insert({ vendor_id: vendorId, ...fields })
    .select(SELECT).single();
  if (error) return { display: `ERROR creating binder: ${error.message}`, error: true };
  await logEvent(supabase, vendorId, 'create', data.id, label);
  return { display: `Binder ${data.id} created — ${label}.\n  binder now reads: ${binderLine(data)}`, mutated: true, binder_id: data.id };
}

// ── The atoms (Kriya's bench) ────────────────────────────────────────────────
const KRIYA_TOOLS = [
  { name: 'kriya_money',
    description: "File money on a binder: the amount and its direction (in = money received/owed to the owner, out = money the owner pays). One binder carries ONE money story — its amount+direction is THE money of that engagement; a different money (a payable beside a client's contract) is its OWN binder (omit binder_id to open one). Writing money onto a binder that already carries a figure REPLACES the standing figure — confessed old → new, in words, into the note and the event trail, so no figure is ever silently lost. Write the amount as it arrived: plain rupees (250000) or notation ('2.5L','90k','1.2cr') — the conversion is computed for you.",
    input_schema: { type: 'object', properties: {
      amount: { type: 'string', description: 'Plain rupees or notation (2.5L, 90k, 1.2cr).' },
      direction: { type: 'string', enum: ['in', 'out'], description: 'in = received/owed to owner; out = owner pays.' },
      binder_id: { type: 'string', description: 'Existing binder to file this money on. Omit to open a new binder.' },
    }, required: ['amount', 'direction'] } },
  { name: 'kriya_money_edit',
    description: "The ONE door for correcting money already on a binder — deliberate, witnessed, never silent. Give binder_id and only the money cells you are changing: amount, direction, amount_received, amount_pending, payment_status. Every change is confessed back old → new, in words, and a dated line is added to the binder's note. The old value is never lost — the event trail keeps it forever. Use for: a figure filed wrong, a refund, a contract value revised, a payment landing (claimed → received).",
    input_schema: { type: 'object', properties: {
      binder_id: { type: 'string', description: 'The binder whose money is being corrected.' },
      amount: { type: 'string' }, direction: { type: 'string', enum: ['in', 'out'] },
      amount_received: { type: 'string' }, amount_pending: { type: 'string' },
      payment_status: { type: 'string', description: 'Where the money stands, in your own word (claimed, outstanding, partial, received, refunded).' },
    }, required: ['binder_id'] } },
  { name: 'kriya_date',
    description: 'Record a date on a binder (YYYY-MM-DD). Omit binder_id to start a new binder; give binder_id to add the date to an existing one.',
    input_schema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD.' }, binder_id: { type: 'string' } }, required: ['date'] } },
  { name: 'kriya_client',
    description: 'Record a client/person name on a binder. Omit binder_id to start a new binder; give binder_id to attach the client to an existing one.',
    input_schema: { type: 'object', properties: { client: { type: 'string' }, binder_id: { type: 'string' } }, required: ['client'] } },
  { name: 'kriya_note',
    description: "Write the note on a binder — what this binder is, a decision, a preference, an enquiry, in plain words. The note holds the CURRENT TRUTH: what you write here stands, replacing whatever was there. (To grow the note instead — keeping old lines and adding beneath — use kriya_note_append.) Omit binder_id to start a new binder.",
    input_schema: { type: 'object', properties: { note: { type: 'string' }, binder_id: { type: 'string' } }, required: ['note'] } },
  { name: 'kriya_note_append',
    description: 'Add a line to a binder note, keeping what already stands (the note grows). Always needs binder_id.',
    input_schema: { type: 'object', properties: { note: { type: 'string' }, binder_id: { type: 'string' } }, required: ['note', 'binder_id'] } },
  { name: 'kriya_phone',
    description: 'Record a phone number on a binder. Omit binder_id to start a new binder.',
    input_schema: { type: 'object', properties: { phone: { type: 'string' }, binder_id: { type: 'string' } }, required: ['phone'] } },
  { name: 'kriya_stage',
    description: "Record the stage of a binder in your own word (e.g. lead, contacted, quoted, client, lost). Free text — the owner's word is the truth. Omit binder_id to start a new binder.",
    input_schema: { type: 'object', properties: { stage: { type: 'string' }, binder_id: { type: 'string' } }, required: ['stage'] } },
  { name: 'kriya_doc',
    description: 'Record a document reference (storage ref) on a binder. Omit binder_id to start a new binder.',
    input_schema: { type: 'object', properties: { doc_ref: { type: 'string' }, binder_id: { type: 'string' } }, required: ['doc_ref'] } },
  { name: 'kriya_reasonforaction_append',
    description: "Add a line to the binder's reason-for-action diary — why you did what you did. Always accumulates, never erased. Needs binder_id.",
    input_schema: { type: 'object', properties: { reason_for_action: { type: 'string' }, binder_id: { type: 'string' } }, required: ['reason_for_action', 'binder_id'] } },
  { name: 'kriya_hide',
    description: 'Archive a binder (set aside, never out) — moves it from the live picture, still findable. Needs binder_id.',
    input_schema: { type: 'object', properties: { binder_id: { type: 'string' } }, required: ['binder_id'] } },
  { name: 'kriya_unarchive',
    description: 'Bring an archived binder back into the live picture. Needs binder_id.',
    input_schema: { type: 'object', properties: { binder_id: { type: 'string' } }, required: ['binder_id'] } },
  { name: 'kriya_edit',
    description: "Edit the non-money cells of an existing binder: client, date, stage, phone, doc_ref — and the note, WHICH GROWS: a note written here is added beneath what already stands, so the binder's story accumulates instead of being erased (to rewrite the note clean to current truth, use kriya_note). Money cells are not edited here — money corrections go through kriya_money_edit, the one witnessed door. Always needs binder_id.",
    input_schema: { type: 'object', properties: {
      binder_id: { type: 'string' },
      client: { type: 'string' }, date: { type: 'string' },
      note: { type: 'string', description: 'A line added beneath the existing note — the story grows.' },
      phone: { type: 'string' }, doc_ref: { type: 'string' }, stage: { type: 'string' },
      reason_for_action: { type: 'string', description: 'Note-to-self; appends, never overwrites.' },
    }, required: ['binder_id'] } },
  { name: 'kriya_repeatfollowup',
    description: "Set a binder to come BACK on a date — a follow-up that resurfaces when it's due (a deadline to chase, a payment to confirm, a check-in). Give follow_on (YYYY-MM-DD: when it should return to attention) and why (a short line: what to do then). For something that RECURS — a monthly retainer, a quarterly check-in — also give repeat ('1 month', '7 days'): when it comes due and is handled, it sets its own next date. This is what makes a stored date actually return. Needs binder_id.",
    input_schema: { type: 'object', properties: {
      binder_id: { type: 'string', description: 'The binder this follow-up belongs to.' },
      follow_on: { type: 'string', description: 'YYYY-MM-DD — when this should come back to attention.' },
      why: { type: 'string', description: 'Short line: what needs doing when it returns.' },
      repeat: { type: 'string', description: "Recurrence rhythm if it repeats: '1 month', '7 days'. Omit for one-time." },
    }, required: ['binder_id', 'follow_on'] } },
  { name: 'kriya_merge',
    description: "Merge two binders that are the same thing into one — when a client got logged twice and the truth is split across both. Name which binder SURVIVES (survivor_id) and which is RETIRED (retire_id), and give the values that should stand on the survivor — cell by cell, your judgment decides what is true. Anything you name is written onto the survivor; anything you don't name keeps the survivor's existing value. The retired binder is set aside (hidden, never destroyed) with a breadcrumb saying where it went, recoverable via kriya_unarchive. Read both first (kriya_find / kriya_history) before you decide what survives.",
    input_schema: { type: 'object', properties: {
      survivor_id: { type: 'string', description: 'The binder that stays — merging INTO.' },
      retire_id: { type: 'string', description: 'The duplicate to retire after its truth is folded in.' },
      client: { type: 'string' }, amount: { type: 'string' }, direction: { type: 'string', enum: ['in', 'out'] },
      date: { type: 'string' }, note: { type: 'string' }, phone: { type: 'string' },
      doc_ref: { type: 'string' }, stage: { type: 'string' },
      amount_received: { type: 'string' }, amount_pending: { type: 'string' }, payment_status: { type: 'string' },
      reason_for_action: { type: 'string', description: 'Your note-to-self on the survivor about what you merged and why.' },
    }, required: ['survivor_id', 'retire_id'] } },
  { name: 'kriya_split',
    description: "Split one binder that turns out to be TWO real things — when two people or matters got tangled into one (a shared name, a contradiction of phone or city that means two real people). Name the source binder (source_id) and give the cells that belong to the SECOND thing — those open a brand-new binder, and a dated line is left on both saying what was separated and where it went. The source keeps everything it has; afterward correct it with kriya_edit if any cell truly belonged to the one that left. The mirror of kriya_merge. Read it first (kriya_find / kriya_history) before you separate.",
    input_schema: { type: 'object', properties: {
      source_id: { type: 'string', description: 'The tangled binder being split — it stays, minus what you separate out.' },
      client: { type: 'string', description: "The second entity's name — goes on the NEW binder." },
      amount: { type: 'string' }, direction: { type: 'string', enum: ['in', 'out'] },
      date: { type: 'string' }, note: { type: 'string' }, phone: { type: 'string' },
      doc_ref: { type: 'string' }, stage: { type: 'string' },
      amount_received: { type: 'string' }, amount_pending: { type: 'string' }, payment_status: { type: 'string' },
      reason_for_action: { type: 'string', description: 'Your note-to-self on the NEW binder about why it was separated.' },
    }, required: ['source_id'] } },
];

// ── Executor ─────────────────────────────────────────────────────────────────
// Contract mirrors the dream-os tool pattern: (supabase, vendorId, name, input).
async function executeKriyaTool(supabase, vendorId, name, input) {
  const rid = input && input.binder_id ? String(input.binder_id) : undefined;
  const today = new Date().toISOString().slice(0, 10);

  switch (name) {
    case 'kriya_money': {
      const parsed = parseMoney(input.amount);
      if (parsed == null) return { display: `ERROR: could not read the amount "${input.amount}". Give plain rupees or notation (2.5L, 90k, 1.2cr).`, error: true };
      const dirIn = input.direction === 'in' || input.direction === 'out' ? input.direction : null;
      if (!dirIn) return { display: 'ERROR: kriya_money needs direction (in or out).', error: true };
      if (rid) {
        const { data: existing } = await supabase
          .from('binders').select('amount, direction').eq('id', rid).eq('vendor_id', vendorId).maybeSingle();
        if (existing && existing.amount != null) {
          // WITNESSED REPLACE — money is never silently lost.
          const oldLine = `${moneyWords(existing.amount)}${existing.direction ? ' ' + existing.direction : ''}`;
          const newLine = `${moneyWords(parsed)} ${dirIn}`;
          return writeFields(
            supabase, vendorId, rid,
            { amount: parsed, direction: dirIn, note: `[money replaced ${today}] ${oldLine} → ${newLine}.` },
            `money replaced: ${oldLine} → ${newLine}`,
            new Set(['note'])
          );
        }
      }
      return writeFields(supabase, vendorId, rid, { amount: parsed, direction: dirIn }, `money ${moneyWords(parsed)} ${dirIn}`);
    }
    case 'kriya_money_edit': {
      if (!rid) return { display: 'ERROR: kriya_money_edit needs binder_id.', error: true };
      const { data: existing } = await supabase
        .from('binders').select('amount, direction, amount_received, amount_pending, payment_status')
        .eq('id', rid).eq('vendor_id', vendorId).maybeSingle();
      if (!existing) return { display: `ERROR: no binder ${rid} for this owner.`, error: true };
      const fields = {};
      const confessions = [];
      const num = (v) => (v == null ? null : parseMoney(v));
      const moneyKeys = ['amount', 'amount_received', 'amount_pending'];
      for (const k of moneyKeys) {
        if (k in input && input[k] != null) {
          const parsed = num(input[k]);
          if (parsed == null) return { display: `ERROR: could not read ${k} "${input[k]}".`, error: true };
          const oldV = existing[k];
          confessions.push(`${k}: ${oldV == null ? '—' : moneyWords(oldV)} → ${moneyWords(parsed)}`);
          fields[k] = parsed;
        }
      }
      if ('direction' in input && (input.direction === 'in' || input.direction === 'out')) {
        if (existing.direction !== input.direction) confessions.push(`direction: ${existing.direction || '—'} → ${input.direction}`);
        fields.direction = input.direction;
      }
      if ('payment_status' in input && input.payment_status) {
        if (existing.payment_status !== input.payment_status) confessions.push(`payment: ${existing.payment_status || '—'} → ${input.payment_status}`);
        fields.payment_status = input.payment_status;
      }
      if (!Object.keys(fields).length) return { display: 'ERROR: kriya_money_edit needs at least one money cell to change.', error: true };
      const confess = confessions.join('; ');
      fields.note = `[money corrected ${today}] ${confess}.`;
      return writeFields(supabase, vendorId, rid, fields, `money corrected: ${confess}`, new Set(['note']));
    }
    case 'kriya_date':       return writeFields(supabase, vendorId, rid, { date: input.date }, `date ${input.date}`);
    case 'kriya_client':     return writeFields(supabase, vendorId, rid, { client: input.client }, `client ${input.client}`);
    case 'kriya_note':       return writeFields(supabase, vendorId, rid, { note: input.note }, 'note');
    case 'kriya_note_append':return writeFields(supabase, vendorId, rid, { note: input.note }, 'note line added', new Set(['note']));
    case 'kriya_phone':      return writeFields(supabase, vendorId, rid, { phone: input.phone }, 'phone');
    case 'kriya_stage':      return writeFields(supabase, vendorId, rid, { stage: input.stage }, `stage ${input.stage}`);
    case 'kriya_doc':        return writeFields(supabase, vendorId, rid, { doc_ref: input.doc_ref }, 'doc');
    case 'kriya_reasonforaction_append':
      return writeFields(supabase, vendorId, rid, { reason_for_action: input.reason_for_action }, 'reason-for-action noted');
    case 'kriya_hide': {
      if (!rid) return { display: 'ERROR: kriya_hide needs binder_id.', error: true };
      const { data, error } = await supabase.from('binders')
        .update({ hidden: true, hidden_at: new Date().toISOString() })
        .eq('id', rid).eq('vendor_id', vendorId).select('id').single();
      if (error) return { display: `ERROR archiving binder: ${error.message}`, error: true };
      await logEvent(supabase, vendorId, 'hide', data.id, 'archived');
      return { display: `Binder ${data.id} archived (set aside, still findable).`, mutated: true };
    }
    case 'kriya_unarchive': {
      if (!rid) return { display: 'ERROR: kriya_unarchive needs binder_id.', error: true };
      const { data, error } = await supabase.from('binders')
        .update({ hidden: false, hidden_at: null })
        .eq('id', rid).eq('vendor_id', vendorId).select('id').single();
      if (error) return { display: `ERROR unarchiving binder: ${error.message}`, error: true };
      await logEvent(supabase, vendorId, 'unarchive', data.id, 'brought back to live');
      return { display: `Binder ${data.id} back in the live picture.`, mutated: true, binder_id: data.id };
    }
    case 'kriya_edit': {
      if (!rid) return { display: 'ERROR: kriya_edit needs binder_id.', error: true };
      const patch = {};
      for (const k of ['client', 'date', 'note', 'phone', 'doc_ref', 'stage', 'reason_for_action']) {
        if (k in input) patch[k] = input[k];
      }
      const moneyKeys = ['amount', 'direction', 'amount_received', 'amount_pending', 'payment_status'].filter((k) => k in input);
      if (moneyKeys.length && !Object.keys(patch).length) {
        return { display: `REFUSED — money cells (${moneyKeys.join(', ')}) are not edited here. Money corrections go through kriya_money_edit, the one witnessed door.`, error: true };
      }
      if (!Object.keys(patch).length) return { display: 'ERROR: kriya_edit needs at least one cell to change.', error: true };
      const dropped = moneyKeys.length ? ` (money cells ${moneyKeys.join(', ')} NOT touched — those go through kriya_money_edit)` : '';
      // note GROWS here, reason_for_action always appends.
      return writeFields(supabase, vendorId, rid, patch, `edited ${Object.keys(patch).join(', ')}${dropped}`, new Set(['note']));
    }
    case 'kriya_repeatfollowup': {
      if (!rid) return { display: 'ERROR: kriya_repeatfollowup needs binder_id.', error: true };
      const followOn = typeof input.follow_on === 'string' ? input.follow_on.trim() : '';
      if (!followOn) return { display: 'ERROR: kriya_repeatfollowup needs follow_on (YYYY-MM-DD).', error: true };
      const fields = { followup_on: followOn };
      if (typeof input.why === 'string' && input.why.trim()) fields.followup_note = input.why.trim();
      if (typeof input.repeat === 'string' && input.repeat.trim()) fields.repeat_every = input.repeat.trim();
      const rpt = fields.repeat_every ? `, repeats ${fields.repeat_every}` : '';
      return writeFields(supabase, vendorId, rid, fields, `follow-up on ${followOn}${rpt}`);
    }
    case 'kriya_merge': {
      const survivorId = typeof input.survivor_id === 'string' ? input.survivor_id.trim() : '';
      const retireId = typeof input.retire_id === 'string' ? input.retire_id.trim() : '';
      if (!survivorId || !retireId) return { display: 'ERROR: kriya_merge needs survivor_id and retire_id.', error: true };
      if (survivorId === retireId) return { display: 'ERROR: survivor_id and retire_id are the same binder.', error: true };
      const patch = {};
      for (const k of ['client', 'direction', 'date', 'note', 'phone', 'doc_ref', 'stage', 'payment_status', 'reason_for_action']) {
        if (k in input) patch[k] = input[k];
      }
      for (const k of ['amount', 'amount_received', 'amount_pending']) {
        if (k in input) {
          const parsed = parseMoney(input[k]);
          if (parsed == null) return { display: `ERROR: could not read ${k} "${String(input[k])}".`, error: true };
          patch[k] = parsed;
        }
      }
      if (Object.keys(patch).length) {
        const survivorOutcome = await writeFields(supabase, vendorId, survivorId, patch, `merged from ${retireId}`);
        if (survivorOutcome.error) return survivorOutcome;
      }
      const { data: prior } = await supabase.from('binders')
        .select('reason_for_action').eq('id', retireId).eq('vendor_id', vendorId).single();
      const existingReason = ((prior && prior.reason_for_action) || '').trim();
      const breadcrumb = `Merged into ${survivorId} on ${today} — set aside, recoverable.`;
      const mergedReason = existingReason ? `${existingReason}\n${breadcrumb}` : breadcrumb;
      const { error: retErr } = await supabase.from('binders')
        .update({ hidden: true, hidden_at: new Date().toISOString(), reason_for_action: mergedReason, updated_at: new Date().toISOString() })
        .eq('id', retireId).eq('vendor_id', vendorId);
      if (retErr) return { display: `Survivor updated, but ERROR retiring ${retireId}: ${retErr.message}`, error: true };
      await logEvent(supabase, vendorId, 'merge_retire', retireId, `merged into ${survivorId}, set aside`);
      return { display: `Merged ${retireId} into ${survivorId} — ${Object.keys(patch).length ? Object.keys(patch).join(', ') + ' folded onto survivor; ' : ''}duplicate set aside (recoverable).`, mutated: true, binder_id: survivorId };
    }
    case 'kriya_split': {
      const sourceId = typeof input.source_id === 'string' ? input.source_id.trim() : '';
      if (!sourceId) return { display: 'ERROR: kriya_split needs source_id.', error: true };
      const { data: src, error: srcErr } = await supabase.from('binders')
        .select('id, reason_for_action').eq('id', sourceId).eq('vendor_id', vendorId).single();
      if (srcErr || !src) return { display: `ERROR: source binder ${sourceId} not found.`, error: true };
      const newFields = {};
      for (const k of ['client', 'direction', 'date', 'note', 'phone', 'doc_ref', 'stage', 'payment_status']) {
        if (k in input) newFields[k] = input[k];
      }
      for (const k of ['amount', 'amount_received', 'amount_pending']) {
        if (k in input) {
          const parsed = parseMoney(input[k]);
          if (parsed == null) return { display: `ERROR: could not read ${k} "${String(input[k])}".`, error: true };
          newFields[k] = parsed;
        }
      }
      if (Object.keys(newFields).length === 0) return { display: 'ERROR: kriya_split needs at least one cell for the new binder.', error: true };
      const newReason = typeof input.reason_for_action === 'string' && input.reason_for_action.trim()
        ? `${input.reason_for_action.trim()}\nSplit from ${sourceId} on ${today}.`
        : `Split from ${sourceId} on ${today}.`;
      const created = await writeFields(supabase, vendorId, undefined, { ...newFields, reason_for_action: newReason }, `split from ${sourceId}`);
      if (created.error) return created;
      const newId = created.binder_id || '(unknown)';
      const existing = ((src.reason_for_action) || '').trim();
      const crumb = `Split: ${newId} separated from this binder on ${today}.`;
      const { error: crumbErr } = await supabase.from('binders')
        .update({ reason_for_action: existing ? `${existing}\n${crumb}` : crumb, updated_at: new Date().toISOString() })
        .eq('id', sourceId).eq('vendor_id', vendorId);
      if (crumbErr) return { display: `New binder ${newId} created, but ERROR marking source: ${crumbErr.message}`, error: true };
      await logEvent(supabase, vendorId, 'split_out', sourceId, `split: ${newId} separated out`);
      return { display: `Split ${sourceId}: new binder ${newId} opened with ${Object.keys(newFields).join(', ')}; both binders carry the trail.`, mutated: true, binder_id: newId };
    }
    default:
      return { display: `ERROR: unknown tool ${name}.`, error: true };
  }
}

module.exports = {
  KRIYA_TOOLS,
  executeKriyaTool,
  // exported for kriya_find / kriya_tally / kriya_history (next file) and tests
  parseMoney, moneyWords, inr, binderLine, SELECT,
};
