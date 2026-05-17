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
//
// B2 Step 4: added mediaContext parameter for image auto-save context injection,
// list_muse + delete_muse_save executors, and mediaUrls return for image
// playback ("show me save 47" sends the actual image back).
//
// B2 Step 5+6: added invite_to_circle + list_circle executors,
// session_id filter on list_muse, and pre-turn session-summary surfacing
// (Step 6) — when the bride messages, we check for ended-but-unsummarized
// circle sessions, compose a one-line preamble via Haiku, and prepend it to
// dynamicContext. The preamble carries the session_id back to the agent so
// if the bride says "yes send them here", the agent calls list_muse with
// session_id to playback that session's saves only.

const { STATIC_SYSTEM_PROMPT, buildDynamicContext } = require('./brideSystemPrompt');
const { nextBrideOnboardingMessage } = require('./brideOnboarding');
const { BRIDE_TOOLS } = require('./brideTools');
const { classifyMessage } = require('./classifier');
const { MODEL_HAIKU, MODEL_SONNET, calculateCost, COMPLEXITY } = require('./models');

const MAX_ITERATIONS = 5;
const HISTORY_LIMIT  = 10;

// Limits enforced server-side (independent of model behavior)
const LIST_MUSE_DEFAULT_LIMIT = 10;
const LIST_MUSE_MAX_LIMIT     = 30;
const PLAYBACK_MAX_IMAGES     = 5;  // max images sent back in a single bride reply

// Step 6: circle session is considered "ended" after this much idle time.
// Bride's next message triggers summary composition for ended sessions.
const SESSION_IDLE_MS = 10 * 60 * 1000;  // 10 minutes

// ── Bride agentic turn ───────────────────────────────────────────────
// Entry point called from brideIndex.js webhook handler.
//
// New B2 parameter:
//   mediaContext : string | null — when brideIndex.js has just saved an
//     image/link to Muse, this is the synthesized context note ("User sent
//     an image and we saved it to her Muse as save 47, tags: ethnic/grand,
//     caption: 'love this lehenga'"). Injected as a system-level note so
//     the agent knows what happened and can reply naturally.
//
// Returns include new field:
//   mediaUrls : string[] — Cloudinary URLs the engine wants brideIndex to
//     send back to the bride via Twilio media. Populated by list_muse when
//     request_image_playback is true.
async function runBrideAgenticTurn({
  couple,
  user,
  conversation,
  inboundMessage,
  mediaContext = null,
  supabase,
  anthropic,
}) {

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
      mediaUrls:    [],
    };
  }

  // ── Onboarding complete: run the agent loop ──────────────────────

  // Build dynamic context (couple info, notes, events). Self-querying.
  let dynamicContext = await buildDynamicContext(couple.id);

  // ── Step 6: pre-turn circle session summary surfacing ─────────────
  // When the bride's last interaction was a while ago and a circle member
  // has been active in between, we surface a one-time summary of that
  // session as a preamble. The summary is composed by Haiku from the
  // circle_activity rows of the session.
  //
  // We only fire this when there's no fresh mediaContext (i.e. the bride
  // didn't just forward an image herself — in that case the conversation
  // is about HER save, not a circle update).
  if (!mediaContext) {
    const circleSummary = await surfacePendingCircleSessions({
      couple_id: couple.id,
      supabase,
      anthropic,
    });
    if (circleSummary && circleSummary.trim()) {
      dynamicContext = `${circleSummary.trim()}\n\n${dynamicContext}`;
    }
  }

  // If a media auto-save just happened, prepend a context note so the agent
  // knows what landed in Muse and can reply naturally. The bride did not
  // type "save this" — she just forwarded an image. We surface that here.
  if (mediaContext && typeof mediaContext === 'string' && mediaContext.trim()) {
    dynamicContext = `${mediaContext.trim()}\n\n${dynamicContext}`;
  }

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
  const mediaUrlsToReturn = [];   // Cloudinary URLs for image playback

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
        user,
        conversation,
        supabase,
        mediaUrlsToReturn,    // mutable — list_muse pushes URLs here when playback requested
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
    mediaUrls:    mediaUrlsToReturn.slice(0, PLAYBACK_MAX_IMAGES),
  };
}


// ── Tool executors ───────────────────────────────────────────────────
// Switch-case dispatcher (mirrors vendor engine.js pattern).

async function executeBrideTool({ name, input, couple, user, conversation, supabase, mediaUrlsToReturn }) {
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

    case 'create_task': {
      return await execCreateTask({ input, couple, supabase });
    }

    case 'list_tasks': {
      return await execListTasks({ input, couple, supabase });
    }

    case 'complete_task': {
      return await execCompleteTask({ input, couple, supabase });
    }

    case 'update_task': {
      return await execUpdateTask({ input, couple, supabase });
    }

    case 'delete_task': {
      return await execDeleteTask({ input, couple, supabase });
    }

    case 'list_events': {
      return await execListEvents({ input, couple, supabase });
    }

    case 'update_event': {
      return await execUpdateEvent({ input, couple, supabase });
    }

    case 'delete_event': {
      return await execDeleteEvent({ input, couple, supabase });
    }

    case 'add_booking': {
      return await execAddBooking({ input, couple, supabase });
    }

    case 'list_bookings': {
      return await execListBookings({ input, couple, supabase });
    }

    case 'update_booking': {
      return await execUpdateBooking({ input, couple, supabase });
    }

    case 'delete_booking': {
      return await execDeleteBooking({ input, couple, supabase });
    }

    case 'record_payment': {
      return await execRecordPayment({ input, couple, supabase });
    }

    case 'save_receipt': {
      return await execSaveReceipt({ input, couple, supabase });
    }

    case 'list_receipts': {
      return await execListReceipts({ input, couple, supabase, mediaUrlsToReturn });
    }

    case 'delete_receipt': {
      return await execDeleteReceipt({ input, couple, supabase });
    }

    case 'list_muse': {
      return await execListMuse({ input, couple, supabase, mediaUrlsToReturn });
    }

    case 'delete_muse_save': {
      return await execDeleteMuseSave({ input, couple, user, supabase });
    }

    case 'invite_to_circle': {
      return await execInviteToCircle({ input, couple, supabase });
    }

    case 'list_circle': {
      return await execListCircle({ input, couple, supabase });
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
    // L2 audit fix: console.warn the bad input for our logs, return generic
    // error string to the agent (M2 input-leak rule from Audit #1).
    console.warn('[bride-tool:add_event] rejecting invalid kind:', kind);
    return { ok: false, error: 'kind not in allowed list' };
  }

  // event_time is optional; if present, validate HH:MM.
  // M1 audit fix: was previously silent-drop on malformed time, creating
  // agent/DB divergence. Now hard-errors via normalizeEventTime helper
  // (consistent with execUpdateEvent's M2 pattern from B3 Step 3).
  let timeValue = null;
  if (event_time !== undefined && event_time !== null && event_time !== '') {
    timeValue = normalizeEventTime(event_time);
    if (timeValue === null) {
      console.warn('[bride-tool:add_event] rejecting malformed event_time:', event_time);
      return { ok: false, error: 'event_time must be HH:MM format (24-hour)' };
    }
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

// ── task executors (B3) ──────────────────────────────────────────────
// 5 tools: create_task, list_tasks, complete_task, update_task, delete_task.
//
// Design note: priority was DROPPED before tool shipment (see migration
// 0020). The urgency signal is due_date alone — closer the date, more
// urgent. list_tasks sorts by due_date ASC NULLS LAST, then created_at
// DESC, so overdue and soon-due tasks bubble to the top naturally.
//
// Pattern parity with execAddEvent: defensive input validation, supabase
// insert/update/delete with .select(...).single() to return the row, and
// console.error log + { ok: false, error: msg } on any DB failure.
//
// Task disambiguation lives at the AGENT layer, not here: when the bride
// says "complete the venue call", the agent calls list_tasks first to
// resolve the task_id. These executors trust the task_id they receive
// (after validating UUID format) and refuse to act on missing rows by
// reporting { ok: false, error: 'task not found or not yours' } — which
// also implicitly enforces couple scoping: a tool call with another
// couple's task_id returns the same error.

const ALLOWED_TASK_STATUSES = new Set(['pending', 'done']);

// ── Shared validators (used by task executors and any future entity executors) ──
// UUID_REGEX validates the v4-shape uuid string used for couple_tasks.id,
// couple_bookings.id, couple_receipts.id, events.id, muse_saves.id, etc.
// isValidDateString validates the YYYY-MM-DD format used for due_date,
// receipt_date, balance_due_date, event_date. Both are intentionally module-
// scope so all executors share them. DO NOT re-declare locally inside an
// executor — it shadows the shared version and creates refactor traps.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidDateString(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

async function execCreateTask({ input, couple, supabase }) {
  const { title, due_date, event_name, notes } = input || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return { ok: false, error: 'title required' };
  }

  let dueDateValue = null;
  if (due_date && isValidDateString(due_date)) {
    dueDateValue = due_date;
  } else if (due_date) {
    // M2 fix: return a hard error instead of silently dropping the date.
    // Silent drop creates agent/DB divergence — bride hears "task added for
    // Monday" but stored row has no date. Forcing the agent to reformat and
    // retry keeps reply and DB consistent. The bad input goes to logs (for
    // our debugging) but NOT into the returned error (to avoid leaking
    // bride text into log noise downstream).
    console.warn('[bride-tool:create_task] rejecting malformed due_date:', due_date);
    return { ok: false, error: 'due_date must be YYYY-MM-DD format' };
  }

  const { data, error } = await supabase
    .from('couple_tasks')
    .insert({
      couple_id:  couple.id,
      title:      title.trim().slice(0, 200),
      due_date:   dueDateValue,
      event_name: event_name && typeof event_name === 'string' ? event_name.trim().slice(0, 80) : null,
      notes:      notes && typeof notes === 'string' ? notes.trim().slice(0, 500) : null,
      status:     'pending',
    })
    .select('id, title, status, due_date, event_name, notes, created_at')
    .single();

  if (error) {
    console.error('[bride-tool:create_task] insert error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, task: data };
}

async function execListTasks({ input, couple, supabase }) {
  const { status, due_before, event_name, limit } = input || {};

  let query = supabase
    .from('couple_tasks')
    .select('id, title, status, due_date, event_name, notes, created_at, updated_at')
    .eq('couple_id', couple.id);

  // status filter: default to 'pending' if not specified
  // L3 fix: make 'all' explicit and treat unknown values as safe default (pending).
  // Tool schema enum should prevent unknown values but defensive coding here
  // protects against any non-schema-validated caller (tests, internal use).
  if (!status || status === 'pending') {
    query = query.eq('status', 'pending');
  } else if (status === 'done') {
    query = query.eq('status', 'done');
  } else if (status === 'all') {
    // explicit "all" → no status filter
  } else {
    // unknown value → safe default (pending) rather than silently returning everything
    query = query.eq('status', 'pending');
  }

  // due_before filter: hard error on malformed date.
  // I2 fix: symmetric with M2 (execCreateTask). Silent drop would return all
  // tasks up to the limit, which is wrong query results — not stored data,
  // but still a divergence between what the agent asked for and what came back.
  if (due_before) {
    if (isValidDateString(due_before)) {
      query = query.lte('due_date', due_before);
    } else {
      console.warn('[bride-tool:list_tasks] rejecting malformed due_before:', due_before);
      return { ok: false, error: 'due_before must be YYYY-MM-DD format' };
    }
  }

  if (event_name && typeof event_name === 'string' && event_name.trim()) {
    query = query.eq('event_name', event_name.trim());
  }

  // Limit: default 20, cap 50
  let limitValue = 20;
  if (typeof limit === 'number' && Number.isInteger(limit) && limit > 0) {
    limitValue = Math.min(limit, 50);
  }
  query = query.limit(limitValue);

  // Sort: due_date ASC (overdue + soonest first), nulls last (no-due-date tasks
  // at the bottom), then created_at DESC as tiebreaker.
  query = query.order('due_date', { ascending: true, nullsFirst: false })
               .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[bride-tool:list_tasks] select error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, tasks: data || [], count: (data || []).length };
}

async function execCompleteTask({ input, couple, supabase }) {
  const { task_id } = input || {};

  if (!task_id || typeof task_id !== 'string' || !UUID_REGEX.test(task_id)) {
    return { ok: false, error: 'task_id required (UUID format)' };
  }

  // Scope to couple_id at the WHERE level — prevents acting on another couple's task.
  const { data, error } = await supabase
    .from('couple_tasks')
    .update({ status: 'done' })
    .eq('id', task_id)
    .eq('couple_id', couple.id)
    .select('id, title, status, due_date, event_name')
    .single();

  if (error) {
    // PostgREST returns PGRST116 for no-rows-matched on .single()
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'task not found or not yours' };
    }
    console.error('[bride-tool:complete_task] update error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, task: data };
}

async function execUpdateTask({ input, couple, supabase }) {
  const { task_id, title, due_date, event_name, notes } = input || {};

  if (!task_id || typeof task_id !== 'string' || !UUID_REGEX.test(task_id)) {
    return { ok: false, error: 'task_id required (UUID format)' };
  }

  const updates = {};

  if (typeof title === 'string' && title.trim()) {
    updates.title = title.trim().slice(0, 200);
  }

  // M1 fix: clear-field sentinel accepts all three natural model conventions:
  //   - "null" (4-char string, original convention documented in tool schema)
  //   - null (JSON null — Haiku may emit despite schema type "string")
  //   - "" (empty string — natural interpretation of "remove the date")
  // Without this, the agent says "removed the deadline" but the field is not
  // cleared, producing silent agent/DB divergence.

  // due_date: clear on null sentinel; valid YYYY-MM-DD sets it.
  if (due_date === 'null' || due_date === null || due_date === '') {
    updates.due_date = null;
  } else if (isValidDateString(due_date)) {
    updates.due_date = due_date;
  }

  // event_name: clear on null sentinel; non-empty trimmed string sets it.
  if (event_name === 'null' || event_name === null || event_name === '') {
    updates.event_name = null;
  } else if (typeof event_name === 'string' && event_name.trim()) {
    updates.event_name = event_name.trim().slice(0, 80);
  }

  // notes: clear on null sentinel; non-empty trimmed string sets it.
  if (notes === 'null' || notes === null || notes === '') {
    updates.notes = null;
  } else if (typeof notes === 'string' && notes.trim()) {
    updates.notes = notes.trim().slice(0, 500);
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'no fields to update' };
  }

  const { data, error } = await supabase
    .from('couple_tasks')
    .update(updates)
    .eq('id', task_id)
    .eq('couple_id', couple.id)
    .select('id, title, status, due_date, event_name, notes')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'task not found or not yours' };
    }
    console.error('[bride-tool:update_task] update error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, task: data };
}

async function execDeleteTask({ input, couple, supabase }) {
  const { task_id } = input || {};

  if (!task_id || typeof task_id !== 'string' || !UUID_REGEX.test(task_id)) {
    return { ok: false, error: 'task_id required (UUID format)' };
  }

  // L2 fix: atomic single-call delete (mirrors execCompleteTask/execUpdateTask).
  // The PostgREST .delete().eq().select().single() pattern deletes the row and
  // returns its content in one round-trip. PGRST116 ("zero rows") means the row
  // didn't exist or belonged to another couple — same error, prevents fishing.
  // This is the CANONICAL DELETE PATTERN for the bride product. The remaining
  // three delete executors (delete_event, delete_booking, delete_receipt) must
  // follow this shape, not the older fetch-then-delete pattern.
  const { data, error } = await supabase
    .from('couple_tasks')
    .delete()
    .eq('id', task_id)
    .eq('couple_id', couple.id)
    .select('id, title, status, due_date, event_name')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'task not found or not yours' };
    }
    console.error('[bride-tool:delete_task] delete error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, deleted_task: data };
}

// ── event executors (B3 Step 3) ───────────────────────────────────────
// 3 tools: list_events, update_event, delete_event.
// add_event already shipped at B1; the read/edit/delete surface is added here
// to make the event tooling complete.
//
// Important: the events table is SHARED between vendors and brides via XOR
// ownership (events_owner_xor constraint, migration 0013) — exactly one of
// vendor_id or couple_id is set per row. All bride-side executors MUST scope
// every query to couple_id at the SQL WHERE level. Same security property as
// the task tools.
//
// All three inherit the post-audit canonical patterns:
//   - Atomic single-call mutations (L2 pattern)
//   - PGRST116 mapped to "not found or not yours"
//   - "null" / null / "" sentinel clears nullable fields (M1 pattern)
//   - Hard error on malformed dates (M2 pattern), input not leaked in error
//   - Safe default on unknown enum value (L3 pattern)
//   - Module-level UUID_REGEX and isValidDateString (no re-declaration)
//
// Note: ALLOWED_KINDS is defined at line 403 (above execAddEvent, B1). Reused
// here for kind validation in update_event.

const ALLOWED_EVENT_STATES = new Set(['upcoming', 'done', 'cancelled']);
const TIME_REGEX = /^\d{1,2}:\d{2}$/;

function normalizeEventTime(t) {
  // Normalises "9:30" → "09:30", "15:30" → "15:30". Returns null on malformed.
  // I1 audit fix: validates format AND semantic range. "25:00", "12:99",
  // "09:75" are syntactically valid digit patterns but invalid times — they
  // would otherwise pass TIME_REGEX and get stored as text. Range check
  // rejects them.
  if (typeof t !== 'string') return null;
  const trimmed = t.trim();
  if (!TIME_REGEX.test(trimmed)) return null;
  const [h, m] = trimmed.split(':').map(Number);
  if (h > 23 || m > 59) return null;
  return trimmed.length === 4 ? `0${trimmed}` : trimmed;
}

async function execListEvents({ input, couple, supabase }) {
  const { date_from, date_to, kind, state, limit } = input || {};

  let query = supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, notes, created_at, updated_at')
    .eq('couple_id', couple.id);

  // date_from filter: hard error on malformed (M2/I2 pattern)
  if (date_from) {
    if (isValidDateString(date_from)) {
      query = query.gte('event_date', date_from);
    } else {
      console.warn('[bride-tool:list_events] rejecting malformed date_from:', date_from);
      return { ok: false, error: 'date_from must be YYYY-MM-DD format' };
    }
  }

  // date_to filter: same pattern
  if (date_to) {
    if (isValidDateString(date_to)) {
      query = query.lte('event_date', date_to);
    } else {
      console.warn('[bride-tool:list_events] rejecting malformed date_to:', date_to);
      return { ok: false, error: 'date_to must be YYYY-MM-DD format' };
    }
  }

  // kind filter: L3 safe-default (return all kinds, not error). I2 audit fix:
  // now logs a console.warn when an unknown value arrives so schema drift
  // gets detected. Symmetric with update_event's logging behavior.
  if (kind) {
    if (ALLOWED_KINDS.has(kind)) {
      query = query.eq('kind', kind);
    } else {
      console.warn('[bride-tool:list_events] unknown kind filter, returning all kinds:', kind);
    }
  }

  // state filter: default to 'upcoming'; explicit-all branch + safe default (L3 pattern)
  if (!state || state === 'upcoming') {
    query = query.eq('state', 'upcoming');
  } else if (state === 'done') {
    query = query.eq('state', 'done');
  } else if (state === 'cancelled') {
    query = query.eq('state', 'cancelled');
  } else if (state === 'all') {
    // explicit "all" → no state filter
  } else {
    // unknown value → safe default (upcoming)
    query = query.eq('state', 'upcoming');
  }

  // Limit: default 20, cap 50
  let limitValue = 20;
  if (typeof limit === 'number' && Number.isInteger(limit) && limit > 0) {
    limitValue = Math.min(limit, 50);
  }
  query = query.limit(limitValue);

  // Sort: event_date ASC (soonest first), then event_time ASC nulls last
  query = query.order('event_date', { ascending: true })
               .order('event_time', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    console.error('[bride-tool:list_events] select error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, events: data || [], count: (data || []).length };
}

async function execUpdateEvent({ input, couple, supabase }) {
  const { event_id, title, event_date, event_time, kind, notes, state } = input || {};

  if (!event_id || typeof event_id !== 'string' || !UUID_REGEX.test(event_id)) {
    return { ok: false, error: 'event_id required (UUID format)' };
  }

  const updates = {};

  if (typeof title === 'string' && title.trim()) {
    updates.title = title.trim().slice(0, 200);
  }

  // event_date: REQUIRED column in schema (NOT NULL) — cannot be cleared, only changed.
  // Hard error on malformed (M2 pattern). No null/empty acceptance.
  if (event_date !== undefined && event_date !== null && event_date !== '') {
    if (isValidDateString(event_date)) {
      updates.event_date = event_date;
    } else {
      console.warn('[bride-tool:update_event] rejecting malformed event_date:', event_date);
      return { ok: false, error: 'event_date must be YYYY-MM-DD format' };
    }
  }

  // event_time: nullable, clearable via M1 pattern ("null"/null/"")
  if (event_time === 'null' || event_time === null || event_time === '') {
    updates.event_time = null;
  } else if (event_time !== undefined) {
    const normalized = normalizeEventTime(event_time);
    if (normalized === null) {
      console.warn('[bride-tool:update_event] rejecting malformed event_time:', event_time);
      return { ok: false, error: 'event_time must be HH:MM format' };
    }
    updates.event_time = normalized;
  }

  // kind: enum validation. Invalid values are silently ignored with a log.
  // L1 audit decision (split call): kind is a label only — it doesn't affect
  // filtering defaults, sort behavior, or any state machine. Silent-ignore
  // here lets the rest of an update proceed even if the model passes a slightly
  // wrong kind ("dress_fitting" instead of "fitting"). Contrast with state
  // below, which is operational and IS hard-errored on invalid input.
  if (kind && ALLOWED_KINDS.has(kind)) {
    updates.kind = kind;
  } else if (kind) {
    console.warn('[bride-tool:update_event] ignoring invalid kind:', kind);
  }

  // notes: clearable via M1 pattern
  if (notes === 'null' || notes === null || notes === '') {
    updates.notes = null;
  } else if (typeof notes === 'string' && notes.trim()) {
    updates.notes = notes.trim().slice(0, 500);
  }

  // state: operational field — filters list_events default view (upcoming-only)
  // and signals event completion/cancellation. L1 audit fix: invalid values
  // hard-error instead of silent-ignore. Without this, agent says "marked it
  // done" while state stays 'upcoming' — agent/DB divergence on an operational
  // field. No clear path (state is NOT NULL with schema default 'upcoming').
  if (state && ALLOWED_EVENT_STATES.has(state)) {
    updates.state = state;
  } else if (state) {
    console.warn('[bride-tool:update_event] rejecting invalid state:', state);
    return { ok: false, error: 'state must be upcoming, done, or cancelled' };
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'no fields to update' };
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', event_id)
    .eq('couple_id', couple.id)
    .select('id, title, event_date, event_time, kind, state, notes')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'event not found or not yours' };
    }
    console.error('[bride-tool:update_event] update error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, event: data };
}

async function execDeleteEvent({ input, couple, supabase }) {
  const { event_id } = input || {};

  if (!event_id || typeof event_id !== 'string' || !UUID_REGEX.test(event_id)) {
    return { ok: false, error: 'event_id required (UUID format)' };
  }

  // L2 canonical delete pattern: atomic single-call .delete().eq().select().single()
  // PGRST116 means zero rows matched — either doesn't exist or belongs to another couple.
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', event_id)
    .eq('couple_id', couple.id)
    .select('id, title, event_date, event_time, kind, state')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'event not found or not yours' };
    }
    console.error('[bride-tool:delete_event] delete error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, deleted_event: data };
}

// ── booking executors (B3 Step 4) ─────────────────────────────────────
// 5 tools: add_booking, list_bookings, update_booking, delete_booking,
//          record_payment.
//
// LOCKED ARCHITECTURAL PRINCIPLES from migration 0019 + ROADMAP_BRIDE.md:
//   - Bookings are FLAT: one row per vendor commitment, no multi-event splits
//   - No 'cancelled' state: delete_booking replaces cancellation
//   - No agent arithmetic: ALL amount_paid + state math is in record_payment()
//     SQL function. update_booking explicitly REFUSES amount_paid changes.
//   - No per-payer attribution: every payment is implicitly the bride's
//
// Patterns inherited from post-audit Step 2:
//   - L2 atomic delete pattern
//   - PGRST116 → "not found or not yours"
//   - M1 "null"/null/"" clear sentinel
//   - M2 hard error on malformed dates (no input leak in error messages)
//   - L3 safe default on unknown enum
//   - Module-level UUID_REGEX + isValidDateString (no re-declaration)
//
// State enum (from 0019): 'booked' | 'advance_paid' | 'paid'. The agent
// NEVER writes to state directly — record_payment() computes it from
// amount_paid vs amount_advance vs amount_total.
//
// AMOUNT CLEAR CONVENTION: passing -1 to update_booking clears an integer
// amount field (sets to null). This is distinct from M1's string sentinel
// because integer fields can't use "null"/"" — they'd be type-coerced or
// rejected. -1 is impossible for a real rupee amount (CHECK constraint
// enforces >= 0), so it's safe as a sentinel.

const ALLOWED_BOOKING_CATEGORIES = new Set([
  'photographer', 'videographer', 'mua', 'designer',
  'venue', 'caterer', 'decor', 'florist', 'music',
  'planner', 'other',
]);

const ALLOWED_BOOKING_STATES = new Set(['booked', 'advance_paid', 'paid']);

async function execAddBooking({ input, couple, supabase }) {
  const { vendor_name, category, amount_total, amount_advance, balance_due_date, notes } = input || {};

  if (!vendor_name || typeof vendor_name !== 'string' || !vendor_name.trim()) {
    return { ok: false, error: 'vendor_name required' };
  }
  if (!category || !ALLOWED_BOOKING_CATEGORIES.has(category)) {
    return { ok: false, error: 'category required (must be one of the allowed values)' };
  }

  // amount_total: optional. Must be non-negative integer if provided.
  let amountTotalValue = null;
  if (amount_total !== undefined && amount_total !== null) {
    if (!Number.isInteger(amount_total) || amount_total < 0) {
      return { ok: false, error: 'amount_total must be a non-negative integer (rupees)' };
    }
    amountTotalValue = amount_total;
  }

  // amount_advance: optional. Must be non-negative integer if provided.
  let amountAdvanceValue = null;
  if (amount_advance !== undefined && amount_advance !== null) {
    if (!Number.isInteger(amount_advance) || amount_advance < 0) {
      return { ok: false, error: 'amount_advance must be a non-negative integer (rupees)' };
    }
    amountAdvanceValue = amount_advance;
  }

  // balance_due_date: optional. Hard error on malformed (M2 pattern).
  let balanceDueDateValue = null;
  if (balance_due_date) {
    if (!isValidDateString(balance_due_date)) {
      console.warn('[bride-tool:add_booking] rejecting malformed balance_due_date:', balance_due_date);
      return { ok: false, error: 'balance_due_date must be YYYY-MM-DD format' };
    }
    balanceDueDateValue = balance_due_date;
  }

  const { data, error } = await supabase
    .from('couple_bookings')
    .insert({
      couple_id:        couple.id,
      vendor_name:      vendor_name.trim().slice(0, 200),
      category,
      amount_total:     amountTotalValue,
      amount_advance:   amountAdvanceValue,
      balance_due_date: balanceDueDateValue,
      notes:            notes && typeof notes === 'string' ? notes.trim().slice(0, 500) : null,
      // amount_paid + state default to 0 / 'booked' in schema
    })
    .select('id, vendor_name, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes, created_at')
    .single();

  if (error) {
    console.error('[bride-tool:add_booking] insert error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, booking: data };
}

async function execListBookings({ input, couple, supabase }) {
  const { category, state, vendor_name, limit } = input || {};

  let query = supabase
    .from('couple_bookings')
    .select('id, vendor_name, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes, created_at, updated_at')
    .eq('couple_id', couple.id);

  // category filter: silent skip on invalid (schema enum should prevent)
  if (category && ALLOWED_BOOKING_CATEGORIES.has(category)) {
    query = query.eq('category', category);
  }

  // state filter: default 'all' (different from tasks/events where pending/upcoming is default).
  // Bookings are commitments — the bride usually wants to see EVERYTHING she has booked,
  // regardless of payment progress. L3 safe-default pattern for unknown values.
  if (!state || state === 'all') {
    // no state filter
  } else if (ALLOWED_BOOKING_STATES.has(state)) {
    query = query.eq('state', state);
  } else {
    // unknown value → safe default: show all
    console.warn('[bride-tool:list_bookings] unknown state value, falling back to all:', state);
  }

  // vendor_name partial match: case-insensitive ILIKE
  if (vendor_name && typeof vendor_name === 'string' && vendor_name.trim()) {
    const term = vendor_name.trim().slice(0, 200);
    // Escape % and _ to prevent ILIKE pattern injection
    const escaped = term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.ilike('vendor_name', `%${escaped}%`);
  }

  // Limit: default 20, cap 50
  let limitValue = 20;
  if (typeof limit === 'number' && Number.isInteger(limit) && limit > 0) {
    limitValue = Math.min(limit, 50);
  }
  query = query.limit(limitValue);

  // Sort: by balance_due_date ASC nulls last, then by created_at DESC.
  // Bookings with deadlines bubble up; standalone commitments at bottom by recency.
  query = query.order('balance_due_date', { ascending: true, nullsFirst: false })
               .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[bride-tool:list_bookings] select error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, bookings: data || [], count: (data || []).length };
}

async function execUpdateBooking({ input, couple, supabase }) {
  const { booking_id, vendor_name, category, amount_total, amount_advance, balance_due_date, notes } = input || {};

  if (!booking_id || typeof booking_id !== 'string' || !UUID_REGEX.test(booking_id)) {
    return { ok: false, error: 'booking_id required (UUID format)' };
  }

  const updates = {};

  if (typeof vendor_name === 'string' && vendor_name.trim()) {
    updates.vendor_name = vendor_name.trim().slice(0, 200);
  }

  if (category && ALLOWED_BOOKING_CATEGORIES.has(category)) {
    updates.category = category;
  } else if (category) {
    console.warn('[bride-tool:update_booking] ignoring invalid category:', category);
  }

  // amount_total: -1 clears (sets to null); non-negative integer sets.
  // The -1 sentinel is safe because schema CHECK enforces amount >= 0.
  if (amount_total === -1) {
    updates.amount_total = null;
  } else if (amount_total !== undefined && amount_total !== null) {
    if (!Number.isInteger(amount_total) || amount_total < 0) {
      return { ok: false, error: 'amount_total must be a non-negative integer (or -1 to clear)' };
    }
    updates.amount_total = amount_total;
  }

  // amount_advance: same -1 sentinel
  if (amount_advance === -1) {
    updates.amount_advance = null;
  } else if (amount_advance !== undefined && amount_advance !== null) {
    if (!Number.isInteger(amount_advance) || amount_advance < 0) {
      return { ok: false, error: 'amount_advance must be a non-negative integer (or -1 to clear)' };
    }
    updates.amount_advance = amount_advance;
  }

  // balance_due_date: M1 pattern ("null"/null/"" clears), M2 hard error on malformed.
  if (balance_due_date === 'null' || balance_due_date === null || balance_due_date === '') {
    updates.balance_due_date = null;
  } else if (balance_due_date !== undefined) {
    if (!isValidDateString(balance_due_date)) {
      console.warn('[bride-tool:update_booking] rejecting malformed balance_due_date:', balance_due_date);
      return { ok: false, error: 'balance_due_date must be YYYY-MM-DD format' };
    }
    updates.balance_due_date = balance_due_date;
  }

  // notes: M1 pattern
  if (notes === 'null' || notes === null || notes === '') {
    updates.notes = null;
  } else if (typeof notes === 'string' && notes.trim()) {
    updates.notes = notes.trim().slice(0, 500);
  }

  // Critical guard FIRST (L1 audit fix from Audit 2b): strip reserved fields
  // before checking what's left. If future drift adds amount_paid or state
  // to updates above, they get stripped here rather than sneaking through
  // to the DB write or creating an empty-update call. Position matters:
  // running the deletes AFTER the empty check defeats the guard's own purpose.
  // record_payment() owns amount_paid and state exclusively.
  delete updates.amount_paid;
  delete updates.state;

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'no fields to update' };
  }

  const { data, error } = await supabase
    .from('couple_bookings')
    .update(updates)
    .eq('id', booking_id)
    .eq('couple_id', couple.id)
    .select('id, vendor_name, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'booking not found or not yours' };
    }
    console.error('[bride-tool:update_booking] update error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, booking: data };
}

async function execDeleteBooking({ input, couple, supabase }) {
  const { booking_id } = input || {};

  if (!booking_id || typeof booking_id !== 'string' || !UUID_REGEX.test(booking_id)) {
    return { ok: false, error: 'booking_id required (UUID format)' };
  }

  // L2 canonical delete pattern: atomic single-call .delete().eq().select().single()
  // Receipts linked to this booking are NOT deleted — booking_id FK uses ON DELETE
  // SET NULL (migration 0019), so receipts become standalone records.
  const { data, error } = await supabase
    .from('couple_bookings')
    .delete()
    .eq('id', booking_id)
    .eq('couple_id', couple.id)
    .select('id, vendor_name, category, amount_total, amount_paid, state')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'booking not found or not yours' };
    }
    console.error('[bride-tool:delete_booking] delete error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, deleted_booking: data };
}

async function execRecordPayment({ input, couple, supabase }) {
  const { booking_id, amount, payment_date } = input || {};

  if (!booking_id || typeof booking_id !== 'string' || !UUID_REGEX.test(booking_id)) {
    return { ok: false, error: 'booking_id required (UUID format)' };
  }

  // amount: integer (rupees). Allowed to be negative (reversal). Must not be zero.
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount === 0) {
    return { ok: false, error: 'amount required (non-zero integer rupees)' };
  }

  // payment_date: optional. Hard error on malformed.
  let paymentDateValue = null;
  if (payment_date) {
    if (!isValidDateString(payment_date)) {
      console.warn('[bride-tool:record_payment] rejecting malformed payment_date:', payment_date);
      return { ok: false, error: 'payment_date must be YYYY-MM-DD format' };
    }
    paymentDateValue = payment_date;
  }

  // Pre-check couple scoping: the SQL function does NOT scope to couple_id (it operates
  // on booking_id directly). We must verify the booking belongs to this couple BEFORE
  // calling the function — otherwise couple B could record a payment on couple A's booking.
  const { data: bookingCheck, error: checkError } = await supabase
    .from('couple_bookings')
    .select('id')
    .eq('id', booking_id)
    .eq('couple_id', couple.id)
    .maybeSingle();

  if (checkError) {
    console.error('[bride-tool:record_payment] couple-scope check error:', checkError);
    return { ok: false, error: checkError.message };
  }
  if (!bookingCheck) {
    return { ok: false, error: 'booking not found or not yours' };
  }

  // Call the SQL function. It locks the row, updates amount_paid, recomputes state.
  // p_receipt_id is null at this stage — the 3-branch receipt flow (Step 6) will
  // pass a receipt id when linking a saved receipt to a payment.
  const { data, error } = await supabase.rpc('record_payment', {
    p_booking_id:   booking_id,
    p_amount:       amount,
    p_receipt_id:   null,
    p_payment_date: paymentDateValue,
  });

  if (error) {
    // Postgres no_data_found (raised inside the function) bubbles up here for
    // booking-deleted-between-check-and-rpc cases. Same user message.
    // I2 audit fix: removed the over-broad /not found/i regex. It would
    // silently swallow any other DB error containing "not found" in the
    // message (network errors, future SQL exceptions, receipt-linkage
    // failures in Step 6) without logging. The P0002 / no_data_found codes
    // are exactly what this SQL function raises — no fallback needed.
    if (error.code === 'P0002' || error.code === 'no_data_found') {
      return { ok: false, error: 'booking not found or not yours' };
    }
    console.error('[bride-tool:record_payment] rpc error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, booking: data };
}

// ── receipt executors (B3 Step 6) ─────────────────────────────────────
// 3 tools: save_receipt, list_receipts, delete_receipt.
//
// Receipts are a SAFEKEEPING VAULT — visual archive, no questions asked.
// Agent calls save_receipt immediately on receipt detection with just the
// image_url. No label, no amount, no vendor_name asked of the bride.
// Retrieval and linking to vendors happens via PWA (Sessions 11-12).
//
// All three inherit the post-audit canonical patterns (L2, M1, UUID_REGEX).
// list_receipts supports image playback via mediaUrlsToReturn (same as list_muse).

async function execSaveReceipt({ input, couple, supabase }) {
  const { image_url } = input || {};

  if (!image_url || typeof image_url !== 'string' || !image_url.trim()) {
    return { ok: false, error: 'image_url required' };
  }

  // I2 audit fix: minimal URL shape check — mirrors the B2 I3 pattern for
  // session_id. Cloudinary URLs always start with https://. If the model
  // truncates or reformats the URL from the SYSTEM NOTE, a malformed URL
  // stored in couple_receipts would show as a broken image in the PWA.
  const trimmedUrl = image_url.trim();
  if (!trimmedUrl.startsWith('https://')) {
    console.warn('[bride-tool:save_receipt] image_url does not look like a URL:', trimmedUrl.slice(0, 80));
    return { ok: false, error: 'image_url must be a valid https URL' };
  }

  const { data, error } = await supabase
    .from('couple_receipts')
    .insert({
      couple_id: couple.id,
      image_url: trimmedUrl,
    })
    .select('id, image_url, created_at')
    .single();

  if (error) {
    console.error('[bride-tool:save_receipt] insert error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, receipt: data };
}

async function execListReceipts({ input, couple, supabase, mediaUrlsToReturn }) {
  const { limit, request_image_playback = false } = input || {};

  // Limit: default 10, cap 20 (receipts are fewer than tasks/bookings)
  let limitValue = 10;
  if (typeof limit === 'number' && Number.isInteger(limit) && limit > 0) {
    limitValue = Math.min(limit, 20);
  }

  const { data, error } = await supabase
    .from('couple_receipts')
    .select('id, image_url, created_at')
    .eq('couple_id', couple.id)
    .order('created_at', { ascending: false })
    .limit(limitValue);

  if (error) {
    console.error('[bride-tool:list_receipts] select error:', error);
    return { ok: false, error: error.message };
  }

  const receipts = data || [];

  // Image playback — push Cloudinary URLs into mediaUrlsToReturn (same
  // pattern as list_muse). Engine sends these back as WhatsApp images.
  if (request_image_playback && Array.isArray(mediaUrlsToReturn)) {
    for (const r of receipts) {
      if (r.image_url && mediaUrlsToReturn.length < PLAYBACK_MAX_IMAGES) {
        mediaUrlsToReturn.push(r.image_url);
      }
    }
  }

  return { ok: true, receipts, count: receipts.length };
}

async function execDeleteReceipt({ input, couple, supabase }) {
  const { receipt_id } = input || {};

  if (!receipt_id || typeof receipt_id !== 'string' || !UUID_REGEX.test(receipt_id)) {
    return { ok: false, error: 'receipt_id required (UUID format)' };
  }

  // L2 canonical delete pattern
  const { data, error } = await supabase
    .from('couple_receipts')
    .delete()
    .eq('id', receipt_id)
    .eq('couple_id', couple.id)
    .select('id, image_url, created_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { ok: false, error: 'receipt not found or not yours' };
    }
    console.error('[bride-tool:delete_receipt] delete error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, deleted_receipt: data };
}

// ── list_muse executor (B2) ──────────────────────────────────────────
// Queries muse_saves with structured filters. Optionally pushes Cloudinary
// URLs into mediaUrlsToReturn for outbound image playback.
//
// Supports four filters from the agent: save_number (single lookup), limit
// (pagination), aesthetic_tags (taxonomy match), saved_by (bride vs circle).
// Plus request_image_playback flag.
//
// Note on aesthetic_tags filter: muse_saves.aesthetic_tags is a jsonb column
// (not text[]). Supabase's .overlaps() compiles to Postgres '&&' which is NOT
// defined for jsonb — so we do the tag intersection in JavaScript instead.
// At bride-scale (max a few hundred saves per couple), the perf cost is nil.
// We pre-fetch a wider window from Postgres (FETCH_FACTOR x limit) and then
// filter to the requested tags in memory, slicing to the final limit after.

const FETCH_FACTOR = 4;  // when filtering, pull 4x the limit to give in-memory filter room

async function execListMuse({ input, couple, supabase, mediaUrlsToReturn }) {
  const {
    save_number,
    limit = LIST_MUSE_DEFAULT_LIMIT,
    aesthetic_tags,
    saved_by,
    session_id,
    request_image_playback = false,
  } = input || {};

  const tagFilterActive = Array.isArray(aesthetic_tags) && aesthetic_tags.length > 0;

  // ── Step 6: session_id filter ───────────────────────────────────
  // When the bride confirms "yes send them here" on a session-summary preamble,
  // the agent passes session_id. We resolve session_id → list of muse_save IDs
  // via circle_activity, then constrain the main query.
  //
  // I3 fix: validate that session_id is a valid UUID before querying. The
  // session_id is extracted by the LLM from the [session_id: uuid] marker in
  // the system note — if the model truncates or reformats it, we get a bad
  // string. Return a clear error so the agent can inform the bride rather than
  // silently returning 0 saves.
  // (UUID_REGEX is defined at module scope under "Shared validators" — no
  //  local re-declaration; L1 audit fix.)
  let sessionSaveIds = null;
  if (session_id && typeof session_id === 'string' && session_id.trim()) {
    const trimmedSessionId = session_id.trim();
    if (!UUID_REGEX.test(trimmedSessionId)) {
      console.error(`[bride-tool:list_muse] invalid session_id format: "${trimmedSessionId}"`);
      return { ok: false, error: `session_id must be a valid UUID (got: "${trimmedSessionId}")` };
    }

    const { data: sessionRows, error: sessionErr } = await supabase
      .from('circle_activity')
      .select('subject_id')
      .eq('session_id', trimmedSessionId)
      .eq('subject_type', 'muse_save')
      .eq('activity_type', 'save_added');

    if (sessionErr) {
      console.error('[bride-tool:list_muse] session lookup error:', sessionErr);
      return { ok: false, error: sessionErr.message };
    }

    sessionSaveIds = (sessionRows || []).map(r => r.subject_id).filter(Boolean);
    if (sessionSaveIds.length === 0) {
      // Session had no muse saves — return empty cleanly.
      return { ok: true, count: 0, saves: [], image_playback_queued: 0 };
    }
  }

  // Build the query
  let query = supabase
    .from('muse_saves')
    .select('id, save_number, source_type, source_url, image_url, caption, aesthetic_tags, saved_by_user_id, saved_by_role, created_at')
    .eq('couple_id', couple.id);

  if (typeof save_number === 'number') {
    query = query.eq('save_number', save_number);
  }

  if (saved_by === 'bride') {
    query = query.eq('saved_by_role', 'bride');
  } else if (saved_by === 'circle_member') {
    query = query.eq('saved_by_role', 'circle_member');
  }

  // Constrain to a specific session's saves if session_id was passed.
  if (sessionSaveIds) {
    query = query.in('id', sessionSaveIds);
  }

  // Note: tag intersection is done in JS post-fetch, not in SQL. See header
  // comment above this function.

  // Apply limit + ordering (newest first), unless looking up a single save.
  // When a tag filter is active, fetch FETCH_FACTOR x the limit so the JS
  // filter has enough candidates to satisfy the requested limit.
  let safeLimit;
  if (typeof save_number !== 'number') {
    safeLimit = Math.min(Math.max(parseInt(limit, 10) || LIST_MUSE_DEFAULT_LIMIT, 1), LIST_MUSE_MAX_LIMIT);
    const fetchLimit = tagFilterActive
      ? Math.min(safeLimit * FETCH_FACTOR, LIST_MUSE_MAX_LIMIT * FETCH_FACTOR)
      : safeLimit;
    query = query.order('save_number', { ascending: false }).limit(fetchLimit);
  }

  const { data: rawSaves, error } = await query;

  if (error) {
    console.error('[bride-tool:list_muse] query error:', error);
    return { ok: false, error: error.message };
  }

  // In-memory tag intersection. A save matches if its aesthetic_tags array
  // shares at least one element with the requested filter (OR semantics).
  let saves = rawSaves || [];
  if (tagFilterActive) {
    const wantedTags = new Set(aesthetic_tags);
    saves = saves.filter(s => {
      if (!Array.isArray(s.aesthetic_tags)) return false;
      return s.aesthetic_tags.some(t => wantedTags.has(t));
    });
    // After filtering, slice down to the originally-requested limit
    if (typeof save_number !== 'number') {
      saves = saves.slice(0, safeLimit);
    }
  }

  // If playback requested, queue up the Cloudinary URLs for the engine to
  // return to brideIndex. Capped at PLAYBACK_MAX_IMAGES via final slice in
  // runBrideAgenticTurn.
  const prevPlaybackCount = Array.isArray(mediaUrlsToReturn) ? mediaUrlsToReturn.length : 0;
  if (request_image_playback && Array.isArray(saves) && saves.length > 0 && Array.isArray(mediaUrlsToReturn)) {
    for (const s of saves) {
      if (s.image_url && mediaUrlsToReturn.length < PLAYBACK_MAX_IMAGES) {
        mediaUrlsToReturn.push(s.image_url);
      }
    }
  }

  // Shape the response for the agent — keep it lean (no vision_raw, no urls
  // when not needed). Agent composes natural-language reply from this.
  const shaped = (saves || []).map(s => ({
    save_number:    s.save_number,
    source_type:    s.source_type,
    caption:        s.caption,
    aesthetic_tags: s.aesthetic_tags,
    saved_by_role:  s.saved_by_role,
    created_at:     s.created_at,
  }));

  return {
    ok: true,
    count:               shaped.length,
    saves:               shaped,
    image_playback_queued: request_image_playback && Array.isArray(mediaUrlsToReturn) ? mediaUrlsToReturn.length - prevPlaybackCount : 0,
  };
}

// ── delete_muse_save executor (B2) ───────────────────────────────────
// Hard delete. Bride can delete any save on her board. Circle members can
// only delete their own contributions — enforced here, even though Step 4
// only ships bride-side execution (circle agent loop arrives in Step 5).
//
// The `user` param is the user_id of the speaker (passed in from brideIndex
// based on whose phone matched). We compare against muse_saves.saved_by_user_id
// to enforce circle-member ownership.

async function execDeleteMuseSave({ input, couple, user, supabase }) {
  const { save_number } = input || {};

  if (typeof save_number !== 'number' || save_number < 1) {
    return { ok: false, error: 'save_number must be a positive integer' };
  }

  // Look up the save first to check permissions and report what was deleted
  const { data: target, error: lookupError } = await supabase
    .from('muse_saves')
    .select('id, save_number, saved_by_user_id, saved_by_role, caption, aesthetic_tags')
    .eq('couple_id', couple.id)
    .eq('save_number', save_number)
    .maybeSingle();

  if (lookupError) {
    console.error('[bride-tool:delete_muse_save] lookup error:', lookupError);
    return { ok: false, error: lookupError.message };
  }

  if (!target) {
    return { ok: false, error: `save ${save_number} not found` };
  }

  // Permission check: bride can delete anything; circle member only their own
  const speakerUserId = user?.id;
  const speakerIsTheBride = speakerUserId && couple.user_id && speakerUserId === couple.user_id;

  if (!speakerIsTheBride) {
    // Speaker is not the bride. They can only delete their own contributions.
    if (target.saved_by_user_id !== speakerUserId) {
      return {
        ok: false,
        error: 'circle members can only delete their own contributions',
      };
    }
  }

  // Delete the row. circle_activity rows referencing this save stay (the
  // FK is polymorphic-style with no constraint — see migration 0016).
  const { error: deleteError } = await supabase
    .from('muse_saves')
    .delete()
    .eq('id', target.id);

  if (deleteError) {
    console.error('[bride-tool:delete_muse_save] delete error:', deleteError);
    return { ok: false, error: deleteError.message };
  }

  // Write a circle_activity row to record the removal (so the bride can be
  // told about it later if a circle member removed their own save). Non-fatal
  // if it fails — the delete itself already succeeded; we log a warning so
  // a schema or constraint issue doesn't go unobserved (parity with the
  // same pattern in museSave.js).
  const { error: activityError } = await supabase.from('circle_activity').insert({
    couple_id:     couple.id,
    actor_user_id: speakerUserId ?? null,
    actor_name:    speakerIsTheBride ? 'You' : 'Circle member',
    actor_role:    speakerIsTheBride ? 'bride' : 'circle_member',
    activity_type: 'removed',
    subject_type:  'muse_save',
    subject_id:    target.id,
    payload:       { save_number, caption: target.caption },
  });

  if (activityError) {
    console.error('[bride-tool:delete_muse_save] circle_activity insert failed (non-fatal):', activityError.message);
  }

  return {
    ok: true,
    deleted_save_number: save_number,
    deleted_caption:     target.caption,
  };
}

// ── invite_to_circle executor (Step 5) ───────────────────────────────
// Calls the invite_circle_member Postgres function from migration 0016.
// Returns the invite link the bride can forward to the invitee via WhatsApp.
// Returns 'circle_member_limit_reached' error specifically when the cap is hit.

async function execInviteToCircle({ input, couple, supabase }) {
  const { invitee_name, role } = input || {};

  if (!invitee_name || typeof invitee_name !== 'string' || !invitee_name.trim()) {
    return { ok: false, error: 'invitee_name required' };
  }

  if (!['partner', 'family', 'inner_circle'].includes(role)) {
    return { ok: false, error: 'role must be partner, family, or inner_circle' };
  }

  const { data, error } = await supabase.rpc('invite_circle_member', {
    p_couple_id:    couple.id,
    p_invitee_name: invitee_name.trim(),
    p_role:         role,
  });

  if (error) {
    // Migration 0023 upgraded invite_circle_member() to raise structured exceptions
    // using ERRCODE = 'P0001' and HINT = '<machine_token>'. Match on code + hint,
    // not on message text (which is human-readable and may change).
    if (error.code === 'P0001' && error.hint === 'circle_member_limit_reached') {
      return {
        ok: false,
        error: 'circle_member_limit_reached',
        message: 'The bride has reached the 3-member circle cap. To add someone new, she needs to remove an existing circle member first.',
      };
    }
    console.error('[bride-tool:invite_to_circle] rpc error:', error);
    return { ok: false, error: error.message };
  }

  // RPC returns a single row (set-returning function returning one row)
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { ok: false, error: 'invite_circle_member returned no row' };
  }

  return {
    ok: true,
    member_id:    row.id,
    invite_token: row.invite_token,
    wa_me_link:   row.wa_me_link,
    invitee_name: invitee_name.trim(),
    role,
  };
}

// ── list_circle executor (Step 5) ────────────────────────────────────
// Returns the bride's circle members. Filter by status (default 'all').

async function execListCircle({ input, couple, supabase }) {
  const { status = 'all' } = input || {};

  let query = supabase
    .from('circle_members')
    .select('id, invitee_name, role, status, invited_at, joined_at')
    .eq('couple_id', couple.id)
    .order('invited_at', { ascending: false });

  if (status === 'active') {
    query = query.eq('status', 'active');
  } else if (status === 'pending') {
    query = query.eq('status', 'pending');
  }
  // 'all' → no filter

  const { data, error } = await query;

  if (error) {
    console.error('[bride-tool:list_circle] query error:', error);
    return { ok: false, error: error.message };
  }

  const members = (data || []).map(m => ({
    invitee_name: m.invitee_name,
    role:         m.role,
    status:       m.status,
    invited_at:   m.invited_at,
    joined_at:    m.joined_at,
  }));

  return {
    ok:    true,
    count: members.length,
    members,
  };
}

// ── Step 6: pre-turn circle session summary surfacing ─────────────
// Called from runBrideAgenticTurn before the agent's LLM call.
// Finds all of the bride's circle sessions that are:
//   - ended (last_activity_at < now - SESSION_IDLE_MS)
//   - unsummarized (summarized_to_bride = false)
// For each, composes a Haiku-generated summary, marks the session as
// summarized, and accumulates all summaries into a single SYSTEM NOTE
// preamble that gets prepended to dynamicContext.

async function surfacePendingCircleSessions({ couple_id, supabase, anthropic }) {
  const cutoffIso = new Date(Date.now() - SESSION_IDLE_MS).toISOString();

  // Issue 5 fix: log every invocation so Railway logs show whether this ran.
  console.log(`[bride-surface-circle] checking couple ${couple_id}, session idle cutoff: ${cutoffIso}`);

  const { data: sessions, error } = await supabase
    .from('circle_sessions')
    .select('id, circle_member_id, started_at, last_activity_at')
    .eq('couple_id', couple_id)
    .eq('summarized_to_bride', false)
    .lt('last_activity_at', cutoffIso)
    .order('last_activity_at', { ascending: true });

  if (error) {
    console.error('[bride-surface-circle] lookup error:', error);
    return null;
  }

  if (!sessions || sessions.length === 0) {
    // Issue 5 fix: was a silent return null — now logged so we can confirm in Railway.
    console.log(`[bride-surface-circle] 0 pending sessions found for couple ${couple_id}`);
    return null;
  }

  console.log(`[bride-surface-circle] ${sessions.length} pending session(s) for couple ${couple_id}`);

  const summaryLines = [];

  for (const session of sessions) {
    try {
      // M4 fix: optimistic update — attempt to claim this session for summarization
      // before doing any work. If another concurrent webhook already claimed it
      // (summarized_to_bride flipped to true), affected rows = 0 and we skip.
      const { data: claimResult, error: claimErr } = await supabase
        .from('circle_sessions')
        .update({
          summarized_to_bride: true,
          summarized_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .eq('summarized_to_bride', false)  // only succeeds if still unsummarized
        .select('id');

      if (claimErr) {
        console.error(`[bride-surface-circle] claim update failed for session ${session.id}:`, claimErr.message);
        continue;  // skip — don't summarize if we couldn't claim
      }

      if (!claimResult || claimResult.length === 0) {
        // Another concurrent webhook already claimed this session — skip.
        console.log(`[bride-surface-circle] session ${session.id} already claimed by concurrent request — skipping`);
        continue;
      }

      // We own this session. Summarize it.
      const summary = await summarizeOneSession({ session, supabase, anthropic });

      if (summary) {
        // Pre-persist the summary to messages before returning to the caller so
        // the text survives a Twilio send failure or a crash in the caller path.
        try {
          const { data: convRow } = await supabase
            .from('conversations')
            .select('id')
            .eq('couple_id', couple_id)
            .eq('kind', 'couple_self')
            .maybeSingle();

          if (convRow?.id) {
            const { data: msgRow, error: msgErr } = await supabase
              .from('messages')
              .insert({
                conversation_id: convRow.id,
                direction:       'outbound',
                channel:         'whatsapp',
                body:            summary,
                sent_by:         'agent',
              })
              .select('id')
              .single();

            if (msgErr) {
              console.error(`[bride-surface-circle] message pre-insert failed for session ${session.id}:`, msgErr.message);
            } else if (msgRow?.id) {
              await supabase
                .from('circle_sessions')
                .update({ summary_message_id: msgRow.id })
                .eq('id', session.id);
            }
          } else {
            console.error(`[bride-surface-circle] couple_self conversation not found for couple ${couple_id} — skipping message pre-insert`);
          }
        } catch (preInsertErr) {
          console.error(`[bride-surface-circle] message pre-insert threw for session ${session.id}:`, preInsertErr.message);
        }

        summaryLines.push(`${summary}\n[session_id: ${session.id}]`);
      } else {
        // H2 fix: summarize returned null (activity lookup failed or empty).
        // Session is already marked summarized_to_bride=true (from the optimistic
        // update above). Log that the bride won't see a summary for this session.
        console.warn(`[bride-surface-circle] session ${session.id} claimed but no summary produced — bride will not see it`);
      }
    } catch (err) {
      console.error(`[bride-surface-circle] error summarizing session ${session.id}:`, err.message);
      // Continue with other sessions; don't crash the bride's whole turn.
    }
  }

  if (summaryLines.length === 0) return null;

  return [
    '[SYSTEM NOTE — circle activity summary]',
    'One or more of the bride\'s circle members were active on her board since she was last here. Weave this into your reply naturally as a preamble before answering whatever the bride just said. Include the link "thedreamwedding.in/muse" and offer "or should I just send them here?" — if she says yes in her next message, you should call list_muse with the session_id (shown in the summary blocks) and request_image_playback=true.',
    '',
    ...summaryLines,
  ].join('\n');
}

// Compose a single session's summary by passing all its activity rows
// (saves + notes) to Haiku with a BFF-voice instruction.

async function summarizeOneSession({ session, supabase, anthropic }) {
  // Look up the member's name + role
  const { data: member } = await supabase
    .from('circle_members')
    .select('invitee_name, role')
    .eq('id', session.circle_member_id)
    .maybeSingle();

  const memberName = member?.invitee_name || 'A circle member';
  const memberRole = member?.role || 'family';

  // Pull all activity rows for this session in chronological order.
  const { data: activities, error } = await supabase
    .from('circle_activity')
    .select('activity_type, subject_type, subject_id, payload, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[bride-surface-circle] activity lookup error:', error);
    return null;
  }

  if (!activities || activities.length === 0) {
    return null;
  }

  // Build a structured digest to give Haiku. Group save-adds and notes separately.
  const saveAdds = activities.filter(a => a.activity_type === 'save_added');
  const notes    = activities.filter(a => a.activity_type === 'comment');

  // For save_added rows, look up the muse_save tags so the summary can reference them.
  const saveIds = saveAdds.map(a => a.subject_id).filter(Boolean);
  let saveLookup = {};
  if (saveIds.length > 0) {
    const { data: saves } = await supabase
      .from('muse_saves')
      .select('id, save_number, source_type, aesthetic_tags, caption')
      .in('id', saveIds);
    if (saves) {
      for (const s of saves) saveLookup[s.id] = s;
    }
  }

  const saveDescriptions = saveAdds.map(a => {
    const s = saveLookup[a.subject_id];
    if (!s) return '- a save (details unavailable)';
    const tagStr = Array.isArray(s.aesthetic_tags) && s.aesthetic_tags.length > 0
      ? ` [${s.aesthetic_tags.join(', ')}]`
      : '';
    const capStr = s.caption ? ` — "${s.caption}"` : '';
    return `- save #${s.save_number} (${s.source_type})${tagStr}${capStr}`;
  });

  const noteDescriptions = notes.map(n => {
    const content = n.payload?.content || '(empty note)';
    return `- said: "${content}"`;
  });

  const digestLines = [
    `Circle member: ${memberName} (${memberRole})`,
    `Session window: ${session.started_at} to ${session.last_activity_at}`,
    `Activity:`,
    ...saveDescriptions,
    ...noteDescriptions,
  ];
  const digest = digestLines.join('\n');

  const prompt = `${memberName} (a ${memberRole} circle member) just spent some time on the bride's wedding mood board. Here's exactly what they did:

${digest}

Write a 1-2 sentence summary FOR THE BRIDE in BFF voice — informal, friendly, natural. Mention ${memberName} by name. Capture the gist of what they added or said. Don't list every save individually unless there are very few. Don't add a closing question; the agent will add one after.

EXAMPLES of the voice:
- "Quick update — your mom just added 3 cream-and-gold decor shots and said she's leaning OTT for the mehndi."
- "Heads up — Priya pinned 2 elegant moody saves and mentioned wanting to discuss the photographer."
- "Mom just went through your board and added a candid intimate shot — said it reminded her of your engagement photos."

Reply with ONLY the summary sentence(s). No preamble, no closing, no quotes around it.`;

  try {
    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    }, { timeout: 8000 });

    const textBlocks = response.content.filter(b => b.type === 'text');
    const summary = textBlocks.map(b => b.text).join(' ').trim();

    if (summary) {
      console.log(`[bride-surface-circle] summarized session ${session.id} (${memberName}, ${saveAdds.length} saves, ${notes.length} notes)`);
      return summary;
    }
    return null;
  } catch (err) {
    console.error('[bride-surface-circle] haiku call failed, using fallback:', err.message);
    // Deterministic fallback if Haiku times out / errors
    const parts = [];
    if (saveAdds.length > 0) parts.push(`${saveAdds.length} save${saveAdds.length === 1 ? '' : 's'}`);
    if (notes.length > 0)    parts.push(`${notes.length} note${notes.length === 1 ? '' : 's'}`);
    const what = parts.length > 0 ? parts.join(' and ') : 'some activity';
    return `Quick update — ${memberName} just added ${what} to your board.`;
  }
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

module.exports = { runBrideAgenticTurn, executeBrideTool, surfacePendingCircleSessions };
