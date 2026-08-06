// scripts/tdw09_p2b_vocab_os.proof.mjs — PHASE B, dream-os side: the mirror +
// the two doors. The CROSS-REPO parity arbiter lives in the pwa repo
// (scripts/tdw09_p2b_vocab.proof.mjs) and outranks this file on any
// disagreement; this cell guards the mirror against LOCAL drift and proves the
// write/filter doors actually consume the one normal form.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(join(ROOT, 'package.json'));
let pass = 0, fail = 0;
const cell = (id, ok, msg) => { if (ok) { pass++; console.log(`  PASS ${id} ${msg}`); } else { fail++; console.log(`  FAIL ${id} ${msg}`); } };

console.log('\n── §1 · the mirror module behaves ──');
const V = require_(join(ROOT, 'src/lib/shared/tagVocabulary.js'));
const COUNTS = { photography: 10, makeup: 10, decor: 10, catering: 10, venue: 10, mehndi: 8, choreography: 7, music: 8, planning: 6 };
Object.entries(COUNTS).forEach(([c, n], i) =>
  cell(`1.1.${i + 1}`, V.TAG_VOCABULARY[c]?.length === n, `${c}: ${V.TAG_VOCABULARY[c]?.length ?? 0}/${n}`));
cell('1.2', !('other' in V.TAG_VOCABULARY) && V.vocabularyFor('other') === null,
  "'other' honestly list-free; vocabularyFor('other') === null");
cell('1.3', V.normalizeTag('  Traditional ') === 'traditional',
  'normalizeTag: trim + case-fold (the F-10.52 mismatch byte itself)');
cell('1.4', JSON.stringify(V.normalizeTags(['Moody', 'moody ', '', 'Film'])) === JSON.stringify(['moody', 'film']),
  'normalizeTags: dedupe first-wins, empties dropped, order kept');
cell('1.5', readFileSync(join(ROOT, 'src/lib/shared/tagVocabulary.js'), 'utf8').includes('lib/shared/tagVocabulary.ts'),
  'the mirror names its pwa source (binding, this direction)');

console.log('\n── §2 · the two doors consume the normal form ──');
const me = readFileSync(join(ROOT, 'src/api/vendor/me.js'), 'utf8');
cell('2.1', me.includes("require('../../lib/shared/tagVocabulary')")
         && /body\.aesthetic_tags = normalizeTags\(body\.aesthetic_tags\)/.test(me),
  'me.js normalises aesthetic_tags BEFORE the allowlist stores it (write door)');
cell('2.2', /normalizeTags[\s\S]{0,600}const update = \{\};/.test(me),
  'normalisation precedes the update assembly — order proven, not assumed');
const disc = readFileSync(join(ROOT, 'src/api/couple/discover.js'), 'utf8');
cell('2.3', disc.includes("require('../../lib/shared/tagVocabulary')")
         && /overlaps\('aesthetic_tags', vibeList\)/.test(disc),
  'discover.js filters on the NORMALISED vibe list (filter door)');
cell('2.4', !/overlaps\('aesthetic_tags', vibes\.split/.test(disc),
  'the raw-split overlaps is gone — the mismatch cannot recur at this door');
cell('2.5', !/UPDATE .*aesthetic_tags/i.test(disc) && !/backfill/i.test(disc.replace(/\/\/.*$/gm, '')),
  'tolerate-on-read: the filter door writes nothing (never backfill)');

console.log(`\n════ tdw09_p2b_vocab_os: ${pass} passed, ${fail} failed (total ${pass + fail}) ════`);
process.exit(fail === 0 ? 0 : 1);
