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
// ── DECLARED GAP, NAMED NOT BURIED ──────────────────────────────────────────
//
// The footer covers CREATE hands only. update_* and delete_* file real work and get
// NO footer this movement, because "Saved:" is a false word for a deletion and the
// honest words ("Updated:", "Removed:") would be NEW bride-readable copy outside the
// four strings M1 was ruled to build byte-exact. Minting unapproved copy to widen a
// cure is how unapproved copy ships. The gap is one veto slot wide and it is the
// CE's to close.
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

// toolCalls (the audit array, or the jsonb column read back) -> the footer, or null.
// One line per filed hand; null when nothing filed. A narrated turn — tool_calls []
// or null, F-05.34's own specimen — returns null here at BOTH seams, which is the
// whole point: the difference is produced by the hands or it is not produced.
function witnessFooter(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const lines = [];
  for (const call of toolCalls) {
    const d = describeHand(call);
    if (d) lines.push(PREFIX + d);
  }
  return lines.length ? lines.join('\n') : null;
}

// Does this body already carry a witness footer? Guards the replay reconstruction
// against double-marking a row that was persisted with one.
function hasWitnessFooter(body) {
  return String(body == null ? '' : body).includes(PREFIX);
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
  shortDate, rupees, describeHand,
  witnessFooter, hasWitnessFooter, appendWitness,
};
