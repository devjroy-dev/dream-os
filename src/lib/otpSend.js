// src/lib/otpSend.js — OTP/auth transport selector (Block 05, F-05.6 fix (a), CE-35).
//
// PRIMARY (a): when a lane is Meta-live, an OTP rides the lane's Meta phone-number-id as
// an AUTHENTICATION-category template (metaCloud.sendMetaTemplate) — Meta's purpose-built
// OTP mechanism (preset text + code param + copy-code button).
// FALLBACK (b, sealed): when the lane is NOT Meta-live, the caller's own Twilio send runs
// UNCHANGED (the dedicated OTP_WA_NUMBER path). The change is therefore DORMANT and
// byte-identical until each lane's *_PHONE_NUMBER_ID is provisioned — the SAME dormancy
// pattern as the whatsapp.js transport migration.
//
// ── F-05.2 opt-out BYPASS IS STRUCTURAL (do not "fix") ───────────────────────────────
// The marketing opt-out gate lives ONLY inside whatsapp.js's Meta branch. This module
// calls metaCloud.sendMetaTemplate DIRECTLY and NEVER requires or routes through
// whatsapp.js — so OTP can never be gated by it. This is CORRECT and Meta-compliant:
// AUTHENTICATION templates are opt-out-exempt. There is deliberately NO carve-out code
// here; the bypass is a property of the call graph, and the bench asserts whatsapp.js's
// sendWhatsApp is never invoked on any OTP path.
//
// ── LANE → phone-number-id resolution (the same SIGNAL metaLaneFor uses) ─────────────
// metaLaneFor's Meta-live signal is "the lane's *_PHONE_NUMBER_ID present in THIS
// process". The OTP sites already KNOW their lane statically (couple/circle = bride,
// vendor = vendor), so we key directly on that PNID env by lane. We deliberately do NOT
// call metaLaneFor(from, ...) here: the OTP files derive `from` from BRIDE_WA_NUMBER /
// TDW_WA_NUMBER, whereas metaLaneFor matches against BRIDE_WHATSAPP_NUMBER /
// VENDOR_WHATSAPP_NUMBER — divergent env-var names, so a number-match could spuriously
// fail. Keying on PNID presence by lane is the robust half of the same signal.
// (Filed: F-05.7 — the from-var divergence — see the handover; chair to rule.)
//
// SECURITY: the OTP `code` is threaded ONLY into the auth-template params (body + button)
// or handed to the caller's Twilio closure. It is NEVER logged by this module.
'use strict';

const metaCloud = require('./metaCloud');
const templates = require('./templates');

// Resolve a lane's Meta phone-number-id, or null when the lane is not Meta-live.
// `lane` is 'bride' (couple + circle) or 'vendor'. Env is injectable for the bench.
function otpMetaPnid(lane, env = process.env) {
  if (lane === 'bride')  return env.BRIDE_PHONE_NUMBER_ID  || null;
  if (lane === 'vendor') return env.VENDOR_PHONE_NUMBER_ID || null;
  return null;
}

// sendOtpCode — send a one-time `code` to `to`, choosing transport by lane liveness.
//
//   to          : string  — recipient phone (E.164)
//   code        : string  — the one-time code (NEVER logged here)
//   lane        : 'bride' | 'vendor'
//   templateKey : string  — the AUTHENTICATION template registry key for this site
//   twilioSend  : () => Promise — the caller's existing Twilio send, run UNCHANGED on fallback
//   deps        : { metaCloud, templates, env } — test injection
//
// Returns { transport:'meta', result } on the Meta path, or { transport:'twilio', result }
// on the fallback. Throws propagate to the caller's existing try/catch (which deletes the
// otp_session and returns 500 — the preserved security shape).
async function sendOtpCode({ to, code, lane, templateKey, twilioSend, deps = {} }) {
  const _meta      = deps.metaCloud || metaCloud;
  const _templates = deps.templates || templates;
  const env        = deps.env || process.env;

  const pnid = otpMetaPnid(lane, env);
  if (pnid) {
    // PRIMARY: Meta auth template on the lane's number. Un-gated by F-05.2 (direct call).
    const payload = _templates.buildAuthTemplatePayload(templateKey, code);
    const result  = await _meta.sendMetaTemplate({ to, payload }, { phoneNumberId: pnid });
    return { transport: 'meta', result };
  }

  // FALLBACK: lane not Meta-live — run the caller's Twilio send byte-identically.
  if (typeof twilioSend !== 'function') {
    throw new Error('otpSend: twilioSend fallback missing on non-Meta lane');
  }
  const result = await twilioSend();
  return { transport: 'twilio', result };
}

module.exports = { sendOtpCode, otpMetaPnid };
