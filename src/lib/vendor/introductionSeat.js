'use strict';
// src/lib/vendor/introductionSeat.js — R9-J1 · THE DOOR'S HALF. CE-42 seat E2,
// the 4a door rider.
//
// ═══ WHAT THIS IS ════════════════════════════════════════════════════════════
// `relaySeat.js`'s shape for the introduction lane: read the signals off the
// turn, run the arm that already exists, hand back a founder-vetoed line for the
// door to speak. It is the missing third of e-5 — `introductions.js` (the arm),
// `introduce.ts` (the hands) and this file (the seat that joins them).
//
// ═══ THE SEAT IS THE ONLY PLACE THE TWO LANES COULD HAVE COLLIDED ════════════
// `collectSignals` here keeps ONLY `INTRODUCTION_SIGNAL_NAMES`, exactly as
// relaySeat.js:650 keeps only its own two. The sets are disjoint at the engine
// (introduce.ts) and disjoint again here, so a relay turn cannot reach this seat
// and an introduction turn cannot reach that one. That is not a convention — it
// is what the walk of 2026-09-10 cost, and a cell asserts it in both directions.
//
// ═══ NO NEW BYTES ════════════════════════════════════════════════════════════
// Every vendor-facing string here comes from `src/lib/vendor/introductions.js`,
// which composes them from `VICTOR_LINES` (founder-vetoed, hash-carried, the
// module dies at boot on drift) and from relaySeat's four reused bytes. This
// file mints nothing. W-1 caps 4a's soul radius at five strings and this seat
// does not widen it.
//
// ═══ NEVER THROWS INTO THE TURN ══════════════════════════════════════════════
// The caller wraps this in its own try as well; the belt inside the braces is
// deliberate. An introduction fault must not cost the vendor his reply —
// F-06.141's class, and not one to re-instance in the rider that fixes e-5.

const { INTRODUCTION_SIGNAL_NAMES } = require('../../engine/dist/core/tools/introduce.js');
const intro = require('./introductions');

const STAGE_SIGNAL = 'donna_introduction_stage';
const SEND_SIGNAL = 'donna_introduction_send';

/**
 * The turn's introduction signals, in order. relaySeat.js:650's shape: tool
 * calls AND each call's nested `donna_calls`, because Victor's turn carries
 * Donna's hands one level down and a flat read misses every one of them.
 */
function collectSignals(result) {
  const out = [];
  const take = (call) => {
    if (!call || !call.input) return;
    if (INTRODUCTION_SIGNAL_NAMES.has(call.name)) out.push({ name: call.name, input: call.input });
  };
  for (const tc of (result && result.tool_calls) || []) {
    take(tc);
    for (const dc of (tc && tc.donna_calls) || []) take(dc);
  }
  return out;
}

/**
 * THE SEAT. Returns `{ kind, line, introductionId }` or null when the turn
 * carried no introduction signal at all — in which case the caller is untouched
 * and Victor's reply ships exactly as it did before this rider.
 *
 * `ownerWords` is the vendor's OWN inbound, never the model's prose: E3 asks
 * whether HE affirmed and whether HE named the stored recipient. The seat
 * chooses nothing; the recipient is already on the row.
 */
async function runIntroductionSeat(supabase, vendor, result, deps = {}) {
  // ENTRY IS LOGGED. "The seat never ran" and "the seat ran and declined" have
  // looked identical in every log this arc has produced, and on 2026-09-10 the
  // seat that never ran was indistinguishable from a seat that had no door.
  console.log(`[introduction:wa] seat entered (words=${deps.ownerWords ? 'yes' : 'NO'} transport=${deps.hasTransport !== false})`);
  const signals = collectSignals(result);
  if (!signals.length) {
    console.log('[introduction:wa] no-seat (no_signal)');
    return null;
  }

  const stage = signals.find((s) => s.name === STAGE_SIGNAL);
  const send = signals.find((s) => s.name === SEND_SIGNAL);

  // ── STAGE ──────────────────────────────────────────────────────────────────
  // The row is written here, before any approval, so a draft he never approves
  // is still a fact the estate holds — `notifyCoupleOfFound`'s law, one lane over.
  if (stage) {
    const draft = {
      recipient_phone: stage.input.recipient_phone,
      recipient_name: stage.input.recipient_name,
      where_met: stage.input.where_met,
    };
    const staged = await intro.stageIntroduction(supabase, { vendor, draft });
    if (!staged.ok) {
      // A missing slot answers with its founder-vetoed ask; the duplicate answers
      // with INTRO_ALREADY_SENT. Both come from `introductions.js`, never from here.
      const line = staged.ask || staged.line || null;
      console.log(`[introduction:wa] refused (${staged.code})`);
      return { kind: `refused:${staged.code}`, line, introductionId: null };
    }
    console.log(`[introduction:wa] staged introduction=${staged.row.id}`);
    return { kind: 'staged', line: staged.show, introductionId: staged.row.id };
  }

  // ── SEND ───────────────────────────────────────────────────────────────────
  // The approval is anchored to the row the door itself staged, never to
  // anything the model names. The open row is the newest `staged` one for this
  // vendor: the seat shows one at a time, so "the one shown" is derivable and
  // does not need a model-supplied identifier.
  if (send) {
    const { data: rows } = await supabase
      .from(intro.TABLE)
      .select('id, vendor_id, recipient_phone, recipient_name, where_met, page_code, status, wamid')
      .eq('vendor_id', vendor.id)
      .eq('status', 'staged')
      .order('created_at', { ascending: false })
      .limit(1);
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!row) {
      // No draft is standing. NOTHING IS SAID: the estate holds no vetoed byte
      // for this moment, and inventing one here would be a soul byte minted at a
      // seat under a W-1 wall. The turn falls through to Victor untouched and the
      // gap is named in the handover.
      console.log('[introduction:wa] no-send (no_staged_row)');
      return { kind: 'no_staged_row', line: null, introductionId: null };
    }
    const out = await intro.sendIntroduction(
      supabase,
      { vendor, row, answer: deps.ownerWords || '' },
      { sendWa: deps.sendWa },
    );
    // E3's refusal re-shows rather than sending — relaySeat's ⑨, one lane over.
    const line = out.reshow || out.line || null;
    console.log(`[introduction:wa] ${out.sent ? 'sent' : `not_sent:${out.refusal}`} introduction=${row.id}`);
    return { kind: out.sent ? 'sent' : `not_sent:${out.refusal}`, line, introductionId: row.id };
  }

  return null;
}

module.exports = {
  runIntroductionSeat,
  collectSignals,
  STAGE_SIGNAL,
  SEND_SIGNAL,
  INTRODUCTION_SIGNAL_NAMES,
};
