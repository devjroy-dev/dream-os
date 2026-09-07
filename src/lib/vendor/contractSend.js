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
async function sendOne(supabase, { contractId, vendorId, recipient, toPhone: rawPhone, otherParty, link, filename }) {
  // ⚠ E.164 HERE — F-40.257's client half. The client row keeps what she typed
  // (ten digits on the walk) and `sendWa` refuses anything that is not E.164;
  // this arm passed the row's bytes straight through. `toE164` is the one home.
  const { toE164 } = require('../phone');
  const toPhone = rawPhone ? toE164(rawPhone) : null;
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
  // ── THE LINK META FETCHES — F-40.257's vendor half ──────────────────────
  // Until this cut the document header carried a SIGNED URL on the private
  // `contracts` bucket (`…/object/sign/…?token=<jwt>`, 600 s), and Meta answered
  // `#132018 There's an issue with the parameters in your template` on the
  // founder's first signing. Every other byte this estate hands Meta to fetch
  // rides the PUBLIC `wa-media` bucket at an unguessable path — `metaMedia.js`'s
  // own policy (F1) — and a document header is that case one template over. The
  // sealed PDF is copied there once per signing, under `contracts/<uuid>.pdf`,
  // and the header links the public URL. The private object stays the record.
  // ⚠ THE SECOND CHECK IS THE FOUNDER'S — R-40.71: the template's detail page
  // at Meta must read header = Document, body = {{1}} only. This cure removes
  // the estate-side cause; a shape mismatch at Meta would survive it and would
  // still read #132018.
  let link = null;
  try {
    link = await publishSealedForMeta(supabase, sealedPath);
  } catch (e) {
    console.warn('[contractSend] rehost to wa-media failed:', e && e.message);
  }
  if (!link) {
    // ⚠ NO LINK MEANS NO DOCUMENT, AND A BODY-ONLY SEND IS NOT THIS TEMPLATE.
    console.warn(`[contractSend] no public link for ${sealedPath}; refusing both sends`);
    return { attempted: false, reason: 'rehost_failed', results: [] };
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

// ── THE SIGN LINK — THE SEND THAT `send-to-couple` NEVER HAD ─────────────────
// G3.2 sitting 3, founder's walk of 2026-09-07: `CONTRACT_SIGN_SEND_ENABLED=1` in
// production and no WhatsApp arrived, because the door opened the signing and then
// returned `sent: false` with a hardcoded sentence — no `sendWa` call existed for
// `tdw_contract_sign` anywhere in `src/` (census at `ae781f5`: zero). This is that
// arm, in the file that already owns contract sends, recorded on the same table.
//
// ⚠ THE NUMBER IS E.164 HERE AND NOWHERE ELSE. F-40.185 was this door's own cousin:
// ten digits handed to Meta, Meta answered 200, nothing arrived. `toE164` is the
// estate's one home for the shape and the client row keeps whatever she typed.
// ⚠ ONE RECORD PER ATTEMPT, SUCCESS OR FAILURE — `recordSend`'s own law. A
// refusal here is a `contract_sends` row with `status = <reason>`, which is how a
// walk that says "nothing arrived" gets an answer by SELECT rather than by guess.
/** Copy the sealed PDF to the estate's Meta-fetchable home and return its public URL. */
const WA_MEDIA_BUCKET = 'wa-media';   // PUBLIC bucket, unguessable object paths — metaMedia.js
async function publishSealedForMeta(supabase, sealedPath, deps = {}) {
  const crypto = require('crypto');
  const dl = await supabase.storage.from('contracts').download(sealedPath);
  if (dl.error || !dl.data) throw new Error(`download failed: ${dl.error ? dl.error.message : 'no data'}`);
  const bytes = Buffer.from(await dl.data.arrayBuffer());
  const objectPath = `contracts/${Date.now()}-${crypto.randomUUID()}.pdf`;
  const up = await supabase.storage.from(WA_MEDIA_BUCKET)
    .upload(objectPath, bytes, { contentType: 'application/pdf', upsert: false });
  if (up.error) throw new Error(`upload failed: ${up.error.message}`);
  const { data: pub } = supabase.storage.from(WA_MEDIA_BUCKET).getPublicUrl(objectPath);
  if (!pub || !pub.publicUrl) throw new Error('getPublicUrl returned nothing');
  // ⚠ THE LINK IS HANDED TO META ONLY ONCE IT ANSWERS. The founder's second signing
  // (2026-09-07 20:37): the vendor's copy, sent one second after the upload, came
  // back `131053 Media upload error`; the couple's copy, one second later on the
  // SAME URL, was read. The object was not yet readable on the public CDN at the
  // instant Meta fetched it. So the send home confirms `200` first — a HEAD, up
  // to five tries with a short backoff — and refuses by name if it never does.
  await awaitReadable(pub.publicUrl, deps);
  return pub.publicUrl;
}

const READ_TRIES = 5;
const READ_BACKOFF_MS = [200, 400, 800, 1200, 1600];
async function awaitReadable(url, deps = {}) {
  const doFetch = deps.fetch || (typeof fetch === 'function' ? fetch : null);
  const sleep   = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  if (!doFetch) throw new Error('no fetch available to confirm the public link');
  let last = null;
  for (let i = 0; i < READ_TRIES; i += 1) {
    try {
      const res = await doFetch(url, { method: 'HEAD' });
      if (res && res.status === 200) return true;
      last = `status ${res && res.status}`;
    } catch (e) { last = e && e.message; }
    await sleep(READ_BACKOFF_MS[i]);
  }
  throw new Error(`public link not readable after ${READ_TRIES} tries (${last})`);
}

/** F-40.258: the sign-OTP send gets its row, so its receipt has a home. Called by
 *  `api/sign.js` after `sendOtpCode`; never throws (recordSend's own law). */
async function recordOtpSend(supabase, { contractId, vendorId, toPhone, wamid, status, error }) {
  await recordSend(supabase, {
    contract_id: contractId, vendor_id: vendorId, recipient: 'client',
    to_phone: toPhone || null, template_key: 'contract_sign_otp',
    wamid: wamid || null, status: status || (wamid ? 'sent' : 'send_failed'),
    error_code: error && error.code ? String(error.code) : null,
    error_title: error && error.message ? String(error.message).slice(0, 200) : null,
  });
}

const SIGN_TEMPLATE_KEY = 'contract_sign';   // templates.js — tdw_contract_sign · owner · functions · link

async function sendSignLink(supabase, { contractId, vendorId, toPhone, owner, functionsText, link }) {
  const { toE164 } = require('../phone');
  const to = toPhone ? toE164(toPhone) : null;
  const base = {
    contract_id: contractId, vendor_id: vendorId, recipient: 'client',
    to_phone: to, template_key: SIGN_TEMPLATE_KEY,
  };
  if (!to) {
    await recordSend(supabase, { ...base, wamid: null, status: 'no_phone' });
    return { sent: false, reason: 'no_phone', wamid: null };
  }
  try {
    const out = await sendWa({
      line: 'vendor',
      to,
      templateKey: SIGN_TEMPLATE_KEY,
      vars: {
        owner:     owner || 'your vendor',
        functions: functionsText || 'your wedding',
        link,
      },
      supabase,
    });
    const wamid = (out && (
      (out.result && out.result.wamid) || out.wamid
      || (out.messages && out.messages[0] && out.messages[0].id)
    )) || null;
    await recordSend(supabase, { ...base, wamid, status: 'sent' });
    console.log(`[contractSend:sign] contract=${contractId} client=${wamid || 'sent'}`);
    return { sent: true, reason: null, wamid };
  } catch (e) {
    const reason = (e && e.name === 'WaOptedOutError') ? 'opted_out'
                 : (e && (e.code || e.name)) || 'send_failed';
    await recordSend(supabase, {
      ...base, wamid: null, status: reason,
      error_code:  (e && e.code) ? String(e.code) : null,
      error_title: (e && e.message) ? String(e.message).slice(0, 200) : null,
    });
    console.warn(`[contractSend:sign] contract=${contractId} client=${reason} ${e && e.message ? e.message.slice(0, 120) : ''}`);
    return { sent: false, reason, wamid: null };
  }
}

module.exports = { sendSealedCopy, sendSignLink, recordOtpSend, publishSealedForMeta, awaitReadable, TEMPLATE_KEY, SIGN_TEMPLATE_KEY, SIGNED_URL_TTL, WA_MEDIA_BUCKET };
