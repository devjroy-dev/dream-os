'use strict';
// src/lib/vendor/reviewerLogin.js · CE-46 · IGD-2 · G7 · THE REVIEWER ACCOUNT'S SIGN-IN, ONE HOME.
//
// Meta's App Review reviewer cannot receive a WhatsApp code on a real phone. This lets ONE vendor account, whose number the
// founder sets in REVIEWER_PHONE, sign in with a fixed six-digit code he sets in REVIEWER_OTP, and sends no message at all.
// It never touches any other phone. DEV_OTP's universal path is gone (CE-46 G6-4, F-44.245): this is the ONLY fixed code.
//
//   REVIEWER_PHONE unset, or a different phone   → null: today's path (a random code, a WhatsApp send).
//   REVIEWER_PHONE matches, REVIEWER_OTP unset
//     or not six digits                           → { refuse: true }: the caller refuses, writes no session, sends nothing.
//   both set and the phone matches               → { code }: the caller stores that code's hash as the session and sends
//                                                   nothing; verify-otp's own bcrypt comparison then checks it.
// Unsetting REVIEWER_PHONE in Railway ends the special path entirely. Every use is logged by the caller ("[reviewer] ...").
const SIX_DIGITS = /^[0-9]{6}$/;

function reviewerFor(phone, env = process.env) {
  const rp = typeof env.REVIEWER_PHONE === 'string' ? env.REVIEWER_PHONE.trim() : '';
  const p = typeof phone === 'string' ? phone.trim() : '';
  if (!rp || !p || p !== rp) return null;
  const code = typeof env.REVIEWER_OTP === 'string' ? env.REVIEWER_OTP.trim() : '';
  if (!SIX_DIGITS.test(code)) return { refuse: true };
  return { code };
}

module.exports = { reviewerFor };
