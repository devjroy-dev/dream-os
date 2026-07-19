// src/lib/sendWa.js — the single outbound WhatsApp gate (Block 05, P2).
//
// CONTRACT (TDW_05_WEBHOOK_FINAL §P2, reconciled to P-06.T Meta-direct):
//   sendWa({ line, to, text?, templateKey?, vars?, windowOpen?, conversationId?, supabase?, mediaUrls? }, deps?)
//
//   • FROM is resolved by `line` ('bride' | 'vendor' | 'marketing').
//   • If a 24h session is OPEN → free-form `text` is sent.
//   • If the session is CLOSED (or a `templateKey` is given) → an APPROVED template is
//     REQUIRED. An unapproved/absent template, or a closed window with only free-form
//     text, produces a TYPED error and sends NOTHING. There is never a silent drop.
//   • All sends go through the transport (`sendText`/`sendTemplate`), which is where the
//     ledger line is emitted — "ledgered as today" (see NOTE ON THE LEDGER below).
//
// NOTE ON THE LEDGER (disclosed): src/lib/whatsapp.js does NOT write a DB row today — it
// emits the `[whatsapp:out]` console line and returns the provider message; the `messages`
// rows are written by the webhook call sites, and the bride cron writes none. So "ledgered
// as today" for these paths = that transport-level log line. sendWa preserves it by routing
// every successful send through the transport. The bench asserts the transport is invoked
// on success and NOT invoked on any refusal.
//
// NOTE ON THE WINDOW SIGNAL (disclosed deviation): the spec asked sendWa to self-query the
// 24h window. Determining "last inbound" differs per line/conversation, and guessing that
// key across lines is exactly the class of bug the estate has been burned by. So sendWa
// requires the window to be *supplied*: an explicit `windowOpen` boolean, an injected
// `isWindowOpen`, or a `conversationId` (+ supabase) it can run a generic last-inbound query
// against. With none of these it throws `WaWindowUndeterminedError` rather than assume open.
// The bride cron supplies `windowOpen` (buildNudge already decided it).
//
// NOTE ON THE TEMPLATE TRANSPORT (disclosed gap): the default `sendTemplate` is the seam for
// the Meta Cloud API POST. That transport swap is a separate work item (P-06.T / §P3), no
// template is approved yet, and no Cloud API credentials exist in this sitting — so the
// default throws `WaTemplateTransportNotWiredError` rather than ship an unrun network call.
// sendWa's template ROUTING (approval gate + Meta payload build + dispatch) is fully proven
// in the bench against an injected transport; only the live POST is deferred.

'use strict';

const { isApproved, buildTemplatePayload, getTemplate } = require('./templates');

// ── typed errors ────────────────────────────────────────────────────────────
class WaError extends Error {
  constructor(message, code) { super(message); this.name = 'WaError'; this.code = code; this.sent = false; }
}
class WaWindowClosedError extends WaError {
  constructor(m) { super(m || 'session window closed; free-form send refused', 'window_closed'); this.name = 'WaWindowClosedError'; }
}
class WaWindowUndeterminedError extends WaError {
  constructor(m) { super(m || 'window state not supplied; refusing to guess', 'window_undetermined'); this.name = 'WaWindowUndeterminedError'; }
}
class WaTemplateNotApprovedError extends WaError {
  constructor(m) { super(m || 'template is not approved', 'template_not_approved'); this.name = 'WaTemplateNotApprovedError'; }
}
class WaTemplateVarsError extends WaError {
  constructor(m) { super(m || 'template variables invalid', 'template_vars'); this.name = 'WaTemplateVarsError'; }
}
class WaTemplateTransportNotWiredError extends WaError {
  constructor(m) { super(m || 'template send transport (Meta Cloud API) not wired yet', 'template_transport_unwired'); this.name = 'WaTemplateTransportNotWiredError'; }
}
class WaLineNotConfiguredError extends WaError {
  constructor(m) { super(m || 'no FROM number configured for line', 'line_not_configured'); this.name = 'WaLineNotConfiguredError'; }
}
class WaBadCallError extends WaError {
  constructor(m) { super(m || 'sendWa requires exactly one of {text, templateKey}', 'bad_call'); this.name = 'WaBadCallError'; }
}

// ── FROM resolution by line ──────────────────────────────────────────────────
// Today ALL outbound leaves via the single Twilio sender (TWILIO_WHATSAPP_NUMBER).
// Bride resolves to that exact value → the bride free-form path is byte-identical to
// today's `sendWhatsApp(phone, msg)`. Vendor may later get its own send number; until
// then it also uses the shared sender (no behavior change). Marketing has NO fallback —
// W-2/§3 forbid it borrowing a production FROM; unset → typed error, never a wrong send.
function resolveFrom(line) {
  switch (line) {
    case 'bride':
      return process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550';
    case 'vendor':
      return process.env.VENDOR_WHATSAPP_NUMBER
          || process.env.TWILIO_WHATSAPP_NUMBER
          || 'whatsapp:+14787788550';
    case 'marketing':
      return process.env.MARKETING_WHATSAPP_NUMBER || null;
    default:
      return null;
  }
}

// ── default transports (real; lazily required so this module loads with no deps) ─────────
async function defaultSendText({ from, to, text, mediaUrls }) {
  const { sendWhatsApp } = require('./whatsapp'); // lazy: avoids loading twilio at bench time
  return sendWhatsApp(to, text, mediaUrls || [], from);
}
async function defaultSendTemplate({ key }) {
  // Seam for the Meta Cloud API POST /{phone-number-id}/messages with the template payload.
  // Deferred to the transport-swap work item (P-06.T). Refuse loudly rather than pretend.
  throw new WaTemplateTransportNotWiredError(
    `template '${key}' is approved but the Meta Cloud API send transport is not wired yet`
  );
}
async function defaultIsWindowOpen({ conversationId, supabase }) {
  if (!conversationId || !supabase) {
    throw new WaWindowUndeterminedError();
  }
  const { data: lastInbound } = await supabase
    .from('messages')
    .select('created_at')
    .eq('conversation_id', conversationId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastInbound) return false;
  const hours = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60);
  return hours <= 24;
}

// ── the gate ─────────────────────────────────────────────────────────────────
async function sendWa(opts, deps = {}) {
  const {
    line, to, text, templateKey, vars,
    windowOpen, conversationId, supabase, mediaUrls,
  } = opts || {};

  const sendText     = deps.sendText     || defaultSendText;
  const sendTemplate = deps.sendTemplate || defaultSendTemplate;
  const isWindowOpen = deps.isWindowOpen || defaultIsWindowOpen;

  if (!line || !to) throw new WaBadCallError('sendWa requires `line` and `to`');
  if (!!text === !!templateKey) {
    throw new WaBadCallError('sendWa requires exactly one of {text, templateKey}');
  }

  const from = resolveFrom(line);
  if (!from) throw new WaLineNotConfiguredError(`line '${line}' has no configured FROM number`);

  // ── template path (business-initiated / out-of-window) ──────────────────────
  if (templateKey) {
    if (!isApproved(templateKey)) {
      const t = getTemplate(templateKey);
      throw new WaTemplateNotApprovedError(
        t ? `template '${templateKey}' status is '${t.status}', not 'approved'`
          : `template '${templateKey}' is not in the registry`
      );
    }
    let payload;
    try {
      payload = buildTemplatePayload(templateKey, vars);
    } catch (e) {
      throw new WaTemplateVarsError(e.message);
    }
    const res = await sendTemplate({ from, to, key: templateKey, line, payload });
    return { sent: true, mode: 'template', key: templateKey, from, to, payload, result: res };
  }

  // ── free-form path (in-window only) ─────────────────────────────────────────
  let open;
  if (typeof windowOpen === 'boolean') {
    open = windowOpen;
  } else {
    open = await isWindowOpen({ to, line, conversationId, supabase });
  }
  if (!open) {
    throw new WaWindowClosedError('session window closed; use an approved template to reach this recipient');
  }
  const res = await sendText({ from, to, text, mediaUrls, line });
  return { sent: true, mode: 'text', from, to, result: res };
}

module.exports = {
  sendWa,
  resolveFrom,
  // errors (typed, for callers that branch on failure)
  WaError,
  WaWindowClosedError,
  WaWindowUndeterminedError,
  WaTemplateNotApprovedError,
  WaTemplateVarsError,
  WaTemplateTransportNotWiredError,
  WaLineNotConfiguredError,
  WaBadCallError,
  // exposed for tests/other callers
  defaultIsWindowOpen,
};
