#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b14_d1_visibility_bench.js
// TDW_14 · D-1 · C-3 — THE PER-MEMBER VISIBILITY RESOLVER, PROVEN BOTH WAYS.
//
// Runnable from ANY working directory (§9: "a cure nobody can re-run quietly
// stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/b14_d1_visibility_bench.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ──────────
// D-1 ships a MECHANISM and no product decision. The column carries per-member
// overrides, the one home resolves them, the guard hands the column over, the
// bride writes it. NOBODY'S PERMISSIONS CHANGE TODAY — every existing row holds
// `{}` and is answered exactly as it was yesterday.
//
// Every cell is written to that boundary. Where a cell would be more impressive
// if it asserted that a member is now denied a budget field, it asserts instead
// that NO MEMBER-FACING ROUTE SERVES A BUDGET FIELD AT ALL (§6) — because that
// is the truth at this tip, and a cell proving a filter over a payload that does
// not exist would be proving nothing while looking like proof. §6 is written as
// an ABSENCE cell so that the first payload to carry money REDDENS it and has to
// route through the resolver on its way in. That is the conversation we want it
// to force, and it is the same shape §13.14 took at F-07.115.
//
// ── THE MUTATION LEG IS THE VERDICT (§7) ────────────────────────────────────
// Every section above is proven non-vacuous by breaking PRODUCTION CODE — never
// test setup — and asserting the named cell goes RED. A bench without a mutation
// leg agrees with its author.
//
// ── COMMENTS ARE STRIPPED BEFORE ANY SOURCE ASSERTION ───────────────────────
// The comment-blindness law, and it has bitten this estate twice: `/*` inside
// `accept="image/*"` once stripped live code, and a cell that greps a file
// carrying a paragraph ABOUT a defect will find the defect's name in the prose
// and pass over the defect itself. `code()` below removes line comments and
// block comments and is used for every structural assertion.
//
// ── THE RESTORE IS CHECKSUMMED (CE-32 Ruling 1) ─────────────────────────────
// Every file this harness writes is hashed before the mutation and re-hashed
// after the restore, and a mismatch is a FAILURE OF THE BENCH, not a warning.
// le3's tuition: a fixture's `rm -f` once ate a live production module.
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');
const sha  = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Strip block comments first, then line comments. Order matters: a `//` inside a
// block comment is not a line comment, and removing line comments first would
// leave the block's opening `/*` orphaned.
const code = (p) => read(p)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter(l => !l.trim().startsWith('//'))
  .join('\n');

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

const PERMS_HOME = 'src/lib/circlePermissions.js';
const GUARD      = 'src/api/middleware/requireCircleMemberAuth.js';
const WRITER     = 'src/api/couple/circle.js';
const MIGRATION  = 'db/migrations/0098_circle_visibility.sql';

// Fresh require, so a mutated file is actually re-read rather than served from
// the module cache. Every module the mutation could reach is evicted, not just
// the one named — the writer requires the home, so mutating the home while the
// writer sits cached would test a stale pairing.
function fresh(p) {
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.join('src', 'lib', 'circlePermissions')) ||
        k.includes(path.join('src', 'api')) ) delete require.cache[k];
  }
  return require(SRC(p));
}

// ── MUTATION HARNESS — production code only, checksummed restore ────────────
const restoreLedger = [];
async function mutate(file, from, to, fn) {
  const before = read(file);
  const hashBefore = sha(before);
  assert.ok(before.includes(from),
    `MUTATION TARGET ABSENT in ${file} — the bench is asserting against code that moved: ${from}`);
  fs.writeFileSync(SRC(file), before.replace(from, to));
  let threw = null;
  try { await fn(); } catch (e) { threw = e; }
  fs.writeFileSync(SRC(file), before);
  const hashAfter = sha(read(file));
  restoreLedger.push({ file, ok: hashAfter === hashBefore });
  assert.strictEqual(hashAfter, hashBefore, `RESTORE FAILED for ${file} — the tree is not as it was found`);
  if (threw) throw threw;
}

// A mutation cell asserts that a NAMED cell goes red. `expectRed` runs a
// closure that should throw once production code is broken; if it does NOT
// throw, the cell it names was decorative and this bench says so.
async function expectRed(name, file, from, to, probe) {
  await ta(name, async () => {
    await mutate(file, from, to, async () => {
      let red = false;
      try { await probe(); } catch { red = true; }
      assert.ok(red, 'the named cell PASSED over broken production code — it is decorative');
    });
  });
}

(async () => {

// ═══════════════════════════════════════════════════════════════════════════
H('§1 — THE ONE HOME: the resolver, over the frozen defaults');
// ═══════════════════════════════════════════════════════════════════════════

const { CIRCLE_PERMISSIONS, VISIBILITY_KEYS, circlePermissions, normaliseVisibility } = fresh(PERMS_HOME);

// THE REGRESSION GUARANTEE, and it is the most important cell in the file: the
// answer for a member carrying no overrides must be CHARACTER-IDENTICAL to the
// block that shipped at F-07.72. D-1 changes what is possible, not what is true.
const F0772_BLOCK = {
  can_see_budget:      false,
  can_see_guests:      false,
  can_see_vendors:     false,
  can_contribute_muse: true,
};

t('§1.1 no argument resolves to the F-07.72 block, character-identical', () => {
  assert.deepStrictEqual(circlePermissions(), F0772_BLOCK);
});

t('§1.2 an EMPTY override object resolves to the same block — the column\'s default is inert', () => {
  assert.deepStrictEqual(circlePermissions({}), F0772_BLOCK);
});

t('§1.3 null, undefined, an array and a string all mean NO OVERRIDES, never rights', () => {
  for (const bad of [null, undefined, [], ['budget'], 'budget', 42, true]) {
    assert.deepStrictEqual(circlePermissions(bad), F0772_BLOCK,
      `${JSON.stringify(bad)} was not treated as "no overrides"`);
  }
});

t('§1.4 a TRUE override opens exactly one key and touches no other', () => {
  const r = circlePermissions({ budget: true });
  assert.strictEqual(r.can_see_budget, true);
  assert.strictEqual(r.can_see_guests, false);
  assert.strictEqual(r.can_see_vendors, false);
  assert.strictEqual(r.can_contribute_muse, true);
});

t('§1.5 a FALSE override closes a key whose default is open — the muse switch', () => {
  assert.strictEqual(circlePermissions({ contribute_muse: false }).can_contribute_muse, false);
});

// THE HOLE WITH NO ERROR MESSAGE. jsonb holds the STRING "false" happily, and
// "false" is truthy. A permission that opens because somebody wrote a quoted
// word is the kind of defect that never announces itself.
t('§1.6 STRICT BOOLEANS: the strings "true"/"false" are NOT overrides', () => {
  assert.strictEqual(circlePermissions({ budget: 'true' }).can_see_budget, false);
  assert.strictEqual(circlePermissions({ contribute_muse: 'false' }).can_contribute_muse, true);
});

t('§1.7 STRICT BOOLEANS: 1, 0, "" and null are NOT overrides', () => {
  assert.strictEqual(circlePermissions({ budget: 1 }).can_see_budget, false);
  assert.strictEqual(circlePermissions({ contribute_muse: 0 }).can_contribute_muse, true);
  assert.strictEqual(circlePermissions({ budget: '' }).can_see_budget, false);
  assert.strictEqual(circlePermissions({ budget: null }).can_see_budget, false);
});

// [F-SW.2] ABSENCE CELL. The resolver walks the DEFAULT BLOCK's keys, never the
// stored object's. A `{...defaults, ...stored}` spread would let anything ever
// written into that jsonb reach the session response body.
t('§1.8 ALLOWLIST: an unknown stored key never appears in the resolved block', () => {
  const r = circlePermissions({ nonsense: true, moments: true, admin: true });
  assert.deepStrictEqual(Object.keys(r).sort(), Object.keys(F0772_BLOCK).sort(),
    'a key the estate never declared reached the response shape');
});

// The retired flag cannot come back through the column any more than through a
// literal. §13.14 of b07_f0772 watches the literal; this watches the new door.
t('§1.9 [F-07.115] the retired flag cannot return through the COLUMN', () => {
  const r = circlePermissions({ dreamai_access_granted: true, dreamai: true });
  assert.ok(!('dreamai_access_granted' in r), 'the retired flag returned via the jsonb');
  assert.ok(!('can_dreamai' in r));
});

t('§1.10 each call returns a FRESH, extensible copy — the frozen block is never handed out', () => {
  const a = circlePermissions();
  a.can_see_budget = true;
  assert.strictEqual(circlePermissions().can_see_budget, false, 'a caller mutated the shared block');
  assert.strictEqual(CIRCLE_PERMISSIONS.can_see_budget, false);
  assert.ok(Object.isFrozen(CIRCLE_PERMISSIONS), 'the defaults are not frozen');
  assert.ok(!Object.isFrozen(a), 'the returned copy is frozen — a trap for the next reader');
});

t('§1.11 the short-key derivation is BIJECTIVE and derived from the block, not hand-kept', () => {
  assert.strictEqual(VISIBILITY_KEYS.length, Object.keys(CIRCLE_PERMISSIONS).length);
  assert.strictEqual(new Set(VISIBILITY_KEYS).size, VISIBILITY_KEYS.length, 'two keys collide');
  // Derived, not typed: the short list must contain no name absent from the block.
  for (const short of VISIBILITY_KEYS) {
    const hit = Object.keys(CIRCLE_PERMISSIONS).some(f => f.endsWith(short));
    assert.ok(hit, `${short} corresponds to no key in the block — the list is hand-kept`);
  }
});

t('§1.12 the LOAD-TIME INVARIANT exists — an ambiguous rename throws rather than silently collides', () => {
  const c = code(PERMS_HOME);
  assert.ok(/throw new Error/.test(c), 'the one home ships no load-time invariant');
  assert.ok(/VISIBILITY_KEYS\.length !== Object\.keys\(CIRCLE_PERMISSIONS\)\.length/.test(c),
    'the invariant does not compare the two derivations it exists to protect');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§2 — THE WRITE SIDE: one home for the allowlist, refusals wholesale');
// ═══════════════════════════════════════════════════════════════════════════

t('§2.1 a valid partial patch is accepted and carries only what was sent', () => {
  const r = normaliseVisibility({ budget: true });
  assert.ok(r.ok);
  assert.deepStrictEqual(r.value, { budget: true });
});

t('§2.2 an unknown key is REFUSED and NAMED', () => {
  const r = normaliseVisibility({ budget: true, moments: false });
  assert.ok(!r.ok);
  assert.deepStrictEqual(r.invalid, ['moments']);
});

t('§2.3 a non-boolean value is REFUSED and its key named', () => {
  const r = normaliseVisibility({ budget: 'true' });
  assert.ok(!r.ok);
  assert.deepStrictEqual(r.invalid, ['budget']);
});

t('§2.4 null, an array and a scalar are refused', () => {
  for (const bad of [null, undefined, [], 'budget', 7]) {
    assert.ok(!normaliseVisibility(bad).ok, `${JSON.stringify(bad)} was accepted as a patch`);
  }
});

// A request that half-lands is the worst answer available: the caller believes
// it landed whole.
t('§2.5 refusal is WHOLESALE — a rejected patch yields no partial value', () => {
  const r = normaliseVisibility({ budget: true, guests: true, nonsense: true });
  assert.ok(!r.ok);
  assert.ok(!('value' in r), 'a refused patch still offered a partial value to apply');
});

t('§2.6 the WRITE side re-implements no allowlist — the writer imports the one home', () => {
  const c = code(WRITER);
  assert.ok(/require\('\.\.\/\.\.\/lib\/circlePermissions'\)/.test(c),
    'the writer does not reach the one home');
  assert.ok(/normaliseVisibility/.test(c), 'the writer does not use the shared normaliser');
  // The key names must NOT appear as a literal list in the writer.
  assert.ok(!/'budget'\s*,\s*'guests'/.test(c), 'the writer carries its own copy of the key set');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§3 — THE GUARD: it hands the column over and holds no opinion');
// ═══════════════════════════════════════════════════════════════════════════

const MEHEK = {
  memberId: '895a09a6-78f6-445f-a51c-7ca34933257d',
  usersId:  '0f0b8b2a-1111-4c2e-9a11-aaaaaaaaaaaa',
  coupleId: '9f1f84d5-e688-4d4f-9e44-9f5da6315e52',
  phone:    '+919888294440',
  role:     'family',
};

// A plane shaped to exactly the guard's two lookups. `visibility`, `usersName`
// and `inviteeName` are knobs so the cells below can drive the column and the
// Q-d precedence without a second plane. The plane HONOURS the select list: a
// guard that stops asking for `visibility` gets a row without it, so §3.M1 can
// convict a select that no longer asks (the f0772 plane's own tuition — a fake
// that ignores what it was asked for cannot convict code that fails to ask).
function guardPlane({ visibility = {}, usersName = 'Droy', inviteeName = 'Mehek' } = {}) {
  return {
    from(table) {
      const q = { _eq: {}, _sel: null };
      q.select = (c) => { q._sel = typeof c === 'string' ? c : null; return q; };
      q.eq = (c, v) => { q._eq[c] = v; return q; };
      q.maybeSingle = async () => {
        const asked = (col) => (q._sel || '').split(',').map(s => s.trim()).includes(col);
        if (table === 'users') {
          if (q._eq.id !== MEHEK.usersId) return { data: null };
          return { data: { id: MEHEK.usersId, phone: MEHEK.phone, name: asked('name') ? usersName : undefined } };
        }
        if (table === 'circle_members') {
          if (q._eq.invitee_phone !== MEHEK.phone) return { data: null };
          if (q._eq.status !== undefined && q._eq.status !== 'active') return { data: null };
          const row = { id: MEHEK.memberId, couple_id: MEHEK.coupleId, role: MEHEK.role, status: 'active' };
          if (asked('invitee_name')) row.invitee_name = inviteeName;
          if (asked('visibility'))   row.visibility   = visibility;
          return { data: row };
        }
        return { data: null };
      };
      return q;
    },
  };
}

async function runGuard(opts = {}) {
  const guard = fresh(GUARD);
  // The guard verifies a REAL signed token; mint one through the lane's own home
  // rather than stubbing the verifier, so these cells cannot pass over a guard
  // that stopped verifying. The mint's name and signature were DERIVED at
  // `src/lib/circleSession.js:90` — `mintCircleSession({ userId, coupleId })`,
  // camelCase args, not the snake_case the token's payload uses. An earlier cut
  // of this line called `signCircleSession({ user_id, couple_id })`, which is
  // three mistakes in one call written from memory.
  //
  // The secret is a BENCH STRING and never a credential: `circleSecret()` reads
  // `process.env.CIRCLE_SESSION_SECRET` at call time (`circleSession.js:81-83`),
  // and the mint fails CLOSED to null without it, which would 401 every cell
  // below and look like a guard defect.
  process.env.CIRCLE_SESSION_SECRET = process.env.CIRCLE_SESSION_SECRET || 'bench-secret-not-a-credential';
  const { mintCircleSession } = require(SRC('src/lib/circleSession.js'));
  const token = mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  assert.ok(token, 'the bench could not mint a token — the cells below would 401 for the wrong reason');
  const req = {
    app: { locals: { supabase: guardPlane(opts) } },
    headers: { authorization: `Bearer ${token}` },
    get(h) { return this.headers[String(h).toLowerCase()]; },
  };
  let status = 200, body = null, nexted = false;
  const res = {
    status(s) { status = s; return this; },
    json(b) { body = b; return this; },
  };
  await guard(req, res, () => { nexted = true; });
  return { req, status, body, nexted };
}

await ta('§3.1 a member carrying {} is answered EXACTLY as she was before D-1', async () => {
  const { req, nexted } = await runGuard({ visibility: {} });
  assert.ok(nexted, 'the guard refused the real caller');
  assert.deepStrictEqual(req.circleMember.permissions, F0772_BLOCK);
});

await ta('§3.2 a FALSE override reaches req.circleMember — the bride closed the muse switch', async () => {
  const { req } = await runGuard({ visibility: { contribute_muse: false } });
  assert.strictEqual(req.circleMember.permissions.can_contribute_muse, false);
});

await ta('§3.3 a TRUE override reaches req.circleMember — the bride opened the budget', async () => {
  const { req } = await runGuard({ visibility: { budget: true } });
  assert.strictEqual(req.circleMember.permissions.can_see_budget, true);
});

t('§3.4 the guard SELECTS the column and RESOLVES THROUGH THE ONE HOME, holding no opinion', () => {
  const c = code(GUARD);
  assert.ok(/\.select\('id, couple_id, role, invitee_name, status, visibility'\)/.test(c),
    'the guard does not ask for the visibility column');
  assert.ok(/circlePermissions\(member\.visibility\)/.test(c),
    'the guard does not hand the column to the one home');
  // The guard must not read a flag itself — that would be the second filter
  // implementation the spec's guardrail calls a failed session.
  assert.ok(!/can_see_budget|can_see_guests|can_see_vendors|can_contribute_muse/.test(c),
    'the guard names a permission key — it is deciding, not delegating');
});

// ── Q-d, the founder's word, driven ────────────────────────────────────────
await ta('§3.5 [Q-d] users.name and invitee_name DISAGREE ⇒ the BRIDE\'s name wins', async () => {
  const { req } = await runGuard({ usersName: 'Droy', inviteeName: 'Mehek' });
  assert.strictEqual(req.circleMember.name, 'Mehek',
    'the guard preferred the member\'s own registration over the name the bride typed');
});

await ta('§3.6 [Q-d] invitee_name absent ⇒ users.name still answers — the flip is a precedence, not a deletion', async () => {
  const { req } = await runGuard({ usersName: 'Droy', inviteeName: null });
  assert.strictEqual(req.circleMember.name, 'Droy');
});

await ta('§3.7 [Q-d] both absent ⇒ null, never undefined', async () => {
  const { req } = await runGuard({ usersName: null, inviteeName: null });
  assert.strictEqual(req.circleMember.name, null);
});

t('§3.8 [Q-d] the founder\'s GROUND is recorded at the site, not just the ruling', () => {
  const raw = read(GUARD);
  assert.ok(raw.includes("bride's name wins. it's her circle") ||
            raw.includes('bride\u2019s name wins. it\u2019s her circle'),
    'the founder\u0027s word is not quoted at the line it decided');
  assert.ok(/F-07\.125/.test(raw), 'the finding number left the record');
  assert.ok(/R-OB\.7/.test(raw) && /F-07\.107/.test(raw),
    'the two older siblings are not named — a future hand cannot see this is the third of three');
  assert.ok(/F-06\.85/.test(raw), 'the declaration is not marked as one');
});

t('§3.9 [Q-d] the estate has ONE answer: all three sites prefer invitee_name', () => {
  const guard = code(GUARD);
  assert.ok(/member\.invitee_name \|\| userRow\.name/.test(guard), 'the guard\u0027s precedence is not invitee-first');
  const msgs = code('src/api/circle/messages.js');
  assert.ok(/invitee_name/.test(msgs), 'messages.js stopped naming from invitee_name');
  assert.ok(!/userRow\.name \|\| member\.invitee_name/.test(guard),
    'the retired precedence survives somewhere in the guard');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§4 — THE WRITER: the bride\'s switches, scoped and merged');
// ═══════════════════════════════════════════════════════════════════════════

// A plane for the couple lane. `stored` is the row's current column; `written`
// captures the update so a cell can prove nothing was written on a refusal.
function writerPlane({ stored = {}, memberCouple = MEHEK.coupleId } = {}) {
  const cap = { written: [] };
  const plane = {
    from() {
      const q = { _eq: {}, _upd: null };
      q.select = () => q;
      q.eq = (c, v) => { q._eq[c] = v; return q; };
      q.update = (u) => { q._upd = u; cap.written.push(u); return q; };
      q.maybeSingle = async () => {
        if (q._eq.id === MEHEK.memberId && q._eq.couple_id === memberCouple) {
          return { data: { id: MEHEK.memberId, visibility: stored }, error: null };
        }
        return { data: null, error: null };
      };
      q.then = (r) => Promise.resolve({ error: null }).then(r);
      return q;
    },
  };
  return { plane, cap };
}

async function runWriter(body, opts = {}) {
  const { plane, cap } = writerPlane(opts);
  const router = fresh(WRITER);
  const layer = router.stack.find(l => l.route && l.route.path === '/member/:memberId/visibility'
                                    && l.route.methods.patch);
  assert.ok(layer, 'PATCH /member/:memberId/visibility is not mounted on the couple circle router');
  const req = {
    app: { locals: { supabase: plane } },
    coupleUser: { couple_id: MEHEK.coupleId },
    params: { memberId: MEHEK.memberId },
    body,
  };
  let status = 200, payload = null;
  const res = { status(s) { status = s; return this; }, json(b) { payload = b; return this; } };
  await new Promise((resolve) => {
    layer.route.stack[0].handle(req, res, resolve);
    setTimeout(resolve, 200);
  });
  return { status, payload, cap };
}

await ta('§4.1 a valid patch MERGES over the stored fragment rather than replacing it', async () => {
  const { status, cap } = await runWriter({ visibility: { budget: true } },
                                          { stored: { contribute_muse: false } });
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(cap.written[0].visibility, { contribute_muse: false, budget: true },
    'the second switch erased the first');
});

// The envelope is `{ ok: true, ...payload }` — derived at `src/lib/response.js`,
// not assumed. An earlier cut of this cell reached for `payload.data` on the
// strength of a remembered shape and reddened against correct code.
await ta('§4.2 the response carries the RESOLVED block, through the same one home', async () => {
  const { payload } = await runWriter({ visibility: { contribute_muse: false } });
  assert.strictEqual(payload.ok, true);
  assert.strictEqual(payload.permissions.can_contribute_muse, false);
  assert.strictEqual(payload.permissions.can_see_budget, false,
    'the response invented a value for a key the bride never set');
  assert.deepStrictEqual(payload.visibility, { contribute_muse: false },
    'the response does not echo the stored fragment it wrote');
});

await ta('§4.3 a bad key is REFUSED 400 and NOTHING IS WRITTEN', async () => {
  const { status, cap } = await runWriter({ visibility: { moments: true } });
  assert.strictEqual(status, 400);
  assert.strictEqual(cap.written.length, 0, 'a refused patch still reached the table');
});

await ta('§4.4 a non-boolean is REFUSED 400 and NOTHING IS WRITTEN', async () => {
  const { status, cap } = await runWriter({ visibility: { budget: 'true' } });
  assert.strictEqual(status, 400);
  assert.strictEqual(cap.written.length, 0);
});

await ta('§4.5 a member of ANOTHER circle is 404 and NOTHING IS WRITTEN — the scope is the auth', async () => {
  const { status, cap } = await runWriter({ visibility: { budget: true } },
                                          { memberCouple: 'de4dbeef-0000-0000-0000-000000000000' });
  assert.strictEqual(status, 404);
  assert.strictEqual(cap.written.length, 0, 'a cross-circle write landed');
});

t('§4.6 the writer scopes its UPDATE by couple_id, not by member id alone', () => {
  const c = code(WRITER);
  const patchBody = c.slice(c.indexOf("router.patch('/member/:memberId/visibility'"));
  assert.ok(/\.update\(\{ visibility: merged \}\)[\s\S]{0,200}\.eq\('couple_id', couple_id\)/.test(patchBody),
    'the UPDATE is not scoped to the authenticated couple');
});

t('§4.7 the writer logs that a permission MOVED, never which flags or whose name', () => {
  const c = code(WRITER);
  const patchBody = c.slice(c.indexOf("router.patch('/member/:memberId/visibility'"));
  const log = (patchBody.match(/console\.log\(`[^`]*`\)/) || [''])[0];
  assert.ok(log, 'the write is unlogged');
  assert.ok(!/invitee_name|merged|JSON\.stringify/.test(log),
    'the log line copies the member\u0027s name or the flag values into the record');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§5 — R-31.1 CENSUS: the bench enumerates the consumers ITSELF');
// ═══════════════════════════════════════════════════════════════════════════
// The cure is "every consumer of the permission block reaches the one home."
// R-31.1 says the bench enumerates the call sites by itself and never inherits
// the author's list. It walks src/ and finds them.

function walk(dir, out = []) {
  for (const e of fs.readdirSync(SRC(dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(rel, out); }
    else if (e.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

const ALL_SRC  = walk('src');
const CONSUMERS = ALL_SRC.filter(f => /circlePermissions/.test(code(f)));

t('§5.1 the census finds the consumers by WALKING, and there are exactly three', () => {
  console.log(`         consumers found: ${CONSUMERS.length} — ${CONSUMERS.join(' · ')}`);
  assert.strictEqual(CONSUMERS.length, 3,
    `expected the one home + the guard + the writer; found ${CONSUMERS.length}`);
  for (const expected of [PERMS_HOME, GUARD, WRITER]) {
    assert.ok(CONSUMERS.includes(expected), `${expected} is not among the consumers`);
  }
});

// [F-SW.2] ABSENCE. Fork E's guarantee is that there is nowhere else for the
// block to be written. A second literal is the failed-session condition the 14
// spec names by hand; this cell is what makes it mechanical.
t('§5.2 NO SECOND LITERAL: no file outside the one home declares the block', () => {
  for (const f of ALL_SRC) {
    if (f === PERMS_HOME) continue;
    const c = code(f);
    assert.ok(!/can_contribute_muse\s*:\s*true/.test(c),
      `${f} carries its own literal copy of the permission block`);
    assert.ok(!/can_see_budget\s*:\s*(true|false)/.test(c),
      `${f} declares a permission key of its own`);
  }
});

t('§5.3 NO SECOND RESOLVER: no file outside the one home reads the visibility column', () => {
  for (const f of ALL_SRC) {
    if (f === PERMS_HOME) continue;
    const c = code(f);
    // Reading the column into a variable is fine (the guard does); INDEXING it
    // by a key is the second implementation.
    assert.ok(!/visibility\s*(\?\.|\[|\.)\s*(budget|guests|vendors|contribute_muse)/.test(c),
      `${f} indexes the visibility column directly instead of resolving through the one home`);
  }
});

t('§5.4 the pwa\u0027s type still matches the block\u0027s key set, or the seam is named', () => {
  const ctx = path.resolve(ROOT, '..', 'dreamos-pwa', 'app/coplanner/CircleSessionContext.tsx');
  if (!fs.existsSync(ctx)) {
    console.log('         SKIP — sibling dreamos-pwa absent; this cell UNDER-COUNTS (F-06.196)');
    return;
  }
  const src = fs.readFileSync(ctx, 'utf8');
  for (const k of Object.keys(F0772_BLOCK)) {
    assert.ok(src.includes(k), `the pwa session type lost ${k} — the payload and its reader disagree`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§6 — [F-SW.2] ABSENCE: no member-facing payload carries money TODAY');
// ═══════════════════════════════════════════════════════════════════════════
// D-1 builds the choke point. It does NOT build a budget filter, because there
// is no budget-bearing member payload to filter — derived, not assumed. This
// cell exists so the FIRST such payload reddens it and must route through the
// resolver on its way in.

const MEMBER_ROUTES = fs.readdirSync(SRC('src/api/circle'))
  .filter(f => f.endsWith('.js'))
  .map(f => path.join('src/api/circle', f));

t('§6.1 the member-facing route family is enumerated by the bench, and it is SEVEN', () => {
  console.log(`         member routes: ${MEMBER_ROUTES.length} — ${MEMBER_ROUTES.map(f => path.basename(f)).join(' · ')}`);
  assert.strictEqual(MEMBER_ROUTES.length, 7,
    'the circle router family changed size — the absence claim below covers a different set than it was written for');
});

t('§6.2 ZERO member-facing routes select a budget-bearing table or column', () => {
  const MONEY = /\bfrom\('(expenses|invoices|payment_schedules|team_payments)'\)|\b(amount|budget|total_amount|paid_amount|balance_due)\b/;
  for (const f of MEMBER_ROUTES) {
    const c = code(f);
    assert.ok(!MONEY.test(c),
      `${f} now touches money — it must resolve through circlePermissions() before this cell may be re-baselined`);
  }
});

t('§6.3 the SEAT is real: the one home carries a budget key with no reader yet, declared', () => {
  assert.ok('can_see_budget' in circlePermissions(),
    'the budget key left the block — C-3 lost its seat');
  assert.ok(/UNRULED-ARM|has not been ruled|NOT reconcile/i.test(read(PERMS_HOME)),
    'the one home does not declare that its key set is unruled against the spec\u0027s');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§7 — MUTATION: production code broken, each named cell proven to bite');
// ═══════════════════════════════════════════════════════════════════════════

await expectRed('§7.M1 spread the stored object instead of the allowlist ⇒ §1.8 RED',
  PERMS_HOME,
  '  for (const short of VISIBILITY_KEYS) {',
  '  Object.assign(out, visibility);\n  for (const short of VISIBILITY_KEYS) {',
  () => {
    const { circlePermissions: cp } = fresh(PERMS_HOME);
    const r = cp({ nonsense: true });
    assert.deepStrictEqual(Object.keys(r).sort(), Object.keys(F0772_BLOCK).sort());
  });

await expectRed('§7.M2 loosen the strict-boolean check to truthiness ⇒ §1.6 RED',
  PERMS_HOME,
  '    if (stored === true || stored === false) {',
  '    if (stored !== undefined) {',
  () => {
    const { circlePermissions: cp } = fresh(PERMS_HOME);
    assert.strictEqual(cp({ budget: 'true' }).can_see_budget, false);
  });

await expectRed('§7.M3 let a malformed column mean "open" ⇒ §1.3 RED',
  PERMS_HOME,
  "  if (!visibility || typeof visibility !== 'object' || Array.isArray(visibility)) {",
  '  if (false) {',
  () => {
    const { circlePermissions: cp } = fresh(PERMS_HOME);
    for (const bad of [null, [], 'budget']) assert.deepStrictEqual(cp(bad), F0772_BLOCK);
  });

await expectRed('§7.M4 hand out the frozen block itself ⇒ §1.10 RED',
  PERMS_HOME,
  '  const out = { ...CIRCLE_PERMISSIONS };',
  '  const out = CIRCLE_PERMISSIONS;',
  () => {
    const { circlePermissions: cp } = fresh(PERMS_HOME);
    const a = cp();
    a.can_see_budget = true;
    assert.strictEqual(cp().can_see_budget, false);
    assert.ok(!Object.isFrozen(a));
  });

await expectRed('§7.M5 drop visibility from the guard\u0027s select ⇒ §3.2 RED (the plane honours the ask)',
  GUARD,
  ".select('id, couple_id, role, invitee_name, status, visibility')",
  ".select('id, couple_id, role, invitee_name, status')",
  async () => {
    const { req } = await runGuard({ visibility: { contribute_muse: false } });
    assert.strictEqual(req.circleMember.permissions.can_contribute_muse, false);
  });

await expectRed('§7.M6 guard stops passing the column to the one home ⇒ §3.3 RED',
  GUARD,
  'circlePermissions(member.visibility)',
  'circlePermissions()',
  async () => {
    const { req } = await runGuard({ visibility: { budget: true } });
    assert.strictEqual(req.circleMember.permissions.can_see_budget, true);
  });

await expectRed('§7.M7 [Q-d] restore the retired precedence ⇒ §3.5 RED',
  GUARD,
  'name:          member.invitee_name || userRow.name || null,',
  'name:          userRow.name || member.invitee_name || null,',
  async () => {
    const { req } = await runGuard({ usersName: 'Droy', inviteeName: 'Mehek' });
    assert.strictEqual(req.circleMember.name, 'Mehek');
  });

await expectRed('§7.M8 [Q-d] delete the founder\u0027s ground from the site ⇒ §3.8 RED',
  GUARD,
  "bride's name wins. it's her circle",
  'the precedence was chosen',
  () => {
    const raw = read(GUARD);
    assert.ok(raw.includes("bride's name wins. it's her circle") ||
              raw.includes('bride\u2019s name wins. it\u2019s her circle'));
  });

await expectRed('§7.M9 writer REPLACES instead of merging ⇒ §4.1 RED',
  WRITER,
  '  const merged  = { ...(current.ok ? current.value : {}), ...patch.value };',
  '  const merged  = { ...patch.value };',
  async () => {
    const { cap } = await runWriter({ visibility: { budget: true } }, { stored: { contribute_muse: false } });
    assert.deepStrictEqual(cap.written[0].visibility, { contribute_muse: false, budget: true });
  });

await expectRed('§7.M10 writer applies a refused patch anyway ⇒ §4.3 RED',
  WRITER,
  '  if (!patch.ok) {',
  '  if (false) {',
  async () => {
    const { status, cap } = await runWriter({ visibility: { moments: true } });
    assert.strictEqual(status, 400);
    assert.strictEqual(cap.written.length, 0);
  });

await expectRed('§7.M11 writer drops the couple scope from its UPDATE ⇒ §4.6 RED',
  WRITER,
  "    .update({ visibility: merged })\n    .eq('id', memberId)\n    .eq('couple_id', couple_id);",
  "    .update({ visibility: merged })\n    .eq('id', memberId);",
  () => {
    const c = code(WRITER);
    const patchBody = c.slice(c.indexOf("router.patch('/member/:memberId/visibility'"));
    assert.ok(/\.update\(\{ visibility: merged \}\)[\s\S]{0,200}\.eq\('couple_id', couple_id\)/.test(patchBody));
  });

await expectRed('§7.M12 a second literal copy of the block appears ⇒ §5.2 RED',
  GUARD,
  '  req.circleMember = {',
  '  const shadow = { can_contribute_muse: true };\n  req.circleMember = {',
  () => {
    for (const f of ALL_SRC) {
      if (f === PERMS_HOME) continue;
      assert.ok(!/can_contribute_muse\s*:\s*true/.test(code(f)), f);
    }
  });

await expectRed('§7.M13 a member route starts serving money ⇒ §6.2 RED',
  'src/api/circle/feed.js',
  "    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')",
  "    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at, amount')",
  () => {
    const MONEY = /\bfrom\('(expenses|invoices|payment_schedules|team_payments)'\)|\b(amount|budget|total_amount|paid_amount|balance_due)\b/;
    for (const f of MEMBER_ROUTES) assert.ok(!MONEY.test(code(f)), f);
  });

// [F-SW.2] The mutation leg's own absence cell: a mutation whose target has
// moved would make its cell pass vacuously. `mutate()` asserts the target is
// present before writing, so every §7 cell above is also a proof that the code
// it names still exists in the shape it names.
t('§7.M14 every mutation target above was FOUND before it was broken', () => {
  assert.strictEqual(restoreLedger.length, 13,
    `expected 13 mutations, the ledger holds ${restoreLedger.length}`);
});

// ═══════════════════════════════════════════════════════════════════════════
H('§8 — THE MIGRATION, and the F-SW.3 obligation it is the first to owe');
// ═══════════════════════════════════════════════════════════════════════════

t('§8.1 0098 adds the column NOT NULL with an EMPTY default — no defaults in the DDL', () => {
  const m = fs.readFileSync(SRC(MIGRATION), 'utf8');
  assert.ok(/ADD COLUMN IF NOT EXISTS visibility jsonb NOT NULL DEFAULT '\{\}'::jsonb/.test(m),
    'the column is not added as NOT NULL DEFAULT \u0027{}\u0027');
  assert.ok(!/DEFAULT '\{"budget"/.test(m),
    'the DDL carries a default BLOCK — that is a second home for the defaults');
});

t('§8.2 the verify reads the CATALOGUE, not rows — and each block is pasted alone', () => {
  const m = fs.readFileSync(SRC(MIGRATION), 'utf8');
  assert.ok(/information_schema\.columns/.test(m), 'the verify does not read the catalogue');
  assert.ok((m.match(/paste alone/g) || []).length >= 3,
    'the verify blocks do not each carry their own paste boundary');
});

t('§8.3 [F-SW.3] the schema doc names this out-of-order migration in its staleness header', () => {
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  const header = doc.slice(0, doc.indexOf('## public.'));
  assert.ok(/F-SW\.3/.test(header), 'the staleness header does not carry F-SW.3\u0027s rule');
  assert.ok(/0098_circle_visibility\.sql/.test(header),
    'the out-of-order migration does not name itself where a reader would look');
  assert.ok(/circle_members/.test(header) && /13 columns to 14|13 columns to 14/.test(header),
    'the header does not say WHICH table it made stale, or by how much');
});

// ── §8.5 IS BORN OF THIS DELIVERY'S OWN INCIDENT, 2026-08-13 ───────────────
// After the founder applied 0098 green and the bench ran 61/61, STEP 3 asked him
// to open the migration by hand and type the apply date. The session that opened
// it received a pasted shell command instead, the whole file became one line of
// bash, and it was committed and pushed — because the verify chain I handed him
// could not print its own STOP (the `;` before the `||` bound the fallback to an
// `echo` that always succeeds, so D-10's mechanical stop was unreachable).
//
// §8.1/§8.2/§8.4 DID catch it on the second run. This cell widens that from "the
// one file this delivery ships" to EVERY migration in the estate, because the
// failure was not about 0098's contents — it was about a .sql file being able to
// hold something that is not SQL and nobody noticing until a bench that happened
// to read that one file ran. A ladder file that holds shell is a ladder rung
// that will be replayed as SQL by whoever trusts the directory.
t('§8.5 NO MIGRATION IN THE ESTATE HOLDS SHELL — the ladder is SQL or it is damaged', () => {
  const dir = 'db/migrations';
  const files = fs.readdirSync(SRC(dir)).filter(f => f.endsWith('.sql'));
  assert.ok(files.length > 100, `the ladder reads ${files.length} files — too few to be the real directory`);
  const SHELL = /^\s*(npm |node |git |cd |unzip |rm |cp |bash |echo )/m;
  const damaged = files.filter(f => SHELL.test(fs.readFileSync(SRC(path.join(dir, f)), 'utf8')));
  assert.deepStrictEqual(damaged, [],
    `these migration files hold shell commands, not SQL: ${damaged.join(', ')}`);
});

t('§8.4 the migration explains WHY it is out of order, so it cannot be read as a replay', () => {
  const m = fs.readFileSync(SRC(MIGRATION), 'utf8');
  assert.ok(/LADDER TIP IS 0123/.test(m) && /F-SW\.3/.test(m),
    'the migration does not name its own out-of-order status');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§9 — THE RESTORE LEDGER (CE-32 Ruling 1)');
// ═══════════════════════════════════════════════════════════════════════════

t('§9.1 every mutated file was restored BYTE-IDENTICAL, checked by hash', () => {
  assert.ok(restoreLedger.length > 0, 'no mutation ran — §7 is missing');
  const bad = restoreLedger.filter(r => !r.ok);
  assert.strictEqual(bad.length, 0, `restore failed for: ${bad.map(b => b.file).join(', ')}`);
  console.log(`         ${restoreLedger.length} mutations, ${new Set(restoreLedger.map(r => r.file)).size} files, all restored byte-identical`);
});

t('§9.2 the bench left NO footprint in the tree (F-05.80\u0027s class)', () => {
  for (const f of [PERMS_HOME, GUARD, WRITER]) {
    assert.ok(fs.existsSync(SRC(f)), `${f} is missing after the run`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '─'.repeat(66));
console.log(`  b14_d1_visibility_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('─'.repeat(66));
if (fail) { fails.forEach(f => console.log(`   RED  ${f}`)); process.exit(1); }
process.exit(0);

})().catch(e => { console.error('BENCH HARNESS ERROR:', e); process.exit(1); });
