// src/api/public/sitemap.js
// TDW · BLOCK 19 · G3.1 sitting 2 (dream-os p2) — THE PAGES GOOGLE MAY LIST.
//
//   GET /api/v2/public/sitemap → { ok, pages: [{ handle, slug|null, updated_at }] }
//
// The pwa's app/sitemap.ts reads this once an hour (R-G31.3: the sitemap is a
// page, not a per-hit read). The predicates are the CARD DOOR's, restated by
// column so the two can never list different pages:
//   vendors   — `status = 'active' AND discover_paused = false` (vendorCard.js:445)
//               with a routing_handle (PUBLIC_SCHEMA.md vendors :1215).
//   weddings  — `visibility = 'published' AND couple_consent = true`
//               (vendorCard.js:504–508; PUBLIC_SCHEMA.md weddings :1303).
// updated_at: vendors :1213, weddings :1306. Handles are lowercased, as the
// door lowercases them and the leaf canonicalises (F-40.276).
//
// NO PHONE, NO NAME, NO CITY — three columns per row, none of them a fact about
// her beyond "this address exists" (R-G11.6). Demo vendors are not vendors rows
// and do not appear; the demo studio is flagged noindex at its own leaf.

'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

const VENDOR_COLS  = 'id, routing_handle, updated_at';
const WEDDING_COLS = 'owner_vendor_id, slug, updated_at';

/** The list, as a function, so the bench can drive it with a supabase double. */
async function listPages(supabase) {
  const { data: vendors, error: e1 } = await supabase
    .from('vendors').select(VENDOR_COLS)
    .eq('status', 'active').eq('discover_paused', false)
    .not('routing_handle', 'is', null);
  if (e1) return { ok: false, error: e1.message };

  const byId = new Map();
  const pages = [];
  for (const v of vendors || []) {
    const handle = String(v.routing_handle || '').trim().toLowerCase();
    if (!handle) continue;
    byId.set(v.id, handle);
    pages.push({ handle, slug: null, updated_at: v.updated_at || null });
  }

  if (byId.size) {
    const { data: weds, error: e2 } = await supabase
      .from('weddings').select(WEDDING_COLS)
      .in('owner_vendor_id', [...byId.keys()])
      .eq('visibility', 'published').eq('couple_consent', true);
    if (e2) return { ok: false, error: e2.message };
    for (const w of weds || []) {
      const handle = byId.get(w.owner_vendor_id);
      if (handle && w.slug) pages.push({ handle, slug: w.slug, updated_at: w.updated_at || null });
    }
  }
  return { ok: true, pages };
}

router.get('/', asyncHandler(async (req, res) => {
  const out = await listPages(req.app.locals.supabase);
  if (!out.ok) return res.status(500).json({ ok: false, error: 'sitemap read failed' });
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json({ ok: true, pages: out.pages });
}));

module.exports = router;
module.exports.listPages = listPages;
module.exports.VENDOR_COLS = VENDOR_COLS;
module.exports.WEDDING_COLS = WEDDING_COLS;
