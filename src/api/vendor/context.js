// src/api/vendor/context.js
// GET /api/v2/vendor/context/:vendorId
// Auth: vendor JWT (must own vendorId).
// Purpose: Full context for the DreamAI PWA chat surface.
//
// IMPORTANT: This endpoint MUST return the same snapshot the WhatsApp agent
// receives in src/agent/engine.js (lines 39-79). The PWA chat panel should
// reflect "what the agent knows about you right now" — including the same
// counts, the same time window (30 days), and the same per-row limits.
// If engine.js changes its snapshot composition, this endpoint must change
// too. Drift between them means the PWA and WhatsApp would surface different
// realities for the same vendor.
//
// Mirrored from engine.js:
//   - Window:               IST today through IST today + 30 days
//   - Upcoming events:      max 10, sorted by event_date asc
//   - Pending invoices:     unpaid + advance_paid, max 10, sorted by due_date asc
//   - New leads:            state='new', max 5, sorted by created_at desc
//   - Recent notes:         max 3, sorted by created_at desc
//
// Field mappings (contract <- schema):
//   vendor.name     <-  users.name
//   vendor.handle   <-  vendors.routing_handle
//   budget_total    <-  leads.budget_max
//
// Server-computed:
//   pending_invoices[i].overdue = due_date && due_date < IST today

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

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
  const thirtyDays = istPlusDaysISO(30);

  // Five parallel reads. Composition mirrors engine.js exactly so the PWA
  // chat panel and the WhatsApp agent see the same world.
  const [
    { data: user,             error: userErr },
    { data: pendingInvoices,  error: invoicesErr },
    { data: upcomingEvents,   error: eventsErr },
    { data: newLeads,         error: leadsErr },
    { data: recentNotes,      error: notesErr },
  ] = await Promise.all([
    // 1. vendor.name lives on users.name
    supabase.from('users')
      .select('name')
      .eq('id', vendor.user_id)
      .maybeSingle(),

    // 2. Pending invoices — unpaid + advance_paid, soonest due first, max 10
    supabase.from('invoices')
      .select('client_name, amount_total, amount_paid, due_date, state')
      .eq('vendor_id', vendor.id)
      .in('state', ['unpaid', 'advance_paid'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),

    // 3. Upcoming events — today through +30 days, state=upcoming, max 10
    supabase.from('events')
      .select('title, kind, event_date, event_time')
      .eq('vendor_id', vendor.id)
      .eq('state', 'upcoming')
      .gte('event_date', today)
      .lte('event_date', thirtyDays)
      .order('event_date', { ascending: true })
      .limit(10),

    // 4. New leads — state='new', most recent first, max 5
    supabase.from('leads')
      .select('name, wedding_date, budget_max')
      .eq('vendor_id', vendor.id)
      .eq('state', 'new')
      .order('created_at', { ascending: false })
      .limit(5),

    // 5. Recent notes — most recent first, max 3
    supabase.from('notes')
      .select('content')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const anyErr = userErr || invoicesErr || eventsErr || leadsErr || notesErr;
  if (anyErr) {
    console.error('[GET /vendor/context] supabase error:', anyErr.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  // Shape pending_invoices — compute amount_owed + overdue flag.
  const shapedInvoices = (pendingInvoices || []).map(inv => ({
    client_name: inv.client_name,
    amount_owed: (inv.amount_total || 0) - (inv.amount_paid || 0),
    due_date:    inv.due_date,
    overdue:     Boolean(inv.due_date && inv.due_date < today),
  }));

  // Shape upcoming_events — already in contract shape, just pass through.
  const shapedEvents = (upcomingEvents || []).map(e => ({
    title:      e.title,
    kind:       e.kind,
    event_date: e.event_date,
    event_time: e.event_time,
  }));

  // Shape new_leads — budget_max -> budget_total.
  const shapedLeads = (newLeads || []).map(l => ({
    name:         l.name,
    wedding_date: l.wedding_date,
    budget_total: l.budget_max,
  }));

  // Shape recent_notes — content only per contract.
  const shapedNotes = (recentNotes || []).map(n => ({ content: n.content }));

  return res.json({
    ok: true,
    vendor: {
      name:     user?.name || null,
      category: vendor.category || null,
      city:     vendor.city || null,
      handle:   vendor.routing_handle || null,
    },
    pending_invoices: shapedInvoices,
    upcoming_events:  shapedEvents,
    new_leads:        shapedLeads,
    recent_notes:     shapedNotes,
  });
});

module.exports = router;
