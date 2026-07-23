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

// ── THE INVERSE HOP (TDW_05 ARC M3, F-05.47) ────────────────────────────────
// public.users.id -> the Supabase auth identity. Born because the estate had the
// forward hop and not the backward one, so a caller needing an auth id from a
// users.id had nowhere to go and passed the users.id itself — which is exactly
// what enquiryBinder.js:32 did, and what killed the couple door.
//
// THE TWO PLANES ARE NOT INTERCHANGEABLE AND THE DATA SAYS SO. Founder-run probe,
// 2026-07-24, all three vendors: vendors.user_id is NOT in auth.users (false,
// three-for-three) while users.auth_user_id IS (true, three-for-three), and the
// two never coincide (the_two_happen_to_match false, three-for-three). Before the
// auth mint they WERE the same value and passing either worked; 0063 split them
// and engine.users' FK to auth.users(id) made the difference load-bearing.
//
// Returns null when the user has no auth identity yet — two such rows exist
// (+918595986978, +917982159047), neither owning a vendor today. NULL IS A
// LEGITIMATE ANSWER, not an error: the caller decides, and the caller must not
// hand null onward, because resolveAgentForVendor THROWS on a falsy id and that
// throw is what turned a cabinet write into a dead conversation.
async function resolveAuthUserId(supabase, usersId) {
  if (!usersId) return null;
  const { data } = await supabase
    .from('users').select('auth_user_id').eq('id', usersId).maybeSingle();
  return (data && data.auth_user_id) || null;
}

module.exports = { resolveUsersId, resolveAuthUserId };
