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
// reason is 'none' (nothing was said: the door asks B6), 'unreadable' (the door says B7), or, since F-44.98,
// 'year' (read, but the year lies outside 1900 to 2100). The MONEY paths map every reason but 'none' to B7, as
// before; the LEAD path maps 'year' to B21.

const IST_MS = 5.5 * 60 * 60 * 1000;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function todayIstIso(nowMs) {
  const t = Number.isFinite(nowMs) ? nowMs : Date.now();
  return new Date(t + IST_MS).toISOString().slice(0, 10);
}

function pad(n) { return String(n).padStart(2, '0'); }
// F-44.98 (CE-44 LCV-7, P6a-1 r3): the YEAR is padded to four digits too. Before this, a year typed "0227" was
// parsed as 227 and left this file as "227-03-15", a malformed date that no reader could order or range-check.
function iso(y, m, d) { return `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`; }
// F-44.98: the resolved year must lie in 1900 to 2100, in EVERY direction. A day and month read cleanly with an
// absurd year is not "unreadable": it was read, and it is wrong, so it answers its OWN reason, 'year'.
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
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
    if (r.ok) {
      const ym = /^(\d{4})-\d{2}-\d{2}$/.exec(typeof r.iso === 'string' ? r.iso : '');
      if (!ym) return { ok: false, reason: 'unreadable' };
      const year = Number(ym[1]);
      if (year < YEAR_MIN || year > YEAR_MAX) return { ok: false, reason: 'year' };
    }
    const past = !!opts && typeof opts === 'object' && opts.direction === 'past';
    if (r.ok && past) {
      const o = opts;
      const today = (typeof o.todayIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.todayIso)) ? o.todayIso : todayIstIso(o.nowMs);
      if (r.iso > today) return { ok: false, reason: 'unreadable' };
    }
    return r;
  } catch (_e) { return { ok: false, reason: 'unreadable' }; }
}

// F-44.114 (CE-44 LCV-10; the chair's cure, widened on the founder's own question "what if its with a comma??"): STRAY PUNCTUATION
// AROUND A DATE DOES NOT COUNT. WITNESSED on his walk of 22 September: "Wedding on 5th March 27." was refused for its full stop. Before
// the forms are tried, any run of THESE marks, and the whitespace between them, is stripped from BOTH ENDS and from nowhere else. IT IS A
// CLOSED SET IN ONE CONSTANT, never a \W sweep, so nothing surprising is ever eaten: sentence punctuation . ! ? ; : , the dashes - – —,
// brackets of every kind ( ) [ ] { } < >, and straight and curly quotes " ' “ ” ‘ ’. NOTHING IS STRIPPED FROM INSIDE: the separators of
// "5/3/27", "5.3.27" and "5-3-27" and the apostrophe of "'27" are the date and stay. A WORD IS NOT PUNCTUATION ("5th march 27, evening"
// stays refused): dropping it would be guessing, and the door never guesses.
const STRAY_MARKS = '.!?;:,-\u2013\u2014()[]{}<>"\'\u201C\u201D\u2018\u2019';
const SPOKEN_MAX = 200; // nothing she can mean as a date is longer; it also bounds every pattern below on a hostile string
function unwrapSpoken(str) {
  let a = 0; let b = str.length;
  const stray = (ch) => STRAY_MARKS.includes(ch) || /\s/.test(ch);
  while (a < b && stray(str[a])) a += 1;
  while (b > a && stray(str[b - 1])) b -= 1;
  return str.slice(a, b);
}

function resolveRaw(spoken, opts) {
  try {
    const o = (opts && typeof opts === 'object') ? opts : {};
    // F-44.64 (CE-44 LCV-7, P6a-1): a direction is EXACTLY 'past' or 'future'. Absent, it is 'future' (F-44.46's
    // default, as this file's header has always said). Present and anything else, it is refused to byte 7: a typo
    // such as 'Past' or 'backward' must never quietly resolve forward. The line below it is left byte-identical.
    if (o.direction !== undefined && o.direction !== 'past' && o.direction !== 'future') return { ok: false, reason: 'unreadable' };
    const direction = o.direction === 'past' ? 'past' : 'future';
    const today = (typeof o.todayIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.todayIso)) ? o.todayIso : todayIstIso(o.nowMs);
    if (spoken === undefined || spoken === null) return { ok: false, reason: 'none' };
    if (typeof spoken !== 'string') return { ok: false, reason: 'unreadable' };
    if (spoken.length > SPOKEN_MAX) return { ok: false, reason: spoken.trim() ? 'unreadable' : 'none' };
    // A YEAR ALONE IS NO DATE: "'27" is an apostrophe-year with no day or month. Unwrapped it would be the bare "27", which reads as the 27th of
    // this month: a guess. It is refused before the unwrap. (A bare "27", or a quoted one, reads as the day it always did.)
    if (/^\s*['\u2019]\d{2}\s*$/.test(spoken)) return { ok: false, reason: 'unreadable' };
    // F-44.114: the ends are unwrapped first; then an APOSTROPHE before a closing two-digit year ("5 march'27", "5th Mar '27") reads as
    // that year under F-44.111's rule, with or without a space before it. The line below it is as it was.
    const s = unwrapSpoken(spoken.toLowerCase()).replace(/ ?['\u2019](\d{2})$/, ' $1').replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim()
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
    // F-44.111 (CE-44 LCV-10 Part B-1; the chair's cure): WITNESSED on the founder's walk of 21 September, "5th March 27" was
    // unreadable while "5/3/27" read 2027-03-05. A TWO-DIGIT year after a month name now reads AS THE SLASH FORM READS IT, the
    // same century rule (2000 plus the two digits), no new one; the 1900 to 2100 floor and every direction guard apply after it.
    const YEAR = (t) => (t.length === 2 ? 2000 + Number(t) : Number(t));
    // 18 september [2026] · 18th of sept
    if ((m = new RegExp(`^${DAY}(?: of)? ([a-z.]+)(?: (\\d{2}|\\d{4}))?$`).exec(s))) {
      const d = Number(m[1]); const mo = monthOf(m[2]);
      if (!mo) return { ok: false, reason: 'unreadable' };
      if (m[3]) { const y = YEAR(m[3]); return real(y, mo, d) ? { ok: true, iso: iso(y, mo, d) } : { ok: false, reason: 'unreadable' }; }
      const c = pickYear(today, mo, d, direction);
      return c ? { ok: true, iso: c } : { ok: false, reason: 'unreadable' };
    }
    // september 18 [2026]
    if ((m = new RegExp(`^([a-z.]+) ${DAY}(?: (\\d{2}|\\d{4}))?$`).exec(s))) {
      const mo = monthOf(m[1]); const d = Number(m[2]);
      if (!mo) return { ok: false, reason: 'unreadable' };
      if (m[3]) { const y = YEAR(m[3]); return real(y, mo, d) ? { ok: true, iso: iso(y, mo, d) } : { ok: false, reason: 'unreadable' }; }
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

module.exports = { resolveSpokenDate, todayIstIso, STRAY_MARKS, SPOKEN_MAX };
