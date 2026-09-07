// src/lib/vendor/contractSend.js
// BLOCK 19 · G3.2 sitting 2 — F-40.196. CLAUSE 16.2'S PROMISE, KEPT.
//
// ═══ WHAT THIS EXISTS TO CLOSE ═════════════════════════════════════════════
// v4 clause 16.2 says each party receives the signed agreement by WhatsApp.
// Sitting 1 shipped the signature and could not keep it, and said so in its own
// code rather than hiding it (`sign.js:249-253`): the couple got a ten-minute
// link on the done screen and after that had no copy at all. The instrument's
// sentence was running ahead of the product.
//
// ⚠ THE ESTATE HAD NO OUTBOUND-DOCUMENT PATH AT ALL, on either arm, and this
// was derived at 9b6321f rather than assumed:
//   · TEMPLATE arm — `buildTemplatePayload` emitted a BODY and a url button and
//     nothing else. It now has a document-header arm; that is the whole of the
//     transport change, and `sendWa` itself is untouched.
//   · FREE-FORM arm — `whatsapp.js:135-139` REFUSES media on a Meta lane
//     outright (`meta_media_unsupported`), M1's own declared gap. It is left
//     exactly as it stands. F-40.223 records that `engine.js`'s `attachments`
//     path rides that refusal, so the INVOICE pdf has never reached anyone on
//     this transport either — named because it is adjacent, and NOT cured here.
// Outside the 24-hour window a template is the only door, and a header is the
// only place a document rides on one.
'use strict';

const { sendWa } = require('../sendWa');

const TEMPLATE_KEY = 'contract_copy';

// ⚠ TEN MINUTES, AND IT IS THE SAME NUMBER `sign.js` ALREADY USES for the done
// screen's link. Meta FETCHES THE LINK ONCE at send time and serves its own copy
// to the recipient thereafter, so the recipient's ability to open the PDF next
// week does not depend on this TTL. A longer window would only widen the period
// in which a signed URL to a private legal instrument is live.
const SIGNED_URL_TTL = 600;

/**
 * ── THE ROW IS WRITTEN FOR EVERY OUTCOME, NOT JUST THE GOOD ONE ────────────
 * `weddingLeadAlert.js:102-125`'s law, one plane over, and it is the reason
 * `0141` and `0143` both exist: a room can never say 「sent」 about a thing it
 * did not write down. F-40.177's whole disease was two alerts that Meta
 * accepted, reported on, and the estate persisted nowhere.
 *
 * ⚠ FAILURES GET ROWS TOO, and they are the ones most worth having: a
 * `no_phone` row is the only durable evidence that a party was skipped for a
 * reason rather than missed. `wamid` is null there, which is exactly why
 * `0143`'s unique index is PARTIAL.
 *
 * Never throws. A bookkeeping failure must not cost a party her copy — by the
 * time this runs the send has already happened.
 */
async function recordSend(supabase, row) {
  if (!supabase) return;
  try {
    await supabase.from('contract_sends').insert(row);
  } catch (e) {
    // Named, not swallowed. F-06.143's lesson: an unrecorded failure to record
    // is how three days of dead notifications stayed invisible.
    console.warn('[contractSend:record] insert failed:', e && e.message);
  }
}

/**
 * One party's copy.
 *
 * @param {'vendor'|'client'} recipient — `contract_sends.recipient`, and the
 *   CHECK in `0143` admits exactly these two. Clause 16.2 says there are two
 *   parties; a third value is a schema question, not a caller's choice.
 * @param {string|null} toPhone
 * @param {string|null} otherParty — {{1}}. THE OTHER SIDE'S NAME: the vendor's
 *   copy names the client and the client's copy names the vendor, so each
 *   recipient reads who the agreement is with rather than her own name back.
 */
async function sendOne(supabase, { contractId, vendorId, recipient, toPhone, otherParty, link, filename }) {
  const base = {
    contract_id: contractId, vendor_id: vendorId, recipient,
    to_phone: toPhone || null, template_key: TEMPLATE_KEY,
  };

  if (!toPhone) {
    await recordSend(supabase, { ...base, wamid: null, status: 'no_phone' });
    // A party with no number on file cannot be reached and this is not an
    // error — it is a fact about that row. THE SIGNATURE HAS ALREADY HAPPENED;
    // refusing here would undo nothing and help nobody.
    return { recipient, sent: false, reason: 'no_phone', wamid: null };
  }

  try {
    const out = await sendWa({
      line: 'vendor',
      to: toPhone,
      templateKey: TEMPLATE_KEY,
      // ⚠ AN OBJECT, NOT A POSITIONAL ARRAY, and that is load-bearing. The
      // header's link and filename are looked up in `vars` BY NAME
      // (`templates.js`'s header arm); an array form cannot carry them and the
      // builder refuses rather than sending a headerless message.
      vars: {
        other_party:   otherParty || 'your client',
        document_link: link,
        document_name: filename,
      },
      supabase,
    });
    // ── THE WAMID LIVES AT `out.result.wamid` — F-40.210 ──────────────────
    // Traced Meta outward rather than guessed: `metaCloud.js` returns
    // `{ ok, wamid, raw }` and `sendWa` returns `{ sent, mode, key, from, to,
    // payload, RESULT: res }`, so the id is one level down. `out.wamid` and
    // `out.messages[0].id` BOTH returned undefined in the sibling that shipped
    // them, and every row it wrote held a null. The fallbacks are kept, ordered
    // real-first: they cost nothing and mean a shape change upstream degrades
    // to a null rather than to a silent wrong.
    const wamid = (out && (
      (out.result && out.result.wamid)
      || out.wamid
      || (out.messages && out.messages[0] && out.messages[0].id)
    )) || null;
    await recordSend(supabase, { ...base, wamid, status: 'sent' });
    return { recipient, sent: true, reason: null, wamid };
  } catch (e) {
    // ⚠ CLASSIFIED, NOT SWALLOWED. Each outcome keeps its own code so a walk can
    // NAME what happened rather than guess. `WaTemplateNotApprovedError` is the
    // one to expect first: this template is `pending` until Meta returns Active,
    // so the honest reading of a dark send is `template_not_approved` and not a
    // failure.
    const reason = (e && e.name === 'WaOptedOutError') ? 'opted_out'
                 : (e && (e.code || e.name)) || 'send_failed';
    await recordSend(supabase, {
      ...base, wamid: null, status: reason,
      error_code:  (e && e.code) ? String(e.code) : null,
      error_title: (e && e.message) ? String(e.message).slice(0, 200) : null,
    });
    return { recipient, sent: false, reason, wamid: null };
  }
}

/**
 * Send the sealed copy to BOTH parties. Called once, from the sealing block in
 * `src/api/sign.js`, after the sealed object is stored.
 *
 * Never throws. A signature that succeeded must not be reported as a failure
 * because a notification did not go — the agreement is signed either way, and
 * `contract_sends` is where the difference is readable.
 *
 * @returns {{ attempted: boolean, reason: string|null, results: Array }}
 */
async function sendSealedCopy(supabase, {
  contractId, vendorId, sealedPath, reference,
  vendorName, vendorPhone, clientName, clientPhone,
}) {
  // ── TWO GATES, NAMED SEPARATELY ──────────────────────────────────────────
  // This one and Meta's `isApproved` inside `sendWa` fail for DIFFERENT reasons,
  // and a walk must be able to say which refused. `CONTRACT_SIGN_SEND_ENABLED`
  // is the sibling shape at `sign.js:137`.
  //
  // ⚠ NO ROW IS WRITTEN WHEN THE FLAG IS DARK. A `contract_sends` row means the
  // estate ATTEMPTED a send; a flag that is off means it never reached the door.
  // Writing rows for a feature that is switched off would fill the table with
  // evidence of nothing and make the real refusals harder to find.
  if (String(process.env.CONTRACT_COPY_SEND_ENABLED || '') !== '1') {
    console.log(`[contractSend] dark: CONTRACT_COPY_SEND_ENABLED is not set (contract=${contractId})`);
    return { attempted: false, reason: 'CONTRACT_COPY_SEND_ENABLED is not set', results: [] };
  }

  // ⚠ THE LINK IS MADE ONCE AND BOTH SENDS SHARE IT. One home for one fact.
  // Meta fetches it per send, and two signed URLs to the same object would be
  // two secrets where one is needed.
  let link = null;
  try {
    const signed = await supabase.storage.from('contracts')
      .createSignedUrl(sealedPath, SIGNED_URL_TTL);
    if (!signed.error && signed.data) link = signed.data.signedUrl;
  } catch (e) {
    console.warn('[contractSend] signed url failed:', e && e.message);
  }
  if (!link) {
    // ⚠ NO LINK MEANS NO DOCUMENT, AND A BODY-ONLY SEND IS NOT THIS TEMPLATE.
    // `buildTemplatePayload` would refuse it anyway; refusing here says why in
    // one line instead of surfacing as a vars error two files away.
    console.warn(`[contractSend] no signed url for ${sealedPath}; refusing both sends`);
    return { attempted: false, reason: 'signed_url_failed', results: [] };
  }

  // What the recipient sees in her chat. The agreement's own reference, never a
  // uuid — and `contracts.number` uses `/` as its separator, which is not legal
  // in a filename, so the slashes become hyphens HERE and the stored number is
  // untouched. A fallback of the contract id keeps a nameless send from being a
  // crash; it is ugly and it is honest.
  const filename = `${String(reference || contractId).replace(/\//g, '-')}.pdf`;

  // ⚠ SEQUENTIAL, NOT `Promise.all`. Two template sends a millisecond apart on
  // one lane is the shape Meta throttles, and a rejection of the second would
  // arrive with no way to tell which recipient it belonged to.
  const results = [];
  results.push(await sendOne(supabase, {
    contractId, vendorId, recipient: 'vendor',
    toPhone: vendorPhone, otherParty: clientName, link, filename,
  }));
  results.push(await sendOne(supabase, {
    contractId, vendorId, recipient: 'client',
    toPhone: clientPhone, otherParty: vendorName, link, filename,
  }));

  console.log(
    `[contractSend] contract=${contractId} ` +
    results.map((r) => `${r.recipient}=${r.sent ? r.wamid || 'sent' : r.reason}`).join(' ')
  );
  return { attempted: true, reason: null, results };
}

module.exports = { sendSealedCopy, TEMPLATE_KEY, SIGNED_URL_TTL };
