'use strict';
// scripts/b294_f44416_partnerplan_guard_bench.js · CE-47 · F-44.416 · rung b294 · THE PARTNER PLAN IS NEVER A VENDOR TIER.
// Live money: TDW's own subscription webhook. The proof drives THE ROUTE'S REAL BYTES: the /webhook/razorpay handler is
// lifted from src/index.js (base and tree alike) and run against fakes that record every table operation, with the real
// tierFlip.js and ledger.js. BASE is git HEAD (before block 3 commits, HEAD is the base) unless B294_BASE names another.
// §1 THE TABLE: every vendor event that exists today x every plan route x every way a vendor resolves. Base against tree:
//    the normalised event, every table operation, the vendor rows after, and the log lines are IDENTICAL.
// §2 the partnerPlan check: by plan id alone, by notes.partner_id alone; recognised FIRST (tierFromPlan never runs: the
//    vendor plan variables are never read); no tier, no entitlement, no notes vendor, for every event.
// §3 Rs 2,999 on an unrecognised plan: with a partner note never Prestige; without one, exactly as today, and no vendor
//    resolves, so nothing flips.
// §4 the chair's cell: a partnerPlan event whose notes carry a REAL vendor's id AND whose subscription id is already linked
//    to a vendor changes nothing on any vendor, by either resolve route; no vendor row is read or written.
// §5 what the ledger row holds for a partnerPlan event. §6 the files that must not move, by sha, base against tree; in
//    src/index.js ONLY the /webhook/razorpay block is read (6.2), so a line added outside it never reddens this bench (6.2a).
// --mutate: each new behaviour removed in turn must redden its cell; each file restored byte for byte (e-277: the run
// STOPS first if an anchor is missing). No clock, no network, no file written outside the mutations. THE EXIT IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const Module = require('module');
const ROOT = path.join(__dirname, '..'); const R = (p) => path.join(ROOT, p);
const BASE = process.env.B294_BASE || 'HEAD';
let pass = 0; let fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 400) + ']'}`); } };
const sec = (t) => console.log(`\n§${t}`);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const RZ = 'src/lib/billing/razorpay.js'; const IDX = 'src/index.js';
const MUTS = [
  { file: RZ, anchor: "  const byPlan = !!(planId && typeof sub.plan_id === 'string' && sub.plan_id === planId);\n", to: '  const byPlan = false;\n', reddens: /FAIL  2\.2/ },
  { file: RZ, anchor: "  const partnerId = typeof notes.partner_id === 'string' && notes.partner_id.trim() ? notes.partner_id.trim() : null;\n", to: '  const partnerId = null;\n', reddens: /FAIL  2\.3/ },
  { file: RZ, anchor: '  const tier = partnerPlan ? null : tierFromPlan(sub && sub.plan_id, amountPaise);\n', to: '  const tier0 = tierFromPlan(sub && sub.plan_id, amountPaise); const tier = partnerPlan ? null : tier0;\n', reddens: /FAIL  2\.5/ },
  { file: RZ, anchor: '  prestige:  299900,\n', to: '  prestige:  299901,\n', reddens: /FAIL  1\.2/ },
  { file: IDX, anchor: '    vendorId = normalized.partner_plan ? null : await tierFlip.resolveVendor(supabase, {\n', to: '    vendorId = await tierFlip.resolveVendor(supabase, {\n', reddens: /FAIL  4\.2/ },
];
if (!process.env.B294_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(m.file), 'utf8').includes(m.anchor)) { console.log(`STOP — a mutation anchor is missing from ${m.file}; restore it with git checkout before running b294.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const orig = fs.readFileSync(R(m.file), 'utf8'); let red = false; let out = '';
    fs.writeFileSync(R(m.file), orig.replace(m.anchor, m.to));
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B294_MUT_CHILD: '1' } }); out = r.stdout; red = r.status !== 0 && m.reddens.test(r.stdout); }
    finally { fs.writeFileSync(R(m.file), orig); }
    ok(red, `M${i + 1} ${m.file} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`, red ? undefined : (out.match(/FAIL .*/g) || ['no red']).join(' | '));
    ok(sha(fs.readFileSync(R(m.file), 'utf8')) === sha(orig), `M${i + 1} ${m.file} restored byte for byte`);
  }
  console.log(`\nb294 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

// ── the environment the table runs under ────────────────────────────────────
const SECRET = 'whsec_bench';
Object.assign(process.env, { RAZORPAY_WEBHOOK_SECRET: SECRET, RAZORPAY_PLAN_ESSENTIAL: 'plan_ESS', RAZORPAY_PLAN_SIGNATURE: 'plan_SIG',
  RAZORPAY_PLAN_PRESTIGE: 'plan_PRE', RAZORPAY_PLAN_PARTNERPLAN: 'plan_PTN' });
let vendorPlanReads = 0;
const ENV0 = process.env;
process.env = new Proxy(ENV0, { get(t, k) { if (/^RAZORPAY_PLAN_(ESSENTIAL|SIGNATURE|PRESTIGE)$/.test(String(k))) vendorPlanReads++; return t[k]; } });

// ── base and tree, side by side ─────────────────────────────────────────────
const git = (args) => cp.spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const baseText = (p) => { const r = git(['show', `${BASE}:${p}`]); if (r.status !== 0) throw new Error(`git show ${BASE}:${p} failed: ${r.stderr}`); return r.stdout; };
function fromText(src, file) { const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(src, file); return m.exports; }
const rzTree = require(R(RZ));
const rzBase = fromText(baseText(RZ), R(RZ) + '.base.js');
const tierFlip = require(R('src/lib/billing/tierFlip'));
const ledger = require(R('src/lib/billing/ledger'));
const laneFlags = require(R('src/lib/laneFlags'));   // its cache is cleared before every drive, so base and tree read alike
function routeOf(indexSrc) {
  const start = indexSrc.indexOf("app.post('/webhook/razorpay', async (req, res) => {");
  const end = indexSrc.indexOf('\n});\n', start);
  if (start < 0 || end < 0) throw new Error('the /webhook/razorpay block was not found');
  return indexSrc.slice(start, end + 4);
}
const routeTree = routeOf(fs.readFileSync(R(IDX), 'utf8'));
const routeBase = routeOf(baseText(IDX));

// a fake supabase that records EVERY operation and keeps the vendor rows it was given
function fakeDb(vendors) {
  const ops = []; const V = vendors.map((v) => ({ ...v }));
  const match = (r, f) => f.every(([c, v]) => r[c] === v);
  return { ops, V, from(t) {
    const q = { t, op: 'select', cols: null, filters: [], patch: null, row: null };
    const api = {
      select(c) { if (q.op === 'select') q.cols = c; return api; },
      eq(c, v) { q.filters.push([c, v]);
        if (q.op === 'update') { ops.push({ t, op: 'update', patch: q.patch, filters: q.filters.slice() }); if (t === 'vendors') V.filter((r) => match(r, q.filters)).forEach((r) => Object.assign(r, q.patch)); return Promise.resolve({ error: null }); }
        return api; },
      maybeSingle() { ops.push({ t, op: 'select', cols: q.cols, filters: q.filters.slice() });
        if (t === 'admin_config') return Promise.resolve({ data: match({ key: 'billing.tier_flip_enabled' }, q.filters) ? { value: 'true' } : null, error: null });   // the flip lane ON
        const r = t === 'vendors' ? V.find((x) => match(x, q.filters)) : null; return Promise.resolve({ data: r ? { id: r.id } : null, error: null }); },
      update(p) { q.op = 'update'; q.patch = p; return api; },
      insert(row) { q.op = 'insert'; q.row = row; ops.push({ t, op: 'insert', row }); return api; },
      single() { return Promise.resolve({ data: { id: 1, ...q.row }, error: null }); },
    };
    return api;
  } };
}
const domainFake = { calls: [], async onPaid(_sb, a) { domainFake.calls.push(a); return { ok: true }; } };
async function drive(rz, routeSrc, body, vendors) {
  const db = fakeDb(vendors); let handler = null; const logs = [];
  const app = { post(p, fn) { if (p === '/webhook/razorpay') handler = fn; }, locals: {} };
  const con = { log: (...a) => logs.push('log ' + a.join(' ')), warn: (...a) => logs.push('warn ' + a.join(' ')), error: (...a) => logs.push('error ' + a.join(' ')) };
  new Function('app', 'razorpay', 'tierFlip', 'billingLedger', 'supabase', 'domainService', 'console', routeSrc)(app, rz, tierFlip, ledger, db, domainFake, con);
  laneFlags._resetLaneFlagCache();
  const real = { log: console.log, warn: console.warn, error: console.error };   // tierFlip and ledger log to the global console
  Object.assign(console, con);
  const raw = Buffer.from(JSON.stringify(body));
  const req = { rawBody: raw, body: JSON.parse(raw), headers: { 'x-razorpay-signature': crypto.createHmac('sha256', SECRET).update(raw).digest('hex'), 'x-razorpay-event-id': 'evt_1' } };
  const res = { code: null, status(c) { this.code = c; return this; }, send() { return this; } };
  try { await handler(req, res); } finally { Object.assign(console, real); }
  return { code: res.code, ops: db.ops, vendorsAfter: db.V, logs };
}

// ── the fixtures ────────────────────────────────────────────────────────────
const V1 = { id: 'v-1', tier: 'basic', billing_status: 'none', razorpay_subscription_id: null };
const V2 = (linked) => ({ id: 'v-2', tier: 'signature', billing_status: 'active', razorpay_subscription_id: linked ? 'sub_1' : 'sub_other' });
const EVENTS = ['subscription.charged', 'subscription.halted', 'subscription.cancelled', 'subscription.completed', 'subscription.pending',
  'subscription.authenticated', 'subscription.activated', 'payment_link.paid', 'refund.processed'];
const SUB_EVENTS = EVENTS.filter((e) => e.startsWith('subscription.'));
const PLANS = [
  { name: 'essential by plan id', plan_id: 'plan_ESS', amount: 99900 }, { name: 'signature by plan id', plan_id: 'plan_SIG', amount: 199900 },
  { name: 'prestige by plan id', plan_id: 'plan_PRE', amount: 299900 }, { name: 'essential by amount', amount: 99900 },
  { name: 'signature by amount', amount: 199900 }, { name: 'prestige by amount', amount: 299900 },
  { name: 'unknown plan at Rs 2,999', plan_id: 'plan_OLD', amount: 299900 }, { name: 'unknown plan, unknown amount', plan_id: 'plan_OLD', amount: 12345 },
  { name: 'no plan id, no payment' },
];
const VSTATES = ['none', 'notes', 'linked', 'notes+linked'];
function bodyFor(event, plan, vstate, extraNotes) {
  const pay = plan.amount === undefined ? null : { id: 'pay_1', amount: plan.amount, currency: 'INR', status: 'captured' };
  if (event === 'payment_link.paid') return { event, payload: { payment_link: { entity: { id: 'plink_1', notes: { tdw_kind: 'other' } } }, ...(pay ? { payment: { entity: pay } } : {}) } };
  const notes = { ...(vstate.includes('notes') ? { vendor_id: 'v-1' } : {}), ...(extraNotes || {}) };
  const sub = { id: 'sub_1', ...(plan.plan_id !== undefined ? { plan_id: plan.plan_id } : {}), notes };
  return { event, payload: { subscription: { entity: sub }, ...(pay ? { payment: { entity: pay } } : {}) } };
}
const vendorsFor = (vstate) => [V1, V2(vstate.includes('linked'))];
const J = (x) => JSON.stringify(x);

(async () => {
  sec('1  THE TABLE: every vendor event today, base against tree');
  let n = 0; const normDiff = []; const routeDiff = [];
  for (const e of EVENTS) for (const p of PLANS) for (const v of VSTATES) {
    n++; const b = bodyFor(e, p, v);
    const nb = rzBase.normalizeRazorpayEvent('evt_1', b); const nt = rzTree.normalizeRazorpayEvent('evt_1', b);
    if (J(nb) !== J(nt)) normDiff.push(`${e} | ${p.name} | ${v}`);
    const rb = await drive(rzBase, routeBase, b, vendorsFor(v)); const rt = await drive(rzTree, routeTree, b, vendorsFor(v));
    if (J(rb) !== J(rt)) routeDiff.push(`${e} | ${p.name} | ${v}: ${J(rb.ops)} vs ${J(rt.ops)}`);
  }
  ok(n === EVENTS.length * PLANS.length * VSTATES.length && n === 324, `1.0 the table has ${n} cases (9 events x 9 plan routes x 4 vendor states)`);
  ok(normDiff.length === 0, '1.1 normalizeRazorpayEvent: identical output in every case', normDiff.slice(0, 5).join(' || '));
  ok(routeDiff.length === 0, '1.2 the route: identical status, table operations (every ledger row byte for byte), vendor rows after, and log lines', routeDiff.slice(0, 3).join(' || '));
  const prestigeCase = await drive(rzTree, routeTree, bodyFor('subscription.charged', PLANS[5], 'notes'), vendorsFor('notes'));
  ok(prestigeCase.vendorsAfter.find((x) => x.id === 'v-1').tier === 'prestige', '1.3 control: a vendor\'s Rs 2,999 charge still makes her Prestige (the table is not blind)');

  sec('2  the partnerPlan check: recognised FIRST');
  const P = rzTree.partnerPlanOf;
  ok(J(P({ plan_id: 'plan_PTN', notes: {} })) === J({ partner_id: null }), '2.1 partnerPlanOf: the plan id alone');
  const PCASES = [{ name: 'the partnerPlan id', plan_id: 'plan_PTN', amount: 299900 }, { name: 'the partnerPlan id, no payment', plan_id: 'plan_PTN' }];
  const NCASES = [{ name: 'notes.partner_id with no plan id', amount: 299900 }, { name: 'notes.partner_id beside the PRESTIGE plan id', plan_id: 'plan_PRE', amount: 299900 },
    { name: 'notes.partner_id beside the ESSENTIAL plan id', plan_id: 'plan_ESS', amount: 99900 }, { name: 'notes.partner_id on an unknown plan', plan_id: 'plan_OLD', amount: 299900 }];
  const isPartner = (o) => o.tier === null && o.entitlement === null && o.notes_vendor_id === null && !!o.partner_plan;
  const bad2 = []; const bad3 = [];
  for (const e of SUB_EVENTS) for (const v of VSTATES) {
    for (const p of PCASES) { const o = rzTree.normalizeRazorpayEvent('evt_1', bodyFor(e, p, v)); if (!isPartner(o)) bad2.push(`${e} | ${p.name} | ${v}: ${J({ tier: o.tier, ent: o.entitlement })}`); }
    for (const p of NCASES) { const o = rzTree.normalizeRazorpayEvent('evt_1', bodyFor(e, p, v, { partner_id: 'org-7' })); if (!isPartner(o) || o.partner_plan.partner_id !== 'org-7') bad3.push(`${e} | ${p.name} | ${v}: ${J({ tier: o.tier, ent: o.entitlement })}`); }
  }
  ok(bad2.length === 0, '2.2 by the partnerPlan id ALONE: every subscription event gets no tier, no entitlement, no notes vendor', bad2.slice(0, 3).join(' || '));
  ok(bad3.length === 0, '2.3 by notes.partner_id ALONE, even beside a vendor tier\'s plan id or notes.vendor_id: the same', bad3.slice(0, 3).join(' || '));
  ok(P({ plan_id: 'plan_OLD', notes: { partner_id: '   ' } }) === null && P({ plan_id: 'plan_OLD', notes: { partner_id: 7 } }) === null && P(null) === null && P({ notes: {} }) === null,
    '2.4 a blank or non-text partner_id, or neither sign: not a partnerPlan event');
  vendorPlanReads = 0;
  for (const e of SUB_EVENTS) { rzTree.normalizeRazorpayEvent('evt_1', bodyFor(e, PCASES[0], 'none')); rzTree.normalizeRazorpayEvent('evt_1', bodyFor(e, NCASES[1], 'none', { partner_id: 'org-7' })); }
  const partnerReads = vendorPlanReads; vendorPlanReads = 0;
  rzTree.normalizeRazorpayEvent('evt_1', bodyFor('subscription.charged', PLANS[6], 'none'));
  ok(partnerReads === 0 && vendorPlanReads > 0, `2.5 FIRST: for a partnerPlan event tierFromPlan never runs (vendor plan variables read ${partnerReads} times; a vendor event reads them ${vendorPlanReads})`);
  const envGone = process.env.RAZORPAY_PLAN_PARTNERPLAN; delete ENV0.RAZORPAY_PLAN_PARTNERPLAN;
  const unsetCase = rzTree.normalizeRazorpayEvent('evt_1', bodyFor('subscription.charged', { plan_id: 'plan_PTN', amount: 299900 }, 'none'));
  ENV0.RAZORPAY_PLAN_PARTNERPLAN = envGone;
  ok(unsetCase.tier === 'prestige' && !unsetCase.partner_plan && rzTree.normalizeRazorpayEvent('evt_1', bodyFor('subscription.charged', { plan_id: 'plan_PTN', amount: 299900 }, 'none', { partner_id: 'org-7' })).tier === null,
    '2.6 with RAZORPAY_PLAN_PARTNERPLAN unset, the plan id alone is not recognised (today\'s reading); the note still is. A2-2 plants both');

  sec('3  Rs 2,999 on an unrecognised plan');
  const withNote = rzTree.normalizeRazorpayEvent('evt_1', bodyFor('subscription.charged', PLANS[6], 'none', { partner_id: 'org-7' }));
  ok(withNote.tier === null && withNote.entitlement === null, '3.1 WITH a partner note: never Prestige');
  const noNote = rzTree.normalizeRazorpayEvent('evt_1', bodyFor('subscription.charged', PLANS[6], 'none'));
  ok(noNote.tier === 'prestige' && J(noNote) === J(rzBase.normalizeRazorpayEvent('evt_1', bodyFor('subscription.charged', PLANS[6], 'none'))), '3.2 WITHOUT a note: exactly as today (the amount fallback reads prestige)');
  const r33 = await drive(rzTree, routeTree, bodyFor('subscription.charged', PLANS[6], 'none'), vendorsFor('none'));
  const ins33 = r33.ops.find((o) => o.op === 'insert');
  ok(!r33.ops.some((o) => o.t === 'vendors' && o.op === 'update') && J(r33.vendorsAfter) === J(vendorsFor('none')) && ins33 && ins33.row.vendor_id === null,
    '3.3 ...and it is safe: no vendor resolves (no notes.vendor_id, no linked subscription), so the row is an orphan and nothing flips', J(r33.ops));

  sec('4  the chair\'s cell: a REAL vendor in the notes AND a vendor already linked to the subscription');
  const bad4 = []; const touched = [];
  for (const e of SUB_EVENTS) for (const p of [PCASES[0], NCASES[1]]) {
    const extra = p === NCASES[1] ? { partner_id: 'org-7' } : undefined;
    const r = await drive(rzTree, routeTree, bodyFor(e, p, 'notes+linked', extra), vendorsFor('notes+linked'));
    if (J(r.vendorsAfter) !== J(vendorsFor('notes+linked'))) bad4.push(`${e} | ${p.name}: ${J(r.vendorsAfter)}`);
    const vops = r.ops.filter((o) => o.t === 'vendors');
    if (vops.length) touched.push(`${e} | ${p.name}: ${J(vops)}`);
  }
  ok(bad4.length === 0, '4.1 neither vendor changes in any value (tier, status, subscription link), by either resolve route', bad4.slice(0, 2).join(' || '));
  ok(touched.length === 0, '4.2 NO vendor row is read or written: not by the subscription id, not by the notes', touched.slice(0, 2).join(' || '));

  sec('5  what the ledger row holds for a partnerPlan event');
  const r5 = await drive(rzTree, routeTree, bodyFor('subscription.charged', PCASES[0], 'notes+linked', { partner_id: 'org-7' }), vendorsFor('notes+linked'));
  const rows5 = r5.ops.filter((o) => o.t === 'billing_events' && o.op === 'insert');
  const row5 = rows5[0] && rows5[0].row;
  ok(rows5.length === 1 && r5.code === 200, '5.1 the row is still written, once, and the door answers 200');
  ok(row5 && J(Object.keys(row5)) === J(['event_id', 'provider', 'event', 'vendor_id', 'provider_subscription_id', 'provider_payment_id', 'amount_paise', 'currency', 'counts_as_revenue', 'payload']),
    '5.2 the same ten columns as every row', row5 && Object.keys(row5).join());
  ok(row5 && row5.vendor_id === null && row5.provider_subscription_id === 'sub_1' && row5.provider_payment_id === 'pay_1' && row5.amount_paise === 299900
    && row5.currency === 'INR' && row5.counts_as_revenue === true && row5.payload.payload.subscription.entity.notes.partner_id === 'org-7',
    '5.3 vendor_id null; the subscription, payment, amount and currency as sent; counts as revenue; the whole payload kept (notes.partner_id in it)', row5 && J(row5).slice(0, 300));
  ok(r5.ops.length === 1, '5.4 it is the ONLY operation: no vendor read, no link, no flip', J(r5.ops));

  sec('6  what must not move, base against tree');
  const UNTOUCHED = ['src/lib/billing/tierFlip.js', 'src/lib/billing/ledger.js', 'src/lib/billing/razorpaySubscriptions.js', 'src/api/vendor/billing.js', 'src/api/admin/bridge.js'];
  const moved = UNTOUCHED.filter((p) => sha(baseText(p)) !== sha(fs.readFileSync(R(p), 'utf8')));
  ok(moved.length === 0, `6.1 byte for byte: ${UNTOUCHED.join(', ')}`, moved.join());
  // 6.2 reads ONLY the /webhook/razorpay block, base block against tree block, line by line within it. Lines outside the
  // block are never compared, so a line another seat adds above or below it (INS's app.post) cannot redden this cell.
  const GUARD = ['    vendorId = normalized.partner_plan ? null : await tierFlip.resolveVendor(supabase, {', '  if (!vendorId && !normalized.partner_plan) {'];
  const UNGUARDED = ['    vendorId = await tierFlip.resolveVendor(supabase, {', '  if (!vendorId) {'];
  function blockCheck(baseIdx, treeIdx) {
    const bb = routeOf(baseIdx).split('\n'); const tb = routeOf(treeIdx).split('\n');
    if (bb.length !== tb.length) return { ok: false, why: `block length ${bb.length} vs ${tb.length}` };
    const moved = []; for (let i = 0; i < bb.length; i++) if (bb[i] !== tb[i]) moved.push({ at: i + 1, from: bb[i], to: tb[i] });
    const guarded = moved.length === 2 && moved.every((m, k) => m.from === UNGUARDED[k] && m.to === GUARD[k]);
    const already = moved.length === 0 && GUARD.every((g) => tb.includes(g));   // after it lands, base and tree hold the same two lines
    return { ok: guarded || already, why: JSON.stringify(moved.map((m) => `block line ${m.at}`)) };
  }
  const c62 = blockCheck(baseText(IDX), fs.readFileSync(R(IDX), 'utf8'));
  ok(c62.ok, `6.2 src/index.js: inside the /webhook/razorpay block exactly the two guard lines move, nothing added or removed; lines outside the block are not read ${c62.why}`);
  const INS_LINE = "app.post('/api/webhooks/razorpay-payment-links', async (req, res) => { res.status(200).send('ok'); });\n";
  const atBlock = (src) => src.replace("app.post('/webhook/razorpay', async (req, res) => {", INS_LINE + "app.post('/webhook/razorpay', async (req, res) => {");
  const shifted = blockCheck(baseText(IDX), atBlock(fs.readFileSync(R(IDX), 'utf8')));
  const shiftedBoth = blockCheck(atBlock(baseText(IDX)), atBlock(fs.readFileSync(R(IDX), 'utf8')));
  ok(shifted.ok && shiftedBoth.ok, '6.2a the same check with an app.post line added above the block (INS, later), in the tree alone and in both: still green');
  const rzBaseSrc = baseText(RZ); const rzTreeSrc = fs.readFileSync(R(RZ), 'utf8');
  const fnText = (src, name) => { const s = src.indexOf(`function ${name}(`); return s < 0 ? null : src.slice(s, src.indexOf('\n}\n', s) + 2); };
  ok(['verifyRazorpaySignature', 'tierFromPlan', 'entitlementFor'].every((f) => fnText(rzBaseSrc, f) === fnText(rzTreeSrc, f))
    && /const TIER_PAISE = Object\.freeze\(\{[\s\S]*?\}\);/.exec(rzBaseSrc)[0] === /const TIER_PAISE = Object\.freeze\(\{[\s\S]*?\}\);/.exec(rzTreeSrc)[0]
    && /const BASE_TIER = .*/.exec(rzBaseSrc)[0] === /const BASE_TIER = .*/.exec(rzTreeSrc)[0],
    '6.3 in razorpay.js: verifyRazorpaySignature, tierFromPlan, entitlementFor, TIER_PAISE and BASE_TIER byte for byte');

  console.log(`\nb294: ${pass} passed, ${fail} failed (base ${BASE})`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('BENCH THREW', e && e.stack); process.exit(1); });
