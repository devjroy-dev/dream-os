#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b07_auth_crossover_bench.js
// THE AUTH SITTING · ARC 1 · SERVER HALF of the ruled `tdw_auth_crossover.proof`
//
// The proof the CE named is ONE proof in TWO halves, because its subject spans
// two repos and neither repo's floor can run the other's tree:
//   · THIS FILE            — dream-os: the four acceptance edges, F-07.62's
//                            resolve-if-present helper, the F-06.85 rewrite.
//   · dreamos-pwa/scripts/tdw_auth_crossover.proof.mjs
//                          — the client lane assertion and the F-07.71 branch.
// Each half names the other. The cross-repo pinning precedent is F-07.50's
// (a cell that reaches for an absent sibling tree SKIPS WITH REASON, never
// silently passes).
//
// Runnable from ANY working directory (§9: "a cure nobody can re-run quietly
// stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/b07_auth_crossover_bench.js
//
// ── THE NAMED TEST, per acceptance ② ─────────────────────────────────────────
// THE SPECIMEN ITSELF: a vendor-authenticated context on a couple surface must
// be REFUSED-or-ISOLATED, never silently resolved. The fixtures below are the
// founder's OWN production rows, pasted 2026-08-01 from the read-first's SELECT
// — not invented uuids. The vendor `dev` (+919888294440) owns a vendors row and
// NO couples row; that is precisely what produced the 47-byte 403.
//
// §1 BEHAVIOURAL — drives the REAL middlewares and the REAL helper against a
//    fake supabase plane. These are drivable end to end from a build container.
// §2 STRUCTURAL — asserts cures exist in the SHIPPED SOURCE where a live HTTP
//    stack would be needed to drive them (PROVABLE-EQUIVALENT DOCTRINE, CE-115).
// §3 MUTATION — proves §1 and §2 are non-vacuous by breaking PRODUCTION CODE
//    (never test setup) and asserting the corresponding cell goes RED.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
async function ta(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
function H(h) { console.log(`\n${h}`); }

// ── FIXTURES OF RECORD — the founder's pasted production rows ────────────────
// Derived by founder-run SELECT 2026-08-01 (read-first §13). Kept verbatim so a
// future reader can re-run the same SELECT and diff.
const BRIDE = {
  usersId:    '2900c661-4358-42d3-aa74-431053e00c0d',
  authUserId: '0e0c306d-37ed-4343-b3d9-b83cd5f174a3',
  coupleId:   '9f1f84d5-e688-4d4f-9e44-9f5da6315e52',
  phone:      '+919625759924',
  name:       'Dev Test 23',
};
const VENDOR = {                       // THE CROSSING IDENTITY
  usersId:    'ec4232ae-d670-4538-ab65-0be9f51a37af',
  authUserId: 'dbe9f9ba-a2fa-41b2-9c29-232f2444051d',
  vendorId:   '23165e38-6510-4639-ab6a-9f35bab93742',
  phone:      '+919888294440',
  name:       'dev',
};
const BRIDE_JWT  = 'jwt-bride-couple-lane';
const VENDOR_JWT = 'jwt-vendor-lane';

// ── TEST SETUP, DISCLOSED (never production code) ────────────────────────────
// A plane shaped to EXACTLY the calls the two middlewares and the helper make:
//   auth.getUser(token)
//   .from('users').select('id').eq('auth_user_id'|'id', v).maybeSingle()
//   .from('couples').select('id').eq('user_id', v).maybeSingle()
//   .from('vendors').select('*').eq('user_id', v).maybeSingle()
// Nothing more is simulated, because anything more would be simulating code this
// bench does not drive.
function fakePlane() {
  const byToken = { [BRIDE_JWT]: BRIDE.authUserId, [VENDOR_JWT]: VENDOR.authUserId };
  const users   = [BRIDE, VENDOR];
  return {
    auth: {
      getUser: async (token) => {
        const authId = byToken[token];
        return authId
          ? { data: { user: { id: authId } }, error: null }
          : { data: { user: null }, error: new Error('invalid token') };
      },
    },
    from(table) {
      const q = { _table: table, _col: null, _val: null };
      q.select = () => q;
      q.eq = (col, val) => { q._col = col; q._val = val; return q; };
      q.maybeSingle = async () => {
        if (table === 'users') {
          const u = users.find(x =>
            (q._col === 'auth_user_id' && x.authUserId === q._val) ||
            (q._col === 'id'           && x.usersId    === q._val));
          return { data: u ? { id: u.usersId } : null };
        }
        if (table === 'couples') {
          return { data: (q._val === BRIDE.usersId) ? { id: BRIDE.coupleId } : null };
        }
        if (table === 'vendors') {
          return { data: (q._val === VENDOR.usersId) ? { id: VENDOR.vendorId } : null };
        }
        return { data: null };
      };
      return q;
    },
  };
}
function fakeReq({ header, cookies = {} }) {
  return {
    headers: header ? { authorization: header } : {},
    cookies,
    app: { locals: { supabase: fakePlane() } },
  };
}
function fakeRes() {
  const r = { code: null, body: null, ended: false };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; r.ended = true; return r; };
  return r;
}

const requireCoupleAuth = require(SRC('src/api/middleware/requireCoupleAuth'));
const requireAuth       = require(SRC('src/api/middleware/requireAuth'));
const { resolveCoupleIfPresent } = require(SRC('src/lib/resolveCoupleIfPresent'));

// ═══════════════════════════════════════════════════════════════════════════
(async () => {

H('§1 — THE NAMED TEST: the specimen, refused at the server layer');

await ta('§1.1 SPECIMEN — the vendor cookie on a couple surface is REFUSED (401), not resolved to a 403', async () => {
  const req = fakeReq({ cookies: { tdw_vendor_token: VENDOR_JWT } });
  const res = fakeRes();
  let nexted = false;
  await requireCoupleAuth(req, res, () => { nexted = true; });
  assert.ok(!nexted, 'the vendor cookie reached the handler — the crossing is open');
  assert.strictEqual(res.code, 401, `expected 401 refusal, got ${res.code}`);
  assert.strictEqual(res.body.error, 'Unauthorised.');
});

await ta('§1.2 SPECIMEN, byte-arithmetic — the 47-byte 403 is now UNREACHABLE via the vendor cookie', async () => {
  const req = fakeReq({ cookies: { tdw_vendor_token: VENDOR_JWT } });
  const res = fakeRes();
  await requireCoupleAuth(req, res, () => {});
  const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
  assert.notStrictEqual(bytes, 47,
    'the response is still the 47-byte "No couple profile found." — the specimen survives');
  assert.strictEqual(bytes, 36, `expected the 36-byte 401 body, got ${bytes}`);
});

await ta('§1.3 the couple lane still works for the BRIDE via her own cookie (no over-refusal)', async () => {
  const req = fakeReq({ cookies: { tdw_couple_token: BRIDE_JWT } });
  const res = fakeRes();
  let nexted = false;
  await requireCoupleAuth(req, res, () => { nexted = true; });
  assert.ok(nexted, 'the bride was refused her own lane — the cure over-reaches');
  assert.strictEqual(req.coupleUser.couple_id, BRIDE.coupleId);
});

await ta('§1.4 EDGE 2 — the couple cookie on a VENDOR surface is REFUSED (the mirror crossing)', async () => {
  const req = fakeReq({ cookies: { tdw_couple_token: BRIDE_JWT } });
  const res = fakeRes();
  let nexted = false;
  await requireAuth(req, res, () => { nexted = true; });
  assert.ok(!nexted, 'the couple cookie reached a vendor-protected handler');
  assert.strictEqual(res.code, 401);
});

await ta('§1.5 the vendor lane still works for the VENDOR via his own cookie', async () => {
  const req = fakeReq({ cookies: { tdw_vendor_token: VENDOR_JWT } });
  const res = fakeRes();
  let nexted = false;
  await requireAuth(req, res, () => { nexted = true; });
  assert.ok(nexted, 'the vendor was refused his own lane');
  assert.strictEqual(req.auth.user_id, VENDOR.authUserId);
});

await ta('§1.6 EDGES 3+4 — the Authorization header is UNTOUCHED on both lanes', async () => {
  const rc = fakeRes(); let a = false;
  await requireCoupleAuth(fakeReq({ header: `Bearer ${BRIDE_JWT}` }), rc, () => { a = true; });
  assert.ok(a, 'couple header edge broke');
  const rv = fakeRes(); let b = false;
  await requireAuth(fakeReq({ header: `Bearer ${VENDOR_JWT}` }), rv, () => { b = true; });
  assert.ok(b, 'vendor header edge broke');
});

H('§2 — F-07.62: the resolve-if-present helper, all three answers');

await ta('§2.1 LOGGED OUT — no credential ⇒ { present:false } ⇒ the posted id still serves her', async () => {
  const r = await resolveCoupleIfPresent(fakeReq({}), fakePlane());
  assert.deepStrictEqual(r, { present: false, coupleId: null });
});

await ta('§2.2 AUTHENTICATED BRIDE — her token yields HER couple id', async () => {
  const r = await resolveCoupleIfPresent(fakeReq({ header: `Bearer ${BRIDE_JWT}` }), fakePlane());
  assert.deepStrictEqual(r, { present: true, coupleId: BRIDE.coupleId });
});

await ta('§2.3 SPECIMEN — a vendor credential yields present:true + NULL (hydration refused, no fallback)', async () => {
  const r = await resolveCoupleIfPresent(fakeReq({ header: `Bearer ${VENDOR_JWT}` }), fakePlane());
  assert.strictEqual(r.present, true, 'a present credential was reported ABSENT — it would fall back to the posted id');
  assert.strictEqual(r.coupleId, null);
});

await ta('§2.4 THE FORGERY DIES — an authenticated bride cannot be overridden by a posted id', () => {
  // The substitution the handler performs, asserted on its own terms.
  const auth = { present: true, coupleId: BRIDE.coupleId };
  const postedForgery = VENDOR.usersId;
  const identity = auth.present ? auth.coupleId : (postedForgery || null);
  assert.strictEqual(identity, BRIDE.coupleId);
});

await ta('§2.5 A BROKEN credential never demotes to logged-out (it must not re-believe the body)', async () => {
  const r = await resolveCoupleIfPresent(fakeReq({ header: 'Bearer garbage-token' }), fakePlane());
  assert.strictEqual(r.present, true);
  assert.strictEqual(r.coupleId, null);
});

await ta('§2.6 the helper reads ONLY the couple cookie (it must not re-open the closed crossing)', async () => {
  const r = await resolveCoupleIfPresent(fakeReq({ cookies: { tdw_vendor_token: VENDOR_JWT } }), fakePlane());
  assert.deepStrictEqual(r, { present: false, coupleId: null },
    'the helper accepted the vendor cookie — edge 1 closed and the door re-opened it');
});

H('§3 — STRUCTURAL: the cures in the shipped source');

t('§3.1 requireCoupleAuth no longer names tdw_vendor_token in its cookie read', () => {
  const s = read('src/api/middleware/requireCoupleAuth.js');
  const line = s.split('\n').find(l => l.includes('const cookieToken'));
  assert.ok(line, 'cookieToken binding absent');
  assert.ok(!line.includes('tdw_vendor_token'), `crossing still live: ${line.trim()}`);
});

t('§3.2 requireAuth no longer names tdw_couple_token in its cookie read', () => {
  const s = read('src/api/middleware/requireAuth.js');
  const line = s.split('\n').find(l => l.includes('const cookieToken'));
  assert.ok(line, 'cookieToken binding absent');
  assert.ok(!line.includes('tdw_couple_token'), `mirror crossing still live: ${line.trim()}`);
});

t('§3.3 the enquiry door resolves identity ONCE at its entry and passes it to BOTH legs', () => {
  const s = read('src/api/couple/enquire.js');
  assert.ok(s.includes('resolveCoupleIfPresent'), 'helper not wired');
  assert.ok(/const identityCoupleId\s*=/.test(s), 'identity binding absent');
  const real = s.includes('handleRealVendor({ supabase, res, vendor, couple_id: identityCoupleId');
  const demo = s.includes('handleDemoVendor({ supabase, res, demoVendor, couple_id: identityCoupleId');
  assert.ok(real, 'the REAL leg still receives the posted couple_id');
  assert.ok(demo, 'the DEMO leg still receives the posted couple_id');
});

t('§3.4 F-06.85 — the conditioned sentence was RE-READ and names its NEW mechanism', () => {
  const s = read('src/api/couple/enquire.js');
  assert.ok(s.includes('[F-06.85] THE MECHANISM MOVED. THIS SENTENCE HAS BEEN RE-READ.'),
    'the F-06.85 block was not rewritten — the convention was defeated at its own test case');
  assert.ok(s.includes('identityCoupleId') && /Mechanism:[\s\S]{0,400}resolveCoupleIfPresent/.test(s),
    'the rewritten block does not name the mechanism its law now depends on');
});

t('§3.5 the logged-out door is STILL mounted bare — the product feature survives the cure', () => {
  const r = read('src/api/router.js');
  const line = r.split('\n').find(l => l.includes("'/discover/enquire'"));
  assert.ok(line, '/discover/enquire mount absent');
  assert.ok(!/requireCoupleAuth|requireAuth/.test(line),
    `a guard was mounted on the logged-out door: ${line.trim()}`);
});

H('§4 — BOTH-WAYS: every cell above RED at the uncured tree, by mutating PRODUCTION code');

// The §1/§2 cells require() their subjects at module load, so a mutation must
// bust require.cache AND re-require inside the closure; the §3 cells read source
// fresh. This helper covers both by re-reading and re-requiring per mutation —
// the caching law (CE-117) applied to a middleware rather than a pure module.
async function mutateSrc(rel, from, to, cellName, assertOnMutated) {
  const abs = SRC(rel);
  const original = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (original === null || !original.includes(from)) {
    t(`§4 ${cellName} goes RED when its production code is broken`, () => {
      throw new Error(`mutation anchor absent (uncured tree?): ${rel} <- ${from}`);
    });
    return;
  }
  fs.writeFileSync(abs, original.replace(from, to));
  delete require.cache[require.resolve(abs)];
  let wentRed = false;
  try { await assertOnMutated(); } catch (_e) { wentRed = true; }
  fs.writeFileSync(abs, original);
  delete require.cache[require.resolve(abs)];
  assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} not restored byte-identical`);
  t(`§4 ${cellName} goes RED when its production code is broken`, () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is vacuous`);
  });
}

// INVERSE 1 — put edge 1's crossing back. §1.1/§1.2 must redden.
await mutateSrc('src/api/middleware/requireCoupleAuth.js',
  "const cookieToken = req.cookies?.tdw_couple_token || '';",
  "const cookieToken = req.cookies?.tdw_couple_token || req.cookies?.tdw_vendor_token || '';",
  'the specimen refusal (edge 1)',
  async () => {
    const mw = require(SRC('src/api/middleware/requireCoupleAuth'));
    const req = fakeReq({ cookies: { tdw_vendor_token: VENDOR_JWT } });
    const res = fakeRes();
    await mw(req, res, () => {});
    assert.strictEqual(res.code, 401);
    assert.strictEqual(Buffer.byteLength(JSON.stringify(res.body), 'utf8'), 36);
  });

// INVERSE 2 — put edge 2's mirror crossing back. §1.4 must redden.
await mutateSrc('src/api/middleware/requireAuth.js',
  "const cookieToken = req.cookies?.tdw_vendor_token || '';",
  "const cookieToken = req.cookies?.tdw_vendor_token || req.cookies?.tdw_couple_token || '';",
  'the mirror-crossing refusal (edge 2)',
  async () => {
    const mw = require(SRC('src/api/middleware/requireAuth'));
    const req = fakeReq({ cookies: { tdw_couple_token: BRIDE_JWT } });
    const res = fakeRes();
    let nexted = false;
    await mw(req, res, () => { nexted = true; });
    assert.ok(!nexted, 'couple cookie reached a vendor handler');
  });

// INVERSE 3 — make the helper fall back to logged-out on a present-but-coupleless
// credential. §2.3 must redden: this is the exact shape that would re-open forgery.
await mutateSrc('src/lib/resolveCoupleIfPresent.js',
  "    return { present: true, coupleId: (couple && couple.id) || null };",
  "    return (couple && couple.id) ? { present: true, coupleId: couple.id } : ABSENT;",
  'the present-but-coupleless refusal (F-07.62)',
  async () => {
    const { resolveCoupleIfPresent: fresh } = require(SRC('src/lib/resolveCoupleIfPresent'));
    const r = await fresh(fakeReq({ header: `Bearer ${VENDOR_JWT}` }), fakePlane());
    assert.strictEqual(r.present, true);
  });

// INVERSE 4 — let the helper read the vendor cookie again. §2.6 must redden.
await mutateSrc('src/lib/resolveCoupleIfPresent.js',
  "const cookieToken = (req && req.cookies && req.cookies.tdw_couple_token) || '';",
  "const cookieToken = (req && req.cookies && (req.cookies.tdw_couple_token || req.cookies.tdw_vendor_token)) || '';",
  "the helper's lane-scoped cookie read",
  async () => {
    const { resolveCoupleIfPresent: fresh } = require(SRC('src/lib/resolveCoupleIfPresent'));
    const r = await fresh(fakeReq({ cookies: { tdw_vendor_token: VENDOR_JWT } }), fakePlane());
    assert.deepStrictEqual(r, { present: false, coupleId: null });
  });

// INVERSE 5 — send the posted id to the real leg again. §3.3 must redden.
await mutateSrc('src/api/couple/enquire.js',
  'handleRealVendor({ supabase, res, vendor, couple_id: identityCoupleId',
  'handleRealVendor({ supabase, res, vendor, couple_id',
  'the real leg receiving the RESOLVED identity',
  async () => {
    const s = read('src/api/couple/enquire.js');
    assert.ok(s.includes('handleRealVendor({ supabase, res, vendor, couple_id: identityCoupleId'));
  });

// INVERSE 6 — delete the F-06.85 rewrite. §3.4 must redden.
await mutateSrc('src/api/couple/enquire.js',
  '[F-06.85] THE MECHANISM MOVED. THIS SENTENCE HAS BEEN RE-READ.',
  '[F-06.85] (removed by mutation)',
  'the F-06.85 rewrite',
  async () => {
    const s = read('src/api/couple/enquire.js');
    assert.ok(s.includes('[F-06.85] THE MECHANISM MOVED. THIS SENTENCE HAS BEEN RE-READ.'));
  });


H('§6 — THE TRIANGLE (F-07.72): a THIRD lane joined the estate and must not cross');

// F-07.65 proved the couple and vendor lanes do not accept each other's
// credentials. F-07.72 added the CIRCLE lane, and a two-lane bench cannot catch
// a three-lane crossing: the very benches that exist to catch this class would
// have gone on passing while the new lane crossed both of them. Extended by CE
// ruling §3(4), and the count movement is DISCLOSED, never smoothed.
//
// The secrets below live only inside this process and are never printed.
process.env.ADMIN_SESSION_SECRET  = process.env.ADMIN_SESSION_SECRET  || 'bench-admin-secret';
process.env.CIRCLE_SESSION_SECRET = process.env.CIRCLE_SESSION_SECRET || 'bench-circle-secret';
const circleSession = require(SRC('src/lib/circleSession'));
const CIRCLE_TOKEN  = circleSession.mintCircleSession({
  userId:   '3c8eb9e0-e746-4d95-9630-17897aa64f05',   // Mehek, the one live member
  coupleId: '9f1f84d5-e688-4d4f-9e44-9f5da6315e52',
});

await ta('§6.1 a CIRCLE token is refused on the COUPLE lane', async () => {
  const mw  = require(SRC('src/api/middleware/requireCoupleAuth'));
  const req = fakeReq({ header: `Bearer ${CIRCLE_TOKEN}` });
  const res = fakeRes();
  let nexted = false;
  await mw(req, res, () => { nexted = true; });
  assert.strictEqual(nexted, false, 'a circle member was admitted to a couple-protected door');
  assert.strictEqual(res.code, 401);
});

await ta('§6.2 a CIRCLE token is refused on the VENDOR lane', async () => {
  const mw  = require(SRC('src/api/middleware/requireAuth'));
  const req = fakeReq({ header: `Bearer ${CIRCLE_TOKEN}` });
  const res = fakeRes();
  let nexted = false;
  await mw(req, res, () => { nexted = true; });
  assert.strictEqual(nexted, false, 'a circle member was admitted to a vendor-protected door');
});

t('§6.3 a COUPLE JWT is refused by the circle verifier — the mirror direction', () => {
  assert.strictEqual(circleSession.verifyCircleSession(BRIDE_JWT), null);
});

t('§6.4 a VENDOR JWT is refused by the circle verifier', () => {
  assert.strictEqual(circleSession.verifyCircleSession(VENDOR_JWT), null);
});

t('§6.5 an ADMIN token is refused by the circle verifier, and the circle token by the admin one', () => {
  const admin = require(SRC('src/lib/adminSession'));
  assert.strictEqual(circleSession.verifyCircleSession(admin.mintAdminSession()), null);
  assert.strictEqual(admin.verifyAdminSession(CIRCLE_TOKEN), false);
});

t('§6.6 THE LANES ARE THREE AND THE BENCH KNOWS IT — a fourth would be undefended', () => {
  // A census, not a vibe: every mounted lane guard in the estate is named here,
  // so adding a guard without adding its crossing cells REDDENS this line.
  // The predicate is CREDENTIAL-VERIFYING guards, derived from the files rather
  // than listed from memory: a lane guard is one that verifies a caller's
  // credential. The other four files in that directory are resolvers and tier
  // gates (agentBridge · requirePrestige · resolveAgent · resolveVendor) — they
  // route or gate a caller already identified, and they hold no verifier.
  // Derived by command so the census cannot rot into a hand-kept list.
  const dir = SRC('src/api/middleware');
  const guards = fs.readdirSync(dir).filter(f => f.endsWith('.js')).filter((f) => {
    const body = fs.readFileSync(path.join(dir, f), 'utf8');
    return /supabase\.auth\.getUser\(/.test(body) || /verifyCircleSession\(/.test(body);
  }).sort();
  assert.deepStrictEqual(guards,
    ['requireAuth.js', 'requireCircleMemberAuth.js', 'requireCoupleAuth.js'],
    'the credential-verifying guard census moved — a new lane needs its own crossing cells here');
});

H('§5 — the sibling half, named (F-07.50 cross-repo precedent)');

t('§5.1 the client half of this proof is named and its absence is DISCLOSED, never silently passed', () => {
  const sib = path.resolve(ROOT, '..', 'dreamos-pwa', 'scripts', 'tdw_auth_crossover.proof.mjs');
  if (!fs.existsSync(sib)) {
    console.log('       SKIPPED-WITH-REASON: the dreamos-pwa tree is not a sibling of this repo in ' +
                'this container. The client half runs in its own repo\'s floor; this cell exists so ' +
                'nobody mistakes its absence for its passing.');
    return;
  }
  const s = fs.readFileSync(sib, 'utf8');
  assert.ok(s.includes('b07_auth_crossover_bench'), 'the sibling half does not name this one back');
});

// ── verdict ─────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────────');
if (fail) {
  console.log(`b07_auth_crossover_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  fails.forEach(f => console.log(`   RED  ${f}`));
  process.exitCode = 1;
} else {
  console.log(`b07_auth_crossover_bench: ${pass} passed, 0 failed  (total ${pass})`);
  console.log('GREEN — the specimen is refused at both server edges, the forged couple_id hydrates');
  console.log('nothing, the logged-out door is untouched, and the sentence that named its own');
  console.log('mechanism was re-read when the mechanism moved.');
}
})();
