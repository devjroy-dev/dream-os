'use strict';
// src/lib/partners/words.js · CE-47 · PTN-A2-1 · the words partners and vendors read about calls, ONE HOME.
// The founder's one rule: simple and descriptive. Role words: CLB's rolesLine (src/lib/collab/social.js) for the eleven
// trades; it has no word for 0197's model, stylist and studio (candidate F-44.417, CLB's), so those three live here.
const { rolesLine, PAY_WORD } = require('../collab/social');
const { formatRs, formatDateLong } = require('../format');
const EXTRA = Object.freeze({ model: 'model', stylist: 'stylist', studio: 'studio' });
const roleWord = (k) => EXTRA[k] || rolesLine([{ requirement_type: k }]) || 'person';
const plural = (w, n) => (n === 1 ? w : (/(s|sh|ch|x)$/.test(w) ? `${w}es` : (/y$/.test(w) && !/[aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`)));
const needsLine = (roles) => (roles || []).map((r) => { const n = Number(r.needed) > 0 ? Number(r.needed) : 1; return `${n} ${plural(roleWord(r.role), n)}`; }).join(', ');
const payLine = (pay, from, to) => {
  const w = PAY_WORD[pay] || 'Pay not said';
  if (pay === 'paid' && from != null && to != null) return `${w}, Rs ${formatRs(from)} to Rs ${formatRs(to)}`;
  if (pay === 'paid' && to != null) return `${w}, up to Rs ${formatRs(to)}`;
  return w;
};
// A vendor's note may hold a phone or an email by accident: masked before any partner reads it (rule K).
const maskNote = (s) => (s ? String(s).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email hidden]').replace(/\+?\d[\d\s-]{8,}\d/g, '[number hidden]').slice(0, 200) : null);
const W = Object.freeze({
  callClosed: 'This call is closed or its date has passed.',
  blocked: 'This partner account is blocked. Write to partners@thedreamwedding.in.',
  stopped: 'Calls are stopped for this partner.',
  paused: 'Calls are paused for this partner.',
  noEmail: 'This partner has no email for calls.',
  noKey: 'RESEND_API_KEY is not set, so nothing was sent.',
  window: 'Calls go out between 9 am and 8 pm, India time.',
  cap: 'This partner has had its calls for today.',
  hubClosed: 'Collab Hub is not open to this vendor yet, so the call was not sent to partners.',
  suggestedVia: (p) => `via ${p}`,
  answeredFor: (p, first) => `${p} answered for ${first}. Contact goes through ${p}.`,
});
module.exports = { roleWord, needsLine, payLine, maskNote, plural, W, formatDateLong };
