// src/api/admin/photos.js
// CE-47 WEB-4 cut 30 · R-47.2, THE FOUNDER'S RULE OF 8 OCTOBER 2026: "Pictures to look at".
// There is no approval queue any more: a vendor's pictures are live on her own pages at once. The admin's ONLY power
// over a picture is "hide from Discover" (and its one-tap undo). There is no remove button. What reaches this queue:
//   · pictures Google's safety check HELD (both tables); the admin may RELEASE one (it becomes 'passed');
//   · reports Dreamers filed from Discover (a report never hides a picture by itself); the admin may hide the picture
//     from Discover, or mark the report handled with no change.
// A removal for a legal reason is done by hand, through POST /:imageId/legal-removal: the picture is deleted, the act
// is logged in admin_activity_log with its reason, and the vendor is told by a notice on her portfolio (the founder's
// line, pictureRules.LINES.legalRemoval). Every act here writes one admin_activity_log line (writeAudit).
//
//   GET  /queue                         -> { held: [...], reports: [...] }
//   POST /:imageId/discover-hide        portfolio picture: hidden from Discover          (one tap)
//   POST /:imageId/discover-show        portfolio picture: shown on Discover again       (one tap)
//   POST /:imageId/release  { kind? }   a held picture -> 'passed' (kind 'look' for a look photo)
//   POST /reports/:reportId/handled { outcome: 'hidden_from_discover' | 'no_change' }
//   POST /:imageId/legal-removal { reason, kind? }   by hand, logged, the vendor told
// The old /:imageId/approve, /:imageId/reject and /bulk-approve doors are gone (R-47.2).
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { writeAudit } = require('../../lib/admin/auditLog');
const PR = require('../../lib/vendor/pictureRules');
const { deleteFromCloudinary, currentOrder, writeOrder } = require('../../lib/vendor/portfolio');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isLook = (req) => req.query.kind === 'look' || ((req.body || {}).kind === 'look');
const nowIso = () => new Date().toISOString();
const VENDOR = 'vendor:vendors(id, business_name, category, routing_handle)';
const NOT_FOUND = 'That picture was not found.';

// GET /queue — the held pictures (both tables) and the open reports, oldest first.
router.get('/queue', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const [hp, hl, rp] = await Promise.all([
    sb.from('vendor_portfolio').select(`id, vendor_id, image_url, caption, safety_state, safety_scores, safety_checked_at, discover_hidden_at, created_at, ${VENDOR}`)
      .eq('safety_state', PR.SAFETY.HELD).order('created_at', { ascending: true }),
    sb.from('vendor_look_photos').select(`id, vendor_id, look_id, image_url, caption, safety_state, safety_scores, safety_checked_at, created_at, ${VENDOR}`)
      .eq('safety_state', PR.SAFETY.HELD).is('deleted_at', null).order('created_at', { ascending: true }),
    sb.from('picture_reports').select('id, picture_id, vendor_id, reason, note, created_at, picture:vendor_portfolio(id, image_url, safety_state, discover_hidden_at), ' + VENDOR)
      .is('handled_at', null).order('created_at', { ascending: true }),
  ]);
  const err = hp.error || hl.error || rp.error;
  if (err) return errRes(res, 500, err.message);
  const held = [...(hp.data || []).map((p) => ({ ...p, kind: 'portfolio' })), ...(hl.data || []).map((p) => ({ ...p, kind: 'look' }))];
  const reports = (rp.data || []).map((r) => ({ ...r, reason_line: PR.REPORT_REASONS[r.reason] || null }));
  return okRes(res, { held, reports, total_held: held.length, total_reports: reports.length });
}));

// POST /:imageId/discover-hide and /discover-show — one tap each way (portfolio pictures: only they reach Discover).
for (const [act, hide] of [['discover-hide', true], ['discover-show', false]]) {
  router.post(`/:imageId/${act}`, requireAdmin, asyncHandler(async (req, res) => {
    const sb = req.app.locals.supabase; const id = String(req.params.imageId);
    if (!UUID.test(id)) return errRes(res, 404, NOT_FOUND);
    const patch = hide ? { discover_hidden_at: nowIso(), discover_hidden_by: 'admin' } : { discover_hidden_at: null, discover_hidden_by: null };
    const { data, error } = await sb.from('vendor_portfolio').update(patch).eq('id', id).select('id, vendor_id');
    if (error) return errRes(res, 500, error.message);
    if (!data || !data.length) return errRes(res, 404, NOT_FOUND);
    await writeAudit(sb, hide ? 'picture_discover_hide' : 'picture_discover_show', 'vendor', data[0].vendor_id, { picture_id: id });
    return okRes(res, { id, hidden_from_discover: hide });
  }));
}

// POST /:imageId/release — the one act on a held picture: it becomes 'passed' (on her pages and on Discover).
router.post('/:imageId/release', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const id = String(req.params.imageId);
  if (!UUID.test(id)) return errRes(res, 404, NOT_FOUND);
  const table = isLook(req) ? 'vendor_look_photos' : 'vendor_portfolio';
  const { data, error } = await sb.from(table).update({ safety_state: PR.SAFETY.PASSED, safety_checked_at: nowIso() })
    .eq('id', id).eq('safety_state', PR.SAFETY.HELD).select('id, vendor_id');
  if (error) return errRes(res, 500, error.message);
  if (!data || !data.length) return errRes(res, 404, 'That picture is not held.');
  await writeAudit(sb, 'picture_release', 'vendor', data[0].vendor_id, { picture_id: id, table });
  return okRes(res, { id, safety_state: PR.SAFETY.PASSED });
}));

// POST /reports/:reportId/handled — the admin closes a report: hide the picture from Discover, or no change.
router.post('/reports/:reportId/handled', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const id = String(req.params.reportId);
  const outcome = String((req.body || {}).outcome || '');
  if (!UUID.test(id)) return errRes(res, 404, 'That report was not found.');
  if (!['hidden_from_discover', 'no_change'].includes(outcome)) return errRes(res, 400, 'Choose hide from Discover, or no change.');
  const { data, error } = await sb.from('picture_reports').update({ handled_at: nowIso(), handled_by: 'admin', outcome })
    .eq('id', id).is('handled_at', null).select('id, picture_id, vendor_id');
  if (error) return errRes(res, 500, error.message);
  if (!data || !data.length) return errRes(res, 404, 'That report was not found.');
  if (outcome === 'hidden_from_discover') {
    await sb.from('vendor_portfolio').update({ discover_hidden_at: nowIso(), discover_hidden_by: 'admin: report' })
      .eq('id', data[0].picture_id).is('discover_hidden_at', null);
  }
  await writeAudit(sb, 'picture_report_handled', 'vendor', data[0].vendor_id, { report_id: id, picture_id: data[0].picture_id, outcome });
  return okRes(res, { id, outcome });
}));

// POST /:imageId/legal-removal — by hand, for a legal reason only: deleted, logged with the reason, the vendor told.
router.post('/:imageId/legal-removal', requireAdmin, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const id = String(req.params.imageId);
  const reason = String((req.body || {}).reason || '').trim();
  if (!UUID.test(id)) return errRes(res, 404, NOT_FOUND);
  if (reason.length < 3 || reason.length > 300) return errRes(res, 400, 'Write the legal reason, in 3 to 300 characters.');
  const look = isLook(req);
  const table = look ? 'vendor_look_photos' : 'vendor_portfolio';
  const { data: pic } = await sb.from(table).select('id, vendor_id, image_url').eq('id', id).maybeSingle();
  if (!pic) return errRes(res, 404, NOT_FOUND);
  // the log first: a removal that is not recorded must not happen
  const logged = await writeAudit(sb, 'picture_legal_removal', 'vendor', pic.vendor_id, { picture_id: id, table, reason, image_url: pic.image_url });
  if (!logged.written) return errRes(res, 503, 'The removal could not be recorded, so nothing was removed. Please try again.');
  if (look) {
    const { error } = await sb.from('vendor_look_photos').update({ deleted_at: nowIso(), updated_at: nowIso() }).eq('id', id);
    if (error) return errRes(res, 500, error.message);
  } else {
    const { error } = await sb.from('vendor_portfolio').delete().eq('id', id);
    if (error) return errRes(res, 500, error.message);
    await deleteFromCloudinary(pic.image_url);
    const cur = await currentOrder(sb, pic.vendor_id);
    if (cur.ok && cur.ids.length > 0) await writeOrder(sb, pic.vendor_id, cur.ids);
  }
  await sb.from('picture_notices').insert({ vendor_id: pic.vendor_id, line: PR.LINES.legalRemoval(reason) });
  return okRes(res, { id, removed: true });
}));

module.exports = router;
