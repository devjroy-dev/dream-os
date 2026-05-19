// src/api/vendor/today.js
// GET /api/v2/vendor/today/:vendorId
// Auth: vendor JWT (must own vendorId).
// Purpose: TODAY dashboard aggregator.
//   - vendor:           name/category/city snapshot for header
//   - needs_attention:  overdue invoices + brand-new leads + events scheduled today
//   - this_week:        all upcoming events in the next 7 days (IST)
//   - money_snapshot:   total outstanding (unpaid + advance_paid balance), counts
//   - open_leads_count: total leads in pipeline (new/contacted/quoted)
//
// Date boundaries: IST (UTC+5:30). Mirrors src/agent/engine.js exactly so the PWA
// dashboard shows the same "today" the WhatsApp agent sees.
//
// Reads only. Seven parallel Supabase queries in one Promise.all.
//
// Note on budget_total: contract field name vs schema —
//   The contract returns leads with a `budget_total` field. The leads table only
//   has `budget_min` + `budget_max`. We map `budget_max` -> `budget_total` as the
//   ceiling/headline figure. When the agent stored a single number, both fields
//   are equal so this is a faithful mapping. When a range was stored, the ceiling
//   is the most actionable number for vendor decision-making.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

// IST = UTC + 5h30m
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istTodayISO() {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  return istNow.toISOString().split('T')[0];
}

function istPlusDaysISO(days) {
  const istThen = new Date(Date.now() + IST_OFFSET_MS + days * 86400000);
  return istThen.toISOString().split('T')[0];
}

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const today      = istTodayISO();
  const sevenDays  = istPlusDaysISO(7);

  // Seven parallel queries.
  const [
    { data: user,            error: userErr },
    { data: overdueInvoices, error: overdueErr },
    { data: newLeads,        error: newLeadsErr },
    { data: eventsToday,     error: eventsTodayErr },
    { data: thisWeekEvents,  error: thisWeekErr },
    { data: moneyInvoices,   error: moneyErr },
    { count: openLeadsCount, error: openLeadsErr },
  ] = await Promise.all([
    // 0. Vendor's user row for personal name (consistent with /vendor/me).
    supabase.from('users')
      .select('name')
      .eq('id', vendor.user_id)
      .maybeSingle(),

    // 1. Overdue invoices — due_date in the past, still unpaid or advance_paid.
    supabase.from('invoices')
      .select('id, client_name, amount_total, amount_paid, due_date, state')
      .eq('vendor_id', vendor.id)
      .in('state', ['unpaid', 'advance_paid'])
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(10),

    // 2. New leads — state = 'new', most recent first.
    supabase.from('leads')
      .select('id, name, wedding_date, budget_max, created_at')
      .eq('vendor_id', vendor.id)
      .eq('state', 'new')
      .order('created_at', { ascending: false })
      .limit(10),

    // 3. Events today — event_date = IST today, state = upcoming.
    supabase.from('events')
      .select('id, title, kind, event_time')
      .eq('vendor_id', vendor.id)
      .eq('state', 'upcoming')
      .eq('event_date', today)
      .order('event_time', { ascending: true, nullsFirst: true }),

    // 4. This week — upcoming events from today through +7 days.
    supabase.from('events')
      .select('id, title, kind, event_date, event_time')
      .eq('vendor_id', vendor.id)
      .eq('state', 'upcoming')
      .gte('event_date', today)
      .lte('event_date', sevenDays)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true, nullsFirst: true })
      .limit(50),

    // 5. Money snapshot — all unpaid + advance_paid invoices, full set.
    //    We aggregate in JS so we can compute total_outstanding (sum of amount_owed)
    //    and counts split by state in one pass.
    supabase.from('invoices')
      .select('amount_total, amount_paid, state')
      .eq('vendor_id', vendor.id)
      .in('state', ['unpaid', 'advance_paid']),

    // 6. Open leads count — leads in active pipeline.
    supabase.from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .in('state', ['new', 'contacted', 'quoted']),
  ]);

  // Bail on any error.
  const anyErr = userErr || overdueErr || newLeadsErr || eventsTodayErr || thisWeekErr || moneyErr || openLeadsErr;
  if (anyErr) {
    console.error('[GET /vendor/today] supabase error:', anyErr.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  // Aggregate money snapshot.
  let totalOutstanding   = 0;
  let unpaidCount        = 0;
  let advancePaidCount   = 0;
  for (const inv of (moneyInvoices || [])) {
    const owed = (inv.amount_total || 0) - (inv.amount_paid || 0);
    totalOutstanding += owed;
    if (inv.state === 'unpaid')        unpaidCount      += 1;
    if (inv.state === 'advance_paid')  advancePaidCount += 1;
  }

  // Shape responses to contract.
  const shapedOverdue = (overdueInvoices || []).map(inv => ({
    id:          inv.id,
    client_name: inv.client_name,
    amount_owed: (inv.amount_total || 0) - (inv.amount_paid || 0),
    due_date:    inv.due_date,
  }));

  const shapedNewLeads = (newLeads || []).map(l => ({
    id:           l.id,
    name:         l.name,
    wedding_date: l.wedding_date,
    budget_total: l.budget_max,           // ceiling — see header comment
    created_at:   l.created_at,
  }));

  const shapedEventsToday = (eventsToday || []).map(e => ({
    id:         e.id,
    title:      e.title,
    kind:       e.kind,
    event_time: e.event_time,
  }));

  const shapedThisWeek = (thisWeekEvents || []).map(e => ({
    id:         e.id,
    title:      e.title,
    kind:       e.kind,
    event_date: e.event_date,
    event_time: e.event_time,
  }));

  return res.json({
    ok: true,
    vendor: {
      name:     user?.name || null,
      category: vendor.category || null,
      city:     vendor.city || null,
    },
    needs_attention: {
      overdue_invoices: shapedOverdue,
      new_leads:        shapedNewLeads,
      events_today:     shapedEventsToday,
    },
    this_week: shapedThisWeek,
    money_snapshot: {
      total_outstanding:    totalOutstanding,
      unpaid_count:         unpaidCount,
      advance_paid_count:   advancePaidCount,
    },
    open_leads_count: openLeadsCount || 0,
  });
});

module.exports = router;
