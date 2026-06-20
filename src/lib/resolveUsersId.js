// src/lib/resolveUsersId.js
// Map a Supabase auth identity (the JWT `sub`, i.e. req.auth.user_id) to the
// public.users.id — the identity seam for Supabase Phone-OTP login.
//
//   Primary:  users.auth_user_id = <supabase auth id>   (phone-OTP + backfilled legacy)
//   Fallback: users.id          = <supabase auth id>     (pre-0063-backfill pinned id)
//
// The fallback is belt-and-suspenders: 0063 backfilled auth_user_id = id for every
// existing user, so the primary already covers legacy accounts. Returns null if the
// identity maps to no user (caller decides the 401/403).
'use strict';

async function resolveUsersId(supabase, authUserId) {
  if (!authUserId) return null;
  const { data } = await supabase
    .from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
  if (data) return data.id;
  const { data: legacy } = await supabase
    .from('users').select('id').eq('id', authUserId).maybeSingle();
  return legacy ? legacy.id : null;
}

module.exports = { resolveUsersId };
