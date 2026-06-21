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

// Calendar sight: the door hands Harvey the vendor's upcoming bookings as a compact snapshot,
// injected into his turn (mirrors the cabinet snapshot). Read-only; the engine stays clean.
async function fetchCalendarSnapshot(req) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await req.app.locals.supabase
      .from('events')
      .select('title, event_date, event_time, kind, state')
      .eq('vendor_id', req.vendor.id)
      .eq('state', 'upcoming')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(12);
    if (error || !data || !data.length) return '';
    const lines = data.map((e) => {
      const when = e.event_time ? `${e.event_date} ${e.event_time}` : e.event_date;
      return `- ${when} · ${e.title}${e.kind ? ` (${e.kind})` : ''}`;
    });
    return `[Calendar — upcoming, kept for you]\n${lines.join('\n')}`;
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

    let reply = result.reply;
    if (documents.length) {
      reply += '\n\n' + documents.map((d) =>
        `Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} is ready — find it in the invoices list to download or send.`
      ).join('\n');
    }
    if (booked.length) reply += '\n\n' + bookingLines(booked);

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
