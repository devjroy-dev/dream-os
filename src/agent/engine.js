// engine.js — the agentic loop
// Session 3: adds conversation history + onboarding routing

const { buildSystemPrompt }    = require('./systemPrompt');
const { buildOnboardingPrompt, nextOnboardingMessage } = require('./onboarding');
const { TOOLS } = require('./tools');

const MAX_ITERATIONS = 5;
const MODEL          = 'claude-haiku-4-5-20251001';
const HISTORY_LIMIT  = 10; // last N turns to send to Claude

async function runAgenticTurn({ vendor, user, conversation, inboundMessage, supabase, anthropic }) {

  // ── Onboarding routing ──────────────────────────────────────────
  // If vendor is not yet fully onboarded, route to onboarding handler
  if (vendor.onboarding_state && vendor.onboarding_state !== 'complete') {
    return await handleOnboarding({
      vendor, user, conversation, inboundMessage, supabase, anthropic,
    });
  }

  // ── Load working memory ─────────────────────────────────────────
  const { data: state } = await supabase
    .from('vendor_state')
    .select('*')
    .eq('vendor_id', vendor.id)
    .maybeSingle();

  const { data: recentNotes } = await supabase
    .from('notes')
    .select('content, tags, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // ── Load conversation history ───────────────────────────────────
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1); // +1 because the inbound we just received is already in DB

  // Build history in chronological order, excluding the just-received message
  // (it's passed as the current user message, not in history)
  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body !== inboundMessage || m.direction !== 'inbound')
    .slice(-HISTORY_LIMIT)
    .map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body || '',
    }))
    // Claude requires alternating roles — filter consecutive same roles
    .reduce((acc, msg) => {
      if (acc.length === 0) return [msg];
      if (acc[acc.length - 1].role === msg.role) return acc; // skip duplicate role
      return [...acc, msg];
    }, []);

  // ── Build system prompt ─────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({
    vendor,
    user,
    state,
    recentNotes: recentNotes || [],
  });

  // ── Build messages array ────────────────────────────────────────
  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Agentic loop ────────────────────────────────────────────────
  let iterations  = 0;
  let finalReply  = null;
  const toolCallsAudit = [];

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });

    console.log(`[agent] iteration ${iterations}, stop_reason: ${response.stop_reason}`);

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No tool calls — use text response as fallback
      if (!finalReply) {
        const textBlocks = response.content.filter(b => b.type === 'text');
        finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Got it.';
      }
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeTool({
        name: toolUse.name,
        input: toolUse.input,
        vendor,
        conversation,
        supabase,
      });

      toolCallsAudit.push({ name: toolUse.name, input: toolUse.input, result });

      if (toolUse.name === 'respond_to_vendor') {
        finalReply = toolUse.input.message;
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    if (finalReply !== null) break;
  }

  // ── Refresh recent_notes cache ──────────────────────────────────
  const { data: latestNotes } = await supabase
    .from('notes')
    .select('content, tags, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(10);

  await supabase.from('vendor_state').upsert({
    vendor_id: vendor.id,
    recent_notes: latestNotes || [],
    updated_at: new Date().toISOString(),
  });

  return {
    reply: finalReply || 'Got it.',
    toolCalls: toolCallsAudit,
    iterations,
  };
}

// ── Onboarding handler ────────────────────────────────────────────
async function handleOnboarding({ vendor, user, conversation, inboundMessage, supabase, anthropic }) {
  const result = await nextOnboardingMessage({
    vendor,
    user,
    inboundMessage,
    supabase,
  });

  return {
    reply: result.reply,
    toolCalls: [],
    iterations: 1,
  };
}

// ── Tool executor ─────────────────────────────────────────────────
async function executeTool({ name, input, vendor, conversation, supabase }) {
  switch (name) {
    case 'note_to_self': {
      const { error } = await supabase.from('notes').insert({
        vendor_id: vendor.id,
        conversation_id: conversation.id,
        content: input.content,
        tags: input.tags || null,
      });
      if (error) {
        console.error('[tool:note_to_self] error:', error);
        return `Error: ${error.message}`;
      }
      console.log(`[tool:note_to_self] "${input.content}"`);
      return 'Note saved.';
    }

    case 'update_conversation_state': {
      const { error } = await supabase
        .from('conversations')
        .update({ state: input.new_state })
        .eq('id', conversation.id);
      if (error) {
        console.error('[tool:update_state] error:', error);
        return `Error: ${error.message}`;
      }
      console.log(`[tool:update_state] → ${input.new_state} (${input.reason})`);
      return `State updated to ${input.new_state}.`;
    }

    case 'respond_to_vendor': {
      console.log(`[tool:respond] "${input.message.slice(0, 80)}..."`);
      return 'Reply queued.';
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

module.exports = { runAgenticTurn };
