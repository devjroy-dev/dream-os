'use strict';
// src/lib/instagram/igMeta.js · CE-45 · IGD-1 · CUT 2a-ii · the two calls to Meta the room needs beside the Send API (igSend.js),
// on the same pinned version. Read on Meta's pages on 25 and 26 September 2026:
//   probeMessagesScope  GET /me/conversations?platform=instagram&limit=1 needs instagram_business_manage_messages (Conversations
//                       API page). 200 with a data array means the token carries it; any refusal means it does not.
//   setSubscribed       POST /me/subscribed_apps?subscribed_fields=messages enables her account's webhooks; DELETE /me/subscribed_apps
//                       removes them (webhooks page, Step 3: each account is enabled with ITS OWN token).
// fetch is injected; no token is logged or returned.
const { SEND_BASE } = require('./igSend');

async function probeMessagesScope({ fetchImpl, token }) {
  if (!token) return { granted: false, why: 'no_token' };
  try {
    const r = await fetchImpl(`${SEND_BASE}/me/conversations?platform=instagram&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    let body = null; try { body = await r.json(); } catch (_e) { body = null; }
    return { granted: r.ok && !!body && Array.isArray(body.data), status: r.status };
  } catch (_e) { return { granted: false, why: 'network' }; }
}

async function setSubscribed({ fetchImpl, token, on }) {
  if (!token) return { ok: false, why: 'no_token' };
  const url = on ? `${SEND_BASE}/me/subscribed_apps?subscribed_fields=messages` : `${SEND_BASE}/me/subscribed_apps`;
  try {
    const r = await fetchImpl(url, { method: on ? 'POST' : 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    let body = null; try { body = await r.json(); } catch (_e) { body = null; }
    return { ok: r.ok && !!body && body.success === true, status: r.status };
  } catch (_e) { return { ok: false, why: 'network' }; }
}

module.exports = { probeMessagesScope, setSubscribed };
