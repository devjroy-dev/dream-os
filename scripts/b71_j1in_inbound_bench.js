#!/usr/bin/env node
'use strict';
// scripts/b71_j1in_inbound_bench.js — J1-IN · THE INBOUND ARM (F-42.69).
// CE-42 seat E, packet 4a's last. Cut at dream-os 03c9183.
//
// BENCH NUMBER DERIVED, NOT CLAIMED: `ls scripts/ | grep -E '^b(69|70|71)_'`
// returned empty at the cut, and b69 is named in seat E3's own relay, so this
// takes b71 and leaves b69/b70 clear. The chair may re-allocate.
//
// ═══ BOTH WAYS ═══════════════════════════════════════════════════════════════
// Every cell below is RED at 03c9183 untouched and GREEN at the cured tree. The
// proof is in the delivery: `git stash` the four source paths, run, see the reds
// by name, `git stash pop`, run, see green. A cell that cannot go red is a cell
// that proves the harness works and nothing else.
//
// ═══ WHAT IS AND IS NOT MOCKED ═══════════════════════════════════════════════
// The supabase stub answers ONLY the PostgREST chains these arms actually build,
// and it answers them over REAL row shapes. It is not a re-implementation of the
// arms: every assertion drives production source. `leads.js` is GUARDED and is
// therefore driven, never stubbed — `createLead`/`updateLead` run for real
// against the stub's tables, which is what makes cell 5 (the legacy bare-ten row)
// a statement about the estate's own dedupe rather than about this file.

const assert = require('assert');

let PASS = 0; const FAILS = [];
function cell(name, fn) {
  return Promise.resolve().then(fn).then(
    () => { PASS++; console.log(`  GREEN  ${name}`); },
    (e) => { FAILS.push(name); console.log(`  RED    ${name}\n         ${e && e.message}`); },
  );
}

// ── the stub ─────────────────────────────────────────────────────────────────
function makeDb(tables) {
  const db = JSON.parse(JSON.stringify(tables));
  db.__writes = [];
  function q(name) {
    let rows = (db[name] || []).slice();
    let mode = 'select'; let patch = null;
    const api = {
      select() { return api; },
      insert(r) {
        mode = 'insert';
        const row = Object.assign({ id: `${name}-${(db[name] || []).length + 1}` }, r);
        (db[name] = db[name] || []).push(row);
        db.__writes.push({ table: name, op: 'insert', row });
        rows = [row];
        return api;
      },
      update(p) { mode = 'update'; patch = p; return api; },
      eq(col, val) { rows = rows.filter((r) => r[col] === val); return api; },
      neq(col, val) { rows = rows.filter((r) => r[col] !== val); return api; },
      is(col, val) { rows = rows.filter((r) => (val === null ? r[col] == null : r[col] === val)); return api; },
      like(col, pat) {
        const suf = String(pat).replace(/^%/, '');
        rows = rows.filter((r) => typeof r[col] === 'string' && r[col].endsWith(suf));
        return api;
      },
      order(col, opts) {
        const asc = !(opts && opts.ascending === false);
        rows.sort((a, b) => {
          const av = a[col] == null ? '' : String(a[col]);
          const bv = b[col] == null ? '' : String(b[col]);
          return asc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        return api;
      },
      limit(n) { rows = rows.slice(0, n); return api; },
      // ⚠ ALL THREE TERMINALS RUN `finish()`. The first cut had it only on
      // `then`, so an `.update(...).eq(...).select().single()` chain — which is
      // exactly what `updateLead` and `updateProspect` build — reported success
      // and wrote NOTHING. Two cells went red over a harness defect and both
      // looked like production defects. A stub whose writes depend on which
      // terminal the caller happens to use proves nothing about either.
      then(res) { return Promise.resolve(finish()).then(res); },
      maybeSingle() { const r = finish(); return Promise.resolve({ data: r.data[0] || null, error: null }); },
      single() { const r = finish(); return Promise.resolve({ data: r.data[0] || null, error: r.data[0] ? null : { message: 'no row' } }); },
    };
    function finish() {
      if (mode === 'update') {
        for (const r of rows) {
          Object.assign(r, patch);
          db.__writes.push({ table: name, op: 'update', id: r.id, patch });
        }
      }
      return { data: rows, error: null };
    }
    return api;
  }
  return { from: q, __db: db };
}

const INTRO_BASE = {
  id: 'intro-1', vendor_id: 'V1', recipient_name: 'Anjali', where_met: 'Verma wedding',
  page_code: 'DEV440', status: 'delivered', wamid: 'wamid.A', sent_at: '2026-09-09T10:00:00Z',
  stopped_at: null, created_at: '2026-09-09T09:00:00Z',
};

(async () => {
  const intro = require('../src/lib/vendor/introductions');
  const prospects = require('../src/lib/prospects');

  console.log('\nb71 · J1-IN · THE INBOUND ARM (F-42.69)\n');

  // ── 1 · F-42.90 · THE COLUMN NOW HAS A STORED FORM ─────────────────────────
  // RED at 03c9183: `stageIntroduction` stored `trim(...)`, so the three spellings
  // were three values and `alreadyIntroduced`'s `.eq` and 0161's UNIQUE both saw
  // three different handsets. This is R-41.11's no-follow-up law being real.
  await cell('1 · stage stores E.164 for every spelling a vendor can type', async () => {
    for (const typed of ['+918757788550', '8757788550', '+91 87577 88550', '918757788550']) {
      const db = makeDb({ introductions: [] });
      const out = await intro.stageIntroduction(db, {
        vendor: { id: 'V1', routing_handle: 'dev440', business_name: 'Mira' },
        draft: { recipient_phone: typed, recipient_name: 'Anjali', where_met: 'Verma wedding' },
      });
      assert.strictEqual(out.ok, true, `stage refused ${typed}`);
      assert.strictEqual(out.row.recipient_phone, '+918757788550',
        `${typed} stored as ${out.row.recipient_phone}, not +918757788550`);
    }
  });

  // ── 2 · the un-normalisable is refused with the EXISTING vetoed ask ─────────
  await cell('2 · a non-number is refused NO_NUMBER, zero new bytes', async () => {
    const db = makeDb({ introductions: [] });
    const out = await intro.stageIntroduction(db, {
      vendor: { id: 'V1', routing_handle: 'DEV440', business_name: 'Mira' },
      draft: { recipient_phone: 'call me', recipient_name: 'Anjali', where_met: 'Verma wedding' },
    });
    assert.strictEqual(out.ok, false);
    assert.strictEqual(out.code, intro.REFUSE.NO_NUMBER);
    assert.strictEqual(out.ask, intro.SLOT_ASKS.recipient_phone, 'must reuse the vetoed ask');
    assert.strictEqual(db.__db.introductions.length, 0, 'nothing may be written');
  });

  // ── 3 · THE MATCH IS BY SUFFIX, over a legacy row stored raw ───────────────
  await cell('3 · her bare-digit inbound matches a legacy raw-stored row', async () => {
    const db = makeDb({ introductions: [Object.assign({}, INTRO_BASE, { recipient_phone: '8757788550' })] });
    const row = await intro.matchInboundIntroduction(db, '918757788550');
    assert.ok(row, 'suffix match found nothing — equality would not have matched either');
    assert.strictEqual(row.id, 'intro-1');
  });

  // ── 4 · a row that never reached her is NOT a match ────────────────────────
  await cell('4 · staged / dark / declined / failed rows never match', async () => {
    for (const status of ['staged', 'dark', 'declined', 'failed', 'queued']) {
      const db = makeDb({ introductions: [Object.assign({}, INTRO_BASE, {
        recipient_phone: '+918757788550', status, wamid: null, sent_at: null })] });
      const row = await intro.matchInboundIntroduction(db, '918757788550');
      assert.strictEqual(row, null, `status=${status} must not match — row-presence is not a send`);
    }
  });

  // ── 5 · §6(a) · updateLead on the LEGACY BARE-TEN row, never a duplicate ───
  // The acceptance cell that fails on real data without the suffix pre-resolve:
  // `createLead`'s dedupe is exact equality over a mixed register (F-42.70).
  await cell('5 · a legacy bare-ten lead is updated, not duplicated', async () => {
    const db = makeDb({
      introductions: [Object.assign({}, INTRO_BASE, { recipient_phone: '+918757788550' })],
      leads: [{ id: 'lead-old', vendor_id: 'V1', phone: '8757788550', name: null,
                notes: null, raw_message: null, source: 'discover', state: 'new',
                deleted_at: null, created_at: '2026-09-01T00:00:00Z' }],
      clients: [],
    });
    const out = await intro.handleIntroductionInbound(db, {
      from: '918757788550', text: 'Hi, saw your work', isStop: false,
    });
    assert.strictEqual(out.action, 'introduction_lead');
    assert.strictEqual(out.leadId, 'lead-old', 'must land on the legacy row');
    assert.strictEqual(out.created, false, 'a duplicate lead was minted');
    assert.strictEqual(db.__db.leads.length, 1, `leads table holds ${db.__db.leads.length} rows, expected 1`);
    const held = db.__db.leads[0];
    assert.strictEqual(held.notes, 'Met at Verma wedding');
    assert.strictEqual(held.name, 'Anjali');
    assert.strictEqual(held.source, 'discover', 'source must NOT be rewritten — she arrived through Discover');
  });

  // ── 6 · a fresh number gets exactly one lead, source=introduction ──────────
  await cell('6 · a fresh reply creates one introduction lead, notes carry where_met', async () => {
    const db = makeDb({
      introductions: [Object.assign({}, INTRO_BASE, { recipient_phone: '+918757788550' })],
      leads: [], clients: [],
    });
    const out = await intro.handleIntroductionInbound(db, {
      from: '918757788550', text: 'Hi, saw your work', isStop: false,
    });
    assert.strictEqual(out.created, true);
    assert.strictEqual(db.__db.leads.length, 1);
    const L = db.__db.leads[0];
    assert.strictEqual(L.source, 'introduction');
    assert.strictEqual(L.notes, 'Met at Verma wedding');
    assert.strictEqual(L.phone, '+918757788550');
    assert.strictEqual(L.raw_message, 'Hi, saw your work');

    // and a SECOND reply updates, never duplicates
    const again = await intro.handleIntroductionInbound(db, {
      from: '918757788550', text: 'still interested', isStop: false,
    });
    assert.strictEqual(again.created, false, 'the second reply minted a second lead');
    assert.strictEqual(db.__db.leads.length, 1, 'second reply duplicated the lead');
  });

  // ── 7 · TWO VENDORS, ONE HANDSET — most recent that reached her wins ───────
  await cell('7 · two vendors introduced to one number → one lead, newest row', async () => {
    const db = makeDb({
      introductions: [
        Object.assign({}, INTRO_BASE, { id: 'intro-old', vendor_id: 'V1',
          recipient_phone: '+918757788550', sent_at: '2026-09-01T10:00:00Z', where_met: 'Verma wedding' }),
        Object.assign({}, INTRO_BASE, { id: 'intro-new', vendor_id: 'V2',
          recipient_phone: '+918757788550', sent_at: '2026-09-09T10:00:00Z', where_met: 'Sharma sangeet' }),
      ],
      leads: [], clients: [],
    });
    const out = await intro.handleIntroductionInbound(db, {
      from: '918757788550', text: 'hello', isStop: false,
    });
    assert.strictEqual(out.introductionId, 'intro-new', 'the older row won');
    assert.strictEqual(out.vendorId, 'V2');
    assert.strictEqual(db.__db.leads.length, 1, 'one message must be one lead');
    assert.strictEqual(db.__db.leads[0].notes, 'Met at Sharma sangeet');
  });

  // ── 8 · HER STOP · the row is marked and NO prospect is born ───────────────
  // The Fork A cell. RED at 03c9183 twice over: `stopped_at` did not exist, and
  // `prospects.js:185` minted her on the way past.
  await cell('8 · STOP marks stopped_at and creates NO prospect row', async () => {
    const db = makeDb({
      introductions: [Object.assign({}, INTRO_BASE, { recipient_phone: '+918757788550' })],
      prospects: [], leads: [], clients: [],
    });
    const out = await prospects.handleMarketingInbound({
      supabase: db, from: '918757788550', text: 'STOP', messageId: 'm1',
      sendWa: async () => { throw new Error('nothing may be sent to her'); },
    });
    assert.strictEqual(out.action, 'introduction_stopped');
    assert.ok(db.__db.introductions[0].stopped_at, 'stopped_at was not stamped');
    assert.strictEqual(db.__db.prospects.length, 0,
      `a prospect row was minted (${db.__db.prospects.length}) — Fork A broken`);
    assert.strictEqual(db.__db.leads.length, 0, 'STOP must not make a lead');
  });

  // ── 9 · she writes again after STOP: no lead, and still no prospect ────────
  await cell('9 · an inbound after STOP makes no lead and still no prospect', async () => {
    const db = makeDb({
      introductions: [Object.assign({}, INTRO_BASE, {
        recipient_phone: '+918757788550', stopped_at: '2026-09-09T12:00:00Z' })],
      prospects: [], leads: [], clients: [],
    });
    const out = await prospects.handleMarketingInbound({
      supabase: db, from: '918757788550', text: 'actually wait', messageId: 'm2',
      sendWa: async () => { throw new Error('nothing may be sent to her'); },
    });
    assert.strictEqual(out.action, 'noop_introduction_stopped');
    assert.strictEqual(db.__db.leads.length, 0);
    assert.strictEqual(db.__db.prospects.length, 0, 'falling through would have minted her');
  });

  // ── 10 · AN UN-INTRODUCED NUMBER FALLS THROUGH, BYTE-UNCHANGED ────────────
  // The regression cell. The old path must run exactly as it did: STOP still
  // opts out, still creates the prospect, still sends the one courtesy line.
  await cell('10 · an un-introduced STOP runs today\'s arm unchanged', async () => {
    const db = makeDb({ introductions: [], prospects: [], conversations: [], messages: [] });
    let sentTo = null;
    const out = await prospects.handleMarketingInbound({
      supabase: db, from: '919999000011', text: 'STOP', messageId: 'm3',
      sendWa: async ({ to }) => { sentTo = to; return { sent: true }; },
      copy: () => 'the vetoed opt-out confirmation',
    });
    assert.strictEqual(out.action, 'opted_out', `fell into ${out.action}`);
    assert.strictEqual(db.__db.prospects.length, 1, 'the prospect arm no longer runs');
    assert.strictEqual(db.__db.prospects[0].state, 'opted_out');
    assert.strictEqual(sentTo, '919999000011', 'the courtesy confirmation stopped going out');
  });

  console.log(`\nb71: ${PASS}/${PASS + FAILS.length} green`);
  if (FAILS.length) {
    console.log(`RED BY NAME: ${FAILS.join(' | ')}`);
    process.exit(1);
  }
  process.exit(0);
})().catch((e) => { console.error('bench threw:', e); process.exit(1); });
