'use strict';
// src/api/vendor-engine/vendorMode.js
// TDW_06 P6b (R-1, CE-ratified): the victor_mode write door.
//
// The Business·Advisor flip is server-persisted on engine.agents.victor_mode. The agent is
// the SERVER-RESOLVED one (resolveAgent — the reverse bridge from the authenticated vendor);
// this endpoint NEVER accepts an agentId from the client. Allowlist = ['victor_mode']; the
// value-guard mirrors 0080's CHECK (victor_mode IN ('business','advisor')). me.js is the
// PATTERN (allowlist + validate-then-update + reject-not-silently); the HOME is engine.agents,
// not public.vendors — reached via supabase.schema('engine') (the today.js:37 pattern).
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const ALLOWED_FIELDS = ['victor_mode'];
const VICTOR_MODES   = ['business', 'advisor']; // mirrors 0080's CHECK exactly

// Read the agent's victor_mode, defaulting to 'business' (0080's NOT NULL default) on a
// miss. Exported for the bench. Scoped to the SERVER-RESOLVED agentId by the caller.
async function readAgentVictorMode(supabase, agentId) {
  const { data, error } = await supabase.schema('engine')
    .from('agents').select('victor_mode').eq('id', agentId).maybeSingle();
  if (error) throw error;
  return (data && data.victor_mode) === 'advisor' ? 'advisor' : 'business';
}

// GET /api/v2/vendor-e/mode -> { victor_mode } — the chip reads its current state here.
router.get('/', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  try {
    const victor_mode = await readAgentVictorMode(req.app.locals.supabase, req.agentId);
    return okRes(res, { victor_mode });
  } catch (e) {
    return errRes(res, 500, 'Could not read victor_mode.');
  }
}));

// PATCH /api/v2/vendor-e/mode   body: { "victor_mode": "business" | "advisor" }
router.patch('/', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  const body = req.body || {};

  // allowlist — any field that is not victor_mode is a 400, never a silent ignore of a typo.
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.includes(key)) {
      return errRes(res, 400, "Field '" + key + "' is not writable here.", 'FIELD_NOT_ALLOWED');
    }
  }

  const mode = body.victor_mode;
  if (mode === undefined) return errRes(res, 400, 'victor_mode is required.');
  if (!VICTOR_MODES.includes(mode)) {
    return errRes(res, 400, 'victor_mode must be one of: ' + VICTOR_MODES.join(', ') + '.', 'INVALID_VICTOR_MODE');
  }

  // The agent is the reverse-bridge one (req.agentId), NEVER the client's — scoped write.
  const { error } = await req.app.locals.supabase.schema('engine')
    .from('agents').update({ victor_mode: mode }).eq('id', req.agentId);
  if (error) return errRes(res, 500, 'Could not update victor_mode.');

  return okRes(res, { victor_mode: mode });
}));

module.exports = router;
module.exports.readAgentVictorMode = readAgentVictorMode; // TDW_06 P6d: benched read helper
