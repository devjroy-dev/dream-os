'use strict';
// src/lib/ownNumber/connect.js · CE-45 · G6-1 · 2a · THE CONNECT: Meta's code in, her row out.
// FE_1 posts { code, event, waba_id, phone_number_id, business_id } the instant the code arrives
// (c-45.27: it lives 30 seconds). Order is fixed by that clock: the gate and the row check are local
// reads, then the EXCHANGE comes first of every Meta call.
//
// THE TWO WAYS (the founder's words since 2026-09-24: "Use it on my phone and in TDW app" is the SHARED
// way, Coexistence; "Use it only in TDW app" is the MOVED way). Told apart by Meta's own finish event:
//   FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING -> shared: NO register (c-45.28); contacts then history sync,
//                                              once each, inside 24 hours (c-45.32). A history refusal
//                                              (Meta error 2593109) is a normal outcome, not a failure.
//   FINISH                                  -> moved: register with the derived PIN (F3).
//   anything else                           -> refused ('unsupported_finish'); nothing is written.
//
// Refusals carry `reason` (for logs) and `reason_text` (plain words). FE_1 draws its OWN expiry byte
// for 'code_expired' and the server's reason_text otherwise, so reason_text here is never a new
// vendor-facing byte class: it states what happened in the words the room already uses.
const meta = require('./meta');
const door = require('./door');

const FINISH_SHARED = 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING';
const FINISH_MOVED = 'FINISH';
const S = (x) => (typeof x === 'string' && x.length > 0 && x.length < 4096 ? x : null);

const refuse = (reason, reason_text) => ({ ok: false, reason, reason_text });
const TEXT_FAILED = 'This could not be loaded just now.';

/** Pure: validates the body FE_1 sends. Anything else is a refusal before any read. */
function readBody(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  const code = S(b.code);
  if (!code) return null;
  return { code, event: S(b.event), waba_id: S(b.waba_id), phone_number_id: S(b.phone_number_id), business_id: S(b.business_id) };
}

/** Pure: which way Meta says she took. */
function wayOf(event) {
  if (event === FINISH_SHARED) return 'shared';
  if (event === FINISH_MOVED) return 'moved';
  return null;
}

async function connect({ vendor, body, supabase, env = process.env, fetchImpl = fetch, capApi, now = () => new Date() }) {
  const b = readBody(body);
  if (!b) return refuse('bad_body', TEXT_FAILED);

  // 1 · the gate, exactly the door's (walk mode only in 2a).
  const masterRow = await (capApi || require('../capabilities')).get(door.MASTER);
  if (!door.openFor({ masterRow, vendorId: vendor.id, env }).open) return refuse('closed', TEXT_FAILED);
  const appId = env.META_APP_ID; const appSecret = env.META_APP_SECRET;
  if (!appId || !appSecret) return refuse('not_configured', TEXT_FAILED);

  // 2 · her row: refused while pending or active (F6); a migrated_out row is replaced below.
  const cur = await supabase.from('vendor_wabas').select('id, status').eq('vendor_id', vendor.id).maybeSingle();
  if (cur.error) throw new Error(`vendor_wabas read: ${cur.error.message}`);
  if (cur.data && (cur.data.status === 'pending' || cur.data.status === 'active' || cur.data.status === 'suspended')) {
    return refuse('already_connected', TEXT_FAILED);
  }

  // 3 · the exchange, first of every Meta call.
  let token;
  try {
    token = await meta.exchangeCode({ code: b.code, appId, appSecret, env, fetchImpl });
  } catch (e) {
    return e instanceof meta.MetaError && e.expired ? refuse('code_expired', TEXT_FAILED) : refuse('exchange_failed', TEXT_FAILED);
  }

  // 4 · what she chose, and whose account it is. Without the session's WABA and business the row cannot
  //     be written honestly (business_id is NOT NULL; it is how 2b re-fetches her token, FK5).
  const way = wayOf(b.event);
  if (!way) return refuse('unsupported_finish', TEXT_FAILED);
  if (!b.waba_id || !b.business_id) return refuse('session_incomplete', TEXT_FAILED);

  try {
    // 5 · her number. The shared way's session carries no phone_number_id (c-45.28): read it from Meta.
    const nums = await meta.phoneNumbers({ wabaId: b.waba_id, token, env, fetchImpl });
    const n = (b.phone_number_id ? nums.find((x) => String(x.id) === b.phone_number_id) : null) || nums[0];
    if (!n || !n.id || !n.display_phone_number) return refuse('no_number', TEXT_FAILED);
    const pnid = String(n.id);

    // 6 · subscribe the app to her WABA; then register (moved) or nothing (shared).
    await meta.subscribe({ wabaId: b.waba_id, token, env, fetchImpl });
    if (way === 'moved') {
      const pin = meta.pinFor(pnid, appSecret);
      if (!pin) return refuse('not_configured', TEXT_FAILED);
      await meta.register({ phoneNumberId: pnid, token, pin, env, fetchImpl });
    }

    // 7 · the row. A migrated_out row is replaced (F6), never stacked.
    if (cur.data) {
      const del = await supabase.from('vendor_wabas').delete().eq('id', cur.data.id).select('id');
      if (del.error || !del.data || del.data.length !== 1) throw new Error(`vendor_wabas replace: ${del.error ? del.error.message : 'no row removed'}`);
    }
    const row = {
      vendor_id: vendor.id, business_id: b.business_id, waba_id: b.waba_id, phone_number_id: pnid,
      display_number: String(n.display_phone_number), connect_way: way,
      status: way === 'shared' ? 'pending' : 'active',
      quality_rating: n.quality_rating ? String(n.quality_rating) : null, tier: vendor.tier || null,
    };
    const ins = await supabase.from('vendor_wabas').insert(row).select('status, display_number, connect_way, quality_rating');
    if (ins.error || !ins.data || ins.data.length !== 1) throw new Error(`vendor_wabas insert: ${ins.error ? ins.error.message : 'no row'}`);

    // 8 · SHARED: the once-only sync, inside Meta's 24 hours, started now. Her contacts first, then her
    //     history. A refusal of history is hers to make (2593109 arrives later on the history webhook).
    if (way === 'shared') {
      const results = [];
      for (const syncType of ['smb_app_state_sync', 'history']) {
        try { await meta.smbSync({ phoneNumberId: pnid, token, syncType, env, fetchImpl }); results.push(`${syncType}:requested`); }
        catch (e) { results.push(`${syncType}:${e.message}`); }
      }
      const up = await supabase.from('vendor_wabas')
        .update({ status: 'active', sync_started_at: now().toISOString(), updated_at: now().toISOString() })
        .eq('vendor_id', vendor.id).select('status, display_number, connect_way, quality_rating');
      if (up.error || !up.data || up.data.length !== 1) throw new Error(`vendor_wabas sync mark: ${up.error ? up.error.message : 'no row'}`);
      console.log(`[own-number] ${vendor.id} shared-way sync ${results.join(' · ')}`);
      return { ok: true, number: door.numberViewFrom(up.data[0]) };
    }
    return { ok: true, number: door.numberViewFrom(ins.data[0]) };
  } catch (e) {
    console.error(`[own-number] connect for ${vendor.id} failed at ${e.step || 'write'}: ${e.message}`);
    return refuse(e instanceof meta.MetaError ? `meta_${e.step}` : 'write_failed', TEXT_FAILED);
  }
}

module.exports = { connect, readBody, wayOf, FINISH_SHARED, FINISH_MOVED };
