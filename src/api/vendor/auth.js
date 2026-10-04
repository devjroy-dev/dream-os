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
const requireAuth   = require('../middleware/requireAuth');
const { provisionRole } = require('../../lib/provisionRole');
const { sendOtpCode } = require('../../lib/otpSend');
const { ensureAuthIdentity, AuthIdentityBoundElsewhereError, identityForPhone } = require('../../lib/ensureAuthIdentity');
const { textPresent } = require('../../lib/onboardingPredicate');
const { reviewerFor } = require('../../lib/vendor/reviewerLogin');   // CE-46 IGD-2 G7: Meta's reviewer account

const BCRYPT_ROUNDS    = 10;
const OTP_TTL_MS       = 5 * 60 * 1000;
const PIN_RE           = /^\d{4}$/;
const PHONE_RE         = /^\+[0-9]{8,15}$/;
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MS       = 15 * 60 * 1000;

// TDW_05 M2b (CE-62, founder-ruled option (ii)): the OTP Twilio fallback is GONE.
// VENDOR_WA / OTP_WA existed only to address that dead transport; OTP now rides this
// lane's own Meta phone-number-id via sendOtpCode. No `from` is derived here at all.

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
  return mintSessionForAuth(authId);
}

// F-44.271 (cut 11): the session for an auth identity, with or without a users row yet (a new sign-up).
async function mintSessionForAuth(authId) {
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
// ═══════════════════════════════════════════════════════════════════════════
// F-05.89 [R-37.1] — THE NAME THAT MUST TRAVEL · THE VENDOR TWIN [R-37.16]
// ═══════════════════════════════════════════════════════════════════════════
// The founder's word named brides; the code says the hole is ONE HOLE, and
// R-37.16 ruled both doors cured together. This door and `couple/auth.js` were
// the estate's only two nameless `users` minting sites; the pwa's `sendOtp`
// branches BOTH lanes out of a single function, so curing one lane from that
// function would have shipped a half-wired door; and `vendorComplete`
// (`onboardingPredicate.js`) refuses on a missing `user.name` exactly as
// `brideComplete` does. A maker abandoning between SEND CODE and OTP minted
// the identical Unknown.
//
// The cure is byte-parallel with the couple twin and the reasoning lives there
// in full: name on the FRESH INSERT ONLY, never over an existing row; the
// verified-login promotion is `provisionRole.js`'s [R-37.14]; the coercion is
// `textPresent` + an 80-cap, matching the onboarding form that writes the same
// column [R-37.19].
router.post('/send-otp', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { phone, name } = req.body;

  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ error: 'Valid E.164 phone number required.' });
  }
  const cleanPhone = phone.trim();
  // CE-46 IGD-2 G7: the reviewer account (REVIEWER_PHONE) signs in with REVIEWER_OTP and no message; refused if the code is unset.
  const reviewer = reviewerFor(cleanPhone);
  if (reviewer && reviewer.refuse) {
    console.warn('[reviewer] refused: REVIEWER_OTP unset or not six digits (send-otp)');
    return res.status(503).json({ error: 'This account is not available right now.', reason: 'reviewer_unavailable' });
  }
  // Absent, blank or whitespace-only is NULL, not a refusal — see the couple
  // twin's note: this door has never turned a caller away for a missing name.
  const cleanName = textPresent(name) ? name.trim().slice(0, 80) : null;

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
    // F-44.271 (CE-47 WEB-4 cut 11, ruling c): send-otp no longer makes the role row or a users row. The account is
    // made at provision, where a name must be given. (The wrong-role refusal above stands.)
  }
  void cleanName;   // a name sent here is no longer written here; provision carries it

  const otp     = reviewer ? reviewer.code : generateOtp();
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
  if (reviewer) {
    console.log('[reviewer] session opened for the reviewer account (send-otp; no message sent)');
    return res.json({ ok: true });
  }

  try {
    // M2b: Meta AUTHENTICATION template on this lane's PNID. No fallback exists;
    // an unresolvable lane throws into the catch below (session deleted, 500).
    await sendOtpCode({
      to: cleanPhone, code: otp, lane: 'vendor', templateKey: 'vendor_login_otp',
    });
  } catch (err) {
    console.error('[vendor:send-otp] otp send error:', err.message);
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
  // CE-46 IGD-2 G7: the reviewer account, as in send-otp.
  const reviewer = reviewerFor(cleanPhone);
  if (reviewer && reviewer.refuse) {
    console.warn('[reviewer] refused: REVIEWER_OTP unset or not six digits (forgot-pin)');
    return res.status(503).json({ error: 'This account is not available right now.', reason: 'reviewer_unavailable' });
  }

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

  const otp     = reviewer ? reviewer.code : generateOtp();
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
  if (reviewer) {
    console.log('[reviewer] session opened for the reviewer account (forgot-pin; no message sent)');
    return res.json({ ok: true });
  }

  try {
    // M2b: Meta AUTHENTICATION template on this lane's PNID. No fallback exists;
    // an unresolvable lane throws into the catch below (session deleted, 500).
    await sendOtpCode({
      to: cleanPhone, code: otp, lane: 'vendor', templateKey: 'vendor_reset_otp',
    });
  } catch (err) {
    console.error('[vendor:forgot-pin] otp send error:', err.message);
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

  if (reviewerFor(cleanPhone)) console.log(`[reviewer] verify-otp for the reviewer account purpose=${purpose}`);   // CE-46 IGD-2 G7
  // CE-46 G6-4 · F-44.245: DEV_OTP's universal code is GONE. A code is valid only when it matches the hash stored for THIS phone
  // by its own send (a random code sent on WhatsApp, or, on the vendor door only, REVIEWER_OTP for REVIEWER_PHONE: reviewerLogin.js).
  const valid = await bcrypt.compare(cleanOtp, otpRow.otp_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Incorrect code. Please try again.', reason: 'otp_invalid' });
  }

  await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);

  const { data: userRow } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();

  const { data: vendorRow } = userRow ? await supabase
    .from('vendors').select('id, pin_hash, pin_failed_attempts, pin_locked_until, business_name, category, tier, routing_handle, users!inner(name)')
    .eq('user_id', userRow.id).maybeSingle() : { data: null };

  // ── F-44.271 (CE-47 WEB-4 cut 11, ruling c): A NEW ACCOUNT. send-otp no longer makes rows, so a first sign-in finds no
  // users row (or no vendors row). The code is verified: mint the session on the phone's auth identity and answer with
  // new_account; the account is made at provision, which requires a name. A reset needs an account.
  if (!userRow || !vendorRow) {
    if (purpose === 'reset') return res.status(404).json({ error: 'No account for this number. Please sign up first.', reason: 'account_not_found' });
    let newTokens;
    try {
      const authId = userRow ? (await ensureAuthIdentity({ supabase, authClient, userId: userRow.id, phone: cleanPhone })).authUserId
        : await identityForPhone({ authClient, phone: cleanPhone });
      newTokens = await mintSessionForAuth(authId);
    } catch (err) {
      if (err instanceof AuthIdentityBoundElsewhereError) {
        return res.status(409).json({ error: 'This number needs to be reconnected before you can sign in. Please contact support.', reason: 'identity_bound_elsewhere' });
      }
      console.error('[vendor:verify-otp] new-account session error:', err.message);
      return res.status(500).json({ error: 'Could not create session. Please try again.' });
    }
    console.log(`[vendor:verify-otp] ok phone=${cleanPhone} purpose=${purpose} new_account=true`);
    setVendorCookie(res, newTokens.access_token);
    return res.json({ ok: true, user_id: userRow ? userRow.id : null, vendor_id: null, pin_set: false, name: null, new_account: true,
      access_token: newTokens.access_token, refresh_token: newTokens.refresh_token });
  }

  if (purpose === 'reset' && (vendorRow.pin_failed_attempts > 0 || vendorRow.pin_locked_until)) {
    await supabase.from('vendors')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', vendorRow.id);
  }

  // F-05.9: signup adopts the login path over Meta, so the Supabase Phone-OTP that used
  // to create the auth.users identity (Twilio, dead) is gone. Create-or-heal the identity
  // HERE — after the code is proven, before mintSession — so mintSession's find-only
  // contract stays byte-stable and no identity is ever created for an unverified phone.
  try {
    await ensureAuthIdentity({ supabase, authClient, userId: userRow.id, phone: cleanPhone });
  } catch (err) {
    // ── F-42.148 · A MIS-BIND IS NOT A TRANSIENT FAILURE ────────────────────
    // Every other failure here is worth retrying and says so. This one is NOT:
    // the identity for this phone is held by another users row, and no retry can
    // change that — so "Please try again" would be an instruction to do a thing
    // that cannot work, forever. The code is TYPED and Postgres's constraint name
    // never reaches the caller; the ids live in the server log, where the person
    // who can act on them will look.
    if (err instanceof AuthIdentityBoundElsewhereError) {
      console.error(`[vendor:verify-otp] identity mis-bind: auth ${err.authUserId} held by users ` +
        `${err.holderUserId}, not ${err.userId} — F-42.148, needs a hand`);
      return res.status(409).json({
        error:  'This number needs to be reconnected before you can sign in. Please contact support.',
        reason: 'identity_bound_elsewhere',
      });
    }
    console.error('[vendor:verify-otp] identity error:', err.message);
    return res.status(500).json({ error: 'Could not create session. Please try again.' });
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
// Returns: { ok, user_id, vendor_id, name, category, tier, access_token, refresh_token }
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
    .from('vendors').select('id, pin_hash, pin_failed_attempts, pin_locked_until, business_name, category, tier, users!inner(name)')
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
  const vendorName = vendorRow.business_name || vendorRow.users?.name || null;
  setVendorCookie(res, tokens.access_token);
  return res.json({
    ok:            true,
    user_id:       userRow.id,
    vendor_id:     vendorRow.id,
    name:          vendorName,
    category:      vendorRow.category || null,
    tier:          vendorRow.tier || null,
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
// ── ARC OB · F-OB.3's CURE (CE-32, fork 2, 2026-08-12) ──────────────────────
// WHAT WAS HERE: a private six — ['makeup','planning','photography','designer',
// 'venue & decor','jewellery'] — the estate's THIRD taxonomy, undeclared, and the
// only one containing 'venue & decor', a token no other list has ever carried.
// The defect was not the list. It was line :538's shape:
//     if (category && VENDOR_CATEGORIES.includes(category)) { ...write... }
// A category outside the six was DROPPED WORDLESSLY — no write, no error, no log.
// A vendor typed their craft at signup, the door said ok:true, and the craft was
// gone. Under the eleven that would have swallowed `hairstylist` and
// `content_creator` — two of the founder's five words — on their first day.
// And the cross-door half: this same door WROTE 'venue & decor', which the CRUD
// door's allowed[] then refused. One estate, two doors, opposite answers.
//
// THE SHAPE, PROPOSED IN ONE LINE (chair rules it in-band): PROVISIONING NEVER
// FAILS FOR A CATEGORY — an auth path must not strand a vendor mid-signup — but
// the category is NORMALISED through the one home, and when it does not resolve
// the response says so out loud (`category_refused` + `allowed`) and the log
// carries the raw bytes. Refuse the CATEGORY, never the ACCOUNT; and never,
// ever, eat it in silence.
const { VENDOR_CATEGORIES } = require('../../agent/categories');
const { normaliseCategory } = require('../../lib/vendor/categoryFraming');

router.post('/provision', requireAuth, async (req, res) => {
  try {
    const supabase   = req.app.locals.supabase;
    const authUserId = req.auth.user_id;
    const phone = req.auth.phone || (req.body && req.body.phone) || null;
    const name  = ((req.body && req.body.name) || '').trim() || null;
    const r = await provisionRole(supabase, { authUserId, phone, name, role: 'vendor' });

    // Craft/field captured at signup (invite_phone), BEFORE the engine agent is
    // born — set once, normalised to the ONE canonical taxonomy (not a private
    // list). This is what lets resolvePreset() land the right profession_preset
    // at birth; resolvePreset now normalises too, so the two cannot disagree.
    const rawCategory = ((req.body && req.body.category) || '').trim();
    let categoryRefused = null;
    if (rawCategory) {
      // normalise-or-refuse. `normaliseCategory` returns 'other' for anything it
      // cannot place, so the ONE ambiguous case is a raw value that is not itself
      // 'other' but lands there: that is an unrecognised craft, not a chosen one,
      // and it gets said out loud rather than written as 'other' or dropped.
      const canonical = normaliseCategory(rawCategory);
      const recognised = canonical !== 'other' || rawCategory.toLowerCase() === 'other';
      if (recognised) {
        const { data: vrow } = await supabase
          .from('vendors').select('category').eq('id', r.role_id).maybeSingle();
        if (vrow && !(vrow.category && String(vrow.category).trim())) {
          await supabase.from('vendors').update({ category: canonical }).eq('id', r.role_id);
        }
      } else {
        categoryRefused = rawCategory;
        console.warn('[vendor:provision] category not recognised, NOT written:',
                     JSON.stringify(rawCategory), 'vendor_id=', r.role_id);
      }
    }

    return res.json({
      ok: true, user_id: r.user_id, vendor_id: r.role_id, pin_set: r.pin_set,
      needs_name: !(r.name && String(r.name).trim()),   // F-44.271 (cut 11, ruling b): a returning nameless account is asked, never locked out
      ...(categoryRefused ? { category_refused: categoryRefused, allowed: VENDOR_CATEGORIES } : {}),
    });
  } catch (e) {
    // F-44.271 (cut 11, ruling a): a NEW account without a name is refused, nothing written
    if (e && e.reason === 'name_required') return res.status(400).json({ ok: false, reason: 'name_required', field: 'name', error: 'Please add your name.' });
    console.error('[vendor:provision]', e.message);
    return res.status(500).json({ ok: false, error: 'Provisioning failed.' });
  }
});

module.exports = router;
module.exports.mintSession = mintSession;
