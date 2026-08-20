#!/usr/bin/env node
// scripts/b05_f0578_namefill_bench.js
// BLOCK 05 · M-NAMEFILL · CE-35 · F-05.78 REOPENED-SCOPED AND CURED
//
// Run bare, and read the exit code as a second independent method alongside the
// verdict lines:   node scripts/b05_f0578_namefill_bench.js ; echo $?
//
// WHAT THIS BENCH IS FOR. `metaInputsFrom` on the bride lane hardcoded
// `profileName: null`, and behind it two correctly-guarded fill-when-null writers
// (brideInbound.js `if (profileName && !user.name)` and the same shape in
// brideIndex.js) had NEVER FIRED ONCE. The name was not merely dropped at the
// lane file: `normalizeMetaInbound` never read `value.contacts[]` at all, so the
// field never entered the process. This bench asserts the whole wire — adapter
// surface, seam, writer — plus the two things the cure must NOT do.
//
// BOTH-WAYS BY PRODUCTION MUTATION. Every cell drives a SHIPPED function or reads
// the production file's bytes; nothing here re-implements the cure. The mutation
// list at the foot names, per cell, the single edit to PRODUCTION SOURCE that
// reddens it. A cell nobody can redden is not a cell.
//
// NO DATABASE, NO NETWORK, NO CREDS. `profileNameFor` and `sanitizeProfileName`
// are pure; the writer path runs against a RECORDING in-memory supabase fake
// (the b05_m1b precedent) whose whole job is to capture the `users` update that
// the disease made unreachable.
//
// R-35.21 — THE PREMISE THIS BENCH DOES NOT PROVE. That Meta actually sends
// `contacts[].profile.name` on this lane is UNVERIFIED AT BUILD TIME: there is no
// captured production payload carrying a contacts block anywhere in this tree,
// and the fixtures below are this bench's own, not the wire's. The founder's walk
// is that premise's first witness. A walk where the fill does not land is the
// PREMISE failing, not this build — and the investigation then starts from the
// payload on glass rather than from belief.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const metaInbound  = require('../src/lib/metaInbound.js');
const brideInbound = require('../src/lib/brideInbound.js');
const webhookCore  = require('../src/lib/webhookCore.js');

const { processBrideInbound, metaInputsFrom } = brideInbound;
const { profileNameFor, sanitizeProfileName, PROFILE_NAME_CAP } = metaInbound;

let pass = 0, fail = 0;
async function t(id, name, fn) {
  try { await fn(); console.log(`  PASS  ${id}  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${id}  ${name}\n        — ${e && e.message}`); fail++; }
}

// ── fixtures ─────────────────────────────────────────────────────────────────
const PHONE_DIGITS = '919800000009';          // wa_id / msg.from shape (bare)
const PHONE_E164   = '+' + PHONE_DIGITS;      // users.phone shape
const OTHER_DIGITS = '919800000010';

// A Meta webhook body in its real nesting, with `contacts` sibling to `messages`
// — which is exactly why a per-message normalizer could not see it.
function metaBody(name, { waId = PHONE_DIGITS, from = PHONE_DIGITS, text = 'hi', contacts = undefined } = {}) {
  const value = {
    metadata: { phone_number_id: '1193630900506451' },
    messages: [{ from, id: 'wamid.TEST', type: 'text', timestamp: '1', text: { body: text } }],
  };
  if (contacts !== undefined) value.contacts = contacts;
  else if (name !== undefined) value.contacts = [{ profile: { name }, wa_id: waId }];
  return { object: 'whatsapp_business_account', entry: [{ id: 'E1', changes: [{ field: 'messages', value }] }] };
}

function msgOf(body) { return metaInbound.normalizeMetaInbound(body)[0]; }

// ── RECORDING supabase fake ──────────────────────────────────────────────────
// Faithful enough to reach the real branches (the b05_m1b shape), plus the one
// thing that bench never needed: it REMEMBERS the writes. `writes` is the whole
// evidentiary surface of §3 — the disease's signature is an empty `writes`.
function makeSupabase(perTable, writes) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b,
      gte: () => b, lte: () => b, limit: () => b,
      insert: (row) => { writes.push({ table, op: 'insert', row }); return b; },
      update: (row) => { writes.push({ table, op: 'update', row }); return b; },
      delete: () => b,
      maybeSingle: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      single:      () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (tb) => builder(tb), rpc: () => Promise.resolve({ data: null, error: null }) };
}

function makeDeps({ user, writes, sends = [] }) {
  return {
    supabase: makeSupabase({
      circle_members: () => ({ data: null, error: null }),
      users:          () => ({ data: user, error: null }),
      couples:        () => ({ data: { id: 'c1', user_id: 'u1', wedding_date: null }, error: null }),
      conversations:  () => ({ data: { id: 'conv1', couple_id: 'c1' }, error: null }),
      messages:       () => ({ data: null, error: null }),
    }, writes),
    anthropic: {},
    sendWhatsApp: async (phone, text, media) => { sends.push({ phone, text, media: media || [] }); return { sid: 'X' }; },
    webhookCore,
    runBrideAgenticTurn: async () => ({ reply: 'ok', mediaUrls: [], toolCalls: null, model: 'haiku', inputTokens: 1, outputTokens: 2, costUsd: 0, costInr: 0, circleSummary: null }),
    surfacePendingCircleSessions: async () => null,
    saveToMuse: async () => ({ ok: false, error: 'n/a' }),
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    handleSurpriseMe: async () => 'surprise',
    handleCircleMemberMessage: async () => {},
    buildCircleGreeting: () => 'greeting',
    extractMuseUrl: () => null,
    buildMediaContextNote: () => 'note',
    DEAD_END_REPLY: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in",
    CIRCLE_TOKEN_REGEX: /^CIRCLE-[A-Z0-9]{6}$/,
  };
}

// Drive the REAL lane end to end and hand back every write it attempted.
async function walk(body, user) {
  const writes = [];
  if (webhookCore._resetSidLru) webhookCore._resetSidLru();
  const msg = msgOf(body);
  await processBrideInbound(metaInputsFrom(msg, body, null), makeDeps({ user, writes }));
  return writes;
}
const nameWrites = (writes) =>
  writes.filter((w) => w.table === 'users' && w.op === 'update' && w.row && 'name' in w.row);

(async () => {
  console.log('\n=== §1 · THE ADAPTER SURFACE — R-35.18\'s sanity shape, one home ===');

  await t('1.1', 'the name is read off contacts[].profile.name at all (the whole disease)', () => {
    assert.strictEqual(profileNameFor(metaBody('Priya'), PHONE_DIGITS), 'Priya');
  });

  await t('1.2', 'TRIMMED — leading/trailing whitespace never reaches users.name', () => {
    assert.strictEqual(profileNameFor(metaBody('   Priya Sharma  '), PHONE_DIGITS), 'Priya Sharma');
  });

  // FOUND BY THE MUTATION RUN, NOT BY REVIEW. This cell first tested the reject
  // arm through `profileNameFor` alone — and deleting the arm from PRODUCTION
  // left it GREEN, because the pairing loop's own `if (name)` re-swallows the ''
  // and returns null anyway. The redundancy is legitimate defence in depth; a
  // cell that CANNOT SEE PAST IT is not. So the shipped sanitizer is driven
  // directly here, and the composed path is asserted beside it.
  await t('1.3', 'empty-after-trim is REJECTED to null at the sanitizer itself, not stored as a blank name', () => {
    assert.strictEqual(sanitizeProfileName('     '), null, 'a whitespace name survived the reject arm');
    assert.strictEqual(sanitizeProfileName(''), null);
    assert.strictEqual(sanitizeProfileName('\n\t '), null);
    assert.strictEqual(profileNameFor(metaBody('     '), PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(metaBody(''), PHONE_DIGITS), null);
  });

  await t('1.4', 'VERBATIM otherwise — emoji, script and punctuation survive intact', () => {
    assert.strictEqual(profileNameFor(metaBody('♥ Priya ♥'), PHONE_DIGITS), '♥ Priya ♥');
    assert.strictEqual(profileNameFor(metaBody('प्रिया'), PHONE_DIGITS), 'प्रिया');
    assert.strictEqual(profileNameFor(metaBody('A.K.'), PHONE_DIGITS), 'A.K.');
  });

  await t('1.5', `the cap is ${PROFILE_NAME_CAP}, matching users.name's one existing cap`, () => {
    assert.strictEqual(PROFILE_NAME_CAP, 80);
    const long = 'x'.repeat(200);
    assert.strictEqual(profileNameFor(metaBody(long), PHONE_DIGITS).length, 80);
    assert.ok(read('src/api/couple/onboarding.js').includes('.slice(0, 80)'),
      'the witnessed cap at onboarding.js:179 moved — the two caps have drifted');
  });

  await t('1.6', 'THE CAP IS CODE-POINT-SAFE — no lone surrogate, ever (R-35.18 emoji clause)', () => {
    const brides = '👰'.repeat(100);                       // 100 code points, 200 UTF-16 units
    const out = profileNameFor(metaBody(brides), PHONE_DIGITS);
    assert.strictEqual([...out].length, 80, 'cap must count code points, not UTF-16 units');
    assert.ok(!/[\uD800-\uDFFF]/.test(out.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')),
      'a lone surrogate survived the cut — this is the byte Postgres rejects');
    assert.strictEqual(Buffer.from(out, 'utf8').toString('utf8'), out, 'output is not valid UTF-8');
  });

  await t('1.7', 'a name of exactly one grapheme past the cap loses only that grapheme', () => {
    const s = 'न'.repeat(81);
    assert.strictEqual([...profileNameFor(metaBody(s), PHONE_DIGITS)].length, 80);
  });

  console.log('\n=== §2 · PAIRING — by wa_id, never positional ===');

  await t('2.1', 'a batched POST attributes each name to ITS OWN sender', () => {
    const body = metaBody(undefined, {
      contacts: [
        { profile: { name: 'Sarah' }, wa_id: OTHER_DIGITS },
        { profile: { name: 'Priya' }, wa_id: PHONE_DIGITS },
      ],
    });
    assert.strictEqual(profileNameFor(body, PHONE_DIGITS), 'Priya', 'positional read — one bride got another\'s name');
    assert.strictEqual(profileNameFor(body, OTHER_DIGITS), 'Sarah');
  });

  await t('2.2', 'a sender with no matching contact entry gets null, not a neighbour\'s name', () => {
    const body = metaBody(undefined, { contacts: [{ profile: { name: 'Sarah' }, wa_id: OTHER_DIGITS }] });
    assert.strictEqual(profileNameFor(body, PHONE_DIGITS), null);
  });

  await t('2.3', 'ABSENT / null / malformed contacts blocks all collapse to null, never throw', () => {
    assert.strictEqual(profileNameFor(metaBody(undefined), PHONE_DIGITS), null);      // no contacts key
    assert.strictEqual(profileNameFor(metaBody(undefined, { contacts: [] }), PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(metaBody(undefined, { contacts: [{ wa_id: PHONE_DIGITS }] }), PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(metaBody(undefined, { contacts: [{ profile: {}, wa_id: PHONE_DIGITS }] }), PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(metaBody(undefined, { contacts: [null] }), PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(metaBody(undefined, { contacts: 'nope' }), PHONE_DIGITS), null);
    // a NON-ITERABLE contacts value: the one shape that throws rather than
    // degrades if the Array.isArray guard is ever dropped. Added because the
    // mutation run proved the other five fixtures survive that deletion.
    assert.strictEqual(profileNameFor(metaBody(undefined, { contacts: {} }), PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor({}, PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(null, PHONE_DIGITS), null);
    assert.strictEqual(profileNameFor(metaBody('Priya'), null), null);
  });

  await t('2.4', 'a non-string profile.name is not coerced into a name', () => {
    for (const bad of [42, true, {}, [], null]) {
      assert.strictEqual(sanitizeProfileName(bad), null, `coerced ${JSON.stringify(bad)}`);
    }
  });

  console.log('\n=== §3 · THE SEAM — metaInputsFrom stops discarding her name ===');

  await t('3.1', 'THE CURE: the bride normalizer surfaces the wire name (was hardcoded null)', () => {
    const body = metaBody('Priya');
    assert.strictEqual(metaInputsFrom(msgOf(body), body, null).profileName, 'Priya');
  });

  await t('3.2', 'no contacts block -> profileName null, exactly the pre-cure value', () => {
    const body = metaBody(undefined);
    assert.strictEqual(metaInputsFrom(msgOf(body), body, null).profileName, null);
  });

  await t('3.3', 'the normalizer stays SYNCHRONOUS and keeps its three args (vendor precedent)', () => {
    const src = read('src/lib/brideInbound.js');
    assert.ok(/\nfunction metaInputsFrom\(msg, rawBody, resolvedMedia\) \{/.test(src),
      'metaInputsFrom went async or lost an argument');
  });

  await t('3.4', 'every OTHER normalized field is byte-unmoved by this cure', () => {
    const body = metaBody('Priya', { text: 'is my haldi on the calendar?' });
    const i = metaInputsFrom(msgOf(body), body, null);
    assert.strictEqual(i.phone, PHONE_E164);
    assert.strictEqual(i.body, 'is my haldi on the calendar?');
    assert.strictEqual(i.trimmedBody, 'is my haldi on the calendar?');
    assert.strictEqual(i.sidForPersist, 'wamid.TEST');
    assert.strictEqual(i.messageId, 'wamid.TEST');
    assert.strictEqual(i.hasMedia, false);
    assert.strictEqual(i.numMedia, 0);
    assert.strictEqual(i.mediaUrl, null);
    assert.strictEqual(i.mediaContentType, null);
    assert.strictEqual(i.mediaCaption, null);
    assert.strictEqual(i.internalReplay, false);
  });

  console.log('\n=== §4 · THE WRITER — the founder\'s walk, driven end to end ===');

  await t('4.1', 'A NAMELESS ROW FILLS: users.name written with the wire name', async () => {
    const w = nameWrites(await walk(metaBody('Priya'), { id: 'u1', phone: PHONE_E164, name: null }));
    assert.strictEqual(w.length, 1, `expected exactly one users.name write, got ${w.length}`);
    assert.strictEqual(w[0].row.name, 'Priya');
  });

  await t('4.2', 'the 22 reproduce: NULL name is what the guard covers (all 24 are NULL, censused 2026-08-20)', async () => {
    const w = nameWrites(await walk(metaBody('Priya'), { id: 'u1', phone: PHONE_E164, name: null }));
    assert.strictEqual(w.length, 1);
  });

  await t('4.3', 'A NAMED ROW IS UNTOUCHED — no users.name write is even attempted', async () => {
    const w = nameWrites(await walk(metaBody('Priya'), { id: 'u1', phone: PHONE_E164, name: 'Sarah' }));
    assert.strictEqual(w.length, 0, `fill-when-null clobbered a named row: ${JSON.stringify(w)}`);
  });

  await t('4.4', 'a named row is untouched even when the wire name is IDENTICAL (no idle write)', async () => {
    const w = nameWrites(await walk(metaBody('Sarah'), { id: 'u1', phone: PHONE_E164, name: 'Sarah' }));
    assert.strictEqual(w.length, 0, 'an identical name still produced a write — updated_at would move');
  });

  await t('4.5', 'AN ABSENT PROFILE BLOCK WRITES NOTHING to a nameless row (R-35.21 inert failure)', async () => {
    const w = nameWrites(await walk(metaBody(undefined), { id: 'u1', phone: PHONE_E164, name: null }));
    assert.strictEqual(w.length, 0, 'a null wire name reached the writer');
  });

  await t('4.6', 'a whitespace-only wire name writes nothing — a blank is not a name', async () => {
    const w = nameWrites(await walk(metaBody('    '), { id: 'u1', phone: PHONE_E164, name: null }));
    assert.strictEqual(w.length, 0, "users.name would have been set to '' ");
  });

  await t('4.7', 'the stored name is the wire name VERBATIM at the writer, not just at the adapter', async () => {
    const w = nameWrites(await walk(metaBody('♥ Priya ♥'), { id: 'u1', phone: PHONE_E164, name: null }));
    assert.strictEqual(w.length, 1);
    assert.strictEqual(w[0].row.name, '♥ Priya ♥');
  });

  console.log('\n=== §5 · R-OB.7 AS AMENDED — the member plane is unreachable from the wire ===');

  await t('5.1', 'the circle claim reads invitee_name ONLY (R-35.19, enforced in bytes)', () => {
    const s = read('src/lib/brideInbound.js');
    const i = s.indexOf('const safeName = (claim.invitee_name');
    assert.ok(i > 0, 'the safeName line moved');
    assert.strictEqual(s.slice(i, s.indexOf('\n', i)),
      "const safeName = (claim.invitee_name || '').slice(0, 120);");
  });

  await t('5.2', 'no wire name can enter the 120-cap path — the cap conflict is dissolved, not managed', () => {
    const s = read('src/lib/brideInbound.js');
    const i = s.indexOf('const safeName = (claim.invitee_name');
    assert.ok(!/profileName/.test(s.slice(i, s.indexOf('\n', i))));
  });

  await t('5.3', 'both live fill-writers are guarded fill-when-null (M-BRIDE-NAME precedent)', () => {
    for (const f of ['src/lib/brideInbound.js', 'src/brideIndex.js']) {
      const s = read(f);
      const hits = s.split('\n').filter((l) => /update\(\{ name: profileName \}\)/.test(l));
      assert.ok(hits.length > 0, `${f} lost its profileName fill-writer`);
      for (const h of hits) {
        const at = s.indexOf(h);
        assert.ok(/if \(profileName && !user\.name\) \{/.test(s.slice(Math.max(0, at - 200), at)),
          `${f}: a profileName write is not guarded fill-when-null`);
      }
    }
  });

  console.log('\n=== §6 · BLAST RADIUS — bride-only BY STRUCTURE, not by care ===');

  await t('6.1', 'the VENDOR normalizer still hardcodes null — F-05.81 stays latent', () => {
    const s = read('src/lib/vendorInbound.js');
    assert.ok(/\n\s*profileName:\s*null,/.test(s),
      'the vendor lane woke: its creation-time writers are unguarded and uncapped (F-05.81)');
  });

  await t('6.2', 'normalizeMetaInbound is byte-unchanged — the surface is ADDITIVE', () => {
    const s = read('src/lib/metaInbound.js');
    const fn = s.slice(s.indexOf('function normalizeMetaInbound(body) {'));
    const body = fn.slice(0, fn.indexOf('\n}\n') + 3);
    assert.ok(!/contacts|profile/.test(body),
      'the flat normalizer grew a contacts reader — every existing caller now moves');
    const m = metaInbound.normalizeMetaInbound(metaBody('Priya'))[0];
    assert.deepStrictEqual(Object.keys(m).sort(),
      ['from', 'media', 'messageId', 'text', 'timestamp', 'type'].sort(),
      'the flat message shape grew or lost a field');
  });

  await t('6.3', 'the sanity shape has ONE home — the lane file re-implements nothing', () => {
    const s = read('src/lib/brideInbound.js');
    const i = s.indexOf('profileName:      metaInbound.profileNameFor(');
    assert.ok(i > 0, 'the seam no longer calls the shared surface');
    const line = s.slice(i, s.indexOf('\n', i));
    assert.ok(!/trim\(|slice\(|\.\.\./.test(line),
      'the lane file grew a second home for trim/cap logic');
  });

  await t('6.4', 'the cure names its ruling in-comment at its own site (F-06.85 form)', () => {
    const b = read('src/lib/brideInbound.js');
    const i = b.indexOf('profileName:      metaInbound.profileNameFor(');
    const above = b.slice(Math.max(0, i - 2000), i);
    for (const token of ['F-05.78', 'R-35.19', 'R-35.21']) {
      assert.ok(above.includes(token), `${token} is not named at the seam`);
    }
    const m = read('src/lib/metaInbound.js');
    const j = m.indexOf('function profileNameFor(');
    const mAbove = m.slice(Math.max(0, j - 6000), j);
    for (const token of ['R-35.20', 'R-35.18', 'PUBLIC_SCHEMA.md:995', 'onboarding.js:179']) {
      assert.ok(mAbove.includes(token), `${token} is not named at the surface`);
    }
  });

  console.log('\n──────────────────────────────────────────────');
  console.log(`  total ${pass + fail} · ${pass} passed, ${fail} failed`);
  console.log(`  VERDICT: ${fail === 0 ? 'GREEN' : 'RED'}`);
  console.log('──────────────────────────────────────────────\n');
  process.exit(fail === 0 ? 0 : 1);
})();

// ── THE MUTATION LIST · both-ways, production source only ────────────────────
// Each line is ONE edit to the SHIPPED tree and the cells it reddens. EVERY RED
// BELOW WAS CLAIMED FROM THIS BENCH'S OWN OUTPUT, mutation by mutation, on
// 2026-08-20 — not predicted. All 29 cells redden under at least one mutation.
//
//  M1  metaInbound.js: `function profileNameFor(body, waId) {` -> insert
//      `return null;` as its first line          -> 1.1 1.2 1.4 1.5 1.6 1.7 2.1
//                                                   3.1 4.1 4.2 4.7
//  M2  sanitizeProfileName: `raw.trim()` -> `raw`             -> 1.2 1.3 4.6
//  M3  sanitizeProfileName: delete `if (!trimmed) return null;`      -> 1.3
//  M4  `const PROFILE_NAME_CAP = 80;` -> `120`                -> 1.5 1.6 1.7
//  M5  sanitizeProfileName: `[...trimmed].slice(0, CAP).join('')`
//      -> `trimmed.slice(0, PROFILE_NAME_CAP)`  (surrogate-splitting)  -> 1.6
//  M6  profileNameFor: replace the wa_id test with `if (!c) continue;`
//      (the positional read)                                      -> 2.1 2.2
//  M7  brideInbound.js: restore `profileName:      null,` at the seam
//                                                    -> 3.1 4.1 4.2 4.7 6.3
//  M8  brideInbound.js:470 `if (profileName && !user.name) {`
//      -> `if (profileName) {`   (fill-when-null becomes clobber) -> 4.3 4.4 5.3
//  M9  brideInbound.js: restore `(claim.invitee_name || profileName || '')`
//                                                                  -> 5.1 5.2
//  M10 vendorInbound.js: point its `profileName: null` at profileNameFor  -> 6.1
//  M11 brideInbound.js: append `.trim().slice(0, 80)` at the seam
//      (a second home for the sanity shape)                            -> 6.3
//  M12 normalizeMetaInbound: emit a `profileName` field (surface stops
//      being additive)                                                 -> 6.2
//  M13 delete `R-35.21` from the seam's own comment                    -> 6.4
//  M14 profileNameFor: `return null;` (the no-match tail) -> `return 'unknown';`
//                                              -> 1.3 2.2 2.3 3.2 4.5 4.6
//  M15 metaInputsFrom: drop the `resolvedMedia` parameter               -> 3.3
//  M16 metaInputsFrom: `trimmedBody` -> `trimmedBody.toUpperCase()`     -> 3.4
//  M17 profileNameFor: `Array.isArray(ch.value.contacts) ? ... : []`
//      -> `ch.value.contacts || []`                                     -> 2.3
//  M18 sanitizeProfileName: `typeof raw !== 'string'` guard -> `String(raw)`
//                                                                       -> 2.4
//
// TWO VACUITIES THIS RUN FOUND IN THIS BENCH, BOTH CURED ABOVE RATHER THAN
// REPORTED AS GREEN:
//   · 1.3 tested the empty-reject arm only through `profileNameFor`, whose own
//     `if (name)` re-swallows the '' — M3 left the cell GREEN over deleted
//     production code. It now drives `sanitizeProfileName` directly.
//   · 2.3's five malformed fixtures all survived M17, because a string or a
//     missing key degrades quietly where only a NON-ITERABLE throws. The
//     `contacts: {}` fixture is what makes the Array.isArray guard reddenable.
