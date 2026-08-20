'use strict';
// src/lib/istDay.js
// ─────────────────────────────────────────────────────────────────────────────
// TDW_15 · P3 · R-35.23 — THE DAY BOUNDARY: ONE SEMANTIC, ONE HOME (dream-os).
//
// THE RULED SEMANTIC: the estate serves THE WEDDING'S TIMEZONE, WHICH IS IST.
// `couples.wedding_date` is a bare `date` — witnessed at its column LINE in
// `docs/db/PUBLIC_SCHEMA.md`, block `## public.couples · 23 columns`, line
// `4. wedding_date date` (F-SW.9 standing: headers are untrusted, column lines
// are the witness). A bare `date` carries no timezone at all, so there is no
// "her local" to serve and none to guess at: the number she wakes to counts
// mornings until an IST calendar day, wherever she happens to be standing.
//
// ── THE REFERENCE IMPLEMENTATION, AND IT IS READ-ONLY TO THIS FILE ───────────
// `src/agent/brideNudge.js` · symbol `buildNudge`. It has been IST-correct
// since it was written and it is W-1's. This module MIRRORS its arithmetic by
// ruling: it does not import from it, does not amend it, and does not fold it.
// If the two ever disagree, `buildNudge` is right and THIS file is the defect.
//
// ONE DELIBERATE DIVERGENCE FROM THE REFERENCE, so no reader reports it as a
// mirroring error: `buildNudge` returns `null` for a wedding already past;
// `daysUntilIst` CLAMPS TO 0, because that is what the couple-facing door has
// always returned and R-35.23 preserved it ("past-wedding clamps 0 in both, as
// today"). The divergence is in the clamp only. The day arithmetic is identical.
//
// ── THE UTC-PARSE TRAP — F-15.17, NAMED SO NOBODY SIMPLIFIES IT BACK ─────────
// ECMAScript parses a DATE-ONLY string as UTC and a DATE-TIME string without an
// offset as LOCAL:
//
//     new Date('2027-02-14')            →  2027-02-14T00:00:00Z   (UTC midnight)
//     new Date('2027-02-14T00:00:00')   →  local midnight          (host TZ)
//
// That asymmetry is the trap, and it is F-15.8's exact class one plane over.
//
// THE CURE IS NOT TO AVOID THE UTC PARSE. It is to put BOTH OPERANDS THROUGH
// THE SAME PARSE, so the shared UTC basis CANCELS in the subtraction and what
// survives is a pure count of calendar days between two IST dates:
//
//     target = new Date( <the wedding's YYYY-MM-DD> )        UTC midnight
//     origin = new Date( istTodayStr(now) )                  UTC midnight
//
// TWO "SIMPLIFICATIONS" REINTRODUCE THE BUG, and both have been written before
// in this estate:
//
//   1. Replacing `new Date(istTodayStr(now))` with `now`, or with `new Date()`
//      followed by `.setHours(0,0,0,0)`. That is a LOCAL midnight measured
//      against a UTC midnight; the bases stop cancelling and the figure reads
//      ONE HIGH for the 5.5 hours after IST midnight. That is precisely the
//      shape F-15.17 records against this door's own prior ink.
//   2. Appending a time to the wedding string (`weddingDate + 'T00:00:00'`).
//      That flips the OTHER operand to local parsing and breaks the same
//      cancellation from the far end.
//
// [F-06.85 class: the paragraph above is conditioned on a MECHANICAL fact —
//  that `couples.wedding_date` is a `date` and not a `timestamptz`. If that
//  column is ever widened, `dateKey`'s leading-key extraction below silently
//  starts reading a UTC day out of an instant, and this whole header must be
//  re-derived rather than trusted.]
// ─────────────────────────────────────────────────────────────────────────────

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

// Normalise a `date` column value to its YYYY-MM-DD key.
//
// The supabase-js driver returns a `date` column as a plain 'YYYY-MM-DD'
// string, which is the only shape this estate writes. A `Date` is accepted
// defensively and reduced by its UTC day — correct for a Date that was itself
// built from a date-only string, which is the only way one can arrive here.
// Anything else returns null rather than guessing (F-15.8's lesson: a reader
// that half-parses an unexpected shape prints a database artifact at a bride).
function dateKey(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return m ? m[1] : null;
}

// TODAY'S IST CALENDAR DAY as a YYYY-MM-DD key.
//
// `now` is a parameter and not a wall-clock read so that this function is
// benchable against fixture clocks. Production passes `new Date()`.
function istTodayStr(now = new Date()) {
  const t = (now instanceof Date) ? now.getTime() : new Date(now).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// MORNINGS TO GO, counted in IST calendar days.
//
// Returns null when there is no usable wedding date — an absent date and a
// wedding that has passed are DIFFERENT ANSWERS and are never conflated: the
// first is null (she has not told us), the second is 0 (it is here or behind
// her). R-34.22's two-emptinesses discipline, one plane over.
//
// `Math.round` is carried from the reference implementation. Both operands are
// exact UTC midnights, so the quotient is already integral and the rounding
// mode cannot change the answer; it is mirrored for fidelity to `buildNudge`,
// not to correct anything.
function daysUntilIst(weddingDate, now = new Date()) {
  const targetKey = dateKey(weddingDate);
  if (!targetKey) return null;

  const originKey = istTodayStr(now);
  if (!originKey) return null;

  const targetMs = new Date(targetKey).getTime();   // UTC midnight — see header
  const originMs = new Date(originKey).getTime();   // UTC midnight — see header
  if (Number.isNaN(targetMs) || Number.isNaN(originMs)) return null;

  const diff = Math.round((targetMs - originMs) / DAY_MS);
  return diff > 0 ? diff : 0;
}

module.exports = { IST_OFFSET_MS, dateKey, istTodayStr, daysUntilIst };
