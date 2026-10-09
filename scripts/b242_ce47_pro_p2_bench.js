#!/usr/bin/env node
// scripts/b242_ce47_pro_p2_bench.js · CE-47 · PRO · P2, server half: 0211, the bill parser (pure), gear sharing.
// No network, no database: 0211 is read as text; the parser and the gear rules run on values; the gear doors run through
// a fake store inside a real express app on a local port, and the founder's contact rule (P2-F6) is read off the RAW
// response bodies. §5 to §9: the bill reader (Haiku, bytes, one call; injected), createExpense's GST columns, the bills doors
// through the fake store with a fake private bucket, the 7-day sweep and its cron line, and the CA pack's bill column.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0; const failed = [];
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } };
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (sql) => sql.replace(/--[^\n]*/g, '');

// ── a fake store: enough of supabase-js's builder for gear.js, and 0211's accept function in JS ──
function store(seed) {
  const T = JSON.parse(JSON.stringify(seed)); let n = 0; const log = [];
  const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  function from(name) {
    const f = []; let op = 'select'; let patch = null; let ins = null; let one = null; let lim = null; let ord = null; let cols = '*';
    const b = {
      select(c) { if (op === 'select') cols = c || '*'; else cols = c || '*'; return b; },
      eq(k, v) { f.push((r) => r[k] === v); return b; }, neq(k, v) { f.push((r) => r[k] !== v); return b; },
      in(k, vs) { f.push((r) => vs.includes(r[k])); return b; }, ilike(k, v) { f.push((r) => String(r[k]).toLowerCase() === String(v).toLowerCase()); return b; },
      is(k, v) { f.push((r) => (r[k] ?? null) === v); return b; }, lt(k, v) { f.push((r) => r[k] < v); return b; },
      delete() { op = 'delete'; return b; },
      order(k, o) { ord = [k, o && o.ascending === false ? -1 : 1]; return b; }, limit(x) { lim = x; return b; },
      insert(row) { op = 'insert'; ins = row; return b; }, update(p) { op = 'update'; patch = p; return b; },
      single() { one = 'single'; return b; }, maybeSingle() { one = 'maybe'; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    function shape(r) {
      if (name === 'vendors' && /users!vendors_user_id_fkey/.test(cols)) { log.push(['phone-read', r.id]); return { id: r.id, users: { phone: r.phone } }; }
      if (name === 'vendors') { const o = {}; for (const c of cols.split(',').map((x) => x.trim())) o[c] = r[c]; return o; }
      return { ...r };
    }
    function run() {
      const t = (T[name] = T[name] || []);
      if (op === 'insert') { const st = name === 'gear_requests' ? { state: 'requested' } : name === 'gear_items' ? { state: 'listed' } : {}; const row = { id: uuid(), ...st, created_at: new Date(Date.now() + n).toISOString(), ...ins }; t.push(row); log.push(['insert', name, ins]); return { data: one ? row : [row], error: null }; }
      let rows = t.filter((r) => f.every((g) => g(r)));
      if (op === 'delete') { T[name] = t.filter((r) => !rows.includes(r)); log.push(['delete', name, rows.map((r) => r.id)]); return { data: null, error: null }; }
      if (op === 'update') { for (const r of rows) Object.assign(r, patch); log.push(['update', name, patch]); return { data: rows.map((r) => ({ id: r.id })), error: null }; }
      if (ord) rows = rows.slice().sort((a, c) => (a[ord[0]] < c[ord[0]] ? -ord[1] : a[ord[0]] > c[ord[0]] ? ord[1] : 0));
      if (lim) rows = rows.slice(0, lim);
      rows = rows.map(shape);
      if (one) return { data: rows[0] || null, error: one === 'single' && !rows[0] ? { message: 'none' } : null };
      return { data: rows, error: null };
    }
    return b;
  }
  async function rpc(fn, a) {
    log.push(['rpc', fn]);
    if (fn !== 'pro_gear_accept') return { data: null, error: { message: 'no such function' } };
    const r = (T.gear_requests || []).find((x) => x.id === a.p_request && x.owner_vendor_id === a.p_owner);
    if (!r) return { data: 'not_found', error: null };
    if (r.state !== 'requested') return { data: 'not_requested', error: null };
    const it = T.gear_items.find((i) => i.id === r.item_id); if (!it || it.state !== 'listed') return { data: 'withdrawn', error: null };
    if (T.gear_requests.some((o) => o.item_id === r.item_id && o.state === 'accepted' && o.id !== r.id && o.date_from <= r.date_to && r.date_from <= o.date_to)) return { data: 'overlap', error: null };
    r.state = 'accepted'; r.decided_at = new Date().toISOString(); return { data: 'accepted', error: null };
  }
  const files = {}; const failOn = {};
  const storage = { from(bucket) { return {
    async createSignedUploadUrl(p) { log.push(['upload-url', bucket, p]); return { data: { signedUrl: `https://store.example/upload/${bucket}/${p}?token=t`, token: 't' }, error: null }; },
    async download(p) { log.push(['download', bucket, p]); return files[bucket + '/' + p] ? { data: { arrayBuffer: async () => files[bucket + '/' + p] }, error: null } : { data: null, error: { message: 'not found' } }; },
    async remove(ps) { log.push(['remove', bucket, ps]); if (failOn['storage:remove']) return { data: null, error: { message: 'x' } }; const out = []; for (const p of ps) if (files[bucket + '/' + p]) { delete files[bucket + '/' + p]; out.push({ name: p }); } return { data: out, error: null }; },
    async createSignedUrl(p, ttl) { log.push(['signed', bucket, p, ttl]); return { data: { signedUrl: `https://store.example/sign/${bucket}/${p}?ttl=${ttl}` }, error: null }; },
    getPublicUrl(p) { log.push(['PUBLIC', bucket, p]); return { data: { publicUrl: `https://store.example/public/${bucket}/${p}` } }; },
  }; } };
  return { from, rpc, T, log, storage, files, failOn };
}

(async () => {
  console.log('\n── 1  0211: gear and bill drafts ──');
  const m = rd('db/migrations/0211_pro_gear_bills.sql'); const s = strip(m);
  ok(/^BEGIN;/m.test(m) && /^COMMIT;/m.test(m), '1.1 0211 is one transaction');
  const tables = [...s.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)].map((x) => x[1]);
  ok(JSON.stringify(tables) === '["gear_items","gear_requests","bill_drafts"]', '1.2 three new tables, nothing else created', JSON.stringify(tables));
  ok(tables.every((t) => new RegExp(`ALTER TABLE public\\.${t}\\s+ENABLE ROW LEVEL SECURITY`).test(s) && new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t}\\s+TO service_role;`).test(s)), '1.3 each: RLS on, then the four grants to service_role (e-273, b128 2.1)');
  ok(!/\bTO\s+[^;]*\b(anon|authenticated)\b/i.test(s.replace(/REVOKE[^;]*;/g, '')), '1.4 nothing granted to anon or authenticated');
  ok(/REVOKE ALL ON FUNCTION public\.pro_gear_accept\(uuid, uuid\) FROM PUBLIC, anon, authenticated;/.test(s) && /GRANT EXECUTE ON FUNCTION public\.pro_gear_accept\(uuid, uuid\) TO service_role;/.test(s), '1.5 the accept function runs for service_role alone');
  ok(/FROM public\.gear_items WHERE id = r\.item_id FOR UPDATE/.test(s) && /o\.date_from <= r\.date_to AND r\.date_from <= o\.date_to/.test(s) && /o\.state = 'accepted'/.test(s), '1.6 accept locks the item, then refuses an overlap with another accepted loan (both ends counted)');
  ok(!/\bevents\b|ALTER TABLE public\.(?!gear_items|gear_requests|bill_drafts)/.test(s) && !/btree_gist/.test(s), '1.7 0211 touches no Calendar table and alters no existing table; no new extension');
  ok(/state IN \('requested', 'accepted', 'declined', 'cancelled'\)/.test(s) && /CHECK \(owner_vendor_id <> borrower_vendor_id\)/.test(s) && /CHECK \(date_to - date_from <= 60\)/.test(s), '1.8 request states as designed; no lending to herself; 61 days at most');
  const fp = new RegExp(s.match(/file_path ~ '([^']+)'/)[1]);
  ok(fp.test('00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002.jpg') && !fp.test('https://res.cloudinary.com/x/bill.jpg') && !fp.test('../a/b.jpg') && !fp.test('a/b.exe'),
    '1.9 a bill draft holds a private storage path (vendor/uuid.jpg|png|pdf), never a URL (P2-F2)');
  ok(/bill_drafts_unconfirmed_idx ON public\.bill_drafts \(created_at\) WHERE confirmed_at IS NULL/.test(s), '1.10 unconfirmed drafts are indexed by age, for the 7-day delete');

  console.log('\n── 2  the bill parser (pure) ──');
  const P = require(path.join(ROOT, 'src/lib/bills/parse.js'));
  ok(P.gstinValid('27AAPFU0939F1ZV') && !P.gstinValid('27AAPFU0939F1ZW') && !P.gstinValid('27aapfu0939f1zv '.toUpperCase().slice(0, 14)) && !P.gstinValid('27AAPFU0939F1XV'), '2.1 a GSTIN is checked by its check character, not only its shape');
  ok(P.money('₹ 1,23,456.50') === 123456.5 && P.money('Rs. 1,234') === 1234 && P.money('INR 12,000.00') === 12000 && P.money('none') === null, '2.2 money in its printed forms');
  ok(P.isoDate('04/10/2026') === '2026-10-04' && P.isoDate('4-10-26') === '2026-10-04' && P.isoDate('4 October 2026') === '2026-10-04' && P.isoDate('04-Oct-2026') === '2026-10-04'
    && P.isoDate('31/02/2026') === null && P.isoDate('13/13/2026') === null, '2.3 dates read day first; an impossible date is refused, never guessed');
  const OWN = '27AAGCB7383J1Z8'; // her own GSTIN (valid check character)
  const bill1 = 'Glamour Beauty Supplies Pvt Ltd\nGSTIN: 27AAPFU0939F1ZV\nBuyer GSTIN: 27AAGCB7383J1Z8\nTax Invoice No: GB/2026/0412\nInvoice Date: 04/10/2026\nFoundation 2 x 1,800.00 3,600.00\nTaxable Value 3,600.00\nCGST @ 9% 324.00\nSGST @ 9% 324.00\nGrand Total Rs. 4,248.00';
  const d1 = P.fromText(bill1, { ownGstin: OWN }); const c1 = P.check(d1, { ownGstin: OWN, today: '2026-10-07' });
  ok(d1.supplier_gstin === '27AAPFU0939F1ZV' && d1.bill_number === 'GB/2026/0412' && d1.expense_date === '2026-10-04' && d1.amount === 4248, '2.4 a same-state bill: the seller’s GSTIN (hers left out), number, date, total', JSON.stringify(d1));
  ok(c1.ok && c1.fields.taxable_value === 3600 && c1.fields.gst_amount === 648 && c1.fields.gst_rate === 18, '2.5 its numbers hold: Rs 3,600 + Rs 648 = Rs 4,248 at 18%', JSON.stringify(c1));
  const bill2 = 'Lens House\n29AAGCB7383J1Z4\nBill No. LH-88\n12 Sep 2026\nTaxable Amount 10,000.00\nIGST 18% 1,800.00\nTotal 11,800.00';
  const c2 = P.check(P.fromText(bill2, { ownGstin: OWN }), { ownGstin: OWN, today: '2026-10-07' });
  ok(c2.ok && c2.fields.gst_rate === 18 && c2.fields.gst_amount === 1800 && c2.fields.supplier_gstin === '29AAGCB7383J1Z4', '2.6 an other-state bill with IGST holds', JSON.stringify(c2));
  const bad = (draft, want) => { const r = P.check(draft, { ownGstin: OWN, today: '2026-10-07' }); return !r.ok && r.problems.some((p) => p.includes(want)) ? r : null; };
  ok(!!bad({ amount: 4300, taxable_value: 3600, cgst: 324, sgst: 324 }, 'The total on the bill is Rs 4,300.') , '2.7 (P3, R-47.1) taxable + GST that do not make the total: said in Rs words, nothing recorded');
  ok(!!bad({ amount: 3700, taxable_value: 3600, gst_amount: 100 }, 'does not match any GST rate'), '2.8 (P3, R-47.1) GST that is no GST rate is refused');
  ok(!!bad({ amount: 4248, taxable_value: 3600, cgst: 324, sgst: 324, printed_rate: 12 }, 'shows a GST rate of 12%, but its figures give 18%'), '2.9 (P3, R-47.1) a printed rate that the figures contradict is named');
  ok(!!bad({ amount: 1180, taxable_value: 1000, cgst: 90, sgst: 90, igst: 180 }, 'not both'), '2.10 IGST and CGST together are refused');
  ok(!!bad({ amount: 1180, taxable_value: 1000, igst: 180, supplier_gstin: '27AAPFU0939F1ZV' }, 'in your state'), '2.11 a same-state seller charging IGST is named');
  ok(!!bad({ amount: 1180, taxable_value: 1000, cgst: 90, sgst: 90, supplier_gstin: '29AAGCB7383J1Z4' }, 'in another state'), '2.12 an other-state seller charging CGST and SGST is named');
  ok(!!bad({ amount: 100, supplier_gstin: OWN }, 'That GSTIN is yours'), '2.13 her own GSTIN as the seller’s is refused');
  ok(!!bad({ amount: 100, expense_date: '2026-10-09' }, 'after today'), '2.14 a bill dated after today is refused');
  const r15 = P.check({ amount: 4300, taxable_value: 3600, cgst: 324, sgst: 324, supplier_gstin: '27AAPFU0939F1ZW' }, { ownGstin: OWN });
  ok(!r15.ok && r15.fields.gst_amount === undefined && r15.fields.taxable_value === undefined && r15.fields.supplier_gstin === undefined, '2.15 what check() cannot prove it does not fill: no GST, taxable value or GSTIN invented');
  const r16 = P.check({ amount: '2,000' }, {});
  ok(r16.ok && r16.fields.amount === 2000 && Object.keys(r16.fields).join() === 'amount', '2.16 a bill with a total alone is fine; GST stays empty for her to add');
  ok(!P.check({}, {}).ok && P.check({}, {}).problems[0] === 'Type the bill’s total.', '2.17 nothing read: she is asked for the total');
  ok(!/\bcouple\b|\bbride\b/i.test(rd('src/lib/bills/parse.js').replace(/^\s*\/\/.*$/gm, '')), '2.18 no "couple" or "bride" in the parser’s words');

  console.log('\n── 3  gear rules (pure) ──');
  const R = require(path.join(ROOT, 'src/lib/gear/rules.js'));
  ok(R.checkItem({ item: 'Sony 85mm f/1.4 GM', value_rs: '1,40,000', price_per_day_rs: 1500, city: 'Delhi' }).ok && !R.checkItem({ item: 'x', value_rs: 1, price_per_day_rs: 0, city: 'Delhi' }).ok
    && R.checkItem({ item: 'Ring light', value_rs: 5000, price_per_day_rs: -1, city: 'Delhi' }).error === 'Type the price per day, in rupees. Type 0 to lend it free.', '3.1 an item: named, worth something, a price per day (0 lends free), a city');
  const T0 = '2026-10-07';
  ok(R.checkAsk({ date_from: '2026-10-10', date_to: '2026-10-12' }, T0).ok && R.checkAsk({ date_from: '2026-10-06', date_to: '2026-10-08' }, T0).error === 'The first day you picked has passed. Pick today or a later day.'
    && R.checkAsk({ date_from: '2026-10-12', date_to: '2026-10-10' }, T0).error === 'The last day you picked is before the first day.' && !R.checkAsk({ date_from: '2026-10-10', date_to: '2026-12-15' }, T0).ok
    && !R.checkAsk({ date_from: '2026-02-30', date_to: '2026-03-01' }, '2026-01-01').ok, '3.2 (P3, R-47.1) an ask: real days, from today on, in order, 61 days at most');
  ok(R.overlaps({ date_from: '2026-10-10', date_to: '2026-10-12' }, { date_from: '2026-10-12', date_to: '2026-10-14' }) && !R.overlaps({ date_from: '2026-10-10', date_to: '2026-10-11' }, { date_from: '2026-10-12', date_to: '2026-10-14' }), '3.3 ranges share a day when an end touches (both ends counted)');
  const V = { business_name: 'Studio Asha', city: 'Delhi', phone: '+919800000001' };
  ok(JSON.stringify(R.party(V, false)) === '{"business_name":"Studio Asha","city":"Delhi"}' && R.party(V, true).whatsapp === '+919800000001', '3.4 the other vendor is name and city; her number only once accepted (P2-F6)');
  const vr = R.viewRequest({ id: 'r', item_id: 'i', state: 'accepted', date_from: '2026-10-10', date_to: '2026-10-12' }, { item: 'Ring light', price_per_day_rs: 500 }, V, 'borrower');
  ok(vr.settle === 'Settle with Studio Asha directly. TDW takes nothing.' && vr.price_line === 'Rs 500 a day, Rs 1,500 for 3 days' && vr.dates === '10 October 2026 to 12 October 2026', '3.5 an accepted loan: the ruled settle line, Rs words, full months; no link, no insurance line (P2-F5)', JSON.stringify(vr));
  ok(!('settle' in R.viewRequest({ id: 'r', item_id: 'i', state: 'requested', date_from: '2026-10-10', date_to: '2026-10-10' }, { item: 'x', price_per_day_rs: 0 }, V, 'owner')), '3.6 no settle line before acceptance');

  console.log('\n── 4  the gear doors, through a real express app and a fake store ──');
  const A = '00000000-0000-4000-a000-00000000000a', B = '00000000-0000-4000-a000-00000000000b', C = '00000000-0000-4000-a000-00000000000c';
  const PH = { [A]: '+919811110001', [B]: '+919822220002', [C]: '+919833330003' };
  const S = store({ vendors: [
    { id: A, business_name: 'Studio Asha', city: 'Delhi', phone: PH[A] }, { id: B, business_name: 'Lens and Light', city: 'Delhi', phone: PH[B] }, { id: C, business_name: 'Glow by Chitra', city: 'Delhi', phone: PH[C] }] });
  // the two middlewares are stood in for by fakes keyed on a header, BEFORE gear.js is required
  const mw = (p) => path.join(ROOT, 'src/api/middleware', p);
  require.cache[require.resolve(mw('requireAuth'))] = { exports: (req, _res, next) => next() };
  require.cache[require.resolve(mw('resolveVendor'))] = { exports: () => (req, res, next) => { const v = S.T.vendors.find((x) => x.id === req.headers['x-as']); if (!v || v.id !== req.params.vendorId) return res.status(403).json({ ok: false }); req.vendor = { id: v.id, business_name: v.business_name, city: v.city }; return next(); } };
  const express = require('express'); const app = express(); app.locals.supabase = S;
  app.use('/gear', require(path.join(ROOT, 'src/api/vendor/gear.js')));
  const srv = http.createServer(app); await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const raws = [];
  const call = async (as, method, url, body) => { const r = await fetch(`http://127.0.0.1:${port}/gear/${as}${url}`, { method, headers: { 'x-as': as, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); raws.push({ as, url, t }); return { status: r.status, t, j: JSON.parse(t) }; };
  const phoneIn = (t, who) => t.includes(PH[who]) || t.includes(PH[who].slice(3));
  try {
    const li = await call(A, 'POST', '/items', { item: 'Sony 85mm f/1.4 GM', value_rs: 140000, price_per_day_rs: 1500, city: 'Delhi' });
    ok(li.status === 200 && li.j.item && li.j.item.price_line === 'Rs 1,500 a day' && li.j.item.value === 'Rs 1,40,000', '4.1 A lists a lens', li.t);
    const itemId = li.j.item.id;
    const roomB = await call(B, 'GET', '');
    const seen = roomB.j.room && roomB.j.room.near.find((i) => i.id === itemId);
    ok(seen && seen.owner.business_name === 'Studio Asha' && seen.owner.city === 'Delhi' && !phoneIn(roomB.t, A), '4.2 B sees it in Delhi: name and city, and A’s number nowhere in the raw body (P2-F6)', roomB.t);
    const self = await call(A, 'POST', `/items/${itemId}/ask`, { date_from: '2026-12-10', date_to: '2026-12-12' });
    ok(self.status === 400 && self.j.error === 'You cannot ask for your own item.', '4.3 (P3, R-47.1) A cannot ask for her own item');
    const askB = await call(B, 'POST', `/items/${itemId}/ask`, { date_from: '2026-12-10', date_to: '2026-12-12' });
    const askC = await call(C, 'POST', `/items/${itemId}/ask`, { date_from: '2026-12-12', date_to: '2026-12-14' });
    ok(askB.status === 200 && askC.status === 200 && askB.j.request.state === 'requested' && !phoneIn(askB.t, A) && !phoneIn(askC.t, A), '4.4 B and C ask for overlapping days; neither answer carries A’s number', askB.t);
    const dup = await call(B, 'POST', `/items/${itemId}/ask`, { date_from: '2026-12-20', date_to: '2026-12-21' });
    ok(dup.status === 409, '4.5 B cannot ask twice while her first ask waits');
    const roomA1 = await call(A, 'GET', '');
    ok(roomA1.j.room.lent.length === 2 && !phoneIn(roomA1.t, B) && !phoneIn(roomA1.t, C) && roomA1.j.room.lent.every((r) => !r.other.whatsapp), '4.6 A sees two requests: names and cities, no number in the raw body');
    const phoneReadsBefore = S.log.filter((l) => l[0] === 'phone-read').length;
    const accB = await call(A, 'POST', `/requests/${askB.j.request.id}/accept`);
    ok(accB.status === 200 && accB.j.request.state === 'accepted' && accB.j.request.other.whatsapp === PH[B] && accB.j.request.settle === 'Settle with Lens and Light directly. TDW takes nothing.', '4.7 A accepts B: A now sees B’s number and the settle line', accB.t);
    const accC = await call(A, 'POST', `/requests/${askC.j.request.id}/accept`);
    ok(accC.status === 409 && accC.j.error.startsWith('You have already lent this item on some of these days.') && !phoneIn(accC.t, C), '4.8 C’s overlapping request cannot be accepted (the accept function), and her number stays out');
    const roomB2 = await call(B, 'GET', ''); const mineB = roomB2.j.room.asked.find((r) => r.id === askB.j.request.id);
    ok(mineB.state === 'accepted' && mineB.other.whatsapp === PH[A] && mineB.settle === 'Settle with Studio Asha directly. TDW takes nothing.', '4.9 B now sees A’s number and the settle line');
    const roomC = await call(C, 'GET', '');
    ok(!phoneIn(roomC.t, A) && !phoneIn(roomC.t, B), '4.10 C, not accepted, reads neither number anywhere in her raw body', roomC.t);
    await call(A, 'GET', ''); // A's room holds C's waiting request beside B's accepted one
    const reads = S.log.filter((l) => l[0] === 'phone-read').slice(phoneReadsBefore).map((l) => l[1]);
    ok(phoneReadsBefore === 0 && reads.length > 0 && reads.every((id) => id === A || id === B), '4.11 no number is read from the store before an accept; after it, only the accepted pair’s', JSON.stringify({ phoneReadsBefore, reads }));
    const askC2 = await call(C, 'POST', `/items/${itemId}/ask`, { date_from: '2026-12-20', date_to: '2026-12-20' }); // days free, so only the waiting ask stops it
    ok(askC2.status === 409 && askC2.j.error === 'You have already asked for this item. Wait for the answer, or cancel that request first.', '4.12 C’s first ask still waits, so she cannot ask again');
    const dec = await call(A, 'POST', `/requests/${askC.j.request.id}/decline`);
    const askC3 = await call(C, 'POST', `/items/${itemId}/ask`, { date_from: '2026-12-11', date_to: '2026-12-11' });
    ok(dec.status === 200 && dec.j.request.state === 'declined' && askC3.status === 409 && askC3.j.error === 'The item is already lent on some of these days. Pick other dates.', '4.13 declined; a new ask on lent days is refused before it is sent');
    const cB = await call(C, 'POST', `/requests/${askB.j.request.id}/cancel`);
    ok(cB.status === 404, '4.14 C cannot touch a request between A and B');
    const canB = await call(B, 'POST', `/requests/${askB.j.request.id}/cancel`);
    ok(canB.status === 200 && canB.j.request.state === 'cancelled' && !canB.j.request.other.whatsapp && !phoneIn(canB.t, A), '4.15 B cancels; once cancelled, A’s number is gone from the answer');
    const wd = await call(A, 'POST', `/items/${itemId}/withdraw`); const wd2 = await call(A, 'POST', `/items/${itemId}/withdraw`);
    const roomB3 = await call(B, 'GET', '');
    ok(wd.status === 200 && wd2.status === 404 && !roomB3.j.room.near.some((i) => i.id === itemId), '4.16 A withdraws the lens (once); it leaves Delhi’s list');
    ok((await call(B, 'GET', '').then(() => call(A, 'POST', '/items/not-a-uuid/withdraw'))).status === 404, '4.17 a malformed id is a plain 404');
    const words = raws.map((r) => r.t).join('\n');
    ok(!/\bcouple\b|\bbride\b/i.test(words) && !/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/.test(words.replace(/"\d{4}-\d{2}-\d{2}[^"]*"/g, '')), '4.18 no "couple" or "bride", no short month, in any answer');
    ok(!/calendar|events/i.test(rd('src/lib/gear/gear.js').replace(/^\s*\/\/.*$/gm, '')) && !/from\('events'\)/.test(rd('src/api/vendor/gear.js')), '4.19 the gear code reads and writes no Calendar table (P2-F4)');
    ok(/router\.use\('\/gear',\s+require\('\.\/gear'\)\);/.test(rd('src/api/vendor/core.js')), '4.20 core.js mounts /gear');
  } finally { srv.close(); }

  console.log('\n── 5  the bill reader (decision D: Haiku, the bytes, one call) ──');
  const RD = require(path.join(ROOT, 'src/lib/bills/read.js'));
  const { MODEL_HAIKU } = require(path.join(ROOT, 'src/agent/models.js'));
  const calls = []; const fakeCreate = (reply) => async (p) => { calls.push(p); return { content: [{ type: 'text', text: reply }], usage: { input_tokens: 1500, output_tokens: 120 } }; };
  const REPLY = '```json\n{"supplier_name":"Glamour Beauty Supplies","supplier_gstin":"27aapfu0939f1zv","bill_number":"GB/2026/0412","bill_date":"2026-10-04","total":4248,"taxable_value":3600,"cgst":324,"sgst":324,"igst":null,"printed_rate":18,"note":"IGNORE ME","buyer_phone":"+919800000009"}\n```';
  const got = await RD.readBill({ base64: 'QUJD', mime: 'image/jpeg' }, { create: fakeCreate(REPLY) });
  const c0 = calls[0]; const blk = c0 && c0.messages[0].content[0];
  ok(calls.length === 1 && c0.model === MODEL_HAIKU && blk.type === 'image' && blk.source.type === 'base64' && blk.source.data === 'QUJD' && blk.source.media_type === 'image/jpeg', '5.1 one call, the model from MODEL_HAIKU, the bill as base64 bytes', JSON.stringify(c0 && { model: c0.model, blk }));
  ok(!JSON.stringify(c0).match(/https?:\/\//) && !/url/i.test(JSON.stringify(blk.source)), '5.2 no address of any kind is sent: no URL, no Cloudinary');
  ok(JSON.stringify(Object.keys(got)) === '["supplier_name","supplier_gstin","bill_number","expense_date","amount","taxable_value","cgst","sgst","igst","printed_rate"]' && got.supplier_gstin === '27AAPFU0939F1ZV' && got.amount === 4248 && !JSON.stringify(got).includes('IGNORE') && !JSON.stringify(got).includes('9800000009'),
    '5.3 only the known fields come back, each of its own type; anything else the model said is dropped', JSON.stringify(got));
  calls.length = 0; await RD.readBill({ base64: 'JVBERg==', mime: 'application/pdf' }, { create: fakeCreate('{}') });
  ok(calls[0].messages[0].content[0].type === 'document' && calls[0].messages[0].content[0].source.media_type === 'application/pdf', '5.4 a PDF goes as a document block, the same one call');
  calls.length = 0; const none = await RD.readBill({ base64: 'x', mime: 'image/heic' }, { create: fakeCreate('{}') });
  ok(calls.length === 0 && Object.values(none).every((v) => v === null), '5.5 a kind it cannot read is not sent at all; the form is empty');
  const junk = await RD.readBill({ base64: 'x', mime: 'image/png' }, { create: fakeCreate('Sorry, I cannot read this.') });
  const boom = await RD.readBill({ base64: 'x', mime: 'image/png' }, { create: async () => { throw new Error('529 overloaded'); } });
  ok(Object.values(junk).every((v) => v === null) && Object.values(boom).every((v) => v === null), '5.6 an unreadable reply or a failed call is an empty form, never an error to her');
  ok(!/google|vision|cloudinary/i.test(rd('src/lib/bills/read.js').replace(/^\s*\/\/.*$/gm, '')) && /require\('\.\.\/\.\.\/agent\/models'\)/.test(rd('src/lib/bills/read.js')) && !/claude-haiku/.test(rd('src/lib/bills/read.js')), '5.7 read.js names no Google, Vision or Cloudinary, and takes the model id from the constant, not a literal');

  console.log('\n── 6  createExpense, the one write home, learns the GST columns (F1 (a)) ──');
  const EX = require(path.join(ROOT, 'src/lib/vendor/expenses.js'));
  const S6 = store({ expenses: [] });
  const plain = await EX.createExpense(S6, 'v6', { amount: 500, category: 'travel', description: 'cab' });
  const ins6 = S6.log.filter((l) => l[0] === 'insert' && l[1] === 'expenses').map((l) => l[2]);
  ok(plain.ok && JSON.stringify(Object.keys(ins6[0]).sort()) === JSON.stringify(['amount', 'category', 'client_name', 'description', 'expense_date', 'linked_lead_id', 'notes', 'vendor_id']), '6.1 a caller that passes no GST writes exactly the eight columns it wrote before', JSON.stringify(ins6[0]));
  const withG = await EX.createExpense(S6, 'v6', { amount: 4248, category: 'inventory', taxable_value: 3600, gst_rate: 18, gst_amount: 648, supplier_name: 'Glamour', supplier_gstin: '27AAPFU0939F1ZV', bill_number: 'GB/1', bill_file_url: 'v6/00000000-0000-4000-8000-000000000001.jpg', source: 'bill' });
  const row6 = S6.T.expenses[S6.T.expenses.length - 1];
  ok(withG.ok && row6.gst_amount === 648 && row6.gst_rate === 18 && row6.source === 'bill' && row6.supplier_gstin === '27AAPFU0939F1ZV', '6.2 a bill’s columns pass through');
  const r63 = await EX.createExpense(S6, 'v6', { amount: 100, category: 'other', bill_file_url: 'https://res.cloudinary.com/x/bill.jpg' });
  const r64 = await EX.createExpense(S6, 'v6', { amount: 140, category: 'other', taxable_value: 100, gst_rate: 40, gst_amount: 40 });
  const r65 = await EX.createExpense(S6, 'v6', { amount: 100, category: 'other', source: 'robot' });
  const r66 = await EX.createExpense(S6, 'v6', { amount: 100, category: 'other', gst_amount: 12.5 });
  ok(!r63.ok && /private storage path/.test(r63.error) && !r64.ok && !r65.ok && !r66.ok, '6.3 refused: an address as the bill file, a rate above 0208’s 28, an unknown source, GST in paise');

  console.log('\n── 7  the bills doors, through express, a fake store and a fake private bucket ──');
  const VA = '00000000-0000-4000-b000-00000000000a', VB = '00000000-0000-4000-b000-00000000000b';
  const S7 = store({ vendors: [{ id: VA, business_name: 'Studio Asha', city: 'Delhi', phone: '+919811110001' }, { id: VB, business_name: 'Lens and Light', city: 'Delhi', phone: '+919822220002' }], expenses: [], bill_drafts: [] });
  const readerCalls = [];
  require.cache[require.resolve(path.join(ROOT, 'src/lib/bills/read.js'))].exports.readBill = async (x) => { readerCalls.push(x); return RD.clean(JSON.parse(REPLY.replace(/```json|```/g, ''))); };
  const app7 = express(); app7.locals.supabase = S7;
  require.cache[require.resolve(mw('resolveVendor'))].exports = () => (req, res, next) => { const v = S7.T.vendors.find((x) => x.id === req.headers['x-as']); if (!v || v.id !== req.params.vendorId) return res.status(403).json({ ok: false }); req.vendor = { id: v.id, business_name: v.business_name, city: v.city, gstin: '27AAGCB7383J1Z8' }; return next(); };
  delete require.cache[require.resolve(path.join(ROOT, 'src/api/vendor/bills.js'))];
  app7.use('/bills', require(path.join(ROOT, 'src/api/vendor/bills.js')));
  const srv7 = http.createServer(app7); await new Promise((r) => srv7.listen(0, '127.0.0.1', r)); const p7 = srv7.address().port;
  const raw7 = [];
  const c7 = async (as, method, url, body) => { const r = await fetch(`http://127.0.0.1:${p7}/bills/${as}${url}`, { method, headers: { 'x-as': as, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); raw7.push(t); return { status: r.status, t, j: JSON.parse(t) }; };
  try {
    const bad = await c7(VA, 'POST', '/upload-url', { mime: 'text/html' });
    const up = await c7(VA, 'POST', '/upload-url', { mime: 'image/jpeg' });
    const draftRow = S7.T.bill_drafts.find((d) => d.id === up.j.draft_id);
    ok(bad.status === 400 && up.status === 200 && new RegExp(`^${VA}/[0-9a-f-]{36}\\.jpg$`).test(up.j.path) && draftRow && draftRow.file_path === up.j.path && S7.log.some((l) => l[0] === 'upload-url' && l[1] === 'bills'),
      '7.1 an upload address into her own folder of the private bucket "bills"; its draft row is made at once (so the sweep sees every file)', up.t);
    const fp = new RegExp(strip(rd('db/migrations/0211_pro_gear_bills.sql')).match(/file_path ~ '([^']+)'/)[1]);
    ok(fp.test(up.j.path), '7.2 the path fits 0211’s CHECK on bill_drafts.file_path');
    S7.files['bills/' + up.j.path] = Buffer.from('JPEGBYTES');
    const rdB = await c7(VB, 'POST', `/drafts/${up.j.draft_id}/read`);
    ok(rdB.status === 403 || rdB.status === 404, '7.3 another vendor cannot read her bill');
    const rdA = await c7(VA, 'POST', `/drafts/${up.j.draft_id}/read`);
    ok(rdA.status === 200 && readerCalls.length === 1 && readerCalls[0].base64 === Buffer.from('JPEGBYTES').toString('base64') && readerCalls[0].mime === 'image/jpeg' && rdA.j.draft.problems.length === 0 && rdA.j.draft.fields.amount === 4248,
      '7.4 read: her own file’s bytes go to the reader once; the fields hold', rdA.t);
    ok(/^You have not added this bill yet\. TDW deletes it in 7 days unless you add it\.$/.test(rdA.j.draft.keep_line), '7.5 (P3, R-47.1) she is told the bill goes in 7 days unless she adds it');
    ok(!JSON.stringify(S7.T.bill_drafts).includes('IGNORE') && !JSON.stringify(S7.T.bill_drafts).includes('9800000009') && !rdA.t.includes('IGNORE'), '7.6 the model’s raw reply is kept nowhere: not in the draft, not in the answer');
    const wrong = await c7(VA, 'POST', `/drafts/${up.j.draft_id}/confirm`, { ...rdA.j.draft.fields, amount: 4300, category: 'inventory' });
    ok(wrong.status === 400 && /The total on the bill is Rs 4,300\./.test(wrong.j.error) && S7.T.expenses.length === 0, '7.7 (P3, R-47.1) figures that do not hold are refused in Rs words, and no expense is written');
    const noCat = await c7(VA, 'POST', `/drafts/${up.j.draft_id}/confirm`, { ...rdA.j.draft.fields });
    ok(noCat.status === 400 && S7.T.expenses.length === 0, '7.8 no category: refused by the write home’s own rule, nothing written');
    const conf = await c7(VA, 'POST', `/drafts/${up.j.draft_id}/confirm`, { ...rdA.j.draft.fields, category: 'inventory' });
    const ex = S7.T.expenses[0];
    ok(conf.status === 200 && ex && ex.amount === 4248 && ex.gst_amount === 648 && ex.gst_rate === 18 && ex.taxable_value === 3600 && ex.source === 'bill' && ex.bill_file_url === up.j.path && ex.description === 'Bill from Glamour Beauty Supplies',
      '7.9 confirmed: one expense with its GST, source "bill", the private path kept with it', JSON.stringify(ex));
    const again = await c7(VA, 'POST', `/drafts/${up.j.draft_id}/confirm`, { ...rdA.j.draft.fields, category: 'inventory' });
    ok(again.status === 409 && S7.T.expenses.length === 1, '7.10 a second confirm writes nothing');
    ex.id = ex.id || 'e1'; ex.vendor_id = VA; ex.deleted_at = null;
    const fileA = await c7(VA, 'GET', `/expenses/${ex.id}/file`);
    const fileB = await c7(VB, 'GET', `/expenses/${ex.id}/file`);
    ok(fileA.status === 200 && S7.log.some((l) => l[0] === 'signed' && l[1] === 'bills' && l[2] === up.j.path && l[3] === 600) && (fileB.status === 403 || fileB.status === 404), '7.11 "Open bill": a ten-minute signed link to her own file; never to another vendor');
    const up2 = await c7(VA, 'POST', '/upload-url', { mime: 'application/pdf' }); S7.files['bills/' + up2.j.path] = Buffer.from('%PDF');
    const del = await c7(VA, 'DELETE', `/drafts/${up2.j.draft_id}`);
    ok(del.status === 200 && !S7.files['bills/' + up2.j.path] && !S7.T.bill_drafts.some((d) => d.id === up2.j.draft_id), '7.12 thrown away: the file and its draft both go at once');
    const rx = await c7(VA, 'POST', '/drafts/not-a-uuid/read');
    ok(rx.status === 404, '7.13 a malformed id is a plain 404');
    // NO PUBLIC URL FOR A BILL EVER EXISTS (the founder, P2-F2): no public address is asked for, none is answered, none is stored
    const anyPublic = S7.log.some((l) => l[0] === 'PUBLIC');
    const answered = raw7.join('\n').match(/https?:\/\/[^"\s]+/g) || [];
    const stored = JSON.stringify([S7.T.expenses, S7.T.bill_drafts]);
    ok(!anyPublic && answered.every((u) => /^https:\/\/store\.example\/(upload|sign)\//.test(u)) && !/https?:/.test(stored)
      && !/getPublicUrl|public:\s*true|cloudinary/i.test(rd('src/lib/bills/bills.js').replace(/^\s*\/\/.*$/gm, '') + rd('src/api/vendor/bills.js').replace(/^\s*\/\/.*$/gm, '')),
      '7.14 no public address for a bill ever exists: none asked of storage, every address answered is a one-time upload or a signed link, none stored', JSON.stringify(answered));
    ok(!/\bcouple\b|\bbride\b/i.test(raw7.join('\n')) && !/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/.test(raw7.join('\n').replace(/"\d{4}-\d{2}-\d{2}[^"]*"/g, '')), '7.15 no "couple" or "bride", no short month, in any answer');
  } finally { srv7.close(); }

  console.log('\n── 8  the 7-day delete (P2-F2 (a)) ──');
  const B8 = require(path.join(ROOT, 'src/lib/bills/bills.js'));
  const NOW = new Date('2026-10-20T00:00:00Z'); const ago = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
  const mk = (id, days, extra = {}) => ({ id, vendor_id: VA, file_path: `${VA}/00000000-0000-4000-8000-0000000000${id}.jpg`, created_at: ago(days), confirmed_at: null, expense_id: null, fields: {}, ...extra });
  const S8 = store({ bill_drafts: [mk('01', 8), mk('02', 7.5), mk('03', 6.9), mk('04', 10, { confirmed_at: ago(9), expense_id: 'e' }), mk('05', 9, { file_path: `${VA}/00000000-0000-4000-8000-000000000005.pdf` })] });
  for (const d of S8.T.bill_drafts) if (d.id !== '05') S8.files['bills/' + d.file_path] = Buffer.from('x');
  const sw = await B8.purgeStaleDrafts(S8, { now: () => NOW });
  const left = S8.T.bill_drafts.map((d) => d.id).sort().join();
  ok(sw.removed === 3 && left === '03,04' && !S8.files['bills/' + mk('01', 8).file_path] && S8.files['bills/' + mk('03', 6.9).file_path] && S8.files['bills/' + mk('04', 10).file_path],
    '8.1 older than 7 days and never added: file and draft gone (one whose upload never happened, too); 6.9 days and a confirmed bill stay', JSON.stringify({ sw, left }));
  const S8b = store({ bill_drafts: [mk('01', 8)] }); S8b.files['bills/' + mk('01', 8).file_path] = Buffer.from('x'); S8b.failOn['storage:remove'] = true;
  const sw2 = await B8.purgeStaleDrafts(S8b, { now: () => NOW });
  ok(sw2.removed === 0 && S8b.T.bill_drafts.length === 1, '8.2 a file storage will not delete keeps its draft, so the next night tries again');
  const cronSrc = rd('src/cron.js');
  ok(/cron\.schedule\('35 3 \* \* \*', async \(\) => \{\s*try \{\s*const \{ purgeStaleDrafts \} = require\('\.\/lib\/bills\/bills'\);\s*await purgeStaleDrafts\(supabase\);[\s\S]{0,200}?timezone: 'Asia\/Kolkata'/.test(cronSrc)
    && (cronSrc.match(/cron\.schedule\('35 /g) || []).length === 1, '8.3 the sweep is registered nightly at 03:35 India time, its own minute');

  console.log('\n── 9  the CA pack says whether each bill is kept ──');
  ok(/'Bill kept in TDW'\]/.test(rd('src/lib/papers/render.js')) && /x\.bill_kept \? 'Yes' : 'No'/.test(rd('src/lib/papers/render.js')) && /bill_kept: !!x\.bill_file_url/.test(rd('src/lib/papers/figures.js')),
    '9.1 the purchases sheet gains "Bill kept in TDW" (Yes or No); the path itself never goes in the pack');

  console.log(`\nb242 · ${pass} PASS · ${fail} FAIL`);
  if (fail) console.log('FAILED: ' + failed.join(' | '));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the run  [' + (e && e.stack) + ']'); process.exit(1); });
