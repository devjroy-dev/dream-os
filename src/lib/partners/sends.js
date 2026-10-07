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
const { hubOpen } = require('../hub/gate');   // CLB's Rule 1, one home (HUB-2b): a closed vendor's call is never sent

const DUE = ['queued', 'held_cap', 'held_window', 'held_paused', 'held_no_key'];
const IST_MS = 5.5 * 3600e3;
const istHour = (now) => new Date(now.getTime() + IST_MS).getUTCHours();
function next9amIST(now) { const d = new Date(now.getTime() + IST_MS); if (d.getUTCHours() >= 9) d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(9, 0, 0, 0); return new Date(d.getTime() - IST_MS); }
const istDayStart = (now) => { const d = new Date(now.getTime() + IST_MS); d.setUTCHours(0, 0, 0, 0); return new Date(d.getTime() - IST_MS); };

async function enqueue(sb, info, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  if (!info || !info.post_id || !info.vendor_id) return { made: 0, why: 'missing' };
  if (!(await hubOpen(sb, info.vendor_id))) return { made: 0, why: 'hub_closed' };
  const { data: orgs } = await sb.from('partner_orgs').select('id, wants, cities, roles, pay_rule, send_state, paused_until, check_state, calls_email').neq('check_state', 'blocked');
  const ids = (orgs || []).map((o) => o.id);
  const { data: reps } = ids.length ? await sb.from('partner_reports').select('partner_id, vendor_id, handled_at').in('partner_id', ids) : { data: [] };
  const call = { city: info.city, roles: info.roles || [], pay_kind: info.pay_kind || null };
  const notBefore = info.first_look_until && new Date(info.first_look_until) > now ? new Date(info.first_look_until) : now;
  let made = 0;
  for (const o of orgs || []) {
    if (!o.calls_email) continue;
    if (!matches(o, call, { hidden: hiddenByReports(o, reps || []), now }).ok) continue;
    const id = crypto.randomUUID(); const token = calls.tokenFor(id, deps.env);
    if (!token) return { made, why: 'no_secret' };
    const { error } = await sb.from('partner_sends').insert({ id, partner_id: o.id, post_id: info.post_id, channel: 'email', state: 'queued',
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
    `Needs: ${shape.needs}`,
    `Where and when: ${shape.city}, ${shape.date_words}`,
    `Pay: ${shape.pay_words}`,
    ...(shape.note ? [`Note from the vendor: ${shape.note}`] : []),
    ...(shape.vendor.instagram_url ? [`Their Instagram: ${shape.vendor.instagram_url}`] : []), '',
    'To suggest someone, open this link:', calls.callUrl(token), '',
    `Name each person and add a profile link. They show on the call as suggested by ${org.name}.`,
    'The vendor contacts you, not your people.', '',
    `You get this because ${org.name} asked for collab calls on The Dream Wedding.`,
    `To stop these emails: ${calls.stopUrl(token)}`,
    `To pause them for a week: ${calls.pauseUrl(token)}`, '',
    'The Dream Wedding',
  ];
  return { subject, text: lines.join('\n'), headers: { 'List-Unsubscribe': `<${calls.stopUrl(token)}>` } };
}

async function drain(sb, deps = {}) {
  const now = deps.now ? deps.now() : new Date(); const env = deps.env || process.env;
  const { data: rows } = await sb.from('partner_sends').select('id, partner_id, post_id, channel, state, not_before, attempts')
    .in('state', DUE).lte('not_before', now.toISOString()).order('not_before', { ascending: true }).limit(200);
  const out = { sent: 0, held: 0, closed: 0, failed: 0 };
  const sentToday = new Map();
  const set = async (r, patch) => { await sb.from('partner_sends').update({ ...patch, updated_at: now.toISOString() }).eq('id', r.id); };
  for (const r of rows || []) {
    if (r.channel !== 'email') continue;   // the WhatsApp route is A2-2's
    const c = await calls.loadCall(sb, r.post_id);
    if (!c || !calls.isOpen(c.post, now)) { await set(r, { state: 'closed', why: W.callClosed }); out.closed += 1; continue; }
    const { data: org } = await sb.from('partner_orgs').select('id, name, check_state, send_state, paused_until, calls_email, daily_cap').eq('id', r.partner_id).maybeSingle();
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
    if (!org.calls_email) { await set(r, { state: 'closed', why: W.noEmail }); out.closed += 1; continue; }
    const token = calls.tokenFor(r.id, env);
    const mail = callEmail({ org, shape: calls.callShape(c, now), token });
    const res = await (deps.sendEmail || sendEmail)({ to: org.calls_email, ...mail }, { env, fetchImpl: deps.fetchImpl });
    if (res.noKey) { await set(r, { state: 'held_no_key', why: W.noKey, not_before: new Date(now.getTime() + 15 * 60e3).toISOString() }); out.held += 1; continue; }
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
