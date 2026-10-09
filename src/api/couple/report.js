// src/api/couple/report.js · TDW · CE-47 · WEB-4 cut 30 · R-47.2 (d): THE REPORT BUTTON ON DISCOVER.
// Inside an opened Discover picture, behind the three-dot menu, for SIGNED-IN Dreamers only (requireCoupleAuth, at the
// mount). One report per person per picture (UNIQUE in 0223). A report NEVER hides a picture by itself: it goes to the
// admin's queue (admin/photos.js), where the admin may hide the picture from Discover, or close the report.
//
//   POST /api/v2/discover/report  { vendor_id, image_url, reason, note? }
//     200 { ok: true, already: false }   filed
//     200 { ok: true, already: true }    she had already reported this picture; nothing new is filed
//     400 { ok: false, error }           an unknown reason, or a note over 300 characters
//     404 { ok: false, error }           no such picture on Discover
// Discover's cards carry picture addresses, not row ids, so the picture is found by vendor and exact address, and
// only among the pictures Discover shows (pictureRules.discoverFilter): a picture not on Discover cannot be reported.
// reason is one of: not_wedding_work, not_their_work, offensive, other (the founder's four lines, pictureRules).
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const PR = require('../../lib/vendor/pictureRules');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = 'That picture was not found on Discover.';

router.post('/', asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const who = req.coupleUser && req.coupleUser.user_id;
  if (!who) return errRes(res, 401, 'Please sign in to report a picture.');
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const vendorId = String(b.vendor_id || ''); const url = String(b.image_url || '');
  const reason = String(b.reason || '');
  const note = b.note === undefined || b.note === null ? null : String(b.note).trim();
  if (!Object.prototype.hasOwnProperty.call(PR.REPORT_REASONS, reason)) return errRes(res, 400, 'Choose one of the reasons.');
  if (note !== null && note.length > 300) return errRes(res, 400, 'The note can be up to 300 characters.');
  if (!UUID.test(vendorId) || !/^https:\/\//.test(url)) return errRes(res, 404, NOT_FOUND);
  const { data: pics, error } = await PR.discoverFilter(sb.from('vendor_portfolio').select('id, vendor_id')
    .eq('vendor_id', vendorId).eq('image_url', url)).limit(1);
  if (error) return errRes(res, 503, 'Your report could not be sent. Please try again.');
  if (!pics || !pics.length) return errRes(res, 404, NOT_FOUND);
  const { data: had } = await sb.from('picture_reports').select('id').eq('picture_id', pics[0].id).eq('reporter_user_id', who).limit(1);
  if (had && had.length) return okRes(res, { already: true });
  const { error: insErr } = await sb.from('picture_reports').insert({ picture_id: pics[0].id, vendor_id: pics[0].vendor_id,
    reporter_user_id: who, reason, note: note || null });
  // a second report racing the first: the UNIQUE index refuses it, and she has reported this picture
  if (insErr && /duplicate|unique/i.test(String(insErr.message || ''))) return okRes(res, { already: true });
  if (insErr) return errRes(res, 503, 'Your report could not be sent. Please try again.');
  return okRes(res, { already: false });
}));

module.exports = router;
