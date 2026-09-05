// src/lib/vendor/contracts.js
// Shared write logic for vendor contracts.
'use strict';

const BUCKET = 'contracts';

// ── getUploadUrl ──────────────────────────────────────────────────────────
// Two-phase upload: create draft row, return signed upload URL.
async function getUploadUrl(supabase, vendorId, { title, clientId, leadId, invoiceId, filename }) {
  if (!title || !title.trim()) return { ok: false, error: 'title is required.' };
  if (!filename || !filename.trim()) return { ok: false, error: 'filename is required.' };

  // Create draft row first to get a contract_id
  const { data: row, error: rowErr } = await supabase.from('contracts').insert({
    vendor_id:  vendorId,
    title:      title.trim(),
    client_id:  clientId  || null,
    lead_id:    leadId    || null,
    invoice_id: invoiceId || null,
    state:      'draft',
  }).select().single();
  if (rowErr) return { ok: false, error: rowErr.message };

  const storagePath = `${vendorId}/${row.id}.pdf`;

  const { data: urlData, error: urlErr } = await supabase.storage
    .from(BUCKET).createSignedUploadUrl(storagePath);
  if (urlErr) {
    // Clean up the draft row
    await supabase.from('contracts').delete().eq('id', row.id);
    return { ok: false, error: 'Could not generate upload URL: ' + urlErr.message };
  }

  // Store path so finalize knows where to look
  await supabase.from('contracts').update({ storage_path: storagePath }).eq('id', row.id);

  return {
    ok:          true,
    contract_id: row.id,
    upload_url:  urlData.signedUrl,
    token:       urlData.token,
    expires_in:  300,
  };
}

// ── finalizeContract ──────────────────────────────────────────────────────
async function finalizeContract(supabase, vendorId, contractId) {
  const { data: row, error: rowErr } = await supabase.from('contracts')
    .select('*').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (rowErr) return { ok: false, error: rowErr.message };
  if (!row) return { ok: false, error: 'Contract not found.' };
  if (!row.storage_path) return { ok: false, error: 'No upload path recorded.' };

  // Try to get file metadata from storage
  const pathParts = row.storage_path.split('/');
  const folder    = pathParts.slice(0, -1).join('/');
  const fname     = pathParts[pathParts.length - 1];

  let fileSize = null;
  try {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder);
    const match = (files || []).find(f => f.name === fname);
    if (match) fileSize = match.metadata?.size || null;
  } catch (_) {}

  const { data, error } = await supabase.from('contracts').update({
    file_size:  fileSize,
    state:      'draft',
    updated_at: new Date().toISOString(),
  }).eq('id', contractId).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── getDownloadUrl ────────────────────────────────────────────────────────
async function getDownloadUrl(supabase, vendorId, contractId) {
  const { data: row } = await supabase.from('contracts')
    .select('storage_path').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (!row || !row.storage_path) return { ok: false, error: 'Contract or file not found.' };

  const { data, error } = await supabase.storage
    .from(BUCKET).createSignedUrl(row.storage_path, 3600);
  if (error) return { ok: false, error: error.message };
  return { ok: true, download_url: data.signedUrl, expires_in: 3600 };
}

// ── attachFromUrl ─────────────────────────────────────────────────────────
// WhatsApp path: download file from external URL, upload to storage, create row.
async function attachFromUrl(supabase, vendorId, { title, clientId, fileUrl }) {
  const https = require('https');
  const http  = require('http');

  const contractId  = require('crypto').randomUUID();
  const storagePath = `${vendorId}/${contractId}.pdf`;

  // Download file
  const buffer = await new Promise((resolve, reject) => {
    const proto = fileUrl.startsWith('https') ? https : http;
    proto.get(fileUrl, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });

  // Upload to storage
  const { error: upErr } = await supabase.storage
    .from(BUCKET).upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false });
  if (upErr) return { ok: false, error: 'Storage upload failed: ' + upErr.message };

  // Create row
  const { data, error } = await supabase.from('contracts').insert({
    id:           contractId,
    vendor_id:    vendorId,
    client_id:    clientId || null,
    title:        title || 'Contract',
    storage_path: storagePath,
    file_size:    buffer.length,
    state:        'draft',
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── cleanupDraftContracts ─────────────────────────────────────────────────
// Cron helper (src/cron.js:121, 03:00 IST): delete ABANDONED two-phase uploads.
//
// ═══ F-40.112 · THE COMMENT WAS RIGHT AND THE CODE WAS WRONG ══════════════
// This function's own comment has always said it deletes drafts "with no
// storage_path, or where the file never landed". THE CODE HAD NO SUCH FILTER:
// it selected EVERY row at `state='draft'` older than 24h, removed its storage
// object, and deleted the row.
//
// That was survivable while `draft` meant "an upload started five minutes ago".
// G3.2 makes `draft` THE STATE A VENDOR COMPOSES IN — she fills the blanks over
// a day, sleeps on the fee, comes back — and an unfixed cron would have deleted
// her half-written agreement at three in the morning, file and row, with no
// message and no undo. Found at the read-first, minted by the chair, cured here
// on the chair's own terms: **the code is made to match its comment.**
//
// THE FILTER IS `storage_path IS NULL`. A draft that never got a file is an
// abandoned upload and is exactly what this job was written for. A draft that
// HAS a path is either a finished upload awaiting `finalize`, or a composed
// agreement — and neither is this job's to destroy.
//
// ⚠ `.remove()` IS GONE WITH THE ROWS IT SERVED. Every row this function can now
// reach has a NULL `storage_path`, so there is no object to remove; keeping a
// storage call that can only ever be handed a null would be a line that looks
// like it does something. b56 §4 asserts BOTH WAYS: a path-carrying draft
// SURVIVES (reds if the filter is dropped), a path-less one is cleaned.
async function cleanupDraftContracts(supabase) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase.from('contracts')
    .select('id')
    .eq('state', 'draft')
    .is('storage_path', null)
    .lt('created_at', cutoff);

  let cleaned = 0;
  for (const row of (stale || [])) {
    await supabase.from('contracts').delete().eq('id', row.id);
    cleaned++;
  }
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// G3.2 · THE COMPOSED CONTRACT — ONE WRITER PER FACT
// ═══════════════════════════════════════════════════════════════════════════
// The upload path above is UNTOUCHED and stays (clause 12's last line: a vendor
// who would rather sign on paper can, and the room keeps the door). Everything
// below is the FILL path, and every function is the only writer of what it writes.

const crypto = require('crypto');

const DEFAULT_DEPOSIT_PCT = 30;
// ⚠ FIVE MINUTES, AND THE NUMBER IS META'S RATHER THAN OURS — 2026-09-06.
// `tdw_contract_sign_otp` was filed with the expiry add-on set to 5, so the message
// she reads says **"Expires in 5 minutes."**, and its validity period is 5 as well.
// This constant was 10. A door that accepted a code for ten minutes while the message
// promised five is the same divergence class as a document and its record disagreeing
// (F-39.49(b)): two homes for one fact, and the one the person actually reads is the
// one that must win. **The server moves to the message, never the message to the
// server** — the message is already on her phone and cannot be edited.
const OTP_TTL_MS   = 5 * 60 * 1000;
// THIRTY DAYS, matching `/consent/`'s own expiry and for the same reason it has one:
// this token flips a legal state, so it is a standing grant and not a page view.
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SIGN_TOKEN_BYTES = 32;
const MAX_OTP_ATTEMPTS = 5;

// ── composeContract ───────────────────────────────────────────────────────
// Creates a contract from a client (+ event, + invoice). Writes `terms`,
// `annexes`, `deposit_pct` and nothing else.
//
// ⚠ THE DEFAULT DEPOSIT IS OFFERED HERE AND IS NOT A DATABASE DEFAULT.
// R-40.37 says 30, editable. `0138` gives the column NO default precisely so that
// a row written by any other path is NULL rather than silently 30 — TDW authors
// no number in this instrument, and a database default would be TDW authoring one
// for every writer that ever forgets to pass it.
async function composeContract(supabase, vendorId, { clientId, eventId, invoiceId, title, depositPct }) {
  if (!clientId) return { ok: false, error: 'client_id is required.' };

  const { data: client } = await supabase
    .from('clients').select('id, name').eq('id', clientId).eq('vendor_id', vendorId).maybeSingle();
  if (!client) return { ok: false, error: 'Client not found.' };

  const pct = depositPct === undefined || depositPct === null
    ? DEFAULT_DEPOSIT_PCT : Number(depositPct);
  // The CHECK is `(deposit_pct IS NULL) OR (>0 AND <=100)` and matches
  // `payment_schedules_pct_check` because R-G32.6 makes them one number. Refusing
  // here rather than letting Postgres refuse is not belt-and-braces: a raw
  // constraint error is not a sentence a vendor can act on.
  if (!(pct > 0 && pct <= 100)) {
    return { ok: false, error: 'Deposit must be more than 0 and at most 100 percent.' };
  }

  const { data, error } = await supabase.from('contracts').insert({
    vendor_id:   vendorId,
    client_id:   clientId,
    event_id:    eventId   || null,
    invoice_id:  invoiceId || null,
    // ⚠ THE TITLE IS GENERATED, NOT TYPED. The upload sheet keeps its `Title *`
    // field; a contract she FILLS is named from the client and the instrument, so
    // nobody names one document twice (veto sheet row 10).
    title:       (title && title.trim()) || `${client.name} \u2014 wedding services`,
    deposit_pct: pct,
    state:       'draft',
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── saveContractFill ──────────────────────────────────────────────────────
// THE ONLY WRITER OF `terms`, `annexes` and `deposit_pct` after create.
//
// ⚠ REFUSES ON A SIGNED CONTRACT, AND THE REFUSAL IS THE POINT. A signed agreement
// whose blanks could still be edited is not an agreement; the sealed PDF carries a
// digest of the bytes she agreed to, and a later edit would make that digest a
// claim about a document that no longer exists.
async function saveContractFill(supabase, vendorId, contractId, { terms, annexes, depositPct }) {
  const { data: row } = await supabase.from('contracts')
    .select('id, state').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (!row) return { ok: false, error: 'Contract not found.' };
  if (row.state === 'signed')    return { ok: false, error: 'This contract is signed and cannot be edited.' };
  if (row.state === 'cancelled') return { ok: false, error: 'This contract is cancelled.' };

  const patch = { updated_at: new Date().toISOString() };
  if (terms   !== undefined) patch.terms   = terms   || {};
  if (annexes !== undefined) patch.annexes = annexes || {};
  if (depositPct !== undefined) {
    const p = depositPct === null ? null : Number(depositPct);
    if (p !== null && !(p > 0 && p <= 100)) {
      return { ok: false, error: 'Deposit must be more than 0 and at most 100 percent.' };
    }
    patch.deposit_pct = p;
  }
  const { data, error } = await supabase.from('contracts')
    .update(patch).eq('id', contractId).eq('vendor_id', vendorId).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── markDepositReceived ───────────────────────────────────────────────────
// THE ONLY WRITER OF `deposit_received_at`, and therefore the only writer of the
// date lock (R-G32.1). VENDOR-MARKED ONLY: nothing watches a bank account, nothing
// infers a payment from a message, and no money moves through this platform
// (master §7, veto row 51).
//
// ⚠ IT DOES NOT TOUCH `public.events`. The calendar DERIVES the lock through
// `src/lib/vendor/dateLock.js`; there is no second write and no second home.
async function markDepositReceived(supabase, vendorId, contractId, received) {
  const { data: row } = await supabase.from('contracts')
    .select('id, state').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (!row) return { ok: false, error: 'Contract not found.' };
  // A deposit holds dates under a SIGNED agreement. Marking one received on a draft
  // would lock a date against a document nobody has agreed to.
  if (row.state !== 'signed') return { ok: false, error: 'The contract is not signed yet.' };

  const { data, error } = await supabase.from('contracts')
    .update({ deposit_received_at: received === false ? null : new Date().toISOString(),
              updated_at: new Date().toISOString() })
    .eq('id', contractId).eq('vendor_id', vendorId).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

function hashOtp(code, salt) {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

// ── openSigning ───────────────────────────────────────────────────────────
// THE ONLY WRITER of an unverified `contract_signatures` row. Mints the token and
// flips the contract to `sent`.
async function openSigning(supabase, vendorId, contractId, { signerPhone }) {
  const src = await supabase.from('contracts')
    .select('id, state, client_id').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  const row = src.data;
  if (!row) return { ok: false, error: 'Contract not found.' };
  if (row.state === 'signed') return { ok: false, error: 'This contract is already signed.' };
  if (row.state === 'cancelled') return { ok: false, error: 'This contract is cancelled.' };
  if (!signerPhone) return { ok: false, error: 'No number to send to.' };

  const token = crypto.randomBytes(SIGN_TOKEN_BYTES).toString('base64url');

  // ⚠ NO CODE IS MINTED HERE, AND CLAUSE 12 IS WHY. The instrument says she reads it
  // on her phone, taps "I agree", AND THEN a one-time password reaches her. Minting
  // the code at send would put a live code on a number ten minutes before she has
  // opened anything — and would expire it while she was still reading. The mock's two
  // frames (`S3-sign-read` then `S3-sign-code`) are that order drawn.
  //
  // ONE OPEN SIGNING PER CONTRACT is enforced by `contract_signatures_open_key`
  // (0138), a partial UNIQUE on `contract_id WHERE verified_at IS NULL` — so a re-send
  // cannot leave two live tokens for one document. The delete below is the re-send
  // path; the index is what makes it correct rather than merely usual.
  await supabase.from('contract_signatures')
    .delete().eq('contract_id', contractId).is('verified_at', null);

  const { data: sig, error } = await supabase.from('contract_signatures').insert({
    contract_id:      contractId,
    vendor_id:        vendorId,
    signer_phone:     signerPhone,
    channel:          'otp',
    sign_token:       token,
    token_expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  }).select().single();
  if (error) return { ok: false, error: error.message };

  await supabase.from('contracts')
    .update({ state: 'sent', sent_at: new Date().toISOString() })
    .eq('id', contractId).eq('vendor_id', vendorId);

  return { ok: true, signature_id: sig.id, token };
}

// ── findSigningByToken ────────────────────────────────────────────────────
// THE LOOKUP, and the whole of the dead-token law. Expiry is checked HERE and a
// stale row is treated as ABSENT — so `expired`, `spent`, `forged` and
// `never existed` are one outcome with one shape, and no caller can accidentally
// tell them apart. `weddings.consent_token` is the precedent; spending is setting
// the token NULL, never raising a flag.
async function findSigningByToken(supabase, token) {
  const t = String(token || '').trim();
  if (!t) return null;
  const { data } = await supabase.from('contract_signatures')
    .select('id, contract_id, vendor_id, signer_phone, sign_token, token_expires_at, ' +
            'otp_hash, otp_expires_at, otp_attempts, verified_at, document_sha256, sealed_path')
    .eq('sign_token', t).maybeSingle();
  if (!data) return null;
  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) return null;
  return data;
}

// ── issueSignCode ─────────────────────────────────────────────────────────
// THE ONLY WRITER of `otp_hash` / `otp_expires_at`. Called when she taps I agree.
// Returns the code ONCE, to the caller that sends it. It is hashed on the row, never
// stored in clear, and never logged — `otpSend.js`'s own discipline.
async function issueSignCode(supabase, signatureId) {
  const code = String(crypto.randomInt(100000, 1000000));
  const { data, error } = await supabase.from('contract_signatures')
    .update({ otp_hash: hashOtp(code, String(signatureId)),
              otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString() })
    .eq('id', signatureId).is('verified_at', null).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, code, signature: data };
}

// ── verifySignCode ────────────────────────────────────────────────────────
// THE ONLY WRITER of `verified_at` and `otp_attempts`.
//
// ⚠ WRONG ANSWERS ONLY, AND A CORRECT ONE DOES NOT RESET THE COUNT — 0136's rule
// about the last-four check, and the same reasoning: a code someone has been working
// on is not forgiven by a lucky third guess. At MAX_OTP_ATTEMPTS the token is SPENT
// (set NULL), so the next request reads as a link that never existed.
async function verifySignCode(supabase, signing, code) {
  if (!signing || !signing.otp_hash) return { ok: false };
  if (signing.otp_expires_at && new Date(signing.otp_expires_at) < new Date()) return { ok: false };

  const given = String(code || '').trim();
  if (given && hashOtp(given, String(signing.id)) === signing.otp_hash) {
    const { data, error } = await supabase.from('contract_signatures')
      .update({ verified_at: new Date().toISOString(), sign_token: null })
      .eq('id', signing.id).is('verified_at', null).select().single();
    // ZERO ROWS TOUCHED IS A MISS, NOT A SUCCESS — `settle()`'s rule in
    // src/api/consent.js. The read passed and the write still moved nothing, which
    // means someone else verified it between the two.
    if (error || !data) return { ok: false };
    return { ok: true, signature: data };
  }

  const next = Number(signing.otp_attempts || 0) + 1;
  await supabase.from('contract_signatures')
    .update({ otp_attempts: next, ...(next >= MAX_OTP_ATTEMPTS ? { sign_token: null } : {}) })
    .eq('id', signing.id);
  return { ok: false, spent: next >= MAX_OTP_ATTEMPTS };
}

// ── setSealedPath ─────────────────────────────────────────────────────────
// The only writer of `contract_signatures.sealed_path` and `document_sha256`. Its own
// function for the reason `updateInvoicePdfUrl` is: "one writer home per table" does
// not take an exception for a two-field update — that exception is how a second home
// starts.
async function setSealedPath(supabase, signatureId, { sha256, path, signedAt }) {
  const { error } = await supabase.from('contract_signatures')
    .update({ document_sha256: sha256, sealed_path: path, signed_at: signedAt })
    .eq('id', signatureId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

module.exports = {
  getUploadUrl, finalizeContract, getDownloadUrl, attachFromUrl, cleanupDraftContracts,
  composeContract, saveContractFill, markDepositReceived, openSigning, setSealedPath,
  findSigningByToken, issueSignCode, verifySignCode,
  hashOtp, DEFAULT_DEPOSIT_PCT, OTP_TTL_MS, TOKEN_TTL_MS, MAX_OTP_ATTEMPTS, BUCKET,
};
