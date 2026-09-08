// src/api/couple/assistance.js — BLOCK 20 · CONCIERGE · THE BRIDE'S DOOR.
// POST /api/v2/couple/assistance
//
// Mounted at src/api/couple/core.js under `requireCoupleAuth` (core.js:13), so
// `req.coupleUser = { id, user_id, couple_id }` is present (requireCoupleAuth.js:61).
// The door reads her phone from `users` (E.164, pin-status.js:108) and hands the
// writer the session's couple_id + phone (R-41.29); it does NOT trust a phone
// in the body. Everything else on the sheet is hers, verbatim, to the writer.
//
// This door writes nothing itself. `createAssistanceRequest` is the one home
// (src/lib/couple/assistance.js). The old `POST /concierge/request` now 308s here
// (R-41.19) until A3 folds its caller.
//
// Body: { city?, area?, wedding_date?, brief?, items: [{ category, budget_rs }] }
// GET  → { ok, request|null, items:[{id, category, budget_rs, found:[{business_name, routing_handle}], outsiders_asked}] }
// POST 200: { ok:true, request_id, items:[{id, category, budget_rs}], message }
// 400: { ok:false, code, error }

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { createAssistanceRequest, getLatestAssistanceForCouple, REFUSE } = require('../../lib/couple/assistance');

// The couple's one sentence after Send — #22 on the veto sheet, KEPT by the
// founder 2026-09-08. The PWA renders its own frame (S2-sent); this string is
// the API's, for a caller with no frame.
const SENT_MESSAGE = 'Sent. We\u2019re on it.';

// F-41.29 · GET /api/v2/couple/assistance — her latest request, read from the one
// home. `request: null` when she has none; the sheet then mounts empty (S1). She
// never sees a queue: TDW vendors found are named, outsiders are a count.
router.get('/', asyncHandler(async (req, res) => {
  const out = await getLatestAssistanceForCouple(req.app.locals.supabase, req.coupleUser.couple_id);
  return res.json(out);
}));

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id, user_id } = req.coupleUser;
  const body = req.body || {};

  // Her phone from the session, never the body. users: id :1069 · phone :1070 · name :1071.
  const { data: user } = await supabase
    .from('users')
    .select('id, phone, name')
    .eq('id', user_id)
    .maybeSingle();
  if (!user || !user.phone) {
    return res.status(400).json({ ok: false, code: REFUSE.NO_PHONE, error: 'Your account has no phone number on file.' });
  }

  // Pre-fill from her profile only where the sheet left it blank (R-41.25:
  // nothing writes BACK to couples; the request holds its own copy).
  let city = body.city, wedding_date = body.wedding_date;
  if (!city || !wedding_date) {
    const { data: couple } = await supabase
      .from('couples')
      .select('id, wedding_date, wedding_city')
      .eq('id', couple_id)
      .maybeSingle();
    if (couple) {
      if (!city) city = couple.wedding_city || null;
      if (!wedding_date) wedding_date = couple.wedding_date || null;
    }
  }

  const out = await createAssistanceRequest(supabase, {
    couple_id,
    phone:        user.phone,
    name:         user.name || null,
    city,
    area:         body.area,
    wedding_date,
    brief:        body.brief,
    origin:       'bride',
    items:        body.items,
  });

  if (!out.ok) {
    const status = out.code && out.code.startsWith('insert') || out.code === 'items_failed' ? 500 : 400;
    return res.status(status).json({ ok: false, code: out.code, error: out.error });
  }
  return res.json({
    ok: true,
    request_id: out.request.id,
    items: (out.items || []).map(i => ({ id: i.id, category: i.category, budget_rs: i.budget_rs })),
    message: SENT_MESSAGE,
    // Operator-truth, as the folded door carried it (F-05.48): never read by a couple-facing string.
    admin_notified: !!(out.notify && out.notify.sent),
    admin_notify_refusal: out.notify && !out.notify.sent ? out.notify.refusal : null,
  });
}));

// ── THE PUBLIC LINK · RESERVED FOR SITTING 2 (seat D) — conditional-withheld ─
// A caller who never had the app fills the sheet from a link, lands as a couple,
// and her request is on file (roadmap §2 row D). Not this sitting's: the door
// below is fully commented. UNCOMMENT STEP, when seat D is chartered: remove the
// `/*` and `*/`, mount this file's `publicRouter` in src/api/router.js OUTSIDE
// `requireCoupleAuth` (it cannot live under core.js's mount), and write the
// couple-materialisation the writer does not yet do (`origin:'public'` is already
// accepted by the writer and the 0148 CHECK).
/*
const publicRouter = express.Router();
publicRouter.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body = req.body || {};
  const out = await createAssistanceRequest(supabase, {
    couple_id:    null,
    phone:        body.phone,
    name:         body.name,
    city:         body.city,
    area:         body.area,
    wedding_date: body.wedding_date,
    brief:        body.brief,
    origin:       'public',
    items:        body.items,
  });
  if (!out.ok) return res.status(400).json({ ok: false, code: out.code, error: out.error });
  return res.json({ ok: true, request_id: out.request.id, message: SENT_MESSAGE });
}));
module.exports.publicRouter = publicRouter;
*/

module.exports = router;
