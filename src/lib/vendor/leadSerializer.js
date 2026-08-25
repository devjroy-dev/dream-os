// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/leadSerializer.js
// M-LEADGATE-RECUT · R-36.13 / R-37.4–.11 — THE CONNECT GATE, ONE HOME.
//
// THE GATE IS THE MODE TO CONNECT, NOT THE LEAD'S EXISTENCE.
//
// R-36.13, founder verbatim (2026-08-24):
//   "i dont want anything redacted from the leads card except for the phone
//    number i.e. a mode to connect. the name of the bride, date of wedding,
//    budget, city — let it all be there."
//
// So the WITHHELD SET IS EXACTLY {phone, email} — on both leads doors and both
// alert legs. Her NAME, her wedding date, her city, the budget, the free text
// she wrote, the vendor's own notes and invoices: ALL PRESENT for basic.
// A basic vendor sees the whole card and cannot reach her. That is the product.
//
// ── WHAT THIS FILE REPLACED, AND WHY THE ARCHITECTURE FLIPPED ───────────────
// The M-LEADGATE-A cut (7d625e8) was an ALLOWLIST over an existence-only wire,
// authored when NAME WAS CONTRABAND. R-36.13 changed the threat model: name is
// granted, so an allowlist's failure mode — silently withholding any column a
// future migration adds — now FAILS CLOSED AGAINST THE FOUNDER'S OWN RULING
// ("let it all be there"), which is the wrong direction under this policy.
//
// R-37.4 ruled the flip to a STRIP, with the allowlist's real benefit bought
// back mechanically instead of structurally:
//
//   THE STRIP is keyed on the CONNECT SET — a closed, ruled, two-member set —
//   never on a remembered list of everything else. That is what makes it a
//   strip and not the denylist refused at the A-charter: a denylist enumerates
//   what to remove from an open set; this enumerates a CLOSED set that a
//   founder ruling defines.
//
//   THE CENSUS-PINNED GUARD is the alarm. This module commits the exact column
//   and key sets that were dispositioned at this sitting, and
//   scripts/b36_leadgate_a_bench.js §9 REDS — by name, loudly — the moment
//   `public.leads`, either door's SELECT, the list mapper, or the detail
//   envelope grows a key nobody classified. A strip fails OPEN on a
//   newly-named contact column; this makes that failure LOUD instead of silent,
//   which is what the allowlist was actually buying. Cited precedent: F-08.104's
//   quote-pin — pin the fact so a future tidy-up reds instead of shipping.
//
// ── THE THREE LAWS THIS FILE STILL KEEPS ────────────────────────────────────
//
// ① PAYLOAD-PROOF, NEVER CLIENT MASKING (the 08 standard). Her phone and email
//    do not travel to a basic vendor and get hidden by a stylesheet. They are
//    NOT ON THE WIRE. The bench asserts against the raw serialized bytes, so a
//    cell cannot be satisfied by a CSS class. Client masking was refused BY
//    NAME at the charter and that refusal is unchanged by R-36.13.
//
// ② REDACTION IS DECIDED AT READ TIME, from `vendors.tier` as it reads NOW.
//    Nothing is stamped onto the row at write time. That is what makes the two
//    directions work without a backfill: an UPGRADE unlocks the vendor's whole
//    history the instant the column flips, and a LAPSE re-locks it just as fast.
//    A write-time stamp would have frozen each lead at the tier that happened to
//    be current when it landed, and no upgrade could ever have thawed it.
//
// ③ A SURFACE MAY WITHHOLD; IT MAY NEVER CLAIM IGNORANCE. This is the whole
//    tuition of the A-sitting's walk. Its cut redacted the name, the pwa's own
//    fallback rendered `l.name ?? 'Unknown'` (dreamos-pwa leads.tsx:55), and
//    twelve leads on a live vendor's screen read `Unknown` — THE ESTATE CLAIMING
//    IGNORANCE ABOUT DATA IT HOLDS AND IS WITHHOLDING, a false statement on a
//    money surface, the F-04.71 costume class Block 06 was spent killing.
//    R-36.13 dissolves that class AT THE ROOT: the name is always on the wire,
//    so there is nothing for a fallback to invent. Withholding is a product
//    decision; claiming ignorance is a lie. Keep it dissolved.
//
// ── [F-10.122] THE SEQUENCING LAW THIS FILE IS CONDITIONED ON (F-06.85) ─────
// THIS GATE COVERS THE HTTP DOORS. IT DOES NOT COVER THE AGENT LANE.
//
// A basic vendor's WhatsApp/chat turn is refused before any tool runs, at the
// cap-gate (src/lib/vendorInbound.js, `capMeta.turns_cap === 0`). That is NOT a
// structural closure — it is A DATA ROW. `turns_cap` resolves from
// `admin_config` key `vendor_ai_daily_basic` (src/api/vendor-engine/chat.js,
// symbol `buildMeta`) and `src/api/admin/config.js`'s live `PATCH /:key` updates
// any key with no deploy.
//
// SO: IF THAT DIAL EVER MOVES OFF ZERO, the agent lane serves bride identity to
// basic vendors around every gate this file builds — donnaFind's `FIND_SELECT`
// carries `client` AND `phone` (src/engine/src/core/tools/donnaFind.ts, symbol
// `FIND_SELECT`), and the vendor snapshot's leads SELECT carries `name`
// (src/lib/vendor/snapshot.js). NEITHER READS THIS MODULE — re-derived by grep
// at this sitting's tree, not carried from the A-cut's sentence.
//
// THE CURE IS A SEQUENCING LAW, BANKED AT CE-226 AND BINDING THE FOUNDER'S OWN
// HAND: `vendor_ai_daily_basic` DOES NOT MOVE OFF ZERO UNTIL THE AGENT LANE
// READS LEADS THROUGH THIS SERIALIZER. It is written here as well as in the band
// because a law that lives only in a log is a law that gets re-read once.
//
// MECHANISM NAMED (F-06.85): the dial's reader is `buildMeta` in
// src/api/vendor-engine/chat.js. If a per-tier enforcement seat ever lands
// (F-10.41) and the cap stops being the thing that closes this lane, THIS
// PARAGRAPH IS FALSE and must be re-read.
//
// ── CROSS-FILE POINTERS IN THIS FILE ARE PATH + SYMBOL, NEVER A LINE RANGE ──
// [c-A′.1 — THE PATH-OVER-RANGE LAW EARNING ITS KEEP A SECOND TIME]
// The A-cut's comments cited `src/api/couple/enquire.js:504` for the
// `raw_message` composition. That cite was FALSE THE DAY IT WAS WRITTEN: the
// same commit (7d625e8) moved the composition to :580 and wrote :504 into three
// places here and in its handover, and this sitting's own kickoff inherited it
// twice. A range drifts silently and keeps reading correctly while pointing at
// unrelated code. Every cross-file pointer below therefore names a FILE and a
// SYMBOL, which fails loudly: the file resolves or it does not.
'use strict';

// ── R-36.10 · THE FOUR CANON SPELLINGS (UNCHANGED, STILL LAW) ───────────────
// Witnessed, not remembered: `public.vendors.tier` is `text NOT NULL default
// 'basic'` with no CHECK constraint (docs/db/PUBLIC_SCHEMA.md, `public.vendors`
// column 10), so the column can hold anything a hand or a webhook writes. The
// canon set is the pricing ladder entered at CE-200 (Free/Essential/Signature/
// Prestige) with `basic` as the free tier's column token per 0115's rename
// (F-10.23).
const CANON_TIERS = ['basic', 'essential', 'signature', 'prestige'];

// The tiers that receive leads byte-untouched. An ALLOWLIST, and it stays one
// for the identical reason CE-211 gave: a negation ("not basic") reads every
// unknown or empty string as PAID, which is the expensive direction — it would
// hand a drifted spelling the full connect payload. R-37.4's flip is about the
// FIELD gate, not this one. THIS LIST IS NOT A STRIP AND MUST NEVER BECOME ONE.
const FULL_ACCESS_TIERS = ['essential', 'signature', 'prestige'];

// ── THE WITHHELD SET · R-36.13's "MODE TO CONNECT", EXACTLY TWO MEMBERS ─────
// Closed by founder ruling. Anything added here is NEW POLICY and needs a
// ruling of its own; anything removed hands a basic vendor a way to reach her.
const WITHHELD_FIELDS = ['phone', 'email'];

// ── THE `client` OBJECT · R-37.7, A RULED ALLOWLIST INSIDE A STRIP FILE ─────
// `client` is not a lead field with some contact on it — it is AN ENTIRE SECOND
// IDENTITY OBJECT whose reason for existing is contact (`getLeadDetail` selects
// `id, name, phone, email` from `public.clients`; src/lib/vendor/leads.js,
// symbol `getLeadDetail`). R-37.7 ruled it field-filtered to {id, name} rather
// than stripped, and the difference is not academic: an allowlist here means a
// new contact column on `public.clients` — a `whatsapp`, an `alt_phone` — never
// reaches a basic wire at all, whereas the strip would pass it until the census
// guard reds. At TODAY's SELECT the two produce the same object; the allowlist
// is nonetheless the ruled shape, and this paragraph is why it is not "the same
// thing written twice".
const CLIENT_BASIC_FIELDS = ['id', 'name'];

/**
 * Resolve a raw `vendors.tier` value to one of the four canon spellings.
 *
 * R-36.10: unknown resolves to `basic` — FAIL TO REDACTED. The expensive
 * direction is handing someone a way to contact a bride he has not paid for;
 * the cheap direction is a paying vendor seeing a locked contact button and
 * telling us within the hour. We take the cheap failure.
 *
 * AND IT IS LOGGED LOUDLY, which is the other half of the ruling. A silent
 * fail-to-redacted would DEMOTE A PAYER invisibly — his contact affordances
 * would vanish, he would not know why, and no line anywhere would say the word
 * that caused it. The log names the offending spelling and the vendor, so a
 * drift is a search away rather than an investigation.
 */
function resolveTier(rawTier, vendorId) {
  const t = String(rawTier == null ? '' : rawTier).trim().toLowerCase();
  if (CANON_TIERS.includes(t)) return t;
  console.error(
    `[leadgate] UNKNOWN TIER '${rawTier}' on vendor ${vendorId || 'unknown'} — ` +
    "resolved to BASIC and the lead's CONTACT is REDACTED (R-36.10, fail-to-redacted). " +
    'If this vendor pays, his phone/email affordances are gone RIGHT NOW and this line is why: ' +
    `the canon spellings are ${CANON_TIERS.join(', ')}.`
  );
  return 'basic';
}

/** Does this vendor receive leads byte-untouched? */
function hasFullLeadAccess(rawTier, vendorId) {
  return FULL_ACCESS_TIERS.includes(resolveTier(rawTier, vendorId));
}

/**
 * Copy an object without the connect-set. Returns a NEW object — law ② depends
 * on this file never mutating what it is handed, because the same stored row is
 * serialized twice (once per tier) in the flip proofs and in real pagination.
 *
 * Applied at EVERY nesting level of the detail envelope rather than only at the
 * lead, so that a contact key arriving on an invoice, an event or a message row
 * does not ride out on a technicality. The census guard still reds on such a
 * key — the strip is the cure, the census is the alarm, and the estate wants
 * both.
 */
function stripConnectKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    if (WITHHELD_FIELDS.includes(k)) continue;
    out[k] = obj[k];
  }
  return out;
}

/**
 * Serialize ONE list-shaped lead for one vendor's tier.
 *
 * Under R-36.13 the basic list row keeps EVERYTHING the paying row keeps except
 * `phone`. It keeps her name. It keeps `raw_message` — free prose reading
 * "<her name> enquired via the Discover feed on The Dream Wedding", composed in
 * src/api/couple/enquire.js inside the `createLead` call at the foot of the
 * enquiry handler. It keeps `notes`, `referrer`, and the `draft` wishbone whose
 * `tell_victor.primer` carries her name two levels down (src/api/vendor/
 * leads.js, symbol `leadDraftWire`). Every one of those was contraband under
 * R-36.8 and is granted under R-36.13.
 *
 * THE ACCEPTED LEAK, RECORDED SO IT IS NEVER FILED AS A BUG: the free-text
 * fields are hers to write and a bride may type her own number into one. The
 * founder ruled that visible to basic, no-clawback class. What is NOT accepted
 * is a SYSTEM-COMPOSED string embedding her phone — and this sitting's
 * read-first walked every composer on this wire and found none: the Discover
 * `raw_message` is name-only, the Discover `notes` literal carries no identity,
 * `leadDraftWire`'s primer is name-only. If a composer ever starts embedding a
 * phone, that is a new defect at the composer, not a policy change here.
 *
 * @param {object} row   the mapped list row (post-mapper, pre-response)
 * @param {string} tier  raw `vendors.tier`
 * @param {string} vendorId  for the R-36.10 log line
 * @returns {object} the row as it may travel
 */
function serializeLeadRow(row, tier, vendorId) {
  if (!row) return row;
  if (hasFullLeadAccess(tier, vendorId)) return row;

  const out = stripConnectKeys(row);
  // The tell the surface renders its lock from. NOT a substitute for the
  // absence — the connect fields are genuinely gone, and this only says why.
  // Seat B′ reads it to place the upsell slot where the contact buttons would
  // otherwise sit (dreamos-pwa, symbol `SliceRow`).
  out.redacted = true;
  return out;
}

/** Serialize a page of list rows. */
function serializeLeadRows(rows, tier, vendorId) {
  return (rows || []).map((r) => serializeLeadRow(r, tier, vendorId));
}

/**
 * Serialize the DETAIL envelope.
 *
 * WHAT CHANGED FROM THE A-CUT, RULING BY RULING:
 *   R-37.6  `invoices[].client_name` JOINS. The LAPSE argument that withheld it
 *           was about NAME as contraband; R-36.13 grants name. Independently:
 *           an invoice is the VENDOR'S OWN billing record. Both arguments point
 *           one way. `public.invoices` does carry `client_phone` (column 6) but
 *           `getLeadDetail` has never selected it — derived by command, and the
 *           census guard reds if that ever changes.
 *   R-37.7  `client` field-filters to {id, name} — see CLIENT_BASIC_FIELDS.
 *   R-37.8  `conversation` RIDES. The thread bodies are free text and the
 *           accepted-leak ruling is free-text class. This is the envelope's
 *           largest leak surface and the ruling says so out loud rather than
 *           pretending otherwise; the founder's amendment power over it is
 *           standing. The A-cut's "an UNDISCLOSED thread, not an empty one"
 *           problem DISSOLVES with it — there is no longer an empty array for a
 *           surface to mistranslate into "no messages yet".
 *   R-37.9  `events` JOINS — and this ruling is also the cure for c-A′.2. The
 *           A-cut's envelope simply had no `events` key, so a basic vendor's
 *           detail response lost the linked-calendar block SILENTLY, with no
 *           tell and no inventory line anywhere. A shape that changes without
 *           saying so is the same family as a surface that claims ignorance.
 *   R-37.11 `wedding_date_precision` sat in the A-cut's detail allowlist while
 *           the detail SELECT has never carried it (src/lib/vendor/leads.js,
 *           symbol `getLeadDetail`), so the entry could never match. The phantom
 *           dies with the allowlist that held it.
 *
 * `vendor_summary` — a written description of HER, on the envelope and again on
 * the lead — is PRESENT for basic under R-36.13. It carries no mode to connect.
 */
function serializeLeadDetail(detail, tier, vendorId) {
  if (!detail) return detail;
  if (hasFullLeadAccess(tier, vendorId)) return detail;

  const lead = detail.lead || null;
  let redactedLead = null;
  if (lead) {
    redactedLead = stripConnectKeys(lead);
    redactedLead.redacted = true;
  }

  const client = detail.client
    ? CLIENT_BASIC_FIELDS.reduce((acc, f) => {
        if (Object.prototype.hasOwnProperty.call(detail.client, f)) acc[f] = detail.client[f];
        return acc;
      }, {})
    : detail.client;

  return {
    ok: detail.ok,
    lead: redactedLead,
    vendor_summary: detail.vendor_summary,
    conversation: (detail.conversation || []).map(stripConnectKeys),
    invoices: (detail.invoices || []).map(stripConnectKeys),
    events: (detail.events || []).map(stripConnectKeys),
    client,
    redacted: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// THE CENSUS · R-37.4's SECOND HALF — THE PIN THAT REDS ON SCHEMA GROWTH
// ═══════════════════════════════════════════════════════════════════════════
// These are not used at runtime. They are the COMMITTED RECORD of exactly what
// was dispositioned at this sitting, and scripts/b36_leadgate_a_bench.js §9
// derives the live sets by four independent methods and diffs them against
// these. A key that appears in the tree and not here is an UNCLASSIFIED FIELD
// ON A MONEY SURFACE and the bench names it and reds.
//
// WHY A PIN AND NOT A RUNTIME CHECK. A runtime guard would have to decide what
// to do with an unknown field while a vendor is holding his phone, and both
// answers are bad — pass it (leak) or drop it (a withholding nobody ruled). A
// bench pin forces the decision to happen at a DESK, with a chair, before the
// column reaches a wire. Precedent: F-08.104's 127-character quote-pin.
//
// UPDATING THESE IS A RULING, NOT A CHORE. If the bench reds here, the cure is
// to classify the new key — withheld or present — and record the ruling. It is
// never to append the name and move on.

// `public.leads` as witnessed at docs/db/PUBLIC_SCHEMA.md (`## public.leads`,
// 27 columns, snapshot 2026-08-15 at ladder tip 0125). Ladder tip at this
// sitting is 0129; 0126 touches `public.couple_bookings`, 0127/0128
// `public.engagements`, 0129 `engine.agents` — NONE touches this table, so the
// snapshot is a valid witness here. Derived by reading those four files, not by
// trusting the header's arithmetic alone.
const LEADS_COLUMN_CENSUS = [
  'id', 'vendor_id', 'name', 'phone', 'email', 'wedding_date', 'wedding_city',
  'event_types', 'budget_min', 'budget_max', 'source', 'referrer_name', 'state',
  'raw_message', 'notes', 'created_at', 'updated_at', 'client_id', 'deleted_at',
  'vendor_summary', 'intent_summary', 'intent_summary_at',
  'wedding_date_precision', 'function_count', 'wedding_days', 'functions',
  'draft_meta',
];

// The columns the LIST door asks the database for (src/api/vendor/leads.js,
// symbol `dataSelect`).
// ── AMENDED BY LABEL · M-LEADGATE-RECUT SEAT B′ (F-16.25 / R-37.21) ────────
// `budget_min` JOINS. DISPOSITIONED **PRESENT** for basic: budget is granted
// whole under R-36.13 ("the name of the bride, date of wedding, budget, city —
// let it all be there"), and a floor carries no mode to connect. The guard cell
// red that this key produced was the instrument working, and this line is the
// ruling that answers it — not an append to make a bench quiet.
const LIST_SELECT_CENSUS = [
  'id', 'name', 'phone', 'wedding_date', 'wedding_date_precision',
  'wedding_city', 'budget_min', 'budget_max', 'state', 'source', 'referrer_name',
  'raw_message', 'draft_meta', 'notes', 'created_at',
];

// The keys the LIST door actually puts on the wire (same file, the mapper that
// builds `leads`). NOTE the renames — `budget_total` is an ALIAS of
// `budget_max` on this wire and is NOT a `public.leads` column; the real
// `budget_total` phantom lives in src/lib/vendor/snapshot.js and is a separate,
// filed, out-of-radius debt.
// ── AMENDED BY LABEL · SEAT B′ (F-16.25 / R-37.21) ─────────────────────────
// `budget_min` joins the WIRE too, under its own true name. Note it sits beside
// `budget_total` rather than inside it: `budget_total` is the CEILING wearing an
// alias (mapper: `budget_total: l.budget_max`), and giving that key a third
// meaning is how the alias became a thing readers have to look up.
const LIST_WIRE_CENSUS = [
  'id', 'name', 'phone', 'wedding_date', 'wedding_date_precision',
  'wedding_city', 'budget_total', 'budget_min', 'state', 'source', 'referrer',
  'raw_message', 'notes', 'created_at', 'tdw', 'tdw_enquired_at', 'draft',
];

// The columns the DETAIL door asks for (src/lib/vendor/leads.js, symbol
// `getLeadDetail`, the `leads` SELECT).
const DETAIL_SELECT_CENSUS = [
  'id', 'name', 'phone', 'email', 'wedding_date', 'wedding_city', 'event_types',
  'budget_min', 'budget_max', 'state', 'source', 'referrer_name', 'raw_message',
  'notes', 'client_id', 'vendor_summary', 'draft_meta', 'created_at',
];

// The top-level keys of the DETAIL envelope (same symbol, its return).
const DETAIL_ENVELOPE_CENSUS = [
  'ok', 'lead', 'vendor_summary', 'conversation', 'invoices', 'events', 'client',
];

module.exports = {
  resolveTier,
  hasFullLeadAccess,
  stripConnectKeys,
  serializeLeadRow,
  serializeLeadRows,
  serializeLeadDetail,
  CANON_TIERS,
  FULL_ACCESS_TIERS,
  WITHHELD_FIELDS,
  CLIENT_BASIC_FIELDS,
  LEADS_COLUMN_CENSUS,
  LIST_SELECT_CENSUS,
  LIST_WIRE_CENSUS,
  DETAIL_SELECT_CENSUS,
  DETAIL_ENVELOPE_CENSUS,
};
