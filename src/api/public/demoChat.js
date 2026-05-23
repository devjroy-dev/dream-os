// src/api/public/demoChat.js
// Demo chat proxy — calls Anthropic on behalf of demo session
// PUBLIC — no auth. API key stays server-side.
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const Anthropic    = require('@anthropic-ai/sdk').default;

const anthropic = new Anthropic({
  apiKey:     process.env.ANTHROPIC_API_KEY,
  timeout:    15000,
  maxRetries: 0,
});

// POST /api/v2/demo/chat
router.post('/', asyncHandler(async (req, res) => {
  const { system, messages, handle } = req.body;

  if (!system || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ ok: false, error: 'system and messages required' });
  }

  if (messages.length > 20) {
    return res.status(429).json({ ok: false, error: 'Demo session limit reached.' });
  }

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system,
    messages:   messages.slice(-10),
  });

  const text = response.content?.[0]?.text ?? 'Something went wrong. Try again.';
  return res.json({ ok: true, text });
}));

module.exports = router;
