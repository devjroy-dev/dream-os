// scripts/b200_ce47_web4_cut7_bench.js
// TDW · CE-47 · WEB-4 cut 7 · b200 — §1 the canonical is her own subdomain · §2 site.trade.row · §3 the room: the reviews
// label, palette swatches, GET /collections, the credit handle lookup · §4 door 1 (the enquiry) · §5 door 2 (the chat) ·
// §6 the engine's website hunks · §7 her reply reaches WhatsApp by the approved path (the window) · §8 mutations, run ·
// §9 every column written and read is real. Red on a tree without the cut.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r, src) { try { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src === undefined ? read(r) : src, P(r)); return m.exports; } catch { return null; } }
const { makeStore } = require('./lib/b196_store');
for (const m of ['src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js']) {
  try { const k = require.resolve(P(m)); require.cache[k] = { id: k, filename: k, loaded: true, exports: m.endsWith('resolveVendor.js') ? () => (q, r, n) => n() : (q, r, n) => n() }; } catch { /* */ }
}

(async () => {
  const SC = load('src/lib/site/siteCard.js'); const SM = load('src/lib/site/siteModel.js');
  sec('1  the canonical is her own subdomain (the founder)');
  const c1 = SC && SC.siteCard({ tier: 'signature', handle: 'DEV440', category: 'makeup', liveDomain: 'aarohi.in', siteRow: { style: 'noir' } });
  const c2 = SC && SC.siteCard({ tier: 'essential', handle: 'Ab-12', category: 'makeup', siteRow: { style: 'noir' } });
  ok(() => c1.site.seo.canonical === 'https://dev440.thedreamwedding.in' && c2.site.seo.canonical === 'https://ab-12.thedreamwedding.in', '1.1 https://<handle>.thedreamwedding.in, lowercased, even when she has her own linked domain');
  ok(() => !/\/v\//.test(read('src/lib/site/siteCard.js').split('\n').filter((l) => /canonical =/.test(l)).join('')), '1.2 never /v/<handle>');

  sec('2  site.trade.row (WEB-5\'s shape)');
  const rows = ['makeup', 'photography', 'performer', 'decor'].map((c) => SM && SM.resolveSite({ tier: 'essential', category: c, site: { style: 'noir' } }).trade.row);
  ok(() => rows.every((r) => ['looks', 'work', 'acts', 'events'].includes(r)) && rows[1] === 'work' && rows[2] === 'acts', '2.1 one of looks, work, acts, events, by her trade', rows.join(','));
  ok(() => c1.site.trade.row === 'looks', '2.2 it rides the card');

  sec('3  her room (WEB-6\'s asks, and the reviews label)');
  const express = require('express'); const SITE = load('src/api/vendor/solutions/site.js'); const SR = load('src/api/vendor/solutions/siteRoom.js');
  const V = (id, tier, x) => Object.assign({ id, business_name: 'Studio ' + id, category: 'makeup', routing_handle: id.toUpperCase(), status: 'active', discover_paused: false, tier, rate_display: true, rate_min: 40000 }, x || {});
  const st = makeStore({ vendors: [V('sig1', 'signature'), V('ess1', 'essential'), V('gone1', 'signature', { status: 'inactive' }), V('paus1', 'signature', { discover_paused: true })],
    vendor_collections: [{ id: 'c1', vendor_id: 'sig1', slug: 'winter', name: 'Winter', position: 0, deleted_at: null }, { id: 'c2', vendor_id: 'ess1', slug: 'x', name: 'X', position: 0, deleted_at: null }],
    vendor_collection_looks: [{ collection_id: 'c1', look_id: 'l2', position: 1 }, { collection_id: 'c1', look_id: 'l1', position: 0 }] });
  const app = express(); app.use(express.json()); app.locals.supabase = st; let who = null; app.use((q, r, n) => { q.vendor = who; n(); }); if (SITE) app.use('/site', SITE);
  const srv = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
  const get = (p, as) => new Promise((res) => { who = as; http.get(`http://127.0.0.1:${srv.address().port}${p}`, (rs) => { let b = ''; rs.on('data', (d) => (b += d)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: rs.statusCode, body: j, raw: b }); }); }); });
  const ven = (id) => st.tables.vendors.find((x) => x.id === id);
  ok(() => SR && SR.changesOf({}, [], [], { sections: [{ key: 'reviews', shown: false }] })[0].line === 'Client reviews section changed', '3.1 her change line reads "Client reviews section changed"');
  const room = await get('/site/room', ven('sig1'));
  const pal = room.body && room.body.room.styles[0].palettes[0];
  ok(() => pal && /^#[0-9a-f]{6}$/i.test(pal.swatch.ground) && pal.swatch.ink && pal.swatch.accent && JSON.stringify(Object.keys(pal.swatch)) === '["ground","ink","accent"]', '3.2 room.styles[].palettes[].swatch { ground, ink, accent }');
  const cols = await get('/site/collections', ven('sig1'));
  ok(() => cols.status === 200 && cols.body.collections.length === 1 && JSON.stringify(cols.body.collections[0].look_ids) === '["l1","l2"]' && cols.body.collections_open === true, '3.3 GET /collections: hers only, looks in her order');
  const ok1 = await get('/site/credit-lookup?handle=@ess1', ven('sig1')); const g = await get('/site/credit-lookup?handle=GONE1', ven('sig1')); const p = await get('/site/credit-lookup?handle=paus1', ven('sig1')); const n = await get('/site/credit-lookup?handle=nobody', ven('sig1'));
  ok(() => ok1.status === 200 && JSON.stringify(ok1.body.vendor) === JSON.stringify({ id: 'ess1', business_name: 'Studio ess1', handle: 'ess1' }), '3.4 the credit lookup: an active vendor by handle gives id, name and handle, nothing more');
  ok(() => ok1.status === 200 && g.status === 404 && p.status === 404 && n.status === 404 && g.raw === n.raw, '3.5 inactive, paused and unknown read the same 404');
  await new Promise((r) => srv.close(r));


  // ── WEB-7's two doors, over HTTP, with their deps replaced (no model, no WhatsApp) ─────────────────────────────────────
  const W = load('src/lib/website/enquiry.js'); const T = load('src/lib/website/turn.js');
  const VEN = (id, x) => Object.assign({ id, user_id: 'u-' + id, business_name: 'Studio ' + id, category: 'makeup', routing_handle: id.toUpperCase(), status: 'active',
    discover_paused: false, tier: 'signature', enquiry_routing: null, enquiry_phone: null, reply_quiet_minutes: 120 }, x || {});
  const caps = { 'flag.website_chat': 'on', 'flag.website_eliza': 'on' };
  const capApi = { get: async (k) => (caps[k] ? { key: k, status: caps[k] } : null) };
  const notices = []; const turns = [];
  let turnImpl = async (a) => ({ reply: 'Hello Riya, thank you for writing. Which city is the wedding in?', toolCalls: [], stoodIn: false });
  const mkDeps = () => ({ capApi, env: { WEBSITE_WALK_VENDOR_ID: 'walk1' },
    ensureCoupleRow: async () => ({ user_id: 'uc1', couple_id: 'c1' }),
    sendVendorEnquiryAlert: async (x) => { notices.push(x); return { sent: true }; },
    engine: load('src/agent/noticeHead.js') || { enquiryHead: () => '' },
    runTurn: async (a) => { turns.push(a); return turnImpl(a); },
    splitText: (load('src/lib/ownNumber/send.js') || { splitText: (t) => [t] }).splitText,
    leadsLink: 'https://thedreamwedding.in/vendor/leads', enquireLinkFor: () => 'https://wa.me/917982159047?text=TDW-SIG1',
    notFoundBody: { ok: false, error: 'Not found.' } });
  const st2 = makeStore({ vendors: [VEN('sig1'), VEN('ess1', { tier: 'essential' }), VEN('paus1', { discover_paused: true }), VEN('gone1', { status: 'inactive' }), VEN('walk1')],
    users: [{ id: 'u-sig1', name: 'Aarohi', phone: '+919999988888' }],
    vendor_domains: [{ vendor_id: 'sig1', domain: 'aarohi.in', status: 'live', deleted_at: null }] });
  const app2 = express(); app2.use(express.json()); app2.locals.supabase = st2; app2.set('trust proxy', true);
  app2.post('/e/:code', async (q, r) => { const o = W ? await W.fileEnquiry({ sb: st2, req: q, code: q.params.code, body: q.body }, mkDeps()) : { status: 500, body: {} }; r.status(o.status).json(o.body); });
  app2.post('/c/:code', async (q, r) => { const o = T ? await T.chatTurn({ sb: st2, req: q, code: q.params.code, body: q.body }, mkDeps()) : { status: 500, body: {} }; r.status(o.status).json(o.body); });
  const srv2 = await new Promise((r) => { const x = app2.listen(0, '127.0.0.1', () => r(x)); });
  const post = (p, body, o) => new Promise((res) => { const opt = o || {};
    const rq = http.request(`http://127.0.0.1:${srv2.address().port}${p}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: opt.origin === undefined ? 'https://sig1.thedreamwedding.in' : opt.origin, 'x-forwarded-for': opt.ip || '203.0.113.9' } }, (rs) => {
      let b = ''; rs.on('data', (dd) => (b += dd)); rs.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: rs.statusCode, body: j, raw: b }); }); });
    rq.on('error', () => res({ status: 0, raw: '' })); rq.write(JSON.stringify(body)); rq.end(); });
  const today = W ? W.indiaToday() : '2026-10-01'; const yr = Number(today.slice(0, 4));
  const good = (x) => Object.assign({ name: 'Riya Mehra', country: 'IN', phone_e164: '+919876543210', occasion: 'Wedding', date: `${yr}-12-12`, page: { kind: 'look', title: 'The Emerald Bride' }, consent: true, consent_version: 'enq-2026-09-30' }, x || {});

  sec('4  door 1 · the enquiry (WEB-7\'s contract)');
  const e1 = await post('/e/sig1', good());
  const lead = (st2.tables.leads || [])[0]; const thr = (st2.tables.conversations || [])[0]; const inRow = (st2.tables.messages || [])[0]; const tok = (st2.tables.website_chat_tokens || [])[0];
  ok(() => e1.status === 200 && e1.body.ok === true && /^[A-Za-z0-9_-]{43}$/.test(e1.body.chat_token), '4.1 200 { ok, chat_token }: 43 characters of base64url');
  ok(() => tok && tok.token_hash === W.sha(e1.body.chat_token) && !JSON.stringify(st2.tables).includes(e1.body.chat_token) && tok.phone === '+919876543210' && tok.page_title === 'The Emerald Bride' && Date.parse(tok.expires_at) - Date.parse(tok.created_at) === 86400000, '4.2 only the token\'s sha256 is stored, bound to vendor, phone and thread, 24 hours');
  ok(() => thr && thr.kind === 'couple_thread' && thr.counterparty_phone === '+919876543210' && thr.vendor_id === 'sig1', '4.3 the thread is the WhatsApp lane\'s own (couple_thread by phone), so a later WhatsApp threads with it');
  ok(() => lead && lead.source === 'website' && lead.name === 'Riya Mehra' && JSON.stringify(lead.event_types) === '["Wedding"]' && lead.wedding_date === `${yr}-12-12` && lead.wedding_date_precision === 'day' && lead.consent_text_version === 'enq-2026-09-30' && lead.consent_at, '4.4 the lead: source website, name, phone, occasion, date, consent time and version');
  ok(() => inRow && inRow.channel === 'website' && inRow.direction === 'inbound' && inRow.body === `Website enquiry: Wedding, 12 December ${yr}, from The Emerald Bride.`, '4.5 the thread\'s first row, word for word (line c)', inRow && inRow.body);
  ok(() => notices.length === 1 && notices[0].text === `New enquiry from Riya Mehra on your website: Wedding, 12 December ${yr}` && notices[0].toPhone === '+919999988888' && notices[0].channel === 'website', '4.6 ONE vendor notice through the engine\'s head, "your website" (line d)', notices[0] && notices[0].text);
  const e2 = await post('/e/sig1', good({ occasion: 'Engagement', date: undefined }), { ip: '203.0.113.10' });
  ok(() => e2.status === 200 && st2.tables.leads.length === 1 && st2.tables.leads[0].event_types[0] === 'Engagement' && notices.length === 1, '4.7 again within 7 days: the open lead gains the facts; no second lead, no second notice');
  const v = async (x, f) => { const r = await post('/e/sig1', good(x), { ip: '198.51.100.' + Math.floor(Math.random() * 200) }); return r.status === 400 && r.body.field === f ? r.body.error : 'status ' + r.status + ' ' + r.raw; };
  const lines = [await v({ name: ' ' }, 'name'), await v({ phone_e164: '+91512345678' }, 'phone'), await v({ country: 'US', phone_e164: '+4412345678' }, 'phone'), await v({ occasion: '' }, 'occasion'), await v({ date: '2020-01-01' }, 'date'), await v({ date: `${yr + 4}-01-01` }, 'date'), await v({ consent: 'yes' }, 'consent')];
  ok(() => JSON.stringify(lines) === JSON.stringify(['Please add your name.', 'Please add a 10-digit mobile number.', 'Please add your mobile number.', 'Please choose the occasion.', 'Please choose a date from today on.', 'Please choose a date from today on.', 'Please send again to agree to the line above Send.']), '4.8 one plain line per field (name, +91, other codes, occasion, date past and 3 years on, consent)', JSON.stringify(lines));
  ok(() => W.phoneFor('US', '+14155550123').ok && W.phoneFor('AE', '+971501234567').ok && !W.phoneFor('US', '+914155550123').ok && !W.phoneFor('ZZ', '+14155550123').ok && W.phoneFor('IN', '+919876543210').ok && !W.phoneFor('IN', '+915876543210').ok, '4.9 the phone is checked against its country (IN: +91 then 6-9 and nine digits)');
  ok(() => !W.checkEnquiry(good({ date: today })).error && W.checkEnquiry(good({ date: today }), Date.parse(today + 'T00:00:00Z') - 330 * 60000 - 60000).ok, '4.10 today in India is allowed (the day starts at 00:00 IST)');
  const misses = await Promise.all([post('/e/nobody', good()), post('/e/paus1', good()), post('/e/gone1', good()), post('/e/sig1', good(), { origin: 'https://evil.example' }), post('/e/sig1', good(), { origin: '' })]);
  caps['flag.website_chat'] = 'off'; const off = await post('/e/sig1', good(), { ip: '192.0.2.1' }); caps['flag.website_chat'] = 'on';
  ok(() => [...misses, off].every((m) => m.status === 404) && new Set([...misses, off].map((m) => m.raw)).size === 1, '4.11 every miss is the one 404 body (unknown, paused, inactive, bad Origin, no Origin, website off)');
  const own = await post('/e/sig1', good({ phone_e164: '+919876500001' }), { origin: 'https://www.aarohi.in', ip: '192.0.2.2' }); const apex = await post('/e/sig1', good({ phone_e164: '+919876500002' }), { origin: 'https://thedreamwedding.in', ip: '192.0.2.3' });
  ok(() => own.status === 200 && apex.status === 200, '4.12 her verified domain (with www.) and thedreamwedding.in are allowed Origins');
  caps['flag.website_chat'] = 'armed'; const armedOther = await post('/e/sig1', good({ phone_e164: '+919876500003' }), { ip: '192.0.2.4' }); const armedWalk = await post('/e/walk1', good({ phone_e164: '+919876500004' }), { origin: 'https://walk1.thedreamwedding.in', ip: '192.0.2.5' }); caps['flag.website_chat'] = 'on';
  ok(() => armedOther.status === 404 && armedWalk.status === 200, '4.13 armed: open for the walk vendor only');
  let last = null; for (let i = 0; i < 11; i += 1) last = await post('/e/sig1', good({ name: '' }), { ip: '10.1.1.1' });
  ok(() => last.status === 429 && last.body.error === 'Too many tries. Please try again in an hour.', '4.14 per address: the 11th POST in an hour is 429');
  for (let i = 0; i < 3; i += 1) await post('/e/ess1', good({ phone_e164: '+919811122233' }), { origin: 'https://ess1.thedreamwedding.in', ip: '10.2.2.' + i });
  const fourth = await post('/e/ess1', good({ phone_e164: '+919811122233' }), { origin: 'https://ess1.thedreamwedding.in', ip: '10.2.2.9' });
  ok(() => fourth.status === 429, '4.15 per vendor + phone: the 4th in a day is 429');
  st2.failWrite.add('leads'); const fail503 = await post('/e/sig1', good({ phone_e164: '+919800000001' }), { ip: '10.3.3.3' }); st2.failWrite.delete('leads');
  ok(() => fail503.status === 503 && fail503.body.error === 'Your enquiry could not be sent. Please try again in a moment.', '4.16 a failed write is 503 with the plain line');
  ok(() => !JSON.stringify(st2.tables).includes('203.0.113.9') && !JSON.stringify(st2.tables).includes('10.1.1.1'), '4.17 no address is stored');

  sec('5  door 2 · the chat (by the token only)');
  const ctok = e1.body.chat_token;
  const ch1 = await post('/c/sig1', { chat_token: ctok, text: 'Do you travel to Jaipur?', phone: '+910000000000' });
  const outs = st2.tables.messages.filter((m) => m.direction === 'outbound');
  ok(() => ch1.status === 200 && JSON.stringify(ch1.body.replies) === JSON.stringify(['Hello Riya, thank you for writing. Which city is the wedding in?']) && outs.length === 1 && outs[0].channel === 'website' && outs[0].sent_by === 'agent', '5.1 200 { ok, replies }: the turn\'s words, recorded as website outbound rows');
  const ta = turns[turns.length - 1];
  ok(() => ta.counterparty.channel === 'website' && ta.counterparty.phone === '+919876543210' && ta.couplePhone === '+919876543210' && ta.counterparty.website.page === 'The Emerald Bride' && /wa\.me/.test(ta.counterparty.website.enquireLink), '5.2 the phone is the token\'s, never the request\'s; the website fact carries the page and the enquire link');
  ok(() => st2.tables.messages.some((m) => m.direction === 'inbound' && m.channel === 'website' && m.body === 'Do you travel to Jaipur?'), '5.3 the visitor\'s message is an inbound website row');
  caps['flag.website_eliza'] = 'off'; const h1 = await post('/c/sig1', { chat_token: ctok, text: 'Hello?' }); caps['flag.website_eliza'] = 'on';
  const thId = thr.id; st2.tables.messages.push({ id: 'vr1', conversation_id: thId, direction: 'outbound', channel: 'whatsapp', sent_by: 'vendor_relay', body: 'Hi, Aarohi here', created_at: new Date().toISOString() });
  const nTurns = turns.length; const h2 = await post('/c/sig1', { chat_token: ctok, text: 'Thanks' });
  st2.tables.messages = st2.tables.messages.filter((m) => m.id !== 'vr1');
  ok(() => JSON.stringify(h1.body) === '{"ok":true,"replies":[],"held":true}' && JSON.stringify(h2.body) === '{"ok":true,"replies":[],"held":true}' && turns.length === nTurns, '5.4 held, with no turn: Eliza off for the website, or she has taken over (a vendor_relay row inside her quiet time)');
  const bad = await Promise.all([post('/c/sig1', { chat_token: 'x'.repeat(43), text: 'hi' }), post('/c/ess1', { chat_token: ctok, text: 'hi' }, { origin: 'https://ess1.thedreamwedding.in' }), post('/c/sig1', { chat_token: ctok, text: 'hi' }, { origin: 'https://evil.example' }), post('/c/sig1', { text: 'hi' })]);
  const exp = st2.tables.website_chat_tokens.find((x) => x.token_hash === W.sha(own.body.chat_token)); exp.expires_at = '2020-01-01T00:00:00Z';
  const expired = await post('/c/sig1', { chat_token: own.body.chat_token, text: 'hi' }, { origin: 'https://www.aarohi.in' });
  ok(() => [...bad, expired].every((m) => m.status === 404) && new Set([...bad, expired].map((m) => m.raw)).size === 1, '5.5 unknown, another vendor\'s, expired, bad Origin, no token: the one 404 body');
  const empty = await post('/c/sig1', { chat_token: ctok, text: '  ' }); const long = await post('/c/sig1', { chat_token: ctok, text: 'x'.repeat(601) });
  ok(() => empty.status === 400 && long.status === 400 && empty.body.error === 'Please write a message.', '5.6 empty or over 600: 400 "Please write a message."');
  let release; turnImpl = () => new Promise((r) => { release = () => r({ reply: 'Slow answer.', stoodIn: false }); });
  const pSlow = post('/c/sig1', { chat_token: ctok, text: 'first' }); await new Promise((r) => setTimeout(r, 120));
  const busy = await post('/c/sig1', { chat_token: ctok, text: 'second' }); if (release) release(); const slow = await pSlow;
  ok(() => busy.status === 409 && busy.body.error === 'One moment.' && slow.status === 200, '5.7 while a turn for this token runs: 409 "One moment."');
  turnImpl = async () => { throw new Error('model down'); }; const m1 = await post('/c/sig1', { chat_token: ctok, text: 'a' });
  turnImpl = async () => ({ reply: "Thanks, we'll be in touch soon!", stoodIn: true }); const m2 = await post('/c/sig1', { chat_token: ctok, text: 'b' });
  ok(() => m1.status === 503 && m2.status === 503 && m1.body.error === 'Your message could not be sent. Please try again in a moment.' && !st2.tables.messages.some((m) => m.direction === 'outbound' && /in touch soon/.test(m.body)), '5.8 a model failure or the engine\'s stand-in: 503, and no invented reply is shown or recorded');
  const Tfast = load('src/lib/website/turn.js', read('src/lib/website/turn.js').replace('const TURN_LIMIT_MS = 25000;', 'const TURN_LIMIT_MS = 50;'));
  const late = Tfast ? await Tfast.chatTurn({ sb: st2, req: { ip: '10.9.9.9', get: (h) => (h === 'origin' ? 'https://sig1.thedreamwedding.in' : null) }, code: 'sig1', body: { chat_token: ctok, text: 'late' } },
    Object.assign(mkDeps(), { runTurn: () => new Promise((r) => setTimeout(() => r({ reply: 'too late' }), 300)) })) : null;
  ok(() => late && late.status === 503 && T.TURN_LIMIT_MS === 25000, '5.9 a turn over its limit (25 s; 50 ms in this cell): 503');
  turnImpl = async () => ({ reply: 'ok', stoodIn: false }); let l2 = null;
  const fresh = await post('/e/sig1', good({ phone_e164: '+919812345670' }), { ip: '10.4.4.4' });
  for (let i = 0; i < 31; i += 1) l2 = await post('/c/sig1', { chat_token: fresh.body.chat_token, text: 'm' + i }, { ip: '10.5.5.' + (i % 50) });
  ok(() => l2.status === 429, '5.10 per token: the 31st message in a day is 429');

  sec('6  the engine\'s website hunks (the engine is unchanged on every other channel)');
  // engine.js keeps its ONE export (b05 §1.5, b115 1.4): resolveCounterparty is read out by name and run, as b137 does
  const rcSrc = (read('src/agent/engine.js').match(/function resolveCounterparty\(counterparty, couplePhone\) \{[\s\S]*?\n\}/) || [])[0];
  const NH = load('src/agent/noticeHead.js');
  const E = { LINE_WORD: NH ? NH.LINE_WORD : {}, resolveCounterparty: rcSrc ? new Function(`${rcSrc}; return resolveCounterparty;`)() : null };
  const CSP = load('src/agent/coupleSystemPrompt.js');
  ok(() => E.LINE_WORD.website === 'your website' && E.resolveCounterparty({ channel: 'website', phone: '+919876543210' }).channel === 'website' && E.resolveCounterparty({ channel: 'website', phone: '+91' }).phone === '+91', '6.1 resolveCounterparty knows website; LINE_WORD.website is "your website" (noticeHead.js, required by engine.js, which keeps one export)');
  ok(() => E.resolveCounterparty({ channel: 'whatsapp_shared', phone: '+1', website: { page: 'x' } }).website === null && E.resolveCounterparty({ channel: 'pigeon' }).channel === 'whatsapp_shared', '6.2 the website fact exists on the website only; unknown channels still read as the shared line');
  ok(() => /cp\.channel === 'website' \? 'website' : 'whatsapp'/.test(read('src/agent/engine.js')) && /stoodIn: stoodIn \|\| !finalReply/.test(read('src/agent/engine.js')), '6.3 a lead the turn captures on the website is source website; the turn reports when it stood in');
  const base = { vendor: { business_name: 'Studio Ivara', category: 'makeup' }, vendorUser: {}, isReturningBride: false, leadName: null, useEliza: true, conversation: { inConversation: false } };
  const pw = CSP && JSON.stringify(CSP.buildCoupleSystemBlocks(Object.assign({}, base, { channel: 'website', website: { page: 'The Emerald Bride', enquireLink: 'https://wa.me/1' } })));
  const ps = CSP && JSON.stringify(CSP.buildCoupleSystemBlocks(Object.assign({}, base, { channel: 'whatsapp_shared' })));
  const ps2 = CSP && JSON.stringify(CSP.buildCoupleSystemBlocks(Object.assign({}, base, { channel: 'whatsapp_shared', website: { page: 'x' } })));
  ok(() => /WRITING ON STUDIO IVARA'S WEBSITE/.test(pw) && /The Emerald Bride/.test(pw) && /wa\.me\/1/.test(pw) && ps === ps2 && !/WEBSITE/.test(ps), '6.4 the prompt carries the website fact on the website only; the shared line\'s prompt bytes are unchanged by it');

  sec('7  her take-over reply reaches the visitor on WhatsApp by the approved path (the chair\'s ruling)');
  const WIN = load('src/lib/vendor/coupleWaWindow.js');
  const wst = makeStore({ conversations: [{ id: 'k1', kind: 'couple_thread', counterparty_phone: '+919876543210' }], messages: [{ conversation_id: 'k1', direction: 'inbound', channel: 'website', created_at: new Date().toISOString() }] });
  const w1 = WIN ? await WIN.coupleWindowOpen(wst, '+919876543210') : null;
  wst.tables.messages.push({ conversation_id: 'k1', direction: 'inbound', channel: 'whatsapp', created_at: new Date().toISOString() });
  const w2 = WIN ? await WIN.coupleWindowOpen(wst, '+919876543210') : null;
  ok(() => w1 && w1.open === false && w1.reason === 'no_inbound_ever' && w2.open === true, '7.1 a website message opens no WhatsApp window; a WhatsApp one does');
  const RS = read('src/lib/vendor/relaySeat.js');
  ok(() => /sendContentTemplate\(supabase, \{/.test(RS) && /const KEY = 'enquiry_reply_couple';/.test(read('src/lib/vendor/relayToCouple.js')), '7.2 so her reply from the app takes today\'s window-closed path: relaySeat -> sendContentTemplate, the approved template enquiry_reply_couple (then the doorbell)');

  sec('8  mutations of the doors and the window, run');
  const WINm = load('src/lib/vendor/coupleWaWindow.js', read('src/lib/vendor/coupleWaWindow.js').replace("      .neq('channel', 'website')\n", ''));
  const wm = WINm ? await WINm.coupleWindowOpen(makeStore({ conversations: [{ id: 'k1', kind: 'couple_thread', counterparty_phone: '+919876543210' }], messages: [{ conversation_id: 'k1', direction: 'inbound', channel: 'website', created_at: new Date().toISOString() }] }), '+919876543210') : null;
  ok(() => wm && wm.open === true, '8.1 the website line removed from the window: a website message opens it, her reply would go free-form (7.1 reddens)');
  const Tm = load('src/lib/website/turn.js', read('src/lib/website/turn.js').replace("counterparty: { channel: 'website', phone: tk.phone,", "counterparty: { channel: 'website', phone: b.phone || tk.phone,"));
  const tm = Tm ? await Tm.chatTurn({ sb: st2, req: { ip: '10.6.6.6', get: (h) => (h === 'origin' ? 'https://sig1.thedreamwedding.in' : null) }, code: 'sig1', body: { chat_token: ctok, text: 'x', phone: '+910000000000' } }, mkDeps()) : null;
  ok(() => tm && turns[turns.length - 1].counterparty.phone === '+910000000000', '8.2 the phone taken from the request: the turn talks to a number the token never bound (5.2 reddens)');
  const Wm = load('src/lib/website/enquiry.js', read('src/lib/website/enquiry.js').replace("    const isNew = !(open && !['won', 'lost', 'closed', 'booked', 'archived'].includes(open.state));", '    const isNew = true;'));
  const before = notices.length;
  if (Wm) { await Wm.fileEnquiry({ sb: st2, req: { ip: '10.7.7.7', get: (h) => (h === 'origin' ? 'https://sig1.thedreamwedding.in' : null) }, code: 'sig1', body: good() }, mkDeps()); }
  ok(() => notices.length === before + 1, '8.3 the open-lead rule removed: a repeat enquiry notifies again and files a second lead (4.7 reddens)');

  sec('9  every column the doors wrote or read is real (PUBLIC_SCHEMA.md and the ladder after its tip, 0191 among them)');
  const colz = {}; const addc = (t, c) => { (colz[t] = colz[t] || new Set()).add(c); };
  for (const f of fs.readdirSync(P('db/migrations')).filter((x) => /^\d{4}_.*\.sql$/.test(x) && x.slice(0, 4) > '0168')) {
    const sql = read('db/migrations/' + f).split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
    for (const b2 of sql.matchAll(/CREATE TABLE public\.(\w+) \(([\s\S]*?)\n\);/g)) for (const l of b2[2].split('\n')) { const c = /^\s+([a-z_]+)\s+(uuid|text|integer|boolean|jsonb|timestamptz|date|bytea|numeric|text\[\]|uuid\[\])/.exec(l); if (c) addc(b2[1], c[1]); }
    for (const b2 of sql.matchAll(/ALTER TABLE public\.(\w+)([\s\S]*?);/g)) for (const c of b2[2].matchAll(/ADD COLUMN (?:IF NOT EXISTS )?([a-z_]+)/g)) addc(b2[1], c[1]);
  }
  for (const sct of read('docs/db/PUBLIC_SCHEMA.md').split(/\n## public\./).slice(1)) { const t2 = sct.split(/\s/)[0]; for (const c of sct.matchAll(/\n\d+\. ([a-z_]+) /g)) addc(t2, c[1]); }
  const badc = []; for (const bag of [st2.written, st2.selected]) for (const [t2, ks] of Object.entries(bag)) for (const k of ks) if (!(colz[t2] && colz[t2].has(k))) badc.push(t2 + '.' + k);
  ok(() => st2.written.website_chat_tokens && st2.written.leads && badc.length === 0, '9.1 every column the doors wrote or read exists', badc.join(' '));
  ok(() => colz.leads.has('consent_at') && colz.leads.has('consent_text_version') && colz.website_chat_tokens.has('page_title'), '9.2 0191 is read: the consent columns and the token table');
  await new Promise((r) => srv2.close(r));
  console.log(`\nb200 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.message)); console.log(`\nb200 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
