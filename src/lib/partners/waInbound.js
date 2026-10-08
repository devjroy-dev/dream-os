'use strict';
// src/lib/partners/waInbound.js · CE-47 · PTN-A2-3 · A PARTNER'S REPLY ON THE MARKETING LINE.
// The marketing lane (src/lib/prospects.js) calls this ABOVE its STOP arm, after the introduction and broadcast arms, in the
// same shape as theirs (one call block, the owner's yes given by the chair, 8 Oct 2026). Why above STOP: the lane's STOP
// arm opens with findOrCreateProspectByPhone and sets the number 'opted_out', which sendWa refuses on EVERY line. A partner
// who replies STOP to a collab call must stop collab calls, not every message TDW will ever send to that number.
//   matchInboundPartner(sb, phone) : ONE bounded read of partner_orgs by the partner's own WhatsApp number, among partners
//                                    that said yes (whatsapp_opt_at set) and are not blocked. Null for every other number,
//                                    and null on any error, so the lane goes on exactly as today.
//   applyPartnerInbound(sb, ...)   : the words a partner can send, and one fixed reply. Never mints a prospect, never
//                                    records the words as marketing consent, never runs the sales assistant, never makes an
//                                    account. Returns { fallThrough: false } for every word.
// Words (the whole message, case and punctuation ignored): STOP CALLS or a bare STOP stops calls; PAUSE CALLS pauses them
// for 7 days; START CALLS or a bare START turns calls back on. Anything else gets the help reply and changes nothing.
const { normalizeTo } = require('../metaCloud');

const REPLY = Object.freeze({
  stopped: 'TDW will send you no more collab calls. To get calls again, reply START CALLS.',
  paused: 'TDW will send you no collab calls for one week.',
  started: 'TDW will send you collab calls again.',
  help: 'Thank you for your message. To answer a call, open its View details link. To stop calls, reply STOP CALLS.',
});
const word = (t) => String(t || '').trim().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
function intentOf(text) {
  const w = word(text);
  if (w === 'STOP CALLS' || w === 'STOP') return 'stop';
  if (w === 'PAUSE CALLS' || w === 'PAUSE') return 'pause';
  if (w === 'START CALLS' || w === 'START') return 'start';
  return 'other';
}

async function matchInboundPartner(sb, phone) {
  try {
    const digits = normalizeTo(phone);
    if (!digits || !/^\d{8,15}$/.test(digits)) return null;
    const { data, error } = await sb.from('partner_orgs').select('id, name, send_state, whatsapp_opt, whatsapp_opt_at, check_state')
      .eq('whatsapp_phone', `+${digits}`).eq('whatsapp_opt', true).neq('check_state', 'blocked').limit(1);
    if (error || !Array.isArray(data) || !data.length || !data[0].whatsapp_opt_at) return null;
    return data[0];
  } catch (e) {
    console.warn('[partners:wa-inbound] match failed, the lane goes on as today:', e && e.message);
    return null;
  }
}

async function applyPartnerInbound(sb, { row, phone, text, sendWa, sendWaDeps = {}, now = new Date() }) {
  const intent = intentOf(text);
  const patch = intent === 'stop' ? { send_state: 'stopped' }
    : intent === 'pause' ? { send_state: 'active', paused_until: new Date(now.getTime() + 7 * 86400e3).toISOString() }
    : intent === 'start' ? { send_state: 'active', paused_until: null } : null;
  if (patch) {
    const { error } = await sb.from('partner_orgs').update({ ...patch, updated_at: now.toISOString() }).eq('id', row.id);
    if (error) console.warn('[partners:wa-inbound] could not save:', error.message || error);
  }
  const reply = intent === 'stop' ? REPLY.stopped : intent === 'pause' ? REPLY.paused : intent === 'start' ? REPLY.started : REPLY.help;
  let replySent = false;
  try {
    if (sendWa) { await sendWa({ line: 'marketing', to: normalizeTo(phone), text: reply, windowOpen: true, supabase: sb, site: 'partners:wa-reply' }, sendWaDeps); replySent = true; }
  } catch (e) { console.warn('[partners:wa-inbound] reply not sent:', e && (e.code || e.message)); }
  return { action: `partner_${intent}`, partnerId: row.id, fallThrough: false, replySent };
}

module.exports = { REPLY, intentOf, matchInboundPartner, applyPartnerInbound };
