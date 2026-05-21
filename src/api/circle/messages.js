// src/api/circle/messages.js
// POST /api/v2/frost/circle/messages
//
// Body: { userId, thread_id, body, sender_name }
// Note: frontend sends userId = bride_id (couple_id) — used to scope the conversation.
// thread_id format: "dm:<conversation_uuid>"
// No JWT — coplanner sends no Authorization header.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { userId: coupleId, thread_id, body, sender_name } = req.body || {};

  if (!thread_id || !body || !body.trim()) {
    return res.status(400).json({ ok: false, error: 'thread_id and body are required.' });
  }

  const convoId = thread_id.replace(/^dm:/, '');

  const { data: convo } = await supabase
    .from('conversations').select('id')
    .eq('id', convoId).eq('kind', 'circle_thread').maybeSingle();

  let targetConvoId = convo?.id;

  if (!targetConvoId && coupleId) {
    // Create conversation
    const { data: newConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({
        couple_id:       coupleId,
        kind:            'circle_thread',
        state:           'new',
        mode:            'auto',
        last_message_at: new Date().toISOString(),
      })
      .select('id').single();

    if (convoErr) {
      console.error('[POST /frost/circle/messages] create convo error:', convoErr.message);
      return res.status(500).json({ ok: false, error: 'Could not create thread.' });
    }
    targetConvoId = newConvo.id;
  }

  if (!targetConvoId) {
    return res.status(400).json({ ok: false, error: 'Could not find or create thread.' });
  }

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: targetConvoId,
      direction:       'inbound',
      channel:         'web',
      body:            body.trim(),
      sent_by:         'couple',
    })
    .select('id').single();

  if (msgErr) {
    console.error('[POST /frost/circle/messages] insert error:', msgErr.message);
    return res.status(500).json({ ok: false, error: 'Could not send message.' });
  }

  await supabase.from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', targetConvoId);

  return res.json({ ok: true, message_id: msg.id });
}));

module.exports = router;
