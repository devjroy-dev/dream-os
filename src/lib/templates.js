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
//   status     — 'draft' | 'submitted' | 'approved'
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

module.exports = { TEMPLATES, getTemplate, isApproved, buildTemplatePayload };
