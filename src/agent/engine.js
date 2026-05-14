// engine.js — the agentic loop
//
// Input:  { vendor, conversation, inboundMessage, supabase, anthropic }
// Output: { reply, toolCalls, notesAdded, stateUpdated }
//
// Flow:
//   1. Load vendor's working memory (vendor_state + recent notes)
//   2. Build system prompt
//   3. Call Claude with full tool list
//   4. Execute any tool calls (note_to_self, update_conversation_state)
//   5. The vendor-visible reply comes from respond_to_vendor
//   6. Loop up to MAX_ITERATIONS if Claude wants more tools
//   7. Persist tool calls to messages.tool_calls for audit

const { buildSystemPrompt } = require('./systemPrompt');
const { TOOLS } = require('./tools');

const MAX_ITERATIONS = 5;
const MODEL = 'claude-haiku-4-5-20251001';

async function runAgenticTurn({ vendor, conversation, inboundMessage, supabase, anthropic }) {
  // 1. Load working memory
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

  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt({
    vendor,
    state,
    recentNotes: recentNotes || [],
  });

  // 3. Build conversation history for the API
  // For now we send only the inbound message. Future sessions will load the
  // last N turns from the messages table.
  const messages = [
    { role: 'user', content: inboundMessage },
  ];

  // 4. Agentic loop
  let iterations = 0;
  let finalReply = null;
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

    // Find tool_use blocks
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No more tool calls — agent is done. But we expected respond_to_vendor.
      // If we didn't get one, fall back to a generic reply.
      if (!finalReply) {
        const textBlocks = response.content.filter(b => b.type === 'text');
        finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Got it.';
      }
      break;
    }

    // Execute each tool
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

      // If this is the visible reply, capture it
      if (toolUse.name === 'respond_to_vendor') {
        finalReply = toolUse.input.message;
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Append assistant message and tool results to history for next iteration
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    // If respond_to_vendor was called, we're done — no more loops needed
    if (finalReply !== null) {
      break;
    }
  }

  // Refresh recent_notes cache on vendor_state (last 10 notes)
  const { data: latestNotes } = await supabase
    .from('notes')
    .select('content, tags, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(10);

  await supabase
    .from('vendor_state')
    .upsert({
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
      // No side effect — capturing the reply happens in the loop.
      console.log(`[tool:respond] "${input.message.slice(0, 80)}..."`);
      return 'Reply queued.';
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

module.exports = { runAgenticTurn };
