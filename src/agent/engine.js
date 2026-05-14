// engine.js — the agentic loop
// Session 4: adds create_lead, list_leads, update_lead_state tool handlers

const { buildSystemPrompt }    = require('./systemPrompt');
const { nextOnboardingMessage } = require('./onboarding');
const { TOOLS } = require('./tools');

const MAX_ITERATIONS = 5;
const MODEL          = 'claude-haiku-4-5-20251001';
const HISTORY_LIMIT  = 10;

async function runAgenticTurn({ vendor, user, conversation, inboundMessage, supabase, anthropic }) {

  // ── Onboarding routing ──────────────────────────────────────────
  if (vendor.onboarding_state && vendor.onboarding_state !== 'complete') {
    return await handleOnboarding({ vendor, user, conversation, inboundMessage, supabase });
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

  // ── Load open leads count for context ──────────────────────────
  const { count: openLeadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .in('state', ['new', 'contacted', 'quoted']);

  // ── Load conversation history ───────────────────────────────────
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body !== inboundMessage || m.direction !== 'inbound')
    .slice(-HISTORY_LIMIT)
    .map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body || '',
    }))
    .reduce((acc, msg) => {
      if (acc.length === 0) return [msg];
      if (acc[acc.length - 1].role === msg.role) return acc;
      return [...acc, msg];
    }, []);

  // ── Build system prompt ─────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({
    vendor,
    user,
    state,
    recentNotes: recentNotes || [],
    openLeadsCount: openLeadsCount || 0,
  });

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
        content: typeof result === 'string' ? result : JSON.stringify(result),
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

  // Strip any commentary after the first question mark
  // The agent should stop after asking one question — nothing more
  if (finalReply) {
    const qIdx = finalReply.indexOf('?');
    if (qIdx !== -1) {
      finalReply = finalReply.slice(0, qIdx + 1).trim();
    }
  }

  return {
    reply: finalReply || 'Got it.',
    toolCalls: toolCallsAudit,
    iterations,
  };
}

// ── Onboarding handler ────────────────────────────────────────────
async function handleOnboarding({ vendor, user, conversation, inboundMessage, supabase }) {
  const result = await nextOnboardingMessage({
    vendor, user, inboundMessage, supabase,
  });
  return { reply: result.reply, toolCalls: [], iterations: 1 };
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
      if (error) return `Error: ${error.message}`;
      console.log(`[tool:note_to_self] "${input.content}"`);
      return 'Note saved.';
    }

    case 'create_lead': {
      // Parse wedding date safely
      let wedding_date = null;
      if (input.wedding_date) {
        const parsed = new Date(input.wedding_date);
        if (!isNaN(parsed.getTime())) {
          wedding_date = parsed.toISOString().split('T')[0];
        }
      }

      const { data: lead, error } = await supabase.from('leads').insert({
        vendor_id:    vendor.id,
        name:         input.name         || null,
        phone:        input.phone        || null,
        email:        input.email        || null,
        wedding_date,
        wedding_city: input.wedding_city || null,
        event_types:  input.event_types  || null,
        budget_min:   input.budget_min   || null,
        budget_max:   input.budget_max   || null,
        source:       input.source       || 'whatsapp',
        referrer_name: input.referrer_name || null,
        notes:        input.notes        || null,
        raw_message:  input.raw_message  || null,
        state:        'new',
      }).select('id, name, wedding_date').single();

      if (error) {
        console.error('[tool:create_lead] error:', error);
        return `Error creating lead: ${error.message}`;
      }

      console.log(`[tool:create_lead] ${lead.name || 'unnamed'} — ${lead.wedding_date || 'no date'} (${lead.id})`);
      return `Lead created. ID: ${lead.id}. Name: ${lead.name || 'unknown'}. Date: ${lead.wedding_date || 'not specified'}.`;
    }

    case 'list_leads': {
      let query = supabase
        .from('leads')
        .select('id, name, wedding_date, wedding_city, state, budget_min, budget_max, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (input.state !== 'all') {
        query = query.eq('state', input.state);
      }

      const { data: leads, error } = await query;
      if (error) return `Error fetching leads: ${error.message}`;

      if (!leads || leads.length === 0) {
        return input.state === 'all'
          ? 'No leads yet.'
          : `No leads with state: ${input.state}.`;
      }

      const summary = leads.map(l => {
        const date   = l.wedding_date || 'no date';
        const budget = l.budget_min
          ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `–${(l.budget_max/100000).toFixed(1)}L` : ''}`
          : 'budget unknown';
        return `${l.name || 'Unknown'} — ${date} — ${l.state} — ${budget}`;
      }).join('\n');

      return `${leads.length} lead(s):\n${summary}`;
    }

    case 'update_lead_state': {
      const { error } = await supabase
        .from('leads')
        .update({ state: input.new_state })
        .eq('id', input.lead_id)
        .eq('vendor_id', vendor.id); // safety: can only update own leads

      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_lead_state] ${input.lead_id} → ${input.new_state}`);
      return `Lead updated to ${input.new_state}.`;
    }

    case 'update_conversation_state': {
      const { error } = await supabase
        .from('conversations')
        .update({ state: input.new_state })
        .eq('id', conversation.id);
      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_state] → ${input.new_state}`);
      return `Conversation state updated to ${input.new_state}.`;
    }

    case 'respond_to_vendor': {
      console.log(`[tool:respond] "${input.message.slice(0, 80)}"`);
      return 'Reply queued.';
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

module.exports = { runAgenticTurn };
