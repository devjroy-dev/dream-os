// src/api/public/siteEnquiry.js · TDW · CE-47 · WEB-4 cut 7 · THE WEBSITE PANEL'S TWO DOORS (WEB-7's contract, 1 October 2026).
//   POST /api/v2/public/site-enquiry/:code   door 1: files the enquiry, answers { ok, chat_token }   (lib/website/enquiry.js)
//   POST /api/v2/public/site-chat/:code      door 2: one chat turn, answers { ok, replies[, held] }  (lib/website/turn.js)
// No session (a public page calls them). Every miss is the card's one 404 body. The body is JSON, 4 kB at most.
'use strict';

const express = require('express');
const W = require('../../lib/website/enquiry');
const T = require('../../lib/website/turn');

const NOT_FOUND_BODY = { ok: false, error: 'Not found.' };
function notFoundBody() {
  // the card's own 404 body, byte for byte (vendorCard.notFound), read once
  try {
    let captured = null;
    require('./vendorCard').notFound({ status() { return this; }, json(b) { captured = b; return this; } });
    return captured || NOT_FOUND_BODY;
  } catch (_e) { return NOT_FOUND_BODY; }
}
const tooBig = (req) => Number(req.get('content-length') || 0) > 4096;

function deps() {
  const { ENQUIRE_BASE, enquireLinkFor } = require('../../lib/discover/shapeVendor');
  return {
    capApi: require('../../lib/capabilities'),
    ensureCoupleRow: require('../../lib/coupleIdentity').ensureCoupleRow,
    sendVendorEnquiryAlert: require('../../lib/vendor/enquiryAlert').sendVendorEnquiryAlert,
    engine: require('../../agent/noticeHead'),   // the notice head (engine.js keeps its one export)
    runTurn: require('../../agent/engine').runCoupleAgenticTurn,
    splitText: require('../../lib/ownNumber/send').splitText,
    leadsLink: require('../../lib/pwaPaths').vendorUrl('leads'),
    enquireLinkFor: (v) => enquireLinkFor({ tdwLink: ENQUIRE_BASE + String(v.routing_handle || '').toUpperCase(), enquiry_routing: v.enquiry_routing, enquiry_phone: v.enquiry_phone }),
    notFoundBody: notFoundBody(),
  };
}

const enquiry = express.Router();
enquiry.post('/:code', async (req, res) => {
  if (tooBig(req)) return res.status(400).json({ ok: false, error: W.LINES.enquiryFailed });
  const d = Object.assign(deps(), { anthropic: req.app.locals.anthropic });
  const out = await W.fileEnquiry({ sb: req.app.locals.supabase, req, code: req.params.code, body: req.body }, d);
  return res.status(out.status).json(out.body);
});

const chat = express.Router();
chat.post('/:code', async (req, res) => {
  if (tooBig(req)) return res.status(400).json({ ok: false, error: W.LINES.chatEmpty });
  const d = Object.assign(deps(), { anthropic: req.app.locals.anthropic });
  const out = await T.chatTurn({ sb: req.app.locals.supabase, req, code: req.params.code, body: req.body }, d);
  return res.status(out.status).json(out.body);
});

module.exports = { enquiry, chat, notFoundBody, deps };
