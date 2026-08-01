// src/lib/signedSession.js
// THE ONE HOME for signed, self-describing session tokens (F-07.72, CE ruling
// §3(1) — "extract the HMAC machinery into ONE home … adminSession becomes its
// FIRST CALLER with behavior byte-identical (benched), the circle session its
// SECOND").
//
// ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
// F-07.82 cured two byte-identical `signSession` twins by giving admin session
// material one home (`src/lib/adminSession.js`). That file's own header states
// the law it was born from: "Two identical implementations is the second-
// implementation disease one plane down: this sitting does not cure a panel
// while planting the same geometry in its guard."
//
// F-07.72 needed a SECOND signed token — one for the circle/co-planner lane.
// Copying adminSession's mint into a circle file would have re-planted exactly
// the geometry that file exists to forbid, and the CE refused to accept that
// cost: it ruled it cured STRUCTURALLY. So the machinery moves here, generalised
// on ONE axis only — the token may now carry a SUBJECT — and adminSession keeps
// its name, its exports and its five call sites while delegating its body here.
//
// ONE IMPLEMENTATION, TWO CALLERS. The law is obeyed by construction, not by
// promise.
//
// ── THE SHAPE ────────────────────────────────────────────────────────────────
//     <subject₁>.<subject₂>….<nonce>.<expiry>.<mac>
//     mac = HMAC-SHA256(secret, "<subject₁>.<subject₂>….<nonce>.<expiry>")
//
// THE SUBJECT IS INSIDE THE SIGNATURE, NOT BESIDE IT. A token whose bound fields
// were appended after the mac would be a token whose subject anyone could edit;
// the payload that is signed IS the payload that is read back.
//
// ── WHY THE EMPTY SUBJECT MATTERS (the caller-#1 identity proof) ─────────────
// With `subject: []` the joined payload is exactly `nonce.expiry` and the token
// is exactly `nonce.expiry.mac` — CHARACTER-FOR-CHARACTER the shape F-07.82
// shipped, over a byte-identical HMAC input. That is not a resemblance argument:
// it is why `mintAdminSession`'s output and `verifyAdminSession`'s verdicts are
// unchanged by this extraction, and it is what `b07_f0772_circle_auth_bench.js`
// §2 proves by driving the retired inline implementation beside this one and
// asserting the verdicts agree on every input, including the malformed ones.
//
// ── WHAT IS NOT IN A TOKEN, EVER ─────────────────────────────────────────────
// No credential. No PIN, no password, no hash. A captured token decodes to a
// random nonce, a timestamp, and whichever non-secret identifiers its caller
// chose to bind. F-07.82's whole cure was that the password left the token; this
// file cannot re-admit it, because `mintSigned` takes no credential argument.
// A signature that cannot accept a secret cannot leak one.
//
// ── FAIL-CLOSED (F-07.77's law, carried forward unchanged) ───────────────────
// With no signing secret there is no honest answer, so the answer is no:
// `mintSigned` returns NULL (no caller may invent a token from nothing) and
// `verifySigned` returns NULL. Neither ever throws for a missing secret — the
// caller decides what a null means at its own door.
//
// ── EVICTION IS FREE, AND HERE IS WHY (stated, not assumed) ──────────────────
// There is no `expected` value to compare against: a token is checked against
// its OWN embedded payload. Any token minted under a different subject arity
// fails the FORMAT gate before the HMAC is computed. Adding a bound field to a
// caller therefore evicts that caller's live tokens as a consequence of the
// shape change, not as a step someone must remember to perform.
'use strict';

const crypto = require('crypto');

// Constant-time string compare that never leaks length via early return shape.
// MOVED here byte-identically from adminSession.js, which now imports it back so
// its five call sites keep the name they have always used.
function safeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// The two structural literals every token obeys, hoisted so the format gate and
// the mint cannot drift apart. A nonce is 16 random bytes as 32 lowercase hex.
const NONCE_RE  = /^[0-9a-f]{32}$/;
const EXPIRY_RE = /^[0-9]{1,20}$/;

// Bound fields may not contain the separator, and may not be empty — an empty
// field would let `a..b` and `a.b` disagree about arity while joining alike.
// UUIDs (every subject this estate binds today) contain no dots by construction.
function subjectFieldOk(v) {
  return typeof v === 'string' && v.length > 0 && v.indexOf('.') === -1;
}

// THE SIGNED PAYLOAD HAS ONE HOME. Both `mintSigned` and `verifySigned` build it
// here and neither builds it itself. Two copies of this expression would be a
// mint and a verify able to drift into disagreeing about what was signed — and
// the failure mode of that drift is not a loud one: every token would simply
// stop verifying, or worse, a field would fall outside the signature and become
// editable while the token still passed. `b07_f0772_circle_auth_bench.js` §9
// INVERSE 1 mutates THIS LINE, which is the only place a subject can be dropped
// out of the mac coherently — that is why it is a line and not two.
function payloadOf(subject, nonce, expiry) {
  return [...subject, nonce, String(expiry)].join('.');
}

// ── mintSigned ───────────────────────────────────────────────────────────────
// { secret, subject = [], ttlMs } -> token string, or NULL fail-closed.
// Returns null (never throws) when the secret is absent or any bound field is
// unusable, because a caller that cannot bind its subject must not ship a token
// that silently proves less than it claims.
function mintSigned({ secret, subject = [], ttlMs }) {
  if (!secret) return null;
  if (!Array.isArray(subject)) return null;
  if (!subject.every(subjectFieldOk)) return null;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return null;

  const nonce  = crypto.randomBytes(16).toString('hex');
  const expiry = Date.now() + ttlMs;

  // TWO EXPRESSIONS, DELIBERATELY, AND THEY MUST BE EQUAL.
  //   `body`    — what the CALLER carries and what `verifySigned` will split.
  //   `payload` — what the MAC covers.
  // In a correct token these are the same string, and bench cell §1.10 asserts
  // exactly that. They are written separately because the difference between
  // them IS the vulnerability class: a field that appears in `body` but not in
  // `payload` is a field anyone can edit while the signature still checks out.
  // Collapsing them into one expression would make that class unreachable by a
  // mutation and therefore unproven — §9 INVERSE 1 exists precisely to open the
  // gap and watch §1.2 catch it.
  const body    = [...subject, nonce, String(expiry)].join('.');
  const payload = payloadOf(subject, nonce, expiry);
  const mac     = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${body}.${mac}`;
}

// ── verifySigned ─────────────────────────────────────────────────────────────
// { token, secret, subjectCount = 0, subjectRe } -> { subject: string[] } | NULL
//
// NULL is the only failure answer. There is deliberately no distinction between
// "expired", "forged" and "malformed" in the return value: a door that could
// tell those apart would tell an attacker apart too, and no caller in this
// estate needs the difference. The caller's own 401 copy is where the human-
// readable answer lives.
//
// subjectRe, when given, is applied to EVERY bound field. It is a structural
// gate (is this shaped like a uuid), never an authorisation check — the mac is
// what proves the fields, and the mac is checked last and in constant time.
function verifySigned({ token, secret, subjectCount = 0, subjectRe }) {
  if (!secret) return null;
  if (typeof token !== 'string' || token.length === 0) return null;

  const parts = token.split('.');
  if (parts.length !== subjectCount + 3) return null;

  const subject = parts.slice(0, subjectCount);
  const nonce   = parts[subjectCount];
  const expiry  = parts[subjectCount + 1];
  const mac     = parts[subjectCount + 2];

  if (!subject.every(subjectFieldOk)) return null;
  if (subjectRe && !subject.every(v => subjectRe.test(v))) return null;
  if (!NONCE_RE.test(nonce))   return null;
  if (!EXPIRY_RE.test(expiry)) return null;
  if (Number(expiry) <= Date.now()) return null;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payloadOf(subject, nonce, expiry))
    .digest('base64url');

  return safeEquals(mac, expected) ? { subject } : null;
}

// Reads a bearer token out of an Authorization header. Returns null for every
// shape that is not exactly `Bearer <token>`. MOVED here byte-identically from
// adminSession.js so both callers read a header the same way.
function bearerFrom(req) {
  const raw = req && req.headers && req.headers['authorization'];
  if (typeof raw !== 'string') return null;
  const m = raw.match(/^Bearer\s+(\S+)$/);
  return m ? m[1] : null;
}

module.exports = {
  payloadOf,
  mintSigned,
  verifySigned,
  bearerFrom,
  safeEquals,
  NONCE_RE,
  EXPIRY_RE,
};
