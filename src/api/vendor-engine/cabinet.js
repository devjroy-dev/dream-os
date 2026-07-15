'use strict';
// src/api/vendor-engine/cabinet.js
// Vendor Suit, Phase 3-B — engine-backed cabinet read.
//   GET /api/v2/vendor-e/cabinet/:vendorId
// A faithful mirror of src/api/vendor/cabinet.js, with ONE source swap: the
// binder slices read engine.records (scoped to req.agentId) instead of
// public.binders (vendor_id). The calendar slices still read public.events
// (the wedding calendar is dream-os's own table; engine.events is an audit log,
// not a calendar). Vendor metadata comes from req.vendor + public.users.
// Slicing, shape, and counts are identical to the live handler, so Phase 4 can
// flip the path without the pwa noticing.
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
const { withRecordCompleteness } = require('../../lib/recordCompleteness'); // TDW_02 P3 (CE-15/16)

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function istTodayISO() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().split('T')[0];
}

// engine.records — same cells as the public.binders BINDER_SELECT.
const RECORD_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, note, followup_on, followup_note, repeat_every, ' +
  'doc_ref, phone, reason_for_action, created_at, updated_at';
const EVENT_SELECT = 'id, title, kind, event_date, event_time, state, notes';

router.get('/:vendorId',
  requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(),
  async (req, res) => {
    const pub     = req.app.locals.supabase;            // public schema
    const eng     = req.app.locals.supabase.schema('engine');
    const vendor  = req.vendor;
    const agentId = req.agentId;
    const today   = istTodayISO();

    const [
      { data: user,    error: userErr },
      { data: binders, error: bindersErr },
      { data: events,  error: eventsErr },
    ] = await Promise.all([
      pub.from('users').select('name').eq('id', vendor.user_id).maybeSingle(),
      eng.from('records')
        .select(RECORD_SELECT)
        .eq('agent_id', agentId)
        .eq('hidden', false)
        .order('created_at', { ascending: false }),
      pub.from('events')
        .select(EVENT_SELECT)
        .eq('vendor_id', vendor.id)
        // TDW_04 B0 (F-04.25, CE-ruled 2026-07-15): the read had NO deleted_at
        // filter while events.js filters it at :117/:124/:186 — so a soft-deleted
        // future event still counted as "On the calendar". F-04.17's missing half:
        // that ruling stopped CANCELLED dates over-claiming the drawer; deleted
        // ones went on doing it. A deleted date is a SELLABLE date. One rule now,
        // every vendor events read. (SCHEMA.md:293 already claimed this was true.)
        .is('deleted_at', null)
        .order('event_date', { ascending: true }),
    ]);

    if (userErr || bindersErr || eventsErr) {
      const which = userErr ? 'users' : bindersErr ? 'records' : 'events';
      const msg = (userErr || bindersErr || eventsErr).message;
      console.error(`[GET /vendor-e/cabinet] ${which} read failed:`, msg);
      return res.status(500).json({ ok: false, error: 'Lookup failed.', which, detail: msg });
    }

    // TDW_02 P3 (CE-15/16): completeness + wishbone draft ride every slice below.
    const allBinders = withRecordCompleteness(binders || [], req.params.vendorId);
    const allEvents  = events  || [];

    // Binder slices — identical to the live cabinet handler.
    const CLIENT_STAGE_WORDS = ['client', 'booked', 'confirmed', 'signed', 'advance', 'paid'];
    const isClientStage = (b) => {
      const s = (b.stage || '').toLowerCase();
      return CLIENT_STAGE_WORDS.some(w => s.includes(w));
    };
    const clients = allBinders.filter(isClientStage);
    const leads   = allBinders.filter(b => !isClientStage(b) && (b.direction || '').toLowerCase() !== 'out');
    const paid    = allBinders.filter(b => Number(b.amount_received) > 0);

    // ── F-04.13 (CE-RATIFIED 2026-07-15) — THE money rule ────────────────
    // CANON lives in dreamos-pwa/lib/vendor/derive.ts :: pendingOf(). This is
    // its mirror; the two must never diverge (they are one rule, written twice
    // only because they live in different repos).
    //
    //   pending = amount_pending ?? max(amount - amount_received, 0)   [direction 'in' only]
    //
    // WHY: money filed through Victor's donna_money door sets `amount` and
    // never touches the settlement cells; only money-edit writes those. The old
    // predicate (`amount_pending > 0`) therefore read an UNFILED cell as ZERO
    // OWED — hiding Rs 85,000 across two unpaid clients (Dev Roy 2, Keka), who
    // appeared on NO money surface at all while the cabinet drawer, which
    // inferred, showed the truth. The CE's words: "an unfiled cell means
    // unfiled, not Rs 0." Explicit cells still win when present — a binder
    // filed as settled (pending 0) stays settled.
    //
    // The direction guard is load-bearing: without it an expense binder
    // (direction 'out', amount 5000, no cells) would infer Rs 5,000 "owed".
    const pendingOf = (b) => {
      if ((b.direction || 'in').toLowerCase() === 'out') return 0;
      const explicit = b.amount_pending;
      if (explicit !== null && explicit !== undefined && explicit !== '') {
        return Math.max(Number(explicit) || 0, 0);
      }
      return Math.max((Number(b.amount) || 0) - (Number(b.amount_received) || 0), 0);
    };
    const owed = allBinders.filter(b => pendingOf(b) > 0);

    // ── F-04.17 (CE-RATIFIED 2026-07-15) — the calendar predicate ────────
    // ONE rule, recorded (executor's choice per the ruling: the state filter
    // lands here, on the column itself, rather than repointing the drawer to
    // deriveEventsThisWeek — this payload IS the drawer's source, so the
    // predicate belongs where the rows are chosen).
    //
    // The column had NO state predicate: it counted CANCELLED events as "on
    // the calendar" (founder SQL: __calendar_check__ and Meera - call, both
    // cancelled, both shown — drawer said 3, truth was 1). A cancelled date is
    // a SELLABLE date; claiming it is occupied costs the vendor work.
    // `done` does NOT count either, per the ruling: "on the calendar" answers
    // what's ahead; history lives in timelines.
    const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'];
    const booked = allEvents.filter(e =>
      e.event_date && e.event_date >= today && BOOKED_KINDS.includes(e.kind)
      && (e.state || 'upcoming') === 'upcoming');

    const REMINDER_KINDS = ['reminder', 'task'];
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
      clients, leads, paid, owed, booked, reminders,
      counts: {
        clients: clients.length, leads: leads.length, paid: paid.length,
        owed: owed.length, booked: booked.length, reminders: reminders.length,
      },
    });
  });

module.exports = router;
