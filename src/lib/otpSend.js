// src/lib/otpSend.js — OTP/auth transport selector (Block 05, F-05.6 fix (a), CE-35).
//
// An OTP rides its lane's Meta phone-number-id as an AUTHENTICATION-category template
// (metaCloud.sendMetaTemplate) — Meta's purpose-built OTP mechanism (preset text + code
// param + copy-code button).
//
// TDW_05 M2b — FOUNDER-RULED FULL SUNSET, option (ii) (CE-62). The Twilio fallback
// else-branch is DELETED. OTP is Meta-only; the primary path's weeks of production
// witness stand as its seal. A lane with no *_PHONE_NUMBER_ID no longer degrades to a
// second transport — it THROWS, loudly and by name, into the caller's existing
// try/catch, which deletes the otp_session and returns 500. That shape is preserved
// exactly: never a silent success, never a resurrection of the dead transport.
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
// call metaLaneFor(from, ...) here: the OTP sites know their lane STATICALLY, and PNID
// presence is the robust half of the same signal with no number-matching to get wrong.
// F-05.7 CLOSES AT M2b: the OTP files no longer derive a `from` at all (their Twilio
// consts died with the else-branch), so the from-var divergence the finding named has
// no remaining site. The *_WHATSAPP_NUMBER reconciliation landed in whatsapp.js/sendWa.js.
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
//   deps        : { metaCloud, templates, env } — test injection
//
// Returns { transport:'meta', result }. Throws on an unresolvable lane, and throws
// propagate to the caller's existing try/catch (which deletes the otp_session and
// returns 500 — the preserved security shape).
async function sendOtpCode({ to, code, lane, templateKey, deps = {} }) {
  const _meta      = deps.metaCloud || metaCloud;
  const _templates = deps.templates || templates;
  const env        = deps.env || process.env;

  const pnid = otpMetaPnid(lane, env);
  if (!pnid) {
    // M2b: no fallback exists. Fail LOUD and NAMED rather than quietly doing nothing —
    // an auth path that silently declines to send is worse than one that errors.
    throw new Error(
      `otpSend: lane '${lane}' has no Meta phone-number-id (` +
      (lane === 'bride' ? 'BRIDE_PHONE_NUMBER_ID' : lane === 'vendor' ? 'VENDOR_PHONE_NUMBER_ID' : 'unknown lane') +
      ' unset); OTP cannot be sent and there is no Twilio fallback (M2b)'
    );
  }
  // Meta auth template on the lane's number. Un-gated by F-05.2 (direct call, by design).
  const payload = _templates.buildAuthTemplatePayload(templateKey, code);
  const result  = await _meta.sendMetaTemplate({ to, payload }, { phoneNumberId: pnid });
  return { transport: 'meta', result };
}

module.exports = { sendOtpCode, otpMetaPnid };
