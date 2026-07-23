// src/api/couple/events.js
// GET /api/v2/couple/events/:coupleId
// Returns couple events (fittings, trials, meetings, reminders etc).
// Query: ?state=upcoming|done|all  ?limit=50
// Requires couple auth (applied in core.js).

'use strict';

const { insertCoupleEvent, updateCoupleEvent, deleteCoupleEvent } = require('../../lib/coupleEventWrite'); // ARC M6 / C9(a)
const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const state = req.query.state || 'upcoming';
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  let query = supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, notes, created_at')
    .eq('couple_id', couple_id)
    .order('event_date', { ascending: true })
    .limit(limit);

  if (state === 'upcoming') query = query.eq('state', 'upcoming');
  if (state === 'done')     query = query.eq('state', 'done');
  // 'all' — no state filter

  const { data: events, error } = await query;
  if (error) {
    console.error('[GET /couple/events] query error:', error.message);
    return errRes(res, 500, 'Could not fetch events.');
  }

  return okRes(res, { events: events || [] });
}));


// POST /:coupleId — create event
router.post('/:coupleId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  if (req.params.coupleId !== couple_id) return errRes(res, 403, 'Forbidden.');

  const { title, event_date, event_time, kind, notes } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim())
    return errRes(res, 400, 'title required.');
  if (!event_date || !/^\d{4}-\d{2}-\d{2}$/.test(event_date))
    return errRes(res, 400, 'event_date required in YYYY-MM-DD format.');

  const ALLOWED_KINDS = new Set([
    'shoot','call','meeting','task','reminder','recce',
    'fitting','trial','family','ceremony','social','other'
  ]);
  const resolvedKind = ALLOWED_KINDS.has(kind) ? kind : 'other';

  const { data, error } = await insertCoupleEvent(supabase, {
    coupleId: couple_id,
    row: {
      title: title.trim().slice(0, 200),
      event_date,
      event_time: event_time || null,
      kind: resolvedKind,
      notes: notes ? String(notes).trim().slice(0, 500) : null,
      state: 'upcoming',
    },
    select: 'id, title, event_date, event_time, kind, state, notes, created_at',
  });

  if (error) {
    console.error('[POST /couple/events] insert error:', error.message);
    return errRes(res, 500, 'Could not create event.');
  }
  return okRes(res, { event: data });
}));

// PATCH /:eventId — full update: title, event_date, event_time, kind, notes, state
router.patch('/:eventId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const ALLOWED_KINDS = new Set([
    'shoot','call','meeting','task','reminder','recce',
    'fitting','trial','family','ceremony','social','other',
  ]);
  const ALLOWED_STATES = new Set(['upcoming', 'done', 'cancelled']);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const { eventId } = req.params;
  if (!UUID_RE.test(eventId)) return errRes(res, 400, 'Invalid event id.');

  const { title, event_date, event_time, kind, notes, state } = req.body || {};
  const updates = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim())
      return errRes(res, 400, 'title must be a non-empty string.');
    updates.title = title.trim().slice(0, 200);
  }
  if (event_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date))
      return errRes(res, 400, 'event_date must be YYYY-MM-DD.');
    updates.event_date = event_date;
  }
  if (event_time !== undefined) {
    if (event_time === null || event_time === '') {
      updates.event_time = null;
    } else {
      const tStr = String(event_time).trim();
      if (!/^\d{1,2}:\d{2}$/.test(tStr)) return errRes(res, 400, 'event_time must be HH:MM.');
      const [h, m] = tStr.split(':').map(Number);
      if (h > 23 || m > 59) return errRes(res, 400, 'event_time out of range.');
      updates.event_time = tStr.length === 4 ? `0${tStr}` : tStr;
    }
  }
  if (kind !== undefined) {
    if (!ALLOWED_KINDS.has(kind)) return errRes(res, 400, 'Invalid kind.');
    updates.kind = kind;
  }
  if (notes !== undefined) {
    updates.notes = (notes === null || notes === '') ? null : String(notes).trim().slice(0, 500);
  }
  if (state !== undefined) {
    if (!ALLOWED_STATES.has(state)) return errRes(res, 400, 'state must be upcoming, done, or cancelled.');
    updates.state = state;
  }
  if (Object.keys(updates).length === 0) return errRes(res, 400, 'No fields to update.');

  const { data, error } = await updateCoupleEvent(supabase, {
    coupleId: couple_id, eventId, updates,
    select: 'id, title, event_date, event_time, kind, state, notes',
  });

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Event not found.');
    console.error('[PATCH /couple/events/:eventId] error:', error.message);
    return errRes(res, 500, 'Could not update event.');
  }
  return okRes(res, { event: data });
}));

// PATCH /:eventId/state — toggle state (upcoming/done)
router.patch('/:eventId/state', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { state } = req.body || {};
  const VALID = ['upcoming', 'done', 'cancelled'];
  if (!VALID.includes(state)) return errRes(res, 400, 'state must be upcoming, done, or cancelled.');

  const { data, error } = await updateCoupleEvent(supabase, {
    coupleId: couple_id, eventId: req.params.eventId, updates: { state },
    select: 'id, state',
  });

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Event not found.');
    console.error('[PATCH /couple/events/state] error:', error.message);
    return errRes(res, 500, 'Could not update event.');
  }
  return okRes(res, { event: data });
}));

// DELETE /:eventId — delete event
router.delete('/:eventId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data, error } = await deleteCoupleEvent(supabase, {
    coupleId: couple_id, eventId: req.params.eventId,
    select: 'id',
  });

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Event not found.');
    console.error('[DELETE /couple/events] error:', error.message);
    return errRes(res, 500, 'Could not delete event.');
  }
  return okRes(res, { deleted: data.id });
}));

module.exports = router;
