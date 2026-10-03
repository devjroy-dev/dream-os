'use strict';
// src/api/vendor/todaySummary.js · TDW · CE-47 · WEB-4 cut 9 r2 · TODAY'S SLIM SUMMARY, ONE DOOR.
//   GET /api/v2/vendor/today-summary   (her session: requireAuth, resolveVendor())
//
// The vendor app's Today screen fetched the whole leads list, every invoice, the week's events, the today feed and the
// crew on each open. This door answers what Today draws, in one response (FE-8's six gaps folded in, as the chair ruled):
//   { ok, today: 'YYYY-MM-DD' (India; the feed's own date),
//     has_any (cut 10): the feed's own meaning, has this vendor EVER had anything (the title line's first-run test),
//     parts (cut 10): { counts, reply_to, week, money_due }, each true when every read it stands on succeeded; a failed
//       part comes back NULL (never 0 or []) so the app can say "could not load", never "nothing",
//     counts: { new_leads, open_leads, reply_waiting, reply_waiting_capped, events_this_week, invoices_due },
//     reply_to: [ { lead_id, name, phone, conversation_id, responded, last_message: { body, at, channel } } ]   3 max
//     week: [ { id, title, date, time, kind, state, linked_lead_id, place, crew: [{ name, confirmation }] } ]   20 max
//     week_capped,
//     money_due: { total, count, overdue_count, next: { id, client_name, due_date, amount_due } | null } }      (rupees)
// reply_to and reply_waiting are the worklist feed's lead_unanswered set (leads in 'new', not deleted: leadFeed.js), her
//   newest first, INCLUDING an enquiry with no thread (then conversation_id is null and the message is its raw_message at
//   created_at). reply_waiting is an exact count, so reply_waiting_capped is false; the flag stays in the contract.
//   responded: true when the newest message on the WhatsApp thread with that number went OUT from her side (her, her team
//   or Eliza); false when the client wrote last or there is no thread yet.
// week: today and the seven days after, in India; not deleted; place = the event's notes (first line), else the linked
//   lead's wedding_city, else null; crew = [{ name, confirmation }] for her team members on the event (confirmation as
//   the crew read gives it, bands.js and 0087 D: confirmed, pending or declined; no row reads 'pending'), [] for none.
// money_due: every invoice in 'unpaid' or 'advance_paid' (invoices.js's total_outstanding rule) read whole, as invoices.js
//   reads it (no aggregate read is enabled on this estate); count = DISTINCT clients owing (client_id, else lead_id,
//   else the client's name); overdue = a due date before today; next = the earliest due.
// READS (cut 10): at most TEN per call, in three stages read together: five (two counts, the newest three unanswered, the
//   week, the owed invoices); then up to four (their threads by phone, the linked leads' cities, the crew's names, the
//   crew's confirmations); then one (those threads' newest messages). Only a vendor with NOTHING in hand adds the feed's
//   five has_any probes, read together (ten reads, two stages). A failed part is null, and parts says which.
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes } = require('../../lib/response');

const REPLY_ROWS = 3; const WEEK_CAP = 20; const BODY_MAX = 140; const MESSAGES = 60;
const OPEN = ['new', 'contacted', 'quoted'];
const OWED = ['unpaid', 'advance_paid'];
const istDay = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);
const clip = (s) => { const a = Array.from(String(s || '').replace(/\s+/g, ' ').trim()); return a.length > BODY_MAX ? a.slice(0, BODY_MAX - 1).join('') + '…' : a.join(''); };
const firstLine = (s) => { const l = String(s || '').split('\n').map((x) => x.trim()).find(Boolean); return l ? l.slice(0, 80) : null; };
// cut 10: every read reports whether it succeeded (`ok`), so each part can say "could not load" and never "nothing".
async function safe(q, fallback) { try { const r = await q; return r && !r.error ? Object.assign({ ok: true }, r) : { ok: false, data: fallback, count: 0 }; } catch (_e) { return { ok: false, data: fallback, count: 0 }; } }
const none = (v) => Promise.resolve({ ok: true, data: v, count: 0 });

async function summaryFor(sb, vendorId, nowMs) {
  const today = istDay(nowMs); const weekEnd = istDay(nowMs + 7 * 86400000);
  // ── stage 1 ──
  const [newC, openC, newest, events, invoices] = await Promise.all([
    safe(sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('state', 'new').is('deleted_at', null), null),
    safe(sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).in('state', OPEN).is('deleted_at', null), null),
    safe(sb.from('leads').select('id, name, phone, raw_message, created_at').eq('vendor_id', vendorId).eq('state', 'new').is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(REPLY_ROWS), []),
    safe(sb.from('events').select('id, title, event_date, event_time, kind, state, linked_lead_id, notes, assigned_member_ids').eq('vendor_id', vendorId)
      .is('deleted_at', null).gte('event_date', today).lte('event_date', weekEnd)
      .order('event_date', { ascending: true }).order('event_time', { ascending: true }).limit(WEEK_CAP + 1), []),
    safe(sb.from('invoices').select('id, client_name, client_id, lead_id, amount_total, amount_paid, due_date').eq('vendor_id', vendorId)
      .in('state', OWED).is('deleted_at', null), []),
  ]);
  const leads3 = Array.isArray(newest.data) ? newest.data : [];
  const evAll = Array.isArray(events.data) ? events.data : [];
  const ev = evAll.slice(0, WEEK_CAP);
  const phones = [...new Set(leads3.map((l) => l.phone).filter(Boolean))];
  const linkIds = [...new Set(ev.map((e) => e.linked_lead_id).filter(Boolean))];
  const crewIds = [...new Set(ev.flatMap((e) => (Array.isArray(e.assigned_member_ids) ? e.assigned_member_ids : [])))];
  // ── stage 2 ──
  const evIds = ev.map((e) => e.id);
  const [threads, linked, crew, confirms] = await Promise.all([
    phones.length ? safe(sb.from('conversations').select('id, counterparty_phone, last_message_at').eq('vendor_id', vendorId).eq('kind', 'couple_thread').in('counterparty_phone', phones), []) : none([]),
    linkIds.length ? safe(sb.from('leads').select('id, wedding_city').eq('vendor_id', vendorId).in('id', linkIds), []) : none([]),
    crewIds.length ? safe(sb.from('team_members').select('id, name').eq('vendor_id', vendorId).in('id', crewIds).is('deleted_at', null), []) : none([]),
    // cut 10: each member's confirmation as the crew read gives it (bands.js; 0087 D): confirmed, pending, declined; no row reads 'pending'
    crewIds.length ? safe(sb.from('crew_confirmations').select('event_id, member_id, status').in('event_id', evIds), []) : none([]),
  ]);
  const th = Array.isArray(threads.data) ? threads.data : [];
  const threadByPhone = new Map();
  for (const t of th) { const was = threadByPhone.get(t.counterparty_phone); if (!was || String(t.last_message_at || '') > String(was.last_message_at || '')) threadByPhone.set(t.counterparty_phone, t); }
  const threadIds = [...threadByPhone.values()].map((t) => t.id);
  // ── stage 3 ──
  const msgs = threadIds.length ? await safe(sb.from('messages').select('conversation_id, direction, body, channel, created_at').in('conversation_id', threadIds)
    .order('created_at', { ascending: false }).limit(MESSAGES), []) : { ok: true, data: [] };
  const latest = new Map();
  for (const m of Array.isArray(msgs.data) ? msgs.data : []) if (!latest.has(m.conversation_id)) latest.set(m.conversation_id, m);
  const reply_to = leads3.map((l) => {
    const t = l.phone ? threadByPhone.get(l.phone) : null; const m = t ? latest.get(t.id) : null;
    return { lead_id: l.id, name: l.name || null, phone: l.phone || null, conversation_id: t ? t.id : null, responded: Boolean(m && m.direction === 'outbound'),
      last_message: m ? { body: clip(m.body), at: m.created_at, channel: m.channel || null } : { body: clip(l.raw_message), at: l.created_at, channel: null } };
  });
  const cityById = new Map((Array.isArray(linked.data) ? linked.data : []).map((x) => [x.id, x.wedding_city]));
  const nameById = new Map((Array.isArray(crew.data) ? crew.data : []).map((x) => [x.id, x.name]));
  const confirmByPair = new Map((Array.isArray(confirms.data) ? confirms.data : []).map((c) => [`${c.event_id}:${c.member_id}`, c.status]));
  const inv = (Array.isArray(invoices.data) ? invoices.data : []).map((i) => ({ ...i, due: Math.max(0, (Number(i.amount_total) || 0) - (Number(i.amount_paid) || 0)) })).filter((i) => i.due > 0);
  const clients = new Set(inv.map((i) => i.client_id || i.lead_id || `name:${String(i.client_name || '').trim().toLowerCase()}`));
  const nextInv = inv.filter((i) => i.due_date).sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))[0] || null;
  // ── cut 10 · has_any: the feed's own meaning (worklistToday.js, F-2): has this vendor EVER had anything. The cheap path
  // first (anything already in hand says yes); only on the all-empty path, the feed's five head-count probes, read
  // together. A failed probe is not a no: true, as the feed does.
  let has_any = (newC.count || 0) > 0 || (openC.count || 0) > 0 || ev.length > 0 || inv.length > 0 || leads3.length > 0;
  if (!has_any) {
    const probes = await Promise.all([
      safe(sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).is('deleted_at', null).limit(1), null),
      safe(sb.from('invoices').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).is('deleted_at', null).limit(1), null),
      safe(sb.from('events').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).is('deleted_at', null).limit(1), null),
      safe(sb.from('contracts').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).limit(1), null),
      safe(sb.from('team_tasks').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).is('deleted_at', null).limit(1), null),
    ]);
    has_any = probes.some((p) => !p.ok) || probes.some((p) => (p.count || 0) > 0);
  }
  // ── cut 10 · the per-part tell: true when every read the part stands on succeeded; a failed part is null, never 0 or [].
  const parts = {
    counts: newC.ok && openC.ok && events.ok && invoices.ok,
    reply_to: newest.ok && threads.ok && (msgs.ok !== false),
    week: events.ok && linked.ok && crew.ok && confirms.ok,
    money_due: invoices.ok,
  };
  return {
    today,
    has_any,
    parts,
    counts: parts.counts ? { new_leads: newC.count || 0, open_leads: openC.count || 0, reply_waiting: newC.count || 0, reply_waiting_capped: false,
      events_this_week: ev.length, invoices_due: inv.length } : null,
    reply_to: parts.reply_to ? reply_to : null,
    week: parts.week ? ev.map((e) => ({ id: e.id, title: e.title, date: e.event_date, time: e.event_time || null, kind: e.kind, state: e.state, linked_lead_id: e.linked_lead_id || null,
      place: firstLine(e.notes) || (e.linked_lead_id && cityById.get(e.linked_lead_id)) || null,
      crew: (Array.isArray(e.assigned_member_ids) ? e.assigned_member_ids : []).filter((id) => nameById.has(id))
        .map((id) => ({ name: nameById.get(id), confirmation: confirmByPair.get(`${e.id}:${id}`) || 'pending' })) })) : null,
    week_capped: parts.week ? evAll.length > WEEK_CAP : null,
    money_due: parts.money_due ? { total: inv.reduce((s2, i2) => s2 + i2.due, 0), count: clients.size, overdue_count: inv.filter((i2) => i2.due_date && i2.due_date < today).length,
      next: nextInv ? { id: nextInv.id, client_name: nextInv.client_name, due_date: nextInv.due_date, amount_due: nextInv.due } : null } : null,
  };
}

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const out = await summaryFor(req.app.locals.supabase, req.vendor.id, Date.now());
  return okRes(res, out);
}));

module.exports = router;
module.exports.summaryFor = summaryFor;
