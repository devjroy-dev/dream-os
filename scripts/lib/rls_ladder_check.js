'use strict';
// scripts/lib/rls_ladder_check.js
// ═══════════════════════════════════════════════════════════════════════════════
// THE LADDER'S ROW-LEVEL-SECURITY RULE, IN ONE HOME. CE-44 · SEC-1 Part B.
// ═══════════════════════════════════════════════════════════════════════════════
//
// THE LAW IT READS, promoted into docs/TDW_BUILD_PROTOCOL.md in the CE-44 SEC-1
// amendment block on 20 September 2026, in that block's own words:
//
//     EVERY MIGRATION THAT CREATES A TABLE IN SCHEMA `public` ENABLES ROW LEVEL
//     SECURITY ON IT IN THE SAME TRANSACTION, as `0169` did. A migration that
//     creates a table in `public` and does not is REFUSED.
//
// WHY IT IS A CELL AND NOT A HABIT. 0170 closed the public schema to the browser
// key on 20 September (F-44.73). Two things hold that closure shut and only one
// of them is a fact about this tree: the dashboard's "Automatically expose new
// tables" switch, which is OFF and which a person can turn back on, and this law.
// SEC-1's residual is the reason the second one has to be mechanical —
// `supabase_admin`'s default privileges still grant `anon` and `authenticated` in
// `public` and the estate's editor may not alter them, so a table that arrives
// without RLS can still arrive readable.
//
// ── THE BOUNDARY IS FIXED HISTORY, NOT A COUNT (C-44.7) ──────────────────────
// This checker binds every migration numbered 0170 or above and NOTHING BELOW.
// The reason is a fact that cannot move: the law entered the protocol on
// 20 September 2026 and the committed ladder's tail at that moment was 0169, so
// 0170 is the first rung allocated at or after the law. The constant lives here,
// beside that sentence, and is never derived from the directory — a boundary that
// read the tree to decide its own scope would slide forward every time the ladder
// grew, which is the failure C-44.7 names.
//
// 0169 IS EVIDENCE, NOT SCOPE. It complies, it is the law's named specimen, and
// it sits below the boundary on purpose so that the boundary names the law's date
// rather than the last file that happened to comply. Ruled by the chair at CE-44.
//
// THE GROUND, derived at dream-os 9aacf33: of 153 numbered .sql files on the
// ladder, 61 create a table and exactly ONE of them (0169) enables row level
// security. Sixty files predate the law. A cell without a boundary would redden
// on all sixty and be deleted within a week.
//
// ── WHAT COUNTS AS A TABLE IN `public` ───────────────────────────────────────
// A BARE NAME IS `public`. Derived rather than assumed, by the chair at 9aacf33:
// the ladder holds 97 CREATE TABLE statements, 42 of them `if not exists <bare>`,
// 40 `if not exists public.`, 15 `<bare>`; NO file sets `search_path`; and no
// engine table is created in this ladder. So an unqualified name resolves to
// `public` in this estate, and the `search_path` arm below is what keeps that
// true rather than lucky.
//
// A NAME QUALIFIED TO ANYTHING ELSE IS OUT OF SCOPE. `engine.x` is a separate
// plane with its own witness (docs/db/ENGINE_SCHEMA.md) and its own grants; the
// SEC-1 census shows the public roles holding nothing on all 25 engine tables.
// Judging it here would manufacture violations against a plane this law does not
// speak about.
//
// TEMP AND TEMPORARY TABLES ARE OUT OF SCOPE. A temporary table lives in a
// per-session `pg_temp_*` schema that no other role can address, so there is
// nothing for RLS to close.
//
// A TABLE CREATED AND DROPPED IN THE SAME FILE NEEDS NO LINE. This is a ruling
// and not an oversight, so it is stated: the ladder is pasted into the editor as
// one transaction per file, DDL in Postgres is transactional, and a table that
// does not survive its own file was never visible to another session. Pinned as a
// fixture in b91 so the day someone disagrees, the disagreement is with a named
// decision rather than with an accident.
//
// ── THE ONE ANSWER THIS CHECKER REFUSES TO GUESS ─────────────────────────────
// A file at or above the boundary that SETS `search_path` is reported as a
// violation of its own kind, `search_path_set`, whose message is "cannot judge".
// Under another search path a bare name is not `public`, and every judgement this
// file makes about bare names would be a guess wearing a verdict's clothes. No
// such file exists today. The arm exists so that the first one is a red cell and
// a conversation, never a silent wrong answer. C-44.4's principle applied to the
// checker's own blind spot rather than only to its empty result.
//
// ── WHY THIS DOES NOT USE scripts/lib/stripComments.js ───────────────────────
// That module is the estate's one comment stripper for JS, TS and JSX, and its
// rules are that language's: `//`, `/* */` which do not nest, and backtick
// templates. SQL's are different in four ways that all matter here — `--` to end
// of line, block comments that DO nest in Postgres, single-quoted literals that
// escape by doubling, and dollar-quoted bodies. Reusing the JS scanner on SQL
// would be a second home for a rule it does not hold, so the SQL scanner is
// written here, declared, and canaried in b91 rather than borrowed.
//
// STRIPPING IS NOT COSMETIC. 0170's own header names `leads`, `invoices`,
// `contracts`, `vendors` and thirty more tables inside `--` comments, and its
// body contains the word `public` roughly two hundred times. A checker reading
// raw text convicts on the explanation.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

/** The ruled boundary. See the header: fixed history, never derived. */
const BOUNDARY = 170;

/** `0170_public_schema_lockdown.sql` → 170; anything unnumbered → null. */
function ladderNumber(fileName) {
  const m = /^(\d{4})_.*\.sql$/.exec(fileName);
  return m ? Number(m[1]) : null;
}

// ── THE SQL SCANNER ──────────────────────────────────────────────────────────
// Comments become spaces and newlines are preserved, so a reported line number is
// the source's line number. Single-quoted literals and dollar-quoted bodies are
// emptied rather than removed, so `'public.leads'` in a string cannot be read as
// a statement while the statement around it keeps its shape. DOUBLE-QUOTED TEXT
// SURVIVES WHOLE, because in SQL that is an identifier and this checker's whole
// job is reading identifiers.
function stripSql(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];

    if (c === '-' && d === '-') {                       // line comment
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {                       // block comment, NESTING
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (src[i] === '/' && src[i + 1] === '*') { depth++; i += 2; continue; }
        if (src[i] === '*' && src[i + 1] === '/') { depth--; i += 2; continue; }
        if (src[i] === '\n') out += '\n';
        i++;
      }
      out += ' ';
      continue;
    }
    if (c === "'") {                                    // literal, '' escapes
      i++;
      while (i < n) {
        if (src[i] === "'" && src[i + 1] === "'") { i += 2; continue; }
        if (src[i] === "'") { i++; break; }
        if (src[i] === '\n') out += '\n';
        i++;
      }
      out += "''";
      continue;
    }
    if (c === '"') {                                    // identifier — KEPT
      out += '"';
      i++;
      while (i < n) {
        if (src[i] === '"' && src[i + 1] === '"') { out += '""'; i += 2; continue; }
        if (src[i] === '"') { out += '"'; i++; break; }
        out += src[i];
        i++;
      }
      continue;
    }
    const dollar = /^\$([A-Za-z_]\w*)?\$/.exec(src.slice(i, i + 64));
    if (dollar) {                                       // dollar-quoted body
      const tag = dollar[0];
      const end = src.indexOf(tag, i + tag.length);
      const body = end === -1 ? src.slice(i + tag.length) : src.slice(i + tag.length, end);
      out += tag + tag;
      for (const ch of body) if (ch === '\n') out += '\n';
      i = end === -1 ? n : end + tag.length;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// ── IDENTIFIERS ──────────────────────────────────────────────────────────────
const IDENT = '(?:"(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)';
const QUALIFIED = `(?:${IDENT})(?:\\s*\\.\\s*(?:${IDENT}))?`;

/** Unquoted names fold to lower case, as Postgres folds them; quoted names keep
 *  their bytes, as Postgres keeps them. `"Leads"` and `leads` are NOT the same
 *  table and this function is the only place that decides so. */
function normIdent(raw) {
  const s = raw.trim();
  if (s.startsWith('"')) return s.slice(1, -1).replace(/""/g, '"');
  return s.toLowerCase();
}

/** `public . "Foo"` → { schema: 'public', table: 'Foo' }; a bare name → schema
 *  `public`, for the reason given in the header. */
function parseQualified(raw) {
  const parts = [];
  let buf = '';
  let inQuote = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQuote) {
      buf += c;
      if (c === '"' && raw[i + 1] === '"') { buf += '"'; i++; continue; }
      if (c === '"') inQuote = false;
      continue;
    }
    if (c === '"') { inQuote = true; buf += c; continue; }
    if (c === '.') { parts.push(buf); buf = ''; continue; }
    buf += c;
  }
  parts.push(buf);
  const names = parts.map(normIdent).filter((s) => s.length);
  if (names.length === 1) return { schema: 'public', table: names[0], qualified: false };
  return { schema: names[0], table: names[names.length - 1], qualified: true };
}

// ── THE THREE STATEMENTS THIS CHECKER READS ──────────────────────────────────
// CREATE [ [GLOBAL|LOCAL] {TEMP|TEMPORARY} | UNLOGGED ] TABLE [IF NOT EXISTS] name
const RE_CREATE = new RegExp(
  '\\bcreate\\s+'
  + '(?:(?:global|local)\\s+)?'
  + '(?:(temp|temporary)\\s+)?'
  + '(?:unlogged\\s+)?'
  + 'table\\s+'
  + '(?:if\\s+not\\s+exists\\s+)?'
  + `(${QUALIFIED})`,
  'gi',
);
// ALTER TABLE [IF EXISTS] [ONLY] name ENABLE ROW LEVEL SECURITY
const RE_ENABLE = new RegExp(
  '\\balter\\s+table\\s+'
  + '(?:(?:if\\s+exists|only)\\s+)*'
  + `(${QUALIFIED})`
  + '\\s+enable\\s+row\\s+level\\s+security',
  'gi',
);
// DROP TABLE [IF EXISTS] name [, name ...] [CASCADE|RESTRICT]
const RE_DROP = new RegExp('\\bdrop\\s+table\\s+(?:if\\s+exists\\s+)?([^;]*)', 'gi');
// The blind spot. Both spellings, because `set_config` is a statement too.
const RE_SEARCH_PATH = /\bset\s+(?:local\s+|session\s+)?search_path\b|set_config\s*\(\s*''/i;

/** Every `public` table this file creates, as { table, temp }. */
function createdTables(stripped) {
  const out = [];
  RE_CREATE.lastIndex = 0;
  let m;
  while ((m = RE_CREATE.exec(stripped))) {
    const temp = Boolean(m[1]);
    const { schema, table, qualified } = parseQualified(m[2]);
    out.push({ table, schema, temp, qualified, index: m.index });
  }
  return out;
}

/** `blind` is set when the file changes `search_path`: a bare ALTER TABLE is then
 *  not known to name a table in `public`, so only qualified lines are honoured. */
function enabledTables(stripped, blind = false) {
  const out = new Set();
  RE_ENABLE.lastIndex = 0;
  let m;
  while ((m = RE_ENABLE.exec(stripped))) {
    const q = parseQualified(m[1]);
    if (blind && !q.qualified) continue;
    out.add(q.table);
  }
  return out;
}

function droppedTables(stripped) {
  const out = new Set();
  RE_DROP.lastIndex = 0;
  let m;
  while ((m = RE_DROP.exec(stripped))) {
    for (const piece of m[1].split(',')) {
      const name = piece.replace(/\b(cascade|restrict)\b/gi, '').trim();
      if (name) out.add(parseQualified(name).table);
    }
  }
  return out;
}

function lineOf(stripped, index) {
  return stripped.slice(0, index).split('\n').length;
}

/**
 * Judge ONE file's bytes. `fileName` decides only whether the file is in scope;
 * the judgement itself is entirely from `text`.
 * @returns {{ inScope: boolean, number: number|null, created: number,
 *             violations: Array<{file:string,kind:string,table?:string,line?:number,message:string}> }}
 */
function checkSql(fileName, text) {
  const number = ladderNumber(fileName);
  if (number === null || number < BOUNDARY) {
    return { inScope: false, number, created: 0, violations: [] };
  }
  const stripped = stripSql(text);
  const violations = [];

  if (RE_SEARCH_PATH.test(stripped)) {
    violations.push({
      file: fileName,
      kind: 'search_path_set',
      message: `${fileName} sets search_path, so this checker CANNOT JUDGE whether its `
             + 'unqualified table names are in public. Qualify every name in this file, or '
             + 'bring the file to the chair. A guess here would be a wrong verdict in a '
             + 'green cell.',
    });
  }

  // WHEN THE FILE IS BLIND, THE REFUSAL TRAVELS ALONE. The first cut of this
  // function reported the `cannot judge` violation AND went on to convict every
  // bare name in the file, which is a guess printed beside the sentence saying a
  // guess is not available. Under an unknown search path a bare name is not known
  // to be in `public` and a bare ENABLE line is not known to close one, so under
  // `blind` only SCHEMA-QUALIFIED `public.` statements are judged, on both sides.
  // Caught by running the falsification, not by re-reading the code.
  const blind = violations.length > 0;

  const created = createdTables(stripped);
  const enabled = enabledTables(stripped, blind);
  const dropped = droppedTables(stripped);
  let counted = 0;

  for (const c of created) {
    if (c.temp) continue;                  // per-session schema; nothing to close
    if (c.schema !== 'public') continue;   // another plane, another witness
    if (blind && !c.qualified) continue;   // cannot judge; the refusal above is the report
    counted++;
    if (dropped.has(c.table)) continue;    // did not survive its own transaction
    if (enabled.has(c.table)) continue;
    violations.push({
      file: fileName,
      kind: 'rls_missing',
      table: c.table,
      line: lineOf(stripped, c.index),
      message: `${fileName}:${lineOf(stripped, c.index)} creates public.${c.table} and never `
             + `says ALTER TABLE public.${c.table} ENABLE ROW LEVEL SECURITY. Every migration `
             + 'that creates a table in public enables row level security on it in the same '
             + 'transaction (CE-44 SEC-1, docs/TDW_BUILD_PROTOCOL.md).',
    });
  }

  return { inScope: true, number, created: counted, violations };
}

/**
 * Judge a whole migrations directory. Read-only: this function opens files and
 * never writes, so it is safe against the real `db/migrations` and against any
 * temp tree a bench builds for it.
 */
function checkLadder(dir) {
  const entries = fs.readdirSync(dir).sort();
  const scanned = [];
  const violations = [];
  for (const name of entries) {
    const number = ladderNumber(name);
    if (number === null || number < BOUNDARY) continue;
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) continue;
    const r = checkSql(name, fs.readFileSync(full, 'utf8'));
    scanned.push({ file: name, number, created: r.created });
    violations.push(...r.violations);
  }
  return { boundary: BOUNDARY, scanned, violations };
}

module.exports = {
  BOUNDARY,
  ladderNumber,
  stripSql,
  normIdent,
  parseQualified,
  checkSql,
  checkLadder,
};
