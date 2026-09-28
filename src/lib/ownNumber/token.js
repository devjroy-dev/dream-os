'use strict';
// src/lib/ownNumber/token.js · CE-46 · G6-3 · CUT THREE (a) · HER BUSINESS TOKEN, KEPT SEALED, READ HERE ONLY (F-44.224).
//
// THE READ (28 September 2026 IST), Meta's own pages:
//   · "Onboarding business customers as a Tech Provider", Step 1: GET /oauth/access_token exchanges the Embedded Signup code
//     for a business integration system user access token ("business token"); every later call for that customer uses it.
//   · Embedded Signup overview: a Tech Provider uses business tokens exclusively.
//   · Facebook Login for Business, "Get tokens": POST /<client business id>/system_user_access_tokens needs an access token with
//     business_management. TDW's system token has none, which is why G6-2's T-c fetch was refused on production with
//     "(#33) Insufficient permissions to access this data" (28 September, W1). T-c is removed; this file no longer calls Meta.
//
// SO: connect.js keeps the token the exchange returns, sealed by src/lib/vendor/tokenVault.js, in vendor_wabas.business_token
// (0180). This file is the ONE reader of that column (a census cell in b141 holds that). The plaintext goes only to the caller
// that asked (send.js) and is never logged: `mask` shows the last four characters and nothing else (R-40.92).
const vault = require('../vendor/tokenVault');

class TokenError extends Error {
  constructor(message, reason) { super(message); this.name = 'TokenError'; this.reason = reason || null; }
}

/** Pure: a token as `***` plus its last four characters; anything short or absent is `***`. */
function mask(token) {
  const s = typeof token === 'string' ? token : '';
  return s.length > 8 ? `***${s.slice(-4)}` : '***';
}

/** Her business token from her row, opened from its seal. Throws TokenError: 'no_token' | 'unopenable'. */
function businessTokenFor(row, { vaultApi = vault } = {}) {
  const sealed = row && row.business_token;
  if (!sealed) throw new TokenError('no business token on her number: she connects again from the room', 'no_token');
  const r = vaultApi.open(sealed);
  if (!r || !r.ok || !r.value) throw new TokenError(`business token did not open: ${(r && r.error) || 'unknown'}`, 'unopenable');
  return r.value;
}

module.exports = { businessTokenFor, mask, TokenError };
