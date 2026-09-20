#!/usr/bin/env node
'use strict';
// scripts/b91_rls_ladder_bench.js
// ═══════════════════════════════════════════════════════════════════════════════
// THE FLOOR CELL FOR THE RLS LADDER LAW. CE-44 · SEC-1 Part B.
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT IT GUARDS. docs/TDW_BUILD_PROTOCOL.md, CE-44 SEC-1 block: every migration
// that creates a table in schema `public` enables row level security on it in the
// same transaction. This bench is what makes that sentence cost something.
//
// ── WHY THE CONTROLS ARE THE POINT, NOT THE DECORATION (C-44.4) ──────────────
// The real ladder holds ONE file at or above the boundary today, and that file
// creates no table. So the honest cell over the real directory returns an empty
// list — and an empty list is exactly what a broken regex, a mis-parsed
// boundary, a typo in a filename filter or a checker that threw and was caught
// would also return. A cell whose empty answer and whose broken answer look the
// same is not evidence.
//
// So this bench proves the detector FIRES before it trusts the detector's
// silence. §3 plants a violating migration above the boundary and FAILS IF THE
// CHECKER DOES NOT REPORT IT. §4 plants the cured twin and fails if it does. §5
// plants the same violating bytes BELOW the boundary and fails if it is reported,
// which is the ruled boundary itself under test rather than described. §7 breaks
// the checker's own CREATE regex in an in-memory copy and proves §3's control
// goes silent — so the control is load-bearing rather than ornamental, and a
// future hand that loosens the regex reddens here.
//
// ── WHAT IT PINS, AND WHY EACH PIN CANNOT MOVE (C-44.7) ─────────────────────
//   · THE BOUNDARY: a constant in scripts/lib/rls_ladder_check.js, asserted here
//     to be 170, with its reason in that file's header. Fixed history: the law
//     entered the protocol on 20 September 2026 when the committed tail was 0169.
//   · 0170's BYTES: sha256 b3e0c972b15d00a6154435b4fa0e6e0e8d319230d068fae64ea0756cf9307ca6,
//     the hash SEC-1 recorded for the statements the founder actually ran. Both
//     copies are hashed against it and against each other, so the filed migration
//     cannot drift from the record of what ran. Bytes in their one permanent home.
//   · NOTHING is pinned to a count of a live module, to the ladder's tail, or to
//     base-against-working-tree. Three benches in this repo already pin the
//     ladder's tail (b10_p1:122, b10_p2:500, b10_p3:606) and all three have been
//     red since the tail passed 0112.
//
// ── WHAT IT NEVER DOES ───────────────────────────────────────────────────────
// It never writes inside the repository. Every plant lives in a directory under
// os.tmpdir() that this file creates and removes, and the mutation in §7 is an
// in-memory compile of a modified copy of the checker's source — the file on disk
// is opened for reading and nothing else. LESSON 3 in scripts/run-floor.sh is the
// reason: a bench killed mid-write leaves production source carrying its
// mutation, and the floor then measures a correct number over corrupted bytes.
//
// EXIT CODES, the estate's table: 0 pass · 1 fail · 2 unexpected throw.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const R = (p) => path.join(ROOT, p);

const CHECKER_REL = 'scripts/lib/rls_ladder_check.js';
const AS_RUN_REL = 'docs/db/queries/0170_public_schema_lockdown.AS-RUN.sql';
const FILED_REL = 'db/migrations/0170_public_schema_lockdown.sql';
const AS_RUN_SHA = 'b3e0c972b15d00a6154435b4fa0e6e0e8d319230d068fae64ea0756cf9307ca6';

// F-39.67 · AN UNEXPECTED THROW IS AN ERROR (2), NEVER A FAIL (1). The floor
// runner reads 2 as ERROR and gives it its own line, so a bench that stops
// asserting and starts crashing is a visible move rather than a steady red.
process.on('uncaughtException', (e) => {
  console.error('  b91 THREW: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});

let pass = 0;
let fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
};
const sec = (t) => console.log(`\n${t}`);

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const chk = require(R(CHECKER_REL));

// A violating migration and its cured twin. ONE pair of bytes, used by §3, §4,
// §5 and §7, so the four cells cannot drift apart into four different plants.
const VIOLATING = `-- bench fixture, temp tree only. Never applied anywhere.
CREATE TABLE IF NOT EXISTS public.b91_planted_control (
  id uuid PRIMARY KEY,
  note text
);
`;
const CURED = VIOLATING + 'ALTER TABLE public.b91_planted_control ENABLE ROW LEVEL SECURITY;\n';

const violationsFor = (name, text, checker = chk) => checker.checkSql(name, text).violations;
const namesIn = (vs) => vs.map((v) => `${v.kind}:${v.table || '-'}`).sort().join(',');

// ─────────────────────────────────────────────────────────────────────────────
sec('§0 · THE CHECKER LOADS, AND ITS BOUNDARY IS THE RULED ONE');
ok('§0.1 the checker module loads and exports checkSql and checkLadder',
  typeof chk.checkSql === 'function' && typeof chk.checkLadder === 'function');
ok('§0.2 the boundary is 170, the ruled constant', chk.BOUNDARY === 170, `read ${chk.BOUNDARY}`);
ok('§0.3 the boundary is a literal in the checker, not derived from the directory',
  /const BOUNDARY = 170;/.test(fs.readFileSync(R(CHECKER_REL), 'utf8')));
ok('§0.4 ladderNumber reads a rung and refuses an unnumbered file',
  chk.ladderNumber('0170_public_schema_lockdown.sql') === 170
  && chk.ladderNumber('MAYA_MODEL_FLIP_FORMS.sql') === null
  && chk.ladderNumber('OUT_OF_ORDER.json') === null);

// ─────────────────────────────────────────────────────────────────────────────
sec('§1 · THE SQL SCANNER — CANARIES, because the whole verdict rests on it');
{
  const commented = '-- CREATE TABLE public.ghost (id uuid);\nSELECT 1;\n';
  ok('§1.1 a CREATE TABLE inside a line comment is not a statement',
    violationsFor('0171_x.sql', commented).length === 0);
  ok('§1.2 a CREATE TABLE inside a nesting block comment is not a statement',
    violationsFor('0171_x.sql', '/* outer /* inner */ CREATE TABLE public.ghost (id uuid); */\nSELECT 1;\n').length === 0);
  ok('§1.3 a table name inside a string literal is not a statement',
    violationsFor('0171_x.sql', "SELECT 'CREATE TABLE public.ghost (id uuid);';\n").length === 0);
  ok('§1.4 a CREATE TABLE inside a dollar-quoted function body is not judged here',
    violationsFor('0171_x.sql', '$fn$ CREATE TABLE public.ghost (id uuid); $fn$;\n').length === 0);
  ok('§1.5 VACUITY TWIN: the same bytes WITHOUT stripping would convict — so §1.1 is not passing by accident',
    /create\s+table/i.test(commented) && !/create\s+table/i.test(chk.stripSql(commented)));
  ok('§1.6 stripping preserves line numbers',
    chk.stripSql('-- a\n-- b\nCREATE TABLE public.x (id uuid);\n').split('\n').length === 4);
}

// ─────────────────────────────────────────────────────────────────────────────
sec('§2 · THE REAL LADDER — READ-ONLY, AND ZERO VIOLATIONS');
{
  const res = chk.checkLadder(R('db/migrations'));
  console.log(`        in scope at or above ${res.boundary}: `
    + (res.scanned.map((s) => `${s.file} (${s.created} public table(s) created)`).join(', ') || 'none'));
  ok('§2.1 no migration at or above the boundary creates a public table without RLS',
    res.violations.length === 0,
    res.violations.map((v) => v.message).join(' | '));
  ok('§2.2 the scan is not vacuous: at least one file is in scope',
    res.scanned.length >= 1, `${res.scanned.length} in scope`);
  ok('§2.3 nothing below the boundary is judged — 0169 is evidence, not scope',
    !res.scanned.some((s) => s.number < 170));
}

// ─────────────────────────────────────────────────────────────────────────────
sec('§3 · 0170 IS FILED BYTE FOR BYTE AGAINST THE RECORD OF WHAT RAN');
{
  const asRun = fs.existsSync(R(AS_RUN_REL)) ? fs.readFileSync(R(AS_RUN_REL)) : null;
  const filed = fs.existsSync(R(FILED_REL)) ? fs.readFileSync(R(FILED_REL)) : null;
  ok('§3.1 the AS-RUN record is present', asRun !== null);
  ok('§3.2 the filed migration is present', filed !== null);
  ok('§3.3 the AS-RUN record still hashes to SEC-1\'s pin',
    asRun !== null && sha256(asRun) === AS_RUN_SHA, asRun && sha256(asRun));
  ok('§3.4 the filed migration hashes to the same pin — not re-authored, not tidied',
    filed !== null && sha256(filed) === AS_RUN_SHA, filed && sha256(filed));
  ok('§3.5 the two files are byte-identical to each other',
    asRun !== null && filed !== null && asRun.equals(filed));
  ok('§3.6 0170 creates no table, so it owes no RLS line of its own',
    filed !== null && chk.checkSql('0170_public_schema_lockdown.sql', filed.toString('utf8')).created === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
sec('§4 · THE PLANTED CONTROL (C-44.4) — THE CHECKER MUST REPORT IT');
let tmp = null;
try {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b91-rls-ladder-'));
  fs.writeFileSync(path.join(tmp, '0171_planted_violation.sql'), VIOLATING);
  const planted = chk.checkLadder(tmp);
  ok('§4.1 THE CONTROL FIRES: a public table created above the boundary with no RLS line is reported',
    planted.violations.length === 1 && planted.violations[0].kind === 'rls_missing'
    && planted.violations[0].table === 'b91_planted_control',
    `reported ${namesIn(planted.violations) || 'nothing'}`);
  ok('§4.2 the report names the file and the line a reader has to open',
    planted.violations.length === 1 && /0171_planted_violation\.sql:\d+/.test(planted.violations[0].message));

  // ── §5 · THE NEGATIVE CONTROL. A detector that reports everything is as
  // useless as one that reports nothing, and the difference between §4 and §5 is
  // one line of SQL.
  sec('§5 · THE NEGATIVE CONTROL — THE CURED TWIN MUST NOT BE REPORTED');
  fs.writeFileSync(path.join(tmp, '0171_planted_violation.sql'), CURED);
  ok('§5.1 adding the ENABLE line clears the same file',
    chk.checkLadder(tmp).violations.length === 0);

  // ── §6 · THE BOUNDARY UNDER TEST, not described.
  sec('§6 · THE BOUNDARY ITSELF — THE SAME BYTES BELOW 0170 STAY GREEN');
  fs.rmSync(path.join(tmp, '0171_planted_violation.sql'));
  fs.writeFileSync(path.join(tmp, '0169_planted_violation.sql'), VIOLATING);
  ok('§6.1 the identical violating bytes numbered 0169 are OUT OF SCOPE',
    chk.checkLadder(tmp).violations.length === 0);
  fs.rmSync(path.join(tmp, '0169_planted_violation.sql'));
  fs.writeFileSync(path.join(tmp, '0170_planted_violation.sql'), VIOLATING);
  ok('§6.2 the identical bytes numbered 0170 ARE in scope — the boundary is inclusive at 0170',
    chk.checkLadder(tmp).violations.length === 1);
  fs.rmSync(path.join(tmp, '0170_planted_violation.sql'));
  fs.writeFileSync(path.join(tmp, 'MAYA_MODEL_FLIP_FORMS.sql'), VIOLATING);
  fs.writeFileSync(path.join(tmp, 'OUT_OF_ORDER.json'), '{}\n');
  ok('§6.3 unnumbered entries are not rungs and are not judged',
    chk.checkLadder(tmp).violations.length === 0);
} finally {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
}

// ─────────────────────────────────────────────────────────────────────────────
sec('§7 · THE FORMS THE CHAIR REQUIRED — one fixture each, not a comment');
{
  const F = (name, text) => violationsFor(name, text);
  ok('§7.1 case-insensitive: lower-case DDL is caught',
    F('0171_x.sql', 'create table public.a (id uuid);\n').length === 1);
  ok('§7.2 case-insensitive: the ENABLE line in lower case clears it',
    F('0171_x.sql', 'create table public.a (id uuid);\nalter table public.a enable row level security;\n').length === 0);
  ok('§7.3 IF NOT EXISTS is a create',
    F('0171_x.sql', 'CREATE TABLE IF NOT EXISTS public.a (id uuid);\n').length === 1);
  ok('§7.4 a BARE name is public (no file in this ladder sets search_path)',
    F('0171_x.sql', 'CREATE TABLE a (id uuid);\n').length === 1
    && F('0171_x.sql', 'CREATE TABLE a (id uuid);\nALTER TABLE a ENABLE ROW LEVEL SECURITY;\n').length === 0);
  ok('§7.5 a bare create cleared by a schema-qualified ENABLE line, and the reverse',
    F('0171_x.sql', 'CREATE TABLE a (id uuid);\nALTER TABLE public.a ENABLE ROW LEVEL SECURITY;\n').length === 0
    && F('0171_x.sql', 'CREATE TABLE public.a (id uuid);\nALTER TABLE a ENABLE ROW LEVEL SECURITY;\n').length === 0);
  ok('§7.6 quoted identifiers: "public"."Odd Name" is caught and cleared by its own quoted ENABLE line',
    F('0171_x.sql', 'CREATE TABLE "public"."Odd Name" (id uuid);\n').length === 1
    && F('0171_x.sql', 'CREATE TABLE "public"."Odd Name" (id uuid);\nALTER TABLE "public"."Odd Name" ENABLE ROW LEVEL SECURITY;\n').length === 0);
  ok('§7.7 quoting is not folding: "Leads" is not cleared by a line about leads',
    F('0171_x.sql', 'CREATE TABLE public."Leads" (id uuid);\nALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;\n').length === 1);
  ok('§7.8 ALTER TABLE ONLY clears',
    F('0171_x.sql', 'CREATE TABLE public.a (id uuid);\nALTER TABLE ONLY public.a ENABLE ROW LEVEL SECURITY;\n').length === 0);
  ok('§7.9 ALTER TABLE IF EXISTS clears, and IF EXISTS ONLY together clear',
    F('0171_x.sql', 'CREATE TABLE public.a (id uuid);\nALTER TABLE IF EXISTS public.a ENABLE ROW LEVEL SECURITY;\n').length === 0
    && F('0171_x.sql', 'CREATE TABLE public.a (id uuid);\nALTER TABLE IF EXISTS ONLY public.a ENABLE ROW LEVEL SECURITY;\n').length === 0);
  ok('§7.10 a table qualified to another schema is out of scope — engine has its own witness',
    F('0171_x.sql', 'CREATE TABLE engine.records (id uuid);\n').length === 0);
  ok('§7.11 CREATE TEMP and CREATE TEMPORARY TABLE are out of scope',
    F('0171_x.sql', 'CREATE TEMP TABLE t (id uuid);\n').length === 0
    && F('0171_x.sql', 'CREATE TEMPORARY TABLE t2 (id uuid);\n').length === 0
    && F('0171_x.sql', 'CREATE LOCAL TEMPORARY TABLE t3 (id uuid);\n').length === 0);
  ok('§7.12 CREATE UNLOGGED TABLE is IN scope — it is a real table with real rows',
    F('0171_x.sql', 'CREATE UNLOGGED TABLE public.a (id uuid);\n').length === 1);
  ok('§7.13 a table created and DROPPED in the same file needs no line (ruled, not overlooked)',
    F('0171_x.sql', 'CREATE TABLE public.scratch (id uuid);\nDROP TABLE public.scratch;\n').length === 0
    && F('0171_x.sql', 'CREATE TABLE public.scratch (id uuid);\nDROP TABLE IF EXISTS scratch CASCADE;\n').length === 0);
  ok('§7.14 dropping a DIFFERENT table does not clear the created one',
    F('0171_x.sql', 'CREATE TABLE public.a (id uuid);\nDROP TABLE public.b;\n').length === 1);
  ok('§7.15 two tables, one cured: exactly the uncured one is reported',
    (() => {
      const vs = F('0171_x.sql',
        'CREATE TABLE public.a (id uuid);\nCREATE TABLE public.b (id uuid);\n'
        + 'ALTER TABLE public.a ENABLE ROW LEVEL SECURITY;\n');
      return vs.length === 1 && vs[0].table === 'b';
    })());
  ok('§7.16 a file that SETS search_path is reported as CANNOT JUDGE, never guessed at',
    (() => {
      const vs = F('0171_x.sql', 'SET search_path TO other, public;\nCREATE TABLE a (id uuid);\n');
      const sp = vs.find((v) => v.kind === 'search_path_set');
      return Boolean(sp) && /cannot judge/i.test(sp.message);
    })());
  ok('§7.16b SET LOCAL search_path is the same blind spot and is reported too',
    F('0171_x.sql', 'SET LOCAL search_path = other;\nSELECT 1;\n')
      .some((v) => v.kind === 'search_path_set'));
  ok('§7.16c THE REFUSAL TRAVELS ALONE: under a set search_path a BARE create is not convicted, '
    + 'because convicting it would be the guess the refusal says is unavailable',
    namesIn(F('0171_x.sql', 'SET search_path TO other;\nCREATE TABLE a (id uuid);\n')) === 'search_path_set:-');
  ok('§7.16d a SCHEMA-QUALIFIED public create is still judged under a set search_path — '
    + 'search_path cannot move a qualified name',
    namesIn(F('0171_x.sql', 'SET search_path TO other;\nCREATE TABLE public.a (id uuid);\n'))
      === 'rls_missing:a,search_path_set:-');
  ok('§7.16e and it is cleared only by a QUALIFIED enable line, never by a bare one',
    namesIn(F('0171_x.sql', 'SET search_path TO other;\nCREATE TABLE public.a (id uuid);\nALTER TABLE public.a ENABLE ROW LEVEL SECURITY;\n')) === 'search_path_set:-'
    && namesIn(F('0171_x.sql', 'SET search_path TO other;\nCREATE TABLE public.a (id uuid);\nALTER TABLE a ENABLE ROW LEVEL SECURITY;\n')) === 'rls_missing:a,search_path_set:-');
  ok('§7.17 no file on the real ladder at or above the boundary sets search_path today',
    chk.checkLadder(R('db/migrations')).violations.filter((v) => v.kind === 'search_path_set').length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
sec('§8 · MUTATIONS — the control is load-bearing, proven by breaking the checker');
{
  // The checker's source is compiled in memory with one byte-range replaced. The
  // file on disk is opened for READING only; nothing under the repository is
  // written at any point in this bench.
  const src = fs.readFileSync(R(CHECKER_REL), 'utf8');
  const loadMutated = (from, to) => {
    if (!src.includes(from)) return null;
    const m = new Module(R(CHECKER_REL), module);
    m.filename = R(CHECKER_REL);
    m.paths = Module._nodeModulePaths(path.dirname(R(CHECKER_REL)));
    m._compile(src.replace(from, to), R(CHECKER_REL));
    return m.exports;
  };

  const M1 = loadMutated("+ 'table\\\\s+'", "+ 'tabel\\\\s+'");
  ok('§8.1 M1 the CREATE regex broken: §4\'s planted control STOPS being reported — the control is real',
    M1 !== null && violationsFor('0171_x.sql', VIOLATING, M1).length === 0);

  const M2 = loadMutated('const BOUNDARY = 170;', 'const BOUNDARY = 99999;');
  ok('§8.2 M2 the boundary pushed past the ladder: the planted control falls out of scope',
    M2 !== null && M2.checkSql('0171_x.sql', VIOLATING).inScope === false);

  const M3 = loadMutated("if (c.temp) continue;", "if (false) continue;");
  ok('§8.3 M3 the temp exclusion removed: a TEMP table starts being convicted, so §7.11 is not vacuous',
    M3 !== null && violationsFor('0171_x.sql', 'CREATE TEMP TABLE t (id uuid);\n', M3).length === 1);

  const M4 = loadMutated("if (dropped.has(c.table)) continue;", "if (false) continue;");
  ok('§8.4 M4 the create-and-drop ruling removed: the dropped table starts being convicted, so §7.13 is not vacuous',
    M4 !== null && violationsFor('0171_x.sql', 'CREATE TABLE public.scratch (id uuid);\nDROP TABLE public.scratch;\n', M4).length === 1);

  const M5 = loadMutated("if (c.schema !== 'public') continue;", "if (false) continue;");
  ok('§8.5 M5 the other-plane exclusion removed: engine.records starts being convicted, so §7.10 is not vacuous',
    M5 !== null && violationsFor('0171_x.sql', 'CREATE TABLE engine.records (id uuid);\n', M5).length === 1);

  const M6 = loadMutated('if (blind && !c.qualified) continue;', 'if (false) continue;');
  ok('§8.6 M6 the blind arm removed: a bare create under a set search_path starts being convicted beside the refusal, so §7.16c is not vacuous',
    M6 !== null && violationsFor('0171_x.sql', 'SET search_path TO other;\nCREATE TABLE a (id uuid);\n', M6)
      .some((v) => v.kind === 'rls_missing'));

  ok('§8.7 the checker on disk is byte-unmoved after every mutation',
    fs.readFileSync(R(CHECKER_REL), 'utf8') === src);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n  ${fail ? 'RED' : 'GREEN'} — ${pass} passed, ${fail} failed.`);
if (fail) {
  console.log('  The ladder, the boundary or the detector moved. Read the FAIL lines above.');
  process.exit(1);
}
process.exit(0);
