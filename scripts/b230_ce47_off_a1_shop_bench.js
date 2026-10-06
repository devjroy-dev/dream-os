'use strict';
// scripts/b230_ce47_off_a1_shop_bench.js · CE-47 · OFF-A1 · THE OFF-SEASON SHOP'S RUNG.
// Drives src/lib/shop/shop.js and gate.js against an in-memory double (scripts/lib/b230_fake_sb.js), reads 0204 and the wiring,
// and runs production-code mutations in memory (Module._compile on a mutated copy of shop.js; no file is ever written).
// Clock: B230_NOW (an ISO instant) shifts "now" for every cell; production derives "today" in India the same way (istDate).
//   node scripts/b230_ce47_off_a1_shop_bench.js
//   B230_NOW=2026-12-31T19:00:00Z node scripts/b230_ce47_off_a1_shop_bench.js     (the year turns in India)
const fs = require('fs'); const path = require('path'); const Module = require('module');
const ROOT = path.join(__dirname, '..');
const read = (r) => { try { return fs.readFileSync(path.join(ROOT, r), 'utf8'); } catch (_e) { return ''; } };
const { makeDb } = require('./lib/b230_fake_sb');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const NOW = process.env.B230_NOW ? Date.parse(process.env.B230_NOW) : Date.now();
if (!Number.isFinite(NOW)) { console.log('B230_NOW is not an instant'); process.exit(1); }
const DAY = 864e5;
const SHOP_SRC = read('src/lib/shop/shop.js');
function loadShop(src) { const f = path.join(ROOT, 'src/lib/shop/shop.js'); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }

const V = '00000000-0000-0000-0000-0000000000v1'.replace('v1', 'a1');
function fixtures(S) {
  const ist = (ms) => S.istDate(ms);
  return {
    voucher: { kind: 'voucher', name: 'Makeup trial voucher', price: 3000, valid_months: 12, voucher_for: 'One makeup trial', includes: ['One look', 'Lashes'] },
    workshop: { kind: 'workshop', name: 'Party makeup masterclass', price: 4500, starts_at: new Date(NOW + 20 * DAY).toISOString(), place: 'Lajpat Nagar', seats_total: 3 },
    klass: { kind: 'class', name: 'Self makeup online class', price: 2500, class_dates: [ist(NOW + 10 * DAY)] },
    booking: { kind: 'booking', name: 'Engagement look', price: 18000, occasion: 'engagement', hours: 3, lead_days: 7 },
    ist,
  };
}

async function suite(S, label) {
  const F = fixtures(S); const res = {};
  const db = makeDb({ capabilities: [] });
  const vendor = { id: V, user_id: 'u1' };
  const saved = {};
  for (const k of ['voucher', 'workshop', 'klass', 'booking']) { const r = await S.saveItem(db, V, null, F[k], NOW); saved[k] = r.body.item; res[`save_${k}`] = r.status; }
  // a workshop with 3 seats: an asked order of 2 holds 2; a 2nd asking 2 is refused (only 1 left); after the hold ends, seats return
  const alerts = [];
  const o1 = await S.placeOrder(db, vendor, { slug: saved.workshop.slug, name: 'Riya Sethi', phone_e164: '+919811022334', qty: 2 }, { now: () => new Date(NOW), alert: (a) => alerts.push(a.text) });
  const o2 = await S.placeOrder(db, vendor, { slug: saved.workshop.slug, name: 'Neha Arora', phone_e164: '+919811022335', qty: 2 }, { now: () => new Date(NOW) });
  const leftNow = (await S.publicItems(db, V, NOW)).find((i) => i.slug === saved.workshop.slug).seats_left;
  const leftLater = (await S.publicItems(db, V, NOW + S.HOLD_MS + 1000)).find((i) => i.slug === saved.workshop.slug).seats_left;
  Object.assign(res, { o1, o2, leftNow, leftLater, alerts });
  // mark the first paid twice and a second workshop order paid: the workshop goes on her Calendar once
  const writes = []; const writeEvent = async (_sb, p) => { writes.push(p); return { ok: true, event: { id: `ev-${writes.length}` } }; };
  res.mp1 = await S.markPaid(db, V, o1.body.order_id, { nowMs: NOW, writeEvent });
  res.mp1again = await S.markPaid(db, V, o1.body.order_id, { nowMs: NOW, writeEvent });
  const o3 = await S.placeOrder(db, vendor, { slug: saved.workshop.slug, name: 'Pooja Bansal', phone_e164: '+919811022336', qty: 1 }, { now: () => new Date(NOW) });
  res.o3 = o3; res.mp3 = await S.markPaid(db, V, o3.body.order_id, { nowMs: NOW, writeEvent });
  res.workshopWrites = writes.length;
  res.soldOut = await S.placeOrder(db, vendor, { slug: saved.workshop.slug, name: 'Sana Qureshi', phone_e164: '+919811022337', qty: 1 }, { now: () => new Date(NOW) });
  // a voucher: code, valid until; check, redeem once
  const ov = await S.placeOrder(db, vendor, { slug: saved.voucher.slug, name: 'Ananya Gupta', phone_e164: '+919811022338' }, { now: () => new Date(NOW) });
  res.ov = ov; res.mpv = await S.markPaid(db, V, ov.body.order_id, { nowMs: NOW, writeEvent });
  const code = res.mpv.body.voucher && res.mpv.body.voucher.code;
  res.code = code;
  res.check = await S.checkCode(db, V, code ? code.toLowerCase().replace('-', '') : 'x', NOW);
  res.red1 = await S.redeem(db, V, code, 'Trial done', NOW);
  res.red2 = await S.redeem(db, V, code, null, NOW);
  res.badShape = await S.checkCode(db, V, 'K0QM-4XPA', NOW);
  // a booking: an enquiry born booked, source 'shop', on her Calendar through the writer with force
  const tooSoon = await S.placeOrder(db, vendor, { slug: saved.booking.slug, name: 'Kavya Malhotra', phone_e164: '+919811022339', wanted_date: F.ist(NOW + 2 * DAY) }, { now: () => new Date(NOW) });
  const ob = await S.placeOrder(db, vendor, { slug: saved.booking.slug, name: 'Kavya Malhotra', phone_e164: '+919811022339', wanted_date: F.ist(NOW + 30 * DAY) }, { now: () => new Date(NOW) });
  const before = writes.length;
  res.tooSoon = tooSoon; res.ob = ob; res.mpb = await S.markPaid(db, V, ob.body.order_id, { nowMs: NOW, writeEvent });
  res.bookingWrite = writes[before];
  res.lead = db.t.leads && db.t.leads[0];
  // a refusal from the writer (a blocked day): the order is paid, no entry, her sentence comes back
  const refuse = async () => ({ ok: false, conflict: { message: 'You have blocked this day.' } });
  const ob2 = await S.placeOrder(db, vendor, { slug: saved.booking.slug, name: 'Isha Rao', phone_e164: '+919811022340', wanted_date: F.ist(NOW + 40 * DAY) }, { now: () => new Date(NOW) });
  res.mpb2 = await S.markPaid(db, V, ob2.body.order_id, { nowMs: NOW, writeEvent: refuse });
  res.ob2row = db.t.shop_orders.find((o) => o.id === ob2.body.order_id);
  // with INS's link: a pay_url and no notice
  const alerts2 = [];
  res.withLink = await S.placeOrder(db, vendor, { slug: saved.klass.slug, name: 'Tanvi Arora', phone_e164: '+919811022341', wanted_date: F.ist(NOW + 10 * DAY) },
    { now: () => new Date(NOW), alert: (a) => alerts2.push(a), paymentLink: async () => 'https://rzp.io/l/example' });
  res.alerts2 = alerts2;
  const kl = await S.saveItem(db, V, null, { ...F.klass, name: 'Live online class', class_link: 'https://meet.google.com/abc-defg-hij' }, NOW);
  const okl = await S.placeOrder(db, vendor, { slug: kl.body.item.slug, name: 'Meera Joshi', phone_e164: '+919811022342', wanted_date: F.ist(NOW + 10 * DAY) }, { now: () => new Date(NOW) });
  res.mpk = await S.markPaid(db, V, okl.body.order_id, { nowMs: NOW, writeEvent });
  res.pubClass = (await S.publicItems(db, V, NOW)).find((i) => i.slug === kl.body.item.slug);
  res.cancelPaid = await S.cancelOrder(db, V, o1.body.order_id, NOW);
  res.db = db; res.saved = saved;
  return res;
}

(async () => {
  const S = loadShop(SHOP_SRC);
  const F = fixtures(S);
  console.log(`b230 · now ${new Date(NOW).toISOString()} (India ${S.istDate(NOW)})`);

  sec('1  0204, read');
  const M = read('db/migrations/0204_off_season_shop.sql'); const code = M.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(() => ['shop_items', 'shop_orders', 'shop_vouchers'].every((t) => new RegExp(`CREATE TABLE public\\.${t} \\(`).test(code) && new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;`).test(code)
    && new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t} TO service_role;`).test(code)), '1.1 three tables, RLS on each, the four privileges to service_role');
  ok(() => /pg_get_constraintdef\(oid\) LIKE '%cover\|looks\|collections%'/.test(code) && /\|faq\|enquire\|shop\|custom-/.test(code), "1.2 the section key CHECK is found by what it says and re-added with 'shop'");
  ok(() => /events_kind_check[\s\S]*'other', 'shop'\]/.test(code), "1.3 events.kind widened by 'shop' (fork (a))");
  ok(() => /\('flag\.off_shop', 'flag', 'off'\)/.test(code) && (code.match(/INSERT INTO/g) || []).length === 1 && !/\bUPDATE public\.|\bDELETE FROM\b/.test(code), "1.4 flag.off_shop seeded 'off'; no existing row written");
  ok(() => code.includes(`code ~ '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$'`) && S.CODE_RE.source === '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$', '1.5 the code CHECK and the library pattern are the same bytes');
  ok(() => { const o = JSON.parse(read('db/migrations/OUT_OF_ORDER.json')); return o.register.some((r) => r.number === 204); }, '1.6 the out-of-order register carries 0204 (it lands below 0212 and 0214)');

  sec('2  an item, field by field');
  const c = (b) => S.checkItem(b, NOW);
  ok(() => ['voucher', 'workshop', 'klass', 'booking'].every((k) => c(F[k]).ok), '2.1 a good item of each kind passes');
  ok(() => c({ ...F.voucher, valid_months: undefined }).field === 'valid_months', '2.2 a voucher needs its months');
  ok(() => c({ ...F.workshop, starts_at: new Date(NOW - 60000).toISOString() }).field === 'starts_at', '2.3 a workshop cannot start in the past');
  ok(() => c({ ...F.workshop, place: '' }).field === 'place' && c({ ...F.workshop, place: '', online: true }).ok, '2.4 a workshop needs a place, unless it is online');
  ok(() => c({ ...F.booking, occasion: 'wedding' }).field === 'occasion', '2.5 a booking needs an occasion other than the wedding day');
  ok(() => c({ ...F.voucher, includes: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }).field === 'includes' && c({ ...F.voucher, price: 0 }).field === 'price', '2.6 seven included lines, or a price of 0, are refused');
  ok(() => c({ ...F.klass, class_dates: [S.istDate(NOW - DAY)] }).field === 'class_dates' && c({ ...F.klass, class_dates: [] }).ok, '2.7 a class date in the past is refused; no dates means On request');
  ok(() => Object.values(S.LINES).every((l) => !/\b(bride|couple)s?\b/i.test(l) && !/\u2014/.test(l)), '2.8 no line she or a buyer reads says bride or couple, or has a long dash');
  // OFF-A1b (R1 reversed, 7 October 2026): her class link, https only, only on an online class or online workshop.
  ok(() => c({ ...F.klass, class_link: 'https://meet.google.com/abc-defg-hij' }).ok.class_link === 'https://meet.google.com/abc-defg-hij'
    && c({ ...F.workshop, online: true, place: '', class_link: 'https://zoom.us/j/123' }).ok.class_link === 'https://zoom.us/j/123', '2.9 a class link saves on an online class and an online workshop');
  ok(() => c({ ...F.klass, class_link: 'http://zoom.us/j/1' }).field === 'class_link' && c({ ...F.klass, class_link: 'javascript:alert(1)' }).field === 'class_link'
    && c({ ...F.workshop, class_link: 'https://zoom.us/j/1' }).field === 'class_link' && c({ ...F.voucher, class_link: 'https://zoom.us/j/1' }).field === 'class_link', '2.10 refused: http, javascript:, an in-person workshop, a voucher');
  ok(() => !/class_link/.test(SHOP_SRC.slice(SHOP_SRC.indexOf('const PUBLIC_COLS'), SHOP_SRC.indexOf('\n', SHOP_SRC.indexOf('const PUBLIC_COLS')))) && /class_link/.test(read('db/migrations/0205_shop_class_link.sql')), '2.11 the public side never selects the class link (0205 adds the column)');

  sec('3  codes and dates');
  const codes = Array.from({ length: 3000 }, () => S.newCode());
  ok(() => codes.every((x) => S.CODE_RE.test(x)) && !codes.some((x) => /[01OI]/.test(x)), '3.1 3,000 codes: all XXXX-XXXX, none with 0, O, 1 or I');
  ok(() => new Set(codes.join('').replace(/-/g, '')).size === 32, '3.2 every one of the 32 letters and digits appears');
  ok(() => S.validUntil(Date.parse('2026-01-31T06:00:00Z'), 1) === '2026-02-28' && S.validUntil(Date.parse('2028-02-29T06:00:00Z'), 12) === '2029-02-28' && S.validUntil(Date.parse('2026-12-31T19:00:00Z'), 12) === '2028-01-01',
    '3.3 valid until: 31 January plus a month is 28 February; 29 February 2028 plus a year is 28 February 2029; 12:30 am India on 1 January counts as 1 January');
  ok(() => S.rs(380000) === 'Rs 3,80,000' && S.rs(3000) === 'Rs 3,000' && S.dateWords('2026-12-14') === '14 December 2026', '3.4 money as Rs 3,80,000; dates in full months');

  const R = await suite(S, 'live');
  sec('4  seats and orders');
  ok(() => R.save_voucher === 200 && R.save_workshop === 200 && R.save_klass === 200 && R.save_booking === 200, '4.1 four items saved');
  ok(() => R.o1.status === 200 && R.o1.body.state === 'asked' && R.o1.body.pay_url === null, '4.2 without a payment link, an order is asked and carries no pay link');
  ok(() => R.o2.status === 409 && R.o2.body.field === 'qty', '4.3 three seats, two held: asking two more is refused (one left)');
  ok(() => R.leftNow === 1 && R.leftLater === 3, '4.4 a held seat counts until its 24 hours end, then returns');
  ok(() => R.alerts.length === 1 && /^New shop order on your website from Riya Sethi, \+919811022334: Party makeup masterclass, 2 seats, Rs 9,000\.$/.test(R.alerts[0]), '4.5 her notice, word for word', R.alerts[0]);
  ok(() => R.soldOut.status === 409 && R.soldOut.body.error === S.LINES.soldOut, '4.6 two paid and one paid: sold out, said plainly');
  ok(() => R.tooSoon.status === 400 && R.tooSoon.body.field === 'wanted_date', '4.7 a booking inside her days-ahead is refused');
  ok(() => R.withLink.body.pay_url === 'https://rzp.io/l/example' && R.alerts2.length === 0, "4.8 with INS's link: the buyer gets the link and no 'asked' notice goes to her");

  sec('5  mark paid');
  ok(() => R.mp1.status === 200 && R.mp1again.body.already === true, '5.1 mark paid, and a second tap changes nothing');
  ok(() => R.workshopWrites === 1 && R.mp3.body.event_id === R.mp1.body.event_id, '5.2 a workshop goes on her Calendar once, not once per seat');
  ok(() => /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(R.code || '') && R.mpv.body.voucher.valid_until === S.validUntil(NOW, 12), '5.3 a paid voucher gets its code, valid twelve months');
  ok(() => R.lead && R.lead.state === 'booked' && R.lead.source === 'shop' && R.lead.phone === '+919811022339' && R.mpb.body.lead_id === R.lead.id, "5.4 a paid booking is an enquiry born booked, source 'shop' (Q4)");
  ok(() => R.bookingWrite && R.bookingWrite.kind === 'shop' && R.bookingWrite.force === true && R.bookingWrite.linked_lead_id === R.lead.id && R.bookingWrite.event_date === F.ist(NOW + 30 * DAY), "5.5 its date goes through the one writer: kind 'shop', forced, linked to the enquiry");
  ok(() => R.ob2row.state === 'paid' && R.mpb2.body.event_id === null && /^Marked paid\. .+ was not added to your calendar: You have blocked this day\.$/.test(R.mpb2.body.calendar_line), "5.6 the writer refuses (a blocked day): paid, no entry, and the writer's own sentence", R.mpb2.body.calendar_line);
  ok(() => R.db.t.shop_vouchers.length === 1 && (R.db.t.leads || []).length === 2, '5.7 vouchers and seats make no enquiry; two bookings, two enquiries');
  ok(() => R.cancelPaid.status === 422, '5.8 a paid order cannot be cancelled from the shop');
  ok(() => R.mpk.body.class_link === 'https://meet.google.com/abc-defg-hij' && R.pubClass && !('class_link' in R.pubClass) && !JSON.stringify(R.pubClass).includes('meet.google'), '5.10 a paid online class returns its link; the public item never carries it');
  ok(() => R.mpv.body.class_link === null && R.mp1.body.class_link === null, '5.9 a voucher and an in-person workshop carry no class link when paid');

  sec('6  vouchers');
  ok(() => R.check.status === 200 && R.check.body.voucher.state === 'valid' && /Paid Rs 3,000 on .+ · Valid until /.test(R.check.body.voucher.line), '6.1 a code typed in small letters without the dash is found and reads valid');
  ok(() => R.red1.status === 200 && R.red2.status === 422 && R.red2.body.error === S.LINES.redeemed, '6.2 redeemed once; a second try says it has been used');
  ok(() => R.badShape.status === 400, '6.3 a code with a 0 is refused by its shape, before any read');

  sec('7  the switch');
  const { shopOpen } = require(path.join(ROOT, 'src/lib/shop/gate.js'));
  const cap = (status) => ({ get: async () => (status ? { status } : null) });
  const g = [await shopOpen(V, { capApi: cap('on'), env: {} }), await shopOpen(V, { capApi: cap('armed'), env: { OFF_WALK_VENDOR_ID: V } }), await shopOpen('x', { capApi: cap('armed'), env: { OFF_WALK_VENDOR_ID: V } }), await shopOpen(V, { capApi: cap('off'), env: {} }), await shopOpen(V, { capApi: { get: async () => { throw new Error('down'); } }, env: {} })];
  ok(() => JSON.stringify(g) === '[true,true,false,false,false]', "7.1 on opens; armed only for the walk vendor; off, or a failed read, stays shut", JSON.stringify(g));

  sec('8  wiring and the writer');
  ok(() => /router\.use\('\/shop', require\('\.\/shop'\)\);/.test(read('src/api/vendor/solutions/index.js')) && /router\.use\('\/public\/shop', require\('\.\/public\/shop'\)\);/.test(read('src/api/router.js')), '8.1 the room door and the public door are mounted');
  ok(() => require(path.join(ROOT, 'src/lib/pwaPaths.js')).vendorPath('shop') === '/vendor/off-season-shop', "8.2 her notice opens the room's address");
  ok(() => /require\('\.\.\/vendor\/eventWrite'\)\.writeEvent/.test(SHOP_SRC) && !/from\('events'\)/.test(SHOP_SRC), '8.3 the shop writes her Calendar only through eventWrite, never a raw events insert');
  ok(() => require(path.join(ROOT, 'src/lib/vendor/eventWrite.js')).CALENDAR_KINDS.includes('shop') && require(path.join(ROOT, 'src/lib/vendor/occupancy.js')).isOccupying('shop'), "8.4 'shop' is in the writer's vocabulary and occupies the day (fork (a))");
  ok(() => /'other', 'shop'\]/.test(read('src/api/vendor-engine/cabinet.js')) && /'other', 'shop'\]/.test(read('src/api/vendor-engine/chat.js')), "8.5 'shop' is in both BOOKED_KINDS");
  ok(() => /W\.originAllowed\(sb, vendor, req\.get\('origin'\)\)/.test(read('src/api/public/shop.js')) && /W\.limiter\.hit\(`shop:vp:/.test(read('src/api/public/shop.js')), "8.6 the public order door keeps the website's origin rule and a per-phone limit");

  sec('9  mutations of production code (in memory; the file on disk is never touched)');
  const MUT = [
    ['m1 a held seat never counts', "(o.state === 'asked' && o.hold_until && Date.parse(o.hold_until) > nowMs)", 'false', (r) => r.o2.status === 409 && r.leftNow === 1],
    ['m2 redeem forgets it was used (both guards: the read and the write filter)', [["    if (r.voucher.redeemed_at) return { status: 422, body: { ok: false, error: LINES.redeemed } };\n", ''], [".eq('id', r.voucher.id).eq('vendor_id', vendorId).is('redeemed_at', null)", ".eq('id', r.voucher.id).eq('vendor_id', vendorId)"]], null, (r) => r.red2.status === 422],
    ['m3 the workshop entry per seat', "    if (item.kind === 'workshop' && !item.event_id) {", "    if (item.kind === 'workshop') {", (r) => r.workshopWrites === 1],
    ['m4 a booking born new, not booked', "source: 'shop', state: 'booked',", "source: 'shop', state: 'new',", (r) => r.lead && r.lead.state === 'booked'],
    ['m5 the writer asked without force', "kind: 'shop', linked_lead_id: leadId || undefined, force: true });", "kind: 'shop', linked_lead_id: leadId || undefined, force: false });", (r) => r.bookingWrite && r.bookingWrite.force === true],
    ['m6 the public side selects AND returns the class link (both guards gone)', [["const PUBLIC_COLS = 'id, kind, name, slug, photo_url,", "const PUBLIC_COLS = 'id, kind, name, slug, class_link, photo_url,"], ["return { kind: i.kind, name: i.name, slug: i.slug,", "return { class_link: i.class_link, kind: i.kind, name: i.name, slug: i.slug,"]], null, (r) => r.pubClass && !('class_link' in r.pubClass)],
  ];
  for (const [name, from, to, cell] of MUT) {
    const pairs = Array.isArray(from) ? from : [[from, to]];
    if (!pairs.every(([a]) => SHOP_SRC.split(a).length === 2)) { ok(false, `9 ${name}: the mutation's anchor is gone or not unique`); continue; }
    let reds = false;
    try {
      const Sm = loadShop(pairs.reduce((src, [a, b]) => src.replace(a, b), SHOP_SRC)); const r = await suite(Sm, name);
      reds = !cell(r);
    } catch (_e) { reds = true; }
    ok(reds, `9 ${name}: its cell reds`);
  }

  console.log(`\nb230_ce47_off_a1_shop_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(failed.map((f) => '  - ' + f).join('\n')); process.exit(1); }
})().catch((e) => { console.log('b230 threw:', e && e.stack); process.exit(1); });
