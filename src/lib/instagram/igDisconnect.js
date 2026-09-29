'use strict';
// src/lib/instagram/igDisconnect.js · CE-46 · G6-5 · "DISCONNECT INSTAGRAM" · the ONE function behind both doors (F-i2, ruled
// 29 September 2026): the room's Instagram section and Portfolio's Disconnect both reach DELETE /api/v2/vendor/ig/disconnect
// (src/api/vendor/ig.js), which calls this and nothing else.
//
// F-i1 (a), RULED: THE STANDING LAW STANDS (igConnection.disconnect, TDW_07 P4a: "the row is deleted, not blanked"). Meta first,
// then the row. Her leads, threads and messages live in other tables and are never touched here.
// F-i3, RULED (F-a's policy carried): META FIRST. Her account's messages subscription is removed with HER token
// (igMeta.setSubscribed on:false, DELETE /me/subscribed_apps; Meta's Instagram webhooks page names the subscription per account,
// with the account's own token). A refusal changes NOTHING: the row and the token stay, so she can try again and the retry can
// still reach Meta. Counted as already gone, and the removal goes on: Meta's 190 (the token is no longer valid), a 404, a token
// past its expiry, or no token at all. A network failure or any other refusal is NOT already gone.
// No revoke is called: Meta's pages (read 29 September 2026) give none for an Instagram User token. Removing TDW from her
// Instagram settings is hers (the sheet says so, the founder's row 7); Meta's deauthorize callback then deletes the row as before.
// F-44.243 CURED HERE: Portfolio's Disconnect used to delete the row with no Meta call, leaving the subscription live.
const igConnection = require('../vendor/igConnection');
const igMeta = require('./igMeta');

/** Pure: does this answer from Meta say TDW's reach is already gone? */
function alreadyGone(r) {
  if (!r) return false;
  if (r.code === 190) return true;
  if (r.status === 404) return true;
  return false;
}

/** Pure: was her token past its expiry at `now`? A token with no expiry recorded is treated as live (Meta decides). */
function expired(expiresAt, now) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t <= now.getTime();
}

async function disconnectFully({ supabase, vendorId, fetchImpl = fetch, now = () => new Date(), conn = igConnection, meta = igMeta }) {
  const t = await conn.readToken(supabase, vendorId);
  let step = 'no_token';
  if (t.ok) {
    if (expired(t.expiresAt, now())) step = 'token_expired';
    else {
      const r = await meta.setSubscribed({ fetchImpl, token: t.accessToken, on: false });
      if (r && r.ok) step = 'unsubscribed';
      else if (alreadyGone(r)) step = 'already_gone';
      else {
        console.warn(`[ig:disconnect] ${vendorId} Meta refused the unsubscribe (status ${r && r.status}, code ${r && r.code}${r && r.why ? `, ${r.why}` : ''}); nothing changed`);
        return { ok: false, reason: 'meta_unsubscribe' };
      }
    }
  } else if (t.error !== 'not_connected') {
    throw new Error(`vendor_ig_connections read: ${t.error}`);
  }
  const d = await conn.disconnect(supabase, vendorId);
  if (!d.ok) throw new Error(`vendor_ig_connections delete: ${d.error}`);
  console.log(`[ig:disconnect] ${vendorId} disconnected: ${step}; the connection row deleted, her leads and threads kept`);
  return { ok: true, step };
}

/** Pure: which sheet line she reads. True once she ever consented to replies (0174's dm_consented_at). */
function repliesEverOn(row) { return !!(row && row.dm_consented_at); }

module.exports = { disconnectFully, alreadyGone, expired, repliesEverOn };
