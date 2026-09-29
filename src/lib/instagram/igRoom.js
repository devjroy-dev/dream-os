'use strict';
// src/lib/instagram/igRoom.js · CE-45 · IGD-1 · CUT 2a-ii · THE ROOM'S TWO DOORS, SERVED (the wire dreamos-pwa reads in
// lib/vendor/metaRoomDoor.ts at 6bb8e7e6; read-first F7, F8, ruled).
//   GET  /api/v2/vendor/solutions/instagram          { ok:true, state, authorize_url }
//   POST /api/v2/vendor/solutions/instagram/switch   { on } -> the same shape
//   GET  /api/v2/vendor/solutions/quiet              { ok:true, minutes }
//   POST /api/v2/vendor/solutions/quiet              { minutes } -> the same shape
// DARK BY THE LANE (F7): both doors answer 404 unless igInbound.laneOpen is true for her (the capability ON, or her vendor id in
// IG_DM_WALK_VENDOR_IDS). The pwa reads a 404 as absent and draws nothing, so until the grant only DEV440's room shows them.
// STATE, DERIVED, never stored beyond her switch (0174: dm_state 'off' | 'on'):
//   not_connected  no connection row, or the messages permission not proved on her token (messages_granted_at null)
//   off            proved, switch off
//   paused         switch on, but her token cannot be used (tokenForCall refuses: lapsed or withdrawn)
//   waiting        switch on, the lane not open for her (reachable only once the door shows beyond the lane; kept for the grant)
//   on             switch on, token usable, lane open, AND her account's webhook subscription made (dm_subscribed_at set)
//                  (CE-46 IGD-2 cut 2c, F-44.212: switched on, proved and open but NOT subscribed answers 'waiting', whose
//                  existing line the pwa already draws with its Turn off; the door's new `live` field is false there, for
//                  FE-4's plainer line. Nothing is delivered to an unsubscribed account, so 'on' there was untrue.)
// authorize_url is minted only when she must authorise (not_connected, paused): the connect's "messages" flavour, armed on her row.
// The quiet time reads and writes vendors.reply_quiet_minutes (0173; 60 | 120 | 240 | 480). Its effect lands in cut 2b.
const igInbound = require('./igInbound');
const { repliesEverOn } = require('./igDisconnect');

const QUIET = [60, 120, 240, 480];

function deriveState({ conn, tokenOk, laneOpen }) {
  if (!conn || !conn.messages_granted_at) return 'not_connected';
  if (conn.dm_state !== 'on') return 'off';
  if (!tokenOk) return 'paused';
  if (!laneOpen) return 'waiting';
  return conn.dm_subscribed_at ? 'on' : 'waiting';
}

function needsAuthorize(state) { return state === 'not_connected' || state === 'paused'; }

async function readConn(supabase, vendorId) {
  const { data, error } = await supabase.from('vendor_ig_connections')
    .select('vendor_id, ig_user_id, ig_username, messages_granted_at, dm_state, dm_consented_at, dm_subscribed_at')
    .eq('vendor_id', vendorId).maybeSingle();
  if (error) return { ok: false };
  return { ok: true, conn: data || null };
}

// deps: { supabase, env, tokenOk(vendorId) -> bool, mintAuthorize(vendorId) -> url|null, subscribe(vendorId, on) -> {ok} }
async function answer(vendorId, deps) {
  const laneOpen = igInbound.laneOpen(vendorId, deps.env);
  if (!laneOpen) return { status: 404 };
  const r = await readConn(deps.supabase, vendorId);
  if (!r.ok) return { status: 503 };
  const tokenOk = r.conn && r.conn.messages_granted_at ? await deps.tokenOk(vendorId) : false;
  const state = deriveState({ conn: r.conn, tokenOk, laneOpen });
  const authorize_url = needsAuthorize(state) ? await deps.mintAuthorize(vendorId) : null;
  // CE-46 G6-5: her handle and whether replies were ever on, for the disconnect sheet's line (the founder's rows 2 and 3).
  // Display facts only; the token is never here.
  const connected = state !== 'not_connected';
  const ig_username = connected && r.conn ? r.conn.ig_username || null : null;
  const replies_ever_on = connected ? repliesEverOn(r.conn) : false;
  return { status: 200, body: { ok: true, state, authorize_url, ig_username, replies_ever_on, live: state === 'on' } };
}

// CE-46 IGD-2 cut 2c (F-44.212): the connect's messages callback calls this after it has PROVED the grant. If she had already
// turned the switch on (the room's designed order: Turn on, then Instagram authorises), her account is subscribed now and
// dm_subscribed_at stamped, as flip does. deps: { supabase, now(), subscribe() -> {ok} }.
async function subscribeIfOn(vendorId, deps) {
  const r = await readConn(deps.supabase, vendorId);
  if (!r.ok || !r.conn || r.conn.dm_state !== 'on') return { subscribed: false, why: r.ok ? 'not_on' : 'read' };
  const s = await deps.subscribe();
  if (!s || !s.ok) return { subscribed: false, why: 'refused' };
  await deps.supabase.from('vendor_ig_connections').update({ dm_subscribed_at: deps.now() }).eq('vendor_id', vendorId);
  return { subscribed: true };
}

async function flip(vendorId, on, deps) {
  if (!igInbound.laneOpen(vendorId, deps.env)) return { status: 404 };
  if (typeof on !== 'boolean') return { status: 400 };
  const r = await readConn(deps.supabase, vendorId);
  if (!r.ok) return { status: 503 };
  const now = deps.now();
  if (on) {
    // Consent is recorded when she turns it on, whether or not Instagram must first authorise; the switch only reads "on" once the
    // permission is proved on her token, and the subscription is made only then.
    if (r.conn) {
      await deps.supabase.from('vendor_ig_connections')
        .update({ dm_state: 'on', dm_consented_at: now, updated_at: now }).eq('vendor_id', vendorId);
      if (r.conn.messages_granted_at && (await deps.tokenOk(vendorId))) {
        const s = await deps.subscribe(vendorId, true);
        if (s.ok) await deps.supabase.from('vendor_ig_connections').update({ dm_subscribed_at: now }).eq('vendor_id', vendorId);
      }
    }
  } else if (r.conn) {
    await deps.subscribe(vendorId, false);
    await deps.supabase.from('vendor_ig_connections')
      .update({ dm_state: 'off', dm_subscribed_at: null, updated_at: now }).eq('vendor_id', vendorId);
  }
  return answer(vendorId, deps);
}

async function quiet(vendorId, deps, minutes) {
  if (!igInbound.laneOpen(vendorId, deps.env)) return { status: 404 };
  if (minutes !== undefined) {
    if (!QUIET.includes(minutes)) return { status: 400 };
    const w = await deps.supabase.from('vendors').update({ reply_quiet_minutes: minutes }).eq('id', vendorId);
    if (w.error) return { status: 503 };
  }
  const { data, error } = await deps.supabase.from('vendors').select('reply_quiet_minutes').eq('id', vendorId).maybeSingle();
  if (error || !data || !QUIET.includes(data.reply_quiet_minutes)) return { status: 503 };
  return { status: 200, body: { ok: true, minutes: data.reply_quiet_minutes } };
}

module.exports = { QUIET, deriveState, needsAuthorize, answer, flip, quiet, subscribeIfOn };
