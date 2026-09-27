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

// ── CE-46 G6-2 2b · F-44.207 (b): IS THIS SENDER ON TDW'S SHARED LINE A CONNECTED OWN NUMBER? ──────────────────────
// A relay from TDW's line to a lead whose phone is a vendor's own number lands on that number; if the own-number turn
// answered it, TDW's line would read that number writing in as a client and answer back: a loop between our own lines.
// vendorInbound.js asks this ONCE at the head of its couple branch and gives such a sender no couple turn.
// display_number is Meta's display form ("+91 87577 88550"), so the match is by digits over the ACTIVE rows, read at most
// once per CACHE_MS. A failed read answers false and is logged: the shared lane then behaves exactly as before this cut.
let activeCache = null; // { at, set }
async function activeOwnDigits(supabase, now = Date.now) {
  if (activeCache && now() - activeCache.at < CACHE_MS) return activeCache.set;
  try {
    const { data, error } = await supabase.from('vendor_wabas').select('display_number').eq('status', 'active');
    if (error) { console.warn(`[own-number] active-number read: ${error.message}`); return new Set(); }
    const set = new Set((data || []).map((r) => String((r && r.display_number) || '').replace(/\D/g, '')).filter((d) => d.length >= 10));
    activeCache = { at: now(), set };
    return set;
  } catch (e) {
    console.warn(`[own-number] active-number read: ${e && e.message}`);
    return new Set();
  }
}
async function isConnectedOwnNumber(supabase, phone, now = Date.now) {
  const d = String(phone == null ? '' : phone).replace(/\D/g, '');
  if (d.length < 10) return false;
  return (await activeOwnDigits(supabase, now)).has(d);
}
function _resetActive() { activeCache = null; }

module.exports = { lookup, _reset, CACHE_MS, activeOwnDigits, isConnectedOwnNumber, _resetActive };
