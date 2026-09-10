// src/api/vendor/posts.js — THE "POSTS & ADS" ROOM'S DOORS (R6 rung 1).
// CE-42 seat R6, packet 4b-1. Mounted at /api/v2/vendor/posts (core.js).
//
//   GET /cards       — the three cards and the caption from her last gallery.
//   GET /broadcast   — 4b-2: her past couples (count, names or last four), the
//                      fee upper bound in paise, both bodies, both gates, and the
//                      referral's next date if this IST year's is spent.
//   POST /broadcast  — 4b-2: { kind: 'couple' | 'referral' } — the send.
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
const bc = require('../../lib/vendor/broadcasts');
const sunday = require('../../lib/vendor/sundayBrief');   // CE-42 4b-3b · G4.1

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

// ── 4b-2 · THE BROADCAST DOORS ─────────────────────────────────────────────────
// The door decides nothing: every refusal is the arm's, forwarded as a CODE. The
// screen maps each code to its vetoed byte — and `dark` in particular to "Not
// switched on yet.", never `cap.reason()`'s sentence (F-42.193: a switchboard key
// never reaches vendor glass; the admin card keeps it).
const SEND_STATUS = Object.freeze({
  bad_kind: 400, dark: 503, no_address: 409, already_this_year: 409, no_couples: 409, fee_unavailable: 500,
});

router.get('/broadcast', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const out = await bc.preview(req.app.locals.supabase, req.vendor);
  return okRes(res, out);
}));

router.post('/broadcast', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const kind = String((req.body && req.body.kind) || '');
  const out = await bc.sendBroadcast(req.app.locals.supabase, { vendor: req.vendor, kind });
  if (!out.ok) {
    const msg = out.code === 'no_address' ? postCards.COPY.NO_ADDRESS : out.code;
    return errRes(res, SEND_STATUS[out.code] || 500, msg, out.code);
  }
  return okRes(res, { broadcast_id: out.broadcast_id, sent: out.sent, not_delivered: out.not_delivered, refused_stopped: out.refused_stopped });
}));

// ── 4b-3b · THE SUNDAY DOORS (G4.1) ────────────────────────────────────────────
// The door decides nothing: sundayBrief.readForDoor answers one of the shell's
// codes (lib/worklist/sunday.ts SundayState) with the accepted Brief and the
// share card's signed URL. The plane is read FIRST inside the arm — `pending`
// comes back before any row is touched. Nothing on the glass carries a key or a
// reason: `error` is COPY.surfaceUnavailable's state, the reason stays on the row.
//   GET  /sunday          the stored brief (a first read with no row generates it)
//   POST /sunday/refresh  "Check again" — generate now, throttled 10 min (ruled (b))
const shareCard = (supabase, vendor, brief) => postCards.briefCardUrl(supabase, vendor, brief);

router.get('/sunday', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const out = await sunday.readForDoor(req.app.locals.supabase, req.vendor, {}, { shareCard });
  return okRes(res, out);
}));

router.post('/sunday/refresh', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const out = await sunday.readForDoor(req.app.locals.supabase, req.vendor, { generate: true }, { shareCard });
  return okRes(res, out);
}));

module.exports = router;
