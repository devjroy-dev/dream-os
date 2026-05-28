// src/api/couple/enquire.js
// POST /api/v2/discover/enquire
// Silent WhatsApp enquiry — fires WA message to vendor, bride stays in-app.
// No auth required (discover is public; bride may not be logged in).
//
// Body: { vendor_id, bride_name?, bride_phone? }
// Returns: { ok: true, sent: true } or { ok: false, error }

'use strict';

const express       = require('express');
const router        = express.Router();
const asyncHandler  = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id, bride_name, bride_phone } = req.body || {};

  if (!vendor_id) {
    return res.status(400).json({ ok: false, error: 'vendor_id required' });
  }

  // Look up vendor + their user phone
  const { data: vendor, error: vErr } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle, user_id, category, city')
    .eq('id', vendor_id)
    .eq('discover_eligible', true)
    .maybeSingle();

  if (vErr || !vendor) {
    return res.status(404).json({ ok: false, error: 'Vendor not found.' });
  }

  // Get vendor's WhatsApp phone via users table
  const { data: user, error: uErr } = await supabase
    .from('users')
    .select('phone')
    .eq('id', vendor.user_id)
    .maybeSingle();

  if (uErr || !user?.phone) {
    return res.status(422).json({ ok: false, error: 'Vendor phone not available.' });
  }

  // Compose enquiry message
  const brideLine = bride_name ? `Bride: ${bride_name}` : 'A bride on The Dream Wedding';
  const phoneLine = bride_phone ? `\nBride contact: ${bride_phone}` : '';
  const body = `✦ New enquiry from The Dream Wedding\n\n${brideLine} is interested in your work.${phoneLine}\n\nShe found you on the Discover feed. Reply on WhatsApp to connect.\n\n— TDW`;

  try {
    await sendWhatsApp(user.phone, body);
  } catch (err) {
    console.error('[enquire] sendWhatsApp error:', err.message);
    // Still return ok — log failure silently, don't ruin bride's experience
    return res.json({ ok: true, sent: false, warn: 'message_delayed' });
  }

  // Log the tap
  await supabase.from('enquiry_taps').insert({
    handle:    vendor.routing_handle || vendor_id,
    source:    'discover_inapp',
    tapped_at: new Date().toISOString(),
  }).then(() => {}).catch(() => {});

  return res.json({ ok: true, sent: true });
}));

module.exports = router;
