import os

with open('src/api/vendor/me.js', 'r') as f:
    content = f.read()

# 1. Update file header comment
content = content.replace(
    "// src/api/vendor/me.js\n"
    "// GET /api/v2/vendor/me\n"
    "// Auth: vendor JWT.\n"
    "// Purpose: Vendor profile — used by settings screen and session hydration.\n"
    "// Contract: docs/API_CONTRACTS.md (Vendor endpoints, /vendor/me).\n"
    "//\n"
    "// Joins vendors + users (for users.name as vendor.name).\n"
    "// Returns the four P2-9 fields (aesthetic_tags, rate_min, rate_max, discover_preview)\n"
    "// as nulls/false. Migrations 0024 (vendor_portfolio + rate cols + aesthetic_tags)\n"
    "// and 0029 (discover_preview) are scheduled for P2-9.",

    "// src/api/vendor/me.js\n"
    "// Vendor profile endpoints.\n"
    "//   GET   /api/v2/vendor/me                   — profile read\n"
    "//   PATCH /api/v2/vendor/me                   — profile update\n"
    "//   PATCH /api/v2/vendor/me/routing-handle    — handle update (sensitive)\n"
    "//   PATCH /api/v2/vendor/me/invoice-prefix    — invoice prefix update\n"
    "// Auth: vendor JWT.",
    1
)

# 2. Add new requires
old_req = (
    "const express        = require('express');\n"
    "const router         = express.Router();\n"
    "const requireAuth    = require('../middleware/requireAuth');\n"
    "const resolveVendor  = require('../middleware/resolveVendor');"
)
new_req = (
    "const express        = require('express');\n"
    "const router         = express.Router();\n"
    "const requireAuth    = require('../middleware/requireAuth');\n"
    "const resolveVendor  = require('../middleware/resolveVendor');\n"
    "const asyncHandler   = require('../../lib/asyncHandler');\n"
    "const { ok: okRes, err: errRes } = require('../../lib/response');"
)
content = content.replace(old_req, new_req, 1)

# 3. Unwire the P2-9 stubs — return real column values
content = content.replace(
    "      // P2-9 fields — stubbed null/false until migrations 0024 + 0029 applied.\n"
    "      aesthetic_tags:    null,\n"
    "      rate_min:          null,\n"
    "      rate_max:          null,\n"
    "      discover_preview:  false,",

    "      // Block F (migration 0034) applied these columns — real values now.\n"
    "      aesthetic_tags:    vendor.aesthetic_tags    || [],\n"
    "      rate_min:          vendor.rate_min          || null,\n"
    "      rate_max:          vendor.rate_max          || null,\n"
    "      discover_preview:  vendor.discover_preview  === true,",
    1
)

# 4. Append new handlers before module.exports
new_handlers = (
    "\n"
    "// ─── PATCH /api/v2/vendor/me ───────────────────────────────────────────\n"
    "//\n"
    "// Update vendor profile fields. Locked fields rejected with 400.\n"
    "// Auth: requireAuth. resolveVendor mode A.\n"
    "\n"
    "const LOCKED_FIELDS  = ['phone', 'routing_handle', 'tier', 'founding_cohort', 'onboarding_state', 'category'];\n"
    "const ALLOWED_FIELDS = ['business_name', 'style_notes', 'city', 'open_to_travel', 'travel_notes',\n"
    "                        'instagram_handle', 'upi_id', 'gstin', 'briefing_enabled',\n"
    "                        'aesthetic_tags', 'rate_min', 'rate_max'];\n"
    "\n"
    "router.patch('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const body     = req.body || {};\n"
    "\n"
    "  // Reject locked fields\n"
    "  for (const field of LOCKED_FIELDS) {\n"
    "    if (body[field] !== undefined) {\n"
    "      return errRes(res, 400, 'Field \\'' + field + '\\' is locked.', 'FIELD_LOCKED');\n"
    "    }\n"
    "  }\n"
    "\n"
    "  const update = {};\n"
    "  for (const key of ALLOWED_FIELDS) {\n"
    "    if (body[key] !== undefined) update[key] = body[key];\n"
    "  }\n"
    "  if (Object.keys(update).length === 0) return errRes(res, 400, 'No editable fields provided.');\n"
    "\n"
    "  // rate_min <= rate_max guard\n"
    "  const rMin = update.rate_min !== undefined ? update.rate_min : vendor.rate_min;\n"
    "  const rMax = update.rate_max !== undefined ? update.rate_max : vendor.rate_max;\n"
    "  if (rMin != null && rMax != null && rMin > rMax) {\n"
    "    return errRes(res, 400, 'rate_min cannot exceed rate_max.');\n"
    "  }\n"
    "\n"
    "  const { data: updated, error } = await supabase\n"
    "    .from('vendors').update(update).eq('id', vendor.id)\n"
    "    .select('id, business_name, city, open_to_travel, upi_id, gstin, aesthetic_tags, rate_min, rate_max, discover_preview')\n"
    "    .maybeSingle();\n"
    "\n"
    "  if (error) return errRes(res, 500, error.message);\n"
    "\n"
    "  const { data: user } = await supabase.from('users').select('name').eq('id', vendor.user_id).maybeSingle();\n"
    "\n"
    "  return okRes(res, {\n"
    "    vendor: {\n"
    "      id:               updated.id,\n"
    "      name:             user?.name || null,\n"
    "      business_name:    updated.business_name    || null,\n"
    "      city:             updated.city             || null,\n"
    "      open_to_travel:   updated.open_to_travel   === true,\n"
    "      upi_id:           updated.upi_id           || null,\n"
    "      gstin:            updated.gstin            || null,\n"
    "      aesthetic_tags:   updated.aesthetic_tags   || [],\n"
    "      rate_min:         updated.rate_min         || null,\n"
    "      rate_max:         updated.rate_max         || null,\n"
    "      discover_preview: updated.discover_preview === true,\n"
    "    },\n"
    "  });\n"
    "}));\n"
    "\n"
    "// ─── PATCH /api/v2/vendor/me/routing-handle ────────────────────────────\n"
    "//\n"
    "// Handle changes are sensitive — separate endpoint.\n"
    "// Alphanumeric, 3-12 chars, uppercased. Globally unique.\n"
    "// Auth: requireAuth. resolveVendor mode A.\n"
    "\n"
    "router.patch('/routing-handle', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const raw      = (req.body || {}).routing_handle || '';\n"
    "  const cleaned  = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');\n"
    "\n"
    "  if (cleaned.length < 3)  return errRes(res, 400, 'Handle must be at least 3 characters.');\n"
    "  if (cleaned.length > 12) return errRes(res, 400, 'Handle must be 12 characters or fewer.');\n"
    "\n"
    "  const { data: collision } = await supabase\n"
    "    .from('vendors').select('id').eq('routing_handle', cleaned).neq('id', vendor.id).maybeSingle();\n"
    "  if (collision) return errRes(res, 409, 'Handle already taken.', 'HANDLE_TAKEN');\n"
    "\n"
    "  const { error } = await supabase\n"
    "    .from('vendors').update({ routing_handle: cleaned }).eq('id', vendor.id);\n"
    "  if (error) return errRes(res, 500, error.message);\n"
    "\n"
    "  const tdwNumber = process.env.TDW_WA_NUMBER || '14787788550';\n"
    "  const wa_link   = 'https://wa.me/' + tdwNumber + '?text=TDW-' + cleaned;\n"
    "  console.log('[me:routing-handle] ' + vendor.id + ' -> ' + cleaned);\n"
    "  return okRes(res, { routing_handle: cleaned, wa_link });\n"
    "}));\n"
    "\n"
    "// ─── PATCH /api/v2/vendor/me/invoice-prefix ────────────────────────────\n"
    "//\n"
    "// Update invoice prefix. Counter never resets on prefix change.\n"
    "// Auth: requireAuth. resolveVendor mode A.\n"
    "\n"
    "router.patch('/invoice-prefix', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const raw      = (req.body || {}).prefix || '';\n"
    "  const cleaned  = raw.toUpperCase().trim().replace(/[^A-Z0-9\\-\\/]/g, '');\n"
    "\n"
    "  if (!cleaned || cleaned.length < 2)  return errRes(res, 400, 'Prefix must be at least 2 characters.');\n"
    "  if (cleaned.length > 20) return errRes(res, 400, 'Prefix must be 20 characters or fewer.');\n"
    "\n"
    "  const { data: v } = await supabase\n"
    "    .from('vendors').select('invoice_counter').eq('id', vendor.id).single();\n"
    "\n"
    "  const { error } = await supabase\n"
    "    .from('vendors').update({ invoice_prefix: cleaned }).eq('id', vendor.id);\n"
    "  if (error) return errRes(res, 500, error.message);\n"
    "\n"
    "  console.log('[me:invoice-prefix] ' + vendor.id + ' -> ' + cleaned);\n"
    "  return okRes(res, { prefix: cleaned, current_counter: v?.invoice_counter || 0 });\n"
    "}));\n"
)

content = content.replace(
    "module.exports = router;",
    new_handlers + "module.exports = router;"
)

with open('src/api/vendor/me.js', 'w') as f:
    f.write(content)

print('Patched: src/api/vendor/me.js')
