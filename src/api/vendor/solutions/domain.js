// src/api/vendor/solutions/domain.js — TDW · CE-46 · WEB-1 cut 2 · HER OWN NAME, THE DOORS.
//
//   GET  /domain            → DomainStatus   her newest order, or the subdomain-only shape
//   GET  /domain/search?q=  → DomainSearchResult[]  ≤5, the sell price on each available name
//   POST /domain/order      → DomainStatus   { domain, registrant, years? } · a row in `paying` with the Razorpay link
//   POST /domain/wire       → DomainStatus   asks Vercel now for her `wiring` row (the cron asks every ten minutes anyway)
//
// Every door is behind env.gates().p2 (RESELLERCLUB_* and VERCEL_* set): closed
// answers as the stubs did (status none, an empty search, 503 on a write) so
// the room keeps its honest line. NOTHING here writes vendor_domains: the
// service is the writer. NOTHING here spends TDW's money: the buy is behind the
// webhook's PAID (index.js), never behind a vendor's tap.
'use strict';

const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');
const env = require('./env');
const contract = require('./contract');
const service = require('../../../lib/domains/service');
const siteModel = require('../../../lib/site/siteModel');

function statusShape(vendor, row) {
  return {
    status: row ? row.status : 'none',
    subdomain: contract.subdomainFor(vendor.routing_handle),
    domain: row ? row.domain : null,
    liveUrl: service.liveUrlOf(row),
    // `?? null` on every nullable: a key that is undefined leaves the JSON and fails the
    // contract's "missing"; Postgres says null, the double in b146 said undefined, and
    // the door must answer the same either way.
    registeredAt: (row && row.registered_at) ?? null,
    expiresAt: (row && row.expires_at) ?? null,
    renewalPricePaise: null,
    pricePaise: (row && row.price_paise) ?? null,
    paymentUrl: (row && row.status === 'paying' ? row.razorpay_link_url : null) ?? null,
    autoRenew: row ? Boolean(row.auto_renew) : false,
    forwardEmail: (row && row.forward_email) ?? null,
    lastError: (row && row.last_error) ?? null,
  };
}
function sendStatus(res, vendor, row) {
  const payload = statusShape(vendor, row);
  const v = contract.shape('DomainStatus', payload);
  if (!v.ok) return errRes(res, 500, 'TDW could not show this. Please try again.', 'CONTRACT_VIOLATION');
  return okRes(res, { domain: payload });
}

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  if (!env.gates().p2) return sendStatus(res, req.vendor, null);
  const row = await service.current(req.app.locals.supabase, req.vendor.id);
  return sendStatus(res, req.vendor, row);
}));

router.get('/search', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return errRes(res, 400, 'The search needs a name.');
  if (!env.gates().p2) return okRes(res, { results: [], live: false });
  const results = await service.search(q, req.app.locals.domainDeps || {});
  for (const r of results) { const v = contract.shape('DomainSearchResult', r); if (!v.ok) return errRes(res, 500, 'TDW could not show this. Please try again.', 'CONTRACT_VIOLATION'); }
  return okRes(res, { results, live: true });
}));

router.post('/order', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  // CE-47 WEB-4 cut 16 (f): her own domain opens on Signature
  if (siteModel.rank(req.vendor.tier) < 2) return errRes(res, 403, 'Your own domain is available on Signature.');
  if (!env.gates().p2) return errRes(res, 503, 'Buying your own domain through TDW is not available yet.');
  const body = req.body || {};
  const out = await service.order(req.app.locals.supabase, req.vendor, { domain: body.domain, registrant: body.registrant, years: body.years ? Number(body.years) : 1 }, req.app.locals.domainDeps || {});
  if (!out.ok) return errRes(res, 409, out.reason);
  return sendStatus(res, req.vendor, out.row);
}));

router.post('/wire', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  // CE-47 WEB-4 cut 16 (f): her own domain opens on Signature
  if (siteModel.rank(req.vendor.tier) < 2) return errRes(res, 403, 'Your own domain is available on Signature.');
  if (!env.gates().p2) return errRes(res, 503, 'Buying your own domain through TDW is not available yet.');
  await service.sweepWiring(req.app.locals.supabase, req.app.locals.domainDeps || {});
  const row = await service.current(req.app.locals.supabase, req.vendor.id);
  return sendStatus(res, req.vendor, row);
}));

module.exports = router;
module.exports.statusShape = statusShape;
