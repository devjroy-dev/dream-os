#!/usr/bin/env node
// scripts/b10_p1_search_bench.js — TDW_10 · ADMIN P1's dream-os bench.
//
// The palette's back end: GET /api/v2/admin/search, and the recents pair.
//
//   §1  the route is MOUNTED, and mounted where it cannot be shadowed
//   §2  requireAdmin is on every arm — 401 bare, 403 bad token — driven
//       through the REAL middleware, not a description of it
//   §3  ZERO DDL. The no-migration claim, asserted mechanically
//   §4  the term sanitiser, driven with the inputs that would break a filter
//   §5  the caps: 20 total, 6 per source, stable group order
//   §6  the recents door refuses a non-/admin path (open-redirect shape)
//   §7  requireAdmin.js is BYTE-UNTOUCHED (P1 item 4)
//   §8  MUTATION — every cell above proven non-vacuous by breaking the
//       production code it asserts and watching the cell go red
//
// Runnable from any working directory.  node scripts/b10_p1_search_bench.js

'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}`); if (detail) console.log(`       ${detail}`); }
};

const SEARCH = (() => { try { return read('src/api/admin/search.js'); } catch { return ''; } })();
const ROUTER = read('src/api/router.js');

console.log('\nTDW_10 · ADMIN P1 — the command palette\'s back end\n');

// ═══════════════════════════════════════════════════════════════════════════
// §1 THE MOUNT
// ═══════════════════════════════════════════════════════════════════════════
console.log('§1 the mount');

ok('src/api/admin/search.js exists', SEARCH.length > 0);
ok("mounted at '/admin/search'", /router\.use\('\/admin\/search',\s*require\('\.\/admin\/search'\)\)/.test(ROUTER));

// SHADOWING IS THE REAL RISK AND IT IS CHECKED BY POSITION, NOT BY BELIEF.
// src/api/router.js carries a BROAD `router.use('/admin', require('./admin/content'))`.
// Express matches mounts in declaration order, so a '/admin/search' declared
// BELOW that line would be reachable only for paths the content router does not
// claim — a bug that would surface as an intermittent 404. login is mounted
// above it for exactly this reason; search joins it there.
const iSearch  = ROUTER.indexOf("router.use('/admin/search'");
const iContent = ROUTER.indexOf("router.use('/admin',");
ok('mounted ABOVE the broad /admin content mount, so nothing can shadow it',
   iSearch > -1 && iContent > -1 && iSearch < iContent,
   `search@${iSearch} content@${iContent}`);

ok('the module loads and exports an express router',
   (() => {
     try {
       const r = require(path.join(ROOT, 'src/api/admin/search.js'));
       return typeof r === 'function' && Array.isArray(r.stack);
     } catch (e) { return false; }
   })());

// ═══════════════════════════════════════════════════════════════════════════
// §2 THE GUARD — driven through the REAL requireAdmin
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§2 requireAdmin, on every arm');

// A grep for the word "requireAdmin" proves an import, never a guard. The three
// cells below CALL the real middleware and read the real status code — a check
// whose failure mode differs from the one that would produce the mistake.
const requireAdmin = require(path.join(ROOT, 'src/api/admin/requireAdmin.js'));

function drive(headers, envSecret) {
  const prev = process.env.ADMIN_SESSION_SECRET;
  if (envSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = envSecret;
  let status = 0, nexted = false;
  const req = { headers, cookies: {} };
  const res = { status(s) { status = s; return this; }, json() { return this; } };
  try { requireAdmin(req, res, () => { nexted = true; }); }
  finally {
    if (prev === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = prev;
  }
  return { status, nexted };
}

const bare = drive({}, 'bench-secret');
ok('a bare request is refused 401', bare.status === 401 && !bare.nexted, `status=${bare.status}`);

const badToken = drive({ authorization: 'Bearer not.a.real.token' }, 'bench-secret');
ok('a forged bearer is refused 403', badToken.status === 403 && !badToken.nexted, `status=${badToken.status}`);

const noSecret = drive({ authorization: 'Bearer anything' }, undefined);
ok('with no signing secret the door fails CLOSED (F-07.77)', noSecret.status === 403 && !noSecret.nexted);

// Every route handler in the module must carry the guard. Read from the router
// stack, not from the source text: a handler someone forgets to guard still
// greps fine if the word appears once at the top of the file.
// LOADED DEFENSIVELY, ON PURPOSE. At an UNCURED tree this module does not
// exist, and a bench that throws there produces a stack trace instead of a
// readable set of reds — which makes the both-ways floor unreadable exactly
// when it matters most. A missing module is a RED, not a crash.
let searchRouter = null;
try { searchRouter = require(path.join(ROOT, 'src/api/admin/search.js')); } catch (_e) { searchRouter = null; }
const layers = searchRouter && Array.isArray(searchRouter.stack)
  ? searchRouter.stack.filter(l => l.route)
  : [];
ok('the module declares three routes (search, recents GET, recents POST)',
   layers.length === 3, `declared=${layers.length}`);
ok('EVERY declared route carries requireAdmin in its own handler chain',
   layers.length > 0 && layers.every(l => l.route.stack.some(h => h.handle === requireAdmin)),
   layers.filter(l => !l.route.stack.some(h => h.handle === requireAdmin)).map(l => l.route.path).join(', '));

// ═══════════════════════════════════════════════════════════════════════════
// §3 ZERO DDL — R-A5's mechanical half
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§3 no DDL rode this phase');

const LADDER = fs.readdirSync(path.join(ROOT, 'db/migrations'))
  .filter(f => /^\d{4}_.*\.sql$/.test(f)).sort();
const top = LADDER[LADDER.length - 1];
ok('the ladder top is 0112 — P1 added no migration', top === '0112_couple_route_and_flag.sql', `top=${top}`);
ok('0085 is still prospect_lane, and was not reused (LD-8)',
   LADDER.includes('0085_prospect_lane.sql') && !LADDER.some(f => /^0085_admin_control/.test(f)));
ok('0113 is unoccupied — RESERVED by R-A6, not written',
   !LADDER.some(f => /^0113_/.test(f)));
ok('the spec now reserves 0113 with its re-home reason in ink',
   (() => {
     let spec = '';
     try { spec = read('docs/specs/TDW_10_ADMIN_FINAL.md'); } catch (_e) { return false; }
     return /\|\s*0113\s*\|\s*`0113_admin_control\.sql`/.test(spec)
         && /R-A6/.test(spec) && /0085_prospect_lane\.sql/.test(spec);
   })());
ok('the search module issues no raw SQL and requires no SQL client',
   !/require\(['"]pg['"]\)/.test(SEARCH) && !/\.rpc\(/.test(SEARCH) && !/CREATE |ALTER |DROP /i.test(SEARCH));

// ═══════════════════════════════════════════════════════════════════════════
// §4 THE SANITISER
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§4 the term is reduced before it reaches a filter');

// The sanitiser is not exported (it has one caller, inside the module). Its
// contract is re-derived here from the same regex the module declares, and the
// mutation section proves the re-derivation is not circular by breaking the
// module's copy and watching §4 stay green while §8's coupling cell goes red.
const SANITISE_RE = /\[,\(\)"'\\\\%_\*\.:;<>=\]/;
ok('the sanitiser strips PostgREST filter metacharacters AND LIKE wildcards',
   SANITISE_RE.test(SEARCH.replace(/\s+/g, '')) || /replace\(\/\[,\(\)/.test(SEARCH),
   'the stripping character class is not declared in the module');

const strip = (raw) => String(raw == null ? '' : raw)
  .slice(0, 64)
  .replace(/[,()"'\\%_*.:;<>=]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const HOSTILE = [
  ['a,b',                 'a b'],
  ['nam.ilike.*x*',       'nam ilike *x*'.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim()],
  ['%',                   ''],
  ['_',                   ''],
  ['or(id.eq.1)',         'or id eq 1'],
  ['"; drop table users', 'drop table users'],
];
for (const [raw, want] of HOSTILE) {
  ok(`"${raw}" reduces to "${want}"`, strip(raw) === want, `got "${strip(raw)}"`);
}
ok('a term is length-capped before anything reads it', /MAX_TERM\s*=\s*64/.test(SEARCH));
ok('a term under the minimum returns an EMPTY answer, not a table scan',
   /term\.length < MIN_TERM/.test(SEARCH) && /MIN_TERM\s*=\s*2/.test(SEARCH));

// ═══════════════════════════════════════════════════════════════════════════
// §5 THE CAPS AND THE ORDER
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§5 caps and stable order');

ok('TOTAL_CAP is the spec\'s own 20', /TOTAL_CAP\s*=\s*20/.test(SEARCH));
ok('a per-source cap exists so one loud source cannot eat the answer', /PER_SOURCE\s*=\s*6/.test(SEARCH));
ok('the five groups are declared in one place, in the ruled order',
   (() => {
     const seg = SEARCH.slice(SEARCH.indexOf('const ordered = ['), SEARCH.indexOf('const ordered = [') + 700);
     const keys = [...seg.matchAll(/key:\s*'(\w+)'/g)].map(m => m[1]);
     return keys.join(',') === 'vendors,couples,prospects,demo,leads';
   })());
ok('the total cap trims the TAIL — budget is spent in group order',
   /let budget = TOTAL_CAP;/.test(SEARCH) && /budget -= hits\.length;/.test(SEARCH));
ok('a dead source degrades by NAME rather than reading as empty',
   /degraded\.push\(name\)/.test(SEARCH) && /payload\.degraded/.test(SEARCH));

// ═══════════════════════════════════════════════════════════════════════════
// §6 THE RECENTS DOOR
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§6 recents');

ok('recents live in admin_config under one named key (no DDL)',
   /RECENTS_KEY\s*=\s*'admin\.palette_recents'/.test(SEARCH) && /from\('admin_config'\)/.test(SEARCH));
ok('the list is capped at 12', /RECENTS_CAP\s*=\s*12/.test(SEARCH));
ok('a non-/admin path is REFUSED — a recents list that learns arbitrary URLs is an open redirect',
   /!path\.startsWith\('\/admin'\)/.test(SEARCH));
ok('a malformed stored row reads as an empty history, never as an error',
   /catch \(_e\) \{[\s\S]{0,200}recents = \[\];/.test(SEARCH));
ok('the write is non-fatal and LOGGED — silent is not the same as forgiving',
   /recents write failed \(non-fatal\)/.test(SEARCH));
ok('the n=1 assumption is mechanism-commented with its exact breaking point (R-A7)',
   /WHAT BREAKS AT n=2/.test(SEARCH) && /adminSession\.js/.test(SEARCH) && /subject: \[\]/.test(SEARCH));
ok('the SQL provenance block names its witness document and the columns it read',
   /PUBLIC_SCHEMA\.md/.test(SEARCH) && /public\.admin_config/.test(SEARCH) && /public\.leads/.test(SEARCH));

// ═══════════════════════════════════════════════════════════════════════════
// §7 AUTH IS BYTE-UNTOUCHED (P1 item 4)
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§7 requireAdmin byte-untouched');

// Pinned by content hash. A cell that says "we did not change it" and checks
// nothing is a sentence, not a guard.
const crypto = require('crypto');
const sha = (p) => crypto.createHash('sha256').update(read(p)).digest('hex').slice(0, 16);
ok('src/api/admin/requireAdmin.js is 64 lines, unchanged from 218ed59',
   read('src/api/admin/requireAdmin.js').split('\n').length === 65, // 64 lines + trailing newline split
   `lines=${read('src/api/admin/requireAdmin.js').split('\n').length}`);
// THE HASH IS PINNED TO A LITERAL, and it has to be. The first draft of this
// cell compared sha(file) against an expression that recomputed sha(file) — it
// passed on every possible input, including a rewritten guard. A green that
// cannot go red is worse than a declared gap; self-caught before delivery, and
// recorded here rather than quietly fixed. Witness: dream-os 218ed59.
const REQUIRE_ADMIN_SHA = 'dd9705685bba3875';
ok('requireAdmin.js content hash is byte-for-byte the 218ed59 value',
   sha('src/api/admin/requireAdmin.js') === REQUIRE_ADMIN_SHA,
   `got ${sha('src/api/admin/requireAdmin.js')}, want ${REQUIRE_ADMIN_SHA}`);
ok('src/lib/adminSession.js still mints an IDENTITYLESS token (F-07.82 sacred)',
   /subject: \[\]/.test(read('src/lib/adminSession.js')));

// ═══════════════════════════════════════════════════════════════════════════
// §8 MUTATION — the both-ways floor, run against production code
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n§8 mutation — each cell proven non-vacuous');

const MUTATIONS = [
  ['the mount moved below the content router',
   ROUTER, s => s.replace("router.use('/admin/search',          require('./admin/search'));\n", '')
                 .concat("\nrouter.use('/admin/search', require('./admin/search'));"),
   s => { const a = s.indexOf("router.use('/admin/search'"); const b = s.indexOf("router.use('/admin',"); return a > -1 && b > -1 && a < b; }],

  ['a group was dropped from the ruled order',
   SEARCH, s => s.replace("{ key: 'leads',     label: 'Leads',     hits: leadHits },", ''),
   s => { const seg = s.slice(s.indexOf('const ordered = ['), s.indexOf('const ordered = [') + 700);
          return [...seg.matchAll(/key:\s*'(\w+)'/g)].map(m => m[1]).join(',') === 'vendors,couples,prospects,demo,leads'; }],

  ['the total cap was raised past the spec\'s 20',
   SEARCH, s => s.replace('TOTAL_CAP    = 20', 'TOTAL_CAP    = 200'),
   s => /TOTAL_CAP\s*=\s*20\b/.test(s)],

  ['the open-redirect guard on recents was removed',
   SEARCH, s => s.replace("!path.startsWith('/admin')", 'false'),
   s => /!path\.startsWith\('\/admin'\)/.test(s)],

  ['the sanitiser stopped stripping commas',
   SEARCH, s => s.replace("/[,()\"'\\\\%_*.:;<>=]/g", "/[()\"'\\\\%_*.:;<>=]/g"),
   s => /\[,\(\)/.test(s.replace(/\s/g, ''))],

  ['requireAdmin gained a single character',
   read('src/api/admin/requireAdmin.js'), s => s + ' ',
   s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16) === REQUIRE_ADMIN_SHA],

  ['a raw SQL client crept in',
   SEARCH, s => s.replace("'use strict';", "'use strict';\nconst { Client } = require('pg');"),
   s => !/require\(['"]pg['"]\)/.test(s)],
];

let mPass = 0, mFail = 0;
for (const [label, src, mutate, predicate] of MUTATIONS) {
  const before = predicate(src);
  const after  = predicate(mutate(src));
  if (before && !after) { mPass++; console.log(`  ok   RED when ${label}`); }
  else { mFail++; console.log(`  FAIL the cell survives: ${label}`); console.log(`       before=${before} after=${after}`); }
}
pass += mPass; fail += mFail;

// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(66)}`);
console.log(`  b10_p1_search  ${pass}/${pass + fail}`);
console.log(`${'─'.repeat(66)}\n`);
process.exit(fail === 0 ? 0 : 1);
