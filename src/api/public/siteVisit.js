// src/api/public/siteVisit.js · TDW · CE-47 · WEB-4 cut 4 · VISITORS AND SAVED LOOKS, WITH NOBODY IDENTIFIED.
//
//   POST /api/v2/public/site/visit   { code, page: home|look|collection|journal|page, look_slug?, ref?, utm_source? }
//   POST /api/v2/public/site/heart   { code, look_slug, on: true|false }
//
// Both ALWAYS answer 204 with no body: a page can neither learn nor probe anything from them.
// India's data law (the WEB-4 brief §6, CE-47's gap 7): no cookie, no stored address, no fingerprint. A visitor is counted
// once a day by a digest of (today's salt, address, user agent, vendor); the salt is 32 random bytes for India's calendar
// day and is DELETED, with the day's digests, the first time a later day is seen. What is kept is daily totals per
// vendor, page, look and source, and hearts per look per day. Obvious bots and link-preview fetchers are not counted.
// Basic has no counts (design §7): its visits are not recorded.
// Counting is read-then-write: two visits in the same instant may count once. The figures are a guide, not a ledger.
// Rate limit in memory per process, keyed by a hash of the address: over it, the request is quietly not counted.
'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const siteModel = require('../../lib/site/siteModel');

const PAGES = Object.freeze(['home', 'look', 'collection', 'journal', 'page']);
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|headless|lighthouse|pingdom|monitor/i;
const HOUR = 3600 * 1000; const PER_ADDR = 240;
const buckets = new Map();
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
function allow(req) {
  const k = sha(req.ip || ''); const t = Date.now(); const b = buckets.get(k);
  if (!b || t - b.start >= HOUR) { buckets.set(k, { start: t, n: 1 }); return true; }
  b.n += 1; return b.n <= PER_ADDR;
}

/** India's calendar day, as YYYY-MM-DD (UTC+5:30). */
function indiaDay(at) {
  const t = at instanceof Date && Number.isFinite(at.getTime()) ? at.getTime() : Date.now();
  return new Date(t + 330 * 60000).toISOString().slice(0, 10);
}

/** The referrer class (the brief §6): from utm_source first, then the referrer's host. */
function sourceOf(ref, utm) {
  const u = String(utm || '').toLowerCase().trim();
  if (u) {
    if (/^(google|gads|adwords)/.test(u)) return 'google';
    if (/^(instagram|ig)$|^instagram/.test(u)) return 'instagram';
    if (/^(facebook|fb|meta)$|^facebook/.test(u)) return 'facebook';
    if (/^(whatsapp|wa)$|^whatsapp/.test(u)) return 'whatsapp';
    return 'other';
  }
  let host = '';
  try { host = new URL(String(ref || '')).hostname.toLowerCase(); } catch (_e) { host = ''; }
  if (!host) return 'direct';
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return 'facebook';
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return 'whatsapp';
  if (/(^|\.)thedreamwedding\.in$/.test(host)) return 'direct';
  return 'other';
}

const hex = (buf) => '\\x' + buf.toString('hex');
/** Today's salt; on the first visit of a new day, the old salts and digests are deleted. */
async function saltFor(sb, day) {
  const { data } = await sb.from('site_visit_salt').select('day, salt').eq('day', day).maybeSingle();
  if (data && data.salt) return String(data.salt);
  const fresh = hex(crypto.randomBytes(32));
  await sb.from('site_visit_salt').insert({ day, salt: fresh });   // a second process racing here fails on the key
  const { data: again } = await sb.from('site_visit_salt').select('day, salt').eq('day', day).maybeSingle();
  await sb.from('site_visit_seen').delete().lt('day', day);
  await sb.from('site_visit_salt').delete().lt('day', day);
  return again && again.salt ? String(again.salt) : fresh;
}
/** Seen today? Marks it seen when `mark` and not yet seen. Returns true when it was ALREADY seen. */
async function seen(sb, day, digest, mark) {
  const { data } = await sb.from('site_visit_seen').select('digest').eq('day', day).eq('digest', digest).maybeSingle();
  if (data) return true;
  if (mark) await sb.from('site_visit_seen').insert({ day, digest });
  return false;
}

async function vendorOf(sb, code) {
  const c = String(code || '').trim();
  if (!c || c.length > 40) return null;
  const { data } = await sb.from('vendors').select('id, status, discover_paused, tier').eq('routing_handle', c.toUpperCase()).maybeSingle();
  if (!data || data.status !== 'active' || data.discover_paused === true || siteModel.tierOf(data.tier) === 'basic') return null;
  return data;
}
async function lookOf(sb, vendorId, slug) {
  if (!SLUG.test(String(slug || ''))) return null;
  const { data } = await sb.from('vendor_looks').select('id').eq('vendor_id', vendorId).eq('slug', slug).eq('status', 'published').is('deleted_at', null).maybeSingle();
  return data || null;
}

router.post('/visit', express.json({ limit: '4kb' }), async (req, res) => {
  res.status(204).end();   // answered first: nothing below can change what the page receives
  try {
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    if (!allow(req) || BOT.test(String(req.get('user-agent') || ''))) return;
    const page = PAGES.includes(b.page) ? b.page : null; if (!page) return;
    const sb = req.app.locals.supabase;
    const v = await vendorOf(sb, b.code); if (!v) return;
    let lookId = null;
    if (page === 'look') { const l = await lookOf(sb, v.id, b.look_slug); if (!l) return; lookId = l.id; }
    const day = indiaDay(); const salt = await saltFor(sb, day);
    const digest = hex(crypto.createHash('sha256').update(`${salt}|${req.ip || ''}|${req.get('user-agent') || ''}|${v.id}`).digest());
    const already = await seen(sb, day, digest, true);
    const source = sourceOf(b.ref, b.utm_source);
    let q = sb.from('site_visits_daily').select('id, views, uniques').eq('vendor_id', v.id).eq('day', day).eq('page', page).eq('source', source);
    q = lookId ? q.eq('look_id', lookId) : q.is('look_id', null);
    const { data: row } = await q.maybeSingle();
    if (row) await sb.from('site_visits_daily').update({ views: (row.views || 0) + 1, uniques: (row.uniques || 0) + (already ? 0 : 1) }).eq('id', row.id);
    else await sb.from('site_visits_daily').insert({ vendor_id: v.id, day, page, look_id: lookId, source, views: 1, uniques: already ? 0 : 1 });
  } catch (_e) { /* a count is a guide; a failure is never the visitor's problem */ }
});

router.post('/heart', express.json({ limit: '2kb' }), async (req, res) => {
  res.status(204).end();
  try {
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    if (!allow(req) || BOT.test(String(req.get('user-agent') || '')) || typeof b.on !== 'boolean') return;
    const sb = req.app.locals.supabase;
    const v = await vendorOf(sb, b.code); if (!v) return;
    const l = await lookOf(sb, v.id, b.look_slug); if (!l) return;
    const day = indiaDay(); const salt = await saltFor(sb, day);
    const digest = hex(crypto.createHash('sha256').update(`${salt}|${req.ip || ''}|${req.get('user-agent') || ''}|${v.id}|${l.id}|heart`).digest());
    const was = await seen(sb, day, digest, false);
    if (b.on === was) return;   // a second heart, or an un-heart of nothing: no change
    if (b.on) await sb.from('site_visit_seen').insert({ day, digest });
    else await sb.from('site_visit_seen').delete().eq('day', day).eq('digest', digest);
    const { data: row } = await sb.from('look_hearts_daily').select('hearts').eq('look_id', l.id).eq('day', day).maybeSingle();
    const next = Math.max(0, ((row && row.hearts) || 0) + (b.on ? 1 : -1));
    if (row) await sb.from('look_hearts_daily').update({ hearts: next }).eq('look_id', l.id).eq('day', day);
    else if (b.on) await sb.from('look_hearts_daily').insert({ vendor_id: v.id, look_id: l.id, day, hearts: 1 });
  } catch (_e) { /* as above */ }
});

module.exports = router;
module.exports.sourceOf = sourceOf;
module.exports.indiaDay = indiaDay;
module.exports.BOT = BOT;
module.exports._buckets = buckets;
