// src/lib/capabilities.js — THE SWITCHBOARD'S READ, AS A STUB (R-41.20).
//
// ⚠ THIS FILE IS A PLACEHOLDER SEAT C REPLACES FILE-FOR-FILE. Until the
// `public.capabilities` register exists (CE-41 roadmap §4, seat C1), every gate
// in Business Solutions is OFF, and this is the one home that says so. It takes
// no env var, reads no table, and returns `false` for every key — so a send arm
// written behind `cap.on(key)` cannot fire by accident before the register is
// built, and so the eventual replacement changes ONE file and zero callers.
//
// Contract seat C must keep (the callers are written against it):
//   on(key: string): boolean   — synchronous, never throws, false for unknown keys.
//
// Keys named in this tree today (one home per gate; the strings are the
// register's keys, so grep finds every reader):
//   template.tdw_assist_lead_outside   — Block 20 s1, forwardAssistanceItem (dark)
//
// NOT THIS FILE'S BUSINESS: src/lib/laneFlags.js (model-facing lanes, F-08.56) is
// a different law and is out of radius (roadmap §4).

'use strict';

const CAPABILITY_KEYS = Object.freeze({
  TDW_ASSIST_LEAD_OUTSIDE: 'template.tdw_assist_lead_outside',
});

// Stub: everything is off. Seat C replaces the body, not the signature.
function on(key) {
  void key;
  return false;
}

module.exports = { on, CAPABILITY_KEYS, IS_STUB: true };
