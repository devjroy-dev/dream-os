
// src/api/demo/vendor.js
// Public demo endpoints — no auth required.
// Mounted at /api/v2/demo via router.js
//
// ENDPOINTS
//   GET  /vendor/:handle        — fetch demo vendor profile + photos
//   POST /vendor/:handle/otp    — send OTP to bride's phone for enquiry verification
//   POST /vendor/:handle/enquire — verify OTP + save demo lead + notify vendor
//   GET  /muse-pool             — fetch curated images for bride demo Muse board

'use strict';

const express      = require('express');
const router       = express.Router();
const bcrypt       = require('bcryptjs');
const asyncHandler = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');

const BCRYPT_ROUNDS = 10;
const OTP_TTL_MS    = 5 * 60 * 1000; // 5 minutes
const PHONE_RE      = /^\+[0-9]{8,15}$/;

// Admin phone — fallback notification recipient when vendor has no WhatsApp stored
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || '+918757788550';
const VENDOR_WA   = process.env.TDW_WA_NUMBER
  ? `+${process.env.TDW_WA_NUMBER}`
  : '+917982159047';

function generateOtp() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

// ── GET /vendor/:handle ───────────────────────────────────────────────────────
// Returns demo vendor profile + photos for landing page.
// No auth. handle is the IG handle (e.g. makeupbyswatiroy).
router.get('/vendor/:handle', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase().trim();

  const { data: vendor, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, about, rate_display, photos')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (error || !vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found or inactive.' });
  }

  return res.json({
    ok: true,
    vendor: {
      id:           vendor.id,
      ig_handle:    vendor.ig_handle,
      name:         vendor.display_name,
      category:     vendor.category,
      city:         vendor.city,
      about:        vendor.about,
      rate_display: vendor.rate_display,
      photos:       vendor.photos || [],
    },
  });
}));

// ── POST /vendor/:handle/otp ──────────────────────────────────────────────────
// Sends OTP to bride's phone for enquiry verification.
// Body: { phone }
router.post('/vendor/:handle/otp', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase().trim();
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ ok: false, error: 'Valid phone number required (e.g. +918757788550).' });
  }
  const cleanPhone = phone.trim();

  // Verify demo vendor exists
  const { data: vendor } = await supabase
    .from('demo_vendors')
    .select('id, display_name')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (!vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found.' });
  }

  // Generate + hash OTP
  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(
    { phone: cleanPhone, otp_hash: otpHash, purpose: 'demo_enquiry',
      expires_at: expires, created_at: new Date().toISOString() },
    { onConflict: 'phone' }
  );

  if (upsertErr) {
    console.error('[demo:otp] upsert error:', upsertErr.message);
    return res.status(500).json({ ok: false, error: 'Could not send OTP. Try again.' });
  }

  // Send via Twilio
  try {
    await sendWhatsApp(
      cleanPhone,
      `Your The Dream Wedding verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`
    );
  } catch (err) {
    console.error('[demo:otp] twilio error:', err.message);
    return res.status(500).json({ ok: false, error: 'Could not send OTP. Try again.' });
  }

  console.log(`[demo:otp] sent to ${cleanPhone} for handle=${handle}`);
  return res.json({ ok: true });
}));

// ── POST /vendor/:handle/enquire ──────────────────────────────────────────────
// Verifies OTP + saves demo lead + notifies vendor (or admin).
// Body: { name, phone, otp, ig_handle?, email?, wedding_date?, wedding_city? }
router.post('/vendor/:handle/enquire', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const handle   = req.params.handle.toLowerCase().trim();
  const {
    name, phone, otp,
    ig_handle: brideIg, email,
    wedding_date, wedding_city,
  } = req.body;

  if (!name?.trim() || !phone?.trim() || !otp?.trim()) {
    return res.status(400).json({ ok: false, error: 'Name, phone and OTP are required.' });
  }
  const cleanPhone = phone.trim();

  // 1. Verify OTP
  const { data: otpRow } = await supabase
    .from('otp_sessions')
    .select('otp_hash, expires_at')
    .eq('phone', cleanPhone)
    .eq('purpose', 'demo_enquiry')
    .maybeSingle();

  if (!otpRow) {
    return res.status(400).json({ ok: false, error: 'OTP expired or not found. Request a new one.' });
  }
  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(400).json({ ok: false, error: 'OTP expired. Request a new one.' });
  }
  const valid = await bcrypt.compare(otp.trim(), otpRow.otp_hash);
  if (!valid) {
    return res.status(400).json({ ok: false, error: 'Incorrect OTP.' });
  }

  // Delete OTP (single-use)
  await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);

  // 2. Fetch demo vendor
  const { data: vendor } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, whatsapp_phone')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();

  if (!vendor) {
    return res.status(404).json({ ok: false, error: 'Demo profile not found.' });
  }

  // 3. Save demo lead
  const { data: lead, error: leadErr } = await supabase
    .from('demo_leads')
    .insert({
      demo_vendor_id:     vendor.id,
      demo_vendor_handle: vendor.ig_handle,
      bride_name:         name.trim(),
      bride_phone:        cleanPhone,
      bride_ig_handle:    brideIg?.trim() || null,
      bride_email:        email?.trim() || null,
      bride_wedding_date: wedding_date || null,
      bride_wedding_city: wedding_city?.trim() || null,
      otp_verified:       true,
    })
    .select('id')
    .single();

  if (leadErr) {
    console.error('[demo:enquire] lead insert error:', leadErr.message);
    return res.status(500).json({ ok: false, error: 'Could not save enquiry. Try again.' });
  }

  // 4. Build notification message
  const dateStr = wedding_date
    ? new Date(wedding_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'date TBD';

  const brideDetails = [
    `Name: ${name.trim()}`,
    `Phone: ${cleanPhone}`,
    brideIg ? `Instagram: @${brideIg.trim()}` : null,
    email ? `Email: ${email.trim()}` : null,
    wedding_city ? `City: ${wedding_city.trim()}` : null,
    `Wedding: ${dateStr}`,
  ].filter(Boolean).join('\n');

  const vendorMsg =
    `Hi ${vendor.display_name.split(' ')[0]} — you have a new enquiry from your TDW demo profile!\n\n` +
    `${brideDetails}\n\n` +
    `She found you at thedreamwedding.in/demo/${vendor.ig_handle}\n\n` +
    `Ready to claim your studio? Reply to this message or visit thedreamwedding.in`;

  const adminMsg =
    `[TDW Demo Lead] New enquiry for @${vendor.ig_handle} (${vendor.display_name})\n\n` +
    `${brideDetails}\n\n` +
    `No vendor phone stored — please relay manually.`;

  // 5. Notify vendor or admin
  let notifiedVendor = false;
  let adminNotified  = false;

  if (vendor.whatsapp_phone) {
    try {
      await sendWhatsApp(vendor.whatsapp_phone, vendorMsg);
      notifiedVendor = true;
      console.log(`[demo:enquire] notified vendor ${vendor.whatsapp_phone} for lead=${lead.id}`);
    } catch (err) {
      console.error('[demo:enquire] vendor notify failed:', err.message);
      // Fall through to admin notification
    }
  }

  if (!notifiedVendor) {
    try {
      await sendWhatsApp(ADMIN_PHONE, adminMsg);
      adminNotified = true;
      console.log(`[demo:enquire] notified admin for lead=${lead.id}`);
    } catch (err) {
      console.error('[demo:enquire] admin notify failed:', err.message);
    }
  }

  // Update notification flags
  await supabase.from('demo_leads').update({
    notified_vendor: notifiedVendor,
    admin_notified:  adminNotified,
  }).eq('id', lead.id);

  return res.json({ ok: true, lead_id: lead.id, notified: notifiedVendor || adminNotified });
}));

// ── GET /muse-pool ────────────────────────────────────────────────────────────
// Returns curated images for bride demo Muse board.
// No auth. Returns active images ordered by display_order.
router.get('/muse-pool', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: images, error } = await supabase
    .from('demo_muse_pool')
    .select('id, image_url, tags, caption')
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Muse pool unavailable.' });
  }

  return res.json({ ok: true, images: images || [] });
}));

// ── GET /vendors ──────────────────────────────────────────────────────────────
// Returns all active demo vendors for bride demo Discover feed.
router.get('/vendors', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendors, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, category, city, photos')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Demo vendors unavailable.' });
  }

  const shaped = (vendors || []).map(v => ({
    id:       v.id,
    handle:   v.ig_handle,
    name:     v.display_name,
    category: v.category,
    city:     v.city,
    photos:   (v.photos || []).map(p => p.url || p.image_url || p).filter(Boolean),
  }));

  return res.json({ ok: true, vendors: shaped });
}));


// ── GET /session — mint a real JWT for the demo vendor UUID ──────────────────
// No auth required. Returns a short-lived JWT for the shared demo vendor account.
// Safe: demo UUID is tied to fake phone +20000000000001, not a real vendor.
router.get('/session', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const DEMO_USER_ID   = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa';
  const DEMO_VENDOR_ID = 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';

  try {
    const { mintSession } = require('../vendor/auth');
    const tokens = await mintSession(supabase, DEMO_USER_ID);

    console.log('[demo:session] minted JWT for demo vendor');
    return res.json({
      ok:            true,
      vendor_id:     DEMO_VENDOR_ID,
      user_id:       DEMO_USER_ID,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      name:          'Demo Studio',
      tier:          'signature',
    });
  } catch (err) {
    console.error('[demo:session] mint failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Could not create demo session.' });
  }
}));

module.exports = router;

