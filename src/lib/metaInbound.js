// src/lib/metaInbound.js — Meta WhatsApp Cloud API INBOUND adapter (Block 05, P3).
//
// WHY THIS EXISTS (read-first finding, CE-ruled into P3): webhookCore's inbound helpers WERE
// Twilio-shaped — verifyTwilioSignature (X-Twilio-Signature), normalizeMedia (req.body.NumMedia),
// makeTwilioStatusHandler (Twilio status form). All three were DELETED at M2b (CE-62) once this
// adapter carried every lane. Meta Cloud API webhooks are a different animal:
//   • a GET verification handshake (hub.mode / hub.verify_token / hub.challenge) at subscribe time
//   • POST bodies signed with X-Hub-Signature-256 = 'sha256=' + HMAC_SHA256(rawBody, APP_SECRET)
//   • a nested payload: entry[].changes[].value.{messages[],statuses[]}, message id = wamid
// So the marketing service builds on webhookCore's SERVICE-AGNOSTIC pieces (the sid/LRU dedupe,
// captureDeadLetter, isInternalReplay, GRACEFUL_TURN_LINE, isEmptyInbound, logInbound) and adds
// THIS thin Meta adapter on top. All functions here are pure/deterministic and bench over sample
// Meta payloads with no network and no creds.
'use strict';

const crypto = require('crypto');

// ── GET verification handshake ───────────────────────────────────────────────
// Meta calls GET /webhook/meta?hub.mode=subscribe&hub.verify_token=<t>&hub.challenge=<c> once,
// when the webhook is first subscribed. We echo hub.challenge iff the token matches. Returns true
// when it handled the request (caller returns), false when it wasn't a verification call.
function handleVerifyChallenge(req, res, verifyToken) {
  const q = req.query || {};
  const mode      = q['hub.mode'];
  const token     = q['hub.verify_token'];
  const challenge = q['hub.challenge'];
  if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
    res.status(200).send(String(challenge == null ? '' : challenge));
    return true;
  }
  if (mode || token || challenge) {
    // a verification attempt with a bad/absent token — reject, don't fall through to POST logic
    res.status(403).send('Forbidden');
    return true;
  }
  return false;
}

// ── X-Hub-Signature-256 verification ─────────────────────────────────────────
// signatureHeader is the raw header value ('sha256=<hex>'). rawBody MUST be the exact bytes
// Meta sent (capture via express.json({ verify }) → req.rawBody); a re-serialized object will
// not match. Timing-safe compare. Returns false on any shape mismatch rather than throwing.
function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader || rawBody == null) return false;
  const header = String(signatureHeader);
  if (!header.startsWith('sha256=')) return false;
  const theirs = header.slice('sha256='.length);
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
  const ours = crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  const a = Buffer.from(ours, 'utf8');
  const b = Buffer.from(theirs, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch (_e) {
    return false;
  }
}

// ── inbound message normalization ────────────────────────────────────────────
// Meta payload → the flat shape the prospect state machine + webhookCore agnostic pieces expect:
//   { from, text, messageId, type, timestamp, media:[{ id, mime, kind }] }
// One Meta POST can batch several messages; we return an array. Non-message change objects
// (e.g. a value carrying only statuses) contribute nothing here.
function _messageText(m) {
  if (!m) return '';
  if (m.type === 'text' && m.text) return m.text.body || '';
  // Button / interactive replies carry their user-visible text in a nested field — surface it so
  // STOP typed on a button still opts out. Everything else → '' (media-only handled separately).
  if (m.type === 'button' && m.button) return m.button.text || m.button.payload || '';
  if (m.type === 'interactive' && m.interactive) {
    const i = m.interactive;
    if (i.button_reply) return i.button_reply.title || i.button_reply.id || '';
    if (i.list_reply)   return i.list_reply.title   || i.list_reply.id   || '';
  }
  return '';
}

function _messageMedia(m) {
  if (!m) return [];
  const kinds = ['image', 'document', 'audio', 'video', 'sticker'];
  for (const k of kinds) {
    if (m.type === k && m[k]) {
      return [{ id: m[k].id || null, mime: m[k].mime_type || null, kind: k }];
    }
  }
  return [];
}

function normalizeMetaInbound(body) {
  const out = [];
  const entries = (body && Array.isArray(body.entry)) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const ch of changes) {
      const value = ch && ch.value;
      const messages = value && Array.isArray(value.messages) ? value.messages : [];
      for (const m of messages) {
        out.push({
          from: m.from || null,               // sender's phone (international, no '+')
          text: _messageText(m),
          messageId: m.id || null,            // wamid — the dedupe key
          type: m.type || null,
          timestamp: m.timestamp || null,
          media: _messageMedia(m),
        });
      }
    }
  }
  return out;
}

// ── delivery-status extraction ───────────────────────────────────────────────
// Meta delivery receipts arrive through the SAME webhook as value.statuses[] (not a separate
// Twilio-style callback URL). Shape: { id:<wamid>, status:'sent'|'delivered'|'read'|'failed',
// recipient_id, errors:[...] }. Returned for the admin delivery-chip surface (P6 renders them);
// P3 exposes the extractor and logs, no schema.
function extractStatuses(body) {
  const out = [];
  const entries = (body && Array.isArray(body.entry)) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const ch of changes) {
      const value = ch && ch.value;
      const statuses = value && Array.isArray(value.statuses) ? value.statuses : [];
      for (const s of statuses) {
        out.push({
          id: s.id || null,
          status: s.status || null,
          recipient: s.recipient_id || null,
          errors: Array.isArray(s.errors) ? s.errors : [],
        });
      }
    }
  }
  return out;
}

// ── per-change recipient-PNID surface (TDW_05 Workstream-1 shared receiver) ───
// ADDITIVE: normalizeMetaInbound is byte-unchanged. The shared-callback fork needs the
// RECIPIENT number (which TDW line the message was sent TO) = value.metadata.phone_number_id,
// which the flat normalizer drops. One POST can batch several changes with DIFFERENT recipient
// PNIDs, so the fork is per-CHANGE, not per-POST. changesWithPnid surfaces { phoneNumberId,
// entryId, change } for every change, order-preserving; unknown metadata → phoneNumberId:null.
function changesWithPnid(body) {
  const out = [];
  const entries = (body && Array.isArray(body.entry)) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const ch of changes) {
      const md = ch && ch.value && ch.value.metadata;
      out.push({
        phoneNumberId: (md && md.phone_number_id) ? String(md.phone_number_id) : null,
        entryId: (entry && entry.id) || null,
        change: ch,
      });
    }
  }
  return out;
}

// Reconstruct a minimal, valid Meta webhook body carrying exactly ONE change — what the ingress
// forwards to the owning sibling (which re-runs its own /webhook/meta over normalizeMetaInbound).
function buildSingleChangeBody(body, entryId, change) {
  return {
    object: (body && body.object) || 'whatsapp_business_account',
    entry: [{ id: entryId || null, changes: [change] }],
  };
}

// Recipient-PNID → lane, from env. Matches ONLY when the env var is set (unset → never matches →
// that lane's inbound is dropped+logged at the ingress, never mis-lane'd). Pure; env injectable.
function laneForPnid(pnid, env = process.env) {
  if (!pnid) return null;
  const p = String(pnid);
  if (env.MARKETING_PHONE_NUMBER_ID && p === String(env.MARKETING_PHONE_NUMBER_ID)) return 'marketing';
  if (env.BRIDE_PHONE_NUMBER_ID     && p === String(env.BRIDE_PHONE_NUMBER_ID))     return 'bride';
  if (env.VENDOR_PHONE_NUMBER_ID    && p === String(env.VENDOR_PHONE_NUMBER_ID))    return 'vendor';
  return null;
}

module.exports = {
  handleVerifyChallenge,
  verifyMetaSignature,
  normalizeMetaInbound,
  extractStatuses,
  // TDW_05 Workstream-1 (additive — shared receiver fork)
  changesWithPnid,
  buildSingleChangeBody,
  laneForPnid,
};
