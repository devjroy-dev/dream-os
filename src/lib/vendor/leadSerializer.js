// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/leadSerializer.js
// M-LEADGATE-A · R-36.8 / R-36.10 — THE TIER GATE, ONE HOME.
//
// Leads are the paid product. Essential and above receive enquiries
// byte-untouched. BASIC receives EXISTENCE-ONLY: a lead exists, when it arrived,
// what it is about — and NOT WHO SHE IS.
//
// ── THE THREE LAWS THIS FILE EXISTS TO KEEP ─────────────────────────────────
//
// ① PAYLOAD-PROOF, NEVER CLIENT MASKING (the 08 standard). Her name and phone
//    do not travel to a basic vendor and get hidden by a stylesheet. They are
//    NOT ON THE WIRE. The bench asserts against the raw serialized bytes, so a
//    cell cannot be satisfied by a CSS class. Client masking was refused BY NAME
//    at the charter.
//
// ② REDACTION IS DECIDED AT READ TIME, from `vendors.tier` as it reads NOW.
//    Nothing is stamped onto the row at write time. That is what makes the two
//    directions work without a backfill: an UPGRADE unlocks the vendor's whole
//    history the instant the column flips, and a LAPSE re-locks it just as fast.
//    A write-time stamp would have frozen each lead at the tier that happened to
//    be current when it landed, and no upgrade could ever have thawed it.
//
// ③ ALLOWLIST, NEVER A DENYLIST — CE-211's law, earned on `PAID_TIERS`
//    ("an allowlist, never a negation, because useSettings seeds tier: ''").
//    Here it is earned a second time, and the reason is worth the ink: a
//    denylist over {name, phone} would have passed its bench and still shipped
//    her name, because `raw_message` reads "Priya Sharma enquired via the
//    Discover feed" (src/api/couple/enquire.js:504) and `client` is an entire
//    second identity object. A denylist can only remove what its author
//    remembered. AN ALLOWLIST FAILS CLOSED ON THE FIELD NOBODY THOUGHT OF —
//    including fields added to `public.leads` by migrations not yet written.
//
// ── [F-10.122] THE SEQUENCING LAW THIS FILE IS CONDITIONED ON (F-06.85) ─────
// THIS GATE COVERS THE HTTP DOORS. IT DOES NOT COVER THE AGENT LANE.
//
// A basic vendor's WhatsApp/chat turn is refused before any tool runs, at the
// cap-gate (src/lib/vendorInbound.js:1570, `capMeta.turns_cap === 0`). That is
// NOT a structural closure — it is A DATA ROW. `turns_cap` resolves from
// `admin_config` key `vendor_ai_daily_basic` (src/api/vendor-engine/chat.js:2726)
// and `src/api/admin/config.js:25` is a live `PATCH /:key` that updates any key
// with no deploy.
//
// SO: IF THAT DIAL EVER MOVES OFF ZERO, the agent lane serves bride identity to
// basic vendors around every gate this file builds — donnaFind's FIND_SELECT
// carries `client` AND `phone` (donnaFind.ts:112), and snapshot.js:95 carries
// `name`. Neither reads this module.
//
// THE CURE IS A SEQUENCING LAW, BANKED AT CE-226 AND BINDING THE FOUNDER'S OWN
// HAND: `vendor_ai_daily_basic` DOES NOT MOVE OFF ZERO UNTIL THE AGENT LANE
// READS LEADS THROUGH THIS SERIALIZER. It is written here as well as in the band
// because a law that lives only in a log is a law that gets re-read once.
//
// MECHANISM NAMED: the dial's reader is `buildMeta` at chat.js:2721. If a
// per-tier enforcement seat ever lands (F-10.41) and the cap stops being the
// thing that closes this lane, THIS PARAGRAPH IS FALSE and must be re-read.
'use strict';

// ── R-36.10 · THE FOUR CANON SPELLINGS ──────────────────────────────────────
// Witnessed, not remembered: `public.vendors.tier` is `text NOT NULL default
// 'basic'` with no CHECK constraint (PUBLIC_SCHEMA.md, public.vendors col 10),
// so the column can hold anything a hand or a webhook writes. The canon set is
// the pricing ladder entered at CE-200 (Free/Essential/Signature/Prestige) with
// `basic` as the free tier's column token per 0115's rename (F-10.23).
const CANON_TIERS = ['basic', 'essential', 'signature', 'prestige'];

// The tiers that receive leads byte-untouched. An ALLOWLIST, per law ③ and for
// the identical reason CE-211 gave: a negation ("not basic") reads every unknown
// or empty string as PAID, which is the expensive direction — it would hand a
// drifted spelling the full identity payload.
const FULL_ACCESS_TIERS = ['essential', 'signature', 'prestige'];

/**
 * Resolve a raw `vendors.tier` value to one of the four canon spellings.
 *
 * R-36.10: unknown resolves to `basic` — FAIL TO REDACTED. The expensive
 * direction is serving identity to someone who has not paid for it; the cheap
 * direction is a paying vendor seeing a locked card and telling us within the
 * hour. We take the cheap failure.
 *
 * AND IT IS LOGGED LOUDLY, which is the other half of the ruling. A silent
 * fail-to-redacted would DEMOTE A PAYER invisibly — his leads would lock, he
 * would not know why, and no line anywhere would say the word that caused it.
 * The log names the offending spelling and the vendor, so a drift is a search
 * away rather than an investigation.
 */
function resolveTier(rawTier, vendorId) {
  const t = String(rawTier == null ? '' : rawTier).trim().toLowerCase();
  if (CANON_TIERS.includes(t)) return t;
  console.error(
    `[leadgate] UNKNOWN TIER '${rawTier}' on vendor ${vendorId || 'unknown'} — ` +
    'resolved to BASIC and the lead is REDACTED (R-36.10, fail-to-redacted). ' +
    'If this vendor pays, his leads are locked RIGHT NOW and this line is why: ' +
    `the canon spellings are ${CANON_TIERS.join(', ')}.`
  );
  return 'basic';
}

/** Does this vendor receive leads byte-untouched? */
function hasFullLeadAccess(rawTier, vendorId) {
  return FULL_ACCESS_TIERS.includes(resolveTier(rawTier, vendorId));
}

// ── THE ALLOWLIST · THE LIST ROW (GET /vendor/leads/:vendorId) ──────────────
// Everything here is EXISTENCE + CONTEXT and NONE of it is identity. The
// vendor learns that a couple enquired, when, for what date and city, at what
// budget, and where it came from. He does not learn who.
//
// ── A DECLARED SCOPE BOUNDARY, NOT A SILENT CHOICE (UNRULED-ARM LAW) ────────
// `wedding_date`, `wedding_city` and `budget_total` SURVIVE on the basic wire.
// The charter's ruled subject is identity ("bride name and phone NEVER
// serialize"), and F5 struck enrichment from the ALERT specifically — the alert
// is an interruption on his phone, the page is where the selling happens. These
// three fields are already on this wire today, carry no identity, and give
// Seat B a locked card with something true to say. STRIPPING them would be NEW
// policy this seat has no ruling for, so it is not taken here. Reported, not
// decided: if the chair wants the page reduced to bare existence, it is one
// edit to this array and its bench cells.
const BASIC_LIST_FIELDS = [
  'id',
  'wedding_date',
  'wedding_date_precision',
  'wedding_city',
  'budget_total',
  'state',
  'source',
  'created_at',
  'tdw',
  // The mapper's key is `tdw_enquired_at`, NOT `enquired_at` (leads.js:210).
  // This was written as the latter from the shape of the sentence and corrected
  // by reading the mapper — the F-07.50 class, caught before it shipped.
  'tdw_enquired_at',
];

// ── `draft` IS ABSENT FROM THE LIST ALLOWLIST ON PURPOSE, AND IT IS IDENTITY ─
// `leadDraftWire` (leads.js:65-74) builds `tell_victor.primer` as
// `About ${l.name || 'this lead'}: the ${missing[0]} is ` — HER NAME, inside a
// nested object, on the LIST door. Nothing about the key `draft` says "name",
// and no reader scanning the mapper for identity fields would stop on it.
//
// It is closed here BY CONSTRUCTION rather than by anyone noticing: the
// allowlist never had to be told about it. This is law ③ paying for itself on
// the door we thought was the easy one, and it is the reason the denylist
// version of this file would have shipped her name to seventeen vendors.

// ── THE ALLOWLIST · THE DETAIL ROW (GET /vendor/leads/:leadId/detail) ───────
// The detail door's lead object carries `email`, `referrer_name`,
// `raw_message`, `notes` and `vendor_summary` on top of the list row's fields.
//
// `raw_message` IS IDENTITY and this is the field that proves the allowlist was
// the right shape: it is free prose reading "<her name> enquired via the
// Discover feed on The Dream Wedding" (enquire.js:504). It looks like metadata
// and it is a name.
//
// `notes` and `vendor_summary` are excluded too, and the reason is the LAPSE
// direction. A vendor who was prestige, read her name, and typed it into his
// own note does not stop having typed it when he lapses to basic. The note is
// his writing; the name in it is hers.
const BASIC_DETAIL_FIELDS = [
  'id',
  'wedding_date',
  'wedding_date_precision',
  'wedding_city',
  'event_types',
  'budget_min',
  'budget_max',
  'state',
  'source',
  'created_at',
  'draft_meta',
];

/**
 * Serialize ONE list-shaped lead for one vendor's tier.
 *
 * @param {object} row   the mapped list row (post-mapper, pre-response)
 * @param {string} tier  raw `vendors.tier`
 * @param {string} vendorId  for the R-36.10 log line
 * @returns {object} the row as it may travel
 */
function serializeLeadRow(row, tier, vendorId) {
  if (!row) return row;
  if (hasFullLeadAccess(tier, vendorId)) return row;

  const out = {};
  for (const f of BASIC_LIST_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(row, f)) out[f] = row[f];
  }
  // The tell the surface renders its lock from. NOT a substitute for the
  // absence — the fields are genuinely gone, and this only says why.
  out.redacted = true;
  return out;
}

/** Serialize a page of list rows. */
function serializeLeadRows(rows, tier, vendorId) {
  return (rows || []).map((r) => serializeLeadRow(r, tier, vendorId));
}

/**
 * Serialize the DETAIL envelope — the leakier door.
 *
 * `client`, `conversation` and `invoices[].client_name` are each an independent
 * identity vector and each is closed here. `conversation` is the sharpest: it is
 * up to twenty raw message bodies off the couple thread, which is not a field
 * that can be sanitised — only withheld.
 */
function serializeLeadDetail(detail, tier, vendorId) {
  if (!detail) return detail;
  if (hasFullLeadAccess(tier, vendorId)) return detail;

  const lead = detail.lead || null;
  let redactedLead = null;
  if (lead) {
    redactedLead = {};
    for (const f of BASIC_DETAIL_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(lead, f)) redactedLead[f] = lead[f];
    }
    redactedLead.redacted = true;
  }

  return {
    ok: detail.ok,
    lead: redactedLead,
    // vendor_summary is a written description of HER. Withheld whole.
    vendor_summary: null,
    // Not an empty thread — an UNDISCLOSED one. The surface must not render
    // "no messages yet", which would be a lie about a conversation that exists.
    conversation: [],
    // Invoices keep their money and lose their names: a basic vendor's own
    // billing history is his, but `client_name` is hers.
    invoices: (detail.invoices || []).map((inv) => {
      const { client_name, ...rest } = inv;
      return rest;
    }),
    client: null,
    redacted: true,
  };
}

module.exports = {
  resolveTier,
  hasFullLeadAccess,
  serializeLeadRow,
  serializeLeadRows,
  serializeLeadDetail,
  CANON_TIERS,
  FULL_ACCESS_TIERS,
  BASIC_LIST_FIELDS,
  BASIC_DETAIL_FIELDS,
};
