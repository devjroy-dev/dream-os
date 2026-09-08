// src/lib/vendor/relayStatus.js
// ── TDW_06 · THE RECEIPT CHAIN'S OWN TRIGGER, MADE HONEST ───────────────────
//
// THE DISEASE THIS FILE ENDS (F-06.143's second limb, verbatim, still live at
// `9f98dfa`). `src/index.js` updated `messages.delivery_status` by `twilio_sid`
// with NO `.select()` and NO count. On 2026-08-08 two real vendor notifications
// failed out-of-window; the rows they should have marked carried a null
// `twilio_sid`, so the update matched ZERO rows — and because the update was
// blind, THE FAILURE TO RECORD WAS ITSELF UNRECORDED. The only trace of two
// dead bride enquiries was a Railway line nobody was reading.
//
// WHY THAT MATTERS HERE AND NOT SOMEWHERE ELSE. Receipts №14 and №15 promise the
// vendor 「 Delivered to <name> 」 and 「 <name>'s seen it. 」 — ④b-v2 tells him
// those are coming. A receipt chain built on top of a blind update inherits its
// blindness: it can neither prove it spoke for a real row nor notice that it
// never spoke at all. So the chain starts by making its own trigger witnessed.
// The status update now READS ITS MATCH COUNT and says out loud what it matched.
//
// WHY A LIB AND NOT AN INLINE CURE AT THE SEAM (fork 3, chair-ruled (b)). A cure
// living inside the express route can only be exercised by driving express;
// R-29.34 member (a) demands a cell on the REAL entry point, and a callable is
// one. `src/index.js`'s status loop becomes a thin call to this file.
//
// NOTHING IS EVER SYNTHESIZED. A status that matches no row produces a NAMED LOG
// LINE and no vendor byte. The estate does not tell a vendor his message was
// delivered because Meta mentioned a wamid the estate has never seen.

'use strict';

// ── M-TELEMETRY-R · R-37.56/.57/.58/.59 — THE RECEIPT SAYS WHY ──────────────
//
// THE EVENING THIS ENDS. On 26 Aug three vendor alerts fired, Meta accepted all
// three and reported all three `failed` in the same second, and the estate could
// not say why — because this file read `.id` and `.status` off the status event
// and IGNORED `errors[]`, which was sitting right there. `metaInbound.js`
// (symbol `extractStatuses`) has always carried it: `errors: Array.isArray(
// s.errors) ? s.errors : []`. The reason reached this server and was thrown
// away here. F-16.35 is STILL a hypothesis for exactly that reason.
//
// [R-37.57 · ABSORB, NOT ADD] The four outcome lines below were `[webhook:meta]
// status …`. They are RE-KEYED to `[wa:receipt]` with the old token preserved
// INSIDE the line, so one line per callback is preserved, no double-emission,
// and both the old search and the new one land on the SAME line. R-37.50's
// pattern, one lane over. All four outcome shapes survive with their
// information intact.
//
// [R-37.56 · THE WAMID IS FULL, NEVER TRUNCATED] It is byte-identical to the
// send line's `wamid=` field (`src/lib/waSendLog.js`). That identity IS the
// feature: one grep on a wamid returns the send and its receipt as two adjacent
// lines. The kickoff asked for a tail-truncated id to "match the send line";
// the send line is not truncated, so truncating here would have broken the
// exact evening this sitting exists to create (c-37.9, chair-owned).
//
// [R-37.58] `err=` is OMITTED on success — no `err=-` filler — so `grep 'err='`
// returns only real failures. Meta may send several errors; `errors[0]` is
// named and `err_count=N` rides when N>1, so nothing is dropped silently and
// nothing is verbose on the common case.
//
// [R-37.59 · WHY `home=none` AND NOT A FIX] `matched=0` means no row carries
// this wamid. A correlation home EXISTS — `public.messages.twilio_sid` already
// holds Meta wamids (`whatsapp.js`, the documented `.sid` misnomer) — but
// vendor ALERTS go through `sendWa`, which writes no `messages` row, so there
// is nothing to match. Persisting one is PRICED AND NOT BUILT, recorded as
// F-16.34's open third arm: (a) attach to the vendor's `vendor_self`
// conversation — no migration, but alerts would enter agent history, a
// behavioural change wanting its own ruling; (b) a send-ledger table — a
// migration and a sole-writer question. Until one is ruled, `home=none` tells
// the truth about the gap in words instead of reporting a zero as if it were
// nothing.

/**
 * Apply one Meta status event to `public.messages`, WITNESSED.
 *
 * @param {object} supabase
 * @param {{id: string, status: string}} status  one entry from `extractStatuses`
 * @returns {Promise<{wamid: string|null, status: string|null, matched: number,
 *                    row: object|null, reason: string}>}
 *
 * `matched` is the ACTUAL number of rows the update touched, read back from the
 * database, never predicted. `row` is the matched row when there is exactly one,
 * which is what the receipt half needs and the only case in which a receipt may
 * speak. Never throws: a status event must not be able to cost Meta's retry
 * budget, and the webhook's own 200 has already gone out.
 */
// ── THE RECEIPT LINE'S ONE HOME [R-37.56/.58] ───────────────────────────────
// Field shapes are deliberately identical to the send line's (`waSendLog.js`):
// one `k=v` per fact, no spaces inside a value, so the two lines are searchable
// by the same habits. This never throws — a receipt line must not be able to
// cost Meta's retry budget, and the webhook's 200 has already gone out.
function receiptLine(parts) {
  return parts
    .filter((p) => p !== null && p !== undefined && p !== '')
    .join(' ');
}

// R-37.58: on success this returns '' and the caller filters it out, so
// `grep 'err='` returns ONLY real failures. On failure it names errors[0] and
// declares a count when Meta sent more than one — nothing silently dropped.
function errFields(status) {
  const errs = (status && Array.isArray(status.errors)) ? status.errors : [];
  if (!errs.length) return '';
  const e0 = errs[0] || {};
  // `title` is Meta's own short reason. It carries spaces, and a value with a
  // space breaks `k=v` parsing, so it is underscored exactly as the send line
  // does — the same transform, so the two logs stay habit-compatible.
  const code  = e0.code === undefined || e0.code === null ? 'nocode' : String(e0.code);
  const title = String(e0.title || e0.message || 'notitle').replace(/\s+/g, '_');
  const more  = errs.length > 1 ? ` err_count=${errs.length}` : '';
  return `err=${code} err_title=${title}${more}`;
}

/** Meta's own code for the first error, or null. `errFields` already formats
 *  these for the log line; `lead_alerts` stores them, so they are read once
 *  here rather than parsed back out of a formatted string. */
function firstErrCode(status) {
  const e = status && Array.isArray(status.errors) ? status.errors[0] : null;
  return e && e.code !== undefined && e.code !== null ? String(e.code) : null;
}
/** Meta's short title, untouched — spaces and all. The log line underscores it
 *  for `k=v` parsing; a database column has no such constraint and storing the
 *  mangled form would make `131049`'s title unreadable to a human. */
function firstErrTitle(status) {
  const e = status && Array.isArray(status.errors) ? status.errors[0] : null;
  return e ? String(e.title || e.message || '').slice(0, 200) || null : null;
}

async function witnessStatusMatch(supabase, status) {
  const wamid = status && status.id ? String(status.id) : null;
  const want = status && status.status ? String(status.status) : null;
  if (!supabase || !wamid || !want) {
    return { wamid, status: want, matched: 0, row: null, reason: 'no_supabase_or_status' };
  }

  try {
    // THE `.select()` IS THE CURE. Witness for the columns: `docs/db/
    // PUBLIC_SCHEMA.md` lists `public.messages` at 18 columns — id(1),
    // conversation_id(2), sent_by(7), twilio_sid(10), delivery_status(12). The
    // update targets `delivery_status` and keys on `twilio_sid`, exactly as the
    // blind statement did; the ONLY change is that the rows come back.
    const { data, error } = await supabase
      .from('messages')
      .update({ delivery_status: want })
      .eq('twilio_sid', wamid)
      .select('id, conversation_id, sent_by, body, twilio_sid, delivery_status');

    if (error) {
      console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
        'home=error', `update_failed=${String(error.message).replace(/\s+/g, '_')}`, errFields(status)]));
      return { wamid, status: want, matched: 0, row: null, reason: 'update_failed' };
    }

    const rows = Array.isArray(data) ? data : [];
    const matched = rows.length;

    if (matched === 0) {
      // NAMED, NOT SILENT. This is the exact sentence whose absence made
      // F-06.143 invisible for three days. A zero here is a real fact about the
      // estate — a message went out that the estate did not persist a sid for —
      // and it is now readable in the same log the founder already watches.
      // R-37.57/.59: `matched=0` stops reading as nothing. `home=none` says in
      // WORDS that this receipt is an ORPHAN — Meta is telling us about a
      // message the estate never persisted a wamid for. The original sentence
      // is preserved so the fact stays legible to a reader who knew the old one.
      // ── THE SECOND HOME (F-40.177, G1.3 rider 5) ─────────────────────────
      // `public.messages` is not the only table that persists a wamid any more.
      // R-40.72's lead alerts write `public.lead_alerts`, and on the walk of
      // 2026-09-06 EVERY receipt for them landed on the sentence below — Meta
      // reported one `delivered` and one `failed` and the estate recorded
      // neither, because this router had one place to look.
      //
      // ⚠ SECOND, NOT FIRST, AND ONLY ON A MISS. The conversation plane keeps
      // priority: an alert is a notification, not a message in a thread, and a
      // router that checked the newer table first would change what
      // `delivery_status` means for every receipt the estate already handles.
      //
      // The update is `.select()`ed for the same reason the one above is — a
      // blind update is what F-06.143 was. If this also matches nothing, the
      // original sentence still runs, unchanged, and still says so.
      const alt = await supabase
        .from('lead_alerts')
        .update({ status: want, updated_at: new Date().toISOString(),
                  error_code: firstErrCode(status), error_title: firstErrTitle(status) })
        .eq('wamid', wamid)
        .select('id, vendor_id, status');
      const altRows = Array.isArray(alt && alt.data) ? alt.data : [];
      if (altRows.length === 1) {
        console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=lead_alert', 'matched=1', errFields(status)]));
        return { wamid, status: want, matched: 1, row: altRows[0], reason: 'lead_alert' };
      }
      if (altRows.length > 1) {
        // 0141's UNIQUE partial index makes this unreachable; it is checked
        // anyway because the refusal above exists for exactly this shape and a
        // second home that skipped it would be the weaker of the two.
        console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=lead_alert_ambiguous', `matched=${altRows.length}`, errFields(status),
          '— SID IS NOT UNIQUE']));
        return { wamid, status: want, matched: altRows.length, row: null, reason: 'sid_not_unique' };
      }

      // ── THE THIRD HOME (F-40.226, G5.1 s2 rider) ─────────────────────────
      // ⚠ THE SECOND HOME'S PARAGRAPH ABOVE READS AS THOUGH IT CLOSED THE
      // QUESTION, AND IT DID NOT. `public.referral_alerts` (0142) persists a
      // wamid too, and on the G5.1 sitting-2 walk of 2026-09-07 Meta reported
      // `sent` and then `delivered` for a real referral alert and BOTH landed on
      // the orphan sentence below — `home=none matched=0`, twice, in the founder's
      // deploy log. The table shipped and its router arm did not: the exact
      // defect F-40.177 recorded for `lead_alerts` one sitting earlier, repeated
      // by the seat that had read it and quoted it.
      //
      // ⚠ THIRD, NOT SECOND, AND THE ORDER IS NOT TASTE. `public.messages` is the
      // conversation plane and keeps priority; `lead_alerts` was here first and a
      // reorder would change which table a shared sid resolved against. Each home
      // is tried only on a miss, so the ladder is stable and extending it costs
      // the earlier arms nothing.
      //
      // `.select()`ed for the same reason as both arms above: a blind update is
      // what F-06.143 was.
      const ref = await supabase
        .from('referral_alerts')
        .update({ status: want, updated_at: new Date().toISOString(),
                  error_code: firstErrCode(status), error_title: firstErrTitle(status) })
        .eq('wamid', wamid)
        .select('id, referral_id, to_vendor_id, status');
      const refRows = Array.isArray(ref && ref.data) ? ref.data : [];
      if (refRows.length === 1) {
        console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=referral_alert', 'matched=1', errFields(status)]));
        return { wamid, status: want, matched: 1, row: refRows[0], reason: 'referral_alert' };
      }
      if (refRows.length > 1) {
        // 0142's `uq_referral_alerts_wamid` is UNIQUE and PARTIAL on
        // `wamid IS NOT NULL`, so this is unreachable. Checked anyway, because
        // both arms above check it and a home that skipped the refusal would be
        // the weakest of the three.
        console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=referral_alert_ambiguous', `matched=${refRows.length}`, errFields(status),
          '— SID IS NOT UNIQUE']));
        return { wamid, status: want, matched: refRows.length, row: null, reason: 'sid_not_unique' };
      }

      // ── THE FOURTH HOME (F-40.196, G3.2 s2) ──────────────────────────────
      // `public.contract_sends` (0143) persists a wamid per party per sealed-copy
      // send. It is added HERE, in the packet that creates the writer, because
      // G5.1's rider proved what the alternative costs: `referral_alerts` shipped
      // its table and its rows and NOT its router arm, and two real receipts landed
      // on the orphan sentence below. `b51` §17 now reds for any wamid-bearing
      // table with no route, and it red on THIS table the moment `0143` hit the
      // tree — before a single send existed.
      //
      // FOURTH, and the order is not taste. `public.messages` is the conversation
      // plane and keeps priority; the notification planes follow in the order they
      // were built. Each home is tried only on a miss, so extending the ladder
      // costs the earlier arms nothing.
      //
      // `.select()`ed for the same reason as all three arms above: a blind update
      // is what F-06.143 was.
      const cs = await supabase
        .from('contract_sends')
        .update({ status: want, updated_at: new Date().toISOString(),
                  error_code: firstErrCode(status), error_title: firstErrTitle(status) })
        .eq('wamid', wamid)
        .select('id, contract_id, vendor_id, recipient, status');
      const csRows = Array.isArray(cs && cs.data) ? cs.data : [];
      if (csRows.length === 1) {
        console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=contract_send', 'matched=1', errFields(status)]));
        return { wamid, status: want, matched: 1, row: csRows[0], reason: 'contract_send' };
      }
      if (csRows.length > 1) {
        // `uq_contract_sends_wamid` is UNIQUE and PARTIAL on `wamid IS NOT NULL`, so
        // this is unreachable. Checked anyway, because all three arms above check it
        // and a home that skipped the refusal would be the weakest of the four.
        console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=contract_send_ambiguous', `matched=${csRows.length}`, errFields(status),
          '— SID IS NOT UNIQUE']));
        return { wamid, status: want, matched: csRows.length, row: null, reason: 'sid_not_unique' };
      }

      // ── THE FOURTH HOME · public.assistance_forwards (0148, Block 20 s1) ─────
      // R-40.110 by its wording (R-41.15): the table gained its wamid column, its
      // partial INDEX and its partial UNIQUE in the same delivery as this arm. In
      // s1 every send arm on that plane is DARK behind cap.on(), so no row carries
      // a wamid and this branch matches nothing — it is wired now so the day a
      // send wakes, its receipt has a home the day it lands, not a sitting later
      // (F-40.228/.229's lesson: `reviews_asked` and `payment_reminders` shipped
      // wamids with no arm, and the receipt fell to 'home=none'). Same shape as
      // the three above: status + updated_at + error_* by wamid, refuse on >1.
      const af = await supabase
        .from('assistance_forwards')
        .update({ status: want, updated_at: new Date().toISOString(),
                  error_code: firstErrCode(status), error_title: firstErrTitle(status) })
        .eq('wamid', wamid)
        .select('id, item_id, target_kind, prospect_id, status');
      const afRows = Array.isArray(af && af.data) ? af.data : [];
      if (afRows.length === 1) {
        console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=assistance_forward', 'matched=1', errFields(status)]));
        return { wamid, status: want, matched: 1, row: afRows[0], reason: 'assistance_forward' };
      }
      if (afRows.length > 1) {
        console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=assistance_forward_ambiguous', `matched=${afRows.length}`, errFields(status),
          '— SID IS NOT UNIQUE']));
        return { wamid, status: want, matched: afRows.length, row: null, reason: 'sid_not_unique' };
      }

      // ── THE FIFTH HOME · public.assistance_requests.notify_wamid (0150, F-41.26) ──
      // The founder's own notify (tdw_admin_assist_request, Utility) lands its wamid
      // on the request row under a NAMED column, because the same row will one day
      // carry the couple-facing send too (seat D). Same shape, keyed on notify_wamid.
      const an = await supabase
        .from('assistance_requests')
        .update({ notify_status: want, updated_at: new Date().toISOString(),
                  notify_error_code: firstErrCode(status), notify_error_title: firstErrTitle(status) })
        .eq('notify_wamid', wamid)
        .select('id, phone, notify_status');
      const anRows = Array.isArray(an && an.data) ? an.data : [];
      if (anRows.length === 1) {
        console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=assistance_request_notify', 'matched=1', errFields(status)]));
        return { wamid, status: want, matched: 1, row: anRows[0], reason: 'assistance_request_notify' };
      }
      if (anRows.length > 1) {
        console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
          'home=assistance_request_notify_ambiguous', `matched=${anRows.length}`, errFields(status),
          '— SID IS NOT UNIQUE']));
        return { wamid, status: want, matched: anRows.length, row: null, reason: 'sid_not_unique' };
      }

      console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
        'home=none', 'matched=0', errFields(status), '— NO ROW CARRIES THIS SID']));
      return { wamid, status: want, matched: 0, row: null, reason: 'no_row_for_sid' };
    }

    if (matched > 1) {
      // A sid is Meta's own message identifier and is unique by construction, so
      // more than one row carrying it means the estate wrote the same sid twice.
      // Declared rather than swallowed; no receipt speaks off an ambiguous match.
      console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
        'home=ambiguous', `matched=${matched}`, errFields(status), '— SID IS NOT UNIQUE']));
      return { wamid, status: want, matched, row: null, reason: 'sid_not_unique' };
    }

    console.log(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`, `status=${want}`,
      'home=messages', 'matched=1', `sent_by=${rows[0].sent_by}`, errFields(status)]));
    return { wamid, status: want, matched: 1, row: rows[0], reason: 'matched' };
  } catch (e) {
    console.warn(receiptLine(['[wa:receipt] webhook:meta', `wamid=${wamid}`,
      'home=threw', `threw=${String((e && e.message) || 'unknown').replace(/\s+/g, '_')}`]));
    return { wamid, status: want, matched: 0, row: null, reason: `threw:${e && e.message}` };
  }
}

/**
 * The whole seam, in one call: witness the match, then let the relay speak IF
 * AND ONLY IF the witness earned it.
 *
 * THE GATE IS THE WITNESS, NOT THE STATUS. `relayReceipt` re-reads the row by
 * sid and checks `sent_by === 'vendor_relay'` — a marker with exactly one
 * writer — so no other outbound in the estate can trigger a vendor receipt. That
 * check stays exactly where it is; this function simply refuses to call it at
 * all when the update matched nothing, so a receipt can never be the first thing
 * that notices a sid the estate does not hold.
 */
async function applyStatusEvent(supabase, status, deps = {}) {
  const witness = await witnessStatusMatch(supabase, status);
  if (witness.matched !== 1) return { witness, receipt: null };

  // NOT OURS, SAY NOTHING. Cheap pre-filter on the row we already have in hand,
  // so a delivered status for an ordinary vendor notification does not even
  // reach the receipt path. `relayReceipt` asserts the same fact independently
  // — this does not replace that check, and must not be read as replacing it.
  if (witness.row && witness.row.sent_by !== 'vendor_relay') {
    return { witness, receipt: null };
  }

  try {
    const { relayReceipt } = require('./relaySeat');
    const receipt = await relayReceipt(supabase, {
      wamid: witness.wamid,
      status: witness.status,
      sendWhatsApp: deps.sendWhatsApp,
      env: deps.env,
    });
    return { witness, receipt };
  } catch (e) {
    console.warn('[relay:wa receipt seam]', e && e.message);
    return { witness, receipt: null };
  }
}

module.exports = { witnessStatusMatch, applyStatusEvent, errFields };
