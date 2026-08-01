#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b07_f0776_doors_bench.js
// F-05.48 SLICE ONE (F-07.76) + F-07.77 — THE DOORS READ THEIR RESULTS, AND THE
// TRAPDOORS DIE.
//
// Runnable from any working directory (Q-SP-5): every path resolves off __dirname.
//
// ── WHAT THIS BENCH IS FOR ───────────────────────────────────────────────────
// Two diseases, one delivery:
//   F-05.48 slice one — `sendWhatsApp` returns {sent:false} on THREE of its four
//     exits and only the fourth throws. Doors that discarded the return reported
//     deliveries that never happened; one of them (collab) wrote that lie into a
//     database column.
//   F-07.77 — four `process.env.X || '<literal>'` secret fallbacks standing in a
//     PUBLIC repository.
//
// ── THE SECRET-HYGIENE LAW, BINDING THIS FILE ────────────────────────────────
// The retired values appear NOWHERE in this bench. Every trapdoor cell asserts the
// ABSENCE OF A PATTERN — a quote-opening `||` fallback adjacent to the env read —
// never the presence or absence of a particular string. A bench that named the old
// password would re-introduce it to the public repo in the act of proving it gone.
//
// ── THE CANARY (§0, CE-120's law) ────────────────────────────────────────────
// This bench uses a comment stripper. F-07.74 proved the estate's inherited
// stripper swallows live code from an `accept="image/*"`-shaped `/*` to the next
// `*/`. §0 asserts three known presences survive stripping — head, waist and tail
// of each stripped file — so a future swallow REDDENS here instead of acquitting.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const fs   = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);

const CONCIERGE   = P('src/api/couple/concierge.js');
const COLLAB      = P('src/api/vendor/collab.js');
const DEMOADMIN   = P('src/api/admin/demoAdmin.js');
const REQADMIN    = P('src/api/admin/requireAdmin.js');
const ADMINMW     = P('src/admin/middleware.js');
const WHATSAPP    = P('src/lib/whatsapp.js');
const DEMOALERT   = P('src/lib/discover/demoLeadAlert.js');

const read = (f) => fs.readFileSync(f, 'utf8');

// ── THE STRIPPER, AMENDED PER F-07.74 ────────────────────────────────────────
// A `/*` opens a block comment ONLY at line start or after a delimiter — never
// mid-token, so `accept="image/*"` and `${x}/*y*/` cannot open a false block.
function strip(src) {
  let out = '';
  let i = 0, inBlock = false, inLine = false, inStr = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i += 2; } else { if (c === '\n') out += c; i++; } continue; }
    if (inStr) { if (c === '\\') { out += c + (n || ''); i += 2; continue; } if (c === inStr) inStr = null; out += c; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; out += c; i++; continue; }
    if (c === '/' && n === '/') { inLine = true; i += 2; continue; }
    if (c === '/' && n === '*') {
      const prev = out.replace(/[ \t]+$/, '').slice(-1);
      if (prev === '' || '(){};,=:+&|?!\n[<'.includes(prev)) { inBlock = true; i += 2; continue; }
    }
    out += c; i++;
  }
  return out;
}

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log(`  PASS  ${name}`); }
  catch (e) { fail++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};
const section = (s) => console.log(`\n${s}`);

// ═════════════════════════════════════════════════════════════════════════════
section('§0 · THE CANARY — the stripper must not swallow live code (CE-120 law)');
// ═════════════════════════════════════════════════════════════════════════════
// Head/waist/tail anchors per stripped file. Each is LIVE CODE, not a comment, so
// a stripper that eats a region eats one of these and this section reddens.
const CANARIES = [
  [CONCIERGE, ["const express          = require('express')", 'const waBody = [', 'module.exports = router;']],
  [COLLAB,    ["const { sendWhatsApp } = require('../../lib/whatsapp')", "if (action === 'interested') {", 'module.exports = router;']],
  [DEMOADMIN, ["const express = require('express')", 'function requireAdminPassword(req, res, next) {', 'module.exports = router;']],
  [REQADMIN,  ['function signSession(password) {', 'function requireAdmin(req, res, next) {', 'module.exports = requireAdmin;']],
  [ADMINMW,   ['function signSession(password) {', 'function handleLogin(req, res) {', 'module.exports = { requireAuth, handleLogin };']],
];
for (const [f, anchors] of CANARIES) {
  const stripped = strip(read(f));
  anchors.forEach((a, k) => t(`§0.${path.basename(f)}[${k}] canary survives stripping: ${a.slice(0, 46)}`, () => {
    assert.ok(stripped.includes(a), `stripper swallowed a live anchor in ${path.basename(f)} — F-07.74's class returned`);
  }));
}
// ── §0.X — THE CANARY AIMED AT THE STRIPPER, not at the sources (labeled) ────
// The first draft planted an F-07.74-shaped `/*` in production source and expected
// a red; it stayed green, correctly — the AMENDED stripper is immune, which is the
// whole point of the amendment. The regression this canary must catch is the
// STRIPPER reverting to the naive rule, so the cell drives that directly.
t('§0.X the amended stripper does NOT open a block on a mid-token /*', () => {
  const specimen = 'const a = 1;\nconst input = { accept: "image/*" };\nconst KEEP_ME = 2;\n/* real */\nconst ALSO_KEEP = 3;\n';
  const out = strip(specimen);
  assert.ok(out.includes('KEEP_ME') && out.includes('ALSO_KEEP'),
    'the stripper swallowed live code from an accept="image/*" — F-07.74 reproduced in this very bench');
});
t('§0.Y vacuity: the NAIVE rule WOULD swallow that specimen', () => {
  const naive = 'const a = 1;\nconst input = { accept: "image/*" };\nconst KEEP_ME = 2;\n/* real */\nconst ALSO_KEEP = 3;\n'
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!naive.includes('KEEP_ME'),
    'the naive rule no longer swallows — §0.X would be vacuous and this bench would be lying');
});

// ═════════════════════════════════════════════════════════════════════════════
section('§1 · THE TRANSPORT CONTRACT — derived, never assumed');
// ═════════════════════════════════════════════════════════════════════════════
const wa = strip(read(WHATSAPP));
t('§1.1 sendWhatsApp has exactly THREE `sent: false` return exits', () => {
  const n = (wa.match(/sent:\s*false/g) || []).length;
  assert.strictEqual(n, 3, `expected 3 refusal exits, found ${n} — the doors below are written against 3`);
});
t('§1.2 sendWhatsApp has exactly ONE `sent: true` return exit', () => {
  const n = (wa.match(/sent:\s*true/g) || []).length;
  assert.strictEqual(n, 1, `expected 1 success exit, found ${n}`);
});
t('§1.3 the success exit carries a NULLABLE sid — so `.sid` is not a success oracle', () => {
  assert.ok(/wamid\s*=\s*res\s*&&\s*res\.wamid\s*\?\s*res\.wamid\s*:\s*null/.test(wa),
    'the wamid coalesce moved; every `sent === true` cell below rests on this being why .sid is unusable');
});
t('§1.4 the three refusal codes are the ones the doors name', () => {
  ['opted_out', 'meta_media_unsupported', 'no_meta_lane'].forEach(c =>
    assert.ok(wa.includes(`'${c}'`), `refusal code ${c} absent from the transport`));
});

// ═════════════════════════════════════════════════════════════════════════════
section('§2 · THE CONCIERGE DOOR — reads its send (F-05.48 slice one, fork 1b)');
// ═════════════════════════════════════════════════════════════════════════════
const con = strip(read(CONCIERGE));
t('§2.1 the send result is BOUND, not discarded', () => {
  assert.ok(/const\s+out\s*=\s*await\s+sendWhatsApp\(/.test(con), 'the concierge send is fire-and-forget again');
});
t('§2.2 NO bare `await sendWhatsApp(` survives anywhere in the door', () => {
  assert.ok(!/^\s*await\s+sendWhatsApp\(/m.test(con), 'a discarded send returned to the concierge door');
});
t('§2.3 success is decided on `sent === true`, STRICTLY — never on .sid', () => {
  assert.ok(/out\.sent\s*===\s*true/.test(con), 'the door no longer tests sent === true');
  assert.ok(!/out\.sid/.test(con), 'the door reads .sid, which whatsapp.js:142 admits as null on success');
});
t('§2.4 a refusal is LOUD — console.error naming the blocked code', () => {
  assert.ok(/admin notify REFUSED/.test(con) && /out\.blocked/.test(con),
    'a returned refusal no longer produces a loud log naming its code');
});
t('§2.5 a THROW is caught and named separately from a returned refusal', () => {
  assert.ok(/admin notify THREW/.test(con), 'the throw path lost its distinct log');
});
t('§2.6 admin_notified rides the JSON response (fork 1b operator-truth)', () => {
  assert.ok(/admin_notified:\s*adminNotified/.test(con), 'the response field is gone');
  assert.ok(/admin_notify_refusal:/.test(con), 'the refusal reason is gone from the response');
});
t('§2.7 the admin_activity_log insert is READ, not swallowed', () => {
  assert.ok(!/\.then\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)\.catch\(/.test(con), 'the swallowing then/catch returned');
  assert.ok(/logged\s*=\s*true/.test(con), 'the row outcome is no longer bound');
});
t('§2.8 FROZEN COPY — the couple-facing sentence is byte-identical', () => {
  assert.ok(con.includes("message: 'Our concierge will reach you at the earliest.'"),
    'the frozen couple sentence moved — this delivery is copy-zero by ruling');
});
t('§2.9 ZERO new couple-facing strings (expected-zero, accepted at ruling)', () => {
  // RE-AIMED AT THE MECHANISM, labeled: the first draft counted prose across the
  // WHOLE file and convicted the new console.error text. A log line is operator-
  // truth, not copy — fork 1(b)'s whole point. The couple-facing surface of this
  // door is exactly what leaves it in a response body, so the cell reads the
  // response objects and nothing else.
  const bodies = con.match(/res\.json\(\{[\s\S]*?\}\);/g) || [];
  assert.ok(bodies.length >= 2, 'the response bodies could not be extracted — the cell is blind');
  const allowed = ["'Our concierge will reach you at the earliest.'", "'Unauthorized.'"];
  bodies.join('\n').match(/'[^']{12,}'/g)?.forEach(s =>
    assert.ok(allowed.includes(s), `an unapproved couple-facing string reached a response body: ${s}`));
});

// ═════════════════════════════════════════════════════════════════════════════
section('§3 · THE COLLAB STAMP — the claimed-truth cure (fork 2b)');
// ═════════════════════════════════════════════════════════════════════════════
const col = strip(read(COLLAB));
t('§3.1 the poster send result is BOUND', () => {
  assert.ok(/const\s+notifyOut\s*=\s*await\s+sendWhatsApp\(/.test(col), 'the poster notify is fire-and-forget again');
});
t('§3.2 poster_notified_at is written INSIDE a `sent === true` guard', () => {
  const i = col.indexOf('notifyOut.sent === true');
  const j = col.indexOf('poster_notified_at');
  assert.ok(i > -1, 'the sent === true guard is gone');
  assert.ok(j > i, 'the stamp is no longer beneath its guard — the claimed-truth defect returned');
});
t('§3.3 the stamp is WRITTEN at exactly ONE site (no ungated second writer)', () => {
  // RE-AIMED AT THE MECHANISM, labeled: the first draft counted every mention of
  // the column name and convicted the new refusal log, which names the column on
  // purpose ("LEFT NULL"). A WRITE is the key form `poster_notified_at:`; a mention
  // in prose is not. The subject — one writer, and it sits under the guard — is
  // unchanged; only the spelling moved.
  const n = (col.match(/poster_notified_at\s*:/g) || []).length;
  assert.strictEqual(n, 1, `poster_notified_at WRITTEN at ${n} sites; the guard covers one`);
});
t('§3.4 a refused poster notify is LOUD and says the column was left NULL', () => {
  assert.ok(/poster notify REFUSED/.test(col) && /LEFT NULL/.test(col),
    'the refusal log no longer states the column consequence');
});
t('§3.5 the FROZEN vetoed collab string is byte-identical (CE-59 veto ledger)', () => {
  assert.ok(col.includes('is interested in your ${post.requirement_type} collab for ${dateStr}'),
    'the founder-vetoed collab copy moved');
});
t('§3.6 SCOPE HELD — the two connect-notify sends at the accept path are UNTOUCHED', () => {
  // Ruled: fork 2(c) is F-05.48's later slices. These two must still be bare.
  const bare = (col.match(/^\s*await\s+sendWhatsApp\(/gm) || []).length;
  assert.strictEqual(bare, 2, `expected exactly 2 out-of-scope bare sends still standing, found ${bare}`);
});

// ═════════════════════════════════════════════════════════════════════════════
section('§4 · THE GOLD STANDARD — the pattern this slice copied still stands');
// ═════════════════════════════════════════════════════════════════════════════
const gold = strip(read(DEMOALERT));
t('§4.1 demoLeadAlert still stamps only after a send (the stated pattern)', () => {
  const iSend = gold.indexOf('await sendWa(');
  const iStamp = gold.indexOf('last_template_at: stamp');
  assert.ok(iSend > -1 && iStamp > iSend, 'the in-tree gold standard inverted — this slice cites it in-comment');
});

// ═════════════════════════════════════════════════════════════════════════════
section('§5 · THE TRAPDOORS — absence of pattern, never a value (F-07.77)');
// ═════════════════════════════════════════════════════════════════════════════
// THE TRIPWIRE. Each cell asserts that NO code line pairs a secret-shaped env read
// with a quote-opening `||` fallback. Comment lines are excluded deliberately: the
// cure's own in-file paragraphs quote the retired SHAPE (never a value) to say what
// was there, and a tripwire that cannot tell a comment from code would forbid the
// estate from documenting its own cures.
const SECRET_FALLBACK = /process\.env\.[A-Z_]*(?:PASSWORD|SECRET)[A-Z_]*\s*\|\|\s*['"`]./;
const PHONE_FALLBACK  = /process\.env\.ADMIN_PHONE\s*\|\|\s*['"`]./;

function codeLines(f) {
  return strip(read(f)).split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
}
const TRAPDOOR_FILES = [
  ['concierge.js', CONCIERGE], ['demoAdmin.js', DEMOADMIN],
  ['requireAdmin.js', REQADMIN], ['admin/middleware.js', ADMINMW],
];
for (const [name, f] of TRAPDOOR_FILES) {
  t(`§5.${name} carries NO secret literal beside any env read`, () => {
    const hit = codeLines(f).find(l => SECRET_FALLBACK.test(l));
    assert.ok(!hit, `a secret-shaped literal fallback stands in ${name} — the trapdoor returned`);
  });
}
t('§5.concierge ADMIN_PHONE is env-only (fork 4b)', () => {
  const hit = codeLines(CONCIERGE).find(l => PHONE_FALLBACK.test(l));
  assert.ok(!hit, 'the ADMIN_PHONE literal returned — reach-by-accident restored');
});
t('§5.vacuity the tripwire FIRES on a planted secret-shaped fallback', () => {
  // Non-vacuity, proven in-cell with a value that is not and never was a secret.
  assert.ok(SECRET_FALLBACK.test("const X = process.env.ADMIN_PASSWORD || 'not-a-real-secret';"),
    'the tripwire regex cannot catch the shape it exists to catch');
  assert.ok(PHONE_FALLBACK.test("const P = process.env.ADMIN_PHONE || '+910000000000';"),
    'the phone tripwire regex is inert');
});

// ═════════════════════════════════════════════════════════════════════════════
section('§6 · FAIL-CLOSED — every door refuses when its env is absent');
// ═════════════════════════════════════════════════════════════════════════════
// Behavioural, not textual: the guard expressions are evaluated with the env absent.
// ── §6.1-6.3 RE-AIMED AT PRODUCTION SOURCE (labeled) ─────────────────────────
// The first draft of these three cells evaluated a truth table this bench had
// written by hand. Mutation M-7 — stripping the presence limb, i.e. shipping the
// exact naive cure the read-first convicted — left them ALL GREEN. A bench that
// re-types the guard proves the bench's opinion of the guard, never the guard.
// The expression is now EXTRACTED from concierge.js and evaluated as a function of
// (adminPw, adminWant), so any weakening of the shipped condition reddens here.
function conciergeGuard() {
  const m = strip(read(CONCIERGE)).match(/if\s*\(([^)]*adminWant[^)]*)\)\s*\{/);
  assert.ok(m, 'the concierge admin guard could not be extracted — the cell is blind, not green');
  // eslint-disable-next-line no-new-func
  return new Function('adminPw', 'adminWant', `return !!(${m[1]});`);   // true === REFUSED
}
t('§6.1 concierge /requests: no env, no header -> REFUSED (M-7 convicts here)', () => {
  assert.ok(conciergeGuard()(undefined, undefined),
    'the SHIPPED guard OPENS with no env and no header — the fail-open returned');
});
t('§6.2 concierge /requests: no env, header supplied -> REFUSED', () => {
  assert.ok(conciergeGuard()('anything', undefined), 'the SHIPPED guard opens to a guessed header');
});
t('§6.3 concierge /requests: env set, right header -> ADMITTED (non-vacuity)', () => {
  assert.ok(!conciergeGuard()('S', 'S'), 'the SHIPPED guard refuses a correct credential — it is not a door');
});
t('§6.3b concierge /requests: env set, WRONG header -> REFUSED', () => {
  assert.ok(conciergeGuard()('wrong', 'S'), 'the SHIPPED guard admits a wrong password');
});
t('§6.4 demoAdmin: no env -> REFUSED at the new explicit limb', () => {
  const src = strip(read(DEMOADMIN));
  assert.ok(/if\s*\(\s*!ADMIN_PASSWORD\s*\)/.test(src), 'demoAdmin lost its explicit absent-env refusal');
});
t('§6.5 requireAdmin: cookie limb refuses when either secret is absent', () => {
  const src = strip(read(REQADMIN));
  assert.ok(/if\s*\(\s*!ADMIN_PASSWORD\s*\|\|\s*!SESSION_SECRET\s*\)/.test(src),
    'requireAdmin would sign a cookie with an absent secret');
});
t('§6.6 requireAdmin: header limb refuses when ADMIN_PASSWORD is absent', () => {
  const src = strip(read(REQADMIN));
  assert.ok(/!ADMIN_PASSWORD\s*\|\|\s*header\s*!==\s*ADMIN_PASSWORD/.test(src), 'the header limb lost its presence check');
});
t('§6.7 admin/middleware handleLogin: no env -> NO cookie minted (the second fail-open)', () => {
  const src = strip(read(ADMINMW));
  assert.ok(/ADMIN_PASSWORD\s*&&\s*SESSION_SECRET\s*&&\s*password\s*&&\s*password\s*===\s*ADMIN_PASSWORD/.test(src),
    'handleLogin mints an admin cookie for an empty post with no env set');
});
t('§6.8 admin/middleware verifySession: no env -> false', () => {
  const src = strip(read(ADMINMW));
  assert.ok(/if\s*\(\s*!ADMIN_PASSWORD\s*\|\|\s*!SESSION_SECRET\s*\)\s*\{[\s\S]{0,320}?return false;/.test(src),
    'verifySession compares against a secret derived from "undefined"');
});

// ═════════════════════════════════════════════════════════════════════════════
section('§7 · F-07.82 — minted, named in-file, deliberately NOT cured here');
// ═════════════════════════════════════════════════════════════════════════════
t('§7.1 the reversible-encoding defect is named at its own function', () => {
  assert.ok(/F-07\.82/.test(read(REQADMIN)), 'F-07.82 is not named where signSession lives');
});
t('§7.2 signSession is STILL base64 — this delivery did not silently cure it', () => {
  assert.ok(/Buffer\.from\(raw\)\.toString\('base64'\)/.test(strip(read(REQADMIN))),
    'signSession changed shape — that is F-07.82s chartered micro, not this one');
});

// ═════════════════════════════════════════════════════════════════════════════
section('§8 · THE F-06.85 MECHANISM COMMENTS — conditioned prose names its fact');
// ═════════════════════════════════════════════════════════════════════════════
t('§8.1 concierge names the transport mechanism its paragraph rests on', () => {
  assert.ok(/F-06\.85[\s\S]{0,400}whatsapp\.js:133/.test(read(CONCIERGE)),
    'the concierge soul-sentence does not name its mechanism in-comment');
});
t('§8.2 collab names the transport mechanism its paragraph rests on', () => {
  assert.ok(/F-06\.85[\s\S]{0,400}whatsapp\.js/.test(read(COLLAB)),
    'the collab paragraph does not name its mechanism in-comment');
});

// ═════════════════════════════════════════════════════════════════════════════
section('§9 · NON-VACUITY — every touched file parses');
// ═════════════════════════════════════════════════════════════════════════════
for (const [n, f] of [...TRAPDOOR_FILES, ['collab.js', COLLAB]]) {
  t(`§9.${n} node --check clean`, () => {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail === 0 ? 0 : 1);
