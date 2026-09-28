// src/lib/domains/service.js — TDW · CE-46 · WEB-1 cut 2 · THE DOMAIN'S LIFE, ONE WRITER.
//
// This file is the ONLY writer on public.vendor_domains (0178). The doors read
// through it; the Razorpay webhook calls `onPaid`; the cron calls `sweepWiring`.
//
//   search   →  the registrar's availability and price, the sell price by pricing.js; no row
//   order    →  a row in `paying` with a Razorpay link; NO registrar call, NO money moved by TDW
//   onPaid   →  the webhook's word for this row: register at ResellerClub in HER name,
//               nameservers set to Vercel's, then add the domain to the project → `wiring`
//   sweep    →  every `wiring` row asked at Vercel; verified and configured → `live`
//
// IDEMPOTENT BY THE ROW, NOT BY CARE: `onPaid` refuses a row that already holds
// registrar_order_id, and the UNIQUE constraints (domain, razorpay_link_id,
// razorpay_payment_id, registrar_order_id) make a second run a no-op or an
// error, never a second purchase. A-45.15: the registrar's price is READ and
// printed before the pay link exists; the buy is after the pay.
'use strict';

const pricing = require('./pricing');
const rc = require('./resellerclub');
const vercel = require('./vercelDomains');
const links = require('./razorpayLinks');

const TABLE = 'vendor_domains';
const COLS = 'id, vendor_id, domain, registrar, status, cost_paise, gst_pct, price_paise, years, razorpay_link_id, razorpay_link_url, razorpay_payment_id, paid_at, registrant, registrar_customer_id, registrar_contact_id, registrar_order_id, registered_at, expires_at, auto_renew, vercel_domain_added_at, dns_verified_at, ssl_issued_at, live_at, forward_email, last_error, retries, refund_due_at, refunded_at, created_at, updated_at';
const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000; // S8: tried again for one day, then a refund is due

const REQUIRED_REGISTRANT = ['name', 'email', 'phone', 'address1', 'city', 'state', 'zipcode'];

function gstPct() { const n = Number(process.env.RESELLERCLUB_GST_PCT); return Number.isFinite(n) ? n : pricing.GST_PCT_DEFAULT; }

/** ≤5 suggestions with the sell price. No row is written. */
async function search(label, deps = {}) {
  const avail = await rc.available(label, deps);
  const out = [];
  for (const a of avail) {
    const tld = a.domain.split('.').slice(1).join('.');
    const rupees = a.available ? await rc.yearOneRupees(tld, deps) : null;
    out.push({ domain: a.domain, available: a.available, pricePaise: rupees == null ? null : pricing.sellPaise(pricing.rupeesToPaise(rupees), gstPct()) });
  }
  return out;
}

/** The registrant she confirmed in the room; every field present, or a named refusal. */
function checkRegistrant(r) {
  const missing = REQUIRED_REGISTRANT.filter((k) => !r || !String(r[k] || '').trim());
  return missing.length ? { ok: false, missing } : { ok: true };
}

/** A row in `paying` with its link. Refuses a name the search says is taken, a bad registrant, or a live row of hers on any name. */
async function order(supabase, vendor, { domain, registrant, years = 1 }, deps = {}) {
  const name = String(domain || '').trim().toLowerCase();
  const tld = name.split('.').slice(1).join('.');
  if (!/^[a-z0-9-]+\.(in|com|co\.in)$/.test(name)) return { ok: false, reason: 'not a name this cut sells (.in, .com, .co.in)' };
  const reg = checkRegistrant(registrant);
  if (!reg.ok) return { ok: false, reason: `registrant missing: ${reg.missing.join(', ')}` };
  const avail = await rc.available(name.split('.')[0], deps);
  const hit = avail.find((a) => a.domain === name);
  if (!hit || !hit.available) return { ok: false, reason: 'that name is not available' };
  const rupees = await rc.yearOneRupees(tld, deps);
  if (rupees == null) return { ok: false, reason: 'no price for that ending today' };
  const costPaise = pricing.rupeesToPaise(rupees) * years;
  const pricePaise = pricing.sellPaise(costPaise, gstPct());
  const row = { vendor_id: vendor.id, domain: name, status: 'paying', cost_paise: costPaise, gst_pct: gstPct(), price_paise: pricePaise, years,
    registrant: { name: registrant.name, company: registrant.company || vendor.business_name || registrant.name, email: registrant.email, phone: registrant.phone, phoneCc: '91', address1: registrant.address1, city: registrant.city, state: registrant.state, zipcode: registrant.zipcode, country: 'IN' } };
  const ins = await supabase.from(TABLE).insert(row).select(COLS).single();
  if (ins.error) return { ok: false, reason: ins.error.message };
  const link = await links.createLink({ rowId: ins.data.id, vendorId: vendor.id, amountPaise: pricePaise, description: `${name} for ${years} year${years > 1 ? 's' : ''}`, customer: { name: registrant.name, phone: registrant.phone, email: registrant.email } }, deps);
  const upd = await supabase.from(TABLE).update({ razorpay_link_id: link.linkId, razorpay_link_url: link.url, updated_at: new Date().toISOString() }).eq('id', ins.data.id).select(COLS).single();
  if (upd.error) return { ok: false, reason: upd.error.message };
  return { ok: true, row: upd.data };
}

/** The webhook's word. Buys once, in her name, and wires. Never runs twice for one row. */
async function onPaid(supabase, { rowId, paymentId, amountPaise }, deps = {}) {
  const got = await supabase.from(TABLE).select(COLS).eq('id', rowId).is('deleted_at', null).single();
  if (got.error || !got.data) return { ok: false, reason: 'no such order' };
  const row = got.data;
  if (row.registrar_order_id) return { ok: true, already: true, row };
  if (row.status !== 'paying') return { ok: false, reason: `row is ${row.status}, not paying` };
  if (Number(amountPaise) < Number(row.price_paise)) return { ok: false, reason: 'paid less than the price' };
  const now = () => new Date().toISOString();
  const paid = await supabase.from(TABLE).update({ razorpay_payment_id: paymentId, paid_at: now(), status: 'registering', updated_at: now() }).eq('id', rowId).eq('status', 'paying').select(COLS).single();
  if (paid.error || !paid.data) return { ok: false, reason: paid.error ? paid.error.message : 'another run took this row' };
  return buy(supabase, paid.data, deps);
}

/**
 * The registration itself, shared by the first run (onPaid) and the retry sweep.
 * BEFORE ANY REGISTER CALL on a row that has tried before, the registrar is asked
 * whether the name is already ours: a register whose answer was lost in transit
 * must be ADOPTED, never bought a second time.
 */
async function buy(supabase, row, deps = {}) {
  const now = () => new Date().toISOString();
  const rowId = row.id;
  try {
    const reg = { ...row.registrant, password: deps.registrarPassword || require('crypto').randomBytes(12).toString('base64url') };
    const customerId = row.registrar_customer_id || await rc.customerSignup(reg, deps);
    const contactId = row.registrar_contact_id || await rc.contactAdd(customerId, reg, deps);
    await supabase.from(TABLE).update({ registrar_customer_id: customerId, registrar_contact_id: contactId, updated_at: now() }).eq('id', rowId);
    let orderId = null;
    if (Number(row.retries || 0) > 0) {
      const existing = await rc.details(row.domain, deps).catch(() => ({ orderId: null }));
      if (existing.orderId) orderId = existing.orderId;
    }
    if (!orderId) orderId = (await rc.register({ domain: row.domain, years: row.years, customerId, contactId, nameservers: vercel.NAMESERVERS }, deps)).orderId;
    const det = await rc.details(row.domain, deps).catch(() => ({ expiresAt: null }));
    const added = await vercel.addDomain(row.domain, deps);
    const upd = await supabase.from(TABLE).update({ registrar_order_id: orderId, registered_at: now(), expires_at: det.expiresAt, status: 'wiring', vercel_domain_added_at: added.added ? now() : null, last_error: null, updated_at: now() }).eq('id', rowId).select(COLS).single();
    return upd.error ? { ok: false, reason: upd.error.message } : { ok: true, row: upd.data };
  } catch (e) {
    await supabase.from(TABLE).update({ status: 'error', last_error: String(e && e.message).slice(0, 500), updated_at: now() }).eq('id', rowId);
    return { ok: false, reason: String(e && e.message) };
  }
}

/**
 * S8, the policy: every PAID row in `error` with no order is tried again while it is
 * within a day of its payment; past a day it becomes `refund_due`, the founder's task
 * (he refunds her card in full in Razorpay, then marks it refunded). Never touches a
 * row that was not paid, or one that already holds an order.
 */
async function sweepRetry(supabase, deps = {}) {
  const q = await supabase.from(TABLE).select(COLS).eq('status', 'error').is('deleted_at', null);
  if (q.error) return { ok: false, reason: q.error.message, retried: 0, bought: 0, refundDue: 0 };
  const nowMs = (deps.now ? deps.now() : Date.now());
  let retried = 0, bought = 0, refundDue = 0;
  for (const row of q.data || []) {
    if (!row.paid_at || row.registrar_order_id) continue;
    if (nowMs - new Date(row.paid_at).getTime() > RETRY_WINDOW_MS) {
      const at = new Date(nowMs).toISOString();
      await supabase.from(TABLE).update({ status: 'refund_due', refund_due_at: at, updated_at: at }).eq('id', row.id).eq('status', 'error');
      console.warn(`[domains] REFUND DUE ${row.domain} · row ${row.id} · payment ${row.razorpay_payment_id} · ${row.price_paise} paise · founder refunds in Razorpay`);
      refundDue += 1; continue;
    }
    const claimed = await supabase.from(TABLE).update({ status: 'registering', retries: Number(row.retries || 0) + 1, updated_at: new Date().toISOString() }).eq('id', row.id).eq('status', 'error').select(COLS).single();
    if (claimed.error || !claimed.data) continue;
    retried += 1;
    const out = await buy(supabase, claimed.data, deps);
    if (out.ok) bought += 1;
  }
  return { ok: true, retried, bought, refundDue };
}

/** Every `wiring` row asked at Vercel; verified and configured → live. */
async function sweepWiring(supabase, deps = {}) {
  const q = await supabase.from(TABLE).select(COLS).eq('status', 'wiring').is('deleted_at', null);
  if (q.error) return { ok: false, reason: q.error.message, checked: 0, live: 0 };
  let live = 0;
  for (const row of q.data || []) {
    try {
      const s = await vercel.status(row.domain, deps);
      const now = new Date().toISOString();
      const patch = { updated_at: now };
      if (s.verified && !row.dns_verified_at) patch.dns_verified_at = now;
      if (s.verified && s.configured) { patch.status = 'live'; patch.live_at = now; patch.ssl_issued_at = now; live += 1; }
      await supabase.from(TABLE).update(patch).eq('id', row.id);
    } catch (e) {
      await supabase.from(TABLE).update({ last_error: String(e && e.message).slice(0, 500), updated_at: new Date().toISOString() }).eq('id', row.id);
    }
  }
  return { ok: true, checked: (q.data || []).length, live };
}

/** Her current row (the newest not deleted), for the door's DomainStatus. */
async function current(supabase, vendorId) {
  const q = await supabase.from(TABLE).select(COLS).eq('vendor_id', vendorId).is('deleted_at', null).order('created_at', { ascending: false }).limit(1);
  if (q.error) return null;
  return (q.data && q.data[0]) || null;
}

function liveUrlOf(row) { return row && row.status === 'live' ? `https://${row.domain}` : null; }

module.exports = { search, order, onPaid, buy, sweepRetry, RETRY_WINDOW_MS, sweepWiring, current, liveUrlOf, checkRegistrant, REQUIRED_REGISTRANT, COLS, TABLE };
