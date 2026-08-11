#!/usr/bin/env node
// scripts/b06_bride_arrival_bench.js
// ── TDW_06 · THE BRIDE'S ARRIVAL — A1 … A7, 57 CELLS ────────────────────────
//
// RUNNABLE FROM ANY WORKING DIRECTORY (protocol §9: a cure nobody can re-run
// quietly stops being a cure). Every path resolves off `__dirname`.
//
// THE FIXTURE-ABSENT COLUMN IS MANDATORY AND IT IS THIS SITTING'S OWN LAW.
// F-06.175 was missed for six walks because every cell that tested it drove a
// fixture its cure guaranteed — an open staged row that, on the only turn that
// matters, does not exist. So each acceptance number below carries at least one
// cell in which the thing the cure reads is ABSENT, and the cell asserts what
// happens then. A cell whose fixture is guaranteed by the cure it tests proves
// nothing.
//
// BOTH-WAYS IS BY PRODUCTION MUTATION, not by test setup. The mutation cells
// deface the SHIPPED source and assert the guard goes red; a guard that survives
// the defacement of the thing it guards is not a guard.

'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Module-load fence — declared, never real credentials. Every cell drives pure
// predicates or the injected double.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-not-a-key';
process.env.VENDOR_WHATSAPP_NUMBER = process.env.VENDOR_WHATSAPP_NUMBER || '+919999000111';

const ROOT = path.resolve(__dirname, '..');
const SRC = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');

// COMMENTS ARE NOT CODE. Five cells in a prior sitting read a decision paragraph
// as an implementation; a cell that fails when a file explains itself is a cell
// that forbids the estate from explaining itself.
const code = (p) => read(p)
  .split('\n')
  .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
  .join('\n');

let pass = 0, fail = 0; const fails = [];
async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name} — ${e && e.message}`); }
}
function H(s) { console.log(`\n${s}`); }

const PHONE = '+919625759924';
const VENDOR_PHONE = '+919888294440';
const ENV = { VENDOR_WHATSAPP_NUMBER: '+919999000111' };

// ── F-06.181's CURE · FIXTURES DERIVED FROM THE SCHEMA, NOT FROM HABIT ──────
// `public.vendors` has 38 columns and NONE of them is `phone` (witnessed at
// `docs/db/PUBLIC_SCHEMA.md`, `## public.vendors`). Every double in this file
// used to hand the subject `vendors: [{ id, phone }]` — a fixture asserting a
// column that does not exist — which is why two shipped sites read `vend.phone`,
// always got undefined, and went mute from the day they were seated. The
// fixture-shaped-cell law and F-06.172's "a double speaking a contract its
// subject does not speak", converging inside a sealed bench.
// The handset now lives where the schema puts it: `public.users.phone` (col 2),
// reached through `public.vendors.user_id` (col 2).
const VENDOR_ROW = Object.freeze({ id: 'v1', user_id: 'u1', business_name: 'S' });
const VENDOR_USER_ROW = Object.freeze({ id: 'u1', phone: '+919888294440', name: 'Dev' });


// ── THE STORE DOUBLE ────────────────────────────────────────────────────────
// Supports exactly the query shapes the subjects use, and NO MORE: a double that
// speaks a contract its subject does not speak is not a guard (F-06.172).
function makeDb(tables) {
  const log = { inserts: [], updates: [] };
  const db = {
    _log: log, _tables: tables,
    from(name) {
      let rows = (tables[name] || []).slice();
      let pending = null, mode = null, wantSelect = false, single = false;
      const api = {
        select() { wantSelect = true; return api; },
        eq(c, v) { rows = rows.filter((r) => r[c] === v); return api; },
        is(c, v) { rows = rows.filter((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
        in(c, vs) { rows = rows.filter((r) => vs.includes(r[c])); return api; },
        like(c, pat) {
          const pre = String(pat).replace(/%$/, '');
          rows = rows.filter((r) => String(r[c] || '').startsWith(pre));
          return api;
        },
        order(c, o) {
          const asc = !!(o && o.ascending);
          rows.sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1));
          if (!asc) rows.reverse();
          return api;
        },
        limit(n) { rows = rows.slice(0, n); return api; },
        insert(row) { mode = 'insert'; pending = { ...row }; return api; },
        update(row) { mode = 'update'; pending = { ...row }; return api; },
        // ── THE ROW-SHAPE CONTRACT, DERIVED FROM THE SUBJECTS, NOT TUNED ─────
        // Read off every chain the subjects actually issue at this tip:
        //   `coupleWaWindow.js`  .from('conversations').select('id').eq().in()      → awaited bare
        //   `coupleWaWindow.js`  .from('messages')…order().limit(1).maybeSingle()   → single
        //   `relayStatus.js`     .from('messages').update().eq().select(…)          → awaited bare
        //   `coupleArrival.js`   .from('pending_couple_drafts')…limit(1)            → awaited bare
        //   `coupleArrival.js`   .from('vendors').select('*').eq().maybeSingle()    → single
        //   `coupleDrafts.js`    …order().limit(1).maybeSingle()                    → single
        // TERMINATED BY maybeSingle/single → an OBJECT or null. AWAITED BARE → an
        // ARRAY. The first version of this double returned an object in both
        // cases, so `(convos || []).map(...)` threw inside `coupleWindowOpen` and
        // the predicate reported `window_check_threw` — a double speaking a
        // contract its subject does not speak, which is F-06.172's class inside
        // the bench. It is repaired here by reading the subjects, never by
        // adjusting until cells went green.
        maybeSingle() { single = true; return api.then(); },
        single() { single = true; return api.then(); },
        then(res) {
          let out;
          if (mode === 'insert') {
            const made = { id: `${name}_${(tables[name] || []).length + 1}`, resolved_at: null, ...pending };
            (tables[name] = tables[name] || []).push(made);
            log.inserts.push({ table: name, row: made });
            out = { data: single ? made : [made], error: null };
          } else if (mode === 'update') {
            const targets = rows.slice();
            for (const r of targets) Object.assign(r, pending);
            log.updates.push({ table: name, patch: { ...pending }, matched: targets.length });
            out = { data: wantSelect ? (single ? (targets[0] || null) : targets) : null, error: null };
          } else {
            out = { data: single ? (rows.length ? rows[0] : null) : rows, error: null };
          }
          return res ? Promise.resolve(out).then(res) : Promise.resolve(out);
        },
      };
      return api;
    },
  };
  return db;
}


function transport() {
  const calls = [];
  const fn = async (to, body, media, from) => { calls.push({ to, body, media, from }); return { sid: 'wamid.OUT' }; };
  fn.calls = calls;
  return fn;
}

const drafts = () => require(SRC('src/lib/vendor/coupleDrafts.js'));
const arrival = () => require(SRC('src/lib/vendor/coupleArrival.js'));
const status = () => require(SRC('src/lib/vendor/relayStatus.js'));
const seat = () => require(SRC('src/lib/vendor/relaySeat.js'));

const DOORBELL_DRAFT = {
  id: 'd1', vendor_id: 'v1', conversation_id: 'c1', couple_phone: PHONE,
  body: 'Hi Priya — about the 12th.', state: 'approved', twilio_sid: null,
  created_at: '2026-08-11T11:20:00Z', resolved_at: null,
  expires_at: '2099-01-01T00:00:00Z', refusal_reason: 'doorbell:wamid.BELL',
};

// ── MUTATION HARNESS — both-ways by PRODUCTION mutation ─────────────────────
// Defaces the shipped file, re-requires it, asserts red, restores. The restore
// is in a finally: a bench that leaves the tree defaced is worse than no bench.
async function underMutation(relPath, from, to, fn) {
  const abs = SRC(relPath);
  const original = fs.readFileSync(abs, 'utf8');
  assert.ok(original.includes(from), `MUTATION TARGET ABSENT — "${String(from).slice(0, 60)}" not in ${relPath}`);
  try {
    fs.writeFileSync(abs, original.replace(from, to));
    delete require.cache[require.resolve(abs)];
    await fn();
  } finally {
    fs.writeFileSync(abs, original);
    delete require.cache[require.resolve(abs)];
  }
}

(async () => {

// ═══ A1 · HER REPLY ROUTES TO THE DOORBELL'S VENDOR — 12 cells ═════════════
H('A1 — THE DOORBELL ANSWERS ROUTING BEFORE SHE IS ASKED (12)');

await t('A1.1 the store answers "is a doorbell standing for this phone?"', async () => {
  const db = makeDb({ pending_couple_drafts: [DOORBELL_DRAFT] });
  const out = await drafts().standingDoorbellFor(db, PHONE);
  assert.strictEqual(out.draft && out.draft.vendor_id, 'v1');
  assert.strictEqual(out.reason, 'doorbell_standing');
});

await t('A1.2 FIXTURE-ABSENT — no draft at all, the store says so and routing is untouched', async () => {
  const out = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [] }), PHONE);
  assert.strictEqual(out.draft, null);
  assert.strictEqual(out.reason, 'no_doorbell');
});

await t('A1.3 an APPROVED draft with NO doorbell does not steer her routing', async () => {
  const unrung = { ...DOORBELL_DRAFT, refusal_reason: null };
  const out = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [unrung] }), PHONE);
  assert.strictEqual(out.draft, null, 'unsent mail must never infer her intent');
});

await t('A1.4 a RESOLVED doorbell row is closed and does not steer routing', async () => {
  const done = { ...DOORBELL_DRAFT, resolved_at: '2026-08-11T12:00:00Z' };
  const out = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [done] }), PHONE);
  assert.strictEqual(out.draft, null);
});

await t('A1.5 a doorbell for ANOTHER phone never answers for this one', async () => {
  const other = { ...DOORBELL_DRAFT, couple_phone: '+919000000000' };
  const out = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [other] }), PHONE);
  assert.strictEqual(out.draft, null);
});

await t('A1.6 F-06.154 DECLARED MISS — a bare-format row does not match +E164', async () => {
  const bare = { ...DOORBELL_DRAFT, couple_phone: '919625759924' };
  const out = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [bare] }), PHONE);
  assert.strictEqual(out.draft, null, 'the contract is exact equality and it is asserted, not discovered');
});

await t('A1.7 never throws — a broken store is "no doorbell", never an exception', async () => {
  const broken = { from() { throw new Error('store down'); } };
  const out = await drafts().standingDoorbellFor(broken, PHONE);
  assert.strictEqual(out.draft, null);
  assert.ok(/threw/.test(out.reason));
});

await t('A1.8 a doorbell row carrying no vendor_id is refused, not half-used', async () => {
  const orphan = { ...DOORBELL_DRAFT, vendor_id: null };
  const out = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [orphan] }), PHONE);
  assert.strictEqual(out.draft, null);
  assert.strictEqual(out.reason, 'doorbell_without_vendor');
});

await t('A1.9 the arrival lib returns the vendor the estate named to her', async () => {
  const db = makeDb({ pending_couple_drafts: [DOORBELL_DRAFT] });
  const out = await arrival().doorbellRouteFor(db, PHONE);
  assert.strictEqual(out.vendorId, 'v1');
  assert.strictEqual(out.draftId, 'd1');
});

await t('A1.10 THE PIN SITS AFTER STEP B AND BEFORE STEP C (fork 1(b), by source order)', async () => {
  const d = code('src/lib/vendorInbound.js');
  // CODE LANDMARKS ONLY. `matchedByTdw` is Step B's own variable, `allThreads`
  // is Step C's own query — both survive comment-stripping, which the section
  // headers they replaced did not.
  const iB = d.indexOf('matchedByTdw');
  const iPin = d.indexOf('doorbellRouteFor');
  const iC = d.indexOf('const { data: allThreads }');
  assert.ok(iB > 0 && iPin > 0 && iC > 0, `a landmark is missing: B=${iB} pin=${iPin} C=${iC}`);
  assert.ok(iB < iPin, 'the doorbell outranks her explicit TDW code — her stated intent is not sovereign');
  assert.ok(iPin < iC, 'the doorbell answer does not precede the count that produces the ask');
});

await t('A1.11 THE ASK SURVIVES for genuinely doorbell-less ambiguity', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/const candidateVendors/.test(d) && /routing:disambiguation_asked/.test(d),
    'the disambiguation branch was removed rather than made conditional');
  assert.ok(/doorbellPin \? \[doorbellPin\] : allThreads/.test(d),
    'the set is not collapsed by the pin — the ask cannot be bypassed for a doorbell bride');
});

await t('A1.12 BOTH-WAYS — blinding the doorbell check makes the ask fire again', async () => {
  await underMutation('src/lib/vendor/coupleDrafts.js',
    ".like('refusal_reason', 'doorbell:%')",
    ".like('refusal_reason', 'NEVERMATCH:%')",
    async () => {
      const db = makeDb({ pending_couple_drafts: [DOORBELL_DRAFT] });
      const out = await require(SRC('src/lib/vendor/coupleDrafts.js')).standingDoorbellFor(db, PHONE);
      assert.strictEqual(out.draft, null, 'the check survived the defacement of the thing it checks');
    });
  delete require.cache[require.resolve(SRC('src/lib/vendor/coupleDrafts.js'))];
  const ok = await drafts().standingDoorbellFor(makeDb({ pending_couple_drafts: [DOORBELL_DRAFT] }), PHONE);
  assert.ok(ok.draft, 'restored tree must be green again');
});

// ═══ A2 · THE WINDOW OPENS AT HER ARRIVAL — 8 cells ════════════════════════
H('A2 — HER ARRIVAL PRODUCES THE WINDOW WHERE A SENDER CAN CONSUME IT (8)');

await t('A2.1 F-06.178 — the reader-less consumer is RETIRED from the vendor seat', async () => {
  const d = code('src/lib/vendor/relaySeat.js');
  assert.ok(!/deps\.windowJustOpened/.test(d),
    'the consumer with zero producers is still in the vendor seat');
});

await t('A2.2 the retirement names where the trigger went, by path and symbol', async () => {
  const d = read('src/lib/vendor/relaySeat.js');
  assert.ok(/coupleArrival\.js/.test(d) && /arrivalAutoSend/.test(d),
    'path-over-range: a retirement that does not say where the reader went is a deletion');
});

await t('A2.3 the trigger is sited on the COUPLE lane, not the vendor seat', async () => {
  const d = code('src/lib/vendorInbound.js');
  // The couple-lane region opens at `if (!vendor) {` and its last statement is
  // the disambiguation ask. EVERY call site must lie inside that span — asserted
  // for all four, not for the first one found.
  const iOpen = d.indexOf('if (!vendor) {');
  const iLast = d.indexOf('const candidateVendors');
  assert.ok(iOpen > 0 && iLast > iOpen, 'the couple-lane region landmarks are missing');
  const idx = []; let k = -1;
  while ((k = d.indexOf('await arrivalAutoSend(', k + 1)) !== -1) idx.push(k);
  assert.strictEqual(idx.length, 4, `expected 4 call sites, found ${idx.length}`);
  for (const i of idx) {
    assert.ok(i > iOpen && i < iLast,
      'an arrival trigger sits outside the couple-lane region — it would run on a vendor turn');
  }
});

await t('A2.4 EVERY vendor-resolved couple terminal fires the trigger — four, counted', async () => {
  const d = code('src/lib/vendorInbound.js');
  const n = (d.match(/await arrivalAutoSend\(/g) || []).length;
  assert.strictEqual(n, 4, `expected 4 couple-lane call sites, found ${n}`);
});

await t('A2.5 ORDER — the trigger is sited AFTER the persist, never before it', async () => {
  const d = code('src/lib/vendorInbound.js');
  const re = /inboundRow\(\{[\s\S]{0,400}?sent_by: 'couple',[\s\S]{0,200}?messageSid\)\);([\s\S]{0,900}?)arrivalAutoSend/g;
  let hits = 0, m;
  while ((m = re.exec(d)) !== null) {
    assert.ok(!/from\('messages'\)/.test(m[1]), 'another insert sits between the persist and the trigger');
    hits++;
  }
  assert.strictEqual(hits, 4, `the persist→trigger order holds at only ${hits} of 4 terminals`);
});

await t('A2.6 the window predicate genuinely reads her persisted inbound', async () => {
  const { coupleWindowOpen } = require(SRC('src/lib/vendor/coupleWaWindow.js'));
  const now = new Date().toISOString();
  const db = makeDb({
    conversations: [{ id: 'c1', counterparty_phone: PHONE, kind: 'couple_thread' }],
    messages: [{ id: 'm1', conversation_id: 'c1', direction: 'inbound', created_at: now }],
  });
  const out = await coupleWindowOpen(db, PHONE);
  assert.strictEqual(out.open, true);
});

await t('A2.7 FIXTURE-ABSENT — with her inbound NOT on file the predicate reads closed', async () => {
  const { coupleWindowOpen } = require(SRC('src/lib/vendor/coupleWaWindow.js'));
  const db = makeDb({
    conversations: [{ id: 'c1', counterparty_phone: PHONE, kind: 'couple_thread' }],
    messages: [],
  });
  const out = await coupleWindowOpen(db, PHONE);
  assert.strictEqual(out.open, false);
  assert.strictEqual(out.reason, 'no_inbound_ever',
    'THIS IS F-06.179 IN ONE CELL — the estate blind to the window Meta opened');
});

await t('A2.8 R-29.34(a) — the DOOR\'S REAL EXPORTED HANDLER is the entry, not a helper', async () => {
  const mod = require(SRC('src/lib/vendorInbound.js'));
  assert.ok(typeof mod.processVendorInbound === 'function',
    `the door's handler is not exported; exports: ${Object.keys(mod).join(', ')}`);
  const d = code('src/lib/vendorInbound.js');
  const iHandler = d.indexOf('processVendorInbound');
  assert.ok(iHandler >= 0 && d.indexOf('arrivalAutoSend') > iHandler,
    'the trigger is not inside the exported handler the webhook calls');
});

// ═══ A3 · AUTO-SEND, END TO END — 10 cells ═════════════════════════════════
H('A3 — APPROVED + HER ARRIVAL → THE SEND FIRES WITH ZERO FURTHER HUMAN WORD (10)');

await t('A3.1 the phone-keyed reader finds the approved draft waiting for her', async () => {
  const out = await drafts().approvedForPhone(makeDb({ pending_couple_drafts: [DOORBELL_DRAFT] }), PHONE);
  assert.strictEqual(out.draft && out.draft.id, 'd1');
  assert.strictEqual(out.reason, 'approved');
});

await t('A3.2 FIXTURE-ABSENT — no approved draft, nothing fires and it says why', async () => {
  const db = makeDb({ pending_couple_drafts: [] });
  const out = await arrival().arrivalAutoSend(db, PHONE, { sendWhatsApp: transport(), env: ENV });
  assert.strictEqual(out.kind, 'no_draft');
  assert.strictEqual(out.reason, 'no_approved_draft');
});

await t('A3.3 EXPIRED — the row self-heals to expired and NO send goes', async () => {
  const stale = { ...DOORBELL_DRAFT, expires_at: '2020-01-01T00:00:00Z' };
  const tables = { pending_couple_drafts: [stale], vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] };
  const db = makeDb(tables);
  const send = transport();
  const out = await arrival().arrivalAutoSend(db, PHONE, { sendWhatsApp: send, env: ENV });
  assert.strictEqual(out.kind, 'expired');
  assert.strictEqual(tables.pending_couple_drafts[0].state, 'expired', 'the state did not transition');
});

await t('A3.4 EXPIRED — the BRIDE is told nothing (fork 5, chair-ruled silence)', async () => {
  const stale = { ...DOORBELL_DRAFT, expires_at: '2020-01-01T00:00:00Z' };
  const db = makeDb({ pending_couple_drafts: [stale], vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] });
  const send = transport();
  await arrival().arrivalAutoSend(db, PHONE, { sendWhatsApp: send, env: ENV });
  assert.ok(!send.calls.some((c) => c.to === PHONE),
    'a sentence went to the bride about machinery she never knew existed');
});

await t('A3.5 EXPIRED — the VENDOR is told, on his own handset, with ⑥', async () => {
  // THE FIXTURE IS AN `approved` ROW PAST ITS EXPIRY, never a pre-`expired` one:
  // the arm fires on the SELF-HEAL, which is the only way it fires in production.
  const stale = { ...DOORBELL_DRAFT, expires_at: '2020-01-01T00:00:00Z' };
  const db = makeDb({ pending_couple_drafts: [stale], vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] });
  const send = transport();
  await arrival().arrivalAutoSend(db, PHONE, { sendWhatsApp: send, env: ENV });
  const toVendor = send.calls.filter((c) => c.to === VENDOR_PHONE);
  assert.strictEqual(toVendor.length, 1, 'the vendor was not told his draft died');
  assert.strictEqual(toVendor[0].body, seat().expiredLine(), 'the byte is not ⑥ from the registry');
});

await t('A3.6 the vendor-facing byte rides the VENDOR LANE number, pinned', async () => {
  const stale = { ...DOORBELL_DRAFT, expires_at: '2020-01-01T00:00:00Z' };
  const db = makeDb({ pending_couple_drafts: [stale], vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] });
  const send = transport();
  await arrival().arrivalAutoSend(db, PHONE, { sendWhatsApp: send, env: ENV });
  assert.strictEqual(send.calls[0].from, ENV.VENDOR_WHATSAPP_NUMBER, 'F-06.147 — the lane is not pinned');
});

await t('A3.7 the callable exists on the seat and is the one the arrival calls', async () => {
  assert.strictEqual(typeof seat().sendApprovedDraft, 'function',
    'fork 4(b) — sendApproved was not extracted');
  assert.ok(/sendApprovedDraft/.test(code('src/lib/vendor/coupleArrival.js')));
});

await t('A3.8 preApproved is passed — his standing E3 yes is not re-asked', async () => {
  const d = code('src/lib/vendor/coupleArrival.js');
  assert.ok(/preApproved: true/.test(d),
    'without it the state guard refuses correctly and strands a draft he already authorised');
});

await t('A3.9 the auto_send WITNESS LINE is emitted (R-29.34 member (b))', async () => {
  const d = code('src/lib/vendor/coupleArrival.js');
  assert.ok(/auto_sent attempt/.test(d), 'no attempt witness — a success that never says it tried');
  assert.ok(/auto_sent /.test(d), 'no outcome witness for the founder to read on walk nine');
});

await t('A3.10 BOTH-WAYS — mutating the store reader to vendor-keying kills the send', async () => {
  await underMutation('src/lib/vendor/coupleArrival.js',
    'const found = await drafts.approvedForPhone(supabase, couplePhone);',
    'const found = { draft: null, reason: "mutated" };',
    async () => {
      const db = makeDb({ pending_couple_drafts: [DOORBELL_DRAFT], vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] });
      const send = transport();
      const out = await require(SRC('src/lib/vendor/coupleArrival.js')).arrivalAutoSend(db, PHONE, { sendWhatsApp: send, env: ENV });
      assert.strictEqual(out.kind, 'no_draft', 'the cell passed over a defaced reader');
    });
});

// ═══ A4 · THE RECEIPT CHAIN — 9 cells ══════════════════════════════════════
H('A4 — RECEIPTS SPEAK OFF WITNESSED MATCHES, NEVER OFF A BLIND UPDATE (9)');

await t('A4.1 F-06.143 — the blind update is GONE from the webhook seam', async () => {
  const d = code('src/index.js');
  assert.ok(!/update\(\{ delivery_status: s\.status \}\)\.eq\('twilio_sid', s\.id\)/.test(d),
    'the blind, uncounted, catch-swallowed update is still at the seam');
});

await t('A4.2 the seam is a thin call to the witnessed lib', async () => {
  const d = code('src/index.js');
  assert.ok(/applyStatusEvent\(supabase, s,/.test(d), 'the seam does not call the lib');
});

await t('A4.3 a matched status is COUNTED, not assumed', async () => {
  const tables = { messages: [{ id: 'm1', twilio_sid: 'wamid.A', sent_by: 'vendor_relay', conversation_id: 'c1' }] };
  const db = makeDb(tables);
  const out = await status().witnessStatusMatch(db, { id: 'wamid.A', status: 'delivered' });
  assert.strictEqual(out.matched, 1);
  assert.strictEqual(out.reason, 'matched');
  assert.strictEqual(tables.messages[0].delivery_status, 'delivered', 'the update did not land');
});

await t('A4.4 FIXTURE-ABSENT — a status matching NOTHING is named by name', async () => {
  const db = makeDb({ messages: [] });
  const out = await status().witnessStatusMatch(db, { id: 'wamid.GHOST', status: 'delivered' });
  assert.strictEqual(out.matched, 0);
  assert.strictEqual(out.reason, 'no_row_for_sid',
    'F-06.143 verbatim — the failure to record is again unrecorded');
});

await t('A4.5 a status matching nothing sends NO vendor byte and synthesizes nothing', async () => {
  const db = makeDb({ messages: [] });
  const send = transport();
  const out = await status().applyStatusEvent(db, { id: 'wamid.GHOST', status: 'delivered' }, { sendWhatsApp: send, env: ENV });
  assert.strictEqual(out.receipt, null);
  assert.strictEqual(send.calls.length, 0);
});

await t('A4.6 a non-relay row never triggers a vendor receipt', async () => {
  const db = makeDb({ messages: [{ id: 'm1', twilio_sid: 'wamid.B', sent_by: 'agent', conversation_id: 'c1' }] });
  const send = transport();
  const out = await status().applyStatusEvent(db, { id: 'wamid.B', status: 'delivered' }, { sendWhatsApp: send, env: ENV });
  assert.strictEqual(out.receipt, null);
  assert.strictEqual(send.calls.length, 0, 'every outbound in the estate would now trigger a receipt');
});

await t('A4.7 only delivered and read are receipt-bearing statuses', async () => {
  const db = makeDb({ messages: [{ id: 'm1', twilio_sid: 'wamid.C', sent_by: 'vendor_relay', conversation_id: 'c1' }] });
  const out = await seat().relayReceipt(db, { wamid: 'wamid.C', status: 'sent', sendWhatsApp: transport(), env: ENV });
  assert.strictEqual(out, null);
});

await t('A4.8 №14 and №15 are the registry\'s bytes, unchanged', async () => {
  const s = seat();
  assert.ok(/Delivered to/.test(s.deliveredLine('Priya', PHONE)), '№14 drifted');
  assert.ok(/seen it/.test(s.readLine('Priya')), '№15 drifted');
});

await t('A4.9 BOTH-WAYS — removing the .select() blinds the witness and the cell reds', async () => {
  await underMutation('src/lib/vendor/relayStatus.js',
    ".select('id, conversation_id, sent_by, body, twilio_sid, delivery_status')",
    '',
    async () => {
      const db = makeDb({ messages: [{ id: 'm1', twilio_sid: 'wamid.A', sent_by: 'vendor_relay', conversation_id: 'c1' }] });
      const out = await require(SRC('src/lib/vendor/relayStatus.js')).witnessStatusMatch(db, { id: 'wamid.A', status: 'delivered' });
      assert.strictEqual(out.matched, 0, 'the witness survived losing the thing that makes it a witness');
    });
});

// ═══ A5 · REPLACE-NEVER-APPEND — 6 cells ═══════════════════════════════════
H('A5 — A COSTUME TURN WITH A SEAT OUTCOME SHIPS THE RELAY LINE ALONE (6)');

await t('A5.1 the wire REPLACES on a costume turn with an outcome', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/replyText = relayOut\.line;/.test(d),
    'walk eight\'s three-sentence screen can still ship');
});

await t('A5.2 F-06.189(α) — THE APPEND IS RETIRED WITH ITS READER', async () => {
  // AMENDED at rider 4. This asserted the append survived, which was right while
  // the replacement was CONDITIONAL. Under (α) every acted turn replaces, so an
  // append would be a write no reader ever sees — and a line that looks like it
  // ships and never does is how a guard rots. Retire-with-the-reader.
  const d = code('src/lib/vendorInbound.js');
  assert.ok(!/replyText \+= `\\n\\n\$\{relayOut\.line\}`;/.test(d),
    'a dead append survives beside the replacement that always supersedes it');
  assert.ok(/relayOut && relayOut\.line/.test(d), 'the outcome branch itself vanished');
});

await t('A5.3 the replacement fires only inside the suppression branch', async () => {
  const d = code('src/lib/vendorInbound.js');
  const iSup = d.indexOf('relay_outcome_stands');
  const iRep = d.indexOf('replyText = relayOut.line;');
  assert.ok(iSup > 0 && iRep > iSup && (iRep - iSup) < 2000,
    'the replacement is not bound to the costume condition');
});

await t('A5.4 THE THREAD IS PATCHED TO MATCH THE WIRE — both memories agree', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/relayReplacedCostume && relayOut && relayOut\.line/.test(d), 'no thread patch guard');
  assert.ok(/patchComposedReply\(supabase, \{ \.\.\.effectiveResult, reply: '' \}, relayOut\.line\)/.test(d),
    'the thread keeps the costume the wire just retired — F-06.166\'s mechanism');
});

await t('A5.5 FIXTURE-ABSENT — no seat outcome, nothing is replaced', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/let relayReplacedCostume = false;/.test(d),
    'the flag has no false default — a turn with no relay outcome could replace');
});

await t('A5.6 chat.js is NOT modified — the replace idiom is the estate\'s own', async () => {
  const d = read('src/api/vendor-engine/chat.js');
  const n = (d.match(/async function patchComposedReply\(supabase, result, tail\)/g) || []).length;
  assert.strictEqual(n, 1, 'the one-home core changed shape; this sitting had no §0.2 for it');
});

// ═══ A6 · THE STAGING TURN CARRIES ITS OWN BLOCK — 5 cells ═════════════════
H('A6 — THE ANTI-DUPLICATE INSTRUCTION IS PRESENT ON THE TURN THAT STAGES (5)');

await t('A6.1 FIXTURE-ABSENT (THE CELL THIS FINDING EXISTS FOR) — no open row, law still present', async () => {
  const db = makeDb({ pending_couple_drafts: [] });
  const out = await seat().buildPendingRelay(db, 'v1');
  assert.notStrictEqual(out, '', 'the staging turn is still naked — F-06.175 uncured');
  assert.ok(/DOOR OWNS EVERY DRAFT QUOTE/.test(out));
});

await t('A6.2 with an open staged row, BOTH halves ship', async () => {
  const staged = { ...DOORBELL_DRAFT, state: 'staged', refusal_reason: null };
  const db = makeDb({ pending_couple_drafts: [staged], leads: [] });
  const out = await seat().buildPendingRelay(db, 'v1');
  assert.ok(/DOOR OWNS EVERY DRAFT QUOTE/.test(out), 'the standing law vanished when a row appeared');
  assert.ok(/A DRAFT IS WAITING FOR THE OWNER'S APPROVAL/.test(out), 'the row-specific block was lost');
});

await t('A6.3 pendingRelayBlock is BYTE-UNTOUCHED — every existing cell still holds', async () => {
  const blk = seat().pendingRelayBlock({ body: 'X', couple_phone: PHONE }, 'Priya');
  assert.ok(/ANY plain yes sends it/.test(blk));
  assert.ok(/Nothing has gone to her and nothing will until he approves it\./.test(blk));
});

await t('A6.4 a STORE FAULT fails to the smaller truth, never to silence', async () => {
  const broken = { from() { throw new Error('down'); } };
  const out = await seat().buildPendingRelay(broken, 'v1');
  assert.ok(/DOOR OWNS EVERY DRAFT QUOTE/.test(out),
    'a store fault teaches the model it owns the draft quote');
});

await t('A6.5 BOTH-WAYS — restoring the empty-string return reds the fixture-absent cell', async () => {
  await underMutation('src/lib/vendor/relaySeat.js',
    "if (!open.draft) return RELAY_STANDING_LAW;",
    "if (!open.draft) return '';",
    async () => {
      const db = makeDb({ pending_couple_drafts: [] });
      const out = await require(SRC('src/lib/vendor/relaySeat.js')).buildPendingRelay(db, 'v1');
      assert.strictEqual(out, '', 'the cure\'s absence is not detectable — the cell proves nothing');
    });
});

// ═══ A7 · HER ARRIVAL IS ON FILE — 7 cells ═════════════════════════════════
H('A7 — F-06.179 · EVERY VENDOR-RESOLVED TERMINAL PERSISTS HER INBOUND (7)');

await t('A7.1 the four couple terminals each carry an inbound persist', async () => {
  const d = code('src/lib/vendorInbound.js');
  const n = (d.match(/inboundRow\(\{[\s\S]{0,400}?sent_by: 'couple',/g) || []).length;
  assert.strictEqual(n, 4, `expected 4 couple-lane inbound persists, found ${n}`);
});

await t('A7.2 the doorbell path reuses a persisting terminal, never a second insert', async () => {
  const d = code('src/lib/vendorInbound.js');
  const iPin = d.indexOf('let doorbellPin = null;');
  const iC = d.indexOf('const { data: allThreads }');
  assert.ok(iPin > 0 && iC > iPin, `pin block landmarks missing: pin=${iPin} C=${iC}`);
  const seg = d.slice(iPin, iC);
  // THE PIN ROUTES; THE TERMINAL PERSISTS. They must never be one block — if the
  // pin wrote her row itself, the doorbell path would carry a second copy of the
  // estate's persist and F-06.179 would be cured in two places that could drift.
  assert.ok(!/from\('messages'\)/.test(seg), 'the doorbell path writes its own message row');
  assert.ok(!/\.insert\(/.test(seg), 'the pin block writes to the store at all');
  assert.ok(/from\('conversations'\)/.test(seg), 'the pin does not even read the thread it pins');
});

await t('A7.3 the pin collapses the set so the SAME single-thread terminal runs', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/const existingThreads = doorbellPin \? \[doorbellPin\] : allThreads;/.test(d));
  assert.ok(/if \(threadCount === 1\)/.test(d), 'the terminal the pin routes into is gone');
});

await t('A7.4 THE BOUND IS DECLARED on the still-ambiguous branch', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/routing:unfiled_inbound/.test(d),
    'the one turn her words are not on file passes in silence');
});

await t('A7.5 the bound names its cause — conversation_id NOT NULL', async () => {
  const d = read('src/lib/vendorInbound.js');
  assert.ok(/conversation_id` is NOT NULL/.test(d) || /conversation_id\` is NOT NULL/.test(d),
    'the bound is asserted without its schema witness');
});

await t('A7.6 FIXTURE-ABSENT — the ask branch still writes NO message row', async () => {
  const d = code('src/lib/vendorInbound.js');
  const i = d.indexOf('const candidateVendors');
  assert.ok(i > 0, 'the disambiguation branch landmark is missing');
  // THE SEGMENT ENDS AT THE BRANCH'S OWN `return;`. A fixed character window is a
  // claim about the file's spacing, not about the branch — the first version of
  // this cell overran into the vendor path and convicted the ask branch of an
  // insert that belongs to another lane entirely. A boundary, never a distance.
  const end = d.indexOf('return;', i);
  assert.ok(end > i, 'the ask branch does not return — it falls through');
  const seg = d.slice(i, end);
  assert.ok(!/from\('messages'\)/.test(seg),
    'her sentence is being filed under a thread the estate picked for her');
});

await t('A7.7 BOTH-WAYS — removing the persist blinds the window predicate', async () => {
  const { coupleWindowOpen } = require(SRC('src/lib/vendor/coupleWaWindow.js'));
  const now = new Date().toISOString();
  const withRow = makeDb({
    conversations: [{ id: 'c1', counterparty_phone: PHONE, kind: 'couple_thread' }],
    messages: [{ id: 'm1', conversation_id: 'c1', direction: 'inbound', created_at: now }],
  });
  const without = makeDb({
    conversations: [{ id: 'c1', counterparty_phone: PHONE, kind: 'couple_thread' }],
    messages: [],
  });
  assert.strictEqual((await coupleWindowOpen(withRow, PHONE)).open, true);
  assert.strictEqual((await coupleWindowOpen(without, PHONE)).open, false,
    'THE MUTATION THAT REMOVES HER ROW MUST GO RED — this is A7\'s whole subject');
});

// ═══ A8 · F-06.180 — THE VENDOR'S HANDSET, RESOLVED WHERE IT LIVES — 8 cells ═
H('A8 — F-06.180 · №14/№15/③/⑥ REACH A REAL HANDSET (8)');

const handset = () => require(SRC('src/lib/vendor/vendorHandset.js'));

await t('A8.1 the resolver joins users through vendors.user_id', async () => {
  const db = makeDb({ vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] });
  const out = await handset().vendorHandset(db, 'v1');
  assert.strictEqual(out.phone, '+919888294440');
  assert.strictEqual(out.reason, 'resolved');
});

await t('A8.2 THE GREP-CLASS CELL — no shipped code selects `phone` FROM vendors', async () => {
  // A JOIN INTO `users` IS LAWFUL AND MUST NOT RED. `users!fk ( phone )` and
  // `user:users(name, phone)` both select from the RELATION, not from vendors —
  // two such sites ship today and are correct. Only a BARE `phone` in the
  // top-level select list is the defect, so nested parens are stripped first.
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules' && f.name !== 'dist') walk(fp); continue; }
      if (!/\.(js|ts)$/.test(f.name)) continue;
      const body = fs.readFileSync(fp, 'utf8');
      const re = /\.from\(['"]vendors['"]\)\s*\.select\(\s*(['"])([^'"]*)\1/g;
      let m;
      while ((m = re.exec(body)) !== null) {
        const topLevel = m[2].replace(/\([^)]*\)/g, '');
        if (/(^|[\s,])phone([\s,]|$)/.test(topLevel)) hits.push(`${path.relative(ROOT, fp)}: ${m[2]}`);
      }
    }
  };
  walk(SRC('src'));
  assert.deepStrictEqual(hits, [], `vendors.phone does not exist; selected at: ${hits.join(' | ')}`);
});

await t('A8.3 FIXTURE-ABSENT — a vendor with no user row refuses BY NAME', async () => {
  const db = makeDb({ vendors: [VENDOR_ROW], users: [] });
  const out = await handset().vendorHandset(db, 'v1');
  assert.strictEqual(out.phone, null);
  assert.strictEqual(out.reason, 'no_user_row', 'the refusal is unnamed — F-06.171 all over again');
});

await t('A8.4 an unknown vendor refuses by name, never throws', async () => {
  const out = await handset().vendorHandset(makeDb({ vendors: [], users: [] }), 'nope');
  assert.strictEqual(out.reason, 'no_such_vendor');
});

await t('A8.5 R-29.34(b) — the resolution carries a founder-readable witness', async () => {
  const d = code('src/lib/vendor/vendorHandset.js');
  assert.ok(/vendor_handset_resolved/.test(d), 'no named witness for a resolved handset');
});

await t('A8.6 №14/№15 REACH THE HANDSET — the walk-nine mute path, cured', async () => {
  const world = {
    messages: [{ id: 'm1', conversation_id: 'c9', twilio_sid: 'wamid.R', sent_by: 'vendor_relay', body: 'x' }],
    conversations: [{ id: 'c9', vendor_id: 'v1', counterparty_phone: PHONE }],
    vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW], leads: [],
  };
  const send = transport();
  const out = await seat().relayReceipt(makeDb(world), { wamid: 'wamid.R', status: 'delivered', sendWhatsApp: send, env: ENV });
  assert.ok(out && /Delivered to/.test(out.line), 'the receipt still composes nothing');
  assert.strictEqual(send.calls.length, 1, 'THE RECEIPT IS STILL MUTE — walk nine unfixed');
  assert.strictEqual(send.calls[0].to, '+919888294440');
});

await t('A8.7 ③/⑥ REACH THE HANDSET — the arrival outcome, cured', async () => {
  const stale = { ...DOORBELL_DRAFT, expires_at: '2020-01-01T00:00:00Z' };
  const db = makeDb({ pending_couple_drafts: [stale], vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW] });
  const send = transport();
  await arrival().arrivalAutoSend(db, PHONE, { sendWhatsApp: send, env: ENV });
  const toVendor = send.calls.filter((c) => c.to === '+919888294440');
  assert.strictEqual(toVendor.length, 1, 'the arrival outcome is still undeliverable to the vendor');
});

await t('A8.8 BOTH-WAYS — reverting the receipt to vendors.phone goes mute again', async () => {
  await underMutation('src/lib/vendor/relaySeat.js',
    "const hand = await vendorHandset(supabase, convo.vendor_id);",
    "const hand = { phone: undefined, reason: 'mutated' };",
    async () => {
      const world = {
        messages: [{ id: 'm1', conversation_id: 'c9', twilio_sid: 'wamid.R', sent_by: 'vendor_relay', body: 'x' }],
        conversations: [{ id: 'c9', vendor_id: 'v1', counterparty_phone: PHONE }],
        vendors: [VENDOR_ROW], users: [VENDOR_USER_ROW], leads: [],
      };
      const send = transport();
      const out = await require(SRC('src/lib/vendor/relaySeat.js')).relayReceipt(makeDb(world), { wamid: 'wamid.R', status: 'delivered', sendWhatsApp: send, env: ENV });
      assert.strictEqual(out, null, 'the cell passed over a mute receipt');
      assert.strictEqual(send.calls.length, 0);
    });
});

// ═══ A9 · F-06.182 — THE DOOR'S DEED STANDS ALONE — 6 cells ═════════════════
H('A9 — F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK (6)');

await t('A9.1 a delivered relay silences the model at every terminal — four, counted', async () => {
  const d = code('src/lib/vendorInbound.js');
  const n = (d.match(/if \(relayFiredOnArrival\(arrivalRelay\)\) \{/g) || []).length;
  assert.strictEqual(n, 4, `expected the skip at 4 terminals, found ${n}`);
});

await t('A9.2 the skip RETURNS — no tokens, no assistant row, no costume to patch', async () => {
  const d = code('src/lib/vendorInbound.js');
  const re = /if \(relayFiredOnArrival\(arrivalRelay\)\) \{([\s\S]*?)\n        \}/g;
  let m, seen = 0;
  while ((m = re.exec(d)) !== null) {
    assert.ok(/return;/.test(m[1]), 'the skip falls through — the model still runs');
    assert.ok(!/runCoupleAgenticTurn/.test(m[1]), 'the model is run and dropped, minting the row .165 forbids');
    seen++;
  }
  assert.strictEqual(seen, 4, `only ${seen} of 4 skips return`);
});

await t('A9.3 FIXTURE-ABSENT — no relay fired, the model speaks normally', async () => {
  const { relayFiredOnArrival } = arrival();
  assert.strictEqual(relayFiredOnArrival(null), false, 'a bride with no draft would be met with silence');
  assert.strictEqual(relayFiredOnArrival({ kind: 'no_draft' }), false);
});

await t('A9.4 A REFUSAL DOES NOT SILENCE HER ANSWER — the asymmetry is the finding', async () => {
  const { relayFiredOnArrival } = arrival();
  for (const k of ['expired', 'window_undetermined', 'send_failed', 'no_recipient', 'vendor_missing', 'threw']) {
    assert.strictEqual(relayFiredOnArrival({ kind: k }), false,
      `kind "${k}" put nothing on her screen and must not leave her question unanswered`);
  }
});

await t('A9.5 only outcomes that reached her handset silence the model', async () => {
  const { relayFiredOnArrival, RELAY_DELIVERED_KINDS } = arrival();
  assert.deepStrictEqual([...RELAY_DELIVERED_KINDS], ['sent', 'window_closed_doorbell']);
  assert.strictEqual(relayFiredOnArrival({ kind: 'sent' }), true);
});

await t('A9.6 BOTH-WAYS — un-skipping restores the walk-nine narration', async () => {
  await underMutation('src/lib/vendor/coupleArrival.js',
    "return !!(out && out.kind && RELAY_DELIVERED_KINDS.includes(out.kind));",
    "return false;",
    async () => {
      const { relayFiredOnArrival } = require(SRC('src/lib/vendor/coupleArrival.js'));
      assert.strictEqual(relayFiredOnArrival({ kind: 'sent' }), false,
        'the predicate survived the defacement of the thing it decides');
    });
});

// ═══ A10 · F-06.183 — THE WITNESS IS CLASS-SCOPED — 6 cells ════════════════
H('A10 — F-06.183 · A LEAD WRITE CANNOT ACQUIT A WIRE CLAIM (6)');

const chat = () => require(SRC('src/api/vendor-engine/chat.js'));

await t('A10.1 THE NAMED RED SPECIMEN — walk ten\'s exact bytes are a relay claim', async () => {
  const specimen = 'Done. Message is out to +918595986978 — Rs 80,000 quoted, date held till Friday. Lead logged as unverified.';
  assert.ok(chat().RELAY_CLAIM_RE.test(specimen),
    'the founder read this on his handset and the detector cannot see it');
});

await t('A10.2 the verdict census is FILTERED by class, not by "any write"', async () => {
  const d = code('src/api/vendor-engine/chat.js');
  assert.ok(/const classWitnessHands = writeHands\.filter\(\(h\) => isDeedOfClass\(h\.name, deedClass\)\);/.test(d),
    'the census feeding the witnessed_hand limb is still class-blind');
  assert.ok(/if \(classWitnessHands\.length > 0\) kind = 'witnessed_hand';/.test(d),
    'the limb still reads the unfiltered census');
});

await t('A10.3 the relay class is witnessed by donna_relay_send ALONE', async () => {
  const d = code('src/api/vendor-engine/chat.js');
  assert.ok(/if \(deedClass === 'relay'\) return RELAY_DEED_RE\.test\(n\);/.test(d));
  assert.ok(/RELAY_DEED_RE = \/\^donna_relay_send\$\//.test(d),
    'the relay deed vocabulary moved — the stage hand could acquit a send claim');
});

await t('A10.4 FIXTURE-ABSENT — the OTHER classes keep their own witnesses', async () => {
  const d = code('src/api/vendor-engine/chat.js');
  for (const arm of ["deedClass === 'booking'", "deedClass === 'date'"]) {
    assert.ok(d.includes(arm), `the class predicate lost its ${arm} arm — the join would over-narrow`);
  }
});

await t('A10.5 the filter can only SHRINK the acquitting set (fail-safe direction)', async () => {
  const d = code('src/api/vendor-engine/chat.js');
  const i = d.indexOf('const classWitnessHands');
  const seg = d.slice(i, i + 220);
  assert.ok(/writeHands\.filter\(/.test(seg), 'the census is rebuilt rather than filtered — it could GROW');
  assert.ok(!/\.concat\(|\|\|\s*writeHands/.test(seg), 'the filtered census falls back to the unfiltered one');
});

await t('A10.6 BOTH-WAYS — un-filtering restores walk ten\'s acquittal', async () => {
  await underMutation('src/api/vendor-engine/chat.js',
    'const classWitnessHands = writeHands.filter((h) => isDeedOfClass(h.name, deedClass));',
    'const classWitnessHands = writeHands;',
    async () => {
      const d = fs.readFileSync(SRC('src/api/vendor-engine/chat.js'), 'utf8');
      assert.ok(/const classWitnessHands = writeHands;/.test(d),
        'the mutation did not land — this cell proves nothing');
      assert.ok(!/isDeedOfClass\(h\.name, deedClass\)/.test(d.slice(d.indexOf('const classWitnessHands'), d.indexOf('const classWitnessHands') + 200)),
        'the class join survived its own defacement');
    });
});

// ═══ A11 · F-06.184 — THE DOOR'S OWN SECOND LINE — 5 cells ═════════════════
H('A11 — F-06.184 · THE REPLACE DOES NOT DEPEND ON A LADDER VERDICT (5)');

await t('A11.1 F-06.189(α) — THE SECOND LAYER IS STRUCTURAL AND READS NO VOCABULARY', async () => {
  // AMENDED at rider 4. The door's layer tested RELAY_CLAIM_RE — the SAME
  // predicate the ladder consults (`relaySeat.js` requires it from chat.js's one
  // home), so the two layers were one vocabulary in two coats and walk ten's
  // 「 She has it. 」 walked both. Depth over a shared predicate is depth in
  // implementation and not in evidence. The layer now keys on the STORE's own
  // outcome and consults no words at all.
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/door_line_stands_alone/.test(d), 'the structural layer carries no witness the founder can read');
  const i = d.indexOf('door_line_stands_alone');
  const seg = d.slice(Math.max(0, i - 600), i);
  assert.ok(!/RELAY_CLAIM_RE/.test(seg), 'the structural layer still consults the shared vocabulary');
});

await t('A11.2 it requires BOTH a store outcome AND a claim — never one alone', async () => {
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/if \(!relayReplacedCostume && relayOut && relayOut\.line\) \{/.test(d),
    'the layer can fire without a store-derived relay outcome');
});

await t('A11.3 FIXTURE-ABSENT — a relay turn whose prose claims nothing keeps its append', async () => {
  const honest = 'Draft is with you above — tell me when you want it to go.';
  assert.ok(!chat().RELAY_CLAIM_RE.test(honest),
    'an honest relay turn would lose Victor\'s reply');
});

await t('A11.4 it does not re-run when the guard already replaced', async () => {
  const d = code('src/lib/vendorInbound.js');
  const i = d.indexOf('RELAY_CLAIM_RE.test(prose)');
  const seg = d.slice(Math.max(0, i - 400), i);
  assert.ok(/!relayReplacedCostume/.test(seg), 'the two layers can both fire and double-patch the thread');
});

await t('A11.5 F-06.189(α) — THE RULE IS OUTCOME ALONE, never outcome-AND-costume', async () => {
  // AMENDED at rider 4, and this is the finding's whole substance. A5's gate was
  // 「 the seat acted AND a costume was detected 」. Walk ten proved the second
  // clause is a vocabulary question, and the vocabulary missed. The gate is now
  // the first clause alone: WHEN THE MACHINERY ACTED, THE MODEL DOES NOT NARRATE
  // THE ACT — F-06.182's bride-lane law arriving on the vendor lane.
  const d = code('src/lib/vendorInbound.js');
  assert.ok(/if \(!relayReplacedCostume && relayOut && relayOut\.line\) \{\s*\n\s*replyText = relayOut\.line;/.test(d),
    'the replacement is still conditioned on something beyond the seat having acted');
});

// ═══ A12 · F-06.185 / F-06.186 — THE COPY EXECUTION CENSUS — 7 cells ═══════
H('A12 — F-06.185/.186 · RULED COPY ACTS ARE EXECUTED IN THE TREE (7)');

await t('A12.1 the founder\'s strike is executed on ① showBlock', async () => {
  const b = seat().showBlock('BODY', null, PHONE);
  assert.ok(!/word for word/i.test(b), 'a founder-struck phrase is still on the vendor\'s screen');
  assert.ok(/Here is the draft:/.test(b), 'the surviving opener drifted from the founder\'s own strike');
});

await t('A12.2 THE EXECUTION CENSUS — no shipped vendor-facing byte carries the struck phrase', async () => {
  // METHOD DECLARED: every .js under src/lib, comment lines stripped, swept for
  // the struck phrase. BLIND SPOT: the engine TS plane (W-1, read-only here) and
  // any string assembled at runtime from parts.
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, f.name);
      if (f.isDirectory()) { walk(fp); continue; }
      if (!/\.js$/.test(f.name)) continue;
      const body = fs.readFileSync(fp, 'utf8').split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
      if (/word for word/i.test(body)) hits.push(path.relative(ROOT, fp));
    }
  };
  walk(SRC('src/lib'));
  assert.deepStrictEqual(hits, [], `struck phrase still shipping in: ${hits.join(', ')}`);
});

await t('A12.3 RETIRED-COPY-LEAVES-THE-TREE — ④b v1 is gone, not merely renamed', async () => {
  const d = code('src/lib/vendor/relaySeat.js');
  assert.ok(!/doorbellLine_RETIRED_v1/.test(d), 'a founder-retired byte survives retirement in the tree');
});

await t('A12.4 its successor is untouched — retirement is not deletion of the live byte', async () => {
  assert.ok(/notified on WhatsApp/i.test(seat().doorbellLineV2('Priya')), '④b-v2 moved with its retired sibling');
});

await t('A12.5 F-06.186 — a phone in the name column renders the nameless form', async () => {
  const b = seat().showBlock('BODY', '+918595986978', '+918595986978');
  assert.ok(!/\(\+918595986978\)/.test(b), 'the bride is still addressed by her number twice');
  assert.ok(b.includes('+918595986978'), 'the recipient vanished entirely');
});

await t('A12.6 FIXTURE-ABSENT — a REAL name still renders the named form', async () => {
  const b = seat().showBlock('BODY', 'Priya', PHONE);
  assert.ok(b.includes(`Priya (${PHONE})`), 'the founder-ruled named form was swallowed by the guard');
});

await t('A12.7 BOTH-WAYS — removing the guard restores the doubled number', async () => {
  await underMutation('src/lib/vendor/relaySeat.js',
    'if (looksLikeThePhone(name, phone)) return `${phone}`;',
    '',
    async () => {
      const s2 = require(SRC('src/lib/vendor/relaySeat.js'));
      const b = s2.showBlock('BODY', '+918595986978', '+918595986978');
      assert.ok(/\(\+918595986978\)/.test(b), 'the cell passed over a defaced render guard');
    });
});

// ═══ A13 · F-06.188 — STRUCTURED ADJACENCY — 7 cells ═══════════════════════
H('A13 — F-06.188 · AN APPROVAL GATE NO LONGER READS A DISPLAY STRING (7)');

await t('A13.1 doorAsked reads the STAMP, not the body', async () => {
  const d = code('src/lib/vendor/relaySeat.js');
  const i = d.indexOf('async function doorAsked');
  const body = d.slice(i, i + 700);
  assert.ok(/sent_by === RELAY_CONFIRM_SENT_BY/.test(body), 'the gate does not read the stamp');
  assert.ok(!/Send this to/.test(body), 'the gate still regexes a rendered sentence');
});

await t('A13.2 a stamped last-outbound makes a plain yes adjacent', async () => {
  const db = makeDb({ messages: [{ id: 'm1', conversation_id: 'c9', direction: 'outbound',
    sent_by: seat().RELAY_CONFIRM_SENT_BY, created_at: '2026-08-11T14:00:00Z' }] });
  assert.strictEqual(await seat().doorAsked(db, 'c9'), true);
});

await t('A13.3 THE WALK-TEN RED, CURED — a NAMELESS bride is now adjacent too', async () => {
  // The whole finding in one cell: this bride has no name, so rider 3 correctly
  // printed the bare number and the old regex lost its parentheses with it. The
  // stamp does not care what the sentence looks like.
  const db = makeDb({ messages: [{ id: 'm1', conversation_id: 'c9', direction: 'outbound',
    body: seat().showBlock('BODY', null, '+918595986978'),
    sent_by: seat().RELAY_CONFIRM_SENT_BY, created_at: '2026-08-11T14:00:00Z' }] });
  assert.strictEqual(await seat().doorAsked(db, 'c9'), true,
    'a bride with no name on file still cannot be approved with a plain yes');
});

await t('A13.4 FIXTURE-ABSENT — an ordinary agent turn is NOT adjacent', async () => {
  const db = makeDb({ messages: [{ id: 'm1', conversation_id: 'c9', direction: 'outbound',
    sent_by: 'agent', created_at: '2026-08-11T14:00:00Z' }] });
  assert.strictEqual(await seat().doorAsked(db, 'c9'), false,
    'a plain yes would approve after any turn at all — R-29.19\'s adjacency is gone');
});

await t('A13.5 ONLY the asking outcomes carry the stamp — derived, not assumed', async () => {
  const s13 = seat();
  assert.deepStrictEqual([...s13.ASKING_KINDS], ['staged', 'not_adjacent']);
  for (const k of ['staged', 'not_adjacent']) assert.strictEqual(s13.relayOutcomeAsks({ kind: k }), true);
  for (const k of ['sent', 'window_closed_doorbell', 'expired', 'declined', null])
    assert.strictEqual(s13.relayOutcomeAsks(k ? { kind: k } : null), false,
      `outcome "${k}" does not ask, and must not arm a plain yes`);
});

await t('A13.6 THE DERIVED WALL IS CURED — the money view still counts these turns', async () => {
  const d = code('src/admin/router.js');
  const n = (d.match(/\.in\('sent_by', AGENT_COST_SENT_BY\)/g) || []).length;
  assert.strictEqual(n, 2, `expected both cost readers widened, found ${n}`);
  assert.ok(/const AGENT_COST_SENT_BY = \['agent', 'relay_confirm'\];/.test(d));
  assert.ok(!/\.eq\('sent_by', 'agent'\)/.test(d),
    'a cost reader still filters on agent alone — the stamp silently under-counts spend');
});

await t('A13.7 BOTH-WAYS — restoring the display-string gate reds the nameless case', async () => {
  await underMutation('src/lib/vendor/relaySeat.js',
    'return !!(data && data.sent_by === RELAY_CONFIRM_SENT_BY);',
    "return !!(data && /Send this to .*\\(\\+\\d/.test(String(data.body || '')));",
    async () => {
      const s13 = require(SRC('src/lib/vendor/relaySeat.js'));
      const db = makeDb({ messages: [{ id: 'm1', conversation_id: 'c9', direction: 'outbound',
        body: s13.showBlock('BODY', null, '+918595986978'),
        sent_by: s13.RELAY_CONFIRM_SENT_BY, created_at: '2026-08-11T14:00:00Z' }] });
      assert.strictEqual(await s13.doorAsked(db, 'c9'), false,
        'the cell passed over the defaced gate — it proves nothing');
    });
});

// ═══ A14 · F-06.189(β) — THE PROBE BATTERY — 6 cells ═══════════════════════
H('A14 — F-06.189(β) · THE VOCABULARY IS DRAFTED AGAINST A CORPUS (6)');

await t('A14.1 THE CORPUS, BOTH POLARITIES — transmission claims convict', async () => {
  // NOT drafted from tonight's specimen alone. This family has walked twice by
  // being widened from one sentence; the battery is the chair's condition.
  const CLAIMS = [
    'She has it.', 'He has it.', 'They have it.',
    "She's got it.", 'She has received it.', 'She has it now.',
    'Message is out to +91.', 'Sent to Priya.', "I've sent it.",
    'The message went through.', 'She has seen it.',
  ];
  const RE = chat().RELAY_CLAIM_RE;
  const walked = CLAIMS.filter((c) => !RE.test(c));
  assert.deepStrictEqual(walked, [], `transmission claims the vocabulary cannot see: ${walked.join(' | ')}`);
});

await t('A14.2 THE NEGATIVE CORPUS — honest relay speech does NOT convict', async () => {
  const HONEST = [
    'Draft is with you above — tell me when you want it to go.',
    'Nothing has gone to her yet.',
    "I haven't sent anything.",
    'She has three shoots booked with you.',
    'She has a December wedding on the books.',
    'Shall I send it to her?',
  ];
  const RE = chat().RELAY_CLAIM_RE;
  const wrongly = HONEST.filter((c) => RE.test(c));
  assert.deepStrictEqual(wrongly, [], `honest speech convicted as a claim: ${wrongly.join(' | ')}`);
});

await t('A14.3 THE NAMED RED SPECIMEN — walk ten\'s exact sentence', async () => {
  assert.ok(chat().RELAY_CLAIM_RE.test('She has it.'),
    'the founder read this above a true byte and the vocabulary still cannot see it');
});

await t('A14.4 the possession limb does not swallow POSSESSION OF A THING', async () => {
  // 「 She has it 」 is a claim; 「 She has a December wedding 」 is a fact about her
  // file. The limb must end at the bare pronoun-object, never at any object.
  const RE = chat().RELAY_CLAIM_RE;
  assert.strictEqual(RE.test('She has a December wedding on the books.'), false);
  assert.strictEqual(RE.test('She has two other quotes from you.'), false);
});

await t('A14.5 ONE HOME — the door reads chat.js\'s family, never a copy', async () => {
  const d = code('src/lib/vendor/relaySeat.js');
  assert.ok(/require\('\.\.\/\.\.\/api\/vendor-engine\/chat'\)\.RELAY_CLAIM_RE/.test(d),
    'the relay seat holds a second copy of the claim family');
});

await t('A14.5b THE CORPUS\'S OWN SURVIVOR, DECLARED NOT HIDDEN (F-06.190 proposed)', async () => {
  // The battery found a SECOND contraction gap in a limb this ruling does not
  // cover: `\\b(?:it|that|the message)\\s+(?:is|'s)\\s+with\\s+(?:her|him|them)\\b`
  // requires a SPACE before the contraction, so 「 It's with her 」 walks exactly
  // as 「 She's got it 」 did. The possession limb was this ruling's subject and is
  // cured; widening a neighbouring limb unruled is how this family walked twice.
  // ASSERTED AS A KNOWN GAP so it cannot be forgotten or silently closed.
  assert.strictEqual(chat().RELAY_CLAIM_RE.test("It's with her."), false,
    'the declared gap closed without a ruling — update the finding, do not delete the cell');
  assert.strictEqual(chat().RELAY_CLAIM_RE.test('It is with her.'), true,
    'the spaced form regressed — the limb itself broke');
});

await t('A14.6 BOTH-WAYS — the participle made mandatory again, the specimen walks', async () => {
  // THE EXACT UN-CURE: restore the `got|received|seen` requirement that let
  // 「 She has it. 」 through on the founder's handset at walk ten.
  const target = "(?:got\\\\s+|received\\\\s+|seen\\\\s+)?it";
  const undone = "(?:got\\\\s+|received\\\\s+|seen\\\\s+)it";
  await underMutation('src/api/vendor-engine/chat.js', target, undone, async () => {
    const c = require(SRC('src/api/vendor-engine/chat.js'));
    assert.strictEqual(c.RELAY_CLAIM_RE.test('She has it.'), false,
      'the cell passed over a defaced vocabulary — it proves nothing');
    assert.strictEqual(c.RELAY_CLAIM_RE.test('She has got it.'), true,
      'the mutation broke the limb entirely rather than narrowing it');
  });
});

// ── RESULT ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(66)}`);
console.log(`b06_bride_arrival_bench: ${pass}/${pass + fail}`);
if (fail) { console.log('FAILED:'); fails.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }
process.exit(0);
})();
