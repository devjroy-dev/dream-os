// src/lib/webhookCore.js — shared inbound/callback surface for the vendor,
// bride, and marketing services.
//
// ORIGIN (TDW_05 P1a, Movement A): a VERBATIM extraction of logic that lived twice,
// once in src/index.js and once in src/brideIndex.js, differing only in log-prefix
// tokens — so the tokens became parameters and the emitted output stayed byte-identical.
// Movement B then added the dedupe / dead-letter / replay surface below.
//
// TDW_05 M2b — THE TWILIO SUNSET (CE-62, per CE-33's enumeration). Three functions are
// DELETED here because the transport they served no longer exists:
//   · verifyTwilioSignature      — X-Twilio-Signature validation. Meta's inbound is
//                                  verified by metaInbound.verifyMetaSignature instead.
//   · normalizeMedia             — read req.body.NumMedia / MediaUrl0, a Twilio form
//                                  shape. Meta inbound is normalized by metaInbound.
//   · makeTwilioStatusHandler    — the /webhook/twilio-status delivery callback. Meta
//                                  statuses arrive on /webhook/meta (extractStatuses).
//   · warnIfSignatureCheckDisabled — deleted with them: its entire content was a warning
//                                  about Twilio signature verification, gated on
//                                  DISABLE_TWILIO_SIGNATURE_CHECK. After the sunset it
//                                  would have warned about a check that does not exist,
//                                  on three services including marketing (never on
//                                  Twilio at all). A log line that describes a deleted
//                                  mechanism is not a safety net, it is a false one.
//                                  FILED, not fixed here: DISABLE_META_SIGNATURE_CHECK
//                                  — the flag that IS live — has no boot warning. That
//                                  is a new finding, not a deletion sitting's business.
//
// WHAT STAYS, and why (CE-33 named this shape): logInbound and isEmptyInbound are
// transport-agnostic — they take already-extracted fields and emit/decide on them.
// The whole Movement-B surface (LRU + durable dedupe, dead letters, replay predicate,
// pg error classification) is RF-1's dedupe estate and is keyed on a message id, not
// on a provider: Twilio MessageSid and Meta wamid both flow through it unchanged.
'use strict';

// ── Structured logging: the inbound line ─────────────────────────────
// Was: console.log(`[whatsapp:in] ${phone} -> ${body}`)   (vendor)
//      console.log(`[bride-whatsapp:in] ${phone} -> ${body}`) (bride)
function logInbound(prefix, phone, body) {
  console.log(`${prefix} ${phone} -> ${body}`);
}

// ── Empty-payload guard ──────────────────────────────────────────────
// A message with no text and no media is dropped silently with a 200. Returns true
// when it handled (dropped) the request, false when the caller should continue.
// Caller: `if (isEmptyInbound(res, { trimmedBody, hasMedia, prefix })) return;`
function isEmptyInbound(res, { trimmedBody, hasMedia, prefix }) {
  if (!trimmedBody && !hasMedia) {
    console.warn(`${prefix} empty body, no media, dropping`);
    res.status(200).send('<Response></Response>');
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// TDW_05 P1b — Movement B additions (dedupe, dead letters, replay predicate).
// All new surface below this line. Transport-agnostic in full: keyed on a message id,
// never on a provider — which is why the sunset leaves it untouched.
// ═══════════════════════════════════════════════════════════════════════

function _sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Graceful line for a thrown inbound turn (dead-letter path) ───────
// The single user-facing line when a turn throws and is dead-lettered. Verbatim
// from the spec ("Dead letters" clause).
const GRACEFUL_TURN_LINE = 'Something hiccuped — say that again in a minute.';

// ── Inbound MessageSid dedupe: the in-process LRU (fast path) ────────
// The primary idempotency guard. Twilio retries a webhook (same MessageSid) within
// seconds when our 200 is slow; those retries hit the SAME process almost always, so
// a bounded in-memory set catches the overwhelming majority with zero DB cost. The
// durable `messages.message_sid` unique index (migration, founder-run) is the cross-
// process/-restart backstop — a duplicate that slips past this LRU collides there and
// is classified in the handler's outer catch (isDuplicateSidError) as an idempotent
// drop, never a dead letter.
//
// A null/absent sid can't be deduped (no key) — sidSeen returns false so the turn runs.
const _SID_LRU_MAX = 5000;
let _sidLru = new Map(); // insertion-ordered; evict oldest when over cap

function sidSeen(sid) {
  if (!sid) return false;
  return _sidLru.has(sid);
}
function recordSid(sid) {
  if (!sid) return;
  if (_sidLru.has(sid)) return;
  _sidLru.set(sid, 1);
  if (_sidLru.size > _SID_LRU_MAX) {
    const oldest = _sidLru.keys().next().value;
    _sidLru.delete(oldest);
  }
}
function _resetSidLru() { _sidLru = new Map(); } // test hook

// ── Postgres error classification ────────────────────────────────────
// supabase-js surfaces the PostgREST/pg error with a `.code`. We only need two:
//   23505 — unique_violation  → a duplicate inbound MessageSid hit the durable index.
//   42703 — undefined_column  → messages.message_sid not migrated yet (graceful degrade).
//   42P01 — undefined_table   → failed_turns not migrated yet (dead-letter degrade).
function _errCode(error) {
  if (!error) return null;
  return error.code || (error.cause && error.cause.code) || null;
}
function isDuplicateSidError(error) { return _errCode(error) === '23505'; }
function isMissingColumnError(error) { return _errCode(error) === '42703'; }
function isMissingTableError(error)  { return _errCode(error) === '42P01'; }

// ── Durable dedupe column probe (graceful degrade) ───────────────────
// Run once at boot. If messages.message_sid exists we attach it on inbound persist
// (feeding the unique-index backstop); if it doesn't, we run LRU-only and warn once,
// so an un-migrated deploy keeps working (the CE's conditional-withheld rule). Cached.
let _sidColumnPresent = null; // null = not yet probed
async function probeMessageSidColumn(supabase, { prefix = '[webhook]' } = {}) {
  try {
    const { error } = await supabase.from('messages').select('message_sid').limit(1);
    if (error && isMissingColumnError(error)) {
      _sidColumnPresent = false;
    } else {
      _sidColumnPresent = true;
    }
  } catch (_e) {
    _sidColumnPresent = false;
  }
  if (_sidColumnPresent === false) {
    console.warn(`${prefix} durable MessageSid dedupe DEGRADED: messages.message_sid absent — LRU-only until migration lands`);
  }
  return _sidColumnPresent;
}
function messageSidColumnPresent() { return _sidColumnPresent === true; }
function _setSidColumnPresent(v) { _sidColumnPresent = v; } // test hook

// Build the inbound-message row, attaching message_sid only when the column exists.
// Callers spread this: `await supabase.from('messages').insert(inboundRow(base, sid))`.
function inboundRow(base, messageSid) {
  if (messageSidColumnPresent() && messageSid) {
    return { ...base, message_sid: messageSid };
  }
  return { ...base };
}

// ── Dead letters ─────────────────────────────────────────────────────
// A turn that throws (not a duplicate) → its full inbound payload lands in failed_turns
// for admin replay/discard. Degrades gracefully if the table isn't migrated yet: we log
// loudly and return { ok:false, degraded:true } rather than throwing again over the throw.
async function captureDeadLetter({ supabase, service, phone, payload, error }) {
  const row = {
    service,
    phone: phone || null,
    payload: payload || {},
    error: error ? String(error.stack || error.message || error) : null,
    state: 'dead',
  };
  try {
    const { data, error: insErr } = await supabase.from('failed_turns').insert(row).select('id').single();
    if (insErr) {
      if (isMissingTableError(insErr)) {
        console.error(`[dead-letter] failed_turns absent — cannot persist (service=${service} phone=${phone}); migration pending`);
        return { ok: false, degraded: true };
      }
      console.error('[dead-letter] insert error:', insErr);
      return { ok: false, degraded: false };
    }
    console.warn(`[dead-letter] captured failed turn ${data && data.id} service=${service} phone=${phone}`);
    return { ok: true, id: data && data.id };
  } catch (e) {
    console.error('[dead-letter] capture threw:', e && e.message);
    return { ok: false, degraded: false };
  }
}

// ── Internal replay predicate ────────────────────────────────────────
// Dead-letter replay re-drives a stored payload through a service's real webhook. That
// re-POST carries x-internal-replay: <secret>; a request is trusted-internal only when
// INTERNAL_REPLAY_SECRET is set AND the header matches it. Withheld by default (unset
// secret ⇒ always false ⇒ no bypass path exists). Internal-replay requests skip the
// Twilio signature (they're not from Twilio), skip the LRU (they're a deliberate re-run),
// and persist with a null message_sid (the original row already holds the sid; re-using
// it would collide on the unique index). This predicate is the single gate for all three.
function isInternalReplay(req) {
  const secret = process.env.INTERNAL_REPLAY_SECRET;
  if (!secret) return false;
  const header = req.headers && (req.headers['x-internal-replay'] || req.headers['X-Internal-Replay']);
  return !!header && header === secret;
}

module.exports = {
  // Movement A (sealed; the three Twilio fns + the Twilio boot warning deleted at M2b)
  logInbound,
  isEmptyInbound,
  // Movement B
  GRACEFUL_TURN_LINE,
  sidSeen,
  recordSid,
  _resetSidLru,
  isDuplicateSidError,
  isMissingColumnError,
  isMissingTableError,
  probeMessageSidColumn,
  messageSidColumnPresent,
  _setSidColumnPresent,
  inboundRow,
  captureDeadLetter,
  isInternalReplay,
  _sleep,
};
