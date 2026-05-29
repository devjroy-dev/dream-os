// src/api/demo/bride.js
// Demo bride API — no auth, no session, all data hardcoded in context.
//
//   POST /api/v2/demo/bride/chat  — SSE DreamAi BFF stream

'use strict';

const express = require('express');
const router  = express.Router();

// ── Hardcoded demo bride context ──────────────────────────────────────────────
const DEMO_BRIDE_CONTEXT = `
BRIDE CONTEXT
Name: Ananya
Partner: Aryan
Wedding date: 14 December 2026
City: Delhi
Budget: Rs 45 lakhs
Events planned: Mehendi, Haldi, Sangeet, Wedding, Reception
Days to wedding: (calculate from today to 14 Dec 2026)
Planning state: Active planning

BOOKINGS (5 confirmed)
- Radhika Arora Photography — advance paid Rs 60,000 / total Rs 1,75,000 — balance due 7 Dec
- The Grand Hyatt Delhi (venue) — advance paid Rs 3,00,000 / total Rs 8,50,000 — balance due 30 Nov
- Bloom & Petal Decor — advance paid Rs 1,00,000 / total Rs 2,80,000 — balance due 10 Dec
- Swati Roy Studio (MUA) — advance paid Rs 50,000 / total Rs 1,50,000 — balance due 7 Dec
- Anvika Atelier (designer/lehenga) — Rs 0 paid / total Rs 3,20,000 — BALANCE DUE NOW (1 Dec)

UPCOMING EVENTS
- 24 Nov: Guest list review with Mum (she wants 620 guests, Ananya wants 280)
- 25 Nov: Call with photographer Radhika — shot list review
- 27 Nov: Venue walkthrough at Grand Hyatt with decor team
- 28 Nov: Final lehenga fitting at Anvika Atelier (bring Mum and Preethi)
- 29 Nov: Choreography practice with squad (Aryan's place, sangeet number)
- 30 Nov: Bridal trial at Swati Roy Studio
- 12 Dec: Mehendi — home, Defence Colony, 40 guests, Fatima doing the mehndi
- 13 Dec: Haldi — intimate, Aryan's parents' lawn, close family only
- 13 Dec evening: Sangeet — Grand Hyatt, 150 guests, DJ + ghazal quartet
- 14 Dec morning: Wedding — Grand Hyatt, pheras at 9am, pandit arrives 7:30am
- 14 Dec evening: Reception — 250 guests
- 17 Dec: Honeymoon — Soneva Jani, Maldives, 5 nights

CIRCLE MEMBERS
- Mum (active) — very involved, added a mandap she found on Pinterest
- Preethi / sister (active, based in London) — added 6 saves from London at midnight
- Naina (pending invite) — hasn't joined yet

MUSE BOARD: 12 saves — golden hour photography, red lehenga inspo, all-white florals, polki jewellery, haldi yellow, reception table settings, sangeet outfit, mandap goals, couple candid shot reference, mehndi detail, bridal portrait, venue obsession

DIARY MOOD TREND
Oct 1: excited (said yes to the date)
Oct 15: overwhelmed (guest list meeting with both families)
Oct 28: in_love (picked the lehenga, Mum cried)
Nov 5: nervous (awake at 2am, worried about pheras)
Nov 12: grateful (Circle is working, family planning on the app)
Nov 18: content (bridal trial booked with Swati)
Nov 20: reflective (26 days away, not quite real yet)
`;

const BRIDE_SYSTEM_PROMPT = `You are DreamAi, the AI best friend for brides planning their wedding on The Dream Wedding (TDW).

WHO YOU ARE
You are her best friend who happens to have a perfect memory and a hint of wit. Not a therapist. Not a cheerleader. Not a corporate assistant. The friend she calls when she needs to think out loud.

VOICE RULES — NON-NEGOTIABLE
1. Informal. Never "I'd be happy to help." Never "Certainly." Speak the way a sharp friend texts.
2. A hint of dry wit. Observe. Notice things. Be a little arch when it fits. Never sarcastic at her expense.
3. No therapy voice. Forbidden: "I hear you," "That sounds really hard," "Take a deep breath," "Your feelings are valid."
4. No cheerleader voice. Forbidden: "OMG yes!!!" "You go girl!" multiple exclamation points. Treat her like an adult.
5. Short replies. 2-3 sentences max unless she asks for detail.
6. No bullet points. Plain conversational text.
7. Never introduce yourself. Never say "as your AI assistant."
8. Use her name sparingly — once per conversation at most.
9. DEMO MODE: Never say "this is a demo" or "this is mock data." Everything is real.

WHAT YOU KNOW
You have full access to her wedding profile, bookings, upcoming events, circle members, muse saves, and diary entries. Use this data to give specific, personal answers. Never be vague when you have the actual data.`;

// ── POST /demo/bride/chat ─────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const anthropic = req.app.locals.anthropic;
  if (!anthropic) return res.status(500).json({ ok: false, error: 'AI not configured.' });

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'message is required.' });
  }

  try {
    const messages = [
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ];

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

    safe({ type: 'thinking' });

    const stream = await anthropic.messages.stream({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: [
        { type: 'text', text: BRIDE_SYSTEM_PROMPT },
        { type: 'text', text: DEMO_BRIDE_CONTEXT },
      ],
      messages,
    });

    for await (const event of stream) {
      if (streamDead || res.writableEnded) break;
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        safe({ type: 'text_delta', text: event.delta.text });
      }
    }

    safe({ type: 'done', tool_calls: [], refresh: false });
    if (!res.writableEnded) { res.write('data: [DONE]\n\n'); res.end(); }

  } catch (err) {
    console.error('[demo/bride/chat]', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', text: 'Something went wrong. Try again.' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
