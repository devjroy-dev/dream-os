// src/api/middleware/resolveVendor.js
// Vendor ownership middleware — resolves the authenticated user to a vendor row
// and (optionally) asserts ownership of a :vendorId route param.
//
// Must run AFTER requireAuth.
//
// Two modes:
//
//   resolveVendor()
//     No URL param required. Looks up vendors WHERE user_id = req.auth.user_id.
//     On success: attaches req.vendor and calls next().
//     On no match: 403 forbidden.
//     Use for endpoints like GET /api/v2/vendor/me where the vendor is
//     determined entirely by the JWT.
//
//   resolveVendor({ paramName: 'vendorId' })
//     Looks up vendor by JWT, then asserts vendor.id === req.params[paramName].
//     Mismatch → 403 forbidden. Missing param → 400.
//     Use for endpoints like GET /api/v2/vendor/today/:vendorId.
//
//   resolveVendor({ paramName: 'leadId', via: 'leads' })
//     Looks up vendor by JWT, then looks up the row at req.params[paramName]
//     in the `via` table, then asserts that row's vendor_id matches the
//     authenticated vendor's id.
//     Use for endpoints like PATCH /api/v2/vendor/leads/:leadId/state
//     where the URL param is not a vendorId but a child row owned by the vendor.
//     Missing row → 404. Wrong vendor → 403.
//
// On every success path: req.vendor is the full vendors row.

'use strict';

function resolveVendor(opts = {}) {
  const paramName = opts.paramName || null;
  const via       = opts.via       || null;

  return async function resolveVendorMiddleware(req, res, next) {
    const supabase = req.app.locals.supabase;
    const userId   = req.auth && req.auth.user_id;

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized.' });
    }

    // Step 1 — resolve vendor by JWT user_id.
    const { data: vendor, error: vendorErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (vendorErr) {
      console.error('[resolveVendor] supabase error:', vendorErr.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }

    if (!vendor) {
      return res.status(403).json({ ok: false, error: 'Not a vendor account.' });
    }

    // Mode A — no param check needed.
    if (!paramName) {
      req.vendor = vendor;
      return next();
    }

    const paramValue = req.params[paramName];
    if (!paramValue) {
      return res.status(400).json({ ok: false, error: `Missing ${paramName}.` });
    }

    // Mode B — direct vendorId match.
    if (!via) {
      if (paramValue !== vendor.id) {
        return res.status(403).json({ ok: false, error: 'Forbidden.' });
      }
      req.vendor = vendor;
      return next();
    }

    // Mode C — child row ownership check.
    const { data: row, error: rowErr } = await supabase
      .from(via)
      .select('id, vendor_id')
      .eq('id', paramValue)
      .maybeSingle();

    if (rowErr) {
      console.error(`[resolveVendor] ${via} lookup error:`, rowErr.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }

    if (!row) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }

    if (row.vendor_id !== vendor.id) {
      return res.status(403).json({ ok: false, error: 'Forbidden.' });
    }

    req.vendor      = vendor;
    req.resolvedRow = row;
    return next();
  };
}

module.exports = resolveVendor;
