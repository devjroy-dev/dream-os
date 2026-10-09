'use strict';
// src/lib/brands/brands.js · CE-47 · PRO · P3 · BRAND COLLABORATIONS, the reads and writes (the store is passed in).
// Rules, limits and words are in rules.js. A pitch row is added ONLY by 0210's pro_pitch_record(), which holds her lock
// and refuses a pitch over the limits; nothing here inserts into pro_pitches directly.
const R = require('./rules');
const { verifiedWeddings } = require('../papers/verifiedWeddings');

const BRAND_COLS = 'id, name, trades, looks_for, website_url, instagram_handle, role_email, form_url, source_url, followers_min, followers_max, checked_on, state, created_at, updated_at';
const PITCH_COLS = 'id, vendor_id, brand_id, channel, state, post_due, note, pitched_at, updated_at';
const SITE = () => (process.env.PWA_BASE_URL || 'https://thedreamwedding.in').replace(/\/+$/, '');
const kitUrlOf = (vendor) => (vendor.routing_handle ? `${SITE()}/v/${String(vendor.routing_handle).toLowerCase()}/kit` : null);
const no = (status, error) => ({ ok: false, status, error });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function kitRow(supabase, vendorId) {
  const k = await supabase.from('pro_kits').select('vendor_id, contact_email, followers, followers_on').eq('vendor_id', vendorId).maybeSingle();
  if (k.error) throw new Error('pro_kits');
  return k.data || { vendor_id: vendorId, contact_email: null, followers: null, followers_on: null };
}
async function counts(supabase, vendorId, now) {
  const w = R.windows(now);
  const [d, wk] = await Promise.all([
    supabase.from('pro_pitches').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).gte('pitched_at', w.dayStart),
    supabase.from('pro_pitches').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).gte('pitched_at', w.weekStart),
  ]);
  if (d.error || wk.error) throw new Error('pro_pitches');
  const day = d.count || 0, week = wk.count || 0;
  return { day, week, day_left: Math.max(0, R.DAY_LIMIT - day), week_left: Math.max(0, R.WEEK_LIMIT - week), line: R.countsLine(week), limits: R.LIMITS_LINE };
}

/** Everything the Brand collaborations room shows her. */
async function room({ supabase, vendor, now = Date.now() }) {
  const trade = R.tradeKey(vendor.category);
  const [kit, c, brands, pitches, w] = await Promise.all([
    kitRow(supabase, vendor.id), counts(supabase, vendor.id, now),
    supabase.from('pro_brands').select(BRAND_COLS).eq('state', 'listed').order('name', { ascending: true }).limit(300),
    supabase.from('pro_pitches').select(PITCH_COLS).eq('vendor_id', vendor.id).order('pitched_at', { ascending: false }).limit(100),
    verifiedWeddings({ supabase, vendorId: vendor.id, now }),
  ]);
  if (brands.error || pitches.error) return no(500, 'TDW could not read your brands just now. Please try again.');
  const all = brands.data || [];
  const nameOf = new Map(all.map((b) => [b.id, b.name]));
  const missing = [...new Set((pitches.data || []).map((p) => p.brand_id).filter((id) => !nameOf.has(id)))];
  if (missing.length) {   // a brand she pitched that is hidden now still shows its name on her pitch
    const h = await supabase.from('pro_brands').select('id, name').in('id', missing);
    for (const b of (h.data || [])) nameOf.set(b.id, b.name);
  }
  const fit = all.filter((b) => R.fits(b, trade, kit.followers)).map(R.viewBrand);
  return { ok: true, room: {
    kit: { url: kitUrlOf(vendor), contact_email: kit.contact_email, followers: kit.followers, followers_on: kit.followers_on, weddings: w.count == null ? null : w.count },
    counts: c, trade, trade_word: R.TRADE_WORD[trade], brands: fit,
    pitches: (pitches.data || []).map((p) => R.viewPitch(p, nameOf.get(p.brand_id))),
  } };
}

/** One brand, with the pitch TDW wrote for her and where she can send it. */
async function brand({ supabase, vendor, brandId, now = Date.now() }) {
  if (!UUID.test(String(brandId))) return no(404, 'This brand is not on the list.');
  const b = await supabase.from('pro_brands').select(BRAND_COLS).eq('id', brandId).eq('state', 'listed').maybeSingle();
  if (b.error) return no(500, 'TDW could not read this brand just now. Please try again.');
  if (!b.data) return no(404, 'This brand is not on the list.');
  const w = R.windows(now);
  const [last, c, wv] = await Promise.all([
    supabase.from('pro_pitches').select(PITCH_COLS).eq('vendor_id', vendor.id).eq('brand_id', brandId).order('pitched_at', { ascending: false }).limit(1),
    counts(supabase, vendor.id, now), verifiedWeddings({ supabase, vendorId: vendor.id, now }),
  ]);
  if (last.error) return no(500, 'TDW could not read this brand just now. Please try again.');
  const prev = (last.data || [])[0] || null;
  const blocked = prev && prev.pitched_at > w.monthAgo ? R.RECORD_WORDS.brand_30 : c.day_left === 0 ? R.RECORD_WORDS.day_3 : c.week_left === 0 ? R.RECORD_WORDS.week_10 : null;
  const kitUrl = kitUrlOf(vendor);
  const text = R.pitchText({ vendorName: (vendor.business_name || '').trim() || null, trade: R.tradeKey(vendor.category), city: (vendor.city || '').trim() || null, weddings: wv.count || 0, kitUrl: kitUrl || `${SITE()}`, brandName: b.data.name });
  return { ok: true, brand: {
    ...R.viewBrand(b.data), pitch: text, blocked,
    send: R.channelsOf(b.data).map((ch) => ({ channel: ch, link: R.channelLink(b.data, ch, text), step: R.SEND_STEP[ch] })),
    sent_ask: R.SENT_ASK, last_pitch: prev ? R.viewPitch(prev, b.data.name) : null, counts: c,
  } };
}

/** She says she sent a pitch. The database function decides, under her lock. */
async function record({ supabase, vendor, brandId, body, now = Date.now() }) {
  if (!UUID.test(String(brandId))) return no(404, 'This brand is not on the list.');
  const channel = String((body || {}).channel || '');
  if (!R.CHANNELS.includes(channel)) return no(400, 'Choose how you sent the pitch.');
  const b = await supabase.from('pro_brands').select('id, role_email, form_url, instagram_handle, state').eq('id', brandId).maybeSingle();
  if (b.error) return no(500, 'TDW could not save your pitch just now. Please try again.');
  if (!b.data || b.data.state !== 'listed') return no(404, R.RECORD_WORDS.not_listed);
  if (!R.channelsOf(b.data).includes(channel)) return no(400, 'This brand cannot be reached that way.');
  const w = R.windows(now);
  const r = await supabase.rpc('pro_pitch_record', { p_vendor: vendor.id, p_brand: brandId, p_channel: channel, p_post_due: null, p_day_start: w.dayStart, p_week_start: w.weekStart, p_month_ago: w.monthAgo });
  if (r.error) return no(500, 'TDW could not save your pitch just now. Please try again.');
  const word = R.RECORD_WORDS[r.data];
  if (word === undefined) return no(500, 'TDW could not save your pitch just now. Please try again.');
  if (word) return no(r.data === 'not_listed' ? 404 : 409, word);
  return { ok: true, counts: await counts(supabase, vendor.id, now) };
}

/** She moves a pitch to its next step (and may give the post's due date). */
async function move({ supabase, vendor, pitchId, body, today }) {
  if (!UUID.test(String(pitchId))) return no(404, 'That pitch is not in your account.');
  const to = String((body || {}).to || '');
  const p = await supabase.from('pro_pitches').select(PITCH_COLS).eq('id', pitchId).eq('vendor_id', vendor.id).maybeSingle();
  if (p.error) return no(500, 'TDW could not save this just now. Please try again.');
  if (!p.data) return no(404, 'That pitch is not in your account.');
  const due = (body || {}).post_due == null || (body || {}).post_due === '' ? undefined : String(body.post_due);
  const patch = { updated_at: new Date().toISOString() };
  if (to && to !== p.data.state) {
    if (!R.canMove(p.data.state, to)) return no(409, 'This pitch cannot move to that step.');
    patch.state = to;
  }
  if (due !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due < today) return no(400, 'Pick the day the post is due. It cannot be a day that has passed.');
    const st = patch.state || p.data.state;
    if (st !== 'agreed' && st !== 'kit_received') return no(409, 'A due date can be added only after you agree to work together.');
    patch.post_due = due;
  }
  if (Object.keys(patch).length === 1) return no(400, 'Nothing was changed.');
  const u = await supabase.from('pro_pitches').update(patch).eq('id', pitchId).eq('vendor_id', vendor.id).select(PITCH_COLS).maybeSingle();
  if (u.error || !u.data) return no(500, 'TDW could not save this just now. Please try again.');
  const n = await supabase.from('pro_brands').select('name').eq('id', u.data.brand_id).maybeSingle();
  return { ok: true, pitch: R.viewPitch(u.data, n.data && n.data.name) };
}

/** Her kit settings: the email address brands write to. */
async function saveKit({ supabase, vendor, body }) {
  const raw = String((body || {}).contact_email || '').trim();
  const email = raw ? raw.toLowerCase() : null;
  if (email && !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return no(400, 'Type your email address in full, for example hello@yourstudio.in.');
  const r = await supabase.from('pro_kits').upsert({ vendor_id: vendor.id, contact_email: email, updated_at: new Date().toISOString() }, { onConflict: 'vendor_id' }).select('contact_email').maybeSingle();
  if (r.error) return no(500, 'TDW could not save your email just now. Please try again.');
  return { ok: true, kit: { contact_email: r.data ? r.data.contact_email : email } };
}

// ── admin: More > Brands ─────────────────────────────────────────────────────────────────────────────────────────
async function adminList({ supabase, state }) {
  const q = supabase.from('pro_brands').select(BRAND_COLS).order('name', { ascending: true }).limit(1000);
  const r = state === 'hidden' || state === 'listed' ? await q.eq('state', state) : await q;
  if (r.error) return no(500, 'TDW could not read the brands.');
  const pitched = await supabase.from('pro_pitches').select('brand_id').limit(10000);
  const n = new Map(); for (const p of (pitched.data || [])) n.set(p.brand_id, (n.get(p.brand_id) || 0) + 1);
  return { ok: true, brands: (r.data || []).map((b) => ({ ...b, pitches: n.get(b.id) || 0 })) };
}
async function adminSave({ supabase, id, body, today, who }) {
  const c = R.checkBrand(body, today); if (!c.ok) return no(400, c.error);
  if (id && !UUID.test(String(id))) return no(404, 'TDW has no such brand.');
  const row = { ...c.row, updated_at: new Date().toISOString() };
  const r = id
    ? await supabase.from('pro_brands').update(row).eq('id', id).select(BRAND_COLS).maybeSingle()
    : await supabase.from('pro_brands').insert({ ...row, created_by: who || 'admin' }).select(BRAND_COLS).maybeSingle();
  if (r.error) return no(r.error.code === '23505' ? 409 : 500, r.error.code === '23505' ? 'A brand with this Instagram handle is already on the list.' : 'TDW could not save the brand.');
  if (!r.data) return no(404, 'TDW has no such brand.');
  return { ok: true, brand: r.data };
}
async function adminState({ supabase, id, state }) {
  if (!UUID.test(String(id))) return no(404, 'TDW has no such brand.');
  if (state !== 'listed' && state !== 'hidden') return no(400, 'Choose Show or Hide.');
  const r = await supabase.from('pro_brands').update({ state, updated_at: new Date().toISOString() }).eq('id', id).select(BRAND_COLS).maybeSingle();
  if (r.error) return no(500, 'TDW could not save the brand.');
  if (!r.data) return no(404, 'TDW has no such brand.');
  return { ok: true, brand: r.data };
}

module.exports = { room, brand, record, move, saveKit, adminList, adminSave, adminState, kitUrlOf, counts, BRAND_COLS, PITCH_COLS };
