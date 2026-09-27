'use strict';
// src/lib/instagram/igReply.js · CE-46 · IGD-2 · CUT 2b · THE INSTAGRAM LANE'S CALLER (the joint ruling of 27 September 2026).
// ELZ-2's turn composes; THIS file is everything around it on Instagram, in this order, for one recorded couple DM:
//   1. no text (a sticker, a photo, a story reply) : recorded already, no turn (ruled).
//   2. the gates : her switch (vendor_ig_connections.dm_state 'on', the room's only gate on Instagram, Q2 = 1) and a usable token.
//   3. STOP / START (Q1 = 1, F4 (a); F-44.193) : the whole-message matcher (fullStop.matchOptOutExact, one home for the words);
//      STOP sets conversations.ig_stopped_at (0175) and sends IG-S1; START clears it and sends IG-S2 only when it was set; while it
//      is set no turn runs.
//   4. the quiet time (Q4) : the thread's newest sent_by 'vendor' row (an echo from her own Instagram app) younger than
//      vendors.reply_quiet_minutes (0173, the one home) means no turn.
//   5. the turn, with the counterparty { channel: 'instagram', phone: null, igsid } and the studio's WhatsApp link as a fact
//      (F6 (b): enquireLinkFor, vendorCard.js's call). turnInput is the ONE place its shape is written.
//   6. the window (F2 (a)+(b)) : outside 24 hours nothing is sent or recorded as sent, it is logged, and she is told (V2).
//   7. the send : igSend.sendText per splitReply part; each part's message_id stored in message_sid on its own outbound row
//      (F-44.192), so Meta's echo of OUR send drops on the UNIQUE and is never read as the vendor replying. If the echo lands
//      FIRST (a race: its row is written as sent_by 'vendor' with our id), the insert collides and the row is claimed back as
//      the agent's (claimOutbound).
//   8. the vendor's notice to her TDW WhatsApp, through the one enquiry door (sendVendorEnquiryAlert).
// No studio prefix on any reply. Nothing here writes an engine byte. deps are injected (index.js builds them once).
const igSend = require('./igSend');
const { matchOptOutExact } = require('../fullStop');
const { studioName } = require('../../agent/studioName');
const { ENQUIRE_BASE, enquireLinkFor } = require('../discover/shapeVendor');

const QUIET_OK = [60, 120, 240, 480];
const QUIET_DEFAULT = 120;

// The founder's lines, as he approved them (Q3 = yes, 27 September 2026). Plain, no dash.
const COPY = {
  IG_S1: "Okay, you won't get any more automatic replies here. {studio} will reply to you themselves. Send START if you want them back.",
  IG_S2: 'Okay, replies are back on.',
  // V2 supersedes IGD-1's C12 (chair, ruling A, 27 September 2026): C12's words were never written down on any tree or record.
  V2: 'An Instagram message from {name} is waiting for your reply. Instagram only allows a reply within 24 hours of their last message.',
};

// The turn's input: the ONE place its shape is written (pinned at the cut against ELZ-2 cut 1's landed signature).
function turnInput({ vendor, vendorUser, conversation, igsid, text, link, supabase, anthropic }) {
  return {
    vendor, vendorUser, conversation,
    // Pinned at the cut to ELZ-2 cut 1 r2's landed signature (dc1dfd1, engine.js :217 to :236): the persona path is read from
    // channel (Q2 = 1, D2 ruled); enquireLink, the fifth fact (F6 (b)), rides INSIDE the counterparty.
    counterparty: { channel: 'instagram', phone: null, igsid, enquireLink: link },
    inboundMessage: text, supabase, anthropic,
  };
}

function studioLink(vendor) {
  if (!vendor) return null;
  return enquireLinkFor({ tdwLink: ENQUIRE_BASE + String(vendor.routing_handle), enquiry_routing: vendor.enquiry_routing, enquiry_phone: vendor.enquiry_phone });
}

function inQuiet(lastVendorAtIso, minutes, nowMs) {
  const t = Date.parse(lastVendorAtIso || '');
  if (!Number.isFinite(t) || !Number.isFinite(nowMs)) return false;
  const m = QUIET_OK.includes(minutes) ? minutes : QUIET_DEFAULT;
  const age = nowMs - t;
  return age >= 0 && age < m * 60 * 1000;
}

async function claimOutbound(supabase, conversationId, part, mid, toolCalls) {
  const row = { conversation_id: conversationId, direction: 'outbound', channel: 'instagram', body: part, sent_by: 'agent', message_sid: mid };
  if (toolCalls) row.tool_calls = toolCalls;
  const w = await supabase.from('messages').insert(row);
  if (!w.error) return 'inserted';
  if (!/duplicate|unique/i.test(String(w.error.message))) return 'failed';
  // The echo of our own send landed first and was written as the vendor's: claim it back.
  const u = await supabase.from('messages').update({ sent_by: 'agent', direction: 'outbound', body: part })
    .eq('conversation_id', conversationId).eq('message_sid', mid);
  return u.error ? 'failed' : 'claimed';
}

async function sendAndRecord(deps, { token, igId, igsid, conversationId, text, toolCalls }) {
  const parts = igSend.splitReply(text);
  const r = await igSend.sendText({ fetchImpl: deps.fetchImpl, token, igId, igsid, text });
  const ids = (r && Array.isArray(r.sent)) ? r.sent : [];
  for (let i = 0; i < ids.length; i += 1) {
    const how = await claimOutbound(deps.supabase, conversationId, parts[i], ids[i], i === 0 ? toolCalls : null);
    if (how === 'failed') console.warn(`[instagram:reply] part ${i} sent but not recorded`);
  }
  if (!r || !r.ok) console.warn(`[instagram:reply] send stopped: ${r && r.why}${r && r.part !== undefined ? ` at part ${r.part}` : ''}`);
  return { ok: !!(r && r.ok), sent: ids.length };
}

async function leadNameFor(supabase, vendorId, igsid) {
  const { data } = await supabase.from('leads').select('name').eq('vendor_id', vendorId).eq('counterparty_ig_id', igsid)
    .is('deleted_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data && typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null;
}

// deps: { supabase, anthropic, runTurn, fetchImpl, tokenForCall(supabase, vendorId), sendAlert(args), scrub(text, verbatim, w),
//         leadsLink, nowMs() }
async function reply(deps, { vendorId, conversationId, igsid, text, receivedAtMs }) {
  const sb = deps.supabase;
  const body = typeof text === 'string' ? text : '';
  if (!body.trim()) return { ran: false, why: 'no_text' };

  const { data: conn } = await sb.from('vendor_ig_connections').select('dm_state').eq('vendor_id', vendorId).maybeSingle();
  if (!conn || conn.dm_state !== 'on') return { ran: false, why: 'switch_off' };
  const tok = await deps.tokenForCall(sb, vendorId);
  if (!tok || !tok.ok || !tok.accessToken || !tok.igUserId) return { ran: false, why: 'token' };

  const { data: conversation } = await sb.from('conversations')
    .select('id, vendor_id, kind, channel, counterparty_ig_id, ig_stopped_at').eq('id', conversationId).maybeSingle();
  if (!conversation) return { ran: false, why: 'thread' };
  const { data: vendor } = await sb.from('vendors').select('*').eq('id', vendorId).maybeSingle();
  if (!vendor) return { ran: false, why: 'vendor' };
  const { data: vendorUser } = await sb.from('users').select('*').eq('id', vendor.user_id).maybeSingle();
  const send = (t) => sendAndRecord(deps, { token: tok.accessToken, igId: tok.igUserId, igsid, conversationId, text: t, toolCalls: null });

  // STOP / START: before the quiet time, because a couple asking to stop is always answered.
  const word = matchOptOutExact(body);
  if (word === 'stop') {
    await sb.from('conversations').update({ ig_stopped_at: new Date(deps.nowMs()).toISOString() }).eq('id', conversationId);
    await send(COPY.IG_S1.replace('{studio}', studioName(vendor, vendorUser)));
    return { ran: false, why: 'stop' };
  }
  if (word === 'start' && conversation.ig_stopped_at) {
    await sb.from('conversations').update({ ig_stopped_at: null }).eq('id', conversationId);
    await send(COPY.IG_S2);
    return { ran: false, why: 'start' };
  }
  if (conversation.ig_stopped_at) return { ran: false, why: 'stopped' };

  const { data: lastVendor } = await sb.from('messages').select('created_at').eq('conversation_id', conversationId)
    .eq('sent_by', 'vendor').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (lastVendor && inQuiet(lastVendor.created_at, vendor.reply_quiet_minutes, deps.nowMs())) return { ran: false, why: 'quiet' };

  const result = await deps.runTurn(turnInput({ vendor, vendorUser, conversation, igsid, text: body, link: studioLink(vendor), supabase: sb, anthropic: deps.anthropic }));
  const replyText = result && typeof result.reply === 'string' ? result.reply : '';

  let sent = { ok: false, sent: 0 };
  if (!igSend.withinWindow(receivedAtMs, deps.nowMs())) {
    console.warn(`[instagram:reply] window closed: nothing sent (thread ${conversationId})`);
    if (vendorUser && vendorUser.phone) {
      const name = (await leadNameFor(sb, vendorId, igsid)) || 'a client';
      await deps.sendAlert({ toPhone: vendorUser.phone, text: COPY.V2.replace('{name}', name), vendorName: vendorUser.name, brideName: name,
        brideMessage: body, link: deps.leadsLink, supabase: sb, vendorId, ctx: 'igReply:window' });
    }
    return { ran: true, why: 'window' };
  }
  if (replyText) sent = await sendAndRecord(deps, { token: tok.accessToken, igId: tok.igUserId, igsid, conversationId, text: replyText, toolCalls: result.toolCalls || null });

  if (result && result.vendorNotification && vendorUser && vendorUser.phone) {
    await deps.sendAlert({
      toPhone: vendorUser.phone,
      text: deps.scrub(result.vendorNotification, body, { supabase: sb, vendorId, surface: 'instagram', ctx: 'igReply:notification' }),
      vendorName: vendorUser.name, brideName: result.leadName, brideMessage: body, link: deps.leadsLink,
      supabase: sb, vendorId, ctx: 'igReply:notification',
    });
  }
  await sb.from('conversations').update({ last_message_at: new Date(deps.nowMs()).toISOString() }).eq('id', conversationId);
  return { ran: true, why: sent.ok ? 'sent' : 'send_failed', parts: sent.sent };
}

// The route's dead-letter catch (F7 (a)): service 'instagram', so failedTurns.js refuses to replay it; then the failed-turn line
// (webhookCore.GRACEFUL_TURN_LINE, its ONE home, Q7 pending) to the couple when her token allows. NEVER THROWS.
async function deadLetter(deps, { msg, payload, error }) {
  try {
    await deps.captureDeadLetter({ supabase: deps.supabase, service: 'instagram', phone: null, payload, error });
  } catch (e) { console.error('[instagram:dead-letter] capture failed:', e && e.message); }
  try {
    if (!msg || msg.echo) return;
    const who = await deps.findByIgUserId(deps.supabase, msg.accountId);
    if (!who || !who.ok) return;
    const tok = await deps.tokenForCall(deps.supabase, who.vendorId);
    if (!tok || !tok.ok) return;
    await igSend.sendText({ fetchImpl: deps.fetchImpl, token: tok.accessToken, igId: tok.igUserId, igsid: msg.igsid, text: deps.gracefulLine });
  } catch (e) { console.error('[instagram:dead-letter] line not sent:', e && e.message); }
}

module.exports = { COPY, QUIET_DEFAULT, turnInput, studioLink, inQuiet, claimOutbound, reply, deadLetter };
