'use strict';
// src/lib/brands/rules.js · CE-47 · PRO · P3 · BRAND COLLABORATIONS: what a brand row may hold, the pitch limits, the
// pitch text, the tracker's steps and every sentence the room shows. PURE: no database, no clock (now is passed in).
//
// THE BRAND ROW (the chair, 6 October 2026): it leads with the brand's Instagram handle AS THE BRAND'S OWN WEBSITE SHOWS
// IT (source_url is that page). An email is kept only when it is a role address (pr@, collab@ ...) on the brand's own
// domain, never a person's. TDW never sends a pitch: she sends it herself, and tells TDW she sent it.
// THE LIMITS: 3 pitches in an India day, 10 in an India week from Monday, and one brand once in 30 days.
// ZERO KICKBACK: TDW takes nothing from a collaboration, and no link here pays TDW.
// R-47.1 (the founder, 8 October 2026): every sentence below is simple, formal and complete, with one idea in it.

const IST_MS = 5.5 * 3600 * 1000;
const DAY_MS = 86400000;
const DAY_LIMIT = 3, WEEK_LIMIT = 10, SAME_BRAND_DAYS = 30;
const TRADES = Object.freeze(['makeup', 'photography', 'designer', 'jewellery', 'decor', 'venue_catering', 'other']);
const TRADE_WORD = Object.freeze({ makeup: 'makeup', photography: 'photography', designer: 'bridal wear', jewellery: 'jewellery', decor: 'decor', venue_catering: 'venues and catering', other: 'weddings' });
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fullDate = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const enIn = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const istDay = (ms) => new Date(ms + IST_MS).toISOString().slice(0, 10);

/** Her trade key, from her vendor category (categoryProfiles' keys; a hairstylist counts as makeup). */
function tradeKey(category) {
  let k = 'other';
  try { k = require('../vendor/categoryFraming').normaliseCategory(category) || 'other'; } catch (_e) { k = 'other'; }
  if (k === 'hairstylist') return 'makeup';
  return TRADES.includes(k) ? k : 'other';
}

// ── the brand row ────────────────────────────────────────────────────────────────────────────────────────────────
const ROLE_WORDS = Object.freeze(['pr', 'collab', 'collabs', 'collaboration', 'collaborations', 'partnership', 'partnerships', 'partner', 'partners',
  'marketing', 'influencer', 'influencers', 'creator', 'creators', 'brand', 'brands', 'hello', 'info', 'contact', 'media', 'press', 'social', 'team', 'business']);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const hostOf = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.hostname.toLowerCase().replace(/^www\./, '') : null; } catch (_e) { return null; } };
const httpsOr = (u) => { const s = String(u || '').trim(); if (!s) return null; const v = /^https?:\/\//i.test(s) ? s.replace(/^http:/i, 'https:') : `https://${s}`; return hostOf(v) ? v : false; };
/** "@Brand.India", "instagram.com/brand.india/" or "brand.india" → "brand.india"; anything else → null. */
function handleOf(v) {
  let s = String(v || '').trim();
  const m = /instagram\.com\/([A-Za-z0-9._]{1,30})\/?/i.exec(s); if (m) s = m[1];
  s = s.replace(/^@/, '').toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(s) ? s : null;
}
const sameSite = (host, site) => host === site || host.endsWith(`.${site}`) || site.endsWith(`.${host}`);
/** A role address on the brand's own domain, or the reason it is refused. */
function roleEmailCheck(email, websiteUrl) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return { ok: true, email: null };
  const m = /^([a-z0-9._+-]+)@([a-z0-9.-]+\.[a-z]{2,})$/.exec(e);
  if (!m) return { ok: false, error: 'Type the email address in full, for example pr@brand.in.' };
  const local = m[1].split(/[.+_-]/)[0];
  if (!ROLE_WORDS.includes(local)) return { ok: false, error: 'Keep only a role address, such as pr@ or collab@. A person’s own address is not kept.' };
  const site = hostOf(websiteUrl);
  if (!site || !sameSite(m[2], site)) return { ok: false, error: 'The email must be on the brand’s own website address.' };
  return { ok: true, email: e };
}

/** What the admin saves. today is India's date. Returns { ok, row } or { ok: false, error } in plain words. */
function checkBrand(body, today) {
  const b = body || {};
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'Type the brand’s name in 2 to 80 letters.' };
  const trades = [...new Set((Array.isArray(b.trades) ? b.trades : [b.trades]).map((t) => String(t || '').trim()))].filter(Boolean);
  if (!trades.length || trades.some((t) => !TRADES.includes(t))) return { ok: false, error: 'Choose at least one trade the brand works with.' };
  const website_url = httpsOr(b.website_url);
  if (!website_url) return { ok: false, error: 'Type the brand’s own website address.' };
  const instagram_handle = handleOf(b.instagram_handle);
  if (!instagram_handle) return { ok: false, error: 'Type the Instagram handle that the brand’s own website shows.' };
  const source_url = httpsOr(b.source_url);
  if (!source_url) return { ok: false, error: 'Type the address of the page where you found these details.' };
  if (!sameSite(hostOf(source_url), hostOf(website_url))) return { ok: false, error: 'The page where you found these details must be on the brand’s own website.' };
  const re = roleEmailCheck(b.role_email, website_url); if (!re.ok) return re;
  const form_url = httpsOr(b.form_url); if (form_url === false) return { ok: false, error: 'Type the full address of the brand’s collaboration form.' };
  const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(/[,\s]/g, '')));
  const fmin = num(b.followers_min), fmax = num(b.followers_max);
  if ((fmin != null && !(Number.isInteger(fmin) && fmin >= 0)) || (fmax != null && !(Number.isInteger(fmax) && fmax >= 0))) return { ok: false, error: 'Type follower numbers as whole numbers.' };
  if (fmin != null && fmax != null && fmax < fmin) return { ok: false, error: 'The largest follower number must not be smaller than the smallest.' };
  const checked_on = String(b.checked_on || '').trim();
  if (!ISO.test(checked_on) || checked_on > today) return { ok: false, error: 'Pick the day you checked these details. It cannot be a future day.' };
  const looks_for = b.looks_for == null ? null : String(b.looks_for).trim().replace(/\s+/g, ' ').slice(0, 300) || null;
  return { ok: true, row: { name, trades, looks_for, website_url, instagram_handle, role_email: re.email, form_url: form_url || null, source_url, followers_min: fmin, followers_max: fmax, checked_on } };
}

// ── the limits ───────────────────────────────────────────────────────────────────────────────────────────────────
/** The start of her India day and India week (Monday), and the moment 30 days ago, as ISO instants. */
function windows(now) {
  const day = istDay(now);
  const dayStart = Date.parse(`${day}T00:00:00+05:30`);
  const dow = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;   // Monday 0 ... Sunday 6
  return { day, dayStart: new Date(dayStart).toISOString(), weekStart: new Date(dayStart - dow * DAY_MS).toISOString(), monthAgo: new Date(now - SAME_BRAND_DAYS * DAY_MS).toISOString() };
}
/** What 0210's pro_pitch_record answered, in her words; null when it was recorded. */
const RECORD_WORDS = Object.freeze({
  recorded: null,
  brand_30: `You pitched this brand in the last ${SAME_BRAND_DAYS} days. You can pitch the same brand once in ${SAME_BRAND_DAYS} days.`,
  day_3: `You have sent ${DAY_LIMIT} pitches today. You can send more tomorrow.`,
  week_10: `You have sent ${WEEK_LIMIT} pitches this week. You can send more from Monday.`,
  not_listed: 'This brand is no longer on the list.',
  not_found: 'Your account was not found.',
});
/** The counts line on the room. */
const countsLine = (week) => `You have sent ${week} of ${WEEK_LIMIT} pitches this week.`;
const LIMITS_LINE = `You can send up to ${DAY_LIMIT} pitches a day and ${WEEK_LIMIT} a week. You can pitch the same brand once in ${SAME_BRAND_DAYS} days. These limits keep brands reading your pitches.`;

// ── the pitch ────────────────────────────────────────────────────────────────────────────────────────────────────
const CHANNELS = Object.freeze(['instagram', 'email', 'form']);
const channelsOf = (b) => ['instagram', b.role_email ? 'email' : null, b.form_url ? 'form' : null].filter(Boolean);
const CHANNEL_WORD = Object.freeze({ instagram: 'Instagram', email: 'email', form: 'the brand’s form' });
/** The pitch TDW writes for her to send. She can change every word before she sends it. */
const BUSINESS_WORD = Object.freeze({ makeup: 'makeup', photography: 'photography', designer: 'bridal wear', jewellery: 'jewellery', decor: 'decor', venue_catering: 'venue and catering', other: 'wedding' });
function pitchText({ vendorName, trade, city, weddings, kitUrl, brandName }) {
  const what = `a ${BUSINESS_WORD[trade] || 'wedding'} business${city ? ` in ${city}` : ''}`;
  const lines = [
    `Hello ${brandName} team,`,
    '',
    vendorName ? `I am writing from ${vendorName}, ${what}.` : `I run ${what}.`,
    weddings > 0 ? `TDW has verified ${enIn(weddings)} ${weddings === 1 ? 'wedding' : 'weddings'} of my work.` : null,
    `I would like to work with ${brandName} on wedding looks for my clients and my Instagram.`,
    `My media kit shows my work, my figures and how to reach me: ${kitUrl}`,
    '',
    'Thank you for reading.',
    vendorName || '',
  ].filter((l) => l !== null);
  return lines.join('\n').trim();
}
/** Where she sends it: the brand's Instagram, a ready email, or the brand's form. */
function channelLink(b, channel, text) {
  if (channel === 'instagram') return `https://www.instagram.com/${b.instagram_handle}/`;
  if (channel === 'email' && b.role_email) return `mailto:${b.role_email}?subject=${encodeURIComponent('Collaboration enquiry')}&body=${encodeURIComponent(text || '')}`;
  if (channel === 'form' && b.form_url) return b.form_url;
  return null;
}
const SEND_STEP = Object.freeze({
  instagram: 'Copy the pitch. Tap Open Instagram. Send the pitch to the brand as a message.',
  email: 'Tap Open email. Your email app opens with the pitch written in it. Check the pitch before you send it.',
  form: 'Copy the pitch. Tap Open the form. Paste the pitch into the brand’s form.',
});
const SENT_ASK = 'After you send the pitch, tap I sent it. TDW then counts the pitch and shows it under Your pitches.';

// ── the tracker ──────────────────────────────────────────────────────────────────────────────────────────────────
const NEXT = Object.freeze({
  pitched: ['replied', 'declined', 'no_reply'],
  replied: ['agreed', 'declined'],
  agreed: ['kit_received', 'posted', 'declined'],
  kit_received: ['posted'],
  posted: [], declined: [], no_reply: [],
});
const STEP_WORD = Object.freeze({ replied: 'The brand replied', agreed: 'We agreed to work together', kit_received: 'The products arrived', posted: 'I posted it', declined: 'The brand said no', no_reply: 'No reply' });
const ASCI_LINE = 'If you got this for free or were paid, label the post as an ad or a paid partnership, as ASCI’s rules require.';   // the founder's words, 6 October 2026
/** May she move a pitch from one step to another? */
const canMove = (from, to) => (NEXT[from] || []).includes(to);
function pillOf(p) {
  if (p.state === 'kit_received' || p.state === 'agreed') return p.post_due ? { text: 'Post due', tone: 'warn' } : { text: p.state === 'agreed' ? 'Agreed' : 'Products arrived', tone: 'ok' };
  return { pitched: { text: 'Pitched', tone: 'ok' }, replied: { text: 'Replied', tone: 'ok' }, posted: { text: 'Posted', tone: 'done' }, declined: { text: 'Declined', tone: 'muted' }, no_reply: { text: 'No reply', tone: 'muted' } }[p.state] || { text: 'Pitched', tone: 'ok' };
}
/** One sentence on where a pitch stands. */
function lineOf(p) {
  const by = CHANNEL_WORD[p.channel] || 'Instagram';
  const on = fullDate(istDay(Date.parse(p.pitched_at)));
  const due = p.post_due ? ` The post is due on ${fullDate(p.post_due)}.` : '';
  switch (p.state) {
    case 'replied': return `The brand replied to your pitch of ${on}.`;
    case 'agreed': return `You and the brand agreed to work together.${due}`;
    case 'kit_received': return `The brand’s products arrived.${due}`;
    case 'posted': return 'You posted your work for the brand.';
    case 'declined': return 'The brand said no to this pitch.';
    case 'no_reply': return `The brand did not reply to your pitch of ${on}.`;
    default: return `You pitched this brand by ${by} on ${on}.`;
  }
}
/** ASCI's line shows from the moment she agrees to work with a brand. */
const needsAsci = (state) => state === 'agreed' || state === 'kit_received' || state === 'posted';

// ── the brand as she sees it ─────────────────────────────────────────────────────────────────────────────────────
function worksWithLine(b) {
  if (b.followers_min != null && b.followers_max != null) return `It works with accounts of ${enIn(b.followers_min)} to ${enIn(b.followers_max)} followers.`;
  if (b.followers_min != null) return `It works with accounts of ${enIn(b.followers_min)} followers or more.`;
  if (b.followers_max != null) return `It works with accounts of up to ${enIn(b.followers_max)} followers.`;
  return null;
}
function reachLine(b) {
  const ways = channelsOf(b).map((c) => CHANNEL_WORD[c]);
  const list = ways.length === 1 ? ways[0] : `${ways.slice(0, -1).join(', ')} or ${ways[ways.length - 1]}`;
  return `You can reach it by ${list}.`;
}
/** Does a brand fit her? Her trade must be one it works with; her followers, when TDW knows them, must be in its range. */
function fits(b, trade, followers) {
  if (!(b.trades || []).includes(trade)) return false;
  if (followers == null) return true;
  if (b.followers_min != null && followers < b.followers_min) return false;
  if (b.followers_max != null && followers > b.followers_max) return false;
  return true;
}
function viewBrand(b) {
  return {
    id: b.id, name: b.name, looks_for: b.looks_for || null, works_with: worksWithLine(b), reach: reachLine(b), channels: channelsOf(b),
    instagram_handle: b.instagram_handle, instagram_url: `https://www.instagram.com/${b.instagram_handle}/`, website_url: b.website_url, source_url: b.source_url,
    checked_line: `TDW took these details from the brand’s own website on ${fullDate(b.checked_on)}.`,
  };
}
function viewPitch(p, brandName) {
  return { id: p.id, brand_id: p.brand_id, brand: brandName || 'A brand', channel: p.channel, state: p.state, post_due: p.post_due || null,
    pill: pillOf(p), line: lineOf(p), next: (NEXT[p.state] || []).map((to) => ({ to, label: STEP_WORD[to] })), asci: needsAsci(p.state) ? ASCI_LINE : null, pitched_at: p.pitched_at };
}

module.exports = {
  DAY_LIMIT, WEEK_LIMIT, SAME_BRAND_DAYS, TRADES, TRADE_WORD, ROLE_WORDS, CHANNELS, NEXT, STEP_WORD, ASCI_LINE, RECORD_WORDS, LIMITS_LINE, SEND_STEP, SENT_ASK,
  tradeKey, handleOf, roleEmailCheck, checkBrand, windows, countsLine, channelsOf, pitchText, channelLink, canMove, pillOf, lineOf, needsAsci,
  worksWithLine, reachLine, fits, viewBrand, viewPitch, fullDate, istDay, enIn,
};
