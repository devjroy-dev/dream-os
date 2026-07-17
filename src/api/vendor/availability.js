// src/api/vendor/availability.js
// Vendor availability blocking — new resource (Block 1a).
//   GET    /api/v2/vendor/availability/:vendorId  — list blocked dates
//   POST   /api/v2/vendor/availability            — block a date
//   DELETE /api/v2/vendor/availability/:blockId   — unblock
// Auth: vendor JWT.
//
// ── TDW_04 B1 — THE CONVERGENCE (C1, migration 0077) ────────────────────────
// Blocks are no longer their own table. They are public.events, kind='blocked'.
// The wire is frozen: {ok, blocks:[{id, blocked_date, reason, created_at}], total},
// keyed on blocked_date (the PWA reads it at app/vendor/calendar/page.tsx:96).
// Zero FE change. The mapping lives once, in lib/vendor/availability.js.
//
// PLANE: `req.app.locals.supabase` is the PUBLIC-default client, so every read and
// write below — and everything this file injects into the lib — is public.events,
// THE CALENDAR. engine.events is an unrelated agent audit trail (F-04.30/F-04.31)
// and is unreachable from here.
//
// THE DELETE DOOR'S AUTH CHANGED, AND IT IS THE MOST DANGEROUS LINE IN B1.
// It used to read `via: 'vendor_availability'` — the table 0077 drops. That table
// WAS the type guard: it held blocks and only blocks, so ownership resolution
// could not confuse a block with a booking. public.events holds both. So
// `via: 'events'` alone would let DELETE /availability/<a booking's event id>
// pass authorization and destroy a real booking through the unblock door.
// TWO LOCKS, ruled (Q-B1-4/5, defense in depth):
//   LOCK 2 (here): after resolveVendor proves OWNERSHIP, assert the row is a BLOCK.
//                  404 on mismatch, never 403 — a booking id at the unblock door
//                  must read as "no such block", never confirm a booking exists at
//                  a door not entitled to know.
//   LOCK 1 (lib):  unblockDate's `.eq('kind','blocked')` — the query cannot touch a
//                  non-block even if this check were somehow bypassed.
// resolveVendor selects only `id, vendor_id` (resolveVendor.js:84) and cannot carry
// kind; widening it would break its other `via` tables (leads has no kind), so the
// assertion is a local read here rather than a change to shared middleware.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { blockDate, unblockDate, listBlocks } = require('../../lib/vendor/availability');

// ─── GET /api/v2/vendor/availability/:vendorId ─────────────────────────
//
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD (both optional)
// Auth: resolveVendor mode B.

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const from     = req.query.from || null;
  const to       = req.query.to   || null;

  const result = await listBlocks(supabase, vendor.id, { from, to });
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, { blocks: result.blocks, total: result.total });
}));

// ─── POST /api/v2/vendor/availability ──────────────────────────────────
//
// Block a date. 409 if already blocked.
// Auth: resolveVendor mode A.

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};

  const result = await blockDate(supabase, vendor.id, body.blocked_date, body.reason || null, body.slot || null);
  if (!result.ok && result.code === 'ALREADY_BLOCKED') return errRes(res, 409, result.error, result.code);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { block: result.block });
}));

// ─── DELETE /api/v2/vendor/availability/:blockId ───────────────────────
//
// Unblock by block UUID.
// Auth: resolveVendor mode C via vendor_availability table.

router.delete('/:blockId', requireAuth, resolveVendor({ paramName: 'blockId', via: 'events' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const blockId  = req.params.blockId;

  // LOCK 2 — the kind assertion. resolveVendor has proven this row is THIS vendor's;
  // it has not proven it is a BLOCK. Anything that is not a live block reads as
  // "Block not found." (404), including a booking, a cancelled row, or an
  // already-unblocked one. Never 403: this door does not confirm what else exists.
  const { data: ev, error: kindErr } = await supabase
    .from('events')
    .select('id, kind, deleted_at')
    .eq('id', blockId)
    .eq('vendor_id', vendor.id)
    .maybeSingle();
  if (kindErr) return errRes(res, 500, kindErr.message);
  if (!ev || ev.kind !== 'blocked' || ev.deleted_at) return errRes(res, 404, 'Block not found.');

  const result = await unblockDate(supabase, vendor.id, { block_id: blockId });
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { deleted: true });
}));

module.exports = router;
