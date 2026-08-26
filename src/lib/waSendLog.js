'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// src/lib/waSendLog.js — M-TELEMETRY · R-37.46 / .47 / .48 / .49 / .51
//
// ── WHY THIS FILE EXISTS, IN ONE EVENING ────────────────────────────────────
// On 26 Aug the founder noticed he had stopped receiving enquiry alerts. Three
// sends had fired; Meta had accepted all three and rejected all three; and the
// estate could not say why, because `relayStatus.js` logs a status and DISCARDS
// Meta's `errors[]`, and no row carried the SID. Diagnosing it took an evening
// of inference and never did produce the error code — it is still a hypothesis
// under observation (F-16.34, F-16.35).
//
// FIVE OF SIX VENDOR-LANE SEND SITES LOGGED NOTHING AT ALL. Censused at
// M-TELEMETRY's read-first: cron.js (nudge + template), admin/mint.js,
// enquire.js (free-form + template). Only enquiryAlert.js emitted a line.
// So the founder's next Railway search should be one error code, not one
// evening — that is this file's whole job.
//
// ── THE SHAPE, AND WHY IT IS KEYED ON err.code [R-37.46] ────────────────────
// The charter named F-07.45's THREE refusal shapes as the spec. That
// enumeration describes `sendWhatsApp` — the raw transport F-07.45 moved AWAY
// from. `sendWa`'s real refusal surface is NINE typed codes, and a line keyed
// on three would have gone silent on six of them, including
// `template_not_approved` — precisely the shape F-16.35 is circling.
//
// So this reads `err.code` GENERICALLY. The tenth class logs itself the day it
// is minted; nobody has to remember to come back here. The nine known codes
// ride below as the CENSUS OF RECORD, not as a gate — nothing in this file
// branches on them, and adding to the list changes no behaviour:
//
//   window_closed · window_undetermined · template_not_approved ·
//   template_vars · template_transport_unwired · line_not_configured ·
//   bad_call · opted_out · nudge_opted_out
//                                    (src/lib/sendWa.js, the typed-error block)
//
// ── WHY THE ID GOES THROUGH readSend [R-37.47] ──────────────────────────────
// `sendWa` returns a COMPOSITE on both paths: the outer object speaks the
// free-form vocabulary and the id lives at `result.wamid` one level down. A
// caller reading `out.sid` harvests `undefined` from a genuine success. That
// trap has now bitten the estate three times, so this file does not extract the
// id itself — it asks `readSend`, the declared single reader, and names WHICH
// contract it is reading. `sendwa_freeform` was added to SENDER_CONTRACTS at
// this sitting because the free-form shape was undeclared.
//
// ── WHY IT IS LANE-PARAMETERISED BUT ONLY WIRED ON ONE LANE [R-37.49] ───────
// The bride and marketing lanes have the identical blindness — minted as
// F-05.91. Its cure is this helper applied lane-wide, so `lane` is a parameter
// from birth and that sitting is six one-line calls rather than a rewrite.
// Only the vendor six are wired now, because the charter is one lane.
//
// ── WHY NOT INSIDE sendWa [R-37.51, REFUSED with its reason] ───────────────
// `sendWa` is a shared library on every lane; a log inside it is a three-lane
// blast radius on a one-lane charter. If a later sitting argues the library is
// cheaper than eighteen call sites, that argument comes to the chair with the
// census in hand.
//
// THIS FILE NEVER THROWS. A telemetry line that can break a send is worse than
// no telemetry — the whole point is to observe the send path, not to join it.
// ─────────────────────────────────────────────────────────────────────────────

const { readSend } = require('./vendor/relayToCouple');

// Tail-4 only. A full number in a log is a contact detail sitting in a
// third-party log aggregator forever, and the tail is enough to tell two test
// numbers apart, which is all an operator reading these lines needs.
function maskTo(to) {
  const s = String(to == null ? '' : to).replace(/\D/g, '');
  if (!s) return 'none';
  return s.length <= 4 ? `…${s}` : `…${s.slice(-4)}`;
}

// One field, one `k=v`, no spaces inside a value — so `grep '[wa:vendor]'`
// followed by `grep 'err=template_not_approved'` both work on the same line.
function field(k, v) {
  const s = v === null || v === undefined || v === '' ? '-' : String(v).replace(/\s+/g, '_');
  return `${k}=${s}`;
}

/**
 * ONE LINE PER SEND. Call it in BOTH branches of the try/catch — a send that
 * logs only on success is the blindness this file was built to end.
 *
 * @param {string}  lane   'vendor' | 'bride' | 'marketing'  (F-05.91 seam)
 * @param {object}  a
 * @param {string}  a.site        short tag naming the call site, e.g. 'enquire:oow'
 * @param {string}  a.mode        'text' | 'template'
 * @param {string} [a.templateKey]
 * @param {string} [a.to]
 * @param {object} [a.out]        sendWa's return, on the success branch
 * @param {Error}  [a.err]        the thrown WaError, on the refusal branch
 * @param {string} [a.ctx]        any extra correlation token
 */
function logWaSend(lane, a) {
  try {
    const o = a || {};
    const tag = `[wa:${lane || 'unknown'}]`;
    const head = [
      field('site', o.site),
      field('mode', o.mode),
      field('key', o.templateKey),
      field('to', maskTo(o.to)),
    ];

    if (o.err) {
      // R-37.46: generic. `.code` is the typed WaError's own field; a plain
      // Error (a genuine bug rather than a refusal) has none, so its CLASS is
      // reported instead — never a silent '-' that hides a crash as a refusal.
      const code = (o.err && o.err.code) || (o.err && o.err.name) || 'unknown';
      console.warn(`${tag} REFUSED ${head.join(' ')} ${field('err', code)} ${field('ctx', o.ctx)}`);
      return;
    }

    // R-37.47: the id is asked for, never guessed. `mode` names the contract.
    const kind = o.mode === 'template' ? 'sendwa_template' : 'sendwa_freeform';
    const verdict = readSend(kind, o.out);
    if (!verdict.ok) {
      // sendWa THROWS on refusal, so reaching here means it returned something
      // that is not a success — a shape nobody predicted. Worth a loud line of
      // its own rather than being folded into either branch.
      console.warn(`${tag} UNREADABLE ${head.join(' ')} ${field('reason', verdict.reason)} ${field('ctx', o.ctx)}`);
      return;
    }
    console.log(`${tag} SENT ${head.join(' ')} ${field('wamid', verdict.id || 'nowamid')} ${field('ctx', o.ctx)}`);
  } catch (e) {
    // Belt and braces on the file's own promise: telemetry never breaks a send.
    console.warn(`[wa:log] logger failed: ${e && e.message}`);
  }
}

module.exports = { logWaSend, maskTo };
