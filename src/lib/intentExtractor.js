// ─────────────────────────────────────────────────────────────────────────────
// src/lib/intentExtractor.js
// 8.1 — Returning-bride vendor notification helper.
//
// PURPOSE: When a returning bride sends a follow-up message to a vendor's
// WhatsApp via couple_thread, generate a one-line structured summary of her
// ask for the vendor's notification. Cache it on leads.intent_summary so
// subsequent messages on the same topic reuse without re-extraction.
//
// FLOW (per call):
//   1. If lead.intent_summary is null or older than 30 days → full extract.
//   2. If fresh summary exists → topic-shift classifier (cheap):
//        - Same topic → reuse cached summary
//        - New topic → re-extract, overwrite cache
//
// FAILURE MODES:
//   Any Haiku error / timeout (>3s) returns null. Caller falls back to the
//   verbatim message format. Vendor never sees an error.
//
// MODEL: claude-haiku-4-5-20251001 (never Sonnet).
// COST: ~$0.0003 per extraction, ~$0.0001 per classification.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5-20251001';
const HAIKU_TIMEOUT_MS = 3000;
const SUMMARY_STALE_AFTER_DAYS = 30;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)),
  ]);
}

// ── Full extraction: produce a one-line intent summary ─────────────────────
async function extractIntent({ inboundMessage, leadName, anthropic }) {
  const prompt = `A bride named ${leadName || 'a returning bride'} just sent this message to her wedding vendor on WhatsApp:

"${inboundMessage}"

Summarise what she is asking about or telling the vendor in ONE short sentence, third-person, present tense. Start with her name (or "She" if name unknown). Be specific about dates, places, or amounts she mentions.

Examples:
- "Priya is asking if you're free for her wedding on Nov 14."
- "Priya is following up on the quote you sent last week."
- "Priya wants to add a mehndi event the day before."
- "Priya is checking whether your team handles destination weddings in Goa."

Respond with the summary sentence ONLY. No preamble, no quotes, no explanation.`;

  const response = await withTimeout(
    anthropic.messages.create({
      model: MODEL,
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    }),
    HAIKU_TIMEOUT_MS,
    'intent_extract',
  );

  const text = response.content?.[0]?.text?.trim();
  return text || null;
}

// ── Topic-shift classification ─────────────────────────────────────────────
// Returns true if the new message is about the same topic as the cached
// summary, false if it has shifted. On any error, assume shift (safer to
// re-extract than to send a stale summary).
async function isSameTopic({ inboundMessage, cachedSummary, anthropic }) {
  const prompt = `Cached topic summary: "${cachedSummary}"

New message from the bride: "${inboundMessage}"

Is the new message about the SAME topic as the cached summary? Answer with just "yes" or "no".`;

  try {
    const response = await withTimeout(
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 5,
        messages: [{ role: 'user', content: prompt }],
      }),
      HAIKU_TIMEOUT_MS,
      'topic_classify',
    );
    const text = response.content?.[0]?.text?.trim().toLowerCase();
    return text === 'yes';
  } catch (err) {
    console.warn(`[intentExtractor:topic_classify] failed: ${err.message}`);
    return false;
  }
}

// ── Main entry: get an intent summary for a returning bride ────────────────
// Returns: string | null (caller falls back to verbatim on null)
//
// Side effect: writes intent_summary + intent_summary_at to leads on
// extraction. Best-effort write — failure does not block the return value.
async function getReturningBrideIntent({
  inboundMessage,
  leadId,
  leadName,
  cachedSummary,
  cachedAt,
  supabase,
  anthropic,
}) {
  if (!inboundMessage || !leadId) return null;

  const cacheIsFresh = cachedSummary && cachedAt
    && (Date.now() - new Date(cachedAt).getTime()) < SUMMARY_STALE_AFTER_DAYS * 86400000;

  let summary = null;
  let shouldRefresh = false;

  if (cacheIsFresh) {
    // Classify: same topic or shift?
    const sameTopic = await isSameTopic({ inboundMessage, cachedSummary, anthropic });
    if (sameTopic) {
      console.log(`[intentExtractor] cache hit lead=${leadId}`);
      return cachedSummary;
    }
    shouldRefresh = true;
  }

  // Full extract (no cache, stale cache, or topic shift)
  try {
    summary = await extractIntent({ inboundMessage, leadName, anthropic });
  } catch (err) {
    console.warn(`[intentExtractor:extract] failed: ${err.message}`);
    return null;
  }

  if (!summary) return null;

  // Persist (best-effort)
  const { error } = await supabase.from('leads').update({
    intent_summary: summary,
    intent_summary_at: new Date().toISOString(),
  }).eq('id', leadId);

  if (error) {
    console.warn(`[intentExtractor:persist] failed: ${error.message}`);
    // Still return the summary — caching failed but the agent can use it
  } else {
    console.log(`[intentExtractor] ${shouldRefresh ? 'refreshed' : 'cached'} lead=${leadId}: "${summary.slice(0, 60)}..."`);
  }

  return summary;
}

module.exports = { getReturningBrideIntent };
