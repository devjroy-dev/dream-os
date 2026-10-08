'use strict';
// src/lib/partners/forward.js · CE-47 · PTN-A1 · "Forward a request", the BY-HAND route only (the chair, 6 Oct 2026).
// The admin forwards a vendor's request to people TDW knows; he copies the message and sends it himself from TDW's own
// Instagram or Threads, then ticks "I sent it". The WhatsApp route is A2's and is not here.
// One link per recipient per request: a random token, only its sha256 stored. The request page NEVER carries the
// vendor's phone or email (rule K). Words: simple and descriptive (the founder's one rule).
const crypto = require('crypto');
const { formatRs, formatDateLong } = require('../format');
const { rolesLine, PAY_WORD } = require('../collab/social');   // CLB's one home of trade and pay words
const links = require('./links');
const { isCollabRole } = require('../collab/roles');

const PUBLIC_BASE = 'https://thedreamwedding.in';
// The link token is DERIVED (HMAC of the recipient row's id under PARTNER_SESSION_SECRET with its own 'forward:' label), so
// the admin can reopen a request and copy its message again; only the token's sha256 is stored, for the page's lookup.
function tokenFor(recipientId, env = process.env) {
  const secret = env.PARTNER_SESSION_SECRET;
  if (!secret || !recipientId) return null;
  return crypto.createHmac('sha256', secret).update(`forward:${recipientId}`).digest('base64url').slice(0, 32);
}
const tokenHash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const requestUrl = (token) => `${PUBLIC_BASE}/request/${token}`;
const tradeWord = (category) => rolesLine([{ requirement_type: category }]) || 'wedding vendor';
const aOrAn = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

/** Validate the admin's form. -> { ok, row } | { ok:false, error } */
function validateRequest(b = {}) {
  if (b.asked !== true) return { ok: false, error: 'Tick "She asked for this" first.' };
  const row = { asked: true };
  if (b.vendor_id) row.vendor_id = String(b.vendor_id);
  else {
    const h = links.normalizeIgHandle(b.outside_handle);
    const p = typeof b.outside_phone === 'string' ? b.outside_phone.replace(/[^0-9+]/g, '') : '';
    if (!h) return { ok: false, error: links.WORDS.badHandle };
    if (!/^\+[0-9]{8,15}$/.test(p)) return { ok: false, error: "Write the vendor's phone number with the country code, for example +91 98111 00007." };
    row.outside_handle = h.toLowerCase(); row.outside_phone = p;
  }
  const role = typeof b.role === 'string' ? b.role.trim() : '';
  const city = typeof b.city === 'string' ? b.city.trim() : '';
  if (!role) return { ok: false, error: 'Write what the vendor needs, for example a model.' };
  // PTN-A2-1: for a vendor on TDW the request becomes her own call (CLB-2a createCallFor), whose role is a collab role key.
  if (row.vendor_id && !isCollabRole(role)) return { ok: false, error: 'Choose what the vendor needs from the list.' };
  if (!city) return { ok: false, error: 'Write the city of the shoot.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.event_date || ''))) return { ok: false, error: 'Choose the date of the shoot.' };
  const from = Number(b.budget_from); const to = Number(b.budget_to);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from) return { ok: false, error: 'Write the lowest and the highest budget in rupees.' };
  if (!['paid', 'credit_only'].includes(b.pay_kind)) return { ok: false, error: 'Choose whether the work is Paid or Credit only.' };
  Object.assign(row, { role: role.slice(0, 40), city: city.slice(0, 60), event_date: b.event_date, budget_from: from, budget_to: to, pay_kind: b.pay_kind,
    note: typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 300) : null });
  return { ok: true, row };
}

/** The vendor's side as a recipient may see it: name, trade, city and links. Never her phone or email. */
function vendorFace(vendor, request) {
  if (vendor) return { name: vendor.business_name || 'A wedding vendor', trade: tradeWord(vendor.category),
    instagram_url: links.instagramUrl(vendor.instagram_handle), instagram_handle: links.normalizeIgHandle(vendor.instagram_handle) };
  return { name: `@${request.outside_handle}`, trade: 'wedding vendor', instagram_url: links.instagramUrl(request.outside_handle), instagram_handle: request.outside_handle };
}

/** The message the admin copies (by hand). Plain, one paragraph, the link last. */
function messageFor({ contactName, face, request, token }) {
  const pay = PAY_WORD[request.pay_kind] || 'Paid';
  return `Hello ${contactName}. ${face.name}, ${aOrAn(face.trade)} ${face.trade} on The Dream Wedding, needs ${aOrAn(request.role)} ${request.role} in ${request.city} on ${formatDateLong(request.event_date)}. `
    + `Budget Rs ${formatRs(request.budget_from)} to Rs ${formatRs(request.budget_to)}. ${pay}. See the request and answer here: ${requestUrl(token)}`;
}

/** The request link page's data. No phone, no email, by construction. */
function requestPage({ face, request }) {
  return { vendor: face, need: request.role, city: request.city, date_words: formatDateLong(request.event_date),
    budget_words: `Rs ${formatRs(request.budget_from)} to Rs ${formatRs(request.budget_to)}`, pay_words: PAY_WORD[request.pay_kind] || 'Paid',
    note: request.note || null, phone_line: 'The vendor\'s phone number is shared only when the vendor chooses to contact you.' };
}

const threadsUrl = (handle) => { const h = links.normalizeIgHandle(handle); return h ? `https://www.threads.com/@${h}` : null; };
module.exports = { PUBLIC_BASE, tokenFor, threadsUrl, tokenHash, requestUrl, tradeWord, validateRequest, vendorFace, messageFor, requestPage };
