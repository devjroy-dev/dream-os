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
const { isOccupying } = require('../../lib/vendor/occupancy');     // TDW_04 B3 — the one set (subset proposal §3, CE-ratified)

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
const DEFAULT_WINDOW_DAYS = 60;
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
  let listQuery = supabase.from('events')
    .select('id, title, kind, event_date, event_time, state, linked_lead_id, linked_binder_id, notes') // linked_binder_id: TDW_04 A3 (L-3) — the cross-chip needs it to name the twin binder
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .gte('event_date', from)
    .lte('event_date', to);

  let countQuery = supabase.from('events')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
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
    .from('events').select('id, title, state')
    .eq('id', eventId).eq('vendor_id', vendor.id).is('deleted_at', null).single();

  if (fetchErr?.code === 'PGRST116' || !ev) return errRes(res, 404, 'Event not found.');
  if (fetchErr) return errRes(res, 500, fetchErr.message);
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

  if (!result.ok) return errRes(res, 400, result.error);
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

  // The binder link must be read BEFORE the write: the lockstep leg below needs to know
  // whether this event belongs to a binder, and the patch cannot tell us.
  // TDW_04 B3: `kind` and `event_date` join the select — the anchor veto needs the event's
  // identity and its PRE-MOVE date (Q-B3-3(ii)); after the write both are gone.
  const { data: before } = await supabase
    .from('events').select('id, linked_binder_id, kind, event_date')
    .eq('id', eventId).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();

  // Routed. `body`'s keys pass through as-is so undefined stays untouched and an
  // explicit null still CLEARS — updateEvent's EDITABLE semantics, preserved exactly.
  const result = await writeEvent(supabase, {
    vendorId: vendor.id, surface: 'pwa', source: 'crud', event_id: eventId,
    title:      body.title,
    event_date: body.event_date,
    event_time: body.event_time,
    kind:       body.kind,
    notes:      body.notes,
    state:      body.state,
  });
  if (!result.ok) return errRes(res, 400, result.error);

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
  // ── THE ANCHOR VETO (Q-B3-3 + Q-B3-9's amendment, CE-ruled 2026-07-16) ────
  // A BINDER'S DATE IS THE WEDDING. Before B3 this leg patched the binder from ANY
  // linked event's date-edit — a trial move rewrote a wedding. The veto: the event
  // must be OCCUPYING (asked positively — on a ternary set "not an appointment"
  // would let `other`/`blocked` speak for a wedding) AND its PRE-MOVE date must
  // have equalled the binder's (it WAS the wedding). There is no kind='wedding';
  // a 14th kind was rejected at Q-B3-3.
  //
  // NOTE: this door is router.patch('/:eventId') — THE WEB DOOR. Victor cannot
  // reach it; his leg is chat.js's. The witnessed F-04.46 specimen fired through
  // chat, not here (turn log, 2026-07-15 21:49) — F-04.46's filing named this leg
  // and the record is corrected at B3. Both legs carry the same brain by ruling
  // (Q-B3-4's widening), so the cure did not depend on getting the attribution right.
  if (body.event_date && before && before.linked_binder_id && isOccupying(before.kind)
      && before.event_date) {
    try {
      // FAIL-CLOSED (F15's law): no truthful read of the binder, no propagation.
      // PLANE: supabase is public-default; the explicit .schema('engine') hop targets
      // `records` (binders) only — the enumerated hop, as eventWrite.js:230.
      const { data: binder, error: binderErr } = await supabase
        .schema('engine').from('records')
        .select('date').eq('id', before.linked_binder_id).maybeSingle();
      const isAnchor = !binderErr && binder && binder.date && binder.date === before.event_date;
      if (isAnchor) {
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
