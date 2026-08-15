// src/api/couple/envelopes.js
// ─────────────────────────────────────────────────────────────────────────────
// TDW_15 · P2 (R-4) — HER BUDGET ENVELOPES.
//
//   GET    /api/v2/couple/envelopes/categories        the canonical eleven
//   GET    /api/v2/couple/envelopes/:coupleId         envelopes + spend
//   GET    /api/v2/couple/envelopes/:coupleId/unfiled the tray
//   POST   /api/v2/couple/envelopes/:coupleId         create
//   PATCH  /api/v2/couple/envelopes/:envelopeId       rename / re-ceiling / sort
//   DELETE /api/v2/couple/envelopes/:envelopeId       delete (receipts UNFILE)
//
// Requires couple auth (applied in core.js). Every door scopes by the JWT's own
// `couple_id` and never by a body or query value.
//
// ── THE `allowed[]` DOOR IS A READ, AND IT IS NOT A CURE (R-34.34) ──────────
// `VENDOR_CATEGORIES` is imported from `src/agent/categories.js` — the ONE home.
// It is not re-declared here. `src/api/couple/bookings.js:87` re-declares a
// (stale) allowlist inline; that is F-15.10's second limb and repeating the
// shape here would make a two-homes defect a three-homes one.
//
// THIS DOOR DOES NOT CURE F-15.10. Her BOOKINGS remain constrained by
// `couple_bookings_category_check`, which carries the pre-0123 eleven —
// photographer · videographer · mua · designer · venue · caterer · decor ·
// florist · music · planner · other — of which only `designer`, `decor` and
// `other` agree with the canonical set. So an envelope named `jewellery` cannot
// match a booking today, because she cannot categorise a booking as `jewellery`
// at all. Reconciliation lands when F-15.10's micro moves that CHECK and
// backfills live rows. Until then her envelope names are hers alone. No reader
// should mistake this door for that cure.
//
// The picker iterates THIS RESPONSE, never `Object.keys(CAT_LABEL)` — the label
// map is not a taxonomy, and a token the server adds later must render through
// `labelFor`'s fallback instead of silently vanishing from her picker.
//
// ── TWO EMPTINESSES, NEVER CONFLATED (R-34.22) ──────────────────────────────
// `envelope_id IS NULL` = UNFILED (in the tray). `amount IS NULL` = UNTYPED (a
// photo receipt, F-15.9). A receipt can be FILED and contribute ZERO to its
// envelope's spend. `spent` below is therefore COALESCE-summed over typed
// amounts only, and it is an honest floor rather than a complete figure — the
// hairline that renders it carries no words for exactly this reason.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { RECEIPT_COLUMNS } = require('./receiptColumns');
const { VENDOR_CATEGORIES } = require('../../agent/categories');

const ENVELOPE_COLUMNS = 'id, name, amount_inr, sort, created_at';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// `name` is hers: free text, or one of the eleven she picked. The DB holds it
// NOT NULL and nothing else, so the door is what refuses an empty one.
function cleanName(v) {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t || t.length > 80) return null;
  return t;
}

// `amount_inr` is a ceiling in WHOLE RUPEES and the column is `integer` with
// CHECK (amount_inr >= 0) — F-a struck the spec's `numeric` so one money type
// rules this plane. A non-integer or negative body value is refused here rather
// than left for the CHECK to reject with a message she cannot read.
function cleanAmount(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

// ── GET /categories — MUST precede /:coupleId or the param route swallows it ──
router.get('/categories', asyncHandler(async (_req, res) => {
  return okRes(res, { allowed: VENDOR_CATEGORIES });
}));

// ── GET /:coupleId — her envelopes, each with its spend floor ────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const { data: envelopes, error } = await supabase
    .from('budget_envelopes')
    .select(ENVELOPE_COLUMNS)
    .eq('couple_id', couple_id)
    .order('sort',       { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /couple/envelopes] query error:', error.message);
    return errRes(res, 500, 'Could not fetch envelopes.');
  }

  // The spend aggregate is computed HERE rather than by an RPC, because the
  // door was ruled read-only and additive: no migration, no function, no CHECK.
  // A bride's receipt count is small enough that one scoped read is honest.
  const { data: filed, error: sumError } = await supabase
    .from('couple_receipts')
    .select('envelope_id, amount')
    .eq('couple_id', couple_id)
    .not('envelope_id', 'is', null);

  if (sumError) {
    console.error('[GET /couple/envelopes] spend query error:', sumError.message);
    return errRes(res, 500, 'Could not fetch envelopes.');
  }

  const spent = new Map();
  for (const r of filed || []) {
    // R-34.22: a FILED receipt with a NULL amount contributes zero. It is not
    // skipped as though unfiled — it is counted as a receipt worth nothing yet.
    const prev = spent.get(r.envelope_id) || 0;
    spent.set(r.envelope_id, prev + (Number.isFinite(r.amount) ? r.amount : 0));
  }

  const rows = (envelopes || []).map(e => ({ ...e, spent: spent.get(e.id) || 0 }));
  return okRes(res, { envelopes: rows });
}));

// ── GET /:coupleId/unfiled — THE TRAY ────────────────────────────────────────
// This is the reader that `couple_receipts_unfiled_idx` exists for. It is a
// door and not a client-side filter on the receipt list, because that list is
// paginated and a tray that silently truncates is worse than no tray.
router.get('/:coupleId/unfiled', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const { data: receipts, error } = await supabase
    .from('couple_receipts')
    .select(RECEIPT_COLUMNS)
    .eq('couple_id', couple_id)
    .is('envelope_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /couple/envelopes/:coupleId/unfiled] query error:', error.message);
    return errRes(res, 500, 'Could not fetch unfiled receipts.');
  }

  return okRes(res, { receipts: receipts || [] });
}));

// ── POST /:coupleId — create ────────────────────────────────────────────────
router.post('/:coupleId', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const name = cleanName((req.body || {}).name);
  if (!name) return errRes(res, 400, 'name is required.');

  const amount_inr = cleanAmount((req.body || {}).amount_inr);
  if (amount_inr === null) return errRes(res, 400, 'amount_inr must be a whole number of rupees, zero or more.');

  const sort = cleanAmount((req.body || {}).sort);
  if (sort === null) return errRes(res, 400, 'sort must be a whole number, zero or more.');

  const { data, error } = await supabase
    .from('budget_envelopes')
    .insert({ couple_id, name, amount_inr, sort })
    .select(ENVELOPE_COLUMNS)
    .single();

  if (error) {
    console.error('[POST /couple/envelopes] insert error:', error.message);
    return errRes(res, 500, 'Could not create that envelope.');
  }

  return okRes(res, { envelope: { ...data, spent: 0 } });
}));

// ── PATCH /:envelopeId — rename, re-ceiling, reorder ────────────────────────
router.patch('/:envelopeId', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { envelopeId } = req.params;

  if (!UUID_RE.test(envelopeId)) return errRes(res, 400, 'Invalid envelope id.');

  const body   = req.body || {};
  const patch  = {};

  if (body.name !== undefined) {
    const name = cleanName(body.name);
    if (!name) return errRes(res, 400, 'name cannot be empty.');
    patch.name = name;
  }
  if (body.amount_inr !== undefined) {
    const amount_inr = cleanAmount(body.amount_inr);
    if (amount_inr === null) return errRes(res, 400, 'amount_inr must be a whole number of rupees, zero or more.');
    patch.amount_inr = amount_inr;
  }
  if (body.sort !== undefined) {
    const sort = cleanAmount(body.sort);
    if (sort === null) return errRes(res, 400, 'sort must be a whole number, zero or more.');
    patch.sort = sort;
  }

  if (Object.keys(patch).length === 0) return errRes(res, 400, 'Nothing to update.');

  // Scoped by couple_id as well as id — the JWT decides which rows exist, never
  // the path parameter.
  const { data, error } = await supabase
    .from('budget_envelopes')
    .update(patch)
    .eq('id', envelopeId)
    .eq('couple_id', couple_id)
    .select(ENVELOPE_COLUMNS)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Envelope not found.');
    console.error('[PATCH /couple/envelopes/:envelopeId] update error:', error.message);
    return errRes(res, 500, 'Could not update that envelope.');
  }

  return okRes(res, { envelope: data });
}));

// ── DELETE /:envelopeId — the receipts UNFILE, they do not die ──────────────
// F-b: `couple_receipts_envelope_id_fkey` is ON DELETE SET NULL, so her filed
// receipts fall back into the tray. On a plane with real brides that is the
// whole ruling — deleting a bucket must never delete her records.
router.delete('/:envelopeId', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { envelopeId } = req.params;

  if (!UUID_RE.test(envelopeId)) return errRes(res, 400, 'Invalid envelope id.');

  const { error } = await supabase
    .from('budget_envelopes')
    .delete()
    .eq('id', envelopeId)
    .eq('couple_id', couple_id);

  if (error) {
    console.error('[DELETE /couple/envelopes/:envelopeId] delete error:', error.message);
    return errRes(res, 500, 'Could not delete that envelope.');
  }

  return okRes(res, { deleted: true });
}));

module.exports = router;
