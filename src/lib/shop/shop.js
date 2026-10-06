// src/lib/shop/shop.js · TDW · CE-47 · OFF-A1 · THE OFF-SEASON SHOP (the OFF charter, Part A; Q1 to Q12 ruled 4 October 2026).
//
// ONE HOME for what she sells off the wedding day and what happens when someone buys it. Three callers: her room's doors
// (src/api/vendor/solutions/shop.js), the public doors her website and storefront read (src/api/public/shop.js), and the
// rung (scripts/b230_ce47_off_a1_shop_bench.js), which drives every function here against an in-memory double.
//
// WHAT IT DOES
//   · Items: four kinds (voucher, workshop, class, booking), each checked field by field; the first bad field answers.
//   · An order from the website is 'asked' (no payment link yet: INS). A workshop seat on an asked order is HELD for 24
//     hours, so seats count down honestly while she collects the money her own way.
//   · Mark paid (her tap, or later her payment link): a voucher gets its code and its valid-until date; a workshop's date
//     goes on her Calendar once (one entry for the workshop, not one per seat); a booking is an enquiry born booked, source
//     'shop' (Q4), with its date on her Calendar (Q3). Vouchers and seats make no enquiry (Q4).
//   · A voucher is checked by code and redeemed once; redeemed is final.
// WHAT IT NEVER DOES: take money (TDW never holds a buyer's money; INS's link pays into her own account); make an invoice
// (an order is paid in full at purchase); write a buyer's words anywhere but the order; sell a seat that is not there.
'use strict';

const crypto = require('crypto');
const { formatRs } = require('../format');

const KINDS = Object.freeze(['voucher', 'workshop', 'class', 'booking']);
const OCCASIONS = Object.freeze(['party', 'engagement', 'pre_wedding', 'other']);
const HOLD_MS = 24 * 3600 * 1000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// 32 letters and digits with no 0, O, 1 or I: a code read aloud over the phone is never misheard (0204's CHECK, byte for byte).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const LINES = Object.freeze({
  kind: 'Please choose what you are selling.',
  name: 'Please add a name, up to 60 letters.',
  price: 'Please add a price in rupees.',
  includes: 'Please keep to six lines of what is included, each up to 80 letters.',
  photo: 'Please add the picture again.',
  validMonths: 'Please choose how many months the voucher is valid for.',
  voucherFor: 'Please say what the voucher is for, up to 60 letters.',
  startsAt: 'Please choose the date and time.',
  place: 'Please add the place, or choose Online.',
  seats: 'Please add how many seats there are.',
  classDates: 'Please choose up to 12 dates, or On request.',
  occasion: 'Please choose the occasion.',
  hours: 'Please add how many hours it takes.',
  leadDays: 'Please add how many days ahead it must be booked.',
  classLink: 'Please add the class link as it starts, https://',
  notFound: 'Not found.',
  soldOut: 'Sorry, there are no seats left.',
  notEnough: 'Sorry, only a few seats are left. Please choose fewer.',
  buyerName: 'Please add your name.',
  buyerPhone: 'Please add a 10-digit mobile number.',
  qty: 'Please choose how many.',
  wantedDate: 'Please choose a date.',
  tooSoon: 'Please choose a later date.',
  codeShape: 'Please type the code as it is written, for example K7QM-4XPA.',
  codeUnknown: 'No voucher with this code.',
  expired: 'This voucher has ended.',
  redeemed: 'This voucher has already been used.',
  notAsked: 'This order is not waiting for payment.',
  failed: 'That did not save. Please try again in a moment.',
});

const rs = (n) => `Rs ${formatRs(Math.round(Number(n) || 0))}`;
function dateWords(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null; }
const istDate = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);
const trimmed = (v, max) => { const s = typeof v === 'string' ? v.trim() : ''; return s && Array.from(s).length <= max ? s : null; };
const intIn = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d)) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

function slugFor(name) {
  const s = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return s || 'item';
}

/** Her item, field by field. Returns { ok: row } or { field, error }. `nowMs` decides "from today on". */
function checkItem(body, nowMs) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const kind = KINDS.includes(b.kind) ? b.kind : null; if (!kind) return { field: 'kind', error: LINES.kind };
  const name = trimmed(b.name, 60); if (!name) return { field: 'name', error: LINES.name };
  const price = intIn(b.price, 1, 10000000); if (price == null) return { field: 'price', error: LINES.price };
  const inc = b.includes == null ? [] : b.includes;
  if (!Array.isArray(inc) || inc.length > 6) return { field: 'includes', error: LINES.includes };
  const includes = [];
  for (const l of inc) { const t = trimmed(l, 80); if (!t) return { field: 'includes', error: LINES.includes }; includes.push(t); }
  let photo_url = null;
  if (b.photo_url != null && b.photo_url !== '') { if (typeof b.photo_url !== 'string' || !/^https:\/\/\S{1,500}$/.test(b.photo_url)) return { field: 'photo_url', error: LINES.photo }; photo_url = b.photo_url; }
  const row = { kind, name, price, includes, photo_url, shown: b.shown !== false,
    class_link: null, voucher_for: null, valid_months: null, starts_at: null, ends_at: null, place: null, online: false, seats_total: null, class_dates: [], occasion: null, hours: null, lead_days: null };
  if (kind === 'voucher') {
    row.valid_months = intIn(b.valid_months, 1, 60); if (row.valid_months == null) return { field: 'valid_months', error: LINES.validMonths };
    if (b.voucher_for != null && b.voucher_for !== '') { row.voucher_for = trimmed(b.voucher_for, 60); if (!row.voucher_for) return { field: 'voucher_for', error: LINES.voucherFor }; }
  }
  if (kind === 'workshop') {
    const s = Date.parse(String(b.starts_at || '')); if (!Number.isFinite(s) || s < nowMs) return { field: 'starts_at', error: LINES.startsAt };
    row.starts_at = new Date(s).toISOString();
    if (b.ends_at != null && b.ends_at !== '') { const e = Date.parse(String(b.ends_at)); if (!Number.isFinite(e) || e <= s) return { field: 'starts_at', error: LINES.startsAt }; row.ends_at = new Date(e).toISOString(); }
    row.online = b.online === true;
    if (!row.online) { row.place = trimmed(b.place, 80); if (!row.place) return { field: 'place', error: LINES.place }; }
    row.seats_total = intIn(b.seats_total, 1, 1000); if (row.seats_total == null) return { field: 'seats_total', error: LINES.seats };
  }
  if (kind === 'class') {
    const ds = b.class_dates == null ? [] : b.class_dates;
    const today = istDate(nowMs);
    if (!Array.isArray(ds) || ds.length > 12 || ds.some((d) => !isDate(d) || d < today)) return { field: 'class_dates', error: LINES.classDates };
    row.class_dates = [...new Set(ds)].sort();
    row.online = true;
  }
  if (kind === 'booking') {
    row.occasion = OCCASIONS.includes(b.occasion) ? b.occasion : null; if (!row.occasion) return { field: 'occasion', error: LINES.occasion };
    if (b.hours != null) { row.hours = intIn(b.hours, 1, 24); if (row.hours == null) return { field: 'hours', error: LINES.hours }; }
    row.lead_days = b.lead_days == null ? 0 : intIn(b.lead_days, 0, 365); if (row.lead_days == null) return { field: 'lead_days', error: LINES.leadDays };
  }
  // R1, reversed by the founder (CE-47, 7 October 2026): an online class or online workshop may carry her own class link
  // (her Meet or Zoom), https only. It is given to a buyer only once the seat is paid (markPaid), never on the public side.
  if (b.class_link != null && b.class_link !== '') {
    const online = kind === 'class' || (kind === 'workshop' && row.online);
    if (!online || typeof b.class_link !== 'string' || !/^https:\/\/[^\s<>"']{3,500}$/.test(b.class_link.trim())) return { field: 'class_link', error: LINES.classLink };
    row.class_link = b.class_link.trim();
  }
  return { ok: row };
}

/** Seats taken: paid orders, and asked orders whose hold has not ended. */
function seatsTaken(orders, nowMs) {
  return (orders || []).reduce((n, o) => n + ((o.state === 'paid' || (o.state === 'asked' && o.hold_until && Date.parse(o.hold_until) > nowMs)) ? (o.qty || 1) : 0), 0);
}
function seatsLeft(item, orders, nowMs) {
  if (item.kind !== 'workshop') return null;
  return Math.max(0, (item.seats_total || 0) - seatsTaken(orders, nowMs));
}

/** One fact line, the room's and the website's: what kind, its date or validity, seats, shown. */
function factLine(item, left) {
  const parts = [];
  if (item.kind === 'voucher') { parts.push('Gift voucher'); if (item.voucher_for) parts.push(item.voucher_for); parts.push(`Valid ${item.valid_months} months`); }
  if (item.kind === 'workshop') {
    parts.push('Workshop');
    if (left != null) parts.push(left === 0 ? 'Sold out' : `${left} of ${item.seats_total} seats left`);
    parts.push(dateWords(istDate(Date.parse(item.starts_at))));
    parts.push(item.online ? 'Online' : item.place);
  }
  if (item.kind === 'class') { parts.push('Online class'); parts.push(item.class_dates.length ? item.class_dates.map(dateWords).join(', ') : 'On request'); }
  if (item.kind === 'booking') {
    parts.push('Booking'); parts.push({ party: 'Party', engagement: 'Engagement', pre_wedding: 'Pre-wedding', other: 'Other' }[item.occasion]);
    if (item.hours) parts.push(item.hours === 1 ? '1 hour' : `${item.hours} hours`);
  }
  return parts.filter(Boolean).join(' · ');
}

function newCode(rand = crypto.randomBytes) {
  const bytes = rand(8); let s = '';
  for (let i = 0; i < 8; i += 1) s += ALPHABET[bytes[i] % 32];   // 256 is a multiple of 32: no letter is likelier than another
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}
/** The voucher's last valid day: the same day, `months` later, in India; a month too short for that day ends on its last day. */
function validUntil(paidMs, months) {
  const d = istDate(paidMs); let y = Number(d.slice(0, 4)); let m = Number(d.slice(5, 7)) - 1 + months; const day = Number(d.slice(8, 10));
  y += Math.floor(m / 12); m %= 12;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

// ── INS's payment link (DEPENDS ON: INS). Until INS lands, there is none, and every order is 'asked'. ────────────────────
function paymentLinkFor(deps) {
  if (deps && typeof deps.paymentLink === 'function') return deps.paymentLink;
  return null;
}

// ── her room ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const ITEM_COLS = 'id, kind, name, slug, photo_url, price, includes, shown, position, class_link, voucher_for, valid_months, starts_at, ends_at, place, online, seats_total, class_dates, occasion, hours, lead_days, event_id, created_at';

async function ordersFor(sb, vendorId, itemIds) {
  if (!itemIds.length) return [];
  const { data, error } = await sb.from('shop_orders').select('id, item_id, state, qty, hold_until').eq('vendor_id', vendorId).in('item_id', itemIds);
  if (error) throw new Error(`orders read: ${error.message}`);
  return data || [];
}

async function listItems(sb, vendorId, nowMs) {
  const { data, error } = await sb.from('shop_items').select(ITEM_COLS).eq('vendor_id', vendorId).is('deleted_at', null).order('position', { ascending: true });
  if (error) throw new Error(`items read: ${error.message}`);
  const items = data || [];
  const orders = await ordersFor(sb, vendorId, items.filter((i) => i.kind === 'workshop').map((i) => i.id));
  return items.map((i) => { const left = seatsLeft(i, orders.filter((o) => o.item_id === i.id), nowMs); return { ...i, seats_left: left, facts: factLine(i, left), price_words: rs(i.price) }; });
}

async function uniqueSlug(sb, vendorId, name, exceptId) {
  const base = slugFor(name);
  for (let n = 1; n < 50; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    let q = sb.from('shop_items').select('id').eq('vendor_id', vendorId).eq('slug', slug).is('deleted_at', null);
    if (exceptId) q = q.neq('id', exceptId);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(`slug read: ${error.message}`);
    if (!data) return slug;
  }
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

async function saveItem(sb, vendorId, id, body, nowMs) {
  const c = checkItem(body, nowMs);
  if (!c.ok) return { status: 400, body: { ok: false, field: c.field, error: c.error } };
  const at = new Date(nowMs).toISOString();
  try {
    if (id) {
      const { data: had, error: hErr } = await sb.from('shop_items').select('id, kind').eq('id', id).eq('vendor_id', vendorId).is('deleted_at', null).maybeSingle();
      if (hErr) throw new Error(hErr.message);
      if (!had) return { status: 404, body: { ok: false, error: LINES.notFound } };
      const slug = await uniqueSlug(sb, vendorId, c.ok.name, id);
      const { data, error } = await sb.from('shop_items').update({ ...c.ok, slug, updated_at: at }).eq('id', id).eq('vendor_id', vendorId).select(ITEM_COLS).single();
      if (error) throw new Error(error.message);
      return { status: 200, body: { ok: true, item: data } };
    }
    const { data: last } = await sb.from('shop_items').select('position').eq('vendor_id', vendorId).is('deleted_at', null).order('position', { ascending: false }).limit(1).maybeSingle();
    const slug = await uniqueSlug(sb, vendorId, c.ok.name, null);
    const { data, error } = await sb.from('shop_items').insert({ ...c.ok, slug, vendor_id: vendorId, position: (last ? last.position : -1) + 1, created_at: at, updated_at: at }).select(ITEM_COLS).single();
    if (error) throw new Error(error.message);
    return { status: 200, body: { ok: true, item: data } };
  } catch (e) { console.error(`[shop] ${vendorId} item not saved: ${e && e.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
}

async function removeItem(sb, vendorId, id, nowMs) {
  const { data, error } = await sb.from('shop_items').update({ deleted_at: new Date(nowMs).toISOString(), shown: false }).eq('id', id).eq('vendor_id', vendorId).is('deleted_at', null).select('id').maybeSingle();
  if (error) { console.error(`[shop] ${vendorId} item not removed: ${error.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
  return data ? { status: 200, body: { ok: true } } : { status: 404, body: { ok: false, error: LINES.notFound } };
}

async function listOrders(sb, vendorId) {
  const { data, error } = await sb.from('shop_orders').select('id, item_id, buyer_name, buyer_phone, qty, amount, wanted_date, state, hold_until, paid_at, paid_by, created_at, shop_items(name, kind), shop_vouchers(code, valid_until, redeemed_at)')
    .eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(`orders read: ${error.message}`);
  return (data || []).map((o) => ({ ...o, amount_words: rs(o.amount), item_name: o.shop_items ? o.shop_items.name : null, item_kind: o.shop_items ? o.shop_items.kind : null,
    voucher: Array.isArray(o.shop_vouchers) ? (o.shop_vouchers[0] || null) : (o.shop_vouchers || null), shop_items: undefined, shop_vouchers: undefined }));
}

/**
 * A calendar entry on her Calendar (Q3), through THE one event writer (eventWrite.writeEvent; fork (a), F-44.340): kind 'shop',
 * which occupies the day like a shoot. Her tap is the money already taken, so the writer is asked with force (an overridable
 * clash is noted, not refused); a refusal it never overrides (a blocked day) leaves the order paid with no entry, and the
 * writer's own sentence comes back for her room. Returns { id } or { id: null, line }.
 */
async function calendarEntry(sb, vendorId, { title, date, time, leadId }, deps = {}) {
  const writeEvent = deps.writeEvent || require('../vendor/eventWrite').writeEvent;
  const r = await writeEvent(sb, { vendorId, surface: 'pwa', source: 'shop', title: title.slice(0, 120), event_date: date,
    event_time: time || undefined, kind: 'shop', linked_lead_id: leadId || undefined, force: true });
  if (r && r.ok && r.event) return { id: r.event.id };
  const why = r && r.conflict && (r.conflict.message || r.conflict.line) ? (r.conflict.message || r.conflict.line) : (r && r.error) || 'The calendar entry was not added.';
  return { id: null, line: `Marked paid. ${dateWords(date)} was not added to your calendar: ${String(why).replace(/\.$/, '')}.` };
}

/**
 * Mark paid. Her tap (`by` 'vendor') or, once INS lands, her payment link ('link'). Idempotent: an order already paid answers
 * what it has. A voucher gets its code; a workshop's date goes on her Calendar once; a booking is an enquiry born booked.
 */
async function markPaid(sb, vendorId, orderId, { by = 'vendor', ref = null, nowMs = Date.now(), rand, writeEvent } = {}) {
  try {
    const { data: o, error } = await sb.from('shop_orders').select('id, item_id, state, buyer_name, buyer_phone, qty, amount, wanted_date, lead_id, event_id').eq('id', orderId).eq('vendor_id', vendorId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!o) return { status: 404, body: { ok: false, error: LINES.notFound } };
    if (o.state === 'paid') return { status: 200, body: { ok: true, already: true } };
    if (o.state !== 'asked') return { status: 422, body: { ok: false, error: LINES.notAsked } };
    const { data: item, error: iErr } = await sb.from('shop_items').select(ITEM_COLS).eq('id', o.item_id).eq('vendor_id', vendorId).maybeSingle();
    if (iErr) throw new Error(iErr.message);
    if (!item) return { status: 404, body: { ok: false, error: LINES.notFound } };
    const at = new Date(nowMs).toISOString();
    const patch = { state: 'paid', paid_at: at, paid_by: by === 'link' ? 'link' : 'vendor', payment_ref: ref, hold_until: null, updated_at: at };
    let voucher = null; let calendarLine = null;
    if (item.kind === 'voucher') {
      for (let i = 0; i < 5 && !voucher; i += 1) {
        const code = newCode(rand);
        const v = await sb.from('shop_vouchers').insert({ vendor_id: vendorId, order_id: o.id, item_id: item.id, code, valid_until: validUntil(nowMs, item.valid_months) }).select('code, valid_until').single();
        if (!v.error) voucher = v.data;
        else if (!/duplicate|unique/i.test(v.error.message)) throw new Error(`voucher insert: ${v.error.message}`);
      }
      if (!voucher) throw new Error('voucher code: five collisions');
    }
    if (item.kind === 'workshop' && !item.event_id) {
      const ist = new Date(Date.parse(item.starts_at) + 330 * 60000).toISOString();
      const ce = await calendarEntry(sb, vendorId, { title: item.name, date: ist.slice(0, 10), time: ist.slice(11, 16) }, { writeEvent });
      if (ce.id) {
        const u = await sb.from('shop_items').update({ event_id: ce.id }).eq('id', item.id).eq('vendor_id', vendorId);
        if (u.error) throw new Error(`item event: ${u.error.message}`);
      }
      patch.event_id = ce.id; calendarLine = ce.line || null;
    } else if (item.kind === 'workshop') patch.event_id = item.event_id;
    if (item.kind === 'booking') {
      const l = await sb.from('leads').insert({ vendor_id: vendorId, name: o.buyer_name, phone: o.buyer_phone, source: 'shop', state: 'booked',
        event_types: [item.name], raw_message: `Shop booking: ${item.name}, ${rs(o.amount)} paid.`, ...(o.wanted_date ? { wedding_date: o.wanted_date, wedding_date_precision: 'day' } : {}) })
        .select('id').single();
      if (l.error) throw new Error(`lead insert: ${l.error.message}`);
      patch.lead_id = l.data.id;
      if (o.wanted_date) { const ce = await calendarEntry(sb, vendorId, { title: `${item.name}: ${o.buyer_name}`, date: o.wanted_date, leadId: l.data.id }, { writeEvent }); patch.event_id = ce.id; calendarLine = ce.line || null; }
    }
    const { error: uErr } = await sb.from('shop_orders').update(patch).eq('id', o.id).eq('vendor_id', vendorId).eq('state', 'asked');
    if (uErr) throw new Error(`order update: ${uErr.message}`);
    const online = item.kind === 'class' || (item.kind === 'workshop' && item.online);
    return { status: 200, body: { ok: true, voucher, lead_id: patch.lead_id || null, event_id: patch.event_id || null, calendar_line: calendarLine, class_link: online ? (item.class_link || null) : null } };
  } catch (e) { console.error(`[shop] ${vendorId} order ${orderId} not marked paid: ${e && e.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
}

async function cancelOrder(sb, vendorId, orderId, nowMs) {
  const { data, error } = await sb.from('shop_orders').update({ state: 'cancelled', hold_until: null, updated_at: new Date(nowMs).toISOString() })
    .eq('id', orderId).eq('vendor_id', vendorId).eq('state', 'asked').select('id').maybeSingle();
  if (error) { console.error(`[shop] ${vendorId} order not cancelled: ${error.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
  return data ? { status: 200, body: { ok: true } } : { status: 422, body: { ok: false, error: LINES.notAsked } };
}

const normCode = (c) => String(c || '').toUpperCase().replace(/[\s]/g, '').replace(/^([A-Z0-9]{4})([A-Z0-9]{4})$/, '$1-$2');
async function voucherByCode(sb, vendorId, raw) {
  const code = normCode(raw);
  if (!CODE_RE.test(code)) return { error: LINES.codeShape, status: 400 };
  const { data, error } = await sb.from('shop_vouchers').select('id, code, valid_until, redeemed_at, redeemed_note, order_id, shop_orders(buyer_name, amount, paid_at), shop_items(name)')
    .eq('vendor_id', vendorId).eq('code', code).maybeSingle();
  if (error) throw new Error(`voucher read: ${error.message}`);
  if (!data) return { error: LINES.codeUnknown, status: 404 };
  return { voucher: data };
}
async function checkCode(sb, vendorId, raw, nowMs) {
  try {
    const r = await voucherByCode(sb, vendorId, raw);
    if (r.error) return { status: r.status, body: { ok: false, error: r.error } };
    const v = r.voucher; const o = v.shop_orders || {};
    const state = v.redeemed_at ? 'redeemed' : (v.valid_until < istDate(nowMs) ? 'expired' : 'valid');
    return { status: 200, body: { ok: true, voucher: { code: v.code, item_name: v.shop_items ? v.shop_items.name : null, buyer_name: o.buyer_name || null,
      line: `${o.buyer_name || ''} · Paid ${rs(o.amount)} on ${dateWords(istDate(Date.parse(o.paid_at)))} · Valid until ${dateWords(v.valid_until)}`,
      valid_until: v.valid_until, redeemed_at: v.redeemed_at, state } } };
  } catch (e) { console.error(`[shop] ${vendorId} code check failed: ${e && e.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
}
async function redeem(sb, vendorId, raw, note, nowMs) {
  try {
    const r = await voucherByCode(sb, vendorId, raw);
    if (r.error) return { status: r.status, body: { ok: false, error: r.error } };
    if (r.voucher.redeemed_at) return { status: 422, body: { ok: false, error: LINES.redeemed } };
    if (r.voucher.valid_until < istDate(nowMs)) return { status: 422, body: { ok: false, error: LINES.expired } };
    const n = note == null || note === '' ? null : trimmed(note, 120);
    const { data, error } = await sb.from('shop_vouchers').update({ redeemed_at: new Date(nowMs).toISOString(), redeemed_note: n })
      .eq('id', r.voucher.id).eq('vendor_id', vendorId).is('redeemed_at', null).select('id').maybeSingle();
    if (error) throw new Error(error.message);
    return data ? { status: 200, body: { ok: true } } : { status: 422, body: { ok: false, error: LINES.redeemed } };
  } catch (e) { console.error(`[shop] ${vendorId} redeem failed: ${e && e.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
}

// ── the public side: her website and storefront ───────────────────────────────────────────────────────────────────────
const PUBLIC_COLS = 'id, kind, name, slug, photo_url, price, includes, position, voucher_for, valid_months, starts_at, ends_at, place, online, seats_total, class_dates, occasion, hours, lead_days';
async function publicItems(sb, vendorId, nowMs) {
  const { data, error } = await sb.from('shop_items').select(PUBLIC_COLS).eq('vendor_id', vendorId).eq('shown', true).is('deleted_at', null).order('position', { ascending: true });
  if (error) throw new Error(`items read: ${error.message}`);
  const items = (data || []).filter((i) => i.kind !== 'workshop' || Date.parse(i.starts_at) > nowMs);
  const orders = await ordersFor(sb, vendorId, items.filter((i) => i.kind === 'workshop').map((i) => i.id));
  return items.map((i) => { const left = seatsLeft(i, orders.filter((o) => o.item_id === i.id), nowMs);
    return { kind: i.kind, name: i.name, slug: i.slug, photo_url: i.photo_url, price: i.price, price_words: rs(i.price), includes: i.includes, facts: factLine(i, left), seats_left: left, sold_out: left === 0,
      class_dates: i.kind === 'class' ? i.class_dates : undefined, lead_days: i.kind === 'booking' ? i.lead_days : undefined }; });
}

/** Someone buys or asks. Returns { status, body }; body.pay_url is INS's link once it exists, otherwise null (asked). */
async function placeOrder(sb, vendor, body, deps = {}) {
  const nowMs = deps.now ? deps.now().getTime() : Date.now();
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const slug = typeof b.slug === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(b.slug) ? b.slug : null;
  if (!slug) return { status: 404, body: { ok: false, error: LINES.notFound } };
  const name = trimmed(b.name, 40); if (!name) return { status: 400, body: { ok: false, field: 'name', error: LINES.buyerName } };
  const phone = typeof b.phone_e164 === 'string' ? b.phone_e164.replace(/[\s-]/g, '') : '';
  if (!/^\+91[6-9][0-9]{9}$/.test(phone)) return { status: 400, body: { ok: false, field: 'phone', error: LINES.buyerPhone } };
  const qty = b.qty == null ? 1 : intIn(b.qty, 1, 20); if (qty == null) return { status: 400, body: { ok: false, field: 'qty', error: LINES.qty } };
  try {
    const { data: item, error } = await sb.from('shop_items').select(PUBLIC_COLS).eq('vendor_id', vendor.id).eq('slug', slug).eq('shown', true).is('deleted_at', null).maybeSingle();
    if (error) throw new Error(error.message);
    if (!item || (item.kind === 'workshop' && Date.parse(item.starts_at) <= nowMs)) return { status: 404, body: { ok: false, error: LINES.notFound } };
    let wanted = null;
    if (item.kind === 'booking') {
      if (!isDate(b.wanted_date)) return { status: 400, body: { ok: false, field: 'wanted_date', error: LINES.wantedDate } };
      if (b.wanted_date < istDate(nowMs + (item.lead_days || 0) * 864e5)) return { status: 400, body: { ok: false, field: 'wanted_date', error: LINES.tooSoon } };
      wanted = b.wanted_date;
    }
    if (item.kind === 'class' && item.class_dates.length) {
      if (!item.class_dates.includes(b.wanted_date)) return { status: 400, body: { ok: false, field: 'wanted_date', error: LINES.wantedDate } };
      wanted = b.wanted_date;
    }
    const n = item.kind === 'workshop' ? qty : 1;
    if (item.kind === 'workshop') {
      const left = seatsLeft(item, await ordersFor(sb, vendor.id, [item.id]), nowMs);
      if (left === 0) return { status: 409, body: { ok: false, error: LINES.soldOut } };
      if (n > left) return { status: 409, body: { ok: false, field: 'qty', error: LINES.notEnough } };
    }
    const at = new Date(nowMs).toISOString();
    const row = { vendor_id: vendor.id, item_id: item.id, buyer_name: name, buyer_phone: phone, qty: n, amount: item.price * n, wanted_date: wanted, state: 'asked',
      hold_until: item.kind === 'workshop' ? new Date(nowMs + HOLD_MS).toISOString() : null, created_at: at, updated_at: at };
    const { data: order, error: oErr } = await sb.from('shop_orders').insert(row).select('id').single();
    if (oErr) throw new Error(`order insert: ${oErr.message}`);
    const link = paymentLinkFor(deps);
    let payUrl = null;
    if (link) { try { payUrl = await link({ vendorId: vendor.id, orderId: order.id, amount: row.amount, description: item.name, buyer: { name, phone } }); } catch (e) { console.error(`[shop] ${vendor.id} payment link failed: ${e && e.message}`); payUrl = null; } }
    if (!payUrl && typeof deps.alert === 'function') {
      try { await deps.alert({ vendor, text: `New shop order on your website from ${name}, ${phone}: ${item.name}${n > 1 ? `, ${n} seats` : ''}${wanted ? `, ${dateWords(wanted)}` : ''}, ${rs(row.amount)}.` }); }
      catch (e) { console.error(`[shop] ${vendor.id} order notice failed: ${e && e.message}`); }
    }
    return { status: 200, body: { ok: true, order_id: order.id, pay_url: payUrl || null, state: 'asked' } };
  } catch (e) { console.error(`[shop] ${vendor.id} order not filed: ${e && e.message}`); return { status: 503, body: { ok: false, error: LINES.failed } }; }
}

module.exports = { KINDS, OCCASIONS, LINES, HOLD_MS, ALPHABET, CODE_RE, rs, dateWords, istDate, slugFor, checkItem, seatsTaken, seatsLeft, factLine, newCode, validUntil,
  paymentLinkFor, listItems, saveItem, removeItem, listOrders, markPaid, cancelOrder, checkCode, redeem, publicItems, placeOrder, normCode };
