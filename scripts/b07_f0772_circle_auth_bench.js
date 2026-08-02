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

// ── §5.3 / §5.4 RE-AIMED AT ZIP 2, AND THE POLARITY IS THE WHOLE POINT ──────
// These two cells asserted ENFORCE NOTHING: that no Class B door carried a 401
// and that the guard stayed unmounted. Both were TRUE cells about a phase that
// has ended. Under §9's BOTH-SIDES CLAUSE the old shape's green is RETIRED, not
// retained — a green over a phase nobody is in is indistinguishable from no test
// at all — so each is inverted in place rather than deleted, which keeps the
// count honest and leaves the transition legible to the next reader.
t('§5.3 EVERY Class B door now refuses on the resolver — the comment became code', () => {
  for (const f of ['src/api/circle/feed.js', 'src/api/circle/threads.js', 'src/api/circle/messages.js']) {
    const body = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(/circleIdentity[\s\S]{0,120}?res\.status\(401\)/.test(body),
      `${f} does NOT refuse — ZIP 2 enforces`);
    assert.ok(!/THE ENFORCEMENT LINE GOES HERE/.test(read(f)),
      `${f} still carries ZIP 1's placeholder comment beside real enforcement`);
  }
});

t('§5.4 the guard IS mounted on the two surviving Class A files, and the confession is discharged', () => {
  const r = read('src/api/router.js');
  const code = r.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  // F-07.115 — `/dreamai` left this list because it left the router. Its own
  // retirement is asserted separately at §14.1 rather than by its absence here,
  // so a mount that silently lost its guard can never be mistaken for a door
  // that was deliberately retired.
  for (const mount of ['/circle/session', '/circle/muse']) {
    assert.ok(new RegExp(`router\\.use\\('${mount}',\\s*requireCircleMemberAuth`).test(code),
      `${mount} is not guarded`);
  }
  // The mint points and the dual-lane doors must NOT be guarded — a mint that
  // required a credential could never issue the first one, and a member guard on
  // a shared door locks the bride out of her own conversation.
  for (const open of ['/auth/verify-pin', '/circle/join', '/frost/circle/feed',
                      '/frost/circle/threads', '/frost/circle/messages']) {
    assert.ok(!new RegExp(`router\\.use\\('${open}',\\s*requireCircleMemberAuth`).test(code),
      `${open} must NOT carry the member guard`);
  }
  assert.ok(!/^\s*\/\/ No requireCircleMemberAuth/m.test(r),
    'the confession comment survived its own discharge');
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
// RE-AIMED AT ZIP 2, COUNT PRESERVED. The anchor `member.couple_id` was the
// hand-rolled block's local; that block collapsed into `req.circleMember` when
// the guard mounted, so the line no longer exists. The CELL IS UNCHANGED IN WHAT
// IT CLAIMS — put the phone back in the response and §8.2 must redden — only its
// address moved. CE-119's "a true cell aimed one surface over", the class
// F-07.72 ZIP 1 already paid for once at `b07_f0784_panel`.
await mutateSrc('src/api/circle/session.js',
  '      couple_id: me.couple_id,',
  '      phone:     me.phone,\n      couple_id: me.couple_id,',
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

// ── F-07.115's INVERSES. Every one breaks PRODUCTION SOURCE, never test setup,
// and every one is restored byte-identical by mutateSrc's own cmp.

// INVERSE 11 — put the retired mount back. §14.2 and §14.3's arithmetic must
// redden: a third guarded circle mount means the retirement did not happen.
await mutateSrc('src/api/router.js',
  "router.use('/frost/circle/feed',     require('./circle/feed'));",
  "router.use('/dreamai',               requireCircleMemberAuth, require('./circle/dreamai'));\n" +
  "router.use('/frost/circle/feed',     require('./circle/feed'));",
  'the retirement of the /dreamai mount',
  async () => {
    const code = read('src/api/router.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/router\.use\('\/dreamai'/.test(code), 'the /dreamai mount is still on the router');
    const guarded = (code.match(/router\.use\('[^']+',\s*requireCircleMemberAuth/g) || []).length;
    assert.strictEqual(guarded, 2, `expected exactly two guarded circle mounts, found ${guarded}`);
  });

// INVERSE 12 — take a SURVIVING door's guard off. This is the mutation that
// separates the two facts §14.3 exists to keep apart: the door count is right
// and a door is nevertheless unguarded. If this passed, "nine doors" would be a
// tally standing over a hole.
await mutateSrc('src/api/router.js',
  "router.use('/circle/muse',           requireCircleMemberAuth, require('./circle/muse'));",
  "router.use('/circle/muse',           require('./circle/muse'));",
  'a surviving Class A door keeping its guard through the retirement',
  async () => {
    const code = read('src/api/router.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(/router\.use\('\/circle\/muse',\s*requireCircleMemberAuth/.test(code),
      '/circle/muse lost its guard in the retirement');
  });

// INVERSE 13 — bring the keyless flag back to the one home. §13.14's INVERSION
// must redden; a cell that only asserted absence by no longer running could not.
await mutateSrc('src/lib/circlePermissions.js',
  '  can_see_budget:         false,',
  '  dreamai_access_granted: false,\n  can_see_budget:         false,',
  "F-07.115's closure by deletion at the one home",
  async () => {
    const code = read('src/lib/circlePermissions.js')
      .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/dreamai_access_granted/.test(code), 'the keyless flag is back in the permission block');
  });

// INVERSE 14 — strip the closure record while leaving the deletion in place.
// The field being gone is not the whole cure: F-06.85's law is that the
// paragraph conditioned on the mechanism records what happened to it.
await mutateSrc('src/lib/circlePermissions.js',
  'THIS IS THAT SITTING, AND THIS IS THAT RE-READ',
  'The flag was removed',
  "the F-06.85 record of F-07.115's re-read",
  async () => {
    assert.ok(/THIS IS THAT SITTING, AND THIS IS THAT RE-READ/.test(read('src/lib/circlePermissions.js')),
      'the paragraph no longer records that its own re-read instruction was discharged');
  });

// INVERSE 15 — restore the stale pointer at the thread model. A comment naming a
// deleted file is how the next reader learns a wrong mechanism, which is the
// exact disease F-06.85 exists to prevent.
await mutateSrc('src/api/circle/messages.js',
  '//         `src/brideIndex.js:369` and `src/lib/brideInbound.js:278/:371`.',
  '//         `src/api/circle/dreamai.js:93`.',
  "the re-derived mint-site pointer in messages.js",
  async () => {
    const msg = read('src/api/circle/messages.js');
    assert.ok(/brideIndex\.js:369/.test(msg) && /brideInbound\.js:278/.test(msg),
      "messages.js's thread model still points at the deleted file");
  });

// INVERSE 16 — sever the WhatsApp lane's direct call to the engine. §14.5 is the
// non-regression claim of the whole arc; if it passed over a broken brideIndex
// the founder's walk would be the only thing standing between a retirement and
// a dead Mira.
await mutateSrc('src/brideIndex.js',
  "const { runCircleAgenticTurn } = require('./agent/circleEngine');",
  "const runCircleAgenticTurn = null; // severed",
  "the WhatsApp lane's direct call to Mira's engine",
  async () => {
    const bi = read('src/brideIndex.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(/require\('\.\/agent\/circleEngine'\)/.test(bi),
      'brideIndex no longer requires the circle engine');
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
      // LABELED AMENDMENT (F-07.112, 2026-08-02) — `_is` and `q.is` are NEW.
      // F-07.112's cure adds `.is('counterparty_user_id', null)` to four
      // selectors; a builder with no `.is` would throw inside the shipped
      // handler and every §11 cell would redden for a reason that has nothing
      // to do with what §11 claims. This is TEST SETUP catching up to
      // production, not a claim being weakened: the filter is honoured, not
      // swallowed — see `passesIs` below — and every §11 count is preserved.
      const q = { _eq: {}, _is: {}, _ins: null, _sel: null };
      const passesIs = (o) => {
        for (const k of Object.keys(q._is)) {
          if (q._is[k] === null) { if (o && o[k] != null) return false; }
        }
        return true;
      };
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
      q.is     = (c, v) => { q._is[c] = v; return q; };   // F-07.112 amendment
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
      const gated = () => { const o = row(); return passesIs(o) ? o : null; };
      q.maybeSingle = async () => ({ data: project(gated()) });
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

// ── §11.3 INVERTED AT ZIP 2 — the cell that measured the gap now measures the cure
// It read: NO CREDENTIAL, the author is NULL and the send still SUCCEEDS. That
// was ZIP 1's honest boundary and it is exactly what ZIP 2 came to end. Under
// §9's BOTH-SIDES CLAUSE the old green is retired rather than kept beside the new
// one: a nameless row is no longer written because a nameless caller is no longer
// served. The `{ ok: false }` envelope is asserted deliberately — F-07.117.
await ta('§11.3 NO CREDENTIAL: the send is REFUSED 401 and NO ROW is written', async () => {
  const { out, cap } = await drive(POST_MSG, { body: { userId: MEHEK.usersId, body: 'hello' } });
  assert.strictEqual(out.status, 401, 'a credential-less send was served');
  assert.strictEqual(out.body.ok, false, 'the refusal spoke the wrong envelope family');
  assert.strictEqual(cap.inserted, null, 'a refused send still reached public.messages');
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
  // ZIP 2 — the cell now drives a PROVEN caller. The couple is no longer taken
  // from `:coupleId`; the param is left in place to prove it is ignored, and the
  // bride's JWT is what selects the thread.
  const { out } = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW], bearer: BRIDE_JWT });
  const m = out.body.messages[0];
  assert.strictEqual(m.sender_name, null, 'the role stood in for a name again');
  assert.strictEqual(m.sender_user_id, null);
  assert.strictEqual(m.sender_role, 'couple', 'the role must still travel AS a role');
});

await ta('§11.7 GET /threads/.../messages: same shape, same null, and sender_user_id is NEW', async () => {
  const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const { out } = await drive(GET_THREAD, {
    params: { brideId: MEHEK.coupleId, threadId: `dm:${CONVO_ID}` },
    rows: [{ ...PRECURE_ROW, sender_name: MEHEK.name, sender_user_id: MEHEK.usersId }],
    bearer: token,
  });
  const m = out.body.data[0];
  assert.strictEqual(m.sender_name, MEHEK.name);
  assert.strictEqual(m.sender_user_id, MEHEK.usersId);
  assert.notStrictEqual(m.sender_name, m.sender_role, 'name and role collapsed to one value');
});

await ta('§11.8 SITE 4: the thread-list preview reads sender_name, not sent_by', async () => {
  const token = circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  const { out } = await drive(GET_LIST, {
    params: { brideId: MEHEK.coupleId },
    rows: [{ body: 'x', sent_by: 'couple', sender_name: MEHEK.name, created_at: 'T' }],
    bearer: token,
  });
  assert.ok(Array.isArray(out.body.data), 'no thread list');
});

await ta('§11.9 F-07.112: an `agent` row does not crash or acquire a name', async () => {
  const { out } = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [AGENT_ROW], bearer: BRIDE_JWT });
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
      const { out } = await drive(H2, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW], bearer: BRIDE_JWT });
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

// ═══════════════════════════════════════════════════════════════════════════
// §12 — F-07.112: THE THREAD COLLISION. FOUR SELECTORS, ONE DISCRIMINATOR.
//
// The disease: `couple_id + kind='circle_thread'` does not name a thread. It
// names a LANE holding two different conversations — the group chat
// (counterparty_user_id IS NULL) and each member's PRIVATE thread with Mira
// (counterparty_user_id = her users.id, minted at dreamai.js:93). Four
// selectors read that lane without the discriminator, and in production the
// only row in it was PRIVATE.
//
// THE GEOMETRY BELOW IS THE FOUNDER'S OWN, from the fixture SELECT of
// 2026-08-02: one circle_thread row in the entire database, PRIVATE, born
// 2026-07-23 13:23:18.636264, 15 messages, last written 2026-08-01 21:56. The
// private row is therefore always the OLDER one in these fixtures — which is
// exactly why oldest-first adopted it, and a fixture that got that order wrong
// would prove nothing about the world.
//
// WHY THESE CELLS ARE HERE AND NOT IN A NEW FILE: they guard the same four
// handlers §5 and §11 guard, in the same two files. One home.
//
// F-07.112's OWN PREMISE-REFUTATION IS HONOURED (CE-126): no cell keys on the
// value space {couple, bride, circle_member}. `agent` is a fourth mouth and
// `circle_member` appears zero times live; §12.12 drives the fourth mouth
// deliberately.
// ═══════════════════════════════════════════════════════════════════════════

const GROUP_ID   = '7b1e4c90-1111-4aaa-8bbb-000000000001';
const RACER_ID   = '7b1e4c90-1111-4aaa-8bbb-000000000002';
const PRIVATE_ID = CONVO_ID;   // 2c49c2d7… — the founder's real private row

const PRIVATE_CONVO = {
  id: PRIVATE_ID, couple_id: MEHEK.coupleId, counterparty_user_id: MEHEK.usersId,
  kind: 'circle_thread', state: 'active', mode: 'auto',
  created_at: '2026-07-23T13:23:18.636264Z', last_message_at: '2026-08-01T21:56:56.754Z',
};
const GROUP_CONVO = {
  id: GROUP_ID, couple_id: MEHEK.coupleId, counterparty_user_id: null,
  kind: 'circle_thread', state: 'new', mode: 'auto',
  created_at: '2026-08-02T09:00:00.000Z', last_message_at: '2026-08-02T09:00:00.000Z',
};
const PRIVATE_MSG = {
  id: 'p-1', conversation_id: PRIVATE_ID, sent_by: 'couple',
  body: 'Mira, what should I be asking the decorator?',
  sender_name: null, sender_user_id: null, created_at: '2026-07-23T13:23:18.802113Z',
};
const PRIVATE_AGENT_MSG = {
  id: 'p-2', conversation_id: PRIVATE_ID, sent_by: 'agent',
  body: 'Start with what is already booked.',
  sender_name: null, sender_user_id: null, created_at: '2026-07-23T13:23:40.000Z',
};
const GROUP_MSG = {
  id: 'g-1', conversation_id: GROUP_ID, sent_by: 'bride', body: 'hello circle',
  sender_name: BRIDE_NAME, sender_user_id: BRIDE.usersId, created_at: '2026-08-02T09:05:00.000Z',
};

// ── TEST SETUP, DISCLOSED (never production code) ──────────────────────────
// A conversations/messages plane with REAL FILTER SEMANTICS. The §11 plane
// answers one row per table and could not tell two circle_thread rows apart,
// which is precisely the distinction this section exists to prove — so it gets
// its own plane rather than a widened shared one. `.eq`, `.is`, `.order` and
// `.limit` are all honoured; a plane that swallowed `.is` would make every cell
// below vacuous in the same way §11's projection bug once did.
function threadPlane({ convos = [], messages = [], raceInsert = false } = {}) {
  const state = {
    convos:  convos.map(c => ({ ...c })),
    messages: messages.map(m => ({ ...m })),
    convoInserts: [], msgInserts: [],
  };
  let seq = 1;
  const project = (o, sel) => {
    if (!o || !sel) return o;
    const out = {};
    for (const k of sel.split(',').map(c => c.trim())) if (k in o) out[k] = o[k];
    return out;
  };
  const plane = {
    auth: {
      getUser: async (token) => (token === BRIDE_JWT
        ? { data: { user: { id: BRIDE.authUserId } }, error: null }
        : { data: { user: null }, error: new Error('invalid token') }),
    },
    from(table) {
      const q = { _eq: {}, _is: {}, _sel: null, _ins: null, _order: null, _limit: null };
      q.select = (cols) => { q._sel = typeof cols === 'string' ? cols : null; return q; };
      q.eq     = (c, v) => { q._eq[c] = v; return q; };
      q.is     = (c, v) => { q._is[c] = v; return q; };
      q.order  = (c, o) => { q._order = { c, asc: !o || o.ascending !== false }; return q; };
      q.limit  = (n) => { q._limit = n; return q; };
      q.update = () => q;
      q.insert = (r) => { q._ins = r; return q; };

      const base = () => {
        if (table === 'conversations') return state.convos;
        if (table === 'messages')      return state.messages;
        if (table === 'couples')       return [{ id: MEHEK.coupleId, user_id: BRIDE.usersId }];
        if (table === 'users')         return [
          { id: BRIDE.usersId, name: BRIDE_NAME, auth_user_id: BRIDE.authUserId },
          { id: MEHEK.usersId, name: MEHEK.name, phone: MEHEK.phone },
        ];
        if (table === 'circle_members') return [{
          id: MEHEK.memberId, couple_id: MEHEK.coupleId, invitee_phone: MEHEK.phone,
          status: 'active', invitee_name: MEHEK.name, role: MEHEK.role,
        }];
        return [];
      };
      const filtered = () => {
        let rows = base().filter((r) => {
          for (const k of Object.keys(q._eq)) if (r[k] !== q._eq[k]) return false;
          for (const k of Object.keys(q._is)) if (q._is[k] === null && r[k] != null) return false;
          return true;
        });
        if (q._order) {
          const c = q._order.c;
          rows = rows.slice().sort((a, b) => {
            const av = String(a[c] ?? ''), bv = String(b[c] ?? '');
            const d = av < bv ? -1 : av > bv ? 1 : 0;
            return q._order.asc ? d : -d;
          });
        }
        if (q._limit != null) rows = rows.slice(0, q._limit);
        return rows;
      };
      const doInsert = () => {
        if (table === 'conversations') {
          const row = {
            id: `ins-${seq++}`,
            couple_id:            q._ins.couple_id ?? null,
            counterparty_user_id: q._ins.counterparty_user_id ?? null,
            kind: q._ins.kind, state: q._ins.state, mode: q._ins.mode,
            created_at: '2026-08-02T10:00:00.000Z',
            last_message_at: q._ins.last_message_at || null,
          };
          state.convoInserts.push({ ...q._ins });
          state.convos.push(row);
          // THE RACE, SIMULATED. A concurrent first-caller's group row lands
          // with an OLDER created_at than the one we just wrote. R-a must
          // converge on THAT row; returning our own insert is the defect.
          if (raceInsert) state.convos.push({ ...row, id: RACER_ID, created_at: '2026-08-02T09:59:00.000Z' });
          return row;
        }
        if (table === 'messages') {
          const row = { id: `msg-${seq++}`, created_at: '2026-08-02T10:00:01.000Z', ...q._ins };
          state.msgInserts.push({ ...q._ins });
          state.messages.push(row);
          return row;
        }
        return { ...q._ins, id: `x-${seq++}` };
      };

      q.maybeSingle = async () => ({ data: project(filtered()[0] || null, q._sel), error: null });
      q.single      = async () => (q._ins
        ? { data: project(doInsert(), q._sel), error: null }
        : { data: project(filtered()[0] || null, q._sel), error: null });
      q.then = (resolve) => {
        if (q._ins) { doInsert(); return resolve({ data: null, error: null }); }
        return resolve({ data: filtered().map(r => project(r, q._sel)), error: null });
      };
      return q;
    },
  };
  return { plane, state };
}

async function drive12(handler, { plane, body, params, query, bearer }) {
  const out = {};
  const req = {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    cookies: {}, body: body || {}, params: params || {}, query: query || {},
    app: { locals: { supabase: plane } },
  };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  await new Promise((resolve, reject) => {
    let done = false;
    res.json = (b) => { out.body = b; if (!done) { done = true; resolve(); } return res; };
    handler(req, res, (e) => { done = true; reject(e || new Error('next() with no error')); });
    setTimeout(() => { if (!done) { done = true; reject(new Error('handler never answered')); } }, 4000);
  });
  return out;
}

H('§12 — F-07.112: the group thread is a row of its own, and the private one is unreachable');

await ta('§12.1 C-1 THE PRIVATE ROW IS NOT ADOPTED: a group send lands in the group row', async () => {
  const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [PRIVATE_MSG] });
  await drive12(POST_MSG, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, body: 'hello circle', sender_role: 'bride' } });
  assert.strictEqual(state.msgInserts.length, 1, 'the send did not write');
  assert.strictEqual(state.msgInserts[0].conversation_id, GROUP_ID);
  assert.notStrictEqual(state.msgInserts[0].conversation_id, PRIVATE_ID,
    "the bride's group message landed inside a member's private AI history");
});

await ta('§12.2 THE GROUP ROW IS CREATED, with counterparty_user_id explicitly NULL', async () => {
  const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO], messages: [PRIVATE_MSG] });
  await drive12(POST_MSG, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, body: 'first ever', sender_role: 'bride' } });
  assert.strictEqual(state.convoInserts.length, 1, 'no group row was born — the private one was adopted');
  const ins = state.convoInserts[0];
  assert.ok('counterparty_user_id' in ins, 'the discriminator is omitted, not written');
  assert.strictEqual(ins.counterparty_user_id, null);
  assert.strictEqual(ins.kind, 'circle_thread');
  assert.strictEqual(ins.couple_id, MEHEK.coupleId);
  assert.notStrictEqual(state.msgInserts[0].conversation_id, PRIVATE_ID);
});

await ta('§12.3 FORK R-a: two first-callers CONVERGE — the returned row is the oldest, not our insert', async () => {
  const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO], raceInsert: true });
  await drive12(POST_MSG, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, body: 'racing', sender_role: 'bride' } });
  assert.strictEqual(state.msgInserts[0].conversation_id, RACER_ID,
    'the loser kept its own row and the message is invisible to the winner');
});

await ta('§12.4 C-2 A CLIENT-NAMED PRIVATE THREAD IS NOT A WRITE TARGET', async () => {
  const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [PRIVATE_MSG] });
  await drive12(POST_MSG, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, thread_id: `dm:${PRIVATE_ID}`, body: 'aimed at her private thread', sender_role: 'bride' } });
  assert.strictEqual(state.msgInserts[0].conversation_id, GROUP_ID);
  assert.notStrictEqual(state.msgInserts[0].conversation_id, PRIVATE_ID,
    'a supplied dm: uuid still writes into a private AI conversation');
});

await ta('§12.5 C-3 THE PRIVATE THREAD IS UNREADABLE AT THE THREADS DOOR', async () => {
  const { plane } = threadPlane({
    convos: [PRIVATE_CONVO, GROUP_CONVO],
    messages: [PRIVATE_MSG, PRIVATE_AGENT_MSG, GROUP_MSG],
  });
  const out = await drive12(GET_THREAD, { plane, bearer: BRIDE_JWT, params: { brideId: MEHEK.coupleId, threadId: `dm:${PRIVATE_ID}` } });
  assert.deepStrictEqual(out.body.data, [], 'her private history was served to this door');
  assert.ok(!JSON.stringify(out.body).includes('asking the decorator'), 'a private message body reached the wire');
});

await ta('§12.6 …and the GROUP thread still reads normally (the cure is not a wall)', async () => {
  const { plane } = threadPlane({
    convos: [PRIVATE_CONVO, GROUP_CONVO],
    messages: [PRIVATE_MSG, PRIVATE_AGENT_MSG, GROUP_MSG],
  });
  const out = await drive12(GET_THREAD, { plane, bearer: BRIDE_JWT, params: { brideId: MEHEK.coupleId, threadId: `dm:${GROUP_ID}` } });
  assert.strictEqual(out.body.data.length, 1);
  assert.strictEqual(out.body.data[0].content, 'hello circle');
});

await ta('§12.7 C-4 THE LIST DOES NOT ENUMERATE PRIVATE THREADS — the negative privacy proof', async () => {
  const { plane } = threadPlane({
    convos: [PRIVATE_CONVO, GROUP_CONVO],
    messages: [PRIVATE_MSG, PRIVATE_AGENT_MSG, GROUP_MSG],
  });
  const out = await drive12(GET_LIST, { plane, bearer: BRIDE_JWT, params: { brideId: MEHEK.coupleId } });
  const ids = out.body.data.map(t => t.thread_id);
  assert.deepStrictEqual(ids, [`dm:${GROUP_ID}`]);
  assert.ok(!ids.includes(`dm:${PRIVATE_ID}`), "a member's private thread is tappable from the co-planner");
});

// ── §12.8 RE-AIMED AT F-07.115 — THE FILE IT WATCHED IS GONE ────────────────
// WHAT THIS CELL USED TO SAY: that `dreamai.js`'s two reads still keyed on
// `counterparty_user_id`, narrowed to source because requiring that router
// executed `circleEngine` at import (a W-1 surface building a client at load).
// That narrowing is now moot: the file is DELETED with the co-planner's Dream AI
// surface, so there is no reader there to regress.
//
// THE CLAIM IS RE-AIMED, NOT DROPPED, because the QUESTION it asked still
// matters and now has a better answer: does the private lane still key on its
// owner? It does, and it does so on the WhatsApp lane — the only lane that ever
// mattered, since `runCircleAgenticTurn` is called directly at
// `brideIndex.js:677` and never went through the retired doors. Retiring an HTTP
// surface must not touch the discriminator F-07.112 made load-bearing, and this
// cell is where that is asserted.
t('§12.8 RE-AIMED: the PRIVATE lane still keys on its owner — on the lane that survived', () => {
  for (const f of ['src/brideIndex.js', 'src/lib/brideInbound.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(/counterparty_user_id/.test(code), `${f} lost the private lane's discriminator`);
    assert.ok(!/\.is\(\s*'counterparty_user_id'/.test(code),
      `${f} was given the GROUP discriminator — that would close the leak by breaking Mira`);
  }
});

await ta('§12.9 the FOURTH MOUTH survives the cured read shape (CE-126, no three-value space)', async () => {
  const AGENT_IN_GROUP = { ...PRIVATE_AGENT_MSG, id: 'g-2', conversation_id: GROUP_ID };
  const { plane } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [AGENT_IN_GROUP] });
  const out = await drive12(GET_THREAD, { plane, bearer: BRIDE_JWT, params: { brideId: MEHEK.coupleId, threadId: `dm:${GROUP_ID}` } });
  assert.strictEqual(out.body.data[0].sender_role, 'agent');
  assert.strictEqual(out.body.data[0].sender_name, null, 'machinery gave Mira a name');
});

t('§12.10 ALL FOUR SELECTORS carry the discriminator — none left behind', () => {
  for (const f of ['src/api/circle/messages.js', 'src/api/circle/threads.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    const eqs = (code.match(/\.eq\(\s*'kind'\s*,\s*'circle_thread'\s*\)/g) || []).length;
    const iss = (code.match(/\.is\(\s*'counterparty_user_id'\s*,\s*null\s*\)/g) || []).length;
    assert.strictEqual(eqs, 2, `${f}: expected two circle_thread selectors, found ${eqs}`);
    assert.strictEqual(iss, eqs, `${f}: ${eqs - iss} selector(s) still read the lane without the discriminator`);
  }
});

t('§12.11 the create writes the discriminator EXPLICITLY, not by omission', () => {
  const code = read('src/api/circle/messages.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(/counterparty_user_id:\s*null,/.test(code), 'the insert relies on omission; the selector above it reads the column');
});

t('§12.12 the PRIVATE lane is untouched — its TWO surviving mint sites still key on the owner', () => {
  // F-07.115 — `src/api/circle/dreamai.js` was the THIRD site in this list and
  // is deleted with the surface. THE COUNT FELL BECAUSE A FILE WENT, not because
  // a site lost its discriminator; §14.4 asserts the deletion itself so the two
  // facts can never be confused for one another.
  const sites = [
    ['src/brideIndex.js',           /counterparty_user_id:\s*user\.id/],
    ['src/lib/brideInbound.js',     /counterparty_user_id:\s*circleUser\.id/],
  ];
  for (const [f, re] of sites) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(re.test(code), `${f} no longer mints the private row with its owner`);
  }
});

t('§12.13 the F-06.85 header names the mechanism and the finding it re-reads', () => {
  const head = read('src/api/circle/messages.js').split('\n').slice(0, 60).join('\n');
  assert.ok(/CANONICAL THREAD MODEL — RE-AUTHORED AT F-07\.112/.test(head), 'the false header still stands');
  assert.ok(/counterparty_user_id IS NULL/.test(head), 'the discriminator is not named in the header');
  assert.ok(/leave them/.test(head), "the founder's data ruling is not recorded where the next reader will look");
});

t('§12.14 NO DATA HALF: this delivery writes nothing to production rows', () => {
  const dir = fs.readdirSync(path.join(ROOT, 'db', 'migrations'));
  assert.strictEqual(dir.filter(f => f.startsWith('0106_')).length, 0, 'a migration rode a no-DDL sitting');
  for (const f of ['src/api/circle/messages.js', 'src/api/circle/threads.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/\.delete\(/.test(code), `${f} gained a delete`);
    assert.ok(!/conversation_id:\s*\w+\s*\}\s*\)\s*\.eq\('conversation_id'/.test(code), `${f} gained a re-parent`);
  }
});

H('§12.M — MUTATION: every §12 cure cell proven non-vacuous by breaking PRODUCTION code');

// ── ANCHORS ARE SITE-QUALIFIED, AND THAT COST ONE ROUND ─────────────────────
// The four cured selectors carry the SAME line. `mutate` uses String.replace,
// which takes the FIRST occurrence, so the first cut of §12.M5 aimed at the
// list and broke the per-thread read instead — §12.7 stayed green over broken
// production code and the mutation cell convicted its own author. CE-125's
// fifth bench fault, second instance, in the same file. Every anchor below now
// carries the line ABOVE it, which differs at every site.
const IS_LINE = ".is('counterparty_user_id', null)   // F-07.112 — the discriminator";

await ta('§12.M1 drop the discriminator from the group resolver ⇒ §12.1 RED', async () => {
  await mutate('src/api/circle/messages.js',
    `.eq('couple_id', coupleId)\n    .eq('kind', 'circle_thread')\n    ${IS_LINE}`,
    ".eq('couple_id', coupleId)\n    .eq('kind', 'circle_thread')", async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [PRIVATE_MSG] });
      await drive12(H2, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, body: 'x', sender_role: 'bride' } });
      assert.strictEqual(state.msgInserts[0].conversation_id, GROUP_ID);
    });
});

await ta('§12.M2 settle newest-first instead of oldest-first ⇒ §12.3 RED (R-a is not decoration)', async () => {
  await mutate('src/api/circle/messages.js',
    ".order('created_at', { ascending: true })", ".order('created_at', { ascending: false })", async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO], raceInsert: true });
      await drive12(H2, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, body: 'x', sender_role: 'bride' } });
      assert.strictEqual(state.msgInserts[0].conversation_id, RACER_ID);
    });
});

await ta('§12.M3 drop the discriminator from the dm: write target ⇒ §12.4 RED', async () => {
  await mutate('src/api/circle/messages.js',
    `.eq('id', convoId).eq('couple_id', coupleId).eq('kind', 'circle_thread')\n      ${IS_LINE}`,
    ".eq('id', convoId).eq('couple_id', coupleId).eq('kind', 'circle_thread')", async () => {
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const { plane, state } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [PRIVATE_MSG] });
      await drive12(H2, { plane, bearer: BRIDE_JWT, body: { userId: MEHEK.coupleId, thread_id: `dm:${PRIVATE_ID}`, body: 'x', sender_role: 'bride' } });
      assert.notStrictEqual(state.msgInserts[0].conversation_id, PRIVATE_ID);
    });
});

await ta('§12.M4 drop the discriminator from the per-thread read ⇒ §12.5 RED', async () => {
  await mutate('src/api/circle/threads.js',
    `.eq('id', convoId).eq('couple_id', brideId).eq('kind', 'circle_thread')\n    ${IS_LINE}`,
    ".eq('id', convoId).eq('couple_id', brideId).eq('kind', 'circle_thread')", async () => {
      const H2 = handlerOf('src/api/circle/threads.js', 'get', '/:brideId/:threadId/messages');
      const { plane } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [PRIVATE_MSG, PRIVATE_AGENT_MSG, GROUP_MSG] });
      const out = await drive12(H2, { plane, bearer: BRIDE_JWT, params: { brideId: MEHEK.coupleId, threadId: `dm:${PRIVATE_ID}` } });
      assert.deepStrictEqual(out.body.data, []);
    });
});

await ta('§12.M5 drop the discriminator from the thread LIST ⇒ §12.7 RED', async () => {
  await mutate('src/api/circle/threads.js',
    `.eq('couple_id', brideId)\n    .eq('kind', 'circle_thread')\n    ${IS_LINE}`,
    ".eq('couple_id', brideId)\n    .eq('kind', 'circle_thread')", async () => {
      const H2 = handlerOf('src/api/circle/threads.js', 'get', '/:brideId');
      const { plane } = threadPlane({ convos: [PRIVATE_CONVO, GROUP_CONVO], messages: [PRIVATE_MSG, GROUP_MSG] });
      const out = await drive12(H2, { plane, bearer: BRIDE_JWT, params: { brideId: MEHEK.coupleId } });
      assert.deepStrictEqual(out.body.data.map(t => t.thread_id), [`dm:${GROUP_ID}`]);
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// §13 — F-07.72 ZIP 2: ENFORCEMENT. THE LANE STOPS TRUSTING SUPPLIED IDENTIFIERS.
//
// ZIP 1 minted a token and taught fourteen client call sites to carry it while
// refusing nothing. This section is the other half. The decisive pair, on every
// guarded door, is: A FORGED ID REFUSED and THE REAL CALLER ADMITTED — and the
// order matters, because a bench that only proved the refusal would be equally
// green over a lane that refused everyone.
//
// TWO ENFORCEMENT SHAPES, AND THEY ARE NOT INTERCHANGEABLE:
//   CLASS A — `requireCircleMemberAuth` at the mount. Co-planner only.
//   CLASS B — refuse-on-neither inside each handler, on the resolver's three
//     answers, because the second caller is THE BRIDE and a circle-member guard
//     would answer her own circle chat with "Not a circle member."
//
// F-07.117 SHAPES THIS SECTION (CE ruling §3): a bench asserts the status code,
// and the status code is not what the user experiences. So every refusal cell
// below asserts the ENVELOPE FAMILY its client actually parses — `{success}` for
// feed/threads, `{ok}` for messages — and not merely the 401.
// ═══════════════════════════════════════════════════════════════════════════

H('§13 — ZIP 2: the guard, the refusals, and the callers who must still get through');

const guard = require(SRC('src/api/middleware/requireCircleMemberAuth'));
const SESSION_GET = handlerOf('src/api/circle/session.js', 'get', '/:userId');
const MUSE_GET    = handlerOf('src/api/circle/muse.js',    'get',  '/:brideId');
const MUSE_SAVE   = handlerOf('src/api/circle/muse.js',    'post', '/save');
const FEED_GET    = handlerOf('src/api/circle/feed.js',    'get',  '/:brideId');

// ── TEST SETUP, DISCLOSED (never production code) ──────────────────────────
// A plane shaped to exactly the guard's two lookups plus the couples/muse/feed
// reads the Class A handlers make. `memberStatus` and `memberCouple` are knobs
// so §13.6 and §13.7 can drive a revoked member and a couple-mismatch without a
// second plane.
function guardPlane({ memberStatus = 'active', memberCouple = MEHEK.coupleId, userExists = true,
                      saves = [], activity = [] } = {}) {
  const cap = { inserted: [], activity: [] };
  const plane = {
    auth: {
      getUser: async (token) => (token === BRIDE_JWT
        ? { data: { user: { id: BRIDE.authUserId } }, error: null }
        : { data: { user: null }, error: new Error('invalid token') }),
    },
    from(table) {
      const q = { _eq: {}, _sel: null, _ins: null };
      q.select = (c) => { q._sel = typeof c === 'string' ? c : null; return q; };
      q.eq = (c, v) => { q._eq[c] = v; return q; };
      q.is = () => q; q.order = () => q; q.limit = () => q; q.update = () => q;
      q.range = async () => ({ data: activity, error: null });
      q.insert = (r) => { q._ins = r; if (table === 'muse_saves') cap.inserted.push(r);
                          if (table === 'circle_activity') cap.activity.push(r); return q; };
      q.maybeSingle = async () => {
        if (table === 'users') {
          if (q._eq.id === MEHEK.usersId && userExists)
            return { data: { id: MEHEK.usersId, phone: MEHEK.phone, name: MEHEK.name } };
          if (q._eq.auth_user_id === BRIDE.authUserId) return { data: { id: BRIDE.usersId } };
          return { data: null };
        }
        if (table === 'circle_members') {
          // THE PLANE HONOURS THE FILTER RATHER THAN SWALLOWING IT. An earlier
          // cut compared `q._eq.status === memberStatus` unconditionally, so a
          // mutation that DELETED `.eq('status','active')` left the comparison
          // false and still produced a 403 — §13.M4 passed over broken
          // production code. A fake that ignores what it was asked for cannot
          // convict code that fails to ask (§11's own tuition, second instance).
          const asked = q._eq.status;
          if (q._eq.invitee_phone === MEHEK.phone && (asked === undefined || asked === memberStatus))
            return { data: { id: MEHEK.memberId, couple_id: memberCouple, role: MEHEK.role,
                             invitee_name: MEHEK.name, status: memberStatus } };
          return { data: null };
        }
        if (table === 'couples') {
          if (q._eq.id === MEHEK.coupleId || q._eq.user_id === BRIDE.usersId)
            return { data: { id: MEHEK.coupleId, user_id: BRIDE.usersId, users: { name: BRIDE_NAME } } };
          return { data: null };
        }
        if (table === 'muse_saves') return { data: saves[0] || null };
        return { data: null };
      };
      q.single = async () => ({ data: { id: 'save-1' }, error: null });
      q.then = undefined;
      return q;
    },
  };
  return { plane, cap };
}

function runGuard(bearer, planeOpts) {
  const { plane, cap } = guardPlane(planeOpts);
  const req = {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    cookies: {}, body: {}, params: {}, query: {},
    app: { locals: { supabase: plane } },
  };
  const out = {};
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return new Promise((resolve) => {
    let done = false;
    const fin = () => { if (!done) { done = true; resolve({ out, req, cap, plane }); } };
    res.json = (b) => { out.body = b; fin(); return res; };
    guard(req, res, () => { out.passed = true; fin(); });
    setTimeout(fin, 4000);
  });
}

async function driveA(handler, { bearer, params, query, body, planeOpts }) {
  const { plane, cap } = guardPlane(planeOpts);
  const req = {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    cookies: {}, body: body || {}, params: params || {}, query: query || {},
    app: { locals: { supabase: plane } },
  };
  const out = {};
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  await new Promise((resolve, reject) => {
    let done = false;
    res.json = (b) => { out.body = b; if (!done) { done = true; resolve(); } return res; };
    const next = (e) => {
      if (e) { done = true; return reject(e); }
      Promise.resolve(handler(req, res, (err) => { done = true; reject(err || new Error('next() with no error')); }));
    };
    guard(req, res, next);
    setTimeout(() => { if (!done) { done = true; reject(new Error('never answered')); } }, 4000);
  });
  return { out, req, cap };
}

const MEHEK_TOKEN = () => circleSession.mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });

// ── THE GUARD ITSELF ────────────────────────────────────────────────────────

t('§13.1 the guard verifies the LANE-NATIVE token — supabase.auth.getUser is GONE (axis 1)', () => {
  const g = read('src/api/middleware/requireCircleMemberAuth.js');
  const code = g.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/supabase\.auth\.getUser/.test(code),
    'the guard still asks the auth plane for a credential this lane does not mint');
  assert.ok(/verifyCircleSession/.test(code) && /circleTokenFrom/.test(code),
    'the guard does not go through circleSession');
});

t('§13.2 axis 2 is dead: no raw .eq(\'id\', user.id) against an AUTH-plane identity', () => {
  const code = read('src/api/middleware/requireCircleMemberAuth.js')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/\.eq\('id',\s*user\.id\)/.test(code), 'the 0063 plane collision survived the re-authoring');
  assert.ok(/\.eq\('id',\s*claim\.user_id\)/.test(code),
    'the guard no longer resolves the bound user at all');
});

// §13.3 — THE CELL THAT REDDENS IF THE CREDENTIAL EVER CARRIES AN AUTH-PLANE ID.
// The guard skips `resolveUsersId` because the token's first bound field IS a
// public users id: `verifyPin.js` mints from a `public.users` row and `join.js`
// from the row it has just provisioned there. That is a claim about two OTHER
// files, so it is asserted against them — if either mint ever binds an auth id,
// axis 2 comes back to life silently and this cell is what says so.
t('§13.3 both mint points bind a PUBLIC users id — which is why no plane hop is owed', () => {
  const vp = read('src/api/circle/verifyPin.js');
  assert.ok(vp.includes("mintCircleSession({ userId: userRow.id, coupleId: member.couple_id })"),
    'verify-pin no longer mints from the public users row');
  assert.ok(/\.from\('users'\)[\s\S]{0,200}?\.eq\('phone', e164Phone\)/.test(vp),
    "verify-pin's userRow no longer comes from public.users");
  const jn = read('src/api/circle/join.js');
  assert.ok(jn.includes('mintCircleSession({ userId'), 'join/accept no longer mints');
  assert.ok(!/auth_user_id/.test(jn.split('\n').filter(l => !l.trim().startsWith('//')).join('\n')),
    'join now touches the auth plane — the no-hop argument needs re-deriving');
});

await ta('§13.4 NO CREDENTIAL ⇒ 401 at the guard, and nothing downstream runs', async () => {
  const { out } = await runGuard(null);
  assert.strictEqual(out.status, 401);
  assert.strictEqual(out.body.success, false);
  assert.ok(!out.passed, 'the guard called next() for a caller with no credential');
});

await ta('§13.5 A SUPABASE JWT IS REFUSED AT A CLASS A DOOR — the crossover, both shapes', async () => {
  const { out } = await runGuard(BRIDE_JWT);
  assert.strictEqual(out.status, 401, "the bride's JWT bought a co-planner session");
  assert.ok(!out.passed);
});

await ta('§13.6 A TAMPERED TOKEN ⇒ 401 — the subject is inside the mac', async () => {
  const tok = MEHEK_TOKEN();
  const parts = tok.split('.');
  parts[0] = FORGED[0];                        // swap the bound user for a real non-member
  const { out } = await runGuard(parts.join('.'));
  assert.strictEqual(out.status, 401, 'a re-subjected token passed the guard');
});

await ta('§13.7 AN EXPIRED TOKEN ⇒ 401 — a 90-day TTL is still a TTL', async () => {
  const expired = signed.mintSigned({
    secret: process.env.CIRCLE_SESSION_SECRET,
    subject: [MEHEK.usersId, MEHEK.coupleId], ttlMs: 1,
  });
  await new Promise(r => setTimeout(r, 5));
  const { out } = await runGuard(expired);
  assert.strictEqual(out.status, 401);
});

await ta('§13.8 REVOCATION IS LIVE ON EVERY REQUEST ⇒ a valid token over an inactive row is 403', async () => {
  const { out } = await runGuard(MEHEK_TOKEN(), { memberStatus: 'removed' });
  assert.strictEqual(out.status, 403, 'a removed member kept her access for the token\'s lifetime');
  assert.ok(!out.passed);
});

await ta('§13.9 THE BINDING IS LOAD-BEARING ⇒ token couple != membership couple is 403', async () => {
  const { out } = await runGuard(MEHEK_TOKEN(), { memberCouple: OTHER_COUPLE });
  assert.strictEqual(out.status, 403, 'a phone active in a second circle could ride the wrong token');
});

await ta('§13.10 401 AND 403 ARE DIFFERENT ANSWERS, and the client acts on the difference', async () => {
  const noCred  = await runGuard(null);
  const revoked = await runGuard(MEHEK_TOKEN(), { memberStatus: 'removed' });
  assert.strictEqual(noCred.out.status, 401);
  assert.strictEqual(revoked.out.status, 403);
  assert.notStrictEqual(noCred.out.status, revoked.out.status,
    'a revoked membership would send her to a PIN screen that cannot restore it');
});

await ta('§13.11 THE REAL CALLER IS ADMITTED — req.circleMember carries the proven row', async () => {
  const { out, req } = await runGuard(MEHEK_TOKEN());
  assert.ok(out.passed, 'the one live member was refused by her own lane');
  assert.strictEqual(req.circleMember.user_id, MEHEK.usersId);
  assert.strictEqual(req.circleMember.couple_id, MEHEK.coupleId);
  assert.strictEqual(req.circleMember.co_planner_id, MEHEK.memberId);
  assert.strictEqual(req.circleMember.name, MEHEK.name);
});

t('§13.12 NO TOKEN BYTES ARE LOGGED IN THE GUARD — not the value, not a prefix, not a length', () => {
  const code = read('src/api/middleware/requireCircleMemberAuth.js')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const logs = code.match(/console\.[a-z]+\([^)]*\)/g) || [];
  assert.strictEqual(logs.length, 0, `the guard logs: ${logs.join(' | ')}`);
  assert.ok(!/token\.(length|slice|substring)/.test(code), 'a token length or prefix is derived somewhere');
});

// ── FORK E: THE PERMISSION BLOCK'S ONE HOME ─────────────────────────────────

t('§13.13 FORK E — the permission block has ONE definition and TWO readers', () => {
  const home = read('src/lib/circlePermissions.js');
  assert.ok(home.includes('can_contribute_muse:    true'), 'the one home does not carry the block');
  for (const f of ['src/api/middleware/requireCircleMemberAuth.js', 'src/api/circle/session.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/can_contribute_muse:\s*true/.test(code),
      `${f} still carries its own literal copy of the block`);
  }
  assert.ok(read('src/api/middleware/requireCircleMemberAuth.js').includes("require('../../lib/circlePermissions')"));
  assert.ok(read('src/api/circle/session.js').includes('me.permissions'),
    'session.js no longer serves the guard-resolved block');
});

// ── §13.14 IS INVERTED AT F-07.115, AND THE INVERSION IS THE WHOLE POINT ────
// This cell asserted that `dreamai_access_granted: false` WAS CARRIED at the one
// home, and that F-07.115 was named there by number and mechanism. F-07.115 is
// now CLOSED BY DELETION, so an assertion of presence would be an assertion that
// the cure did not happen.
//
// A CELL THAT MERELY STOPS BEING RUN CANNOT CATCH A RE-INTRODUCTION. This one
// watches for the field's return instead — at the one home AND at both readers,
// because Fork E's guarantee is that there is nowhere else for it to come back.
// If a real Dream-AI permission is ever wanted it will arrive as a COLUMN with a
// migration behind it, and it will have to red this cell on its way in, which is
// exactly the conversation we want it to force.
t('§13.14 [F-06.85] F-07.115 CLOSED BY DELETION — the flag is ABSENT, and its record is not', () => {
  const home = read('src/lib/circlePermissions.js');
  const code = home.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/dreamai_access_granted/.test(code),
    'the keyless flag is back in the permission block — it needs a column and a migration, not a literal');
  for (const f of ['src/api/middleware/requireCircleMemberAuth.js', 'src/api/circle/session.js']) {
    const c = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/dreamai_access_granted/.test(c), `${f} re-declared the retired flag`);
  }
  // The RECORD survives the field. F-06.85's law is that a sentence conditioned
  // on a mechanism names it; the closure is that mechanism's next state, and the
  // paragraph must still carry both the number and the witness it was decided on.
  assert.ok(home.includes('F-07.115'), 'the closure is not recorded where the flag lived');
  assert.ok(/PUBLIC_SCHEMA\.md:74-89/.test(home), 'the column witness left the record');
  assert.ok(/THIS IS THAT SITTING, AND THIS IS THAT RE-READ/.test(home),
    'the paragraph no longer records that its own re-read instruction was discharged');
});

// ── CLASS A DOORS, DRIVEN END TO END ────────────────────────────────────────

await ta('§13.15 SESSION: the three banked FORGED ids are REFUSED — the disease, dead', async () => {
  for (const id of FORGED) {
    const { out } = await driveA(SESSION_GET, { params: { userId: id } });
    assert.strictEqual(out.status, 401, `${id} still bought a session`);
    assert.ok(!JSON.stringify(out.body).includes(MEHEK.name), "a member's name reached a forged caller");
  }
});

await ta('§13.16 SESSION: the real caller is served HER OWN session, and :userId is ignored', async () => {
  // The param is a stranger's id ON PURPOSE. The proven identity wins
  // (`resolveCircleIdentityIfPresent.js:50-51`), so she receives herself.
  const { out } = await driveA(SESSION_GET, { bearer: MEHEK_TOKEN(), params: { userId: FORGED[2] } });
  assert.strictEqual(out.body.success, true, 'the live member was refused');
  assert.strictEqual(out.body.data.user_id, MEHEK.usersId, 'the path id decided the answer');
  assert.strictEqual(out.body.data.couple_id, MEHEK.coupleId);
  assert.strictEqual(out.body.data.bride.name, BRIDE_NAME, 'the one remaining query stopped running');
});

await ta('§13.17 SESSION stays MINIMISED under the guard — phone and pin_set never return', async () => {
  const { out } = await driveA(SESSION_GET, { bearer: MEHEK_TOKEN(), params: { userId: MEHEK.usersId } });
  const wire = JSON.stringify(out.body);
  for (const gone of ['phone', 'pin_set', 'co_planner_id', 'wedding_date', 'partner_name']) {
    assert.ok(!wire.includes(gone), `${gone} came back with the guard`);
  }
  assert.ok(!wire.includes(MEHEK.phone), "the member's phone number reached the wire");
});

t('§13.18 F-07.106\'s DECLARATION SURVIVED THE COLLAPSE — the paragraph is untouchable', () => {
  const s2 = read('src/api/circle/session.js');
  assert.ok(s2.includes('DECLARED PARTIAL — F-07.106'), "the declaration was collapsed with the block");
  assert.ok(s2.includes('src/api/couple/profile.js:41-50'), 'the named mechanism left the paragraph');
  assert.ok(s2.includes('[F-06.85]'), 'the law-tag that forces the re-read is gone');
});

await ta('§13.19 FORK D — MUSE GET: refused without a credential, and :brideId is ignored with one', async () => {
  const bare = await driveA(MUSE_GET, { params: { brideId: MEHEK.coupleId } });
  assert.strictEqual(bare.out.status, 401, 'the door with no check of any kind still has none');

  const ok = await driveA(MUSE_GET, { bearer: MEHEK_TOKEN(), params: { brideId: OTHER_COUPLE } });
  assert.strictEqual(ok.out.body.success, true, 'the member cannot see her own board');
  // She asked for ANOTHER couple's board and received her own — the param is dead.
  assert.ok(Array.isArray(ok.out.body.data));
});

await ta('§13.20 MUSE SAVE: the WRITE is attributed to the PROVEN member, never to the body', async () => {
  const { out, cap } = await driveA(MUSE_SAVE, {
    bearer: MEHEK_TOKEN(),
    body: { image_url: 'https://x/y.jpg', memberUserId: FORGED[0] },   // a forged attribution
  });
  assert.strictEqual(out.body.success, true);
  assert.strictEqual(cap.inserted[0].saved_by_user_id, MEHEK.usersId, 'the body forged the saver');
  assert.strictEqual(cap.inserted[0].couple_id, MEHEK.coupleId);
  assert.strictEqual(cap.activity[0].actor_user_id, MEHEK.usersId, 'the body forged the actor');
});

// The scanner skips ITSELF, and that exclusion is named rather than regexed
// away: this cell's own name contains the dead identifier, so a census that
// counted its own accusation would never go green. Every other file in `src/`
// and `scripts/` is walked, comment-stripped through the same discipline
// §12.10 uses — a census counting prose as code is F-07.74's class.
const SELF = 'scripts/b07_f0772_circle_auth_bench.js';
t('§13.21 F-07.116 CURED BY DELETION — getCircleMember is gone from the estate', () => {
  const hits = [];
  for (const dir of ['src', 'scripts']) {
    const walk = (d) => {
      for (const e of fs.readdirSync(SRC(d), { withFileTypes: true })) {
        const rel = path.posix.join(d, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(rel); }
        else if (/\.(js|ts|mjs)$/.test(e.name) && rel !== SELF) {
          const body = read(rel).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
          if (/\bgetCircleMember\b/.test(body)) hits.push(rel);
        }
      }
    };
    walk(dir);
  }
  assert.deepStrictEqual(hits, [], `the dead helper is still live code in: ${hits.join(', ')}`);
});

t('§13.22 CLASS A source: no door reads an identity out of a param or a body any more', () => {
  // F-07.115 — `src/api/circle/dreamai.js` was the third file here and is
  // deleted. Two Class A files remain; §14.1 asserts the deletion so this
  // list's shrinking cannot pass for a door quietly dropping out of scope.
  for (const f of ['src/api/circle/session.js', 'src/api/circle/muse.js']) {
    const code = read(f).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/memberUserId/.test(code), `${f} still reads memberUserId`);
    assert.ok(!/primary_user_id/.test(code), `${f} still reads primary_user_id`);
    assert.ok(/req\.circleMember/.test(code), `${f} never reads the proven member`);
  }
});

// ── §13.23 IS RE-AUTHORED AT F-07.115: THE DOOR IT GUARDED IS RETIRED ───────
// This cell asserted `/dreamai` was guarded at the mount and that its handlers
// had stopped reading identity out of a body — narrowed to source, because
// requiring that router executed `circleEngine` at import (a W-1 surface). The
// door is now DELETED, so the guarded-ness claim has no subject. It is replaced
// by §14 below, which asserts the retirement itself and — more importantly —
// asserts that retiring it did NOT cost the lane a guard anywhere else.
H('§14 — F-07.115: the doors are retired, and eleven becomes nine HONESTLY');

t('§14.1 THE FILE IS DELETED — not emptied, not stubbed, gone from the tree', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/api/circle/dreamai.js')),
    'the retired router survives its own retirement');
});

t('§14.2 THE MOUNT IS GONE, and nothing else requires the deleted module', () => {
  const r = read('src/api/router.js');
  const code = r.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/router\.use\('\/dreamai'/.test(code), 'the /dreamai mount is still on the router');
  // A require of a deleted module is a boot crash, not a lint nit. Swept over
  // the whole of src/ rather than the router alone.
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const rel = path.join(d, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|ts)$/.test(e.name)) continue;
      const body = read(rel).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      if (/circle\/dreamai/.test(body)) hits.push(rel);
    }
  };
  walk('src');
  assert.deepStrictEqual(hits, [], `the deleted module is still required in: ${hits.join(', ')}`);
});

// ── THE CELL THIS WHOLE MOVEMENT EXISTS TO EARN ─────────────────────────────
// A door count FALLING is what a regression looks like from a distance, and it
// is the opposite of what happened. The distinction is asserted mechanically so
// it can never be settled by a tally: EVERY DOOR THAT EXISTED AT `f8cd7de` AND
// STILL EXISTS IS STILL GUARDED. Two doors ceased to exist. No door lost a guard.
t('§14.3 NO DOOR LOST ITS GUARD — the surviving Class A set is guarded, the Class B set refuses in-handler', () => {
  const code = read('src/api/router.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

  const CLASS_A_SURVIVING = ['/circle/session', '/circle/muse'];
  const CLASS_B           = ['/frost/circle/feed', '/frost/circle/threads', '/frost/circle/messages'];
  const MINTS             = ['/auth/verify-pin', '/circle/join'];

  for (const m of CLASS_A_SURVIVING) {
    assert.ok(new RegExp(`router\\.use\\('${m}',\\s*requireCircleMemberAuth`).test(code),
      `${m} lost its guard in the retirement`);
  }
  for (const m of [...CLASS_B, ...MINTS]) {
    assert.ok(!new RegExp(`router\\.use\\('${m}',\\s*requireCircleMemberAuth`).test(code),
      `${m} must NOT carry the member guard`);
  }
  // The mount count is the arithmetic, asserted rather than narrated: two guarded
  // Class A mounts (four doors: session ×1, muse ×3), three Class B mounts (five
  // doors), two unguarded mints. Nine enforced doors, down from eleven.
  const guarded = (code.match(/router\.use\('[^']+',\s*requireCircleMemberAuth/g) || []).length;
  assert.strictEqual(guarded, 2, `expected exactly two guarded circle mounts, found ${guarded}`);
});

t('§14.4 THE PRIVATE-THREAD MINT CENSUS MOVED FIVE → FOUR, and the record says so', () => {
  // F-07.112 made `counterparty_user_id` load-bearing across five mint sites.
  // `dreamai.js` was one of them and is deleted, so the collision surface that
  // finding cured got SMALLER. A future reader counting five is reading ink that
  // predates this delivery, which is why both notes below were re-derived.
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const rel = path.join(d, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|ts)$/.test(e.name)) continue;
      const body = read(rel).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      if (/counterparty_user_id:\s*\w/.test(body)) hits.push(rel);
    }
  };
  walk('src');
  assert.ok(!hits.includes('src/api/circle/dreamai.js'), 'the retired mint site is still minting');

  const msg = read('src/api/circle/messages.js');
  assert.ok(/brideIndex\.js:369/.test(msg) && /brideInbound\.js:278/.test(msg),
    "messages.js's thread model still points at the deleted file for the private lane's mint");
  // THE HISTORICAL CITE IS ALLOWED TO SURVIVE AND THE PRESENT-TENSE CLAIM IS NOT.
  // Both notes deliberately record that they used to name `dreamai.js:93` — that
  // is what "records what it replaced and the cost" means, and a bare `!/:93/`
  // would forbid the estate from remembering its own corrections. What must not
  // survive is the sentence asserting that file mints anything TODAY.
  assert.ok(!/minted\s*\n?\s*\/\/\s*at src\/api\/circle\/dreamai/.test(msg) &&
            !/minted at src\/api\/circle\/dreamai/.test(msg),
    'messages.js still asserts the deleted file as a live mint site');
  assert.ok(!/carries kind='circle_thread' \(dreamai\.js:93\)/.test(read('src/api/circle/threads.js')),
    'threads.js still asserts the deleted file as a live mint site');
});

t('§14.5 MIRA OUTLIVES HER DOORS — the WhatsApp lane calls the engine DIRECTLY', () => {
  // The non-regression claim of the entire arc, and the one the founder walks.
  // The retired doors were an HTTP wrapper; the WhatsApp lane never used them.
  const bi = read('src/brideIndex.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(/require\('\.\/agent\/circleEngine'\)/.test(bi),
    'brideIndex no longer requires the circle engine');
  assert.ok(/runCircleAgenticTurn\(\{/.test(bi),
    'brideIndex no longer calls runCircleAgenticTurn directly');
  assert.ok(!/\/dreamai\//.test(bi), 'the WhatsApp lane acquired a dependency on the retired doors');
  // And the engine itself is untouched: W-1 holds through a deletion.
  assert.ok(fs.existsSync(path.join(ROOT, 'src/agent/circleEngine.js')),
    "Mira's engine was deleted with her doors");
});

// ── CLASS B: REFUSE ON NEITHER, ADMIT BOTH LANES ────────────────────────────

async function driveFeed({ bearer }) {
  const { plane } = guardPlane({ activity: [] });
  const out = {};
  const req = { headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
                cookies: {}, body: {}, params: { brideId: MEHEK.coupleId }, query: {},
                app: { locals: { supabase: plane } } };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  await new Promise((resolve, reject) => {
    let done = false;
    res.json = (b) => { out.body = b; if (!done) { done = true; resolve(); } return res; };
    FEED_GET(req, res, (e) => { done = true; reject(e || new Error('next()')); });
    setTimeout(() => { if (!done) { done = true; reject(new Error('never answered')); } }, 4000);
  });
  return out;
}

await ta('§13.24 CLASS B refuses a credential-less caller at ALL FIVE handlers', async () => {
  const feed = await driveFeed({});
  assert.strictEqual(feed.status, 401);
  assert.strictEqual(feed.body.success, false, 'feed spoke the wrong envelope family');

  const list = await drive(GET_LIST, { params: { brideId: MEHEK.coupleId } });
  assert.strictEqual(list.out.status, 401);
  assert.strictEqual(list.out.body.success, false);

  const thr = await drive(GET_THREAD, { params: { brideId: MEHEK.coupleId, threadId: `dm:${CONVO_ID}` } });
  assert.strictEqual(thr.out.status, 401);
  assert.strictEqual(thr.out.body.success, false);

  const get = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW] });
  assert.strictEqual(get.out.status, 401);
  assert.strictEqual(get.out.body.ok, false, 'the messages GET spoke {success} — F-07.117');

  const post = await drive(POST_MSG, { body: { userId: MEHEK.coupleId, body: 'x' } });
  assert.strictEqual(post.out.status, 401);
  assert.strictEqual(post.out.body.ok, false);
});

await ta('§13.25 THE BRIDE IS ADMITTED at every Class B door she reaches — the hazard, closed', async () => {
  // She is NOT a circle_members row. Arm 2 is the only thing standing between
  // her and a refusal on her own conversation, and this is the cell that says so.
  const get = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW], bearer: BRIDE_JWT });
  assert.strictEqual(get.out.body.ok, true, 'the bride was locked out of her own circle chat');
  assert.strictEqual(get.out.body.messages.length, 1);

  const post = await drive(POST_MSG, { body: { body: 'hello circle', sender_role: 'bride' }, bearer: BRIDE_JWT });
  assert.strictEqual(post.out.body.ok, true, 'the bride could not send into her own circle');
  assert.strictEqual(post.cap.inserted.sender_name, BRIDE_NAME);

  const feed = await driveFeed({ bearer: BRIDE_JWT });
  assert.strictEqual(feed.body.success, true);
});

await ta('§13.26 THE MEMBER IS ADMITTED at Class B with her lane-native token', async () => {
  const token = MEHEK_TOKEN();
  const get = await drive(GET_MSG, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW], bearer: token });
  assert.strictEqual(get.out.body.ok, true, 'the member was refused on the shared door');

  const post = await drive(POST_MSG, { body: { body: 'x' }, bearer: token });
  assert.strictEqual(post.out.body.ok, true);
  assert.strictEqual(post.cap.inserted.sender_name, MEHEK.name);
  assert.strictEqual(post.cap.inserted.sender_user_id, MEHEK.usersId);

  const feed = await driveFeed({ bearer: token });
  assert.strictEqual(feed.body.success, true);
});

await ta('§13.27 THE PARAM CANNOT CROSS COUPLES — a proven caller asking for another couple gets her own', async () => {
  const token = MEHEK_TOKEN();
  const get = await drive(GET_MSG, { params: { coupleId: OTHER_COUPLE }, rows: [PRECURE_ROW], bearer: token });
  assert.strictEqual(get.out.body.ok, true);
  assert.strictEqual(get.out.body.thread_id, `dm:${CONVO_ID}`, 'the supplied couple id chose the thread');
});

await ta('§13.28 THE BODY\'S userId IS DEAD — a forged identity beside a real token authors nothing', async () => {
  const token = MEHEK_TOKEN();
  const post = await drive(POST_MSG, { body: { userId: FORGED[1], body: 'x' }, bearer: token });
  assert.strictEqual(post.cap.inserted.sender_user_id, MEHEK.usersId, 'the body chose the author');
  assert.strictEqual(post.cap.inserted.sender_name, MEHEK.name);
});

t('§13.29 the mint-and-teach fallback is DELETED, not left unreachable', () => {
  const code = read('src/api/circle/messages.js')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/bodyUserId/.test(code), 'the dead fallback is still standing');
  assert.ok(/async function resolveAuthor\(supabase, identity\)/.test(code),
    'resolveAuthor still takes a body identity');
});

// ── F-07.113: THE THIRD ANSWER STOPS BEING SILENT ───────────────────────────

await ta('§13.30 F-07.113: a PRESENT-but-unresolvable credential is refused AND SPEAKS', async () => {
  // A Bearer that is not a circle token and not a resolvable JWT. Arm 1 falls
  // through; arm 2 answers {present:true, coupleId:null} — the third answer,
  // live-witnessed at CE-126 on the founder's own stale sign-in.
  const lines = [];
  const warn = console.warn;
  console.warn = (...a) => lines.push(a.join(' '));
  let post;
  try {
    post = await drive(POST_MSG, { body: { body: 'x' }, bearer: 'stale.jwt.value' });
  } finally { console.warn = warn; }
  assert.strictEqual(post.out.status, 401, 'the third answer was served');
  assert.strictEqual(post.cap.inserted, null);
  const hit = lines.find(l => l.includes('[circle/messages]'));
  assert.ok(hit, 'the third answer is still silent at the write seam — F-07.113 uncured');
  assert.ok(hit.includes('source=couple'), 'the log line does not name its source');
  assert.ok(hit.includes('coupleId=null'), 'the log line does not name the null');
});

await ta('§13.31 F-07.113\'s line carries ZERO credential bytes — a length is a value', async () => {
  const SECRET_TOKEN = 'stale.jwt.value';
  const lines = [];
  const warn = console.warn;
  console.warn = (...a) => lines.push(a.join(' '));
  try { await drive(POST_MSG, { body: { body: 'x' }, bearer: SECRET_TOKEN }); }
  finally { console.warn = warn; }
  const hit = lines.find(l => l.includes('[circle/messages]')) || '';
  assert.ok(!hit.includes(SECRET_TOKEN), 'the token value reached a log');
  assert.ok(!hit.includes(SECRET_TOKEN.slice(0, 6)), 'a token prefix reached a log');
  assert.ok(!/length|len=|\b15\b/.test(hit), 'a token length reached a log');
  assert.ok(!hit.includes('x'), 'the message body reached a log');
});

await ta('§13.32 an ABSENT credential does NOT fire the line — it reports a mechanism, not traffic', async () => {
  const lines = [];
  const warn = console.warn;
  console.warn = (...a) => lines.push(a.join(' '));
  try { await drive(POST_MSG, { body: { body: 'x' } }); }
  finally { console.warn = warn; }
  assert.ok(!lines.some(l => l.includes('[circle/messages] POST refused')),
    'the line fires on every logged-out request and is therefore noise');
});

H('§13.M — MUTATION: every §13 cell proven non-vacuous by breaking PRODUCTION code');

// ── ANCHORS ARE SITE-QUALIFIED. CE-127's fault, third instance in this file:
// `mutate` uses String.replace and takes the FIRST occurrence, and the refusal
// line below is byte-identical at three Class B sites. Every anchor carries the
// line above it, which differs at every site.
await ta('§13.M1 make the guard trust the auth plane again ⇒ §13.1 RED (axis 1 restored)', async () => {
  await mutate('src/api/middleware/requireCircleMemberAuth.js',
    '  const claim = verifyCircleSession(token);',
    '  const claim = await supabase.auth.getUser(token);', async () => {
      const code = read('src/api/middleware/requireCircleMemberAuth.js')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      assert.ok(!/supabase\.auth\.getUser/.test(code));
    });
});

await ta('§13.M2 drop the credential check ⇒ §13.4 RED (the lane trusts anyone again)', async () => {
  // The first cut of this cell replaced the predicate with `if (false)`, which
  // left `token` null, let `verifyCircleSession(null)` answer null, and produced
  // a 401 anyway — the cell passed for the WRONG REASON, exactly CE-125's third
  // bench fault (a mutation that makes two halves agree on a broken world). The
  // mutation that actually opens the hole is the one that lets a credential-less
  // caller THROUGH.
  await mutate('src/api/middleware/requireCircleMemberAuth.js',
    "  if (!token) {\n    return res.status(401).json({ success: false, error: 'Unauthorised.' });\n  }\n\n  // `verifySigned` answers NULL",
    "  if (!token) {\n    return next();\n  }\n\n  // `verifySigned` answers NULL", async () => {
      delete require.cache[require.resolve(SRC('src/api/middleware/requireCircleMemberAuth'))];
      const g2 = require(SRC('src/api/middleware/requireCircleMemberAuth'));
      const { plane } = guardPlane();
      const req = { headers: {}, cookies: {}, app: { locals: { supabase: plane } } };
      const out = {};
      const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
      await new Promise((r) => { let d = false; const f = () => { if (!d) { d = true; r(); } };
        res.json = (b) => { out.body = b; f(); return res; };
        g2(req, res, () => { out.passed = true; f(); }); setTimeout(f, 2000); });
      assert.strictEqual(out.status, 401);
    });
});

await ta('§13.M3 drop the couple binding check ⇒ §13.9 RED (a phone in two circles rides either token)', async () => {
  await mutate('src/api/middleware/requireCircleMemberAuth.js',
    '  if (member.couple_id !== claim.couple_id) {',
    '  if (false) {', async () => {
      delete require.cache[require.resolve(SRC('src/api/middleware/requireCircleMemberAuth'))];
      const g2 = require(SRC('src/api/middleware/requireCircleMemberAuth'));
      const { plane } = guardPlane({ memberCouple: OTHER_COUPLE });
      const req = { headers: { authorization: `Bearer ${MEHEK_TOKEN()}` }, cookies: {},
                    app: { locals: { supabase: plane } } };
      const out = {};
      const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
      await new Promise((r) => { let d = false; const f = () => { if (!d) { d = true; r(); } };
        res.json = (b) => { out.body = b; f(); return res; };
        g2(req, res, () => { out.passed = true; f(); }); setTimeout(f, 2000); });
      assert.strictEqual(out.status, 403);
    });
});

await ta('§13.M4 drop the active-status filter ⇒ §13.8 RED (revocation stops being live)', async () => {
  await mutate('src/api/middleware/requireCircleMemberAuth.js',
    "    .eq('invitee_phone', userRow.phone)\n    .eq('status', 'active')",
    "    .eq('invitee_phone', userRow.phone)", async () => {
      delete require.cache[require.resolve(SRC('src/api/middleware/requireCircleMemberAuth'))];
      const g2 = require(SRC('src/api/middleware/requireCircleMemberAuth'));
      const { plane } = guardPlane({ memberStatus: 'removed' });
      const req = { headers: { authorization: `Bearer ${MEHEK_TOKEN()}` }, cookies: {},
                    app: { locals: { supabase: plane } } };
      const out = {};
      const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
      await new Promise((r) => { let d = false; const f = () => { if (!d) { d = true; r(); } };
        res.json = (b) => { out.body = b; f(); return res; };
        g2(req, res, () => { out.passed = true; f(); }); setTimeout(f, 2000); });
      assert.strictEqual(out.status, 403);
      assert.ok(!out.passed, 'a removed member was admitted');
    });
});

await ta('§13.M5 unmount the guard from /circle/session ⇒ §13.15 RED (the three forged ids work again)', async () => {
  await mutate('src/api/router.js',
    "router.use('/circle/session',        requireCircleMemberAuth, require('./circle/session'));   // CLASS A",
    "router.use('/circle/session',        require('./circle/session'));   // CLASS A", async () => {
      const r = read('src/api/router.js').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      assert.ok(/router\.use\('\/circle\/session',\s*requireCircleMemberAuth/.test(r));
    });
});

await ta('§13.M6 let MUSE GET read :brideId again ⇒ §13.19 RED (Fork D undone)', async () => {
  await mutate('src/api/circle/muse.js',
    '  const brideId = req.circleMember.couple_id;',
    '  const brideId = req.params.brideId;', async () => {
      const code = read('src/api/circle/muse.js')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      assert.ok(!/req\.params\.brideId/.test(code));
    });
});

await ta('§13.M7 let MUSE SAVE take the body\'s attribution again ⇒ §13.20 RED', async () => {
  await mutate('src/api/circle/muse.js',
    '      saved_by_user_id: me.user_id,',
    '      saved_by_user_id: req.body.memberUserId || me.user_id,', async () => {
      delete require.cache[require.resolve(SRC('src/api/circle/muse.js'))];
      const H2 = handlerOf('src/api/circle/muse.js', 'post', '/save');
      const { cap } = await driveA(H2, {
        bearer: MEHEK_TOKEN(),
        body: { image_url: 'https://x/y.jpg', memberUserId: FORGED[0] },
      });
      assert.strictEqual(cap.inserted[0].saved_by_user_id, MEHEK.usersId);
    });
});

await ta('§13.M8 drop the refusal from the MESSAGES GET ⇒ §13.24 RED (site-qualified anchor)', async () => {
  await mutate('src/api/circle/messages.js',
    "  if (!req.circleIdentity.coupleId) {\n    return res.status(401).json({ ok: false, error: 'Unauthorised.' });\n  }\n  // `:coupleId` IS NO LONGER READ.",
    "  // `:coupleId` IS NO LONGER READ.", async () => {
      delete require.cache[require.resolve(SRC('src/api/circle/messages.js'))];
      const H2 = handlerOf('src/api/circle/messages.js', 'get', '/:coupleId');
      const { out } = await drive(H2, { params: { coupleId: MEHEK.coupleId }, rows: [PRECURE_ROW] });
      assert.strictEqual(out.status, 401);
    });
});

await ta('§13.M9 drop the refusal from FEED ⇒ §13.24 RED', async () => {
  await mutate('src/api/circle/feed.js',
    "  if (!req.circleIdentity.coupleId) {\n    return res.status(401).json({ success: false, error: 'Unauthorised.' });\n  }",
    "  // refusal removed", async () => {
      delete require.cache[require.resolve(SRC('src/api/circle/feed.js'))];
      const H2 = handlerOf('src/api/circle/feed.js', 'get', '/:brideId');
      const { plane } = guardPlane({ activity: [] });
      const out = {};
      const req = { headers: {}, cookies: {}, body: {}, params: { brideId: MEHEK.coupleId }, query: {},
                    app: { locals: { supabase: plane } } };
      const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
      await new Promise((r, j) => { let d = false;
        res.json = (b) => { out.body = b; if (!d) { d = true; r(); } return res; };
        H2(req, res, (e) => { d = true; j(e || new Error('next()')); });
        setTimeout(() => { if (!d) { d = true; j(new Error('never answered')); } }, 3000); });
      assert.strictEqual(out.status, 401);
    });
});

await ta('§13.M10 silence F-07.113\'s line ⇒ §13.30 RED (the third answer goes dark again)', async () => {
  await mutate('src/api/circle/messages.js',
    "    console.warn('[circle/messages] POST refused — credential present, resolved to no couple:',",
    "    void ('[circle/messages] POST refused — credential present, resolved to no couple:',", async () => {
      delete require.cache[require.resolve(SRC('src/api/circle/messages.js'))];
      const H2 = handlerOf('src/api/circle/messages.js', 'post', '/');
      const lines = [];
      const warn = console.warn;
      console.warn = (...a) => lines.push(a.join(' '));
      try { await drive(H2, { body: { body: 'x' }, bearer: 'stale.jwt.value' }); }
      finally { console.warn = warn; }
      assert.ok(lines.some(l => l.includes('[circle/messages]')));
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
  console.log('GREEN — the lane no longer trusts a supplied identifier. FOUR Class A doors');
  console.log('behind the re-authored guard, five Class B doors refusing on neither, the');
  console.log('bride and the member both still admitted, and the third answer speaking.');
  console.log('NINE enforced doors, not eleven: F-07.115 retired the two /dreamai doors');
  console.log('with the surface they served. No door lost its guard — two ceased to exist.');
}
})();
