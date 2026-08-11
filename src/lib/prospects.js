// src/lib/prospects.js — the prospect-lane state machine (Block 05, P3).
//
// STATES (0085 CHECK, widened by 0119): cold → templated → replied → in_session →
// {expired | converted}, plus opted_out (terminal, cross-line) and DISCARDED —
// the house's own exit, reachable from any state by an admin act and leaving only
// by the admin Restore verb (TDW_05 P3-D, CE-30). opted_out is the human's word;
// discarded is the house's. Nothing a stranger types moves either one inward.
//
// ── THE DAY ARRIVED (TDW_08 P5 Phase 3, 2026-08-04) ──────────────────────────
// THIS HEADER READ, from Block 05 until now: "No AI calls here (W-1): an
// in-session prospect gets a single free-form holding line
// (prospectCopy.holding_line); 06's Closer soul slots in at THIS seam with zero
// transport change." That sentence was written for this edit and it kept its
// promise: the Closer — MAYA — now answers here, and NOT ONE TRANSPORT BYTE
// MOVED. Same `_sendWa`, same `windowOpen: true`, same `logMessage`, same
// conversation. The 05/06 boundary inversion held in both directions: 05 owned
// the pipes and could not touch a word; 06 owned the words and did not touch a
// pipe.
//
// The Closer was Block 06's P2, was never built, and Block 06 closed carrying it
// as unbuilt scope with nothing filed forward — F-08.51, the orphan class.
// CE-187 homed it here.
//
// STILL NO MODEL ASSEMBLY IN THIS FILE, and that is FORK 4's ruling rather than
// an accident: this module is a STATE MACHINE. It carries exactly ONE call, to
// `src/agent/closerEngine.js`, mirroring the estate's own `brideInbound` →
// `brideEngine` separation. `prospectCopy.holding_line` is RETIRED at this seam
// and its bytes are preserved in the Phase 3 handover; the constant and the
// string stay in `prospectCopy.js` untouched so no other reader breaks and the
// founder's own vetoed line is not deleted out of the record.
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
const { turnKey, withTurnLock } = require('./turnLock');   // ARC M1 / F-05.41 — the third lane joins

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
// ── FORK 5 · THE TURN LOCK, AND THE MARKETING LANE WAS THE THIRD ─────────────
// `src/lib/turnLock.js` is F-05.41's cure: "yeah" and "Is my haldi" 1.1 seconds
// apart on one bride thread produced two concurrent turns, two add_booking calls
// 300ms apart, and Rs 90,000 held for one Rs 45,000 yes. It says of itself that
// the vendor lane "SHARES THIS ANATOMY EXACTLY — it is not witnessed there only
// because nobody has yet typed twice into it in one second," and that leaving
// one lane racy while curing the other would be a knowing half-cure.
//
// `marketingIndex.js`'s webhook is that anatomy verbatim: verify signature →
// `res.status(200).send('ok')` → an async loop. Two inbounds are two POSTs and
// nothing joined them. Consumers were `vendorInbound.js` and `brideInbound.js`;
// this lane had none.
//
// While the answer was one static string the cost was a duplicate holding line.
// With Maya it is two concurrent model turns on one stranger, two replies, and a
// thread whose history disagrees with itself. Key is the lane-scoped phone, as
// on both other lanes and for the reason `turnLock.js:52-67` gives: the
// conversation does not exist yet at the seam where the lock must sit.
async function handleMarketingInbound(inputs) {
  return withTurnLock(turnKey('marketing', inputs && inputs.from), () => _handleMarketingInbound(inputs));
}

async function _handleMarketingInbound({ supabase, from, text, messageId, sendWa, sendWaDeps, copy, closerTurn }) {
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
    // ── TDW_08 P1 · G-1 · THE STOP ARM (CE-135 §3, ruled (ii)) ───────────────
    // STRICTLY AFTER the opt-out write above, never before, never inside an
    // await chain that could reorder relative to it. FAIL-OPEN on the demo half:
    // a throw is logged loudly and never propagates, so the worst case degrades
    // to exactly today's behaviour — the person is opted out, the demo row stays
    // live. The opt-out write stands unconditionally.
    //
    // The require is LAZY on purpose: demoLifecycle requires this module, and a
    // top-level require here would make the cycle resolve against a half-built
    // exports object.
    try {
      const r = await require('./demoLifecycle').removeByPhone(supabase, phone);
      if (r.ok === false && r.reason !== 'no_linked_demo') {
        console.log(`[prospects:stop] demo takedown no-op: ${r.reason}`);
      }
    } catch (e) {
      console.error(`[prospects:stop] DEMO TAKEDOWN FAILED for prospect ${prospect.id}: ${e.message} — ` +
        'the opt-out STANDS; the demo card did not come down and must be taken down by hand');
    }
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

    // ── TDW_08 · F-08.24 · THE START ARM ─────────────────────────────────────
    // THE EXACT MIRROR of the STOP arm at :142-150, and it runs OUTSIDE the
    // opted_out guard below on purpose. The guard returns early, so a limb
    // placed inside it would be unreachable on a SECOND start — and that is not
    // hypothetical: on the founder's walk of 2026-08-02 the first START lifted
    // the prospect out of `opted_out` and the second fell straight through this
    // guard. An arm keyed on the PROSPECT'S state restores once and then never
    // again, while the demo it was meant to raise stays down.
    //
    // IT RUNS FIRST, and the ordering is the opposite of STOP's for the same
    // reason STOP's is what it is. There, the opt-out write goes first because
    // blocking sends is the safe failure. Here, the safe failure is leaving the
    // opt-out STANDING — so the demo half runs before the lift, and if this
    // module is wrong the human is still protected. It cannot throw outward.
    //
    // FAIL-OPEN, exactly as the STOP arm: restore() returns TYPED refusals for
    // business conditions and is idempotent by its own `state !== 'removed'`
    // check, so `no_linked_demo` (a handset with no demo) and
    // `illegal_transition` (a demo that is already live) are the NORMAL answers
    // here and are not logged as anomalies. Only a genuine infrastructure fault
    // reaches the catch, and it is loud and swallowed.
    //
    // LAZY REQUIRE for the same cycle reason as :143 — demoLifecycle requires
    // this module, and a top-level require would resolve against a half-built
    // exports object.
    try {
      const r = await require('./demoLifecycle').restoreByPhone(supabase, phone);
      if (r.ok === false && r.reason !== 'no_linked_demo' && r.reason !== 'illegal_transition') {
        console.log(`[prospects:start] demo restore no-op: ${r.reason}`);
      }
    } catch (e) {
      console.error(`[prospects:start] DEMO RESTORE FAILED for ${phone}: ${e.message} — ` +
        'the opt-out lift below still stands; the demo card did not come back and must be ' +
        'raised by the admin Activate route');
    }

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

  // ── R-30.15 · F5 ARM (a), THE FOUNDER'S WORD 「 they get silence 」 ─────────
  // PATH 4 OF SIX, and it was the sharp one. Without this line the sequence is:
  // `findOrCreateProspectByPhone` above returns the discarded row → the only
  // early return is the `opted_out` one → the row falls through to
  // `openProspectConversation`, `state:'in_session'` and a full Maya turn. The
  // discard would erase itself on the first inbound, and confirm₂'s promise
  // — "the lane will never touch them again" — would be false from that moment.
  //
  // NO STATE CHANGE HERE, deliberately, and that is the difference between this
  // arm and the one above it. `opted_out` is a state the human chose and this
  // function may lift on START. `discarded` is a state the HOUSE chose, and
  // nothing a stranger types may move it — only the admin Restore verb
  // (src/api/admin/prospects.js, POST /:id/restore) does that, on a named row,
  // with a confirm that says the sweep can reach them again.
  if (prospect.state === 'discarded') {
    return { action: 'noop_discarded', phone, prospectId: prospect.id };
  }

  // replied → open the conversation → in_session; re-stamp the rolling window anchor.
  const conversation = await openProspectConversation(supabase, prospect);
  await logMessage(supabase, conversation.id, { direction: 'inbound', body: text, sentBy: 'prospect' });
  const advanced = await updateProspect(supabase, prospect.id, {
    state: 'in_session',
    session_opened_at: now,     // rolling window anchor (disclosed)
  });

  // ── THE SEAM · MAYA ANSWERS HERE (TDW_08 P5 Phase 3) ───────────────────────
  // THIS BLOCK SENT `_copy(HOLDING_LINE_KEY)`. It now sends what the Closer
  // composed. EVERY TRANSPORT ARGUMENT IS BYTE-IDENTICAL to the line above it —
  // same `_sendWa`, same `line`, same `windowOpen: true`, same `conversationId`,
  // same `logMessage` — because 06 owns words and never pipes. Only `text`
  // changed its source.
  //
  // THE INBOUND IS LOGGED BEFORE THE TURN (:above), which is what lets the
  // Closer read this conversation's own history including the message it is
  // answering. Order is load-bearing, not incidental.
  //
  // THE LAZY REQUIRE is the same cycle discipline as the STOP/START arms:
  // closerEngine reaches demoLifecycle, which requires THIS module, and a
  // top-level require would resolve against a half-built exports object.
  //
  // ON FAILURE, THE STRANGER GETS THE ESTATE'S EXISTING VETOED LINE, not a
  // Maya-voiced apology and not silence: `marketingIndex.js`'s catch already
  // owns that sentence (GRACEFUL_TURN_LINE) and the CE ruled zero new bytes
  // there. So a thrown turn propagates to the caller exactly as any other
  // failure in this function would, and the dead-letter path records it.
  const _turn = closerTurn || require('../agent/closerEngine').runCloserTurn;
  const out = await _turn({
    supabase, prospect: advanced, conversationId: conversation.id, phone, wakeReason: 'reply',
  });

  let replySent = false, replyError = null;
  try {
    await _sendWa(
      { line: 'marketing', to: phone, text: out.text, windowOpen: true,
        conversationId: conversation.id, supabase },
      _deps,
    );
    replySent = true;
    await logMessage(supabase, conversation.id, { direction: 'outbound', body: out.text, sentBy: 'system' });
  } catch (e) { replyError = e; }

  return {
    action: 'in_session', phone, prospectId: prospect.id, conversationId: conversation.id,
    state: advanced.state, replySent, replyError, replySource: out.source,
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
    .neq('state', 'opted_out')
    // ── R-30.14 · PATH 5 OF SIX — THE LATENT ONE ──────────────────────────
    // This selector excluded two terminal states and would have picked a
    // `discarded` row, writing `converted` over a row the founder deliberately
    // removed. It is inert TODAY only because F-07.38 holds: `vendors.claimed_at`
    // does not exist, so the lookup below throws on every prospect and this job
    // has converted nothing since it was written. The day Block 08 defines
    // claimed-truth and cures that column, this job wakes up — and without this
    // line it would wake up un-discarding rows. A defect that needs someone
    // else's future fix to become live is still a defect now.
    .neq('state', 'discarded');
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
    } catch (e) {
      // ── F-07.38 · THE SILENT CATCH GOES LOUD (CE-ruled 2026-07-31) ────────
      // THIS CATCH READ: `catch (_e) { /* ... skip, never throw */ }`.
      // The SELECT above reads `vendors.claimed_at`. THAT COLUMN DOES NOT EXIST —
      // it appears in no migration (db/migrations/*.sql, grepped whole) and in no
      // snapshot (PUBLIC_SCHEMA.md, public.vendors). So PostgREST refuses the
      // request, the refusal lands here, and this job has converted NOTHING since
      // the day it was written — silently, on every nightly run.
      //
      // The comment was right that the shape is 08's to finalise. It was wrong to
      // make the failure invisible while waiting: a job that cannot work should
      // say so every time it runs, or nobody ever learns it is dead. The cure for
      // the COLUMN is deferred to the claim rework (Block 08 defines what
      // "claimed" means); the cure for the SILENCE is this line, now.
      console.error(
        `[prospects:conversion] lookup FAILED for prospect ${p.id} / demo_vendor_ref ${p.demo_vendor_ref}: ` +
        `${e.message} — this prospect was NOT converted. ` +
        '(F-07.38: vendors.claimed_at does not exist; conversion is inert until Block 08 defines claimed-truth.)'
      );
    }
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
