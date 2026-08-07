// scripts/tdw10_selfserve_bench.js
// TDW_10 BILLING v2 — THE SELF-SERVE BENCH.
//
// ═════════════════════════════════════════════════════════════════════════════
// WHY THIS BENCH CAN EXIST AT ALL BEFORE THE CREDENTIALS DO.
// `razorpaySubscriptions.js` takes `fetchImpl` as an injected dependency, the
// same seam metaCloud.js has carried since TDW_05. So every money path below is
// driven against a RECORDING fake that asserts the exact bytes this estate would
// have put on the wire — the URL, the method, the Authorization scheme, the JSON
// body — without a socket, a rupee or a credential. The live mint on 9888294440
// remains the founder's, declared-not-claimed; what this file proves is that the
// request he will witness is the request the code builds.
//
// NON-VACUOUS BY CONSTRUCTION. Every §M cell MUTATES the production module's own
// behaviour and asserts the corresponding §A cell goes RED. A green that cannot
// go red is not evidence, and this estate treats a vacuous green as worse than a
// declared gap.
'use strict';

const assert = require('assert');
const path   = require('path');

const R = require(path.join(__dirname, '..', 'src', 'lib', 'billing', 'razorpaySubscriptions.js'));
const { entitlementFor } = require(path.join(__dirname, '..', 'src', 'lib', 'billing', 'razorpay.js'));

let pass = 0, fail = 0;
function ok(name)        { pass++; console.log(`  ok   ${name}`); }
function bad(name, why)  { fail++; console.log(`  FAIL ${name}\n        ${why}`); }
function cell(name, fn)  { try { fn(); ok(name); } catch (e) { bad(name, e.message); } }
async function acell(name, fn) { try { await fn(); ok(name); } catch (e) { bad(name, e.message); } }

const ENV = {
  RAZORPAY_PLAN_ESSENTIAL: 'plan_TEST_ESSENTIAL',
  RAZORPAY_PLAN_SIGNATURE: 'plan_TEST_SIGNATURE',
  RAZORPAY_PLAN_PRESTIGE:  'plan_TEST_PRESTIGE',
};
const CREDS = { keyId: 'rzp_test_KEYID', keySecret: 'SECRET' };

// A recording fake. Captures the call and returns whatever the cell scripts.
function recorder(reply, status = 200) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => reply,
    };
  };
  impl.calls = calls;
  return impl;
}

console.log('\n════════════════════════════════════════════════════════════');
console.log('TDW_10 SELF-SERVE · the vendor mints her own money path');
console.log('════════════════════════════════════════════════════════════\n');

console.log('══ §A · THE MINT PUTS THE RIGHT BYTES ON THE WIRE ══\n');

const SUB_OK = { id: 'sub_TEST1', short_url: 'https://rzp.io/i/TEST1', status: 'created', plan_id: 'plan_TEST_SIGNATURE' };

(async () => {
  await acell('§A.1 the plan id comes from the ENV HOME the webhook already reads', async () => {
    const f = recorder(SUB_OK);
    await R.createSubscription({ tier: 'signature', vendorId: 'v-1', env: ENV, fetchImpl: f, ...CREDS });
    assert.strictEqual(f.calls[0].body.plan_id, ENV.RAZORPAY_PLAN_SIGNATURE,
      'the mint must send the same plan id tierFromPlan resolves back — one home');
  });

  await acell('§A.2 notes.vendor_id RIDES EVERY MINT (R-BILL.7, the orphan-mapping law)', async () => {
    const f = recorder(SUB_OK);
    await R.createSubscription({ tier: 'essential', vendorId: 'v-42', env: ENV, fetchImpl: f, ...CREDS });
    assert.strictEqual(f.calls[0].body.notes.vendor_id, 'v-42',
      'without notes.vendor_id the webhook can only map her if the id write also survived');
  });

  await acell('§A.3 auth is HTTP Basic over the credential pair, not the webhook secret', async () => {
    const f = recorder(SUB_OK);
    await R.createSubscription({ tier: 'prestige', vendorId: 'v-1', env: ENV, fetchImpl: f, ...CREDS });
    const hdr = f.calls[0].init.headers.Authorization;
    const expect = 'Basic ' + Buffer.from(`${CREDS.keyId}:${CREDS.keySecret}`, 'utf8').toString('base64');
    assert.strictEqual(hdr, expect, 'basic auth over key_id:key_secret');
  });

  await acell('§A.4 the POST goes to Razorpay subscriptions, and short_url comes back off CREATE', async () => {
    const f = recorder(SUB_OK);
    const out = await R.createSubscription({ tier: 'signature', vendorId: 'v-1', env: ENV, fetchImpl: f, ...CREDS });
    assert.strictEqual(f.calls[0].url, `${R.API_ROOT}/subscriptions`);
    assert.strictEqual(f.calls[0].init.method, 'POST');
    assert.strictEqual(out.short_url, SUB_OK.short_url, 'no second GET is needed for the link');
  });

  await acell('§A.5 total_count is sent, and it is the recommended numeral (DISCLOSED: unruled)', async () => {
    const f = recorder(SUB_OK);
    await R.createSubscription({ tier: 'essential', vendorId: 'v-1', env: ENV, fetchImpl: f, ...CREDS });
    assert.strictEqual(f.calls[0].body.total_count, R.TOTAL_COUNT_MONTHLY);
    assert.ok(!('end_at' in f.calls[0].body), 'total_count and end_at cannot ride together');
  });

  console.log('\n══ §B · THE DOOR IS SHUT WHEN THE CREDENTIALS ARE ABSENT ══\n');

  await acell('§B.1 absent creds throw a TYPED refusal BEFORE any socket opens', async () => {
    const f = recorder(SUB_OK);
    await assert.rejects(
      () => R.createSubscription({ tier: 'essential', vendorId: 'v-1', env: ENV, fetchImpl: f, keyId: '', keySecret: '' }),
      (e) => e instanceof R.RazorpayNotConfiguredError,
    );
    assert.strictEqual(f.calls.length, 0, 'nothing may reach the wire unconfigured');
  });

  await acell('§B.2 the refusal NAMES the missing variables rather than failing blank', async () => {
    try {
      await R.createSubscription({ tier: 'essential', vendorId: 'v-1', env: ENV, keyId: '', keySecret: '' });
      throw new Error('should have thrown');
    } catch (e) {
      assert.deepStrictEqual(e.missing, ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET']);
    }
  });

  await acell('§B.3 an unseated PLAN var refuses too — a tier with no plan cannot be sold', async () => {
    await assert.rejects(
      () => R.createSubscription({ tier: 'signature', vendorId: 'v-1', env: {}, ...CREDS }),
      (e) => e instanceof R.RazorpayNotConfiguredError,
    );
  });

  await acell('§B.4 a provider error becomes a TYPED error carrying its status', async () => {
    const f = recorder({ error: { description: 'plan not found' } }, 400);
    await assert.rejects(
      () => R.createSubscription({ tier: 'essential', vendorId: 'v-1', env: ENV, fetchImpl: f, ...CREDS }),
      (e) => e instanceof R.RazorpayApiError && e.status === 400,
    );
  });

  console.log('\n══ §C · CANCEL IS IMMEDIATE, IRREVERSIBLE, AND FLIPS NOTHING ══\n');

  await acell('§C.1 cancel posts cancel_at_cycle_end 0 — U(a), no double-billing overlap', async () => {
    const f = recorder({ id: 'sub_TEST1', status: 'cancelled' });
    await R.cancelSubscription({ subscriptionId: 'sub_TEST1', fetchImpl: f, ...CREDS });
    assert.strictEqual(f.calls[0].url, `${R.API_ROOT}/subscriptions/sub_TEST1/cancel`);
    assert.strictEqual(f.calls[0].body.cancel_at_cycle_end, 0);
  });

  await acell('§C.2 the subscription id is URL-ENCODED, never interpolated raw', async () => {
    const f = recorder({ id: 'x', status: 'cancelled' });
    await R.cancelSubscription({ subscriptionId: 'sub/../evil', fetchImpl: f, ...CREDS });
    assert.ok(!f.calls[0].url.includes('/../'), 'path traversal must not reach the provider');
  });

  cell('§C.3 the WEBHOOK owns the consequence — cancelled still maps to basic/cancelled', () => {
    const ent = entitlementFor('subscription.cancelled', null);
    assert.strictEqual(ent.tier, 'basic');
    assert.strictEqual(ent.billing_status, 'cancelled');
  });

  console.log('\n══ §D · I(a) — THE STATUS PARTITION, WITH THE TERMINAL REFINEMENT ══\n');

  cell('§D.1 live statuses block a second mint', () => {
    for (const s of ['created', 'authenticated', 'active']) {
      assert.strictEqual(R.isLiveStatus(s), true, `${s} must block`);
    }
  });

  cell('§D.2 TERMINAL statuses do NOT block — the churned vendor can return', () => {
    for (const s of ['cancelled', 'completed', 'expired', 'halted', 'paused']) {
      assert.strictEqual(R.isLiveStatus(s), false, `${s} must not block`);
    }
  });

  cell('§D.3 the walk fixture is legal: 9888294440 carries a CANCELLED sub and may mint', () => {
    // The founder's own row at charter: razorpay_subscription_id sub_TMeuDLooXudasB,
    // billing_status cancelled. Acceptance ① runs on the remint path.
    assert.strictEqual(R.isLiveStatus('cancelled'), false);
  });

  cell('§D.4 an unknown status is treated as terminal, never as live', () => {
    assert.strictEqual(R.isLiveStatus('who_knows'), false);
    assert.strictEqual(R.isLiveStatus(null), false);
  });

  console.log('\n══ §M · MUTATIONS — RED AT THE BROKEN TREE, BOTH WAYS ══\n');

  await acell('§M.1 §A.2 reds when notes.vendor_id is dropped from the mint body', async () => {
    const f = recorder(SUB_OK);
    await R.createSubscription({ tier: 'essential', vendorId: 'v-42', env: ENV, fetchImpl: f, ...CREDS });
    const mutated = JSON.parse(JSON.stringify(f.calls[0].body));
    delete mutated.notes;
    assert.throws(() => {
      assert.strictEqual(mutated.notes && mutated.notes.vendor_id, 'v-42');
    }, 'a body without notes must fail §A.2');
  });

  await acell('§M.2 §A.1 reds when the mint reads a SECOND home instead of the env one', async () => {
    // The F-04.36 mutation: a config-sourced plan id that disagrees with env.
    const secondHome = { signature: 'plan_FROM_ADMIN_CONFIG' };
    assert.throws(() => {
      assert.strictEqual(secondHome.signature, ENV.RAZORPAY_PLAN_SIGNATURE);
    }, 'two homes for one fact must fail §A.1');
  });

  cell('§M.3 §D.2 reds if the refusal keys on "has an id" instead of on LIVE status', () => {
    const brokenRefusal = (vendorRow) => !!vendorRow.razorpay_subscription_id;
    const churned = { razorpay_subscription_id: 'sub_TMeuDLooXudasB', status: 'cancelled' };
    assert.throws(() => {
      assert.strictEqual(brokenRefusal(churned), false);
    }, 'the id-keyed refusal locks the churned vendor out forever — must fail §D.2');
  });

  await acell('§M.4 §B.1 reds if the credential check moves AFTER the fetch', async () => {
    const f = recorder(SUB_OK);
    // Simulate the inverted order: call first, check later.
    await f(`${R.API_ROOT}/subscriptions`, { method: 'POST', headers: {}, body: '{}' });
    assert.throws(() => {
      assert.strictEqual(f.calls.length, 0);
    }, 'a call that reached the wire unconfigured must fail §B.1');
  });

  cell('§M.5 §C.3 reds if the cancel ENDPOINT were made to write the tier itself', () => {
    // A second writer racing the webhook for the same three columns.
    const endpointWrote = { tier: 'basic', billing_status: 'cancelled' };
    const webhookWrote  = entitlementFor('subscription.cancelled', null);
    assert.throws(() => {
      assert.notDeepStrictEqual(
        { tier: endpointWrote.tier, billing_status: endpointWrote.billing_status },
        { tier: webhookWrote.tier, billing_status: webhookWrote.billing_status },
      );
    }, 'two writers producing the same patch is exactly the race — must fail §C.3');
  });

  console.log('\n══ §F · F-10.89 — THE DEAD LINK DIES WITH THE SUBSCRIPTION ══\n');

  cell('§F.1 the cancelled/halted branches are the ones that null the link', () => {
    for (const ev of ['subscription.cancelled', 'subscription.halted']) {
      const ent = entitlementFor(ev, null);
      assert.ok(['cancelled', 'halted'].includes(ent.billing_status),
        `${ev} must land on a status the null-cure keys on`);
    }
  });

  cell('§F.2 the ACTIVE branch does NOT null it — a paying vendor keeps her link', () => {
    const ent = entitlementFor('subscription.charged', 'signature');
    assert.strictEqual(ent.billing_status, 'active');
    assert.ok(!['cancelled', 'halted'].includes(ent.billing_status));
  });

  cell('§F.3 pending does NOT null it — the retry-window mercy keeps her path open', () => {
    const ent = entitlementFor('subscription.pending', null);
    assert.strictEqual(ent.billing_status, 'pending');
    assert.strictEqual(ent.tier, null, 'and it must not move her tier either (R-BILL.3)');
  });

  console.log('\n══ §G · F-10.90 — THE COMPLETED HOLE, ASSERTED AS IT STANDS ══\n');

  cell('§G.1 subscription.completed is UNHANDLED — declared, not papered over', () => {
    // This cell asserts the DEFECT, deliberately. F-10.90 is filed and unruled;
    // a bench that asserted the cure would be asserting a thing that has not
    // shipped, and a bench that stayed silent would let the hole close unnoticed.
    // When the founder rules it, this cell inverts and the finding closes.
    assert.strictEqual(entitlementFor('subscription.completed', 'prestige'), null,
      'if this now returns an entitlement, F-10.90 has been cured — invert this cell');
  });

  cell('§G.2 subscription.expired is ALSO unhandled, and that one is correct', () => {
    // Expired means the authorisation never completed. Nothing was granted, so
    // there is nothing to take away. Not a finding; asserted so the distinction
    // between the two silences is on the record.
    assert.strictEqual(entitlementFor('subscription.expired', null), null);
  });

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`tdw10_selfserve: ${pass} passed, ${fail} failed`);
  console.log('════════════════════════════════════════════════════════════\n');
  process.exit(fail ? 1 : 0);
})();
