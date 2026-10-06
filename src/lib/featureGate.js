'use strict';
// src/lib/featureGate.js · CE-47 · ADS-2 · ONE HOME for "is this Meta feature open for her?" (the founder, 4 Oct 2026).
//   OPEN = the feature's row is 'on' AND her stored choice is not 'off' (no row means ON)
//          AND, for an Instagram feature, she has connected Instagram through Meta's screen.
//   Before the row is on, only the walk list's test vendors are open, as each gate had it (DEV440).
//   flag.own_number is not here: it keeps its own door.
// The live probes the sweep runs before a row goes on are here too (FEATURE_PROBE_VENDOR_ID's real tokens).
const cap = require('./capabilities');
const gates = require('./metaGates');

const IG_GRAPH = 'https://graph.instagram.com/v26.0';
const FB_GRAPH = 'https://graph.facebook.com';
const FEATURE_KEYS = Object.freeze(gates.FEATURES.map((f) => f.gate));
const NEEDS_INSTAGRAM = Object.freeze(['perm.instagram_business_manage_messages', 'flag.ig_photo_import']);

function walkOpen(key, row, vendorId, env) {
  const v = String(vendorId || '');
  if (key === 'perm.instagram_business_manage_messages') {
    return String((env && env.IG_DM_WALK_VENDOR_IDS) || '').split(',').map((x) => x.trim()).filter(Boolean).includes(v);
  }
  if (key === 'flag.ads') return !!(row && row.status === 'armed' && env && env.ADS_WALK_VENDOR_ID && env.ADS_WALK_VENDOR_ID === v);
  return false;
}

async function choiceOf(supabase, vendorId, key) {
  const { data, error } = await supabase.from('vendor_feature_choices').select('choice').eq('vendor_id', vendorId).eq('feature_key', key).maybeSingle();
  if (error) return { ok: false, choice: 'on' };
  return { ok: true, choice: data && data.choice === 'off' ? 'off' : 'on' };
}

async function instagramConnected(supabase, vendorId) {
  const { data, error } = await supabase.from('vendor_ig_connections').select('ig_user_id').eq('vendor_id', vendorId).maybeSingle();
  return !error && !!(data && data.ig_user_id);
}

/** Is `key` open for this vendor? { open, reason }. `row` may be passed (the cached switchboard row). */
async function openFor({ supabase, vendorId, key, env = process.env, row }) {
  if (!FEATURE_KEYS.includes(key)) return { open: false, reason: `${key} is not a Meta-gated feature` };
  const r = row || (await cap.get(key, { supabase }));
  if (!r) return { open: false, reason: `${key} has no row on the switchboard` };
  if (r.status !== 'on') return walkOpen(key, r, vendorId, env) ? { open: true, reason: 'walk vendor before approval' } : { open: false, reason: `${key} is ${r.status}` };
  const c = await choiceOf(supabase, vendorId, key);
  if (c.choice === 'off') return { open: false, reason: 'she chose off' };
  if (NEEDS_INSTAGRAM.includes(key) && !(await instagramConnected(supabase, vendorId))) return { open: false, reason: 'Instagram not connected' };
  return { open: true, reason: null };
}

/** The door's list: every Meta-gated feature, its row's state and her choice. */
async function choicesFor({ supabase, vendorId }) {
  const { data } = await supabase.from('vendor_feature_choices').select('feature_key, choice').eq('vendor_id', vendorId);
  const mine = Object.fromEntries((data || []).map((x) => [x.feature_key, x.choice]));
  const out = [];
  for (const f of gates.FEATURES) {
    const row = await cap.get(f.gate, { supabase });
    out.push({ key: f.gate, feature: f.feature, live: !!(row && row.status === 'on'), choice: mine[f.gate] === 'off' ? 'off' : 'on' });
  }
  return out;
}

async function setChoice({ supabase, vendorId, key, choice }) {
  if (!FEATURE_KEYS.includes(key)) return { ok: false, error: 'not a Meta-gated feature' };
  if (choice !== 'on' && choice !== 'off') return { ok: false, error: 'choice is on or off' };
  const { error } = await supabase.from('vendor_feature_choices')
    .upsert({ vendor_id: vendorId, feature_key: key, choice, chosen_at: new Date().toISOString(), chosen_by: 'vendor' }, { onConflict: 'vendor_id,feature_key' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── THE LIVE PROBES (the sweep runs one only after Meta lists the permission "live" for the app) ──
async function getJson(f, url, token) {
  try {
    const res = await f(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body || body.error) { const e = (body && body.error) || {}; return { ok: false, evidence: `${res.status} (#${e.code || '?'}) ${e.message || 'no message'}` }; }
    return { ok: true };
  } catch (e) { return { ok: false, evidence: `unreachable: ${e && e.message}` }; }
}

/** { ok, evidence }. deps: { supabase, env, fetch }. Never throws. */
async function probe(key, { supabase, env = process.env, fetch: f = globalThis.fetch } = {}) {
  const who = env.FEATURE_PROBE_VENDOR_ID || '';
  if (!who) return { ok: false, evidence: 'FEATURE_PROBE_VENDOR_ID is not set; no live probe can run' };
  if (key === 'perm.instagram_business_manage_messages' || key === 'flag.ig_photo_import') {
    const t = await require('./vendor/igConnection').tokenForCall(supabase, who);
    if (!t.ok) return { ok: false, evidence: `the probe vendor's Instagram token: ${t.error}` };
    const path = key === 'flag.ig_photo_import' ? 'me/media?fields=id&limit=1' : 'me/conversations?platform=instagram&limit=1';
    const r = await getJson(f, `${IG_GRAPH}/${path}`, t.accessToken);
    return r.ok ? { ok: true, evidence: `live probe passed: GET ${path.split('?')[0]}` } : { ok: false, evidence: `live probe failed: GET ${path.split('?')[0]} ${r.evidence}` };
  }
  if (key === 'flag.ads') {
    const { data } = await supabase.from('vendor_ad_connections').select('access_token').eq('vendor_id', who).maybeSingle();
    if (!data || !data.access_token) return { ok: false, evidence: 'the probe vendor has no ads connection' };
    const r = await getJson(f, `${FB_GRAPH}/${env.META_GRAPH_VERSION || 'v21.0'}/me/adaccounts?fields=id&limit=1`, data.access_token);
    return r.ok ? { ok: true, evidence: 'live probe passed: GET me/adaccounts' } : { ok: false, evidence: `live probe failed: GET me/adaccounts ${r.evidence}` };
  }
  return { ok: false, evidence: `no live probe is defined for ${key}` };
}

module.exports = { FEATURE_KEYS, NEEDS_INSTAGRAM, openFor, choicesFor, setChoice, probe, walkOpen };
