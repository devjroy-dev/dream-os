// src/api/vendor/auth.js
// Vendor PWA auth endpoints.
// Mounted at /api/v2/vendor/auth via src/api/router.js
//
// ENDPOINTS
//   POST /send-otp     -- generate + send WhatsApp OTP to vendor phone
//   POST /verify-otp   -- verify OTP, mint Supabase Auth session, return JWT
//   POST /set-pin      -- bcrypt PIN, write to vendors.pin_hash
//   POST /pin-login    -- verify phone + PIN, mint Supabase Auth session, return JWT
//   POST /forgot-pin   -- alias for send-otp with purpose=reset
//
// JWT / SESSION CONTRACT (P2-4)
//   verify-otp and pin-login return { access_token, refresh_token }.
//   PWA stores in localStorage. Sends Authorization: Bearer <access_token>
//   on all subsequent /api/v2/* requests that require auth.
//
//   Lazy auth.users backfill: first verify-otp for a phone creates an auth.users
//   row via supabase.auth.admin.createUser (idempotent -- 422 = already exists).
//   auth.users UUID pinned to users.id so both tables share one identity.

'use strict';

const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const twilio    = require('twilio');

const BCRYPT_ROUNDS    = 10;
const OTP_TTL_MS       = 5 * 60 * 1000;
const PIN_RE           = /^\d{4}$/;
const PHONE_RE         = /^\+[0-9]{8,15}$/;
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MS       = 15 * 60 * 1000;

const VENDOR_WA_NUMBER = process.env.TDW_WA_NUMBER
  ? `+${process.env.TDW_WA_NUMBER}`
  : '+917982159047';

function getTwilio() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function generateOtp() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

// -- mintSession --------------------------------------------------------------
// Lazy auth.users backfill + Supabase Auth session mint.
// Creates auth.users row on first login; retrieves on subsequent logins.
// Returns { access_token, refresh_token }.
async function mintSession(supabase, phone, userId) {
  let authUserId = userId;

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    phone,
    phone_confirm: true,
    id: userId,
  });

  if (createError) {
    if (
      createError.message?.includes('already registered') ||
      createError.message?.includes('already been registered') ||
      createError.status === 422
    ) {
      const { data: existing, error: existErr } = await supabase.auth.admin.getUserById(userId);
      if (existErr || !existing?.user) {
        throw new Error(`auth.users lookup failed: ${existErr?.message || 'no user'}`);
      }
      authUserId = existing.user.id;
    } else {
      throw new Error(`auth.users creation failed: ${createError.message}`);
    }
  } else {
    authUserId = createData.user.id;
  }

  // supabase.auth.admin.createSession does not exist in ^2.45.0.
  // Use GoTrue admin REST endpoint directly (available on all Supabase cloud projects).
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const sessionRes = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${authUserId}/sessions`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey':        serviceKey,
      },
      body: JSON.stringify({}),
    }
  );

  if (!sessionRes.ok) {
    const errText = await sessionRes.text();
    throw new Error(`session mint failed (${sessionRes.status}): ${errText}`);
  }

  const sessionJson = await sessionRes.json();
  return {
    access_token:  sessionJson.access_token,
    refresh_token: sessionJson.refresh_token,
  };
}

// -- POST /send-otp -----------------------------------------------------------
router.post('/send-otp', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }
  const cleanPhone = phone.trim();

  const { data: userRow } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();

  if (!userRow) {
    console.log(`[vendor:auth:send-otp] phone not found: ${cleanPhone}`);
    return res.status(404).json({
      error:  'No account found for this number. Please check your invite.',
      reason: 'phone_not_found',
    });
  }

  const { data: vendorRow } = await supabase
    .from('vendors').select('id, pin_locked_until').eq('user_id', userRow.id).maybeSingle();

  if (!vendorRow) {
    console.log(`[vendor:auth:send-otp] no vendor row: ${cleanPhone}`);
    return res.status(403).json({
      error:  'This number is registered as a Dreamer account, not a Maker.',
      reason: 'wrong_role',
    });
  }

  const otp       = generateOtp();
  const otpHash   = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertError } = await supabase.from('otp_sessions').upsert({
    phone: cleanPhone, otp_hash: otpHash, purpose: 'login',
    expires_at: expiresAt, created_at: new Date().toISOString(),
  }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('[vendor:auth:send-otp] upsert error:', upsertError.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    await getTwilio().messages.create({
      from: `whatsapp:${VENDOR_WA_NUMBER}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your DreamAI login code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error('[vendor:auth:send-otp] twilio error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[vendor:auth:send-otp] OTP sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// -- POST /forgot-pin ---------------------------------------------------------
router.post('/forgot-pin', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }
  const cleanPhone = phone.trim();

  const { data: userRow } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();
  if (!userRow) {
    return res.status(404).json({ error: 'No account found for this number.', reason: 'phone_not_found' });
  }

  const { data: vendorRow } = await supabase
    .from('vendors').select('id').eq('user_id', userRow.id).maybeSingle();
  if (!vendorRow) {
    return res.status(403).json({ error: 'This number is not a Maker account.', reason: 'wrong_role' });
  }

  const otp       = generateOtp();
  const otpHash   = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertError } = await supabase.from('otp_sessions').upsert({
    phone: cleanPhone, otp_hash: otpHash, purpose: 'reset',
    expires_at: expiresAt, created_at: new Date().toISOString(),
  }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('[vendor:auth:forgot-pin] upsert error:', upsertError.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    await getTwilio().messages.create({
      from: `whatsapp:${VENDOR_WA_NUMBER}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your DreamAI PIN reset code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error('[vendor:auth:forgot-pin] twilio error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[vendor:auth:forgot-pin] reset OTP sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// -- POST /verify-otp ---------------------------------------------------------
// Body: { phone, otp, purpose }
// Returns { ok, user_id, vendor_id, pin_set, access_token, refresh_token }
router.post('/verify-otp', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone, otp, purpose } = req.body;

  if (!phone || !otp || !purpose) {
    return res.status(400).json({ error: 'phone, otp and purpose are required.' });
  }
  if (!['login', 'reset'].includes(purpose)) {
    return res.status(400).json({ error: 'purpose must be login or reset.' });
  }
  if (!PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }

  const cleanPhone = phone.trim();
  const cleanOtp   = (otp || '').trim();

  const { data: session } = await supabase
    .from('otp_sessions').select('otp_hash, purpose, expires_at')
    .eq('phone', cleanPhone).maybeSingle();

  if (!session) {
    return res.status(400).json({ error: 'No OTP found for this number. Please request a new one.', reason: 'otp_not_found' });
  }
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.', reason: 'otp_expired' });
  }
  if (session.purpose !== purpose) {
    return res.status(400).json({ error: 'OTP purpose mismatch.', reason: 'otp_purpose_mismatch' });
  }

  const valid = await bcrypt.compare(cleanOtp, session.otp_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Incorrect code. Please try again.', reason: 'otp_invalid' });
  }

  await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);

  const { data: userRow } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();
  if (!userRow) {
    return res.status(500).json({ error: 'Account not found after OTP verification.' });
  }

  const { data: vendorRow } = await supabase
    .from('vendors').select('id, pin_hash, pin_failed_attempts, pin_locked_until')
    .eq('user_id', userRow.id).maybeSingle();
  if (!vendorRow) {
    return res.status(500).json({ error: 'Vendor record not found after OTP verification.' });
  }

  if (purpose === 'reset' && (vendorRow.pin_failed_attempts > 0 || vendorRow.pin_locked_until)) {
    await supabase.from('vendors')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', vendorRow.id);
  }

  let tokens;
  try {
    tokens = await mintSession(supabase, cleanPhone, userRow.id);
  } catch (mintErr) {
    console.error('[vendor:auth:verify-otp] session mint error:', mintErr.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
  }

  const pinSet = !!vendorRow.pin_hash;
  console.log(`[vendor:auth:verify-otp] verified + JWT minted phone=${cleanPhone} purpose=${purpose} pin_set=${pinSet}`);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    vendor_id:     vendorRow.id,
    pin_set:       pinSet,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
});

// -- POST /set-pin ------------------------------------------------------------
// Body: { vendor_id, pin }
// No auth required -- called immediately after verify-otp (phone already proved).
router.post('/set-pin', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id, pin } = req.body;

  if (!vendor_id || !pin) {
    return res.status(400).json({ error: 'vendor_id and pin are required.' });
  }
  if (!PIN_RE.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
  }

  const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
  const { error } = await supabase.from('vendors')
    .update({ pin_hash: pinHash, pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', vendor_id);

  if (error) {
    console.error('[vendor:auth:set-pin] update error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  console.log(`[vendor:auth:set-pin] PIN set for vendor_id=${vendor_id}`);
  return res.json({ ok: true });
});

// -- POST /pin-login ----------------------------------------------------------
// Body: { phone, pin }
// Returns { ok, user_id, vendor_id, access_token, refresh_token }
router.post('/pin-login', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ error: 'phone and pin are required.' });
  }
  if (!PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }
  if (!PIN_RE.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
  }

  const cleanPhone = phone.trim();

  const { data: userRow } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();
  if (!userRow) {
    return res.status(404).json({ error: 'No account found for this number.', reason: 'phone_not_found' });
  }

  const { data: vendorRow } = await supabase
    .from('vendors').select('id, pin_hash, pin_failed_attempts, pin_locked_until')
    .eq('user_id', userRow.id).maybeSingle();
  if (!vendorRow) {
    return res.status(403).json({ error: 'This number is not a Maker account.', reason: 'wrong_role' });
  }
  if (!vendorRow.pin_hash) {
    return res.status(400).json({ error: 'PIN not set yet. Please sign in with OTP first.', reason: 'pin_not_set' });
  }

  if (vendorRow.pin_locked_until && new Date(vendorRow.pin_locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(vendorRow.pin_locked_until) - new Date()) / 60000);
    return res.status(429).json({
      error:        `Too many incorrect attempts. Try again in ${remaining} minute${remaining === 1 ? '' : 's'}, or use Forgot PIN.`,
      reason:       'pin_locked',
      locked_until: vendorRow.pin_locked_until,
    });
  }

  const valid = await bcrypt.compare(pin, vendorRow.pin_hash);

  if (!valid) {
    const attempts = (vendorRow.pin_failed_attempts || 0) + 1;
    const update   = { pin_failed_attempts: attempts };
    if (attempts >= LOCKOUT_ATTEMPTS) {
      update.pin_locked_until    = new Date(Date.now() + LOCKOUT_MS).toISOString();
      update.pin_failed_attempts = 0;
    }
    await supabase.from('vendors').update(update).eq('id', vendorRow.id);
    const attemptsLeft = LOCKOUT_ATTEMPTS - attempts;
    console.log(`[vendor:auth:pin-login] wrong PIN phone=${cleanPhone} attempts=${attempts}`);
    if (attempts >= LOCKOUT_ATTEMPTS) {
      return res.status(429).json({
        error:  'Too many incorrect attempts. Locked out for 15 minutes. Use Forgot PIN.',
        reason: 'pin_locked',
      });
    }
    return res.status(400).json({
      error:              `Incorrect PIN. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      reason:             'pin_invalid',
      attempts_remaining: attemptsLeft,
    });
  }

  await supabase.from('vendors')
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', vendorRow.id);

  let tokens;
  try {
    tokens = await mintSession(supabase, cleanPhone, userRow.id);
  } catch (mintErr) {
    console.error('[vendor:auth:pin-login] session mint error:', mintErr.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
  }

  console.log(`[vendor:auth:pin-login] success + JWT minted phone=${cleanPhone} vendor_id=${vendorRow.id}`);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    vendor_id:     vendorRow.id,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
});

module.exports = router;
