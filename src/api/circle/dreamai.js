// src/api/circle/dreamai.js
// GET  /api/v2/dreamai/circle-member-history/:userId  — circle member chat history
// POST /api/v2/dreamai/circle-member-chat             — send message to circleEngine
//
// No JWT — coplanner sends no Authorization header.
// GET: userId = circle member's user_id
// POST: user_id = circle member's user_id, primary_user_id = couple_id (bride)

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { runCircleAgenticTurn } = require('../../agent/circleEngine');

// ── GET /circle-member-history/:userId ───────────────────────────────────────
router.get('/circle-member-history/:userId', asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const { userId } = req.params;

  // Get user phone to find circle_member
  const { data: userRow } = await supabase
    .from('users').select('phone').eq('id', userId).maybeSingle();
  if (!userRow) return res.json({ success: true, data: [] });

  const { data: member } = await supabase
    .from('circle_members').select('id, couple_id')
    .eq('invitee_phone', userRow.phone).eq('status', 'active').maybeSingle();
  if (!member) return res.json({ success: true, data: [] });

  // Find circle_thread conversation for this member
  const { data: convo } = await supabase
    .from('conversations').select('id')
    .eq('couple_id', member.couple_id)
    .eq('counterparty_user_id', userId)
    .eq('kind', 'circle_thread')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (!convo) return res.json({ success: true, data: [] });

  const { data: messages, error } = await supabase
    .from('messages').select('id, body, sent_by, direction, created_at')
    .eq('conversation_id', convo.id)
    .order('created_at', { ascending: true }).limit(30);

  if (error) {
    console.error('[GET /dreamai/circle-member-history] error:', error.message);
    return res.json({ success: false, error: 'Could not fetch history.' });
  }

  const shaped = (messages || []).map(m => ({
    id:         m.id,
    role:       m.direction === 'inbound' ? 'user' : 'assistant',
    content:    m.body || '',
    created_at: m.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

// ── POST /circle-member-chat ──────────────────────────────────────────────────
router.post('/circle-member-chat', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;
  const { user_id, primary_user_id: couple_id, message } = req.body || {};

  if (!user_id || !couple_id || !message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'user_id, primary_user_id, and message are required.' });
  }

  // Validate circle member
  const { data: userRow } = await supabase
    .from('users').select('phone, name').eq('id', user_id).maybeSingle();
  if (!userRow) return res.status(403).json({ success: false, error: 'User not found.' });

  const { data: member } = await supabase
    .from('circle_members').select('id, couple_id, role, invitee_name')
    .eq('invitee_phone', userRow.phone).eq('couple_id', couple_id).eq('status', 'active').maybeSingle();
  if (!member) return res.status(403).json({ success: false, error: 'Not an active circle member.' });

  // Get or create circle_thread conversation
  let convo;
  const { data: existing } = await supabase
    .from('conversations').select('id')
    .eq('couple_id', couple_id).eq('counterparty_user_id', user_id).eq('kind', 'circle_thread')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (existing) {
    convo = existing;
  } else {
    const { data: newConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({ couple_id, counterparty_user_id: user_id, kind: 'circle_thread', state: 'new', mode: 'auto', last_message_at: new Date().toISOString() })
      .select('id').single();
    if (convoErr) {
      console.error('[POST /dreamai/circle-member-chat] create convo error:', convoErr.message);
      return res.status(500).json({ success: false, error: 'Could not start conversation.' });
    }
    convo = newConvo;
  }

  // Save inbound message
  await supabase.from('messages').insert({
    conversation_id: convo.id, direction: 'inbound', channel: 'web',
    body: message.trim(), sent_by: 'couple',
  });

  // Get bride name for context
  const { data: couple } = await supabase
    .from('couples').select('id, user_id, users(name)').eq('id', couple_id).maybeSingle();
  const brideName = couple?.users?.name || 'the bride';

  let result;
  try {
    result = await runCircleAgenticTurn({
      circleMember:   member,
      brideName,
      imageSavesToday: 0,
      conversation:   convo,
      inboundMessage: message.trim(),
      couple:         { id: couple_id, user_id: couple?.user_id || null },
      circleUser:     { id: user_id },
      supabase,
      anthropic,
    });
  } catch (err) {
    console.error('[POST /dreamai/circle-member-chat] engine error:', err.message);
    return res.status(500).json({ success: false, error: 'Agent error.' });
  }

  await supabase.from('messages').insert({
    conversation_id: convo.id, direction: 'outbound', channel: 'web',
    body: result.reply, sent_by: 'agent',
    model: result.model || null,
    input_tokens: result.inputTokens || null,
    output_tokens: result.outputTokens || null,
  });

  await supabase.from('conversations')
    .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);

  return res.json({ success: true, data: { reply: result.reply } });
}));

module.exports = router;
