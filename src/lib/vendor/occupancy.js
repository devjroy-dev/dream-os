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

// ══════════════════════════════════════════════════════════════════════════
// THE CHECKER. (TDW_04 Part B, the CHECKER sitting — ZIP D, 2026-07-16)
// ══════════════════════════════════════════════════════════════════════════
//
// This is the body the file's own header promised: "checkOccupancy's body lands
// here at B3's occupancy sitting, after 0076." 0076 is applied; the condition is met.
//
// eventWrite.js owns the DOOR (control flow, force, the write). This file owns the
// CHECKER (does the resulting row conflict) AND — Q-C-3, CE-ruled 2026-07-16 — the
// FORCE SEMANTICS OF ITS OWN VOCABULARY. The door asks `isRefusal` / `isOverridable`;
// it never learns why. F-04.36's law applied forward: the file that owns the verdict
// vocabulary owns what the verdicts MEAN. A door that hardcoded `kind !== 'date_blocked'`
// would be the second home.
//
// ── THE FOUR VERDICTS, AND THE TWO AXES THAT ARE NOT THE SAME AXIS ────────
//
//              REFUSAL?   OVERRIDABLE?
//   capacity      yes        yes       a double-booking is a risk a vendor may knowingly accept
//   date_blocked  yes        NO        a block is a stated refusal, not a risk (Q-B3-8)
//   appt_overlap  NO         n/a       advisory. C5. Rides out on {ok:true, event, conflict}
//   cluster       NO         n/a       advisory. C9, "never blocks" — ruled three times
//
//   REFUSAL answers "does this stop the write?" OVERRIDABLE answers "can force
//   beat it?" Collapsing them is how C9's ruled "never blocks" would die: the
//   door's gate refuses ANY conflict when force is absent, so an advisory that
//   reaches the gate as a refusal blocks the write it was ruled never to block.
//   Q-C-3's ruling names this: "appointment_overlap/cluster are advisory and
//   never reach the gate as refusals."
//
// ── THE EFFECTIVE ROW (Q-C-1, CE-ruled (α) 2026-07-16) ────────────────────
//
// THE DEFECT THIS CURES, and it was found by RUNNING the door, not reading it:
//   The context is built from the PATCH, never the ROW. `ctx.kind` is `undefined`
//   on ALL NINE of writeEvent's update shapes — every call site that carries an
//   event_id. isOccupying(undefined) is false, so a checker keyed on ctx.kind is
//   BLIND on every update path: the lockstep drag, every CRUD PATCH, every chat
//   date-edit. §2.6 found a booking conflicting with ITSELF (a false positive);
//   underneath it sat this — no conflict where there IS one. False negatives are
//   the disease this block exists to kill.
//
//   THE OCCUPANCY QUESTION IS ABOUT THE RESULTING ROW = row ⊕ patch. So the
//   checker reads its own target and merges. Path-A-only cost: on path B the
//   dedupe's `existing` already IS the row (see effectiveRow's own note on the
//   three columns its select does not carry, and why they do not bite).
//
// FAIL-CLOSED (F15's law; findExistingBlock's precedent, CE-named as governing):
//   a guard read that ERRORS is not a guard read that found nothing. It returns
//   { err } → the door's ERROR channel, ABOVE the force branch, so force cannot
//   beat it. The trade is ruled with eyes open: availability of an edit yields to
//   integrity of the calendar. A refused edit is retryable; a waved-through false
//   negative is permanent divergence.
//
// ══════════════════════════════════════════════════════════════════════════

// The verdict vocabulary. FOUR kinds; the wire is spec :62-66 extended to four
// by Q-B3-8. No fifth kind, no new wire field — Q-C-3 was cured with predicates,
// not with vocabulary inflation.
const REFUSAL_KINDS      = ['capacity', 'date_blocked'];
const NON_OVERRIDABLE    = ['date_blocked'];

// Asked POSITIVELY, like every membership question in this file (Q-B3-9's law).
function isRefusal(conflict) {
  return !!conflict && REFUSAL_KINDS.includes(conflict.kind);
}

// "Can force beat this verdict?" The door asks; it does not decide.
//   date_blocked -> NO. Overriding a stated refusal would make "blocked" mean
//   "blocked unless someone is confident" (Q-B3-8's own sentence). The honest
//   path is unblock, then book — two deliberate acts, both witnessed.
function isOverridable(conflict) {
  if (!conflict || !conflict.kind) return true;
  return !NON_OVERRIDABLE.includes(conflict.kind);
}

// ── THE MAP (Q-B3-2's CORRECTED map, CE-ruled 2026-07-16) ─────────────────
//
// KEY SPACE = PROFILES' SIX. The only space profileFor can return, verified by
// RUNNING the real resolvers, not by reading the table:
//   makeup · photography · designer · jewellery · decor · venue   (+ a synthetic `other`)
//
// ⚠ KEYED ON `profile.key`, NEVER ON `timelineType`. THIS IS LOAD-BEARING AND IT
//   IS A TRAP. profileFor's synthetic `other` fallback returns timelineType:'event'
//   (categoryProfiles.js — run it and see). A map keyed on timelineType would turn
//   occupancy ON for `other` AND for every planner, contradicting §2.2, C4's planner
//   clause and §8's "nothing in 04 may foreclose these" in one line.
//
// ⚠ THESE NUMBERS DIVERGE FROM C4 AND THE DIVERGENCE IS RULED, NOT DRIFT.
//   C4 reads "photographer 1 · mua 2 · decorator 2 · florist 2". The trace, so
//   nobody "restores" C4 and quietly doubles a decorator's day:
//     · audit §9's Q-2 ruled decor 1/day.
//     · Q-B3-2 was PARTIALLY WITHDRAWN (it was ruled against a taxonomy predating
//       the 2026-05-15 florist merge) and its CORRECTED map RESTORED makeup 2 —
//       C4's mua:2, which is what makes acceptance #3 reachable at all — while
//       keeping decor 1 and adding venue 1.
//     · C4's `florist: 2` key is UNREACHABLE by any input: there is no florist
//       PROFILE. See F-04.59's rider — 'florist' now normalises to 'decor', so a
//       florist gets decor's 1 and sets slot_capacity himself if he runs three sites.
//   PER-SLOT, not per-day. The column name encodes it (0076); LD-8: applied
//   numbers never rename.
const CATEGORY_CAPACITY = { photography: 1, makeup: 2, decor: 1, venue: 1 };

// ── RULED_OFF (Q-C-1's third clause, CE-ruled 2026-07-16) ─────────────────
//
// `occupancy_unmapped` means "nobody has decided about this category yet." It must
// NOT fire for categories whose OFF-ness IS a decision. profileFor('planner') → key
// 'other' — planner is indistinguishable from a caterer once it reaches the profile,
// so the set is keyed on normaliseCategory's output, which still says 'planning'.
//
// C4: "planner: occupancy OFF until 04.5 (crew math lands there)." §8 reserves the
// crew math by name. That is a RULING. It goes SILENT-OFF; the unmapped signal stays
// loud where it means something.
const RULED_OFF = new Set(['planning']);

// "once per vendor" — PER PROCESS, and this comment says so rather than implying
// persistence it does not have (CE-ratified with this exact caveat, 2026-07-16). A
// restart re-arms it. That is acceptable for a log line and would not be for a rule.
const _unmappedSeen = new Set();

// The honest, retryable refusal. VENDOR-FACING — on the veto list.
// F-04.55 is why the note is here rather than the disappointment being a surprise:
// the CRUD door's errRes(res, 400, result.error) renders this text; the chat door
// console.errors it. B4 owns the surfacing. The REFUSAL is the substance and it
// lands today.
const VERIFY_FAILED = "Couldn't verify the calendar — nothing was changed. Try again.";

// The keys that can move a row through space or out of occupancy. A title-only or
// notes-only PATCH cannot change an occupancy answer and does not buy a round trip
// (CE-ruled efficiency-and-semantics clause, 2026-07-16).
//
// `state` and `deleted_at` are in this list BECAUSE Item 2(3) and Item 3 name them
// as part of the effective row — which is why they had to join the context object.
// See eventWrite.js's ctx, and the handover's door-line table.
const SPATIAL_KEYS = ['event_date', 'event_time', 'slot', 'kind', 'state', 'deleted_at', 'ready_by'];

// ⚠ `slot` IS TESTED FOR null, NOT undefined, AND THE WHOLE CLAUSE DIES WITHOUT THIS.
//   Every other key arrives straight off the patch, so `undefined` honestly means
//   "not sent". `slot` does not: the door computes `slot: derivedSlot` on EVERY call
//   and deriveSlot returns NULL when the patch carried neither slot nor time. So
//   ctx.slot is ALWAYS present — a bare `!== undefined` is true on every write ever
//   made, the short-circuit never fires once, and a title-only PATCH buys two round
//   trips forever while the bench that "proves" the clause passes green.
//   Found by the bench, not by reading. This is the shape §0.1 exists for.
function touchesSpatial(ctx) {
  if (ctx.slot != null) return true;
  return SPATIAL_KEYS.some((k) => k !== 'slot' && ctx[k] !== undefined);
}

// ── SLOT RESOLUTION FOR A ROW ALREADY ON THE CALENDAR ─────────────────────
//
// ⚠ EVERY BOOKING IN PRODUCTION TODAY CARRIES slot = NULL. eventWrite.js says so
//   in its own witness: "At 19c52c5 no booking carries a slot at all; only blocks
//   populate the column." A checker that read NULL as "occupies nothing" would see
//   an EMPTY CALENDAR and hand a vendor a clean slot on a date already holding a
//   booking — F-04.47's disease, arriving through the column instead of the horizon.
//
//   So a stored row's slot is resolved by THE SAME RULE the door writes with:
//   deriveSlot's branches, applied to the row. Branch 1 (a slot is stored) → it.
//   Branch 2 (a time is stored) → C2's boundaries. Branch 3 (no time, occupying)
//   → full_day. Branch 4 (no time, appointment) → null, timeline-only.
//
// LAZY REQUIRE, deliberately: eventWrite requires this file for the checker, and
// this line requires eventWrite for deriveSlot. The cycle is resolved at CALL time,
// not at load time. This is the estate's own precedent, not an invention —
// categoryProfiles.js:122 does exactly this, with exactly this comment
// ("Lazy require to avoid any load-order coupling"). deriveSlot stays in ONE home
// (§2.1a: two homes for one rule would BE F-04.36).
function slotOfRow(row) {
  if (!row) return null;
  const { deriveSlot } = require('./eventWrite');
  return deriveSlot({ slot: row.slot, event_time: row.event_time, kind: row.kind });
}

// ── THE EFFECTIVE ROW = row ⊕ patch ───────────────────────────────────────
//
// `undefined` = the patch does not touch this field → the row's value stands.
// `null`      = the patch CLEARS it. eventWrite's own undefined-vs-null law
//               (:309-319), which is a REGRESSION GUARD, not pedantry — an earlier
//               cut of that file tested `!= null` and silently dropped every clear.
//               The merge honours the same distinction or it is describing a
//               different row than the one about to be written.
function effectiveRow(ctx, stored) {
  const pick = (patchVal, storedVal) => (patchVal === undefined ? (stored ? storedVal : undefined) : patchVal);
  const s = stored || {};
  const eff = {
    event_date: pick(ctx.event_date, s.event_date),
    event_time: pick(ctx.event_time, s.event_time),
    kind:       pick(ctx.kind,       s.kind),
    state:      pick(ctx.state,      s.state),
    deleted_at: pick(ctx.deleted_at, s.deleted_at),
    ready_by:   pick(ctx.ready_by,   s.ready_by),
  };
  // Slot LAST, and re-derived from the EFFECTIVE values (Item 2(3), CE-ruled):
  // "patch carries time → derive from it; neither → the row's slot stands."
  // ctx.slot IS the door's own derivedSlot — branches 1-2 already applied to the
  // patch. If it is null the patch sent neither slot nor time, and the answer comes
  // from the effective row through the same four branches.
  eff.slot = (ctx.slot != null) ? ctx.slot : slotOfRow({
    slot: s.slot, event_time: eff.event_time, kind: eff.kind,
  });
  return eff;
}

// ── THE READS. Both FAIL-CLOSED. ──────────────────────────────────────────
//
// NOT filtered by deleted_at: the checker must SEE deleted_at to merge it (Item 3
// — a row being soft-deleted asks no occupancy question, and it cannot answer that
// about a row the read hid from it).
async function readTargetRow(supabase, vendorId, id) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, event_date, event_time, kind, slot, state, deleted_at, ready_by')
      .eq('id', id).eq('vendor_id', vendorId).maybeSingle();
    if (error) return { err: VERIFY_FAILED };
    return { row: data || null };          // no row is not an error — the write's own
  } catch (e) {                            // predicate will report it honestly
    console.warn('[occupancy:target]', e.message);
    return { err: VERIFY_FAILED };
  }
}

// slot_capacity is 0076's column, applied. `category` drives the map.
// WITNESSED COLUMN LIST (F-04.57's law): both live at docs/db/PUBLIC_SCHEMA.md's
// public.vendors — 37 columns, slot_capacity at ordinal 45. Read from a witnessed
// list or not at all.
async function readVendor(supabase, vendorId) {
  try {
    const { data, error } = await supabase
      .from('vendors').select('slot_capacity, category').eq('id', vendorId).maybeSingle();
    if (error) return { err: VERIFY_FAILED };
    return { vendor: data || null };
  } catch (e) {
    console.warn('[occupancy:vendor]', e.message);
    return { err: VERIFY_FAILED };
  }
}

// ── THE HOLDING QUERY ─────────────────────────────────────────────────────
//
// HORIZON-BLIND BY CONSTRUCTION (F-04.47, ratified). Queries `events` DIRECTLY —
// never a view, never a surface's read. `deleted_at is null` + `state <> 'cancelled'`
// are the ONLY lawful non-occupancy.
//
// ⚠ TO WHOEVER ADDS A HORIZON FILTER HERE FOR "SYMMETRY WITH THE GRID": DON'T.
//   The surfaces carry a forward horizon the database does not (F-04.47). A
//   horizon-filtered checker hands a vendor a clean slot on a date that already
//   holds a booking he cannot see. The grid's blindness is B5's to cure. The
//   checker's job is the truth, not the view.
//
// `.neq('state','cancelled')` IS SAFE, and it is safe for a witnessed reason:
//   PUBLIC_SCHEMA.md says `state text NOT NULL default 'upcoming'` — state is never
//   NULL. Had it been nullable this filter would silently drop NULL-state rows
//   (NULL <> 'cancelled' → NULL → excluded) and hand out an occupied date.
//   `.eq('vendor_id', …)` excludes the NULL vendor_ids of the couple XOR, which is
//   what we want.
//
// ── THE SELF-EXCLUSION (Q-S-3, CE-ratified as proposed 2026-07-16) ────────
//
//   `selfId` is the WRITE'S OWN targetId, REUSED — `event_id || existing?.id`, the
//   very expression eventWrite.js computes at its update branch. Not re-derived: a
//   second derivation of "which row am I writing" is two homes for one rule.
//
//   IT IS NOT HYGIENE. THE DECIDING CASE IS THE RE-BOOK:
//   Victor re-books "Meera Kapoor - wedding shoot" on the date it already occupies.
//   The dedupe RESOLVES it — this is an idempotent re-confirmation — and hands the
//   checker `existing`. The dedupe pins its own search to `.eq('event_date', …)`,
//   THE SAME DATE the checker queries, so the resolved row is ALWAYS inside the
//   checker's result set. At photography 1 the verdict is `capacity`: A BOOKING
//   CONFLICTING WITH ITSELF, forceable only by pretending it is a double-booking.
//   Its path-A twin: any PATCH that re-sends a date the row already holds.
//
//   ⚠ CORRECTED IN PLACE (the executor's own claim, struck the same sitting it was
//   written — corrections convention: update in place, nothing deleted). The opening
//   packet argued the DECIDING case was the UNBLOCK — "without the exclusion the
//   checker finds the block it is deleting and returns date_blocked, which ignores
//   force, so a vendor could never unblock a date." THAT IS FALSE against the code
//   as ruled and built. Item 3's guard (`if (eff.deleted_at) return null`) fires
//   FIRST and the block query is never reached; Q-S-4's `blocked` guard covers the
//   block's own date-move. The unblock is saved by the effective row, not by this
//   line. The exclusion is still owed on EVERY query by ruling — on date_blocked it
//   is defence behind two guards rather than the wall itself, and saying so is the
//   difference between a defended line and an inherited one. §0.1: the number you
//   argued twenty minutes ago is a claim, not a fact.
//
//   "when present" survives from the ruling and must: `.neq('id', undefined)`
//   serialises to id=neq.undefined and Postgres refuses an invalid uuid. On a fresh
//   insert there is no self to exclude. Hence the conditional, on EVERY query.
function excludeSelf(q, selfId) {
  return selfId ? q.neq('id', selfId) : q;
}

async function liveRowsOn(supabase, vendorId, date, selfId, kinds) {
  let q = supabase
    .from('events')
    .select('id, title, slot, kind, event_time')
    .eq('vendor_id', vendorId)
    .eq('event_date', date)
    .is('deleted_at', null)              // F-04.25's covenant. The only lawful
    .neq('state', 'cancelled');          // non-occupancy, with the line below.
  if (kinds) q = q.in('kind', kinds);
  const { data, error } = await excludeSelf(q, selfId);
  if (error) return { err: VERIFY_FAILED };
  return { rows: data || [] };
}

// full_day consumes ALL slots (P3). So a row holds slot S if it IS S or if it is
// full_day; and a full_day booking must find room in every slot of the day.
const DAY_SLOTS = ['morning', 'noon', 'evening'];
function rowHolds(rowSlot, slot) {
  return rowSlot === slot || rowSlot === 'full_day';
}

module.exports = {
  OCCUPYING_KINDS, APPOINTMENT_KINDS, isOccupying, isAppointment, isWeddingAnchor,
  checkOccupancy, isRefusal, isOverridable,
  // B5: the POSITIVE read. A sibling of checkOccupancy, never a layer over it.
  describeDate,
  // B6 (R-B6-1): P4.1's feed — the window aggregate fed by describeDate, and the
  // occupancy half of the date-pressure sentence. See their headers at file end.
  describeWindow, windowWords,
  CATEGORY_CAPACITY, RULED_OFF, VERIFY_FAILED, SPATIAL_KEYS,
  // test seams — the bench drives the real function; these let it drive the parts.
  effectiveRow, slotOfRow, _unmappedSeen,
};

// ══════════════════════════════════════════════════════════════════════════
// checkOccupancy — THE CHECKER. eventWrite.js's seam calls this and nothing else.
// ══════════════════════════════════════════════════════════════════════════
//
// ONE CONTEXT OBJECT, NEVER SCALARS (§8's pluggability clause, binding: 04.5's
// per-crew-member math extends this same context and nothing in 04 may foreclose it).
//
// RETURNS:
//   null                     — no verdict. Write freely.
//   { err }                  — the checker could not see the calendar. FAIL-CLOSED;
//                              the door turns this into { ok:false, error } ABOVE the
//                              force branch, so force cannot beat it.
//   ConflictPayload          — { kind, slot?, date, holding:[{event_id,title,slot,kind}],
//                              capacity?, message }. `message` is a plain sentence the
//                              door hands Victor VERBATIM.
async function checkOccupancy(ctx) {
  const c = ctx || {};
  const { supabase, vendorId, event_id, existing } = c;
  if (!supabase || !vendorId) return null;

  // Q-S-3, ratified: the write's own targetId, reused. Computed ONCE, here, and
  // handed to every query below.
  const selfId = event_id || (existing && existing.id) || null;

  // Nothing spatial moved -> no occupancy answer can have changed -> no round trip.
  if (!touchesSpatial(c)) return null;

  // ── 1. THE EFFECTIVE ROW = row ⊕ patch (Q-C-1(α), ruled) ────────────────
  let stored = null;
  if (selfId) {
    if (existing) {
      // PATH B — the dedupe already read the row; no second trip (ruled).
      // ⚠ findExistingEvent's select carries id/title/event_date/event_time/kind/
      //   linked_binder_id/state — NO slot, NO ready_by, NO deleted_at. It does not
      //   bite, and here is why, so nobody has to re-derive it:
      //     · deleted_at — F-04.58's rider gives that select `.is('deleted_at', null)`,
      //       so an `existing` row is LIVE by construction.
      //     · state      — the select's own `.neq('state','cancelled')` guarantees it.
      //     · slot       — path B is a BOOKING; it specifies its own slot through
      //       branches 1-4 off the patch's kind, which path B always carries.
      //   The one residue: a no-time re-book of an APPOINTMENT whose stored slot came
      //   from a time now removed resolves to null instead of the stored slot. Branch 4
      //   returns null for that row anyway, and appointment_overlap is ADVISORY — it
      //   cannot refuse a write. Named rather than discovered.
      stored = existing;
    } else {
      const r = await readTargetRow(supabase, vendorId, selfId);
      if (r.err) return { err: r.err };          // FAIL-CLOSED (F15)
      stored = r.row;
    }
  }
  const eff = effectiveRow(c, stored);

  // ── 2. A ROW LEAVING OCCUPANCY ASKS NO OCCUPANCY QUESTION (Item 3, ruled) ─
  // §2.7's own rule, applied to the row about to exist: `deleted_at is null` +
  // `state <> 'cancelled'` are the only lawful non-occupancy. A row BECOMING either
  // occupies nothing. Cancel, delete and unblock all land here — and every one of
  // them would otherwise be asking the calendar's permission to stop using it.
  if (eff.deleted_at) return null;
  if (eff.state === 'cancelled') return null;

  // Q-S-4, ruled: blocking ONTO a booking is SILENT. A block is a refusal of FUTURE
  // work; standing bookings remain, visible, occupying. The tension is the day sheet's
  // to render (B5), never the wire's to invent.
  if (eff.kind === 'blocked') return null;

  if (!eff.event_date && !eff.ready_by) return null;   // nothing dated to ask about

  // ── 3. THE VENDOR'S POSTURE ─────────────────────────────────────────────
  const v = await readVendor(supabase, vendorId);
  if (v.err) return { err: v.err };                    // FAIL-CLOSED (F15)
  if (!v.vendor) return null;                          // no vendor row -> no posture

  const { normaliseCategory } = require('./categoryFraming');
  const { profileFor }        = require('./categoryProfiles');
  const norm    = normaliseCategory(v.vendor.category);
  const profile = profileFor(v.vendor.category);

  // SILENT-OFF: the OFF-ness is a ruling (C4/§8), not an omission. No signal.
  if (RULED_OFF.has(norm)) return null;

  // GENUINELY unmapped -> OFF, and say so once. This is the only reason `other` is
  // reachable at all: profileFor returns a synthetic `other` for everything unmapped.
  if (profile.key === 'other') {
    if (!_unmappedSeen.has(vendorId)) {
      _unmappedSeen.add(vendorId);
      console.warn('[occupancy_unmapped] vendor=' + vendorId + ' category=' + JSON.stringify(v.vendor.category || null) +
                   ' -> occupancy OFF (no PROFILES key; C4/§8 planner cases are RULED_OFF and silent)');
    }
    return null;
  }

  // ── 4. DELIVERY VENDORS: occupancy OFF, C9 clustering only ──────────────
  // designer / jewellery. timelineType:'delivery' — the work is MADE before the
  // wedding; "ready by" matters, "which day do you need me there" does not.
  if (profile.timelineType === 'delivery') {
    return await clusterCheck(supabase, vendorId, eff, selfId);
  }

  // ── 5. EVENT VENDORS: the date question ─────────────────────────────────
  if (!eff.event_date) return null;

  const blocked = await blockedCheck(supabase, vendorId, eff, selfId);
  if (blocked) return blocked;                          // refusal or { err }

  // SLOT ANSWERS WHERE. OCCUPANCY ANSWERS WHETHER. Asked POSITIVELY — on a ternary,
  // "not an appointment" is not "occupying" (Q-B3-9).
  if (isOccupying(eff.kind))   return await capacityCheck(supabase, vendorId, eff, selfId, v.vendor, profile);
  if (isAppointment(eff.kind)) return await overlapCheck(supabase, vendorId, eff, selfId);

  // `other` — the uncertainty sink (recordPrimitives.ts:403 instructs the model:
  // "if unsure, leave it and a neutral booking is kept"). UNCERTAINTY MUST NEVER
  // CONSUME CAPACITY. It has already been refused by a block above, which is right:
  // a block refuses everything. It consumes nothing, which is also right.
  return null;
}

// ── date_blocked (Q-B3-8) ─────────────────────────────────────────────────
// The fourth ConflictPayload kind. NON-OVERRIDABLE — see isOverridable.
// P3's "blocked consumes all capacity of its slot(s)" is SUPERSEDED ON THE RECORD:
// a refusal is not capacity arithmetic. Refusals do not participate in force math.
// That is why this is a verdict of its own and not a capacity number of zero.
async function blockedCheck(supabase, vendorId, eff, selfId) {
  const r = await liveRowsOn(supabase, vendorId, eff.event_date, selfId, ['blocked']);
  if (r.err) return { err: r.err };
  if (!r.rows.length) return null;
  const holding = r.rows.map((x) => ({ event_id: x.id, title: x.title, slot: x.slot, kind: x.kind }));
  return {
    kind: 'date_blocked',
    date: eff.event_date,
    holding,
    message: blockedMessage(eff.event_date),
  };
}

// ── capacity (C3/C4, per-slot) ────────────────────────────────────────────
async function capacityCheck(supabase, vendorId, eff, selfId, vendor, profile) {
  // NULL-overridable, always: the vendor's own number beats the category's default.
  // 0 IS LAWFUL (Q-SP-1, ruled). No CHECK, ever. `??` not `||` — 0 is a POSTURE,
  // and `||` would silently promote it to the category default, which is the exact
  // bug this line exists not to have.
  const capacity = (vendor.slot_capacity != null)
    ? vendor.slot_capacity
    : CATEGORY_CAPACITY[profile.key];
  if (capacity == null) return null;                    // unmapped event key -> OFF

  const r = await liveRowsOn(supabase, vendorId, eff.event_date, selfId, OCCUPYING_KINDS);
  if (r.err) return { err: r.err };

  // Read every holding row's slot through THE SAME four branches the door writes
  // with — legacy rows carry slot=NULL and are not empty air (see slotOfRow).
  const held = r.rows.map((x) => ({ ...x, _slot: slotOfRow(x) }));

  // A full_day booking must find room in EVERY slot; a slotted one, in its own.
  // A booking with no slot at all cannot happen for an OCCUPYING kind — branch 3
  // gives it full_day — but the guard is here because "cannot happen" is a claim.
  const targets = eff.slot === 'full_day' ? DAY_SLOTS : (eff.slot ? [eff.slot] : DAY_SLOTS);

  for (const slot of targets) {
    const holdingRows = held.filter((x) => rowHolds(x._slot, slot));
    if (holdingRows.length >= capacity) {
      return {
        kind: 'capacity',
        slot,
        date: eff.event_date,
        capacity,
        holding: holdingRows.map((x) => ({ event_id: x.id, title: x.title, slot: x._slot, kind: x.kind })),
        message: capacityMessage(slot, eff.event_date, capacity, holdingRows.length),
      };
    }
  }
  return null;
}

// ── appointment_overlap (C5) — ADVISORY. isRefusal says so; the gate obeys. ──
// An appointment NEVER consumes capacity. It soft-warns when it shares a slot with
// an occupying booking, and that is all it does. It cannot refuse a write.
async function overlapCheck(supabase, vendorId, eff, selfId) {
  if (!eff.slot) return null;                           // branch 4: timeline-only
  const r = await liveRowsOn(supabase, vendorId, eff.event_date, selfId, OCCUPYING_KINDS);
  if (r.err) return { err: r.err };
  const sharing = r.rows.map((x) => ({ ...x, _slot: slotOfRow(x) }))
                        .filter((x) => rowHolds(x._slot, eff.slot) || eff.slot === 'full_day');
  if (!sharing.length) return null;
  return {
    kind: 'appointment_overlap',
    slot: eff.slot,
    date: eff.event_date,
    holding: sharing.map((x) => ({ event_id: x.id, title: x.title, slot: x._slot, kind: x.kind })),
    message: overlapMessage(sharing[0].title, eff.slot, eff.event_date),
  };
}

// ── cluster (C9) — ADVISORY, NEVER BLOCKS, once per window ────────────────
// ">3 ready_by in any rolling 7 days." The window is anchored on THIS deadline and
// runs both ways: a deadline is crowded by what sits on either side of it, not only
// by what came before.
//
// ONCE PER WINDOW, by P3's own ruled mechanism — "dedupe via a note on the newest
// event." The note is the state; nothing new is invented to hold it.
const CLUSTER_WINDOW_DAYS = 7;
const CLUSTER_THRESHOLD   = 3;                          // ">3" -> a 4th trips it
const CLUSTER_NOTE_TAG    = '[cluster noted]';

async function clusterCheck(supabase, vendorId, eff, selfId) {
  if (!eff.ready_by) return null;
  const from = shiftDays(eff.ready_by, -(CLUSTER_WINDOW_DAYS - 1));
  const to   = shiftDays(eff.ready_by,  (CLUSTER_WINDOW_DAYS - 1));
  if (!from || !to) return null;

  let q = supabase
    .from('events')
    .select('id, title, ready_by, kind, slot, notes')
    .eq('vendor_id', vendorId)
    .gte('ready_by', from).lte('ready_by', to)
    .is('deleted_at', null).neq('state', 'cancelled');
  const { data, error } = await excludeSelf(q, selfId);
  if (error) return { err: VERIFY_FAILED };

  const others = data || [];
  if (others.length + 1 <= CLUSTER_THRESHOLD) return null;    // this one included

  // ONCE PER WINDOW: if any event already in this window carries the tag, the vendor
  // has been told. C9: "Victor mentions once, never nags."
  if (others.some((x) => typeof x.notes === 'string' && x.notes.includes(CLUSTER_NOTE_TAG))) return null;

  return {
    kind: 'cluster',
    date: eff.ready_by,
    holding: others.map((x) => ({ event_id: x.id, title: x.title, slot: x.slot, kind: x.kind })),
    message: clusterMessage(others.length + 1, from, to),
  };
}

// YYYY-MM-DD ± n days, without a Date-on-a-date-string parse. The IST discipline
// audit (P6) exists because `new Date('2026-11-22')` is UTC midnight and lands on
// the 21st in Kolkata. These are calendar dates, not instants; they get calendar
// arithmetic. Date.UTC is the safe form precisely because nothing here is a local time.
function shiftDays(ymd, n) {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════
// THE MESSAGES. VENDOR-FACING — EVERY ONE IS ON THE VETO LIST.
// ══════════════════════════════════════════════════════════════════════════
//
// spec P2: "message = a plain sentence, handed to Victor VERBATIM."
// spec P4.4: "authored so Victor can carry them verbatim without breaking voice —
// write them as he'd speak." A clash is never an error message; it is leverage or a
// choice he puts plainly.
//
// COPY LAW: no persona name appears in any of these. They are the product's voice,
// not a character's.
//
// ⚠ F-04.55: NOBODY READS THESE YET. Of eleven writeEvent call sites exactly one
//   mentions .conflict, and it console.errors the kind. The CRUD door returns a bare
//   {"ok":false}. B4 owns both doors surfacing the payload. These sentences are
//   written correct NOW so that B4 is a wiring job and not an authoring job.
function fmtDate(ymd) {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y, m, d] = ymd.split('-').map(Number);
  return d + ' ' + MONTHS[m - 1];
}
const SLOT_WORD = { morning: 'morning', noon: 'afternoon', evening: 'evening', full_day: 'day' };

function blockedMessage(date) {
  return `You've blocked ${fmtDate(date)}. That one's a no — unblock it first if you want it back.`;
}

// ── THE INVITATION CLAUSES ARE STRUCK (CE catch, founder-blessed subject to this
//    verification, B4 2026-07-16). CORRECTIONS CONVENTION: struck, not deleted. ──
//
// THEY READ, VERBATIM, AND THEY RETURN WITH THE AFFORDANCE:
//   ~~"Say the word and I'll put it in anyway."~~   (the capacity === 0 posture)
//   ~~"Say the word and I'll double it up."~~       (the full-slot posture)
//
// WHY THEY WENT: THERE IS NO WORD TO SAY. Verified at HEAD by command, three layers,
// and every one of them says no:
//   1. THE MODEL CANNOT UTTER IT. DONNA_BOOK_EVENT_TOOL's input_schema.properties are
//      title · event_date · event_time · kind · notes · binder_id. There is no `force`.
//      DONNA_EDIT_EVENT_TOOL: event_id · title · event_date · event_time · kind · notes.
//      No `force`. THE SCHEMA FORBIDS THE WORD.
//   2. THE DOOR DOES NOT READ IT. bookEvents reads six named fields off `bk`; `force`
//      is not among them. A hallucinated force:true is dropped on the floor.
//   3. THE DOOR DOES NOT PASS IT. Neither bookEvents nor mutateEvents passes `force`
//      to writeEvent, and the CRUD door reads no `force` from its body either.
//   The ONLY force:true in this estate is chat.js's lockstep leg 2 — an INTERNAL drag
//   reachable by no vendor utterance, from any door.
//
// SO THE CLAUSE PROMISED AN ACT VICTOR HAS NO HANDS FOR — F-04.37's disease in copy
// form. Worse than a dead promise: it was the ONLY exit the sentence offered, and the
// vendor accepting it would fire the same booking, meet the same verdict, and read the
// same invitation — a polite infinite loop, into which F-04.51's fabrication habit
// ("Done." at 1.36s with tool_calls: null) fits exactly.
//
// ⚠ CONTRAST, AND IT IS THE PROOF: blockedMessage names an honest path — "unblock it
//   first" — AND THAT PATH EXISTS (unblockDate, live, B1-sealed). capacityMessage has
//   no path to name because none exists. The vendor cannot force it, cannot SET it
//   (vendors.slot_capacity is in NO allowlist on ANY door — me.js's ALLOWED_FIELDS is
//   twelve entries and slot_capacity is not one; P3's ruled "Working capacity" stepper
//   was specced and never built), and cannot SEE it (zero references in dreamos-pwa).
//   The refusal is honest and it is a dead end. Naming the dead end is the finding;
//   inventing an exit for it in copy was the defect.
//
// §2.3 SURVIVES THE STRIKE AND THAT IS WHY THE FIRST CLAUSE STAYS: "the verdict's
// message MUST make the posture visible, so the force is INFORMED." The posture is
// visible. checker_bench asserts /capacity is 0/ — the posture, never the invitation.
// (§2.3's premise "a vendor who set 0 and forgot" describes a vendor who cannot exist;
// the founder blessed the attribution verbatim and it ships. Recorded, not re-argued.)
function capacityMessage(slot, date, capacity, held) {
  const when = SLOT_WORD[slot] || slot;
  if (capacity === 0) {
    return `Your ${when} capacity is 0 — that's your own standing rule for ${fmtDate(date)}.`;
  }
  return `Your ${when} on ${fmtDate(date)} is full — that's ${held} of ${capacity}.`;
}

function overlapMessage(title, slot, date) {
  const when = SLOT_WORD[slot] || slot;
  return `Heads up — that's the same ${when} as ${title} on ${fmtDate(date)}.`;
}

function clusterMessage(count, from, to) {
  return `That's ${count} deadlines between ${fmtDate(from)} and ${fmtDate(to)} — a tight week. Worth pacing.`;
}

// ══════════════════════════════════════════════════════════════════════════
// describeDate — THE POSITIVE READ. (TDW_04 Part B, sitting B5. Shape ratified
// at B4, banked under the seam law, built here fresh.)
// ══════════════════════════════════════════════════════════════════════════
//
// WHY IT IS NOT checkOccupancy — THE FOUR-NULL TABLE, re-derived at B5 by reading
// the body rather than trusting the handoff's summary of it. `checkOccupancy`
// returns bare `null` — INDISTINGUISHABLE FROM "FREE" — at ELEVEN sites, and the
// handoff named four. All eleven, by line, at 3b29528:
//   :511 no supabase/vendorId · :517 nothing spatial moved · :551 deleted_at
//   :552 state='cancelled'    · :557 kind='blocked'        · :559 nothing dated
//   :565 no vendor row        · :572 RULED_OFF (planning)  · :584 unmapped -> 'other'
//   :592 delivery -> clusterCheck (which returns null when it does not cluster)
//   :606 kind='other' (the uncertainty sink)
// A QUERY ENGINE BUILT ON IT WOULD TELL A PLANNER HE IS FREE ON HIS OWN WEDDING
// DAY — :572 returns the same `null` as "no conflict". The checker is CORRECT: it
// answers "may this write proceed", and silence is a lawful yes. describeDate asks
// a DIFFERENT question — "what is true of this date" — where silence is a lie.
//
// THE FIVE PROPERTIES, ratified (handoff §3), each load-bearing:
//   POSITIVE          — answers what IS, never "no objection".
//   OFF-HONEST        — occupancy:'off' + a reason. OFF is never dressed as open.
//   NEVER NULL-AS-FREE— every unknown is named. `blocked:null` is "I could not see",
//                       and it is NOT `false`. See the shape note below.
//   HORIZON-BLIND     — queries `events` DIRECTLY through liveRowsOn, exactly as
//                       :412's shipped comment governs. No window, no cap, no
//                       DEFAULT_WINDOW_DAYS. F-04.47's disease cannot arrive here.
//   COVENANT-IDENTICAL— `deleted_at is null` + `state <> 'cancelled'`, inherited by
//                       CALLING liveRowsOn rather than re-writing its two lines. Two
//                       homes for the covenant would BE F-04.36.
//
// ⚠ ONE DISCLOSED EXTENSION OF THE RATIFIED SHAPE — ratify-or-revert, stated BEFORE
//   ratification because that is F-04.61 #1's whole lesson. The ratified shape is
//   `{ date, blocked, slots, occupancy, reason? }` and it does not say what `blocked`
//   is when the READ FAILS. `false` would be null-as-free wearing the cure's own
//   clothes — the exact disease this function exists to kill. So: `blocked: null`,
//   `occupancy:'off'`, `reason:'verify_failed'`. THREE-VALUED, and the caller must
//   treat null as "unknown", never as "no". If the CE prefers `{ err }` (the
//   checker's fail-closed form, which breaks the shape) or `blocked:false` (which I
//   will not write without a ruling), say so and it changes in one line.
//
// SIBLING, not a layer: it reads the same rows through the same helpers as the
// checker and agrees with capacityCheck's arithmetic BY CALLING ITS PARTS —
// liveRowsOn, slotOfRow, rowHolds, DAY_SLOTS, CATEGORY_CAPACITY. If it drifted from
// them it would be a second opinion about one calendar, which is F-04.36's shape.
async function describeDate(ctx) {
  const c = ctx || {};
  const { supabase, vendorId, date } = c;

  const off = (reason, extra) => ({
    date: date || null, blocked: false, slots: [], occupancy: 'off', reason, ...(extra || {}),
  });
  // Unknown is NOT free. Every failure lands here, and `blocked:null` says so.
  const unknown = (reason) => ({
    date: date || null, blocked: null, slots: [], occupancy: 'off', reason,
  });

  if (!supabase || !vendorId || !date) return off('no_context');

  // ── 1. BLOCKED — asked FIRST, and independently of posture ───────────────
  // A block is a refusal of future work. It is true of the DATE whatever the
  // vendor's category is: a RULED_OFF planner who blocked the 20th is blocked on
  // the 20th, and checkOccupancy:572 would have said `null` and meant "free".
  // THIS IS THE ORDER THAT MAKES THE FOUR-NULL TABLE SURVIVABLE.
  const b = await liveRowsOn(supabase, vendorId, date, null, ['blocked']);
  if (b.err) return unknown('verify_failed');
  const blocked = b.rows.length > 0;

  // ── 2. THE VENDOR'S POSTURE ─────────────────────────────────────────────
  const v = await readVendor(supabase, vendorId);
  if (v.err) return { ...unknown('verify_failed'), blocked };   // the block SURVIVES
  if (!v.vendor) return { ...off('no_vendor'), blocked };

  const { normaliseCategory } = require('./categoryFraming');
  const { profileFor }        = require('./categoryProfiles');
  const norm    = normaliseCategory(v.vendor.category);
  const profile = profileFor(v.vendor.category);

  // Each of these is a `null` in the checker. Here each is a WORD.
  if (RULED_OFF.has(norm))               return { ...off('ruled_off'), blocked };
  if (profile.key === 'other')           return { ...off('unmapped'), blocked };
  if (profile.timelineType === 'delivery') return { ...off('delivery'), blocked };

  // ── 3. CAPACITY — capacityCheck's arithmetic, by calling its parts ───────
  // `??` not `||`: 0 is a POSTURE (Q-SP-1, ruled), and `||` would silently promote
  // it to the category default. capacityCheck:634 carries the same line and the
  // same reason; this is the one place the number is re-derived rather than shared,
  // and it is re-derived IDENTICALLY. If these two ever disagree, the bench fails.
  const capacity = (v.vendor.slot_capacity != null)
    ? v.vendor.slot_capacity
    : CATEGORY_CAPACITY[profile.key];
  if (capacity == null) return { ...off('unmapped'), blocked };

  const r = await liveRowsOn(supabase, vendorId, date, null, OCCUPYING_KINDS);
  if (r.err) return { ...unknown('verify_failed'), blocked };

  // Legacy rows carry slot=NULL and are not empty air — slotOfRow's four branches,
  // the same ones the door writes with.
  const held = r.rows.map((x) => ({ ...x, _slot: slotOfRow(x) }));
  const slots = DAY_SLOTS.map((slot) => ({
    slot,
    held: held.filter((x) => rowHolds(x._slot, slot)).length,
    capacity,
  }));

  return { date, blocked, slots, occupancy: 'on' };
}

// ══════════════════════════════════════════════════════════════════════════
// describeWindow + windowWords — P4.1's feed. (TDW_04 Part B, sitting B6,
// R-B6-1: "the same edit adds P4.1's date-pressure line … fed by describeDate".)
// ══════════════════════════════════════════════════════════════════════════
//
// FED BY describeDate, LITERALLY: every per-date truth in the summary comes out
// of describeDate's own return — blocked, held slots, posture, verify_failed.
// Nothing here re-derives slot arithmetic, the posture ladder, or the covenant
// verdicts; a second opinion about one calendar would be F-04.36's shape, and
// describeDate's eleven-null warrant governs (OFF is spoken as OFF, never as
// free; unknown is spoken as unknown, never as free).
//
// ⚠ THIS FILE STAYS HORIZON-FREE, AND THAT IS WHY `candidateDates` IS AN INPUT.
//   checker_bench §14 asserts no horizon filter exists in this file's code, and
//   the first cut of this function carried its own `.gte/.lte` date-finder —
//   THE BENCH REFUSED IT, correctly: occupancy.js answers questions about DATES;
//   a WINDOW is the caller's question (P4.1's line is a 30-day statement, so the
//   window is the DOOR's semantics — fetchCalendarSnapshot runs the range scan,
//   covenant-carried, and hands the dates in). The invariant the bench encodes is
//   architectural, not cosmetic: F-04.47's disease was a horizon hiding INSIDE the
//   occupancy plane. Keeping every gte/lte out of this file keeps it impossible.
//
// THE CONTRACT ON `candidateDates` (and why a sloppy caller cannot make this lie):
//   · an ARRAY of ISO dates — each is asked THROUGH describeDate, so a date with
//     zero live rows contributes zeros by construction (asking a dead date wastes
//     a read; it never wrongs a count), and a date the caller MISSED is an
//     omission the caller owns (its finder carries the covenant for accuracy).
//   · []   — a WITNESSED empty window: posture is still probed on `from` (an OFF
//     trade with nothing on the books is OFF, not silently open); counts are zero.
//   · null — the finder itself failed: the whole window is UNKNOWN, spoken as
//     unknown, never as free.
async function describeWindow(ctx) {
  const c = ctx || {};
  const { supabase, vendorId, candidateDates } = c;
  const days = Number.isFinite(c.days) && c.days > 0 ? Math.floor(c.days) : 30;
  const from = typeof c.from === 'string' && c.from ? c.from : new Date().toISOString().slice(0, 10);

  const base = {
    from, days, occupancy: 'off', reason: null, unknown: false,
    blockedDates: [], heldSlots: 0, heldDates: [],
  };
  if (!supabase || !vendorId) return { ...base, reason: 'no_context' };
  if (candidateDates === null || candidateDates === undefined) {
    return { ...base, unknown: true, reason: 'verify_failed' };
  }

  const dates = [...new Set(candidateDates.filter((d) => typeof d === 'string' && d))].sort();
  // Posture on an empty window still gets asked — one describeDate call answers it.
  const askDates = dates.length ? dates : [from];
  const reads = await Promise.all(askDates.map((date) => describeDate({ supabase, vendorId, date })));

  const out = { ...base };
  for (let i = 0; i < reads.length; i++) {
    const d = reads[i];
    // blocked:null is "I could not see", and it is NOT false — describeDate's
    // own three-valued contract, carried whole.
    if (d.blocked === null || d.reason === 'verify_failed') out.unknown = true;
    if (d.blocked === true) out.blockedDates.push(askDates[i]);
    if (d.occupancy === 'on' && Array.isArray(d.slots)) {
      const heldHere = d.slots.filter((s) => s.held > 0).length;
      if (heldHere > 0) { out.heldSlots += heldHere; out.heldDates.push(askDates[i]); }
    }
    // Posture is date-independent (the ladder reads the vendor, never the date),
    // so the first read that SAW the vendor speaks for the window.
    if (out.reason === null && out.occupancy === 'off' && d.reason !== 'verify_failed') {
      out.occupancy = d.occupancy;
      out.reason = d.occupancy === 'on' ? null : (d.reason || null);
      if (out.occupancy === 'on') out.reason = null;
    }
  }
  if (out.reason === null && out.occupancy === 'off' && out.unknown) out.reason = 'verify_failed';
  return out;
}

// The occupancy HALF of the date-pressure sentence, in words Victor can carry
// verbatim (spec P4.1 clause 4: sentences authored as he'd speak them; the door
// appends the market half — muhurat, enquiry dates — because those are not
// occupancy's to know). This file owns the verdict vocabulary and therefore its
// sentences (Q-C-3's precedent: capacityMessage lives here for the same reason).
const OFF_WORDS = {
  ruled_off: 'day-slot occupancy is off for this trade',
  delivery:  'a delivery trade — deadlines, not day slots',
  unmapped:  'day-slot occupancy is off (trade uncategorised)',
  no_vendor: 'day-slot occupancy is off (no vendor posture on file)',
  no_context:'the calendar could not be asked',
};
function windowWords(w) {
  const s = w || {};
  const bits = [];
  if (s.unknown) {
    // NEVER NULL-AS-FREE, aggregated: if any date could not be seen, the window
    // is not clean and the sentence says so before it says anything else.
    bits.push('part of the calendar could not be read just now — treat unseen days as unknown, never as free');
  }
  if (s.occupancy === 'on') {
    bits.push(s.heldSlots > 0
      ? `${s.heldSlots} slot${s.heldSlots === 1 ? '' : 's'} held across ${s.heldDates.length} day${s.heldDates.length === 1 ? '' : 's'}`
      : 'no slots held');
  } else {
    bits.push(OFF_WORDS[s.reason] || 'day-slot occupancy is off');
  }
  bits.push(s.blockedDates.length > 0
    ? `${s.blockedDates.length} day${s.blockedDates.length === 1 ? '' : 's'} blocked`
    : 'no days blocked');
  return bits.join(' · ');
}
