'use strict';
// scripts/b295_ptn_a2_1b_queue_bench.js · CE-47 · PTN-A2-1b · rung b295 · waiting and sent, every partner; trying a row again.
// A2-1c (amended by label): the revive is 0219's one statement; the fake answers sb.rpc with its meaning; M1 mutates the
// function's WHERE. §1 THE GUARD over real HTTP: both new doors sit behind requireAdmin with every other /admin/partners door; no token, a
//    vendor's token and a partner's token are each refused; an admin's opens. §2 the order: "sends" is never read as a
//    partner id, and a real id still opens its partner. §3 the list: waiting by default, newest first; failed, sent, all;
//    a bad show refused; the lane is a column (a WhatsApp row reads "WhatsApp" in the same list); a failure in plain words
//    with Resend's own beside it; NO phone and no email of anyone in the raw body. §4 the revive's refusals, each writing
//    nothing. §5 THE ONE GUARDED UPDATE: two presses at once make one queued row. §6 a revived row still meets 9 am to
//    8 pm and the daily cap, through the real drain. §7 three refusals are never the end: fail, revive, fail, revive.
//    §8 the plain words against Resend's documented messages. §9 the per-partner door's new fields.
// --mutate: four production mutations through scripts/lib/mutation_guard.js (kept copy and marker first; recovered at
// every start; restored by sha), each must redden its cell. F-44.419: the run refuses (exit 3) with under 512 MB free.
// No clock in any cell (fixed dates), no network beyond 127.0.0.1. THE EXIT IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..'); const R = (p) => path.join(ROOT, p);
const guard = require('./lib/mutation_guard');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
process.env.ADMIN_SESSION_SECRET = 'a'.repeat(48);
process.env.PARTNER_SESSION_SECRET = 'p'.repeat(48);
let pass = 0; let fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 300) + ']'}`); } };
const sec = (t) => console.log(`\n§${t}`);

// F-44.258 / F-44.419: recover any mutation a killed run left, before anything is read; refuse on a low disk.
// A --mutate CHILD skips recovery: the marker it would find is its parent's live mutation, the very thing under test.
if (!process.env.B295_MUT_CHILD) guard.recoverOrRefuse(ROOT, 'b295');
{
  let free = Infinity; try { const s = fs.statfsSync(ROOT); free = s.bavail * s.bsize; } catch (_e) { /* no statfs: no refusal */ }
  if (free < 512 * 1024 * 1024) { console.log(`b295: REFUSED. ${Math.round(free / 1048576)} MB free; a mutation series needs 512 MB (F-44.419).`); process.exit(3); }
}
const MUTS = [
  // A2-1c: the guard now lives in 0219's partner_send_revive; M1 takes "AND state = 'failed'" out of ITS WHERE.
  { rel: 'db/migrations/0219_partner_send_log.sql', from: "     WHERE id = p_send AND state = 'failed'\n", to: "     WHERE id = p_send\n", reddens: /FAIL  5\.3/ },
  { rel: 'src/api/admin/partners.js', from: "router.get('/sends', asyncHandler(", to: "router.get('/sends-moved-away', asyncHandler(", reddens: /FAIL  2\.1/ },
  { rel: 'src/lib/partners/queue.js', from: "  if (!c || !calls.isOpen(c.post, now)) return { ok: false, status: 409, error: REVIVE.closed };\n", to: '', reddens: /FAIL  4\.4/ },
  { rel: 'src/lib/partners/words.js', from: "  [/domain is not verified/i, 'The sending domain is not verified in Resend yet.'],\n", to: '', reddens: /FAIL  8\.1/ },
];
if (!process.env.B295_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(m.rel), 'utf8').includes(m.from)) { console.log(`STOP — a mutation anchor is missing from ${m.rel}; restore it with git checkout before running b295.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const before = guard.sha(fs.readFileSync(R(m.rel), 'utf8')); let red = false; let out = '';
    const h = guard.apply(ROOT, m.rel, m.from, m.to, 'b295');
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B295_MUT_CHILD: '1' }, timeout: 120000 }); out = r.stdout || ''; red = r.status !== 0 && m.reddens.test(out); }
    finally { h.restore(); }
    ok(red, `M${i + 1} ${m.rel} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`, red ? undefined : (out.match(/FAIL .*/g) || ['no red']).join(' | '));
    ok(guard.sha(fs.readFileSync(R(m.rel), 'utf8')) === before && !fs.existsSync(guard.pendingDir(ROOT)), `M${i + 1} ${m.rel} restored byte for byte, no marker left`);
  }
  console.log(`\nb295 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

const { fakeDb, callRoute } = require('./lib/ptn_fakedb');
const NOW = new Date('2026-10-12T06:30:00Z');     // 12:00 IST, a Monday
const LATE = new Date('2026-10-12T16:30:00Z');    // 22:00 IST
const O1 = crypto.randomUUID(); const O2 = crypto.randomUUID(); const V1 = crypto.randomUUID(); const POST = crypto.randomUUID();
const org = (x = {}) => ({ id: O1, name: 'Model Connect', kind: 'model_agency', calls_email: 'bookings@modelconnect.in', whatsapp_opt: true, whatsapp_phone: '+919811100021',
  daily_cap: 10, send_state: 'active', paused_until: null, check_state: 'unchecked', cities: ['Delhi NCR'], roles: ['model'], wants: ['calls'], pay_rule: 'paid_and_credit', ...x });
const post = (x = {}) => ({ id: POST, vendor_id: V1, requirement_type: 'model', event_date: '2026-10-18', city: 'Delhi NCR', pay_kind: 'paid', budget_from: 3000, budget_to: 5000,
  details: 'Call me on 9811100007 or aanya@mail.com', state: 'open', first_look_until: null, ...x });
const vendor = { id: V1, business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua', phone: '+919811100007', email: 'aanya@mail.com' };
const RESEND_DOMAIN = 'resend 403: The `thedreamwedding.in` domain is not verified. Please, add and verify your domain.';
const send = (x = {}) => ({ id: crypto.randomUUID(), partner_id: O1, post_id: POST, channel: 'email', state: 'queued', why: null, attempts: 0, not_before: '2026-10-12T00:00:00.000Z',
  sent_at: null, created_at: '2026-10-12T01:00:00.000Z', token_hash: crypto.randomBytes(32).toString('hex'), ...x });
// A2-1c: the revive is one statement in the database (0219's partner_send_revive). The fake answers sb.rpc with the
// function's own meaning: move the row only WHERE id = p_send AND state = 'failed', write ONE log line from that
// RETURNING, and return the id, or null when nothing moved. not_before takes the bench's clock (the database's now()).
let CLOCK = null;
function withRpc(db) {
  db.rpc = async (name, args) => {
    db.writes.push({ name: 'rpc:' + name, args });
    if (name !== 'partner_send_revive') return { data: null, error: { message: `no function ${name}` } };
    const r = (db.tables.partner_sends || []).find((x) => x.id === args.p_send && x.state === 'failed');
    if (!r) return { data: null, error: null };
    Object.assign(r, { state: 'queued', attempts: 0, not_before: (CLOCK || NOW).toISOString(), why: String(args.p_note).slice(0, 300) });
    (db.tables.partner_send_log ||= []).push({ id: crypto.randomUUID(), send_id: r.id, at: (CLOCK || NOW).toISOString(), kind: 'retried', state: 'queued', channel: r.channel, attempts: 0, why: r.why, by_whom: String(args.p_by).slice(0, 120) });
    return { data: r.id, error: null };
  };
  return db;
}
const world = (sends, o = {}, p = {}) => withRpc(fakeDb({ partner_orgs: [org(o), org({ id: O2, name: 'Studio Noor', calls_email: 'desk@noor.in', whatsapp_phone: '+919811100022' })],
  collab_posts: [post(p)], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }], vendors: [vendor], partner_sends: sends, partner_answers: [], partner_reports: [], partner_connections: [], partner_send_log: [] }));
const KEY = { RESEND_API_KEY: 're_test', PARTNER_SESSION_SECRET: process.env.PARTNER_SESSION_SECRET };
const scan = (b) => { const s = JSON.stringify(b).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
  return { email: s.match(/[^\s@"'<>:/`]+@[^\s@"'<>`]+\.[a-z]{2,}/gi) || [], phone: (s.match(/\+?\d[\d\s-]{8,}\d/g) || []).filter((m) => m.replace(/\D/g, '').length >= 10) }; };

(async () => {
  const express = require('express');
  const adminRouter = require(R('src/api/admin/partners'));
  const queue = require(R('src/lib/partners/queue'));
  const words = require(R('src/lib/partners/words'));
  const sends = require(R('src/lib/partners/sends'));
  const { mintAdminSession } = require(R('src/lib/adminSession'));
  const { mintPartnerSession } = require(R('src/lib/partners/partnerSession'));

  sec('1  the guard, over real HTTP');
  const app = express(); app.use(express.json());
  const db1 = world([send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3 })]);
  app.locals.supabase = db1;
  app.use('/api/v2/admin/partners', adminRouter);
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v2/admin/partners`;
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const vendorJwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: V1, role: 'authenticated', aud: 'authenticated' })}.${crypto.createHmac('sha256', 'someone-elses').update('x').digest('base64url')}`;
  const partnerTok = mintPartnerSession({ userId: crypto.randomUUID() });
  const adminTok = mintAdminSession();
  const call = async (method, p, tok) => { const r = await fetch(base + p, { method, headers: tok ? { authorization: `Bearer ${tok}` } : {} }); let body = null; try { body = await r.json(); } catch (_e) { /* none */ } return { code: r.status, body }; };
  const sid = db1.tables.partner_sends[0].id;
  // requireAdmin, as it stands: no credential is 401 "Admin auth required."; a credential that is not an admin session is 403.
  for (const [n, who, tok, code] of [[1, 'no token', null, 401], [2, "a vendor's token", vendorJwt, 403], [3, "a partner's token", partnerTok, 403]]) {
    const a = await call('GET', '/sends?show=all', tok); const b = await call('POST', `/sends/${sid}/retry`, tok);
    ok(a.code === code && b.code === code && a.body && a.body.ok === false && !('sends' in a.body) && db1.tables.partner_sends[0].state === 'failed',
      `1.${n} ${who}: both doors refused (${code}), no list, nothing written`, JSON.stringify([a.code, b.code, a.body]));
  }
  const adm = await call('GET', '/sends?show=all', adminTok);
  ok(adm.code === 200 && adm.body && Array.isArray(adm.body.sends) && adm.body.sends.length === 1, '1.4 an admin\'s token opens the list', JSON.stringify(adm).slice(0, 200));

  sec('2  the order: "sends" is never a partner id');
  const viaHttp = await call('GET', '/sends', adminTok);
  ok(viaHttp.code === 200 && viaHttp.body.show === 'waiting' && Array.isArray(viaHttp.body.sends), '2.1 GET /sends is the list (not "No such partner.")', JSON.stringify(viaHttp.body).slice(0, 160));
  const real = await call('GET', `/${O1}`, adminTok);
  ok(real.code === 200 && real.body.partner && real.body.partner.id === O1, '2.2 a real partner id still opens its partner', JSON.stringify(real.body).slice(0, 160));
  const notId = await call('GET', '/not-a-uuid', adminTok);
  ok(notId.code === 404, '2.3 a word that is not an id is still a 404, not the list');
  await new Promise((r) => server.close(r));

  sec('3  the list');
  const rows = [send({ state: 'held_no_key', why: words.W.noKey, created_at: '2026-10-12T03:00:00.000Z' }), send({ state: 'queued', created_at: '2026-10-12T05:00:00.000Z' }),
    send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3, created_at: '2026-10-12T04:00:00.000Z' }), send({ state: 'sent', sent_at: '2026-10-12T02:00:00.000Z', created_at: '2026-10-12T02:00:00.000Z' }),
    send({ partner_id: O2, channel: 'whatsapp', state: 'held_window', why: words.W.window, created_at: '2026-10-12T06:00:00.000Z' })];
  let db = world(rows.map((r) => ({ ...r })));
  const w = await queue.listSends(db, { now: NOW });
  ok(w.ok && w.show === 'waiting' && w.sends.length === 3 && w.sends.map((s) => s.state).join() === 'held_window,queued,held_no_key', '3.1 waiting by default: queued and held rows, newest first', JSON.stringify(w.sends && w.sends.map((s) => s.state)));
  const wa = w.sends[0];
  ok(wa.channel === 'whatsapp' && wa.lane_words === 'WhatsApp' && wa.partner.name === 'Studio Noor' && w.sends[1].lane_words === 'Email', '3.2 the lane is a column: a WhatsApp row sits in the same list, in words');
  ok(w.sends[1].call && w.sends[1].call.who === 'Aanya Makeup Studio' && w.sends[1].call.what === '2 models' && w.sends[1].call.city === 'Delhi NCR' && /18 October 2026/.test(w.sends[1].call.date_words), '3.3 each row: the partner and the call (who, what, city, date)', JSON.stringify(w.sends[1].call));
  const f = await queue.listSends(db, { show: 'failed', now: NOW });
  ok(f.sends.length === 1 && f.sends[0].state_words === 'Could not be sent' && f.sends[0].why_words === 'The sending domain is not verified in Resend yet.' && f.sends[0].resend_words === RESEND_DOMAIN && f.sends[0].can_retry === true && f.sends[0].attempts === 3,
    '3.4 failed: "Could not be sent", the reason in plain words, Resend\'s own words beside it, tries made, can be tried again', JSON.stringify(f.sends[0]));
  ok((await queue.listSends(db, { show: 'sent' })).sends.length === 1 && (await queue.listSends(db, { show: 'all' })).sends.length === 5, '3.5 sent and all');
  const bad = await queue.listSends(db, { show: 'everything' });
  ok(bad.ok === false && bad.status === 400 && /waiting, failed, sent or all/.test(bad.error), '3.6 a show that is not one of the four: 400 in plain words');
  const all = await callRoute(adminRouter, 'get', '/sends', { query: { show: 'all' }, app: { locals: { supabase: db } } });
  const sc = scan(all.body);
  ok(all.code === 200 && sc.email.length === 0 && sc.phone.length === 0, '3.7 RAW BODY: no email and no phone of anyone (not the partner\'s calls address, not the vendor\'s)', JSON.stringify(sc));

  sec('4  the revive refuses, writing nothing');
  const refuse = async (label, sendRow, o, p, env, msg, code = 409) => {
    const d = world([sendRow], o, p); const before = JSON.stringify(d.tables.partner_sends);
    const r = await queue.revive(d, sendRow.id, { by: 'Dev', now: NOW, env });
    ok(r.ok === false && r.status === code && r.error === msg && JSON.stringify(d.tables.partner_sends) === before && !d.writes.some((x) => x.name === 'partner_sends'), label, JSON.stringify(r));
  };
  { const d = world([send({ state: 'failed' })]); const r = await queue.revive(d, crypto.randomUUID(), { now: NOW, env: KEY }); ok(r.status === 404 && r.error === queue.REVIVE.none && d.writes.length === 0, '4.1 no such row: 404, nothing written'); }
  await refuse('4.2 a row that is not failed (queued)', send({ state: 'queued' }), {}, {}, KEY, queue.REVIVE.notFailed);
  await refuse('4.3 an email row with no key set', send({ state: 'failed', why: RESEND_DOMAIN }), {}, {}, {}, queue.REVIVE.noKey);
  await refuse('4.4 the call has closed', send({ state: 'failed' }), {}, { state: 'closed' }, KEY, queue.REVIVE.closed);
  await refuse('4.5 the call\'s date has passed', send({ state: 'failed' }), {}, { event_date: '2026-10-01' }, KEY, queue.REVIVE.closed);
  await refuse('4.6 the partner is blocked', send({ state: 'failed' }), { check_state: 'blocked' }, {}, KEY, queue.REVIVE.blocked);
  await refuse('4.7 the partner stopped calls', send({ state: 'failed' }), { send_state: 'stopped' }, {}, KEY, queue.REVIVE.stopped);
  const viaRoute = await callRoute(adminRouter, 'post', '/sends/:send_id/retry', { params: { send_id: 'nope' }, app: { locals: { supabase: world([]) } } });
  ok(viaRoute.code === 404 && viaRoute.body.error === queue.REVIVE.none, '4.8 the door: a send id that is not an id is a 404');

  sec('5  ONE GUARDED UPDATE: two presses at once, one queued row');
  db = world([send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3 })]);
  const id5 = db.tables.partner_sends[0].id;
  const [a5, b5] = await Promise.all([queue.revive(db, id5, { by: 'Dev', now: NOW, env: KEY }), queue.revive(db, id5, { by: 'Swati', now: NOW, env: KEY })]);
  const okCount = [a5, b5].filter((r) => r.ok).length; const calls5 = db.writes.filter((x) => x.name === 'rpc:partner_send_revive');
  const lines5 = db.tables.partner_send_log.filter((l) => l.send_id === id5);
  ok(okCount === 1 && [a5, b5].some((r) => r.status === 409 && r.error === queue.REVIVE.already) && calls5.length === 2 && lines5.length === 1 && lines5[0].kind === 'retried'
    && !db.writes.some((x) => x.name === 'partner_sends' && x.mode === 'update'),
    '5.1 both presses read "failed" and both reach the ONE statement; exactly one moves the row and writes the one line, the other is told "already tried again" (the race itself: the Postgres proof)', JSON.stringify({ okCount, calls: calls5.length, lines: lines5.length, a5, b5 }));
  const r5 = db.tables.partner_sends[0];
  ok(r5.state === 'queued' && r5.attempts === 0 && r5.not_before === NOW.toISOString() && /^Tried again by (Dev|Swati) on 12 October 2026\. Last refusal: resend 403: The `thedreamwedding\.in` domain is not verified/.test(r5.why) && r5.why.length <= 300,
    '5.2 the row: queued, tries back to 0, next try now; why keeps who, when, and the last refusal (within its 300)', JSON.stringify(r5));
  const src = fs.readFileSync(R('src/lib/partners/queue.js'), 'utf8'); const mig = fs.readFileSync(R('db/migrations/0219_partner_send_log.sql'), 'utf8');
  const fn = (mig.match(/CREATE OR REPLACE FUNCTION public\.partner_send_revive[\s\S]*?\$\$;/) || [''])[0];
  ok((src.match(/sb\.rpc\('partner_send_revive'/g) || []).length === 1 && !/\.from\('partner_sends'\)\s*\n?\s*\.update\(/.test(src)
    && /UPDATE public\.partner_sends[\s\S]*WHERE id = p_send AND state = 'failed'\s*\n\s*RETURNING id/.test(fn) && /INSERT INTO public\.partner_send_log[\s\S]*FROM moved/.test(fn),
    '5.3 the source: queue.js sends ONE statement, 0219\'s partner_send_revive, whose WHERE is id AND state = failed and whose log line comes from the same RETURNING (amended at A2-1c)');

  sec('6  a revived row still meets 9 am to 8 pm and the daily cap (the real drain)');
  const fetchOk = async () => ({ ok: true, status: 200, json: async () => ({ id: 'em_1' }) });
  db = world([send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3 })]);
  CLOCK = LATE; await queue.revive(db, db.tables.partner_sends[0].id, { by: 'Dev', now: LATE, env: KEY }); CLOCK = null;
  await sends.drain(db, { now: () => LATE, env: KEY, fetchImpl: fetchOk });
  ok(db.tables.partner_sends[0].state === 'held_window' && db.tables.partner_sends[0].not_before === '2026-10-13T03:30:00.000Z', '6.1 revived at 10 pm IST: waits for 9 am', JSON.stringify(db.tables.partner_sends[0]));
  db = world([send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3 })], { daily_cap: 1 });
  db.tables.partner_sends.push(send({ post_id: crypto.randomUUID(), state: 'sent', sent_at: '2026-10-12T04:00:00.000Z' }));
  await queue.revive(db, db.tables.partner_sends[0].id, { by: 'Dev', now: NOW, env: KEY });
  await sends.drain(db, { now: () => NOW, env: KEY, fetchImpl: fetchOk });
  ok(db.tables.partner_sends[0].state === 'held_cap', '6.2 revived over the partner\'s cap: waits for tomorrow', JSON.stringify(db.tables.partner_sends[0]));
  db = world([send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3 })]);
  await queue.revive(db, db.tables.partner_sends[0].id, { by: 'Dev', now: NOW, env: KEY });
  await sends.drain(db, { now: () => NOW, env: KEY, fetchImpl: fetchOk });
  ok(db.tables.partner_sends[0].state === 'sent', '6.3 control: revived at noon under the cap, it goes');

  sec('7  three refusals are never the end');
  const fetch403 = async () => ({ ok: false, status: 403, json: async () => ({ message: 'The `thedreamwedding.in` domain is not verified. Please, add and verify your domain.' }) });
  db = world([send({ state: 'queued', not_before: '2026-10-12T00:00:00.000Z' })]);
  const row7 = db.tables.partner_sends[0]; const t = (m) => new Date(NOW.getTime() + m * 60e3);
  const failThrice = async (start) => { for (let k = 0; k < 3; k++) await sends.drain(db, { now: () => t(start + k * 16), env: KEY, fetchImpl: fetch403 }); };
  await failThrice(0);
  ok(row7.state === 'failed' && row7.attempts === 3, '7.1 three refusals: failed');
  CLOCK = t(60); ok((await queue.revive(db, row7.id, { by: 'Dev', now: t(60), env: KEY })).ok && row7.state === 'queued', '7.2 revived');
  await failThrice(61);
  ok(row7.state === 'failed' && row7.attempts === 3, '7.3 three more refusals: failed again');
  CLOCK = t(120); ok((await queue.revive(db, row7.id, { by: 'Dev', now: t(120), env: KEY })).ok && row7.state === 'queued' && row7.attempts === 0, '7.4 revived again: a stopped row is never the end'); CLOCK = null;
  await sends.drain(db, { now: () => t(121), env: KEY, fetchImpl: fetchOk });
  ok(row7.state === 'sent', '7.5 once the cause is fixed, it goes');

  sec('8  plain words, against Resend\'s documented messages');
  const fw = words.failureWords;
  ok(fw(RESEND_DOMAIN) === 'The sending domain is not verified in Resend yet.', '8.1 the domain not verified');
  ok(fw('resend 403: You can only send testing emails to your own email address (dev@x.in).') === 'Resend is still in test mode: it sends only to your own address until the domain is verified.', '8.2 test mode');
  ok(fw('resend 401: Missing API key in the authorization header.') === 'Resend refused the key. Check RESEND_API_KEY in Railway.' && fw('resend 403: API key is not active') === fw('resend 403: This API key is suspended'), '8.3 the key, in each of its forms');
  ok(fw('resend 429: You have exceeded your daily email sending quota.') === 'Resend\'s sending limit for the day or month is used up.' && fw('resend 429: Too many requests. Please limit the number of requests per second.') === 'Too many emails at once. Resend asked to slow down.', '8.4 quota and rate');
  ok(fw('bad address') === 'This partner\'s email for calls is not a valid address.' && fw('resend 503: API is temporarily unavailable') === 'Resend had a fault on its side.' && fw('resend unreachable: fetch failed') === 'Resend could not be reached.', '8.5 address, fault, unreachable');
  ok(fw('resend 422: The request body is missing one or more required fields.') === 'Resend refused it.' && fw(null) === 'Resend refused it.', '8.6 anything else: "Resend refused it." (its own words kept beside)');

  sec('9  the per-partner door');
  db = world([send({ state: 'failed', why: RESEND_DOMAIN, attempts: 3 }), send({ channel: 'whatsapp', state: 'queued' })]);
  const one = await callRoute(adminRouter, 'get', '/:id/sends', { params: { id: O1 }, app: { locals: { supabase: db } } });
  const fr = one.body.sends.find((s) => s.state === 'failed'); const wr = one.body.sends.find((s) => s.channel === 'whatsapp');
  ok(one.code === 200 && fr.why_words === 'The sending domain is not verified in Resend yet.' && fr.can_retry === true && fr.attempts === 3 && wr.lane_words === 'WhatsApp' && fr.lane_words === 'Email', '9.1 each row now carries its lane, its plain reason, tries, and whether it can be tried again');
  ok(scan(one.body).email.length === 0 && scan(one.body).phone.length === 0, '9.2 still no email and no phone of anyone');

  console.log(`\nb295: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('BENCH THREW', e && e.stack); process.exit(1); });
