'use strict';
// src/api/vendor-engine/today.js
// Vendor Suit, Phase 3-B — engine-backed TODAY dashboard.
//   GET /api/v2/vendor-e/today/:vendorId
// The live src/api/vendor/today.js reads the LEGACY separate tables
// (invoices/leads). The engine has only the unified ledger (engine.records), so
// this RE-DERIVES the same TodayResponse shape from the binder ledger:
//   overdue_invoices  <- binders with amount_pending > 0 and a past date
//   new_leads         <- lead-stage binders (non-client, inbound), most recent
//   money_snapshot    <- summed from amount_received / amount_pending
//   open_leads_count  <- count of lead-stage binders
// Calendar slices (events_today, this_week) still read public.events (the
// wedding calendar). budget_total is null (records has no budget column; budget
// lives in the note as prose — same as the binder-native pwa adapters).
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function istTodayISO() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().split('T')[0];
}
function istPlusDaysISO(days) {
  return new Date(Date.now() + IST_OFFSET_MS + days * 86400000).toISOString().split('T')[0];
}

const RECORD_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, created_at';

router.get('/:vendorId',
  requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(),
  async (req, res) => {
    const pub     = req.app.locals.supabase;
    const eng     = req.app.locals.supabase.schema('engine');
    const vendor  = req.vendor;
    const agentId = req.agentId;
    const today     = istTodayISO();
    const sevenDays = istPlusDaysISO(7);

    const [
      { data: user,    error: userErr },
      { data: binders, error: bindersErr },
      { data: events,  error: eventsErr },
    ] = await Promise.all([
      pub.from('users').select('name').eq('id', vendor.user_id).maybeSingle(),
      eng.from('records')
        .select(RECORD_SELECT)
        .eq('agent_id', agentId)
        .eq('hidden', false),
      // Upcoming events through +7 days covers both events_today and this_week.
      pub.from('events')
        .select('id, title, kind, event_date, event_time')
        .eq('vendor_id', vendor.id)
        .eq('state', 'upcoming')
        .gte('event_date', today)
        .lte('event_date', sevenDays)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: true })
        .limit(50),
    ]);

    if (userErr || bindersErr || eventsErr) {
      const msg = (userErr || bindersErr || eventsErr).message;
      console.error('[GET /vendor-e/today] read failed:', msg);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }

    const allBinders = binders || [];
    const allEvents  = events  || [];
    const isOut = (b) => (b.direction || '').toLowerCase() === 'out';

    // F-04.19 (CE-ruled 2026-07-15, closing the F-04.13 family): THE money rule,
    // mirrored from the canon (dreamos-pwa/lib/vendor/derive.ts :: pendingOf).
    // This route is DORMANT (fetchToday has no callers) — ruled anyway: no code,
    // sleeping or waking, may carry independent money arithmetic.
    const pendingOf = (b) => {
      if (isOut(b)) return 0;
      const explicit = b.amount_pending;
      if (explicit !== null && explicit !== undefined && explicit !== '') {
        return Math.max(Number(explicit) || 0, 0);
      }
      return Math.max((Number(b.amount) || 0) - (Number(b.amount_received) || 0), 0);
    };

    // Lead-stage = inbound, not yet a client (mirrors the cabinet slicing).
    const CLIENT_STAGE_WORDS = ['client', 'booked', 'confirmed', 'signed', 'advance', 'paid'];
    const isClientStage = (b) => {
      const s = (b.stage || '').toLowerCase();
      return CLIENT_STAGE_WORDS.some(w => s.includes(w));
    };
    const leadBinders = allBinders.filter(b => !isOut(b) && !isClientStage(b));

    // overdue_invoices — pending money with a past due date.
    const overdue = allBinders
      .filter(b => pendingOf(b) > 0 && b.date && b.date < today)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .slice(0, 10)
      .map(b => ({ id: b.id, client_name: b.client || null,
                   amount_owed: pendingOf(b), due_date: b.date }));

    // new_leads — most recent lead-stage binders.
    const newLeads = leadBinders
      .slice()
      .sort((a, b) => ((b.created_at || '') < (a.created_at || '') ? -1 : 1))
      .slice(0, 10)
      .map(b => ({ id: b.id, name: b.client || null, wedding_date: b.date || null,
                   budget_total: null, created_at: b.created_at || '' }));

    // money_snapshot — derived from the records' money cells.
    let totalOutstanding = 0, unpaidCount = 0, advancePaidCount = 0;
    for (const b of allBinders) {
      const owed = pendingOf(b); // F-04.19: the ruled rule
      const recv = Number(b.amount_received) || 0;
      if (owed > 0) {
        totalOutstanding += owed;
        if (recv > 0) advancePaidCount += 1; else unpaidCount += 1;
      }
    }

    // Calendar — events_today is a filter of the same upcoming set.
    const eventsToday = allEvents
      .filter(e => e.event_date === today)
      .map(e => ({ id: e.id, title: e.title, kind: e.kind, event_time: e.event_time }));
    const thisWeek = allEvents
      .map(e => ({ id: e.id, title: e.title, kind: e.kind,
                   event_date: e.event_date, event_time: e.event_time }));

    return res.json({
      ok: true,
      vendor: { name: user?.name || null, category: vendor.category || null, city: vendor.city || null },
      needs_attention: {
        overdue_invoices: overdue,
        new_leads:        newLeads,
        events_today:     eventsToday,
      },
      this_week: thisWeek,
      money_snapshot: {
        total_outstanding:  totalOutstanding,
        unpaid_count:       unpaidCount,
        advance_paid_count: advancePaidCount,
      },
      open_leads_count: leadBinders.length,
    });
  });

module.exports = router;
