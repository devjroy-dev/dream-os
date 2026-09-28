// src/api/vendor/solutions/storefront.js
// TDW · BLOCK 19 · G3.1 sitting 2 — HER ADDRESS AS A QR, ONE CALL.
//
//   GET /api/v2/vendor/solutions/storefront/qr.png → image/png, 512px
//
// The QR encodes the page's own address, direct (R-G13.9's law for the tent
// card, applied to the storefront): her short address `<handle>.<PWA_BASE_URL host>` (CE-46 WEB-1; `/v/<handle>` for a handle outside the label shape), lowercase,
// which is what `vendorCard.js` publishes and what `app/v/[code]` canonicalises
// to. The pixels come from `weddingCardPdf.qrPng` — the estate's one QR home,
// with its ink-on-cream colours — so a vendor's tent card and her storefront QR
// scan and look the same. The door owns the URL; the PDF module owns the drawing.
//
// No phone on the wire (R-G11.6): the address is a handle, the response is an
// image, and nothing else is read from her row.

'use strict';

const express = require('express');
const router  = express.Router();

const requireAuth   = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler  = require('../../../lib/asyncHandler');
const { err: errRes } = require('../../../lib/response');
const { qrPng } = require('../../../lib/weddingCardPdf');

const PWA_BASE = process.env.PWA_BASE_URL || 'https://thedreamwedding.in';

/**
 * Exported for the bench: the one string the QR encodes.
 * CE-46 WEB-1 (the founder, 28 September): her SHORT address, <handle>.thedreamwedding.in, is the one TDW
 * gives her, printed and scanned. The shape rule is dreamos-pwa lib/public/vendorHost.ts's shortAddressFor,
 * restated here because two repos cannot import each other: letters, digits and hyphens, not starting with a
 * hyphen, at most 63, and never a reserved label. A handle outside it keeps /v/<handle>, which always works.
 */
const RESERVED_LABELS = Object.freeze(['www', 'demo', 'demodreamer', 'demodiscover', 'demobride']);
function storefrontUrl(handle) {
  const h = String(handle || '').trim().toLowerCase();
  const base = String(PWA_BASE).replace(/\/+$/, '');
  const root = base.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  if (/^[a-z0-9][a-z0-9-]{0,62}$/.test(h) && !RESERVED_LABELS.includes(h)) {
    const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(root) ? 'http' : 'https';
    return `${scheme}://${h}.${root}`;
  }
  return `${base}/v/${h}`;
}

router.get('/qr.png', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const handle = req.vendor && req.vendor.routing_handle;
  if (!handle) return errRes(res, 409, 'This account has no page address yet.', 'NO_HANDLE');
  const png = await qrPng(storefrontUrl(handle));
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="thedreamwedding-${String(handle).toLowerCase()}.png"`);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  return res.status(200).send(png);
}));

module.exports = router;
module.exports.storefrontUrl = storefrontUrl;
