#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b56_contract_bench.js — TDW_19 G3.2, contracts & deposits.
//
//   node scripts/b56_contract_bench.js
//
// WHAT IT DRIVES: the REAL src/lib/contractPdf.js, src/lib/vendor/contractSource.js,
// src/lib/vendor/contracts.js and src/lib/vendor/dateLock.js. Nothing under test is
// stubbed. The only double is the supabase client — an in-memory store honouring the
// chain the production callers actually use, and a storage double for the seal.
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup):
//   §1  change `deriveMoney`'s Math.round to Math.floor        → §1 flips RED
//   §2  delete the `signature.verified_at` gate in contractPdf → §2 flips RED
//   §3  make `isLocked` ignore `state !== 'signed'`            → §3 flips RED
//   §4  drop `.is('storage_path', null)` from cleanupDraft     → §4 flips RED  (F-40.112)
//   §5  add a second require of generateContractPdf anywhere   → §5 flips RED
//   §6  let `verifySignCode` reset otp_attempts on a wrong try → §6 flips RED
//   §7  widen `saveContractFill` to accept a signed contract    → §7 flips RED
//   §8  drop the token expiry check from findSigningByToken     → §8 flips RED
// Each is a real edit to a shipped file, reverted after. Run them; a cell that cannot
// go red is a cell that proves nothing.
//
// WHAT IT DOES NOT PROVE, NAMED SO IT IS NOT ASSUMED:
//   · that 0138 has run. The plane is founder-run in the editor; this bench drives the
//     code that will write to it, on a double. The CHECKs, the partial UNIQUE and both
//     FK delete rules are asserted by READING 0138 (§9), never by exercising it.
//   · any live Meta send. The eighth template is dark by two gates and §10 reads them.
//   · that the pwa calls any of this. The surfaces are the pwa arm's.
//   · that a PDF is CORRECT. §2 asserts the seal's presence and absence, not typography;
//     the ratified frames are the authority on how it looks and the founder's walk is
//     what compares them (R-39.15).
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.resolve(__dirname, '..');

const CPDF   = require(path.join(ROOT, 'src/lib/contractPdf.js'));
const SRC    = require(path.join(ROOT, 'src/lib/vendor/contractSource.js'));
const C      = require(path.join(ROOT, 'src/lib/vendor/contracts.js'));
const LOCK   = require(path.join(ROOT, 'src/lib/vendor/dateLock.js'));
const TPL    = require(path.join(ROOT, 'src/lib/templates.js'));

let pass = 0, fail = 0;
const ok = (label, cond) => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);

const VENDOR = 'vendor-dev440';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// ⚠ CELLS THAT ASSERT ABSENCE MUST READ CODE, NOT PROSE.
// The first cut of §5 and §8 grepped whole files for `supabase` and
// `linked_binder_id` and went RED on the COMMENTS that explain why neither is used —
// a cell that fails because the file documents its own discipline is a cell that
// punishes the discipline. `code()` strips comments and string literals before the
// grep, so an absence cell asserts the absence of a CALL and not of a word.
const code = (rel) => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

// ── the in-memory supabase double (transport only) ──────────────────────────
function makeDb(seed = {}) {
  const tables = {
    contracts: [], contract_profiles: [], contract_signatures: [], clients: [],
    events: [], leads: [], invoices: [], vendors: [], payment_schedules: [], ...seed,
  };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;
  const stored = {};

  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [] };
    q.select = () => q;
    q.eq  = (c, v) => { q._f.push(r => r[c] === v); return q; };
    q.neq = (c, v) => { q._f.push(r => r[c] !== v); return q; };
    q.is  = (c, v) => { q._f.push(r => (r[c] ?? null) === v); return q; };
    q.in  = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
    q.not = (c, _op, v) => { q._f.push(r => (r[c] ?? null) !== v); return q; };
    q.lt  = (c, v) => { q._f.push(r => r[c] < v); return q; };
    q.order = () => q;
    q.limit = () => q;
    const matched = () => rows.filter(r => q._f.every(f => f(r)));
    // ⚠ THE DOUBLE CAN NOW FAIL ONE TABLE ON PURPOSE. Without this, the guard on a
    // failed vendor read had NO cell that could go red — the mutation that removed
    // it scored zero, which is how a vacuous cell announces itself.
    q.maybeSingle = async () => (tables.__fail === table
      ? { data: null, error: { message: `column "nonesuch" does not exist` } }
      : { data: matched()[0] || null, error: null });
    q.single      = async () => ({ data: matched()[0] || null, error: null });
    q.then = (res) => res({ data: matched(), error: null });
    q.insert = (payload) => {
      const row = { id: nextId(table), created_at: new Date().toISOString(), deleted_at: null, ...payload };
      rows.push(row);
      const ins = { select: () => ins, single: async () => ({ data: row, error: null }),
                    maybeSingle: async () => ({ data: row, error: null }) };
      return ins;
    };
    q.upsert = (payload) => {
      const hit = rows.find(r => r.vendor_id === payload.vendor_id);
      if (hit) Object.assign(hit, payload); else rows.push({ id: nextId(table), ...payload });
      const u = { select: () => u, single: async () => ({ data: hit || rows[rows.length - 1], error: null }) };
      return u;
    };
    q.update = (patch) => {
      const upd = {
        _f: [],
        eq(c, v) { this._f.push(r => r[c] === v); return this; },
        is(c, v) { this._f.push(r => (r[c] ?? null) === v); return this; },
        select() { return this; },
        async single()      { return this._go(); },
        async maybeSingle() { return this._go(); },
        _go() {
          const hit = rows.filter(r => this._f.every(f => f(r)));
          hit.forEach(r => Object.assign(r, patch));
          return { data: hit[0] || null, error: null };
        },
        then(res) { const r = this._go(); return res(r); },
      };
      return upd;
    };
    q.delete = () => {
      const del = {
        _f: [],
        eq(c, v) { this._f.push(r => r[c] === v); return this; },
        is(c, v) { this._f.push(r => (r[c] ?? null) === v); return this; },
        then(res) {
          for (let i = rows.length - 1; i >= 0; i -= 1) {
            if (this._f.every(f => f(rows[i]))) rows.splice(i, 1);
          }
          return res({ data: null, error: null });
        },
      };
      return del;
    };
    return q;
  }
  const storage = { from: () => ({
    async upload(p, buf) { stored[p] = buf; return { data: { path: p }, error: null }; },
    async remove(ps) { ps.forEach(p => delete stored[p]); return { error: null }; },
    async list() { return { data: [], error: null }; },
    async createSignedUrl(p) { return { data: { signedUrl: `https://x/${p}` }, error: null }; },
  }) };
  return { from, storage, _tables: tables, _stored: stored };
}

const seedBase = () => ({
  vendors: [{ id: VENDOR, business_name: 'Dev Roy Photography', city: 'New Delhi',
              address: '14 Sultanpur Estate', gstin: null, upi_id: 'devroy@okicici',
              routing_handle: 'dev440', whatsapp_number: '+917982159047' }],
  clients: [{ id: 'client-priya', vendor_id: VENDOR, name: 'Priya Nair', phone: '+919625759924' }],
  leads:   [{ id: 'lead-priya', vendor_id: VENDOR, client_id: 'client-priya' }],
  events:  [
    { id: 'ev-sangeet',  vendor_id: VENDOR, linked_lead_id: 'lead-priya', title: 'Sangeet',
      event_date: '2026-12-12', event_time: '18:00:00', kind: 'shoot', state: 'upcoming', deleted_at: null },
    { id: 'ev-ceremony', vendor_id: VENDOR, linked_lead_id: 'lead-priya', title: 'Ceremony',
      event_date: '2026-12-13', event_time: '10:00:00', kind: 'ceremony', state: 'upcoming', deleted_at: null },
  ],
  invoices: [{ id: 'inv-05', vendor_id: VENDOR, amount_total: 60000, description: 'two functions',
               state: 'unpaid', has_schedule: false, deleted_at: null }],
});

(async () => {

// ══ §1 — THE DEPOSIT HAS ONE HOME AND ONE VALUE (R-G32.6) ══════════════════
section('1. Rs 18,000 is 30% of Rs 60,000, derived once');
{
  const m = SRC.deriveMoney({
    invoice: { amount_total: 60000 },
    contract: { deposit_pct: 30, terms: {} },
    profile: {},
  });
  ok('fee_total reads the invoice', m.fee_total === 60000);
  ok('deposit_amount is 18000', m.deposit_amount === 18000);
  // ROUNDING MATCHES schedules.js:createSchedule — Math.round, both sides.
  // A fee that does not divide is the cell that catches a floor/round divergence.
  const odd = SRC.deriveMoney({ invoice: { amount_total: 60001 }, contract: { deposit_pct: 30, terms: {} }, profile: {} });
  ok('rounds like createSchedule (60001 @ 30% = 18000)', odd.deposit_amount === 18000);
  const odd2 = SRC.deriveMoney({ invoice: { amount_total: 60005 }, contract: { deposit_pct: 30, terms: {} }, profile: {} });
  ok('rounds UP where floor would not (60005 @ 30% = 18002)', odd2.deposit_amount === 18002);
  ok('a null deposit_pct yields null, never zero', SRC.deriveMoney({ invoice: { amount_total: 60000 }, contract: { deposit_pct: null, terms: {} }, profile: {} }).deposit_amount === null);
  // GST is omitted whole while either setting is blank — R-G32.12.
  ok('gst omitted when gst_pct blank', SRC.deriveMoney({ invoice: { amount_total: 60000 }, contract: { deposit_pct: 30, terms: {} }, profile: { gst_treatment: 'exclusive' } }).gst_amount === null);
  ok('gst omitted when treatment blank', SRC.deriveMoney({ invoice: { amount_total: 60000 }, contract: { deposit_pct: 30, terms: {} }, profile: { gst_pct: 18 } }).gst_amount === null);
  ok('gst computed when both answered', SRC.deriveMoney({ invoice: { amount_total: 60000 }, contract: { deposit_pct: 30, terms: {} }, profile: { gst_pct: 18, gst_treatment: 'exclusive' } }).fee_payable_with_gst === 70800);
  // MILESTONE 1 IS THE DEPOSIT AND IS NOT LISTED TWICE.
  const withSched = SRC.deriveMoney({
    invoice: { amount_total: 60000, schedule: [
      { ordinal: 1, milestone_label: 'Deposit', pct: 30, amount_due: 18000, due_date: null },
      { ordinal: 2, milestone_label: 'On delivery', pct: 70, amount_due: 42000, due_date: '2027-01-10' }] },
    contract: { deposit_pct: 30, terms: {} }, profile: {},
  });
  ok('ordinal 1 is dropped from the printed rows', withSched.milestones.length === 1);
  ok('and the row that remains is milestone 2', withSched.milestones[0].label === 'On delivery');
}

// ══ §2 — THE SEAL PRINTS ONLY ON A SIGNED COPY ═════════════════════════════
section('2. the seal, present and absent');
{
  const args = (sig) => ({
    contract: { deposit_pct: 30, terms: { partner_2_name: 'Arjun Nair' }, annexes: { a: true }, state: 'draft' },
    vendor: seedBase().vendors[0], client: seedBase().clients[0],
    functions: seedBase().events, profile: { vendor_signatory_name: 'Dev Roy' },
    money: { fee_total: 60000, deposit_amount: 18000, milestones: [] }, signature: sig,
  });
  const SHA = 'a3f19c2e7b04d58a6612ef3940cb1d778e052a4f93b6c0815d3e7f2ab64908c5';
  const unsigned = await CPDF.generateContractPdf(args(null));
  const signed   = await CPDF.generateContractPdf(args({ verified_at: '2026-09-06T10:42:00Z', signer_phone: '+919625759924', document_sha256: SHA }));
  ok('an unsigned copy renders', unsigned.length > 4000);
  ok('a signed copy renders', signed.length > 4000);
  // ⚠ A SIGNED COPY IS STRICTLY LONGER. The seal block is bytes; an empty seal would
  // be the same length, which is what this compares.
  ok('the signed copy is longer than the unsigned', signed.length > unsigned.length);
  // AN UNVERIFIED SIGNING IS NOT A SIGNATURE — a code sent and not entered.
  const inflight = await CPDF.generateContractPdf(args({ verified_at: null, signer_phone: '+919625759924', document_sha256: SHA }));
  ok('an unverified signing prints NO seal', inflight.length === unsigned.length);
}

// ══ §3 — THE DATE LOCK (R-G32.1) ═══════════════════════════════════════════
section('3. a locked date is signed + deposit received, and events is untouched');
{
  ok('signed + received is locked',      LOCK.isLocked({ state: 'signed', deposit_received_at: '2026-09-06T00:00:00Z' }) === true);
  ok('signed + not received is NOT',     LOCK.isLocked({ state: 'signed', deposit_received_at: null }) === false);
  ok('sent + received is NOT',           LOCK.isLocked({ state: 'sent', deposit_received_at: '2026-09-06T00:00:00Z' }) === false);
  ok('cancelled + received is NOT',      LOCK.isLocked({ state: 'cancelled', deposit_received_at: '2026-09-06T00:00:00Z' }) === false);
  ok('null contract is NOT',             LOCK.isLocked(null) === false);
  const set = LOCK.lockedEventIds([
    { event_id: 'ev-sangeet',  state: 'signed', deposit_received_at: '2026-09-06T00:00:00Z' },
    { event_id: 'ev-ceremony', state: 'signed', deposit_received_at: null },
    { event_id: null,          state: 'signed', deposit_received_at: '2026-09-06T00:00:00Z' },
  ]);
  ok('only the anchor with a received deposit is in the set', set.size === 1 && set.has('ev-sangeet'));
  // THE WRITE THAT ISN'T. `events` gains no column and takes no update from this arc.
  const src = read('src/lib/vendor/contracts.js') + read('src/api/sign.js') + read('src/lib/vendor/dateLock.js');
  ok("no G3.2 file writes public.events", !/from\('events'\)[\s\S]{0,80}\.(update|insert)/.test(src));
  ok("0138 adds no column to public.events", !/ALTER TABLE public\.events/.test(read('db/migrations/0138_contract_fill_and_sign.sql')));
}

// ══ §4 — F-40.112 · THE CRON KEEPS A COMPOSED DRAFT ════════════════════════
section('4. cleanupDraftContracts spares a draft that carries a file');
{
  const old = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const db = makeDb({ contracts: [
    { id: 'k-composed', vendor_id: VENDOR, state: 'draft', storage_path: null, created_at: old, terms: {} },
    { id: 'k-uploaded', vendor_id: VENDOR, state: 'draft', storage_path: `${VENDOR}/k-uploaded.pdf`, created_at: old },
    { id: 'k-fresh',    vendor_id: VENDOR, state: 'draft', storage_path: null, created_at: new Date().toISOString() },
    { id: 'k-sent',     vendor_id: VENDOR, state: 'sent',  storage_path: null, created_at: old },
  ] });
  const n = await C.cleanupDraftContracts(db);
  const left = db._tables.contracts.map(r => r.id).sort();
  ok('one row cleaned', n === 1);
  ok('the path-less abandoned upload is gone', !left.includes('k-composed'));
  ok('THE UPLOADED DRAFT SURVIVES', left.includes('k-uploaded'));
  ok('a fresh draft survives', left.includes('k-fresh'));
  ok('a sent contract survives', left.includes('k-sent'));
  // THE COMMENT AND THE CODE NOW AGREE, and the cell reads the code.
  ok("the filter is in the source, not just the comment",
     /\.is\('storage_path',\s*null\)/.test(read('src/lib/vendor/contracts.js')));
}

// ══ §5 — THE RENDERER HAS ONE CALL SITE ════════════════════════════════════
section('5. generateContractPdf is called from exactly one place');
{
  const files = [];
  (function walk(d) {
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); }
      else if (e.name.endsWith('.js')) files.push(p);
    });
  })(path.join(ROOT, 'src'));
  const callers = files.filter(f => /generateContractPdf\s*\(/.test(fs.readFileSync(f, 'utf8'))
                                 && !f.endsWith('contractPdf.js'));
  ok(`exactly one caller (found ${callers.length}: ${callers.map(f => path.basename(f)).join(',')})`,
     callers.length === 1 && callers[0].endsWith('contractSource.js'));
  // AND THE RENDERER IS PURE. It cannot read: `supabase` is not a parameter and no
  // `.from(` appears in it.
  const pdf = code('src/lib/contractPdf.js');
  ok('the renderer takes no supabase handle', !/supabase/.test(pdf));
  ok('the renderer opens no table', !/\.from\('/.test(pdf));
  ok('the renderer requires no db module', !/require\('\.\/vendor\//.test(pdf));
}

// ══ §6 — THE SIGN FLOW ═════════════════════════════════════════════════════
section('6. token, then code, then signature');
{
  const db = makeDb(seedBase());
  const made = await C.composeContract(db, VENDOR, { clientId: 'client-priya', eventId: 'ev-sangeet', invoiceId: 'inv-05' });
  ok('compose lands', made.ok === true);
  ok('the title is generated from the client', /Priya Nair/.test(made.contract.title));
  ok('the deposit default is 30 and is offered, not defaulted by the DB', made.contract.deposit_pct === 30);

  const bad = await C.composeContract(db, VENDOR, { clientId: 'client-priya', depositPct: 0 });
  ok('a zero deposit is refused with a sentence', bad.ok === false && /percent/.test(bad.error));

  // ── R-G32.17/.18 · PROMOTE ON PICK ──────────────────────────────────────
  // ⚠ THE WALK FOUND THIS AND NO BENCH COULD HAVE. `public.clients` was EMPTY
  // for DEV440 — `HTTP 200 · ok true · total 0` — because its three writers all
  // need money or a manual entry, and her people live on the binder plane. The
  // composer had been built against a table this vendor had never populated.
  const promo = await C.composeContract(db, VENDOR, { name: 'Sneha Kulkarni', phone: '+919812345678' });
  ok('a name and a phone compose without a client_id', promo.ok === true);
  ok('and the row says a client was CREATED', promo.promoted === true);
  const made2 = db._tables.clients.find(c => c.name === 'Sneha Kulkarni');
  ok('the client row exists', Boolean(made2));
  ok("its source is 'contract_compose', not lead_promotion (R-G32.18)", made2 && made2.source === 'contract_compose');
  ok('and the contract points at it', promo.contract.client_id === made2.id);

  // ⚠ `promoted` IS THE RESOLVER'S `created`, NOT "we took the name path".
  // Phone dedup returns the EXISTING row for someone already a client, and the
  // record must not then claim it added her. The confirmation is true or absent.
  const again = await C.composeContract(db, VENDOR, { name: 'Sneha Kulkarni', phone: '+919812345678' });
  ok('picking her a second time reuses the row', again.contract.client_id === made2.id);
  ok('AND DOES NOT CLAIM TO HAVE ADDED HER', again.promoted === false);
  ok('so one person is one row', db._tables.clients.filter(c => c.name === 'Sneha Kulkarni').length === 1);

  const neither = await C.composeContract(db, VENDOR, {});
  ok('neither an id nor a name is refused with a sentence',
     neither.ok === false && /name to add/.test(neither.error));

  const opened = await C.openSigning(db, VENDOR, made.contract.id, { signerPhone: '+919625759924' });
  ok('openSigning returns a token', opened.ok && typeof opened.token === 'string' && opened.token.length > 20);
  ok('and NO code — clause 12 sends it after she agrees', opened.code === undefined);
  ok('the contract flips to sent', db._tables.contracts.find(c => c.id === made.contract.id).state === 'sent');

  const found = await C.findSigningByToken(db, opened.token);
  ok('the token finds the signing', found && found.contract_id === made.contract.id);
  ok('no code is on the row yet', !found.otp_hash);

  const issued = await C.issueSignCode(db, found.id);
  ok('issueSignCode returns a six-digit code once', issued.ok && /^\d{6}$/.test(issued.code));
  const row = db._tables.contract_signatures[0];
  ok('the code is HASHED on the row, never stored in clear', row.otp_hash && row.otp_hash !== issued.code);

  const wrong = await C.verifySignCode(db, { ...row, id: row.id }, '000000');
  ok('a wrong code does not verify', wrong.ok === false);
  ok('and it counts', db._tables.contract_signatures[0].otp_attempts === 1);
  // ⚠ THE COUNT MUST ACCUMULATE, and one wrong answer cannot prove that.
  // The first cut asserted only `=== 1` after one miss, which a mutation setting
  // `next = 1` satisfied — a vacuous cell, caught by driving the mutation rather than
  // by reading the assertion. Two misses is the smallest evidence that it counts.
  await C.verifySignCode(db, { ...db._tables.contract_signatures[0] }, '111111');
  ok('a SECOND wrong code makes it two, not one again', db._tables.contract_signatures[0].otp_attempts === 2);

  const right = await C.verifySignCode(db, { ...db._tables.contract_signatures[0] }, issued.code);
  ok('the right code verifies', right.ok === true);
  ok('THE ATTEMPT COUNT IS NOT RESET BY A CORRECT ANSWER', db._tables.contract_signatures[0].otp_attempts === 2);
  ok('the token is SPENT on verify', db._tables.contract_signatures[0].sign_token === null);
  const gone = await C.findSigningByToken(db, opened.token);
  ok('a spent token reads as never-existed', gone === null);
}

// ══ §6b — AN EXPIRED TOKEN READS AS ABSENT ═════════════════════════════════
section('6b. expired, spent, forged and never-existed are one outcome');
{
  const db = makeDb({ contract_signatures: [
    { id: 'sig-live',    contract_id: 'c1', sign_token: 'tok-live',
      token_expires_at: new Date(Date.now() + 3600e3).toISOString(), verified_at: null, otp_attempts: 0 },
    { id: 'sig-expired', contract_id: 'c2', sign_token: 'tok-expired',
      token_expires_at: new Date(Date.now() - 3600e3).toISOString(), verified_at: null, otp_attempts: 0 },
  ] });
  ok('a live token is found', Boolean(await C.findSigningByToken(db, 'tok-live')));
  ok('AN EXPIRED TOKEN IS NULL, not a row with a flag', (await C.findSigningByToken(db, 'tok-expired')) === null);
  ok('a forged token is null', (await C.findSigningByToken(db, 'tok-nonsense')) === null);
  ok('an empty token is null', (await C.findSigningByToken(db, '')) === null);
  // ⚠ THE EXPIRY IS CHECKED IN THE LOOKUP, NOT AT A CALLER. A door that checked it
  // would be a second home for the dead-token law, and the second home is the one
  // that forgets.
  ok('the check lives in the lookup', /token_expires_at[\s\S]{0,90}return null/.test(read('src/lib/vendor/contracts.js')));
}

// ══ §7 — A SIGNED CONTRACT CANNOT BE EDITED ════════════════════════════════
section('7. the blanks close when the digest is taken');
{
  const db = makeDb({ contracts: [
    { id: 'c-signed', vendor_id: VENDOR, state: 'signed', terms: {}, annexes: {}, deposit_pct: 30 },
    { id: 'c-draft',  vendor_id: VENDOR, state: 'draft',  terms: {}, annexes: {}, deposit_pct: 30 },
    { id: 'c-cxl',    vendor_id: VENDOR, state: 'cancelled', terms: {}, annexes: {}, deposit_pct: 30 },
  ] });
  const a = await C.saveContractFill(db, VENDOR, 'c-signed', { terms: { partner_2_name: 'X' } });
  ok('a signed contract refuses an edit', a.ok === false && /signed/.test(a.error));
  const b = await C.saveContractFill(db, VENDOR, 'c-cxl', { terms: { partner_2_name: 'X' } });
  ok('a cancelled contract refuses an edit', b.ok === false);
  const c = await C.saveContractFill(db, VENDOR, 'c-draft', { terms: { partner_2_name: 'Arjun Nair' } });
  ok('a draft accepts one', c.ok === true && c.contract.terms.partner_2_name === 'Arjun Nair');

  // THE DEPOSIT IS VENDOR-MARKED AND ONLY ON A SIGNED CONTRACT.
  const d = await C.markDepositReceived(db, VENDOR, 'c-draft', true);
  ok('a draft cannot have a received deposit', d.ok === false);
  const e = await C.markDepositReceived(db, VENDOR, 'c-signed', true);
  ok('a signed one can', e.ok === true && Boolean(e.contract.deposit_received_at));
  ok('and that is what the lock reads', LOCK.isLocked(e.contract) === true);
}

// ══ §8 — CLAUSE 3'S ROWS ARE READ, AND THE KEY IS THE LEAD ═════════════════
section("8. one row per function, reached through leads.client_id");
{
  const db = makeDb(seedBase());
  const fns = await SRC.functionsForContract(db, VENDOR, { client_id: 'client-priya', lead_id: null });
  ok('both functions are found through leads.client_id', fns.length === 2);
  ok('and they are date-ordered', fns[0].title === 'Sangeet');
  const direct = await SRC.functionsForContract(db, VENDOR, { client_id: null, lead_id: 'lead-priya' });
  ok('contracts.lead_id reaches them directly', direct.length === 2);
  const none = await SRC.functionsForContract(db, VENDOR, { client_id: 'client-orphan', lead_id: null });
  ok('a client with no lead reaches none (F-40.117, declared)', none.length === 0);
  // linked_binder_id IS NOT USED — it crosses a schema boundary with no FK.
  ok('no G3.2 code reads linked_binder_id', !/linked_binder_id/.test(code('src/lib/vendor/contractSource.js')));
}

// ══ §9 — 0138 IS READ, NOT EXERCISED ═══════════════════════════════════════
section('9. the migration says what the code assumes');
{
  const sql = read('db/migrations/0138_contract_fill_and_sign.sql');
  ok('contract_profiles is one row per vendor', /vendor_id\s+uuid PRIMARY KEY REFERENCES public\.vendors/.test(sql));
  ok('contract_signatures exists', /CREATE TABLE IF NOT EXISTS public\.contract_signatures/.test(sql));
  ok('one OPEN signing per contract, by partial UNIQUE',
     /CREATE UNIQUE INDEX[\s\S]{0,160}contract_signatures_open_key[\s\S]{0,160}WHERE \(verified_at IS NULL\)/.test(sql));
  ok('the deposit CHECK forbids zero and is named',
     /contracts_deposit_pct_check[\s\S]{0,200}deposit_pct > 0[\s\S]{0,60}<= 100/.test(sql));
  ok('event_id is SET NULL, so a signed contract survives a deleted event',
     /event_id uuid REFERENCES public\.events\(id\) ON DELETE SET NULL/.test(sql));
  ok('events_state_check is cited and NOT widened', /events_state_check/.test(sql) && !/ALTER TABLE public\.events[\s\S]{0,200}state/.test(sql));
  ok('otp_sessions_purpose_check is cited and NOT widened',
     /otp_sessions_purpose_check/.test(sql) && !/ALTER TABLE public\.otp_sessions/.test(sql));
  ok('payment_schedules takes no column', !/ALTER TABLE public\.payment_schedules/.test(sql));
  // R-40.27: every table the file touches names its constraints, verbatim.
  ['contracts', 'events', 'clients', 'invoices', 'payment_schedules', 'vendors', 'otp_sessions']
    .forEach(t => ok(`R-40.27: public.${t} constraints cited`, new RegExp(`public\\.${t} —`).test(sql)));
}

// ══ §10 — THE EIGHTH TEMPLATE IS DARK BY TWO GATES ═════════════════════════
section('10. the send is dark, and says so');
{
  const t = TPL.getTemplate('contract_sign');
  ok('the eighth template is registered', Boolean(t));
  ok('it is UTILITY', t.category === 'UTILITY');
  // ⚠ **ONE OF THE TWO GATES HAS MOVED, AND THE CELLS MOVED WITH IT.**
  // These asserted `status: 'draft'` and `isApproved === false` at the cut, which was
  // the truth for about two hours. Meta returned **Active, Utility** on 2026-09-06 and
  // the founder witnessed it, so the registry gate is now OPEN and asserting it shut
  // would be a bench lying about the estate to keep itself green.
  //
  // THE SEND IS STILL DARK, AND THE CELLS BELOW ARE WHERE THAT NOW LIVES. Two gates
  // fail for DIFFERENT reasons — the registry says "Meta has approved these words",
  // the flag says "we have decided to send" — and exactly one of them has moved.
  // `creditInvite.js`'s own comment records the same moment for `wedding_credit`:
  // *"Two gates that fail for DIFFERENT reasons … One of them has now moved."*
  ok("it ships status 'approved' — Meta returned Active 2026-09-06", t.status === 'approved');
  ok('the Meta id is on the entry', t.meta_id === '1599338985536926');
  ok('isApproved is TRUE, so the registry no longer refuses it', TPL.isApproved('contract_sign') === true);
  // ⚠ F-40.91 — META REFUSES A LEADING OR TRAILING VARIABLE. **F-40.118 CLOSED
  // BY R-40.55.** T1's first cut opened on `{{1}}` and `b53_g11_wedding_pages_bench`
  // reddened on it the moment the entry landed — the estate has held that cell since
  // `wedding_credit` hit the same wall in the Manager on 2026-09-05. The seat did not
  // silently re-author a vetoed byte; it carried the red, named the finding, and the
  // founder re-vetoed. This cell is b53's rule asserted a second time, HERE, because
  // a body added by this seat should red in this seat's own bench and not only in a
  // sibling's (b53 is G1.1's and reds for the whole registry).
  ok('the body opens on prose (F-40.118 closed, R-40.55)', !/^\{\{/.test(t.body));
  ok('the body closes on prose', !/\}\}$/.test(t.body.trim()));
  // R-G32.9 — the OTP key points at an ALREADY-APPROVED WABA template.
  const o = TPL.getTemplate('contract_sign_otp');
  ok('the sign-OTP key exists', Boolean(o));
  ok('it is AUTHENTICATION', o.category === 'AUTHENTICATION');
  // R-G32.9(ii) LANDED THE SAME NIGHT AS (i). The borrowed name is retired; the cell
  // that asserted it is retired with it, and reds if anyone points this key back at a
  // template whose name misdescribes what a couple is doing.
  ok('it points at its OWN name (R-G32.9 ii)', o.name === 'tdw_contract_sign_otp');
  ok('the borrowed name is gone', o.name !== 'tdw_vendor_login_otp');
  ok('it rides the vendor lane', o.line === 'vendor');
  const payload = TPL.buildAuthTemplatePayload('contract_sign_otp', '419283');
  ok('the auth payload builds on that name', payload && payload.name === 'tdw_contract_sign_otp');

  // ⚠ THE CODE'S LIFE AND THE MESSAGE'S PROMISE ARE ONE NUMBER.
  // The template was filed with the expiry add-on at 5 minutes, so her message reads
  // "Expires in 5 minutes." A door that accepted the code for ten would be the
  // document-and-record divergence class, and the message is the home that cannot be
  // edited after the fact. This cell reds if the server drifts off what she reads.
  ok('OTP_TTL_MS is five minutes, matching the filed expiry', C.OTP_TTL_MS === 5 * 60 * 1000);
  // THE SECOND GATE. The flag is unset in every environment.
  ok('CONTRACT_SIGN_SEND_ENABLED is unset here', String(process.env.CONTRACT_SIGN_SEND_ENABLED || '') !== '1');
  ok('the door names the flag rather than sending', /CONTRACT_SIGN_SEND_ENABLED/.test(read('src/api/sign.js')));
}

// ══ §9b — R-40.80 · EVERY SELECTED COLUMN EXISTS ON ITS TABLE ══════════════
section('9b. the snapshot answers what the double cannot');
{
  // ⚠ **THIS CELL EXISTS BECAUSE FOUR BENCHES AND 122 CELLS MISSED A COLUMN THAT
  // WAS NEVER THERE.** `PDF_VENDOR_COLUMNS` asked for `whatsapp_number`;
  // `public.vendors` has `phone`. The SELECT errored, the read was destructured
  // without an error check, and the renderer printed a lawyer-passed agreement
  // addressed from **Your Vendor** with nine blank fields (F-40.159).
  //
  // NO DOUBLE COULD HAVE CAUGHT IT. The in-memory supabase above answers any
  // column asked of it — that is what makes it a useful transport double and what
  // makes it blind here. The only witness is the snapshot, and the estate has a
  // current one since the regen at `5b3f61f`: 79 tables, 890 columns.
  //
  // R-40.80 makes this a STANDING cell in every bench that selects. This is the
  // first; the runner charter carries it to the rest.
  const schema = read('docs/db/PUBLIC_SCHEMA.md');

  // ⚠ **THE CELL'S AUTHORITY IS THE SNAPSHOT'S CURRENCY, AND THE SNAPSHOT WENT
  // STALE WITHIN HOURS OF THE RULING.** Derived at `4b28e87`: the regen at
  // `5b3f61f` states its ladder tip as `0138`, and `0140_date_check_switch.sql`
  // has since landed with `vendors.date_check_enabled`. A select asking for a
  // column added AFTER the snapshot would red here while being perfectly correct.
  //
  // That is not a reason to soften the cell — it is the reason the snapshot's own
  // header states its tip "so this file's staleness is a readable fact, never
  // archaeology". This cell inherits that discipline: it asserts the tip it is
  // reading against, so a red here is always one of two things and never a
  // mystery — a fabricated name, or a snapshot owed a regen.
  const tip = /Applied ladder tip at snapshot:\*\*\s*`(\d+)`/.exec(schema);
  ok('the snapshot states the ladder tip it was taken at', Boolean(tip));
  ok(`and this cell is reading against ${tip ? tip[1] : '?'}`, Boolean(tip));

  /** The column block for one table, out of the snapshot. Returns null when the
   *  table is absent — which is itself a red, and a different one. */
  function columnsOf(table) {
    const m = new RegExp(`^## public\\.${table}\\b[^\\n]*\\n\\n\`\`\`\\n([\\s\\S]*?)\`\`\``, 'm').exec(schema);
    if (!m) return null;
    return m[1].split('\n')
      .map(l => /^\s*\d+\.\s+(\w+)/.exec(l))
      .filter(Boolean).map(x => x[1]);
  }

  /** A select list as this estate writes them: 'a, b, c' with newlines and
   *  concatenation already resolved by the module that exports it. */
  function assertSelect(label, table, list) {
    const cols = columnsOf(table);
    ok(`${table} is described in the snapshot`, Array.isArray(cols) && cols.length > 0);
    if (!cols) return;
    const asked = list.split(',').map(x => x.trim()).filter(Boolean);
    const missing = asked.filter(c => !cols.includes(c));
    ok(`${label}: every name exists on public.${table}` +
       (missing.length ? ` — MISSING: ${missing.join(', ')}` : ''), missing.length === 0);
  }

  assertSelect('PDF_VENDOR_COLUMNS', 'vendors',   SRC.PDF_VENDOR_COLUMNS);
  assertSelect('CONTRACT_COLUMNS',   'contracts', SRC.CONTRACT_COLUMNS);

  // ⚠ THE CELL MUST BE ABLE TO FAIL, and a snapshot that described everything
  // would make it vacuous. This asserts the mechanism itself: a name that is not
  // a column is caught.
  const vcols = columnsOf('vendors');
  ok('the mechanism catches a fabricated name',
     Array.isArray(vcols) && !vcols.includes('whatsapp_number'));
  // ⚠ AND IT CAUGHT THE FIRST CURE TOO. `phone` was written in `whatsapp_number`'s
  // place and is ALSO not on this table — `public.vendors` has forty-nine columns
  // and not one is a number. This cell reddened on the replacement before it could
  // ship, which is the whole argument for R-40.80 in four words.
  ok('AND catches the first cure, which was a second fabrication',
     Array.isArray(vcols) && !vcols.includes('phone'));
  // The number's real home, asserted so a later seat cannot drift back.
  ok('the vendor number lives on public.users',
     (columnsOf('users') || []).includes('phone'));
  ok('and the select carries the key that reaches it',
     /user_id/.test(SRC.PDF_VENDOR_COLUMNS));
}

// ══ §9c — A FAILED VENDOR READ IS A FAILURE ════════════════════════════════
section('9c. no document renders over an empty vendor');
{
  // ⚠ THIS IS F-40.159's LARGER HALF, AND IT HAD NO CELL UNTIL A MUTATION SCORED
  // ZERO. The read destructured `{ data: vendor }` with no error check, so a broken
  // SELECT was indistinguishable from a vendor with empty fields — and the renderer
  // did what it is built to do: printed a lawyer-passed agreement, four pages,
  // addressed from `Your Vendor`. **A CONTRACT PRINTED FOR NOBODY IS THE COSTUME
  // CLASS ON PAPER.**
  const seed = seedBase();
  const dbBroken = makeDb({ ...seed, __fail: 'vendors',
    contracts: [{ id: 'c-x', vendor_id: VENDOR, client_id: 'client-priya', state: 'draft',
                  title: 'X', terms: {}, annexes: {}, deposit_pct: 30 }] });
  const broken = await SRC.contractPdfSource(dbBroken, VENDOR, 'c-x');
  ok('a failed vendor read returns ok:false', broken.ok === false);
  ok('and says so in words a vendor can act on', /business details/.test(broken.error || ''));

  const dbNoVendor = makeDb({ ...seed, vendors: [],
    contracts: [{ id: 'c-y', vendor_id: VENDOR, client_id: 'client-priya', state: 'draft',
                  title: 'Y', terms: {}, annexes: {}, deposit_pct: 30 }] });
  const missing = await SRC.contractPdfSource(dbNoVendor, VENDOR, 'c-y');
  ok('a MISSING vendor row is also a failure', missing.ok === false);

  // ⚠ AND `renderContract` MUST NOT REACH THE RENDERER. The source returning
  // ok:false is only half the guard if the one call site ignores it.
  const rendered = await SRC.renderContract(dbBroken, VENDOR, 'c-x');
  ok('renderContract refuses rather than rendering', rendered.ok === false);
  ok('and produces no buffer at all', rendered.buffer === undefined);
}

// ══ §10b — F-40.152 · PREVIEW HANDS BACK A URL, NEVER BYTES ════════════════
section('10b. a new tab carries no JWT, so the door hands it something it can open');
{
  const door = read('src/api/vendor/contracts.js');
  // ⚠ THE TWO ABSENCE CELLS BELOW READ `code()`, NOT `read()`, AND THEY REDDENED
  // ON THIS SEAT'S OWN COMMENTS BEFORE THEY DID. The door's header EXPLAINS that
  // it must never write `.signed.pdf` and never import `generateContractPdf` —
  // and a cell grepping the whole file failed on the explanation. Same lesson as
  // b57 §5 and b56 §5 before it, met a third time: an absence cell asserts the
  // absence of a CALL, and a file that documents its discipline must not be
  // punished for it.
  const doorCode = code('src/api/vendor/contracts.js');
  // ⚠ THE DEFECT THIS ASSERTS AGAINST IS NOT HYPOTHETICAL. The first cut sent PDF
  // bytes from behind `authMw` and the room opened it with `window.open()`; every
  // press returned `no_token` and the button had never worked. No bench saw it,
  // because every cell asserted this file's behaviour and not what a browser does
  // with its address. The founder's glass found it.
  ok('the preview door returns a signed url', /createSignedUrl\(path, PREVIEW_URL_TTL\)/.test(door));
  ok('and answers pdf_url, not bytes', /okRes\(res, \{ pdf_url/.test(door));
  ok('it no longer sends a buffer', !/preview[\s\S]{0,900}res\.status\(200\)\.send\(r\.buffer\)/.test(door));
  // ⚠ A GET THAT WRITES STORAGE IS A GET A RETRY OR A PREFETCH WILL FIRE.
  ok('it is a POST, because it renders and writes', /router\.post\('\/:contractId\/preview'/.test(door));
  ok('and there is no GET preview left behind', !/router\.get\('\/:contractId\/preview'/.test(door));
  // ⚠ THE DRAFT AND THE SEALED COPY MAY NEVER REACH EACH OTHER'S PATH.
  // ⚠ F-40.160 — THE NAME LEADS AND THE ID FOLLOWS. The path was
  // `${contractId}.draft.pdf`, so a signed url handed a vendor a uuid to keep. The
  // invoice's own cure is the PATH (`engine.js:1733`, `INVOICE-05.pdf`); this seat
  // had taken that mechanism's signed url and left its naming.
  ok('the object is CONTRACT-<name>-<id8>.draft.pdf', /CONTRACT-\$\{slug\}-\$\{String\(contract\.id\)\.slice\(0, 8\)\}\.draft\.pdf/.test(door));
  ok('the human name leads the path', /`\$\{vendorId\}\/CONTRACT-/.test(door));
  // ⚠ AND IT IS STILL UNIQUE. `contracts` has no number column and the generated
  // title is `<client> — wedding services`, so two contracts for one client would
  // collide on a title-only path and `upsert: true` would overwrite the other's
  // draft in silence.
  ok('and it stays unique per contract', /slice\(0, 8\)/.test(door));
  ok('the sign door writes .signed.pdf and only that', /\.signed\.pdf/.test(read('src/api/sign.js')));
  ok('the preview door never writes .signed.pdf', !/\.signed\.pdf/.test(doorCode));
  // TEN MINUTES. A preview is a glance, not a link to keep — `getDownloadUrl`'s
  // hour is for a document she has already agreed to.
  ok('the url is short-lived', /PREVIEW_URL_TTL = 600/.test(door));
  // AND IT STILL GOES THROUGH THE ONE CALL SITE.
  ok('preview renders through renderContract', /preview[\s\S]{0,400}renderContract\(/.test(door));
  ok('generateContractPdf is not imported by any door', !/generateContractPdf/.test(doorCode));
}

// ══ §10c — R-40.91/.92 · THE SEND CARRIES A COUNTRY CODE, AND SAYS SO ══════
section('10c. E.164 at the transport, a log at the door');
{
  const meta = require(path.join(ROOT, 'src/lib/metaCloud.js'));

  // ⚠ **F-40.185 — THE DOOR HANDED META TEN DIGITS AND META ANSWERED 200.**
  // `normalizeTo` strips a `+` and adds nothing, so a bare Indian mobile reached
  // the wire with no country code. `postMessage` throws on a non-ok response, so
  // the door would have caught a rejection — it never got one. The message was
  // ACCEPTED and delivered nowhere: no error, no log, and a leaf that advanced to
  // a code screen for a code that did not exist. Only a walk could see it.
  ok('E.164 passes untouched', meta.normalizeTo('+919625759924') === '919625759924');
  ok('and without the plus too', meta.normalizeTo('919625759924') === '919625759924');

  // ⚠ **THE GUARD IS AT `postMessage`, NOT AT `normalizeTo`, AND THE DIFFERENCE
  // IS EIGHT CALLERS.** This seat first put it in the cleaner and told the chair
  // the five reds were toy fixtures. FOUR OF THE FIVE WERE NOT: `normalizeTo` is
  // a shared phone cleaner with eight non-send callers — closerEngine compares
  // and logs with it, prospects cleans typed input with it, demoAdmin dedupes a
  // roster with it and hands it an EMPTY STRING on purpose. The benches were
  // right; the premise was wrong.
  ok('the cleaner still cleans, and refuses nothing', meta.normalizeTo('') === '');
  ok('a bare number passes the CLEANER untouched', meta.normalizeTo('9625759924') === '9625759924');

  const refuses = (v) => { try { meta.assertE164(v); return false; } catch (e) { return e.name === 'MetaSendError'; } };
  ok('A BARE TEN-DIGIT NUMBER IS REFUSED — the exact defect', refuses('9327715877'));
  ok('and so is the walk fixture in its stored form', refuses('9625759924'));
  ok('empty is refused', refuses(''));
  ok('a formatted number is refused', refuses('+91 96257 59924'));
  ok('and something far too long is refused', refuses('9199999999999999999'));

  // ⚠ TWO REFUSALS THAT SAY DIFFERENT THINGS. A caller told "got 14 digits" about
  // `+91 96257 59924` would hunt for a fourteen-digit number that does not exist.
  let digitsMsg = '', lenMsg = '';
  try { meta.assertE164('+91 96257 59924'); } catch (e) { digitsMsg = e.message; }
  try { meta.assertE164('9625759924');      } catch (e) { lenMsg    = e.message; }
  ok('the punctuation refusal names punctuation', /digits-only/.test(digitsMsg));
  ok('the length refusal names the count', /11-15/.test(lenMsg) && /10 digit/.test(lenMsg));
  ok('both point at toE164 by name', /toE164/.test(digitsMsg) && /toE164/.test(lenMsg));

  // ── THE DOOR — (a) and (b) ────────────────────────────────────────────────
  const door = code('src/api/sign.js');
  ok('the sign door imports toE164 from its one home', /require\('\.\.\/lib\/phone'\)/.test(door));
  ok('and normalises before sending', /to: toE164\(|toE164\(v\.signing\.signer_phone\)/.test(door));
  ok('it does not author a local normaliser', !/function toE164|\+91\$\{/.test(door));
  // R-40.92 — a send with no trace cannot be walked.
  ok('the send logs its recipient and wamid', /\[sign:send-otp\][\s\S]{0,90}wamid=/.test(door));
  // ⚠ AND NEVER THE CODE. `otpSend`'s header marks it NEVER LOGGED HERE.
  ok('and NEVER the code', !/sign:send-otp[\s\S]{0,120}issued\.code|sign:send-otp[\s\S]{0,120}\bcode\}/.test(door));

  // ⚠ THE GUARD DOES NOT REGRESS THE LOGIN DOORS, derived rather than hoped:
  // both already refuse a non-E.164 at their own edge before ever sending.
  ok('vendor login gates on E.164 before sending', /PHONE_RE\.test/.test(code('src/api/vendor/auth.js')));
  ok('couple login does too', /PHONE_RE\.test/.test(code('src/api/couple/auth.js')));

  // ⚠ AND THE GUARD FIRES BEFORE THE REQUEST, NOT AFTER. A refusal that arrives
  // as a Meta 200 is not a refusal — that is the whole of F-40.185.
  const mc = code('src/lib/metaCloud.js');
  ok('assertE164 is called inside postMessage', /async function postMessage[\s\S]{0,400}assertE164\(body/.test(mc));
  ok('and normalizeTo carries no guard', !/function normalizeTo[\s\S]{0,200}throw/.test(mc));
}

// ══ §11 — THE PUBLIC LEAF'S CONSTITUTION ═══════════════════════════════════
section('11. the sign door reads like its two siblings');
{
  const s = read('src/api/sign.js');
  ok('a dead token is a 404 and nothing else', /res\.status\(404\)\.json\(\{ ok: false, code: 'not_found' \}\)/.test(s));
  ok('the signing row is never spread onto the wire', !/\.\.\.v\.signing/.test(s) && !/\.\.\.signing/.test(s));
  ok('the signer number is not echoed', !/signer_phone:/.test(s.split('router.post')[0]));
  ok('it is mounted outside /vendor', /router\.use\('\/sign',/.test(read('src/api/router.js')));
  ok('clause 8 is not written by signing — no consent flag moves',
     !/publish_weddings|couple_consent/.test(s + read('src/lib/vendor/contracts.js')));
}

console.log(`\n${pass}/${pass + fail} cells green.`);
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH ERROR', e); process.exit(1); });
