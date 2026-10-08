'use strict';
// scripts/b296_ptn_a2_1c_send_log_bench.js · CE-47 · PTN-A2-1c · rung b296 · the history of a send (0219), and F-44.410.
// §1 0219's TEXT: one transaction; RLS and the four grants inside it (e-273); a line refuses UPDATE; the revive function
//    in 0211's form (LANGUAGE sql, schema-qualified, no search_path set, SECURITY INVOKER, service_role only); the log's
//    states are 0218's states and the words' states; the fold (two nullable columns, three template rows born 'pending',
//    auto_on left to 0149's default false); nothing else altered; the ROLLBACK names every object. (0219's BEHAVIOUR on
//    real Postgres is scripts/lib/ptn_a2_1c_pg_proof.sh, in the handover.)
// §2 THE DRAIN'S LINES, through the real drain: a line only when the state or the reason changes; a row held pass after
//    pass stays one line; a failed or throwing log write never stops a send; a WhatsApp row (A2-2's) writes nothing.
// §3 THE LOG DOOR (GET /api/v2/admin/partners/sends/:send_id/log): behind requireAdmin over real HTTP; 404 for a bad or
//    unknown id; newest first, in words; who tried it again; no phone and no email in the raw body.
// §4 F-44.410: Resend's own words can carry an address (its test-mode refusal names the account's email). Every reason
//    shown, on every door that shows one, has it cut; the database keeps Resend's words as they came.
// --mutate: six production mutations through scripts/lib/mutation_guard.js (kept copy and marker first; recovered at every
// start; restored by sha); each must redden its cell. F-44.419: the run refuses (exit 3) with under 512 MB free.
// Fixed dates, no clock in any cell; no network beyond 127.0.0.1. THE EXIT IS THE VERDICT.
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
if (!process.env.B296_MUT_CHILD) guard.recoverOrRefuse(ROOT, 'b296');
{
  let free = Infinity; try { const s = fs.statfsSync(ROOT); free = s.bavail * s.bsize; } catch (_e) { /* no statfs: no refusal */ }
  if (free < 512 * 1024 * 1024) { console.log(`b296: REFUSED. ${Math.round(free / 1048576)} MB free; a mutation series needs 512 MB (F-44.419).`); process.exit(3); }
}
const MUTS = [
  { rel: 'src/lib/partners/sends.js', from: '    if (state === was.state && why === was.why) return;\n', to: '', reddens: /FAIL  2\.2/ },
  { rel: 'src/lib/partners/sends.js', from: "    } catch (e) { console.warn('[partners] send log:', e && e.message); }\n", to: '    } catch (e) { throw e; }\n', reddens: /FAIL  2\.5/ },
  { rel: 'src/lib/partners/queue.js', from: ".order('at', { ascending: false })", to: ".order('at', { ascending: true })", reddens: /FAIL  3\.3/ },
  { rel: 'src/lib/partners/queue.js', from: 'resend_words: refusal(l) ? providerWords(l.why) : null', to: 'resend_words: refusal(l) ? l.why : null', reddens: /FAIL  3\.5/ },
  { rel: 'src/lib/partners/words.js', from: ".replace(ADDR, 'an address')", to: '', reddens: /FAIL  4\.1/ },
  { rel: 'db/migrations/0219_partner_send_log.sql', from: 'REVOKE ALL ON FUNCTION public.partner_send_revive(uuid, text, text) FROM PUBLIC, anon, authenticated;\n', to: '', reddens: /FAIL  1\.4/ },
];
if (!process.env.B296_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(m.rel), 'utf8').includes(m.from)) { console.log(`STOP — a mutation anchor is missing from ${m.rel}; restore it with git checkout before running b296.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const before = guard.sha(fs.readFileSync(R(m.rel), 'utf8')); let red = false; let out = '';
    const h = guard.apply(ROOT, m.rel, m.from, m.to, 'b296');
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B296_MUT_CHILD: '1' }, timeout: 120000 }); out = r.stdout || ''; red = r.status !== 0 && m.reddens.test(out); }
    finally { h.restore(); }
    ok(red, `M${i + 1} ${m.rel} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`, red ? undefined : (out.match(/FAIL .*/g) || ['no red']).join(' | '));
    ok(guard.sha(fs.readFileSync(R(m.rel), 'utf8')) === before && !fs.existsSync(guard.pendingDir(ROOT)), `M${i + 1} ${m.rel} restored byte for byte, no marker left`);
  }
  console.log(`\nb296 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

const { fakeDb, callRoute } = require('./lib/ptn_fakedb');
const NOW = new Date('2026-10-12T06:30:00Z');     // 12:00 IST, a Monday
const O1 = crypto.randomUUID(); const V1 = crypto.randomUUID(); const POST = crypto.randomUUID();
const org = (x = {}) => ({ id: O1, name: 'Model Connect', kind: 'model_agency', calls_email: 'bookings@modelconnect.in', whatsapp_opt: true, whatsapp_phone: '+919811100021',
  daily_cap: 10, send_state: 'active', paused_until: null, check_state: 'unchecked', cities: ['Delhi NCR'], roles: ['model'], wants: ['calls'], pay_rule: 'paid_and_credit', ...x });
const post = (x = {}) => ({ id: POST, vendor_id: V1, requirement_type: 'model', event_date: '2026-10-18', city: 'Delhi NCR', pay_kind: 'paid', budget_from: 3000, budget_to: 5000,
  details: 'Call me on 9811100007 or aanya@mail.com', state: 'open', first_look_until: null, ...x });
const vendor = { id: V1, business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua', phone: '+919811100007', email: 'aanya@mail.com' };
const TESTMODE = 'resend 403: You can only send testing emails to your own email address (founder.tdw@gmail.com). To send emails to other recipients, please verify a domain.';
const send = (x = {}) => ({ id: crypto.randomUUID(), partner_id: O1, post_id: POST, channel: 'email', state: 'queued', why: null, attempts: 0, not_before: '2026-10-12T00:00:00.000Z',
  sent_at: null, created_at: '2026-10-12T01:00:00.000Z', token_hash: crypto.randomBytes(32).toString('hex'), ...x });
// The revive is one statement in the database (0219's partner_send_revive); the fake answers sb.rpc with its meaning, as b295 does.
let CLOCK = null;
function withRpc(db) {
  db.rpc = async (name, args) => {
    db.writes.push({ name: 'rpc:' + name, args });
    if (name !== 'partner_send_revive') return { data: null, error: { message: `no function ${name}` } };
    const r = (db.tables.partner_sends || []).find((x) => x.id === args.p_send && x.state === 'failed');
    if (!r) return { data: null, error: null };
    Object.assign(r, { state: 'queued', attempts: 0, not_before: (CLOCK || NOW).toISOString(), why: String(args.p_note).slice(0, 300) });
    db.tables.partner_send_log.push({ id: crypto.randomUUID(), send_id: r.id, at: (CLOCK || NOW).toISOString(), kind: 'retried', state: 'queued', channel: r.channel, attempts: 0, why: r.why, by_whom: String(args.p_by).slice(0, 120) });
    return { data: r.id, error: null };
  };
  return db;
}
const world = (sends, o = {}, p = {}) => withRpc(fakeDb({ partner_orgs: [org(o)], collab_posts: [post(p)], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }],
  vendors: [vendor], partner_sends: sends, partner_answers: [], partner_reports: [], partner_connections: [], partner_send_log: [] }));
const KEY = { RESEND_API_KEY: 're_test', PARTNER_SESSION_SECRET: process.env.PARTNER_SESSION_SECRET };
const scan = (b) => { const s = JSON.stringify(b).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
  return { email: s.match(/[^\s@"'<>:/`(]+@[^\s@"'<>`)]+\.[a-z]{2,}/gi) || [], phone: (s.match(/\+?\d[\d\s-]{8,}\d/g) || []).filter((m) => m.replace(/\D/g, '').length >= 10) }; };
const fetchOk = async () => ({ ok: true, status: 200, json: async () => ({ id: 'em_1' }) });
const fetchTest = async () => ({ ok: false, status: 403, json: async () => ({ message: TESTMODE.replace(/^resend 403: /, '') }) });
const t = (m) => new Date(NOW.getTime() + m * 60e3);
const linesOf = (db, id) => db.tables.partner_send_log.filter((l) => l.send_id === id);

(async () => {
  const sends = require(R('src/lib/partners/sends'));
  const queue = require(R('src/lib/partners/queue'));
  const words = require(R('src/lib/partners/words'));

  sec('1  0219\'s text');
  const mig = fs.readFileSync(R('db/migrations/0219_partner_send_log.sql'), 'utf8');
  const code = mig.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  const body = code.slice(code.indexOf('BEGIN;'), code.lastIndexOf('COMMIT;'));
  ok((code.match(/^BEGIN;$/gm) || []).length === 1 && (code.match(/^COMMIT;$/gm) || []).length === 1 && code.trim().startsWith('BEGIN;') && code.trim().endsWith('COMMIT;'),
    '1.1 one transaction: one BEGIN, one COMMIT, nothing outside them but comments');
  ok(/ALTER TABLE public\.partner_send_log ENABLE ROW LEVEL SECURITY;/.test(body) && /GRANT SELECT, INSERT, UPDATE, DELETE ON public\.partner_send_log TO service_role;/.test(body),
    '1.2 e-273: RLS on and the four grants to service_role, inside the same transaction');
  ok(/CREATE TRIGGER partner_send_log_no_update BEFORE UPDATE ON public\.partner_send_log/.test(body) && /RAISE EXCEPTION 'partner_send_log is append-only/.test(body)
    && /REFERENCES public\.partner_sends\(id\) ON DELETE CASCADE/.test(body) && !/BEFORE DELETE/.test(body),
    '1.3 a line refuses UPDATE (a trigger); DELETE is left to the cascade from partner_sends');
  const fn = (body.match(/CREATE OR REPLACE FUNCTION public\.partner_send_revive[\s\S]*?\$\$;/) || [''])[0];
  const fnBody = (fn.match(/\$\$([\s\S]*)\$\$/) || ['', ''])[1];
  const bareTables = (fnBody.match(/\b(UPDATE|INTO|FROM)\s+(?!public\.)(?!moved\b)[a-z_]+/g) || []);
  ok(/LANGUAGE sql/.test(fn) && !/SECURITY DEFINER/i.test(code) && !/search_path/i.test(code) && bareTables.length === 0
    && /REVOKE ALL ON FUNCTION public\.partner_send_revive\(uuid, text, text\) FROM PUBLIC, anon, authenticated;/.test(body)
    && /GRANT EXECUTE ON FUNCTION public\.partner_send_revive\(uuid, text, text\) TO service_role;/.test(body) && (body.match(/GRANT EXECUTE/g) || []).length === 1,
    '1.4 the revive in 0211\'s form: LANGUAGE sql, every table schema-qualified, no search_path, SECURITY INVOKER, refused to PUBLIC, anon and authenticated, granted to service_role only', JSON.stringify(bareTables));
  const list = (s) => ((s.match(/state\s+text[^\n]*CHECK \(state IN \(([\s\S]*?)\)\)/) || ['', ''])[1].match(/'([a-z_]+)'/g) || []).map((x) => x.replace(/'/g, '')).sort().join();
  const m218 = fs.readFileSync(R('db/migrations/0218_partner_calls.sql'), 'utf8');
  ok(list(body) && list(body) === list(m218) && list(body) === Object.keys(words.SEND_WORDS).sort().join(), '1.5 the log\'s states are 0218\'s states, and every one has its words', `${list(body)} | ${list(m218)}`);
  const rows = [...body.matchAll(/\('(template\.tdw_[a-z_]+)',\s*'template', 'pending',/g)].map((x) => x[1]);
  ok(/ADD COLUMN IF NOT EXISTS whatsapp_opt_at timestamptz NULL;/.test(body) && /ADD COLUMN IF NOT EXISTS whatsapp_opt_words text NULL\s*\n\s*CHECK \(whatsapp_opt_words IS NULL OR char_length\(whatsapp_opt_words\) <= 300\);/.test(body)
    && rows.join() === 'template.tdw_partner_call,template.tdw_partner_picked,template.tdw_collab_request_sent' && /ON CONFLICT \(key\) DO NOTHING;/.test(body)
    && /INSERT INTO public\.capabilities \(key, kind, status, evidence\) VALUES/.test(body) && !/auto_on|walk_ref/.test(body),
    '1.6 THE FOLD: two nullable columns on partner_orgs; the three template rows born pending, a rerun harmless, auto_on left to 0149\'s default false', rows.join());
  const alters = [...body.matchAll(/ALTER TABLE (public\.[a-z_]+)/g)].map((x) => x[1]);
  ok(alters.every((a) => a === 'public.partner_send_log' || a === 'public.partner_orgs') && !/\bDROP (TABLE|COLUMN|FUNCTION|POLICY)\b/.test(body) && !/\bUPDATE public\.(?!partner_sends\b)/.test(body),
    '1.7 nothing else is altered: no drop, no other table, no other update', alters.join());
  const rb = mig.split('\n').filter((l) => /^\s*--/.test(l)).join(' ').slice(mig.split('\n').filter((l) => /^\s*--/.test(l)).join(' ').indexOf('ROLLBACK'));
  ok(['template.tdw_partner_call', 'whatsapp_opt_words', 'whatsapp_opt_at', 'partner_send_revive', 'partner_send_log', 'partner_send_log_append_only'].every((n) => rb.includes(n)), '1.8 the ROLLBACK comment names every object 0219 makes');

  sec('2  the drain\'s lines (the real drain)');
  let db = world([send()]); let id = db.tables.partner_sends[0].id;
  let out = await sends.drain(db, { now: () => NOW, env: KEY, fetchImpl: fetchOk });
  let L = linesOf(db, id);
  ok(out.sent === 1 && L.length === 1 && L[0].kind === 'drain' && L[0].state === 'sent' && L[0].why === null && L[0].attempts === 1 && L[0].channel === 'email' && L[0].at === NOW.toISOString(),
    '2.1 queued to sent: one line (drain, sent, no reason, one try, the lane, the time)', JSON.stringify(L));
  db = world([send()], { send_state: 'paused', paused_until: '2026-10-20T00:00:00.000Z' }); id = db.tables.partner_sends[0].id;
  for (const m of [0, 61, 122, 183]) { db.tables.partner_sends[0].not_before = '2026-10-12T00:00:00.000Z'; await sends.drain(db, { now: () => t(m), env: KEY, fetchImpl: fetchOk }); }
  L = linesOf(db, id);
  ok(db.tables.partner_sends[0].state === 'held_paused' && L.length === 1 && L[0].state === 'held_paused', '2.2 a row held pass after pass (four passes) stays ONE line: a line only when the state or the reason changes', JSON.stringify(L.map((l) => l.state)));
  db = world([send()]); id = db.tables.partner_sends[0].id;
  for (let k = 0; k < 3; k++) await sends.drain(db, { now: () => t(k * 16), env: KEY, fetchImpl: fetchTest });
  CLOCK = t(60); await queue.revive(db, id, { by: 'admin', now: t(60), env: KEY }); CLOCK = null;
  await sends.drain(db, { now: () => t(61), env: KEY, fetchImpl: fetchOk });
  L = linesOf(db, id);
  ok(L.map((l) => `${l.kind}/${l.state}/${l.attempts}`).join(' ') === 'drain/queued/1 drain/failed/3 retried/queued/0 drain/sent/1' && L[0].why === TESTMODE,
    '2.3 three refusals, a revive, a send: refused (queued, reason), failed, tried again, sent; the second refusal (same reason) adds no line; the database keeps Resend\'s words as they came', JSON.stringify(L.map((l) => `${l.kind}/${l.state}/${l.attempts}`)));
  const breakLog = (d, how) => { const from = d.from; d.from = (n) => { const q = from(n); if (n === 'partner_send_log') q.insert = how; return q; }; return d; };
  db = breakLog(world([send()]), () => Promise.resolve({ data: null, error: { message: 'relation "partner_send_log" does not exist' } }));
  const warn = console.warn; const warned = []; console.warn = (...a) => warned.push(a.join(' '));
  try { out = await sends.drain(db, { now: () => NOW, env: KEY, fetchImpl: fetchOk }); } finally { console.warn = warn; }
  ok(out.sent === 1 && db.tables.partner_sends[0].state === 'sent' && warned.some((w) => /send log/.test(w)), '2.4 the log write answers an error (0219 not yet applied): the send still goes, the error is logged', JSON.stringify({ out, warned }));
  db = breakLog(world([send(), send({ post_id: POST })]), () => { throw new Error('socket hang up'); });
  console.warn = (...a) => warned.push(a.join(' '));
  let threw = null; try { out = await sends.drain(db, { now: () => NOW, env: KEY, fetchImpl: fetchOk }); } catch (e) { threw = e; } finally { console.warn = warn; }
  ok(!threw && out.sent === 2 && db.tables.partner_sends.every((r) => r.state === 'sent'), '2.5 the log write THROWS: the drain does not stop, both sends go', threw ? threw.message : JSON.stringify(out));
  db = world([send({ channel: 'whatsapp' })]); await sends.drain(db, { now: () => NOW, env: KEY, fetchImpl: fetchOk });
  ok(db.tables.partner_send_log.length === 0 && db.tables.partner_sends[0].state === 'queued', '2.6 a WhatsApp row (the drain leaves it for A2-2) writes no line');

  sec('3  the log door');
  const express = require('express');
  const adminRouter = require(R('src/api/admin/partners'));
  const { mintAdminSession } = require(R('src/lib/adminSession'));
  db = world([send()]); id = db.tables.partner_sends[0].id;
  for (let k = 0; k < 3; k++) await sends.drain(db, { now: () => t(k * 16), env: KEY, fetchImpl: fetchTest });
  CLOCK = t(60); await queue.revive(db, id, { by: 'admin', now: t(60), env: KEY }); CLOCK = null;
  await sends.drain(db, { now: () => t(61), env: KEY, fetchImpl: fetchOk });
  const app = express(); app.use(express.json()); app.locals.supabase = db; app.use('/api/v2/admin/partners', adminRouter);
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v2/admin/partners`;
  const get = async (p, tok) => { const r = await fetch(base + p, { headers: tok ? { authorization: `Bearer ${tok}` } : {} }); let b = null; try { b = await r.json(); } catch (_e) { /* none */ } return { code: r.status, body: b }; };
  const adminTok = mintAdminSession();
  const none = await get(`/sends/${id}/log`, null);
  ok(none.code === 401 && none.body && !('lines' in none.body), '3.1 no token: 401, no lines (the door sits behind requireAdmin with every other)', JSON.stringify(none));
  const bad = await get('/sends/not-an-id/log', adminTok); const unknown = await get(`/sends/${crypto.randomUUID()}/log`, adminTok);
  ok(bad.code === 404 && unknown.code === 404 && bad.body.error === queue.REVIVE.none && unknown.body.error === queue.REVIVE.none, '3.2 a bad id and an unknown id: 404 "No such send."');
  const lg = await get(`/sends/${id}/log`, adminTok);
  await new Promise((r) => server.close(r));
  const ls = (lg.body && lg.body.lines) || [];
  ok(lg.code === 200 && ls.map((l) => `${l.kind}/${l.state}`).join(' ') === 'drain/sent retried/queued drain/failed drain/queued', '3.3 newest first: sent, tried again, failed, refused', JSON.stringify(ls.map((l) => `${l.kind}/${l.state}`)));
  ok(ls[0].kind_words === 'The sender' && ls[0].state_words === 'Sent' && ls[0].lane_words === 'Email' && ls[1].kind_words === 'Tried again' && ls[1].by === 'admin'
    && ls[2].state_words === 'Could not be sent' && ls[2].why_words === 'Resend is still in test mode: it sends only to your own address until the domain is verified.' && ls[3].why_words === ls[2].why_words,
    '3.4 each line in words: what happened, the state, the lane, the plain reason, and who tried it again', JSON.stringify(ls.slice(0, 3)));
  const sc = scan(lg.body);
  ok(sc.email.length === 0 && sc.phone.length === 0 && /\(an address\)/.test(ls[2].resend_words) && /\(an address\)/.test(ls[1].why_words || ''),
    '3.5 RAW BODY: no email and no phone, though Resend\'s own words and the revive\'s note both carried the account\'s address (F-44.410)', JSON.stringify(sc));

  sec('4  F-44.410 on every door that shows a reason');
  const pw = words.providerWords;
  ok(pw(TESTMODE) === 'resend 403: You can only send testing emails to your own email address (an address). To send emails to other recipients, please verify a domain.'
    && pw('resend 403: The `thedreamwedding.in` domain is not verified.') === 'resend 403: The `thedreamwedding.in` domain is not verified.' && pw('call +91 98111 00007 now') === 'call a number now'
    && pw('Tried again by admin on 12 October 2026.') === 'Tried again by admin on 12 October 2026.' && pw(null) === null && pw('') === null,
    '4.1 providerWords: an address reads "an address", ten or more digits read "a number"; a domain name, a date and plain words stay as they are');
  db = world([send({ state: 'failed', why: TESTMODE, attempts: 3 }), send({ state: 'queued', why: `Tried again by admin on 12 October 2026. Last refusal: ${TESTMODE}`.slice(0, 300) })]);
  const lst = await callRoute(adminRouter, 'get', '/sends', { query: { show: 'all' }, app: { locals: { supabase: db } } });
  const one = await callRoute(adminRouter, 'get', '/:id/sends', { params: { id: O1 }, app: { locals: { supabase: db } } });
  const s1 = scan(lst.body); const s2 = scan(one.body);
  ok(lst.code === 200 && lst.body.sends.length === 2 && s1.email.length === 0 && s1.phone.length === 0, '4.2 the Waiting and sent list (A2-1b\'s door): the failed row\'s Resend words and the revived row\'s note, no address', JSON.stringify(s1));
  ok(one.code === 200 && one.body.sends.length === 2 && s2.email.length === 0 && s2.phone.length === 0, '4.3 the per-partner door (A2-1\'s): its raw "why" and its words, no address', JSON.stringify(s2));
  ok(db.tables.partner_sends[0].why === TESTMODE, '4.4 the database keeps Resend\'s words as they came: only what is shown is cut');

  console.log(`\nb296: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('BENCH THREW', e && e.stack); process.exit(1); });
