'use strict';
// src/lib/ownNumber/route.js · CE-46 · G6-2 · 2b · THE NEW VENDOR-SERVICE ROUTE THE RECEIVER FORWARDS HER CHANGES TO (F6 (a)).
// Mounted in src/index.js at POST /internal/own-number/inbound, NEVER at /webhook/meta: that route reads inbound as the
// shared vendor lane, where workingDoor decides "is this the vendor talking to TDW" by the sender's phone.
// Trust: ONLY the ingress's forward, carrying x-internal-replay (webhookCore.isInternalReplay, withheld while
// INTERNAL_REPLAY_SECRET is unset). There is no Meta-signature path here: the receiver verified Meta's signature once
// for the whole body before forwarding (src/marketingIndex.js). Anything else is 403.
// Body: { vendor_id, change } where change is Meta's single WhatsApp change for her number, as the receiver holds it.
// Answers 200 at once and then runs the caller, which never throws.
const webhookCore = require('../webhookCore');

function ownInboundRoute({ supabase, anthropic, env = process.env, handle = require('./turn').handleOwnInbound, isInternal = webhookCore.isInternalReplay }) {
  return async (req, res) => {
    if (!isInternal(req)) { console.warn('[own-number:route] refused: not the ingress'); return res.status(403).send('Forbidden'); }
    const b = req.body || {};
    const vendorId = typeof b.vendor_id === 'string' && b.vendor_id ? b.vendor_id : null;
    if (!vendorId || !b.change || typeof b.change !== 'object') return res.status(400).send('Bad Request');
    res.status(200).send('ok');
    const r = await handle({ supabase, anthropic, vendorId, change: b.change, env });
    console.log(`[own-number:route] ${vendorId} ${r && r.outcome}`);
  };
}

module.exports = { ownInboundRoute, ROUTE: '/internal/own-number/inbound' };
