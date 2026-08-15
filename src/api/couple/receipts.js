// src/api/couple/receipts.js
// GET /api/v2/couple/receipts/:coupleId
// Returns receipt vault (couple_receipts table).
// Query: ?booking_id=  ?limit=50
// Requires couple auth (applied in core.js).

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// TDW_15 P2 (F-15.11, R-34.35/.37): the row shape moved to its one home. The
// literal that stood here had two byte-identical twins — this file's own GET at
// the `.select()` below, and `couple/expenses.js`. All three now read this.
const { RECEIPT_COLUMNS } = require('./receiptColumns');

// Path-parameter shape guard. Same literal as `couple/bookings.js:94` — a
// regex, not a list, so no taxonomy question rides on it.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── TDW_15 · P1 · β1 — THE TYPED FIELDS HAVE ONE HOME, AND THAT IS NEW ──────
// The image door files a receipt that ALSO carries an amount and a vendor (she
// types them; R-34.7 refused OCR). That is the same five fields the typed POST
// below already coerces, and a second copy of these expressions would be two
// homes for one row shape — the exact disease that lets two doors drift into
// disagreeing about what `tags` means.
//
// SO THE COERCION IS EXTRACTED, AND THE EXTRACTION IS BYTE-FAITHFUL. Every
// expression here is lifted UNCHANGED from the typed POST as it stood at
// `cbf801f`, including the `tags` fallback's oddity — `notes` becoming a
// single-element array. That looks like a bug and it is NOT this delivery's to
// cure: it is live shipped behaviour, the typed door's callers may depend on
// it, and a UI sitting that quietly changes a persistence rule while extracting
// it is how a refactor becomes an incident. The oddity is named here and
// pinned by a bench cell so the next hand meets it deliberately.
function buildReceiptRow({ couple_id, vendor_name, amount, description, receipt_date, tags, notes }) {
  return {
    couple_id,
    vendor_name:  vendor_name  ? String(vendor_name).trim().slice(0,200)  : null,
    amount:       amount       ? parseInt(amount, 10)                      : null,
    description:  description  ? String(description).trim().slice(0,500)  : null,
    receipt_date: receipt_date || null,
    // ── F-15.6 · THE NULL THIS COLUMN CANNOT TAKE ──────────────────────────
    // `[]`, NEVER `null`. `couple_receipts.tags` is `text[] NOT NULL default
    // ARRAY[]::text[]` (PUBLIC_SCHEMA.md:287, column 9), and an EXPLICIT null
    // does not fall back to a default — it violates the constraint and the
    // insert throws. Every receipt filed with no tag and no note hit that.
    //
    // THIS FILE'S TYPED POST HAS CARRIED THE NULL SINCE BIRTH AND COULD NEVER
    // HAVE WRITTEN A ROW. Nobody noticed because nobody had ever used it: the
    // vault stood at ZERO receipts on the day this was found, so the door's
    // whole history is consistent with it having always been broken.
    //
    // THE ESTATE HAD THE RIGHT EXPRESSION EIGHTEEN INCHES AWAY. Three writers
    // reach this table and only this one was wrong:
    //   · `couple/expenses.js:63`  tags: ... : []        — correct, always
    //   · `brideEngine.js` save_receipt — OMITS the column, so the default
    //     fires; that is why the WhatsApp path has always worked
    //   · this one                  tags: ... : null      — could not write
    //
    // AND THE PRESERVATION ARGUMENT IS OVERTURNED BY ITS OWN EVIDENCE. ZIP 1
    // extracted this expression byte-faithfully and PINNED the null with a
    // bench cell, on the reasoning that a UI sitting must not move a live
    // persistence rule. The reasoning was right and the fact was wrong: the
    // rule was never live. A behaviour with zero successful executions is not
    // shipped behaviour, it is a defect with a long tenure. The founder's thumb
    // settled in one tap what the derivation could not.
    tags:         Array.isArray(tags) ? tags : (notes ? [notes] : []),
  };
}

router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const booking_id = req.query.booking_id || null;
  const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  let query = supabase
    .from('couple_receipts')
    .select(RECEIPT_COLUMNS)
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (booking_id) query = query.eq('booking_id', booking_id);

  const { data: receipts, error } = await query;
  if (error) {
    console.error('[GET /couple/receipts] query error:', error.message);
    return errRes(res, 500, 'Could not fetch receipts.');
  }

  return okRes(res, { receipts: receipts || [] });
}));


// POST /:coupleId — create receipt (expense log from PWA)
router.post('/:coupleId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  if (req.params.coupleId !== couple_id) return errRes(res, 403, 'Forbidden.');

  const { data, error } = await supabase
    .from('couple_receipts')
    // `couple_id` LAST, deliberately: spread order is a security property here.
    // With the body spread after it, a client sending `couple_id` in its own
    // payload would overwrite the authenticated one and write into a stranger's
    // vault. Caught in this delivery's own authoring; pinned by a bench cell.
    .insert(buildReceiptRow({ ...(req.body || {}), couple_id }))
    .select('id, amount, vendor_name, description, receipt_date, image_url, tags, created_at')
    .single();

  if (error) {
    console.error('[POST /couple/receipts] insert error:', error.message);
    return errRes(res, 500, 'Could not create receipt.');
  }
  return okRes(res, { expense: data });
}));

// ── POST /:coupleId/image — TDW_15 · P1 · β1 (R-34.7) ──────────────────────
// FILE A RECEIPT PHOTO FROM THE APP. Body (JSON):
//   { image_base64: string, mime: 'image/*',
//     vendor_name?, amount?, description?, receipt_date?, tags?, notes? }
//
// ── THE GAP THIS CLOSES, STATED AS IT WAS DERIVED ──────────────────────────
// Before this door, NO HTTP path could write `couple_receipts.image_url`. The
// typed POST above omits the column; `couple/expenses.js` sets it `null`
// explicitly. The ONLY writer in the estate was `src/agent/brideEngine.js`'s
// `save_receipt` executor — a protected WhatsApp engine (protocol §8, R-31.2),
// reachable only by forwarding a photo to Mira. So the bride could type an
// expense in her app and could not file the receipt for it. That is the
// parity matrix's G-3, image half.
//
// ── THE ROUTE ORDERING IS SAFE AND THE REASON IS STATED ────────────────────
// Express matches in declaration order, and this path is TWO segments while
// `POST /:coupleId` above is one — a single-segment pattern cannot swallow it.
// It is sited above `DELETE /:receiptId` only for readability; that is a
// different verb and could not have collided either way.
//
// ── WHY THE BODY LIMIT IS HERE AND NOT AT THE MOUNT ────────────────────────
// `core.js:28` mounts this router with no explicit limit, so it inherits the
// app default — far below a phone photo. Muse's mount raises the whole router
// to 12mb (`core.js:19`); `pages.js:73` instead scopes a limit to ONE route.
// The route-scoped form is taken, because raising the ceiling for GET and
// DELETE buys nothing and widens what an unauthenticated body can cost.
router.post('/:coupleId/image', express.json({ limit: '12mb' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  if (req.params.coupleId !== couple_id) return errRes(res, 403, 'Forbidden.');

  const { image_base64, mime, mime_type } = req.body || {};
  const mimeType = mime || mime_type;   // the muse door accepts either; match it

  if (!image_base64 || typeof image_base64 !== 'string')
    return errRes(res, 400, 'image_base64 is required.');
  if (!mimeType || typeof mimeType !== 'string' || !mimeType.startsWith('image/'))
    return errRes(res, 400, 'mime must be an image content type.');

  // Strip any data-URI prefix, exactly as the muse door does.
  const clean = image_base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  let buffer;
  try { buffer = Buffer.from(clean, 'base64'); }
  catch (e) { return errRes(res, 400, 'image_base64 is not valid base64.'); }
  if (buffer.length === 0) return errRes(res, 400, 'image_base64 decoded to empty.');

  // UPLOAD FIRST, INSERT SECOND — and the order is the ruling, not a habit.
  // A row written before the upload would hold a null or a guessed URL and the
  // vault would render a broken frame; a failed upload here writes NOTHING and
  // the bride simply retries. The reverse leaves debris she cannot delete
  // without a row to delete it by.
  const { uploadBufferToCloudinary } = require('../../lib/imagePipeline');
  let uploaded;
  try {
    uploaded = await uploadBufferToCloudinary(buffer, couple_id, mimeType);
  } catch (err) {
    console.error('[POST /couple/receipts/:coupleId/image] upload error:', err.message);
    return errRes(res, 500, 'Could not upload that photo.');
  }
  if (!uploaded || !uploaded.secure_url)
    return errRes(res, 500, 'Could not upload that photo.');

  const row = buildReceiptRow({ ...(req.body || {}), couple_id });
  row.image_url = uploaded.secure_url;

  const { data, error } = await supabase
    .from('couple_receipts')
    .insert(row)
    .select(RECEIPT_COLUMNS)
    .single();

  if (error) {
    console.error('[POST /couple/receipts/:coupleId/image] insert error:', error.message);
    return errRes(res, 500, 'Could not save that receipt.');
  }
  return okRes(res, { receipt: data });
}));

// DELETE /:receiptId — delete receipt
// ── PATCH /:receiptId — FILE IT (TDW_15 P2, the envelope tag) ───────────────
// The ONLY field this door writes is `envelope_id`. It lives here and not on
// the envelopes router because it mutates a RECEIPT, and a receipt mutation on
// an envelope route is a second home for this row's write path.
// `envelope_id: null` is a legal body — that is UNFILING, and it is how a
// receipt returns to the tray by her hand rather than by a cascade.
router.patch('/:receiptId', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { receiptId }  = req.params;

  if (!UUID_RE.test(receiptId)) return errRes(res, 400, 'Invalid receipt id.');

  const body = req.body || {};
  if (!Object.prototype.hasOwnProperty.call(body, 'envelope_id')) {
    return errRes(res, 400, 'envelope_id is required.');
  }

  const envelope_id = body.envelope_id;
  if (envelope_id !== null && !UUID_RE.test(String(envelope_id))) {
    return errRes(res, 400, 'envelope_id must be an envelope id or null.');
  }

  // Both scopes are the JWT's. The FK guarantees the envelope exists; the
  // couple_id equality guarantees it is HERS, because a foreign key alone would
  // happily accept another bride's envelope id.
  if (envelope_id !== null) {
    const { data: envelope, error: lookupError } = await supabase
      .from('budget_envelopes')
      .select('id')
      .eq('id', envelope_id)
      .eq('couple_id', couple_id)
      .maybeSingle();
    if (lookupError) {
      console.error('[PATCH /couple/receipts/:receiptId] envelope lookup error:', lookupError.message);
      return errRes(res, 500, 'Could not file that receipt.');
    }
    if (!envelope) return errRes(res, 404, 'Envelope not found.');
  }

  const { data, error } = await supabase
    .from('couple_receipts')
    .update({ envelope_id })
    .eq('id', receiptId)
    .eq('couple_id', couple_id)
    .select(RECEIPT_COLUMNS)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Receipt not found.');
    console.error('[PATCH /couple/receipts/:receiptId] update error:', error.message);
    return errRes(res, 500, 'Could not file that receipt.');
  }

  return okRes(res, { receipt: data });
}));

router.delete('/:receiptId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data, error } = await supabase
    .from('couple_receipts')
    .delete()
    .eq('id', req.params.receiptId)
    .eq('couple_id', couple_id)
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Receipt not found.');
    console.error('[DELETE /couple/receipts] error:', error.message);
    return errRes(res, 500, 'Could not delete receipt.');
  }
  return okRes(res, { deleted: data.id });
}));

module.exports = router;

// Exposed for unit-test reach-in only; production callers use the routes above.
// The estate's own precedent for this shape is `imagePipeline.js`'s export
// block, which carries the identical sentence. It is here because
// `buildReceiptRow` is a PURE coercion of shipped persistence rules, and a
// bench that only READS those expressions cannot tell an extraction that
// preserved them from one that quietly changed what `tags` means.
module.exports.__buildReceiptRow = buildReceiptRow;
