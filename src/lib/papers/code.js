// src/lib/papers/code.js · CE-47 · PRO · P1 · check codes: TDW-XXXX-XXXX, no 0, O, 1, I or L (0209's CHECK).
const crypto = require('crypto');
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SHAPE = /^TDW-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;
function newCode() { const p = () => Array.from({ length: 4 }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join(''); return `TDW-${p()}-${p()}`; }
/** A typed code read leniently: case, spaces and a missing "TDW-" forgiven; anything else is not a code. */
function readCode(s) {
  const t = String(s || '').toUpperCase().replace(/\s+/g, '').replace(/^TDW-?/, '').replace(/-/g, '');
  if (t.length !== 8) return null; const c = `TDW-${t.slice(0, 4)}-${t.slice(4)}`; return SHAPE.test(c) ? c : null;
}
module.exports = { newCode, readCode, SHAPE, ALPHA };
