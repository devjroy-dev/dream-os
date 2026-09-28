'use strict';
// src/lib/ads/runs.js · CE-46 · ADS-1 · cut 1 · THE ONE HAND ON public.vendor_ads (0177).
// A row exists BEFORE any Meta call (status 'draft'), so a refusal or a crash mid-chain still leaves a record of what
// she asked for and where Meta stopped. Meta's ids land as they are made. Every read is scoped to her vendor_id.
const TABLE = 'vendor_ads';
const now = () => new Date().toISOString();

async function draft(supabase, vendorId, { adAccountId, settings, days, totalMinor, currency }) {
  const { data, error } = await supabase.from(TABLE).insert({
    vendor_id: vendorId, kind: 'boost', ad_account_id: adAccountId, source_media_id: settings.media_id,
    daily_budget_minor: settings.budget.minor, days: Math.min(30, Math.max(1, days)), settings, total_minor: totalMinor,
    currency: currency || 'INR', status: 'draft',
  }).select('id').single();
  return error ? { ok: false, error: error.message } : { ok: true, id: data.id };
}
async function saveIds(supabase, id, ids) {
  await supabase.from(TABLE).update({ campaign_id: ids.campaignId, adset_id: ids.adsetId, creative_id: ids.creativeId,
    ad_id: ids.adId, ends_at: ids.endsAt, updated_at: now() }).eq('id', id);
}
async function mark(supabase, id, status) {
  const patch = { status, updated_at: now() };
  if (status === 'running') patch.started_at = now();
  if (status === 'ended') patch.ended_at = now();
  await supabase.from(TABLE).update(patch).eq('id', id);
}
async function refuse(supabase, id, reason) {
  await supabase.from(TABLE).update({ status: 'refused', refused_reason: String(reason).slice(0, 200), updated_at: now() }).eq('id', id);
}
async function mine(supabase, vendorId, id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await supabase.from(TABLE).select('*').eq('vendor_id', vendorId).eq('id', id).maybeSingle();
  return data || null;
}
async function latest(supabase, vendorId) {
  const { data } = await supabase.from(TABLE).select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(1);
  return Array.isArray(data) && data[0] ? data[0] : null;
}
async function saveInsights(supabase, id, days) {
  await supabase.from(TABLE).update({ last_insights: days, last_insights_at: now(), updated_at: now() }).eq('id', id);
}
/** Her list: newest first, safe columns only (no token lives here anyway). */
async function list(supabase, vendorId) {
  const { data } = await supabase.from(TABLE).select('id, kind, status, refused_reason, settings, total_minor, currency, started_at, ends_at, ended_at, last_insights, last_insights_at, created_at')
    .eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(50);
  return Array.isArray(data) ? data : [];
}
/** A confirmed change after it ran: the stored settings follow Meta, so the list and a duplicate stay true. */
async function changed(supabase, id, { budget, end }) {
  const { data } = await supabase.from(TABLE).select('settings').eq('id', id).maybeSingle();
  const st = (data && data.settings) || {};
  if (budget) { st.budget = { kind: budget.kind, minor: budget.minor }; }
  if (end) st.end = end;
  const patch = { settings: st, updated_at: now() };
  if (budget && budget.kind !== 'lifetime') patch.daily_budget_minor = budget.minor;
  if (end) patch.ends_at = end;
  await supabase.from(TABLE).update(patch).eq('id', id);
}
module.exports = { TABLE, list, changed, draft, saveIds, mark, refuse, mine, latest, saveInsights };
