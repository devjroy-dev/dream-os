// src/lib/vendor/schedules.js
// Shared write logic for payment schedules.
// Called by REST handlers (src/api/vendor/schedules.js, src/api/vendor/invoiceSchedule.js,
// src/api/vendor/money.js) and by the promotion act (src/lib/vendor/promotion.js).
//
// ── CE-43 · LC-2 · PACKET 3 (rulings carried) ────────────────────────────────────
//   F7   ONE remainder helper, `milestoneAmounts`, used by createSchedule and by the
//        milestone PATCH door. Every milestone but the last is rounded (Math.round, which
//        is half up on these positive figures and equals C-43.2's rule on whole shares);
//        the last is COMPUTED as the total minus the others, never rounded on its own,
//        so the rows always add up to the invoice. contractSource.js deriveMoney still
//        rounds the deposit with Math.round, so milestone 1 and the paper agree.
//   C-43.2  a caller may hand explicit whole-rupee amounts (the package schedule). They
//        are used as given when every one is a positive integer and they add up to the
//        total; otherwise the call is refused, never silently re-rounded.
//   F6   markMilestonePaid takes the day the money arrived (`receivedOn`, YYYY-MM-DD)
//        and moves the invoice's due_date to its next unpaid milestone (null when none
//        is left). Absent `receivedOn` keeps today's behaviour for the paid stamp.
//   F16  a package invoice's schedule is the booking's own and is never removed:
//        deleteSchedule refuses when the invoice carries lead_package_id.
//   F17  payNextMilestone: a row, swipe or bulk "mark paid" on a package invoice pays the
//        NEXT unpaid milestone, its own amount, on the day given (today at the door).
//   R-43.11  the money mirror (milestone paid → the binder's amount_received and
//        amount_pending) is built behind Railway var PACKAGE_MONEY_MIRROR and does
//        nothing while it is unset. It writes ABSOLUTE figures read off the invoice, so a
//        second run lands the same numbers. It requires the engine lazily so this file
//        loads without it.
'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── milestoneAmounts (F7, the one remainder helper) ──────────────────────────────
// milestones: [{ pct, amount_due? }]. Returns { ok, amounts } or { ok:false, error }.
function milestoneAmounts(total, milestones) {
  const t = Number(total);
  if (!Number.isFinite(t) || t <= 0) return { ok: false, error: 'amount_total must be greater than zero.' };
  const explicit = milestones.every((m) => m.amount_due !== undefined && m.amount_due !== null);
  if (explicit) {
    const amounts = milestones.map((m) => Number(m.amount_due));
    if (amounts.some((a) => !Number.isInteger(a) || a <= 0)) return { ok: false, error: 'Milestone amounts must be whole rupees above zero.' };
    if (amounts.reduce((s, a) => s + a, 0) !== t) return { ok: false, error: 'Milestone amounts must add up to the invoice total.' };
    return { ok: true, amounts };
  }
  const amounts = [];
  let used = 0;
  milestones.forEach((m, i) => {
    if (i === milestones.length - 1) { amounts.push(t - used); return; }
    const a = Math.round((t * Number(m.pct)) / 100);
    amounts.push(a);
    used += a;
  });
  if (amounts.some((a) => a <= 0)) return { ok: false, error: 'Every milestone must come to more than zero.' };
  return { ok: true, amounts };
}

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

  const money = milestoneAmounts(inv.amount_total, milestones);
  if (!money.ok) return { ok: false, error: money.error };

  const rows = milestones.map((m, idx) => ({
    invoice_id:      invoiceId,
    vendor_id:       vendorId,
    milestone_label: String(m.label || m.milestone_label || `Milestone ${idx + 1}`).trim(),
    pct:             Number(m.pct),
    amount_due:      money.amounts[idx],
    due_date:        m.due_date || null,
    ordinal:         idx + 1,
    state:           'pending',
  }));

  const { data, error } = await supabase.from('payment_schedules').insert(rows).select();
  if (error) return { ok: false, error: error.message };

  await supabase.from('invoices').update({ has_schedule: true }).eq('id', invoiceId);
  return { ok: true, schedule: data };
}

// ── nextUnpaid · the invoice's next pending milestone, by ordinal ─────────────────
async function readSchedule(supabase, vendorId, invoiceId) {
  return supabase.from('payment_schedules')
    .select('id, invoice_id, ordinal, amount_due, due_date, state, pct')
    .eq('invoice_id', invoiceId).eq('vendor_id', vendorId)
    .order('ordinal', { ascending: true });
}
function firstPending(rows) {
  return (rows || []).slice().sort((a, b) => a.ordinal - b.ordinal).find((m) => m.state === 'pending') || null;
}

// ── the R-43.11 mirror (behind PACKAGE_MONEY_MIRROR) ──────────────────────────────
function mirrorEnabled(env = process.env) {
  const v = String(env.PACKAGE_MONEY_MIRROR || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on';
}
async function mirrorToBinder(supabase, vendorId, invoiceId, deps = {}) {
  if (!mirrorEnabled(deps.env)) return { mirrored: false, reason: 'off' };
  try {
    const { data: inv } = await supabase.from('invoices')
      .select('id, binder_id, lead_package_id, amount_total, amount_paid')
      .eq('id', invoiceId).eq('vendor_id', vendorId).maybeSingle();
    if (!inv || !inv.binder_id || !inv.lead_package_id) return { mirrored: false, reason: 'not_a_package_invoice' };
    const agentId = deps.agentId || (typeof deps.resolveAgentId === 'function' ? await deps.resolveAgentId() : null);
    if (!agentId) return { mirrored: false, reason: 'no_agent' };
    const received = Number(inv.amount_paid) || 0;
    const total = Number(inv.amount_total) || 0;
    const exec = deps.executeAndPatch || require('../executeAndPatch').executeAndPatch;
    const r = await exec(agentId, 'donna_money_edit', {
      binder_id:       inv.binder_id,
      amount_received: received,
      amount_pending:  Math.max(0, total - received),
      payment_status:  received >= total ? 'paid' : 'partial',
    });
    const failed = !!(r && typeof r.display === 'string' && r.display.startsWith('ERROR'));
    if (failed) console.warn(`[schedules:mirror] invoice=${invoiceId} binder=${inv.binder_id} ${r.display}`);
    return { mirrored: !failed, reason: failed ? 'write_refused' : null };
  } catch (e) {
    console.warn(`[schedules:mirror] invoice=${invoiceId} ${e.message}`);
    return { mirrored: false, reason: 'error' };
  }
}

// ── markMilestonePaid ─────────────────────────────────────────────────────
// Updates milestone state AND bumps invoice amount_paid atomically (JS-level).
// F6: `receivedOn` (YYYY-MM-DD) dates the payment; due_date moves to the next unpaid
// milestone. `opts.agentId` (or `opts.resolveAgentId`, called only when the mirror is on)
// lets the mirror reach the binder.
async function markMilestonePaid(supabase, vendorId, milestoneId, amountPaid, receivedOn, opts = {}) {
  if (!amountPaid || amountPaid <= 0) return { ok: false, error: 'amount_paid must be greater than zero.' };
  if (receivedOn != null && (typeof receivedOn !== 'string' || !DATE_RE.test(receivedOn)))
    return { ok: false, error: 'received_on must be a date (YYYY-MM-DD).' };

  const { data: ms, error: msErr } = await supabase
    .from('payment_schedules').select('*')
    .eq('id', milestoneId).eq('vendor_id', vendorId).maybeSingle();
  if (msErr) return { ok: false, error: msErr.message };
  if (!ms) return { ok: false, error: 'Milestone not found.' };
  if (ms.state === 'paid') return { ok: false, error: 'Milestone is already paid.', code: 'ALREADY_PAID' };
  if (ms.state === 'waived') return { ok: false, error: 'Milestone is waived — cannot mark paid.' };

  // Fetch parent invoice
  const { data: inv, error: invErr } = await supabase
    .from('invoices').select('id, amount_total, amount_paid, state')
    .eq('id', ms.invoice_id).eq('vendor_id', vendorId).maybeSingle();
  if (invErr || !inv) return { ok: false, error: 'Parent invoice not found.' };
  if (inv.state === 'cancelled') return { ok: false, error: 'Parent invoice is cancelled.' };

  const paidAt = receivedOn ? `${receivedOn}T00:00:00+05:30` : new Date().toISOString();

  // Update milestone
  const { error: msUpErr } = await supabase.from('payment_schedules').update({
    state:       'paid',
    paid_at:     paidAt,
    paid_amount: amountPaid,
  }).eq('id', milestoneId).eq('vendor_id', vendorId);
  if (msUpErr) return { ok: false, error: msUpErr.message };

  // F6: the next unpaid milestone becomes the invoice's due date.
  const { data: rest, error: restErr } = await readSchedule(supabase, vendorId, ms.invoice_id);
  if (restErr) return { ok: false, error: restErr.message };
  const next = firstPending((rest || []).filter((m) => m.id !== milestoneId));

  // Update invoice amount_paid + state
  const newAmountPaid = inv.amount_paid + amountPaid;
  const newState = newAmountPaid >= inv.amount_total ? 'paid'
    : inv.state === 'unpaid' ? 'advance_paid'
    : inv.state;

  const { data: invUpdated, error: invUpErr } = await supabase.from('invoices').update({
    amount_paid: newAmountPaid,
    state:       newState,
    due_date:    next ? next.due_date : null,
    updated_at:  new Date().toISOString(),
  }).eq('id', inv.id).eq('vendor_id', vendorId).select().single();
  if (invUpErr) return { ok: false, error: invUpErr.message };

  const { data: msUpdated } = await supabase.from('payment_schedules')
    .select('*').eq('id', milestoneId).eq('vendor_id', vendorId).single();

  const mirror = await mirrorToBinder(supabase, vendorId, inv.id, { agentId: opts.agentId, resolveAgentId: opts.resolveAgentId, env: opts.env, executeAndPatch: opts.executeAndPatch });
  return { ok: true, milestone: msUpdated, invoice: invUpdated, mirror };
}

// ── payNextMilestone (F17) ────────────────────────────────────────────────────────
// Returns { handled:false } for an invoice that is not a package invoice, so the caller
// falls through to its own path. A package invoice with nothing left to pay answers
// ALREADY_PAID.
async function payNextMilestone(supabase, vendorId, invoiceId, receivedOn, opts = {}) {
  const { data: inv, error } = await supabase.from('invoices')
    .select('id, lead_package_id, state')
    .eq('id', invoiceId).eq('vendor_id', vendorId).is('deleted_at', null).maybeSingle();
  if (error) return { handled: true, ok: false, error: error.message };
  if (!inv) return { handled: false };
  if (!inv.lead_package_id) return { handled: false };
  const { data: rows, error: rErr } = await readSchedule(supabase, vendorId, invoiceId);
  if (rErr) return { handled: true, ok: false, error: rErr.message };
  const next = firstPending(rows);
  if (!next) return { handled: true, ok: false, error: 'Invoice is already fully paid.', code: 'INVOICE_PAID' };
  const r = await markMilestonePaid(supabase, vendorId, next.id, next.amount_due, receivedOn, opts);
  return { handled: true, prior_state: inv.state, ...r };
}

// ── deleteSchedule ────────────────────────────────────────────────────────
async function deleteSchedule(supabase, vendorId, invoiceId) {
  // F16: the booking's own schedule stays.
  const { data: inv, error: invErr } = await supabase.from('invoices')
    .select('id, lead_package_id').eq('id', invoiceId).eq('vendor_id', vendorId).maybeSingle();
  if (invErr) return { ok: false, error: invErr.message };
  if (inv && inv.lead_package_id)
    return { ok: false, error: 'A package schedule cannot be removed.', code: 'PACKAGE_SCHEDULE' };

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

// ── doorAgentResolver · the mirror's agent, resolved only when the mirror is on ─────
// The money doors carry no resolveAgent middleware; this resolves the vendor's agent the
// way the lead create door does (src/api/vendor/leads.js, the POST / snapshot patch).
function doorAgentResolver(req) {
  return async () => {
    try {
      const uid = req && req.auth && req.auth.user_id;
      if (!uid || !req.vendor) return null;
      const { resolveAgentForVendor } = require('../../api/middleware/agentBridge');
      const r = await resolveAgentForVendor(req.app.locals.supabase, req.vendor, uid);
      return (r && r.agentId) || null;
    } catch (e) {
      console.warn('[schedules:mirror] agent not resolved:', e.message);
      return null;
    }
  };
}

module.exports = {
  doorAgentResolver,
  createSchedule, markMilestonePaid, deleteSchedule, payNextMilestone,
  milestoneAmounts, mirrorEnabled, mirrorToBinder, firstPending,
};
