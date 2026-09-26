'use strict';
// src/lib/instagram/igInbound.js · CE-45 · IGD-1 · CUT 2a-i · THE INSTAGRAM DOOR'S RECEIVING HALF (read-first F1, F2, F7; E3).
// Meta sends an Instagram DM to /webhook/instagram on THIS service (F1: its own callback, set in the Instagram Login use case's
// "Configure webhooks"; the shared receiver never learns Instagram). This file:
//   verifyIgSignature  checks X-Hub-Signature-256 against IG_APP_SECRET, then META_APP_SECRET, and says WHICH matched (E3: Meta's
//                      page does not name the secret; the dark walk's first DM settles it and the next cut keeps only that one).
//   parseIgMessages    reads object "instagram", entry[].messaging[] (F-44.161's shape, confirmed on Meta's page 25 Sept 2026):
//                      the account the DM reached, the sender's Instagram-scoped id, the message id (mid), the text, and whether it
//                      is an ECHO (the vendor writing from her own Instagram app). Any other shape yields nothing; it never throws.
//   laneOpen           the lane is open for a vendor only when Meta has granted (perm.instagram_business_manage_messages ON) OR she
//                      is named in IG_DM_WALK_VENDOR_IDS (F7: the pre-grant dark walk, DEV440 only; removed at the grant).
//   recordInbound      finds her by the account id, finds or makes ONE Instagram couple_thread per sender (0173's partial UNIQUE),
//                      and writes the message row: channel 'instagram', sent_by 'couple' (or 'vendor' for an echo), the mid in
//                      message_sid (its UNIQUE index drops Meta's retries, which run for 36 hours).
// NOT IN THIS CUT: the reply. Eliza's turn is wired in cut 2b (the counterparty parameter); the Send API, the 24-hour window and
// the 1000-byte split are cut 2a-ii. Until then a DM is received and recorded, never answered. The one clock read stamps the
// thread's last_message_at, as the WhatsApp couple lane does (vendorInbound.js :190).
const metaInbound = require('../metaInbound');
const webhookCore = require('../webhookCore');
const cap = require('../capabilities');
const igConnection = require('../vendor/igConnection');

const GATE = 'perm.instagram_business_manage_messages';
const s = (v, max = 200) => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null);

function verifyIgSignature(rawBody, header, env) {
  for (const name of ['IG_APP_SECRET', 'META_APP_SECRET']) {
    const secret = env && env[name];
    if (secret && metaInbound.verifyMetaSignature(rawBody, header, secret)) return { ok: true, which: name };
  }
  return { ok: false, which: null };
}

function parseIgMessages(body) {
  const out = [];
  if (!body || typeof body !== 'object' || body.object !== 'instagram' || !Array.isArray(body.entry)) return out;
  for (const entry of body.entry) {
    if (!entry || typeof entry !== 'object' || !Array.isArray(entry.messaging)) continue;
    for (const m of entry.messaging) {
      if (!m || typeof m !== 'object' || !m.message || typeof m.message !== 'object') continue;
      const echo = m.message.is_echo === true;
      const sender = s(m.sender && m.sender.id, 64);
      const recipient = s(m.recipient && m.recipient.id, 64);
      const mid = s(m.message.mid, 512);
      if (!sender || !recipient || !mid) continue;
      const text = typeof m.message.text === 'string' ? m.message.text.slice(0, 4000) : '';
      out.push({
        accountId: echo ? sender : recipient,      // the vendor's professional account
        igsid: echo ? recipient : sender,          // the couple
        mid, text, echo,
      });
    }
  }
  return out;
}

function laneOpen(vendorId, env) {
  if (cap.on(GATE)) return true;
  const allow = String((env && env.IG_DM_WALK_VENDOR_IDS) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return allow.includes(String(vendorId));
}

async function findOrMakeThread(supabase, vendorId, igsid) {
  const sel = () => supabase.from('conversations').select('id')
    .eq('vendor_id', vendorId).eq('kind', 'couple_thread').eq('counterparty_ig_id', igsid).maybeSingle();
  const first = await sel();
  if (first.error) return { ok: false, why: 'thread_read' };
  if (first.data) return { ok: true, id: first.data.id, made: false };
  const ins = await supabase.from('conversations')
    .insert({ vendor_id: vendorId, kind: 'couple_thread', channel: 'instagram', counterparty_ig_id: igsid })
    .select('id').maybeSingle();
  if (ins.data) return { ok: true, id: ins.data.id, made: true };
  const again = await sel();                   // a concurrent retry made it first (0173's UNIQUE)
  if (again.data) return { ok: true, id: again.data.id, made: false };
  return { ok: false, why: 'thread_write' };
}

async function recordInbound(supabase, msg, env) {
  const who = await igConnection.findByIgUserId(supabase, msg.accountId);
  if (!who || !who.ok) return { ok: false, why: 'unknown_account' };
  if (!laneOpen(who.vendorId, env)) return { ok: false, why: 'lane_closed' };
  const t = await findOrMakeThread(supabase, who.vendorId, msg.igsid);
  if (!t.ok) return { ok: false, why: t.why };
  const row = webhookCore.inboundRow({
    conversation_id: t.id, direction: msg.echo ? 'outbound' : 'inbound', channel: 'instagram',
    body: msg.text, sent_by: msg.echo ? 'vendor' : 'couple',
  }, msg.mid);
  const w = await supabase.from('messages').insert(row);
  if (w.error) return /duplicate|unique/i.test(String(w.error.message)) ? { ok: true, dup: true, conversationId: t.id } : { ok: false, why: 'message_write' };
  await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', t.id);
  return { ok: true, conversationId: t.id, vendorId: who.vendorId, echo: msg.echo, made: t.made };
}

module.exports = { GATE, verifyIgSignature, parseIgMessages, laneOpen, findOrMakeThread, recordInbound };
