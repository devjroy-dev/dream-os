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
//
// ═══════════════════════════════════════════════════════════════════════════
// F-OB.13 — WHY THE NAME IS FILLED HERE, ON PATHS (a) AND (b) [R-35.13]
// ═══════════════════════════════════════════════════════════════════════════
// Until 2026-08-18 the typed name was written on path (c) ONLY. Paths (a) and
// (b) both landed on an EXISTING users row and neither wrote it: (a) never
// touched `name` at all, and (b)'s re-bind update carried `{ auth_user_id }`
// and nothing else. A bride who TYPED HER NAME at the signup door could
// therefore land nameless, and no gate at that door could have saved her —
// the byte was being discarded server-side, after the input had done its job.
// The founder's census of 2026-08-18 measured the result: 20 of 38 couples on
// file with no name, 19 of the 35 that arrived in August.
//
// THE FILL IS `WHEN-PROVIDED-AND-CURRENTLY-NULL`, AND THE SECOND HALF IS
// CONSTITUTIVE, NOT DEFENSIVE. Three writers already overwrite `users.name`
// deliberately — `src/api/vendor/me.js`, `src/api/vendor/onboarding.js`, and
// `src/agent/onboarding.js` — and provision runs on EVERY login, not only at
// signup. A fill that clobbered would let a stale value in a signup form
// silently overwrite a name its owner had since corrected. It cannot: it
// writes only into absence. That is why both lookups now `select('id, name')`
// — the current value must be READ before the emptiness can be asked about,
// and a fill that cannot see what it might destroy is not a when-null fill.
//
// BOTH LANES, DELIBERATELY [R-35.13]. `provisionRole` has exactly two callers
// — `src/api/couple/auth.js` and `src/api/vendor/auth.js` — and both already
// pass `name`. The founder's charge was the bride's; the vendor lane inherits
// the same cure because the defect was never lane-specific. The overshoot is
// benign by construction (a fill that never clobbers cannot disturb the three
// overwriters above) and is STATED as blast radius in this sitting's handover
// rather than left to be discovered.
//
// WHAT THIS DOES NOT CURE, so nobody reads more into it than it does: the
// EXISTING stock of nameless rows. This writes only when a name is presented,
// and a bride who never presents one is untouched by it. That stock is fork
// (b)'s — the dark WhatsApp onboarding gate at `src/lib/laneFlags.js` — and it
// stays the founder's separate word.
'use strict';

// THE EMPTINESS DEFINITION IS NOT THIS FILE'S. It mirrors `textPresent` at
// src/lib/onboardingPredicate.js:50-52 — "a text field is present when it holds
// a non-empty, non-whitespace string" — which is the SAME rule `brideComplete`
// uses to refuse at the onboarding form. The door and the form must not
// disagree about what a name is; a bride whose name is one space has not told
// us her name at either.
//
// IT IS DUPLICATED RATHER THAN IMPORTED, AND THAT IS A DECLARED TENSION WITH
// THE ONE-HOME LAW. M-BRIDE-NAME's charter fences `onboardingPredicate.js` at
// ZERO BYTES ("verified working, therefore untouched"), and `textPresent` is
// not in its export list — so importing it would require a byte on a file this
// sitting was ordered not to touch. The explicit fence wins over the general
// law, the duplication is named here rather than hidden, and the handover
// carries it forward: if a later sitting un-fences that file and exports
// `textPresent`, THIS FUNCTION DIES and the import replaces it.
function namePresent(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

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
  //    `name` joins the projection for the when-null fill below — see the
  //    F-OB.13 block in this file's header.
  let usersId = null;
  let currentName = null;
  let landedOnExisting = false;
  const { data: byAuth } = await supabase
    .from('users').select('id, name').eq('auth_user_id', authUserId).maybeSingle();
  if (byAuth) {
    usersId = byAuth.id;
    currentName = byAuth.name ?? null;
    landedOnExisting = true;
  }

  // b) phone-fallback re-bind (legacy account migrating to phone-OTP)
  if (!usersId && phone) {
    const { data: byPhone } = await supabase
      .from('users').select('id, name').eq('phone', phone).maybeSingle();
    if (byPhone) {
      const { error: rebindErr } = await supabase
        .from('users').update({ auth_user_id: authUserId }).eq('id', byPhone.id);
      if (rebindErr) throw new Error(`re-bind failed: ${rebindErr.message}`);
      usersId = byPhone.id;
      currentName = byPhone.name ?? null;
      landedOnExisting = true;
    }
  }

  // ── F-OB.13 THE FILL ──────────────────────────────────────────────────────
  // Reached ONLY when (a) or (b) landed on an existing row. Path (c) writes the
  // name at insert and is deliberately untouched — it was never the defect.
  //
  // The `!namePresent(currentName)` term is the never-clobber guarantee and is
  // the cell the bench mutates: loosen it and a stale signup-form value would
  // overwrite a corrected name on every subsequent login.
  //
  // The `namePresent(name)` term also means NO WRITE IS ISSUED AT ALL when no
  // name was presented — provision runs on every login, and a silent update on
  // each one would move `updated_at` for nothing.
  if (landedOnExisting && namePresent(name) && !namePresent(currentName)) {
    const { error: fillErr } = await supabase
      .from('users').update({ name }).eq('id', usersId);
    if (fillErr) throw new Error(`name fill failed: ${fillErr.message}`);
    currentName = name;
  }

  // c) fresh user
  //    The `if (name)` guard is preserved BYTE-FOR-BYTE. Both callers already
  //    coerce with `.trim() || null`, so it is equivalent to `namePresent` at
  //    every live call site, and this path was verified working: existing
  //    behaviour is sacred (§8 SCOPE LAW).
  if (!usersId) {
    const ins = { auth_user_id: authUserId };
    if (phone) ins.phone = phone;
    if (name)  ins.name  = name;
    const { data: created, error } = await supabase
      .from('users').insert(ins).select('id, name').single();
    if (error) throw new Error(`users provision failed: ${error.message}`);
    usersId = created.id;
    currentName = created.name ?? null;
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

  // `name` is the POST-WRITE witness, and that is the whole point of returning
  // it [F-OB.14]. `verify-otp` already returns a name (couple/auth.js:337-345)
  // but reads it BEFORE provision runs — so for a bride who has just typed one,
  // that value is null while this one is her name. The landing screen's
  // onboarding routing asks "does she have a name NOW", and only this answers.
  return {
    user_id: usersId,
    role_id: roleRow.id,
    pin_set: !!roleRow.pin_hash,
    name: currentName ?? null,
  };
}

module.exports = { provisionRole };
