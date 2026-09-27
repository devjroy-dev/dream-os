'use strict';
// src/lib/ownNumber/send.js · CE-46 · G6-2 · 2b · A REPLY LEAVES FROM HER OWN NUMBER (F2 T-c; F-44.176; joint ruling 1).
//
// · FROM: her PNID (vendor_wabas.phone_number_id), with her business token (token.js). Never TDW's shared line, and
//   so NO "{studio}: " prefix: F-44.176 decides the prefix by the sending number, and the joint ruling says no studio
//   prefix on Eliza's replies on any channel. The text sent is the text the caller was handed, byte for byte.
// · THE ONE POST: src/lib/metaCloud.js sendMetaText, so R-40.91's E.164 guard runs on this send exactly as on every
//   other (assertE164(normalizeTo(toE164(to))) inside postMessage). Graph version meta.js's (v25.0 by default), as
//   ruled; F-44.144 stays open.
// · OPT-OUT: the estate's one read, sendWa.defaultIsOptedOut, before any Meta call. An opted-out couple is refused.
// · STATUS: only an 'active' number sends (§7b constraint 3). The caller's gate already asked; asked again here so no
//   future caller can send from a paused number by forgetting it.
// · LENGTH: Meta's text body limit is 4096 characters (Tech Provider onboarding page, Step 4, read 27 September 2026);
//   a longer reply is split at the last space before the limit. Each part is its own message and its own wamid.
// · EVERY SEND LOGS recipient and wamid; every failure logs Meta's message (R-40.92). The token is never logged.
const { sendMetaText } = require('../metaCloud');
const { defaultIsOptedOut } = require('../sendWa');
const { businessTokenFor } = require('./token');
const { graphVersion } = require('./meta');

const MAX_CHARS = 4096;

class OwnSendRefused extends Error {
  constructor(reason) { super(`own-number send refused: ${reason}`); this.name = 'OwnSendRefused'; this.reason = reason; }
}

/** Pure: split a reply into parts of at most MAX_CHARS, at the last space where there is one. Never returns an empty part. */
function splitText(text, max = MAX_CHARS) {
  const s = String(text == null ? '' : text).trim();
  if (!s) return [];
  const parts = [];
  let rest = s;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(' ', max);
    if (cut <= 0) cut = max;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

async function sendOnHerNumber({ row, to, text, supabase, env = process.env, deps = {} }) {
  const isOptedOut = deps.isOptedOut || defaultIsOptedOut;
  const tokenFor = deps.businessTokenFor || businessTokenFor;
  const send = deps.sendMetaText || sendMetaText;
  if (!row || row.status !== 'active' || !row.phone_number_id) throw new OwnSendRefused(`her number is ${(row && row.status) || 'absent'}`);
  const parts = splitText(text);
  if (!parts.length) throw new OwnSendRefused('empty reply');
  if (await isOptedOut({ to, supabase })) throw new OwnSendRefused('opted_out');
  const token = await tokenFor(row, { env, fetchImpl: deps.fetchImpl || fetch });
  const sent = [];
  for (const part of parts) {
    const r = await send({ to, text: part }, { token, phoneNumberId: row.phone_number_id, graphVersion: graphVersion(env), fetchImpl: deps.fetchImpl });
    console.log(`[own-number:out] ${row.vendor_id} to=${to} wamid=${(r && r.wamid) || '(none)'} chars=${part.length}`);
    sent.push({ text: part, wamid: (r && r.wamid) || null });
  }
  return sent;
}

module.exports = { sendOnHerNumber, splitText, OwnSendRefused, MAX_CHARS };
