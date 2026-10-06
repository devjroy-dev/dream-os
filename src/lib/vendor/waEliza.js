'use strict';
// src/lib/vendor/waEliza.js · CE-47 · ELZ-4 · THE PER-VENDOR ELIZA SWITCH FOR WHATSAPP (0212; the chair's design note r2, Q1 (b), Q2, R1, R2)
//   wa_eliza_state  NULL = follow the master (couple.eliza_enabled) · 'on' · 'off'. THE MASTER IS ABSOLUTE: master off → today's lane for
//   everyone, whatever her switch says. Master on and hers 'off' → OFF: no model call and nothing sent on her behalf on WhatsApp
//   (whatsapp_shared and whatsapp_own); Instagram and the website untouched.
//   OFF, R1: on the FIRST inbound from a number with no lead for her, the code makes ONE lead (state 'new', the sender's phone, the
//   WhatsApp profile name when Meta gives one, else the phone). Later messages add none.
//   OFF, R2: her alert, through sendVendorEnquiryAlert (the callers' existing path), EXACTLY the founder's line, on the FIRST inbound of a
//   thread, and again when the client writes after 24 hours with no reply from her; never on every message.
// TOTAL: every function answers, never throws.
const WA_CHANNELS = Object.freeze(['whatsapp_shared', 'whatsapp_own']);
const REMIND_MS = 24 * 60 * 60 * 1000;
const ALERT = (who, msg) => `New enquiry from ${who}: "${msg}". Eliza is off on WhatsApp, so please reply yourself.`;

function stateOf(vendor) { const s = vendor && vendor.wa_eliza_state; return s === 'on' || s === 'off' ? s : null; }
// the room's derived state: on · off · waiting (hers on or unset while the master is off)
function roomState(vendor, master) { const s = stateOf(vendor); if (s === 'off') return 'off'; return master ? 'on' : 'waiting'; }
// is this WhatsApp turn OFF for her? (the master first: absolute)
function isOff({ vendor, channel, master }) { return master === true && WA_CHANNELS.includes(channel) && stateOf(vendor) === 'off'; }

const digits = (p) => String(p || '').replace(/\D/g, '');
async function leadFor(supabase, vendorId, phone) {
  const d = digits(phone); if (!d) return null;
  const { data, error } = await supabase.from('leads').select('id, name, phone').eq('vendor_id', vendorId).is('deleted_at', null);
  if (error || !Array.isArray(data)) return null;
  return data.find((l) => digits(l.phone).slice(-10) === d.slice(-10)) || null;
}

// The OFF turn: the lead (R1), the alert decision (R2). Returns the turn's shape with no reply.
async function offTurn({ supabase, vendor, conversation, couplePhone, profileName, inboundMessage, nowMs }) {
  const out = { reply: null, silent: true, toolCalls: [{ name: 'wa_eliza_off' }], vendorNotification: null, leadName: null };
  try {
    const now = Number.isFinite(nowMs) ? nowMs : Date.now();
    let lead = await leadFor(supabase, vendor.id, couplePhone);
    if (!lead) {
      const name = typeof profileName === 'string' && profileName.trim() ? profileName.trim() : String(couplePhone || '').trim();
      const ins = await supabase.from('leads').insert({ vendor_id: vendor.id, name, phone: couplePhone, state: 'new' }).select('id, name, phone').single();
      if (!ins.error && ins.data) { lead = ins.data; out.toolCalls.push({ name: 'wa_eliza_off_lead', lead_id: ins.data.id }); }
    }
    out.leadName = lead ? lead.name : null;
    // R2: the first inbound of the thread, or the client writing after 24 hours with no reply from her since her previous message
    const { data: rows } = await supabase.from('messages').select('direction, sent_by, created_at').eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(50);
    const list = Array.isArray(rows) ? rows : [];
    const inbound = list.filter((r) => r.direction === 'inbound');
    const prevIn = inbound[1] || null; // inbound[0] is this message, stored before the turn
    let alert = false;
    if (!prevIn) alert = true;
    else {
      const prevAt = Date.parse(prevIn.created_at);
      const replied = list.some((r) => r.direction === 'outbound' && Date.parse(r.created_at) > prevAt);
      const thisAt = inbound[0] ? Date.parse(inbound[0].created_at) : now;
      if (!replied && Number.isFinite(prevAt) && thisAt - prevAt >= REMIND_MS) alert = true;
    }
    if (alert) {
      const who = (lead && lead.name) || String(couplePhone || '');
      out.vendorNotification = ALERT(who, String(inboundMessage || ''));
      out.toolCalls.push({ name: 'wa_eliza_off_alert' });
    }
  } catch (_e) { /* total: the turn stays silent */ }
  return out;
}

// THE ROOM'S TWO DOORS (the logic; src/api/vendor/solutions/whatsappEliza.js wires them), in igRoom.js's pattern:
//   GET  /api/v2/vendor/solutions/whatsapp-eliza         { ok:true, state }   state: on · off · waiting
//   POST /api/v2/vendor/solutions/whatsapp-eliza/switch  { on } → the same shape; on stamps wa_eliza_consented_at; anything but a boolean refused
async function answer(vendorId, deps) {
  try {
    const { data, error } = await deps.supabase.from('vendors').select('wa_eliza_state').eq('id', vendorId).maybeSingle();
    if (error || !data) return { status: 404, body: { ok: false } };
    return { status: 200, body: { ok: true, state: roomState(data, (await deps.master()) === true) } };
  } catch (_e) { return { status: 500, body: { ok: false } }; }
}
async function flip(vendorId, on, deps) {
  try {
    if (typeof on !== 'boolean') return { status: 400, body: { ok: false } };
    const patch = on ? { wa_eliza_state: 'on', wa_eliza_consented_at: deps.now() } : { wa_eliza_state: 'off' };
    const { error } = await deps.supabase.from('vendors').update(patch).eq('id', vendorId);
    if (error) return { status: 500, body: { ok: false } };
    return answer(vendorId, deps);
  } catch (_e) { return { status: 500, body: { ok: false } }; }
}

module.exports = { answer, flip, WA_CHANNELS, REMIND_MS, ALERT, stateOf, roomState, isOff, offTurn, leadFor };
