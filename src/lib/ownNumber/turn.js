'use strict';
// src/lib/ownNumber/turn.js · CE-46 · G6-2 · 2b · A COUPLE WRITES TO HER OWN NUMBER, AND TDW ANSWERS ON IT.
//
// THE CALLER of ELZ-2's channel-aware couple turn (CE-46 joint ruling, 27 September 2026). The turn COMPOSES; this
// file does everything else, in this order, each step ruled:
//   1 · parse       one text message from the forwarded change (value.messages[]); anything else stays recorded in
//                   vendor_wa_events by the receiver and gets no turn here (named in the handover).
//   2 · the gate    door.js openFor, the ONE gate (F7 (a)): 'on' and her tier's row 'on' (or walk mode), and her number
//                   'active'. Shut -> nothing more: recorded and silent (F8 (a)).
//   3 · senders     silent, recorded only by the receiver, never a couple thread:
//                     her own login phone writing to her own number (F5 (a));
//                     a registered vendor, by users.phone joined to vendors.user_id (cut three (b), F-44.196's vendor limb);
//                     any of TDW's own line numbers, resolved as sendWa.resolveFrom does (F-44.207 (a));
//                     a member of her team, by phone, from team_members (F4, crew only; supplier, vendor and family have
//                     no source and are their own later item).
//   4 · the thread  ONE couple_thread per couple per vendor, found by vendor_id + counterparty_phone + kind, the shared
//                   line's own key and its own phone form ('+' + Meta's from, vendorInbound.metaInputsFrom); created the
//                   shared line's way if absent. Its channel stays 'whatsapp'; no migration (F1 (a)). The inbound row
//                   is stamped channel 'whatsapp_own' with message_sid = the wamid: the UNIQUE index is this route's
//                   dedupe home, a redelivery stops at 23505.
//   5 · quiet time  vendors.reply_quiet_minutes, the one home (0173). Silent while her own latest reply to this couple is
//                   newer than that: a WhatsApp Business echo to this number (vendor_wa_events kind 'echo', its time and
//                   recipient only) or a relay she sent through TDW on this thread (messages sent_by 'vendor_relay').
//                   Applied BEFORE the turn (joint ruling 1). A failed read is treated as quiet: never talk over her.
//   6 · one bit     chatted_before: true when her private synced history (vendor_wa_events kind 'history') holds a
//                   thread with this sender's number. NO text, NO timestamp, nothing else leaves the store (F3 (b), the
//                   founder's Q4). A failed read is false.
//   7 · the turn    ELZ-2's turn, its signature as pinned in TDW_CE46_ELZ2_CUT1_HANDOVER.md §1 (dc1dfd1): the shared
//                   line's own arguments plus counterparty { channel: 'whatsapp_own', phone, igsid: null, chatted_before }.
//                   Nothing else is added. The persona gate on this channel is the turn's (engine.js reads
//                   couple.eliza_enabled on every channel but Instagram); this caller does not touch it.
//   8 · the send    from her number, with her stored business token (send.js, token.js; cut three (a), T-c removed).
//                   Each part recorded as an outbound row, channel 'whatsapp_own',
//                   message_sid its wamid. A failed send is a dead letter and no row: never a false "sent".
//   9 · the notice  the turn's vendorNotification to her TDW WhatsApp, through the shared line's own door
//                   (sendVendorEnquiryAlert), scrubbed by the shared line's own scrubModelFrame.
// No draft auto-send runs here: the shared line's arrivalAutoSend reads TDW's line's window, which her number does not open.
const { toE164 } = require('../phone');
const door = require('./door');

const digits = (x) => String(x == null ? '' : x).replace(/\D/g, '');
const QUIET = [60, 120, 240, 480];

/** Pure: the first text message in a forwarded change, or null. */
function textMessageOf(change) {
  const value = (change && change.value) || {};
  const m = Array.isArray(value.messages) ? value.messages[0] : null;
  if (!m || m.type !== 'text' || !m.from || !m.id || !m.text || typeof m.text.body !== 'string' || !m.text.body.trim()) return null;
  const contact = Array.isArray(value.contacts) ? value.contacts[0] : null;
  return {
    from: String(m.from),
    wamid: String(m.id),
    body: m.text.body,
    profileName: (contact && contact.profile && typeof contact.profile.name === 'string') ? contact.profile.name : null,
  };
}

/** Pure: TDW's own line numbers as digits, from sendWa.resolveFrom (F-44.207 (a)). */
function tdwLineDigits(resolveFrom) {
  return ['vendor', 'bride', 'marketing'].map((l) => digits(resolveFrom(l))).filter((d) => d.length >= 10);
}

// CE-46 G6-3 cut three (b), F-44.196's vendor limb (ruled 28 September 2026): a sender who is a REGISTERED VENDOR (her phone on a
// users row that a vendors row names as user_id) is silent by source, before any couple thread or ensureCoupleRow. Not "any user":
// couples are users too, and a returning bride must keep her turn. The rule's source is 0028_pin_auth.sql's trigger (a vendor's
// user can never be a couple). Specimen: 28 September 10:46, a co-founder's second number reached ensureCoupleRow and failed
// "already registered as vendor". Supplier and family limbs stay open: no source.
async function isRegisteredVendor({ supabase, senderDigits }) {
  const forms = [`+${senderDigits}`, senderDigits];
  if (senderDigits.length === 12 && senderDigits.startsWith('91')) forms.push(senderDigits.slice(2)); // a bare Indian mobile
  const u = await supabase.from('users').select('id').in('phone', forms);
  if (u && u.error) throw new Error(`users read: ${u.error.message}`);
  const ids = ((u && u.data) || []).map((r) => r && r.id).filter(Boolean);
  if (!ids.length) return false;
  const v = await supabase.from('vendors').select('id').in('user_id', ids).limit(1);
  if (v && v.error) throw new Error(`vendors read: ${v.error.message}`);
  return ((v && v.data) || []).length > 0;
}

async function senderKind({ supabase, vendor, senderDigits, resolveFrom }) {
  if (tdwLineDigits(resolveFrom).includes(senderDigits)) return 'tdw_line';
  const u = await supabase.from('users').select('id, phone').eq('id', vendor.user_id).maybeSingle();
  if (u && u.data && digits(toE164(u.data.phone)) === senderDigits) return 'self';
  if (await isRegisteredVendor({ supabase, senderDigits })) return 'vendor';
  const t = await supabase.from('team_members').select('phone').eq('vendor_id', vendor.id).is('deleted_at', null);
  if (t && t.error) throw new Error(`team_members read: ${t.error.message}`);
  if (((t && t.data) || []).some((r) => r && r.phone && digits(toE164(r.phone)) === senderDigits)) return 'crew';
  return 'couple';
}

async function isQuiet({ supabase, vendor, thread, senderDigits, now }) {
  const minutes = QUIET.includes(vendor.reply_quiet_minutes) ? vendor.reply_quiet_minutes : 120;
  const cutoff = new Date(now().getTime() - minutes * 60_000).toISOString();
  try {
    for (const to of [senderDigits, `+${senderDigits}`]) {
      const e = await supabase.from('vendor_wa_events').select('received_at')
        .eq('vendor_id', vendor.id).eq('kind', 'echo').gte('received_at', cutoff)
        .contains('payload', { message_echoes: [{ to }] }).limit(1);
      if (e.error) throw new Error(e.error.message);
      if ((e.data || []).length) return true;
    }
    const r = await supabase.from('messages').select('id')
      .eq('conversation_id', thread.id).eq('direction', 'outbound').eq('sent_by', 'vendor_relay').gte('created_at', cutoff).limit(1);
    if (r.error) throw new Error(r.error.message);
    return (r.data || []).length > 0;
  } catch (e) {
    console.warn(`[own-number] ${vendor.id} quiet-time read failed, staying quiet: ${e && e.message}`);
    return true;
  }
}

async function chattedBefore({ supabase, vendorId, senderDigits }) {
  try {
    for (const id of [senderDigits, `+${senderDigits}`]) {
      const h = await supabase.from('vendor_wa_events').select('id')
        .eq('vendor_id', vendorId).eq('kind', 'history')
        .contains('payload', { history: [{ threads: [{ id }] }] }).limit(1);
      if (h.error) throw new Error(h.error.message);
      if ((h.data || []).length) return true;
    }
    return false;
  } catch (e) {
    console.warn(`[own-number] ${vendorId} history read failed, chatted_before false: ${e && e.message}`);
    return false;
  }
}

async function findOrCreateThread({ supabase, vendorId, phone, ensureCoupleRow, profileName }) {
  const found = await supabase.from('conversations').select('*')
    .eq('vendor_id', vendorId).eq('counterparty_phone', phone).eq('kind', 'couple_thread').maybeSingle();
  if (found.error) throw new Error(`couple_thread read: ${found.error.message}`);
  const ids = await ensureCoupleRow(supabase, phone, profileName);
  if (found.data) return { thread: found.data, coupleId: ids && ids.couple_id };
  const ins = await supabase.from('conversations').insert({
    vendor_id: vendorId, counterparty_phone: phone, counterparty_user_id: ids && ids.user_id,
    kind: 'couple_thread', state: 'new', mode: 'auto',
  }).select('*').single();
  if (ins.error || !ins.data) throw new Error(`couple_thread insert: ${ins.error ? ins.error.message : 'no row'}`);
  return { thread: ins.data, coupleId: ids && ids.couple_id };
}

function defaults(deps) {
  return {
    capApi: deps.capApi || require('../capabilities'),
    resolveFrom: deps.resolveFrom || require('../sendWa').resolveFrom,
    ensureCoupleRow: deps.ensureCoupleRow || require('../coupleIdentity').ensureCoupleRow,
    runTurn: deps.runTurn || require('../../agent/engine').runCoupleAgenticTurn,
    sendOnHerNumber: deps.sendOnHerNumber || require('./send').sendOnHerNumber,
    sendVendorEnquiryAlert: deps.sendVendorEnquiryAlert || require('../vendor/enquiryAlert').sendVendorEnquiryAlert,
    scrubModelFrame: deps.scrubModelFrame || require('../vendorInbound').scrubModelFrame,
    captureDeadLetter: deps.captureDeadLetter || require('../webhookCore').captureDeadLetter,
    leadsLink: deps.leadsLink || require('../pwaPaths').vendorUrl('leads'),
    now: deps.now || (() => new Date()),
  };
}

async function _handle({ supabase, anthropic, vendorId, change, env, d, msg }) {
  const senderDigits = digits(msg.from);
  const phone = `+${senderDigits}`; // the shared line's own counterparty form (vendorInbound.metaInputsFrom)

  // 2 · the gate
  const w = await supabase.from('vendor_wabas').select('vendor_id, business_id, phone_number_id, status, business_token').eq('vendor_id', vendorId).maybeSingle();
  if (w.error) throw new Error(`vendor_wabas read: ${w.error.message}`);
  const v = await supabase.from('vendors').select('*').eq('id', vendorId).maybeSingle();
  if (v.error) throw new Error(`vendors read: ${v.error.message}`);
  const row = w.data; const vendor = v.data;
  if (!row || !vendor) return { outcome: 'closed', reason: 'no number or no vendor' };
  const masterRow = await d.capApi.get(door.MASTER);
  const tk = door.tierKey(vendor.tier);
  const tierRow = tk ? await d.capApi.get(tk) : null;
  const gate = door.openFor({ masterRow, tierRow, vendorId, env, status: row.status });
  if (!gate.open) { console.log(`[own-number] ${vendorId} silent: ${gate.reason}`); return { outcome: 'closed', reason: gate.reason }; }

  // 3 · senders that are not couples
  const kind = await senderKind({ supabase, vendor, senderDigits, resolveFrom: d.resolveFrom });
  if (kind !== 'couple') { console.log(`[own-number] ${vendorId} silent for a ${kind} sender`); return { outcome: kind }; }

  // 4 · the one thread, and her words on it
  const { thread, coupleId } = await findOrCreateThread({ supabase, vendorId, phone, ensureCoupleRow: d.ensureCoupleRow, profileName: msg.profileName });
  const inb = await supabase.from('messages').insert({
    conversation_id: thread.id, direction: 'inbound', channel: 'whatsapp_own', body: msg.body, sent_by: 'couple', message_sid: msg.wamid,
  });
  if (inb && inb.error) {
    if (inb.error.code === '23505') { console.log(`[own-number] dup wamid ${msg.wamid}, skipping`); return { outcome: 'duplicate' }; }
    throw new Error(`inbound row: ${inb.error.message}`);
  }
  const touch = () => supabase.from('conversations').update({ last_message_at: d.now().toISOString() }).eq('id', thread.id);

  // 5 · quiet time, before the turn
  if (await isQuiet({ supabase, vendor, thread, senderDigits, now: d.now })) { await touch(); return { outcome: 'quiet' }; }

  // 6 · the one bit
  const chatted_before = (await chattedBefore({ supabase, vendorId, senderDigits })) === true;

  // 7 · the turn
  const vu = await supabase.from('users').select('*').eq('id', vendor.user_id).maybeSingle();
  const vendorUser = (vu && vu.data) || null;
  const result = await d.runTurn({
    vendor, vendorUser, conversation: thread, couplePhone: phone, coupleId, inboundMessage: msg.body, supabase, anthropic,
    counterparty: { channel: 'whatsapp_own', phone, igsid: null, chatted_before },
  });
  const reply = result && typeof result.reply === 'string' ? result.reply : '';
  if (!reply.trim()) { await touch(); return { outcome: 'no_reply' }; }

  // 8 · the send, from her number, and its record
  let sent;
  try {
    sent = await d.sendOnHerNumber({ row, to: phone, text: reply, supabase, env });
  } catch (e) {
    console.error(`[own-number] ${vendorId} send to ${phone} failed: ${e && e.message}`);
    await d.captureDeadLetter({ supabase, service: 'own-number-turn', phone, payload: { vendor_id: vendorId, change }, error: e });
    await touch();
    return { outcome: 'send_failed' };
  }
  for (let i = 0; i < sent.length; i++) {
    const o = await supabase.from('messages').insert({
      conversation_id: thread.id, direction: 'outbound', channel: 'whatsapp_own', body: sent[i].text, sent_by: 'agent',
      message_sid: sent[i].wamid, tool_calls: i === 0 ? ((result && result.toolCalls) || null) : null,
    });
    if (o && o.error) console.error(`[own-number] ${vendorId} outbound row not recorded (wamid ${sent[i].wamid}): ${o.error.message}`);
  }

  // 9 · the vendor's notice, to her TDW WhatsApp
  if (result && result.vendorNotification && vendorUser && vendorUser.phone) {
    await d.sendVendorEnquiryAlert({
      toPhone: vendorUser.phone,
      text: d.scrubModelFrame(result.vendorNotification, msg.body, { supabase, vendorId, surface: 'whatsapp', ctx: 'ownNumber:notification' }),
      vendorName: vendorUser.name, brideName: result.leadName, link: d.leadsLink, brideMessage: msg.body,
      supabase, vendorId, ctx: 'ownNumber:notification',
    });
  }
  await touch();
  return { outcome: 'sent', parts: sent.length, chatted_before };
}

/**
 * The route's one call. Never throws: a failure is logged and dead-lettered, and her message stays recorded
 * (the receiver wrote it to vendor_wa_events before forwarding).
 */
async function handleOwnInbound({ supabase, anthropic, vendorId, change, env = process.env }, deps = {}) {
  const msg = textMessageOf(change);
  if (!vendorId || !msg) return { outcome: 'not_text' };
  const d = defaults(deps);
  const { withTurnLock, turnKey } = require('../turnLock');
  return withTurnLock(turnKey('own', `${vendorId}:${digits(msg.from)}`), async () => {
    try {
      return await _handle({ supabase, anthropic, vendorId, change, env, d, msg });
    } catch (e) {
      console.error(`[own-number] ${vendorId} turn failed: ${e && e.message}`);
      try { await d.captureDeadLetter({ supabase, service: 'own-number-turn', phone: `+${digits(msg.from)}`, payload: { vendor_id: vendorId, change }, error: e }); } catch (_e) { /* logged above */ }
      return { outcome: 'error' };
    }
  });
}

module.exports = { handleOwnInbound, textMessageOf, tdwLineDigits, senderKind, isRegisteredVendor, isQuiet, chattedBefore };
