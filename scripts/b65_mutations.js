#!/usr/bin/env node
// scripts/b65_mutations.js — the both-ways half of b65. Each mutation edits
// PRODUCTION code in a scratch copy of the tree; the named cell must RED.
//
// M1–M3 are the three ways R-41.104 can be built wrong and still LOOK cured,
// and all three were live shapes in this seat's own cut before the read closed
// them: routing business while the room stays advisory (M1), curing the first
// runTurn site and not the retry (M2), and dropping the row without the
// registry so one founder tap seeds it back (M4/M5).
//
// CE-41 · SEAT I (R-41.136) RE-DERIVED NINE ANCHORS — M1, M2, M9, M10, M12, M23,
// M24, M28, M29 — every one of which pinned a byte this packet deleted, and each
// of which would have reported `?? target matched 0 times`. A DEAD ANCHOR IS NOT
// A PASS and this file already says so; what is new is that the seat which killed
// the bytes is the seat that re-cut the anchors, in the same packet, rather than
// leaving the next sitting to find them. Two subjects genuinely ceased to exist
// (M1's "the row alone" and M28's "a business column suppresses the assertion" —
// there is no column term left to do either) and were re-cut to the failure that
// replaced them; the other seven keep their subjects exactly.
//
// M35-M41 are seat I's own, and they carry TWO new fields: the bench to drive
// (default `b65_g1`, `b65_i1` for the room and the room line) and REBUILD, which
// runs `tsc` in the scratch before driving. Rebuild exists for exactly the cells
// that read `dist` — the composed prompt cannot be proved off a `dist` compiled
// from the unmutated source.
//
// THE ENGINE MUTATIONS (M1, M3, M8) EDIT THE TYPESCRIPT AND DO NOT REBUILD.
// Deliberate and disclosed: the cells they name (§2.1, §2.2, §2.6) read the
// SOURCE, which is where the ruled bytes live and where a later seat would
// break them. §2.3 is the one cell that reads `dist`, and it is named by no
// mutation here — it is a regression witness on the compiled artefact, not a
// property of the source. A rebuild per mutation would cost ~15 tsc runs to
// prove nothing the source assertions do not already prove.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

// ⚠ SEVEN G1 ANCHORS WERE RE-DERIVED AT G2 (M1, M2, M6, M8, M9, M10, M12). Each
// pinned a line R-41.107 rewrote, and each reported `?? target matched 0 times` —
// a DEAD ANCHOR, which is neither a pass nor a proof (F-41.65's class, and
// c-41.46's own subject one bench over). Every subject is unchanged; only the
// bytes each mutation edits were re-derived by command against the cured G2 tree.
// A correction number is owed for these; this seat's c-41.45-.49 is spent.
const MUT = [
  // ── THE ROOM ──────────────────────────────────────────────────────────────
  // RE-CUT AT SEAT I. "The row alone" cannot be built any more — the column is
  // not selected and not read — so the half-cure's modern shape is the DEFAULT
  // flipping: a turn that asserts nothing landing in the advisory room, which is
  // R-41.136 read backwards.
  ['M1 the DEFAULT flips — an unasserted turn lands in the advisory room', 'src/engine/src/core/loop.ts',
    "  const assertedRoom = (args.modeOverride ?? args.roomAssert ?? 'business') as string | null;",
    "  const assertedRoom = (args.modeOverride ?? args.roomAssert ?? 'advisor') as string | null;",
    'the room predicate prefers the override over everything below it'],
  // RE-CUT AT SEAT I: the door's term is dropped outright, which is the failure
  // the original pinned (the door stops leading) in the shape the tree now allows.
  ['M2 the engine drops the door\'s term — a page could hold a WhatsApp turn', 'src/engine/src/core/loop.ts',
    "args.modeOverride ?? args.roomAssert ?? 'business'",
    "args.roomAssert ?? 'business'",
    'the room predicate prefers the override over everything below it'],
  ['M3 the type widens so a door could push a vendor INTO the advisory room', 'src/engine/src/core/loop.ts',
    "  modeOverride?: 'business';",
    "  modeOverride?: string;",
    'the engine accepts a modeOverride and it is `business`-only'],
  ['M4 the STAGE-2 RETRY re-enters the advisory room mid-turn', 'src/lib/vendorInbound.js',
    "            modeOverride: waLaneMode(),\n            agentId, message: body, calendarSnapshot, scratchpad, leadPings, pendingRelay, vendorCategory,",
    "            agentId, message: body, calendarSnapshot, scratchpad, leadPings, pendingRelay, vendorCategory,",
    'the WhatsApp door passes it at BOTH runTurn sites'],
  ['M5 the door stops handing the engine a room at all', 'src/lib/vendorInbound.js',
    "      modeOverride: waLaneMode(), // R-41.104 — advisory does not live on this lane\n",
    "",
    'the WhatsApp door passes it at BOTH runTurn sites'],
  ['M6 the PWA door starts forcing the room too (the app loses the Advisor)', 'src/api/vendor-engine/chat.js',
    "async function buildLlmForTurn({ supabase, vendor, agentId, surface = 'pwa_vendor', roomAssert }) {",
    "async function buildLlmForTurn({ supabase, vendor, agentId, surface = 'pwa_vendor', roomAssert }) {\n  const modeOverride = 'business';",
    'the PWA door passes NOTHING — the app keeps the room'],
  ["M8 R-41.105's witness line is dropped", 'src/engine/src/core/loop.ts',
    "  console.log(`[engine:mode] room=${isConsult ? 'consult' : (isAdvisor ? 'advisor' : 'business')} `",
    "  console.log(`[engine:mode] `",
    '1.3 the [engine:mode] line printed the room before the throw', 'b116', 'rebuild'], // RE-AIMED (CE-45 LCV-16 LSP_5, labelled): its b65_g1 cell 2.6 retired with modeOverride; the line is kept (L5-a) and b116 1.3 pins it exactly

  // ── THE ROUTE ─────────────────────────────────────────────────────────────
  // RE-CUT AT SEAT I: `readVictorMode` is deleted, so both mutations now RE-ADD a
  // column read at the door — which is the failure they always described. M9's
  // answer is used; M10's is thrown away, and the census cell must red on BOTH,
  // because a read whose answer is discarded is still a live reader.
  ['M9 the route reads the column again', 'src/api/vendor-engine/chat.js',
    "  const victorMode = resolveVendorRoom({ surface, roomAssert });",
    "  const { data: _vm } = await supabase.schema('engine').from('agents').select('victor_mode').eq('id', agentId).maybeSingle();\n  const victorMode = (_vm && _vm.victor_mode === 'advisor') ? 'advisor' : resolveVendorRoom({ surface, roomAssert });",
    'the same flipped agent on wa_vendor routes the PRODUCT tier, and the column is never SELECTed'],
  ['M10 the route ASKS and then discards the answer (the shape this seat refused)', 'src/api/vendor-engine/chat.js',
    "  const victorMode = resolveVendorRoom({ surface, roomAssert });",
    "  await supabase.schema('engine').from('agents').select('victor_mode').eq('id', agentId).maybeSingle();\n  const victorMode = resolveVendorRoom({ surface, roomAssert });",
    'the same flipped agent on wa_vendor routes the PRODUCT tier, and the column is never SELECTed'],
  ['M11 the PWA route loses its advisor tier (the app stops routing the room)', 'src/api/vendor-engine/chat.js',
    "  const routeTier = victorMode === 'advisor' ? 'advisor' : productTier;",
    "  const routeTier = productTier;",
    'buildLlmForTurn on pwa_vendor STILL routes the advisor room to its own tier'],

  // ── THE ONE HOME ──────────────────────────────────────────────────────────
  ['M12 the route spells `business` itself (two homes for one rule)', 'src/api/vendor-engine/chat.js',
    "  const victorMode = resolveVendorRoom({ surface, roomAssert });",
    "  const victorMode = surface === 'wa_vendor' ? 'business' : resolveVendorRoom({ surface, roomAssert });",
    'BOTH readers import it; neither spells the word itself'],
  ['M13 waLaneMode grows an argument (the switch R-41.104 removes)', 'src/lib/modelRouter.js',
    "function waLaneMode() {\n  return 'business';\n}",
    "function waLaneMode(vendor) {\n  return (vendor && vendor.advisor_on_wa) ? 'advisor' : 'business';\n}",
    'waLaneMode() exists, takes no argument, and returns business'],
  ['M14 the home rides the deps bag, where a double could invert it', 'src/lib/vendorInbound.js',
    "const { waLaneMode } = require('./modelRouter');",
    ";",
    'it is imported, not injected through `deps` (a double cannot invert the ruling)'],

  // ── THE REGISTRY AND 0154 ─────────────────────────────────────────────────
  ['M15 the advisor lane returns to wa_vendor (the tap seeds the row back)', 'src/lib/modelRouter.js',
    "  ...vendorLanes('wa_vendor', { fallback_surface: 'pwa_vendor' }, { advisor: false }),",
    "  ...vendorLanes('wa_vendor', { fallback_surface: 'pwa_vendor' }),",
    'wa_vendor holds the four product tiers and NO advisor lane'],
  ['M16 the advisor lane leaves pwa_vendor too (the app loses its switch)', 'src/lib/modelRouter.js',
    "  ...vendorLanes('pwa_vendor'),",
    "  ...vendorLanes('pwa_vendor', undefined, { advisor: false }),",
    'pwa_vendor still carries its advisor lane'],
  ['M17 0154 deletes by pattern and takes the live tiers with it', 'db/migrations/0154_wa_vendor_advisor_drop.sql',
    " WHERE key = 'model.wa_vendor.advisor';",
    " WHERE key LIKE 'model.wa_vendor.%';",
    '0154 deletes ONE named key — no LIKE, no pattern'],
  ['M18 0154 reaches across to the app lane', 'db/migrations/0154_wa_vendor_advisor_drop.sql',
    " WHERE key = 'model.wa_vendor.advisor';",
    " WHERE key IN ('model.wa_vendor.advisor', 'model.pwa_vendor.advisor');",
    '0154 leaves `model.pwa_vendor.advisor` alone'],

  // ── G2 · R-41.107 — THE ROOM THE PAGE ASSERTS ─────────────────────────────
  ['M23 the engine drops roomAssert from the precedence', 'src/engine/src/core/loop.ts',
    "  const assertedRoom = (args.modeOverride ?? args.roomAssert ?? 'business') as string | null;",
    "  const assertedRoom = (args.modeOverride ?? 'business') as string | null;",
    'the engine carries the ruled precedence in that order'],
  ['M24 the precedence inverts — an assertion beats the door\'s business', 'src/engine/src/core/loop.ts',
    "args.modeOverride ?? args.roomAssert ?? 'business'",
    "args.roomAssert ?? args.modeOverride ?? 'business'",
    'the route resolver and the engine term agree on ALL 8 combinations'],
  // ⚠ M24 IS THE CELL THAT CAUGHT 8.1's FIRST CUT. Inverting the engine's order
  // left 8.1 GREEN, because 8.1 carried its own transcription of that order
  // instead of reading it. 8.1 now parses the `??` chain out of `loop.ts`, so the
  // mirror is a mirror. Recorded because a harness that finds a weak cell has
  // done its job and the finding should not vanish into a fix.
  ['M25 roomAssert widens so a page could force a vendor OUT of the room', 'src/engine/src/core/loop.ts',
    "  roomAssert?: 'advisor';",
    "  roomAssert?: string;",
    'roomAssert is `advisor`-ONLY on the type — no door can force a vendor OUT either'],
  ['M26 the two fields collapse into one (M3\'s fence, by another road)', 'src/engine/src/core/loop.ts',
    "  modeOverride?: 'business';",
    "  modeOverride?: 'business' | 'advisor';",
    'modeOverride is STILL `business`-only — M3 keeps its subject'],
  // ⚠ M27's FIRST CUT SWAPPED THE SURFACE AND OVERRIDE LINES AND WAS A NO-OP:
  // the WhatsApp door always passes `modeOverride: 'business'`, so both orders
  // return business and nothing could tell them apart. Re-cut to REMOVE the
  // surface term, which is the failure that actually matters — R-41.104 falling
  // to an assertion.
  ['M27 the resolver loses its surface term — an assertion reaches the WhatsApp lane', 'src/lib/modelRouter.js',
    "  if (surface === 'wa_vendor') return waLaneMode();\n",
    "",
    'the SURFACE wins over everything — an assertion cannot reach the WhatsApp lane'],
  // ⚠ AND M28's FIRST CUT WAS UNOBSERVABLE, WHICH IS ITSELF A DERIVATION WORTH
  // KEEPING: `roomAssert` can only say `advisor` and an `advisor` column resolves
  // advisor, so terms 3 and 4 CANNOT CONFLICT and their relative order has no
  // witness. The failure that IS observable is a column that SUPPRESSES an
  // assertion — a business column silently cancelling the Advisor page — and that
  // is what this mutation now drives.
  // RE-CUT AT SEAT I. The original subject — a column suppressing the page — has
  // no mechanism left; there is no column in the resolver to do it. What replaces
  // it is the resolver's own default going the wrong way, which is the route-side
  // twin of M1 and the failure the founder's walk would meet on the rooms page.
  ['M28 the resolver\'s default flips — an unasserted route resolves advisory', 'src/lib/modelRouter.js',
    "  if (roomAssert === 'advisor') return 'advisor';\n  return 'business';",
    "  if (roomAssert === 'advisor') return 'advisor';\n  return 'advisor';",
    'the PRECEDENCE is modeOverride, then roomAssert, then BUSINESS'],
  ['M29 the ROUTE stops following the asserted room (the advisory room on the business model)', 'src/api/vendor-engine/chat.js',
    "  const victorMode = resolveVendorRoom({ surface, roomAssert });",
    "  const victorMode = resolveVendorRoom({ surface });",
    'DRIVEN: the Advisor page\u2019s assertion routes the advisor tier on a business column'],
  ['M30 the door stops failing closed — any truthy `room` asserts', 'src/api/vendor-engine/chat.js',
    "  const roomAssert = body.room === 'advisor' ? 'advisor' : undefined;",
    "  const roomAssert = body.room ? body.room : undefined;",
    'the door reads `room`, accepts only `advisor`, and never 400s on a bad one'],
  ['M31 the door gives the accepted-and-ignored `mode` field a behaviour', 'src/api/vendor-engine/chat.js',
    "  const roomAssert = body.room === 'advisor' ? 'advisor' : undefined;",
    "  const roomAssert = (body.room === 'advisor' || body.mode === 'advisor') ? 'advisor' : undefined;",
    'the door reads `room`, accepts only `advisor`, and never 400s on a bad one'],
  ['M32 the JSON path is cured and the SSE path is not (the F-04.38 class)', 'src/api/vendor-engine/chat.js',
    "        roomAssert, // G2 (R-41.107): the Advisor page's own bar, this turn only, no write\n",
    "",
    'BOTH PWA paths thread it — SSE and JSON, route and room'],
  ['M33 the room is cured by WRITING the column after all', 'src/api/vendor-engine/chat.js',
    "  const roomAssert = body.room === 'advisor' ? 'advisor' : undefined;",
    "  const roomAssert = body.room === 'advisor' ? 'advisor' : undefined;\n  if (roomAssert) { try { await require('./vendorMode').applyModeFlip(req.app.locals.supabase, req.agentId, 'advisor'); } catch (e) { /* */ } }",
    'R-41.107 WRITES NOTHING — no new applyModeFlip site anywhere'],
  ['M34 the witness stops naming which term decided', 'src/engine/src/core/loop.ts',
    "assert=${args.roomAssert ? 'yes' : 'no'} `\n    + `source=${roomSource}`",
    "`",
    'the witness line names which term decided'],

  // ── THE FENCES THIS PACKET MUST NOT MOVE ──────────────────────────────────
  ['M19 the advisor WORD stops being refused on this lane (F-40.3 returns)', 'src/lib/vendorInbound.js',
    "      if (modeTarget === 'advisor') {",
    "      if (false) {",
    'the refusal path still refuses the advisor WORD on this lane (R-39.22/D1)'],
  ['M20 `business` stops being the way home', 'src/api/vendor-engine/vendorMode.js',
    "const MODE_WORDS = { 'advisor mode': 'advisor', 'business mode': 'business' };",
    "const MODE_WORDS = { 'advisor mode': 'advisor' };",
    '`business` as a word stays legal — the way home is not closed'],
  ['M21 the packet cures the room by WRITING the column (F-40.3 under a new number)', 'src/lib/vendorInbound.js',
    "    const result = await runTurn({",
    "    await applyModeFlip(supabase, agentId, 'business');\n    const result = await runTurn({",
    '`victor_mode` on the row is UNTOUCHED — the cure is a read, not a write'],
  ["M22 victorLines' load-time hash guard is disarmed", 'src/lib/victorLines.js',
    "function sha256(s) {",
    "function sha256_unused(s) {",
    'victorLines\' load-time sha256 guard is present and passes'],

  // ── CE-41 · SEAT I · R-41.136 — THE ROOM BY CONSTRUCTION, AND THE ROOM LINE ──
  // These name cells in `b65_i1_advisor_room_only_bench.js` (the 6th field). The
  // two the charter named by hand are M35 (restore the column term) and M37 (swap
  // the two room lines); the rest are the other ways this cure can be built wrong
  // and still look done.
  ['M35 the column term is restored to the engine', 'src/engine/src/core/loop.ts',
    "  const assertedRoom = (args.modeOverride ?? args.roomAssert ?? 'business') as string | null;",
    "  const assertedRoom = (args.modeOverride ?? args.roomAssert ?? agent.victor_mode) as string | null;",
    "the engine's resolution has TWO terms and the third is the literal business", 'b65_i1'],
  ['M36 the turn SELECTs the column again (the reader that comes back first)', 'src/engine/src/core/loop.ts',
    "    .select('id, tier, display_name, profession_preset, timezone, mode')",
    "    .select('id, tier, display_name, profession_preset, timezone, mode, victor_mode')",
    'the turn does not SELECT the column at all', 'b65_i1'],
  // REBUILD: §2.3 reads the COMPOSED PROMPT off the compiled engine, so a source
  // swap that is never compiled would prove nothing. tsc runs in the scratch.
  // ⚠ M37's FIRST CUT SWAPPED THE CONSTANT'S VALUES AND WAS UNOBSERVABLE, and the
  // derivation is worth keeping. §2.3 reads the two sentences OUT OF the constant
  // by key — which is what keeps the founder's copy veto free — so exchanging the
  // values moves the fixture with the cure and every cell stays green. The
  // failure that IS observable, and the one that matters, is the COMPOSITION
  // picking the wrong line for the room: that is the byte a later seat would get
  // backwards, and it is what this mutation drives.
  ['M37 the two room lines are SWAPPED (Victor names the room he is not in)', 'src/engine/src/core/loop.ts',
    "    + (isConsult ? '' : (isAdvisor ? ROOM_LINE.advisor : ROOM_LINE.business))",
    "    + (isConsult ? '' : (isAdvisor ? ROOM_LINE.business : ROOM_LINE.advisor))",
    'DRIVEN: a BUSINESS turn carries the business line and NOT the advisor one', 'b65_i1', 'rebuild'],
  ['M38 the CONSULT room is handed a room line too (fork F2 reversed)', 'src/engine/src/core/loop.ts',
    "    + (isConsult ? '' : ROOM_LINE.advisor)",
    "    + ROOM_LINE.advisor",
    '1.11 consult untouched', 'b116', 'rebuild'], // RE-AIMED (CE-45 LCV-16 LSP_5, labelled): the compose expression as L5-b leaves it; b65_i1 2.5 retired, b116 1.11 drives consult
  ['M39 the witness says `column` again over a room no column decided', 'src/engine/src/core/loop.ts',
    "const roomSource = args.roomAssert ? 'assert' : 'default';",
    "const roomSource = args.roomAssert ? 'assert' : 'column';",
    '1.3 the [engine:mode] line printed the room before the throw', 'b116', 'rebuild'], // RE-AIMED (CE-45 LCV-16 LSP_5, labelled): roomSource as L5-a leaves it; b65_i1 3.1 retired, b116 1.3 pins source=default
  ['M40 the resolver takes its column parameter back', 'src/lib/modelRouter.js',
    "function resolveVendorRoom({ surface, modeOverride, roomAssert }) {",
    "function resolveVendorRoom({ surface, modeOverride, roomAssert, columnMode }) {",
    '`resolveVendorRoom` has no `columnMode` parameter left to read', 'b65_i1'],
  ['M41 the column\'s writers are retired along with its readers (the over-cure)', 'src/api/vendor-engine/vendorMode.js',
    "    .from('agents').update({ victor_mode: target }).eq('id', agentId);",
    "    .from('agents').select('id').eq('id', agentId);",
    'the column is NOT retired — its writers and the chip\'s reader stand', 'b65_i1'],
];

// THE BENCH EACH MUTATION DRIVES. Default `b65_g1`; seat I's cells live in
// `b65_i1`. A mutation naming a cell in the wrong bench would report MISS, not a
// false ok — the runner matches the named cell against that bench's FAILED line.
const BENCH = {
  b65_g1: 'scripts/b65_g1_wa_advisor_off_bench.js',
  b65_i1: 'scripts/b65_i1_advisor_room_only_bench.js',
  b116: 'scripts/b116_lcv16_lsp5_bench.js', // CE-45 LCV-16 LSP_5: the rung that now owns the room's live subjects
};

// ── CE-45 LCV-15 LSP_1 · LABELLED AMENDMENT: THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────────────
// Each row names a cell by its id and the reason it retires: the cell read code LSP_1 deleted (the WhatsApp chain's tail,
// the switch `vendor.working_chain_enabled`, listenAfterWire, the imperative family, calendarSignals.js, leadPings.js,
// introductionSeat.js). A retired cell is NOT counted as a pass; it prints RETIRED with its reason. CONTROL: at exit every
// row must have matched exactly ONE cell that this run reached, or the bench fails, so the table can never retire a cell
// by accident or outlive the cell it names.
const __RETIRE = new Map([
  // CE-45 LCV-16 LSP_5 (A-45.2): eight mutations whose targets are deleted, retired, never "restored".
  ["M1 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M2 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M3 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M23 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M24 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M26 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M35 ", "LSP_5 (L5-a/L5-b): its target, the three-term room resolution with modeOverride, is deleted; runTurn serves advisor and consult (b116 1.1, 2.1)"],
  ["M37 ", "LSP_5 (L5-b): ROOM_LINE.business is deleted; there are no two room lines to swap (b116 1.6 pins the advisor line)"],

  [
    "M4 ",
    "LSP_1: its anchor is a line of the WhatsApp chain in vendorInbound.js, deleted (a dead anchor)"
  ],
  [
    "M5 ",
    "LSP_1: its anchor is a line of the WhatsApp chain in vendorInbound.js, deleted (a dead anchor)"
  ],
  [
    "M14 ",
    "LSP_1: its anchor is a line of the WhatsApp chain in vendorInbound.js, deleted (a dead anchor)"
  ],
  [
    "M21 ",
    "LSP_1: its anchor is a line of the WhatsApp chain in vendorInbound.js, deleted (a dead anchor)"
  ]
]);
const __seen = new Map();
function __retired(name) {
  const n = String(name);
  for (const [k, why] of __RETIRE) if (n.startsWith(k)) { __seen.set(k, (__seen.get(k) || 0) + 1); console.log(`  RETIRED  ${n}  (${why})`); return true; }
  return false;
}
process.on('exit', () => {
  const bad = [...__RETIRE.keys()].filter((k) => __seen.get(k) !== 1);
  if (bad.length) { console.log(`  FAIL  the retired-cell table does not match exactly one reached cell per row: ${bad.join(' | ')}`); process.exitCode = 1; }
});
let bad = 0;
for (const [id, file, from, to, cellName, benchKey, rebuild] of MUT) {
  if (__retired(id)) continue;
  const bench = BENCH[benchKey || 'b65_g1'];
  const scratch = fs.mkdtempSync('/tmp/b65m-');
  execSync(`cp -r ${ROOT}/src ${ROOT}/db ${ROOT}/scripts ${ROOT}/package.json ${scratch}/ && ln -s ${ROOT}/node_modules ${scratch}/node_modules`);
  const p = path.join(scratch, file); const s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  // A DEAD ANCHOR IS NOT A PASS. `??` is neither ok nor MISS — it says the
  // mutation no longer describes the tree, which is the state c-41.46 cured one
  // bench over this same sitting.
  if (n !== 1) { console.log(`  ??     ${id} — target matched ${n} times`); bad++; fs.rmSync(scratch, { recursive: true, force: true }); continue; }
  fs.writeFileSync(p, s.replace(from, to));
  // REBUILD, when the named cell reads `dist`. A tsc failure is NOT a pass: the
  // mutation is reported dead rather than credited with a red it never drove.
  if (rebuild) {
    try { execSync(`cd ${scratch} && ./node_modules/.bin/tsc -p src/engine/tsconfig.json`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) {
      console.log(`  ??     ${id} — the mutated tree does not compile; no red was driven`);
      bad++; fs.rmSync(scratch, { recursive: true, force: true }); continue;
    }
  }
  let out = '';
  try { out = execSync(`B65_ROOT=${scratch} node ${scratch}/${bench}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  // The NAMED cell must be among the failures. A mutation that reds something
  // else has not proven its cell — it has proven the tree is fragile.
  const line = out.split('\n').find(l => l.includes('FAILED:')) || '';
  const hit = line.includes(cellName);
  console.log(`  ${hit ? 'ok   ' : 'MISS '} ${id}`);
  if (!hit) { bad++; console.log(`         expected RED: ${cellName}`); console.log(`         got: ${line.slice(0, 300)}`); }
  fs.rmSync(scratch, { recursive: true, force: true });
}
const __nRetired = [...__seen.values()].reduce((a, b) => a + b, 0); // A-45.2: a retired mutation is never credited as a pass
console.log(`\n  b65_mutations  ${MUT.length - __nRetired - bad}/${MUT.length - __nRetired}  (retired: ${__nRetired})`);
process.exit(bad ? 1 : 0);
