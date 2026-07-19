// src/api/couple/auth.js
// Vendor PWA auth endpoints — P2-4 clean build.
// Mounted at /api/v2/couple/auth via src/api/router.js
//
// ENDPOINTS
//   POST /send-otp     — send WhatsApp OTP to couple phone
//   POST /verify-otp   — verify OTP, mint JWT, return tokens
//   POST /set-pin      — bcrypt PIN, store in couples.pin_hash
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

// Dedicated service-role client for the GoTrue session exchange (mintSession), kept
// SEPARATE from the shared data client with persistSession/autoRefreshToken OFF, so
// verifyOtp never mutates the client the rest of the app reads `engine`/`public` with.
const { createClient: _createAuthClient } = require('@supabase/supabase-js');
const authClient = _createAuthClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const BCRYPT_ROUNDS    = 10;
const OTP_TTL_MS       = 5 * 60 * 1000;
const PIN_RE           = /^\d{4}$/;
const PHONE_RE         = /^\+[0-9]{8,15}$/;
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MS       = 15 * 60 * 1000;

const BRIDE_WA = process.env.BRIDE_WA_NUMBER
  ? `+${process.env.BRIDE_WA_NUMBER}`
  : '+14787788550';

// F-05.6 fix (b) — decouple OTP/auth from the migrating lane number (CE-34).
// OTP sends leave from a DEDICATED Twilio number that NEVER migrates, so a
// Twilio→Meta lane cutover cannot break signup/login/PIN-reset. DORMANT until the
// founder provisions OTP_WA_NUMBER (bare digits, a Twilio number kept on Twilio);
// while UNSET this falls back to BRIDE_WA — byte-identical to the pre-fix send.
const OTP_WA = process.env.OTP_WA_NUMBER
  ? `+${process.env.OTP_WA_NUMBER}`
  : BRIDE_WA;


// ── Cookie helper — sets couple session cookie for iOS Safari compatibility ──
function setCoupleCookie(res, token) {
  res.cookie('tdw_couple_token', token, {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    secure:   true,
    sameSite: 'none',
    httpOnly: false,
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
  const internalEmail = `couple-${authId}@internal.dreamai.app`;
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
      .from('vendors').select('id').eq('user_id', userRow.id).maybeSingle();
    const { data: thisRow } = await supabase
      .from('couples').select('id').eq('user_id', userRow.id).maybeSingle();
    if (otherRow && !thisRow) {
      return res.status(403).json({
        error:  'This number is registered as a Maker account.',
        reason: 'wrong_role',
      });
    }
    if (!thisRow) {
      const { error: roleErr } = await supabase.from('couples')
        .insert({ user_id: userRow.id, onboarding_state: 'new' });
      if (roleErr) {
        console.error('[couple:send-otp] couples insert error:', roleErr.message);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    }
  } else {
    // Fresh phone — create users + role row.
    const { data: newUser, error: userErr } = await supabase
      .from('users').insert({ phone: cleanPhone }).select('id').single();
    if (userErr) {
      console.error('[couple:send-otp] users insert error:', userErr.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    userRow = newUser;
    const { error: roleErr } = await supabase.from('couples')
      .insert({ user_id: userRow.id, onboarding_state: 'new' });
    if (roleErr) {
      await supabase.from('users').delete().eq('id', userRow.id);
      console.error('[couple:send-otp] couples insert error:', roleErr.message);
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
    console.error('[couple:send-otp] upsert error:', upsertErr.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    await getTwilio().messages.create({
      from: `whatsapp:${OTP_WA}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your Dream Wedding login code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error('[couple:send-otp] twilio error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[couple:send-otp] sent to ${cleanPhone}`);
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

  const { data: coupleRow } = await supabase
    .from('couples').select('id').eq('user_id', userRow.id).maybeSingle();
  if (!coupleRow) {
    return res.status(403).json({ error: 'This number is not a Dreamer account.', reason: 'wrong_role' });
  }

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(
    { phone: cleanPhone, otp_hash: otpHash, purpose: 'reset', expires_at: expires, created_at: new Date().toISOString() },
    { onConflict: 'phone' }
  );
  if (upsertErr) {
    console.error('[couple:forgot-pin] upsert error:', upsertErr.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  try {
    await getTwilio().messages.create({
      from: `whatsapp:${OTP_WA}`,
      to:   `whatsapp:${cleanPhone}`,
      body: `Your Dream Wedding PIN reset code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    });
  } catch (err) {
    console.error('[couple:forgot-pin] twilio error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);
    return res.status(500).json({ error: 'Could not send WhatsApp message. Please try again.' });
  }

  console.log(`[couple:forgot-pin] reset OTP sent to ${cleanPhone}`);
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /verify-otp
// Body:    { phone, otp, purpose }
// Returns: { ok, user_id, couple_id, pin_set, access_token, refresh_token }
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

  const { data: coupleRow } = await supabase
    .from('couples').select('id, pin_hash, pin_failed_attempts, pin_locked_until, users!inner(name)')
    .eq('user_id', userRow.id).maybeSingle();
  if (!coupleRow) return res.status(500).json({ error: 'Couple record not found after OTP verification.' });

  if (purpose === 'reset' && (coupleRow.pin_failed_attempts > 0 || coupleRow.pin_locked_until)) {
    await supabase.from('couples')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', coupleRow.id);
  }

  let tokens;
  try {
    tokens = await mintSession(supabase, userRow.id);
  } catch (err) {
    console.error('[couple:verify-otp] mint error:', err.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
  }

  const pinSet = !!coupleRow.pin_hash;
  console.log(`[couple:verify-otp] ok phone=${cleanPhone} purpose=${purpose} pin_set=${pinSet}`);
  setCoupleCookie(res, tokens.access_token);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    couple_id:     coupleRow.id,
    pin_set:       pinSet,
    name:          coupleRow.users?.name || null,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
});

// ---------------------------------------------------------------------------
// POST /set-pin
// Body: { couple_id, pin }
// No auth — called immediately after verify-otp (phone already proved).
// ---------------------------------------------------------------------------
router.post('/set-pin', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id, pin } = req.body;

  if (!couple_id || !pin) {
    return res.status(400).json({ error: 'couple_id and pin are required.' });
  }
  if (!PIN_RE.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
  }

  const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
  const { error } = await supabase.from('couples')
    .update({ pin_hash: pinHash, pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', couple_id);

  if (error) {
    console.error('[couple:set-pin] error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  console.log(`[couple:set-pin] PIN set couple_id=${couple_id}`);
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /pin-login
// Body:    { phone, pin }
// Returns: { ok, user_id, couple_id, access_token, refresh_token }
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

  const { data: coupleRow } = await supabase
    .from('couples').select('id, pin_hash, pin_failed_attempts, pin_locked_until')
    .eq('user_id', userRow.id).maybeSingle();
  if (!coupleRow) {
    return res.status(403).json({ error: 'This number is not a Dreamer account.', reason: 'wrong_role' });
  }
  if (!coupleRow.pin_hash) {
    return res.status(400).json({ error: 'PIN not set yet. Please sign in with OTP first.', reason: 'pin_not_set' });
  }

  if (coupleRow.pin_locked_until && new Date(coupleRow.pin_locked_until) > new Date()) {
    const mins = Math.ceil((new Date(coupleRow.pin_locked_until) - Date.now()) / 60000);
    return res.status(429).json({
      error:        `Too many incorrect attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}, or use Forgot PIN.`,
      reason:       'pin_locked',
      locked_until: coupleRow.pin_locked_until,
    });
  }

  const valid = await bcrypt.compare(pin, coupleRow.pin_hash);

  if (!valid) {
    const attempts = (coupleRow.pin_failed_attempts || 0) + 1;
    const update   = { pin_failed_attempts: attempts };
    if (attempts >= LOCKOUT_ATTEMPTS) {
      update.pin_locked_until    = new Date(Date.now() + LOCKOUT_MS).toISOString();
      update.pin_failed_attempts = 0;
    }
    await supabase.from('couples').update(update).eq('id', coupleRow.id);
    const left = LOCKOUT_ATTEMPTS - attempts;
    console.log(`[couple:pin-login] wrong PIN phone=${cleanPhone} attempts=${attempts}`);
    if (attempts >= LOCKOUT_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Locked out for 15 minutes. Use Forgot PIN.', reason: 'pin_locked' });
    }
    return res.status(400).json({
      error:              `Incorrect PIN. ${left} attempt${left === 1 ? '' : 's'} remaining.`,
      reason:             'pin_invalid',
      attempts_remaining: left,
    });
  }

  await supabase.from('couples')
    .update({ pin_failed_attempts: 0, pin_locked_until: null })
    .eq('id', coupleRow.id);

  let tokens;
  try {
    tokens = await mintSession(supabase, userRow.id);
  } catch (err) {
    console.error('[couple:pin-login] mint error:', err.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
  }

  console.log(`[couple:pin-login] ok phone=${cleanPhone} couple_id=${coupleRow.id}`);
  setCoupleCookie(res, tokens.access_token);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    couple_id:     coupleRow.id,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
});


// POST /provision — Path 1 (Supabase Phone-OTP). Browser already authenticated via
// Supabase; requireAuth verifies it, then provision users + couple row (idempotent,
// phone-fallback re-bind). No tokens returned — the browser holds the Supabase session.
router.post('/provision', requireAuth, async (req, res) => {
  try {
    const authUserId = req.auth.user_id;
    const phone = req.auth.phone || (req.body && req.body.phone) || null;
    const name  = ((req.body && req.body.name) || '').trim() || null;
    const r = await provisionRole(req.app.locals.supabase, { authUserId, phone, name, role: 'couple' });
    return res.json({ ok: true, user_id: r.user_id, couple_id: r.role_id, pin_set: r.pin_set });
  } catch (e) {
    console.error('[couple:provision]', e.message);
    return res.status(500).json({ ok: false, error: 'Provisioning failed.' });
  }
});

module.exports = router;
