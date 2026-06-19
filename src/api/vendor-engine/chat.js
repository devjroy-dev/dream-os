'use strict';
// src/api/vendor-engine/chat.js
// Vendor Suit, Phase 3-D — the engine-backed chat door. Victor comes online.
//
// This is the payoff of the port: the vendor talks to the advisor, who reasons
// with the standing SMM lens (and the category Codex, once a real MUA/planner
// hits it — Phase 2), dispatches Donna for any filing, and replies in his own
// voice. The door is a thin wrapper; runTurn owns everything — its own Anthropic
// client (ANTHROPIC_API_KEY, already in dream-os's env for Myra), the rolling
// per-agent conversation (memory persists with no work here), the owner briefing.
//
// Unlike the 3-C form doors, THIS is the model path: real Anthropic calls (Victor,
// plus Donna if dispatched). A turn takes seconds and costs tokens. The door just
// awaits runTurn, exactly as the Myra handler awaited its loop.
//
//   POST /api/v2/vendor-e/chat                 { message }  -> one advisor turn
//   GET  /api/v2/vendor-e/chat/history/:vendorId           -> display-only scrollback
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
// The compiled engine loop (Phase 0 landed src/engine; dist is built on deploy).
const { runTurn } = require('../../engine/dist/core/loop');

// POST /chat — one advisor turn. Vendor comes from the JWT (no :vendorId param),
// matching the Myra chat contract. ai_primer / mode are accepted and ignored:
// the engine runs advisory Victor and has no edit-priming mechanism (the Myra
// handler likewise accepted-and-ignored its `history` field).
router.post('/', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  const body    = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ ok: false, error: 'message is required.' });
  try {
    const result    = await runTurn({ agentId: req.agentId, message });
    // Contract: tool_calls is names only (no internal input/result). refresh tells
    // the PWA to repaint the cabinet when the turn actually filed something.
    const toolNames = (result.tool_calls || []).map((t) => t.name);
    return res.json({
      ok: true,
      reply: result.reply,
      tool_calls: toolNames,
      refresh: toolNames.length > 0,
    });
  } catch (e) {
    console.error('[vendor-e chat]', e.message);
    return res.status(500).json({ ok: false, error: 'Chat failed.' });
  }
});

// GET /chat/history/:vendorId — display-only scrollback so the PWA chat shows the
// recent transcript on open instead of a blank screen. NOT agent memory (the
// engine reads history itself). Reads the agent's most-recent conversation (the
// one runTurn reuses within the session window), last N messages, mapped to the
// PWA shape: engine role 'user'->'user', 'assistant'->'ai' ('tool' rows skipped).
router.get('/history/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  const eng   = req.app.locals.supabase.schema('engine');
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  try {
    const { data: convo } = await eng.from('conversations')
      .select('id').eq('agent_id', req.agentId)
      .order('last_active_at', { ascending: false }).limit(1).maybeSingle();
    if (!convo) return res.json({ ok: true, messages: [] });

    const { data: rows, error } = await eng.from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convo.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[vendor-e chat/history] query error:', error.message);
      return res.status(500).json({ ok: false, error: 'Could not load history.' });
    }

    const messages = (rows || [])
      .reverse()
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'ai', text: m.content, at: m.created_at }));
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error('[vendor-e chat/history]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not load history.' });
  }
});

module.exports = router;
