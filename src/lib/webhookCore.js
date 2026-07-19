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
// NOTE (the Movement B seam): the "no message row … (callback ignored)" branch is the
// Session-5.5 race — a callback can arrive before the outbound row is inserted. Movement B
// replaces that drop with an in-process retry (3 × 2s → callback_unmatched). Kept verbatim
// here so the extraction proves byte-identical first.
function makeTwilioStatusHandler({ supabase, prefix }) {
  return async (req, res) => {
    try {
      const sid     = req.body.MessageSid    || req.body.SmsSid    || null;
      const status  = req.body.MessageStatus || req.body.SmsStatus || null;
      const errCode = req.body.ErrorCode || null;

      console.log(`${prefix} sid=${sid} status=${status}${errCode ? ` errCode=${errCode}` : ''}`);

      if (!sid || !status) {
        return res.status(200).send('ok');
      }

      const { data, error } = await supabase
        .from('messages')
        .update({ delivery_status: status })
        .eq('twilio_sid', sid)
        .select('id');

      if (error) {
        console.error(`${prefix} db update error:`, error);
      } else if (!data || data.length === 0) {
        console.log(`${prefix} no message row for sid=${sid} (callback ignored)`);
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

module.exports = {
  logInbound,
  verifyTwilioSignature,
  normalizeMedia,
  isEmptyInbound,
  makeTwilioStatusHandler,
  warnIfSignatureCheckDisabled,
};
