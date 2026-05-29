// src/api/couple/enquire.js
// POST /api/v2/discover/enquire
// One Discover "Enquire" tap fans out to four places:
//   1. WhatsApp ping to the vendor (from the TDW number) — bride stays in-app.
//   2. Vendor-side LEAD created in their Leads tab (createLead, deduped by phone).
//   3. Bride-side couple_enquiries row → powers her "Enquired" list in Vendors room.
//   4. enquiry_taps analytics row.
//
// No JWT (discover is public). couple_id is passed in the body when the bride is
// logged in, so steps 2/3 are best-effort: a logged-out bride still gets step 1+4.
//
// Body: { vendor_id, couple_id?, bride_name?, bride_phone? }
// Returns: { ok: true, sent: bool }

'use strict';

const express       = require('express');
const router        = express.Router();
const asyncHandler  = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');
const { createLead }   = require('../../lib/vendor/leads');

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id, couple_id, bride_name, bride_phone } = req.body || {};

  if (!vendor_id) {
    return res.status(400).json({ ok: false, error: 'vendor_id required' });
  }

  // Look up vendor + their user phone
  const { data: vendor, error: vErr } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle, user_id, category, city, base_fee_min, base_fee_max')
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

  // ── 1. WhatsApp ping to vendor ─────────────────────────────────────────────
  const brideLine = bride_name ? `Bride: ${bride_name}` : 'A bride on The Dream Wedding';
  const phoneLine = bride_phone ? `\nBride contact: ${bride_phone}` : '';

  // Phase 2.2 — opportunistic enrichment. A logged-in bride (couple_id present)
  // lets us hydrate her wedding date + budget from her profile, so even a silent
  // Discover tap can carry 📅 / 🔥 / 💰 lines. Anonymous taps get none — clean.
  let enrichment = '';
  try {
    const { buildEnquiryEnrichment } = require('../../lib/vendor/enquiryEnrichment');
    enrichment = await buildEnquiryEnrichment(supabase, {
      vendorId: vendor.id,
      vendor,                 // carries base_fee_min/max from the select below
      coupleId: couple_id,    // hydrates date + budget when she's a known bride
    });
  } catch (err) {
    console.warn('[enquire] enrichment failed (non-fatal):', err.message);
  }

  const enrichBlock = enrichment ? `\n\n${enrichment}` : '';
  const body = `\u2726 New enquiry from The Dream Wedding\n\n${brideLine} is interested in your work.${phoneLine}${enrichBlock}\n\nShe found you on the Discover feed. Reply on WhatsApp to connect.\n\n\u2014 TDW`;

  let sent = true;
  try {
    await sendWhatsApp(user.phone, body);
  } catch (err) {
    console.error('[enquire] sendWhatsApp error:', err.message);
    sent = false; // non-fatal — continue creating records
  }

  // ── 2. Vendor-side lead (createLead dedupes by phone) ──────────────────────
  let vendorLeadId = null;
  try {
    const leadRes = await createLead(supabase, vendor.id, {
      name:        bride_name || 'Dream Wedding enquiry',
      phone:       bride_phone || null,
      source:      'discover',
      raw_message: `${bride_name || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
    });
    vendorLeadId = leadRes?.lead?.id || null;
  } catch (err) {
    console.error('[enquire] createLead error:', err.message);
  }

  // ── 3. Bride-side enquiry record (only if logged in) ───────────────────────
  if (couple_id) {
    const { error: enqErr } = await supabase
      .from('couple_enquiries')
      .upsert({
        couple_id,
        vendor_id:       vendor.id,
        vendor_name:     vendor.business_name || null,
        vendor_category: vendor.category      || null,
        vendor_city:     vendor.city          || null,
        routing_handle:  vendor.routing_handle || null,
        vendor_lead_id:  vendorLeadId,
        created_at:      new Date().toISOString(),
      }, { onConflict: 'couple_id,vendor_id' });
    if (enqErr) console.error('[enquire] couple_enquiries upsert error:', enqErr.message);
  }

  // ── 4. Analytics tap (no .catch on supabase — try/catch instead) ───────────
  try {
    await supabase.from('enquiry_taps').insert({
      handle:    vendor.routing_handle || vendor_id,
      source:    'discover_inapp',
      tapped_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[enquire] enquiry_taps insert error:', err.message);
  }

  return res.json({ ok: true, sent });
}));

module.exports = router;
