#!/usr/bin/env node
// scripts/b50_preflight_verdict_bench.js
// ═════════════════════════════════════════════════════════════════════════════
// F-39.44 — THE GATE INSTRUMENT PRINTED "STOP" AND RETURNED "GO".
// ═════════════════════════════════════════════════════════════════════════════
// `tools/preflight.sh` ended `exit 0` unconditionally, under BOTH branches of its
// own verdict. It printed
//
//     PREFLIGHT NOT CLEAR — resolve the lines above before any number goes in a handover.
//
// and then handed its caller a zero. Under this estate's floor-method law — THE
// EXIT CODE IS THE VERDICT, never the printed text, because our benches use at
// least three report formats and only the code is shared by all of them — every
// wrapper that gated on preflight saw CLEAR forever, on every tree, always.
//
// THE CLASS, NAMED (CE-39 band 5): an instrument CORRECT ABOUT ITS OWN SUBJECT
// and WRONG ABOUT WHAT IT IS READ TO MEAN, with nothing above it asking the
// second question. F-39.39, .41, .42, .43 and this one are its instances. The
// bitter part of this instance is the site: the instrument the estate runs FIRST,
// before every sitting, to decide whether any other number can be trusted.
//
// ── WHY THE CELLS DRIVE THE SCRIPT'S OWN BYTES AND NOT A REPLICA ────────────
// F-07.99's law: a definition held and never invoked fooled this estate for a
// whole block. A cell that re-implements the verdict block and tests the replica
// proves nothing about the file. So §2 SLICES the verdict block out of the live
// `tools/preflight.sh` and EXECUTES IT, twice, under both values of `WARN`. If a
// seat restores `exit 0` tomorrow, the WARN=1 arm returns zero and §2.2 reds.
//
// That is the both-ways, and it is non-vacuous by construction rather than by
// assertion: the RED arm is produced by running the shipped bytes, not by a
// fabricated string that resembles them.
//
// ── THE TWO COPIES ARE FORKED BY DESIGN ────────────────────────────────────
// `tools/preflight.sh` exists in both repos and the files differ ABOVE the
// verdict (dream-os carries the F-39.p2 build-artifact lore the pwa has no use
// for). The VERDICT BLOCK is byte-identical and §3 pins it, so the class cannot
// be cured on one repo and left standing on the other — F-07.52's exact failure,
// one repo over. Sibling absent ⇒ LOUD NAMED SKIP, never a silent pass.
// ═════════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PREFLIGHT = 'tools/preflight.sh';
const raw = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let pass = 0, fail = 0, skip = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}`); if (detail) console.log(`       ${detail}`); }
};
const named_skip = (label, why) => { skip++; console.log(`  SKIP ${label}\n       ${why}`); };
const sec = (t) => console.log(`\n${t}`);

console.log('F-39.44 — the preflight verdict reaches the exit code');

// ═════════════════════════════════════════════════════════════════════════════
// THE SLICE. The verdict block is everything from the branch that chooses the
// sentence to the exit that carries it. Sliced by its opening token rather than
// by a line number (path-over-range): a line count would rot the first time a
// warning is added above it, which is the one edit this file must survive.
const OPEN = 'if [ "$WARN" = "0" ]; then';
const src = raw(PREFLIGHT);
const at = src.indexOf(OPEN);
const block = at >= 0 ? src.slice(at) : '';

sec('§1 · THE SHAPE — the verdict is derived from WARN, and nothing overrides it');

ok('§1.1 the verdict block is locatable by its own opening token (non-vacuity)',
  at >= 0 && block.includes('PREFLIGHT NOT CLEAR'),
  'the branch that chooses the sentence has moved or been renamed; this bench is reading the wrong region and every cell below is about nothing');

ok('§1.2 the script ends by exiting WARN, not a constant',
  /\nexit "\$WARN"\s*$/.test(src),
  'the tail no longer derives its exit from the verdict variable');

// THE PRECISE REGRESSION, NAMED. Not "no exit 0 anywhere" — an early refusal that
// exits 0 on a legitimate no-op would be fine. The defect was the LAST word of
// the file being a constant while a verdict sat one line above it.
ok('§1.3 no unconditional `exit 0` survives inside the verdict block',
  !/\bexit 0\b/.test(block),
  'a constant exit has grown back below the verdict — F-39.44 exactly');

// ONE PLACE, NOT TWO. Every warning site above sets WARN=1 beside the `say` that
// explains it. Deriving the exit from WARN means a warning added tomorrow gates
// by existing — the same law run-floor.sh learnt three times about hand-written
// enumerations. A second list to keep in step is how the first one goes stale.
const warnSites = (src.match(/^\s*WARN=1\s*$/gm) || []).length;
ok(`§1.4 every warning site feeds the one variable the exit reads (${warnSites} sites)`,
  warnSites >= 3,
  'the warning sites and the exit have drifted apart, or the sites are gone');

// ═════════════════════════════════════════════════════════════════════════════
sec('§2 · BOTH WAYS — the shipped bytes are EXECUTED under each verdict');

// `say` and `line` are the script's own output helpers, defined above the slice.
// Stubbed here because this cell's subject is the EXIT CODE and not the prose;
// the prose is §1.1's business. `$1` carries the verdict in, so the block under
// test is the shipped block and nothing around it is authored.
const drive = (warn) => {
  const r = spawnSync('bash', ['-c', 'say(){ :; }; line(){ :; }; WARN="$1";\n' + block, 'b50', String(warn)],
    { encoding: 'utf8' });
  return r.status;
};

const clear = drive(0);
const notClear = drive(1);

ok('§2.1 WARN=0 — a clear preflight exits 0 (the cure does not break the green arm)',
  clear === 0,
  `a clean tree now exits ${clear}; the cure would refuse every sitting`);

ok('§2.2 WARN=1 — a NOT CLEAR preflight exits NON-ZERO',
  notClear !== 0,
  `THE F-39.44 DEFECT IS BACK: the block printed its refusal and returned ${notClear}. `
  + 'Every wrapper gating on this instrument reads CLEAR on a tree it just refused.');

ok('§2.3 the two arms genuinely differ — the cell is not passing on a constant',
  clear !== notClear,
  'both arms returned the same code, so §2.1 and §2.2 cannot both be measuring the verdict');

// ═════════════════════════════════════════════════════════════════════════════
sec('§3 · ONE VERDICT, TWO REPOS — the forked file, pinned at the block');

// The files differ above this point BY DESIGN. What may not differ is the part
// that decides what the instrument MEANS.
{
  const SIB = ['../dreamos-pwa/tools/preflight.sh', '../../dreamos-pwa/tools/preflight.sh'];
  const found = SIB.map((p) => path.resolve(ROOT, p)).find((p) => fs.existsSync(p));
  if (!found) {
    named_skip('§3.1 cross-repo verdict identity — dreamos-pwa sibling clone not present',
      'the twin could not be read from this container; the identity is UNPROVEN here and is '
      + 'proven in dreamos-pwa by scripts/tdw_f3944_preflight_verdict.proof.mjs §3. '
      + 'A skip, counted and named — never a pass.');
  } else {
    const twin = fs.readFileSync(found, 'utf8');
    const twinAt = twin.indexOf(OPEN);
    ok('§3.1 both repos carry the SAME verdict block, byte-identical',
      twinAt >= 0 && twin.slice(twinAt) === block,
      'the verdict has drifted between the two copies — the class is cured on one repo and '
      + 'standing on the other, which is F-07.52 one repo over');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
const total = pass + fail;
console.log(`\n${fail ? 'RED' : 'GREEN'} — b50_preflight_verdict ${pass}/${total}${skip ? ` (${skip} NAMED SKIP)` : ''}`);
process.exit(fail ? 1 : 0);
