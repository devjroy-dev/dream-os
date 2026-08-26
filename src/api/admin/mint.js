// src/api/admin/mint.js — TDW_10 ADMIN P3 · the one-tap birth door.
//
// ── THIS FILE MOUNTS HANDLERS; IT DOES NOT IMPLEMENT THEM (R-P3.1) ───────────
// The spec's §P3.1 names `POST /api/v2/admin/mint/vendor|couple`, and the
// guardrail in §3 says a second mint implementation ANYWHERE is a failed session.
// Both sentences are satisfied by importing the FUNCTIONS that already own those
// births and mounting them at the spec's paths:
//
//     /api/v2/admin/mint/vendor  ->  admin/vendors.js  symbol mintVendor
//     /api/v2/admin/mint/couple  ->  admin/couples.js  symbol mintCouple
//
// Not a re-post, not a proxy fetch, not a copied body — the same function object,
// reached by two routes. A bench asserts identity by `===` rather than by
// comparing behaviour, because two implementations that agree today is exactly
// what the guardrail is about (see scripts/b10_p3_mint_deck_bench.js §1).
//
// PATH-OVER-RANGE (protocol §9): the two pointers above cite file and SYMBOL, not
// a line, because a line range in a durable comment drifts silently.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { writeAudit } = require('../../lib/admin/auditLog');

const { mintVendor } = require('./vendors');
const { mintCouple } = require('./couples');

const { sendWa, WaTemplateNotApprovedError, WaOptedOutError,
        WaLineNotConfiguredError } = require('../../lib/sendWa');
const { logWaSend } = require('../../lib/waSendLog');                            // M-TELEMETRY R-37.48
const { getTemplate, isApproved } = require('../../lib/templates');

// ─── POST /api/v2/admin/mint/vendor ─────────────────────────────────────
router.post('/vendor', requireAdmin, asyncHandler(mintVendor));

// ─── POST /api/v2/admin/mint/couple ─────────────────────────────────────
router.post('/couple', requireAdmin, asyncHandler(mintCouple));

// ─── POST /api/v2/admin/mint/welcome/:vendorId ──────────────────────────
// ── R-P3.3 · WIRED AND DARK, AND THE GATE IS THE MECHANISM ──────────────────
// The spec's `Send welcome` rides sendWa "governance-respecting". DERIVED AT TIP
// at the P3 read-first: there was NO welcome template. `src/lib/templates.js`
// carried twelve entries and `docs/TEMPLATES.md` zero mentions of one — the
// button had no byte to send.
//
// This delivery adds the `vendor_welcome` REGISTRY ENTRY at status 'draft'. The
// founder files it manually in Meta Business Manager (the tdw_enquiry_brief_vendor
// precedent — a founder act independent of any push), and flips one field when
// Meta approves. Until then `sendWa` REFUSES: its gate reads `isApproved`
// (src/lib/sendWa.js, symbol sendWa) and throws WaTemplateNotApprovedError before
// any dispatch. That refusal is the F-08.17 shape the estate already proved on
// `demo_lead_alert` — a real send refused with no template spent.
//
// NOTHING HERE RE-IMPLEMENTS THE GATE. This route does not check `isApproved`
// before calling `sendWa` — it CALLS sendWa and reports what sendWa decided. A
// door that pre-checks the gate is a second copy of the gate, and the day the two
// disagree is the day the pre-check wins for the wrong reason. `isApproved` is
// imported below for the STATUS field only (what the card renders before you tap),
// never as a branch around the send.
router.post('/welcome/:vendorId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.params.vendorId;

  const { data: vendor, error: vErr } = await supabase
    .from('vendors')
    .select('id, business_name, user_id, users!inner(name, phone)')
    .eq('id', vendorId)
    .maybeSingle();
  if (vErr) return errRes(res, 500, vErr.message);
  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  const to   = vendor.users && vendor.users.phone;
  const name = (vendor.users && vendor.users.name) || vendor.business_name || 'there';
  if (!to) return errRes(res, 400, 'This vendor has no phone on file.');

  try {
    const out = await sendWa({
      line: 'vendor',
      to,
      templateKey: 'vendor_welcome',
      // ONE variable. The two-variable draft was killed at the chair's copy ruling
      // on a copy-law ground stronger than the aesthetic one: a second variable
      // reading "Your account manager is {{2}}" would name either a persona —
      // forbidden in any vendor-facing byte — or a human who does not exist.
      vars: [name],
      supabase,
    });
    // M-TELEMETRY R-37.48. The audit row records the DECISION; this line records
    // the TRANSPORT. They are different facts and the audit has never carried a
    // wamid, so a welcome that Meta accepted and then rejected looked identical
    // in the audit to one that arrived.
    logWaSend('vendor', { site: 'mint:welcome', mode: 'template', templateKey: 'vendor_welcome', to, out, ctx: vendorId });
    await writeAudit(supabase, 'send_welcome', 'vendor', vendorId, { outcome: 'sent', to });
    return okRes(res, { sent: true });
  } catch (e) {
    logWaSend('vendor', { site: 'mint:welcome', mode: 'template', templateKey: 'vendor_welcome', to, err: e, ctx: vendorId });
    // Every refusal is REPORTED with the reason the transport gave, never
    // collapsed into a generic failure. A vendor-facing send that quietly did
    // nothing is the founding-lie family; so is an admin screen that says "sent".
    const t = getTemplate('vendor_welcome');
    let reason = 'not_sent';
    let human  = 'Could not send the welcome message.';

    if (e instanceof WaTemplateNotApprovedError) {
      reason = 'template_not_approved';
      human  = 'Welcome template is not approved by Meta yet.';
    } else if (e instanceof WaOptedOutError) {
      reason = 'opted_out';
      human  = 'This number has opted out of messages.';
    } else if (e instanceof WaLineNotConfiguredError) {
      reason = 'line_not_configured';
      human  = 'The vendor WhatsApp line is not configured on this service.';
    }

    await writeAudit(supabase, 'send_welcome', 'vendor', vendorId, {
      outcome: 'refused', reason, to, template_status: t ? t.status : null,
    });
    // 200, not 5xx: the REFUSAL is a correct outcome of a working gate, not a
    // server fault, and the mint that preceded it stands. The card renders
    // `welcome.reason`; it never renders a success it did not get.
    return okRes(res, { sent: false, reason, message: human });
  }
}));

// ─── GET /api/v2/admin/mint/welcome-status ──────────────────────────────
// What the mint sheet reads to decide whether `Send welcome` is offered live or
// offered dark with its honest line. The SERVER carries the answer so the pwa
// never holds a second opinion about Meta's verdict — the same shape
// `min_portfolio_images` uses for the photo floor.
router.get('/welcome-status', requireAdmin, asyncHandler(async (req, res) => {
  const t = getTemplate('vendor_welcome');
  return okRes(res, {
    template_key: 'vendor_welcome',
    name:         t ? t.name : null,
    status:       t ? t.status : null,
    approved:     isApproved('vendor_welcome'),
  });
}));

module.exports = router;
