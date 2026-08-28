// src/api/middleware/resolveVendor.js
// Vendor ownership middleware — resolves the authenticated user to a vendor row
// and (optionally) asserts ownership of a :vendorId route param.
//
// Must run AFTER requireAuth.
//
// ═══════════════════════════════════════════════════════════════════════════
// F-P3.9 CURE · R-P3.5.3 — WHY THIS HEADER NAMES NO LIST
// ═══════════════════════════════════════════════════════════════════════════
// THE PARAGRAPH THAT STOOD HERE NAMED `GET /api/v2/vendor/today/:vendorId` as
// mode 2's example. That address is still served — core.js:26 mounts it at
// src/api/vendor-engine/today.js — but the reader behind it is chartered to
// RETIRE at the §8.9 seam, and P3.5 has just shown its `open_leads_count` to be
// wrong by three rows in twelve on the founder's own account (F-P3.11.b: a
// NULL-stage binder and a fully-settled client both counted as open leads).
// Pointing the next reader at a dying reader is how a header starts lying
// without anyone editing it. Struck; mode 2's example is now `/cabinet`.
//
// AND IT NAMES NO ROLL-CALL. A header that lists its 36 consumers is the next
// stale header — F-09.50's class, the disease this estate deleted a whole file
// over. What is durable is the COMMAND, so the next reader derives the list at
// their own tip instead of trusting this one:
//
//   grep -rln "require(.*middleware/resolveVendor')" src --include=*.js
//
// At `aeca43f`, 2026-08-28, that returns **36 files** carrying **104 call
// sites** — 65 no-param, 20 `paramName`, 19 `paramName` + `via`. Every number
// re-derived by that command at the moment of writing, not carried from the
// relay: the seat's own first count of "48" was a MENTION count and included
// `src/lib/billing/tierFlip.js`'s unrelated function of the same name. A census
// keyed on a symbol counts homonyms; a census keyed on the import does not.
//
// ── THREE MODES ────────────────────────────────────────────────────────────
//
//   resolveVendor()
//     No URL param required. Looks up vendors WHERE user_id = req.auth.user_id.
//     On success: attaches req.vendor and calls next().
//     On no match: 403 forbidden.
//     The vendor is the JWT's and nothing else can name it.
//     VERIFIED LIVE: GET /api/v2/vendor/me
//       — src/api/vendor/me.js:47, mounted at core.js:25.
//
//   resolveVendor({ paramName: 'vendorId' })
//     Looks up vendor by JWT, then asserts vendor.id === req.params[paramName].
//     Mismatch → 403 forbidden. Missing param → 400.
//     The URL may name a vendor, but only to be checked against the token —
//     never to select one.
//     VERIFIED LIVE: GET /api/v2/vendor/cabinet/:vendorId
//       — src/api/vendor-engine/cabinet.js:30, mounted at core.js:44.
//
//   resolveVendor({ paramName: 'leadId', via: 'leads' })
//     Looks up vendor by JWT, then looks up the row at req.params[paramName]
//     in the `via` table, then asserts that row's vendor_id matches the
//     authenticated vendor's id. The URL param is a child row the vendor owns,
//     not a vendorId.
//     Missing row → 404. Wrong vendor → 403.
//     VERIFIED LIVE: PATCH /api/v2/vendor/leads/:leadId/state
//       — src/api/vendor/leads.js:365, mounted at core.js:37.
//
// On every success path: req.vendor is the full vendors row.

'use strict';
const { resolveUsersId } = require('../../lib/resolveUsersId');

function resolveVendor(opts = {}) {
  const paramName = opts.paramName || null;
  const via       = opts.via       || null;

  return async function resolveVendorMiddleware(req, res, next) {
    const supabase = req.app.locals.supabase;
    const userId   = req.auth && req.auth.user_id;

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized.' });
    }

    // Step 1 — map the Supabase auth identity to public.users.id, then resolve the vendor.
    const usersId = await resolveUsersId(supabase, userId);
    const { data: vendor, error: vendorErr } = usersId
      ? await supabase.from('vendors').select('*').eq('user_id', usersId).maybeSingle()
      : { data: null, error: null };

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
