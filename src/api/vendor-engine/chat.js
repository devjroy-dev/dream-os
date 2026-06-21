'use strict';
// src/api/vendor-engine/chat.js
// Vendor Suit, Phase 3-D — the engine-backed chat door. Victor comes online.
//
// This is the payoff of the port: the vendor talks to the advisor, who reasons
// with the standing SMM lens (and the category Codex, once a real MUA/planner
// hits it — Phase 2), dispatches Donna for any filing, and replies in his own
// voice. The door is a thin wrapper; runTurn owns everything — its own Anthropic
// client (ANTHROPIC_API_KEY, already in dream-os's env for Myra), the rolling
// per-agent conversation (memory persists with no work here), the owner briefing.
//
// Unlike the 3-C form doors, THIS is the model path: real Anthropic calls (Victor,
// plus Donna if dispatched). A turn takes seconds and costs tokens. The door just
// awaits runTurn, exactly as the Myra handler awaited its loop.
//
//   POST /api/v2/vendor-e/chat                 { message }  -> one advisor turn
//   GET  /api/v2/vendor-e/chat/history/:vendorId           -> display-only scrollback
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
// The compiled engine loop (Phase 0 landed src/engine; dist is built on deploy).
const { runTurn } = require('../../engine/dist/core/loop');
const { generateInvoiceForBinder } = require('../vendor/invoices');
const { updateEvent } = require('../../lib/vendor/events');
const { executeAndPatch } = require('../../lib/executeAndPatch');

// ── Publication firewall: engine beats -> the wire names the PWA already reads ───
// The engine speaks victor_token / dispatch / donna_action / donna_report. The PWA reads
// the older Myra wire (text_delta / handoff / operator_action / operator_report), so the
// frontend stays untouched. The operator (Donna) is shown but never named; tool tokens
// collapse to a category — her name and hands never cross the wire.
function scrubText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\bdonna_[a-z_]+\b/gi, 'operator tool')
    .replace(/\bDonna\b/g, 'Operator')
    .replace(/\bHarvey\b/g, 'Victor');
}
function actionKind(name) {
  if (/(find|tally|history|shelf|brief|whatsdue|search)/i.test(name || '')) return 'read';
  if (/(calendar|event)/i.test(name || '')) return 'calendar';
  return 'write';
}
function translateBeat(e) {
  if (!e || !e.type) return null;
  switch (e.type) {
    case 'victor_token': return { type: 'text_delta', text: e.text };
    case 'dispatch':     return { type: 'handoff', from: 'victor', to: 'operator', message: scrubText(e.message) };
    case 'donna_action': return { type: 'operator_action', kind: actionKind(e.name), detail: scrubText(typeof e.result === 'string' ? e.result : '') };
    case 'donna_report': return { type: 'operator_report', message: scrubText(e.message) };
    // answer / done / handbook dropped: the reply already streamed as text_delta, and the
    // door sends its own authoritative done below.
    default: return null;
  }
}

// donna_invoice_pdf is Donna's SIGNAL hand: the engine only flags intent. The door mints
// the real numbered document (idempotent). Shared by the JSON and SSE paths so the invoice
// contract is identical on both.
async function buildInvoices(req, result) {
  const eng = req.app.locals.supabase.schema('engine');
  const wantInvoice = new Set();
  for (const tc of (result.tool_calls || [])) {
    if (tc.name === 'donna_invoice_pdf' && tc.input && tc.input.binder_id) wantInvoice.add(tc.input.binder_id);
    for (const dc of (tc.donna_calls || [])) {
      if (dc.name === 'donna_invoice_pdf' && dc.input && dc.input.binder_id) wantInvoice.add(dc.input.binder_id);
    }
  }
  const documents = [];
  for (const binderId of wantInvoice) {
    try {
      const { data: binder } = await eng.from('records')
        .select('id, client, phone, amount, amount_received, note')
        .eq('agent_id', req.agentId).eq('id', binderId).maybeSingle();
      if (binder && Number(binder.amount) > 0) {
        const gen = await generateInvoiceForBinder(req.app.locals.supabase, req.vendor, binder);
        if (gen && gen.ok) documents.push({ invoice_number: gen.invoice_number, pdf_url: gen.pdf_url, client: binder.client });
      }
    } catch (e) { console.error('[vendor-e chat:donna_invoice_pdf]', e.message); }
  }
  return documents;
}

// The chat-door confirms the invoice NUMBER only (the download lives in the invoices list).
function invoiceLines(documents) {
  return documents.map((d) =>
    `Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} is ready — find it in the invoices list to download or send.`
  ).join('\n');
}

// donna_book_event is Donna's SIGNAL hand for the calendar: the engine flags intent, the
// door writes the real row into public.events (vendor-keyed) and confirms. Shared by the
// JSON + SSE paths, and the same handler a future WhatsApp door will call. The cabinet's
// "Booked" already reads public.events, so a booking shows up there with no UI change.
const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'];
// (c) A booking's link to a client binder: Donna's explicit binder_id is the EXACT path; if she
// gave none, the door tries a CONFIDENT name-match from the title (exact client name, single hit
// only) — never a guess. 0 or >1 matches -> left honestly unlinked (null). The link is what lets
// Donna keep the event's date and the binder's date in lockstep.
async function resolveBinderForBooking(req, bk) {
  const given = String(bk.binder_id || '').trim();
  if (UUID_RE.test(given)) return given;
  const hint = String(bk.title || '').split(/[-\u2013\u2014\u00b7:]/)[0].trim();
  if (hint.length < 2) return null;
  try {
    const { data, error } = await req.app.locals.supabase.schema('engine')
      .from('records')
      .select('id, client')
      .eq('agent_id', req.agentId)
      .ilike('client', hint)
      .limit(2);
    if (error || !data || data.length !== 1) return null; // not a confident single match -> unlinked
    return data[0].id;
  } catch (e) { console.warn('[vendor-e chat:link binder]', e.message); return null; }
}
async function bookEvents(req, result) {
  const wantBook = [];
  const collect = (call) => {
    if (call && call.name === 'donna_book_event' && call.input && call.input.title && call.input.event_date) {
      wantBook.push(call.input);
    }
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const booked = [];
  for (const bk of wantBook) {
    try {
      const kind = BOOKED_KINDS.includes(bk.kind) ? bk.kind : 'meeting';
      const row = { vendor_id: req.vendor.id, title: String(bk.title).slice(0, 200), event_date: bk.event_date, kind, state: 'upcoming' };
      if (bk.event_time) row.event_time = bk.event_time;
      if (bk.notes) row.notes = String(bk.notes);
      const linkedBinder = await resolveBinderForBooking(req, bk);
      const existing = await findExistingEvent(req, bk);
      if (existing) {
        // (a) same client, same date, already on the calendar — that IS this booking. Link it and
        // apply any new detail; never mint a duplicate. Re-confirming a booking becomes idempotent.
        const patch = {};
        if (bk.event_time) patch.event_time = bk.event_time;
        if (bk.notes) patch.notes = String(bk.notes);
        if (linkedBinder && !existing.linked_binder_id) patch.linked_binder_id = linkedBinder;
        if (Object.keys(patch).length) {
          const { data } = await req.app.locals.supabase.from('events')
            .update(patch).eq('id', existing.id).eq('vendor_id', req.vendor.id)
            .select('id, title, event_date, event_time, kind').maybeSingle();
          booked.push(data || existing);
        } else {
          booked.push(existing);
        }
        continue;
      }
      if (linkedBinder) row.linked_binder_id = linkedBinder;
      const { data, error } = await req.app.locals.supabase
        .from('events').insert(row).select('id, title, event_date, event_time, kind').single();
      if (error) { console.error('[vendor-e chat:donna_book_event]', error.message); continue; }
      booked.push(data);
    } catch (e) { console.error('[vendor-e chat:donna_book_event]', e.message); }
  }
  return booked;
}
function bookingLines(booked) {
  return booked.map((bk) => {
    const when = bk.event_time ? `${bk.event_date} at ${bk.event_time}` : bk.event_date;
    return `Booked: ${bk.title} — ${when}. It's on your calendar.`;
  }).join('\n');
}
// (a) Dedupe: an event for the same client on the same date already on the calendar IS this booking.
async function findExistingEvent(req, bk) {
  const hint = String(bk.title || '').split(/[-–—·:]/)[0].trim();
  if (hint.length < 2) return null;
  try {
    const { data, error } = await req.app.locals.supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, linked_binder_id, state')
      .eq('vendor_id', req.vendor.id)
      .eq('event_date', bk.event_date)
      .neq('state', 'cancelled')
      .ilike('title', `${hint}%`)
      .limit(2);
    if (error || !data || data.length !== 1) return null; // 0 or ambiguous -> a fresh insert is safer
    return data[0];
  } catch (e) { console.warn('[vendor-e chat:dedupe]', e.message); return null; }
}
// Retroactive link: when a client binder is filed (donna_client), tie any existing unlinked event
// that exactly name-matches that client — so the common "book the date, file the client later" order
// still ends up linked. Confident only: a single binder for the name, exact client-hint match.
async function retroLinkOnFile(req, result) {
  const names = new Set();
  const collect = (call) => {
    if (call && call.name === 'donna_client' && call.input && typeof call.input.client === 'string') {
      const n = call.input.client.trim();
      if (n.length >= 2) names.add(n);
    }
  };
  for (const tc of (result.tool_calls || [])) { collect(tc); for (const dc of (tc.donna_calls || [])) collect(dc); }
  if (!names.size) return;
  for (const name of names) {
    try {
      const { data: binders } = await req.app.locals.supabase.schema('engine')
        .from('records').select('id, client')
        .eq('agent_id', req.agentId).ilike('client', name).limit(2);
      if (!binders || binders.length !== 1) continue; // not a confident single binder
      const binderId = binders[0].id;
      const { data: evs } = await req.app.locals.supabase
        .from('events').select('id, title')
        .eq('vendor_id', req.vendor.id).is('linked_binder_id', null)
        .neq('state', 'cancelled').ilike('title', `${name}%`).limit(20);
      for (const ev of (evs || [])) {
        const hint = String(ev.title || '').split(/[-–—·:]/)[0].trim();
        if (hint.toLowerCase() !== name.toLowerCase()) continue; // exact client-hint only
        await req.app.locals.supabase.from('events')
          .update({ linked_binder_id: binderId }).eq('id', ev.id).eq('vendor_id', req.vendor.id);
      }
    } catch (e) { console.warn('[vendor-e chat:retro-link]', e.message); }
  }
}

// donna_edit_event / donna_cancel_event are Donna's SIGNAL hands for changing the calendar.
// The door resolves the event (vendor-scoped; only on a full valid handle, so a truncated
// one reports cleanly instead of hard-erroring — the short-UUID lesson), applies the change,
// and confirms. updateEvent is the same helper the calendar API uses, so the contract matches.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function resolveEvent(req, eventId) {
  const raw = String(eventId || '').trim();
  if (!UUID_RE.test(raw)) return null; // not a usable handle -> door reports "tell me which one"
  const { data, error } = await req.app.locals.supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, linked_binder_id')
    .eq('vendor_id', req.vendor.id)
    .eq('id', raw)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
async function mutateEvents(req, result) {
  const edits = [], cancels = [];
  const collect = (call) => {
    if (!call || !call.input) return;
    if (call.name === 'donna_edit_event' && call.input.event_id) edits.push(call.input);
    if (call.name === 'donna_cancel_event' && call.input.event_id) cancels.push(call.input);
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const done = [];
  for (const e of edits) {
    try {
      const ev = await resolveEvent(req, e.event_id);
      if (!ev) { done.push({ action: 'edit', ok: false }); continue; }
      const patch = {};
      for (const k of ['title', 'event_date', 'event_time', 'kind', 'notes']) {
        if (typeof e[k] === 'string' && e[k].trim()) patch[k] = e[k].trim();
      }
      const r = await updateEvent(req.app.locals.supabase, req.vendor.id, ev.id, patch);
      // Lockstep: a linked event's date moved -> carry the binder's date along, through Donna's hand
      // (the binder is engine-owned, so it goes through donna_date — snapshot patched, trail written).
      if (r && r.ok && patch.event_date && ev.linked_binder_id) {
        try { await executeAndPatch(req.agentId, 'donna_date', { binder_id: ev.linked_binder_id, date: patch.event_date }); }
        catch (e2) { console.warn('[vendor-e chat:lockstep e->b]', e2.message); }
      }
      done.push(r && r.ok ? { action: 'edit', ok: true, event: r.event || ev } : { action: 'edit', ok: false });
    } catch (err) { console.error('[vendor-e chat:donna_edit_event]', err.message); done.push({ action: 'edit', ok: false }); }
  }
  for (const c of cancels) {
    try {
      const ev = await resolveEvent(req, c.event_id);
      if (!ev) { done.push({ action: 'cancel', ok: false }); continue; }
      const { error } = await req.app.locals.supabase
        .from('events').update({ state: 'cancelled' })
        .eq('id', ev.id).eq('vendor_id', req.vendor.id);
      done.push(!error ? { action: 'cancel', ok: true, event: ev } : { action: 'cancel', ok: false });
    } catch (err) { console.error('[vendor-e chat:donna_cancel_event]', err.message); done.push({ action: 'cancel', ok: false }); }
  }
  return done;
}
function mutationLines(done) {
  return done.map((m) => {
    if (!m.ok) return m.action === 'cancel'
      ? `Couldn't cancel that booking — I didn't find a single match. Tell me which one.`
      : `Couldn't change that booking — I didn't find a single match. Tell me which one.`;
    const e = m.event || {};
    const when = e.event_time ? `${e.event_date} at ${e.event_time}` : e.event_date;
    return m.action === 'cancel'
      ? `Cancelled: ${e.title}${e.event_date ? ` — ${when}` : ''}. It's off your calendar.`
      : `Updated: ${e.title} — ${when}. The calendar's set.`;
  }).join('\n');
}
// Lockstep the other way: when Donna moves a binder's date (donna_date / donna_edit carrying a date),
// the linked calendar event follows. The calendar is door-owned, so the event is written raw here
// (same as every other event write). Half A's binder write is a post-turn door action, never a
// donna_call in result, so this never sees it — no loop.
async function lockstepBinderToEvent(req, result) {
  const moves = new Map(); // binder_id -> date (last wins)
  const collect = (call) => {
    if (!call || !call.input) return;
    if ((call.name === 'donna_date' || call.name === 'donna_edit') && call.input.binder_id
        && typeof call.input.date === 'string' && call.input.date.trim()) {
      moves.set(String(call.input.binder_id), call.input.date.trim());
    }
  };
  for (const tc of (result.tool_calls || [])) { collect(tc); for (const dc of (tc.donna_calls || [])) collect(dc); }
  for (const [binderId, date] of moves) {
    try {
      await req.app.locals.supabase.from('events')
        .update({ event_date: date })
        .eq('vendor_id', req.vendor.id)
        .eq('linked_binder_id', binderId)
        .neq('state', 'cancelled');
    } catch (e) { console.warn('[vendor-e chat:lockstep b->e]', e.message); }
  }
}

// Calendar sight: the door hands Harvey the vendor's upcoming bookings as a compact snapshot,
// injected into his turn (mirrors the cabinet snapshot). Read-only; the engine stays clean.
async function fetchCalendarSnapshot(req) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await req.app.locals.supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state')
      .eq('vendor_id', req.vendor.id)
      .eq('state', 'upcoming')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(12);
    if (error || !data || !data.length) return '';
    const lines = data.map((e) => {
      const when = e.event_time ? `${e.event_date} ${e.event_time}` : e.event_date;
      return `- [${e.id}] ${when} · ${e.title}${e.kind ? ` (${e.kind})` : ''}`;
    });
    return `[Calendar — upcoming, kept for you. The [handle] before each booking is how you reference it to change or cancel it.]\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[vendor-e chat:calendar snapshot]', e.message);
    return '';
  }
}

// POST /chat — one advisor turn. Vendor comes from the JWT (no :vendorId param),
// matching the Myra chat contract. ai_primer / mode are accepted and ignored:
// the engine runs advisory Victor and has no edit-priming mechanism (the Myra
// handler likewise accepted-and-ignored its `history` field).
router.post('/', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  const body    = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ ok: false, error: 'message is required.' });

  // ── SSE streaming path ──────────────────────────────────────────────────────
  // When the PWA sends Accept: text/event-stream, stream Victor's reply token by token
  // (the blob fills as he writes) plus the pair-at-work beats. The JSON path below is
  // untouched — curls, evals, and any non-stream caller behave exactly as before.
  const wantsStream = (req.headers['accept'] || '').includes('text/event-stream');
  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    let streamDead = false;
    res.on('error', (err) => { streamDead = true; console.warn('[vendor-e chat SSE] res error (absorbed):', err.message); });
    const send = (obj) => {
      if (streamDead || res.writableEnded) return;
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); }
      catch (err) { streamDead = true; console.warn('[vendor-e chat SSE] write failed:', err.message); }
    };

    try {
      send({ type: 'thinking' });
      const calendarSnapshot = await fetchCalendarSnapshot(req);
      const result = await runTurn({
        agentId: req.agentId,
        message,
        calendarSnapshot,
        onEvent: (e) => { const safe = translateBeat(e); if (safe) send(safe); },
      });

      // Invoices are minted after the turn (donna_invoice_pdf is a signal). The reply has
      // already streamed, so the "ready" line rides as a final text_delta before done.
      const documents = await buildInvoices(req, result);
      if (documents.length) send({ type: 'text_delta', text: '\n\n' + invoiceLines(documents) });

      const booked = await bookEvents(req, result);
      if (booked.length) send({ type: 'text_delta', text: '\n\n' + bookingLines(booked) });

      const mutated = await mutateEvents(req, result);
      if (mutated.length) send({ type: 'text_delta', text: '\n\n' + mutationLines(mutated) });

      await retroLinkOnFile(req, result);
      await lockstepBinderToEvent(req, result);

      const toolNames = (result.tool_calls || []).map((t) => t.name);
      const done = { type: 'done', tool_calls: toolNames, refresh: toolNames.length > 0 };
      if (documents.length) done.documents = documents.map((d) => ({ invoice_number: d.invoice_number, pdf_url: d.pdf_url }));
      send(done);
      if (!streamDead && !res.writableEnded) res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error('[vendor-e chat SSE]', e.message);
      send({ type: 'error', message: 'Chat failed.' });
      if (!res.writableEnded) { try { res.write('data: [DONE]\n\n'); } catch (_e) { /* gone */ } res.end(); }
    }
    return;
  }
  try {
    const calendarSnapshot = await fetchCalendarSnapshot(req);
    const result    = await runTurn({ agentId: req.agentId, message, calendarSnapshot });

    const documents = await buildInvoices(req, result);
    const booked    = await bookEvents(req, result);
    const mutated   = await mutateEvents(req, result);
    await retroLinkOnFile(req, result);
    await lockstepBinderToEvent(req, result);

    let reply = result.reply;
    if (documents.length) {
      reply += '\n\n' + documents.map((d) =>
        `Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} is ready — find it in the invoices list to download or send.`
      ).join('\n');
    }
    if (booked.length) reply += '\n\n' + bookingLines(booked);
    if (mutated.length) reply += '\n\n' + mutationLines(mutated);

    const toolNames = (result.tool_calls || []).map((t) => t.name);
    return res.json({
      ok: true,
      reply,
      tool_calls: toolNames,
      refresh: toolNames.length > 0,
      documents: documents.length ? documents.map((d) => ({ invoice_number: d.invoice_number, pdf_url: d.pdf_url })) : undefined,
    });
  } catch (e) {
    console.error('[vendor-e chat]', e.message);
    return res.status(500).json({ ok: false, error: 'Chat failed.' });
  }
});

// GET /chat/history/:vendorId — display-only scrollback so the PWA chat shows the
// recent transcript on open instead of a blank screen. NOT agent memory (the
// engine reads history itself). Reads the agent's most-recent conversation (the
// one runTurn reuses within the session window), last N messages, mapped to the
// PWA shape: engine role 'user'->'user', 'assistant'->'ai' ('tool' rows skipped).
router.get('/history/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  const eng   = req.app.locals.supabase.schema('engine');
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  try {
    const { data: convo } = await eng.from('conversations')
      .select('id').eq('agent_id', req.agentId)
      .order('last_active_at', { ascending: false }).limit(1).maybeSingle();
    if (!convo) return res.json({ ok: true, messages: [] });

    const { data: rows, error } = await eng.from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convo.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[vendor-e chat/history] query error:', error.message);
      return res.status(500).json({ ok: false, error: 'Could not load history.' });
    }

    const messages = (rows || [])
      .reverse()
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'ai', text: m.content, at: m.created_at }));
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error('[vendor-e chat/history]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not load history.' });
  }
});

module.exports = router;
