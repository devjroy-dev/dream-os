import os

with open('src/api/vendor/clients.js', 'r') as f:
    content = f.read()

# 1. Add new requires after existing requires block
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
    "const { ok: okRes, err: errRes } = require('../../lib/response');\n"
    "const { createClient, updateClient, deleteClient } = require('../../lib/vendor/clients');"
)
content = content.replace(old_req, new_req, 1)

# 2. Also update list + detail GET to filter deleted_at IS NULL
# List query
content = content.replace(
    "      .select('id, name, phone, email, notes, created_at')\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .order('created_at', { ascending: false })\n"
    "      .range(offset, offset + limit - 1),\n"
    "\n"
    "    supabase.from('clients')\n"
    "      .select('*', { count: 'exact', head: true })\n"
    "      .eq('vendor_id', vendor.id),",

    "      .select('id, name, phone, email, notes, created_at')\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .is('deleted_at', null)\n"
    "      .order('created_at', { ascending: false })\n"
    "      .range(offset, offset + limit - 1),\n"
    "\n"
    "    supabase.from('clients')\n"
    "      .select('*', { count: 'exact', head: true })\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .is('deleted_at', null),",
    1
)

# Detail query — add deleted_at filter
content = content.replace(
    "    supabase.from('clients')\n"
    "      .select('id, name, phone, email, notes')\n"
    "      .eq('id', clientId)\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .maybeSingle(),",

    "    supabase.from('clients')\n"
    "      .select('id, name, phone, email, notes')\n"
    "      .eq('id', clientId)\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .is('deleted_at', null)\n"
    "      .maybeSingle(),",
    1
)

# 3. Replace the hard-delete handler with soft delete + add POST + PATCH
old_delete = (
    "// DELETE /:clientId\n"
    "// Hard delete. leads.client_id and invoices.client_id SET NULL on delete — financial records safe.\n"
    "router.delete('/:clientId', requireAuth, async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const { user_id } = req.auth;\n"
    "  const { clientId } = req.params;\n"
    "\n"
    "  const { data: vendorRow } = await supabase.from('vendors').select('id').eq('user_id', user_id).maybeSingle();\n"
    "  if (!vendorRow) return res.status(403).json({ ok: false, error: 'Vendor not found.' });\n"
    "\n"
    "  const { data: client, error: fetchErr } = await supabase\n"
    "    .from('clients').select('id, name')\n"
    "    .eq('id', clientId).eq('vendor_id', vendorRow.id).single();\n"
    "\n"
    "  if (fetchErr?.code === 'PGRST116' || !client) return res.status(404).json({ ok: false, error: 'Client not found.' });\n"
    "  if (fetchErr) return res.status(500).json({ ok: false, error: fetchErr.message });\n"
    "\n"
    "  const { error: delErr } = await supabase\n"
    "    .from('clients').delete()\n"
    "    .eq('id', clientId).eq('vendor_id', vendorRow.id);\n"
    "\n"
    "  if (delErr) return res.status(500).json({ ok: false, error: delErr.message });\n"
    "\n"
    "  console.log(`[clients:delete] \"${client.name}\" deleted by vendor ${vendorRow.id}`);\n"
    "  return res.json({ ok: true, message: `${client.name} removed from your clients.` });\n"
    "});"
)

new_handlers = (
    "// ─── POST /api/v2/vendor/clients ──────────────────────────────────────\n"
    "//\n"
    "// Create a new client. Idempotent on phone:\n"
    "//   - Active match   -> return existing, deduped:true\n"
    "//   - Deleted match  -> restore, deduped:true, restored:true\n"
    "//   - No match       -> create new, deduped:false\n"
    "// Auth: requireAuth. resolveVendor mode A.\n"
    "\n"
    "router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const body     = req.body || {};\n"
    "\n"
    "  const result = await createClient(supabase, vendor.id, {\n"
    "    name:  body.name  || null,\n"
    "    phone: body.phone || null,\n"
    "    email: body.email || null,\n"
    "    notes: body.notes || null,\n"
    "  });\n"
    "\n"
    "  if (!result.ok) return errRes(res, 400, result.error);\n"
    "  return okRes(res, { client: result.client, deduped: result.deduped, restored: result.restored || false });\n"
    "}));\n"
    "\n"
    "// ─── PATCH /api/v2/vendor/clients/:clientId ────────────────────────────\n"
    "//\n"
    "// Partial update. Phone collision returns 409.\n"
    "// Auth: requireAuth. resolveVendor mode C via clients table.\n"
    "\n"
    "router.patch('/:clientId', requireAuth, resolveVendor({ paramName: 'clientId', via: 'clients' }), asyncHandler(async (req, res) => {\n"
    "  const supabase  = req.app.locals.supabase;\n"
    "  const vendor    = req.vendor;\n"
    "  const clientId  = req.params.clientId;\n"
    "  const body      = req.body || {};\n"
    "\n"
    "  const result = await updateClient(supabase, vendor.id, clientId, body);\n"
    "  if (!result.ok && result.code === 'PHONE_COLLISION') return errRes(res, 409, result.error, result.code);\n"
    "  if (!result.ok) return errRes(res, 400, result.error);\n"
    "  return okRes(res, { client: result.client });\n"
    "}));\n"
    "\n"
    "// ─── DELETE /api/v2/vendor/clients/:clientId ───────────────────────────\n"
    "//\n"
    "// Soft delete (sets deleted_at). No API contract change for callers.\n"
    "// leads.client_id and invoices.client_id links are preserved for history.\n"
    "// Auth: requireAuth. resolveVendor mode C via clients table.\n"
    "\n"
    "router.delete('/:clientId', requireAuth, resolveVendor({ paramName: 'clientId', via: 'clients' }), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const clientId = req.params.clientId;\n"
    "\n"
    "  const result = await deleteClient(supabase, vendor.id, clientId);\n"
    "  if (!result.ok) return errRes(res, 404, result.error);\n"
    "  return okRes(res, { deleted: true });\n"
    "}));"
)

content = content.replace(old_delete, new_handlers, 1)

with open('src/api/vendor/clients.js', 'w') as f:
    f.write(content)

print('Patched: src/api/vendor/clients.js')
