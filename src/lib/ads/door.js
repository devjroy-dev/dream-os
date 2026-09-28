'use strict';
// src/lib/ads/door.js · CE-46 · ADS-1 · cut 1 · THE GATE OF THE ADS SECTION. Pure: the switch row, the vendor, the env.
// flag.ads (0177, seeded 'off'): OFF for every vendor but DEV440 (the chair's confirmation of 28 September). The walk
// arms it by a witnessed SQL UPDATE (F-44.223: the switchboard flips only on|off), and 'armed' opens the door ONLY for
// the vendor named in ADS_WALK_VENDOR_ID, the own-number gate's shape (ownNumber/door.js openFor). 'on' opens it for
// every vendor and is the founder's hand after Advanced Access and App Review; this seat never writes it.
const MASTER = 'flag.ads';

function openFor({ row, vendorId, env = process.env }) {
  const walk = env.ADS_WALK_VENDOR_ID || '';
  const s = row ? row.status : null;
  if (s === 'on') return { open: true, reason: null };
  if (s === 'armed' && walk && vendorId === walk) return { open: true, reason: null };
  if (!row) return { open: false, reason: `${MASTER} has no row on the switchboard` };
  if (s === 'armed') return { open: false, reason: `${MASTER} is armed for the walk vendor only` };
  return { open: false, reason: `${MASTER} is ${s} on the switchboard` };
}

module.exports = { MASTER, openFor };
