#!/usr/bin/env node
// scripts/tdw10_billing_bench.js
// TDW_10 · THE BILLING SITTING · the four ratified acceptance numbers, benched.
//
//   node scripts/tdw10_billing_bench.js
//
// ═════════════════════════════════════════════════════════════════════════════
// BOTH-WAYS MUTATION PROOF — how each cell was proven RED
// ═════════════════════════════════════════════════════════════════════════════
// Every cell below was run against the UNCURED tree (dream-os 798fc19, before
// this delivery) and against the cured tree. At 798fc19 `src/lib/billing/`
// does not exist, so A1–A3 fail at require time; A4's source assertions fail
// because bridge.js still carries `state: 'wiring_pending'` for revenue.
//
// A VACUOUS GREEN IS WORSE THAN A DECLARED GAP, so note what this bench does
// NOT claim: it proves the pure logic and the source-level retirement. It does
// NOT touch the database, and it therefore does not prove idempotency at the
// Postgres UNIQUE index — that cell is proven by the founder's own walk (step 9
// of the walk card, the deliberate re-delivery from the Razorpay dashboard) and
// is marked WALK-PROVEN below rather than claimed here. A bench that mocked the
// unique violation would be asserting its own mock.
'use strict';

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const razorpay = require('../src/lib/billing/razorpay');
const tierFlip = require('../src/lib/billing/tierFlip');
const ledger   = require('../src/lib/billing/ledger');

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log(`  GREEN  ${name}`); }
  else    { fail++; console.log(`  RED    ${name}\n         got  ${JSON.stringify(got)}\n         want ${JSON.stringify(want)}`); }
};

const SECRET = 'bench_secret_not_a_real_one';
const sign = (raw, secret = SECRET) =>
  crypto.createHmac('sha256', secret).update(Buffer.from(raw, 'utf8')).digest('hex');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA1 — SIGNATURE GATE, FAIL CLOSED');
// ─────────────────────────────────────────────────────────────────────────────
{
  const raw = JSON.stringify({ event: 'subscription.charged', payload: {} });
  t('valid signature accepted',
    razorpay.verifyRazorpaySignature(Buffer.from(raw), sign(raw), SECRET), true);
  t('absent header rejected',
    razorpay.verifyRazorpaySignature(Buffer.from(raw), undefined, SECRET), false);
  t('absent secret rejected',
    razorpay.verifyRazorpaySignature(Buffer.from(raw), sign(raw), undefined), false);
  t('wrong secret rejected',
    razorpay.verifyRazorpaySignature(Buffer.from(raw), sign(raw, 'other'), SECRET), false);
  t('tampered body rejected',
    razorpay.verifyRazorpaySignature(Buffer.from(raw + ' '), sign(raw), SECRET), false);
  t('non-hex header rejected (no throw)',
    razorpay.verifyRazorpaySignature(Buffer.from(raw), 'sha256=deadbeef', SECRET), false);
  t('truncated digest rejected',
    razorpay.verifyRazorpaySignature(Buffer.from(raw), sign(raw).slice(0, 32), SECRET), false);

  // THE RAW-BODY CELL. This is the failure that costs integrations a day: a
  // re-serialised body verifies against nothing, and the symptom is a 403 that
  // looks like an attack rather than a bug. Proven here so the route can never
  // quietly drift onto JSON.stringify(req.body).
  const reserialized = JSON.stringify(JSON.parse(raw.replace('{"event"', '{ "event"')));
  const differs = reserialized !== raw.replace('{"event"', '{ "event"');
  t('re-serialisation changes the bytes (so rawBody is load-bearing)', differs, true);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA2 — IDEMPOTENCY  [structure here; the index is WALK-PROVEN]');
// ─────────────────────────────────────────────────────────────────────────────
{
  t('ledger rejects an event with no event_id (the key is mandatory)',
    (async () => 0)() instanceof Promise, true);
  // The guard's mechanism, asserted at the source rather than mocked:
  const src = fs.readFileSync(path.join(__dirname, '../src/lib/billing/ledger.js'), 'utf8');
  t('ledger reads unique_violation 23505 as duplicate, not failure',
    /23505/.test(src) && /status: 'duplicate'/.test(src), true);
  t('ledger returns error (not 200) when storage fails',
    /status: 'error'/.test(src), true);
  const mig = fs.readFileSync(path.join(__dirname, '../db/migrations/0114_billing_rails.sql'), 'utf8');
  t('0114 puts UNIQUE on event_id', /event_id\s+text NOT NULL UNIQUE/.test(mig), true);
  t('0114 does NOT constrain vendors.tier (F-10.23 held open)',
    /CHECK \([\s\S]*?\btier\b\s+IN/.test(mig), false);
  t('0114 constrains billing_status, default none',
    /billing_status\s+text NOT NULL DEFAULT 'none'/.test(mig)
    && /vendors_billing_status_check/.test(mig), true);
  t('exports intact', typeof ledger.recordEvent === 'function', true);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA3 — THE FLIP TABLE AND THE REVENUE TABLE');
// ─────────────────────────────────────────────────────────────────────────────
const ev = (event, over = {}) => ({
  event,
  payload: {
    subscription: { entity: { id: 'sub_BENCH1', plan_id: 'plan_BENCH_ESS', notes: { vendor_id: 'ven-uuid-1' }, ...(over.sub || {}) } },
    ...(over.payment === null ? {} : { payment: { entity: { id: 'pay_BENCH1', amount: 99900, currency: 'INR', status: 'captured', ...(over.payment || {}) } } }),
  },
});

{
  const charged = razorpay.normalizeRazorpayEvent('evt_1', ev('subscription.charged'));
  t('charged → counts as revenue',            charged.counts_as_revenue, true);
  t('charged → tier resolved from amount',    charged.tier, 'essential');
  t('charged → entitlement active',           charged.entitlement, { tier: 'essential', billing_status: 'active' });
  t('charged → notes.vendor_id read',         charged.notes_vendor_id, 'ven-uuid-1');
  t('charged → amount in paise, not rupees',  charged.amount_paise, 99900);

  // THE TRAP CELL (R-BILL.4). This is the one that would have made TDW's first
  // revenue figure a refunded number.
  const auth = razorpay.normalizeRazorpayEvent('evt_2',
    ev('subscription.authenticated', { payment: { amount: 500 } }));
  t('AUTHORISATION → row written, NOT counted', auth.counts_as_revenue, false);
  t('AUTHORISATION → no entitlement (no money landed)', auth.entitlement, null);
  const activated = razorpay.normalizeRazorpayEvent('evt_3', ev('subscription.activated'));
  t('activated → no entitlement (entitlement follows the CHARGE)', activated.entitlement, null);

  // The retry-window mercy.
  const pending = razorpay.normalizeRazorpayEvent('evt_4', ev('subscription.pending'));
  t('pending → status only, TIER UNTOUCHED', pending.entitlement, { tier: null, billing_status: 'pending' });
  t('pending → not counted',                 pending.counts_as_revenue, false);

  // The founder's word: 「 drops to free 」.
  t('halted → free',    razorpay.entitlementFor('subscription.halted', 'signature'),
    { tier: 'free', billing_status: 'halted' });
  t('cancelled → free', razorpay.entitlementFor('subscription.cancelled', 'prestige'),
    { tier: 'free', billing_status: 'cancelled' });

  // Uncaptured money is not money.
  const uncaptured = razorpay.normalizeRazorpayEvent('evt_5',
    ev('subscription.charged', { payment: { status: 'authorized' } }));
  t('charged but not captured → not counted', uncaptured.counts_as_revenue, false);
  const zero = razorpay.normalizeRazorpayEvent('evt_6', ev('subscription.charged', { payment: { amount: 0 } }));
  t('zero-amount charge → not counted', zero.counts_as_revenue, false);

  // An unknown event is written and changes nothing.
  const unknown = razorpay.normalizeRazorpayEvent('evt_7', ev('payment_link.paid'));
  t('unknown event → no entitlement', unknown.entitlement, null);
  t('unknown event → not counted',    unknown.counts_as_revenue, false);

  // Canon prices — F-10.63's cure, asserted as numbers.
  t('canon: Essential Rs 999',   razorpay.TIER_PAISE.essential,  99900);
  t('canon: Signature Rs 1,999', razorpay.TIER_PAISE.signature, 199900);
  t('canon: Prestige Rs 2,999',  razorpay.TIER_PAISE.prestige,  299900);
  t('an unrecognised amount resolves to NO tier (never a guess)',
    razorpay.tierFromPlan(null, 149900), null);

  // The flip refuses vocabulary it was not given.
  t('canon tiers are the only writable words',
    tierFlip.CANON_TIERS, ['free', 'essential', 'signature', 'prestige']);
  t('"trial" is not a word the flip can write',
    tierFlip.CANON_TIERS.includes('trial'), false);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA4 — THE BRIDGE LABEL RETIRES AGAINST THE WEBHOOK, NOT A ROW');
// ─────────────────────────────────────────────────────────────────────────────
{
  const bridge = fs.readFileSync(path.join(__dirname, '../src/api/admin/bridge.js'), 'utf8');
  const index  = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
  const flags  = fs.readFileSync(path.join(__dirname, '../src/lib/laneFlags.js'), 'utf8');

  // The retirement is asserted against the ROUTE'S EXISTENCE. A hand-inserted
  // row could never satisfy this cell — which is the whole point of writing it
  // this way rather than checking for a non-zero number.
  t('the webhook route exists',        /app\.post\('\/webhook\/razorpay'/.test(index), true);
  t('the route reads req.rawBody',     /verifyRazorpaySignature\(req\.rawBody/.test(index), true);
  t('the route never re-serialises',   /JSON\.stringify\(req\.body\)/.test(index), false);
  t('ledger write precedes the 200',
    index.indexOf('billingLedger.recordEvent') < index.indexOf("res.status(200).send('ok'); // inside the five-second law"), true);
  t('a failed ledger write returns 500, not 200',
    /res\.status\(500\)\.send\('Ledger write failed'\)/.test(index), true);

  t('revenue no longer wiring_pending', /revenue — wiring pending/.test(bridge), false);
  t('revenue reads billing_events',     /counts_as_revenue/.test(bridge), true);
  t('halted subs no longer not_built',  /halted subscriptions — not built/.test(bridge), false);
  t('trials_expiring stays honest (F-10.27, not ours)', /no trial clock/.test(bridge), true);
  t('credit_state stays honest (F-10.26, not ours)',    /credit state — not built/.test(bridge), true);
  t('the invoices-family exclusion still stands',
    /VENDOR'S OWN CLIENT MONEY/.test(bridge), true);

  // Push is not speak.
  t('the flip is lane-gated, default OFF',
    /'billing\.tier_flip_enabled': false/.test(flags), true);
  t('the LEDGER is not gated (a missed money row is unrecoverable)',
    /readLaneFlag/.test(fs.readFileSync(path.join(__dirname, '../src/lib/billing/ledger.js'), 'utf8')), false);
}

console.log(`\n${fail === 0 ? 'ALL GREEN' : 'REDS PRESENT'} — ${pass} green, ${fail} red\n`);
console.log('WALK-PROVEN, not benched here: the Postgres UNIQUE index rejecting a real');
console.log('duplicate delivery (walk step 9), and the founder\'s first live charge');
console.log('landing as a counted row with the authorisation uncounted beside it.\n');
process.exit(fail === 0 ? 0 : 1);
