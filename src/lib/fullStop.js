// src/lib/fullStop.js — TDW_05 P4 closing micro, F-05.25's cure.
//
// THE FINDING. Bare STOP had NO terminal machinery on the bride or vendor lanes.
// The read gates were faithful — whatsapp.js:_isOptedOut and sendWa.defaultIsOptedOut
// both check prospects.state='opted_out' on every send, every lane. But the only
// WRITER of that column (prospects.js:131) lives inside handleMarketingInbound,
// which is required by marketingIndex.js ALONE. So a bride or vendor could type
// STOP forever and stay fully subscribed, and the estate's own sentence —
// sendWa.js:66-68, "STOP means STOP, per number, across lines" — was true of the
// read and false of the write on two of three lanes. Found by the smoke walk, not
// by any bench: the benches assert prospects.js is unchanged and UNCOUPLED, which
// is true, correct to assert, and exactly why they were blind to its unreachability.
//
// ── THE DERIVATION THE CHAIR ASKED FOR: can the existing writer serve a number
//    with NO prospects row? ────────────────────────────────────────────────────
//
// `updateProspect` (prospects.js:81) is UPDATE-ONLY and keyed on `id`, so on its
// own it cannot. But it was never meant to be used on its own. The marketing
// lane's STOP path is a PAIR (prospects.js:128-131):
//
//     const prospect = await findOrCreateProspectByPhone(supabase, phone);
//     await updateProspect(supabase, prospect.id, { state: 'opted_out' });
//
// `findOrCreateProspectByPhone` INSERTS a row (state 'cold', source 'other') when
// the phone is unknown. So the pair ALREADY IS the upsert. No new mode is needed
// at the writer's home, and no second writer is introduced: this module is a
// CALLER of those two existing functions and holds no `.update()` of its own.
// A bride who was never a prospect gets her row created and immediately flipped —
// the row the gates read comes into existence at the moment she asks for it.
//
// ── ORDER IS LOAD-BEARING, AND THIS IS THE WHOLE HAZARD ─────────────────────
//
// prospects.js's `isStopWord` matches the FIRST TOKEN ONLY. "STOP MORNINGS" has
// first token "STOP" — so isStopWord("STOP MORNINGS") is TRUE. If the full-stop
// branch ran before the nudge branch it would swallow every STOP MORNINGS and
// convert a pause into a terminal opt-out: F-05.22's cure destroyed by its own
// sibling. THE NUDGE BRANCH MUST RUN FIRST ON BOTH CORES. The bench asserts the
// ordering directly (§9.3), not the outcome only.
//
// ── VOCABULARY: MIRRORED, NOT INVENTED ──────────────────────────────────────
//
// Words, states and register all come from the marketing lane rather than a new
// set. STOP_WORDS / START_WORDS are IMPORTED from prospects.js — one home, so the
// three lanes cannot answer to different words. Resume writes state='replied',
// the marketing lane's own post-opt-out state (prospects.js:149), because the
// gates key on 'opted_out' alone and a bride-specific state would fork a
// vocabulary for no gain. The prospects row on these lanes is a compliance
// ledger entry, nothing more.
'use strict';

const {
  isStopWord, isStartWord,
  findOrCreateProspectByPhone, updateProspect,
} = require('./prospects');

// Re-exported so callers read the words from ONE place and a future edit to the
// marketing lane's set reaches all three lanes by construction.
function matchFullStopWord(text) {
  if (isStopWord(text))  return 'stop';
  if (isStartWord(text)) return 'start';
  return null;
}

// Record the terminal opt-out. Calls the marketing lane's own writer pair; adds
// no writer of its own. Returns the prospect row so the caller can log an id.
async function recordFullStop({ supabase, phone }) {
  const prospect = await findOrCreateProspectByPhone(supabase, phone, { source: 'other' });
  return updateProspect(supabase, prospect.id, { state: 'opted_out' });
}

// Record the resume. NO-OP unless the row is actually opted out — mirroring
// prospects.js:146-151 exactly, so a START from someone who never stopped does
// not silently re-write their state.
async function recordFullStart({ supabase, phone }) {
  const prospect = await findOrCreateProspectByPhone(supabase, phone, { source: 'other' });
  if (prospect.state !== 'opted_out') return { changed: false, prospect };
  const updated = await updateProspect(supabase, prospect.id, { state: 'replied' });
  return { changed: true, prospect: updated };
}

module.exports = { matchFullStopWord, recordFullStop, recordFullStart };
