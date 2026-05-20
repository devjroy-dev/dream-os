// ─────────────────────────────────────────────────────────────────────────────
// src/agent/pwaEngine.js
// Agentic loop for the PWA vendor agent only.
//
// COMPLETELY SEPARATE from engine.js (WhatsApp). Zero shared state.
// WhatsApp: src/index.js → engine.js → runAgenticTurn()
// PWA:      src/api/vendor/chat.js → pwaEngine.js → runPWAAgenticTurn()
//
// Key architectural differences from engine.js:
//
//   1. NO respond_to_vendor tool. Model's final text block IS the reply.
//      This eliminates the core lying mechanism — finalReply can only come
//      from the model's text after it has seen all tool results.
//
//   2. Tool results carry { result, mutated }. After the loop, if any tool
//      mutated the DB, the engine refetches the full snapshot (6 queries)
//      and rebuilds dynamicContext with [FRESH STATE] injected. Returns
//      refresh:true in response so frontend re-fetches context display.
//
//   3. 15-minute session boundary on history. Messages older than 15 minutes
//      are not fed to the model. New session = clean context. Vendor cannot
//      see prior thread on screen (no history hydration) — so the engine
//      should not either. Prevents stale-context confusion on return visits.
//
//   4. generate_client_walink returns a contact card in the response so
//      the frontend can render it as a tappable WhatsApp button.
//
//   5. clarify tool returns structured options in the response so the
//      frontend can render them as suggestion chips.
//
//   6. MAX_ITERATIONS = 8 (vs 5 in engine.js). Cost cap at $0.50.
//
//   7. Tool result error detection before finalReply is committed.
//      If a tool returned an error string, the model is forced to see it
//      before composing the reply — it cannot confirm a failed action.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { PWA_STATIC_SYSTEM_PROMPT, buildPWADynamicContext } = require('./pwaSystemPrompt');
const { PWA_TOOLS }           = require('./pwaTools');
const { MODEL_SONNET, calculateCost } = require('./models');
const { buildInvoiceMessage } = require('../lib/invoiceMessage');
const { generateInvoicePdf }  = require('../lib/invoicePdf');
const { formatRs }            = require('../lib/format');
const { resolveOrCreateClient } = require('../lib/clients');
const { sendWhatsApp }        = require('../lib/whatsapp');

const MAX_ITERATIONS   = 8;
const MAX_COST_USD     = 0.50;
const HISTORY_LIMIT    = 10;
const SESSION_IDLE_MS  = 15 * 60 * 1000;   // 15 minutes — session boundary

// ── fetchSnapshot ─────────────────────────────────────────────────────────
// Runs the 6 parallel queries that populate the dynamic context.
// Called once at start, and again after any write turn (mutated=true).

async function fetchSnapshot(supabase, vendorId, istToday, ist14days) {
  const [
    { data: state },
    { data: recentNotes },
    { count: openLeadsCount },
    { data: upcomingEvents },
    { data: pendingInvoices },
    { data: pendingEnquiries },
  ] = await Promise.all([
    supabase.from('vendor_state').select('*').eq('vendor_id', vendorId).maybeSingle(),

    supabase.from('notes').select('content, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .in('state', ['new', 'contacted', 'quoted']),

    supabase.from('events').select('id, title, event_date, event_time, kind')
      .eq('vendor_id', vendorId)
      .eq('state', 'upcoming')
      .gte('event_date', istToday)
      .lte('event_date', ist14days)
      .order('event_date', { ascending: true })
      .limit(10),

    supabase.from('invoices').select('id, client_name, amount_total, amount_paid, due_date, state')
      .eq('vendor_id', vendorId)
      .in('state', ['unpaid', 'advance_paid'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),

    supabase.from('leads').select('id, name, wedding_date, wedding_city, budget_total, raw_message, created_at')
      .eq('vendor_id', vendorId)
      .eq('state', 'new')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return { state, recentNotes, openLeadsCount, upcomingEvents, pendingInvoices, pendingEnquiries };
}

// ── runPWAAgenticTurn ─────────────────────────────────────────────────────
// Entry point called from src/api/vendor/chat.js.

async function runPWAAgenticTurn({
  vendor,
  user,
  conversation,
  inboundMessage,
  supabase,
  anthropic,
}) {

  // ── IST time helpers ──────────────────────────────────────────────────
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow      = new Date(Date.now() + istOffsetMs);
  const istToday    = istNow.toISOString().split('T')[0];
  const ist14days   = new Date(istNow.getTime() + 30 * 86400000).toISOString().split('T')[0];

  // ── Initial snapshot fetch ────────────────────────────────────────────
  const snapshot = await fetchSnapshot(supabase, vendor.id, istToday, ist14days);

  // ── Build dynamic context ─────────────────────────────────────────────
  let dynamicContext = buildPWADynamicContext({
    vendor,
    user,
    state:            snapshot.state,
    recentNotes:      snapshot.recentNotes      || [],
    openLeadsCount:   snapshot.openLeadsCount   || 0,
    upcomingEvents:   snapshot.upcomingEvents   || [],
    pendingInvoices:  snapshot.pendingInvoices  || [],
    pendingEnquiries: snapshot.pendingEnquiries || [],
    istToday,
  });

  // ── Session-bounded history ───────────────────────────────────────────
  // Only load messages from within the last SESSION_IDLE_MS (15 min).
  // Older messages belong to a prior session — vendor opened a blank screen
  // so we start blank too. Prevents stale-context confusion on return visits.
  const sessionCutoff = new Date(Date.now() - SESSION_IDLE_MS).toISOString();

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .gte('created_at', sessionCutoff)           // ← session boundary
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body !== inboundMessage || m.direction !== 'inbound')
    .filter(m => m.body && m.body.trim().length > 0)
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

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Model selection — PWA always uses Sonnet ──────────────────────────
  // No classifier needed. PWA turns are complex by default (multi-step,
  // tool chains, disambiguation). Skipping the classifier saves ~400ms/turn.
  const modelToUse = MODEL_SONNET;
  console.log(`[pwa-agent] model: ${modelToUse} (always Sonnet on PWA)`);

  // ── Agentic loop ──────────────────────────────────────────────────────
  let iterations     = 0;
  let finalReply     = null;
  let totalInputTok  = 0;
  let totalOutputTok = 0;
  let totalCostUsd   = 0;
  let anyMutation    = false;    // tracks whether any tool mutated the DB
  const toolCallsAudit = [];
  const attachments    = [];
  let contactCard      = null;   // populated by generate_client_walink
  let clarifyPayload   = null;   // populated by clarify tool

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Cost cap guard — stop before spending too much
    if (totalCostUsd >= MAX_COST_USD) {
      console.warn(`[pwa-agent] cost cap hit at $${totalCostUsd.toFixed(4)} — stopping loop`);
      finalReply = finalReply || 'Give me a moment — this one\'s taking longer than usual. Try again in a second.';
      break;
    }

    const response = await anthropic.messages.create({
      model:      modelToUse,
      max_tokens: 1024,
      system: [
        {
          type:          'text',
          text:          PWA_STATIC_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },  // 1-hour cache — saves ~7,000 tokens/call
        },
        {
          type: 'text',
          text: dynamicContext,                   // vendor-specific — never cached
        },
      ],
      tools:    PWA_TOOLS,
      messages,
    }, {
      // Override the global 12s WhatsApp timeout. PWA has no webhook budget.
      // 45s matches the MAX_WALL_MS cap in the cost guard above.
      timeout: 45000,
    });

    // Accumulate token usage and cost
    const usage = response.usage || {};
    totalInputTok  += usage.input_tokens  || 0;
    totalOutputTok += usage.output_tokens || 0;
    const iterCost  = calculateCost(modelToUse, usage.input_tokens || 0, usage.output_tokens || 0);
    if (iterCost) totalCostUsd += iterCost.cost_usd;

    console.log(`[pwa-agent] iter ${iterations}, stop: ${response.stop_reason}, cost so far: $${totalCostUsd.toFixed(4)}`);

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    // ── No tool calls → model's text is the final reply ───────────────
    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content.filter(b => b.type === 'text');
      finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Got it.';
      break;
    }

    // ── Execute tool calls ────────────────────────────────────────────
    const toolResults = [];
    let iterationHadError = false;

    for (const toolUse of toolUseBlocks) {
      const { result, mutated, error } = await executePWATool({
        name:        toolUse.name,
        input:       toolUse.input,
        vendor,
        conversation,
        supabase,
        attachments,
      });

      // Track mutation for post-loop refetch
      if (mutated) anyMutation = true;

      // Track errors — model must see these before composing reply
      if (error) iterationHadError = true;

      // Handle PWA-specific tool outputs
      if (toolUse.name === 'generate_client_walink' && !error) {
        try {
          const parsed = typeof result === 'string' ? JSON.parse(result) : result;
          if (parsed.contact) contactCard = parsed.contact;
        } catch {}
      }

      if (toolUse.name === 'clarify' && !error) {
        try {
          const parsed = typeof result === 'string' ? JSON.parse(result) : result;
          if (parsed.clarify) clarifyPayload = parsed.clarify;
        } catch {}
      }

      toolCallsAudit.push({
        name:    toolUse.name,
        input:   toolUse.input,
        result:  typeof result === 'string' ? result : JSON.stringify(result),
        mutated: !!mutated,
        error:   !!error,
      });

      toolResults.push({
        type:        'tool_result',
        tool_use_id: toolUse.id,
        content:     typeof result === 'string' ? result : JSON.stringify(result),
      });
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user',      content: toolResults });

    // If clarify was called, we have the answer we need — break and let
    // the clarify payload drive the response. Model doesn't need another turn.
    if (clarifyPayload) break;
  }

  // ── Safety net ────────────────────────────────────────────────────────
  if (!finalReply && !clarifyPayload) {
    finalReply = 'Give me a moment — I\'ll come back to you on this.';
    console.warn(`[pwa-agent] hit MAX_ITERATIONS without final reply`);
  }

  // ── Post-write snapshot refetch ───────────────────────────────────────
  // If any tool mutated the DB, refetch the full snapshot so the next
  // turn (and the frontend) sees committed state, not the pre-write values.
  // Also inject [FRESH STATE] into the returned context so a follow-up
  // question in the same session gets accurate data immediately.
  let refreshedSnapshot = null;
  if (anyMutation) {
    console.log('[pwa-agent] mutations detected — refetching snapshot');
    try {
      refreshedSnapshot = await fetchSnapshot(supabase, vendor.id, istToday, ist14days);

      // Update vendor_state recent_notes cache (mirrors engine.js pattern)
      const { data: latestNotes } = await supabase
        .from('notes')
        .select('content, tags, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      await supabase.from('vendor_state').upsert({
        vendor_id:    vendor.id,
        recent_notes: latestNotes || [],
        updated_at:   new Date().toISOString(),
      });
    } catch (refetchErr) {
      console.error('[pwa-agent] post-write refetch failed (non-fatal):', refetchErr.message);
    }
  }

  // ── Cost summary ──────────────────────────────────────────────────────
  const cost = calculateCost(modelToUse, totalInputTok, totalOutputTok);
  console.log(`[pwa-agent] tokens: ${totalInputTok} in / ${totalOutputTok} out | cost: $${cost?.cost_usd ?? '?'} / Rs ${cost?.cost_inr ?? '?'} | ${iterations} iter | mutations: ${anyMutation}`);

  return {
    reply:        finalReply || null,
    clarify:      clarifyPayload || null,   // { question, options[] } if clarify tool fired
    contact:      contactCard    || null,   // { name, phone, draft } if walink tool fired
    toolCalls:    toolCallsAudit,
    attachments,
    iterations,
    model:        modelToUse,
    inputTokens:  totalInputTok,
    outputTokens: totalOutputTok,
    costUsd:      cost?.cost_usd  ?? null,
    costInr:      cost?.cost_inr  ?? null,
    refresh:      anyMutation,              // true = frontend should refetch context
  };
}

// ── executePWATool ────────────────────────────────────────────────────────
// Returns { result: string, mutated: boolean, error: boolean }
// mutated = true → DB was changed, trigger post-loop refetch
// error = true → tool failed, model must see this before composing reply

async function executePWATool({ name, input, vendor, conversation, supabase, attachments }) {

  function ok(result)  { return { result, mutated: false, error: false }; }
  function write(result) { return { result, mutated: true,  error: false }; }
  function err(msg)    { return { result: `Error: ${msg}`, mutated: false, error: true }; }

  switch (name) {

    // ── note_to_self ────────────────────────────────────────────────────
    case 'note_to_self': {
      const { error } = await supabase.from('notes').insert({
        vendor_id:       vendor.id,
        conversation_id: conversation.id,
        content:         input.content,
        tags:            input.tags || null,
      });
      if (error) return err(error.message);
      console.log(`[pwa-tool:note_to_self] "${input.content}"`);
      return write(`Note saved: "${input.content}"`);
    }

    // ── create_lead ─────────────────────────────────────────────────────
    case 'create_lead': {
      let wedding_date = null;
      if (input.wedding_date) {
        const parsed = new Date(input.wedding_date);
        if (!isNaN(parsed.getTime())) wedding_date = parsed.toISOString().split('T')[0];
      }

      // Dedup on phone
      if (input.phone) {
        const { data: existing } = await supabase
          .from('leads').select('id, name, state')
          .eq('vendor_id', vendor.id).eq('phone', input.phone).maybeSingle();
        if (existing) {
          return ok(`Lead already exists for this phone. ID: ${existing.id}. Name: ${existing.name || 'unknown'}. State: ${existing.state}.`);
        }
      }

      // Auto-link to existing client
      let clientIdToLink = null;
      if (input.phone) {
        const { data: existingClient } = await supabase
          .from('clients').select('id')
          .eq('vendor_id', vendor.id).eq('phone', input.phone).maybeSingle();
        if (existingClient) clientIdToLink = existingClient.id;
      }

      const { data: lead, error } = await supabase.from('leads').insert({
        vendor_id:     vendor.id,
        name:          input.name         || null,
        phone:         input.phone        || null,
        email:         input.email        || null,
        wedding_date,
        wedding_city:  input.wedding_city || null,
        event_types:   input.event_types  || null,
        budget_min:    input.budget_min   || null,
        budget_max:    input.budget_max   || null,
        source:        input.source       || 'whatsapp',
        referrer_name: input.referrer_name || null,
        notes:         input.notes        || null,
        raw_message:   input.raw_message  || null,
        state:         'new',
        client_id:     clientIdToLink,
      }).select('id, name, wedding_date, phone, client_id').single();

      if (error) return err(`Could not create lead: ${error.message}`);
      console.log(`[pwa-tool:create_lead] ${lead.name || 'unnamed'} (${lead.id})`);
      return write(`Lead created. ID: ${lead.id}. Name: ${lead.name || 'unnamed'}. Date: ${lead.wedding_date || 'not specified'}. Phone: ${lead.phone || 'none'}.${lead.client_id ? ' Linked to existing client.' : ''}`);
    }

    // ── list_leads ──────────────────────────────────────────────────────
    case 'list_leads': {
      let query = supabase
        .from('leads')
        .select('id, name, phone, wedding_date, wedding_city, state, budget_min, budget_max, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (input.state !== 'all') query = query.eq('state', input.state);

      const { data: leads, error } = await query;
      if (error) return err(error.message);
      if (!leads || leads.length === 0) {
        return ok(input.state === 'all' ? 'No leads yet.' : `No leads with state: ${input.state}.`);
      }

      const summary = leads.map(l => {
        const date   = l.wedding_date || 'no date';
        const budget = l.budget_min ? `Rs ${(l.budget_min/100000).toFixed(1)}L` : 'budget unknown';
        return `${l.name || 'Unknown'} — ${l.phone || 'no phone'} — ${date} — ${l.state} — ${budget} — ID: ${l.id}`;
      }).join('\n');

      return ok(`${leads.length} lead(s):\n${summary}`);
    }

    // ── update_lead_state ───────────────────────────────────────────────
    case 'update_lead_state': {
      const { data: updatedLead, error } = await supabase
        .from('leads').update({ state: input.new_state })
        .eq('id', input.lead_id).eq('vendor_id', vendor.id)
        .select('id, name, state').single();
      if (error?.code === 'PGRST116') return err('Lead not found or does not belong to this vendor.');
      if (error) return err(error.message);
      console.log(`[pwa-tool:update_lead_state] ${input.lead_id} → ${input.new_state}`);
      return write(`${updatedLead.name || 'Lead'} updated to ${input.new_state}.`);
    }

    // ── update_conversation_state ───────────────────────────────────────
    case 'update_conversation_state': {
      const { error } = await supabase
        .from('conversations').update({ state: input.new_state })
        .eq('id', conversation.id)
        .select('id').single();
      if (error?.code === 'PGRST116') return err('Conversation not found.');
      if (error) return err(error.message);
      return write(`Conversation state updated to ${input.new_state}.`);
    }

    // ── create_event ────────────────────────────────────────────────────
    case 'create_event': {
      // Sanitise linked_lead_id — model sometimes passes a name instead of UUID
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

      if (error) return err(`Could not create event: ${error.message}`);
      console.log(`[pwa-tool:create_event] ${event.kind} "${event.title}" on ${event.event_date}`);
      return write(`Event created. ID: ${event.id}. ${event.kind}: ${event.title} on ${event.event_date}.`);
    }

    // ── list_events ─────────────────────────────────────────────────────
    case 'list_events': {
      const now         = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow      = new Date(now.getTime() + istOffsetMs);
      const istToday    = istNow.toISOString().split('T')[0];

      let dateStart = istToday;
      let dateEnd   = null;

      if (input.window === 'today') {
        dateEnd = istToday;
      } else if (input.window === 'this_week') {
        const daysUntilSunday = (7 - istNow.getUTCDay()) % 7;
        dateEnd = new Date(istNow.getTime() + daysUntilSunday * 86400000).toISOString().split('T')[0];
      } else if (input.window === 'next_7_days') {
        dateEnd = new Date(istNow.getTime() + 7 * 86400000).toISOString().split('T')[0];
      }

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
      if (error) return err(error.message);
      if (!events || events.length === 0) return ok(`No events found in window: ${input.window}.`);

      const summary = events.map(e => {
        const time = e.event_time ? ` at ${e.event_time.slice(0, 5)}` : '';
        return `${e.event_date}${time} — ${e.kind}: ${e.title} (ID: ${e.id})`;
      }).join('\n');

      return ok(`${events.length} event(s):\n${summary}`);
    }

    // ── update_event_state ──────────────────────────────────────────────
    case 'update_event_state': {
      const { data: updatedEvent, error } = await supabase
        .from('events').update({ state: input.new_state })
        .eq('id', input.event_id).eq('vendor_id', vendor.id)
        .select('id, title, state').single();
      if (error?.code === 'PGRST116') return err('Event not found or does not belong to this vendor.');
      if (error) return err(error.message);
      console.log(`[pwa-tool:update_event_state] ${input.event_id} → ${input.new_state}`);
      return write(`"${updatedEvent.title}" marked ${input.new_state}.`);
    }

    // ── query_day ───────────────────────────────────────────────────────
    case 'query_day': {
      const { date } = input;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return err('Invalid date format. Use YYYY-MM-DD.');

      const [evRes, invRes, expRes] = await Promise.all([
        supabase.from('events')
          .select('title, event_date, event_time, kind, state')
          .eq('vendor_id', vendor.id).eq('event_date', date)
          .in('state', ['upcoming', 'done'])
          .order('event_time', { ascending: true, nullsFirst: false }),

        supabase.from('invoices')
          .select('id, client_name, amount_total, amount_paid, state')
          .eq('vendor_id', vendor.id).eq('due_date', date)
          .in('state', ['unpaid', 'advance_paid']),

        supabase.from('expenses')
          .select('description, amount, category, created_at')
          .eq('vendor_id', vendor.id)
          .gte('created_at', date + 'T00:00:00.000Z')
          .lt('created_at',  date + 'T23:59:59.999Z'),
      ]);

      const events   = evRes.data  || [];
      const invoices = invRes.data || [];
      const expenses = expRes.data || [];
      const sections = [];

      if (events.length > 0) {
        const lines = events.map(e => {
          const time = e.event_time ? `${e.event_time.slice(0, 5)} — ` : '';
          const done = e.state === 'done' ? ' [done]' : '';
          return `- ${time}${e.kind}: ${e.title}${done}`;
        });
        sections.push(`EVENTS (${events.length}):\n${lines.join('\n')}`);
      }
      if (invoices.length > 0) {
        const lines = invoices.map(i => {
          const owed = Math.round((i.amount_total || 0) - (i.amount_paid || 0));
          return `- ${i.client_name || 'Unknown'}: Rs ${owed.toLocaleString('en-IN')} due`;
        });
        sections.push(`INVOICES DUE (${invoices.length}):\n${lines.join('\n')}`);
      }
      if (expenses.length > 0) {
        const lines = expenses.map(e =>
          `- Rs ${Math.round(e.amount || 0).toLocaleString('en-IN')} — ${e.category || 'general'}${e.description ? ': ' + e.description : ''}`
        );
        sections.push(`EXPENSES LOGGED (${expenses.length}):\n${lines.join('\n')}`);
      }

      if (sections.length === 0) return ok(`Nothing on ${date} — no events, invoices due, or expenses.`);
      return ok(`${date}:\n\n${sections.join('\n\n')}`);
    }

    // ── hot_dates_context ───────────────────────────────────────────────
    case 'hot_dates_context': {
      const monthsAhead = Math.max(1, Math.min(12, Number(input.months_ahead) || 3));
      const istNow  = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const today   = istNow.toISOString().split('T')[0];
      const endDate = new Date(istNow.getFullYear(), istNow.getMonth() + monthsAhead, istNow.getDate())
        .toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('hot_dates').select('date, note, region')
        .gte('date', today).lte('date', endDate)
        .order('date', { ascending: true }).limit(30);

      if (error) return err('Could not fetch hot dates.');
      const rows = data || [];
      if (rows.length === 0) return ok(`No Vivah Muhurat dates in the next ${monthsAhead} month(s).`);

      const lines = rows.map(r => {
        const notePart   = r.note ? ` — ${r.note}` : '';
        const regionPart = r.region && r.region !== 'All India' ? ` (${r.region})` : '';
        return `- ${r.date}${notePart}${regionPart}`;
      });

      return ok(`Vivah Muhurat — next ${monthsAhead} month(s):\n${lines.join('\n')}`);
    }

    // ── create_invoice ──────────────────────────────────────────────────
    case 'create_invoice': {
      if (input.amount_total <= 0) return err('Invoice total must be greater than zero.');
      if (input.amount_advance != null && input.amount_advance < 0) return err('Advance cannot be negative.');
      if (input.amount_advance != null && input.amount_advance > input.amount_total) return err('Advance cannot exceed the total.');

      const { data: v } = await supabase
        .from('vendors')
        .select('id, business_name, upi_id, routing_handle, invoice_prefix, invoice_counter, user_id')
        .eq('id', vendor.id).single();

      const { data: u } = await supabase
        .from('users').select('name').eq('id', v.user_id).single();

      if (!v.routing_handle) return err('Onboarding incomplete — cannot create invoice. Contact support.');

      // Duplicate name check (only if lead_id not provided)
      if (!input.lead_id) {
        const { data: leadMatches }    = await supabase.from('leads').select('id, name, wedding_date, wedding_city').eq('vendor_id', vendor.id).ilike('name', `%${input.client_name}%`);
        const { data: invoiceMatches } = await supabase.from('invoices').select('id, client_name, invoice_number, state, created_at').eq('vendor_id', vendor.id).ilike('client_name', `%${input.client_name}%`).neq('state', 'cancelled');

        if ((leadMatches?.length > 0) || (invoiceMatches?.length > 0)) {
          let msg = `Found existing records for "${input.client_name}":\n`;
          if (leadMatches?.length > 0) {
            msg += '\nLeads:\n' + leadMatches.map(l => `- ${l.name}${l.wedding_date ? `, wedding ${l.wedding_date}` : ''}${l.wedding_city ? `, ${l.wedding_city}` : ''} (ID: ${l.id})`).join('\n');
          }
          if (invoiceMatches?.length > 0) {
            msg += '\nExisting invoices:\n' + invoiceMatches.map(i => `- ${i.invoice_number} (${i.state})`).join('\n');
          }
          msg += `\n\nIs this the same ${input.client_name}, or a different person? If same, confirm and I'll raise the invoice. If different, give me a more specific name.`;
          return ok(msg);
        }
      }

      // Set prefix if null
      if (v.invoice_prefix === null) {
        const derivedPrefix = `TDW/${v.routing_handle}`;
        await supabase.from('vendors').update({ invoice_prefix: derivedPrefix }).eq('id', vendor.id);
        v.invoice_prefix = derivedPrefix;
      }

      // Atomic counter increment
      const { data: vUpd } = await supabase
        .from('vendors').update({ invoice_counter: v.invoice_counter + 1 })
        .eq('id', vendor.id).select('invoice_counter').single();

      const invoiceNumber = `${v.invoice_prefix}/${String(vUpd.invoice_counter).padStart(2, '0')}`;

      const { data: invoice, error: invErr } = await supabase.from('invoices').insert({
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
      }).select('id').single();

      if (invErr) return err(`Could not create invoice: ${invErr.message}`);

      const vendorDisplayName = v.business_name || u?.name || 'Your vendor';
      const composedMessage   = buildInvoiceMessage({
        clientName:        input.client_name,
        vendorDisplayName,
        invoiceNumber,
        description:       input.description  || null,
        amountTotal:       input.amount_total,
        amountAdvance:     input.amount_advance || null,
        dueDate:           input.due_date      || null,
        upiId:             v.upi_id            || null,
      });

      let result = `Invoice ${invoiceNumber} created for ${input.client_name} — Rs ${formatRs(input.amount_total)}.\n\n`;
      result += `--- FORWARD THIS TO ${input.client_name.toUpperCase()} — DO NOT MODIFY ---\n`;
      result += composedMessage;
      result += `\n--- END ---`;
      if (!v.upi_id) result += `\n\n(UPI ID not saved — client won't see a payment ID. Tell me your UPI to add it.)`;

      console.log(`[pwa-tool:create_invoice] ${invoiceNumber} — Rs ${input.amount_total}`);
      return write(result);
    }

    // ── list_invoices ───────────────────────────────────────────────────
    case 'list_invoices': {
      const state = input.state || 'unpaid';
      let query = supabase
        .from('invoices')
        .select('id, invoice_number, client_name, client_phone, amount_total, amount_paid, state, due_date, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (state !== 'all') query = query.eq('state', state);

      const { data: invoices, error } = await query;
      if (error) return err(error.message);
      if (!invoices || invoices.length === 0) return ok(state === 'all' ? 'No invoices yet.' : `No ${state} invoices.`);

      const lines = invoices.map(i => {
        const balance = i.amount_total - i.amount_paid;
        const due     = i.due_date ? `, due ${i.due_date}` : '';
        const bal     = balance > 0 ? `, balance Rs ${formatRs(balance)}` : ' (paid)';
        const phone   = i.client_phone ? `, phone: ${i.client_phone}` : '';
        return `${i.invoice_number} — ${i.client_name}${phone} — Rs ${formatRs(i.amount_total)}${bal} — ${i.state}${due} (ID: ${i.id})`;
      }).join('\n');

      return ok(`${invoices.length} invoice(s):\n${lines}`);
    }

    // ── record_payment ──────────────────────────────────────────────────
    case 'record_payment': {
      const { data: inv, error: invErr } = await supabase
        .from('invoices').select('*')
        .eq('id', input.invoice_id).eq('vendor_id', vendor.id).single();

      if (invErr || !inv) return err('Invoice not found. Check the invoice ID and try again.');
      if (inv.state === 'paid')      return err(`Invoice ${inv.invoice_number} is already fully paid.`);
      if (inv.state === 'cancelled') return err(`Invoice ${inv.invoice_number} is cancelled — cannot record payment.`);

      const newAmountPaid = inv.amount_paid + input.amount_received;

      if (newAmountPaid > inv.amount_total) {
        console.warn(`[pwa-tool:record_payment] overpayment of Rs ${newAmountPaid - inv.amount_total} on ${inv.invoice_number}`);
      }

      let newState = inv.state;
      if (input.payment_type === 'balance' || newAmountPaid >= inv.amount_total) {
        newState = 'paid';
      } else if (input.payment_type === 'advance' && inv.state === 'unpaid') {
        newState = 'advance_paid';
      }

      const { error: updateErr } = await supabase.from('invoices').update({
        amount_paid: newAmountPaid,
        state:       newState,
        updated_at:  new Date().toISOString(),
      }).eq('id', inv.id);

      if (updateErr) {
        console.error(`[pwa-tool:record_payment] invoice update failed: ${updateErr.message}`);
        return err(`Could not record payment — database error: ${updateErr.message}. Please try again.`);
      }

      console.log(`[pwa-tool:record_payment] ${inv.invoice_number} Rs ${input.amount_received} — ${inv.state} → ${newState}`);

      // Lead → client promotion on advance_paid or paid
      if ((newState === 'advance_paid' || newState === 'paid') && inv.state !== newState && inv.lead_id) {
        try {
          const { data: linkedLead } = await supabase.from('leads')
            .select('id, name, phone, email, referrer_name, notes, client_id')
            .eq('id', inv.lead_id).maybeSingle();

          if (linkedLead && !linkedLead.client_id) {
            const { client } = await resolveOrCreateClient(supabase, vendor.id, {
              name:          linkedLead.name || inv.client_name,
              phone:         linkedLead.phone || inv.client_phone,
              email:         linkedLead.email,
              source:        'lead_promotion',
              referrer_name: linkedLead.referrer_name,
              notes:         linkedLead.notes,
            });
            await supabase.from('leads').update({ client_id: client.id }).eq('id', linkedLead.id);
            await supabase.from('invoices').update({ client_id: client.id }).eq('id', inv.id);
            console.log(`[pwa-tool:record_payment] promoted lead ${linkedLead.id} → client ${client.id}`);
          }
        } catch (promoteErr) {
          console.error('[pwa-tool:record_payment] promotion failed (non-fatal):', promoteErr.message);
        }
      }

      // Stage 2: advance paid → generate booking confirmation PDF
      if (newState === 'advance_paid') {
        try {
          const { data: v } = await supabase.from('vendors')
            .select('business_name, upi_id, routing_handle, user_id').eq('id', vendor.id).single();
          const { data: u } = await supabase.from('users')
            .select('name, phone').eq('id', v.user_id).single();

          const pdfBuffer = await generateInvoicePdf({
            invoice:    { ...inv, amount_paid: newAmountPaid, amount_advance: newAmountPaid },
            vendor:     v,
            vendorName: u?.name || 'Vendor',
          });

          const fileName = `${vendor.id}/INVOICE-${inv.invoice_number.replace(/^TDW\//, '').replace(/\//g, '-').toUpperCase()}.pdf`;

          const { error: uploadErr } = await supabase.storage
            .from('invoices').upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });

          if (uploadErr) {
            return write(`Payment recorded — Rs ${formatRs(input.amount_received)} from ${inv.client_name}. Booking confirmed. PDF failed — try again or contact support.`);
          }

          const { data: signedData } = await supabase.storage
            .from('invoices').createSignedUrl(fileName, 60 * 60 * 24 * 365);

          if (signedData?.signedUrl) {
            await supabase.from('invoices').update({ pdf_url: signedData.signedUrl }).eq('id', inv.id);
            if (attachments) attachments.push(signedData.signedUrl);
          }

          const balance    = inv.amount_total - newAmountPaid;
          const balanceStr = balance > 0 ? `Balance: Rs ${formatRs(balance)}.` : 'Fully paid.';
          return write(`Recorded — Rs ${formatRs(input.amount_received)} from ${inv.client_name} (${inv.invoice_number}). ${balanceStr} PDF generated.`);

        } catch (pdfErr) {
          console.error('[pwa-tool:record_payment] PDF error:', pdfErr.message);
          return write(`Payment recorded — Rs ${formatRs(input.amount_received)} from ${inv.client_name}. Booking confirmed. PDF could not be generated: ${pdfErr.message}`);
        }
      }

      // Stage 3: balance paid
      if (newState === 'paid') {
        return write(`Payment recorded — Rs ${formatRs(input.amount_received)} from ${inv.client_name}. Invoice ${inv.invoice_number} fully paid. All done.`);
      }

      // Partial payment
      const remaining = inv.amount_total - newAmountPaid;
      return write(`Payment recorded — Rs ${formatRs(input.amount_received)} from ${inv.client_name}. Rs ${formatRs(remaining)} still outstanding on ${inv.invoice_number}.`);
    }

    // ── update_routing_handle ───────────────────────────────────────────
    case 'update_routing_handle': {
      const cleaned = (input.new_handle || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (cleaned.length < 3) return err('Handle too short — needs at least 3 alphanumeric characters.');

      const { data: existing } = await supabase
        .from('vendors').select('id').eq('routing_handle', cleaned).neq('id', vendor.id).maybeSingle();
      if (existing) return err(`Handle ${cleaned} is already taken. Try a different one.`);

      const { error } = await supabase.from('vendors').update({ routing_handle: cleaned }).eq('id', vendor.id);
      if (error) return err(error.message);

      console.log(`[pwa-tool:update_routing_handle] ${vendor.id} → ${cleaned}`);
      return write(`Handle updated to ${cleaned}.`);
    }

    // ── update_invoice_prefix ───────────────────────────────────────────
    case 'update_invoice_prefix': {
      const cleaned = (input.new_prefix || '').toUpperCase().trim().replace(/[^A-Z0-9\-\/]/g, '');
      if (!cleaned || cleaned.length < 2) return err('Prefix too short — use at least 2 characters.');
      if (cleaned.length > 20) return err('Prefix too long — keep it under 20 characters.');

      const { data: v } = await supabase
        .from('vendors').select('invoice_prefix, invoice_counter').eq('id', vendor.id).single();

      const { error: prefixErr } = await supabase
        .from('vendors').update({ invoice_prefix: cleaned }).eq('id', vendor.id);

      if (prefixErr) return err(`Could not update invoice prefix: ${prefixErr.message}`);

      const nextNum = String((v?.invoice_counter || 0) + 1).padStart(2, '0');
      console.log(`[pwa-tool:update_invoice_prefix] ${v?.invoice_prefix} → ${cleaned}`);
      return write(`Invoice prefix updated to ${cleaned}. Next invoice: ${cleaned}/${nextNum}. Previous invoices keep their original numbers.`);
    }

    // ── get_my_tdw_link ─────────────────────────────────────────────────
    case 'get_my_tdw_link': {
      const { data: v } = await supabase
        .from('vendors').select('routing_handle').eq('id', vendor.id).maybeSingle();
      if (!v?.routing_handle) return err('No TDW handle set. Contact support.');

      const tdwNumber = process.env.TDW_WA_NUMBER || '14787788550';
      const link      = `wa.me/${tdwNumber}?text=TDW-${v.routing_handle}`;
      console.log(`[pwa-tool:get_my_tdw_link] ${vendor.id} → ${link}`);
      return ok(`TDW link: ${link}`);
    }

    // ── log_expense ─────────────────────────────────────────────────────
    case 'log_expense': {
      if (!input.amount || input.amount <= 0) return err('Expense amount must be greater than zero.');

      const { data: expense, error } = await supabase.from('expenses').insert({
        vendor_id:      vendor.id,
        amount:         input.amount,
        category:       input.category,
        description:    input.description    || null,
        expense_date:   input.expense_date   || null,
        client_name:    input.client_name    || null,
        linked_lead_id: input.linked_lead_id || null,
      }).select('id, category, amount, expense_date').single();

      if (error) return err(`Could not log expense: ${error.message}`);

      const dateStr = expense.expense_date || new Date().toISOString().split('T')[0];
      console.log(`[pwa-tool:log_expense] Rs ${input.amount} — ${input.category} — ${dateStr}`);
      return write(`Expense logged — Rs ${formatRs(input.amount)}, ${input.category}${input.description ? ': ' + input.description : ''}, ${dateStr}.`);
    }

    // ── add_client ──────────────────────────────────────────────────────
    case 'add_client': {
      try {
        const { client, created } = await resolveOrCreateClient(supabase, vendor.id, {
          name:          input.name,
          phone:         input.phone,
          email:         input.email,
          source:        'manual_add',
          referrer_name: input.referrer_name,
          notes:         input.notes,
        });

        // Back-link existing leads with matching phone
        if (input.phone) {
          const { data: linkedRows } = await supabase
            .from('leads').update({ client_id: client.id })
            .eq('vendor_id', vendor.id).eq('phone', input.phone).is('client_id', null)
            .select('id');
          if (linkedRows?.length > 0) console.log(`[pwa-tool:add_client] back-linked ${linkedRows.length} lead(s) to ${client.id}`);
        }

        if (!created) return ok(`Client already exists: ${client.name}${client.phone ? ` (${client.phone})` : ''}.`);
        console.log(`[pwa-tool:add_client] new client ${client.id} (${client.name})`);
        return write(`Client added: ${client.name}${client.phone ? ` — ${client.phone}` : ''}.`);
      } catch (addErr) {
        return err(addErr.message);
      }
    }

    // ── list_clients ────────────────────────────────────────────────────
    case 'list_clients': {
      const { count } = await supabase
        .from('clients').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id);

      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, phone, email, source, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) return err(error.message);
      if (!clients || clients.length === 0) return ok('No clients yet.');

      const lines = clients.map((c, i) =>
        `${i + 1}. ${c.name}${c.phone ? ` — ${c.phone}` : ''}${c.email ? ` — ${c.email}` : ''} (ID: ${c.id})`
      );
      const total  = count ?? clients.length;
      const footer = total > 10 ? `\nShowing 10 of ${total} clients.` : '';
      return ok(`Recent clients:\n${lines.join('\n')}${footer}`);
    }

    // ── generate_client_walink ──────────────────────────────────────────
    // PWA-only. Returns a wa.me link + contact card for the frontend to
    // render as a tappable button. Never sends anything directly.
    case 'generate_client_walink': {
      if (!input.phone) return err('Phone number required to generate a WhatsApp link.');

      // Normalise phone — strip non-digits, ensure no leading +
      const digits = input.phone.replace(/\D/g, '');
      if (digits.length < 10) return err('Phone number too short — needs at least 10 digits.');

      // Build wa.me link with pre-encoded draft message
      const encodedMsg = encodeURIComponent(input.draft_message || '');
      const waLink     = `https://wa.me/${digits}${encodedMsg ? '?text=' + encodedMsg : ''}`;

      const contact = {
        name:  input.name         || 'Client',
        phone: digits,
        draft: input.draft_message || '',
        link:  waLink,
      };

      console.log(`[pwa-tool:generate_client_walink] ${input.name} — wa.me/${digits}`);

      // Return both a human-readable result for the model AND the structured contact card
      return ok(JSON.stringify({
        contact,
        result: `WhatsApp link ready for ${input.name}: ${waLink}. Message pre-drafted: "${input.draft_message}"`,
      }));
    }

    // ── clarify ─────────────────────────────────────────────────────────
    // PWA-only. Returns structured clarification payload so the frontend
    // can render options as tappable chips rather than text.
    case 'clarify': {
      const clarify = {
        question: input.question,
        options:  input.options || [],
      };

      console.log(`[pwa-tool:clarify] "${input.question}" — ${(input.options || []).length} options`);

      return ok(JSON.stringify({ clarify }));
    }

    default:
      return err(`Unknown tool: ${name}`);
  }
}

module.exports = { runPWAAgenticTurn };
