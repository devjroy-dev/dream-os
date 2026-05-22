// src/api/admin/hotDates.js
// Admin hot dates management — add, edit, remove Muhurat dates.
// Public GET lives at src/api/public/hotDates.js mounted at /api/v2/hot-dates.
// These admin endpoints are mounted at /api/v2/admin/hot-dates.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ─── GET /api/v2/admin/hot-dates ────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('hot_dates')
    .select('id, date, note, region')
    .order('date', { ascending: true });

  if (error) return errRes(res, 500, error.message);

  const dates = (data || []).map(r => ({
    id:     r.id,
    date:   r.date,
    label:  r.note   || null,
    region: r.region || 'All India',
  }));

  return okRes(res, { dates, total: dates.length });
}));

// ─── POST /api/v2/admin/hot-dates ───────────────────────────────────────
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { date, note, region } = req.body;

  if (!date) return errRes(res, 400, 'date is required (YYYY-MM-DD).');

  const { data, error } = await supabase
    .from('hot_dates')
    .insert({ date, note: note || null, region: region || 'All India' })
    .select('id, date, note, region')
    .single();

  if (error) return errRes(res, 500, error.message);

  return okRes(res, {
    date: { id: data.id, date: data.date, label: data.note, region: data.region },
  });
}));

// ─── PATCH /api/v2/admin/hot-dates/:id ──────────────────────────────────
router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { date, note, region } = req.body;

  const patch = {};
  if (date   !== undefined) patch.date   = date;
  if (note   !== undefined) patch.note   = note;
  if (region !== undefined) patch.region = region;

  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');

  const { error } = await supabase
    .from('hot_dates')
    .update(patch)
    .eq('id', req.params.id);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

// ─── DELETE /api/v2/admin/hot-dates/:id ─────────────────────────────────
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('hot_dates')
    .delete()
    .eq('id', req.params.id);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
