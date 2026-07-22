// src/lib/phone.js
// TDW_04.5 · P4 rider F-04.109 — THE ONE HOME for phone normalisation.
//
// WHY THIS FILE EXISTS: `toE164` had grown to THREE byte-identical copies —
// src/api/circle/join.js:55, src/api/circle/verifyPin.js:22, and (added at the
// P4 seam) src/lib/vendor/roster.js:40. The seam executor reproduced it
// byte-identically rather than forking, and filed the hoist as an observation;
// CE-59 ratified it and named this path.
//
// The danger being closed is NOT duplication for its own sake. It is DIVERGENCE:
// M1b caught a `+E164` normalisation divergence pre-deploy, and a phone
// normaliser that disagrees with itself across planes silently splits one
// person into two rows — in `users`, in `circle_members`, and now in
// `vendor_roster`, whose whole dedup story (F9's phone-keyed predicate) rests on
// two callers agreeing on what a phone number IS.
//
// PLANE-NEUTRAL BY DESIGN: this lives at src/lib/, not src/lib/vendor/, because
// its importers straddle the circle/bride auth plane and the vendor plane. It
// reads no request, no database, and no environment.
//
// The function below is MOVED, not rewritten — byte-identical to all three
// copies it replaces.
'use strict';

// Coplanner sends a bare 10-digit number; users/circle_members store E.164.
function toE164(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10)   return `+${digits}`;
  return raw;
}

module.exports = { toE164 };
