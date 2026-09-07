// src/lib/vendor/tokenVault.js
// TDW · BLOCK 19 · G3.1 sitting 2 — THE ONE HOME FOR A STORED GRANT'S CIPHERTEXT.
//
// Spec §8 names INTEGRATION_TOKEN_KEY as "an AES-256 key" and env.js:52 lists it
// as P1's third key. Until this file nothing in the tree USED it: the Google
// refresh token is the first secret the estate keeps on a vendor's behalf that
// outlives a session, so it is the first that must never sit in a column in
// clear. G2 s2 (10-27) reads the same row through the same two functions.
//
// SHAPE: AES-256-GCM, a fresh 12-byte IV per seal, the auth tag kept beside the
// ciphertext. Stored as `v1.<iv b64url>.<tag b64url>.<ct b64url>` — the version
// prefix is what lets a later key rotation read old rows.
//
// THE KEY: INTEGRATION_TOKEN_KEY is 32 bytes, given as base64 (44 chars) or hex
// (64 chars). Anything else is refused at seal time, never at read time — a
// wrong key must fail BEFORE a token is written under it.
//
// ⚠ THE PLAINTEXT NEVER LEAVES THIS FILE EXCEPT TO THE CALLER THAT ASKED.
// No log line here prints a token, an IV or a key; `isConfigured()` returns a
// boolean of presence and validity, nothing else (env.js's own law).

'use strict';

const crypto = require('crypto');

const VERSION = 'v1';
const IV_BYTES = 12;

function b64url(buf) { return Buffer.from(buf).toString('base64url'); }
function unb64url(s) { return Buffer.from(String(s), 'base64url'); }

function keyBytes() {
  const raw = process.env.INTEGRATION_TOKEN_KEY || '';
  if (!raw) return null;
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  const b = Buffer.from(raw, 'base64');
  return b.length === 32 ? b : null;
}

/** Boolean of presence AND validity — a 20-byte key is "not configured". */
function isConfigured() { return keyBytes() !== null; }

/** Seal a secret. Throws on a missing/invalid key so a bad deploy cannot write. */
function seal(plain) {
  const key = keyBytes();
  if (!key) throw new Error('INTEGRATION_TOKEN_KEY missing or not 32 bytes.');
  const iv = crypto.randomBytes(IV_BYTES);
  const c  = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return [VERSION, b64url(iv), b64url(c.getAuthTag()), b64url(ct)].join('.');
}

/** Open a sealed value. Returns { ok, value } or { ok:false, error } — never throws on bad data. */
function open(sealed) {
  const key = keyBytes();
  if (!key) return { ok: false, error: 'INTEGRATION_TOKEN_KEY missing or not 32 bytes.' };
  const parts = String(sealed || '').split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) return { ok: false, error: 'Unrecognised sealed value.' };
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', key, unb64url(parts[1]));
    d.setAuthTag(unb64url(parts[2]));
    const out = Buffer.concat([d.update(unb64url(parts[3])), d.final()]).toString('utf8');
    return { ok: true, value: out };
  } catch {
    return { ok: false, error: 'Sealed value did not open under this key.' };
  }
}

module.exports = { isConfigured, seal, open, VERSION };
