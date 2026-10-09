'use strict';
// src/lib/gear/rules.js · CE-47 · PRO · P2 · GEAR SHARING: what may be listed and asked, and what each side sees.
// PURE: no database, no clock (today is passed in, India's date).
//
// THE CONTACT RULE (P2-F6, the founder, 7 October 2026): the other vendor is her business name and city only, until the
// owner accepts. After acceptance each sees the other's business WhatsApp number. No number before acceptance IN ANY
// RESPONSE BODY, not only on screen: party() is the one place a counterpart is shaped, and it is handed the phone only
// when the request is accepted. Callers never put a phone on a row themselves.
// MONEY (P2-F5): TDW takes nothing and holds nothing. An accepted loan says SETTLE_LINE; no payment link, no insurance
// line in P2 (INS's doors join in a later package).

const SETTLE_LINE = (owner) => `Settle with ${owner} directly. TDW takes nothing.`;
const MAX_DAYS = 61;          // a loan of up to 61 days, from and to both counted (0211: date_to - date_from <= 60)
const MAX_AHEAD_DAYS = 365;   // asked for no more than a year ahead

const rs = (n) => 'Rs ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fullDate = (iso) => { const [y, m, d] = String(iso).split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const realDate = (s) => { if (!ISO.test(String(s || ''))) return false; const [y, m, d] = s.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const whole = (v) => (typeof v === 'number' ? v : (typeof v === 'string' && /^\s*\d[\d,]*\s*$/.test(v) ? Number(v.replace(/[,\s]/g, '')) : NaN));

/** What she lists. Returns { ok, row } or { ok: false, error } in plain words. */
function checkItem(body) {
  const b = body || {};
  const item = String(b.item || '').trim().replace(/\s+/g, ' ');
  const city = String(b.city || '').trim().replace(/\s+/g, ' ');
  const value = whole(b.value_rs); const price = whole(b.price_per_day_rs);
  if (item.length < 2 || item.length > 80) return { ok: false, error: 'Type the item’s name in 2 to 80 letters.' };
  if (!Number.isInteger(value) || value <= 0 || value > 100000000) return { ok: false, error: 'Type what the item is worth, in rupees.' };
  if (!Number.isInteger(price) || price < 0 || price > 10000000) return { ok: false, error: 'Type the price per day, in rupees. Type 0 to lend it free.' };
  if (city.length < 2 || city.length > 60) return { ok: false, error: 'Type the city the item is in.' };
  const note = b.note == null ? null : String(b.note).trim().slice(0, 300) || null;
  return { ok: true, row: { item, value_rs: value, price_per_day_rs: price, city, note } };
}

/** What she asks for. today is India's date. */
function checkAsk(body, today) {
  const b = body || {};
  const from = String(b.date_from || ''); const to = String(b.date_to || '');
  if (!realDate(from) || !realDate(to)) return { ok: false, error: 'Pick the first and last day you need it.' };
  if (from < today) return { ok: false, error: 'The first day you picked has passed. Pick today or a later day.' };
  if (to < from) return { ok: false, error: 'The last day you picked is before the first day.' };
  if (daysBetween(from, to) + 1 > MAX_DAYS) return { ok: false, error: `Ask for ${MAX_DAYS} days or fewer.` };
  if (daysBetween(today, from) > MAX_AHEAD_DAYS) return { ok: false, error: 'You can ask for an item up to one year ahead.' };
  const note = b.note == null ? null : String(b.note).trim().slice(0, 300) || null;
  return { ok: true, row: { date_from: from, date_to: to, note } };
}

/** Do two date ranges (both ends counted) share a day? */
const overlaps = (a, b) => a.date_from <= b.date_to && b.date_from <= a.date_to;

/** The other vendor, as one side may see her. phone only when accepted. */
function party(v, accepted) {
  const out = { business_name: (v && v.business_name) || 'A TDW vendor', city: (v && v.city) || null };
  if (accepted && v && v.phone) out.whatsapp = v.phone;
  return out;
}

const days = (r) => daysBetween(r.date_from, r.date_to) + 1;

/** A request as one side sees it. side: 'owner' (her item was asked for) or 'borrower' (she asked). */
function viewRequest(r, item, other, side) {
  const accepted = r.state === 'accepted';
  const n = days(r); const per = item ? item.price_per_day_rs : 0;
  const out = {
    id: r.id, side, state: r.state, item_id: r.item_id, item: item ? item.item : null,
    date_from: r.date_from, date_to: r.date_to, dates: r.date_from === r.date_to ? fullDate(r.date_from) : `${fullDate(r.date_from)} to ${fullDate(r.date_to)}`,
    days: n, price_line: per > 0 ? `${rs(per)} a day, ${rs(per * n)} for ${n} ${n === 1 ? 'day' : 'days'}` : 'Lent free',
    note: r.note || null, other: party(other, accepted),
  };
  if (accepted) out.settle = SETTLE_LINE(out.other.business_name); // the borrower reads the owner's name; the owner, the borrower's
  return out;
}

/** A listed item as another vendor sees it: never the owner's number (nothing is accepted on a listing). */
function viewItem(it, owner, mine) {
  const out = { id: it.id, item: it.item, value: rs(it.value_rs), value_rs: it.value_rs, price_per_day_rs: it.price_per_day_rs,
    price_line: it.price_per_day_rs > 0 ? `${rs(it.price_per_day_rs)} a day` : 'Lent free', city: it.city, note: it.note || null, state: it.state };
  if (!mine) out.owner = party(owner, false);
  return out;
}

/** The answer the accept function gives, in her words. */
const ACCEPT_WORDS = {
  accepted: null,
  overlap: 'You have already lent this item on some of these days. Decline this request, or ask the other vendor for other dates.',
  not_requested: 'This request has already been answered or cancelled.',
  withdrawn: 'This item is no longer listed.',
  not_found: 'That request is not in your account.',
};

module.exports = { checkItem, checkAsk, overlaps, party, viewRequest, viewItem, SETTLE_LINE, ACCEPT_WORDS, MAX_DAYS, fullDate, rs };
