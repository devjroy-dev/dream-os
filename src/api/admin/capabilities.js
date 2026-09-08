// src/api/admin/capabilities.js — THE SWITCHBOARD'S ADMIN DOORS. CE-41 seat C, R-41.8.
//
//   GET  /api/v2/admin/capabilities            every row (fresh, not cached — the card is the truth)
//   GET  /api/v2/admin/capabilities/waba_templates  C1b: the raw Graph listing of every template on META_WABA_ID (F-41.6)
//   POST /api/v2/admin/capabilities/:key/flip  { to: 'on'|'off' }  → the founder's tap (armed|approved|on|off → on|off)
//   POST /api/v2/admin/capabilities/:key/auto_on  { auto_on: bool, walk_ref?: text }  (fork iii: on needs walk_ref)
//   POST /api/v2/admin/capabilities/:key/check    Check now — one live probe, the row's evidence line moves
//   POST /api/v2/admin/capabilities/sweep         on-demand full sweep
//
// `flipped_by`: the admin session carries no user identity (one founder, one
// secret — `src/lib/adminSession.js` is an HMAC over a mint-time nonce). The row
// records `admin:<8 hex of sha256(token)>` so two sessions are tellable apart
// without a token ever touching a row. Disclosed in the C1 handover.
//
// Every write goes through `src/lib/capabilities.js` — this file holds no SQL.
'use strict';

const crypto       = require('crypto');
const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const cap   = require('../../lib/capabilities');
const sweep = require('../../capabilitiesSweep');
const { COOKIE_NAME, bearerFrom } = require('../../lib/adminSession');

function whoFlipped(req) {
  const tok = bearerFrom(req) || (req.cookies && req.cookies[COOKIE_NAME]) || '';
  const fp = crypto.createHash('sha256').update(String(tok)).digest('hex').slice(0, 8);
  return `admin:${fp}`;
}

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const rows = await cap.list({ supabase, fresh: true });
  return okRes(res, { rows, guards: sweep.TEMPLATE_GUARDS });
}));

// C1b — the raw WABA listing (F-41.6's instrument): every template name with its
// Meta status, category and id, paginated to completion. Read-only; writes nothing.
router.get('/waba_templates', requireAdmin, asyncHandler(async (req, res) => {
  const r = await sweep.listWabaTemplates();
  if (!r.ok && r.templates.length === 0) return errRes(res, 502, r.evidence);
  return okRes(res, { count: r.templates.length, pages: r.pages, truncated: !!r.truncated, evidence: r.evidence, templates: r.templates });
}));

router.post('/sweep', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const r = await sweep.runSweep({ supabase, mode: 'on-demand' });
  return okRes(res, r);
}));

router.post('/:key/flip', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { key } = req.params;
  const to = req.body && req.body.to;
  if (!cap.isValidKey(key)) return errRes(res, 400, 'key is not a switchboard key.');
  if (to !== 'on' && to !== 'off') return errRes(res, 400, 'to must be on or off.');
  const r = await cap.flip(key, to, whoFlipped(req), { supabase });
  if (!r.ok) return errRes(res, r.reason === 'no_row' ? 404 : 409, r.reason);
  const row = await cap.get(key, { supabase, fresh: true });
  return okRes(res, { row, before: r.before, after: r.after });
}));

router.post('/:key/auto_on', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { key } = req.params;
  if (!cap.isValidKey(key)) return errRes(res, 400, 'key is not a switchboard key.');
  const body = req.body || {};
  const r = await cap.setAutoOn(key, { auto_on: body.auto_on === true, walk_ref: body.walk_ref }, whoFlipped(req), { supabase });
  if (!r.ok) return errRes(res, r.reason === 'no_row' ? 404 : 409, r.reason);
  const row = await cap.get(key, { supabase, fresh: true });
  return okRes(res, { row });
}));

router.post('/:key/check', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { key } = req.params;
  if (!cap.isValidKey(key)) return errRes(res, 400, 'key is not a switchboard key.');
  const before = await cap.get(key, { supabase, fresh: true });
  if (!before) return errRes(res, 404, 'no_row');
  const r = await sweep.runSweep({ supabase, keys: [key], mode: 'check-now' });
  const row = await cap.get(key, { supabase, fresh: true });
  return okRes(res, { row, result: r.results[0] || null });
}));

module.exports = router;
