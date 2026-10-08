'use strict';
// src/lib/partners/wa.js · CE-47 · PTN-A2-3 · CALLS TO PARTNERS ON WHATSAPP, from the MARKETING line (the chair's ruling with
// the founder's yes, 8 Oct 2026). One home for: the partner's yes to WhatsApp (the founder's opt-in sentence, word for word),
// the lane a call takes (one lane per call, never both), whether the WhatsApp lane is open, and the one send.
//   optInPatch(body, org, now) : the partner's own Settings. Yes needs the partner's own number in full international form;
//                                the yes is kept with its time and its words (0219's whatsapp_opt_at, whatsapp_opt_words).
//   laneFor(org)               : 'whatsapp' for a partner that said yes and gave a number; else 'email' when it has a calls
//                                email; else null (no lane, no row).
//   waReady(sb)                : the registry says approved AND the switchboard row (0219, moved by Meta's word through the
//                                sweep) reads approved or on. A pause or a rejection shuts the lane by itself.
//   sendCall(...)              : tdw_partner_call through sendWa, line 'marketing'. The button's parameter is the token
//                                (the suffix), never the full address.
// No phone of anyone leaves in a response body: the partner's own number is read only by the sender.
const { isApproved } = require('../templates');
const capabilities = require('../capabilities');

// The founder's opt-in sentence, approved 8 Oct 2026, word for word.
const OPT_IN_WORDS = 'Send me collab calls from The Dream Wedding on WhatsApp, at this number';
const CAP_KEY = 'template.tdw_partner_call';
const PHONE = /^\+[0-9]{8,15}$/;
const WORDS = Object.freeze({
  needNumber: 'To get calls on WhatsApp, write your WhatsApp number with the country code, for example +91 98111 00021.',
});

function optInPatch(b = {}, org = {}, now = new Date()) {
  if (b.whatsapp_opt === undefined && b.whatsapp_phone === undefined) return { ok: true, row: {} };
  const row = {};
  let phone = org.whatsapp_phone || null;
  if (b.whatsapp_phone !== undefined) {
    const p = typeof b.whatsapp_phone === 'string' ? b.whatsapp_phone.replace(/[^0-9+]/g, '') : '';
    if (p && !PHONE.test(p)) return { ok: false, error: WORDS.needNumber };
    phone = p || null; row.whatsapp_phone = phone;
  }
  if (b.whatsapp_opt === true) {
    if (!phone) return { ok: false, error: WORDS.needNumber };
    Object.assign(row, { whatsapp_opt: true, whatsapp_opt_at: now.toISOString(), whatsapp_opt_words: OPT_IN_WORDS });
  } else if (b.whatsapp_opt === false) {
    Object.assign(row, { whatsapp_opt: false, whatsapp_opt_at: null, whatsapp_opt_words: null });
  }
  return { ok: true, row };
}

const saidYes = (o) => !!o && o.whatsapp_opt === true && !!o.whatsapp_opt_at && PHONE.test(String(o.whatsapp_phone || ''));
function laneFor(o) {
  if (saidYes(o)) return 'whatsapp';
  if (o && o.calls_email) return 'email';
  return null;
}

async function waReady(sb, deps = {}) {
  if (!(deps.isApproved || isApproved)('partner_call')) return false;
  const row = await (deps.capGet || capabilities.get)(CAP_KEY, { supabase: sb });
  return !!row && (row.status === 'approved' || row.status === 'on');
}

async function sendCall(sb, { org, shape, token }, deps = {}) {
  const sendWa = deps.sendWa || require('../sendWa').sendWa;
  return sendWa({ line: 'marketing', to: org.whatsapp_phone, templateKey: 'partner_call', supabase: sb, site: 'partners:call',
    vars: { partner: org.name, vendor: shape.vendor.name, needs: shape.needs, date: shape.date_words, city: shape.city, code: token } }, deps.sendWaDeps || {});
}

module.exports = { OPT_IN_WORDS, CAP_KEY, WORDS, optInPatch, laneFor, saidYes, waReady, sendCall };
