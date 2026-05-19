// src/api/vendor/chat.js
// POST /api/v2/vendor/chat
// Auth: vendor JWT.
// Purpose: DreamAI PWA chat — runs one vendor agent turn triggered from the web surface.
//
// Request body:
//   { vendor_id: uuid, message: string, history?: [{role, content}] }
//
// Response (JSON, non-streaming in P2-6a — contract permits "streaming SSE or JSON"):
//   { ok: true, reply: string, tool_calls: string[] }
//
// Architectural notes:
//
// 1. The same vendor agent runs on both surfaces.
//    We invoke runAgenticTurn from src/agent/engine.js — the same function the
//    WhatsApp handler calls in src/index.js. No duplication, no reimplementation.
//
// 2. WhatsApp and PWA share one conversation per vendor.
//    Both surfaces use the kind='vendor_self' conversation row. This means a
//    vendor who types something on WhatsApp can ask a follow-up on the PWA and
//    the agent remembers — same `conversations` row, same persisted history.
//    "One mind, two surfaces."
//
// 3. Messages are persisted with channel='web'.
//    The engine fetches history from the messages table directly. By persisting
//    every PWA turn, the agent's snapshot stays accurate across sessions and
//    across surfaces.
//
// 4. The contract's `history` field is accepted but not used.
//    The engine reads from the persisted messages table, not from a passed
//    history array. We accept the field gracefully — sending it does no harm,
//    omitting it does no harm. This kept the contract simple for the frontend
//    while letting the backend own conversation memory.
//
// 5. tool_calls returned as array of names only.
//    The audit trail engine.js produces includes input + result per call,
//    which is internal detail. The contract returns only names — useful for
//    "the agent did X, Y" surface affordances without leaking tool internals.
//
// 6. Cross-surface notification suppression:
//    Some agent tools (e.g. record_payment) send WhatsApp confirmation messages
//    via sendWhatsApp() during their execution. The PWA chat endpoint passes
//    channel:'web' into runAgenticTurn, which propagates through executeTool
//    and suppresses those out-of-band WhatsApp sends. The surface that
//    initiated the action owns the confirmation — PWA replies appear in the
//    PWA chat, WhatsApp replies appear in WhatsApp, no cross-channel leakage.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const { runAgenticTurn } = require('../../agent/engine');

router.post('/', requireAuth, resolveVendor(), async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;
  const vendor    = req.vendor;

  if (!anthropic) {
    console.error('[POST /vendor/chat] anthropic client missing from app.locals — check src/index.js');
    return res.status(500).json({ ok: false, error: 'Server misconfigured.' });
  }

  // ── Validate request body ──────────────────────────────────────────
  const body     = req.body || {};
  const message  = typeof body.message === 'string' ? body.message.trim() : '';
  // ai_primer: the context question the PWA injected ("What would you like to
  // change about invoice X?"). Persisted as an assistant message before the
  // vendor's reply so the engine sees full edit context in DB history.
  const aiPrimer = typeof body.ai_primer === 'string' ? body.ai_primer.trim() : '';

  if (body.vendor_id && body.vendor_id !== vendor.id) {
    return res.status(403).json({ ok: false, error: 'vendor_id mismatch with session.' });
  }

  if (!message) {
    return res.status(400).json({ ok: false, error: 'message is required.' });
  }

  // ── Load vendor's user row (the agent expects { user } as input) ───
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', vendor.user_id)
    .maybeSingle();

  if (userErr || !user) {
    console.error('[POST /vendor/chat] user lookup error:', userErr?.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  // ── Find or create the vendor_self conversation ────────────────────
  // Mirrors src/index.js lines 692-712 exactly so both surfaces use the same row.
  let conversation;
  {
    const { data: existingConvo, error: convoErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('kind', 'vendor_self')
      .maybeSingle();

    if (convoErr) {
      console.error('[POST /vendor/chat] conversation lookup error:', convoErr.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }

    if (existingConvo) {
      conversation = existingConvo;
    } else {
      const { data: newConvo, error: createErr } = await supabase
        .from('conversations')
        .insert({
          vendor_id:            vendor.id,
          counterparty_user_id: user.id,
          counterparty_phone:   user.phone,
          kind:                 'vendor_self',
          state:                'new',
          mode:                 'draft',
        })
        .select()
        .single();
      if (createErr || !newConvo) {
        console.error('[POST /vendor/chat] conversation create error:', createErr?.message);
        return res.status(500).json({ ok: false, error: 'Failed to start conversation.' });
      }
      conversation = newConvo;
    }
  }

  // ── Persist ai_primer as synthetic assistant message (edit context) ─
  // The PWA injects a context question ("What would you like to change about
  // invoice TDW/DEV550/03 for Priya?") as a synthetic AI message. It never
  // reaches the backend on its own. We persist it here so the engine reads it
  // from DB history and gives a targeted response, not a generic one.
  if (aiPrimer) {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'outbound',
      channel:         'web',
      body:            aiPrimer,
      sent_by:         'agent',
    });
  }

  // ── Persist inbound message ────────────────────────────────────────
  const { error: inboundErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'web',
      body:            message,
      sent_by:         'vendor',
    });
  if (inboundErr) {
    console.error('[POST /vendor/chat] inbound persist error:', inboundErr.message);
  }

  // ── Run the agent turn ─────────────────────────────────────────────
  let result;
  try {
    result = await runAgenticTurn({
      vendor,
      user,
      conversation,
      inboundMessage: message,
      supabase,
      anthropic,
      channel: 'web',
    });
  } catch (err) {
    console.error('[POST /vendor/chat] agent turn error:', err.message);
    return res.status(500).json({ ok: false, error: 'Agent failed.' });
  }

  const reply = (result && result.reply) || 'Got it.';

  // ── Persist outbound reply ─────────────────────────────────────────
  const { error: outboundErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      direction:       'outbound',
      channel:         'web',
      body:            reply,
      sent_by:         'agent',
      tool_calls:      result.toolCalls || [],
      model:           result.model        || null,
      input_tokens:    result.inputTokens  ?? null,
      output_tokens:   result.outputTokens ?? null,
      cost_usd:        result.costUsd      ?? null,
      cost_inr:        result.costInr      ?? null,
    });
  if (outboundErr) {
    console.error('[POST /vendor/chat] outbound persist error:', outboundErr.message);
    // Don't fail — the user still gets their reply.
  }

  // ── Bump last_message_at ───────────────────────────────────────────
  await supabase.from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation.id);

  // ── Shape response per contract ────────────────────────────────────
  // tool_calls in the engine's audit are objects {name, input, result}.
  // Contract returns string[] — just the names.
  const toolCallNames = Array.isArray(result.toolCalls)
    ? result.toolCalls.map(t => t && t.name).filter(Boolean)
    : [];

  // Include contact when agent drafted a client-facing message.
  // Frontend renders WhatsApp + Call buttons — vendor sends directly,
  // no Twilio needed on the web surface.
  const responseBody = { ok: true, reply, tool_calls: toolCallNames };
  if (result.contact) responseBody.contact = result.contact;
  return res.json(responseBody);
});

module.exports = router;
