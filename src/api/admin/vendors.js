// src/api/admin/vendors.js
// Admin vendor management — list, create, tier, approve, discover-eligible.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { writeAudit } = require('../../lib/admin/auditLog');
// ── F-10.50 CURED · THE MINT DID NOT NORMALISE THE PHONE ────────────────────
// `src/lib/phone.js` is THE ONE HOME for phone normalisation (hoisted at
// F-04.109 precisely because three divergent copies were splitting one person
// into two rows). It had three callers. The mint I shipped at 800d7a1 was not
// one of them — it stored `String(phone).trim()` verbatim, and I never looked
// for the normaliser. Caught on the founder's own walk.
//
// WHAT IT COST, derived rather than feared:
//   · bare digits landed in users.phone as `9431101193` while every other row
//     is `+91…`;
//   · vendor login enforces /^\+[0-9]{8,15}$/ and matches on exact equality
//     (src/api/vendor/auth.js, symbol sendOtp) — that row is UNREACHABLE;
//   · worse, send-otp self-mints on a phone it does not find, so his first
//     sign-in would create a SECOND users row for the same person. That is
//     exactly the divergence phone.js's own header exists to prevent;
//   · and it partly defeated F-10.47: the collision check is
//     `.eq('phone', cleanPhone)`, so minting bare digits against a stored `+91`
//     row read as VIRGIN, called the RPC, and reached the clobber clause the
//     cure was built to make unreachable.
// The cure is one call, before the lookup and before the RPC, on both species.
const { toE164 } = require('../../lib/phone');
// F-10.59 — the sole writer of the discover column pair (R-P3.4(b)).
const { setDiscoverState } = require('../../lib/vendor/discover');

const VALID_TIERS = ['trial', 'essential', 'signature', 'prestige'];

// ─── GET /api/v2/admin/vendors ──────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('vendors')
    .select(`
      id, business_name, category, city, tier, status, founding_cohort,
      discover_eligible, discover_request_state, created_at,
      users!inner(name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  const vendors = (data || []).map(v => ({
    id:                    v.id,
    name:                  v.business_name || v.users?.name || 'Unnamed',
    category:              v.category,
    city:                  v.city,
    phone:                 v.users?.phone,
    tier:                  v.tier,
    status:                v.status,
    founding_cohort:       v.founding_cohort || false,
    discover_eligible:     v.discover_eligible || false,
    discover_request_state: v.discover_request_state || 'not_requested',
    created_at:            v.created_at,
  }));

  return okRes(res, { vendors, total: vendors.length });
}));

// ─── POST /api/v2/admin/vendors/create ──────────────────────────────────
// ── TDW_10 P3 · THE ONE VENDOR PROVISIONING PATH (R-P3.1, Fork 1 arm (b)) ────
// `POST /api/v2/admin/mint/vendor` is an ALIAS onto this exact handler — see
// src/api/admin/mint.js. There is ONE implementation and the spec's guardrail
// ("a second mint implementation anywhere is a failed session") is satisfied by
// there being one FUNCTION, not by two routes agreeing.
//
// WHAT THE SPEC ASKED FOR AND WHY IT IS NOT WHAT SHIPS. TDW_10_ADMIN_FINAL §P3.1
// says the mint rides "the EXACT provisioning path from 08 P2 (quartet,
// consult_done=false)". DERIVED AT TIP: masterplan row 08 records P2 DEFERRED by
// founder word, so that path was never built; `TDW_08_DEMO_FINAL.md:91`'s "claim
// mints the full account quartet" is unbuilt scope, and the live claim route
// (src/api/demo/vendor.js, POST /:handle/claim) provisions nothing — it files a
// demo_claim_requests row.
//
// THE QUARTET CANNOT BE MINTED HERE, AND THAT IS DESIGN, NOT A DEFECT. Two rows
// are public (users, vendors, born below). The other two are ENGINE plane —
// engine.users + engine.agents, with engine.agent_owner's consult_done — and they
// are born by `resolveAgentForVendor` (src/api/middleware/agentBridge.js), which
// requires a Supabase auth.users id. That identity is created only AFTER an OTP is
// proven, by `ensureAuthIdentity` (src/lib/ensureAuthIdentity.js), whose own header
// states the law it protects: one phone, exactly one auth identity, never minted
// for an unverified number. A mint that manufactured one would break that law to
// satisfy a sentence. So the engine half is born lazily on first authenticated
// touch, and `consult_done=false` is the column's own default
// (docs/db/ENGINE_SCHEMA.md, engine.agent_owner :5) — satisfied by construction
// wherever the row is born.
//
// ── F-10.47 CURED · THE MINT THAT SAID "created" FOR A ROW IT DID NOT CREATE ──
// THIS HANDLER READ: call the RPC unconditionally, patch, `return okRes(res,
// { created: true })`. Against a phone that already had an account it:
//   (1) drove `invite_vendor`'s `on conflict (phone) do update set name =
//       excluded.name` (db/migrations/0003_vendor_onboarding.sql:35-37) and
//       OVERWROTE the existing person's name with the typed business name;
//   (2) fell through the RPC's `on conflict do nothing` to SELECT the existing
//       vendor; and
//   (3) reported `created: true` regardless.
// Founding-lie family — the same species as the demo claim's success-on-failure
// that F-07.37 cured. Witnessed against production: `+919888294440` ("dev", vendor
// 23165e38-…) would have been renamed by a mint that then claimed to have made it.
//
// THE CLOBBER IS NEUTRALIZED FROM THE ROUTE SIDE, not by editing the RPC. The RPC
// is the ONE birth path and three other callers depend on its current shape
// (src/admin/router.js:71, :523); re-authoring a migration's function to fix a
// caller would move the blast radius, not shrink it. Instead: the existing user is
// read FIRST, and when one exists the RPC is either skipped entirely or handed the
// name it already has, so `excluded.name` equals the stored value and the UPDATE
// is a no-op on that column. One path, intact.
async function mintVendor(req, res) {
  const supabase = req.app.locals.supabase;
  const { business_name, phone, category, city, tier } = req.body || {};

  if (!phone || !String(phone).trim()) return errRes(res, 400, 'phone is required.');
  // NORMALISED FIRST — before the existence lookup, so the collision check in
  // (1) compares like with like, and before the RPC, so its ON CONFLICT clause
  // keys on the same string every other door in the estate uses.
  const cleanPhone = toE164(String(phone).trim());
  const cleanName  = business_name ? String(business_name).trim() : '';

  // (1) Who is already here? This read is what makes the collision legible.
  const { data: existingUser, error: lookupErr } = await supabase
    .from('users')
    .select('id, name')
    .eq('phone', cleanPhone)
    .maybeSingle();
  if (lookupErr) return errRes(res, 500, lookupErr.message);

  let existingVendor = null;
  if (existingUser) {
    // ── HARDENING · THIS PROBE SWALLOWED ITS ERROR ──────────────────────────
    // IT READ: `const { data: v } = await supabase…` — no `error`. If the query
    // failed for any reason, `v` came back null, `existingVendor` became null,
    // and `outcome` became 'created' while the RPC's ON CONFLICT DO NOTHING
    // quietly made no rows: a WRONG LABEL over correct data, which is F-10.47's
    // disease surviving in the one field built to cure it.
    //
    // ATTRIBUTED HONESTLY: this was NOT the cause of anything observed. It was
    // proposed as the explanation for a second `created` on the founder's walk,
    // and his own evidence killed that — two distinct target_ids, a deleted row
    // and a re-created one, exactly as he said. The diagnosis was wrong; the
    // swallowed error is real regardless, and it is cured here as hardening
    // rather than left in because its first accusation missed.
    //
    // A check whose failure mode is a silent zero is not a check (protocol §9,
    // the independent-method law) — and the probe one line above this one checks
    // its error, which is what makes the omission legible rather than defensible.
    // FAIL LOUD: the mint refuses rather than mislabelling. A 500 the founder can
    // read beats a success card that names the wrong outcome.
    const { data: v, error: vErr } = await supabase
      .from('vendors')
      .select('id, business_name, category, city, tier, routing_handle')
      .eq('user_id', existingUser.id)
      .maybeSingle();
    if (vErr) return errRes(res, 500, `Could not read the existing account: ${vErr.message}`);
    existingVendor = v || null;
  }

  const outcome = existingVendor ? 'existing' : 'created';

  // (2) Birth, only when there is something to be born. When a users row exists
  // but a vendors row does not, the RPC still runs — that is the case it is FOR —
  // but it is handed the STORED name, never the typed one.
  if (!existingVendor) {
    const { error: rpcError } = await supabase.rpc('invite_vendor', {
      p_phone: cleanPhone,
      p_name:  (existingUser && existingUser.name) || cleanName || 'Vendor',
    });
    if (rpcError) return errRes(res, 400, rpcError.message);
  }

  // (3) The admin-supplied profile fields. These are VENDOR columns; `users.name`
  // is never written here, in either branch. On the `existing` branch a field is
  // written only when the admin actually supplied it, so re-minting a known phone
  // to READ its card cannot blank a category.
  const { data: user } = await supabase
    .from('users').select('id, name').eq('phone', cleanPhone).maybeSingle();
  if (!user) return errRes(res, 500, 'Account was not created.');

  const patch = {};
  if (cleanName) patch.business_name = cleanName;
  if (category)  patch.category      = String(category).trim();
  if (city)      patch.city          = String(city).trim();
  if (tier && VALID_TIERS.includes(tier)) patch.tier = tier;
  if (Object.keys(patch).length) {
    const { error: patchErr } = await supabase
      .from('vendors').update(patch).eq('user_id', user.id);
    if (patchErr) return errRes(res, 500, patchErr.message);
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, category, city, tier, routing_handle, onboarding_state')
    .eq('user_id', user.id)
    .maybeSingle();

  // A-5 · R-P3.2 — audited through the one wrapper, fail-safe.
  await writeAudit(supabase, 'mint_vendor', 'vendor', vendor && vendor.id, {
    outcome, phone: cleanPhone, business_name: cleanName || null, category: category || null,
    city: city || null, tier: patch.tier || null,
  });

  // `created` is preserved as a boolean for any caller that already reads it, and
  // `outcome` carries the fact that boolean could never carry. The success card
  // renders `outcome`; nothing renders `created` alone.
  return okRes(res, {
    created:  outcome === 'created',
    outcome,
    vendor_id: vendor ? vendor.id : null,
    // NULL on a fresh mint, and that is the truth, not a gap. `routing_handle` is
    // written at the END of conversational onboarding (src/agent/onboarding.js,
    // symbol `finishOnboarding`), never at provision. The success card says so in
    // words rather than rendering an empty field. Minting a handle here would be
    // the second implementation Fork 1 arm (c) was refused for.
    routing_handle: vendor ? vendor.routing_handle : null,
    owner_name:     user.name || null,
  });
}

router.post('/create', requireAdmin, asyncHandler(mintVendor));

// ─── PATCH /api/v2/admin/vendors/:id/tier ───────────────────────────────
router.patch('/:vendorId/tier', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { tier } = req.body;

  if (!VALID_TIERS.includes(tier)) return errRes(res, 400, `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}.`);

  const { error } = await supabase
    .from('vendors')
    .update({ tier })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { tier });
}));

// ─── PATCH /api/v2/admin/vendors/:id/approve ────────────────────────────
router.patch('/:vendorId/approve', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Toggle status: active <-> paused. "Approve" sets active, re-approving toggles.
  const { data: vendor, error: fetchErr } = await supabase
    .from('vendors')
    .select('status')
    .eq('id', req.params.vendorId)
    .single();

  if (fetchErr) return errRes(res, 404, 'Vendor not found.');

  const newStatus = vendor.status === 'active' ? 'paused' : 'active';
  const { error } = await supabase
    .from('vendors')
    .update({ status: newStatus })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { status: newStatus });
}));

// ─── PATCH /api/v2/admin/vendors/:id/discover-eligible ──────────────────
router.patch('/:vendorId/discover-eligible', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendor, error: fetchErr } = await supabase
    .from('vendors')
    .select('discover_eligible')
    .eq('id', req.params.vendorId)
    .single();

  if (fetchErr) return errRes(res, 404, 'Vendor not found.');

  // ── F-10.59 · THE FOUNDER'S FIRST SPECIMEN ─────────────────────────────────
  // THIS READ: `.update({ discover_eligible: newVal })` — eligibility only. He
  // pressed 「 Remove from Discover 」 here, and Swati's screen went on reading
  // 「 You're on Discover. Your work is live 」 off a state this door never
  // touched, while the couples' feed — which filters on eligibility — could no
  // longer see her.
  // The pair now moves together. Turning Discover OFF is a revocation and says
  // so; turning it ON from this door is an approval and says so, which is also
  // why the state can no longer read 'approved' for a vendor nobody can see.
  const newVal = !vendor.discover_eligible;
  const wrote = await setDiscoverState(supabase, req.params.vendorId, {
    eligible: newVal,
    // F-10.61 · THE STORED WORD IS THE SCHEMA'S. `'hidden'` here 500'd on the
    // founder's thumb — `vendors.discover_request_state` has carried a CHECK
    // constraint since 0039 and does not know that word. The BUTTON says Hide,
    // the vendor's screen says Hidden, the chip says HIDDEN; the column says
    // `'revoked'`, which is what it has always said for this act. Zero DDL,
    // founder-ruled. Full reasoning at DISCOVER_STATES in
    // src/lib/vendor/discover.js.
    state:    newVal ? 'approved' : 'revoked',
  });
  if (!wrote.ok) return errRes(res, 500, wrote.error);
  await writeAudit(supabase, newVal ? 'discover_grant' : 'discover_hide', 'vendor', req.params.vendorId,
    { via: 'makers_toggle' });
  return okRes(res, { discover_eligible: newVal, discover_request_state: wrote.state });
}));

// ─── PATCH /api/v2/admin/vendors/:id/dreamai ────────────────────────────
// Toggle a vendor's DreamAi PWA access (briefing_enabled serves as the gate).
router.patch('/:vendorId/dreamai', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { access } = req.body;

  const { error } = await supabase
    .from('vendors')
    .update({ briefing_enabled: !!access })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { dreamai_access: !!access });
}));

// ── RETIRED · PATCH /api/v2/admin/vendors/:id/revoke (founder-ruled) ────────
// THE ROUTE READ:
//     router.patch('/:vendorId/revoke', requireAdmin, asyncHandler(async (req, res) => {
//       await supabase.from('vendors')
//         .update({ status: 'paused', discover_eligible: false })
//         .eq('id', req.params.vendorId);
//       return okRes(res, { revoked: true });
//     }));
//
// IT WAS A LABEL THAT OUTRAN ITS ACT. The Makers row called it 「 Revoke Access 」
// and it revoked no access at all. Derived across the estate before the founder
// ruled: `vendors.status` has EXACTLY ONE consumer — the morning-briefing cron at
// src/cron.js, `.eq('status', 'active')`. Login does not read it
// (src/api/vendor/auth.js), the app does not read it (resolveVendor), the WhatsApp
// lane does not read it (vendorInbound). So pressing it took a vendor off Discover
// and stopped her good-morning message, while she kept her account, her leads, her
// portfolio and her AI — and the founder would have believed he had cut her off.
//
// FOUNDER-RULED, on his own question: 「 why suspend any vendor. i can delete the
// vendor. suspension as a practice itself 」 · 「 revoke doesnt serve any purpose 」.
// The verb is DELETED rather than made true. A half-built kill switch on your own
// admin is the thing most likely to be trusted at the wrong moment.
//
// NOTHING WRITES `vendors.status` ANY MORE. The column and the cron's filter stand
// untouched. A vendor whose status this route paused before its deletion needs a
// one-line repair — handed to the founder in the handover, never performed here.

// ── DELETE /api/v2/admin/vendors/:vendorId ────────────────────────────────────
// Hard delete. Cascades to all vendor data via FK constraints.
// Requires confirmation — caller must pass { confirm: true } in body.
router.delete('/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!req.body?.confirm) return errRes(res, 400, 'Pass { confirm: true } to confirm deletion.');

  // Delete the users row — cascades to vendors + all vendor data
  const { data: vendor } = await supabase
    .from('vendors').select('user_id').eq('id', req.params.vendorId).maybeSingle();
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const { error } = await supabase.from('users').delete().eq('id', vendor.user_id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
// The mint alias mounts THIS function, not a copy of it (R-P3.1, one path).
module.exports.mintVendor = mintVendor;
