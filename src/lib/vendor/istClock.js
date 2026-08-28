'use strict';
// src/lib/vendor/istClock.js
// THE IST DAY BOUNDARY — ONE HOME, FOUNDED HERE.
//
// ── WHY THIS FILE EXISTS (F-4, ruled arm (b) at the Phase 3 read-first) ─────
// `istTodayISO` had FIVE independent declarations at 0ca7f08, derived by
// command at the read-first:
//
//   src/api/vendor-engine/today.js:34      src/api/vendor-engine/cabinet.js:20
//   src/api/vendor/events.js:80            src/api/vendor/studio/briefing.js:16
//   src/api/crew.js:227 (as `istToday`)
//
// plus bare `IST_OFFSET_MS` literals at src/api/vendor/context.js:36 and
// src/agent/brideNudge.js:42, and an `IST_OFFSET_MIN = 330` at
// src/api/admin/bridge.js:109 — the same constant in a different unit.
//
// The one-home law says import. There was nothing to import FROM, which is how
// five copies happen: each author was obeying the law's spirit and had no
// destination. THIS FILE IS THE DESTINATION.
//
// ── LABELLED AMENDMENT · R-P3.5.2, 2026-08-28 · THE CLEANUP IS PERFORMED ───
// THE PARAGRAPH THAT STOOD HERE IS RETIRED WITH ITS READER. It said the five
// sites were byte-untouched and the cleanup was "chartered, not performed".
// Both halves are now false, and a header that outlives its subject is
// F-09.50's class — the disease this estate deleted a whole file over.
//
// SIX sites now import from here, not five. `context.js` had grown its own
// `istTodayISO` since 0ca7f08 and the list above still calls it a bare-literal
// site; `crew.js:227` was always the sixth and was invisible to every census
// keyed on the SYMBOL, because it spelled itself `istToday`. That is the
// finding worth carrying forward: a duplicate that renames itself defeats a
// grep and is caught only by a header that names sites. Re-derived at
// `aeca43f`, the six:
//
//   src/api/vendor-engine/today.js    src/api/vendor-engine/cabinet.js
//   src/api/vendor/events.js          src/api/vendor/context.js
//   src/api/vendor/studio/briefing.js src/api/crew.js (exports `istToday`)
//
// `src/api/vendor/worklistToday.js` imported from here already and was never a
// home; the P3.5 read ladder listed it as one and did not list `crew.js`.
//
// WHAT IS STILL NOT DONE, WITH ITS ADDRESS. Seventeen offset literals remain
// outside this plane — bride, agent, cron and admin paths, including
// `src/api/admin/bridge.js:109`'s `IST_OFFSET_MIN = 330`, the same constant in
// minutes, which no grep for `19800` or `+05:30` can see. Filed F-P3.13 with
// addresses; the cure is chartered to a sitting licensed to touch those paths.
// This one was not.
//
// ── THE ARITHMETIC IS THE ESTATE'S OWN, COPIED NOT INVENTED ────────────────
// Byte-equivalent to src/api/vendor-engine/today.js:33-39, which is the
// specimen the other four agree with. Asia/Kolkata is UTC+5:30 with no daylight
// rule, so the fixed offset is exact — this is NOT the class of bug that
// hand-sliced UTC arithmetic usually is, and the reason it is safe here is that
// the zone has no transitions to miss. A zone with DST would need `Intl`.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date in IST, as `YYYY-MM-DD`. */
function istTodayISO(now = Date.now()) {
  return new Date(now + IST_OFFSET_MS).toISOString().split('T')[0];
}

/** `days` from today in IST, as `YYYY-MM-DD`. Negative values look backwards. */
function istPlusDaysISO(days, now = Date.now()) {
  return new Date(now + IST_OFFSET_MS + days * 86400000).toISOString().split('T')[0];
}

/**
 * The IST calendar date of an arbitrary timestamp, as `YYYY-MM-DD`.
 *
 * This is the function §8.7's `done_today` needs and the four existing copies
 * do NOT have: they answer "what is today", never "what day was this row's
 * timestamp". A completion at 23:00 IST on the 26th is 17:30Z on the 26th and
 * would read as the 26th either way — but a completion at 02:00 IST on the 27th
 * is 20:30Z on the 26th, and slicing the raw UTC string would file it under the
 * wrong day. That is the whole reason this takes the offset rather than
 * `String(ts).slice(0,10)`.
 *
 * Returns null for null/undefined/unparseable input, because a row with no
 * completion timestamp is a legitimate answer and must not become a date.
 */
function istDateOf(ts) {
  if (ts === null || ts === undefined || ts === '') return null;
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms + IST_OFFSET_MS).toISOString().split('T')[0];
}

/**
 * The UTC half-open window `[start, end)` covering one IST calendar day.
 *
 * WHY A WINDOW AND NOT A CAST. `done_today` must ask "did this timestamptz land
 * on today, in Kolkata". The SQL that reads most naturally is
 * `last_payment_at::date = CURRENT_DATE`, and it is wrong twice: it casts in
 * the SERVER's zone, and a cast on the left of the comparison cannot use an
 * index on that column. A half-open range on the raw column is exact, zone-
 * correct, and sargable. IST day D runs from D-1T18:30:00Z to DT18:30:00Z.
 *
 * Half-open by construction: a payment at exactly 18:30:00Z belongs to the NEXT
 * IST day, and `< end` is what says so. A closed range would file it twice.
 */
function istDayWindowUtc(dateISO) {
  const startMs = Date.parse(`${dateISO}T00:00:00Z`) - IST_OFFSET_MS;
  return {
    start: new Date(startMs).toISOString(),
    end:   new Date(startMs + 86400000).toISOString(),
  };
}

module.exports = { IST_OFFSET_MS, istTodayISO, istPlusDaysISO, istDateOf, istDayWindowUtc };
