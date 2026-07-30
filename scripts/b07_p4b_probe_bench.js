#!/usr/bin/env node
// scripts/b07_p4b_probe_bench.js
// TDW_07 P4b — THE PHYSICS HEADER, THIRD AMENDMENT.
//
// A bench over a COMMENT, which needs its justification stated or it looks like
// theatre. The justification is the record: this paragraph has been wrong three
// times, written by three different authors, and each wrong version went on to
// steer a build. It is not decoration — it is the file's operative doctrine, and
// the two builds that followed the last two versions were both aimed wrong by
// it. So it gets cells, and the cells assert that no claim survives in it
// without either a dated founder screenshot or the word CONJECTURE.
//
// The §3 half is the one that matters most and looks like it matters least:
// NOTHING MECHANICAL MOVED. A comment amendment that took a constant with it is
// exactly the class this estate keeps paying for, and "it was only a comment" is
// what that looks like on the way in.
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok  = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  → ' + d : '')); } };
const sec = (t) => console.log('\n' + t);

const raw = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const OAUTH = 'src/lib/vendor/igOAuth.js';
const IGAPI = 'src/api/vendor/ig.js';
const O = raw(OAUTH);
const A = raw(IGAPI);

sec('§1 · THE STANDING HEADER (CE-ruled verbatim)');
ok('§1.1 NO DEVICE IN THE LOOP is the file\'s standing header',
  /NO DEVICE IN THE LOOP/.test(O));
ok('§1.2 it states the rule in the chair\'s own terms',
  /CITES A FOUNDER-WITNESSED\s*\n\/\/ SCREENSHOT BY DATE, OR CARRIES THE WORD CONJECTURE/.test(O));
ok('§1.3 the structural diagnosis is recorded — three authors, three inversions',
  /THREE\s*\n\/\/ TIMES/.test(O) && /THREE DIFFERENT AUTHORS/.test(O));
ok('§1.4 correction №21 is owned jointly, not assigned downward',
  /Correction №21 is jointly the executor's and the chair's/.test(O));

sec('§2 · THE PHYSICS SAYS ONLY WHAT THE SCREENSHOTS PROVE');
ok('§2.1 the inverted claim is GONE — a link tap is no longer called suppressed',
  !/a real link tap\) is\s*\n\/\/\s*SUPPRESSED/.test(O),
  'the inverted sentence survives');
ok('§2.2 and its predecessor is still gone too',
  !/`window\.location\.href` to Instagram is safe/.test(O));
ok('§2.3 FACT 1 — the plain anchor tap is CLAIMED',
  /A PLAIN ANCHOR TAP/.test(O) && /IS\s*\n\/\/\s*CLAIMED by the Instagram app/.test(O));
ok('§2.4 FACT 2 — long-press to a new tab ESCAPES, import completed',
  /LONG-PRESS → "Open in New Tab" ESCAPES/.test(O) && /import\s*\n\/\/\s*completes end to end/.test(O));
ok('§2.5 both facts cite a DATED founder witness',
  (O.match(/WITNESS: founder screenshot, 2026-07-30/g) || []).length === 2);
ok('§2.6 everything else is named CONJECTURE, by that word',
  /EVERY OTHER NAVIGATION FORM IS UNKNOWN/.test(O) && /is CONJECTURE/.test(O));
ok('§2.7 the surviving F-07.23 claim is relabelled CONJECTURE, not left bare',
  /CONJECTURE, and now known to be at best incomplete/.test(O));
ok('§2.8 the exoneration is recorded beside the conviction',
  /the request, the config, the signed state, the scope, the redirect_uri and\s*\n\/\/ the vendor's account are ALL CLEAN/.test(O));
ok('§2.9 fork (a) stays refused, and the refusal is re-grounded on the walk',
  /a server\s*\n\/\/ redirect is not among the two forms now known to escape/.test(O));

sec('§3 · ZERO MECHANISM MOVED');
ok('§3.1 the authorize host is untouched',
  /const AUTHORIZE_URL   = 'https:\/\/www\.instagram\.com\/oauth\/authorize';/.test(O));
ok('§3.2 the token host is untouched',
  /const TOKEN_URL       = 'https:\/\/api\.instagram\.com\/oauth\/access_token';/.test(O));
ok('§3.3 the graph host is untouched',
  /const GRAPH_HOST      = 'https:\/\/graph\.instagram\.com';/.test(O));
ok('§3.4 one scope, the current name', /const IG_SCOPE = 'instagram_business_basic';/.test(O));
ok('§3.5 the state TTL is untouched', /const STATE_TTL_MS = 10 \* 60 \* 1000;/.test(O));
ok('§3.6 the callback path is untouched', /const IG_CALLBACK_PATH = '\/api\/v2\/vendor\/ig\/callback';/.test(O));
ok('§3.7 the refresh window is untouched', /const REFRESH_WINDOW_DAYS = 7;/.test(O));
{
  const routes = (A.match(/router\.(?:get|post|delete)\('([^']+)'/g) || [])
    .map(s => s.replace(/^router\.(?:get|post|delete)\('/, '').replace(/'$/, ''))
    .sort().join(',');
  ok('§3.8 the ig router serves exactly P4a\'s route set — no start route appeared',
    routes === '/authorize,/callback,/data-deletion,/deauthorize,/deletion-status,/disconnect,/import,/media,/status',
    routes);
}
{
  // NON-VACUITY GUARD: every §2 absence cell would go green over an emptied
  // file. This makes that impossible.
  ok('§3.9 the header is substantially present (the absence cells stay honest)',
    O.length > 13000, `length=${O.length}`);
}

console.log(`\n──────── b07_p4b_probe: ${pass}/${pass + fail} ────────`);
process.exit(fail === 0 ? 0 : 1);
