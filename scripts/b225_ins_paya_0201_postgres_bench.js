// scripts/b225_ins_paya_0201_postgres_bench.js
// TDW · CE-47 · INS · PAY-A · b225 — 0201 ON A REAL POSTGRES, FRESH EACH RUN, WITH ONE MUTATION PER CURE.
// CONTAINER PROOF. If no Postgres server binaries are found it prints NOT RUN and exits 2: never green. The founder's
// database is the judge: docs/handovers/PAYA_0201_SUPABASE_CHECK.sql (eight true/false columns).
// Each run: initdb in a temporary folder, a private socket and port, the estate's columns for invoices and
// payment_schedules (docs/db/PUBLIC_SCHEMA.md), then 0201 VERBATIM, then the cells. Each mutation gets its own fresh
// database with a mutated copy of 0201. The server is always stopped (bounded), the folder removed.
// e-275: the interleave and lock-order cells wait on the other session's exit (bounded), never on a fixed pause for a
// verdict; the one pg_sleep inside SQL only holds a transaction open so the other session must wait on its lock.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const MIG = fs.readFileSync(path.join(ROOT, 'db/migrations/0201_payment_links.sql'), 'utf8');
// 0202 rides on 0201 (the chair, turn 48): single-use connect states, their sweep, part payment, the refund take-off.
const MIG2 = fs.readFileSync(path.join(ROOT, 'db/migrations/0202_pay_oauth_states.sql'), 'utf8');
let pass = 0, fail = 0; const failed = []; const Q = !!process.env.B225_QUIET;
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v === true) { pass += 1; if (!Q) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); if (!Q) console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => { if (!Q) console.log(`\n§${t}`); };

// B225_PG_BIN names the one folder to look in (for proving the refusal path); otherwise the usual places.
const BIN = (() => { if (process.env.B225_PG_BIN) return (fs.existsSync(path.join(process.env.B225_PG_BIN, 'initdb')) && fs.existsSync(path.join(process.env.B225_PG_BIN, 'pg_ctl'))) ? process.env.B225_PG_BIN : null;
  for (const b of ['/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/usr/local/pgsql/bin', '/opt/homebrew/bin', '/usr/local/bin']) {
  if (fs.existsSync(path.join(b, 'initdb')) && fs.existsSync(path.join(b, 'pg_ctl'))) return b; } return null; })();
// r2 (the chair, train 12): "cannot read its subject" is a REFUSAL, exit 3 (the floor's table: 0 green, 1 red, 2 error,
// 3 refused). Never green; and never an ERROR, which would be a delta on a machine that simply has no Postgres.
if (!BIN) { console.log('b225 · NOT RUN: no Postgres server binaries here (initdb, pg_ctl). This is container proof; the founder\'s judge is PAYA_0201_SUPABASE_CHECK.sql.'); process.exit(3); }
// e-275 CEILING. The floor sets no per-bench cap by default (run-floor.sh :46, LESSON 3: a bench killed mid-write is the
// silent failure). b225 bounds itself: past 40 minutes it stops every Postgres it started, says why, and exits 1 (red),
// never 0. A whole run here takes about 13 minutes.
const LIVE = new Set();
const CEILING_MS = Number(process.env.B225_CEILING_MS || 40 * 60 * 1000);
setTimeout(() => {
  for (const d of LIVE) { try { cp.spawnSync(...(process.getuid && process.getuid() === 0 ? ['su', ['postgres', '-s', '/bin/sh', '-c', `'${BIN}/pg_ctl' -D '${d}' -m immediate stop`]] : ['/bin/sh', ['-c', `'${BIN}/pg_ctl' -D '${d}' -m immediate stop`]]), { timeout: 30000 }); } catch (_e) { /* gone */ } try { fs.rmSync(path.dirname(d), { recursive: true, force: true }); } catch (_e) { /* gone */ } }
  console.log(`b225 · STOPPED: over its own ${Math.round(CEILING_MS / 1000)}-second ceiling; every Postgres it started was stopped. A hang is not green.`); process.exit(1);
}, CEILING_MS).unref();
const ROOTUSER = process.getuid && process.getuid() === 0;
const asPg = (cmd) => (ROOTUSER ? ['su', ['postgres', '-s', '/bin/sh', '-c', cmd]] : ['/bin/sh', ['-c', cmd]]);
const run = (cmd, timeout = 60000) => { const [c, a] = asPg(cmd); return cp.spawnSync(c, a, { encoding: 'utf8', timeout }); };
const runBg = (cmd) => { const [c, a] = asPg(cmd); return cp.spawn(c, a, { stdio: ['ignore', 'pipe', 'pipe'] }); };
const waitExit = (child, ms) => new Promise((res) => { let out = ''; child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  const t = setTimeout(() => { try { child.kill('SIGKILL'); } catch (_e) { /* gone */ } res({ code: -1, out }); }, ms); child.on('exit', (code) => { clearTimeout(t); res({ code, out }); }); });

const SCHEMA = `
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; END $$;
CREATE TABLE public.vendors (id uuid PRIMARY KEY);
CREATE TABLE public.invoices (id uuid PRIMARY KEY, vendor_id uuid NOT NULL, invoice_number text, client_name text, amount_total integer NOT NULL,
  amount_paid integer NOT NULL DEFAULT 0, state text NOT NULL DEFAULT 'unpaid', due_date date, updated_at timestamptz DEFAULT now());
CREATE TABLE public.payment_schedules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id uuid NOT NULL, vendor_id uuid NOT NULL,
  milestone_label text NOT NULL DEFAULT 'x', pct numeric(5,2) NOT NULL DEFAULT 0, amount_due integer NOT NULL, due_date date,
  state text NOT NULL DEFAULT 'pending', paid_at timestamptz, paid_amount integer, ordinal integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
`;
const Vd = '00000000-0000-4000-8000-000000000225', Vo = '00000000-0000-4000-8000-000000000226';
const SEED = `INSERT INTO vendors VALUES ('${Vd}'), ('${Vo}');
INSERT INTO invoices (id, vendor_id, amount_total, amount_paid, state, due_date) VALUES
 ('10000000-0000-4000-8000-000000000001','${Vd}',90000,30000,'advance_paid','2026-10-20'),
 ('10000000-0000-4000-8000-000000000002','${Vd}',10000,0,'cancelled','2026-12-01');
INSERT INTO payment_schedules (id, invoice_id, vendor_id, amount_due, due_date, state, paid_amount, ordinal) VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','${Vd}',30000,'2026-09-01','paid',30000,1),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','${Vd}',30000,'2026-10-20','pending',NULL,2),
 ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','${Vd}',30000,'2026-11-20','pending',NULL,3),
 ('20000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000002','${Vd}',10000,'2026-12-01','pending',NULL,1);`;
const INV = '10000000-0000-4000-8000-000000000001', CINV = '10000000-0000-4000-8000-000000000002';
const L1 = '20000000-0000-4000-8000-000000000001', L2 = '20000000-0000-4000-8000-000000000002', CL = '20000000-0000-4000-8000-000000000009';

async function withDb(migrationText, body, opts = {}) {
  // As root the server runs as `postgres`, which must be able to reach the folder: then the folder sits beside the repo
  // (its parent must be traversable), never under a private home. Otherwise TMPDIR, as every bench.
  const base = ROOTUSER ? path.join(ROOT, '..', '.b225') : (process.env.TMPDIR || os.tmpdir());
  fs.mkdirSync(base, { recursive: true });
  const dir = fs.mkdtempSync(path.join(base, 'b225-'));
  const port = 56000 + (process.pid % 2000) + Math.floor(Math.random() * 1000);
  if (ROOTUSER) cp.spawnSync('chown', ['-R', 'postgres', dir]);
  const data = path.join(dir, 'data'); let started = false;
  try {
    const i = run(`'${BIN}/initdb' -D '${data}' -A trust > '${dir}/initdb.log' 2>&1`, 120000);
    if (i.status !== 0) return { error: 'initdb failed' };
    const s = run(`'${BIN}/pg_ctl' -D '${data}' -w -t 60 -o "-p ${port} -k '${dir}' -c listen_addresses=''" -l '${dir}/server.log' start > /dev/null 2>&1`, 90000);
    if (s.status !== 0) return { error: 'server did not start' }; started = true; LIVE.add(data);
    const psqlBin = fs.existsSync(path.join(BIN, 'psql')) ? path.join(BIN, 'psql') : 'psql';
    const sql = (q, timeout) => { fs.writeFileSync(path.join(dir, 'q.sql'), q); if (ROOTUSER) cp.spawnSync('chown', ['postgres', path.join(dir, 'q.sql')]);
      const r = run(`'${psqlBin}' -h '${dir}' -p ${port} -U postgres -d postgres -q -tA -v ON_ERROR_STOP=1 -f '${dir}/q.sql' 2>&1`, timeout || 60000); return (r.stdout || '').trim(); };
    const bg = (q) => { const f = path.join(dir, `bg${Math.random().toString(36).slice(2)}.sql`); fs.writeFileSync(f, q); if (ROOTUSER) cp.spawnSync('chown', ['postgres', f]);
      return runBg(`'${psqlBin}' -h '${dir}' -p ${port} -U postgres -d postgres -q -tA -f '${f}' 2>&1`); };
    const mig2 = process.env.B225_MUTATED2 ? fs.readFileSync(process.env.B225_MUTATED2, 'utf8') : MIG2;
    const setup = sql(SCHEMA + migrationText + (opts.skip0202 ? '' : mig2) + SEED, 120000);
    if (opts.skip0202) return await body({ sql, bg, setup, mig2, log: () => '' });
    return await body({ sql, bg, setup, log: () => { try { return fs.readFileSync(path.join(dir, 'server.log'), 'utf8'); } catch { return ''; } } });
  } finally {
    if (started) { run(`'${BIN}/pg_ctl' -D '${data}' -w -t 30 -m fast stop > /dev/null 2>&1`, 45000); LIVE.delete(data); }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
const j = (s) => { try { return JSON.parse(s.split('\n').filter(Boolean).pop()); } catch { return null; } };
const MS = (amt, id, extra = '') => `select pay_record_milestone('${Vd}','${id}',${amt},'2026-10-07'${extra});`;

async function cells(mig) {
  return withDb(mig, async ({ sql, bg, log }) => {
    sec('1  once only, the add, money kept, the hand path');
    const a = j(sql(MS(10000, L2, ",'razorpay','pA'"))); const b = j(sql(MS(10000, L2, ",'razorpay','pA'")));
    const l2 = sql(`select paid_amount||'|'||state from payment_schedules where id='${L2}';`);
    ok(() => a && a.applied === true && a.milestone && a.milestone.state === 'pending', '1.1 a part leaves the line pending', JSON.stringify(a));
    ok(() => b && b.duplicate === true && l2 === '10000|pending', '1.2 the same payment id twice: counted once', `${JSON.stringify(b)} ${l2}`);
    const c = j(sql(MS(20000, L2, ",'razorpay','pB'")));
    ok(() => c && c.settled === true && sql(`select amount_paid||'|'||due_date from invoices where id='${INV}';`) === '60000|2026-11-20', '1.3 the add reaches paid; the invoice moves with it');
    const d = j(sql(MS(5000, L1, ",'razorpay','pLate'")));
    const ev = sql(`select applied||'|'||not_applied_reason from vendor_pay_events where provider_payment_id='pLate';`);
    ok(() => d && d.ok === true && d.applied === false && d.code === 'NOT_PENDING' && ev === 'false|NOT_PENDING', '1.4 a link payment on a paid line is KEPT, not applied, NOT_PENDING', `${JSON.stringify(d)} ${ev}`);
    const h = j(sql(MS(5000, L1)));
    ok(() => h && h.ok === false && h.code === 'NOT_PENDING', '1.5 the hand path on a paid line is refused and leaves no event');

    sec('2  cancelled, the reasons, the guards');
    const cc = j(sql(MS(10000, CL, ",'razorpay','pCanc'")));
    const cs = sql(`select (select state||'|'||amount_paid from invoices where id='${CINV}')||'|'||(select state from payment_schedules where id='${CL}');`);
    ok(() => cc && cc.applied === false && cc.code === 'INVOICE_CANCELLED' && cs === 'cancelled|0|pending', '2.1 a link payment on a cancelled invoice is kept; the invoice and line do not move', `${JSON.stringify(cc)} ${cs}`);
    const ch = j(sql(MS(10000, CL)));
    ok(() => ch && ch.ok === false && ch.code === 'INVOICE_CANCELLED', '2.2 the hand path on a cancelled invoice answers INVOICE_CANCELLED');
    sql(`select pay_settle_invoice('${Vd}','${CINV}',10000);`);
    ok(() => sql(`select state||'|'||amount_paid from invoices where id='${CINV}';`) === 'cancelled|0', '2.3 pay_settle_invoice never moves a cancelled invoice, whoever calls it');
    const ni = j(sql(`select pay_record_invoice('${Vo}','${INV}',100,null,'razorpay','pNI');`));
    const niv = sql(`select not_applied_reason||'|'||coalesce(invoice_id::text,'null') from vendor_pay_events where provider_payment_id='pNI';`);
    ok(() => ni && ni.code === 'NO_INVOICE' && niv === 'NO_INVOICE|null', '2.4 another vendor\'s invoice: NO_INVOICE, and the event never carries that invoice\'s id', `${JSON.stringify(ni)} ${niv}`);
    const nl = j(sql(`select pay_record_milestone('${Vd}','99999999-0000-4000-8000-000000000000',100,null,'razorpay','pNL');`));
    ok(() => nl && nl.code === 'NO_LINE' && sql(`select not_applied_reason from vendor_pay_events where provider_payment_id='pNL';`) === 'NO_LINE', '2.5 no such line: NO_LINE, apart from NOT_PENDING');
    ok(() => j(sql(`select pay_record_milestone('${Vd}','${L2}',100,null,NULL,'x');`)).code === 'NO_PROVIDER', '2.6 a payment id with no provider is an answer, not an error');
    ok(() => sql(`select has_function_privilege('anon','pay_record_milestone(uuid,uuid,integer,date,text,text,uuid,text)','execute')||'|'||has_function_privilege('authenticated','pay_record_invoice(uuid,uuid,integer,date,text,text,uuid,text)','execute')||'|'||has_function_privilege('service_role','pay_record_milestone(uuid,uuid,integer,date,text,text,uuid,text)','execute');`) === 'false|false|true', '2.7 only the server\'s role may call them');

    sec('2c  0202: single-use states, the sweep, part payment, the refund take-off');
    sql(`insert into vendor_pay_oauth_states (nonce, vendor_id, session_id, expires_at) values ('nonce-0000000000001','${Vd}','s1', now() + interval '10 minutes'), ('nonce-0000000000002','${Vd}','s1', now() - interval '2 days');`);
    const spend = () => sql(`update vendor_pay_oauth_states set spent_at = now() where nonce = 'nonce-0000000000001' and vendor_id = '${Vd}' and session_id = 's1' and spent_at is null and expires_at > now() returning nonce;`);
    ok(() => spend() === 'nonce-0000000000001' && spend() === '', '2c.1 a state is spent once; the second spend finds nothing');
    ok(() => sql(`update vendor_pay_oauth_states set spent_at = now() where nonce = 'nonce-0000000000002' and spent_at is null and expires_at > now() returning nonce;`) === '', '2c.2 an expired state cannot be spent');
    ok(() => sql(`select pay_sweep_oauth_states();`) === '1' && sql(`select count(*) from vendor_pay_oauth_states;`) === '1', '2c.3 the sweep removes the state two days expired, and leaves the fresh one');
    ok(() => sql(`insert into vendor_pay_settings (vendor_id) values ('${Vd}') returning accept_partial::text;`) === 'false', '2c.4 part payment on whole-invoice links is off unless she turns it on');
    sql(`insert into invoices (id,vendor_id,amount_total,amount_paid,state,due_date) values ('60000000-0000-4000-8000-000000000001','${Vd}',60000,0,'unpaid','2026-12-01');
         insert into payment_schedules (id,invoice_id,vendor_id,amount_due,due_date,state,ordinal) values ('61000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','${Vd}',30000,'2026-12-01','pending',1),('61000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001','${Vd}',30000,'2027-01-01','pending',2);`);
    sql(MS(30000, '61000000-0000-4000-8000-000000000001', ",'razorpay','q1'")); sql(MS(20000, '61000000-0000-4000-8000-000000000002', ",'razorpay','q2'"));
    sql(`insert into vendor_pay_events (vendor_id,provider,provider_payment_id,kind,milestone_id,invoice_id,amount,applied) values ('${Vd}','razorpay','rq1','refunded','61000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',5000,false);`);
    const t1 = j(sql(`select pay_take_off_refund('${Vd}','razorpay','rq1');`)); const t2 = j(sql(`select pay_take_off_refund('${Vd}','razorpay','rq1');`));
    const s60 = () => sql(`select string_agg(ordinal||':'||coalesce(paid_amount,0)||':'||state, ',' order by ordinal) from payment_schedules where invoice_id='60000000-0000-4000-8000-000000000001';`);
    const i60 = () => sql(`select amount_paid||'|'||state||'|'||coalesce(due_date::text,'null') from invoices where id='60000000-0000-4000-8000-000000000001';`);
    ok(() => t1 && t1.ok === true && t2 && t2.code === 'ALREADY_TAKEN_OFF' && s60() === '1:25000:pending,2:20000:pending' && i60() === '45000|advance_paid|2026-12-01', '2c.5 a line refund comes off its own line ONCE; the line goes back to pending; the invoice and due date re-decided', `${s60()} ${i60()}`);
    sql(`insert into vendor_pay_events (vendor_id,provider,provider_payment_id,kind,invoice_id,amount,applied) values ('${Vd}','razorpay','rq2','refunded','60000000-0000-4000-8000-000000000001',60000,false);`);
    const t3 = j(sql(`select pay_take_off_refund('${Vd}','razorpay','rq2');`));
    ok(() => t3 && t3.ok === true && s60() === '1:0:pending,2:0:pending' && i60() === '0|unpaid|2026-12-01', '2c.6 a whole-invoice refund larger than what was paid comes off the last lines first and never goes below zero; the invoice back to unpaid', `${s60()} ${i60()}`);
    sql(`insert into vendor_pay_events (vendor_id,provider,provider_payment_id,kind,invoice_id,amount,applied) values ('${Vd}','razorpay','rqc','refunded','${CINV}',100,false);`);
    const tc = j(sql(`select pay_take_off_refund('${Vd}','razorpay','rqc');`));
    ok(() => tc && tc.code === 'INVOICE_CANCELLED' && sql(`select applied::text from vendor_pay_events where provider_payment_id='rqc';`) === 'false' && sql(`select state||'|'||amount_paid from invoices where id='${CINV}';`) === 'cancelled|0', '2c.7 a cancelled invoice refuses the take-off; the refund stays waiting, the invoice unmoved');
    ok(() => j(sql(`select pay_take_off_refund('${Vo}','razorpay','rq1');`)).code === 'NO_REFUND' && sql(`select has_function_privilege('anon','pay_take_off_refund(uuid,text,text)','execute')::text;`) === 'false', '2c.8 another vendor cannot take off her refund; only the server may call it');

    sec('2d  (b) a payment on a binder-only invoice: the real functions, and the JS apply driven against them');
    // The JS half (payLinks.applyBinderEvent) is run against the REAL 0202 functions through a one-line rpc adapter; the
    // binder (engine.records) is an in-memory record whose write can be made to fail, or to "die" after landing.
    const PL = require(path.join(ROOT, 'src/lib/vendor/payLinks.js'));
    const lit = (v) => v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
    const rpc = async (name, a) => { const out = sql(`select public.${name}(${Object.entries(a).map(([k, v]) => `${k} => ${lit(v)}`).join(', ')});`);
      if (out === 't' || out === 'f') return { data: out === 't', error: null }; try { return { data: JSON.parse(out), error: null }; } catch { return { data: null, error: { message: out } }; } };
    const BND = '72000000-0000-4000-8000-000000000001';
    const binder = { amount: 50000, amount_received: 10000, writes: 0, failNext: false, dieAfter: false };
    const bdeps = { read: async () => ({ id: BND, amount: binder.amount, amount_received: binder.amount_received }),
      write: async (_id, received) => { if (binder.failNext) { binder.failNext = false; return { ok: false, error: 'engine down' }; }
        binder.amount_received = received; binder.writes += 1; if (binder.dieAfter) { binder.dieAfter = false; throw new Error('process died after the write'); } return { ok: true }; } };
    const D = { supabase: { rpc }, binder: bdeps };
    const evId = (pid) => sql(`select id from vendor_pay_events where provider_payment_id='${pid}';`);
    const evRow = (pid) => sql(`select applied::text||':'||coalesce(not_applied_reason,'-')||':'||coalesce(binder_base_received::text,'-')||':'||(claimed_at is not null)::text from vendor_pay_events where provider_payment_id='${pid}';`);
    const h1 = j(sql(`select pay_hold_binder_payment('${Vd}','${BND}',5000,'razorpay','bA');`)); const h1b = j(sql(`select pay_hold_binder_payment('${Vd}','${BND}',5000,'razorpay','bA');`));
    ok(() => h1.held === true && h1b.duplicate === true && evRow('bA') === 'false:BINDER_PENDING:-:false', '2d.1 a binder payment is HELD first, once only; not applied, not claimed', evRow('bA'));
    binder.failNext = true;
    const a1 = await PL.applyBinderEvent(Vd, evId('bA'), D);
    ok(() => a1.outcome === 'failed' && binder.amount_received === 10000 && evRow('bA') === 'false:BINDER_PENDING:10000:false', '2d.2 the engine fails: nothing on the binder, the event still held (base kept), the claim released for the sweep', `${a1.outcome} ${evRow('bA')}`);
    const a2 = await PL.applyBinderEvent(Vd, evId('bA'), D);
    ok(() => a2.outcome === 'applied' && binder.amount_received === 15000 && binder.writes === 1 && evRow('bA') === 'true:-:10000:false', '2d.3 the retry writes base + amount once and flips', `${a2.outcome} ${binder.amount_received} ${evRow('bA')}`);
    // a crash AFTER the write, before the flip: the claim goes stale; the retry finds base + amount and only flips
    sql(`select pay_hold_binder_payment('${Vd}','${BND}',3000,'razorpay','bB');`);
    // The engine call lands, then THROWS (a timeout after success, or the process dying): the apply cannot tell, so it
    // releases the claim and says failed; the retry must find base + amount and only flip.
    binder.dieAfter = true;
    const a3a = await PL.applyBinderEvent(Vd, evId('bB'), D);
    const a3 = await PL.applyBinderEvent(Vd, evId('bB'), D);
    ok(() => a3a.outcome === 'failed' && a3.outcome === 'flipped_only' && binder.amount_received === 18000 && binder.writes === 2 && evRow('bB') === 'true:-:15000:false', '2d.4 the write landed, then the call threw: the retry keeps the stored base, sees base + amount, and flips with NO second write', `${a3a.outcome} ${a3.outcome} ${binder.amount_received} ${binder.writes} ${evRow('bB')}`);
    sql(`select pay_hold_binder_payment('${Vd}','${BND}',1500,'razorpay','bS');`);
    const cl = j(sql(`select pay_claim_binder_event('${Vd}','${evId('bS')}');`)); sql(`select pay_keep_binder_base('${Vd}','${evId('bS')}',${binder.amount_received});`);
    binder.amount_received += 1500; binder.writes += 1;                          // the write landed, then the process died: no flip, no release
    const stillLive = await PL.applyBinderEvent(Vd, evId('bS'), D);             // inside 5 minutes the claim is live: nobody else may apply
    sql(`update vendor_pay_events set claimed_at = now() - interval '6 minutes' where provider_payment_id='bS';`);
    const wB = binder.writes; const as = await PL.applyBinderEvent(Vd, evId('bS'), D);
    ok(() => cl.ok && stillLive.outcome === 'not_claimed' && as.outcome === 'flipped_only' && binder.writes === wB && evRow('bS').startsWith('true'), '2d.4b a claim gone stale AFTER its write (the process died): live, nobody else applies; stale, the retry flips with no second write', `${stillLive.outcome} ${as.outcome}`);
    // someone else moved the binder (a hand entry) between the base and the retry: uncertain, never guessed
    sql(`select pay_hold_binder_payment('${Vd}','${BND}',2000,'razorpay','bC');`);
    binder.dieAfter = false; binder.failNext = true; const baseC = binder.amount_received; await PL.applyBinderEvent(Vd, evId('bC'), D);   // base kept, write failed
    binder.amount_received += 1000;                                                                   // a hand entry of 1000
    const a4 = await PL.applyBinderEvent(Vd, evId('bC'), D);
    ok(() => a4.outcome === 'uncertain' && binder.amount_received === baseC + 1000 && evRow('bC') === `false:BINDER_UNCERTAIN:${baseC}:false`, '2d.5 the binder moved by someone else: held as BINDER_UNCERTAIN, nothing written, nothing guessed', `${a4.outcome} ${evRow('bC')}`);
    const claimU = j(sql(`select pay_claim_binder_event('${Vd}','${evId('bC')}');`));
    ok(() => claimU && claimU.ok === false, '2d.6 an uncertain payment cannot be claimed: no sweep or apply ever answers it');
    // her answers, two rounds: 'added' (fresh claim, fresh base) ends uncertain again → a new question → 'already_on'
    const r1 = j(sql(`select pay_resolve_binder_event('${Vd}','${evId('bC')}','added','${Vd}');`));
    binder.failNext = true; await PL.applyBinderEvent(Vd, evId('bC'), D);   // fresh base 19000 kept, write failed
    binder.amount_received += 2500; const finalC = binder.amount_received;  // she typed 2500 in by hand meanwhile (not this payment's 2000)
    const a5 = await PL.applyBinderEvent(Vd, evId('bC'), D);
    const r2 = j(sql(`select pay_resolve_binder_event('${Vd}','${evId('bC')}','already_on','${Vd}');`));
    const r2b = j(sql(`select pay_resolve_binder_event('${Vd}','${evId('bC')}','already_on','${Vd}');`));
    ok(() => r1.round === 1 && a5.outcome === 'uncertain' && r2.round === 2 && r2b.code === 'NOT_UNCERTAIN' && binder.amount_received === finalC && evRow('bC').startsWith('true:-')
      && sql(`select string_agg(round||'='||action, ',' order by round) from vendor_pay_event_answers where event_id='${evId('bC')}';`) === '1=added,2=already_on',
      '2d.7 uncertain → added → uncertain again → already_on: a new round each time, both rounds kept, no write; never stuck', `${JSON.stringify(r1)} ${a5.outcome} ${JSON.stringify(r2)}`);
    // one apply per binder at a time, two sessions: A holds a claim inside its transaction; B on the SAME binder is seen
    // waiting on the binder's lock, then refused; after A applies, the sweep's apply takes B; none lost, none twice
    sql(`select pay_hold_binder_payment('${Vd}','${BND}',1000,'razorpay','bD'); select pay_hold_binder_payment('${Vd}','${BND}',4000,'razorpay','bE');`);
    const seen2 = async (q, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (sql(q) === 't') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
    const H = bg(`set application_name = 'b225H2'; select pg_advisory_lock(226); select pg_sleep(60);`);
    const hHolds = await seen2(`select exists (select 1 from pg_locks l join pg_stat_activity a on a.pid = l.pid where a.application_name = 'b225H2' and l.locktype = 'advisory' and l.granted)`);
    const A = bg(`set application_name = 'b225A2'; BEGIN; select pay_claim_binder_event('${Vd}','${evId('bD')}'); select pg_advisory_lock(226); COMMIT;`);
    const aHolds = hHolds && await seen2(`select exists (select 1 from pg_stat_activity where application_name = 'b225A2' and wait_event_type = 'Lock' and xact_start is not null)`);
    const B = aHolds ? bg(`set application_name = 'b225B2'; select pay_claim_binder_event('${Vd}','${evId('bE')}');`) : null;
    const bWaits = !!B && await seen2(`select exists (select 1 from pg_stat_activity where application_name = 'b225B2' and wait_event_type = 'Lock')`);
    sql(`select pg_terminate_backend(pid) from pg_stat_activity where application_name = 'b225H2';`);
    const [ra, rb] = await Promise.all([waitExit(A, 30000), B ? waitExit(B, 30000) : Promise.resolve({ code: -2, out: '' })]); await waitExit(H, 10000);
    const bRefused = /NOT_CLAIMED/.test(rb.out);
    const before = binder.amount_received;
    const aDone = await PL.applyBinderEvent(Vd, evId('bD'), D);   // A's event: its claim is live from the session above; re-claim refused, so...
    sql(`update vendor_pay_events set claimed_at = now() - interval '6 minutes' where provider_payment_id='bD';`);   // ...A's process "ended"; its claim goes stale
    const aRun = await PL.applyBinderEvent(Vd, evId('bD'), D);
    const bRun = await PL.applyBinderEvent(Vd, evId('bE'), D);    // the sweep's turn for B
    ok(() => hHolds && aHolds && bWaits && bRefused && aDone.outcome === 'not_claimed' && aRun.outcome === 'applied' && bRun.outcome === 'applied' && binder.amount_received === before + 5000
      && evRow('bD').startsWith('true') && evRow('bE').startsWith('true'),
      '2d.8 two applies on one binder: B SEEN waiting on the binder lock, then refused while A holds; later both on the binder once each, none lost', JSON.stringify({ hHolds, aHolds, bWaits, bRefused, a: aDone.outcome, ar: aRun.outcome, br: bRun.outcome, recv: binder.amount_received, before }));
    ok(() => sql(`select has_function_privilege('anon','pay_claim_binder_event(uuid,uuid)','execute')::text;`) === 'false' && sql(`select has_function_privilege('authenticated','pay_resolve_binder_event(uuid,uuid,text,uuid)','execute')::text;`) === 'false',
      '2d.9 only the server may call (b)\'s functions');

    sec('2b  parity: every invoice state markMilestonePaid\'s JS could reach, now decided by the function');
    sql(`insert into invoices (id,vendor_id,amount_total,amount_paid,state,due_date) values ('40000000-0000-4000-8000-000000000001','${Vd}',20000,0,'unpaid','2026-12-01'),('40000000-0000-4000-8000-000000000002','${Vd}',10000,0,'unpaid','2026-12-01');
         insert into payment_schedules (id,invoice_id,vendor_id,amount_due,due_date,state,ordinal) values
          ('41000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','${Vd}',10000,'2026-12-01','pending',1),
          ('41000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','${Vd}',10000,'2027-01-01','pending',2),
          ('41000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','${Vd}',10000,'2026-12-01','pending',1);`);
    const st = (id) => sql(`select state||'|'||amount_paid||'|'||coalesce(due_date::text,'null') from invoices where id='${id}';`);
    sql(MS(4000, '41000000-0000-4000-8000-000000000001'));
    ok(() => st('40000000-0000-4000-8000-000000000001') === 'advance_paid|4000|2026-12-01', '2b.1 unpaid → advance_paid on a part; the due date stays on the part-paid line');
    sql(MS(6000, '41000000-0000-4000-8000-000000000001'));
    ok(() => st('40000000-0000-4000-8000-000000000001') === 'advance_paid|10000|2027-01-01', '2b.2 advance_paid stays advance_paid; the due date moves to the next line');
    sql(MS(10000, '41000000-0000-4000-8000-000000000002'));
    ok(() => st('40000000-0000-4000-8000-000000000001') === 'paid|20000|null', '2b.3 the last line paid: the invoice is paid, its due date null');
    sql(MS(13000, '41000000-0000-4000-8000-000000000003'));
    ok(() => st('40000000-0000-4000-8000-000000000002') === 'paid|13000|null' && sql(`select state||'|'||paid_amount from payment_schedules where id='41000000-0000-4000-8000-000000000003';`) === 'paid|13000', '2b.4 overpaid: paid, and the whole amount recorded as received');

    sec('3  one step and one lock order, two sessions at once (no fixed pause: each step waits on what it SEES)');
    // e-275 (the chair, turn 39): the second session starts only when the bench has SEEN the first inside its
    // transaction, holding its rows; and the cell asserts the second was SEEN WAITING on a lock before the first commits.
    // The first is held open by an advisory lock the bench owns through a third session (H), released by ending H.
    const seen = async (q, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (sql(q) === 't') return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
    const app = (n) => `select coalesce(bool_or(true), false) from pg_stat_activity where application_name = '${n}'`;
    async function interleave(first, second) {
      const H = bg(`set application_name = 'b225H'; select pg_advisory_lock(225); select pg_sleep(60);`);
      const hHolds = await seen(`select exists (select 1 from pg_locks l join pg_stat_activity a on a.pid = l.pid where a.application_name = 'b225H' and l.locktype = 'advisory' and l.granted)`);
      const A = bg(`set application_name = 'b225A'; BEGIN; ${first} select pg_advisory_lock(225); COMMIT;`);
      const aHolds = hHolds && await seen(`select exists (select 1 from pg_stat_activity where application_name = 'b225A' and wait_event_type = 'Lock' and xact_start is not null)`);
      const B = aHolds ? bg(`set application_name = 'b225B'; ${second}`) : null;
      const bWaits = !!B && await seen(`select exists (select 1 from pg_stat_activity where application_name = 'b225B' and wait_event_type = 'Lock')`);
      sql(`select pg_terminate_backend(pid) from pg_stat_activity where application_name = 'b225H';`);
      const rs = await Promise.all([waitExit(A, 30000), B ? waitExit(B, 30000) : Promise.resolve({ code: -2, out: 'B never started' })]);
      await waitExit(H, 10000);
      return { hHolds, aHolds, bWaits, ra: rs[0], rb: rs[1] };
    }
    sql(`insert into invoices (id,vendor_id,amount_total,amount_paid,state) values ('30000000-0000-4000-8000-000000000001','${Vd}',60000,0,'unpaid');
         insert into payment_schedules (id,invoice_id,vendor_id,amount_due,state,ordinal) values ('31000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','${Vd}',30000,'pending',1),('31000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','${Vd}',30000,'pending',2);`);
    const x = await interleave(`select pay_record_milestone('${Vd}','31000000-0000-4000-8000-000000000001',15000,null,'razorpay','iA');`,
                               `select pay_record_milestone('${Vd}','31000000-0000-4000-8000-000000000001',5000,null,'razorpay','iB');`);
    ok(() => x.hHolds && x.aHolds && x.bWaits, '3.0 the second payment was SEEN waiting on a lock while the first was SEEN inside its transaction (a sighting missed is a STOP, not a pass)', JSON.stringify({ h: x.hHolds, a: x.aHolds, b: x.bWaits }));
    ok(() => x.bWaits && x.ra.code === 0 && x.rb.code === 0 && sql(`select paid_amount from payment_schedules where id='31000000-0000-4000-8000-000000000001';`) === '20000', '3.1 two payments on one line at once: both added, none lost', `${x.ra.out} ${x.rb.out}`);
    const y = await interleave(`select pay_record_milestone('${Vd}','31000000-0000-4000-8000-000000000002',10000,null,'razorpay','oB');`,
                               `select pay_record_invoice('${Vd}','30000000-0000-4000-8000-000000000001',25000,null,'razorpay','oA');`);
    ok(() => y.hHolds && y.aHolds && y.bWaits && y.ra.code === 0 && y.rb.code === 0 && !/40P01|deadlock/i.test(y.ra.out + y.rb.out + log()) && sql(`select amount_paid from invoices where id='30000000-0000-4000-8000-000000000001';`) === '55000', '3.2 a line payment holding, and a whole-invoice payment SEEN waiting on it: both finish, no 40P01, none lost', JSON.stringify({ h: y.hHolds, a: y.aHolds, b: y.bWaits, ra: y.ra.out.slice(0, 80), rb: y.rb.out.slice(0, 80) }));
    const fn = (MIG_UNDER_TEST.match(/CREATE FUNCTION public\.pay_record_milestone[\s\S]*?END \$\$;/) || [''])[0];
    ok(() => fn.indexOf("FROM public.invoices WHERE id = line_inv AND vendor_id = p_vendor FOR UPDATE") > 0 && fn.indexOf("FROM public.invoices WHERE id = line_inv AND vendor_id = p_vendor FOR UPDATE") < fn.indexOf('UPDATE public.payment_schedules'), '3.3 the line path takes the invoice row before its line (one lock order)');
    return true;
  });
}

async function oldRowProof() {
  return withDb(MIG_UNDER_TEST, async ({ sql, mig2 }) => {
    sec('2e  0202 over a database that already holds a 0201 link row');
    sql(`insert into vendor_pay_links (vendor_id, provider, invoice_id, amount) values ('${Vd}','razorpay','${INV}',1000);`);
    const applied = sql(mig2, 120000);
    ok(() => !/ERROR/i.test(applied) && sql(`select count(*) from vendor_pay_links where num_nonnulls(invoice_id, binder_id) = 1;`) === '1'
      && /violates check constraint "vendor_pay_links_one_home"/.test(sql(`insert into vendor_pay_links (vendor_id, provider, invoice_id, binder_id, amount) values ('${Vd}','razorpay','${INV}','${INV}',1);`)),
      '2e.1 the row made before 0202 passes one_home; a row with both homes is refused', applied.slice(0, 200));
    return true;
  }, { skip0202: true });
}
let MIG_UNDER_TEST = MIG;
(async () => {
  if (process.env.B225_MUTATED) MIG_UNDER_TEST = fs.readFileSync(process.env.B225_MUTATED, 'utf8');
  const r = await cells(MIG_UNDER_TEST);
  if (!(r && r.error) && !process.env.B225_SECTION3) await oldRowProof();
  const pgProcs = () => { const o = cp.spawnSync('ps', ['-eo', 'stat,comm'], { encoding: 'utf8' }).stdout || ''; const rows = o.split('\n').filter((l) => / postgres$/.test(l)); return { live: rows.filter((l) => !/^Z/.test(l.trim())).length, zombie: rows.filter((l) => /^Z/.test(l.trim())).length }; };
  if (r && r.error) { console.log(`b225 · NOT RUN: ${r.error}`); process.exit(3); }   // r2: a refusal, never an error, never green
  if (process.env.B225_WANT) { console.log(failed.some((n) => n.startsWith(process.env.B225_WANT + ' ')) ? `RED ${process.env.B225_WANT}` : 'NOT RED'); process.exit(0); }
  sec('4  production mutations of 0201, each on its own fresh database, each must turn its named cell red');
  const MUT = [
    ['the once-only key removed', '  UNIQUE (provider, provider_payment_id, kind)\n);', ');', '1.2'],
    ['money on a paid line dropped again', "      UPDATE public.vendor_pay_events SET applied = false, not_applied_reason = why WHERE id = ev;\n      RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', false, 'code', why);\n    END IF;\n    RETURN jsonb_build_object('ok', false, 'code', why);\n  END IF;\n  inv := public.pay_settle_invoice(p_vendor, ms.invoice_id",
      "      RAISE EXCEPTION 'dropped';\n    END IF;\n    RETURN jsonb_build_object('ok', false, 'code', why);\n  END IF;\n  inv := public.pay_settle_invoice(p_vendor, ms.invoice_id", '1.4'],
    ['settle moves a cancelled invoice', "   WHERE id = p_invoice AND vendor_id = p_vendor AND state <> 'cancelled'", '   WHERE id = p_invoice AND vendor_id = p_vendor', '2.3'],
    ['NO_INVOICE written as INVOICE_CANCELLED', "  IF st IS NULL THEN why := 'NO_INVOICE'; ELSIF st = 'cancelled' THEN why := 'INVOICE_CANCELLED'; END IF;\n  IF why IS NOT NULL THEN\n    UPDATE public.vendor_pay_events SET applied = false, not_applied_reason = why WHERE id = ev;\n    RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', false, 'code', why);\n  END IF;\n  FOR ln IN",
      "  IF st IS NULL OR st = 'cancelled' THEN why := 'INVOICE_CANCELLED'; END IF;\n  IF why IS NOT NULL THEN\n    UPDATE public.vendor_pay_events SET applied = false, not_applied_reason = why WHERE id = ev;\n    RETURN jsonb_build_object('ok', true, 'duplicate', false, 'applied', false, 'code', why);\n  END IF;\n  FOR ln IN", '2.4'],
    ['the line taken before the invoice', "    SELECT state INTO st FROM public.invoices WHERE id = line_inv AND vendor_id = p_vendor FOR UPDATE;   -- the invoice FIRST\n    IF st IS NULL THEN why := 'NO_INVOICE'; ELSIF st = 'cancelled' THEN why := 'INVOICE_CANCELLED'; END IF;\n  END IF;\n  IF why IS NULL THEN\n    UPDATE public.payment_schedules",
      "    NULL;\n  END IF;\n  IF why IS NULL THEN\n    UPDATE public.payment_schedules", '3.3'],
    // "Not one step": the line's paid_amount read EARLY (before the invoice lock), then written as that value plus the
    // payment, which is what the JS add did. Two pairs of [from, to], applied together.
    ['the add read, then written (not one step)', [
      ["DECLARE ms public.payment_schedules%ROWTYPE; inv public.invoices%ROWTYPE; paid_on timestamptz; ev uuid; line_inv uuid; st text; why text;",
       "DECLARE ms public.payment_schedules%ROWTYPE; inv public.invoices%ROWTYPE; paid_on timestamptz; ev uuid; line_inv uuid; st text; why text; was integer;"],
      ["  SELECT invoice_id INTO line_inv FROM public.payment_schedules WHERE id = p_milestone AND vendor_id = p_vendor;   -- hers, or null",
       "  SELECT invoice_id, COALESCE(paid_amount, 0) INTO line_inv, was FROM public.payment_schedules WHERE id = p_milestone AND vendor_id = p_vendor;"],
      ["       SET paid_amount = COALESCE(paid_amount, 0) + p_amount,\n           state       = CASE WHEN COALESCE(paid_amount, 0) + p_amount >= amount_due THEN 'paid' ELSE state END,\n           paid_at     = CASE WHEN COALESCE(paid_amount, 0) + p_amount >= amount_due THEN paid_on ELSE paid_at END,\n           updated_at  = now()\n     WHERE id = p_milestone AND vendor_id = p_vendor AND state = 'pending'",
       "       SET paid_amount = was + p_amount,\n           state       = CASE WHEN was + p_amount >= amount_due THEN 'paid' ELSE state END,\n           paid_at     = CASE WHEN was + p_amount >= amount_due THEN paid_on ELSE paid_at END,\n           updated_at  = now()\n     WHERE id = p_milestone AND vendor_id = p_vendor AND state = 'pending'"]], null, '3.1'],
  ];
  const ONLY3 = !!process.env.B225_SECTION3;   // e-275 runs: section 3's two mutations only ('3.3' and '3.1')
  // 0202's mutations: [name, [[from, to]], null, cell, '0202'] are applied to 0202's text instead of 0201's.
  MUT.push(
    ['a refund taken off twice', [["  UPDATE public.vendor_pay_events SET applied = true WHERE id = ev.id AND applied = false;   -- ONCE per refund id\n  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_TAKEN_OFF'); END IF;", "  UPDATE public.vendor_pay_events SET applied = true WHERE id = ev.id;"]], null, '2c.5', '0202'],
    ['below zero allowed', [["     SET amount_paid = GREATEST(0, amount_paid - ev.amount),", "     SET amount_paid = amount_paid - ev.amount,"], ["    take := LEAST(left_over, COALESCE(ln.paid_amount, 0));", "    take := left_over;"]], null, '2c.6', '0202'],
    ['the cancelled guard removed from the take-off', [["  IF st = 'cancelled' THEN RETURN jsonb_build_object('ok', false, 'code', 'INVOICE_CANCELLED'); END IF;\n  UPDATE public.vendor_pay_events SET applied = true", "  UPDATE public.vendor_pay_events SET applied = true"]], null, '2c.7', '0202'],
    ['the binder claim allows two at once', [["     AND NOT EXISTS (SELECT 1 FROM public.vendor_pay_events o WHERE o.binder_id = b AND o.id <> p_event AND o.applied = false\n                      AND o.claimed_at IS NOT NULL AND o.claimed_at >= now() - interval '5 minutes')\n", ""]], null, '2d.8', '0202'],
    ['the base re-read on a stale retry', [["RETURN jsonb_build_object('ok', true, 'event_id', e.id, 'binder_id', e.binder_id, 'amount', e.amount, 'base', e.binder_base_received);", "RETURN jsonb_build_object('ok', true, 'event_id', e.id, 'binder_id', e.binder_id, 'amount', e.amount, 'base', NULL);"], ["   WHERE id = p_event AND vendor_id = p_vendor AND applied = false AND binder_base_received IS NULL\n", "   WHERE id = p_event AND vendor_id = p_vendor AND applied = false\n"]], null, '2d.4', '0202'],
    ['a second round refused (stuck)', [["  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_UNCERTAIN'); END IF;\n  SELECT COALESCE(max(round), 0) + 1", "  IF NOT FOUND OR EXISTS (SELECT 1 FROM public.vendor_pay_event_answers a WHERE a.event_id = p_event) THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_UNCERTAIN'); END IF;\n  SELECT COALESCE(max(round), 0) + 1"]], null, '2d.7', '0202'],
    ['an uncertain payment claimable (the sweep would answer it)', [["   WHERE x.id = p_event AND x.vendor_id = p_vendor AND x.applied = false AND x.not_applied_reason = 'BINDER_PENDING'", "   WHERE x.id = p_event AND x.vendor_id = p_vendor AND x.applied = false AND x.not_applied_reason IN ('BINDER_PENDING', 'BINDER_UNCERTAIN')"]], null, '2d.6', '0202'],
    ['part payment on by default', [["ADD COLUMN accept_partial boolean NOT NULL DEFAULT false;", "ADD COLUMN accept_partial boolean NOT NULL DEFAULT true;"]], null, '2c.4', '0202']);
  for (const [name, from, to, cell, which] of MUT) {
    if (ONLY3 && !['3.3', '3.1'].includes(cell)) continue;
    if (which === '0202') {
      if (!from.every(([a]) => MIG2.includes(a))) { ok(false, `4 · ${name}: the mutation's anchor is present in 0202`); continue; }
      const f2 = path.join(process.env.TMPDIR || os.tmpdir(), `b225_mut2_${process.pid}_${cell}.sql`); fs.writeFileSync(f2, from.reduce((t, [a, z]) => t.replace(a, z), MIG2));
      const r3 = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B225_MUTATED2: f2, B225_QUIET: '1', B225_WANT: cell }, encoding: 'utf8', timeout: 240000 });
      ok(() => r3.stdout.includes(`RED ${cell}`), `4 · ${name} → §${cell} red`, (r3.stdout || r3.stderr).slice(-200));
      fs.rmSync(f2, { force: true }); continue;
    }
    const pairs = Array.isArray(from) ? from : [[from, to]];
    if (!pairs.every(([a]) => MIG.includes(a))) { ok(false, `4 · ${name}: the mutation's anchor is present in 0201`); continue; }
    const f = path.join(process.env.TMPDIR || os.tmpdir(), `b225_mut_${process.pid}_${cell}.sql`); fs.writeFileSync(f, pairs.reduce((t, [a, z]) => t.replace(a, z), MIG));
    const r2 = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B225_MUTATED: f, B225_QUIET: '1', B225_WANT: cell }, encoding: 'utf8', timeout: 240000 });
    ok(() => r2.stdout.includes(`RED ${cell}`), `4 · ${name} → §${cell} red`, (r2.stdout || r2.stderr).slice(-200));
    fs.rmSync(f, { force: true });
  }
  const pc = pgProcs(); console.log(`b225 · at exit: ${pc.live} live postgres, ${pc.zombie} zombie (defunct, holding nothing)`);
  console.log(`\nb225 · ${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('b225 threw: ' + (e && e.stack)); process.exit(1); });
