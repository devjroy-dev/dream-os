'use strict';
// scripts/b293_ptn_a2_0_rows_bench.js · CE-47 · PTN-A2-0 · rung b293 · partnerRowsFor, a pure mapping for CLB's HUB-2b.
// r2 (7 Oct 2026): the mark's words are read from orgs.CHECK_WORDS, never written here.
// §1 the signature. §2 every field, exactly, and nothing else. §3 a BLOCKED partner's row is DROPPED (and a missing one;
//    other sources ignored; order kept). §4 check_words is a separate field, never a label; this file reads no switch.
// §5 RAW OUTPUT: hostile rows (emails and phones in names, bodies, links, the partner's own fields) and the serialised
//    output holds nothing shaped like an email or a phone. §6 purity: one read, no write, no door, no gate, no send.
// §7 role words. §8 a failed read says so plainly.
// Self-contained: its own two-method fake of supabase. No clock, no network. RED at a clean base (absent subject).
// --mutate: three production mutations, each must redden its cell, each file restored byte for byte (e-277: the run
// STOPS first if a mutation anchor is missing). THE EXIT IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..'); const R = (p) => path.join(ROOT, p);
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
let pass = 0; let fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 300) + ']'}`); } };
const sec = (t) => console.log(`\n§${t}`);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const FILE = 'src/lib/partners/interestRows.js';

const MUTS = [
  { anchor: "    if (!o || o.check_state === 'blocked') continue;\n", to: '    if (!o) continue;\n', reddens: /FAIL  3\.1/ },
  { anchor: "  t = t.replace(PHONE, (m) => (digitsIn(m) >= 10 ? ' ' : m));\n", to: '', reddens: /FAIL  5\.1/ },
  { anchor: "  if (/(^|\\.)(wa\\.me|whatsapp\\.com|api\\.whatsapp\\.com)$/.test(host)) return null;\n", to: '', reddens: /FAIL  5\.1/ },
];
if (!fs.existsSync(R(FILE))) { console.log(`FAIL  0.0 ${FILE} is absent\n\nb293: 0 passed, 1 failed`); process.exit(1); }
if (!process.env.B293_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(FILE), 'utf8').includes(m.anchor)) { console.log(`STOP — a mutation anchor is missing from ${FILE}; restore it with git checkout before running b293.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const orig = fs.readFileSync(R(FILE), 'utf8'); let red = false;
    fs.writeFileSync(R(FILE), orig.replace(m.anchor, m.to));
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B293_MUT_CHILD: '1' } }); red = r.status !== 0 && m.reddens.test(r.stdout); }
    finally { fs.writeFileSync(R(FILE), orig); }
    ok(red, `M${i + 1} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`);
    ok(sha(fs.readFileSync(R(FILE), 'utf8')) === sha(orig), `M${i + 1} ${FILE} restored byte for byte`);
  }
  console.log(`\nb293 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

// a two-method fake: from(t).select(cols).in(col, ids). It records every call so §6 can prove one read.
function fake(tables, opts = {}) {
  const calls = [];
  return { calls, from(t) {
    const q = { t, cols: null, op: 'select' };
    const api = {
      select(c) { q.cols = c; return api; },
      in(col, ids) { calls.push({ ...q, col, ids }); if (opts.error) return Promise.resolve({ data: null, error: { message: opts.error } });
        const want = String(q.cols).split(',').map((s) => s.trim());
        const data = (tables[t] || []).filter((r) => ids.includes(r[col])).map((r) => Object.fromEntries(want.map((k) => [k, r[k]])));
        return Promise.resolve({ data, error: null }); },
      insert() { calls.push({ t, op: 'insert' }); return api; }, update() { calls.push({ t, op: 'update' }); return api; },
      upsert() { calls.push({ t, op: 'upsert' }); return api; }, delete() { calls.push({ t, op: 'delete' }); return api; },
    };
    return api;
  } };
}

const P1 = '11111111-1111-4111-8111-111111111111'; const P2 = '22222222-2222-4222-8222-222222222222';
const P3 = '33333333-3333-4333-8333-333333333333'; const PX = '99999999-9999-4999-8999-999999999999';
const ORGS = [
  { id: P1, name: 'Studio Noor', kind: 'talent_agency', cities: ['Jaipur', 'Delhi'], instagram_handle: 'studionoor', website: 'studionoor.in', check_state: 'unchecked', calls_email: 'calls@studionoor.in', phone: '+919811100001', daily_cap: 10 },
  { id: P2, name: 'Kaveri House', kind: 'fashion_house', cities: [], instagram_handle: null, website: null, check_state: 'checked', calls_email: 'desk@kaveri.in', phone: '9811100002' },
  { id: P3, name: 'Blocked Co', kind: 'brand', cities: ['Mumbai'], instagram_handle: 'blockedco', website: 'blocked.co', check_state: 'blocked', calls_email: 'x@blocked.co' },
];
const row = (o) => ({ post_id: 'post-1', send_id: 'send-1', platform: null, how: null, body: null, external_user_id: null, vendor_id: 'v-1', join_link_sent: false, created_at: '2026-10-07T10:00:00Z', ...o });

(async () => {
  const { partnerRowsFor, ROW_KEYS, PARTNER_KEYS } = require(R(FILE));
  const { CHECK_WORDS } = require(R('src/lib/partners/orgs'));

  sec('1  the signature');
  ok(typeof partnerRowsFor === 'function' && partnerRowsFor.length === 2, '1.1 partnerRowsFor(sb, rows), two arguments');
  const db0 = fake({ partner_orgs: ORGS });
  const p0 = partnerRowsFor(db0, []);
  ok(p0 instanceof Promise, '1.2 it returns a Promise');
  ok(Array.isArray(await p0) && (await p0).length === 0, '1.3 no rows: []');
  ok((await partnerRowsFor(db0, null)).length === 0 && (await partnerRowsFor(db0, 'x')).length === 0, '1.4 not an array: [], no throw');
  ok((await partnerRowsFor(db0, [row({ id: 'i0', source: 'instagram', platform: 'instagram', how: 'comment', display_name: 'insta' })])).length === 0 && db0.calls.length === 0, '1.5 no partner rows: [] and NO read at all');

  sec('2  every field, exactly');
  const db = fake({ partner_orgs: ORGS });
  const out = await partnerRowsFor(db, [
    row({ id: 'i1', source: 'partner', partner_id: P1, display_name: 'Riya Sharma', role: 'model', link: 'riya.portfolio.in' }),
    row({ id: 'i2', source: 'partner', partner_id: P2, display_name: 'Meher', role: 'makeup', link: null }),
  ]);
  ok(out.length === 2, '2.0 two partner rows in, two out', JSON.stringify(out));
  ok(out.every((r) => JSON.stringify(Object.keys(r)) === JSON.stringify(ROW_KEYS)), '2.1 every row has exactly ROW_KEYS, in order', JSON.stringify(out.map((r) => Object.keys(r))));
  ok(out.every((r) => JSON.stringify(Object.keys(r.partner)) === JSON.stringify(PARTNER_KEYS)), '2.2 every partner has exactly PARTNER_KEYS, in order');
  ok(JSON.stringify(ROW_KEYS) === JSON.stringify(['id', 'source', 'name', 'role', 'role_word', 'link', 'partner', 'check_words', 'fee_line'])
    && JSON.stringify(PARTNER_KEYS) === JSON.stringify(['name', 'kind_words', 'cities', 'instagram_url', 'website_url']), '2.3 the field list is the one written to CLB');
  const want1 = { id: 'i1', source: 'partner', name: 'Riya Sharma', role: 'model', role_word: 'model', link: 'https://riya.portfolio.in/',
    partner: { name: 'Studio Noor', kind_words: 'Talent agency', cities: ['Jaipur', 'Delhi'], instagram_url: 'https://www.instagram.com/studionoor/', website_url: 'https://studionoor.in/' },
    check_words: CHECK_WORDS.unchecked, fee_line: 'This partner may charge its own fees. TDW takes no fee and has no part in it.' };
  ok(JSON.stringify(out[0]) === JSON.stringify(want1), '2.4 row 1, value for value', JSON.stringify(out[0]));
  const want2 = { id: 'i2', source: 'partner', name: 'Meher', role: 'makeup', role_word: 'makeup artist', link: null,
    partner: { name: 'Kaveri House', kind_words: 'Fashion house', cities: [], instagram_url: null, website_url: null },
    check_words: CHECK_WORDS.checked, fee_line: 'This partner may charge its own fees. TDW takes no fee and has no part in it.' };
  ok(JSON.stringify(out[1]) === JSON.stringify(want2), '2.5 row 2 (no link, no handle, no website, no cities): nulls and [], value for value', JSON.stringify(out[1]));

  sec('3  a blocked partner is DROPPED');
  const mixed = await partnerRowsFor(fake({ partner_orgs: ORGS }), [
    row({ id: 'a', source: 'partner', partner_id: P3, display_name: 'Should Not Show', role: 'model' }),
    row({ id: 'b', source: 'partner', partner_id: P1, display_name: 'Anya', role: 'stylist' }),
    row({ id: 'c', source: 'partner', partner_id: PX, display_name: 'Orphan', role: 'model' }),
    row({ id: 'd', source: 'threads', platform: 'threads', how: 'reply', display_name: 'threads person', partner_id: null }),
    row({ id: 'e', source: 'partner', partner_id: P2, display_name: 'Tara', role: 'studio' }),
  ]);
  ok(!mixed.some((r) => r.id === 'a') && !JSON.stringify(mixed).includes('Should Not Show') && !JSON.stringify(mixed).includes('Blocked Co'), '3.1 a blocked partner\'s row is dropped, its name nowhere in the output', JSON.stringify(mixed));
  ok(!mixed.some((r) => r.id === 'c'), '3.2 a partner that cannot be found: dropped');
  ok(!mixed.some((r) => r.id === 'd'), '3.3 a row of another source is ignored, never echoed');
  ok(mixed.map((r) => r.id).join() === 'b,e', '3.4 the rest, in the order given');
  ok((await partnerRowsFor(fake({ partner_orgs: ORGS }), [row({ id: 'z', source: 'partner', partner_id: P3, display_name: 'Z' })])).length === 0, '3.5 only blocked rows in: []');

  sec('4  check_words is a separate field, never a label');
  ok(out[0].check_words === CHECK_WORDS.unchecked && out[1].check_words === CHECK_WORDS.checked && !!CHECK_WORDS.unchecked && !!CHECK_WORDS.checked, '4.1 the words for unchecked and checked come from orgs.CHECK_WORDS');
  const flat = JSON.stringify(out);
  ok(!/"label"|"checked"\s*:|"verified"|"badge"/.test(flat), '4.2 no field named label, checked, verified or badge');
  ok(!('check_words' in out[0].partner), '4.3 not inside the partner card: a separate field CLB decides on');
  const src = fs.readFileSync(R(FILE), 'utf8');
  const code = src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  ok(!/admin_config|check_label|capabilities/.test(code), '4.4 this file reads no switch (CLB reads partners.check_label)');
  ok(!/checked by TDW|Verified|Unverified/i.test(src), '4.5 this file holds no mark words of its own, old or new (one home: orgs.CHECK_WORDS)');

  sec('5  RAW OUTPUT: no phone and no email of anyone');
  const HOSTILE_ORGS = [
    { id: P1, name: 'Noor hello@noor.in 98111 00011', kind: 'talent_agency', cities: ['Jaipur'], instagram_handle: 'noor9811100012', website: 'https://wa.me/919811100013', check_state: 'checked', calls_email: 'calls@noor.in', phone: '+919811100014' },
    { id: P2, name: 'Kaveri', kind: 'brand', cities: [], instagram_handle: 'kaveri', website: 'mailto:desk@kaveri.in', check_state: 'unchecked', calls_email: 'desk@kaveri.in' },
  ];
  const hostile = await partnerRowsFor(fake({ partner_orgs: HOSTILE_ORGS }), [
    row({ id: 'h1', source: 'partner', partner_id: P1, display_name: 'Riya riya@mail.com', role: 'model', link: 'https://api.whatsapp.com/send?phone=919811100015', body: 'call me 9811100016 or riya@mail.com', external_user_id: '9811100017', phone: '9811100018', email: 'x@y.in' }),
    row({ id: 'h2', source: 'partner', partner_id: P1, display_name: 'Anya +91 98111-00019', role: 'stylist', link: 'https://anya.in/contact/9811100020' }),
    row({ id: 'h3', source: 'partner', partner_id: P2, display_name: 'Tara (981) 110 0021', role: 'studio', link: 'https://user:pw@tara.in' }),
    row({ id: 'h4', source: 'partner', partner_id: P2, display_name: 'Sana', role: 'model', link: 'https://sana.in/%40me' }),
    row({ id: 'h5', source: 'partner', partner_id: P2, display_name: 'only@email.com', role: 'model' }),
    row({ id: 'h6', source: 'partner', partner_id: P2, display_name: 'Ira', role: 'model', link: 'https://wa.me/message/ABCDEF12' }),
  ]);
  const raw = JSON.stringify(hostile);
  const emailHits = raw.match(/[^\s"@]+@[^\s"@]+\.[a-z]{2,}/gi) || [];
  const digitRuns = (raw.match(/\+?\d[\d\s().-]{8,}\d/g) || []).filter((m) => (m.match(/\d/g) || []).length >= 10);
  ok(emailHits.length === 0 && digitRuns.length === 0 && !raw.includes('@') && !/wa\.me|whatsapp/i.test(raw), '5.1 the serialised output holds no email, no "@", no run of ten digits, no WhatsApp link', raw);
  ok(hostile.map((r) => r.name).join('|') === 'Riya|Anya|Tara|Sana|Ira', '5.2 names cut to their words; a name that was only an email is dropped', hostile.map((r) => r.name).join('|'));
  ok(hostile[0].partner.name === 'Noor' && hostile[0].partner.instagram_url === null && hostile[0].partner.website_url === null, '5.3 the partner\'s own name, handle and website carry no number or WhatsApp link', JSON.stringify(hostile[0].partner));
  ok(hostile.every((r) => r.link === null), '5.4 links carrying a number, an "@", a login or a WhatsApp address (a short link with no digits too): null', JSON.stringify(hostile.map((r) => r.link)));
  ok(!/body|external_user_id|vendor_id|send_id|post_id|calls_email|phone|email/.test(Object.keys(hostile[0]).join() + Object.keys(hostile[0].partner).join()), '5.5 no input column outside the list is carried');

  sec('6  purity: one read, no write, no door, no gate, no send');
  const dbp = fake({ partner_orgs: ORGS });
  await partnerRowsFor(dbp, [row({ id: 'p', source: 'partner', partner_id: P1, display_name: 'P' }), row({ id: 'q', source: 'partner', partner_id: P1, display_name: 'Q' })]);
  ok(dbp.calls.length === 1 && dbp.calls[0].t === 'partner_orgs' && dbp.calls[0].op === 'select', '6.1 exactly one read, of partner_orgs', JSON.stringify(dbp.calls));
  ok(JSON.stringify(dbp.calls[0].ids) === JSON.stringify([P1]), '6.2 each partner read once');
  ok(dbp.calls[0].cols === 'id, name, kind, cities, instagram_handle, website, check_state', '6.3 the columns read: no calls_email, no phone');
  ok(!/\.(insert|update|upsert|delete)\(|express|Router\(|fetch\(|require\(['"][^'"]*(sends|email|seams|gate|capabilities)/.test(code), '6.4 the file has no write, no route, no fetch, no gate and no send');
  const reqs = (code.match(/require\(['"]([^'"]+)['"]\)/g) || []).join();
  ok(reqs === "require('./links'),require('./orgs'),require('../collab/social')", '6.5 it requires only links, orgs and collab/social (all on main)', reqs);

  sec('7  role words');
  const rw = await partnerRowsFor(fake({ partner_orgs: ORGS }), ['model', 'stylist', 'studio', 'photography', 'hairstylist', null].map((role, i) => row({ id: 'r' + i, source: 'partner', partner_id: P1, display_name: 'N' + i, role })));
  ok(rw.map((r) => r.role_word).join('|') === 'model|stylist|studio|photographer|hair stylist|', '7.1 model, stylist, studio, the trades, and no role: null', rw.map((r) => r.role_word).join('|'));

  sec('8  a failed read');
  let msg = ''; try { await partnerRowsFor(fake({}, { error: 'boom' }), [row({ id: 'f', source: 'partner', partner_id: P1, display_name: 'F' })]); } catch (e) { msg = e.message; }
  ok(/partner_orgs could not be read \(boom\)/.test(msg), '8.1 says so plainly (CLB decides what the vendor sees)', msg);

  console.log(`\nb293: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('BENCH THREW', e && e.stack); process.exit(1); });
