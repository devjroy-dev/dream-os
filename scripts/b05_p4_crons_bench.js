#!/usr/bin/env node
// scripts/b05_p4_crons_bench.js — TDW_05 P4 (CE-63). THE CRONS BENCH.
//
// NEW CONSTRUCTION. Drives the REAL production functions — routeNudge, routeBriefing,
// matchNudgeWord, isNudgeOptedOut, setNudgeOptout, the real sendWa gate, the real
// template registry, waNumberFor — against fakes at the EDGES ONLY (supabase, the
// transport). No stub stands in for a function under test. Every assertion below
// fails if the corresponding cure is reverted; that is proven by mutation, not
// asserted — see scripts note at the foot and the ZIP header's both-ways table.
//
// WHAT IT PROVES
//   §1  the nudge fires on its predicate (both lanes, in-window and out)
//   §2  nudge_optout is honoured, and honoured PER LANE (the makeup-artist case)
//   §3  STOP MORNINGS is nudge-class ONLY — narrow matcher, bare STOP untouched
//   §4  START MORNINGS resumes, and the gate needs no change to see it
//   §5  STOP alone is still the full stop's word — terminal machinery byte-untouched
//   §6  F4's window posture, both sides of the branch
//   §7  the F5 rider — re-scoped grep-zero, and the pair resolves per lane
//   §8  the mis-route is cured — a bride link can no longer be a vendor link
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e && e.message}`); fail++; }
};
const ta = async (name, fn) => {
  try { await fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e && e.message}`); fail++; }
};
const H = s => console.log(`\n── ${s} ──`);

// ── the supabase fake — edge only ───────────────────────────────────────────
// Faithful to the shapes the code under test actually calls. `rows` is the whole
// database. Deliberately NOT a mock of the functions being proven.
function fakeSupabase(seed = {}) {
  const db = { nudge_optout: [], couples: [], prospects: [], ...seed };
  const calls = [];
  const table = (name) => {
    let filters = [];
    const api = {
      select() { return api; },
      eq(col, val) { filters.push([col, val]); return api; },
      limit() { return api; },
      order() { return api; },
      not() { return api; },
      lt() { return api; },
      async maybeSingle() {
        const hit = (db[name] || []).find(r => filters.every(([c, v]) => r[c] === v));
        return { data: hit || null, error: null };
      },
      async single() {
        const hit = (db[name] || []).find(r => filters.every(([c, v]) => r[c] === v));
        return { data: hit || null, error: hit ? null : { message: 'no row' } };
      },
      insert(row) {
        calls.push({ op: 'insert', table: name, row });
        const stored = { id: `id_${(db[name] || []).length + 1}`, ...row };
        (db[name] = db[name] || []).push(stored);
        return { select: () => ({ single: async () => ({ data: stored, error: null }) }) };
      },
      upsert(row, opts) {
        calls.push({ op: 'upsert', table: name, row, opts });
        const keys = String(opts?.onConflict || 'id').split(',').map(s => s.trim());
        const i = (db[name] || []).findIndex(r => keys.every(k => r[k] === row[k]));
        if (i >= 0) db[name][i] = { ...db[name][i], ...row };
        else (db[name] = db[name] || []).push({ id: `id_${db[name].length + 1}`, ...row });
        const stored = db[name].find(r => keys.every(k => r[k] === row[k]));
        return { select: () => ({ single: async () => ({ data: stored, error: null }) }) };
      },
      update(patch) {
        calls.push({ op: 'update', table: name, patch });
        // FAITHFUL TO PostgREST'S REAL SHAPE: .update().eq() is both awaitable AND
        // chainable into .select().single() — prospects.js:82-85 uses the chained form,
        // brideCron's stamper uses the awaited one. A fake that supported only the
        // awaited form failed four §9 cells; the fix is fidelity, never a stub.
        const apply = (col, val) => {
          const r = (db[name] || []).find(x => x[col] === val);
          if (r) Object.assign(r, patch);
          return r;
        };
        return {
          eq(col, val) {
            const r = apply(col, val);
            const res = { data: r ? [r] : [], error: null };
            return {
              select: () => ({
                single:      async () => ({ data: r || null, error: r ? null : { message: 'no row' } }),
                maybeSingle: async () => ({ data: r || null, error: null }),
              }),
              then: (res1, rej) => Promise.resolve(res).then(res1, rej),
            };
          },
        };
      },
    };
    return api;
  };
  return { from: table, __db: db, __calls: calls };
}

const seedOptout = (phone, lane, state = 'opted_out') =>
  ({ id: `o_${phone}_${lane}`, phone, lane, state, source: 'inbound_stop_mornings' });

// ── modules under test (real) ───────────────────────────────────────────────
const { matchNudgeWord, isNudgeOptedOut, setNudgeOptout } = require('../src/lib/nudgeOptout');
const { getNudgeCopy } = require('../src/lib/nudgeCopy');
const { routeNudge, nudgedThisIstDay } = require('../src/brideCron');
const { routeBriefing } = require('../src/cron');
const { sendWa, WaNudgeOptedOutError, WaOptedOutError } = require('../src/lib/sendWa');
const { waNumberFor, VENDOR_WA_NUMBER, BRIDE_WA_NUMBER } = require('../src/lib/waNumbers');
const { getTemplate, isApproved } = require('../src/lib/templates');

(async () => {

console.log('\n════════ b05_p4_crons_bench — TDW_05 P4 (CE-63) ════════');

// ══════════════════════════════════════════════════════════════════════════
H('§1 — THE NUDGE FIRES ON ITS PREDICATE');

await ta('§1.1 bride, in-window ⇒ free-form sent on the bride line', async () => {
  const sent = [];
  const r = await routeNudge(
    { couple: { id: 'c1' }, user: { phone: '+919999900001', name: 'Vera' }, supabase: fakeSupabase() },
    { buildNudge: async () => ({ send: true, message: 'morning' }),
      sendWa: async (o) => { sent.push(o); },
      isNudgeOptedOut: async () => false },
  );
  assert.strictEqual(r.action, 'sent');
  assert.strictEqual(r.mode, 'text');
  assert.strictEqual(sent[0].line, 'bride');
  assert.strictEqual(sent[0].windowOpen, true);
});

await ta('§1.2 vendor, in-window ⇒ free-form sent on the VENDOR line (was direct transport)', async () => {
  const sent = [];
  const r = await routeBriefing(
    { vendor: { id: 'v1' }, user: { phone: '+919999900002', name: 'Ishaan' }, supabase: fakeSupabase() },
    { buildBriefing: async () => ({ send: true, message: 'your day' }),
      sendWa: async (o) => { sent.push(o); },
      isNudgeOptedOut: async () => false },
  );
  assert.strictEqual(r.action, 'sent');
  assert.strictEqual(sent[0].line, 'vendor');
  assert.strictEqual(sent[0].nudgeClass, true, 'the briefing must declare itself nudge-class');
});

await ta('§1.3 the IST-day guard suppresses a second run inside the same IST day', async () => {
  const now = new Date('2026-07-23T04:00:00Z');            // 09:30 IST, 23rd
  const r = await routeNudge(
    { couple: { id: 'c1', nudge_sent_at: '2026-07-23T02:30:00Z' },   // 08:00 IST, same day
      user: { phone: '+919999900001' }, supabase: fakeSupabase() },
    { buildNudge: async () => { throw new Error('buildNudge must NOT run — the guard fires first'); },
      sendWa: async () => {}, isNudgeOptedOut: async () => false, now },
  );
  assert.strictEqual(r.reason, 'already_nudged_today');
});

t('§1.4 the guard boundary is IST, not UTC (21:00Z on the 22nd IS the 23rd in IST)', () => {
  const now = new Date('2026-07-23T04:00:00Z');
  assert.strictEqual(nudgedThisIstDay('2026-07-22T21:00:00Z', now), true,
    'a UTC day boundary would wave this duplicate through');
  assert.strictEqual(nudgedThisIstDay('2026-07-22T18:00:00Z', now), false);
});

await ta('§1.5 a successful send STAMPS nudge_sent_at (0086 ADOPT, wired not merely ruled)', async () => {
  const sb = fakeSupabase({ couples: [{ id: 'c9', nudge_sent_at: null }] });
  await routeNudge(
    { couple: { id: 'c9' }, user: { phone: '+919999900009' }, supabase: sb },
    { buildNudge: async () => ({ send: true, message: 'm' }), sendWa: async () => {}, isNudgeOptedOut: async () => false },
  );
  const upd = sb.__calls.find(c => c.op === 'update' && c.table === 'couples');
  assert.ok(upd, 'expected an update on couples');
  assert.ok(upd.patch.nudge_sent_at, 'expected nudge_sent_at in the patch');
});

// ══════════════════════════════════════════════════════════════════════════
H('§2 — nudge_optout IS HONOURED, AND HONOURED PER LANE');

await ta('§2.1 a bride row suppresses the bride nudge BEFORE buildNudge runs', async () => {
  const sb = fakeSupabase({ nudge_optout: [seedOptout('919999900001', 'bride')] });
  const r = await routeNudge(
    { couple: { id: 'c1' }, user: { phone: '+919999900001' }, supabase: sb },
    { buildNudge: async () => { throw new Error('buildNudge must NOT run for a paused bride'); },
      sendWa: async () => {} },
  );
  assert.strictEqual(r.reason, 'nudge_opted_out');
});

await ta('§2.2 *** THE MAKEUP ARTIST *** — same number, bride paused, VENDOR STILL BRIEFED', async () => {
  const PHONE = '+918757788550';
  const sb = fakeSupabase({ nudge_optout: [seedOptout('918757788550', 'bride')] });

  const bride = await routeNudge(
    { couple: { id: 'c1' }, user: { phone: PHONE }, supabase: sb },
    { buildNudge: async () => ({ send: true, message: 'm' }), sendWa: async () => {} },
  );
  assert.strictEqual(bride.reason, 'nudge_opted_out', 'her bride nudge must be paused');

  const sent = [];
  const vendor = await routeBriefing(
    { vendor: { id: 'v1' }, user: { phone: PHONE, name: 'Nikita' }, supabase: sb },
    { buildBriefing: async () => ({ send: true, message: 'your day' }), sendWa: async (o) => { sent.push(o); } },
  );
  assert.strictEqual(vendor.action, 'sent', 'her VENDOR briefing is her livelihood and must still arrive');
  assert.strictEqual(sent.length, 1);
});

await ta('§2.3 the sendWa gate itself refuses a nudge-class send to a paused number', async () => {
  process.env.VENDOR_WHATSAPP_NUMBER = 'whatsapp:+919999999999';
  const sb = fakeSupabase({ nudge_optout: [seedOptout('919999900003', 'vendor')] });
  let threw = null, dispatched = 0;
  try {
    await sendWa(
      { line: 'vendor', to: '+919999900003', text: 'hi', windowOpen: true, supabase: sb, nudgeClass: true },
      { sendText: async () => { dispatched++; }, isOptedOut: async () => false },
    );
  } catch (e) { threw = e; }
  assert.ok(threw instanceof WaNudgeOptedOutError, `expected WaNudgeOptedOutError, got ${threw && threw.name}`);
  assert.strictEqual(threw.code, 'nudge_opted_out');
  assert.strictEqual(dispatched, 0, 'NOTHING may reach the transport on a refusal');
});

await ta('§2.4 the SAME send WITHOUT nudgeClass is byte-identical to pre-cure (opt-in only)', async () => {
  const sb = fakeSupabase({ nudge_optout: [seedOptout('919999900003', 'vendor')] });
  let dispatched = 0;
  await sendWa(
    { line: 'vendor', to: '+919999900003', text: 'invoice ready', windowOpen: true, supabase: sb },
    { sendText: async () => { dispatched++; }, isOptedOut: async () => false },
  );
  assert.strictEqual(dispatched, 1, 'a NON-nudge send to a nudge-paused number must still go');
});

await ta('§2.5 the full stop still outranks: both flags set ⇒ WaOptedOutError, the stronger fact', async () => {
  const sb = fakeSupabase({ nudge_optout: [seedOptout('919999900004', 'vendor')] });
  let threw = null;
  try {
    await sendWa(
      { line: 'vendor', to: '+919999900004', text: 'x', windowOpen: true, supabase: sb, nudgeClass: true },
      { sendText: async () => {}, isOptedOut: async () => true },
    );
  } catch (e) { threw = e; }
  assert.ok(threw instanceof WaOptedOutError, 'the cross-line full stop must win');
  assert.strictEqual(threw.code, 'opted_out');
});

// ══════════════════════════════════════════════════════════════════════════
H('§3 — STOP MORNINGS IS NUDGE-CLASS ONLY (the matcher is the safety property)');

t('§3.1 the qualified phrase matches, in every casing and punctuation', () => {
  for (const s of ['STOP MORNINGS', 'stop mornings', 'Stop Mornings!', '  STOP   MORNINGS  ', 'stop morning'])
    assert.strictEqual(matchNudgeWord(s), 'stop', `expected stop for ${JSON.stringify(s)}`);
});

t('§3.2 *** BARE "STOP" DOES NOT MATCH *** — it is the full stop\'s word', () => {
  for (const s of ['STOP', 'stop', 'Stop.', 'STOP!', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'STOPALL'])
    assert.strictEqual(matchNudgeWord(s), null,
      `${JSON.stringify(s)} must fall through to the terminal machinery, not be downgraded to a pause`);
});

t('§3.3 near-misses and prose do not match (exactly two tokens, or nothing)', () => {
  for (const s of ['stop mornings please', 'please stop mornings', 'mornings', 'morning stop',
                   'stop everything', 'good morning', '', null, undefined])
    assert.strictEqual(matchNudgeWord(s), null, `${JSON.stringify(s)} must not match`);
});

await ta('§3.4 STOP MORNINGS writes nudge_optout and touches NOTHING else', async () => {
  const sb = fakeSupabase();
  await setNudgeOptout({ supabase: sb, phone: '+919999900005', lane: 'bride', state: 'opted_out' });
  const tables = [...new Set(sb.__calls.map(c => c.table))];
  assert.deepStrictEqual(tables, ['nudge_optout'], `wrote to ${tables.join(',')} — must be nudge_optout alone`);
  assert.strictEqual(sb.__db.prospects.length, 0, 'prospects must be untouched — that is the full stop\'s table');
  assert.strictEqual(sb.__db.nudge_optout[0].phone, '919999900005', 'phone must be stored NORMALIZED (no +)');
  assert.strictEqual(sb.__db.nudge_optout[0].lane, 'bride');
});

t('§3.5 the confirmation SAYS it is not a full STOP (the ratified point of the line)', () => {
  const line = getNudgeCopy('opt_out_confirmation');
  assert.ok(/full STOP/i.test(line), 'the line must state it is not a full STOP');
  assert.ok(/START MORNINGS/i.test(line), 'the line must name the way back');
});

// ══════════════════════════════════════════════════════════════════════════
H('§4 — START MORNINGS RESUMES, AND THE GATE NEEDS NO CHANGE TO SEE IT');

t('§4.1 the resume phrase matches, synonyms included', () => {
  for (const s of ['START MORNINGS', 'start mornings', 'RESUME MORNINGS', 'unpause mornings'])
    assert.strictEqual(matchNudgeWord(s), 'start', `expected start for ${JSON.stringify(s)}`);
  assert.strictEqual(matchNudgeWord('START'), null, 'bare START is not this module\'s word either');
});

await ta('§4.2 resume flips the row to state=resumed on the SAME (phone,lane) key', async () => {
  const sb = fakeSupabase({ nudge_optout: [seedOptout('919999900006', 'bride')] });
  await setNudgeOptout({ supabase: sb, phone: '+919999900006', lane: 'bride', state: 'resumed' });
  assert.strictEqual(sb.__db.nudge_optout.length, 1, 'upsert on (phone,lane) — never a second row');
  assert.strictEqual(sb.__db.nudge_optout[0].state, 'resumed');
});

await ta('§4.3 *** ZERO GATE CHANGE *** — the positive read sees the resumed row as not-paused', async () => {
  const sb = fakeSupabase({ nudge_optout: [seedOptout('919999900006', 'bride', 'resumed')] });
  assert.strictEqual(await isNudgeOptedOut({ supabase: sb, phone: '+919999900006', lane: 'bride' }), false);
  const r = await routeNudge(
    { couple: { id: 'c1' }, user: { phone: '+919999900006' }, supabase: sb },
    { buildNudge: async () => ({ send: true, message: 'm' }), sendWa: async () => {} },
  );
  assert.strictEqual(r.action, 'sent', 'a resumed bride must receive her nudge again');
});

// ══════════════════════════════════════════════════════════════════════════
H('§5 — STOP ALONE: THE TERMINAL MACHINERY IS BYTE-UNTOUCHED');

t('§5.1 prospects.js still owns the full stop, unedited by this sitting', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/prospects.js'), 'utf8');
  assert.ok(src.includes("const STOP_WORDS  = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'STOPALL']);"),
    'the full-stop word set must be unchanged');
  assert.ok(!src.includes('nudgeOptout') && !src.includes('nudge_optout'),
    'the full-stop module must not have learned about the nudge class');
});

t('§5.2 the cores reach the full stop through ONE hop, never directly (F-05.25 micro)', () => {
  // AMENDED AT THE CLOSING MICRO. Before F-05.25 this cell asserted NO coupling at
  // all, which was right then and would now pass for the WRONG REASON — the cores
  // do reach prospects.js, deliberately, via fullStop.js. Left unamended it would
  // be a cell surviving its own subject: the vacuous class this bench has already
  // convicted itself of once. What must hold now is the SHAPE of the coupling.
  for (const f of ['src/lib/brideInbound.js', 'src/lib/vendorInbound.js']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/require\(['"]\.\/prospects['"]\)/.test(src),
      `${f} must NOT import prospects directly — one hop, through fullStop.js`);
    assert.ok(src.includes("require('./fullStop')"), `${f} must carry the full-stop branch`);
    assert.ok(src.includes("require('./nudgeOptout')"), `${f} must carry the nudge branch`);
  }
  // COMMENT-STRIPPED, for the fourth time this arc: the raw file DESCRIBES the very
  // property being asserted ("holds no `.update()` of its own"), so reading it raw
  // convicts the file on its own disclaimer. Assertions read CODE.
  const fsCode = fs.readFileSync(path.join(ROOT, 'src/lib/fullStop.js'), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/\.update\(|\.upsert\(|\.insert\(/.test(fsCode),
    'fullStop.js must hold NO writer of its own — it CALLS the marketing lane\'s pair');
});

t('§5.3 the two lanes carry the SAME branches — BOTH of them — modulo the lane string', () => {
  // EXTENDED AT THE CLOSING MICRO. The first form sliced only from matchNudgeWord to
  // its first `return;`, so the NEW full-stop branch sat outside the guarded region
  // entirely — mutation N10 drifted the vendor lane and this cell stayed GREEN. The
  // slice now runs from the first branch to the last, covering both.
  const grab = (f) => {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const a = src.indexOf('const nudgeWord = matchNudgeWord(trimmedBody);');
    const b = src.indexOf('const fullStopWord = matchFullStopWord(trimmedBody);');
    assert.ok(a > 0 && b > a, `${f} missing a branch, or they are out of order`);
    // The slice must run to the branch's CLOSING BRACE, not to its last statement:
    // mutation N10 appended a comment AFTER that statement and landed outside an
    // end-at-the-statement slice, leaving this cell green on a drifted twin.
    const tail = "if (fullStopWord === 'stop') return;";
    const end = src.indexOf(tail, b);
    assert.ok(end > b, `${f} missing the full-stop branch tail`);
    const close = src.indexOf('\n    }', end);
    assert.ok(close > end, `${f} missing the full-stop branch's closing brace`);
    return src.slice(a, close + '\n    }'.length)
              .replace(/\[bride-webhook\]|\[webhook\]/g, '[LOG]')
              .replace(/'bride'|'vendor'/g, "'LANE'")
              .replace(/lane=bride|lane=vendor/g, 'lane=LANE')
              .replace(/\(bride lane\)|\(vendor lane\)/g, '(LANE lane)');
  };
  assert.strictEqual(grab('src/lib/brideInbound.js'), grab('src/lib/vendorInbound.js'),
    'the twins have drifted — that is how one lane silently loses a cure');
});

// ══════════════════════════════════════════════════════════════════════════
H('§6 — F4: THE WINDOW POSTURE, BOTH SIDES');

t('§6.1 tdw_morning_nudge_vendor is APPROVED and takes two vars', () => {
  const tpl = getTemplate('morning_nudge_vendor');
  assert.strictEqual(tpl.name, 'tdw_morning_nudge_vendor');
  assert.strictEqual(tpl.line, 'vendor');
  assert.strictEqual(isApproved('morning_nudge_vendor'), true);
  assert.deepStrictEqual(tpl.variables, ['name', 'summary']);
});

await ta('§6.2 *** window_closed now ROUTES TO THE TEMPLATE *** (was: logged and dropped)', async () => {
  const sent = [];
  const r = await routeBriefing(
    { vendor: { id: 'v1' }, user: { phone: '+919999900007', name: 'Meera' }, supabase: fakeSupabase() },
    { buildBriefing: async () => ({ send: false, reason: 'window_closed' }),
      sendWa: async (o) => { sent.push(o); }, isNudgeOptedOut: async () => false },
  );
  assert.strictEqual(r.action, 'sent');
  assert.strictEqual(r.mode, 'template');
  assert.strictEqual(sent[0].templateKey, 'morning_nudge_vendor');
  assert.deepStrictEqual(sent[0].vars, ['Meera', getNudgeCopy('vendor_out_of_window_summary')]);
});

await ta('§6.3 other skip reasons still skip — the cure did not widen into a catch-all', async () => {
  for (const reason of ['no_conversation', 'no_inbound_ever', 'briefing_disabled']) {
    const sent = [];
    const r = await routeBriefing(
      { vendor: { id: 'v1' }, user: { phone: '+919999900008' }, supabase: fakeSupabase() },
      { buildBriefing: async () => ({ send: false, reason }),
        sendWa: async (o) => { sent.push(o); }, isNudgeOptedOut: async () => false },
    );
    assert.strictEqual(r.action, 'skip', `${reason} must remain a skip`);
    assert.strictEqual(sent.length, 0, `${reason} must send NOTHING`);
  }
});

t('§6.4 the vendor summary var is ONE LINE (a \\n is a Meta parameter rejection)', () => {
  const v = getNudgeCopy('vendor_out_of_window_summary');
  assert.ok(v && v.length > 0);
  assert.ok(!/[\n\r]/.test(v), 'the template parameter must not contain a line break');
});

t('§6.5 the briefing no longer imports the bypassed transport', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/cron.js'), 'utf8');
  assert.ok(!/require\(['"]\.\/lib\/whatsapp['"]\)/.test(src),
    'a dangling import to the bypassed transport is an invitation to bypass it again');
  assert.ok(src.includes("require('./lib/sendWa')"));
});

t('§6.6 the TZ rewrite preserved the WALL CLOCK — asserted on CODE, expr↔tz PAIRED', () => {
  // Reading the raw file would pass on the header's own disclosure table, which quotes every
  // expression as prose. That is a vacuous assertion and the mutation harness caught it:
  // breaking job 1's expression left this cell GREEN. Comments are stripped, and the check is
  // now on the PAIR — an expression is only correct beside the timezone that makes it correct.
  const code = fs.readFileSync(path.join(ROOT, 'src/cron.js'), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

  const jobs = [];
  const re = /cron\.schedule\(\s*'([^']+)'[\s\S]*?\}\s*,\s*\{\s*\n\s*timezone:\s*'([^']+)'/g;
  let m; while ((m = re.exec(code)) !== null) jobs.push([m[1], m[2]]);

  const expected = [
    ["0 3 * * *",   "Asia/Kolkata"],   // contracts   03:00 IST == 21:30 UTC (was '30 21 * * *')
    ["30 2 * * *",  "UTC"],            // briefing    UNTOUCHED — 02:30 UTC == 08:00 IST
    ["30 * * * *",  "Asia/Kolkata"],   // demo expiry :30 IST     == :00 UTC  (was '0 * * * *')
    ["15 3 * * *",  "Asia/Kolkata"],   // collab      03:15 IST   == 21:45 UTC (was '45 21 * * *')
  ];
  assert.deepStrictEqual(jobs, expected,
    'every cron.schedule must carry its expression AND the timezone that preserves its instant');
  assert.strictEqual(jobs.filter(j => j[1] === 'UTC').length, 1,
    'exactly one job stays on UTC — job 2, the 08:00 IST cadence the founder holds standing');
});

// ══════════════════════════════════════════════════════════════════════════
H('§7 — THE F5 RIDER: THE RE-SCOPED GREP, AND THE PAIR');

t('§7.1 *** GREP-ZERO — the dead sandbox literal is no runtime value in src/** ***', () => {
  let hits = '';
  try { hits = execSync('grep -rn "14787788550" src/ || true', { cwd: ROOT }).toString(); }
  catch (_) {}
  const live = hits.split('\n').filter(Boolean).filter(l => {
    const code = l.slice(l.indexOf(':', l.indexOf(':') + 1) + 1).trim();
    return !code.startsWith('//') && !code.startsWith('*') && !code.startsWith('#');
  });
  assert.strictEqual(live.length, 0,
    `runtime survivors in src/**:\n${live.join('\n')}`);
});

t('§7.2 the surviving src/** hits are ALL comments — the ratified specimen class', () => {
  const hits = execSync('grep -rn "14787788550" src/ || true', { cwd: ROOT })
    .toString().split('\n').filter(Boolean);
  assert.ok(hits.length > 0, 'the taught anti-pattern must SURVIVE, not be scrubbed (CE-63 ①)');
  for (const l of hits) {
    const code = l.slice(l.indexOf(':', l.indexOf(':') + 1) + 1).trim();
    assert.ok(code.startsWith('//'), `not a comment: ${l}`);
  }
});

t('§7.3 the pair is the founder\'s canonical word', () => {
  assert.strictEqual(VENDOR_WA_NUMBER, '917982159047');
  assert.strictEqual(BRIDE_WA_NUMBER,  '917011788380');
});

t('§7.4 waNumberFor resolves env-first, per lane, and refuses an unknown lane', () => {
  delete process.env.TDW_WA_NUMBER; delete process.env.TDW_WA_NUMBER_BRIDE;
  assert.strictEqual(waNumberFor('vendor'), '917982159047');
  assert.strictEqual(waNumberFor('bride'),  '917011788380');
  process.env.TDW_WA_NUMBER = '910000000001';
  assert.strictEqual(waNumberFor('vendor'), '910000000001', 'env must still win');
  delete process.env.TDW_WA_NUMBER;
  assert.throws(() => waNumberFor('marketing'), /unknown lane/);
});

// ══════════════════════════════════════════════════════════════════════════
H('§8 — THE MIS-ROUTE, CURED');

t('§8.1 *** A BRIDE LINK CAN NO LONGER RESOLVE TO THE VENDOR NUMBER ***', () => {
  delete process.env.TDW_WA_NUMBER_BRIDE;
  process.env.TDW_WA_NUMBER = '917982159047';           // the vendor var, set — the old trap
  assert.strictEqual(waNumberFor('bride'), '917011788380',
    'the bride chain must NOT fall through to the vendor var — that fall-through IS the bug');
  delete process.env.TDW_WA_NUMBER;
});

t('§8.2 coupleInvite.js no longer carries the vendor fallback chain (CODE, not the comment)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/admin/views/coupleInvite.js'), 'utf8');
  // The cured file QUOTES the old chain in its header as the taught anti-pattern (CE-63 ①).
  // Reading the raw file would catch that specimen and call the bug alive. Strip comments
  // first — the same discipline §7.1 applies, and the reason the specimen can survive at all.
  const code = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/process\.env\.TDW_WA_NUMBER_BRIDE \|\| process\.env\.TDW_WA_NUMBER/.test(code),
    'the mis-routing chain survives in EXECUTABLE code');
  assert.ok(/\/\/.*TDW_WA_NUMBER_BRIDE \|\| process\.env\.TDW_WA_NUMBER/.test(src),
    'the anti-pattern specimen must SURVIVE in the comment — it is what teaches the next reader');
  assert.ok(code.includes("waNumberFor('bride')"), 'the couple page must resolve on the BRIDE lane');
});

t('§8.3 no src/** file re-declares an inline wa.me fallback (one home, or none)', () => {
  const hits = execSync(`grep -rn "process.env.TDW_WA_NUMBER *|| *'9" src/ || true`, { cwd: ROOT })
    .toString().split('\n').filter(Boolean)
    .filter(l => {                       // comments are specimens, not declarations
      const code = l.slice(l.indexOf(':', l.indexOf(':') + 1) + 1).trim();
      return !code.startsWith('//');
    });
  assert.strictEqual(hits.length, 0, `inline re-declarations survive:\n${hits.join('\n')}`);
});

// ══════════════════════════════════════════════════════════════════════════
H('§9 — F-05.25: THE FULL STOP REACHES BRIDE AND VENDOR (closing micro)');

const { matchFullStopWord, recordFullStop, recordFullStart } = require('../src/lib/fullStop');

t('§9.1 the words are the MARKETING LANE\'S OWN — imported, never re-declared', () => {
  for (const w of ['STOP', 'stop', 'Stop.', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'STOPALL'])
    assert.strictEqual(matchFullStopWord(w), 'stop', `${JSON.stringify(w)} must be a full stop`);
  for (const w of ['START', 'UNSTOP', 'RESUME'])
    assert.strictEqual(matchFullStopWord(w), 'start');
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/fullStop.js'), 'utf8');
  assert.ok(/require\(['"]\.\/prospects['"]\)/.test(src) && !/STOP_WORDS\s*=/.test(src),
    'the word set must be IMPORTED from prospects.js, not re-declared — one home, three lanes');
});

await ta('§9.2 *** THE DERIVATION *** — a number with NO prospects row still lands one', async () => {
  const sb = fakeSupabase({ prospects: [] });
  await recordFullStop({ supabase: sb, phone: '+919625759924' });
  assert.strictEqual(sb.__db.prospects.length, 1, 'the row the gates read must come into existence');
  assert.strictEqual(sb.__db.prospects[0].phone, '919625759924', 'stored NORMALIZED');
  assert.strictEqual(sb.__db.prospects[0].state, 'opted_out');
  const ops = sb.__calls.filter(c => c.table === 'prospects').map(c => c.op);
  assert.deepStrictEqual(ops, ['insert', 'update'],
    'findOrCreate + update — the existing PAIR, which already upserts. No new writer.');
});

await ta('§9.3 an EXISTING prospect is flipped, not duplicated', async () => {
  const sb = fakeSupabase({ prospects: [{ id: 'p1', phone: '919625759924', state: 'in_session' }] });
  await recordFullStop({ supabase: sb, phone: '+919625759924' });
  assert.strictEqual(sb.__db.prospects.length, 1);
  assert.strictEqual(sb.__db.prospects[0].state, 'opted_out');
});

await ta('§9.4 the gate the estate already had now SEES a bride full-stop', async () => {
  const sb = fakeSupabase({ prospects: [] });
  await recordFullStop({ supabase: sb, phone: '+919625759924' });
  const { defaultIsOptedOut } = require('../src/lib/sendWa');
  assert.strictEqual(await defaultIsOptedOut({ to: '+919625759924', supabase: sb }), true,
    'the read gate was always faithful; before the micro nothing on this lane fed it');
});

t('§9.5 *** ORDER IS LOAD-BEARING *** — the nudge branch runs FIRST on both cores', () => {
  // isStopWord matches the FIRST TOKEN ONLY, so isStopWord('STOP MORNINGS') is TRUE.
  // If the full-stop branch ran first it would swallow every pause into a terminal
  // opt-out: F-05.22's cure destroyed by its own sibling. Asserted on POSITION, not
  // on an outcome that a reordering could still fake.
  assert.strictEqual(matchFullStopWord('STOP MORNINGS'), 'stop',
    'the hazard is real: the full-stop matcher DOES claim the pause phrase');
  for (const f of ['src/lib/brideInbound.js', 'src/lib/vendorInbound.js']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const nudgeAt = src.indexOf('const nudgeWord = matchNudgeWord(trimmedBody);');
    const stopAt  = src.indexOf('const fullStopWord = matchFullStopWord(trimmedBody);');
    assert.ok(nudgeAt > 0 && stopAt > 0, `${f} missing a branch`);
    assert.ok(nudgeAt < stopAt, `${f}: the full stop runs BEFORE the nudge — pauses become terminal`);
  }
});

await ta('§9.6 STOP MORNINGS still writes nudge-class ONLY, prospects untouched', async () => {
  const sb = fakeSupabase();
  assert.strictEqual(matchNudgeWord('STOP MORNINGS'), 'stop');
  await setNudgeOptout({ supabase: sb, phone: '+919625759924', lane: 'bride', state: 'opted_out' });
  assert.strictEqual(sb.__db.prospects.length, 0,
    'a pause must never touch the full stop\'s table');
  assert.deepStrictEqual([...new Set(sb.__calls.map(c => c.table))], ['nudge_optout']);
});

await ta('§9.7 START resumes a stopped number; START from a never-stopped one is a NO-OP', async () => {
  const sb = fakeSupabase({ prospects: [{ id: 'p1', phone: '919625759924', state: 'opted_out' }] });
  const r1 = await recordFullStart({ supabase: sb, phone: '+919625759924' });
  assert.strictEqual(r1.changed, true);
  assert.strictEqual(sb.__db.prospects[0].state, 'replied', 'the marketing lane\'s own post-stop state');

  const sb2 = fakeSupabase({ prospects: [{ id: 'p2', phone: '919625759924', state: 'in_session' }] });
  const r2 = await recordFullStart({ supabase: sb2, phone: '+919625759924' });
  assert.strictEqual(r2.changed, false, 'START must not re-write someone who never stopped');
  assert.strictEqual(sb2.__db.prospects[0].state, 'in_session');
});

t('§9.8 THE MARKETING LANE IS BYTE-STABLE — prospects.js unedited by this micro', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/prospects.js'), 'utf8');
  assert.ok(src.includes("const STOP_WORDS  = new Set(['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'STOPALL']);"));
  assert.ok(src.includes("await updateProspect(supabase, prospect.id, { state: 'opted_out' });"));
  assert.ok(!src.includes('fullStop') && !src.includes('nudgeOptout'),
    'the writer must not have learned about its new callers');
});

t('§9.9 the full-stop copy reads TERMINAL and names the way back', () => {
  // ══ LABELED AMENDMENT — ARC M1 (CE-67). COUNT UNCHANGED (one cell, in place). ══
  // WHY, and it is not a weakening: this cell asserted /won't message you again/,
  // which was the true absoluteness of the machine when P4 shipped it. F-05.33's
  // cure was then ruled shape (b)+(c) — G-A, the founder's word "YOUR SUGGESTION" —
  // and that ruling RETIRED the semantic this regex bound. STOP now silences what
  // Mira INITIATES; her answers to the bride's own messages always deliver. Left
  // unamended, the cell would forbid the estate from shipping the line its own
  // ruling requires, and would do it while reporting green about a promise the
  // machine no longer keeps. That is the CE-63 B2 class, and the estate's answer to
  // it is a labeled amendment, not a silent edit: Ruling №1 (bench-follows-the-law,
  // the executor's hold credited) and CE-63's four fixture amendments are the
  // precedents; this amendment is REPORTED in the delivery, ratify-or-revert.
  //
  // The absoluteness is not dropped — it is RE-AIMED at what actually stops, and a
  // NEW assertion is added for the half the ruling created, because under (b)+(c) a
  // line that states only the silence is lying in the other direction. The cell is
  // strictly stronger than it was: it now binds BOTH halves of the ruled semantics.
  const line = getNudgeCopy('full_stop_confirmation');
  assert.ok(/opted out/i.test(line), 'terminal register, mirroring the marketing lane');
  assert.ok(/won't message you first/i.test(line),
    'it must state the absoluteness OF INITIATION — the thing G-A actually stops');
  assert.ok(/if you write to me/i.test(line) && /still answer/i.test(line),
    'under (b)+(c) it must ALSO promise the answer, or it lies in the other direction');
  assert.ok(/START/.test(line), 'START is the single named way back');
  assert.ok(/STOP MORNINGS/.test(line),
    'it must distinguish itself from the pause — two opt-outs shipped in one block');
  assert.ok(getNudgeCopy('full_start_confirmation'), 'a stop line without its start line is a trap');
});

t('§9.10 the resume line no longer wears a provisional flag (founder ratified as shipped)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/nudgeCopy.js'), 'utf8');
  const i = src.indexOf('resume_confirmation:');
  const block = src.slice(Math.max(0, i - 700), i);
  assert.ok(!/PROVISIONAL/.test(block),
    'a ratified line wearing a provisional flag is the stale-comment class');
  assert.ok(/RATIFIED AS SHIPPED/.test(block));
});

t('§9.11 *** EVERY ACKNOWLEDGMENT CARRIES THE BYPASS *** (F-05.27, found by the smoke)', () => {
  // THE DEFECT THIS CELL EXISTS FOR: the nudge branch shipped its two acks WITHOUT
  // the bypass, so a number already fully opted out wrote its pause correctly and
  // then answered with SILENCE — the gate blocking a reply to a message the human
  // sent seconds earlier. Live at 10:03:21 on 2026-07-23:
  //   "[whatsapp:out->meta] BLOCKED opted_out to=... line=bride (F-05.2 gate)"
  // Asserted STRUCTURALLY over EVERY ack site, not over the four that exist today,
  // so a branch added later cannot quietly reintroduce it.
  for (const f of ['src/lib/brideInbound.js', 'src/lib/vendorInbound.js']) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8')
      .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    const sends = code.split('\n').filter(l => /sendWhatsApp\(phone, getNudgeCopy\(/.test(l));
    assert.ok(sends.length >= 4, `${f}: expected every ack site, found ${sends.length}`);
    for (const line of sends)
      assert.ok(/ACK_BYPASS/.test(line),
        `${f}: an acknowledgment without the bypass — it will be swallowed for an opted-out number:\n        ${line.trim()}`);
  }
});

t('§9.12 the bypass has ONE home and is not re-declared inline anywhere', () => {
  const fsCode = fs.readFileSync(path.join(ROOT, 'src/lib/fullStop.js'), 'utf8');
  assert.ok(/const ACK_BYPASS = \{ isOptedOut: async \(\) => false \};/.test(fsCode),
    'fullStop.js must own the constant');
  for (const f of ['src/lib/brideInbound.js', 'src/lib/vendorInbound.js']) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8')
      .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/isOptedOut: async \(\) => false/.test(code),
      `${f} re-declares the bypass inline — one home, or the next edit drifts`);
    assert.ok(/ACK_BYPASS.*require\('\.\/fullStop'\)|require\('\.\/fullStop'\).*ACK_BYPASS/.test(code),
      `${f} must import the constant`);
  }
});

t('§9.13 the ratified full-stop line no longer wears a provisional flag', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/nudgeCopy.js'), 'utf8');
  const i = src.indexOf('full_stop_confirmation:');
  const block = src.slice(Math.max(0, i - 1500), i);
  assert.ok(/RATIFIED/.test(block), 'the founder ratified it by name');
  assert.ok(!/NOT YET FOUNDER-RATIFIED|AWAITING VETO/.test(block),
    'a ratified line wearing a provisional flag is the stale-comment class');
});

t('§9.14 F-05.26 — the dead app/ copy is GONE from dream-os', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'app')),
    'the 264K stale duplicate of the pwa\'s live page must not survive: a second home for the same facts goes stale silently');
});

// ══════════════════════════════════════════════════════════════════════════
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — the nudge fires on its predicate · nudge_optout honoured PER LANE ·');
  console.log('STOP MORNINGS narrow and nudge-class only · BARE STOP NOW TERMINAL on bride and');
  console.log('vendor through the ONE existing writer, nudge branch first so a pause can never');
  console.log('become an opt-out · START resumes both classes · F4 routes a closed window · the');
  console.log('rider grep-zero on runtime values · the mis-route cannot recur · the marketing');
  console.log('lane byte-stable. Live send declared-not-claimed.\n');
}
process.exit(fail === 0 ? 0 : 1);

})();
