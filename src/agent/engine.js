// engine.js — the agentic loop
// Session 4: adds create_lead, list_leads, update_lead_state tool handlers
// Session 5.5: adds runCoupleAgenticTurn for couple_thread conversations

const { buildDynamicContext, STATIC_SYSTEM_PROMPT } = require('./systemPrompt');
const { buildCoupleSystemPrompt } = require('./coupleSystemPrompt');
const { nextOnboardingMessage }   = require('./onboarding');
const { TOOLS }                   = require('./tools');
const { buildInvoiceMessage }     = require('../lib/invoiceMessage');
const { generateInvoicePdf }     = require('../lib/invoicePdf');
const { formatRs }               = require('../lib/format');
const { classifyMessage }         = require('./classifier');
const { MODEL_HAIKU, MODEL_SONNET, calculateCost, COMPLEXITY } = require('./models');

const MAX_ITERATIONS = 5;
const HISTORY_LIMIT  = 10;

// ── Vendor agentic turn ───────────────────────────────────────────
async function runAgenticTurn({ vendor, user, conversation, inboundMessage, supabase, anthropic }) {

  // ── Onboarding routing ──────────────────────────────────────────
  if (vendor.onboarding_state && vendor.onboarding_state !== 'complete') {
    return await handleOnboarding({ vendor, user, conversation, inboundMessage, supabase, anthropic });
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

  // ── Load upcoming events for context (next 14 days, IST) ───────
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffsetMs);
  const istToday = istNow.toISOString().split('T')[0];
  const ist14days = new Date(istNow.getTime() + 14 * 86400000).toISOString().split('T')[0];

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, kind')
    .eq('vendor_id', vendor.id)
    .eq('state', 'upcoming')
    .gte('event_date', istToday)
    .lte('event_date', ist14days)
    .order('event_date', { ascending: true })
    .limit(10);

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
  const dynamicContext = buildDynamicContext({
    vendor,
    user,
    state,
    recentNotes: recentNotes || [],
    openLeadsCount: openLeadsCount || 0,
    upcomingEvents: upcomingEvents || [],
  });

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Classify complexity → pick model ───────────────────────────
  // Pass last 2 history turns so classifier has disambiguation context.
  const classifierHistory = history.slice(-2);
  const complexity  = await classifyMessage(inboundMessage, classifierHistory, anthropic);
  const modelToUse  = complexity === COMPLEXITY.COMPLEX ? MODEL_SONNET : MODEL_HAIKU;
  console.log(`[agent] model selected: ${modelToUse} (${complexity})`);

  // ── Agentic loop ────────────────────────────────────────────────
  let iterations     = 0;
  let finalReply     = null;
  let totalInputTok  = 0;
  let totalOutputTok = 0;
  const toolCallsAudit = [];

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: STATIC_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },  // 1-hour cache — saves ~6,600 tokens per call
        },
        {
          type: 'text',
          text: dynamicContext,                   // vendor-specific — never cached
        },
      ],
      tools: TOOLS,
      messages,
    });

    // Accumulate token usage across all iterations
    totalInputTok  += response.usage?.input_tokens  || 0;
    totalOutputTok += response.usage?.output_tokens || 0;

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

  // Strip any commentary after the first sentence-ending question mark.
  // A sentence-ending "?" is followed by a space, newline, or end-of-string.
  // A URL query separator "?" is followed by alphanumeric characters — we do NOT strip those.
  if (finalReply) {
    const sentenceEndQ = /\?(?=\s|$)/;
    const match = sentenceEndQ.exec(finalReply);
    if (match) {
      finalReply = finalReply.slice(0, match.index + 1).trim();
    }
  }

  // ── Calculate and return cost data ────────────────────────────
  const cost = calculateCost(modelToUse, totalInputTok, totalOutputTok);
  console.log(`[agent] tokens: ${totalInputTok} in / ${totalOutputTok} out | cost: $${cost?.cost_usd ?? '?'} / Rs ${cost?.cost_inr ?? '?'}`);

  return {
    reply:        finalReply || 'Got it.',
    toolCalls:    toolCallsAudit,
    iterations,
    model:        modelToUse,
    inputTokens:  totalInputTok,
    outputTokens: totalOutputTok,
    costUsd:      cost?.cost_usd  ?? null,
    costInr:      cost?.cost_inr  ?? null,
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
      model: MODEL_HAIKU,   // couple agent: Haiku always — narrow scope, simple routing
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
async function handleOnboarding({ vendor, user, conversation, inboundMessage, supabase, anthropic }) {
  const result = await nextOnboardingMessage({
    vendor, user, inboundMessage, supabase, anthropic,
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
        .select('id, name, phone, wedding_date, wedding_city, state, budget_min, budget_max, created_at')
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
        return `${l.name || 'Unknown'} — ${l.phone || 'no phone'} — ${date} — ${l.state} — ${budget}`;
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

    case 'create_event': {
      // Sanitise linked_lead_id — agent sometimes passes a name instead of UUID
      let linked_lead_id = null;
      if (input.linked_lead_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.linked_lead_id)) {
        linked_lead_id = input.linked_lead_id;
      }

      const { data: event, error } = await supabase.from('events').insert({
        vendor_id:      vendor.id,
        title:          input.title,
        event_date:     input.event_date,
        event_time:     input.event_time || null,
        kind:           input.kind,
        linked_lead_id,
        notes:          input.notes || null,
        state:          'upcoming',
      }).select('id, title, event_date, kind').single();

      if (error) {
        console.error('[tool:create_event] error:', error);
        return `Error creating event: ${error.message}`;
      }

      console.log(`[tool:create_event] ${event.kind} "${event.title}" on ${event.event_date} (${event.id})`);
      return `Event created. ID: ${event.id}. ${event.kind}: ${event.title} on ${event.event_date}.`;
    }

    case 'create_invoice': {
      // 4a. Validation
      if (input.amount_total <= 0) return 'Invoice total must be greater than zero.';
      if (input.amount_advance != null && input.amount_advance < 0) return 'Advance amount cannot be negative.';
      if (input.amount_advance != null && input.amount_advance > input.amount_total) return 'Advance amount cannot exceed the invoice total.';

      // 4b. Fetch vendor row
      const { data: v } = await supabase
        .from('vendors')
        .select('id, business_name, upi_id, routing_handle, invoice_prefix, invoice_counter, user_id')
        .eq('id', vendor.id)
        .single();

      // 4c. Fetch user name (fallback for display)
      const { data: u } = await supabase
        .from('users')
        .select('name')
        .eq('id', v.user_id)
        .single();

      // 4d. Guard: routing handle
      if (!v.routing_handle) return 'Cannot create invoice — onboarding is incomplete. Contact support.';

      // 4e. Duplicate name check (only if lead_id not provided)
      if (!input.lead_id) {
        // Check leads table
        const { data: leadMatches } = await supabase
          .from('leads')
          .select('id, name, wedding_date, wedding_city')
          .eq('vendor_id', vendor.id)
          .ilike('name', `%${input.client_name}%`);

        // Check invoices table
        const { data: invoiceMatches } = await supabase
          .from('invoices')
          .select('id, client_name, invoice_number, state, created_at')
          .eq('vendor_id', vendor.id)
          .ilike('client_name', `%${input.client_name}%`)
          .neq('state', 'cancelled');

        const hasLeadMatches    = leadMatches    && leadMatches.length > 0;
        const hasInvoiceMatches = invoiceMatches && invoiceMatches.length > 0;

        if (hasLeadMatches || hasInvoiceMatches) {
          let msg = `Found existing records for "${input.client_name}":\n`;

          if (hasLeadMatches) {
            msg += `\nLeads:\n`;
            msg += leadMatches.map(l => {
              const date = l.wedding_date ? `, wedding ${l.wedding_date}` : '';
              const city = l.wedding_city ? `, ${l.wedding_city}` : '';
              return `- ${l.name}${date}${city} (lead ID: ${l.id})`;
            }).join('\n');
          }

          if (hasInvoiceMatches) {
            msg += `\nExisting invoices:\n`;
            msg += invoiceMatches.map(i => {
              const date = new Date(i.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              return `- ${i.invoice_number} (${i.state}, raised ${date})`;
            }).join('\n');
          }

          msg += `\n\nIs this the same ${input.client_name}, or a different person? If same, confirm and I'll raise the invoice. If different, give me a more specific name (e.g. "Priya from Pune").`;

          return msg;
        }
      }

      // 4f. Set invoice prefix if null
      if (v.invoice_prefix === null) {
        const derivedPrefix = `TDW/${v.routing_handle}`;
        await supabase.from('vendors').update({ invoice_prefix: derivedPrefix }).eq('id', vendor.id);
        v.invoice_prefix = derivedPrefix;
      }

      // 4g. Increment counter (atomic)
      const { data: vUpd } = await supabase
        .from('vendors')
        .update({ invoice_counter: v.invoice_counter + 1 })
        .eq('id', vendor.id)
        .select('invoice_counter')
        .single();
      const newCounter = vUpd.invoice_counter;

      // 4h. Build invoice number
      const invoiceNumber = `${v.invoice_prefix}/${String(newCounter).padStart(2, '0')}`;

      // 4i. Insert invoice row
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert({
          vendor_id:      vendor.id,
          lead_id:        input.lead_id || null,
          invoice_number: invoiceNumber,
          client_name:    input.client_name,
          client_phone:   input.client_phone || null,
          description:    input.description  || null,
          amount_total:   input.amount_total,
          amount_advance: input.amount_advance || null,
          amount_paid:    0,
          due_date:       input.due_date || null,
          state:          'unpaid',
          notes:          input.notes || null,
        })
        .select('id')
        .single();

      if (invErr) return `Error creating invoice: ${invErr.message}`;

      // 4j. Compose message
      const vendorDisplayName = v.business_name || u?.name || 'Your vendor';

      const composedMessage = buildInvoiceMessage({
        clientName:        input.client_name,
        vendorDisplayName,
        invoiceNumber,
        description:       input.description  || null,
        amountTotal:       input.amount_total,
        amountAdvance:     input.amount_advance || null,
        dueDate:           input.due_date      || null,
        upiId:             v.upi_id            || null,
      });

      // 4k. Build return string
      let result = `Invoice ${invoiceNumber} created.\n\n`;
      result += `--- FORWARD THIS TO ${input.client_name.toUpperCase()} — DO NOT MODIFY ---\n`;
      result += composedMessage;
      result += `\n--- END ---`;
      if (!v.upi_id) {
        result += `\n\n(UPI ID not saved — client won't see a payment ID. Reply "set my UPI to [your UPI]" to add it.)`;
      }
      console.log(`[tool:create_invoice] ${invoiceNumber} for ${input.client_name} — Rs ${input.amount_total}`);
      return result;
    }

    case 'list_events': {
      // Compute IST date boundaries (UTC+5:30)
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs);
      const istToday = istNow.toISOString().split('T')[0];

      let dateStart = istToday;
      let dateEnd   = null;

      if (input.window === 'today') {
        dateEnd = istToday;
      } else if (input.window === 'this_week') {
        // End of current week (Sunday). getUTCDay() returns 0=Sunday, 1=Monday...
        const daysUntilSunday = (7 - istNow.getUTCDay()) % 7;
        const sundayDate = new Date(istNow.getTime() + daysUntilSunday * 86400000);
        dateEnd = sundayDate.toISOString().split('T')[0];
      } else if (input.window === 'next_7_days') {
        const plus7 = new Date(istNow.getTime() + 7 * 86400000);
        dateEnd = plus7.toISOString().split('T')[0];
      }
      // upcoming_all: dateEnd stays null (no upper bound)

      let query = supabase
        .from('events')
        .select('id, title, event_date, event_time, kind, state, notes')
        .eq('vendor_id', vendor.id)
        .eq('state', 'upcoming')
        .gte('event_date', dateStart)
        .order('event_date', { ascending: true })
        .limit(20);

      if (dateEnd) query = query.lte('event_date', dateEnd);
      if (input.kind && input.kind !== 'all') query = query.eq('kind', input.kind);

      const { data: events, error } = await query;
      if (error) return `Error fetching events: ${error.message}`;

      if (!events || events.length === 0) {
        return `No events found in window: ${input.window}.`;
      }

      const summary = events.map(e => {
        const time = e.event_time ? ` at ${e.event_time.slice(0, 5)}` : '';
        return `${e.event_date}${time} — ${e.kind}: ${e.title}`;
      }).join('\n');

      return `${events.length} event(s):\n${summary}`;
    }

    case 'update_event_state': {
      const { error } = await supabase
        .from('events')
        .update({ state: input.new_state })
        .eq('id', input.event_id)
        .eq('vendor_id', vendor.id);

      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_event_state] ${input.event_id} -> ${input.new_state}`);
      return `Event marked ${input.new_state}.`;
    }

    case 'update_routing_handle': {
      // Clean: uppercase, alphanumeric + hyphen only
      const cleaned = (input.new_handle || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (cleaned.length < 3) {
        return 'Handle too short. Needs at least 3 alphanumeric characters.';
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from('vendors')
        .select('id')
        .eq('routing_handle', cleaned)
        .neq('id', vendor.id)
        .maybeSingle();

      if (existing) {
        return `Handle ${cleaned} is already taken. Ask the vendor to try another.`;
      }

      const { error } = await supabase
        .from('vendors')
        .update({ routing_handle: cleaned })
        .eq('id', vendor.id);

      if (error) return `Error updating handle: ${error.message}`;

      console.log(`[tool:update_routing_handle] vendor ${vendor.id} -> ${cleaned}`);
      return `Handle updated to ${cleaned}. New TDW link: wa.me/${process.env.TDW_WA_NUMBER || '14787788550'}?text=TDW-${cleaned}`;
    }

    case 'get_my_tdw_link': {
      const { data: v } = await supabase
        .from('vendors')
        .select('routing_handle')
        .eq('id', vendor.id)
        .maybeSingle();

      if (!v || !v.routing_handle) {
        return 'No TDW handle is set for this vendor. This is unexpected — escalate to Dev.';
      }

      const tdwNumber = process.env.TDW_WA_NUMBER || '14787788550';
      const link = `wa.me/${tdwNumber}?text=TDW-${v.routing_handle}`;
      console.log(`[tool:get_my_tdw_link] vendor ${vendor.id} -> ${link}`);
      return `TDW link: ${link}`;
    }

    case 'respond_to_vendor': {
      console.log(`[tool:respond] "${input.message.slice(0, 80)}"`);
      return 'Reply queued.';
    }

    case 'record_payment': {
      // Fetch invoice — must belong to this vendor
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', input.invoice_id)
        .eq('vendor_id', vendor.id)
        .single();

      if (invErr || !inv) return 'Invoice not found. Check the invoice ID and try again.';
      if (inv.state === 'paid')      return `Invoice ${inv.invoice_number} is already fully paid.`;
      if (inv.state === 'cancelled') return `Invoice ${inv.invoice_number} is cancelled — cannot record payment.`;

      const newAmountPaid = inv.amount_paid + input.amount_received;

      // Soft overpayment warning (shagun, tips — not blocked at DB)
      if (newAmountPaid > inv.amount_total) {
        const excess = newAmountPaid - inv.amount_total;
        console.warn(`[tool:record_payment] overpayment of Rs ${excess} on ${inv.invoice_number} — recording as-is`);
      }

      // Determine new state
      let newState = inv.state;
      if (input.payment_type === 'balance' || newAmountPaid >= inv.amount_total) {
        newState = 'paid';
      } else if (input.payment_type === 'advance' && inv.state === 'unpaid') {
        newState = 'advance_paid';
      }

      // Update invoice record
      await supabase.from('invoices').update({
        amount_paid: newAmountPaid,
        state:       newState,
        updated_at:  new Date().toISOString(),
      }).eq('id', inv.id);

      console.log(`[tool:record_payment] ${inv.invoice_number} Rs ${input.amount_received} received — ${inv.state} -> ${newState}`);

      // ── Stage 2: advance paid → generate booking confirmation PDF ──
      if (newState === 'advance_paid') {
        try {
          const { data: v } = await supabase
            .from('vendors')
            .select('business_name, upi_id, routing_handle, user_id')
            .eq('id', vendor.id)
            .single();

          const { data: u } = await supabase
            .from('users')
            .select('name')
            .eq('id', v.user_id)
            .single();

          const pdfBuffer = await generateInvoicePdf({
            invoice:    { ...inv, amount_paid: newAmountPaid },
            vendor:     v,
            vendorName: u?.name || 'Vendor',
          });

          const fileName = `${vendor.id}/${inv.invoice_number.replace(/\//g, '-')}.pdf`;

          const { error: uploadErr } = await supabase.storage
            .from('invoices')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert:      true,
            });

          if (uploadErr) {
            console.error('[tool:record_payment] PDF upload failed:', uploadErr.message);
            return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Booking confirmed. PDF generation failed — try again or contact support.`;
          }

          // Signed URL valid for 1 year
          const { data: signedData } = await supabase.storage
            .from('invoices')
            .createSignedUrl(fileName, 60 * 60 * 24 * 365);

          if (signedData?.signedUrl) {
            await supabase.from('invoices')
              .update({ pdf_url: signedData.signedUrl })
              .eq('id', inv.id);
          }

          const balance    = inv.amount_total - newAmountPaid;
          const balanceStr = balance > 0 ? ` Balance due: Rs ${formatRs(balance)}.` : '';
          const pdfUrl     = signedData?.signedUrl || null;

          console.log(`[tool:record_payment] PDF generated for ${inv.invoice_number} — ${fileName}`);

          let result = `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Booking confirmed.${balanceStr}`;
          if (pdfUrl) result += `

--- BOOKING CONFIRMATION PDF — FORWARD TO ${inv.client_name.toUpperCase()} ---
${pdfUrl}
--- END ---`;
          return result;

        } catch (pdfErr) {
          console.error('[tool:record_payment] PDF error:', pdfErr.message);
          return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Booking confirmed. PDF could not be generated: ${pdfErr.message}`;
        }
      }

      // ── Stage 3: balance paid → plain text, invoice closed ──────────
      if (newState === 'paid') {
        return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Invoice ${inv.invoice_number} fully paid (Rs ${formatRs(inv.amount_total)}). All done.`;
      }

      // ── Partial payment — invoice still open ─────────────────────────
      const remaining = inv.amount_total - newAmountPaid;
      return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Rs ${formatRs(remaining)} still outstanding on ${inv.invoice_number}.`;
    }

    case 'list_invoices': {
      const state = input.state || 'unpaid';

      let query = supabase
        .from('invoices')
        .select('id, invoice_number, client_name, amount_total, amount_paid, state, due_date, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (state !== 'all') query = query.eq('state', state);

      const { data: invoices, error } = await query;
      if (error) return `Error fetching invoices: ${error.message}`;
      if (!invoices || invoices.length === 0) {
        return state === 'all' ? 'No invoices yet.' : `No ${state} invoices.`;
      }

      const lines = invoices.map(i => {
        const balance = i.amount_total - i.amount_paid;
        const due     = i.due_date ? `, due ${i.due_date}` : '';
        const bal     = balance > 0 ? `, balance Rs ${formatRs(balance)}` : ' (paid)';
        return `${i.invoice_number} — ${i.client_name} — Rs ${formatRs(i.amount_total)}${bal} — ${i.state}${due} (ID: ${i.id})`;
      }).join('\n');

      return `${invoices.length} invoice(s):\n${lines}`;
    }

    case 'log_expense': {
      if (!input.amount || input.amount <= 0) return 'Expense amount must be greater than zero.';

      const { data: expense, error } = await supabase.from('expenses').insert({
        vendor_id:      vendor.id,
        amount:         input.amount,
        category:       input.category,
        description:    input.description   || null,
        expense_date:   input.expense_date  || null,
        client_name:    input.client_name   || null,
        linked_lead_id: input.linked_lead_id || null,
        notes:          input.notes         || null,
      }).select('id, category, amount, expense_date').single();

      if (error) {
        console.error('[tool:log_expense] error:', error);
        return `Error logging expense: ${error.message}`;
      }

      const dateStr = expense.expense_date || new Date().toISOString().split('T')[0];
      console.log(`[tool:log_expense] Rs ${input.amount} — ${input.category} — ${dateStr}`);
      return `Expense logged — Rs ${formatRs(input.amount)}, ${input.category}${input.description ? `: ${input.description}` : ''}, ${dateStr}.`;
    }

        default:
      return `Unknown tool: ${name}`;
  }
}

module.exports = { runAgenticTurn, runCoupleAgenticTurn };
