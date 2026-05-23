#!/usr/bin/env python3
"""
Phase 1 — Admin Block backend foundation.
Run from: /workspaces/dream-os

What this does:
  1. Patches requireAdmin to accept x-admin-password header
  2. Creates src/api/admin/vendors.js
  3. Creates src/api/admin/couples.js
  4. Creates src/api/admin/hotDates.js
  5. Patches router.js to mount new routers
  6. Creates db/migrations/0044_discover_heroes.sql
  7. Deletes db/migrations/0043_taste_quiz.sql
"""

import os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  wrote  {rel}")

def patch(rel, old, new):
    path = os.path.join(ROOT, rel)
    with open(path) as f:
        src = f.read()
    count = src.count(old)
    assert count == 1, f"Anchor not found exactly once in {rel}: found {count}"
    with open(path, 'w') as f:
        f.write(src.replace(old, new))
    print(f"  patched {rel}")

def delete(rel):
    path = os.path.join(ROOT, rel)
    if os.path.exists(path):
        os.remove(path)
        print(f"  deleted {rel}")
    else:
        print(f"  skip (not found) {rel}")

# ── 1. requireAdmin ────────────────────────────────────────────────────────────
patch(
    'src/api/admin/requireAdmin.js',
    '''function requireAdmin(req, res, next) {
  const cookie = req.cookies?.dream_admin_session;
  if (!cookie) return res.status(401).json({ ok: false, error: 'Admin auth required.' });
  const expected = signSession(ADMIN_PASSWORD);
  if (cookie !== expected) return res.status(403).json({ ok: false, error: 'Forbidden.' });
  next();
}''',
    '''function requireAdmin(req, res, next) {
  // Accept either the session cookie (HTML admin panel) or x-admin-password header (dreamos-pwa REST calls).
  const header = req.headers['x-admin-password'];
  if (header) {
    if (header !== ADMIN_PASSWORD) return res.status(403).json({ ok: false, error: 'Forbidden.' });
    return next();
  }
  const cookie = req.cookies?.dream_admin_session;
  if (!cookie) return res.status(401).json({ ok: false, error: 'Admin auth required.' });
  const expected = signSession(ADMIN_PASSWORD);
  if (cookie !== expected) return res.status(403).json({ ok: false, error: 'Forbidden.' });
  next();
}'''
)

# ── 2. vendors.js ─────────────────────────────────────────────────────────────
write('src/api/admin/vendors.js', r'''// src/api/admin/vendors.js
// Admin vendor management — list, create, tier, approve, discover-eligible.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const VALID_TIERS = ['trial', 'essential', 'signature', 'prestige'];

// ─── GET /api/v2/admin/vendors ──────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('vendors')
    .select(`
      id, business_name, category, city, tier, status, founding_cohort,
      discover_eligible, discover_request_state, created_at,
      users!inner(name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  const vendors = (data || []).map(v => ({
    id:                     v.id,
    name:                   v.business_name || v.users?.name || 'Unnamed',
    category:               v.category,
    city:                   v.city,
    phone:                  v.users?.phone,
    tier:                   v.tier,
    status:                 v.status,
    founding_cohort:        v.founding_cohort || false,
    discover_eligible:      v.discover_eligible || false,
    discover_request_state: v.discover_request_state || 'not_requested',
    created_at:             v.created_at,
  }));

  return okRes(res, { vendors, total: vendors.length });
}));

// ─── POST /api/v2/admin/vendors/create ──────────────────────────────────
router.post('/create', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { business_name, phone, category, city, tier } = req.body;

  if (!phone) return errRes(res, 400, 'phone is required.');

  const { error: rpcError } = await supabase.rpc('invite_vendor', {
    p_phone: phone.trim(),
    p_name:  business_name?.trim() || 'Vendor',
  });
  if (rpcError) return errRes(res, 400, rpcError.message);

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone.trim())
    .single();

  if (user) {
    const patch = {};
    if (business_name) patch.business_name = business_name.trim();
    if (category)      patch.category      = category;
    if (city)          patch.city          = city;
    if (tier && VALID_TIERS.includes(tier)) patch.tier = tier;

    if (Object.keys(patch).length) {
      await supabase.from('vendors').update(patch).eq('user_id', user.id);
    }
  }

  return okRes(res, { created: true });
}));

// ─── PATCH /api/v2/admin/vendors/:id/tier ───────────────────────────────
router.patch('/:vendorId/tier', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { tier } = req.body;

  if (!VALID_TIERS.includes(tier)) return errRes(res, 400, `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}.`);

  const { error } = await supabase
    .from('vendors')
    .update({ tier })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { tier });
}));

// ─── PATCH /api/v2/admin/vendors/:id/approve ────────────────────────────
router.patch('/:vendorId/approve', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendor, error: fetchErr } = await supabase
    .from('vendors')
    .select('status')
    .eq('id', req.params.vendorId)
    .single();

  if (fetchErr) return errRes(res, 404, 'Vendor not found.');

  const newStatus = vendor.status === 'active' ? 'paused' : 'active';
  const { error } = await supabase
    .from('vendors')
    .update({ status: newStatus })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { status: newStatus });
}));

// ─── PATCH /api/v2/admin/vendors/:id/discover-eligible ──────────────────
router.patch('/:vendorId/discover-eligible', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendor, error: fetchErr } = await supabase
    .from('vendors')
    .select('discover_eligible')
    .eq('id', req.params.vendorId)
    .single();

  if (fetchErr) return errRes(res, 404, 'Vendor not found.');

  const newVal = !vendor.discover_eligible;
  const { error } = await supabase
    .from('vendors')
    .update({ discover_eligible: newVal })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { discover_eligible: newVal });
}));

// ─── PATCH /api/v2/admin/vendors/:id/dreamai ────────────────────────────
router.patch('/:vendorId/dreamai', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { access } = req.body;

  const { error } = await supabase
    .from('vendors')
    .update({ briefing_enabled: !!access })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { dreamai_access: !!access });
}));

// ─── PATCH /api/v2/admin/vendors/:id/revoke ─────────────────────────────
router.patch('/:vendorId/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('vendors')
    .update({ status: 'paused', discover_eligible: false })
    .eq('id', req.params.vendorId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { revoked: true });
}));

module.exports = router;
''')

# ── 3. couples.js ─────────────────────────────────────────────────────────────
write('src/api/admin/couples.js', r'''// src/api/admin/couples.js
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
''')

# ── 4. hotDates.js ────────────────────────────────────────────────────────────
write('src/api/admin/hotDates.js', r'''// src/api/admin/hotDates.js
// Admin hot dates management — add, edit, remove Muhurat dates.
// Public GET lives at src/api/public/hotDates.js mounted at /api/v2/hot-dates.
// These admin endpoints are mounted at /api/v2/admin/hot-dates.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ─── GET /api/v2/admin/hot-dates ────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('hot_dates')
    .select('id, date, note, region')
    .order('date', { ascending: true });

  if (error) return errRes(res, 500, error.message);

  const dates = (data || []).map(r => ({
    id:     r.id,
    date:   r.date,
    label:  r.note   || null,
    region: r.region || 'All India',
  }));

  return okRes(res, { dates, total: dates.length });
}));

// ─── POST /api/v2/admin/hot-dates ───────────────────────────────────────
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { date, note, region } = req.body;

  if (!date) return errRes(res, 400, 'date is required (YYYY-MM-DD).');

  const { data, error } = await supabase
    .from('hot_dates')
    .insert({ date, note: note || null, region: region || 'All India' })
    .select('id, date, note, region')
    .single();

  if (error) return errRes(res, 500, error.message);

  return okRes(res, {
    date: { id: data.id, date: data.date, label: data.note, region: data.region },
  });
}));

// ─── PATCH /api/v2/admin/hot-dates/:id ──────────────────────────────────
router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { date, note, region } = req.body;

  const patch = {};
  if (date   !== undefined) patch.date   = date;
  if (note   !== undefined) patch.note   = note;
  if (region !== undefined) patch.region = region;

  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');

  const { error } = await supabase
    .from('hot_dates')
    .update(patch)
    .eq('id', req.params.id);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

// ─── DELETE /api/v2/admin/hot-dates/:id ─────────────────────────────────
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('hot_dates')
    .delete()
    .eq('id', req.params.id);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
''')

# ── 5. router.js patch ────────────────────────────────────────────────────────
patch(
    'src/api/router.js',
    """router.use('/admin/discover',     require('./admin/discover'));
router.use('/admin/photos',       require('./admin/photos'));
router.use('/admin/couture',      require('./admin/couture'));
router.use('/admin/featured',     require('./admin/featured'));""",
    """router.use('/admin/discover',        require('./admin/discover'));
router.use('/admin/photos',          require('./admin/photos'));
router.use('/admin/couture',         require('./admin/couture'));
router.use('/admin/featured',        require('./admin/featured'));
router.use('/admin/vendors',         require('./admin/vendors'));
router.use('/admin/couples',         require('./admin/couples'));
router.use('/admin/hot-dates',       require('./admin/hotDates'));"""
)

# ── 6. migration 0044 ─────────────────────────────────────────────────────────
write('db/migrations/0044_discover_heroes.sql', '''-- 0044_discover_heroes.sql
-- Vendor hero cards shown at the top of the bride\'s Frost discover feed.
-- Managed by admin only. Cloudinary-hosted images.

CREATE TABLE IF NOT EXISTS discover_heroes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid        REFERENCES vendors(id) ON DELETE CASCADE,
  image_url     text        NOT NULL,
  caption       text,
  display_order integer     NOT NULL DEFAULT 0,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discover_heroes_active ON discover_heroes(active, display_order);
''')

# ── 7. delete superseded taste_quiz migration ─────────────────────────────────
delete('db/migrations/0043_taste_quiz.sql')

print("\nPhase 1 complete. Run node --check on changed files, then commit.")
