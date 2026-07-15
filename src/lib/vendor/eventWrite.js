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
//     brideEngine.js:508/:978/:1006 · api/couple/events.js — bride/couple XOR.
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

const EVENT_SELECT = 'id, title, event_date, event_time, kind, slot, state, notes, linked_binder_id, linked_lead_id, ready_by, created_at, deleted_at';

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
function deriveSlot({ event_time, slot }) {
  if (slot) return slot;                                  // branch 1
  if (typeof event_time === 'string' && /^\d{2}:/.test(event_time)) {
    const h = parseInt(event_time.slice(0, 2), 10);       // branch 2 — C2, exactly
    if (Number.isNaN(h)) return null;
    if (h < 12) return 'morning';                         // until 12:00
    if (h < 16) return 'noon';                            // 12:00-15:59
    return 'evening';                                     // 16:00 onwards
  }
  return null;                                            // branches 3/4 -> B3
}

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
async function findExistingBlock(supabase, vendorId, event_date) {
  const { data: existing, error: readErr } = await supabase
    .from('events')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('kind', 'blocked')
    .eq('event_date', event_date)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (readErr) {
    return { err: `Could not check existing blocks (${readErr.message}) — nothing was written.` };
  }
  return { existing: existing || null };
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
async function checkOccupancy(_ctx) {
  return null; // B3. See above — ruled, not forgotten.
}

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

  // ── 1. SLOT DERIVATION ──────────────────────────────────────────────────
  const derivedSlot = deriveSlot({ event_time, slot: params.slot });

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
      const r = await findExistingBlock(supabase, vendorId, event_date);
      if (r.err)      return { ok: false, error: r.err };
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
  const conflict = await checkOccupancy({
    supabase, vendorId, kind, event_date, slot: derivedSlot, event_time,
    ready_by, source, event_id, existing,
  });
  if (conflict && !force) {
    // WRITE NOTHING. The spec is absolute about this and so is this door.
    return { ok: false, conflict };
  }

  // force:true -> the clash goes in the note. A forced write that hides what it
  // was forced past is a false "done" wearing a calendar's clothes.
  let finalNotes = cleanNotes;
  if (conflict && force) {
    const clash = `[forced ${new Date().toISOString().slice(0, 10)}] ${conflict.message}`;
    finalNotes = finalNotes ? `${finalNotes}\n${clash}` : clash;
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
    if (notes      !== undefined || (conflict && force)) patch.notes = finalNotes;
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
    summary: `event "${event.title}" — ${event.event_date}${event.event_time ? ' ' + event.event_time : ''}${event.kind ? ' · ' + event.kind : ''}${force && conflict ? ' (forced)' : ''}`,
    entityType: 'event',
    entityId:   event.id,
  }).catch(() => {});

  return { ok: true, event, conflict: conflict || undefined };
}

module.exports = { writeEvent, CALENDAR_KINDS, deriveSlot };
