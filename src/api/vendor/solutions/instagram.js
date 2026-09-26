'use strict';
// src/api/vendor/solutions/instagram.js · CE-45 · IGD-1 · CUT 2a-ii · the room's Instagram door and its switch, mounted at
// /api/v2/vendor/solutions/instagram by ./index.js beside /number. The logic is src/lib/instagram/igRoom.js; this file wires it:
// her token by igConnection.tokenForCall (never read here), the authorize address by the connect's "messages" flavour (armed on her
// row, as ig.js does), and the subscription by igMeta. A 404 is the lane closed (dark); the pwa draws nothing.
const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const igRoom = require('../../../lib/instagram/igRoom');
const igMeta = require('../../../lib/instagram/igMeta');
const igOAuth = require('../../../lib/vendor/igOAuth');
const igConn = require('../../../lib/vendor/igConnection');

function deps(req) {
  const supabase = req.app.locals.supabase;
  const token = async (vendorId) => { const t = await igConn.tokenForCall(supabase, vendorId); return t && t.ok ? t.accessToken : null; };
  return {
    supabase, env: process.env, now: () => new Date().toISOString(),
    tokenOk: async (vendorId) => !!(await token(vendorId)),
    mintAuthorize: async (vendorId) => {
      const { state, nonce } = igOAuth.mintState(vendorId, { flavour: igOAuth.FLAVOURS.messages });
      const armed = await igConn.armState(supabase, vendorId, nonce);
      return armed && armed.ok ? igOAuth.authorizeUrl(state, { flavour: igOAuth.FLAVOURS.messages }) : null;
    },
    subscribe: async (vendorId, on) => igMeta.setSubscribed({ fetchImpl: fetch, token: await token(vendorId), on }),
  };
}
const send = (res, r) => (r.status === 200 ? res.status(200).json(r.body) : res.status(r.status).json({ ok: false }));

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => send(res, await igRoom.answer(req.vendor.id, deps(req)))));
router.post('/switch', requireAuth, resolveVendor(), asyncHandler(async (req, res) =>
  send(res, await igRoom.flip(req.vendor.id, req.body && req.body.on, deps(req)))));

module.exports = router;
