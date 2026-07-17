// scripts/lib/dist_gate.js — TDW_06 economics sitting, D-11: F-04.83's
// dist-staleness gate GENERALIZED (the noted sibling polish, chartered because
// this sitting touches the engine). One helper, every dist-driving bench.
//
// THE LAW (F-04.83, verbatim in spirit): a dist that DISAGREES with its source
// on the bench's cure sentinel is STALE — it was compiled before the source
// moved (the founder's desk never runs the build; Railway does, on deploy) and
// its testimony is about YESTERDAY'S source. A stale dist must not testify: the
// dist-driving section SKIPS, STATED, with the one-line fix named, and the
// source assertions carry. The gate is agree/disagree, NEVER presence — an
// UNCURED tree (source and dist both lack the sentinel) AGREES, so the section
// still runs there and still FAILS on exactly the cure: the both-ways floor
// stands at every bench that adopts this helper.
//
// Returns { present, stale } — `present` false on a clean clone (dist absent),
// `stale` true exactly when src and dist disagree on the sentinel.
'use strict';
const fs = require('fs');

function distGate({ sentinel, srcPath, distPath, benchCmd }) {
  const present = fs.existsSync(distPath);
  const has = (p) => { try { return new RegExp(sentinel).test(fs.readFileSync(p, 'utf8')); } catch (_e) { return false; } };
  const stale = present && (has(srcPath) !== has(distPath));
  if (!present) {
    console.log('  … dist absent (clean clone) — the dist-driven assertions SKIP, stated;');
    console.log('    the engine gates (tsc + build + smoke) carry behaviour. Source assertions run.');
  } else if (stale) {
    console.log(`  … dist is STALE — ${distPath.replace(/^.*src\/engine/, 'src/engine')} disagrees with its source on the`);
    console.log(`    cure sentinel "${sentinel}" (compiled before the source moved; F-04.83's class).`);
    console.log('    The dist-driven assertions SKIP, stated. THE FIX, one line:');
    console.log(`      npm run build && node ${benchCmd}`);
    console.log('    (Railway rebuilds dist on every deploy — production is not this desk.)');
  }
  return { present, stale, runDist: present && !stale };
}

module.exports = { distGate };
