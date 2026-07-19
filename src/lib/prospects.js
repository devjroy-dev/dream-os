// src/lib/prospects.js — the prospect-lane state machine (Block 05, P3).
//
// STATES (0085 CHECK): cold → templated → replied → in_session → {expired | converted}, plus
// opted_out (terminal, cross-line). No AI calls here (W-1): an in-session prospect gets a single
// free-form holding line (prospectCopy.holding_line); 06's Closer soul slots in at THIS seam with
// zero transport change.
//
// TRANSPORT: sends go through the real sendWa gate. The caller (marketingIndex, or the bench)
// passes `sendWa` + `sendWaDeps`; the marketing line's free-form + template both ride Meta Cloud
// API (metaCloud) because MARKETING_WHATSAPP_NUMBER is a Meta phone-number-id, not a Twilio number.
// With no injected deps, sendWa's Meta defaults apply (creds-gated — Movement B).
//
// DISCLOSED WINDOW MODEL: WhatsApp's 24h customer-service window is ROLLING — each inbound reopens
// it. session_opened_at is therefore treated as the session's activity anchor: stamped when the
// session opens AND re-stamped on each subsequent inbound. Expiry = in_session AND now − anchor >
// 24h. This is a deliberate reading of the spec's "24h past last inbound" within the ruled column
// set (no last_inbound_at column exists); named in the handover.
'use strict';

const { sendWa: realSendWa } = require('./sendWa');
const { normalizeTo } = require('./metaCloud');
const { getProspectCopy } = require('./prospectCopy');

const HOLDING_LINE_KEY = 'holding_line';
const OPT_OUT_CONFIRM_KEY = 'opt_out_confirmation';
const OPENER_TEMPLATE_KEY = 'marketing_opener';
const DEFAULT_DAILY_CAP = 25;
const WINDOW_HOURS = 24;

// ── opt-out / opt-in words (pre-engine, no model cost) ───────────────────────
// Meta's own stop set plus the spec's STOP/UNSUBSCRIBE. Matched on the trimmed, upper-cased,
// punctuation-stripped first token so "Stop.", "STOP!", "unsubscribe" all catch.
const STOP_WORDS  = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'STOPALL']);
const START_WORDS = new Set(['START', 'UNSTOP', 'RESUME']);

function _firstToken(text) {
  return String(text || '').trim().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/)[0]?.toUpperCase() || '';
}
function isStopWord(text)  { return STOP_WORDS.has(_firstToken(text)); }
function isStartWord(text) { return START_WORDS.has(_firstToken(text)); }

// ── daily cap (admin_config: marketing.daily_template_cap, JSON-in-text, default 25) ─────────
// Mirrors modelRouter's defensive JSON.parse (admin_config.value is TEXT). Any junk → default.
async function readDailyCap(supabase) {
  if (!supabase) return DEFAULT_DAILY_CAP;
  try {
    const { data } = await supabase
      .from('admin_config').select('value').eq('key', 'marketing.daily_template_cap').maybeSingle();
    if (!data || data.value == null) return DEFAULT_DAILY_CAP;
    const parsed = JSON.parse(String(data.value)); // '25' → 25
    const n = Number(parsed);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_DAILY_CAP;
  } catch (_e) {
    return DEFAULT_DAILY_CAP;
  }
}

// ── prospect row helpers ─────────────────────────────────────────────────────
async function findProspectByPhone(supabase, phone) {
  const { data } = await supabase
    .from('prospects').select('*').eq('phone', normalizeTo(phone)).maybeSingle();
  return data || null;
}

// Inbound may arrive from a number we never templated (a cold DM). Create it fail-safe so an
// opt-out from ANY number is honoured and a reply always has a row to advance.
async function findOrCreateProspectByPhone(supabase, phone, seed = {}) {
  const existing = await findProspectByPhone(supabase, phone);
  if (existing) return existing;
  const row = {
    phone: normalizeTo(phone),
    name: seed.name || null,
    source: seed.source || 'other',
    state: seed.state || 'cold',
  };
  const { data, error } = await supabase.from('prospects').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

async function updateProspect(supabase, id, patch) {
  const { data, error } = await supabase
    .from('prospects')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

// Open (or fetch) the prospect_marketing conversation, keyed by prospect_id (0085's owner model).
async function openProspectConversation(supabase, prospect) {
  const { data: existing } = await supabase
    .from('conversations').select('*')
    .eq('prospect_id', prospect.id).eq('kind', 'prospect_marketing').maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase.from('conversations').insert({
    prospect_id: prospect.id,          // 1-of-3 owner (vendor_id / couple_id / prospect_id)
    counterparty_phone: prospect.phone,
    kind: 'prospect_marketing',
    state: 'active',
    mode: 'live',
  }).select('*').single();
  if (error) throw error;
  return data;
}

async function logMessage(supabase, conversationId, { direction, body, sentBy }) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    direction,
    channel: 'whatsapp',
    body: body || null,
    sent_by: sentBy,
  });
}

// ── the inbound orchestrator ─────────────────────────────────────────────────
// Returns a result object describing the transition (for logs/tests). Never throws on a normal
// send refusal — a typed sendWa error is caught and surfaced in the result, never silently eaten.
async function handleMarketingInbound({ supabase, from, text, messageId, sendWa, sendWaDeps, copy }) {
  const _sendWa = sendWa || realSendWa;
  const _deps   = sendWaDeps || {};
  const _copy   = copy || getProspectCopy;
  const phone   = normalizeTo(from);
  const now     = new Date().toISOString();

  // ── STOP → opt out (cross-line), then send the ONE courtesy confirmation ──────────────────
  if (isStopWord(text)) {
    const prospect = await findOrCreateProspectByPhone(supabase, phone);
    // Record opt-out FIRST so future sends are blocked even if the confirmation send fails.
    await updateProspect(supabase, prospect.id, { state: 'opted_out' });
    // The confirmation itself must go out THROUGH the now-opted-out gate — a single deliberate,
    // documented bypass for the opt-out acknowledgement only (isOptedOut → false for this send).
    let confirmSent = false, confirmError = null;
    try {
      await _sendWa(
        { line: 'marketing', to: phone, text: _copy(OPT_OUT_CONFIRM_KEY), windowOpen: true },
        { ..._deps, isOptedOut: async () => false },
      );
      confirmSent = true;
    } catch (e) { confirmError = e; }
    return { action: 'opted_out', phone, prospectId: prospect.id, confirmSent, confirmError };
  }

  // ── START → resume from opted_out ─────────────────────────────────────────────────────────
  if (isStartWord(text)) {
    const prospect = await findProspectByPhone(supabase, phone);
    if (prospect && prospect.state === 'opted_out') {
      await updateProspect(supabase, prospect.id, { state: 'replied' });
      return { action: 'resumed', phone, prospectId: prospect.id };
    }
    // not opted out — fall through to normal handling
  }

  // ── normal inbound: advance and answer with the holding line ──────────────────────────────
  const prospect = await findOrCreateProspectByPhone(supabase, phone, { state: 'cold' });

  // An opted-out prospect who messages again (and did not send START) is respected: no send.
  if (prospect.state === 'opted_out') {
    return { action: 'noop_opted_out', phone, prospectId: prospect.id };
  }

  // replied → open the conversation → in_session; re-stamp the rolling window anchor.
  const conversation = await openProspectConversation(supabase, prospect);
  await logMessage(supabase, conversation.id, { direction: 'inbound', body: text, sentBy: 'prospect' });
  const advanced = await updateProspect(supabase, prospect.id, {
    state: 'in_session',
    session_opened_at: now,     // rolling window anchor (disclosed)
  });

  let holdingSent = false, holdingError = null;
  try {
    await _sendWa(
      { line: 'marketing', to: phone, text: _copy(HOLDING_LINE_KEY), windowOpen: true,
        conversationId: conversation.id, supabase },
      _deps,
    );
    holdingSent = true;
    await logMessage(supabase, conversation.id, { direction: 'outbound', body: _copy(HOLDING_LINE_KEY), sentBy: 'system' });
  } catch (e) { holdingError = e; }

  return {
    action: 'in_session', phone, prospectId: prospect.id, conversationId: conversation.id,
    state: advanced.state, holdingSent, holdingError,
  };
}

// ── daily opener job (cron, 10am IST) ─────────────────────────────────────────
// Pick `cold` prospects oldest-first up to the cap; send marketing_opener; state → templated,
// last_template_at stamped. A typed send refusal is logged and skipped, never silently dropped.
async function runOpenerJob({ supabase, sendWa, sendWaDeps, cap, now }) {
  const _sendWa = sendWa || realSendWa;
  const _deps   = sendWaDeps || {};
  const limit   = (typeof cap === 'number') ? cap : await readDailyCap(supabase);
  const stamp   = now || new Date().toISOString();

  if (limit <= 0) return { picked: 0, sent: 0, failed: 0, results: [] };

  const { data: cold } = await supabase
    .from('prospects').select('*')
    .eq('state', 'cold')
    .order('created_at', { ascending: true })
    .limit(limit);

  const results = [];
  let sent = 0, failed = 0;
  for (const p of (cold || [])) {
    try {
      await _sendWa(
        { line: 'marketing', to: p.phone, templateKey: OPENER_TEMPLATE_KEY,
          vars: { name: p.name || 'there' }, supabase },
        _deps,
      );
      await updateProspect(supabase, p.id, { state: 'templated', last_template_at: stamp });
      sent++;
      results.push({ id: p.id, phone: p.phone, ok: true });
    } catch (e) {
      failed++;
      results.push({ id: p.id, phone: p.phone, ok: false, error: e && (e.code || e.message) });
      console.warn(`[wa:marketing] opener refused for ${p.phone}: ${e && (e.code || e.message)}`);
    }
  }
  return { picked: (cold || []).length, sent, failed, results };
}

// ── window-expiry job ─────────────────────────────────────────────────────────
// in_session AND (now − session_opened_at) > 24h → expired. Re-engagement is future-template only
// (human-triggered from admin). Returns the ids expired.
async function runExpiryJob({ supabase, now }) {
  const cutoff = new Date((now ? new Date(now).getTime() : Date.now()) - WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data: stale } = await supabase
    .from('prospects').select('id, phone, session_opened_at')
    .eq('state', 'in_session')
    .lt('session_opened_at', cutoff);
  const expired = [];
  for (const p of (stale || [])) {
    await updateProspect(supabase, p.id, { state: 'expired' });
    expired.push(p.id);
  }
  return { expired: expired.length, ids: expired };
}

// ── nightly conversion match (Block 08 handshake seam) ────────────────────────
// A prospect converts when their phone appears as a CLAIMED vendor. The vendor-claim signal is
// 08's to finalise; here we do the best-effort match that P3 can prove: for prospects with a
// demo_vendor_ref, if that vendor is now claimed (vendors.claimed_at set OR user_id present),
// mark converted. Declared partial: the exact claim predicate is 08's to ratify. Admin also has a
// manual mark-converted for the interim.
async function runConversionMatchJob({ supabase, now }) {
  const stamp = now || new Date().toISOString();
  const { data: pending } = await supabase
    .from('prospects').select('id, phone, demo_vendor_ref, state')
    .not('demo_vendor_ref', 'is', null)
    .neq('state', 'converted')
    .neq('state', 'opted_out');
  const converted = [];
  for (const p of (pending || [])) {
    try {
      const { data: vendor } = await supabase
        .from('vendors').select('id, user_id, claimed_at').eq('id', p.demo_vendor_ref).maybeSingle();
      const claimed = vendor && (vendor.claimed_at || vendor.user_id);
      if (claimed) {
        await updateProspect(supabase, p.id, { state: 'converted' });
        converted.push(p.id);
      }
    } catch (_e) { /* vendor lookup shape is 08's to finalise; skip, never throw */ }
  }
  return { converted: converted.length, ids: converted, stampedAt: stamp };
}

module.exports = {
  STOP_WORDS, START_WORDS, isStopWord, isStartWord,
  readDailyCap, DEFAULT_DAILY_CAP,
  findProspectByPhone, findOrCreateProspectByPhone, updateProspect,
  openProspectConversation, logMessage,
  handleMarketingInbound,
  runOpenerJob, runExpiryJob, runConversionMatchJob,
  OPENER_TEMPLATE_KEY, HOLDING_LINE_KEY, OPT_OUT_CONFIRM_KEY,
};
