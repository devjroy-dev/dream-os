// ─────────────────────────────────────────────────────────────────────────────
// src/agent/classifier.js
// Lightweight task classifier. Runs before the main agent call on the
// vendor agent path only. Returns 'simple' or 'complex'.
//
// simple  → main agent uses MODEL_HAIKU
// complex → main agent uses MODEL_SONNET
//
// Always uses MODEL_HAIKU for the classifier call itself — cheap, fast,
// max_tokens capped at 5 so it cannot ramble.
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
      console.log(`[classifier] complex → Sonnet | message: "${inboundMessage.slice(0, 60)}"`);
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

module.exports = { classifyMessage };
