// src/lib/vendor/googleConnection.js
// TDW · BLOCK 19 · G3.1 sitting 2 — THE SOLE WRITER OF vendor_google_connections.
//
// Mirrors igConnection.js (0103) on 0147's table. Every write here cites 0147
// §1: PRIMARY KEY (id) · UNIQUE (vendor_id) · FK vendor_id → vendors ON DELETE
// CASCADE. Upserts are `onConflict: 'vendor_id'` — the UNIQUE is the row's
// identity, so a vendor who starts a connect twice overwrites herself.
//
// F-40.261 (a) — THE HOUSE ROW. `vendorId === null` addresses the one row with
// a NULL vendor_id (0147 §4's partial unique index makes it one). Postgres
// treats NULLs as distinct in UNIQUE(vendor_id) and supabase-js's `onConflict`
// cannot name a partial index, so the house row is written by id: find, then
// update-or-insert. `where()` is the one place that knows `.is` from `.eq`.
//
// TWO ALLOWLISTS, ONE RULE: `SAFE_COLUMNS` is what any door may read into a
// response; `refresh_token_enc` is NOT in it and is read only by
// `openRefreshToken`, which returns the PLAINTEXT to searchConsole.js and to no
// one else. A door that needs the token calls that function; a door that
// `select('*')`s this table is F-40.169's class and the bench catches it.

'use strict';

const vault = require('./tokenVault');

const TABLE = 'vendor_google_connections';
const SAFE_COLUMNS = 'vendor_id, google_email, scope, connected_at, last_synced_at, sc_property';

const HOUSE = null;
function where(q, vendorId) { return vendorId === HOUSE ? q.is('vendor_id', null) : q.eq('vendor_id', vendorId); }

/** The house row's id, or null. */
async function houseId(supabase) {
  const { data, error } = await supabase.from(TABLE).select('id').is('vendor_id', null).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data ? data.id : null };
}

/** Upsert by identity: vendor rows on UNIQUE(vendor_id); the house row by id (0147 §4). */
async function put(supabase, vendorId, patch) {
  if (vendorId !== HOUSE) {
    const { error } = await supabase.from(TABLE).upsert({ vendor_id: vendorId, ...patch }, { onConflict: 'vendor_id' });
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  const h = await houseId(supabase); if (!h.ok) return h;
  const { error } = h.id
    ? await supabase.from(TABLE).update(patch).eq('id', h.id)
    : await supabase.from(TABLE).insert({ vendor_id: null, ...patch });
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function getStatus(supabase, vendorId) {
  const { data, error } = await where(supabase.from(TABLE).select(SAFE_COLUMNS), vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data && data.connected_at ? data : null };
}

/** 0147 §1 — upsert onConflict vendor_id (UNIQUE). Only the most recent attempt can complete. */
async function armState(supabase, vendorId, nonce) {
  const now = new Date().toISOString();
  return put(supabase, vendorId, { pending_state_nonce: nonce, pending_state_at: now, updated_at: now });
}

/** Single-use: NULLed before any exchange, so a failed exchange leaves nothing replayable. */
async function spendState(supabase, vendorId, nonce) {
  const { data, error } = await where(supabase.from(TABLE).select('pending_state_nonce'), vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data || !data.pending_state_nonce) return { ok: false, error: 'This connection link was already used. Please start again.' };
  if (data.pending_state_nonce !== nonce)  return { ok: false, error: 'This connection link is no longer valid. Please start again.' };
  const { error: clearErr } = await where(supabase.from(TABLE)
    .update({ pending_state_nonce: null, pending_state_at: null, updated_at: new Date().toISOString() }), vendorId);
  if (clearErr) return { ok: false, error: clearErr.message };
  return { ok: true };
}

/** 0147 §1 — the grant lands SEALED. Throws from vault.seal if the key is absent: a grant is never stored in clear. */
async function saveGrant(supabase, vendorId, { sub, email, scope, refreshToken }) {
  const now = new Date().toISOString();
  return put(supabase, vendorId, {
    google_sub: sub, google_email: email, scope,
    refresh_token_enc: vault.seal(refreshToken),
    connected_at: now, updated_at: now,
  });
}

/** The ONLY reader of the ciphertext. Returns the plaintext to its caller and to no response. */
async function openRefreshToken(supabase, vendorId) {
  const { data, error } = await where(supabase.from(TABLE).select('refresh_token_enc'), vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data || !data.refresh_token_enc) return { ok: false, error: 'Not connected.' };
  const opened = vault.open(data.refresh_token_enc);
  return opened.ok ? { ok: true, refreshToken: opened.value } : opened;
}

async function setProperty(supabase, vendorId, scProperty) {
  const { error } = await where(supabase.from(TABLE).update({ sc_property: scProperty, updated_at: new Date().toISOString() }), vendorId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function markSynced(supabase, vendorId) {
  const { error } = await where(supabase.from(TABLE).update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }), vendorId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** 0147 §1 — delete by vendor_id (UNIQUE); the daily/query rows stay (they are hers, and history). */
async function disconnect(supabase, vendorId) {
  const { error } = await where(supabase.from(TABLE).delete(), vendorId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

module.exports = { TABLE, SAFE_COLUMNS, HOUSE, houseId, getStatus, armState, spendState, saveGrant, openRefreshToken, setProperty, markSynced, disconnect };
