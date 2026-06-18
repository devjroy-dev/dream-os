// ─────────────────────────────────────────────────────────────────────────────
// src/agent/kriyaRead.js
// Kriya's eyes — the read hands. JS port of dreamai's donnaFind + donnaBench,
// focused on the vendor binder (binders table, vendor_id), audit from binder_events.
//
//   kriya_find    — wide-net search before a write; matched-on metadata; archived
//                   always shown; never a dead end (falls back to most recent).
//   kriya_tally   — deterministic totals over a slice; lists contributing rows with
//                   ids; amount-less rows declared, never silently skipped.
//   kriya_history — one binder's whole story: cells now, the diary, the write log.
//
// Read-only. The tool name is the whole interface.
'use strict';

const { moneyWords } = require('./kriyaPrimitives');

const FIND_SELECT = 'id, amount, client, date, direction, doc_ref, note, phone, stage, amount_received, amount_pending, payment_status, reason_for_action, hidden';
const TALLY_SELECT = 'id, client, amount, direction, amount_received, amount_pending, payment_status, date, stage, note, doc_ref, phone, hidden';
const HISTORY_SELECT = 'id, client, amount, direction, amount_received, amount_pending, payment_status, date, stage, note, doc_ref, phone, reason_for_action, followup_on, followup_note, repeat_every, hidden, hidden_at, created_at, updated_at';

const FIND_LIMIT = 12;
const TALLY_FETCH_LIMIT = 500;
const TALLY_LIST_LIMIT = 25;

const KRIYA_READ_TOOLS = [
  { name: 'kriya_find',
    description: "Look in the cabinet before you write. Casts a WIDE net: give any names or terms you have — a person, a company, a fragment — and it returns the plausible matching binders, best match first, WITH their ids, for you to judge which (if any) is the one. Each term is matched across every field (client, note, doc, phone), so a term finds its binder even if it was filed under a different field; a term that matches is enough, extra terms only sharpen ranking and never shrink the net. Each result shows which field your term matched on, so a binder that merely mentions a name in its note is never mistaken for the binder OF that name. Archived binders are ALWAYS included, tagged [ARCHIVED]. If nothing matches you still get the most recent binders, so a missing or differently-filed name is never a dead end. With nothing given, returns the most recent binders.",
    input_schema: { type: 'object', properties: {
      client: { type: 'string', description: 'A name/person/company/term. Matched across all text fields, not just client.' },
      note: { type: 'string', description: 'Another term — ORed with the others; widens the net, never narrows it.' },
      stage: { type: 'string', description: 'Nudge ranking toward this stage.' },
      date: { type: 'string', description: 'Match binders on this exact date (YYYY-MM-DD).' },
      include_hidden: { type: 'boolean', description: 'Also return archived binders. Default false.' },
    } } },
  { name: 'kriya_tally',
    description: "Have totals COMPUTED over a slice — never sum in your head; this hand does the arithmetic exactly. Name the slice with any of: a term (matched across client/note/doc/phone), a stage, a direction (in/out), a date range. Returns the count and the computed totals — money in, money out, received, pending — AND lists the rows that went into the sum with their ids, so you see exactly what was counted. Rows with no amount are declared (counted as records, excluded from money totals). Archived excluded unless asked. Use whenever a number spans more than one binder.",
    input_schema: { type: 'object', properties: {
      term: { type: 'string' }, stage: { type: 'string' },
      direction: { type: 'string', enum: ['in', 'out'] },
      date_from: { type: 'string' }, date_to: { type: 'string' },
      include_hidden: { type: 'boolean' },
    } } },
  { name: 'kriya_history',
    description: "Open one binder's whole story — every filled cell as it stands now, your diary on it (every reason-for-action line, in order), when it was created and last touched, whether it's set aside, and the log of every confirmed write that touched it, dated. The hand for 'how do you know that'. Needs binder_id.",
    input_schema: { type: 'object', properties: { binder_id: { type: 'string' } }, required: ['binder_id'] } },
  { name: 'kriya_whatsdue',
    description: "What's due or overdue right now — the binders whose follow-up date has arrived (today or earlier), so nothing slips. Use it when Myra asks what's coming up / what's pending / what needs chasing, or to lead the day with what matters. Optionally give 'through' (YYYY-MM-DD) to look ahead to a date (e.g. end of the week) instead of just today. Returns the due binders with their ids, soonest first.",
    input_schema: { type: 'object', properties: {
      through: { type: 'string', description: "Look ahead through this date (YYYY-MM-DD). Omit to see what's due as of today." },
    } } },
];

const KRIYA_READ_NAMES = new Set(KRIYA_READ_TOOLS.map((t) => t.name));

// ── find ─────────────────────────────────────────────────────────────────────
function matchedOn(r, terms) {
  const fields = ['client', 'note', 'doc_ref', 'phone'];
  for (const t of terms) {
    const lc = t.toLowerCase();
    for (const f of fields) {
      if (r[f] && String(r[f]).toLowerCase().includes(lc)) return f === 'doc_ref' ? 'doc' : f;
    }
  }
  return null;
}

async function executeFind(supabase, vendorId, input) {
  const terms = [];
  if (typeof input.client === 'string' && input.client.trim()) terms.push(input.client.trim());
  if (typeof input.note === 'string' && input.note.trim()) terms.push(input.note.trim());
  const includeHidden = input.include_hidden === true;

  let q = supabase.from('binders').select(FIND_SELECT).eq('vendor_id', vendorId);
  if (!includeHidden) {
    // archived ALWAYS shown when searching by term (nothing hidden from search);
    // only the empty/recent fallback respects the live picture.
  }
  if (terms.length) {
    const conds = [];
    for (const t of terms) {
      const esc = t.replace(/[%_,]/g, ' ').trim();
      conds.push(`client.ilike.%${esc}%`, `note.ilike.%${esc}%`, `doc_ref.ilike.%${esc}%`, `phone.ilike.%${esc}%`);
    }
    q = q.or(conds.join(','));
  } else if (!includeHidden) {
    q = q.eq('hidden', false);
  }
  q = q.order('updated_at', { ascending: false }).limit(FIND_LIMIT);

  const { data, error } = await q;
  if (error) return { display: `ERROR searching: ${error.message}` };
  let rows = data || [];

  // Never a dead end: if a term found nothing, return the most recent binders.
  let fellBack = false;
  if (terms.length && rows.length === 0) {
    const { data: recent } = await supabase.from('binders').select(FIND_SELECT)
      .eq('vendor_id', vendorId).eq('hidden', false)
      .order('updated_at', { ascending: false }).limit(FIND_LIMIT);
    rows = recent || [];
    fellBack = true;
  }

  const lines = [];
  if (terms.length && !fellBack) lines.push(`FIND "${terms.join(' / ')}" — ${rows.length} match${rows.length === 1 ? '' : 'es'}, best first:`);
  else if (fellBack) lines.push(`No binder matched "${terms.join(' / ')}". Most recent binders instead (so you're never stuck):`);
  else lines.push(`Most recent binders:`);

  for (const r of rows) {
    const bits = [];
    if (r.client) bits.push(r.client);
    if (r.amount != null) bits.push(`Rs ${r.amount}${r.direction ? ' ' + r.direction : ''}`);
    if (r.stage) bits.push(r.stage);
    if (r.date) bits.push(r.date);
    const mo = terms.length ? matchedOn(r, terms) : null;
    const moTag = mo ? ` (matched on: ${mo})` : '';
    const arch = r.hidden ? ' [ARCHIVED]' : '';
    lines.push(`  - ${r.id} — ${bits.join(' · ') || 'binder'}${moTag}${arch}`);
  }
  if (rows.length === 0) lines.push('  Cabinet is empty — no binders yet.');
  return { display: lines.join('\n') };
}

// ── tally ─────────────────────────────────────────────────────────────────────
async function executeTally(supabase, vendorId, input) {
  const term = typeof input.term === 'string' ? input.term.trim() : '';
  const stage = typeof input.stage === 'string' ? input.stage.trim() : '';
  const direction = input.direction === 'in' || input.direction === 'out' ? input.direction : '';
  const dateFrom = typeof input.date_from === 'string' ? input.date_from.trim() : '';
  const dateTo = typeof input.date_to === 'string' ? input.date_to.trim() : '';
  const includeHidden = input.include_hidden === true;

  let q = supabase.from('binders').select(TALLY_SELECT).eq('vendor_id', vendorId);
  if (!includeHidden) q = q.eq('hidden', false);
  if (term) {
    const esc = term.replace(/[%_,]/g, ' ').trim();
    q = q.or(`client.ilike.%${esc}%,note.ilike.%${esc}%,doc_ref.ilike.%${esc}%,phone.ilike.%${esc}%`);
  }
  if (stage) q = q.ilike('stage', stage);
  if (direction) q = q.eq('direction', direction);
  if (dateFrom) q = q.gte('date', dateFrom);
  if (dateTo) q = q.lte('date', dateTo);
  q = q.limit(TALLY_FETCH_LIMIT);

  const { data, error } = await q;
  if (error) return { display: `ERROR tallying: ${error.message}` };
  const rows = data || [];

  let sumIn = 0, sumOut = 0, sumReceived = 0, sumPending = 0, withoutAmount = 0;
  for (const r of rows) {
    if (r.amount != null) { if (r.direction === 'out') sumOut += r.amount; else sumIn += r.amount; }
    else withoutAmount++;
    if (r.amount_received != null) sumReceived += r.amount_received;
    if (r.amount_pending != null) sumPending += r.amount_pending;
  }

  const sliceBits = [];
  if (term) sliceBits.push(`term "${term}"`);
  if (stage) sliceBits.push(`stage ${stage}`);
  if (direction) sliceBits.push(`direction ${direction}`);
  if (dateFrom || dateTo) sliceBits.push(`dated ${dateFrom || '…'}→${dateTo || '…'}`);
  if (includeHidden) sliceBits.push('archived included');
  const slice = sliceBits.length ? sliceBits.join(', ') : 'whole cabinet';

  const lines = [];
  lines.push(`TALLY (${slice}) — computed over ${rows.length} binder${rows.length === 1 ? '' : 's'}:`);
  lines.push(`  money in: ${moneyWords(sumIn)} · money out: ${moneyWords(sumOut)} · received: ${moneyWords(sumReceived)} · pending: ${moneyWords(sumPending)}`);
  if (withoutAmount > 0) lines.push(`  note: ${withoutAmount} binder${withoutAmount === 1 ? '' : 's'} in this slice carry no amount — counted above, excluded from money totals.`);
  if (rows.length >= TALLY_FETCH_LIMIT) lines.push(`  note: capped at ${TALLY_FETCH_LIMIT} rows — narrow the slice for an exact total.`);
  for (const r of rows.slice(0, TALLY_LIST_LIMIT)) {
    const bits = [];
    if (r.client) bits.push(r.client);
    if (r.amount != null) bits.push(`Rs ${r.amount}${r.direction ? ' ' + r.direction : ''}`);
    if (r.amount_received != null) bits.push(`recv Rs ${r.amount_received}`);
    if (r.amount_pending != null) bits.push(`pend Rs ${r.amount_pending}`);
    if (r.date) bits.push(r.date);
    if (r.hidden) bits.push('[ARCHIVED]');
    lines.push(`  - ${r.id} — ${bits.join(' · ') || 'binder'}`);
  }
  if (rows.length > TALLY_LIST_LIMIT) lines.push(`  …and ${rows.length - TALLY_LIST_LIMIT} more in the count.`);
  if (rows.length === 0) lines.push('  No binders match this slice.');
  return { display: lines.join('\n') };
}

// ── history ───────────────────────────────────────────────────────────────────
async function executeHistory(supabase, vendorId, input) {
  const binderId = typeof input.binder_id === 'string' ? input.binder_id.trim() : '';
  if (!binderId) return { display: 'ERROR: kriya_history needs binder_id.' };

  const { data: r, error } = await supabase.from('binders').select(HISTORY_SELECT)
    .eq('id', binderId).eq('vendor_id', vendorId).single();
  if (error || !r) return { display: `ERROR opening history: ${(error && error.message) || 'binder not found'}` };

  const { data: ev } = await supabase.from('binder_events')
    .select('action, summary, created_at')
    .eq('vendor_id', vendorId).eq('binder_id', binderId)
    .order('created_at', { ascending: true }).limit(50);
  const events = ev || [];

  const lines = [];
  lines.push(`BINDER ${r.id}${r.hidden ? ' [ARCHIVED]' : ''} — the story as it stands:`);
  const cells = [];
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
    for (const ln of String(r.reason_for_action).split('\n')) if (ln.trim()) lines.push(`    · ${ln.trim()}`);
  }
  lines.push(`  created ${String(r.created_at).slice(0, 10)} · last touched ${String(r.updated_at).slice(0, 10)}${r.hidden_at ? ` · set aside ${String(r.hidden_at).slice(0, 10)}` : ''}`);
  if (events.length) {
    lines.push('  writes (the event log, oldest first):');
    for (const e of events) lines.push(`    ${String(e.created_at).slice(0, 10)} — ${e.summary || e.action || 'write'}`);
  } else {
    lines.push('  writes: no event log on this binder yet.');
  }
  return { display: lines.join('\n') };
}

async function executeKriyaRead(supabase, vendorId, name, input, today) {
  switch (name) {
    case 'kriya_find':    return executeFind(supabase, vendorId, input);
    case 'kriya_tally':   return executeTally(supabase, vendorId, input);
    case 'kriya_history': return executeHistory(supabase, vendorId, input);
    case 'kriya_whatsdue': return executeWhatsDue(supabase, vendorId, input, today);
    default: return { display: `ERROR: unknown read tool ${name}.` };
  }
}

// ── whatsdue ──────────────────────────────────────────────────────────────────
async function executeWhatsDue(supabase, vendorId, input, today) {
  const todayIso = today || new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
  const through = typeof input.through === 'string' && input.through.trim() ? input.through.trim() : todayIso;
  const { data, error } = await supabase.from('binders')
    .select('id, client, followup_on, followup_note, repeat_every')
    .eq('vendor_id', vendorId).eq('hidden', false)
    .not('followup_on', 'is', null)
    .lte('followup_on', through)
    .order('followup_on', { ascending: true })
    .limit(FIND_LIMIT + 1);
  if (error) return { display: `ERROR checking what's due: ${error.message}` };
  const rows = data || [];
  if (rows.length === 0) {
    return { display: through === todayIso ? 'Nothing due as of today.' : `Nothing due through ${through}.` };
  }
  const shown = rows.slice(0, FIND_LIMIT);
  const lines = shown.map((r) => {
    const who = r.client ? ` ${r.client}` : '';
    const why = r.followup_note ? ` — ${r.followup_note}` : '';
    const rpt = r.repeat_every ? ` (repeats ${r.repeat_every})` : '';
    const overdue = r.followup_on && r.followup_on < todayIso ? ' [OVERDUE]' : '';
    return `  [${r.id}] due ${r.followup_on}${overdue}${who}${why}${rpt}`;
  });
  const header = `Due${through === todayIso ? ' now' : ` through ${through}`}: ${shown.length}${rows.length > FIND_LIMIT ? '+' : ''}`;
  return { display: `${header}\n${lines.join('\n')}` };
}

module.exports = { KRIYA_READ_TOOLS, KRIYA_READ_NAMES, executeKriyaRead };
