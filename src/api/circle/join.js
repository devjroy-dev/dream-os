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
const { mintCircleSession, CIRCLE_TTL_MS } = require('../../lib/circleSession');

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

// ── F-07.72 · ONE NUMBER, ONE CIRCLE ────────────────────────────────────────
// Founder-ruled 2026-08-02, verbatim: one phone co-plans exactly ONE wedding.
//
// WHY IT IS ENFORCED HERE AND NOT ONLY IN THE DATABASE. The durable enforcement
// is a partial unique index on (invitee_phone) WHERE status='active', and it is
// founder-run SQL travelling in its own later message under the conditional-
// withheld rule. This code leg exists so the refusal is a SENTENCE THE INVITEE
// CAN READ rather than a 23505 the door turns into "Something went wrong."
// Both legs ship; neither is the other's substitute.
//
// WHAT IT PROTECTED BEFORE IT WAS A RULE. `public.circle_members` has no
// `user_id` column and `circle_members_phone_idx` is a PLAIN index, so every
// door's `.maybeSingle()` on (invitee_phone, status='active') was 1:1 by luck.
// The founder's SELECT of 2026-08-02 returned ZERO rows for a phone active in
// more than one circle, so nothing existing is broken by this refusal — it
// closes a door that was open and unused.
//
// Returns the offending row when the phone is already active in a DIFFERENT
// circle, or null. Being active in THIS circle is not this check's business:
// that is the already-claimed path, which each route answers in its own words.
async function activeElsewhere(supabase, phone, thisCoupleId) {
  if (!phone) return null;
  const { data: rows } = await supabase
    .from('circle_members')
    .select('id, couple_id')
    .eq('invitee_phone', phone)
    .eq('status', 'active');
  return (rows || []).find(r => r.couple_id !== thisCoupleId) || null;
}

// The founder's byte, frozen 2026-08-02. Held at one home so the three doors
// that speak it cannot drift into three wordings.
const ONE_CIRCLE_REFUSAL =
  'This number is already helping plan another wedding. One number, one circle.';

// ── THE MEMBER'S VOCABULARY · D-5, founder-frozen 2026-08-14 ────────────────
// ONE BYTE PER CONDITION, ONE HOME. Before D-5 this file spoke 32 strings for
// nine conditions — five sentences for "the link doesn't resolve", four for
// "already claimed", three for "expired". A member met a different wording
// depending on which of four doors she happened to knock on, and no refusal
// could be changed without finding every copy of it.
//
// The standard these are written to is ONE_CIRCLE_REFUSAL above — the founder's
// byte of 2026-08-02, the only member string in this file that never needed
// consolidating. It is unchanged by this delivery.
//
// WHY NO BYTE HERE CARRIES THE BRIDE'S NAME. Ruled by derivation at D-5: at
// every site where a refusal is spoken her name is NOT in hand. `/validate`
// guards BEFORE its couples query (see below); `/send-otp` never queries
// couples at all; `/accept`'s expiry arm fires off an RPC hint with no row
// resolved. Speaking her name would mean adding a couples hop to a failure
// path — a second resolution for cosmetics. These are nameless because the
// data is, not because nameless reads better.
//
// FROZEN AT THE CHARACTER. Each byte carries its sheet number. A cell in
// scripts/b14_d5_copy_bench.js reddens on any drift.
const COPY = {
  LINK_INVALID:   "This invite link isn't valid — ask for a new one.",   // ㉖ was 5 sentences
  ALREADY_JOINED: "You've already joined. Sign in with your PIN.",       // ㉗ was 4
  NOT_ACTIVE:     'This invite is no longer active.',                     // ㉘ was 2
  EXPIRED:        'This invite has expired — ask for a new one.',         // ㉙ was 3
  // ㉛ no code / expired code / PURPOSE MISMATCH — three sentences, one of which
  // ("Code purpose mismatch.") was engineer speech on a member's screen. The
  // mismatch arm IS REACHABLE and the reason is structural: `otp_sessions` is
  // keyed on phone with `onConflict: 'phone'`, so any other TDW code requested
  // on the same number mid-join overwrites her `circle_join` row, and her good
  // code then meets a row whose purpose no longer matches. Same remedy as the
  // other two, so one byte. (Cell §4.1 witnesses the key, not this comment.)
  CODE_STALE:     "That code's no longer good. Ask for a new one.",       // ㉛ was 3
  CODE_WRONG:     "That code isn't right.",                               // ㉜ separate by ruling:
                                                                          //    retype, not resend
  CODE_UNSENT:    "We couldn't send your code. Try again.",               // ㉝ was 2
  OUR_FAULT:      'Something went wrong on our side. Try again.',         // ㉞ was 4
  // ㉟ THE UNREACHABLE CLASS. Eight strings lived here that no member flow can
  // reach: the client gates phone length before `/send-otp`, fires `/accept`
  // only on six filled digits and `/set-pin` only on four, and `/set-pin`'s
  // user and member lookups run against a row `/accept` created seconds
  // earlier. They were internal-API validation speaking on a member's glass.
  // The engineer detail now survives in `console.error`, where it is useful.
  // ONE RACE IS GENUINELY REACHABLE and takes this byte honestly: the bride
  // removing a member in the ~30s between her code and her PIN. Named rather
  // than claimed clean.
  GENERIC:        'Something went wrong — try the link again.',           // ㉟ was 8
};

// ── POST /validate ────────────────────────────────────────────────────────
// Looks up a pending, unexpired invite. Returns bride + invitee names for the
// welcome screen. Does NOT mutate anything.
router.post('/validate', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const token    = (req.body?.token || '').trim();

  if (!token || !TOKEN_RE.test(token)) {
    return fail(res, 400, COPY.LINK_INVALID);
  }

  const { data: member, error } = await supabase
    .from('circle_members')
    .select('id, couple_id, invitee_name, role, status, expires_at')
    .eq('invite_token', token)
    .maybeSingle();

  if (error) {
    console.error('[circle/join/validate] query error:', error.message);
    return fail(res, 500, COPY.OUR_FAULT);
  }
  if (!member) {
    return fail(res, 404, COPY.LINK_INVALID);
  }
  if (member.status === 'removed') {
    return fail(res, 410, COPY.NOT_ACTIVE);
  }
  if (member.status === 'active') {
    return fail(res, 409, COPY.ALREADY_JOINED);
  }
  if (member.expires_at && new Date(member.expires_at) < new Date()) {
    return fail(res, 410, COPY.EXPIRED);
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

  if (!token || !TOKEN_RE.test(token)) return fail(res, 400, COPY.LINK_INVALID);
  // ㉟ UNREACHABLE-CLASS: the client gates 10 digits at page.tsx:93 before this
  // door is ever called. The detail goes to the log, the member gets the byte.
  if (!/^\+[0-9]{8,15}$/.test(phone)) {
    console.error('[circle/join/send-otp] phone failed E.164 shape:', phoneRaw);
    return fail(res, 400, COPY.GENERIC);
  }

  // Confirm the invite is still claimable before sending a code.
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, status, expires_at')
    .eq('invite_token', token)
    .maybeSingle();

  if (!member)                    return fail(res, 404, COPY.LINK_INVALID);
  if (member.status === 'active') return fail(res, 409, COPY.ALREADY_JOINED);
  if (member.status === 'removed')return fail(res, 410, COPY.NOT_ACTIVE);
  if (member.expires_at && new Date(member.expires_at) < new Date()) {
    return fail(res, 410, COPY.EXPIRED);
  }

  // F-07.72 — refuse BEFORE the code is sent. Sending an OTP to a phone that
  // cannot complete the join spends a WhatsApp template on a dead end and
  // teaches the invitee she is one step from an app she can never enter.
  if (await activeElsewhere(supabase, phone, member.couple_id)) {
    return fail(res, 409, ONE_CIRCLE_REFUSAL);
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
    return fail(res, 500, COPY.OUR_FAULT);
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
    return fail(res, 500, COPY.CODE_UNSENT);
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

  if (!token || !TOKEN_RE.test(token)) return fail(res, 400, COPY.LINK_INVALID);
  // ㉟ UNREACHABLE-CLASS ×2: the client gates the phone at page.tsx:93 and only
  // fires this door on six filled digits at page.tsx:143.
  if (!/^\+[0-9]{8,15}$/.test(phone)) {
    console.error('[circle/join/accept] phone failed E.164 shape');
    return fail(res, 400, COPY.GENERIC);
  }
  if (otp.length !== 6) {
    console.error('[circle/join/accept] otp length was', otp.length);
    return fail(res, 400, COPY.GENERIC);
  }

  // 1. Verify OTP
  const { data: otpRow } = await supabase
    .from('otp_sessions')
    .select('otp_hash, purpose, expires_at')
    .eq('phone', phone)
    .maybeSingle();

  if (!otpRow)                                       return fail(res, 400, COPY.CODE_STALE);
  if (otpRow.purpose !== 'circle_join')              return fail(res, 400, COPY.CODE_STALE);
  if (new Date(otpRow.expires_at) < new Date()) {
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return fail(res, 400, COPY.CODE_STALE);
  }
  const validOtp = await bcrypt.compare(otp, otpRow.otp_hash);
  if (!validOtp)                                     return fail(res, 400, COPY.CODE_WRONG);

  // OTP good — consume it
  await supabase.from('otp_sessions').delete().eq('phone', phone);

  // F-07.72 — the second gate, on the far side of the OTP. /send-otp's check
  // can be minutes old by the time the code comes back, and the claim RPC is
  // atomic-and-irreversible: a refusal after activation would be a row to undo.
  const { data: inviteRow } = await supabase
    .from('circle_members')
    .select('couple_id')
    .eq('invite_token', token)
    .maybeSingle();
  if (inviteRow && await activeElsewhere(supabase, phone, inviteRow.couple_id)) {
    return fail(res, 409, ONE_CIRCLE_REFUSAL);
  }

  // 2. Claim the invite atomically (validate + activate + activity feed)
  const { data: claimRows, error: claimErr } = await supabase.rpc('claim_circle_invite', {
    p_token:         token,
    p_invitee_phone: phone,
  });

  if (claimErr) {
    const hint = claimErr.hint || '';
    if (hint === 'invite_invalid_or_used')   return fail(res, 409, COPY.ALREADY_JOINED);
    if (hint === 'circle_invite_expired')    return fail(res, 410, COPY.EXPIRED);
    console.error('[circle/join/accept] claim error:', claimErr.message);
    return fail(res, 500, COPY.OUR_FAULT);
  }

  const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
  if (!claim) return fail(res, 409, COPY.ALREADY_JOINED);

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
      return fail(res, 500, COPY.OUR_FAULT);
    }
    userId = newUser.id;
  }

  // 4. Has the bride set a shared PIN yet?
  const { data: couple } = await supabase
    .from('couples')
    .select('pin_hash')
    .eq('id', claim.couple_id)
    .maybeSingle();

  // F-07.72 — the lane's SECOND mint point. A member who has just joined holds
  // a session, not a bare id: without this she would walk out of the join flow
  // credential-less and the enforcement ZIP would meet her at the first door.
  const sessionToken = mintCircleSession({ userId, coupleId: claim.couple_id });

  console.log(`[circle/join/accept] claimed member=${claim.member_id} user=${userId} couple=${claim.couple_id}`);

  return ok(res, {
    token:        sessionToken || null,
    expires_at:   sessionToken ? Date.now() + CIRCLE_TTL_MS : null,
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

  // ㉟ UNREACHABLE-CLASS ×2: `user_id` comes from /accept's own response and the
  // client fires this door only on four filled digits (page.tsx:179).
  if (!userId) {
    console.error('[circle/join/set-pin] called without user_id');
    return fail(res, 400, COPY.GENERIC);
  }
  if (!PIN_RE.test(pin)) {
    console.error('[circle/join/set-pin] pin failed 4-digit shape');
    return fail(res, 400, COPY.GENERIC);
  }

  // Resolve the user's phone → active circle_member → couple
  const { data: userRow } = await supabase
    .from('users').select('id, phone').eq('id', userId).maybeSingle();
  if (!userRow) {
    // ㉟ UNREACHABLE-CLASS: /accept created or found this row seconds ago.
    console.error('[circle/join/set-pin] user row absent for id', userId);
    return fail(res, 404, COPY.GENERIC);
  }

  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, status')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();
  if (!member) {
    // ㉟ THE ONE REACHABLE MEMBER OF THE CLASS — the bride removing her in the
    // ~30s between her code and her PIN. Rare, real, and honestly served.
    console.error('[circle/join/set-pin] no active member for phone');
    return fail(res, 403, COPY.GENERIC);
  }

  const { data: couple } = await supabase
    .from('couples').select('id, pin_hash').eq('id', member.couple_id).maybeSingle();
  if (!couple) {
    // ㉟ UNREACHABLE-CLASS: the member row just resolved carries this couple_id.
    console.error('[circle/join/set-pin] couple absent for id', member.couple_id);
    return fail(res, 404, COPY.GENERIC);
  }

  // Only set if the shared PIN does not yet exist.
  if (!couple.pin_hash) {
    const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    const { error: updErr } = await supabase
      .from('couples')
      .update({ pin_hash: pinHash })
      .eq('id', couple.id);
    if (updErr) {
      console.error('[circle/join/set-pin] update error:', updErr.message);
      return fail(res, 500, COPY.OUR_FAULT);
    }
    console.log(`[circle/join/set-pin] shared PIN set for couple=${couple.id} by user=${userId}`);
  } else {
    console.log(`[circle/join/set-pin] shared PIN already exists for couple=${couple.id} — skipping write`);
  }

  return ok(res, { pin_set: true });
}));

module.exports = router;
