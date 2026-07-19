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
function normalizeTo(to) {
  let n = String(to || '').trim();
  if (n.startsWith('whatsapp:')) n = n.slice('whatsapp:'.length);
  if (n.startsWith('+')) n = n.slice(1);
  return n;
}

// ── the one POST ─────────────────────────────────────────────────────────────
// deps.fetchImpl is injectable; production falls back to global.fetch (Node 18+/22).
async function postMessage(body, { fetchImpl, ...overrides } = {}) {
  const { token, phoneNumberId, graphVersion } = resolveConfig(overrides);
  if (!token || !phoneNumberId) throw new MetaNotConfiguredError();

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
