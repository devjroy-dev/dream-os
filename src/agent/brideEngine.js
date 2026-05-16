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
// B2: added mediaContext parameter for image auto-save context injection,
// list_muse + delete_muse_save executors, and mediaUrls return for image
// playback ("show me save 47" sends the actual image back).

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

    case 'list_muse': {
      return await execListMuse({ input, couple, supabase, mediaUrlsToReturn });
    }

    case 'delete_muse_save': {
      return await execDeleteMuseSave({ input, couple, user, supabase });
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

// ── list_muse executor (B2) ──────────────────────────────────────────
// Queries muse_saves with structured filters. Optionally pushes Cloudinary
// URLs into mediaUrlsToReturn for outbound image playback.
//
// Supports four filters from the agent: save_number (single lookup), limit
// (pagination), aesthetic_tags (taxonomy match), saved_by (bride vs circle).
// Plus request_image_playback flag.
//
// Note on aesthetic_tags filter: uses the jsonb 'overlaps' operator (?| in
// SQL, .overlaps() / .contains() in Supabase) so a save with ANY of the
// requested tags matches — not all. Bride asking "show me ethnic" should
// match saves tagged ["ethnic","grand"] AND saves tagged ["ethnic"] alone.

async function execListMuse({ input, couple, supabase, mediaUrlsToReturn }) {
  const {
    save_number,
    limit = LIST_MUSE_DEFAULT_LIMIT,
    aesthetic_tags,
    saved_by,
    request_image_playback = false,
  } = input || {};

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

  // aesthetic_tags overlap: jsonb array contains ANY of the filter values
  if (Array.isArray(aesthetic_tags) && aesthetic_tags.length > 0) {
    // Postgres jsonb '?|' operator: any element in the array exists as a top-level key/element
    // Supabase: .overlaps() works on Postgres array columns and on jsonb arrays via the ?| pattern
    query = query.overlaps('aesthetic_tags', aesthetic_tags);
  }

  // Apply limit + ordering (newest first), unless looking up a single save
  if (typeof save_number !== 'number') {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || LIST_MUSE_DEFAULT_LIMIT, 1), LIST_MUSE_MAX_LIMIT);
    query = query.order('save_number', { ascending: false }).limit(safeLimit);
  }

  const { data: saves, error } = await query;

  if (error) {
    console.error('[bride-tool:list_muse] query error:', error);
    return { ok: false, error: error.message };
  }

  // If playback requested, queue up the Cloudinary URLs for the engine to
  // return to brideIndex. Capped at PLAYBACK_MAX_IMAGES via final slice in
  // runBrideAgenticTurn.
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
    image_playback_queued: request_image_playback && Array.isArray(mediaUrlsToReturn) ? mediaUrlsToReturn.length : 0,
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
  // told about it later if a circle member removed their own save).
  await supabase.from('circle_activity').insert({
    couple_id:     couple.id,
    actor_user_id: speakerUserId ?? null,
    actor_name:    speakerIsTheBride ? 'You' : 'Circle member',
    actor_role:    speakerIsTheBride ? 'bride' : 'circle_member',
    activity_type: 'removed',
    subject_type:  'muse_save',
    subject_id:    target.id,
    payload:       { save_number, caption: target.caption },
  });

  return {
    ok: true,
    deleted_save_number: save_number,
    deleted_caption:     target.caption,
  };
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
