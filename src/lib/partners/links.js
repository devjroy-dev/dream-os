'use strict';
// src/lib/partners/links.js · CE-47 · PTN-A1 · THE FOUNDER'S RULE: every Instagram handle and every website is a link.
// ONE HOME FOR EACH HALF:
//   handles  -> normalizeIgHandle, src/lib/discover/shapeVendor.js (IMPORTED, never copied: two normalisers would let two
//               screens disagree about one handle);
//   websites -> normalizeWebsite, here. http(s) only; a bare "modelconnect.in" gets https:// added; any other scheme
//               (javascript:, data:, ftp:...) or a missing host is refused (null).
// The server sends READY addresses (instagram_url, website_url); the app draws them and never builds them.
const { normalizeIgHandle } = require('../discover/shapeVendor');

function normalizeWebsite(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:\/\//i.test(s)) return null;   // a scheme that is not http(s)
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (_e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (!u.hostname || !u.hostname.includes('.') || u.username || u.password) return null;
  return u.toString();
}

const instagramUrl = (handle) => { const h = normalizeIgHandle(handle); return h ? `https://www.instagram.com/${h}/` : null; };
const websiteUrl = (site) => normalizeWebsite(site);

// The two refusals, in the founder's plain words.
const WORDS = Object.freeze({
  badHandle:  'Write the Instagram handle only, for example modelconnect.in',
  badWebsite: 'Write the website address, for example https://modelconnect.in',
});

module.exports = { normalizeIgHandle, normalizeWebsite, instagramUrl, websiteUrl, WORDS };
