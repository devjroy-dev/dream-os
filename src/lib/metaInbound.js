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

// ── F-05.79 CURED · THE CAPTION RIDES THE DESCRIPTOR (CE-32 fork c-2, 2026-08-12) ───────────
// Meta puts a photo's caption on the MEDIA object (`m.image.caption`), never in `m.text`.
// `_messageText` above returns '' for `m.type === 'image'` and always has, so the bride's own
// words about her own photograph were discarded at the estate's front door: zero readers of
// `m.image.caption` existed anywhere in the tree. That discard is what blocked F5's caption
// clause (one act, one row — the caption rides the save) even after F-09.173 opened the doors.
//
// WHY HERE AND NOT IN `_messageText` (the rejected arm, recorded so nobody re-opens it):
// `_messageText` feeds BOTH lanes' `trimmedBody`. Returning the caption there would have
// changed vendor behaviour (vendorInbound.js:369/:384 would log captions in place of
// `[calendar image]` and thread them into the calendar pipeline) and — on both lanes — would
// have routed caption text through the STOP-word, nudge-word and 'surprise me' branches, so a
// photo captioned "stop" would opt a bride out. The descriptor is the honest home: it is where
// Meta put it, and it reaches only the adapters that ask for it.
//
// ADDITIVE AND UNREAD BY DEFAULT: this field had zero readers estate-wide when it was added,
// so every existing consumer of `media[]` is byte-unmoved — the vendor lane included. The
// bride adapter is its first and only reader (brideInbound.js `metaInputsFrom`).
function _messageMedia(m) {
  if (!m) return [];
  const kinds = ['image', 'document', 'audio', 'video', 'sticker'];
  for (const k of kinds) {
    if (m.type === k && m[k]) {
      return [{
        id: m[k].id || null,
        mime: m[k].mime_type || null,
        kind: k,
        caption: m[k].caption || null,
      }];
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

// ── F-05.78 REOPENED-SCOPED · THE PROFILE NAME SURFACE (R-35.19/.20, CE-35) ──
// `normalizeMetaInbound` above emits one flat object per message and has never read
// `value.contacts[]`. That was the estate's REAL discard: `grep -rn "contacts" src/`
// returned zero readers, so `brideInbound.js`'s `profileName: null` was not a lazy
// hardcode — the field never entered the process at all, and the two fill-when-null
// writers behind it had never fired once.
//
// F-05.78 WAS CLOSED-SUPERSEDED AT CE-31 (R-OB.7: the PWA form is the one door for
// real names). R-35.19 REOPENS IT SCOPED on the founder's word of 2026-08-20: the
// situation R-OB.7 priced at 11-of-28 nameless with a working form door now stands at
// 22-of-42 with the onboarding gate ruled dark, so the form is not in fact a door.
// R-OB.7 is AMENDED, not reversed — it stands WHOLE on the member plane (a circle
// member is known by the bride's word, `invitee_name` canonical, and `safeName` in
// brideInbound.js no longer reads this field at all), and the reopen reaches only the
// bride's OWN users row, fill-when-null.
//
// WHY HERE AND NOT IN THE BRIDE LANE (R-35.20, the rejected arm recorded so nobody
// re-opens it): `metaInputsFrom` already receives `rawBody`, so a bride-local read was
// available and cheaper. It was refused because the wa_id↔message pairing is PAYLOAD
// NORMALIZATION — this adapter's whole job — and a lane-local copy would be a SECOND
// HOME for that pairing, which is how the two lanes drift. `changesWithPnid` is the
// precedent: additive, pure, per-change, exported, and unread until a lane asks.
//
// ADDITIVE AND INERT. `normalizeMetaInbound` is byte-unchanged and no existing caller
// moves. The bride lane's `metaInputsFrom` is the first and only consumer;
// `vendorInbound.js`'s own `profileName: null` stands untouched, so the bride-only
// blast radius holds BY STRUCTURE rather than by anyone's care (F-05.81 records the
// vendor lane's unguarded creation-time writers — they are latent only while that null
// holds, and are never to be woken casually).
//
// F-06.85 MECHANISM NOTE — THE 80 IS POLICY, NOT A COLUMN CONSTRAINT. `users.name` is
// unbounded `text` (docs/db/PUBLIC_SCHEMA.md:995). 80 is the estate's existing cap for
// this exact column, witnessed at src/api/couple/onboarding.js:179 — the corrected
// witness under R-35.18 as amended; the "onboarding form's own cap" the ruling first
// cited does not exist in dreamos-pwa. Kept identical so one column has one cap.
//
// THE CAP IS COUNTED IN CODE POINTS, NOT UTF-16 UNITS, AND THAT IS THE WHOLE POINT.
// R-35.18 stores her name VERBATIM — emoji, initials, script and all — because her
// WhatsApp name is the name she presents to the world and a filled '♥ Priya ♥' beats a
// literal 'unknown' everywhere downstream. A plain `.slice(0, 80)` contradicts that
// clause on its own terms: '👰'.length is 2 and a ZWJ sequence is 7+, so a slice landing
// mid-pair emits a LONE SURROGATE — invalid UTF-8, which Postgres rejects or stores as
// U+FFFD. The spread iterates code points, so the cut can only fall between characters.
// (F-OB.20 records that `onboarding.js:179` still carries the raw-`.slice` form; it is
// queued, one line, out of this scope.)
const PROFILE_NAME_CAP = 80;

// R-35.18's sanity shape, one home. Trim; reject empty-after-trim (a name of spaces is
// not a name — the `brideComplete` predicate has always agreed); otherwise VERBATIM to
// the cap. Returns null for every non-name so callers need no second test: the writers
// downstream are all guarded `if (profileName && ...)`, and null is what makes an
// absent, blank or whitespace-only wire name a NO-OP rather than a bad write.
function sanitizeProfileName(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return [...trimmed].slice(0, PROFILE_NAME_CAP).join('');
}

// Pair a normalized message back to its contact by `wa_id`. One Meta POST can batch
// several messages from several senders across several changes, so the pairing is by ID
// and never positional — `contacts[0]` would attribute one bride's name to another's row
// on any batched POST, and that write is unguarded once `users.name` is null.
// `waId` is `msg.from` (bare international digits); '+' is tolerated on either side so a
// caller that already normalized to E.164 still matches.
function profileNameFor(body, waId) {
  if (!waId) return null;
  const want = String(waId).replace(/^\+/, '');
  const entries = (body && Array.isArray(body.entry)) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const ch of changes) {
      const contacts = (ch && ch.value && Array.isArray(ch.value.contacts)) ? ch.value.contacts : [];
      for (const c of contacts) {
        if (!c || String(c.wa_id == null ? '' : c.wa_id).replace(/^\+/, '') !== want) continue;
        const name = sanitizeProfileName(c.profile && c.profile.name);
        if (name) return name;
      }
    }
  }
  return null;
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
  // F-05.78 REOPENED-SCOPED (R-35.19/.20) — additive; bride lane is the only consumer
  profileNameFor,
  sanitizeProfileName,
  PROFILE_NAME_CAP,
  // TDW_05 Workstream-1 (additive — shared receiver fork)
  changesWithPnid,
  buildSingleChangeBody,
  laneForPnid,
};
