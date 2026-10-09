'use strict';
// scripts/b299_ptn_a2_4_notices_bench.js · CE-47 · PTN-A2-4 · rung b299 · THE TWO NOTICES AND THE HAND MESSAGE.
// §1 the hand message: version A, the founder's words of 8 Oct 2026, word for word, with the admin's own first name; NO
//    message without a name (never a gap, never "undefined"); a name holding digits or an address is refused; the role in
//    words, never doubled ("a a model").
// §2 the forward doors: GET /forward/:id?sender= and POST /forward { sender } make the messages; without a name every
//    message is null and the page is told, in one line, to ask for the name.
// §3 tdw_partner_picked at the Contact door: on a NEW pick only, to a partner that said yes, from the marketing line, with
//    the vendor, the person and the date; every gate (no yes, blocked, stopped, paused, outside 9 am to 8 pm, lane not
//    open) holds it; a repeat tap sends nothing; the vendor's answer is the same either way.
// §4 tdw_collab_request_sent at the forward door: to a vendor on TDW, from the VENDOR line, with what she needs, the city,
//    the date and how many partners; an outside vendor, the window, a lane not open and a missing number each hold it, and
//    the admin reads why in one line.
// §5 the registry: collab_request_sent goes from the vendor line; the filed body is unchanged.
// --mutate: four production mutations through scripts/lib/mutation_guard.js; each must redden its cell. Refuses (exit 3)
// under 512 MB free (F-44.419). Fixed clocks, no network. THE EXIT IS THE VERDICT: 0 green, 1 red, 2 error, 3 refused.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..'); const R = (p) => path.join(ROOT, p);
const guard = require('./lib/mutation_guard');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
process.env.PARTNER_SESSION_SECRET = 'p'.repeat(48);
let pass = 0; let fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 300) + ']'}`); } };
const sec = (t) => console.log(`\n§${t}`);

if (!process.env.B299_MUT_CHILD) guard.recoverOrRefuse(ROOT, 'b299');
{
  let free = Infinity; try { const s = fs.statfsSync(ROOT); free = s.bavail * s.bsize; } catch (_e) { /* no statfs */ }
  if (free < 512 * 1024 * 1024) { console.log(`b299: REFUSED. ${Math.round(free / 1048576)} MB free; a mutation series needs 512 MB (F-44.419).`); process.exit(3); }
}
const MUTS = [
  { rel: 'src/lib/partners/forward.js', from: '  if (!s) return null;\n', to: '', reddens: /FAIL  1\.2/ },
  { rel: 'src/lib/partners/wa.js', from: "  const why = !saidYes(org) ? 'no_yes' : org.check_state", to: "  const why = false ? 'no_yes' : org.check_state", reddens: /FAIL  3\.2/ },
  { rel: 'src/api/vendor/partnerContact.js', from: '  if (rec && !rec.repeat) setImmediate(', to: '  if (rec) setImmediate(', reddens: /FAIL  3\.5/ },
  { rel: 'src/lib/partners/wa.js', from: "    await sendWa({ line: 'vendor', to: phone, templateKey: 'collab_request_sent'", to: "    await sendWa({ line: 'marketing', to: phone, templateKey: 'collab_request_sent'", reddens: /FAIL  4\.1/ },
];
if (!process.env.B299_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(m.rel), 'utf8').includes(m.from)) { console.log(`STOP — a mutation anchor is missing from ${m.rel}; restore it with git checkout before running b299.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const before = guard.sha(fs.readFileSync(R(m.rel), 'utf8')); let red = false; let out = '';
    const h = guard.apply(ROOT, m.rel, m.from, m.to, 'b299');
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B299_MUT_CHILD: '1' }, timeout: 300000 }); out = r.stdout || ''; red = r.status !== 0 && m.reddens.test(out); }
    finally { h.restore(); }
    ok(red, `M${i + 1} ${m.rel} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`, red ? undefined : (out.match(/FAIL .*/g) || ['no red']).join(' | '));
    ok(guard.sha(fs.readFileSync(R(m.rel), 'utf8')) === before && !fs.existsSync(guard.pendingDir(ROOT)), `M${i + 1} restored byte for byte, no marker left`);
  }
  console.log(`\nb299 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

const { fakeDb, callRoute } = require('./lib/ptn_fakedb');
const NOON = new Date('2026-10-12T06:30:00Z');   // 12:00 IST
const NIGHT = new Date('2026-10-12T16:30:00Z');  // 22:00 IST
const O1 = crypto.randomUUID(); const V1 = crypto.randomUUID(); const U1 = crypto.randomUUID(); const POST = crypto.randomUUID(); const INT = crypto.randomUUID(); const C1 = crypto.randomUUID();
const org = (x = {}) => ({ id: O1, name: 'Model Connect', check_state: 'unchecked', calls_email: 'bookings@modelconnect.in', whatsapp_opt: true, whatsapp_phone: '+919811100021',
  whatsapp_opt_at: '2026-10-09T05:00:00.000Z', send_state: 'active', paused_until: null, ...x });
const ready = async () => ({ status: 'approved' }); const shut = async () => ({ status: 'pending' });
const VERSION_A = 'Hi Model Connect, this is Dev from The Dream Wedding. One of our vendors, Aanya Makeup Studio, is looking for a model for a shoot on 18 October 2026 in Delhi NCR, and I thought of you. The details are here, and you can suggest someone in a minute: https://thedreamwedding.in/request/TOKEN\nHappy to answer anything here on WhatsApp too.';

(async () => {
  const fwd = require(R('src/lib/partners/forward'));
  const wa = require(R('src/lib/partners/wa'));
  const T = require(R('src/lib/templates'));

  sec('1  the hand message, version A');
  const req = { role: 'model', event_date: '2026-10-18', city: 'Delhi NCR' }; const face = { name: 'Aanya Makeup Studio' };
  ok(fwd.messageFor({ contactName: 'Model Connect', face, request: req, token: 'TOKEN', sender: 'Dev' }) === VERSION_A, '1.1 version A, the founder\'s words, word for word, with the admin\'s first name');
  const none = ['', '   ', null, undefined].map((s) => fwd.messageFor({ contactName: 'Model Connect', face, request: req, token: 'TOKEN', sender: s }));
  ok(none.every((m) => m === null), '1.2 no name: no message at all (never a gap, never "undefined")', JSON.stringify(none));
  ok(['Dev 98111 00021', 'dev@thedreamwedding.in', '9811100021', 'D'.repeat(31)].every((s) => fwd.cleanSender(s) === null) && fwd.cleanSender('  Swati  ') === 'Swati' && fwd.cleanSender("D'Souza-Roy") === "D'Souza-Roy",
    '1.3 a name holding digits or an address is refused; spaces trimmed; a hyphen and an apostrophe allowed');
  ok(fwd.needsWords('model') === 'a model' && fwd.needsWords('a model') === 'a model' && fwd.needsWords('2 stylists') === '2 stylists' && fwd.needsWords('editor') === 'an editor', '1.4 the role in words, never doubled');

  sec('2  the forward doors');
  const admin = require(R('src/api/admin/partners'));
  admin._deps = { now: () => NOON, capGet: ready, sendWa: async () => ({ sent: true }) };
  const vend = { id: V1, business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua', user_id: U1 };
  const world = () => fakeDb({ vendors: [vend], users: [{ id: U1, phone: '919888294440' }], partner_contacts: [{ id: C1, name: 'Model Connect', kind: 'agency', phone: '+919811100021', how_we_know: 'Met at a show', knows_tdw: true }],
    forward_requests: [], forward_recipients: [], prospects: [], collab_posts: [], collab_post_items: [] });
  let db = world();
  let sentWa = [];
  admin._deps.sendWa = async (o) => { sentWa.push(o); return { sent: true }; };
  const body = { asked: true, vendor_id: V1, role: 'model', city: 'Delhi NCR', event_date: '2099-10-18', budget_from: 3000, budget_to: 5000, pay_kind: 'paid', contact_ids: [C1] };
  let r2;
  r2 = await callRoute(admin, 'post', '/forward', { body: { ...body, sender: 'Dev' }, app: { locals: { supabase: db } } });
  const m2 = r2.body && r2.body.recipients && r2.body.recipients[0];
  ok(r2.code === 200 && m2 && /^Hi Model Connect, this is Dev from The Dream Wedding\. One of our vendors, Aanya Makeup Studio, is looking for a model for a shoot on 18 October 2099 in Delhi NCR, and I thought of you\. The details are here, and you can suggest someone in a minute: https:\/\/thedreamwedding\.in\/request\/[A-Za-z0-9_-]+\nHappy to answer anything here on WhatsApp too\.$/.test(m2.message) && r2.body.need_sender === null,
    '2.1 POST /forward with the name: each person\'s message is version A', JSON.stringify(r2.body).slice(0, 300));
  const rid = db.tables.forward_requests[0].id;
  const g0 = await callRoute(admin, 'get', '/forward/:id', { params: { id: rid }, query: {}, app: { locals: { supabase: db } } });
  const g1 = await callRoute(admin, 'get', '/forward/:id', { params: { id: rid }, query: { sender: 'Swati' }, app: { locals: { supabase: db } } });
  ok(g0.body.recipients[0].message === null && g0.body.need_sender === 'Write your first name before you make the messages. TDW puts it in each message.' && /this is Swati from/.test(g1.body.recipients[0].message) && g1.body.need_sender === null,
    '2.2 GET /forward/:id: no name, no message and one line asking for it; with a name, the message', JSON.stringify([g0.body.need_sender, g1.body.recipients[0].message && g1.body.recipients[0].message.slice(0, 40)]));

  sec('4  tdw_collab_request_sent at the forward door');
  const c4 = sentWa.find((o) => o.templateKey === 'collab_request_sent') || {};
  ok(c4.line === 'vendor' && c4.to === '919888294440' && c4.vars && c4.vars.needs === 'a model' && c4.vars.city === 'Delhi NCR' && c4.vars.date === '18 October 2099' && c4.vars.count === '1'
    && r2.body.vendor_notice && r2.body.vendor_notice.sent === true && r2.body.vendor_notice.line === 'TDW told the vendor on WhatsApp that her request has gone to partners.',
    '4.1 to the vendor on TDW, from the VENDOR line, with what she needs, the city, the date and how many partners; the admin reads that she was told', JSON.stringify({ c4, n: r2.body.vendor_notice }));
  const notice = async (b, deps) => { const d = world(); admin._deps = { now: () => NOON, capGet: ready, sendWa: async () => ({ sent: true }), ...deps };
    const out = await callRoute(admin, 'post', '/forward', { body: { ...body, sender: 'Dev', ...b }, app: { locals: { supabase: d } } }); return out.body.vendor_notice || out.body; };
  const n1 = await notice({ vendor_id: undefined, outside_handle: 'aanya.mua', outside_phone: '+919811100007', role: 'a model' }, {});
  const n2 = await notice({}, { now: () => NIGHT });
  const n3 = await notice({}, { capGet: shut });
  const n4 = await notice({}, { sendWa: async () => { const e = new Error('x'); e.code = 'opted_out'; throw e; } });
  ok(n1.sent === false && n1.line === 'This vendor is not on TDW, so TDW did not message her. Tell her yourself.', '4.2 an outside vendor: not messaged; the admin reads it', JSON.stringify(n1));
  ok(n2.sent === false && n2.line === 'TDW did not message the vendor, because TDW sends WhatsApp messages only between 9 am and 8 pm.', '4.3 at 10 pm: not messaged, in plain words');
  ok(n3.sent === false && n3.line === 'TDW did not message the vendor, because Meta has not approved the message yet.', '4.4 the lane not open: not messaged');
  ok(n4.sent === false && n4.line === 'TDW could not message the vendor on WhatsApp. Tell her yourself.', '4.5 a refusal (her number opted out): not messaged, and the request stands');

  sec('3  tdw_partner_picked at the Contact door');
  const sent3 = []; const deps3 = { now: () => NOON, capGet: ready, sendWa: async (o) => { sent3.push(o); return { sent: true }; } };
  const p1 = await wa.notifyPicked(null, { org: org(), vendorName: 'Aanya Makeup Studio', person: 'Riya Sharma', dateWords: '18 October 2026' }, deps3);
  ok(p1.sent === true && sent3.length === 1 && sent3[0].line === 'marketing' && sent3[0].templateKey === 'partner_picked' && sent3[0].to === '+919811100021'
    && sent3[0].vars.vendor === 'Aanya Makeup Studio' && sent3[0].vars.person === 'Riya Sharma' && sent3[0].vars.date === '18 October 2026', '3.1 a partner that said yes hears it from the marketing line, with the vendor, the person and the date', JSON.stringify(sent3[0]));
  const held = {};
  for (const [k, o, d] of [['no_yes', org({ whatsapp_opt_at: null }), {}], ['blocked', org({ check_state: 'blocked' }), {}], ['stopped', org({ send_state: 'stopped' }), {}],
    ['paused', org({ paused_until: '2026-10-20T00:00:00Z' }), {}], ['window', org(), { now: () => NIGHT }], ['not_open', org(), { capGet: shut }]]) {
    const before = sent3.length; const r = await wa.notifyPicked(null, { org: o, vendorName: 'A', person: 'B', dateWords: 'C' }, { ...deps3, ...d }); held[k] = r.why === k && sent3.length === before;
  }
  ok(held.no_yes, '3.2 a partner with no yes: nothing sent', JSON.stringify(held));
  ok(held.blocked && held.stopped && held.paused && held.window && held.not_open, '3.3 blocked, stopped, paused, 10 pm, lane not open: each holds it', JSON.stringify(held));
  const contact = require(R('src/api/vendor/partnerContact'));
  const sent5 = []; contact._deps = { now: () => NOON, capGet: ready, sendWa: async (o) => { sent5.push(o); return { sent: true }; } };
  const dbc = fakeDb({ collab_interest: [{ id: INT, post_id: POST, source: 'partner', partner_id: O1, send_id: crypto.randomUUID(), display_name: 'Riya Sharma' }], collab_posts: [{ id: POST, vendor_id: V1, event_date: '2026-10-18' }],
    partner_orgs: [org()], partner_connections: [] });
  // e-275: every wait is on the thing itself, bounded. The notice starts in the setImmediate queued during the answer, and
  // its FIRST act is a read of collab_posts; one setImmediate turn after the answer it has started or it never will.
  // The notice's first read is collab_posts.select('event_date'); the Contact door's own reads are not counted.
  const postReads = []; { const q = dbc.from; dbc.from = (t) => { const b = q(t); if (t === 'collab_posts' && b && typeof b.select === 'function') { const s = b.select.bind(b); b.select = (c, ...r) => { if (c === 'event_date') postReads.push(c); return s(c, ...r); }; } return b; }; }
  const turn = () => new Promise((r) => setImmediate(r));
  const until = async (f, ms = 5000) => { const end = Date.now() + ms; while (!f() && Date.now() < end) await new Promise((r) => setTimeout(r, 5)); return f(); };
  const tap = () => callRoute(contact, 'post', '/partner-contact/:interest_id', { params: { interest_id: INT }, vendor: { id: V1, business_name: 'Aanya Makeup Studio' }, app: { locals: { supabase: dbc } } });
  const a1 = await tap(); await turn(); await until(() => sent5.length >= 1);
  ok(a1.code === 200 && a1.body.kind === 'whatsapp' && /^https:\/\/wa\.me\/919811100021\?text=/.test(a1.body.href) && sent5.length === 1 && sent5[0].templateKey === 'partner_picked' && sent5[0].vars.date === '18 October 2026',
    '3.4 the first tap: her answer as before (the partner\'s WhatsApp link), and ONE notice to the partner after it', JSON.stringify({ a1: a1.body.kind, n: sent5.length }));
  const readsBefore = postReads.length;
  const a2 = await tap(); await turn();
  ok(a2.code === 200 && a2.body.kind === 'whatsapp' && postReads.length === readsBefore && sent5.length === 1, '3.5 a second tap on the same suggestion: the same answer, and NO second notice', JSON.stringify({ n: sent5.length, started: postReads.length - readsBefore }));
  let threw = false; contact._deps = { now: () => NOON, capGet: ready, sendWa: async () => { threw = true; throw new Error('meta down'); } };
  const dbd = fakeDb({ collab_interest: [{ id: INT, post_id: POST, source: 'partner', partner_id: O1, send_id: crypto.randomUUID(), display_name: 'Riya Sharma' }], collab_posts: [{ id: POST, vendor_id: V1, event_date: '2026-10-18' }], partner_orgs: [org()], partner_connections: [] });
  const a3 = await callRoute(contact, 'post', '/partner-contact/:interest_id', { params: { interest_id: INT }, vendor: { id: V1, business_name: 'Aanya Makeup Studio' }, app: { locals: { supabase: dbd } } }); await turn(); await until(() => threw); await turn();
  ok(a3.code === 200 && a3.body.kind === 'whatsapp' && threw, '3.6 a notice that fails never touches her answer');

  sec('5  the registry');
  ok(T.TEMPLATES.collab_request_sent.line === 'vendor' && T.TEMPLATES.partner_picked.line === 'marketing' && T.TEMPLATES.collab_request_sent.body === 'Your request for {{1}} in {{2}} on {{3}} has gone to {{4}} partners. When someone is suggested, you will see it on your call in The Dream Wedding.',
    '5.1 the vendor\'s notice goes from the vendor line, the partner\'s from the marketing line; the filed body is unchanged');

  console.log(`\nb299: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('BENCH THREW', e && e.stack); process.exit(1); });
