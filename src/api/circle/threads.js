// src/api/circle/threads.js
// GET /api/v2/frost/circle/threads/:brideId                         — thread list
// GET /api/v2/frost/circle/threads/:brideId/:threadId/messages      — messages
//
// No JWT — coplanner sends no Authorization header.
// brideId = couple.id. No per-user auth — returns threads for the couple.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

// ── GET /:brideId/:threadId/messages — more specific, before /:brideId ────────
router.get('/:brideId/:threadId/messages', asyncHandler(async (req, res) => {
  const supabase              = req.app.locals.supabase;
  const { brideId, threadId } = req.params;

  const convoId = threadId.replace(/^dm:/, '');
  const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  // Confirm conversation belongs to this couple
  const { data: convo } = await supabase
    .from('conversations').select('id')
    .eq('id', convoId).eq('couple_id', brideId).eq('kind', 'circle_thread')
    .maybeSingle();

  if (!convo) return res.json({ success: true, data: [] });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, body, sent_by, direction, created_at')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GET /frost/circle/threads/.../messages] error:', error.message);
    return res.json({ success: false, error: 'Could not fetch messages.' });
  }

  const shaped = (messages || []).map(m => ({
    id:          m.id,
    body:        m.body     || null,
    content:     m.body     || null,
    sender_name: m.sent_by  || null,
    sender_role: m.sent_by  || null,
    actor_role:  m.sent_by  || null,
    created_at:  m.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

// ── GET /:brideId — thread list ───────────────────────────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { brideId } = req.params;

  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, kind, last_message_at, updated_at, counterparty_user_id')
    .eq('couple_id', brideId)
    .eq('kind', 'circle_thread')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[GET /frost/circle/threads] error:', error.message);
    return res.json({ success: false, error: 'Could not fetch threads.' });
  }

  const threads = await Promise.all((convos || []).map(async (c) => {
    const { data: lastMsg } = await supabase
      .from('messages').select('body, sent_by, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    return {
      thread_id:   `dm:${c.id}`,
      kind:        'dm',
      label:       null,
      last_message: lastMsg ? {
        content:    lastMsg.body       || null,
        sender_name:lastMsg.sent_by    || null,
        sender_role:lastMsg.sent_by    || null,
        created_at: lastMsg.created_at || null,
      } : null,
      last_active: c.last_message_at || c.updated_at || null,
    };
  }));

  return res.json({ success: true, data: threads });
}));

module.exports = router;
