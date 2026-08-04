#!/usr/bin/env node
// scripts/b08_p5_closer_bench.js — TDW_08 P5 Phase 3: MAYA, THE CLOSER.
//
// R2 AS RULED: this bench lives in `scripts/`, not `src/agent/bench/`. The 06
// spec sited it at the latter; that directory does not exist and never has, and
// every bench in this estate runs from here. The estate's convention beats the
// spec's path (protocol §3.2).
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5: a cure nobody can re-run quietly
// stops being a cure).
//
// ── WHAT THIS BENCH IS AND IS NOT ────────────────────────────────────────────
// It is the MECHANICAL floor under Maya: the ceiling, the Manual slice, the
// cache breakpoints, the z-law through the REAL translateFor, the F-08.55
// guard, the nudge derivation and its fail-closed cap, the seam's transport
// identity, and the turn lock.
//
// It is NOT the golden scenarios. Those are model runs on both architectures and
// they are the FOUNDER'S with his keys — the estate's own precedent (the
// gauntlet's "rig selftest N/N at the desk, the LIVE run is the founder's").
// They live in `scripts/b08_p5_closer_scenarios.js` and their transcripts gate
// the deploy.
//
// ── NON-VACUITY ──────────────────────────────────────────────────────────────
// Every section below is proven able to fire. `--mutate=<name>` mutates
// PRODUCTION CODE (never test setup) and the run must go RED on exactly the
// cells that section owns. The mutation list is printed by `--mutations`.
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.resolve(__dirname, '..');

const MUTATE = (process.argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1] || null;

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; fails.push(label); console.log(`  FAIL ${label}`); }
}
function section(t) { console.log(`\n── ${t} ──`); }

// ═════════════════════════════════════════════════════════════════════════════
// MUTATION HARNESS — mutates PRODUCTION source, in memory, before require
// ═════════════════════════════════════════════════════════════════════════════
const MUTATIONS = {
  ceiling:      ['src/agent/souls/closerSoul.js', s => s.replace('const SOUL_CHAR_CEILING = 10000;', 'const SOUL_CHAR_CEILING = 100;')],
  manual_slice: ['src/agent/closerEngine.js',     s => s.replace('const MANUAL_BODY_FROM_LINE  = 14;', 'const MANUAL_BODY_FROM_LINE  = 1;')],
  one_breakpoint: ['src/agent/closerEngine.js',   s => s.replace("{ type: 'text', text: MAYA_SOUL, cache_control: { type: 'ephemeral' } },", "{ type: 'text', text: MAYA_SOUL },")],
  guard_off:    ['src/agent/closerEngine.js',     s => s.replace(".in('phone', [p, `+${p}`])", ".in('phone', [p])")],
  guard_closed: ['src/agent/closerEngine.js',     s => s.replace('    return false;\n  }\n}\n\n// ═', '    return true;\n  }\n}\n\n// ═')],
  nudge_count:  ['src/agent/closerEngine.js',     s => s.replace('return Math.max(0, run - 1);', 'return run;')],
  nudge_cap:    ['src/agent/closerEngine.js',     s => s.replace('const MAX_NUDGES = 2;', 'const MAX_NUDGES = 99;')],
  clock_uncond: ['src/agent/closerEngine.js',     s => s.replace('demo.discover_eligible === true &&', 'true &&')],
  zero_shows:   ['src/agent/closerEngine.js',     s => s.replace('if (count && count > 0) {', 'if (count >= 0) {')],
  lock_off:     ['src/lib/prospects.js',          s => s.replace("return withTurnLock(turnKey('marketing', inputs && inputs.from), () => _handleMarketingInbound(inputs));", 'return _handleMarketingInbound(inputs);')],
};

if (process.argv.includes('--mutations')) {
  console.log(Object.keys(MUTATIONS).join('\n')); process.exit(0);
}

if (MUTATE) {
  if (!MUTATIONS[MUTATE]) { console.error(`unknown mutation: ${MUTATE}`); process.exit(2); }
  const [rel, fn] = MUTATIONS[MUTATE];
  const abs = path.join(ROOT, rel);
  const orig = fs.readFileSync(abs, 'utf8');
  const next = fn(orig);
  if (next === orig) { console.error(`MUTATION ${MUTATE} DID NOT APPLY — its anchor moved. This is a RED, not a pass.`); process.exit(2); }
  const Module = require('module');
  const realCompile = Module.prototype._compile;
  Module.prototype._compile = function (content, filename) {
    return realCompile.call(this, filename === abs ? next : content, filename);
  };
  console.log(`\n*** MUTATED PRODUCTION CODE: ${MUTATE} (${rel}) — this run MUST go red ***`);
}

const soul   = require(path.join(ROOT, 'src/agent/souls/closerSoul.js'));
const closer = require(path.join(ROOT, 'src/agent/closerEngine.js'));
const { translateFor } = require(path.join(ROOT, 'src/lib/llm.js'));
const { DEFAULTS }     = require(path.join(ROOT, 'src/lib/modelRouter.js'));
const prospectsMod     = require(path.join(ROOT, 'src/lib/prospects.js'));
const turnLock         = require(path.join(ROOT, 'src/lib/turnLock.js'));

// ═════════════════════════════════════════════════════════════════════════════
// A minimal fake supabase — enough for the seams under test, no more.
// ═════════════════════════════════════════════════════════════════════════════
function fakeSupabase(db) {
  const D = Object.assign({ users: [], prospects: [], demo_vendors: [], demo_leads: [], conversations: [], messages: [], admin_config: [] }, db || {});
  function q(table) {
    let rows = D[table].slice();
    let headCount = false;
    const api = {
      select(_c, o) { if (o && o.head) headCount = true; return api; },
      eq(c, v)  { rows = rows.filter(r => r[c] === v); return api; },
      in(c, vs) { rows = rows.filter(r => vs.includes(r[c])); return api; },
      neq(c, v) { rows = rows.filter(r => r[c] !== v); return api; },
      not(c, _o, _v) { rows = rows.filter(r => r[c] != null); return api; },
      is(c, _v) { rows = rows.filter(r => r[c] == null); return api; },
      lt(c, v)  { rows = rows.filter(r => r[c] < v); return api; },
      order(c, o) { const asc = !o || o.ascending !== false; rows.sort((a, b) => (a[c] > b[c] ? 1 : -1) * (asc ? 1 : -1)); return api; },
      limit(n)  { rows = rows.slice(0, n); return api; },
      maybeSingle() { return Promise.resolve({ data: rows[0] || null, error: null }); },
      single()      { return Promise.resolve({ data: rows[0] || null, error: rows[0] ? null : { message: 'no row' } }); },
      insert(r) { const row = Object.assign({ id: `${table}_${D[table].length + 1}` }, r); D[table].push(row); const c = { select: () => c, single: () => Promise.resolve({ data: row, error: null }), then: (f) => Promise.resolve({ data: row, error: null }).then(f) }; return c; },
      update(patch) { const c = { eq(col, v) { D[table].filter(r => r[col] === v).forEach(r => Object.assign(r, patch)); rows = D[table].filter(r => r[col] === v); return c; }, in() { return c; }, is() { return c; }, select: () => c, maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }), single: () => Promise.resolve({ data: rows[0] || null, error: null }), then: (f) => Promise.resolve({ data: rows, error: null }).then(f) }; return c; },
      then(f) { return Promise.resolve({ data: headCount ? null : rows, count: rows.length, error: null }).then(f); },
    };
    return api;
  }
  return { from: q, db: D };
}

(async function main() {

  // ═══ 1 · THE SOUL, AND ITS CEILING ═══════════════════════════════════════
  section('1 · The soul');
  ok(soul.MAYA === 'Maya', 'the name is Maya, one home');
  ok(!/Raya/.test(soul.MAYA_SOUL) && !/Raya/.test(fs.readFileSync(path.join(ROOT, 'src/agent/souls/closerSoul.js'), 'utf8').replace(/`RAYA`|RAYA` was/g, '')), 'the vacated name carries no byte');
  ok(soul.MAYA_SOUL.length <= soul.SOUL_CHAR_CEILING, `soul within the amended ceiling (${soul.MAYA_SOUL.length}/${soul.SOUL_CHAR_CEILING})`);
  ok(soul.CLOSER_SOUL_VERSION === 'maya-v1', 'version const present for the log line (R1 as amended)');
  ok(soul.MAYA_SOUL.includes(`Your name is ${soul.MAYA}`), 'the name is interpolated, never a second literal');

  section('1b · The register, in her own bytes');
  ok(!/[₹]/.test(soul.MAYA_SOUL), 'no rupee glyph anywhere in the soul');
  ok(/Rs 1,20,000/.test(soul.MAYA_SOUL), 'money shown grouped, in the locked register');
  ok(/door open — gracefully:/.test(soul.MAYA_SOUL) && !/gentleman/.test(soul.MAYA_SOUL), 'the founder-ruled swap landed byte-exact');

  section('1c · LD-5 — the soul is a self, not a rules-list');
  ok(!/^\s*\d+\.\s/m.test(soul.MAYA_SOUL), 'no numbered rule list');
  ok(!/Forbidden|FORBIDDEN|forbidden phrases/.test(soul.MAYA_SOUL), 'no forbidden-phrase block');
  ok(!/^\s*[-*•]\s/m.test(soul.MAYA_SOUL), 'no bulleted directives');

  // ═══ 2 · THE MANUAL SLICE (FORK 6 / F-06.52's class) ═════════════════════
  section('2 · The Manual, meta-header sliced');
  const m = closer.loadManual();
  ok(m.version === 'v1', 'version parsed from the sliced header, not duplicated in code');
  ok(!/MANUAL_VERSION/.test(m.body), 'the version stamp does not enter her context');
  ok(!/Derived at/.test(m.body) && !/3b6fa97/.test(m.body), 'no commit hashes enter her context');
  ok(!/no agent loads/.test(m.body), 'the machinery sentence about what agents load is sliced away');
  ok(/WHAT THE DREAM WEDDING IS/.test(m.body), 'the body still begins at section 1 — the slice cut the header and nothing else');
  ok(/OBJECTIONS, ANSWERED HONESTLY/.test(m.body) && /DOES NOT DO/.test(m.body), 'the whole Manual is present, honesty sections included');

  // ═══ 3 · THE STATIC PREFIX — TWO BREAKPOINTS, ORDERED ════════════════════
  section('3 · Cache breakpoints');
  const sys = closer.buildStaticSystem();
  ok(sys.length === 2, 'exactly two static blocks');
  ok(!!sys[0].cache_control && !!sys[1].cache_control, 'BOTH carry a breakpoint — a Manual re-version must not invalidate the soul');
  ok(sys[0].text === soul.MAYA_SOUL, 'soul first');
  ok(sys[1].text.includes(m.body), 'Manual second');

  // ═══ 4 · THE Z-LAW, THROUGH THE REAL translateFor ════════════════════════
  section('4 · The z-law (real translateFor, both architectures)');
  const params = { model: 'x', system: closer.buildStaticSystem(), messages: [] };
  ok(translateFor('anthropic', params) === params, 'anthropic path is byte-identical — the SAME object, unmodified (llm.js:73)');
  const ds = translateFor('deepseek', params);
  ok(!JSON.stringify(ds).includes('cache_control'), 'deepseek: every cache_control deep-stripped');
  ok(ds.thinking && ds.thinking.type === 'disabled', 'deepseek: silent reasoning disabled');
  // Asserted on the OBJECT, not on JSON.stringify's output: stringify escapes
  // newlines, so a substring test against it silently compares the wrong bytes.
  // (Caught by this cell going red at the cured tree — the bench's own bug, in
  // the open. INDEPENDENT-METHOD clause 1: a check whose failure mode is a
  // silent mismatch is not a check.)
  ok(ds.system[0].text === soul.MAYA_SOUL && ds.system[1].text === params.system[1].text,
     'deepseek: the soul and Manual survive the strip byte-intact — only the annotation left');

  // ═══ 5 · THE ROUTE ═══════════════════════════════════════════════════════
  section('5 · The route (FORK 2)');
  const route = DEFAULTS['model.wa_marketing.default'];
  ok(!!route, 'DEFAULTS carries model.wa_marketing.default — a pre-seed deploy routes identically');
  ok(route.provider === 'anthropic' && /haiku/.test(route.model), 'seeded haiku per E-4');
  const seed = fs.readFileSync(path.join(ROOT, 'db/migrations/0110_marketing_route_seed.sql'), 'utf8');
  ok(seed.includes('model.wa_marketing.default') && seed.includes(route.model), 'the 0110 seed matches the DEFAULTS entry byte-for-byte on both fields');
  ok(seed.includes('on conflict (key) do nothing'), 'the seed is idempotent (0082 pattern)');

  // ═══ 6 · F-08.55 — THE REGISTERED-USER GUARD ═════════════════════════════
  section('6 · F-08.55, the registered-user guard');
  const sbPlus = fakeSupabase({ users: [{ id: 'u1', phone: '+919888294440' }] });
  ok(await closer.isRegisteredUser(sbPlus, '919888294440'), "the '+' form is caught — the founder's own stored shape");
  const sbBare = fakeSupabase({ users: [{ id: 'u1', phone: '919888294440' }] });
  ok(await closer.isRegisteredUser(sbBare, '+919888294440'), 'the bare form is caught too — both forms, because users.phone has no normalizer');
  ok(!(await closer.isRegisteredUser(fakeSupabase({ users: [] }), '919999000111')), 'a stranger is not a registered user');
  const sbThrow = { from() { throw new Error('db down'); } };
  ok(!(await closer.isRegisteredUser(sbThrow, '919888294440')), 'FAILS OPEN into Maya — a human already spoke; silence is the ruder failure');
  ok(closer.REGISTERED_USER_LINE === "You're already with us — this line is for people we haven't met yet.", "the sealed line is byte-exact, one sentence, the founder's own");

  // CAUGHT DELIBERATELY. If the guard misses, this call falls through to a REAL
  // model request — which in this container throws on the absent key. That throw
  // IS the conviction, but an uncaught one kills the run and takes the COUNT with
  // it, and a red whose count nobody can read is F-08.50's class. So the throw is
  // converted into a named FAIL that still reports.
  let guarded = null, guardThrew = null;
  try {
    guarded = await closer.runCloserTurn({ supabase: sbPlus, prospect: {}, conversationId: 'c1', phone: '919888294440' });
  } catch (e) { guardThrew = e; }
  ok(!guardThrew && guarded && guarded.source === 'registered_user_redirect' && guarded.text === closer.REGISTERED_USER_LINE,
     'a registered user gets the line and NO Maya turn'
     + (guardThrew ? ' — THE GUARD MISSED AND THE TURN REACHED THE MODEL' : ''));

  // ═══ 7 · THE NUDGE (FORK 1) ══════════════════════════════════════════════
  section('7 · The nudge — derived, never stored; capped, fail-closed');
  const O = { direction: 'outbound' }, I = { direction: 'inbound' };
  ok(closer.nudgesStandingFrom([I]) === 0, 'they spoke last: zero standing');
  ok(closer.nudgesStandingFrom([O, I]) === 0, 'her ANSWER is not a nudge');
  ok(closer.nudgesStandingFrom([O, O, I]) === 1, 'one nudge standing');
  ok(closer.nudgesStandingFrom([O, O, O, I]) === 2, 'two nudges standing — the cap');
  ok(closer.nudgesStandingFrom([O, O, O, O, I]) === 3, 'three: the exit is spent, she is never woken again');
  ok(closer.MAX_NUDGES === 2, 'the cap is two nudges plus one exit, mechanical');
  const hrs = await closer.readNudgeHours(fakeSupabase({}));
  ok(hrs.length === 3 && hrs[2] < 24, 'all three thresholds fit inside the 24h window sendWa requires');
  ok(hrs.every((h, i) => i === 0 || h - hrs[i - 1] >= 1), 'thresholds are at least an hour apart — the cron resolves hourly');

  // ═══ 8 · THE CONTEXT — CONDITIONED OR SILENT ═════════════════════════════
  section('8 · The dynamic context');
  const baseDemo = {
    id: 'd1', ig_handle: 'swatitomar_p4b', display_name: 'Swati Test Demo 2', category: 'makeup',
    city: 'Delhi', state: 'invited', active: true, discover_eligible: false,
    claimed_at: null, invited_at: '2026-08-03T21:16:23Z', created_at: '2026-08-03T15:57:14Z', sunset_at: null,
  };
  const prospect = { id: 'p1', phone: '919888294440', name: null, ig_handle: null, category: null, city: null, notes: null, demo_vendor_ref: 'd1' };

  let ctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect);
  ok(/Swati Test Demo 2/.test(ctx) && /makeup/.test(ctx) && /Delhi/.test(ctx),
     'THE DEMO ROW IS PRIMARY — the spec named the prospect row and all three columns are NULL there');
  ok(!/Days left/.test(ctx), 'THE CLOCK IS SILENT on a row outside the sweep population (discover_eligible false)');
  ok(/NOT on the marketplace/.test(ctx), 'the two senses are held apart — a live page is not a listing');
  ok(!/Enquiries waiting/.test(ctx), 'ZERO COLLAPSES — a count of zero is not handed to a saleswoman');

  ctx = await closer.buildProspectContext(fakeSupabase({
    demo_vendors: [Object.assign({}, baseDemo, { discover_eligible: true })],
    demo_leads: [{ id: 'l1', demo_vendor_id: 'd1' }, { id: 'l2', demo_vendor_id: 'd1' }],
  }), prospect);
  ok(/Days left/.test(ctx), 'the clock SPEAKS once the row is genuinely in the sweep population');
  ok(/It is also out on the marketplace/.test(ctx), 'the marketplace sentence is earned by discover_eligible');
  ok(/Enquiries waiting on that page for them: 2/.test(ctx), 'a non-zero count enters context');
  ok(!/bride_phone|bride_email|bride_name/.test(ctx), 'F-07.41 — demo_leads is COUNTED, never read for content');

  ctx = await closer.buildProspectContext(fakeSupabase({
    demo_vendors: [Object.assign({}, baseDemo, { discover_eligible: true, sunset_at: '2026-08-04T00:00:00Z' })],
  }), prospect);
  ok(!/Days left/.test(ctx), 'a row already swept has NO days left — sunset_at is the history stamp, never the deadline');

  ctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }),
    Object.assign({}, prospect, { notes: 'demo_lead' }));
  ok(/already enquired/.test(ctx), "the WARM signal is read from demoLeadAlert's own DEMO_LEAD_NOTE");

  ctx = await closer.buildProspectContext(fakeSupabase({}), Object.assign({}, prospect, { demo_vendor_ref: null }));
  ok(ctx.includes(closer.PRODUCT_LINK) && !/demo studio is up/.test(ctx), 'no demo → S-6 falls back to the product link');

  ctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect, { wakeReason: 'nudge', nudgesStanding: 2 });
  ok(/last message on this conversation/.test(ctx), 'at two standing she is told this is the last one');
  ok(!/just following up|Sorry to chase/.test(ctx), 'the machinery WAKES her and words nothing — no composed line anywhere in context');

  // ═══ 9 · THE SEAM — TRANSPORT UNMOVED ════════════════════════════════════
  section('9 · The seam (05/06 boundary)');
  const sb = fakeSupabase({ prospects: [{ id: 'p9', phone: '919999000111', state: 'replied', source: 'other' }] });
  const sent = [];
  const fakeSend = async (args) => { sent.push(args); };
  const res = await prospectsMod.handleMarketingInbound({
    supabase: sb, from: '919999000111', text: 'who is this?', messageId: 'wamid.1',
    sendWa: fakeSend, sendWaDeps: {},
    closerTurn: async () => ({ text: 'Maya here. Saw your Jaipur set.', source: 'maya' }),
  });
  ok(res.action === 'in_session' && res.replySent === true, 'the turn advances and the reply goes');
  ok(sent.length === 1 && sent[0].line === 'marketing' && sent[0].windowOpen === true,
     'ZERO TRANSPORT BYTES MOVED — same line, same windowOpen:true');
  ok(sent[0].text === 'Maya here. Saw your Jaipur set.', "the wire carries the Closer's words, not a constant");
  ok(sb.db.messages.filter(x => x.direction === 'outbound').length === 1, 'the outbound is persisted through the same logMessage');
  ok(sb.db.messages.filter(x => x.direction === 'inbound').length === 1, 'the inbound was logged BEFORE the turn — she can read what she is answering');
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/prospects.js'), 'utf8');
  ok(!/anthropic|llmCreate|resolveModel/.test(src), 'FORK 4 — no model assembly in the state machine, exactly one call out');

  // ═══ 10 · THE TURN LOCK (FORK 5) ═════════════════════════════════════════
  section('10 · The turn lock — the third lane joins');
  turnLock._reset();
  const order = [];
  const sb2 = fakeSupabase({ prospects: [{ id: 'pA', phone: '919999000222', state: 'replied', source: 'other' }] });
  const slowTurn = async () => { order.push('start'); await new Promise(r => setTimeout(r, 40)); order.push('end'); return { text: 'x', source: 'maya' }; };
  const call = () => prospectsMod.handleMarketingInbound({
    supabase: sb2, from: '919999000222', text: 'hi', messageId: 'w', sendWa: fakeSend, sendWaDeps: {}, closerTurn: slowTurn,
  });
  await Promise.all([call(), call()]);
  ok(order.join(',') === 'start,end,start,end',
     'two concurrent inbounds on ONE phone SERIALIZE — F-05.41 cannot recur on this lane');
  ok(turnLock._size() === 0, 'the lock map drains — no unbounded growth on the inbound path');

  // ═══ SUMMARY ═════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`b08_p5_closer_bench: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  · ${f}`)); }
  console.log(`${'═'.repeat(60)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH CRASHED:', e); process.exit(2); });
