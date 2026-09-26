'use strict';
// src/lib/instagram/igSend.js · CE-45 · IGD-1 · CUT 2a-ii · THE REPLY TRANSPORT (read-first F5, F6, ruled).
// Meta's Send API, read 26 September 2026 at developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/
// messaging-api: POST https://graph.instagram.com/v26.0/<IG_ID>/messages (or /me/messages) with the vendor's Instagram User token,
// recipient {id: IGSID}, message {text}; text is UTF-8 and at most 1000 bytes; a reply is allowed within 24 hours of the person's
// last message. The page's samples read v26.0 on that day (and the dashboard's webhook fields read v26.0 on 25 September); the
// version lives here, in ONE constant.
//   withinWindow  true only when the couple's last message is less than 24 hours old (F5). Eliza never uses the HUMAN_AGENT tag:
//                 she is automated, and the tag is for a human agent's reply.
//   splitReply    a reply over 1000 UTF-8 bytes is cut at sentence ends into parts in order, never reworded (F6: a prose limit
//                 is not a mechanism). A sentence longer than 1000 bytes is cut at the last space, then hard at 1000 bytes.
//   sendText      one POST per part, in order, with fetch injected; it stops at the first refusal and says which part.
// No token is ever logged.
const GRAPH_VERSION = 'v26.0';
const SEND_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;
const MAX_BYTES = 1000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const bytes = (s) => Buffer.byteLength(s, 'utf8');

function withinWindow(lastInboundAtMs, nowMs) {
  if (!Number.isFinite(lastInboundAtMs) || !Number.isFinite(nowMs)) return false;
  const age = nowMs - lastInboundAtMs;
  return age >= 0 && age < WINDOW_MS;
}

function hardCut(s) {
  const out = []; let cur = '';
  for (const ch of s) { if (bytes(cur + ch) > MAX_BYTES) { out.push(cur); cur = ch; } else cur += ch; }
  if (cur) out.push(cur);
  return out;
}

function cutLong(sentence) {
  const out = []; let rest = sentence;
  while (bytes(rest) > MAX_BYTES) {
    let take = '';
    for (const ch of rest) { if (bytes(take + ch) > MAX_BYTES) break; take += ch; }
    const sp = take.lastIndexOf(' ');
    const piece = sp > 0 ? take.slice(0, sp) : take;
    if (sp > 0) { out.push(piece.trimEnd()); rest = rest.slice(sp + 1); } else { out.push(...hardCut(take)); rest = rest.slice(take.length); }
  }
  if (rest.trim()) out.push(rest.trim());
  return out;
}

function splitReply(text) {
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) return [];
  if (bytes(t) <= MAX_BYTES) return [t];
  const sentences = t.match(/[^.!?\n]+(?:[.!?]+|\n+|$)/g) || [t];
  const parts = []; let cur = '';
  for (const raw of sentences) {
    const s = raw.trim(); if (!s) continue;
    const pieces = bytes(s) > MAX_BYTES ? cutLong(s) : [s];
    for (const p of pieces) {
      const joined = cur ? `${cur} ${p}` : p;
      if (bytes(joined) <= MAX_BYTES) cur = joined; else { if (cur) parts.push(cur); cur = p; }
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

async function sendText({ fetchImpl, token, igId, igsid, text }) {
  const parts = splitReply(text);
  if (!parts.length) return { ok: false, why: 'empty' };
  if (!token || !igId || !igsid) return { ok: false, why: 'missing' };
  const sent = [];
  for (let i = 0; i < parts.length; i += 1) {
    let r;
    try {
      r = await fetchImpl(`${SEND_BASE}/${encodeURIComponent(igId)}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { id: igsid }, message: { text: parts[i] } }),
      });
    } catch (_e) { return { ok: false, why: 'network', part: i, sent }; }
    let body = null; try { body = await r.json(); } catch (_e) { body = null; }
    if (!r.ok || !body || typeof body.message_id !== 'string') return { ok: false, why: 'refused', status: r.status, part: i, sent };
    sent.push(body.message_id);
  }
  return { ok: true, sent, parts: parts.length };
}

module.exports = { GRAPH_VERSION, SEND_BASE, MAX_BYTES, WINDOW_MS, withinWindow, splitReply, sendText };
