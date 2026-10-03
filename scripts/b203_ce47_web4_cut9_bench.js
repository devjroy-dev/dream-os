// scripts/b203_ce47_web4_cut9_bench.js
// TDW · CE-47 · WEB-4 cut 9 · b203 — TODAY'S SLIM SUMMARY (GET /api/v2/vendor/today-summary) AND THE STORED DISCOVER LINE.
// §1 the shape, against planted rows (r2: FE-8's six gaps) · §2 the reads: at most nine, three stages · §3 a failed part is
// empty, not a 500 · §3b Check a date's enquiries (the day door) · §4 her session only · §5 the Discover line for new rows ·
// §6 mutations, run. Red on a tree without the cut.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
const { makeStore } = require('./lib/b196_store');
const DAY = 86400000; const ist = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);
const NOW = Date.now(); const T = ist(NOW); const D = (n) => ist(NOW + n * DAY);
const at = (minAgo) => new Date(NOW - minAgo * 60000).toISOString();

function seed() {
  const conv = (id, phone, mins, vid) => ({ id, vendor_id: vid || 'v1', kind: 'couple_thread', counterparty_phone: phone, last_message_at: at(mins) });
  const msg = (cid, dir, mins, body) => ({ conversation_id: cid, direction: dir, sent_by: dir === 'inbound' ? 'couple' : 'agent', body, channel: 'whatsapp', created_at: at(mins) });
  return {
    leads: [
      { id: 'L1', vendor_id: 'v1', name: 'Riya', phone: '+911', state: 'new', deleted_at: null, created_at: at(10), updated_at: at(5), raw_message: 'r1', wedding_city: 'Udaipur' },
      { id: 'L2', vendor_id: 'v1', name: 'Meera', phone: '+912', state: 'new', deleted_at: null, created_at: at(20), updated_at: at(9), raw_message: 'r2' },
      { id: 'L3', vendor_id: 'v1', name: 'Asha', phone: '+913', state: 'new', deleted_at: null, created_at: at(5), updated_at: at(20), raw_message: 'Website enquiry: Wedding, ' + 'y'.repeat(200) },
      { id: 'L6', vendor_id: 'v1', name: 'Oldest', phone: '+918', state: 'new', deleted_at: null, created_at: at(999), updated_at: at(1), raw_message: 'old' },
      { id: 'L7', vendor_id: 'v1', name: 'Quoted', phone: '+919', state: 'quoted', deleted_at: null, created_at: at(1), updated_at: at(1), raw_message: 'q', wedding_city: 'Goa' },
      { id: 'L4', vendor_id: 'v1', name: 'Gone', phone: '+914', state: 'new', deleted_at: at(1), created_at: at(1), updated_at: at(1) },
      { id: 'L5', vendor_id: 'v1', name: 'Booked', phone: '+915', state: 'booked', deleted_at: null, created_at: at(1), updated_at: at(1) },
      { id: 'X1', vendor_id: 'v2', name: 'Other', phone: '+911', state: 'new', deleted_at: null, created_at: at(0), updated_at: at(1), raw_message: 'not hers' },
    ],
    conversations: [conv('c1', '+911', 1), conv('c2', '+912', 2), conv('cx', '+911', 0, 'v2')],
    messages: [
      msg('c1', 'inbound', 1, 'Is 14 December still free? ' + 'x'.repeat(200)), msg('c1', 'outbound', 30, 'Hello'),
      msg('c2', 'outbound', 2, 'Here is the quote.'), msg('c2', 'inbound', 40, 'Send the quote'),
      msg('cx', 'inbound', 0, 'not hers'),
    ],
    team_members: [{ id: 'm1', vendor_id: 'v1', name: 'Kabir', deleted_at: null }, { id: 'm2', vendor_id: 'v1', name: 'Neha', deleted_at: null }, { id: 'mx', vendor_id: 'v2', name: 'Not hers', deleted_at: null }],
    events: [
      { id: 'e1', vendor_id: 'v1', title: 'Trial', event_date: T, event_time: '11:00', kind: 'trial', state: 'upcoming', deleted_at: null, notes: '\nThe Leela, Gurugram\nbring kit', assigned_member_ids: ['m1', 'm2'], linked_lead_id: 'L1' },
      { id: 'e2', vendor_id: 'v1', title: 'Wedding', event_date: D(7), event_time: null, kind: 'wedding', state: 'upcoming', deleted_at: null, notes: null, assigned_member_ids: [], linked_lead_id: 'L7' },
      { id: 'e3', vendor_id: 'v1', title: 'Too late', event_date: D(8), event_time: null, kind: 'wedding', state: 'upcoming', deleted_at: null, assigned_member_ids: [] },
      { id: 'e4', vendor_id: 'v1', title: 'Yesterday', event_date: D(-1), event_time: null, kind: 'call', state: 'done', deleted_at: null, assigned_member_ids: [] },
      { id: 'e5', vendor_id: 'v1', title: 'Deleted', event_date: D(2), event_time: null, kind: 'call', state: 'upcoming', deleted_at: at(1), assigned_member_ids: [] },
      { id: 'e6', vendor_id: 'v1', title: 'Call', event_date: D(3), event_time: null, kind: 'call', state: 'upcoming', deleted_at: null, notes: null, assigned_member_ids: ['mx'], linked_lead_id: null },
      { id: 'ex', vendor_id: 'v2', title: 'Not hers', event_date: D(1), event_time: null, kind: 'call', state: 'upcoming', deleted_at: null, assigned_member_ids: [] },
    ],
    invoices: [
      { id: 'i1', vendor_id: 'v1', client_name: 'Riya', client_id: 'k1', lead_id: null, amount_total: 60000, amount_paid: 20000, due_date: D(-2), state: 'advance_paid', deleted_at: null },
      { id: 'i2', vendor_id: 'v1', client_name: 'Riya', client_id: 'k1', lead_id: null, amount_total: 30000, amount_paid: 0, due_date: D(9), state: 'unpaid', deleted_at: null },
      { id: 'i3', vendor_id: 'v1', client_name: 'Meera', client_id: null, lead_id: 'L2', amount_total: 45000, amount_paid: 0, due_date: D(5), state: 'unpaid', deleted_at: null },
      { id: 'i4', vendor_id: 'v1', client_name: 'Paid', client_id: null, lead_id: null, amount_total: 10000, amount_paid: 10000, due_date: D(1), state: 'paid', deleted_at: null },
      { id: 'i5', vendor_id: 'v1', client_name: 'No date', client_id: null, lead_id: null, amount_total: 5000, amount_paid: 0, due_date: null, state: 'unpaid', deleted_at: null },
      { id: 'ix', vendor_id: 'v2', client_name: 'Not hers', client_id: null, lead_id: null, amount_total: 99999, amount_paid: 0, due_date: D(1), state: 'unpaid', deleted_at: null },
    ],
  };
}

(async () => {
  const TS = load('src/api/vendor/todaySummary.js');
  const st = makeStore(seed());
  st.meter.waves = 0; st.calls.length = 0;
  const s = TS ? await TS.summaryFor(st, 'v1', NOW) : null;
  const reads = st.calls.length; const waves = st.meter.waves;

  sec('1  the shape, against planted rows (r2: FE-8\'s six gaps, as ruled)');
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 10 (b204): the additions (has_any, parts, crew with confirmation, failed parts null, ten reads) */ ok(() => s && s.today === T && JSON.stringify(Object.keys(s)) === '["today","has_any","parts","counts","reply_to","week","week_capped","money_due"]', '1.1 one answer: today (India, the feed\'s date), counts, reply_to, week, week_capped, money_due');
  ok(() => JSON.stringify(s.counts) === JSON.stringify({ new_leads: 4, open_leads: 5, reply_waiting: 4, reply_waiting_capped: false, events_this_week: 3, invoices_due: 4 }), '1.2 the counts: reply_waiting is the feed\'s lead_unanswered set (new, not deleted), exact, so not capped', JSON.stringify(s && s.counts));
  ok(() => JSON.stringify(s.reply_to.map((r) => r.lead_id)) === '["L3","L1","L2"]', '1.3 reply_to (gap 1): her newest unanswered enquiries first, three at most', JSON.stringify(s && s.reply_to.map((r) => r.lead_id)));
  ok(() => s.reply_to[0].conversation_id === null && s.reply_to[0].last_message.body.startsWith('Website enquiry: Wedding,') && Array.from(s.reply_to[0].last_message.body).length === 140 && s.reply_to[0].last_message.at === seed().leads[2].created_at && s.reply_to[0].responded === false, '1.4 an enquiry with no thread: its raw_message (140 max) at created_at, conversation_id null');
  ok(() => s.reply_to[1].conversation_id === 'c1' && s.reply_to[1].responded === false && s.reply_to[1].last_message.body.startsWith('Is 14 December') && s.reply_to[2].conversation_id === 'c2' && s.reply_to[2].responded === true && s.reply_to[2].last_message.body === 'Here is the quote.', '1.5 with a thread: its newest message; responded is true when that message is hers');
  ok(() => JSON.stringify(s.week.map((e) => e.id)) === '["e1","e6","e2"]' && s.week_capped === false, '1.6 the week (gap 5): today and the seven days after, in India; not deleted; in order; week_capped');
  ok(() => s.week[0].place === 'The Leela, Gurugram' && s.week[2].place === 'Goa' && s.week[1].place === null && /* AMENDED BY LABEL, CE-47 WEB-4 cut 10 (b204): the additions (has_any, parts, crew with confirmation, failed parts null, ten reads) */ JSON.stringify(s.week[0].crew.map((c) => c.name)) === '["Kabir","Neha"]' && JSON.stringify(s.week[1].crew) === '[]' && JSON.stringify(s.week[2].crew) === '[]', '1.7 place (the notes\' first line, else the linked lead\'s city, else null) and crew (her team\'s names; another vendor\'s member is never named) (gap 4)');
  ok(() => JSON.stringify(s.money_due) === JSON.stringify({ total: 40000 + 30000 + 45000 + 5000, count: 3, overdue_count: 1, next: { id: 'i1', client_name: 'Riya', due_date: D(-2), amount_due: 40000 } }), '1.8 money due (gap 6): every owed invoice; count = distinct clients owing (Riya twice is one); the earliest due next', JSON.stringify(s && s.money_due));
  ok(() => !JSON.stringify(s).includes('Not hers') && !JSON.stringify(s).includes('not hers') && !JSON.stringify(s).includes('99999'), '1.9 nothing of another vendor\'s reaches her summary');

  sec('2  the reads: at most nine per call, three stages read together');
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 10 (b204): the additions (has_any, parts, crew with confirmation, failed parts null, ten reads) */ ok(() => reads === 10 && waves === 3, '2.1 ten reads in three stages (five; then threads, linked leads, crew and its confirmations; then the messages)', `reads ${reads}, stages ${waves}`);
  const big = seed(); for (let i = 0; i < 400; i += 1) { big.leads.push({ id: 'B' + i, vendor_id: 'v1', name: 'n', phone: '+8' + i, state: 'new', deleted_at: null, created_at: at(2000 + i), updated_at: at(i) }); big.events.push({ id: 'be' + i, vendor_id: 'v1', title: 't', event_date: D(i % 8), event_time: null, kind: 'call', state: 'upcoming', deleted_at: null, assigned_member_ids: [] }); big.invoices.push({ id: 'bi' + i, vendor_id: 'v1', client_name: 'c' + i, client_id: null, lead_id: null, amount_total: 100, amount_paid: 0, due_date: D(30), state: 'unpaid', deleted_at: null }); }
  const sb = makeStore(big); const s2 = TS ? await TS.summaryFor(sb, 'v1', NOW) : null;
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 10 (b204): the additions (has_any, parts, crew with confirmation, failed parts null, ten reads) */ ok(() => sb.calls.length === 10 && s2.week.length === 20 && s2.week_capped === true && s2.counts.reply_waiting === 404 && s2.money_due.count === 403 && s2.money_due.total === 120000 + 40000, '2.2 with 400 more leads, events and invoices: still nine reads; the week capped at 20 and says so; money due counts every invoice, not a scanned 200', `reads ${sb.calls.length}, week ${s2 && s2.week.length}, due ${s2 && s2.money_due.count}`);
  const sc = makeStore({ leads: [], conversations: [], events: [], invoices: [] }); const s3 = TS ? await TS.summaryFor(sc, 'v1', NOW) : null;
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 10 (b204): the additions (has_any, parts, crew with confirmation, failed parts null, ten reads) */ ok(() => s3 && sc.calls.length === 10 && s3.has_any === false && s3.reply_to.length === 0 && s3.money_due.next === null && s3.week_capped === false, '2.3 a new vendor with nothing yet: the five reads, then the feed\'s five has_any probes; empty parts; has_any false');

  sec('3  a failed part is empty, never a 500 on her first screen');
  const sf = makeStore(seed()); sf.failOn.add('events'); sf.failOn.add('messages');
  const s4 = TS ? await TS.summaryFor(sf, 'v1', NOW) : null;
  /* AMENDED BY LABEL, CE-47 WEB-4 cut 10 (b204): the additions (has_any, parts, crew with confirmation, failed parts null, ten reads) */ ok(() => s4 && s4.week === null && s4.counts === null && s4.reply_to === null && s4.parts.week === false && s4.parts.reply_to === false && s4.parts.counts === false && s4.parts.money_due === true && s4.money_due.count === 3, '3.1 events and messages failing: those parts (and counts, which reads the week) are null with parts saying so; money due whole');

  sec('3b  Check a date (gap 3): the day door also lists the open enquiries for that wedding day');
  const DAYSRC = read('src/api/vendor/day.js');
  ok(() => /router\.get\('\/:vendorId\/:date', requireAuth, resolveVendor\(\{ paramName: 'vendorId' \}\)/.test(DAYSRC) && /\.in\('state', \['new', 'contacted', 'quoted'\]\)\.is\('deleted_at', null\)\.eq\('wedding_date', date\)/.test(DAYSRC) && /enquiries,\n    enquiries_capped,\n  \}\);/.test(DAYSRC), '3b.1 GET /api/v2/vendor/day/:vendorId/:date (the door Check calls) answers enquiries [{ lead_id, name }] and enquiries_capped, from her open leads with that wedding date');
  const dst = makeStore(Object.assign(seed(), { leads: [].concat(seed().leads, Array.from({ length: 25 }, (_, i) => ({ id: 'W' + i, vendor_id: 'v1', name: 'W' + i, state: i % 2 ? 'new' : 'contacted', deleted_at: null, wedding_date: D(30), created_at: at(i) })), [{ id: 'WL', vendor_id: 'v1', name: 'Lost', state: 'lost', deleted_at: null, wedding_date: D(30), created_at: at(1) }, { id: 'WX', vendor_id: 'v2', name: 'Not hers', state: 'new', deleted_at: null, wedding_date: D(30), created_at: at(1) }]) }));
  const legSrc = DAYSRC.slice(DAYSRC.indexOf('let enquiries = []'), DAYSRC.indexOf('  return res.json({'));
  const leg = legSrc ? new Function('supabase', 'vendor', 'date', `return (async () => { ${legSrc}; return { enquiries, enquiries_capped }; })();`) : null;
  const dr = leg ? await leg(dst, { id: 'v1' }, D(30)) : null;
  ok(() => dr && dr.enquiries.length === 20 && dr.enquiries_capped === true && JSON.stringify(Object.keys(dr.enquiries[0])) === '["lead_id","name"]' && !dr.enquiries.some((e) => e.name === 'Lost' || e.name === 'Not hers'), '3b.2 run: twenty at most with the capped flag; lost and another vendor\'s leads never listed');
  const dfail = makeStore(seed()); dfail.failOn.add('leads'); const df = leg ? await leg(dfail, { id: 'v1' }, D(30)) : null;
  ok(() => df && df.enquiries.length === 0 && df.enquiries_capped === false, '3b.3 a failed read is [] and false, never a 500 on the day');

  sec('4  her session only');
  const express = require('express'); const app = express(); if (TS) app.use('/ts', TS);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const anon = await new Promise((res) => http.get(`http://127.0.0.1:${srv.address().port}/ts`, (rs) => { rs.resume(); rs.on('end', () => res(rs.statusCode)); }));
  await new Promise((r) => srv.close(r));
  ok(() => TS && anon === 401, '4.1 no session: 401 from the real requireAuth', anon);
  ok(() => /router\.get\('\/', requireAuth, resolveVendor\(\), asyncHandler/.test(read('src/api/vendor/todaySummary.js')) && /router\.use\('\/today-summary', require\('\.\/todaySummary'\)\);/.test(read('src/api/vendor/core.js')), '4.2 mounted at /api/v2/vendor/today-summary, behind requireAuth and resolveVendor(); the vendor comes from her session, never the request');

  sec('5  the stored Discover line, for new rows');
  const E = read('src/api/couple/enquire.js');
  ok(() => /notes: +'Discover enquiry: found you on the feed\.',/.test(E) && !E.includes("'Discover enquiry — she found you on the feed.'"), '5.1 couple/enquire.js writes "Discover enquiry: found you on the feed." on a new lead; the old line is no longer written');
  ok(() => !/UPDATE|update\(\{ *notes/.test(E.split("'Discover enquiry: found you on the feed.'")[1].slice(0, 400)) && !fs.readdirSync(P('db/migrations')).some((f) => /discover.*note/i.test(f)), '5.2 rows written before keep their line: no backfill, no migration');

  sec('6  mutations, run');
  const SRC = read('src/api/vendor/todaySummary.js');
  const Mv = load('src/api/vendor/todaySummary.js', SRC.replace("safe(sb.from('invoices').select('id, client_name, client_id, lead_id, amount_total, amount_paid, due_date').eq('vendor_id', vendorId)", "safe(sb.from('invoices').select('id, client_name, client_id, lead_id, amount_total, amount_paid, due_date')"));
  const sm = Mv ? await Mv.summaryFor(makeStore(seed()), 'v1', NOW) : null;
  ok(() => sm && Mv !== null && SRC.includes("safe(sb.from('invoices').select('id, client_name, client_id, lead_id, amount_total, amount_paid, due_date').eq('vendor_id', vendorId)") && sm.money_due.total === 120000 + 99999, '6.1 the vendor scope removed from the invoices read: another vendor\'s money reaches hers (1.6 and 1.7 redden)');
  // the five first-stage reads awaited one at a time (each `safe(` in that array gains an `await`)
  const st1 = SRC.slice(SRC.indexOf('const [newC, openC, newest, events, invoices] = await Promise.all(['), SRC.indexOf('const leads3 = Array.isArray'));
  const Ms = load('src/api/vendor/todaySummary.js', SRC.replace(st1, st1.replace(/\n    safe\(/g, '\n    await safe(')));
  const ss = makeStore(seed()); ss.meter.waves = 0; if (Ms) await Ms.summaryFor(ss, 'v1', NOW);
  ok(() => Ms && ss.meter.waves >= 7, '6.2 the first stage awaited one by one: the stages climb past three (2.1 reddens)', ss.meter.waves);

  console.log(`\nb203 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb203 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
