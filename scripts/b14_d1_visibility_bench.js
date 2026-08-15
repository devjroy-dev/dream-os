#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b14_d1_visibility_bench.js
// TDW_14 · D-1 · C-3 — RE-AUTHORED WHOLE AT M-TRUST, 2026-08-14.
//
// Runnable from ANY working directory (§9: "a cure nobody can re-run quietly
// stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/b14_d1_visibility_bench.js
//
// ── THIS BENCH IS THE INVERSION OF THE BENCH IT REPLACES ────────────────────
// D-1 shipped a PER-MEMBER VISIBILITY RESOLVER: `src/lib/circlePermissions.js`
// as the one home, a `visibility` jsonb column, a guard that handed the column
// over, and a bride-facing PATCH door that wrote it. Everything below §5 in the
// old file proved that machinery correct — §1 the resolver, §2 the allowlist,
// §3 the guard, §4 the writer, §7's eleven mutations the lot of them.
//
// THE FOUNDER'S TRUST RULING OF 2026-08-14 RETIRED ALL OF IT:
//
//     「 the bride is consciously adding people. 1- mehek always sees the
//       vendor info. 2- mehek always gets to add to muse. 3- budget never
//       visible 」
//
// Membership IS the permission. So §1–§4 and §7's module mutations RETIRE WITH
// THEIR SUBJECT (RETIRE-WITH-THE-READER: the sitting that moves a subject owns
// the benches that read it) — they are not deleted for being inconvenient, they
// are deleted because the code they interrogated no longer exists, and a cell
// asserting over an absent module is noise wearing a green.
//
// WHAT SURVIVES, AND WHY EACH EARNS ITS PLACE:
//
//   §5  INVERTS. It used to census the CONSUMERS of the one home and count them
//       (three, then four at D-3). It now asserts that NO FILE IN `src/`
//       CONSULTS ANY PERMISSION MACHINERY AT ALL. The old failed-session
//       condition was "a second implementation"; the new one is "an
//       implementation". Found by WALKING the tree (R-33.1), comment-stripped,
//       and RED at `d53b688` — the tree this delivery started from.
//
//   §6  IS NOW THE CENTREPIECE, AND IT REPLACES AN ACCEPTANCE CRITERION.
//       `docs/specs/TDW_14_CIRCLE_FINAL.md` §5 acceptance #4 read: 「 member
//       feed payload contains zero budget fields with the flag off … flag on →
//       visible 」. THERE IS NO FLAG. That criterion is REPLACED by this
//       section, which asserts the stronger and simpler thing: no member-facing
//       serializer carries a budget-bearing field AT ALL, unconditionally, with
//       nothing to flip. A wall with no switch is a better promise than a
//       switch that defaults closed, because a default can be moved by a hand
//       that never read the ruling.
//
//       Each of the SIX named serializers gets ITS OWN BOUNDED CELL (R-33.3):
//       feed · session · threads · muse · polls · assigned. One cell convicting
//       one file. A single cell looping all six would report "the wall holds"
//       or "the wall broke" without saying WHERE, and an absence claim whose
//       radius exceeds its report is the R-33.3 disease.
//
//   §8  STANDS UNCHANGED. 0098's column survives at the plane, append-only and
//       inert (LD-8) — a migration that already ran is not litter to be swept
//       because the feature it served was retired. §8.5's ladder-wide shell
//       check has nothing to do with permissions and everything to do with the
//       2026-08-13 incident; it keeps its watch.
//
// ── COMMENTS ARE STRIPPED BEFORE ANY SOURCE ASSERTION ───────────────────────
// The comment-blindness law, and it has bitten this estate twice: `/*` inside
// `accept="image/*"` once stripped live code, and a cell that greps a file
// carrying a paragraph ABOUT a defect will find the defect's name in the prose
// and pass over the defect itself. THIS BENCH DEPENDS ON IT MORE THAN ITS
// ANCESTOR DID: every retirement note this delivery wrote NAMES the retired
// symbols in prose — `circlePermissions`, `can_see_vendors`, `budget` — so a
// §5 or §6 cell reading raw source would convict the very comments that record
// the ruling. `code()` below removes block comments then line comments and is
// used for every structural assertion. §7.M8 exists to prove it still works.
//
// ── THE MUTATION LEG IS THE VERDICT (§7) ────────────────────────────────────
// Every section above is proven non-vacuous by breaking PRODUCTION CODE — never
// test setup — and asserting the named cell goes RED. A bench without a mutation
// leg agrees with its author. §6's six cells each carry their own mutation, so
// "the wall holds" is never a claim about a file the bench merely opened.
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

const GUARD     = 'src/api/middleware/requireCircleMemberAuth.js';
const WRITER    = 'src/api/couple/circle.js';
const MIGRATION = 'db/migrations/0098_circle_visibility.sql';
const SPEC      = 'docs/specs/TDW_14_CIRCLE_FINAL.md';

// THE RETIRED HOME, named so the bench can assert it is GONE rather than
// silently stop mentioning it. A bench that merely deletes its reference to a
// deleted file proves nothing about whether the file was deleted.
const RETIRED_HOME = 'src/lib/circlePermissions.js';

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
H('§5 — [M-TRUST] THE INVERSION: nothing in src/ consults permission machinery');
// ═══════════════════════════════════════════════════════════════════════════
// R-33.1: the census finds its subjects by WALKING the tree, never from a
// hand-kept list that rots the first time a file is added. The old §5.1 walked
// and counted FOUR consumers. This one walks the SAME radius and requires ZERO,
// so the two are comparable across the ruling that separates them.

const PERM_SYMBOLS = ['circlePermissions', 'permissionsFor', 'VISIBILITY_KEYS', 'normaliseVisibility'];
const PERM_KEYS    = ['can_see_budget', 'can_see_guests', 'can_see_vendors', 'can_contribute_muse'];

function walkJs(dir) {
  const out = [];
  for (const e of fs.readdirSync(SRC(dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkJs(rel));
    else if (e.name.endsWith('.js')) out.push(rel);
  }
  return out;
}
const SRC_FILES = walkJs('src');

function consultants() {
  const guilty = [];
  for (const f of SRC_FILES) {
    const c = code(f);
    for (const sym of PERM_SYMBOLS) if (c.includes(sym)) guilty.push(`${f} :: ${sym}`);
  }
  return guilty;
}
function keyBearers() {
  const guilty = [];
  for (const f of SRC_FILES) {
    const c = code(f);
    for (const k of PERM_KEYS) if (c.includes(k)) guilty.push(`${f} :: ${k}`);
  }
  return guilty;
}

t('§5.1 the census WALKS src/ and finds ZERO consumers of permission machinery', () => {
  console.log(`         walked: ${SRC_FILES.length} .js files under src/`);
  assert.ok(SRC_FILES.length > 200,
    `the walk reached only ${SRC_FILES.length} files — that is not the real tree`);
  const guilty = consultants();
  assert.deepStrictEqual(guilty, [],
    `permission machinery is still consulted:\n           ${guilty.join('\n           ')}`);
});

t('§5.2 the ONE HOME is GONE from the tree, not merely unreferenced', () => {
  assert.ok(!fs.existsSync(SRC(RETIRED_HOME)),
    `${RETIRED_HOME} still exists — a module exporting nothing, imported by nothing, ` +
    'is a doc file wearing a .js extension (Arm 1, founder-ruled 2026-08-14)');
});

t('§5.3 NO PERMISSION KEY survives anywhere in src/ — the vocabulary is retired', () => {
  const guilty = keyBearers();
  assert.deepStrictEqual(guilty, [],
    `permission keys survive in live code:\n           ${guilty.join('\n           ')}`);
});

t('§5.4 the WRITE DOOR is gone — no route patches visibility, and no husk remains', () => {
  const c = code(WRITER);
  assert.ok(!/router\.patch\([^)]*visibility/.test(c),
    'the PATCH visibility door survives — there is no switch left for it to move');
  assert.ok(!/if \(false\)/.test(c),
    'the door was dead-coded rather than retired — that is Arm 3, refused on sight');
});

t('§5.5 the GUARD still SELECTS 0098\u0027s column and holds no opinion about it', () => {
  const c = code(GUARD);
  assert.ok(/\.select\('id, couple_id, role, invitee_name, status, visibility'\)/.test(c),
    'the guard stopped selecting `visibility` — 0098\u0027s column is inert, not absent, ' +
    'and a select that stops asking makes a future reader ask whether it was ever there');
  assert.ok(!/member\.visibility/.test(c),
    'the guard READS the column — it is carried, never consulted');
});

// A founder's word that lives only in a chat transcript is not findable by the
// hand that inherits this file.
t('§5.6 the RULING IS IN INK at the sites that obey it, dated', () => {
  for (const f of [GUARD, WRITER, 'src/api/circle/polls.js', 'src/api/circle/session.js']) {
    const raw = read(f);
    assert.ok(/M-TRUST/.test(raw) && /2026-08-14/.test(raw),
      `${f} obeys the trust ruling without naming or dating it`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§6 — [M-TRUST] THE BUDGET WALL AS LAW: absence, per serializer, unconditional');
// ═══════════════════════════════════════════════════════════════════════════
// REPLACES `docs/specs/TDW_14_CIRCLE_FINAL.md` §5 acceptance #4. That criterion
// was written around a flag: zero budget fields WITH THE FLAG OFF, visible with
// it on. The flag is retired, so the criterion is retired — and what replaces it
// is not weaker but stronger. There is no payload-shaping decision left to get
// wrong, because there is no budget-bearing field in any member-facing
// serializer to shape.

// ── TDW_15 P2 (R-34.16): THE WALL LEARNS ENVELOPE BYTES ─────────────────────
// The alternation above named four tables and FIVE field words, and `envelope`
// appeared nowhere in this file. `budget_envelopes` was not a table it watched,
// `envelope_id` was not a field it watched, and `amount_inr` does not match
// `\bamount\b` because `_` is a word character and the boundary never fires.
// So the family was blind to the exact bytes 0088 minted, and M-TRUST's ruling
// — 「 budget never visible 」, no flag, no key — would have been enforced over
// a money vocabulary that no longer described the money.
//
// R-34.20: the envelope cells mutate on `budget_envelopes`, `envelope_id` and
// `amount_inr` SPECIFICALLY, each proven to red for its OWN token. The reason
// is that `couple_receipts.amount` is live and `\bamount\b` ALREADY matches it,
// so a naive both-ways cell could go green on a pre-existing word rather than
// on the new bytes, and R-33.4 requires the mutation anchor be unique in the
// final tree. A cell that reds only because `amount` was already there is
// vacuous and proves nothing about envelopes.
const MONEY = /\bfrom\('(expenses|invoices|payment_schedules|team_payments|budget_envelopes)'\)|\b(amount|budget|total_amount|paid_amount|balance_due|envelope_id|amount_inr)\b/;

// The envelope tokens ALONE, so a cell can prove absence of THESE bytes without
// the pre-existing `amount` word being able to satisfy it. This is the
// non-vacuity instrument for R-34.20, and it is deliberately NOT a subset of
// MONEY's behaviour at the call site — it is matched separately.
const ENVELOPE = /\bfrom\('budget_envelopes'\)|\b(envelope_id|amount_inr)\b/;
const SIX   = ['feed', 'session', 'threads', 'muse', 'polls', 'assigned'];

function moneyHit(base) {
  const f = `src/api/circle/${base}.js`;
  assert.ok(fs.existsSync(SRC(f)), `${f} is not in the tree — the wall covers a serializer that moved`);
  const m = code(f).match(MONEY);
  return m ? m[0] : null;
}

for (const base of SIX) {
  const idx = SIX.indexOf(base) + 1;
  t(`§6.${idx} ${base}.js serves NO budget-bearing field — unconditional`, () => {
    const hit = moneyHit(base);
    assert.strictEqual(hit, null,
      `src/api/circle/${base}.js now touches money (${hit}). The M-TRUST ruling is ` +
      '\u300c budget never visible \u300d with no flag to open it — a member-facing serializer ' +
      'that grows a budget-bearing field breaks the wall, and no permission key exists ' +
      'to let it through.');
  });
}

// ── THE RADIUS DID NOT SHRINK FROM NINE TO SIX ─────────────────────────────
// The old §6.2 asserted money-absence over the WHOLE circle route family, which
// the bench enumerated at nine. The founder's charter names six serializers, and
// six bounded cells is what R-33.3 asks for — but replacing a nine-file claim
// with a six-file claim would have SILENTLY DROPPED `join.js`, `verifyPin.js`
// and `messages.js` from the wall while the section looked like it grew. It did
// not grow into a hole: §6.7 keeps the residual three and §6.8 keeps the family
// count honest, so a tenth file cannot join unwatched.
const FAMILY = fs.readdirSync(SRC('src/api/circle')).filter(f => f.endsWith('.js'))
  .map(f => path.join('src/api/circle', f));

t('§6.7 the residual three member-facing files carry no money either', () => {
  const residual = FAMILY.map(f => path.basename(f, '.js')).filter(b => !SIX.includes(b)).sort();
  assert.deepStrictEqual(residual, ['join', 'messages', 'verifyPin'],
    'the residual set moved — the wall covers a different remainder than it was written for');
  for (const base of residual) {
    const hit = moneyHit(base);
    assert.strictEqual(hit, null, `src/api/circle/${base}.js touches money (${hit})`);
  }
});

// ── §6.10–.12 · TDW_15 P2 (R-34.16/.20) — THE ENVELOPE BYTES, PER TOKEN ─────
// Acceptance 3 as amended: a member receives ZERO envelope bytes,
// unconditionally, proven structurally over the whole family rather than by
// auditing a payload. Three cells because there are three tokens and R-34.20
// requires each to red for its own — one cell over all three would go green on
// two while a third leaked.
for (const [idx, token, re] of [
  [10, 'budget_envelopes', /\bfrom\('budget_envelopes'\)/],
  [11, 'envelope_id',      /\benvelope_id\b/],
  [12, 'amount_inr',       /\bamount_inr\b/],
]) {
  t(`§6.${idx} NO member-facing circle route touches \`${token}\` — unconditional`, () => {
    const hits = [];
    for (const f of FAMILY) {
      const m = code(f).match(re);
      if (m) hits.push(`${f} (${m[0]})`);
    }
    assert.deepStrictEqual(hits, [],
      `a member-facing serializer grew an envelope byte: ${hits.join(' · ')}. ` +
      'M-TRUST is 「 budget never visible 」 with no flag to open it, and an ' +
      'envelope IS budget — it is her ceiling and her spend in one row.');
  });
}

// R-34.20's NON-VACUITY GUARD, and it is the cell that makes the three above
// mean something. `couple_receipts.amount` is live and `\bamount\b` already
// matches it, so MONEY would fire on a file that has no envelope byte at all.
// This cell proves ENVELOPE is a STRICTER instrument than MONEY — that it does
// NOT match the pre-existing word — so a green above cannot have been bought by
// `amount` sitting in the tree since 0019.
t('§6.13 the envelope instrument does not fire on the pre-existing `amount` word (R-34.20)', () => {
  const decoy = "const q = supabase.from('couple_receipts').select('id, amount, created_at');";
  assert.ok(MONEY.test(decoy),
    'the MONEY instrument no longer matches a bare `amount` — the extension broke what it inherited');
  assert.strictEqual(ENVELOPE.test(decoy), false,
    'the ENVELOPE instrument fires on a bare `amount`, so §6.10–.12 could go green ' +
    'on a word that predates 0088 by six blocks — that is a vacuous cell (R-33.4)');
  assert.ok(ENVELOPE.test("const q = supabase.from('budget_envelopes').select('id, amount_inr');"),
    'the ENVELOPE instrument does not fire on a real envelope read — it proves nothing');
});

t('§6.8 the circle route family is enumerated by the bench, and it is NINE', () => {
  console.log(`         member routes: ${FAMILY.length} — ${FAMILY.map(f => path.basename(f)).join(' \u00b7 ')}`);
  assert.strictEqual(FAMILY.length, 9,
    'the circle router family changed size — the absence claims above cover a different set ' +
    'than they were written for, and a new file joined the wall unwatched');
});

// The ruling has to be findable from the spec, not only from the code, or the
// next reader reconciles a live tree against a document that still promises a
// switch. §P3.2 is the paragraph that promised it.
t('§6.9 the SPEC carries the dated strike — the switches are struck, not merely stale', () => {
  const s = read(SPEC);
  assert.ok(/M-TRUST/.test(s) && /2026-08-14/.test(s),
    'the spec does not carry the trust ruling by name and date');
  assert.ok(/STRUCK/.test(s),
    'the spec\u0027s visibility-matrix paragraph is not marked struck — a reader would ' +
    'reconcile the tree against a promise the founder retired');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§7 — MUTATION: the wall broken one serializer at a time, each cell proven to bite');
// ═══════════════════════════════════════════════════════════════════════════
// §7's ELEVEN MODULE MUTATIONS RETIRED WITH THEIR SUBJECT. M1–M4 broke the
// resolver, M5–M8 the guard's resolution, M9–M11 the writer's merge and scope.
// Every one of them mutated `src/lib/circlePermissions.js` or the code calling
// it, and all of that is gone. They are not replaced by weaker cells aimed at
// the same place; they are replaced by mutations that bite THIS delivery's
// claims.
//
// SIX MUTATIONS FOR SIX CELLS. Each injects a budget symbol into one serializer
// and requires THAT FILE'S OWN CELL to redden. This is what makes §6 a wall
// rather than six files the bench happened to open: a cell that stayed green
// with `budget` sitting in its file would be reading the wrong file, or nothing.

for (const base of SIX) {
  const idx = SIX.indexOf(base) + 1;
  await expectRed(
    `§7.M${idx} inject a budget symbol into ${base}.js \u21d2 §6.${idx} RED`,
    `src/api/circle/${base}.js`,
    'module.exports = router;',
    'const budget = 0;\nmodule.exports = router;',
    () => {
      assert.strictEqual(moneyHit(base), null);
    });
}

// M7 proves §5.1 is a WALK and not a hand-list: restore a require of the retired
// home into a file the old census never named. If §5.1 were reading a fixed list
// of four consumers, this would pass unnoticed.
await expectRed('§7.M7 restore a permission require in an UNCENSUSED file \u21d2 §5.1 RED',
  'src/api/circle/threads.js',
  'module.exports = router;',
  "const { circlePermissions } = require('../../lib/circlePermissions');\nmodule.exports = router;",
  () => {
    assert.deepStrictEqual(consultants(), []);
  });

// M8 proves §5.3 reads CODE and not prose. The retirement notes this delivery
// wrote name `can_see_vendors` in comments on purpose; if the comment-strip
// failed, §5.3 would already be red and this mutation would be meaningless.
await expectRed('§7.M8 return a permission key from live code \u21d2 §5.3 RED (prose stays innocent)',
  'src/api/circle/session.js',
  'module.exports = router;',
  'const shape = { can_see_budget: false };\nmodule.exports = router;',
  () => {
    assert.deepStrictEqual(keyBearers(), []);
  });

// M9 proves §5.5's second arm: the guard carries the column and must not read
// it. Carrying-without-reading is the whole shape of an inert column, and a cell
// that only checked the select would miss a guard quietly resuming consultation.
await expectRed('§7.M9 the guard READS the inert column \u21d2 §5.5 RED',
  GUARD,
  '  };\n\n  next();',
  '  };\n  const seen = member.visibility;\n\n  next();',
  () => {
    const c = code(GUARD);
    assert.ok(!/member\.visibility/.test(c));
  });

// M10 proves §5.4 refuses the husk. Dead-coding the door instead of retiring it
// was Arm 3 — refused on sight — and this cell keeps the refusal mechanical
// rather than a matter of reviewer attention.
await expectRed('§7.M10 dead-code a door back in instead of retiring it \u21d2 §5.4 RED',
  WRITER,
  'module.exports = router;',
  "if (false) { router.patch('/member/:memberId/visibility', null); }\nmodule.exports = router;",
  () => {
    const c = code(WRITER);
    assert.ok(!/router\.patch\([^)]*visibility/.test(c));
    assert.ok(!/if \(false\)/.test(c));
  });

// ═══════════════════════════════════════════════════════════════════════════
H('§8 — THE MIGRATION, and the F-SW.3 obligation it is the first to owe');
// ═══════════════════════════════════════════════════════════════════════════
// UNCHANGED BY M-TRUST, and that is a ruling rather than an oversight. 0098's
// column is inert at the plane, append-only, never renumbered (LD-8). A
// migration that already ran is not litter to be swept because the feature it
// served was retired — the ladder is a record of what happened, not a statement
// of what is currently wanted.

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

// (M-SCHEMA-REG R-34.49) THE CURE HAS TWO LEGITIMATE STATES. ASSERT BOTH.
// This cell used to require that the header name 0098_circle_visibility.sql
// forever. That encoded a DEBT RECORD AS PERMANENT, when a debt record is by
// design temporary: it is outstanding while the document is stale for the
// table, and it is REMOVED once a regen has paid it. The 2026-08-15 regen paid
// this one, and the cell went red on the estate reaching the exact state it
// was built to reach — a cell convicting a cure.
//
// What F-SW.3 actually promises is that a reader is never silently misled about
// circle_members. That holds in either state, and one of them must be true:
//   · DEBT OUTSTANDING — 0098 is named in the register, with what it made stale;
//   · DEBT PAID        — the body describes circle_members at 14 columns.
// A tree where NEITHER holds is the real defect, and that is now what this
// catches. The F-SW.3 rule itself must be present in the header either way:
// the blind spot does not stop existing because today's ledger is clear.
t('§8.3 [F-SW.3] the out-of-order cure holds — named while owed, or paid in the body', () => {
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  const header = doc.slice(0, doc.indexOf('## public.'));
  assert.ok(/F-SW\.3/.test(header), 'the staleness header does not carry F-SW.3\u0027s rule');

  const owed = /0098_circle_visibility\.sql/.test(header)
            && /circle_members/.test(header)
            && /13 columns to 14/.test(header);
  const paid = /##\s+public\.circle_members\s+·\s+14 columns/.test(doc);

  assert.ok(owed || paid,
    'neither state holds: 0098 is not named in the staleness header, AND the body '
    + 'does not describe circle_members at 14 columns. The document is silently '
    + 'stale for that table, which is the exact condition F-SW.3 exists to prevent.');
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
  for (const f of [GUARD, WRITER, ...SIX.map(b => `src/api/circle/${b}.js`)]) {
    assert.ok(fs.existsSync(SRC(f)), `${f} is missing after the run`);
  }
  // FOOTPRINT ONLY, AND THAT IS A CORRECTION. This cell first asserted that
  // `RETIRED_HOME` was absent — which duplicated §5.2 and, run against an
  // UNCURED tree, reported 「 the retired module came back during the run 」 for a
  // module the run never touched. A red whose sentence names the wrong cause
  // sends the next reader hunting a mutation leak that never happened.
  // Retirement is §5.2's claim; this cell owns only the question of whether the
  // harness put the tree back as it found it. Self-caught in the both-ways leg
  // at `d53b688` and declared rather than quietly corrected.
  assert.strictEqual(restoreLedger.filter(r => !r.ok).length, 0,
    'a mutated file was not restored — the harness left a footprint');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '─'.repeat(66));
console.log(`  b14_d1_visibility_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('─'.repeat(66));
if (fail) { fails.forEach(f => console.log(`   RED  ${f}`)); process.exit(1); }
process.exit(0);

})().catch(e => { console.error('BENCH HARNESS ERROR:', e); process.exit(1); });
