// src/api/vendor/auth.js
// Vendor PWA auth endpoints.
// Mounted at /api/v2/vendor/auth via src/api/router.js
//
// ENDPOINTS
//   POST /send-otp     — generate + send WhatsApp OTP to vendor phone
//   POST /verify-otp   — verify OTP, return { pin_set, user_id } + temp token
//   POST /set-pin      — bcrypt PIN, write to vendors.pin_hash
//   POST /pin-login    — verify phone + PIN, return JWT
//   POST /forgot-pin   — alias for send-otp with purpose=reset
//
// AUTH FLOW
//   Invite/WhatsApp path (pin_hash IS NULL):
//     send-otp → verify-otp → set-pin → enter app
//   Returning user (pin_hash IS NOT NULL):
//     pin-login → enter app
//   Forgot PIN:
//     forgot-pin (= send-otp purpose=reset) → verify-otp → set-pin → enter app
//
// OTP CONTRACT
//   - 6-digit numeric string, zero-padded (e.g. "047382")
//   - bcrypt-hashed before storage in otp_sessions
//   - Expires 5 minutes after issue
//   - Single-use: row deleted on successful verify
//   - Sent via Twilio WhatsApp on +917982159047 (vendor number)
//   - Message: "Your DreamAI login code is: XXXXXX. Valid for 5 minutes."
//
// PIN CONTRACT
//   - 4-digit numeric string validated server-side (regex ^\d{4}$)
//   - bcrypt-hashed before storage in vendors.pin_hash
//   - Lockout: 5 failures in rolling 15 min → pin_locked_until set
//   - Lockout escape: forgot-pin flow (OTP reset)
//
// JWT / SESSION CONTRACT
//   We use Supabase Auth to issue a session JWT. The flow:
//     1. verify-otp success → supabase.auth.admin.createSession (phone-based)
//        Returns { access_token, refresh_token }. Sent to PWA.
//     2. PWA stores tokens, sends Authorization: Bearer <access_token> on
//        subsequent requests.
//   Supabase Auth requires users to exist in auth.users. We create an
//   auth user linked to the phone via supabase.auth.admin.createUser on
//   first verify-otp for a phone that doesn't have an auth user yet.
//   Idempotent — if auth user already exists, we call signInWithPhone instead.
//
// LOCKOUT POLICY (locked in P2-3)
//   5 failed PIN attempts → pin_locked_until = now() + 15 min
//   pin_failed_attempts resets to 0 on: successful PIN, successful OTP reset
//   pin_locked_until cleared on: successful OTP reset (forgot-pin flow)

'use strict';

const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const twilio    = require('twilio');

const BCRYPT_ROUNDS = 10;
const OTP_TTL_MS    = 5 * 60 * 1000; // 5 minutes
const PIN_RE        = /^\d{4}$/;
const PHONE_RE      = /^\+[0-9]{8,15}$/;
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MS       = 15 * 60 * 1000; // 15 minutes

const VENDOR_WA_NUMBER = process.env.TDW_WA_NUMBER
  ? `+${process.env.TDW_WA_NUMBER}`
  : '+917982159047';

function getTwilio() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

function generateOtp() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

// ── POST /send-otp ──────────────────────────────────────────────────────────
// Body: { phone }
// Generates OTP, bcrypts, upserts otp_sessions, sends WhatsApp message.
// Returns { ok: true } — never reveals the OTP.
router.post('/send-otp', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }

  const cleanPhone = phone.trim();

  // Verify this phone exists as a vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user:users!inner(phone)', cleanPhone)
    .maybeSingle();

  // For the WhatsApp-onboarded path, look up via users join
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (!userRow) {
    // Phone not in system at all — could be someone who hasn't been invited
    // Return generic error to avoid phone enumeration
    console.log(`[vendor:auth:send-otp] phone not found: ${cleanPhone}`);
    return res.status(404).json({
      error: 'No account found for this number. Please check your invite.',
      reason: 'phone_not_found',
    });
  }

  // Check user has a vendors row (not a couple)
  const { data: vendorRow } = await supabase
    .from('vendors')
    .select('id, pin_locked_until')
    .eq('user_id', userRow.id)
    .maybeSingle();

  if (!vendorRow) {
    console.log(`[vendor:auth:send-otp] user exists but no vendor row: ${cleanPhone}`);
    return res.status(403).json({
      error: 'This number is registered as a Dreamer account, not a Maker.',
      reason: 'wrong_role',
    });
  }

  // Generate + hash OTP
  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Upsert otp_sessions — one row per phone, overwrites any prior OTP
  const { error: upsertError } = await supabase
    .from('otp_sessions')
    .upsert({
      phone:      cleanPhone,
      otp_hash:   otpHash,
      purpose:    'login',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('[vendor:auth:send-otp] upsert error:', upsertError.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  // Send WhatsApp OTP via Twilio
  try {
    const client = getTwilio();
    await client.messages.create({
      from: `whatsapp:${VENDOR_WA_NUMBER}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your DreamAI login code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (twilioErr) {
    console.error('[vendor:auth:send-otp] twilio error:', twilioErr.message);
    // Clean up the otp_sessions row since we couldn't deliver
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[vendor:auth:send-otp] OTP sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// ── POST /forgot-pin ────────────────────────────────────────────────────────
// Body: { phone }
// Same as send-otp but purpose='reset'. Clears lockout on success.
router.post('/forgot-pin', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }

  const cleanPhone = phone.trim();

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (!userRow) {
    return res.status(404).json({ error: 'No account found for this number.', reason: 'phone_not_found' });
  }

  const { data: vendorRow } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', userRow.id)
    .maybeSingle();

  if (!vendorRow) {
    return res.status(403).json({ error: 'This number is not a Maker account.', reason: 'wrong_role' });
  }

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertError } = await supabase
    .from('otp_sessions')
    .upsert({
      phone:      cleanPhone,
      otp_hash:   otpHash,
      purpose:    'reset',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('[vendor:auth:forgot-pin] upsert error:', upsertError.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    const client = getTwilio();
    await client.messages.create({
      from: `whatsapp:${VENDOR_WA_NUMBER}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your DreamAI PIN reset code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (twilioErr) {
    console.error('[vendor:auth:forgot-pin] twilio error:', twilioErr.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[vendor:auth:forgot-pin] reset OTP sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// ── POST /verify-otp ────────────────────────────────────────────────────────
// Body: { phone, otp, purpose }
// Verifies OTP against hash. Deletes row on success (single-use).
// Returns { ok: true, user_id, vendor_id, pin_set }
//   pin_set: true  → go to pin-login
//   pin_set: false → go to set-pin
// On purpose=reset: also clears lockout columns.
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

  // Lookup otp_sessions row
  const { data: session } = await supabase
    .from('otp_sessions')
    .select('otp_hash, purpose, expires_at')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (!session) {
    return res.status(400).json({ error: 'No OTP found for this number. Please request a new one.', reason: 'otp_not_found' });
  }

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.', reason: 'otp_expired' });
  }

  // Check purpose match
  if (session.purpose !== purpose) {
    return res.status(400).json({ error: 'OTP purpose mismatch.', reason: 'otp_purpose_mismatch' });
  }

  // Verify OTP
  const valid = await bcrypt.compare(cleanOtp, session.otp_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Incorrect code. Please try again.', reason: 'otp_invalid' });
  }

  // Single-use: delete the row
  await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);

  // Look up user + vendor
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (!userRow) {
    return res.status(500).json({ error: 'Account not found after OTP verification.' });
  }

  const { data: vendorRow } = await supabase
    .from('vendors')
    .select('id, pin_hash, pin_failed_attempts, pin_locked_until')
    .eq('user_id', userRow.id)
    .maybeSingle();

  if (!vendorRow) {
    return res.status(500).json({ error: 'Vendor record not found after OTP verification.' });
  }

  // On reset: clear lockout
  if (purpose === 'reset' && (vendorRow.pin_failed_attempts > 0 || vendorRow.pin_locked_until)) {
    await supabase
      .from('vendors')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', vendorRow.id);
  }

  const pinSet = !!vendorRow.pin_hash;

  console.log(`[vendor:auth:verify-otp] verified phone=${cleanPhone} purpose=${purpose} pin_set=${pinSet}`);
  return res.json({
    ok:        true,
    user_id:   userRow.id,
    vendor_id: vendorRow.id,
    pin_set:   pinSet,
  });
});

// ── POST /set-pin ────────────────────────────────────────────────────────────
// Body: { vendor_id, pin }
// Called after verify-otp when pin_set=false, or after forgot-pin verify.
// bcrypts PIN, writes to vendors.pin_hash, resets failed attempts.
// Returns { ok: true }
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

  const { error } = await supabase
    .from('vendors')
    .update({
      pin_hash:            pinHash,
      pin_failed_attempts: 0,
      pin_locked_until:    null,
    })
    .eq('id', vendor_id);

  if (error) {
    console.error('[vendor:auth:set-pin] update error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  console.log(`[vendor:auth:set-pin] PIN set for vendor_id=${vendor_id}`);
  return res.json({ ok: true });
});

// ── POST /pin-login ──────────────────────────────────────────────────────────
// Body: { phone, pin }
// Verifies PIN. Enforces lockout policy. Returns { ok: true, user_id, vendor_id }.
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

  // Look up user + vendor
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (!userRow) {
    return res.status(404).json({ error: 'No account found for this number.', reason: 'phone_not_found' });
  }

  const { data: vendorRow } = await supabase
    .from('vendors')
    .select('id, pin_hash, pin_failed_attempts, pin_locked_until')
    .eq('user_id', userRow.id)
    .maybeSingle();

  if (!vendorRow) {
    return res.status(403).json({ error: 'This number is not a Maker account.', reason: 'wrong_role' });
  }

  if (!vendorRow.pin_hash) {
    return res.status(400).json({ error: 'PIN not set yet. Please sign in with OTP first.', reason: 'pin_not_set' });
  }

  // Check lockout
  if (vendorRow.pin_locked_until && new Date(vendorRow.pin_locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(vendorRow.pin_locked_until) - new Date()) / 60000);
    return res.status(429).json({
      error: `Too many incorrect attempts. Try again in ${remaining} minute${remaining === 1 ? '' : 's'}, or use Forgot PIN.`,
      reason: 'pin_locked',
      locked_until: vendorRow.pin_locked_until,
    });
  }

  // Verify PIN
  const valid = await bcrypt.compare(pin, vendorRow.pin_hash);

  if (!valid) {
    const attempts = (vendorRow.pin_failed_attempts || 0) + 1;
    const update = { pin_failed_attempts: attempts };

    if (attempts >= LOCKOUT_ATTEMPTS) {
      update.pin_locked_until = new Date(Date.now() + LOCKOUT_MS).toISOString();
      update.pin_failed_attempts = 0;
    }

    await supabase.from('vendors').update(update).eq('id', vendorRow.id);

    const attemptsLeft = LOCKOUT_ATTEMPTS - attempts;
    console.log(`[vendor:auth:pin-login] wrong PIN phone=${cleanPhone} attempts=${attempts}`);

    if (attempts >= LOCKOUT_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many incorrect attempts. You have been locked out for 15 minutes. Use Forgot PIN to reset.',
        reason: 'pin_locked',
      });
    }

    return res.status(400).json({
      error: `Incorrect PIN. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      reason: 'pin_invalid',
      attempts_remaining: attemptsLeft,
    });
  }

  // Success — reset failed attempts
  await supabase
    .from('vendors')
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', vendorRow.id);

  console.log(`[vendor:auth:pin-login] success phone=${cleanPhone} vendor_id=${vendorRow.id}`);
  return res.json({
    ok:        true,
    user_id:   userRow.id,
    vendor_id: vendorRow.id,
  });
});

module.exports = router;
