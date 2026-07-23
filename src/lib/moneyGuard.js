// src/lib/moneyGuard.js — TDW_05 THE COUPLE-LANE MECHANICAL ARC, M2.
// F-05.35's cure (the 10x write) + F-05.36's mechanical second limb for money
// + the founder-ratified CONFIRM-CONSUMED-ONCE fold ("ill go wth your lean").
//
// ── THE FINDING ─────────────────────────────────────────────────────────────
//
// F-05.35, witnessed on a production row and remediated by the founder's own hand:
// the bride said "4 lakhs", the hand wrote 4000000, and the result came back
// ok:true. Ten times the figure she spoke, 160% of her stated budget, in one row,
// against an EXPLICIT unit instruction that already sat in the tool's own schema
// (brideTools.js:286 — "Amounts are in rupees as integers (2 lakh = 200000, not
// 2)"). Intermittent: the same lane got 25 lakhs RIGHT forty minutes earlier.
//
// THE CURE IS MECHANICAL OR IT IS NOTHING. An instruction the model follows most
// of the time is not a floor; it is a habit. This file is the floor.
//
// ── THE LAW, PORTED (M-2, provenanceHold.ts, ruled at the manual paper) ──────
//
// A rupee figure in a WRITE hand must be present in the BRIDE'S OWN WORDS this
// thread, or the hand HOLDS with the honest question. Money figures only, write
// hands only, everything else passes untouched. Deliberately narrow: a false hold
// costs one honest question; a false pass is the 10x write.
//
// ── THE PORT SHAPE, AND WHERE IT HAD TO DIVERGE (disclosed, not adapted) ─────
//
// F4 ruled DIST-REQUIRE over reimplementation, and the reason is provenanceHold's
// own (:44-46): the floor and the door must agree on what "50k" means, or the
// floor holds an amount the door would have written. So parseMoney and
// extractVendorFigures come from the ONE HOME via src/engine/dist — harvest.js's
// four-fold precedent (:34-:37).
//
// TWO DIVERGENCES, both forced by facts derived at 0da540a:
//
// (1) THE REQUIRE IS LAZY, NOT MODULE-SCOPE. src/engine/dist/core/provenanceHold.js
//     transitively requires db.js, which THROWS AT REQUIRE TIME without
//     SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. brideEngine.js is required by
//     b05_couple_soul_bench and b05_f0532_haiku_ceiling_bench, neither of which
//     carries those credentials — a module-scope require here would RED two floor
//     benches on a module they do not test. Deferring the require to first use
//     keeps the ruled one-home normalisation AND keeps brideEngine's load clean.
//     Production is unaffected: Railway always carries the vars, and the first
//     money hand of the process resolves it once and caches.
//
// (2) THE SELECTOR IS A DESCRIPTOR, NOT A NAME LIST. provenanceHold types its map
//     as Record<string, string[]> — tool to money-field names. That shape cannot
//     express save_wedding_detail, which takes ONE polymorphic `value` key for
//     five different field types (brideTools.js:44-51). Listing `value` flatly
//     would put the guard in front of wedding_city "Jaipur" and — worse —
//     wedding_date "2027-02-15", where parseMoney reads a four-digit year as a
//     rupee figure and a date holds its own write. So each entry carries an
//     optional predicate, and save_wedding_detail is scoped to field ===
//     'budget_total' exactly as ruled. The NORMALISATION is shared; only the
//     SELECTION is this lane's. The vendor file is untouched.
'use strict';

// Lazily resolved once, then cached. See divergence (1) above.
let _engineMoney = null;
function engineMoney() {
  if (_engineMoney) return _engineMoney;
  const { parseMoney } = require('../engine/dist/core/tools/recordPrimitives.js');
  const { extractVendorFigures } = require('../engine/dist/core/provenanceHold.js');
  _engineMoney = { parseMoney, extractVendorFigures };
  return _engineMoney;
}
function _setEngineMoney(m) { _engineMoney = m; }   // test hook only

// ── THE MONEY-BEARING WRITE HANDS ───────────────────────────────────────────
// Enumerated from brideTools.js at 0da540a by command, never guessed — the same
// standard provenanceHold set for its own map:
//   add_booking.amount_total          :299    add_booking.amount_advance    :303
//   update_booking.amount_total       :366    update_booking.amount_advance :370
//   record_payment.amount             :410
//   save_wedding_detail.value         :49     ONLY when field === 'budget_total'
// Reads are never held. delete_* carry no figure. list_* carry no figure.
const MONEY_WRITE_HANDS = {
  add_booking:         { fields: ['amount_total', 'amount_advance'] },
  update_booking:      { fields: ['amount_total', 'amount_advance'] },
  record_payment:      { fields: ['amount'] },
  save_wedding_detail: {
    fields: ['value'],
    // The predicate IS the scoping. Without it this entry would hold dates.
    when: (input) => input && input.field === 'budget_total',
  },
};

// The subject of a money write, for the consumed-once claim key. Derived from the
// hand's own arguments; '-' when the hand names no subject.
function moneySubject(name, input) {
  const i = input || {};
  if (name === 'add_booking')         return String(i.vendor_name || '-');
  if (name === 'update_booking')      return String(i.booking_id || '-');
  if (name === 'record_payment')      return String(i.booking_id || '-');
  if (name === 'save_wedding_detail') return 'budget_total';
  return '-';
}

// ── THE HOLD ────────────────────────────────────────────────────────────────
// Returns null when the hand may proceed (not a money hand, no figure given, the
// predicate excludes it, or every figure appears in her own words). Returns the
// hold otherwise. FAIL-CLOSED on a missing corpus, F15's direction and
// provenanceHold's own: a caller that cannot supply her words cannot vouch for a
// figure.
//
// THE DISPLAY IS A TOOL RESULT, NOT A BRIDE-READABLE STRING. It is read by the
// model, which then speaks in Mira's own voice — exactly as provenanceHold's
// display works on the vendor wire (donna.ts:512-513). No new copy ships here and
// none is owed; W-1 holds and the veto list is untouched.
function checkBrideMoneyProvenance(name, input, brideWords) {
  const spec = MONEY_WRITE_HANDS[name];
  if (!spec) return null;
  if (spec.when && !spec.when(input)) return null;
  const inp = (input && typeof input === 'object') ? input : {};

  const { parseMoney, extractVendorFigures } = engineMoney();
  let figures = null;                       // extracted lazily — most hands carry none
  for (const field of spec.fields) {
    const v = inp[field];
    if (v == null || v === '') continue;
    const figure = parseMoney(v);
    if (figure == null) continue;           // unparseable — the door's own error speaks
    if (figures === null) figures = extractVendorFigures(brideWords || '');
    if (figures.has(figure)) continue;
    return {
      figure, field, hand: name,
      display:
        `HELD — the figure Rs ${figure} is not in her own words this conversation, ` +
        `so nothing was written. A figure enters the record because she said it, or ` +
        `it does not enter at all. Ask her to confirm the amount — or hand the ` +
        `instruction back without the figure and the rest files clean.`,
    };
  }
  return null;
}

// ── CONFIRM-CONSUMED-ONCE (founder-ratified fold, CE-67) ────────────────────
//
// F-05.41's specimen is the derivation, not an analogy: TWO add_booking calls 300
// milliseconds apart, one conversation, both 45000, both DJ-class subjects, both
// ok:true. One "yeah" from the bride, two Rs 45,000 rows. The turn lock (M1) now
// serializes those turns, so the second one arrives AFTER the first has written —
// which is precisely when a spent confirm must be visible as spent.
//
// THE CLAIM IS ON THE WRITE, keyed (conversation, tool, subject, figure), because
// that tuple is what the estate can actually witness: grepped at 0da540a, NO
// pending-confirm state exists anywhere on this lane, so there is no confirm
// object to spend. The write claim is the confirm made mechanical.
//
// THE WINDOW IS SHORT AND THAT IS DELIBERATE. A floor that blocks real work
// teaches the model to route around it; a bride genuinely paying the same vendor
// the same amount next week must not meet a wall. Ninety seconds covers a
// duplicated turn and nothing a human would call a second decision.
//
// ── ITS OWN REPLICA-EXPOSURE SENTENCE (CE-67, F4 — no borrowed cover) ────────
// This claim lives in ONE process's memory, and the turn lock's disclosure does
// NOT cover it. At single-replica — production today — it is total. At two
// replicas the lock and this claim BOTH degrade, but they degrade differently:
// the lock stops serializing, and this claim stops seeing its twin, so two
// replicas could each spend the same confirm once. THE DURABLE CURE IS ITS OWN:
// a unique partial index on (conversation_id, subject, amount) over a short
// window, or an advisory lock keyed on the same tuple — DEFERRED-NAMED here, at
// the home whoever scales this service will read.
const CLAIM_TTL_MS = 90 * 1000;
const _claims = new Map();                  // key -> expiry ms

function moneyClaimKey({ conversationId, name, input, figure }) {
  return `${conversationId || '-'}|${name}|${moneySubject(name, input)}|${figure}`;
}

// Spend the claim. Returns true if THIS caller took it, false if it was already
// spent inside the window. Reaps on every call, so the map is bounded by live
// claims rather than by every claim ever made.
function claimMoneyWrite(key, now = Date.now()) {
  for (const [k, exp] of _claims) if (exp <= now) _claims.delete(k);
  if (_claims.has(key)) return false;
  _claims.set(key, now + CLAIM_TTL_MS);
  return true;
}

function spentDisplay(figure) {
  return `HELD — Rs ${figure} was just written for this on the previous turn and ` +
         `that confirmation is spent. Nothing was written twice. If she means a ` +
         `second, separate payment, say so and it files.`;
}

// The figure a hand is actually about, for the claim key. Same selection as the
// hold, so the two floors cannot disagree about which number is at stake.
function moneyFigureOf(name, input) {
  const spec = MONEY_WRITE_HANDS[name];
  if (!spec) return null;
  if (spec.when && !spec.when(input)) return null;
  const inp = (input && typeof input === 'object') ? input : {};
  const { parseMoney } = engineMoney();
  for (const field of spec.fields) {
    const v = inp[field];
    if (v == null || v === '') continue;
    const f = parseMoney(v);
    if (f != null) return f;
  }
  return null;
}

function _reset() { _claims.clear(); _setEngineMoney(null); }
function _claimCount() { return _claims.size; }

module.exports = {
  MONEY_WRITE_HANDS, CLAIM_TTL_MS,
  checkBrideMoneyProvenance, moneyFigureOf, moneySubject,
  moneyClaimKey, claimMoneyWrite, spentDisplay,
  _reset, _claimCount, _setEngineMoney,
};
