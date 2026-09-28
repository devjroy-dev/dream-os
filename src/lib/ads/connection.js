'use strict';
// src/lib/ads/connection.js · CE-46 · ADS-1 · cut 1 · THE ONE HAND ON public.vendor_ad_connections (0177).
//
// igConnection.js's law carried over: the token lives in its own table and is NOT in SAFE_COLUMNS; the only reader of
// it is readToken(), named so that reaching for her secret is a visible act in a diff.
//
// ONE IMPROVEMENT, named: igConnection.spendState reads the nonce and then clears it (two statements; two callbacks
// racing could both pass the read). Here the spend is ONE conditional UPDATE (vendor_id AND the nonce, returning the
// row): exactly one caller gets a row back, every other gets none and is refused. The database arbitrates in one step.
const TABLE = 'vendor_ad_connections';

const SAFE_COLUMNS = 'vendor_id, fb_user_id, granted_scopes, ad_account_id, ad_account_name, currency, page_id, page_name, ig_user_id, token_expires_at, consented_at, connected_at, updated_at';

const now = () => new Date().toISOString();

async function getConnection(supabase, vendorId) {
  const { data, error } = await supabase.from(TABLE).select(SAFE_COLUMNS).eq('vendor_id', vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, connection: data || null };
}

/** The secret, for talking to Meta only. Never returned to a client. */
async function readToken(supabase, vendorId) {
  const { data, error } = await supabase.from(TABLE).select('access_token, token_expires_at').eq('vendor_id', vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data || !data.access_token) return { ok: false, error: 'not_connected' };
  if (data.token_expires_at && Date.parse(data.token_expires_at) <= Date.now()) return { ok: false, error: 'expired' };
  return { ok: true, token: data.access_token };
}

/** /authorize: arm the one live nonce for this vendor (each mint replaces the last). */
async function armState(supabase, vendorId, nonce) {
  const { error } = await supabase.from(TABLE).upsert(
    { vendor_id: vendorId, pending_state_nonce: nonce, pending_state_at: now(), updated_at: now() },
    { onConflict: 'vendor_id' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** /callback: spend the nonce in ONE conditional statement. Cleared before any token is asked for. */
async function spendState(supabase, vendorId, nonce) {
  const { data, error } = await supabase.from(TABLE)
    .update({ pending_state_nonce: null, pending_state_at: null, updated_at: now() })
    .eq('vendor_id', vendorId).eq('pending_state_nonce', nonce)
    .select('vendor_id');
  if (error) return { ok: false, error: error.message };
  if (!Array.isArray(data) || data.length !== 1) return { ok: false, error: 'This connection link was already used or is no longer valid. Please start again.' };
  return { ok: true };
}

/** After the exchange: her token, her Facebook id, the scopes she actually granted. */
async function saveToken(supabase, vendorId, { fbUserId, accessToken, expiresAt, scopes }) {
  const { error } = await supabase.from(TABLE).update({
    fb_user_id: fbUserId || null, access_token: accessToken, token_expires_at: expiresAt || null,
    granted_scopes: Array.isArray(scopes) ? scopes : [], consented_at: now(), connected_at: now(), updated_at: now(),
  }).eq('vendor_id', vendorId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** What the three-gap read found ready: the Page, her Instagram, the ad account. NULLs clear a gap that reopened. */
async function saveAssets(supabase, vendorId, { page, ig, account }) {
  const { error } = await supabase.from(TABLE).update({
    page_id: page ? page.id : null, page_name: page ? page.name : null,
    ig_user_id: ig ? ig.id : null,
    ad_account_id: account ? account.id : null, ad_account_name: account ? account.name : null,
    currency: account ? account.currency : null, updated_at: now(),
  }).eq('vendor_id', vendorId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Disconnect: the row goes whole (token, assets, state). Her ads on Meta are hers and are not touched. */
async function disconnect(supabase, vendorId) {
  const { error } = await supabase.from(TABLE).delete().eq('vendor_id', vendorId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

module.exports = { TABLE, SAFE_COLUMNS, getConnection, readToken, armState, spendState, saveToken, saveAssets, disconnect };
