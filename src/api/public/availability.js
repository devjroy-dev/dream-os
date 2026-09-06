// src/api/public/availability.js
// TDW_19 · G3.1 · THE PUBLIC DATE CHECK — R-G31.1, R-40.77, R-40.78, R-G31.4.
//
// ═══════════════════════════════════════════════════════════════════════════
// ONE QUESTION, ONE WORD'S WORTH OF SHAPE, AND NEVER A NAME
// ═══════════════════════════════════════════════════════════════════════════
// A stranger on a couple's phone asks: is she free on 4 December? This door
// answers with `describeDate`'s own shape and NOTHING ELSE. It does not send a
// title, an id, a slot's occupant, a client, a count of anything nameable, or
// the vendor's phone (R-G11.6). The LEAF renders the word; the DOOR returns the
// shape. That split is R-G31.2/.3's, and it exists so the four ruled answers
// have exactly one author — `lib/public/copy.ts` — rather than one here and one
// there that drift on the first edit.
//
// ── THE ANSWER IS NOT `blocked`, AND THAT IS THE WHOLE TRAP ────────────────
// R-G31.1's first arm is `blocked === true` **OR EVERY SLOT AT CAPACITY**. The
// second limb is not a footnote: driven over the founder's own fixture row
// (`Sharma - sangeet`, ceremony, full_day, 2026-12-04) `describeDate` returns
// `blocked:FALSE` with morning, noon and evening each at `held 1 / capacity 1`.
// `blocked` is true only for rows of `kind='blocked'`, and a ceremony is not
// one. A leaf reading `blocked` alone would answer "some of the day is held"
// for a studio whose entire day is sold. The arithmetic ships as `sold` below
// so the leaf cannot get it wrong and so the bench can drive it directly.
//
// ── WHY THE SWITCH IS CHECKED HERE AND NOT ONLY ON THE LEAF ────────────────
// The leaf hides the control when the switch is off. That is chrome. THIS is
// the enforcement: a URL typed by hand, a stale link, or a crawler that saw the
// form once must all get the same nothing. A consent gate that lives only in
// the renderer is a consent gate a curl bypasses.
//
// ── R-40.78 · A TRADE WITH NO CAPACITY TO ANSWER ───────────────────────────
// `describeDate` returns `occupancy:'off'` for two different reasons — a
// planner is RULED OFF (a decision) and a hairstylist is UNMAPPED (nobody has
// decided). Either way there is no capacity to answer with, and `Free forever`
// would be a lie by construction. This door refuses BOTH with the same miss the
// switch-off case gets, because the reason belongs in her room, not on a public
// wire where it would describe her business to a stranger.

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { describeDate } = require('../../lib/vendor/occupancy');
const { hit, LIMIT_IP_MISS } = require('../crew');

// ⚠ BYTE-IDENTICAL TO `vendorCard.js:213` AND `weddingPage.js`'s. One miss, one
// body, no reason leaked. Paused, absent, switch-off, wrong-trade and
// never-existed are INDISTINGUISHABLE here — five states, one answer, because
// any one of them told apart is a fact about a business a stranger did not earn.
function notFound(res) {
  return res.status(404).json({ ok: false, code: 'not_found' });
}

// ⚠ THE LIMITER IS NOT NEW — the THIRD instance of crew's CE-ruled bucket, at
// crew's OWN `LIMIT_IP_MISS` budget (30 / 10 min / IP), reused exactly as
// `demo/vendor.js:339` reuses it and for the same stated reason: this door is
// unauthenticated, handle-keyed and publicly enumerable. A second limiter with
// a second budget would be two homes for one policy.
//
// CREW'S PER-PROCESS DISCLOSURE IS INHERITED VERBATIM, because a limiter whose
// limits are not what they appear is worse than none if nobody says so: this
// ceiling is PER PROCESS. Railway can run more than one instance and each holds
// its own buckets, so the effective global ceiling is (limit x instances), and a
// restart forgets every bucket.
//
// ⚠ AND IT IS KEYED ON IP ALONE, NOT ON (IP, DATE). Keying it per date would
// let one address sweep a whole season at 30 dates a minute, which is exactly
// the enumeration F-40.163 prices. One bucket per address is the bound.
function limited(res, retryAfter) {
  res.set('Retry-After', String(retryAfter));
  return res.status(429).json({ ok: false, code: 'rate_limited' });
}

// ISO calendar dates only, and validated BEFORE the vendor lookup so a malformed
// probe costs one regex rather than a query. `describeDate` compares this string
// against `events.event_date` directly, so anything Postgres would have to
// coerce is refused here instead.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function isRealDate(s) {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  // Round-trips only for a date that actually exists: 2026-02-31 parses and
  // then prints as 2026-03-03, so equality is the test and not parseability.
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * ⚠ THE ARITHMETIC HAS ONE HOME AND IT IS EXPORTED — and the reason is a defect
 * this bench caught in itself. `b58` first restated these two expressions in its
 * own file and drove the restatement; deleting the length guard from the ROUTE
 * then changed nothing and the bench stayed GREEN. A cell that re-implements the
 * thing it is guarding is testing its own copy, which is the hollow green this
 * estate calls worse than a declared gap. So the route computes nothing inline,
 * `b58` imports THIS, and a mutation to this function reddens it.
 *
 * R-G31.1, restated where it is computed:
 *   blocked === true  OR  every slot at capacity   →  Booked
 *   blocked === false AND any slot held            →  Some of the day is held
 *   blocked === false AND no slot held             →  Free
 *   blocked === null                               →  Couldn't check just now
 */
function verdictOf(out) {
  const slots = Array.isArray(out.slots) ? out.slots : [];
  return {
    date: out.date,
    // Three-valued and kept that way: true / false / null. Never coerced.
    blocked: out.blocked === null || out.blocked === undefined ? null : out.blocked === true,
    // ⚠ `slots` EMPTY MEANS THERE IS NOTHING TO BE AT CAPACITY, and `every` on
    // an empty array is TRUE. Without the length guard an occupancy-off trade
    // would compute sold:true and answer Booked on every date it ever had —
    // the mirror image of the Free-forever lie R-40.78 was written to kill.
    sold: slots.length > 0
      && slots.every((s) => typeof s.capacity === 'number' && s.held >= s.capacity),
    // Any part of the day spoken for. Only consulted when `sold` is false.
    any_held: slots.some((s) => Number(s.held) > 0),
    occupancy: out.occupancy,
  };
}

/**
 * GET /api/v2/public/availability/:code/:date
 *
 * 200 { ok, date, blocked, sold, any_held, occupancy }
 * 404 { ok:false, code:'not_found' }   — every refusal, indistinguishable
 * 429 { ok:false, code:'rate_limited' }
 */
router.get('/:code/:date', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // `app.set('trust proxy', true)` (src/index.js) makes req.ip the real client.
  const gate = hit(`availability:${req.ip}`, LIMIT_IP_MISS);
  if (!gate.allowed) return limited(res, gate.retryAfter);

  const code = String(req.params.code || '').trim().toLowerCase();
  const date = String(req.params.date || '').trim();
  if (!code || !isRealDate(date)) return notFound(res);

  // ⚠ THE SELECT IS AN ALLOWLIST, and `date_check_enabled` is the point of it.
  // `vendorCard.js:194` states the law this follows: these are the strings the
  // query is built from, so there is no code path that could produce a `*`.
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id, status, discover_paused, date_check_enabled')
    .eq('routing_handle', code.toUpperCase())
    .maybeSingle();

  // A read failure is NOT a miss and must not be answered as one — that would
  // tell a stranger "no such vendor" on the strength of a dropped connection.
  // It is the same could-not-see the checker itself reports, and R-G31.1's
  // fourth answer exists for exactly this: `blocked:null` renders "Couldn't
  // check just now", never "Free" and never a 404.
  if (error) {
    return res.json(Object.assign({ ok: true }, verdictOf({ date, blocked: null, slots: [], occupancy: 'on' })));
  }

  // The three gates, all answered with ONE indistinguishable miss:
  //   · no such handle
  //   · not active, or paused from the public lane
  //   · R-40.77 — she has not turned the check on. SILENCE IS NOT YES.
  if (!vendor) return notFound(res);
  if (vendor.status !== 'active' || vendor.discover_paused === true) return notFound(res);
  if (vendor.date_check_enabled !== true) return notFound(res);

  const out = await describeDate({ supabase, vendorId: vendor.id, date });

  // R-40.78. `occupancy:'off'` means this trade has no capacity to answer with,
  // for either of its two reasons. The switch is not offered to her at all, so
  // reaching here means a hand-typed URL or a stale link — same miss.
  if (out && out.occupancy === 'off') return notFound(res);

  // The checker's own could-not-see, carried rather than translated.
  if (!out) {
    return res.json(Object.assign({ ok: true }, verdictOf({ date, blocked: null, slots: [], occupancy: 'on' })));
  }

  return res.json(Object.assign({ ok: true }, verdictOf(out)));
  // ⚠ WHAT IS DELIBERATELY NOT ON THIS WIRE: `slots` itself. Sending the array
  // would tell a stranger the shape of the day — that the morning is taken and
  // the evening is not — which is the outline of somebody else's wedding. The
  // leaf needs one word and gets exactly the three booleans that produce it.
}));

module.exports = router;
// Exported for `b58` so the bench drives the shipped arithmetic, never a copy.
module.exports.verdictOf = verdictOf;
