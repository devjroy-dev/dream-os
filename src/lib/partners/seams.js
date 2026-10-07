'use strict';
// src/lib/partners/seams.js · CE-47 · PTN-A2-1 · WHERE PTN MEETS OTHER SEATS' CODE, ONE FILE.
// A1 declared these and called none. A2-1 wires the three CLB-2a landed (live on main since server train 4) and keeps
// the two that have not landed as plain refusals:
//   createCallFor, addPartnerInterest, onPostCreated  <- CLB-2a (src/lib/collab/calls.js, interest.js, events.js): WIRED
//   The Hub's per-vendor gate is NOT a seam: PTN requires CLB's src/lib/hub/gate.js hubOpen directly (Rule 1's one
//   home, HUB-2b; the chair, 7 Oct 2026).
//   kitFor                                            <- PRO's P3 (not landed): refuses, plainly
//   verifiedWeddingsFor                               <- PRO P1 (landed): src/lib/papers/verifiedWeddings.js countVerified
const { createCallFor } = require('../collab/calls');
const { addPartnerInterest } = require('../collab/interest');
const { onPostCreated } = require('../collab/events');
const { countVerified } = require('../papers/verifiedWeddings');

const NOT_YET = (name, owner) => async () => { throw new Error(`${name} is not wired yet: it arrives with ${owner}`); };

module.exports = Object.freeze({
  createCallFor, addPartnerInterest, onPostCreated,
  kitFor: NOT_YET('kitFor', "PRO's P3 (the media kit)"),
  verifiedWeddingsFor: countVerified,
});
