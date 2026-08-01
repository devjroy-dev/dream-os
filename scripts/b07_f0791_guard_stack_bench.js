#!/usr/bin/env node
// scripts/b07_f0791_guard_stack_bench.js
// F-07.91 — THE UNSATISFIABLE GUARD STACK, and the SWEEP the chair chartered.
//
// ── THE BENCH GAP THIS CLOSES, OWNED BY NAME ─────────────────────────────────
// b07_f0784_panel_bench §2 asserted the header limb was dead and the bearer limb
// lived. It never asserted that an admin route's guard STACK is satisfiable by
// an ADMIN credential. A route can carry `requireAdmin` and still be shut — if
// something else stands in front of it. Ten routes across three files were shut
// exactly that way, through the whole panel fold, and every cell stayed green.
//
// So this is a SWEEP, not a cell list: EVERY route in src/api/admin/** is
// enumerated, its middleware chain extracted, and each guard in the chain
// classified. A guard that cannot be satisfied by an admin credential standing
// anywhere in an admin route's chain reddens here. The class cannot re-enter
// silently.
'use strict';

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const R    = p => path.join(ROOT, p);
const read = p => fs.readFileSync(R(p), 'utf8');

let pass = 0, fail = 0;
const ok  = (n, c) => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n}`); } };
const sec = t => console.log(`\n${t}`);

// ── §0 · THE CANARY (CE-120 standing law) ────────────────────────────────────
function strip(src) {
  let o = '', i = 0, q = null, ln = false, bl = false;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (ln) { if (c === '\n') { ln = false; o += c; } i++; continue; }
    if (bl) { if (c === '*' && n === '/') { bl = false; i += 2; } else i++; continue; }
    if (q)  { o += c; if (c === '\\') { o += src[i + 1] || ''; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; o += c; i++; continue; }
    if (c === '/' && n === '/') { ln = true; i += 2; continue; }
    if (c === '/' && n === '*') { bl = true; i += 2; continue; }
    o += c; i++;
  }
  return o;
}

// ── THE GUARD TAXONOMY, stated rather than assumed ───────────────────────────
// ADMIN-SATISFIABLE: verifies the admin session material an admin actually
//   holds after signing in at /api/v2/admin/login.
// NOT ADMIN-SATISFIABLE: verifies a credential belonging to some OTHER identity
//   — a vendor's or couple's Supabase user JWT, a circle membership. An admin
//   holds none of these. Any of them in front of an admin route is a lock with
//   no key. Named individually so a NEW guard cannot join the estate and slip
//   through an over-broad allowlist.
// ── ALIAS RESOLUTION, added after the sweep convicted the wrong file ─────────
// The first draft matched the guard by its LITERAL NAME and flagged all ten
// demoAdmin routes as UNGUARDED — because the F-07.86 fold imports the one guard
// as `const requireAdminPassword = require('./requireAdmin')`, keeping the old
// call-site name so ten mounts did not have to churn. The guard was there; the
// sweep could not see it under its local name. A sweep that reads names instead
// of BINDINGS convicts the innocent and, worse, would acquit a foreign guard
// hiding behind a friendly alias. Resolved per-file from the require target.
const ADMIN_SATISFIABLE = new Set(['requireAdmin']);
const FOREIGN_TARGETS   = /\/middleware\/(requireAuth|requireCoupleAuth|requireVendorAuth|requireCircleMemberAuth)/;

function aliasesIn(src) {
  const admin = new Set(), foreign = new Set();
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*(['"])([^'"]+)\2\s*\)/g)) {
    const [, name, , target] = m;
    if (/\.\/requireAdmin$/.test(target))  admin.add(name);
    if (FOREIGN_TARGETS.test(target))       foreign.add(name);
  }
  return { admin, foreign };
}
const FOREIGN_GUARDS    = new Set([
  'requireAuth',              // Supabase USER JWT — F-07.91's specimen
  'requireCoupleAuth',
  'requireVendorAuth',
  'requireCircleMemberAuth',
]);

// Enumerate every route in a router file with its middleware chain.
function routesOf(file) {
  const src = strip(fs.readFileSync(file, 'utf8'));
  const { admin, foreign } = aliasesIn(src);
  const out = [];
  const re  = /(?:router|r|adminRouter|publicRouter)\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]*)\2\s*,([^\n]*)/g;
  let m;
  while ((m = re.exec(src))) {
    const chain = (m[4].match(/\b[A-Za-z_$][\w$]*\b/g) || [])
      .filter(t => !['asyncHandler', 'async', 'req', 'res', 'next', 'express', 'urlencoded', 'extended', 'true', 'false'].includes(t));
    out.push({ file: path.relative(ROOT, file), verb: m[1].toUpperCase(), route: m[3], chain,
               admin, foreign, line: src.slice(0, m.index).split('\n').length });
  }
  // router.use(guard) applies to everything below it — treat it as a chain member
  const uses = [...src.matchAll(/router\.use\(\s*([A-Za-z_$][\w$]*)\s*\)/g)].map(x => x[1]);
  for (const o of out) o.chain = [...uses, ...o.chain];
  return out;
}

const ADMIN_FILES = fs.readdirSync(R('src/api/admin'))
  .filter(f => f.endsWith('.js') && f !== 'requireAdmin.js')
  .map(f => R(path.join('src/api/admin', f)));

const ALL = ADMIN_FILES.flatMap(routesOf);

// PUBLIC BY DESIGN — the three publicRouter mounts at api/router.js:53-55 serve
// couples and are deliberately unguarded. Named, never inferred.
const PUBLIC_BY_DESIGN = new Set(['musePool.js', 'spotlight.js', 'discoverHeroes.js']);

// UNGUARDED BY NECESSITY — the login door. A guard on the door that MINTS the
// credential is circular: nobody could ever obtain the thing it would demand.
// Named as a route, not a file, so nothing else in login.js could join it silently.
const UNGUARDED_BY_NECESSITY = new Set(['src/api/admin/login.js POST /']);

sec('§0 · THE CANARY — the stripper does not swallow live code');
{
  const src = read('src/api/admin/discover.js');
  const s   = strip(src);
  ok('§0.1 comment prose is removed', !s.includes('lock with no key'));
  ok('§0.2 CANARY: the routes survive stripping', /router\.get\('\/requests'/.test(s));
  ok('§0.3 CANARY: the module export survives', /module\.exports/.test(s));
  ok('§0.4 VACUITY TWIN: the stripper is not a no-op', s.length < src.length);
}

sec('§1 · THE ENUMERATOR SEES THE ESTATE (vacuity guard)');
{
  ok(`§1.1 routes enumerated across ${ADMIN_FILES.length} admin files (${ALL.length} routes)`, ALL.length > 60);
  ok('§1.2 the enumerator finds the F-07.91 specimen by name',
     ALL.some(r => r.file.endsWith('discover.js') && r.route === '/requests'));
  ok('§1.3 chains are extracted, not empty',
     ALL.filter(r => r.chain.includes('requireAdmin')).length > 50);
  ok('§1.4 router.use-mounted guards are counted (waitlist.js guards by use, not per-route)',
     ALL.filter(r => r.file.endsWith('waitlist.js')).every(r => r.chain.includes('requireAdmin')));
}

sec('§2 · F-07.91 — NO FOREIGN GUARD STANDS IN FRONT OF ANY ADMIN ROUTE');
{
  const isForeign = (r, g) => FOREIGN_GUARDS.has(g) || r.foreign.has(g);
  const shut = ALL.filter(r => r.chain.some(g => isForeign(r, g)));
  for (const r of shut) console.log(`         SHUT: ${r.file}:${r.line}  ${r.verb} ${r.route}  [${r.chain.join(', ')}]`);
  ok(`§2.1 SWEEP: zero admin routes carry a guard an admin cannot satisfy (found ${shut.length})`, shut.length === 0);

  // The ten by name — so a partial revert reddens on the specific route.
  const TEN = [
    ['discover.js', '/requests'], ['discover.js', '/grant/:vendorId'],
    ['discover.js', '/deny/:vendorId'], ['discover.js', '/revoke/:vendorId'],
    ['featured.js', '/queue'], ['featured.js', '/eligible/:vendorId'],
    ['featured.js', '/:submissionId/approve'], ['featured.js', '/:submissionId/reject'],
    ['couture.js', '/payouts/pending'], ['couture.js', '/eligible/:vendorId'],
  ];
  for (const [f, route] of TEN) {
    const r = ALL.find(x => x.file.endsWith(f) && x.route === route);
    ok(`§2.2 ${f} ${route} — guarded by requireAdmin ALONE`,
       !!r && r.chain.some(g => ADMIN_SATISFIABLE.has(g) || r.admin.has(g))
           && !r.chain.some(g => FOREIGN_GUARDS.has(g) || r.foreign.has(g)));
  }
}

sec('§3 · NON-WEAKENING — every route that had a guard still has one');
{
  const unguarded = ALL.filter(r =>
    !PUBLIC_BY_DESIGN.has(path.basename(r.file)) &&
    !UNGUARDED_BY_NECESSITY.has(`${r.file} ${r.verb} ${r.route}`) &&
    !r.chain.some(g => ADMIN_SATISFIABLE.has(g) || r.admin.has(g)));
  for (const r of unguarded) console.log(`         UNGUARDED: ${r.file}:${r.line}  ${r.verb} ${r.route}`);
  ok(`§3.1 zero admin routes lost their guard in the cure (found ${unguarded.length})`, unguarded.length === 0);
  ok('§3.2 the three deliberate publicRouter files are named, not inferred', PUBLIC_BY_DESIGN.size === 3);
  // §3.2b RE-AIMED (labeled): the first draft asserted the SET had one entry —
  // which mutation Q-6 left untouched while widening the exemption's APPLICATION
  // from a route match to a file match and planting a second unguarded route in
  // login.js. The set was still size 1; a second route walked through anyway. A
  // cell must assert the exemption's EFFECT, not its declaration. This counts the
  // routes actually exempted, so any widening reddens whatever the set says.
  const exempted = ALL.filter(r =>
    !PUBLIC_BY_DESIGN.has(path.basename(r.file)) &&
    !r.chain.some(g => ADMIN_SATISFIABLE.has(g) || r.admin.has(g)));
  ok(`§3.2b EXACTLY ONE route is exempted by necessity, and it is the login door (found ${exempted.length})`,
     exempted.length === 1 && UNGUARDED_BY_NECESSITY.has(`${exempted[0].file} ${exempted[0].verb} ${exempted[0].route}`));
  ok('§3.2c ALIAS RESOLUTION: demoAdmin\'s ten routes are seen as guarded under their local name',
     ALL.filter(r => r.file.endsWith('demoAdmin.js'))
        .every(r => r.chain.some(g => r.admin.has(g) || ADMIN_SATISFIABLE.has(g))));
  ok('§3.3 requireAuth is no longer IMPORTED anywhere in src/api/admin/**',
     ADMIN_FILES.every(f => !/require\(['"]\.\.\/middleware\/requireAuth['"]\)/.test(strip(fs.readFileSync(f, 'utf8')))));
  ok('§3.4 …and it still EXISTS for the lanes that legitimately use it (not deleted estate-wide)',
     fs.existsSync(R('src/api/middleware/requireAuth.js')));
}

sec('§4 · NON-VACUITY — the sweep can actually see a foreign guard');
{
  const probe = "router.get('/x', requireAuth, requireAdmin, asyncHandler(async (req, res) => {";
  const toks  = (probe.split(',').slice(1).join(',').match(/\b[A-Za-z_$][\w$]*\b/g) || []);
  ok('§4.1 the chain extractor tokenises a stacked guard list', toks.includes('requireAuth'));
  ok('§4.2 the taxonomy classifies it as NOT admin-satisfiable', FOREIGN_GUARDS.has('requireAuth'));
  ok('§4.3 …and classifies requireAdmin as satisfiable', ADMIN_SATISFIABLE.has('requireAdmin'));
  ok('§4.4 the two sets are disjoint — no guard can be both',
     [...ADMIN_SATISFIABLE].every(g => !FOREIGN_GUARDS.has(g)));
  ok('§4.5 NON-VACUITY of the alias resolver: it binds a renamed admin guard',
     aliasesIn("const zzz = require('./requireAdmin');").admin.has('zzz'));
  ok('§4.6 …and unmasks a foreign guard hiding behind a friendly alias',
     aliasesIn("const requireAdminish = require('../middleware/requireAuth');").foreign.has('requireAdminish'));
}

sec('§5 · F-06.85 — the cures name the mechanisms they rest on');
{
  ok('§5.1 discover.js names the user-JWT guard and its file:line',
     /middleware\/requireAuth\.js:13/.test(read('src/api/admin/discover.js')));
  ok('§5.2 couture.js states WHY money movement was ruled in with its siblings',
     /lock with no key/.test(read('src/api/admin/couture.js')));
  ok('§5.3 couture.js names F-07.92 so the wanted second factor survives the cure',
     /F-07\.92/.test(read('src/api/admin/couture.js')));
  ok('§5.4 the refused fork is inked, never merely dropped',
     /F-07\.65/.test(read('src/api/admin/discover.js')));
}

sec('§6 · NON-VACUITY — every touched file parses');
for (const f of ['src/api/admin/discover.js', 'src/api/admin/featured.js', 'src/api/admin/couture.js']) {
  let clean = true;
  try { execFileSync(process.execPath, ['--check', R(f)], { stdio: 'pipe' }); } catch { clean = false; }
  ok(`§6.${path.basename(f)} parses clean`, clean);
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail === 0 ? 0 : 1);
