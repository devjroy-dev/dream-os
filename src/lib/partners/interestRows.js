'use strict';
// src/lib/partners/interestRows.js · CE-47 · PTN-A2-0 r2 · A PURE MAPPING. No gate, no send, no door, no write.
// partnerRowsFor(sb, rows) -> Promise<Array<row>>: the shape of a partner's suggestion on a vendor's Interested list.
// CLB's HUB-2b requires it and places the rows (the chair, 7 Oct 2026).
//   sb    a supabase client; ONE read: partner_orgs (id, name, kind, cities, instagram_handle, website, check_state).
//   rows  collab_interest rows as CLB holds them. Only rows with source 'partner' and a partner_id are mapped; every
//         other row is ignored (never echoed). Order is kept.
// Each row returned, and nothing else:
//   { id, source: 'partner', name, role, role_word, link,
//     partner: { name, kind_words, cities, instagram_url, website_url },
//     check_words, fee_line }
// check_words is the partner mark's words, taken ONLY from orgs.CHECK_WORDS (one home; the founder's words, 7 Oct 2026,
// land there with PTN-A2-1). A SEPARATE field and never a label: CLB adds the label to its response only when
// 'partners.check_label' is on (one key for both seats, off, failing closed until the founder approves the rule).
// A BLOCKED partner's row is DROPPED. A partner_orgs row that cannot be found: dropped too.
// NEVER a phone or an email of anyone: the input's body, external_user_id, vendor_id and every other column are not read;
// a name holding an email or a phone-shaped run is cut to its words; a link that carries one (wa.me, mailto, a number in
// the path) is dropped. "Contact <partner>" is not here: it comes with PTN-A2-1, answered at the moment of the tap.
const { instagramUrl, websiteUrl } = require('./links');
const { KIND_WORDS, CHECK_WORDS, FEE_LINE } = require('./orgs');
const { rolesLine } = require('../collab/social');

// rolesLine has no word for model, stylist or studio (candidate F-44.417, CLB's); these three are said here.
const EXTRA = Object.freeze({ model: 'model', stylist: 'stylist', studio: 'studio' });
const roleWord = (k) => EXTRA[k] || rolesLine([{ requirement_type: k }]) || null;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const PHONE = /\+?\(?\d[\d\s().-]{8,}\d/g;        // ten or more digits, however spaced or bracketed
const digitsIn = (s) => (String(s).match(/\d/g) || []).length;
function cleanName(s) {
  let t = String(s || '').replace(EMAIL, ' ').replace(/@/g, '');
  t = t.replace(PHONE, (m) => (digitsIn(m) >= 10 ? ' ' : m));
  t = t.replace(/\s+/g, ' ').trim().slice(0, 80);
  return t || null;
}
function safeLink(raw) {
  const u = websiteUrl(raw);
  if (!u) return null;
  let host = '';
  try { host = new URL(u).hostname.toLowerCase(); } catch (_e) { return null; }
  if (/(^|\.)(wa\.me|whatsapp\.com|api\.whatsapp\.com)$/.test(host)) return null;
  const plain = decodeURIComponent(u);
  if (plain.includes('@') || /\d{10,}/.test(plain.replace(/[\s().-]/g, ''))) return null;
  return u;
}

const safeIg = (h) => { const u = instagramUrl(h); return u && !/\d{10,}/.test(u) ? u : null; };

async function partnerRowsFor(sb, rows) {
  const mine = (Array.isArray(rows) ? rows : []).filter((r) => r && r.source === 'partner' && r.partner_id);
  if (!mine.length) return [];
  const ids = [...new Set(mine.map((r) => r.partner_id))];
  const { data: orgs, error } = await sb.from('partner_orgs').select('id, name, kind, cities, instagram_handle, website, check_state').in('id', ids);
  if (error) throw new Error(`partnerRowsFor: partner_orgs could not be read (${error.message || error})`);
  const by = new Map((orgs || []).map((o) => [o.id, o]));
  const out = [];
  for (const r of mine) {
    const o = by.get(r.partner_id);
    if (!o || o.check_state === 'blocked') continue;
    const name = cleanName(r.display_name);
    if (!name) continue;
    out.push({
      id: r.id, source: 'partner', name, role: r.role || null, role_word: r.role ? roleWord(r.role) : null, link: safeLink(r.link),
      partner: { name: cleanName(o.name) || 'Partner', kind_words: KIND_WORDS[o.kind] || 'Partner', cities: Array.isArray(o.cities) ? o.cities : [],
        instagram_url: safeIg(o.instagram_handle), website_url: safeLink(o.website) },
      check_words: CHECK_WORDS[o.check_state] || null,
      fee_line: FEE_LINE,
    });
  }
  return out;
}

const ROW_KEYS = Object.freeze(['id', 'source', 'name', 'role', 'role_word', 'link', 'partner', 'check_words', 'fee_line']);
const PARTNER_KEYS = Object.freeze(['name', 'kind_words', 'cities', 'instagram_url', 'website_url']);
module.exports = { partnerRowsFor, ROW_KEYS, PARTNER_KEYS };
