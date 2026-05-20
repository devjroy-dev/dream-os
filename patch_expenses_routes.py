import os

with open('src/api/vendor/expenses.js', 'r') as f:
    content = f.read()

# 1. Add new requires
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
    "const { createExpense, updateExpense, deleteExpense } = require('../../lib/vendor/expenses');"
)
content = content.replace(old_req, new_req, 1)

# 2. Add deleted_at IS NULL filter to the GET list query
content = content.replace(
    "    supabase.from('expenses')\n"
    "      .select('id, description, amount, category, expense_date, client_name, created_at')\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .order('created_at', { ascending: false })\n"
    "      .range(offset, offset + limit - 1),\n"
    "\n"
    "    supabase.from('expenses')\n"
    "      .select('*', { count: 'exact', head: true })\n"
    "      .eq('vendor_id', vendor.id),\n"
    "\n"
    "    supabase.from('expenses')\n"
    "      .select('amount')\n"
    "      .eq('vendor_id', vendor.id),",

    "    supabase.from('expenses')\n"
    "      .select('id, description, amount, category, expense_date, client_name, created_at')\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .is('deleted_at', null)\n"
    "      .order('created_at', { ascending: false })\n"
    "      .range(offset, offset + limit - 1),\n"
    "\n"
    "    supabase.from('expenses')\n"
    "      .select('*', { count: 'exact', head: true })\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .is('deleted_at', null),\n"
    "\n"
    "    supabase.from('expenses')\n"
    "      .select('amount')\n"
    "      .eq('vendor_id', vendor.id)\n"
    "      .is('deleted_at', null),",
    1
)

# 3. Replace hard-delete handler with soft delete + add POST + PATCH
old_delete = (
    "// DELETE /:expenseId\n"
    "// Hard delete — expenses have no downstream financial implications.\n"
    "router.delete('/:expenseId', requireAuth, async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const { user_id } = req.auth;\n"
    "  const { expenseId } = req.params;\n"
    "\n"
    "  const { data: vendorRow } = await supabase.from('vendors').select('id').eq('user_id', user_id).maybeSingle();\n"
    "  if (!vendorRow) return res.status(403).json({ ok: false, error: 'Vendor not found.' });\n"
    "\n"
    "  const { data: expense, error: fetchErr } = await supabase\n"
    "    .from('expenses').select('id, amount, category, description')\n"
    "    .eq('id', expenseId).eq('vendor_id', vendorRow.id).single();\n"
    "\n"
    "  if (fetchErr?.code === 'PGRST116' || !expense) return res.status(404).json({ ok: false, error: 'Expense not found.' });\n"
    "  if (fetchErr) return res.status(500).json({ ok: false, error: fetchErr.message });\n"
    "\n"
    "  const { error: delErr } = await supabase\n"
    "    .from('expenses').delete()\n"
    "    .eq('id', expenseId).eq('vendor_id', vendorRow.id);\n"
    "\n"
    "  if (delErr) return res.status(500).json({ ok: false, error: delErr.message });\n"
    "\n"
    "  const label = expense.description || expense.category || 'expense';\n"
    "  console.log(`[expenses:delete] \"${label}\" deleted by vendor ${vendorRow.id}`);\n"
    "  return res.json({ ok: true, message: `Rs ${expense.amount} ${label} deleted.` });\n"
    "});"
)

new_handlers = (
    "// ─── POST /api/v2/vendor/expenses ─────────────────────────────────────\n"
    "//\n"
    "// Log a new expense.\n"
    "// Auth: requireAuth. resolveVendor mode A.\n"
    "\n"
    "router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const body     = req.body || {};\n"
    "\n"
    "  const result = await createExpense(supabase, vendor.id, {\n"
    "    amount:         body.amount         || null,\n"
    "    category:       body.category       || null,\n"
    "    description:    body.description    || null,\n"
    "    expense_date:   body.expense_date   || null,\n"
    "    client_name:    body.client_name    || null,\n"
    "    linked_lead_id: body.linked_lead_id || null,\n"
    "    notes:          body.notes          || null,\n"
    "  });\n"
    "\n"
    "  if (!result.ok) return errRes(res, 400, result.error);\n"
    "  return okRes(res, { expense: result.expense });\n"
    "}));\n"
    "\n"
    "// ─── PATCH /api/v2/vendor/expenses/:expenseId ─────────────────────────\n"
    "//\n"
    "// Partial update.\n"
    "// Auth: requireAuth. resolveVendor mode C via expenses table.\n"
    "\n"
    "router.patch('/:expenseId', requireAuth, resolveVendor({ paramName: 'expenseId', via: 'expenses' }), asyncHandler(async (req, res) => {\n"
    "  const supabase   = req.app.locals.supabase;\n"
    "  const vendor     = req.vendor;\n"
    "  const expenseId  = req.params.expenseId;\n"
    "  const body       = req.body || {};\n"
    "\n"
    "  const result = await updateExpense(supabase, vendor.id, expenseId, body);\n"
    "  if (!result.ok) return errRes(res, 400, result.error);\n"
    "  return okRes(res, { expense: result.expense });\n"
    "}));\n"
    "\n"
    "// ─── DELETE /api/v2/vendor/expenses/:expenseId ────────────────────────\n"
    "//\n"
    "// Soft delete.\n"
    "// Auth: requireAuth. resolveVendor mode C via expenses table.\n"
    "\n"
    "router.delete('/:expenseId', requireAuth, resolveVendor({ paramName: 'expenseId', via: 'expenses' }), asyncHandler(async (req, res) => {\n"
    "  const supabase  = req.app.locals.supabase;\n"
    "  const vendor    = req.vendor;\n"
    "  const expenseId = req.params.expenseId;\n"
    "\n"
    "  const result = await deleteExpense(supabase, vendor.id, expenseId);\n"
    "  if (!result.ok) return errRes(res, 404, result.error);\n"
    "  return okRes(res, { deleted: true });\n"
    "}));"
)

content = content.replace(old_delete, new_handlers, 1)

with open('src/api/vendor/expenses.js', 'w') as f:
    f.write(content)

print('Patched: src/api/vendor/expenses.js')
