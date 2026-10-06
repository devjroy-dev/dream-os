'use strict';
// src/lib/partners/partnerSession.js · CE-47 · PTN-A1 · the partner lane's session: CALLER #3 of src/lib/signedSession.js
// (the circle lane is caller #2). Its own secret, PARTNER_SESSION_SECRET, so a circle or vendor credential can never
// pass as a partner's, in either direction. ONE subject: the users.id. Membership and blocking are re-read at the door on
// every request (requirePartner), so the token is convenience, not authority. Fail-closed: no secret, no token.
const { mintSigned, verifySigned, bearerFrom } = require('../signedSession');

const PARTNER_TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days; re-minted on every sign-in
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const secret = (env = process.env) => env.PARTNER_SESSION_SECRET;

function mintPartnerSession({ userId }, env = process.env) {
  if (!UUID_RE.test(String(userId || ''))) return null;
  return mintSigned({ secret: secret(env), subject: [String(userId)], ttlMs: PARTNER_TTL_MS });
}
function verifyPartnerSession(token, env = process.env) {
  const ok = verifySigned({ token, secret: secret(env), subjectCount: 1, subjectRe: UUID_RE });
  return ok ? { user_id: ok.subject[0] } : null;
}
const partnerTokenFrom = (req) => bearerFrom(req);

module.exports = { mintPartnerSession, verifyPartnerSession, partnerTokenFrom, PARTNER_TTL_MS };
