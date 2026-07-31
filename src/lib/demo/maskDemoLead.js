// ─────────────────────────────────────────────────────────────────────────────
// src/lib/demo/maskDemoLead.js
// TDW_07 P5 — F-07.41's PARTIAL CURE · THE DEMO LEAD MASK. ONE HOME.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
// `public.demo_leads` was purpose-built to hold a real couple's enquiry against
// a demo vendor — `bride_name`, `bride_phone`, `bride_email`,
// `bride_wedding_date`, `bride_wedding_city`, all NOT NULL or real. Until P5 it
// held only seeded content, so nothing was at stake. P5 makes it live: a demo
// enquiry now writes a genuine couple's details here.
//
// And the entire `/demo/vendor/[handle]/*` tree is UNAUTHENTICATED — fourteen
// sub-routes, no guard on any of them (F-07.41, minted this sitting). Anyone who
// guesses a handle reaches it. Serving raw rows there would publish a bride's
// phone number at a URL you can type.
//
// CE-RULED 2026-07-31: the cure is MASKING, not gating. The tease surface stays
// open — it is Block 08's tease landing and open is its job — and a masked lead
// is a STRONGER tease than a full one, because the curiosity gap is the hook.
// Block 08's claim flow owns full detail for a CLAIMED vendor; that auth design
// is handed to 08 by name and is not this sitting's.
//
// ── THE COVERAGE MAP (protocol §9: a scrub that exists is not a scrub that is
//    applied — F-04.33/F-04.38). EVERY reader of `demo_leads` on the public
//    tree, and what each one gets: ─────────────────────────────────────────────
//
//   src/api/demo/vendor.js:73   GET  /demo/vendor/:handle/leads    → MASKED
//   src/api/demo/vendor.js:92   GET  /demo/vendor/:handle/context  → MASKED
//   src/api/demo/vendor.js:123  POST /demo/vendor/:handle/chat     → MASKED
//                                    (the MODEL's context, not just the payload)
//
//   src/api/admin/demoAdmin.js:75  GET /admin/demo/leads   → UNMASKED, and
//   src/api/admin/demoAdmin.js:90  POST /admin/demo/leads     correctly so: both
//   carry `requireAdminPassword`. The founder's own queue is the one place full
//   detail belongs today.
//
// SURFACE 3 IS THE CENTER OF THE RULING, not an afterthought. Masking the two
// payloads and leaving the model's context raw would be the scrub-that-isn't-
// applied class exactly: an unauthenticated visitor cannot read the JSON, but
// can ASK THE MODEL, and the model would have the real names in its window. That
// is the persona-firewall class (Block 06, F-06.29) on a lane that never got one.
//
// A NEW READER OF `demo_leads` ON THE PUBLIC TREE MUST ADD ITSELF TO THIS MAP
// AND GO THROUGH THIS FILE. That sentence is the whole point of the file.
'use strict';

// ONE REGISTER ACROSS THE ALERT AND THE STUDIO (CE-ruled, V9). The month phrase
// the vendor reads in his studio is byte-identical in construction to the one he
// read in `demo_lead_alert`'s {{2}} — "December 2026" in both places, because
// they describe the same wedding and a vendor comparing them should find no seam.
// Reused, never re-implemented: a second month formatter is a second answer to
// one question (the referent lesson, enquiryBinder.js:26).
const { monthPhrase } = require('../discover/demoLeadAlert');

// ── THE SELECT ───────────────────────────────────────────────────────────────
// Defence in depth, and the cheaper half of it. The three public routes each ran
// `.select('*')`, so `bride_phone` and `bride_email` left the database before any
// masking could have run. Narrowing the SELECT means the secret is never in
// process memory on those paths at all — masking then shapes what remains.
// A mask over a `select('*')` is one forgotten spread operator away from a leak.
const MASKED_SELECT = 'id, demo_vendor_id, bride_name, bride_wedding_date, bride_wedding_city, created_at';

/**
 * The vendor-facing masked name. FOUNDER-VETOED 2026-07-31, form (a), 「 a. confirmed 」:
 * first name + surname initial — "Priya Sharma" → "Priya S."
 *
 * Chosen because it reads as a specific person the vendor could be speaking to
 * tomorrow, which is what a tease is for, while disclosing exactly one letter of
 * one name. The colder forms tested (initials only, no name) buy no privacy the
 * surname initial does not already buy, and cost the face that makes it work.
 */
function maskName(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
  if (!s) return FALLBACK_NAME;
  const parts = s.split(' ');
  if (parts.length === 1) return parts[0];
  const surnameInitial = parts[parts.length - 1][0];
  if (!surnameInitial) return parts[0];
  return `${parts[0]} ${surnameInitial.toUpperCase()}.`;
}

// DEFENSIVE ONLY, AND DISCLOSED. `demo_leads.bride_name` is `text NOT NULL`
// (PUBLIC_SCHEMA.md), so a blank name is a data defect and not a designed state —
// this string should never render. It is NOT a vetoed byte. If it is ever seen
// in production that is itself the finding, and the string goes to the veto slot
// before it is allowed to stay.
const FALLBACK_NAME = 'A bride';

/**
 * Mask ONE demo_leads row for any unauthenticated surface.
 *
 * Returns a NEW object built field by field — never a spread of the input. A
 * spread with deletions leaks whatever column is added to the table next; an
 * explicit build leaks nothing by default, and a new column has to be
 * deliberately admitted here to reach a public surface.
 *
 * `bride_phone`, `bride_email` and `bride_ig_handle` are ABSENT BY CONSTRUCTION.
 * There is no flag that turns them on. A caller who needs them is the admin
 * router, which does not use this function.
 */
function maskDemoLead(row) {
  if (!row) return null;
  return {
    id:           row.id,
    bride_name:   maskName(row.bride_name),
    // V9: month + year, never the exact day. An exact date plus a city plus a
    // vendor is close to an identification even without a name.
    wedding_when: monthPhrase(row.bride_wedding_date),
    wedding_city: row.bride_wedding_city || null,
    created_at:   row.created_at,
  };
}

/** Mask a list. Null-safe, order-preserving. */
function maskDemoLeads(rows) {
  return (Array.isArray(rows) ? rows : []).map(maskDemoLead).filter(Boolean);
}

/**
 * The one-line-per-lead form the MODEL is given.
 *
 * ── F-07.42 CURED HERE (CE-ruled: the phantom reads die inside this rewrite) ──
 * THE LINE THIS REPLACES READ:
 *   `- ${l.bride_name} | ${l.bride_wedding_city} | ${l.bride_wedding_date} |
 *      status: ${l.state || 'new'} | message: "${l.raw_message || ''}"`
 * `demo_leads` has THIRTEEN columns and carries NEITHER `state` NOR
 * `raw_message` (PUBLIC_SCHEMA.md, witnessed). So every lead was reported to the
 * model as status "new" with an empty message — not stale data, INVENTED data,
 * presented to a language model as fact and then spoken to a visitor in the
 * vendor's own studio. That is the costume class in read form, and it is exactly
 * the shape the wire guard intercepts on the way out.
 *
 * The cure is subtraction: the model is told what the table holds and nothing
 * else. A field the schema cannot answer is not narrowed or defaulted — it is
 * not mentioned.
 */
function maskedLeadLines(rows) {
  const masked = maskDemoLeads(rows);
  if (!masked.length) return 'No leads yet.';
  return masked
    .map((l) => `- ${l.bride_name} | ${l.wedding_city || 'city not given'} | ${l.wedding_when}`)
    .join('\n');
}

/**
 * The counts a demo studio may honestly show.
 *
 * F-07.42's other half: the old `leads_summary` reported `new` and `booked` by
 * filtering on `l.state`, a column that does not exist — so BOTH were permanently
 * zero while looking like measurements. A counter that can only ever read zero is
 * worse than no counter: it answers the question wrongly instead of leaving it
 * open. Only `total` survives, because only `total` is derivable.
 */
function maskedLeadSummary(rows) {
  return { total: (Array.isArray(rows) ? rows : []).length };
}

module.exports = {
  maskDemoLead,
  maskDemoLeads,
  maskedLeadLines,
  maskedLeadSummary,
  maskName,
  MASKED_SELECT,
  FALLBACK_NAME,
};
