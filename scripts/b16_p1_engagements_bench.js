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
// ── AMENDED AT THE 0127 RIDER (R-35.32), RETIRE-WITH-THE-READER ────────────
// This bench was born reading a THREE-column key. 0127 dropped the third
// column, so the cells that read it travel with it rather than being left
// asserting a shape the database no longer holds. COUNTS DISCLOSED:
//   1.2  AMENDED — was "the key is UNIQUE (couple_id, vendor_id, category)";
//        now reads BOTH migrations and demands 0090's triple be dropped by
//        0127 and the pair added. A cell that still passed on 0090 alone would
//        have been green about a constraint that no longer exists.
//   2.1  AMENDED — getEngagement's arity is now part of the cell.
//   5.4  AMENDED — was a diff against HEAD, which answered EMPTY the moment
//        ff15775 landed the very string it watched for. Now a FROZEN approved
//        set: the copy law's standing question, not a one-delivery one.
//   2.4  RETIRED — subsumed by 2.6; reason at its site. Removed, not loosened.
//   NEW: 1.11 1.12 1.13 (0127's DDL, its pre-check, its assertions)
//        2.5 (no lookup carries a category leg)
//        2.6 (every write refreshes the tracked column, none raw)
//        4.7 (the booking door hands over no category)
//   Cell count 29 -> 34, READ OFF THE RUN and not computed in my head: six
//   added, one retired, three rewritten in place.
//
// ── AMENDED AGAIN AT M-LEADS-TRUTH (R-35.35), RETIRE-WITH-THE-READER ───────
// The one home gained a SECOND reader — `engagedLeadIds` — because the Business
// Leads surface holds `leads` rows and no couple_id, so the pair resolver could
// not answer its question. The grep gate is unchanged and intact (§2.2 walks
// FILES), but three new facts want cells:
//   NEW: 2.7 (the batched reader is exported from the one home)
//        2.8 (ONE query per page, never per-row — the shape, not the count)
//        4.8 (the handler wires it AND maps it — the F-04.10 law, both halves)
//   Cell count 34 -> 37, read off the run.
//
// NEW MUTATION ARMS:
//   M23 engagements.js: delete the engagedLeadIds export      -> 2.7
//   M24 engagements.js: loop getEngagement per id instead of
//       one .in() (the N+1 shape)                             -> 2.8
//   M25 leads.js: call the reader but DROP `tdw:` from the
//       mapper — F-04.10's exact defect, reproduced            -> 4.8
//   M26 leads.js: badge off `l.source === 'discover'` instead
//       of the linkage (F-16.21's disease restored)            -> 4.8
//
// ── AMENDED AT R2 (Set → Map), RETIRE-WITH-THE-READER ────────────────────
// The batched reader now carries the enquiry's clock as well as the fact
// (F-16.22: `leads.created_at` is the LEAD's birthday, and on the founder's own
// row that is 5 Aug against a 21 Aug enquiry). The export renamed with it —
// `engagedLeadIds` returning a Map would be F-16.7's disease in my own byte.
//   2.7  AMENDED — asserts the RENAMED export, and that the old name is gone
//        from the whole tree (a stale caller is a crash, not a red cell).
//   2.8  AMENDED — the batched predicate now selects two columns; the cell
//        pins the SHAPE (one .in(), no per-row call), not the column list.
//   4.8  AMENDED — F-04.10 now binds TWO mapper entries, `tdw:` and
//        `tdw_enquired_at:`. Half a wire is the same defect as no wire.
//   NEW: 2.9 (the Map carries the clock — select and set, both halves)
//   Cell count 37 -> 38, read off the run.
//
// NEW MUTATION ARMS:
//   M27 engagements.js: drop `updated_at` from the select        -> 2.9
//   M28 engagements.js: `out.set(r.lead_id, true)` — a Map that
//       carries the fact but not the clock                       -> 2.9
//   M29 leads.js: drop `tdw_enquired_at:` from the mapper (the
//       F-04.10 defect, on the NEW half this time)               -> 4.8
//   M30 anywhere: restore the old export name                    -> 2.7
//
// ── BOTH-WAYS (production mutation, comments stripped) ──────────────────────
// Restore any of these on the CURED tree and the named cells MUST red:
//   M1  0090: drop `NOT NULL` from vendor_id                    -> 1.3
//   M2  0127: drop its ADD CONSTRAINT ... UNIQUE line           -> 1.2
//       (an earlier draft of this ledger predicted 1.2 AND 1.11 here and the
//        run said 1.2 alone — 1.11 watches the REGISTER, not the ADD. The
//        ledger is corrected to what the run output, never the reverse.)
//   M22 OUT_OF_ORDER.json: add a record for 127                 -> 1.11
//   M2b 0127: re-key it back to the triple                      -> 1.2
//   M2c 0127: delete its duplicate-pair pre-check               -> 1.12
//   M18 engagements.js: restore a `.eq('category', ...)` leg on
//       any write filter                                        -> 2.5
//   M19 engagements.js: drop the category refresh from a patch   -> 2.6
//   M20 engagements.js: restore the 3-arg getEngagement          -> 2.1
//   M21 bookings.js: hand `category: data.category` back to the
//       writer                                                   -> 4.7
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

const MIG    = 'db/migrations/0090_engagements.sql';
const RIDER  = 'db/migrations/0127_engagements_pair_key.sql';
const sqlRaw = read(MIG);
const sql    = strip(sqlRaw);
const rider  = strip(read(RIDER));
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

// AMENDED AT 0127. The live key is what 0090 said MINUS what 0127 dropped PLUS
// what 0127 added — so the cell reads both files and would red if either half
// were missing. Reading 0090 alone was correct for one day and is now a lie.
ok(/DROP CONSTRAINT IF EXISTS engagements_couple_vendor_category_uidx/.test(rider) &&
   /ADD CONSTRAINT engagements_couple_vendor_uidx UNIQUE \(couple_id, vendor_id\)/.test(rider) &&
   /UNIQUE\s*\(\s*couple_id\s*,\s*vendor_id\s*,\s*category\s*\)/.test(sql),
   '1.2 the key is UNIQUE (couple_id, vendor_id) — 0090\'s triple dropped by 0127 (F-16.17, R-35.32)');

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

ok(!/OUT_OF_ORDER/.test(rider.replace(/^[\s\S]*?BEGIN;/, '')) &&
   (() => {
     const reg = JSON.parse(read('db/migrations/OUT_OF_ORDER.json'));
     return reg.register.length === 1 && reg.register[0].number === 90;
   })(),
   '1.11 0127 sits AT the tip and takes NO register row — 0090\'s row stands, its debt unpaid');

ok(/RAISE EXCEPTION 'RE-KEY REFUSED/.test(rider),
   '1.12 0127 names WHICH pairs are duplicated before it drops anything');

ok(/RAISE EXCEPTION 'RE-KEY ASSERTION FAILED/.test(rider) &&
   /count\(DISTINCT \(couple_id, vendor_id\)\)/.test(rider),
   '1.13 0127 asserts rows AND distinct pairs — zero collapse, priced against the fixture');

// ═══ 2 · ONE HOME, AND THE GREP GATE ═════════════════════════════════════════
section('2 · the resolver\'s one home (acceptance 1\'s grep gate)');

// AMENDED AT 0127. Arity is now load-bearing: a three-argument resolver would
// filter the READ on category and the row would go MISSING the day the vendor
// re-categorised — a worse failure than a duplicate, because nothing looks wrong.
ok(typeof engagements.getEngagement === 'function' && engagements.getEngagement.length === 3,
   `2.1 getEngagement is exported and takes (supabase, coupleId, vendorId) — not a category (arity ${engagements.getEngagement.length})`);

// THE BENCH ENUMERATES ITS CONSUMERS ITSELF. It walks the tree; it does not
// read a list someone wrote down, because a list someone wrote down is the
// defect this gate exists to catch.
function walkAll(dir, out = []) { return walk(dir, out); }
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

// ── 2.4 RETIRED AT THE 0127 RIDER, SUBSUMED BY 2.6 ─────────────────────────
// It read "every engagements STATEMENT pairs with a normaliseCategory call".
// That arithmetic held while all five statements filtered on category. 0127
// took the category leg off the READ — correctly, and 2.5 now pins that
// absence — so the cell began counting a read that must NOT normalise against
// writes that must, and went RED on the cure itself. Its whole assertion,
// including its `category: category` guard, is carried by 2.6, which counts
// refreshes against WRITES: a raw assignment drops the refresh count below the
// write count and reddens there. RETIRED, not loosened — a cell edited until it
// passes is the defect wearing the cure's uniform.

ok(!/\.eq\('category'/.test(eng),
   '2.5 NO lookup filters on category — the key is the pair, and so is every read and write filter');

// The column tracks the vendor, so every write that touches this row carries it.
// Counted against the write statements, so a NEW writer that forgets the
// refresh reddens too — not only an edit to an existing one.
const patchWrites = (eng.match(/\.(update|upsert)\(/g) || []).length;
const refreshes   = (eng.match(/category:\s*normaliseCategory\(category\)/g) || []).length;
ok(patchWrites > 0 && refreshes === patchWrites && !/category:\s*category\b/.test(eng),
   `2.6 every write refreshes the tracked category, none raw (${refreshes} refreshes / ${patchWrites} writes)`);

// AMENDED AT R2. The old name is asserted ABSENT across the tree as well as the
// new one present: a rename that leaves a caller behind is a runtime crash, and
// a cell that only checks the new export would stay green through it.
const treeHasOldName = walkAll(path.join(ROOT, 'src'))
  .some(p => /\bengagedLeadIds\b/.test(strip(fs.readFileSync(p, 'utf8'))));
// The first cut of this line matched `engagedLeadIds` only where a CALL or a
// destructure would put it — followed by `(`, `,` or `}`. M30 restored the old
// name as an ALIAS EXPORT (`engagedLeadIds: engagedLeadStamps`), where the next
// character is a colon, and the cell stayed GREEN through a live resurrection of
// the name it exists to bury. Widened to the bare identifier, anywhere in src,
// comments stripped. A cell that only catches the shapes I thought of is a cell
// that certifies my imagination, not the tree.
ok(typeof engagements.engagedLeadStamps === 'function' && !treeHasOldName,
   '2.7 the batched reader is exported under its true name, and no caller holds the old one');

// THE SHAPE, NOT THE COUNT. A per-row reader would be N round trips for a page
// of N leads. This asserts the batched predicate exists and that no per-row
// resolver call sits inside a loop in the handler.
ok(/\.in\('lead_id',\s*ids\)/.test(eng) && (eng.match(/\.in\('lead_id'/g) || []).length === 1 &&
   !/for\s*\([^)]*\)\s*\{[^}]*getEngagement\(/.test(bok) &&
   !/\.map\([^)]*getEngagement\(/.test(read('src/api/vendor/leads.js')),
   '2.8 the badge read is ONE batched query per page — never one per row');

// R2 · F-16.22's cure at the source. BOTH HALVES: the column must be SELECTED
// and it must be SET into the Map. Selecting it and storing `true` would pass a
// naive "does it read updated_at" cell while the sheet still had no clock.
ok(/\.select\('lead_id,\s*updated_at'\)/.test(eng) &&
   /out\.set\(r\.lead_id,\s*r\.updated_at/.test(eng),
   '2.9 the batched read carries the enquiry clock — selected AND stored (F-16.22)');

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

// ── THE F-04.10 LAW, BOTH HALVES (this bench's reason for existing here) ────
// F-04.10 was born on THIS handler: the SELECT carried `notes`, the mapper
// dropped it, and the read-row could only render an em-dash — caught by the
// founder's phone, not the bench. So the badge is asserted at BOTH ends: the
// read must run, AND `tdw:` must appear in the response object. Either half
// alone is the same defect wearing the other half's uniform.
// And it must be read off the LINKAGE, never off `leads.source` — the column
// createLead's dedupe can never set, which is the whole of F-16.21.
const vlead = strip(read('src/api/vendor/leads.js'));
ok(/engagedLeadStamps\(supabase,\s*vendor\.id/.test(vlead) &&
   /tdw:\s*tdwStamps\.has\(l\.id\)/.test(vlead) &&
   /tdw_enquired_at:\s*tdwStamps\.get\(l\.id\)/.test(vlead) &&
   !/source\s*===\s*'discover'/.test(vlead),
   '4.8 the handler READS the linkage and MAPS BOTH halves — badge and clock — never off leads.source');

// R-35.32: couple_bookings.category is HER choice; the engagement's tracks the
// VENDOR. The door must not hand one over as if they were the same fact.
ok(!/category:\s*data\.category/.test(bok) && /select\('category'\)/.test(eng),
   '4.7 the booking door passes NO category — the one home resolves the vendor\'s own');

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

// ── AMENDED AT THE 0127 RIDER. THE HEAD-DIFF CELL DECAYED ON LANDING. ──────
// It read: lift every 400 literal out of this file and its HEAD twin, subtract,
// and demand exactly one arrived. That was the right question the day the
// string was authored — and it answered EMPTY the moment ff15775 made HEAD
// contain it. A cell pinned to `HEAD` measures a DELIVERY, not a fact, and
// expires when the delivery lands.
//
// The copy law's standing question is not "what arrived" but
// APPROVED-COPY-CARRIES-ITS-HASH: these are the vetoed bytes, and none has
// drifted. The set is FROZEN here. Reword any of them — including the ones that
// predate this block — and this reddens, which is correct permanently rather
// than for one day.
function refusalStrings(src) {
  return new Set([...strip(src).matchAll(/errRes\(res,\s*\d{3},\s*'([^']*)'\)/g)].map(m => m[1]));
}
const APPROVED = [
  'Forbidden.',
  'vendor_name required.',
  'Invalid vendor.',
  'Invalid category.',
  'state must be booked, advance_paid, or paid.',
  'Could not fetch bookings.',
  'Could not create booking.',
  'Invalid booking id.',
  'vendor_name must be a non-empty string.',
  'amount_total must be a non-negative integer.',
  'amount_advance must be a non-negative integer.',
  'balance_due_date must be YYYY-MM-DD.',
  'No fields to update.',
  'Booking not found.',
  'Could not update booking.',
  'amount required (non-zero integer rupees).',
  'payment_date must be YYYY-MM-DD.',
  'Could not record payment.',
  'Could not delete booking.',
];
const nowStr  = refusalStrings(read('src/api/couple/bookings.js'));
const drifted = [...nowStr].filter(x => !APPROVED.includes(x));
const missing = APPROVED.filter(x => !nowStr.has(x));
ok(drifted.length === 0 && missing.length === 0 && nowStr.has('Invalid vendor.'),
   `5.4 every refusal string is a vetoed byte, none drifted` +
   ` (unapproved: ${JSON.stringify(drifted)}, missing: ${JSON.stringify(missing)})`);

ok((bok.match(/'Invalid vendor\.'/g) || []).length === 4,
   '5.4b …and that one string serves all four refusal sites — no near-duplicate wording');

// ═══ VERDICT ═════════════════════════════════════════════════════════════════
console.log(`\n${'='.repeat(70)}`);
console.log(`b16_p1_engagements_bench: ${pass} pass, ${fail} fail`);
if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  - ${f}`)); }
console.log(fail === 0 ? 'VERDICT: GREEN' : 'VERDICT: RED');
console.log('='.repeat(70));
process.exit(fail === 0 ? 0 : 1);
