// src/lib/vendor/invoices.js
// Shared write logic for vendor invoices.
// Called by REST handlers (src/api/vendor/invoices.js), the vendor engine
// chat door (src/api/vendor-engine/chat.js — Victor), and src/index.js.
//
// Counter increment is NOT atomic here -- we do a read-then-write.
// Acceptable for founding cohort scale (<50 vendors, low concurrency).
// TODO: replace with a Postgres function when concurrent invoice creation
// becomes a real risk (post-launch scaling).

'use strict';

// ── createInvoice ─────────────────────────────────────────────────────────

async function createInvoice(supabase, vendorId, params) {
  const {
    client_name, client_phone, client_id, lead_id,
    description, amount_total, amount_advance,
    due_date, notes,
  } = params;

  if (!client_name || !client_name.trim()) return { ok: false, error: 'client_name is required.' };
  if (!amount_total || amount_total <= 0) return { ok: false, error: 'amount_total must be greater than zero.' };
  if (amount_advance != null && amount_advance < 0) return { ok: false, error: 'amount_advance cannot be negative.' };
  if (amount_advance != null && amount_advance > amount_total) return { ok: false, error: 'amount_advance cannot exceed amount_total.' };

  // Fetch vendor for prefix/counter/handle
  const { data: v, error: vendorErr } = await supabase
    .from('vendors')
    .select('id, business_name, upi_id, routing_handle, invoice_prefix, invoice_counter, user_id')
    .eq('id', vendorId)
    .single();
  if (vendorErr) return { ok: false, error: vendorErr.message };
  if (!v.routing_handle) return { ok: false, error: 'Onboarding incomplete -- cannot create invoice.' };

  // Set prefix if null
  if (!v.invoice_prefix) {
    const derived = 'TDW/' + v.routing_handle;
    await supabase.from('vendors').update({ invoice_prefix: derived }).eq('id', vendorId);
    v.invoice_prefix = derived;
  }

  // Increment counter
  const { data: vUpd, error: counterErr } = await supabase
    .from('vendors')
    .update({ invoice_counter: v.invoice_counter + 1 })
    .eq('id', vendorId)
    .select('invoice_counter')
    .single();
  if (counterErr) return { ok: false, error: 'Counter update failed: ' + counterErr.message };

  const invoiceNumber = v.invoice_prefix + '/' + String(vUpd.invoice_counter).padStart(2, '0');

  // Auto-link client by phone if client_id not provided
  let resolvedClientId = client_id || null;
  if (!resolvedClientId && client_phone) {
    const { data: match } = await supabase
      .from('clients')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('phone', client_phone)
      .is('deleted_at', null)
      .maybeSingle();
    if (match) resolvedClientId = match.id;
  }

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      vendor_id:      vendorId,
      lead_id:        lead_id        || null,
      client_id:      resolvedClientId,
      invoice_number: invoiceNumber,
      client_name:    client_name.trim(),
      client_phone:   client_phone   || null,
      description:    description    || null,
      amount_total,
      amount_advance: amount_advance || null,
      amount_paid:    0,
      due_date:       due_date       || null,
      state:          'unpaid',
      notes:          notes          || null,
    })
    .select('id, invoice_number, client_name, client_phone, amount_total, amount_advance, amount_paid, state, due_date, created_at')
    .single();

  if (invErr) return { ok: false, error: 'Could not create invoice: ' + invErr.message };
  return { ok: true, invoice, vendor: v };
}

// ── updateInvoice ─────────────────────────────────────────────────────────
// Only allowed when amount_paid = 0. Locked after any payment.

async function updateInvoice(supabase, vendorId, invoiceId, patch) {
  const EDITABLE = ['client_name', 'client_phone', 'description', 'amount_total', 'amount_advance', 'due_date', 'notes'];
  const update = {};
  for (const key of EDITABLE) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }
  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields provided.' };

  // Check lock
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, amount_paid, state')
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Invoice not found.' };
  if (existing.amount_paid > 0) {
    return { ok: false, error: 'Cannot edit invoice with payments. Cancel and re-issue.', code: 'INVOICE_LOCKED' };
  }
  if (existing.state === 'cancelled') {
    return { ok: false, error: 'Cannot edit a cancelled invoice.', code: 'INVOICE_CANCELLED' };
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update(update)
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .select('id, invoice_number, client_name, client_phone, amount_total, amount_advance, amount_paid, state, due_date, created_at')
    .maybeSingle();

  if (!invoice && !error) return { ok: false, error: 'Invoice not found.' };
  if (error) return { ok: false, error: error.message };
  return { ok: true, invoice };
}

module.exports = { createInvoice, updateInvoice };
