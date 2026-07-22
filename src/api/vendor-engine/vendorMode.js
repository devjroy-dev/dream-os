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

// ── TDW_04.5 F-04.98 C3: THE FRESH-THREAD WORD ──────────────────────────────────────────
// The disease: before this, a WA vendor's ONLY new-thread button was the 30-minute timeout
// or a mode flip he did not want. The chip has POST /thread/fresh; WhatsApp had nothing.
// This word is that button, and it is deliberately NOT a mode word: MODE_WORDS keeps its
// ('advisor'|'business'|null) contract uncorrupted and matchModeWord stays byte-identical
// (CE ruling F1). Sibling predicate, same purity, same bench pattern.
const FRESH_WORD = 'fresh';

// Returns true only on the whole-message word, trimmed, case-insensitive. Pure — benched
// directly. "fresh" alone is the button; "start fresh tomorrow" is a REAL TURN and falls
// through, the same both-ways guard matchModeWord carries.
function matchFreshWord(body) {
  return String(body == null ? '' : body).trim().toLowerCase() === FRESH_WORD;
}

// MINTED — FOUNDER VETO (vendor-facing). SCRUBBED class: names the reset, carries ZERO
// cabinet/thread content. ONE line, never a changed/noop split (CE ruling F2a): the mode
// words need that split because "switched" would be a FALSE STATE CLAIM on a no-op, while
// this line states a truth on a live room and an already-fresh room alike. abandonActiveThread
// is idempotent by construction (chat.js: nothing active -> { ok:true, closed:null }), so the
// honest word here is the same word either way. Mimicking the split would be pattern without
// the pattern's reason — LD-5's discipline applied to mechanics.
const FRESH_THREAD_LINE = 'Fresh thread. What\u2019s on your mind?';

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

  // TDW_06 P7c (F-06.8 PWA seam): the flip goes through the SHARED applyModeFlip — the SAME
  // home the WA words call — so both seams change-detect and chain the fresh thread identically
  // by construction (never a duplicated bare update). The agent is the reverse-bridge one
  // (req.agentId), NEVER the client's. thread_reset === true iff a REAL flip occurred; the PWA
  // renders the Fresh-thread seam off that boolean, and a no-op (already in that mode) resets
  // nothing and renders nothing.
  try {
    const result = await applyModeFlip(req.app.locals.supabase, req.agentId, mode);
    return okRes(res, { victor_mode: result.mode, thread_reset: result.changed });
  } catch (e) {
    console.warn('[vendor-e mode PATCH]', e.message);
    return errRes(res, 500, 'Could not update victor_mode.');
  }
}));

module.exports = router;
module.exports.readAgentVictorMode = readAgentVictorMode; // TDW_06 P6d: benched read helper
module.exports.matchModeWord       = matchModeWord;       // TDW_06 P7b: WA mode-word matcher
module.exports.applyModeFlip       = applyModeFlip;       // TDW_06 P7b: WA flip (write + fresh thread)
module.exports.MODE_FLIP_LINES     = MODE_FLIP_LINES;     // TDW_06 P7b: minted confirmations (founder veto)
module.exports.matchFreshWord      = matchFreshWord;      // TDW_04.5 F-04.98 C3: WA fresh-thread matcher
module.exports.FRESH_THREAD_LINE   = FRESH_THREAD_LINE;   // TDW_04.5 F-04.98 C3: minted confirmation (founder veto)
