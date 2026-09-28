// scripts/b146_ce46_web1_domain_bench.js
// TDW · CE-46 · WEB-1 cut 2 · b146 — HER OWN NAME: SHE PAYS FIRST, THE BUY IS THE WEBHOOK'S, ONE WRITER, ONE BUY.
//
// §1 the pricing rule · §2 the registrar client on a fake that refuses unknown
// fields and paths · §3 the service's life on a Postgres-shaped double (UNIQUE
// and CHECK enforced) · §4 the doors over HTTP behind the gate, closed and open
// · §5 the contract, the migration, the webhook hook, the cron slot, in the
// source · §6 mutations. No network, no keys, no money.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const express = require('express');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const pricing = require(P('src/lib/domains/pricing.js')); const rc = require(P('src/lib/domains/resellerclub.js')); const service = require(P('src/lib/domains/service.js'));
const contract = require(P('src/api/vendor/solutions/contract.js'));

// ── THE FAKES: every call recorded; any field or path not declared REFUSES (P3's lesson) ──
const CALLS = []; const PRICES = { dotin: { addnewdomain: { 1: '625.00' } }, domcno: { addnewdomain: { 1: '1180.00' } }, thirdleveldotin: { addnewdomain: { 1: '450.00' } } };
const KNOWN = {
  'domains/available.json': ['auth-userid', 'api-key', 'domain-name', 'tlds'], 'products/reseller-price.json': ['auth-userid', 'api-key'],
  'customers/v2/signup.json': ['auth-userid', 'api-key', 'username', 'passwd', 'name', 'company', 'address-line-1', 'city', 'state', 'country', 'zipcode', 'phone-cc', 'phone', 'lang-pref'],
  'contacts/add.json': ['auth-userid', 'api-key', 'name', 'company', 'email', 'address-line-1', 'city', 'state', 'country', 'zipcode', 'phone-cc', 'phone', 'customer-id', 'type'],
  'domains/register.json': ['auth-userid', 'api-key', 'domain-name', 'years', 'ns', 'customer-id', 'reg-contact-id', 'admin-contact-id', 'tech-contact-id', 'billing-contact-id', 'invoice-option', 'protect-privacy'],
  'domains/details-by-name.json': ['auth-userid', 'api-key', 'domain-name', 'options'],
};
let REGISTERS = 0; const REGISTERED = new Set(); let VERCEL_ADDS = 0; let VERCEL_STATE = { verified: false, misconfigured: true };
const res = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
async function fakeFetch(url, init = {}) {
  const u = new URL(url); CALLS.push({ host: u.host, path: u.pathname, method: init.method || 'GET', params: Object.fromEntries(u.searchParams), body: init.body ? JSON.parse(init.body) : null });
  if (u.host === 'httpapi.com') {
    const key = u.pathname.replace(/^\/api\//, ''); const allowed = KNOWN[key]; if (!allowed) throw new Error(`[fake registrar] UNDECLARED PATH ${key}`);
    for (const k of u.searchParams.keys()) if (!allowed.includes(k)) throw new Error(`[fake registrar] UNDECLARED FIELD ${k} on ${key}`);
    if (key === 'domains/available.json') { const n = u.searchParams.get('domain-name'); const out = {}; for (const t of u.searchParams.getAll('tlds')) out[`${n}.${t}`] = { status: n === 'taken' ? 'regthroughothers' : (t === 'com' ? 'regthroughothers' : 'available') }; return res(200, out); }
    if (key === 'products/reseller-price.json') return res(200, PRICES);
    if (key === 'customers/v2/signup.json') return res(200, 55001);
    if (key === 'contacts/add.json') return res(200, 77002);
    if (key === 'domains/register.json') { REGISTERS += 1; if (u.searchParams.getAll('ns').join(',') !== 'ns1.vercel-dns.com,ns2.vercel-dns.com') return res(200, { status: 'ERROR', message: 'bad ns' }); REGISTERED.add(u.searchParams.get('domain-name')); return res(200, { entityid: '900001', actionstatus: 'Success' }); }
    if (key === 'domains/details-by-name.json') return REGISTERED.has(u.searchParams.get('domain-name')) ? res(200, { orderid: '900001', endtime: String(Math.floor(Date.UTC(2027, 8, 28) / 1000)) }) : res(200, { status: 'ERROR', message: 'Website doesn\'t exist for ' + u.searchParams.get('domain-name') });
  }
  if (u.host === 'api.razorpay.com') { if (u.pathname !== '/v1/payment_links' || init.method !== 'POST') throw new Error('[fake razorpay] UNDECLARED'); const b = JSON.parse(init.body); if (!b.reference_id || b.notes.tdw_kind !== 'domain') throw new Error('[fake razorpay] link without the row reference'); return res(200, { id: 'plink_1', short_url: 'https://rzp.io/l/x1' }); }
  if (u.host === 'api.vercel.com') {
    if (u.pathname === '/v10/projects/prj_1/domains' && init.method === 'POST') { VERCEL_ADDS += 1; return res(200, { name: JSON.parse(init.body).name, verified: VERCEL_STATE.verified }); }
    if (/^\/v9\/projects\/prj_1\/domains\//.test(u.pathname)) return res(200, { verified: VERCEL_STATE.verified });
    if (/^\/v6\/domains\/.*\/config$/.test(u.pathname)) return res(200, { misconfigured: VERCEL_STATE.misconfigured });
    throw new Error('[fake vercel] UNDECLARED ' + u.pathname);
  }
  throw new Error('[fake] UNDECLARED HOST ' + u.host);
}
const deps = { fetch: fakeFetch, registrarPassword: 'Test-pass-1' };

// ── THE DOUBLE: vendor_domains as Postgres would hold it (UNIQUE, CHECK, defaults) ──
const STATUSES = ['paying', 'registering', 'wiring', 'live', 'expired', 'error', 'refund_due', 'refunded'];
function dbl() {
  const rows = []; let n = 0;
  const uniq = (row, col) => row[col] != null && rows.some((r) => r !== row && r[col] === row[col]);
  const check = (row) => { if (!STATUSES.includes(row.status)) throw new Error(`CHECK status ${row.status}`); if (!(row.price_paise >= row.cost_paise)) throw new Error('CHECK price >= cost'); for (const c of ['domain', 'razorpay_link_id', 'razorpay_payment_id', 'registrar_order_id']) if (uniq(row, c)) throw new Error(`UNIQUE ${c}`); };
  const api = { rows, from(table) { if (table !== 'vendor_domains') throw new Error('[double] UNDECLARED TABLE ' + table);
    const q = { f: [], nulls: [], order: null, lim: null, mode: 'select', patch: null, ins: null };
    q.select = () => q; q.eq = (c, v) => { q.f.push([c, v]); return q; }; q.is = (c, v) => { q.nulls.push(c); return q; }; q.order = () => q; q.limit = (l) => { q.lim = l; return q; };
    q.insert = (r) => { q.mode = 'insert'; q.ins = r; return q; }; q.update = (p) => { q.mode = 'update'; q.patch = p; return q; };
    const match = () => rows.filter((r) => q.f.every(([c, v]) => r[c] === v) && q.nulls.every((c) => r[c] == null)).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const run = async () => { try {
      if (q.mode === 'insert') { const row = { id: 'row-' + (++n), status: 'paying', gst_pct: 18, years: 1, auto_renew: false, retries: 0, created_at: new Date(Date.now() + n).toISOString(), ...q.ins }; check(row); rows.push(row); return { data: [row], error: null }; }
      if (q.mode === 'update') { const hit = match(); for (const r of hit) { Object.assign(r, q.patch); check(r); } return { data: hit, error: null }; }
      return { data: q.lim ? match().slice(0, q.lim) : match(), error: null }; } catch (e) { return { data: null, error: { message: e.message } }; } };
    q.single = async () => { const r = await run(); if (r.error) return r; return { data: r.data[0] || null, error: r.data[0] ? null : { message: 'no row' } }; };
    q.then = (a, b) => run().then(a, b); return q; } };
  return api;
}
process.env.RESELLERCLUB_USER_ID = 'u1'; process.env.RESELLERCLUB_API_KEY = 'k1'; process.env.VERCEL_TOKEN = 't1'; process.env.VERCEL_PROJECT_ID = 'prj_1';
process.env.RAZORPAY_KEY_ID = 'rzp_test'; process.env.RAZORPAY_KEY_SECRET = 's'; delete process.env.RESELLERCLUB_GST_PCT;
const vendor = { id: 'v-1', routing_handle: 'DEV440', business_name: 'Aarohi Sen Photography' };
const registrant = { name: 'Aarohi Sen', email: 'aarohi@example.in', phone: '9999999999', address1: '12 Sainik Farms', city: 'New Delhi', state: 'Delhi', zipcode: '110062' };

(async () => {
  sec('1  the ten percent, after GST, whole rupees (the founder, 27 September)');
  ok(pricing.sellPaise(62500) === 81200, '1.1 Rs 625 pre-tax → Rs 737.50 with 18% GST → Rs 811.25 with 10% → Rs 812 (rounded up to the rupee)');
  ok(pricing.sellPaise(62500, 0) === 68800, '1.2 with GST at zero the ten percent alone gives Rs 688');
  ok(pricing.rupeeLine(81200) === 'Rs 812 a year' && pricing.rupeeLine(18500000, false) === 'Rs 1,85,000', '1.3 the room\'s line in the Indian register');
  let threw = false; try { pricing.sellPaise(0); } catch { threw = true; } ok(threw, '1.4 a zero or missing cost refuses; no free domain by arithmetic');

  sec('2  the registrar client on the fake');
  const av = await rc.available('Priya', deps);
  ok(av.length === 3 && av[0].domain === 'priya.in' && av[0].available === true && av.find((a) => a.domain === 'priya.com').available === false, '2.1 availability for the three ruled endings, lowercased, the taken one marked');
  ok((await rc.available('taken', deps)).every((a) => !a.available), '2.2 a taken name is never available');
  ok(await rc.yearOneRupees('in', deps) === 625 && await rc.yearOneRupees('xyz', deps) === null, '2.3 the year-one rupee figure from the reseller price list; an unlisted ending is null');

  sec('3  the life of one order on the double');
  const db = dbl(); CALLS.length = 0;
  const s1 = await service.search('priya', deps);
  ok(s1.length <= 5 && s1.find((r) => r.domain === 'priya.in').pricePaise === 81200 && s1.find((r) => r.domain === 'priya.com').pricePaise === null, '3.1 search: ≤5 results, the sell price on an available name, null on a taken one');
  ok(db.rows.length === 0 && !CALLS.some((c) => c.path.includes('register')), '3.2 search writes no row and buys nothing');
  const bad = await service.order(db, vendor, { domain: 'priya.in', registrant: { name: 'x' } }, deps);
  ok(bad.ok === false && /registrant missing: email/.test(bad.reason) && db.rows.length === 0, '3.3 an order without her full registrant is refused by name and writes nothing');
  const taken = await service.order(db, vendor, { domain: 'taken.in', registrant }, deps);
  ok(taken.ok === false && /not available/.test(taken.reason), '3.4 a taken name is refused before any row');
  const o = await service.order(db, vendor, { domain: 'priya.in', registrant }, deps);
  ok(o.ok && o.row.status === 'paying' && o.row.cost_paise === 62500 && o.row.price_paise === 81200 && o.row.razorpay_link_url === 'https://rzp.io/l/x1', '3.5 an order is a row in paying: cost 62500, price 81200, the pay link on it');
  ok(REGISTERS === 0 && VERCEL_ADDS === 0, '3.6 NO registrar buy and NO Vercel add before the pay: TDW spends nothing');
  const link = CALLS.find((c) => c.host === 'api.razorpay.com');
  ok(link && link.body.amount === 81200 && link.body.reference_id === o.row.id && link.body.notes.vendor_id === 'v-1' && link.body.currency === 'INR', '3.7 the payment link is for the sell price, in INR, referencing her row and her vendor id');
  ok(o.row.registrant.name === 'Aarohi Sen' && o.row.registrant.company === 'Aarohi Sen Photography' && o.row.registrant.country === 'IN', '3.8 the registrant is HER: her name, her studio, India; TDW is nowhere on the record');
  const short = await service.onPaid(db, { rowId: o.row.id, paymentId: 'pay_1', amountPaise: 1000 }, deps);
  ok(short.ok === false && /paid less/.test(short.reason) && REGISTERS === 0, '3.9 a payment under the price buys nothing');
  const paid = await service.onPaid(db, { rowId: o.row.id, paymentId: 'pay_1', amountPaise: 81200 }, deps);
  ok(paid.ok && paid.row.status === 'wiring' && paid.row.registrar_order_id === '900001' && paid.row.registrar_customer_id === '55001' && paid.row.registrar_contact_id === '77002' && paid.row.paid_at && paid.row.registered_at, '3.10 the webhook\'s word: customer, contact, buy, then wiring; the order id and the paid time on the row');
  const regCall = CALLS.find((c) => c.path.endsWith('domains/register.json'));
  ok(REGISTERS === 1 && regCall.params['reg-contact-id'] === '77002' && regCall.params['invoice-option'] === 'NoInvoice' && regCall.params['protect-privacy'] === 'true', '3.11 exactly one buy, in her contact, privacy on, no registrar invoice to her');
  ok(paid.row.expires_at && paid.row.expires_at.startsWith('2027-09-28') && VERCEL_ADDS === 1 && paid.row.vercel_domain_added_at, '3.12 the expiry read from the order; the domain added to the Vercel project once');
  const again = await service.onPaid(db, { rowId: o.row.id, paymentId: 'pay_1', amountPaise: 81200 }, deps);
  ok(again.ok && again.already === true && REGISTERS === 1 && VERCEL_ADDS === 1, '3.13 the same webhook again: already bought, nothing bought twice, nothing added twice');
  const sw1 = await service.sweepWiring(db, deps);
  ok(sw1.checked === 1 && sw1.live === 0 && db.rows[0].status === 'wiring', '3.14 the sweep before DNS points here: still wiring');
  VERCEL_STATE = { verified: true, misconfigured: false };
  const sw2 = await service.sweepWiring(db, deps);
  ok(sw2.live === 1 && db.rows[0].status === 'live' && db.rows[0].live_at && service.liveUrlOf(db.rows[0]) === 'https://priya.in', '3.15 verified and configured: live, with her https address');
  const dup = await service.order(db, vendor, { domain: 'priya.in', registrant }, deps);
  ok(dup.ok === false && /not available|UNIQUE domain/.test(dup.reason), '3.16 the same name cannot be ordered twice (the fake says taken; the double says UNIQUE)');
  const db2 = dbl(); const o2 = await service.order(db2, vendor, { domain: 'meher.in', registrant }, deps);
  const failing = { ...deps, fetch: async (url, init) => { if (String(url).includes('domains/register.json')) return res(200, { status: 'ERROR', message: 'registry down' }); return fakeFetch(url, init); } };
  const err = await service.onPaid(db2, { rowId: o2.row.id, paymentId: 'pay_2', amountPaise: 81200 }, failing);
  ok(err.ok === false && db2.rows[0].status === 'error' && /registry down/.test(db2.rows[0].last_error) && db2.rows[0].paid_at, '3.17 a registrar failure after the pay: the row says error with the reason, the payment kept on it, nothing lost');

  sec('3b  S8, the policy: tried again for a day, then a refund is due (never a second buy)');
  {
    const db3 = dbl(); const o3 = await service.order(db3, vendor, { domain: 'kabir.in', registrant }, deps);
    let regDown = true; const flaky = { ...deps, fetch: async (url, init) => { if (String(url).includes('domains/register.json') && regDown) return res(200, { status: 'ERROR', message: 'registry down' }); return fakeFetch(url, init); } };
    const before = REGISTERS;
    await service.onPaid(db3, { rowId: o3.row.id, paymentId: 'pay_3', amountPaise: 81200 }, flaky);
    ok(db3.rows[0].status === 'error' && db3.rows[0].paid_at && !db3.rows[0].registrar_order_id, '3b.1 the first try fails: error, paid, no order');
    const t0 = new Date(db3.rows[0].paid_at).getTime();
    regDown = false;
    const r1 = await service.sweepRetry(db3, { ...flaky, now: () => t0 + 60 * 60 * 1000 });
    ok(r1.retried === 1 && r1.bought === 1 && db3.rows[0].status === 'wiring' && db3.rows[0].retries === 1 && REGISTERS === before + 1, '3b.2 within the day the sweep tries again once and it goes through: wiring, one buy');
    const r2 = await service.sweepRetry(db3, { ...flaky, now: () => t0 + 2 * 60 * 60 * 1000 });
    ok(r2.retried === 0 && REGISTERS === before + 1, '3b.3 a bought row is never retried');
    // a register that SUCCEEDED at the registrar while its answer was lost: the retry adopts the order and buys nothing
    const db4 = dbl(); const o4 = await service.order(db4, vendor, { domain: 'lost.in', registrant }, deps);
    const lost = { ...deps, fetch: async (url, init) => { if (String(url).includes('domains/register.json')) { REGISTERS += 1; REGISTERED.add(new URL(url).searchParams.get('domain-name')); throw new Error('socket hang up'); } return fakeFetch(url, init); } };
    await service.onPaid(db4, { rowId: o4.row.id, paymentId: 'pay_4', amountPaise: 81200 }, lost);
    const regs = REGISTERS;
    await service.sweepRetry(db4, { ...deps, now: () => new Date(db4.rows[0].paid_at).getTime() + 1000 });
    ok(db4.rows[0].status === 'wiring' && db4.rows[0].registrar_order_id === '900001' && REGISTERS === regs, '3b.4 an answer lost in transit: the retry reads the order at the registrar and ADOPTS it; no second register call');
    // past the day: refund_due, no buy
    const db5 = dbl(); const o5 = await service.order(db5, vendor, { domain: 'late.in', registrant }, deps);
    await service.onPaid(db5, { rowId: o5.row.id, paymentId: 'pay_5', amountPaise: 81200 }, flaky.fetch === undefined ? deps : { ...deps, fetch: async (u, i) => (String(u).includes('domains/register.json') ? res(200, { status: 'ERROR', message: 'registry down' }) : fakeFetch(u, i)) });
    const regs5 = REGISTERS;
    const r5 = await service.sweepRetry(db5, { ...deps, now: () => new Date(db5.rows[0].paid_at).getTime() + service.RETRY_WINDOW_MS + 1000 });
    ok(r5.refundDue === 1 && db5.rows[0].status === 'refund_due' && db5.rows[0].refund_due_at && REGISTERS === regs5, '3b.5 past one day: refund_due with its time, the founder\'s task; no register call');
    const r6 = await service.sweepRetry(db5, { ...deps, now: () => Date.now() + 9e9 });
    ok(r6.refundDue === 0 && r6.retried === 0, '3b.6 a refund_due row is left for the founder: the sweep neither retries nor re-flags it');
    const dbU = dbl(); const oU = await service.order(dbU, vendor, { domain: 'unpaid.in', registrant }, deps);
    await dbU.from('vendor_domains').update({ status: 'error' }).eq('id', oU.row.id);
    const rU = await service.sweepRetry(dbU, { ...deps, now: () => Date.now() + 9e9 });
    ok(rU.retried === 0 && rU.refundDue === 0 && dbU.rows[0].status === 'error', '3b.7 an order that was never paid is neither retried nor refunded');
  }

  sec('4  the doors over HTTP, behind the gate');
  const app = express(); app.use(express.json());
  const dbh = dbl(); app.locals.supabase = dbh; app.locals.domainDeps = deps;
  app.use('/d', (req, _res, next) => { req.vendor = vendor; next(); });
  // the two guards are the estate's and read Supabase auth; here they are stood in by pass-throughs
  // BEFORE domain.js loads, so the doors' own `requireAuth, resolveVendor()` lines still run (5.x pins them in the source).
  for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('requireAuth.js') ? (req, _r, next) => next() : () => (req, _r, next) => next() }; }
  const router = require(P('src/api/vendor/solutions/domain.js'));
  app.use('/d', router);
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); }); const BASE = 'http://127.0.0.1:' + server.address().port;
  const call = (m, p, body) => new Promise((resolve, reject) => { const rq = http.request(BASE + p, { method: m, headers: { 'content-type': 'application/json', authorization: 'Bearer x' } }, (rs) => { let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { } resolve({ status: rs.statusCode, body: j }); }); }); rq.on('error', reject); if (body) rq.write(JSON.stringify(body)); rq.end(); });
  const saved = { u: process.env.RESELLERCLUB_USER_ID }; delete process.env.RESELLERCLUB_USER_ID;
  const env = require(P('src/api/vendor/solutions/env.js'));
  if (!env.gates().p2) {
    const c1 = await call('GET', '/d/search?q=priya'); const c2 = await call('POST', '/d/order', { domain: 'priya.in', registrant }); const c3 = await call('GET', '/d');
    ok(c1.status === 200 && c1.body.results.length === 0 && c1.body.live === false, '4.1 gate closed: search answers an empty list, live false (the stub\'s answer)');
    ok(c2.status === 503, '4.2 gate closed: an order is 503, no row');
    ok(c3.status === 200 && c3.body.domain.status === 'none' && c3.body.domain.subdomain === 'dev440.thedreamwedding.in' && c3.body.domain.paymentUrl === null, '4.3 gate closed: the status is none with her subdomain');
  } else { ok(false, '4.1 gate closed could not be produced (env)'); }
  process.env.RESELLERCLUB_USER_ID = saved.u; process.env.STOREFRONT_ROOT_DOMAIN = 'thedreamwedding.in';
  const g = env.gates().p2; ok(g === true, '4.4 with the P2 keys set the gate opens', JSON.stringify(env.gates()));
  const s4 = await call('GET', '/d/search?q=priya'); ok(s4.status === 200 && s4.body.live === true && s4.body.results.length === 3 && s4.body.results[0].pricePaise === 81200, '4.5 gate open: the search answers with the sell price');
  const o4 = await call('POST', '/d/order', { domain: 'priya.in', registrant }); ok(o4.status === 200 && o4.body.domain.status === 'paying' && o4.body.domain.paymentUrl === 'https://rzp.io/l/x1' && o4.body.domain.pricePaise === 81200, '4.6 gate open: the order answers DomainStatus in paying with the pay link and the price');
  ok(contract.shape('DomainStatus', o4.body.domain).ok === true, '4.7 the door\'s answer passes the contract (no extra, no missing)');
  const r4 = await call('POST', '/d/order', { domain: 'priya.in', registrant: { name: 'x' } }); ok(r4.status === 409 && /registrant missing/.test(r4.body.error || JSON.stringify(r4.body)), '4.8 a bad order is 409 with the reason');
  server.close();

  sec('5  the source: contract, migration, webhook, cron');
  const src = read('src/api/vendor/solutions/contract.js');
  ok(contract.CONTRACT_DIGEST === contract.computeDigest() && /'pricePaise', 'paymentUrl'/.test(src) && /'paying'\|'registering'/.test(src), '5.1 DomainStatus carries pricePaise and paymentUrl, status carries paying, the digest moved with it (the pwa twin moves in cut 3)');
  const mig = read('db/migrations/0178_vendor_domains.sql');
  ok(/CREATE TABLE public\.vendor_domains/.test(mig) && /domain\s+text NOT NULL UNIQUE/.test(mig) && /razorpay_payment_id\s+text UNIQUE/.test(mig) && /registrar_order_id\s+text UNIQUE/.test(mig), '5.2 0178: the table with its four UNIQUEs (domain, link, payment, order)');
  ok(/CHECK \(status IN \('paying', 'registering', 'wiring', 'live', 'expired', 'error', 'refund_due', 'refunded'\)\)/.test(mig) && /retries\s+integer NOT NULL DEFAULT 0/.test(mig) && /refund_due_at\s+timestamptz/.test(mig) && /CHECK \(price_paise >= cost_paise\)/.test(mig), '5.3 0178: the status vocabulary (with refund_due and refunded) and price ≥ cost as CHECKs; retries and refund_due_at columns');
  ok(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.vendor_domains TO service_role;/.test(mig) && /^BEGIN;/m.test(mig) && /^COMMIT;/m.test(mig), '5.4 0178: A-45.8 grants service_role in the same file, inside one transaction');
  ok(/^ALTER TABLE public\.vendor_domains ENABLE ROW LEVEL SECURITY;$/m.test(mig) && mig.indexOf('ENABLE ROW LEVEL SECURITY') > mig.indexOf('CREATE TABLE public.vendor_domains') && mig.indexOf('ENABLE ROW LEVEL SECURITY') < mig.indexOf('CREATE INDEX') && mig.indexOf('ENABLE ROW LEVEL SECURITY') < mig.indexOf('COMMIT;') && !/CREATE POLICY/.test(mig), '5.4b 0178: RLS enabled on vendor_domains after the table and before its indexes, inside the transaction, no policy (SEC-1, the 0171 shape)');
  const ix = read('src/index.js');
  ok(/normalized\.event === 'payment_link\.paid'/.test(ix) && /notes\.tdw_kind === 'domain' && notes\.row_id/.test(ix) && /domainService\.onPaid\(supabase, \{ rowId: String\(notes\.row_id\)/.test(ix), '5.5 the webhook: payment_link.paid with tdw_kind domain calls onPaid with the row id, after the ledger and after the 200');
  ok(ix.indexOf('domainService.onPaid') > ix.indexOf("res.status(200).send('ok'); // inside the five-second law"), '5.6 the buy runs after the 200, inside the five-second law');
  const cr = read('src/cron.js');
  ok(/cron\.schedule\('50 \* \* \* \*'/.test(cr) && /sweepWiring\(supabase\)/.test(cr) && /sweepRetry\(supabase\)/.test(cr) && cr.indexOf('sweepRetry(supabase)') < cr.indexOf('sweepWiring(supabase)') && /gates\(\)\.p2\) return;/.test(cr), '5.7 at :50 every hour (r4: off the 03:40 Search Console minute, b59 8.1): the retry sweep, then the wiring sweep; Asia/Kolkata; a no-op without the P2 keys');
  ok((cr.match(/cron\.schedule\('50 /g) || []).length === 1 && (cr.match(/cron\.schedule\('40 /g) || []).length === 1, '5.7b the sweep owns :50 alone, and :40 stays the Search Console pull\'s alone (b59 §8.1)');
  const idx = read('src/api/vendor/solutions/index.js');
  ok(/router\.use\('\/domain', require\('\.\/domain'\)\);/.test(idx) && !/router\.get\('\/domain'/.test(idx) && !/router\.get\('\/domain\/search'/.test(idx), '5.8 the two stubs are retired; domain.js is mounted');
  const svc = read('src/lib/domains/service.js');
  ok((read('src/api/vendor/solutions/domain.js').match(/requireAuth, resolveVendor\(\)/g) || []).length === 4 && !/from\('vendor_domains'\)/.test(read('src/api/vendor/solutions/domain.js')) && !/from\('vendor_domains'\)/.test(ix) && /const TABLE = 'vendor_domains'/.test(svc), '5.9 four doors each behind requireAuth then resolveVendor(); one writer: only service.js names the table');

  sec('6  mutations, each reverted in memory');
  const SF = require(P('src/api/vendor/solutions/storefront.js'));
  ok(SF.storefrontUrl('DEV440') === 'https://dev440.thedreamwedding.in' && SF.storefrontUrl('demo') === 'https://thedreamwedding.in/v/demo' && SF.storefrontUrl('a_b') === 'https://thedreamwedding.in/v/a_b', '5.10 the QR encodes her short address (the pwa shape rule); reserved or odd handles keep /v/');
  ok(pricing.sellPaise(62500, 18) !== 68800, '6.1 GST dropped from the rule would give Rs 688: 1.1 catches it');
  const mSvc = svc.replace("if (row.registrar_order_id) return { ok: true, already: true, row };", '');
  ok(!/already: true/.test(mSvc), '6.2 the already-bought refusal removed: 3.13 would buy twice');
  const mIx = ix.replace("normalized.event === 'payment_link.paid'", "normalized.event === 'payment.captured'");
  ok(!/payment_link\.paid/.test(mIx), '6.3 the hook on another event: 5.5 reddens');
  const mMig = mig.replace('GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_domains TO service_role;', '');
  ok(!/TO service_role/.test(mMig), '6.4 the grant removed: 5.4 reddens (F-44.169\'s shape)');
  const mMigR = mig.replace('ALTER TABLE public.vendor_domains ENABLE ROW LEVEL SECURITY;\n', '');
  ok(!/ENABLE ROW LEVEL SECURITY/.test(mMigR), '6.4b the RLS line removed: 5.4b reddens (the defect the chair caught)');
  const mSvc3 = svc.replace("if (existing.orderId) orderId = existing.orderId;", '');
  ok(!/if \(existing\.orderId\) orderId = existing\.orderId;/.test(mSvc3), '6.6 the adopt-before-rebuy removed: 3b.4 would buy a lost order twice');
  const mSvc2 = svc.replace("if (Number(amountPaise) < Number(row.price_paise)) return { ok: false, reason: 'paid less than the price' };", '');
  ok(!/paid less than the price/.test(mSvc2), '6.5 the underpayment guard removed: 3.9 would buy on Rs 10');

  console.log(`\nb146 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b146 crashed:', e); process.exit(2); });
