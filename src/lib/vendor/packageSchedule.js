'use strict';
// src/lib/vendor/packageSchedule.js
//
// TDW · CE-43 · LC-2 · packet 2 · THE PACKAGE'S MONEY AND DATES, ONE HOME.
//
// Every rupee and every date a package shows is computed here and nowhere else. The PWA
// renders what the server returns and never computes money. Pure functions: no clock
// read (the caller passes `today`, an IST YYYY-MM-DD from src/lib/istDay.js istTodayStr),
// no database.
//
// RULINGS CARRIED (CE-43, 2026-09-17)
//   C-43.2  whole rupees; deposit and middle rounded, the remainder computed.
//   F20     round half up (Math.floor((total × pct + 50) / 100)); the remainder absorbs.
//   C-43.3  the middle payment is due one CALENDAR month before the wedding date; if that day
//           is today or earlier (IST), it folds into the final payment (tell `middle_folded`).
//   C-43.4  the middle payment is optional per package (`middle_enabled`).
//   F10     a `days` delivery counts from the wedding date (tell `counted_from_wedding`).
//   F19     the deposit row on a quote carries the attach day (today, IST); the promotion
//           (packet 3) re-dates it to advance_received_on.
//   F21     the room shows shares until a fee is set, rupees after; dates only on a lead.
//   F24     only a `day`-precision wedding date schedules; `month` or `year` reads as no date
//           (`no_wedding_date`); null precision on a dated legacy row reads as `day`.
//   F25     a `handover` package needs `delivery_on` (`no_handover_date`).
//   F26     each row carries its own share; the PWA puts it into the vetoed label.
//
// ROW SHAPE  { kind: 'deposit' | 'middle' | 'final', pct, amount, due_on }
// Words live in the PWA copy home; this module returns kinds, numbers and dates only.

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateKey(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Round half up on whole rupees. total and pct are integers, so total × pct is exact.
function share(total, pct) {
  return Math.floor((total * pct + 50) / 100);
}

// One calendar month before `key`, the day clamped to the shorter month
// (31 March → 28 or 29 February).
function monthBefore(key) {
  const [y, m, d] = key.split('-').map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  const dd = Math.min(d, last);
  return `${py}-${String(pm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function addDays(key, n) {
  return new Date(new Date(`${key}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

// The shares a package's shape implies, with no dates. The room's bar (F21).
function splitShares({ total, deposit_pct, middle_pct, middle_enabled }) {
  const withMiddle = !!middle_enabled;
  const finalPct = 100 - deposit_pct - (withMiddle ? middle_pct : 0);
  const priced = Number.isInteger(total) && total > 0;
  const rows = [{ kind: 'deposit', pct: deposit_pct, amount: priced ? share(total, deposit_pct) : null }];
  if (withMiddle) rows.push({ kind: 'middle', pct: middle_pct, amount: priced ? share(total, middle_pct) : null });
  rows.push({ kind: 'final', pct: finalPct, amount: null });
  if (priced) rows[rows.length - 1].amount = total - rows.slice(0, -1).reduce((s, r) => s + r.amount, 0);
  return rows;
}

// A lead's schedule (A5), computed at attach and on every re-attach.
// Returns { ok: true, rows, delivery_on, tells } or { ok: false, code }.
function computeSchedule({
  total, deposit_pct, middle_pct, middle_enabled,
  wedding_date, wedding_date_precision,
  delivery_basis, delivery_days, delivery_on, today,
}) {
  if (!Number.isInteger(total) || total <= 0) return { ok: false, code: 'no_fee' };
  const precision = wedding_date_precision == null ? 'day' : wedding_date_precision;
  if (!isDateKey(wedding_date) || precision !== 'day') return { ok: false, code: 'no_wedding_date' };
  if (!isDateKey(today)) return { ok: false, code: 'no_today' };

  let deliveryOn;
  const tells = [];
  if (delivery_basis === 'on_the_day') deliveryOn = wedding_date;
  else if (delivery_basis === 'days') {
    if (!Number.isInteger(delivery_days) || delivery_days < 1) return { ok: false, code: 'bad_package' };
    deliveryOn = addDays(wedding_date, delivery_days);
    tells.push('counted_from_wedding');
  } else if (delivery_basis === 'handover') {
    if (!isDateKey(delivery_on)) return { ok: false, code: 'no_handover_date' };
    deliveryOn = delivery_on;
  } else return { ok: false, code: 'bad_package' };

  let withMiddle = !!middle_enabled;
  let middleDue = null;
  if (withMiddle) {
    middleDue = monthBefore(wedding_date);
    if (middleDue <= today) { withMiddle = false; tells.push('middle_folded'); }
  }

  const rows = [{ kind: 'deposit', pct: deposit_pct, amount: share(total, deposit_pct), due_on: today }];
  if (withMiddle) rows.push({ kind: 'middle', pct: middle_pct, amount: share(total, middle_pct), due_on: middleDue });
  const paid = rows.reduce((s, r) => s + r.amount, 0);
  const paidPct = rows.reduce((s, r) => s + r.pct, 0);
  rows.push({ kind: 'final', pct: 100 - paidPct, amount: total - paid, due_on: deliveryOn });
  return { ok: true, rows, delivery_on: deliveryOn, tells };
}

module.exports = { computeSchedule, splitShares, share, monthBefore, addDays, isDateKey };
