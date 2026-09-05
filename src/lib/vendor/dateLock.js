// src/lib/vendor/dateLock.js
// G3.2 · R-G32.1 — THE DATE LOCK, DERIVED ONCE.
//
// ═══ WHAT THE FOUNDER RULED, AND WHY THIS FILE IS THE WHOLE OF IT ══════════
// The read-first found that `events_state_check` (PUBLIC_SCHEMA.md:1585) allows exactly
// `upcoming | done | cancelled` and that `eventWrite.js:149` mirrors it — so master §4
// G3.3's `events.state='booked'`, which this block's own constitution asserts, DESCRIBES
// A WRITE THE DATABASE REFUSES. The chair did not widen the CHECK:
//
//   **`'booked'` is a fact about a CONTRACT, not about a calendar row.** Three planes
//   already carry the word (`leads.state`, `couple_bookings.state`, `bookings.state`)
//   and `events` carries three states for every reader of the calendar.
//
// So the lock lives on `contracts.deposit_received_at` and the calendar READS it:
//
//     a locked date is an UPCOMING event whose contract has a received deposit.
//
// ═══ WHY IT IS A FILE AND NOT A LINE IN EACH READER ════════════════════════
// `src/lib/vendor/occupancy.js` opens by naming FIVE lists that live in that
// neighbourhood, that are deliberately different, and that must not be unified —
// citing F-04.36 as a regression that HAS ALREADY HAPPENED ONCE. A derived "locked"
// re-computed at every calendar reader would be that regression wearing a new name: ten
// copies of one predicate, drifting the first time the deposit's shape changes.
//
// `sealIsVisible` is the estate's own precedent for the cure — the rule lives once,
// beside the computation, and every caller passes the RESULT of it. This is that, for
// this fact.
//
// ⚠ IT WRITES NOTHING AND IT TOUCHES `public.events` NOT AT ALL.
// No column is added to events by 0138 and no row of it is updated by this sitting.
// `events_owner_xor` (:1580) is why the FK points contract → event and never back: an
// event is owned by a vendor XOR a couple, and a contract is neither.
'use strict';

/**
 * IS THIS ONE EVENT LOCKED?
 *
 * Takes the contract row (or null), never a database handle — same posture as
 * `sealIsVisible`: the decision lives here, the reading lives at the caller, and this
 * function cannot be tempted into a query.
 *
 * @param {object|null} contract — a `contracts` row, or null when the event has none
 * @returns {boolean}
 */
function isLocked(contract) {
  if (!contract) return false;
  // ⚠ THE STATE GATE IS NOT OPTIONAL. A cancelled contract with a deposit that WAS
  // received still holds no date — the money may be owed back under clause 5, and that
  // is a question for the vendor, not a reason for the calendar to keep refusing
  // bookings on a date nobody is coming to.
  if (contract.state !== 'signed') return false;
  return Boolean(contract.deposit_received_at);
}

/**
 * THE LOCKED SET, for a list of events.
 *
 * @param {Array} contracts — `contracts` rows carrying `event_id`, `state`,
 *                            `deposit_received_at`
 * @returns {Set<string>} the `event_id`s that are locked
 *
 * ⚠ ONE ROW MAY LOCK ONE EVENT AND ONLY THE ANCHOR. `contracts.event_id` is the anchor
 * (R-G32.7): the one date the deposit holds. Clause 3's other functions are printed on
 * the paper and are NOT locked by this function, because the founder ruled the lock onto
 * one date and inferring more from a document would be this file deciding product.
 */
function lockedEventIds(contracts) {
  const out = new Set();
  (contracts || []).forEach((c) => {
    if (c && c.event_id && isLocked(c)) out.add(String(c.event_id));
  });
  return out;
}

/**
 * THE READ, for callers that have event ids and want the set.
 *
 * Returns an EMPTY SET on a failed read, never an error, and logs. A calendar that
 * refuses to render because the contract plane hiccuped is a calendar a vendor cannot
 * use; a calendar that shows a date as free when it is held is a smaller and recoverable
 * wrong — she opens the contract and sees the deposit. The failure is declared rather
 * than silent.
 */
async function lockedForEvents(supabase, vendorId, eventIds) {
  const ids = (eventIds || []).filter(Boolean);
  if (!ids.length) return new Set();
  const { data, error } = await supabase
    .from('contracts')
    .select('event_id, state, deposit_received_at')
    .eq('vendor_id', vendorId)
    .in('event_id', ids);
  if (error) {
    console.error('[dateLock:lockedForEvents] read failed —', error.message);
    return new Set();
  }
  return lockedEventIds(data);
}

module.exports = { isLocked, lockedEventIds, lockedForEvents };
