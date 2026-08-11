// src/lib/prospectExit.js — TDW_05 P3-D · THE EXIT DOOR'S DECISIONS, AS PURE FUNCTIONS.
//
// CE-30, R-30.10 / R-30.11 / R-30.14. Ruled 2026-08-11.
//
// ══ WHY THE DECISION LIVES HERE AND NOT IN THE ROUTE ═════════════════════════
// The three-member discriminator is the thing standing between a typo-fix and a
// destroyed conversation thread. A predicate spelled inline in an express
// handler can only be benched by driving the handler, which means every cell
// carries a fake request, a fake response and a fake supabase plane — and a cell
// that expensive is a cell nobody adds. Spelled here it is a function of its
// arguments, so the bench EXECUTES the real production decision with a table of
// rows and no harness at all (`statusLine.ts` is the estate's precedent, and its
// sitting's own lesson: benches that execute the resolver rather than matching
// its source).
//
// DEPENDENCY-FREE ON PURPOSE. No supabase, no express, no require of anything.
// The conversation member arrives as a BOOLEAN the caller derived, because this
// module must never be the thing that decides whether a lookup failed.
//
// ══ THE BLAST RADIUS THIS GUARDS (derived, not assumed) ══════════════════════
//   db/migrations/0085_prospect_lane.sql:69
//     conversations.prospect_id … references prospects(id) ON DELETE CASCADE
//   db/migrations/0001_initial_schema.sql:66
//     messages.conversation_id … references conversations(id) ON DELETE CASCADE
// So one `delete from prospects` destroys the conversation AND every message on
// it. `notes` (0002:32) and `pending_actions` (0002:46) both key on a NOT NULL
// vendor_id and cannot hang off a prospect thread, so the radius is exactly
// those two tables — checked, not presumed.
//
// WITH R-30.10's THIRD MEMBER RULED, THE CASCADE IS UNREACHABLE THROUGH THIS API
// BY CONSTRUCTION: no row carrying a conversation can reach the delete.
'use strict';

// The eighth value, minted by 0119_prospect_discard.sql. Spelled once.
const DISCARDED = 'discarded';

// Typed keys, one per member, per R-30.10: "a refusal that doesn't say why is
// F-06.171's class one lane over." The screen renders these; it never matches
// prose (KEY-NEVER-PROSE, the intake guard's own law at
// src/api/admin/prospects.js:44-45).
const REFUSAL = Object.freeze({
  ALREADY_CONTACTED: 'already_contacted',
  HAS_CONVERSATION:  'has_conversation',
  HAS_DEMO:          'has_demo',
  ALREADY_DISCARDED: 'already_discarded',
  OPTED_OUT_LOCKED:  'opted_out_locked',
  NOT_DISCARDED:     'not_discarded',
  DISCARDED:         'discarded',
});

// ── DELETE eligibility — R-30.10, arm (c), ALL THREE MEMBERS ─────────────────
// Returns a typed refusal key, or null when the row may be hard-deleted.
//
// MEMBER ORDER IS THE CHAIR'S ORDER (already_contacted · has_conversation ·
// has_demo) and it is also the cheap-to-expensive order by accident rather than
// by design: the first and third read columns already on the row, the second
// needs a query the caller has already run.
//
// `hasConversation` IS REQUIRED, NOT OPTIONAL, and undefined is NOT falsy here —
// it refuses. A caller that forgot to run the lookup must not be handed a green
// light by omission; that is the silent-zero class the independent-method law
// exists to refuse.
function deleteRefusal(prospect, hasConversation) {
  if (!prospect) return REFUSAL.ALREADY_CONTACTED; // no row is never deletable here; the route 404s first
  // ── MEMBER 4 — R-30.19 · F-05.68's CURE ─────────────────────────────────
  // THE OPT-OUT REGISTER BELONGS TO THE HUMAN, NOT THE HOUSE (R-30.18).
  // `state='opted_out'` is the estate's ONLY record of a person's STOP — four
  // gates read that value and nothing else (`sendWa.js` defaultIsOptedOut ·
  // `whatsapp.js` _isOptedOut · `nudgeOptout.js` · this lane's own inbound
  // no-op) and there is no opt-out table anywhere. The row IS the register.
  //
  // AND THE SHAPE THAT REACHES HERE IS REAL, not theoretical: the STOP arm
  // (`prospects.js`, isStopWord) creates the row and writes `opted_out` while
  // opening NO conversation and stamping NO template, so a stranger who texts
  // STOP cold produces a row that passes all three members below. Both probes
  // returned null against the three-member discriminator before this line
  // existed. The only lawful exit from `opted_out` is the human's own START.
  //
  // The compliance edge, named: re-messaging a STOP'd number degrades the
  // quality rating of a phone number every vendor and bride on the estate
  // shares. This member is cheap; that is not.
  if (prospect.state === 'opted_out') return REFUSAL.OPTED_OUT_LOCKED;
  if (prospect.last_template_at) return REFUSAL.ALREADY_CONTACTED;
  if (hasConversation !== false) return REFUSAL.HAS_CONVERSATION;
  if (prospect.demo_vendor_ref) return REFUSAL.HAS_DEMO;
  return null;
}

// ── DISCARD eligibility — the transition a contacted row takes instead ───────
// Only refusal: the row is already discarded. Every other state is discardable,
// which is the point — discard is the exit that keeps the record.
function discardRefusal(prospect) {
  if (!prospect) return REFUSAL.ALREADY_DISCARDED;
  // R-30.20 — the same lock, for the opposite-looking reason. Discard would move
  // the row OUT of the exact value all four gates match on, un-blocking the wire
  // for a person who said STOP; and Restore would then land them in `cold`, where
  // the morning sweep templates them. An opted-out row already has every property
  // discard was built to produce, so the transition adds nothing and subtracts a
  // protection.
  if (prospect.state === 'opted_out') return REFUSAL.OPTED_OUT_LOCKED;
  if (prospect.state === DISCARDED) return REFUSAL.ALREADY_DISCARDED;
  return null;
}

// ── RESTORE eligibility — R-30.11: discarded → cold ONLY, never a wildcard ───
// The restore verb is what keeps F2-b from inheriting F2-c's flaw: without it a
// discarded number is permanently un-re-addable, because the intake door refuses
// it and hard delete refuses contacted rows. It is an EXPLICIT admin act that
// moves state before any message can flow — never a silent re-arm at intake.
function restoreRefusal(prospect) {
  if (!prospect) return REFUSAL.NOT_DISCARDED;
  if (prospect.state !== DISCARDED) return REFUSAL.NOT_DISCARDED;
  return null;
}

// ── The screen's question, answered server-side (R-30.13) ────────────────────
// "The founder is never offered a button that will refuse him." The board row
// cannot answer the conversation member on its own — GET / derives it and stamps
// `has_conversation` on each row, and this is the function both the route and
// the screen agree through.
// 'none' is a REAL ANSWER, not an absence: an opted-out row is reachable by no
// exit verb at all (R-30.19/.20), and the screen renders no control rather than a
// disabled one, because a greyed button still says "this is a thing you might do
// to this row" and the ruling's whole point is that it is not.
function exitKind(prospect, hasConversation) {
  if (!prospect) return 'none';
  if (prospect.state === 'opted_out') return 'none';
  if (prospect.state === DISCARDED) return 'restore';
  return deleteRefusal(prospect, hasConversation) === null ? 'delete' : 'discard';
}

module.exports = { DISCARDED, REFUSAL, deleteRefusal, discardRefusal, restoreRefusal, exitKind };
