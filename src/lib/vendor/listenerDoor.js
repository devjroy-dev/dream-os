'use strict';
// src/lib/vendor/listenerDoor.js  THE SILENT LISTENER. CE-44 LC-Victor P2. ONE MODULE, BOTH LANES
// (C-43.1): src/api/vendor-engine/chat.js (the TDW chat's working room, both routes) and
// src/lib/vendorInbound.js (the WhatsApp vendor lane) call recordListening() and nothing else.
//
// THE RULINGS. R-44.14 and R-44.15: one listener per vendor message, and it has NO HANDS; it hears
// her sentence with the recent thread and returns a structured request through a tool schema, and
// is never asked to reply. R-44.17: NO advice classification exists anywhere; the request carries
// tasks and lookups only. R-44.18: at P5 only the door speaks in the working rooms. F-44.38 (dates
// as spoken; no model does date arithmetic), F-44.39 (the thread is handed to it), F-44.40 (an
// amount is at least 1, and absent where no figure was spoken).
//
// P2 IS SILENT. It changes NOTHING the vendor reads. recordListening() is called only AFTER the
// wire closes (the reply sent and stored), fire-and-forget, as fireHarvest already is; it is
// bounded at 15 seconds; it never throws. Its only writes are the listener's request merged into
// the `meta` of the row runTurn already named (TurnResult.assistant_message_id) and ONE usage row
// with conversation_id NULL: today's chain row always counts the turn (chat.js:3295 to :3303 counts
// rows with a non-null conversation_id), so the turn is counted once.
//
// WHY AFTER THE WIRE, NOT IN PARALLEL (the chair's record): getOrCreateConversation CREATES a
// conversation when none is active (memory.ts:35 to :82), so a parallel call could race runTurn
// into a split thread; heard afterwards, the listener reads the thread from result.conversation_id
// up to but EXCLUDING the current exchange, and never touches a conversation.
//
// W-1: NONE. No engine source is read or changed; this module reads engine.messages and writes
// engine.messages.meta through the door's own supabase client, and meters through harvest's own
// usage writer (src/agent/harvest.js _meter), so the estate keeps exactly two usage-write homes.

const { llmCreate } = require('../llm');

const LISTEN_TIMEOUT_MS = 15000;
const THREAD_ROWS = 8;
const THREAD_CHARS = 400;

const SYSTEM = [
  'You read one new message from a wedding vendor to her business assistant, with the recent',
  'conversation for context, and record every task and lookup she is asking for with the',
  'ear_request tool. You never reply to her and you never do the work; you only record the request.',
  'Record each client exactly as she said it, each date exactly as she said it, and an amount only',
  'if she said a figure. If the message asks for no task and no lookup, use route none and no acts.',
  // F-44.110 (CE-44 LCV-10 Part A; the sentence accepted by the chair as worded). WITNESSED on Part One's walk, turn 8: a
  // wedding date said with a new lead was heard a second time as book_event. It is the listener's prompt byte, not a
  // founder byte, and PROSE IS NOT A MECHANISM: workingDoor.withoutEchoedEvents is the mechanism; b94 pins both.
  'A wedding date said with a new lead belongs to that lead: put it in the lead\'s date and record no book_event for it.',
].join(' ');

const EAR_TOOL = {
  name: 'ear_request',
  description: 'Record every task and lookup the vendor is asking for. Do not answer her. Do not resolve names to records. Do not compute dates.',
  input_schema: {
    type: 'object',
    properties: {
      route: { type: 'string', enum: ['task', 'search', 'none'] },
      acts: {
        type: 'array',
        description: 'Every task or lookup the message asks for, in the order she said them. Empty if none.',
        items: {
          type: 'object',
          properties: {
            act: { type: 'string', description: 'lead, booking_confirmed, advance_paid, milestone_paid, attach_package, invoice, date, book_event, block_date, unblock_date, edit_event, cancel_event, assign_crew, note, relay, quote_send, find, whatsdue, history, tally' },
            // F-44.100 (CE-44 LCV-8): the listener put "haldi shoot" here and the door filed a lead of that name. The
            // description now says what a client IS. It is the listener's prompt byte, not a founder byte; b92 pins it.
            client_as_spoken: { type: 'string', description: 'The NAME of a person, a couple or a family, exactly as she said it. A kind of event or shoot (haldi, mehendi, sangeet, wedding, reception, engagement, a shoot) is NEVER a client. When she is answering the assistant\'s question about who the lead is, her answer IS the name, whatever the word. When no name was said it is EMPTY.' },
            // P6a-2 (the chair's ruling on c-44.44): the package she named, so the door has a name to resolve. OPTIONAL.
            package_as_spoken: { type: 'string', description: 'The package exactly as she named it. Empty if none.' },
            amount_rupees: { type: 'integer', minimum: 1, description: 'Whole rupees, only if she said a figure. Omit otherwise.' },
            date_as_spoken: { type: 'string', description: 'The date in her own words, returned verbatim and never converted. A word that places the day relative to now IS a date: "today", "yesterday", "this morning", "last Friday" are dates, exactly like "5th December". When she says when money came in, however she says it, put those words here. Empty only if she gave no date at all.' },
            milestone: { type: 'string', description: 'The payment as she named it. Empty if none.' },
            missing: { type: 'array', items: { type: 'string' } },
          },
          required: ['act'],
        },
      },
    },
    required: ['route', 'acts'],
  },
};

// The listener's seat on this turn's already-resolved route. Unset, it follows the primary, as
// Donna does (modelRouter.js parseRoute / guardKeys).
function listenerSeat(route) {
  const r = route || {};
  if (r.listener_provider && r.listener_model) return { provider: r.listener_provider, model: r.listener_model, split: true };
  return { provider: r.provider, model: r.model, split: false };
}

// The schema's own shape, enforced: anything malformed is dropped; an amount below 1 is ABSENT.
function normaliseRequest(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const route = ['task', 'search', 'none'].includes(raw.route) ? raw.route : null;
  if (!route) return null;
  const acts = (Array.isArray(raw.acts) ? raw.acts : []).filter((a) => a && typeof a === 'object' && typeof a.act === 'string' && a.act.trim())
    .map((a) => {
      const out = { act: a.act.trim() };
      if (typeof a.client_as_spoken === 'string' && a.client_as_spoken.trim()) out.client_as_spoken = a.client_as_spoken.trim();
      if (typeof a.package_as_spoken === 'string' && a.package_as_spoken.trim()) out.package_as_spoken = a.package_as_spoken.trim();
      if (Number.isInteger(a.amount_rupees) && a.amount_rupees >= 1) out.amount_rupees = a.amount_rupees;
      if (typeof a.date_as_spoken === 'string' && a.date_as_spoken.trim()) out.date_as_spoken = a.date_as_spoken.trim();
      if (typeof a.milestone === 'string' && a.milestone.trim()) out.milestone = a.milestone.trim();
      if (Array.isArray(a.missing)) out.missing = a.missing.filter((m) => typeof m === 'string' && m.trim());
      return out;
    });
  return { route, acts };
}

// F-44.39: the thread up to but EXCLUDING the current exchange (the reply row runTurn named, and
// the latest vendor row carrying this message), oldest first, from the conversation runTurn used.
async function readThread(supabase, conversationId, excludeId, message) {
  if (!conversationId) return [];
  try {
    const { data, error } = await supabase.schema('engine').from('messages')
      .select('id, role, content, meta, created_at')
      .eq('conversation_id', conversationId).in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false }).limit(THREAD_ROWS + 2);
    if (error || !Array.isArray(data)) return [];
    let skippedUser = false;
    const kept = data.filter((m) => {
      if (m.id === excludeId) return false;
      if (!skippedUser && m.role === 'user' && String(m.content || '').trim() === String(message || '').trim()) { skippedUser = true; return false; }
      return !(m.meta && m.meta.tombstone === true);
    });
    return kept.slice(0, THREAD_ROWS).reverse();
  } catch (_e) { return []; }
}

function threadText(rows) {
  if (!rows.length) return '';
  const lines = rows.map((m) => {
    const who = m.role === 'user' ? 'Vendor' : 'Assistant';
    const text = String(m.content || '').replace(/\s+/g, ' ').trim().slice(0, THREAD_CHARS);
    const last = m.meta && m.meta.listener && m.meta.listener.request ? ` [understood then: ${JSON.stringify(m.meta.listener.request)}]` : '';
    return `${who}: ${text}${last}`;
  });
  return `Recent conversation, oldest first:\n${lines.join('\n')}\n\n`;
}

function withTimeout(p, ms) {
  let t;
  return Promise.race([p, new Promise((_r, rej) => { t = setTimeout(() => rej(new Error(`listener timed out after ${ms} ms`)), ms); })])
    .finally(() => clearTimeout(t));
}

// Hear one vendor message. Never throws. Returns { request, seat, usage, error }.
// `deps` exists for the bench: { llmCreate, timeoutMs }.
async function hear({ supabase, route, message, conversationId, excludeId }, deps = {}) {
  const seat = listenerSeat(route);
  const out = { request: null, seat, usage: null, error: null };
  try {
    const rows = await readThread(supabase, conversationId, excludeId, message);
    const create = deps.llmCreate || llmCreate;
    const resp = await withTimeout(create(seat.provider, {
      model: seat.model,
      max_tokens: 500,
      system: SYSTEM,
      tools: [EAR_TOOL],
      tool_choice: { type: 'tool', name: 'ear_request' },
      messages: [{ role: 'user', content: `${threadText(rows)}New message: ${String(message)}` }],
    }), deps.timeoutMs || LISTEN_TIMEOUT_MS);
    out.usage = (resp && resp.usage) || null;
    const call = ((resp && resp.content) || []).find((b) => b && b.type === 'tool_use' && b.name === 'ear_request');
    if (!call) { out.error = 'no ear_request call returned'; return out; }
    const request = normaliseRequest(call.input);
    if (!request) { out.error = 'malformed ear_request'; return out; }
    out.request = request;
    return out;
  } catch (e) {
    out.error = (e && e.message) || String(e);
    return out;
  }
}

async function writeUsage(supabase, agentId, ear, deps = {}) {
  if (!ear || !ear.usage) return;
  try {
    // Through harvest's own writer (src/agent/harvest.js _meter): the estate keeps exactly two
    // usage-write homes (tdw10 3.1), and that writer's rows carry conversation_id NULL, spend and
    // never a turn, so today's chain row stays the turn's one counted row.
    const meter = deps.meter || require('../../agent/harvest')._meter;
    await meter.writeHarvestUsage(supabase, agentId, meter.harvestMeterRow({ usage: ear.usage }, ear.seat && ear.seat.model));
  } catch (e) { console.warn('[listener:usage]', e && e.message); }
}

// THE ONE ENTRY. Called after the wire closes, never awaited by the reply. Hears the turn, merges
// { listener: {...} } into the named row's meta (never overwriting what is there), writes the
// uncounted usage row. Never throws.
// CE-44 LC-Victor P5: `ear` is the request the working door ALREADY HEARD before the reply
// (src/lib/vendor/workingDoor.js). On a chain turn it is recorded as it is and NO second model call
// is made; a doubled listener call would be a doubled cost nobody would see. Absent, the turn is heard
// here once, exactly as P2 built it.
function heardAlready(e) { return !!e && typeof e === 'object' && !!e.seat && ('request' in e); }
async function recordListening({ supabase, agentId, route, message, result, lane, ear: heard }, deps = {}) {
  try {
    const id = result && result.assistant_message_id;
    if (!id) return;
    const ear = heardAlready(heard) ? heard : await hear({ supabase, route, message, conversationId: result.conversation_id, excludeId: id }, deps);
    const eng = supabase.schema('engine');
    const { data } = await eng.from('messages').select('meta').eq('id', id).maybeSingle();
    const prior = (data && data.meta && typeof data.meta === 'object') ? data.meta : {};
    const listener = {
      lane, provider: ear.seat && ear.seat.provider, model: ear.seat && ear.seat.model,
      request: ear.request, ...(ear.error ? { error: ear.error } : {}),
    };
    const { error } = await eng.from('messages').update({ meta: { ...prior, listener } }).eq('id', id);
    if (error) console.warn('[listener:meta]', error.message);
    await writeUsage(supabase, agentId, ear, deps);
  } catch (e) { console.warn('[listener]', e && e.message); }
}

module.exports = { recordListening, hear, normaliseRequest, listenerSeat, EAR_TOOL, SYSTEM, LISTEN_TIMEOUT_MS };
