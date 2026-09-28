// src/api/vendor/solutions/site.js — TDW · CE-46 · WEB-1 cut 4 · HER SITE'S LOOK, THE ROOM'S DOORS.
//
//   GET  /site        → { look, looks_open, trade_look, looks }   what the Your look screen draws
//   POST /site/look   { look }  → the same shape, after the save
//
// The TIER decides (siteModel, R-46.9 as ruled 28 September): Basic sees her trade's look and the other two
// locked (looks_open false); a POST from Basic is refused with 403 and writes nothing. Essential and up choose
// one of the three. The tier is read from her own row (resolveVendor loads it) and never leaves this room's
// answer except as looks_open, which is hers to see. vendor_sites is written only here and by cut 5b's doors.
'use strict';

const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');
const siteModel = require('../../../lib/site/siteModel');

async function siteRowOf(supabase, vendorId) {
  try {
    const { data, error } = await supabase.from('vendor_sites').select('look, pages, credit_shown').eq('vendor_id', vendorId).maybeSingle();
    return error ? null : data;
  } catch { return null; }
}
function shape(vendor, row) {
  return {
    look: siteModel.lookFor(vendor.tier, vendor.category, row),
    looks_open: siteModel.looksOpen(vendor.tier),
    trade_look: siteModel.tradeLook(vendor.category),
    looks: [...siteModel.LOOKS],
  };
}

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const row = await siteRowOf(req.app.locals.supabase, req.vendor.id);
  return okRes(res, { site: shape(req.vendor, row) });
}));

router.post('/look', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const look = String((req.body && req.body.look) || '').trim();
  if (!siteModel.LOOKS.includes(look)) return errRes(res, 400, 'Pick one of the three looks.');
  if (!siteModel.looksOpen(req.vendor.tier)) return errRes(res, 403, 'More looks are on Essential.');
  const supabase = req.app.locals.supabase;
  const { error } = await supabase.from('vendor_sites').upsert({ vendor_id: req.vendor.id, look, updated_at: new Date().toISOString() }, { onConflict: 'vendor_id' });
  if (error) return errRes(res, 503, 'Your look could not be saved yet.');
  const row = await siteRowOf(supabase, req.vendor.id);
  return okRes(res, { site: shape(req.vendor, row) });
}));

module.exports = router;
module.exports.shape = shape;
