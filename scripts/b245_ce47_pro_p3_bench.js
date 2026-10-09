#!/usr/bin/env node
// scripts/b245_ce47_pro_p3_bench.js · CE-47 · PRO · P3, server half: 0210, Brand collaborations (brand rows, pitch
// limits, the pitch, the tracker, her kit), the public kit door, the "pitched brand" door for ELZ-4, the Trend room
// (the floor, the counts, the Monday drafts, approval and the 9:00 am showing), the admin doors, the cron line, the
// mounts, and R-47.1's server lines.
// No network, no database: 0210 is read as text; rules run on values; the doors run through a fake store inside real
// express apps on local ports, and the kit's privacy is read off the RAW response body. THE EXIT CODE IS THE VERDICT.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0; const failed = [];
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 240) + ']'}`); } };
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (sql) => sql.replace(/--[^\n]*/g, '');
const SENT = (s) => /^[A-Z0-9"“(].*[.?!]$/.test(String(s).trim()) && !/—|–/.test(s) && !/\b(couple|bride)s?\b/i.test(s);

// ── a fake store: enough of supabase-js's builder for brands, kit, trends; 0210's pitch function in JS ──
function store(seed) {
  const T = JSON.parse(JSON.stringify(seed)); let n = 0; const log = []; const failOn = {};
  const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  const UNIQUE = { pro_brands: ['instagram_handle'], pro_kits: ['vendor_id'] };
  function from(name) {
    const f = []; let op = 'select'; let patch = null; let ins = null; let one = null; let lim = null; const ords = []; let cols = '*'; let head = false; let rng = null; let upOn = null;
    const b = {
      select(c, o) { cols = c || '*'; if (o && o.head) head = true; return b; },
      eq(k, v) { f.push((r) => r[k] === v); return b; }, neq(k, v) { f.push((r) => r[k] !== v); return b; },
      in(k, vs) { f.push((r) => vs.includes(r[k])); return b; }, ilike(k, v) { f.push((r) => String(r[k]).toLowerCase() === String(v).toLowerCase()); return b; },
      is(k, v) { f.push((r) => (r[k] ?? null) === v); return b; }, lt(k, v) { f.push((r) => r[k] < v); return b; }, gt(k, v) { f.push((r) => r[k] > v); return b; },
      gte(k, v) { f.push((r) => r[k] >= v); return b; }, lte(k, v) { f.push((r) => r[k] <= v); return b; },
      order(k, o) { ords.push([k, o && o.ascending === false ? -1 : 1]); return b; }, limit(x) { lim = x; return b; }, range(a, z) { rng = [a, z]; return b; },
      insert(row) { op = 'insert'; ins = row; return b; }, update(p) { op = 'update'; patch = p; return b; }, upsert(row, o) { op = 'upsert'; ins = row; upOn = (o && o.onConflict) || 'id'; return b; },
      single() { one = 'single'; return b; }, maybeSingle() { one = 'maybe'; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    const pick = (r) => { if (cols === '*' || !cols) return { ...r }; const o = {}; for (const c of cols.split(',').map((x) => x.trim()).filter(Boolean)) o[c] = r[c] === undefined ? null : r[c]; return o; };
    function run() {
      log.push([op, name]);
      if (failOn[name]) return { data: null, error: { message: 'down' } };
      const t = (T[name] = T[name] || []);
      if (op === 'insert' || op === 'upsert') {
        if (op === 'upsert') { const ex = t.find((r) => r[upOn] === ins[upOn]); if (ex) { Object.assign(ex, ins); const d = pick(ex); return { data: one ? d : [d], error: null }; } }
        for (const k of (UNIQUE[name] || [])) if (t.some((r) => r[k] === ins[k])) return { data: null, error: { code: '23505', message: 'duplicate' } };
        const row = { id: uuid(), created_at: new Date().toISOString(), ...ins }; t.push(row); const d = pick(row); return { data: one ? d : [d], error: null };
      }
      let rows = t.filter((r) => f.every((g) => g(r)));
      if (op === 'update') { for (const r of rows) Object.assign(r, patch); const d = rows.map(pick); return { data: one ? d[0] || null : d, error: null }; }
      if (head) return { data: null, count: rows.length, error: null };
      for (const [k, d] of ords.slice().reverse()) rows = rows.slice().sort((a, c) => (a[k] < c[k] ? -d : a[k] > c[k] ? d : 0));
      if (rng) rows = rows.slice(rng[0], rng[1] + 1);
      if (lim) rows = rows.slice(0, lim);
      rows = rows.map(pick);
      if (one) return { data: rows[0] || null, error: one === 'single' && !rows[0] ? { message: 'none' } : null };
      return { data: rows, error: null };
    }
    return b;
  }
  async function rpc(fn, a) {
    log.push(['rpc', fn, a]);
    if (fn !== 'pro_pitch_record') return { data: null, error: { message: 'no such function' } };
    if (!(T.vendors || []).some((v) => v.id === a.p_vendor)) return { data: 'not_found', error: null };
    if (!(T.pro_brands || []).some((x) => x.id === a.p_brand && x.state === 'listed')) return { data: 'not_listed', error: null };
    const mine = (T.pro_pitches = T.pro_pitches || []).filter((p) => p.vendor_id === a.p_vendor);
    if (mine.some((p) => p.brand_id === a.p_brand && p.pitched_at > a.p_month_ago)) return { data: 'brand_30', error: null };
    if (mine.filter((p) => p.pitched_at >= a.p_day_start).length >= 3) return { data: 'day_3', error: null };
    if (mine.filter((p) => p.pitched_at >= a.p_week_start).length >= 10) return { data: 'week_10', error: null };
    T.pro_pitches.push({ id: uuid(), vendor_id: a.p_vendor, brand_id: a.p_brand, channel: a.p_channel, state: 'pitched', post_due: a.p_post_due, note: null, pitched_at: store.NOW ? new Date(store.NOW).toISOString() : new Date().toISOString(), updated_at: new Date().toISOString() });
    return { data: 'recorded', error: null };
  }
  return { from, rpc, T, log, failOn };
}
const listen = async (app) => { const srv = http.createServer(app); await new Promise((r) => srv.listen(0, '127.0.0.1', r)); return srv; };
const call = async (srv, method, p, body, as) => {
  const r = await fetch(`http://127.0.0.1:${srv.address().port}${p}`, { method, headers: { 'content-type': 'application/json', ...(as ? { 'x-as': as } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const raw = await r.text(); let j = null; try { j = JSON.parse(raw); } catch (_e) { j = null; }
  return { status: r.status, raw, j: j && (j.data || j) };
};

(async () => {
  const A = '11111111-1111-4111-8111-111111111111', Bv = '22222222-2222-4222-8222-222222222222';
  const BR = { lumen: 'aaaaaaaa-0000-4000-8000-000000000001', kesari: 'aaaaaaaa-0000-4000-8000-000000000002', rangrez: 'aaaaaaaa-0000-4000-8000-000000000003', hidden: 'aaaaaaaa-0000-4000-8000-000000000004', lens: 'aaaaaaaa-0000-4000-8000-000000000005' };
  for (let i = 6; i <= 20; i += 1) BR['x' + i] = `aaaaaaaa-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`;

  console.log('\n── 1  0210: brands, pitches, kits, trend briefs ──');
  const m = rd('db/migrations/0210_pro_brands_trends.sql'); const s = strip(m);
  const R = require(path.join(ROOT, 'src/lib/brands/rules.js'));
  ok(/^BEGIN;/m.test(m) && /^COMMIT;/m.test(m), '1.1 0210 is one transaction');
  const tables = [...s.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)].map((x) => x[1]);
  ok(JSON.stringify(tables) === '["pro_brands","pro_pitches","pro_kits","pro_trend_briefs"]', '1.2 four new tables, nothing else created', JSON.stringify(tables));
  ok(tables.every((t) => new RegExp(`ALTER TABLE public\\.${t}\\s+ENABLE ROW LEVEL SECURITY`).test(s) && new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t}\\s+TO service_role;`).test(s)), '1.3 each: RLS on, then the four grants to service_role');
  ok(!/\bTO\s+[^;]*\b(anon|authenticated)\b/i.test(s.replace(/REVOKE[^;]*;/g, '')), '1.4 nothing granted to anon or authenticated');
  const SIG = 'public.pro_pitch_record(uuid, uuid, text, date, timestamptz, timestamptz, timestamptz)';
  ok(s.includes(`REVOKE ALL ON FUNCTION ${SIG} FROM PUBLIC, anon, authenticated;`) && s.includes(`GRANT EXECUTE ON FUNCTION ${SIG} TO service_role;`) && !/SECURITY DEFINER|search_path/i.test(s), '1.5 the pitch function runs for service_role only, as its caller, with no search_path');
  ok(/FROM public\.vendors WHERE id = p_vendor FOR UPDATE/.test(s) && /n_day >= 3/.test(s) && /n_week >= 10/.test(s) && /pitched_at > p_month_ago/.test(s) && R.DAY_LIMIT === 3 && R.WEEK_LIMIT === 10 && R.SAME_BRAND_DAYS === 30,
    '1.6 the function locks her row, then refuses a 4th pitch in a day, an 11th in a week, and the same brand within 30 days (the chair’s limits)');
  ok(/INSERT INTO public\.pro_pitches/.test(s) && !/INSERT INTO public\.pro_pitches/.test(rd('src/lib/brands/brands.js')) && !/from\('pro_pitches'\)\.insert/.test(rd('src/lib/brands/brands.js')), '1.7 a pitch row is added only by the function; brands.js never inserts one');
  ok(/instagram_handle\s+text\s+NOT NULL/.test(s) && /source_url\s+text\s+NOT NULL/.test(s) && /checked_on\s+date\s+NOT NULL/.test(s), '1.8 a brand row cannot exist without its Instagram handle, its source page and the day it was checked');
  const tr = (s.match(/trades <@ ARRAY\[([^\]]+)\]/) || [])[1] || ''; const tt = (s.match(/trade\s+text\s+NOT NULL CHECK \(trade IN \(([^)]+)\)\)/) || [])[1] || '';
  const list = (x) => [...x.matchAll(/'([a-z_]+)'/g)].map((y) => y[1]).join();
  ok(list(tr) === R.TRADES.join() && list(tt) === R.TRADES.join(), '1.9 the trades in 0210 are rules.js’s trades, in both tables', `${list(tr)} | ${list(tt)}`);
  ok(/UNIQUE \(trade, city, week_start\)/.test(s) && /extract\(isodow FROM week_start\) = 1/.test(s) && /state IN \('draft', 'approved', 'withheld'\)/.test(s), '1.10 one brief per trade, city and week; a week starts on a Monday; draft, approved or withheld');
  ok(!/ALTER TABLE public\.(?!pro_brands|pro_pitches|pro_kits|pro_trend_briefs)/.test(s), '1.11 0210 alters no existing table');

  console.log('\n── 2  the rules (pure) ──');
  const T0 = '2026-10-08';
  const good = { name: "De'Lanci India", trades: ['makeup'], website_url: 'de-lanci.in', instagram_handle: 'https://www.instagram.com/delanci.india/', role_email: 'pr@de-lanci.in', source_url: 'https://de-lanci.in/pages/collaboration-page-for-influencer', checked_on: '2026-10-04', followers_min: '5,000', followers_max: '50000' };
  const g = R.checkBrand(good, T0);
  ok(g.ok && g.row.instagram_handle === 'delanci.india' && g.row.website_url === 'https://de-lanci.in' && g.row.role_email === 'pr@de-lanci.in' && g.row.followers_min === 5000, '2.1 a brand row from the check sheet: the handle from its link, https added, follower numbers read', JSON.stringify(g));
  ok(R.checkBrand({ ...good, role_email: 'priya@de-lanci.in' }, T0).error === 'Keep only a role address, such as pr@ or collab@. A person’s own address is not kept.', '2.2 a person’s email is refused (the chair’s rule)');
  ok(R.checkBrand({ ...good, role_email: 'pr@gmail.com' }, T0).error === 'The email must be on the brand’s own website address.', '2.3 a role address on another domain is refused');
  ok(R.checkBrand({ ...good, source_url: 'https://www.instagram.com/delanci.india/' }, T0).error === 'The page where you found these details must be on the brand’s own website.', '2.4 the source page must be on the brand’s own website');
  ok(!R.checkBrand({ ...good, instagram_handle: '' }, T0).ok && !R.checkBrand({ ...good, checked_on: '2026-10-09' }, T0).ok && !R.checkBrand({ ...good, followers_min: 9, followers_max: 5 }, T0).ok && !R.checkBrand({ ...good, trades: ['tailor'] }, T0).ok,
    '2.5 no handle, a future check day, a range upside down, or an unknown trade: refused');
  const sunLate = Date.parse('2026-10-11T23:30:00+05:30'), monEarly = Date.parse('2026-10-12T00:10:00+05:30'), monUtcSun = Date.parse('2026-10-11T19:00:00Z');
  const w1 = R.windows(sunLate), w2 = R.windows(monEarly), w3 = R.windows(monUtcSun);
  ok(w1.weekStart === new Date(Date.parse('2026-10-05T00:00:00+05:30')).toISOString() && w2.weekStart === new Date(Date.parse('2026-10-12T00:00:00+05:30')).toISOString() && w3.day === '2026-10-12'
    && w1.dayStart === new Date(Date.parse('2026-10-11T00:00:00+05:30')).toISOString() && Date.parse(w2.monthAgo) === monEarly - 30 * 86400000,
    '2.6 the day and the week (from Monday) are India’s; Sunday 11:30 pm is still last week, Monday 12:10 am is the new one (also when it is still Sunday in UTC)');
  const txt = R.pitchText({ vendorName: 'Studio Ivara', trade: 'makeup', city: 'New Delhi', weddings: 1400, kitUrl: 'https://thedreamwedding.in/v/dev440/kit', brandName: 'Lumen Cosmetics' });
  ok(txt.startsWith('Hello Lumen Cosmetics team,') && txt.includes('I am writing from Studio Ivara, a makeup business in New Delhi.') && txt.includes('TDW has verified 1,400 weddings of my work.') && txt.includes('https://thedreamwedding.in/v/dev440/kit') && !/—|–|\bcouple|\bbride/i.test(txt),
    '2.7 the pitch TDW writes: her name, trade and city, verified weddings in Indian grouping, her kit link; no dash, no "couple" or "bride"', txt);
  ok(!R.pitchText({ vendorName: 'X', trade: 'other', city: null, weddings: 0, kitUrl: 'k', brandName: 'B' }).includes('verified'), '2.8 with no verified wedding the pitch says nothing about weddings');
  const lumen = { id: BR.lumen, instagram_handle: 'lumen.cosmetics', role_email: 'collab@lumen.in', form_url: null };
  ok(R.channelLink(lumen, 'instagram', txt) === 'https://www.instagram.com/lumen.cosmetics/' && R.channelLink(lumen, 'email', txt).startsWith('mailto:collab@lumen.in?subject=Collaboration%20enquiry&body=Hello%20Lumen') && R.channelLink(lumen, 'form', txt) === null,
    '2.9 where she sends it: the brand’s Instagram, a written email, or no form when the brand has none');
  ok(R.canMove('pitched', 'replied') && R.canMove('replied', 'agreed') && R.canMove('agreed', 'kit_received') && !R.canMove('pitched', 'posted') && !R.canMove('posted', 'pitched') && !R.canMove('declined', 'replied'), '2.10 the tracker moves only forward, one step at a time');
  ok(R.ASCI_LINE === 'If you got this for free or were paid, label the post as an ad or a paid partnership, as ASCI’s rules require.' && !R.needsAsci('replied') && R.needsAsci('agreed') && R.needsAsci('kit_received') && R.needsAsci('posted'),
    '2.11 ASCI’s line, the founder’s words, shows from the moment she agrees to work with a brand');
  const words = [...Object.values(R.RECORD_WORDS).filter(Boolean), ...Object.values(R.SEND_STEP), R.SENT_ASK, ...R.LIMITS_LINE.split(/(?<=\.) /), R.countsLine(2), R.ASCI_LINE];
  ok(words.every(SENT), '2.12 R-47.1: every sentence the rules give her is a complete sentence with a full stop, with no dash and no "couple" or "bride"', JSON.stringify(words.filter((x) => !SENT(x))));
  ok(R.tradeKey('Makeup Artist') === 'makeup' && R.tradeKey('hairstylist') === 'makeup' && R.tradeKey('Photographer') === 'photography' && R.tradeKey('Florist') === 'decor' && R.tradeKey('Choreographer') === 'other', '2.13 her trade from her category; a hairstylist is shown makeup brands');
  ok(R.fits({ trades: ['makeup'], followers_min: 5000, followers_max: 50000 }, 'makeup', null) && !R.fits({ trades: ['makeup'], followers_min: 5000 }, 'makeup', 1200) && !R.fits({ trades: ['jewellery'] }, 'makeup', null), '2.14 a brand fits her trade, and her followers when TDW knows them');

  console.log('\n── 3  her doors (fake store, real express) ──');
  const mw = (x) => path.join(ROOT, 'src/api/middleware', x + '.js');
  require.cache[require.resolve(mw('requireAuth'))] = { exports: (req, _res, next) => next() };
  let S;
  require.cache[require.resolve(mw('resolveVendor'))] = { exports: () => (req, res, next) => { const v = S.T.vendors.find((x) => x.id === req.headers['x-as']); if (!v || v.id !== req.params.vendorId) return res.status(403).json({ error: 'no' }); req.vendor = v; return next(); } };
  const brandRow = (id, name, trades, extra = {}) => ({ id, name, trades, looks_for: null, website_url: `https://${name.toLowerCase().replace(/\s+/g, '')}.in`, instagram_handle: name.toLowerCase().replace(/\s+/g, '.'), role_email: null, form_url: null, source_url: `https://${name.toLowerCase().replace(/\s+/g, '')}.in/about`, followers_min: null, followers_max: null, checked_on: '2026-10-04', state: 'listed', ...extra });
  const seed = () => ({
    vendors: [{ id: A, business_name: 'Studio Ivara', category: 'makeup', city: 'New Delhi', routing_handle: 'DEV440', instagram_handle: 'studio.ivara', status: 'active', discover_paused: false, gstin: '27AAGCB7383J1Z8', upi_id: 'ivara@upi', phone: '+919800000001' },
      { id: Bv, business_name: 'Lens House', category: 'photographer', city: 'Gurugram', routing_handle: 'LENS01', instagram_handle: null, status: 'active', discover_paused: false }],
    pro_brands: [brandRow(BR.lumen, 'Lumen Cosmetics', ['makeup'], { role_email: 'collab@lumencosmetics.in', followers_min: 5000, followers_max: 50000 }), brandRow(BR.kesari, 'Kesari Hair Care', ['makeup']),
      brandRow(BR.rangrez, 'Rangrez Jewels', ['jewellery'], { form_url: 'https://rangrezjewels.in/collab' }), brandRow(BR.hidden, 'Old Brand', ['makeup'], { state: 'hidden' }), brandRow(BR.lens, 'Lens Cap', ['photography']),
      ...Array.from({ length: 15 }, (_x, i) => brandRow(BR['x' + (i + 6)], `Brand ${i + 6}`, ['makeup']))],
    pro_pitches: [], pro_kits: [], invoices: [], events: [], leads: [],
  });
  S = store(seed());
  const express = require('express');
  const app = express(); app.locals.supabase = new Proxy({}, { get: (_t, k) => S[k] });
  app.use('/brands', require(path.join(ROOT, 'src/api/vendor/brands.js')));
  const srv = await listen(app);
  let r = await call(srv, 'GET', `/brands/${A}`, null, A);
  const room = r.j && r.j.room;
  ok(r.status === 200 && room && room.brands.map((b) => b.name).join() === ['Brand 10', 'Brand 11', 'Brand 12', 'Brand 13', 'Brand 14', 'Brand 15', 'Brand 16', 'Brand 17', 'Brand 18', 'Brand 19', 'Brand 20', 'Brand 6', 'Brand 7', 'Brand 8', 'Brand 9', 'Kesari Hair Care', 'Lumen Cosmetics'].join()
    && room.kit.url === 'https://thedreamwedding.in/v/dev440/kit' && room.counts.week === 0 && room.counts.line === 'You have sent 0 of 10 pitches this week.',
    '3.1 the room: brands for her trade only (no jewellery, no photography, no hidden brand), her kit’s address, 0 of 10 this week', JSON.stringify(room && { b: room.brands.map((x) => x.name), k: room.kit, c: room.counts }));
  const lu = room.brands.find((b) => b.name === 'Lumen Cosmetics');
  ok(lu && lu.works_with === 'It works with accounts of 5,000 to 50,000 followers.' && lu.reach === 'You can reach it by Instagram or email.' && lu.checked_line === 'TDW took these details from the brand’s own website on 4 October 2026.' && !('role_email' in lu),
    '3.2 a brand row as she sees it: who it works with, how to reach it, where TDW took the details from and when; the email itself only on the brand’s page', JSON.stringify(lu));
  r = await call(srv, 'GET', `/brands/${A}/brands/${BR.lumen}`, null, A);
  const bd = r.j && r.j.brand;
  ok(r.status === 200 && bd && bd.pitch.includes('Hello Lumen Cosmetics team,') && bd.send.map((x) => x.channel).join() === 'instagram,email' && bd.send[1].link.startsWith('mailto:collab@lumencosmetics.in') && bd.blocked === null && bd.sent_ask === R.SENT_ASK,
    '3.3 one brand: the pitch written for her, Instagram and email to send it by, nothing blocking', JSON.stringify(bd && { s: bd.send.map((x) => x.channel), b: bd.blocked }));
  r = await call(srv, 'GET', `/brands/${A}/brands/${BR.hidden}`, null, A);
  ok(r.status === 404 && r.j.error === 'This brand is not on the list.', '3.4 a hidden brand cannot be opened');
  store.NOW = Date.now();
  r = await call(srv, 'POST', `/brands/${A}/brands/${BR.kesari}/sent`, { channel: 'email' }, A);
  ok(r.status === 400 && r.j.error === 'This brand cannot be reached that way.' && S.T.pro_pitches.length === 0, '3.5 a way the brand cannot be reached is refused, and nothing is counted');
  const sent = [];
  for (const id of [BR.lumen, BR.kesari, BR.x6, BR.x7]) sent.push(await call(srv, 'POST', `/brands/${A}/brands/${id}/sent`, { channel: 'instagram' }, A));
  ok(sent.slice(0, 3).every((x) => x.status === 200) && sent[3].status === 409 && sent[3].j.error === 'You have sent 3 pitches today. You can send more tomorrow.' && S.T.pro_pitches.length === 3 && sent[2].j.counts.week === 3,
    '3.6 three pitches in a day are counted; the fourth is refused in her words and not counted', JSON.stringify(sent.map((x) => [x.status, x.j && (x.j.error || x.j.counts)])));
  r = await call(srv, 'GET', `/brands/${A}/brands/${BR.x7}`, null, A);
  ok(r.j.brand.blocked === 'You have sent 3 pitches today. You can send more tomorrow.', '3.7 a brand page says when today’s limit is reached, before she writes anything');
  // move the three pitches to earlier days of this week, add six more on other days: the 10th is counted, the 11th is not
  const wk = R.windows(Date.now());
  const earlier = (i) => new Date(Math.max(Date.parse(wk.weekStart) + 3600000 * (i + 1), Date.parse(wk.weekStart))).toISOString();
  S.T.pro_pitches.forEach((p, i) => { p.pitched_at = new Date(Date.parse(wk.dayStart) - 60000 * (i + 1)).toISOString(); });
  const dayStartMs = Date.parse(wk.dayStart); const weekStartMs = Date.parse(wk.weekStart);
  if (dayStartMs - weekStartMs >= 86400000) {
    S.T.pro_pitches.forEach((p, i) => { p.pitched_at = earlier(i); });
    for (let i = 0; i < 6; i += 1) S.T.pro_pitches.push({ id: `p-old-${i}`, vendor_id: A, brand_id: BR['x' + (10 + i)], channel: 'instagram', state: 'pitched', post_due: null, pitched_at: earlier(3 + i), updated_at: earlier(3 + i) });
    const tenth = await call(srv, 'POST', `/brands/${A}/brands/${BR.x16}/sent`, { channel: 'instagram' }, A);
    const eleventh = await call(srv, 'POST', `/brands/${A}/brands/${BR.x17}/sent`, { channel: 'instagram' }, A);
    ok(tenth.status === 200 && tenth.j.counts.week === 10 && eleventh.status === 409 && eleventh.j.error === 'You have sent 10 pitches this week. You can send more from Monday.',
      '3.8 the 10th pitch in an India week is counted; the 11th is refused in her words', JSON.stringify([tenth.status, tenth.j && tenth.j.counts, eleventh.j]));
  } else {
    // a Monday: the week holds only today, so the week's limit is read through the rules with a seeded week
    const S8 = store(seed()); const vend = S8.T.vendors[0];
    for (let i = 0; i < 10; i += 1) S8.T.pro_pitches.push({ id: `p${i}`, vendor_id: A, brand_id: BR['x' + (6 + i)], channel: 'instagram', state: 'pitched', pitched_at: new Date(weekStartMs + 60000 * i).toISOString() });
    const BRL = require(path.join(ROOT, 'src/lib/brands/brands.js'));
    const rr = await BRL.record({ supabase: S8, vendor: vend, brandId: BR.lumen, body: { channel: 'instagram' }, now: weekStartMs + 3 * 86400000 });
    ok(!rr.ok && rr.error === 'You have sent 10 pitches this week. You can send more from Monday.', '3.8 the 11th pitch in an India week is refused in her words (seeded on a Monday)', JSON.stringify(rr));
  }
  r = await call(srv, 'GET', `/brands/${A}/brands/${BR.lumen}`, null, A);
  ok(r.j.brand.blocked === 'You pitched this brand in the last 30 days. You can pitch the same brand once in 30 days.' && r.j.brand.last_pitch && r.j.brand.last_pitch.state === 'pitched', '3.9 the same brand within 30 days: the page says so and shows her last pitch');
  const S9 = store(seed()); S9.T.pro_pitches.push({ id: 'p30', vendor_id: A, brand_id: BR.lumen, channel: 'instagram', state: 'pitched', pitched_at: new Date(Date.now() - 29 * 86400000).toISOString() });
  const BRL = require(path.join(ROOT, 'src/lib/brands/brands.js'));
  const r30 = await BRL.record({ supabase: S9, vendor: S9.T.vendors[0], brandId: BR.lumen, body: { channel: 'instagram' } });
  S9.T.pro_pitches[0].pitched_at = new Date(Date.now() - 31 * 86400000).toISOString();
  const r31 = await BRL.record({ supabase: S9, vendor: S9.T.vendors[0], brandId: BR.lumen, body: { channel: 'instagram' } });
  ok(!r30.ok && r30.status === 409 && r30.error === R.RECORD_WORDS.brand_30 && r31.ok, '3.10 the same brand after 29 days is refused; after 31 days it is counted', JSON.stringify([r30, r31.ok]));
  const pid = S.T.pro_pitches.find((p) => p.brand_id === BR.lumen).id;
  const step = async (b) => call(srv, 'POST', `/brands/${A}/pitches/${pid}`, b, A);
  const r1 = await step({ to: 'posted' }); const r2 = await step({ to: 'replied' }); const r3 = await step({ to: 'agreed', post_due: '2020-01-01' });
  const r4 = await step({ to: 'agreed' }); const due = new Date(Date.now() + 5 * 86400000 + 19800000).toISOString().slice(0, 10); const r5 = await step({ post_due: due });
  ok(r1.status === 409 && r1.j.error === 'This pitch cannot move to that step.' && r2.status === 200 && r2.j.pitch.state === 'replied' && r2.j.pitch.asci === null
    && r3.status === 400 && r3.j.error === 'Pick the day the post is due. It cannot be a day that has passed.' && r4.status === 200 && r5.status === 200
    && r5.j.pitch.pill.text === 'Post due' && r5.j.pitch.asci === R.ASCI_LINE && r5.j.pitch.line === `You and the brand agreed to work together. The post is due on ${R.fullDate(due)}.`,
    '3.11 the tracker: no skipping a step; replied; a past due date refused; agreed with a due date shows "Post due", its sentence and ASCI’s line', JSON.stringify([r1.status, r2.status, r3.j, r4.status, r5.j]));
  r = await call(srv, 'POST', `/brands/${Bv}/pitches/${pid}`, { to: 'posted' }, Bv);
  ok(r.status === 404 && r.j.error === 'That pitch is not in your account.', '3.12 another vendor cannot touch her pitch');
  const k1 = await call(srv, 'POST', `/brands/${A}/kit`, { contact_email: 'not an email' }, A); const k2 = await call(srv, 'POST', `/brands/${A}/kit`, { contact_email: 'Hello@StudioIvara.in' }, A);
  ok(k1.status === 400 && k1.j.error === 'Type your email address in full, for example hello@yourstudio.in.' && k2.status === 200 && k2.j.kit.contact_email === 'hello@studioivara.in', '3.13 her kit’s email: refused when it is not an address, saved in lower case when it is');
  S = store({ vendors: seed().vendors, pro_brands: [], pro_pitches: [], pro_kits: [] });
  r = await call(srv, 'GET', `/brands/${A}`, null, A);
  ok(r.status === 200 && r.j.room.brands.length === 0 && r.j.room.pitches.length === 0 && r.j.room.kit.weddings === 0, '3.14 an empty list: the room still answers, with no brands and no pitches');
  S.failOn.pro_brands = true; r = await call(srv, 'GET', `/brands/${A}`, null, A);
  ok(r.status === 500 && r.j.error === 'TDW could not read your brands just now. Please try again.', '3.15 a store that cannot be read: one sentence, no crash');
  srv.close();

  console.log('\n── 4  the public kit door: named fields only ──');
  const K = require(path.join(ROOT, 'src/lib/brands/kit.js'));
  // AMENDED BY LABEL, CE-47 WEB-4 cut 30 (R-47.2; the chair: "the kit shows what her own pages show (not 'held')"): the
  // second row is HELD by the safety check, the one picture the kit withholds now.
  const SK = store({ ...seed(), vendor_portfolio: [{ vendor_id: A, image_url: 'https://res.cloudinary.com/tdw/a.jpg', caption: 'Bridal look', is_hero: true, position: 0, approval_state: 'approved', safety_state: 'passed', created_at: '2026-01-01', rejection_reason: null },
    { vendor_id: A, image_url: 'https://res.cloudinary.com/tdw/b.jpg', caption: null, is_hero: false, position: 1, approval_state: 'rejected', safety_state: 'held', created_at: '2026-01-02', rejection_reason: 'blurry' }],
  vendor_testimonials: [{ vendor_id: A, author: 'Ananya', body: 'She understood my face in ten minutes.', place: 'Udaipur', position: 0, state: 'approved', deleted_at: null }, { vendor_id: A, author: 'Hidden', body: 'Not approved.', place: null, position: 1, state: 'pending', deleted_at: null }],
  pro_kits: [{ vendor_id: A, contact_email: 'hello@studioivara.in', followers: null, followers_on: null }] });
  let reads = 0; const deps = { readFollowers: async () => { reads += 1; return 8420; } };
  const appK = express(); appK.locals.supabase = SK;
  const kitForReal = K.kitFor; require.cache[require.resolve(path.join(ROOT, 'src/lib/brands/kit.js'))].exports.kitFor = (a) => kitForReal({ ...a, deps });
  delete require.cache[require.resolve(path.join(ROOT, 'src/api/public/kit.js'))];
  appK.use('/kit', require(path.join(ROOT, 'src/api/public/kit.js')));
  const srvK = await listen(appK);
  r = await call(srvK, 'GET', '/kit/dev440');
  const kit = r.j && r.j.kit;
  ok(r.status === 200 && kit && Object.keys(kit).sort().join() === 'city,code,contact,followers,followers_on,footer,name,photos,trade,weddings,words' && Object.keys(kit.contact).sort().join() === 'email,email_link,instagram_url',
    '4.1 the kit’s shape is the named allowlist, field by field', JSON.stringify(kit && Object.keys(kit)));
  ok(!/27AAGCB7383J1Z8|ivara@upi|\+9198|rejection|blurry|Not approved|"id"|vendor_id/.test(r.raw), '4.2 the raw body holds no GSTIN, UPI, phone, rejected photo, unapproved words or row id', r.raw.slice(0, 200));
  ok(kit.photos.length === 1 && kit.words.length === 1 && kit.followers === 8420 && kit.contact.email_link === 'mailto:hello@studioivara.in?subject=Collaboration%20enquiry' && kit.contact.instagram_url === 'https://www.instagram.com/studio.ivara/' && kit.weddings === 0,
    '4.3 photos that are not held (R-47.2) and approved words only; followers read through her own connection; her chosen email and her Instagram', JSON.stringify(kit));
  const today = new Date(Date.now() + 19800000).toISOString().slice(0, 10);
  ok(JSON.stringify(kit.footer) === JSON.stringify(['Weddings are counted by TDW from bookings with an invoice and a payment recorded in TDW.', `Followers as of ${R.fullDate(today)}.`]) && kit.footer.every(SENT), '4.4 the footer: the founder’s weddings line, then "Followers as of <date>." (no Google reviews are read yet)', JSON.stringify(kit.footer));
  await call(srvK, 'GET', '/kit/DEV440');
  ok(reads === 1 && SK.T.pro_kits[0].followers === 8420 && SK.T.pro_kits[0].followers_on === today, '4.5 followers are read at most once an India day, and kept with the date');
  SK.T.vendors[0].discover_paused = true; const p1 = await call(srvK, 'GET', '/kit/dev440'); SK.T.vendors[0].discover_paused = false; SK.T.vendors[1].status = 'paused';
  const p2 = await call(srvK, 'GET', '/kit/lens01'); const p3 = await call(srvK, 'GET', '/kit/nobody'); const p4 = await call(srvK, 'GET', '/kit/' + encodeURIComponent('a b;'));
  ok([p1, p2, p3, p4].every((x) => x.status === 404 && x.j.error === 'This media kit is not available.'), '4.6 a paused, inactive, unknown or malformed code: 404 in one sentence');
  const nk = await kitForReal({ supabase: store({ ...seed(), vendor_portfolio: [], vendor_testimonials: [], pro_kits: [] }), code: 'dev440', deps: { readFollowers: async () => null } });
  ok(nk && nk.followers === null && JSON.stringify(nk.footer) === JSON.stringify(['Weddings are counted by TDW from bookings with an invoice and a payment recorded in TDW.']) && nk.contact.email === null, '4.7 no Instagram connection and no email: no followers line, no email button');
  srvK.close();

  console.log('\n── 5  the "pitched brand" door for ELZ-4 ──');
  const PB = require(path.join(ROOT, 'src/lib/brands/pitched.js'));
  const SP = store({ ...seed(), pro_pitches: [{ id: 'q1', vendor_id: A, brand_id: BR.lumen, channel: 'instagram', state: 'pitched', pitched_at: new Date(Date.now() - 40 * 86400000).toISOString() },
    { id: 'q2', vendor_id: A, brand_id: BR.kesari, channel: 'instagram', state: 'pitched', pitched_at: new Date(Date.now() - 400 * 86400000).toISOString() }] });
  const h1 = await PB.isPitchedBrand({ supabase: SP, vendorId: A, sender: { ig_username: '@Lumen.Cosmetics' } });
  const h2 = await PB.isPitchedBrand({ supabase: SP, vendorId: A, sender: { email: 'COLLAB@lumencosmetics.in' } });
  const h3 = await PB.isPitchedBrand({ supabase: SP, vendorId: A, sender: { ig_username: 'kesari.hair.care' } });
  const h4 = await PB.isPitchedBrand({ supabase: SP, vendorId: Bv, sender: { ig_username: 'lumen.cosmetics' } });
  const h5 = await PB.isPitchedBrand({ supabase: SP, vendorId: A, sender: { ig_username: 'a.client' } });
  ok(h1.brand && h1.brand_name === 'Lumen Cosmetics' && h1.label === 'Brand' && h2.brand && !h3.brand && !h4.brand && !h5.brand,
    '5.1 a brand she pitched is known by its Instagram handle or role email (any case, with or without @); one pitched over a year ago, another vendor’s brand, or a client is not', JSON.stringify([h1, h2, h3, h4, h5]));
  SP.failOn.pro_pitches = true; let threw = false; let h6;
  try { h6 = await PB.isPitchedBrand({ supabase: SP, vendorId: A, sender: { ig_username: 'lumen.cosmetics' } }); } catch (_e) { threw = true; }
  ok(!threw && h6.brand === false && h6.error === 'pro_pitches' && Object.keys(h1).sort().join() === 'brand,brand_id,brand_name,label', '5.2 a failed read never throws and never blocks a client’s reply; the door returns nothing about the pitch itself');

  console.log('\n── 6  the Trend room ──');
  const TB = require(path.join(ROOT, 'src/lib/trends/build.js'));
  const V = {}; for (let i = 0; i < 6; i += 1) V[`v${i}`] = { category: 'makeup', city: i < 5 ? ' new  delhi ' : 'Gurugram' };
  V.p1 = { category: 'photographer', city: 'New Delhi' };
  const lead = (vid, msg, date, lo, hi) => ({ vendor_id: vid, raw_message: msg, vendor_summary: null, event_types: null, wedding_date: date, budget_min: lo, budget_max: hi });
  const L = [];
  const msgs = ['Need HD makeup and soft glam for the sangeet', 'HD makeup please, dewy finish', 'soft-glam look with hd   makeup', 'Looking for HD makeup', 'dewy skin, soft glam', 'HD-makeup for reception', 'natural look', 'airbrush', 'soft glam', 'dewy and HD makeup', 'priya 9876543210 HD makeup'];
  msgs.forEach((x, i) => L.push(lead(`v${i % 3}`, x, i < 6 ? '2026-11-20' : i < 9 ? '2027-02-14' : '2026-12-01', i < 7 ? 25000 : 60000, i < 7 ? 50000 : 80000)));
  const out = TB.build({ leads: L, vendors: V });
  const dl = out.find((x) => x.trade === 'makeup' && x.city === 'New Delhi');
  ok(out.length === 1 && dl && dl.counts.enquiries === 11 && dl.counts.vendors === 3, '6.1 eleven enquiries to three makeup vendors in New Delhi make one brief (city spacing and case folded)', JSON.stringify(out.map((x) => [x.trade, x.city, x.counts.enquiries])));
  ok(JSON.stringify(dl.counts.terms) === JSON.stringify([{ term: 'HD makeup', count: 7 }, { term: 'soft glam', count: 4 }, { term: 'dewy', count: 3 }]) && JSON.stringify(dl.counts.months) === JSON.stringify(['November', 'February']) && dl.counts.budget === 'Rs 25,000 to Rs 50,000',
    '6.2 the counts: words three or more enquiries share, the two most asked months, the most common budget band in Rs', JSON.stringify(dl.counts));
  ok(!/priya|9876|sangeet|reception|v0|v1|v2/i.test(JSON.stringify(out)), '6.3 no name, phone, message or vendor leaves the brief: counts, months and a band only');
  ok(TB.build({ leads: L.slice(0, 9), vendors: V }).length === 0 && TB.build({ leads: L.map((x) => ({ ...x, vendor_id: x.vendor_id === 'v2' ? 'v1' : x.vendor_id })), vendors: V }).length === 0,
    '6.4 the floor: 9 enquiries, or 11 enquiries to only 2 vendors, make no brief (the chair’s 10 across 3)');
  const lines = TB.lines({ ...dl, week_start: '2026-09-28' });
  ok(lines[0] === 'TDW vendors in New Delhi received 11 enquiries for makeup in the week of 28 September 2026.' && lines[1] === 'These enquiries went to 3 vendors.' && lines[2] === 'Clients most often asked for HD makeup (7 enquiries), soft glam (4 enquiries) and dewy (3 enquiries).'
    && lines.every(SENT) && SENT(TB.NOTE) && SENT(TB.MADE_LINE), '6.5 R-47.1: the brief is told in complete sentences, one idea each', JSON.stringify(lines));
  const wb = TB.weekBounds('2026-09-28');
  ok(wb.from === '2026-09-27T18:30:00.000Z' && wb.to === '2026-10-04T18:30:00.000Z' && wb.showFrom === '2026-10-05T03:30:00.000Z' && TB.lastWeekStart(Date.parse('2026-10-05T01:10:00+05:30')) === '2026-09-28' && TB.lastWeekStart(Date.parse('2026-10-04T23:59:00+05:30')) === '2026-09-21',
    '6.6 the week is Monday to Sunday in India; it shows from the next Monday at 9:00 am India time; Monday 01:10 am counts the week just ended');
  const TS = require(path.join(ROOT, 'src/lib/trends/trends.js'));
  const created = (i) => new Date(Date.parse('2026-09-28T10:00:00+05:30') + i * 3600000).toISOString();
  const ST = store({ leads: L.map((x, i) => ({ ...x, created_at: created(i), deleted_at: null })).concat([{ ...L[0], created_at: '2026-10-05T10:00:00+05:30', deleted_at: null }]),
    vendors: Object.entries(V).map(([id, v]) => ({ id, ...v, status: 'active' })), pro_trend_briefs: [] });
  const mk = await TS.makeWeek({ supabase: ST, weekStart: '2026-09-28' });
  ok(mk.ok && mk.made === 1 && ST.T.pro_trend_briefs.length === 1 && ST.T.pro_trend_briefs[0].state === 'draft' && ST.T.pro_trend_briefs[0].counts.enquiries === 11, '6.7 Monday’s count saves one draft for the week (a lead from the next week is not counted)', JSON.stringify(mk));
  ST.T.pro_trend_briefs[0].state = 'approved'; const mk2 = await TS.makeWeek({ supabase: ST, weekStart: '2026-09-28' });
  ok(mk2.kept === 1 && mk2.made === 0, '6.8 a brief already approved is never rewritten');
  const me = { id: 'v0', category: 'Makeup artist', city: 'New Delhi' };
  const before = await TS.room({ supabase: ST, vendor: me, now: Date.parse('2026-10-05T08:59:00+05:30') });
  const after = await TS.room({ supabase: ST, vendor: me, now: Date.parse('2026-10-05T09:00:00+05:30') });
  const other = await TS.room({ supabase: ST, vendor: { id: 'p1', category: 'Photographer', city: 'New Delhi' }, now: Date.parse('2026-10-06T09:00:00+05:30') });
  ok(before.room.brief === null && SENT(before.room.empty) && after.room.brief && after.room.brief.head === 'Makeup in New Delhi, week of 28 September 2026.' && other.room.brief === null,
    '6.9 she sees an approved brief from Monday 9:00 am, not at 8:59 am; a photographer in the same city does not see the makeup brief', JSON.stringify([before.room, after.room.brief && after.room.brief.head]));
  const wkx = await TS.week({ supabase: ST, vendor: { id: 'g', category: 'makeup', city: 'Gurugram' }, briefId: ST.T.pro_trend_briefs[0].id, now: Date.now() });
  ok(!wkx.ok && wkx.status === 404, '6.10 a brief for another city cannot be opened by id');
  ok(!TS.checkNews([{ line: 'A brand launched a range.', source_url: 'http://x.in' }]).ok && !TS.checkNews([{ line: 'No full stop here at all', source_url: 'https://x.in' }]).ok && !TS.checkNews([1, 2, 3, 4].map(() => ({ line: 'A brand launched a range.', source_url: 'https://x.in' }))).ok
    && TS.checkNews([{ line: 'A large beauty brand launched a foundation range in 40 shades.', source_url: 'https://news.example/a' }]).ok, '6.11 news lines: up to three, each a sentence with a full stop and an https source');
  const dec = await TS.adminDecide({ supabase: ST, id: ST.T.pro_trend_briefs[0].id, body: { state: 'withheld', news: [] }, who: 'Dev' });
  ok(dec.ok && ST.T.pro_trend_briefs[0].state === 'withheld' && ST.T.pro_trend_briefs[0].decided_by === 'Dev' && (await TS.room({ supabase: ST, vendor: me, now: Date.parse('2026-10-06T09:00:00+05:30') })).room.brief === null, '6.12 a withheld brief is never shown');
  const nocity = await TS.room({ supabase: ST, vendor: { id: 'v9', category: 'makeup', city: '' }, now: Date.now() });
  ok(nocity.ok && nocity.room.brief === null && nocity.room.empty === 'Add your city in Settings. TDW then shows the brief for your trade in your city.', '6.13 no city: one sentence on what to do');

  console.log('\n── 7  admin: More > Brands ──');
  require.cache[require.resolve(path.join(ROOT, 'src/api/admin/requireAdmin.js'))] = { exports: (req, _res, next) => { req.admin = { name: 'Dev' }; next(); } };
  const SA = store(seed()); const appA = express(); appA.locals.supabase = SA;
  appA.use('/admin/brands', require(path.join(ROOT, 'src/api/admin/brands.js')));
  const srvA = await listen(appA);
  const c1 = await call(srvA, 'POST', '/admin/brands', good); const c2 = await call(srvA, 'POST', '/admin/brands', { ...good, role_email: 'priya@de-lanci.in' }); const c3 = await call(srvA, 'POST', '/admin/brands', good);
  ok(c1.status === 200 && c1.j.brand.instagram_handle === 'delanci.india' && SA.T.pro_brands.find((b) => b.instagram_handle === 'delanci.india').created_by === 'Dev' && c2.status === 400 && c3.status === 409 && c3.j.error === 'A brand with this Instagram handle is already on the list.',
    '7.1 a brand is added; a person’s email is refused; the same handle twice is refused', JSON.stringify([c1.status, c2.j, c3.j]));
  const hid = await call(srvA, 'POST', `/admin/brands/${BR.lumen}/state`, { state: 'hidden' });
  const ls = await call(srvA, 'GET', '/admin/brands');
  ok(hid.status === 200 && SA.T.pro_brands.find((b) => b.id === BR.lumen).state === 'hidden' && ls.j.brands.length === SA.T.pro_brands.length && ls.j.trades.length === 7, '7.2 a brand is hidden; the admin list shows every brand with the trades to choose from');
  srvA.close();

  console.log('\n── 8  the cron line and the mounts ──');
  const cron = rd('src/cron.js'); const at = cron.indexOf("cron.schedule('10 1 * * 1'");
  const blk = cron.slice(at, at + 600);
  ok(at > 0 && /makeWeek\(\{ supabase, weekStart: lastWeekStart\(Date\.now\(\)\) \}\)/.test(blk) && /timezone: 'Asia\/Kolkata'/.test(blk) && (cron.match(/cron\.schedule\('10 /g) || []).length === 1, '8.1 Monday 01:10 am India time counts the week just ended; :10 is used by no other job');
  const router = rd('src/api/router.js');
  const iAdmin = router.indexOf("router.use('/admin',"); const iB = router.indexOf("router.use('/admin/brands'"); const iT = router.indexOf("router.use('/admin/trends'");
  ok(/router\.use\('\/public\/kit',\s+require\('\.\/public\/kit'\)\)/.test(router) && iB > 0 && iT > 0 && iB < iAdmin && iT < iAdmin, '8.2 the kit door is public; the two admin doors are mounted above the broad /admin mount');
  const core = rd('src/api/vendor/core.js');
  ok(/router\.use\('\/brands',\s+require\('\.\/brands'\)\)/.test(core) && /router\.use\('\/trends',\s+require\('\.\/trends'\)\)/.test(core) && !/kit/.test(core), '8.3 her two rooms’ doors sit under vendor/core.js; the public kit does not');

  console.log('\n── 9  R-47.1: the server lines that reach Supplies and Business papers ──');
  const NEWW = [
    ['src/lib/gear/rules.js', 'Type the item’s name in 2 to 80 letters.', 'Name the item in 2 to 80 letters.'],
    ['src/lib/gear/rules.js', 'The first day you picked has passed. Pick today or a later day.', 'Pick a day from today on.'],
    ['src/lib/gear/rules.js', 'You can ask for an item up to one year ahead.', 'Ask no more than a year ahead.'],
    ['src/lib/gear/gear.js', 'You cannot ask for your own item.', 'This item is yours.'],
    ['src/lib/bills/bills.js', 'TDW could not start the upload. Please try again in a minute.', 'The upload could not start.'],
    ['src/lib/bills/bills.js', 'The figures on the bill do not add up. Check them and try again.', '\'Check the bill’s figures.\''],
    ['src/lib/bills/parse.js', 'The seller’s GSTIN is not a valid number. Check it against the bill and correct it, or leave the box empty.', 'does not check out'],
    ['src/lib/bills/parse.js', 'TDW cannot record GST at 40% yet. Add this bill in Expenses without the GST.', 'a 40% bill yet;'],
    ['src/lib/bills/parse.js', 'The total on the bill is ${rs(amount)}. Check the three figures.', 'not the total'],
    ['src/lib/papers/render.js', 'This pack holds her own records from TDW for her CA.', 'Her own records from TDW for her CA:'],
    ['src/lib/papers/render.js', 'There are no invoices, expenses or TDS entries in this period.', '\'No invoices, expenses or TDS entries in this period.\''],
    ['src/api/public/check.js', 'There have been too many tries from this connection. Please try again in an hour.', '\'Too many tries.'],
    ['src/lib/bills/bills.js', 'You have not added this bill yet. TDW deletes it in ', 'Not added yet. TDW deletes'],
  ];
  const bad9 = NEWW.filter(([f, n, o]) => { const t = rd(f); return !t.includes(n) || t.includes(o); });
  ok(bad9.length === 0, '9.1 each rewritten server line is in its file, and its old words are gone', JSON.stringify(bad9.map((x) => x[1].slice(0, 40))));
  const P = require(path.join(ROOT, 'src/lib/bills/parse.js'));
  const c4 = P.check({ amount: 4300, taxable_value: 3600, cgst: 324, sgst: 324 }, { today: '2026-10-08' });
  ok(!c4.ok && c4.problems.includes('The value before GST (Rs 3,600) and the GST (Rs 648) add up to Rs 4,248. The total on the bill is Rs 4,300. Check the three figures.') && c4.problems.every(SENT), '9.2 a bill whose figures do not add up is told in two sentences, in the form’s own words', JSON.stringify(c4.problems));

  console.log(`\nb245 · ${pass} PASS · ${fail} FAIL`);
  if (fail) console.log('FAILED: ' + failed.join(' | '));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log(`  FAIL  the run  [${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e}]`); console.log(`\nb245 · ${pass} PASS · ${fail + 1} FAIL`); process.exit(1); });
