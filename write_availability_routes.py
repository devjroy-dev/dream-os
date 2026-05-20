import os

# ── 1. Write src/api/vendor/availability.js ──────────────────────────────────

lines = [
    "// src/api/vendor/availability.js",
    "// Vendor availability blocking — new resource (Block 1a).",
    "//   GET    /api/v2/vendor/availability/:vendorId  — list blocked dates",
    "//   POST   /api/v2/vendor/availability            — block a date",
    "//   DELETE /api/v2/vendor/availability/:blockId   — unblock",
    "// Auth: vendor JWT.",
    "",
    "'use strict';",
    "",
    "const express       = require('express');",
    "const router        = express.Router();",
    "const requireAuth   = require('../middleware/requireAuth');",
    "const resolveVendor = require('../middleware/resolveVendor');",
    "const asyncHandler  = require('../../lib/asyncHandler');",
    "const { ok: okRes, err: errRes } = require('../../lib/response');",
    "const { blockDate, unblockDate, listBlocks } = require('../../lib/vendor/availability');",
    "",
    "// ─── GET /api/v2/vendor/availability/:vendorId ─────────────────────────",
    "//",
    "// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD (both optional)",
    "// Auth: resolveVendor mode B.",
    "",
    "router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {",
    "  const supabase = req.app.locals.supabase;",
    "  const vendor   = req.vendor;",
    "  const from     = req.query.from || null;",
    "  const to       = req.query.to   || null;",
    "",
    "  const result = await listBlocks(supabase, vendor.id, { from, to });",
    "  if (!result.ok) return errRes(res, 500, result.error);",
    "  return okRes(res, { blocks: result.blocks, total: result.total });",
    "}));",
    "",
    "// ─── POST /api/v2/vendor/availability ──────────────────────────────────",
    "//",
    "// Block a date. 409 if already blocked.",
    "// Auth: resolveVendor mode A.",
    "",
    "router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {",
    "  const supabase = req.app.locals.supabase;",
    "  const vendor   = req.vendor;",
    "  const body     = req.body || {};",
    "",
    "  const result = await blockDate(supabase, vendor.id, body.blocked_date, body.reason || null);",
    "  if (!result.ok && result.code === 'ALREADY_BLOCKED') return errRes(res, 409, result.error, result.code);",
    "  if (!result.ok) return errRes(res, 400, result.error);",
    "  return okRes(res, { block: result.block });",
    "}));",
    "",
    "// ─── DELETE /api/v2/vendor/availability/:blockId ───────────────────────",
    "//",
    "// Unblock by block UUID.",
    "// Auth: resolveVendor mode C via vendor_availability table.",
    "",
    "router.delete('/:blockId', requireAuth, resolveVendor({ paramName: 'blockId', via: 'vendor_availability' }), asyncHandler(async (req, res) => {",
    "  const supabase = req.app.locals.supabase;",
    "  const vendor   = req.vendor;",
    "  const blockId  = req.params.blockId;",
    "",
    "  const result = await unblockDate(supabase, vendor.id, { block_id: blockId });",
    "  if (!result.ok) return errRes(res, 404, result.error);",
    "  return okRes(res, { deleted: true });",
    "}));",
    "",
    "module.exports = router;",
]

with open('src/api/vendor/availability.js', 'w') as f:
    f.write('\n'.join(lines) + '\n')

print('Written: src/api/vendor/availability.js')

# ── 2. Patch core.js to mount the new router ─────────────────────────────────

with open('src/api/vendor/core.js', 'r') as f:
    core = f.read()

old_line = "router.use('/chat',     require('./chat'));"
new_line = (
    "router.use('/chat',         require('./chat'));\n"
    "router.use('/availability', require('./availability'));"
)
core = core.replace(old_line, new_line, 1)

with open('src/api/vendor/core.js', 'w') as f:
    f.write(core)

print('Patched: src/api/vendor/core.js')
