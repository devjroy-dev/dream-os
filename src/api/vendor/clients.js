// src/api/vendor/clients.js
// Vendor clients resource — two handlers in one router:
//   GET /api/v2/vendor/clients/:vendorId             — paginated roster
//   GET /api/v2/vendor/clients/:vendorId/:clientId   — detail with linked leads + invoices
//
// Auth: vendor JWT.
// Ownership:
//   List   — :vendorId must match JWT vendor (resolveVendor mode B).
//   Detail — :vendorId must match JWT vendor (resolveVendor mode B), AND
//            the client row must belong to that vendor. Belt-and-braces:
//            we re-check client.vendor_id inside the handler, so a malformed
//            URL like /clients/<myVendorId>/<someoneElsesClientId> returns 404.
//
// Field mappings (contract <- schema):
//   For linked leads inside detail: budget_total <- budget_max
//
// Note: the `clients` table has columns name, phone, email, notes (per SCHEMA.md
// lines 301-317). All four are exposed in both endpoints exactly as contract.
// `source` and `referrer_name` are NOT in the contract response and not returned.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

// ─── GET /api/v2/vendor/clients/:vendorId ──────────────────────────────
//
// Query params:
//   ?limit=20&offset=0    -> default limit 20, max 100

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  const [
    { data: rows, error: dataErr },
    { count,      error: countErr },
  ] = await Promise.all([
    supabase.from('clients')
      .select('id, name, phone, email, notes, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),

    supabase.from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id),
  ]);

  if (dataErr || countErr) {
    console.error('[GET /vendor/clients] supabase error:', (dataErr || countErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  return res.json({
    ok:      true,
    clients: rows || [],
    total:   count || 0,
  });
});

// ─── GET /api/v2/vendor/clients/:vendorId/:clientId ────────────────────
//
// Returns the client row + arrays of leads and invoices linked to that client.
// "Linked" means the leads.client_id / invoices.client_id FK points to this clientId.
// (Both tables added client_id columns in session 8.5 — see SCHEMA.md notes on
// leads.client_id and invoices.client_id.)

router.get('/:vendorId/:clientId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const clientId = req.params.clientId;

  // Three parallel reads. We fetch the client first (with vendor_id filter)
  // so a wrong-tenant clientId in URL returns 404, never leaks rows.
  const [
    { data: client,   error: clientErr },
    { data: leads,    error: leadsErr },
    { data: invoices, error: invoicesErr },
  ] = await Promise.all([
    supabase.from('clients')
      .select('id, name, phone, email, notes')
      .eq('id', clientId)
      .eq('vendor_id', vendor.id)
      .maybeSingle(),

    supabase.from('leads')
      .select('id, wedding_date, state, budget_max')
      .eq('client_id', clientId)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false }),

    supabase.from('invoices')
      .select('id, amount_total, amount_paid, state, due_date')
      .eq('client_id', clientId)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false }),
  ]);

  if (clientErr || leadsErr || invoicesErr) {
    console.error('[GET /vendor/clients/:clientId] supabase error:', (clientErr || leadsErr || invoicesErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  if (!client) {
    // Either the clientId doesn't exist, or it belongs to a different vendor.
    // We return 404 either way — never leak existence across tenants.
    return res.status(404).json({ ok: false, error: 'Not found.' });
  }

  const shapedLeads = (leads || []).map(l => ({
    id:           l.id,
    wedding_date: l.wedding_date,
    state:        l.state,
    budget_total: l.budget_max,
  }));

  const shapedInvoices = (invoices || []).map(inv => ({
    id:           inv.id,
    amount_total: inv.amount_total,
    amount_paid:  inv.amount_paid,
    state:        inv.state,
    due_date:     inv.due_date,
  }));

  return res.json({
    ok:       true,
    client:   client,
    leads:    shapedLeads,
    invoices: shapedInvoices,
  });
});

module.exports = router;
