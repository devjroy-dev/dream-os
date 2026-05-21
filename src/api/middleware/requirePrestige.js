// src/api/middleware/requirePrestige.js
// Tier gate for Studio Suite endpoints.
// Must run AFTER requireAuth + resolveVendor().
// Returns 403 TIER_PRESTIGE_REQUIRED for non-Prestige vendors.
'use strict';

function requirePrestige(req, res, next) {
  const vendor = req.vendor;
  if (!vendor) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }
  if (vendor.tier !== 'prestige') {
    return res.status(403).json({
      ok:    false,
      error: 'Studio Suite is for Prestige vendors only. Contact Swati for an invite.',
      code:  'TIER_PRESTIGE_REQUIRED',
    });
  }
  next();
}

module.exports = requirePrestige;
