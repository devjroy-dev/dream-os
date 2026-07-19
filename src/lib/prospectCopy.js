// src/lib/prospectCopy.js — fixed free-form utility copy for the prospect lane (Block 05, P3).
//
// These are NOT Meta templates (they are free-form, sent inside an open 24h session) and NOT
// agent voice/soul (W-1 clean — the Closer's soul is 06's, and slots in later with ZERO
// transport change). They are product copy under founder veto: one keyed home so the veto
// pass is one file and 06's soul swap is a one-line change (holding_line → the Closer).
//
// On the founder veto list at delivery:
//   • holding_line          — the single reply a prospect gets in-session until 06's soul lands
//   • opt_out_confirmation   — the line sent when a prospect sends STOP/UNSUBSCRIBE
'use strict';

const PROSPECT_COPY = {
  // TDW_05 §P3 verbatim. Provisional — founder veto pass may reshape; 06 replaces the whole
  // in-session answer with the Closer's soul at the same seam, no transport change.
  holding_line:
    "Good to hear from you — give me a moment and I'll come back to you properly.",

  // Opt-out confirmation. STOP means STOP, per number, across all lines (compliance-correct).
  opt_out_confirmation:
    "You're opted out — you won't hear from us again. Reply START any time if you change your mind.",
};

function getProspectCopy(key) {
  return Object.prototype.hasOwnProperty.call(PROSPECT_COPY, key) ? PROSPECT_COPY[key] : null;
}

module.exports = { PROSPECT_COPY, getProspectCopy };
