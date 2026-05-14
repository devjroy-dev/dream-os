# Session 5.5 file writes

## write_couple_system_prompt.py

```python
content = r"""// coupleSystemPrompt.js — system prompt for the couple-facing agent
// Session 5.5: agent talks to couples on vendor's behalf
//
// This agent runs on couple_thread conversations.
// It is NOT the vendor agent. Different tone, different goal.
// Goal: collect event details, create/update lead, close warmly.

function buildCoupleSystemPrompt({ vendor, vendorUser }) {
  const vendorName     = vendorUser?.name || vendor?.business_name || 'this vendor';
  const vendorCategory = vendor?.category || 'creative professional';
  const vendorCity     = vendor?.city || 'India';
  const travelsText    = vendor?.open_to_travel ? 'They are open to travelling.' : `They are based in ${vendorCity}.`;

  return `You are a friendly assistant for ${vendorName}, a ${vendorCategory} based in ${vendorCity}. ${travelsText}

YOUR GOAL
Collect key details about the enquiry so ${vendorName} can follow up properly.
You need to find out: what the occasion is, when and where, and their approximate budget.
Once you have all three, close the conversation warmly and tell them ${vendorName} will be in touch.

CONVERSATION RULES
1. Warm, friendly, conversational. Not corporate. Not formal.
2. Plain text only. No bullet points, no markdown.
3. One question at a time. Never ask two things at once.
4. Maximum 2 sentences per reply.
5. Never promise specific pricing or availability — you don't know their calendar.
6. Never mention that you are an AI. You are ${vendorName}'s assistant.
7. If they ask to speak to ${vendorName} directly, say: "${vendorName} will be in touch with you soon — I just need a couple of details first."
8. ALWAYS end your turn with respond_to_couple tool. Never write the reply as plain text.

WHAT TO COLLECT
- occasion: what kind of event (wedding, birthday, corporate, etc.)
- event_date: when is it (exact date or approximate month/year)
- event_city: where is it happening
- budget: approximate budget in Rs

FLOW
First message from couple is usually the TDW code or a greeting. Respond with a warm intro and ask about their occasion.
Then collect date + city in one question if they haven't shared it.
Then ask about budget.
Once all collected, call capture_couple_lead then respond_to_couple with a warm close.

If they volunteer multiple details in one message — great, extract them all and only ask for what's missing.

TONE EXAMPLES
Good: "Hi! What's the occasion — wedding, birthday, something else?"
Good: "When is it, and where?"
Good: "And what's your approximate budget for this?"
Good: "Perfect — I've passed your details to ${vendorName}. They'll be in touch with you soon!"
Bad: "I'd be happy to assist you today!"
Bad: "Certainly! Could you please provide me with..."
Bad: "Great question!"`;
}

module.exports = { buildCoupleSystemPrompt };
"""
with open('src/agent/coupleSystemPrompt.js', 'w') as f:
    f.write(content)
print("done")
```

## write_engine.py

```python
content = r"""// engine.js — the agentic loop
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

          const notifMsg = `New enquiry from ${couplePhone}. ${summary}. Lead saved — check your leads tab.`;

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
"""
with open('src/agent/engine.js', 'w') as f:
    f.write(content)
print("done")
```

## write_index.py

```python
content = r"""// dream-os backend -- entry point
// Session 5: three-mode couple routing
// Session 5.5: couple-facing agent on Mode 1 + Mode 2

const express      = require('express');
const twilio       = require('twilio');
const ws           = require('ws');
const cookieParser = require('cookie-parser');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runAgenticTurn, runCoupleAgenticTurn } = require('./agent/engine');
const adminRouter  = require('./admin/router');

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWILIO_ACCOUNT_SID         = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN          = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER     = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550';
const TDW_WA_NUMBER              = process.env.TDW_WA_NUMBER || '14787788550';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const anthropic    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.locals.supabase = supabase;

app.use('/admin', adminRouter);

app.get('/', (req, res) => {
  res.json({ status: 'alive', service: 'dream-os', version: '0.5.5' });
});

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const fromRaw     = req.body.From || '';
    const phone       = fromRaw.replace('whatsapp:', '');
    const body        = req.body.Body || '';
    const profileName = req.body.ProfileName || null;

    console.log(`[whatsapp:in] ${phone} -> ${body}`);

    let user;
    const { data: existingUser } = await supabase
      .from('users').select('*').eq('phone', phone).maybeSingle();

    if (existingUser) {
      user = existingUser;
    } else {
      const { data: newUser, error } = await supabase
        .from('users').insert({ phone, name: profileName }).select().single();
      if (error) throw error;
      user = newUser;
    }

    const { data: vendor } = await supabase
      .from('vendors').select('*').eq('user_id', user.id).maybeSingle();

    if (!vendor) {
      // ── Couple routing — three modes ──────────────────────────────

      // MODE 1 -- Returning couple: already has a thread with a vendor
      const { data: existingThread } = await supabase
        .from('conversations')
        .select('*, vendors(*)')
        .eq('counterparty_phone', phone)
        .eq('kind', 'couple_thread')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingThread) {
        console.log(`[routing:mode1] returning couple ${phone} -> vendor ${existingThread.vendor_id}`);

        // Log inbound message
        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        });

        // Load vendor user for notification
        const { data: vendorUser } = await supabase
          .from('users').select('*').eq('id', existingThread.vendors.user_id).maybeSingle();

        // Run couple agent
        const result = await runCoupleAgenticTurn({
          vendor: existingThread.vendors,
          vendorUser,
          conversation: existingThread,
          couplePhone: phone,
          inboundMessage: body,
          supabase,
          anthropic,
        });

        // Send agent reply to couple
        const twilioMsg = await sendWhatsApp(phone, result.reply);

        // Log outbound message
        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        // Send vendor notification if lead was captured
        if (result.vendorNotification && vendorUser?.phone) {
          await sendWhatsApp(vendorUser.phone, result.vendorNotification);
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', existingThread.id);

        return res.status(200).send('<Response/>');
      }

      // MODE 2 -- TDW code: first word matches a vendor routing_handle
      const firstWord = body.trim().split(/\s+/)[0].toUpperCase();
      const handle    = firstWord.startsWith('TDW-') ? firstWord.slice(4) : firstWord;

      const { data: matchedVendor } = await supabase
        .from('vendors')
        .select('*, users(*)')
        .eq('routing_handle', handle)
        .maybeSingle();

      if (matchedVendor) {
        console.log(`[routing:mode2] TDW code ${handle} -> vendor ${matchedVendor.id}`);

        const vendorUser = matchedVendor.users;

        // Create couple thread
        const { data: coupleThread } = await supabase
          .from('conversations')
          .insert({
            vendor_id: matchedVendor.id,
            counterparty_phone: phone,
            kind: 'couple_thread',
            state: 'new',
            mode: 'auto',
          })
          .select()
          .single();

        // Log inbound message
        await supabase.from('messages').insert({
          conversation_id: coupleThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        });

        // Create initial lead (deduped on vendor_id + phone)
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('vendor_id', matchedVendor.id)
          .eq('phone', phone)
          .maybeSingle();

        if (!existingLead) {
          await supabase.from('leads').insert({
            vendor_id:   matchedVendor.id,
            phone,
            source:      'whatsapp',
            raw_message: body,
            state:       'new',
          });
        }

        // Run couple agent -- will reply to couple and collect details
        const result = await runCoupleAgenticTurn({
          vendor: matchedVendor,
          vendorUser,
          conversation: coupleThread,
          couplePhone: phone,
          inboundMessage: body,
          supabase,
          anthropic,
        });

        // Send agent reply to couple
        const twilioMsg = await sendWhatsApp(phone, result.reply);

        // Log outbound message
        await supabase.from('messages').insert({
          conversation_id: coupleThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        // Send vendor notification if lead was captured, else send basic notification
        const vendorPhone = vendorUser?.phone;
        if (vendorPhone) {
          const notif = result.vendorNotification
            || `New enquiry via your TDW link from ${phone}. I'm collecting their details now.`;
          await sendWhatsApp(vendorPhone, notif);
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', coupleThread.id);

        return res.status(200).send('<Response/>');
      }

      // MODE 3 -- Fallback
      console.log(`[routing:mode3] no match for ${phone}, body: "${body.slice(0, 40)}"`);
      await sendWhatsApp(phone,
        `Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared.`
      );
      return res.status(200).send('<Response/>');
    }

    // ── Vendor path ────────────────────────────────────────────────
    let convo;
    const { data: existingConvo } = await supabase
      .from('conversations').select('*')
      .eq('vendor_id', vendor.id).eq('kind', 'vendor_self').maybeSingle();

    if (existingConvo) {
      convo = existingConvo;
    } else {
      const { data: newConvo, error } = await supabase
        .from('conversations').insert({
          vendor_id: vendor.id,
          counterparty_user_id: user.id,
          counterparty_phone: phone,
          kind: 'vendor_self',
          state: 'new',
          mode: 'draft',
        }).select().single();
      if (error) throw error;
      convo = newConvo;
    }

    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'inbound',
      channel: 'whatsapp',
      body,
      sent_by: 'vendor',
    });

    const result = await runAgenticTurn({
      vendor,
      user,
      conversation: convo,
      inboundMessage: body,
      supabase,
      anthropic,
    });

    console.log(`[agent] reply: "${result.reply.slice(0, 80)}..."  (${result.iterations} iter, ${result.toolCalls.length} tool calls)`);

    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convo.id);

    const twilioMsg = await sendWhatsApp(phone, result.reply);

    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'outbound',
      channel: 'whatsapp',
      body: result.reply,
      sent_by: 'agent',
      twilio_sid: twilioMsg.sid,
      tool_calls: result.toolCalls,
    });

    res.status(200).send('<Response/>');
  } catch (err) {
    console.error('[webhook/whatsapp] error:', err);
    res.status(500).send('error');
  }
});

async function sendWhatsApp(toPhone, body) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const msg = await twilioClient.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to,
    body,
  });
  console.log(`[whatsapp:out] ${to} <- ${body.slice(0, 60)} (${msg.sid})`);
  return msg;
}

app.listen(PORT, () => {
  console.log(`[dream-os] listening on :${PORT}`);
});
"""
with open('src/index.js', 'w') as f:
    f.write(content)
print("done")
```

## write_roadmap.py

```python
content = """# dream-os -- Roadmap
**Last updated:** 2026-05-14
**Current version:** 0.5.5

## Vision
WhatsApp-first chief of staff for wedding vendors.
Vendor runs their business by texting a number.
Agent remembers everything, handles routine, escalates judgment calls.
Admin layer lets Dev/Swati manage the founding cohort of 50 vendors.
Marketplace (thedreamwedding.in) surfaces curated vendors to brides.

## What's shipped

| Session | What | Version |
|---|---|---|
| 1 | WhatsApp echo bot, schema (5 tables), Railway deploy, Twilio sandbox | 0.1.0 |
| 2 | Agentic loop (Claude Haiku), note_to_self, update_conversation_state, respond_to_vendor, vendor_state + notes + pending_actions | 0.2.0 |
| 3 | Admin layer, onboarding flow (Swati greeting), conversation history, system prompt tightening, invite_vendor() | 0.3.0 |
| 4 | leads table, create_lead tool, list_leads, update_lead_state, lead/referrer distinction, post-processing commentary strip, admin leads tab | 0.4.0 |
| 5 | TDW handles (migration 0005), travel preference (migration 0006), 4-step onboarding, FIRSTNAME-PHONE3 auto-handle, three-mode couple routing, admin TDW link display | 0.5.0 |
| 5.5 | Couple-facing agent, coupleSystemPrompt, runCoupleAgenticTurn, capture_couple_lead tool, vendor summary notification | 0.5.5 |

## Decisions locked
- Model: claude-haiku-4-5-20251001 (never change without founder approval)
- Phone format: always E.164 (+918757788550)
- Schema discipline: every change through numbered migration file
- Three docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md
- Currency: Rs (never Rs with symbol)
- Unknown numbers: three-mode couple routing
- Admin auth: single ADMIN_PASSWORD env var
- Monorepo: backend now, web/ and discover/ added in Sessions 9+
- Routing: one shared number + TDW codes
- TDW handle format: FIRSTNAME-PHONE3 e.g. DEV-550. Auto-assigned, no vendor input needed.
- Lead dedup in Mode 2: one lead per (vendor_id, counterparty_phone), ever
- TDW_WA_NUMBER env var: parameterised, swap when +91 arrives, no code change needed
- Couple-facing agent: Haiku, collect occasion/date/city/budget, notify vendor with summary

## Session 6 -- Morning briefing + proactive triggers
**Goal:** Vendor gets a WhatsApp briefing every morning without asking.

What ships:
- Cron job: 8am IST daily per active vendor
- Format: "Morning [Name]. X open leads, Y pending replies, Z events this week."
- Overdue nudge: "You haven't replied to Preethi's enquiry in 3 days."
- Railway cron configuration
- update_routing_handle tool: vendor can change TDW handle via WhatsApp
- Twilio template submission for outbound initiated messages

Estimated time: 90 minutes

## Session 7 -- Money tools
**Goal:** Vendor logs expenses, creates invoices, tracks payments through WhatsApp.

What ships:
- Migration: invoices table, expenses table
- New tools: create_invoice, log_expense, record_payment
- Agent answers: "Who owes me money?" "What did I spend this month?"
- Admin: Money tab on vendor detail

Estimated time: 90 minutes

## Session 8.1 -- Smart model routing (Haiku -> Sonnet)
**Goal:** Route complex tasks to Sonnet, keep simple tasks on Haiku. 80/20 split.

What ships:
- Task classifier: lightweight Haiku call determines complexity
- Router in engine.js: sets MODEL based on classifier output
- Sonnet for: complex extraction, nuanced drafting, financial reasoning
- Haiku for: simple notes, greetings, status questions
- Cost tracking on messages table
- Admin: AI cost this month on vendor detail
- Onboarding gets Haiku: category normalisation (photo -> photography), graceful handling of unexpected inputs, vendor can answer multiple questions in one message
- Couple agent routing: Sonnet for long/complex enquiries, Haiku for simple ones
- Smart router applies to both vendor agent and couple agent

Estimated time: 60-90 minutes

## Session 8 -- Admin polish + +91 number live
**Goal:** Admin production-ready for 50 founding vendors.

What ships:
- +91 number live -- update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override in admin
- Lead name-based state updates

Estimated time: 60 minutes

## Session 9 -- thedreamwedding.in Discover
**Goal:** Bride-side curated marketplace.

What ships:
- discover/ folder added to monorepo
- Next.js site on Vercel
- Vendor profile pages (public, read-only)
- Enquiry from Discover -> vendor WhatsApp thread automatically
- Reuses couple-facing agent from Session 5.5

Estimated time: 2-3 sessions

## Session 10 -- Instagram DM integration
**Goal:** Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

Estimated time: 2 sessions

## Session 11-12 -- thedreamai.in vendor dashboard
**Goal:** Web dashboard as read layer over WhatsApp-captured data.

## Open questions
1. +91 number -- applied, arriving soon
2. Founding cohort pricing -- free forever or free for X months?
3. Couple phone collection on Discover enquiry
4. thedreamwedding.in domain -- currently pointing where?
5. Swati's role in Discover editorial curation

## Deliberately out of scope
- iOS/Android native app
- Razorpay subscription billing (after 50 vendors proven)
- RLS (after bride-side public access needed)
- Multi-vertical (weddings first)
- Email/SMS fallback (WhatsApp only)
- One number per vendor (TDW code system solves routing)
"""
with open('docs/ROADMAP.md', 'w') as f:
    f.write(content)
print("done")
```
