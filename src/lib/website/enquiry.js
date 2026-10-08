// src/lib/website/enquiry.js · TDW · CE-47 · WEB-4 cut 7 · DOOR 1: A WEBSITE ENQUIRY, FILED (WEB-7's contract, 1 October 2026).
//
// What the visitor's form becomes, in this order: the thread by phone (the WhatsApp lane's own key, so a later WhatsApp from
// that number threads with it); the lead (source 'website'; an open lead for vendor + phone in the last 7 days gains the new
// facts instead, with no second lead and no second notice); the thread's first inbound row (channel 'website'); ONE vendor
// notice through the engine's notice head (LINE_WORD.website, "your website"); and a chat token for door 2 (32 random bytes,
// only its sha256 kept, bound to vendor, phone and thread, 24 hours).
// No model call. No date re-check. No price guard. Nothing from the client is trusted beyond the fields validated here.
// Shared by both doors: the Origin rule, the two switches (flag.website_chat, flag.website_eliza), the limits, the 404.
'use strict';

const crypto = require('crypto');
const COUNTRIES = require('./countries');
const { makeLimiter } = require('../site/limiter');

const HOUR = 3600 * 1000; const DAY = 24 * HOUR;
const CONSENT_VERSION_MAX = 32;
const LINES = Object.freeze({
  name: 'Please add your name.',
  phoneIN: 'Please add a 10-digit mobile number.',
  phone: 'Please add your mobile number.',
  occasion: 'Please choose the occasion.',
  package: 'Please choose a package from the list.',   // cut 17
  date: 'Please choose today\'s date or a later date.',
  consent: 'Your enquiry was not sent. Please press Send again to agree to the words above the button.',
  tooMany: 'You have tried too many times. Please try again in an hour.',
  enquiryFailed: 'Your enquiry could not be sent. Please try again in a moment.',
  chatEmpty: 'Please write a message.',
  oneMoment: 'Your last message is still being answered. Please wait a moment.',
  chatFailed: 'Your message could not be sent. Please try again in a moment.',
});
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── the limits (in memory per process, keys hashed; no address stored) ──────────────────────────────────────────────────
const limiter = makeLimiter({ cap: 5000 });
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const addrKey = (req, door) => `${door}:a:${sha(req.ip || '')}`;
let breakerLogged = new Set();
/** The per-vendor breaker both doors share: 200 a day, then 429 and ONE line in the founder's log per vendor per day. */
function vendorBreaker(vendorId) {
  const ok = limiter.hit(`v:${vendorId}`, 200, DAY);
  if (!ok && !breakerLogged.has(vendorId)) {
    breakerLogged.add(vendorId);
    console.error(`[website][founder] vendor ${vendorId} passed 200 website requests today; both doors answer 429 until tomorrow`);
  }
  return ok;
}

// ── India's day ────────────────────────────────────────────────────────────────────────────────────────────────────────
const indiaToday = (nowMs) => new Date((Number.isFinite(nowMs) ? nowMs : Date.now()) + 330 * 60000).toISOString().slice(0, 10);
function dateWords(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null;
}

// ── the Origin rule ────────────────────────────────────────────────────────────────────────────────────────────────────
const ROOT = process.env.STOREFRONT_ROOT_DOMAIN || 'thedreamwedding.in';
/** https://thedreamwedding.in, her own subdomain, or one of her verified (live) domains; anything else is no. */
async function originAllowed(sb, vendor, origin) {
  let u; try { u = new URL(String(origin || '')); } catch (_e) { return false; }
  if (u.protocol !== 'https:' || u.port || u.pathname !== '/') return false;
  const host = u.hostname.toLowerCase();
  if (host === ROOT) return true;
  if (host === `${String(vendor.routing_handle || '').toLowerCase()}.${ROOT}`) return true;
  try {
    const { data } = await sb.from('vendor_domains').select('domain').eq('vendor_id', vendor.id).eq('status', 'live').is('deleted_at', null).limit(5);
    return (Array.isArray(data) ? data : []).some((d) => { const h = String(d.domain || '').toLowerCase().replace(/^www\./, ''); return h && (host === h || host === `www.${h}`); });
  } catch (_e) { return false; }
}

// ── the two switches (0191 seeds both 'off'); 'armed' opens them for the walk vendor only ──────────────────────────────
async function switchOpen(capApi, key, vendorId, env) {
  let row = null; try { row = await capApi.get(key); } catch (_e) { row = null; }
  const st = row && row.status;
  if (st === 'on') return true;
  if (st === 'armed') { const walk = (env || process.env).WEBSITE_WALK_VENDOR_ID || ''; return Boolean(walk) && walk === vendorId; }
  return false;
}

const VENDOR_COLS = 'id, user_id, business_name, routing_handle, status, discover_paused, tier, enquiry_routing, enquiry_phone, reply_quiet_minutes';
async function vendorFor(sb, code) {
  const c = String(code || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(c)) return null;
  const { data, error } = await sb.from('vendors').select(VENDOR_COLS).eq('routing_handle', c.toUpperCase()).maybeSingle();
  if (error) throw new Error(`vendors read: ${error.message}`);
  if (!data || data.status !== 'active' || data.discover_paused === true) return null;
  return data;
}

// ── door 1's fields ────────────────────────────────────────────────────────────────────────────────────────────────────
const trimmed = (v, max) => { const s = typeof v === 'string' ? v.trim() : ''; return s && Array.from(s).length <= max ? s : null; };
/** India: +91 then 6-9 and nine digits. Elsewhere: the country's calling code, then 6 to 14 digits. Checked against `country`. */
function phoneFor(country, e164) {
  const cc = typeof country === 'string' ? country.toUpperCase() : '';
  const p = typeof e164 === 'string' ? e164.replace(/[\s-]/g, '') : '';
  if (!/^\+[0-9]{7,18}$/.test(p) || !Object.prototype.hasOwnProperty.call(COUNTRIES, cc)) return { ok: false, line: cc === 'IN' ? LINES.phoneIN : LINES.phone };
  if (cc === 'IN') return /^\+91[6-9][0-9]{9}$/.test(p) ? { ok: true, phone: p } : { ok: false, line: LINES.phoneIN };
  const ok = COUNTRIES[cc].some((code) => { const pre = `+${code}`; const rest = p.slice(pre.length); return p.startsWith(pre) && /^[0-9]{6,14}$/.test(rest); });
  return ok ? { ok: true, phone: p } : { ok: false, line: LINES.phone };
}
/** Door 1's body, field by field; the first failing field answers (name, phone, occasion, date, consent). */
function checkEnquiry(body, nowMs) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const name = trimmed(b.name, 40); if (!name) return { field: 'name', error: LINES.name };
  const ph = phoneFor(b.country, b.phone_e164); if (!ph.ok) return { field: 'phone', error: ph.line };
  const occasion = trimmed(b.occasion, 40); if (!occasion) return { field: 'occasion', error: LINES.occasion };
  let date = null;
  if (b.date !== undefined && b.date !== null && b.date !== '') {
    const today = indiaToday(nowMs); const y = Number(today.slice(0, 4));
    const max = `${y + 3}${today.slice(4)}`;
    const d = String(b.date);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d + 'T00:00:00Z')) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d;
    if (!valid || d < today || d > max) return { field: 'date', error: LINES.date };
    date = d;
  }
  if (b.consent !== true) return { field: 'consent', error: LINES.consent };
  const cv = trimmed(b.consent_version, CONSENT_VERSION_MAX); if (!cv) return { field: 'consent', error: LINES.consent };
  const pg = b.page && typeof b.page === 'object' ? b.page : {};
  const kind = ['home', 'look', 'collection', 'journal', 'other'].includes(pg.kind) ? pg.kind : 'other';
  const title = trimmed(pg.title, 80);
  // cut 17: the package she asked about (optional, 1 to 80 characters), into the thread's first line
  let pkg = null;
  if (b.package !== undefined && b.package !== null && b.package !== '') { pkg = trimmed(b.package, 80); if (!pkg) return { field: 'package', error: LINES.package }; }
  return { ok: { name, phone: ph.phone, occasion, date, consentVersion: cv, page: { kind, title: kind === 'home' ? null : title }, package: pkg } };
}

/** The thread's first inbound row, word for word (the contract's line c). */
function firstLine(f) { return `Website enquiry: ${f.occasion}, ${f.date ? dateWords(f.date) : 'no date'}, from ${f.page.title || 'the home page'}${f.package ? `, about ${f.package}` : ''}.`; }
/** The vendor's notice (the contract's line d), through the engine's notice head. */
function noticeLine(engine, f) {
  const head = engine.enquiryHead(f.name, { channel: 'website', phone: f.phone });
  return `${head}: ${f.occasion}${f.date ? `, ${dateWords(f.date)}` : ''}`;
}

/**
 * DOOR 1. Returns { status, body }. `deps` (all replaceable for the rung): capApi, ensureCoupleRow, sendVendorEnquiryAlert,
 * engine (enquiryHead), leadsLink, now, env.
 */
async function fileEnquiry({ sb, req, code, body }, deps) {
  const d = deps || {};
  const NOT_FOUND = { status: 404, body: d.notFoundBody };
  if (!limiter.hit(addrKey(req, 'enq'), 10, HOUR)) return { status: 429, body: { ok: false, error: LINES.tooMany } };
  let vendor;
  try { vendor = await vendorFor(sb, code); } catch (_e) { return { status: 503, body: { ok: false, error: LINES.enquiryFailed } }; }
  if (!vendor) return NOT_FOUND;
  if (!(await originAllowed(sb, vendor, req.get('origin')))) return NOT_FOUND;
  if (!(await switchOpen(d.capApi, 'flag.website_chat', vendor.id, d.env))) return NOT_FOUND;
  const nowMs = d.now ? d.now().getTime() : Date.now();
  const c = checkEnquiry(body, nowMs);
  if (!c.ok) return { status: 400, body: { ok: false, field: c.field, error: c.error } };
  const f = c.ok;
  if (!limiter.hit(`enq:vp:${vendor.id}:${sha(f.phone)}`, 3, DAY) || !vendorBreaker(vendor.id)) return { status: 429, body: { ok: false, error: LINES.tooMany } };
  const at = new Date(nowMs).toISOString();
  try {
    // a) the thread, by phone: the WhatsApp lane's own key and kind
    const ids = await d.ensureCoupleRow(sb, f.phone, f.name);
    let { data: thread, error: tErr } = await sb.from('conversations').select('id').eq('vendor_id', vendor.id).eq('counterparty_phone', f.phone).eq('kind', 'couple_thread').maybeSingle();
    if (tErr) throw new Error(`thread read: ${tErr.message}`);
    if (!thread) {
      const ins = await sb.from('conversations').insert({ vendor_id: vendor.id, counterparty_phone: f.phone, counterparty_user_id: ids && ids.user_id,
        kind: 'couple_thread', state: 'new', mode: 'auto' }).select('id').single();
      if (ins.error || !ins.data) throw new Error(`thread insert: ${ins.error ? ins.error.message : 'no row'}`);
      thread = ins.data;
    }
    // b) the lead: an open one for vendor + phone touched in the last 7 days gains the facts; else a new one
    const since = new Date(nowMs - 7 * DAY).toISOString();
    const { data: open, error: lErr } = await sb.from('leads').select('id, state').eq('vendor_id', vendor.id).eq('phone', f.phone).is('deleted_at', null)
      .gte('updated_at', since).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (lErr) throw new Error(`lead read: ${lErr.message}`);
    const facts = { name: f.name, event_types: [f.occasion], consent_at: at, consent_text_version: f.consentVersion, updated_at: at,
      ...(f.date ? { wedding_date: f.date, wedding_date_precision: 'day' } : {}) };
    const isNew = !(open && !['won', 'lost', 'closed', 'booked', 'archived'].includes(open.state));
    if (!isNew) {
      const u = await sb.from('leads').update(facts).eq('id', open.id).eq('vendor_id', vendor.id);
      if (u.error) throw new Error(`lead update: ${u.error.message}`);
    } else {
      const i = await sb.from('leads').insert(Object.assign({ vendor_id: vendor.id, phone: f.phone, source: 'website', state: 'new',
        raw_message: firstLine(f) }, facts));
      if (i.error) throw new Error(`lead insert: ${i.error.message}`);
    }
    // c) the thread's first inbound row
    const m = await sb.from('messages').insert({ conversation_id: thread.id, direction: 'inbound', channel: 'website', body: firstLine(f), sent_by: 'couple', sender_name: f.name });
    if (m.error) throw new Error(`inbound row: ${m.error.message}`);
    await sb.from('conversations').update({ last_message_at: at }).eq('id', thread.id);
    // e) the chat token (before the notice, so a notice failure cannot cost the visitor her chat)
    const token = crypto.randomBytes(32).toString('base64url');
    const t = await sb.from('website_chat_tokens').insert({ token_hash: sha(token), vendor_id: vendor.id, phone: f.phone, conversation_id: thread.id,
      page_title: f.page.title, created_at: at, expires_at: new Date(nowMs + DAY).toISOString() });
    if (t.error) throw new Error(`token insert: ${t.error.message}`);
    // d) ONE vendor notice, only for a new lead
    if (isNew) {
      try {
        const { data: vu } = await sb.from('users').select('name, phone').eq('id', vendor.user_id).maybeSingle();
        if (vu && vu.phone) {
          await d.sendVendorEnquiryAlert({ toPhone: vu.phone, text: noticeLine(d.engine, f), vendorName: vu.name, brideName: f.name, link: d.leadsLink,
            brideMessage: firstLine(f), supabase: sb, vendorId: vendor.id, ctx: 'website:enquiry', channel: 'website' });
        }
      } catch (e) { console.error(`[website] ${vendor.id} enquiry notice failed: ${e && e.message}`); }
    }
    return { status: 200, body: { ok: true, chat_token: token } };
  } catch (e) {
    console.error(`[website] ${vendor.id} enquiry not filed: ${e && e.message}`);
    return { status: 503, body: { ok: false, error: LINES.enquiryFailed } };
  }
}

module.exports = { fileEnquiry, checkEnquiry, phoneFor, firstLine, noticeLine, originAllowed, switchOpen, vendorFor, vendorBreaker, indiaToday, dateWords,
  limiter, sha, addrKey, LINES, _resetBreakerLog: () => { breakerLogged = new Set(); } };
