// src/api/couple/events.js
// GET /api/v2/couple/events/:coupleId
// Returns couple events (fittings, trials, meetings, reminders etc).
// Query: ?state=upcoming|done|all  ?limit=50
// Requires couple auth (applied in core.js).

'use strict';

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

  const { data, error } = await supabase
    .from('events')
    .insert({
      couple_id,
      title: title.trim().slice(0, 200),
      event_date,
      event_time: event_time || null,
      kind: resolvedKind,
      notes: notes ? String(notes).trim().slice(0, 500) : null,
      state: 'upcoming',
    })
    .select('id, title, event_date, event_time, kind, state, notes, created_at')
    .single();

  if (error) {
    console.error('[POST /couple/events] insert error:', error.message);
    return errRes(res, 500, 'Could not create event.');
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

  const { data, error } = await supabase
    .from('events')
    .update({ state })
    .eq('id', req.params.eventId)
    .eq('couple_id', couple_id)
    .select('id, state')
    .single();

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

  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', req.params.eventId)
    .eq('couple_id', couple_id)
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Event not found.');
    console.error('[DELETE /couple/events] error:', error.message);
    return errRes(res, 500, 'Could not delete event.');
  }
  return okRes(res, { deleted: data.id });
}));

module.exports = router;
