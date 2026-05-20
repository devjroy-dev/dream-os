// src/api/vendor/couture.js
// Couture availability + appointments endpoints.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { listSlots, addSlot, removeSlot, listAppointments, updateAppointment } = require('../../lib/vendor/couture');

// GET /availability
router.get('/availability', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'all';
  const result   = await listSlots(supabase, req.vendor.id, state);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, { slots: result.slots, total: result.total });
}));

// POST /availability — requires couture_eligible
router.post('/availability', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  if (!vendor.couture_eligible) return errRes(res, 403, 'Couture access is invite-only. Contact Swati.', 'COUTURE_GATED');
  const result = await addSlot(supabase, vendor.id, req.body || {});
  if (!result.ok && result.code) return errRes(res, 409, result.error, result.code);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { slot: result.slot });
}));

// DELETE /availability/:slotId
router.delete('/availability/:slotId', requireAuth, resolveVendor({ paramName: 'slotId', via: 'couture_availability' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await removeSlot(supabase, req.vendor.id, req.params.slotId);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { deleted: true });
}));

// GET /appointments
router.get('/appointments', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'all';
  const result   = await listAppointments(supabase, req.vendor.id, state);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, { appointments: result.appointments, total: result.total });
}));

// PATCH /appointments/:id
router.patch('/appointments/:id', requireAuth, resolveVendor({ paramName: 'id', via: 'couture_appointments' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await updateAppointment(supabase, req.vendor.id, req.params.id, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { appointment: result.appointment });
}));

module.exports = router;
