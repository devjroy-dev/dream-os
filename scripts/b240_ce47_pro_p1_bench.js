#!/usr/bin/env node
// scripts/b240_ce47_pro_p1_bench.js · CE-47 · PRO · P1, server half: 0208, 0209, the verified-weddings rule, the papers,
// the check door; cut 2 (§10): each verified wedding's month and city, and the ID's photo (R3 (b)).
// No network, no database: the migrations are read as text; the rule runs on rows and through a fake store.
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0; const failed = [];
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } };
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

(async () => {
  console.log('\n── 1  0208: GST columns, new and nullable ──');
  const m8 = rd('db/migrations/0208_pro_gst_columns.sql');
  ok(/^BEGIN;/m.test(m8) && /^COMMIT;/m.test(m8), '1.1 0208 is one transaction');
  for (const c of ['taxable_value', 'gst_rate', 'gst_amount', 'supplier_name', 'supplier_gstin', 'bill_number', 'bill_file_url', 'source'])
    ok(new RegExp(`ALTER TABLE public\\.expenses[\\s\\S]*ADD COLUMN IF NOT EXISTS ${c}\\b`).test(m8), `1.2 expenses gains ${c}`);
  ok(/ALTER TABLE public\.invoices\s+ADD COLUMN IF NOT EXISTS gst_rate[\s\S]*ADD COLUMN IF NOT EXISTS gst_amount/.test(m8), '1.3 invoices gains gst_rate and gst_amount');
  ok(!/NOT NULL|DROP|RENAME|ALTER COLUMN|UPDATE |DELETE /i.test(m8.replace(/^--.*$/gm, '')), '1.4 0208 adds only nullable columns; changes and drops nothing');
  console.log('\n── 2  0209: issued papers ──');
  const m9 = rd('db/migrations/0209_pro_issued_papers.sql');
  ok(/CREATE TABLE IF NOT EXISTS public\.issued_papers/.test(m9) && /ENABLE ROW LEVEL SECURITY/.test(m9) && /TO service_role;/.test(m9) && !/TO (anon|authenticated)/.test(m9), '2.1 table, RLS on, service role only');
  ok(/kind IN \('certificate', 'id_card', 'statement', 'ca_pack'\)/.test(m9), '2.2 four kinds, as ruled');
  ok(/check_code\s+text\s+NOT NULL UNIQUE/.test(m9), '2.3 check code unique');
  const re = new RegExp(m9.match(/check_code ~ '([^']+)'/)[1]);
  ok(re.test('TDW-7Q4K-2M9P') && !re.test('TDW-7Q4K-2M9O') && !re.test('TDW-1QAK-2M9P') && !re.test('TDW-LQAK-2M9P') && !re.test('tdw-7q4k-2m9p'), '2.4 code shape: no 0, O, 1, I or L; upper case');
  ok(/figures\s+jsonb\s+NOT NULL/.test(m9) && /withdrawn_at\s+timestamptz,/.test(m9), '2.5 figures frozen at issue; withdrawable');

  console.log('\n── 3  the verified-weddings rule (F2) ──');
  const { countVerified, verifiedWeddings, todayIST } = require(path.join(ROOT, 'src/lib/papers/verifiedWeddings.js'));
  const T = '2026-10-06';
  const C = (o) => countVerified({ today: T, ...o }).count;
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 100 }], events: [{ linked_binder_id: 'B', event_date: '2026-09-01' }] }) === 1, '3.1 paid, binder date passed: 1');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 0 }], events: [{ linked_binder_id: 'B', event_date: '2026-09-01' }] }) === 0, '3.2 no payment: 0');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 100 }], events: [{ linked_binder_id: 'B', event_date: '2026-09-01' }, { linked_binder_id: 'B', event_date: '2026-10-20' }] }) === 0, '3.3 latest event still ahead: 0');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 100 }], events: [{ linked_binder_id: 'B', event_date: T }] }) === 0, '3.4 today is not passed: 0');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 100 }, { binder_id: 'B', amount_paid: 50 }], events: [{ linked_binder_id: 'B', event_date: '2026-09-01' }] }) === 1, '3.5 two invoices, one binder: 1');
  ok(C({ invoices: [{ lead_id: 'L', amount_paid: 10 }], leads: [{ id: 'L', wedding_date: '2026-08-01' }] }) === 1, '3.6 no binder: the lead\'s wedding date counts');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 10 }, { lead_id: 'L', amount_paid: 10 }], leads: [{ id: 'L', binder_id: 'B', wedding_date: '2026-08-01' }], events: [{ linked_binder_id: 'B', event_date: '2026-08-02' }] }) === 1, '3.7 a lead inside a binder is that binder: counted once');
  ok(C({ invoices: [{ amount_paid: 10 }] }) === 0, '3.8 no binder, no lead: 0');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 10, deleted_at: 'x' }], events: [{ linked_binder_id: 'B', event_date: '2026-09-01' }] }) === 0, '3.9 deleted invoice: 0');
  ok(C({ invoices: [{ binder_id: 'B', amount_paid: 10 }], events: [{ linked_binder_id: 'B', event_date: '2026-09-01', deleted_at: 'x' }] }) === 0, '3.10 deleted event is no date: 0');
  ok(C({ invoices: [{ binder_id: 'B', lead_id: 'L', amount_paid: 10 }], leads: [{ id: 'L', wedding_date: '2026-01-01' }] }) === 1, '3.11 binder with no events falls back to the lead\'s date');
  ok(todayIST(Date.parse('2026-10-05T19:00:00Z')) === '2026-10-06' && todayIST(Date.parse('2026-10-05T18:00:00Z')) === '2026-10-05', '3.12 today is India\'s date (00:30 am IST is the next day)');

  console.log('\n── 4  through a store ──');
  const store = (tables, failOn) => ({ from(name) { const f = []; const b = {
    select() { return b; }, eq(k, v) { f.push((r) => r[k] === v); return b; }, is(k, v) { f.push((r) => (r[k] ?? null) === v); return b; },
    gt(k, v) { f.push((r) => Number(r[k]) > v); return b; }, in(k, vs) { f.push((r) => vs.includes(r[k])); return b; },
    then(res, rej) { if (failOn === name) return Promise.resolve({ data: null, error: { message: 'x' } }).then(res, rej); return Promise.resolve({ data: (tables[name] || []).filter((r) => f.every((g) => g(r))), error: null }).then(res, rej); } }; return b; } });
  const V = 'v1', W = 'v2'; const now = Date.parse('2026-10-06T06:00:00Z');
  const tables = { invoices: [{ vendor_id: V, binder_id: 'B', lead_id: null, amount_paid: 100, deleted_at: null }, { vendor_id: W, binder_id: 'B2', amount_paid: 100, deleted_at: null }, { vendor_id: V, lead_id: 'L', amount_paid: 5, deleted_at: null }],
    events: [{ vendor_id: V, linked_binder_id: 'B', event_date: '2026-09-01', deleted_at: null }, { vendor_id: W, linked_binder_id: 'B2', event_date: '2026-09-01', deleted_at: null }],
    leads: [{ vendor_id: V, id: 'L', binder_id: null, wedding_date: '2026-07-01', deleted_at: null }] };
  const r = await verifiedWeddings({ supabase: store(tables), vendorId: V, now });
  ok(r.count === 2, '4.1 her two weddings, not the other vendor\'s', JSON.stringify(r));
  const e = await verifiedWeddings({ supabase: store(tables, 'events'), vendorId: V, now });
  ok(e.count === null && e.error === 'events', '4.2 a failed read says so (null), never a wrong 0');
  ok((await verifiedWeddings({ supabase: store({}), vendorId: V, now })).count === 0, '4.3 no invoices: 0');


  console.log('\n── 5  words, codes, CSV, ZIP ──');
  const WD = require(path.join(ROOT, 'src/lib/papers/words.js'));
  ok(WD.fullDate('2026-10-06') === '6 October 2026' && WD.fullDate('2026-10-05T19:00:00Z') === '6 October 2026', '5.1 full months, India\'s date');
  ok(WD.rs(200000) === 'Rs 2,00,000' && WD.rs(2000) === 'Rs 2,000' && WD.rs(0) === 'Rs 0', '5.2 money as "Rs 2,000", Indian grouping');
  ok(WD.tradeOf('makeup_artist') === 'Makeup artist' && WD.tradeOf('photographer') === 'Photographer' && WD.tradeOf('nonsense') === 'Wedding professional', '5.3 trade in plain words');
  ok(WD.statementNote('Studio A', '2026-10-02') === 'These figures are as Studio A recorded them in TDW. TDW confirms this statement was issued from her TDW account on 2 October 2026. TDW has not audited or verified these figures.', '5.4 (P3, the founder 8 October 2026) the ruled statement words, verbatim');
  const { newCode, readCode, SHAPE } = require(path.join(ROOT, 'src/lib/papers/code.js'));
  const codes = Array.from({ length: 2000 }, newCode); const re9 = new RegExp(rd('db/migrations/0209_pro_issued_papers.sql').match(/check_code ~ '([^']+)'/)[1]);
  ok(codes.every((c) => SHAPE.test(c) && re9.test(c)) && new Set(codes).size === codes.length, '5.5 2,000 new codes all fit 0209\'s CHECK, none repeat');
  ok(readCode(' tdw-7q4k-2m9p ') === 'TDW-7Q4K-2M9P' && readCode('7Q4K2M9P') === 'TDW-7Q4K-2M9P' && readCode('TDW-7Q4K-2M9O') === null && readCode("x' or 1=1") === null, '5.6 typed codes read leniently; anything else is not a code');
  const { toCsv } = require(path.join(ROOT, 'src/lib/papers/csv.js'));
  const csv = toCsv(['a', 'b'], [['=HYPERLINK("x")', 'x,y'], [-500, 'he said "hi"']]);
  ok(csv.startsWith('\uFEFF') && csv.includes("\"'=HYPERLINK(\"\"x\"\")\"") && csv.includes('"x,y"') && csv.includes('-500,') && csv.includes('"he said ""hi"""') && csv.includes('\r\n'), '5.7 CSV: Excel mark, quoting, formula guard, numbers untouched');
  const { zip } = require(path.join(ROOT, 'src/lib/papers/zip.js'));
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'b240-')); const zf = path.join(tmp, 't.zip');
  fs.writeFileSync(zf, zip([{ name: 'summary.csv', data: 'a,b\r\n' }, { name: '2026-09_sales.csv', data: Buffer.from('x') }]));
  let zt = ''; try { zt = require('child_process').execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip(),sorted(z.namelist()),z.read("summary.csv"))', zf]).toString(); } catch (e) { zt = String(e); }
  ok(/^None \['2026-09_sales\.csv', 'summary\.csv'\] b'a,b\\r\\n'/.test(zt.trim()), '5.8 the ZIP opens, its checksums hold, its files read back', zt.trim());

  console.log('\n── 6  what she may ask for ──');
  const I = require(path.join(ROOT, 'src/lib/papers/issue.js'));
  const N = Date.parse('2026-10-06T06:00:00Z');
  ok(I.readAsk({ kind: 'certificate' }, N).ok && I.readAsk({ kind: 'nope' }, N).error === 'Pick a paper to make.', '6.1 four kinds only');
  ok(I.readAsk({ kind: 'statement', period_from: '2026-04-01', period_to: '2026-09-30' }, N).error === 'Pick who the statement is for.', '6.2 a statement needs its purpose');
  ok(I.readAsk({ kind: 'ca_pack', period_from: '2026-09-30', period_to: '2026-04-01' }, N).error === 'The first day must come before the last day.', '6.3 order of days');
  ok(I.readAsk({ kind: 'ca_pack', period_from: '2026-10-01', period_to: '2026-10-07' }, N).error === 'The period cannot end after today.', '6.4 not after today (India)');
  ok(I.readAsk({ kind: 'ca_pack', period_from: '2025-01-01', period_to: '2026-09-30' }, N).error === 'A period can be at most one year.', '6.5 at most one year');
  ok(I.readAsk({ kind: 'ca_pack', period_from: '2026-02-30', period_to: '2026-03-01' }, N).error === 'Pick the first and last day of the period.', '6.6 a day that does not exist is refused');

  console.log('\n── 7  issuing, through a store ──');
  const mk = (tables, o = {}) => { const ins = []; let dup = o.dup || 0; return { ins, from(name) { const f = []; let mode = 'read', payload = null, single = false, one = false;
    const b = { select() { return b; }, eq(k, v) { f.push((r) => r[k] === v); return b; }, is(k, v) { f.push((r) => (r[k] ?? null) === v); return b; },
      gt(k, v) { f.push((r) => Number(r[k]) > v); return b; }, gte(k, v) { f.push((r) => r[k] != null && String(r[k]) >= String(v)); return b; }, lte(k, v) { f.push((r) => r[k] != null && String(r[k]) <= String(v)); return b; },
      in(k, vs) { f.push((r) => vs.includes(r[k])); return b; }, order() { return b; }, limit() { return b; }, single() { single = true; return b; }, maybeSingle() { one = true; return b; },
      insert(row) { mode = 'insert'; payload = row; return b; }, update(row) { mode = 'update'; payload = row; return b; },
      then(res, rej) { let out;
        if (o.failOn === name) out = { data: null, error: { message: 'x' } };
        else if (mode === 'insert') { if (dup-- > 0) out = { data: null, error: { code: '23505' } }; else { const r = { id: '00000000-0000-4000-8000-00000000000' + ins.length, issued_at: '2026-10-06T06:00:00Z', withdrawn_at: null, ...payload }; ins.push(r); (tables[name] = tables[name] || []).push(r); out = { data: r, error: null }; } }
        else if (mode === 'update') { const hit = (tables[name] || []).filter((r) => f.every((g) => g(r))); hit.forEach((r) => Object.assign(r, payload)); out = { data: hit, error: null }; }
        else { const rows = (tables[name] || []).filter((r) => f.every((g) => g(r))); out = { data: one ? rows[0] || null : rows, error: null }; }
        return Promise.resolve(out).then(res, rej); } }; return b; } }; };
  const VEN = { id: 'v1', business_name: 'Studio A', category: 'makeup_artist', city: 'Delhi', gstin: null };
  const T7 = { invoices: [{ vendor_id: 'v1', binder_id: 'B', lead_id: null, amount_paid: 100, amount_total: 300, deleted_at: null, created_at: '2026-09-10T05:00:00Z', invoice_number: 'TDW-1', client_name: 'Meera', gst_rate: null, gst_amount: null }],
    events: [{ vendor_id: 'v1', linked_binder_id: 'B', event_date: '2026-09-20', deleted_at: null }], leads: [],
    expenses: [{ vendor_id: 'v1', amount: 4720, category: 'equipment', description: 'kit', expense_date: '2026-09-02', created_at: '2026-10-03T05:00:00Z', deleted_at: null, gst_amount: 720 },
      { vendor_id: 'v1', amount: 500, category: 'travel', description: 'cab', expense_date: null, created_at: '2026-09-15T05:00:00Z', deleted_at: null },
      { vendor_id: 'v1', amount: 999, category: 'travel', description: 'October', expense_date: '2026-10-02', created_at: '2026-10-02T05:00:00Z', deleted_at: null }],
    tds_ledger: [{ vendor_id: 'v1', deduction_date: '2026-09-12', client_name: 'Meera', gross_amount: 300, tds_rate: 10, tds_amount: 30, net_received: 270, financial_year: '2026-27' }] };
  const st = mk(JSON.parse(JSON.stringify(T7)));
  const c1 = await I.issuePaper({ supabase: st, vendor: VEN, body: { kind: 'certificate' }, now: N });
  ok(c1.ok && c1.paper.figures.weddings_verified === 1 && c1.paper.figures.trade === 'Makeup artist' && c1.paper.period_from === null, '7.1 a certificate freezes name, trade, city and 1 verified wedding', JSON.stringify(c1).slice(0, 200));
  const s1 = await I.issuePaper({ supabase: st, vendor: VEN, body: { kind: 'statement', period_from: '2026-04-01', period_to: '2026-09-30', purpose: 'bank' }, now: N });
  ok(s1.ok && s1.paper.figures.invoices_raised === 1 && s1.paper.figures.invoiced === 300 && s1.paper.figures.received === 100 && s1.paper.purpose === 'bank', '7.2 a statement freezes invoices raised, invoiced, received');
  const p1 = await I.issuePaper({ supabase: st, vendor: VEN, body: { kind: 'ca_pack', period_from: '2026-09-01', period_to: '2026-09-30' }, now: N });
  const pf = p1.ok && p1.paper.figures;
  ok(p1.ok && pf.purchases.length === 2 && pf.purchases.some((x) => x.description === 'kit') && pf.purchases.some((x) => x.description === 'cab' && x.date === '2026-09-15') && !pf.purchases.some((x) => x.description === 'October'), '7.3 the pack takes a September bill filed in October, an undated September row, and not October\'s', JSON.stringify(pf && pf.purchases));
  ok(p1.ok && pf.months['2026-09'].spent === 5220 && pf.months['2026-09'].gst_paid === 720 && pf.months['2026-09'].tds === 30 && pf.months['2026-09'].invoiced === 300, '7.4 the month adds up');
  const dupStore = mk(JSON.parse(JSON.stringify(T7)), { dup: 2 });
  const d1 = await I.issuePaper({ supabase: dupStore, vendor: VEN, body: { kind: 'id_card' }, now: N });
  ok(d1.ok && dupStore.ins.length === 1, '7.5 a code that collides is drawn again');
  const f1 = await I.issuePaper({ supabase: mk(JSON.parse(JSON.stringify(T7)), { failOn: 'invoices' }), vendor: VEN, body: { kind: 'certificate' }, now: N });
  ok(!f1.ok && f1.status === 503 && /could not count/.test(f1.error), '7.6 a failed read issues nothing and says so');
  const w1 = await I.withdrawPaper({ supabase: st, vendorId: 'v1', id: c1.paper.id, now: N }); const w2 = await I.withdrawPaper({ supabase: st, vendorId: 'v1', id: c1.paper.id, now: N + 864e5 });
  ok(w1.ok && w2.ok && w2.already && st.ins[0].withdrawn_at === new Date(N).toISOString(), '7.7 withdraw is one way; the first date stands');
  ok(!(await I.withdrawPaper({ supabase: st, vendorId: 'other', id: c1.paper.id, now: N })).ok, '7.8 another vendor cannot withdraw it');

  console.log('\n── 8  the files ──');
  const R = require(path.join(ROOT, 'src/lib/papers/render.js'));
  const sf = await R.paperFile(s1.paper); const pk = await R.paperFile(p1.paper);
  ok(sf.type === 'application/pdf' && sf.body.slice(0, 5).toString() === '%PDF-' && sf.body.length > 2000, '8.1 the statement is a PDF');
  ok(R.note(s1.paper) === WD.statementNote('Studio A', s1.paper.issued_at) && R.lines(s1.paper).some(([k, v]) => k === 'Invoiced' && v === 'Rs 300'), '8.2 the statement states the ruled words and its sums');
  fs.writeFileSync(zf, pk.body);
  let pz = ''; try { pz = require('child_process').execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip(),sorted(z.namelist()))', zf]).toString(); } catch (e) { pz = String(e); }
  ok(pk.type === 'application/zip' && /^None \['2026-09_purchases\.csv', '2026-09_sales\.csv', '2026-09_tds\.csv', 'TDW_CA_pack_2026-09-01_to_2026-09-30\.pdf', 'summary\.csv'\]/.test(pz.trim()), '8.3 the CA pack ZIP: PDF, summary and September\'s three CSVs', pz.trim());

  console.log('\n── 9  the check door ──');
  const express = require('express'); const http = require('http');
  const app = express(); app.locals.supabase = st; app.use('/api/v2/public/check', require(path.join(ROOT, 'src/api/public/check.js')));
  const srv = http.createServer(app); await new Promise((r) => srv.listen(0, r)); const port = srv.address().port;
  const get = (u) => new Promise((res) => http.get(`http://127.0.0.1:${port}${u}`, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res({ status: r.statusCode, body: JSON.parse(b), cache: r.headers['cache-control'] })); }));
  const g1 = await get(`/api/v2/public/check/${s1.paper.check_code.toLowerCase()}`);
  ok(g1.status === 200 && g1.body.paper.state === 'valid' && g1.body.paper.lines.some(([k, v]) => k === 'Received on these invoices' && v === 'Rs 100') && g1.body.paper.note === WD.statementNote('Studio A', s1.paper.issued_at) && g1.cache === 'no-store', '9.1 a statement\'s code shows its totals and the ruled words');
  const g2 = await get(`/api/v2/public/check/${c1.paper.check_code}`);
  ok(g2.status === 200 && g2.body.paper.state === 'withdrawn' && g2.body.paper.lines.length === 0 && !JSON.stringify(g2.body).includes('verified by TDW'), '9.2 a withdrawn paper shows no figures');
  const g3 = await get(`/api/v2/public/check/${p1.paper.check_code}`);
  ok(g3.status === 200 && !JSON.stringify(g3.body).includes('Meera') && !JSON.stringify(g3.body).includes('4720'), '9.3 the CA pack\'s code shows no client and no row');
  const g4 = await get('/api/v2/public/check/TDW-AAAA-AAAA'), g5 = await get('/api/v2/public/check/not-a-code');
  ok(g4.status === 404 && g5.status === 404 && g4.body.error === g5.body.error, '9.4 unknown and malformed codes get the same answer');
  const seen = []; for (let i = 0; i < 55; i++) seen.push((await get('/api/v2/public/check/TDW-AAAA-AAAA')).status);
  const over = await get(`/api/v2/public/check/${s1.paper.check_code}`);
  ok(seen.every((x) => x === 404) && over.status === 429 && over.body.error === 'There have been too many tries from this connection. Please try again in an hour.', '9.5 (P3, R-47.1) the 61st try in an hour from one address is refused (F-44.361)', JSON.stringify([seen.filter((x) => x !== 404).length, over.status]));
  const keys = [...require(path.join(ROOT, 'src/api/public/check.js'))._limiter._map.keys()];
  ok(keys.length === 1 && /^addr:check:[0-9a-f]{64}$/.test(keys[0]) && !keys[0].includes('127.0.0.1'), '9.6 the address is kept only as its sha256');
  srv.close();

  console.log('\n── 10  cut 2: month and city; the ID\'s photo ──');
  const C2 = { today: '2026-10-06' };
  const r10 = countVerified({ ...C2, invoices: [{ binder_id: 'B', amount_paid: 10 }, { lead_id: 'L2', amount_paid: 5 }, { binder_id: 'B3', amount_paid: 5 }],
    events: [{ linked_binder_id: 'B', event_date: '2026-02-14' }, { linked_binder_id: 'B3', event_date: '2026-09-20' }],
    leads: [{ id: 'LB', binder_id: 'B', wedding_city: '  Udaipur ', wedding_date: '2026-02-14' }, { id: 'L2', wedding_city: 'Delhi', wedding_date: '2025-12-01', name: 'Meera', phone: '+91' }] });
  ok(r10.count === 3 && JSON.stringify(r10.weddings) === JSON.stringify([{ month: '2026-09', city: null }, { month: '2026-02', city: 'Udaipur' }, { month: '2025-12', city: 'Delhi' }]), '10.1 each wedding\'s month and city, newest first; a binder\'s own lead gives its city; none known is null', JSON.stringify(r10.weddings));
  ok(!JSON.stringify(r10.weddings).match(/Meera|\+91|amount|L2|LB|"B/), '10.2 nothing but month and city leaves (no name, phone, amount or id)');
  const T10 = { invoices: [{ vendor_id: 'v1', binder_id: 'B', lead_id: null, amount_paid: 100, deleted_at: null }], events: [{ vendor_id: 'v1', linked_binder_id: 'B', event_date: '2026-09-20', deleted_at: null }],
    leads: [{ vendor_id: 'v1', id: 'LB', binder_id: 'B', wedding_city: 'Jaipur', wedding_date: '2026-09-20', deleted_at: null }] };
  const w10 = await verifiedWeddings({ supabase: store(T10), vendorId: 'v1', now: Date.parse('2026-10-06T06:00:00Z') });
  ok(w10.count === 1 && w10.weddings[0].city === 'Jaipur' && w10.weddings[0].month === '2026-09', '10.3 through a store: the binder\'s lead is read for its city; the count is unchanged', JSON.stringify(w10));
  const PF = { vendor_portfolio: [{ vendor_id: 'v1', image_url: 'https://res.cloudinary.com/x/image/upload/v1/me.jpg', approval_state: 'approved' }, { vendor_id: 'v1', image_url: 'https://res.cloudinary.com/x/image/upload/v1/no.jpg', approval_state: 'rejected' }, { vendor_id: 'v2', image_url: 'https://res.cloudinary.com/x/image/upload/v1/hers.jpg', approval_state: 'approved' }] };
  const st10 = mk({ ...JSON.parse(JSON.stringify(T7)), ...PF });
  const idOk = await I.issuePaper({ supabase: st10, vendor: VEN, body: { kind: 'id_card', photo_url: 'https://res.cloudinary.com/x/image/upload/v1/me.jpg' }, now: N });
  ok(idOk.ok && idOk.paper.figures.photo_url === 'https://res.cloudinary.com/x/image/upload/v1/me.jpg', '10.4 an ID with her own portfolio photo keeps it on the paper');
  const idOther = await I.issuePaper({ supabase: st10, vendor: VEN, body: { kind: 'id_card', photo_url: 'https://res.cloudinary.com/x/image/upload/v1/hers.jpg' }, now: N });
  const idRej = await I.issuePaper({ supabase: st10, vendor: VEN, body: { kind: 'id_card', photo_url: 'https://res.cloudinary.com/x/image/upload/v1/no.jpg' }, now: N });
  const idHttp = await I.issuePaper({ supabase: st10, vendor: VEN, body: { kind: 'id_card', photo_url: 'http://example.com/a.jpg' }, now: N });
  ok([idOther, idRej, idHttp].every((r) => !r.ok && r.status === 400 && r.error === 'Pick a photo from your portfolio.'), '10.5 another vendor\'s photo, a refused photo, or a non-https link is refused in plain words');
  const idNone = await I.issuePaper({ supabase: st10, vendor: VEN, body: { kind: 'id_card' }, now: N });
  const cert10 = await I.issuePaper({ supabase: st10, vendor: VEN, body: { kind: 'certificate', photo_url: 'https://res.cloudinary.com/x/image/upload/v1/me.jpg' }, now: N });
  ok(idNone.ok && idNone.paper.figures.photo_url === null && cert10.ok && cert10.paper.figures.photo_url === undefined, '10.6 the photo stays optional on the ID and never rides on a certificate');
  const zl = require('zlib'); const png = (() => { const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(zl.crc32(td) >>> 0); return Buffer.concat([l, td, c]); };
    const ih = Buffer.alloc(13); ih.writeUInt32BE(4, 0); ih.writeUInt32BE(4, 4); ih[8] = 8; const raw = Buffer.alloc(20); for (let r = 0; r < 4; r++) raw.fill(150, r * 5 + 1, r * 5 + 5); return Buffer.concat([sig, ch('IHDR', ih), ch('IDAT', zl.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); })();
  const withImg = (await R.paperFile(idOk.paper, { fetchImage: async () => png })).body.toString('latin1');
  const noImg = (await R.paperFile(idOk.paper, { fetchImage: async () => null })).body.toString('latin1');
  const nImg = (t) => (t.match(/\/Subtype\s*\/Image/g) || []).length;   // the QR codes are images too: count, never test presence
  ok(nImg(withImg) === nImg(noImg) + 1 && noImg.startsWith('%PDF-'), '10.7 the ID draws her photo (one more image than without it), and still prints without it', `${nImg(withImg)} vs ${nImg(noImg)}`);
  ok(R.isImg(png) && !R.isImg(Buffer.from('<html>not an image</html>')), '10.8 only real JPEG or PNG bytes are drawn');
  require(path.join(ROOT, 'src/api/public/check.js'))._limiter._map.clear();   // §9.5 spent this address's hour on purpose
  const app10 = express(); app10.locals.supabase = st10; app10.use('/c', require(path.join(ROOT, 'src/api/public/check.js')));
  const s10 = http.createServer(app10); await new Promise((r) => s10.listen(0, r)); const p10 = s10.address().port;
  const g10 = (u) => new Promise((res) => http.get(`http://127.0.0.1:${p10}${u}`, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(JSON.parse(b))); }));
  st10.ins.find((r) => r.id === cert10.paper.id).figures.photo_url = 'https://res.cloudinary.com/x/image/upload/v1/me.jpg';   // planted: a certificate row carrying a photo by hand
  const gi = await g10(`/c/${idOk.paper.check_code}`), gc = await g10(`/c/${cert10.paper.check_code}`);
  ok(gi.paper.photo_url === 'https://res.cloudinary.com/x/image/upload/v1/me.jpg' && gc.paper.photo_url === null, '10.9 the ID\'s check page carries its photo; a certificate\'s never does, even with one planted on its row');
  await I.withdrawPaper({ supabase: st10, vendorId: 'v1', id: idOk.paper.id, now: N }); const gw = await g10(`/c/${idOk.paper.check_code}`);
  ok(gw.paper.state === 'withdrawn' && gw.paper.photo_url === undefined, '10.10 a withdrawn ID shows no photo');
  s10.close();
  console.log(`\nb240: ${pass} passed, ${fail} failed`); if (fail) { console.log('FAILED: ' + failed.join(' · ')); process.exit(1); }
})();
