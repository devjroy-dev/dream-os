'use strict';
// src/lib/partners/email.js · CE-47 · PTN-A2-1 · email through Resend (the founder's choice, ruled 6 Oct 2026), by fetch:
// no new package. Nothing in the estate used Resend before this file. WITHOUT RESEND_API_KEY NOTHING IS SENT and the
// caller records why (W.noKey); this file never invents a send. From: collabs@thedreamwedding.in (or PARTNER_MAIL_FROM).
const FROM = 'The Dream Wedding <collabs@thedreamwedding.in>';
async function sendEmail({ to, subject, text, headers = {} }, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const key = env.RESEND_API_KEY;
  if (!key) return { ok: false, noKey: true, error: 'no key' };
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, error: 'bad address' };
  try {
    const r = await fetchImpl('https://api.resend.com/emails', { method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.PARTNER_MAIL_FROM || FROM, to: [to], subject, text, headers }) });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: `resend ${r.status}: ${String((b && (b.message || b.name)) || 'refused').slice(0, 200)}` };
    return { ok: true, id: b && b.id ? String(b.id) : null };
  } catch (e) { return { ok: false, error: `resend unreachable: ${String(e && e.message).slice(0, 200)}` }; }
}
module.exports = { sendEmail, FROM };
