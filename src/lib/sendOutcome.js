// src/lib/sendOutcome.js — TDW_05 THE COUPLE-LANE MECHANICAL ARC, M1. F-05.33's cure.
//
// ── WHAT THE FINDING ACTUALLY WAS, corrected at this arc's read-first ────────
//
// F-05.33 was filed as "the deliberate refusal swallowed by the transport-error
// catch" at brideInbound.js:551-576. Re-derived at 5f2a79b, that is NOT the
// mechanism, and the correction changes the cure:
//
//   whatsapp.js:131-133 — the F-05.2 opt-out gate does not THROW. It RETURNS:
//       return { sid: null, blocked: 'opted_out', sent: false };
//
// So brideInbound's `catch (sendErr)` is never entered on the opt-out path. The
// refusal is swallowed by the ABSENCE OF ANY READ OF THE RETURN VALUE: the seam
// assigned the result and then used only `?.sid` for the audit row. Grep across
// src/** at that base: ZERO readers of the `blocked` sentinel anywhere in the
// estate. That is why the bride got silence and why the rows carried twilio_sid
// NULL — nothing failed, nothing was reported, and nothing was sent.
//
// THE CURE IS THEREFORE A RETURN-VALUE CONTRACT, not a catch rewrite.
//
// ── TWO LIVE SHAPES, AND THIS MODULE READS BOTH (CE-67, W1 ratified) ─────────
//
// The estate has two outbound APIs and they disagree on how a refusal travels:
//   whatsapp.js:133  free-form  -> RETURNS  { sid, blocked, sent }
//   sendWa.js:202    templates  -> THROWS   WaOptedOutError (a WaError, .code set)
// A seam that reads only one of them will drift the day a call site switches API.
// classify() reads both, and every caller in this arc goes through it.
//
// ── SCOPE, RULED (CE-67) ────────────────────────────────────────────────────
//
// This arc wires the contract at the BRIDE SEAM ONLY. The estate-wide blindness is
// F-05.48, filed at CE-67: sendWhatsApp's three refusal sentinels are discarded at
// roughly sixty call sites, so `no_meta_lane` — built by M2b to be LOUD, the sentinel
// that says an env var is missing — lands silent everywhere it fires. That sweep
// charters separately. This module is the ONE HOME the sweep sits on: it exists
// already shaped for callers this arc never touches.
//
// ── THE BYPASS: ONE OBJECT, ONE HOME, A WIDER NAME ──────────────────────────
//
// G-A ruled (founder's word: "YOUR SUGGESTION" = shape (b)+(c)) that STOP silences
// everything Mira INITIATES, while her answers to the bride's OWN messages always
// deliver. The mechanical discriminator needs no new state and no per-site list:
// a send inside a `process*Inbound` call frame IS an answer, by construction.
//
// fullStop.js already owns exactly the object that expresses this, minted for the
// acknowledgment case (F-05.27). The inbound-frame bypass and the ack bypass are the
// SAME thing with the same justification — "a reply to a message the human sent
// seconds ago and is asking to be answered" — so this module RE-EXPORTS the one
// constant under the wider name rather than minting a second. fullStop.js's byte
// stays untouched (b05_p4_crons_bench §9.12 binds it verbatim, one home, and that
// cell is right).
'use strict';

const { ACK_BYPASS } = require('./fullStop');

// The same object. The wider name says what it now covers; the narrow name stays
// because eight ack sites and a floor bench cell are written against it.
const INBOUND_BYPASS = ACK_BYPASS;

// The refusal vocabulary, enumerated from whatsapp.js at this HEAD — never guessed:
//   whatsapp.js:133  'opted_out'              the F-05.2 cross-line gate
//   whatsapp.js:139  'meta_media_unsupported' M1 text-only on Meta, a named gap
//   whatsapp.js:153  'no_meta_lane'           the sunset's loud floor, landing silent
const REFUSAL = {
  OPTED_OUT: 'opted_out',
  MEDIA_UNSUPPORTED: 'meta_media_unsupported',
  NO_LANE: 'no_meta_lane',
};

// Classify a RETURNED send result.
//
// DELIVERY IS THE DEFAULT AND THE ABSENCE OF `blocked` IS THE TEST — deliberately
// not `sent === false`. Real callers and existing benches alike hand back objects
// like `{ sid: 'X' }` with no `sent` field at all; keying on `sent` would read every
// one of those as a refusal and invent an outage. `blocked` is set on exactly the
// three refusal returns and on nothing else.
function classifyResult(res) {
  if (res && res.blocked) {
    return { delivered: false, sid: null, refusal: String(res.blocked), error: null, raw: res };
  }
  return { delivered: true, sid: (res && res.sid) || null, refusal: null, error: null, raw: res };
}

// Classify a THROWN send error. sendWa's WaOptedOutError carries .code === 'opted_out'
// (sendWa.js:70-71); anything else is a genuine transport failure and stays one —
// collapsing the two is precisely F-04.62's disease in the other direction.
function classifyError(err) {
  const code = err && (err.code || (err.name === 'WaOptedOutError' ? REFUSAL.OPTED_OUT : null));
  if (code === REFUSAL.OPTED_OUT) {
    return { delivered: false, sid: null, refusal: REFUSAL.OPTED_OUT, error: err, raw: null };
  }
  return { delivered: false, sid: null, refusal: null, error: err || new Error('send failed'), raw: null };
}

// makeInboundSend(sendWhatsApp) -> send(phone, text, mediaUrls?, opts?)
//
// THE STRUCTURAL BYPASS, F2(b) as ruled. Every send built through this wrapper
// carries INBOUND_BYPASS BY CONSTRUCTION. There is no per-site flag to forget and no
// list of sites to keep current: a branch added to an inbound core next block gets
// the bypass because it calls `send`, and the bench asserts the property over the
// FILE rather than over the branches that happen to exist today. F-05.27's lesson,
// banked verbatim at CE-63, is what this shape exists to honour — "correct-only-by-
// ordering is one-reorder-from-broken".
//
// Returns the classified outcome, ALWAYS. It never throws for a refusal; it rethrows
// nothing and swallows nothing — a genuine transport error arrives as
// { delivered:false, refusal:null, error } and the caller decides. Silence is what
// this module exists to end, so silence is the one thing it will not return.
function makeInboundSend(sendWhatsApp, { bypass = INBOUND_BYPASS } = {}) {
  return async function send(phone, text, mediaUrls, opts = {}) {
    // `from` stays undefined: the lane resolves from the service's own env, exactly as
    // every existing call site does. Passing it here would fork the lane resolution.
    try {
      const res = await sendWhatsApp(phone, text, mediaUrls || [], undefined,
        opts.bypass === false ? undefined : bypass);
      return classifyResult(res);
    } catch (err) {
      return classifyError(err);
    }
  };
}

module.exports = {
  REFUSAL, INBOUND_BYPASS,
  classifyResult, classifyError, makeInboundSend,
};
