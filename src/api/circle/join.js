// src/api/circle/join.js
// Circle invite → co-planner join flow.
//
// Routes (mounted at /api/v2/circle/join):
//   POST /validate   — { token }                 → { success, data:{ bride_name, invitee_name } }
//   POST /send-otp   — { token, phone }           → { success }
//   POST /accept     — { token, phone, otp }      → { success, data:{ user_id, pin_set, ... } }
//   POST /set-pin    — { user_id, pin }           → { success }
//
// NOTES
//   - No JWT — coplanner/join sends no Authorization header. Each route validates
//     against the invite token + phone directly.
//   - Circle members share the BRIDE's PIN (couples.pin_hash), matching verifyPin.js.
//     set-pin only writes pin_hash if the bride hasn't already set one.
//   - send-otp here is invite-scoped: it does NOT require an existing couple account
//     (unlike couple/auth/send-otp), because the invitee is a brand-new phone.
//   - accept reuses the claim_circle_invite() RPC for atomic validate+activate+activity.

'use strict';

const express      = require('express');
const router       = express.Router();
const bcrypt       = require('bcryptjs');
const asyncHandler = require('../../lib/asyncHandler');
const { sendOtpCode } = require('../../lib/otpSend');

const BCRYPT_ROUNDS = 10;
const OTP_TTL_MS    = 5 * 60 * 1000;
const PIN_RE        = /^\d{4}$/;
const TOKEN_RE      = /^CIRCLE-[A-Z0-9]{4,12}$/i;

// TDW_05 M2b (CE-62, founder-ruled option (ii)): the OTP Twilio fallback is GONE.
// BRIDE_WA / OTP_WA existed only to address that dead transport; OTP now rides this
// lane's own Meta phone-number-id via sendOtpCode. No `from` is derived here at all.


function generateOtp() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

// TDW_04.5 P4 rider F-04.109 — toE164 hoisted to src/lib/phone.js (one home,
// three importers). Moved byte-identically; behaviour unchanged.
const { toE164 } = require('../../lib/phone');

function ok(res, data)            { return res.json({ success: true, data }); }
function fail(res, status, error) { return res.status(status).json({ success: false, error }); }

// ── POST /validate ────────────────────────────────────────────────────────
// Looks up a pending, unexpired invite. Returns bride + invitee names for the
// welcome screen. Does NOT mutate anything.
router.post('/validate', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token    = (req.body?.token || '').trim();

  if (!token || !TOKEN_RE.test(token)) {
    return fail(res, 400, 'This invite link is invalid.');
  }

  const { data: member, error } = await supabase
    .from('circle_members')
    .select('id, couple_id, invitee_name, role, status, expires_at')
    .eq('invite_token', token)
    .maybeSingle();

  if (error) {
    console.error('[circle/join/validate] query error:', error.message);
    return fail(res, 500, 'Could not load invite.');
  }
  if (!member) {
    return fail(res, 404, 'This invite link is invalid or has already been used.');
  }
  if (member.status === 'removed') {
    return fail(res, 410, 'This invite is no longer active.');
  }
  if (member.status === 'active') {
    return fail(res, 409, 'This invite has already been claimed. Please log in instead.');
  }
  if (member.expires_at && new Date(member.expires_at) < new Date()) {
    return fail(res, 410, 'This invite link has expired. Ask for a new one.');
  }

  // Bride name for greeting context
  const { data: couple } = await supabase
    .from('couples')
    .select('id, users(name)')
    .eq('id', member.couple_id)
    .maybeSingle();

  return ok(res, {
    bride_name:   couple?.users?.name || 'the bride',
    invitee_name: member.invitee_name || null,
    role:         member.role || 'family',
  });
}));

// ── POST /send-otp ──────────────────────────────────────────────────────────
// Invite-scoped OTP. Validates the token is claimable, then sends a code to the
// invitee's phone. Unlike couple/auth/send-otp this does NOT require the phone to
// already have a couple account.
router.post('/send-otp', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token    = (req.body?.token || '').trim();
  const phoneRaw = req.body?.phone;
  const phone    = toE164(phoneRaw);

  if (!token || !TOKEN_RE.test(token)) return fail(res, 400, 'Invalid invite link.');
  if (!/^\+[0-9]{8,15}$/.test(phone))  return fail(res, 400, 'Enter a valid phone number.');

  // Confirm the invite is still claimable before sending a code.
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, status, expires_at')
    .eq('invite_token', token)
    .maybeSingle();

  if (!member)                    return fail(res, 404, 'Invite not found.');
  if (member.status === 'active') return fail(res, 409, 'Already claimed. Please log in.');
  if (member.status === 'removed')return fail(res, 410, 'This invite is no longer active.');
  if (member.expires_at && new Date(member.expires_at) < new Date()) {
    return fail(res, 410, 'This invite link has expired.');
  }

  const otp     = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: upsertErr } = await supabase.from('otp_sessions').upsert(
    { phone, otp_hash: otpHash, purpose: 'circle_join', expires_at: expires, created_at: new Date().toISOString() },
    { onConflict: 'phone' }
  );
  if (upsertErr) {
    console.error('[circle/join/send-otp] upsert error:', upsertErr.message);
    return fail(res, 500, 'Something went wrong. Please try again.');
  }

  try {
    // M2b: Meta AUTHENTICATION template on this lane's PNID. No fallback exists;
    // an unresolvable lane throws into the catch below (session deleted, 500).
    await sendOtpCode({
      to: phone, code: otp, lane: 'bride', templateKey: 'circle_join_otp',
    });
  } catch (err) {
    console.error('[circle/join/send-otp] otp send error:', err.message);
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return fail(res, 500, 'Could not send WhatsApp code. Please try again.');
  }

  console.log(`[circle/join/send-otp] sent to ${phone}`);
  return ok(res, { sent: true });
}));

// ── POST /accept ──────────────────────────────────────────────────────────
// Verify OTP → claim invite (RPC, atomic) → upsert users row → return identity.
// Body: { token, phone, otp }
router.post('/accept', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token    = (req.body?.token || '').trim();
  const phone    = toE164(req.body?.phone);
  const otp      = (req.body?.otp || '').replace(/\D/g, '');

  if (!token || !TOKEN_RE.test(token)) return fail(res, 400, 'Invalid invite link.');
  if (!/^\+[0-9]{8,15}$/.test(phone))  return fail(res, 400, 'Enter a valid phone number.');
  if (otp.length !== 6)                return fail(res, 400, 'Enter the 6-digit code.');

  // 1. Verify OTP
  const { data: otpRow } = await supabase
    .from('otp_sessions')
    .select('otp_hash, purpose, expires_at')
    .eq('phone', phone)
    .maybeSingle();

  if (!otpRow)                                       return fail(res, 400, 'No code found. Request a new one.');
  if (otpRow.purpose !== 'circle_join')              return fail(res, 400, 'Code purpose mismatch.');
  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return fail(res, 400, 'Code expired. Request a new one.');
  }
  const validOtp = await bcrypt.compare(otp, otpRow.otp_hash);
  if (!validOtp)                                     return fail(res, 400, 'Incorrect code.');

  // OTP good — consume it
  await supabase.from('otp_sessions').delete().eq('phone', phone);

  // 2. Claim the invite atomically (validate + activate + activity feed)
  const { data: claimRows, error: claimErr } = await supabase.rpc('claim_circle_invite', {
    p_token:         token,
    p_invitee_phone: phone,
  });

  if (claimErr) {
    const hint = claimErr.hint || '';
    if (hint === 'invite_invalid_or_used')   return fail(res, 409, 'This invite has already been used.');
    if (hint === 'circle_invite_expired')    return fail(res, 410, 'This invite link has expired.');
    console.error('[circle/join/accept] claim error:', claimErr.message);
    return fail(res, 500, 'Could not join the circle. Please try again.');
  }

  const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
  if (!claim) return fail(res, 409, 'This invite is no longer valid.');

  // 3. Upsert users row (session + verify-pin look up users by phone)
  let userId;
  const { data: existingUser } = await supabase
    .from('users').select('id, name').eq('phone', phone).maybeSingle();

  if (existingUser) {
    userId = existingUser.id;
    if (!existingUser.name && claim.invitee_name) {
      await supabase.from('users').update({ name: claim.invitee_name }).eq('id', userId);
    }
  } else {
    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({ phone, name: claim.invitee_name || null })
      .select('id')
      .single();
    if (userErr) {
      console.error('[circle/join/accept] user insert error:', userErr.message);
      return fail(res, 500, 'Could not create your profile.');
    }
    userId = newUser.id;
  }

  // 4. Has the bride set a shared PIN yet?
  const { data: couple } = await supabase
    .from('couples')
    .select('pin_hash')
    .eq('id', claim.couple_id)
    .maybeSingle();

  console.log(`[circle/join/accept] claimed member=${claim.member_id} user=${userId} couple=${claim.couple_id}`);

  return ok(res, {
    user_id:      userId,
    co_planner_id:claim.member_id,
    couple_id:    claim.couple_id,
    name:         claim.invitee_name || null,
    role:         claim.member_role  || 'family',
    bride_name:   claim.bride_name   || null,
    pin_set:      !!(couple?.pin_hash),
  });
}));

// ── POST /set-pin ───────────────────────────────────────────────────────────
// Circle members share the bride's PIN. We only WRITE couples.pin_hash if the
// bride has not already set one — the first joiner sets the shared PIN, later
// joiners are routed straight to login by the client (pin_set=true).
// Body: { user_id, pin }
router.post('/set-pin', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userId   = req.body?.user_id;
  const pin      = (req.body?.pin || '').trim();

  if (!userId)            return fail(res, 400, 'user_id is required.');
  if (!PIN_RE.test(pin))  return fail(res, 400, 'PIN must be exactly 4 digits.');

  // Resolve the user's phone → active circle_member → couple
  const { data: userRow } = await supabase
    .from('users').select('id, phone').eq('id', userId).maybeSingle();
  if (!userRow) return fail(res, 404, 'User not found.');

  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, status')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();
  if (!member) return fail(res, 403, 'Not an active circle member.');

  const { data: couple } = await supabase
    .from('couples').select('id, pin_hash').eq('id', member.couple_id).maybeSingle();
  if (!couple) return fail(res, 404, 'Couple not found.');

  // Only set if the shared PIN does not yet exist.
  if (!couple.pin_hash) {
    const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    const { error: updErr } = await supabase
      .from('couples')
      .update({ pin_hash: pinHash })
      .eq('id', couple.id);
    if (updErr) {
      console.error('[circle/join/set-pin] update error:', updErr.message);
      return fail(res, 500, 'Could not set PIN.');
    }
    console.log(`[circle/join/set-pin] shared PIN set for couple=${couple.id} by user=${userId}`);
  } else {
    console.log(`[circle/join/set-pin] shared PIN already exists for couple=${couple.id} — skipping write`);
  }

  return ok(res, { pin_set: true });
}));

module.exports = router;
