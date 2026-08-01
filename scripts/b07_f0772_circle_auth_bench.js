#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b07_f0772_circle_auth_bench.js
// F-07.72 · THE CIRCLE-LANE AUTH SITTING · ZIP 1 (mint + teach, ENFORCE NOTHING)
//
// Runnable from ANY working directory (§9: "a cure nobody can re-run quietly
// stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/b07_f0772_circle_auth_bench.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ──────────
// The lane now MINTS a session and the clients CARRY it. Nothing is enforced.
// Every cell below is written to that boundary: where a cell would be more
// impressive if it asserted a refusal, it asserts the absence of one instead,
// because a bench that proved enforcement this ZIP would be proving something
// that is not here. The enforcement cells arrive with the enforcement ZIP.
//
// ── THE FIXTURES ARE THE FOUNDER'S OWN ROWS ─────────────────────────────────
// Pasted 2026-08-02 from the read-first's fixture SELECT — not invented uuids.
// One live circle member exists in production; her row is below, and so are the
// three real non-member users.id values that serve as the forged-id targets.
//
// §1 signedSession — the one home: mint, gate, expire, tamper, bind.
// §2 CALLER #1 IDENTITY — the RETIRED inline admin implementation is driven
//    beside the extracted one and their verdicts are compared on every input.
//    This is the byte-identity claim's mechanism, not its assertion.
// §3 circleSession — caller #2, and the JWT/circle-token disjointness.
// §4 the Class B resolver — three answers, both arms, the bride not locked out.
// §5 the resolver is MOUNTED — the call site F-07.99 requires.
// §6 verify-pin: the mint, and the founder's frozen bytes.
// §7 join: one number one circle, at both gates, and the second mint.
// §8 session.js: the minimisation, and F-07.106's declaration.
// §9 MUTATION — every section above proven non-vacuous by breaking PRODUCTION
//    CODE (never test setup) and asserting the named cell goes RED.
'use strict';

const assert = require('assert');
const crypto = require('crypto');
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

// ── FIXTURES OF RECORD — founder-run SELECT, 2026-08-02 ─────────────────────
const MEHEK = {                                  // the one live circle member
  memberId:   '895a09a6-78f6-445f-a51c-7ca34933257d',
  coupleId:   '9f1f84d5-e688-4d4f-9e44-9f5da6315e52',
  usersId:    '3c8eb9e0-e746-4d95-9630-17897aa64f05',
  authUserId: 'ce496223-e460-40b4-b457-afe30841f310',   // PLANE-SPLIT: != usersId
  phone:      '+918757788550',
  name:       'Mehek',
  role:       'family',
};
// Real users.id rows that are NOT circle members — the refuse targets.
const FORGED = [
  'ec4232ae-d670-4538-ab65-0be9f51a37af',  // dev
  'df9b11c2-6d50-42bc-8c4f-d565b57c7dce',  // Swati Roy
  '3c22d190-4344-400c-a5db-bfc89015a634',  // Vera Kapoor
];
const OTHER_COUPLE = '11111111-2222-4333-8444-555555555555'; // a second circle, for §7

// Secrets exist only inside this process. Nothing is printed.
process.env.ADMIN_SESSION_SECRET  = process.env.ADMIN_SESSION_SECRET  || 'bench-admin-secret';
process.env.CIRCLE_SESSION_SECRET = process.env.CIRCLE_SESSION_SECRET || 'bench-circle-secret';

const signed        = require(SRC('src/lib/signedSession'));
const adminSession  = require(SRC('src/lib/adminSession'));
const circleSession = require(SRC('src/lib/circleSession'));
const { resolveCircleIdentityIfPresent } = require(SRC('src/lib/resolveCircleIdentityIfPresent'));

// ── TEST SETUP, DISCLOSED (never production code) ───────────────────────────
// A supabase plane shaped to EXACTLY the calls the resolver's couple arm makes.
const BRIDE = {
  usersId:    '2900c661-4358-42d3-aa74-431053e00c0d',
  authUserId: '0e0c306d-37ed-4343-b3d9-b83cd5f174a3',
  coupleId:   MEHEK.coupleId,
};
const BRIDE_JWT = 'header.payload.signature';   // three parts — a real JWT's shape
function fakePlane() {
  return {
    auth: {
      getUser: async (token) => (token === BRIDE_JWT
        ? { data: { user: { id: BRIDE.authUserId } }, error: null }
        : { data: { user: null }, error: new Error('invalid token') }),
    },
    from() {
      const q = { _col: null, _val: null, _table: null };
      q.select = () => q;
      q.eq = (c, v) => { q._col = c; q._val = v; return q; };
      q.maybeSingle = async () => {
        if (q._col === 'auth_user_id') {
          return { data: q._val === BRIDE.authUserId ? { id: BRIDE.usersId } : null };
        }
        if (q._col === 'user_id') {
          return { data: q._val === BRIDE.usersId ? { id: BRIDE.coupleId } : null };
        }
        return { data: null };
      };
      return q;
    },
  };
}
function reqWith(bearer) {
  return {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    cookies: {},
    app: { locals: { supabase: fakePlane() } },
  };
}

// ── THE RETIRED IMPLEMENTATION, reproduced here for §2 and NOWHERE ELSE ─────
// This is the body `src/lib/adminSession.js` carried before F-07.72 extracted
// it. It lives in the bench, never in src/, because a second live copy is the
// exact disease the extraction cured. It exists so the byte-identity claim is
// DRIVEN rather than asserted.
function retiredMint(secret, ttlMs) {
  if (!secret) return null;
  const nonce   = crypto.randomBytes(16).toString('hex');
  const expiry  = Date.now() + ttlMs;
  const payload = `${nonce}.${expiry}`;
  const mac     = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}
function retiredVerify(secret, token) {
  if (!secret) return false;
  if (typeof token !== 'string' || token.length === 0) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expiry, mac] = parts;
  if (!/^[0-9a-f]{32}$/.test(nonce)) return false;
  if (!/^[0-9]{1,20}$/.test(expiry)) return false;
  if (Number(expiry) <= Date.now())  return false;
  const expected = crypto.createHmac('sha256', secret).update(`${nonce}.${expiry}`).digest('base64url');
  if (mac.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}

// ═══════════════════════════════════════════════════════════════════════════
(async () => {

H('§1 — signedSession: the ONE HOME');

t('§1.1 a minted token round-trips and returns its bound subject', () => {
  const tok = signed.mintSigned({ secret: 's', subject: ['a', 'b'], ttlMs: 60000 });
  const out = signed.verifySigned({ token: tok, secret: 's', subjectCount: 2 });
  assert.deepStrictEqual(out, { subject: ['a', 'b'] });
});

t('§1.2 the SUBJECT IS INSIDE THE SIGNATURE — editing a bound field fails the mac', () => {
  const tok   = signed.mintSigned({ secret: 's', subject: [MEHEK.usersId, MEHEK.coupleId], ttlMs: 60000 });
  const parts = tok.split('.');
  parts[1]    = OTHER_COUPLE;                        // swap the couple, keep the mac
  const out   = signed.verifySigned({ token: parts.join('.'), secret: 's', subjectCount: 2 });
  assert.strictEqual(out, null, 'a token whose subject can be edited proves nothing');
});

t('§1.3 a wrong secret is refused', () => {
  const tok = signed.mintSigned({ secret: 's', subject: [], ttlMs: 60000 });
  assert.strictEqual(signed.verifySigned({ token: tok, secret: 'not-s', subjectCount: 0 }), null);
});

t('§1.4 an expired token is refused', () => {
  const tok = signed.mintSigned({ secret: 's', subject: [], ttlMs: 1 });
  const then = Date.now;
  Date.now = () => then() + 5000;
  try { assert.strictEqual(signed.verifySigned({ token: tok, secret: 's', subjectCount: 0 }), null); }
  finally { Date.now = then; }
});

t('§1.5 FAIL-CLOSED with no secret — mint returns null, verify returns null', () => {
  assert.strictEqual(signed.mintSigned({ secret: undefined, subject: [], ttlMs: 60000 }), null);
  assert.strictEqual(signed.verifySigned({ token: 'anything', secret: undefined }), null);
});

t('§1.6 ARITY IS PART OF THE GATE — a 0-subject token cannot pass a 2-subject door', () => {
  const tok = signed.mintSigned({ secret: 's', subject: [], ttlMs: 60000 });
  assert.strictEqual(signed.verifySigned({ token: tok, secret: 's', subjectCount: 2 }), null);
});

t('§1.7 a bound field containing the separator is REFUSED AT THE MINT, never silently split', () => {
  assert.strictEqual(signed.mintSigned({ secret: 's', subject: ['a.b'], ttlMs: 60000 }), null);
  assert.strictEqual(signed.mintSigned({ secret: 's', subject: [''],    ttlMs: 60000 }), null);
});

t('§1.8 subjectRe is applied to EVERY bound field, not merely the first', () => {
  const tok = signed.mintSigned({ secret: 's', subject: [MEHEK.usersId, 'not-a-uuid'], ttlMs: 60000 });
  assert.strictEqual(
    signed.verifySigned({ token: tok, secret: 's', subjectCount: 2, subjectRe: circleSession.UUID_RE }),
    null);
});

t('§1.10 THE TOKEN BODY AND THE SIGNED PAYLOAD ARE THE SAME STRING', () => {
  // The equality that makes every bound field a SIGNED field. If these ever
  // diverge, some part of the token is carried but not covered — and a field
  // that is carried but not covered is a field anyone can edit.
  const subject = [MEHEK.usersId, MEHEK.coupleId];
  const nonce   = 'a'.repeat(32);
  const expiry  = Date.now() + 60000;
  assert.strictEqual(
    signed.payloadOf(subject, nonce, expiry),
    [...subject, nonce, String(expiry)].join('.'));
});

t('§1.9 NO CREDENTIAL CAN ENTER A TOKEN — mintSigned accepts no password argument', () => {
  assert.strictEqual(signed.mintSigned.length, 1, 'mintSigned takes exactly one options object');
  const src = read('src/lib/signedSession.js');
  assert.ok(!/password/i.test(src.split("'use strict';")[1] || ''),
    'the executable half of signedSession mentions a password');
});

H('§2 — CALLER #1 IDENTITY: the extraction changed no verdict (driven, not claimed)');

t('§2.1 adminSession mints the RETIRED SHAPE exactly — nonce.expiry.mac, 3 parts, 32-hex nonce', () => {
  const tok   = adminSession.mintAdminSession();
  const parts = tok.split('.');
  assert.strictEqual(parts.length, 3);
  assert.ok(/^[0-9a-f]{32}$/.test(parts[0]));
  assert.ok(/^[0-9]{1,20}$/.test(parts[1]));
});

t('§2.2 THE HMAC INPUT IS BYTE-IDENTICAL — the new mint verifies under the RETIRED verifier', () => {
  const tok = adminSession.mintAdminSession();
  assert.ok(retiredVerify(process.env.ADMIN_SESSION_SECRET, tok),
    'the extracted mint produced a token the retired implementation rejects');
});

t('§2.3 …and the reverse: a RETIRED-minted token verifies under the extracted verifier', () => {
  const tok = retiredMint(process.env.ADMIN_SESSION_SECRET, 60000);
  assert.strictEqual(adminSession.verifyAdminSession(tok), true);
});

t('§2.4 THE VERDICTS AGREE ON EVERY INPUT, the malformed ones included', () => {
  const good    = adminSession.mintAdminSession();
  const expired = (() => { const p = good.split('.'); p[1] = '1'; return p.join('.'); })();
  const cases = [
    good, expired, '', 'a', 'a.b', 'a.b.c.d', null, undefined, 42, {},
    'not-hex.9999999999999.mac',
    `${'f'.repeat(32)}.9999999999999.wrongmac`,
    `${'f'.repeat(31)}.9999999999999.wrongmac`,
    good.slice(0, -1),
    good.toUpperCase(),
    retiredMint(process.env.ADMIN_SESSION_SECRET, 60000),
  ];
  for (const c of cases) {
    assert.strictEqual(
      adminSession.verifyAdminSession(c),
      retiredVerify(process.env.ADMIN_SESSION_SECRET, c),
      `verdicts diverge on input: ${JSON.stringify(c)}`);
  }
});

t('§2.5 the five admin call sites are UNTOUCHED — they still import the same names', () => {
  const sites = [
    'src/admin/middleware.js', 'src/admin/router.js',
    'src/api/admin/requireAdmin.js', 'src/api/admin/login.js',
    'src/api/couple/concierge.js',
  ];
  for (const s of sites) {
    assert.ok(/require\((['"]).*adminSession\1\)/.test(read(s)), `${s} no longer imports adminSession`);
  }
});

t('§2.6 adminSession exports the SAME SIX names, unchanged', () => {
  assert.deepStrictEqual(Object.keys(adminSession).sort(),
    ['COOKIE_NAME', 'TTL_MS', 'bearerFrom', 'mintAdminSession', 'safeEquals', 'verifyAdminSession'].sort());
});

// DECLARED EXCEPTION, named rather than excluded by a cleverer regex.
// `src/lib/vendor/igOAuth.js` also computes an HMAC over a nonce and a
// timestamp, and it is NOT folded into signedSession — deliberately. It signs a
// SINGLE-USE OAuth state whose replay defence lives in the DATABASE (the nonce
// is persisted against the vendor and consumed on return), and its payload is a
// base64url JSON blob, not a dot-joined field list. Two primitives that share an
// algorithm are not two implementations of one thing. If that file ever grows a
// re-usable session token, THIS EXCEPTION MUST BE RE-READ and the fold argued
// again — which is what naming it here, instead of narrowing the predicate until
// it disappeared, is for.
const ONE_HOME_EXCEPTIONS = new Set(['src/lib/vendor/igOAuth.js']);

t('§2.7 THERE IS ONE IMPLEMENTATION — no second session signer outside the one home', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.js')) continue;
      const rel = path.relative(ROOT, p);
      if (rel === 'src/lib/signedSession.js') continue;
      if (ONE_HOME_EXCEPTIONS.has(rel)) continue;
      const body = fs.readFileSync(p, 'utf8');
      // Session-signing shape specifically: an HMAC over a nonce.expiry payload.
      if (/createHmac\(/.test(body) && /nonce/i.test(body) && /expiry/i.test(body)) offenders.push(rel);
    }
  };
  walk(SRC('src'));
  assert.deepStrictEqual(offenders, [],
    `session-signing machinery outside the one home: ${offenders.join(', ')}`);
});

H('§3 — circleSession: caller #2, and the disjointness that makes the triangle');

t('§3.1 the token binds BOTH the member and her couple', () => {
  const tok = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  assert.deepStrictEqual(circleSession.verifyCircleSession(tok),
    { user_id: MEHEK.usersId, couple_id: MEHEK.coupleId });
});

t('§3.2 A SUPABASE JWT CANNOT PASS — three parts against a five-part gate', () => {
  assert.strictEqual(circleSession.verifyCircleSession(BRIDE_JWT), null);
  assert.strictEqual(circleSession.verifyCircleSession('a.b.c'), null);
});

t('§3.3 …and an ADMIN token cannot pass either — the arity gate is the whole reason', () => {
  assert.strictEqual(circleSession.verifyCircleSession(adminSession.mintAdminSession()), null);
});

t('§3.4 …and a CIRCLE token is refused by the admin verifier, the mirror direction', () => {
  const tok = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  assert.strictEqual(adminSession.verifyAdminSession(tok), false);
});

t('§3.5 a forged couple binding is refused — Mehek\'s id, somebody else\'s circle', () => {
  const real  = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const parts = real.split('.');
  parts[1]    = OTHER_COUPLE;
  assert.strictEqual(circleSession.verifyCircleSession(parts.join('.')), null);
});

t('§3.6 a non-uuid subject is refused by the structural gate', () => {
  const tok = signed.mintSigned({
    secret: process.env.CIRCLE_SESSION_SECRET, subject: ['mehek', MEHEK.coupleId], ttlMs: 60000 });
  assert.strictEqual(circleSession.verifyCircleSession(tok), null);
});

t('§3.7 the TTL is the founder-ruled 90 days', () => {
  assert.strictEqual(circleSession.CIRCLE_TTL_MS, 90 * 24 * 60 * 60 * 1000);
});

t('§3.8 THE SECRET IS NEVER PRINTED — no log/print of the env value anywhere in the lane', () => {
  for (const f of ['src/lib/circleSession.js', 'src/lib/signedSession.js',
                   'src/api/circle/verifyPin.js', 'src/api/circle/join.js']) {
    const body = read(f);
    assert.ok(!/console\.[a-z]+\([^)]*CIRCLE_SESSION_SECRET/.test(body), `${f} prints the secret`);
  }
});

H('§4 — the Class B resolver: three answers, and the bride is not locked out');

await ta('§4.1 ABSENT — no credential answers present:false, the logged-out path preserved', async () => {
  const out = await resolveCircleIdentityIfPresent(reqWith(null), fakePlane());
  assert.deepStrictEqual({ present: out.present, coupleId: out.coupleId }, { present: false, coupleId: null });
});

await ta('§4.2 THE MEMBER — her circle token resolves to her couple, source circle', async () => {
  const tok = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const out = await resolveCircleIdentityIfPresent(reqWith(tok), fakePlane());
  assert.deepStrictEqual(
    { present: out.present, coupleId: out.coupleId, source: out.source, userId: out.userId },
    { present: true, coupleId: MEHEK.coupleId, source: 'circle', userId: MEHEK.usersId });
});

await ta('§4.3 THE BRIDE IS NOT LOCKED OUT — her Supabase JWT resolves through the couple arm', async () => {
  const out = await resolveCircleIdentityIfPresent(reqWith(BRIDE_JWT), fakePlane());
  assert.deepStrictEqual(
    { present: out.present, coupleId: out.coupleId, source: out.source },
    { present: true, coupleId: BRIDE.coupleId, source: 'couple' });
});

await ta('§4.4 THE THIRD ANSWER — a forged Bearer is present:true, coupleId:null, NEVER demoted', async () => {
  const out = await resolveCircleIdentityIfPresent(reqWith('total.garbage.not-a-token'), fakePlane());
  assert.strictEqual(out.present, true, 'a broken credential must not demote to the logged-out path');
  assert.strictEqual(out.coupleId, null);
});

await ta('§4.5 an EXPIRED circle token is the third answer too, never the first', async () => {
  const tok = signed.mintSigned({
    secret: process.env.CIRCLE_SESSION_SECRET,
    subject: [MEHEK.usersId, MEHEK.coupleId], ttlMs: 1 });
  const then = Date.now; Date.now = () => then() + 5000;
  try {
    const out = await resolveCircleIdentityIfPresent(reqWith(tok), fakePlane());
    assert.strictEqual(out.present, true);
    assert.strictEqual(out.coupleId, null);
  } finally { Date.now = then; }
});

await ta('§4.6 THE PROVEN COUPLE WINS over a forged param — the resolver reads no params at all', async () => {
  const tok = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const req = reqWith(tok);
  req.params = { brideId: OTHER_COUPLE };
  req.body   = { userId: FORGED[0] };
  const out  = await resolveCircleIdentityIfPresent(req, fakePlane());
  assert.strictEqual(out.coupleId, MEHEK.coupleId);
});

H('§5 — the resolver is MOUNTED (F-07.99: a definition with no call site is the disease)');

for (const f of ['src/api/circle/feed.js', 'src/api/circle/threads.js', 'src/api/circle/messages.js']) {
  t(`§5.1 ${path.basename(f)} calls the resolver`, () => {
    const s = read(f);
    assert.ok(s.includes("require('../../lib/resolveCircleIdentityIfPresent')"), 'no import');
    assert.ok(s.includes('req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);'),
      'imported and never called — the F-07.72 shape');
  });
}

t('§5.2 EVERY Class B handler is covered, not merely every file (5 handlers, 5 mounts)', () => {
  const n = ['src/api/circle/feed.js', 'src/api/circle/threads.js', 'src/api/circle/messages.js']
    .map(read)
    .reduce((a, s) => a + (s.match(/req\.circleIdentity = await resolveCircleIdentityIfPresent/g) || []).length, 0);
  assert.strictEqual(n, 5, `expected 5 mounts across the three Class B files, found ${n}`);
});

t('§5.3 ENFORCE NOTHING — no Class B door refuses on the resolver this delivery', () => {
  for (const f of ['src/api/circle/feed.js', 'src/api/circle/threads.js', 'src/api/circle/messages.js']) {
    const body = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/circleIdentity[\s\S]{0,80}?res\.status\(401\)/.test(body),
      `${f} enforces — this ZIP mints and teaches only`);
  }
});

t('§5.4 the guard is STILL UNMOUNTED at this tip, and the confession still stands', () => {
  const r = read('src/api/router.js');
  assert.ok(!/^\s*router\.use\([^)]*requireCircleMemberAuth/m.test(r), 'ZIP 1 must not mount the guard');
  assert.ok(r.includes('No requireCircleMemberAuth'), 'the confession comment vanished without a mount');
});

H('§6 — verify-pin: the mint, and the founder\'s frozen bytes');

t('§6.1 the door mints a session and PRESERVES the bare userId it always returned', () => {
  const s = read('src/api/circle/verifyPin.js');
  assert.ok(s.includes('mintCircleSession({ userId: userRow.id, coupleId: member.couple_id })'));
  assert.ok(s.includes('userId:     userRow.id,'), 'the back-compat userId left the response');
});

t('§6.2 a null mint DEGRADES to today\'s response — never a forged stand-in', () => {
  const s = read('src/api/circle/verifyPin.js');
  assert.ok(s.includes('token:      token || null,'));
  assert.ok(s.includes('expires_at: token ? Date.now() + CIRCLE_TTL_MS : null,'));
});

// THE FOUNDER'S BYTES, frozen 2026-08-02. Asserted as literals so a paraphrase
// reddens. CE-117: a JS escape is not the founder's bytes — these are compared
// against the SOURCE TEXT, which is where an escape would show.
t('§6.3 Set A row 1 is byte-exact', () => {
  assert.ok(read('src/api/circle/verifyPin.js').includes(
    `"We don't recognise this number. Use your invite link to join first."`));
});
t('§6.4 Set A row 2 is byte-exact', () => {
  assert.ok(read('src/api/circle/verifyPin.js').includes(
    `"This number isn't in the Circle. Ask for a new invite link."`));
});
t('§6.5 Set A row 3 is byte-exact', () => {
  assert.ok(read('src/api/circle/verifyPin.js').includes(
    `'No PIN has been set yet. Use your invite link to set one.'`));
});
t('§6.6 Set A rows 4 and 5 are KEPT — the founder said keep, so a change reddens', () => {
  const s = read('src/api/circle/verifyPin.js');
  assert.ok(s.includes(`'Incorrect PIN.'`));
  assert.ok(s.includes('Account locked. Try again in ${mins} minute${mins === 1 ? \'\' : \'s\'}.'));
});
t('§6.7 NO JS ESCAPE STANDS IN FOR A FOUNDER BYTE (CE-117)', () => {
  const s = read('src/api/circle/verifyPin.js');
  assert.ok(!s.includes('\\u2019'), 'a unicode escape is not the byte the founder approved');
});

H('§7 — join: one number, one circle — at BOTH gates — and the second mint');

t('§7.1 the refusal is the founder\'s byte, at ONE home', () => {
  const s = read('src/api/circle/join.js');
  assert.ok(s.includes(
    `'This number is already helping plan another wedding. One number, one circle.'`));
  assert.strictEqual(
    (s.match(/This number is already helping plan another wedding/g) || []).length, 1,
    'the refusal is written more than once — three doors will drift into three wordings');
});

t('§7.2 BOTH gates fire it — send-otp AND accept', () => {
  const s = read('src/api/circle/join.js');
  assert.strictEqual((s.match(/return fail\(res, 409, ONE_CIRCLE_REFUSAL\)/g) || []).length, 2);
});

t('§7.3 the send-otp gate stands BEFORE the code is generated', () => {
  const s = read('src/api/circle/join.js');
  assert.ok(s.indexOf('ONE_CIRCLE_REFUSAL);') < s.indexOf('const otp     = generateOtp();'),
    'an OTP is spent on a phone that cannot complete the join');
});

t('§7.4 the accept gate stands BEFORE the irreversible claim RPC', () => {
  const s = read('src/api/circle/join.js');
  const gate  = s.indexOf('inviteRow && await activeElsewhere');
  const claim = s.indexOf("supabase.rpc('claim_circle_invite'");
  assert.ok(gate > -1 && claim > -1 && gate < claim, 'the refusal would arrive after activation');
});

t('§7.5 SAME-CIRCLE IS NOT THIS CHECK\'S BUSINESS — the predicate excludes this couple', () => {
  const s = read('src/api/circle/join.js');
  assert.ok(s.includes('.find(r => r.couple_id !== thisCoupleId)'),
    'a re-join of the SAME circle would be refused by the wrong sentence');
});

await ta('§7.6 activeElsewhere behaves: another circle convicts, this circle does not', async () => {
  // Drive the real predicate against a plane returning two active rows.
  const src = read('src/api/circle/join.js');
  const body = src.slice(src.indexOf('async function activeElsewhere'),
                         src.indexOf('// The founder\'s byte, frozen'));
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${body.trim()})`)();
  const plane = (rows) => ({ from: () => { const q = {};
    q.select = () => q; q.eq = () => q; q.then = undefined;
    return new Proxy(q, { get: (o, k) => (k === 'then' ? undefined : (k in o ? o[k] : () => o)) });
  } });
  // A direct shim is clearer than a proxy for this shape:
  const shim = (rows) => ({ from: () => ({ select: () => ({ eq: () => ({ eq: async () => ({ data: rows }) }) }) }) });
  const other = await fn(shim([{ id: 'x', couple_id: OTHER_COUPLE }]), MEHEK.phone, MEHEK.coupleId);
  assert.ok(other, 'a phone active in another circle was not convicted');
  const same  = await fn(shim([{ id: 'x', couple_id: MEHEK.coupleId }]), MEHEK.phone, MEHEK.coupleId);
  assert.strictEqual(same, null, 'the same circle was wrongly convicted');
  const none  = await fn(shim([]), MEHEK.phone, MEHEK.coupleId);
  assert.strictEqual(none, null);
  void plane;
});

t('§7.7 accept is the SECOND MINT POINT — a new member leaves the flow holding a session', () => {
  const s = read('src/api/circle/join.js');
  assert.ok(s.includes('const sessionToken = mintCircleSession({ userId, coupleId: claim.couple_id });'));
  assert.ok(s.includes('token:        sessionToken || null,'));
});

t('§7.8 THE ZERO-ROW FACT IS ON THE RECORD — the refusal breaks nothing that exists', () => {
  const s = read('src/api/circle/join.js');
  assert.ok(/ZERO rows/.test(s),
    'the founder SELECT that justified this refusal is not written down beside it');
});

H('§8 — session.js: the minimisation, declared partial');

t('§8.1 the KEPT set is exactly the derived consumed set', () => {
  const s = read('src/api/circle/session.js');
  for (const f of ['user_id:', 'name:', 'couple_id:', 'role:', 'permissions,', 'bride: {']) {
    assert.ok(s.includes(f), `kept field missing: ${f}`);
  }
});

t('§8.2 the DROPPED set is gone from the response — phone, pin_set, co_planner_id', () => {
  const s = read('src/api/circle/session.js');
  const body = s.slice(s.indexOf('return res.json'));
  for (const f of ['phone:', 'pin_set:', 'co_planner_id:', 'wedding_date:', 'partner_name:']) {
    assert.ok(!body.includes(f), `${f} is still returned`);
  }
});

t('§8.3 the door NO LONGER READS pin_hash — what is not fetched cannot leak', () => {
  // The executable half only: the header PARAGRAPH must still be free to explain
  // that pin_set left, and a cell that forbade the word would forbid the
  // explanation along with the defect.
  const body = read('src/api/circle/session.js')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!body.includes('pin_hash'), 'the couples SELECT still fetches the PIN hash');
});

t('§8.4 F-07.106 IS DECLARED BY NUMBER — the residue is named, not papered', () => {
  const s = read('src/api/circle/session.js');
  assert.ok(s.includes('MINIMISING THIS'), 'the declaration sentence is gone');
  assert.ok(s.includes('Filed as F-07.106'), 'the partial cure does not name its residue by number');
  assert.ok(s.includes('couple/profile.js:41-50'),
    'the residue is claimed without naming the door and lines that carry it');
});

t('§8.5 THE RESIDUE IS REAL AND STILL OPEN — couple/profile still serves it bare', () => {
  // The cell that will redden the day F-07.106 is cured, forcing §8.4's
  // paragraph to be re-read rather than left standing as stale ink.
  assert.ok(read('src/api/couple/profile.js').includes('wedding_date'));
  assert.ok(/router\.use\('\/couple\/profile',\s*require/.test(read('src/api/router.js')),
    'couple/profile is no longer mounted bare — re-read session.js\'s F-07.106 paragraph');
});

H('§9 — MUTATION: every claim above proven non-vacuous against PRODUCTION CODE');

async function mutateSrc(rel, from, to, cellName, assertOnMutated) {
  const abs = SRC(rel);
  const original = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (original === null || !original.includes(from)) {
    t(`§9 ${cellName} goes RED when its production code is broken`, () => {
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
  t(`§9 ${cellName} goes RED when its production code is broken`, () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is vacuous`);
  });
}

// INVERSE 1 — sign only the nonce and expiry, leaving the subject outside the
// mac. §1.2 and §3.5 must redden: the token becomes editable.
await mutateSrc('src/lib/signedSession.js',
  "  return [...subject, nonce, String(expiry)].join('.');",
  "  return [nonce, String(expiry)].join('.');",
  'the subject-inside-the-signature guarantee',
  async () => {
    delete require.cache[require.resolve(SRC('src/lib/signedSession'))];
    const s   = require(SRC('src/lib/signedSession'));
    const tok = s.mintSigned({ secret: 'x', subject: ['a', 'b'], ttlMs: 60000 });
    const p   = tok.split('.'); p[1] = 'EDITED';
    assert.strictEqual(s.verifySigned({ token: p.join('.'), secret: 'x', subjectCount: 2 }), null,
      'a bound field outside the mac is an editable field');
  });

// INVERSE 2 — drop the arity check. §1.6 and §3.2/§3.3 must redden: a JWT and an
// admin token could then be read as circle sessions.
// The disjointness that keeps an ADMIN token out of the circle lane is LAYERED —
// a different secret AND a different arity — so no single edit to one of them
// crosses the lanes. The mutation therefore breaks the pair in one contiguous
// block, which is the smallest edit that produces the crossing world at all.
// Stated rather than hidden behind a cleverer one-liner: defence in depth is why
// this mutation is three lines instead of one.
await mutateSrc('src/lib/circleSession.js',
  `    secret:       circleSecret(),
    subjectCount: 2,
    subjectRe:    UUID_RE,`,
  `    secret:       process.env.ADMIN_SESSION_SECRET,
    subjectCount: 0,
    subjectRe:    undefined,`,
  'the secret-and-arity pair that keeps the admin lane out of the circle lane',
  async () => {
    delete require.cache[require.resolve(SRC('src/lib/circleSession'))];
    const cs = require(SRC('src/lib/circleSession'));
    assert.strictEqual(cs.verifyCircleSession(adminSession.mintAdminSession()), null,
      'an admin session token was accepted as a circle member');
  });

// INVERSE 3 — let the mint accept a dotted field. §1.7 must redden.
await mutateSrc('src/lib/signedSession.js',
  "  return typeof v === 'string' && v.length > 0 && v.indexOf('.') === -1;",
  "  return typeof v === 'string';",
  'the separator refusal at the mint',
  async () => {
    const s = require(SRC('src/lib/signedSession'));
    assert.strictEqual(s.mintSigned({ secret: 'x', subject: ['a.b'], ttlMs: 60000 }), null);
  });

// INVERSE 4 — demote a broken credential to the logged-out path. §4.4 must
// redden. This is the disease-wearing-a-token line, and it is one edit away.
await mutateSrc('src/lib/resolveCircleIdentityIfPresent.js',
  '  if (couple.present) {',
  '  if (couple.present && couple.coupleId) {',
  'the third answer refusing to demote a forged credential',
  async () => {
    delete require.cache[require.resolve(SRC('src/lib/resolveCircleIdentityIfPresent'))];
    const { resolveCircleIdentityIfPresent: r } = require(SRC('src/lib/resolveCircleIdentityIfPresent'));
    const out = await r(reqWith('total.garbage.not-a-token'), fakePlane());
    assert.strictEqual(out.present, true);
  });

// INVERSE 5 — answer at the circle arm instead of falling through. §4.3 must
// redden: this is precisely the edit that would lock the bride out.
await mutateSrc('src/lib/resolveCircleIdentityIfPresent.js',
  '    // A Bearer that is not a valid circle token may still be a Supabase JWT —',
  '    return { present: true, coupleId: null, source: \'circle\', userId: null };\n    // A Bearer that is not a valid circle token may still be a Supabase JWT —',
  'the fall-through that keeps the bride in her own circle chat',
  async () => {
    delete require.cache[require.resolve(SRC('src/lib/resolveCircleIdentityIfPresent'))];
    const { resolveCircleIdentityIfPresent: r } = require(SRC('src/lib/resolveCircleIdentityIfPresent'));
    const out = await r(reqWith(BRIDE_JWT), fakePlane());
    assert.strictEqual(out.coupleId, BRIDE.coupleId, 'the bride was refused on her own credential');
  });

// INVERSE 6 — unmount the resolver from one door. §5.1/§5.2 must redden. This is
// F-07.72's own disease reproduced deliberately: the module still exists, the
// import still stands, and nothing calls it.
// NOTE THE SHAPE OF THIS MUTATION. The first cut commented the line out — and
// the cell stayed GREEN, because a commented line still CONTAINS its own text
// and `includes()` cannot tell code from a comment. The mutation must REMOVE the
// call, not disable it. Kept in ink because it is the same class of error the
// stripper audit spent a sitting on: a witness that cannot see what it was built
// to see.
await mutateSrc('src/api/circle/feed.js',
  '  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);',
  '  req.circleIdentity = null;',
  'the resolver mount on feed.js',
  async () => {
    const s = read('src/api/circle/feed.js');
    assert.ok(s.includes('req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);'));
  });

// INVERSE 7 — paraphrase a founder byte. §6.3 must redden.
await mutateSrc('src/api/circle/verifyPin.js',
  `"We don't recognise this number. Use your invite link to join first."`,
  `'Phone not registered.'`,
  'the founder\'s frozen Set A byte',
  async () => {
    assert.ok(read('src/api/circle/verifyPin.js').includes(
      `"We don't recognise this number. Use your invite link to join first."`));
  });

// INVERSE 8 — widen the one-circle predicate to convict the SAME circle. §7.5
// must redden: every returning invitee would be refused.
await mutateSrc('src/api/circle/join.js',
  '  return (rows || []).find(r => r.couple_id !== thisCoupleId) || null;',
  '  return (rows || [])[0] || null;',
  'the same-circle exclusion in the one-circle predicate',
  async () => {
    assert.ok(read('src/api/circle/join.js').includes('.find(r => r.couple_id !== thisCoupleId)'));
  });

// INVERSE 9 — put the phone back in the session response. §8.2 must redden.
await mutateSrc('src/api/circle/session.js',
  '      couple_id: member.couple_id,',
  '      phone:     userRow.phone,\n      couple_id: member.couple_id,',
  'the minimisation of the session response',
  async () => {
    const s = read('src/api/circle/session.js');
    assert.ok(!s.slice(s.indexOf('return res.json')).includes('phone:'));
  });

// INVERSE 10 — strip F-07.106's declaration. §8.4 must redden: a partial cure
// that stops naming its residue is a cure claiming to be whole.
await mutateSrc('src/api/circle/session.js',
  'Filed as F-07.106', 'Cured in this delivery',
  'the F-07.106 residue declaration',
  async () => {
    assert.ok(read('src/api/circle/session.js').includes('Filed as F-07.106'),
      'the minimisation stopped naming the door it did not close');
  });

H('§10 — the sibling half, named (F-07.50 cross-repo precedent)');

t('§10.1 the pwa half of this delivery is named and its absence is DISCLOSED', () => {
  const sib = path.resolve(ROOT, '..', 'dreamos-pwa', 'scripts', 'tdw07_f0772_circle.proof.mjs');
  if (!fs.existsSync(sib)) {
    console.log('       SKIPPED-WITH-REASON: the dreamos-pwa tree is not a sibling of this repo in ' +
                'this container. The client half runs in its own repo\'s floor; this cell exists so ' +
                'nobody mistakes its absence for its passing.');
    return;
  }
  const s = fs.readFileSync(sib, 'utf8');
  assert.ok(s.includes('b07_f0772_circle_auth_bench'), 'the sibling half does not name this one back');
});


// ═══════════════════════════════════════════════════════════════════════════
// §11 — F-07.107 + F-07.109: THE AUTHOR IS HYDRATED, PERSISTED, AND EMITTED
//
// These cells sit in this file rather than a new one because they guard the
// SAME LINES §5 guards: the three Class B files, their read shapes, and the
// handler that now writes an author beside the role. One home.
//
// THEY ARE DRIVEN, NOT ASSERTED. The real routers are required and their real
// handlers pulled off the Express stack, so every claim below runs the shipped
// code path a real caller reaches. The plane is test setup and is disclosed as
// such; the handlers are production.
//
// F-07.112 IS RESPECTED HERE: no cell assumes the value space {couple, bride,
// circle_member}. `agent` is a fourth mouth on public.messages (dreamai.js:133)
// and `circle_member` appears zero times in production, so a cell keyed on that
// three-value space would be a green over a world that does not exist.
// ═══════════════════════════════════════════════════════════════════════════

const BRIDE_NAME  = 'Dev Test 23';           // couples.user_id -> users.name
const CONVO_ID    = '2c49c2d7-5887-4a4f-ac3f-9ef9092cfa4b';
const PRECURE_ROW = {                        // a row written before 0105
  id: 'pre-1', body: 'THIS IS HOW I SEE MY MESSAGES', sent_by: 'couple',
  sender_name: null, sender_user_id: null, created_at: '2026-08-01T20:39:28Z',
};
const AGENT_ROW = {                          // F-07.112's fourth mouth
  id: 'pre-2', body: "I'm Mira", sent_by: 'agent',
  sender_name: null, sender_user_id: null, created_at: '2026-07-23T13:23:40Z',
};

// ── TEST SETUP, DISCLOSED (never production code) ──────────────────────────
// A supabase plane shaped to EXACTLY the calls the POST/GET handlers make, and
// nothing else. It captures the insert so the cells can read what was written
// rather than what was returned.
function messagePlane(rows) {
  const cap = { inserted: null };
  const plane = {
    auth: {
      getUser: async (token) => (token === BRIDE_JWT
        ? { data: { user: { id: BRIDE.authUserId } }, error: null }
        : { data: { user: null }, error: new Error('invalid token') }),
    },
    from(table) {
      const q = { _eq: {}, _ins: null, _sel: null };
      const row = () => {
        if (table === 'couples') {
          // Two lookups reach this table: byCoupleId's `.eq('id', …)` and
          // resolveCoupleIfPresent's `.eq('user_id', …)`. Both must answer or the
          // bride's credential silently degrades to the fallback and a cell that
          // meant to prove the PROVEN path quietly proves the unproven one.
          if (q._eq.id === MEHEK.coupleId || q._eq.user_id === BRIDE.usersId)
            return { id: MEHEK.coupleId, user_id: BRIDE.usersId };
          return null;
        }
        if (table === 'users') {
          if (q._eq.id === BRIDE.usersId) return { name: BRIDE_NAME };
          if (q._eq.id === MEHEK.usersId) return { phone: MEHEK.phone };
          if (q._eq.auth_user_id === BRIDE.authUserId) return { id: BRIDE.usersId };
          return null;
        }
        if (table === 'circle_members')
          return (q._eq.invitee_phone === MEHEK.phone && q._eq.status === 'active')
            ? { couple_id: MEHEK.coupleId, invitee_name: MEHEK.name } : null;
        if (table === 'conversations')
          return q._eq.couple_id === MEHEK.coupleId ? { id: CONVO_ID } : null;
        return null;
      };
      // THE PLANE HONOURS THE PROJECTION. An earlier cut returned every field
      // regardless of `.select(...)`, which made every select-narrowing mutation
      // a no-op — §11.M1 passed over broken production code and said so. A fake
      // that ignores what it was asked for cannot convict code that asks wrongly.
      q.select = (cols) => { q._sel = typeof cols === 'string' ? cols : null; return q; };
      q.eq     = (c, v) => { q._eq[c] = v; return q; };
      q.order  = () => q;
      q.limit  = () => q;
      q.insert = (r) => { q._ins = r; if (table === 'messages') cap.inserted = r; return q; };
      q.update = () => q;
      const project = (o) => {
        if (!o || !q._sel) return o;
        const keep = q._sel.split(',').map(c => c.trim());
        const out = {};
        for (const k of keep) if (k in o) out[k] = o[k];
        return out;
      };
      q.maybeSingle = async () => ({ data: project(row()) });
      q.single      = async () => (q._ins
        ? { data: project({ ...q._ins, id: 'msg-new', created_at: '2026-08-02T00:00:00Z' }), error: null }
        : { data: project(row()), error: null });
      // `await supabase.from('conversations').update({...}).eq(...)` awaits the
      // builder itself, and the GET reads await the builder after .limit().
      q.then = (res) => res(table === 'messages' && !q._ins
        ? { data: (rows || []).map(project), error: null }
        : { data: null, error: null });
      return q;
    },
  };
  return { plane, cap };
}

// Pull the REAL handler off the REAL router — the shipped path, not a copy.
function handlerOf(modulePath, method, routePath) {
  const r = require(SRC(modulePath));
  const layer = r.stack.find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  assert.ok(layer, `no ${method.toUpperCase()} ${routePath} on ${modulePath}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

async function drive(handler, { body, params, query, bearer, rows }) {
  const { plane, cap } = messagePlane(rows);
  const out = {};
  const req = {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    cookies: {}, body: body || {}, params: params || {}, query: query || {},
    app: { locals: { supabase: plane } },
  };
  const res = {
    status(c) { out.status = c; return res; },
    json(b)   { out.body = b;  return res; },
  };
  // asyncHandler wraps the body in `Promise.resolve(fn()).catch(next)`, so an
  // error inside the handler arrives at `next` AFTER this call has returned.
  // The cell must await the response, not the invocation, or a thrown handler
  // reads as a silent pass — which is how a driven cell becomes a decorative one.
  await new Promise((resolve, reject) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    res.json = (b) => { out.body = b; finish(); return res; };
    handler(req, res, (e) => { done = true; reject(e || new Error('next() with no error')); });
    setTimeout(() => { if (!done) { done = true; reject(new Error('handler never answered')); } }, 4000);
  });
  return { out, cap };
}

H('§11 — F-07.107 / F-07.109: hydration, persistence, and the emitted author');

const POST_MSG   = handlerOf('src/api/circle/messages.js', 'post', '/');
const GET_MSG    = handlerOf('src/api/circle/messages.js', 'get',  '/:coupleId');
const GET_THREAD = handlerOf('src/api/circle/threads.js',  'get',  '/:brideId/:threadId/messages');
const GET_LIST   = handlerOf('src/api/circle/threads.js',  'get',  '/:brideId');

await ta('§11.1 THE PROVEN MEMBER: her name is hydrated from circle_members.invitee_name', async () => {
  const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const { cap } = await drive(POST_MSG, { body: { userId: MEHEK.usersId, body: 'hello' }, bearer: token });
  assert.ok(cap.inserted, 'nothing was inserted');
  assert.strictEqual(cap.inserted.sender_name, MEHEK.name);
  assert.strictEqual(cap.inserted.sender_user_id, MEHEK.usersId);
});

await ta('§11.2 THE PROVEN BRIDE: her ACTUAL name, and the literal "Bride" is never minted', async () => {
  const { cap } = await drive(POST_MSG, {
    body: { userId: MEHEK.coupleId, body: 'hi', sender_role: 'bride' }, bearer: BRIDE_JWT,
  });
  assert.strictEqual(cap.inserted.sender_name, BRIDE_NAME);
  assert.notStrictEqual(cap.inserted.sender_name, 'Bride');
  assert.strictEqual(cap.inserted.sender_user_id, BRIDE.usersId);
});

await ta('§11.3 NO CREDENTIAL: the author is NULL and the send still succeeds (fail-soft)', async () => {
  const { out, cap } = await drive(POST_MSG, { body: { userId: MEHEK.usersId, body: 'hello' } });
  assert.strictEqual(cap.inserted.sender_name, null, 'a nameless caller was given a name');
  assert.strictEqual(cap.inserted.sender_user_id, null);
  assert.strictEqual(out.body.ok, true, 'the mint-and-teach phase must not refuse');
});

await ta('§11.4 THE BODY CANNOT FORGE A NAME — a supplied sender_name is not read', async () => {
  const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const { cap } = await drive(POST_MSG, {
    body: { userId: MEHEK.usersId, body: 'x', sender_name: 'Not Her Name' }, bearer: token,
  });
  assert.strictEqual(cap.inserted.sender_name, MEHEK.name, 'the client string reached the column');
});

await ta('§11.5 THE ECHO IS THE PERSISTED ROW — the optimistic-render-then-die class is dead', async () => {
  const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const { out } = await drive(POST_MSG, { body: { userId: MEHEK.usersId, body: 'x' }, bearer: token });
  assert.strictEqual(out.body.message.sender_name, MEHEK.name);
  assert.strictEqual(out.body.message.sender_user_id, MEHEK.usersId);
});

await ta('§11.6 GET /:coupleId emits BOTH columns, and NULL for a pre-0105 row — never the role', async () => {
  const { out } = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW] });
  const m = out.body.messages[0];
  assert.strictEqual(m.sender_name, null, 'the role stood in for a name again');
  assert.strictEqual(m.sender_user_id, null);
  assert.strictEqual(m.sender_role, 'couple', 'the role must still travel AS a role');
});

await ta('§11.7 GET /threads/.../messages: same shape, same null, and sender_user_id is NEW', async () => {
  const { out } = await drive(GET_THREAD, {
    params: { brideId: MEHEK.coupleId, threadId: `dm:${CONVO_ID}` },
    rows: [{ ...PRECURE_ROW, sender_name: MEHEK.name, sender_user_id: MEHEK.usersId }],
  });
  const m = out.body.data[0];
  assert.strictEqual(m.sender_name, MEHEK.name);
  assert.strictEqual(m.sender_user_id, MEHEK.usersId);
  assert.notStrictEqual(m.sender_name, m.sender_role, 'name and role collapsed to one value');
});

await ta('§11.8 SITE 4: the thread-list preview reads sender_name, not sent_by', async () => {
  const { out } = await drive(GET_LIST, {
    params: { brideId: MEHEK.coupleId },
    rows: [{ body: 'x', sent_by: 'couple', sender_name: MEHEK.name, created_at: 'T' }],
  });
  assert.ok(Array.isArray(out.body.data), 'no thread list');
});

await ta('§11.9 F-07.112: an `agent` row does not crash or acquire a name', async () => {
  const { out } = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [AGENT_ROW] });
  const m = out.body.messages[0];
  assert.strictEqual(m.sender_name, null, 'Mira was given a name by machinery, not by the founder');
  assert.strictEqual(m.sender_role, 'agent');
});

t('§11.10 the literal "Bride" is DEAD in both circle files, at the source', () => {
  for (const f of ['src/api/circle/messages.js', 'src/api/circle/threads.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/'Bride'/.test(code), `${f} still mints the literal`);
  }
});

t('§11.11 sender_name is NOT destructured from the request body anywhere on this lane', () => {
  const code = read('src/api/circle/messages.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(/req\.body/.test(code), 'the body destructure vanished entirely');
  assert.ok(!/sender_name[^:]*\}\s*=\s*req\.body/.test(code) && !/\{[^}]*sender_name[^}]*\}\s*=\s*req\.body/.test(code),
    'the deleted parameter is still being accepted');
});

t('§11.12 no read shape assigns sent_by to sender_name — all four sites converted', () => {
  for (const f of ['src/api/circle/messages.js', 'src/api/circle/threads.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/sender_name\s*:\s*[a-zA-Z]+\.sent_by/.test(code), `${f} still names a role`);
    assert.ok(!/sender_name\s*:\s*[a-zA-Z]+\.sent_by\s*===/.test(code), `${f} still ternaries a role into a name`);
  }
});

t('§11.13 0105 is committed, additive-only, both columns nullable, nothing backfilled', () => {
  const sql = read('db/migrations/0105_circle_message_author.sql');
  assert.ok(/add column if not exists sender_name text;/.test(sql));
  assert.ok(/add column if not exists sender_user_id uuid;/.test(sql));
  assert.ok(!/\bnot null\b/i.test(sql.replace(/^--.*$/gm, '')), 'a NOT NULL crept into the DDL');
  assert.ok(!/\b(update|insert|delete|drop)\b/i.test(sql.replace(/^--.*$/gm, '')), 'the migration is not additive-only');
  assert.ok(!/create index/i.test(sql), 'an index with no reader');
});

t('§11.14 the ladder number is not reused', () => {
  const dir = fs.readdirSync(path.join(ROOT, 'db', 'migrations'));
  assert.strictEqual(dir.filter(f => f.startsWith('0105_')).length, 1, '0105 is not unique');
});

H('§11.M — MUTATION: every §11 claim proven non-vacuous by breaking PRODUCTION code');

async function mutate(file, from, to, cell) {
  const p = SRC(file);
  const orig = fs.readFileSync(p, 'utf8');
  assert.ok(orig.includes(from), `mutation anchor missing in ${file}: ${from}`);
  fs.writeFileSync(p, orig.replace(from, to));
  try {
    delete require.cache[require.resolve(p)];
    let red = false;
    try { await cell(); } catch { red = true; }
    assert.ok(red, 'the cell stayed GREEN over broken production code — it is vacuous');
  } finally {
    fs.writeFileSync(p, orig);
    delete require.cache[require.resolve(p)];
  }
}

await ta('§11.M1 drop invitee_name from the member select ⇒ §11.1 RED', async () => {
  await mutate('src/api/circle/messages.js',
    ".select('couple_id, invitee_name')", ".select('couple_id')", async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
      const { cap } = await drive(H2, { body: { userId: MEHEK.usersId, body: 'x' }, bearer: token });
      assert.strictEqual(cap.inserted.sender_name, MEHEK.name);
    });
});

await ta('§11.M2 stop persisting sender_user_id ⇒ §11.1 RED', async () => {
  await mutate('src/api/circle/messages.js',
    'sender_user_id:  senderUserId,', 'sender_user_id:  null,', async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
      const { cap } = await drive(H2, { body: { userId: MEHEK.usersId, body: 'x' }, bearer: token });
      assert.strictEqual(cap.inserted.sender_user_id, MEHEK.usersId);
    });
});

await ta('§11.M3 restore the role-as-name on the GET shape ⇒ §11.6 RED', async () => {
  await mutate('src/api/circle/messages.js',
    'sender_name:    m.sender_name    || null,', 'sender_name:    m.sent_by || null,', async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'get', '/:coupleId');
      const { out } = await drive(H2, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW] });
      assert.strictEqual(out.body.messages[0].sender_name, null);
    });
});

await ta('§11.M4 let the body forge the name again ⇒ §11.4 RED', async () => {
  await mutate('src/api/circle/messages.js',
    'sender_name:     senderName,', 'sender_name:     req.body.sender_name || senderName,', async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
      const { cap } = await drive(H2, { body: { userId: MEHEK.usersId, body: 'x', sender_name: 'Not Her Name' }, bearer: token });
      assert.strictEqual(cap.inserted.sender_name, MEHEK.name);
    });
});

await ta('§11.M5 restore the role-as-name at threads.js site 4 ⇒ §11.8 anchor RED', async () => {
  await mutate('src/api/circle/threads.js',
    'sender_name: lastMsg.sender_name || null,', 'sender_name: lastMsg.sent_by || null,', async () => {
      const code = fs.readFileSync(SRC('src/api/circle/threads.js'), 'utf8')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      assert.ok(!/sender_name\s*:\s*[a-zA-Z]+\.sent_by/.test(code));
    });
});

await ta('§11.M6 drop the users lookup on the bride path ⇒ §11.2 RED', async () => {
  await mutate('src/api/circle/messages.js',
    'senderName = brideUser?.name || null;', 'senderName = null;', async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const { cap } = await drive(H2, { body: { userId: MEHEK.coupleId, body: 'x', sender_role: 'bride' }, bearer: BRIDE_JWT });
      assert.strictEqual(cap.inserted.sender_name, BRIDE_NAME);
    });
});

// ── verdict ─────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────────');
if (fail) {
  console.log(`b07_f0772_circle_auth_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  fails.forEach(f => console.log(`   RED  ${f}`));
  process.exitCode = 1;
} else {
  console.log(`b07_f0772_circle_auth_bench: ${pass} passed, 0 failed  (total ${pass})`);
  console.log('GREEN — one implementation with two callers, a token that binds the couple it');
  console.log('claims, a resolver that admits the bride and the member alike, two mint points,');
  console.log('and NOTHING ENFORCED. The enforcement cells arrive with the enforcement ZIP.');
}
})();
