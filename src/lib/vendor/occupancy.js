// src/lib/vendor/occupancy.js
//
// ══════════════════════════════════════════════════════════════════════════
// THE OCCUPANCY CLASSIFICATION. (TDW_04 Part B, sitting B3)
// ══════════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS AT THE RIDER BATCH AND NOT AT 0076:
//   The CE ruled "the set ships in occupancy.js as the one export" (B3 subset
//   proposal §3, ratified 2026-07-16) — and the rider batch is the first thing
//   that needs it (the anchor veto, Q-B3-3/Q-B3-9). One home, born when first
//   needed; `checkOccupancy`'s body lands here at B3's occupancy sitting, after
//   0076. Two homes for one list would BE the F-04.36 regression this file's
//   own comment forbids.
//
// ── FIVE LISTS LIVE IN THIS NEIGHBOURHOOD. THEY ARE DELIBERATELY DIFFERENT. ──
// ── DO NOT "UNIFY" ANY TWO. Unifying two IS F-04.36's regression, and it     ──
// ── has already happened once.                                              ──
//
//   1. CALENDAR_KINDS (eventWrite.js:112 — THIRTEEN) — THE WRITE VOCABULARY.
//      "What may exist on the calendar at all." Mirrors the DB CHECK
//      (0007 + 0013 + 0069).
//   2. BOOKED_KINDS (cabinet.js:125, chat.js:136 — NINE) — THE ON-CALENDAR
//      READ PREDICATE. "What counts as an engagement for the drawer's count."
//      Excludes `blocked` (F-04.36) and call/task/reminder. NEVER a write
//      allowlist.
//   3. ALLOWED_KINDS (api/vendor/events.js:58 — TWELVE) — DOOR POLICY. "What
//      may THIS door mint." Excludes `blocked` (Q-B2, ratified).
//   4. ALLOWED_KINDS (lib/vendor/events.js:8 — TWELVE) — the dead file's twin.
//      Zero callers since B2; 05's sweep owns it. Listed so the count is honest.
//   5. THIS FILE — OCCUPYING / APPOINTMENT. THE CAPACITY + AUTHORITY PREDICATE.
//
//   BOOKED_KINDS ⊄ OCCUPYING and OCCUPYING ⊄ BOOKED_KINDS. Proven by command at
//   B3, not by trusting this comment: BOOKED_KINDS ∩ APPOINTMENT_KINDS =
//   meeting, recce, fitting, trial, social — five of its nine. Two predicates,
//   adjacent names, different jobs.
//
// ── THE TABLE (B3 subset proposal §3, CE-RATIFIED IN FULL 2026-07-16) ──────
//
// It is TERNARY, not binary — and that is load-bearing. 3 + 8 + 2 = 13. Every
// kind in the write vocabulary has exactly one home.
//
//   OCCUPYING (3)    — work the vendor sells. Consumes slot capacity.
//   APPOINTMENT (8)  — C5 verbatim, VERIFIED EXHAUSTIVE against the 13 at B3
//                      (13 - 8 = shoot, family, ceremony, other, blocked; every
//                      one is work, a withdrawal, or the sink). Never consumes.
//   NEITHER (2)      — `other` and `blocked`, and they are NOT the same nothing:
//     · `other`   — NON-OCCUPYING (ratified 2026-07-16). NOT because "a timeless
//                   entry must not eat a day" (that is the corollary) but because
//                   `other` IS THE UNCERTAINTY SINK BY WRITTEN INSTRUCTION:
//                   recordPrimitives.ts:403 tells the model "if unsure, leave it
//                   and a neutral booking is kept." UNCERTAINTY MUST NEVER
//                   CONSUME CAPACITY. A silent failure that eats a vendor's day
//                   cannot be fought; a visible one has a door (block it — two
//                   deliberate acts, both witnessed).
//                   WITNESSED REINFORCEMENT (turn log, 2026-07-15 20:12:59): with
//                   `donna_block_date` available, the model reached for the HAND,
//                   not for kind='other'. The `35c9ce50` exhibit ("Personal —
//                   unavailable", kind='other', 24 Jul) is a FOSSIL of the era
//                   before the hand existed — F-04.37's signature, pre-cure.
//                   Its surviving CRUD-door class is B5's opening item (offer
//                   Block where a vendor reaches for `other`), NOT the taxonomy's.
//     · `blocked` — a REFUSAL, not capacity arithmetic. P3's "consumes all
//                   capacity of its slot(s)" is SUPERSEDED ON THE RECORD (Q-B3-8,
//                   2026-07-16): refusals do not participate in force math. It
//                   gets its own verdict — `date_blocked`, the fourth
//                   ConflictPayload kind, non-overridable — at B3's occupancy
//                   sitting.
//
// SLOT ANSWERS *WHERE*. OCCUPANCY ANSWERS *WHETHER*. (Standing distinction,
// ratified 2026-07-16.) deriveSlot's branches 1-2 (caller-sent slot; event_time
// -> C2's boundaries) are KIND-BLIND and stay that way — a timed appointment
// still gets slot='morning' because slot places it on the timeline; it just
// consumes nothing. Only the NO-TIME case (branches 3/4) consults this table.
//
// ── THE THIRD JOB: AUTHORITY OVER A BINDER'S DATE (Q-B3-3 + Q-B3-9, amended
//    2026-07-16 after the turn log) ───────────────────────────────────────
//
// A BINDER'S DATE IS THE WEDDING. A LINKED EVENT IS USUALLY AN APPOINTMENT
// LEADING UP TO IT. The lockstep legs use this same set, in BOTH directions:
//
//   e->b (chat.js:406 leg 1 · api/vendor/events.js leg 3/T11):
//        an event's date-edit writes the binder's date ONLY IF the event is
//        OCCUPYING *and* its PRE-MOVE date equalled the binder's date (it WAS
//        the wedding).
//   b->e (chat.js lockstepBinderToEvent, leg 2):
//        a binder's date drags ONLY its OCCUPYING linked events. An
//        appointment's date is its own; a wedding moving has no authority over
//        a trial's calendar.
//
// F-04.43's ACTUAL specimen (turn log, 2026-07-15 20:20:22, read at B3): the
// binder carried NO DATE — six writes, not one a date, per donna_history IN THE
// SAME TURN. donna_edit wrote NULL -> 2026-11-01, a genuine first write, and leg
// 2 dragged "Meera - trial" (kind='trial') off 30 Jul onto the wedding. The
// old != new sentinel CANNOT stop that — old and new differ. THE KIND BRAIN IS
// THE WALL; the sentinel is defence-in-depth behind it (F-04.48's cure, ruled
// orthogonal 2026-07-16). Never call the sentinel F-04.43's cure again.
//
// ══════════════════════════════════════════════════════════════════════════

'use strict';

// Work the vendor sells. Consumes capacity. May speak for the binder's date.
const OCCUPYING_KINDS = ['shoot', 'family', 'ceremony'];

// C5 verbatim. Never consumes capacity; soft-warns when sharing a slot with an
// occupying booking. NEVER speaks for a binder's date.
const APPOINTMENT_KINDS = [
  'trial', 'fitting', 'recce', 'call', 'meeting', 'task', 'reminder', 'social',
];

// `other` and `blocked` are in NEITHER list, deliberately. Membership is always
// asked positively — `isOccupying(kind)` — never as `!isAppointment(kind)`.
// ON A TERNARY THOSE ARE DIFFERENT SETS, and they differ on exactly the two
// kinds that must never speak for a wedding (Q-B3-9's amendment).
function isOccupying(kind) {
  return OCCUPYING_KINDS.includes(kind);
}

function isAppointment(kind) {
  return APPOINTMENT_KINDS.includes(kind);
}

// ── THE ANCHOR RULE — ONE HOME (Q-B3-10, CE-ruled 2026-07-16) ─────────────
//
// B3 shipped this logic TWICE: chat.js:473 (leg 1, never exported, took `req`) and
// api/vendor/events.js (leg 3, inline). The executor disclosed it; the CE ruled it
// back to one home with the deciding sentence quoted from that disclosure:
// "THEY AGREE TODAY; I READ BOTH" — which is F-04.36's ORIGIN SENTENCE. Two things
// that must agree, in two files, with no forcing function. It takes `supabase`, not
// `req`, precisely so BOTH doors can call it: the CRUD door has no `req.app.locals`
// shape and that mismatch is what forked the rule in the first place.
//
// "Only a wedding-anchor event's date-edit may write the binder's date."
// There is no kind='wedding' — CALENDAR_KINDS is thirteen and none of them is that
// (verified at B3; a 14th kind was rejected at Q-B3-3). So the anchor is proven from
// two facts the estate already holds:
//
//   (i)  the event is OCCUPYING. Asked POSITIVELY. On a ternary set "not an
//        appointment" is NOT "occupying" — it would let `other` and `blocked` speak
//        for a wedding (Q-B3-9's amendment).
//   (ii) its PRE-MOVE date equalled the binder's date — it WAS the wedding before it
//        moved. Testing the POST-move date compares the new date to the old binder
//        date, never matches, and leaves the leg permanently dead.
//
// WITNESSED IN PRODUCTION, BOTH DOORS, 2026-07-16:
//   leg 3 — PATCH shoot 8 Nov -> 15 Nov: binder FOLLOWED to 2026-11-15.
//           PATCH trial -> 1 Aug (same door, same minute): binder HELD at 2026-11-15.
//   leg 1 — chat "[671902e6] move it to 22 November": binder FOLLOWED to 2026-11-22.
//   Two PATCHes, one door, opposite outcomes, decided by `kind`. A veto that vetoed
//   everything would have failed the first line of each pair. It didn't.
//
// FAIL-CLOSED (F15's law): no truthful read of the binder, no propagation. A binder
// with NO date has no anchor — the exact state Meera's was in (F-04.43's real
// specimen: NULL -> 2026-11-01, a first write) when this machinery destroyed her trial.
//
// PLANE: callers pass a PUBLIC-DEFAULT client; the explicit .schema('engine') hop
// targets `records` (binders) and nothing else — the enumerated hop, as eventWrite.js:230.
async function isWeddingAnchor(supabase, evBefore, binderId) {
  if (!evBefore || !binderId) return false;
  if (!isOccupying(evBefore.kind)) return false;        // (i)
  if (!evBefore.event_date) return false;
  const { data: binder, error } = await supabase
    .schema('engine')
    .from('records')
    .select('date')
    .eq('id', binderId)
    .maybeSingle();
  if (error || !binder) return false;                   // fail-closed
  if (!binder.date) return false;                       // no date -> no anchor
  return binder.date === evBefore.event_date;           // (ii)
}

module.exports = {
  OCCUPYING_KINDS, APPOINTMENT_KINDS, isOccupying, isAppointment, isWeddingAnchor,
};
