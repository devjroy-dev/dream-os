#!/usr/bin/env node
'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// scripts/bOB_taxonomy_bench.js
// ARC OB · THE TAXONOMY CHARTER — the eleven, and everything that reads them.
//
// NOTHING UNDER TEST IS STUBBED. Every cell runs the REAL resolvers out of
// src/, and the CHECK cells READ THE MIGRATION FILE OFF DISK rather than trust a
// comment — the whole arc exists because a comment said "not a DB constraint"
// and a CHECK said otherwise for three months.
//
// R-31.1: THE BENCH ENUMERATES ITS CONSUMERS ITSELF. Section 6 walks the source
// tree for anyone still holding a private copy of the taxonomy. It does not read
// a list of consumers I wrote down; a list I wrote down is the defect.
//
// ── BOTH-WAYS (production mutation, comments stripped) ──────────────────────
// Restore any of these and the named cells MUST red:
//   M1  categories.js: put the old 16 back            -> HARD THROW at require
//       time, exit 1, no cell reached (WITNESSED). The load-time alias invariant
//       in categoryFraming refuses to boot a tree whose alias targets are not in
//       the canonical list. Stronger than a red cell and worth knowing it is a
//       CRASH, not a verdict: `grep -c` on the output reads ZERO FAILURES. Read
//       the EXIT CODE, never the tally — this bench's own both-ways run nearly
//       banked a crash as a green.
//   M2  categoryFraming: `if (PRICE_DEPENDS_ON[c]) return c` back as the
//       membership pass, ladder above aliases         -> 2.2 2.3  (WITNESSED)
//   M2b as M2, plus a non-canonical cater target      -> 2.2 2.3 ONLY (WITNESSED
//       — 2.1 stayed GREEN: the re-keyed PRICE_DEPENDS_ON carries venue_catering,
//       so the copy table answered before the ladder could bite.)
//   M2c `git show HEAD:src/lib/vendor/categoryFraming.js` — the WHOLE uncured
//       file                                          -> 2.1 2.2 2.3 (WITNESSED:
//       normaliseCategory('venue_catering') === 'catering'; 2.2 lists all four
//       new tokens as non-idempotent.)
//   M3  occupancy: `venue: 1` back                    -> 3.2
//   M4  categoryProfiles: key `venue` back            -> 3.1 3.2
//   M5  collabItems: the literal 16 back              -> 4.1 4.2 6.1
//   M6  auth.js: the silent-drop `if (...includes)`   -> 5.1 5.2
//   M7  0123: delete the file / the new CHECK         -> 4.3 4.4
//   M8  change ANY byte of ANY vetoed string           -> the matching 7.x cell
//       (APPROVED-COPY-CARRIES-ITS-HASH: an edited comma is a fresh veto)
// Vacuous greens are worse than declared gaps; each cell above is named against
// the mutation that reddens it, not against the charter that asked for it.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  const good = cond === true;
  if (good) { pass++; console.log(`  \u2713 ${label}`); }
  else { fail++; fails.push(label); console.log(`  \u2717 ${label}${typeof cond === 'string' ? ` — ${cond}` : ''}`); }
}
function section(t) { console.log(`\n${t}`); }
function strip(src) {
  // comments stripped — a bench that can be satisfied by a comment is not a bench
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const ELEVEN = [
  'planning', 'designer', 'photography', 'makeup', 'hairstylist',
  'jewellery', 'decor', 'venue_catering', 'performer', 'content_creator', 'other',
];
const RETIRED = [
  'videography', 'mehendi', 'catering', 'venue',
  'music_dj', 'music_live', 'choreography', 'transport', 'invitations', 'attire',
];

const { VENDOR_CATEGORIES } = require(path.join(ROOT, 'src/agent/categories'));
const { normaliseCategory, CATEGORY_ALIASES } = require(path.join(ROOT, 'src/lib/vendor/categoryFraming'));
const { profileFor } = require(path.join(ROOT, 'src/lib/vendor/categoryProfiles'));
const { CATEGORY_CAPACITY, RULED_OFF } = require(path.join(ROOT, 'src/lib/vendor/occupancy'));
const OFFERING_OTHER = 'the work';
const { REQUIREMENT_TYPES, KIND_TO_REQUIREMENT, requirementForKind } = require(path.join(ROOT, 'src/lib/vendor/collabItems'));
const { CATEGORY_PRESET, resolvePreset } = require(path.join(ROOT, 'src/api/vendor/categoryPreset'));

// ═══ 1 · THE CANONICAL LIST ══════════════════════════════════════════════════
section('1. categories.js — the eleven (M1 reddens these)');
ok(VENDOR_CATEGORIES.length === 11 || `expected 11 tokens, found ${VENDOR_CATEGORIES.length}`,
   '1.1 VENDOR_CATEGORIES carries exactly eleven');
ok(ELEVEN.every(t => VENDOR_CATEGORIES.includes(t)) && VENDOR_CATEGORIES.every(t => ELEVEN.includes(t))
   || `set mismatch: ${VENDOR_CATEGORIES.join(',')}`,
   '1.2 the eleven are the founder\'s eleven, exactly — no extras, none missing');
ok(RETIRED.every(t => !VENDOR_CATEGORIES.includes(t))
   || `still present: ${RETIRED.filter(t => VENDOR_CATEGORIES.includes(t)).join(',')}`,
   '1.3 every retired token is gone from the canonical list');
ok(!('CATEGORY_ALIASES' in require(path.join(ROOT, 'src/agent/categories'))),
   '1.4 categories.js no longer exports an alias table (one home, fork 3)');

// ═══ 2 · THE STRUCTURAL CURE ═════════════════════════════════════════════════
section('2. normaliseCategory — exact-membership FIRST (M2 reddens 2.1/2.2)');

// ── 2.1 IS A REGRESSION PIN, AND THE HONEST NOTE ABOUT IT ───────────────────
// Before the cure normaliseCategory('venue_catering') returned 'catering' — the
// ladder's includes('cater') sat above its venue test. That is the specimen that
// produced the §0.2 stop. IT IS PINNED HERE, but the both-ways run showed it does
// NOT redden under M2 alone: once the ladder's cater arm points at
// `venue_catering` (a canonical token), ladder-first happens to give the right
// answer for this one input — and even M2b leaves it green, because the re-keyed
// PRICE_DEPENDS_ON answers first. ONLY THE FULL UNCURED FILE (M2c) reddens 2.1.
// The trap needed BOTH halves of the old shape; that is worth knowing before
// someone "simplifies" one half back. It is 2.2 that
// carries the class, and M2 reddens 2.2 — which is precisely the chair's ground
// for choosing the structural cure over the reorder, now witnessed rather than
// argued. 2.1 needs M2b to red. SAID OUT LOUD so nobody reads 2.1's green as
// proof of the membership pass; 2.2 is that proof.
//
// ⚠ WHAT M2 ACTUALLY EXPOSED, and it is the better finding (F-06.85's shape):
//   under the copy-table membership pass, `performer` normalised to 'other' —
//   because PRICE_DEPENDS_ON has no `performer` key, its bytes being HELD FOR
//   VETO. A COPY TABLE AS GATEKEEPER COUPLES A TOKEN'S EXISTENCE TO WHETHER ITS
//   MODEL-VOICED COPY HAS BEEN APPROVED YET. A token would blink into existence
//   the day the founder signed off a sentence. The membership pass severs that;
//   held copy now costs a generic caveat and nothing else.
ok(normaliseCategory('venue_catering') === 'venue_catering'
   || `THE CATER TRAP IS BACK: got '${normaliseCategory('venue_catering')}'`,
   '2.1 THE CATER TRAP: a canonical token is never eaten by a substring alias');
ok(VENDOR_CATEGORIES.every(t => normaliseCategory(t) === t)
   || `not idempotent: ${VENDOR_CATEGORIES.filter(t => normaliseCategory(t) !== t).join(',')}`,
   '2.2 EVERY canonical token normalises to itself — the class, not the specimen');
ok(strip(fs.readFileSync(path.join(ROOT, 'src/lib/vendor/categoryFraming.js'), 'utf8'))
     .includes('VENDOR_CATEGORIES.includes(c)'),
   '2.3 membership is decided against the IMPORTED list, not a copy table');

section('2b. the alias table — every retired token has a home');
for (const t of RETIRED) {
  const got = normaliseCategory(t);
  ok(VENDOR_CATEGORIES.includes(got) || `'${t}' -> '${got}', which is not canonical`,
     `2b.${t} '${t}' resolves into the eleven ('${got}')`);
}
ok(Object.entries(CATEGORY_ALIASES).every(([, v]) => VENDOR_CATEGORIES.includes(v))
   || `stray targets: ${Object.entries(CATEGORY_ALIASES).filter(([, v]) => !VENDOR_CATEGORIES.includes(v)).map(([k, v]) => `${k}->${v}`).join(',')}`,
   '2b.invariant EVERY alias target is a canonical token');
const TRADE_WORDS = {
  'dj': 'performer', 'anchor': 'performer', 'choreographer': 'performer',
  'ugc': 'content_creator', 'reels': 'content_creator',
  'hair stylist': 'hairstylist', 'caterer': 'venue_catering', 'banquet': 'venue_catering',
  'florist': 'decor', 'cinematographer': 'photography', 'henna': 'other',
  'venue & decor': 'decor', 'hair and makeup': 'makeup',
};
for (const [word, want] of Object.entries(TRADE_WORDS)) {
  ok(normaliseCategory(word) === want || `'${word}' -> '${normaliseCategory(word)}', wanted '${want}'`,
     `2b.trade '${word}' -> ${want}`);
}
// F-04.59's cure must survive the arc — the florist merge is older than this one.
ok(normaliseCategory('florist') === 'decor', '2b.F-04.59 the 2026-05-15 florist merge survives ARC OB');

// ═══ 3 · CAPACITY — the key pair that is one edit in two files ═══════════════
section('3. occupancy — CATEGORY_CAPACITY keys on profile.key (M3/M4)');
ok(profileFor('venue_catering').key === 'venue_catering'
   || `profileFor('venue_catering').key = '${profileFor('venue_catering').key}'`,
   '3.1 PROFILES re-keyed venue -> venue_catering');
ok(CATEGORY_CAPACITY.venue_catering === 1 && CATEGORY_CAPACITY.venue === undefined
   || `capacity map: ${JSON.stringify(CATEGORY_CAPACITY)}`,
   '3.2 venue_catering:1 present AND venue absent');
// The live path, not the table: a caterer must actually reach the 1.
ok(CATEGORY_CAPACITY[profileFor('catering').key] === 1,
   '3.3 a vendor stored as `catering` reaches venue_catering\'s 1/slot end to end');
ok(CATEGORY_CAPACITY[profileFor('videography').key] === 1,
   '3.4 the NAMED CONSEQUENCE: a videographer draws photography\'s single slot');
ok(RULED_OFF.has('planning') && RULED_OFF.has(normaliseCategory('Event Planner')),
   '3.5 RULED_OFF planning STANDS — Event Planner still inherits occupancy-off');
for (const t of ['hairstylist', 'performer', 'content_creator']) {
  ok(CATEGORY_CAPACITY[profileFor(t).key] === undefined,
     `3.6 ${t} is UNKEYED — unconstrained, as ruled`);
}

// ═══ 4 · THE COLLAB NAMESPACE + THE CHECK ════════════════════════════════════
section('4. collab — the copy dies, the CHECK moves (M5/M7)');
ok(REQUIREMENT_TYPES.length === 11 && REQUIREMENT_TYPES.every(t => VENDOR_CATEGORIES.includes(t))
   || `REQUIREMENT_TYPES = ${REQUIREMENT_TYPES.join(',')}`,
   '4.1 REQUIREMENT_TYPES IS the canonical list, not a second copy of it');
const kindTargets = Object.values(KIND_TO_REQUIREMENT).flat().filter(Boolean);
ok(kindTargets.every(t => VENDOR_CATEGORIES.includes(t))
   || `dead prefills: ${kindTargets.filter(t => !VENDOR_CATEGORIES.includes(t)).join(',')}`,
   '4.2 every KIND_TO_REQUIREMENT prefill points at a LIVE token');
ok(requirementForKind('recce') === 'venue_catering' && requirementForKind('social') === 'performer',
   '4.2b recce -> venue_catering, social -> performer (retired targets re-pointed)');

// THE CHECK, READ OFF DISK. Not a comment — the file.
const MIG = path.join(ROOT, 'db/migrations/0123_taxonomy_eleven.sql');
ok(fs.existsSync(MIG) || 'db/migrations/0123_taxonomy_eleven.sql is missing',
   '4.3 migration 0123 exists (the taxonomy IS a DB constraint)');
if (fs.existsSync(MIG)) {
  const sql = fs.readFileSync(MIG, 'utf8');
  const checks = sql.match(/CHECK \(requirement_type IN \(([\s\S]*?)\)\)/g) || [];
  ok(checks.length === 2 || `found ${checks.length} new CHECKs, expected 2 (both tables)`,
     '4.4 both CHECKs re-authored — collab_posts AND collab_post_items');
  const pinned = checks.every(c => {
    const toks = (c.match(/'([a-z_]+)'/g) || []).map(x => x.replace(/'/g, ''));
    return toks.length === 11 && ELEVEN.every(t => toks.includes(t));
  });
  ok(pinned || 'a CHECK does not carry exactly the eleven', '4.5 each CHECK pins exactly the eleven');
  ok(RETIRED.every(t => sql.includes(`'${t}'`)) || 'a retired token has no backfill arm',
     '4.6 all ten retired tokens carry a backfill arm (defensive, CE-32)');
  const iDrop = sql.indexOf('DROP CONSTRAINT'), iUpd = sql.indexOf('UPDATE public.collab_posts'), iAdd = sql.indexOf('ADD CONSTRAINT');
  ok(iDrop > -1 && iDrop < iUpd && iUpd < iAdd, '4.7 order holds: drop -> backfill -> add');
  ok(sql.includes('attire') && sql.includes("= 'designer'"), '4.8 F-OB.4 cured by construction (attire -> designer)');
}

// ═══ 5 · THE SIGNUP DOOR ═════════════════════════════════════════════════════
section('5. auth.js — F-OB.3, the door that ate categories (M6)');
const AUTH = strip(fs.readFileSync(path.join(ROOT, 'src/api/vendor/auth.js'), 'utf8'));
ok(!/const VENDOR_CATEGORIES = \[/.test(AUTH) || 'the shadow six is still declared in auth.js',
   '5.1 the private six is GONE — auth.js imports the one canonical list');
ok(AUTH.includes("require('../../agent/categories')") && AUTH.includes('normaliseCategory'),
   '5.2 the signup door normalises through the one home');
ok(AUTH.includes('category_refused') && /console\.(warn|error)\(.*provision.*category/i.test(AUTH)
   || 'no loud path for an unrecognised category',
   '5.3 an unrecognised category is REFUSED OUT LOUD and logged — never eaten');
ok(!AUTH.includes("'venue & decor'") || "auth.js still declares 'venue & decor'",
   '5.4 the phantom token is out of the door and into the alias table');
ok(normaliseCategory('venue & decor') === 'decor',
   '5.5 ...and still resolves, so no live signup path regresses');

// ═══ 6 · R-31.1 — THE BENCH ENUMERATES ITS OWN CONSUMERS ═════════════════════
section('6. R-31.1 — nobody else is holding a copy');
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (f.endsWith('.js') || f.endsWith('.ts')) out.push(f);
  }
  return out;
}
const CANON = path.join(ROOT, 'src/agent/categories.js');

// ── THE BRIDE NAMESPACE IS A DECLARED EXCLUSION, NOT A LOOSENED DETECTOR ─────
// This cell RED-ed on its first run and the enumerator was right: three files
// hold ['photographer','videographer','mua','designer','venue','caterer','decor',
// 'florist','music','planner','other'] — a SIXTH list, its own CHECK at
// 0019_bride_planner.sql:92 (couple_bookings.category), in TRADE-NOUN form.
// Derived before excluding it: NOTHING compares couple_bookings.category to
// vendors.category. There is no equality join, so the eleven cause it no harm —
// unlike collab, where the join was live and the consequence was a silent empty
// feed. It is the bride track (Block 09's lane), the charter scoped this sitting
// to the VENDOR taxonomy, and its tool-schema enums are prompt-adjacent (W-1).
// SO IT IS OUT OF SCOPE AND IT IS SAID OUT LOUD — filed, not fixed, not hidden.
// The exclusion is PINNED by 6.1b: widen the bride list, or point a booking's
// category at a vendor token, and this bench notices.
const BRIDE_NAMESPACE = ['photographer', 'videographer', 'mua', 'caterer', 'florist', 'music', 'planner'];
const isBrideNamespace = src => BRIDE_NAMESPACE.filter(t => new RegExp(`['"\`]${t}['"\`]`).test(src)).length >= 4;

const suspects = [];
for (const f of walk(path.join(ROOT, 'src'))) {
  if (f === CANON) continue;
  const src = strip(fs.readFileSync(f, 'utf8'));
  const hits = ELEVEN.concat(RETIRED).filter(t => new RegExp(`['"\`]${t}['"\`]`).test(src));
  const imports = /require\(['"][^'"]*categories['"]\)/.test(src)
               || /require\(['"][^'"]*collabItems['"]\)/.test(src)
               || /require\(['"][^'"]*categoryFraming['"]\)/.test(src);
  if (hits.length >= 3 && !imports && !isBrideNamespace(src)) suspects.push(`${path.relative(ROOT, f)} [${hits.join(',')}]`);
}
ok(suspects.length === 0 || `private taxonomy copies found: ${suspects.join(' | ')}`,
   '6.1 no VENDOR-side file outside the canonical home holds 3+ taxonomy tokens without importing it');

// 6.1b — the declared exclusion, pinned. If the bride list ever grows a vendor
// token or shrinks toward one, this reddens and the exclusion must be re-argued.
const BRIDE_ELEVEN = ['photographer', 'videographer', 'mua', 'designer', 'venue',
                      'caterer', 'decor', 'florist', 'music', 'planner', 'other'];
const brideMig = fs.readFileSync(path.join(ROOT, 'db/migrations/0019_bride_planner.sql'), 'utf8');
const brideCheck = (brideMig.match(/check \(category in \(([\s\S]*?)\)\)/i) || [])[1] || '';
const brideToks = (brideCheck.match(/'([a-z_]+)'/g) || []).map(x => x.replace(/'/g, ''));
ok(brideToks.length === BRIDE_ELEVEN.length && BRIDE_ELEVEN.every(t => brideToks.includes(t))
   || `bride namespace changed: ${brideToks.join(',')}`,
   '6.1b DECLARED EXCLUSION PINNED: couple_bookings.category is unchanged and still separate');
ok(!brideToks.includes('venue_catering') && !brideToks.includes('content_creator')
   && !brideToks.includes('hairstylist') && !brideToks.includes('performer'),
   '6.1c ...and no vendor token has leaked into it (if one does, the two lists have joined)');

ok(Object.keys(CATEGORY_PRESET).every(k => VENDOR_CATEGORIES.includes(k))
   || `preset keys off-taxonomy: ${Object.keys(CATEGORY_PRESET).filter(k => !VENDOR_CATEGORIES.includes(k)).join(',')}`,
   '6.2 categoryPreset keys are canonical tokens only');
ok(resolvePreset('venue & decor') === 'venue_decorator' && resolvePreset('Photographer') === 'photographer',
   '6.3 resolvePreset normalises first — the Codex survives the merge and the casing');
ok(resolvePreset('venue_catering') === 'venue_decorator',
   '6.4 a merged venue/caterer still reaches The Setting');

// ═══ 7 · APPROVED-COPY-CARRIES-ITS-HASH ═════════════════════════════════════
// The seven strings the founder vetoed 2026-08-12 (「 A as written · B② 」),
// PINNED AT THE BYTE. Not paraphrased, not described — the literal is the cell.
// An edited comma is a fresh veto, and this section is what makes that true
// rather than merely stated. `framingFor` and `offeringNoun` are called for
// real so the pin covers the SENTENCE THE COUPLE HEARS, not just a table entry
// a caller might never reach.
//
// BOTH-WAYS (M8): change ANY byte of ANY string below -> the matching cell reds.
section('7. the vetoed bytes — frozen (M8 reddens per-string)');
const FROZEN_CAVEAT = {
  hairstylist:     'the number of people and functions, and whether trials are included',
  performer:       'the number of events and the hours of performance',
  content_creator: 'the number of events, the deliverables, and the turnaround you need',
  venue_catering:  'the dates, the number of guests, and what you need served or set up',
};
const FROZEN_NOUN = {
  hairstylist:     'the hair',
  performer:       'the performance',
  content_creator: 'the content',
};
const { framingFor, offeringNoun, PRICE_DEPENDS_ON } = require(path.join(ROOT, 'src/lib/vendor/categoryFraming'));

for (const [tok, want] of Object.entries(FROZEN_CAVEAT)) {
  ok(PRICE_DEPENDS_ON[tok] === want || `got ${JSON.stringify(PRICE_DEPENDS_ON[tok])}`,
     `7.caveat ${tok} — byte-frozen`);
  ok(framingFor(tok) === `though it depends on ${want}`
     || `sentence drifted: ${JSON.stringify(framingFor(tok))}`,
     `7.sentence ${tok} — the couple-facing clause carries the vetoed bytes`);
}
for (const [tok, want] of Object.entries(FROZEN_NOUN)) {
  ok(offeringNoun(tok) === want || `got ${JSON.stringify(offeringNoun(tok))}`,
     `7.noun ${tok} — byte-frozen`);
}
// The three A-tokens must no longer fall through to `other` — that fallback was
// the HELD posture and the veto discharged it. If one silently reverts, its
// caveat would still be a real sentence, just the WRONG one; hence this cell.
for (const tok of ['hairstylist', 'performer', 'content_creator']) {
  ok(PRICE_DEPENDS_ON[tok] !== PRICE_DEPENDS_ON.other && offeringNoun(tok) !== OFFERING_OTHER,
     `7.discharged ${tok} no longer falls back to \`other\``);
}
// B② is a WIDENING, not a re-key: the token still exists and the OLD venue bytes
// must be gone. Pinning the absence is what stops a "restore" from undoing it.
ok(PRICE_DEPENDS_ON.venue_catering.includes('served or set up')
   && !PRICE_DEPENDS_ON.venue_catering.includes('which spaces you need'),
   '7.B2 the caterer no longer hears venue-only words');
// Arm ③ was ruled AVAILABLE AND UNTAKEN. These bytes must NOT have moved.
const PROF = require(path.join(ROOT, 'src/lib/vendor/categoryProfiles')).PROFILES;
ok(PROF.venue_catering.label === 'venue'
   && offeringNoun('venue_catering') === 'the venue'
   && PROF.venue_catering.visitOriented === true
   && PROF.venue_catering.vocabulary === 'guests, dates, spaces, visit',
   '7.arm3 UNTAKEN — noun, label, visit logic and vocabulary byte-untouched');

// ═══ VERDICT ═════════════════════════════════════════════════════════════════
console.log(`\n${'='.repeat(70)}`);
console.log(`bOB_taxonomy_bench: ${pass} pass, ${fail} fail`);
if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  - ${f}`)); }
console.log(fail === 0 ? 'VERDICT: GREEN' : 'VERDICT: RED');
console.log('='.repeat(70));
process.exit(fail === 0 ? 0 : 1);
