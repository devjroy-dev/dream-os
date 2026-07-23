// scripts/b05_arc_m3_bench.js — TDW_05 COUPLE-LANE MECHANICAL ARC, MOVEMENT M3.
//   node scripts/b05_arc_m3_bench.js        (runnable from any cwd — Q-SP-5)
//
// F-05.47: the couple door died ONE STEP PAST THE ROUTING. The named test is the
// witnessed value's own shape — a public.users.id handed where an auth.users.id is
// required — reproduced RED at the uncured tree in §4.
'use strict';
// enquiryBinder requires src/engine/dist at MODULE scope (:17), which transitively
// pulls db.js — credentials needed at load. Shape-only placeholders; nothing connects.
// (M2's moneyGuard defers its dist require for exactly this reason; this file's is
// pre-existing and out of M3's scope, so the bench carries the env instead.)
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-key';
const assert = require('assert');
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const code = (rel) => read(rel).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

let pass = 0, fail = 0;
function t(n, f) { try { f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } }
async function ta(n, f) { try { await f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } }
function H(s) { console.log(`\n${s}`); }

// THE WITNESSED VALUES, founder-run 2026-07-24 (probe P1/P2), used verbatim as
// fixtures so the bench tests the shape production actually carries.
const VENDOR_ID   = '5e54b2e7-79cd-4863-8ea6-9515de55dc61';
const USERS_ID    = '3c8eb9e0-e746-4d95-9630-17897aa64f05'; // vendors.user_id — NOT an auth id
const AUTH_ID     = 'ce496223-e460-40b4-b457-afe30841f310'; // users.auth_user_id — the real one

function makeSupabase({ authUserId = AUTH_ID, seen }) {
  return {
    from: (table) => {
      const b = {
        _t: table, _eq: {},
        select: () => b, eq: (k, v) => { b._eq[k] = v; return b; },
        maybeSingle: () => {
          if (table === 'users')   { seen.push({ table, eq: { ...b._eq } }); return Promise.resolve({ data: { auth_user_id: authUserId }, error: null }); }
          if (table === 'vendors') return Promise.resolve({ data: { id: VENDOR_ID, user_id: USERS_ID, business_name: 'V', category: 'music' }, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        single: () => Promise.resolve({ data: null, error: null }),
        insert: () => b, upsert: () => b,
        then: (r, j) => Promise.resolve({ data: null, error: null }).then(r, j),
      };
      return b;
    },
    // The engine hop, faithful enough to witness the value heading for the FK.
    schema: (name) => ({
      from: (t2) => {
        const e = { _eq: {},
          select: () => e, eq: (k, v) => { e._eq[k] = v; if (t2 === 'users' && k === 'auth_user_id') seen.push({ engineLookup: v }); return e; },
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          upsert: (row) => { seen.push({ engineUpsert: row.auth_user_id }); throw new Error('STOP: value captured at the FK boundary'); },
          insert: () => e,
        };
        void name; return e;
      },
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

(async () => {
const { resolveAuthUserId } = require(P('src/lib/resolveUsersId.js'));
const { enquiryToBinder }   = require(P('src/lib/vendor/enquiryBinder.js'));

H('§1 — THE INVERSE PLANE HOP');
await ta('§1.1 users.id -> auth id, keyed on id and reading auth_user_id', async () => {
  const seen = [];
  const got = await resolveAuthUserId(makeSupabase({ seen }), USERS_ID);
  assert.strictEqual(got, AUTH_ID);
  assert.deepStrictEqual(seen[0], { table: 'users', eq: { id: USERS_ID } },
    'it must key on users.id — keying on auth_user_id would be the forward hop wearing the inverse name');
});
await ta('§1.2 a user with no auth identity returns NULL, not a throw', async () => {
  assert.strictEqual(await resolveAuthUserId(makeSupabase({ authUserId: null, seen: [] }), USERS_ID), null);
  assert.strictEqual(await resolveAuthUserId(makeSupabase({ seen: [] }), null), null);
});
t('§1.3 the inverse lives in its twin\'s home — one plane-hop file, not two', () => {
  const m = require(P('src/lib/resolveUsersId.js'));
  assert.strictEqual(typeof m.resolveUsersId, 'function');
  assert.strictEqual(typeof m.resolveAuthUserId, 'function');
});

H('§2 — F-05.47: THE PLANE SWAP AT THE COUPLE DOOR');
await ta('§2.1 *** the value reaching engine.users.auth_user_id is the AUTH id ***', async () => {
  const seen = [];
  try { await enquiryToBinder(makeSupabase({ seen }), VENDOR_ID, { phone: '+919625759924', note: 'n' }); } catch (_) {}
  const atFk = seen.filter(x => x.engineLookup || x.engineUpsert).map(x => x.engineLookup || x.engineUpsert);
  assert.ok(atFk.length > 0, 'nothing reached the engine boundary — the bench witnessed nothing');
  for (const v of atFk) {
    assert.strictEqual(v, AUTH_ID,
      `${v} reached engine.users.auth_user_id — a public.users.id in an auth.users.id's place IS the 23503`);
    assert.notStrictEqual(v, USERS_ID, 'the witnessed failing value went through again');
  }
});

H('§3 — THE THROW PATH (subjectless today, driven synthetically)');
await ta('§3.1 no auth identity -> honest {ok:false}, NEVER a throw that kills the turn', async () => {
  // NAMED: no live subject exists. Founder probe P3 — both auth-less users
  // (+918595986978, +917982159047) own no vendor. This cell drives the mode.
  const r = await enquiryToBinder(makeSupabase({ authUserId: null, seen: [] }), VENDOR_ID, { phone: '+91', note: 'n' });
  assert.strictEqual(r.ok, false, 'it must fail honestly');
  assert.ok(/auth identity/i.test(r.error), 'and say why');
});
t('§3.2 the failure travels this module\'s OWN contract, not a new one', () => {
  assert.ok(/return \{ ok: false, error: 'vendor not found' \}/.test(code('src/lib/vendor/enquiryBinder.js')),
    'the sibling contract this cure mirrors must still be here');
});

H('§4 — NON-VACUOUS: RED AT THE UNCURED TREE');
if (!process.env.M3_BENCH_CHILD) {
  const { execFileSync } = require('child_process');
  const MUTS = [
    { cell: '§2.1', why: 'the plane swap restored — vendors.user_id handed to the FK again',
      file: 'src/lib/vendor/enquiryBinder.js',
      from: '  const authUserId = await resolveAuthUserId(supabase, vendor.user_id);',
      to:   '  const authUserId = vendor.user_id;' },
    { cell: '§3.1', why: 'the null guard removed — the throw kills the conversation again',
      file: 'src/lib/vendor/enquiryBinder.js',
      from: '  if (!authUserId) {', to: '  if (false) {' },
    { cell: '§1.1', why: 'the inverse hop keys on the wrong column — the forward hop in disguise',
      file: 'src/lib/resolveUsersId.js',
      from: "    .from('users').select('auth_user_id').eq('id', usersId).maybeSingle();",
      to:   "    .from('users').select('auth_user_id').eq('auth_user_id', usersId).maybeSingle();" },
  ];
  for (const m of MUTS) {
    const abs = P(m.file); const orig = fs.readFileSync(abs, 'utf8');
    try {
      if (!orig.includes(m.from)) { console.log(`  FAIL ${m.cell} MUTATION anchor stale`); fail++; continue; }
      fs.writeFileSync(abs, orig.replace(m.from, m.to));
      let red = false, out = '';
      try { execFileSync(process.execPath, [P('scripts/b05_arc_m3_bench.js')], { env: { ...process.env, M3_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' }); }
      catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) { console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`); fail++; }
      else if (!out.includes(`FAIL ${m.cell}`)) { console.log(`  FAIL ${m.cell} red on the wrong cell — ${m.why}`); fail++; }
      else { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    } finally { fs.writeFileSync(abs, orig); }
  }
}

H('§5 — THE CENSUS HOLDS');
t('§5.1 every resolveAgentForVendor caller passes an auth-plane value', () => {
  const deviants = [];
  for (const f of ['src/api/middleware/resolveAgent.js','src/api/vendor/day.js','src/api/vendor/events.js',
                   'src/api/vendor/leads.js','src/api/vendor/bands.js','src/api/vendor/studio/payments.js',
                   'src/lib/vendorInbound.js','src/lib/vendor/enquiryBinder.js'])
    for (const l of code(f).split('\n'))
      if (/resolveAgentForVendor\(/.test(l) && /\.user_id\)/.test(l) && !/auth_user_id\)/.test(l)) deviants.push(`${f}: ${l.trim()}`);
  assert.deepStrictEqual(deviants, [],
    'a caller passes a users.id where an auth id belongs — the cure covers the SET, and the set grew');
});
t('§5.2 W-1 HELD and the engine is untouched', () => {
  const { execSync } = require('child_process');
  const out = execSync('git diff --name-only HEAD', { cwd: ROOT }).toString();
  for (const f of ['miraSoul','brideSystemPrompt','brideTools','src/engine/'])
    assert.ok(!out.includes(f), `out of scope: ${f}`);
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — the couple door survives its own cabinet write. Live witness is the FOUNDER\'s.');
process.exit(fail === 0 ? 0 : 1);
})();
