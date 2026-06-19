// ─────────────────────────────────────────────────────────────────────────────
// src/agent/managerLoop.js
// runManagerTurn — the SINGLE-AGENT manager loop (Manager mode).
//
// The merge: in Manager mode the owner talks straight to her. She holds the hands
// herself — no dispatch, no second agent, no operator hidden in the hood. Her soul
// is kriyaManagerSoul (Kriya's discipline + hands, owner-facing); the owner does the
// thinking, she does the books. This is the cheap, everyday default.
//
// It REUSES the existing hands verbatim (kriyaPrimitives / kriyaRead / kriyaCalendar)
// and the owner-facing plumbing patterns from myraLoop (session history, streaming,
// clock, cost). It does NOT touch myraLoop.js or kriyaTurn.js — the two-agent loop
// stays intact for Advisory mode.
//
// Contract matches runMyraTurn so chat.js swaps cleanly:
//   in:  { vendor, user, conversation, inboundMessage, supabase, anthropic, onEvent }
//   out: { reply, clarify, toolCalls, refresh, iterations, model, ... usage }
'use strict';

const { MODEL_HAIKU, calculateCost } = require('./models');
const { kriyaManagerSoul } = require('./kriyaSoul');
const { KRIYA_TOOLS, executeKriyaTool } = require('./kriyaPrimitives');
const { KRIYA_READ_TOOLS, KRIYA_READ_NAMES, executeKriyaRead } = require('./kriyaRead');
const { KRIYA_CALENDAR_TOOLS, KRIYA_CALENDAR_NAMES, executeKriyaCalendar } = require('./kriyaCalendar');

// Single source of truth for "what day is it" — weekday, human date, and ISO, so she
// can resolve years AND count days. Ported from myraLoop (dreamai today.ts, 364f854).
function todayLine(timezone) {
  const tz = (timezone && timezone.trim()) ? timezone : 'Asia/Kolkata';
  const now = new Date();
  let human, iso;
  try {
    human = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz }).format(now);
    iso = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(now);
  } catch {
    human = now.toUTCString(); iso = now.toISOString().slice(0, 10);
  }
  return `Today is ${human} (${iso}).`;
}

const SESSION_IDLE_MS = 15 * 60 * 1000;
const HISTORY_LIMIT = 20;
const MAX_ITERATIONS = 12;

// Her whole bench — the binder write hands, the read hands, the calendar hands. She
// holds them directly; there is no dear_kriya_talk / listen_myra_talk (no one to hand
// to). Cache the bench: cache_control on the LAST tool caches every definition before
// it; the bench is identical every call — a pure cache win.
const MANAGER_BENCH_RAW = [...KRIYA_TOOLS, ...KRIYA_READ_TOOLS, ...KRIYA_CALENDAR_TOOLS];
const MANAGER_BENCH = MANAGER_BENCH_RAW.map((t, i) =>
  i === MANAGER_BENCH_RAW.length - 1 ? { ...t, cache_control: { type: 'ephemeral' } } : t
);

// In-turn discipline (ported from kriyaTurn): an attribute atom with no binder_id lands
// on the binder she is working this turn; a calendar edit with no event_id lands on the
// event in hand — so multi-step work files to the right place without a re-search.
const ATTRIBUTE_ATOMS = new Set([
  'kriya_money', 'kriya_date', 'kriya_note', 'kriya_note_append',
  'kriya_phone', 'kriya_doc', 'kriya_stage', 'kriya_reasonforaction_append',
]);
const CALENDAR_EDIT_ATOMS = new Set(['kriya_calendar_edit', 'kriya_calendar_cancel']);

async function runManagerTurn({ vendor, user, conversation, inboundMessage, supabase, anthropic, onEvent }) {
  // ── Wake-up: session-bounded history (ported from myraLoop) ────────────
  const sessionCutoff = new Date(Date.now() - SESSION_IDLE_MS).toISOString();
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .gte('created_at', sessionCutoff)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  const history = (recentMessages || [])
    .reverse()
    .filter((m) => m.body !== inboundMessage || m.direction !== 'inbound')
    .filter((m) => m.body && m.body.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.direction === 'inbound' ? 'user' : 'assistant', content: m.body || '' }))
    .reduce((acc, msg) => {
      if (acc.length === 0) return [msg];
      if (acc[acc.length - 1].role === msg.role) return acc;
      return [...acc, msg];
    }, []);

  const messages = [...history, { role: 'user', content: inboundMessage }];

  // assistant_name not yet a column (later piece) → builder falls back to "Kriya",
  // which is safe by the soul's own name structure (internal name vs owner-facing name).
  const assistantName = (vendor && vendor.assistant_name) || undefined;
  const istToday = todayLine('Asia/Kolkata');

  // System assembled as a faithful port of kriyaTurn (the proven operator loop): the
  // soul + the [How you work] operational bridge ride in one CACHED block; the clock is
  // volatile so it sits in its own UNCACHED block. Only two things differ from kriyaTurn:
  // the bridge addresses the OWNER (not Myra), and she speaks back in her own words
  // (no listen_myra_talk — there is no one to hand to).
  const clock = `\n\n[${istToday}] EVERY date you write — a binder date, a follow-up, a calendar shoot, a block — resolves against it. A bare month/day with no year means the NEXT occurrence from today (a "12 Dec" with today in June means this year; if that day has already passed this year, the next year). A wedding, shoot, or booking is always in the future — never write a date in the past. Never guess a past year.`;
  const stable = kriyaManagerSoul(assistantName) +
    "\n\n[How you work] The owner hands you one thing at a time in plain English. You do it against the binders with your hands (the kriya_ tools — file, correct, find, tally, open a history), checking the cabinet before you write so you never file a duplicate, and you speak back to the owner in your own words: the one true line of what you did, or the one thing you genuinely need settled (which client, which binder). Say your piece and stop.";
  const system = [
    { type: 'text', text: stable, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: clock.trim() },
  ];

  const toolCalls = [];
  let anyMutation = false;
  let finalReply = null;
  let iterations = 0;
  let currentBinderId = null;
  let currentEventId = null;
  let inTok = 0, outTok = 0, cacheRead = 0, cacheWrite = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;

    // Stream every iteration. On a tool-only turn no text deltas fire (she's working);
    // on her composing turn her prose streams token by token as manager_token.
    const stream = anthropic.messages.stream({
      model: MODEL_HAIKU,
      max_tokens: 1024,
      system,
      tools: MANAGER_BENCH,
      messages,
    });
    if (onEvent) stream.on('text', (delta) => onEvent({ type: 'manager_token', text: delta }));
    const resp = await stream.finalMessage();
    if (resp.usage) {
      inTok += resp.usage.input_tokens || 0;
      outTok += resp.usage.output_tokens || 0;
      cacheRead += resp.usage.cache_read_input_tokens || 0;
      cacheWrite += resp.usage.cache_creation_input_tokens || 0;
    }

    const toolUse = resp.content.filter((b) => b.type === 'tool_use');
    const textBlocks = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim();

    if (toolUse.length === 0) {
      finalReply = textBlocks || 'Done.';
      break;
    }

    messages.push({ role: 'assistant', content: resp.content });
    const results = [];

    for (const tu of toolUse) {
      const input = tu.input || {};
      // Open-binder / open-event default.
      if (ATTRIBUTE_ATOMS.has(tu.name) && (input.binder_id == null || input.binder_id === '') && currentBinderId) {
        input.binder_id = currentBinderId;
      }
      if (CALENDAR_EDIT_ATOMS.has(tu.name) && (input.event_id == null || input.event_id === '') && currentEventId) {
        input.event_id = currentEventId;
      }
      let outcome;
      if (KRIYA_CALENDAR_NAMES.has(tu.name)) {
        outcome = await executeKriyaCalendar(supabase, vendor.id, tu.name, input);
      } else if (KRIYA_READ_NAMES.has(tu.name)) {
        outcome = await executeKriyaRead(supabase, vendor.id, tu.name, input, istToday);
      } else {
        outcome = await executeKriyaTool(supabase, vendor.id, tu.name, input);
      }
      // Whatever she just wrote becomes the open binder/event for the rest of the turn.
      if (outcome.binder_id) currentBinderId = outcome.binder_id;
      if (outcome.event_id) currentEventId = outcome.event_id;
      // Refresh from the GROUND-TRUTH mutation flag the hand returns — never a prose
      // regex. Calendar adds/edits/cancels and merges/splits set mutated:true, so they
      // now refresh the screen correctly (the old myraLoop regex missed them — B2).
      if (outcome.mutated) anyMutation = true;
      toolCalls.push({ name: tu.name, input, result: outcome.display });
      // Live beat: her own hand firing. Same wire shape the frontend already renders
      // (the muted working spine); it is HER working, not a hidden operator's.
      if (onEvent) onEvent({ type: 'manager_action', name: tu.name, input, result: outcome.display, summary: outcome.summary });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.display });
    }
    messages.push({ role: 'user', content: results });
  }

  if (!finalReply) finalReply = 'Let me come back to you on that.';

  const cost = calculateCost(MODEL_HAIKU, inTok, outTok, cacheRead, cacheWrite) || { cost_usd: null, cost_inr: null };

  if (onEvent) onEvent({ type: 'answer', reply: finalReply });

  return {
    reply: finalReply,
    clarify: null,
    toolCalls,
    refresh: anyMutation,
    iterations,
    model: MODEL_HAIKU,
    inputTokens: inTok,
    outputTokens: outTok,
    costUsd: cost.cost_usd,
    costInr: cost.cost_inr,
    cacheRead,
    cacheWrite,
  };
}

module.exports = { runManagerTurn };
