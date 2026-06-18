// src/api/vendor/binderRead.js
// Binder READ endpoint — the flat ledger for the Studio List + hood-lift.
//
//   GET /api/v2/vendor/binders/:vendorId          -> live ledger (hidden=false), newest first
//       ?include_hidden=true                      -> also return archived binders
//
// Reads are DIRECT (scoped to vendor_id), NOT through Kriya: the through-Kriya
// discipline guards MUTATIONS (ground-truth-before-write, the money door); a read
// has nothing to mutate. Ownership is enforced twice over — resolveVendor asserts
// the JWT owns :vendorId, and every query is .eq('vendor_id') scoped — so a vendor
// can never read another's ledger. Same full binder shape as cabinet.js, but the
// ledger is returned FLAT, where /cabinet returns the same binders pre-sliced.
//
// The tool vocabulary (kriya_*) is never exposed here — a read needs no tool; it
// is a plain scoped select. The display firewall is unaffected.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

// Full binder shape (+ hidden/hidden_at so the List can badge archived rows).
const BINDER_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, note, followup_on, followup_note, repeat_every, ' +
  'doc_ref, phone, reason_for_action, hidden, hidden_at, created_at, updated_at';

const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];

// GET /:vendorId — the raw ledger, newest first.
router.get('/:vendorId', ...auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.vendor.id;
  const includeHidden = req.query.include_hidden === 'true' || req.query.include_hidden === '1';

  let q = supabase.from('binders')
    .select(BINDER_SELECT)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  if (!includeHidden) q = q.eq('hidden', false);

  const { data, error } = await q;
  if (error) {
    console.error('[GET /vendor/binders] read failed:', error.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }
  const binders = data || [];
  return res.json({ ok: true, count: binders.length, binders });
});

module.exports = router;
