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

// ── CE-46 G6-4 · F-44.254 (ruled 30 September 2026): WHICH ROW A CHANGE BELONGS TO ─────────────────────────────────────
// A WABA-level account_update (PARTNER_ADDED, PARTNER_APP_INSTALLED, PARTNER_APP_UNINSTALLED, PARTNER_REMOVED, the ban and
// restriction events) carries NO phone_number_id and names her WABA in value.waba_info.waba_id. The walk of 30 September showed
// the envelope's entry.id did not find her row for these, so every such event fell to the vendor service's generic seam and her
// row never heard it. The order now: the change's phone_number_id; else value.waba_info.waba_id; else entry.id. The first lookup
// that finds a row wins. When waba_info names a WABA that differs from entry.id, the pair is logged ONCE per process, so the
// mismatch is read from live data rather than assumed.
const seenPairs = new Set();
async function lookupForChange(supabase, { phoneNumberId, entryId, change }, now = Date.now) {
  if (phoneNumberId) return lookup(supabase, { phoneNumberId }, now);
  const v = (change && change.value) || {};
  const named = v.waba_info && v.waba_info.waba_id ? String(v.waba_info.waba_id) : null;
  if (named && entryId && named !== String(entryId)) {
    const key = `${entryId}|${named}`;
    if (!seenPairs.has(key)) { seenPairs.add(key); console.log(`[own-number] ${change && change.field} entry.id ${entryId} names waba_info.waba_id ${named} (F-44.254)`); }
  }
  if (named) { const r = await lookup(supabase, { wabaId: named }, now); if (r) return r; }
  return entryId ? lookup(supabase, { wabaId: entryId }, now) : null;
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

module.exports = {
  lookupForChange, lookup, _reset, CACHE_MS, activeOwnDigits, isConnectedOwnNumber, _resetActive };
