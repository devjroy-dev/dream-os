// ─────────────────────────────────────────────────────────────────────────────
// src/agent/kriyaTurn.js
// Kriya's sub-loop — runKriyaTurn. JS port of dreamai's donna.ts (the operator
// turn), adapted to dream-os: vendor_id keying, the 1a binder hands, Haiku.
//
// Myra hands Kriya a plain-English instruction (via dear_kriya_talk). Kriya has
// all the hands (kriya_* write + read) plus listen_myra_talk — her ONE voice
// back to Myra. She does silent work (filing, searching) the owner never sees,
// then speaks one clean line to Myra, OR asks Myra exactly what she needs to
// finish — which suspends her session so Myra's next dear_kriya_talk RESUMES the
// same conversation (KriyaSession).
'use strict';

const { MODEL_HAIKU } = require('./models');
const { KRIYA_SOUL } = require('./kriyaSoul');
const { KRIYA_TOOLS, executeKriyaTool } = require('./kriyaPrimitives');
const { KRIYA_READ_TOOLS, KRIYA_READ_NAMES, executeKriyaRead } = require('./kriyaRead');

const LISTEN_MYRA_TALK_TOOL = {
  name: 'listen_myra_talk',
  description:
    "Speak to Myra. Use this to hand her what you found in one or two plain lines, or to ask her exactly what you need to finish — which client she means, which binder, anything unresolved — and her answer comes back as her next message. This is your voice to her and the only way your words reach her; everything else you do (filing, searching) is silent work she doesn't see. Say your piece and stop; she is impatient and reads a single clean line fastest.",
  input_schema: { type: 'object', properties: { message: { type: 'string', description: 'What you say to Myra — your finding, or the precise thing you need.' } }, required: ['message'] },
};

const KRIYA_BENCH = [...KRIYA_TOOLS, ...KRIYA_READ_TOOLS, LISTEN_MYRA_TALK_TOOL];
const KRIYA_WORK_ITERS = 8;

// Run one Kriya turn. Returns { reply, session, tool_calls }.
//   reply   — what she said to Myra (her listen_myra_talk message), or a summary
//   session — present only if she ENDED by asking (listen_myra_talk alone). Myra's
//             next dear_kriya_talk resumes from here.
async function runKriyaTurn(anthropic, supabase, vendorId, myraMessage, prior, onEvent) {
  const system = KRIYA_SOUL +
    "\n\n[How you work] Myra hands you one thing at a time in plain English. You do it against the binders with your hands (the kriya_ tools — file, correct, find, tally, open a history), checking the cabinet before you write so you never file a duplicate, and you speak back to her with listen_myra_talk: hand her your finding in one clean line, or ask her the one thing you need (which client, which binder) and her answer comes back as her next message. Say your piece and stop.";

  let messages;
  if (prior && prior.messages) {
    // She had asked; Myra's reply is the answer to her pending listen_myra_talk.
    messages = prior.messages.concat([
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: prior.pendingToolUseId, content: `Myra: ${myraMessage}` }] },
    ]);
  } else {
    messages = [{ role: 'user', content: `Myra: ${myraMessage}` }];
  }

  const toolCalls = [];
  let spoken = null;

  for (let i = 0; i < KRIYA_WORK_ITERS; i++) {
    const resp = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 1024,
      system,
      tools: KRIYA_BENCH,
      messages,
    });

    const toolUse = resp.content.filter((b) => b.type === 'tool_use');
    if (toolUse.length === 0) {
      // She answered in plain text (no channel call) — treat as her word to Myra.
      const txt = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim();
      spoken = txt || '(done)';
      break;
    }

    messages.push({ role: 'assistant', content: resp.content });

    const listen = toolUse.find((t) => t.name === 'listen_myra_talk');
    const work = toolUse.filter((t) => t.name !== 'listen_myra_talk');
    const results = [];

    for (const tu of work) {
      let outcome;
      if (KRIYA_READ_NAMES.has(tu.name)) {
        outcome = await executeKriyaRead(supabase, vendorId, tu.name, tu.input || {});
      } else {
        outcome = await executeKriyaTool(supabase, vendorId, tu.name, tu.input || {});
      }
      toolCalls.push({ name: tu.name, input: tu.input, result: outcome.display });
      // Live beat: this hand, the moment it fired.
      if (onEvent) onEvent({ type: 'kriya_action', name: tu.name, input: tu.input, result: outcome.display });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.display });
    }

    if (listen) {
      const message = (listen.input && listen.input.message) || '';
      toolCalls.push({ name: 'listen_myra_talk', input: listen.input, result: '(spoken to Myra)' });
      // Live beat: Kriya's word back to Myra, the moment she says it.
      if (onEvent) onEvent({ type: 'kriya_report', message });
      if (work.length === 0) {
        // She spoke/asked ALONE — this ends her turn. If it reads as a question,
        // suspend so Myra's next message resumes her; either way, deliver to Myra.
        return {
          reply: message,
          session: { messages, pendingToolUseId: listen.id },
          tool_calls: toolCalls,
        };
      }
      // listen mixed with work: resolve the listen tool_result too, then continue.
      results.push({ type: 'tool_result', tool_use_id: listen.id, content: 'Delivered to Myra.' });
      spoken = message;
    }

    messages.push({ role: 'user', content: results });

    if (spoken && !listen) break;
    if (spoken && listen && work.length) {
      // she both worked and spoke — her word stands as the turn's reply
      return { reply: spoken, session: null, tool_calls: toolCalls };
    }
  }

  return { reply: spoken || '(no reply)', session: null, tool_calls: toolCalls };
}

module.exports = { runKriyaTurn, LISTEN_MYRA_TALK_TOOL };
