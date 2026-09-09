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

// ── THE ONE FILING PATH, TWO DOORS · R-41.94 (D5) ───────────────────────────
// The bride lane and the public link differ in EXACTLY ONE FACT — which door she
// came through — so they are one function and two three-line routes, not two
// handlers. A second copy of the session read, the profile coalesce and the
// response shape would be a second home for all three, and the day one of them is
// corrected the other keeps the defect (one-home law).
//
// ⚠ `origin` IS THIS FILE'S ARGUMENT, NEVER THE CALLER'S. The chair ruled (ii) at
// D5's read-first, and the reason survives the refactor: `origin` is a provenance
// fact and a body field would let any signed-in bride label her request `public`.
// The value is chosen HERE, by which route was matched, and the shared body type
// in the pwa (`AssistRequestBody`) gained no field.
//
// BOTH DOORS SIT UNDER `requireCoupleAuth` (core.js:13). The public caller is not
// anonymous by the time she reaches this: /plan puts the bride-line OTP BEFORE the
// POST, so she arrives holding a session and her couple_id comes from it, not from
// a phone in the body. See F-42.55 at the foot of this file for the door that was
// reserved here for the opposite architecture and is deleted with it.
async function fileAssistanceRequest(req, res, origin) {
  const supabase = req.app.locals.supabase;
  const { couple_id, user_id } = req.coupleUser;
  const body = req.body || {};

  // Her phone from the session, never the body. `users` at docs/db/PUBLIC_SCHEMA.md
  // :1232-1244 (id :1235 · phone :1236 · name :1237) — RE-DERIVED at 09317d6, F-42.59:
  // the line numbers this comment used to carry pointed into `referral_alerts` after
  // the 0154 regen. Paths and column names survive a regen; line numbers do not.
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
    origin,
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
}

// POST /api/v2/couple/assistance          — the bride lane's sheet.
router.post('/', asyncHandler(async (req, res) => fileAssistanceRequest(req, res, 'bride')));

// POST /api/v2/couple/assistance/public   — the same sheet, reached from /plan by a
// caller who had never opened the app. `origin:'public'` was admitted by the writer
// (:221) and the 0148 CHECK long before this door existed; s1 reserved the word and
// s2 spends it. Express matches exact paths, so this cannot shadow `/` above.
router.post('/public', asyncHandler(async (req, res) => fileAssistanceRequest(req, res, 'public')));

// ── F-42.55 · THE RESERVED DOOR IS DELETED, NOT UNCOMMENTED ─────────────────
// A2 left a fully-written second router here under the conditional-withheld rule,
// with its release step stated: mount OUTSIDE `requireCoupleAuth`, take `phone`
// from the BODY with `couple_id: null`, and write the couple-materialisation the
// writer did not yet do. Its own words are not requoted — a cell asserts their
// absence from this file, and a quotation would defeat the cell.
//
// Its condition arrived — D4 gave the writer `ensureCoupleRow` — and the ruling
// went the OTHER WAY, which is why this is a deletion and not an uncomment. That
// door had no session: anyone could POST a request against anyone's ten digits, and
// the writer would have attached it to that stranger's couple row or created one.
// R-41.94's OTP is not a courtesy on the way to the sheet; it is the only thing
// standing between a public URL and an open spam door. Ruling (ii), D5.
//
// Deleted rather than left commented because a withheld block whose condition has
// been decided is no longer withheld — it is dead ink that reads as a plan, and the
// next seat to open this file would have taken it for one.

module.exports = router;
