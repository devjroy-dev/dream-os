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

  // ── THE RESUME LINE · RATIFIED AS SHIPPED (founder, CE-63 relay ②) ────────
  // Authored by the executor as the mirror of the ratified pause line — a resume
  // that answers with nothing reads as a resume that FAILED, and would send the
  // recipient back to STOP. Witnessed on a real handset in the P4 smoke and
  // ratified verbatim; the provisional marker was struck in the closing micro,
  // because a ratified line wearing a provisional flag is the stale-comment class
  // this block already exists to warn about.
  resume_confirmation:
    "Morning messages are back on — you'll get the next one tomorrow. Reply STOP MORNINGS any time to pause them again.",

  // ── F-05.25 · THE BARE-STOP ACKNOWLEDGMENT · RATIFIED (founder, 2026-07-23) ─
  // Ratified BY NAME after being witnessed twice on a live handset in the closing
  // micro's smoke. The provisional marker was struck in the second micro; a
  // ratified line wearing a provisional flag is the stale-comment class.
  //
  // TERMINAL REGISTER, and that is the ruled point. What a bride or vendor gets
  // TODAY for typing STOP is a chatty agent turn — "Got it. What's up?" — which
  // is the estate answering a compliance keyword as if it were small talk.
  //
  // VOCABULARY DERIVED FROM THE MARKETING LANE, not invented. Its own line
  // (prospectCopy.js:20-21) reads:
  //     "You're opted out — you won't hear from us again. Reply START any time
  //      if you change your mind."
  // Three properties carried across: the flat past-tense declaration, the
  // absoluteness ("won't hear from us again"), and START as the single named way
  // back. Two properties added for these lanes, where the marketing line's
  // assumptions do not hold: this is a product the recipient is USING, not a
  // campaign she received, so the line names what stops (everything, not a
  // category) and distinguishes itself from STOP MORNINGS — otherwise the two
  // opt-outs shipped in one block would be indistinguishable from the handset.
  //
  // ── RECONCILED TO THE G-A RULING · V-1 RATIFIED (founder, CE-67: "yes to all") ─
  // THE LINE HAD TO CHANGE, and the reason is that the machine changed underneath
  // it. F-05.33's cure was ruled shape (b)+(c) — the founder's word "YOUR
  // SUGGESTION" — which means STOP now silences everything Mira INITIATES while
  // her answers to the bride's OWN messages always deliver. From that ruling
  // forward, "I won't message you again, about anything" was no longer the truth
  // of the machine: she WILL be answered the moment she writes. An acknowledgment
  // that promises more silence than the estate delivers is F-05.22's class exactly
  // — a promise with no machinery — pointed the other way.
  //
  // What the rewrite preserves, deliberately: the flat past-tense declaration, an
  // absoluteness (now of INITIATION, which is the thing that actually stops), and
  // START as the single named way back. What it ADDS is the second half the ruling
  // created — that writing to her still works — because a line that states only
  // the silence would now be lying in the other direction. The STOP-vs-STOP
  // MORNINGS distinction survives untouched; two opt-outs shipped in one block
  // still must not read as one.
  full_stop_confirmation:
    "You're opted out — I won't message you first about anything. If you write to me I'll still answer; reply START to turn messages back on. If you only wanted to pause the daily updates, reply START and then STOP MORNINGS instead.",

  // The resume acknowledgment for a full STOP.
  // ── V-2 · THE CE-63 HOLD IS CLOSED BY RATIFICATION (founder, CE-67) ─────────
  // This sibling shipped live and worked, but was never NAMED in the F-05.25
  // ratification, so CE-63 held its marker rather than assume the founder's veto
  // reached further than his own words — reading a veto broader than it was given
  // is how copy ships that nobody approved. It has now been ratified by name and
  // the string stands BYTE-EXACT: nothing about it needed to change, because this
  // is the one state in which "I'll message you again" was always true.
  full_start_confirmation:
    "You're back on — I'll message you again when there's something worth saying.",
};

function getNudgeCopy(key) {
  return Object.prototype.hasOwnProperty.call(NUDGE_COPY, key) ? NUDGE_COPY[key] : null;
}

module.exports = { NUDGE_COPY, getNudgeCopy };
