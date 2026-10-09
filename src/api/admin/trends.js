'use strict';
// src/api/admin/trends.js · CE-47 · PRO · P3 · More > Trend briefs (mounted at /api/v2/admin/trends via router.js).
// Drafts are counted every Monday at 01:10 am India time; the admin approves or withholds each one before 9:00 am, and
// may add up to three news lines, each with its source. Vendors see an approved brief from Monday 9:00 am.
//   GET  /?week=YYYY-MM-DD        the briefs (newest weeks first)
//   POST /make                    { week_start }  count that week now (a Monday)
//   POST /:id                     { state: 'approved' | 'withheld' | 'draft', news: [{ line, source_url }] }
const express = require('express');
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const T = require('../../lib/trends/trends');
const { lastWeekStart } = require('../../lib/trends/build');

const router = express.Router();
router.use(requireAdmin);
router.use(express.json());
const who = (req) => (req.admin && (req.admin.name || req.admin.id)) || 'admin';

router.get('/', asyncHandler(async (req, res) => {
  const r = await T.adminList({ supabase: req.app.locals.supabase, weekStart: String(req.query.week || '') });
  return r.ok ? okRes(res, { briefs: r.briefs, last_week: lastWeekStart(Date.now()) }) : errRes(res, r.status, r.error);
}));
router.post('/make', asyncHandler(async (req, res) => {
  const ws = String((req.body || {}).week_start || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ws) || new Date(`${ws}T00:00:00Z`).getUTCDay() !== 1) return errRes(res, 400, 'Choose a Monday.');
  const r = await T.makeWeek({ supabase: req.app.locals.supabase, weekStart: ws });
  return r.ok ? okRes(res, { made: r.made, kept: r.kept }) : errRes(res, 500, 'TDW could not count that week.');
}));
router.post('/:id', asyncHandler(async (req, res) => {
  const r = await T.adminDecide({ supabase: req.app.locals.supabase, id: req.params.id, body: req.body || {}, who: who(req) });
  return r.ok ? okRes(res, { brief: r.brief }) : errRes(res, r.status, r.error);
}));
module.exports = router;
