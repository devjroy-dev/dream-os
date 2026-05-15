// brideEngine.js — bride agentic loop
//
// Mirrors src/agent/engine.js (vendor side) with three locked differences:
//   1. No terminal reply tool. Model's final text message IS the reply.
//   2. No first-question post-processing strip. Bride keeps full text.
//   3. Phone-as-gate routing (no TDW codes, no disambiguation).
//
// Execution flow:
//   1. Phone lookup → users + couples row.
//   2. If no couples row → caller handles dead-end. This engine is only
//      invoked when the phone is already gated through.
//   3. If onboarding_state !== 'complete' → route to brideOnboarding.
//   4. Otherwise → run the agentic loop with classifier-picked model.
//
// Tool executors live as switch-case branches inside this file (mirroring
// the vendor engine.js pattern where executors live alongside the loop).

const { STATIC_SYSTEM_PROMPT, buildDynamicContext } = require('./brideSystemPrompt');
const { nextBrideOnboardingMessage } = require('./brideOnboarding');
const { BRIDE_TOOLS } = require('./brideTools');
const { classifyMessage } = require('./classifier');
const { MODEL_HAIKU, MODEL_SONNET, calculateCost, COMPLEXITY } = require('./models');

const MAX_ITERATIONS = 5;
const HISTORY_LIMIT  = 10;

// ── Bride agentic turn ───────────────────────────────────────────────
// Entry point called from brideIndex.js webhook handler.
async function runBrideAgenticTurn({ couple, user, conversation, inboundMessage, supabase, anthropic }) {

  // ── Onboarding routing ────────────────────────────────────────────
  // If onboarding is not complete, hand off to the state machine.
  // The state machine returns its own reply — no agent loop runs.
  if (couple.onboarding_state && couple.onboarding_state !== 'complete') {
    const result = await nextBrideOnboardingMessage({
      couple, user, inboundMessage, supabase, anthropic
    });
    return {
      reply:        result.reply,
      toolCalls:    [],
      iterations:   0,
      model:        'system',     // onboarding state machine, not an LLM-driven reply
      inputTokens:  null,
      outputTokens: null,
      costUsd:      null,
      costInr:      null,
    };
  }

  // ── Onboarding complete: run the agent loop ──────────────────────

  // Build dynamic context (couple info, notes, events). Self-querying.
  const dynamicContext = await buildDynamicContext(couple.id);

  // Load conversation history
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  // Reverse to chronological, filter empties, drop the inbound we're about
  // to add (last one is usually the inbound that just landed and was logged).
  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body && m.body.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.body,
    }))
    // Drop the inbound message if it's already the last history item;
    // we add it explicitly below.
    .filter((m, i, arr) => !(i === arr.length - 1 && m.role === 'user' && m.content === inboundMessage));

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Classify complexity → pick model ─────────────────────────────
  const classifierHistory = history.slice(-2);
  const complexity = await classifyMessage(inboundMessage, classifierHistory, anthropic);
  const modelToUse = complexity === COMPLEXITY.COMPLEX ? MODEL_SONNET : MODEL_HAIKU;
  console.log(`[bride-agent] model selected: ${modelToUse} (${complexity})`);

  // ── Agentic loop ──────────────────────────────────────────────────
  let iterations     = 0;
  let finalReply     = null;
  let totalInputTok  = 0;
  let totalOutputTok = 0;
  const toolCallsAudit = [];

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model:      modelToUse,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: STATIC_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },  // 1-hour cache — same as vendor
        },
        {
          type: 'text',
          text: dynamicContext,                   // bride-specific — never cached
        },
      ],
      tools: BRIDE_TOOLS,
      messages,
    });

    totalInputTok  += response.usage?.input_tokens  || 0;
    totalOutputTok += response.usage?.output_tokens || 0;

    console.log(`[bride-agent] iteration ${iterations}, stop_reason: ${response.stop_reason}`);

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No tool calls → model's text is the reply. Final.
      const textBlocks = response.content.filter(b => b.type === 'text');
      finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Got it.';
      break;
    }

    // Execute each tool call, gather results
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeBrideTool({
        name:  toolUse.name,
        input: toolUse.input,
        couple,
        conversation,
        supabase,
      });

      toolCallsAudit.push({ name: toolUse.name, input: toolUse.input, result });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      });
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });
  }

  // Safety net: if loop exits without a reply (shouldn't happen — but if model
  // keeps calling tools past MAX_ITERATIONS, we send a soft fallback).
  if (!finalReply) {
    finalReply = "Give me a moment — I'll come back to you on this.";
    console.warn(`[bride-agent] hit MAX_ITERATIONS without final reply`);
  }

  // ── No first-question strip — bride keeps full text ─────────────
  // (Vendor engine strips after first '?'. Bride agent allows multi-sentence replies.)

  // ── Calculate cost ───────────────────────────────────────────────
  const cost = calculateCost(modelToUse, totalInputTok, totalOutputTok);
  console.log(`[bride-agent] tokens: ${totalInputTok} in / ${totalOutputTok} out | cost: $${cost?.cost_usd ?? '?'} / Rs ${cost?.cost_inr ?? '?'}`);

  return {
    reply:        finalReply,
    toolCalls:    toolCallsAudit,
    iterations,
    model:        modelToUse,
    inputTokens:  totalInputTok,
    outputTokens: totalOutputTok,
    costUsd:      cost?.cost_usd ?? null,
    costInr:      cost?.cost_inr ?? null,
  };
}


// ── Tool executors ───────────────────────────────────────────────────
// Switch-case dispatcher (mirrors vendor engine.js pattern).

async function executeBrideTool({ name, input, couple, conversation, supabase }) {
  switch (name) {

    case 'note_to_self': {
      return await execNoteToSelf({ input, couple, conversation, supabase });
    }

    case 'save_wedding_detail': {
      return await execSaveWeddingDetail({ input, couple, supabase });
    }

    case 'add_event': {
      return await execAddEvent({ input, couple, supabase });
    }

    default: {
      return { ok: false, error: `Unknown tool: ${name}` };
    }
  }
}

// ── note_to_self executor ────────────────────────────────────────────
async function execNoteToSelf({ input, couple, conversation, supabase }) {
  const { content, tags = [] } = input;

  if (!content || typeof content !== 'string' || !content.trim()) {
    return { ok: false, error: 'content required' };
  }

  const { error } = await supabase.from('notes').insert({
    couple_id:       couple.id,
    conversation_id: conversation?.id ?? null,
    content:         content.trim(),
    tags:            Array.isArray(tags) ? tags : [],
  });

  if (error) {
    console.error('[bride-tool:note_to_self] insert error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, saved: true, content: content.trim() };
}

// ── save_wedding_detail executor ─────────────────────────────────────
const ALLOWED_FIELDS = new Set([
  'partner_name', 'wedding_date', 'wedding_city', 'budget_total', 'events_planned'
]);

async function execSaveWeddingDetail({ input, couple, supabase }) {
  const { field, value } = input;

  if (!ALLOWED_FIELDS.has(field)) {
    return { ok: false, error: `field "${field}" not allowed` };
  }

  let coerced = value;

  // Field-specific coercion
  if (field === 'wedding_date') {
    coerced = coerceDate(value);
    if (coerced === undefined) {
      return { ok: false, error: 'wedding_date could not be parsed' };
    }
  }

  if (field === 'budget_total') {
    coerced = Number.isInteger(value) ? value : parseInt(value, 10);
    if (!Number.isInteger(coerced) || coerced <= 0) {
      return { ok: false, error: 'budget_total must be a positive integer (rupees)' };
    }
  }

  if (field === 'events_planned') {
    if (!Array.isArray(value)) {
      return { ok: false, error: 'events_planned must be an array of strings' };
    }
    coerced = value.filter(v => typeof v === 'string' && v.trim().length > 0);
  }

  if (field === 'partner_name' || field === 'wedding_city') {
    if (typeof value !== 'string' || !value.trim()) {
      return { ok: false, error: `${field} must be a non-empty string` };
    }
    coerced = value.trim().slice(0, 120);
  }

  // Update the couples row
  const { error: updateError } = await supabase
    .from('couples')
    .update({ [field]: coerced })
    .eq('id', couple.id);

  if (updateError) {
    console.error('[bride-tool:save_wedding_detail] update error:', updateError);
    return { ok: false, error: updateError.message };
  }

  // Also drop a note row for audit trail
  const noteContent = formatNoteContent(field, coerced, value);
  await supabase.from('notes').insert({
    couple_id: couple.id,
    content:   noteContent,
    tags:      ['detail', field],
  });

  return { ok: true, field, value: coerced };
}

// ── add_event executor ───────────────────────────────────────────────
const ALLOWED_KINDS = new Set([
  'shoot','call','meeting','task','reminder','recce',
  'fitting','trial','family','ceremony','social','other'
]);

async function execAddEvent({ input, couple, supabase }) {
  const { title, event_date, event_time, kind, notes } = input;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return { ok: false, error: 'title required' };
  }
  if (!event_date || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
    return { ok: false, error: 'event_date required in YYYY-MM-DD format' };
  }
  if (!ALLOWED_KINDS.has(kind)) {
    return { ok: false, error: `kind "${kind}" not in allowed list` };
  }

  // event_time is optional; if present, validate HH:MM
  let timeValue = null;
  if (event_time && typeof event_time === 'string') {
    const t = event_time.trim();
    if (/^\d{1,2}:\d{2}$/.test(t)) {
      timeValue = t.length === 4 ? `0${t}` : t;
    }
    // silent skip on malformed time — event still gets created without it
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      couple_id:  couple.id,
      title:      title.trim().slice(0, 200),
      event_date,
      event_time: timeValue,
      kind,
      notes:      notes && typeof notes === 'string' ? notes.trim().slice(0, 500) : null,
      state:      'upcoming',
    })
    .select('id, title, event_date, kind')
    .single();

  if (error) {
    console.error('[bride-tool:add_event] insert error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, event: data };
}

// ── Helpers ──────────────────────────────────────────────────────────

// Coerces a date value into a Postgres-valid YYYY-MM-DD string.
// Returns undefined if it can't parse — caller treats that as an error.
function coerceDate(value) {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // "Month YYYY"
  const monthMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthMatch) {
    const months = {
      january:1, february:2, march:3, april:4, may:5, june:6,
      july:7, august:8, september:9, october:10, november:11, december:12,
      jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, sept:9, oct:10, nov:11, dec:12,
    };
    const m = months[monthMatch[1].toLowerCase()];
    if (m) return `${monthMatch[2]}-${String(m).padStart(2,'0')}-01`;
  }

  // "winter YYYY" / "summer YYYY" / ...
  const seasonMatch = trimmed.match(/^(winter|spring|summer|monsoon|autumn|fall)\s+(\d{4})$/i);
  if (seasonMatch) {
    const seasons = { winter:12, spring:3, summer:5, monsoon:7, autumn:10, fall:10 };
    const m = seasons[seasonMatch[1].toLowerCase()];
    return `${seasonMatch[2]}-${String(m).padStart(2,'0')}-01`;
  }

  return undefined;
}

// Builds a human-readable note content string for save_wedding_detail audit.
function formatNoteContent(field, coercedValue, originalValue) {
  switch (field) {
    case 'partner_name':
      return `Partner: ${coercedValue}`;
    case 'wedding_date':
      // Show original phrasing if it differs from the ISO date stored
      if (typeof originalValue === 'string' && originalValue !== coercedValue) {
        return `Wedding date: ${originalValue} (stored as ${coercedValue})`;
      }
      return `Wedding date: ${coercedValue}`;
    case 'wedding_city':
      return `Wedding city: ${coercedValue}`;
    case 'budget_total':
      return `Budget: Rs ${coercedValue.toLocaleString('en-IN')}`;
    case 'events_planned':
      return `Events planned: ${coercedValue.join(', ')}`;
    default:
      return `${field}: ${coercedValue}`;
  }
}

module.exports = { runBrideAgenticTurn };
