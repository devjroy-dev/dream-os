'use strict';
// src/api/middleware/resolveAgent.js
// Vendor Suit, Phase 3-A — the identity bridge (Express middleware).
//
// Resolves the authenticated vendor to their engine agent, provisioning the
// engine.users + engine.agents rows on first touch. As of 5-A the get-or-create
// lives in agentBridge.js (shared with the WhatsApp webhook); this is the thin
// Express wrapper. Must run AFTER requireAuth + resolveVendor (needs
// req.auth.user_id + req.vendor). Attaches req.agentId and req.agentPreset.
const { resolveAgentForVendor } = require('./agentBridge');

function resolveAgent() {
  return async function resolveAgentMiddleware(req, res, next) {
    try {
      const uid = req.auth && req.auth.user_id;
      const v   = req.vendor;
      if (!uid || !v) {
        return res.status(401).json({ ok: false, error: 'Unauthorized.' });
      }
      const { agentId, agentPreset } =
        await resolveAgentForVendor(req.app.locals.supabase, v, uid);
      req.agentId     = agentId;
      req.agentPreset = agentPreset;
      return next();
    } catch (e) {
      console.error('[resolveAgent]', (e && e.message) || e);
      return res.status(500).json({ ok: false, error: 'Agent resolution failed.' });
    }
  };
}

module.exports = resolveAgent;
