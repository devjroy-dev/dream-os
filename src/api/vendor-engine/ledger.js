'use strict';
// src/api/vendor-engine/ledger.js
// Vendor Suit, Phase 3-B — engine-backed flat ledger read.
//   GET /api/v2/vendor-e/binders/:vendorId           live ledger (hidden=false)
//       ?include_hidden=true                          also archived binders
// Mirror of src/api/vendor/binderRead.js, source swapped to engine.records
// (req.agentId). Same shape: { ok, count, binders }.
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');

const RECORD_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, note, followup_on, followup_note, repeat_every, ' +
  'doc_ref, phone, reason_for_action, hidden, hidden_at, created_at, updated_at';

router.get('/:vendorId',
  requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(),
  async (req, res) => {
    const eng     = req.app.locals.supabase.schema('engine');
    const agentId = req.agentId;
    const includeHidden = req.query.include_hidden === 'true' || req.query.include_hidden === '1';

    let q = eng.from('records')
      .select(RECORD_SELECT)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    if (!includeHidden) q = q.eq('hidden', false);

    const { data, error } = await q;
    if (error) {
      console.error('[GET /vendor-e/binders] read failed:', error.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }
    const binders = data || [];
    return res.json({ ok: true, count: binders.length, binders });
  });

module.exports = router;
