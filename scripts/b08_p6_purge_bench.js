#!/usr/bin/env node
// scripts/b08_p6_purge_bench.js — TDW_08 · P6 · THE DELETION QUEUE BENCH
//
// Runnable from ANY working directory (the repo root resolves from __dirname,
// never from cwd — the ~/Downloads law's cousin).
//
// EVERY CELL IS BOTH-WAYS. §M mutates PRODUCTION SOURCE — never test setup —
// and asserts the cell goes RED at the uncured tree, then restores the file and
// asserts byte-identity. Every anchor is site-qualified (CE-127: String.replace
// takes the FIRST match, so a bare anchor is a coin flip).
//
// THE TRUE-PIPE LAW (F-08.65) IS HELD TWO WAYS, named because a deleter benched
// against a double is a deleter nobody has tested:
//   · §8 asserts the PRODUCTION DEFAULT of runPurgeSweep's destroy seam is
//     admin/cloudinary.js's `destroyVerified` BY IDENTITY. A harness can never
//     become the thing production runs.
//   · §9 drives the REAL `destroyVerified` against a stubbed global.fetch, so
//     the status check and the `result` read are exercised as shipped, not
//     described.
//
// WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent:
//   · no live Cloudinary cell — a real destroy is a network fact this container
//     cannot witness (igImport.js's U-5 posture). The founder's walk is the
//     witness, and the walk card carries it.
//   · no claim-flow cell — P2 is DEFERRED by founder word; §3 asserts claimed
//     rows are EXCLUDED, which is the only claim-adjacent fact this sitting owns.
//   · no demo_muse_pool cell — R-B6 put it outside the purge's scope.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(SRC(rel), 'utf8');

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); fail++; }
}
async function ta(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); fail++; }
}

// ════════════════════════════════════════════════════════════════════════════
// THE FAKE PLANE — an in-memory stand-in for the PostgREST builder supporting
// exactly the operators the purge path uses, INCLUDING the verbs b08_p1's fake
// never needed: `neq`, `lte`, and `delete`. It is test setup and is NEVER what
// a §M mutation breaks.
// ════════════════════════════════════════════════════════════════════════════
function makeDb(seed) {
  const tables = JSON.parse(JSON.stringify(seed || {}));

  function matches(row, filters) {
    return filters.every((f) => {
      const v = row[f.col];
      if (f.op === 'eq')  return v === f.val;
      if (f.op === 'neq') return v !== f.val;
      if (f.op === 'in')  return f.val.includes(v);
      if (f.op === 'is')  return f.val === null ? (v === null || v === undefined) : v === f.val;
      if (f.op === 'not_is_null') return v !== null && v !== undefined;
      if (f.op === 'lt')  return v != null && String(v) <  String(f.val);
      if (f.op === 'lte') return v != null && String(v) <= String(f.val);
      return true;
    });
  }

  function builder(name) {
    const rows = () => (tables[name] = tables[name] || []);
    const q = { _filters: [], _mode: null, _patch: null };

    const api = {
      select() { return api; },
      eq(col, val)  { q._filters.push({ col, op: 'eq',  val }); return api; },
      neq(col, val) { q._filters.push({ col, op: 'neq', val }); return api; },
      in(col, val)  { q._filters.push({ col, op: 'in',  val }); return api; },
      is(col, val)  { q._filters.push({ col, op: 'is',  val }); return api; },
      lt(col, val)  { q._filters.push({ col, op: 'lt',  val }); return api; },
      lte(col, val) { q._filters.push({ col, op: 'lte', val }); return api; },
      not(col, op, val) {
        if (op === 'is' && val === null) q._filters.push({ col, op: 'not_is_null' });
        return api;
      },
      order() { return api; },
      limit(n) { q._limit = n; return api; },
      update(patch) { q._mode = 'update'; q._patch = patch; return api; },
      delete()      { q._mode = 'delete'; return api; },
      _run() {
        let hit = rows().filter((r) => matches(r, q._filters));
        if (q._mode === 'update') hit.forEach((r) => Object.assign(r, q._patch));
        if (q._mode === 'delete') {
          const doomed = new Set(hit);
          tables[name] = rows().filter((r) => !doomed.has(r));
          // THE CASCADE, modelled because production HAS one:
          // demo_leads_demo_vendor_id_fkey is ON DELETE CASCADE (0057). A fake
          // without it would let a cell "prove" leads survive a purge.
          if (name === 'demo_vendors' && tables.demo_leads) {
            const gone = new Set(hit.map((r) => r.id));
            tables.demo_leads = tables.demo_leads.filter((l) => !gone.has(l.demo_vendor_id));
          }
        }
        if (typeof q._limit === 'number') hit = hit.slice(0, q._limit);
        return hit;
      },
      async maybeSingle() { const r = api._run(); return { data: r[0] || null, error: null }; },
      async single() {
        const r = api._run();
        return r[0] ? { data: r[0], error: null } : { data: null, error: { message: 'no rows' } };
      },
      then(res, rej) { try { res({ data: api._run(), error: null }); } catch (e) { rej(e); } },
    };
    return api;
  }

  return { from: builder, _tables: tables };
}

const DAY = 24 * 3600 * 1000;
const iso = (d) => new Date(d).toISOString();
const NOW = new Date('2026-08-05T04:15:00.000Z');
const ago = (d) => iso(NOW.getTime() - d * DAY);

// A photo carrying a stored id — the 52-of-57 majority in the founder's census.
const PHOTO_STORED = { url: 'https://res.cloudinary.com/dccso5ljv/image/upload/v1712345678/demo_vendors/a/p1.jpg', is_hero: true,  cloudinary_id: 'demo_vendors/a/p1' };
// A photo with NO stored id but a parseable URL — the 5-of-57 minority.
const PHOTO_PARSE  = { url: 'https://res.cloudinary.com/dccso5ljv/image/upload/v1712345679/demo_vendors/a/p2.jpg', is_hero: false, cloudinary_id: null };
// A photo neither leg can resolve — no stored id, no version segment.
const PHOTO_ORPHAN = { url: 'https://res.cloudinary.com/dccso5ljv/image/upload/nover.jpg', is_hero: false, cloudinary_id: null };

function vendor(over) {
  return Object.assign({
    id: 'demo-1', ig_handle: 'purge_one', display_name: 'Purge One',
    whatsapp_phone: '919888294440',
    state: 'removed', active: false, discover_eligible: false,
    discover_eligible_at: null, invited_at: ago(120), opened_at: null,
    engaged_at: null, claimed_at: null, removed_at: ago(30), sunset_at: null,
    expires_at: null, claim_token: 'tok-1', created_at: ago(200),
    photos: [PHOTO_STORED],
  }, over || {});
}

function freshLc() {
  delete require.cache[require.resolve(SRC('src/lib/demoLifecycle.js'))];
  delete require.cache[require.resolve(SRC('src/lib/prospects.js'))];
  delete require.cache[require.resolve(SRC('src/lib/admin/cloudinary.js'))];
  return require(SRC('src/lib/demoLifecycle.js'));
}

// A destroy double that confirms everything. The REAL destroyVerified is
// exercised in §9; this drives the SWEEP's logic without a network.
function destroyAllOk() {
  const seen = [];
  const fn = async (publicId) => { seen.push(publicId); return { ok: true, result: 'ok', public_id: publicId }; };
  fn.seen = seen;
  return fn;
}
function destroyAllFail(reason) {
  return async (publicId) => ({ ok: false, reason: reason || 'http_401', public_id: publicId });
}

// ════════════════════════════════════════════════════════════════════════════
(async function main() {

const lc = freshLc();

// ── §1 · THE WINDOW GETS A CODE HOME ───────────────────────────────────────
H('§1 — the resurrect window and its dial');

t('DEMO_PURGE_RESURRECT_DAYS is 7 — the spec\'s number, in code for the first time', () => {
  assert.strictEqual(lc.DEMO_PURGE_RESURRECT_DAYS, 7);
});
t('the dial key is demo.purge_resurrect_days', () => {
  assert.strictEqual(lc.PURGE_CONFIG_KEY, 'demo.purge_resurrect_days');
});
await ta('an ABSENT key falls to the default — the normal state of this estate', async () => {
  const db = makeDb({ admin_config: [] });
  assert.strictEqual(await lc.readPurgeDays(db), 7);
});
await ta('a seeded value is honoured', async () => {
  const db = makeDb({ admin_config: [{ key: 'demo.purge_resurrect_days', value: '14' }] });
  assert.strictEqual(await lc.readPurgeDays(db), 14);
});
await ta('ZERO is the KILL SWITCH, not a zero-day horizon — the sunset dial\'s inverse', async () => {
  const db = makeDb({ admin_config: [{ key: 'demo.purge_resurrect_days', value: '0' }] });
  assert.strictEqual(await lc.readPurgeDays(db), 0);
});
await ta('junk falls to the default and does NOT disable', async () => {
  const db = makeDb({ admin_config: [{ key: 'demo.purge_resurrect_days', value: 'banana' }] });
  assert.strictEqual(await lc.readPurgeDays(db), 7);
});
await ta('a NEGATIVE value falls to the default, never to a purge-everything cutoff', async () => {
  const db = makeDb({ admin_config: [{ key: 'demo.purge_resurrect_days', value: '-5' }] });
  assert.strictEqual(await lc.readPurgeDays(db), 7);
});
await ta('the kill switch reads ZERO ROWS and destroys nothing', async () => {
  const db = makeDb({
    admin_config: [{ key: 'demo.purge_resurrect_days', value: '0' }],
    demo_vendors: [vendor()],
  });
  const d = destroyAllOk();
  const r = await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.strictEqual(r.disabled, true);
  assert.strictEqual(r.purged, 0);
  assert.strictEqual(d.seen.length, 0, 'the kill switch must destroy nothing');
  assert.strictEqual(db._tables.demo_vendors.length, 1, 'the row must survive');
});

// ── §2 · THE CONJUNCTION LAW (F-08.90) ─────────────────────────────────────
H('§2 — the conjunction law: a history stamp is never the whole predicate');

await ta('TAKEDOWN LEG: a removed row past the window purges', async () => {
  const db = makeDb({ demo_vendors: [vendor({ removed_at: ago(30) })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 1);
  assert.strictEqual(db._tables.demo_vendors.length, 0);
});
await ta('TAKEDOWN LEG: a removed row INSIDE the window survives — the resurrect window', async () => {
  const db = makeDb({ demo_vendors: [vendor({ removed_at: ago(3) })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 0);
  assert.strictEqual(db._tables.demo_vendors.length, 1);
});
await ta('F-08.90 №1: a RESTORED row keeps removed_at and MUST NOT purge', async () => {
  // restore() flips active back and KEEPS removed_at by design (:488-492).
  // A predicate on the stamp alone deletes this live row.
  const db = makeDb({ demo_vendors: [vendor({
    state: 'engaged', active: true, discover_eligible: true, removed_at: ago(30),
  })] });
  const d = destroyAllOk();
  const r = await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.strictEqual(r.purged, 0, 'a restored row was purged on a stale removed_at');
  assert.strictEqual(d.seen.length, 0, 'a live row\'s assets were destroyed');
  assert.strictEqual(db._tables.demo_vendors.length, 1);
});
await ta('SUNSET LEG: a sunset row past the window purges', async () => {
  const db = makeDb({ demo_vendors: [vendor({
    state: 'expired', active: true, discover_eligible: false,
    removed_at: null, sunset_at: ago(30),
  })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 1);
  assert.strictEqual(r.detail.purged[0].leg, 'sunset');
});
await ta('F-08.90 №2: a RE-GRANTED row keeps sunset_at and MUST NOT purge', async () => {
  // setDiscoverEligible(…, true) grants flag+stamp and does NOT clear sunset_at
  // (:517-528). This row is LIVE IN THE COUPLE FEED.
  const db = makeDb({ demo_vendors: [vendor({
    state: 'expired', active: true, discover_eligible: true,
    discover_eligible_at: ago(1), removed_at: null, sunset_at: ago(30),
  })] });
  const d = destroyAllOk();
  const r = await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.strictEqual(r.purged, 0, 'a row live in the couple feed was purged on a stale sunset_at');
  assert.strictEqual(d.seen.length, 0);
});
await ta('EXCLUSIVITY: a removed row carrying an OLDER stale sunset_at is judged by its removal only', async () => {
  // Removed 3 days ago (inside the window), sunset 40 days ago (outside it).
  // The most recent exit governs — it must SURVIVE, and must not be double-counted.
  const db = makeDb({ demo_vendors: [vendor({
    state: 'removed', discover_eligible: false, removed_at: ago(3), sunset_at: ago(40),
  })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 0, 'the older sunset stamp overrode the newer removal');
  assert.strictEqual(r.by_leg.sunset, 0, 'a removed row was counted on the sunset leg');
});
await ta('EXCLUSIVITY: a removed row past BOTH windows is counted ONCE, on the takedown leg', async () => {
  const db = makeDb({ demo_vendors: [vendor({
    state: 'removed', discover_eligible: false, removed_at: ago(30), sunset_at: ago(40),
  })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 1);
  assert.strictEqual(r.by_leg.takedown, 1);
  assert.strictEqual(r.by_leg.sunset, 0);
});
await ta('a legacy row with NEITHER stamp is not purge-eligible — no exit, no clock', async () => {
  const db = makeDb({ demo_vendors: [vendor({
    state: 'legacy', active: true, discover_eligible: false,
    removed_at: null, sunset_at: null, invited_at: null,
  })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 0);
});

// ── §3 · CLAIMED ROWS ARE EXCLUDED (F-08.93) ───────────────────────────────
H('§3 — the claimed exclusion, executor-added and disclosed');

await ta('a SUNSET-THEN-CLAIMED row must not purge — P2\'s copy semantics are unbuilt', async () => {
  const db = makeDb({ demo_vendors: [vendor({
    state: 'claimed', active: true, discover_eligible: false,
    claimed_at: ago(2), removed_at: null, sunset_at: ago(30),
  })] });
  const d = destroyAllOk();
  const r = await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.strictEqual(r.purged, 0, 'a claimed vendor\'s demo was purged');
  assert.strictEqual(d.seen.length, 0, 'a claimed vendor\'s assets were destroyed at Cloudinary');
});
await ta('a CLAIMED-THEN-REMOVED row must not purge either', async () => {
  const db = makeDb({ demo_vendors: [vendor({
    state: 'removed', claimed_at: ago(20), removed_at: ago(30),
  })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 0);
});

// ── §4 · THE DESTROY KEY, BOTH LEGS (R-B6) ─────────────────────────────────
H('§4 — both-with-precedence, proven on both legs');

await ta('STORED-ID leg: the cloudinary_id is used verbatim', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED] })] });
  const d = destroyAllOk();
  await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.deepStrictEqual(d.seen, ['demo_vendors/a/p1']);
});
await ta('URL-PARSE leg: an id-less photo resolves from its delivery URL', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_PARSE] })] });
  const d = destroyAllOk();
  await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.deepStrictEqual(d.seen, ['demo_vendors/a/p2']);
});
await ta('PRECEDENCE: a stored id WINS over a parseable URL (never both, never the wrong one)', async () => {
  const mixed = { url: PHOTO_PARSE.url, is_hero: false, cloudinary_id: 'stored/wins' };
  const db = makeDb({ demo_vendors: [vendor({ photos: [mixed] })] });
  const d = destroyAllOk();
  await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.deepStrictEqual(d.seen, ['stored/wins']);
});
await ta('a row with BOTH kinds destroys both, one call each', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED, PHOTO_PARSE] })] });
  const d = destroyAllOk();
  const r = await lc.runPurgeSweep(db, NOW, { destroy: d });
  assert.deepStrictEqual(d.seen.sort(), ['demo_vendors/a/p1', 'demo_vendors/a/p2']);
  assert.strictEqual(r.assets_destroyed, 2);
});

// ── R-B6's WITNESS, MADE LEGIBLE (the executor's disclosed P6 gap) ──────────
// The live walk destroyed six assets and the ledger could not say which leg
// resolved any of them, so "witness one through EACH leg" was unanswerable from
// the output. These cells assert the ledger now answers it.
await ta('the purged ledger names the leg for EVERY asset, per row and per sweep', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED, PHOTO_PARSE, PHOTO_STORED] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.deepStrictEqual(r.detail.purged[0].assets_by_leg, { stored_id: 2, url_parse: 1 });
  assert.deepStrictEqual(r.assets_by_leg, { stored_id: 2, url_parse: 1 });
  const total = Object.values(r.assets_by_leg).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, r.assets_destroyed,
    'the per-leg tally must reconcile with the headline count — an unreconciled tally is decoration');
});
await ta('a STORED-ID-only row reports only that leg — the tally is not a constant', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.deepStrictEqual(r.assets_by_leg, { stored_id: 1 });
});
await ta('a URL-PARSE-only row reports only that leg', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_PARSE] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.deepStrictEqual(r.assets_by_leg, { url_parse: 1 });
});
await ta('the BLOCKED ledger names each failure\'s leg, and null for an unresolvable asset', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED, PHOTO_ORPHAN] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllFail('http_401') });
  const fails = r.detail.blocked[0].failures;
  assert.strictEqual(fails.find((f) => f.reason === 'http_401').resolved_by, 'stored_id',
    'a failed destroy must say which leg produced the id it tried');
  assert.strictEqual(fails.find((f) => f.reason === 'unresolvable_asset').resolved_by, null,
    'an asset neither leg could name reports null, not a guess');
});
await ta('a BLOCKED row still reports which of its assets DID confirm, by leg', async () => {
  // One stored-id asset confirms, the orphan blocks the row. The partial work is
  // ledgered so the retry is legible rather than a mystery.
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED, PHOTO_ORPHAN] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.blocked, 1);
  assert.deepStrictEqual(r.detail.blocked[0].confirmed_by_leg, { stored_id: 1 });
});
await ta('a row with ZERO photos purges — nothing to destroy is vacuously confirmed', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 1);
  assert.strictEqual(r.assets_destroyed, 0);
});

// ── §5 · VERIFY THEN PURGE · BLOCK AND RETRY (R-B7) ────────────────────────
H('§5 — an asset that will not confirm blocks its whole row');

await ta('an UNRESOLVABLE asset blocks the row — it is not silently skipped', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_ORPHAN] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 0);
  assert.strictEqual(r.blocked, 1);
  assert.strictEqual(db._tables.demo_vendors.length, 1, 'the row must survive an unconfirmable asset');
  assert.strictEqual(r.detail.blocked[0].failures[0].reason, 'unresolvable_asset');
});
await ta('a FAILING destroy blocks the row — the arc\'s disease, refused in a deleter', async () => {
  const db = makeDb({ demo_vendors: [vendor()] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllFail('http_401') });
  assert.strictEqual(r.purged, 0);
  assert.strictEqual(r.blocked, 1);
  assert.strictEqual(db._tables.demo_vendors.length, 1);
});
await ta('ONE bad asset among good ones blocks the WHOLE row', async () => {
  const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_STORED, PHOTO_ORPHAN] })] });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.purged, 0);
  assert.strictEqual(r.blocked, 1);
  assert.strictEqual(db._tables.demo_vendors.length, 1);
});
await ta('a destroy that THROWS is caught and blocks — the sweep never dies mid-population', async () => {
  const db = makeDb({ demo_vendors: [vendor(), vendor({ id: 'demo-2', ig_handle: 'purge_two' })] });
  let calls = 0;
  const flaky = async (id) => { calls++; if (calls === 1) throw new Error('socket hang up'); return { ok: true, result: 'ok', public_id: id }; };
  const r = await lc.runPurgeSweep(db, NOW, { destroy: flaky });
  assert.strictEqual(r.blocked, 1, 'the throwing row must block');
  assert.strictEqual(r.purged, 1, 'the second row must still be reached');
});
await ta('a BLOCKED row is retried on the next run and purges once its asset confirms', async () => {
  const db = makeDb({ demo_vendors: [vendor()] });
  const first = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllFail('http_500') });
  assert.strictEqual(first.blocked, 1);
  const second = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(second.purged, 1, 'the retry must succeed — block-and-retry, not mark-and-forget');
  assert.strictEqual(db._tables.demo_vendors.length, 0);
});

// ── §6 · THE SECOND DOOR'S OWN ACTS (R-B9) ─────────────────────────────────
H('§6 — leads counted, prospects unlinked, row deleted');

await ta('the pointing prospect\'s demo_vendor_ref is NULLed in the same act', async () => {
  const db = makeDb({
    demo_vendors: [vendor()],
    prospects: [
      { id: 'p-1', phone: '919888294440', state: 'templated', demo_vendor_ref: 'demo-1' },
      { id: 'p-2', phone: '919000000000', state: 'cold',      demo_vendor_ref: 'demo-9' },
    ],
  });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.detail.purged[0].prospects_unlinked, 1);
  assert.strictEqual(db._tables.prospects.find((p) => p.id === 'p-1').demo_vendor_ref, null,
    'a dangling ref makes the START arm resurrect nothing, silently');
  assert.strictEqual(db._tables.prospects.find((p) => p.id === 'p-2').demo_vendor_ref, 'demo-9',
    'an unrelated prospect must not be touched');
});
await ta('cascading leads are COUNTED BEFORE the delete, converted ones named separately', async () => {
  const db = makeDb({
    demo_vendors: [vendor()],
    demo_leads: [
      { id: 'l-1', demo_vendor_id: 'demo-1', converted_lead_id: null },
      { id: 'l-2', demo_vendor_id: 'demo-1', converted_lead_id: 'real-lead-7' },
      { id: 'l-3', demo_vendor_id: 'demo-2', converted_lead_id: null },
    ],
  });
  const r = await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(r.leads_cascaded, 2, '0106:111 filed this count for P6');
  assert.strictEqual(r.detail.purged[0].converted_leads, 1);
  assert.strictEqual(db._tables.demo_leads.length, 1, 'the cascade must have taken both');
});
await ta('a BLOCKED row cuts no linkage and cascades nothing', async () => {
  const db = makeDb({
    demo_vendors: [vendor({ photos: [PHOTO_ORPHAN] })],
    prospects: [{ id: 'p-1', phone: '919888294440', state: 'templated', demo_vendor_ref: 'demo-1' }],
    demo_leads: [{ id: 'l-1', demo_vendor_id: 'demo-1', converted_lead_id: null }],
  });
  await lc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
  assert.strictEqual(db._tables.prospects[0].demo_vendor_ref, 'demo-1');
  assert.strictEqual(db._tables.demo_leads.length, 1);
});

// ── §7 · THE SOLE DELETER ──────────────────────────────────────────────────
H('§7 — the sole-deleter rider, asserted as the sole-writer is');

t('demoLifecycle is the ONLY file in src/ that deletes from demo_vendors', () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(p); continue; }
      if (!e.name.endsWith('.js') && !e.name.endsWith('.ts')) continue;
      const src = fs.readFileSync(p, 'utf8');
      // The PostgREST delete shape against this table, in either order.
      if (/from\(\s*['"]demo_vendors['"]\s*\)[\s\S]{0,200}?\.delete\(\)/.test(src)) {
        hits.push(path.relative(ROOT, p));
      }
    }
  };
  walk(SRC('src'));
  assert.deepStrictEqual(hits, ['src/lib/demoLifecycle.js'],
    `a fifth-writer-shaped deleter exists outside the module: ${hits.join(', ')}`);
});
t('the purge does NOT route through _write — a DELETE has no shape in an update allowlist', () => {
  const src = read('src/lib/demoLifecycle.js');
  const door = src.slice(src.indexOf('async function _purgeRow'), src.indexOf('async function _read'));
  assert.ok(!/_write\(/.test(door), '_purgeRow must not call _write');
  assert.ok(/\.delete\(\)/.test(door), '_purgeRow must be the delete door');
});
t('the cron file carries the third job and calls it by name', () => {
  const src = read('src/cron.js');
  assert.ok(/runPurgeSweep\(supabase\)/.test(src), 'the nightly demo purge job is gone');
  assert.ok(/cron\.schedule\('15 4 \* \* \*'/.test(src), 'the purge slot moved');
});
t('the purge is sequenced AFTER the sunset job in the file', () => {
  const src = read('src/cron.js');
  assert.ok(src.indexOf('runSunsetSweep(supabase)') < src.indexOf('runPurgeSweep(supabase)'));
});

// ── §8 · THE TRUE-PIPE LAW (F-08.65) ───────────────────────────────────────
H('§8 — the production default is the real destroyer, by identity');

t('runPurgeSweep\'s default destroy seam IS admin/cloudinary.destroyVerified', () => {
  const src = read('src/lib/demoLifecycle.js');
  assert.ok(/const destroy = \(opts && opts\.destroy\) \|\| cloudinary\.destroyVerified;/.test(src),
    'the default seam is not the shipped verifying destroyer');
});
t('the module requires the VERIFYING destroyer, not the best-effort sibling', () => {
  const src = read('src/lib/demoLifecycle.js');
  assert.ok(/require\('\.\/admin\/cloudinary'\)/.test(src));
  assert.ok(!/deleteFromCloudinary/.test(src),
    'demoLifecycle must never reach the swallowing destroyer');
});
t('the legacy best-effort deleteFromCloudinary ships BYTE-UNTOUCHED (R-B3)', () => {
  const src = read('src/lib/admin/cloudinary.js');
  const legacy = src.slice(src.indexOf('async function deleteFromCloudinary'),
                           src.indexOf('module.exports') > 0 ? src.indexOf('// ═══', src.indexOf('async function deleteFromCloudinary')) : -1);
  assert.ok(/catch \{ \/\* best effort \*\/ \}/.test(legacy),
    'the legacy function was edited — R-B3 froze it and its four admin callers');
  assert.ok(!/res\.ok/.test(legacy), 'the legacy function must remain unverifying');
});

// ── §9 · THE REAL destroyVerified, against a stubbed wire ──────────────────
H('§9 — the shipped destroyer, exercised as shipped');

const cloud = require(SRC('src/lib/admin/cloudinary.js'));
const realFetch = global.fetch;
function stubFetch(impl) { global.fetch = impl; }
function restoreFetch() { global.fetch = realFetch; }

process.env.CLOUDINARY_API_KEY    = process.env.CLOUDINARY_API_KEY    || 'bench-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'bench-secret';
const cloudFresh = (() => {
  delete require.cache[require.resolve(SRC('src/lib/admin/cloudinary.js'))];
  return require(SRC('src/lib/admin/cloudinary.js'));
})();

await ta('result "ok" is GONE', async () => {
  stubFetch(async () => ({ ok: true, json: async () => ({ result: 'ok' }) }));
  const r = await cloudFresh.destroyVerified('a/b');
  restoreFetch();
  assert.strictEqual(r.ok, true); assert.strictEqual(r.result, 'ok');
});
await ta('result "not found" is ALSO GONE — or the retry loop wedges forever', async () => {
  stubFetch(async () => ({ ok: true, json: async () => ({ result: 'not found' }) }));
  const r = await cloudFresh.destroyVerified('a/b');
  restoreFetch();
  assert.strictEqual(r.ok, true); assert.strictEqual(r.result, 'not found');
});
await ta('a 401 is NOT gone, and reports the status rather than a parse complaint', async () => {
  stubFetch(async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'nope' } }) }));
  const r = await cloudFresh.destroyVerified('a/b');
  restoreFetch();
  assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'http_401');
});
await ta('a 200 carrying any other result is NOT gone', async () => {
  stubFetch(async () => ({ ok: true, json: async () => ({ result: 'error' }) }));
  const r = await cloudFresh.destroyVerified('a/b');
  restoreFetch();
  assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'result_not_gone');
});
await ta('a thrown network error returns a named refusal and never propagates', async () => {
  stubFetch(async () => { throw new Error('ECONNRESET'); });
  const r = await cloudFresh.destroyVerified('a/b');
  restoreFetch();
  assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'network');
});
await ta('an empty public id refuses without touching the wire', async () => {
  let touched = false;
  stubFetch(async () => { touched = true; return { ok: true, json: async () => ({ result: 'ok' }) }; });
  const r = await cloudFresh.destroyVerified(null);
  restoreFetch();
  assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'no_public_id');
  assert.strictEqual(touched, false);
});
t('publicIdFromUrl derives folder-qualified ids and refuses unversioned URLs', () => {
  assert.strictEqual(cloudFresh.publicIdFromUrl(PHOTO_PARSE.url), 'demo_vendors/a/p2');
  assert.strictEqual(cloudFresh.publicIdFromUrl(PHOTO_ORPHAN.url), null);
  assert.strictEqual(cloudFresh.publicIdFromUrl(null), null);
});

// ── §M · MUTATIONS AT PRODUCTION SOURCE ────────────────────────────────────
// Each mutation edits the SHIPPED file, asserts the named cell goes RED, then
// restores and asserts byte-identity. Test setup is never what breaks.
H('§M — both-ways, by mutating production code');

const LC_PATH  = SRC('src/lib/demoLifecycle.js');
const CL_PATH  = SRC('src/lib/admin/cloudinary.js');

async function mutate(file, from, to, label, redCell) {
  const before = fs.readFileSync(file, 'utf8');
  assert.ok(before.includes(from), `${label}: anchor not found — the mutation is vacuous`);
  assert.strictEqual(before.split(from).length - 1, 1, `${label}: anchor is not unique`);
  fs.writeFileSync(file, before.replace(from, to));
  let wentRed = false;
  try {
    const mlc = freshLc();
    await redCell(mlc, (() => { delete require.cache[require.resolve(CL_PATH)]; return require(CL_PATH); })());
  } catch (_e) { wentRed = true; }
  fs.writeFileSync(file, before);
  assert.strictEqual(fs.readFileSync(file, 'utf8'), before, `${label}: file not restored byte-identically`);
  freshLc();
  assert.ok(wentRed, `${label}: the cell PASSED at the mutated tree — it proves nothing`);
}

await ta('M-1 · dropping the takedown leg\'s state conjunction reddens the restored-row cell', async () => {
  await mutate(LC_PATH,
    ".eq('state', 'removed')\n    .is('claimed_at', null)\n    .not('removed_at', 'is', null)",
    ".is('claimed_at', null)\n    .not('removed_at', 'is', null)",
    'M-1',
    async (mlc) => {
      const db = makeDb({ demo_vendors: [vendor({ state: 'engaged', active: true, discover_eligible: true, removed_at: ago(30) })] });
      const r = await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.strictEqual(r.purged, 0);
    });
});

await ta('M-2 · dropping the sunset leg\'s discover_eligible conjunction reddens the re-granted cell', async () => {
  await mutate(LC_PATH,
    ".eq('discover_eligible', false)\n    .not('sunset_at', 'is', null)",
    ".not('sunset_at', 'is', null)",
    'M-2',
    async (mlc) => {
      const db = makeDb({ demo_vendors: [vendor({ state: 'expired', active: true, discover_eligible: true, removed_at: null, sunset_at: ago(30) })] });
      const r = await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.strictEqual(r.purged, 0);
    });
});

await ta('M-3 · dropping the claimed guard reddens the claimed-exclusion cell', async () => {
  await mutate(LC_PATH,
    ".neq('state', 'removed')\n    .is('claimed_at', null)",
    ".neq('state', 'removed')",
    'M-3',
    async (mlc) => {
      const db = makeDb({ demo_vendors: [vendor({ state: 'claimed', active: true, discover_eligible: false, claimed_at: ago(2), removed_at: null, sunset_at: ago(30) })] });
      const r = await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.strictEqual(r.purged, 0);
    });
});

await ta('M-4 · letting an unconfirmed asset through reddens the block-and-retry cell', async () => {
  await mutate(LC_PATH,
    '    if (failures.length) {',
    '    if (false) {',
    'M-4',
    async (mlc) => {
      const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_ORPHAN] })] });
      const r = await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.strictEqual(r.purged, 0);
      assert.strictEqual(db._tables.demo_vendors.length, 1);
    });
});

await ta('M-5 · skipping the Cloudinary destroy entirely reddens the asset cells', async () => {
  await mutate(LC_PATH,
    '        d = await destroy(a.public_id);',
    '        d = { ok: true, result: \'ok\' };',
    'M-5',
    async (mlc) => {
      const db = makeDb({ demo_vendors: [vendor()] });
      const d = destroyAllOk();
      await mlc.runPurgeSweep(db, NOW, { destroy: d });
      assert.deepStrictEqual(d.seen, ['demo_vendors/a/p1'], 'the destroy was never called');
    });
});

await ta('M-6 · turning the kill switch into a horizon reddens the zero cell', async () => {
  await mutate(LC_PATH,
    '  if (days === 0) {',
    '  if (days === -1) {',
    'M-6',
    async (mlc) => {
      const db = makeDb({
        admin_config: [{ key: 'demo.purge_resurrect_days', value: '0' }],
        demo_vendors: [vendor()],
      });
      const r = await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.strictEqual(r.disabled, true);
      assert.strictEqual(db._tables.demo_vendors.length, 1);
    });
});

await ta('M-7 · dropping the prospect unlink reddens the dangling-ref cell', async () => {
  await mutate(LC_PATH,
    "    .update({ demo_vendor_ref: null })\n    .eq('demo_vendor_ref', row.id)",
    "    .update({ demo_vendor_ref: null })\n    .eq('demo_vendor_ref', '__never__')",
    'M-7',
    async (mlc) => {
      const db = makeDb({
        demo_vendors: [vendor()],
        prospects: [{ id: 'p-1', phone: '919888294440', state: 'templated', demo_vendor_ref: 'demo-1' }],
      });
      await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.strictEqual(db._tables.prospects[0].demo_vendor_ref, null);
    });
});

await ta('M-8 · accepting any result as gone reddens the destroyer\'s contract cells', async () => {
  await mutate(CL_PATH,
    "  if (result === 'ok' || result === 'not found') {",
    '  if (true) {',
    'M-8',
    async (_mlc, mcloud) => {
      stubFetch(async () => ({ ok: true, json: async () => ({ result: 'error' }) }));
      const r = await mcloud.destroyVerified('a/b');
      restoreFetch();
      assert.strictEqual(r.ok, false);
    });
});

await ta('M-9 · dropping the status check reddens the 401 cell', async () => {
  await mutate(CL_PATH,
    '  if (!res.ok) {\n    return { ok: false, reason: `http_${res.status}`, detail: null, public_id: publicId };',
    '  if (false) {\n    return { ok: false, reason: `http_${res.status}`, detail: null, public_id: publicId };',
    'M-9',
    async (_mlc, mcloud) => {
      stubFetch(async () => ({ ok: false, status: 401, json: async () => ({ result: 'ok' }) }));
      const r = await mcloud.destroyVerified('a/b');
      restoreFetch();
      assert.strictEqual(r.ok, false);
    });
});

await ta('M-10 · a leg tally that ignores the resolver reddens the witness cells', async () => {
  await mutate(LC_PATH,
    "if (d && d.ok) { confirmed++; byLeg[a.resolved_by] = (byLeg[a.resolved_by] || 0) + 1; }",
    "if (d && d.ok) { confirmed++; byLeg.stored_id = (byLeg.stored_id || 0) + 1; }",
    'M-10',
    async (mlc) => {
      const db = makeDb({ demo_vendors: [vendor({ photos: [PHOTO_PARSE] })] });
      const r = await mlc.runPurgeSweep(db, NOW, { destroy: destroyAllOk() });
      assert.deepStrictEqual(r.assets_by_leg, { url_parse: 1 });
    });
});

// ── close ──────────────────────────────────────────────────────────────────
console.log(`\n══ b08_p6_purge_bench: ${pass} passed, ${fail} failed, 0 skipped ══`);
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(2) /* F-39.67: an unexpected throw is an ERROR, never a FAIL */; });
