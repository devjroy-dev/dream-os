// ══ DEFUSED ISLAND — ZERO CALLERS SINCE ARC M5 (CE ruling R-M5-3, 2026-07-24) ══
// Nothing in src/** calls either export. The three call sites that existed were all
// deleted by M5's census: engine.js:158 (inside runAgenticTurn, itself orphaned),
// engine.js:488 and brideEngine.js:203 (both zero-consumer — their verdicts fed only
// a log token). This file is KEPT WHOLE and deliberately: the ambiguity limb below is
// the only home that logic has anywhere in the estate, and a revival of the JS vendor
// wire is imaginable. CE-66's dead-code-defusal precedent governs — the same reasoning
// that kept the :159 Sonnet flip readable for whoever comes next.
// REVIVAL POINTER: classifyVendorMessage's ambiguity half fed an ask-gate that refused
// to auto-act on a cold, contextless inbound. If the JS vendor turn is ever rebuilt,
// that gate is the thing to rebuild with it.
// ─────────────────────────────────────────────────────────────────────────────
// src/agent/classifier.js
// Lightweight task classifier. Runs before the main agent call on the
// vendor agent path only.
//
// TWO ENTRY POINTS:
//   classifyMessage(msg, history, anthropic)
//     → 'simple' | 'complex'   (legacy; bride + couple-thread paths use this)
//
//   classifyVendorMessage(msg, history, anthropic)   ← Phase 1.4
//     → { complexity: 'simple'|'complex', ambiguity: 'clear'|'ambiguous' }
//     ONE Haiku call returns BOTH verdicts. Used by the vendor self-thread
//     path so it gets complexity routing AND a structural ambiguity gate
//     without paying for two pre-flight calls.
//
// Always uses MODEL_HAIKU for the classifier call itself — cheap, fast,
// max_tokens capped tight so it cannot ramble.
// ─────────────────────────────────────────────────────────────────────────────

const { MODEL_HAIKU, COMPLEXITY } = require('./models');

const CLASSIFIER_SYSTEM_PROMPT = `You are a task classifier for a WhatsApp AI assistant used by wedding vendors in India.

Your only job is to read an incoming vendor message (and optionally the last few turns of conversation) and output exactly one word: either "simple" or "complex".

OUTPUT RULES — non-negotiable:
- Output ONLY the single word: simple  OR  complex
- No punctuation. No explanation. No other text. Not even a full stop.

CLASSIFY AS complex IF the message involves ANY of the following:
- Invoice creation, editing, or questions about a specific invoice
- Payment recording (advance received, balance received, partial payment)
- Disambiguation between two clients or leads with the same or similar name
- A long forwarded message from a potential client (lead extraction)
- Multi-step financial reasoning (e.g. "she paid 40k, balance is?")
- Nuanced reply drafting where tone or wording is critical

CLASSIFY AS simple FOR everything else, including:
- Short notes to self ("note that I have a shoot Friday")
- Status questions ("how many open leads do I have?")
- Calendar / event queries ("what's on my schedule this week?")
- TDW link questions ("what's my TDW code?")
- Greetings and acknowledgements ("ok", "thanks", "got it")
- Lead state updates by name when unambiguous ("mark Priya as booked")
- Any message under 10 words that does not mention money or invoices

IMPORTANT: When in doubt, classify as simple. Haiku is capable.
Only route to Sonnet when complexity is clear and confident.`;

// ── classifyMessage ───────────────────────────────────────────────────────────
// inboundMessage : string  — the vendor's latest message
// recentHistory  : array   — last 2 turns [{role, content}] for context (optional)
// anthropic      : Anthropic client instance
//
// Returns: 'simple' | 'complex'
// Never throws — on any error defaults to 'simple' (safe fallback).

async function classifyMessage(inboundMessage, recentHistory, anthropic) {
  try {
    // Build a minimal context window: last 2 turns + current message.
    // We don't need the full history — the classifier only needs enough
    // context to detect disambiguation ("same Priya" needs prior turn).
    const contextTurns = (recentHistory || []).slice(-2);

    const messages = [
      ...contextTurns,
      { role: 'user', content: inboundMessage },
    ];

    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 5,           // enforces single-word output at the API level
      system:     CLASSIFIER_SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .toLowerCase();

    if (raw === COMPLEXITY.COMPLEX) {
      console.log(`[classifier] complex | message: "${inboundMessage.slice(0, 60)}"`);
      return COMPLEXITY.COMPLEX;
    }

    // Default to simple for any output that isn't exactly 'complex'.
    // This protects against edge cases where the model outputs 'simple.'
    // or 'Simple' or anything unexpected.
    console.log(`[classifier] simple → Haiku | message: "${inboundMessage.slice(0, 60)}"`);
    return COMPLEXITY.SIMPLE;

  } catch (err) {
    // On any classifier failure (network, API error, etc.), default to simple.
    // This means the vendor message still gets processed — just by Haiku.
    // Failing safe is better than dropping the message entirely.
    console.error(`[classifier] error — defaulting to simple:`, err.message);
    return COMPLEXITY.SIMPLE;
  }
}

module.exports = { classifyMessage, classifyVendorMessage };

// ─────────────────────────────────────────────────────────────────────────────
// classifyVendorMessage — merged complexity + ambiguity (Phase 1.4)
// ─────────────────────────────────────────────────────────────────────────────
//
// ONE Haiku call returns two verdicts on two lines:
//   line 1: simple | complex     (model routing, same meaning as classifyMessage)
//   line 2: clear  | ambiguous   (structural gate for "lead vs note vs nothing")
//
// "ambiguous" mirrors the AMBIGUOUS OR FORWARDED CONTENT rule in systemPrompt.js:
// a bare forward, a name+number with no framing, a fragment that matches no
// intent — content that could be a lead, a note, a reminder, or nothing. When
// the gate returns 'ambiguous', the engine short-circuits to ONE clarifying
// question instead of running the main agent — so the agent can never silently
// auto-create the wrong thing. The agent's own prompt rule remains as a second
// line of defense.
//
// FAIL-SAFE: on any error or unexpected output, defaults to
// { complexity: 'simple', ambiguity: 'clear' } — i.e. let the main agent run
// normally. The gate is a hardening layer, never a single point of failure.

const VENDOR_CLASSIFIER_SYSTEM_PROMPT = `You are a pre-flight classifier for a WhatsApp AI assistant used by wedding vendors in India. You read the vendor's latest message (with a little prior context) and output TWO verdicts, each on its own line, nothing else.

OUTPUT FORMAT — non-negotiable:
Line 1: exactly one word — simple OR complex
Line 2: exactly one word — clear OR ambiguous
No punctuation, no labels, no explanation. Two lines, two words.

LINE 1 — COMPLEXITY (which model handles the turn):
complex IF the message involves ANY of:
- Invoice creation, editing, or questions about a specific invoice
- Payment recording (advance/balance/partial received)
- Disambiguation between two clients or leads with the same or similar name
- A long forwarded message from a potential client (lead extraction)
- Multi-step financial reasoning ("she paid 40k, balance?")
- Nuanced reply drafting where tone or wording is critical
simple for everything else: short notes, status questions, calendar queries, TDW link questions, greetings, unambiguous lead-state updates, anything under 10 words with no money/invoice.
When in doubt on line 1, choose simple.

LINE 2 — AMBIGUITY (is it safe to act on?):
ambiguous IF the message is content the assistant should NOT auto-act on without asking:
- A forwarded message or pasted screenshot text with NO framing from the vendor
- A name and a phone number with no context ("Priya 9876543210")
- A sentence fragment that doesn't clearly match any intent
- Content that could be a lead, a note, a reminder, or nothing at all
clear IF the vendor framed it explicitly, e.g.:
- "got an enquiry from Priya...", "new lead — Anjali", "someone messaged me about..."  → clear (it's a lead)
- "save this — Anjali's number", "note that...", "remind me to..."  → clear (note/reminder)
- any direct request, question, command, greeting, or acknowledgement  → clear
When in doubt on line 2, choose clear. Only say ambiguous when the message genuinely has no framing and no obvious intent.

EXAMPLES:
Message: "got an enquiry from Priya for a Dec wedding in Goa, budget 3L"
simple
clear

Message: "raise an invoice for Priya, 1.5L, 50k advance"
complex
clear

Message: "9876543210 Rohit"
simple
ambiguous

Message: "[forwarded] hi is this the photographer? do you cover Jaipur"
complex
ambiguous

Message: "how many open leads do I have"
simple
clear`;

async function classifyVendorMessage(inboundMessage, recentHistory, anthropic) {
  const SAFE = { complexity: COMPLEXITY.SIMPLE, ambiguity: 'clear' };
  try {
    const contextTurns = (recentHistory || []).slice(-2);
    const messages = [
      ...contextTurns,
      { role: 'user', content: inboundMessage },
    ];

    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 8,           // two short words on two lines — no room to ramble
      system:     VENDOR_CLASSIFIER_SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .toLowerCase();

    // Parse two whitespace/newline-separated tokens. Tolerant of extra spaces.
    const tokens = raw.split(/\s+/).filter(Boolean);
    const complexity = tokens.includes(COMPLEXITY.COMPLEX) ? COMPLEXITY.COMPLEX : COMPLEXITY.SIMPLE;
    const ambiguity  = tokens.includes('ambiguous') ? 'ambiguous' : 'clear';

    console.log(`[classifier:vendor] ${complexity}/${ambiguity} | "${inboundMessage.slice(0, 60)}"`);
    return { complexity, ambiguity };

  } catch (err) {
    // Fail safe — let the main agent run normally with Haiku.
    console.error('[classifier:vendor] error — defaulting to simple/clear:', err.message);
    return SAFE;
  }
}
