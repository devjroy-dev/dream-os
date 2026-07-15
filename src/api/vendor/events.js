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
const { createEvent, updateEvent, deleteEvent } = require('../../lib/vendor/events');

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

  const { error: cancelErr } = await supabase
    .from('events').update({ state: 'cancelled' })
    .eq('id', eventId).eq('vendor_id', vendor.id);

  if (cancelErr) return errRes(res, 500, cancelErr.message);
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

  const result = await createEvent(supabase, vendor.id, {
    title:          body.title          || null,
    event_date:     body.event_date     || null,
    event_time:     body.event_time     || null,
    kind:           body.kind           || null,
    linked_lead_id: body.linked_lead_id || null,
    notes:          body.notes          || null,
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

  const result = await updateEvent(supabase, vendor.id, eventId, body);
  if (!result.ok) return errRes(res, 400, result.error);
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

  const result = await deleteEvent(supabase, vendor.id, eventId);
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { deleted: true });
}));

module.exports = router;
