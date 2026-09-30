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
const vendorLayout = require('../../lib/vendorLayout');   // DESIGN-1: the layout switch's one home
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

// ── DESIGN-1 · THE LAYOUT SWITCH, READ (the founder, 29 Sept 2026; CE-46 F3, one home) ───────────────────────────
// What the panel shows: the master (the switchboard's flag.vendor_layout_v2, flipped by the door below) and the vendors
// whose row carries layout_v2 (added and removed by the door after it). One predicate home: src/lib/vendorLayout.js.
router.get('/layout', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const list = await vendorLayout.listVendors({ supabase });
  if (!list.ok) return errRes(res, 500, list.reason);
  const master = await vendorLayout.masterState({ supabase });
  return okRes(res, { flag: vendorLayout.FLAG, default_on: cap.on(vendorLayout.FLAG), vendors: list.vendors, master });
}));

// THE PER-VENDOR SWITCH (CE-46 F3): Add or Remove one vendor, instant, no deploy. Answers with the list the panel shows.
router.post('/layout/vendor', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const supabase = req.app.locals.supabase;
  const r = await vendorLayout.setVendor(body.vendor_id, body.on, { supabase });
  if (!r.ok) return errRes(res, r.reason === 'no_vendor' ? 404 : r.reason === 'write_failed' ? 500 : 400, r.reason);
  const list = await vendorLayout.listVendors({ supabase });
  if (!list.ok) return errRes(res, 500, list.reason);
  return okRes(res, { vendors: list.vendors });
}));

// THE MASTER, "New layout for everyone" (the founder and the chair): one tap each way, instant, no deploy. The first
// turn on records its date once (vendorLayout.setMaster); off returns every vendor but the listed ones to today's layout.
router.post('/layout/master', requireAdmin, asyncHandler(async (req, res) => {
  const to = req.body && req.body.to;
  if (to !== 'on' && to !== 'off') return errRes(res, 400, 'to must be on or off.');
  const supabase = req.app.locals.supabase;
  const r = await vendorLayout.setMaster(to, whoFlipped(req), { supabase });
  if (!r.ok) return errRes(res, r.reason === 'no_row' ? 404 : 409, r.reason);
  return okRes(res, { master: await vendorLayout.masterState({ supabase }) });
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
  // DESIGN-1: the first-on date is recorded once, never by hand; the master flips through its own home so the date is kept
  if (key === vendorLayout.FIRST_ON) return errRes(res, 409, 'recorded_once');
  const r = key === vendorLayout.FLAG ? await vendorLayout.setMaster(to, whoFlipped(req), { supabase }) : await cap.flip(key, to, whoFlipped(req), { supabase });
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
// ── CE-41 R-41.88 (c-41.10's form) — ONE LABELLED CROSS-SEAT LINE ────────────
// Seat F's model-routes door (`src/api/admin/modelRoutes.js`) stamps `changed_by`
// on every row the founder's panel writes, and it must be THE SAME fingerprint
// this door already writes to the switchboard — otherwise two admin surfaces
// spell the same session two ways and neither log can be joined to the other.
// The chair ruled: call across, no lift, one home. This is that line, and it is
// the whole of seat F's reach into seat C's file. Chair-authorised while seat C
// rests; seat C is told.
module.exports.whoFlipped = whoFlipped;
