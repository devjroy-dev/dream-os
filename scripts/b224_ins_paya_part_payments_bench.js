// scripts/b224_ins_paya_part_payments_bench.js
// TDW · CE-47 · INS · PAY-A · b224 — F-44.320'S CURE, BOTH WAYS (minted for INS; the cure accepted 4 October 2026).
// markMilestonePaid (src/lib/vendor/schedules.js) against an in-memory database (the same chainable fake as b221, which
// throws on any call it does not model): a part payment never marks a scheduled line paid; the line stays pending, keeps
// being the invoice's next due line, and its reminder asks only for what is still owed (paymentReminders.js). §3 puts
// the old behaviour back in a temporary copy and requires the named cells to go red. Reads no wall clock.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const ROOT = process.env.B224_ROOT || path.join(__dirname, '..');
const read = (r) => { try { return fs.readFileSync(path.join(ROOT, r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = []; const Q = !!process.env.B224_QUIET;
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v === true) { pass += 1; if (!Q) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); if (!Q) console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => { if (!Q) console.log(`\n§${t}`); };

function fakeDb(seed) {
  const T = JSON.parse(JSON.stringify(seed)); const files = {}; const log = [];
  let n = 0; const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  function query(table) {
    const f = []; let op = 'select', payload = null, conflict = null, single = false; let order = null;
    const api = {
      select() { return api; }, order(c, o) { order = [c, o && o.ascending !== false]; return api; },
      eq(c, v) { f.push((r) => r[c] === v); return api; }, is(c, v) { f.push((r) => (r[c] ?? null) === v); return api; },
      not(c, o, v) { if (o !== 'is' || v !== null) throw new Error('fake: not() shape'); f.push((r) => (r[c] ?? null) !== null); return api; },
      gte(c, v) { f.push((r) => r[c] >= v); return api; }, lte(c, v) { f.push((r) => r[c] <= v); return api; },
      in() { throw new Error('fake: in() not modelled'); },
      insert(row) { op = 'insert'; payload = row; return api; }, update(row) { op = 'update'; payload = row; return api; },
      upsert(row, o) { op = 'upsert'; payload = row; conflict = o && o.onConflict; return api; },
      maybeSingle() { single = true; return api.then((x) => x); },
      single() { single = true; return api.then((x) => x); },   // b224: markMilestonePaid reads back with .single()
      then(res, rej) {
        try {
          T[table] = T[table] || []; let out;
          if (op === 'insert') { const r = { id: id(), deleted_at: null, confirmed_at: null, reminded_30_on: null, reminded_7_on: null, doc_path: null, doc_mime: null, ...payload }; T[table].push(r); out = [r]; }
          else if (op === 'update') { out = T[table].filter((r) => f.every((g) => g(r))); out.forEach((r) => Object.assign(r, payload)); }
          else if (op === 'upsert') { const ex = T[table].find((r) => r[conflict] === payload[conflict]); if (ex) Object.assign(ex, payload); else T[table].push({ ...payload }); out = [payload]; }
          else { out = T[table].filter((r) => f.every((g) => g(r))); if (order) out = out.slice().sort((a, b) => (a[order[0]] < b[order[0]] ? -1 : 1) * (order[1] ? 1 : -1)); }
          log.push({ table, op });
          const data = single ? (out[0] ? { ...out[0] } : null) : out.map((r) => ({ ...r }));
          return Promise.resolve({ data, error: null }).then(res, rej);
        } catch (e) { return Promise.reject(e).then(res, rej); }
      },
    };
    return api;
  }
  const storage = { from: (b) => ({
    createSignedUploadUrl: async (p) => { log.push({ bucket: b, op: 'upload-url', p }); return { data: { signedUrl: `https://x/${b}/${p}?u`, token: 't' }, error: null }; },
    download: async (p) => (files[p] ? { data: { arrayBuffer: async () => Buffer.from(files[p]) }, error: null } : { data: null, error: { message: 'nf' } }),
    createSignedUrl: async (p, s) => ({ data: { signedUrl: `https://x/${b}/${p}?s=${s}` }, error: null }),
  }) };
  // A MODEL of 0201's pay_record_milestone (the real SQL is proven on Postgres by b225). Tests may replace rpc to throw.
  const rpc = async (name, a) => {
    log.push({ rpc: name });
    if (name !== 'pay_record_milestone') throw new Error('fake: rpc ' + name + ' not modelled');
    const ms = (T.payment_schedules || []).find((m) => m.id === a.p_milestone && m.vendor_id === a.p_vendor);
    if (!ms) return { data: { ok: false, code: 'NO_LINE' }, error: null };
    const inv = (T.invoices || []).find((i) => i.id === ms.invoice_id && i.vendor_id === a.p_vendor);
    if (!inv) return { data: { ok: false, code: 'NO_INVOICE' }, error: null };
    if (inv.state === 'cancelled') return { data: { ok: false, code: 'INVOICE_CANCELLED' }, error: null };
    if (ms.state !== 'pending') return { data: { ok: false, code: 'NOT_PENDING' }, error: null };
    const total = (Number(ms.paid_amount) || 0) + a.p_amount;
    ms.paid_amount = total; if (total >= ms.amount_due) { ms.state = 'paid'; ms.paid_at = a.p_received ? a.p_received + 'T00:00:00+05:30' : new Date().toISOString(); }
    inv.amount_paid += a.p_amount;
    inv.state = inv.amount_paid >= inv.amount_total ? 'paid' : inv.state === 'unpaid' ? 'advance_paid' : inv.state;
    const next = T.payment_schedules.filter((m) => m.invoice_id === inv.id && m.state === 'pending').sort((x, y) => x.ordinal - y.ordinal)[0];
    inv.due_date = next ? next.due_date : null;
    return { data: { ok: true, applied: true, settled: ms.state === 'paid', milestone: { ...ms }, invoice: { ...inv } }, error: null };
  };
  return { db: { from: query, storage, rpc }, T, files, log };
}

const S = (() => { const p = path.join(ROOT, 'src/lib/vendor/schedules.js'); delete require.cache[require.resolve(p)]; return require(p); })();
const V = 'v-224';
const seed = () => ({
  invoices: [{ id: 'inv-1', vendor_id: V, amount_total: 90000, amount_paid: 30000, state: 'advance_paid', due_date: '2026-10-20', deleted_at: null }],
  payment_schedules: [
    { id: 'm-1', invoice_id: 'inv-1', vendor_id: V, ordinal: 1, amount_due: 30000, paid_amount: 30000, due_date: '2026-09-01', state: 'paid', pct: null },
    { id: 'm-2', invoice_id: 'inv-1', vendor_id: V, ordinal: 2, amount_due: 30000, paid_amount: null, due_date: '2026-10-20', state: 'pending', pct: null },
    { id: 'm-3', invoice_id: 'inv-1', vendor_id: V, ordinal: 3, amount_due: 30000, paid_amount: null, due_date: '2026-11-20', state: 'pending', pct: null },
  ],
});

(async () => {
  sec('1  a part payment on a scheduled line (by hand or by link: one door)');
  const f = fakeDb(seed()); const opts = { env: {} };
  const r1 = await S.markMilestonePaid(f.db, V, 'm-2', 10000, '2026-10-07', opts);
  const m2 = () => f.T.payment_schedules.find((m) => m.id === 'm-2'); const inv = () => f.T.invoices[0];
  ok(() => r1.ok === true && m2().state === 'pending', '1.1 a part leaves the line pending (it is NOT marked paid)', JSON.stringify(m2()));
  ok(() => m2().paid_amount === 10000 && !m2().paid_at, '1.2 the part is recorded on the line, with no paid date yet');
  ok(() => inv().amount_paid === 40000 && inv().state === 'advance_paid', '1.3 the invoice still counts the money that came in');
  ok(() => inv().due_date === '2026-10-20', '1.4 the part-paid line is still the invoice\'s next due line');
  const r2 = await S.markMilestonePaid(f.db, V, 'm-2', 20000, '2026-10-08', opts);
  ok(() => r2.ok === true && m2().state === 'paid' && m2().paid_amount === 30000, '1.5 the completing payment marks the line paid, with the full amount', JSON.stringify(m2()));
  ok(() => inv().amount_paid === 60000 && inv().due_date === '2026-11-20', '1.6 then the next line becomes the invoice\'s due date');
  const r3 = await S.markMilestonePaid(f.db, V, 'm-2', 5000, '2026-10-09', opts);
  ok(() => r3.ok === false && r3.code === 'ALREADY_PAID' && inv().amount_paid === 60000, '1.7 a paid line takes no more money');

  sec('2  a payment in full, and an overpayment, in one go');
  const g = fakeDb(seed());
  const r4 = await S.markMilestonePaid(g.db, V, 'm-3', 30000, '2026-10-07', opts);
  ok(() => r4.ok === true && g.T.payment_schedules.find((m) => m.id === 'm-3').state === 'paid', '2.1 the full amount marks the line paid at once');
  const h = fakeDb(seed());
  await S.markMilestonePaid(h.db, V, 'm-2', 35000, '2026-10-07', opts);
  ok(() => h.T.payment_schedules.find((m) => m.id === 'm-2').state === 'paid' && h.T.payment_schedules.find((m) => m.id === 'm-2').paid_amount === 35000, '2.2 more than owed marks it paid and records what came in');

  sec('2b  the wiring: one door in the database, its answers, and NO fallback on an error');
  const k = fakeDb(seed());
  const r5 = await S.markMilestonePaid(k.db, V, 'm-2', 10000, '2026-10-07', opts);
  ok(() => r5.ok === true && k.log.some((l) => l.rpc === 'pay_record_milestone') && !k.log.some((l) => l.table === 'payment_schedules' && l.op === 'update') && !k.log.some((l) => l.table === 'invoices' && l.op === 'update'), '2b.1 the money moves only through pay_record_milestone; this file writes neither table itself');
  const e1 = fakeDb(seed()); e1.db.rpc = async () => { throw new Error('network down'); };
  const before = JSON.stringify(e1.T);
  const r6 = await S.markMilestonePaid(e1.db, V, 'm-2', 10000, '2026-10-07', opts);
  ok(() => r6.ok === false && r6.code === 'RPC_ERROR' && JSON.stringify(e1.T) === before && !e1.log.some((l) => l.op === 'update'), '2b.2 the call throws: it answers RPC_ERROR and changes NOTHING (no JS add as a fallback)', JSON.stringify(r6));
  const e2 = fakeDb(seed()); e2.db.rpc = async () => ({ data: null, error: { message: 'timeout' } });
  const before2 = JSON.stringify(e2.T);
  const r7 = await S.markMilestonePaid(e2.db, V, 'm-2', 10000, '2026-10-07', opts);
  ok(() => r7.ok === false && r7.code === 'RPC_ERROR' && JSON.stringify(e2.T) === before2, '2b.3 the call answers an error: the same, nothing changed');
  const c = fakeDb(seed()); c.T.invoices[0].state = 'cancelled';
  const r8 = await S.markMilestonePaid(c.db, V, 'm-2', 10000, '2026-10-07', opts);
  ok(() => r8.ok === false && r8.error === 'Parent invoice is cancelled.', '2b.4 a cancelled invoice keeps its own words for the vendor');

  const w = fakeDb(seed()); const wb = JSON.stringify(w.T);
  const r9 = await S.markMilestonePaid(w.db, V, 'm-2', 5000.5, '2026-10-07', opts);
  const r10 = await S.markMilestonePaid(w.db, V, 'm-2', -100, '2026-10-07', opts);
  ok(() => r9.ok === false && r9.code === 'BAD_AMOUNT' && r9.error === 'Payment amounts must be whole rupees above zero.' && r10.code === 'BAD_AMOUNT' && !w.log.some((l) => l.rpc) && JSON.stringify(w.T) === wb, '2b.5 not whole rupees above zero: its own plain sentence, BAD_AMOUNT, and NO call to the database', JSON.stringify(r9));
  const s2 = fakeDb(seed());
  const r11 = await S.markMilestonePaid(s2.db, V, 'm-2', '5000', '2026-10-07', opts);
  ok(() => r11.ok === true && s2.T.payment_schedules.find((m) => m.id === 'm-2').paid_amount === 5000, '2b.6 a number sent as a string ("5000") is read as its number, as the door has always allowed');

  sec('3  the reminder asks only for what is still owed');
  const PR = read('src/lib/vendor/paymentReminders.js');
  ok(() => /const stillOwed = Math\.max\(0, \(Number\(milestone\.amount_due\) \|\| 0\) - \(Number\(milestone\.paid_amount\) \|\| 0\)\);/.test(PR) && /composeMilestonePhrase\(milestone\.milestone_label, stillOwed\)/.test(PR), '3.1 the phrase is built from amount_due minus paid_amount');
  ok(() => /\.select\('id, invoice_id, vendor_id, milestone_label, amount_due, paid_amount, due_date, state'\)/.test(PR) && /\.eq\('state', 'pending'\)/.test(PR), '3.2 the sweep reads paid_amount, and still only pending lines (so a part-paid line keeps its reminder)');
  const PRM = (() => { const p = path.join(ROOT, 'src/lib/vendor/paymentReminders.js'); delete require.cache[require.resolve(p)]; return require(p); })();
  ok(() => typeof PRM.composeMilestonePhrase !== 'function' || /20,000/.test(PRM.composeMilestonePhrase('Second instalment', 20000)), '3.3 the words carry the smaller amount in Rs with Indian grouping');

  if (!process.env.B224_ROOT) {
    sec('4  the old behaviour put back, each must turn its named cell red');
    const MUT = [
      // AMENDED BY LABEL (turn 40): the add now lives in 0201 (b225 mutates it there); here, the wiring's own faults.
      // AMENDED BY LABEL (R-47.1, CE-47 INS): the anchor follows the line's new words, "TDW could not record the payment."
      ['a fallback to a JS add on an rpc error', 'src/lib/vendor/schedules.js', "    return { ok: false, error: 'TDW could not record the payment. Please try again.', code: 'RPC_ERROR', detail: e && e.message };", "    await supabase.from('payment_schedules').update({ state: 'paid' }).eq('id', milestoneId).eq('vendor_id', vendorId); return { ok: true };", '2b.2'],
      ['the reminder asks for the whole line again', 'src/lib/vendor/paymentReminders.js', 'composeMilestonePhrase(milestone.milestone_label, stillOwed)', 'composeMilestonePhrase(milestone.milestone_label, milestone.amount_due)', '3.1'],
      ['a fraction let through to the database', 'src/lib/vendor/schedules.js', "  if (!Number.isInteger(amt) || amt <= 0) return", "  if (!(amt > 0)) return", '2b.5'],
      ['the money written by this file again', 'src/lib/vendor/schedules.js', "    rec = await supabase.rpc('pay_record_milestone',", "    await supabase.from('invoices').update({ amount_paid: 0 }).eq('id', inv.id).eq('vendor_id', vendorId);\n    rec = await supabase.rpc('pay_record_milestone',", '2b.1'],
    ];
    for (const [name, file, from, to, cell] of MUT) {
      const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'b224-'));
      fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true, filter: (p) => !p.includes(path.join('src', 'engine')) });
      fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(tmp, 'node_modules'));
      const src = fs.readFileSync(path.join(tmp, file), 'utf8');
      if (!src.includes(from)) { ok(false, `4 · ${name}: the mutation's anchor is present`); continue; }
      fs.writeFileSync(path.join(tmp, file), src.replace(from, to));
      const r = require('child_process').spawnSync(process.execPath, [__filename], { env: { ...process.env, B224_ROOT: tmp, B224_QUIET: '1', B224_WANT: cell }, encoding: 'utf8', timeout: 60000 });
      ok(() => r.stdout.includes(`RED ${cell}`), `4 · ${name} → §${cell} red`, (r.stdout || r.stderr).slice(-200));
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (process.env.B224_WANT) { console.log(failed.some((n) => n.startsWith(process.env.B224_WANT + ' ')) ? `RED ${process.env.B224_WANT}` : 'NOT RED'); process.exit(0); }
  console.log(`\nb224 · ${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('b224 threw: ' + (e && e.stack)); process.exit(1); });
