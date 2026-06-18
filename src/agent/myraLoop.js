// ─────────────────────────────────────────────────────────────────────────────
// src/agent/myraLoop.js
// runMyraTurn — the dual-soul loop. JS port of dreamai loop.ts, adapted to dream-os.
//
// Myra (judgment, Haiku) holds NO DB tools — her ONE operational lever is
// dear_kriya_talk. Her loop: model call → if she calls dear_kriya_talk, run Kriya's
// sub-turn (runKriyaTurn), feed Kriya's reply back as the tool_result, continue;
// her final text block is the reply to the owner. Kriya can ASK (suspends her
// session); Myra's next dear_kriya_talk resumes the same Kriya conversation.
//
// Contract matches the old pwaEngine so chat.js swaps cleanly:
//   in:  { vendor, user, conversation, inboundMessage, supabase, anthropic }
//   out: { reply, clarify, toolCalls, refresh, iterations, model }
//
// 1b: VENDOR-ROOM MODE, binder-only, Haiku both. No old-ledger snapshot.
'use strict';

const { MODEL_HAIKU, calculateCost } = require('./models');
const { myraSoul } = require('./myraSoul');
const { runKriyaTurn } = require('./kriyaTurn');

const SESSION_IDLE_MS = 15 * 60 * 1000;
const HISTORY_LIMIT = 20;
const MAX_ITERATIONS = 12;

const DEAR_KRIYA_TALK_TOOL = {
  name: 'dear_kriya_talk',
  description:
    "Talk to your operator in plain English. Hand them something to do against the books — log or update a lead, record the true state of something, look a record up, total a slice — or answer a question they just asked you. They do the doing; you do the thinking. They may come back with what they found, or with a question they need answered to finish (which client, which binder) — when they do, call this again with your answer and they pick up where they left off. Keep going until you have what you need, then speak to the owner. Hand them ONE clear thing at a time; the simpler and more direct your line, the truer their work. When you tell them to record something, state its truth-status: the owner's OWN action about themselves is confirmed; anything relayed about a third party is unverified until confirmed; money you keep careful — affirmed is not proven. You never treat silence as confirmation. Use this only when something must actually be done or looked up — never on a pure-advice turn.",
  input_schema: { type: 'object', properties: { message: { type: 'string', description: "Your plain-English message to your operator — an instruction, or your answer to what they just asked." } }, required: ['message'] },
};

async function runMyraTurn({ vendor, user, conversation, inboundMessage, supabase, anthropic, onEvent }) {
  // ── Wake-up: session-bounded history (mirrors pwaEngine) ───────────────
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

  // assistant_name not yet a column (later piece) → default Myra.
  const assistantName = (vendor && vendor.assistant_name) || 'Myra';
  const istToday = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
  // System as cache-friendly blocks: the soul is stable (cached, re-read at ~10%
  // input price on repeat calls within the cache window); the dated line is
  // volatile so it sits in its own UNCACHED block — otherwise the daily date
  // change would bust the cache every day.
  const system = [
    { type: 'text', text: myraSoul(assistantName), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `[Today is ${istToday}. You are speaking with the owner of this business inside their app.]` },
  ];

  const toolCalls = [];
  let kriyaSession = null;      // persists across dear_kriya_talk calls in THIS turn
  let anyMutation = false;
  let finalReply = null;
  let iterations = 0;
  let inTok = 0, outTok = 0;  // whole-turn token usage (Myra's streams + Kriya's sub-turns)

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;

    // Stream EVERY Myra iteration. On a turn where she only calls a tool, no
    // text deltas fire; on her composing turn, her prose streams token-by-token
    // as myra_token. (Same pattern as dreamai loop.ts.)
    const stream = anthropic.messages.stream({
      model: MODEL_HAIKU,
      max_tokens: 1024,
      system,
      tools: [DEAR_KRIYA_TALK_TOOL],
      messages,
    });
    if (onEvent) stream.on('text', (delta) => onEvent({ type: 'myra_token', text: delta }));
    const resp = await stream.finalMessage();
    if (resp.usage) { inTok += resp.usage.input_tokens || 0; outTok += resp.usage.output_tokens || 0; }

    const toolUse = resp.content.filter((b) => b.type === 'tool_use');
    const textBlocks = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim();

    if (toolUse.length === 0) {
      finalReply = textBlocks || 'Done.';
      break;
    }

    messages.push({ role: 'assistant', content: resp.content });
    const results = [];

    for (const tu of toolUse) {
      if (tu.name === 'dear_kriya_talk') {
        const msg = (tu.input && tu.input.message) || '';
        // Live beat: Myra hands off to her operator, her words, the moment she says them.
        if (onEvent) onEvent({ type: 'dispatch', message: msg });
        const kriya = await runKriyaTurn(anthropic, supabase, vendor.id, msg, kriyaSession, onEvent, istToday);
        if (kriya.usage) { inTok += kriya.usage.input_tokens || 0; outTok += kriya.usage.output_tokens || 0; }
        kriyaSession = kriya.session || null;   // resume if she asked; else clear
        for (const dc of kriya.tool_calls) {
          toolCalls.push(dc);
          if (dc.result && /created|Updated|archived|back in the live|corrected|replaced/.test(dc.result)) anyMutation = true;
        }
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: `Kriya: ${kriya.reply}` });
      } else {
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: `Unknown tool ${tu.name}.` });
      }
    }
    messages.push({ role: 'user', content: results });
  }

  if (!finalReply) finalReply = 'Let me come back to you on that.';

  const cost = calculateCost(MODEL_HAIKU, inTok, outTok) || { cost_usd: null, cost_inr: null };

  // The answer beat — the assembled final reply, for the surface to reconcile.
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
  };
}

module.exports = { runMyraTurn, DEAR_KRIYA_TALK_TOOL };
