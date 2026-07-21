// src/api/vendor/events.js
// GET /api/v2/vendor/events/:vendorId
// Auth: vendor JWT (must own vendorId).
// Purpose: Calendar — vendor's events filtered by date window, state, and kind.
//
// Query params:
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD
//     - both omitted        -> IST today through IST today + 60 days
//     - only `from` given   -> from `from` through `from` + 60 days
//     - only `to` given     -> IST today through `to`
//   ?state=upcoming|done|cancelled|all
//     - omitted             -> 'upcoming' (the default calendar view)
//     - 'all'               -> no state filter
//   ?kind=shoot|call|meeting|task|reminder|recce|fitting|trial|family|ceremony|social|other
//     - omitted             -> no kind filter (all kinds)
//
// Notes on schema/contract mismatches:
//   1. Schema column is `linked_lead_id` but the contract response field is `lead_id`.
//      We map linked_lead_id -> lead_id in the response shape.
//   2. The contract documents 9 kind values but the schema CHECK constraint allows 12
//      (adds task, family, social). The WhatsApp agent can create any of the 12, so
//      the PWA filter must accept all 12 to preserve cross-surface parity. The 3 extra
//      values aren't unreachable — they're just not documented in the contract example.
//
// No pagination per contract. A hard cap of 200 rows is applied as a safety rail.
// If a vendor genuinely has >200 events in a 60-day window, the frontend can narrow
// the date range. Sort order: event_date asc, then event_time asc (nulls first).

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { writeEvent } = require('../../lib/vendor/eventWrite');    // TDW_04 B2 — the ONE writer
const { executeAndPatch } = require('../../lib/executeAndPatch');  // TDW_04 B2 — the CRUD lockstep leg
const { resolveAgentForVendor } = require('../middleware/agentBridge');
const { isWeddingAnchor } = require('../../lib/vendor/occupancy'); // TDW_04 B3 — the one rule (Q-B3-10, CE-ratified)

// ── TDW_04 B2 — this door's writes route through eventWrite ────────────────
// createEvent/updateEvent/deleteEvent are gone from here. lib/vendor/events.js still
// exists and still serves calendarSignals.js (the WA door, exempt by ruling until
// Block 05, Q-B2-1); createEvent and deleteEvent are left with no caller at all.
// LISTED, NOT DELETED, per spec §9 ("strays get listed, not fixed") — a dead-code
// sweep is not this sitting's charter and 05 will want the file warm.
//
// ALLOWED_KINDS below is TWELVE and stays that way. eventWrite's CALENDAR_KINDS is
// correctly THIRTEEN (it mirrors the DB CHECK), so if this door simply handed `kind`
// through, a POST with kind='blocked' would start creating blocks HERE — with no
// reason round-trip, no 'Blocked' title fallback, and NO SLOT, minting exactly the
// NULL-slot blocks 0077's bare column exists to prevent. This door has never made a
// block and does not start now: blocks are made at POST /api/v2/vendor/availability,
// which owns those rulings. Existing behaviour is sacred (Protocol §8) — the 400
// below is the same 400, with the same sentence, this door returned yesterday.

const ALLOWED_STATES = ['upcoming', 'done', 'cancelled'];
const ALLOWED_KINDS  = [
  'shoot', 'call', 'meeting', 'task', 'reminder', 'recce',
  'fitting', 'trial', 'family', 'ceremony', 'social', 'other',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
// TDW_04 B3 (Q-B3-12's interim, CE-ruled 2026-07-16) — F-04.47's stopgap, NOT its cure.
// WAS 60. A wedding vendor books 6-18 months out; at 60 days his own November shoots were
// invisible on every surface while the grid showed hot dates. PROVEN 2026-07-16, one door,
// two calls: ?from=2026-11-01&to=2026-11-30 returned both of Meera's shoots; the same
// endpoint with no from/to returned 8 rows, none in November. The data was always here.
// The client (dreamos-pwa lib/vendor/api/vendor.ts:241) sends NO from/to, ever, and the
// calendar's month-nav moves React state without re-fetching — so this default IS the horizon.
// B5 OWNS THE CURE (re-scoped by ruling): a deliberate horizon contract, the PWA sending
// from/to, and month-nav re-fetching. DO NOT treat this number as the design.
// NOTE FOR B5: HARD_CAP (:67) is .limit(200) on ROWS (:159). At 400 days a busy studio can
// exceed it and be SILENTLY TRUNCATED — no count, no has_more. The horizon contract owns that too.
const DEFAULT_WINDOW_DAYS = 400;
const HARD_CAP = 200;

function istTodayISO() {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  return istNow.toISOString().split('T')[0];
}

function addDaysISO(yyyymmdd, days) {
  // Parse as UTC midnight for stable day arithmetic, then re-format.
  const t = new Date(`${yyyymmdd}T00:00:00Z`).getTime();
  return new Date(t + days * 86400000).toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════════════════
// F-04.55's CURE AT THIS DOOR (Q-B4-4, CE-ratified 2026-07-16)
// ══════════════════════════════════════════════════════════════════════════
//
// THE DEFECT, and it was reproduced by RUNNING lib/response.js's real helper, not by
// reading it: `errRes(res, 400, result.error)` on a CONFLICT return. A conflict is
// `{ok:false, conflict}` — IT HAS NO `error` FIELD. So `err(res,400,undefined)` builds
// `{ok:false, error:undefined}`, JSON.stringify drops the undefined key, and the wire
// carries a bare `{"ok":false}`, status 400. holding, capacity, message — all discarded.
//
// AND THE VENDOR WAS NOT SHOWN NOTHING, WHICH IS WHY THIS IS WORSE THAN THE FINDING SAID:
//   dreamos-pwa components/vendor/AddSheet.tsx:307 reads
//     onToast((result as { error?: string })?.error ?? 'Something went wrong.', 'error')
//   `error` is undefined -> THE VENDOR READ "Something went wrong."
//   The checker's careful, founder-blessed sentence — "You've blocked 19 July. That
//   one's a no — unblock it first if you want it back." — arrived as a GENERIC FAILURE.
//   Not silence. A FALSE DIAGNOSIS of the estate's own deliberate act.
//
// ONE HOME, and that is not decoration: POST and PATCH both refuse, and two copies of
// a refusal rendering is how the two copies drift (F-04.36, which this block has now
// met four times). The door renders; it never reasons about the verdict.
//
// ── WHY `error` CARRIES `message` ─────────────────────────────────────────
// Every renderer the estate already has improves for free, with a ZERO-line PWA diff:
// AddSheet's `?.error ?? 'Something went wrong.'` prints the blessed sentence. And
// `ApiErr { ok:false; error:string }` (dreamos-pwa lib/vendor/types/vendor.ts:11) has a
// REQUIRED `error` — which today's bare {"ok":false} DOES NOT EVEN SATISFY. The wire
// becomes true again.
//
// ── WHY 409, NOT 400 ──────────────────────────────────────────────────────
// A refusal is not a malformed request. THE PRECEDENT IS INSIDE THIS BLOCK:
// availability.js:73 maps ALREADY_BLOCKED -> 409, witnessed in B1's prod smoke. Two
// refusal semantics on one calendar should not disagree. AND IT IS FREE: verified at
// dreamos-pwa lib/vendor/api/_base.ts:96 — handleResponse parses the body and NEVER
// throws on non-2xx; no caller of postJson/patchJson reads the status at all (the 401
// branch in fetchWithAuth is the estate's only status reader).
//
// ── WHY `isOverridable` IS NOT ON THIS WIRE ───────────────────────────────
// The client must never learn `kind !== 'date_blocked'`. THE FILE THAT OWNS THE VERDICT
// VOCABULARY OWNS ITS FORCE SEMANTICS (Q-C-3). A door — or a browser — that hardcoded
// the rule would be the second home for a rule that has one. `conflict` rides whole and
// says WHAT; nothing here says WHETHER.
//
// ⚠ `conflict` SHIPS RENDERED BY NOBODY, DELIBERATELY, AND THAT IS NOT F-04.55 AGAIN.
//   F-04.55 is a payload that never left the server. This one is ON THE WIRE and
//   addressable: B5's day sheet renders the inline verdict on Move. Named, not smuggled.
//
// NOT APPLIED TO /cancel OR DELETE, and the reason is read from the checker, not
// assumed by symmetry: checkOccupancy's Item 3 guard returns null for `eff.deleted_at`
// and `eff.state === 'cancelled'` ABOVE EVERY QUERY, so those paths CANNOT receive a
// conflict. They can still receive { err } -> `error`, and they already render it.
function conflictOr400(res, result) {
  if (result.conflict) {
    return res.status(409).json({
      ok:       false,
      error:    result.conflict.message,   // the blessed sentence — renders today
      conflict: result.conflict,           // { kind, slot?, date, holding[], capacity?, message }
    });
  }
  return errRes(res, 400, result.error);   // validation + FAIL-CLOSED's honest string
}

// ══════════════════════════════════════════════════════════════════════════
// TDW_04 B6-S2 — R-B6-25's DOOR GUARDS (the census #8/#9/#10 family, ONE rule)
// ══════════════════════════════════════════════════════════════════════════
//
// THE ROOT DISEASE (census §1): the generic event doors do not know a block is
// not an engagement. Cancelling a block through /cancel produced the three-way
// divergence (grid held / checker free / re-block refused — census #8, each leg
// verified at HEAD); marking one done minted "a completed refusal" (#9); the
// generic PATCH could move a block's date past the availability door's locks
// (#10). ONE rule cures the family: a kind='blocked' row is refused at every
// generic door, 404-SHAPED LIKE THE UNBLOCK DOOR'S LOCK 2 (availability.js —
// its 404-not-403 reasoning mirrored back: this door does not confirm what the
// block machinery holds), with a message NAMING that machinery so the vendor
// is taught the right door, never coerced (F-04.37's class).
//
// PLACEMENT, proposed from the code with evidence (§0.2, ruled in the ZIP's
// disclosure): ONE home, THIS module, applied at both mutating routes below.
//   - NOT in eventWrite: the LAWFUL block mutations route through the same
//     writer (unblock = writeEvent + deleted_at; blockDate = writeEvent insert).
//     A writer-level refusal would need a caller-identity bypass for the
//     availability door — a fork of one rule into caller classes, F-04.36's
//     exact shape. The DOORS are where "generic" is a fact, not a flag.
//   - #9 (mark-done) needs no third site: SliceShell's updateEvent({state:
//     'done'}) travels PATCH /events/:eventId — the state-update door IS the
//     generic PATCH (verified: no other state route exists on this router
//     besides /cancel). Two call sites, one rule, zero copies.
//   - DELETE /events/:eventId is deliberately NOT guarded: the ruling names
//     cancel, state-update, and PATCH; a DELETE of a block performs the exact
//     write unblock performs (soft delete via eventWrite) and diverges nothing.
//     Named for the CE in the delivery disclosure, not silently widened.
//
// The message is vendor-visible utility copy — veto-on-sight list.
const BLOCK_ROW_SENTENCE =
  'Event not found. That row is a calendar block, not an engagement — manage it from the calendar (unblock it there if you want the date back).';

function refuseBlockedRow(res, row) {
  if (row && row.kind === 'blocked') {
    errRes(res, 404, BLOCK_ROW_SENTENCE);
    return true;
  }
  return false;
}

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  // ── Parse + validate date window ────────────────────────────────────
  const fromQ = (req.query.from || '').trim();
  const toQ   = (req.query.to   || '').trim();

  if (fromQ && !DATE_RE.test(fromQ)) {
    return res.status(400).json({ ok: false, error: 'Invalid from date. Expected YYYY-MM-DD.' });
  }
  if (toQ && !DATE_RE.test(toQ)) {
    return res.status(400).json({ ok: false, error: 'Invalid to date. Expected YYYY-MM-DD.' });
  }

  const today = istTodayISO();
  const from  = fromQ || today;
  const to    = toQ   || addDaysISO(from, DEFAULT_WINDOW_DAYS);

  if (from > to) {
    return res.status(400).json({ ok: false, error: '`from` must be on or before `to`.' });
  }

  // ── Parse + validate state ──────────────────────────────────────────
  const stateQ = (req.query.state || '').trim();
  let stateFilter;
  if (!stateQ) {
    stateFilter = ['upcoming'];
  } else if (stateQ === 'all') {
    stateFilter = null;
  } else if (ALLOWED_STATES.includes(stateQ)) {
    stateFilter = [stateQ];
  } else {
    return res.status(400).json({
      ok: false,
      error: `Invalid state. Must be one of: ${ALLOWED_STATES.join(', ')}, all.`,
    });
  }

  // ── Parse + validate kind ───────────────────────────────────────────
  const kindQ = (req.query.kind || '').trim();
  let kindFilter = null;
  if (kindQ) {
    if (!ALLOWED_KINDS.includes(kindQ)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid kind. Must be one of: ${ALLOWED_KINDS.join(', ')}.`,
      });
    }
    kindFilter = kindQ;
  }

  // ── Build query ─────────────────────────────────────────────────────
  // TDW_04 B6-S2 (R-B6-25, the census batch ruling): A BLOCK IS NOT A LISTABLE
  // ENGAGEMENT — the cure sits at the WIRE. Blocks ride the availability
  // projection ONLY (listBlocks); this GET excludes them, which cures census #7
  // (block rows wearing the list slice's full affordance set) at the root and
  // makes S1's byDate one-liner (ratified, R-B6-25) defence rather than the
  // wall. Applied to BOTH queries so the truncation tell counts what the list
  // carries — a tell derived from a different population would be F-04.47's
  // silence wearing a number. `kindFilter` can never be 'blocked' (ALLOWED_KINDS
  // is twelve), so the two clauses cannot fight. The couple wire is untouched:
  // vendor blocks are unreachable there by construction (census §1 #16–19).
  let listQuery = supabase.from('events')
    .select('id, title, kind, event_date, event_time, state, linked_lead_id, linked_binder_id, notes') // linked_binder_id: TDW_04 A3 (L-3) — the cross-chip needs it to name the twin binder
    .eq('vendor_id', vendor.id)
    .neq('kind', 'blocked')
    .is('deleted_at', null)
    .gte('event_date', from)
    .lte('event_date', to);

  let countQuery = supabase.from('events')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .neq('kind', 'blocked')
    .is('deleted_at', null)
    .gte('event_date', from)
    .lte('event_date', to);

  if (stateFilter) {
    listQuery  = listQuery.in('state', stateFilter);
    countQuery = countQuery.in('state', stateFilter);
  }
  if (kindFilter) {
    listQuery  = listQuery.eq('kind', kindFilter);
    countQuery = countQuery.eq('kind', kindFilter);
  }

  listQuery = listQuery
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: true })
    .limit(HARD_CAP);

  const [
    { data: rows,  error: listErr },
    { count,       error: countErr },
  ] = await Promise.all([listQuery, countQuery]);

  if (listErr || countErr) {
    console.error('[GET /vendor/events] supabase error:', (listErr || countErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  const events = (rows || []).map(e => ({
    id:         e.id,
    title:      e.title,
    kind:       e.kind,
    event_date: e.event_date,
    event_time: e.event_time,
    state:      e.state,
    lead_id:    e.linked_lead_id,
    linked_binder_id: e.linked_binder_id, // TDW_04 A3 (L-3): closes TDW_03's logged
      // upstream gap ("linked_binder_id absent from the payload; a future block
      // wiring calendar chips must add it first"). SELECT *and* mapper — the A2.2
      // lesson: this handler maps, it never passes through.
    notes:      e.notes,
  }));

  return res.json({
    ok:     true,
    events,
    total:  count || 0,
    // TDW_04 B6-S1 (surfaces paper item 3, the horizon contract — R-B6-16): the cap
    // stops being SILENT. `countQuery` runs the same filters unlimited; if it counted
    // more rows than the capped list carries, the wire now says so instead of a busy
    // studio vanishing without a tell (F-04.47's real cure, second leg — the first leg
    // is the PWA sending from/to and re-fetching on month-nav, this same delivery).
    // DEFAULT_WINDOW_DAYS stays 400 for from/to-less callers: existing behaviour is
    // sacred; the calendar client no longer calls without a window.
    truncated: (count || 0) > events.length,
  });
});

// ─── PATCH /api/v2/vendor/events/:eventId/cancel ──────────────────────
//
// Direct cancel from list UI. Preserved for dreamai list page CRUD.
// Auth: requireAuth. resolveVendor mode C via events table.

router.patch('/:eventId/cancel', requireAuth, resolveVendor({ paramName: 'eventId', via: 'events' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const eventId  = req.params.eventId;

  const { data: ev, error: fetchErr } = await supabase
    .from('events').select('id, title, state, kind')
    .eq('id', eventId).eq('vendor_id', vendor.id).is('deleted_at', null).single();

  if (fetchErr?.code === 'PGRST116' || !ev) return errRes(res, 404, 'Event not found.');
  if (fetchErr) return errRes(res, 500, fetchErr.message);
  // R-B6-25's guard (census #8 — the three-way-divergence door). `kind` joined
  // the select for exactly this line. Sits ABOVE the already_cancelled shortcut:
  // a cancelled block is still a block, and this door still has no business
  // confirming its state.
  if (refuseBlockedRow(res, ev)) return;
  if (ev.state === 'cancelled') return okRes(res, { already_cancelled: true });

  // Routed (TDW_04 B2). The fetch above stays — it is a READ, and its 404 and
  // already_cancelled shortcut are this door's contract, not the writer's.
  const cancelRes = await writeEvent(supabase, {
    vendorId: vendor.id, surface: 'pwa', source: 'crud',
    event_id: eventId, state: 'cancelled',
  });
  if (!cancelRes.ok) return errRes(res, 500, cancelRes.error);
  console.log('[events:cancel] "' + ev.title + '" cancelled by vendor ' + vendor.id);
  return okRes(res, { event: { id: eventId, state: 'cancelled' } });
}));

// ─── POST /api/v2/vendor/events ────────────────────────────────────────
//
// Create a new event. kind='task' for vendor todos.
// Auth: requireAuth. resolveVendor mode A.

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};

  // The door's own gate, ahead of the writer's. See the ALLOWED_KINDS note at the top:
  // eventWrite would lawfully accept 'blocked'; this door must not.
  if (body.kind && !ALLOWED_KINDS.includes(body.kind)) {
    return errRes(res, 400, 'Invalid kind. Must be one of: ' + ALLOWED_KINDS.join(', ') + '.');
  }

  const result = await writeEvent(supabase, {
    vendorId:       vendor.id,
    surface:        'pwa',
    source:         'crud',
    title:          body.title          || null,
    event_date:     body.event_date     || null,
    event_time:     body.event_time     || undefined,
    kind:           body.kind           || null,
    linked_lead_id: body.linked_lead_id || null,
    notes:          body.notes          || undefined,
  });

  if (!result.ok) return conflictOr400(res, result);
  return okRes(res, { event: result.event });
}));

// ─── PATCH /api/v2/vendor/events/:eventId ─────────────────────────────
//
// Full field update. Does not change state — use /cancel for that.
// Auth: requireAuth. resolveVendor mode C via events table.

router.patch('/:eventId', requireAuth, resolveVendor({ paramName: 'eventId', via: 'events' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const eventId  = req.params.eventId;
  const body     = req.body || {};

  if (body.kind && !ALLOWED_KINDS.includes(body.kind)) {
    return errRes(res, 400, 'Invalid kind. Must be one of: ' + ALLOWED_KINDS.join(', ') + '.');
  }

  // TDW_04.5 P1 #6 (CE Ruling №10, seam a): the CRUD crew exposure. The handler adds
  // NO validation of its own beyond the ARRAY-OR-UNDEFINED SHAPE — a non-array,
  // non-undefined value is a 400 before the writer, matching the kind guard's register
  // above. Everything deeper (undefined = untouched · array = SET · [] = clear · every id
  // ∈ this vendor's active team) is writeEvent's own sealed law (435a0dc), reused whole.
  if (body.assigned_member_ids !== undefined && !Array.isArray(body.assigned_member_ids)) {
    return errRes(res, 400, 'assigned_member_ids must be an array of team member ids.');
  }

  // The binder link must be read BEFORE the write: the lockstep leg below needs to know
  // whether this event belongs to a binder, and the patch cannot tell us.
  // TDW_04 B3: `kind` and `event_date` join the select — the anchor veto needs the event's
  // identity and its PRE-MOVE date (Q-B3-3(ii)); after the write both are gone.
  const { data: before } = await supabase
    .from('events').select('id, linked_binder_id, kind, event_date')
    .eq('id', eventId).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();

  // R-B6-25's guard (census #9 + #10 — mark-done and edit both travel THIS
  // door; see the guard's header). The before-read already carried `kind` for
  // the anchor veto — the guard costs zero extra trips. A null `before` (no
  // such row) falls through to the writer's own honest 'Event not found.'
  if (refuseBlockedRow(res, before)) return;

  // Routed. `body`'s keys pass through as-is so undefined stays untouched and an
  // explicit null still CLEARS — updateEvent's EDITABLE semantics, preserved exactly.
  // B6-S2: `slot` joins the routed fields — the day sheet's Move picker sends
  // date + slot in one PATCH. writeEvent validates it against C2's four values
  // (the mirrored-CHECK sentence) and deriveSlot's branch 1 honours it verbatim.
  const result = await writeEvent(supabase, {
    vendorId: vendor.id, surface: 'pwa', source: 'crud', event_id: eventId,
    title:      body.title,
    event_date: body.event_date,
    event_time: body.event_time,
    kind:       body.kind,
    slot:       body.slot,
    notes:      body.notes,
    state:      body.state,
    assigned_member_ids: body.assigned_member_ids,   // TDW_04.5 P1 #6 (№10 seam a): undefined = untouched; array = SET; [] = clear (writeEvent's law)
  });
  if (!result.ok) return conflictOr400(res, result);

  // ── THE CRUD LOCKSTEP LEG (TDW_04 B2 — spec P2(b), BUILT NEW) ────────────
  // "CRUD reschedule of an event with linked_binder_id -> after event write, patch the
  //  binder date THROUGH the binder edit door (witnessed; the confession trail records
  //  'date moved with the calendar')."
  // Its twin (event->binder from CHAT) has existed since B1 in chat.js's mutateEvents.
  // This door carried none: a vendor moving a date from the Events list left the binder
  // on the old date, silently. That is the divergence this block exists to kill.
  //
  // THE AGENT IS RESOLVED IN-HANDLER, AFTER THE WRITE LANDS — B0's item-4b precedent,
  // CE-RATIFIED (leads.js:219-228 is the shape). resolveAgent() as middleware is
  // BLOCKING by construction (401 on missing agent, 500 on failure), and failing a
  // vendor's calendar edit because their engine agent didn't resolve is not a trade
  // this door gets to make. Every failure below is swallowed: the event has already
  // moved and the response is already owed.
  //
  // NO LOOP: this is not a chat turn, so lockstepBinderToEvent — which only ever reads
  // a turn's result.tool_calls — cannot see this write. The guard is architectural,
  // exactly as chat.js's own lockstep comment documents for its half.
  // ── THE ANCHOR VETO (Q-B3-10: ONE rule, imported — CE-ruled 2026-07-16) ──
  // A BINDER'S DATE IS THE WEDDING. Before B3 this leg patched the binder from ANY
  // linked event's date-edit — a trial move rewrote a wedding, a recce move rewrote
  // another (F-04.54: Ananya's binder read her RECCE's date, written HERE at
  // 2026-07-15 20:22:54 through this very door, with no chat turn in that window).
  // F-04.43/46 were never Meera-specific: they were a BACKGROUND RATE across every
  // linked couple, and both legs fired on different couples four minutes apart.
  //
  // The rule lives in occupancy.js beside the set it consumes. It was shipped twice
  // at B3 and forked because it took `req`, which this door has no equivalent of.
  // It now takes `supabase`. Both doors, one rule.
  if (body.event_date && before && before.linked_binder_id) {
    try {
      if (await isWeddingAnchor(supabase, before, before.linked_binder_id)) {
        const uid = req.auth && req.auth.user_id;
        if (uid) {
          const { agentId } = await resolveAgentForVendor(supabase, vendor, uid);
          if (agentId) {
            await executeAndPatch(agentId, 'donna_date', {
              binder_id: before.linked_binder_id, date: body.event_date,
            });
          }
        }
      }
    } catch (e) {
      console.warn('[events:patch] lockstep e->b failed (the event already moved):', e.message);
    }
  }


  return okRes(res, { event: result.event });
}));

// ─── DELETE /api/v2/vendor/events/:eventId ────────────────────────────
//
// Soft delete. For events created in error. Distinct from cancel.
// Auth: requireAuth. resolveVendor mode C via events table.

router.delete('/:eventId', requireAuth, resolveVendor({ paramName: 'eventId', via: 'events' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const eventId  = req.params.eventId;

  // Routed. deleteEvent's existence-check-then-stamp becomes a read plus the writer's
  // soft-delete path; the 404 is this door's contract and stays here.
  const { data: ev } = await supabase
    .from('events').select('id, title')
    .eq('id', eventId).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();
  if (!ev) return errRes(res, 404, 'Event not found.');

  const result = await writeEvent(supabase, {
    vendorId: vendor.id, surface: 'pwa', source: 'crud',
    event_id: eventId, deleted_at: new Date().toISOString(),
  });
  if (!result.ok) return errRes(res, 404, result.error);
  console.log('[events:delete] soft-deleted ' + eventId + ' ("' + ev.title + '")');
  return okRes(res, { deleted: true });
}));

module.exports = router;
// ── TEST SEAM (TDW_04 B4) ─────────────────────────────────────────────────
// occupancy.js's ratified precedent, one file over: "the bench drives the real
// function; these let it drive the parts." The bench asserts the 409 body against
// THIS function — not against a copy of its logic in the bench, which would be a
// green bench over a path the door does not take (B2 disclosure §3). The router is
// still the default export; nothing about the door's mounting changes.
module.exports.conflictOr400 = conflictOr400;
