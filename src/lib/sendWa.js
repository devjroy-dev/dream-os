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
const { sendMetaTemplate, normalizeTo } = require('./metaCloud');
const { isNudgeOptedOut } = require('./nudgeOptout');   // TDW_05 P4 / F-05.22

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
// TDW_05 P3: cross-line opt-out. STOP/UNSUBSCRIBE on the marketing lane sets prospects.state
// ='opted_out'; this gate refuses ANY subsequent send to that phone on ANY line — a POSITIVE
// typed refusal, never a silent drop (CE ruling 2). STOP means STOP, per number, across lines.
class WaOptedOutError extends WaError {
  constructor(m) { super(m || 'recipient has opted out; send refused across all lines', 'opted_out'); this.name = 'WaOptedOutError'; }
}
// TDW_05 P4: NUDGE-CLASS opt-out (F-05.22). A SEPARATE, NARROWER refusal from the one
// above and deliberately a separate error class — the two must never be caught by one
// handler. WaOptedOutError means "this number is out of the estate, all lines". This one
// means only "this number paused MORNING MESSAGES on THIS lane"; every other send to it,
// including on the other lane, proceeds untouched. Fires only when the caller declares
// `nudgeClass: true`; no existing call site does, so every current path is byte-identical.
class WaNudgeOptedOutError extends WaError {
  constructor(m) { super(m || 'recipient paused nudge-class messages on this line', 'nudge_opted_out'); this.name = 'WaNudgeOptedOutError'; }
}

// ── FROM resolution by line ──────────────────────────────────────────────────
// M2b / F3 (CE-62) — THE INVERSION. Every lane now reads its OWN *_WHATSAPP_NUMBER
// FIRST; TWILIO_WHATSAPP_NUMBER survives only as the transitional fallback so this
// deploy does not depend on an env change landing in the same breath (founder adds
// the new names before deploy, deletes the old after the smoke).
//
// Pre-M2b, `bride` read TWILIO_WHATSAPP_NUMBER exclusively — which made a retiring
// transport var the load-bearing key for Meta lane resolution on a LIVE lane. That
// inversion is the whole point of this edit.
//
// DISCLOSED BEHAVIOR CHANGE: the hardcoded 'whatsapp:+14787788550' tail is GONE from
// both lanes. It is the dead Twilio sandbox literal (F-05.20's second fallback), and
// silently defaulting a production lane onto a number that no longer answers is the
// exact failure this sitting exists to remove. Unset now yields null →
// WaLineNotConfiguredError, the same typed loud refusal marketing has always had.
function resolveFrom(line) {
  switch (line) {
    case 'bride':
      return process.env.BRIDE_WHATSAPP_NUMBER
          || process.env.TWILIO_WHATSAPP_NUMBER
          || null;
    case 'vendor':
      return process.env.VENDOR_WHATSAPP_NUMBER
          || process.env.TWILIO_WHATSAPP_NUMBER
          || null;
    case 'marketing':
      return process.env.MARKETING_WHATSAPP_NUMBER || null;
    default:
      return null;
  }
}

// ── default transports (real; lazily required so this module loads with no deps) ─────────
async function defaultSendText({ from, to, text, mediaUrls }) {
  const { sendWhatsApp } = require('./whatsapp'); // lazy: keeps this module dependency-light at bench time
  return sendWhatsApp(to, text, mediaUrls || [], from);
}
// TDW_05 P3 — THE RULED TRANSPORT SWAP. This seam now POSTs the approved template to the Meta
// Cloud API (/{phone-number-id}/messages), name+language+components from the registry payload
// P2 already built. The phone-number-id is resolved by line from env (marketing today; vendor/
// bride ids are P4's business-initiated sends). metaCloud reads token + id from env and throws
// MetaNotConfiguredError when either is absent — so a creds-less deploy REFUSES loudly rather
// than sends to nowhere (cure-precedes-exposure: the live send is founder-gated, Movement B).
function phoneNumberIdFor(line) {
  switch (line) {
    case 'marketing': return process.env.MARKETING_PHONE_NUMBER_ID || null;
    case 'vendor':    return process.env.VENDOR_PHONE_NUMBER_ID || null;   // P4 seam
    case 'bride':     return process.env.BRIDE_PHONE_NUMBER_ID  || null;   // P4 seam
    default:          return null;
  }
}
async function defaultSendTemplate({ to, key, line, payload }) {
  const phoneNumberId = phoneNumberIdFor(line);
  // metaCloud.resolveConfig falls back to MARKETING_PHONE_NUMBER_ID; pass the line's id
  // explicitly so a vendor/bride template (P4) targets the right number, not marketing's.
  return sendMetaTemplate({ to, payload }, phoneNumberId ? { phoneNumberId } : {});
}

// ── default cross-line opt-out checker ───────────────────────────────────────
// Positive gate: returns true iff `to` is a prospect with state='opted_out'. Runs on every line.
// prospects.phone is stored normalized (digits, country code, no '+', no 'whatsapp:'); we match
// the send target the same way. Needs a supabase handle; when none is supplied AND no isOptedOut
// dep is injected, the send CANNOT be checked — that is a NAMED residual (handover census), never
// a silent open: the marketing lane (where STOP originates) always supplies supabase.
async function defaultIsOptedOut({ to, supabase }) {
  if (!supabase) return false; // cannot check here; caller-census residual, not a silent pass
  const phone = normalizeTo(to);
  const { data } = await supabase
    .from('prospects')
    .select('state')
    .eq('phone', phone)
    .eq('state', 'opted_out')
    .limit(1)
    .maybeSingle();
  return !!data;
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
    nudgeClass,   // TDW_05 P4 / F-05.22 — opt-in flag; absent ⇒ pre-cure behaviour
  } = opts || {};

  const sendText       = deps.sendText       || defaultSendText;
  const sendTemplate   = deps.sendTemplate   || defaultSendTemplate;
  const isWindowOpen   = deps.isWindowOpen   || defaultIsWindowOpen;
  const isOptedOut     = deps.isOptedOut     || defaultIsOptedOut;
  const isNudgeOptedOutFn = deps.isNudgeOptedOut || isNudgeOptedOut;

  if (!line || !to) throw new WaBadCallError('sendWa requires `line` and `to`');
  if (!!text === !!templateKey) {
    throw new WaBadCallError('sendWa requires exactly one of {text, templateKey}');
  }

  const from = resolveFrom(line);
  if (!from) throw new WaLineNotConfiguredError(`line '${line}' has no configured FROM number`);

  // ── cross-line opt-out gate (P3) — positive typed refusal, before any dispatch ──────────────
  // Runs on ALL lines. An opted-out phone is blocked whether the send is template or free-form,
  // marketing or bride/vendor. Silent drops are forbidden; refusal is a typed, catchable error.
  if (await isOptedOut({ to, line, supabase })) {
    throw new WaOptedOutError(`recipient ${to} has opted out; refusing send on line '${line}'`);
  }

  // ── nudge-class gate (P4, F-05.22) — narrower, and LANE-SCOPED ───────────────────────────────
  // ORDER IS LOAD-BEARING: the full stop is checked FIRST and keeps its own error. A number that
  // is both fully opted out and nudge-paused refuses as WaOptedOutError, the stronger and truer
  // fact. This gate only ever runs for a caller that declared itself nudge-class.
  if (nudgeClass && await isNudgeOptedOutFn({ supabase, phone: to, lane: line })) {
    throw new WaNudgeOptedOutError(`recipient ${to} paused morning messages on line '${line}'`);
  }

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
  WaOptedOutError,
  WaNudgeOptedOutError,
  // exposed for tests/other callers
  defaultIsWindowOpen,
  defaultIsOptedOut,
  defaultSendTemplate,
  phoneNumberIdFor,
};
