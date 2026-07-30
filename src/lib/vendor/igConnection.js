// src/lib/vendor/igConnection.js
// TDW_07 P4a — THE CONNECTION STORE. One hand on public.vendor_ig_connections.
//
// ── WHY A TABLE AND NOT COLUMNS ON `vendors` (F2, CE-ruled (b)) ─────────────
// The read-first's argument, which the chair made the ruling's core: a token
// column on `vendors` is one careless `select('*')` away from an exfiltration,
// and src/api/vendor/me.js:204 and :215 are the habit's own evidence — two
// hand-enumerated column lists that a future hand extends by reflex. A separate
// table makes the secret STRUCTURALLY ABSENT from every profile read. No
// discipline is required to keep it out of /me, because it was never in reach.
//
// ── THE SINGLE-USE MECHANISM LIVES HERE, NOT IN THE SIGNATURE ──────────────
// igOAuth.verifyState proves a state is authentic, vendor-bound and fresh. It
// CANNOT prove it is unused — a signature is a fact about bytes, not about
// history. `pending_state_nonce` is the history: written at /authorize, matched
// and NULLed at /callback. A replayed state finds a null nonce and is refused.
// The database is the arbiter because the database is the only thing both
// requests share.
'use strict';

const TABLE = 'vendor_ig_connections';

// The columns any caller may read. THE TOKEN IS NOT HERE. Callers that need to
// TALK to Instagram use readToken() below, which is named so that reaching for a
// secret is a visible act in a diff rather than a field that arrived by accident
// in a wide select.
const SAFE_COLUMNS = 'vendor_id, ig_user_id, connected_at, token_expires_at, last_refreshed_at';

/** The vendor-facing connection state. Never carries the token. */
async function getConnection(supabase, vendorId) {
  const { data, error } = await supabase
    .from(TABLE).select(SAFE_COLUMNS).eq('vendor_id', vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, connection: data || null };
}

/**
 * Read the access token. THE ONLY FUNCTION IN THE ESTATE THAT SELECTS IT.
 * Deliberately not folded into getConnection: a secret that arrives without
 * being asked for is a secret that ends up in a response body.
 */
async function readToken(supabase, vendorId) {
  const { data, error } = await supabase
    .from(TABLE).select('access_token, token_expires_at, connected_at').eq('vendor_id', vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data || !data.access_token) return { ok: false, error: 'not_connected' };
  return {
    ok: true,
    accessToken: data.access_token,
    expiresAt:   data.token_expires_at,
    connectedAt: data.connected_at,
  };
}

/**
 * Arm an authorize attempt: persist the nonce so the callback can spend it.
 * Upsert on vendor_id — a vendor who abandons a half-finished connect and starts
 * again simply overwrites their own pending nonce, which also means the OLD
 * state is dead the moment a new one is minted. That is a property, not a
 * side effect: only the most recent connect attempt can ever complete.
 */
async function armState(supabase, vendorId, nonce) {
  const { error } = await supabase.from(TABLE).upsert({
    vendor_id:           vendorId,
    pending_state_nonce: nonce,
    pending_state_at:    new Date().toISOString(),
    updated_at:          new Date().toISOString(),
  }, { onConflict: 'vendor_id' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Spend the nonce. Returns ok only if the stored nonce MATCHES and was present.
 * The NULLing is what makes it single-use, and it happens before any token is
 * requested — so even a code exchange that fails cannot leave a replayable state.
 */
async function spendState(supabase, vendorId, nonce) {
  const { data, error } = await supabase
    .from(TABLE).select('pending_state_nonce').eq('vendor_id', vendorId).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data || !data.pending_state_nonce) {
    return { ok: false, error: 'This connection link was already used. Please start again.' };
  }
  if (data.pending_state_nonce !== nonce) {
    return { ok: false, error: 'This connection link is no longer valid. Please start again.' };
  }
  const { error: clearErr } = await supabase.from(TABLE)
    .update({ pending_state_nonce: null, pending_state_at: null, updated_at: new Date().toISOString() })
    .eq('vendor_id', vendorId);
  if (clearErr) return { ok: false, error: clearErr.message };
  return { ok: true };
}

/** Persist a freshly-minted long-lived token. */
async function saveToken(supabase, vendorId, { igUserId, accessToken, expiresAt }) {
  const now = new Date().toISOString();
  const { error } = await supabase.from(TABLE).upsert({
    vendor_id:        vendorId,
    ig_user_id:       igUserId,
    access_token:     accessToken,
    token_expires_at: expiresAt,
    connected_at:     now,
    last_refreshed_at: now,
    updated_at:       now,
  }, { onConflict: 'vendor_id' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Persist a refreshed token. connected_at is NOT touched — it is the birth date. */
async function updateToken(supabase, vendorId, { accessToken, expiresAt }) {
  const now = new Date().toISOString();
  const { error } = await supabase.from(TABLE).update({
    access_token:      accessToken,
    token_expires_at:  expiresAt,
    last_refreshed_at: now,
    updated_at:        now,
  }).eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Disconnect. THE ROW IS DELETED, not blanked.
 * The addendum's law is that Instagram is a SOURCE, never a dependency — the
 * mirrored photos are the estate's own bytes and survive untouched. So there is
 * nothing to retain: keeping a dead token to remember that someone once
 * connected is storing a secret for a record-keeping reason, which is how
 * secrets outlive their purpose.
 */
async function disconnect(supabase, vendorId) {
  const { error } = await supabase.from(TABLE).delete().eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

module.exports = {
  TABLE,
  SAFE_COLUMNS,
  getConnection,
  readToken,
  armState,
  spendState,
  saveToken,
  updateToken,
  disconnect,
};
