import os

with open('src/api/vendor/events.js', 'r') as f:
    content = f.read()

# 1. Add new requires after existing requires
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
    "const { createEvent, updateEvent, deleteEvent } = require('../../lib/vendor/events');"
)
content = content.replace(old_req, new_req, 1)

# 2. Add deleted_at IS NULL filter to the GET list query
content = content.replace(
    "  let listQuery = supabase.from('events')\n"
    "    .select('id, title, kind, event_date, event_time, state, linked_lead_id, notes')\n"
    "    .eq('vendor_id', vendor.id)\n"
    "    .gte('event_date', from)\n"
    "    .lte('event_date', to);",

    "  let listQuery = supabase.from('events')\n"
    "    .select('id, title, kind, event_date, event_time, state, linked_lead_id, notes')\n"
    "    .eq('vendor_id', vendor.id)\n"
    "    .is('deleted_at', null)\n"
    "    .gte('event_date', from)\n"
    "    .lte('event_date', to);",
    1
)
content = content.replace(
    "  let countQuery = supabase.from('events')\n"
    "    .select('*', { count: 'exact', head: true })\n"
    "    .eq('vendor_id', vendor.id)\n"
    "    .gte('event_date', from)\n"
    "    .lte('event_date', to);",

    "  let countQuery = supabase.from('events')\n"
    "    .select('*', { count: 'exact', head: true })\n"
    "    .eq('vendor_id', vendor.id)\n"
    "    .is('deleted_at', null)\n"
    "    .gte('event_date', from)\n"
    "    .lte('event_date', to);",
    1
)

# 3. Replace the existing cancel handler + add POST, PATCH, DELETE
old_cancel = (
    "// PATCH /:eventId/cancel\n"
    "// Direct cancel from list UI — no chat involved.\n"
    "router.patch('/:eventId/cancel', requireAuth, async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const { user_id } = req.auth;\n"
    "  const { eventId } = req.params;\n"
    "\n"
    "  const { data: vendorRow } = await supabase.from('vendors').select('id').eq('user_id', user_id).maybeSingle();\n"
    "  if (!vendorRow) return res.status(403).json({ ok: false, error: 'Vendor not found.' });\n"
    "\n"
    "  const { data: ev, error: fetchErr } = await supabase\n"
    "    .from('events').select('id, title, state')\n"
    "    .eq('id', eventId).eq('vendor_id', vendorRow.id).single();\n"
    "\n"
    "  if (fetchErr?.code === 'PGRST116' || !ev) return res.status(404).json({ ok: false, error: 'Event not found.' });\n"
    "  if (fetchErr) return res.status(500).json({ ok: false, error: fetchErr.message });\n"
    "  if (ev.state === 'cancelled') return res.json({ ok: true, already_cancelled: true, message: `\"${ev.title}\" was already cancelled.` });\n"
    "\n"
    "  const { error: cancelErr } = await supabase\n"
    "    .from('events').update({ state: 'cancelled' })\n"
    "    .eq('id', eventId).eq('vendor_id', vendorRow.id);\n"
    "\n"
    "  if (cancelErr) return res.status(500).json({ ok: false, error: cancelErr.message });\n"
    "\n"
    "  console.log(`[events:cancel] \"${ev.title}\" cancelled by vendor ${vendorRow.id}`);\n"
    "  return res.json({ ok: true, message: `\"${ev.title}\" cancelled.` });\n"
    "});"
)

new_handlers = (
    "// ─── PATCH /api/v2/vendor/events/:eventId/cancel ──────────────────────\n"
    "//\n"
    "// Direct cancel from list UI. Preserved for dreamai list page CRUD.\n"
    "// Auth: requireAuth. resolveVendor mode C via events table.\n"
    "\n"
    "router.patch('/:eventId/cancel', requireAuth, resolveVendor({ paramName: 'eventId', via: 'events' }), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const eventId  = req.params.eventId;\n"
    "\n"
    "  const { data: ev, error: fetchErr } = await supabase\n"
    "    .from('events').select('id, title, state')\n"
    "    .eq('id', eventId).eq('vendor_id', vendor.id).is('deleted_at', null).single();\n"
    "\n"
    "  if (fetchErr?.code === 'PGRST116' || !ev) return errRes(res, 404, 'Event not found.');\n"
    "  if (fetchErr) return errRes(res, 500, fetchErr.message);\n"
    "  if (ev.state === 'cancelled') return okRes(res, { already_cancelled: true });\n"
    "\n"
    "  const { error: cancelErr } = await supabase\n"
    "    .from('events').update({ state: 'cancelled' })\n"
    "    .eq('id', eventId).eq('vendor_id', vendor.id);\n"
    "\n"
    "  if (cancelErr) return errRes(res, 500, cancelErr.message);\n"
    "  console.log('[events:cancel] \"' + ev.title + '\" cancelled by vendor ' + vendor.id);\n"
    "  return okRes(res, { event: { id: eventId, state: 'cancelled' } });\n"
    "}));\n"
    "\n"
    "// ─── POST /api/v2/vendor/events ────────────────────────────────────────\n"
    "//\n"
    "// Create a new event. kind='task' for vendor todos.\n"
    "// Auth: requireAuth. resolveVendor mode A.\n"
    "\n"
    "router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const body     = req.body || {};\n"
    "\n"
    "  const result = await createEvent(supabase, vendor.id, {\n"
    "    title:          body.title          || null,\n"
    "    event_date:     body.event_date     || null,\n"
    "    event_time:     body.event_time     || null,\n"
    "    kind:           body.kind           || null,\n"
    "    linked_lead_id: body.linked_lead_id || null,\n"
    "    notes:          body.notes          || null,\n"
    "  });\n"
    "\n"
    "  if (!result.ok) return errRes(res, 400, result.error);\n"
    "  return okRes(res, { event: result.event });\n"
    "}));\n"
    "\n"
    "// ─── PATCH /api/v2/vendor/events/:eventId ─────────────────────────────\n"
    "//\n"
    "// Full field update. Does not change state — use /cancel for that.\n"
    "// Auth: requireAuth. resolveVendor mode C via events table.\n"
    "\n"
    "router.patch('/:eventId', requireAuth, resolveVendor({ paramName: 'eventId', via: 'events' }), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const eventId  = req.params.eventId;\n"
    "  const body     = req.body || {};\n"
    "\n"
    "  const result = await updateEvent(supabase, vendor.id, eventId, body);\n"
    "  if (!result.ok) return errRes(res, 400, result.error);\n"
    "  return okRes(res, { event: result.event });\n"
    "}));\n"
    "\n"
    "// ─── DELETE /api/v2/vendor/events/:eventId ────────────────────────────\n"
    "//\n"
    "// Soft delete. For events created in error. Distinct from cancel.\n"
    "// Auth: requireAuth. resolveVendor mode C via events table.\n"
    "\n"
    "router.delete('/:eventId', requireAuth, resolveVendor({ paramName: 'eventId', via: 'events' }), asyncHandler(async (req, res) => {\n"
    "  const supabase = req.app.locals.supabase;\n"
    "  const vendor   = req.vendor;\n"
    "  const eventId  = req.params.eventId;\n"
    "\n"
    "  const result = await deleteEvent(supabase, vendor.id, eventId);\n"
    "  if (!result.ok) return errRes(res, 404, result.error);\n"
    "  return okRes(res, { deleted: true });\n"
    "}));"
)

content = content.replace(old_cancel, new_handlers, 1)

with open('src/api/vendor/events.js', 'w') as f:
    f.write(content)

print('Patched: src/api/vendor/events.js')
