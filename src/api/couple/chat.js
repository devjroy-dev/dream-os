// src/api/couple/chat.js
// POST /api/v2/couple/chat — SSE streaming bridge to brideEngine.
// Mirrors src/api/vendor/chat.js with bride-specific changes.
//
// Auth: requireCoupleAuth (couple JWT).
// Model: claude-haiku-4-5-20251001. NEVER Sonnet.
// Engine: runBrideAgenticTurn from src/agent/brideEngine.js.
// MAX_ITERATIONS: 5 (same as WhatsApp bride agent).
//
// Key differences from vendor chat:
//   - No resolveVendor middleware — uses req.coupleUser from requireCoupleAuth
//   - couple_self conversation (couple_id set, vendor_id null)
//   - runBrideAgenticTurn returns full reply string (WhatsApp-first engine)
//   - We wrap output in SSE word-by-word — no refactor of brideEngine needed
//   - No ai_primer support (bride surface has no edit-context injection)
//   - Timeout: 30s (bride engine is simpler than vendor, 5 max iterations)
//
// RULE: Never modify brideEngine.js, brideSystemPrompt.js, or brideTools.js
// from this endpoint. The engine owns its voice, personality, and tools.

'use strict';

const express      = require('express');
const router       = express.Router();
const { runBrideAgenticTurn } = require('../../agent/brideEngine');

const TIMEOUT_MS = 30000;

router.post('/', async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;

  if (!anthropic) {
    console.error('[POST /couple/chat] anthropic client missing from app.locals');
    return res.status(500).json({ ok: false, error: 'Server misconfigured.' });
  }

  // ── Validate ───────────────────────────────────────────────────────
  const body    = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ ok: false, error: 'message is required.' });
  }

  const { id: userId, couple_id } = req.coupleUser;

  // ── Load couple row (brideEngine needs full couple object) ─────────
  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select('*')
    .eq('id', couple_id)
    .maybeSingle();

  if (coupleErr || !couple) {
    console.error('[POST /couple/chat] couple lookup error:', coupleErr?.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  // ── Load user row (brideEngine needs user object) ──────────────────
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !user) {
    console.error('[POST /couple/chat] user lookup error:', userErr?.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  // ── Find or create couple_self conversation ────────────────────────
  // couple_self: couple_id set, vendor_id null (XOR enforced at DB level).
  // One per couple — shared across WhatsApp and PWA surfaces.
  let conversation;
  {
    const { data: existing, error: convoErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('couple_id', couple_id)
      .eq('kind', 'couple_self')
      .maybeSingle();

    if (convoErr) {
      console.error('[POST /couple/chat] conversation lookup error:', convoErr.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }

    if (existing) {
      conversation = existing;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('conversations')
        .insert({
          couple_id,
          counterparty_user_id: user.id,
          counterparty_phone:   user.phone || null,
          kind:                 'couple_self',
          state:                'new',
          mode:                 'draft',
        })
        .select()
        .single();

      if (createErr || !created) {
        console.error('[POST /couple/chat] conversation create error:', createErr?.message);
        return res.status(500).json({ ok: false, error: 'Failed to start conversation.' });
      }
      conversation = created;
    }
  }

  // ── Persist inbound message ────────────────────────────────────────
  const { error: inboundErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'web',
      body:            message,
      sent_by:         'bride',
    });
  if (inboundErr) {
    console.error('[POST /couple/chat] inbound persist error:', inboundErr.message);
  }

  // ── SSE setup ──────────────────────────────────────────────────────
  const wantsStream = (req.headers['accept'] || '').includes('text/event-stream');

  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let streamDead = false;
    res.on('error', (err) => {
      streamDead = true;
      console.warn('[couple/chat SSE] stream error:', err.message);
    });

    function send(obj) {
      if (streamDead || res.writableEnded) return;
      try {
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      } catch (e) {
        streamDead = true;
        console.warn('[couple/chat SSE] write failed:', e.message);
      }
    }

    // ── Run bride engine with timeout ────────────────────────────────
    send({ type: 'thinking' });

    let result;
    try {
      const enginePromise = runBrideAgenticTurn({
        couple,
        user,
        conversation,
        inboundMessage: message,
        mediaContext:   null,
        supabase,
        anthropic,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
      );

      result = await Promise.race([enginePromise, timeoutPromise]);

    } catch (err) {
      console.error('[couple/chat SSE] engine error:', err.message);
      const isTimeout = err.message === 'timeout';
      send({ type: 'error', message: isTimeout ? 'Dream Ai took too long. Please try again.' : 'Something went wrong. Please try again.' });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // ── Stream reply word-by-word ─────────────────────────────────────
    // brideEngine returns a complete reply string (WhatsApp-first, not streaming).
    // We emit word-by-word for the same progressive feel as vendor chat.
    const replyText = result.reply || 'Got it.';
    const words = replyText.split(' ');

    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      send({ type: 'text_delta', text: chunk });
      await new Promise(r => setTimeout(r, 20));
    }

    const toolCallNames = Array.isArray(result.toolCalls)
      ? result.toolCalls.map(t => t && t.name).filter(Boolean)
      : [];

    send({ type: 'done', tool_calls: toolCallNames });
    res.write('data: [DONE]\n\n');
    res.end();

    // ── Persist after stream ends (try/catch — NEVER .catch()) ───────
    try {
      const { error: outErr } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'outbound',
        channel:         'web',
        body:            replyText,
        sent_by:         'agent',
        tool_calls:      result.toolCalls || [],
        model:           result.model        || null,
        input_tokens:    result.inputTokens  ?? null,
        output_tokens:   result.outputTokens ?? null,
        cost_usd:        result.costUsd      ?? null,
      });
      if (outErr) console.error('[couple/chat SSE] outbound persist error:', outErr.message);
    } catch (e) { console.error('[couple/chat SSE] outbound persist threw:', e.message); }

    try {
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
    } catch (e) { console.error('[couple/chat SSE] last_message_at threw:', e.message); }

    return;
  }

  // ── JSON fallback (non-streaming clients) ──────────────────────────
  let result;
  try {
    result = await runBrideAgenticTurn({
      couple,
      user,
      conversation,
      inboundMessage: message,
      mediaContext:   null,
      supabase,
      anthropic,
    });
  } catch (err) {
    console.error('[POST /couple/chat] engine error:', err.message);
    return res.status(500).json({ ok: false, error: 'Agent failed.' });
  }

  const replyText = result.reply || 'Got it.';

  try {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'outbound',
      channel:         'web',
      body:            replyText,
      sent_by:         'agent',
      tool_calls:      result.toolCalls || [],
      model:           result.model        || null,
      input_tokens:    result.inputTokens  ?? null,
      output_tokens:   result.outputTokens ?? null,
      cost_usd:        result.costUsd      ?? null,
    });
  } catch (e) { console.error('[POST /couple/chat] outbound persist threw:', e.message); }

  try {
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);
  } catch (e) { console.error('[POST /couple/chat] last_message_at threw:', e.message); }

  const toolCallNames = Array.isArray(result.toolCalls)
    ? result.toolCalls.map(t => t && t.name).filter(Boolean)
    : [];

  return res.json({ ok: true, reply: replyText, tool_calls: toolCallNames });
});

module.exports = router;
