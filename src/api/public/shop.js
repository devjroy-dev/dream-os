'use strict';
// src/api/public/shop.js · CE-47 · OFF-A1 · the shop as her website and storefront read it, mounted at /api/v2/public/shop.
//   GET  /:code           her shown items, with seats left (404 while flag.off_shop is shut for her, or she has none shown)
//   POST /:code/order     someone buys or asks: { slug, name, phone_e164, qty?, wanted_date? }; answers { order_id, pay_url }
// The same origin rule, per-vendor breaker and handle lookup as the website's enquiry door (src/lib/website/enquiry.js),
// imported, not copied. A buyer's phone may place 3 orders a day per vendor.
const express = require('express');
const router = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const W = require('../../lib/website/enquiry');
const S = require('../../lib/shop/shop');
const { shopOpen } = require('../../lib/shop/gate');

const NOT_FOUND = { ok: false, error: 'Not found.' };
const DAY = 24 * 3600 * 1000;

async function alertFor(sb, vendor, text) {
  const { data: vu } = await sb.from('users').select('name, phone').eq('id', vendor.user_id).maybeSingle();
  if (!vu || !vu.phone) return;
  const { sendVendorEnquiryAlert } = require('../../lib/vendor/enquiryAlert');
  await sendVendorEnquiryAlert({ toPhone: vu.phone, text, vendorName: vu.name, brideName: 'Shop order', brideMessage: text,
    link: require('../../lib/pwaPaths').vendorUrl('shop'), supabase: sb, vendorId: vendor.id, ctx: 'shop:order', channel: 'website' });
}

router.get('/:code', asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  let vendor = null; try { vendor = await W.vendorFor(sb, req.params.code); } catch (_e) { return res.status(503).json({ ok: false }); }
  if (!vendor || !(await shopOpen(vendor.id))) return res.status(404).json(NOT_FOUND);
  try {
    const items = await S.publicItems(sb, vendor.id, Date.now());
    if (!items.length) return res.status(404).json(NOT_FOUND);
    res.set('Cache-Control', 'public, max-age=30');
    return res.status(200).json({ ok: true, items });
  } catch (e) { console.error(`[shop] ${vendor.id} public read failed: ${e && e.message}`); return res.status(503).json({ ok: false }); }
}));

router.post('/:code/order', express.json({ limit: '4kb' }), asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  let vendor = null; try { vendor = await W.vendorFor(sb, req.params.code); } catch (_e) { return res.status(503).json({ ok: false, error: S.LINES.failed }); }
  if (!vendor || !(await W.originAllowed(sb, vendor, req.get('origin'))) || !(await shopOpen(vendor.id))) return res.status(404).json(NOT_FOUND);
  const phone = req.body && typeof req.body.phone_e164 === 'string' ? req.body.phone_e164 : '';
  if (!W.limiter.hit(`shop:vp:${vendor.id}:${W.sha(phone)}`, 3, DAY) || !W.vendorBreaker(vendor.id)) return res.status(429).json({ ok: false, error: W.LINES.tooMany });
  const r = await S.placeOrder(sb, vendor, req.body, { alert: ({ text }) => alertFor(sb, vendor, text) });
  return res.status(r.status).json(r.body);
}));

module.exports = router;
