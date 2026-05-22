// src/api/admin/couples.js
// Admin couple management — list, create, tier, revoke.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const VALID_TIERS = ['basic', 'gold', 'platinum'];

// ─── GET /api/v2/admin/couples ──────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('couples')
    .select(`
      id, wedding_date, wedding_city, planning_state, created_at,
      users!inner(name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  const coupleIds = (data || []).map(c => c.id);

  const [museSavesRes, circleMembersRes] = await Promise.all([
    supabase.from('muse_saves').select('couple_id').in('couple_id', coupleIds),
    supabase.from('circle_members').select('couple_id, status').in('couple_id', coupleIds).eq('status', 'active'),
  ]);

  const museCounts   = {};
  const circleCounts = {};
  for (const row of (museSavesRes.data || []))    museCounts[row.couple_id]   = (museCounts[row.couple_id]   || 0) + 1;
  for (const row of (circleMembersRes.data || [])) circleCounts[row.couple_id] = (circleCounts[row.couple_id] || 0) + 1;

  const couples = (data || []).map(c => ({
    id:             c.id,
    name:           c.users?.name || 'Unknown',
    phone:          c.users?.phone,
    wedding_date:   c.wedding_date,
    wedding_city:   c.wedding_city,
    planning_state: c.planning_state,
    muse_saves:     museCounts[c.id]   || 0,
    circle_members: circleCounts[c.id] || 0,
    created_at:     c.created_at,
  }));

  return okRes(res, { couples, total: couples.length });
}));

// ─── POST /api/v2/admin/couples/create ──────────────────────────────────
router.post('/create', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, phone } = req.body;

  if (!phone || !name) return errRes(res, 400, 'name and phone are required.');

  const { data: user, error: userErr } = await supabase
    .from('users')
    .upsert({ phone: phone.trim(), name: name.trim() }, { onConflict: 'phone' })
    .select('id')
    .single();

  if (userErr) return errRes(res, 400, userErr.message);

  const { error: coupleErr } = await supabase
    .from('couples')
    .insert({ user_id: user.id, planning_state: 'browsing' });

  if (coupleErr) return errRes(res, 400, coupleErr.message);

  return okRes(res, { created: true });
}));

// ─── PATCH /api/v2/admin/couples/:id/tier ───────────────────────────────
router.patch('/:coupleId/tier', requireAdmin, asyncHandler(async (req, res) => {
  const { tier } = req.body;
  if (!VALID_TIERS.includes(tier)) return errRes(res, 400, `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}.`);
  return okRes(res, { tier, note: 'Couple tiers not yet enforced in DB.' });
}));

// ─── PATCH /api/v2/admin/couples/:id/revoke ─────────────────────────────
router.patch('/:coupleId/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('couples')
    .update({ planning_state: 'browsing' })
    .eq('id', req.params.coupleId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { revoked: true });
}));

module.exports = router;
