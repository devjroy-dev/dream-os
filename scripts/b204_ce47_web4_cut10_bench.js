// scripts/b204_ce47_web4_cut10_bench.js
// TDW · CE-47 · WEB-4 cut 10 · b204 — THE TODAY SUMMARY'S THREE ADDITIONS (GET /api/v2/vendor/today-summary).
// §1 has_any, the feed's own meaning · §2 week[].crew = [{ name, confirmation }] · §3 parts, and a failed part is null ·
// §4 "responded" said in one line · §5 mutations, run. Red on a tree without the cut.
'use strict';
const fs = require('fs'); const path = require('path'); const Module = require('module');
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
const at = (m) => new Date(NOW - m * 60000).toISOString();
const busy = () => ({
  leads: [{ id: 'L1', vendor_id: 'v1', name: 'Riya', phone: '+911', state: 'new', deleted_at: null, created_at: at(5), updated_at: at(5), raw_message: 'hi' }],
  conversations: [], messages: [],
  team_members: [{ id: 'm1', vendor_id: 'v1', name: 'Kabir', deleted_at: null }, { id: 'm2', vendor_id: 'v1', name: 'Neha', deleted_at: null }, { id: 'm3', vendor_id: 'v1', name: 'Isha', deleted_at: null }, { id: 'mx', vendor_id: 'v2', name: 'Not hers', deleted_at: null }],
  crew_confirmations: [{ event_id: 'e1', member_id: 'm1', status: 'confirmed' }, { event_id: 'e1', member_id: 'm3', status: 'declined' }, { event_id: 'e9', member_id: 'm2', status: 'confirmed' }],
  events: [{ id: 'e1', vendor_id: 'v1', title: 'Trial', event_date: T, event_time: '11:00', kind: 'trial', state: 'upcoming', deleted_at: null, notes: null, assigned_member_ids: ['m1', 'm2', 'm3', 'mx'], linked_lead_id: null },
    { id: 'e2', vendor_id: 'v1', title: 'Call', event_date: D(1), event_time: null, kind: 'call', state: 'upcoming', deleted_at: null, notes: null, assigned_member_ids: [], linked_lead_id: null }],
  invoices: [{ id: 'i1', vendor_id: 'v1', client_name: 'Riya', client_id: 'k1', lead_id: null, amount_total: 1000, amount_paid: 0, due_date: D(3), state: 'unpaid', deleted_at: null }],
  contracts: [], team_tasks: [],
});
const empty = (x) => Object.assign({ leads: [], conversations: [], messages: [], team_members: [], crew_confirmations: [], events: [], invoices: [], contracts: [], team_tasks: [] }, x || {});

(async () => {
  const TS = load('src/api/vendor/todaySummary.js'); const run = async (st) => (TS ? TS.summaryFor(st, 'v1', NOW) : null);
  sec('1  has_any: the feed\'s own meaning (has this vendor EVER had anything)');
  const b = makeStore(busy()); const sb = await run(b);
  ok(() => sb && sb.has_any === true && !b.calls.some((c) => ['contracts', 'team_tasks'].includes(c.table)), '1.1 a vendor with something in hand: true, and none of the feed\'s probes read');
  const lost = makeStore(empty({ leads: [{ id: 'Lx', vendor_id: 'v1', name: 'Lost', state: 'lost', deleted_at: null, created_at: at(9), updated_at: at(9) }] })); const sl = await run(lost);
  ok(() => sl && sl.has_any === true && lost.calls.some((c) => c.table === 'team_tasks'), '1.2 only a lost lead (nothing on Today): the probes run and say true, as the feed\'s do');
  const none = makeStore(empty()); const sn = await run(none);
  ok(() => sn && sn.has_any === false && none.calls.length === 10, '1.3 a vendor with nothing ever: false, after the five reads and the five probes (ten)', none.calls.length);
  const pf = makeStore(empty()); pf.failOn.add('contracts'); const sp = await run(pf);
  ok(() => sp && sp.has_any === true, '1.4 a failed probe is not a no: true, as the feed does');

  sec('2  week[].crew = [{ name, confirmation }]');
  const e1 = sb && sb.week.find((e) => e.id === 'e1');
  ok(() => JSON.stringify(e1.crew) === JSON.stringify([{ name: 'Kabir', confirmation: 'confirmed' }, { name: 'Neha', confirmation: 'pending' }, { name: 'Isha', confirmation: 'declined' }]), '2.1 each member with the crew read\'s confirmation (confirmed, declined); no row reads pending; another vendor\'s member never named', e1 && JSON.stringify(e1.crew));
  ok(() => e1 && typeof e1.crew[0] === 'object' && JSON.stringify(sb.week.find((e) => e.id === 'e2').crew) === '[]', '2.2 an event with no crew: []');
  ok(() => /\.from\('crew_confirmations'\)\.select\('event_id, member_id, status'\)\.in\('event_id', evIds\)/.test(read('src/api/vendor/todaySummary.js')), '2.3 the confirmations are read as bands.js reads them (event_id, member_id, status by event)');

  sec('3  parts, and a failed part is null (never 0 or [])');
  ok(() => sb && JSON.stringify(sb.parts) === '{"counts":true,"reply_to":true,"week":true,"money_due":true}', '3.1 all reads succeed: every part true');
  const cases = [['leads', { counts: false, reply_to: false, week: true, money_due: true }], ['invoices', { counts: false, reply_to: true, week: true, money_due: false }],
    ['crew_confirmations', { counts: true, reply_to: true, week: false, money_due: true }], ['events', { counts: false, reply_to: true, week: false, money_due: true }]];
  const results = [];
  for (const [tbl, want] of cases) { const st = makeStore(busy()); st.failOn.add(tbl); const r = await run(st); results.push([tbl, r]); }
  ok(() => results.every(([tbl, r], i) => JSON.stringify(r.parts) === JSON.stringify(cases[i][1])), '3.2 each failure marks exactly the parts that stand on it (leads; invoices; crew confirmations; events)', JSON.stringify(results.map(([t, r]) => [t, r && r.parts])));
  ok(() => results.every(([, r]) => Object.entries(r.parts).every(([k, v]) => v || (r[k] === null && (k !== 'week' || r.week_capped === null)))), '3.3 a failed part comes back null (and week_capped with the week), never 0 or [], so the app can say "could not load"');
  const ok3 = results.find(([t]) => t === 'invoices')[1];
  ok(() => Array.isArray(ok3.reply_to) && Array.isArray(ok3.week) && ok3.money_due === null && ok3.counts === null, '3.4 the parts that stand are whole beside a failed one');

  sec('4  "responded", said in one line');
  ok(() => /responded: true when the newest message on the WhatsApp thread with that number went OUT from her side \(her, her team\n\/\/   or Eliza\); false when the client wrote last or there is no thread yet\./.test(read('src/api/vendor/todaySummary.js')), '4.1 the door says what responded means: the newest message on that thread went out from her side (her, her team or Eliza); false when the client wrote last or there is no thread');

  sec('5  mutations, run');
  const SRC = read('src/api/vendor/todaySummary.js');
  const M1 = load('src/api/vendor/todaySummary.js', SRC.replace("has_any = probes.some((p) => !p.ok) || probes.some", 'has_any = probes.some'));
  const m1s = makeStore(empty()); m1s.failOn.add('contracts'); m1s.failOn.add('leads'); m1s.failOn.add('invoices'); m1s.failOn.add('events'); m1s.failOn.add('team_tasks'); const m1 = M1 ? await M1.summaryFor(m1s, 'v1', NOW) : null;
  ok(() => SRC.includes('has_any = probes.some((p) => !p.ok) || probes.some') && m1 && m1.has_any === false, '5.1 a failed probe read as no: a working vendor would be shown the first-run manual (1.4 reddens)');
  const M2 = load('src/api/vendor/todaySummary.js', SRC.replace("|| 'pending' }))", '}))'));
  const m2 = M2 ? await M2.summaryFor(makeStore(busy()), 'v1', NOW) : null;
  ok(() => SRC.includes("|| 'pending' }))") && m2 && m2.week[0].crew[1].confirmation === undefined, '5.2 the pending default removed: a member with no row has no confirmation (2.1 reddens)');
  const M3 = load('src/api/vendor/todaySummary.js', SRC.replace('reply_to: parts.reply_to ? reply_to : null,', 'reply_to,'));
  const m3s = makeStore(busy()); m3s.failOn.add('leads'); const m3 = M3 ? await M3.summaryFor(m3s, 'v1', NOW) : null;
  ok(() => SRC.includes('reply_to: parts.reply_to ? reply_to : null,') && m3 && Array.isArray(m3.reply_to) && m3.reply_to.length === 0, '5.3 a failed part sent as []: the app would say "nothing" when it could not load (3.3 reddens)');

  console.log(`\nb204 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb204 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
