#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b46_money_books_bench.js
// ROAD STEP 2b · THE TYPED MONEY PLANE — the Books door.
//
// Bench number RE-DERIVED AT THE RE-CUT, and it moved. At `852d385` this file
// was b45: `ls scripts/b4*.js` returned b41, b43, b44 and b45 was free. Step 2a
// then landed `scripts/b45_precutover_seat_bench.js` at `59b79ef` and took it.
//
// THE COLLISION IS THE WHOLE ARGUMENT FOR R-38.16. A number derived once at
// charter and carried to the cut would have shipped two b45s into one scripts/
// directory — the second silently overwriting the first through the `cp -r
// deploy/*` chain, taking 2a's nine cells and eight witnessed mutations with it,
// and the floor would have reported one bench where two were expected without
// anything saying why. Re-derived here, at the moment of writing. b42 is skipped
// rather than reclaimed, because b43's own header records it RESERVED to TDW_19 P3.
//
// ── PREREQUISITE, STATED FIRST BECAUSE IT HAS COST A SITTING ────────────────
//
//     npm ci && npm run build && node scripts/b46_money_books_bench.js
//
// §0 asserts the mount THROUGH `src/api/vendor/core.js`, which loads every
// sibling door with it, and `src/api/vendor/leads.js` requires
// `../../engine/dist/core/donna` — a `tsc` artifact `.gitignore` excludes. On a
// bare clone this bench dies with MODULE_NOT_FOUND before a cell runs. b43's
// header says the same thing and this one repeats it rather than pointing at
// it, because the reader who needs it is running THIS file. F-39.p2 moves the
// warning into `tools/preflight.sh` and a refusal into `scripts/run-floor.sh`,
// so nobody has to have read either header.
//
// ── NO DATABASE, NO CREDENTIAL, NO NETWORK ─────────────────────────────────
// Env values below are PLACEHOLDER LITERALS, never a read of a real
// environment (secrets law). The supabase fake is a RECORDING fake that THROWS
// on any table this bench was not told about, so a door that grew a read of
// `engine.records` — the plane 2b exists to stop reading — reddens here.
//
// ── THE FIXTURE IS THE FOUNDER'S, AND THE ARITHMETIC IS AUTHORED FROM IT ────
// Founder-run on DROY550, 2026-08-29, and again for the tie-break. §2's
// expected chain is TRANSCRIBED from those grids (F-07.6: the card is authored
// from the pasted rows, never the reverse).
//
// ── ⚠ WHAT THE FIXTURE CANNOT PROVE, AND WHY §4 AND §5 EXIST  [F-39.p1] ─────
// DROY550's two invoices are BOTH `unpaid`, so:
//   · a positive-list outstanding and a `state <> 'paid'` outstanding return
//     the IDENTICAL head on this account — the fixture has zero discriminating
//     power over R-39.12, the ruling it appears to witness; and
//   · no cancelled row exists, so "a cancelled invoice still credits received"
//     is unexercised in every direction.
// A cell that greens over a fixture that cannot distinguish the cure from its
// absence is a hollow green, and hollow green is worse than a declared gap.
// §4 and §5 carry both arms on SYNTHETIC rows, each with its own production-code
// mutation — mutation of `src/api/vendor/money.js`, never of this bench's setup.
//
// Run: node scripts/b46_money_books_bench.js
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

process.env.SUPABASE_URL = 'http://127.0.0.1:1/bench-placeholder-not-a-credential';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'bench-placeholder-not-a-credential';

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const DOOR = P('src/api/vendor/money.js');

let pass = 0, fail = 0;
const ok = (n, why) => { console.log('PASS  ' + n + (why ? '  — ' + why : '')); pass++; };
const no = (n, why) => { console.log('FAIL  ' + n + '  — ' + why); fail++; };
const chk = (cond, n, why) => (cond ? ok(n, why) : no(n, why));

// ── requireAuth, STUBBED AT THE REGISTRY BEFORE THE ROUTER LOADS ───────────
// resolveVendor is NOT stubbed. It is the real middleware, resolving against
// the fake's `users` and `vendors` rows — because a cell that fakes the guard
// it is testing has tested the fake.
const requireAuthPath = require.resolve(P('src/api/middleware/requireAuth.js'));
const AUTH_SUB = 'auth-sub-vendor';
require.cache[requireAuthPath] = {
  id: requireAuthPath, filename: requireAuthPath, loaded: true,
  exports: (req, _res, next) => { req.auth = { user_id: AUTH_SUB, phone: '+919888294440' }; next(); },
};

const VENDOR_ID = 'b1f0c2d3-4a5b-4c6d-8e9f-0a1b2c3d4e5f';
const VENDOR_ROW = Object.freeze({
  id: VENDOR_ID, user_id: 'users-id-1', business_name: 'Bench Studio',
  city: 'Mumbai', routing_handle: 'DROY550', tier: 'basic',
});

// ── THE FOUNDER'S FIXTURE, TRANSCRIBED ─────────────────────────────────────
// invoices: both `unpaid`, amount_paid == amount_total, last_payment_at NULL,
// has_schedule false. payment_schedules: NONE. expenses: 5001 then 5000, both
// dated 2026-07-22, created 20:28:20.974117Z and 21:02:55.638485Z.
const FIXTURE = {
  invoices: [
    { id: 'ab99393e-1a7c-41fc-a43d-7586d01b8e8b', amount_total: 15000, amount_paid: 15000,
      state: 'unpaid', created_at: '2026-07-14T18:25:59.000000Z', last_payment_at: null, has_schedule: false },
    { id: '17d5f09b-53a3-4db9-a12a-d54300f1a2d7', amount_total: 20000, amount_paid: 20000,
      state: 'unpaid', created_at: '2026-07-14T19:02:43.000000Z', last_payment_at: null, has_schedule: false },
  ],
  payment_schedules: [],
  expenses: [
    { id: '2f14194c-050f-4737-bb95-d474ddbbb145', amount: 5001,
      expense_date: '2026-07-22', created_at: '2026-07-22T20:28:20.974117Z' },
    { id: '293c4e7e-6ec5-4149-95d9-57efcbb82265', amount: 5000,
      expense_date: '2026-07-22', created_at: '2026-07-22T21:02:55.638485Z' },
  ],
};

let TABLES = FIXTURE;
const READS = [];

function fake() {
  return {
    from(table) {
      const q = { table, filters: [], _cols: null };
      q.select = (cols) => { q._cols = cols; return q; };
      q.eq = (c, v) => { q.filters.push(['eq', c, v]); return q; };
      q.is = (c, v) => { q.filters.push(['is', c, v]); return q; };
      q.maybeSingle = async () => {
        READS.push({ table, filters: q.filters.slice() });
        if (table === 'users') return { data: { id: 'users-id-1' }, error: null };
        if (table === 'vendors') {
          const f = q.filters[0];
          if (f && f[1] === 'user_id' && f[2] === 'users-id-1') return { data: { ...VENDOR_ROW }, error: null };
          return { data: null, error: null };
        }
        throw new Error(`[fake] UNDECLARED TABLE READ: ${table}`);
      };
      // The door awaits the builder directly (no .maybeSingle), so the builder
      // is thenable. Every row this fake serves is already vendor-scoped, so
      // filters are RECORDED for §1 to assert rather than applied here — a fake
      // that silently applied `deleted_at IS NULL` would green a door that
      // never asked for it, which is the vacuity this bench exists to refuse.
      q.then = (resolve, reject) => {
        READS.push({ table, filters: q.filters.slice(), cols: q._cols });
        if (!Object.prototype.hasOwnProperty.call(TABLES, table)) {
          return reject(new Error(`[fake] UNDECLARED TABLE READ: ${table} — 2b reads the TYPED plane only`));
        }
        return resolve({ data: TABLES[table].map((r) => ({ ...r })), error: null });
      };
      return q;
    },
  };
}

const app = express();
app.use(express.json());
app.locals.supabase = fake();
app.use('/api/v2/vendor', require(P('src/api/vendor/core.js')));

let server, BASE;
const req = (method, p) => new Promise((resolve, reject) => {
  const r = http.request(BASE + p, { method }, (res) => {
    let b = '';
    res.on('data', (d) => (b += d));
    res.on('end', () => {
      let json = null;
      try { json = JSON.parse(b); } catch { /* non-JSON body is itself a finding */ }
      resolve({ status: res.statusCode, body: json, raw: b });
    });
  });
  r.on('error', reject);
  r.end();
});
const get = (p) => req('GET', p);

const B = '/api/v2/vendor/money';
const BOOKS = `${B}/books/${VENDOR_ID}`;

// ── THE MUTATION HARNESS ───────────────────────────────────────────────────
// Mutates PRODUCTION SOURCE, restores it in a `finally`, and §7 re-asserts the
// restore byte-identically. The mutated module is loaded in a CHILD PROCESS, so
// the parent's `require` cache — which already holds the real door — cannot
// mask the mutation. A mutation the runner cannot actually observe is the
// hollow-green shape wearing a mutation's clothes.
const DOOR_ORIGINAL = fs.readFileSync(DOOR, 'utf8');

function withMutation(find, replace, fn) {
  const src = fs.readFileSync(DOOR, 'utf8');
  if (!src.includes(find)) {
    return { applied: false, reason: `mutation anchor absent from money.js: ${JSON.stringify(find.slice(0, 60))}` };
  }
  fs.writeFileSync(DOOR, src.replace(find, replace));
  try { return { applied: true, result: fn() }; }
  finally { fs.writeFileSync(DOOR, src); }
}

// Run the door in a child process against the same fixture and return its JSON.
function probeChild() {
  const { execFileSync } = require('child_process');
  const script = `
    process.env.SUPABASE_URL='http://127.0.0.1:1/x';
    process.env.SUPABASE_SERVICE_ROLE_KEY='x';
    const path=require('path'),http=require('http'),express=require('express');
    const ROOT=${JSON.stringify(ROOT)};
    const P=(r)=>path.join(ROOT,r);
    const ra=require.resolve(P('src/api/middleware/requireAuth.js'));
    require.cache[ra]={id:ra,filename:ra,loaded:true,exports:(q,_s,n)=>{q.auth={user_id:'auth-sub-vendor'};n();}};
    const V=${JSON.stringify(VENDOR_ROW)}, T=${JSON.stringify(TABLES)};
    function fake(){return{from(t){const q={filters:[]};q.select=()=>q;q.eq=(c,v)=>{q.filters.push([c,v]);return q;};q.is=()=>q;
      q.maybeSingle=async()=>{if(t==='users')return{data:{id:'users-id-1'},error:null};
        if(t==='vendors')return{data:{...V},error:null};throw new Error('undeclared '+t);};
      q.then=(res,rej)=>Object.prototype.hasOwnProperty.call(T,t)?res({data:T[t].map(r=>({...r})),error:null}):rej(new Error('undeclared '+t));
      return q;}};}
    const app=express();app.locals.supabase=fake();
    app.use('/api/v2/vendor',require(P('src/api/vendor/core.js')));
    const s=app.listen(0,'127.0.0.1',()=>{
      http.get('http://127.0.0.1:'+s.address().port+${JSON.stringify(BOOKS)},(r)=>{
        let b='';r.on('data',d=>b+=d);r.on('end',()=>{process.stdout.write(b);s.close();});});});
  `;
  try {
    const out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 30000 });
    return JSON.parse(out);
  } catch (e) {
    return { ok: false, _crashed: true, _err: String(e && e.message) };
  }
}

(async () => {
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  BASE = 'http://127.0.0.1:' + server.address().port;

  // ═══ §0 · THE MOUNT IS REAL, AND IT IS AHEAD OF THE ROOT MOUNT ═══════════
  console.log('\n── §0 · the mount, through core.js ──');
  {
    const r = await get(BOOKS);
    chk(r.status !== 404, '§0.1 /money/books/:vendorId is mounted in core.js', `HTTP ${r.status}`);
    chk(r.status === 200, '§0.2 the door answers 200', `HTTP ${r.status}`);

    // ORDER, NOT PRESENCE. `schedules` is mounted at the bare '/' and a root
    // mount is reached for every path. This asserts the money mount appears
    // FIRST in core.js's text — the property the placement was chosen for.
    const core = fs.readFileSync(P('src/api/vendor/core.js'), 'utf8')
      .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    const iMoney = core.indexOf("router.use('/money'");
    const iRoot = core.indexOf("router.use('/',");
    chk(iMoney > -1 && iRoot > -1 && iMoney < iRoot,
      '§0.3 the /money mount stands ABOVE the bare root mount', `money@${iMoney} root@${iRoot}`);
  }

  // ═══ §1 · ZERO NON-GET, AND THE TYPED PLANE ONLY ═════════════════════════
  console.log('\n── §1 · the router mounts no verb ──');
  {
    // OBSERVED AT THE DEFECT'S MOMENT (D-38.1), not grepped. The router's own
    // stack is walked; a grep for `router.post` would be blind to a verb
    // mounted through a variable or a helper.
    const moneyRouter = require(DOOR);

    // ── AMENDED AT CE-39 ROAD STEP 2c · RETIRE-WITH-THE-READER ─────────────
    // WHAT THIS CELL SAID, AND WHY IT NO LONGER SAYS IT.
    // It read:
    //     const nonGet = [...methods].filter((m) => m !== 'get');
    //     chk(nonGet.length === 0, '§1.1 the money router declares zero
    //         non-GET verbs', ...)
    // At 2b that was the whole truth about this file: it declared one route and
    // it was a GET, because the rooms that own the verbs had not crossed. 2c
    // crosses them, by ruling — the five money verbs are mounted HERE now, on
    // the typed plane, and this bench went RED on the crossing it was asked to
    // permit. A bench that reds when its subject moves BY RULING is a reader
    // that outlived what it read.
    //
    // IT IS AMENDED, NOT DELETED, AND THE COUNT IS PRESERVED — one cell before,
    // one cell after. What survives is the clause's real subject: **the BOOKS
    // door takes no verb.** The 2b clause was that sentence written at the
    // router's scope because at 2b the router and the door were the same thing.
    // They are not any more, so the assertion narrows to the door and says the
    // same thing about it.
    //
    // The room-level guard — that BooksBody mounts no control at all — is NOT
    // duplicated here. It lives once, in the pwa's own bench, because Books'
    // read-only ruling is now enforced only by a cell (money.js's header states
    // why: the composite ids that used to enforce it by construction sit beside
    // typed doors now). One rule, one home, even for a rule this load-bearing.
    //
    // OBSERVED AT THE DEFECT'S MOMENT (D-38.1), not grepped: the router's own
    // stack is walked, so a verb mounted through a variable or a helper is seen.
    const booksMethods = new Set();
    let booksSeen = false;
    for (const layer of moneyRouter.stack || []) {
      if (!layer.route) continue;
      if (!String(layer.route.path).startsWith('/books/')) continue;
      booksSeen = true;
      for (const m of Object.keys(layer.route.methods)) booksMethods.add(m.toLowerCase());
    }
    const booksNonGet = [...booksMethods].filter((m) => m !== 'get');
    chk(booksSeen && booksNonGet.length === 0,
      '§1.1 the BOOKS door declares zero non-GET verbs',
      booksSeen
        ? `verbs on /books/: [${[...booksMethods].sort().join(', ') || 'none'}]`
        : 'no /books/ route found on the money router');
    // MUTATION (both-ways, production code): change money.js's
    // `router.get('/books/:vendorId'` to `router.post(` -> RED.

    // AND OVER THE WIRE, because a route absent from the stack could still be
    // reachable through a mount above it.
    for (const m of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      const r = await req(m, BOOKS);
      chk(r.status === 404 || r.status === 405,
        `§1.2 ${m} ${BOOKS} is not served`, `HTTP ${r.status}`);
    }

    const typed = ['invoices', 'payment_schedules', 'expenses'];
    const touched = [...new Set(READS.filter((x) => typed.includes(x.table) || x.table === 'records').map((x) => x.table))];
    chk(!touched.includes('records'),
      '§1.3 the door reads the TYPED plane and never engine.records',
      `tables touched: [${touched.sort().join(', ')}]`);

    const invRead = READS.find((x) => x.table === 'invoices');
    const expRead = READS.find((x) => x.table === 'expenses');
    const hasSoftDelete = (r) => !!r && r.filters.some((f) => f[0] === 'is' && f[1] === 'deleted_at' && f[2] === null);
    chk(hasSoftDelete(invRead), '§1.4 invoices are read with deleted_at IS NULL',
      JSON.stringify(invRead && invRead.filters));
    chk(hasSoftDelete(expRead), '§1.5 expenses are read with deleted_at IS NULL',
      JSON.stringify(expRead && expRead.filters));
  }

  // ═══ §2 · THE FOUNDER'S FIXTURE, ARITHMETIC AUTHORED FROM THE GRIDS ══════
  console.log('\n── §2 · the register against DROY550 ──');
  {
    const r = await get(BOOKS);
    const b = r.body || {};
    chk(b.received === 35000, '§2.1 head Received = 35,000', `got ${b.received}`);
    chk(b.outstanding === 0, '§2.2 head Outstanding = 0', `got ${b.outstanding}`);
    chk(Array.isArray(b.movements) && b.movements.length === 4,
      '§2.3 four movements', `got ${b.movements && b.movements.length}`);

    const m = b.movements || [];
    const chain = m.map((x) => x.balance);
    chk(JSON.stringify(chain) === JSON.stringify([15000, 35000, 29999, 24999]),
      '§2.4 running balance 15,000 · 35,000 · 29,999 · 24,999', JSON.stringify(chain));

    const shape = m.map((x) => `${x.date}/${x.credit ?? '-'}/${x.debit ?? '-'}`);
    chk(JSON.stringify(shape) === JSON.stringify([
      '2026-07-14/15000/-', '2026-07-14/20000/-', '2026-07-22/-/5001', '2026-07-22/-/5000',
    ]), '§2.5 date order, credits then debits, tie by created_at', JSON.stringify(shape));

    chk(m[0].undated === true && m[1].undated === true,
      '§2.6 both credits are flagged undated (last_payment_at NULL — F-39.8)',
      `[${m.map((x) => x.undated).join(', ')}]`);
    chk(m[2].undated === false && m[3].undated === false,
      '§2.7 the two debits carry real expense_dates and are not flagged');
  }

  // ═══ §3 · THE TIE-BREAK IS A RULE, NOT THE DATABASE'S ORDER ══════════════
  console.log('\n── §3 · the tie-break is total ──');
  {
    // The two expenses arrive in the OPPOSITE order to the founder's grid. A
    // door ordering by expense_date alone, or trusting arrival order, gives
    // 30,000 at the third balance. The rule must give 29,999 either way.
    const saved = TABLES;
    TABLES = { ...FIXTURE, expenses: [...FIXTURE.expenses].reverse() };
    const r = await get(BOOKS);
    TABLES = saved;
    const chain = (r.body.movements || []).map((x) => x.balance);
    chk(JSON.stringify(chain) === JSON.stringify([15000, 35000, 29999, 24999]),
      '§3.1 reversing the rows does not move the register', JSON.stringify(chain));
  }

  // ═══ §4 · [F-39.p1] R-39.12 — OUTSTANDING IS A POSITIVE LIST ════════════
  console.log('\n── §4 · outstanding excludes cancelled  [the fixture cannot show this] ──');
  {
    const saved = TABLES;
    TABLES = {
      ...FIXTURE,
      invoices: [
        { id: 'inv-live', amount_total: 10000, amount_paid: 4000, state: 'advance_paid',
          created_at: '2026-08-01T10:00:00.000Z', last_payment_at: '2026-08-01T10:00:00.000Z', has_schedule: false },
        { id: 'inv-cancelled', amount_total: 90000, amount_paid: 0, state: 'cancelled',
          created_at: '2026-08-02T10:00:00.000Z', last_payment_at: null, has_schedule: false },
      ],
      expenses: [],
    };
    const r = await get(BOOKS);
    TABLES = saved;
    chk(r.body.outstanding === 6000,
      '§4.1 a cancelled invoice contributes nothing to outstanding',
      `got ${r.body.outstanding} — 6,000 is the live invoice alone; 96,000 would be the negation`);
  }

  console.log('\n── §5 · [F-39.p1] a cancelled invoice STILL credits received ──');
  {
    const saved = TABLES;
    TABLES = {
      ...FIXTURE,
      invoices: [
        { id: 'inv-cancelled-paid', amount_total: 50000, amount_paid: 12000, state: 'cancelled',
          created_at: '2026-08-03T10:00:00.000Z', last_payment_at: '2026-08-03T10:00:00.000Z', has_schedule: false },
      ],
      expenses: [],
    };
    const r = await get(BOOKS);
    TABLES = saved;
    chk(r.body.received === 12000,
      '§5.1 money banked on a cancelled invoice is still received',
      `got ${r.body.received}`);
    chk(r.body.outstanding === 0,
      '§5.2 and it is still not outstanding', `got ${r.body.outstanding}`);
  }

  console.log('\n── §6 · the has_schedule guard stops double-counting ──');
  {
    const saved = TABLES;
    TABLES = {
      invoices: [
        { id: 'inv-sched', amount_total: 30000, amount_paid: 18000, state: 'advance_paid',
          created_at: '2026-08-04T10:00:00.000Z', last_payment_at: '2026-08-06T10:00:00.000Z', has_schedule: true },
      ],
      payment_schedules: [
        { invoice_id: 'inv-sched', amount_due: 10000, state: 'paid', paid_at: '2026-08-05T09:00:00.000Z', paid_amount: 10000, ordinal: 1 },
        { invoice_id: 'inv-sched', amount_due: 8000, state: 'paid', paid_at: '2026-08-06T09:00:00.000Z', paid_amount: 8000, ordinal: 2 },
        { invoice_id: 'inv-sched', amount_due: 12000, state: 'pending', paid_at: null, paid_amount: null, ordinal: 3 },
      ],
      expenses: [],
    };
    const r = await get(BOOKS);
    TABLES = saved;
    chk(r.body.received === 18000,
      '§6.1 a scheduled invoice credits its milestones ONCE, not milestones + amount_paid',
      `got ${r.body.received} — 36,000 would be the double-count`);
    chk((r.body.movements || []).length === 2,
      '§6.2 the pending milestone takes no line (no paid clock, no movement)',
      `${(r.body.movements || []).length} movement(s)`);
  }

  // ═══ §7 · NON-VACUITY, BY PRODUCTION-CODE MUTATION ═══════════════════════
  console.log('\n── §7 · NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION ──');
  {
    // §7.1 — the outstanding positive list. Replace it with the negation
    // F-P3.1 forbids and §4 must go red.
    TABLES = {
      ...FIXTURE,
      invoices: [
        { id: 'inv-live', amount_total: 10000, amount_paid: 4000, state: 'advance_paid',
          created_at: '2026-08-01T10:00:00.000Z', last_payment_at: '2026-08-01T10:00:00.000Z', has_schedule: false },
        { id: 'inv-cancelled', amount_total: 90000, amount_paid: 0, state: 'cancelled',
          created_at: '2026-08-02T10:00:00.000Z', last_payment_at: null, has_schedule: false },
      ],
      expenses: [],
    };
    const m1 = withMutation(
      ".filter((i) => OUTSTANDING_STATES.includes(i.state))",
      ".filter((i) => i.state !== 'paid')",
      () => probeChild(),
    );
    TABLES = FIXTURE;
    chk(m1.applied && !m1.result._crashed && m1.result.outstanding === 96000,
      '§7.1 MUTATION the negation returns — cancelled money reappears as owed',
      m1.applied ? `mutated door answered outstanding ${m1.result.outstanding}` : m1.reason);

    // §7.2 — the cancelled-still-credits arm. Gate the credit on state and §5
    // must go red.
    TABLES = {
      ...FIXTURE,
      invoices: [
        { id: 'inv-cancelled-paid', amount_total: 50000, amount_paid: 12000, state: 'cancelled',
          created_at: '2026-08-03T10:00:00.000Z', last_payment_at: '2026-08-03T10:00:00.000Z', has_schedule: false },
      ],
      expenses: [],
    };
    const m2 = withMutation(
      "      if (i.has_schedule) continue;",
      "      if (i.has_schedule) continue;\n      if (i.state === 'cancelled') continue;",
      () => probeChild(),
    );
    TABLES = FIXTURE;
    chk(m2.applied && !m2.result._crashed && m2.result.received === 0,
      '§7.2 MUTATION gating the credit on state loses banked money',
      m2.applied ? `mutated door answered received ${m2.result.received}` : m2.reason);

    // §7.3 — the tie-break tail. Drop created_at from the comparator and the
    // third balance must move to 30,000 on the reversed rows.
    TABLES = { ...FIXTURE, expenses: [...FIXTURE.expenses].reverse() };
    const m3 = withMutation(
      "  if (a._tiebreak !== b._tiebreak) return a._tiebreak < b._tiebreak ? -1 : 1;",
      "",
      () => probeChild(),
    );
    TABLES = FIXTURE;
    // ASSERTS THE ARTIFACT, NEVER A PREDICTED VALUE. The first cut of this cell
    // predicted [15000,35000,30000,24999] and was WRONG: with the tiebreak gone
    // the two CREDITS tie too — both slice to 2026-07-14 — so they also fall to
    // `id` and the chain opens at 20,000. The cell was asserting the seat's
    // arithmetic about a mutated tree rather than the property under test. The
    // property is that the register MOVES without the tiebreak; that is what is
    // asserted, and the observed chain is printed so a reader sees which way.
    const c3 = m3.applied && !m3.result._crashed ? (m3.result.movements || []).map((x) => x.balance) : null;
    chk(c3 && JSON.stringify(c3) !== JSON.stringify([15000, 35000, 29999, 24999]),
      '§7.3 MUTATION dropping created_at lets arrival order decide the register',
      m3.applied ? `mutated chain ${JSON.stringify(c3)} vs cured [15000,35000,29999,24999]` : m3.reason);

    // §7.4 — the has_schedule guard.
    TABLES = {
      invoices: [
        { id: 'inv-sched', amount_total: 30000, amount_paid: 18000, state: 'advance_paid',
          created_at: '2026-08-04T10:00:00.000Z', last_payment_at: '2026-08-06T10:00:00.000Z', has_schedule: true },
      ],
      payment_schedules: [
        { invoice_id: 'inv-sched', amount_due: 10000, state: 'paid', paid_at: '2026-08-05T09:00:00.000Z', paid_amount: 10000, ordinal: 1 },
        { invoice_id: 'inv-sched', amount_due: 8000, state: 'paid', paid_at: '2026-08-06T09:00:00.000Z', paid_amount: 8000, ordinal: 2 },
      ],
      expenses: [],
    };
    const m4 = withMutation(
      "      if (i.has_schedule) continue;",
      "      if (false) continue;",
      () => probeChild(),
    );
    TABLES = FIXTURE;
    chk(m4.applied && !m4.result._crashed && m4.result.received === 36000,
      '§7.4 MUTATION dropping the has_schedule guard double-counts every scheduled rupee',
      m4.applied ? `mutated door answered received ${m4.result.received}` : m4.reason);

    // §7.5 — the restore. LESSON 3's tuition: a mutation harness that cannot
    // vouch for its own restore has already corrupted a tree once.
    chk(fs.readFileSync(DOOR, 'utf8') === DOOR_ORIGINAL,
      '§7.5 money.js restored BYTE-IDENTICAL after four mutations');
  }

  server.close();
  console.log(`\n${pass} PASS · ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  try { fs.writeFileSync(DOOR, DOOR_ORIGINAL); } catch { /* best effort */ }
  console.error('BENCH ABORTED —', e && e.stack ? e.stack : e);
  if (server) server.close();
  process.exit(2);
});
