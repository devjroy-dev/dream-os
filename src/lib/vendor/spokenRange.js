'use strict';
// src/lib/vendor/spokenRange.js  CE-45 ASK-1 cut 1 (R-45.33). HER WORDS FOR A STRETCH OF DAYS, RESOLVED IN CODE.
//
// F-44.38: no model does date arithmetic. The question agent (askAgent.js) passes a range AS SHE SAID IT ("October", "this
// weekend", "next month", "from 3 to 9 March", "the next 10 days"), or, for Hinglish, her words restated in English
// (the chair's F-I: never a computed date and never a digit she did not say). This file turns those words into two ISO days
// against today in IST, or refuses. It is PURE: no database, no clock but the one passed in, no require but spokenDate's
// single-day reader (the estate's ONE home for a day; this file never re-implements a day, it composes them).
//
// A MONTH WITH NO YEAR follows F-44.46's rule for a day with no year: its next occurrence on or after today ('future'), or its
// last on or before today ('past'). The current month is this month either way. A range's two ends are each resolved by
// resolveSpokenDate; an end with no month borrows the other end's ("3 to 9 March"). A range whose end is before its start
// is refused, never swapped. Returns { ok: true, from, to, days } or { ok: false, reason }.

const { resolveSpokenDate, todayIstIso } = require('./spokenDate');

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const SPOKEN_MAX = 200;

function iso(y, m, d) { return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function addDays(isoDay, n) {
  const [y, m, d] = isoDay.split('-').map(Number);
  const p = new Date(Date.UTC(y, m - 1, d + n));
  return iso(p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate());
}
function lastDay(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
function weekday(isoDay) { const [y, m, d] = isoDay.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); } // 0 Sunday
function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
function monthIndex(word) {
  const w = String(word || '').toLowerCase().replace(/\./g, '');
  if (w.length < 3) return 0;
  return MONTHS.findIndex((m) => m.startsWith(w)) + 1;
}
function monthRange(y, m) { return { from: iso(y, m, 1), to: iso(y, m, lastDay(y, m)) }; }
function out(from, to) {
  if (!from || !to || to < from) return { ok: false, reason: 'unreadable' };
  const y1 = Number(from.slice(0, 4)); const y2 = Number(to.slice(0, 4));
  if (y1 < 1900 || y2 > 2100) return { ok: false, reason: 'year' };
  return { ok: true, from, to, days: daysBetween(from, to) + 1 };
}

// A month named alone, with or without a year: "October", "oct 2027", "January 2028", "october '27" is refused (a bare
// apostrophe year is spokenDate's refusal too).
function monthAlone(s, today, direction) {
  const m = /^([a-z]{3,9})\.?(?:\s*,?\s*(\d{4}))?$/.exec(s);
  if (!m) return null;
  const mo = monthIndex(m[1]);
  if (!mo) return null;
  if (m[2]) return monthRange(Number(m[2]), mo);
  const [ty, tm] = today.split('-').map(Number);
  if (mo === tm) return monthRange(ty, mo);
  if (direction === 'past') return monthRange(mo < tm ? ty : ty - 1, mo);
  return monthRange(mo > tm ? ty : ty + 1, mo);
}

function relative(s, today) {
  const [ty, tm] = today.split('-').map(Number);
  const wd = weekday(today);
  if (/^(today)$/.test(s)) return { from: today, to: today };
  if (/^(this|the) month$/.test(s)) return monthRange(ty, tm);
  if (/^(next|coming|the coming) month$/.test(s)) return tm === 12 ? monthRange(ty + 1, 1) : monthRange(ty, tm + 1);
  if (/^(last|previous|the last) month$/.test(s)) return tm === 1 ? monthRange(ty - 1, 12) : monthRange(ty, tm - 1);
  if (/^(this|the) year$/.test(s)) return { from: iso(ty, 1, 1), to: iso(ty, 12, 31) };
  if (/^(next|coming) year$/.test(s)) return { from: iso(ty + 1, 1, 1), to: iso(ty + 1, 12, 31) };
  if (/^(last|previous) year$/.test(s)) return { from: iso(ty - 1, 1, 1), to: iso(ty - 1, 12, 31) };
  // THE WEEK: "this week" is today and the six days after it, the same seven days the door's week (dueWeek.js) has always meant.
  if (/^(this|the) week$/.test(s)) return { from: today, to: addDays(today, 6) };
  if (/^(next|coming|the coming) week$/.test(s)) { const mon = addDays(today, ((8 - wd) % 7) || 7); return { from: mon, to: addDays(mon, 6) }; }
  if (/^(last|previous) week$/.test(s)) { const mon = addDays(today, -(((wd + 6) % 7) + 7)); return { from: mon, to: addDays(mon, 6) }; }
  // THE WEEKEND: Saturday and Sunday. "This weekend" on a Saturday is today and tomorrow; on a Sunday, today alone.
  if (/^(this|the) weekend$/.test(s)) { if (wd === 0) return { from: today, to: today }; const sat = addDays(today, 6 - wd); return { from: sat, to: addDays(sat, 1) }; }
  if (/^(next|coming) weekend$/.test(s)) { const sat = addDays(today, wd === 6 ? 7 : wd === 0 ? 6 : 6 - wd + 7); return { from: sat, to: addDays(sat, 1) }; }
  let m = /^(?:the )?(?:next|coming|upcoming) (\d{1,3}) days?$/.exec(s);
  if (m) { const n = Number(m[1]); if (n < 1) return null; return { from: today, to: addDays(today, n - 1) }; }
  m = /^(?:the )?(?:last|past|previous) (\d{1,3}) days?$/.exec(s);
  if (m) { const n = Number(m[1]); if (n < 1) return null; return { from: addDays(today, -(n - 1)), to: today }; }
  return null;
}

function oneEnd(words, opts) {
  const r = resolveSpokenDate(words, opts);
  return r && r.ok && typeof r.iso === 'string' ? r.iso : null;
}

function resolveSpokenRange(spoken, opts) {
  try {
    const o = (opts && typeof opts === 'object') ? opts : {};
    const direction = o.direction === 'past' ? 'past' : 'future';
    const today = (typeof o.todayIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.todayIso)) ? o.todayIso : todayIstIso(o.nowMs);
    if (typeof spoken !== 'string' || !spoken.trim()) return { ok: false, reason: 'none' };
    if (spoken.length > SPOKEN_MAX) return { ok: false, reason: 'unreadable' };
    const s = spoken.toLowerCase().replace(/[?!]+$/g, '').replace(/\s+/g, ' ').trim().replace(/^(in|on|for|during|over|of) /, '');
    const rel = relative(s, today);
    if (rel) return out(rel.from, rel.to);
    const mon = monthAlone(s, today, direction);
    if (mon) return out(mon.from, mon.to);
    // A RANGE WITH TWO ENDS: "from X to Y", "X to Y", "between X and Y", "X till Y", "X until Y".
    const two = /^(?:from |between )?(.+?) (?:to|till|until|and|through|-) (.+)$/.exec(s);
    if (two) {
      let a = two[1].trim(); let b = two[2].trim();
      const bMonth = /([a-z]{3,9})(\s+\d{4})?$/.exec(b);
      if (/^\d{1,2}(st|nd|rd|th)?$/.test(a) && bMonth && monthIndex(bMonth[1])) a = `${a} ${bMonth[1]}${bMonth[2] || ''}`;
      const aMonth = /^(?:\d{1,2}(?:st|nd|rd|th)? )?([a-z]{3,9})/.exec(a);
      if (/^\d{1,2}(st|nd|rd|th)?$/.test(b) && aMonth && monthIndex(aMonth[1])) b = `${b} ${aMonth[1]}`;
      const from = oneEnd(a, { direction, nowMs: o.nowMs, todayIso: today });
      if (!from) return { ok: false, reason: 'unreadable' };
      const to = oneEnd(b, { direction: 'future', nowMs: o.nowMs, todayIso: from });
      if (!to) return { ok: false, reason: 'unreadable' };
      // "9 to 3 March" is an end before its start in ONE month, never "9 March to 3 March next year": refused, not rolled over.
      // A range across a year end ("20 December to 5 January") names two months and rolls as it should.
      if (from.slice(5, 7) === to.slice(5, 7) && from.slice(0, 4) !== to.slice(0, 4) && !/\d{4}/.test(b)) return { ok: false, reason: 'unreadable' };
      return out(from, to);
    }
    // A SINGLE DAY is a range of one.
    const one = oneEnd(s, { direction, nowMs: o.nowMs, todayIso: today });
    if (one) return out(one, one);
    return { ok: false, reason: 'unreadable' };
  } catch (_e) { return { ok: false, reason: 'unreadable' }; }
}

module.exports = { resolveSpokenRange, addDays, daysBetween };
