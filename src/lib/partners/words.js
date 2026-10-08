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
// A2-1b: the state of a send, its lane, and a refusal from Resend, in plain words. ONE HOME (the admin's door read its
// own copy of SEND_WORDS until A2-1b; it reads this one now).
const SEND_WORDS = Object.freeze({ queued: 'Waiting to go', sent: 'Sent', held_cap: 'Waiting: today\'s calls are used', held_window: 'Waiting for 9 am',
  held_paused: 'Waiting: calls are paused', held_no_key: 'Not sent: email is not set up yet', failed: 'Could not be sent', closed: 'Not sent: the call closed' });
const LANE_WORDS = Object.freeze({ email: 'Email', whatsapp: 'WhatsApp' });
// Resend's refusal as email.js records it ("resend <status>: <its message>", "resend unreachable: ...", "bad address"),
// matched on the messages Resend documents (resend.com/docs/api-reference/errors, read 8 Oct 2026), never guessed.
// Anything not matched reads "Resend refused it." and Resend's own words are kept beside it.
const FAIL = [
  [/domain is not verified/i, 'The sending domain is not verified in Resend yet.'],
  [/only send testing emails/i, 'Resend is still in test mode: it sends only to your own address until the domain is verified.'],
  [/api key/i, 'Resend refused the key. Check RESEND_API_KEY in Railway.'],
  [/(daily|monthly) email sending quota/i, 'Resend\'s sending limit for the day or month is used up.'],
  [/^resend 429\b|too many requests/i, 'Too many emails at once. Resend asked to slow down.'],
  [/^bad address$/i, 'This partner\'s email for calls is not a valid address.'],
  [/^resend 5\d\d\b|temporarily unavailable|unexpected error/i, 'Resend had a fault on its side.'],
  [/^resend unreachable/i, 'Resend could not be reached.'],
];
const failureWords = (raw) => { const s = String(raw || ''); for (const [re, w] of FAIL) if (re.test(s)) return w; return 'Resend refused it.'; };
// F-44.410 (A2-1c): Resend's own words can carry an address. Its test-mode refusal names the account's own email ("You can
// only send testing emails to your own email address (x@y.z)"), and a revive keeps the last refusal in why. So every why
// that reaches a body goes through providerWords: an email-shaped run reads "an address", a run of ten or more digits
// reads "a number". The row in the database keeps Resend's words as they came; only what is SHOWN is cut.
const ADDR = /[^\s@()<>"'`,;]+@[^\s@()<>"'`,;]+\.[a-z]{2,}/gi;
const NUM = /\+?\(?\d[\d\s().-]{8,}\d/g;
const providerWords = (raw) => (raw == null || raw === '' ? null : String(raw).replace(ADDR, 'an address')
  .replace(NUM, (m) => ((m.match(/\d/g) || []).length >= 10 ? 'a number' : m)).slice(0, 300));
module.exports = { roleWord, needsLine, payLine, maskNote, plural, W, formatDateLong, SEND_WORDS, LANE_WORDS, failureWords, providerWords };
