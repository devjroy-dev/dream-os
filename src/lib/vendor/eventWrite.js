// src/lib/vendor/eventWrite.js
//
// ══════════════════════════════════════════════════════════════════════════
// THE ONE WRITER of public.events on vendor paths. (TDW_04 Part B, sitting B2)
// ══════════════════════════════════════════════════════════════════════════
//
// THE GUARDRAIL, canonical text (CE-ruled; spec :103, cross-referenced at :130):
//
//   "After B2, src/lib/vendor/eventWrite.js is the ONLY writer of public.events
//    (the vendor calendar). Any other insert/update targeting public.events in
//    vendor paths is a failed session. engine.events is an UNRELATED agent audit
//    trail (F-04.30/F-04.31) — its writers (distill.ts:164/:198,
//    recordPrimitives.ts:62, donnaBench.ts:155) are exempt by plane, not by
//    pardon, and must NEVER be routed through eventWrite. Plane is proven by the
//    client in scope (B1's plane-proof method), never by the table name."
//
// THE CENSUS OF RECORD (Q-B2-6, CE-ruled 2026-07-15) — the guardrail's full map,
// so no future session reads a violated law and "fixes" it:
//
//   EXEMPT BY RULING, until Block 05:
//     src/lib/vendor/calendarSignals.js — the WhatsApp door's calendar apparatus
//     (Q-B2-1). Five public.events writes. 05 owns the WA surface end-to-end and
//     will have WA smokes to prove the change. NOT a stray; NOT a failed session.
//     F-04.38's SCRUB half shipped at B2 (the firewall reaches it); its ROUTING
//     half is 05's.
//   EXEMPT BY RULING, until Block 05/06:
//     src/agent/engine.js:940/:1028/:1239 — the WA engine proper, Protocol §8's
//     named file. Three public.events writes, and they carry NO SCRUB either.
//   EXEMPT BY PLANE (never by pardon, never routed here):
//     distill.ts:164/:198 · recordPrimitives.ts:62 — engine.events, an agent
//     audit trail. Routing these through eventWrite would insert audit rows into
//     vendors' calendars. B1's plane proof caught that BEFORE a line of SQL.
//   OUT OF SCOPE (different owner):
//     brideEngine.js:510/:838/:980/:1008 · api/couple/events.js — bride/couple XOR.
//     (R-3, CE-65: this citation read :508/:978/:1006 — three sites, all one line
//     off. There are FOUR direct public.events writes on that file. A comment
//     describing reality wrongly is the boot-warning defect class wearing prose,
//     CE-62's own words. Line numbers re-derived at the soul ZIP's own tree;
//     COMMENT-ONLY edit, no behaviour, no bench reads this file's prose.)
//
//   EVERY OTHER public.events write on a vendor path routes through here.
//
// ── PLANE ────────────────────────────────────────────────────────────────
// This module takes an INJECTED supabase client and therefore HAS NO PLANE OF
// ITS OWN — resolvable only by caller trace. That is B1's ratified teaching
// example (availability.js's header says the same of itself), and it is why the
// guardrail says "proven by the client in scope, never by the table name."
//   Its callers all inject req.app.locals.supabase (or index.js's :37 client) —
//   PUBLIC-DEFAULT, no db:{schema} option — so every from('events') below is
//   public.events, THE CALENDAR.
//   The ONE deliberate exception is resolveBinderForBooking's explicit
//   .schema('engine') hop, which targets `records` (binders), NEVER `events`. It
//   is one of the enumerated engine-hops-from-outside; it does not make this
//   module engine-planed, and nothing else here crosses.
//
// ── DISCLOSED SIGNATURE ADAPTATIONS (Q-B2-7, extended by CE ruling 2026-07-15) ──
// THE LAW: "the diff must show RELOCATION, NOT REWRITE. If a reviewer cannot see
// that a moved function is byte-identical to its origin, the sitting failed."
// THE RULING: the law bends, STATED, never silently — "its purpose is
// reviewability, not handcuffs; a disclosed, ruled signature change serves it, a
// silent one betrays it." Named here so no reviewer has to discover it:
//
//   findExistingEvent        chat.js (HEAD 19c52c5) :233-248
//   resolveBinderForBooking  chat.js (HEAD 19c52c5) :137-152
//   the ALREADY_BLOCKED read availability.js :90-104
//
//   Each MOVED WITH ITS LOGIC BYTE-PRESERVED. The only change: `req` dereferences
//   became parameters — req.app.locals.supabase -> supabase, req.vendor.id ->
//   vendorId, req.agentId -> agentId. eventWrite is called from availability.js,
//   which has NO `req` at all, so a req-shaped helper is unreachable from it.
//   Comments, predicates, limits, guard clauses, and the confident-single-match
//   rules are carried verbatim. Nothing was "improved" in transit.
//
// ══════════════════════════════════════════════════════════════════════════

'use strict';

const { scrubForStorage } = require('./scrub');
const { logActivity }     = require('./snapshot');

// TDW_04 — THE CHECKER SITTING. The seam predicted at :241-275 is now wired.
//
// `checkOccupancy` is the CHECKER and it lives in occupancy.js, beside the set it
// consumes. `isRefusal`/`isOverridable` are the GATE's two questions, and they live
// there too by Q-C-3's ruling (CE, 2026-07-16): THE FILE THAT OWNS THE VERDICT
// VOCABULARY OWNS ITS FORCE SEMANTICS. This door asks; it never learns why. A door
// that hardcoded `conflict.kind !== 'date_blocked'` would be the second home for a
// rule that has one — F-04.36, on the very seam this block exists to build.
//
// occupancy.js lazy-requires deriveSlot back out of this file (its own comment says
// why, and cites categoryProfiles.js:122's precedent). deriveSlot has ONE home and
// it is here: §2.1a, "two homes for one rule would BE F-04.36."
const { checkOccupancy, isRefusal, isOverridable } = require('./occupancy');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── THE CALENDAR'S KIND VOCABULARY (Q-B2-5(a), CE-ruled 2026-07-15) ────────
//
// THESE ARE THE 13 VALUES public.events.kind's CHECK ACCEPTS. Read from the
// ladder, not from prose: 0007 created the table, 0013 widened kind to 12, and
// 0069 added the 13th (`blocked`). docs/SCHEMA.md:286 documents all 13.
//
// ⚠️ THREE LISTS LIVE IN THIS NEIGHBOURHOOD. THEY ARE DELIBERATELY DIFFERENT.
//    DO NOT "UNIFY" THEM. Unifying two of them IS F-04.36's regression.
//
//   1. CALENDAR_KINDS (here, 13) — THE WRITE VOCABULARY. "What may exist on the
//      calendar at all." Mirrors the DB CHECK exactly. Its job: refuse a kind the
//      database would refuse, with a readable error instead of a 400.
//
//   2. BOOKED_KINDS (cabinet.js:125, chat.js:132 — NINE) — THE ON-CALENDAR
//      PREDICATE. "What counts as occupying a sellable date for the drawer's
//      count." It EXCLUDES `blocked` (F-04.36: a block is not an engagement) and
//      excludes call/task/reminder. It is a READ predicate. It has never been a
//      write allowlist and must not become one.
//
//   3. The OCCUPYING subset (does not exist yet) — THE CAPACITY PREDICATE. "What
//      consumes a slot's capacity." C5 names the appointments that do NOT
//      (trial, fitting, recce, call, meeting, task, reminder, social). ⇒ B3's
//      OPENING PROPOSAL (Q-B2-9(i)/(ii), CE-ruled: the appointment list is NOT
//      presumed exhaustive; B3 verifies it against THIS list and proposes the
//      occupying-subset table for ratification; a no-time `other` LEANS
//      NON-OCCUPYING — "a timeless entry must not eat a day" — final table
//      ratified at B3).
//
//   BOOKED_KINDS ⊄ occupying and occupying ⊄ BOOKED_KINDS. BOOKED_KINDS contains
//   meeting/recce/fitting/trial/social — every one of which C5 calls an
//   APPOINTMENT. Two predicates, adjacent names, different jobs. A session that
//   collapses them will silently either (a) let blocks inflate the drawer again,
//   or (b) let appointments eat capacity. Both have already happened once.
const CALENDAR_KINDS = [
  'shoot', 'call', 'meeting', 'task', 'reminder', 'recce',
  'fitting', 'trial', 'family', 'ceremony', 'social', 'other',  // 0007 + 0013 — 12
  'blocked',                                                     // 0069 — the 13th
];

// created_at is NOT decoration: availability.js's toBlock() maps it onto the FROZEN
// wire ({id, blocked_date, reason, created_at}, PWA calendar/page.tsx:96). Shipping
// this select without it (a6854bb) would have handed the PWA created_at:undefined
// the moment blockDate became a thin caller. Latent, caught by doing the relocation
// rather than by describing it. deleted_at rides so the soft-delete path can confirm.
// ── STATE, relocated from lib/vendor/events.js ────────────────────────────
// TDW_04 A3 rider (F-04.8, CE-ratified): `state` joins the editable set — the
// P4 swipe table's "mark done" had no door, so A2 stubbed it honest and logged
// the gap rather than inventing a route. Values mirror the DB CHECK exactly.
// Relocated here at B2 because the writer must not accept a state the door used
// to refuse: routing api/vendor/events.js PATCH through eventWrite without this
// would have SILENTLY DROPPED the validation and handed a raw 400 to the vendor.
const ALLOWED_STATES = ['upcoming', 'done', 'cancelled'];

const EVENT_SELECT = 'id, title, event_date, event_time, kind, slot, state, notes, linked_binder_id, linked_lead_id, ready_by, created_at, deleted_at, assigned_member_ids';

// ── SLOT DERIVATION (C2's boundaries) ─────────────────────────────────────
//
// P3's rule has four branches. TWO ARE SETTLED AND LIVE HERE. TWO ARE B3's.
//
//   1. caller sent a slot            -> honoured verbatim.                  [LIVE]
//   2. event_time present            -> C2's boundaries, exactly.           [LIVE]
//        <12:00 morning · 12:00-15:59 noon · >=16:00 evening
//   3. no time + kind OCCUPYING      -> 'full_day'                          [B3]
//   4. no time + kind APPOINTMENT    -> null (timeline-only)                [B3]
//
// WHY 3 AND 4 ARE NOT HERE, and why returning null is not a stub:
//   Branches 3/4 need the OCCUPYING/APPOINTMENT classification, which does not
//   exist anywhere in this repo (grepped at 19c52c5: zero hits for occupying,
//   APPOINTMENT_KINDS, occupancy, slot_capacity) and which Q-B2-9(i)/(ii) ruled
//   to B3's opening proposal. Minting it here would be an unratified decision
//   about whether a vendor's whole day gets consumed.
//   AND — THIS IS THE POINT — returning null for the no-time case is EXACTLY
//   HEAD's behaviour. At 19c52c5 no booking carries a slot at all; only blocks
//   populate the column, and they arrive via branch 1 (availability.js sends
//   slot:'full_day' explicitly). So this function ships ZERO behaviour change
//   for every existing caller, and B3 adds branches 3/4 as a pure extension.
//   A seam that matches current behaviour is not a placeholder. It is the
//   honest shape of a rule that is half-ruled.
// ── BRANCHES 3/4 LANDED AT THE CHECKER SITTING (2026-07-16) ───────────────
// The classification the comment above says does not exist now does, at ONE home:
// occupancy.js. This function CONSULTS it by import; the function did not move and
// the table did not fork. Two homes for one rule would BE F-04.36.
//
// PURE EXTENSION, and the proof is the shape: branches 1-2 are untouched and still
// answer first. The only inputs that reach 3/4 are the ones that used to fall
// through to `return null` — a caller with no slot and no time. Everything witnessed
// correct at HEAD stays witnessed correct.
//
// `kind` JOINS THE SIGNATURE, and it had to: branches 3/4 are the ONLY kind-aware
// branches and the classification is a function of kind. Branches 1-2 stay KIND-BLIND
// and this signature does not change that — SLOT ANSWERS WHERE, OCCUPANCY ANSWERS
// WHETHER (standing distinction). A timed appointment still gets slot='morning'
// because slot PLACES it on the timeline; it just consumes nothing.
// Disclosed, never silent (Q-B2-7's ratified law): the caller at :345 gains `kind`.
function deriveSlot({ event_time, slot, kind }) {
  if (slot) return slot;                                  // branch 1
  if (typeof event_time === 'string' && /^\d{2}:/.test(event_time)) {
    const h = parseInt(event_time.slice(0, 2), 10);       // branch 2 — C2, exactly
    if (Number.isNaN(h)) return null;
    if (h < 12) return 'morning';                         // until 12:00
    if (h < 16) return 'noon';                            // 12:00-15:59
    return 'evening';                                     // 16:00 onwards
  }
  // Lazy require: occupancy.js requires this file for deriveSlot, this line requires
  // it back for the table. The cycle resolves at CALL time. categoryProfiles.js:122's
  // precedent, with its own words: "to avoid any load-order coupling."
  const { isOccupying, isAppointment } = require('./occupancy');
  if (isOccupying(kind))   return 'full_day';             // branch 3 — no time, work
  if (isAppointment(kind)) return null;                   // branch 4 — timeline-only
  return null;              // `other` / `blocked` / absent kind: NEITHER list. A kind
}                           // the ternary does not classify does not get a slot invented
                            // for it — and an ABSENT kind is a PATCH that isn't moving
                            // the row through space (Q-C-1: the ctx is the patch).

// ── DEDUPE, booking side — RELOCATED from chat.js:233-248 ─────────────────
// (a) Dedupe: an event for the same client on the same date already on the calendar IS this booking.
async function findExistingEvent(supabase, vendorId, bk) {
  const hint = String(bk.title || '').split(/[-–—·:]/)[0].trim();
  if (hint.length < 2) return null;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, linked_binder_id, state')
      .eq('vendor_id', vendorId)
      .eq('event_date', bk.event_date)
      .neq('state', 'cancelled')
      // ── F-04.58's CURE (CE-ruled 2026-07-16 — one line, F-04.25's family) ──
      // This clause was never here, and the UPDATE this read feeds REQUIRES it
      // (`.is('deleted_at', null)`, below). So a dedupe that resolved onto a
      // TOMBSTONED row handed the writer an id its own predicate then refused, and
      // the vendor read "Event not found." about an event he was looking at.
      // Live shape: soft-delete "Meera - shoot" on 22 Nov, re-book that client on
      // that date, be told the event does not exist. F-04.25 spent a whole finding
      // on a read that forgot deleted_at; this is the same read forgetting the same
      // covenant, one file over. It also makes `existing` LIVE BY CONSTRUCTION,
      // which is what lets the checker trust it without a second trip (Q-C-1(α)).
      .is('deleted_at', null)
      .ilike('title', `${hint}%`)
      .limit(2);
    if (error || !data || data.length !== 1) return null; // 0 or ambiguous -> a fresh insert is safer
    return data[0];
  } catch (e) { console.warn('[eventWrite:dedupe]', e.message); return null; }
}

// ── DEDUPE, block side — RELOCATED from availability.js:90-104 ────────────
//
// ALREADY_BLOCKED. A block's dedupe is NOT the booking's dedupe: a re-booking is
// an UPDATE (idempotent re-confirmation), a re-block is a REFUSAL. Two dedupe
// rules, one door, because they are two different facts.
//
// THE WIRE IS FROZEN AND THIS CARRIES IT: availability.js:73 maps
// `code === 'ALREADY_BLOCKED'` -> HTTP 409, witnessed in B1's prod smoke. The
// code rides out on the return so the relocation is byte-for-byte on the wire.
//
// FAIL-CLOSED (F15's law): a guard read that ERRORS is not a guard read that
// found nothing. No truthful read, no write.
//
// ATOMICITY (F-04.32, cured at 0075): this read-before-write is NOT atomic and
// never was — B1 shipped it disclosed. Since 0075 the DATABASE refuses the second
// row (UNIQUE partial index on (vendor_id, event_date) where kind='blocked' and
// deleted_at is null). This read survives as the FRIENDLY path: it turns the
// common case into a clean 409 instead of a 23505. The insert's 23505 handler
// below is the RACE path — the one this read cannot close.
// ── SLOT-AWARE since 0078 (TDW_04 B6 surfaces S2, R-B6-17) ────────────────
// THE ENFORCEMENT SITE, proposed from the code with evidence and ruled in the
// ZIP's disclosure (§0.2): every block write at HEAD routes through THIS read —
//   blockDate (lib/vendor/availability.js) is a thin writeEvent caller;
//   blockHands' donna_block_date routes through blockDate ("inherit, for free,
//   every ruling blockDate already carries" — its own header);
//   the CRUD events door refuses kind='blocked' (ALLOWED_KINDS is 12);
//   the WA engine offers no 'blocked' kind (recordPrimitives: nine kinds) and
//   chat.js's door erases an invented one.
// One read, one home. A second copy of this rule anywhere would be F-04.36.
//
// THE RULE (R-B6-17, verbatim): one live block per (vendor_id, event_date,
// slot); full_day EXCLUSIVE both directions, refused at the write path naming
// the existing block. Concretely:
//   want full_day  -> ANY existing live block on the date refuses;
//   want a slot    -> an existing full_day refuses; an existing SAME-slot
//                     refuses ('Already blocked.', the byte-identical B1 wire —
//                     today every block is full_day, so full_day-over-full_day
//                     lands here and the wire cannot tell 0078 happened);
//   want a slot, a DIFFERENT slot held -> allowed. That is the feature.
//
// WHAT THE DATABASE CLOSES vs WHAT THIS READ CLOSES: 0078's widened unique
// index refuses the same-slot RACE (23505 -> ALREADY_BLOCKED below, unchanged).
// The CROSS-slot race (concurrent full_day + morning) is this read's alone —
// read-before-write, non-atomic, disclosed exactly as 0075 disclosed its own
// pre-index race. The window is one vendor racing himself across two devices.
async function findExistingBlock(supabase, vendorId, event_date, slot) {
  const { data: rows, error: readErr } = await supabase
    .from('events')
    .select('id, title, slot')
    .eq('vendor_id', vendorId)
    .eq('kind', 'blocked')
    .eq('event_date', event_date)
    .is('deleted_at', null);
  if (readErr) {
    return { err: `Could not check existing blocks (${readErr.message}) — nothing was written.` };
  }
  const live = rows || [];
  if (!live.length) return { existing: null };

  const want = slot || 'full_day';   // blocks always carry a slot (0078's CHECK); a
                                     // caller that sent none means the whole day.
  // Same slot held (incl. full_day over full_day — the pre-0078 case, byte-
  // identical wire): the B1 sentence, untouched.
  const same = live.find((x) => (x.slot || 'full_day') === want);
  if (same) return { existing: same };

  // full_day EXCLUSIVE both directions — the refusal NAMES the existing block
  // (R-B6-17's own words). TDW_04 B6 rider — F-04.77's SENTENCE half (Q-S2-1
  // ADOPTED; founder's veto answer "fine as is" on the proposed shape): the old
  // composition read `Already blocked — Blocked — the morning, Blocked — the
  // evening. …` when titles were the default — clumsy, and it overflowed the
  // one-line toast (the render half is the BlockSheet's inline verdict, sibling
  // rider). Now: a default-titled block is named by its SLOT alone; a real
  // title stays (`Out of town — the morning`); number agreement follows the
  // count. The two-block default specimen renders the founder-approved sentence
  // byte-for-byte. Copy on the veto-on-sight list (the real-title variant is a
  // new composition — flagged in the delivery's veto appendix).
  if (want === 'full_day') {
    const parts = live.map((x) => {
      const t = String(x.title || '').trim();
      return (t && t !== 'Blocked') ? `${t} — ${slotWords(x.slot)}` : slotWords(x.slot);
    });
    const named = parts.length > 1
      ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
      : parts[0];
    const many = parts.length > 1;
    return { existing: live[0], exclusive: `Already blocked — ${named} ${many ? 'are' : 'is'} held. A full-day block can't sit over ${many ? 'them' : 'it'}; unblock ${many ? 'them' : 'it'} first.` };
  }
  const fullDay = live.find((x) => (x.slot || 'full_day') === 'full_day');
  if (fullDay) {
    return { existing: fullDay, exclusive: `Already blocked — the whole day is held (${fullDay.title}). Unblock the day first.` };
  }
  // A different slot is held and only that: lawful coexistence.
  return { existing: null };
}

// Slot words for vendor-facing sentences. Utility copy, veto-on-sight list.
function slotWords(slot) {
  if (slot === 'morning') return 'the morning';
  if (slot === 'noon')    return 'the noon slot';
  if (slot === 'evening') return 'the evening';
  return 'the whole day';
}

// ── BINDER LINKING — RELOCATED from chat.js:137-152 ───────────────────────
async function resolveBinderForBooking(supabase, agentId, bk) {
  const given = String(bk.binder_id || '').trim();
  if (UUID_RE.test(given)) return given;
  const hint = String(bk.title || '').split(/[-\u2013\u2014\u00b7:]/)[0].trim();
  if (hint.length < 2) return null;
  try {
    const { data, error } = await supabase.schema('engine')
      .from('records')
      .select('id, client')
      .eq('agent_id', agentId)
      .ilike('client', hint)
      .limit(2);
    if (error || !data || data.length !== 1) return null; // not a confident single match -> unlinked
    return data[0].id;
  } catch (e) { console.warn('[eventWrite:link binder]', e.message); return null; }
}

// ── OCCUPANCY — THE B3 SEAM ───────────────────────────────────────────────
//
// §8's clause binds B2: "occupancy.js keeps its check function pluggable
// (capacity resolver takes a context object, not scalars). Nothing in 04 may
// foreclose these [04.5's crew math]."
//
// So this takes ONE CONTEXT OBJECT, never scalars, and B3 replaces the body with
// a require('./occupancy') — no caller changes, no signature churn, and 04.5's
// per-crew-member math can extend the same context.
//
// It returns null at B2, ALWAYS, and that is not a stub — it is the ruled state:
//   · capacity            needs vendors.slot_capacity -> 0076 -> B3's opening
//   · appointment_overlap needs the occupying/appointment map -> B3
//   · cluster             needs the map + the >3-ready_by-in-7-days rule -> B3
// Q-B2-9(iii), CE-ruled: §1.6's byte-identical-ConflictPayload proof MOVES TO B3
// with the machinery that can satisfy it. B2 ships the CONTROL FLOW below —
// conflict-without-force writes NOTHING, force writes and records the clash — so
// B3 writes a checker, not a door.
//
// ConflictPayload wire (spec :62-66), for the checker B3 will write:
//   { kind:'capacity'|'appointment_overlap'|'cluster', slot?, date,
//     holding:[{event_id,title,slot,kind}], capacity?, message }
//   message = a plain sentence the door hands Victor VERBATIM.
//
// RATIFIED-IN-ADVANCE and waiting for B3's code (CE, 2026-07-15): the verdict
// vocabulary splits. DATE_BLOCKED is NON-OVERRIDABLE (a block is a stated
// refusal, not a risk — force overriding it would make "blocked" mean "blocked
// unless someone is confident"; the honest path is unblock, then book — two
// deliberate acts, both witnessed). CONFLICT is FORCE-ABLE (double-booking is a
// risk a vendor may knowingly accept). B4's conflict-verdict work inherits this
// as given. NOTE THE CONSEQUENCE FOR THIS FILE: `force` must never reach the
// block-dedupe branch, and below, it does not.
// ── LANDED AT THE CHECKER SITTING (2026-07-16) ────────────────────────────
//
// The ruling above is executed literally: the body IS a require('./occupancy'),
// imported at the top of this file, with NO caller changes and NO signature churn.
// All eleven of this door's callers are untouched. 04.5's per-crew-member math
// extends the same context object without reopening the seam.
//
// THE VOCABULARY SPLIT B2 RATIFIED IN ADVANCE IS NOW REAL — and it is real at the
// GATE below, not here. B2's note said "`force` must never reach the block-dedupe
// branch, and below, it does not." That covered the RE-BLOCK (ALREADY_BLOCKED,
// which returns above force). It did NOT cover BOOKING ONTO a block — that is this
// checker's verdict, and it lives DOWNSTREAM of the gate, where `force` beat it.
// Proven by running it before building it: a forced booking landed on a block and
// printed "[forced] You've blocked 19 July" into the vendor's own note. Q-C-3 closed
// that half. Both refusal classes are now asserted by source position — see the gate.
//
// THE CONTEXT IS THE PATCH, NEVER THE ROW (Q-C-1). `kind` is undefined on all nine
// update shapes. The checker resolves the EFFECTIVE row itself — row ⊕ patch — which
// is why `state` and `deleted_at` ride the context below.
// -> occupancy.js::checkOccupancy

// ══════════════════════════════════════════════════════════════════════════
// writeEvent — the door
// ══════════════════════════════════════════════════════════════════════════
//
// CONTRACT (Q-B2-10, CE-ratified 2026-07-15):
//   writeEvent(supabase, { vendorId, agentId?, surface, source, event_id?,
//                          title, event_date, event_time?, slot?, kind, notes?,
//                          linked_binder_id?, client_hint?, ready_by?, state?,
//                          force? })
//     -> { ok:true,  event }
//     -> { ok:false, conflict }   // occupancy said no and force was absent
//     -> { ok:false, error, code? }
//
//   `supabase` FIRST PARAM — the spec's illustrative signature carries no client
//     at all, which is unbuildable; every sibling in lib/vendor/ takes
//     (supabase, vendorId, …). Explicit dependency, door-testable. RATIFIED.
//   `code` ON THE RETURN — not in the spec's {ok, event, conflict?}, and
//     load-bearing: availability.js:73's 409 semantics survive byte-for-byte on
//     the wire only if the code rides out. RATIFIED.
//
// ORDER (§1.1, non-negotiable): slot derivation -> dedupe -> binder linking ->
// occupancy check -> write. ON CONFLICT WITHOUT FORCE: return conflict, WRITE
// NOTHING.
async function writeEvent(supabase, params) {
  const {
    vendorId, agentId = null, surface = 'pwa', source = 'crud',
    event_id = null, title, event_date, event_time, kind,
    notes, linked_binder_id = null, client_hint = null,
    ready_by, state, force = false, linked_lead_id,
    deleted_at,   // undefined = untouched. Set = SOFT DELETE (update path only).
    assigned_member_ids,   // 04.5 P1: undefined = crew untouched; array = SET crew ([] clears).
  } = params || {};

  // ── undefined vs null: NOT pedantry, a REGRESSION GUARD ──────────────────
  // updateEvent (lib/vendor/events.js:58-71), which this door replaces, patches on
  // `patch[key] !== undefined`. So {event_time: null} CLEARS the time. An earlier cut
  // of this file defaulted these params to null and tested `!= null`, which silently
  // DROPPED every clear — a vendor removing a time from an event would have watched
  // it stay. Caught by testing the two implementations against each other before the
  // door was written, not by reasoning about them.
  //   undefined -> field absent from the patch (untouched)
  //   null      -> field patched to NULL (cleared)
  // Callers that mean "only if truthy" pass `x || undefined`, which is what the old
  // inline `if (bk.event_time)` guards meant.

  if (!vendorId) return { ok: false, error: 'vendorId is required.' };
  const isUpdate = !!event_id;

  // ── VALIDATE ────────────────────────────────────────────────────────────
  // Mirrors the DB's own CHECKs so a bad kind reads as a sentence, not a 400.
  if (kind != null && !CALENDAR_KINDS.includes(kind)) {
    return { ok: false, error: 'Invalid kind. Must be one of: ' + CALENDAR_KINDS.join(', ') + '.' };
  }
  // Relocated from updateEvent. Same list, same sentence, same job.
  if (state != null && !ALLOWED_STATES.includes(state)) {
    return { ok: false, error: 'Invalid state. Must be one of: ' + ALLOWED_STATES.join(', ') + '.' };
  }
  // TDW_04 B6-S2: `slot` joins the mirrored CHECKs — the Move picker and the
  // slot toggles now send it over the wire, and events_slot_check would refuse
  // a bad value as a raw constraint error. Same job as the kind/state lines.
  if (params.slot != null && !['morning', 'noon', 'evening', 'full_day'].includes(params.slot)) {
    return { ok: false, error: 'Invalid slot. Must be one of: morning, noon, evening, full_day.' };
  }
  if (!isUpdate) {
    if (!title || !String(title).trim())    return { ok: false, error: 'title is required.' };
    if (!event_date || !DATE_RE.test(String(event_date))) {
      return { ok: false, error: 'event_date is required in YYYY-MM-DD format.' };
    }
    if (!kind) return { ok: false, error: 'kind is required.' };
  }
  if (event_date != null && !DATE_RE.test(String(event_date))) {
    return { ok: false, error: 'event_date must be in YYYY-MM-DD format.' };
  }

  // ── VALIDATE crew (04.5 P1) ──────────────────────────────────────────────
  // undefined -> the write does not touch crew. An array SETS the crew (incl. [] = clear).
  // Every id must be a UUID on THIS vendor's ACTIVE team (active=true AND deleted_at IS NULL,
  // the same set team.js:19-27 lists). Names are resolved HERE, once, and handed to the
  // checker in ctx.members so occupancy never re-queries them (the door owns the names).
  let validatedMemberIds;                 // undefined -> column untouched
  const memberNameById = new Map();
  if (assigned_member_ids !== undefined) {
    if (!Array.isArray(assigned_member_ids)) {
      return { ok: false, error: 'assigned_member_ids must be an array of team member ids.' };
    }
    const ids = [...new Set(assigned_member_ids.map((x) => String(x)))];
    for (const id of ids) {
      if (!UUID_RE.test(id)) return { ok: false, error: 'assigned_member_ids must be team member UUIDs.' };
    }
    if (ids.length) {
      const r = await supabase.from('team_members')
        .select('id, name').eq('vendor_id', vendorId).eq('active', true).is('deleted_at', null).in('id', ids);
      if (r.error) return { ok: false, error: r.error.message };
      for (const m of (r.data || [])) memberNameById.set(m.id, m.name);
      const missing = ids.filter((id) => !memberNameById.has(id));
      if (missing.length) return { ok: false, error: 'One or more of those members are not on your active team.' };
    }
    validatedMemberIds = ids;
  }
  const membersForCheck = validatedMemberIds
    ? validatedMemberIds.map((id) => ({ id, name: memberNameById.get(id) || null }))
    : undefined;

  // ── 1. SLOT DERIVATION ──────────────────────────────────────────────────
  // `kind` joins the call: branches 3/4 are the only kind-aware branches and they
  // landed this sitting. Branches 1-2 are unchanged and still answer first, so every
  // caller witnessed correct at HEAD stays witnessed correct. Disclosed, never silent.
  const derivedSlot = deriveSlot({ event_time, slot: params.slot, kind });

  // TDW_04 B6-S2 (0078's events_blocked_slot_check, mirrored as a sentence):
  // a block must name its slot — deriveSlot returns null for a slotless,
  // timeless 'blocked' (it is on NEITHER classification list, its own comment
  // says so), and the DB would refuse the insert as a raw constraint error.
  // Unreachable from every caller at HEAD (blockDate always sends a slot);
  // the guard is here because "unreachable" is a claim.
  if (!isUpdate && kind === 'blocked' && !derivedSlot) {
    return { ok: false, error: 'A block must name its slot: morning, noon, evening, or full_day.' };
  }

  // The free-text cells are the only ones that can carry a persona name.
  // event_date / event_time / kind are enums and dates — scrubbing them is noise.
  // (F-04.34's rule, F-04.38's home.)
  const cleanTitle = title == null ? null
    : scrubForStorage(supabase, vendorId, surface, String(title).slice(0, 200), `eventWrite:${source}`, 'title');
  const cleanNotes = notes == null ? null
    : scrubForStorage(supabase, vendorId, surface, String(notes), `eventWrite:${source}`, 'notes');

  // ── 2. DEDUPE ───────────────────────────────────────────────────────────
  let existing = null;
  if (!isUpdate) {
    if (kind === 'blocked') {
      // A re-block is a REFUSAL, not an update. force does not reach here, by
      // ruling: a block is a stated refusal, not a conflict.
      // SLOT-AWARE since 0078 (R-B6-17): the derived slot rides the read. The
      // same-slot case keeps the byte-identical B1 wire ('Already blocked.',
      // ALREADY_BLOCKED -> the door's 409); full_day exclusivity returns the
      // sentence that NAMES the existing block, same code so the wire's 409
      // semantics hold for every block collision.
      const r = await findExistingBlock(supabase, vendorId, event_date, derivedSlot);
      if (r.err)      return { ok: false, error: r.err };
      if (r.exclusive) return { ok: false, error: r.exclusive, code: 'ALREADY_BLOCKED' };
      if (r.existing) return { ok: false, error: 'Already blocked.', code: 'ALREADY_BLOCKED' };
    } else {
      existing = await findExistingEvent(supabase, vendorId, { title, event_date });
    }
  }

  // Sanitise linked_lead_id -- model sometimes passes a name instead of UUID
  // (relocated verbatim from createEvent; the comment is its own, and it is the
  // reason the guard exists — a name in a uuid column is a 400 the vendor reads
  // as "the app is broken").
  const safeLeadId = (linked_lead_id && UUID_RE.test(linked_lead_id)) ? linked_lead_id : null;

  // ── 3. BINDER LINKING ───────────────────────────────────────────────────
  let linkedBinder = linked_binder_id || null;
  if (!linkedBinder && agentId && kind !== 'blocked') {
    linkedBinder = await resolveBinderForBooking(supabase, agentId, { binder_id: client_hint, title });
  }

  // ── 4. OCCUPANCY CHECK ──────────────────────────────────────────────────
  // `state` and `deleted_at` JOIN THE CONTEXT (Q-C-1/Item 3, CE-ruled 2026-07-16):
  // the effective row is row ⊕ patch across kind, event_date, event_time, slot,
  // ready_by, STATE and DELETED_AT — and a row being cancelled or soft-deleted asks
  // no occupancy question. The checker cannot answer that about fields it cannot see.
  // Disclosed, never silent (Q-B2-7's ratified law).
  const conflict = await checkOccupancy({
    supabase, vendorId, kind, event_date, slot: derivedSlot, event_time,
    ready_by, source, event_id, existing, state, deleted_at,
    members: membersForCheck,   // 04.5 P1: [{id,name}] being assigned this write, or undefined
  });

  // ── THE GATE (Q-C-3, CE-ruled 2026-07-16). THREE LINES, IN THIS ORDER. ──
  //
  // THE DOOR ASKS THE CHECKER. It does not know what `date_blocked` means, and it
  // must not learn: the file that owns the verdict vocabulary owns its force
  // semantics (F-04.36's law applied forward). A `kind !== 'date_blocked'` here
  // would be the second home for a rule that has one.
  //
  // 1. THE ERROR CHANNEL, ABOVE FORCE. F15's law, and findExistingBlock's precedent
  //    twelve lines up is the shape this mirrors: a guard read that ERRORS is not a
  //    guard read that found nothing. FAIL-CLOSED — force cannot beat it, because it
  //    never reaches the force branch. The trade is ruled with eyes open: availability
  //    of an edit yields to integrity of the calendar. A refused edit is retryable;
  //    a waved-through false negative is permanent divergence.
  if (conflict && conflict.err) return { ok: false, error: conflict.err };

  // 2. THE REFUSAL GATE. `isRefusal` is why C9's ruled "never blocks" survives contact
  //    with this line: an ADVISORY (appointment_overlap, cluster) reaching a bare
  //    `if (conflict && !force)` would block the write it was ruled never to block.
  //    Advisories ride out below on { ok:true, event, conflict } — the return B2
  //    already built for them and which was dead until now.
  //    `isOverridable` is why a block is a block: force beats `capacity` (a
  //    double-booking is a risk a vendor may knowingly accept) and never beats
  //    `date_blocked` (a stated refusal is not a risk). Both classes of refusal are
  //    now asserted BY SOURCE POSITION — this line is above the force branch, and
  //    there is no path from a refusal to a write that does not pass through it.
  if (conflict && isRefusal(conflict) && (!force || !isOverridable(conflict))) {
    // WRITE NOTHING. The spec is absolute about this and so is this door.
    return { ok: false, conflict };
  }

  // 3. force:true -> the clash goes in the note. A forced write that hides what it
  // was forced past is a false "done" wearing a calendar's clothes — and a forced
  // write that CLAIMS to have forced past an advisory is the same lie facing the
  // other way, which is why `isRefusal` guards this too. Nothing is forced past a
  // heads-up.
  let finalNotes = cleanNotes;
  if (conflict && force && isRefusal(conflict)) {
    const clash = `[forced ${new Date().toISOString().slice(0, 10)}] ${conflict.message}`;
    finalNotes = finalNotes ? `${finalNotes}\n${clash}` : clash;
  }

  // ── crew delta + note-trail (04.5 P1) ────────────────────────────────────
  // On the assignment path, diff the crew against the current row and append audit lines
  // to the SAME notes column that holds the event's trail. Read the target once (its crew
  // AND its notes) so the trail ACCUMULATES rather than replacing — unless the caller is
  // itself rewriting notes this call, in which case the caller's notes are the base.
  let assignmentNoteAdded = false;
  let crewToConfirm = [];
  if (validatedMemberIds !== undefined) {
    crewToConfirm = validatedMemberIds;                 // full new set -> pending upsert post-write
    let oldIds = [], existingNotes = null;
    const readId = event_id || (existing && existing.id) || null;
    if (readId) {
      const cur = await supabase.from('events')
        .select('assigned_member_ids, notes').eq('id', readId).eq('vendor_id', vendorId)
        .is('deleted_at', null).maybeSingle();
      if (!cur.error && cur.data) {
        if (Array.isArray(cur.data.assigned_member_ids)) oldIds = cur.data.assigned_member_ids.map(String);
        existingNotes = cur.data.notes || null;
      }
    }
    const newSet = new Set(validatedMemberIds), oldSet = new Set(oldIds);
    const added   = validatedMemberIds.filter((id) => !oldSet.has(id));
    const removed = oldIds.filter((id) => !newSet.has(id));

    if (added.length || removed.length) {
      const needNames = removed.filter((id) => !memberNameById.has(id));
      if (needNames.length) {   // removed members may be inactive now — name only, no active filter
        const rn = await supabase.from('team_members').select('id, name').eq('vendor_id', vendorId).in('id', needNames);
        if (!rn.error) for (const m of (rn.data || [])) memberNameById.set(m.id, m.name);
      }
      const now = new Date();
      const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const stamp = `${now.getUTCDate()} ${MON[now.getUTCMonth()]}`;   // COPY — "14 Jul" per spec; on the veto list
      const nm = (id) => memberNameById.get(id) || 'Member';
      const trail = [
        ...added.map((id)   => `${nm(id)} assigned — ${stamp}`),
        ...removed.map((id) => `${nm(id)} unassigned — ${stamp}`),
      ].join('\n');
      let base = finalNotes;
      if (notes === undefined && existingNotes) base = base ? `${existingNotes}\n${base}` : existingNotes;
      finalNotes = base ? `${base}\n${trail}` : trail;
      assignmentNoteAdded = true;
    }
  }

  // ── 5. WRITE ────────────────────────────────────────────────────────────
  let event = null, error = null;

  if (isUpdate || existing) {
    const targetId = event_id || existing.id;
    const patch = {};
    if (title      !== undefined) patch.title      = cleanTitle;
    if (event_date !== undefined) patch.event_date = event_date;
    if (event_time !== undefined) patch.event_time = event_time;
    if (kind       !== undefined) patch.kind       = kind;
    // `isRefusal` guards this for a reason that is not symmetry: when notes is
    // undefined, cleanNotes is null, so an unguarded `(conflict && force)` on an
    // ADVISORY would patch notes = null and CLEAR the row's notes. Nothing was
    // forced; the note is untouched. (The undefined-vs-null law at :309-319 is the
    // same trap that once dropped every clear, read from the other side.)
    if (notes      !== undefined || (conflict && force && isRefusal(conflict)) || assignmentNoteAdded) patch.notes = finalNotes;
    if (validatedMemberIds !== undefined) patch.assigned_member_ids = validatedMemberIds;   // 04.5 P1
    if (derivedSlot != null)      patch.slot       = derivedSlot;
    if (ready_by   !== undefined) patch.ready_by   = ready_by;
    if (state      !== undefined) patch.state      = state;
    if (linked_lead_id !== undefined) patch.linked_lead_id = safeLeadId;
    // SOFT DELETE (Q-B1-7's covenant, and the guardrail's arithmetic). unblockDate
    // and deleteEvent are .update()s on public.events, so after B2 they are writes
    // that must come through here or the guardrail is violated on day one. A hard
    // delete is never minted: B0 spent a whole finding (F-04.25) curing a read that
    // forgot deleted_at; nothing here un-learns that.
    if (deleted_at !== undefined) patch.deleted_at = deleted_at;
    // Dedupe's own rule, carried from chat.js: link an existing event that names
    // no binder; never overwrite a link it already has.
    if (linkedBinder && (!existing || !existing.linked_binder_id)) patch.linked_binder_id = linkedBinder;

    if (!Object.keys(patch).length) {
      return { ok: true, event: existing, deduped: true };
    }
    const r = await supabase.from('events')
      .update(patch).eq('id', targetId).eq('vendor_id', vendorId).is('deleted_at', null)
      .select(EVENT_SELECT).maybeSingle();
    event = r.data; error = r.error;
    if (!event && !error) return { ok: false, error: 'Event not found.' };
  } else {
    const row = {
      vendor_id: vendorId,          // couple_id stays null — events_owner_xor (0013) satisfied
      title:      cleanTitle,
      event_date,
      kind,
      state:      state || 'upcoming',
    };
    if (event_time)  row.event_time      = event_time;
    if (finalNotes)  row.notes           = finalNotes;
    if (derivedSlot) row.slot            = derivedSlot;
    if (ready_by)    row.ready_by        = ready_by;
    if (linkedBinder) row.linked_binder_id = linkedBinder;
    if (safeLeadId)   row.linked_lead_id   = safeLeadId;
    if (validatedMemberIds && validatedMemberIds.length) row.assigned_member_ids = validatedMemberIds;   // 04.5 P1

    const r = await supabase.from('events').insert(row).select(EVENT_SELECT).single();
    event = r.data; error = r.error;

    // THE RACE PATH (F-04.32 / 0075). The read above closes the common case; this
    // closes the one it cannot. 23505 = the UNIQUE partial index refused a second
    // live block on this date. Translate it to the SAME code the friendly path
    // returns, so the wire cannot tell which path fired — availability.js:73 maps
    // either to 409. Before 0075 this branch was unreachable; it is the whole
    // point of the migration.
    if (error && error.code === '23505' && kind === 'blocked') {
      return { ok: false, error: 'Already blocked.', code: 'ALREADY_BLOCKED' };
    }
  }

  if (error) return { ok: false, error: error.message };
  if (!event) return { ok: false, error: 'Write did not return a row.' };

  // ── 5b. CREW CONFIRMATIONS (04.5 P1.5) ───────────────────────────────────
  // On EVERY assignment write, upsert (event_id, member_id, 'pending') for the assigned
  // set. ignoreDuplicates -> on-conflict-do-nothing against unique(event_id, member_id):
  // a member who ALREADY confirmed is NOT reset to pending; only genuinely-new pairs
  // insert. events.assigned_member_ids is the source of truth; this is derived response
  // state. BEST-EFFORT by the estate's own law — the event already landed, and a
  // confirmations hiccup must never un-do a witnessed write (snapshot.js:112-141's rule,
  // applied forward). Unassigned members' rows are NOT pruned here (spec-faithful; P3's
  // crew read gates on assigned_member_ids — flagged in the handover).
  if (crewToConfirm.length) {
    try {
      await supabase.from('crew_confirmations').upsert(
        crewToConfirm.map((id) => ({ event_id: event.id, member_id: id, status: 'pending' })),
        { onConflict: 'event_id,member_id', ignoreDuplicates: true },
      );
    } catch (_) { /* derived state; the assignment stands */ }
  }

  // ── 6. LOG (Q-B2-1 / §1.4) ──────────────────────────────────────────────
  //
  // "Logging follows the writer. When the event-write legs relocate into
  //  eventWrite, eventWrite becomes the single logging site for calendar writes —
  //  and since it owns the write, it logs with entity_type='event', entity_id,
  //  and the client/event name: F-04.28's door-parity, achieved for events for
  //  free, because the seam was already open."
  //
  // Only a WITNESSED write is logged: we are past every early return, `event`
  // is the database's own row, and its id is the row's id — not parsed out of
  // prose, not inferred. That is precisely what F-04.28 said the chat lane
  // could not do ("the lane is not joinable"). It can now, for events.
  //
  // action naming: mirrors the estate's own convention exactly — leads.js writes
  // lead_create/lead_update (:204/:369), binderWrite.js writes binder_create
  // (:110). Read from the code, not invented.
  //
  // Fire-and-forget: logActivity is fail-safe by contract (snapshot.js:112-141).
  // A ledger miss must never disturb a write that already landed.
  logActivity(supabase, {
    vendorId,
    surface,
    action:  deleted_at ? 'event_delete' : ((isUpdate || existing) ? 'event_update' : 'event_create'),
    // TDW_04 B3 (F-04.49's rider, CE-ruled 2026-07-16) — ATTRIBUTION WITHOUT SCHEMA.
    // Both lockstep legs pass surface:'pwa' (chat.js:400, api/vendor/events.js:277) and
    // `source` was received here and never recorded — so vendor_activity_log showed
    // IDENTICAL rows for Victor's calendar writes and the web door's. That is why
    // F-04.46's misattribution to T11 survived to a ruling, and why settling it needed
    // engine.messages. F-04.28's door-parity: the lane was joinable, not attributable.
    // `(forced)` means a REFUSAL was overridden. An advisory rode along; nothing was
    // forced past it, and the ledger does not say otherwise — F-04.49's whole lesson
    // is that an unattributable ledger line is worse than none.
    summary: `event "${event.title}" — ${event.event_date}${event.event_time ? ' ' + event.event_time : ''}${event.kind ? ' · ' + event.kind : ''}${force && isRefusal(conflict) ? ' (forced)' : ''} · via ${source === 'victor' ? 'chat' : 'calendar'}`,
    entityType: 'event',
    entityId:   event.id,
  }).catch(() => {});

  return { ok: true, event, conflict: conflict || undefined };
}

module.exports = { writeEvent, CALENDAR_KINDS, deriveSlot };
