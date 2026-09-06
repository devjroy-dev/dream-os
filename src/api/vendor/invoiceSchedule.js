// src/api/vendor/invoiceSchedule.js
// POST   /api/v2/vendor/invoices/:invoiceId/schedule  — create schedule
// GET    /api/v2/vendor/invoices/:invoiceId/schedule  — get schedule
// DELETE /api/v2/vendor/invoices/:invoiceId/schedule  — delete schedule
//
// ══════════════════════════════════════════════════════════════════════════
// WHY THESE THREE LEFT schedules.js, AND WHY IT IS A SPLIT AND NOT A REORDER
// ══════════════════════════════════════════════════════════════════════════
// F-40.181: mounted at the bare root BELOW `/invoices`, the GET was unreachable —
// `invoices.js` owns `GET /:vendorId`, so `GET /invoices/{uuid}/schedule` entered
// that router, matched nothing, and 404'd before the root mount was consulted.
// The POST never collided because `/:vendorId` is a GET, which is why create
// worked and re-read did not.
//
// The first cure moved the root mount ABOVE `/invoices`. That fixed the GET and
// broke `b46` §0.3, which asserts `/money` stands above the bare root — a root
// mount is reached for every path, and `/money`'s placement was chosen for that.
//
// ⚠ AND THE OBVIOUS SECOND CURE DOES NOT WORK. Mounting `schedules.js` at a
// `/schedules` SEGMENT would resolve these three at `/schedules/invoices/:id/
// schedule` — not the address `lib/vendor/api/vendor.ts:1273` calls. It would
// re-break the GET it was meant to fix. And no single position satisfies both
// constraints: §0.3 needs the root mount BELOW `/money`, F-40.181 needs it ABOVE
// `/invoices`, and `/invoices` already sits above `/money`.
//
// So the router is split by the ADDRESS SHAPE it owns, which is what it should
// have been from the start. These three live under `/invoices` and mount there,
// immediately above the invoices router so `/:invoiceId/schedule` is matched
// before `/:vendorId` can swallow it. `/schedules/:milestoneId*` stays in
// `schedules.js` on the root mount, in its original position, and §0.3 is green.
//
// EVERY LIVE ADDRESS IS BYTE-IDENTICAL. The paths are re-declared relative to the
// mount, not renamed; nothing the pwa holds moves.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createSchedule, deleteSchedule } = require('../../lib/vendor/schedules');

const authMw = [requireAuth, resolveVendor()];

// POST /:invoiceId/schedule  →  /api/v2/vendor/invoices/:invoiceId/schedule
router.post('/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { milestones } = req.body || {};
  const result = await createSchedule(supabase, req.vendor.id, req.params.invoiceId, milestones);
  if (!result.ok) return errRes(res, result.code === 409 ? 409 : 400, result.error);
  return okRes(res, { schedule: result.schedule });
}));

// GET /:invoiceId/schedule   →  /api/v2/vendor/invoices/:invoiceId/schedule
router.get('/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('payment_schedules')
    .select('*')
    .eq('invoice_id', req.params.invoiceId)
    .eq('vendor_id', req.vendor.id)
    .order('ordinal', { ascending: true });
  if (error) return errRes(res, 500, error.message);

  // ── F-40.208 · AN EMPTY STATE IS NOT A MISSING RESOURCE ───────────────────
  // This answered 404 for an invoice with no schedule. The invoice EXISTS and
  // having no schedule is a normal thing for it to be — the panel's own line says
  // so ("No schedule on this invoice. Add one and…"), rendering correctly while
  // the console printed red underneath it. That is worse than a cosmetic defect:
  // it trains the eye to read red in the console as normal, which is how a real
  // 404 gets missed. 200 with an empty array; the surface renders the emptiness.
  const schedule = data || [];
  if (schedule.length === 0) return okRes(res, { schedule: [] });

  // ── F-40.209 · THE RECORD MUST RENDER FROM THE ROW, NOT FROM ITS OWN MEMORY ─
  // The Remind control was drawn from component state, so a reload offered a
  // control for a milestone already chased. The UNIQUE key held — a second tap
  // returned 409 and no client was messaged twice — but the surface was offering
  // something it knew would be refused, because it never asked. The reminder
  // state lives on `payment_reminders` and the record read only
  // `payment_schedules`.
  //
  // So the door joins it and hands back `reminded_at` per milestone. Same law as
  // the couple's switch reading its default from the row (R-G11c): a control's
  // state is a fact about the database, and the only honest place to read it is
  // the database.
  //
  // ⚠ READ-ONLY ON payment_reminders, and this route is NOT its writer —
  // `src/lib/vendor/paymentReminders.js` is, and stays so. The column is
  // `created_at` (0139), surfaced under the name the record actually needs.
  // A row whose `milestone_id` went NULL (the schedule was deleted and the ledger
  // outlived it, ON DELETE SET NULL) matches nothing here and is correctly absent:
  // it describes a milestone that no longer exists.
  const ids = schedule.map((m) => m.id);
  const remindedAt = new Map();
  if (ids.length) {
    const { data: rem, error: remErr } = await supabase
      .from('payment_reminders')
      .select('milestone_id, created_at')
      .eq('vendor_id', req.vendor.id)
      .in('milestone_id', ids);
    // A failed join must not cost her the schedule. It costs the CONTROL's
    // knowledge, and the record then behaves as it did before this cure — the
    // UNIQUE key is still the guarantee, so the worst case is a 409 she can read.
    if (remErr) console.error(`[invoiceSchedule] reminder join failed for ${req.params.invoiceId}: ${remErr.message}`);
    for (const r of (rem || [])) {
      const prev = remindedAt.get(r.milestone_id);
      if (!prev || r.created_at < prev) remindedAt.set(r.milestone_id, r.created_at);
    }
  }

  return okRes(res, {
    schedule: schedule.map((m) => ({ ...m, reminded_at: remindedAt.get(m.id) || null })),
  });
}));

// DELETE /:invoiceId/schedule →  /api/v2/vendor/invoices/:invoiceId/schedule
router.delete('/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await deleteSchedule(supabase, req.vendor.id, req.params.invoiceId);
  if (!result.ok) return errRes(res, 409, result.error);
  return okRes(res, { deleted: true });
}));

module.exports = router;
