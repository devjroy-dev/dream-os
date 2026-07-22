// src/lib/vendor/binderTitles.js
// TDW_04.5 · P5 — THE BINDER-TITLE HOP'S ONE HOME (CE ruling, Fork D1).
//
// ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
// P5's `By wedding` grouping needs the same thing P2's band board needs: given a
// set of `linked_binder_id`s, the wedding's NAME. That resolution lived inline at
// `bands.js:143-157` and nowhere else. Copying it would have been F-04.104's class
// exactly — one rule, two bodies, divergence at the first edit.
//
// ── WHY THE WHOLE BAND ASSEMBLY WAS *NOT* REUSED (the read-first's three facts,
//    adopted as the ruling's reasoning and recorded here per the CE's direction) ─
// `buildBands` was the obvious candidate and it is the wrong one, three ways:
//   1. WRONG SPINE. `buildBands` is EVENT-spined. P5 is PAYMENT-spined: the rows
//      are obligations, and an obligation is real whether or not its function is
//      inside anybody's grid window.
//   2. WRONG WINDOW. `buildBands` requires `from`/`to` (`bands.js:254`, DATE_RE
//      enforced) and caps at BAND_CAP. Payments have no window. A payout can point
//      at a function a year outside any month the vendor is looking at.
//   3. WRONG FILTERS. `bands.js:96-97` drops `state='cancelled'` and
//      `kind='blocked'`. **A cancelled function's crew is still owed.** Money does
//      not disappear because a wedding did. Reusing those filters would have made
//      the subtotals lie by omission.
// So the SHARED ORGAN is the hop, not the assembly. This file is the hop.
//
// ── PLANE (SQL-provenance law: every column names its witness) ───────────────
// ENGINE (`.schema('engine')`, ONE enumerated hop — bands.js:147's exact class):
//   · records — 21 cols, docs/db/ENGINE_SCHEMA.md:341-362. Read here: id, client
//     (the wedding's name) and the four money cells amount (:344) · direction
//     (:340 as col 6) · amount_received (:359) · amount_pending (:360). The cells
//     travel because bands.js's caller needs them; P5 reads only `client`.
// This file writes NOTHING and reads nothing on the PUBLIC plane.
//
// ── FAIL POSTURE (moved verbatim with the body it belongs to) ────────────────
// The hop is DECORATION, never spine. A failed hop returns an EMPTY map with a
// console.warn — the caller then renders "Untitled wedding" rather than failing.
// Absent-honesty: a wedding with no resolvable name has no name, and says so.

'use strict';

/**
 * Resolve engine binder records for a set of binder ids.
 *
 * The body below is a PURE MOVE out of `bands.js:145-157` — same query, same
 * columns, same soft-fail, same map. ONE byte changed and it is declared: the
 * `console.warn` prefix was a hard-coded `'[GET /vendor/bands]'` and is now the
 * caller's `label`, because two callers cannot share one literal honestly.
 *
 * @param {object}   supabase          the public-default client
 * @param {object}   args
 * @param {?string}  args.agentId      engine agent, or null => no hop at all
 * @param {string[]} args.binderIds    binder ids to resolve (deduped by caller)
 * @param {string}   args.label        log prefix, the caller's own route name
 * @returns {Promise<Map<string, object>>} binderId -> record row (empty on failure)
 */
async function binderRecordsByIds(supabase, { agentId, binderIds, label }) {
  const binderById = new Map();
  if (agentId && binderIds.length) {
    try {
      const { data: recs, error: recErr } = await supabase.schema('engine')
        .from('records')
        .select('id, client, amount, direction, amount_received, amount_pending')
        .eq('agent_id', agentId)
        .in('id', binderIds);
      if (recErr) throw recErr;
      for (const r of (recs || [])) binderById.set(r.id, r);
    } catch (e) {
      console.warn(`${label} binder hop failed (soft):`, e.message);
    }
  }
  return binderById;
}

/**
 * The wedding's name, or null.
 *
 * Moved from `bands.js:210`'s inline expression, byte-for-byte in substance:
 * `rec && rec.client ? rec.client : null`. Null is the WIRE's honest answer;
 * the vetoed word "Untitled wedding" lives on the client with its siblings.
 * Both surfaces now ask the same function, so they cannot drift into two
 * different ideas of what an unnamed wedding is called.
 */
function titleOfRecord(rec) {
  return rec && rec.client ? rec.client : null;
}

module.exports = { binderRecordsByIds, titleOfRecord };
