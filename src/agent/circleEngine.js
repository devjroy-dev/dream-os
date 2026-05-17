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
const { BRIDE_TOOLS } = require('./brideTools');
const { executeBrideTool } = require('./brideEngine');

// Circle members get a narrow tool surface: list_muse (read board) and
// delete_muse_save (their own saves only — enforced in executeBrideTool
// via saved_by_user_id check). All other tools are bride-only.
const CIRCLE_TOOL_NAMES = new Set(['list_muse', 'delete_muse_save']);
const CIRCLE_TOOLS = BRIDE_TOOLS.filter(t => CIRCLE_TOOL_NAMES.has(t.name));

const HISTORY_LIMIT      = 6;
const CIRCLE_MAX_TOKENS  = 400;  // raised slightly to allow tool + reply
const CIRCLE_MAX_ITERS   = 3;    // list_muse → delete_muse_save → final reply needs 3
const ANTHROPIC_TIMEOUT  = 8000;

async function runCircleAgenticTurn({
  circleMember,
  brideName,
  imageSavesToday,
  conversation,
  inboundMessage,
  mediaContext = null,
  couple,       // { id, user_id } — bride's couple; couple_id scopes muse queries
  circleUser,   // { id }          — circle member's user row; for permission checks
  supabase,
  anthropic,
}) {
  let dynamicContext = buildDynamicCircleContext({
    circleMember,
    brideName,
    imageSavesToday,
  });

  if (mediaContext && typeof mediaContext === 'string' && mediaContext.trim()) {
    dynamicContext = `${mediaContext.trim()}\n\n${dynamicContext}`;
  }

  const { data: recentMessages, error: histErr } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  if (histErr) {
    console.error('[circle-agent] history query failed (proceeding with empty history):', histErr.message);
  }

  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body && m.body.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body,
    }))
    .filter((m, i, arr) => !(i === arr.length - 1 && m.role === 'user' && m.content === inboundMessage));

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Mini tool loop (max CIRCLE_MAX_ITERS) ────────────────────────────
  // Circle members get list_muse + delete_muse_save only.
  // Permission enforcement for delete is inside executeBrideTool.
  console.log(`[circle-agent] model: ${MODEL_HAIKU} (member: ${circleMember?.invitee_name || 'unknown'})`);

  const mediaUrlsToReturn = [];
  let finalReply = null;
  let totalInputTokens  = 0;
  let totalOutputTokens = 0;
  let iterations = 0;

  while (iterations < CIRCLE_MAX_ITERS && finalReply === null) {
    iterations++;

    let response;
    try {
      response = await anthropic.messages.create({
        model:      MODEL_HAIKU,
        max_tokens: CIRCLE_MAX_TOKENS,
        tools:      CIRCLE_TOOLS,
        system: [
          {
            type: 'text',
            text: STATIC_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: dynamicContext,
          },
        ],
        messages,
      }, { timeout: ANTHROPIC_TIMEOUT });
    } catch (err) {
      console.error('[circle-agent] anthropic call failed:', err.message);
      return {
        reply:        'Got it. Thanks.',
        toolCalls:    [],
        iterations,
        model:        MODEL_HAIKU,
        inputTokens:  totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd:      null,
        costInr:      null,
        mediaUrls:    [],
      };
    }

    totalInputTokens  += response.usage?.input_tokens  || 0;
    totalOutputTokens += response.usage?.output_tokens || 0;
    console.log(`[circle-agent] iter ${iterations} stop_reason: ${response.stop_reason}`);

    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(b => b.type === 'tool_use');

      if (!toolUseBlock || !CIRCLE_TOOL_NAMES.has(toolUseBlock.name)) {
        // Hallucinated tool outside the narrow circle surface — end turn
        const textBefore = response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
        finalReply = textBefore || 'Got it.';
        break;
      }

      const toolResult = await executeBrideTool({
        name:             toolUseBlock.name,
        input:            toolUseBlock.input || {},
        couple:           { id: couple.id, user_id: couple.user_id },
        user:             circleUser,
        supabase,
        mediaUrlsToReturn,
      });

      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: [{
          type:        'tool_result',
          tool_use_id: toolUseBlock.id,
          content:     JSON.stringify(toolResult),
        }],
      });

    } else {
      // end_turn — compose final reply
      const textBlocks = response.content.filter(b => b.type === 'text');
      finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Got it.';
    }
  }

  if (finalReply === null) finalReply = 'Got it.';

  const cost = calculateCost(MODEL_HAIKU, totalInputTokens, totalOutputTokens);
  console.log(`[circle-agent] tokens: ${totalInputTokens} in / ${totalOutputTokens} out | cost: $${cost?.cost_usd ?? '?'} / Rs ${cost?.cost_inr ?? '?'}`);

  return {
    reply:        finalReply,
    toolCalls:    [],
    iterations,
    model:        MODEL_HAIKU,
    inputTokens:  totalInputTokens,
    outputTokens: totalOutputTokens,
    costUsd:      cost?.cost_usd ?? null,
    costInr:      cost?.cost_inr ?? null,
    mediaUrls:    mediaUrlsToReturn,
  };
}

module.exports = { runCircleAgenticTurn };
