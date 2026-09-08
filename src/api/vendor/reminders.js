// src/api/vendor/reminders.js
// TDW · BLOCK 19 · G3.4 — THE PAYMENT REMINDERS DOORS.
//
//   GET   /api/v2/vendor/reminders            the room: asked · sent · due · the switch
//   POST  /api/v2/vendor/reminders/:milestoneId/send   her own tap, one milestone
//   PATCH /api/v2/vendor/reminders/settings   arm or disarm the standing switch
//
// Auth: vendor JWT, must own the row (requireAuth + resolveVendor), the same
// `authMw` pair `schedules.js` uses. Every read and write below is scoped
// `.eq('vendor_id', req.vendor.id)` — a room that could be handed another
// studio's reminders would be a capability leak wearing a filter.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS IS ITS OWN SEGMENT ROUTER AND NOT A DOOR ON `/solutions`
// ═══════════════════════════════════════════════════════════════════════════
// G2's room read lives at `/solutions/google-reviews`, and the obvious move was
// to put this one beside it. It is the wrong move, and the reason is that file's
// own contract: `solutions/index.js` declares itself GET-only, with **POSTs
// conditional-withheld** in a named section at its foot (R-19.4). G2 could sit
// there because a review ask has no vendor-driven write at all — the room is a
// pure read over a cron's output.
//
// G3.4 has TWO writes, and both are the point of the feature: her tap on the
// first reminder, and her switch. Mounting them on a router that says it has
// none would make that file lie about itself, and would break the cell that
// asserts zero non-GET verbs against its stack.
//
// So: one home that says what it does. The chair pre-approved this divergence on
// exactly that reasoning — a router that describes itself accurately IS the
// one-home law, not a departure from it.
//
// ── MOUNTED ABOVE THE BARE '/' IN core.js ──────────────────────────────────
// `schedules` is mounted at the ROOT and a root mount is reached for every path,
// so a segment router that must win its own prefix belongs before it. `schedules`
// owns `/invoices/:invoiceId/schedule` and `/schedules/:milestoneId` and would
// not today swallow `/reminders/*` — this is not a live collision being dodged.
// It is placement that stays correct when `schedules` grows a segment, which is
// the failure the `/money` comment one line up was written for.
'use strict';

const express = require('express');
const router = express.Router();

const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const {
  sendGate, sendOneReminder, autoSendOn, setAutoSend,
  composeMilestonePhrase, formatDueDate, istDayISO, WINDOW_DAYS,
} = require('../../lib/vendor/paymentReminders');

const authMw = [requireAuth, resolveVendor()];

// ═══════════════════════════════════════════════════════════════════════════
// GET / — THE ROOM
// ═══════════════════════════════════════════════════════════════════════════
// Three bands and a switch, in the shape the ratified mock draws:
//   asked  — every reminder row, newest first
//   sent   — those with a wamid  (R-G34.8)
//   due    — pending milestones inside the window, not yet reminded
//   settings.auto_send + the gate's own state
//
// ⚠ THE BANDS ARE DERIVED HERE, NOT COUNTED ON THE PWA. `sent` is
// `wamid IS NOT NULL` and nothing else, so the surface cannot drift into
// counting something softer. The word the room prints is **Sent**, never Landed:
// a wamid means WhatsApp ACCEPTED the message, never that it reached her phone
// (the founder's amendment, G34_VETO_SHEET §A).
router.get('/', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: rows, error } = await supabase
    .from('payment_reminders')
    .select('id, milestone_id, invoice_id, milestone_label, amount_due, due_date, wamid, source, created_at')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, 'Could not read your reminders.');

  // Her clients' names cost one batched read and are worth it: a list of
  // amounts with no names is a log, not a room. `null` where a name is genuinely
  // absent — the pwa renders its own fallback and this door invents nothing.
  const invoiceIds = [...new Set((rows || []).map((r) => r.invoice_id).filter(Boolean))];
  const clientNames = new Map();
  if (invoiceIds.length) {
    const { data: invs } = await supabase
      .from('invoices').select('id, client_name').in('id', invoiceIds);
    for (const i of (invs || [])) clientNames.set(i.id, i.client_name);
  }

  const asked = (rows || []).map((r) => ({
    id:         r.id,
    client:     r.invoice_id ? (clientNames.get(r.invoice_id) || null) : null,
    milestone:  r.milestone_label,
    amount_due: r.amount_due,
    due_date:   r.due_date,
    sent:       !!r.wamid,
    source:     r.source,
    asked_at:   r.created_at,
  }));

  // WHAT IS STILL DUE. Pending milestones in the window with no reminder row.
  // `payment_schedules` is READ here and never written — `schedules.js` is its
  // sole writer. The predicate is `state = 'pending'`; `payment_schedules_state_check`
  // admits ('pending','paid','waived') and there is no 'unpaid' on this table.
  const { data: msRows } = await supabase
    .from('payment_schedules')
    .select('id, invoice_id, milestone_label, amount_due, due_date')
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'pending')
    .not('due_date', 'is', null)
    .gte('due_date', istDayISO(0))
    .lte('due_date', istDayISO(WINDOW_DAYS))
    .order('due_date', { ascending: true });

  const remindedIds = new Set((rows || []).map((r) => r.milestone_id).filter(Boolean));
  const dueInvoiceIds = [...new Set((msRows || []).map((m) => m.invoice_id).filter(Boolean))];
  if (dueInvoiceIds.length) {
    const missing = dueInvoiceIds.filter((id) => !clientNames.has(id));
    if (missing.length) {
      const { data: invs } = await supabase
        .from('invoices').select('id, client_name').in('id', missing);
      for (const i of (invs || [])) clientNames.set(i.id, i.client_name);
    }
  }

  const due = (msRows || [])
    .filter((m) => !remindedIds.has(m.id))
    .map((m) => ({
      milestone_id: m.id,
      invoice_id:   m.invoice_id,
      client:       clientNames.get(m.invoice_id) || null,
      milestone:    m.milestone_label,
      amount_due:   m.amount_due,
      due_date:     m.due_date,
    }));

  const gate = await sendGate();
  return okRes(res, {
    asked,
    sent_count: asked.filter((a) => a.sent).length,
    due,
    auto_send: await autoSendOn(supabase, req.vendor.id),
    // The room draws its dark state from the gate rather than guessing. `open`
    // false with `approved` true means the flag alone is shut — which is exactly
    // the state today and the room says so honestly.
    sending: { open: gate.open, approved: gate.approved, reason: gate.reason, reason_text: gate.reason_text },
    window_days: WINDOW_DAYS,
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /:milestoneId/send — HER OWN TAP
// ═══════════════════════════════════════════════════════════════════════════
// The first reminder on every invoice is always this door (R-G34: silence never
// means yes). `source: 'vendor_tap'` is what the nightly sweep later reads to
// learn she opened this invoice herself; it is recorded, never inferred from an
// hour of day.
//
// ⚠ THE DOOR OWNS NO GUARANTEE. Once-per-milestone is
// `payment_reminders_milestone_kind_key UNIQUE (milestone_id, kind)` and the
// writer's INSERT-first order. A second tap returns 409 because Postgres refused
// it, not because this handler checked.
router.post('/:milestoneId/send', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: ms, error: msErr } = await supabase
    .from('payment_schedules')
    .select('id, invoice_id, vendor_id, milestone_label, amount_due, due_date, state')
    .eq('id', req.params.milestoneId)
    .eq('vendor_id', req.vendor.id)
    .maybeSingle();
  if (msErr) return errRes(res, 500, msErr.message);
  if (!ms)   return errRes(res, 404, 'Milestone not found.');
  if (ms.state !== 'pending') {
    // A paid or waived milestone is not something to chase, and saying so is
    // kinder than a generic refusal.
    return errRes(res, 400, `This milestone is ${ms.state}. There is nothing to remind about.`);
  }

  const { data: inv } = await supabase
    .from('invoices')
    // `client_id` for `resolveClientPhone`'s second home (R-G34.3).
    .select('id, client_name, client_phone, client_id')
    .eq('id', ms.invoice_id)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!inv) return errRes(res, 404, 'Invoice not found.');

  const { data: v } = await supabase
    .from('vendors').select('business_name').eq('id', req.vendor.id).maybeSingle();

  const out = await sendOneReminder(supabase, {
    vendorId:   req.vendor.id,
    milestone:  ms,
    invoice:    inv,
    vendorName: (v && v.business_name) || null,
    source:     'vendor_tap',
  });

  if (out.already) return errRes(res, 409, 'A reminder has already been sent for this milestone.');
  if (!out.ok && !out.skipped) return errRes(res, 500, out.reason || 'Could not send the reminder.');

  // A SKIPPED SEND IS REPORTED AS SKIPPED, WITH ITS REASON, AND NEVER AS SENT
  // (the never-a-false-done law, F-39.70/.71). The row exists either way and the
  // room shows it under Asked with no Sent state — which is the truth.
  // F-41.17: `reason` is the register's key — the log's word, kept. `reason_text`
  // is the sentence the vendor reads. The room prints only the latter.
  return okRes(res, { sent: !!out.sent, skipped: !!out.skipped, failed: !!out.failed,
                      reason: out.reason || null, reason_text: out.reason_text || out.reason || null,
                      id: out.id || null });
}));

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /settings — THE STANDING SWITCH
// ═══════════════════════════════════════════════════════════════════════════
// Arming it NEVER sends the first reminder on an invoice; it releases the rest,
// and only for invoices she has already opened herself. That asymmetry lives in
// `runReminderSweep`, not here — this door only records what she chose.
router.patch('/settings', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (typeof req.body.auto_send !== 'boolean') {
    return errRes(res, 400, 'auto_send must be true or false.');
  }
  const out = await setAutoSend(supabase, req.vendor.id, req.body.auto_send);
  if (!out.ok) return errRes(res, 500, out.error);
  return okRes(res, { auto_send: out.auto_send });
}));

module.exports = router;
