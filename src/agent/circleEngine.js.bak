// circleEngine.js — circle member agentic turn
//
// Mirrors src/agent/brideEngine.js but with significant simplifications:
//   - NO tools in B2 (circle members have no agentic capabilities beyond auto-save)
//   - NO classifier (always Haiku — circle messages are simple by design)
//   - NO loop (single LLM call → text reply)
//   - SMALLER history limit (6 turns — circle threads are short)
//   - Shorter max_tokens (200 — replies should be 1-2 sentences)
//
// Entry point called from brideIndex.js when an inbound message comes from
// a phone that matches an active circle_member row.
//
// Returns the same shape as runBrideAgenticTurn for parity (reply, toolCalls,
// model, tokens, cost, mediaUrls).
//
// mediaContext parameter mirrors brideEngine:
//   When brideIndex.js has just auto-saved an image/link, it synthesizes a
//   note like "circle member forwarded a Pinterest pin — saved to bride's
//   board as save 12, tags: editorial moody". The agent reads this and
//   composes a natural acknowledgment ("Got it — added to Anjali's board").

const { STATIC_SYSTEM_PROMPT, buildDynamicCircleContext } = require('./circleSystemPrompt');
const { MODEL_HAIKU, calculateCost } = require('./models');

const HISTORY_LIMIT      = 6;
const CIRCLE_MAX_TOKENS  = 200;
const ANTHROPIC_TIMEOUT  = 8000;

async function runCircleAgenticTurn({
  circleMember,
  brideName,
  imageSavesToday,
  conversation,
  inboundMessage,
  mediaContext = null,
  supabase,
  anthropic,
}) {
  // Build dynamic context (member name, role, bride name, daily cap state)
  let dynamicContext = buildDynamicCircleContext({
    circleMember,
    brideName,
    imageSavesToday,
  });

  // Prepend media auto-save context if one just happened.
  // Same pattern as brideEngine: the system note tells the agent what
  // happened so it can reply naturally.
  if (mediaContext && typeof mediaContext === 'string' && mediaContext.trim()) {
    dynamicContext = `${mediaContext.trim()}\n\n${dynamicContext}`;
  }

  // Load short conversation history from this circle thread.
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body && m.body.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body,
    }))
    // Drop the just-logged inbound if it's the last history item
    .filter((m, i, arr) => !(i === arr.length - 1 && m.role === 'user' && m.content === inboundMessage));

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Single Haiku call (no loop, no tools) ────────────────────────
  console.log(`[circle-agent] model: ${MODEL_HAIKU} (member: ${circleMember?.invitee_name || 'unknown'})`);

  let response;
  try {
    response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: CIRCLE_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: STATIC_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },  // 1-hour cache — shared across all circle members
        },
        {
          type: 'text',
          text: dynamicContext,
        },
      ],
      // No tools array — circle agent has no tools in B2.
      messages,
    }, { timeout: ANTHROPIC_TIMEOUT });
  } catch (err) {
    console.error('[circle-agent] anthropic call failed:', err.message);
    // Soft fallback: send a warm minimal reply so the member isn't ghosted.
    return {
      reply:        'Got it. Thanks.',
      toolCalls:    [],
      iterations:   0,
      model:        MODEL_HAIKU,
      inputTokens:  0,
      outputTokens: 0,
      costUsd:      null,
      costInr:      null,
      mediaUrls:    [],
    };
  }

  console.log(`[circle-agent] stop_reason: ${response.stop_reason}`);

  // Compose reply from text blocks. No tool_use blocks expected (no tools).
  const textBlocks = response.content.filter(b => b.type === 'text');
  const finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Got it.';

  const inputTokens  = response.usage?.input_tokens  || 0;
  const outputTokens = response.usage?.output_tokens || 0;
  const cost = calculateCost(MODEL_HAIKU, inputTokens, outputTokens);
  console.log(`[circle-agent] tokens: ${inputTokens} in / ${outputTokens} out | cost: $${cost?.cost_usd ?? '?'} / Rs ${cost?.cost_inr ?? '?'}`);

  return {
    reply:        finalReply,
    toolCalls:    [],
    iterations:   1,
    model:        MODEL_HAIKU,
    inputTokens,
    outputTokens,
    costUsd:      cost?.cost_usd ?? null,
    costInr:      cost?.cost_inr ?? null,
    mediaUrls:    [],
  };
}

module.exports = { runCircleAgenticTurn };
