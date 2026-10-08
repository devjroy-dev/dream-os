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
  const w = PAY_WORD[pay] || 'Not stated';
  if (pay === 'paid' && from != null && to != null) return `${w}, Rs ${formatRs(from)} to Rs ${formatRs(to)}`;
  if (pay === 'paid' && to != null) return `${w}, up to Rs ${formatRs(to)}`;
  return w;
};
// A vendor's note may hold a phone or an email by accident: masked before any partner reads it (rule K).
const maskNote = (s) => (s ? String(s).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email hidden]').replace(/\+?\d[\d\s-]{8,}\d/g, '[number hidden]').slice(0, 200) : null);
const W = Object.freeze({
  callClosed: 'This call is no longer open, because the vendor closed it or its date has passed.',
  blocked: 'TDW has blocked this partner account. To ask why, write to partners@thedreamwedding.in.',
  stopped: 'This partner has stopped calls.',
  paused: 'This partner has paused calls.',
  noEmail: 'This partner has not given an email address for calls.',
  noKey: 'Nothing was sent, because RESEND_API_KEY is not set in Railway.',
  window: 'TDW sends calls only between 9 am and 8 pm, India time.',
  cap: 'This partner has received all its calls for today.',
  hubClosed: 'The call was not sent to partners, because Collab Hub is not open to this vendor yet.',
  // A2-3 (the chair approved "late" and its state line, 8 Oct 2026; the rest are PTN's, under R-47.1).
  late: 'This call was not sent. It waited more than 3 days before TDW could send it.',
  noLane: 'This call was not sent, because WhatsApp is not open for this partner and it has no email for calls.',
  toEmail: 'TDW sent this call by email, because WhatsApp is not open for this partner.',
  waStopped: 'This call was not sent, because this number has stopped all WhatsApp messages from TDW.',
  suggestedVia: (p) => `via ${p}`,
  answeredFor: (p, first) => `${p} answered on behalf of ${first}. To reach ${first}, contact ${p}.`,
});
// A2-1b: the state of a send, its lane, and a refusal from Resend, in plain words. ONE HOME (the admin's door read its
// own copy of SEND_WORDS until A2-1b; it reads this one now).
const SEND_WORDS = Object.freeze({ queued: 'This call is waiting to be sent.', sent: 'This call was sent.', held_cap: 'This call waits for tomorrow, because the partner has received all its calls for today.', held_window: 'This call waits until 9 am, because TDW sends calls only between 9 am and 8 pm.',
  held_paused: 'This call waits, because the partner has paused calls.', held_no_key: 'This call was not sent, because email is not set up yet.', failed: 'This call could not be sent.', closed: 'This call was not sent, because the call has closed.' });
// A2-3: a row closed by the 72-hour check reads its own state line (approved by the chair, 8 Oct 2026).
const LATE_STATE = 'This call was not sent, because it waited too long.';
const LANE_WORDS = Object.freeze({ email: 'Email', whatsapp: 'WhatsApp' });
// Resend's refusal as email.js records it ("resend <status>: <its message>", "resend unreachable: ...", "bad address"),
// matched on the messages Resend documents (resend.com/docs/api-reference/errors, read 8 Oct 2026), never guessed.
// Anything not matched reads "Resend refused it." and Resend's own words are kept beside it.
const FAIL = [
  [/domain is not verified/i, 'The sending domain is not verified in Resend yet.'],
  [/only send testing emails/i, 'Resend is still in test mode. Until the domain is verified, Resend sends email only to your own address.'],
  [/api key/i, 'Resend refused the key. Check RESEND_API_KEY in Railway.'],
  [/(daily|monthly) email sending quota/i, 'Resend\'s sending limit for the day or month is used up.'],
  [/^resend 429\b|too many requests/i, 'TDW sent too many emails at once, and Resend asked it to slow down.'],
  [/^bad address$/i, 'This partner\'s email for calls is not a valid address.'],
  [/^resend 5\d\d\b|temporarily unavailable|unexpected error/i, 'Resend had a fault on its side.'],
  [/^resend unreachable/i, 'TDW could not reach Resend.'],
  // A2-3: refusals from the WhatsApp lane (sendWa's typed codes, recorded as "wa <code>: ...").
  [/^wa line_not_configured/i, 'The marketing number is not set up in Railway.'],
  [/^wa template_not_approved/i, 'Meta has not approved the call template.'],
  [/^wa meta_not_configured/i, 'The marketing number is not set up in Railway.'],
  [/^wa /i, 'WhatsApp refused this message.'],
];
const failureWords = (raw) => { const s = String(raw || ''); for (const [re, w] of FAIL) if (re.test(s)) return w; return 'Resend refused this email.'; };
// F-44.410 (A2-1c): Resend's own words can carry an address. Its test-mode refusal names the account's own email ("You can
// only send testing emails to your own email address (x@y.z)"), and a revive keeps the last refusal in why. So every why
// that reaches a body goes through providerWords: an email-shaped run reads "an address", a run of ten or more digits
// reads "a number". The row in the database keeps Resend's words as they came; only what is SHOWN is cut.
const ADDR = /[^\s@()<>"'`,;]+@[^\s@()<>"'`,;]+\.[a-z]{2,}/gi;
const NUM = /\+?\(?\d[\d\s().-]{8,}\d/g;
const providerWords = (raw) => (raw == null || raw === '' ? null : String(raw).replace(ADDR, 'an address')
  .replace(NUM, (m) => ((m.match(/\d/g) || []).length >= 10 ? 'a number' : m)).slice(0, 300));
const stateWords = (state, why) => (state === 'closed' && why === W.late ? LATE_STATE : (SEND_WORDS[state] || state));
module.exports = { roleWord, needsLine, payLine, maskNote, plural, W, formatDateLong, SEND_WORDS, LANE_WORDS, LATE_STATE, stateWords, failureWords, providerWords };
