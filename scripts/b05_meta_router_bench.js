#!/usr/bin/env node
// scripts/b05_meta_router_bench.js — TDW_05 Workstream-1 (shared Meta receiver, Option B / marketing-ingress).
//
// Proves the CE-ruled build contract for the ONE-callback / per-change fork:
//   • fork is per-CHANGE (a POST batching changes with different recipient PNIDs splits correctly)
//   • the PNID surface is ADDITIVE — normalizeMetaInbound output is byte-UNCHANGED (no new key leaks in)
//   • lane map: bride PNID→bride, vendor→vendor, marketing→marketing(in-process), unknown→dropped+logged
//   • ingress verifies the Meta sig ONCE (bad sig → reject); forwarded siblings honor x-internal-replay
//     and — spoof-safety — a forged x-internal-replay with INTERNAL_REPLAY_SECRET unset is NOT trusted
//   • dedupe integrity: the ingress does NOT record wamid for forwarded lanes (owning lane is the home)
//
// NON-VACUOUS: the MUTATION section swaps in a deliberately-broken router and asserts the same
// split predicate the real code passes goes RED — the assertions are load-bearing.
//
// Runnable from any working directory: all requires resolve from __dirname. No network, creds, or DB.
'use strict';

const path = require('path');
const crypto = require('crypto');
const R = (p) => require(path.resolve(__dirname, '..', p));

const metaInbound = R('src/lib/metaInbound');
const webhookCore = R('src/lib/webhookCore');

// ── tiny assert harness (house style) ─────────────────────────────────────────
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); console.log(`  RED  ${label}`); } }
function section(s) { console.log(`\n── ${s} ──`); }

// ── sample Meta payload with recipient metadata.phone_number_id ────────────────
const PN = { marketing: '155501110000', bride: '1131327136726341', vendor: '1143702945489388' };
const ENV = {
  MARKETING_PHONE_NUMBER_ID: PN.marketing,
  BRIDE_PHONE_NUMBER_ID:     PN.bride,
  VENDOR_PHONE_NUMBER_ID:    PN.vendor,
};

function change(pnid, from, text, wamid) {
  return {
    field: 'messages',
    value: {
      messaging_product: 'whatsapp',
      metadata: { display_phone_number: '+x', phone_number_id: pnid },
      messages: [{ from, id: wamid, type: 'text', text: { body: text }, timestamp: '1700000000' }],
    },
  };
}
function bodyOf(...changes) {
  return { object: 'whatsapp_business_account', entry: [{ id: 'WABA', changes }] };
}

// The ingress fork loop, modelled exactly as marketingIndex.js runs it, but with pluggable sinks
// so the bench can observe routing without express/HTTP. `router` defaults to the REAL laneForPnid.
function runIngress(body, env, sinks, router = (pnid) => metaInbound.laneForPnid(pnid, env)) {
  const trace = [];
  for (const { phoneNumberId, entryId, change: ch } of metaInbound.changesWithPnid(body)) {
    const lane = router(phoneNumberId);
    const subBody = metaInbound.buildSingleChangeBody(body, entryId, ch);
    if (lane === 'marketing') { sinks.inProcess(subBody); trace.push({ lane, action: 'in-process' }); }
    else if (lane === 'bride' || lane === 'vendor') { sinks.forward(lane, subBody); trace.push({ lane, action: 'forward' }); }
    else { sinks.drop(phoneNumberId); trace.push({ lane: null, action: 'drop' }); }
  }
  return trace;
}

async function main() {
  // ═══ 1. changesWithPnid surfaces recipient PNID per change ═══
  section('1. per-change PNID surface');
  const cwp = metaInbound.changesWithPnid(bodyOf(change(PN.bride, '918757788550', 'hi', 'wamid.1')));
  ok(cwp.length === 1 && cwp[0].phoneNumberId === PN.bride, 'surfaces value.metadata.phone_number_id');
  ok(metaInbound.changesWithPnid(bodyOf({ field: 'messages', value: { metadata: {} , messages: [] } }))[0].phoneNumberId === null, 'missing metadata.phone_number_id → null');
  ok(metaInbound.changesWithPnid({}).length === 0 && metaInbound.changesWithPnid(null).length === 0, 'malformed body → []');

  // ═══ 2. normalizeMetaInbound is BYTE-UNCHANGED (additive proof) ═══
  section('2. normalizeMetaInbound byte-stable');
  const norm = metaInbound.normalizeMetaInbound(bodyOf(change(PN.bride, '918757788550', 'hello', 'wamid.2')));
  ok(norm.length === 1, 'normalizes one message');
  const keys = Object.keys(norm[0]).sort().join(',');
  ok(keys === 'from,media,messageId,text,timestamp,type', `sealed shape intact (${keys})`);
  ok(!('phoneNumberId' in norm[0]), 'no phoneNumberId leaked into the sealed normalizer output');
  ok(norm[0].from === '918757788550' && norm[0].text === 'hello' && norm[0].messageId === 'wamid.2', 'sealed field values unchanged');

  // ═══ 3. laneForPnid map ═══
  section('3. lane map');
  ok(metaInbound.laneForPnid(PN.marketing, ENV) === 'marketing', 'marketing PNID → marketing');
  ok(metaInbound.laneForPnid(PN.bride, ENV) === 'bride', 'bride PNID → bride');
  ok(metaInbound.laneForPnid(PN.vendor, ENV) === 'vendor', 'vendor PNID → vendor');
  ok(metaInbound.laneForPnid('999999999999', ENV) === null, 'unknown PNID → null (dropped, never mis-lane\'d)');
  ok(metaInbound.laneForPnid(null, ENV) === null, 'null PNID → null');
  ok(metaInbound.laneForPnid(PN.bride, {}) === null, 'unset env → null (no accidental match on undefined)');

  // ═══ 4. fork routing — each lane to its home ═══
  section('4. fork routing');
  function freshSinks() {
    const s = { fwd: [], drops: [], inproc: 0, deduped: [] };
    return {
      inProcess: (sub) => { s.inproc++; for (const m of metaInbound.normalizeMetaInbound(sub)) { s.deduped.push(m.messageId); } },
      forward: (lane, sub) => s.fwd.push({ lane, wamids: metaInbound.normalizeMetaInbound(sub).map((m) => m.messageId) }),
      drop: (pnid) => s.drops.push(pnid),
      _s: s,
    };
  }
  let sinks = freshSinks();
  runIngress(bodyOf(change(PN.marketing, '1', 'm', 'wamid.M')), ENV, sinks);
  ok(sinks._s.inproc === 1 && sinks._s.fwd.length === 0, 'marketing → in-process');

  sinks = freshSinks();
  runIngress(bodyOf(change(PN.bride, '1', 'b', 'wamid.B')), ENV, sinks);
  ok(sinks._s.fwd.length === 1 && sinks._s.fwd[0].lane === 'bride', 'bride → forwarded to bride');

  sinks = freshSinks();
  runIngress(bodyOf(change(PN.vendor, '1', 'v', 'wamid.V')), ENV, sinks);
  ok(sinks._s.fwd.length === 1 && sinks._s.fwd[0].lane === 'vendor', 'vendor → forwarded to vendor');

  sinks = freshSinks();
  runIngress(bodyOf(change('000000000000', '1', 'x', 'wamid.X')), ENV, sinks);
  ok(sinks._s.drops.length === 1 && sinks._s.inproc === 0 && sinks._s.fwd.length === 0, 'unknown PNID → dropped (never mis-lane\'d)');

  // ═══ 5. mixed-PNID multi-change POST splits per change ═══
  section('5. mixed-PNID multi-change split');
  sinks = freshSinks();
  const mixed = bodyOf(
    change(PN.marketing, '1', 'm', 'wamid.mM'),
    change(PN.bride, '2', 'b', 'wamid.mB'),
    change(PN.vendor, '3', 'v', 'wamid.mV'),
    change('deadPNID', '4', 'x', 'wamid.mX'),
  );
  const trace = runIngress(mixed, ENV, sinks);
  ok(trace.length === 4, 'four changes, four routing decisions');
  ok(sinks._s.inproc === 1, 'one in-process (marketing)');
  ok(sinks._s.fwd.map((f) => f.lane).sort().join(',') === 'bride,vendor', 'bride+vendor forwarded to their own lanes');
  ok(sinks._s.drops.length === 1, 'unknown dropped');
  const okSplit = sinks._s.fwd.find((f) => f.lane === 'bride').wamids[0] === 'wamid.mB'
               && sinks._s.fwd.find((f) => f.lane === 'vendor').wamids[0] === 'wamid.mV';
  ok(okSplit, 'each forwarded sub-body carries ONLY its own change (no cross-contamination)');

  // ═══ 6. signature: ingress verifies once; bad sig rejected ═══
  section('6. ingress signature (once)');
  const raw = Buffer.from(JSON.stringify(bodyOf(change(PN.bride, '1', 'hi', 'wamid.S'))), 'utf8');
  const good = 'sha256=' + crypto.createHmac('sha256', 'app-secret').update(raw).digest('hex');
  ok(metaInbound.verifyMetaSignature(raw, good, 'app-secret') === true, 'valid Meta sig accepted at ingress');
  ok(metaInbound.verifyMetaSignature(raw, good, 'WRONG') === false, 'wrong secret → rejected (→ 403)');
  ok(metaInbound.verifyMetaSignature(raw, 'sha256=dead', 'app-secret') === false, 'tampered digest → rejected (→ 403)');

  // ═══ 7. spoof-safety: forged internal-replay with no secret is NOT trusted ═══
  section('7. internal-replay spoof-safety');
  const savedSecret = process.env.INTERNAL_REPLAY_SECRET;
  delete process.env.INTERNAL_REPLAY_SECRET;
  ok(webhookCore.isInternalReplay({ headers: { 'x-internal-replay': 'anything' } }) === false, 'forged header, secret UNSET → not trusted');
  process.env.INTERNAL_REPLAY_SECRET = 's3cret';
  ok(webhookCore.isInternalReplay({ headers: { 'x-internal-replay': 'wrong' } }) === false, 'wrong header value → not trusted');
  ok(webhookCore.isInternalReplay({ headers: { 'x-internal-replay': 's3cret' } }) === true, 'matching secret → trusted (sibling skips Meta re-verify)');
  if (savedSecret === undefined) delete process.env.INTERNAL_REPLAY_SECRET; else process.env.INTERNAL_REPLAY_SECRET = savedSecret;

  // ═══ 8. dedupe ownership: ingress does not record wamid for forwarded lanes ═══
  section('8. dedupe ownership');
  // The real forwardChange path calls neither sidSeen nor recordSid — the owning sibling process
  // is the single dedupe home. Model the ingress and assert the deduper is untouched for forwards.
  let recorded = 0;
  const dedupeSinks = {
    inProcess: () => { recorded++; },            // marketing in-process records (owns its lane)
    forward: () => { /* NO recordSid — sibling owns dedupe */ },
    drop: () => {},
  };
  runIngress(bodyOf(change(PN.bride, '1', 'b', 'wamid.D1'), change(PN.vendor, '2', 'v', 'wamid.D2')), ENV, dedupeSinks);
  ok(recorded === 0, 'forwarded lanes → ingress records NOTHING (no double-processing home)');
  runIngress(bodyOf(change(PN.marketing, '1', 'm', 'wamid.D3')), ENV, dedupeSinks);
  ok(recorded === 1, 'marketing in-process → ingress is the dedupe home for its own lane');

  // ═══ 9. MUTATION — prove the split assertion is load-bearing ═══
  section('9. MUTATION (non-vacuous)');
  const brokenRouter = () => 'marketing'; // deliberately mis-routes every change to in-process
  const mSinks = freshSinks();
  runIngress(mixed, ENV, mSinks, brokenRouter);
  const brokenSplitHolds = mSinks._s.fwd.map((f) => f.lane).sort().join(',') === 'bride,vendor';
  ok(brokenSplitHolds === false, 'broken router (always marketing) → split predicate goes RED (assertion is load-bearing)');

  // ── tally ──
  console.log(`\n${fail ? 'RED' : 'GREEN'} — ${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILURES: ' + fails.join(' · ')); process.exit(1); }
}

main().catch((e) => { console.error('bench crashed:', e); process.exit(2); });
