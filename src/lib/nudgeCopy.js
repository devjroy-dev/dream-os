// src/lib/nudgeCopy.js — fixed copy for the nudge class (Block 05, P4).
//
// Sibling of src/lib/prospectCopy.js, same idiom for the same reason: these are
// product copy under FOUNDER VETO, so they live in one keyed home and the veto
// pass is one file. Not templates, not soul, not agent voice — W-1 clean.
//
// VETO STATE AT DELIVERY:
//   • vendor_out_of_window_summary  — RATIFIED (founder, CE-63 relay ①)
//   • opt_out_confirmation          — RATIFIED, register (b) (founder, CE-63 relay ②)
//   • resume_confirmation           — ⚠ PROVISIONAL, NOT YET VETOED. See below.
'use strict';

const NUDGE_COPY = {
  // ── ITEM 4 · RATIFIED VERBATIM ────────────────────────────────────────────
  // The vendor {{2}} for tdw_morning_nudge_vendor, mirroring brideCron.js's
  // OUT_OF_WINDOW_SUMMARY. SINGLE LINE — a '\n' here is a Meta template
  // parameter rejection, not a style opinion (docs/TEMPLATES.md §1).
  // Renders as: "Good morning {name}. Here's your day: <this>. Reply STOP
  // MORNINGS to pause these updates."
  vendor_out_of_window_summary:
    "your morning briefing is ready — reply here to see today's bookings and dues",

  // ── ITEM 5 · RATIFIED VERBATIM, register (b) ──────────────────────────────
  // Sent on STOP MORNINGS. It MUST say it is not a full STOP — that sentence is
  // the ratified point of the line, not decoration: a recipient who believes a
  // pause was a full opt-out has been misled about what the estate will still
  // send them.
  opt_out_confirmation:
    "Done — no more morning messages. Everything else stays as it is; this isn't a full STOP. Reply START MORNINGS whenever you want them back.",

  // ── THE RESUME LINE · PROVISIONAL — NAMED FOR THE VETO PASS ───────────────
  // ⚠ NOT founder-ratified. The relay chartered the START MORNINGS branch in and
  // ratified the line that PROMISES it, but no copy was given for the
  // acknowledgement itself. Authored here as the plain mirror of the ratified
  // pause line rather than left silent — a resume that answers with nothing
  // reads as a resume that failed, and would send the recipient back to STOP.
  // Disclosed in the handover under the founder's standing copy veto; reshaping
  // it is a one-line change with no code consequence.
  resume_confirmation:
    "Morning messages are back on — you'll get the next one tomorrow. Reply STOP MORNINGS any time to pause them again.",
};

function getNudgeCopy(key) {
  return Object.prototype.hasOwnProperty.call(NUDGE_COPY, key) ? NUDGE_COPY[key] : null;
}

module.exports = { NUDGE_COPY, getNudgeCopy };
