// scripts/b227_ins_paya_webhook_bench.js
// TDW · CE-47 · INS · PAY-A · b227 — POST /webhook/razorpay-partner, PAY-A's OWN door.
// The door (src/api/webhooks/razorpayPartner.js) with a fake request and response, against an in-memory database whose
// rpc is a MODEL of 0201's once-only recorder (the real SQL is b225's). §1 unset: 404, nothing read or written.
// §2 the signature: PAY-A's secret accepted; a body signed with TDW's billing secret refused here; and, read only, PAY-A's
// secret refused by the billing door's own verifier. §3 a paid link: recorded once by payment id; a retry is a duplicate.
// §4 a link that is not hers, or not the link Razorpay names, moves nobody's invoice. §5 failed and refunded are kept
// once; a refund waits for her tap. §6 a database failure answers 500 and its retry counts once. §7 mutations.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os'); const crypto = require('crypto');
const ROOT = process.env.B227_ROOT || path.join(__dirname, '..');
let pass = 0, fail = 0; const failed = []; const Q = !!process.env.B227_QUIET;
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v === true) { pass += 1; if (!Q) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); if (!Q) console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => { if (!Q) console.log(`\n§${t}`); };
const fresh = (r) => { Object.keys(require.cache).forEach((k) => { if (k.startsWith(path.join(ROOT, 'src'))) delete require.cache[k]; }); return require(path.join(ROOT, r)); };

const V = 'v-227', W = 'w-227';
const ON = { RAZORPAY_PARTNER_CLIENT_ID: 'cid', RAZORPAY_PARTNER_CLIENT_SECRET: 'cs', RAZORPAY_PARTNER_WEBHOOK_SECRET: 'HOOK227', RAZORPAY_PARTNER_REDIRECT_URI: 'https://example.invalid/cb' };
const BILLING = 'BILLING227';
function fakeDb() {
  const T = {
    vendor_pay_accounts: [{ id: 'a1', vendor_id: V, provider: 'razorpay', account_id: 'acc_V', status: 'connected' }, { id: 'a2', vendor_id: W, provider: 'razorpay', account_id: 'acc_W', status: 'connected' }],
    vendor_pay_links: [{ id: 'link-V', vendor_id: V, invoice_id: 'inv-V', milestone_id: 'ln-V', provider_link_id: 'plink_V', state: 'sent' },
                       { id: 'link-W', vendor_id: W, invoice_id: 'inv-W', milestone_id: 'ln-W', provider_link_id: 'plink_W', state: 'sent' }],
    vendor_pay_events: [], lines: { 'ln-V': { vendor: V, paid: 0, due: 30000 }, 'ln-W': { vendor: W, paid: 0, due: 30000 } } };
  const log = []; let failRpc = 0;
  function query(table) {
    const f = []; let op = 'select', payload = null, single = false, upOpts = null;
    const api = {
      select() { return api; }, eq(c, v) { f.push((r) => r[c] === v); return api; }, neq(c, v) { f.push((r) => r[c] !== v); return api; },
      update(row) { op = 'update'; payload = row; return api; }, upsert(row, o) { op = 'upsert'; payload = row; upOpts = o; return api; },
      maybeSingle() { single = true; return api.then((x) => x); },
      then(res, rej) {
        T[table] = T[table] || []; let out = [];
        if (op === 'update') { out = T[table].filter((r) => f.every((g) => g(r))); out.forEach((r) => Object.assign(r, payload)); }
        else if (op === 'upsert') { const dup = T[table].some((r) => r.provider === payload.provider && r.provider_payment_id === payload.provider_payment_id && r.kind === payload.kind);
          if (!dup) T[table].push({ ...payload }); else if (!(upOpts && upOpts.ignoreDuplicates)) throw new Error('dup'); }
        else out = T[table].filter((r) => f.every((g) => g(r)));
        log.push({ table, op });
        return Promise.resolve({ data: single ? (out[0] ? { ...out[0] } : null) : out, error: null }).then(res, rej);
      },
    };
    return api;
  }
  // A MODEL of 0201's pay_record_milestone: once only by (provider, payment id, 'paid'); adds to the line.
  const rpc = async (name, a) => {
    log.push({ rpc: name, a });
    if (failRpc > 0) { failRpc -= 1; return { data: null, error: { message: 'database down' } }; }
    if (name !== 'pay_record_milestone') return { data: null, error: { message: 'not modelled' } };
    if (T.vendor_pay_events.some((e) => e.provider === a.p_provider && e.provider_payment_id === a.p_payment_id && e.kind === 'paid')) return { data: { ok: true, duplicate: true }, error: null };
    const ln = T.lines[a.p_milestone]; if (!ln || ln.vendor !== a.p_vendor) return { data: { ok: true, applied: false, code: 'NO_LINE' }, error: null };
    T.vendor_pay_events.push({ provider: a.p_provider, provider_payment_id: a.p_payment_id, kind: 'paid', milestone_id: a.p_milestone, invoice_id: 'inv-V', amount: a.p_amount, applied: true });
    ln.paid += a.p_amount; return { data: { ok: true, applied: true }, error: null };
  };
  return { T, log, db: { from: query, rpc }, failNext: (n) => { failRpc = n; } };
}
const sig = (raw, secret) => crypto.createHmac('sha256', secret).update(raw).digest('hex');
const paidEvt = (acct, ref, plinkId, payId, paise) => ({ event: 'payment_link.paid', account_id: acct, payload: {
  payment_link: { entity: { id: plinkId, reference_id: ref } }, payment: { entity: { id: payId, amount: paise, method: 'upi' } } } });
async function hit(door, f, envv, evt, secret) {
  const raw = Buffer.from(JSON.stringify(evt)); const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  const req = { rawBody: raw, headers: { 'x-razorpay-signature': secret ? sig(raw, secret) : 'nope' }, app: { locals: { supabase: f.db, payLinksDeps: { env: envv } } } };
  await door(req, res); return res;
}

(async () => {
  const door = fresh('src/api/webhooks/razorpayPartner.js');

  sec('1  unset: the door accepts nothing');
  { const f = fakeDb(); const r = await hit(door, f, { ...ON, RAZORPAY_PARTNER_WEBHOOK_SECRET: '' }, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000), 'HOOK227');
    ok(() => r.code === 404 && f.log.length === 0, '1.1 with the webhook secret unset: 404, nothing read or written'); }

  sec('2  the signature: its own secret only');
  { const f = fakeDb();
    const bad = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000), 'wrong');
    const bill = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000), BILLING);
    ok(() => bad.code === 400 && bill.code === 400 && f.log.length === 0, '2.1 a wrong signature, and a body signed with TDW\'s BILLING secret, are refused at this door; nothing read');
    const raw = Buffer.from(JSON.stringify(paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000)));
    const billing = require(path.join(ROOT, 'src/lib/billing/razorpay.js'));   // READ ONLY: the billing door's own verifier
    ok(() => billing.verifyRazorpaySignature(raw, sig(raw, ON.RAZORPAY_PARTNER_WEBHOOK_SECRET), BILLING) === false && billing.verifyRazorpaySignature(raw, sig(raw, BILLING), BILLING) === true,
      '2.2 (read only) PAY-A\'s secret is refused by /webhook/razorpay\'s verifier, which still accepts its own'); }

  sec('3  a paid link: recorded once by payment id');
  { const f = fakeDb();
    const r1 = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000), 'HOOK227');
    const call = f.log.find((l) => l.rpc);
    ok(() => r1.code === 200 && call && call.a.p_payment_id === 'pay_1' && call.a.p_milestone === 'ln-V' && call.a.p_amount === 10000 && call.a.p_vendor === V && f.T.lines['ln-V'].paid === 10000 && f.T.vendor_pay_links[0].state === 'paid',
      '3.1 Rs 10,000 (1000000 paise) recorded on her line through the once-only recorder, with the payment id; the link marked paid');
    const r2 = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000), 'HOOK227');
    ok(() => r2.code === 200 && f.T.lines['ln-V'].paid === 10000, '3.2 Razorpay\'s retry of the same payment: 200, and the money counted once'); }

  sec('4  a link that is not hers, or not the link named, moves nobody\'s invoice');
  { const f = fakeDb();
    const r1 = await hit(door, f, ON, paidEvt('acc_V', 'link-W', 'plink_W', 'pay_x', 500000), 'HOOK227');
    const r2 = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_OTHER', 'pay_y', 500000), 'HOOK227');
    ok(() => r1.code === 200 && r2.code === 200 && !f.log.some((l) => l.rpc) && f.T.lines['ln-W'].paid === 0 && f.T.lines['ln-V'].paid === 0,
      '4.1 her account naming ANOTHER vendor\'s link, or her link under a different Razorpay link id: no recorder call, no invoice moves'); }

  sec('5  failed and refunded: kept once; a refund waits for her tap');
  { const f = fakeDb();
    await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_1', 1000000), 'HOOK227');
    const failed = { event: 'payment.failed', account_id: 'acc_V', payload: { payment: { entity: { id: 'pay_f', amount: 200000, method: 'card' } } } };
    await hit(door, f, ON, failed, 'HOOK227'); await hit(door, f, ON, failed, 'HOOK227');
    const refund = { event: 'refund.processed', account_id: 'acc_V', payload: { refund: { entity: { id: 'rfnd_1', payment_id: 'pay_1', amount: 300000 } } } };
    await hit(door, f, ON, refund, 'HOOK227'); await hit(door, f, ON, refund, 'HOOK227');
    const fails = f.T.vendor_pay_events.filter((e) => e.kind === 'failed'); const refs = f.T.vendor_pay_events.filter((e) => e.kind === 'refunded');
    ok(() => fails.length === 1 && fails[0].applied === false, '5.1 a failed payment is kept once, never applied');
    ok(() => refs.length === 1 && refs[0].applied === false && refs[0].amount === 3000 && refs[0].milestone_id === 'ln-V' && f.T.lines['ln-V'].paid === 10000,
      '5.2 a refund is kept once with its line, NOT taken off: it waits for her tap'); }

  sec('6  a database failure: 500, and the retry counts once');
  { const f = fakeDb(); f.failNext(1);
    const r1 = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_9', 1000000), 'HOOK227');
    const r2 = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_9', 1000000), 'HOOK227');
    const r3 = await hit(door, f, ON, paidEvt('acc_V', 'link-V', 'plink_V', 'pay_9', 1000000), 'HOOK227');
    ok(() => r1.code === 500 && r2.code === 200 && r3.code === 200 && f.T.lines['ln-V'].paid === 10000, '6.1 the database fails: 500 (Razorpay retries); the retry records it; a third arrival changes nothing'); }

  if (!process.env.B227_ROOT) {
    sec('7  production mutations, each must turn its named cell red');
    const MUT = [
      ['the signature check removed', 'src/api/webhooks/razorpayPartner.js', "  if (!rp.verifyWebhook(req.rawBody, req.headers['x-razorpay-signature'], env)) return res.status(400).json({ ok: false });\n", '', '2.1'],
      ['the link\'s own id not compared', 'src/lib/vendor/payLinks.js', "if (!link || !link.provider_link_id || link.provider_link_id !== lk.id) return", "if (!link) return", '4.1'],
      // AMENDED (turn 58): the binder path's hold call also passes pay.id, so the anchor names the package path's own args.
      ['the payment id not passed (no once-only key)', 'src/lib/vendor/payLinks.js', "p_received: null, p_provider: 'razorpay', p_payment_id: pay.id,", "p_received: null, p_provider: 'razorpay', p_payment_id: pay.id + ':' + Math.random(),", '3.2'],
      ['a database failure answered 200 (no retry)', 'src/api/webhooks/razorpayPartner.js', "  if (r.retry) return res.status(500).json({ ok: false });\n", '', '6.1'],
    ];
    for (const [name, file, from, to, cell] of MUT) {
      const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'b227-'));
      fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true, filter: (p) => !p.includes(path.join('src', 'engine')) });
      const src = fs.readFileSync(path.join(tmp, file), 'utf8');
      if (!src.includes(from)) { ok(false, `7 · ${name}: the mutation's anchor is present`); fs.rmSync(tmp, { recursive: true, force: true }); continue; }
      fs.writeFileSync(path.join(tmp, file), src.replace(from, to));
      const r = require('child_process').spawnSync(process.execPath, [__filename], { env: { ...process.env, B227_ROOT: tmp, B227_QUIET: '1', B227_WANT: cell }, encoding: 'utf8', timeout: 60000 });
      ok(() => r.stdout.includes(`RED ${cell}`), `7 · ${name} → §${cell} red`, (r.stdout || r.stderr).slice(-200));
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (process.env.B227_WANT) { console.log(failed.some((x) => x.startsWith(process.env.B227_WANT + ' ')) ? `RED ${process.env.B227_WANT}` : 'NOT RED'); process.exit(0); }
  console.log(`\nb227 · ${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('b227 threw: ' + (e && e.stack)); process.exit(1); });
