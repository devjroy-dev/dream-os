// src/api/vendor/studio/messages.js
// GET   /api/v2/vendor/studio/messages          — list (pinned first)
// POST  /api/v2/vendor/studio/messages          — create
// PATCH /api/v2/vendor/studio/messages/:id/pin  — toggle pinned
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET — list, pinned first then newest
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_messages')
    .select('*')
    .eq('vendor_id', req.vendor.id)
    .order('pinned',     { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { messages: data || [] });
}));

// POST — create
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { body, pinned, sent_to_count, linked_event_id } = req.body || {};
  if (!body || !body.trim()) return errRes(res, 400, 'body is required.');
  const { data, error } = await supabase
    .from('team_messages')
    .insert({
      vendor_id:       req.vendor.id,
      body:            body.trim(),
      pinned:          pinned         === true,
      sent_to_count:   sent_to_count  || null,
      linked_event_id: linked_event_id || null,
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { message: data });
}));

// PATCH /:id/pin — toggle pinned
router.patch('/:messageId/pin', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Fetch current state
  const { data: existing, error: fetchErr } = await supabase
    .from('team_messages')
    .select('id, pinned')
    .eq('id', req.params.messageId)
    .eq('vendor_id', req.vendor.id)
    .single();
  if (fetchErr) {
    if (fetchErr.code === 'PGRST116') return errRes(res, 404, 'Message not found.');
    return errRes(res, 500, fetchErr.message);
  }

  const { data, error } = await supabase
    .from('team_messages')
    .update({ pinned: !existing.pinned })
    .eq('id', req.params.messageId)
    .eq('vendor_id', req.vendor.id)
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { message: data });
}));

module.exports = router;
