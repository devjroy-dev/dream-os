'use strict';
// src/api/vendor/solutions/whatsappEliza.js · CE-47 · ELZ-4 · THE PER-VENDOR ELIZA SWITCH FOR WHATSAPP (0212), mounted at
// /api/v2/vendor/solutions/whatsapp-eliza by ./index.js beside /instagram (the room "WhatsApp and Instagram"). The logic is
// src/lib/vendor/waEliza.js; this file wires it, as ./instagram.js wires igRoom.js. Not dark by a Meta gate: WhatsApp needs no Meta approval.
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const waEliza = require('../../../lib/vendor/waEliza');
const { readLaneFlag } = require('../../../lib/laneFlags');

function deps(req) {
  const supabase = req.app.locals.supabase;
  return { supabase, now: () => new Date().toISOString(), master: () => readLaneFlag(supabase, 'couple.eliza_enabled') };
}
const send = (res, r) => (r.status === 200 ? res.status(200).json(r.body) : res.status(r.status).json({ ok: false }));

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => send(res, await waEliza.answer(req.vendor.id, deps(req)))));
router.post('/switch', requireAuth, resolveVendor(), asyncHandler(async (req, res) =>
  send(res, await waEliza.flip(req.vendor.id, req.body && req.body.on, deps(req)))));

module.exports = router;
