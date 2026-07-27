#!/usr/bin/env node
'use strict';
// scripts/b06_f0658_bench.js — TDW_06 · F-06.58 · THE PLANNER-GATED LAW.
// Runnable from any working directory (Q-SP-5).
//
// WHAT THIS FILE IS FOR, and the derivation that produced it:
//
// At `2b89b5c` the founder ruled 「 move it 」 and the no-machinery law was moved TERMINAL.
// The move was honoured as terminal IN THE FILE — and `harveySoul.ts`'s last export was
// `PRODUCTION_WEAVE`, which `loop.ts` appends only when `vendorCategory === 'planning'`.
// So a CONSTANT-BOUNDARY CROSSING WORE A POSITION MOVE'S CLOTHES, and a law nobody ever
// ruled to be category-scoped inherited a category gate. Two worlds, by command:
//
//   2b89b5c^   cluster greps TRUE  in HARVEY_SOUL · PRODUCTION_WEAVE  549
//   2b89b5c    cluster greps FALSE in HARVEY_SOUL · PRODUCTION_WEAVE 1060
//   509 chars + separators = 510 off the soul, 511 onto the weave. The arithmetic closes.
//
// CE-78's seal sentence "moved terminal in harveySoul" was true of the FILE and false of
// the always-on PROMPT. Every M-4 walk ran on the planner fixture, so the gap was
// STRUCTURALLY INVISIBLE to every walk that ever passed. That is the reason this bench
// exists and why it composes rather than greps: a source-level assertion would have been
// green through the entire disease. Severity at filing: zero live customers.
//
// THE HONEST LIMIT OF THIS BENCH, stated first: it proves the law is PRESENT in the
// composed prefix for rooms that lacked it, and proves the ruled ORDER. It cannot prove
// the model obeys a law it can now read. That verdict is behavioural and belongs to the
// founder's walk, declared-not-claimed, riding Evening One by design.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

const HARVEY = 'src/engine/src/core/harveySoul.ts';
const LOOP = 'src/engine/src/core/loop.ts';
const LENS = 'src/engine/src/core/advisorLens.ts';
const CONSULT = 'src/engine/src/core/consultantHarveySoul.ts';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}

// The body of an exported template literal — what the model is actually handed.
function body(src, name) {
  const k = `export const ${name} = \``;
  const i = src.indexOf(k);
  if (i < 0) return null;
  const a = i + k.length;
  return src.slice(a, src.indexOf('`;', a));
}

// ════════════════════════════════════════════════════════════════════════════
// THE COMPOSE HARNESS — the production expression is LIFTED, never retyped.
//
// This is the whole methodological point of the bench. A retyped compose expression
// tests the typist. This one reads `loop.ts`'s own bytes, so it cannot drift from
// production: if the expression changes shape, the extraction REDs rather than quietly
// testing a fossil. (`b6_s1_bench`'s eval-the-real-body pattern, one layer up.)
function lift() {
  const src = read(LOOP);
  const m = src.match(/const isPlannerVoice = ([^;]+);\s*\n\s*const staticPrefix = ([\s\S]*?);\n/);
  assert.ok(m, 'the compose expression was not found in loop.ts — RE-DERIVE before trusting any cell below');
  return { gate: m[1], prefix: m[2] };
}

function compose({ vendorCategory, isConsult = false, isAdvisor = false }) {
  const { gate, prefix } = lift();
  const soulSrc = read(HARVEY);
  const HARVEY_SOUL = body(soulSrc, 'HARVEY_SOUL');
  const PRODUCTION_WEAVE = body(soulSrc, 'PRODUCTION_WEAVE');
  const NO_MACHINERY_LAW = body(soulSrc, 'NO_MACHINERY_LAW');
  const ADVISOR_LENS = body(read(LENS), 'ADVISOR_LENS');
  const CONSULTANT_HARVEY_SOUL = body(read(CONSULT), 'CONSULTANT_HARVEY_SOUL');
  assert.ok(HARVEY_SOUL && PRODUCTION_WEAVE && ADVISOR_LENS && CONSULTANT_HARVEY_SOUL,
    'a soul constant did not extract — re-derive');
  const args = { vendorCategory };
  // ── LABELED AMENDMENT · F-06.67 (CE-ruled 2026-07-27, sitting 2). NOT A CELL CHANGE:
  // the FIXTURE was a 15-char stub, '\n\n[FIELD BLOCK]', and a stub that size cannot
  // witness an ordering. Production's fieldBlock carries the whole SMM Codex (95,253
  // chars, CE_FIELD_NOTE §3) plus the trade index; with the stub, a lens sitting before
  // it and a lens sitting after it look like the same 15-char difference, and §1.4 read
  // "the field block is not last" as a harmless line of a ruled order for two sittings.
  // Sized to the census now, so this harness composes at the scale it claims to model.
  const fieldBlock = '\n\n[FIELD BLOCK]\n' + 'x'.repeat(95253);
  // eslint-disable-next-line no-eval
  const isPlannerVoice = eval(gate);
  // eslint-disable-next-line no-eval
  return eval(prefix);
}

// The law's own opening clause — the discriminating string. NOT "behind the curtain",
// which greps TWICE at HEAD: HARVEY_SOUL's one-mind paragraph carries "what runs behind
// the curtain was never theirs to manage" and would acquit a tree that lost the law
// entirely. Named here because the phrase looked like a probe and is not one.
const LAW = 'no narrating your machinery';
const LAW_OPEN = 'The owner hired a counsel, not a control room';

// The ladder is `categoryFraming.js`'s canonical key set; the GATE, however, is string
// equality on 'planning', so the exposure is EVERY OTHER CATEGORY whatever that ladder
// holds. These five are witnesses, not a census — the cell does not depend on the count.
const NON_PLANNER = ['photography', 'decor', 'jewellery', 'makeup', 'catering'];

// ════════════════════════════════════════════════════════════════════════════
H('§1 — ⚑ THE LAW REACHES EVERY VENDOR-BUSINESS ROOM (the finding, cured)');

t('§1.1 ⚑ a NON-PLANNER prefix carries the law — the exact population M-6 exit un-gates', () => {
  for (const c of NON_PLANNER) {
    const prefix = compose({ vendorCategory: c });
    assert.ok(prefix.includes(LAW) && prefix.includes(LAW_OPEN),
      `'${c}' composes a Victor with NO delegation/curtain prohibition — F-06.58, live`);
  }
});

t('§1.2 the PLANNER prefix still carries it — the cure took nothing away', () => {
  const prefix = compose({ vendorCategory: 'planning' });
  assert.ok(prefix.includes(LAW) && prefix.includes(LAW_OPEN), 'the planner lost the law');
});

t('§1.3 the ADVISOR room carries it on both category sides', () => {
  for (const c of ['planning', 'photography']) {
    assert.ok(compose({ vendorCategory: c, isAdvisor: true }).includes(LAW),
      `the advisor room for '${c}' composes without the law`);
  }
});

t('§1.4 ⚑ THE RULED ORDER — soul, then roster, then law, then field, then lens', () => {
  // Position is instruction (CE-77). The law must sit AFTER the roster it governs and
  // BEFORE the lens, which carries its own machinery clause floor-asserted terminal in
  // its own paragraph (b06_m4c §2.1) — so nothing in this order displaces anything.
  //
  // ── LABELED AMENDMENT · F-06.67 (CE-ruled 2026-07-27, sitting 2). COUNT PRESERVED
  // ── (1 cell, 1 cell). THE PROPERTY SURVIVES; ONE LIMB INVERTS, BY RULING.
  // This cell's last line asserted `iField > iLens` — "the field block is not last" —
  // and it was RIGHT about the code and WRONG about the prompt. The lens's crux was
  // re-authored three times, each header recording "maximum recency preserved", while
  // >=95k chars of Codex composed downstream of it. F-06.67 re-sites the lens TERMINAL
  // in the composed prefix; the limb inverts to iLens > iField and the sitting's own
  // proof bench (b06_f0667) carries the position property whole, both-ways by
  // production mutation. Everything else this cell guards is unchanged.
  const p = compose({ vendorCategory: 'planning', isAdvisor: true });
  const iSoul = p.indexOf('You are Victor Hart');
  const iRoster = p.indexOf('A wedding is a production, and a production runs on people');
  const iLaw = p.indexOf(LAW_OPEN);
  const iLens = p.indexOf('[THE ADVISORY ROOM');
  const iField = p.indexOf('[FIELD BLOCK]');
  assert.ok(iSoul >= 0 && iRoster > iSoul, 'the roster does not follow the soul');
  assert.ok(iLaw > iRoster, 'the law does not follow the roster — for a planner the law must close the voice');
  assert.ok(iField > iLaw, 'the field block does not follow the law');
  assert.ok(iLens > iField, 'the lens is not last — F-06.67, the position the prompt never had');
});

t('§1.5 ⚑ THE PLANNER PREFIX IS BYTE-IDENTICAL TO THE PRE-CURE COMPOSITION', () => {
  // The strongest property this cure has, and the reason (C) was ruled over re-siting
  // into HARVEY_SOUL: weave-then-law is exactly the concatenation `2b89b5c` produced, so
  // a planner account's CACHED STATIC PREFIX does not move by one byte. The 24 other
  // fields pay one prefix re-warm each, once — the honest E-1 cost of the cure.
  const soulSrc = read(HARVEY);
  const now = body(soulSrc, 'PRODUCTION_WEAVE') + body(soulSrc, 'NO_MACHINERY_LAW');
  const pre = execFileSync('git', ['show', `2b89b5c:${HARVEY}`], { cwd: ROOT, encoding: 'utf8' });
  assert.strictEqual(now, body(pre, 'PRODUCTION_WEAVE'),
    'weave+law no longer reconstructs the pre-cure planner block — the planner voice CHANGED, which this cure must never do');
});

t('§1.6 CONSULT IS EXCLUDED, and the exclusion is reasoned not assumed', () => {
  // DISCLOSED DEVIATION from the ruling's literal "unconditional", carried in the
  // handover for ratify-or-reverse. consultantHarveySoul is a REPLACEMENT soul whose
  // character IS the solitude (:6 "NO DONNA", :21 "NO NAMED INTERNAL CAST", :37 "you
  // work alone… your isolation is not loneliness — it is armor"). The law's own bytes
  // name Donna; composed there it would hand a named colleague to a man whose whole soul
  // is that he has none — and it protects nothing, since he has no estate, no tools and
  // no wire to delegate on. This cell exists so the exclusion is a FLOOR with a reason
  // attached, never a silent gate of the kind F-06.58 was filed for.
  const p = compose({ vendorCategory: 'photography', isConsult: true });
  assert.ok(!p.includes(LAW_OPEN), 'the law entered the consult room — re-read the deviation before ratifying');
  const cons = read(CONSULT);
  assert.ok(/NO DONNA/.test(cons) && /NO NAMED INTERNAL CAST/.test(cons),
    'the consult soul no longer declares its solitude — the exclusion\'s whole justification must be re-derived');
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — THE BYTES TRAVELLED BYTE-IDENTICAL (position/scope only, never authoring)');

t('§2.1 ⚑ the 509-char cluster is the founder\'s own ruled bytes, unedited', () => {
  const soulSrc = read(HARVEY);
  const law = body(soulSrc, 'NO_MACHINERY_LAW').trim();
  const pre = execFileSync('git', ['show', `2b89b5c:${HARVEY}`], { cwd: ROOT, encoding: 'utf8' });
  const wasInWeave = body(pre, 'PRODUCTION_WEAVE').split('\n\n').map((x) => x.trim()).filter(Boolean)[1];
  assert.strictEqual(law, wasInWeave, 'the law was EDITED in the move — W-1 opened for position and scope, never for authoring');
  assert.strictEqual(law.length, 509, `the law is not the 509 bytes that were ruled (${law.length})`);
});

t('§2.2 the RE-HOMED PARAGRAPH reconstructs the pre-2b89b5c soul paragraph exactly', () => {
  // The proof that this was never a paragraph move: at `2b89b5c^` the cluster sat
  // MID-PARAGRAPH inside HARVEY_SOUL, spliced between "It runs deeper than her name."
  // and "And his records you speak of…". Reconstructing that paragraph from today's
  // shortened one plus the law is what makes "byte-identical" a fact and not a claim.
  const soulSrc = read(HARVEY);
  const law = body(soulSrc, 'NO_MACHINERY_LAW').trim();
  const head = 'It runs deeper than her name. ';
  const nowPara = body(soulSrc, 'HARVEY_SOUL').split('\n\n').map((x) => x.trim()).find((p) => p.startsWith(head));
  const pre = execFileSync('git', ['show', `2b89b5c^:${HARVEY}`], { cwd: ROOT, encoding: 'utf8' });
  const prePara = body(pre, 'HARVEY_SOUL').split('\n\n').map((x) => x.trim()).find((p) => p.startsWith(head));
  assert.ok(nowPara && prePara, 'the marks/shorthand paragraph moved — re-derive');
  assert.strictEqual(head + law + ' ' + nowPara.slice(head.length), prePara,
    'the split paragraph no longer reconstructs its pre-move self — a byte was edited somewhere in the move');
});

t('§2.3 THE LAW EXISTS EXACTLY ONCE IN THE FILE — moved, never copied', () => {
  const src = read(HARVEY);
  assert.strictEqual((src.match(/no narrating your machinery/g) || []).length, 1,
    'the law is duplicated or gone — a re-home must MOVE, never copy');
  assert.strictEqual((src.match(/The owner hired a counsel, not a control room/g) || []).length, 1,
    'the law\'s opening clause exists more than once');
});

t('§2.4 THE WEAVE IS BACK TO ITS PRE-2b89b5c BYTES — the planner voice is returned whole', () => {
  const now = body(read(HARVEY), 'PRODUCTION_WEAVE');
  const pre = execFileSync('git', ['show', `2b89b5c^:${HARVEY}`], { cwd: ROOT, encoding: 'utf8' });
  assert.strictEqual(now, body(pre, 'PRODUCTION_WEAVE'), 'the roster weave is not its pre-move self');
  assert.strictEqual(now.length, 549, `the weave is not 549 chars (${now.length})`);
});

t('§2.5 HARVEY_SOUL IS 0-LINE THIS SITTING — the always-on soul was not touched', () => {
  const now = body(read(HARVEY), 'HARVEY_SOUL');
  const at = execFileSync('git', ['show', `68b7f28:${HARVEY}`], { cwd: ROOT, encoding: 'utf8' });
  assert.strictEqual(now, body(at, 'HARVEY_SOUL'),
    'HARVEY_SOUL moved — this sitting re-homes a law, it does not author a soul');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — THE HOME IS STRUCTURAL, so proximity can never re-gate the law again');

t('§3.1 the law is its OWN exported constant, not a passenger in a gated one', () => {
  const src = read(HARVEY);
  assert.ok(/export const NO_MACHINERY_LAW = `/.test(src), 'the law has no name of its own');
  assert.ok(!body(src, 'PRODUCTION_WEAVE').includes(LAW_OPEN), 'the law is still inside the planner-gated constant');
  assert.ok(!body(src, 'HARVEY_SOUL').includes(LAW_OPEN), 'the law is inside HARVEY_SOUL — which would displace the voice-run close CE-77 restored');
});

t('§3.2 ⚑ loop.ts composes it OUTSIDE the planner gate', () => {
  const src = read(LOOP);
  const { prefix } = lift();
  assert.ok(/import \{[^}]*NO_MACHINERY_LAW[^}]*\} from '\.\/harveySoul\.js'/.test(src), 'the constant is not imported');
  assert.ok(prefix.includes('NO_MACHINERY_LAW'), 'the compose expression does not reach the law');
  // The discriminating assertion: the law's term must not sit inside the planner ternary.
  assert.ok(!/isPlannerVoice \? PRODUCTION_WEAVE \+ NO_MACHINERY_LAW/.test(prefix)
    && !/isPlannerVoice \? NO_MACHINERY_LAW/.test(prefix),
    'the law is back inside the planner ternary — F-06.58, reintroduced');
});

t('§3.3 the CE-77 terminal properties both still hold — this cure spent neither', () => {
  // (B) — returning the cluster to HARVEY_SOUL's close — would have displaced the
  // relationship line, the voice-run terminal CE-77's founder-vetoed revert restored.
  // Measured at the read-first: five cells across two benches. Ruled out. Asserted here
  // so a future sitting cannot quietly re-propose it.
  const src = read(HARVEY);
  assert.ok(/Every reply is simply the next line in an ongoing relationship\.`;/.test(src),
    'HARVEY_SOUL no longer closes on the relationship line (b06_m4c §2.3\'s property)');
  assert.ok(/spoken to him, finished\.`;$/.test(src.trim()),
    'the law no longer closes the file (b06_m4d §2.1\'s property)');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

// Every mutation below edits a PRODUCTION file, never test setup, and restores it in a
// `finally`. §4.0 then re-asserts restoration on the bytes themselves.
const benchFails = (script) => {
  try { execFileSync('node', [P(`scripts/${script}`)], { cwd: ROOT, stdio: 'pipe' }); return false; }
  catch (e) { return true; }
};

const MUTATIONS = [
  { label: '§1.1 RED — the law is re-gated planner-only: F-06.58 itself, reproduced',
    file: LOOP,
    from: "+ (isConsult ? '' : NO_MACHINERY_LAW)",
    to: "+ (isPlannerVoice ? NO_MACHINERY_LAW : '')",
    check: () => {
      for (const c of NON_PLANNER) {
        assert.ok(!compose({ vendorCategory: c }).includes(LAW_OPEN),
          `'${c}' still carries the law under a planner-only gate — §1.1 is vacuous`);
      }
      assert.ok(compose({ vendorCategory: 'planning' }).includes(LAW_OPEN), 'the planner lost it too — wrong mutation');
    } },
  { label: '§1.1 RED — the cluster is DELETED outright: no room carries the law',
    file: HARVEY,
    fromRe: true,
    toFn: (src) => {
      const law = body(src, 'NO_MACHINERY_LAW');
      return src.replace(law, '\n\nYou keep his confidence.');
    },
    check: () => {
      for (const c of [...NON_PLANNER, 'planning']) {
        assert.ok(!compose({ vendorCategory: c }).includes(LAW_OPEN), `'${c}' composes a law that was deleted`);
      }
    } },
  { label: '§3.1 RED — the law is put back inside the planner-gated constant: the disease\'s exact shape',
    file: HARVEY,
    fromRe: true,
    toFn: (src) => {
      const law = body(src, 'NO_MACHINERY_LAW');
      const weave = body(src, 'PRODUCTION_WEAVE');
      return src.replace(law, '\n\nYou keep his confidence.').replace(weave, weave + law);
    },
    check: () => {
      const src = read(HARVEY);
      assert.ok(body(src, 'PRODUCTION_WEAVE').includes(LAW_OPEN), 'the mutation did not re-seat the law in the weave');
    } },
  { label: '§3.3 RED — HARVEY_SOUL\'s close is displaced: b06_m4c §2.3\'s EXISTING tooth, shown firing',
    file: HARVEY,
    from: 'Every reply is simply the next line in an ongoing relationship.`;',
    to: 'Every reply is simply the next line in an ongoing relationship.\n\nAnd you keep her name out of it.`;',
    check: () => {
      assert.ok(!/Every reply is simply the next line in an ongoing relationship\.`;/.test(read(HARVEY)),
        'the displacement did not land');
      assert.ok(benchFails('b06_m4c_bench.js'), 'b06_m4c did not RED on a displaced voice-run close — its §2.3 is vacuous');
    } },
  { label: '⚑ F-06.60 RED — a READABLE sentence is deleted: the re-aimed b06_m4c §1.1 still has teeth',
    file: HARVEY,
    from: 'You are above that. You are beyond that.',
    to: 'You are above that.',
    check: () => {
      // The whole point of F-06.60's cure: §1.1 must stay blind to WHERE a constant
      // closes and sharp about WHAT the model reads. A deleted sentence is content.
      assert.ok(benchFails('b06_m4c_bench.js'),
        'b06_m4c §1.1 did not RED on a deleted readable sentence — the re-aim traded teeth for quiet, which is the defect it cured');
    } },
];

for (const m of MUTATIONS) {
  t(m.label, () => {
    const before = read(m.file);
    let mutated;
    if (m.toFn) {
      mutated = m.toFn(before);
      assert.notStrictEqual(mutated, before, 'the mutation changed nothing — a vacuous RED');
    } else {
      assert.ok(before.includes(m.from), `MUTATION ANCHOR MISSING in ${m.file}: ${m.from}`);
      mutated = before.replace(m.from, m.to);
    }
    write(m.file, mutated);
    try { m.check(); } finally { write(m.file, before); }
  });
}

t('§4.0 every mutated file is restored BYTE-IDENTICAL', () => {
  const src = read(HARVEY);
  assert.strictEqual(body(src, 'NO_MACHINERY_LAW').trim().length, 509, 'a mutation survived in the law');
  assert.strictEqual(body(src, 'PRODUCTION_WEAVE').length, 549, 'a mutation survived in the weave');
  assert.ok(src.includes('You are above that. You are beyond that.'), 'a mutation survived in the soul');
  assert.ok(/Every reply is simply the next line in an ongoing relationship\.`;/.test(src), 'a mutation survived at the soul\'s close');
  assert.ok(read(LOOP).includes("+ (isConsult ? '' : NO_MACHINERY_LAW)"), 'a mutation survived in the compose expression');
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — the law that was ruled for every room now reaches every room; the planner\'s');
  console.log('prefix did not move a byte; and the founder\'s own 509 bytes travelled unedited.');
}
process.exit(fail === 0 ? 0 : 1);
