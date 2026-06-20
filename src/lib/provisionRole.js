// src/lib/provisionRole.js
// Provision the public.users + role row for a Supabase-AUTHENTICATED identity.
// Called AFTER the browser has completed Supabase Phone-OTP (signInWithOtp/verifyOtp);
// the route is behind requireAuth, so authUserId is the VERIFIED Supabase auth id —
// never caller-supplied. Returns ids only (no tokens: Supabase already minted the
// session client-side in Path 1).
//
// Identity binding (idempotent, with the phone-fallback re-bind):
//   a) users WHERE auth_user_id = authUserId            -> already linked, use it
//   b) else users WHERE phone = phone -> RE-BIND          -> set auth_user_id = authUserId
//        This rescues a legacy account (created under the old pinned model with an
//        email-based auth user and NO phone): the first phone-OTP login finds the row
//        by phone and binds it to the new Supabase identity. No fork, no data loss.
//   c) else INSERT a fresh users row linked to authUserId
// Then find-or-create the role row (vendors|couples) for that users.id.
'use strict';

async function provisionRole(supabase, { authUserId, phone, name, role }) {
  if (!authUserId) throw new Error('authUserId required');
  // Supabase returns phone digits-only (e.g. "918757788550"); the rest of the
  // system stores/looks up E.164 WITH the leading '+'. Normalize before any
  // write or phone lookup so the new flow stays consistent with pin-status,
  // the old rows, and every '+'-keyed query.
  if (phone) {
    const digits = String(phone).replace(/[^0-9]/g, '');
    phone = digits ? '+' + digits : null;
  }
  const roleTable = role === 'couple' ? 'couples' : 'vendors';

  // a) already linked to this Supabase identity
  let usersId = null;
  const { data: byAuth } = await supabase
    .from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
  if (byAuth) usersId = byAuth.id;

  // b) phone-fallback re-bind (legacy account migrating to phone-OTP)
  if (!usersId && phone) {
    const { data: byPhone } = await supabase
      .from('users').select('id').eq('phone', phone).maybeSingle();
    if (byPhone) {
      const { error: rebindErr } = await supabase
        .from('users').update({ auth_user_id: authUserId }).eq('id', byPhone.id);
      if (rebindErr) throw new Error(`re-bind failed: ${rebindErr.message}`);
      usersId = byPhone.id;
    }
  }

  // c) fresh user
  if (!usersId) {
    const ins = { auth_user_id: authUserId };
    if (phone) ins.phone = phone;
    if (name)  ins.name  = name;
    const { data: created, error } = await supabase
      .from('users').insert(ins).select('id').single();
    if (error) throw new Error(`users provision failed: ${error.message}`);
    usersId = created.id;
  }

  // role row — find or create
  let { data: roleRow } = await supabase
    .from(roleTable).select('id, pin_hash').eq('user_id', usersId).maybeSingle();
  if (!roleRow) {
    const { data: createdRole, error: rErr } = await supabase
      .from(roleTable).insert({ user_id: usersId, onboarding_state: 'new' })
      .select('id, pin_hash').single();
    if (rErr) throw new Error(`${roleTable} provision failed: ${rErr.message}`);
    roleRow = createdRole;
  }

  return { user_id: usersId, role_id: roleRow.id, pin_set: !!roleRow.pin_hash };
}

module.exports = { provisionRole };
