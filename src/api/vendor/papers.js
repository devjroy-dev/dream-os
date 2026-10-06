// src/api/vendor/papers.js · CE-47 · PRO · P1 · BUSINESS PAPERS, her doors (mounted at /api/v2/vendor/papers).
//   GET  /:vendorId                     her papers, newest first, each with what it states and its check link
//   GET  /:vendorId/about               what a certificate would state today (for the room, before she issues)
//   POST /:vendorId                     issue one: { kind, period_from, period_to, purpose }
//   POST /:vendorId/:paperId/withdraw   withdraw one (one way)
//   GET  /:vendorId/:paperId/file       the PDF, or the CA pack ZIP
'use strict';
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { issuePaper, listPapers, getPaper, withdrawPaper } = require('../../lib/papers/issue');
const { professional } = require('../../lib/papers/figures');
const { paperFile, lines, note } = require('../../lib/papers/render');
const W = require('../../lib/papers/words');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A paper as the room shows it. The CA pack's rows are not sent to the room (they are in its file). */
const view = (p) => ({ id: p.id, kind: p.kind, title: W.KIND_TITLE[p.kind], period_from: p.period_from, period_to: p.period_to, purpose: p.purpose,
  issued_at: p.issued_at, issued_on: W.fullDate(p.issued_at), withdrawn_at: p.withdrawn_at, state: p.withdrawn_at ? 'withdrawn' : 'valid',
  check_code: p.check_code, check_url: W.checkUrl(p.check_code), lines: lines(p), note: note(p) });
const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];

router.get('/:vendorId', ...auth, asyncHandler(async (req, res) => {
  const r = await listPapers({ supabase: req.app.locals.supabase, vendorId: req.vendor.id });
  return r.ok ? okRes(res, { papers: r.papers.map(view) }) : errRes(res, 500, r.error);
}));
router.get('/:vendorId/about', ...auth, asyncHandler(async (req, res) => {
  const r = await professional({ supabase: req.app.locals.supabase, vendor: req.vendor });
  return r.ok ? okRes(res, { about: { ...r.figures, gstin: req.vendor.gstin || null } }) : errRes(res, 503, r.error);
}));
router.post('/:vendorId', ...auth, express.json(), asyncHandler(async (req, res) => {
  const r = await issuePaper({ supabase: req.app.locals.supabase, vendor: req.vendor, body: req.body || {} });
  return r.ok ? okRes(res, { paper: view(r.paper) }) : errRes(res, r.status, r.error);
}));
router.post('/:vendorId/:paperId/withdraw', ...auth, asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.paperId)) return errRes(res, 404, 'That paper is not in your account.');
  const r = await withdrawPaper({ supabase: req.app.locals.supabase, vendorId: req.vendor.id, id: req.params.paperId });
  return r.ok ? okRes(res, { withdrawn: true }) : errRes(res, r.status, r.error);
}));
router.get('/:vendorId/:paperId/file', ...auth, asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.paperId)) return errRes(res, 404, 'That paper is not in your account.');
  const g = await getPaper({ supabase: req.app.locals.supabase, vendorId: req.vendor.id, id: req.params.paperId });
  if (!g.ok) return errRes(res, 500, 'TDW could not read the paper just now.');
  if (!g.paper) return errRes(res, 404, 'That paper is not in your account.');
  const f = await paperFile(g.paper);
  res.set({ 'Content-Type': f.type, 'Content-Disposition': `attachment; filename="${f.name}"`, 'Cache-Control': 'private, no-store' });
  return res.status(200).send(f.body);
}));
module.exports = router;
module.exports._view = view;
