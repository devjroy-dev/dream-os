// src/api/vendor/studio/weddings.js
// BLOCK 19 · G1.1 · WEDDING PAGES — the studio doors.
// Mounted at /api/v2/vendor/studio/weddings by studio/index.js.
//
//   GET  /                        — the room's list
//   GET  /:id                     — one page, with its roll and its photos
//   POST /                        — create from an event (R-G11.21)
//   POST /:id/credits             — add a credit
//   POST /:id/publish             — publish (R-G11.20: delivered_at lands here)
//   POST /:id/upload-url          — signed Cloudinary params (R-G11.17)
//   POST /:id/photos              — record an uploaded photo
//
// No tier gate: R-39.7 opened the Studio Suite to every tier.
//
// ⚠ NO SQL LIVES IN THIS FILE. `src/lib/vendor/weddings.js` is the sole writer
// for all three tables; these handlers carry auth, validation and shape only.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler  = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');
const { signUpload, uploadUrl, nowTimestamp } = require('../../../lib/cloudinarySign');
const { claimUrl, sendCreditInvite } = require('../../../lib/vendor/creditInvite');
const W = require('../../../lib/vendor/weddings');
const crypto = require('crypto');

const mw = [requireAuth, resolveVendor()];

// GET / — the room's list
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const rows = await W.listForOwner(req.app.locals.supabase, req.vendor.id);
  return okRes(res, { weddings: rows });
}));

// GET /:id — one page with its roll and photos
router.get('/:id', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const wedding  = await W.getForOwner(supabase, req.vendor.id, req.params.id);
  if (!wedding) return errRes(res, 404, 'Not found.');
  const [credits, photos] = await Promise.all([
    W.creditsFor(supabase, wedding.id),
    W.photosFor(supabase, wedding.id),
  ]);
  // The owner's own view DOES carry phone and claim_token: she typed the number
  // and she is the one who pastes the claim link while the send is dark. This is
  // the authenticated owner-scoped door; R-G11.6 governs the PUBLIC wire, and
  // that shape is built by `publicRoll` in the lib, not here.
  return okRes(res, {
    wedding,
    credits: credits.map((c) => ({ ...c, claim_url: claimUrl(c.claim_token) })),
    photos,
  });
}));

// POST / — create
//
// ⚠ THE COLUMN IS NULLABLE AND THIS DOOR IS NOT (R-G11.21). `weddings.event_id`
// allows NULL because a photographer's first pages are her back catalogue with
// no calendar row behind them — but the ratified create sheet has "Which event"
// and no date/venue-entry path, so a no-event create has no strings and no mock.
// It is chartered to G1.2. The schema is ready; the door is not open yet, and
// that difference is deliberate rather than an oversight.
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body     = req.body || {};
  const eventId  = String(body.event_id || '').trim();
  const title    = String(body.title || '').trim();

  if (!eventId) return errRes(res, 400, 'An event is required.');
  if (!title)   return errRes(res, 400, 'A title is required.');

  // ── F-40.33 · THE PICKER FILTERS `deleted_at IS NULL`, AND SO DOES THIS ─────
  // Derived from the fixture, not imagined: DEV440's `Blocked` event
  // (ca7541c9, deleted_at 2026-08-28) STILL READS state='upcoming'. A check
  // keyed on state alone would accept a deleted day. The ownership check and
  // the liveness check are one query so neither can be forgotten separately.
  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, vendor_id, event_date, deleted_at')
    .eq('id', eventId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (evErr) return errRes(res, 500, evErr.message);
  if (!ev)   return errRes(res, 404, 'Not found.');

  const wedding = await W.createWedding(supabase, {
    ownerVendorId: req.vendor.id,
    eventId:       ev.id,
    title,
    venue: String(body.venue || '').trim() || null,
    city:  String(body.city  || '').trim() || null,
  });
  return okRes(res, { wedding });
}));

// POST /:id/credits — add a credit
router.post('/:id/credits', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body     = req.body || {};
  const role     = String(body.role || '').trim();

  const wedding = await W.getForOwner(supabase, req.vendor.id, req.params.id);
  if (!wedding) return errRes(res, 404, 'Not found.');

  // The role comes from the fixed ten and never from free text — the ratified
  // credits sheet draws a picker, not an input. The CHECK in 0131 would refuse
  // an unknown role anyway; this returns a legible 400 instead of a 500.
  if (!W.ROLE_KEYS.includes(role)) return errRes(res, 400, 'Unknown role.');

  const phone  = String(body.phone  || '').trim() || null;
  const name   = String(body.name   || '').trim() || null;
  const handle = String(body.handle || '').trim();
  if (!phone && !handle) return errRes(res, 400, 'A handle or a number is required.');

  // A handle resolves to a vendor if one exists; if it does not, the credit is
  // still made and still claimable — the whole loop is that the credited person
  // is usually NOT on the platform yet.
  let vendorId = null;
  if (handle) {
    const { data: v, error: vErr } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('routing_handle', handle.toUpperCase())
      .maybeSingle();
    if (vErr) return errRes(res, 500, vErr.message);
    if (v) vendorId = v.id;
  }
  if (!vendorId && !phone) return errRes(res, 400, 'That handle is not on file; add a number instead.');

  const credit = await W.addCredit(supabase, {
    weddingId: wedding.id, role, vendorId, phone, name,
  });

  // ── BUILT DARK. The invite is attempted and REPORTED, never claimed. ────────
  // `sendCreditInvite` refuses while either gate is shut and says which. The
  // response carries `invite` so the room can tell the vendor the truth rather
  // than implying a message went out — the never-a-false-done law.
  let invite = { sent: false, skipped: true, reason: 'no number on this credit' };
  if (phone) {
    invite = await sendCreditInvite({
      to: phone,
      owner:   req.vendor.business_name || '',
      role:    W.ROLE_LABEL[role],
      wedding: wedding.title,
      token:   credit.claim_token,
    });
  }

  return okRes(res, {
    credit: { ...credit, claim_url: claimUrl(credit.claim_token) },
    invite,
  });
}));

// POST /:id/publish
router.post('/:id/publish', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const wedding  = await W.getForOwner(supabase, req.vendor.id, req.params.id);
  if (!wedding) return errRes(res, 404, 'Not found.');

  const updated = await W.publishWedding(supabase, {
    ownerVendorId: req.vendor.id, weddingId: wedding.id,
  });
  if (!updated) return errRes(res, 500, 'Could not publish this page.');

  // ⚠ `couple_consent` IS NOT TOUCHED HERE (R-G11.10) and the response says so
  // plainly. A page published without consent is live in the vendor's room and
  // NOT on the public wire, and she is told which — the room draws
  // "Waiting on the couple's permission." off exactly this field. Reporting
  // `published: true` alone would be a false done.
  return okRes(res, { wedding: updated, live: updated.couple_consent === true });
}));

// POST /:id/upload-url — signed params for a direct browser upload (R-G11.17)
router.post('/:id/upload-url', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const wedding  = await W.getForOwner(supabase, req.vendor.id, req.params.id);
  if (!wedding) return errRes(res, 404, 'Not found.');

  const filename = String((req.body || {}).filename || 'photo').replace(/[^a-zA-Z0-9._-]/g, '-');
  const publicId = `${filename.replace(/\.[^.]+$/, '')}-${crypto.randomBytes(4).toString('hex')}`;
  // THE WEDDING PLANE'S OWN FOLDER. `weddings/<vendor>/<wedding>` — never
  // `vendor_portfolio/`, because these are a couple's own photographs and not
  // marketing behind an admin gate (R-40.12 / FORK B (c)). The folder is this
  // caller's policy; the signing is the one home's (R-G11.22).
  const folder = `weddings/${req.vendor.id}/${wedding.id}`;

  try {
    return okRes(res, {
      upload_url: uploadUrl(),
      params: signUpload({ folder, publicId, timestamp: nowTimestamp() }),
    });
  } catch (e) {
    return errRes(res, 500, e.message);
  }
}));

// POST /:id/photos — record what the browser uploaded
router.post('/:id/photos', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body     = req.body || {};
  const wedding  = await W.getForOwner(supabase, req.vendor.id, req.params.id);
  if (!wedding) return errRes(res, 404, 'Not found.');

  const url      = String(body.url || '').trim();
  const publicId = String(body.public_id || '').trim();
  if (!url || !publicId) return errRes(res, 400, 'A url and a public_id are required.');

  // ── NEVER-HOTLINK, ASSERTED AT THE WRITE PATH ──────────────────────────────
  // `mirrorOne` refuses a non-estate URL outright rather than persisting one
  // (igImport.js's own assertion, and the reasoning holds identically here): a
  // row pointing at someone else's CDN is rot, and half-importing is better
  // than persisting it. The browser posts back whatever Cloudinary returned, so
  // this door checks rather than trusts.
  if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) {
    return errRes(res, 400, 'That is not an estate asset URL.');
  }

  const photo = await W.addPhoto(supabase, {
    weddingId: wedding.id,
    url,
    publicId,
    position: Number(body.position),
  });
  return okRes(res, { photo });
}));

module.exports = router;
