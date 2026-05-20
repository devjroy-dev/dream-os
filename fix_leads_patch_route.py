# fix_leads_patch_route.py
# Adds PATCH /leads/:leadId (full field update) to dream-os src/api/vendor/leads.js
# Run in the dream-os Codespace terminal.

path = 'src/api/vendor/leads.js'
with open(path, 'r') as f:
    src = f.read()

if "router.patch('/:leadId'," in src:
    print('SKIP: PATCH /:leadId already present')
    raise SystemExit(0)

handler = """
// ─── PATCH /api/v2/vendor/leads/:leadId ────────────────────────────────
//
// Full field update. Distinct from PATCH /:leadId/state.
// State changes still go through the state endpoint so the notes audit
// trail stays consistent.
// Auth: requireAuth. resolveVendor mode C via leads table.

router.patch('/:leadId', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const leadId   = req.params.leadId;
  const body     = req.body || {};

  const result = await updateLead(supabase, vendor.id, leadId, body);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { lead: result.lead });
}));

"""

needle = "module.exports = router;"
if needle not in src:
    print('ERROR: module.exports = router; not found'); raise SystemExit(1)

new_src = src.replace(needle, handler.lstrip() + "\n" + needle)
with open(path, 'w') as f:
    f.write(new_src)
print('OK: PATCH /:leadId added to leads.js')
