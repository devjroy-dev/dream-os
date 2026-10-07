'use strict';
// scripts/b292_ptn_a2_calls_bench.js · CE-47 · PTN-A2-1 (re-based on a75c2bd) · rung b292 · calls to partners, the Hub org
// page, Contact, the mark.
// §1 0218 as text: two tables, RLS and grants in-transaction; partner_answers has no phone or email column; the FK is
//    NO ACTION (0197's shape CHECK makes SET NULL impossible). §2 the matcher. §3 the Hub gate, CLB's gate.js hubOpen as
//    landed (driven through admin_config, never stubbed): a vendor the Hub is closed to makes NO send rows; a tester's
//    call does; the switch on opens every vendor; junk fails closed; PTN has no gate seam of its own. §4 the drain:
//    closed, blocked, stopped, paused, the 9 am to 8 pm window, the daily cap, NO KEY (nothing sent, fetch never called,
//    the row says why), a send, retries then failed; the email's words and links. §5 suggest. §6 the Hub org page.
//    §7 the mark: "Verified" / "Unverified", one home (orgs.js), shown at the public page, the partner's area and the
//    admin ONLY while 'partners.check_label' is on. §8 Contact and Report: never blocks her. §9 RAW BODIES: no phone or
//    email of anyone, save the partner's own address on her Contact tap (confirmed by the chair). §10 the seams.
//    §11 the shared lines. §12 forward makes her call. §13 THE CONTRACT WITH CLB: a suggestion on a closed vendor's call
//    answers 403 with CLB's NOT_OPEN sentence and writes no row, at both doors; bad input 400; never a 500.
// --mutate: five production mutations, each must redden its cell, each file restored byte for byte (e-277: the run
// STOPS first if a mutation anchor is already missing). Fixed dates; no wall clock in any cell. THE EXIT IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..'); const R = (p) => path.join(ROOT, p);
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
const ENV = { PARTNER_SESSION_SECRET: 's'.repeat(40) };
process.env.PARTNER_SESSION_SECRET = ENV.PARTNER_SESSION_SECRET;
const { fakeDb: baseFakeDb, callRoute } = require('./lib/ptn_fakedb');
let pass = 0; let fail = 0; const failed = [];
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 240) + ']'}`); } };
// CLB's gate (src/lib/hub/gate.js) and its testers reader cache 60 s; every section starts from a cold gate.
const gateLib = require(R('src/lib/hub/gate')); const testersLib = require(R('src/lib/collab/testers'));
const coldGate = () => { gateLib._reset(); testersLib._reset(); };
const sec = (t) => { coldGate(); console.log(`\n§${t}`); };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// e-277 and the mutations
const MUTS = [
  { file: 'src/lib/partners/sends.js', anchor: "  if (!(await hubOpen(sb, info.vendor_id))) return { made: 0, why: 'hub_closed' };\n", to: '', reddens: /FAIL  3\.1/ },
  { file: 'src/lib/partners/answers.js', anchor: "  if (!(await hubOpen(sb, c.post.vendor_id))) return { ok: false, status: 403, error: WORDS.notOpen };   // before ANY row\n", to: '', reddens: /FAIL  13\.2/ },
  { file: 'src/lib/partners/orgs.js', anchor: "    check_words: mark === true ? (CHECK_WORDS[o.check_state] || null) : null, fee_line: FEE_LINE };\n", to: '    check_words: CHECK_WORDS[o.check_state] || null, fee_line: FEE_LINE };\n', reddens: /FAIL  7\.3/ },
  { file: 'src/lib/partners/answers.js', anchor: "    if (e && e.message === NOT_OPEN) return { ok: false, status: 403, error: WORDS.notOpen };   // CLB's own guard won a race\n", to: '', reddens: /FAIL  13\.3/ },
  { file: 'src/lib/partners/email.js', anchor: "  if (!key) return { ok: false, noKey: true, error: 'no key' };\n", to: '', reddens: /FAIL  4\.7/ },
];
if (!process.env.B292_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(m.file), 'utf8').includes(m.anchor)) { console.log(`STOP — a mutation anchor is missing from ${m.file}; restore it with git checkout before running b292.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const orig = fs.readFileSync(R(m.file), 'utf8'); let red = false;
    fs.writeFileSync(R(m.file), orig.replace(m.anchor, m.to));
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B292_MUT_CHILD: '1' } }); red = r.status !== 0 && m.reddens.test(r.stdout); }
    finally { fs.writeFileSync(R(m.file), orig); }
    ok(red, `M${i + 1} ${m.file} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`);
    ok(sha(fs.readFileSync(R(m.file), 'utf8')) === sha(orig), `M${i + 1} ${m.file} restored byte for byte`);
  }
  console.log(`\nb292 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

const NOW = new Date('2026-10-12T06:30:00Z');            // 12:00 IST, a Monday
const LATE = new Date('2026-10-12T16:00:00Z');           // 21:30 IST
const V_TEST = crypto.randomUUID(); const V_OTHER = crypto.randomUUID(); const O1 = crypto.randomUUID(); const O2 = crypto.randomUUID();
const POST = crypto.randomUUID();
const org = (x = {}) => ({ id: O1, name: 'Model Connect', kind: 'model_agency', instagram_handle: 'modelconnect.in', website: 'https://modelconnect.in/', cities: ['Delhi NCR'], roles: ['model'],
  pay_rule: 'paid_and_credit', wants: ['calls'], calls_email: 'bookings@modelconnect.in', whatsapp_opt: false, whatsapp_phone: '+919811100021', daily_cap: 10, send_state: 'active', paused_until: null, check_state: 'unchecked', ...x });
const post = (x = {}) => ({ id: POST, vendor_id: V_TEST, requirement_type: 'model', event_date: '2026-10-18', city: 'Delhi NCR', pay_kind: 'paid', budget_from: 3000, budget_to: 5000,
  details: 'Call me on 9811100007 or aanya@mail.com', state: 'open', first_look_until: null, ...x });
const vendor = { id: V_TEST, business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua', phone: '+919811100007', email: 'aanya@mail.com' };
// Every fake database holds the Hub's own rows: V_TEST is on clb.testers, the switch 'clb.hub' has no row (closed to the
// rest). A cell that needs another state passes its own admin_config and starts from a cold gate.
const HUB = (over) => over || [{ key: 'clb.testers', value: JSON.stringify([V_TEST]) }];
const fakeDb = (t) => baseFakeDb({ ...t, admin_config: HUB(t && t.admin_config) });

(async () => {
  sec('1  0218 as text');
  const m = fs.readFileSync(R('db/migrations/0218_partner_calls.sql'), 'utf8').replace(/--[^\n]*/g, '');
  ok(/^\s*BEGIN;/m.test(m) && /COMMIT;\s*$/.test(m.trim()), '1.1 one transaction');
  for (const t of ['partner_sends', 'partner_answers']) ok(new RegExp(`ENABLE ROW LEVEL SECURITY;[\\s\\S]*?`).test(m) && m.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`) && m.includes(`GRANT SELECT, INSERT, UPDATE, DELETE ON public.${t} TO service_role;`), `1.2 ${t}: RLS and the four grants`);
  const ans = (m.match(/CREATE TABLE IF NOT EXISTS public\.partner_answers \(([\s\S]*?)\n\);/) || [])[1] || '';
  ok(ans.length > 100 && !/^\s*\w*(phone|email|mobile|whatsapp)\w*\s/im.test(ans), '1.3 partner_answers has no phone or email column (rule J)');
  ok(/agreed\s+boolean\s+NOT NULL CHECK \(agreed = true\)/.test(ans) && /talent_name !~ '@'/.test(ans) && /talent_name !~ '\[0-9\]\{10,\}'/.test(ans), '1.4 agreed required; a name refuses an @ or ten digits');
  ok(/REFERENCES public\.partner_orgs\(id\) ON DELETE NO ACTION NOT VALID/.test(m) && /VALIDATE CONSTRAINT collab_interest_partner_fk/.test(m), '1.5 the FK on collab_interest.partner_id: NO ACTION, validated');

  sec('2  the matcher');
  const { matches } = require(R('src/lib/partners/match'));
  const call = { city: 'Delhi NCR', roles: [{ role: 'model', needed: 2 }], pay_kind: 'paid' };
  ok(matches(org(), call).ok, '2.1 a partner for the city, role and pay matches');
  ok(!matches(org({ check_state: 'blocked' }), call).ok && !matches(org({ send_state: 'stopped' }), call).ok, '2.2 blocked or stopped: no');
  ok(!matches(org(), call, { hidden: true }).ok, '2.3 hidden after three reports: no');
  ok(!matches(org({ wants: ['briefs'] }), call).ok, '2.4 a partner that does not want calls: no');
  ok(!matches(org({ cities: ['Mumbai'] }), call).ok && matches(org({ cities: ['All cities'] }), call).ok && matches(org({ cities: [] }), call).ok, '2.5 city: another city no; All cities or none chosen yes');
  ok(!matches(org({ roles: ['stylist'] }), call).ok && matches(org({ roles: [] }), call).ok, '2.6 role: another role no; none chosen yes');
  ok(!matches(org({ pay_rule: 'paid_only' }), { ...call, pay_kind: 'credit_only' }).ok && matches(org({ pay_rule: 'paid_only' }), call).ok, '2.7 paid only: a credit only call no, a paid call yes');
  ok(matches(org({ send_state: 'paused' }), call).paused === true, '2.8 paused still matches but is marked paused (the drain holds it)');

  sec('3  enqueue and the Hub gate (CLB\'s gate.js hubOpen, as landed)');
  const sends = require(R('src/lib/partners/sends')); const seams = require(R('src/lib/partners/seams'));
  const info = { post_id: POST, vendor_id: V_OTHER, city: 'Delhi NCR', pay_kind: 'paid', roles: [{ role: 'model', needed: 2 }], first_look_until: null };
  const ON = [{ key: 'clb.hub', value: 'on' }];
  let db = fakeDb({ partner_orgs: [org()], partner_reports: [], partner_sends: [], __unique: { partner_sends: ['partner_id', 'post_id', 'channel'] } });
  let out = await sends.enqueue(db, info, { now: () => NOW, env: ENV });
  ok(out.made === 0 && out.why === 'hub_closed' && db.tables.partner_sends.length === 0, '3.1 a vendor the Hub is closed to (not a tester, switch off): NO send rows', JSON.stringify(out));
  out = await sends.enqueue(db, { ...info, vendor_id: V_TEST }, { now: () => NOW, env: ENV });
  ok(out.made === 1 && db.tables.partner_sends.length === 1 && db.tables.partner_sends[0].state === 'queued', '3.2 a tester\'s call: one queued row', JSON.stringify(out));
  ok(/^[0-9a-f]{64}$/.test(db.tables.partner_sends[0].token_hash), '3.3 only the token\'s sha256 is stored');
  out = await sends.enqueue(db, { ...info, vendor_id: V_TEST }, { now: () => NOW, env: ENV });
  ok(out.made === 0 && db.tables.partner_sends.length === 1, '3.4 the same call again: no second row (one call, one send per channel)');
  db = fakeDb({ partner_orgs: [org({ calls_email: null })], partner_reports: [], partner_sends: [] });
  ok((await sends.enqueue(db, { ...info, vendor_id: V_TEST }, { now: () => NOW, env: ENV })).made === 0, '3.5 a partner with no calls email gets no email row');
  db = fakeDb({ partner_orgs: [org()], partner_reports: [], partner_sends: [] });
  const fl = '2026-10-12T18:30:00.000Z';
  await sends.enqueue(db, { ...info, vendor_id: V_TEST, first_look_until: fl }, { now: () => NOW, env: ENV });
  ok(db.tables.partner_sends[0] && db.tables.partner_sends[0].not_before === fl, '3.6 first look respected: not before its end');
  coldGate(); db = fakeDb({ partner_orgs: [org()], partner_reports: [], partner_sends: [], admin_config: ON });
  ok((await sends.enqueue(db, info, { now: () => NOW, env: ENV })).made === 1, '3.7 clb.hub on: any vendor\'s call is sent');
  coldGate(); db = fakeDb({ partner_orgs: [org()], partner_reports: [], partner_sends: [], admin_config: [{ key: 'clb.hub', value: 'yes' }, { key: 'clb.testers', value: 'junk' }] });
  ok((await sends.enqueue(db, { ...info, vendor_id: V_TEST }, { now: () => NOW, env: ENV })).made === 0, '3.8 junk in the switch and the list: closed (fails closed)');
  coldGate();
  const src3 = fs.readFileSync(R('src/lib/partners/sends.js'), 'utf8');
  ok(/require\('\.\.\/hub\/gate'\)/.test(src3) && !('hubOpenFor' in seams) && !/hubOpenFor/.test(fs.readFileSync(R('src/lib/partners/seams.js'), 'utf8')), '3.9 one gate: sends.js requires CLB\'s gate.js; PTN has no gate seam of its own');

  sec('4  the drain');
  const mk = (o = {}, p = {}, s = {}) => fakeDb({ partner_orgs: [org(o)], collab_posts: [post(p)], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }],
    vendors: [vendor], partner_sends: [{ id: crypto.randomUUID(), partner_id: O1, post_id: POST, channel: 'email', state: 'queued', not_before: '2026-10-12T00:00:00.000Z', attempts: 0, ...s }] });
  let fetched = 0; const fetchOk = async () => { fetched += 1; return { ok: true, status: 200, json: async () => ({ id: 'em_1' }) }; };
  const fetchBad = async () => { fetched += 1; return { ok: false, status: 422, json: async () => ({ message: 'bad from' }) }; };
  const KEY = { ...ENV, RESEND_API_KEY: 're_test' };
  const drainWith = async (d, now, env, f) => sends.drain(d, { now: () => now, env, fetchImpl: f });
  db = mk({}, { state: 'closed' }); await drainWith(db, NOW, KEY, fetchOk); ok(db.tables.partner_sends[0].state === 'closed', '4.1 a closed call: closed, not sent');
  db = mk({ check_state: 'blocked' }); await drainWith(db, NOW, KEY, fetchOk); ok(db.tables.partner_sends[0].state === 'closed', '4.2 a blocked partner: closed');
  db = mk({ send_state: 'paused' }); await drainWith(db, NOW, KEY, fetchOk); ok(db.tables.partner_sends[0].state === 'held_paused', '4.3 paused: held');
  db = mk(); await drainWith(db, LATE, KEY, fetchOk);
  ok(db.tables.partner_sends[0].state === 'held_window' && db.tables.partner_sends[0].not_before === '2026-10-13T03:30:00.000Z', '4.4 at 9:30 pm IST: held till 9 am IST next day', JSON.stringify(db.tables.partner_sends[0]));
  db = mk({ daily_cap: 1 }); db.tables.partner_sends.push({ id: crypto.randomUUID(), partner_id: O1, post_id: crypto.randomUUID(), channel: 'email', state: 'sent', sent_at: '2026-10-12T04:00:00.000Z' });
  await drainWith(db, NOW, KEY, fetchOk); ok(db.tables.partner_sends[0].state === 'held_cap', '4.5 the daily cap reached: held till 9 am');
  db = mk({ calls_email: null }); await drainWith(db, NOW, KEY, fetchOk); ok(db.tables.partner_sends[0].state === 'closed', '4.6 no calls email: closed');
  fetched = 0; db = mk(); await drainWith(db, NOW, ENV, fetchOk);
  ok(db.tables.partner_sends[0].state === 'held_no_key' && fetched === 0 && db.tables.partner_sends[0].why === 'RESEND_API_KEY is not set, so nothing was sent.', '4.7 NO RESEND_API_KEY: nothing sent, Resend never called, the row says why', JSON.stringify({ s: db.tables.partner_sends[0].state, fetched }));
  fetched = 0; db = mk({}, {}, { state: 'held_no_key' }); await drainWith(db, NOW, KEY, fetchOk);
  ok(db.tables.partner_sends[0].state === 'sent' && db.tables.partner_sends[0].provider_ref === 'em_1' && fetched === 1, '4.8 once the key is set, a held row goes out by itself');
  db = mk(); await drainWith(db, NOW, KEY, fetchBad); ok(db.tables.partner_sends[0].state === 'queued' && db.tables.partner_sends[0].attempts === 1 && /resend 422/.test(db.tables.partner_sends[0].why), '4.9 a refused send: tried again later, with its reason');
  db = mk({}, {}, { attempts: 2 }); await drainWith(db, NOW, KEY, fetchBad); ok(db.tables.partner_sends[0].state === 'failed', '4.10 the third refusal: failed');
  let mail = null; db = mk(); await sends.drain(db, { now: () => NOW, env: KEY, sendEmail: async (m) => { mail = m; return { ok: true, id: 'x' }; } });
  ok(mail && mail.to === 'bookings@modelconnect.in' && mail.subject === 'Collab call: 2 models in Delhi NCR, 18 October 2026, Paid', '4.11 the subject, word for word', mail && mail.subject);
  ok(mail && /To suggest someone, open this link:\nhttps:\/\/thedreamwedding\.in\/partner\/call\/[A-Za-z0-9_-]{32}/.test(mail.text) && /To stop these emails: https:\/\/thedreamwedding\.in\/partner\/call\/\S+\?do=stop/.test(mail.text) && /\?do=pause/.test(mail.text), '4.12 the link, the stop and the pause');
  ok(mail && mail.headers['List-Unsubscribe'] && /\?do=stop>$/.test(mail.headers['List-Unsubscribe']), '4.13 List-Unsubscribe header');
  ok(mail && !/9811100007|aanya@mail\.com/.test(mail.text) && /\[number hidden\]/.test(mail.text) && /\[email hidden\]/.test(mail.text), '4.14 the vendor\'s phone and email never reach the partner (her note masked, rule K)', mail && mail.text);
  ok(mail && /Pay: Paid, Rs 3,000 to Rs 5,000/.test(mail.text) && /Their Instagram: https:\/\/www\.instagram\.com\/aanya\.mua\//.test(mail.text), '4.15 pay in Rs with Indian grouping; her Instagram as a link');

  sec('5  suggest');
  const answers = require(R('src/lib/partners/answers'));
  const SEND = { id: crypto.randomUUID(), partner_id: O1, post_id: POST };
  const base = () => fakeDb({ partner_orgs: [org()], collab_posts: [post()], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }, { post_id: POST, requirement_type: 'stylist', needed: 1 }], vendors: [vendor], partner_answers: [] });
  const calls = []; const addPI = async (_sb, x) => { calls.push(x); const same = calls.filter((c) => c.name.toLowerCase() === x.name.toLowerCase()).length > 1; return { id: crypto.randomUUID(), existed: same }; };
  db = base();
  ok((await answers.suggest(db, SEND, [{ name: 'Riya' }], { agreed: false, now: NOW })).error === 'Tick "These people have agreed to be suggested for this call" first.', '5.1 refused without the tick, in plain words');
  ok((await answers.suggest(db, SEND, [{ name: 'riya@mail.com', role: 'model' }], { agreed: true, now: NOW })).error === 'Write only a name. No phone number or email.', '5.2 a name holding an email is refused');
  ok((await answers.suggest(db, SEND, [{ name: 'Riya 98111 00007', role: 'model' }], { agreed: true, now: NOW })).error === 'Write only a name. No phone number or email.', '5.3 a name holding a phone is refused');
  ok((await answers.suggest(db, SEND, [{ name: 'Riya', role: 'photography' }], { agreed: true, now: NOW })).error === 'Choose a role this call needs.', '5.4 a role the call does not need is refused');
  ok((await answers.suggest(db, SEND, [{ name: 'Riya', role: 'model', link: 'javascript:alert(1)' }], { agreed: true, now: NOW })).error === 'Write the profile link, for example https://www.instagram.com/name', '5.5 a bad link is refused');
  ok((await answers.suggest(db, SEND, Array.from({ length: 11 }, (_, i) => ({ name: `P${i}`, role: 'model' })), { agreed: true, now: NOW })).error === 'You can suggest up to 10 people at a time.', '5.6 eleven at once is refused');
  const r5 = await answers.suggest(db, SEND, [{ name: 'Riya Sharma', role: 'model', link: 'instagram.com/riya' }, { name: 'Kabir', role: 'stylist' }], { agreed: true, now: NOW, deps: { addPartnerInterest: addPI } });
  ok(r5.ok && r5.line === 'Sent. Aanya Makeup Studio sees them on the call.' && calls.length === 2 && calls[0].send_id === SEND.id && calls[0].partner_id === O1 && calls[0].post_id === POST, '5.7 each person goes through CLB\'s addPartnerInterest with the send', JSON.stringify(r5));
  ok(db.tables.partner_answers.length === 2 && db.tables.partner_answers[0].talent_link === 'https://instagram.com/riya' && Object.keys(db.tables.partner_answers[0]).every((k) => !/phone|email/.test(k)), '5.8 one answer row each: name, role, link, no phone or email');
  await answers.suggest(db, SEND, [{ name: 'riya sharma', role: 'model' }], { agreed: true, now: NOW, deps: { addPartnerInterest: addPI } });
  ok(db.tables.partner_answers.length === 2, '5.9 the same person again is not doubled');
  db = base(); db.tables.collab_posts[0].event_date = '2026-10-01';
  ok((await answers.suggest(db, SEND, [{ name: 'Riya', role: 'model' }], { agreed: true, now: NOW })).error === 'This call is closed or its date has passed.', '5.10 a past call is refused');
  db = base(); db.tables.partner_orgs[0].check_state = 'blocked';
  ok((await answers.suggest(db, SEND, [{ name: 'Riya', role: 'model' }], { agreed: true, now: NOW })).error === 'This partner account is blocked. Write to partners@thedreamwedding.in.', '5.11 a blocked partner cannot suggest');

  sec('6  the Hub org page');
  const hub = require(R('src/lib/partners/hubPage'));
  db = fakeDb({ hub_profiles: [], partner_orgs: [org({ cities: ['All cities', 'Mumbai'], roles: ['model', 'nonsense'] })] });
  const pg = await hub.ensureOrgProfile(db, db.tables.partner_orgs[0]);
  const row = db.tables.hub_profiles[0];
  ok(row && row.owner_kind === 'org' && row.org_id === O1 && row.handle === 'modelconnect.in' && row.city === 'Mumbai' && JSON.stringify(row.roles) === '["model"]', '6.1 one org page: handle from Instagram, a real city, collab roles only', JSON.stringify(row));
  ok(!('check_state' in row), '6.2 PTN writes no check label on the Hub (the column keeps its default)');
  db.tables.partner_orgs[0].name = 'Model Connect India';
  await hub.ensureOrgProfile(db, db.tables.partner_orgs[0]);
  ok(db.tables.hub_profiles.length === 1 && db.tables.hub_profiles[0].display_name === 'Model Connect India', '6.3 a second call keeps one page and follows the name');
  const card = await hub.orgPageFor(db, 'modelconnect.in');
  ok(card && card.fee_line === 'This partner may charge its own fees. TDW takes no fee and has no part in it.' && Array.isArray(card.work) && card.work.length === 0 && !('label' in card) && !('checked' in card), '6.4 the page: fee line, an empty work strip, no check label', JSON.stringify(card));
  ok(card && card.instagram && card.instagram.url === 'https://www.instagram.com/modelconnect.in/' && card.website && card.website.url === 'https://modelconnect.in/', '6.5 Instagram and website as links');
  db.tables.partner_orgs[0].check_state = 'blocked';
  ok(await hub.orgPageFor(db, 'modelconnect.in') === null, '6.6 a blocked partner has no page');

  sec('7  the mark (Verified / Unverified) and its ONE switch, partners.check_label');
  const orgsLib = require(R('src/lib/partners/orgs'));
  const IR = { id: crypto.randomUUID(), source: 'partner', partner_id: O1, display_name: 'Riya Sharma', role: 'model', link: 'https://www.instagram.com/riya/' };
  ok(orgsLib.CHECK_WORDS.unchecked === 'Unverified' && orgsLib.CHECK_WORDS.checked === 'Verified' && orgsLib.LABEL_KEY === 'partners.check_label', '7.1 the founder\'s words, one home; the one key');
  const sw = async (value) => orgsLib.markOn(baseFakeDb({ admin_config: value === undefined ? [] : [{ key: 'partners.check_label', value }] }));
  ok(await sw(undefined) === false && await sw('off') === false && await sw('yes') === false && await sw('1') === false && await sw('on') === true && await sw('"on"') === true && await sw(' ON ') === true
    && await orgsLib.markOn({ from() { throw new Error('down'); } }) === false, '7.2 the switch: on (as text or JSON, any case) shows; no row, off, junk or no database: not shown');
  const pubR = require(R('src/api/public/partnerPublic')); const laneR = require(R('src/api/partner/index')); const adminR = require(R('src/api/admin/partners'));
  const doors = async (cfg) => {
    const mk7 = () => baseFakeDb({ partner_orgs: [org()], partner_members: [], users: [], partner_reports: [], partner_connections: [], admin_config: cfg });
    const p7 = await callRoute(pubR, 'get', '/p/:handle', { params: { handle: 'modelconnect.in' }, app: { locals: { supabase: mk7() } } });
    const m7 = await callRoute(laneR, 'get', '/me', { partner: { id: O1, role: 'owner', org: org() }, partnerUser: { id: crypto.randomUUID() }, app: { locals: { supabase: mk7() } } });
    const a7 = await callRoute(adminR, 'get', '/:id', { params: { id: O1 }, app: { locals: { supabase: mk7() } } });
    return [p7.body && p7.body.partner, m7.body && m7.body.partner, a7.body && a7.body.partner];
  };
  const off = await doors([]); const on = await doors([{ key: 'partners.check_label', value: 'on' }]);
  ok(off.every((x) => x && x.check_words === null), '7.3 switch off: the public page, the partner\'s own area and the admin carry NO mark (check_words null)', JSON.stringify(off.map((x) => x && x.check_words)));
  ok(on.every((x) => x && x.check_words === 'Unverified'), '7.4 switch on: "Unverified" at all three doors', JSON.stringify(on.map((x) => x && x.check_words)));
  ok(off[2].check_state === 'unchecked', '7.5 the admin keeps check_state whatever the switch');
  const rowsLib = require(R('src/lib/partners/interestRows'));
  const r7 = await rowsLib.partnerRowsFor(baseFakeDb({ partner_orgs: [org({ check_state: 'checked' })] }), [IR]);
  ok(r7[0] && r7[0].check_words === 'Verified', '7.6 A2-0 as landed passes the new words from the one home (CLB shows them only with the switch on)');
  const PTN7 = [...fs.readdirSync(R('src/lib/partners')).map((f) => 'src/lib/partners/' + f), ...fs.readdirSync(R('src/api/partner')).map((f) => 'src/api/partner/' + f),
    'src/api/public/partnerPublic.js', 'src/api/admin/partners.js', 'src/api/vendor/partnerContact.js'].filter((f) => f.endsWith('.js'));
  const srcAll7 = PTN7.map((f) => fs.readFileSync(R(f), 'utf8')).join('\n');
  ok(!/checked by TDW|Not yet checked/i.test(srcAll7), '7.7 no "Checked by TDW" or "Not yet checked by TDW" left in PTN\'s doors and libraries');

  sec('8  Contact and Report');
  const contactRouter = require(R('src/api/vendor/partnerContact'));
  const SID = crypto.randomUUID();
  const cdb = (o = {}) => fakeDb({ partner_orgs: [org(o)], collab_posts: [post()], collab_interest: [{ ...IR, post_id: POST, send_id: SID }], partner_connections: [], partner_reports: [] });
  const her = { vendor: { id: V_TEST } }; const notHer = { vendor: { id: V_OTHER } };
  db = cdb();
  let r8 = await callRoute(contactRouter, 'post', '/partner-contact/:interest_id', { ...her, params: { interest_id: IR.id }, app: { locals: { supabase: db } } });
  ok(r8.code === 200 && r8.body.kind === 'email' && r8.body.href.startsWith('mailto:bookings@modelconnect.in?') && /partner%2Fcall%2F/.test(r8.body.href), '8.1 Contact: an email to the partner, the call\'s link written in', JSON.stringify(r8.body));
  ok(db.tables.partner_connections.length === 1 && db.tables.partner_connections[0].kind === 'contact' && db.tables.partner_connections[0].ref_id === POST, '8.2 one connection, keyed to the call');
  await callRoute(contactRouter, 'post', '/partner-contact/:interest_id', { ...her, params: { interest_id: IR.id }, app: { locals: { supabase: db } } });
  ok(db.tables.partner_connections.length === 1, '8.3 a second tap is not a second connection');
  db = cdb(); db.tables.partner_connections.push(...[1, 2, 3, 4].map((n) => ({ id: crypto.randomUUID(), partner_id: O1, kind: 'pick', ref_id: crypto.randomUUID(), vendor_id: V_OTHER, n })));
  r8 = await callRoute(contactRouter, 'post', '/partner-contact/:interest_id', { ...her, params: { interest_id: IR.id }, app: { locals: { supabase: db } } });
  ok(r8.code === 200 && r8.body.href, '8.4 A VENDOR IS NEVER BLOCKED: a partner past its 3 free connections, no plan, she still gets through (point 5)');
  db = cdb({ whatsapp_opt: true });
  r8 = await callRoute(contactRouter, 'post', '/partner-contact/:interest_id', { ...her, params: { interest_id: IR.id }, app: { locals: { supabase: db } } });
  ok(r8.body.kind === 'whatsapp' && r8.body.href.startsWith('https://wa.me/919811100021?text='), '8.5 a partner that chose WhatsApp: WhatsApp');
  r8 = await callRoute(contactRouter, 'post', '/partner-contact/:interest_id', { ...notHer, params: { interest_id: IR.id }, app: { locals: { supabase: cdb() } } });
  ok(r8.code === 404 && r8.body.error === 'This suggestion is not on one of your calls.', '8.6 not her call: 404, plain words');
  db = cdb();
  r8 = await callRoute(contactRouter, 'post', '/partner-report', { ...her, body: { interest_id: IR.id, reason: 'asked_for_money' }, app: { locals: { supabase: db } } });
  ok(r8.code === 200 && db.tables.partner_reports.length === 1 && db.tables.partner_reports[0].item_kind === 'call_answer', '8.7 Report: one row, item call_answer');
  r8 = await callRoute(contactRouter, 'post', '/partner-report', { ...her, body: { interest_id: IR.id, reason: 'spam' }, app: { locals: { supabase: db } } });
  ok(r8.code === 400, '8.8 an unknown reason is refused');

  sec('9  raw bodies: no phone or email of anyone (the chair\'s condition 3)');
  const pub = require(R('src/api/public/partnerPublic')); const lane = require(R('src/api/partner/index')); const admin = require(R('src/api/admin/partners'));
  const calls2 = require(R('src/lib/partners/calls'));
  const SEND9 = crypto.randomUUID(); const tok = calls2.tokenFor(SEND9, ENV);
  const db9 = () => fakeDb({ partner_orgs: [org()], collab_posts: [post()], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }], vendors: [vendor],
    partner_sends: [{ id: SEND9, partner_id: O1, post_id: POST, channel: 'email', state: 'sent', token_hash: calls2.tokenHash(tok), sent_at: '2026-10-12T05:00:00.000Z' }],
    partner_answers: [{ id: crypto.randomUUID(), send_id: SEND9, talent_name: 'Riya Sharma', talent_role: 'model', talent_link: 'https://www.instagram.com/riya/' }],
    partner_members: [], users: [], partner_reports: [], partner_connections: [], collab_interest: [{ ...IR, post_id: POST, send_id: SEND9 }] });
  const scan = (b) => { const s = JSON.stringify(b).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ''); return { email: (s.match(/[^\s@"'<>:/]+@[^\s@"'<>]+\.[a-z]{2,}/gi) || []), phone: (s.match(/\+?\d[\d\s-]{8,}\d/g) || []).filter((x) => x.replace(/\D/g, '').length >= 10) }; };
  const partnerReq = { partner: { id: O1, role: 'owner', org: org() }, partnerUser: { id: crypto.randomUUID() } };
  const bodies = [
    ['GET /public/partner/call/:token', await callRoute(pub, 'get', '/call/:token', { params: { token: tok }, app: { locals: { supabase: db9() } } })],
    ['POST /public/partner/call/:token/suggest', await callRoute(pub, 'post', '/call/:token/suggest', { params: { token: tok }, body: { agreed: true, people: [{ name: 'Neha', role: 'model' }] }, app: { locals: { supabase: db9() } } })],
    ['POST /public/partner/call/:token/stop', await callRoute(pub, 'post', '/call/:token/:what(stop|pause)', { params: { token: tok, what: 'stop' }, app: { locals: { supabase: db9() } } })],
    ['GET /partner/calls', await callRoute(lane, 'get', '/calls', { ...partnerReq, app: { locals: { supabase: db9() } } })],
    ['GET /admin/partners/:id/sends', await callRoute(admin, 'get', '/:id/sends', { params: { id: O1 }, app: { locals: { supabase: db9() } } })],
    ['POST /vendor/partner-report', await callRoute(contactRouter, 'post', '/partner-report', { ...her, body: { interest_id: IR.id, reason: 'other' }, app: { locals: { supabase: db9() } } })],
  ];
  for (const [name, r] of bodies) { const s = scan(r.body); ok(r.code < 500 && s.email.length === 0 && s.phone.length === 0, `9.x ${name}: no email, no phone (${r.code})`, JSON.stringify(s) + ' ' + JSON.stringify(r.body).slice(0, 160)); }
  const g9 = bodies[0][1].body;
  ok(g9.call && g9.call.vendor.name === 'Aanya Makeup Studio' && g9.call.note && /\[number hidden\]/.test(g9.call.note), '9.7 the booker\'s page shows the call, her note masked');
  const c9 = await callRoute(contactRouter, 'post', '/partner-contact/:interest_id', { ...her, params: { interest_id: IR.id }, app: { locals: { supabase: db9() } } });
  const s9 = scan(c9.body);
  ok(s9.email.length === 1 && /bookings@modelconnect\.in/.test(decodeURIComponent(s9.email[0])) && s9.phone.length === 0, '9.8 the ONE exception: her Contact tap answers the partner\'s own calls address, and nothing else', JSON.stringify(s9));

  sec('10  the seams');
  ok(seams.createCallFor === require(R('src/lib/collab/calls')).createCallFor && seams.addPartnerInterest === require(R('src/lib/collab/interest')).addPartnerInterest && seams.onPostCreated === require(R('src/lib/collab/events')).onPostCreated, '10.1 three seams wired to CLB-2a\'s own functions');
  let threw = ''; try { await seams.kitFor(); } catch (e) { threw = e.message; } ok(/P3/.test(threw), '10.2 the media kit still says plainly it is not wired');
  ok(seams.verifiedWeddingsFor === require(R('src/lib/papers/verifiedWeddings')).countVerified, '10.3 verified weddings: PRO\'s countVerified');

  sec('11  the shared lines');
  const rt = fs.readFileSync(R('src/api/router.js'), 'utf8'); const ix = fs.readFileSync(R('src/index.js'), 'utf8'); const cr = fs.readFileSync(R('src/cron.js'), 'utf8');
  const a = rt.indexOf("require('./vendor/partnerContact')"); const b = rt.indexOf("router.use('/vendor',             require('./vendor/core'))");
  ok(a > 0 && b > a, '11.1 router.js: partnerContact mounted under /vendor, above core');
  ok(/require\('\.\/lib\/partners\/sends'\)\.register\(\(\) => supabase\)/.test(ix), '11.2 index.js: the listener registered at boot');
  ok(/cron\.schedule\('2-59\/5 \* \* \* \*', async \(\) => \{\s*try \{\s*const \{ drain \} = require\('\.\/lib\/partners\/sends'\);/.test(cr), '11.3 cron.js: the drain at :02, :07 ... Asia/Kolkata');
  const others = [...cr.matchAll(/cron\.schedule\('([^']+)'/g)].map((x) => x[1]).filter((x) => x !== '2-59/5 * * * *');
  const mins = new Set(); for (const s of others) { const f = s.split(' ')[0]; if (/^\d+$/.test(f)) mins.add(+f); else if (/^\*\/(\d+)$/.test(f)) { const st = +f.slice(2); for (let i = 0; i < 60; i += st) mins.add(i); } else if (/^[\d,]+$/.test(f)) f.split(',').forEach((x) => mins.add(+x)); }
  const mine = Array.from({ length: 12 }, (_, i) => 2 + 5 * i);
  ok(mine.every((x) => !mins.has(x)), `11.4 no other job in cron.js runs at :02, :07 ... (${[...mins].sort((x, y) => x - y).join(',')})`);

  sec('12  forward makes her call');
  const fwd = require(R('src/lib/partners/forward'));
  ok(fwd.validateRequest({ asked: true, vendor_id: V_TEST, role: 'a model', city: 'Delhi NCR', event_date: '2026-10-18', budget_from: 1, budget_to: 2, pay_kind: 'paid' }).error === 'Choose what she needs from the list.', '12.1 a TDW vendor\'s need must be on the list');
  db = fakeDb({ vendors: [vendor], collab_posts: [], collab_post_items: [], forward_requests: [], forward_recipients: [], partner_contacts: [{ id: crypto.randomUUID(), name: 'MC', kind: 'agency', how_we_know: 'x', instagram_handle: 'mc.in' }], prospects: [] });
  const r12 = await callRoute(admin, 'post', '/forward', { admin: { name: 'Dev' }, body: { asked: true, vendor_id: V_TEST, role: 'model', city: 'Delhi NCR', event_date: '2099-10-18', budget_from: 3000, budget_to: 5000, pay_kind: 'paid', contact_ids: [db.tables.partner_contacts[0].id] }, app: { locals: { supabase: db } } });
  ok(r12.code === 200 && db.tables.collab_posts.length === 1 && db.tables.collab_posts[0].source === 'tdw_forward' && db.tables.forward_requests[0].post_id === db.tables.collab_posts[0].id, '12.2 her request becomes her own call (source tdw_forward), the request keeps its id', JSON.stringify(r12.body).slice(0, 200));
  const r12b = await callRoute(admin, 'post', '/forward', { admin: { name: 'Dev' }, body: { asked: true, vendor_id: V_TEST, role: 'model', city: 'Delhi NCR', event_date: '2020-01-01', budget_from: 1, budget_to: 2, pay_kind: 'paid', contact_ids: [db.tables.partner_contacts[0].id] }, app: { locals: { supabase: db } } });
  ok(r12b.code === 400 && r12b.body.error === 'The date has passed. Choose a date ahead.', '12.3 a past date: refused in plain words, nothing made', JSON.stringify(r12b.body));

  sec('13  the contract with CLB: 403 with NOT_OPEN, 400 for bad input, never a 500');
  const { NOT_OPEN } = require(R('src/lib/collab/interest'));
  const answersLib = require(R('src/lib/partners/answers'));
  const S13 = crypto.randomUUID(); const tok13 = calls2.tokenFor(S13, ENV);
  const db13 = (p = {}, extra = {}) => fakeDb({ partner_orgs: [org()], collab_posts: [post(p)], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }], vendors: [vendor],
    partner_sends: [{ id: S13, partner_id: O1, post_id: POST, channel: 'email', state: 'sent', token_hash: calls2.tokenHash(tok13), sent_at: '2026-10-12T05:00:00.000Z' }],
    partner_answers: [], collab_interest: [], ...extra });
  const pReq13 = { partner: { id: O1, role: 'owner', org: org() }, partnerUser: { id: crypto.randomUUID() } };
  const GOOD = { agreed: true, people: [{ name: 'Neha', role: 'model' }] };
  // a closed vendor's call (V_OTHER: not a tester, the switch off), at both doors
  let d13 = db13({ vendor_id: V_OTHER });
  const c1 = await callRoute(pub, 'post', '/call/:token/suggest', { params: { token: tok13 }, body: GOOD, app: { locals: { supabase: d13 } } });
  ok(c1.code === 403 && c1.body.error === NOT_OPEN && d13.tables.collab_interest.length === 0 && d13.tables.partner_answers.length === 0,
    '13.1 the emailed link, a closed vendor\'s call: 403 with CLB\'s NOT_OPEN sentence, word for word; no row written', JSON.stringify(c1));
  d13 = db13({ vendor_id: V_OTHER });
  const c1b = await callRoute(lane, 'post', '/calls/:send_id/suggest', { ...pReq13, params: { send_id: S13 }, body: GOOD, app: { locals: { supabase: d13 } } });
  let spyCalls = 0;
  const s13 = await answersLib.suggest(db13({ vendor_id: V_OTHER }), { id: S13, partner_id: O1, post_id: POST }, GOOD.people, { agreed: true, now: NOW, deps: { addPartnerInterest: async () => { spyCalls++; return { id: crypto.randomUUID(), existed: false }; } } });
  ok(c1b.code === 403 && c1b.body.error === NOT_OPEN && d13.tables.collab_interest.length === 0 && d13.tables.partner_answers.length === 0 && s13.status === 403 && spyCalls === 0,
    '13.2 signed in, the same: 403, no row; PTN asks the gate BEFORE any write (CLB\'s writer is never reached)', JSON.stringify({ c1b, spyCalls }));
  const race = await answersLib.suggest(db13(), { id: S13, partner_id: O1, post_id: POST }, GOOD.people, { agreed: true, now: NOW, deps: { addPartnerInterest: async () => { throw new Error(NOT_OPEN); } } });
  ok(race.ok === false && race.status === 403 && race.error === NOT_OPEN, '13.3 CLB\'s own guard wins a race: still 403 with its sentence, not a 500');
  d13 = db13();
  const after = await callRoute(pub, 'post', '/call/:token/suggest', { params: { token: tok13 }, body: GOOD, app: { locals: { supabase: d13 } } });
  ok(after.code === 200 && d13.tables.collab_interest.length === 1, '13.4 the server stays up: the next suggestion, on an open call, goes through');
  // bad input: every one a 400 in plain words, no row, never a 500
  const BAD = [['no tick', { people: GOOD.people }], ['tick as text', { agreed: 'true', people: GOOD.people }], ['people as text', { agreed: true, people: 'Neha' }],
    ['people as an object', { agreed: true, people: { name: 'Neha' } }], ['no people', { agreed: true, people: [] }], ['a number for a name', { agreed: true, people: [{ name: 5 }] }],
    ['an object for a name', { agreed: true, people: [{ name: { a: 1 } }] }], ['a null person', { agreed: true, people: [null] }], ['a list for a person', { agreed: true, people: [['Neha']] }],
    ['a number for a role', { agreed: true, people: [{ name: 'Neha', role: 7 }] }], ['an object for a link', { agreed: true, people: [{ name: 'Neha', link: { u: 1 } }] }],
    ['eleven people', { agreed: true, people: Array.from({ length: 11 }, (_, i) => ({ name: 'P' + i })) }], ['an email for a name', { agreed: true, people: [{ name: 'neha@mail.com' }] }],
    ['a phone for a name', { agreed: true, people: [{ name: 'Neha 98111 00099' }] }], ['a role the call does not need', { agreed: true, people: [{ name: 'Neha', role: 'photography' }] }],
    ['a javascript: link', { agreed: true, people: [{ name: 'Neha', link: 'javascript:alert(1)' }] }], ['an empty body', null], ['a list for a body', [1, 2]], ['a text body', 'x']];
  const badOut = [];
  for (const [name, body] of BAD) for (const door of ['link', 'signed in']) {
    const dd = db13();
    let r; try {
      r = door === 'link' ? await callRoute(pub, 'post', '/call/:token/suggest', { params: { token: tok13 }, body, app: { locals: { supabase: dd } } })
        : await callRoute(lane, 'post', '/calls/:send_id/suggest', { ...pReq13, params: { send_id: S13 }, body, app: { locals: { supabase: dd } } });
    } catch (e) { r = { code: 'THREW ' + e.message }; }
    if (!(r.code === 400 && r.body && typeof r.body.error === 'string' && r.body.error.length > 5 && dd.tables.collab_interest.length === 0 && dd.tables.partner_answers.length === 0)) badOut.push(`${door}: ${name} -> ${JSON.stringify(r).slice(0, 120)}`);
  }
  ok(badOut.length === 0, `13.5 ${BAD.length} kinds of bad input at both doors: each a 400 in plain words, no row written`, badOut.slice(0, 3).join(' || '));
  const wrong = [await callRoute(pub, 'post', '/call/:token/suggest', { params: { token: 'not-a-token' }, body: GOOD, app: { locals: { supabase: db13() } } }),
    await callRoute(lane, 'post', '/calls/:send_id/suggest', { ...pReq13, params: { send_id: 'not-a-uuid' }, body: GOOD, app: { locals: { supabase: db13() } } })];
  ok(wrong.every((r) => r.code === 404), '13.6 a wrong link or a call not sent to you: 404, not a 500');
  const broken = db13(); const realFrom = broken.from.bind(broken);
  broken.from = (t) => { if (t === 'partner_orgs') throw new Error('connection reset'); return realFrom(t); };
  let b13; try { b13 = await callRoute(pub, 'post', '/call/:token/suggest', { params: { token: tok13 }, body: GOOD, app: { locals: { supabase: broken } } }); } catch (e) { b13 = { code: 'THREW ' + e.message }; }
  ok(b13.code === 503 && b13.body.error === 'Could not save just now. Try again in a minute.' && !/connection reset/.test(JSON.stringify(b13.body)), '13.7 the database fails mid-suggestion: 503 in plain words, no stack, not a 500', JSON.stringify(b13));

  console.log(`\nb292: ${pass} passed, ${fail} failed${fail ? '\nFAILED: ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR', e && e.stack); process.exit(1); });
