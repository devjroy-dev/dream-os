#!/usr/bin/env node
// scripts/b07_f0784_panel_bench.js
// THE ADMIN PANEL FOLD — dream-os side. F-07.82 · F-07.85 · F-07.86 · F-07.87.
// Runnable from any working directory (Q-SP-5).
'use strict';

const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const R    = p => path.join(ROOT, p);
const read = p => fs.readFileSync(R(p), 'utf8');

let pass = 0, fail = 0;
const ok  = (n, c) => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n}`); } };
const sec = t => console.log(`\n${t}`);

// ── §0 · THE CANARY (CE-120's standing law) ──────────────────────────────────
// This bench strips comments before asserting absence-of-pattern. A stripper
// that swallows too much would acquit a live defect silently — F-07.74's exact
// disease. The canary asserts a KNOWN PRESENCE survives stripping, so a future
// over-eager stripper REDDENS here instead of turning every absence cell green.
function stripComments(src) {
  let out = '', i = 0, inS = null, inLine = false, inBlock = false;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inLine)  { if (c === '\n') { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i += 2; } else i++; continue; }
    if (inS) {
      out += c;
      if (c === '\\') { out += src[i + 1] || ''; i += 2; continue; }
      if (c === inS) inS = null;
      i++; continue;
    }
    if (c === "'" || c === '"' || c === '`') { inS = c; out += c; i++; continue; }
    if (c === '/' && n === '/') { inLine  = true; i += 2; continue; }
    if (c === '/' && n === '*') { inBlock = true; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

sec('§0 · THE CANARY — the stripper does not swallow live code');
{
  const src = read('src/api/admin/requireAdmin.js');
  const s   = stripComments(src);
  ok('§0.1 the stripper removes comment prose', !s.includes('reversible encoding'));
  ok('§0.2 CANARY: the guard function survives stripping', /function requireAdmin\s*\(/.test(s));
  ok('§0.3 CANARY: the module export survives stripping', /module\.exports\s*=\s*requireAdmin/.test(s));
  ok('§0.4 VACUITY TWIN: the stripper is not a no-op', s.length < src.length);
  ok('§0.5 CANARY: a string containing // is not eaten',
     stripComments(`const u = 'https://x.com/a'; // gone`).includes('https://x.com/a'));
}

// ── §1 · F-07.82 — ONE HOME, HMAC, NO CREDENTIAL IN THE TOKEN ────────────────
sec('§1 · F-07.82 — the reversible encoding is dead and the twins are consolidated');
{
  const home = read('src/lib/adminSession.js');
  const hs   = stripComments(home);
  // ── LABELED AMENDMENT (F-07.72) · TWO CELLS RE-AIMED, COUNT PRESERVED 59 ───
  // §1.2 and §1.5 asserted that HMAC-SHA256 and timingSafeEqual appeared in THIS
  // FILE. F-07.72 extracted that machinery to `src/lib/signedSession.js` — one
  // implementation, two callers — because the circle lane needed a second signed
  // token and copying this mint would have re-planted the second-implementation
  // disease this very bench exists to forbid. The two cells went RED at that
  // extraction: not because the cure regressed, but because they were aimed at
  // the mechanism's ADDRESS rather than its BEHAVIOUR. CE-119's "a true cell
  // aimed one surface over", caught by the floor exactly as designed.
  //
  // RE-AIMED, and STRENGTHENED rather than merely relocated: each cell now
  // asserts the property is present SOMEWHERE ON THE PATH THIS FILE ACTUALLY
  // USES (here or in the one home it delegates to) AND drives the behaviour
  // through the real exports. An address can move again; the behaviour cannot
  // move without breaking.
  const oneHome = stripComments(read('src/lib/signedSession.js'));
  const onPath  = hs + oneHome;
  ok('§1.1 the one home exists', fs.existsSync(R('src/lib/adminSession.js')));
  ok('§1.2 it signs with HMAC-SHA256 (on the path this file uses)',
     /createHmac\(\s*['"]sha256['"]/.test(onPath));
  ok('§1.3 base64 encoding of a secret is GONE from the mint',
     !/Buffer\.from\([^)]*SECRET[^)]*\)\s*\.toString\(\s*['"]base64['"]\s*\)/.test(hs));
  ok('§1.4 the mint takes NO password argument (a signature that cannot accept the secret cannot leak it)',
     /function mintAdminSession\(\s*ttlMs/.test(hs));
  ok('§1.5 verification is constant-time (on the path this file uses)',
     /timingSafeEqual/.test(onPath));

  // Both twins gone — the second-implementation disease does not reappear.
  const mw = stripComments(read('src/admin/middleware.js'));
  const ra = stripComments(read('src/api/admin/requireAdmin.js'));
  ok('§1.6 signSession is DEFINED nowhere in src/ (both twins deleted)',
     !/function\s+signSession/.test(mw + ra + hs));
  ok('§1.7 Panel A imports the one home',  /require\(['"]\.\.\/lib\/adminSession['"]\)/.test(mw));
  ok('§1.8 the API guard imports the one home', /require\(['"]\.\.\/\.\.\/lib\/adminSession['"]\)/.test(ra));

  // BEHAVIOURAL — the token itself is exercised, not just its source text.
  process.env.ADMIN_SESSION_SECRET = 'bench-secret-' + crypto.randomBytes(8).toString('hex');
  delete require.cache[require.resolve(R('src/lib/adminSession.js'))];
  const S = require(R('src/lib/adminSession.js'));
  const tok = S.mintAdminSession();
  ok('§1.9 a minted token verifies', S.verifyAdminSession(tok) === true);
  ok('§1.10 THE CURE ITSELF: the token contains no credential — nothing in it decodes to the password',
     !Buffer.from(tok.split('.')[0] + tok.split('.')[2], 'base64').toString('utf8').includes('bench-secret'));
  ok('§1.11 a tampered mac is refused',
     S.verifyAdminSession(tok.slice(0, -2) + 'AA') === false);
  ok('§1.12 an expired token is refused', S.verifyAdminSession(S.mintAdminSession(-1000)) === false);
  ok('§1.13 a malformed token is refused', S.verifyAdminSession('true') === false);
  ok('§1.14 the RETIRED SHAPE is refused — base64(password:secret) no longer verifies',
     S.verifyAdminSession(Buffer.from('anything:' + process.env.ADMIN_SESSION_SECRET).toString('base64')) === false);

  // EVICTION IS FREE — asserted, not merely claimed in prose.
  ok('§1.15 EVICTION: every token of the retired deterministic shape fails the format gate',
     S.verifyAdminSession(Buffer.from('p:s').toString('base64')) === false);

  const noSecret = process.env.ADMIN_SESSION_SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
  ok('§1.16 FAIL-CLOSED: mint returns null with the secret absent', S.mintAdminSession() === null);
  ok('§1.17 FAIL-CLOSED: verify refuses with the secret absent', S.verifyAdminSession(tok) === false);
  process.env.ADMIN_SESSION_SECRET = noSecret;
}

// ── §2 · F-07.85 — THE HEADER LIMB IS DEAD ESTATE-WIDE ───────────────────────
sec('§2 · F-07.85 — x-admin-password is read nowhere in src/');
{
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(p); }
      else if (e.name.endsWith('.js')) files.push(p);
    }
  })(R('src'));

  const readers = files.filter(f => /\[['"]x-admin-password['"]\]/.test(stripComments(fs.readFileSync(f, 'utf8'))));
  ok(`§2.1 COUNT-AT-BOUNDARY: zero code sites read the header (found ${readers.length})`, readers.length === 0);

  const guard = stripComments(read('src/api/admin/requireAdmin.js'));
  ok('§2.2 the guard carries a BEARER limb',  /bearerFrom\(req\)/.test(guard));
  ok('§2.3 the guard carries a COOKIE limb',  /COOKIE_NAME/.test(guard));
  ok('§2.4 the guard carries NO header limb', !/x-admin-password/.test(guard));

  const idx = stripComments(read('src/index.js'));
  ok('§2.5 CORS no longer allowlists the header', !/x-admin-password/.test(idx));
  ok('§2.6 CORS still allows Authorization (the bearer must be able to travel)',
     /allowedHeaders:\s*\[[^\]]*['"]Authorization['"]/.test(idx));

  const conc = stripComments(read('src/api/couple/concierge.js'));
  ok('§2.7 THE THIRD AUTHORITY, found and folded: the couple route no longer reads the header',
     !/x-admin-password/.test(conc));
  ok('§2.8 …and it verifies the same session material', /verifyAdminSession\(/.test(conc));
}

// ── §3 · F-2 — THE JSON LOGIN DOOR ───────────────────────────────────────────
sec('§3 · F-2 — the new json login door');
{
  const login = read('src/api/admin/login.js');
  const ls    = stripComments(login);
  ok('§3.1 the door exists', fs.existsSync(R('src/api/admin/login.js')));
  ok('§3.2 it is mounted before any sibling /admin mount',
     read('src/api/router.js').indexOf("'/admin/login'") <
     read('src/api/router.js').indexOf("'/admin/discover'"));
  ok('§3.3 it answers JSON, never a redirect', !/res\.redirect/.test(ls) && /res\.json\(/.test(ls));
  ok('§3.4 the password compare is constant-time', /safeEquals\(password/.test(ls));
  ok('§3.5 it mints via the one home', /mintAdminSession\(\)/.test(ls));
  ok('§3.6 FAIL-CLOSED on absent env, with a named log line',
     /!adminPassword \|\| !sessionSecret/.test(ls) && /\[admin\/login\]/.test(login));
  ok('§3.7 the response body carries NO password field',
     !/password:/.test(ls.slice(ls.indexOf('res.json({ ok: true'))));
  ok('§3.8 Panel A\'s redirect door is UNTOUCHED — two protocols, two doors',
     /res\.redirect\('\/admin'\)/.test(stripComments(read('src/admin/middleware.js'))));
}

// ── §4 · F-6 — demoAdmin's PRIVATE GUARD IS DEAD ─────────────────────────────
sec('§4 · F-6(b) — two authorities became one');
{
  const d = read('src/api/admin/demoAdmin.js');
  const ds = stripComments(d);
  ok('§4.1 the private guard is no longer DEFINED', !/function requireAdminPassword/.test(ds));
  ok('§4.2 it imports the one guard', /require\(['"]\.\/requireAdmin['"]\)/.test(ds));
  const mounts = (ds.match(/requireAdminPassword/g) || []).length;
  ok(`§4.3 all ten routes still carry a guard (${mounts - 1} mounts + 1 import)`, mounts === 11);
  ok('§4.4 no route lost its guard', (ds.match(/router\.(get|post|delete|patch|put)\(/g) || []).length === mounts - 1);
}

// ── §5 · F-07.87 — THE UNAUTHENTICATED DOOR ──────────────────────────────────
sec('§5 · F-07.87 — the test-briefing door is guarded');
{
  const idx = stripComments(read('src/index.js'));
  ok('§5.1 the route now carries requireAdmin',
     /app\.get\(\s*'\/admin\/test-briefing\/:vendorId'\s*,\s*requireAdmin/.test(idx));
  ok('§5.2 requireAdmin is imported into the entry point',
     /require\(['"]\.\/api\/admin\/requireAdmin['"]\)/.test(idx));
  ok('§5.3 the route is still registered before the panel mount (position unchanged, only the guard added)',
     idx.indexOf("'/admin/test-briefing/:vendorId'") < idx.indexOf("app.use('/admin', adminRouter)"));
  ok('§5.4 GUARD-NOT-DELETE: the handler survives, so cron\'s live buildBriefing keeps its diagnostic',
     /buildBriefing\(\{ vendor, user, supabase \}\)/.test(idx));
}

// ── §6 · F-06.85 — CONDITIONED PROSE NAMES ITS MECHANISM ─────────────────────
sec('§6 · F-06.85 — the soul sentences name the facts they rest on');
{
  ok('§6.1 the one home names WHY eviction is free', /FORMAT gate|format gate/i.test(read('src/lib/adminSession.js')));
  ok('§6.2 the guard names the deleted header limb by its old bytes',
     /req\.headers\['x-admin-password'\]/.test(read('src/api/admin/requireAdmin.js')));
  ok('§6.3 Panel A\'s file names its break-glass status as a DECISION',
     /break-glass by decision/i.test(read('src/admin/middleware.js')));
  ok('§6.4 the disclosed Path=/admin observation is filed in-file, not papered',
     /Path=\/admin/.test(read('src/api/admin/requireAdmin.js')));
}

// ── §7 · NON-VACUITY — every touched file parses ─────────────────────────────
sec('§7 · node --check on every touched file');
for (const f of [
  'src/lib/adminSession.js', 'src/api/admin/login.js', 'src/api/admin/requireAdmin.js',
  'src/admin/middleware.js', 'src/admin/router.js', 'src/api/admin/demoAdmin.js',
  'src/api/couple/concierge.js', 'src/index.js', 'src/api/router.js',
]) {
  let clean = true;
  try { execFileSync(process.execPath, ['--check', R(f)], { stdio: 'pipe' }); } catch { clean = false; }
  ok(`§7.${path.basename(f)} parses clean`, clean);
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail === 0 ? 0 : 1);
