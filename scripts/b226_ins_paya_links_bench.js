// scripts/b226_ins_paya_links_bench.js
// TDW · CE-47 · INS · PAY-A · b226 — THE CONNECTION AND THE LINKS, BUILT TO THE DOOR AND NOT SWITCHED ON.
// payLinks.js and payRazorpay.js against an in-memory database (throws on any call it does not model) and a fake
// Razorpay (records every call). §1 the gates: with any RAZORPAY_PARTNER_* value unset, Coming soon, no partner call,
// no row. §2 the state: bound to vendor and session, expiring, single use, a replay refused. §3 raw reads: no token,
// secret or state in any body or log line. §4 a link: package invoices only, whole rupees in paise, the token unsealed
// only to call Razorpay. §5 production mutations in temporary copies, each red on its named cell. No wall clock.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const ROOT = process.env.B226_ROOT || path.join(__dirname, '..');
let pass = 0, fail = 0; const failed = []; const Q = !!process.env.B226_QUIET;
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v === true) { pass += 1; if (!Q) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); if (!Q) console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => { if (!Q) console.log(`\n§${t}`); };
const fresh = (r) => { const p = path.join(ROOT, r); Object.keys(require.cache).forEach((k) => { if (k.startsWith(path.join(ROOT, 'src'))) delete require.cache[k]; }); return require(p); };

function fakeDb(seed) {
  const T = JSON.parse(JSON.stringify(seed)); const log = []; let n = 0;
  function query(table) {
    const f = []; let op = 'select', payload = null, single = false, lim = null;
    const api = {
      select() { return api; }, order() { return api; }, limit(k) { lim = k; return api; },
      eq(c, v) { f.push((r) => r[c] === v); return api; }, neq(c, v) { f.push((r) => r[c] !== v); return api; },
      is(c, v) { f.push((r) => (r[c] ?? null) === v); return api; }, gt(c, v) { f.push((r) => r[c] > v); return api; }, lt(c, v) { f.push((r) => r[c] < v); return api; },
      insert(row) { op = 'insert'; payload = row; return api; }, update(row) { op = 'update'; payload = row; return api; },
      maybeSingle() { single = true; return api.then((x) => x); },
      then(res, rej) {
        try {
          T[table] = T[table] || []; let out;
          if (op === 'insert') { const r = { id: `row-${++n}`, ...payload }; T[table].push(r); out = [r]; }
          else if (op === 'update') { out = T[table].filter((r) => f.every((g) => g(r))); out.forEach((r) => Object.assign(r, payload)); }
          else { out = T[table].filter((r) => f.every((g) => g(r))); if (lim) out = out.slice(0, lim); }
          log.push({ table, op });
          return Promise.resolve({ data: single ? (out[0] ? { ...out[0] } : null) : out.map((r) => ({ ...r })), error: null }).then(res, rej);
        } catch (e) { return Promise.reject(e).then(res, rej); }
      },
    };
    return api;
  }
  // A MODEL of 0202's (b) functions (the real SQL is proven by b225 2d); anything else throws.
  const rpc = async (name, a) => {
    const E = (T.vendor_pay_events = T.vendor_pay_events || []);
    const ev = () => E.find((e) => e.id === a.p_event && e.vendor_id === a.p_vendor);
    if (name === 'pay_hold_binder_payment') { if (E.some((e) => e.provider === a.p_provider && e.provider_payment_id === a.p_payment_id && e.kind === 'paid')) return { data: { ok: true, duplicate: true }, error: null };
      const id = `ev-${++n}`; E.push({ id, vendor_id: a.p_vendor, provider: a.p_provider, provider_payment_id: a.p_payment_id, kind: 'paid', binder_id: a.p_binder, link_id: a.p_link, amount: a.p_amount, applied: false, not_applied_reason: 'BINDER_PENDING', claimed_at: null, binder_base_received: null, at: '2026-10-07T00:00:00Z' });
      return { data: { ok: true, held: true, event_id: id }, error: null }; }
    if (name === 'pay_claim_binder_event') { const e = ev(); if (!e || e.applied || e.not_applied_reason !== 'BINDER_PENDING' || e.claimed_at || E.some((o) => o !== e && o.binder_id === e.binder_id && !o.applied && o.claimed_at)) return { data: { ok: false, code: 'NOT_CLAIMED' }, error: null };
      e.claimed_at = 'now'; return { data: { ok: true, event_id: e.id, binder_id: e.binder_id, amount: e.amount, base: e.binder_base_received }, error: null }; }
    if (name === 'pay_keep_binder_base') { const e = ev(); if (!e || e.binder_base_received !== null || !e.claimed_at) return { data: false, error: null }; e.binder_base_received = a.p_base; return { data: true, error: null }; }
    if (name === 'pay_finish_binder_event') { const e = ev(); if (!e || e.applied || e.not_applied_reason !== 'BINDER_PENDING') return { data: false, error: null };
      if (a.p_outcome === 'applied') Object.assign(e, { applied: true, not_applied_reason: null, claimed_at: null }); else if (a.p_outcome === 'uncertain') Object.assign(e, { not_applied_reason: 'BINDER_UNCERTAIN', claimed_at: null }); else e.claimed_at = null; return { data: true, error: null }; }
    if (name === 'pay_resolve_binder_event') { const e = ev(); if (!e || e.not_applied_reason !== 'BINDER_UNCERTAIN') return { data: { ok: false, code: 'NOT_UNCERTAIN' }, error: null };
      const A = (T.vendor_pay_event_answers = T.vendor_pay_event_answers || []); const r = A.filter((x) => x.event_id === e.id).length + 1; A.push({ event_id: e.id, round: r, action: a.p_action, answered_by: a.p_user });
      Object.assign(e, a.p_action === 'already_on' ? { applied: true, not_applied_reason: null } : { not_applied_reason: 'BINDER_PENDING', binder_base_received: null }, { claimed_at: null }); return { data: { ok: true, round: r }, error: null }; }
    throw new Error('fake: rpc ' + name + ' not modelled in b226');
  };
  return { db: { from: query, rpc }, T, log };
}
const V = 'v-226', W = 'w-226';
const ON = { RAZORPAY_PARTNER_CLIENT_ID: 'cid-226', RAZORPAY_PARTNER_CLIENT_SECRET: 'CLIENTSECRET226', RAZORPAY_PARTNER_WEBHOOK_SECRET: 'HOOKSECRET226', RAZORPAY_PARTNER_REDIRECT_URI: 'https://example.invalid/cb' };
const OFF = { ...ON, RAZORPAY_PARTNER_WEBHOOK_SECRET: '' };
const TOKEN = 'ACCESSTOKEN226', RTOKEN = 'REFRESHTOKEN226';
const T0 = new Date('2026-10-07T06:00:00Z');
function fakeRazorpay() {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, body: init && init.body, auth: init && init.headers && init.headers.Authorization });
    if (url.endsWith('/token')) return { ok: true, json: async () => ({ access_token: TOKEN, refresh_token: RTOKEN, razorpay_account_id: 'acc_226', expires_in: 7776000 }) };
    if (url.endsWith('/payment_links')) return { ok: true, json: async () => ({ id: 'plink_226', short_url: 'https://rzp.io/l/226' }) };
    return { ok: false, json: async () => ({}) };
  };
  return { fetch, calls };
}
const vault = { seal: (p) => 'SEALED.' + Buffer.from(p).toString('base64'), open: (s) => ({ ok: true, value: Buffer.from(String(s).replace('SEALED.', ''), 'base64').toString('utf8') }) };
const seed = () => ({ vendor_pay_accounts: [], vendor_pay_oauth_states: [], vendor_pay_links: [], vendor_pay_events: [], vendor_pay_settings: [],
  invoices: [{ id: 'inv-226', vendor_id: V, amount_total: 60000, amount_paid: 10000, state: 'advance_paid' }],
  payment_schedules: [{ id: 'ln-226', invoice_id: 'inv-226', vendor_id: V, amount_due: 30000, paid_amount: 10000, state: 'pending' }] });
const stateOf = (url) => new URL(url).searchParams.get('state');

(async () => {
  const PL = fresh('src/lib/vendor/payLinks.js');
  const logs = []; const keep = { log: console.log, warn: console.warn, error: console.error };
  const capture = () => { console.log = (...a) => logs.push(a.join(' ')); console.warn = console.log; console.error = console.log; };
  const release = () => { console.log = keep.log; console.warn = keep.warn; console.error = keep.error; };
  const bodies = [];
  const BINDER = { id: 'binder-226', amount: 40000, amount_received: 15000, writes: 0 };
  const binderDeps = { read: async (id) => (id === BINDER.id ? { id, amount: BINDER.amount, amount_received: BINDER.amount_received } : null),
    write: async (_id, received) => { BINDER.amount_received = received; BINDER.writes += 1; return { ok: true }; } };
  const D = (f, rz, envv, now = T0) => ({ supabase: f.db, env: envv, fetch: rz.fetch, vault, now: () => now, binder: binderDeps });

  sec('1  the gates: any value unset → Coming soon, no partner call, no row');
  for (const k of Object.keys(ON)) {
    const envv = { ...ON, [k]: '' }; const f = fakeDb(seed()); const rz = fakeRazorpay();
    const r1 = await PL.room(V, D(f, rz, envv)); const r2 = await PL.connectStart(V, 'bearer-a', D(f, rz, envv));
    const r3 = await PL.connectFinish(V, 'bearer-a', { code: 'c', state: 's' }, D(f, rz, envv)); const r4 = await PL.makeLink(V, { invoiceId: 'inv-226', milestoneId: 'ln-226' }, D(f, rz, envv));
    ok(() => r1.body.configured === false && r1.body.comingSoon === 'Coming soon' && [r2, r3, r4].every((r) => r.body.code === 'NOT_CONFIGURED' && r.body.error === 'Coming soon')
      && rz.calls.length === 0 && f.log.length === 0, `1.1 with ${k} unset: every door says Coming soon, no partner call, no database touch`);
  }

  sec('2  the state: bound, expiring, single use');
  const f = fakeDb(seed()); const rz = fakeRazorpay();
  capture();
  const s1 = await PL.connectStart(V, 'bearer-a', D(f, rz, ON)); bodies.push(JSON.stringify(s1.body));
  ok(() => s1.status === 200 && /^https:\/\/auth\.razorpay\.com\/authorize\?/.test(s1.body.url) && f.T.vendor_pay_oauth_states.length === 1 && rz.calls.length === 0, '2.1 connect gives Razorpay\'s own address and stores one state; no partner call yet');
  const st = stateOf(s1.body.url);
  const other = await PL.connectFinish(W, 'bearer-a', { code: 'c', state: st }, D(f, rz, ON)); bodies.push(JSON.stringify(other.body));
  ok(() => other.body.code === 'STATE_NOT_YOURS' && rz.calls.length === 0, '2.2 another vendor\'s finish with her state is refused, before any partner call');
  const sess = await PL.connectFinish(V, 'bearer-b', { code: 'c', state: st }, D(f, rz, ON)); bodies.push(JSON.stringify(sess.body));
  ok(() => sess.body.code === 'STATE_NOT_YOURS' && rz.calls.length === 0, '2.3 her state from another session is refused');
  const late = await PL.connectFinish(V, 'bearer-a', { code: 'c', state: st }, D(f, rz, ON, new Date(T0.getTime() + 11 * 60000))); bodies.push(JSON.stringify(late.body));
  ok(() => late.body.code === 'STATE_EXPIRED' && rz.calls.length === 0, '2.4 eleven minutes later the state has expired');
  const bad = await PL.connectFinish(V, 'bearer-a', { code: 'c', state: st.slice(0, -1) + (st.slice(-1) === 'A' ? 'B' : 'A') }, D(f, rz, ON)); bodies.push(JSON.stringify(bad.body));
  ok(() => bad.body.code === 'BAD_STATE' && rz.calls.length === 0, '2.5 a state changed by one character is refused');
  const good = await PL.connectFinish(V, 'bearer-a', { code: 'c', state: st }, D(f, rz, ON)); bodies.push(JSON.stringify(good.body));
  ok(() => good.status === 200 && good.body.account.accountId === 'acc_226' && f.T.vendor_pay_accounts.length === 1 && f.T.vendor_pay_accounts[0].token_ref.startsWith('SEALED.') && !!f.T.vendor_pay_oauth_states[0].spent_at, '2.6 the right finish connects her: the token kept only sealed, the state spent');
  const replay = await PL.connectFinish(V, 'bearer-a', { code: 'c2', state: st }, D(f, rz, ON)); bodies.push(JSON.stringify(replay.body));
  ok(() => replay.body.code === 'STATE_SPENT' && rz.calls.filter((c) => c.url.endsWith('/token')).length === 1, '2.7 a replay of the same state is refused and never reaches Razorpay');

  sec('4  a link: package invoices only; the amount still owed, in paise');
  const lk = await PL.makeLink(V, { invoiceId: 'inv-226', milestoneId: 'ln-226' }, D(f, rz, ON)); bodies.push(JSON.stringify(lk.body));
  const call = rz.calls.find((c) => c.url.endsWith('/payment_links'));
  ok(() => lk.status === 200 && lk.body.link.amount === 20000 && call && JSON.parse(call.body).amount === 2000000 && JSON.parse(call.body).accept_partial === false && call.auth === `Bearer ${TOKEN}`, '4.1 a link for what is still owed on the line (Rs 20,000 = 2000000 paise), whole amount only', JSON.stringify(lk.body));
  ok(() => f.T.vendor_pay_links.length === 1 && f.T.vendor_pay_links[0].short_url === 'https://rzp.io/l/226' && f.T.vendor_pay_links[0].provider_link_id === 'plink_226', '4.2 the link is kept with Razorpay\'s id and short address');
  const bo = await PL.makeLink(V, { invoiceId: 'binder-1' }, D(f, rz, ON)); bodies.push(JSON.stringify(bo.body));
  ok(() => bo.body.code === 'NOT_FOUND', '4.3a an invoice that is neither a package invoice nor her binder: not found');
  const nw = await PL.makeLink(W, { invoiceId: 'inv-226', milestoneId: 'ln-226' }, D(f, rz, ON)); bodies.push(JSON.stringify(nw.body));
  ok(() => nw.body.code === 'NOT_CONNECTED', '4.4 another vendor cannot make a link on her invoice');
  // Ruling 7: a WHOLE-invoice link asks for the whole amount unless HER setting allows part payment.
  const wh1 = await PL.makeLink(V, { invoiceId: 'inv-226' }, D(f, rz, ON)); bodies.push(JSON.stringify(wh1.body));
  const c1 = rz.calls.filter((c) => c.url.endsWith('/payment_links')).pop();
  f.T.vendor_pay_settings.push({ vendor_id: V, accept_partial: true });
  const wh2 = await PL.makeLink(V, { invoiceId: 'inv-226' }, D(f, rz, ON)); bodies.push(JSON.stringify(wh2.body));
  const c2 = rz.calls.filter((c) => c.url.endsWith('/payment_links')).pop();
  const lnAgain = await PL.makeLink(V, { invoiceId: 'inv-226', milestoneId: 'ln-226' }, D(f, rz, ON)); bodies.push(JSON.stringify(lnAgain.body));
  const c3 = rz.calls.filter((c) => c.url.endsWith('/payment_links')).pop();
  ok(() => wh1.body.link.amount === 50000 && JSON.parse(c1.body).accept_partial === false && JSON.parse(c2.body).accept_partial === true && JSON.parse(c3.body).accept_partial === false,
    '4.5 a whole-invoice link: whole amount by default, part payment only with her setting on; a line link is always whole');
  sec('4b  (b) a binder-only invoice, end to end: link, payment, held, applied once; her answers');
  const before = BINDER.amount_received;
  const bl = await PL.makeLink(V, { invoiceId: BINDER.id }, D(f, rz, ON)); bodies.push(JSON.stringify(bl.body));
  const bcall = rz.calls.filter((c) => c.url.endsWith('/payment_links')).pop();
  const brow = f.T.vendor_pay_links.find((l) => l.binder_id === BINDER.id);
  ok(() => bl.status === 200 && bl.body.link.amount === BINDER.amount - before && JSON.parse(bcall.body).amount === (BINDER.amount - before) * 100 && brow && brow.invoice_id === undefined,
    '4.3 a binder-only invoice gets a link for what is still owed on the binder, kept with the binder as its one home', JSON.stringify(bl.body));
  const evt = { event: 'payment_link.paid', account_id: 'acc_226', payload: { payment_link: { entity: { id: 'plink_226', reference_id: brow.id } }, payment: { entity: { id: 'pay_b226', amount: 500000, method: 'upi' } } } };
  const rec1 = await PL.recordEvent(evt, D(f, rz, ON)); const rec2 = await PL.recordEvent(evt, D(f, rz, ON));
  const held = f.T.vendor_pay_events.find((e) => e.provider_payment_id === 'pay_b226');
  ok(() => rec1.handled && rec1.applyAfter && rec2.answer && rec2.answer.duplicate === true && held && held.not_applied_reason === 'BINDER_PENDING' && BINDER.amount_received === before,
    '4.6 the payment is HELD first (once only; Razorpay\'s retry is a duplicate); the binder not yet touched', JSON.stringify(rec1));
  const ap = await PL.applyBinderEvent(V, rec1.applyAfter.eventId, D(f, rz, ON)); const ap2 = await PL.applyBinderEvent(V, rec1.applyAfter.eventId, D(f, rz, ON));
  ok(() => ap.outcome === 'applied' && ap2.outcome === 'not_claimed' && BINDER.amount_received === before + 5000 && BINDER.writes === 1 && held.applied === true,
    '4.7 then applied ONCE: the binder rises by exactly the payment; a second apply finds nothing to claim', `${ap.outcome} ${ap2.outcome} ${BINDER.amount_received}`);
  held.applied = false; held.not_applied_reason = 'BINDER_UNCERTAIN';
  const otherAns = await PL.resolveUncertain(W, 'user-w', held.id, 'already_on', D(f, rz, ON));
  const ans = await PL.resolveUncertain(V, 'user-v', held.id, 'already_on', D(f, rz, ON)); const ans2 = await PL.resolveUncertain(V, 'user-v', held.id, 'already_on', D(f, rz, ON));
  ok(() => otherAns.status === 404 && ans.status === 200 && ans2.body.code === 'NOT_UNCERTAIN' && BINDER.writes === 1 && f.T.vendor_pay_event_answers.length === 1 && f.T.vendor_pay_event_answers[0].answered_by === 'user-v',
    '4.8 her answer: another vendor\'s event answers 404; hers is recorded once with who; "already on" writes nothing', JSON.stringify(otherAns.body));

  const rm = await PL.room(V, D(f, rz, ON)); const q = rm.body.events.find((e) => e.id === held.id);
  held.not_applied_reason = 'BINDER_UNCERTAIN'; held.applied = false;
  const rm2 = await PL.room(V, D(f, rz, ON)); const q2 = rm2.body.events.find((e) => e.id === held.id);
  ok(() => q && q.amount_text === 'Rs 5,000' && q2 && q2.question && q2.question.line === 'Rs 5,000 was received online. TDW could not tell if it is already counted on this invoice.' && q2.question.one === 'It is already on the invoice' && q2.question.two === 'Add it to the invoice',
    '4.10 the room sends the amount already written (Rs 5,000) and, for a payment it could not place, the line and both answers word for word', JSON.stringify(q2 && q2.question));

  sec('4c  the sweep\'s minutes in src/cron.js');
  const CR = fs.readFileSync(path.join(ROOT, 'src/cron.js'), 'utf8');
  const expand = (f0) => { const out = new Set(); for (const part of f0.split(',')) { let [rng, step] = part.split('/'); step = step ? Number(step) : 1;
    let [a, b] = rng === '*' ? [0, 59] : rng.split('-').map(Number); if (b === undefined) b = step > 1 ? 59 : a; for (let m = a; m <= b; m += step) out.add(m); } return out; };
  const jobs = [...CR.matchAll(/cron\.schedule\('([^']+)'/g)].map((m) => m[1]);
  const mine = jobs.filter((e) => e.split(' ')[0] === '9,24,39,54' && e.split(' ').slice(1).join(' ') === '* * * *');
  const others = jobs.filter((e) => e !== '9,24,39,54 * * * *');
  const clash = others.filter((e) => [...expand(e.split(' ')[0])].some((m) => [9, 24, 39, 54].includes(m)));
  ok(() => mine.length === 1 && clash.length === 0, '4.9 the binder sweep runs at :09 :24 :39 :54 and no other job in src/cron.js shares those minutes', JSON.stringify(clash));
  release();

  sec('3  raw reads: no token, secret or state in any body or log line');
  const all = bodies.join('\n') + '\n' + logs.join('\n');
  ok(() => ![TOKEN, RTOKEN, ON.RAZORPAY_PARTNER_CLIENT_SECRET, ON.RAZORPAY_PARTNER_WEBHOOK_SECRET].some((x) => all.includes(x)), '3.1 no access token, refresh token, client secret or webhook secret in any body or log');
  ok(() => bodies.slice(1).every((b) => !b.includes(st)), '3.2 the state appears in Razorpay\'s address only, never echoed in an answer');

  if (!process.env.B226_ROOT) {
    sec('5  production mutations, each must turn its named cell red');
    const MUT = [
      // The gate is held twice (payLinks.on and payRazorpay's own config), so removing one door's check alone is not a
      // fault; the mutation removes the ONE place that decides "configured", which every gate reads.
      ['the "all four values set" rule removed', 'src/lib/vendor/payRazorpay.js', "configured: KEYS.every((k) => typeof env[k] === 'string' && env[k].trim().length > 0)", "configured: true", '1.1'],
      ['the spend guard removed (a replay accepted)', 'src/lib/vendor/payLinks.js', ".eq('session_id', sessionOf(bearer)).is('spent_at', null).gt('expires_at', nowIso(deps))", ".eq('session_id', sessionOf(bearer))", '2.7'],
      ['the session binding removed', 'src/lib/vendor/payRazorpay.js', "if (p.v !== vendorId || p.s !== sessionId) return", "if (p.v !== vendorId) return", '2.3'],
      ['the token returned in the answer', 'src/lib/vendor/payLinks.js', "return ok({ account: { provider: 'razorpay', accountId: ex.accountId } });", "return ok({ account: { provider: 'razorpay', accountId: ex.accountId, token: ex.accessToken } });", '3.1'],
      ['a part payment allowed on a line', 'src/lib/vendor/payLinks.js', "  let owed, acceptPartial = false;", "  let owed, acceptPartial = true;", '4.1'],
      ['a binder link for the whole binder, not what is owed', 'src/lib/vendor/payLinks.js', "  const owed = (Number(rec.amount) || 0) - (Number(rec.amount_received) || 0);", "  const owed = (Number(rec.amount) || 0);", '4.3'],
      ['her answer without the ownership check', 'src/lib/vendor/payLinks.js', "  if (!mine) return no(404, 'NOT_FOUND', UNCERTAIN.notFound);", "", '4.8'],
      ['the sweep moved onto PTN\'s drain minutes', 'src/cron.js', "cron.schedule('9,24,39,54 * * * *',", "cron.schedule('7,22,37,52 * * * *',", '4.9'],
      ['her setting ignored (always part payment)', 'src/lib/vendor/payLinks.js', "    acceptPartial = !!(st && st.accept_partial === true);", "    acceptPartial = true;", '4.5'],
    ];
    for (const [name, file, from, to, cell] of MUT) {
      const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'b226-'));
      fs.cpSync(path.join(ROOT, 'src/lib'), path.join(tmp, 'src/lib'), { recursive: true });
      fs.copyFileSync(path.join(ROOT, 'src/cron.js'), path.join(tmp, 'src/cron.js'));   // 4.9 reads it
      const src = fs.readFileSync(path.join(tmp, file), 'utf8');
      if (!src.includes(from)) { ok(false, `5 · ${name}: the mutation's anchor is present`); fs.rmSync(tmp, { recursive: true, force: true }); continue; }
      fs.writeFileSync(path.join(tmp, file), src.replace(from, to));
      const r = require('child_process').spawnSync(process.execPath, [__filename], { env: { ...process.env, B226_ROOT: tmp, B226_QUIET: '1', B226_WANT: cell }, encoding: 'utf8', timeout: 60000 });
      ok(() => r.stdout.includes(`RED ${cell}`), `5 · ${name} → §${cell} red`, (r.stdout || r.stderr).slice(-200));
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (process.env.B226_WANT) { console.log(failed.some((x) => x.startsWith(process.env.B226_WANT + ' ')) ? `RED ${process.env.B226_WANT}` : 'NOT RED'); process.exit(0); }
  console.log(`\nb226 · ${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log = (...a) => process.stdout.write(a.join(' ') + '\n'); console.log('b226 threw: ' + (e && e.stack)); process.exit(1); });
