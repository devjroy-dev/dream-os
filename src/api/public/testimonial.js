// src/api/public/testimonial.js · TDW · CE-47 · WEB-4 cut 3 · THE CLIENT'S OWN PAGE FOR KIND WORDS.
//
//   GET  /api/v2/public/testimonial/:token   { studio_name, person_name, video_allowed }
//   POST /api/v2/public/testimonial/:token   { name, occasion, month "YYYY-MM", place, words, video_url?, consent: true }
//
// Rulings (CE-47, 30 September 2026): she never edits the client's words (ruling 2); the words land 'pending' and show
// only once she approves. A video LINK only where her plan opens video testimonials (Signature and Prestige), https,
// YouTube or Instagram; never the video itself. SINGLE USE IS THE DATABASE'S: one UPDATE marks the request used and
// nulls the phone only where it is unused, unrevoked and unexpired; a second POST finds nothing. A used, expired,
// revoked or unknown token all read as the same 404 body, as does a token over its try limit.
// TRY LIMITS, in memory per server process (a restart resets them; the single-use UPDATE bounds each token anyway):
//   per token 5 POSTs in its life, refused ones counted; per address 20 POSTs and 60 GETs an hour. The address is
//   never stored. Only the token's sha256 is ever compared or kept.
'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const limits = require('../../lib/site/limits');
const siteModel = require('../../lib/site/siteModel');
const { videoKind } = require('../../lib/site/siteCard');

const NOT_FOUND = { ok: false, error: 'This link is not available.' };
const TOO_MANY = 'Too many tries. Please try again in an hour.';
const LINES = Object.freeze({
  consent: 'Please tick the box to let the studio show your words.',
  words: 'Please write a few words.',
  month: 'Choose the month of the wedding or occasion.',
  video: 'Use a YouTube or Instagram link.',
  videoPlan: 'This studio takes written words only.',
  failed: 'Your words could not be saved. Please try again in a moment.',
});
const HOUR = 3600 * 1000;
const PER_TOKEN = 5; const PER_ADDR_POST = 20; const PER_ADDR_GET = 60;

// ── the limiter: counts in memory, keyed by a hash, never by the raw address ──────────────────────────────────────
const buckets = new Map();
function hit(key, max, windowMs) {
  const t = Date.now(); const b = buckets.get(key);
  if (!b || (windowMs && t - b.start >= windowMs)) { buckets.set(key, { start: t, n: 1 }); return true; }
  b.n += 1; return b.n <= max;
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const addrKey = (req, kind) => `addr:${kind}:${sha(req.ip || '')}`;
const TOKEN = /^[A-Za-z0-9_-]{20,64}$/;

async function requestOf(sb, token) {
  const { data, error } = await sb.from('vendor_testimonial_requests')
    .select('id, vendor_id, person_name, used_at, revoked_at, expires_at')
    .eq('token_hash', sha(token)).maybeSingle();
  if (error || !data || data.used_at || data.revoked_at || !(Date.parse(data.expires_at) > Date.now())) return null;
  const { data: v, error: vErr } = await sb.from('vendors').select('business_name, status, discover_paused, tier').eq('id', data.vendor_id).maybeSingle();
  if (vErr || !v || v.status !== 'active' || v.discover_paused === true) return null;
  return { req: data, vendor: v };
}
const videoAllowed = (tier) => ['signature', 'prestige'].includes(siteModel.tierOf(tier));

router.get('/:token', async (req, res) => {
  if (!hit(addrKey(req, 'get'), PER_ADDR_GET, HOUR)) return res.status(429).json({ ok: false, error: TOO_MANY });
  const token = String(req.params.token || '');
  if (!TOKEN.test(token)) return res.status(404).json(NOT_FOUND);
  try {
    const r = await requestOf(req.app.locals.supabase, token);
    if (!r) return res.status(404).json(NOT_FOUND);
    return res.status(200).json({ ok: true, form: { studio_name: r.vendor.business_name || null, person_name: r.req.person_name || null, video_allowed: videoAllowed(r.vendor.tier) } });
  } catch (_e) { return res.status(404).json(NOT_FOUND); }
});

/** The client's fields, each through limits.js. Returns { error } or { row }. */
function checkSubmission(body, allowVideo, today) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (b.consent !== true) return { error: LINES.consent };
  const name = limits.field('client_name', b.name); if (!name.ok) return { error: name.error };
  const occ = limits.field('client_occasion', b.occasion); if (!occ.ok) return { error: occ.error };
  const place = limits.field('client_place', b.place); if (!place.ok) return { error: place.error };
  const words = limits.field('client_words', b.words); if (!words.ok) return { error: words.error };
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(b.month || ''));
  // "Not after this month" is INDIA'S calendar month (UTC+5:30), not UTC's: at 00:30 IST on 1 October the month is
  // October (CE-47's cure 2, r2). The instant is shifted by 5h30 and read with the UTC getters.
  const t = today instanceof Date && Number.isFinite(today.getTime()) ? today.getTime() : Date.now();
  const d = new Date(t + 330 * 60000);
  const thisMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  if (!m || `${m[1]}-${m[2]}` > thisMonth || Number(m[1]) < 1990) return { error: LINES.month };
  let video_url = null;
  if (b.video_url !== undefined && b.video_url !== null && String(b.video_url).trim() !== '') {
    if (!allowVideo) return { error: LINES.videoPlan };
    const u = String(b.video_url).trim();
    if (!videoKind(u)) return { error: LINES.video };
    video_url = u;
  }
  if (!words.value && !video_url) return { error: LINES.words };
  return { row: { author: name.value, body: words.value, occasion: occ.value, place: place.value, event_month: `${m[1]}-${m[2]}-01`, video_url } };
}

router.post('/:token', async (req, res) => {
  if (!hit(addrKey(req, 'post'), PER_ADDR_POST, HOUR)) return res.status(429).json({ ok: false, error: TOO_MANY });
  const token = String(req.params.token || '');
  if (!TOKEN.test(token)) return res.status(404).json(NOT_FOUND);
  if (!hit(`tok:${sha(token)}`, PER_TOKEN, 0)) return res.status(404).json(NOT_FOUND);
  const sb = req.app.locals.supabase;
  try {
    const r = await requestOf(sb, token);
    if (!r) return res.status(404).json(NOT_FOUND);
    const c = checkSubmission(req.body, videoAllowed(r.vendor.tier));
    if (c.error) return res.status(400).json({ ok: false, error: c.error });
    const at = new Date().toISOString();
    // THE SINGLE USE: only an unused, unrevoked, unexpired request is marked, and its phone is nulled in the same write.
    const { data: used, error: uErr } = await sb.from('vendor_testimonial_requests')
      .update({ used_at: at, phone: null }).eq('id', r.req.id).is('used_at', null).is('revoked_at', null).gt('expires_at', at).select('id');
    if (uErr || !Array.isArray(used) || used.length !== 1) return res.status(404).json(NOT_FOUND);
    const { error: iErr } = await sb.from('vendor_testimonials').insert(Object.assign({
      vendor_id: r.req.vendor_id, request_id: r.req.id, state: 'pending', consented_at: at, submitted_at: at, position: 0 }, c.row));
    if (iErr) {
      // CE-47's cure 3 (r2): a failed insert must not burn the link. Release the request this write marked (its id
      // and this write's own timestamp), so the client can send the words again; the phone stays nulled.
      try { await sb.from('vendor_testimonial_requests').update({ used_at: null }).eq('id', r.req.id).eq('used_at', at); } catch (_rel) { /* the answer below still stands */ }
      return res.status(503).json({ ok: false, error: LINES.failed });
    }
    return res.status(200).json({ ok: true });
  } catch (_e) { return res.status(404).json(NOT_FOUND); }
});

module.exports = router;
module.exports.checkSubmission = checkSubmission;
module.exports.sha = sha;
module.exports._buckets = buckets;
module.exports.LIMITS = { PER_TOKEN, PER_ADDR_POST, PER_ADDR_GET };
