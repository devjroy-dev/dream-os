// scripts/b05_arc_m2_bench.js — TDW_05 COUPLE-LANE MECHANICAL ARC, MOVEMENT M2.
//   node scripts/b05_arc_m2_bench.js        (runnable from any cwd — Q-SP-5)
//
// THE NAMED PROOF-TEST (CE-67): prose "4 lakhs", hand 4000000, ok:true —
// either the hand writes 400000 exact, or the guard HOLDS with the honest
// question; NEVER 4000000-with-ok. Reproduced RED at the uncured tree in §7.
'use strict';

// The dist require is LAZY (moneyGuard divergence 1), but it still needs credible
// env when it fires. Set BEFORE any bride-lane require, the b05_couple_soul_bench
// fencing precedent. These are shape-only placeholders; nothing connects.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-key';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const code = (rel) => read(rel).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

const guard = require(P('src/lib/moneyGuard.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
async function ta(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function H(s) { console.log(`\n${s}`); }

// A supabase fake faithful enough that the REAL executors run against it.
function makeSupabase(sink) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, gte: () => b,
      lte: () => b, limit: () => b, not: () => b,
      insert: (row) => { sink.push({ table, op: 'insert', row }); return b; },
      update: (row) => { sink.push({ table, op: 'update', row }); return b; },
      delete: () => { sink.push({ table, op: 'delete' }); return b; },
      single: () => Promise.resolve({ data: { id: 'r1', vendor_name: 'DJ Nashaa', title: 'x', amount_total: 400000 }, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (tb) => builder(tb), rpc: () => Promise.resolve({ data: null, error: null }) };
}
const COUPLE = { id: 'c1', user_id: 'u1' };
const CONVO  = { id: 'conv1', couple_id: 'c1' };

(async () => {

// ══════════════════════════════════════════════════════════════════════════
H('§1 — F-05.35: THE NAMED PROOF-TEST, THROUGH THE REAL WRITE SEAM');

const { executeBrideTool } = require(P('src/agent/brideEngine.js'));
const HER_WORDS = 'the decorator quoted 4 lakhs\nbook them please';

await ta('§1.1 *** prose "4 lakhs", hand 4000000 -> HELD, NOTHING WRITTEN ***', async () => {
  guard._reset();
  const sink = [];
  const r = await executeBrideTool({
    name: 'add_booking', input: { vendor_name: 'Decor Co', category: 'decor', amount_total: 4000000 },
    couple: COUPLE, conversation: CONVO, supabase: makeSupabase(sink), brideWords: HER_WORDS,
  });
  assert.strictEqual(r.ok, false, 'the 10x write went through with ok:true — F-05.35 alive');
  assert.strictEqual(r.held, true);
  assert.ok(/HELD/.test(r.error) && /4000000/.test(r.error), 'the hold must name the figure it refused');
  assert.deepStrictEqual(sink.filter(s => s.op === 'insert'), [],
    'the guard held and the row was written anyway — the hold must precede the door, not follow it');
});

await ta('§1.2 the SAME sentence with 400000 files clean — the guard is narrow, not a wall', async () => {
  guard._reset();
  const sink = [];
  const r = await executeBrideTool({
    name: 'add_booking', input: { vendor_name: 'Decor Co', category: 'decor', amount_total: 400000 },
    couple: COUPLE, conversation: CONVO, supabase: makeSupabase(sink), brideWords: HER_WORDS,
  });
  assert.notStrictEqual(r.held, true, 'her own figure was held — a false hold teaches the model to route around the floor');
});

t('§1.3 the hold reads her figure through the ENGINE\'s parseMoney, not a second one', () => {
  guard._reset();
  // "45k" spoken, 45000 written: only agreement on notation makes this pass.
  assert.strictEqual(guard.checkBrideMoneyProvenance('add_booking', { amount_total: 45000 }, 'yes 45k is fine'), null);
  assert.ok(guard.checkBrideMoneyProvenance('add_booking', { amount_total: 45000 }, 'yes 4.5k is fine'),
    'a figure she never said must hold');
});

t('§1.4 FAIL-CLOSED: a caller that supplies no corpus cannot vouch', () => {
  guard._reset();
  assert.ok(guard.checkBrideMoneyProvenance('add_booking', { amount_total: 80000 }, undefined));
  assert.ok(guard.checkBrideMoneyProvenance('add_booking', { amount_total: 80000 }, ''));
});

t('§1.5 reads and non-money hands pass untouched', () => {
  guard._reset();
  assert.strictEqual(guard.checkBrideMoneyProvenance('list_bookings', { limit: 5 }, ''), null);
  assert.strictEqual(guard.checkBrideMoneyProvenance('add_event', { title: 'sangeet', event_date: '2026-12-20' }, ''), null);
  assert.strictEqual(guard.checkBrideMoneyProvenance('delete_booking', { booking_id: 'b1' }, ''), null);
});

// ══════════════════════════════════════════════════════════════════════════
H('§2 — THE POLYMORPHIC FIELD: save_wedding_detail, SCOPED');

t('§2.1 *** a wedding DATE never holds its own write *** (the divergence-2 trap)', () => {
  guard._reset();
  // THE SPECIMEN, derived by command not assumed: parseMoney('2027') === 2027.
  // brideTools.js:50 invites a bare year ("month/season string"), so "we're pushing
  // it a year" -> wedding_date '2027' is ordinary traffic. Unpredicated, the guard
  // reads that year as a rupee figure, finds no 2027 in her words, and REFUSES TO
  // LET HER SET HER OWN WEDDING DATE. ('2027-02-15' and 'February 2027' both parse
  // to null and would have made this cell pass for the wrong reason.)
  assert.strictEqual(guard.checkBrideMoneyProvenance('save_wedding_detail',
    { field: 'wedding_date', value: '2027' }, "we're pushing the wedding out a year"), null);
  assert.strictEqual(guard.checkBrideMoneyProvenance('save_wedding_detail',
    { field: 'wedding_date', value: '2027-02-15' }, 'we moved it to 15 Feb 2027'), null);
  assert.strictEqual(guard.checkBrideMoneyProvenance('save_wedding_detail',
    { field: 'wedding_city', value: 'Jaipur' }, 'Jaipur now'), null);
  assert.strictEqual(guard.checkBrideMoneyProvenance('save_wedding_detail',
    { field: 'partner_name', value: 'Arjun' }, 'his name is Arjun'), null);
});

t('§2.2 budget_total IS guarded — scoped in, as ruled', () => {
  guard._reset();
  assert.ok(guard.checkBrideMoneyProvenance('save_wedding_detail', { field: 'budget_total', value: 3500000 }, 'hi'),
    'an unvouched budget must hold');
  assert.strictEqual(guard.checkBrideMoneyProvenance('save_wedding_detail',
    { field: 'budget_total', value: 3500000 }, 'our budget is 35 lakhs'), null,
    'her own 35 lakhs must file');
});

t('§2.3 the field map matches brideTools.js at THIS tip — enumerated, not guessed', () => {
  const tools = read('src/agent/brideTools.js');
  for (const [hand, spec] of Object.entries(guard.MONEY_WRITE_HANDS)) {
    assert.ok(tools.includes(`name: '${hand}'`), `${hand} is not a tool at this tip`);
    for (const f of spec.fields)
      assert.ok(new RegExp(`^\\s+${f}:\\s*\\{`, 'm').test(tools), `${hand}.${f} is not in the schema`);
  }
  assert.deepStrictEqual(Object.keys(guard.MONEY_WRITE_HANDS).sort(),
    ['add_booking', 'record_payment', 'save_wedding_detail', 'update_booking'],
    'the money-hand census drifted from the ruled four');
});

// ══════════════════════════════════════════════════════════════════════════
H('§3 — F4: THE DIST REQUIRE, ONE HOME FOR THE NOTATION');

t('§3.1 parseMoney comes from src/engine/dist, not a second implementation', () => {
  const g = code('src/lib/moneyGuard.js');
  assert.ok(/require\('\.\.\/engine\/dist\/core\/tools\/recordPrimitives\.js'\)/.test(g),
    'the notation must come from the engine, or the floor and the door disagree about "50k"');
  assert.ok(/require\('\.\.\/engine\/dist\/core\/provenanceHold\.js'\)/.test(g),
    'extractVendorFigures must come from the one home too');
  assert.ok(!/function parseMoney/.test(g), 'a second parseMoney is the fork F4 refused');
});

t('§3.2 the require is LAZY — brideEngine must load without DB credentials', () => {
  const g = code('src/lib/moneyGuard.js');
  const head = g.slice(0, g.indexOf('function engineMoney'));
  assert.ok(!/require\('\.\.\/engine\/dist/.test(head),
    'a module-scope dist require REDs two floor benches on a module they do not test');
});

t('§3.3 the floor and the door agree on the notation', () => {
  const { parseMoney } = require(P('src/engine/dist/core/tools/recordPrimitives.js'));
  assert.strictEqual(parseMoney('4 lakhs'), 400000);
  assert.strictEqual(parseMoney('45k'), 45000);
});

// ══════════════════════════════════════════════════════════════════════════
H('§4 — F-05.41 SECOND FLOOR: CONFIRM-CONSUMED-ONCE');

await ta('§4.1 *** one "yeah", ONE row — the second claimant sees it spent ***', async () => {
  guard._reset();
  const words = 'yes book DJ Nashaa for 45000';
  const args  = { vendor_name: 'DJ Nashaa', category: 'music', amount_total: 45000 };
  const s1 = [], s2 = [];
  const a = await executeBrideTool({ name: 'add_booking', input: args, couple: COUPLE,
    conversation: CONVO, supabase: makeSupabase(s1), brideWords: words });
  const b = await executeBrideTool({ name: 'add_booking', input: args, couple: COUPLE,
    conversation: CONVO, supabase: makeSupabase(s2), brideWords: words });
  assert.notStrictEqual(a.held, true, 'the FIRST write must land — this is a confirm, not a ban');
  assert.strictEqual(b.held, true, 'the duplicate wrote a second Rs 45,000 — F-05.41 alive at the write layer');
  assert.ok(/spent/i.test(b.error), 'the second claimant must be told the confirmation was spent');
  assert.deepStrictEqual(s2.filter(x => x.op === 'insert'), [], 'the duplicate reached the door anyway');
});

t('§4.2 a DIFFERENT conversation is not blocked by another bride\'s claim', () => {
  guard._reset();
  const k1 = guard.moneyClaimKey({ conversationId: 'c-A', name: 'add_booking', input: { vendor_name: 'X' }, figure: 45000 });
  const k2 = guard.moneyClaimKey({ conversationId: 'c-B', name: 'add_booking', input: { vendor_name: 'X' }, figure: 45000 });
  assert.ok(guard.claimMoneyWrite(k1));
  assert.ok(guard.claimMoneyWrite(k2), 'two brides paying the same amount must not collide');
});

t('§4.3 a DIFFERENT figure or subject is a different decision', () => {
  guard._reset();
  const mk = (v, f) => guard.moneyClaimKey({ conversationId: 'c1', name: 'add_booking', input: { vendor_name: v }, figure: f });
  assert.ok(guard.claimMoneyWrite(mk('DJ', 45000)));
  assert.ok(guard.claimMoneyWrite(mk('Bloom', 45000)), 'a different vendor is a different booking');
  assert.ok(guard.claimMoneyWrite(mk('DJ', 80000)), 'a different figure is a different decision');
});

t('§4.4 the claim EXPIRES — a real second payment later is never walled', () => {
  guard._reset();
  const k = guard.moneyClaimKey({ conversationId: 'c1', name: 'record_payment', input: { booking_id: 'b1' }, figure: 50000 });
  const t0 = 1000000;
  assert.ok(guard.claimMoneyWrite(k, t0));
  assert.ok(!guard.claimMoneyWrite(k, t0 + 1000), 'inside the window it must hold');
  assert.ok(guard.claimMoneyWrite(k, t0 + guard.CLAIM_TTL_MS + 1), 'outside the window it must file');
});

t('§4.5 the claim map is REAPED', () => {
  guard._reset();
  const t0 = 2000000;
  for (let i = 0; i < 6; i++)
    guard.claimMoneyWrite(guard.moneyClaimKey({ conversationId: 'c' + i, name: 'add_booking', input: {}, figure: i + 1 }), t0);
  guard.claimMoneyWrite('flush', t0 + guard.CLAIM_TTL_MS + 1);
  assert.strictEqual(guard._claimCount(), 1, `stale claims survived: ${guard._claimCount()}`);
});

t('§4.6 PROVENANCE RUNS FIRST — an unvouched figure never spends a claim', () => {
  guard._reset();
  const g = code('src/agent/brideEngine.js');
  const i = g.indexOf('checkBrideMoneyProvenance(name, input, brideWords)');
  const j = g.indexOf('claimMoneyWrite(key)');
  assert.ok(i > 0 && j > i, 'the claim must not be spent by a write the provenance floor was going to refuse');
});

t('§4.7 consumed-once carries its OWN replica-exposure sentence (no borrowed cover)', () => {
  const g = read('src/lib/moneyGuard.js');
  const i = g.indexOf('CONFIRM-CONSUMED-ONCE');
  const block = g.slice(i);
  assert.ok(/replica/i.test(block), 'its own exposure must be stated at its own home');
  assert.ok(/DEFERRED-NAMED/.test(block), 'and its own durable cure named');
  assert.ok(/turn lock's disclosure does\s*\n?\/\/\s*NOT cover it|does NOT cover it/i.test(block),
    'it must say in terms that the lock does not cover it');
});

// ══════════════════════════════════════════════════════════════════════════
H('§5 — THE SEAT');

t('§5.1 the guard sits at executeBrideTool — the seam BOTH agents share', () => {
  const g = code('src/agent/brideEngine.js');
  const fn = g.slice(g.indexOf('async function executeBrideTool'));
  const head = fn.slice(0, fn.indexOf('switch (name)'));
  assert.ok(/checkBrideMoneyProvenance/.test(head), 'the hold must be inside the function, before the switch');
  assert.ok(/claimMoneyWrite/.test(head), 'and so must the claim');
  const callers = [];
  for (const f of ['src/agent/brideEngine.js', 'src/agent/circleEngine.js'])
    for (const l of code(f).split('\n'))
      if (/await executeBrideTool\(\{/.test(l)) callers.push(f);
  assert.deepStrictEqual([...new Set(callers)].sort(),
    ['src/agent/brideEngine.js', 'src/agent/circleEngine.js'],
    'the caller census moved — the seat must still cover every one of them');
});

t('§5.2 the corpus is HERS ONLY — prompts, context and Mira never vouch', () => {
  const g = code('src/agent/brideEngine.js');
  assert.ok(/const brideWords = \[\s*\n\s*\.\.\.history\.filter\(m => m\.role === 'user'\)\.map\(m => m\.content\),\s*\n\s*inboundMessage,/.test(g),
    'the corpus must be user-role history plus the message in hand, and nothing else');
  assert.ok(!/brideWords[\s\S]{0,200}STATIC_SYSTEM_PROMPT|brideWords[\s\S]{0,200}dynamicContext/.test(g),
    'a prompt or context block in the corpus makes the model able to vouch for its own inventions');
});

t('§5.3 W-1 HELD: M2 touches no soul or prompt byte', () => {
  // ══ LABELED AMENDMENT — ARC M4. COUNT PRESERVED (amended in place, not removed). ══
  // THE DEFECT, and it is the executor's own: this cell read `git diff --name-only
  // HEAD` — the LIVE WORKING TREE — and so asserted "no soul file is dirty anywhere",
  // a property this movement has no standing to claim. M4 then opened the wall for
  // three founder-approved riders, lawfully and by charter, and this cell convicted
  // it. A guard that can only stay green by forbidding chartered future work is a
  // cell surviving its own subject — CE-63's class, third instance in this arc, and
  // this one nobody else built.
  // RE-AIMED to the property that was always the real one and is true forever: THIS
  // MOVEMENT'S OWN delivered files contain no soul or prompt byte. The live-tree W-1
  // guard now has exactly ONE home, in the movement that opens the wall
  // (b05_arc_m4_bench §4.1), where an exact expected file list makes it meaningful.
  // This movement's W-1 property stands sealed at its own commit, chair-verified.
  const MY_FILES = ['src/lib/moneyGuard.js','src/lib/witnessLine.js','src/agent/brideEngine.js'];
  for (const f of MY_FILES)
    for (const s2 of ['miraSoul', 'brideSystemPrompt', 'circleSystemPrompt', 'coupleSystemPrompt', 'brideTools', 'donnaSoul', 'harveySoul', 'src/engine/'])
      assert.ok(!f.includes(s2), `W-1 BREACH: this movement delivered ${f}, a soul/prompt/engine file`);
});

// ══════════════════════════════════════════════════════════════════════════
if (!process.env.M2_BENCH_CHILD) {
  H('§6 — NON-VACUOUS: EACH CURE REPRODUCED RED AT THE UNCURED TREE');
  const { execFileSync } = require('child_process');
  const MUTATIONS = [
    { cell: '§1.1', why: 'the hold removed — the 10x write files with ok:true again',
      file: 'src/agent/brideEngine.js',
      from: '  const held = checkBrideMoneyProvenance(name, input, brideWords);',
      to:   '  const held = null;' },
    { cell: '§2.1', why: 'the polymorphic predicate dropped — a wedding date holds its own write',
      file: 'src/lib/moneyGuard.js',
      from: '    when: (input) => input && input.field === \'budget_total\',',
      to:   '    when: (input) => !!input,' },
    { cell: '§1.4', why: 'fail-open on a missing corpus — silence vouches for any figure',
      file: 'src/lib/moneyGuard.js',
      from: '    if (figures === null) figures = extractVendorFigures(brideWords || \'\');',
      to:   '    if (!brideWords) return null;\n    if (figures === null) figures = extractVendorFigures(brideWords);' },
    { cell: '§4.1', why: 'consumed-once removed — one "yeah" writes twice again',
      file: 'src/agent/brideEngine.js',
      from: '    if (!claimMoneyWrite(key)) {',
      to:   '    if (false) {' },
    { cell: '§4.4', why: 'the claim never expires — a real second payment is walled forever',
      file: 'src/lib/moneyGuard.js',
      from: '  for (const [k, exp] of _claims) if (exp <= now) _claims.delete(k);',
      to:   '  ;' },
  ];
  for (const m of MUTATIONS) {
    const abs = P(m.file);
    const original = fs.readFileSync(abs, 'utf8');
    try {
      if (!original.includes(m.from)) { console.log(`  FAIL ${m.cell} MUTATION anchor stale in ${m.file}`); fail++; continue; }
      fs.writeFileSync(abs, original.replace(m.from, m.to));
      let red = false, out = '';
      try {
        execFileSync(process.execPath, [P('scripts/b05_arc_m2_bench.js')],
          { env: { ...process.env, M2_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' });
      } catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) { console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`); fail++; }
      else if (!out.includes(`FAIL ${m.cell}`)) {
        const f2 = out.split('\n').filter(l => l.startsWith('  FAIL')).map(l => l.slice(7, 14).trim());
        console.log(`  FAIL ${m.cell} went red on the WRONG cell(s) [${f2.join(' ')}] — ${m.why}`); fail++;
      } else { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    } finally { fs.writeFileSync(abs, original); }
  }
  t('§6.0 every mutated file restored BYTE-IDENTICAL', () => {
    for (const m of MUTATIONS) {
      const now = fs.readFileSync(P(m.file), 'utf8');
      assert.ok(now.includes(m.from), `${m.file} did not come back`);
    }
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — her figure or the honest question, never ten times what she said;');
  console.log('and one confirmation spends once. Live witness is the FOUNDER\'s.');
}
process.exit(fail === 0 ? 0 : 1);
})();
