// engine.js — the agentic loop
// Session 4: adds create_lead, list_leads, update_lead_state tool handlers
// Session 5.5: adds runCoupleAgenticTurn for couple_thread conversations

const { buildSystemPrompt }       = require('./systemPrompt');
const { buildCoupleSystemPrompt } = require('./coupleSystemPrompt');
const { nextOnboardingMessage }   = require('./onboarding');
const { TOOLS }                   = require('./tools');

const MAX_ITERATIONS = 5;
const MODEL          = 'claude-haiku-4-5-20251001';
const HISTORY_LIMIT  = 10;

// ── Vendor agentic turn ───────────────────────────────────────────
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

// ── Couple agentic turn ───────────────────────────────────────────
// Runs on couple_thread conversations.
// Collects event details, updates lead, notifies vendor with summary.
async function runCoupleAgenticTurn({ vendor, vendorUser, conversation, couplePhone, inboundMessage, supabase, anthropic }) {

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

  const systemPrompt = buildCoupleSystemPrompt({ vendor, vendorUser });

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Agentic loop ────────────────────────────────────────────────
  let iterations  = 0;
  let finalReply  = null;
  let leadCaptured = null;
  const toolCallsAudit = [];

  const COUPLE_TOOLS = [
    {
      name: 'capture_couple_lead',
      description: 'Save the collected event details as a structured lead. Call this once you have occasion, date/city, and budget. After calling this, call respond_to_couple to close the conversation.',
      input_schema: {
        type: 'object',
        properties: {
          occasion: { type: 'string', description: 'Type of event e.g. wedding, birthday, corporate' },
          event_date: { type: 'string', description: 'Date in YYYY-MM-DD or approximate e.g. 2027-03-01' },
          event_city: { type: 'string', description: 'City where the event is happening' },
          budget_min: { type: 'number', description: 'Minimum budget in Rs e.g. 150000' },
          budget_max: { type: 'number', description: 'Maximum budget in Rs' },
          name: { type: 'string', description: 'Couple or person name if shared' },
          notes: { type: 'string', description: 'Anything else worth capturing' },
        },
        required: [],
      },
    },
    {
      name: 'respond_to_couple',
      description: 'Send a reply to the couple. Plain text, warm, conversational. One question at a time. Maximum 2 sentences.',
      input_schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The message to send to the couple.' },
          conversation_done: { type: 'boolean', description: 'Set to true when you have collected all details and closed the conversation warmly.' },
        },
        required: ['message'],
      },
    },
  ];

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      tools: COUPLE_TOOLS,
      messages,
    });

    console.log(`[couple-agent] iteration ${iterations}, stop_reason: ${response.stop_reason}`);

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      if (!finalReply) {
        const textBlocks = response.content.filter(b => b.type === 'text');
        finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Thanks — we\'ll be in touch soon!';
      }
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {

      if (toolUse.name === 'capture_couple_lead') {
        const input = toolUse.input;

        // Parse date safely
        let event_date = null;
        if (input.event_date) {
          const parsed = new Date(input.event_date);
          if (!isNaN(parsed.getTime())) {
            const today = new Date();
            if (parsed < today) {
              parsed.setFullYear(parsed.getFullYear() + 1);
              if (parsed < today) parsed.setFullYear(parsed.getFullYear() + 1);
            }
            event_date = parsed.toISOString().split('T')[0];
          }
        }

        // Upsert lead — dedup on (vendor_id, phone)
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('phone', couplePhone)
          .maybeSingle();

        if (existingLead) {
          // Update existing lead with collected details
          await supabase.from('leads').update({
            name:         input.name         || null,
            wedding_date: event_date,
            wedding_city: input.event_city   || null,
            event_types:  input.occasion ? [input.occasion] : null,
            budget_min:   input.budget_min   || null,
            budget_max:   input.budget_max   || null,
            notes:        input.notes        || null,
          }).eq('id', existingLead.id);
          leadCaptured = existingLead.id;
        } else {
          // Create new lead
          const { data: newLead } = await supabase.from('leads').insert({
            vendor_id:    vendor.id,
            phone:        couplePhone,
            name:         input.name         || null,
            wedding_date: event_date,
            wedding_city: input.event_city   || null,
            event_types:  input.occasion ? [input.occasion] : null,
            budget_min:   input.budget_min   || null,
            budget_max:   input.budget_max   || null,
            source:       'whatsapp',
            notes:        input.notes        || null,
            state:        'new',
          }).select('id').single();
          if (newLead) leadCaptured = newLead.id;
        }

        // Build vendor notification summary
        const parts = [];
        if (input.name)       parts.push(`Name: ${input.name}`);
        if (input.occasion)   parts.push(`Occasion: ${input.occasion}`);
        if (event_date)       parts.push(`Date: ${event_date}`);
        if (input.event_city) parts.push(`City: ${input.event_city}`);
        if (input.budget_min) {
          const bud = `Rs ${(input.budget_min/100000).toFixed(1)}L${input.budget_max && input.budget_max !== input.budget_min ? `-${(input.budget_max/100000).toFixed(1)}L` : ''}`;
          parts.push(`Budget: ${bud}`);
        }
        const summary = parts.length > 0 ? parts.join(', ') : 'Details still being collected';

        // Notify vendor on their self-thread
        if (vendorUser?.phone) {
          const { data: vendorSelfConvo } = await supabase
            .from('conversations')
            .select('id')
            .eq('vendor_id', vendor.id)
            .eq('kind', 'vendor_self')
            .maybeSingle();

          const notifMsg = `New enquiry from ${couplePhone}. ${summary}. Lead saved.`;

          if (vendorSelfConvo) {
            await supabase.from('messages').insert({
              conversation_id: vendorSelfConvo.id,
              direction: 'outbound',
              channel: 'whatsapp',
              body: notifMsg,
              sent_by: 'system',
            });
          }

          // Send WhatsApp to vendor — handled in index.js after this returns
          // Store notification in toolCallsAudit for index.js to pick up
          toolCallsAudit.push({ name: 'vendor_notification', message: notifMsg });
        }

        console.log(`[couple-agent] lead captured for ${couplePhone} — ${summary}`);
        toolCallsAudit.push({ name: 'capture_couple_lead', input: toolUse.input, result: 'Lead saved.' });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: 'Lead saved successfully.',
        });

      } else if (toolUse.name === 'respond_to_couple') {
        finalReply = toolUse.input.message;
        toolCallsAudit.push({ name: 'respond_to_couple', input: toolUse.input, result: 'Reply queued.' });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: 'Reply queued.',
        });
      }
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    if (finalReply !== null) break;
  }

  return {
    reply: finalReply || 'Thanks — we\'ll be in touch soon!',
    toolCalls: toolCallsAudit,
    iterations,
    vendorNotification: toolCallsAudit.find(t => t.name === 'vendor_notification')?.message || null,
  };
}

// ── Onboarding handler ────────────────────────────────────────────
async function handleOnboarding({ vendor, user, conversation, inboundMessage, supabase }) {
  const result = await nextOnboardingMessage({
    vendor, user, inboundMessage, supabase,
  });
  return { reply: result.reply, toolCalls: [], iterations: 1 };
}

// ── Tool executor (vendor agent) ──────────────────────────────────
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
          ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `-${(l.budget_max/100000).toFixed(1)}L` : ''}`
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
        .eq('vendor_id', vendor.id);

      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_lead_state] ${input.lead_id} -> ${input.new_state}`);
      return `Lead updated to ${input.new_state}.`;
    }

    case 'update_conversation_state': {
      const { error } = await supabase
        .from('conversations')
        .update({ state: input.new_state })
        .eq('id', conversation.id);
      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_state] -> ${input.new_state}`);
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

module.exports = { runAgenticTurn, runCoupleAgenticTurn };
