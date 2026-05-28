// src/api/couple/meridian.js
// POST /api/v2/couple/meridian/chat — SSE streaming Meridian concierge.
// Requires couple auth (applied in core.js).
//
// Meridian is the bride's personal concierge — skin, mind, body, decisions.
// Separate from DreamAi (which handles planning data).
// Model: claude-haiku-4-5-20251001. Always. NEVER Sonnet.
// Conversation stored as kind='meridian_self' in conversations table.

'use strict';

const express           = require('express');
const router            = express.Router();
const asyncHandler      = require('../../lib/asyncHandler');

const MODEL    = 'claude-haiku-4-5-20251001';
const TIMEOUT  = 30000;
const MAX_HIST = 20; // last 20 messages for context

function getMeridianSystemPrompt(bride) {
  const name        = bride.name || 'her';
  const days        = bride.days_until || null;
  const city        = bride.wedding_city || 'India';
  const events      = (bride.events_planned || []).join(', ') || 'wedding';
  const daysLine    = days !== null
    ? `She has ${days} days until her wedding.`
    : 'Her wedding date is coming up.';

  return `You are Meridian — the bride's personal concierge on The Dream Wedding platform.

You are not a wedding planner. You are her trusted personal advisor.
You cover: skincare, wellness, nutrition, fitness, mental health, vendor decisions, aesthetic choices, personal dilemmas about the wedding journey.

THE BRIDE:
Name: ${name}
Wedding city: ${city}
Events planned: ${events}
${daysLine}

YOUR VOICE:
- Warm, specific, never generic
- Indian context always — recommend products available in India, reference Indian beauty practices, understand family pressure
- You know she is in a high-stress period. Acknowledge feelings before solutions
- Give real advice, not disclaimers. She has enough disclaimers in her life
- Short replies unless depth is needed. She's on her phone
- Never bullet-point unless listing specific steps. Prose first
- Never say "I'm just an AI" — she knows. She wants help

YOUR EXPERTISE AREAS:
Skin: ubtan, detan, facials, acne, pigmentation, bridal glow protocols timed to wedding
Body: diet, water, sleep, fitness goals realistic to the timeline  
Mind: family pressure, anxiety, decision fatigue, vendor stress, in-law situations
Decisions: helping her choose between vendors, looks, lehengas, anything she's stuck on
Hair: oiling, trimming timelines, trial scheduling

WHAT YOU DON'T DO:
- You don't handle bookings, events, or expense tracking — that's DreamAi
- You don't diagnose medical conditions — you give wellness guidance and suggest consulting a dermatologist/doctor when warranted
- You don't pick her vendors for her — you help her think through the decision

TIMELINE AWARENESS:
${days !== null && days > 180 ? 'She has time. Foundation rituals, lifestyle changes, early decisions.' : ''}
${days !== null && days > 90 && days <= 180 ? 'Mid-arc. Treatments should be underway. Hair and skin routines locked. Vendor trials happening.' : ''}
${days !== null && days > 60 && days <= 90 ? 'Closing in. No aggressive new treatments. Protect the glow she has built.' : ''}
${days !== null && days > 30 && days <= 60 ? 'Final stretch. Comfort and confidence. Sleep and hydration above everything.' : ''}
${days !== null && days <= 30 ? 'Almost there. She needs calm, not new protocols. Be her steady hand.' : ''}

Begin each conversation by understanding what she needs today. One question maximum.`;
}

router.post('/chat', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;

  if (!anthropic) return res.status(500).json({ ok: false, error: 'Server misconfigured.' });

  const message = (req.body?.message || '').trim();
  if (!message) return res.status(400).json({ ok: false, error: 'message required.' });

  const { id: userId, couple_id } = req.coupleUser;

  // Load couple + user for context
  const { data: couple } = await supabase
    .from('couples')
    .select('*, users!couples_user_id_fkey(name)')
    .eq('id', couple_id)
    .maybeSingle();

  const weddingDate = couple?.wedding_date ? new Date(couple.wedding_date) : null;
  const daysUntil   = weddingDate
    ? Math.max(0, Math.round((weddingDate - new Date()) / 86400000))
    : null;

  const brideCtx = {
    name:          couple?.users?.name || null,
    days_until:    daysUntil,
    wedding_city:  couple?.wedding_city || null,
    events_planned: couple?.events_planned || [],
  };

  // Find or create meridian_self conversation
  let { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', couple_id)
    .eq('kind', 'meridian_self')
    .maybeSingle();

  if (!convo) {
    const { data: newConvo } = await supabase
      .from('conversations')
      .insert({ couple_id, kind: 'meridian_self', state: 'new', mode: 'auto', last_message_at: new Date().toISOString() })
      .select('id').single();
    convo = newConvo;
  }

  // Load recent history
  const { data: history } = await supabase
    .from('messages')
    .select('direction, body, sent_by')
    .eq('conversation_id', convo.id)
    .order('created_at', { ascending: false })
    .limit(MAX_HIST);

  const messages = (history || [])
    .reverse()
    .map(m => ({
      role:    m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body,
    }));
  messages.push({ role: 'user', content: message });

  // Log inbound
  await supabase.from('messages').insert({
    conversation_id: convo.id,
    direction: 'inbound', channel: 'web',
    body: message, sent_by: 'couple',
  }).then(()=>{}).catch(()=>{});

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let streamDead = false;
  req.on('close', () => { streamDead = true; });

  const safe = (data) => {
    if (streamDead || res.writableEnded) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const timeout = setTimeout(() => {
    safe({ type: 'error', text: 'Taking too long — try again in a moment.' });
    if (!res.writableEnded) res.end();
  }, TIMEOUT);

  let fullReply = '';

  try {
    const stream = await anthropic.messages.stream({
      model:      MODEL,
      max_tokens: 600,
      system:     getMeridianSystemPrompt(brideCtx),
      messages,
    });

    for await (const event of stream) {
      if (streamDead || res.writableEnded) break;
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const text = event.delta.text;
        fullReply += text;
        safe({ type: 'text_delta', text });
      }
    }

    safe({ type: 'done' });
    if (!res.writableEnded) { res.write('data: [DONE]\n\n'); res.end(); }

  } catch (err) {
    console.error('[meridian/chat] stream error:', err.message);
    safe({ type: 'error', text: 'Something went wrong. Try again.' });
    if (!res.writableEnded) res.end();
  } finally {
    clearTimeout(timeout);
  }

  // Persist reply
  if (fullReply && convo?.id) {
    supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'outbound', channel: 'web',
      body: fullReply, sent_by: 'agent',
    }).then(()=>{}).catch(()=>{});

    supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convo.id)
      .then(()=>{}).catch(()=>{});
  }
}));

module.exports = router;
