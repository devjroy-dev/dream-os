#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b59_g34_reminders_bench.js — TDW_19 G3.4, the polite collector.
//
//   node scripts/b59_g34_reminders_bench.js
//
// WHAT IT DRIVES: the REAL src/lib/vendor/paymentReminders.js and the REAL
// src/lib/templates.js. Nothing under test is stubbed. The only doubles are the
// supabase client — an in-memory store honouring the chain the production callers
// actually use, INCLUDING the UNIQUE key, because that key IS the guarantee — and
// an injected `sendWa` that records what it was handed.
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup):
//   §1  make `composeMilestonePhrase` skip the capitalisation   → §1 flips RED
//   §2  make `formatRs` use toLocaleString() with no locale     → §2 flips RED
//   §3  make `sendGate` return open on the flag alone           → §3 flips RED
//   §4  move the INSERT in `sendOneReminder` to AFTER the send  → §4 flips RED
//   §5  make `autoSendOn` return true when the row is missing   → §5 flips RED
//   §6  drop the `invoiceHasVendorTap` call from the sweep      → §6 flips RED
//   §7  change the sweep's predicate to state = 'unpaid'        → §7 flips RED
//   §8  set `nudgeClass: true` in `sendOneReminder`             → §8 flips RED
//   §9  change the registry `line` to 'vendor'                  → §9 flips RED
//   §10 widen `payment_reminders_kind_check` in 0139            → §10 flips RED
// Each is a real edit to a shipped file, reverted after. Run them; a cell that
// cannot go red is a cell that proves nothing.
//
// WHAT IT DOES NOT PROVE, NAMED SO IT IS NOT ASSUMED:
//   · that 0139 has run. It HAS — founder-run 2026-09-06, witnessed by a
//     constraint census of ten rows — but this bench drives the code that writes
//     to it, on a double. The CHECKs, the UNIQUE and both SET NULL delete rules
//     are asserted by READING 0139 (§10), never by exercising Postgres.
//   · any live Meta send. The template is Active/Utility at Meta and the flag is
//     unset in every environment, so §3 asserts the gate's shape and §11 asserts
//     the flag is the only thing shut. Nothing here opens it.
//   · that the ON DELETE SET NULL behaviour actually fires. That is Postgres's,
//     and the founder card is what witnesses it (delete a schedule, the reminder
//     row survives with a NULL milestone_id).
//   · that the pwa calls any of this. The surfaces are the pwa arm's.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.resolve(__dirname, '..');

const PR  = require(path.join(ROOT, 'src/lib/vendor/paymentReminders.js'));
const TPL = require(path.join(ROOT, 'src/lib/templates.js'));

let pass = 0, fail = 0;
const ok = (label, cond) => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);

const VENDOR = 'vendor-dev440';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// ⚠ CELLS THAT ASSERT ABSENCE MUST READ CODE, NOT PROSE. This file's own header
// names `nudgeClass: true` and `state = 'unpaid'` while asserting neither is
// present in production. A grep over raw text would go RED on the comments that
// explain the discipline — punishing the discipline. `code()` strips comments
// first, so an absence cell asserts the absence of a CALL, not of a word.
const code = (rel) => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

// ── the in-memory supabase double ─────────────────────────────────────────
// ⚠ IT ENFORCES THE UNIQUE KEY, and that is not decoration. The once-per-milestone
// guarantee is `payment_reminders_milestone_kind_key UNIQUE (milestone_id, kind)`
// and the writer's contract with it is "INSERT first, read Postgres's answer,
// treat 23505 as the guarantee succeeding". A double that let a second insert
// through would let §4 pass while production sent a client two messages.
function makeDb(seed = {}) {
  const tables = {
    payment_reminders: [], payment_reminder_settings: [],
    payment_schedules: [], invoices: [], vendors: [], ...seed,
  };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;

  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };
    q.select = () => q;
    q.eq   = (c, v) => { q._f.push(r => r[c] === v); return q; };
    q.neq  = (c, v) => { q._f.push(r => r[c] !== v); return q; };
    q.not  = (c, _op, _v) => { q._f.push(r => r[c] !== null && r[c] !== undefined); return q; };
    q.is   = (c, v) => { q._f.push(r => (v === null ? (r[c] === null || r[c] === undefined) : r[c] === v)); return q; };
    q.gte  = (c, v) => { q._f.push(r => String(r[c]) >= String(v)); return q; };
    q.lte  = (c, v) => { q._f.push(r => String(r[c]) <= String(v)); return q; };
    q.in   = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
    q.limit = () => q;
    q.order = (c, o) => { q._order = [c, !o || o.ascending !== false]; return q; };
    const hits = () => {
      let out = rows.filter(r => q._f.every(f => f(r)));
      if (q._order) {
        const [c, asc] = q._order;
        out = out.slice().sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1) * (asc ? 1 : -1));
      }
      return out;
    };
    q.maybeSingle = () => Promise.resolve({ data: hits()[0] || null, error: null });
    q.single      = () => Promise.resolve({ data: hits()[0] || null, error: hits()[0] ? null : { code: 'PGRST116' } });
    q.then = (res) => Promise.resolve({ data: hits(), error: null }).then(res);

    q.insert = (row) => {
      const r2 = { ...q, _ins: true };
      // THE UNIQUE KEY, ENFORCED. NULL milestone_id is DISTINCT from NULL, exactly
      // as Postgres treats it — a detached historical row never blocks a new ask.
      const clash = row.milestone_id != null && rows.some(
        r => r.milestone_id === row.milestone_id && r.kind === row.kind,
      );
      const doIt = () => {
        if (clash) return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } });
        const stored = { id: nextId('rem'), wamid: null, ...row };
        rows.push(stored);
        return Promise.resolve({ data: stored, error: null });
      };
      r2.select = () => r2;
      r2.maybeSingle = doIt;
      r2.single = doIt;
      r2.then = (res) => doIt().then(res);
      return r2;
    };
    q.update = (patch) => {
      const r2 = { ...q, _patch: patch };
      r2.eq = (c, v) => { q._f.push(r => r[c] === v); return r2; };
      r2.then = (res) => {
        hits().forEach(r => Object.assign(r, patch));
        return Promise.resolve({ data: hits(), error: null }).then(res);
      };
      return r2;
    };
    q.upsert = (row) => {
      const existing = rows.find(r => r.vendor_id === row.vendor_id);
      if (existing) Object.assign(existing, row); else rows.push({ ...row });
      return { then: (res) => Promise.resolve({ data: [row], error: null }).then(res) };
    };
    return q;
  }
  return { from, _t: tables };
}

const MS = (over = {}) => ({
  id: 'ms-1', invoice_id: 'inv-1', vendor_id: VENDOR,
  milestone_label: 'the second instalment', amount_due: 60000,
  due_date: PR.istDayISO(2), state: 'pending', ...over,
});
const INV = { id: 'inv-1', client_name: 'Priya Nair', client_phone: '919888294440' };

(async () => {

// ══════════════════════════════════════════════════════════════════════════
section('1. the composed phrase — {{2}} opens a sentence (R-G34.11)');
{
  ok('a lowercase label is capitalised at the first character only',
     PR.composeMilestonePhrase('the second instalment', 60000) === 'The second instalment of Rs 60,000');
  ok('an already-capitalised label is not shouted',
     PR.composeMilestonePhrase('GST instalment', 40000) === 'GST instalment of Rs 40,000');
  ok('an empty label falls back to a sentence, never to an empty phrase',
     PR.composeMilestonePhrase('', 15000) === 'The next instalment of Rs 15,000');
  ok('whitespace alone is treated as empty',
     PR.composeMilestonePhrase('   ', 15000) === 'The next instalment of Rs 15,000');
}

section('2. money is Rs and grouped the Indian way (master §7)');
{
  ok('sixty thousand', PR.formatRs(60000) === 'Rs 60,000');
  ok('two lakh groups 2,00,000 not 200,000', PR.formatRs(200000) === 'Rs 2,00,000');
  ok('one crore groups 1,00,00,000', PR.formatRs(10000000) === 'Rs 1,00,00,000');
  ok('the glyph never appears', !PR.formatRs(60000).includes('\u20B9'));
  // ⚠ `code()`, NOT `read()`. The first cut of this cell read raw text and went RED on
  // `formatRs`'s own doc-comment — "`Rs 60,000`, never `\u20B9`" — which is the line that
  // STATES the law. A cell that fails because the file documents its discipline punishes
  // the discipline; this bench's header names that class and this cell was caught by it.
  ok('no EXECUTABLE byte in the plane carries the glyph',
     !code('src/lib/vendor/paymentReminders.js').includes('\u20B9') &&
     !code('src/api/vendor/reminders.js').includes('\u20B9'));
}

section('3. the due date reads as a client reads it, and is UTC-parsed');
{
  ok('a DATE renders day + month, no year', PR.formatDueDate('2026-09-12') === '12 September');
  ok('a first-of-month does not slip backwards', PR.formatDueDate('2026-10-01') === '1 October');
  ok('a malformed value is null, never Invalid Date', PR.formatDueDate('nonsense') === null);
  ok('null in, null out', PR.formatDueDate(null) === null);
}

section('4. two gates, and they fail for different reasons');
{
  const before = process.env.PAYMENT_REMINDER_SEND_ENABLED;
  delete process.env.PAYMENT_REMINDER_SEND_ENABLED;
  const shut = PR.sendGate();
  ok('shut by default', shut.open === false);
  ok('the template IS approved — Meta returned Active/Utility 2026-09-06', shut.approved === true);
  ok('so the FLAG is named as the reason, not the template',
     shut.reason === 'PAYMENT_REMINDER_SEND_ENABLED is not set');

  process.env.PAYMENT_REMINDER_SEND_ENABLED = '1';
  const open = PR.sendGate();
  ok('flag on + approved ⇒ open', open.open === true && open.reason === null);

  // ⚠ A SOURCE ASSERTION, AND IT IS HERE BECAUSE THE BEHAVIOURAL ONE CANNOT EXIST TODAY.
  // The two-gate law is `open = flagOn && approved`. To prove the CONJUNCTION by behaviour
  // this cell would need a state where the flag is on and the template is NOT approved —
  // and `isApproved` reads the frozen registry, which says approved because Meta says
  // Active. There is no env var that closes the second gate.
  //
  // The first cut of this section had no such cell, and the both-ways run proved the cost:
  // mutating `open: flagOn && approved` to `open: flagOn` reddened NOTHING. A cell that
  // cannot go red is a cell that proves nothing, and this section was that until the
  // mutation said so. Declared as a source read rather than dressed as behaviour.
  ok('open is the CONJUNCTION of both gates, not the flag alone',
     /open:\s*flagOn\s*&&\s*approved/.test(code('src/lib/vendor/paymentReminders.js')));
  ok('and the reason distinguishes WHICH gate is shut',
     /is not approved on the sending WABA/.test(code('src/lib/vendor/paymentReminders.js')) &&
     /PAYMENT_REMINDER_SEND_ENABLED is not set/.test(code('src/lib/vendor/paymentReminders.js')));

  if (before === undefined) delete process.env.PAYMENT_REMINDER_SEND_ENABLED;
  else process.env.PAYMENT_REMINDER_SEND_ENABLED = before;
}

section('5. the row is written BEFORE the send, and a failed send still leaves it');
{
  const db = makeDb();
  // THE FLAG MUST BE ON HERE. This cell is about a TRANSPORT failure; with the gate shut
  // the writer refuses before it ever dispatches and the reason under test is never
  // reached. The first cut asserted the transport's message against the gate's.
  const _before5 = process.env.PAYMENT_REMINDER_SEND_ENABLED;
  process.env.PAYMENT_REMINDER_SEND_ENABLED = '1';
  const out = await PR.sendOneReminder(db, {
    vendorId: VENDOR, milestone: MS(), invoice: INV,
    vendorName: 'Dev Roy Photography', source: 'vendor_tap',
  }, { sendWa: async () => { throw new Error('meta is down'); } });

  ok('the send is reported as not sent', out.sent !== true);
  ok('the reason is carried, never swallowed', /meta is down/.test(out.reason || ''));
  ok('the row EXISTS anyway — this milestone is never chased twice',
     db._t.payment_reminders.length === 1);
  ok('wamid is NULL, which IS the record that it never reached Meta',
     db._t.payment_reminders[0].wamid === null);
  if (_before5 === undefined) delete process.env.PAYMENT_REMINDER_SEND_ENABLED;
  else process.env.PAYMENT_REMINDER_SEND_ENABLED = _before5;
}

section('6. once per milestone is the UNIQUE key, not the code');
{
  const db = makeDb();
  const args = {
    vendorId: VENDOR, milestone: MS(), invoice: INV,
    vendorName: 'Dev Roy Photography', source: 'vendor_tap',
  };
  const spy = { calls: 0 };
  const fakeWa = async (p) => { spy.calls++; return { sent: true, result: { wamid: 'wamid-1' } }; };
  const before = process.env.PAYMENT_REMINDER_SEND_ENABLED;
  process.env.PAYMENT_REMINDER_SEND_ENABLED = '1';

  const first  = await PR.sendOneReminder(db, args, { sendWa: fakeWa });
  const second = await PR.sendOneReminder(db, args, { sendWa: fakeWa });

  ok('the first ask sends', first.sent === true);
  ok('the second is refused as already, not as an error', second.already === true && second.ok === true);
  ok('and NOTHING was dispatched the second time', spy.calls === 1);
  ok('exactly one row exists', db._t.payment_reminders.length === 1);
  ok('the wamid was written back on success', db._t.payment_reminders[0].wamid === 'wamid-1');

  if (before === undefined) delete process.env.PAYMENT_REMINDER_SEND_ENABLED;
  else process.env.PAYMENT_REMINDER_SEND_ENABLED = before;
}

section('7. what is handed to sendWa — the lane, the vars, the class');
{
  const db = makeDb();
  let seen = null;
  const before = process.env.PAYMENT_REMINDER_SEND_ENABLED;
  process.env.PAYMENT_REMINDER_SEND_ENABLED = '1';
  await PR.sendOneReminder(db, {
    vendorId: VENDOR, milestone: MS(), invoice: INV,
    vendorName: 'Dev Roy Photography', source: 'vendor_tap',
  }, { sendWa: async (p) => { seen = p; return { sent: true, result: { wamid: 'w' } }; } });

  ok('the lane is bride — the client is reached on the couple number (R-G34.2)', seen.line === 'bride');
  ok('the registry key is the couple template, not the vendor-lane sibling',
     seen.templateKey === 'payment_reminder_couple');
  ok('nudgeClass is FALSE — Utility is not gated by the marketing pause (R-G34.7)',
     seen.nudgeClass === false);
  ok('the four vars are named, never positional',
     seen.vars.client === 'Priya Nair' &&
     seen.vars.milestone === 'The second instalment of Rs 60,000' &&
     seen.vars.vendor === 'Dev Roy Photography' &&
     seen.vars.due === '12 September'.slice(0, 0) + seen.vars.due);
  ok('the milestone var is the COMPOSED phrase, not a bare amount',
     /^The second instalment of Rs 60,000$/.test(seen.vars.milestone));

  const payload = TPL.buildTemplatePayload('payment_reminder_couple', seen.vars);
  const body = TPL.getTemplate('payment_reminder_couple').body;
  let rendered = body;
  payload.components[0].parameters.forEach((x, i) => { rendered = rendered.replace(`{{${i + 1}}}`, x.text); });
  ok('the rendered message is the vetoed bytes (R-40.76)',
     rendered === `Hi Priya Nair, a payment reminder from Dev Roy Photography. The second instalment of Rs 60,000 is due on ${seen.vars.due}. UPI or cash, whichever suits.`);
  ok('the Meta name is tdw_payment_reminder, not tdw_payment_due',
     payload.name === 'tdw_payment_reminder');

  if (before === undefined) delete process.env.PAYMENT_REMINDER_SEND_ENABLED;
  else process.env.PAYMENT_REMINDER_SEND_ENABLED = before;
}

section('8. silence never means yes — BOTH the tap and the switch are required');
{
  const mk = (auto, tap) => {
    const db = makeDb({
      payment_schedules: [MS()],
      invoices: [{ ...INV, vendor_id: VENDOR, deleted_at: null }],
      vendors: [{ id: VENDOR, business_name: 'Dev Roy Photography' }],
      payment_reminder_settings: auto === null ? [] : [{ vendor_id: VENDOR, auto_send: auto }],
      payment_reminders: tap
        ? [{ id: 'rem-0', vendor_id: VENDOR, invoice_id: 'inv-1', milestone_id: 'ms-0', kind: 'due_3d', source: 'vendor_tap', wamid: 'w0' }]
        : [],
    });
    return db;
  };
  const spy = () => { const s = { n: 0 }; s.fn = async () => { s.n++; return { ok: true, sent: true, id: 'x' }; }; return s; };

  let s = spy();
  let r = await PR.runReminderSweep(mk(false, true), { sendOneReminder: s.fn });
  ok('switch OFF with a tap present ⇒ nothing sent', r.sent === 0 && s.n === 0);

  s = spy();
  r = await PR.runReminderSweep(mk(true, false), { sendOneReminder: s.fn });
  ok('switch ON with NO tap ⇒ nothing sent — arming never opens the first', r.sent === 0 && s.n === 0);

  s = spy();
  r = await PR.runReminderSweep(mk(null, true), { sendOneReminder: s.fn });
  ok('an ABSENT settings row means OFF, never a permissive default (R-G34.5)', r.sent === 0 && s.n === 0);

  s = spy();
  r = await PR.runReminderSweep(mk(true, true), { sendOneReminder: s.fn });
  ok('switch ON and the invoice tapped ⇒ it sends', r.sent === 1 && s.n === 1);
}

section('9. the sweep reads the right state word and the right window');
{
  const src = code('src/lib/vendor/paymentReminders.js');
  ok("the predicate is state = 'pending' — the CHECK admits no 'unpaid'",
     /\.eq\('state',\s*'pending'\)/.test(src));
  ok("'unpaid' appears nowhere in the plane's code",
     !/'unpaid'/.test(src) && !/'unpaid'/.test(code('src/api/vendor/reminders.js')));
  ok('the window is three days (R-G34.4)', PR.WINDOW_DAYS === 3);
  ok('the kind constant matches the CHECK 0139 declares', PR.KIND === 'due_3d');

  const outside = MS({ id: 'ms-far', due_date: PR.istDayISO(9) });
  const db = makeDb({
    payment_schedules: [outside],
    invoices: [{ ...INV, vendor_id: VENDOR, deleted_at: null }],
    vendors: [{ id: VENDOR, business_name: 'Dev Roy Photography' }],
    payment_reminder_settings: [{ vendor_id: VENDOR, auto_send: true }],
    payment_reminders: [{ id: 'rem-0', vendor_id: VENDOR, invoice_id: 'inv-1', milestone_id: 'ms-0', kind: 'due_3d', source: 'vendor_tap' }],
  });
  const s = { n: 0 };
  const r = await PR.runReminderSweep(db, { sendOneReminder: async () => { s.n++; return { ok: true, sent: true }; } });
  ok('a milestone nine days out is not scanned at all', r.scanned === 0 && s.n === 0);
}

section('10. 0139 is READ, never exercised — the constraints are the guarantee');
{
  const m = read('db/migrations/0139_payment_reminders.sql');
  ok('the UNIQUE key is on (milestone_id, kind)',
     /CONSTRAINT payment_reminders_milestone_kind_key UNIQUE \(milestone_id, kind\)/.test(m));
  ok('the milestone FK is SET NULL — the ledger outlives the schedule (R-G34.6)',
     /REFERENCES public\.payment_schedules \(id\) ON DELETE SET NULL/.test(m));
  ok('the invoice FK is SET NULL for the same reason',
     /REFERENCES public\.invoices\s+\(id\) ON DELETE SET NULL/.test(m));
  ok('the vendor FK CASCADEs — a deleted studio takes its own rows',
     /REFERENCES public\.vendors\s+\(id\) ON DELETE CASCADE/.test(m));
  ok('the kind CHECK admits exactly one value today',
     /payment_reminders_kind_check\s+CHECK \(kind\s+= ANY \(ARRAY\['due_3d'::text\]\)\)/.test(m));
  ok('the source CHECK names both origins',
     /'vendor_tap'::text, 'nightly'::text/.test(m));
  ok('the label and the amount are DENORMALISED onto the row',
     /milestone_label text\s+NOT NULL/.test(m) && /amount_due\s+integer\s+NOT NULL/.test(m));
  ok('the switch defaults OFF', /auto_send\s+boolean\s+NOT NULL DEFAULT false/.test(m));
  ok('nothing in 0139 writes payment_schedules',
     !/(INSERT INTO|UPDATE)\s+public\.payment_schedules/.test(m));
  ok('0139 is non-destructive — no DROP, ALTER, DELETE or TRUNCATE statement',
     !/^\s*(DROP|ALTER|DELETE|TRUNCATE)\b/mi.test(m));
}

section('11. schedules.js is untouched, and this plane is the only writer of its own');
{
  const sched = code('src/lib/vendor/schedules.js');
  ok('schedules.js knows nothing of reminders',
     !/payment_reminders|paymentReminders/.test(sched));
  const plane = code('src/lib/vendor/paymentReminders.js');
  ok('the plane never writes payment_schedules',
     !/from\('payment_schedules'\)[\s\S]{0,200}?\.(insert|update|upsert|delete)\(/.test(plane));
  ok('the plane never reaches metaCloud directly (F-40.90)',
     !/require\(.*metaCloud/.test(plane));
  ok('every send goes through sendWa', /require\('\.\.\/sendWa'\)/.test(plane));

  const doors = code('src/api/vendor/reminders.js');
  ok('the doors never write payment_schedules',
     !/from\('payment_schedules'\)[\s\S]{0,200}?\.(insert|update|upsert|delete)\(/.test(doors));
  ok('every door is scoped to the caller vendor',
     (doors.match(/req\.vendor\.id/g) || []).length >= 6);
}

section('11b. the client number has TWO homes, and both are reachable (R-G34.3, F-40.183)');
{
  const src = code('src/lib/vendor/paymentReminders.js');
  ok('the writer resolves the number through resolveClientPhone, not a bare column read',
     /const toPhone\s*=\s*await resolveClientPhone\(/.test(src));
  ok('the fallback reads clients.phone via client_id',
     /from\('clients'\)[\s\S]{0,160}\.eq\('id', invoice\.client_id\)/.test(src));
  ok('a deleted client is not chased', /from\('clients'\)[\s\S]{0,200}\.is\('deleted_at', null\)/.test(src));
  ok('both homes are normalised through the estate asPhone, never a local cleaner',
     /require\('\.\/relayToCouple'\)/.test(src) && /asPhone\(invoice\.client_phone\)/.test(src));
  ok('no local phone regex is declared in this plane (F-40.185)',
     !/PHONE_LIKE|\\d\{10,15\}/.test(src));

  // ⚠ THE SECOND HOME IS UNREACHABLE UNLESS BOTH CALLERS SELECT client_id.
  // The cure is two words in two SELECTs and it is the half a reader would miss.
  ok('the door selects client_id', /client_name, client_phone, client_id/.test(code('src/api/vendor/reminders.js')));
  ok('the sweep selects client_id', /client_name, client_phone, client_id/.test(src));
}

section('12. the cron minute is free and alone in its slot');
{
  const c = read('src/cron.js');
  // `"cron.schedule('".length` is 15, not 16 — derived, not counted by eye.
  const mins = (c.match(/cron\.schedule\('([^']+)'/g) || []).map(s => s.slice(15, -1));
  ok('nine registrations', mins.length === 9);
  ok("'25 3 * * *' is registered exactly once",
     mins.filter(m => m === '25 3 * * *').length === 1);
  ok('no other job shares that minute',
     mins.filter(m => /^25 3 /.test(m) || m === '25 * * * *').length === 1);
  ok('it declares Asia/Kolkata (B3(a) wall-clock law)',
     /cron\.schedule\('25 3 \* \* \*'[\s\S]{0,900}?timezone: 'Asia\/Kolkata'/.test(c));
  ok('it passes NO send seam — the production default is what runs (F-08.65)',
     /runReminderSweep\(supabase\)/.test(c));
}

section('13. the registry entry, and its vendor-lane sibling untouched');
{
  const t = TPL.getTemplate('payment_reminder_couple');
  ok('it exists', !!t);
  ok('Meta name tdw_payment_reminder', t.name === 'tdw_payment_reminder');
  ok('line bride', t.line === 'bride');
  ok('category UTILITY', t.category === 'UTILITY');
  ok('four variables, in the filed order', JSON.stringify(t.variables) === JSON.stringify(['client', 'milestone', 'vendor', 'due']));
  ok('status approved — Meta returned Active (R-40.58, detail page R-40.71)', t.status === 'approved');
  ok('the body is byte-identical to R-40.76',
     t.body === 'Hi {{1}}, a payment reminder from {{3}}. {{2}} is due on {{4}}. UPI or cash, whichever suits.');
  ok('no header, no footer, no button — as filed', !t.button && !t.header && !t.footer);

  const sib = TPL.getTemplate('payment_reminder');
  ok('the vendor-lane sibling still points at tdw_payment_due (F-40.142)', sib.name === 'tdw_payment_due');
  ok('and is still on the vendor line', sib.line === 'vendor');
  ok('and still carries its two variables', sib.variables.length === 2);
}

section('14. the doors refuse before they act');
{
  const d = code('src/api/vendor/reminders.js');
  ok('a non-pending milestone is refused with its state named', /is \$\{ms\.state\}/.test(d) || /\$\{ms\.state\}/.test(d));
  ok('a duplicate tap is a 409, from the database not a pre-check',
     /errRes\(res, 409/.test(d) && /out\.already/.test(d));
  ok('the switch door refuses a non-boolean', /typeof req\.body\.auto_send !== 'boolean'/.test(d));
  ok('a skipped send is reported as skipped, never as sent (F-39.70/.71)',
     /sent: !!out\.sent, skipped: !!out\.skipped/.test(d));
  ok('the room derives Sent from wamid and nothing softer (R-G34.8)',
     /sent:\s*!!r\.wamid/.test(d));
  // ⚠ THIS CELL ASSERTED AN ADJACENCY AND THE CURE MOVED IT. The first cut read
  // `/reminders` immediately followed by the root `/` mount — true when written,
  // false the moment F-40.181 moved the schedules root mount ahead of `/invoices`.
  // The INTENT was never adjacency: it is that `/reminders` is reached before any
  // root mount can swallow it. Asserted as an ORDER over the mount list, which is
  // the property, and which survives the next reshuffle.
  // ⚠ `code()`, NEVER `read()`. The first cut scanned raw text and picked up a
  // PHANTOM ROOT MOUNT out of core.js's own comment — the line explaining why the
  // root mount did not move contains the string `router.use('/', schedules)`, and
  // the regex matched it ahead of the real one, so the §0.3 cell went red against
  // a mount that does not exist. Third time this class has bitten in this arc: the
  // glyph cell read `formatRs`'s doc-comment, and this bench's absence cells read
  // its own header. A cell that scans for CODE must strip comments first, always.
  const coreMounts = [...code('src/api/vendor/core.js').matchAll(/router\.use\('([^']+)'/g)].map(m => m[1]);
  const iRem = coreMounts.indexOf('/reminders');
  const iRoot = coreMounts.indexOf('/');
  // ⚠ THE SECOND CUT OF THIS CELL PASSED FOR THE WRONG REASON and is recorded
  // because it read as green. It was written `iRem < iRoot ? false : iRem > -1`,
  // which FAILS when /reminders precedes the root and PASSES when it follows —
  // the inverse of its own label. It went green only because the cure had just
  // moved the root mount ahead of /reminders. A cell whose label and assertion
  // disagree is worse than a missing cell: it reports on a property it is not testing.
  //
  // THE REAL PROPERTY IS NOT ORDER AT ALL. `schedules.js` is mounted at the root
  // but declares only `/invoices/...` and `/schedules/...`, so it cannot swallow
  // `/reminders/*` from any position. What must hold is that /reminders IS mounted
  // and that no root-mounted router declares a competing /reminders route.
  ok('the reminders segment is mounted in core.js', iRem > -1);
  ok('no root-mounted router declares a competing /reminders route',
     !/router\.(get|post|patch|delete)\('\/reminders/.test(read('src/api/vendor/schedules.js')));
  // ⚠ THE PROPERTY MOVED WITH THE CURE, AND THE CELL MOVES WITH IT.
  // The first cure lifted the ROOT mount above `/invoices`; that reddened `b46`
  // §0.3, which needs `/money` above the root. No position satisfies both, so the
  // router was split by address shape: `invoiceSchedule.js` mounts at `/invoices`
  // ABOVE the invoices router, and the root mount returns to its old home.
  // What must hold is now an ADJACENCY that is genuinely load-bearing — anything
  // between the two `/invoices` mounts could match `/invoices/{uuid}/…` first.
  // ⚠ THE MOUNT STRING CANNOT CARRY THIS ASSERTION. Both mounts are `/invoices`,
  // so an index comparison over mount PATHS is [5,6] whichever router sits first —
  // the first cut of this cell swapped the two routers in a mutation and went
  // GREEN, proving nothing. What distinguishes them is the ROUTER EACH REQUIRES,
  // so that is what the cell reads.
  const invPairs = [...code('src/api/vendor/core.js')
    .matchAll(/router\.use\('\/invoices',\s*require\('\.\/(\w+)'\)\)/g)].map(m => m[1]);
  ok('both /invoices mounts exist and invoiceSchedule is FIRST (F-40.181)',
     invPairs.length === 2 && invPairs[0] === 'invoiceSchedule' && invPairs[1] === 'invoices');
  ok('and they are adjacent — nothing may match /invoices/:id/... between them',
     /router\.use\('\/invoices',\s*require\('\.\/invoiceSchedule'\)\);\s*router\.use\('\/invoices',\s*require\('\.\/invoices'\)\);/
       .test(code('src/api/vendor/core.js')));
  ok('the schedule routes are declared relative to the /invoices mount, not renamed',
     /router\.get\('\/:invoiceId\/schedule'/.test(code('src/api/vendor/invoiceSchedule.js')));
  ok('schedules.js keeps only the /schedules shape, so the root mount can stay put',
     !/\/invoices\/:invoiceId\/schedule'/.test(code('src/api/vendor/schedules.js')));
  ok('b46 §0.3 holds — /money still stands above the bare root mount',
     coreMounts.indexOf('/money') > -1 && coreMounts.indexOf('/') > -1 &&
     coreMounts.indexOf('/money') < coreMounts.indexOf('/'));
}

console.log(`\n${pass}/${pass + fail} cells green.`);
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH ERROR', e); process.exit(1); });
