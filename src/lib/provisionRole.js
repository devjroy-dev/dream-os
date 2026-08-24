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

// THE EMPTINESS DEFINITION IS NOT THIS FILE'S, AND NOW IT IS NOT THIS FILE'S
// COPY EITHER. `textPresent` at src/lib/onboardingPredicate.js is the one home
// — "a text field is present when it holds a non-empty, non-whitespace string"
// — the SAME rule `brideComplete` refuses by at the onboarding form and the
// same rule both send-otp doors now coerce by. The door, the form and this
// seam must not disagree about what a name is.
//
// THE DUPLICATE IS RETIRED WITH ITS REASON, NOT SILENTLY DELETED. Until
// 2026-08-25 this file carried a local `namePresent` and a paragraph saying
// why: M-BRIDE-NAME's charter fenced `onboardingPredicate.js` at ZERO BYTES,
// `textPresent` was not exported, and an import would have cost a byte on a
// file that sitting was ordered not to touch. That paragraph ended with its
// own instruction — "if a later sitting un-fences that file and exports
// `textPresent`, THIS FUNCTION DIES and the import replaces it." R-37.19
// un-fenced it for exactly that one line. This is that death, executed as
// written. The tension is closed, not carried.
const { textPresent } = require('./onboardingPredicate');

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
  // R-37.14 — set ONLY on path (b), and only when the row had never completed a
  // verified login. Path (a) matched BY `auth_user_id`, so by construction that
  // row has one and can never promote. See the R-37.14 block below.
  let promoteUnverified = false;
  const { data: byAuth } = await supabase
    .from('users').select('id, name').eq('auth_user_id', authUserId).maybeSingle();
  if (byAuth) {
    usersId = byAuth.id;
    currentName = byAuth.name ?? null;
    landedOnExisting = true;
  }

  // b) phone-fallback re-bind (legacy account migrating to phone-OTP)
  //    The projection carries `auth_user_id` for R-37.14's marker and for no
  //    other reason — it is READ, never compared to the caller's, because the
  //    question is "has ANY verified login ever claimed this row", not "was it
  //    this one".
  if (!usersId && phone) {
    const { data: byPhone } = await supabase
      .from('users').select('id, name, auth_user_id').eq('phone', phone).maybeSingle();
    if (byPhone) {
      promoteUnverified = (byPhone.auth_user_id ?? null) === null;
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
  // The `!textPresent(currentName)` term is the never-clobber guarantee and is
  // the cell the bench mutates: loosen it and a stale signup-form value would
  // overwrite a corrected name on every subsequent login. (It read
  // `namePresent` until R-37.19 retired the duplicate; the guarantee is the
  // same sentence, now read from its one home.)
  //
  // The `textPresent(name)` term also means NO WRITE IS ISSUED AT ALL when no
  // name was presented — provision runs on every login, and a silent update on
  // each one would move `updated_at` for nothing.
  //
  // ── R-37.14 · THE PROMOTION ARM [F-05.89, founder-ratified 2026-08-25] ─────
  // F-05.89 gave the send-otp doors a name at mint, so a row can now arrive
  // here ALREADY NAMED by a byte nobody verified — anyone can type a name
  // beside a phone they do not own and never complete the OTP. Under plain
  // never-clobber that unverified byte would be permanent, and a mistyped
  // pre-name would outlive the real owner's first real login.
  //
  // THE MECHANISM THIS SENTENCE STANDS ON, NAMED SO ITS NEXT SITTING MUST
  // RE-READ THIS LINE [F-06.85]: `promoteUnverified` is TRUE only when path (b)
  // found the row with `auth_user_id` NULL — the estate's durable mark of
  // "no verified login has ever claimed this row". It is durable because
  // `users_auth_user_id_key` is UNIQUE **WHERE (auth_user_id IS NOT NULL)**
  // (docs/db/PUBLIC_SCHEMA.md, public.users indexes) — a partial unique, so
  // NULL is a legal shared value for every never-verified row and a set value
  // is unique to one identity. The rebind three lines above SETS it. The marker
  // therefore flips in the same breath as the promotion, which is what makes
  // this fire AT MOST ONCE PER ROW; never-clobber resumes forever after.
  //
  // ITS RADIUS IS WIDER THAN THE DOORS, PRICED AND ACCEPTED. `coupleIdentity.js`,
  // `vendorInbound.js` and `brideInbound.js` also mint `auth_user_id`-NULL rows,
  // carrying WhatsApp PROFILE names rather than typed ones. Those rows promote
  // too, and that is the ruling rather than an overshoot. The authority, not
  // just the rule, so the next reader need not go looking for it:
  //     typed beats scraped — founder word 2026-08-25
  // A name a person typed at a verified login outranks one scraped off a
  // handset's profile field, and the marker flips at that same moment so the
  // overwrite can never repeat.
  //
  // The `name !== currentName` term keeps the promotion from issuing a write
  // that changes nothing — the common case, where the same person typed the
  // same name at both doors, must not move `updated_at`.
  const nameWins = textPresent(name) && (
    !textPresent(currentName) ||
    (promoteUnverified && name !== currentName)
  );
  if (landedOnExisting && nameWins) {
    const { error: fillErr } = await supabase
      .from('users').update({ name }).eq('id', usersId);
    if (fillErr) throw new Error(`name fill failed: ${fillErr.message}`);
    currentName = name;
  }

  // c) fresh user
  //    The `if (name)` guard is preserved BYTE-FOR-BYTE. Both callers already
  //    coerce with `.trim() || null`, so it is equivalent to `textPresent` at
  //    every live call site, and this path was verified working: existing
  //    behaviour is sacred (§8 SCOPE LAW). (Cited as `namePresent` until
  //    R-37.19 retired that duplicate onto its one home.)
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
