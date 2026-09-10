// src/lib/vendor/broadcasts.js — G4.3 · BROADCASTS TO HER PAST COUPLES (R6 rung 1).
// CE-42 seat R6, packet 4b-2. THE ONE WRITER for public.broadcasts and
// public.broadcast_recipients (0164); the receipt arm in relayStatus.js and the
// marketing inbound's branch in prospects.js CALL IN here, they write nothing of
// their own (introductions.js's shape, J1-IN).
//
// ═══ THE RULINGS IT CARRIES (CE-42 4b read-first + 4b-2 rulings) ═════════════
//   6   the list = clients with a phone ∪ weddings' couple phones ∪ weddings'
//       consent phones ∪ booked leads, de-duplicated on the LAST TEN, each row
//       carrying its source (first source wins, in that order).
//   7   the marketing line (introductions' precedent) until R9.
//   8   two templates — couple_broadcast · referral_broadcast (TEMPLATES.md 16/17).
//   9   the send writes a broadcasts row + one broadcast_recipients row per number;
//       once a year on the referral kind is the DATABASE's (0164's IST-year index).
//   10  the fee shown is the UPPER BOUND at delivery, GST included, paise shown:
//       ceil(n × marketing paise ex-GST × (1 + GST%)) — from admin_config (0163),
//       never a literal.
//   11  shown only; TDW absorbs at beta. No billing arm.
//   4b-2 (b) · a reply that is not STOP is stored on the row (replied_at, reply_text
//       appended) — her fact, not a log line; a later packet shows it to her.
//   F-42.171 · a STOP to HER broadcast sets stopped_at, her broadcasts refuse that
//       number from then on, and NO prospect is touched — so sendWa's global
//       refusal (sendWa.js, prospects only) never hears of it.
//   4b-2    a DARK attempt writes no row (the gate is read before any write, so a
//       dark referral never spends the year); a stopped number is FILED as
//       `refused_stopped`, never silently dropped.
//
// ═══ SQL PROVENANCE FOR EVERY READ BELOW (protocol §10) ═════════════════════
//   clients           PUBLIC_SCHEMA.md @0154 :239 vendor_id · :241 name · :242 phone · :249 deleted_at
//   weddings          :1486 owner_vendor_id · :1497 couple_id · :1500 consent_phone
//   couples           :483 id · :484 user_id
//   users             :1235 id · :1236 phone · :1237 name
//   leads             :825 vendor_id · :826 name · :827 phone · :836 state ('booked', src/api/vendor/leads.js:91) · :842 deleted_at
//   admin_config      :43–:48 key · value
//   broadcasts / broadcast_recipients — 0164 statements 1–2 (their own witness)
'use strict';

const cap = require('../capabilities');
const { TEMPLATES } = require('../templates');
const { normalizePhone, e164FromLastTen } = require('../couple/assistance');
const { siteBase } = require('./creditInvite');

const KINDS = Object.freeze({
  couple:   { templateKey: 'couple_broadcast',   capKey: cap.CAPABILITY_KEYS.COUPLE_BROADCAST },
  referral: { templateKey: 'referral_broadcast', capKey: cap.CAPABILITY_KEYS.REFERRAL_BROADCAST },
});

const SOURCE_ORDER = Object.freeze(['client', 'wedding_couple', 'wedding_consent', 'booked_lead']);
const REACHED = Object.freeze(new Set(['sent', 'sent_no_wamid', 'delivered', 'read']));
const FEE_KEYS = Object.freeze({ paise: 'meta.marketing_paise_ex_gst', gst: 'meta.gst_percent' });
const IST_OFFSET_MS = 330 * 60 * 1000;

// ── THE LIST ─────────────────────────────────────────────────────────────────
/**
 * Every past couple of hers with a number, de-duplicated on the last ten.
 * Returns [{ lastTen, name, source }] in SOURCE_ORDER's precedence.
 */
async function pastCouples(supabase, vendorId) {
  const found = new Map();
  const add = (phone, name, source) => {
    const ten = normalizePhone(phone);
    if (!ten) return;
    const prev = found.get(ten);
    if (!prev) { found.set(ten, { lastTen: ten, name: (name && String(name).trim()) || null, source }); return; }
    if (!prev.name && name && String(name).trim()) prev.name = String(name).trim();
  };

  const clients = await supabase.from('clients')
    .select('name, phone').eq('vendor_id', vendorId).is('deleted_at', null).not('phone', 'is', null);
  if (clients.error) throw new Error(`clients: ${clients.error.message}`);
  for (const r of clients.data || []) add(r.phone, r.name, 'client');

  const weds = await supabase.from('weddings')
    .select('couple_id, consent_phone').eq('owner_vendor_id', vendorId);
  if (weds.error) throw new Error(`weddings: ${weds.error.message}`);
  const coupleIds = [...new Set((weds.data || []).map((w) => w.couple_id).filter(Boolean))];
  if (coupleIds.length) {
    const cs = await supabase.from('couples').select('id, user_id').in('id', coupleIds);
    if (cs.error) throw new Error(`couples: ${cs.error.message}`);
    const userIds = [...new Set((cs.data || []).map((c) => c.user_id).filter(Boolean))];
    if (userIds.length) {
      const us = await supabase.from('users').select('id, phone, name').in('id', userIds);
      if (us.error) throw new Error(`users: ${us.error.message}`);
      for (const u of us.data || []) add(u.phone, u.name, 'wedding_couple');
    }
  }
  for (const w of weds.data || []) if (w.consent_phone) add(w.consent_phone, null, 'wedding_consent');

  const leads = await supabase.from('leads')
    .select('name, phone').eq('vendor_id', vendorId).eq('state', 'booked').is('deleted_at', null).not('phone', 'is', null);
  if (leads.error) throw new Error(`leads: ${leads.error.message}`);
  for (const r of leads.data || []) add(r.phone, r.name, 'booked_lead');

  return [...found.values()];
}

/** The last-tens that told HER stop (F-42.171). */
async function stoppedFor(supabase, vendorId) {
  const { data, error } = await supabase.from('broadcast_recipients')
    .select('phone').eq('vendor_id', vendorId).not('stopped_at', 'is', null);
  if (error) throw new Error(`broadcast_recipients: ${error.message}`);
  return new Set((data || []).map((r) => normalizePhone(r.phone)).filter(Boolean));
}

// ── THE FEE (ruling 10) ──────────────────────────────────────────────────────
/** A decimal string to an integer at `scale` decimal places, or null. */
function scaled(v, scale) {
  const s = String(v == null ? '' : v).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [i, f = ''] = s.split('.');
  if (f.length > scale) return null;
  return BigInt(i + f.padEnd(scale, '0'));
}

/**
 * The upper bound in WHOLE PAISE: ceil(n × paiseExGst × (1 + gst/100)).
 * Integer arithmetic throughout (BigInt), so 1 × 86.31 × 1.18 is 101.8458 → 102,
 * never a float's 101.84579999. Returns null if either config value is unreadable.
 */
function feePaise(n, paiseExGst, gstPercent) {
  const p = scaled(paiseExGst, 4);   // paise × 10^4
  const g = scaled(gstPercent, 2);   // percent × 10^2
  if (p == null || g == null || !Number.isInteger(n) || n < 0) return null;
  const num = BigInt(n) * p * (10000n + g);   // (paise×10^4) × (10^4 + gst×10^2) = paise × 10^8 × (1 + gst/100)
  const den = 100000000n;
  return Number(num / den + (num % den > 0n ? 1n : 0n));
}

async function readFeeConfig(supabase) {
  const { data, error } = await supabase.from('admin_config')
    .select('key, value').in('key', [FEE_KEYS.paise, FEE_KEYS.gst]);
  if (error) throw new Error(`admin_config: ${error.message}`);
  const m = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return { paiseExGst: m[FEE_KEYS.paise], gstPercent: m[FEE_KEYS.gst] };
}

// ── ONCE A YEAR (the database's rule; this only reads it) ────────────────────
function istYear(now = Date.now()) { return new Date(now + IST_OFFSET_MS).getUTCFullYear(); }
function istYearStartIso(year) { return new Date(Date.UTC(year, 0, 1) - IST_OFFSET_MS).toISOString(); }

/** 'YYYY-MM-DD' of the next IST year's first day if she already sent one this year, else null. */
async function referralNext(supabase, vendorId, now = Date.now()) {
  const y = istYear(now);
  const { data, error } = await supabase.from('broadcasts')
    .select('id').eq('vendor_id', vendorId).eq('kind', 'referral').gte('created_at', istYearStartIso(y)).limit(1);
  if (error) throw new Error(`broadcasts: ${error.message}`);
  return (data || []).length ? `${y + 1}-01-01` : null;
}

/** The body she approves, filled from the registry's own words (never a paraphrase). */
function filledBody(kind, vendor) {
  const t = TEMPLATES[KINDS[kind].templateKey];
  return t.body.replace('{{1}}', String(vendor.business_name || '').trim());
}

// ── THE PREVIEW (what the screen draws before Send) ──────────────────────────
async function preview(supabase, vendor, deps = {}) {
  const now = deps.now || Date.now();
  const all = await pastCouples(supabase, vendor.id);
  const stopped = await stoppedFor(supabase, vendor.id);
  const sendable = all.filter((c) => !stopped.has(c.lastTen));
  const cfg = await readFeeConfig(supabase);
  const fee = feePaise(sendable.length, cfg.paiseExGst, cfg.gstPercent);
  const capFn = (deps.cap && deps.cap.on) || cap.on;
  return {
    count: sendable.length,
    couples: sendable.map((c) => ({ name: c.name, last4: c.lastTen.slice(-4), source: c.source })),
    stopped_count: all.length - sendable.length,
    fee_paise: fee,
    bodies: { couple: filledBody('couple', vendor), referral: filledBody('referral', vendor) },
    // The button as Meta holds it — the REGISTRY's label, sent on the wire so the pwa
    // keeps no second spelling (F-42.110's class). null without a handle: the door
    // refuses the send then anyway (no_address).
    button_label: TEMPLATES[KINDS.couple.templateKey].button.text,
    page_url: vendor.routing_handle ? `${siteBase()}/v/${vendor.routing_handle}` : null,
    on: { couple: capFn(KINDS.couple.capKey) === true, referral: capFn(KINDS.referral.capKey) === true },
    referral_next: await referralNext(supabase, vendor.id, now),
  };
}

// ── THE SEND ─────────────────────────────────────────────────────────────────
/**
 * Returns { ok:true, broadcast_id, sent, not_delivered, refused_stopped } or a
 * refusal { ok:false, code } — dark · no_address · already_this_year · no_couples ·
 * fee_unavailable. Nothing is written before the gate, the year and the fee pass.
 */
async function sendBroadcast(supabase, { vendor, kind }, deps = {}) {
  if (!KINDS[kind]) return { ok: false, code: 'bad_kind' };
  const capFn = (deps.cap && deps.cap.on) || cap.on;
  const reasonFn = (deps.cap && deps.cap.reason) || cap.reason;
  const { templateKey, capKey } = KINDS[kind];

  if (capFn(capKey) !== true) {
    console.log(`[broadcast] vendor=${vendor.id} kind=${kind} status=dark — NOT SENT: ${reasonFn ? reasonFn(capKey) : capKey + ' is off'}`);
    return { ok: false, code: 'dark' };
  }
  const code = String(vendor.routing_handle || '').trim();
  if (!code) return { ok: false, code: 'no_address' };
  if (kind === 'referral' && await referralNext(supabase, vendor.id, deps.now || Date.now())) {
    return { ok: false, code: 'already_this_year' };
  }

  const all = await pastCouples(supabase, vendor.id);
  const stopped = await stoppedFor(supabase, vendor.id);
  const sendable = all.filter((c) => !stopped.has(c.lastTen));
  if (!sendable.length) return { ok: false, code: 'no_couples' };
  const cfg = await readFeeConfig(supabase);
  if (feePaise(sendable.length, cfg.paiseExGst, cfg.gstPercent) == null) return { ok: false, code: 'fee_unavailable' };

  const ins = await supabase.from('broadcasts').insert({
    vendor_id: vendor.id, kind, template_name: TEMPLATES[templateKey].name, recipient_count: sendable.length,
  }).select('id').single();
  if (ins.error) {
    // 23505 on uq_broadcasts_referral_year: a second referral raced past the read above.
    if (ins.error.code === '23505') return { ok: false, code: 'already_this_year' };
    throw new Error(`broadcasts insert: ${ins.error.message}`);
  }
  const broadcastId = ins.data.id;

  let refusedStopped = 0;
  for (const c of all.filter((x) => stopped.has(x.lastTen))) {
    await supabase.from('broadcast_recipients').insert({
      broadcast_id: broadcastId, vendor_id: vendor.id, phone: e164FromLastTen(c.lastTen), source: c.source, status: 'refused_stopped',
    });
    console.log(`[broadcast] id=${broadcastId} to=…${c.lastTen.slice(-4)} NOT SENT: she told this vendor STOP (F-42.171)`);
    refusedStopped++;
  }

  const sendWaFn = deps.sendWa || require('../sendWa').sendWa;
  let sent = 0, notDelivered = 0;
  for (const c of sendable) {
    const phone = e164FromLastTen(c.lastTen);
    const r = await supabase.from('broadcast_recipients').insert({
      broadcast_id: broadcastId, vendor_id: vendor.id, phone, source: c.source, status: 'queued',
    }).select('id').single();
    if (r.error) throw new Error(`broadcast_recipients insert: ${r.error.message}`);
    const rowId = r.data.id;
    try {
      // AN OBJECT, NEVER AN ARRAY (F-41.123): the button's suffix is read by its own name.
      const out = await sendWaFn({
        line: 'marketing', to: phone, templateKey,
        vars: { vendor_name: vendor.business_name, page_code: code },
        supabase, site: 'broadcast', ctx: `broadcast=${broadcastId}`,
      });
      const ok = !!(out && out.sent === true);
      const wamid = ok && out.result && out.result.wamid ? String(out.result.wamid) : null;
      await supabase.from('broadcast_recipients').update({
        status: ok ? (wamid ? 'sent' : 'sent_no_wamid') : 'failed', wamid,
        error_code: ok ? null : String((out && (out.error_code || out.refusal)) || 'unknown'),
        error_title: ok ? null : (out && out.error_title ? String(out.error_title) : null),
        updated_at: new Date().toISOString(),
      }).eq('id', rowId);
      console.log(`[broadcast] id=${broadcastId} to=…${c.lastTen.slice(-4)} ${ok ? `wamid=${wamid}` : 'NOT DELIVERED'}`);
      if (ok) sent++; else notDelivered++;
    } catch (e) {
      const msg = String((e && e.message) || 'threw');
      await supabase.from('broadcast_recipients').update({
        status: 'failed', error_code: String((e && e.code) || 'threw'), error_title: msg, updated_at: new Date().toISOString(),
      }).eq('id', rowId);
      console.error(`[broadcast] id=${broadcastId} to=…${c.lastTen.slice(-4)} threw: ${msg}`);
      notDelivered++;
    }
  }
  return { ok: true, broadcast_id: broadcastId, sent, not_delivered: notDelivered, refused_stopped: refusedStopped };
}

// ═══ THE INBOUND ARM (F-42.171, J1-IN r2's shape) ═══════════════════════════
// Called from prospects.js's marketing inbound ABOVE the STOP arm, only when no
// introduction matched. A READ identifies her; nothing here mints a prospect.

/** The most recent recipient row that actually reached this number, or null. */
async function matchInboundBroadcast(supabase, fromPhone) {
  const ten = normalizePhone(fromPhone);
  if (!ten) return null;
  try {
    const { data, error } = await supabase.from('broadcast_recipients')
      .select('id, broadcast_id, vendor_id, phone, status, stopped_at, replied_at, reply_text, created_at')
      .like('phone', `%${ten}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) { console.error(`[broadcast:in] match FAILED for …${ten.slice(-4)}: ${error.message} — falling through`); return null; }
    const reached = (data || []).filter((r) => REACHED.has(r.status));
    return reached.length ? reached[0] : null;
  } catch (e) {
    console.error(`[broadcast:in] match THREW for …${ten.slice(-4)}: ${(e && e.message) || e} — falling through`);
    return null;
  }
}

/**
 * STOP → stopped_at on her rows for THIS vendor; NEVER falls through (the prospect
 * STOP arm would mint a prospect and opt her out across every line — sendWa.js's
 * global refusal — silencing this vendor's own contract and payment messages).
 * Anything else → RECORDED ON THE ROW (ruling (b)): replied_at = now, reply_text
 * APPENDED in arrival order (never overwritten — every reply is her fact); plain
 * text, no figure parsed. The lane carries on ONLY for a live Closer conversation.
 */
async function recordReply(supabase, row, text) {
  const t = String(text || '').trim();
  if (!t) return;
  const now = new Date().toISOString();
  const reply_text = row.reply_text ? `${row.reply_text}\n${t}` : t;
  const { error } = await supabase.from('broadcast_recipients')
    .update({ replied_at: now, reply_text, updated_at: now }).eq('id', row.id);
  if (error) throw new Error(error.message);
}

async function applyBroadcastInbound(supabase, { row, text, isStop, prospect }) {
  const state = prospect && prospect.state;
  const live = state === 'replied' || state === 'in_session';
  try {
    if (isStop) {
      const now = new Date().toISOString();
      const { error } = await supabase.from('broadcast_recipients')
        .update({ stopped_at: now, updated_at: now })
        .eq('vendor_id', row.vendor_id).like('phone', `%${normalizePhone(row.phone)}`).is('stopped_at', null);
      if (error) throw new Error(error.message);
      console.log(`[broadcast:in] recipient=${row.id} vendor=${row.vendor_id} STOP — her broadcasts refuse this number; no prospect touched`);
      return { action: 'broadcast_stopped', recipientId: row.id, vendorId: row.vendor_id, fallThrough: false };
    }
    await recordReply(supabase, row, text);
    if (row.stopped_at) {
      console.log(`[broadcast:in] recipient=${row.id} inbound after STOP — recorded on the row, silence`);
      return { action: 'broadcast_reply_after_stop', recipientId: row.id, vendorId: row.vendor_id, fallThrough: false };
    }
    console.log(`[broadcast:in] recipient=${row.id} vendor=${row.vendor_id} reply recorded on the row`);
    return { action: 'broadcast_reply', recipientId: row.id, vendorId: row.vendor_id, prospectState: state || null, fallThrough: live };
  } catch (e) {
    console.error(`[broadcast:in] recipient=${row.id} THREW after match: ${(e && e.message) || e} — her reply is NOT stored and must be recovered by hand; no prospect created`);
    return { action: 'broadcast_failed', recipientId: row.id, vendorId: row.vendor_id, error: String((e && e.message) || e), fallThrough: false };
  }
}

module.exports = {
  KINDS, SOURCE_ORDER, FEE_KEYS, REACHED,
  pastCouples, stoppedFor, scaled, feePaise, readFeeConfig, istYear, istYearStartIso, referralNext,
  filledBody, preview, sendBroadcast, matchInboundBroadcast, recordReply, applyBroadcastInbound,
};
