// src/api/vendor/contracts.js
// GET    /api/v2/vendor/contracts/annex-map            — which annexes the room offers
// POST   /api/v2/vendor/contracts/upload-url           — get signed upload URL
// POST   /api/v2/vendor/contracts/:id/finalize         — finalize after upload
// GET    /api/v2/vendor/contracts                      — list contracts
// GET    /api/v2/vendor/contracts/:id/download         — signed download URL
// PATCH  /api/v2/vendor/contracts/:id                  — update metadata
// POST   /api/v2/vendor/contracts/:id/send             — mark sent
// DELETE /api/v2/vendor/contracts/:id                  — soft delete (cancelled)
// POST   /api/v2/vendor/contracts/compose              — start from the standard agreement
// PATCH  /api/v2/vendor/contracts/:id/fill             — save her answers
// POST   /api/v2/vendor/contracts/:id/preview          — render the PDF, unsigned
// POST   /api/v2/vendor/contracts/:id/send-to-couple   — open signing, send the link
// POST   /api/v2/vendor/contracts/:id/deposit          — mark the deposit received
// GET    /api/v2/vendor/contracts/profile/fields       — her policies, read
// POST   /api/v2/vendor/contracts/profile/fields       — her policies, written
//
// ⚠ THIS LIST WAS ALREADY SEVEN DOORS SHORT before `annex-map` was added — the
// G3.2 sitting-1 routes (`compose`, `fill`, `preview`, `send-to-couple`,
// `deposit`, and both `profile/fields`) shipped without it moving. A manifest
// that stops being maintained is worse than no manifest, because a reader
// trusts it. Completed by census against `router.<verb>(` at 9b6321f, not by
// memory, and it is the FILE that is authoritative — this comment is a courtesy
// and is now true.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const C = require('../../lib/vendor/contracts');
const { getUploadUrl, finalizeContract, getDownloadUrl } = C;
const { renderContract, renderStandardAgreement, contractPdfSource } = require('../../lib/vendor/contractSource');
const { sendSignLink, signSendGate } = require('../../lib/vendor/contractSend');
const { formatDate } = require('../../lib/format');
const { siteBase } = require('../../lib/vendor/creditInvite');
// ── THE MAP'S ONE HOME (F4). Read by this door and by the pure renderer, and
// owned by neither — `contractAnnex.js` takes no supabase and must never take
// one. Putting it in `lib/vendor/contracts.js` would hand the renderer a path to
// the WRITE half it is constitutionally forbidden to have.
const { annexesFor, tradeDefaultsFor, omittedFor,
        PROFILE_PLACEHOLDERS } = require('../../lib/contractAnnex');

const authMw = [requireAuth, resolveVendor()];

// POST /upload-url — must be before /:id routes
router.post('/upload-url', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, client_id, lead_id, invoice_id, filename } = req.body || {};
  const result = await getUploadUrl(supabase, req.vendor.id, { title, clientId: client_id, leadId: lead_id, invoiceId: invoice_id, filename });
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract_id: result.contract_id, upload_url: result.upload_url, expires_in: result.expires_in });
}));

// ── GET /annex-map — WHICH ANNEXES THE ROOM OFFERS FIRST (R-G32.13, F4) ────
//
// ⚠ ITS OWN READ, AND NOT A FIELD ON COMPOSE OR FILL'S RESPONSE. The map is a
// fact about the ESTATE — which annexes exist, which trade usually attaches
// which — not a fact about a contract. A map that arrived attached to a contract
// would read as a property OF that contract, and the next seat would reasonably
// wonder why two contracts for one vendor could disagree.
//
// ⚠ AND IT IS A SUGGESTION, NEVER A RULE. `vendors.category` :1204 carries no
// CHECK, so nothing here is database-enforced: `others` is returned alongside
// `offered` precisely so the room can draw every annex and let her attach any of
// them. `mapped` is returned rather than inferred from `offered.length` — a
// surface that read a length would collapse three states into one, which is
// F-40.138's whole class.
//
// ⚠ MOUNTED ABOVE THE `/:contractId` ROUTES. `annex-map` would otherwise match
// `/:contractId` and arrive as a contract id, which is why `/upload-url` sits at
// the top of this file with the same comment. Express matches in order.
router.get('/annex-map', ...authMw, asyncHandler(async (req, res) => {
  // The category is read off the vendor row the middleware already resolved, so
  // no second query and no chance of reading a different vendor than the one
  // that authenticated.
  const { mapped, offered, others } = annexesFor(req.vendor.category);

  // ── THE TRADE DEFAULTS RIDE THE SAME READ — R-40.114, R-G32.21 ──────────
  // ⚠ ONE DOOR, BECAUSE THEY ANSWER ONE QUESTION. The map and the defaults are
  // both 「what does this vendor's TRADE usually do」, both keyed on the same
  // `vendors.category`, and both are facts about the estate rather than about a
  // contract. A second endpoint would be a second round trip for one answer and
  // a second place for the category to be read — which is how two surfaces come
  // to disagree about a vendor whose trade nobody changed.
  //
  // ⚠ `seeded` AND `mapped` ARE BOTH RETURNED AND THEY ARE NOT THE SAME FLAG.
  // They happen to agree today because both tables carry the same fourteen
  // keys, and a room inferring one from the other would break silently the
  // first time a category joins one table and not the other.
  const { seeded, delivery_basis, fields } = tradeDefaultsFor(req.vendor.category);

  return okRes(res, {
    mapped, offered, others,
    seeded,
    delivery_basis,
    defaults: fields,
    // The clause-7 rows this trade never asks. Sent rather than derived in the
    // room from `delivery_basis`, because the basis is not what decides it —
    // a `days` trade that hands over in person omits four of them too.
    omitted: omittedFor(req.vendor.category),
    // ⚠ PLACEHOLDERS ARE BYTES AND THEY TRAVEL WITH THE DEFAULTS (R-40.116).
    // A `Needed` row's greyed suggestion is as much a vendor-facing string as a
    // label is; leaving it in the room would put half the sheet's copy on one
    // plane and half on the other. `{name}` is substituted by the room from the
    // session — the literal must never carry one vendor's name to another's
    // screen, which is the mistake `clientFirstName` cures for 「Priya」.
    placeholders: PROFILE_PLACEHOLDERS,
  });
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
const PREVIEW_URL_TTL = 600;   // ten minutes — a preview is a glance, not a link to keep

// ── GET /standard — THE AGREEMENT SHE CAN READ BEFORE SHE FILLS ANYTHING ──────
// R-40.120 (C5). v4 rendered from her real row and her real policies, with a
// `[labelled placeholder]` wherever a couple, a fee or a date would go. NO ROW IS
// CREATED and nothing is written to `contracts`: the only write is the draft PDF
// to the bucket at a per-vendor path, upserted, so reading it twice costs one
// object. Declared ABOVE the `/:contractId/…` routes on purpose — Express matches
// in order, and `/standard` is a literal segment, never an id.
router.get('/standard', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const r = await renderStandardAgreement(supabase, req.vendor.id);
  if (!r.ok) return errRes(res, 404, r.error);
  const path = `${req.vendor.id}/STANDARD-AGREEMENT.draft.pdf`;
  const up = await supabase.storage.from(C.BUCKET)
    .upload(path, r.buffer, { contentType: 'application/pdf', upsert: true });
  if (up.error) return errRes(res, 500, up.error.message);
  const { data, error } = await supabase.storage
    .from(C.BUCKET).createSignedUrl(path, PREVIEW_URL_TTL);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { pdf_url: data.signedUrl, expires_in: PREVIEW_URL_TTL });
}));

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
  // F-40.268: a SIGNED contract has one document — the sealed object at
  // `contract_signatures.sealed_path` (`<vendor>/<id>.signed.pdf`). Re-rendering
  // it under a `.draft.pdf` name handed the founder a signed agreement called
  // draft. The sealed object is served under its own name; nothing is re-rendered.
  const { data: st } = await supabase.from('contracts')
    .select('state').eq('id', req.params.contractId).eq('vendor_id', req.vendor.id).maybeSingle();
  if (st && st.state === 'signed') {
    const { data: sig } = await supabase.from('contract_signatures')
      .select('sealed_path').eq('contract_id', req.params.contractId).not('sealed_path', 'is', null)
      .order('signed_at', { ascending: false }).limit(1).maybeSingle();
    if (sig && sig.sealed_path) {
      const { data, error } = await supabase.storage
        .from(C.BUCKET).createSignedUrl(sig.sealed_path, PREVIEW_URL_TTL);
      if (error) return errRes(res, 500, error.message);
      return okRes(res, { pdf_url: data.signedUrl, expires_in: PREVIEW_URL_TTL, sealed: true });
    }
  }
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
  const sign_url = `${siteBase()}/sign/${r.token}`;

  // ── THE SEND — sitting 3, the founder's walk of 2026-09-07 ───────────────
  // Until this cut the door returned `sent: false` under BOTH flag states, and
  // under `=1` a sentence about the template that read nothing — the flag was
  // set in production and no message existed to send. The flag now does what
  // its name says; the result is the send's, never assumed. NEVER A FALSE DONE
  // still holds: `sent` is Meta's answer, and a refusal comes back as a reason.
  // CE-41 seat C: `flag.contract_sign_send` on the switchboard, one home in
  // `contractSend.js` shared with `api/sign.js` — the env read is deleted.
  const gate = await signSendGate();
  if (!gate.on) {
    return okRes(res, { contract_id: req.params.contractId, sign_url, sent: false,
                        reason: gate.reason });
  }
  const src = await contractPdfSource(supabase, req.vendor.id, req.params.contractId);
  const owner = (src.ok && src.vendor && src.vendor.business_name) || null;
  // `functions` is the template's second variable — the same rows clause 3 prints,
  // events or manual, from the one home (`functionsForContract`).
  const functionsText = src.ok
    ? (src.functions || []).map((f) => [f.title, formatDate(f.event_date)].filter(Boolean).join(' \u00b7 ')).join(', ')
    : '';
  const s = await sendSignLink(supabase, {
    contractId: req.params.contractId, vendorId: req.vendor.id,
    toPhone: phone, owner, functionsText, link: sign_url,
  });
  return okRes(res, { contract_id: req.params.contractId, sign_url, sent: s.sent, reason: s.reason, wamid: s.wamid });
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
