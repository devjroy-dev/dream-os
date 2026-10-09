'use strict';
// src/lib/trends/build.js · CE-47 · PRO · P3 · THE TREND ROOM'S WEEKLY BRIEF, counted from enquiries across TDW.
// PURE: the rows and the week are passed in.
//
// ANONYMITY (the chair, 6 October 2026): a brief is made for a trade in a city only when that week has at least 10
// enquiries that went to at least 3 different vendors. Inside a brief, a word, a month or a budget band is shown only
// when at least 3 enquiries share it, so no single client or vendor can be picked out. No name, phone, message or
// vendor ever leaves this file: only counts, month names and a budget band.
// THE WEEK: Monday to Sunday in India. The brief is made after the week ends; an admin approves it; vendors see it from
// the next Monday at 9:00 am India time.
// R-47.1: every sentence is simple, formal and complete, with one idea in it.
const { tradeKey, TRADE_WORD, fullDate, enIn } = require('../brands/rules');

const FLOOR_ENQUIRIES = 10, FLOOR_VENDORS = 3, FLOOR_CELL = 3;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const IST = '+05:30';

// The words counted for each trade: what clients write in an enquiry. A word counts once per enquiry.
const TERMS = Object.freeze({
  makeup: ['HD makeup', 'airbrush', 'soft glam', 'dewy', 'matte', 'natural look', 'glass skin', 'smokey eyes', 'bold lips', 'hairstyling', 'saree draping', 'trial'],
  photography: ['candid', 'traditional', 'pre-wedding', 'drone', 'cinematic', 'reels', 'album', 'destination'],
  designer: ['lehenga', 'saree', 'sherwani', 'pastel', 'custom', 'fittings'],
  jewellery: ['kundan', 'polki', 'temple jewellery', 'diamond', 'gold', 'rental', 'choker'],
  decor: ['floral', 'mandap', 'haldi', 'mehendi', 'lighting', 'theme', 'pastel'],
  venue_catering: ['buffet', 'live counter', 'lawn', 'banquet', 'farmhouse'],
  other: [],
});
const BANDS = [[0, 25000], [25000, 50000], [50000, 100000], [100000, 200000], [200000, Infinity]];
const rs = (n) => `Rs ${enIn(n)}`;
const bandWords = ([a, b]) => (a === 0 ? `under ${rs(b)}` : b === Infinity ? `${rs(a)} or more` : `${rs(a)} to ${rs(b)}`);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termRe = (t) => new RegExp(`(^|[^a-z])${esc(t.toLowerCase()).replace(/[\s-]+/g, '[\\s-]*')}([^a-z]|$)`, 'i');
/** Her city as a brief groups it: trimmed, single-spaced, each word capitalised; "New Delhi" and "Delhi" stay apart. */
const cityKey = (c) => String(c || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/\b[a-z]/g, (x) => x.toUpperCase());

/** The India-time bounds of the week that starts on weekStart (a Monday, YYYY-MM-DD). */
function weekBounds(weekStart) {
  const from = Date.parse(`${weekStart}T00:00:00${IST}`);
  return { from: new Date(from).toISOString(), to: new Date(from + 7 * 86400000).toISOString(), showFrom: new Date(from + 7 * 86400000 + 9 * 3600000).toISOString() };
}
/** The Monday of the India week before the one that holds `now`. */
function lastWeekStart(now) {
  const day = new Date(now + 5.5 * 3600000).toISOString().slice(0, 10);
  const dow = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
  return new Date(Date.parse(`${day}T00:00:00Z`) - (dow + 7) * 86400000).toISOString().slice(0, 10);
}

/** The briefs for one week. leads: { vendor_id, wedding_date, budget_min, budget_max, raw_message, vendor_summary, event_types };
 *  vendors: { id → { category, city } }. Returns [{ trade, city, counts }], only for groups over the floor. */
function build({ leads, vendors }) {
  const groups = new Map();
  for (const l of leads) {
    const v = vendors[l.vendor_id]; if (!v) continue;
    const city = cityKey(v.city); if (city.length < 2) continue;
    const trade = tradeKey(v.category);
    const k = `${trade}|${city}`;
    if (!groups.has(k)) groups.set(k, { trade, city, rows: [], vendors: new Set() });
    const g = groups.get(k); g.rows.push(l); g.vendors.add(l.vendor_id);
  }
  const out = [];
  for (const g of groups.values()) {
    if (g.rows.length < FLOOR_ENQUIRIES || g.vendors.size < FLOOR_VENDORS) continue;
    const terms = (TERMS[g.trade] || []).map((t) => ({ term: t, count: g.rows.filter((l) => termRe(t).test([l.raw_message, l.vendor_summary, ...(l.event_types || [])].filter(Boolean).join(' '))).length }))
      .filter((x) => x.count >= FLOOR_CELL).sort((a, b) => b.count - a.count || a.term.localeCompare(b.term)).slice(0, 3);
    const m = new Map();
    for (const l of g.rows) if (l.wedding_date && /^\d{4}-\d{2}/.test(String(l.wedding_date))) { const k2 = Number(String(l.wedding_date).slice(5, 7)) - 1; m.set(k2, (m.get(k2) || 0) + 1); }
    const months = [...m.entries()].filter(([, c]) => c >= FLOOR_CELL).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 2).map(([k2]) => MONTHS[k2]);
    const bc = new Map();
    for (const l of g.rows) {
      const lo = Number(l.budget_min), hi = Number(l.budget_max);
      const val = Number.isFinite(lo) && lo > 0 && Number.isFinite(hi) && hi > 0 ? (lo + hi) / 2 : Number.isFinite(lo) && lo > 0 ? lo : Number.isFinite(hi) && hi > 0 ? hi : null;
      if (val == null) continue;
      const i = BANDS.findIndex(([a, b]) => val >= a && val < b); bc.set(i, (bc.get(i) || 0) + 1);
    }
    const topBand = [...bc.entries()].filter(([, c]) => c >= FLOOR_CELL).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    out.push({ trade: g.trade, city: g.city, counts: { enquiries: g.rows.length, vendors: g.vendors.size, terms, months, budget: topBand ? bandWords(BANDS[topBand[0]]) : null } });
  }
  return out.sort((a, b) => a.trade.localeCompare(b.trade) || a.city.localeCompare(b.city));
}

/** The brief as sentences, for the room. */
function lines(brief) {
  const c = brief.counts || {}; const tw = TRADE_WORD[brief.trade] || 'weddings';
  const out = [`TDW vendors in ${brief.city} received ${enIn(c.enquiries)} enquiries for ${tw} in the week of ${fullDate(brief.week_start)}.`, `These enquiries went to ${enIn(c.vendors)} vendors.`];
  if (c.terms && c.terms.length) {
    const parts = c.terms.map((t) => `${t.term} (${enIn(t.count)} ${t.count === 1 ? 'enquiry' : 'enquiries'})`);
    out.push(`Clients most often asked for ${parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`}.`);
  }
  if (c.months && c.months.length) out.push(`Most of the wedding dates asked for were in ${c.months.join(' and ')}.`);
  if (c.budget) out.push(`The most common budget was ${c.budget}.`);
  return out;
}
const NOTE = 'TDW counted these enquiries across all vendors on TDW. No client or vendor is named.';
const HEAD = (brief) => `${(TRADE_WORD[brief.trade] || 'weddings').replace(/^./, (x) => x.toUpperCase())} in ${brief.city}, week of ${fullDate(brief.week_start)}.`;
const MADE_LINE = 'TDW makes a new brief every Monday at 9:00 am.';

module.exports = { build, lines, weekBounds, lastWeekStart, cityKey, TERMS, BANDS, FLOOR_ENQUIRIES, FLOOR_VENDORS, FLOOR_CELL, NOTE, HEAD, MADE_LINE, termRe };
