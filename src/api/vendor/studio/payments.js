// src/api/vendor/studio/payments.js
// GET   /api/v2/vendor/studio/team-payments             — list
// POST  /api/v2/vendor/studio/team-payments             — log obligation
// PATCH /api/v2/vendor/studio/team-payments/:id/mark-paid — settle
// GET   /api/v2/vendor/studio/team-payments/balance     — per-member totals
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const VALID_STATES = ['owed', 'paid', 'cancelled'];
const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET /balance — MUST be defined before /:id routes to avoid param clash
router.get('/balance', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_payments')
    .select('team_member_id, amount_inr, state, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .in('state', ['owed', 'paid']);
  if (error) return errRes(res, 500, error.message);

  const map = {};
  for (const row of (data || [])) {
    if (!map[row.team_member_id]) {
      map[row.team_member_id] = {
        team_member_id: row.team_member_id,
        name:           row.team_members?.name || '',
        owed_inr:       0,
        paid_inr:       0,
      };
    }
    if (row.state === 'owed') map[row.team_member_id].owed_inr += row.amount_inr;
    if (row.state === 'paid') map[row.team_member_id].paid_inr += row.amount_inr;
  }
  const balances = Object.values(map);
  const total_owed_inr = balances.reduce((s, b) => s + b.owed_inr, 0);
  return okRes(res, { balances, total_owed_inr });
}));

// GET — list all payments
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { state, member_id } = req.query;
  let q = supabase
    .from('team_payments')
    .select('*, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (state && VALID_STATES.includes(state)) q = q.eq('state', state);
  if (member_id) q = q.eq('team_member_id', member_id);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { payments: data || [] });
}));

// POST — log obligation
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { team_member_id, amount_inr, description,
          linked_event_id, linked_task_id, notes } = req.body || {};
  if (!team_member_id) return errRes(res, 400, 'team_member_id is required.');
  if (!amount_inr || amount_inr <= 0) return errRes(res, 400, 'amount_inr must be a positive integer.');

  const { data, error } = await supabase
    .from('team_payments')
    .insert({
      vendor_id:       req.vendor.id,
      team_member_id,
      amount_inr,
      description:     description     || null,
      linked_event_id: linked_event_id || null,
      linked_task_id:  linked_task_id  || null,
      notes:           notes           || null,
      state:           'owed',
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { payment: data });
}));

// PATCH /:id/mark-paid
router.patch('/:paymentId/mark-paid', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { paid_via, notes } = req.body || {};
  const { data, error } = await supabase
    .from('team_payments')
    .update({
      state:   'paid',
      paid_at: new Date().toISOString(),
      paid_via: paid_via || null,
      notes:    notes    || null,
    })
    .eq('id', req.params.paymentId)
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'owed')
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { payment: data });
}));

module.exports = router;
