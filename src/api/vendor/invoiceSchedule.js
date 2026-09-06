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
  if (!data || data.length === 0) return errRes(res, 404, 'No schedule found for this invoice.');
  return okRes(res, { schedule: data });
}));

// DELETE /:invoiceId/schedule →  /api/v2/vendor/invoices/:invoiceId/schedule
router.delete('/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await deleteSchedule(supabase, req.vendor.id, req.params.invoiceId);
  if (!result.ok) return errRes(res, 409, result.error);
  return okRes(res, { deleted: true });
}));

module.exports = router;
