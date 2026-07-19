// src/api/vendor/auth.js
// Vendor PWA auth endpoints — P2-4 clean build.
// Mounted at /api/v2/vendor/auth via src/api/router.js
//
// ENDPOINTS
//   POST /send-otp     — send WhatsApp OTP to vendor phone
//   POST /verify-otp   — verify OTP, mint JWT, return tokens
//   POST /set-pin      — bcrypt PIN, store in vendors.pin_hash
//   POST /pin-login    — verify PIN, mint JWT, return tokens
//   POST /forgot-pin   — send reset OTP (purpose=reset)
//
// SESSION CONTRACT
//   verify-otp and pin-login return { access_token, refresh_token }.
//   PWA stores in localStorage. All protected endpoints require:
//   Authorization: Bearer <access_token>
//
// MINT PATTERN (find the existing phone-OTP identity — never create)
//   1. resolve auth_user_id from public.users (the identity provision linked)
//   2. updateUserById — pins stable internal email on that EXISTING row (no dispatch)
//   3. generateLink magiclink — returns hashed_token (no email dispatched)
//   4. verifyOtp token_hash — exchanges token for a JWT session for that same identity

'use strict';

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const twilio  = require('twilio');
const requireAuth   = require('../middleware/requireAuth');
const { provisionRole } = require('../../lib/provisionRole');

const BCRYPT_ROUNDS    = 10;
const OTP_TTL_MS       = 5 * 60 * 1000;
const PIN_RE           = /^\d{4}$/;
const PHONE_RE         = /^\+[0-9]{8,15}$/;
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MS       = 15 * 60 * 1000;

const VENDOR_WA = process.env.TDW_WA_NUMBER
  ? `+${process.env.TDW_WA_NUMBER}`
  : '+917982159047';

// F-05.6 fix (b) — decouple OTP/auth from the migrating lane number (CE-34).
// OTP sends leave from a DEDICATED Twilio number that NEVER migrates, so a
// Twilio→Meta lane cutover cannot break signup/login/PIN-reset. DORMANT until the
// founder provisions OTP_WA_NUMBER (bare digits, a Twilio number kept on Twilio);
// while UNSET this falls back to VENDOR_WA — byte-identical to the pre-fix send.
const OTP_WA = process.env.OTP_WA_NUMBER
  ? `+${process.env.OTP_WA_NUMBER}`
  : VENDOR_WA;

// Dedicated client for the GoTrue session exchange (mintSession). It is built with the
// SAME service-role key but kept SEPARATE from the shared data client, and with
// persistSession/autoRefreshToken OFF, so that verifyOtp -- which sets a user session --
// never mutates the service-role client the rest of the app reads the `engine` schema with.
const { createClient: _createAuthClient } = require('@supabase/supabase-js');
const authClient = _createAuthClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);


// ── Cookie helper — sets vendor session cookie for iOS Safari compatibility ──
// Not httpOnly so frontend JS can read it as fallback when localStorage is
// wiped by ITP. SameSite=None + Secure required for cross-origin PWA calls.
function setVendorCookie(res, token) {
  res.cookie('tdw_vendor_token', token, {
    maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days in ms
    secure:   true,
    sameSite: 'none',
    httpOnly: false,   // JS-readable — frontend needs it for Authorization header
    path:     '/',
  });
}

function getTwilio() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function generateOtp() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

// ---------------------------------------------------------------------------
// mintSession
// Lazy auth.users backfill + JWT session mint.
// Called after OTP verify or PIN verify — phone already proved at that point.
// ---------------------------------------------------------------------------
async function mintSession(supabase, userId) {
  // Resolve the EXISTING Supabase auth identity for this user — the one provision
  // already linked (real phone-OTP user). We NEVER createUser here: createUser pinned
  // to users.id manufactures a second, divergent auth identity (the bug that split
  // public.users from engine.users). Find, don't create. One person, one auth user.
  const { data: u, error: uErr } = await supabase
    .from('users').select('auth_user_id').eq('id', userId).maybeSingle();
  if (uErr) throw new Error(`user lookup failed: ${uErr.message}`);
  const authId = u && u.auth_user_id;
  if (!authId) {
    throw new Error('No Supabase auth identity for this account. Sign in with OTP first.');
  }

  // Pin a stable internal email on the EXISTING auth row (required by generateLink;
  // admin update dispatches no email, creates no new user).
  const internalEmail = `vendor-${authId}@internal.dreamai.app`;
  const { error: updateErr } = await authClient.auth.admin.updateUserById(authId, {
    email:         internalEmail,
    email_confirm: true,
  });
  if (updateErr) throw new Error(`auth.users email pin failed: ${updateErr.message}`);

  // Generate magic-link token server-side (no email dispatched), exchange for a real
  // JWT session — minted for the existing phone identity, so OTP and PIN converge.
  const { data: linkData, error: linkErr } = await authClient.auth.admin.generateLink({
    type:  'magiclink',
    email: internalEmail,
  });
  if (linkErr) throw new Error(`generateLink failed: ${linkErr.message}`);

  const { data: sessionData, error: sessionErr } = await authClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type:       'email',
  });
  if (sessionErr) throw new Error(`verifyOtp failed: ${sessionErr.message}`);

  return {
    access_token:  sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  };
}

// ---------------------------------------------------------------------------
// POST /send-otp
// ---------------------------------------------------------------------------
router.post('/send-otp', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }
  const cleanPhone = phone.trim();

  // Open signup: self-mint the account if this phone is new.
  let { data: userRow } = await supabase
    .from('users').select('id, name').eq('phone', cleanPhone).maybeSingle();

  if (userRow) {
    // Existing user — guard against the OTHER role owning this phone.
    const { data: otherRow } = await supabase
      .from('couples').select('id').eq('user_id', userRow.id).maybeSingle();
    const { data: thisRow } = await supabase
      .from('vendors').select('id').eq('user_id', userRow.id).maybeSingle();
    if (otherRow && !thisRow) {
      return res.status(403).json({
        error:  'This number is registered as a Dreamer account.',
        reason: 'wrong_role',
      });
    }
    if (!thisRow) {
      const { error: roleErr } = await supabase.from('vendors')
        .insert({ user_id: userRow.id, onboarding_state: 'new' });
      if (roleErr) {
        console.error('[vendor:send-otp] vendors insert error:', roleErr.message);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }
  } else {
    // Fresh phone — create users + role row.
    const { data: newUser, error: userErr } = await supabase
      .from('users').insert({ phone: cleanPhone }).select('id').single();
    if (userErr) {
      console.error('[vendor:send-otp] users insert error:', userErr.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    userRow = newUser;
    const { error: roleErr } = await supabase.from('vendors')
      .insert({ user_id: userRow.id, onboarding_state: 'new' });
    if (roleErr) {
      await supabase.from('users').delete().eq('id', userRow.id);
      console.error('[vendor:send-otp] vendors insert error:', roleErr.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(
    { phone: cleanPhone, otp_hash: otpHash, purpose: 'login', expires_at: expires, created_at: new Date().toISOString() },
    { onConflict: 'phone' }
  );
  if (upsertErr) {
    console.error('[vendor:send-otp] upsert error:', upsertErr.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    await getTwilio().messages.create({
      from: `whatsapp:${OTP_WA}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your DreamAI login code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error('[vendor:send-otp] twilio error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[vendor:send-otp] sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /forgot-pin
// ---------------------------------------------------------------------------
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

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(
    { phone: cleanPhone, otp_hash: otpHash, purpose: 'reset', expires_at: expires, created_at: new Date().toISOString() },
    { onConflict: 'phone' }
  );
  if (upsertErr) {
    console.error('[vendor:forgot-pin] upsert error:', upsertErr.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    await getTwilio().messages.create({
      from: `whatsapp:${OTP_WA}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your DreamAI PIN reset code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error('[vendor:forgot-pin] twilio error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[vendor:forgot-pin] reset OTP sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /verify-otp
// Body:    { phone, otp, purpose }
// Returns: { ok, user_id, vendor_id, pin_set, access_token, refresh_token }
// ---------------------------------------------------------------------------
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
  const cleanOtp   = String(otp).trim();

  const { data: otpRow } = await supabase
    .from('otp_sessions').select('otp_hash, purpose, expires_at')
    .eq('phone', cleanPhone).maybeSingle();

  if (!otpRow) {
    return res.status(400).json({ error: 'No OTP found. Please request a new one.', reason: 'otp_not_found' });
  }
  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.', reason: 'otp_expired' });
  }
  if (otpRow.purpose !== purpose) {
    return res.status(400).json({ error: 'OTP purpose mismatch.', reason: 'otp_purpose_mismatch' });
  }

  const _devOk = !!(process.env.DEV_OTP && cleanOtp === process.env.DEV_OTP);
  if (_devOk) console.log(`[verify-otp] DEV_OTP bypass used phone=${cleanPhone}`);
  const valid = _devOk || await bcrypt.compare(cleanOtp, otpRow.otp_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Incorrect code. Please try again.', reason: 'otp_invalid' });
  }

  await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);

  const { data: userRow } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();
  if (!userRow) return res.status(500).json({ error: 'Account not found after OTP verification.' });

  const { data: vendorRow } = await supabase
    .from('vendors').select('id, pin_hash, pin_failed_attempts, pin_locked_until, business_name, category, tier, routing_handle, users!inner(name)')
    .eq('user_id', userRow.id).maybeSingle();
  if (!vendorRow) return res.status(500).json({ error: 'Vendor record not found after OTP verification.' });

  if (purpose === 'reset' && (vendorRow.pin_failed_attempts > 0 || vendorRow.pin_locked_until)) {
    await supabase.from('vendors')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', vendorRow.id);
  }

  let tokens;
  try {
    tokens = await mintSession(supabase, userRow.id);
  } catch (err) {
    console.error('[vendor:verify-otp] mint error:', err.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
  }

  const pinSet = !!vendorRow.pin_hash;
  console.log(`[vendor:verify-otp] ok phone=${cleanPhone} purpose=${purpose} pin_set=${pinSet}`);
  const vendorName = vendorRow.business_name || vendorRow.users?.name || null;
  setVendorCookie(res, tokens.access_token);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    vendor_id:     vendorRow.id,
    pin_set:       pinSet,
    name:          vendorName,
    category:      vendorRow.category || null,
    tier:          vendorRow.tier || null,
    routing_handle: vendorRow.routing_handle || null,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
});

// ---------------------------------------------------------------------------
// POST /set-pin
// Body: { vendor_id, pin }
// No auth — called immediately after verify-otp (phone already proved).
// ---------------------------------------------------------------------------
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
    console.error('[vendor:set-pin] error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  console.log(`[vendor:set-pin] PIN set vendor_id=${vendor_id}`);
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /pin-login
// Body:    { phone, pin }
// Returns: { ok, user_id, vendor_id, access_token, refresh_token }
// ---------------------------------------------------------------------------
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
    const mins = Math.ceil((new Date(vendorRow.pin_locked_until) - Date.now()) / 60000);
    return res.status(429).json({
      error:        `Too many incorrect attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}, or use Forgot PIN.`,
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
    const left = LOCKOUT_ATTEMPTS - attempts;
    console.log(`[vendor:pin-login] wrong PIN phone=${cleanPhone} attempts=${attempts}`);
    if (attempts >= LOCKOUT_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Locked out for 15 minutes. Use Forgot PIN.', reason: 'pin_locked' });
    }
    return res.status(400).json({
      error:              `Incorrect PIN. ${left} attempt${left === 1 ? '' : 's'} remaining.`,
      reason:             'pin_invalid',
      attempts_remaining: left,
    });
  }

  await supabase.from('vendors')
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', vendorRow.id);

  let tokens;
  try {
    tokens = await mintSession(supabase, userRow.id);
  } catch (err) {
    console.error('[vendor:pin-login] mint error:', err.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
  }

  console.log(`[vendor:pin-login] ok phone=${cleanPhone} vendor_id=${vendorRow.id}`);
  setVendorCookie(res, tokens.access_token);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    vendor_id:     vendorRow.id,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
});

// ---------------------------------------------------------------------------
// POST /refresh
// Body:    { refresh_token }
// Returns: { ok, access_token, refresh_token }
// No requireAuth — this is called precisely when the access_token has expired.
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { refresh_token } = req.body;

  if (!refresh_token || typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'refresh_token is required.', reason: 'missing_token' });
  }

  try {
    // Exchange refresh_token for a new session via Supabase
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      console.warn('[vendor:refresh] refresh failed:', error?.message || 'no session');
      return res.status(401).json({
        error:  'Session expired. Please log in again.',
        reason: 'refresh_failed',
      });
    }

    console.log('[vendor:refresh] session refreshed successfully');
    return res.json({
      ok:            true,
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

  } catch (err) {
    console.error('[vendor:refresh] unexpected error:', err.message);
    return res.status(500).json({ error: 'Could not refresh session. Please log in again.' });
  }
});


// POST /provision — Path 1 (Supabase Phone-OTP). The browser has already authenticated
// via Supabase (signInWithOtp/verifyOtp); requireAuth verifies that session here, then
// we provision the users + vendor row (idempotent, phone-fallback re-bind). No tokens
// returned — the browser holds the Supabase session.
const VENDOR_CATEGORIES = ['makeup', 'planning', 'photography', 'designer', 'venue & decor', 'jewellery'];

router.post('/provision', requireAuth, async (req, res) => {
  try {
    const supabase   = req.app.locals.supabase;
    const authUserId = req.auth.user_id;
    const phone = req.auth.phone || (req.body && req.body.phone) || null;
    const name  = ((req.body && req.body.name) || '').trim() || null;
    const r = await provisionRole(supabase, { authUserId, phone, name, role: 'vendor' });

    // Craft/field captured at signup (invite_phone), BEFORE the engine agent is
    // born — set once, constrained to the six categories that map to a preset/Codex.
    // This is what lets resolvePreset() land the right profession_preset at birth.
    const category = (((req.body && req.body.category) || '').trim().toLowerCase()) || null;
    if (category && VENDOR_CATEGORIES.includes(category)) {
      const { data: vrow } = await supabase
        .from('vendors').select('category').eq('id', r.role_id).maybeSingle();
      if (vrow && !(vrow.category && String(vrow.category).trim())) {
        await supabase.from('vendors').update({ category }).eq('id', r.role_id);
      }
    }

    return res.json({ ok: true, user_id: r.user_id, vendor_id: r.role_id, pin_set: r.pin_set });
  } catch (e) {
    console.error('[vendor:provision]', e.message);
    return res.status(500).json({ ok: false, error: 'Provisioning failed.' });
  }
});

module.exports = router;
module.exports.mintSession = mintSession;
