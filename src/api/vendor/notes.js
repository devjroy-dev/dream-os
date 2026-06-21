// src/api/vendor/notes.js
// GET    /api/v2/vendor/notes          — list the owner's notes-to-self (newest first)
// POST   /api/v2/vendor/notes          — create (owner's hand, direct write, bypasses the agents)
// DELETE /api/v2/vendor/notes/:noteId  — hard delete (the owner's only way to clear a note)
//
// The owner_notes scratchpad ("note to self" / "just do it"): written directly by the owner,
// bypassing Harvey and Donna. Donna has read-only vision of it elsewhere (the chat door
// surfaces open notes into her context + donna_find scope); these endpoints are the owner's
// own create / list / delete. No prestige gate — every vendor has a scratchpad. Hard delete:
// a note lives until the owner removes it (no folded/handled state).
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const mw = [requireAuth, resolveVendor()];

// GET — list (newest first)
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('owner_notes')
    .select('id, body, binder_id, created_at')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { notes: data || [] });
}));

// POST — create (direct write; the owner's raw hand)
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { body, binder_id } = req.body || {};
  if (!body || !String(body).trim()) return errRes(res, 400, 'body is required.');

  const { data, error } = await supabase
    .from('owner_notes')
    .insert({
      vendor_id: req.vendor.id,
      body:      String(body).trim(),
      binder_id: binder_id || null,
    })
    .select('id, body, binder_id, created_at')
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { note: data });
}));

// DELETE — hard delete (vendor-scoped; the owner's note is the owner's to remove)
router.delete('/:noteId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('owner_notes')
    .delete()
    .eq('id', req.params.noteId)
    .eq('vendor_id', req.vendor.id)
    .select('id')
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Note not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { deleted: true });
}));

module.exports = router;
