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
const { abandonActiveThread } = require('./chat'); // TDW_06 P7b: the shared F-06.8 fresh-thread seam

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

// ── TDW_06 P7b (S-10 WA words + F-06.8): the mode words on WhatsApp — the WA twin of the chip ──
// Intercepted PRE-ENGINE (index.js), exact WHOLE-MESSAGE match, trimmed, case-insensitive,
// "advisor mode" / "business mode" ONLY (a message that merely CONTAINS the words is a real
// message for Victor, never a flip). The write is engine.agents.victor_mode by the
// SERVER-RESOLVED agentId — the SAME path the PATCH door uses. On an ACTUAL change it chains
// the fresh-thread seam so the flipped room opens clean (F-06.8); a no-op flip confirms
// without touching the thread (the idempotency the always-flips chip does not need but the
// absolute WA word does — texting your current mode must not nuke a live thread).
const MODE_WORDS = { 'advisor mode': 'advisor', 'business mode': 'business' };

// Returns 'advisor' | 'business' | null. Pure — benched directly.
function matchModeWord(body) {
  const k = String(body == null ? '' : body).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(MODE_WORDS, k) ? MODE_WORDS[k] : null;
}

// MINTED — FOUNDER VETO (the WA flip-confirmation words). SCRUBBED: they name the flip and
// carry ZERO cabinet/thread content. 'changed' also signals the fresh thread so the vendor
// knows the room reset; 'noop' is the honest "already there" (never a false "switched").
const MODE_FLIP_LINES = {
  advisor:  {
    changed: 'Advisor mode \u2014 fresh thread. On brand and content now; the ledger\u2019s paused till you flip back.',
    noop:    'Already in advisor mode.',
  },
  business: {
    changed: 'Business mode \u2014 fresh thread. Back on the books.',
    noop:    'Already in business mode.',
  },
};

// Read current -> write only on a real change -> chain the fresh thread only on a real change.
// supabase + agentId are the SERVER-RESOLVED ones (index.js resolves the agent from the vendor).
async function applyModeFlip(supabase, agentId, target) {
  const current = await readAgentVictorMode(supabase, agentId);
  if (current === target) return { changed: false, mode: current };
  const { error } = await supabase.schema('engine')
    .from('agents').update({ victor_mode: target }).eq('id', agentId);
  if (error) throw error;
  await abandonActiveThread(supabase, agentId); // F-06.8: the flipped room opens with zero prior-room turns
  return { changed: true, mode: target };
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
module.exports.matchModeWord       = matchModeWord;       // TDW_06 P7b: WA mode-word matcher
module.exports.applyModeFlip       = applyModeFlip;       // TDW_06 P7b: WA flip (write + fresh thread)
module.exports.MODE_FLIP_LINES     = MODE_FLIP_LINES;     // TDW_06 P7b: minted confirmations (founder veto)
