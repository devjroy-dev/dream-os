#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b14_d5_copy_bench.js
// TDW_14 · D-5 · C-8 — THE MEMBER'S VOCABULARY, FROZEN AND CONSOLIDATED.
//
// Runnable from ANY working directory (§9). Paths resolve from __dirname.
//
//   node scripts/b14_d5_copy_bench.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ──────────
// D-5's server half is a CONSOLIDATION, not a feature. `src/api/circle/join.js`
// spoke 32 member-facing strings for nine conditions; it now speaks nine bytes
// from one home. So the cells below assert two different kinds of thing, and
// the distinction matters:
//
//   · THE BYTES ARE FROZEN AT THE CHARACTER (founder-ratified 2026-08-14).
//     §1 pins each one. A byte cannot drift without a cell reddening.
//   · THE HOMES ARE COUNTED. §2 and §3 assert that no raw member string
//     survives at any `fail()` site — the disease was five sentences for one
//     condition, and a bench that only pinned the bytes would go green over a
//     tree that had grown a sixth.
//
// ── R-33.2 · CELLS ASSERT THE RULING, NOT THE IMPLEMENTATION ────────────────
// §3 counts DISTINCT BYTES REACHING MEMBERS, not `COPY` keys and not call
// sites. Pinning the key names would redden on a rename that changed nothing a
// member reads, and pinning call-site counts would redden on a refactor that
// honoured the ruling. What the founder ratified is "one byte per condition",
// and that is the sentence §3 mechanises.
//
// ── COMMENT-STRIPPING ORDER, DELIBERATE AND DIVERGENT ───────────────────────
// `code()` strips LINE comments BEFORE block comments, per the estate's law.
// `scripts/b14_d3_polls_bench.js:38-40` does the reverse; that ordering is
// safe on its subject and unsafe here, because THIS file's subject contains
// commented-out code and prose about `/*`-shaped things. Named rather than
// copied, so the divergence reads as chosen.
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');
const sha  = (s) => crypto.createHash('sha256').update(s).digest('hex');

const code = (p) => read(p)
  .split('\n').filter(l => !l.trim().startsWith('//')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const JOIN = 'src/api/circle/join.js';

let pass = 0, fail = 0;
const ok = (label, cond, why) => {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else      { fail++; console.log(`  RED  ${label}${why ? ' — ' + why : ''}`); }
};
const sec = (t) => console.log(`\n${t}`);

// ═══════════════════════════════════════════════════════════════════════════
sec('§1 · THE NINE BYTES, FROZEN AT THE CHARACTER (founder, 2026-08-14)');

// Each entry is the sheet number and the byte EXACTLY as ratified. A single
// changed character reddens. These are the whole point of the delivery.
const FROZEN = [
  ['\u3256 LINK_INVALID',   "This invite link isn't valid — ask for a new one."],
  ['\u3257 ALREADY_JOINED', "You've already joined. Sign in with your PIN."],
  ['\u3258 NOT_ACTIVE',     'This invite is no longer active.'],
  ['\u3259 EXPIRED',        'This invite has expired — ask for a new one.'],
  ['\u325b CODE_STALE',     "That code's no longer good. Ask for a new one."],
  ['\u325c CODE_WRONG',     "That code isn't right."],
  ['\u325d CODE_UNSENT',    "We couldn't send your code. Try again."],
  ['\u325e OUR_FAULT',      'Something went wrong on our side. Try again.'],
  ['\u325f GENERIC',        'Something went wrong — try the link again.'],
];

const JOIN_CODE = code(JOIN);
FROZEN.forEach(([label, byte]) => {
  ok(`§1 ${label} frozen at the character`, JOIN_CODE.includes(byte),
    'the ratified byte is not in the source verbatim');
});

// \u325a — EXPECTED-ZERO. The founder's byte of 2026-08-02 already had one home
// and two callers; D-5 does not touch it, and this cell exists to prove that.
ok('§1.10 \u325a ONE_CIRCLE_REFUSAL unchanged from its 2026-08-02 veto',
  JOIN_CODE.includes(
    'This number is already helping plan another wedding. One number, one circle.'),
  'the one byte in this file D-5 was not permitted to touch has moved');

// ═══════════════════════════════════════════════════════════════════════════
sec('§2 · ONE HOME PER CONDITION — no raw member string survives at any door');

// THE DISEASE, MECHANISED. Before D-5 every `fail()` carried its own literal,
// which is how one condition acquired five wordings. Every refusal must now
// name a COPY member; a string literal at a fail() site is the disease
// returning, whatever it says.
const FAIL_SITES = JOIN_CODE.match(/fail\(res,\s*\d+,\s*[^)]*\)/g) || [];
ok('§2.1 every fail() site speaks through COPY or ONE_CIRCLE_REFUSAL',
  FAIL_SITES.length > 0 &&
  FAIL_SITES.every(s => /COPY\.[A-Z_]+/.test(s) || /ONE_CIRCLE_REFUSAL/.test(s)),
  'a raw literal is back at a door: ' +
    FAIL_SITES.filter(s => !/COPY\.|ONE_CIRCLE_REFUSAL/.test(s)).join(' | '));

ok('§2.2 the door count is non-trivial — the cell is measuring a real surface',
  FAIL_SITES.length >= 20,
  `only ${FAIL_SITES.length} fail() sites found; the census moved`);

// The retired engineer strings, by name. Each of these reached a member's glass
// before D-5 and must never return to one.
const RETIRED_FROM_GLASS = [
  'Code purpose mismatch.',
  'user_id is required.',
  'PIN must be exactly 4 digits.',
  'Not an active circle member.',
  'Couple not found.',
  'User not found.',
];
RETIRED_FROM_GLASS.forEach((s, i) => {
  const inFail = new RegExp(`fail\\(res,\\s*\\d+,\\s*['"\`]${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  ok(`§2.3.${i + 1} "${s}" never reaches a member again`,
    !inFail.test(JOIN_CODE),
    'an engineer string is back in a member-facing response');
});

// ═══════════════════════════════════════════════════════════════════════════
sec('§3 · THE RULING, NOT THE IMPLEMENTATION — one byte per condition');

// R-33.2. Counts DISTINCT BYTES a member can read, derived from the COPY object
// itself rather than from a hand-typed number, so a tenth condition arriving
// legitimately is a deliberate edit here and not a silent drift.
const COPY_BLOCK = (JOIN_CODE.match(/const COPY = \{[\s\S]*?\n\};/) || [''])[0];
const COPY_BYTES = (COPY_BLOCK.match(/:\s*(['"])(?:(?!\1).)*\1/g) || [])
  .map(s => s.replace(/^:\s*/, ''));
ok('§3.1 COPY declares exactly nine bytes',
  COPY_BYTES.length === 9, `declares ${COPY_BYTES.length}`);

ok('§3.2 no two conditions share a byte — nine distinct sentences',
  new Set(COPY_BYTES).size === 9,
  'two conditions collapsed into the same wording; a member cannot tell them apart');

// ═══════════════════════════════════════════════════════════════════════════
sec('§4 · \u325b IS REACHABLE — the derivation witnessed, not asserted in prose');

// The sheet claimed "Code purpose mismatch" was reachable, and that claim is
// what justified giving it a member-safe byte instead of retiring it to the
// unreachable class. The claim rests on ONE structural fact: `otp_sessions` is
// keyed on phone, so any other TDW code requested on the same number mid-join
// OVERWRITES her circle_join row. A prose sentence in a handover cannot be
// re-derived later; this cell reads the fact out of the source.
ok('§4.1 otp_sessions is upserted on a phone key — one row per number',
  /\.upsert\(\s*[\s\S]{0,400}?onConflict:\s*'phone'/.test(JOIN_CODE),
  'the phone key is gone; \u325b\'s reachability claim no longer holds and the '
  + 'byte should be re-priced, not silently kept');

ok('§4.2 the purpose guard still exists to be reached',
  /otpRow\.purpose !== 'circle_join'/.test(JOIN_CODE));

ok('§4.3 …and it speaks the member byte, not the engineer one',
  /otpRow\.purpose !== 'circle_join'[\s\S]{0,80}?COPY\.CODE_STALE/.test(JOIN_CODE));

// ═══════════════════════════════════════════════════════════════════════════
sec('§5 · THE UNREACHABLE CLASS — safe on glass, detailed in the log');

// \u325f's bargain: the member meets one honest sentence, the engineer keeps the
// detail. A cell that only checked the member half would go green over a class
// that had silently stopped logging anything at all.
const UNREACHABLE_SITES = [
  ['send-otp phone shape',  /phone failed E\.164 shape/],
  ['accept phone shape',    /\[circle\/join\/accept\] phone failed E\.164 shape/],
  ['accept otp length',     /otp length was/],
  ['set-pin missing id',    /called without user_id/],
  ['set-pin pin shape',     /pin failed 4-digit shape/],
  ['set-pin user absent',   /user row absent for id/],
  ['set-pin member absent', /no active member for phone/],
  ['set-pin couple absent', /couple absent for id/],
];
UNREACHABLE_SITES.forEach(([name, re], i) => {
  ok(`§5.${i + 1} ${name} — engineer detail survives in the log`,
    re.test(JOIN_CODE), 'the detail was deleted rather than relocated');
});

ok('§5.9 every unreachable-class door answers with \u325f',
  (JOIN_CODE.match(/COPY\.GENERIC/g) || []).length >= 8,
  'a door in the class is answering with something else');

// ═══════════════════════════════════════════════════════════════════════════
sec('§6 · BOTH WAYS — the cells redden on an uncured tree');

// R-33.4: the mutation targets CODE and each target is unique on the FINAL
// tree. A bench that cannot be made to fail has proven nothing, and this
// delivery's whole subject is text — the class of change most able to slip
// past a bench that merely reads a file and finds it non-empty.
const MUTATIONS = [
  // §1 — drift one frozen byte by a single character.
  ["That code isn't right.", "That code isnt right.", '§1 \u325c character drift'],
  // §2 — put a raw literal back at a door.
  // Targets are chosen for UNIQUENESS ON THE FINAL TREE, not for brevity. The
  // first cut of this bench used the bare `return fail(...)` line and its own
  // R-33.4 guard refused it — four occurrences, because the consolidation is
  // exactly what made those lines identical. The guard catching the bench's
  // own author is the guard working.
  ['if (!claim) return fail(res, 409, COPY.ALREADY_JOINED);',
   "if (!claim) return fail(res, 409, 'Already claimed. Please log in.');",
   '§2.1 raw literal returns to a door'],
  // §4 — remove the phone key \u325b's reachability rests on.
  // The bare key string also appears in the COPY block's own prose explaining
  // ㉛'s reachability, so the target carries its braces to stay unique.
  ["{ onConflict: 'phone' }", "{ onConflict: 'phone_id' }",
   '§4.1 the otp_sessions key moves'],
  // §5 — delete an engineer log line, keeping the member byte.
  ["console.error('[circle/join/set-pin] called without user_id');", '',
   '§5.4 engineer detail deleted rather than relocated'],
];

const original = read(JOIN);
const originalSha = sha(original);
let mutationsProven = 0;

MUTATIONS.forEach(([from, to, label]) => {
  const occurrences = original.split(from).length - 1;
  if (occurrences !== 1) {
    fail++;
    console.log(`  RED  §6 ${label} — target is not unique on the final tree `
      + `(${occurrences} occurrences); R-33.4 refuses an ambiguous mutation`);
    return;
  }
  try {
    fs.writeFileSync(SRC(JOIN), original.replace(from, to), 'utf8');
    const mutated = code(JOIN);
    // Re-run the specific claim this mutation is supposed to break.
    let stillGreen;
    if (label.startsWith('§1'))      stillGreen = mutated.includes("That code isn't right.");
    else if (label.startsWith('§2')) stillGreen = (mutated.match(/fail\(res,\s*\d+,\s*[^)]*\)/g) || [])
                                       .every(s => /COPY\.|ONE_CIRCLE_REFUSAL/.test(s));
    else if (label.startsWith('§4')) stillGreen = /onConflict:\s*'phone'/.test(mutated);
    else                             stillGreen = /called without user_id/.test(mutated);

    if (stillGreen) {
      fail++;
      console.log(`  RED  §6 ${label} — the cell stayed GREEN over the mutation; it is vacuous`);
    } else {
      mutationsProven++;
      console.log(`  ok   §6 ${label} — reddens on the uncured tree`);
      pass++;
    }
  } finally {
    // CE-32 Ruling 1 — every restore is sha256-verified. A bench that mutates
    // production source and cannot prove it put it back is the worse defect.
    fs.writeFileSync(SRC(JOIN), original, 'utf8');
    assert.strictEqual(sha(read(JOIN)), originalSha,
      'RESTORE FAILED — production source is left mutated. Do not commit.');
  }
});

ok('§6.5 all four mutations proven non-vacuous', mutationsProven === 4,
  `${mutationsProven} of 4`);
ok('§6.6 production source restored byte-identically',
  sha(read(JOIN)) === originalSha);

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${pass}/${pass + fail} cells green`);
process.exit(fail === 0 ? 0 : 1);
