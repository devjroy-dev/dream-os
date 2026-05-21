// src/api/circle/threads.js
// GET  /api/v2/frost/circle/threads/:brideId                          — thread list
// GET  /api/v2/frost/circle/threads/:brideId/:threadId/messages       — messages in thread
// POST /api/v2/frost/circle/messages                                  — send a message
//
// brideId = couple.id. Requires circle member auth.
// thread_id format: "dm:<conversation_uuid>"
// Conversations are circle_thread kind, scoped by couple_id + counterparty_user_id.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

// ── GET /:brideId — thread list ───────────────────────────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { brideId }  = req.params;
  const { couple_id, user_id } = req.circleMember;

  if (brideId !== couple_id) {
    return res.status(403).json({ success: false, error: 'Forbidden.' });
  }

  // Find circle_thread conversations for this member
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, kind, last_message_at, updated_at')
    .eq('couple_id', couple_id)
    .eq('kind', 'circle_thread')
    .eq('counterparty_user_id', user_id)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[GET /frost/circle/threads] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch threads.' });
  }

  // For each conversation get the last message
  const threads = await Promise.all((convos || []).map(async (c) => {
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('body, sent_by, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      thread_id:   `dm:${c.id}`,
      kind:        'dm',
      label:       null,  // coplanner derives label from thread_id prefix
      last_message: lastMsg ? {
        content:     lastMsg.body        || null,
        sender_name: lastMsg.sent_by     || null,
        sender_role: lastMsg.sent_by     || null,
        created_at:  lastMsg.created_at  || null,
      } : null,
      last_active: c.last_message_at || c.updated_at || null,
    };
  }));

  return res.json({ success: true, data: threads });
}));

// ── GET /:brideId/:threadId/messages ─────────────────────────────────────────
router.get('/:brideId/:threadId/messages', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { brideId, threadId } = req.params;
  const { couple_id, user_id } = req.circleMember;

  if (brideId !== couple_id) {
    return res.status(403).json({ success: false, error: 'Forbidden.' });
  }

  // threadId format: "dm:<conversation_uuid>"
  const convoId = threadId.replace(/^dm:/, '');

  // Confirm this conversation belongs to this member + couple
  const { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', convoId)
    .eq('couple_id', couple_id)
    .eq('counterparty_user_id', user_id)
    .eq('kind', 'circle_thread')
    .maybeSingle();

  if (!convo) {
    return res.json({ success: false, error: 'Thread not found.' });
  }

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, body, sent_by, direction, created_at')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GET /frost/circle/threads/.../messages] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch messages.' });
  }

  const shaped = (messages || []).map(m => ({
    id:              m.id,
    body:            m.body       || null,
    content:         m.body       || null,
    sender_user_id:  m.direction === 'inbound' ? user_id : null,
    sender_name:     m.sent_by    || null,
    sender_role:     m.sent_by    || null,
    actor_role:      m.sent_by    || null,
    created_at:      m.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
