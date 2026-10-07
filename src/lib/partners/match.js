'use strict';
// src/lib/partners/match.js · CE-47 · PTN-A2-1 · does this call go to this partner? PURE: no database, no clock beyond `now`.
// A partner gets a call when ALL hold (the design note, accepted 6 Oct 2026):
//   1 not blocked; calls not stopped; not paused (send_state 'paused', or paused_until still ahead)
//   2 it wants calls (wants has 'calls')
//   3 city: one of its cities is the call's city (sameCity), or it chose 'All cities', or it chose no city yet
//   4 role: one of the call's roles is one of its roles, or it chose no role yet
//   5 pay: a 'paid_only' partner gets only calls marked 'paid'
//   6 not hidden by reports (three from different vendors on an unchecked partner, A1's rule)
// An empty list of cities or roles means "every": A1's sign-up asks for cities but not roles, and a partner that chose
// none should not be silently left out; the daily cap bounds what it gets.
const { sameCity } = require('../vendor/cityMatch');
function matches(org, call, { hidden = false, now = new Date() } = {}) {
  if (!org || !call) return { ok: false, why: 'missing' };
  if (org.check_state === 'blocked') return { ok: false, why: 'blocked' };
  if (org.send_state === 'stopped') return { ok: false, why: 'stopped' };
  if (hidden) return { ok: false, why: 'hidden_by_reports' };
  if (!(org.wants || []).includes('calls')) return { ok: false, why: 'no_calls_wanted' };
  const cities = org.cities || [];
  if (cities.length && !cities.includes('All cities') && !cities.some((c) => sameCity(c, call.city))) return { ok: false, why: 'city' };
  const roles = org.roles || []; const want = (call.roles || []).map((r) => r.role);
  if (roles.length && !want.some((r) => roles.includes(r))) return { ok: false, why: 'role' };
  if (org.pay_rule === 'paid_only' && call.pay_kind !== 'paid') return { ok: false, why: 'pay' };
  const paused = org.send_state === 'paused' || (org.paused_until && new Date(org.paused_until) > now);
  return { ok: true, paused };
}
module.exports = { matches };
