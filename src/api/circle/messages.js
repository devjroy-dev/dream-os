// src/api/circle/messages.js
// POST /api/v2/frost/circle/messages              — send a message to the circle thread
// GET  /api/v2/frost/circle/messages/:coupleId    — read the circle thread (bride side)
//
// Body (POST): { userId, thread_id?, body, sender_name?, sender_role? }
//   userId      = couple_id (bride) OR a circle member's user id — used to scope/resolve.
//   thread_id   = optional. 'circle_group' or 'dm:<uuid>' or omitted → canonical couple thread.
//   sender_role = 'bride' | 'circle_member' (defaults to 'couple' for back-compat).
//
// No JWT — coplanner/bride send no Authorization header. couple_id scopes everything.
//
// CANONICAL THREAD MODEL
//   There is exactly ONE circle_thread conversation per couple (the group chat).
//   getOrCreateCircleThread() resolves it (or creates once). Every message — from the
//   bride or any circle member — lands in this single conversation, so both sides see
//   the same continuous thread. Prior bug: thread_id='circle_group' never matched a
//   UUID, so every send spawned a NEW conversation and nothing was ever re-read.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

// Resolve the couple_id for a given userId. The bride passes her couple_id directly;
// a circle member passes their users.id, which we map via circle_members.invitee_phone.
async function resolveCoupleId(supabase, userId) {
  if (!userId) return null;

  const { data: couple } = await supabase
    .from('couples').select('id').eq('id', userId).maybeSingle();
  if (couple) return couple.id;

  const { data: user } = await supabase
    .from('users').select('phone').eq('id', userId).maybeSingle();
  if (!user) return null;

  const { data: member } = await supabase
    .from('circle_members')
    .select('couple_id')
    .eq('invitee_phone', user.phone)
    .eq('status', 'active')
    .maybeSingle();

  return member?.couple_id || null;
}

// Get (or create once) the single canonical circle_thread conversation for a couple.
async function getOrCreateCircleThread(supabase, coupleId) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('kind', 'circle_thread')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      couple_id:       coupleId,
      kind:            'circle_thread',
      state:           'new',
      mode:            'auto',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[circle/messages] create thread error:', error.message);
    return null;
  }
  return created.id;
}

// ── POST / — send a message into the canonical circle thread ─────────────────
router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { userId, thread_id, body, sender_name, sender_role } = req.body || {};

  if (!body || !body.trim()) {
    return res.status(400).json({ ok: false, error: 'body is required.' });
  }

  const coupleId = await resolveCoupleId(supabase, userId);
  if (!coupleId) {
    return res.status(400).json({ ok: false, error: 'Could not resolve circle for this user.' });
  }

  let targetConvoId = null;
  if (thread_id && /^dm:[0-9a-f-]{36}$/i.test(thread_id)) {
    const convoId = thread_id.replace(/^dm:/, '');
    const { data: convo } = await supabase
      .from('conversations').select('id')
      .eq('id', convoId).eq('couple_id', coupleId).eq('kind', 'circle_thread')
      .maybeSingle();
    targetConvoId = convo?.id || null;
  }
  if (!targetConvoId) {
    targetConvoId = await getOrCreateCircleThread(supabase, coupleId);
  }
  if (!targetConvoId) {
    return res.status(500).json({ ok: false, error: 'Could not open the circle thread.' });
  }

  const role = sender_role === 'circle_member' ? 'circle_member'
             : sender_role === 'bride'         ? 'bride'
             : 'couple';

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: targetConvoId,
      direction:       'inbound',
      channel:         'web',
      body:            body.trim(),
      sent_by:         role,
    })
    .select('id, body, sent_by, created_at')
    .single();

  if (msgErr) {
    console.error('[POST /frost/circle/messages] insert error:', msgErr.message);
    return res.status(500).json({ ok: false, error: 'Could not send message.' });
  }

  await supabase.from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', targetConvoId);

  return res.json({
    ok:         true,
    message_id: msg.id,
    thread_id:  `dm:${targetConvoId}`,
    message: {
      id:          msg.id,
      body:        msg.body,
      content:     msg.body,
      sender_name: sender_name || (role === 'bride' ? 'Bride' : null),
      sender_role: role,
      created_at:  msg.created_at,
    },
  });
}));

// ── GET /:coupleId — read the canonical circle thread (bride side) ───────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { coupleId } = req.params;
  const limit        = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

  const { data: couple } = await supabase
    .from('couples').select('id').eq('id', coupleId).maybeSingle();
  if (!couple) return res.json({ ok: true, thread_id: null, messages: [] });

  const convoId = await getOrCreateCircleThread(supabase, coupleId);
  if (!convoId) return res.json({ ok: true, thread_id: null, messages: [] });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, body, sent_by, created_at')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GET /frost/circle/messages] error:', error.message);
    return res.json({ ok: false, error: 'Could not fetch messages.' });
  }

  const shaped = (messages || []).map(m => ({
    id:          m.id,
    body:        m.body || null,
    content:     m.body || null,
    sender_name: m.sent_by === 'bride' ? 'Bride' : (m.sent_by || null),
    sender_role: m.sent_by || null,
    created_at:  m.created_at,
  }));

  return res.json({ ok: true, thread_id: `dm:${convoId}`, messages: shaped });
}));

module.exports = router;
