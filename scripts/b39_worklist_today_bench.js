#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b39_worklist_today_bench.js
// M-WORKLIST · PHASE 3 — THE TODAY FEED, EXECUTED.
//
// ── THE BAR, STATED SO IT CANNOT SOFTEN ─────────────────────────────────────
// DOOR CELLS EXECUTE. This bench stands up the REAL express router on an
// ephemeral loopback port and drives it over REAL HTTP, through the REAL
// requireAuth and resolveVendor middleware, against a RECORDING in-memory
// supabase fake. No cell in §1–§4 or §6 asserts anything by reading source.
// F-16.29 is the tuition: until b38, every claim about the enquiry door was a
// claim about a string, and an unbound identifier survived `node --check`, a
// 35/35 bench, the engine gate and a full floor.
//
// The pattern is b38's, extended where honesty required it — see THE FAKE.
//
// ── THE FAKE IS NOT ALLOWED TO FLATTER THE CODE ─────────────────────────────
// b38's fake no-ops `order`, `limit`, `in`, `gte` and `lte` — correct there,
// because that door uses none of them. THIS door's correctness IS its filters
// and its ordering, so a fake that ignored them would hand every cell a green
// it never earned: the rank-order cell would pass over unsorted rows, the cap
// cell over an uncapped list, and F-P3.1's cancelled-invoice cure would be
// untestable because the state filter would not run. So this fake IMPLEMENTS
// them. That is the whole difference between an instrument and a mirror.
//
// ── HOW IT RUNS WITH NO DATABASE AND NO CREDENTIAL ──────────────────────────
// The fake carries `auth.getUser`, so the real requireAuth runs rather than
// being stubbed away — the auth chain is part of the door and a bench that
// bypassed it would be proving a handler, not an endpoint. The token below is a
// PLACEHOLDER LITERAL, never a read of a real environment (secrets law).
//
// Run bare. EXIT CODE IS THE VERDICT.
'use strict';

const path    = require('path');
const http    = require('http');
const fs      = require('fs');
const express = require('express');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0;
const failures = [];
function cell(name, condition, detail) {
  if (condition) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE FAKE
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// THE WITNESSED COLUMN SETS — THE FAKE REFUSES WHAT POSTGRES WOULD REFUSE
// ═══════════════════════════════════════════════════════════════════════════
// Every list below is `docs/db/PUBLIC_SCHEMA.md`'s own, by section, and exists
// because mutation M28 exposed a fake that was kinder than the database.
//
// M28 added `.is('deleted_at', null)` to the CONTRACTS query — §9.7's named
// trap, the filter-written-from-habit that four sibling tables invite. Nothing
// reddened: the fixture had no such key, `r['deleted_at'] ?? null` was null,
// and the filter passed. In production that query names a column that does not
// exist on `public.contracts` and the read fails. A fake that forgives an
// unknown column cannot guard the SQL-provenance law at all — it turns every
// column into an assumption the bench agrees with.
//
// So: an unknown column in a filter or a select THROWS here, and the door's own
// error posture turns it into the 500 the estate would actually serve.
const TABLE_COLUMNS = {
  // `## public.leads · 27 columns`
  leads: ['id','vendor_id','name','phone','email','wedding_date','wedding_city',
          'event_types','budget_min','budget_max','source','referrer_name','state',
          'raw_message','notes','created_at','updated_at','client_id','deleted_at',
          'vendor_summary','intent_summary','intent_summary_at',
          'wedding_date_precision','function_count','wedding_days','functions','draft_meta'],
  // `## public.invoices · 21 columns`
  invoices: ['id','vendor_id','lead_id','invoice_number','client_name','client_phone',
             'description','amount_total','amount_advance','amount_paid','due_date','state',
             'pdf_url','notes','created_at','updated_at','client_id','last_payment_at',
             'deleted_at','has_schedule','binder_id'],
  // `## public.events · 18 columns`
  events: ['id','vendor_id','title','event_date','event_time','kind','linked_lead_id',
           'state','notes','created_at','updated_at','couple_id','deleted_at',
           'linked_binder_id','slot','ready_by','assigned_member_ids','assigned_circle_member_id'],
  // `## public.contracts · 15 columns` — NOTE THE ABSENCE OF `deleted_at` (§9.7).
  contracts: ['id','vendor_id','client_id','lead_id','invoice_id','title','storage_path',
              'file_size','mime_type','notes','state','sent_at','signed_at',
              'created_at','updated_at'],
  // `## public.team_tasks · 13 columns`
  team_tasks: ['id','vendor_id','assigned_to_member_id','linked_event_id','title',
               'description','due_date','priority','state','completed_at','deleted_at',
               'created_at','updated_at'],
  // `## public.users · 9` and `## public.vendors · 45` — only the columns the
  // auth chain touches are needed; both are open here because resolveVendor
  // selects '*' and asserting the full 45 would be noise, not a guard.
  users: null,
  vendors: null,
};

function assertColumn(table, col) {
  const known = TABLE_COLUMNS[table];
  if (!known) return;                       // table not pinned — see above
  if (!known.includes(col)) {
    throw new Error(
      `column "${col}" does not exist on public.${table} — witnessed at ` +
      'docs/db/PUBLIC_SCHEMA.md. This is what postgres would answer.');
  }
}

function project(row, cols) {
  if (!cols || cols === '*') return Object.assign({}, row);
  const out = {};
  for (const c of String(cols).split(',').map((x) => x.trim()).filter(Boolean)) {
    out[c] = row[c] === undefined ? null : row[c];
  }
  return out;
}

// Comparisons are STRING-OR-NUMBER on purpose: every column this door ranges
// over is a `date` or a `timestamptz`, and ISO-8601 sorts lexicographically in
// exactly the order it sorts chronologically. That is why the door can hand
// `gte`/`lt` an ISO string and why this fake can compare with `<`.
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// `failCountOn` makes the head/count probe on one table reject. It exists
// because the has_any FAIL-POSTURE branch was unreachable without it: mutation
// M21 flipped that branch from `true` to `false` — showing a WORKING vendor the
// first-run manual off a failed read — and nothing reddened. A branch no
// fixture can enter is a branch no cell can guard.
function makeSupabase(seed, writes, opts) {
  const store = JSON.parse(JSON.stringify(seed));
  const failCountOn = (opts && opts.failCountOn) || null;

  function builder(table) {
    const filters = [];          // [op, column, value]
    let selCols = null, headOnly = false, wantCount = false;
    let orders = [], limitN = null;

    const match = () => (store[table] || []).filter((r) => filters.every(([op, c, v]) => {
      const cell = r[c] === undefined ? null : r[c];
      switch (op) {
        case 'eq':  return cell === v;
        case 'is':  return (cell ?? null) === (v ?? null);
        case 'neq': return cell !== v;
        case 'in':  return Array.isArray(v) && v.includes(cell);
        case 'gte': return cell !== null && cmp(cell, v) >= 0;
        case 'gt':  return cell !== null && cmp(cell, v) > 0;
        case 'lte': return cell !== null && cmp(cell, v) <= 0;
        case 'lt':  return cell !== null && cmp(cell, v) < 0;
        default:    return true;
      }
    }));

    const finish = () => {
      let out = match();
      for (const { col, asc, nullsFirst } of [...orders].reverse()) {
        out = out.slice().sort((x, y) => {
          const a = x[col] ?? null, b = y[col] ?? null;
          // NULLS ordering is modelled because the door RELIES on it: events
          // order by `event_time` nullsFirst (an all-day job leads the morning)
          // and team_tasks by `due_date` nullsFirst:false (an undated task
          // trails the dated ones). A fake that dropped nulls anywhere would
          // green a door that puts them in the wrong place.
          if (a === null && b === null) return 0;
          if (a === null) return nullsFirst ? -1 : 1;
          if (b === null) return nullsFirst ? 1 : -1;
          return asc ? cmp(a, b) : -cmp(a, b);
        });
      }
      const total = out.length;
      if (limitN !== null) out = out.slice(0, limitN);
      if (headOnly) return { data: null, error: null, count: wantCount ? total : null };
      return { data: out.map((x) => project(x, selCols)), error: null,
               count: wantCount ? total : null };
    };

    const b = {
      select(c, opts) {
        if (c && c !== '*') {
          for (const col of String(c).split(',').map((x) => x.trim()).filter(Boolean)) {
            assertColumn(table, col);
          }
        }
        selCols = c || null;
        if (opts && opts.head) headOnly = true;
        if (opts && opts.count) wantCount = true;
        return b;
      },
      eq(c, v)  { assertColumn(table, c); filters.push(['eq', c, v]);  return b; },
      is(c, v)  { assertColumn(table, c); filters.push(['is', c, v]);  return b; },
      neq(c, v) { assertColumn(table, c); filters.push(['neq', c, v]); return b; },
      in(c, v)  { assertColumn(table, c); filters.push(['in', c, v]);  return b; },
      gte(c, v) { assertColumn(table, c); filters.push(['gte', c, v]); return b; },
      gt(c, v)  { assertColumn(table, c); filters.push(['gt', c, v]);  return b; },
      lte(c, v) { assertColumn(table, c); filters.push(['lte', c, v]); return b; },
      lt(c, v)  { assertColumn(table, c); filters.push(['lt', c, v]);  return b; },
      not()     { return b; },
      order(col, o) {
        orders.push({ col, asc: !o || o.ascending !== false,
                      nullsFirst: !!(o && o.nullsFirst) });
        return b;
      },
      limit(n)  { limitN = n; return b; },
      range()   { return b; },
      maybeSingle() { const r = finish(); return Promise.resolve({ data: (r.data && r.data[0]) || null, error: null }); },
      single()      { return b.maybeSingle(); },
      // THE THENABLE CONTRACT IS `then(resolve, reject)` AND THE REJECT ARM
      // MUST BE CALLED, NOT RETURNED. The first cut returned
      // `Promise.reject(...)` here; a thenable's return value is DISCARDED
      // during assimilation, so the rejection never reached the door's own
      // try/catch and surfaced as an unhandled rejection that killed the
      // process. Caught on first execution — reading it would not have.
      then(res, rej) {
        if (headOnly && failCountOn === table) {
          return rej(new Error(`probe failed on ${table}`));
        }
        return Promise.resolve(finish()).then(res, rej);
      },

      // ── THE RECORDER · every write path, and none of them are reachable ──
      // This door must never call one. They exist so that if it ever does, §6
      // sees the op rather than inferring silence.
      insert(payload) { writes.push({ op: 'insert', table, payload }); return { select: () => ({ single: () => Promise.resolve({ data: null, error: null }), then: (r) => Promise.resolve({ data: [], error: null }).then(r) }), then: (r) => Promise.resolve({ data: null, error: null }).then(r) }; },
      update(payload) { writes.push({ op: 'update', table, payload }); return { eq: () => b, is: () => b, select: () => b, then: (r) => Promise.resolve({ data: null, error: null }).then(r) }; },
      upsert(payload) { writes.push({ op: 'upsert', table, payload }); return Promise.resolve({ data: null, error: null }); },
      delete()        { writes.push({ op: 'delete', table }); return { eq: () => Promise.resolve({ data: null, error: null }) }; },
      rpc(fn)         { writes.push({ op: 'rpc', table, fn }); return Promise.resolve({ data: null, error: null }); },
    };
    return b;
  }

  return {
    from: builder,
    _store: store,
    auth: { getUser: (t) => Promise.resolve(t === TOKEN
      ? { data: { user: { id: AUTH_ID, phone: PHONE } }, error: null }
      : { data: { user: null }, error: { message: 'bad token' } }) },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// THE FIXTURE — the founder's own test vendor's SHAPE, never his data
// ═══════════════════════════════════════════════════════════════════════════
const VENDOR_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID   = '22222222-2222-4222-8222-222222222222';
const AUTH_ID   = '33333333-3333-4333-8333-333333333333';
const PHONE     = '+919888294440';          // the standing test vendor's number
const TOKEN     = 'placeholder-bench-token'; // literal, never an env read

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const TODAY  = new Date(Date.now() + IST_OFFSET_MS).toISOString().split('T')[0];
const YESTER = new Date(Date.now() + IST_OFFSET_MS - 86400000).toISOString().split('T')[0];
// 09:00 IST today, expressed in UTC — inside the door's own day window.
const TODAY_MIDMORNING_UTC = new Date(Date.parse(`${TODAY}T00:00:00Z`) - IST_OFFSET_MS + 9 * 3600000).toISOString();
// 02:00 IST today = 20:30Z YESTERDAY. THE TRAP: a naive `slice(0,10)` on this
// timestamp files it under yesterday. It belongs to today and §3.4 proves it.
const TODAY_2AM_UTC = new Date(Date.parse(`${TODAY}T00:00:00Z`) - IST_OFFSET_MS + 2 * 3600000).toISOString();
// 23:00 IST yesterday = 17:30Z yesterday — genuinely NOT today.
const YESTER_11PM_UTC = new Date(Date.parse(`${TODAY}T00:00:00Z`) - IST_OFFSET_MS - 3600000).toISOString();

const emptyStore = (tier) => ({
  users:   [{ id: USER_ID, auth_user_id: AUTH_ID, phone: PHONE, name: 'Dev' }],
  vendors: [{ id: VENDOR_ID, user_id: USER_ID, tier: tier || 'essential',
              business_name: 'Test Studio', category: 'photographer', city: 'Mumbai' }],
  leads: [], invoices: [], events: [], contracts: [], team_tasks: [],
});

const lead = (o) => Object.assign({
  id: 'lead-1', vendor_id: VENDOR_ID, name: 'Sarah', phone: '+910000000000',
  email: 'sarah@example.com', wedding_date: '2027-02-14', wedding_city: 'Delhi',
  budget_min: 1000000, budget_max: 1500000, state: 'new',
  created_at: '2026-08-01T04:00:00Z', deleted_at: null,
}, o || {});

const invoice = (o) => Object.assign({
  id: 'inv-1', vendor_id: VENDOR_ID, invoice_number: 'INV-001',
  client_name: 'Sarah', client_phone: '+910000000000',
  amount_total: 200000, amount_paid: 50000, due_date: YESTER,
  state: 'unpaid', last_payment_at: null, deleted_at: null,
}, o || {});

const event = (o) => Object.assign({
  id: 'evt-1', vendor_id: VENDOR_ID, title: 'Mehendi shoot',
  event_date: TODAY, event_time: '10:00:00', kind: 'shoot',
  slot: 'morning', state: 'upcoming', deleted_at: null,
}, o || {});

// NOTE: no `deleted_at` key. `public.contracts` has none (§9.7) and the fixture
// says so by SHAPE — if the door ever grows a soft-delete filter here it will
// filter on a key that does not exist and the cells will show it.
const contract = (o) => Object.assign({
  id: 'con-1', vendor_id: VENDOR_ID, title: 'Wedding agreement',
  state: 'sent', sent_at: '2026-08-10T04:00:00Z', signed_at: null,
  created_at: '2026-08-09T04:00:00Z',
}, o || {});

const task = (o) => Object.assign({
  id: 'tsk-1', vendor_id: VENDOR_ID, title: 'Pack the 85mm',
  assigned_to_member_id: null, due_date: TODAY, priority: 'high',
  state: 'open', completed_at: null, deleted_at: null,
  created_at: '2026-08-20T04:00:00Z',
}, o || {});

// ═══════════════════════════════════════════════════════════════════════════
// THE DOOR, DRIVEN OVER REAL HTTP
// ═══════════════════════════════════════════════════════════════════════════
async function callDoor(store, opts) {
  const writes = [];
  const app = express();
  app.use(express.json());
  app.locals.supabase = makeSupabase(store, writes, opts);
  for (const m of ['src/api/vendor/worklistToday.js',
                   'src/api/middleware/requireAuth.js',
                   'src/api/middleware/resolveVendor.js',
                   'src/lib/vendor/leadSerializer.js',
                   'src/lib/vendor/istClock.js']) {
    delete require.cache[require.resolve(P(m))];
  }
  app.use('/worklist', require(P('src/api/vendor/worklistToday.js')));
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/worklist/today`, {
      headers: { Authorization: `Bearer ${(opts && opts.token) || TOKEN}` },
    });
    const json = await r.json().catch(() => ({}));
    // A NON-200 MUST FAIL CELLS, NOT KILL THE RUN. Mutation M28 (the §9.7
    // deleted_at trap) correctly produced a 500, and the bench then THREW on
    // the first cell that dereferenced a missing key — so the verdict was
    // right and the RED SET WAS NEVER PRINTED. An instrument that cannot report
    // what it caught is half an instrument. The shape is normalised so every
    // downstream cell fails by assertion, with its own name, as it should.
    // Filled to the KIND level, not just the container level. The first cut
    // normalised only the four top-level keys and the run still died one cell
    // later on `done_today.invoice_paid.length` — the same failure moved down a
    // layer. A defence that stops halfway is the shape of most defences.
    if (!json.needs_attention) json.needs_attention = {};
    if (!json.done_today)      json.done_today = {};
    if (!json.counts)          json.counts = {};
    if (!json.truncated)       json.truncated = {};
    for (const k of ['lead_unanswered', 'invoice_due', 'events_today',
                     'contract_unsigned', 'team_tasks']) {
      if (!Array.isArray(json.needs_attention[k])) json.needs_attention[k] = [];
    }
    for (const k of ['invoice_paid', 'contract_signed', 'team_task_done']) {
      if (!Array.isArray(json.done_today[k])) json.done_today[k] = [];
    }
    return { status: r.status, json, writes };
  } finally { await new Promise((r) => server.close(r)); }
}

// ═══════════════════════════════════════════════════════════════════════════
(async function main() {

console.log('\n§1 · THE DOOR ANSWERS, AND THE AUTH CHAIN IS REAL');
{
  const full = emptyStore();
  full.leads = [lead()]; full.invoices = [invoice()];
  full.events = [event()]; full.contracts = [contract()];
  full.team_tasks = [task()];

  const r = await callDoor(full);
  cell('1.1 · 200 with ok:true', r.status === 200 && r.json.ok === true,
       `status ${r.status}`);
  cell('1.2 · the response carries today\'s IST date', r.json.today === TODAY,
       `${r.json.today} vs ${TODAY}`);
  cell('1.3 · the shape is the frozen four + truncated',
       ['today', 'has_any', 'needs_attention', 'done_today', 'counts', 'truncated']
         .every((k) => Object.prototype.hasOwnProperty.call(r.json, k)));

  const bad = await callDoor(emptyStore(), { token: 'not-the-token' });
  cell('1.4 · a bad token is refused BEFORE any read (requireAuth runs)',
       bad.status === 401, `status ${bad.status}`);
}

console.log('\n§2 · EVERY ATTENTION KIND, BOTH WAYS');
// The seeded fixture produces the row; its ABSENCE produces none. A cell that
// only proved presence would green against a door that returned everything.
{
  const KINDS = [
    ['lead_unanswered',   'leads',      lead()],
    ['invoice_due',       'invoices',   invoice()],
    ['events_today',      'events',     event()],
    ['contract_unsigned', 'contracts',  contract()],
    ['team_tasks',        'team_tasks', task()],
  ];
  let n = 0;
  for (const [kind, table, row] of KINDS) {
    n++;
    const on = emptyStore(); on[table] = [row];
    const rOn = await callDoor(on);
    cell(`2.${n}a · ${kind} PRESENT when its row exists`,
         (rOn.json.needs_attention?.[kind] || []).length === 1,
         JSON.stringify(rOn.json.needs_attention?.[kind]));
    const rOff = await callDoor(emptyStore());
    // THE STATUS IS PART OF THE ASSERTION, AND IT WAS ADDED FOR CAUSE. Written
    // as an absence alone, this cell PASSED against a door answering 404 — the
    // first cut of the module declared `router.get('/')` under a '/worklist'
    // mount, so nothing existed at `/worklist/today`. Five negative cells went
    // green over a route that did not exist. An absence proves nothing unless
    // the door was open.
    cell(`2.${n}b · ${kind} ABSENT when it does not (and the door ANSWERED)`,
         rOff.status === 200
      && (rOff.json.needs_attention?.[kind] || []).length === 0,
         `status ${rOff.status}`);
  }

  // ── THE FILTER CURES, EACH PROVED BY THE ROW IT MUST REFUSE ──────────────
  const cancelled = emptyStore();
  cancelled.invoices = [invoice({ state: 'cancelled' })];
  const rc = await callDoor(cancelled);
  cell('2.6 · [F-P3.1] a CANCELLED invoice past due is NOT money owed',
       rc.status === 200 && rc.json.needs_attention.invoice_due.length === 0,
       'the ledger\'s `state <> \'paid\'` would have shipped it');

  const draft = emptyStore();
  draft.contracts = [contract({ state: 'draft', sent_at: null })];
  const rd = await callDoor(draft);
  cell('2.7 · [F-P3.2] a DRAFT contract is not awaiting signature',
       rd.status === 200 && rd.json.needs_attention.contract_unsigned.length === 0);

  const tomorrow = emptyStore();
  tomorrow.events = [event({ event_date: new Date(Date.now() + IST_OFFSET_MS + 86400000).toISOString().split('T')[0] })];
  const rt = await callDoor(tomorrow);
  cell('2.8 · [F-P3.3] events_today is a DAY, not a week',
       rt.status === 200 && rt.json.needs_attention.events_today.length === 0);

  const del = emptyStore();
  del.leads = [lead({ deleted_at: '2026-08-02T00:00:00Z' })];
  const rdel = await callDoor(del);
  cell('2.9 · a soft-deleted lead never reaches the feed',
       rdel.status === 200 && rdel.json.needs_attention.lead_unanswered.length === 0);

  const other = emptyStore();
  other.leads = [lead({ id: 'lead-x', vendor_id: 'someone-else' })];
  const ro = await callDoor(other);
  cell('2.10 · another vendor\'s lead is not on this vendor\'s feed',
       ro.status === 200 && ro.json.needs_attention.lead_unanswered.length === 0);
}

console.log('\n§3 · done_today — THE THREE PROVABLE KINDS, AND THE DAY BOUNDARY');
{
  const s = emptyStore();
  s.invoices   = [invoice({ id: 'inv-p', state: 'paid', amount_paid: 200000,
                            last_payment_at: TODAY_MIDMORNING_UTC })];
  s.contracts  = [contract({ id: 'con-s', state: 'signed', signed_at: TODAY_MIDMORNING_UTC })];
  s.team_tasks = [task({ id: 'tsk-d', state: 'done', completed_at: TODAY_MIDMORNING_UTC })];
  const r = await callDoor(s);
  cell('3.1 · the three provable kinds all land',
       r.json.done_today.invoice_paid.length === 1
    && r.json.done_today.contract_signed.length === 1
    && r.json.done_today.team_task_done.length === 1,
       JSON.stringify(r.json.done_today));
  cell('3.2 · [§8.7] done_today carries EXACTLY three keys — leads and events '
     + 'are absent BY SHAPE, and that is how the response says so',
       Object.keys(r.json.done_today).length === 3
    && !('lead_done' in r.json.done_today) && !('event_done' in r.json.done_today),
       Object.keys(r.json.done_today).join(','));

  const deposit = emptyStore();
  deposit.invoices = [invoice({ id: 'inv-a', state: 'advance_paid',
                                amount_paid: 50000, last_payment_at: TODAY_MIDMORNING_UTC })];
  const rdep = await callDoor(deposit);
  cell('3.3 · [F-P3.5] a DEPOSIT taken today is not DONE today',
       rdep.status === 200 && rdep.json.done_today.invoice_paid.length === 0,
       'state=paid AND the window are both required');

  // THE ZONE TRAP, both directions. 02:00 IST today is 20:30Z YESTERDAY; 23:00
  // IST yesterday is 17:30Z yesterday. A `slice(0,10)` on the UTC string files
  // the first under yesterday and the second under yesterday too — one right by
  // accident, one wrong. The window gets both right for the same reason.
  const early = emptyStore();
  early.team_tasks = [task({ id: 'tsk-e', state: 'done', completed_at: TODAY_2AM_UTC })];
  const re = await callDoor(early);
  cell('3.4 · a 02:00 IST completion is TODAY (its UTC string says yesterday)',
       re.json.done_today.team_task_done.length === 1,
       `completed_at ${TODAY_2AM_UTC}, IST day ${TODAY}`);

  const late = emptyStore();
  late.team_tasks = [task({ id: 'tsk-l', state: 'done', completed_at: YESTER_11PM_UTC })];
  const rl = await callDoor(late);
  cell('3.5 · a 23:00 IST completion YESTERDAY is not today',
       rl.status === 200 && rl.json.done_today.team_task_done.length === 0);
}

console.log('\n§4 · counts, truncated, RANK ORDER, has_any');
{
  const s = emptyStore();
  // SEEDED NEWEST-FIRST ON PURPOSE. With the older row seeded first, a door
  // that never sorted at all would have passed 4.5 — the cell would have been
  // measuring insertion order and calling it a ranking. The fixture must make
  // the sort do work before the cell can witness it.
  s.leads      = [lead({ id: 'l2', created_at: '2026-08-02T04:00:00Z' }),
                  lead({ id: 'l1', created_at: '2026-08-01T04:00:00Z' })];
  s.invoices   = [invoice({ id: 'i1' })];
  s.events     = [event()];
  s.contracts  = [contract()];
  s.team_tasks = [task()];
  const r = await callDoor(s);

  // R-37.63 ① — THE BADGE AND THE FEED READ THE SAME RESPONSE.
  let equal = true;
  for (const k of Object.keys(r.json.needs_attention)) {
    if (r.json.counts[k] !== r.json.needs_attention[k].length) equal = false;
  }
  cell('4.1 · [R-37.63 ①] count === list length, EVERY kind', equal,
       JSON.stringify(r.json.counts));
  cell('4.2 · counts covers the five attention kinds and NOTHING else — a '
     + 'done_today key here would inflate Phase 4\'s client-side masthead sum',
       Object.keys(r.json.counts).length === 5);
  cell('4.3 · no total field ships; the endpoint stays ignorant of presentation',
       !('total' in r.json) && !('count' in r.json));

  // D-4's rank order, carried structurally by key insertion order.
  cell('4.4 · [D-4] the ranking is the key order: leads, money, dates, '
     + 'contracts, team',
       JSON.stringify(Object.keys(r.json.needs_attention))
         === JSON.stringify(['lead_unanswered', 'invoice_due', 'events_today',
                             'contract_unsigned', 'team_tasks']));

  // D-4's tie rule.
  // The cell's FIRST cut asserted `l2` — the NEWEST row — and reddened against
  // a correct door. D-4's tie rule is oldest-first; the bench had it backwards.
  // Recorded rather than quietly corrected: an instrument that was wrong once
  // is why the estate reads evidence and not sentences.
  cell('4.5 · [D-4] leads are oldest-first, and the fixture is seeded '
     + 'newest-first so the sort must actually run',
       r.json.needs_attention.lead_unanswered[0]?.id === 'l1',
       r.json.needs_attention.lead_unanswered.map((x) => x.id).join(','));

  // ── HOLE M25, FOUND BY MUTATION ─────────────────────────────────────────
  // Flipping `nullsFirst` on events reddened nothing: no fixture carried a null
  // `event_time`. An all-day job has no clock and must lead the morning, not
  // trail the evening — the ordering was asserted only where it could not fail.
  const nullTime = emptyStore();
  nullTime.events = [event({ id: 'e-0900', event_time: '09:00:00' }),
                     event({ id: 'e-allday', event_time: null })];
  const rn = await callDoor(nullTime);
  cell('4.5b · an all-day event (null event_time) LEADS the timed ones',
       rn.json.needs_attention.events_today.map((x) => x.id).join(',')
         === 'e-allday,e-0900',
       rn.json.needs_attention.events_today.map((x) => x.id).join(','));

  cell('4.6 · nothing is truncated below the cap',
       Object.values(r.json.truncated).every((t) => t === false));

  // THE CAP AND ITS TELL.
  const many = emptyStore();
  many.leads = Array.from({ length: 25 }, (_, i) =>
    lead({ id: `bulk-${String(i).padStart(2, '0')}`,
           created_at: `2026-08-${String(i + 1).padStart(2, '0')}T04:00:00Z` }));
  const rm = await callDoor(many);
  cell('4.7 · the cap holds at 20', rm.json.needs_attention.lead_unanswered.length === 20,
       String(rm.json.needs_attention.lead_unanswered.length));
  cell('4.8 · [F-3 arm b] truncated says so — a badge that is secretly a floor '
     + 'is the false-done class in miniature',
       rm.json.truncated.lead_unanswered === true);
  cell('4.9 · count still equals the SHIPPED length when capped',
       rm.json.counts.lead_unanswered === rm.json.needs_attention.lead_unanswered.length);

  // has_any, BOTH WAYS — R-37.68's contract.
  const virgin = await callDoor(emptyStore());
  cell('4.10 · [R-37.68] has_any FALSE for no-data-ever',
       virgin.status === 200 && virgin.json.has_any === false);

  const quiet = emptyStore();
  // Every row exists but NONE qualifies: a lost lead, a paid invoice due long
  // ago, a signed contract, a cancelled task. This is the QUIET DAY, and it is
  // the case the first-run manual must never re-appear on.
  quiet.leads      = [lead({ state: 'lost' })];
  quiet.invoices   = [invoice({ state: 'paid', last_payment_at: '2026-01-01T00:00:00Z' })];
  quiet.contracts  = [contract({ state: 'signed', signed_at: '2026-01-01T00:00:00Z' })];
  quiet.team_tasks = [task({ state: 'cancelled' })];
  const rq = await callDoor(quiet);
  const allEmpty = Object.values(rq.json.needs_attention).every((l) => l.length === 0)
                && Object.values(rq.json.done_today).every((l) => l.length === 0);
  cell('4.11 · the quiet day IS empty', allEmpty, JSON.stringify(rq.json.needs_attention));
  cell('4.12 · [R-37.68] has_any TRUE on a quiet day — the manual does not '
     + 'come back for a vendor who has used the product',
       rq.json.has_any === true);

  // ── HOLE M26, FOUND BY MUTATION ─────────────────────────────────────────
  // Dropping `.is('deleted_at', null)` from the has_any probe reddened nothing:
  // no fixture had a vendor whose ONLY rows were soft-deleted. The probe would
  // have counted deleted rows as evidence the vendor has data.
  const onlyDeleted = emptyStore();
  onlyDeleted.leads      = [lead({ deleted_at: '2026-08-02T00:00:00Z' })];
  onlyDeleted.invoices   = [invoice({ deleted_at: '2026-08-02T00:00:00Z' })];
  onlyDeleted.events     = [event({ deleted_at: '2026-08-02T00:00:00Z' })];
  onlyDeleted.team_tasks = [task({ deleted_at: '2026-08-02T00:00:00Z' })];
  const rod = await callDoor(onlyDeleted);
  cell('4.13b · the probe respects soft-delete — deleted rows are not evidence '
     + 'the vendor has data',
       rod.status === 200 && rod.json.has_any === false,
       `has_any ${rod.json.has_any}`);

  const busy = await callDoor(s);
  cell('4.13 · has_any TRUE without probing when the feed is non-empty',
       busy.json.has_any === true);

  // ── HOLE M21, FOUND BY MUTATION ─────────────────────────────────────────
  // Flipping the probe's fail-posture from `true` to `false` reddened NOTHING:
  // no fixture could make a probe fail, so the branch was unguarded. A vendor
  // with a full desk would have been shown the first-run manual because one
  // read hiccuped — the estate asserting an absence it never checked, which is
  // the exact class byte 5 of the Phase 1 Today page refuses.
  const broken = await callDoor(emptyStore(), { failCountOn: 'leads' });
  cell('4.14 · a FAILED probe does not become a "no" — has_any fails toward '
     + 'the quiet day, because the resting state is wrong about nothing',
       broken.status === 200 && broken.json.has_any === true,
       `status ${broken.status} has_any ${broken.json.has_any}`);
  cell('4.15 · and the door still answers 200 — a probe is not the spine',
       broken.status === 200 && broken.json.ok === true);
}

console.log('\n§5 · THE CONNECT GATE AND THE THIRD-DOOR CENSUS');
{
  const basic = emptyStore('basic');
  basic.leads = [lead()];
  const rb = await callDoor(basic);
  const row = rb.json.needs_attention.lead_unanswered[0] || {};

  // PAYLOAD-PROOF. Asserted against the RAW SERIALIZED BYTES, so no cell here
  // can be satisfied by a client-side class.
  const bytes = JSON.stringify(rb.json);
  cell('5.1 · no `phone` key anywhere on the wire, basic tier',
       !('phone' in row) && !bytes.includes('"phone"'));
  cell('5.2 · no `email` key anywhere on the wire, basic tier',
       !('email' in row) && !bytes.includes('"email"'));
  cell('5.3 · the lead\'s NAME rides — R-36.13 grants it, and a surface may '
     + 'withhold but may never claim ignorance',
       row.name === 'Sarah');
  cell('5.4 · redacted:true for basic', row.redacted === true);

  const essential = emptyStore('essential');
  essential.leads = [lead()];
  const re = await callDoor(essential);
  const erow = re.json.needs_attention.lead_unanswered[0] || {};
  cell('5.5 · redacted:false for a paying tier', erow.redacted === false);
  cell('5.6 · and STILL no contact column — this door never asks, at any tier',
       !('phone' in erow) && !('email' in erow));

  // 'gold' — a spelling the canon does not contain. The cell's FIRST cut used
  // `'Essential '`, which `resolveTier` trims and lowercases back to canon, so
  // it asserted fail-to-redacted against a tier that resolves cleanly and
  // reddened against a correct door. Derived by running the exported function
  // rather than reasoning about it.
  const unknown = emptyStore('gold');
  unknown.leads = [lead()];
  const ru = await callDoor(unknown);
  cell('5.7 · [R-36.10] an unknown tier spelling FAILS TO REDACTED',
       ru.json.needs_attention.lead_unanswered[0]?.redacted === true,
       'resolveTier is imported from one home, never re-implemented here');

  // ── THE CENSUS, BY AN INDEPENDENT METHOD (F-P3.4) ───────────────────────
  // The pin is diffed against the keys the door ACTUALLY PUT ON THE WIRE, not
  // against a regex over its SELECT constant. A regex would reproduce the
  // method under test; the wire is a different failure mode entirely.
  const { FEED_SELECT_CENSUS } = require(P('src/lib/vendor/leadSerializer.js'));
  const wireKeys = Object.keys(erow).filter((k) => k !== 'redacted').sort();
  const pinned   = [...FEED_SELECT_CENSUS].sort();
  cell('5.8 · [F-P3.4] the feed\'s lead wire matches FEED_SELECT_CENSUS — a '
     + 'contact column reaching THIS door now reds the guard too',
       JSON.stringify(wireKeys) === JSON.stringify(pinned),
       `wire ${wireKeys.join(',')} vs pin ${pinned.join(',')}`);

  // ── HOLE M13, FOUND BY MUTATION AND CURED HERE ──────────────────────────
  // 5.8 diffs the WIRE. Adding `phone` to the door's SELECT reddened nothing,
  // because the mapper enumerates its keys by hand: the column was fetched and
  // then dropped. Clean wire, quiet guard, contact data in process memory. This
  // cell diffs THE SELECT ITSELF, read as an exported constant — a different
  // failure mode from the wire, per the independent-method law.
  const doorSelect = require(P('src/api/vendor/worklistToday.js')).LEAD_FEED_SELECT;
  const selectCols = String(doorSelect).split(',').map((x) => x.trim()).filter(Boolean).sort();
  cell('5.10 · [F-P3.4] the door\'s SELECT matches the pin — a contact column '
     + 'FETCHED but not shipped is still a column this door asked for',
       JSON.stringify(selectCols) === JSON.stringify(pinned),
       `select ${selectCols.join(',')} vs pin ${pinned.join(',')}`);

  const { WITHHELD_FIELDS } = require(P('src/lib/vendor/leadSerializer.js'));
  cell('5.9 · no withheld field is in the pin — the strictest of the three doors',
       WITHHELD_FIELDS.every((f) => !FEED_SELECT_CENSUS.includes(f)));
}

console.log('\n§6 · READ-ONLY BY LAW (D-3) — THE MUTATION CELL');
{
  const s = emptyStore();
  s.leads = [lead()]; s.invoices = [invoice()]; s.events = [event()];
  s.contracts = [contract()]; s.team_tasks = [task()];
  const r = await callDoor(s);
  cell('6.1 · [D-3] ZERO writes on a FULL feed', r.status === 200 && r.writes.length === 0,
       JSON.stringify(r.writes));

  const virgin = await callDoor(emptyStore());
  cell('6.2 · [D-3] ZERO writes on the has_any probe path too — the branch '
     + 'that runs least often is the one an audit would miss',
       virgin.status === 200 && virgin.writes.length === 0,
       `status ${virgin.status} writes ${JSON.stringify(virgin.writes)}`);

  // NON-VACUITY OF THE RECORDER ITSELF. If the fake could not see a write, 6.1
  // and 6.2 would be greens over an instrument that observes nothing — which is
  // the hollow green this estate spent a block killing.
  const probe = [];
  const sb = makeSupabase(emptyStore(), probe);
  sb.from('leads').insert({ x: 1 });
  sb.from('leads').update({ x: 1 });
  sb.from('leads').upsert({ x: 1 });
  sb.from('leads').delete();
  cell('6.3 · the recorder SEES all four write ops (the cell that proves 6.1 '
     + 'is not hollow)', probe.length === 4,
       `saw ${probe.map((w) => w.op).join(',')}`);
}

console.log('\n§7 · STRUCTURAL — read from CODE, never from prose');
{
  // §7 is the disposition table: facts that are genuinely structural rather
  // than behavioural. Each reads an exported constant or the tree, never a
  // comment, and says so.
  const clock = require(P('src/lib/vendor/istClock.js'));
  const w = clock.istDayWindowUtc('2026-08-27');
  cell('7.1 · the IST window is [D-1T18:30Z, DT18:30Z)',
       w.start === '2026-08-26T18:30:00.000Z' && w.end === '2026-08-27T18:30:00.000Z',
       `${w.start} .. ${w.end}`);
  cell('7.2 · istDateOf returns null for a missing timestamp — a row with no '
     + 'completion must not become a date',
       clock.istDateOf(null) === null && clock.istDateOf(undefined) === null);
  cell('7.3 · istDateOf puts 20:30Z on the NEXT IST day',
       clock.istDateOf('2026-08-26T20:30:00Z') === '2026-08-27');

  // ── HOLE M29, FOUND BY MUTATION ─────────────────────────────────────────
  // Vocabularies from the CONSTRAINTS ADDENDUM, by name:
  //   invoices_state_check   {unpaid, advance_paid, paid, cancelled}
  //   team_tasks_state_check {open, in_progress, done, cancelled}
  const door = require(P('src/api/vendor/worklistToday.js'));
  const INVOICE_VOCAB = ['unpaid', 'advance_paid', 'paid', 'cancelled'];
  const TASK_VOCAB    = ['open', 'in_progress', 'done', 'cancelled'];
  cell('7.8 · every invoice state filtered on is one the CHECK allows',
       door.INVOICE_DUE_STATES.every((x) => INVOICE_VOCAB.includes(x)),
       door.INVOICE_DUE_STATES.join(','));
  cell('7.9 · [§8.5] every task state filtered on is one team_tasks can hold — '
     + 'the team_payments fold was REFUSED and a stray `owed` here would be '
     + 'that arm arriving by the back door',
       door.TASK_OPEN_STATES.every((x) => TASK_VOCAB.includes(x)),
       door.TASK_OPEN_STATES.join(','));

  // ── THE §9.7 TRAP, ITS OWN CELL ─────────────────────────────────────────
  // `public.contracts` has no `deleted_at`; four sibling tables do, which is
  // exactly why a filter gets written here from habit. This cell drives the
  // door against a contracts fixture and asserts it ANSWERS — under the fake's
  // witnessed-column guard, a soft-delete filter on this table throws the same
  // way postgres would, so a green here is the absence of that filter proved by
  // execution rather than by reading the query.
  const con = emptyStore(); con.contracts = [contract()];
  const rcon = await callDoor(con);
  cell('7.10 · [§9.7] the contracts query names no column the table lacks — '
     + 'the soft-delete filter written from habit would fail here',
       rcon.status === 200 && rcon.json.needs_attention.contract_unsigned?.length === 1,
       `status ${rcon.status}`);

  cell('7.4 · [§8.8] the tombstone stays dead — src/api/vendor/today.js is absent',
       !fs.existsSync(P('src/api/vendor/today.js')));
  const core = fs.readFileSync(P('src/api/vendor/core.js'), 'utf8');
  cell('7.5 · [F-1 arm b] the live engine `/today` mount is UNTOUCHED',
       core.includes("router.use('/today',    require('../vendor-engine/today'));"));
  cell('7.6 · [F-1 arm b] the feed is mounted at its own segment',
       core.includes("router.use('/worklist', require('./worklistToday'));"));
  cell('7.7 · [§8.9] the engine reader still exists — its retirement is a '
     + 'chartered cross-repo seam, not this sitting\'s',
       fs.existsSync(P('src/api/vendor-engine/today.js')));
}

console.log(`\n${'─'.repeat(70)}`);
console.log(`b39_worklist_today_bench: ${pass} PASS · ${fail} FAIL  (of ${pass + fail})`);
if (fail) { console.log('RED:'); failures.forEach((f) => console.log(`  - ${f}`)); }
console.log('─'.repeat(70));
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH THREW:', e); process.exit(1); });
