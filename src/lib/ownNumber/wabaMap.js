'use strict';
// src/lib/ownNumber/wabaMap.js · CE-45 · G6-1 · 2a · WHICH VENDOR A CHANGE BELONGS TO (read-first FK3, ruled).
// The receiver asks once per change whose PNID is not one of the estate's three env lanes: by the
// change's phone_number_id when it has one (messages, statuses, history, smb_*), else by entry.id, the
// WABA (account_update, phone_number_quality_update, template events). A FOUND row is cached 60 seconds
// (laneFlags.js's doctrine); a MISS is never cached: it reads through to the table every time, so a
// vendor who connected a moment ago is found on her first event, and TDW's own WABA-level events (a
// miss by design) cost one indexed read each. A read that fails returns null and is logged: the
// change then routes as TDW's own (routeChange), which only ever logs.
const CACHE_MS = 60_000;
const cache = new Map(); // 'p:<pnid>' | 'w:<waba>' -> { at, row }

function _reset() { cache.clear(); }

async function lookup(supabase, { phoneNumberId, wabaId }, now = Date.now) {
  const key = phoneNumberId ? `p:${phoneNumberId}` : wabaId ? `w:${wabaId}` : null;
  if (!key) return null;
  const hit = cache.get(key);
  if (hit && now() - hit.at < CACHE_MS) return hit.row;
  try {
    const col = phoneNumberId ? 'phone_number_id' : 'waba_id';
    const { data, error } = await supabase.from('vendor_wabas')
      .select('vendor_id, waba_id, phone_number_id, status, paused_reason')
      .eq(col, String(phoneNumberId || wabaId)).maybeSingle();
    if (error) { console.warn(`[own-number] map read ${key}: ${error.message}`); return null; }
    if (data) cache.set(key, { at: now(), row: data });
    return data || null;
  } catch (e) {
    console.warn(`[own-number] map read ${key}: ${e && e.message}`);
    return null;
  }
}

module.exports = { lookup, _reset, CACHE_MS };
