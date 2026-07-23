// src/api/vendor/onboarding.js
// POST /api/v2/vendor/onboarding
//
// Web onboarding for vendors who joined via invite code (not WhatsApp).
// Captures identical fields to the WhatsApp conversational onboarding:
//   name, instagram_handle, business_name, category, city, open_to_travel, stated_rate
//
// Handle priority: IG handle → firstName+phone3 → fallbacks (mirrors WA flow).
// Sets onboarding_state = 'complete'. Returns { routing_handle, tdw_link }.
// Idempotent — safe to call again to update profile if already complete.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const { waNumberFor } = require('../../lib/waNumbers');
const VENDOR_WA = waNumberFor('vendor');   // F5 rider: one home for the pair

async function generateHandle(supabase, vendorId, user) {
  const { data: v } = await supabase
    .from('vendors').select('instagram_handle, routing_handle').eq('id', vendorId).maybeSingle();
  if (v?.routing_handle) return v.routing_handle; // already set — keep it
  const igHandle  = (v?.instagram_handle || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  const phone3    = (user?.phone || '').replace(/\D/g, '').slice(-3);
  const phone4    = (user?.phone || '').replace(/\D/g, '').slice(-4);
  const candidates = [
    igHandle,
    `${firstName}${phone3}`,
    `${firstName}${phone4}`,
    `${firstName}${phone3}${phone4}`,
    `${firstName}${Date.now().toString().slice(-6)}`,
  ].filter(Boolean);
  for (const c of candidates) {
    if (!c || c.length < 2) continue;
    const { data: existing } = await supabase
      .from('vendors').select('id').eq('routing_handle', c).maybeSingle();
    if (!existing) return c;
  }
  return `VENDOR${Date.now().toString().slice(-6)}`;
}

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const { instagram_handle, business_name, city, open_to_travel, stated_rate } = req.body || {};

  if (!city || !city.trim()) return errRes(res, 400, 'city is required.');

  // name + category are captured at signup (invite_phone -> provision). Onboarding
  // never re-collects or overwrites them; it reads the existing values.
  const { data: user } = await supabase
    .from('users').select('name, phone').eq('id', vendor.user_id).maybeSingle();
  const existingCategory = (vendor.category || '').trim();

  const cleanIg = (instagram_handle || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30) || null;

  // Write IG handle first so generateHandle can read it
  if (cleanIg) await supabase.from('vendors').update({ instagram_handle: cleanIg }).eq('id', vendor.id);

  const handle = await generateHandle(supabase, vendor.id, user || {});

  const vendorUpdate = {
    city:             city.trim(),
    open_to_travel:   open_to_travel === true || open_to_travel === 'true',
    routing_handle:   handle,
    onboarding_state: 'complete',
  };
  if (business_name && business_name.trim()) vendorUpdate.business_name = business_name.trim();
  if (cleanIg)                               vendorUpdate.instagram_handle = cleanIg;

  const { error: vendorErr } = await supabase.from('vendors').update(vendorUpdate).eq('id', vendor.id);
  if (vendorErr) return errRes(res, 500, 'Could not save profile. Please try again.');

  if (stated_rate && stated_rate.trim()) {
    const displayName = business_name?.trim() || user?.name || 'Vendor';
    await supabase.from('vendor_state').upsert({
      vendor_id:      vendor.id,
      summary:        `${displayName} — ${existingCategory || 'vendor'} based in ${city.trim()}. Typical rate: ${stated_rate.trim()}.`,
      pricing_policy: { stated_rate: stated_rate.trim() },
      recent_notes:   [],
      updated_at:     new Date().toISOString(),
    });
  }

  const tdwLink = `https://wa.me/${VENDOR_WA}?text=TDW-${handle}`;
  console.log(`[vendor:onboarding] complete vendor=${vendor.id} handle=${handle}`);
  return okRes(res, { routing_handle: handle, tdw_link: tdwLink, message: 'Profile complete.' });
}));

module.exports = router;
