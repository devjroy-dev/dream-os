'use strict';
// src/lib/gear/gear.js · CE-47 · PRO · P2 · GEAR SHARING, the reads and writes (the store is passed in).
// Rules and what each side sees are in rules.js. A phone is READ from the database only for the vendors on an accepted
// request, so a number for anyone else is never in hand to leak (P2-F6).
const R = require('./rules');

const ITEM_COLS = 'id, vendor_id, item, value_rs, price_per_day_rs, city, note, state, created_at';
const REQ_COLS = 'id, item_id, owner_vendor_id, borrower_vendor_id, date_from, date_to, note, state, created_at, decided_at';

async function parties(supabase, ids, phoneIds) {
  const out = {}; const want = [...new Set(ids.filter(Boolean))]; if (!want.length) return out;
  const { data, error } = await supabase.from('vendors').select('id, business_name, city').in('id', want);
  if (error) throw new Error('vendors');
  for (const v of data || []) out[v.id] = { business_name: v.business_name, city: v.city };
  const ph = [...new Set(phoneIds.filter(Boolean))];
  if (ph.length) {
    const p = await supabase.from('vendors').select('id, users!vendors_user_id_fkey ( phone )').in('id', ph);
    if (p.error) throw new Error('vendors');
    for (const v of p.data || []) if (out[v.id] && v.users && v.users.phone) out[v.id].phone = v.users.phone;
  }
  return out;
}

/** Everything the Gear room shows her. */
async function room({ supabase, vendor }) {
  const me = vendor.id;
  const [mine, near, asOwner, asBorrower] = await Promise.all([
    supabase.from('gear_items').select(ITEM_COLS).eq('vendor_id', me).order('created_at', { ascending: false }),
    vendor.city ? supabase.from('gear_items').select(ITEM_COLS).eq('state', 'listed').ilike('city', String(vendor.city).trim()).neq('vendor_id', me).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('gear_requests').select(REQ_COLS).eq('owner_vendor_id', me).order('created_at', { ascending: false }).limit(100),
    supabase.from('gear_requests').select(REQ_COLS).eq('borrower_vendor_id', me).order('created_at', { ascending: false }).limit(100),
  ]);
  for (const r of [mine, near, asOwner, asBorrower]) if (r.error) return { ok: false, status: 500, error: 'TDW could not read the Gear room just now. Please try again.' };
  const reqs = [...asOwner.data, ...asBorrower.data];
  const itemIds = [...new Set(reqs.map((r) => r.item_id))];
  const known = Object.fromEntries([...mine.data, ...near.data].map((i) => [i.id, i]));
  const missing = itemIds.filter((id) => !known[id]);
  if (missing.length) { const x = await supabase.from('gear_items').select(ITEM_COLS).in('id', missing); if (x.error) return { ok: false, status: 500, error: 'TDW could not read the Gear room just now. Please try again.' }; for (const i of x.data || []) known[i.id] = i; }
  const others = reqs.map((r) => (r.owner_vendor_id === me ? r.borrower_vendor_id : r.owner_vendor_id));
  const acceptedOthers = reqs.filter((r) => r.state === 'accepted').map((r) => (r.owner_vendor_id === me ? r.borrower_vendor_id : r.owner_vendor_id));
  let P; try { P = await parties(supabase, [...others, ...near.data.map((i) => i.vendor_id)], acceptedOthers); } catch (_e) { return { ok: false, status: 500, error: 'TDW could not read the Gear room just now. Please try again.' }; }
  // a phone read for an accepted pair is attached ONLY to that pair's rows; party() drops it for every other row
  return { ok: true, room: {
    mine: mine.data.map((i) => R.viewItem(i, null, true)),
    near: near.data.map((i) => R.viewItem(i, P[i.vendor_id], false)),
    lent: asOwner.data.map((r) => R.viewRequest(r, known[r.item_id], P[r.borrower_vendor_id], 'owner')),
    asked: asBorrower.data.map((r) => R.viewRequest(r, known[r.item_id], P[r.owner_vendor_id], 'borrower')),
  } };
}

async function listItem({ supabase, vendor, body }) {
  const c = R.checkItem(body); if (!c.ok) return { ok: false, status: 400, error: c.error };
  const { data, error } = await supabase.from('gear_items').insert({ vendor_id: vendor.id, ...c.row }).select(ITEM_COLS).single();
  if (error) return { ok: false, status: 500, error: 'TDW could not list the item just now. Please try again.' };
  return { ok: true, item: R.viewItem(data, null, true) };
}

async function withdrawItem({ supabase, vendor, itemId }) {
  const { data, error } = await supabase.from('gear_items').update({ state: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', itemId).eq('vendor_id', vendor.id).eq('state', 'listed').select('id');
  if (error) return { ok: false, status: 500, error: 'TDW could not withdraw the item just now. Please try again.' };
  if (!data || !data.length) return { ok: false, status: 404, error: 'That item is not listed in your account.' };
  return { ok: true };
}

async function ask({ supabase, vendor, itemId, body, today }) {
  const c = R.checkAsk(body, today); if (!c.ok) return { ok: false, status: 400, error: c.error };
  const it = await supabase.from('gear_items').select(ITEM_COLS).eq('id', itemId).maybeSingle();
  if (it.error) return { ok: false, status: 500, error: 'TDW could not send the request just now. Please try again.' };
  if (!it.data || it.data.state !== 'listed') return { ok: false, status: 404, error: 'This item is no longer listed.' };
  if (it.data.vendor_id === vendor.id) return { ok: false, status: 400, error: 'This item is yours.' };
  const taken = await supabase.from('gear_requests').select('date_from, date_to').eq('item_id', itemId).eq('state', 'accepted');
  if (taken.error) return { ok: false, status: 500, error: 'TDW could not send the request just now. Please try again.' };
  if ((taken.data || []).some((t) => R.overlaps(t, c.row))) return { ok: false, status: 409, error: 'The item is already lent on some of these days. Pick other dates.' };
  const dup = await supabase.from('gear_requests').select('id').eq('item_id', itemId).eq('borrower_vendor_id', vendor.id).eq('state', 'requested');
  if (dup.error) return { ok: false, status: 500, error: 'TDW could not send the request just now. Please try again.' };
  if ((dup.data || []).length) return { ok: false, status: 409, error: 'You have already asked for this item. Wait for the answer, or cancel that request first.' };
  const { data, error } = await supabase.from('gear_requests').insert({ item_id: itemId, owner_vendor_id: it.data.vendor_id, borrower_vendor_id: vendor.id, ...c.row })
    .select(REQ_COLS).single();
  if (error) return { ok: false, status: 500, error: 'TDW could not send the request just now. Please try again.' };
  let P; try { P = await parties(supabase, [it.data.vendor_id], []); } catch (_e) { P = {}; }
  return { ok: true, request: R.viewRequest(data, it.data, P[it.data.vendor_id], 'borrower') };
}

/** accept goes through 0211's pro_gear_accept, which locks the item and refuses an overlap in one step. */
async function accept({ supabase, vendor, requestId }) {
  const { data, error } = await supabase.rpc('pro_gear_accept', { p_request: requestId, p_owner: vendor.id });
  if (error) return { ok: false, status: 500, error: 'TDW could not accept the request just now. Please try again.' };
  if (data !== 'accepted') return { ok: false, status: data === 'not_found' ? 404 : 409, error: R.ACCEPT_WORDS[data] || R.ACCEPT_WORDS.not_found };
  return one({ supabase, vendor, requestId, side: 'owner' });
}

async function decide({ supabase, vendor, requestId, to }) {
  // decline: the owner, a request still asked. cancel: the borrower, asked or accepted; or the owner, accepted.
  const r = await supabase.from('gear_requests').select(REQ_COLS).eq('id', requestId).maybeSingle();
  if (r.error) return { ok: false, status: 500, error: 'TDW could not change the request just now. Please try again.' };
  const q = r.data; const me = vendor.id;
  if (!q || (q.owner_vendor_id !== me && q.borrower_vendor_id !== me)) return { ok: false, status: 404, error: 'That request is not in your account.' };
  const isOwner = q.owner_vendor_id === me;
  const allowed = to === 'declined' ? (isOwner && q.state === 'requested')
    : to === 'cancelled' ? ((!isOwner && ['requested', 'accepted'].includes(q.state)) || (isOwner && q.state === 'accepted')) : false;
  if (!allowed) return { ok: false, status: 409, error: 'This request has already been answered or cancelled.' };
  const u = await supabase.from('gear_requests').update({ state: to, decided_at: new Date().toISOString() }).eq('id', requestId).eq('state', q.state).select('id');
  if (u.error) return { ok: false, status: 500, error: 'TDW could not change the request just now. Please try again.' };
  if (!u.data || !u.data.length) return { ok: false, status: 409, error: 'This request has already been answered or cancelled.' };
  return one({ supabase, vendor, requestId, side: isOwner ? 'owner' : 'borrower' });
}

async function one({ supabase, vendor, requestId, side }) {
  const r = await supabase.from('gear_requests').select(REQ_COLS).eq('id', requestId).maybeSingle();
  if (r.error || !r.data) return { ok: false, status: 500, error: 'TDW could not read the request just now. Please try again.' };
  const it = await supabase.from('gear_items').select(ITEM_COLS).eq('id', r.data.item_id).maybeSingle();
  const other = side === 'owner' ? r.data.borrower_vendor_id : r.data.owner_vendor_id;
  let P; try { P = await parties(supabase, [other], r.data.state === 'accepted' ? [other] : []); } catch (_e) { P = {}; }
  return { ok: true, request: R.viewRequest(r.data, it.data || null, P[other], side) };
}

module.exports = { room, listItem, withdrawItem, ask, accept, decide };
