'use strict';
// src/lib/vendor/askTools.js  CE-45 ASK-1 cut 1 (R-45.33). THE QUESTION AGENT'S READ TOOLS. READ-ONLY BY CONSTRUCTION.
//
// THE LAW (the kickoff §3, the read-first as ruled 26 September 2026):
//  (a) THE VENDOR IS CODE'S. Every tool takes the vendor id from `ctx.vendorId`, which workingDoor.preTurn built from the
//      session or the WhatsApp number's resolution. No tool schema has a vendor field; runTool() hands each tool ONLY the
//      arguments its schema names, so a vendor_id (or anything else) the model adds is dropped before the call.
//  (b) SELECTS ONLY. Every query this file writes carries .eq('vendor_id', ctx.vendorId); a joined read (the client an event
//      names, the crew it assigns) carries it again. The estate's own readers are CALLED, never copied (K8 as ruled): the day
//      through occupancy.describeDate and verdictOf, its rows through daySheet.readDaySpine, blocks through
//      availability.listBlocks, the week through dueWeek.dueThisWeek, the new leads through leadFeed, the tally through
//      invoices.readOutstanding. Three of those modules also hold writers; the require graph is PINNED by b130a, not claimed
//      writer-free, and read-only is proven at runtime over the whole bank (zero writes, zero sends).
//  (c) A FAILED READ IS { ok: false, error: 'unreadable' }, never an empty list (C-44.4). Empty means the records hold nothing.
//  (d) SUMS AND COUNTS ARE CODE'S: every total and count the agent may say is a field here. Money is also given pre-worded in
//      the house form ("Rs 1,50,000", witnessLine.rupees) and every date as "5 March 2028" (witnessLine.longDateYear), so the
//      agent copies and never formats.
//  (e) DATES ARE HER WORDS (F-44.38): *_as_spoken arguments, resolved here by spokenDate and spokenRange against today in IST.
//  Rows are capped at ROW_CAP per list, and the cap is SAID (`more`), so a long list is never silently cut.

const { resolveSpokenDate } = require('./spokenDate');
const { resolveSpokenRange, addDays } = require('./spokenRange');
const { longDateYear, rupees } = require('../witnessLine');
const { istTodayISO } = require('./istClock');

const ROW_CAP = 40;
const RANGE_CAP_DAYS = 92;
const DAY_CONCURRENCY = 8;

const said = (isoDay) => (typeof isoDay === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoDay) ? longDateYear(isoDay.slice(0, 10)) : null);
const money = (n) => { const x = Number(n); if (!Number.isFinite(x)) return null; return x === 0 ? 'Rs 0' : rupees(x); }; // rupees() words a positive figure only; nought is said as Rs 0
const text = (s) => (typeof s === 'string' && s.trim() ? s.trim() : null);
const today = (ctx) => istTodayISO(Number.isFinite(ctx.nowMs) ? ctx.nowMs : Date.now());
const bad = (error, extra) => ({ ok: false, error, ...(extra || {}) });
const capped = (rows) => ({ list: rows.slice(0, ROW_CAP), more: Math.max(0, rows.length - ROW_CAP) });

// THE NAME MATCH (the read-first: T4). Her words against a list of { id, name }: an exact match wins alone; else every row whose
// name holds all her words, or whose words all sit in hers, or one letter off her whole phrase. Several are RETURNED, and the
// agent asks which; none is none. Small and local on purpose: the door's nearestName lives in workingDoor.js, whose require
// graph holds every writer the door has, so it is not imported here.
const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/['\u2019]s\b/g, '').replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ').replace(/\s+/g, ' ').trim();
function oneOff(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
function matchNames(words, rows) {
  const k = norm(words);
  if (!k) return [];
  const live = (rows || []).filter((r) => r && typeof r.name === 'string' && norm(r.name));
  const exact = live.filter((r) => norm(r.name) === k);
  if (exact.length) return exact;
  const mine = k.split(' ');
  return live.filter((r) => {
    const n = norm(r.name); const theirs = n.split(' ');
    return mine.every((w) => theirs.includes(w)) || theirs.every((w) => mine.includes(w)) || oneOff(k, n);
  });
}

function dayOf(ctx, words, past) {
  const r = resolveSpokenDate(String(words || ''), { direction: past ? 'past' : 'future', nowMs: ctx.nowMs });
  return r && r.ok && typeof r.iso === 'string' ? r.iso : null;
}
function rangeOf(ctx, words, past) {
  const r = resolveSpokenRange(String(words || ''), { direction: past ? 'past' : 'future', nowMs: ctx.nowMs });
  return r && r.ok ? r : null;
}

// ── the joins, each scoped ─────────────────────────────────────────────────────────────────────────────────────────
async function leadsById(ctx, ids) {
  const want = [...new Set((ids || []).filter((x) => typeof x === 'string'))];
  if (!want.length) return new Map();
  const { data, error } = await ctx.supabase.from('leads').select('id, name, wedding_city, phone').eq('vendor_id', ctx.vendorId).in('id', want);
  if (error || !Array.isArray(data)) throw new Error('unreadable');
  return new Map(data.map((l) => [l.id, l]));
}
async function membersById(ctx, ids) {
  const want = [...new Set((ids || []).flat().filter((x) => typeof x === 'string'))];
  if (!want.length) return new Map();
  const { data, error } = await ctx.supabase.from('team_members').select('id, name, role').eq('vendor_id', ctx.vendorId).in('id', want);
  if (error || !Array.isArray(data)) throw new Error('unreadable');
  return new Map(data.map((m) => [m.id, m]));
}
function eventOut(e, leads, members) {
  const lead = e.linked_lead_id ? leads.get(e.linked_lead_id) : null;
  const crew = (Array.isArray(e.assigned_member_ids) ? e.assigned_member_ids : []).map((id) => members.get(id)).filter(Boolean).map((m) => text(m.name)).filter(Boolean);
  return {
    date: said(e.event_date), title: text(e.title), kind: e.kind || null, slot: e.slot || null, time: text(e.event_time),
    state: e.state || null, notes: text(e.notes), client: lead ? text(lead.name) : null, city: lead ? text(lead.wedding_city) : null, crew,
  };
}

// THE DAY'S STATE: verdictOf's own fields, worded by R-G31.1 as stated where verdictOf is computed (src/api/public/availability.js),
// with ONE difference for her own lane: a day she blocked is said as blocked (the /v page says "Booked" to a couple for both, which
// is right for a couple and untrue to her). Every slot at capacity is booked; any slot held is part held; nothing held is free; a
// verdict that could not be read is unreadable. When the day's capacity is not computed for her category (occupancy 'off'), a day with no block is not_blocked,
// and her events that day are listed beside it so she is never told "free" on a day she has a shoot.
function stateOf(v) {
  if (!v || v.blocked === null || v.blocked === undefined) return 'unreadable';
  if (v.blocked === true) return 'blocked';
  if (v.sold === true) return 'booked';
  if (v.any_held === true) return 'part_held';
  if (v.occupancy !== 'on') return 'not_blocked';
  return 'free';
}
async function verdictFor(ctx, isoDay) {
  const { describeDate } = require('./occupancy');
  const { verdictOf } = require('../../api/public/availability');
  const d = await describeDate({ supabase: ctx.supabase, vendorId: ctx.vendorId, date: isoDay });
  if (!d) return { state: 'unreadable' };
  const v = verdictOf(d);
  return { state: stateOf(v), blocked_slots: Array.isArray(d.blocked_slots) ? d.blocked_slots : [], slots: (Array.isArray(d.slots) ? d.slots : []).map((s) => ({ slot: s.slot, held: s.held, capacity: s.capacity })) };
}
async function inBatches(items, n, fn) {
  const outp = new Array(items.length);
  for (let i = 0; i < items.length; i += n) {
    const part = await Promise.all(items.slice(i, i + n).map((x) => fn(x)));
    part.forEach((r, j) => { outp[i + j] = r; });
  }
  return outp;
}

// ── THE TOOLS ──────────────────────────────────────────────────────────────────────────────────────────────────────
const T = {};

T.day = {
  description: 'One day in her calendar: whether it is free, booked, part held or blocked, and every event and block on it with its time, kind, client, the client\'s city, notes and crew. Use for: am I free on a date, what time is something on a date, who booked me on a date, where is it, who is shooting it.',
  props: { when_as_spoken: { type: 'string', description: 'The day in her words, e.g. "14 Feb", "tomorrow", "next Saturday". Never compute a date.' }, past: { type: 'boolean', description: 'true only when she asks about a day already gone.' } },
  required: ['when_as_spoken'],
  async run(ctx, a) {
    const d = dayOf(ctx, a.when_as_spoken, a.past === true);
    if (!d) return bad('date_unreadable', { said: text(a.when_as_spoken) });
    const verdict = await verdictFor(ctx, d);
    const { readDaySpine } = require('./daySheet');
    const spine = await readDaySpine(ctx.supabase, ctx.vendorId, d);
    if (!spine || spine.ok !== true) return bad('unreadable');
    const leads = await leadsById(ctx, spine.events.map((e) => e.linked_lead_id));
    const members = await membersById(ctx, spine.events.map((e) => e.assigned_member_ids || []));
    return {
      ok: true, date: said(d), state: verdict.state, blocked_slots: verdict.blocked_slots || [], slots: verdict.slots || [],
      events: spine.events.map((e) => eventOut(e, leads, members)),
      blocks: spine.blocks.map((b) => ({ slot: b.slot, reason: text(b.reason) })),
      event_count: spine.events.length,
    };
  },
};

T.days = {
  description: 'A stretch of days (a month, a week, a weekend, a range): which days are free, booked, part held, blocked. Use for: what dates am I free in October, what is blocked in February, am I free this weekend.',
  props: { range_as_spoken: { type: 'string', description: 'The stretch in her words, e.g. "October", "this weekend", "next month", "3 to 9 March". Never compute dates.' }, want: { type: 'string', enum: ['free', 'booked', 'blocked', 'all'] }, past: { type: 'boolean', description: 'true only when she asks about days already gone.' } },
  required: ['range_as_spoken'],
  async run(ctx, a) {
    const r = rangeOf(ctx, a.range_as_spoken, a.past === true);
    if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) });
    if (r.days > RANGE_CAP_DAYS) return bad('range_too_long', { max_days: RANGE_CAP_DAYS, from: said(r.from), to: said(r.to) });
    const list = []; for (let d = r.from; d <= r.to; d = addDays(d, 1)) list.push(d);
    const verdicts = await inBatches(list, DAY_CONCURRENCY, (d) => verdictFor(ctx, d));
    if (verdicts.some((v) => !v || v.state === 'unreadable')) return bad('unreadable');
    const { listBlocks } = require('./availability');
    const b = await listBlocks(ctx.supabase, ctx.vendorId, { from: r.from, to: r.to });
    if (!b || b.ok !== true) return bad('unreadable');
    const { data: evs, error } = await ctx.supabase.from('events').select('event_date, title, kind, event_time')
      .eq('vendor_id', ctx.vendorId).is('deleted_at', null).neq('state', 'cancelled').neq('kind', 'blocked')
      .gte('event_date', r.from).lte('event_date', r.to).order('event_date', { ascending: true });
    if (error || !Array.isArray(evs)) return bad('unreadable');
    const byState = { free: [], booked: [], blocked: [], part_held: [], not_blocked: [] };
    list.forEach((d, i) => { (byState[verdicts[i].state] || byState.not_blocked).push(said(d)); });
    const blocked = [...new Set((b.blocks || []).map((x) => x && (x.blocked_date || x.event_date || x.date)).filter(Boolean))].sort().map(said);
    const busy = [...new Set(evs.map((e) => e.event_date))].sort().map(said);
    const want = ['free', 'booked', 'blocked'].includes(a.want) ? a.want : 'all';
    const outp = { ok: true, from: said(r.from), to: said(r.to), day_count: r.days, counts: { free: byState.free.length, booked: byState.booked.length, part_held: byState.part_held.length, not_blocked: byState.not_blocked.length, blocked: blocked.length, with_events: busy.length } };
    if (want === 'all' || want === 'free') { outp.free = byState.free; outp.not_blocked = byState.not_blocked; outp.days_with_events = busy; }
    if (want === 'all' || want === 'booked') { outp.booked = byState.booked; outp.part_held = byState.part_held; outp.days_with_events = busy; }
    if (want === 'all' || want === 'blocked') outp.blocked = blocked;
    return outp;
  },
};

T.events = {
  description: 'Her events (shoots, meetings, calls, recces, trials and so on) in a stretch of days, for a client, or of a kind, with date, time, client, city, notes and crew. Without a range it lists what is coming up.',
  props: { range_as_spoken: { type: 'string' }, client_as_spoken: { type: 'string' }, kind_as_spoken: { type: 'string' }, past: { type: 'boolean' } },
  required: [],
  async run(ctx, a) {
    let from = today(ctx); let to = null;
    if (text(a.range_as_spoken)) { const r = rangeOf(ctx, a.range_as_spoken, a.past === true); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); from = r.from; to = r.to; }
    else if (a.past === true) { to = from; from = null; }
    let q = ctx.supabase.from('events').select('id, title, kind, slot, event_date, event_time, state, notes, linked_lead_id, assigned_member_ids')
      .eq('vendor_id', ctx.vendorId).is('deleted_at', null).neq('state', 'cancelled').neq('kind', 'blocked');
    if (from) q = q.gte('event_date', from);
    if (to) q = q.lte('event_date', to);
    const { data, error } = await q.order('event_date', { ascending: a.past !== true || !!text(a.range_as_spoken) });
    if (error || !Array.isArray(data)) return bad('unreadable');
    let rows = data;
    const kind = text(a.kind_as_spoken) ? norm(a.kind_as_spoken) : null;
    if (kind) rows = rows.filter((e) => norm(e.kind).includes(kind) || kind.includes(norm(e.kind)) || norm(e.title).includes(kind));
    const leads = await leadsById(ctx, rows.map((e) => e.linked_lead_id));
    if (text(a.client_as_spoken)) {
      const hits = matchNames(a.client_as_spoken, [...leads.values()]).map((l) => l.id);
      const k = norm(a.client_as_spoken);
      rows = rows.filter((e) => hits.includes(e.linked_lead_id) || (k && norm(e.title).includes(k)));
    }
    const members = await membersById(ctx, rows.map((e) => e.assigned_member_ids || []));
    const c = capped(rows);
    return { ok: true, from: said(from), to: said(to), count: rows.length, events: c.list.map((e) => eventOut(e, leads, members)), more: c.more };
  },
};

async function findPeople(ctx, words) {
  const { data: leads, error: le } = await ctx.supabase.from('leads')
    .select('id, name, phone, email, state, wedding_date, wedding_date_precision, wedding_city, event_types, budget_min, budget_max, source, referrer_name, notes, client_id, binder_id, created_at')
    .eq('vendor_id', ctx.vendorId).is('deleted_at', null);
  if (le || !Array.isArray(leads)) throw new Error('unreadable');
  const { data: clients, error: ce } = await ctx.supabase.from('clients').select('id, name, phone, email, source, referrer_name, notes')
    .eq('vendor_id', ctx.vendorId).is('deleted_at', null);
  if (ce || !Array.isArray(clients)) throw new Error('unreadable');
  return { leads: matchNames(words, leads), clients: matchNames(words, clients), allLeads: leads };
}

T.client = {
  description: 'Everything her records hold on one client or lead by name: stage, wedding date and city, phone, email, budget, notes, the packages attached, invoices and what is owed on them, contract, and linked events. If several names match, all are returned and she is asked which.',
  props: { name_as_spoken: { type: 'string', description: 'The name exactly as she wrote it.' } },
  required: ['name_as_spoken'],
  async run(ctx, a) {
    const who = await findPeople(ctx, a.name_as_spoken);
    const people = [...who.leads.map((l) => ({ kind: 'lead', row: l })), ...who.clients.filter((c) => !who.leads.some((l) => l.client_id === c.id)).map((c) => ({ kind: 'client', row: c }))];
    if (!people.length) return { ok: true, matches: 0, said: text(a.name_as_spoken) };
    if (people.length > 1) return { ok: true, matches: people.length, names: people.map((p) => ({ name: text(p.row.name), stage: p.row.state || null, wedding_date: said(p.row.wedding_date) })) };
    const p = people[0].row; const isLead = people[0].kind === 'lead';
    const leadId = isLead ? p.id : null; const clientId = isLead ? p.client_id : p.id;
    const sb = ctx.supabase;
    let pk = []; let invs = []; let cons = []; let evs = []; let notes = [];
    if (leadId) {
      const r1 = await sb.from('lead_packages').select('package_id, total, schedule, quoted_at, delivery_on').eq('vendor_id', ctx.vendorId).eq('lead_id', leadId).is('deleted_at', null);
      if (r1.error || !Array.isArray(r1.data)) return bad('unreadable');
      pk = r1.data;
      const r3 = await sb.from('events').select('title, kind, slot, event_date, event_time, state, notes, linked_lead_id, assigned_member_ids').eq('vendor_id', ctx.vendorId).eq('linked_lead_id', leadId).is('deleted_at', null).neq('state', 'cancelled').order('event_date', { ascending: true });
      if (r3.error || !Array.isArray(r3.data)) return bad('unreadable');
      evs = r3.data;
    }
    const pkgNames = new Map();
    if (pk.length) {
      const r2 = await sb.from('vendor_packages').select('id, name').eq('vendor_id', ctx.vendorId).in('id', pk.map((x) => x.package_id).filter(Boolean));
      if (r2.error || !Array.isArray(r2.data)) return bad('unreadable');
      r2.data.forEach((x) => pkgNames.set(x.id, x.name));
    }
    const ors = [leadId ? `lead_id.eq.${leadId}` : null, clientId ? `client_id.eq.${clientId}` : null].filter(Boolean).join(',');
    if (ors) {
      const r4 = await sb.from('invoices').select('id, invoice_number, amount_total, amount_paid, due_date, state, last_payment_at').eq('vendor_id', ctx.vendorId).is('deleted_at', null).or(ors);
      if (r4.error || !Array.isArray(r4.data)) return bad('unreadable');
      invs = r4.data;
      const r5 = await sb.from('contracts').select('number, title, state, sent_at, signed_at').eq('vendor_id', ctx.vendorId).or(ors);
      if (r5.error || !Array.isArray(r5.data)) return bad('unreadable');
      cons = r5.data;
    }
    let milestones = [];
    if (invs.length) {
      const r6 = await sb.from('payment_schedules').select('invoice_id, milestone_label, amount_due, due_date, state, paid_at, paid_amount, ordinal').eq('vendor_id', ctx.vendorId).in('invoice_id', invs.map((i) => i.id)).order('ordinal', { ascending: true });
      if (r6.error || !Array.isArray(r6.data)) return bad('unreadable');
      milestones = r6.data;
    }
    if (isLead && p.binder_id) {
      const r7 = await sb.from('owner_notes').select('body, created_at').eq('vendor_id', ctx.vendorId).eq('binder_id', p.binder_id).order('created_at', { ascending: true });
      if (r7.error || !Array.isArray(r7.data)) return bad('unreadable');
      notes = r7.data;
    }
    const members = await membersById(ctx, evs.map((e) => e.assigned_member_ids || []));
    const leadMap = new Map(leadId ? [[leadId, p]] : []);
    const owedOf = (i) => Math.max(0, (Number(i.amount_total) || 0) - (Number(i.amount_paid) || 0));
    const liveInv = invs.filter((i) => i.state !== 'cancelled');
    return {
      ok: true, matches: 1, kind: isLead ? 'lead' : 'client', name: text(p.name), stage: p.state || null,
      wedding_date: said(p.wedding_date), wedding_date_precision: p.wedding_date_precision || null, city: text(p.wedding_city),
      event_types: p.event_types || null, phone: text(p.phone), email: text(p.email),
      budget: (p.budget_min || p.budget_max) ? { min: money(p.budget_min), max: money(p.budget_max) } : null,
      source: text(p.source), referred_by: text(p.referrer_name), notes: text(p.notes),
      packages: pk.map((x) => ({ name: text(pkgNames.get(x.package_id)), total: money(x.total), quoted_on: said(x.quoted_at), delivery_on: said(x.delivery_on) })),
      invoices: invs.map((i) => ({ number: text(i.invoice_number), total: money(i.amount_total), paid: money(i.amount_paid), owed: money(owedOf(i)), due: said(i.due_date), state: i.state, last_payment_on: said(i.last_payment_at) })),
      owed_total: money(liveInv.reduce((s, i) => s + owedOf(i), 0)),
      milestones: milestones.map((m) => ({ label: text(m.milestone_label), amount: money(m.amount_due), due: said(m.due_date), state: m.state, paid_on: said(m.paid_at), paid: money(m.paid_amount) })),
      contracts: cons.map((c) => ({ number: text(c.number), title: text(c.title), state: c.state, sent_on: said(c.sent_at), signed_on: said(c.signed_at) })),
      events: evs.map((e) => eventOut(e, leadMap, members)),
      her_notes: notes.map((n) => ({ on: said(n.created_at), note: text(n.body) })),
    };
  },
};

T.leads = {
  description: 'Her leads: how many at each stage, and the list for a stage or for weddings in a stretch of days. Stage "new" is the new-leads list.',
  props: { stage: { type: 'string', description: 'A stage word as she said it, e.g. new, quoted, booked, lost. Empty for all.' }, range_as_spoken: { type: 'string', description: 'Weddings in this stretch, in her words.' } },
  required: [],
  async run(ctx, a) {
    const stage = text(a.stage) ? norm(a.stage) : null;
    if (stage === 'new' && !text(a.range_as_spoken)) {
      const { newestLeads, newLeadsCount, NEWEST_CAP } = require('./leadFeed');
      const { data, error } = await newestLeads(ctx.supabase, ctx.vendorId);
      if (error || !Array.isArray(data)) return bad('unreadable');
      let total = data.length;
      if (data.length >= NEWEST_CAP) { const c = await newLeadsCount(ctx.supabase, ctx.vendorId); if (!c || c.error || !Number.isInteger(c.count)) return bad('unreadable'); total = c.count; }
      const k = capped(data);
      return { ok: true, stage: 'new', count: total, leads: k.list.map((l) => ({ name: text(l.name), wedding_date: said(l.wedding_date), city: text(l.wedding_city), added_on: said(l.created_at) })), more: Math.max(0, total - k.list.length) };
    }
    let q = ctx.supabase.from('leads').select('name, state, wedding_date, wedding_city, created_at').eq('vendor_id', ctx.vendorId).is('deleted_at', null);
    let r = null;
    if (text(a.range_as_spoken)) { r = rangeOf(ctx, a.range_as_spoken, false); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); q = q.gte('wedding_date', r.from).lte('wedding_date', r.to); }
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return bad('unreadable');
    const by = {}; data.forEach((l) => { const s = l.state || 'none'; by[s] = (by[s] || 0) + 1; });
    const rows = stage ? data.filter((l) => norm(l.state) === stage) : data;
    const k = capped(rows);
    return { ok: true, stage: stage || 'all', total: data.length, count_by_stage: by, count: rows.length, from: r ? said(r.from) : null, to: r ? said(r.to) : null, leads: k.list.map((l) => ({ name: text(l.name), stage: l.state || null, wedding_date: said(l.wedding_date), city: text(l.wedding_city), added_on: said(l.created_at) })), more: k.more };
  },
};

T.owed = {
  description: 'What is owed to her: the total across open invoices and each invoice\'s owed amount, or one client\'s, with the unpaid payment milestones and their due dates.',
  props: { client_as_spoken: { type: 'string', description: 'A client name to narrow to, as she wrote it. Empty for everyone.' } },
  required: [],
  async run(ctx, a) {
    const { readOutstanding, OUTSTANDING_STATES } = require('./invoices');
    const r = await readOutstanding(ctx.supabase, ctx.vendorId);
    if (!r || r.ok !== true) return bad('unreadable');
    let rows = (r.rows || []).filter((x) => OUTSTANDING_STATES.includes(x.state) && x.amount_owed > 0);
    if (text(a.client_as_spoken)) { const hit = matchNames(a.client_as_spoken, rows.map((x) => ({ id: x.id, name: x.client_name }))).map((x) => x.id); rows = rows.filter((x) => hit.includes(x.id)); }
    const ids = rows.map((x) => x.id);
    let ms = [];
    if (ids.length) {
      const { data, error } = await ctx.supabase.from('payment_schedules').select('invoice_id, milestone_label, amount_due, due_date, state').eq('vendor_id', ctx.vendorId).eq('state', 'pending').in('invoice_id', ids).order('due_date', { ascending: true });
      if (error || !Array.isArray(data)) return bad('unreadable');
      ms = data;
    }
    const nameOf = new Map(rows.map((x) => [x.id, text(x.client_name)]));
    const total = rows.reduce((s, x) => s + x.amount_owed, 0);
    const k = capped(rows);
    return {
      ok: true, client: text(a.client_as_spoken), owed_total: money(total), open_invoices: rows.length,
      invoices: k.list.map((x) => ({ client: text(x.client_name), number: text(x.invoice_number), total: money(x.amount_total), paid: money(x.amount_paid), owed: money(x.amount_owed), due: said(x.due_date) })), more: k.more,
      unpaid_milestones: ms.slice(0, ROW_CAP).map((m) => ({ client: nameOf.get(m.invoice_id) || null, label: text(m.milestone_label), amount: money(m.amount_due), due: said(m.due_date) })),
      collected_all_time: text(a.client_as_spoken) ? null : money(r.summary && r.summary.total_collected),
    };
  },
};

T.paid = {
  description: 'Money that came in: payments marked paid, with dates and clients, in a stretch of days or for one client, and the total; also TDS deducted by clients.',
  props: { range_as_spoken: { type: 'string' }, client_as_spoken: { type: 'string' } },
  required: [],
  async run(ctx, a) {
    let r = null;
    if (text(a.range_as_spoken)) { r = rangeOf(ctx, a.range_as_spoken, true); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); }
    const { data: invs, error: ie } = await ctx.supabase.from('invoices').select('id, client_name, invoice_number, amount_paid, last_payment_at, has_schedule').eq('vendor_id', ctx.vendorId).is('deleted_at', null);
    if (ie || !Array.isArray(invs)) return bad('unreadable');
    let keep = invs;
    if (text(a.client_as_spoken)) { const hit = matchNames(a.client_as_spoken, invs.map((i) => ({ id: i.id, name: i.client_name }))).map((x) => x.id); keep = invs.filter((i) => hit.includes(i.id)); }
    const nameOf = new Map(keep.map((i) => [i.id, text(i.client_name)]));
    let pays = [];
    if (keep.length) {
      let q = ctx.supabase.from('payment_schedules').select('invoice_id, milestone_label, paid_amount, amount_due, paid_at').eq('vendor_id', ctx.vendorId).eq('state', 'paid').in('invoice_id', keep.map((i) => i.id));
      if (r) q = q.gte('paid_at', `${r.from}T00:00:00+05:30`).lte('paid_at', `${r.to}T23:59:59+05:30`);
      const { data, error } = await q.order('paid_at', { ascending: false });
      if (error || !Array.isArray(data)) return bad('unreadable');
      pays = data.map((p) => ({ client: nameOf.get(p.invoice_id) || null, label: text(p.milestone_label), amount_n: Number(p.paid_amount != null ? p.paid_amount : p.amount_due) || 0, on: p.paid_at }));
    }
    // An invoice with no schedule records its money on itself (amount_paid, last_payment_at): counted once, never beside milestones.
    keep.filter((i) => i.has_schedule !== true && Number(i.amount_paid) > 0).forEach((i) => {
      const d = typeof i.last_payment_at === 'string' ? i.last_payment_at.slice(0, 10) : null;
      if (r && !(d && d >= r.from && d <= r.to)) return;
      pays.push({ client: text(i.client_name), label: null, amount_n: Number(i.amount_paid) || 0, on: i.last_payment_at || null });
    });
    let tq = ctx.supabase.from('tds_ledger').select('client_name, tds_amount, gross_amount, deduction_date').eq('vendor_id', ctx.vendorId);
    if (r) tq = tq.gte('deduction_date', r.from).lte('deduction_date', r.to);
    const { data: tds, error: te } = await tq;
    if (te || !Array.isArray(tds)) return bad('unreadable');
    const tdsRows = text(a.client_as_spoken) ? tds.filter((t) => matchNames(a.client_as_spoken, [{ id: 1, name: t.client_name }]).length) : tds;
    pays.sort((x, y) => String(y.on || '').localeCompare(String(x.on || '')));
    const k = capped(pays);
    return {
      ok: true, from: r ? said(r.from) : null, to: r ? said(r.to) : null, client: text(a.client_as_spoken),
      received_total: money(pays.reduce((s, p) => s + p.amount_n, 0)), payment_count: pays.length,
      payments: k.list.map((p) => ({ client: p.client, label: p.label, amount: money(p.amount_n), on: said(p.on) })), more: k.more,
      tds_total: money(tdsRows.reduce((s, t) => s + (Number(t.tds_amount) || 0), 0)), tds_count: tdsRows.length,
    };
  },
};

T.due = {
  description: 'Payment milestones falling due in a stretch of days (not yet paid), with client, label, amount and date, and the total; or everything overdue.',
  props: { range_as_spoken: { type: 'string', description: 'In her words, e.g. "this week", "October". Empty with overdue true for what is late.' }, overdue: { type: 'boolean' } },
  required: [],
  async run(ctx, a) {
    const t = today(ctx);
    let from; let to; let shoots = null;
    if (a.overdue === true && !text(a.range_as_spoken)) { from = null; to = addDays(t, -1); }
    else {
      const r = rangeOf(ctx, a.range_as_spoken || 'this week', false);
      if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) });
      from = r.from; to = r.to;
      if (from === t && to === addDays(t, 6)) {
        // THE WEEK IS THE DOOR'S: the same reader, so her week's figure is one figure wherever she asks.
        const { dueThisWeek } = require('./dueWeek');
        const w = await dueThisWeek(ctx.supabase, ctx.vendorId, ctx.nowMs);
        if (!w || w.ok !== true) return bad('unreadable');
        const total = w.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return { ok: true, from: said(w.from), to: said(w.to), due_total: money(total), count: w.payments.length, payments: w.payments.map((p) => ({ client: text(p.client), label: text(p.milestone), amount: money(p.amount), due: said(p.date) })), shoots_this_week: w.shoots.map((s) => ({ client: text(s.client), date: said(s.date) })) };
      }
    }
    let q = ctx.supabase.from('payment_schedules').select('invoice_id, milestone_label, amount_due, due_date').eq('vendor_id', ctx.vendorId).eq('state', 'pending').not('due_date', 'is', null);
    if (from) q = q.gte('due_date', from);
    q = q.lte('due_date', to);
    const { data, error } = await q.order('due_date', { ascending: true });
    if (error || !Array.isArray(data)) return bad('unreadable');
    const ids = [...new Set(data.map((m) => m.invoice_id).filter(Boolean))];
    const names = new Map();
    if (ids.length) {
      const { data: inv, error: ie } = await ctx.supabase.from('invoices').select('id, client_name, state').eq('vendor_id', ctx.vendorId).in('id', ids);
      if (ie || !Array.isArray(inv)) return bad('unreadable');
      inv.forEach((i) => names.set(i.id, i));
    }
    const rows = data.filter((m) => { const i = names.get(m.invoice_id); return !i || i.state !== 'cancelled'; });
    const k = capped(rows);
    return { ok: true, overdue: a.overdue === true && !text(a.range_as_spoken), from: said(from), to: said(to), due_total: money(rows.reduce((s, m) => s + (Number(m.amount_due) || 0), 0)), count: rows.length, payments: k.list.map((m) => ({ client: names.get(m.invoice_id) ? text(names.get(m.invoice_id).client_name) : null, label: text(m.milestone_label), amount: money(m.amount_due), due: said(m.due_date) })), more: k.more, shoots_this_week: shoots };
  },
};

T.expenses = {
  description: 'Her expenses: in a stretch of days, of a category, or for a client, with the total and the total by category.',
  props: { range_as_spoken: { type: 'string' }, category: { type: 'string' }, client_as_spoken: { type: 'string' } },
  required: [],
  async run(ctx, a) {
    let q = ctx.supabase.from('expenses').select('amount, category, description, expense_date, client_name, notes').eq('vendor_id', ctx.vendorId).is('deleted_at', null);
    let r = null;
    if (text(a.range_as_spoken)) { r = rangeOf(ctx, a.range_as_spoken, true); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); q = q.gte('expense_date', r.from).lte('expense_date', r.to); }
    const { data, error } = await q.order('expense_date', { ascending: false });
    if (error || !Array.isArray(data)) return bad('unreadable');
    let rows = data;
    if (text(a.category)) { const c = norm(a.category); rows = rows.filter((e) => norm(e.category).includes(c) || norm(e.description).includes(c)); }
    if (text(a.client_as_spoken)) rows = rows.filter((e) => matchNames(a.client_as_spoken, [{ id: 1, name: e.client_name }]).length);
    const by = {}; rows.forEach((e) => { const c = e.category || 'other'; by[c] = (by[c] || 0) + (Number(e.amount) || 0); });
    const k = capped(rows);
    return { ok: true, from: r ? said(r.from) : null, to: r ? said(r.to) : null, spent_total: money(rows.reduce((s, e) => s + (Number(e.amount) || 0), 0)), count: rows.length, by_category: Object.fromEntries(Object.entries(by).map(([c, n]) => [c, money(n)])), expenses: k.list.map((e) => ({ amount: money(e.amount), category: e.category || null, what: text(e.description), on: said(e.expense_date), client: text(e.client_name) })), more: k.more };
  },
};

T.packages = {
  description: 'The packages and prices she has set: name, what is included, total, deposit and middle payment percentages, delivery time, and which is her default.',
  props: {},
  required: [],
  async run(ctx) {
    const { data, error } = await ctx.supabase.from('vendor_packages').select('name, description, line_items, total, deposit_pct, middle_pct, middle_enabled, delivery_basis, delivery_days, is_default').eq('vendor_id', ctx.vendorId).is('deleted_at', null).order('total', { ascending: true });
    if (error || !Array.isArray(data)) return bad('unreadable');
    return { ok: true, count: data.length, packages: data.map((p) => ({ name: text(p.name), description: text(p.description), includes: p.line_items || null, total: money(p.total), deposit_pct: p.deposit_pct, middle_pct: p.middle_enabled ? p.middle_pct : null, delivery_days: p.delivery_days, delivery_basis: p.delivery_basis || null, is_default: p.is_default === true })) };
  },
};

T.team = {
  description: 'Her team and crew: who they are and their role and day rate, and for one member their shoots in a stretch of days, their tasks, and what she owes or has paid them.',
  props: { member_as_spoken: { type: 'string' }, range_as_spoken: { type: 'string' } },
  required: [],
  async run(ctx, a) {
    const { data: ms, error } = await ctx.supabase.from('team_members').select('id, name, role, phone, daily_rate_inr, active').eq('vendor_id', ctx.vendorId).is('deleted_at', null);
    if (error || !Array.isArray(ms)) return bad('unreadable');
    const live = ms.filter((m) => m.active !== false);
    if (!text(a.member_as_spoken)) return { ok: true, count: live.length, members: live.map((m) => ({ name: text(m.name), role: text(m.role), phone: text(m.phone), day_rate: money(m.daily_rate_inr) })) };
    const hit = matchNames(a.member_as_spoken, live);
    if (hit.length !== 1) return { ok: true, matches: hit.length, said: text(a.member_as_spoken), names: hit.map((m) => text(m.name)) };
    const m = hit[0];
    let from = today(ctx); let to = null;
    if (text(a.range_as_spoken)) { const r = rangeOf(ctx, a.range_as_spoken, false); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); from = r.from; to = r.to; }
    let q = ctx.supabase.from('events').select('title, kind, slot, event_date, event_time, state, notes, linked_lead_id, assigned_member_ids').eq('vendor_id', ctx.vendorId).is('deleted_at', null).neq('state', 'cancelled').contains('assigned_member_ids', [m.id]).gte('event_date', from);
    if (to) q = q.lte('event_date', to);
    const { data: evs, error: ee } = await q.order('event_date', { ascending: true });
    if (ee || !Array.isArray(evs)) return bad('unreadable');
    const { data: tasks, error: te } = await ctx.supabase.from('team_tasks').select('title, due_date, priority, state').eq('vendor_id', ctx.vendorId).eq('assigned_to_member_id', m.id).is('deleted_at', null).neq('state', 'cancelled');
    if (te || !Array.isArray(tasks)) return bad('unreadable');
    const { data: pays, error: pe } = await ctx.supabase.from('team_payments').select('amount_inr, state, paid_at, description').eq('vendor_id', ctx.vendorId).eq('team_member_id', m.id).neq('state', 'cancelled');
    if (pe || !Array.isArray(pays)) return bad('unreadable');
    const leads = await leadsById(ctx, evs.map((e) => e.linked_lead_id));
    const members = new Map([[m.id, m]]);
    const sum = (st) => pays.filter((p) => p.state === st).reduce((s, p) => s + (Number(p.amount_inr) || 0), 0);
    const k = capped(evs);
    return { ok: true, matches: 1, name: text(m.name), role: text(m.role), phone: text(m.phone), day_rate: money(m.daily_rate_inr), shoots_count: evs.length, shoots: k.list.map((e) => eventOut(e, leads, members)), more: k.more, tasks: tasks.map((t) => ({ title: text(t.title), due: said(t.due_date), priority: t.priority, state: t.state })), owed_to_them: money(sum('owed')), paid_to_them: money(sum('paid')) };
  },
};

T.sent = {
  description: 'Messages that went out to her clients from TDW: relays and quotes she approved, payment reminders, and contracts sent, with when and to whom.',
  props: { client_as_spoken: { type: 'string' }, range_as_spoken: { type: 'string' } },
  required: [],
  async run(ctx, a) {
    let r = null;
    if (text(a.range_as_spoken)) { r = rangeOf(ctx, a.range_as_spoken, true); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); }
    const lo = r ? `${r.from}T00:00:00+05:30` : null; const hi = r ? `${r.to}T23:59:59+05:30` : null;
    const { sentFor } = require('./coupleDrafts'); // the drafts' one home reads them (b06 7.3)
    const d1 = await sentFor(ctx.supabase, ctx.vendorId, { from: lo, to: hi });
    if (!d1 || d1.ok !== true) return bad('unreadable');
    const drafts = d1.rows;
    let q2 = ctx.supabase.from('payment_reminders').select('milestone_label, amount_due, due_date, to_phone, status, created_at').eq('vendor_id', ctx.vendorId).in('status', ['sent', 'delivered', 'read']);
    if (r) q2 = q2.gte('created_at', lo).lte('created_at', hi);
    const { data: rems, error: e2 } = await q2.order('created_at', { ascending: false });
    if (e2 || !Array.isArray(rems)) return bad('unreadable');
    let q3 = ctx.supabase.from('contract_sends').select('to_phone, status, sent_at, recipient').eq('vendor_id', ctx.vendorId).eq('recipient', 'client');
    if (r) q3 = q3.gte('sent_at', lo).lte('sent_at', hi);
    const { data: cs, error: e3 } = await q3.order('sent_at', { ascending: false });
    if (e3 || !Array.isArray(cs)) return bad('unreadable');
    // Whom a phone belongs to: her own leads and clients, read here and matched in code.
    const { data: people, error: e4 } = await ctx.supabase.from('leads').select('name, phone').eq('vendor_id', ctx.vendorId).is('deleted_at', null);
    if (e4 || !Array.isArray(people)) return bad('unreadable');
    const digitsOf = (s) => String(s || '').replace(/\D+/g, '').slice(-10);
    const byPhone = new Map(people.filter((p) => digitsOf(p.phone).length === 10).map((p) => [digitsOf(p.phone), text(p.name)]));
    const who = (ph) => byPhone.get(digitsOf(ph)) || null;
    let items = [
      ...drafts.map((d) => ({ what: 'message', to: who(d.couple_phone), text: text(d.body), on: d.resolved_at || d.created_at })),
      ...rems.map((m) => ({ what: 'payment reminder', to: who(m.to_phone), text: `${text(m.milestone_label) || 'payment'} ${money(m.amount_due) || ''}`.trim(), on: m.created_at, status: m.status })),
      ...cs.map((c) => ({ what: 'contract', to: who(c.to_phone), text: null, on: c.sent_at, status: c.status })),
    ];
    if (text(a.client_as_spoken)) items = items.filter((i) => i.to && matchNames(a.client_as_spoken, [{ id: 1, name: i.to }]).length);
    items.sort((x, y) => String(y.on || '').localeCompare(String(x.on || '')));
    const k = capped(items);
    return { ok: true, from: r ? said(r.from) : null, to: r ? said(r.to) : null, count: items.length, sent: k.list.map((i) => ({ ...i, on: said(i.on) })), more: k.more };
  },
};

T.reminders = {
  description: 'Reminders: payment reminders queued or sent to clients, whether automatic reminders are on, and team tasks due, in a stretch of days.',
  props: { range_as_spoken: { type: 'string' } },
  required: [],
  async run(ctx, a) {
    let from = today(ctx); let to = addDays(from, 29);
    if (text(a.range_as_spoken)) { const r = rangeOf(ctx, a.range_as_spoken, false); if (!r) return bad('date_unreadable', { said: text(a.range_as_spoken) }); from = r.from; to = r.to; }
    const { data: rems, error: e1 } = await ctx.supabase.from('payment_reminders').select('milestone_label, amount_due, due_date, status, created_at').eq('vendor_id', ctx.vendorId).gte('due_date', from).lte('due_date', to).order('due_date', { ascending: true });
    if (e1 || !Array.isArray(rems)) return bad('unreadable');
    const { data: set, error: e2 } = await ctx.supabase.from('payment_reminder_settings').select('auto_send').eq('vendor_id', ctx.vendorId).maybeSingle();
    if (e2) return bad('unreadable');
    const { data: tasks, error: e3 } = await ctx.supabase.from('team_tasks').select('title, due_date, priority, state, assigned_to_member_id').eq('vendor_id', ctx.vendorId).is('deleted_at', null).in('state', ['open', 'in_progress']).gte('due_date', from).lte('due_date', to).order('due_date', { ascending: true });
    if (e3 || !Array.isArray(tasks)) return bad('unreadable');
    const members = await membersById(ctx, tasks.map((t) => t.assigned_to_member_id));
    return { ok: true, from: said(from), to: said(to), automatic_reminders: set ? set.auto_send === true : null, payment_reminders: rems.slice(0, ROW_CAP).map((m) => ({ label: text(m.milestone_label), amount: money(m.amount_due), due: said(m.due_date), status: m.status })), payment_reminder_count: rems.length, tasks: tasks.slice(0, ROW_CAP).map((t) => ({ title: text(t.title), due: said(t.due_date), priority: t.priority, state: t.state, for: members.get(t.assigned_to_member_id) ? text(members.get(t.assigned_to_member_id).name) : null })), task_count: tasks.length };
  },
};

const TOOL_NAMES = Object.freeze(Object.keys(T));

// The schemas the model reads. Built from T, so a tool and its schema are one object and cannot drift.
const TOOL_SCHEMAS = Object.freeze(TOOL_NAMES.map((name) => ({
  name,
  description: T[name].description,
  input_schema: { type: 'object', properties: T[name].props, required: T[name].required, additionalProperties: false },
})));

// THE ONE ENTRY. The vendor is ctx's; only the schema's own arguments reach the tool (anything else is dropped, a vendor_id
// first among them); strings are trimmed and bounded. Never throws: a read that throws is 'unreadable'.
const ARG_MAX = 200;
async function runTool(ctx, name, input) {
  try {
    if (!ctx || !ctx.supabase || typeof ctx.vendorId !== 'string' || !ctx.vendorId) return bad('no_context');
    if (!TOOL_NAMES.includes(name)) return bad('no_such_tool');
    const t = T[name];
    const args = {};
    const raw = input && typeof input === 'object' ? input : {};
    for (const k of Object.keys(t.props)) {
      const v = raw[k];
      const type = t.props[k].type;
      if (type === 'string' && typeof v === 'string') args[k] = v.slice(0, ARG_MAX);
      else if (type === 'boolean' && typeof v === 'boolean') args[k] = v;
    }
    for (const k of t.required) if (args[k] === undefined) return bad('missing_argument', { argument: k });
    return await t.run({ supabase: ctx.supabase, vendorId: ctx.vendorId, nowMs: ctx.nowMs }, args);
  } catch (_e) { return bad('unreadable'); }
}

module.exports = { runTool, TOOL_SCHEMAS, TOOL_NAMES, matchNames, stateOf, ROW_CAP, RANGE_CAP_DAYS };
