// src/lib/metaCloud.js — Meta WhatsApp Cloud API outbound transport (Block 05, P3).
//
// TRANSPORT (P-06.T, settled 2026-07-18): Meta WhatsApp Cloud API, DIRECT, TDW as Tech
// Provider on its own WABA. This module is the ONE place that speaks HTTP to Meta's send
// endpoint. It is wired behind sendWa's `defaultSendTemplate` seam (the ruled swap point)
// and behind the marketing line's free-form `sendText` (the marketing FROM is a Meta
// phone-number-id, not a Twilio-owned number, so it cannot ride src/lib/whatsapp.js).
//
// ENDPOINT:  POST https://graph.facebook.com/<version>/<phone-number-id>/messages
//   Authorization: Bearer <token>              (env META_WABA_TOKEN — referenced, never printed)
//   Content-Type:  application/json
//
// BODIES:
//   template → { messaging_product:'whatsapp', to, type:'template', template:{ name, language:{code}, components } }
//   text     → { messaging_product:'whatsapp', to, type:'text',     text:{ body, preview_url:false } }
//
// The `template` object is exactly what templates.buildTemplatePayload() already produces
// (name + language + components) — P2 built the payload; P3 only wraps + dispatches it.
//
// CREDS DISCIPLINE: token + phone-number-id come from env. If either is absent this module
// throws MetaNotConfiguredError rather than POST to nowhere — Movement A (no creds) refuses
// loudly; the live send is founder-gated (Movement B). fetch is injectable for the bench,
// so the POST SHAPE / name+language / error path are all proven against a fake HTTP layer
// with no network and no creds.
'use strict';

// ── typed errors ─────────────────────────────────────────────────────────────
class MetaError extends Error {
  constructor(message, code) { super(message); this.name = 'MetaError'; this.code = code; }
}
class MetaNotConfiguredError extends MetaError {
  constructor(m) { super(m || 'Meta Cloud API not configured (token / phone-number-id absent)', 'meta_not_configured'); this.name = 'MetaNotConfiguredError'; }
}
class MetaSendError extends MetaError {
  constructor(message, status, body) {
    super(message, 'meta_send_failed');
    this.name = 'MetaSendError';
    this.status = status;
    this.body = body;
  }
}

// ── config resolution (env-referenced, never printed) ────────────────────────
function resolveConfig(overrides = {}) {
  const token         = overrides.token         || process.env.META_WABA_TOKEN || null;
  const phoneNumberId = overrides.phoneNumberId || process.env.MARKETING_PHONE_NUMBER_ID || null;
  const graphVersion  = overrides.graphVersion  || process.env.META_GRAPH_VERSION || 'v21.0';
  return { token, phoneNumberId, graphVersion };
}

function isConfigured(overrides = {}) {
  const { token, phoneNumberId } = resolveConfig(overrides);
  return !!token && !!phoneNumberId;
}

// ── Meta wants a bare international number: strip 'whatsapp:' and a leading '+' ─
// ⚠ **THIS FUNCTION STRIPS, IT NEVER ADDS, AND IT IS NOT ONLY THE TRANSPORT'S.**
// R-40.91's guard was first written HERE and that was wrong — see `postMessage`
// below, and the census in its header. `normalizeTo` has EIGHT non-send callers
// that use it as a shared phone cleaner (closerEngine 653/1131, prospects 94,
// demoAdmin 197/207/219/398). One of them hands it an EMPTY STRING on purpose and
// tests the result for truthiness. A guard here refuses all of them.
function normalizeTo(to) {
  let n = String(to || '').trim();
  if (n.startsWith('whatsapp:')) n = n.slice('whatsapp:'.length);
  if (n.startsWith('+')) n = n.slice(1);
  return n;
}

// ── the one POST ─────────────────────────────────────────────────────────────
// deps.fetchImpl is injectable; production falls back to global.fetch (Node 18+/22).
// ⚠ **R-40.91 · THE E.164 GUARD LIVES HERE, AT THE ONE POST.**
//
// F-40.185 is what its absence cost: the contract sign door handed `9327715877` —
// ten digits, no country code — and Meta answered **200 with a wamid**. No error
// to catch, no exception to log, a leaf that advanced to a code screen for a code
// that reached nobody. Only a walk could see it.
//
// ⚠ **AND IT DOES NOT LIVE IN `normalizeTo`, WHICH IS WHERE THIS SEAT FIRST PUT
// IT.** That was wrong and the census says why: `normalizeTo` has EIGHT
// NON-SEND CALLERS using it as a shared phone cleaner — `closerEngine.js:653`
// and `:1131` compare and log with it, `prospects.js:94` cleans what a human
// typed before storing it, `demoAdmin.js:197/207/219/398` dedupe a roster by it,
// and that last one hands it an EMPTY STRING deliberately and tests the result
// for truthiness. A guard there refuses every one of them, and four benches went
// red saying so.
//
// `postMessage` is the one place a message actually reaches the wire — every
// send, template or text, funnels through it. THAT is the transport home the
// ruling names. A rule at the callers is a rule the next caller will not know
// about; a rule at the cleaner is a rule that punishes eight readers who are not
// sending anything at all.
//
// ⚠ THE BOUNDS ARE E.164's OWN, AND THE FLOOR WAS CHOSEN NOT INHERITED. A country
// code is 1–3 digits and the total reaches at most 15 (ITU-T E.164); the shortest
// live numbers in service are 11 with their code. A bare Indian mobile is 10 —
// exactly the shape that failed — so 11 is the floor that catches it. Nine send
// sites were traced and none hands a shortcode; if one ever does, this throws
// where before it would have dropped in silence.
const E164_MIN_DIGITS = 11;
const E164_MAX_DIGITS = 15;

function assertE164(to) {
  const n = String(to == null ? '' : to);
  if (!/^\d+$/.test(n)) {
    throw new MetaSendError(
      `Meta send refused: recipient is not digits-only (got ${JSON.stringify(n)}). ` +
      'Use toE164() from src/lib/phone.js before sending.', null, null);
  }
  if (n.length < E164_MIN_DIGITS || n.length > E164_MAX_DIGITS) {
    throw new MetaSendError(
      `Meta send refused: recipient is not E.164 (got ${n.length} digit(s); ` +
      `expected ${E164_MIN_DIGITS}-${E164_MAX_DIGITS} with a country code). ` +
      'Use toE164() from src/lib/phone.js before sending.', null, null);
  }
  return n;
}

async function postMessage(body, { fetchImpl, ...overrides } = {}) {
  const { token, phoneNumberId, graphVersion } = resolveConfig(overrides);
  if (!token || !phoneNumberId) throw new MetaNotConfiguredError();

  // ⚠ BEFORE THE REQUEST, NOT AFTER. A refusal that arrives as a Meta 200 is not
  // a refusal at all — that is the whole of F-40.185.
  assertE164(body && body.to);

  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) throw new MetaError('no fetch implementation available', 'no_fetch');

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const res = await doFetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  // Parse defensively — Meta returns JSON on success and on error.
  let parsed = null;
  try { parsed = await res.json(); } catch (_e) { parsed = null; }

  if (!res || !res.ok) {
    const status  = res && res.status;
    const metaMsg = parsed && parsed.error && parsed.error.message;
    throw new MetaSendError(
      `Meta send failed (status ${status})${metaMsg ? `: ${metaMsg}` : ''}`,
      status,
      parsed,
    );
  }

  // On success Meta returns { messaging_product, contacts:[...], messages:[{ id: <wamid> }] }.
  const wamid = parsed && parsed.messages && parsed.messages[0] && parsed.messages[0].id;
  return { ok: true, wamid: wamid || null, raw: parsed };
}

// ── template send (the ruled swap seam) ──────────────────────────────────────
// payload is templates.buildTemplatePayload() output: { name, language:{code}, components }.
async function sendMetaTemplate({ to, payload }, opts = {}) {
  const body = {
    messaging_product: 'whatsapp',
    to: normalizeTo(to),
    type: 'template',
    template: payload,
  };
  return postMessage(body, opts);
}

// ── free-form text send (marketing line's holding line rides this) ───────────
async function sendMetaText({ to, text }, opts = {}) {
  const body = {
    messaging_product: 'whatsapp',
    to: normalizeTo(to),
    type: 'text',
    text: { body: String(text == null ? '' : text), preview_url: false },
  };
  return postMessage(body, opts);
}

module.exports = {
  assertE164,
  sendMetaTemplate,
  sendMetaText,
  postMessage,
  normalizeTo,
  isConfigured,
  resolveConfig,
  MetaError,
  MetaNotConfiguredError,
  MetaSendError,
};
