'use strict';
// src/lib/vendor/draftSeat.js  THE DOOR'S DRAFT COMPOSER. CE-45 LC-Victor P6b, the first cut (seat LCV-11).
//
// WHAT IT IS. When she asks the door to message a client ("Tell Priya we're free on the 22nd"), a MODEL writes the
// words for her (R-44.9, the founder: "a code cant do the job intended for an agent writing and improving the reply"),
// she reads them VERBATIM in the founder's frame (B37) and they go on her YES through the relay seat's existing send
// leg (relaySeat.sendApprovedDraft). Nothing here reaches a bride: the body is stored first (coupleDrafts.stage, the
// store's one writer), shown from the ROW, and sent from the ROW.
//
// WHICH MODEL (R-45.1, the founder, 22 September 2026: "let the message be drafted whichever tier or model the listener
// is on"): the SAME seat listenerDoor.listenerSeat(route) returns for this turn, read from the route the door already
// holds. No separate composer setting, no operator lookup. F-44.120 closes here: before this cut the seat's composeBody
// called runDonnaTurn with no transport, so Donna wrote on native Haiku whatever the admin row said.
//
// ONE TOOL, NO HANDS (F-44.121's cure; the chair's ruling on fork (h)): the model is called through src/lib/llm.js
// llmCreate with exactly one tool, draft_message, whose only field is the message. runDonnaTurn is NEVER called on a
// relay turn, so no estate hand can execute inside a compose. W-1: no engine export is read at all.
//
// VERBATIM FIRST (the seat's own fork, unchanged): when she gave the words herself in quotes, HER bytes are the body and
// no model touches them (relaySeat.verbatimBody, the seat's export).
//
// TOTAL: composeDraft never throws; a failed compose is null and the caller speaks nothing minted for it.

const { llmCreate } = require('../llm');
const drafts = require('./coupleDrafts');

const COMPOSE_TIMEOUT_MS = 15000;

// The composer's prompt is a seat's prose (no vendor or bride reads it); the WORDS she reads are the model's, shown verbatim.
const SYSTEM = [
  'You write one short WhatsApp message from a wedding vendor to her client, in the vendor\'s own voice, from the',
  'instruction she gives her assistant. Write only what she asked to be said, plainly and warmly, in the language she',
  'used, addressed to the client by name where natural. Never invent a date, an amount, a package or a fact she did not',
  'give; if she said a date or a figure, keep it exactly as she said it. No greeting from an assistant, no sign-off from',
  'an assistant, no explanation: the message alone, ready to send, at most four sentences.',
].join(' ');

const DRAFT_TOOL = {
  name: 'draft_message',
  description: 'The finished message, exactly as it should reach the client.',
  input_schema: {
    type: 'object',
    properties: { message: { type: 'string', description: 'The message to the client, ready to send.' } },
    required: ['message'],
  },
};

function withTimeout(p, ms) {
  let t;
  return Promise.race([p, new Promise((_r, rej) => { t = setTimeout(() => rej(new Error(`composer timed out after ${ms} ms`)), ms); })])
    .finally(() => clearTimeout(t));
}

// The seat this turn's composer runs on: the listener's, exactly (R-45.1). null when the route names none.
function composerSeat(route, listener) {
  try {
    const L = listener || require('./listenerDoor');
    const s = L.listenerSeat(route);
    return (s && typeof s.provider === 'string' && s.provider && typeof s.model === 'string' && s.model) ? { provider: s.provider, model: s.model } : null;
  } catch (_e) { return null; }
}

// Compose the body for her instruction to `client`, from `vendorName` (the vendors row's business_name, exactly as the row holds it; c-45's
// r2 ruling). Returns { body, seat } or null. `deps`: { llmCreate, listener, timeoutMs } for the bench.
// CE-45 ELZ-1 cut 2b (quote_send; F2): the quote's facts, handed to the writer as facts it must state exactly and may not change.
// The door checks they appear verbatim (workingDoor composeChecked). Empty for a relay without facts.
function factsText(facts) {
  if (!facts || typeof facts !== 'object') return '';
  const lines = [];
  if (facts.package) lines.push(`package: ${facts.package}`);
  if (facts.total) lines.push(`total: ${facts.total}`);
  if (facts.delivery) lines.push(`delivery date: ${facts.delivery}`);
  return lines.length ? `This is a QUOTE. State these facts exactly as written, never changed or rounded:\n${lines.join('\n')}\n` : '';
}

async function composeDraft({ route, message, client, vendorName, facts = null }, deps = {}) {
  try {
    const seat = composerSeat(route, deps.listener);
    if (!seat) return null;
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) return null;
    // VERBATIM: her own quoted words are the body; no model is called.
    let verbatim = null;
    try { verbatim = require('./relaySeat').verbatimBody(text); } catch (_e) { verbatim = null; }
    if (verbatim && !facts) return { body: verbatim, seat, verbatim: true }; // cut 2b: a quote is always composed around its facts
    const create = deps.llmCreate || llmCreate;
    const name = typeof client === 'string' && client.trim() ? client.trim() : null;
    const vendor = typeof vendorName === 'string' && vendorName.trim() ? vendorName.trim() : null;
    const resp = await withTimeout(create(seat.provider, {
      model: seat.model,
      max_tokens: 400,
      system: SYSTEM,
      tools: [DRAFT_TOOL],
      tool_choice: { type: 'tool', name: DRAFT_TOOL.name },
      messages: [{ role: 'user', content: `${vendor ? `The vendor's business: ${vendor}\n` : ''}${name ? `The client's name: ${name}\n` : ''}${factsText(facts)}Her instruction: ${text}` }],
    }), Number.isFinite(deps.timeoutMs) ? deps.timeoutMs : COMPOSE_TIMEOUT_MS);
    const call = ((resp && resp.content) || []).find((b) => b && b.type === 'tool_use' && b.name === DRAFT_TOOL.name);
    const body = call && call.input && typeof call.input.message === 'string' ? call.input.message.trim() : '';
    if (!body) return null;
    return { body, seat, verbatim: false, usage: (resp && resp.usage) || null };
  } catch (e) {
    try { console.warn('[draftSeat] compose failed:', e && e.message); } catch (_e) { /* */ }
    return null;
  }
}

// Stage the body for (vendor, phone) through the store's ONE writer and read the row back. Returns the row or null.
async function stageDraft(supabase, { vendorId, phone, body }) {
  try {
    const staged = await drafts.stage(supabase, { vendorId, conversationId: null, couplePhone: phone, body });
    return staged && staged.ok && staged.draft ? staged.draft : null;
  } catch (e) {
    try { console.warn('[draftSeat] stage failed:', e && e.message); } catch (_e) { /* */ }
    return null;
  }
}

module.exports = { composeDraft, stageDraft, composerSeat, SYSTEM, DRAFT_TOOL, COMPOSE_TIMEOUT_MS };
