#!/usr/bin/env node
'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b16_p1_engagements_bench.js
// TDW_16 · P1 — THE SPINE. Chartered CE-35, ruled R-35.30 / R-35.31.
//
// NOTHING UNDER TEST IS STUBBED. The category cells run the REAL
// normaliseCategory out of src/, and the DDL cells READ 0090 OFF DISK rather
// than trust a comment about it — this arc exists because a spec's memory of
// the tree disagreed with the tree for five weeks and nobody was reading both.
//
// ── THE DECLARED GAP, NAMED BEFORE THE FIRST CELL (protocol §8) ─────────────
// This bench holds NO DATABASE CONNECTION. It cannot prove that the unique key
// refuses a duplicate, that ON DELETE SET NULL fires, or that the backfill
// mints two rows — those are facts about a running Postgres, and asserting them
// from a file read would be a hollow green of exactly the kind this estate
// treats as worse than a declared gap. They are proven instead by the
// founder-run VERIFY CHAIN's three blocks, block 2 by execution (an insert that
// must ERROR) and block 3 by reading pg_constraint. This file proves the
// SOURCE: that the DDL says what the ruling said, that one home owns the table,
// that the doors call it, and that the category verdict transcribed into the
// migration is the one the live function actually returns.
//
// ── BOTH-WAYS (production mutation, comments stripped) ──────────────────────
// Restore any of these on the CURED tree and the named cells MUST red:
//   M1  0090: drop `NOT NULL` from vendor_id                    -> 1.3
//   M2  0090: drop the UNIQUE (couple_id, vendor_id, category)  -> 1.2
//   M3  0090: widen the category CHECK by one token             -> 1.4
//   M4  0090: change the backfill's CASE verdict for
//       'Event planner' from 'planning' to 'other' (0126's
//       answer — the exact F-16.15 disagreement)                -> 1.9
//   M5  0090: backfill `lead_id` from e.vendor_lead_id
//       (the binder trap that looks correct)                    -> 1.8
//   M6  0090: change either ON DELETE SET NULL to CASCADE       -> 1.7
//   M7  engagements.js: write `category` raw instead of through
//       normaliseCategory at any one write site                 -> 2.4
//   M8  bookings.js: read `.from('engagements')` directly       -> 2.2 2.3
//   M9  engagements.js: drop the `.in(statusesBelow(...))`
//       guard on the status advance                             -> 3.2
//   M10 engagements.js: drop `.is('couple_booking_id', null)`   -> 3.3
//   M11 enquire.js: restore `leadCreated = !!(leadRes && ok)`
//       alone, without the id capture                           -> 4.1
//   M12 enquire.js / bookings.js: remove the writer call        -> 4.2 / 4.3
//   M13 bookings.js: drop vendor_id from the POST insert        -> 4.4
//   M14 brideTools.js: add a vendor_id property                 -> 5.1
//   M15 STATUS_RANK: delete any token the migration's CHECK
//       carries                                                 -> 3.1
// Every cell above is named against the mutation that reddens it, not against
// the charter that asked for it.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0; const fails = [];

function ok(cond, label) {
  const good = cond === true;
  if (good) { pass++; console.log(`  \u2713 ${label}`); }
  else { fail++; fails.push(label); console.log(`  \u2717 ${label}${typeof cond === 'string' ? ` — ${cond}` : ''}`); }
}
function section(t) { console.log(`\n${t}`); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
// A bench that can be satisfied by a comment is not a bench.
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '').replace(/^\s*\/\/.*$/gm, '');
}

const MIG   = 'db/migrations/0090_engagements.sql';
const sqlRaw = read(MIG);
const sql    = strip(sqlRaw);
const eng    = strip(read('src/lib/engagements.js'));
const enq    = strip(read('src/api/couple/enquire.js'));
const bok    = strip(read('src/api/couple/bookings.js'));

const { VENDOR_CATEGORIES } = require(path.join(ROOT, 'src/agent/categories'));
const { normaliseCategory } = require(path.join(ROOT, 'src/lib/vendor/categoryFraming'));
const engagements = require(path.join(ROOT, 'src/lib/engagements'));

// ═══ 1 · THE DDL SAYS WHAT THE RULING SAID ═══════════════════════════════════
section('1 · 0090 — the DDL, read off disk');

ok(/CREATE TABLE IF NOT EXISTS public\.engagements/.test(sql),
   '1.1 0090 creates public.engagements');

ok(/UNIQUE\s*\(\s*couple_id\s*,\s*vendor_id\s*,\s*category\s*\)/.test(sql),
   '1.2 the key is UNIQUE (couple_id, vendor_id, category) — F-15.2\'s committed cure');

ok(/vendor_id\s+uuid NOT NULL REFERENCES public\.vendors\(id\)/.test(sql),
   '1.3 vendor_id is NOT NULL and FK-backed (R-35.30: identity, not decoration)');

// DERIVED, NOT RESTATED. The CHECK's token list is pulled out of the migration
// text and compared to the canonical array as the code holds it. A future
// taxonomy edit that forgets this table reddens here.
const catCheck = sql.match(/engagements_category_check CHECK \(category = ANY \(ARRAY\[([\s\S]*?)\]\)\)/);
const catTokens = catCheck
  ? [...catCheck[1].matchAll(/'([a-z_]+)'::text/g)].map(m => m[1])
  : [];
ok(catTokens.length === VENDOR_CATEGORIES.length &&
   catTokens.every(t => VENDOR_CATEGORIES.includes(t)) &&
   VENDOR_CATEGORIES.every(t => catTokens.includes(t)),
   `1.4 the category CHECK is exactly src/agent/categories.js's eleven (found ${catTokens.length})`);

const stCheck = sql.match(/engagements_status_check CHECK \(status = ANY \(ARRAY\[([\s\S]*?)\]\)\)/);
const stTokens = stCheck ? [...stCheck[1].matchAll(/'([a-z_]+)'::text/g)].map(m => m[1]) : [];
ok(stTokens.length === 6 &&
   ['enquiry','proposal','thread','booked','completed','closed'].every(s => stTokens.includes(s)),
   '1.5 the status CHECK carries the spec\'s six');

const srcCheck = sql.match(/engagements_source_check CHECK \(source = ANY \(ARRAY\[([\s\S]*?)\]\)\)/);
const srcTokens = srcCheck ? [...srcCheck[1].matchAll(/'([a-z_]+)'::text/g)].map(m => m[1]) : [];
ok(srcTokens.length === 3 &&
   ['discover_enquiry','signal','direct'].every(s => srcTokens.includes(s)),
   '1.6 the source CHECK carries the spec\'s three (leads.source untouched — F-16.10)');

ok(/enquiry_id\s+uuid REFERENCES public\.couple_enquiries\(id\) ON DELETE SET NULL/.test(sql) &&
   /couple_booking_id\s+uuid REFERENCES public\.couple_bookings\(id\) ON DELETE SET NULL/.test(sql),
   '1.7 both artifact refs are ON DELETE SET NULL — the engagement survives its artifacts (fork 6)');

// F-16.7's trap, pinned as an ABSENCE. vendor_lead_id holds a BINDER id; if a
// future hand "helpfully" backfills it into lead_id, every value lands behind
// an FK pointing at public.leads.
const insertBlock = sql.slice(sql.indexOf('INSERT INTO public.engagements'));
ok(!/vendor_lead_id/.test(insertBlock),
   '1.8 the backfill does NOT carry vendor_lead_id into lead_id (F-16.7\'s binder trap)');

// ── THE CELL R-35.31 EXISTS FOR ─────────────────────────────────────────────
// The migration transcribes normaliseCategory's verdict. This cell RUNS the
// function and demands the SQL agree. If the two homes ever disagree again —
// which is precisely what F-16.15 was — this reddens before a row is written.
const caseVerdict = sql.match(/WHEN e\.vendor_category = '([^']+)' THEN '([a-z_]+)'/);
const liveVerdict = caseVerdict ? normaliseCategory(caseVerdict[1]) : null;
ok(!!caseVerdict && caseVerdict[2] === liveVerdict,
   `1.9 the backfill's transcribed verdict equals the live function's` +
   (caseVerdict ? ` (${caseVerdict[1]} -> sql:${caseVerdict[2]} / fn:${liveVerdict})` : ' — no CASE found'));

ok(/RAISE EXCEPTION 'BACKFILL ASSERTION FAILED/.test(sql) &&
   (sqlRaw.match(/RAISE EXCEPTION 'BACKFILL ASSERTION FAILED/g) || []).length === 3,
   '1.10 the counts assert in-file and REFUSE rather than backfill an unmeasured shape');

// ═══ 2 · ONE HOME, AND THE GREP GATE ═════════════════════════════════════════
section('2 · the resolver\'s one home (acceptance 1\'s grep gate)');

ok(typeof engagements.getEngagement === 'function',
   '2.1 getEngagement is exported from src/lib/engagements.js');

// THE BENCH ENUMERATES ITS CONSUMERS ITSELF. It walks the tree; it does not
// read a list someone wrote down, because a list someone wrote down is the
// defect this gate exists to catch.
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}
const HOME = path.join(ROOT, 'src/lib/engagements.js');
const touchers = walk(path.join(ROOT, 'src'))
  .filter(p => p !== HOME)
  .filter(p => /\.from\(\s*['"]engagements['"]\s*\)/.test(strip(fs.readFileSync(p, 'utf8'))))
  .map(p => path.relative(ROOT, p));

ok(touchers.length === 0,
   `2.2 NO file outside the one home reads public.engagements${touchers.length ? ` — found: ${touchers.join(', ')}` : ''}`);
ok(touchers.length === 0,
   '2.3 …and none writes it either (same walk: .from() covers both verbs on this client)');

// R-35.31: every write site routes category through the function. Counted, so a
// NEW write site that forgets it also reddens — not just an edit to an old one.
const writeSites = (eng.match(/\.from\('engagements'\)/g) || []).length;
const normCalls  = (eng.match(/normaliseCategory\(/g) || []).length;
ok(writeSites > 0 && normCalls >= writeSites && !/category:\s*category\b/.test(eng),
   `2.4 every engagements statement pairs with a normaliseCategory call (${normCalls} calls / ${writeSites} statements)`);

// ═══ 3 · MONOTONICITY, ENFORCED AT THE DATABASE ══════════════════════════════
section('3 · the relationship never walks backward (fork 5)');

ok(stTokens.length > 0 && stTokens.every(t => Object.prototype.hasOwnProperty.call(engagements.STATUS_RANK, t)) &&
   Object.keys(engagements.STATUS_RANK).length === stTokens.length,
   '3.1 STATUS_RANK covers exactly the migration CHECK\'s tokens — derived from 0090, not restated');

ok(JSON.stringify(engagements.statusesBelow('booked').sort()) ===
   JSON.stringify(['enquiry', 'proposal', 'thread'].sort()) &&
   /\.in\('status',\s*statusesBelow\('booked'\)\)/.test(eng),
   '3.2 the booked advance is guarded by .in(statusesBelow) — monotonic in the write itself');

ok(engagements.statusesBelow('booked').indexOf('completed') === -1 &&
   engagements.statusesBelow('booked').indexOf('closed') === -1,
   '3.2b …and a completed or closed relationship is NOT re-opened by a booking');

ok(/\.is\('couple_booking_id',\s*null\)/.test(eng),
   '3.3 couple_booking_id stamps only where null — first commitment wins');

// ═══ 4 · THE DOORS ═══════════════════════════════════════════════════════════
section('4 · the four door additions');

ok(/leadRes\.lead\.id/.test(enq) && /let leadId = null/.test(enq),
   '4.1 enquire.js KEEPS public.leads.id — no longer reduced to a boolean (F-16.7)');

ok(/recordEnquiry\(\{/.test(enq) && /require\('\.\.\/\.\.\/lib\/engagements'\)/.test(enq),
   '4.2 enquire.js calls the spine\'s one home');

ok((bok.match(/recordBooking\(\{/g) || []).length === 2,
   '4.3 BOTH booking doors (POST and PATCH) call it — not just the one the walk exercises');

ok(/vendor_id:\s*resolvedVendorId/.test(bok),
   '4.4 POST writes vendor_id onto the row (F-16.6\'s cure at the door)');

ok(/updates\.vendor_id\s*=\s*v\.id/.test(bok),
   '4.5 PATCH can attach a vendor to a booking made before the spine existed');

// record_payment() IS SACRED (B-7 absolute). Proven as an untouched byte
// sequence, not as a promise in a comment.
const rpNow  = (bok.match(/supabase\.rpc\('record_payment'[\s\S]*?\}\);/) || [''])[0];
const rpHead = execFileSync('git', ['show', 'HEAD:src/api/couple/bookings.js'], { cwd: ROOT, encoding: 'utf8' });
const rpWas  = (strip(rpHead).match(/supabase\.rpc\('record_payment'[\s\S]*?\}\);/) || [''])[0];
ok(rpNow.length > 0 && rpNow === rpWas,
   '4.6 the record_payment() RPC call is byte-identical to HEAD — her ledger untouched (B-7)');

// ═══ 5 · W-1, AND THE COPY LINE ══════════════════════════════════════════════
section('5 · W-1 shut, copy accounted');

function unchangedVsHead(rel) {
  const now = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const was = execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf8' });
  return now === was;
}
ok(unchangedVsHead('src/agent/brideTools.js'),
   '5.1 brideTools.js byte-identical to HEAD — no prompt bytes moved without a lift (W-1)');
ok(unchangedVsHead('src/agent/brideEngine.js'),
   '5.2 brideEngine.js byte-identical to HEAD — the Mira limb is DECLARED, not built');
ok(unchangedVsHead('src/lib/vendor/categoryFraming.js') && unchangedVsHead('src/agent/categories.js'),
   '5.3 the taxonomy\'s one home is untouched — this block reads it, never edits it');

// The delivery's ONE new user-facing byte, pinned so an edit to it is a fresh
// veto (APPROVED-COPY-CARRIES-ITS-HASH).
//
// THE CELL IS A DIFF, NOT A COUNT. An earlier draft counted occurrences and a
// substring match over the file, and its own control run came back RED against
// strings that were already there ('vendor_name required.'). Counting what
// EXISTS cannot tell you what ARRIVED. This lifts every 400 literal out of both
// this file and its HEAD twin and subtracts — so the cell answers the only
// question the copy law asks: which bytes are NEW, and were they vetoed.
function refusalStrings(src) {
  return new Set([...strip(src).matchAll(/errRes\(res,\s*\d{3},\s*'([^']*)'\)/g)].map(m => m[1]));
}
const bokHead  = execFileSync('git', ['show', 'HEAD:src/api/couple/bookings.js'], { cwd: ROOT, encoding: 'utf8' });
const wasStr   = refusalStrings(bokHead);
const nowStr   = refusalStrings(read('src/api/couple/bookings.js'));
const arrived  = [...nowStr].filter(x => !wasStr.has(x));
const departed = [...wasStr].filter(x => !nowStr.has(x));

ok(arrived.length === 1 && arrived[0] === 'Invalid vendor.' && departed.length === 0,
   `5.4 exactly ONE new user-facing string arrived and none departed` +
   ` (new: ${JSON.stringify(arrived)}, gone: ${JSON.stringify(departed)})`);

ok((bok.match(/'Invalid vendor\.'/g) || []).length === 4,
   '5.4b …and that one string serves all four refusal sites — no near-duplicate wording');

// ═══ VERDICT ═════════════════════════════════════════════════════════════════
console.log(`\n${'='.repeat(70)}`);
console.log(`b16_p1_engagements_bench: ${pass} pass, ${fail} fail`);
if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  - ${f}`)); }
console.log(fail === 0 ? 'VERDICT: GREEN' : 'VERDICT: RED');
console.log('='.repeat(70));
process.exit(fail === 0 ? 0 : 1);
