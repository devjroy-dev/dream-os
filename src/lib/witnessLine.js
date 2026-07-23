// src/lib/witnessLine.js — TDW_05 THE COUPLE-LANE MECHANICAL ARC, M1. F-05.34's limb.
//
// ── THE FINDING, and the layer the read-first moved it to ────────────────────
//
// F-05.34: a fabricated done on the couple wire — "Saved that." with tool_calls [].
// One specimen, re-probed 4/4 clean at the seal evening, so no rate exists and the
// cure is not a model cure. What the estate ruled instead is R-1's structural limb:
// A FILED TURN MUST BE VISIBLY DIFFERENT FROM A NARRATED ONE IN THIS LANE'S OWN
// THREAD HISTORY. The narrated turn sat in the next turn's history byte-
// indistinguishable from a filed one, and taught the shape.
//
// The charter placed the mechanism in engine `messages`. Re-derived at 5f2a79b it is
// one layer earlier and on the other plane:
//
//   brideEngine.js:142-148 replays public.messages, and its select reads
//       'direction, body, sent_by, created_at'
//   — tool_calls is NOT in the select. The outbound insert at brideInbound.js:570
//   PERSISTS result.toolCalls faithfully. The column is full; the replay never
//   looks at it. The indistinguishability is the SELECT, not the storage.
//
// ── THE RULED MECHANISM: A + C PAIRED (CE-67) ───────────────────────────────
//
//   C  the replay select widens to carry tool_calls — the model stops being blind
//      to its own hands, the cure exactly where the derivation put it.
//   A  the witness line rides the OUTBOUND BODY — because on WhatsApp "the thread"
//      that smoke card S4 asks the founder to read is the delivered message text on
//      his handset. A witness that lives only in a DB column is invisible to S4.
//
// THIS FILE IS THE ONE HOME BOTH SEAMS USE. The same function composes the footer at
// send time and RECONSTRUCTS it for replayed rows that predate the cure, so every
// assistant turn in the model's history is marked if and only if it actually filed —
// mechanically, from the row's own hands, NEVER from its prose. Prose is the thing
// being audited; a derivation that read prose would be the disease auditing itself.
//
// ── THE STRING, FOUNDER-LOCKED (V-4, CE-67 gates: "yes to all") ─────────────
//
//     "— Saved: <thing>, <detail>"
//     "— Saved: DJ Nashaa, Rs 80,000"      "— Saved: sangeet, 20 Dec"
//
// The SPECIFIC form won over a bare marker for a stated reason: it is the form that
// would have caught F-05.35's 10x write on the founder's own screen. A bride who is
// told "Rs 40,00,000" when she said four lakhs sees it in the second she reads it.
// That is why money renders in INDIAN grouping here — 4,00,000 reads as four lakh to
// the person who has to catch it, and 400,000 does not.
//
// ── THE GAP M1 DECLARED IS CLOSED (V-5, founder 「 A 」, CE relay) ───────────
// M1 shipped creates only and said so: "Saved:" is a false word for a deletion, and
// minting the honest verbs to widen a cure would have been shipping copy nobody
// approved. The gate closed on Proposal A, so update_* and delete_* now carry their
// own ruled receipts below, under the render-from-args law.
'use strict';

// The CREATE hands, enumerated from brideTools.js at this HEAD — never guessed.
// Every one returns the estate's { ok: true, <row> } dialect on success
// (brideEngine.js: :529 event · :606 task · :1122 booking · :1364 payment ·
//  :407 note · :1409 receipt · save_wedding_detail's own ok).
const FILING_HANDS = new Set([
  'add_booking', 'add_event', 'create_task',
  'record_payment', 'note_to_self', 'save_wedding_detail', 'save_receipt',
]);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-12-20" -> "20 Dec". Parsed by string, never by Date(), so a server in any
// timezone renders the date the bride typed rather than the date it was there.
function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return null;
  const mon = MONTHS[Number(m[2]) - 1];
  if (!mon) return null;
  return `${Number(m[3])} ${mon}`;
}

// Indian grouping: 80000 -> "80,000"; 400000 -> "4,00,000"; 4000000 -> "40,00,000".
// Hand-rolled rather than Intl-dependent — the grouping IS the safety property here
// and it must not vary with a runtime's locale data.
function rupees(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  const s = String(Math.round(v));
  if (s.length <= 3) return `Rs ${s}`;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts = [];
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest.length) parts.unshift(rest);
  return `Rs ${parts.join(',')},${last3}`;
}

function clip(s, n = 60) {
  const t = String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
  if (!t) return null;
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// One filed hand -> "<thing>, <detail>" (or "<thing>"), or null if it filed nothing.
// RESULT-FIRST, input only as fallback: the persisted row is what actually happened,
// and the arguments are only what was asked for. §2.2 sentence 1's own standard.
function describeHand(call) {
  if (!call || typeof call !== 'object') return null;
  const name = call.name;
  if (!FILING_HANDS.has(name)) return null;

  const r = call.result;
  // The witness requires an ok result. A hand that errored is not a filing, and
  // "an errored hand speaks the error" (§2.2 sentence 2) is the reply's job, not
  // this line's.
  if (!r || typeof r !== 'object' || r.ok !== true) return null;
  const input = (call.input && typeof call.input === 'object') ? call.input : {};

  switch (name) {
    case 'add_booking': {
      const b = r.booking || {};
      const who = clip(b.vendor_name || input.vendor_name);
      if (!who) return null;
      const amt = rupees(b.amount_total ?? input.amount_total) ||
                  rupees(b.amount_advance ?? input.amount_advance);
      return amt ? `${who}, ${amt}` : who;
    }
    case 'add_event': {
      const e = r.event || {};
      const what = clip(e.title || input.title);
      if (!what) return null;
      const when = shortDate(e.event_date || input.event_date);
      return when ? `${what}, ${when}` : what;
    }
    case 'create_task': {
      const t = r.task || {};
      const what = clip(t.title || input.title);
      if (!what) return null;
      const when = shortDate(t.due_date || input.due_date);
      return when ? `${what}, ${when}` : what;
    }
    case 'record_payment': {
      const b = r.booking || {};
      const who = clip(b.vendor_name);
      const amt = rupees(input.amount);
      if (who && amt) return `payment to ${who}, ${amt}`;
      if (amt) return `payment, ${amt}`;
      return who ? `payment to ${who}` : 'payment';
    }
    case 'note_to_self':
      return 'note';
    case 'save_receipt':
      return 'receipt';
    case 'save_wedding_detail': {
      const field = String(input.field || '').trim();
      if (field === 'budget_total') {
        const amt = rupees(input.value);
        return amt ? `budget, ${amt}` : 'budget';
      }
      if (field === 'wedding_date') {
        const when = shortDate(input.value);
        return when ? `wedding date, ${when}` : 'wedding date';
      }
      const label = clip(field.replace(/_/g, ' '), 30);
      return label ? `${label}` : null;
    }
    default:
      return null;
  }
}

const PREFIX = '— Saved: ';

// ── V-5 (founder-locked, CE relay: 「 A 」) · THE UPDATE AND REMOVAL RECEIPTS ─
//
// M1 shipped creates only, because "Saved:" is a false word for a deletion and the
// honest verbs would have been copy nobody had approved. The gate is now closed on
// Proposal A, and these two prefixes are LOCKED alongside their degrade forms.
//
// ── THE RENDER-FROM-ARGS LAW (the ruling's own words, and its teeth) ────────
// The footer derives ONLY from the hand's own WITNESSED toolCall record — its
// arguments and the row the door handed back — and NEVER from model prose. Where
// the renderer cannot produce an entity cleanly, it DEGRADES to the bare form.
// SPECIFIC-AND-TRUE OR BARE, NEVER SPECIFIC-AND-WRONG: a receipt naming the wrong
// sangeet is worse than a receipt naming none, because it spends her trust to tell
// her a lie she has no reason to check.
//
// READING STATED, because the ruling's phrasing and its own worked example pull in
// different directions and building on the wrong one would be silent adaptation:
// "arguments" is read as THE WITNESSED TOOLCALL RECORD (input AND result), never
// prose. The ruling's own example — "— Removed: sangeet, 20 Dec" — settles it:
// delete_event's arguments are `event_id` ALONE (brideTools.js:281, required:
// ['event_id']), so that example is unproducible from input and can only come from
// the returned row. The row is also the MORE witnessed of the two: input is what
// was asked for, the row is what the database did. M1's result-first discipline is
// therefore extended unchanged rather than inverted.
const UPDATED_PREFIX = '— Updated: ';
const REMOVED_PREFIX = '— Removed: ';
const UPDATED_BARE   = '— Updated your file.';
const REMOVED_BARE   = '— Removed from your file.';

// tool -> the row key the door hands back on success. Enumerated by command at
// 0da540a from the executors' own returns, never guessed:
//   update_event:1060 event · delete_event:1088 deleted_event
//   update_booking:1331 booking · delete_booking:1360 deleted_booking
//   update_task:824 task · complete_task:760 task · delete_task:857 deleted_task
//   delete_receipt:1536 deleted_receipt
const UPDATE_HANDS = {
  update_event:   'event',
  update_booking: 'booking',
  update_task:    'task',
  complete_task:  'task',
};
const REMOVE_HANDS = {
  delete_event:    'deleted_event',
  delete_booking:  'deleted_booking',
  delete_task:     'deleted_task',
  delete_receipt:  'deleted_receipt',
  delete_muse_save: null,          // returns no row — bare by construction
};

// The entity a row names, and the detail worth reading beside it. Returns null for
// the entity when the row cannot supply one — which is what triggers the degrade.
function rowEntity(row) {
  if (!row || typeof row !== 'object') return null;
  return clip(row.title || row.vendor_name || row.label) || null;
}
function rowDetail(name, row, input) {
  if (!row || typeof row !== 'object') return null;
  // For an UPDATE the detail is the NEW value, and it must come from the row the
  // door returned — the arguments carry what was requested, not what landed.
  if (name === 'update_booking') {
    return rupees(row.amount_total) || rupees(row.amount_advance) || null;
  }
  if (name === 'complete_task') return 'done';
  if (row.event_date) return shortDate(row.event_date);
  if (row.due_date)   return shortDate(row.due_date);
  if (row.amount_total != null) return rupees(row.amount_total);
  void input;
  return null;
}

// One update/removal hand -> its receipt line, or null if it is neither.
// Never returns null for an ok'd update/removal: it degrades to the bare form
// instead, because a filed change with NO receipt is the indistinguishability
// F-05.34 exists to end.
function describeChange(call) {
  if (!call || typeof call !== 'object') return null;
  const name = call.name;
  const isUpdate = Object.prototype.hasOwnProperty.call(UPDATE_HANDS, name);
  const isRemove = Object.prototype.hasOwnProperty.call(REMOVE_HANDS, name);
  if (!isUpdate && !isRemove) return null;

  const r = call.result;
  if (!r || typeof r !== 'object' || r.ok !== true) return null;

  const key = isUpdate ? UPDATE_HANDS[name] : REMOVE_HANDS[name];
  const row = key ? r[key] : null;
  const entity = rowEntity(row);
  if (!entity) return isUpdate ? UPDATED_BARE : REMOVED_BARE;   // DEGRADE

  const detail = rowDetail(name, row, call.input);
  const prefix = isUpdate ? UPDATED_PREFIX : REMOVED_PREFIX;
  return detail ? `${prefix}${entity}, ${detail}` : `${prefix}${entity}`;
}


// toolCalls (the audit array, or the jsonb column read back) -> the footer, or null.
// One line per filed hand; null when nothing filed. A narrated turn — tool_calls []
// or null, F-05.34's own specimen — returns null here at BOTH seams, which is the
// whole point: the difference is produced by the hands or it is not produced.
function witnessFooter(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const lines = [];
  for (const call of toolCalls) {
    const d = describeHand(call);
    if (d) { lines.push(PREFIX + d); continue; }
    // V-5: updates and removals carry their own prefixes and their own degrade.
    const c = describeChange(call);
    if (c) lines.push(c);
  }
  return lines.length ? lines.join('\n') : null;
}

// Does this body already carry a witness footer? Guards the replay reconstruction
// against double-marking a row that was persisted with one.
function hasWitnessFooter(body) {
  const t = String(body == null ? '' : body);
  return [PREFIX, UPDATED_PREFIX, REMOVED_PREFIX, UPDATED_BARE, REMOVED_BARE].some(p => t.includes(p));
}

// Append the footer to a reply body. Returns the body UNCHANGED when nothing filed —
// so a turn that files nothing is byte-identical to what it is today, and W-1's
// spirit holds for every non-filing turn in the lane.
function appendWitness(body, toolCalls) {
  const footer = witnessFooter(toolCalls);
  const text = String(body == null ? '' : body);
  if (!footer) return text;
  if (hasWitnessFooter(text)) return text;
  return text ? `${text}\n\n${footer}` : footer;
}

module.exports = {
  FILING_HANDS, PREFIX,
  UPDATED_PREFIX, REMOVED_PREFIX, UPDATED_BARE, REMOVED_BARE,
  UPDATE_HANDS, REMOVE_HANDS, describeChange,
  shortDate, rupees, describeHand,
  witnessFooter, hasWitnessFooter, appendWitness,
};
