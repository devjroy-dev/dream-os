// src/lib/webhookCore.js — TDW_05 Block 05, P1a (Movement A).
//
// VERBATIM extraction of the shared inbound/callback transport logic that lived
// twice — once in src/index.js (vendor, "dream-os") and once in src/brideIndex.js
// (bride, "dream-wedding"). The two copies were byte-identical in LOGIC and differed
// only in the log-prefix tokens they printed:
//
//     vendor                 bride
//     ------                 -----
//     [whatsapp:in]          [bride-whatsapp:in]
//     [webhook]              [bride-webhook]
//     [twilio-status]        [bride-twilio-status]
//     [dream-os]             [dream-wedding]
//
// So the extraction takes those tokens as parameters: each service passes its own,
// and the emitted output stays byte-identical to what the inline code produced. No
// logic change, no new env, no renamed flag — the existing DISABLE_TWILIO_SIGNATURE_CHECK
// guard and its startup warning are preserved exactly. (The features — MessageSid
// dedupe, the status-callback race fix, dead letters — are Movement B, gated on the
// CE verifying this extraction byte-identical.)
//
// Proof of byte-identity: scripts/b5_webhookcore_bench.js runs the pre-refactor inline
// blocks (kept verbatim in the bench as reference) and these functions over the same
// matrix and diffs every console line + response. Same output, RED on any drift.
'use strict';

const twilio = require('twilio');

// ── Structured logging: the inbound line ─────────────────────────────
// Was: console.log(`[whatsapp:in] ${phone} -> ${body}`)   (vendor)
//      console.log(`[bride-whatsapp:in] ${phone} -> ${body}`) (bride)
function logInbound(prefix, phone, body) {
  console.log(`${prefix} ${phone} -> ${body}`);
}

// ── Twilio signature verification ────────────────────────────────────
// Preserves the DISABLE_TWILIO_SIGNATURE_CHECK guard exactly. Returns true when the
// request may proceed; on an invalid signature it writes the 403 and returns false,
// so the caller does: `if (!verifyTwilioSignature(req, res, { phone, prefix })) return;`
function verifyTwilioSignature(req, res, { phone, prefix }) {
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK !== 'true') {
    const twilioSignature = req.headers['x-twilio-signature'] || '';
    const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      webhookUrl,
      req.body,
    );
    if (!isValid) {
      console.warn(`${prefix} invalid Twilio signature from ${phone}, url=${webhookUrl}`);
      res.status(403).send('Forbidden');
      return false;
    }
  }
  return true;
}

// ── Media normalization: the one shape both engines consume ──────────
// Pure. Returns { trimmedBody, numMedia, hasMedia } from the raw Twilio body.
function normalizeMedia(req, body) {
  const trimmedBody = body.trim();
  const numMedia    = parseInt(req.body.NumMedia || '0', 10);
  const hasMedia    = numMedia > 0 || !!req.body.MediaUrl0;
  return { trimmedBody, numMedia, hasMedia };
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

// ── Twilio status callback handler ───────────────────────────────────
// Twilio POSTs here on every delivery state change for outbound WhatsApp messages.
// We match on MessageSid and update messages.delivery_status. Returns an express
// handler bound to this service's supabase client and log prefix.
//
// TDW_05 P1b (Movement B) — the Session-5.5 status race. A delivery callback can
// arrive BEFORE the outbound row has been inserted (Twilio is that fast). The pre-B
// code logged "(callback ignored)" and dropped the status forever. B replaces that
// single drop with an in-process retry: re-run the matched update up to `maxRetries`
// times, `retryMs` apart. If a retry lands after the row exists, delivery_status is
// written and nothing is lost. Only when all retries miss do we log `callback_unmatched`
// and drop — the terminal, named, greppable outcome (no schema, per the ruling).
//
// Timing is injectable so the bench runs deterministically without real 2s waits;
// production defaults are the chartered 3 × 2000ms. Every other branch (row-found on
// first try, missing sid/status, db-error, errCode, handler-throw) is unchanged from
// Movement A and stays byte-identical in the b5 bench.
function makeTwilioStatusHandler({ supabase, prefix, maxRetries = 3, retryMs = 2000, sleep = _sleep }) {
  return async (req, res) => {
    try {
      const sid     = req.body.MessageSid    || req.body.SmsSid    || null;
      const status  = req.body.MessageStatus || req.body.SmsStatus || null;
      const errCode = req.body.ErrorCode || null;

      console.log(`${prefix} sid=${sid} status=${status}${errCode ? ` errCode=${errCode}` : ''}`);

      if (!sid || !status) {
        return res.status(200).send('ok');
      }

      const runUpdate = () => supabase
        .from('messages')
        .update({ delivery_status: status })
        .eq('twilio_sid', sid)
        .select('id');

      const { data, error } = await runUpdate();

      if (error) {
        console.error(`${prefix} db update error:`, error);
      } else if (!data || data.length === 0) {
        // The race: no row yet. Retry a bounded number of times before giving up.
        let matched = false;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          await sleep(retryMs);
          const retry = await runUpdate();
          if (retry.error) {
            console.error(`${prefix} db update error:`, retry.error);
            matched = true; // an error is a terminal, already-logged outcome — stop retrying
            break;
          }
          if (retry.data && retry.data.length > 0) {
            console.log(`${prefix} sid=${sid} matched on retry ${attempt}/${maxRetries}`);
            matched = true;
            break;
          }
        }
        if (!matched) {
          console.log(`${prefix} no message row for sid=${sid} after ${maxRetries} retries (callback_unmatched)`);
        }
      }

      res.status(200).send('ok');
    } catch (err) {
      console.error(`${prefix} handler error:`, err);
      res.status(200).send('ok');
    }
  };
}

// ── Startup warning ──────────────────────────────────────────────────
// Printed at boot only when the signature check is disabled. serviceTag is the
// service's own bracket token ([dream-os] / [dream-wedding]).
function warnIfSignatureCheckDisabled(serviceTag) {
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK === 'true') {
    console.warn(`${serviceTag} WARNING: DISABLE_TWILIO_SIGNATURE_CHECK=true — Twilio webhook signature verification is OFF. Do not run in production with this flag set.`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TDW_05 P1b — Movement B additions (dedupe, dead letters, replay predicate).
// All new surface below this line. The Movement-A functions above are unchanged
// except makeTwilioStatusHandler's deliberate race-branch swap (CE-ruled).
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
  // Movement A (sealed)
  logInbound,
  verifyTwilioSignature,
  normalizeMedia,
  isEmptyInbound,
  makeTwilioStatusHandler,
  warnIfSignatureCheckDisabled,
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
