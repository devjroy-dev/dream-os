// src/api/circle/dreamai.js
// GET  /api/v2/dreamai/circle-member-history/:userId  — circle member chat history
// POST /api/v2/dreamai/circle-member-chat             — send a message to circleEngine
//
// ── F-07.72 ZIP 2 · CLASS A · GUARDED — AND THE DOOR OUTLIVES ITS SURFACE ───
// `requireCircleMemberAuth` runs at this file's mount. The proven member arrives
// on `req.circleMember`; `:userId`, `body.user_id` and `body.primary_user_id`
// are no longer read.
//
// WHY THIS FILE IS GUARDED AT ALL, GIVEN THAT ITS ONLY CLIENT IS BEING DELETED —
// the CE ruling's FORK C, recorded here because the reasoning is the whole
// point. The founder has ruled the co-planner's Dream AI SURFACE deleted at the
// next sitting. Deleting the client does NOT close the door: F-07.115 witnessed
// `GET /circle-member-history/:userId` returning a member's ENTIRE private
// conversation with Mira to any caller who knows her `users.id` — by curl, with
// no credential, while `dreamai_access_granted` (a hardcoded false, no column
// behind it) gated only the screen. Next sitting removes the one client that
// would ever have noticed this door, and leaves it serving private conversation
// history to the open internet with nothing left watching.
//
// AND THE AGENT IS NOT DELETED WITH THE SURFACE: `runCircleAgenticTurn` has a
// second live caller at `src/brideIndex.js:677`, the WhatsApp circle lane. Mira
// outlives her PWA page. Guarding a door scheduled to lose its client is not
// work against the sequence when the door outlives the surface.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { runCircleAgenticTurn } = require('../../agent/circleEngine');

// ── GET /circle-member-history/:userId ───────────────────────────────────────
router.get('/circle-member-history/:userId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // F-07.72 ZIP 2 — the two lookups that stood here are the guard's, and the
  // guard already ran. `:userId` is not read: the history served is the history
  // of the member the token bound. This is the line that ends F-07.115's
  // exposure — a stranger's id in the path can no longer name a private thread.
  const me     = req.circleMember;
  const userId = me.user_id;

  // Find this member's PRIVATE circle_thread conversation. `counterparty_user_id`
  // is the discriminator F-07.112 made load-bearing across the estate: this side
  // has always read by it, which is how the collision survived a block invisible
  // from here.
  const { data: convo } = await supabase
    .from('conversations').select('id')
    .eq('couple_id', me.couple_id)
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
  const { message } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'message is required.' });
  }

  // F-07.72 ZIP 2 — `user_id` and `primary_user_id` are no longer read from the
  // body. Both are now the guard's answer, so a caller can no longer name whose
  // private thread it is writing into or which couple's agent it is spending.
  //
  // `member` is assembled to EXACTLY the shape `runCircleAgenticTurn` has always
  // received — `{ id, couple_id, role, invitee_name }` — because `circleEngine`
  // is a W-1 surface and this delivery opens zero bytes of it. The fields are
  // the same fields, off a proven row instead of a supplied one.
  const me       = req.circleMember;
  const user_id  = me.user_id;
  const couple_id = me.couple_id;
  const member   = {
    id:           me.co_planner_id,
    couple_id:    me.couple_id,
    role:         me.role,
    invitee_name: me.name,
  };

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
