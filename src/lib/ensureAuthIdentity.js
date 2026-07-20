// src/lib/ensureAuthIdentity.js
// TDW_05 F-05.9 — auth-identity creation for the Meta signup path (CE ruling, Block 05).
//
// WHY THIS EXISTS
//   The ONLY mechanism that ever created the Supabase auth.users identity for a couple or
//   vendor was the browser's Supabase Phone-OTP (signInWithOtp -> Twilio), now dead. The
//   backend send-otp / verify-otp path already delivers the code over Meta and self-mints
//   public.users + the role row, but mintSession is FIND-ONLY by contract ("never
//   createUser here") — so a fresh signup dead-ends with no auth identity and mintSession
//   throws "Sign in with OTP first." This helper closes exactly that one gap.
//
// THE LAW IT ENFORCES — one person, one auth user (the scar this protects)
//   One phone -> EXACTLY one auth identity: created if absent, re-linked if present,
//   NEVER a second. mintSession refuses to create because a second identity keyed to the
//   wrong thing is the bug that split public.users from engine.users. Here we create keyed
//   to PHONE and bind its id onto public.users.auth_user_id — the same binding
//   provisionRole performs — so there is one identity and one users row.
//
// WHEN IT IS CALLED
//   From /verify-otp, AFTER the OTP is proven and BEFORE mintSession. Post-proof so no
//   identity is ever created for an unverified phone (no spray from /send-otp).
//
// TRANSPORT / SECURITY
//   admin.createUser({ phone, phone_confirm:true }) is IDENTITY-ONLY: phone_confirm marks
//   the number verified WITHOUT dispatching any SMS — the entire point (off dead Twilio).
//   It uses the SERVICE-ROLE authClient (admin API), never the app data client the rest of
//   the app reads engine/public with. NO OTP value and NO identity secret is logged here.
'use strict';

// Supabase stores phone digits-only ("918757788550"); compare on that normal form.
function phoneDigits(p) {
  return String(p == null ? '' : p).replace(/[^0-9]/g, '');
}

// Find an existing auth identity by phone via a bounded admin.listUsers scan. There is no
// getUserByPhone primitive; this is the HEAL/edge path, not a hot path, so a bounded page
// walk is acceptable. Throws on a listUsers error (surfaced as a 500 by the caller).
async function findAuthUserByPhone(authClient, phone) {
  const want = phoneDigits(phone);
  if (!want) return null;
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await authClient.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const users = (data && data.users) || [];
    const hit = users.find((u) => phoneDigits(u && u.phone) === want);
    if (hit) return hit;
    if (users.length < perPage) break; // last page reached
  }
  return null;
}

// ensureAuthIdentity — guarantee ONE auth identity for `userId`'s phone, bound onto
// public.users.auth_user_id. Idempotent and self-healing.
//   supabase   : app data client (reads/writes public.users) — NOT used for admin ops
//   authClient : service-role client (admin.createUser / admin.listUsers)
//   userId     : public.users.id for this account
//   phone      : E.164 (with leading '+')
// Returns { authUserId, created:boolean, healed:boolean }.
async function ensureAuthIdentity({ supabase, authClient, userId, phone }) {
  if (!userId)     throw new Error('ensureAuthIdentity: userId required');
  if (!authClient) throw new Error('ensureAuthIdentity: authClient required');

  // (0) Already bound? Nothing to do — return the existing identity untouched.
  const { data: u, error: uErr } = await supabase
    .from('users').select('auth_user_id').eq('id', userId).maybeSingle();
  if (uErr) throw new Error(`user lookup failed: ${uErr.message}`);
  if (u && u.auth_user_id) {
    return { authUserId: u.auth_user_id, created: false, healed: false };
  }

  // (1) Not bound — CREATE the identity (no SMS), or HEAL to an existing one.
  let authUserId = null;
  let healed     = false;

  const { data: created, error: createErr } =
    await authClient.auth.admin.createUser({ phone, phone_confirm: true });

  if (createErr) {
    // The phone already owns an identity (a prior half-failed attempt, or a legacy
    // Supabase phone-OTP identity). Re-link that ONE — never mint a second.
    const existing = await findAuthUserByPhone(authClient, phone);
    if (!existing) {
      throw new Error(`identity create failed, no existing identity to heal: ${createErr.message}`);
    }
    authUserId = existing.id;
    healed     = true;
  } else {
    authUserId = created && created.user && created.user.id;
    if (!authUserId) throw new Error('createUser returned no identity id');
  }

  // (2) Bind the single identity onto public.users. One person, one auth user.
  const { error: linkErr } = await supabase
    .from('users').update({ auth_user_id: authUserId }).eq('id', userId);
  if (linkErr) throw new Error(`auth link failed: ${linkErr.message}`);

  return { authUserId, created: !healed, healed };
}

module.exports = { ensureAuthIdentity, findAuthUserByPhone, phoneDigits };
