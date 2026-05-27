// src/api/admin/waitlist.js
// GET  /api/v2/admin/waitlist          — list all signups, newest first
// PATCH /api/v2/admin/waitlist/:id     — update status (new → contacted → onboarded → rejected)
// DELETE /api/v2/admin/waitlist/:id    — remove a signup

'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');

router.use(requireAdmin);

// GET /api/v2/admin/waitlist?kind=dreamer|maker&status=new|contacted|onboarded|rejected
router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { kind, status } = req.query;

  let q = supabase
    .from('waitlist_signups')
    .select('*')
    .order('created_at', { ascending: false });

  if (kind)   q = q.eq('kind', kind);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, signups: data });
});

// PATCH /api/v2/admin/waitlist/:id — { status, notes }
router.patch('/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;
  const { status, notes } = req.body;

  const patch = {};
  if (status) patch.status = status;
  if (notes  !== undefined) patch.notes = notes;

  const { data, error } = await supabase
    .from('waitlist_signups')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, signup: data });
});

// DELETE /api/v2/admin/waitlist/:id
router.delete('/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;
  const { error } = await supabase.from('waitlist_signups').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

module.exports = router;
