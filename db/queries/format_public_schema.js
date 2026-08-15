#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════
// db/queries/format_public_schema.js
//
// The generator for public_schema_dump.sql's output — the COLUMN-SNAPSHOT half
// of docs/db/PUBLIC_SCHEMA.md. Twin of append_constraints_to_public_schema.js,
// which owns the CONSTRAINTS ADDENDUM half below the sentinel.
// TDW_05 P4, CE-63 (2026-07-23).
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
//
// docs/db/PUBLIC_SCHEMA.md's own header carries the law:
//
//     NEVER HAND-EDIT. A hand-edited snapshot is prose again, and prose is what
//     this file exists to kill.
//
// Until this file, that law was HALF-ENFORCED. The constraints addendum had a
// committed generator and could only enter through it. The column snapshot had
// none — so the half of the document that answers "what columns exist, of what
// type" entered by whatever means the sitting improvised, and the law protecting
// it was a sentence asking to be obeyed.
//
// That asymmetry is the same shape as the finding this whole document exists for.
// F-04.57 is about a schema fact travelling through short-term memory instead of a
// pipe; an executor's context window is that hazard wearing a different uniform.
// So: both halves now enter through committed pipes, or they do not enter.
//
//   node db/queries/format_public_schema.js \
//        <csv> <out.md> <YYYY-MM-DD> <ladder-tip> <repo-tip> [array-overlay.csv]
//
// e.g.
//   node db/queries/format_public_schema.js s0.csv docs/db/PUBLIC_SCHEMA.md \
//        2026-08-13 0123 f18234e
//
// ── EVERY SENTENCE IN THE HEADER IS NOW DERIVED (CE-32, 2026-08-13) ─────
//
// This script used to emit its own header as FROZEN PROSE. Three sentences were
// literals, written once and then re-emitted unchanged by every future regen:
//
//   · "The prior snapshot (2026-07-16, 57 tables) went twenty migrations stale"
//     — true when typed, and re-asserted verbatim by the 2026-07-23 run against
//     which it was already wrong.
//   · the ordinal-gap specimens ("vendors runs 1–34 then jumps to 43") — which by
//     2026-08-13 named a table that runs to 53.
//
// A generator that hardcodes facts about the data it is generating is the same
// defect as a document that hardcodes facts about the database. THE HEADER IS NOW
// COMPUTED: the prior snapshot's line is parsed out of the out.md this run is about
// to overwrite; the staleness distance is counted off db/migrations/; the ordinal
// gaps are found in the rows themselves; the standing ladder holes are derived, not
// listed. Nothing about this document's content is typed here twice.
//
// ── THE SELF-STALENESS SENTENCE ─────────────────────────────────────────
//
// The header now teaches its own expiry: it names the ladder tip it reflects and
// tells the reader that any migration file past that tip makes this document STALE
// for the tables those migrations touch. F-09.185 is why — a handover asserted
// public.messages at 18 columns on this document's word while prod had carried 20
// since 0105, and nothing in the document said "check whether I am still true."
// The ladder tip alone was a fact the reader had to think to use. Now it is an
// instruction the reader has to think to ignore.
//
// ── THE ARRAY OVERLAY (optional 6th argument, self-retiring) ────────────
//
// `information_schema.columns.data_type` renders every array as the bare word
// ARRAY. public_schema_dump.sql now uses format_type and does not have this
// problem — but a CSV captured BEFORE that change still carries the bare word, and
// the fix for it must not be a hand-edit of the document.
//
// So: an optional overlay CSV (table_name,column_name,full_type), founder-pasted
// from the database, applied MECHANICALLY and only to lines whose rendered type is
// exactly `ARRAY`. It is strict in both directions — an overlay row that matches
// nothing ABORTS (a stale overlay is a disagreement, not a silence), and any bare
// ARRAY left unresolved after the overlay ABORTS too. It retires itself: once the
// dump's own format_type expression has been through one regen, no line reads
// ARRAY, the overlay matches nothing, and passing it becomes an error that says so.
//
// ── WHAT IT REFUSES TO DO, AND THIS IS THE POINT ────────────────────────
//
// IT WILL NOT WRITE A CAPPED RESULT. public_schema_dump.sql carries a
// self-computing `tables_expected` — a scalar subquery the database evaluates and
// repeats on every row, structurally immune to the SQL editor's row cap. If
// rows_returned < tables_expected the cap bit, and this script EXITS NONZERO
// WITHOUT WRITING. The guard is re-run mechanically here rather than trusted from
// the founder's eye, because F-04.29's founding case is a result silently cut to 99
// rows that nobody noticed. A reference that returns a PARTIAL truth is the disease
// it was built to cure.
//
// ── IT DOES NOT OWN THE WHOLE FILE ──────────────────────────────────────
//
// Everything from the CONSTRAINTS-ADDENDUM sentinel onward is the sibling's
// property and is carried across VERBATIM on every run — read, held, re-appended
// byte-for-byte. This script rewrites the head and never the tail. Re-running is
// idempotent: the column snapshot is replaced, the addendum survives untouched.
//
// ── WHAT IS NOT COMMITTED, NAMED ────────────────────────────────────────
//
// The CSV is NOT committed, following the sibling exactly: the output lives in
// PUBLIC_SCHEMA.md and its raw result set lives nowhere. The re-run path is the
// SQL, not the CSV — which is why the SQL is the committed artifact and is
// founder-runnable on demand. A second home for the same facts is a home that goes
// stale silently.
// ════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');

const SENTINEL = '<!-- CONSTRAINTS-ADDENDUM:BEGIN — generated by db/queries/append_constraints_to_public_schema.js. Everything below this line is script-written. Do not hand-edit. -->';

// ── a CSV parser that handles quoted fields with embedded newlines ────────
// Written rather than depended on, for the sibling's stated reason: columns_detail
// is a multi-line string_agg carrying commas, quotes and newlines inside one field.
// A split(',') would shred it into silently wrong columns and still look green.
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r[0] || '').trim() !== '');
}

// ── THE LADDER, DERIVED ───────────────────────────────────────────────────
// Read off db/migrations/ at run time. Nothing about the ladder is typed into this
// file: not its tip, not its holes, not its length. A hole that gets filled or a
// migration that lands changes this output on the next run without anyone
// remembering to come back here.
function readLadder() {
  const dir = require('path').join(__dirname, '..', 'migrations');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
  const numbered = [], unnumbered = [];
  for (const f of files) {
    const m = f.match(/^(\d{4})_/);
    if (m) numbered.push({ n: Number(m[1]), file: f });
    else unnumbered.push(f);
  }
  numbered.sort((a, b) => a.n - b.n);
  const present = new Set(numbered.map(x => x.n));

  // The archive is a THIRD state and must be witnessed, not guessed. A number with
  // no file at the ladder's top level has two very different explanations — it was
  // archived, or there is no file anywhere — and only one of them is visible from
  // here. Calling both "never written" would be this generator asserting HISTORY
  // from a directory listing, which is the disease the whole document treats.
  const archiveDir = require('path').join(dir, 'archive');
  const archived = new Set();
  if (fs.existsSync(archiveDir)) {
    for (const f of fs.readdirSync(archiveDir)) {
      const m = f.match(/^(\d{4})_/);
      if (m) archived.add(Number(m[1]));
    }
  }

  const max = numbered.length ? numbered[numbered.length - 1].n : 0;
  const min = numbered.length ? numbered[0].n : 0;
  const gapsArchived = [], gapsAbsent = [];
  for (let i = min; i <= max; i++) {
    if (present.has(i)) continue;
    (archived.has(i) ? gapsArchived : gapsAbsent).push(i);
  }
  return {
    numbered, unnumbered: unnumbered.sort(), max, present,
    gaps: gapsArchived.concat(gapsAbsent).sort((a, b) => a - b),
    gapsArchived, gapsAbsent,
  };
}

const pad = n => String(n).padStart(4, '0');

// ---------------------------------------------------------------------------
// (M-SCHEMA-REG, R-34.41/.42/.43) THE OUT-OF-ORDER REGISTER — RENDERED, NOT HELD.
//
// F-SW.7 is why this function exists. F-SW.3's cure — "every migration filling a
// reserved hole must name itself in this header" — was itself WRITTEN INTO THIS
// HEADER as hand-authored prose. Everything above the sentinel is regenerated by
// main() below (:452-457 reads the old file and keeps ONLY the sentinel-onward
// tail), so the cure deleted itself on every run and survived purely because no
// regen happened to run between CE-32 and now. A cure that dies the first time
// the machine is used is not a cure; it is a note.
//
// So the DATA moves out to db/migrations/OUT_OF_ORDER.json — hand-authored, and
// legally so, because it is not a generated file. The PROSE moves in here, where
// NEVER HAND-EDIT is enforced by the pipe rather than requested by a sentence.
// This is the same shape the holes list already had at :382-386: derived where
// derivation is possible, hand-held only where it is not.
//
// The path is FIXED and read UNCONDITIONALLY, deliberately not an argv like the
// array overlay at :302. An optional argument that a regen run forgets writes a
// document with no register and no warning, exits zero, and looks cured. The
// overlay can afford optional — the header discloses it and it self-retires.
// The register is permanent and its absence is silent. Nothing to forget.
function readOutOfOrderRegister() {
  const p = require('path').join(__dirname, '..', 'migrations', 'OUT_OF_ORDER.json');
  if (!fs.existsSync(p)) {
    console.error('ABORT — db/migrations/OUT_OF_ORDER.json is MISSING.');
    console.error('        It is the out-of-order register (F-SW.7) and it is not optional.');
    console.error('        Writing this document without it would silently drop the register');
    console.error('        AND the warning paragraph that tells readers a register exists,');
    console.error('        which is the exact defect this file was created to end.');
    console.error('        NOTHING WAS WRITTEN.');
    process.exit(1);
  }
  let doc;
  try { doc = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) {
    console.error('ABORT — db/migrations/OUT_OF_ORDER.json is not parseable JSON: ' + e.message);
    console.error('        NOTHING WAS WRITTEN.');
    process.exit(1);
  }
  if (!doc || !Array.isArray(doc.register)) {
    console.error('ABORT — OUT_OF_ORDER.json has no `register` array.');
    console.error('        NOTHING WAS WRITTEN.');
    process.exit(1);
  }
  return doc.register;
}

// Both aborts are MANDATORY (R-34.43), and both are modelled on the overlay's
// refusal to apply a row that matches nothing (:233-260). A register row is a
// claim about the tree; a claim the tree does not support is not a typo to be
// rendered, it is a reason to write nothing at all.
function renderOutOfOrderRegister(out, ladder, ladderTip) {
  const register = readOutOfOrderRegister();
  const tipNum = Number(String(ladderTip).replace(/[^0-9]/g, ''));

  for (const r of register) {
    if (!Number.isInteger(r.number)) {
      console.error(`ABORT — OUT_OF_ORDER.json holds a record with no integer \`number\`: ${JSON.stringify(r)}`);
      console.error('        NOTHING WAS WRITTEN.');
      process.exit(1);
    }
    if (!ladder || !ladder.present.has(r.number)) {
      console.error(`ABORT — OUT_OF_ORDER.json names \`${pad(r.number)}\`, which has NO .sql file in db/migrations/.`);
      console.error('        A register row asserts that a migration exists and has been applied.');
      console.error('        The directory does not support that claim. Either the file was never');
      console.error('        committed, or the record is wrong. Both are worse than a missing row.');
      console.error('        NOTHING WAS WRITTEN.');
      process.exit(1);
    }
    if (!Number.isFinite(tipNum) || r.number >= tipNum) {
      console.error(`ABORT — OUT_OF_ORDER.json names \`${pad(r.number)}\`, which is NOT BELOW the ladder tip \`${ladderTip}\`.`);
      console.error('        Out-of-order MEANS below the tip: a migration that lands after the tip');
      console.error('        in time and before it in number. A record at or above the tip is caught');
      console.error('        by the ordinary staleness check above and does not belong here.');
      console.error('        NOTHING WAS WRITTEN.');
      process.exit(1);
    }
  }

  // COPY MOVE, NOT A REWRITE (M-SCHEMA-REG copy inventory). The warning paragraph
  // and the table header below are carried byte-unchanged from the hand-authored
  // region they replace. They are the reader's ONLY warning that the arithmetic
  // staleness test above has a blind spot, and they were as doomed as the rows.
  out.push('**\u26a0 THE RULE ABOVE HAS A BLIND SPOT, AND EVERY MIGRATION THAT ENTERS IT MUST NAME ITSELF HERE (F-SW.3, ruled CE-32).** "Newer than the ladder tip" is an ARITHMETIC test, and this estate holds nineteen reserved-but-empty numbers *below* its tip (listed above). A migration filling one of them lands AFTER the tip in time and BEFORE it in number, so it does not trip the check and this document goes on answering confidently about a table it no longer describes. The standing cure is that such a migration ships its own line into this header, in the same delivery, naming itself and the tables it touches. **A reader who checks only the arithmetic will be wrong; read this list too.**');
  out.push('');

  if (!register.length) {
    out.push('_No out-of-order migration is outstanding at this snapshot._');
    out.push('');
    return;
  }

  out.push('| out-of-order migration | tables it makes this document STALE for | state |');
  out.push('|---|---|---|');
  for (const r of register) {
    // The filename is DERIVED off the ladder, never typed into the register: a
    // renamed file changes this cell on the next run without anyone remembering.
    const file = ladder.numbered.find(x => x.n === r.number).file;
    out.push(`| \`${file}\` (${r.note}) | ${r.stale_for} | ${r.state} |`);
  }
  out.push('');
}

// The distance between two ladder tips, counted in migrations that actually exist
// on disk — never by subtracting the numbers, because the ladder has holes and a
// subtraction would count 0113, which was never written, as a migration that ran.
function ladderDistance(ladder, fromTip, toTip) {
  if (!ladder) return null;
  const a = Number(fromTip), b = Number(toTip);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return ladder.numbered.filter(x => x.n > a && x.n <= b).length;
}

// ── THE PRIOR SNAPSHOT, DERIVED ───────────────────────────────────────────
// Parsed out of the document this run is about to overwrite. The old code stated
// the prior snapshot as a literal and therefore stated it wrongly from the second
// run onward.
function readPriorSnapshot(outPath) {
  if (!fs.existsSync(outPath)) return null;
  const txt = fs.readFileSync(outPath, 'utf8');
  const d = txt.match(/\*\*Snapshot taken:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  const t = txt.match(/\*\*(\d+) tables, (\d+) columns\.\*\*/);
  const l = txt.match(/\*\*Applied ladder tip at snapshot:\*\*\s*`([^`]+)`/);
  // The clause this generator wrote LAST time, captured off a stable machine-written
  // marker. Needed so that re-running the formatter on the SAME snapshot carries the
  // predecessor forward instead of naming the file its own predecessor. A generator
  // whose output changes when you run it twice on one input is not a generator.
  const c = txt.match(/never archaeology\.(.*)$/m);
  if (!d || !t) return null;
  return {
    date: d[1], tables: Number(t[1]), columns: Number(t[2]),
    tip: l ? l[1] : null, clause: c ? c[1] : '',
  };
}

// ── THE ORDINAL GAPS, DERIVED ─────────────────────────────────────────────
// Found in the rows, never named in this file. A gap is a dropped column's
// fingerprint; which tables carry one is a fact about the snapshot, and a fact
// about the snapshot has no business being a literal in the generator.
function findOrdinalGaps(rows, iName, iDetail) {
  const out = [];
  for (const r of rows) {
    const ords = r[iDetail].split('\n')
      .map(l => Number((l.match(/^(\d+)\./) || [])[1]))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (!ords.length) continue;
    const missing = [];
    for (let i = 1; i <= ords[ords.length - 1]; i++) if (!ords.includes(i)) missing.push(i);
    if (missing.length) out.push({ table: r[iName], missing, last: ords[ords.length - 1] });
  }
  return out;
}

// ── THE ARRAY OVERLAY ─────────────────────────────────────────────────────
// Strict both ways. Returns the number of substitutions made, or exits nonzero.
function applyArrayOverlay(rows, iName, iDetail, overlayPath) {
  const parsed = parseCsv(fs.readFileSync(overlayPath, 'utf8'));
  const head = parsed.shift().map(h => h.trim());
  const iT = head.indexOf('table_name'), iC = head.indexOf('column_name'), iF = head.indexOf('full_type');
  if ([iT, iC, iF].some(i => i < 0)) {
    console.error('ABORT — array overlay must carry table_name,column_name,full_type. Got: ' + head.join(','));
    process.exit(1);
  }
  const want = parsed.filter(r => (r[iT] || '').trim())
    .map(r => ({ t: r[iT].trim(), c: r[iC].trim(), f: r[iF].trim(), hit: false }));

  let applied = 0;
  for (const r of rows) {
    const lines = r[iDetail].split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(\d+)\.\s+(\S+)\s+ARRAY(\b.*)?$/);
      if (!m) continue;
      const hitRow = want.find(w => w.t === r[iName] && w.c === m[2]);
      if (!hitRow) continue;
      lines[i] = `${m[1]}. ${m[2]} ${hitRow.f}${m[3] || ''}`;
      hitRow.hit = true;
      applied++;
    }
    r[iDetail] = lines.join('\n');
  }

  const stale = want.filter(w => !w.hit);
  if (stale.length) {
    console.error('ABORT — array overlay rows matched NOTHING in the snapshot:');
    stale.forEach(w => console.error(`        ${w.t}.${w.c}`));
    console.error('        An overlay that names a column the rows do not carry as ARRAY is a');
    console.error('        DISAGREEMENT between two witnesses, not a formatting detail.');
    console.error('        NOTHING WAS WRITTEN.');
    process.exit(1);
  }

  return applied;
}

// ── NO BARE `ARRAY` REACHES THE DOCUMENT, BY ANY PATH ─────────────────────
// Runs on EVERY run, overlay or not. public_schema_dump.sql uses format_type, and
// format_type cannot emit the bare word `ARRAY` — it emits `text[]`, `uuid[]`. So a
// line reading `ARRAY` here is proof the CSV predates that fix, and the only two
// honest exits are to re-run the dump or to pass the overlay. Writing the document
// anyway would put a column into the estate's starting witness that witnesses
// nothing: the reader cannot tell `text[]` from `uuid[]` and must guess, which is
// the exact posture this document exists to make impossible.
function refuseBareArray(rows, iName, iDetail, hadOverlay) {
  const leftover = [];
  for (const r of rows) {
    r[iDetail].split('\n').forEach(l => {
      const m = l.match(/^\d+\.\s+(\S+)\s+ARRAY(\b|$)/);
      if (m) leftover.push(`${r[iName]}.${m[1]}`);
    });
  }
  if (!leftover.length) return;
  console.error('ABORT — bare `ARRAY` in the snapshot: ' + leftover.join(', '));
  console.error('        A column typed `ARRAY` carries no element type and witnesses nothing.');
  console.error(hadOverlay
    ? '        The overlay did not cover these. Extend it, or re-run the dump.'
    : '        This CSV predates public_schema_dump.sql adopting format_type. Either re-run');
  if (!hadOverlay) {
    console.error('        the dump (preferred — it reads element types natively), or pass an');
    console.error('        array overlay CSV as the 6th argument.');
  }
  console.error('        NOTHING WAS WRITTEN.');
  process.exit(1);
}

function main() {
  const [, , csvPath, outPath, snapshotDate, ladderTip, repoTip, overlayPath] = process.argv;
  if (!csvPath || !outPath || !snapshotDate || !ladderTip || !repoTip) {
    console.error('usage: node db/queries/format_public_schema.js <csv> <out.md> <YYYY-MM-DD> <ladder-tip> <repo-tip> [array-overlay.csv]');
    process.exit(2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    console.error('ABORT — snapshot date must be YYYY-MM-DD. Got: ' + snapshotDate);
    console.error('        It is an ARGUMENT and not new Date() on purpose: the date that belongs');
    console.error('        in this header is the day the FOUNDER ran the SQL, which is not reliably');
    console.error('        the day, or the timezone, in which the formatter runs.');
    process.exit(2);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const header = rows.shift();
  const idx = n => header.indexOf(n);
  const iExp = idx('tables_expected'), iName = idx('table_name'),
        iCols = idx('columns'), iDetail = idx('columns_detail');
  if ([iExp, iName, iCols, iDetail].some(i => i < 0)) {
    console.error('ABORT — unexpected header. Expected the four columns emitted by');
    console.error('        db/queries/public_schema_dump.sql. Got: ' + header.join(','));
    process.exit(1);
  }

  console.log('\n== THE GUARD — tables_expected is computed by the DATABASE and cannot be capped ==\n');

  const expected = Number(rows[0][iExp]);
  if (new Set(rows.map(r => r[iExp])).size !== 1) {
    console.error('ABORT — tables_expected is not constant across rows. The result is not one');
    console.error('        query\'s output. NOTHING WAS WRITTEN.');
    process.exit(1);
  }
  if (rows.length !== expected) {
    console.error(`ABORT — column snapshot: THE CAP BIT. rows_returned=${rows.length}, tables_expected=${expected}.`);
    console.error('        Raise the SQL editor\'s Limit and re-run. NOTHING WAS WRITTEN.');
    console.error('        A capped snapshot reports ABSENCE where there is only TRUNCATION,');
    console.error('        and absence is the fact this document exists to establish.');
    process.exit(1);
  }
  console.log(`  GUARD PASS  column snapshot        rows_returned=${rows.length} == tables_expected=${expected}\n`);

  // The prior snapshot is read off the file about to be overwritten, and the ladder
  // off db/migrations/ — both BEFORE anything is written, both from disk, neither
  // from a literal in this file.
  const prior  = readPriorSnapshot(outPath);
  const ladder = readLadder();

  const overlayApplied = overlayPath
    ? applyArrayOverlay(rows, iName, iDetail, overlayPath)
    : 0;
  refuseBareArray(rows, iName, iDetail, Boolean(overlayPath));
  if (overlayPath) {
    console.log(`  OVERLAY     array element types    ${overlayApplied} substitution(s), 0 bare ARRAY remaining\n`);
  }

  const totalCols = rows.reduce((a, r) => a + Number(r[iCols]), 0);

  const out = [];
  out.push('# docs/db/PUBLIC_SCHEMA.md — the `public` schema, WITNESSED PROD SNAPSHOT');
  out.push('');
  out.push(`**Snapshot taken:** ${snapshotDate}, founder-run in the Supabase SQL editor, output handed back as CSV and formatted by script. **${expected} tables, ${totalCols} columns.**`);

  // (CE-32) The prior-snapshot clause, DERIVED. It used to be a literal naming a
  // 2026-07-16 run, and it survived the 2026-07-23 regen unchanged and wrong.
  let priorClause = '';
  const sameSnapshot = prior && prior.date === snapshotDate && prior.tip === ladderTip;
  if (sameSnapshot) {
    // Re-run of the snapshot already on disk. The predecessor is whatever the last
    // run named; recomputing here would make this file its own predecessor.
    priorClause = prior.clause;
  } else if (prior) {
    const dist = prior.tip ? ladderDistance(ladder, prior.tip, ladderTip) : null;
    priorClause = ` The prior snapshot (${prior.date}, ${prior.tables} tables, tip \`${prior.tip || 'unstated'}\`)`
      + (dist === null
          ? ' was superseded by this one.'
          : ` went **${dist} migration${dist === 1 ? '' : 's'} stale** before this regen measured it.`);
  }
  out.push(`**Applied ladder tip at snapshot:** \`${ladderTip}\` — stated in the header so this file's staleness is a readable fact, never archaeology.${priorClause}`);
  out.push(`**Repo tip at authoring:** \`${repoTip}\` — the commit the generator ran from, so a reader can reproduce this file rather than trust it.`);

  // (CE-32) The standing holes, DERIVED off the ladder rather than listed.
  if (ladder) {
    const holes = [];
    if (ladder.gapsAbsent.length) {
      holes.push(`**${ladder.gapsAbsent.length} number${ladder.gapsAbsent.length === 1 ? '' : 's'} carry no file anywhere in \`db/migrations/\`** — \`${ladder.gapsAbsent.map(pad).join('`, `')}\``);
    }
    if (ladder.gapsArchived.length) {
      holes.push(`**${ladder.gapsArchived.length} sit${ladder.gapsArchived.length === 1 ? 's' : ''} in \`db/migrations/archive/\`** — \`${ladder.gapsArchived.map(pad).join('`, `')}\``);
    }
    if (ladder.unnumbered.length) {
      holes.push(`**${ladder.unnumbered.length} file${ladder.unnumbered.length === 1 ? ' carries' : 's carry'} no number at all** — \`${ladder.unnumbered.join('`, `')}\` — and therefore sit${ladder.unnumbered.length === 1 ? 's' : ''} outside the ordering, outside the staleness arithmetic above, and outside any reader's sense of "what came last"`);
    }
    if (holes.length) {
      out.push(`**Standing holes in the ladder, named so their silence is not misread.** The numbering runs \`${pad(ladder.numbered[0].n)}\`–\`${pad(ladder.max)}\` across ${ladder.numbered.length} files, and it is not contiguous: ${holes.join('; ')}. **This states what the tree holds, not what happened.** A number with no file may never have been written or may have been withdrawn before it landed; a directory listing cannot tell those apart and this line does not pretend to. What it does establish is that a gap here is **not** an unapplied migration waiting to run.`);
    }
  }

  // (CE-32, §4) THE SELF-STALENESS SENTENCE — the durable half of this cure.
  out.push(`**⏳ HOW TO TELL WHETHER THIS DOCUMENT IS STILL TRUE.** If \`db/migrations/\` holds any file newer than the ladder tip named above, **this document is STALE for any table those migrations touch — the migration is the witness until regen.** Check the directory before you cite a column from this file. F-09.185 is what happens otherwise: a committed handover asserted \`public.messages\` at 18 columns on this document's word, while \`0105\` had made it 20 and the document said nothing.`);
  out.push('');
  renderOutOfOrderRegister(out, ladder, ladderTip);
  out.push('**Project:** `nvzkbagqxbysoeszxent` (PRODUCTION). **Role: NOT WITNESSED** — the executor did not see this run\'s editor chrome and names that rather than assert it.');
  // (CE-63 header set) ② — the old line named ONE half of the pipe and told the reader that
  // re-running it regenerates this file. That is FALSE: the SQL emits a CSV, and nothing
  // becomes this document until the formatter consumes it. A reader who followed the old
  // sentence would run the query, see rows, and believe the doc had refreshed.
  out.push('**Generated by:** the PAIR — `db/queries/public_schema_dump.sql` (founder-run in the SQL editor) piped through `db/queries/format_public_schema.js` (formatter + cap guard). **Re-running the SQL alone does NOT regenerate this file; both halves of the pipe must run.**'
    + (overlayApplied
        ? ` **Plus one overlay, disclosed:** ${overlayApplied} array column${overlayApplied === 1 ? '' : 's'} took ${overlayApplied === 1 ? 'its' : 'their'} element type from a founder-pasted \`table_name,column_name,full_type\` result, because the CSV behind this snapshot was captured before the dump adopted \`format_type\` and \`information_schema\` renders every array as the bare word \`ARRAY\`. Applied mechanically by the formatter, which aborts on an overlay row that matches nothing and on any bare \`ARRAY\` it cannot resolve. **Not a hand-edit**, and self-retiring: the next regen reads element types natively.`
        : ''));
  out.push('**NEVER HAND-EDIT.** A hand-edited snapshot is prose again, and prose is what this file exists to kill.');
  out.push('');
  out.push(`**THE GUARD PASSES.** The dump's self-computing \`tables_expected\` read **${expected}**; the result carried **${rows.length}** rows. Equal ⇒ the editor's row cap did not truncate this snapshot (F-04.29's disease, made self-detecting). The guard was re-run mechanically at format time, not eyeballed — a capped CSV exits nonzero without writing.`);
  out.push('');
  // (CE-63 header set) ① — the near-miss, recorded because it teaches. The estate's specimen
  // doctrine (CE-57 committed the founder's broken unzip command VERBATIM as the taught
  // anti-pattern) says a fossil that instructs earns its place in the record.
  out.push('**THE NEAR-MISS THIS HEADER EXISTS TO PREVENT.** At CE-63 an opt-out migration was nearly drafted against a snapshot that predated `prospects` — the very table the opt-out gate reads. The doc looked complete; only the ladder tip, printed above, made its staleness visible. A reference that is silently twenty migrations behind does not announce itself: it answers confidently and wrongly.');
  out.push('');
  out.push('**WHY THIS FILE EXISTS — F-04.57.** `ENGINE_SCHEMA.md` covers the `engine` plane only. Without this file the `public` plane — which owns `vendors`, `events`, `leads`, `invoices`, `couples`, `prospects` — has no witnessed column list anywhere: `BASELINE.md` carries counts without names, and `SCHEMA.md`\'s ladder header is stale. *Founder-run SQL is written ONLY against witnessed column lists — never against prose.*');
  out.push('');
  out.push('**⚠ SCOPE — WHAT THIS HALF DOES *NOT* CARRY, NAMED SO THE SILENCE IS NOT MISREAD.** This half yields column **name, type, nullability and default** — nothing else. CHECK constraints, indexes, foreign keys, triggers and RLS policies are **absent from this half** and live in the CONSTRAINTS ADDENDUM below the sentinel. This half answers *"what columns exist, of what type"*. It does not answer *"what values are legal."* **BASE TABLEs only; views excluded, exactly as the engine twin excludes them.**');
  out.push('');
  out.push('**WHERE THE TYPE COMES FROM.** Name, nullability and default are `information_schema.columns`. **The type is `format_type(a.atttypid, a.atttypmod)` from `pg_catalog`** (CE-32) — because `information_schema` renders every array as the bare word `ARRAY` and carries the element type nowhere, so five columns on this plane witnessed as `ARRAY` for the whole life of this document and a reader could not tell `text[]` from `uuid[]` without guessing. `format_type` prints what the database itself would print. It also carries modifiers `information_schema` drops, so a type here may be fuller than a reader remembers — `numeric(p,s)` rather than `numeric`. That is the fix working, not drift.');
  out.push('');
  // (CE-32) The specimens are FOUND IN THE ROWS. The old literal named `vendors` as
  // running 1–34 then jumping to 43; by 2026-08-13 that table ran to 53 and the
  // sentence was describing a schema that no longer existed, in the same file that
  // listed the columns disproving it.
  const gapTables = findOrdinalGaps(rows, iName, iDetail);
  if (gapTables.length) {
    const specimens = gapTables.map(g =>
      `\`${g.table}\` skips ${g.missing.length === 1 ? 'ordinal' : 'ordinals'} ${g.missing.join(', ')} of ${g.last}`);
    out.push(`**Ordinal gaps are not errors.** A hole is a dropped column's fingerprint. In this snapshot ${gapTables.length} table${gapTables.length === 1 ? ' carries' : 's carry'} one — ${specimens.join('; ')}. A gap is not an absence, and this list is derived from the rows below on every regen rather than remembered.`);
  } else {
    out.push('**No ordinal gaps in this snapshot.** Every table\'s ordinals run unbroken. Stated because a gap is a dropped column\'s fingerprint and its absence is a fact too — this line is derived on every regen, never remembered.');
  }
  out.push('');
  out.push('---');
  out.push('');

  for (const r of rows) {
    out.push(`## public.${r[iName]}  ·  ${r[iCols]} columns`);
    out.push('');
    out.push('```');
    out.push(r[iDetail].replace(/\r/g, '').trimEnd());
    out.push('```');
    out.push('');
  }

  // The constraints addendum is the sibling's property. Carried across verbatim.
  let tail = '';
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    const cut = existing.indexOf(SENTINEL);
    if (cut >= 0) tail = existing.slice(cut);
  }
  if (tail) out.push(tail);

  fs.writeFileSync(outPath, out.join('\n').replace(/\n+$/, '\n'));
  console.log(`  WROTE ${outPath}`);
  console.log(`  tables ${rows.length} · columns ${totalCols}`);
  console.log(`  constraints addendum: ${tail ? 'PRESERVED VERBATIM (sibling-owned)' : 'none present — run append_constraints_to_public_schema.js next'}\n`);
}

main();
