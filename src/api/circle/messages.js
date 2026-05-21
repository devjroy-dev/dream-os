// src/api/circle/messages.js
// POST /api/v2/frost/circle/messages — send a message from circle member PWA
//
// Body: { userId, thread_id, body, sender_name }
// thread_id format: "dm:<conversation_uuid>"
// Does NOT send WhatsApp — PWA messages stay in-app only.
// Requires circle member auth.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id, user_id } = req.circleMember;

  const { thread_id, body } = req.body || {};

  if (!thread_id || !body || !body.trim()) {
    return res.status(400).json({ ok: false, error: 'thread_id and body are required.' });
  }

  const convoId = thread_id.replace(/^dm:/, '');

  // Confirm conversation belongs to this member
  const { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', convoId)
    .eq('couple_id', couple_id)
    .eq('counterparty_user_id', user_id)
    .eq('kind', 'circle_thread')
    .maybeSingle();

  if (!convo) {
    // No existing thread — create one
    const { data: newConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({
        couple_id,
        counterparty_user_id: user_id,
        kind:                 'circle_thread',
        state:                'new',
        mode:                 'auto',
        last_message_at:      new Date().toISOString(),
      })
      .select('id')
      .single();

    if (convoErr) {
      console.error('[POST /frost/circle/messages] create convo error:', convoErr.message);
      return res.status(500).json({ ok: false, error: 'Could not create thread.' });
    }

    const { data: msg, error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: newConvo.id,
        direction:       'inbound',
        channel:         'web',
        body:            body.trim(),
        sent_by:         'couple',
      })
      .select('id')
      .single();

    if (msgErr) {
      console.error('[POST /frost/circle/messages] insert error:', msgErr.message);
      return res.status(500).json({ ok: false, error: 'Could not send message.' });
    }

    return res.json({ ok: true, message_id: msg.id });
  }

  // Insert into existing conversation
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: convo.id,
      direction:       'inbound',
      channel:         'web',
      body:            body.trim(),
      sent_by:         'couple',
    })
    .select('id')
    .single();

  if (msgErr) {
    console.error('[POST /frost/circle/messages] insert error:', msgErr.message);
    return res.status(500).json({ ok: false, error: 'Could not send message.' });
  }

  // Update last_message_at on conversation
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', convo.id);

  return res.json({ ok: true, message_id: msg.id });
}));

module.exports = router;
