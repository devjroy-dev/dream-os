'use strict';
// src/lib/vendor/handResult.js  THE STRUCTURED RESULT OF A HAND. CE-44 LC-Victor P4a. ONE HOME.
//
// WHY. At P5 the door speaks for the hands (R-44.18): it acts on the listener's request and writes
// the reply from what happened. It must know what happened from a RESULT, never by parsing a
// display string (undoContract.js ran thirteen patterns over display text; F-44.30 was one of them
// reading the word "Invoice" as an invoice number). This file is that result's one shape.
//
// P4a IS DOOR-ONLY (chair's ruling on P4's read-first). The three hands P5 speaks for first are
// signals in the engine (recordPrimitives.ts:906 to :946 validate and write nothing); their outcome
// is born at the door: lifecycleHands.js for donna_booking and donna_milestone_paid, buildInvoices
// (chat.js) and its WhatsApp twin for donna_invoice_pdf. The engine-born hands are P4b.
//
// THE SHAPE: { hand, ok, code, ids, client?, amount_rupees?, on?, invoice_number?, line_key }
//   code      a CLOSED set per hand (CODES below); refusals carry a reason the door already knows.
//   ids       { lead_id?, record_id?, invoice_id? } where the door holds them.
//   on        an ISO date (YYYY-MM-DD) the door has validated, never a spoken one.
//   line_key  the key of the byte the door SPOKE for this result in lifecycleHands.js's LINES (the
//             lines' one home today), or null when it spoke no line. P4a mints nothing: a key that
//             is not a key of LINES is refused by validate(), and b88 holds that as a red cell.
//             The invoice sentence has no one home yet (two per-surface sentences, F-44.48 and
//             F-43.34, carried to P5), so an invoice result's line_key is null until P5 gives it one.
//
// TOTAL (e-12, CE-44): make(), the three builders, validate() and bookingRefusalCode() NEVER THROW,
// whatever they are handed. Fields are coerced behind a guard; the code's string is taken safely; an
// optional field that is not well-formed is DROPPED, not trusted; and anything that still fails, or a
// hand, code or line_key outside the closed sets, yields a minimal frozen result for that hand: ok false,
// code 'refused:result_unbuildable', line_key null, with a console.warn naming why. b88's fuzz cell holds
// it over a table of hostile inputs, and a mutation removing the guard turns it red.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const CODES = Object.freeze({
  donna_booking: Object.freeze([
    'booked', 'advance_recorded', 'refused:result_unbuildable',
    'refused:invalid_kind', 'refused:invalid_date',
    'refused:no_name', 'refused:not_found', 'refused:ambiguous', 'refused:read_failed',
    'refused:no_package', 'refused:no_fee', 'refused:bad_package', 'refused:invalid',
    'refused:not_promoted', 'refused:exception',
  ]),
  donna_milestone_paid: Object.freeze([
    'paid', 'paid_in_full', 'already_marked', 'absorbed', 'refused:result_unbuildable',
    'refused:invalid_date', 'refused:no_name', 'refused:not_found', 'refused:ambiguous',
    'refused:read_failed', 'refused:no_invoice', 'refused:schedule_read', 'refused:unreadable_paid_at',
    'refused:unmatched', 'refused:unavailable', 'refused:nothing_pending', 'refused:not_marked',
    'refused:exception',
  ]),
  // CE-44 LC-Victor P4b: the engine-born WRITE hands, each set read line by line from recordPrimitives.ts and
  // donnaLead.ts at 85fda3d (the pre-cut note). Their result is born IN the engine (ToolOutcome.result) and read
  // here by fromOutcome(); `unknown_tool` is the dispatcher's, not a hand's, so it is in no set.
  donna_money: Object.freeze(['created', 'updated', 'refused:write_failed', 'unchanged', 'replaced', 'refused:unreadable_amount', 'refused:missing_direction', 'refused:not_found', 'refused:exception', 'refused:result_unbuildable']),
  donna_money_edit: Object.freeze(['created', 'updated', 'refused:write_failed', 'unchanged', 'corrected', 'refused:missing_binder', 'refused:not_found', 'refused:unreadable_amount', 'refused:nothing_to_change', 'refused:exception', 'refused:result_unbuildable']),
  donna_date: Object.freeze(['created', 'updated', 'refused:write_failed', 'unchanged', 'refused:not_found', 'refused:exception', 'refused:result_unbuildable']),
  donna_client: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:v12', 'refused:exception', 'refused:result_unbuildable']),
  donna_lead: Object.freeze(['lead_created', 'lead_updated', 'unchanged', 'refused:no_owner', 'refused:read_failed', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_stage: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:missing_stage', 'refused:v12', 'refused:exception', 'refused:result_unbuildable']),
  donna_note: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:missing_note', 'refused:exception', 'refused:result_unbuildable']),
  donna_note_append: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:missing_binder', 'refused:missing_note', 'refused:exception', 'refused:result_unbuildable']),
  donna_phone: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_doc: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_write_reasonforaction_append: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_edit: Object.freeze(['created', 'updated', 'refused:write_failed', 'unchanged', 'refused:missing_binder', 'refused:money_not_here', 'refused:nothing_to_change', 'refused:not_found', 'refused:exception', 'refused:result_unbuildable']),
  donna_repeatfollowup: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:missing_binder', 'refused:missing_date', 'refused:exception', 'refused:result_unbuildable']),
  donna_hide: Object.freeze(['hidden', 'refused:missing_binder', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_retrieve: Object.freeze(['retrieved', 'refused:missing_binder', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_unarchive: Object.freeze(['retrieved', 'refused:missing_binder', 'refused:write_failed', 'refused:exception', 'refused:result_unbuildable']),
  donna_merge: Object.freeze(['created', 'updated', 'refused:write_failed', 'merged', 'refused:missing_ids', 'refused:same_record', 'refused:unreadable_amount', 'refused:partial', 'refused:exception', 'refused:result_unbuildable']),
  donna_split: Object.freeze(['created', 'updated', 'refused:write_failed', 'split', 'refused:missing_binder', 'refused:not_found', 'refused:unreadable_amount', 'refused:nothing_to_change', 'refused:partial', 'refused:exception', 'refused:result_unbuildable']),
  donna_invoice_pdf: Object.freeze([
    'minted', 'served', 'refused:result_unbuildable', 'refused:no_binder', 'refused:no_amount', 'refused:not_minted', 'refused:exception',
  ]),
});

// The keys each hand may name. Every non-null key must also be a key of lifecycleHands' LINES;
// b88 checks that against the live module, so this list cannot drift into a byte that does not exist.
const LINE_KEYS = Object.freeze({
  donna_booking: Object.freeze(['F29', 'D3', 'D4', null]),
  donna_milestone_paid: Object.freeze(['D3', 'D4', 'D5', 'D6', 'D7', 'D8', null]),
  donna_invoice_pdf: Object.freeze([null]),
  // P4b's write hands speak no door line yet (P5 gives them bytes); every result names none.
  donna_money: Object.freeze([null]),
  donna_money_edit: Object.freeze([null]),
  donna_date: Object.freeze([null]),
  donna_client: Object.freeze([null]),
  donna_lead: Object.freeze([null]),
  donna_stage: Object.freeze([null]),
  donna_note: Object.freeze([null]),
  donna_note_append: Object.freeze([null]),
  donna_phone: Object.freeze([null]),
  donna_doc: Object.freeze([null]),
  donna_write_reasonforaction_append: Object.freeze([null]),
  donna_edit: Object.freeze([null]),
  donna_repeatfollowup: Object.freeze([null]),
  donna_hide: Object.freeze([null]),
  donna_retrieve: Object.freeze([null]),
  donna_unarchive: Object.freeze([null]),
  donna_merge: Object.freeze([null]),
  donna_split: Object.freeze([null]),
});

// Not a failure and not a write: the payment already stands. `absorbed` is ok (this turn's own
// booking marked it and already said so, F-44.8).
const NOT_OK = new Set(['already_marked']);
function okFor(code) { return !String(code).startsWith('refused:') && !NOT_OK.has(code); }

function safeStr(v) {
  try { return typeof v === 'string' ? v : String(v); } catch (_e) { return ''; }
}
function warn(msg) { try { console.warn(msg); } catch (_e) { /* a console that throws is not ours to fix */ } }

function validate(r) {
  try {
    const why = [];
    if (!r || typeof r !== 'object') return ['not an object'];
    if (!Object.prototype.hasOwnProperty.call(CODES, r.hand)) why.push(`unknown hand ${safeStr(r.hand)}`);
    else {
      if (!CODES[r.hand].includes(r.code)) why.push(`code ${safeStr(r.code)} is not in ${r.hand}'s closed set`);
      if (!LINE_KEYS[r.hand].includes(r.line_key === undefined ? null : r.line_key)) why.push(`line_key ${safeStr(r.line_key)} is not one ${r.hand} may speak`);
    }
    if (r.ok !== okFor(r.code)) why.push(`ok ${safeStr(r.ok)} disagrees with code ${safeStr(r.code)}`);
    if (r.on != null && !ISO.test(safeStr(r.on))) why.push(`on ${safeStr(r.on)} is not an ISO date`);
    if (r.amount_rupees != null && !(Number.isInteger(r.amount_rupees) && r.amount_rupees >= 1)) why.push(`amount_rupees ${safeStr(r.amount_rupees)} is not a whole rupee figure of at least 1`);
    if (!r.ids || typeof r.ids !== 'object') why.push('ids missing');
    return why;
  } catch (_e) { return ['unreadable result']; }
}

// e-16 (CE-44): the HAND is taken as a name TOTALLY. A hand whose string conversion throws (an object whose
// toString and valueOf throw) used to reach `hasOwnProperty.call(CODES, hand)` unguarded, so the safety net
// itself threw. Now: a string is itself; anything else goes through String() inside a try; failing that, 'unknown'.
function handName(hand) {
  try { if (typeof hand === 'string') return hand; const s = String(hand); return typeof s === 'string' ? s : 'unknown'; } catch (_e) { return 'unknown'; }
}

function minimal(hand, why) {
  try {
    const h = handName(hand);
    warn(`[handResult] ${h}: result unbuildable (${safeStr(why)})`);
    return Object.freeze({ hand: h, ok: false, code: 'refused:result_unbuildable', ids: Object.freeze({}), line_key: null });
  } catch (_e) {
    return Object.freeze({ hand: 'unknown', ok: false, code: 'refused:result_unbuildable', ids: Object.freeze({}), line_key: null });
  }
}

// One scalar id: a non-empty string (or a finite number, taken as its string). Anything else is dropped.
function idOf(v) {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

function build(hand, code, fields) {
  const f = (fields && typeof fields === 'object' && !Array.isArray(fields)) ? fields : {};
  const c = safeStr(code);
  const ids = {};
  const fi = (f.ids && typeof f.ids === 'object') ? f.ids : {};
  for (const k of ['lead_id', 'record_id', 'invoice_id', 'retired_id', 'source_id']) { const v = idOf(fi[k]); if (v) ids[k] = v; }
  const lk = f.line_key === undefined || f.line_key === null ? null : (typeof f.line_key === 'string' ? f.line_key : undefined);
  const r = { hand, ok: okFor(c), code: c, ids: Object.freeze(ids), line_key: lk };
  if (typeof f.client === 'string' && f.client.trim()) r.client = f.client.trim();
  if (typeof f.amount_rupees === 'number' || (typeof f.amount_rupees === 'string' && f.amount_rupees.trim())) {
    const amt = Math.round(Number(f.amount_rupees));
    if (Number.isInteger(amt) && amt >= 1) r.amount_rupees = amt;
  }
  if (typeof f.on === 'string' && ISO.test(f.on.trim())) r.on = f.on.trim();
  if (typeof f.invoice_number === 'string' && f.invoice_number.trim()) r.invoice_number = f.invoice_number.trim();
  const why = validate(r);
  if (why.length) return minimal(hand, why.join('; '));
  return Object.freeze(r);
}

function make(hand, code, fields) {
  hand = handName(hand); // e-16: the hand guarded first; the line below is byte for byte as it was
  try { return build(hand, code, fields); } catch (e) { return minimal(hand, e && e.message); }
}

const booking = (code, fields) => make('donna_booking', code, fields);
const milestone = (code, fields) => make('donna_milestone_paid', code, fields);
const invoice = (code, fields) => make('donna_invoice_pdf', code, fields);

// promoteLead answers in HTTP shape (promotion.js:105 to :109, :376): a 422 `refused` carries its own
// code, a 422 `invalid` names a field, a 404 is no such lead, a 500 is a step that failed. TOTAL.
function bookingRefusalCode(res) {
  try {
    const b = (res && typeof res === 'object' && res.body && typeof res.body === 'object') ? res.body : {};
    const status = res && typeof res === 'object' ? res.status : undefined;
    const own = typeof b.code === 'string' ? `refused:${b.code}` : '';
    if (status === 422 && b.error === 'refused' && own && CODES.donna_booking.includes(own)) return own;
    if (status === 422 && b.error === 'invalid') return 'refused:invalid';
    if (status === 404) return 'refused:not_found';
    return 'refused:not_promoted';
  } catch (_e) { return 'refused:not_promoted'; }
}

// CE-44 LC-Victor P5: THE DOOR'S OWN LINE KEYS, validated against the door's one byte home
// (src/lib/vendor/doorLines.js) and NOT added to LINE_KEYS above, whose every key must be a key of
// lifecycleHands' LINES (b88 1.2). A door line the founder did not approve has no key here.
const DOOR_LINE_KEYS = Object.freeze(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'D1']);
function isDoorLineKey(k) { try { return typeof k === 'string' && DOOR_LINE_KEYS.includes(k); } catch (_e) { return false; } }

// CE-44 LC-Victor P4b: THE READER for an engine-born write hand. `outcome` is what executeRecordTool (or
// executeDonnaLead) returned, whole, as src/lib/executeAndPatch.js hands it back; its `result` is the engine's
// WriteResult. TOTAL: whatever it is handed, it returns a frozen result for `hand`; a missing or malformed
// result, a code outside the hand's closed set, or an `ok` that disagrees with the code yields the minimal
// result ('refused:result_unbuildable'). It never reads `display`.
function fromOutcome(hand, outcome) {
  try {
    const r = outcome && typeof outcome === 'object' ? outcome.result : null;
    if (!r || typeof r !== 'object') return minimal(hand, 'no result on the outcome');
    const code = typeof r.code === 'string' ? r.code : '';
    if (r.ok !== okFor(code)) return minimal(hand, `engine ok ${safeStr(r.ok)} disagrees with code ${safeStr(code)}`);
    return make(hand, code, { ids: r.ids, line_key: null });
  } catch (e) { return minimal(hand, e && e.message); }
}

module.exports = { CODES, LINE_KEYS, validate, make, booking, milestone, invoice, bookingRefusalCode, fromOutcome, DOOR_LINE_KEYS, isDoorLineKey };
