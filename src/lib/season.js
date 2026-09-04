// src/lib/season.js
// THE FOUR SEASONS — R-40.25, founder-vetoed 2026-09-04. ONE HOME (R-G11.16).
//
// ═══════════════════════════════════════════════════════════════════════════
// THESE FOUR WORDS ARE COUPLE-FACING COPY, NOT A LOOKUP TABLE
// ═══════════════════════════════════════════════════════════════════════════
// They render on the public wedding page's meta line — `Venue · City · Season
// Year` — and on the A4 sheet a couple keeps. F-40.35 is why they needed a
// veto at all: the ratified mock drew exactly ONE season string (`Winter
// 2027`) and the other three were unauthored, while R-G11.20's fixture
// (Verma – reception, 31 Jul) cannot produce the one that was drawn. Inventing
// the missing three would have been the copy law's own bounce.
//
// The founder's table, verbatim and byte-frozen:
//     Nov–Feb  Winter
//     Mar–Apr  Spring
//     May–Jul  Summer
//     Aug–Oct  Monsoon
//
// It is NOT four equal quarters and that is deliberate — Winter takes four
// months and Spring two, because this is the Indian wedding calendar and not a
// meteorological one. Do not "tidy" the bands.
//
// ⚠ NO SEASON COLUMN EXISTS (R-G11.16). Season is derived at read from
// `events.event_date` every time it is asked for. A stored season is a second
// home for a fact the date already determines, and it goes stale the first
// time a date moves.
'use strict';

/**
 * Month (1–12) → the founder's word. Written as a literal twelve-entry map
 * rather than as range arithmetic, because ranges that wrap the year end are
 * exactly where an off-by-one hides: `Nov–Feb` is the band that crosses
 * December, and a comparison like `m >= 11 || m <= 2` is correct today and one
 * careless edit from being wrong in a way no reader would spot. Twelve lines
 * cannot wrap.
 */
const SEASON_BY_MONTH = Object.freeze({
  1:  'Winter',
  2:  'Winter',
  3:  'Spring',
  4:  'Spring',
  5:  'Summer',
  6:  'Summer',
  7:  'Summer',
  8:  'Monsoon',
  9:  'Monsoon',
  10: 'Monsoon',
  11: 'Winter',
  12: 'Winter',
});

/** The four, in calendar order from the year's start. Exported so a bench can
 *  assert the SET without retyping it, and so no second list is ever written. */
const SEASONS = Object.freeze(['Winter', 'Spring', 'Summer', 'Monsoon']);

/**
 * ⚠ THE DATE IS PARSED AS A STRING, NEVER THROUGH `new Date()`.
 *
 * `public.events.event_date` is a Postgres `date` and arrives as `YYYY-MM-DD`.
 * `new Date('2026-07-31')` parses as UTC MIDNIGHT, and this estate runs its
 * days in IST (UTC+5:30) — so a `.getMonth()` off that value is correct for
 * eleven months and wrong for the 31st of a month read from a machine behind
 * UTC. A wedding on 1 March would render `Winter` because a timezone moved it
 * to 28 February. There is no clock in this function and there does not need
 * to be one: the string already says which month it is.
 */
function seasonFor(eventDate) {
  const s = String(eventDate == null ? '' : eventDate).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]);
  return SEASON_BY_MONTH[month] || null;
}

/** The year is the EVENT'S year, per R-40.25's own sentence: a Winter wedding
 *  in January carries the January year. No band shifts a year across December. */
function seasonYearFor(eventDate) {
  const s = String(eventDate == null ? '' : eventDate).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const season = SEASON_BY_MONTH[Number(m[2])];
  return season ? `${season} ${m[1]}` : null;
}

module.exports = { SEASONS, SEASON_BY_MONTH, seasonFor, seasonYearFor };
