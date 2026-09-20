'use strict';
// src/lib/vendor/spokenDate.js  A DATE AS SHE SAID IT, RESOLVED BY THE DOOR. CE-44 LC-Victor P5.
//
// F-44.38 (ruled for the contract): the listener returns the date AS SPOKEN and NO MODEL DOES DATE
// ARITHMETIC. The door resolves it here, against today in IST. F-44.46 (ruled): a day with no month,
// or a month with no year, resolves to its NEXT occurrence on or after today.
//
// ONE DIRECTION ADDED, AND IT IS THE EXECUTOR'S, NAMED FOR THE CHAIR TO RATIFY (see P5's handover):
// F-44.46 was ruled on a LOOKUP ("am I free on 19th" asked on 20 September is 19 October). A PAYMENT
// RECEIVED is a past event: "Swati Test paid the middle payment on 18 September", said on 20
// September, is 18 September 2026, never 2027. So a caller asks for direction 'past' for a received
// date (the MOST RECENT such day on or before today) and 'future' (the default, F-44.46) otherwise.
//
// ITS OWN FILE, NOT witnessLine.js (chair-accepted): witnessLine.js is also the bride lane's witness.
// It REUSES witnessLine's istDay idea only through its own IST arithmetic, and renders nothing.
//
// TOTAL: resolveSpokenDate never throws. It answers { ok: true, iso } or { ok: false, reason } where
// reason is 'none' (nothing was said: the door asks B6) or 'unreadable' (the door says B7).

const IST_MS = 5.5 * 60 * 60 * 1000;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function todayIstIso(nowMs) {
  const t = Number.isFinite(nowMs) ? nowMs : Date.now();
  return new Date(t + IST_MS).toISOString().slice(0, 10);
}

function pad(n) { return String(n).padStart(2, '0'); }
function iso(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
function real(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const p = new Date(Date.UTC(y, m - 1, d));
  return p.getUTCFullYear() === y && p.getUTCMonth() === m - 1 && p.getUTCDate() === d;
}
function addDays(isoDay, n) {
  const [y, m, d] = isoDay.split('-').map(Number);
  const p = new Date(Date.UTC(y, m - 1, d + n));
  return iso(p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate());
}
function monthOf(word) {
  const w = String(word || '').toLowerCase().replace(/\./g, '');
  if (w.length < 3) return 0;
  return MONTHS.findIndex((m) => m.startsWith(w)) + 1;
}

// A day and month with no year: this year's, or the next/previous one, by direction.
function pickYear(today, m, d, direction) {
  const y0 = Number(today.slice(0, 4));
  for (const y of direction === 'past' ? [y0, y0 - 1] : [y0, y0 + 1]) {
    if (!real(y, m, d)) continue;
    const c = iso(y, m, d);
    if (direction === 'past' ? c <= today : c >= today) return c;
  }
  return null;
}
// A day with no month: this month's, or the next/previous month's, by direction.
function pickMonth(today, d, direction) {
  let [y, m] = today.split('-').map(Number);
  for (let k = 0; k < 13; k += 1) {
    if (real(y, m, d)) {
      const c = iso(y, m, d);
      if (direction === 'past' ? c <= today : c >= today) return c;
    }
    if (direction === 'past') { m -= 1; if (m < 1) { m = 12; y -= 1; } } else { m += 1; if (m > 12) { m = 1; y += 1; } }
  }
  return null;
}

// F-44.46 AMENDED by the chair (c-44.28), ratifying this file's direction: PAST for a date money was
// RECEIVED (milestone_paid, advance_paid), FUTURE for everything else. A received date that can only be
// read as AFTER today ("tomorrow", "18 September 2027" said in 2026) is NOT resolved forward: it is
// unreadable, and the door says byte 7. Byte 1 then shows her the full date with its year before anything
// is written, the second net.
function resolveSpokenDate(spoken, opts) {
  const r = resolveRaw(spoken, opts);
  try {
    const past = !!opts && typeof opts === 'object' && opts.direction === 'past';
    if (r.ok && past) {
      const o = opts;
      const today = (typeof o.todayIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.todayIso)) ? o.todayIso : todayIstIso(o.nowMs);
      if (r.iso > today) return { ok: false, reason: 'unreadable' };
    }
    return r;
  } catch (_e) { return { ok: false, reason: 'unreadable' }; }
}

function resolveRaw(spoken, opts) {
  try {
    const o = (opts && typeof opts === 'object') ? opts : {};
    const direction = o.direction === 'past' ? 'past' : 'future';
    const today = (typeof o.todayIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.todayIso)) ? o.todayIso : todayIstIso(o.nowMs);
    if (spoken === undefined || spoken === null) return { ok: false, reason: 'none' };
    if (typeof spoken !== 'string') return { ok: false, reason: 'unreadable' };
    const s = spoken.toLowerCase().replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^(on|by|of)\s+/, '').replace(/^the\s+/, '');
    if (!s) return { ok: false, reason: 'none' };
    // F-44.60 (P5-h1): words that place the day relative to now ARE dates, resolved here in IST.
    const PART = '(?: (?:morning|afternoon|evening|night))?';
    if (new RegExp(`^(?:today|aaj)${PART}$`).test(s) || /^(?:this (?:morning|afternoon|evening)|tonight)$/.test(s)) return { ok: true, iso: today };
    if (new RegExp(`^yesterday${PART}$`).test(s) || s === 'last night') return { ok: true, iso: addDays(today, -1) };
    if (s === 'day before yesterday' || s === 'the day before yesterday') return { ok: true, iso: addDays(today, -2) };
    if (new RegExp(`^tomorrow${PART}$`).test(s)) return { ok: true, iso: addDays(today, 1) };
    const WD = { sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };
    const wm = /^(last |this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)$/.exec(s);
    if (wm) {
      const target = WD[wm[2].slice(0, 3) === 'thu' ? 'thu' : wm[2].slice(0, 3)];
      const [y, mo, d0] = today.split('-').map(Number);
      const dow = new Date(Date.UTC(y, mo - 1, d0)).getUTCDay();
      const which = (wm[1] || '').trim();
      if (which === 'last' || (!which && direction === 'past') || (which === 'this' && direction === 'past')) {
        let back = (dow - target + 7) % 7;
        if (which === 'last' && back === 0) back = 7;
        return { ok: true, iso: addDays(today, -back) };
      }
      let fwd = (target - dow + 7) % 7;
      if (which === 'next' && fwd === 0) fwd = 7;
      return { ok: true, iso: addDays(today, fwd) };
    }
    let m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) {
      const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
      return real(y, mo, d) ? { ok: true, iso: iso(y, mo, d) } : { ok: false, reason: 'unreadable' };
    }
    // 18/9, 18/9/2026, 18-9-26 (Indian order: day first)
    if ((m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/.exec(s))) {
      const d = Number(m[1]); const mo = Number(m[2]);
      if (m[3]) { const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]); return real(y, mo, d) ? { ok: true, iso: iso(y, mo, d) } : { ok: false, reason: 'unreadable' }; }
      const c = pickYear(today, mo, d, direction);
      return c ? { ok: true, iso: c } : { ok: false, reason: 'unreadable' };
    }
    const DAY = '(\\d{1,2})(?:st|nd|rd|th)?';
    // 18 september [2026] · 18th of sept
    if ((m = new RegExp(`^${DAY}(?: of)? ([a-z.]+)(?: (\\d{4}))?$`).exec(s))) {
      const d = Number(m[1]); const mo = monthOf(m[2]);
      if (!mo) return { ok: false, reason: 'unreadable' };
      if (m[3]) { const y = Number(m[3]); return real(y, mo, d) ? { ok: true, iso: iso(y, mo, d) } : { ok: false, reason: 'unreadable' }; }
      const c = pickYear(today, mo, d, direction);
      return c ? { ok: true, iso: c } : { ok: false, reason: 'unreadable' };
    }
    // september 18 [2026]
    if ((m = new RegExp(`^([a-z.]+) ${DAY}(?: (\\d{4}))?$`).exec(s))) {
      const mo = monthOf(m[1]); const d = Number(m[2]);
      if (!mo) return { ok: false, reason: 'unreadable' };
      if (m[3]) { const y = Number(m[3]); return real(y, mo, d) ? { ok: true, iso: iso(y, mo, d) } : { ok: false, reason: 'unreadable' }; }
      const c = pickYear(today, mo, d, direction);
      return c ? { ok: true, iso: c } : { ok: false, reason: 'unreadable' };
    }
    // 19th · 19 (a day alone)
    if ((m = new RegExp(`^${DAY}$`).exec(s))) {
      const c = pickMonth(today, Number(m[1]), direction);
      return c ? { ok: true, iso: c } : { ok: false, reason: 'unreadable' };
    }
    return { ok: false, reason: 'unreadable' };
  } catch (_e) { return { ok: false, reason: 'unreadable' }; }
}

module.exports = { resolveSpokenDate, todayIstIso };
