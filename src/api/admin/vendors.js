// src/api/admin/vendors.js
// Admin vendor management — list, create, tier, approve, discover-eligible.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { writeAudit } = require('../../lib/admin/auditLog');

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
  const cleanPhone = String(phone).trim();
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
    const { data: v } = await supabase
      .from('vendors')
      .select('id, business_name, category, city, tier, routing_handle')
      .eq('user_id', existingUser.id)
      .maybeSingle();
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

  const newVal = !vendor.discover_eligible;
  const { error } = await supabase
    .from('vendors')
    .update({ discover_eligible: newVal })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { discover_eligible: newVal });
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

// ─── PATCH /api/v2/admin/vendors/:id/revoke ─────────────────────────────
router.patch('/:vendorId/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('vendors')
    .update({ status: 'paused', discover_eligible: false })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { revoked: true });
}));

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
