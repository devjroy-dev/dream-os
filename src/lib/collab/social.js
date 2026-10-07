'use strict';
// src/lib/collab/social.js · CE-47 · CLB-1 · COLLAB HUB v2: what a call says on Instagram and Threads. PURE.
//
// RULE 2 (the founder, CE-47 charter, 4 October 2026): a post TDW makes never tags or mentions any account.
// Hashtags only, chosen from the call itself: craft, then city, then occasion (ruling 3). Meta caps them: five on
// Instagram (counted across caption and comments), one topic tag on Threads. `refuse()` is the last word before any
// publish: a caption holding '@' anywhere is refused, whatever built it.
// RULE 1 (ruling 1): until a switch row is on, CLB features open only for vendors on clb.testers; vendors see nothing.

// The categories have ONE home (src/agent/categories.js). The two word tables below are keyed by it and checked
// against it at load: a category added there with no word here throws at boot rather than posting a blank craft.
const { VENDOR_CATEGORIES } = require('../../agent/categories');
const { EXTRA_ROLES } = require('./roles');   // HUB-2b · F-44.417

const CAPS = Object.freeze({ instagram: 5, threads: 1 });
const PLATFORMS = Object.freeze(['instagram', 'threads']);
const PAY_KINDS = Object.freeze(['paid', 'unpaid', 'credit_only']);
const MAX_REFERENCES = 4;

// A category's word in a tag. 'other' carries no craft word (a model, a mehendi artist: the note says it, not a tag).
const CRAFT = Object.freeze({
  photography: 'Photographer', makeup: 'MakeupArtist', hairstylist: 'HairStylist', jewellery: 'Jewellery',
  designer: 'Designer', decor: 'WeddingDecor', planning: 'WeddingPlanner', venue_catering: 'WeddingVenue',
  performer: 'Performer', content_creator: 'ContentCreator',
});
// A call's occasion in a tag (0048's event_type list).
const OCCASION = Object.freeze({
  wedding: 'BridalShoot', pre_wedding: 'PreWeddingShoot', engagement: 'EngagementShoot', editorial: 'EditorialShoot',
  brand_shoot: 'BrandShoot', portrait: 'PortraitShoot',
});
// The plain words a reader of the post sees for each craft (no "couple", no "bride").
const CRAFT_WORD = Object.freeze({
  photography: 'photographer', makeup: 'makeup artist', hairstylist: 'hair stylist', jewellery: 'jewellery',
  designer: 'designer', decor: 'decor', planning: 'planner', venue_catering: 'venue', performer: 'performer',
  content_creator: 'content creator', other: 'other',
});
for (const c of VENDOR_CATEGORIES) if (!(c in CRAFT_WORD)) throw new Error(`collab/social: no word for category ${c}`);
for (const k of Object.keys(CRAFT_WORD)) if (!VENDOR_CATEGORIES.includes(k)) throw new Error(`collab/social: ${k} is not a category`);
// HUB-2b · F-44.417: the three collab roles 0197 added (people, not vendor businesses) have their own words. CRAFT_WORD
// stays the eleven categories (the checks above); ROLE_WORD is the rest of the collab role list, checked the same way.
const ROLE_WORD = Object.freeze({ model: 'model', stylist: 'stylist', studio: 'studio' });
for (const r of EXTRA_ROLES) if (!(r in ROLE_WORD)) throw new Error(`collab/social: no word for role ${r}`);
for (const k of Object.keys(ROLE_WORD)) if (!EXTRA_ROLES.includes(k)) throw new Error(`collab/social: ${k} is not a collab role`);
const PAY_WORD = Object.freeze({ paid: 'Paid', unpaid: 'Unpaid', credit_only: 'Credit only' });
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "new delhi" → "NewDelhi". Letters only, so a tag can never carry '@', '#' or a space. */
function camel(s) {
  return String(s || '').split(/[^A-Za-z]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

/** The call's tags in ruled order (craft with city, then city, then occasion), capped for the platform. */
function hashtagsFor(post, items, platform) {
  const cap = CAPS[platform]; if (!cap) return [];
  const city = camel(clean(post && post.city));
  const crafts = [];
  for (const it of (items || [])) { const c = CRAFT[it && it.requirement_type]; if (c && !crafts.includes(c)) crafts.push(c); }
  const out = [];
  for (const c of crafts) out.push(city ? `${city}${c}` : c);
  if (city) out.push(`${city}Wedding`);
  const occ = OCCASION[post && post.event_type]; if (occ) out.push(city ? `${city}${occ}` : occ);
  return [...new Set(out)].filter((t) => /^[A-Za-z]+$/.test(t)).slice(0, cap).map((t) => `#${t}`);
}

/** "Saturday, 17 October 2026" from a YYYY-MM-DD string, read as a calendar date (no clock, no zone). */
function dateWords(ymd) {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${DAYS[d.getUTCDay()]}, ${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

/** Her own words, with every '@' taken out (Rule 2), on one line. */
function clean(s) { return String(s || '').replace(/@/g, '').replace(/\s+/g, ' ').trim(); }

function rolesLine(items) {
  const words = [];
  for (const it of (items || [])) {
    const k = it && it.requirement_type;
    const w = k === 'other' && it.note ? clean(it.note) : (CRAFT_WORD[k] || ROLE_WORD[k]);   // F-44.417: all fourteen roles have a word
    if (w && !words.includes(w)) words.push(w);
  }
  return words.join(', ');
}

/** The post's words. The join link is TDW's own address; the details are hers, so '@' is stripped from them. */
function captionFor(post, items, platform, link) {
  const lines = [];
  lines.push(`Looking for: ${rolesLine(items)}`);
  lines.push(`${dateWords(post.event_date)} · ${clean(post.city)}`.trim());
  if (post.pay_kind) lines.push(PAY_WORD[post.pay_kind] + (post.pay_kind === 'paid' && post.budget_inr ? ` · Rs ${Number(post.budget_inr).toLocaleString('en-IN')}` : ''));
  if (post.details) lines.push(clean(post.details));
  lines.push(link ? `Interested? Comment below or join on TDW: ${link}` : 'Interested? Comment below.');
  const tags = hashtagsFor(post, items, platform);
  return { caption: `${lines.filter(Boolean).join('\n')}\n\n${tags.join(' ')}`.trim(), hashtags: tags };
}

/** RULE 2's last check. Any '@' anywhere refuses the publish. */
function refuse(caption) {
  return /@/.test(String(caption || '')) ? 'the caption holds an @, so it names an account (Rule 2)' : null;
}

/** Up to four Cloudinary pictures; anything else is dropped. */
function cleanReferences(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((u) => typeof u === 'string' && /^https:\/\/res\.cloudinary\.com\/[^\s]+$/.test(u)).slice(0, MAX_REFERENCES);
}

/** RULE 1. on → everyone; pending or armed → testers only; off or absent → nobody. */
function openFor(row, vendorId, testers) {
  const s = row ? row.status : null;
  if (s === 'on') return true;
  if ((s === 'pending' || s === 'armed' || s === 'approved') && vendorId && Array.isArray(testers)) return testers.includes(vendorId);
  return false;
}

module.exports = { clean, CAPS, PLATFORMS, PAY_KINDS, MAX_REFERENCES, CRAFT, OCCASION, PAY_WORD, camel, hashtagsFor, dateWords, rolesLine, captionFor, refuse, cleanReferences, openFor };
