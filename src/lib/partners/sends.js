'use strict';
// src/lib/partners/sends.js · CE-47 · PTN-A2-1 · CALLS TO PARTNERS.
// register()  : at boot (src/index.js), listens on CLB-2a's onPostCreated. Each new call is ENQUEUED for every matching
//               partner (match.js) and nothing is sent in the vendor's request. A vendor the Hub is closed to (CLB's
//               gate.js hubOpen; the chair, 7 Oct 2026) has NO rows made at all: nobody outside is contacted for her.
// drain()     : every five minutes from src/cron.js ('2-59/5 * * * *', Asia/Kolkata). For each due row, in this order:
//               call closed or past -> closed; partner blocked or stopped -> closed; paused -> held_paused;
//               outside 9 am to 8 pm IST -> held_window till 9 am; the partner's daily cap reached -> held_cap till
//               9 am; no calls email -> closed; NO RESEND_API_KEY -> held_no_key (nothing sent, the row says why, and it
//               goes out by itself once the key is set and the call is still open); else the email, and 'sent'.
//               A failed send is tried again in 15 minutes, three times, then 'failed' with its reason.
// Connections are NOT made here (a call sent is not contact exchanged); A2-1 never charges.
const crypto = require('crypto');
const { matches } = require('./match');
const { hiddenByReports } = require('./reports');
const { sendEmail } = require('./email');
const calls = require('./calls');
const { W } = require('./words');
const seams = require('./seams');
const wa = require('./wa');   // A2-3: the WhatsApp lane (the marketing line)
const { hubOpen } = require('../hub/gate');   // CLB's Rule 1, one home (HUB-2b): a closed vendor's call is never sent

const DUE = ['queued', 'held_cap', 'held_window', 'held_paused', 'held_no_key'];
const LATE_MS = 72 * 3600e3;
// A row an admin tried again is not a first send (0219: a 'retried' line). One bounded read, only for a row past 72 hours.
async function everRetried(sb, id) {
  try { const { data } = await sb.from('partner_send_log').select('id').eq('send_id', id).eq('kind', 'retried').limit(1); return !!(data && data.length); }
  catch (_e) { return false; }
}
const IST_MS = 5.5 * 3600e3;
const istHour = (now) => new Date(now.getTime() + IST_MS).getUTCHours();
function next9amIST(now) { const d = new Date(now.getTime() + IST_MS); if (d.getUTCHours() >= 9) d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(9, 0, 0, 0); return new Date(d.getTime() - IST_MS); }
const istDayStart = (now) => { const d = new Date(now.getTime() + IST_MS); d.setUTCHours(0, 0, 0, 0); return new Date(d.getTime() - IST_MS); };

async function enqueue(sb, info, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  if (!info || !info.post_id || !info.vendor_id) return { made: 0, why: 'missing' };
  if (!(await hubOpen(sb, info.vendor_id))) return { made: 0, why: 'hub_closed' };
  const { data: orgs } = await sb.from('partner_orgs').select('id, wants, cities, roles, pay_rule, send_state, paused_until, check_state, calls_email, whatsapp_opt, whatsapp_phone, whatsapp_opt_at').neq('check_state', 'blocked');
  const ids = (orgs || []).map((o) => o.id);
  const { data: reps } = ids.length ? await sb.from('partner_reports').select('partner_id, vendor_id, handled_at').in('partner_id', ids) : { data: [] };
  const call = { city: info.city, roles: info.roles || [], pay_kind: info.pay_kind || null };
  const notBefore = info.first_look_until && new Date(info.first_look_until) > now ? new Date(info.first_look_until) : now;
  let made = 0;
  for (const o of orgs || []) {
    const lane = wa.laneFor(o);   // A2-3: one lane per call, never both: WhatsApp for a partner that said yes, else email
    if (!lane) continue;
    if (!matches(o, call, { hidden: hiddenByReports(o, reps || []), now }).ok) continue;
    const id = crypto.randomUUID(); const token = calls.tokenFor(id, deps.env);
    if (!token) return { made, why: 'no_secret' };
    const { error } = await sb.from('partner_sends').insert({ id, partner_id: o.id, post_id: info.post_id, channel: lane, state: 'queued',
      not_before: notBefore.toISOString(), token_hash: calls.tokenHash(token) });
    if (!error) made += 1;   // the UNIQUE (partner, post, channel) row refuses a second send of one call
  }
  return { made };
}

function callEmail({ org, shape, token }) {
  const subject = `Collab call: ${shape.needs} in ${shape.city}, ${shape.date_words}, ${shape.pay_words.split(',')[0]}`;
  const lines = [
    `Hello ${org.name},`, '',
    `${shape.vendor.name}, a ${shape.vendor.trade} on The Dream Wedding, has posted a collab call.`, '',
    `The vendor needs ${shape.needs}.`,
    `The shoot is in ${shape.city} on ${shape.date_words}.`,
    `The vendor offers this pay: ${shape.pay_words}.`,
    ...(shape.note ? [`The vendor wrote this note: ${shape.note}`] : []),
    ...(shape.vendor.instagram_url ? [`You can see the vendor's Instagram here: ${shape.vendor.instagram_url}`] : []), '',
    'To suggest someone for this call, open this link:', calls.callUrl(token), '',
    'For each person, write their name and a link to their profile.',
    `The vendor will see them on the call as suggested by ${org.name}.`,
    `If the vendor chooses someone, the vendor contacts ${org.name}, not the person.`, '',
    `You are getting this email because ${org.name} asked The Dream Wedding to send it collab calls.`,
    `To stop these emails, open this link: ${calls.stopUrl(token)}`,
    `To pause these emails for one week, open this link: ${calls.pauseUrl(token)}`, '',
    'The Dream Wedding',
  ];
  return { subject, text: lines.join('\n'), headers: { 'List-Unsubscribe': `<${calls.stopUrl(token)}>` } };
}

async function drain(sb, deps = {}) {
  const now = deps.now ? deps.now() : new Date(); const env = deps.env || process.env;
  const { data: rows } = await sb.from('partner_sends').select('id, partner_id, post_id, channel, state, why, not_before, attempts, created_at')
    .in('state', DUE).lte('not_before', now.toISOString()).order('not_before', { ascending: true }).limit(200);
  const out = { sent: 0, held: 0, closed: 0, failed: 0 };
  const sentToday = new Map();
  // A2-1c: every change of state or reason is also one line in partner_send_log (0219). The line never blocks a send:
  // a failed write is logged and the drain goes on. An unchanged row writes no line (a row held every pass stays one line).
  const set = async (r, patch) => {
    const was = { state: r.state, why: r.why || null, attempts: r.attempts || 0 };   // read before the update, whatever the client hands back
    await sb.from('partner_sends').update({ ...patch, updated_at: now.toISOString() }).eq('id', r.id);
    const state = patch.state || was.state; const why = patch.why === undefined ? was.why : (patch.why || null);
    if (state === was.state && why === was.why) return;
    try {
      const { error } = await sb.from('partner_send_log').insert({ send_id: r.id, kind: 'drain', state, channel: r.channel || 'email',
        attempts: patch.attempts === undefined ? was.attempts : patch.attempts, why: why == null ? null : String(why).slice(0, 300), at: now.toISOString() });
      if (error) console.warn('[partners] send log:', error.message || error);
    } catch (e) { console.warn('[partners] send log:', e && e.message); }
  };
  let ready = null;   // A2-3: whether the WhatsApp lane is open, read once a pass
  for (const r of rows || []) {
    if (r.channel !== 'email' && r.channel !== 'whatsapp') continue;
    const c = await calls.loadCall(sb, r.post_id);
    if (!c || !calls.isOpen(c.post, now)) { await set(r, { state: 'closed', why: W.callClosed }); out.closed += 1; continue; }
    const { data: org } = await sb.from('partner_orgs').select('id, name, check_state, send_state, paused_until, calls_email, daily_cap, whatsapp_opt, whatsapp_phone, whatsapp_opt_at').eq('id', r.partner_id).maybeSingle();
    if (!org || org.check_state === 'blocked') { await set(r, { state: 'closed', why: W.blocked }); out.closed += 1; continue; }
    if (org.send_state === 'stopped') { await set(r, { state: 'closed', why: W.stopped }); out.closed += 1; continue; }
    if (org.send_state === 'paused' || (org.paused_until && new Date(org.paused_until) > now)) {
      await set(r, { state: 'held_paused', why: W.paused, not_before: (org.paused_until && new Date(org.paused_until) > now ? new Date(org.paused_until) : new Date(now.getTime() + 3600e3)).toISOString() }); out.held += 1; continue; }
    const h = istHour(now);
    if (h < 9 || h >= 20) { await set(r, { state: 'held_window', why: W.window, not_before: next9amIST(now).toISOString() }); out.held += 1; continue; }
    if (!sentToday.has(org.id)) {
      const { count } = await sb.from('partner_sends').select('id', { count: 'exact', head: true }).eq('partner_id', org.id).eq('state', 'sent').gte('sent_at', istDayStart(now).toISOString());
      sentToday.set(org.id, count || 0);
    }
    if (sentToday.get(org.id) >= (org.daily_cap || 10)) { await set(r, { state: 'held_cap', why: W.cap, not_before: next9amIST(now).toISOString() }); out.held += 1; continue; }
    // A2-3 · THE LANE. A WhatsApp row goes by WhatsApp only while the partner's yes stands and the lane is open (the
    // registry and the switchboard row both say approved); otherwise it moves to email with its own log line, or closes
    // when the partner has no email for calls. Never both lanes for one call.
    if (r.channel === 'whatsapp') {
      if (ready === null) { try { ready = await (deps.waReady || wa.waReady)(sb); } catch (_e) { ready = false; } }
      if (!(ready && wa.saidYes(org))) {
        if (!org.calls_email) { await set(r, { state: 'closed', why: W.noLane }); out.closed += 1; continue; }
        const { error: le } = await sb.from('partner_sends').update({ channel: 'email', updated_at: now.toISOString() }).eq('id', r.id);
        if (le) { console.warn('[partners] lane change:', le.message || le); continue; }
        try { await sb.from('partner_send_log').insert({ send_id: r.id, kind: 'lane_changed', state: r.state, channel: 'email', attempts: r.attempts || 0, why: W.toEmail, at: now.toISOString() }); }
        catch (e) { console.warn('[partners] send log:', e && e.message); }
        r.channel = 'email';
      }
    }
    if (r.channel === 'email' && !org.calls_email) { await set(r, { state: 'closed', why: W.noEmail }); out.closed += 1; continue; }
    // A2-3 · THE 72-HOUR CHECK (the chair, 8 Oct 2026): a row made more than 72 hours before it could first be sent is closed
    // and never sent. "Could first be sent" is this point: every gate above has passed, and for email the key is set. A row already tried (it has
    // tries, or an admin pressed Try again) is not a first send and is not closed by age.
    // For email, sending is possible only with the key; without it the row waits as before (email.js is the one writer of
    // held_no_key) and is not closed by age while it waits.
    const canSend = r.channel === 'whatsapp' || !!env.RESEND_API_KEY;
    if (canSend && !(r.attempts > 0) && r.created_at && now.getTime() - new Date(r.created_at).getTime() > LATE_MS && !(await everRetried(sb, r.id))) {
      await set(r, { state: 'closed', why: W.late }); out.closed += 1; continue;
    }
    const token = calls.tokenFor(r.id, env);
    let res;
    if (r.channel === 'whatsapp') {
      try { const w = await wa.sendCall(sb, { org, shape: calls.callShape(c, now), token }, deps);
        res = { ok: true, id: (w && w.result && (w.result.messages ? w.result.messages[0] && w.result.messages[0].id : w.result.id)) || null }; }
      catch (e) {
        if (e && e.code === 'opted_out') { await set(r, { state: 'closed', why: W.waStopped }); out.closed += 1; continue; }
        res = { ok: false, error: `wa ${(e && e.code) || 'error'}: ${String((e && e.message) || '').replace(/\+?\d[\d\s-]{8,}\d/g, '[number]')}`.slice(0, 300) };
      }
    } else {
      const mail = callEmail({ org, shape: calls.callShape(c, now), token });
      res = await (deps.sendEmail || sendEmail)({ to: org.calls_email, ...mail }, { env, fetchImpl: deps.fetchImpl });
      if (res.noKey) { await set(r, { state: 'held_no_key', why: W.noKey, not_before: new Date(now.getTime() + 15 * 60e3).toISOString() }); out.held += 1; continue; }
    }
    if (!res.ok) {
      const tries = (r.attempts || 0) + 1;
      await set(r, tries >= 3 ? { state: 'failed', why: res.error, attempts: tries } : { state: 'queued', why: res.error, attempts: tries, not_before: new Date(now.getTime() + 15 * 60e3).toISOString() });
      out.failed += 1; continue;
    }
    await set(r, { state: 'sent', why: null, provider_ref: res.id, sent_at: now.toISOString(), attempts: (r.attempts || 0) + 1 });
    sentToday.set(org.id, sentToday.get(org.id) + 1); out.sent += 1;
  }
  return out;
}

let _registered = false;
function register(getSupabase) {
  if (_registered) return; _registered = true;
  seams.onPostCreated(async (info) => { const sb = getSupabase(); if (sb) await enqueue(sb, info); });
}
module.exports = { enqueue, drain, register, callEmail, next9amIST, istHour, DUE };
