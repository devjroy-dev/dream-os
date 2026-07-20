// src/marketingIndex.js — the marketing (prospect) service (Block 05, P3).
//
// The third small Railway service, on MARKETING_WHATSAPP_NUMBER. It receives Meta WhatsApp Cloud
// API webhooks (NOT Twilio), so it builds on webhookCore's SERVICE-AGNOSTIC pieces (the sid/LRU
// dedupe, captureDeadLetter, GRACEFUL_TURN_LINE) and adds the Meta inbound adapter (metaInbound)
// for the parts webhookCore is Twilio-shaped for (signature, verify handshake, payload).
//
// OUTBOUND: the marketing FROM is a Meta phone-number-id, so free-form CANNOT ride Twilio's
// src/lib/whatsapp.js. We inject a Meta sendText into sendWa; the template path already defaults to
// Meta (the ruled swap). With Meta creds unset (Movement A) sends throw MetaNotConfiguredError and
// are logged, never faked — the live send is founder-gated (Movement B).
//
// CREDS: META_WABA_TOKEN, MARKETING_PHONE_NUMBER_ID, META_APP_SECRET, META_VERIFY_TOKEN — all env,
// referenced never printed. DISABLE_META_SIGNATURE_CHECK=true is a LOCAL-ONLY kill switch.
'use strict';

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const {
  handleVerifyChallenge, verifyMetaSignature, normalizeMetaInbound, extractStatuses,
  changesWithPnid, buildSingleChangeBody, laneForPnid,
} = require('./lib/metaInbound');
const {
  sidSeen, recordSid, captureDeadLetter, GRACEFUL_TURN_LINE, warnIfSignatureCheckDisabled,
} = require('./lib/webhookCore');
const { sendWa } = require('./lib/sendWa');
const { sendMetaText } = require('./lib/metaCloud');
const { handleMarketingInbound } = require('./lib/prospects');
const { scheduleMarketingCrons } = require('./marketingCron');

const SERVICE_TAG = '[wa:marketing]';
const PORT = process.env.MARKETING_PORT || process.env.PORT || 8090;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Marketing free-form rides Meta (defaultSendText is Twilio, wrong number). Template path already
// defaults to Meta in sendWa, so only sendText is injected.
const marketingSendWaDeps = {
  sendText: async ({ to, text }) => sendMetaText({ to, text }),
};

const app = express();
// Capture the raw body for X-Hub-Signature-256 verification; a re-serialized object won't match.
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.locals.supabase = supabase;

app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'marketing' }));

// ── Meta webhook: GET verify handshake + POST inbound ─────────────────────────
app.get('/webhook/meta', (req, res) => {
  if (handleVerifyChallenge(req, res, process.env.META_VERIFY_TOKEN)) return;
  return res.status(400).send('Bad Request');
});

// ── SHARED RECEIVER (TDW_05 Workstream-1, Option B / marketing-ingress) ───────
// One WABA has ONE callback; it lands here. This service is the INGRESS for the whole WABA:
// it verifies the Meta signature ONCE, then forks per-change by recipient phone_number_id.
// Marketing rides in-process (this service owns the marketing number); bride/vendor are forwarded
// to their own /webhook/meta carrying x-internal-replay — the sealed internal-trust boundary the
// dead-letter replay already uses — where the sibling skips Meta re-verify and processes with its
// own env/deps. FORWARD-ONLY: no Twilio net; the safety is receiver-green-before-repoint.

// Marketing lane IN-PROCESS. Byte-for-byte the sealed marketing path (dedupe → handle →
// dead-letter+graceful → statuses), now scoped to a single forked change's sub-body.
async function processMarketingChange(subBody) {
  const messages = normalizeMetaInbound(subBody);
  for (const msg of messages) {
    if (!msg.messageId) continue;
    if (sidSeen(msg.messageId)) { console.log(`${SERVICE_TAG} dup wamid ${msg.messageId}, skipping`); continue; }
    recordSid(msg.messageId);

    const hasText  = !!(msg.text && msg.text.trim());
    const hasMedia = Array.isArray(msg.media) && msg.media.length > 0;
    if (!hasText && !hasMedia) { console.warn(`${SERVICE_TAG} empty inbound from ${msg.from}, dropping`); continue; }

    console.log(`${SERVICE_TAG} ${msg.from} -> ${msg.text}`);
    try {
      await handleMarketingInbound({
        supabase, from: msg.from, text: msg.text, messageId: msg.messageId,
        sendWa, sendWaDeps: marketingSendWaDeps,
      });
    } catch (turnErr) {
      // Dead-letter the payload; try the graceful line (best-effort, Meta free-form).
      await captureDeadLetter({ supabase, service: 'marketing', phone: msg.from, payload: subBody, error: turnErr });
      try {
        await sendWa({ line: 'marketing', to: msg.from, text: GRACEFUL_TURN_LINE, windowOpen: true, supabase }, marketingSendWaDeps);
      } catch (_e) { /* graceful line is best-effort */ }
    }
  }
  // Delivery receipts (P6 renders chips; here we log, no schema).
  for (const s of extractStatuses(subBody)) {
    console.log(`${SERVICE_TAG} status wamid=${s.id} status=${s.status}${s.errors.length ? ` errors=${s.errors.length}` : ''}`);
  }
}

function selfUrlForLane(lane) {
  if (lane === 'bride')  return process.env.BRIDE_SELF_URL  || null;
  if (lane === 'vendor') return process.env.VENDOR_SELF_URL || null;
  return null;
}

// Forward a non-marketing change to the owning sibling. The ingress does NOT dedupe or record the
// wamid — the OWNING lane's process is the single dedupe home (each wamid recorded exactly once).
async function forwardChange(lane, subBody, phoneNumberId) {
  const base   = selfUrlForLane(lane);
  const secret = process.env.INTERNAL_REPLAY_SECRET;
  if (!base || !secret) {
    const missing = !base ? `${lane.toUpperCase()}_SELF_URL` : 'INTERNAL_REPLAY_SECRET';
    console.error(`${SERVICE_TAG} cannot forward ${lane} (PNID ${phoneNumberId}): ${missing} unset`);
    await captureDeadLetter({ supabase, service: `ingress-forward:${lane}`, phone: null, payload: subBody, error: new Error(`forward not configured: ${missing}`) });
    return;
  }
  try {
    const resp = await fetch(`${base}/webhook/meta`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-replay': secret },
      body: JSON.stringify(subBody),
    });
    if (!resp.ok) throw new Error(`sibling responded ${resp.status}`);
    console.log(`${SERVICE_TAG} forwarded ${lane} change (PNID ${phoneNumberId}) → ${resp.status}`);
  } catch (fwdErr) {
    console.error(`${SERVICE_TAG} forward to ${lane} failed:`, fwdErr && fwdErr.message);
    await captureDeadLetter({ supabase, service: `ingress-forward:${lane}`, phone: null, payload: subBody, error: fwdErr });
  }
}

app.post('/webhook/meta', async (req, res) => {
  // Ingress verifies the Meta signature ONCE for the whole WABA (local kill-switch only).
  if (process.env.DISABLE_META_SIGNATURE_CHECK !== 'true') {
    const okSig = verifyMetaSignature(req.rawBody, req.headers['x-hub-signature-256'], process.env.META_APP_SECRET);
    if (!okSig) {
      console.warn(`${SERVICE_TAG} invalid X-Hub-Signature-256`);
      return res.status(403).send('Forbidden');
    }
  }

  // Fast 200 to Meta; fork + forward run async (throughput irrelevant at test scale).
  res.status(200).send('ok');

  try {
    for (const { phoneNumberId, entryId, change } of changesWithPnid(req.body)) {
      const lane = laneForPnid(phoneNumberId);
      const subBody = buildSingleChangeBody(req.body, entryId, change);
      if (lane === 'marketing') {
        await processMarketingChange(subBody);
      } else if (lane === 'bride' || lane === 'vendor') {
        await forwardChange(lane, subBody, phoneNumberId);
      } else {
        console.warn(`${SERVICE_TAG} unknown recipient PNID ${phoneNumberId || '(none)'}, dropping change`);
      }
    }
  } catch (err) {
    console.error(`${SERVICE_TAG} inbound processing error:`, err && err.message);
  }
});

if (require.main === module) {
  warnIfSignatureCheckDisabled(SERVICE_TAG);
  scheduleMarketingCrons({ supabase, sendWa, sendWaDeps: marketingSendWaDeps });
  app.listen(PORT, () => {
    console.log(`${SERVICE_TAG} marketing service listening on :${PORT}`);
  });
}

module.exports = { app, marketingSendWaDeps };
