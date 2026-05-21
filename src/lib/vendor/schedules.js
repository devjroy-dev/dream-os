// src/lib/vendor/schedules.js
// Shared write logic for payment schedules.
// Called by REST handlers and pwaEngine tool executors.
'use strict';

// ── createSchedule ────────────────────────────────────────────────────────
async function createSchedule(supabase, vendorId, invoiceId, milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0)
    return { ok: false, error: 'milestones array is required.' };

  const totalPct = milestones.reduce((s, m) => s + Number(m.pct || 0), 0);
  if (Math.abs(totalPct - 100) > 0.01)
    return { ok: false, error: `Milestone percentages must sum to 100. Got ${totalPct}.` };

  // Fetch invoice — verify ownership and state
  const { data: inv, error: invErr } = await supabase
    .from('invoices').select('id, vendor_id, amount_total, amount_paid, state, has_schedule')
    .eq('id', invoiceId).eq('vendor_id', vendorId).maybeSingle();
  if (invErr) return { ok: false, error: invErr.message };
  if (!inv) return { ok: false, error: 'Invoice not found.' };
  if (inv.state === 'cancelled') return { ok: false, error: 'Cannot add schedule to a cancelled invoice.' };
  if (inv.has_schedule) return { ok: false, error: 'This invoice already has a schedule. Delete it first.' };
  if (inv.amount_paid > 0) return { ok: false, error: 'Cannot add a schedule once payments have been recorded.' };

  const rows = milestones.map((m, idx) => ({
    invoice_id:      invoiceId,
    vendor_id:       vendorId,
    milestone_label: String(m.label || m.milestone_label || `Milestone ${idx + 1}`).trim(),
    pct:             Number(m.pct),
    amount_due:      Math.round(inv.amount_total * Number(m.pct) / 100),
    due_date:        m.due_date || null,
    ordinal:         idx + 1,
    state:           'pending',
  }));

  const { data, error } = await supabase.from('payment_schedules').insert(rows).select();
  if (error) return { ok: false, error: error.message };

  await supabase.from('invoices').update({ has_schedule: true }).eq('id', invoiceId);
  return { ok: true, schedule: data };
}

// ── markMilestonePaid ─────────────────────────────────────────────────────
// Updates milestone state AND bumps invoice amount_paid atomically (JS-level).
async function markMilestonePaid(supabase, vendorId, milestoneId, amountPaid) {
  if (!amountPaid || amountPaid <= 0) return { ok: false, error: 'amount_paid must be greater than zero.' };

  const { data: ms, error: msErr } = await supabase
    .from('payment_schedules').select('*')
    .eq('id', milestoneId).eq('vendor_id', vendorId).maybeSingle();
  if (msErr) return { ok: false, error: msErr.message };
  if (!ms) return { ok: false, error: 'Milestone not found.' };
  if (ms.state === 'paid') return { ok: false, error: 'Milestone is already paid.' };
  if (ms.state === 'waived') return { ok: false, error: 'Milestone is waived — cannot mark paid.' };

  // Fetch parent invoice
  const { data: inv, error: invErr } = await supabase
    .from('invoices').select('id, amount_total, amount_paid, state')
    .eq('id', ms.invoice_id).eq('vendor_id', vendorId).maybeSingle();
  if (invErr || !inv) return { ok: false, error: 'Parent invoice not found.' };
  if (inv.state === 'cancelled') return { ok: false, error: 'Parent invoice is cancelled.' };

  // Update milestone
  const { error: msUpErr } = await supabase.from('payment_schedules').update({
    state:       'paid',
    paid_at:     new Date().toISOString(),
    paid_amount: amountPaid,
  }).eq('id', milestoneId);
  if (msUpErr) return { ok: false, error: msUpErr.message };

  // Update invoice amount_paid + state
  const newAmountPaid = inv.amount_paid + amountPaid;
  const newState = newAmountPaid >= inv.amount_total ? 'paid'
    : inv.state === 'unpaid' ? 'advance_paid'
    : inv.state;

  const { data: invUpdated, error: invUpErr } = await supabase.from('invoices').update({
    amount_paid: newAmountPaid,
    state:       newState,
    updated_at:  new Date().toISOString(),
  }).eq('id', inv.id).select().single();
  if (invUpErr) return { ok: false, error: invUpErr.message };

  const { data: msUpdated } = await supabase.from('payment_schedules')
    .select('*').eq('id', milestoneId).single();

  return { ok: true, milestone: msUpdated, invoice: invUpdated };
}

// ── deleteSchedule ────────────────────────────────────────────────────────
async function deleteSchedule(supabase, vendorId, invoiceId) {
  const { data: paid } = await supabase.from('payment_schedules')
    .select('id').eq('invoice_id', invoiceId).eq('vendor_id', vendorId).eq('state', 'paid');
  if (paid && paid.length > 0)
    return { ok: false, error: 'Cannot delete a schedule with paid milestones.' };

  const { error } = await supabase.from('payment_schedules')
    .delete().eq('invoice_id', invoiceId).eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };

  await supabase.from('invoices').update({ has_schedule: false }).eq('id', invoiceId);
  return { ok: true };
}

module.exports = { createSchedule, markMilestonePaid, deleteSchedule };
