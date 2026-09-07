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
  // ── §10a AMENDED BY LABEL TO v4's THREE SEAL STATES ─────────────────────
  // ⚠ SUPERSESSION, RECORDED AT THE CELL. This section asserted v3's behaviour:
  // `an unverified signing prints NO seal`, i.e. the block was SUPPRESSED for a
  // signing row with `verified_at: null`. v4's clause 16.4 and the founder-vetoed
  // frame `P4-sign-unsigned` say otherwise — **the seal prints its labels and no
  // values** — because clause 16.4's paper path is real and a couple who signs on
  // paper receives a document whose seal is honest about being unsigned. R-40.106
  // put the lawyer's yes on v4's clause 16, so a committed cell asserting v3's
  // suppression is a pin on a superseded instrument (c-40.49).
  //
  // THREE STATES, each asserted, and the amendment TIGHTENS: the old cell compared
  // two lengths and could not tell an empty seal from a populated one.
  // ⚠ WHAT THESE CELLS CAN AND CANNOT MEASURE, SAID OUT LOUD. The clause text is
  // set in SUBSET TTFs through Identity-H, so the content stream carries GLYPH IDS,
  // not readable characters — a bench cannot grep a rendered agreement for a
  // sentence without a full text extractor. What it CAN read is structure. The
  // digest is the ONLY Courier run in the document, so the presence of a Courier
  // font resource in the PDF is a decisive witness for the seal block, and the
  // three states separate cleanly on it plus length.
  //
  // The BYTES of the label and the four value lines are asserted against the
  // renderer's SOURCE, comment-stripped, because F-40.234 was a re-authoring and
  // that is the plane a re-authoring happens on.
  const hasCourier = (buf) => /\/BaseFont\s*\/Courier/.test(buf.toString('latin1'));
  const rend = code('src/lib/contractPdf.js');
  const inflight = await CPDF.generateContractPdf(args({ verified_at: null, signer_phone: '+919625759924', document_sha256: SHA }));
  const agreed   = await CPDF.generateContractPdf(Object.assign(
    args({ verified_at: '2026-09-06T10:42:00Z', signer_phone: '+919625759924', document_sha256: SHA }),
    { sealed: false }));

  //  (i) sealed:false -> NO BLOCK AT ALL. These are the bytes `document_sha256`
  //      hashes; a seal inside them could not describe them (R-G32.19).
  ok('sealed:false prints no seal block at all — no digest face in the document', !hasCourier(agreed));
  ok('and it is shorter than the copy that carries a seal', agreed.length < signed.length);

  //  (ii) sealed:true + null signature -> LABELS, NO VALUES (`P4-sign-unsigned`).
  ok('an unverified signing still prints the seal block', hasCourier(inflight));
  ok('and it is shorter than the signed copy — labels and dashes, not values',
     inflight.length < signed.length);

  //  (iii) sealed:true + signature -> VALUES.
  ok('the signed copy carries the seal and is the longest of the three',
     hasCourier(signed) && signed.length > inflight.length && signed.length > agreed.length);

  //  THE BYTES — F-40.234. Each is `P4-sign`'s own, transcribed.
  ok('the digest label is the ratified byte, and stands alone',
     /Document fingerprint \\u00b7 SHA-256/.test(rend));
  ok('the confirmation line is the frame\'s, not authored from memory',
     /Confirmed by one-time password sent to that number\./.test(rend));
  ok('the paper path has its own confirmation line (clause 16.4)',
     /Signed on paper under clause 16\.4\./.test(rend));
  ok('and the retired v3 value lines are gone',
     !/By the Client, from/.test(rend) && !/One-time password, clause 16\.1/.test(rend));
}

// ── THE FOUNDER-CARD FIXTURE — DEV440 · Priya Nair · one outstation function ──
// Lifted whole from the seat's scratch fixture so the bench and the card render the
// SAME document. `function_1_city` differs from `vendor.city`, which is what opens
// clause 5's gate; the in-city variant is asserted separately.
function fixtureArgs() {
  const vendor = {
    business_name: 'Dev Roy Photography', category: 'wedding photography',
    address: '14 Sultanpur Estate', city: 'New Delhi', gstin: '07ABKPR1234F1Z5',
    phone: '+91 79821 59047', upi_id: 'devroy@okhdfc',
    account_name: 'Dev Roy Photography', account_number: '50100234567890', ifsc: 'HDFC0001234',
  };
  const client = { name: 'Priya Nair', phone: '+91 96257 59924' };
  const functions = [
    { id: 'e1', title: 'Mehendi',  event_date: '2026-11-20', event_time: '16:00' },
    { id: 'e2', title: 'Wedding',  event_date: '2026-11-22', event_time: '19:30' },
  ];
  const contract = {
    number: 'DEV440/2026/0001', deposit_pct: 30, created_at: '2026-09-07T06:00:00Z',
    annexes: { a: true },
    terms: {
      // ⚠ PROFILE TOKENS ARE NOT HERE — register v3 §0-bis. This fixture carried
      // `vendor_signatory_name`, `exclusions`, `gst_treatment`, `gst_pct` (PROFILE)
      // and `gst_amount`, `fee_payable_with_gst` (DERIVED, money's) in TERMS, which
      // is why five renderer reads off the wrong plane stayed green for two sittings.
      // They now sit where the register puts them, below and in `money`.
      agreement_date: '2026-09-07',
      partner_1_name: 'Priya Nair', partner_2_name: 'Arjun Nair',
      fee_breakdown: 'two functions, full-day coverage',
      named_professional: 'Dev Roy',
      functions: {
        e1: { venue: 'Taj Falaknuma', city: 'Hyderabad' },   // ← outstation: opens clause 5
        e2: { venue: 'Taj Falaknuma', city: 'Hyderabad' },
      },
    },
  };
  const profile = {
    vendor_signatory_name: 'Dev Roy', vendor_category_words: 'wedding photography',
    exclusions: 'printed albums, drone footage, same-day edits',
    gst_treatment: 'exclusive', gst_pct: 18,
    overtime_rate: 4000, overtime_unit: 'hour', late_grace_days: 7, late_interest_pct: 1.5,
    postpone_notice_days: 60, postpone_window_months: 12, refund_days: 14,
    cancel_tier_1_days: 90, cancel_tier_1_pct: 25, cancel_tier_2_days: 45, cancel_tier_2_pct: 50,
    cancel_tier_3_days: 15, cancel_tier_3_pct: 75, cancel_tier_4_pct: 100,
    deposit_refundable: 'not refundable', delivery_days: 45, delivery_method: 'a download link',
    link_live_days: 90, revision_rounds: 2, revision_rate: 5000, archive_months: 6,
    meals_provision: 'a hot meal and water for four people',
    takedown_days: 14, vendor_credit_role: 'Photography and film', fm_window_months: 12,
    // register v3 §5 — one sentence, hers, printed as written
    travel_and_stay_terms: 'Return airfare for four, economy, booked by the Client. Two rooms at the same hotel as the Client.',
    a_team: 'One photographer and one assistant', a_coverage_hours: 10, a_drone: 'not engaged',
    a_edited_count: 600, a_photo_format: 'by download link, full resolution JPEG',
    a_film: 'a 4\u20135 minute highlight film', a_album: 'not included',
    a_teaser_days: 7, a_selection_days: 21,
    a_extras: 'a second shooter at Rs 12,000 a function; express delivery at Rs 8,000',
    a_raw_files: 'not supplied', a_backup_scheme: 'two separate drives',
  };
  const money = {
    fee_total: 250000, deposit_amount: 75000,
    gst_amount: 45000, fee_payable_with_gst: 295000,   // DERIVED — money's, never terms'
    milestones: [
      { label: 'Before the first function', pct: 40, amount: 100000, due: '2026-11-10' },
      { label: 'On delivery',               pct: 30, amount: 75000,  due: '2027-01-06' },
    ],
  };
  const SIG = { verified_at: '2026-09-07T10:42:00Z', signer_phone: '+91 96257 59924',
                channel: 'otp', document_sha256: 'a'.repeat(64) };
  return { contract, vendor, client, functions, profile, money, signature: SIG };
}

// ══ §2a — THE FIXTURE RENDERS, AND THE BUFFER IS ASSERTED ══════════════════
// ⚠ THIS SECTION EXISTS BECAUSE THE BENCH USED TO PASS ON HELVETICA. Every render
// cell above ran against the v3 renderer, which named no font file, so a face that
// could not embed — or embedded and drew nothing — would never have reddened here.
// F-40.232 and F-40.233 both slipped past a green bench for exactly that reason.
// This renders the founder-card fixture through the REAL faces and asserts bytes,
// pages and the folio; `b60` asserts the glyphs.
section('2a. the founder-card fixture renders through the shipped faces');
{
  const zlib2 = require('zlib');
  const FIX = fixtureArgs();
  const agreed   = await CPDF.generateContractPdf(Object.assign({}, FIX, { signature: null, sealed: false }));
  const unsigned = await CPDF.generateContractPdf(Object.assign({}, FIX, { signature: null, sealed: true }));
  const sealedD  = await CPDF.generateContractPdf(Object.assign({}, FIX, { sealed: true }));

  ok(`the agreed copy renders — ${agreed.length} bytes`,   Buffer.isBuffer(agreed) && agreed.length > 20000);
  ok(`the unsigned copy renders — ${unsigned.length} bytes`, Buffer.isBuffer(unsigned) && unsigned.length > 20000);
  ok(`the sealed copy renders — ${sealedD.length} bytes`,  Buffer.isBuffer(sealedD) && sealedD.length > 20000);

  // ⚠ THE SHIPPED FACES ARE THE ONES EMBEDDED. A renderer that silently fell back
  // to a standard font would still produce a valid PDF — and would not be the
  // document the founder ratified.
  const asText = (b) => b.toString('latin1');
  for (const [name, buf] of [['agreed', agreed], ['sealed', sealedD]]) {
    ok(`${name}: Cormorant is embedded, not substituted`, /CormorantGaramond/.test(asText(buf)));
    ok(`${name}: DM Sans is embedded, not substituted`,   /DMSans/.test(asText(buf)));
    ok(`${name}: no standard-font fallback for the body`, !/\/BaseFont\s*\/Helvetica/.test(asText(buf)));
  }

  // ⚠ THE FOLIO'S TOTAL IS ASSERTED AGAINST THE REAL PAGE COUNT, BOTH DIRECTIONS.
  // The bug this guards is a total stamped BEFORE the annex pages were counted:
  // move `stampFolios` above the annex loop and a nine-page agreement stamps
  // `of 8`, with the last page carrying no folio at all. Page count is read from
  // the PDF's own `/Count`, never from the renderer's opinion of it.
  const pageCount = (buf) => {
    const m = /\/Type\s*\/Pages[\s\S]{0,400}?\/Count\s+(\d+)/.exec(asText(buf));
    return m ? Number(m[1]) : -1;
  };
  for (const [name, buf] of [['agreed', agreed], ['unsigned', unsigned], ['sealed', sealedD]]) {
    const n = pageCount(buf);
    ok(`${name}: the document declares a page count — ${n}`, n > 1);
  }
  // The sealed copy carries the seal page the agreed one does not, so it is longer
  // and never shorter; and both carry the annex page that F-40.190 added.
  ok('the sealed copy is longer than the agreed one', sealedD.length > agreed.length);
  ok('and the agreed copy carries the annex pages too',
     pageCount(agreed) >= pageCount(sealedD) - 1);
}

// ══ §2b — THE TOKEN DIFF (R-40.94 third clause) ════════════════════════════
// ⚠ THE SET COMES FROM THE SOURCE THAT DEFINES IT. `TDW_19_CONTRACT_FIELD_REGISTER_v2.md`
// is the only document that can say whether the renderer carries every field v4
// names; a hand-kept list here would be a second home for the register, which is
// R-40.64's shape. This turns "did I transcribe all of v4" from an audit into a
// red/green, and it runs BOTH WAYS: a token the register names that no clause
// prints, and a `{{name}}` in the renderer the register does not know.
section('2b. every field the register names has a home in the renderer, and vice versa');
{
  const fs2 = require('fs');
  const regPath = 'docs/specs/TDW_19_CONTRACT_FIELD_REGISTER_v2.md';
  const specPath = 'docs/specs/TDW_19_CONTRACT_GENERIC_v4.md';
  const reg  = fs2.existsSync(regPath) ? fs2.readFileSync(regPath, 'utf8') : '';
  const spec = fs2.existsSync(specPath) ? fs2.readFileSync(specPath, 'utf8') : '';
  ok('the register v2 is on the tree', reg.length > 0);
  ok('v4 is on the tree', spec.length > 0);

  // The instrument's own tokens, from v4 — the register describes them, v4 USES
  // them, and a token that appears in neither is not a field.
  const specTokens = new Set([...spec.matchAll(/\{\{([a-z0-9_]+)\}\}/g)].map((m) => m[1]));
  ok(`v4 declares a substantial field set — ${specTokens.size} tokens`, specTokens.size > 100);

  // What the renderer actually reaches for: `P.x`, `T.x`, and `vendor.x` /
  // `client.x` / `M.x`. Read from the SOURCE, comment-stripped, so a token named
  // only in a comment does not count as carried.
  const rend = code('src/lib/contractPdf.js');
  const reached = new Set();
  // ⚠ `contract.` IS IN THE LIST, and leaving it out was half of the first red:
  // `deposit_pct` is read as `contract.deposit_pct`, so a scanner that knew only
  // P/T/M/vendor/client reported a token the renderer prints twice as unreached.
  for (const m of rend.matchAll(/\b(?:P|T|M|contract)\.([a-z0-9_]+)/g)) reached.add(m[1]);
  for (const m of rend.matchAll(/\bvendor\.([a-z0-9_]+)/g)) reached.add('vendor_' + m[1]);
  for (const m of rend.matchAll(/\bclient\.([a-z0-9_]+)/g)) reached.add('couple_' + m[1]);

  // ⚠ THE ALIASES ARE DECLARED, NOT INFERRED. A token whose register name differs
  // from the property that carries it is listed here BY HAND and in one place, so
  // the diff below is honest about what it is forgiving. An alias added to hide a
  // missing field is visible in the diff of this array.
  const ALIAS = {
    vendor_business_name: 'vendor_business_name', vendor_address: 'vendor_address',
    vendor_city: 'vendor_city', vendor_phone: 'vendor_phone', vendor_gstin: 'vendor_gstin',
    vendor_upi_id: 'vendor_upi_id', vendor_account_name: 'vendor_account_name',
    vendor_account_number: 'vendor_account_number', vendor_ifsc: 'vendor_ifsc',
    vendor_base_city: 'vendor_city', couple_primary_phone: 'couple_phone',
    fee_total: 'fee_total', deposit_amount: 'deposit_amount',
    agreement_date: 'agreement_date',
    // Built from `contractAnnex.js`, not read off a row — the annex names have one
    // home and the renderer never types them.
    annexes_attached: 'annexNames',
    // The function table is one row per event, keyed by event id — the register's
    // `function_N_*` are POSITIONAL NAMES for a repeating row, not columns.
    function_1_name: 'functions', function_1_date: 'functions', function_1_time: 'functions',
    function_1_venue: 'functions', function_1_city: 'functions',
    function_2_name: 'functions', function_2_date: 'functions', function_2_time: 'functions',
    function_2_venue: 'functions', function_2_city: 'functions',
    // Milestones likewise: `M.milestones[]`, not three named fields.
    milestone_2_label: 'milestones', milestone_2_pct: 'milestones', milestone_2_amount: 'milestones',
    milestone_2_due: 'milestones', milestone_3_label: 'milestones', milestone_3_pct: 'milestones',
    milestone_3_amount: 'milestones', milestone_3_due: 'milestones',
    deposit_pct: 'deposit_pct',
  };
  // ⚠ THE LOOKUP RESOLVES, IT DOES NOT FORGIVE. An alias names the PROPERTY that
  // carries the token; the test is whether that property is reached, under any
  // prefix. The first cut asked `reached.has(ALIAS[tok])` only, which missed every
  // alias resolving to a differently-prefixed property and red on 22 tokens the
  // renderer does carry. Fixed by resolving, not by widening the map — a map that
  // grows to make a diff green is the diff answering to itself.
  const reachedBare = new Set([...reached].map((t) => t.replace(/^(vendor|couple)_/, '')));
  const carries = (tok) => {
    if (reached.has(tok)) return true;
    const a = ALIAS[tok];
    if (!a) return false;
    if (reached.has(a) || reachedBare.has(a)
        || reachedBare.has(a.replace(/^(vendor|couple)_/, ''))) return true;
    // ⚠ AND AN ALIAS MAY NAME AN IDENTIFIER RATHER THAN A PROPERTY. The register's
    // `function_1_venue` and `milestone_2_due` are POSITIONAL NAMES FOR A REPEATING
    // ROW, not columns: the renderer carries them as `fns` / `T.functions` and
    // `M.milestones`, one row per function and one per milestone. Same for
    // `annexes_attached`, which is built from `contractAnnex.js` rather than read
    // off a row. So the last resort is: does that identifier appear in the
    // comment-stripped source. This is a RESOLUTION, not a forgiveness — the map
    // above names exactly where each token lives, and an entry added to silence a
    // genuinely missing field is one line visible in this file's diff.
    return new RegExp('\\b' + a + '\\b').test(rend);
  };

  const missing = [...specTokens].filter((t) => !carries(t)).sort();
  // ⚠ THE DETAIL IS IN THE LABEL, because this file's `ok` takes (label, cond) and
  // silently drops a third argument — a cell whose evidence never prints is a cell
  // that tells a reader to go and re-derive it.
  ok(`every token v4 names is reached by the renderer${missing.length ? ` — ${missing.length} unreached: ${missing.slice(0, 14).join(' ')}${missing.length > 14 ? ' …' : ''}` : ''}`,
     missing.length === 0);

  // THE OTHER DIRECTION — a field the renderer reads that the instrument does not
  // name is either chrome (declared) or an invention.
  const CHROME = new Set(['functions', 'clauses', 'number', 'created_at', 'terms', 'annexes',
    'vendor_business_name', 'vendor_category', 'vendor_user_id', 'couple_name', 'couple_id',
    'milestones', 'fee_total', 'deposit_amount', 'vendor_routing_handle']);
  const invented = [...reached].filter((t) => !specTokens.has(t) && !CHROME.has(t)
    && !Object.values(ALIAS).includes(t)).sort();
  ok(`the renderer invents no field the instrument does not name${invented.length ? ` — ${invented.length} unknown: ${invented.slice(0, 14).join(' ')}` : ''}`,
     invented.length === 0);
}

// ══ §2c — CLAUSE 10 HAS NO SWITCH, AND MUST NEVER GAIN ONE ═════════════════
// v4: "10.5 is the consent construction and is not a clause a Vendor may switch
// off: a Vendor's toggle governs whether a clause is PRINTED, never whether the
// Client's consent is ON, and this clause is what tells the Client so." Veto rows
// 18 and 22 are that ruling on the tailoring surface — the switch is not drawn
// there either. This cell is the ruling enforced by a bench rather than a comment.
section('2c. clause 10 prints always — the never-drawn switch (v4, veto rows 18/22)');
{
  const rend = code('src/lib/contractPdf.js');
  ok('CLAUSE_SWITCHES does not contain `publication`',
     !/CLAUSE_SWITCHES[\s\S]{0,400}?publication/.test(rend));
  ok('and does not contain any clause-10 key',
     !/CLAUSE_SWITCHES[\s\S]{0,400}?(wedding_page|consent|clause_10|ip_publication)/.test(rend));
  ok('10.5 is drawn with no switch guarding it',
     !/switchOn\([^)]*\)[\s\S]{0,200}?sub\('10\.5'/.test(rend));
  // ⚠ THE MUTATION THIS CATCHES: add `publication` to CLAUSE_SWITCHES and wrap
  // 10.5 in `switchOn(T, 'publication')`. Both cells above red.
  //
  // A fourth cell asked that the file STATE WHY in v4's own words. It was dropped:
  // `code()` strips comments before asserting, and the reason lives in a comment —
  // which is where it belongs. A cell that demands a sentence in a plane it has
  // just removed can only be satisfied by moving prose into code.
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
  ok('preview renders through renderContract (after the signed branch, F-40.268)', /preview[\s\S]{0,1400}renderContract\(/.test(door));
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
  // ── AMENDED BY LABEL — F-40.250 · RATIFY-OR-REVERT ────────────────────────
  // This read `assertE164(body` — the ARGUMENT SHAPE, not the property. F-40.250
  // made the guard normalise before it refuses, so the call became
  // `body.to = assertE164(normalizeTo(toE164(body.to)))` and this cell reddened
  // on a correct build. Fifth time this arc that a cell pinned to a shape has
  // gone red on lawful growth; the count moves, the property does not.
  //
  // IT ASSERTS MORE THAN BEFORE, not less: the guard must be CALLED inside
  // postMessage AND its result ASSIGNED BACK. Validating without assigning would
  // let a ten-digit number pass the guard and still be SENT as ten digits —
  // F-40.185 re-created by the line curing it, which is exactly what the G2
  // seat's bench caught by driving the real post.
  ok('assertE164 is called inside postMessage',
    /async function postMessage[\s\S]{0,900}assertE164\(/.test(mc));
  ok('and its result is assigned back to body.to (F-40.250)',
    /body\.to\s*=\s*assertE164\(/.test(mc));
  ok('and normalizeTo carries no guard', !/function normalizeTo[\s\S]{0,200}throw/.test(mc));
}

// ══ §10d — R-G32.19 / F-40.195 · THE DIGEST IS OF SOMETHING CHECKABLE ══════
section('10d. render, hash, store, seal — in that order');
{
  const args = (sig, sealed) => ({
    contract: { id: 'c1', deposit_pct: 30, terms: { partner_2_name: 'Arjun Nair' }, annexes: { a: true }, state: 'signed' },
    vendor: { ...seedBase().vendors[0], phone: '+919888294440' },
    client: seedBase().clients[0], functions: seedBase().events,
    profile: { vendor_signatory_name: 'Dev Roy' },
    money: { fee_total: 600000, deposit_amount: 180000, milestones: [] },
    signature: sig, sealed,
  });
  const SIG = { verified_at: '2026-09-06T18:14:56Z', signer_phone: '9625759924',
                document_sha256: '27a3d5f5ed00259c4a03b984e222ef0ceb0b90e6f89c537b605de5003d56edd7' };

  const agreed = await CPDF.generateContractPdf(args(SIG, false));
  const sealed = await CPDF.generateContractPdf(args(SIG, true));

  // ⚠ **THE TWO DOCUMENTS ARE NOT THE SAME, AND THAT IS THE CURE.** The first cut
  // rendered ONE, printed `document_sha256` inside it, and the card compared that
  // printed value to the column it was printed FROM — a check that could not fail
  // (R-40.93). A hash inside a document can never be of the document containing
  // it; a hash of the pages she READ can.
  ok('the agreed copy renders', agreed.length > 4000);
  ok('the sealed copy renders', sealed.length > 4000);
  ok('and the sealed one is STRICTLY LONGER — it carries the seal', sealed.length > agreed.length);
  ok('sealed:false omits the seal even for a VERIFIED signing',
     agreed.length === (await CPDF.generateContractPdf(args(null, false))).length);

  // ⚠ THE HASH IS OF THE UNSEALED BYTES, so `sha256sum .agreed.pdf` equals the
  // column. That is a check that CAN fail, which is the entire point.
  const crypto = require('crypto');
  const h1 = crypto.createHash('sha256').update(agreed).digest('hex');
  const h2 = crypto.createHash('sha256').update(await CPDF.generateContractPdf(args(SIG, false))).digest('hex');

  // ⚠ **THE RENDER IS NOT BYTE-DETERMINISTIC, AND THE FIRST CUT OF THIS CELL
  // ASSERTED THAT IT WAS.** Two renders of identical inputs differ in exactly 54
  // bytes: pdfkit's random `/ID` file identifier and the `/Info` creation date.
  // Derived by diffing two buffers, not assumed either way.
  //
  // R-G32.19 DOES NOT NEED DETERMINISM AND NEVER CLAIMED IT. The ruled check is
  // *download `.agreed.pdf`, `sha256sum`, compare to the row* — a hash of the
  // STORED BYTES, which is tamper-evidence on the object a couple actually holds.
  // Re-rendering and comparing would NOT work, and a reader who assumed it would
  // be misled, so the cell says so out loud instead of quietly passing.
  ok('two renders differ (pdfkit /ID and CreationDate) — the check is on STORED bytes',
     h1 !== h2);
  ok('and the sealed bytes hash DIFFERENTLY from the agreed ones — the old claim was impossible',
     crypto.createHash('sha256').update(sealed).digest('hex') !== h1);
  // What the check actually proves: the file at `.agreed.pdf` is the file that was
  // hashed. That is what the seal's label claims, and no more.
  ok('hashing the same buffer twice agrees, which is all the card needs',
     crypto.createHash('sha256').update(agreed).digest('hex') === h1);

  // ── THE DOOR'S ORDER ──────────────────────────────────────────────────────
  const door = code('src/api/sign.js');
  ok('the agreed copy is rendered unsealed', /renderContract\([^)]*\{ sealed: false \}\)/.test(door));
  ok('the hash is taken over THOSE bytes', /update\(agreed\.buffer\)/.test(door));
  ok('and they are stored, so the hash has something to check against', /\.agreed\.pdf/.test(door));
  // ⚠ **THE ONE ORDERING THAT WAS WRONG.** `setSealedPath` used to run AFTER the
  // sealed render, so the seal printed `__________` where clause 12 promises a
  // fingerprint. It must precede it.
  ok('setSealedPath runs BEFORE the sealed render',
     door.indexOf('setSealedPath') < door.indexOf('renderContract(supabase, vendorId, v.contract.id, { sealed: true })'));
  // ⚠ RETIRED BY c-40.49, AND THE SUPERSESSION IS THE RECORD. This pinned
  // `PAGES BEFORE THIS ONE` — v3's own authored prose about which bytes the digest
  // covers. It was never vetoed onto a frame: the ratified `P4-sign` seal carries a
  // label, three value lines and the digest, and the label stands ALONE as
  // `Document fingerprint · SHA-256`. Which bytes are hashed is a fact for the
  // register and the handover (the digest is over `.agreed.pdf`, R-G32.19), not for
  // the paper — the couple reads a fingerprint, the estate reads a definition.
  // The label byte is now asserted at §2's third state instead.
  ok('the seal label is the ratified byte and not v3\'s authored prose',
     !/PAGES BEFORE THIS ONE/.test(code('src/lib/contractPdf.js'))
     && /Document fingerprint/.test(code('src/lib/contractPdf.js')));

  // ── F-40.194 · the copy outlives the spent token ──────────────────────────
  ok('the sign response carries the sealed copy url', /pdf_url: pdfUrl/.test(door));
  ok('signed for ten minutes, not forever', /SIGNED_URL_TTL = 600/.test(door));
  ok('and the token is STILL spent — nothing weakened',
     /sign_token: null/.test(code('src/lib/vendor/contracts.js')));
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

// ══ §14 — THE TRADE DEFAULTS AND CLAUSE 7.2's TWO ARMS ════════════════════
//
// R-40.114 (the sheet opens pre-filled), R-40.117 as amended by R-G32.21
// (`delivery_basis`, and 7.2's on-the-day arm).
//
// BOTH-WAYS, by PRODUCTION mutation:
//   14a  seed `link_live_days` into the makeup row      → §14a flips RED
//   14b  give every trade `delivery_basis: 'days'`      → §14c flips RED
//   14c  drop the on-the-day arm back to one sentence   → §14d flips RED
//   14d  remove `category` from PDF_VENDOR_COLUMNS      → §14e flips RED
section('14. what a trade starts with, and which clause 7.2 it prints');
{
  const ANX = require(path.join(ROOT, 'src/lib/contractAnnex.js'));
  const trades = Object.keys(ANX.TRADE_DEFAULTS);

  ok(`the table carries every mapped category (${trades.length})`,
     trades.length === Object.keys(ANX.CATEGORY_ANNEXES).length);
  // ⚠ THE TWO TABLES MUST NAME THE SAME TRADES. A category that can be offered
  // an annex and cannot be seeded a policy is a vendor who meets half a room.
  ok('and exactly the same ones the annex map does',
     trades.every((t) => t in ANX.CATEGORY_ANNEXES));

  // ── §14a · NO TRADE SEEDS A ROW IT OMITS — the chair's cell ─────────────
  // ⚠ THE INVARIANT IS THE WHOLE POINT OF SEEDING BY TRADE. A row that is
  // omitted from the sheet and seeded anyway is a value written to a legal
  // instrument that the vendor was never shown — which is the one thing this
  // sheet exists not to do.
  // ⚠ THE FIRST CUT OF THIS CELL WAS VACUOUS AND CANNOT BE RESTORED. It read
  // 「for each key in omittedFor(t), assert it is not in fields」 — and
  // `omittedFor` is DERIVED from `fields`, so the intersection is empty by
  // construction and the cell could never fail. It was driven with makeup
  // seeding `link_live_days` and stayed green: a mutation that changes the
  // behaviour and moves no cell is the definition of hollow green.
  //
  // The law the chair asked for needs a source of omission INDEPENDENT of the
  // seed. The basis is that source, and it yields two falsifiable statements:
  const seven = trades.filter((t) => ANX.tradeDefaultsFor(t).delivery_basis === 'on_the_day');
  const rest  = trades.filter((t) => ANX.tradeDefaultsFor(t).delivery_basis === 'days');

  // ⚠ ON-THE-DAY TRADES SEED NOTHING FROM CLAUSE 7. The sheet omits those rows,
  // so a seed for one is a value written to a legal instrument that the vendor
  // was never shown — the single thing this sheet exists not to do.
  const leaked = [];
  for (const t of seven) {
    const f = ANX.tradeDefaultsFor(t).fields;
    for (const k of ANX.DELIVERY_FAMILY) if (k in f) leaked.push(`${t}.${k}`);
  }
  ok(`no on-the-day trade seeds a clause 7 row (${seven.length} trades, ${leaked.length} leaked)`,
     seven.length > 0 && leaked.length === 0);

  // ⚠ AND EVERY DAYS TRADE SEEDS `delivery_days`, because for those trades it
  // is still REQUIRED at Send (register :189) and 7.2's days arm interpolates
  // it. A days trade without one draws a required row with no suggestion and
  // omits 7.2 whole, which is the failure R-G32.21 was written to end.
  const missing = rest.filter((t) => !('delivery_days' in ANX.tradeDefaultsFor(t).fields));
  ok(`every days trade seeds delivery_days (${rest.length} trades, ${missing.length} without)`,
     rest.length > 0 && missing.length === 0);

  // And the omission list still answers per trade rather than per basis — the
  // reason it reads the seed at all is jewellery, a days trade that hands over
  // in person and so asks no gallery, revision or archive row.
  ok('a days trade may still omit part of clause 7',
     ANX.omittedFor('jewellery').includes('link_live_days') &&
     !ANX.omittedFor('jewellery').includes('delivery_days'));
  ok('and a photography trade omits none of it',
     ANX.omittedFor('photography').length === 0);

  // ── §14b · EVERY SEEDED VALUE IS STORABLE — F-40.237's cure ────────────
  // ⚠ THIS IS THE CELL THAT WOULD HAVE CAUGHT THE DEFECT. The ratified frame's
  // value column was rendered OUTPUT — 「Rs 4,000」, 「7 days」, 「1.5% a month」 —
  // and `rs()` / `pct()` / clause 4.7's literal ` days` supply those forms
  // themselves. A seed carrying one prints it twice on a signed agreement.
  const NUMERIC = ['overtime_rate','late_grace_days','late_interest_pct','postpone_notice_days',
                   'postpone_window_months','cancel_tier_1_pct','cancel_tier_2_pct',
                   'cancel_tier_3_pct','cancel_tier_4_pct','refund_days','delivery_days',
                   'link_live_days','revision_rounds','revision_rate','archive_months',
                   'takedown_days','fm_window_months','gst_pct'];
  let dirty = [];
  for (const t of trades.concat([null])) {
    const { fields } = ANX.tradeDefaultsFor(t);
    for (const k of NUMERIC) {
      if (!(k in fields)) continue;
      if (!/^[0-9]+(\.[0-9]+)?$/.test(String(fields[k]))) dirty.push(`${t}.${k}=${fields[k]}`);
    }
  }
  ok(`every numeric seed is a bare number (${dirty.length} carrying a unit)`, dirty.length === 0);
  // ⚠ AND NO SEED CARRIES A CURRENCY OR A PERCENT SIGN ANYWHERE.
  const allVals = trades.concat([null]).flatMap((t) => Object.values(ANX.tradeDefaultsFor(t).fields));
  ok('no seed carries Rs or a percent sign',
     !allVals.some((v) => /(^|\s)Rs\s|%/.test(String(v))));

  // ── §14c · THE FOUR `Needed` ROWS ARE NEVER SEEDED ─────────────────────
  // A signatory cannot be guessed (ruling F7), and the other three are hers to
  // declare. They get placeholders, which are not values.
  const NEVER = ['vendor_signatory_name','deposit_refundable','gst_treatment','gst_pct'];
  ok('no trade defaults a Needed row',
     trades.concat([null]).every((t) => {
       const f = ANX.tradeDefaultsFor(t).fields;
       return NEVER.every((k) => !(k in f));
     }));
  ok('the placeholders ship as bytes from this file',
     typeof ANX.PROFILE_PLACEHOLDERS.vendor_signatory_name === 'string' &&
     ANX.PROFILE_PLACEHOLDERS.vendor_signatory_name.includes('{name}'));
  // ⚠ AND NO PLACEHOLDER CARRIES A REAL VENDOR'S NAME. The ratified frame read
  // 「e.g. Swati Roy, proprietor」 because it was drawn on Swati's sheet; the
  // literal on every vendor's screen is the costume class wearing a proper noun.
  ok('and none carries one vendor\u2019s name to another\u2019s screen',
     !/Swati|Priya|Dev Roy/.test(JSON.stringify(ANX.PROFILE_PLACEHOLDERS)));

  // ── §14d · THE BASIS, AND BOTH ARMS OF 7.2 ─────────────────────────────
  const bases = trades.map((t) => ANX.tradeDefaultsFor(t).delivery_basis);
  ok('every trade declares a basis', bases.every((b) => b === 'days' || b === 'on_the_day'));
  ok('and both kinds exist in the table',
     bases.includes('days') && bases.includes('on_the_day'));
  // ⚠ AN UNKNOWN OR NULL CATEGORY ANSWERS `days` — the SAFE direction. A days
  // trade wrongly seeded shows one extra row she can clear; an on-the-day trade
  // wrongly seeded HIDES a row clause 7.2 needs.
  ok('an unmapped category fails toward days',
     ANX.tradeDefaultsFor(null).delivery_basis === 'days' &&
     ANX.tradeDefaultsFor('nope').delivery_basis === 'days');
  ok('makeup hands over on the day', ANX.tradeDefaultsFor('makeup').delivery_basis === 'on_the_day');
  ok('photography does not',        ANX.tradeDefaultsFor('photography').delivery_basis === 'days');

  const pdf = code('src/lib/contractPdf.js');
  ok('7.2 branches on the basis', /deliveryBasis === 'on_the_day'/.test(pdf));
  ok('the on-the-day arm is there', /Delivery is on the day of the last function\./.test(pdf));
  ok('the days arm survives',       /Delivery is within \$\{P\.delivery_days\} days/.test(pdf));
  // ⚠ THE ON-THE-DAY ARM MUST CARRY NO INTERPOLATION, and that is the property
  // that makes clauses 4.7 and 11 safe. `f` returns null when any value is
  // absent, so an interpolated arm could vanish and leave two clauses pointing
  // at a clause 7.2 that is not in the document — register `:196`'s own warning.
  const arm = (pdf.match(/'Delivery is on the day[^']*'/) || [''])[0];
  ok('and it interpolates nothing, so it can never be omitted',
     arm.length > 40 && !arm.includes('${'));
  // Both referring clauses still name 7.2, so the referent exists either way.
  ok('4.7 still names the period stated in clause 7.2', /added to the period stated in clause 7\.2/.test(pdf));

  // ── §14e · THE BASIS REACHES THE RENDERER, AND THE COLUMN REACHES THE BASIS
  // ⚠ `category` WAS ABSENT FROM THE PDF SELECT AND THE ABSENCE WAS SILENT.
  // `tradeDefaultsFor` takes null as legal input and answers `days`, so a
  // missing column would not throw — every on-the-day vendor would simply have
  // printed the days arm with a `delivery_days` she was never asked for.
  const src = code('src/lib/vendor/contractSource.js');
  ok('the PDF vendor SELECT reads category', /routing_handle, category/.test(src));
  ok('the one call site resolves the basis', /deliveryBasis: tradeDefaultsFor\(/.test(src));
  // ⚠ THE FIRST CUT OF THIS CELL ASSERTED THE RENDERER IMPORTS NOTHING FROM
  // `contractAnnex.js` AND WENT RED ON CORRECT CODE. The renderer has required
  // that file since ruling F4, for `annexTitle` and `attachedKeys` — that
  // import IS the one-home cure, not a violation of it. What must be absent is
  // the LOOKUP: the renderer is handed the resolved basis and must not resolve
  // one, because two ways to learn a fact is the shape the file ended.
  ok('the renderer takes the basis as a parameter',
     /deliveryBasis = 'days'/.test(pdf));
  ok('and never resolves one itself',
     !/tradeDefaultsFor/.test(pdf));
  ok('while still reading the annex titles from their one home',
     /annexTitle/.test(pdf));

  // ── §14f · ONE DOOR SERVES BOTH, AND `seeded` IS NOT `mapped` ──────────
  const door = code('src/api/vendor/contracts.js');
  ok('the annex-map door serves the defaults too', /defaults: fields/.test(door));
  ok('and the omitted rows',                        /omitted: omittedFor\(/.test(door));
  ok('and the placeholders',                        /placeholders: PROFILE_PLACEHOLDERS/.test(door));
  ok('seeded is sent, never inferred from mapped',  /seeded,/.test(door));
  // No second endpoint for one question.
  ok('there is no second defaults door',
     !/router\.(get|post)\('\/(trade-)?defaults/.test(door));
}

// ══ §15 — G3.2 SITTING 3: THE ROOM AS A VENDOR USES IT (R-40.120 / R-40.121) ═══
//
// MUTATION PROOFS (each run by hand at the seat, RED then GREEN):
//   15a  put `travel_terms` back in TRADE_BASE / `P.rooms` back in 5.2   → 15a flips RED
//   15b  make `functionsForContract` return [] on no lead               → 15b flips RED
//   15c  drop the spread of `terms.policy_overrides` in effectiveProfile → 15c flips RED
//   15d  remove the `isPlaceholder` branch from rs()                     → 15d flips RED
//   15e  read `T.vendor_signatory_name` at 1.1 again                     → 15e flips RED
//
// ⚠ WHAT THESE CELLS CAN MEASURE. The clause text is set through Identity-H, so
// a rendered agreement cannot be grepped for a sentence (§10a's note). What a
// render CAN witness is LENGTH: a clause that prints is bytes, and a clause that
// is omitted whole is fewer bytes. Every length cell below is paired with a
// SOURCE cell so a length that moved for another reason is caught by the other.
section('15. sitting 3 — the vendor\'s own words, her own functions, this couple only, and the agreement she reads first');
{
  const FIX  = fixtureArgs();
  const rend = code('src/lib/contractPdf.js');
  const src  = code('src/lib/vendor/contractSource.js');
  const anx  = require(path.join(ROOT, 'src/lib/contractAnnex.js'));
  const len  = async (over) => (await CPDF.generateContractPdf(Object.assign({}, FIX, over))).length;
  const deep = (o) => JSON.parse(JSON.stringify(o));

  // ── 15a · clause 5 is ONE sentence, hers, and the seed carries R-40.73 ────
  ok('5.2 reads travel_and_stay_terms through ownWords', /ownWords\(P\.travel_and_stay_terms\)/.test(rend));
  ok('the renderer reads neither retired token', !/P\.(same_venue|rooms|travel_terms)\b/.test(rend));
  ok('TRADE_BASE seeds the one token', typeof anx.TRADE_BASE.travel_and_stay_terms === 'string');
  ok('and the seed says what R-40.73 ruled — two rooms, the same hotel',
     /two rooms/.test(anx.TRADE_BASE.travel_and_stay_terms) && /same hotel/.test(anx.TRADE_BASE.travel_and_stay_terms));
  ok('TRADE_BASE carries no retired token', !('travel_terms' in anx.TRADE_BASE) && !('same_venue' in anx.TRADE_BASE) && !('rooms' in anx.TRADE_BASE));
  ok('the instrument names exactly the one token at clause 5',
     /\{\{travel_and_stay_terms\}\}/.test(read('docs/specs/TDW_19_CONTRACT_GENERIC_v4.md'))
     && !/\{\{(same_venue|rooms|travel_terms)\}\}/.test(read('docs/specs/TDW_19_CONTRACT_GENERIC_v4.md')));
  {
    const withIt    = await len({});
    const noProfile = deep(FIX.profile); delete noProfile.travel_and_stay_terms;
    const without   = await len({ profile: noProfile });
    ok(`clause 5 is omitted whole when her sentence is unset (${withIt} > ${without})`, withIt > without);
  }

  // ── 15b · the manual arm ───────────────────────────────────────────────────
  {
    const rows = SRC.manualFunctions({ functions_manual: [
      { title: 'Wedding', date: '2026-11-21', time: '18:00', venue: 'Rambagh Palace', city: 'Jaipur' },
      { title: '', date: '2026-11-22' },            // no title — dropped
      { title: 'Reception', date: '' },             // no date  — dropped
    ] });
    ok('a manual row is normalised to the events shape', rows.length === 1 && rows[0].event_date === '2026-11-21' && rows[0].event_time === '18:00' && rows[0].id === 'm0');
    ok('and carries venue and city ON THE ROW', rows[0].venue === 'Rambagh Palace' && rows[0].city === 'Jaipur');
    ok('a row with no title or no date is not a function', SRC.manualFunctions({ functions_manual: [{ title: 'x' }, { date: '2026-01-01' }] }).length === 0);
    ok('a non-array is no functions', SRC.manualFunctions({ functions_manual: 'Wedding' }).length === 0 && SRC.manualFunctions(null).length === 0);

    // no lead, no events → the manual arm stands in (F-40.243's hole)
    const db = makeDb(seedBase());
    const noLead = await SRC.functionsForContract(db, VENDOR, { client_id: 'client-nobody', terms: { functions_manual: [{ title: 'Sangeet', date: '2026-12-01' }] } });
    ok('no lead: the manual rows stand in', noLead.length === 1 && noLead[0].manual === true && noLead[0].title === 'Sangeet');
    // a lead with events → the calendar wins and the manual rows are NOT doubled
    const withLead = await SRC.functionsForContract(db, VENDOR, { client_id: 'client-priya', terms: { functions_manual: [{ title: 'Sangeet', date: '2026-12-01' }] } });
    ok('events present: the calendar wins, nothing is doubled', withLead.length === 2 && withLead.every(r => !r.manual));

    // the renderer reads the row's own place through one lookup
    ok('the renderer has ONE place lookup', (rend.match(/placeOf\(e\)/g) || []).length === 2 && /const placeOf = \(e\) =>/.test(rend));
    ok('and no bare T.functions[e.id] read survives beside it', !/T\.functions\[e\.id\]\) \|\| \{\}/.test(rend));
    const manualOut = [{ id: 'm0', manual: true, title: 'Wedding', event_date: '2026-11-21', event_time: '18:00', slot: null, venue: 'Rambagh', city: 'Jaipur' }];
    const manualIn  = [{ id: 'm0', manual: true, title: 'Wedding', event_date: '2026-11-21', event_time: '18:00', slot: null, venue: 'Leela', city: 'New Delhi' }];
    const termsNoFn = deep(FIX.contract); termsNoFn.terms.functions = {};
    const none = await len({ functions: [], contract: termsNoFn });
    const out  = await len({ functions: manualOut, contract: termsNoFn });
    const inn  = await len({ functions: manualIn,  contract: termsNoFn });
    ok(`a manual function draws the clause 3 table (${out} > ${none})`, out > none);
    ok(`a manual OUTSTATION function opens clause 5; an in-city one does not (${out} > ${inn})`, out > inn);
  }

  // ── 15c · this couple only ─────────────────────────────────────────────────
  {
    const eff = SRC.effectiveProfile({ late_grace_days: '7', late_interest_pct: '1.5', a: '1' },
                                     { policy_overrides: { late_interest_pct: '2', b: '2' } });
    ok('an override wins over the profile', eff.late_interest_pct === '2' && eff.late_grace_days === '7' && eff.b === '2');
    ok('no overrides → the profile as stored', JSON.stringify(SRC.effectiveProfile({ x: 1 }, {})) === '{"x":1}' && JSON.stringify(SRC.effectiveProfile({ x: 1 }, null)) === '{"x":1}');
    ok('the source computes it once, at the profile read', /const profile = effectiveProfile\(prof && prof\.fields, contract\.terms\)/.test(src));
    const base    = await len({});
    const blanked = await len({ profile: SRC.effectiveProfile(FIX.profile, { policy_overrides: { late_interest_pct: '' } }) });
    ok(`an override of '' omits the clause for this agreement (${base} > ${blanked})`, base > blanked);
  }

  // ── 15d · the standard agreement, before anything exists ───────────────────
  {
    const db = makeDb(seedBase());
    db.from('vendors'); // ensure table
    const r = await SRC.renderStandardAgreement(db, VENDOR);
    ok(`the standard agreement renders from a vendor row alone — ${r.ok ? r.buffer.length : 'FAILED: ' + r.error} bytes`, r.ok && r.buffer.length > 20000);
    ok('its fee is a labelled placeholder, not a number', r.ok && r.source.money.fee_total === '[your fee]');
    ok('its deposit is a labelled placeholder', r.ok && r.source.contract.deposit_pct === '[the deposit %]');
    ok('it created no contract row', (db.from('contracts') && (await db.from('contracts').select().then(x => x.data))).length === 0);
    ok('rs() and pct() pass a [placeholder] through', /const isPlaceholder = /.test(rend) && /function rs\(n\)\s*\{ return isPlaceholder\(n\) \? n :/.test(rend) && /function pct\(n\)\s*\{ return isPlaceholder\(n\) \? n :/.test(rend));
    ok('a real number is still formatted', /formatRs\(n\)/.test(rend));
    const door = code('src/api/vendor/contracts.js');
    const iStd = door.indexOf("router.get('/standard'"), iId = door.indexOf("router.get('/:contractId/download'");
    ok('GET /standard exists and is declared above the /:contractId routes', iStd > 0 && iId > 0 && iStd < iId);
    ok('the door renders through the source, never the renderer', /renderStandardAgreement\(supabase, req\.vendor\.id\)/.test(door) && !/generateContractPdf/.test(door));
    ok('§5 still holds: one file calls the renderer', (rend && true) && !/generateContractPdf\s*\(/.test(door));
    ok('the source has ONE generateContractPdf expression', (src.match(/generateContractPdf\s*\(/g) || []).length === 1);
  }

  // ── 15e · profile tokens read from the profile — register v3 §0-bis ───────
  {
    ok('no PROFILE or DERIVED token is read off terms',
       !/T\.(vendor_signatory_name|vendor_category_words|exclusions|gst_treatment|gst_pct|gst_amount|fee_payable_with_gst)\b/.test(rend));
    ok('the signatory is read from the profile at 1.1 and the seal', (rend.match(/P\.vendor_signatory_name/g) || []).length >= 5);
    ok('the tax block reads its money from M', /rs\(M\.gst_amount\)/.test(rend) && /rs\(M\.fee_payable_with_gst\)/.test(rend));
    const full = await len({});
    const noSig = deep(FIX.profile); delete noSig.vendor_signatory_name;
    const withoutSig = await len({ profile: noSig });
    ok(`no signatory in the profile → 1.1's Vendor line and the seal name are omitted (${full} > ${withoutSig})`, full > withoutSig);
    // the reverse proof: the name in TERMS alone must NOT bring them back
    const termsSig = deep(FIX.contract); termsSig.terms.vendor_signatory_name = 'Dev Roy';
    const termsOnly = await len({ profile: noSig, contract: termsSig });
    ok('a signatory in terms alone is not read (the old plane is dead)', termsOnly === withoutSig);
  }
}

// ══ §16 — THE SIGN LINK IS SENT (sitting 3, the founder's walk of 2026-09-07) ═══
//
// MUTATION PROOFS (RED then GREEN at the seat):
//   16a  put the hardcoded `not approved` sentence back in the door   → 16a flips RED
//   16b  drop toE164 from sendSignLink                                 → 16b flips RED
//   16c  skip recordSend on the failure branch                         → 16c flips RED
section('16. the sign link is sent, recorded, and E.164');
{
  const SEND = require(path.join(ROOT, 'src/lib/vendor/contractSend.js'));
  const door = code('src/api/vendor/contracts.js');
  const sendSrc = code('src/lib/vendor/contractSend.js');
  ok('the door sends when the flag is on', /if \(!flagOn\) \{[\s\S]{0,300}\}\s*const src = await contractPdfSource[\s\S]{0,900}await sendSignLink\(supabase/.test(door));
  ok('the hardcoded template sentence is gone', !/not approved on the sending WABA/.test(door));
  ok('sent is the send\u2019s answer, never a literal', /sent: s\.sent, reason: s\.reason/.test(door) && !/sent: false,\s*reason: flagOn/.test(door));
  ok('functions come from the one home', /src\.functions \|\| \[\]/.test(door) && /contractPdfSource\(supabase, req\.vendor\.id, req\.params\.contractId\)/.test(door));
  ok('the arm rides the vendor lane on tdw_contract_sign', /SIGN_TEMPLATE_KEY = 'contract_sign'/.test(sendSrc) && /line: 'vendor',\s*to,\s*templateKey: SIGN_TEMPLATE_KEY/.test(sendSrc));
  ok('the number is E.164 in the arm and nowhere else', /toPhone \? toE164\(toPhone\) : null/.test(sendSrc) && !/toE164/.test(door));
  const rows = [];
  const db = { from: () => ({ insert: async (r) => { rows.push(r); return {}; } }) };
  const noLine = await SEND.sendSignLink(db, { contractId: 'k1', vendorId: VENDOR, toPhone: '8595356978', owner: 'X', functionsText: 'Sangeet', link: 'https://t/sign/a' });
  ok('with no FROM number the refusal is named, not swallowed', noLine.sent === false && noLine.reason === 'line_not_configured');
  ok('and it is a row on contract_sends with the reason as status', rows.length === 1 && rows[0].status === 'line_not_configured' && rows[0].template_key === 'contract_sign' && rows[0].recipient === 'client');
  ok('ten digits went out as +91 (F-40.185\u2019s cousin)', rows[0].to_phone === '+918595356978');
  const noPhone = await SEND.sendSignLink(db, { contractId: 'k1', vendorId: VENDOR, toPhone: null, link: 'x' });
  ok('no number is no_phone, recorded', noPhone.reason === 'no_phone' && rows[1].status === 'no_phone' && rows[1].to_phone === null);
}

// ══ §17 — THE SIGNED COPY ARRIVES (F-40.257) AND THE OTP HAS A ROW (F-40.258) ═══
//
// MUTATION PROOFS (RED then GREEN at the seat):
//   17a  hand sendOne the raw phone again                      → 17a flips RED
//   17b  put createSignedUrl back as the document link         → 17b flips RED
//   17c  drop recordOtpSend from the OTP door's success path   → 17c flips RED
section('17. the signed copy is E.164 and publicly fetchable; the OTP send has a row');
{
  const SEND = require(path.join(ROOT, 'src/lib/vendor/contractSend.js'));
  const sendSrc = code('src/lib/vendor/contractSend.js');
  const signDoor = code('src/api/sign.js');
  ok('sendOne takes the row\u2019s bytes and sends E.164', /toPhone: rawPhone[\s\S]{0,400}const toPhone = rawPhone \? toE164\(rawPhone\) : null;/.test(sendSrc));
  ok('the document link is the wa-media public URL, not a signed private one', /link = await publishSealedForMeta\(supabase, sealedPath\)/.test(sendSrc) && !/createSignedUrl\(sealedPath/.test(sendSrc));
  ok('the rehost lands in the estate\u2019s Meta-media home at an unguessable path', /WA_MEDIA_BUCKET = 'wa-media'/.test(sendSrc) && /contracts\/\$\{Date\.now\(\)\}-\$\{crypto\.randomUUID\(\)\}\.pdf/.test(sendSrc) && /contentType: 'application\/pdf', upsert: false/.test(sendSrc));
  ok('a failed rehost refuses both sends by name', /reason: 'rehost_failed'/.test(sendSrc));
  // the rehost, by function, on a fake storage
  const calls = [];
  const storage = {
    from: (b) => ({
      download: async (p) => { calls.push(['download', b, p]); return { data: { arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer }, error: null }; },
      upload: async (p, bytes, o) => { calls.push(['upload', b, p, o.contentType, bytes.length]); return { error: null }; },
      getPublicUrl: (p) => ({ data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/${b}/${p}` } }),
    }),
  };
  const url = await SEND.publishSealedForMeta({ storage }, 'v1/k1.signed.pdf');
  ok('it downloads from contracts and uploads to wa-media as a PDF', calls[0][1] === 'contracts' && calls[1][1] === 'wa-media' && calls[1][3] === 'application/pdf' && calls[1][4] === 4);
  ok('and returns the public URL with no token', /\/object\/public\/wa-media\/contracts\/\d+-[0-9a-f-]{36}\.pdf$/.test(url) && !/token=/.test(url));
  // the client half: ten digits become +91 on the copy send's row
  const rows = [];
  const db = { from: () => ({ insert: async (r) => { rows.push(r); return {}; } }) };
  // sendOne is internal; drive it through sendSealedCopy with the flag on and a fake storage that rehosts
  const prev = process.env.CONTRACT_COPY_SEND_ENABLED; process.env.CONTRACT_COPY_SEND_ENABLED = '1';
  const out = await SEND.sendSealedCopy({ storage, from: db.from }, { contractId: 'k1', vendorId: VENDOR, sealedPath: 'v1/k1.signed.pdf', reference: 'DEV440/2026/0007', vendorName: 'V', vendorPhone: '+919888294440', clientName: 'C', clientPhone: '8595356978' });
  if (prev === undefined) delete process.env.CONTRACT_COPY_SEND_ENABLED; else process.env.CONTRACT_COPY_SEND_ENABLED = prev;
  ok('both sends were attempted', out.attempted === true && out.results.length === 2);
  ok('the client row carries +91 (F-40.257\u2019s client half)', rows.some(r => r.recipient === 'client' && r.to_phone === '+918595356978'));
  ok('neither refusal is the E.164 one any more', out.results.every(r => !/E\.164/.test(String(r.reason))));
  // F-40.258
  ok('the OTP door records its send', /recordOtpSend\(supabase, \{ contractId: v\.contract\.id[\s\S]{0,120}status: 'sent' \}\)/.test(signDoor));
  ok('and records its refusal before rethrowing', /catch \(e\) \{[\s\S]{0,200}recordOtpSend\([\s\S]{0,200}throw e;/.test(signDoor));
  const rows2 = [];
  await SEND.recordOtpSend({ from: () => ({ insert: async (r) => { rows2.push(r); return {}; } }) }, { contractId: 'k1', vendorId: VENDOR, toPhone: '+918595356978', wamid: 'wamid.X', status: 'sent' });
  ok('the OTP row is recipient client on the OTP template with its wamid', rows2[0].recipient === 'client' && rows2[0].template_key === 'contract_sign_otp' && rows2[0].wamid === 'wamid.X');
}

// ══ §18 — ONE TAXONOMY (F-40.264, R-31.1): the trade tables are keyed on the eleven ═══
//
// MUTATION PROOFS (RED then GREEN at the seat):
//   18a  add a `mehendi:` row back to TRADE_DEFAULTS      → 18a flips RED (and bOB §6.1)
//   18b  make tradeKey return the raw string               → 18b flips RED
section('18. one taxonomy — the trade tables import the eleven and normalise before they read');
{
  const ANX = require(path.join(ROOT, 'src/lib/contractAnnex.js'));
  const { VENDOR_CATEGORIES } = require(path.join(ROOT, 'src/agent/categories.js'));
  const src = code('src/lib/contractAnnex.js');
  ok('the canonical list and the normaliser come in by import', /require\('\.\.\/agent\/categories'\)/.test(src) && /require\('\.\/vendor\/categoryFraming'\)/.test(src));
  const bad = Object.keys(ANX.TRADE_DEFAULTS).filter(k => !VENDOR_CATEGORIES.includes(k));
  ok(`every TRADE_DEFAULTS key is one of the eleven (${bad.length ? 'stray: ' + bad.join(' ') : 'none stray'})`, bad.length === 0);
  const bad2 = Object.keys(ANX.CATEGORY_ANNEXES).filter(k => !VENDOR_CATEGORIES.includes(k));
  ok('every CATEGORY_ANNEXES key is one of the eleven', bad2.length === 0);
  ok('other is not a trade', !('other' in ANX.TRADE_DEFAULTS) && !('other' in ANX.CATEGORY_ANNEXES));
  ok('an alias reaches its trade', ANX.tradeKey('videographer') === 'photography' && ANX.tradeKey('caterer') === 'venue_catering' && ANX.tradeKey(' Makeup ') === 'makeup');
  ok('a folded token reads the unmapped branch', ANX.tradeKey('mehendi') === null && ANX.annexesFor('mehendi').mapped === false && ANX.tradeDefaultsFor('cake').seeded === false);
  ok('null first, still', ANX.tradeKey(null) === null && ANX.tradeKey('') === null && ANX.annexesFor(null).mapped === false);
  ok('both readers go through tradeKey', /function annexesFor\(category\) \{[\s\S]{0,200}const key\s+= tradeKey\(category\)/.test(src) && /function tradeDefaultsFor\(category\) \{[\s\S]{0,120}const key = tradeKey\(category\)/.test(src));
  ok('an alias seeds its trade\u2019s defaults', ANX.tradeDefaultsFor('Videographer').fields.vendor_category_words === 'wedding photography');
}

// ══ §19 — THE SEALED COPY'S FOUR (F-40.265–.268) ═══════════════════════════
//
// MUTATION PROOFS (RED then GREEN at the seat):
//   19a  remove cancel_tier_1_days from TRADE_BASE          → 19a flips RED
//   19b  read T.named_professional at 12.2 again             → 19b flips RED
//   19c  drop withCreditLabel from effectiveProfile          → 19c flips RED
//   19d  remove the signed branch from the preview door      → 19d flips RED
section('19. the sealed copy\u2019s four — slabs print, 12.2 has a home, 10.6 prints the label, a signed read is the sealed object');
{
  const FIX  = fixtureArgs();
  const rend = code('src/lib/contractPdf.js');
  const src  = code('src/lib/vendor/contractSource.js');
  const door = code('src/api/vendor/contracts.js');
  const ANX  = require(path.join(ROOT, 'src/lib/contractAnnex.js'));
  const SRC  = require(path.join(ROOT, 'src/lib/vendor/contractSource.js'));
  const len  = async (over) => (await CPDF.generateContractPdf(Object.assign({}, FIX, over))).length;
  const deep = (o) => JSON.parse(JSON.stringify(o));
  // 19a · F-40.265
  ok('the three thresholds are seeded 90 / 60 / 30', ANX.TRADE_BASE.cancel_tier_1_days === '90' && ANX.TRADE_BASE.cancel_tier_2_days === '60' && ANX.TRADE_BASE.cancel_tier_3_days === '30');
  {
    const seeded = { ...ANX.tradeDefaultsFor('makeup').fields };
    const withSlabs = await len({ profile: seeded });
    const noDays = deep(seeded); delete noDays.cancel_tier_1_days; delete noDays.cancel_tier_2_days; delete noDays.cancel_tier_3_days;
    const without = await len({ profile: noDays });
    ok(`a seeded trade prints 6.4\u2019s table; without thresholds every row omits (${withSlabs} > ${without})`, withSlabs > without);
  }
  // 19b · F-40.266
  ok('12.2 reads the name from the profile', /P\.named_professional\} shall attend personally/.test(rend) && !/T\.named_professional/.test(rend));
  {
    const p = deep(FIX.profile); p.named_professional = 'Dev Roy';
    const t = deep(FIX.contract); delete t.terms.named_professional;
    const on = await len({ profile: p, contract: t });
    const q = deep(p); delete q.named_professional;
    const off = await len({ profile: q, contract: t });
    ok(`the profile name prints 12.2; a name in terms alone does not (${on} > ${off})`, on > off);
    const tOnly = deep(t); tOnly.terms.named_professional = 'Dev Roy';
    ok('the old plane is dead', (await len({ profile: q, contract: tOnly })) === off);
  }
  // 19c · F-40.267
  ok('the label is resolved where P is built, and the renderer stays pure', /return withCreditLabel\(\{ \.\.\.base, \.\.\.ov \}\)/.test(src) && /require\('\.\/weddings'\)/.test(src) && !/require\('\.\/vendor\//.test(rend));
  ok('a role key prints its label; a phrase prints as written', SRC.effectiveProfile({ vendor_credit_role: 'shot_by' }, {}).vendor_credit_role === 'Shot by' && SRC.effectiveProfile({ vendor_credit_role: 'Makeup by Swati Roy' }, {}).vendor_credit_role === 'Makeup by Swati Roy');
  ok('the standard render resolves it too', /const profile = withCreditLabel\(\{ \.\.\.STANDARD_PLACEHOLDERS/.test(src));
  // 19d · F-40.268
  ok('a signed contract\u2019s preview serves the sealed object under its own name', /state === 'signed'[\s\S]{0,700}sealed_path[\s\S]{0,400}createSignedUrl\(sig\.sealed_path, PREVIEW_URL_TTL\)/.test(door) && /sealed: true/.test(door));
  ok('and only a signed one — a draft still renders', /if \(st && st\.state === 'signed'\)/.test(door) && /const r = await renderContract\(supabase, req\.vendor\.id, req\.params\.contractId\);/.test(door));
}

console.log(`\n${pass}/${pass + fail} cells green.`);
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH ERROR', e); process.exit(1); });
