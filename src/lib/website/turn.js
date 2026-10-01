// src/lib/website/turn.js · TDW · CE-47 · WEB-4 cut 7 · DOOR 2: THE WEBSITE CHAT, ONE TURN (WEB-7's contract, 1 October 2026).
// On the shape of lib/ownNumber/turn.js: gate, thread, inbound row, turn, outbound rows. The replies return in the HTTP answer,
// never over WhatsApp. Keyed ONLY by the chat token from door 1 (the chair's ruling): the phone and the thread come from the
// token's binding, never the request. Held (no turn) when Eliza is off for the website (flag.website_eliza) or she has taken
// over (a vendor_relay row in the thread within her reply_quiet_minutes, the own-number and Instagram rule). A model failure,
// the engine's stand-in or a turn over 25 seconds answers 503; no reply text is ever invented. No vendor notice: the token lives
// 24 hours, inside F-44.227's 7 days from door 1's row.
'use strict';

const W = require('./enquiry');

const HOUR = 3600 * 1000; const DAY = 24 * HOUR;
const TURN_LIMIT_MS = 25000;
const QUIET = [60, 120, 240, 480];
const inFlight = new Set();
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

async function heldReason(sb, vendor, thread, deps, nowMs) {
  if (!(await W.switchOpen(deps.capApi, 'flag.website_eliza', vendor.id, deps.env))) return 'eliza_off';
  const minutes = QUIET.includes(vendor.reply_quiet_minutes) ? vendor.reply_quiet_minutes : 120;
  const cutoff = new Date(nowMs - minutes * 60000).toISOString();
  const { data, error } = await sb.from('messages').select('id').eq('conversation_id', thread).eq('direction', 'outbound').eq('sent_by', 'vendor_relay').gte('created_at', cutoff).limit(1);
  if (error) return 'taken_over';   // a failed read holds rather than talks over her
  return (data || []).length ? 'taken_over' : null;
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('turn over 25 s')), ms))]);

/**
 * DOOR 2. Returns { status, body }. deps: capApi, runTurn, enquireLinkFor (vendor -> link), splitText, notFoundBody, anthropic,
 * now, env.
 */
async function chatTurn({ sb, req, code, body }, deps) {
  const d = deps || {};
  const NOT_FOUND = { status: 404, body: d.notFoundBody };
  const nowMs = d.now ? d.now().getTime() : Date.now();
  if (!W.limiter.hit(W.addrKey(req, 'chat'), 60, HOUR)) return { status: 429, body: { ok: false, error: W.LINES.tooMany } };
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const token = typeof b.chat_token === 'string' ? b.chat_token : '';
  if (!TOKEN.test(token)) return NOT_FOUND;
  let vendor;
  try { vendor = await W.vendorFor(sb, code); } catch (_e) { return { status: 503, body: { ok: false, error: W.LINES.chatFailed } }; }
  if (!vendor) return NOT_FOUND;
  if (!(await W.originAllowed(sb, vendor, req.get('origin')))) return NOT_FOUND;
  if (!(await W.switchOpen(d.capApi, 'flag.website_chat', vendor.id, d.env))) return NOT_FOUND;
  const hash = W.sha(token);
  const { data: tk, error: tkErr } = await sb.from('website_chat_tokens').select('token_hash, vendor_id, phone, conversation_id, page_title, expires_at').eq('token_hash', hash).maybeSingle();
  if (tkErr) return { status: 503, body: { ok: false, error: W.LINES.chatFailed } };
  if (!tk || tk.vendor_id !== vendor.id || !(Date.parse(tk.expires_at) > nowMs)) return NOT_FOUND;
  const text = typeof b.text === 'string' ? b.text.trim() : '';
  if (!text || Array.from(text).length > 600) return { status: 400, body: { ok: false, error: W.LINES.chatEmpty } };
  if (!W.limiter.hit(`chat:t:${hash}`, 30, DAY) || !W.vendorBreaker(vendor.id)) return { status: 429, body: { ok: false, error: W.LINES.tooMany } };
  if (inFlight.has(hash)) return { status: 409, body: { ok: false, error: W.LINES.oneMoment } };
  inFlight.add(hash);
  try {
    const at = new Date(nowMs).toISOString();
    const inb = await sb.from('messages').insert({ conversation_id: tk.conversation_id, direction: 'inbound', channel: 'website', body: text, sent_by: 'couple' });
    if (inb.error) throw new Error(`inbound row: ${inb.error.message}`);
    const touch = () => sb.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', tk.conversation_id);
    const held = await heldReason(sb, vendor, tk.conversation_id, d, nowMs);
    if (held) { await touch(); return { status: 200, body: { ok: true, replies: [], held: true } }; }
    const { data: thread, error: thErr } = await sb.from('conversations').select('*').eq('id', tk.conversation_id).eq('vendor_id', vendor.id).maybeSingle();
    if (thErr || !thread) throw new Error('thread read');
    const { data: fullVendor } = await sb.from('vendors').select('*').eq('id', vendor.id).maybeSingle();
    const { data: vendorUser } = await sb.from('users').select('*').eq('id', vendor.user_id).maybeSingle();
    const result = await withTimeout(d.runTurn({
      vendor: fullVendor || vendor, vendorUser: vendorUser || null, conversation: thread, couplePhone: tk.phone, coupleId: thread.couple_id || null,
      inboundMessage: text, supabase: sb, anthropic: d.anthropic,
      counterparty: { channel: 'website', phone: tk.phone, website: { page: tk.page_title, enquireLink: d.enquireLinkFor(vendor) } },
    }), TURN_LIMIT_MS);
    const reply = result && typeof result.reply === 'string' ? result.reply.trim() : '';
    if (!reply || (result && result.stoodIn === true)) { await touch(); return { status: 503, body: { ok: false, error: W.LINES.chatFailed } }; }
    const parts = d.splitText(reply);
    for (let i = 0; i < parts.length; i++) {
      const o = await sb.from('messages').insert({ conversation_id: tk.conversation_id, direction: 'outbound', channel: 'website', body: parts[i], sent_by: 'agent',
        tool_calls: i === 0 ? ((result && result.toolCalls) || null) : null });
      if (o.error) console.error(`[website] ${vendor.id} outbound row not recorded: ${o.error.message}`);
    }
    await touch();
    void at;
    return { status: 200, body: { ok: true, replies: parts } };
  } catch (e) {
    console.error(`[website] ${vendor.id} chat turn failed: ${e && e.message}`);
    return { status: 503, body: { ok: false, error: W.LINES.chatFailed } };
  } finally {
    inFlight.delete(hash);
  }
}

module.exports = { chatTurn, heldReason, TURN_LIMIT_MS, _inFlight: inFlight };
