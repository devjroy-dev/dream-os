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
      console.warn(`[webhook:meta] status wamid=${wamid} status=${want} update_failed=${error.message}`);
      return { wamid, status: want, matched: 0, row: null, reason: 'update_failed' };
    }

    const rows = Array.isArray(data) ? data : [];
    const matched = rows.length;

    if (matched === 0) {
      // NAMED, NOT SILENT. This is the exact sentence whose absence made
      // F-06.143 invisible for three days. A zero here is a real fact about the
      // estate — a message went out that the estate did not persist a sid for —
      // and it is now readable in the same log the founder already watches.
      console.log(`[webhook:meta] status wamid=${wamid} status=${want} matched=0 — NO ROW CARRIES THIS SID`);
      return { wamid, status: want, matched: 0, row: null, reason: 'no_row_for_sid' };
    }

    if (matched > 1) {
      // A sid is Meta's own message identifier and is unique by construction, so
      // more than one row carrying it means the estate wrote the same sid twice.
      // Declared rather than swallowed; no receipt speaks off an ambiguous match.
      console.warn(`[webhook:meta] status wamid=${wamid} status=${want} matched=${matched} — SID IS NOT UNIQUE`);
      return { wamid, status: want, matched, row: null, reason: 'sid_not_unique' };
    }

    console.log(`[webhook:meta] status wamid=${wamid} status=${want} matched=1 sent_by=${rows[0].sent_by}`);
    return { wamid, status: want, matched: 1, row: rows[0], reason: 'matched' };
  } catch (e) {
    console.warn(`[webhook:meta] status wamid=${wamid} threw: ${e && e.message}`);
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

module.exports = { witnessStatusMatch, applyStatusEvent };
