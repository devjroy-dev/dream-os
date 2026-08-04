// src/lib/templates.js — Meta WhatsApp message-template registry (Block 05, P2).
//
// TRANSPORT (P-06.T, settled 2026-07-18): Meta WhatsApp Cloud API, DIRECT, TDW as
// Tech Provider on its own WABA. A Meta template is referenced by its NAME + LANGUAGE
// on the WABA — that pair is the identity. There is deliberately NO twilioTemplateSid /
// Content SID here: the webhook spec's `twilioTemplateSid` field is stale and dropped.
//
// Each entry:
//   key        — the registry key (what callers pass as templateKey)
//   name       — the Meta template name (submitted to the WABA)
//   language   — the Meta language code the template is filed under
//   line       — 'bride' | 'vendor' | 'marketing' (sendWa resolves FROM by this)
//   category   — 'UTILITY' | 'MARKETING' (Meta category)
//   variables  — ordered semantic names; body {{1}} = variables[0], {{2}} = variables[1], …
//   body       — the exact body filed with Meta (kept in sync with docs/TEMPLATES.md)
//   status     — 'draft' | 'submitted' | 'pending' | 'approved'
//                ('pending' added TDW_07 P1 for `demo_lead_alert` — filed with Meta,
//                 awaiting its word. That wait ENDED: Meta approved tdw_demo_lead_alert
//                 on 2026-07-29 at ~17:31 UTC, Utility retained, and TDW_07 P2 flipped
//                 the field. The value survives in this enum because the state is real
//                 and the next template filed will pass through it. The gate is unchanged
//                 — it tests `=== 'approved'` and nothing else, so every non-approved
//                 value refuses identically. The enum is documentation; the gate is the
//                 mechanism, and only the gate decides.)
//                 [F-06.85: this paragraph is conditioned on a MECHANICAL fact — Meta's
//                  review state — so it is re-read whenever that fact moves. It has moved
//                  once, at TDW_07 P2. Mechanism: `isApproved` at the bottom of this file.]
//                sendWa will ONLY send a business-initiated message when status==='approved'.
//                All six ship 'draft'; the founder flips each to 'approved' after Meta approves.
//
// Bodies are single-line by design (no '\n' → no double-line-break rejection), no variable
// is adjacent to another, and none begins/ends a body — see docs/TEMPLATES.md §1.

'use strict';

const TEMPLATE_LANGUAGE = process.env.WA_TEMPLATE_LANGUAGE || 'en';

const TEMPLATES = {
  marketing_opener: {
    key: 'marketing_opener',
    name: 'tdw_marketing_opener',
    language: TEMPLATE_LANGUAGE,
    line: 'marketing',
    category: 'MARKETING',
    variables: ['name'],
    // Couple-facing agent is named Mira (see TEMPLATES.md §5). Filed 2026-07-19.
    body:
      "Hi {{1}}, this is Mira from The Dream Wedding. We keep your vendors, payments, " +
      "and timeline in one place. Reply here and I'll show you how it would work for " +
      "your wedding. Reply STOP to opt out.",
    status: 'approved',
  },

  morning_nudge_vendor: {
    key: 'morning_nudge_vendor',
    name: 'tdw_morning_nudge_vendor',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'summary'],
    body:
      "Good morning {{1}}. Here's your day: {{2}}. Reply STOP MORNINGS to pause these updates.",
    status: 'approved',
  },

  morning_nudge_bride: {
    key: 'morning_nudge_bride',
    name: 'tdw_morning_nudge_bride',
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'UTILITY',
    variables: ['name', 'summary'],
    // First-person "Here's where things stand" is Mira's voice (couple-facing agent).
    body:
      "Good morning {{1}} \uD83C\uDF38 Here's where things stand for your wedding: {{2}}. " +
      "Reply STOP MORNINGS anytime to pause.",
    status: 'approved',
  },

  crew_assignment: {
    key: 'crew_assignment',
    name: 'tdw_crew_assignment',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['member', 'assignment', 'link'],
    body:
      "Hi {{1}}, you're on the crew for {{2}}. Open your crew page for the full details " +
      "and checklist: {{3}} — reply here if anything's unclear.",
    status: 'approved',
  },

  payment_reminder: {
    key: 'payment_reminder',
    // Meta name is tdw_payment_due (NOT tdw_payment_reminder) to avoid colliding with the
    // pre-existing approved tdw_payment_reminder (4-var legacy) already on the WABA.
    // Registry KEY stays payment_reminder — callers are unaffected.
    name: 'tdw_payment_due',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['milestone', 'due'],
    body:
      "Reminder: {{1}} is due {{2}}. Reply PAID once it lands and I'll update your books.",
    status: 'approved',
  },

  demo_invite: {
    key: 'demo_invite',
    name: 'tdw_demo_invite',
    language: TEMPLATE_LANGUAGE,
    line: 'marketing',
    // Approved as UTILITY on 2026-07-19 (tightened copy held). If Meta ever reclassifies
    // it to MARKETING later, flip this to 'MARKETING' to keep the registry truthful.
    category: 'UTILITY',
    variables: ['name', 'claim_link'],
    // Tightened to earn Utility: "set up / access your account" not "explore / take a look".
    // First-person "reply here if you need any help" is Mira's voice (couple-facing agent).
    body:
      "Hi {{1}}, your demo workspace has been set up and is ready. Open it here to access " +
      "your account: {{2}} — reply here if you need any help.",
    status: 'approved',
  },

  // TDW_07 · D-6 · the sitting-one rider. The demo-lead relay: a couple enquires on a
  // demo card, and the unregistered vendor hears about it on WhatsApp with a claim link.
  // AUTHORED AND SUBMITTED IN SITTING ONE regardless of phase progress, because Meta's
  // approval latency must never sit on P5's critical path (P-06.T clause 5, the same
  // reason all six Block 05 bodies were filed same-day).
  //
  // TRANSPORT: submitted to META, not Twilio. The spec's D-4/P5 wording ("submitted to
  // Twilio same day") predates P-06.T and the CE-36 seal and is HISTORICAL — Twilio is
  // fallback-only at zero balance, and M2b deleted the transport outright (CE-62).
  //
  // LINE: 'marketing' — it is outreach to a business that has not signed up. It rides
  // MARKETING_PHONE_NUMBER_ID via sendWa's phoneNumberIdFor (sendWa.js:128) and is
  // therefore subject to the STOP gate and the 25/day marketing governance, per spec §3.
  //
  // CATEGORY 'UTILITY' follows the demo_invite precedent (:97 above), which cleared as
  // UTILITY on 2026-07-19 with "set up / access your account" phrasing: this body is the
  // same shape — an account that exists, an enquiry that is waiting, a link to reach it.
  // If Meta reclassifies it MARKETING, flip this one field to keep the registry truthful
  // (the demo_invite comment records that same escape hatch).
  //
  // COMPLIANCE, checked against docs/TEMPLATES.md §1 line by line: variables numbered
  // 1..3 with no gaps · the body neither BEGINS nor ENDS with a variable · no two
  // variables adjacent · single line, no '\n' anywhere. The spec's draft body opened on
  // {Name} and would have been filed against our own rule; the founder's veto took
  // draft (a), which does not.
  //
  // STATUS 'pending' — HONEST. Meta has not spoken. sendWa's gate is `isApproved`
  // TDW_07 P2 — META HAS SPOKEN. Approved 2026-07-29 ~17:31 UTC, category UTILITY
  // RETAINED (dashboard state "Active – Quality pending"; the quality tag is merely
  // unsent-yet and is not an approval condition). `status` flips to 'approved' below and
  // `sendWa`'s gate now PASSES this template. The category byte is untouched, as ruled.
  // The registry still never claims a review outcome it has not been told — it was told.
  // [F-06.85: conditioned on Meta's review state; mechanism = isApproved.]
  demo_lead_alert: {
    key: 'demo_lead_alert',
    name: 'tdw_demo_lead_alert',
    language: TEMPLATE_LANGUAGE,
    line: 'marketing',
    category: 'UTILITY',
    variables: ['name', 'month', 'claim_link'],
    // FOUNDER-VETOED 2026-07-29, draft (a), verbatim 「 1. the first one 」.
    body:
      "Hi {{1}}, a couple just asked about your work for their {{2}} wedding on The Dream " +
      "Wedding. Their enquiry is waiting in your ready account: {{3}} — reply here if you " +
      "need any help.",
    status: 'approved',
  },

  // ── TDW_07 P5 · F-07.40 — THE VENDOR-LANE ENQUIRY CARRIER ──────────────────
  // RE-DERIVED AT 9b84c6d (this sitting, by command against this registry, not
  // carried from the prior sitting's claim). The vendor line's approved set is
  // exactly three, and NOT ONE of them can honestly carry a new enquiry:
  //   morning_nudge_vendor — "Good morning {{1}}. Here's your day: {{2}}." claims
  //     a morning that is not happening, AND carries "Reply STOP MORNINGS to
  //     pause these updates". Wearing it would let a vendor who paused MORNINGS
  //     silently lose his ENQUIRY ALERTS. That is worse than the gap it fills.
  //   crew_assignment — "you're on the crew for {{2}}" claims a crew.
  //   payment_reminder — "{{1}} is due {{2}}" claims a payment.
  // All three rejected as costume, twice now, by two independent derivations.
  //
  // FILED AND APPROVED. The founder filed it 2026-07-31 and Meta returned
  // ACTIVE the same day (WhatsApp Manager, template_details for
  // tdw_enquiry_alert_vendor: "Active – Quality pending", Utility, English —
  // founder screenshot on the chat record). "Quality pending" is the QUALITY
  // RATING, not the review state; Active is the approval. So this ships
  // 'approved' and sendWa's gate now PASSES it: an out-of-window vendor is
  // reached by template instead of being a logged gap.
  //
  // The body below is BYTE-IDENTICAL to what was filed — verified against the
  // founder's own screenshot, which renders it with the review samples
  // substituted ("Hi Swati, ... from Priya ... /vendor/leads"). A registry whose
  // body has drifted from the filed one builds a payload Meta rejects at send
  // time, which is why this is checked rather than assumed.
  //
  // NAMED RESIDUAL, NOT DERIVED: the WABA language code. Meta's UI says
  // "English", which is ambiguous between 'en' and 'en_US'. TEMPLATE_LANGUAGE
  // defaults to 'en' and demo_lead_alert sends live on that same value, which is
  // the strongest evidence available without the API — but it is evidence about
  // a DIFFERENT template. If the first real send returns a Meta 132001
  // (template name/language mismatch), the language is the suspect and
  // WA_TEMPLATE_LANGUAGE is the one-env-var cure.  //
  // Shaped to docs/TEMPLATES.md §1: single line, no adjacent variables, none at
  // body start or end. Deliberately parallel to demo_lead_alert so a vendor who
  // is prospected and then joins reads one product, not two.
  //
  // [F-06.85: conditioned on a MECHANICAL fact — Meta's review state for
  //  tdw_enquiry_alert_vendor. Mechanism: isApproved at the bottom of this file.
  //  When that fact moves, this paragraph and `status` are re-read together.]
  enquiry_alert_vendor: {
    key: 'enquiry_alert_vendor',
    name: 'tdw_enquiry_alert_vendor',      // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'bride', 'link'],
    // DRAFTED BY THE RETIRED SEAT, carried forward VERBATIM per the chair's
    // ruling; routes to the founder's veto and files with Meta immediately.
    body:
      "Hi {{1}}, a new enquiry just came in from {{2}} on The Dream Wedding. Open your " +
      "Leads to see the details: {{3}} — reply here if you need any help.",
    status: 'approved',
  },

  // ── AUTHENTICATION-category OTP templates (Block 05, F-05.6 fix (a), CE-35) ──────
  // These carry the login / PIN-reset / circle-join one-time codes over the Meta
  // transport. At M2b (CE-62, founder gate (ii)) they became the ONLY OTP path: the
  // OTP_WA_NUMBER Twilio fallback was deleted, so a lane with no PNID now throws rather
  // than degrading to a second transport (see src/lib/otpSend.js).
  //
  // AUTHENTICATION templates are SPECIAL (verified against Meta's authentication-message
  // spec, 2026-07): the body text is Meta-PRESET and not author-editable — the business
  // supplies ONLY the one-time code (the {{1}} body variable) plus optional add-ons
  // (security-recommendation line, expiry footer, the OTP button). So the brand words
  // ("Dream Wedding" / "DreamAI") CANNOT live in the template body — brand is carried by
  // the sending phone number's WhatsApp display name, NOT the copy. Functionally ONE auth
  // template could serve all five sites; the five keys below are registered per-site for
  // clean per-site tracking + founder veto, and MAY be collapsed by the founder to fewer
  // WABA templates (point several keys at one `name`). FOUNDER FILES + APPROVES ON THE
  // WABA AND SETS THE FINAL NAMES; the `name`s below are PROPOSED (tdw_ convention) and
  // overridable in one line. `status` starts 'draft'; the founder flips each to 'approved'
  // after Meta approves (same convention as the six above). The Meta OTP send is gated on
  // the lane's *_PHONE_NUMBER_ID (see otpSend.js), so these stay dormant until cutover.
  //
  // PROPOSED preset add-ons (FOUNDER VETO — filed on the WABA, not shipped as copy here):
  //   • add_security_recommendation: true   → "For your security, do not share this code."
  //   • code_expiration_minutes: 5          → "This code expires in 5 minutes." (matches OTP_TTL_MS)
  //   • OTP button: COPY_CODE, text "Copy Code"
  //
  // `variables: ['code']` documents the single body variable; auth payloads are built by
  // buildAuthTemplatePayload() (below), which ALSO threads the code into the OTP button.
  couple_login_otp: {
    key: 'couple_login_otp',
    name: 'tdw_couple_login_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',  // preset, not author-editable
    status: 'draft',
  },

  couple_reset_otp: {
    key: 'couple_reset_otp',
    name: 'tdw_couple_reset_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'draft',
  },

  circle_join_otp: {
    key: 'circle_join_otp',
    name: 'tdw_circle_join_otp',           // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'draft',
  },

  vendor_login_otp: {
    key: 'vendor_login_otp',
    name: 'tdw_vendor_login_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'draft',
  },

  vendor_reset_otp: {
    key: 'vendor_reset_otp',
    name: 'tdw_vendor_reset_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'draft',
  },
};

// ── helpers ────────────────────────────────────────────────────────────────

function getTemplate(key) {
  return TEMPLATES[key] || null;
}

function isApproved(key) {
  const t = TEMPLATES[key];
  return !!t && t.status === 'approved';
}

// Build the Meta Cloud API `template` payload body from ordered vars.
// vars may be an array (positional) or an object keyed by the semantic variable names.
// Throws a RangeError if the count doesn't match the template's declared variables —
// a caller must supply exactly one value per {{n}}.
function buildTemplatePayload(key, vars) {
  const t = TEMPLATES[key];
  if (!t) throw new RangeError(`unknown template: ${key}`);

  const declared = t.variables || [];
  let ordered;
  if (Array.isArray(vars)) {
    ordered = vars;
  } else if (vars && typeof vars === 'object') {
    ordered = declared.map((nm) => vars[nm]);
  } else {
    ordered = [];
  }

  if (ordered.length !== declared.length || ordered.some((v) => v == null)) {
    throw new RangeError(
      `template ${key} expects ${declared.length} var(s) [${declared.join(', ')}], ` +
      `got ${Array.isArray(vars) ? ordered.length : Object.keys(vars || {}).length}`
    );
  }

  // Meta payload shape: { name, language:{code}, components:[{type:'body', parameters:[{type:'text', text}]}] }
  return {
    name: t.name,
    language: { code: t.language },
    components: declared.length
      ? [{
          type: 'body',
          parameters: ordered.map((v) => ({ type: 'text', text: String(v) })),
        }]
      : [],
  };
}

// Build the Meta Cloud API `template` payload for an AUTHENTICATION-category template.
// The one-time `code` is threaded into BOTH components Meta requires for an auth send:
//   • body   — parameter {{1}} = the code (Meta preset text renders "<code> is your ...")
//   • button — the OTP button, carrying the code so tapping it copies/autofills the code.
//
// BUTTON SHAPE (verified against Meta's authentication-message send spec, 2026-07):
//   { type:'button', sub_type:'url', index:'0', parameters:[{ type:'text', text:<code> }] }
// This is Meta's widely-documented COPY_CODE / one-tap send form. A NEWER variant exists
// for copy-code buttons — sub_type:'copy_code' with parameters:[{ type:'coupon_code',
// coupon_code:<code> }] — which some stacks now require. Which form Meta accepts depends on
// the button TYPE the founder files (COPY_CODE vs ONE_TAP). This is a READ-FIRST decision
// flagged for the chair: if the live send is rejected on the button component, flip THIS
// one function to the coupon_code form (single site). The body component is identical in
// both forms. The code NEVER appears in a log line — it travels only as these params.
function buildAuthTemplatePayload(key, code) {
  const t = TEMPLATES[key];
  if (!t) throw new RangeError(`unknown template: ${key}`);
  if (t.category !== 'AUTHENTICATION') {
    throw new RangeError(`template ${key} is not an AUTHENTICATION template`);
  }
  if (code == null || String(code).length === 0) {
    throw new RangeError(`auth template ${key} requires a non-empty code`);
  }
  const c = String(code);
  return {
    name: t.name,
    language: { code: t.language },
    components: [
      { type: 'body',   parameters: [{ type: 'text', text: c }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: c }] },
    ],
  };
}

module.exports = { TEMPLATES, getTemplate, isApproved, buildTemplatePayload, buildAuthTemplatePayload };
