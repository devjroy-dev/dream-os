#!/usr/bin/env python3
"""
Phase 2 — Admin backend: all new endpoints + patches.
Run from: /workspaces/dream-os

Creates:
  src/lib/admin/cloudinary.js
  src/api/admin/invites.js
  src/api/admin/config.js
  src/api/admin/content.js
  src/api/admin/musePool.js
  src/api/admin/surprisePool.js
  src/api/admin/spotlight.js
  src/api/admin/discoverHeroes.js

Patches:
  src/api/admin/couture.js   — adds GET list
  src/api/admin/photos.js    — adds category + state filter
  src/api/router.js          — mounts all new routers
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

# ── 1. Shared Cloudinary helper ───────────────────────────────────────────────
write('src/lib/admin/cloudinary.js', r"""// src/lib/admin/cloudinary.js
// Shared Cloudinary signing helpers for admin upload endpoints.
'use strict';

const crypto = require('crypto');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function ensureCloudinary() {
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
}

function generateUploadParams(folder, filename) {
  ensureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const publicId  = `${filename.replace(/\.[^.]+$/, '')}-${crypto.randomBytes(4).toString('hex')}`;
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha256')
    .update(paramsToSign + API_SECRET)
    .digest('hex');

  return {
    upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    params: { api_key: API_KEY, timestamp, signature, folder, public_id: publicId },
  };
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    ensureCloudinary();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto.createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest('hex');
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ public_id: publicId, api_key: API_KEY, timestamp, signature }),
    });
  } catch { /* best effort */ }
}

module.exports = { generateUploadParams, deleteFromCloudinary };
""")

# ── 2. Invites ────────────────────────────────────────────────────────────────
write('src/api/admin/invites.js', r"""// src/api/admin/invites.js
// Admin invite code management — generate, list, delete + WhatsApp links.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const crypto       = require('crypto');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

const VENDOR_WA_NUMBER = process.env.TDW_WA_NUMBER   || '917982159047';
const COUPLE_WA_NUMBER = process.env.BRIDE_WA_NUMBER || '14787788550';

// GET /whatsapp-links
router.get('/whatsapp-links', requireAdmin, asyncHandler(async (req, res) => {
  return okRes(res, {
    vendor: `https://wa.me/${VENDOR_WA_NUMBER}`,
    couple: `https://wa.me/${COUPLE_WA_NUMBER}`,
    note:   'Share these links. When someone messages, the agent onboards them automatically.',
  });
}));

// GET /
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('invite_codes')
    .select(`code, kind, tier, intended_phone, notes, created_by,
             created_at, consumed_at, consumed_by_user_id,
             users:consumed_by_user_id(phone)`)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);

  const invites = (data || []).map(r => ({
    code:              r.code,
    kind:              r.kind,
    tier:              r.tier || null,
    intended_phone:    r.intended_phone || null,
    notes:             r.notes || null,
    created_by:        r.created_by || null,
    created_at:        r.created_at,
    consumed_at:       r.consumed_at || null,
    consumed_by_phone: r.users?.phone || null,
  }));

  return okRes(res, { invites, total: invites.length });
}));

// POST /generate
router.post('/generate', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { kind, tier, intended_phone, notes, count = 1 } = req.body;

  if (!kind || !['dreamer', 'maker'].includes(kind))
    return errRes(res, 400, 'kind is required: dreamer or maker.');

  const qty  = intended_phone ? 1 : Math.min(Math.max(1, parseInt(count) || 1), 50);
  const rows = Array.from({ length: qty }, () => ({
    code:           generateCode(),
    kind,
    tier:           tier || null,
    intended_phone: intended_phone || null,
    notes:          notes || null,
    created_by:     'admin',
  }));

  const { data, error } = await supabase.from('invite_codes').insert(rows).select('code, kind, tier, intended_phone');
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { codes: data, total: data.length });
}));

// DELETE /:code
router.delete('/:code', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const code     = req.params.code.toUpperCase();
  const { data: row } = await supabase.from('invite_codes').select('code, consumed_at').eq('code', code).single();
  if (!row) return errRes(res, 404, 'Invite code not found.');
  if (row.consumed_at) return errRes(res, 409, 'Cannot delete a consumed invite code.');
  const { error } = await supabase.from('invite_codes').delete().eq('code', code);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
""")

# ── 3. Config ─────────────────────────────────────────────────────────────────
write('src/api/admin/config.js', r"""// src/api/admin/config.js
// Admin config — read and update admin_config key/value store.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// GET /
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('admin_config')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const flat = {};
  for (const row of (data || [])) flat[row.key] = row.value;
  return okRes(res, { config: flat, rows: data || [] });
}));

// PATCH /:key
router.patch('/:key', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { key }  = req.params;
  const { value } = req.body;
  if (value === undefined || value === null || String(value).trim() === '')
    return errRes(res, 400, 'value is required.');
  const { data: existing } = await supabase.from('admin_config').select('key').eq('key', key).single();
  if (!existing) return errRes(res, 404, `Config key "${key}" not found.`);
  const { data, error } = await supabase
    .from('admin_config')
    .update({ value: String(value).trim(), updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('key, value, updated_at')
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { key: data.key, value: data.value, updated_at: data.updated_at });
}));

module.exports = router;
""")

# ── 4. Content (landing + exploring) ─────────────────────────────────────────
write('src/api/admin/content.js', r"""// src/api/admin/content.js
// Admin content — landing_slides + exploring_photos CRUD + upload.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

function makeContentRouter(tableName, folder) {
  const r = express.Router();

  r.get('/', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from(tableName)
      .select('id, image_url, cloudinary_public_id, caption, display_order, active, created_at')
      .order('display_order', { ascending: true });
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { photos: data || [], total: (data || []).length });
  }));

  r.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
    const { filename } = req.body;
    if (!filename) return errRes(res, 400, 'filename is required.');
    return okRes(res, generateUploadParams(folder, filename));
  }));

  r.post('/', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { image_url, cloudinary_public_id, caption, display_order } = req.body;
    if (!image_url) return errRes(res, 400, 'image_url is required.');
    const { data, error } = await supabase.from(tableName)
      .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, display_order: display_order ?? 0, active: true })
      .select('id, image_url, cloudinary_public_id, caption, display_order, active, created_at')
      .single();
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { photo: data });
  }));

  r.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { caption, active, display_order } = req.body;
    const patch = {};
    if (caption       !== undefined) patch.caption       = caption;
    if (active        !== undefined) patch.active        = active;
    if (display_order !== undefined) patch.display_order = display_order;
    if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
    const { error } = await supabase.from(tableName).update(patch).eq('id', req.params.id);
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { updated: true });
  }));

  r.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const { data: row } = await supabase.from(tableName).select('cloudinary_public_id').eq('id', req.params.id).single();
    if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
    const { error } = await supabase.from(tableName).delete().eq('id', req.params.id);
    if (error) return errRes(res, 500, error.message);
    return okRes(res, { deleted: true });
  }));

  return r;
}

router.use('/landing-photos',   makeContentRouter('landing_slides',   'landing_photos'));
router.use('/exploring-photos', makeContentRouter('exploring_photos', 'exploring_photos'));

module.exports = router;
""")

# ── 5. Muse pool ──────────────────────────────────────────────────────────────
write('src/api/admin/musePool.js', r"""// src/api/admin/musePool.js
// Admin muse pool — editorial images pre-seeded into every new bride's muse board.
// Hard cap: 20 active images.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

const MAX_ACTIVE = 20;

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('muse_pool')
    .select('id, image_url, cloudinary_public_id, caption, aesthetic_tags, sort_order, active, created_at')
    .order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const activeCount = (data || []).filter(r => r.active).length;
  return okRes(res, { images: data || [], total: (data || []).length, active_count: activeCount, max: MAX_ACTIVE });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('muse_pool', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, caption, aesthetic_tags, sort_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { count } = await supabase.from('muse_pool').select('id', { count: 'exact', head: true }).eq('active', true);
  if ((count || 0) >= MAX_ACTIVE)
    return errRes(res, 409, `Muse pool already has ${MAX_ACTIVE} active images. Deactivate one before adding more.`);
  const { data, error } = await supabase.from('muse_pool')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, aesthetic_tags: aesthetic_tags || [], sort_order: sort_order ?? 0, active: true })
    .select('id, image_url, caption, aesthetic_tags, sort_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { image: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, aesthetic_tags, active, sort_order } = req.body;
  if (active === true) {
    const { count } = await supabase.from('muse_pool').select('id', { count: 'exact', head: true }).eq('active', true).neq('id', req.params.id);
    if ((count || 0) >= MAX_ACTIVE) return errRes(res, 409, `Cannot activate: already at ${MAX_ACTIVE} active images.`);
  }
  const patch = {};
  if (caption        !== undefined) patch.caption        = caption;
  if (aesthetic_tags !== undefined) patch.aesthetic_tags = aesthetic_tags;
  if (active         !== undefined) patch.active         = active;
  if (sort_order     !== undefined) patch.sort_order     = sort_order;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('muse_pool').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('muse_pool').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('muse_pool').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('muse_pool')
    .select('id, image_url, caption, aesthetic_tags, sort_order')
    .eq('active', true).order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { images: data || [], total: (data || []).length });
}));

module.exports = { adminRouter: router, publicRouter };
""")

# ── 6. Surprise pool ──────────────────────────────────────────────────────────
write('src/api/admin/surprisePool.js', r"""// src/api/admin/surprisePool.js
// Admin surprise pool — taste_quiz_images. Up to 100 active images.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

const MAX_ACTIVE = 100;

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('taste_quiz_images')
    .select('id, image_url, cloudinary_public_id, caption, aesthetic_tags, sort_order, active, created_at')
    .order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const activeCount = (data || []).filter(r => r.active).length;
  return okRes(res, { images: data || [], total: (data || []).length, active_count: activeCount, max: MAX_ACTIVE });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('surprise_pool', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, caption, aesthetic_tags, sort_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { count } = await supabase.from('taste_quiz_images').select('id', { count: 'exact', head: true }).eq('active', true);
  if ((count || 0) >= MAX_ACTIVE)
    return errRes(res, 409, `Surprise pool already has ${MAX_ACTIVE} active images.`);
  const { data, error } = await supabase.from('taste_quiz_images')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, aesthetic_tags: aesthetic_tags || [], sort_order: sort_order ?? 0, active: true })
    .select('id, image_url, caption, aesthetic_tags, sort_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { image: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, aesthetic_tags, active, sort_order } = req.body;
  if (active === true) {
    const { count } = await supabase.from('taste_quiz_images').select('id', { count: 'exact', head: true }).eq('active', true).neq('id', req.params.id);
    if ((count || 0) >= MAX_ACTIVE) return errRes(res, 409, `Cannot activate: already at ${MAX_ACTIVE} active images.`);
  }
  const patch = {};
  if (caption        !== undefined) patch.caption        = caption;
  if (aesthetic_tags !== undefined) patch.aesthetic_tags = aesthetic_tags;
  if (active         !== undefined) patch.active         = active;
  if (sort_order     !== undefined) patch.sort_order     = sort_order;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('taste_quiz_images').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('taste_quiz_images').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('taste_quiz_images').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
""")

# ── 7. Spotlight ──────────────────────────────────────────────────────────────
write('src/api/admin/spotlight.js', r"""// src/api/admin/spotlight.js
// Admin spotlight — "Vendors of the week" editorial cards on discover landing.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('spotlight')
    .select('id, vendor_id, image_url, cloudinary_public_id, caption, week_label, sort_order, active, created_at, vendors(business_name, category, city)')
    .order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const items = (data || []).map(r => ({
    id: r.id, vendor_id: r.vendor_id,
    vendor_name: r.vendors?.business_name || null,
    vendor_category: r.vendors?.category || null,
    vendor_city: r.vendors?.city || null,
    image_url: r.image_url, cloudinary_public_id: r.cloudinary_public_id,
    caption: r.caption, week_label: r.week_label,
    sort_order: r.sort_order, active: r.active, created_at: r.created_at,
  }));
  return okRes(res, { spotlight: items, total: items.length });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('spotlight', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, vendor_id, caption, week_label, sort_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { data, error } = await supabase.from('spotlight')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, vendor_id: vendor_id || null, caption: caption || null, week_label: week_label || null, sort_order: sort_order ?? 0, active: true })
    .select('id, vendor_id, image_url, caption, week_label, sort_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { item: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, week_label, active, sort_order, vendor_id } = req.body;
  const patch = {};
  if (caption    !== undefined) patch.caption    = caption;
  if (week_label !== undefined) patch.week_label = week_label;
  if (active     !== undefined) patch.active     = active;
  if (sort_order !== undefined) patch.sort_order = sort_order;
  if (vendor_id  !== undefined) patch.vendor_id  = vendor_id;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('spotlight').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('spotlight').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('spotlight').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('spotlight')
    .select('id, vendor_id, image_url, caption, week_label, sort_order, vendors(business_name, category, city)')
    .eq('active', true).order('sort_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { spotlight: data || [], total: (data || []).length });
}));

module.exports = { adminRouter: router, publicRouter };
""")

# ── 8. Discover heroes ────────────────────────────────────────────────────────
write('src/api/admin/discoverHeroes.js', r"""// src/api/admin/discoverHeroes.js
// Admin discover heroes — hero images at top of bride's frost discover feed.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { generateUploadParams, deleteFromCloudinary } = require('../../lib/admin/cloudinary');

router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('discover_heroes')
    .select('id, image_url, cloudinary_public_id, caption, display_order, active, created_at')
    .order('display_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { heroes: data || [], total: (data || []).length });
}));

router.post('/upload-url', requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.body;
  if (!filename) return errRes(res, 400, 'filename is required.');
  return okRes(res, generateUploadParams('discover_heroes', filename));
}));

router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url, cloudinary_public_id, caption, display_order } = req.body;
  if (!image_url) return errRes(res, 400, 'image_url is required.');
  const { data, error } = await supabase.from('discover_heroes')
    .insert({ image_url, cloudinary_public_id: cloudinary_public_id || null, caption: caption || null, display_order: display_order ?? 0, active: true })
    .select('id, image_url, caption, display_order, active, created_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { hero: data });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { caption, active, display_order } = req.body;
  const patch = {};
  if (caption       !== undefined) patch.caption       = caption;
  if (active        !== undefined) patch.active        = active;
  if (display_order !== undefined) patch.display_order = display_order;
  if (!Object.keys(patch).length) return errRes(res, 400, 'No fields to update.');
  const { error } = await supabase.from('discover_heroes').update(patch).eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { updated: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: row } = await supabase.from('discover_heroes').select('cloudinary_public_id').eq('id', req.params.id).single();
  if (row?.cloudinary_public_id) await deleteFromCloudinary(row.cloudinary_public_id);
  const { error } = await supabase.from('discover_heroes').delete().eq('id', req.params.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('discover_heroes')
    .select('id, image_url, caption, display_order')
    .eq('active', true).order('display_order', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { heroes: data || [], total: (data || []).length });
}));

module.exports = { adminRouter: router, publicRouter };
""")

# ── 9. Patch couture.js — add GET list ───────────────────────────────────────
patch(
    'src/api/admin/couture.js',
    '// POST /eligible/:vendorId',
    r"""// GET / — list couture-eligible vendors with slot + appointment counts
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      id, business_name, category, city, couture_eligible,
      users!inner(name, phone),
      couture_slots:couture_availability(count),
      couture_appointments(count)
    `)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);

  const vendors = (data || []).map(v => ({
    id:                v.id,
    name:              v.business_name || v.users?.name || 'Unnamed',
    phone:             v.users?.phone,
    category:          v.category,
    city:              v.city,
    couture_eligible:  v.couture_eligible || false,
    slot_count:        v.couture_slots?.[0]?.count ?? 0,
    appointment_count: v.couture_appointments?.[0]?.count ?? 0,
  }));

  return okRes(res, { vendors, total: vendors.length });
}));

// POST /eligible/:vendorId"""
)

# ── 10. Patch photos.js — add category + state filter ────────────────────────
patch(
    'src/api/admin/photos.js',
    """// GET /queue
router.get('/queue', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.query.vendor_id || null;
  let q = supabase.from('vendor_portfolio')
    .select('id, vendor_id, image_url, caption, aesthetic_tags, approval_state, created_at, vendor:vendors(id, business_name, routing_handle, user:users(name))')
    .eq('approval_state', 'pending')
    .order('created_at', { ascending: true });
  if (vendorId) q = q.eq('vendor_id', vendorId);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { photos: data || [], total: (data || []).length });
}));""",
    """// GET /queue — ?category=photographer&state=pending|approved|rejected|all&vendor_id=
router.get('/queue', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.query.vendor_id || null;
  const category = req.query.category  || null;
  const state    = req.query.state     || 'pending';
  const validStates = ['pending', 'approved', 'rejected', 'all'];
  if (!validStates.includes(state)) return errRes(res, 400, `state must be one of: ${validStates.join(', ')}.`);

  let q = supabase.from('vendor_portfolio')
    .select('id, vendor_id, image_url, caption, aesthetic_tags, approval_state, created_at, vendor:vendors(id, business_name, category, routing_handle, user:users(name))')
    .order('created_at', { ascending: true });

  if (state !== 'all') q = q.eq('approval_state', state);
  if (vendorId) q = q.eq('vendor_id', vendorId);
  if (category) q = q.eq('vendor.category', category);

  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { photos: data || [], total: (data || []).length });
}));"""
)

# ── 11. Patch router.js — mount all new routers ───────────────────────────────
patch(
    'src/api/router.js',
    """router.use('/admin/discover',        require('./admin/discover'));
router.use('/admin/photos',          require('./admin/photos'));
router.use('/admin/couture',         require('./admin/couture'));
router.use('/admin/featured',        require('./admin/featured'));
router.use('/admin/vendors',         require('./admin/vendors'));
router.use('/admin/couples',         require('./admin/couples'));
router.use('/admin/hot-dates',       require('./admin/hotDates'));""",
    """router.use('/admin/discover',        require('./admin/discover'));
router.use('/admin/photos',          require('./admin/photos'));
router.use('/admin/couture',         require('./admin/couture'));
router.use('/admin/featured',        require('./admin/featured'));
router.use('/admin/vendors',         require('./admin/vendors'));
router.use('/admin/couples',         require('./admin/couples'));
router.use('/admin/hot-dates',       require('./admin/hotDates'));
router.use('/admin/invites',         require('./admin/invites'));
router.use('/admin/config',          require('./admin/config'));
router.use('/admin',                 require('./admin/content'));
router.use('/admin/muse-pool',       require('./admin/musePool').adminRouter);
router.use('/admin/surprise-pool',   require('./admin/surprisePool'));
router.use('/admin/spotlight',       require('./admin/spotlight').adminRouter);
router.use('/admin/discover-heroes', require('./admin/discoverHeroes').adminRouter);
// Public endpoints for content surfaces (no auth)
router.use('/muse-pool',             require('./admin/musePool').publicRouter);
router.use('/spotlight',             require('./admin/spotlight').publicRouter);
router.use('/discover-heroes',       require('./admin/discoverHeroes').publicRouter);"""
)

print("\nPhase 2 complete. Run node --check on all changed files, then commit.")
