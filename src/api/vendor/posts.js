// src/api/vendor/posts.js — THE "POSTS & ADS" ROOM'S DOORS (R6 rung 1).
// CE-42 seat R6, packet 4b-1. Mounted at /api/v2/vendor/posts (core.js).
//
//   GET /cards — the three cards and the caption from her last gallery.
//
// THE DOOR DECIDES NOTHING (the Introductions doors' shape, 4a packet 3a). Every
// refusal is the arm's (src/lib/vendor/postCards.js), forwarded with its code:
//   404 no_gallery     — no wedding page carries a photo
//   409 not_live       — the newest page with photos is not published + consented
//   409 no_address     — she has no routing handle yet
//   500 not_configured — the server holds no Cloudinary keys (the estate's fault)
// The screen renders `body.error` for the first three and its own generic
// `surfaceUnavailable` for a 5xx.
//
// 4b-2 (broadcast) and 4b-3 (the Sunday brief) add their doors to this file.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
// `err(res, status, message, code)` — the code is a STRING (src/lib/response.js).
const { ok: okRes, err: errRes } = require('../../lib/response');
const postCards = require('../../lib/vendor/postCards');

const STATUS_FOR = Object.freeze({
  no_gallery: 404,
  not_live: 409,
  no_address: 409,
  not_configured: 500,
});

router.get('/cards', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor = req.vendor;
  const out = await postCards.buildCards(supabase, vendor);
  if (!out.ok) {
    if (out.code === 'not_configured') console.error(`[posts:cards] vendor=${vendor.id} — CLOUDINARY_* env absent; no card can be signed`);
    return errRes(res, STATUS_FOR[out.code] || 500, out.error, out.code);
  }
  return okRes(res, { page: out.page, caption: out.caption, cards: out.cards });
}));

module.exports = router;
