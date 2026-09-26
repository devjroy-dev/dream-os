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
  STOP_WORDS, START_WORDS,
  findOrCreateProspectByPhone, updateProspect,
} = require('./prospects');

// CE-45 · LCV-16 · LSP_5 · §7 (ruled 25 September 2026): matchFullStopWord, the FIRST-TOKEN matcher that stood here,
// is deleted with its export. LSP_1b moved the vendor lane to matchOptOutExact and ELZ-1's cut 1 (F-44.145) moved the
// bride lane; no src file called it. The words still have ONE home, prospects.js (isStopWord / isStartWord / the sets).

// ── CE-45 LCV-15 LSP_1b · F-44.141's CURE · THE WHOLE-MESSAGE MATCH ─────────────────────────────────────────────
// matchFullStopWord (deleted in LSP_5) read the FIRST TOKEN, so on the vendor lane "Cancel Walk Seventeen Alpha's shoot" was an
// opt-out: the vendor was marked opted_out, told so, and her cancel never reached the door (witnessed twice on 24
// September 2026). matchOptOutExact matches only when the WHOLE message is one word of the same two lists
// (prospects.js's STOP_WORDS and START_WORDS, one home): "STOP", "Cancel.", "  start  " match; "Cancel the shoot",
// "End it", "Resume on Monday" and "STOP MORNINGS" do not. Surrounding punctuation and case are tolerated; nothing
// inside the message is. The vendor lane calls this one (vendorInbound.js); the bride lane still calls
// matchFullStopWord (F-44.145, its own sitting, switches it with one call change); the marketing lane's isStopWord
// is untouched.
function matchOptOutExact(text) {
  const t = String(text == null ? '' : text).trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toUpperCase();
  if (!t || /\s/.test(t)) return null;
  if (STOP_WORDS.has(t))  return 'stop';
  if (START_WORDS.has(t)) return 'start';
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

// ── THE ACKNOWLEDGMENT BYPASS — ONE HOME, F-05.27 ───────────────────────────
// Every opt-out/resume acknowledgment on every lane must go out THROUGH the gate
// it may have just closed. The estate settled this on the marketing lane first
// (prospects.js:132-134, "a single deliberate, documented bypass for the opt-out
// acknowledgement only"); F-05.27 is what happened when the bride and vendor
// nudge branches shipped without it: STOP MORNINGS from an already-fully-stopped
// number wrote correctly and then answered with SILENCE. Witnessed live at
// 10:03:21 on 2026-07-23 — "BLOCKED opted_out ... (F-05.2 cross-line gate)".
//
// WHY THIS IS NOT A HOLE IN THE FULL STOP: the full stop governs BUSINESS-
// INITIATED messaging. An acknowledgment is a reply to a message the human sent
// seconds ago and is asking to be answered. Refusing it does not honour the opt-
// out; it just makes the product look broken to someone who is still using it.
//
// ONE CONSTANT so no future branch can forget it and no two branches can drift.
// The bench asserts every getNudgeCopy send on both cores carries it (§9.11).
const ACK_BYPASS = { isOptedOut: async () => false };

module.exports = { matchOptOutExact, recordFullStop, recordFullStart, ACK_BYPASS };
