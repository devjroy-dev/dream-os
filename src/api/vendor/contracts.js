// src/api/vendor/contracts.js
// POST   /api/v2/vendor/contracts/upload-url           — get signed upload URL
// POST   /api/v2/vendor/contracts/:id/finalize         — finalize after upload
// GET    /api/v2/vendor/contracts                      — list contracts
// GET    /api/v2/vendor/contracts/:id/download         — signed download URL
// PATCH  /api/v2/vendor/contracts/:id                  — update metadata
// POST   /api/v2/vendor/contracts/:id/send             — mark sent
// DELETE /api/v2/vendor/contracts/:id                  — soft delete (cancelled)
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const C = require('../../lib/vendor/contracts');
const { getUploadUrl, finalizeContract, getDownloadUrl } = C;
const { renderContract } = require('../../lib/vendor/contractSource');
const { siteBase } = require('../../lib/vendor/creditInvite');

const authMw = [requireAuth, resolveVendor()];

// POST /upload-url — must be before /:id routes
router.post('/upload-url', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, client_id, lead_id, invoice_id, filename } = req.body || {};
  const result = await getUploadUrl(supabase, req.vendor.id, { title, clientId: client_id, leadId: lead_id, invoiceId: invoice_id, filename });
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract_id: result.contract_id, upload_url: result.upload_url, expires_in: result.expires_in });
}));

// GET / — list
//
// ⚠ `include_cancelled=1` RELAXES THE FILTER — R-G32.15, veto row 9.
// The door has always hidden cancelled contracts, which was right when the room was a
// list of PDFs and is wrong now: the room shows all four states, with cancelled as its
// own section at the foot. The filter is relaxed BEHIND A QUERY PARAM rather than
// removed, because every existing caller expects the old shape and a silently widened
// list would put cancelled rows into surfaces that never asked for them. Filed as
// **F-40.115**; the room passes the param, nothing else does.
router.get('/', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { client_id, lead_id, state, include_cancelled } = req.query;
  let q = supabase.from('contracts').select('*')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (String(include_cancelled || '') !== '1') q = q.neq('state', 'cancelled');
  if (client_id) q = q.eq('client_id', client_id);
  if (lead_id)   q = q.eq('lead_id', lead_id);
  if (state)     q = q.eq('state', state);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { contracts: data || [], total: (data || []).length });
}));

// POST /:id/finalize
router.post('/:contractId/finalize', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await finalizeContract(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract: result.contract });
}));

// GET /:id/download
router.get('/:contractId/download', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await getDownloadUrl(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { download_url: result.download_url, expires_in: result.expires_in });
}));

// PATCH /:id
router.patch('/:contractId', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['title', 'notes', 'state', 'client_id', 'lead_id', 'invoice_id', 'signed_at'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  const { data, error } = await supabase.from('contracts')
    .update(updates).eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Contract not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { contract: data });
}));

// POST /:id/send
router.post('/:contractId/send', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await getDownloadUrl(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 404, result.error);

  const { data, error } = await supabase.from('contracts')
    .update({ state: 'sent', sent_at: new Date().toISOString() })
    .eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) return errRes(res, 500, error.message);

  return okRes(res, { contract: data, download_url: result.download_url });
}));

// DELETE /:id — soft delete
router.delete('/:contractId', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('contracts')
    .update({ state: 'cancelled' })
    .eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Contract not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { contract: data });
}));

// ═══════════════════════════════════════════════════════════════════════════
// G3.2 · THE FILL PATH. The upload path above is untouched and stays.
// ═══════════════════════════════════════════════════════════════════════════

// POST /compose — create from a client (+ event, + invoice)
router.post('/compose', ...authMw, asyncHandler(async (req, res) => {
  const b = req.body || {};
  const r = await C.composeContract(req.app.locals.supabase, req.vendor.id, {
    clientId: b.client_id, name: b.name, phone: b.phone,
    eventId: b.event_id, invoiceId: b.invoice_id,
    title: b.title, depositPct: b.deposit_pct,
  });
  if (!r.ok) return errRes(res, 400, r.error);
  // `promoted` crosses so the record can say `Added to your clients.` ONLY when a
  // row was actually created — R-G32.17's visibility, and it is a fact from the
  // resolver rather than an inference from which argument the door was given.
  return okRes(res, { contract: r.contract, promoted: r.promoted === true });
}));

// PATCH /:id/fill — the blanks
router.patch('/:contractId/fill', ...authMw, asyncHandler(async (req, res) => {
  const b = req.body || {};
  const r = await C.saveContractFill(req.app.locals.supabase, req.vendor.id, req.params.contractId, {
    terms: b.terms, annexes: b.annexes, depositPct: b.deposit_pct,
  });
  if (!r.ok) return errRes(res, 400, r.error);
  return okRes(res, { contract: r.contract });
}));

// POST /:id/preview — render the draft, store it, hand back a SIGNED URL
//
// ═══ F-40.152 · THE FIRST CUT OF THIS DOOR COULD NEVER HAVE WORKED ═════════
// It returned PDF BYTES from behind `authMw`, and the room opened it with
// `window.open()`. **A NEW TAB CARRIES NO AUTHORIZATION HEADER.** Every press
// returned `{"error":"Missing or malformed Authorization header.","reason":"no_token"}`
// and the button had never once rendered a document. Found on the founder's glass,
// on the walk — no bench could have seen it, because every cell in b56 and b57 was
// asserting this file's own behaviour and not what a browser does with its address.
//
// ⚠ THE CURE WAS SIXTY LINES ABOVE, IN THE SAME FILE THE SEAT WAS READING.
// `getDownloadUrl` returns a **Supabase signed URL** precisely so a browser can open
// a private object without a header — which is exactly why `Download` has always
// worked on this room and `Preview` never did. This door is now that door's shape,
// and the chair refused a one-shot token for the reason that matters: a second
// credential class for one button is a second thing to keep correct forever.
//
// ⚠ IT IS A **POST**, AND THE VERB IS THE HONEST ONE. This door RENDERS and WRITES
// an object; a GET that mutates storage is a GET that a retry, a prefetch or a
// crawler will fire. The room asks for the url, then opens it.
//
// ⚠ `.draft.pdf`, NEVER `.signed.pdf`. The sealed copy is the agreement (clause 12)
// and is written once, by the sign door, over bytes a couple actually agreed to.
// This object is a convenience that is overwritten on every press, and the two must
// never be able to reach each other's path.
//
// ⚠ THROUGH `renderContract`, THE ONE CALL SITE. `generateContractPdf` is not
// imported here and b56 §5 reds if it ever is.
const PREVIEW_URL_TTL = 600;   // ten minutes — a preview is a glance, not a link to keep

// ── F-40.160 · THE DOWNLOAD IS NAMED BY THE OBJECT KEY ─────────────────────
// ⚠ A SUPABASE SIGNED URL NAMES THE SAVED FILE AFTER THE OBJECT PATH. The first
// cut wrote `${vendorId}/${contractId}.draft.pdf`, so a vendor's Downloads folder
// received `fd08429c-0b96-4527-8131-2396a0332a95_draft.pdf` — a uuid, for a
// document she is meant to keep, read and send on.
//
// ⚠ **THE INVOICE CURED THIS EXACT THING AND THE CURE WAS THE PATH.**
// `engine.js:1733` builds `${vendor.id}/INVOICE-05.pdf` precisely so the download
// carries a name a person can read. This seat took that mechanism's SIGNED URL and
// left its NAMING — the second of three specimens in one file of a precedent's
// mechanism taken without its lesson (F-40.162).
//
// ⚠ THE SUFFIX IS NOT DECORATION. `contracts` has no number column — nothing like
// `invoices.invoice_number` exists — and the generated title is
// `<client> — wedding services`, so two contracts for one client would collide on
// a title-only path and `upsert: true` would silently overwrite the other's draft.
// Eight characters of the id keep them apart. The name leads, the id follows, and
// the tradeoff is stated rather than hidden: a readable name that is still unique.
function draftPath(vendorId, contract) {
  const slug = String(contract.title || 'contract')
    .replace(/[\u2014\u2013]/g, '-')            // em and en dashes
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'contract';
  return `${vendorId}/CONTRACT-${slug}-${String(contract.id).slice(0, 8)}.draft.pdf`;
}

router.post('/:contractId/preview', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const r = await renderContract(supabase, req.vendor.id, req.params.contractId);
  if (!r.ok) return errRes(res, 404, r.error);

  const path = draftPath(req.vendor.id, r.source.contract);
  const up = await supabase.storage.from(C.BUCKET)
    .upload(path, r.buffer, { contentType: 'application/pdf', upsert: true });
  if (up.error) return errRes(res, 500, up.error.message);

  const { data, error } = await supabase.storage
    .from(C.BUCKET).createSignedUrl(path, PREVIEW_URL_TTL);
  if (error) return errRes(res, 500, error.message);

  return okRes(res, { pdf_url: data.signedUrl, expires_in: PREVIEW_URL_TTL });
}));

// POST /:id/send-to-couple — open a signing and hand back the link
//
// ⚠ THE LINK IS RETURNED TO THE VENDOR **ONLY WHILE THE SEND IS DARK**, and this is
// the one place that departs from G1.2's cure. F-40.105 found that the consent token
// reached the VENDOR by design, so the counterparty could say yes — and master §2.4 is
// that the counterparty never means yes.
//
// A CONTRACT IS THE OTHER SHAPE. The vendor is the party who SENDS the agreement; she
// is supposed to have the link, exactly as she is supposed to have the PDF. What she
// cannot have, and does not get, is the CODE: `issueSignCode` returns it once, to the
// send path, and it is hashed on the row. **The counterparty holding the link cannot
// sign, because she cannot receive the password.** That is the whole of the protection
// and it is the reason clause 12 has an OTP at all.
router.post('/:contractId/send-to-couple', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('contracts')
    .select('id, client_id').eq('id', req.params.contractId).eq('vendor_id', req.vendor.id).maybeSingle();
  if (!row) return errRes(res, 404, 'Contract not found.');

  let phone = (req.body || {}).signer_phone || null;
  if (!phone && row.client_id) {
    const { data: c } = await supabase.from('clients')
      .select('phone').eq('id', row.client_id).maybeSingle();
    phone = c && c.phone;
  }

  const r = await C.openSigning(supabase, req.vendor.id, req.params.contractId, { signerPhone: phone });
  if (!r.ok) return errRes(res, 400, r.error);

  const flagOn = String(process.env.CONTRACT_SIGN_SEND_ENABLED || '') === '1';
  return okRes(res, {
    contract_id: req.params.contractId,
    sign_url: `${siteBase()}/sign/${r.token}`,
    sent: false,
    // NEVER A FALSE DONE. The template is dark, so nothing was sent and the reason is
    // named rather than left for a walk to discover.
    reason: flagOn ? 'template tdw_contract_sign is not approved on the sending WABA'
                   : 'CONTRACT_SIGN_SEND_ENABLED is not set',
  });
}));

// POST /:id/deposit — vendor-marked only (master §7, veto row 52)
router.post('/:contractId/deposit', ...authMw, asyncHandler(async (req, res) => {
  const received = (req.body || {}).received !== false;
  const r = await C.markDepositReceived(req.app.locals.supabase, req.vendor.id, req.params.contractId, received);
  if (!r.ok) return errRes(res, 400, r.error);
  return okRes(res, { contract: r.contract });
}));

// GET/PUT /profile — her policies, asked once (R-G32.3 a)
//
// ⚠ MOUNTED UNDER THE CONTRACTS ROOM AND NOT UNDER `/vendor/me`, deliberately: these
// are the INSTRUMENT'S fields, they change when the instrument changes, and a vendor
// profile door that grew them would tie the two together.
router.get('/profile/fields', ...authMw, asyncHandler(async (req, res) => {
  const { data } = await req.app.locals.supabase.from('contract_profiles')
    .select('fields').eq('vendor_id', req.vendor.id).maybeSingle();
  return okRes(res, { fields: (data && data.fields) || {} });
}));

router.post('/profile/fields', ...authMw, asyncHandler(async (req, res) => {
  const fields = (req.body || {}).fields;
  if (!fields || typeof fields !== 'object') return errRes(res, 400, 'fields object is required.');
  const { data, error } = await req.app.locals.supabase.from('contract_profiles')
    .upsert({ vendor_id: req.vendor.id, fields, updated_at: new Date().toISOString() },
            { onConflict: 'vendor_id' })
    .select().single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { fields: data.fields });
}));

module.exports = router;
