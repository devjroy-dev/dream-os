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

const MUT = [
  // ── THE ROOM ──────────────────────────────────────────────────────────────
  ['M1 the engine goes back to reading the row alone (the half-cure)', 'src/engine/src/core/loop.ts',
    "  const isAdvisor = !isConsult && ((args.modeOverride ?? agent.victor_mode) as string | null) === 'advisor';",
    "  const isAdvisor = !isConsult && (agent.victor_mode as string | null) === 'advisor';",
    'the room predicate prefers the override over the row'],
  ['M2 the override wins the WRONG way round (the row overrules the door)', 'src/engine/src/core/loop.ts',
    "args.modeOverride ?? agent.victor_mode",
    "agent.victor_mode ?? args.modeOverride",
    'the room predicate prefers the override over the row'],
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
    "async function buildLlmForTurn({ supabase, vendor, agentId, surface = 'pwa_vendor' }) {",
    "async function buildLlmForTurn({ supabase, vendor, agentId, surface = 'pwa_vendor' }) {\n  const modeOverride = 'business';",
    'the PWA door passes NOTHING — the app keeps the room'],
  ["M8 R-41.105's witness line is dropped", 'src/engine/src/core/loop.ts',
    "  console.log(`[engine:mode] room=${isConsult ? 'consult' : (isAdvisor ? 'advisor' : 'business')} `\n    + `override=${args.modeOverride ? 'yes' : 'no'}`);",
    "  ;",
    'R-41.105\'s witness line is at the predicate and names the room'],

  // ── THE ROUTE ─────────────────────────────────────────────────────────────
  ['M9 the WA route reads the column again', 'src/api/vendor-engine/chat.js',
    "  const victorMode = surface === 'wa_vendor'\n    ? waLaneMode()\n    : await readVictorMode({ supabase, agentId });",
    "  const victorMode = await readVictorMode({ supabase, agentId });",
    'the same flipped agent on wa_vendor routes the PRODUCT tier, and the column is never SELECTed'],
  ['M10 the WA route ASKS and then discards the answer (the shape this seat refused)', 'src/api/vendor-engine/chat.js',
    "  const victorMode = surface === 'wa_vendor'\n    ? waLaneMode()\n    : await readVictorMode({ supabase, agentId });",
    "  const _asked = await readVictorMode({ supabase, agentId });\n  const victorMode = surface === 'wa_vendor' ? waLaneMode() : _asked;",
    'the same flipped agent on wa_vendor routes the PRODUCT tier, and the column is never SELECTed'],
  ['M11 the PWA route loses its advisor tier (the app stops routing the room)', 'src/api/vendor-engine/chat.js',
    "  const routeTier = victorMode === 'advisor' ? 'advisor' : productTier;",
    "  const routeTier = productTier;",
    'buildLlmForTurn on pwa_vendor STILL routes the advisor room to its own tier'],

  // ── THE ONE HOME ──────────────────────────────────────────────────────────
  ['M12 the route spells `business` itself (two homes for one rule)', 'src/api/vendor-engine/chat.js',
    "  const victorMode = surface === 'wa_vendor'\n    ? waLaneMode()\n    : await readVictorMode({ supabase, agentId });",
    "  const victorMode = surface === 'wa_vendor'\n    ? 'business'\n    : await readVictorMode({ supabase, agentId });",
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
];

let bad = 0;
for (const [id, file, from, to, cellName] of MUT) {
  const scratch = fs.mkdtempSync('/tmp/b65m-');
  execSync(`cp -r ${ROOT}/src ${ROOT}/db ${ROOT}/scripts ${ROOT}/package.json ${scratch}/ && ln -s ${ROOT}/node_modules ${scratch}/node_modules`);
  const p = path.join(scratch, file); const s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  // A DEAD ANCHOR IS NOT A PASS. `??` is neither ok nor MISS — it says the
  // mutation no longer describes the tree, which is the state c-41.46 cured one
  // bench over this same sitting.
  if (n !== 1) { console.log(`  ??     ${id} — target matched ${n} times`); bad++; fs.rmSync(scratch, { recursive: true, force: true }); continue; }
  fs.writeFileSync(p, s.replace(from, to));
  let out = '';
  try { out = execSync(`B65_ROOT=${scratch} node ${scratch}/scripts/b65_g1_wa_advisor_off_bench.js`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  // The NAMED cell must be among the failures. A mutation that reds something
  // else has not proven its cell — it has proven the tree is fragile.
  const line = out.split('\n').find(l => l.includes('FAILED:')) || '';
  const hit = line.includes(cellName);
  console.log(`  ${hit ? 'ok   ' : 'MISS '} ${id}`);
  if (!hit) { bad++; console.log(`         expected RED: ${cellName}`); console.log(`         got: ${line.slice(0, 300)}`); }
  fs.rmSync(scratch, { recursive: true, force: true });
}
console.log(`\n  b65_mutations  ${MUT.length - bad}/${MUT.length}`);
process.exit(bad ? 1 : 0);
