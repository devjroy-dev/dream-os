// src/lib/site/limiter.js · TDW · CE-47 · WEB-4 cut 5 (the package after cut 4) · ONE IN-MEMORY TRY LIMITER FOR THE SITE'S
// PUBLIC DOORS (siteVisit.js, testimonial.js). The chair's item a: the maps were never pruned, one key per address for
// the process's life. Now: every entry carries its own expiry; expired entries are swept on a timer-free schedule (every
// SWEEP_EVERY calls, and whenever the map reaches its cap), and the map never holds more than `cap` keys: past the cap,
// the oldest keys go first (a Map keeps insertion order). Keys are hashes chosen by the caller, never raw addresses.
// A restart resets every count (in memory per process); each door's own database guard still bounds what matters.
'use strict';

const SWEEP_EVERY = 500;

/**
 * makeLimiter({ cap }) → { hit(key, max, windowMs), size(), sweep(now) }.
 * hit counts one try against `key` and answers whether it is within `max` for the window. A window of 0 is a lifetime,
 * held for `lifetimeMs` (default 31 days, one day past the longest link) and then forgotten.
 */
function makeLimiter(opts) {
  const o = opts || {};
  const cap = Number.isInteger(o.cap) && o.cap > 0 ? o.cap : 5000;
  const lifetimeMs = Number.isFinite(o.lifetimeMs) && o.lifetimeMs > 0 ? o.lifetimeMs : 31 * 86400000;
  const map = new Map();
  let calls = 0;
  function sweep(now) {
    const t = Number.isFinite(now) ? now : Date.now();
    for (const [k, b] of map) if (b.until <= t) map.delete(k);
    while (map.size > cap) map.delete(map.keys().next().value);   // oldest first
  }
  function hit(key, max, windowMs) {
    const t = Date.now();
    calls += 1;
    if (calls % SWEEP_EVERY === 0 || map.size >= cap) sweep(t);
    const b = map.get(key);
    if (!b || b.until <= t) {
      if (b) map.delete(key);
      map.set(key, { n: 1, until: t + (windowMs > 0 ? windowMs : lifetimeMs) });
      if (map.size > cap) sweep(t);
      return 1 <= max;
    }
    b.n += 1;
    return b.n <= max;
  }
  return { hit, sweep, size: () => map.size, _map: map, cap };
}

module.exports = { makeLimiter, SWEEP_EVERY };
