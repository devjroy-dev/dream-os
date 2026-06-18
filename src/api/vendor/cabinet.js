// src/api/vendor/cabinet.js
// GET /api/v2/vendor/cabinet/:vendorId
// Auth: vendor JWT (must own vendorId).
//
// The binder-native dashboard read. Returns the six slices a wedding vendor
// asks for — who are my clients, who are my leads, what's paid, what's owed,
// when am I booked, what are my reminders — PLUS the full raw binder shape so
// the PWA can "lift the hood" and show the actual record underneath.
//
// Four slices read BINDERS (the one free-form ledger, the same way Kriya's
// hands read it). Two slices read EVENTS (the calendar stays its own table).
//
//   clients    <- binders where stage = 'client'
//   leads      <- binders where stage = 'lead'
//   paid       <- binders where amount_received > 0   (same binder may be in owed too)
//   owed       <- binders where amount_pending  > 0
//   booked     <- events, real commitments (kind != reminder/task/blocked), date >= today
//   reminders  <- events kind in (reminder, task) + binders carrying a followup_on
//
// Every binder is returned in FULL (all cells) — the surface chooses what to
// show; the hood-lift shows everything. We never parse fields out of the note;
// budget/context live there as prose and are shown as the binder's story.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function istTodayISO() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().split('T')[0];
}

// Full raw binder shape — every cell, so the hood-lift shows the true record.
const BINDER_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, note, followup_on, followup_note, repeat_every, ' +
  'doc_ref, phone, reason_for_action, created_at, updated_at';

const EVENT_SELECT = 'id, title, kind, event_date, event_time, state, notes';

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const today    = istTodayISO();

  // One read of all live binders; we slice in memory (the cabinet is small per
  // vendor, and one read keeps paid/owed overlap honest without re-querying).
  const [
    { data: user,    error: userErr },
    { data: binders, error: bindersErr },
    { data: events,  error: eventsErr },
  ] = await Promise.all([
    supabase.from('users').select('name').eq('id', vendor.user_id).maybeSingle(),
    supabase.from('binders')
      .select(BINDER_SELECT)
      .eq('vendor_id', vendor.id)
      .eq('hidden', false)
      .order('created_at', { ascending: false }),
    supabase.from('events')
      .select(EVENT_SELECT)
      .eq('vendor_id', vendor.id)
      .order('event_date', { ascending: true }),
  ]);

  if (userErr || bindersErr || eventsErr) {
    const which = userErr ? 'users' : bindersErr ? 'binders' : 'events';
    const msg = (userErr || bindersErr || eventsErr).message;
    console.error(`[GET /vendor/cabinet] ${which} read failed:`, msg);
    return res.status(500).json({ ok: false, error: 'Lookup failed.', which, detail: msg });
  }

  const allBinders = binders || [];
  const allEvents  = events  || [];

  // ── Binder slices ──────────────────────────────────────────────────────────
  const clients = allBinders.filter(b => (b.stage || '').toLowerCase() === 'client');
  const leads   = allBinders.filter(b => (b.stage || '').toLowerCase() === 'lead');
  const paid    = allBinders.filter(b => Number(b.amount_received) > 0);
  const owed    = allBinders.filter(b => Number(b.amount_pending)  > 0);

  // ── Calendar slices ─────────────────────────────────────────────────────────
  // Booked = real commitments going forward (exclude reminders/tasks/blocked).
  const REMINDER_KINDS = ['reminder', 'task'];
  const booked = allEvents.filter(e =>
    e.event_date && e.event_date >= today &&
    e.kind !== 'blocked' && !REMINDER_KINDS.includes(e.kind)
  );

  // Reminders & tasks = calendar reminders/tasks + any binder carrying a followup.
  const reminderEvents = allEvents
    .filter(e => REMINDER_KINDS.includes(e.kind))
    .map(e => ({ source: 'event', ...e }));
  const reminderBinders = allBinders
    .filter(b => b.followup_on)
    .map(b => ({ source: 'binder', id: b.id, client: b.client,
                 followup_on: b.followup_on, followup_note: b.followup_note, binder: b }));
  const reminders = [...reminderEvents, ...reminderBinders];

  return res.json({
    ok: true,
    vendor: {
      name:     user?.name || null,
      category: vendor.category || null,
      city:     vendor.city || null,
      handle:   vendor.routing_handle || null,
    },
    clients,
    leads,
    paid,
    owed,
    booked,
    reminders,
    counts: {
      clients:   clients.length,
      leads:     leads.length,
      paid:      paid.length,
      owed:      owed.length,
      booked:    booked.length,
      reminders: reminders.length,
    },
  });
});

module.exports = router;
