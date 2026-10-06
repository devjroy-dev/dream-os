'use strict';
// src/api/middleware/requirePartner.js · CE-47 · PTN-A1 · the partner lane's door.
// Verifies the partner session (its own secret), then RE-READS membership and the org on every request, so removing a
// member or blocking a partner takes effect on the next call whatever the token says. A blocked partner is refused.
// requirePartner({ orgRequired }) : orgRequired=false lets a signed-in person with no organisation yet reach /me and /org.
const { verifyPartnerSession, partnerTokenFrom } = require('../../lib/partners/partnerSession');
const { membershipFor } = require('../../lib/partners/orgs');

const BLOCKED = 'This partner account is blocked. Write to partners@thedreamwedding.in.';

module.exports = function requirePartner({ orgRequired = true } = {}) {
  return async function (req, res, next) {
    try {
      const s = verifyPartnerSession(partnerTokenFrom(req));
      if (!s) return res.status(401).json({ ok: false, error: 'Please sign in again.', code: 'PARTNER_SIGNIN' });
      const m = await membershipFor(req.app.locals.supabase, s.user_id);
      if (m && m.org.check_state === 'blocked') return res.status(403).json({ ok: false, error: BLOCKED, code: 'PARTNER_BLOCKED' });
      if (orgRequired && !m) return res.status(409).json({ ok: false, error: 'Add your organisation first.', code: 'PARTNER_NO_ORG' });
      req.partnerUser = { id: s.user_id };
      req.partner = m ? { id: m.org.id, role: m.role, org: m.org } : null;
      return next();
    } catch (e) {
      console.error('[partner] door error:', e.message);
      return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
    }
  };
};
module.exports.BLOCKED = BLOCKED;
