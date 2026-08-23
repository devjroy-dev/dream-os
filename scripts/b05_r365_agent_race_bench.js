#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// b05_r365_agent_race — R-36.5 F1 · THE GET-OR-CREATE RACE, AND ITS ARBITER
//
// THE PROPERTY THIS BENCH DEFENDS, in one sentence: two first-touches for the same
// vendor produce ONE agent and ONE owner anchor, and the loser reads rather than
// writes.
//
// The disease (CE-224): `engine.agents` carried no UNIQUE on user_id and
// agentBridge did a bare read-then-insert. The PWA's first screen fans several
// authenticated calls out at once, so the window opened on every signup — eleven
// duplicate pairs in one day. `.maybeSingle()` then threw on the next turn, and at
// vendorInbound.js:1399 that throw sits upstream of every word gate AND the cap
// gate: the vendor got the dead-letter hiccup line instead of her honest refusal.
//
// TWELVE CELLS. Every one RED at the uncured tree and GREEN at the cured one, and
// every mutation in the both-ways proof is applied to PRODUCTION SOURCE, never to
// this file's setup — a bench that reddens only when its own fixture is bent has
// proven nothing about the estate.
//
// WHY SOURCE-SHAPE AND NOT A LIVE RACE. The property is "what does this code ask
// the DATABASE to do" — an ON CONFLICT inference clause and a write that does not
// happen. Two concurrent calls against a stub prove the stub's locking, not
// Postgres's. The arbiter is asserted where it actually lives (0129) and the
// client's request shape is asserted at the call site. §5 draws that boundary
// explicitly so nobody later reads this bench as claiming more than it checks.
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5): every path resolves off __dirname.
// ═══════════════════════════════════════════════════════════════════════════════

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const { stripComments, NAIVE_RETIRED } = require('./lib/stripComments');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

const BRIDGE_SRC = P('src/api/middleware/agentBridge.js');
const SIGNUP_SRC = P('src/engine/src/core/signup.ts');
const MIG_SRC    = P('db/migrations/0129_agents_user_id_unique.sql');

// COMMENTS STRIPPED BEFORE EVERY CODE ASSERTION. This estate's cure comments quote
// the bytes they retired — including, in both files under test, the literal words
// `.insert(` inside the explanation of why the insert is gone. A cell reading raw
// text would convict on the explanation (F-07.74's whole family).
const bridgeCode = stripComments(fs.readFileSync(BRIDGE_SRC, 'utf8'));
const signupCode = stripComments(fs.readFileSync(SIGNUP_SRC, 'utf8'));
const migText    = fs.readFileSync(MIG_SRC, 'utf8');   // prose IS the subject in §4

let pass = 0, fail = 0;
const QUEUE = [];
const t   = (name, fn) => QUEUE.push({ name, fn });
const say = (line) => QUEUE.push({ banner: line });
async function drain() {
  for (const c of QUEUE) {
    if (c.banner !== undefined) { console.log(c.banner); continue; }
    try { await c.fn(); console.log(`  ok   ${c.name}`); pass++; }
    catch (e) { console.log(`  FAIL ${c.name}\n       ${e.message}`); fail++; }
  }
}

// Slice a named block out of stripped source so a cell asserts INSIDE the branch it
// means, not anywhere in a 120-line file. Returns '' when the anchor is missing,
// which reddens the cell rather than passing on an empty window.
//
// ⚠ A WINDOW MUST NEVER END ON A BYTE A CELL ASSERTS. Caught on the both-ways run,
// not by reasoning: §2's end needle was `existed: !bornHere };`, so mutating that
// return line collapsed the window and reddened §2.1/§2.2/§2.3 as collateral —
// three cells reporting "createOwner still bare-inserts" about a tree where the
// insert was fine. A misleading red costs a sitting the same way a false green
// does. Both windows now close on a declaration no cell reads.
function windowFrom(code, startNeedle, endNeedle) {
  const s = code.indexOf(startNeedle);
  if (s < 0) return '';
  const e = code.indexOf(endNeedle, s);
  if (e < 0) return '';
  return code.slice(s, e + endNeedle.length);
}

// ═══ §0 · TDW_STRIPPER_CANARY — the stripper, its vacuity twin, its call-site ══
// F-07.74: the retired rule treated the `/*` inside `accept="image/*"` as a
// comment-open and deleted to the next real `*/`. F-07.99: a ported stripper
// definition with NO call-site fooled this estate for a whole block. The estate's
// standing contract for any bench holding a stripper is this canary plus §0.Z, and
// b07_f0774_stripper_bench enforces both — it caught this file's first draft, which
// did the same work under private cell names and satisfied neither.
say('\n§0 — the stripper is real, non-vacuous, and actually called');

t('§0.X/§0.Y/§0.Z the stripper, its vacuity twin, and its call-site', () => {
  const _spec = 'const a = 1;\nconst input = { accept: "image/*" };\nconst KEEP_ME = 2;\n/* real */\nconst ALSO_KEEP = 3;\n';
  assert.ok(stripComments(_spec).includes('KEEP_ME') && stripComments(_spec).includes('ALSO_KEEP'),
    '§0.X the stripper opened a block on a mid-token /* — F-07.74 has returned');
  assert.ok(!NAIVE_RETIRED(_spec).includes('KEEP_ME'),
    '§0.Y the retired rule no longer swallows — §0.X would be vacuous');
  const self = stripComments(fs.readFileSync(__filename, 'utf8'));   // TDW_STRIPPER_CANARY
  assert.ok((self.match(/\bstripComments\s*\(/g) || []).length >= 2,
    '§0.Z this bench holds a stripper it does not call — F-07.99 class');
});

t('§0.W the stripper BITES on these two sources — every absence cell below depends on it', () => {
  const raw = fs.readFileSync(BRIDGE_SRC, 'utf8');
  assert.ok(/BARE `\.insert\(/.test(raw),
    'the bridge no longer explains what it retired; this cell guards a window that moved');
  assert.ok(!/BARE `\.insert\(/.test(bridgeCode),
    'the stripper left the explanation in the code text — every absence cell below is unsound');
});

// ═══ §1 — THE BRIDGE ASKS FOR AN ARBITER ═══════════════════════════════════════
say('\n§1 — agentBridge: insert-on-conflict-re-read (ARM (a), R-36.5)');

const BRIDGE_MINT = () => windowFrom(bridgeCode, "const preset = resolvePreset(vendor.category);", 'return { agentId:');

t('§1.1 the agents write is an upsert keyed on user_id — the race has an arbiter', () => {
  const w = BRIDGE_MINT();
  assert.ok(w, 'the mint branch anchor is gone — this bench is reading the wrong window');
  assert.ok(/\.upsert\(\{/.test(w), 'the mint branch does not upsert — the bare insert is back');
  assert.ok(/onConflict:\s*'user_id'/.test(w),
    "the upsert names no conflict target; without onConflict:'user_id' PostgREST sends a plain insert and the race is unguarded");
});

t('§1.2 it is DO NOTHING, not DO UPDATE — the loser must not overwrite the winner', () => {
  const w = BRIDGE_MINT();
  assert.ok(/ignoreDuplicates:\s*true/.test(w),
    'ignoreDuplicates is absent or false — supabase-js then sends ON CONFLICT DO UPDATE, and the race LOSER rewrites the winner display_name/preset with whatever it happened to hold');
});

t('§1.3 no bare .insert( on agents survives in the mint branch', () => {
  const w = BRIDGE_MINT();
  assert.ok(!/from\('agents'\)\s*\n?\s*\.insert\(/.test(w),
    'a bare agents insert survives beside the upsert — two writers, one of them unguarded');
});

t('§1.4 the loser RE-READS rather than trusting an empty result', () => {
  const w = BRIDGE_MINT();
  assert.ok(/if\s*\(!a\)\s*\{/.test(w),
    'nothing handles the empty-set case; under DO NOTHING the loser gets no row and would carry `a` = null into `a.id`');
  assert.ok(/\.from\('agents'\)\.select\('id, profession_preset'\)\.eq\('user_id', u\.id\)\.single\(\)/.test(w),
    'the loser does not re-read the winner row by user_id');
});

t('§1.5 the owner anchor is LOSER-SAFE — gated on the race verdict, not on absence', () => {
  const w = BRIDGE_MINT();
  assert.ok(/const bornHere = !!ag\.data;/.test(w),
    'no race verdict is derived from the wire; there is nothing to gate the anchor on');
  const anchorAt = w.indexOf("from('agent_owner').insert(");
  assert.ok(anchorAt > 0, 'the owner anchor is gone entirely — Victor would open without a name');
  const gateAt = w.indexOf('if (bornHere) {');
  assert.ok(gateAt > 0 && gateAt < anchorAt,
    'the agent_owner insert is not inside the bornHere gate — a race loser writes a SECOND owner anchor, moving the duplicate disease one table sideways');
});

// ═══ §2 — createOwner TAKES THE SAME SHAPE ═════════════════════════════════════
say('\n§2 — signup.createOwner: the second writer under the new index');

const SIGNUP_MINT = () => windowFrom(signupCode, '  const { data: agentRow, error: agentErr }', 'export async function mintDemoOwner');

t('§2.1 createOwner upserts on user_id — 0129 turns its bare insert into a failed signup', () => {
  const w = SIGNUP_MINT();
  assert.ok(w, 'the createOwner mint window is gone — this bench is reading the wrong function');
  assert.ok(/\.upsert\(\{/.test(w), 'createOwner still bare-inserts the agent');
  assert.ok(/onConflict:\s*'user_id'/.test(w), 'createOwner names no conflict target');
  assert.ok(/ignoreDuplicates:\s*true/.test(w),
    'createOwner would DO UPDATE — a second concurrent signup rewrites the first one');
});

t('§2.2 createOwner re-reads on a lost race instead of throwing at the person signing up', () => {
  const w = SIGNUP_MINT();
  assert.ok(/const bornHere = !!agentRow;/.test(w), 'no race verdict is derived');
  assert.ok(/\.eq\('user_id', userId\)/.test(w) && /order\('created_at'/.test(w),
    'the loser does not re-read the winner row; a 23505 would surface as `agents insert failed` to a real person mid-signup');
});

t('§2.3 createOwner is loser-safe on agent_owner too', () => {
  const w = SIGNUP_MINT();
  const anchorAt = w.indexOf("from('agent_owner').insert(");
  assert.ok(anchorAt > 0, 'the owner anchor is gone from createOwner');
  const gateAt = w.indexOf('if (bornHere) {');
  assert.ok(gateAt > 0 && gateAt < anchorAt,
    'createOwner writes an owner anchor even when it lost the race');
});

t('§2.4 `existed` reports the truth — a race loser found, it did not create', () => {
  const w = SIGNUP_MINT();
  assert.ok(/existed:\s*!bornHere/.test(w),
    'createOwner reports existed:false to a caller whose agent it merely FOUND — the same lie the returning-user path exists to avoid');
});

t('§2.5 mintDemoOwner is UNTOUCHED — an always-fresh minter has no race to lose', () => {
  assert.ok(/mintDemoOwner/.test(signupCode), 'the demo minter is gone');
  const demo = windowFrom(signupCode, 'export async function mintDemoOwner', 'return { agent_id: a.id');
  assert.ok(/from\('agents'\)\s*\n?\s*\.insert\(/.test(demo),
    'the demo minter was converted too — scope grew past the ruling; its users row is fresh every call (auth_user_id null) so its user_id cannot collide');
});

// ═══ §3 — THE ARBITER EXISTS, AND IS UNIQUE ════════════════════════════════════
say('\n§3 — 0129: the index the inference clause resolves against');

t('§3.1 0129 creates a UNIQUE index on engine.agents(user_id)', () => {
  assert.ok(/CREATE UNIQUE INDEX IF NOT EXISTS agents_user_id_unique/.test(migText),
    '0129 does not create the unique index');
  assert.ok(/ON engine\.agents USING btree \(user_id\)/.test(migText),
    'the index does not target engine.agents(user_id) — an ON CONFLICT (user_id) inference clause would then ERROR on every first touch');
});

t('§3.2 the index is not CONCURRENTLY inside a transaction — that combination cannot run', () => {
  assert.ok(/BEGIN;/.test(migText) && /COMMIT;/.test(migText), '0129 is not wrapped in a transaction');
  assert.ok(!/CREATE UNIQUE INDEX CONCURRENTLY/.test(migText),
    'CONCURRENTLY cannot run inside a transaction block; this file would fail on paste');
});

t('§3.3 the dedupe witness is named IN-FILE as the precondition', () => {
  assert.ok(/CE-224/.test(migText) && /R-36\.4/.test(migText),
    "0129 does not name the founder's dedupe witness — CREATE UNIQUE INDEX ABORTS on a duplicated estate, and a reader who does not know that will force it");
  assert.ok(/0\s*·\s*0/.test(migText), 'the `0 · 0` witness is not named by its value');
});

t('§3.4 0129 states the apply-order law it depends on', () => {
  assert.ok(/APPLY ORDER IS LAW/.test(migText),
    '0129 does not state that it must run BEFORE the code deploys — the ordering that keeps onConflict from erroring on a missing arbiter');
});

// ═══ §4 — THE BOUNDARY THIS BENCH DOES NOT CROSS ═══════════════════════════════
say('\n§4 — what this bench does NOT prove (stated, so it is never over-read)');

t('§4.1 no cell here claims to have raced Postgres', () => {
  const self = fs.readFileSync(__filename, 'utf8');
  assert.ok(/prove the stub's locking, not\n\/\/ Postgres's/.test(self),
    'the boundary note is gone — a later reader could mistake these source-shape cells for a live concurrency proof');
});

async function main() {
  console.log('b05_r365_agent_race — R-36.5 F1 · the get-or-create race and its arbiter');
  await drain();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main();
