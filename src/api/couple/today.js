// src/api/couple/today.js
// GET /api/v2/couple/today/:coupleId
// Returns today's snapshot — events today + upcoming + budget summary.
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

  // Fetch couple for wedding_date + budget
  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select('wedding_date, budget_total')
    .eq('id', couple_id)
    .maybeSingle();

  if (coupleErr) {
    console.error('[GET /couple/today] couple query error:', coupleErr.message);
    return errRes(res, 500, 'Could not fetch today snapshot.');
  }

  // days_until_wedding
  let days_until_wedding = null;
  if (couple?.wedding_date) {
    const wDate = new Date(couple.wedding_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((wDate.getTime() - today.getTime()) / 86400000);
    days_until_wedding = diff > 0 ? diff : 0;
  }

  // Today's date string (YYYY-MM-DD) for event_date comparison
  const todayStr = new Date().toISOString().slice(0, 10);

  // Events today
  const { data: eventsToday, error: etErr } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, notes')
    .eq('couple_id', couple_id)
    .eq('event_date', todayStr)
    .eq('state', 'upcoming')
    .order('event_time', { ascending: true, nullsFirst: false });

  if (etErr) {
    console.error('[GET /couple/today] events today error:', etErr.message);
    return errRes(res, 500, 'Could not fetch today snapshot.');
  }

  // Upcoming events (next 30 days, not today)
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const thirtyStr = thirtyDays.toISOString().slice(0, 10);

  const { data: upcomingEvents, error: ueErr } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, notes')
    .eq('couple_id', couple_id)
    .eq('state', 'upcoming')
    .gt('event_date', todayStr)
    .lte('event_date', thirtyStr)
    .order('event_date', { ascending: true })
    .limit(10);

  if (ueErr) {
    console.error('[GET /couple/today] upcoming events error:', ueErr.message);
    return errRes(res, 500, 'Could not fetch today snapshot.');
  }

  // Budget summary from couple_bookings
  const { data: bookings, error: bErr } = await supabase
    .from('couple_bookings')
    .select('amount_paid, amount_total, state')
    .eq('couple_id', couple_id);

  if (bErr) {
    console.error('[GET /couple/today] bookings error:', bErr.message);
    return errRes(res, 500, 'Could not fetch today snapshot.');
  }

  const total_spent     = (bookings || []).reduce((sum, b) => sum + (b.amount_paid || 0), 0);
  const total_committed = (bookings || []).reduce((sum, b) => sum + (b.amount_total || 0), 0);

  return okRes(res, {
    today: {
      events_today:        (eventsToday   || []),
      upcoming_events:     (upcomingEvents || []),
      days_until_wedding,
      total_spent,
      total_committed,
    },
  });
}));

module.exports = router;
