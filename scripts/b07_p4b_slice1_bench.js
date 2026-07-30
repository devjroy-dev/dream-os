#!/usr/bin/env node
// scripts/b07_p4b_slice1_bench.js
// TDW_07 P4b SLICE 1 — the dream-os half's floor.
//
// SLICE 1 SHIPS ZERO BACKEND MECHANISM. That is the point of this bench and the
// reason it is not a formality: the cure for F-07.22 lives entirely in the pwa,
// and the backend's only movement is a COMMENT that was carrying a false
// sentence. So the cells here prove two things and no more —
//
//   (1) the false sentence is GONE and the refined physics replaced it, with
//       F-07.7 cited as the family (the CE's ruling names all of this), and
//   (2) NOTHING MECHANICAL MOVED — the authorize host, the scope, the TTL and
//       the route table are byte-for-byte what P4a sealed.
//
// (2) is the load-bearing half. A comment amendment that quietly took a
// constant with it would be exactly the class this estate keeps paying for, and
// "it was only a comment" is what that always looks like on the way in.
//
// Runnable from any working directory; every path resolves off this file.
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

sec('§1 · THE FALSE SENTENCE IS GONE (CE-ruled amendment)');
ok('§1.1 the "window.location.href to Instagram is safe" claim no longer stands',
  !/`window\.location\.href` to Instagram is safe/.test(O),
  'the sentence that closed the investigation is still in the file');
ok('§1.2 the amendment is DATED and attributed, not a silent rewrite',
  /AMENDED AT P4b, 2026-07-30/.test(O));
ok('§1.3 the refined physics names the SUPPRESSED case (inside a user activation)',
  /INSIDE a user activation/.test(O) && /SUPPRESSED/.test(O));
ok('§1.4 and the CLAIMABLE case (script-initiated, timer, server 302)',
  /CLAIMABLE/.test(O) && /server 302/.test(O));
ok('§1.5 F-07.7 is cited as the same physics on a different site',
  /F-07\.7/.test(O));
ok('§1.6 the comment points at where the cure actually lives',
  /app\/vendor\/portfolio\/page\.tsx/.test(O));
ok('§1.7 the hypothesis posture survives — it earned its keep once already',
  /HYPOTHESIS, NOT A CURE/.test(O));

sec('§2 · FORK (a) WAS REFUSED, AND THE REFUSAL IS RECORDED WHERE THE ARGUMENT LIVES');
ok('§2.1 the refused server-302 start route is named as refused',
  /REFUSED/.test(O) && /START ROUTE THAT 302s/.test(O));
ok('§2.2 the reason is the F-07.23 hop, stated so nobody rebuilds it',
  /the hop F-07\.23 deleted/i.test(O));
ok('§2.3 and NO /start route was actually added to the router',
  !/router\.(get|post)\('\/start'/.test(A),
  'a start route exists — fork (a) was built despite the refusal');

sec('§3 · ZERO MECHANISM MOVED — THE BYTE-STABILITY HALF');
ok('§3.1 the authorize host is untouched',
  /const AUTHORIZE_URL   = 'https:\/\/www\.instagram\.com\/oauth\/authorize';/.test(O));
ok('§3.2 the token host is untouched',
  /const TOKEN_URL       = 'https:\/\/api\.instagram\.com\/oauth\/access_token';/.test(O));
ok('§3.3 the graph host is untouched',
  /const GRAPH_HOST      = 'https:\/\/graph\.instagram\.com';/.test(O));
ok('§3.4 least privilege holds — one scope, the current name',
  /const IG_SCOPE = 'instagram_business_basic';/.test(O));
ok('§3.5 the state TTL is untouched (the pwa\'s re-mint threshold is derived from it)',
  /const STATE_TTL_MS = 10 \* 60 \* 1000;/.test(O));
ok('§3.6 the callback path is untouched — Meta matches it byte-for-byte',
  /const IG_CALLBACK_PATH = '\/api\/v2\/vendor\/ig\/callback';/.test(O));
ok('§3.7 the refresh window is untouched',
  /const REFRESH_WINDOW_DAYS = 7;/.test(O));
{
  // THE ROUTE TABLE AS A SET, not as a count — a count passes over a swap.
  // EXECUTOR DISCLOSURE: this cell's first take stripped the opening quote and
  // not the closing one, so it reddened at BOTH trees over a bench defect while
  // the route set was correct all along. Fixed here rather than softened — and
  // recorded, because a cell that fails identically at both trees is exactly
  // the shape that gets "ratified as a known red" if nobody reads it.
  const routes = (A.match(/router\.(?:get|post|delete)\('([^']+)'/g) || [])
    .map(s => s.replace(/^router\.(?:get|post|delete)\('/, '').replace(/'$/, ''))
    .sort().join(',');
  ok('§3.8 the ig router serves exactly P4a\'s route set, unchanged',
    routes === '/authorize,/callback,/data-deletion,/deauthorize,/deletion-status,/disconnect,/import,/media,/status',
    routes);
}
{
  // NON-VACUITY GUARD FOR §1: if the file ever loses its header entirely, every
  // §1 cell that asserts an ABSENCE would go green over an empty file. This
  // cell makes that impossible.
  ok('§3.9 the header is still substantially present (absence cells stay honest)',
    O.length > 12000 && /F-07\.23 · MY CORRECTION WAS THE ERROR/.test(O),
    `length=${O.length}`);
}

console.log(`\n──────── b07_p4b_slice1: ${pass}/${pass + fail} ────────`);
process.exit(fail === 0 ? 0 : 1);
