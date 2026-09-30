// src/lib/site/preview.js · TDW · CE-47 · WEB-4 cut 5 · HER DRAFT'S PREVIEW TOKEN (the chair's item 2; WEB-6's W6-l).
// Her room (GET /room) hands out a short-lived token; the public card door, given it as `?preview=<token>`, serves HER
// DRAFT to that token only (and `?style=<id>` for the style cards), never cached and never indexed. The token is
// stateless: base64url of "<vendor id>.<expiry ms>.<hmac>", signed with SITE_PREVIEW_SECRET, else a key derived from the
// service key the server already holds, else a key made for this process (then a token only works until a restart).
// It proves nothing but "this vendor's room asked for a preview in the last 30 minutes"; it opens no other door.
'use strict';

const crypto = require('crypto');
const TTL_MS = 30 * 60 * 1000;
const KEY = process.env.SITE_PREVIEW_SECRET
  ? String(process.env.SITE_PREVIEW_SECRET)
  : process.env.SUPABASE_SERVICE_ROLE_KEY
    ? crypto.createHash('sha256').update('tdw-site-preview:' + process.env.SUPABASE_SERVICE_ROLE_KEY).digest('hex')
    : crypto.randomBytes(32).toString('hex');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^[a-z0-9-]{1,40}$/i;
const mac = (s) => crypto.createHmac('sha256', KEY).update(s).digest('base64url');

/** A token for this vendor, valid for 30 minutes from `now`. */
function issue(vendorId, now) {
  const exp = (Number.isFinite(now) ? now : Date.now()) + TTL_MS;
  const body = `${vendorId}.${exp}`;
  return { token: Buffer.from(`${body}.${mac(body)}`).toString('base64url'), expires_at: new Date(exp).toISOString() };
}

/** The vendor id a token names, when its signature holds and it has not expired; else null. Never throws. */
function verify(token, now) {
  try {
    if (typeof token !== 'string' || token.length < 20 || token.length > 300) return null;
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const i = raw.lastIndexOf('.'); if (i < 0) return null;
    const body = raw.slice(0, i); const sig = raw.slice(i + 1);
    const want = mac(body);
    if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
    const [id, exp] = [body.slice(0, body.lastIndexOf('.')), Number(body.slice(body.lastIndexOf('.') + 1))];
    if (!UUID.test(id) || !(exp > (Number.isFinite(now) ? now : Date.now()))) return null;
    return id;
  } catch (_e) { return null; }
}

/**
 * Her draft laid over the live rows, as the card and her room read it. `live` is the vendor_sites row, `sections` and
 * `pages` the live rows, `draft` the vendor_site_drafts row (or null). Returns { site, sections, pages }.
 */
function overlay(live, sections, pages, draft) {
  const d = draft && typeof draft === 'object' ? draft : {};
  const site = Object.assign({}, live || {}, d.settings && typeof d.settings === 'object' ? d.settings : {});
  let secs = Array.isArray(sections) ? sections.slice() : [];
  if (Array.isArray(d.sections)) {
    const byKey = new Map(secs.filter((x) => x && !x.page_id).map((x) => [x.key, x]));
    for (const s of d.sections) if (s && s.key) byKey.set(s.key, Object.assign({}, byKey.get(s.key) || {}, s));
    secs = [...byKey.values(), ...secs.filter((x) => x && x.page_id)];
  }
  const pgs = Array.isArray(d.pages) ? d.pages.map((p, i) => ({ slug: p.slug, title: p.title, position: i, shown: p.shown !== false })) : (Array.isArray(pages) ? pages : []);
  return { site, sections: secs, pages: pgs };
}

module.exports = { issue, verify, overlay, TTL_MS };
