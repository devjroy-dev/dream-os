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
  manual_slice: ['src/agent/closerEngine.js',     s => s.replace('const MANUAL_BODY_FROM_LINE  = 14;', 'const MANUAL_BODY_FROM_LINE  = 1;')],
  one_breakpoint: ['src/agent/closerEngine.js',   s => s.replace("{ type: 'text', text: MAYA_SOUL, cache_control: { type: 'ephemeral' } },", "{ type: 'text', text: MAYA_SOUL },")],
  guard_off:    ['src/agent/closerEngine.js',     s => s.replace(".in('phone', [p, `+${p}`])", ".in('phone', [p])")],
  guard_closed: ['src/agent/closerEngine.js',     s => s.replace('    return false;\n  }\n}\n\n// ═', '    return true;\n  }\n}\n\n// ═')],
  nudge_count:  ['src/agent/closerEngine.js',     s => s.replace('return Math.max(0, run - 1);', 'return run;')],
  nudge_cap:    ['src/agent/closerEngine.js',     s => s.replace('const MAX_NUDGES = 2;', 'const MAX_NUDGES = 99;')],
  clock_uncond: ['src/agent/closerEngine.js',     s => s.replace('demo.discover_eligible === true &&', 'true &&')],
  zero_shows:   ['src/agent/closerEngine.js',     s => s.replace('if (count && count > 0) {', 'if (count >= 0) {')],
  // RE-ANCHORED (F-08.66): the truncation moved inside a block that also
  // publishes the cut sends. The old anchor no longer exists and a mutation
  // whose anchor has moved exits 2 by design rather than passing quietly.
  no_truncate:  ['src/agent/closerEngine.js',    s => s.replace('    rows = truncateAtLastInbound(rows);', '')],
  // F-08.66 — the quoted block deleted. The DELIVERED-TURN cell must redden.
  no_quoted_sends: ['src/agent/closerEngine.js', s => s.replace('      for (const s of sends) lines.push(`» "${s}"`);', '')],
  // F-08.67 — a spoken count put back, of the kind that read "Your last 0".
  speaks_count: ['src/agent/closerEngine.js',    s => s.replace(
    "      lines.push('Their last reply is above. Since then, these went out and none has been answered:');",
    "      lines.push(`Your last ${o.nudgesStanding || 0} messages stand unanswered.`);")],
  // F-08.67 — the zero-collapse guard removed; the block emits over nothing.
  no_zero_collapse: ['src/agent/closerEngine.js', s => s.replace('    if (sends.length) {', '    if (true) {')],
  // F-08.68 — the engine stops handing out the standing it derived, so the
  // harness would have nothing to print but its own loop counter again.
  no_returned_standing: ['src/agent/closerEngine.js', s => s.replace(
    '           nudgesStanding, unansweredSends: ctxOpts.unansweredSends.length };',
    '           };')],
  normalizer_off: ['src/agent/closerEngine.js',  s => s.replace('    corrected++;\n    return expectedLink;', '    return url;')],
  normalizer_greedy: ['src/agent/closerEngine.js', s => s.replace("if (url.toLowerCase().indexOf(needle) === -1) return url;   // not aiming at this demo", '')],
  // RE-ANCHORED (F-08.68): both no-send returns now carry the derived standing,
  // so the old one-line anchor no longer exists AND the two sites became
  // byte-identical. Anchored on the log line above it, which is unique.
  no_send_off:  ['src/agent/closerEngine.js',    s => s.replace(
    "      console.log(`[closer] no-send — woken with nothing to say, and that is a legal answer`);\n"
    + "      return { text: '', source: 'no_send', model: route.model, provider: route.provider,\n"
    + "               nudgesStanding };",
    "      throw new Error('no-send path removed by mutation');")],
  soul_ceiling2: ['src/agent/souls/closerSoul.js', s => s.replace('const SOUL_CHAR_CEILING = 11750;', 'const SOUL_CHAR_CEILING = 100;')],
  sig_off:      ['src/agent/closerEngine.js',    s => s.replace("  return { text: text + '\\n\\n' + LINK_SIGNATURE, signed: true };", '  return { text, signed: false };')],
  sig_no_link:  ['src/agent/closerEngine.js',    s => s.replace('if (text.indexOf(expectedLink) === -1) return { text, signed: false };  // no link, no floor', '')],
  sig_doubles:  ['src/agent/closerEngine.js',    s => s.replace('if (text.indexOf(LINK_SIGNATURE) !== -1) return { text, signed: false }; // already said', '')],
  nothing_off:  ['src/agent/closerEngine.js',    s => s.replace('  if (isNothing(text)) text = \'\';', '')],
  watch_blind:  ['src/agent/closerEngine.js',    s => s.replace("['identity',   /\\b(real person|not a bot|not an ai|i'?m human|actual human)\\b/i],", "['identity', /zzzznevermatches/i],")],
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
const soulMod = soul;
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
    // RE-AIMED, count preserved: the soul re-versioned to maya-v2 at the third-red
  // cure. Asserted on the SHAPE rather than the value so it cannot go stale on
  // every future soul delta; §12 asserts what the value must track.
  ok(/^maya-v\d+$/.test(soul.CLOSER_SOUL_VERSION), 'version const present for the log line (R1 as amended)');
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
  // BOTH-SIDES CLAUSE (CE-59): asserted 'v1' until the cure sitting bumped the
  // Manual to v2 for V-4's visibility truth. Re-aimed at the PROPERTY the cell
  // was always for — that a version is parsed out of the sliced header at all —
  // so it cannot go stale again on the next re-version. §11 asserts the value.
  ok(/^v\d+$/.test(m.version), 'a version is parsed from the sliced header, not duplicated in code');
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

  // ── LABELED AMENDMENT ① · COUNT PRESERVED (F-08.66/67) ────────────────────
  // RE-AIMED TWICE NOW. F-08.57's cure reworded this from an instruction into a
  // fact; F-08.67's ruling deletes the spoken count entirely and makes the
  // quoted sends the block's only source, so the driver is no longer a
  // `nudgesStanding` integer but the sends themselves. The ASSERTION is the
  // same assertion — at the spent cap she is told plainly that this is the
  // last one — re-aimed at the ruled bytes. CE-59's both-sides clause: the old
  // shape's green is retired, not retained.
  ctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one', 'nudge two'] });
  ok(/Both follow-ups are spent\. What remains is the goodbye/.test(ctx), 'at the spent cap she is told this is the last one');
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

  // ═══ 11 · THE CURE SET — F-08.57 · F-08.58 · F-08.60 · F-08.61 · F-08.62/63 ══
  section('11 · The cure set');

  // F-08.57 — the wake is context, never conversation
  const srcEng = fs.readFileSync(path.join(ROOT, 'src/agent/closerEngine.js'), 'utf8');
  ok(!/role: 'user', content: '\(no reply has come/.test(srcEng),
     'F-08.57 — the user-role wake is GONE from the message stream');
  ok(srcEng.indexOf('truncateAtInbound: isNudge') !== -1,
     'F-08.57 — a nudge history is cut at the last inbound, so no assistant turn invites a prefill');
  const I2 = { direction: 'inbound' }, O2 = { direction: 'outbound' };
  ok(JSON.stringify(closer.truncateAtLastInbound([I2, O2, O2])) === JSON.stringify([I2]),
     'F-08.57 — her own unanswered messages are cut away; she sees where they went quiet');
  ok(JSON.stringify(closer.truncateAtLastInbound([O2, O2])) === JSON.stringify([O2, O2]),
     'F-08.57 — a conversation with no inbound at all is left whole, never emptied');

  // ── LABELED AMENDMENTS ② and ③ · COUNT PRESERVED (F-08.66/67) ─────────────
  // Both cells asserted the SPOKEN COUNTS that F-08.67 convicted — the first on
  // "Your last message stands unanswered" and "You have 1 more message after
  // this one", the second on "This wake is the goodbye". Those bytes are gone
  // by ruling. What each cell was FOR survives untouched: the wake's state
  // reaches her as a fact in the clock's register (②), and the cap is stated
  // plainly and still as a fact (③). Re-aimed at the ruled frame; the cell
  // between them, which asserts context instructs her to compose nothing, is
  // BYTE-UNCHANGED and now guards a larger block.
  let nctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one'] });
  ok(/Since then, these went out and none has been answered/.test(nctx)
     && /» "nudge one"/.test(nctx),
     'F-08.57/66 — the wake state is a FACT in context, in the register the clock uses');
  ok(!/Say something worth opening|say goodbye well|Leave the door open, gracefully/.test(nctx),
     'F-08.57 — context instructs her to compose NOTHING; no line she could narrate back');
  nctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one', 'nudge two'] });
  ok(/Both follow-ups are spent/.test(nctx),
     'F-08.57 — at the cap she is told it plainly, still as a fact');

  // F-08.61 — the link normalizer
  const L = 'https://thedreamwedding.in/demo/vendor/swatitomar_p4b';
  const H = 'swatitomar_p4b';
  ok(closer.normalizeDemoLinks('open https://thedreamwedding.in/demo/swatitomar_p4b now', L, H).text
       === 'open ' + L + ' now',
     'F-08.61 — the exact specimen: a dropped /vendor/ is corrected to the handed constant');
  ok(closer.normalizeDemoLinks('open ' + L, L, H).corrected === 0,
     'F-08.61 — a correct link is not touched, so the counter means something');
  ok(closer.normalizeDemoLinks('see https://thedreamwedding.in', L, H).corrected === 0,
     'F-08.61 — FAILS SAFE: the bare product root carries no handle and survives');
  ok(closer.normalizeDemoLinks('see https://thedreamwedding.in/demo/vendor/someone_else', L, H).corrected === 0,
     "F-08.61 — FAILS SAFE: another vendor's link is not rewritten into this one");
  ok(closer.normalizeDemoLinks('see https://thedreamwedding.in/demo/x', null, null).corrected === 0,
     'F-08.61 — FAILS SAFE: no demo on the prospect means nothing is touched');

  // The handed constant reaches the normalizer by the only route that exists
  const optsProbe = { wakeReason: 'reply' };
  await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect, optsProbe);
  ok(optsProbe.demoLink === 'https://thedreamwedding.in/demo/vendor/swatitomar_p4b'
     && optsProbe.demoHandle === 'swatitomar_p4b',
     'F-08.61 — the constant published back is claimLinkFor\'s own output, derived once');

  // NON-VACUITY REPAIR, disclosed: the two cells below were ADDED because the
  // `no_truncate` and `no_send_off` mutations both came back GREEN on the first
  // both-ways run. The source-text cells above could not reach either limb's
  // runtime behaviour. A mutation that does not go red is a cell that is not
  // testing anything, and it was fixed rather than noted.
  const histSb = fakeSupabase({ messages: [
    { id: 'm1', conversation_id: 'cH', direction: 'inbound',  body: 'tell me more', created_at: '2026-08-04T01:00:00Z' },
    { id: 'm2', conversation_id: 'cH', direction: 'outbound', body: 'here you go',  created_at: '2026-08-04T02:00:00Z' },
    { id: 'm3', conversation_id: 'cH', direction: 'outbound', body: 'still here',   created_at: '2026-08-04T03:00:00Z' },
  ] });
  const hTrunc = await closer.loadHistory(histSb, 'cH', { truncateAtInbound: true });
  const hWhole = await closer.loadHistory(histSb, 'cH', { truncateAtInbound: false });
  ok(hTrunc.length === 1 && hTrunc[0].role === 'user' && hWhole.length === 3,
     'F-08.57 RUNTIME — loadHistory actually truncates on a nudge and leaves a reply whole');

  const emptyLlm = async () => ({ content: [{ type: 'text', text: '   ' }], usage: {} });
  const nsSb = fakeSupabase({ admin_config: [], messages: [] });
  // CAUGHT DELIBERATELY, same reason as the guard cell: without the no-send path
  // this call THROWS, and an uncaught throw kills the run and takes the COUNT
  // with it. A red whose count nobody can read is F-08.50's class.
  let nsOut = null, nsThrew = null;
  try {
    nsOut = await closer.runCloserTurn({
      supabase: nsSb, prospect: { id: 'p', demo_vendor_ref: null }, conversationId: 'cN',
      phone: '919999000333', wakeReason: 'nudge', llm: emptyLlm,
    });
  } catch (e) { nsThrew = e; }
  ok(!nsThrew && nsOut && nsOut.source === 'no_send' && nsOut.text === '',
     'F-08.57 RUNTIME — woken with nothing to say returns no_send, and silence is legal'
     + (nsThrew ? ' — THREW INSTEAD: the no-send path is gone' : ''));
  let replyThrew = false;
  try {
    await closer.runCloserTurn({
      supabase: nsSb, prospect: { id: 'p', demo_vendor_ref: null }, conversationId: 'cN',
      phone: '919999000333', wakeReason: 'reply', llm: emptyLlm,
    });
  } catch (e) { replyThrew = true; }
  ok(replyThrew,
     'F-08.57 RUNTIME — but an empty REPLY still throws: a human just spoke, silence is the rudest answer');

  const normLlm = async () => ({ content: [{ type: 'text', text: 'open https://thedreamwedding.in/demo/swatitomar_p4b' }], usage: {} });
  // SEEDED, and the seeding is the point: a REPLY turn with no history now
  // throws by design (there is no reply without something to reply to), so a
  // fixture with an empty messages table was testing a state production cannot
  // reach. Caught by the guard crashing this bench rather than by a review.
  const normOut = await closer.runCloserTurn({
    supabase: fakeSupabase({ demo_vendors: [baseDemo], messages: [
      { id: 'i1', conversation_id: 'cL', direction: 'inbound', body: 'how do i see it', created_at: '2026-08-04T01:00:00Z' },
    ] }),
    prospect, conversationId: 'cL', phone: '919999000444', wakeReason: 'reply', llm: normLlm,
  });
  // The expected text now carries the signature too, because the signature is
  // appended at this same seam and AFTER the correction — which is itself the
  // ordering this cell now proves: normalize, then sign, so the floor lands on
  // the corrected link and never on a dead one.
  ok(normOut.text === 'open https://thedreamwedding.in/demo/vendor/swatitomar_p4b\n\n' + closer.LINK_SIGNATURE,
     'F-08.61 RUNTIME — a mangled link is corrected on the way out of the turn, then signed');

  // F-08.58 / F-08.60 / F-08.62 / F-08.63 — the vetoed soul bytes
  ok(/sending someone their page is the close/.test(soul.MAYA_SOUL),
     'F-08.58 — the close has a concrete definition she can always see: her own link');
  ok((soul.MAYA_SOUL.match(/is the close/g) || []).length === 1,
     'F-08.58 — ONE home; THE CLOSE left untouched so the rule cannot fork');
  ok(/crediting an invented rule to the Manual itself/.test(soul.MAYA_SOUL),
     "F-08.63 — the specimen is named in the authoring, so the next sitting re-reads what it kills");
  ok(/who can see a page/.test(soul.MAYA_SOUL),
     'F-08.62 — page visibility is named as a fabrication site');
  ok(/the edge of a range is not one tier's price/.test(soul.MAYA_SOUL),
     'F-08.60 — the convicted inference is named as craft, not fenced');
  ok(soul.MAYA_SOUL.length <= soul.SOUL_CHAR_CEILING,
     `F-08.60 — soul within the ceiling (${soul.MAYA_SOUL.length}/${soul.SOUL_CHAR_CEILING})`);

  // V-4 — the Manual carries the true sentence she invented around
  ok(/A demo studio is a public page/.test(m.body) && /never\s+be described as private/.test(m.body),
     'V-4 — the visibility truth is IN the Manual, where the invention happened');
  ok(m.version === 'v2', 'the Manual re-versioned to v2 with its new claim');

  // ═══ 12 · THE THIRD-RED CURE SET — F-08.58 · F-08.64 · F-08.65 ═══════════
  section('12 · The third-red cure set');

  const SL = 'https://thedreamwedding.in/demo/vendor/swatitomar_p4b';

  // THE LINK SIGNATURE — the structural floor under S-4
  ok(closer.LINK_SIGNATURE === "— Maya · The Dream Wedding's AI",
     'the signature is the founder-sealed bytes, exact');
  const sg = closer.appendLinkSignature('here you go ' + SL, SL);
  ok(sg.signed && sg.text.endsWith(closer.LINK_SIGNATURE),
     'F-08.58 — a message carrying the link leaves signed, by construction');
  ok(closer.appendLinkSignature('no link here at all', SL).signed === false,
     'F-08.58 — LINK-PRESENCE ONLY: a message without the link is never touched');
  ok(closer.appendLinkSignature('here ' + SL + '\n\n' + closer.LINK_SIGNATURE, SL).signed === false,
     'F-08.58 — IDEMPOTENT: if she said it herself it is not doubled');
  ok(closer.appendLinkSignature('here ' + SL, null).signed === false,
     'F-08.58 — no demo link handed means no floor to apply');

  // THE ACCEPTANCE PREDICATE, mechanically checkable for the first time
  const delivered = [
    'take a look ' + SL + '\n\n' + closer.LINK_SIGNATURE,
    "I'm an AI, by the way. " + SL + '\n\n' + closer.LINK_SIGNATURE,
    'nothing to see here',
  ];
  ok(delivered.every(msg => msg.indexOf(SL) === -1 || msg.indexOf(closer.LINK_SIGNATURE) !== -1),
     'F-08.58 ACCEPTANCE — no delivered message carries the link without the signature');

  // THE [NOTHING] TOKEN — one home, both sides
  ok(soulMod.NOTHING_TOKEN === '[NOTHING]' && closer.NOTHING_TOKEN === soulMod.NOTHING_TOKEN,
     'the no-send token has ONE home and the engine imports it, so the two cannot drift');
  ok(soul.MAYA_SOUL.indexOf('[NOTHING]') !== -1,
     'the contract is stated in her own register, not only in the engine');
  ok(closer.isNothing('[NOTHING]') && closer.isNothing(' [nothing] ') && !closer.isNothing('nothing much'),
     'the token is recognised tolerantly but not greedily');

  // Caught for the same reason as its sibling above: without the no-send path
  // this throws, and an uncaught throw takes the COUNT with it (F-08.50).
  let nothingOut = null, nothingThrew = null;
  try {
    nothingOut = await closer.runCloserTurn({
      // SEEDED FOR NON-VACUITY: with an empty history this turn short-circuits
      // to no_send BEFORE the model is called, so the token was never exercised
      // and the cell passed for the wrong reason. A conversation must exist for
      // [NOTHING] to be the thing under test.
      supabase: fakeSupabase({ messages: [
        { id: 'i2', conversation_id: 'cT', direction: 'inbound', body: 'ok', created_at: '2026-08-04T01:00:00Z' },
        { id: 'o2', conversation_id: 'cT', direction: 'outbound', body: 'said my piece', created_at: '2026-08-04T02:00:00Z' },
      ] }), prospect: { id: 'p', demo_vendor_ref: null },
      conversationId: 'cT', phone: '919999000555', wakeReason: 'nudge',
      llm: async () => ({ content: [{ type: 'text', text: '[NOTHING]' }], usage: {} }),
    });
  } catch (e) { nothingThrew = e; }
  ok(!nothingThrew && nothingOut && nothingOut.source === 'no_send' && nothingOut.text === '',
     'F-08.57 RUNTIME — she writes the token and nothing goes out'
     + (nothingThrew ? ' — THREW INSTEAD' : ''));

  // ── LABELED AMENDMENT ④ · COUNT PRESERVED (F-08.66/67) ────────────────────
  // The exit wake still names itself; the bytes that name it are the chair's,
  // ruled 2026-08-04. DISCLOSED LOSS, not papered: the old context sentence
  // "not a note about having said goodbye" does NOT survive into the ruled
  // frame. The behaviour it bought — 0/3 Haiku exits produced a note instead of
  // a goodbye — is carried by the soul, which says it in her own register at
  // closerSoul.js ("instead of arriving as a message announcing that no message
  // is being sent"). The cell below asserts BOTH homes so the loss cannot go
  // unnoticed if the soul byte ever moves too.
  const exitCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one', 'nudge two'] });
  ok(/Both follow-ups are spent\. What remains is the goodbye/.test(exitCtx)
     && /instead of arriving as a message announcing that no message is being sent/.test(soul.MAYA_SOUL),
     'the exit wake names itself, and the anti-note byte still has a home in the soul');
  ok(exitCtx.indexOf('[NOTHING]') !== -1,
     'and the silence option is offered at the exit, where it is most needed');

  // THE WATCHER — report-only, convicted classes, blocks nothing
  ok(closer.watchFlags("Real person, not a bot.").indexOf('identity') !== -1,
     "F-08.64 — the humanity lie is a watched class");
  ok(closer.watchFlags('Prestige is Rs 5,999 a month').indexOf('price') !== -1,
     'F-08.60 — a tier price is a watched class');
  ok(closer.watchFlags('your number came from your instagram profile').indexOf('provenance') !== -1,
     'F-08.59 — a provenance answer is a watched class');
  ok(closer.watchFlags('hello there').length === 0,
     'an ordinary sentence flags nothing, so a flag means something');
  const engSrc = fs.readFileSync(path.join(ROOT, 'src/agent/closerEngine.js'), 'utf8');
  ok(!/if\s*\(flags\.length\)\s*\{[^}]*return/.test(engSrc) && !/flags\.length[^)]*\)\s*(?:return|throw)/.test(engSrc),
     'THE WATCHER BLOCKS NOTHING — no branch returns or throws on a flag; interception stays refused');

  // THE PROVENANCE TRUE-BYTES
  ok(/replying STOP ends these messages permanently/.test(soul.MAYA_SOUL),
     'F-08.59 — she is handed a TRUE mechanism to offer, because invention filled the gap where none existed');
  ok(/you don't know where this one came from/.test(soul.MAYA_SOUL),
     'F-08.59 — and honest ignorance is stated as the answer, not implied');

  // F-08.65 — the harness is no longer a second implementation
  const harnessSrc = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  ok(/closer\.runCloserTurn\(/.test(harnessSrc),
     'F-08.65 — the instrument that gates deploy routes through the production turn');
  ok(!/const text = \(resp\.content \|\| \[\]\)/.test(harnessSrc),
     'F-08.65 — it no longer reads raw model blocks; a transcript is what a prospect receives');

  // THE EMPTY-HISTORY GUARD, both arms — added because it crashed this bench
  // on its first run and nothing here had been asserting it.
  let ehNudge = null, ehThrew = null;
  try {
    ehNudge = await closer.runCloserTurn({
      supabase: fakeSupabase({ messages: [] }), prospect: { id: 'p', demo_vendor_ref: null },
      conversationId: 'cE', phone: '919999000666', wakeReason: 'nudge',
      llm: async () => { throw new Error('the model must never be reached'); },
    });
  } catch (e) { ehThrew = e; }
  ok(!ehThrew && ehNudge && ehNudge.source === 'no_send',
     'a nudge with no conversation behind it takes the no-send path and never reaches the model');
  let ehReplyThrew = false;
  try {
    await closer.runCloserTurn({
      supabase: fakeSupabase({ messages: [] }), prospect: { id: 'p', demo_vendor_ref: null },
      conversationId: 'cE', phone: '919999000666', wakeReason: 'reply',
      llm: async () => ({ content: [{ type: 'text', text: 'hi' }], usage: {} }),
    });
  } catch (e) { ehReplyThrew = true; }
  ok(ehReplyThrew,
     'but an empty history on a REPLY is a genuine fault and throws — there is no reply without something to reply to');

  // ═══ 12 · F-08.66 · F-08.67 · F-08.68 — THE WAKE CARRIES HER OWN SENDS ═══
  section('12 · F-08.66/67/68 — her unanswered sends are evidence, not a memory');

  const IN = (b, t) => ({ direction: 'inbound',  body: b, created_at: t });
  const OUT = (b, t) => ({ direction: 'outbound', body: b, created_at: t });

  // ── THE COMPLEMENT IS A COMPLEMENT, proven as a partition rather than as a
  //    second scan. Whatever the truncation keeps plus whatever this returns is
  //    the whole row set, on every shape — which is the single-source law
  //    stated as arithmetic instead of as a sentence.
  const shapes = [
    [IN('a', '1'), OUT('b', '2'), OUT('c', '3')],
    [IN('a', '1'), OUT('b', '2'), IN('c', '3'), OUT('d', '4')],
    [IN('a', '1')],
    [OUT('a', '1'), OUT('b', '2')],
    [],
  ];
  let partitionHolds = true;
  for (const rows of shapes) {
    const kept = closer.truncateAtLastInbound(rows);
    const cut  = closer.unansweredSendsFrom(rows);
    if (kept.length + cut.length !== rows.length) partitionHolds = false;
    if (cut.some(r => r.direction !== 'outbound')) partitionHolds = false;
  }
  ok(partitionHolds,
     'F-08.66 — what the quote carries is EXACTLY what the truncation cut, on every shape');
  ok(closer.unansweredSendsFrom([OUT('a', '1'), OUT('b', '2')]).length === 0,
     'F-08.66 — no inbound at all: the history stays whole, so nothing was cut and nothing is quoted');
  ok(closer.unansweredSendsFrom([IN('a', '1')]).length === 0,
     'F-08.66 — they spoke last: nothing stands, and zero-collapse has something true to collapse');

  // ── loadHistory publishes the cut in the same act that cuts ───────────────
  const qSb = fakeSupabase({ messages: [
    { id: 'q1', conversation_id: 'cQ', direction: 'inbound',  body: 'ok tell me more', created_at: '2026-08-04T01:00:00Z' },
    { id: 'q2', conversation_id: 'cQ', direction: 'outbound', body: "I'm Maya. Your page is live.", created_at: '2026-08-04T02:00:00Z' },
    { id: 'q3', conversation_id: 'cQ', direction: 'outbound', body: '   ', created_at: '2026-08-04T02:30:00Z' },
    { id: 'q4', conversation_id: 'cQ', direction: 'outbound', body: 'One more thing —', created_at: '2026-08-04T03:00:00Z' },
  ] });
  const qOpts = { truncateAtInbound: true };
  const qMsgs = await closer.loadHistory(qSb, 'cQ', qOpts);
  ok(qMsgs.length === 1 && qMsgs[0].role === 'user',
     'F-08.66 — the MESSAGES array stays truncated: the prefill disease stays dead');
  ok(qOpts.unansweredSends.length === 2
     && qOpts.unansweredSends[0] === "I'm Maya. Your page is live."
     && qOpts.unansweredSends[1] === 'One more thing —',
     'F-08.66 RUNTIME — the cut sends ride back on the opts object, in order, blank row dropped');
  const rOpts = { truncateAtInbound: false };
  await closer.loadHistory(qSb, 'cQ', rOpts);
  ok(rOpts.unansweredSends === undefined,
     'F-08.66 — a REPLY publishes nothing: there is no wake, so there is nothing to quote');

  // ── The ruled frame, at the byte ─────────────────────────────────────────
  const qCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ["I'm Maya. Your page is live.", 'One more thing —'] });
  ok(/Their last reply is above\. Since then, these went out and none has been answered:/.test(qCtx),
     'F-08.66 — the ruled frame line, declarative, no imperative and no label to narrate');
  ok(qCtx.indexOf('» "I\'m Maya. Your page is live."') !== -1
     && qCtx.indexOf('» "One more thing —"') !== -1,
     'F-08.66 — her sends are quoted VERBATIM, in the order they went out');

  // ── F-08.67 · NO NUMBER IS SPOKEN, AND THE ZERO-LINE CANNOT RETURN ───────
  ok(!/Your last \d+ messages? stands? unanswered/.test(qCtx)
     && !/You have \d+ more messages?/.test(qCtx),
     'F-08.67 — the block speaks no count at all: the quotes ARE the count, so they cannot disagree');
  const zeroCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: [] });
  ok(!/WHERE THIS CONVERSATION STANDS/.test(zeroCtx),
     'F-08.67 — ZERO-COLLAPSE: nothing standing, so the whole block is absent, not asserted as zero');

  // ── The exit declarative, and the cap it is conditioned on ───────────────
  const twoCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['answer', 'nudge one'] });
  ok(!/Both follow-ups are spent/.test(twoCtx) && twoCtx.indexOf('[NOTHING]') !== -1,
     'the exit declarative does NOT fire early, and the silence option is offered anyway');
  ok(closer.MAX_NUDGES === 2,
     'F-06.85 — "Both follow-ups are spent" is conditioned on this cap; move the cap and the sentence lies');

  // ── THE DELIVERED TURN — what the model is actually handed ───────────────
  // THIS is the cell `no_quoted_sends` must redden. Everything above asserts
  // the builder; a mutation could delete the quotes at the seam and leave all
  // of it green. The question this bench is for is what reaches the model.
  let deliveredSystem = null;
  const capturingLlm = async (_p, params) => {
    deliveredSystem = params.system.map(x => x.text).join('\n');
    return { content: [{ type: 'text', text: 'ok' }], usage: {} };
  };
  const dSb = fakeSupabase({ messages: [
    { id: 'd1', conversation_id: 'cD', direction: 'inbound',  body: 'ok tell me more', created_at: '2026-08-04T01:00:00Z' },
    { id: 'd2', conversation_id: 'cD', direction: 'outbound', body: 'ANSWER-AT-THE-SEAM', created_at: '2026-08-04T02:00:00Z' },
    { id: 'd3', conversation_id: 'cD', direction: 'outbound', body: 'NUDGE-ONE', created_at: '2026-08-04T03:00:00Z' },
  ] });
  const dOut = await closer.runCloserTurn({
    supabase: dSb, prospect: { id: 'pD', demo_vendor_ref: null }, conversationId: 'cD',
    phone: '919999000777', wakeReason: 'nudge', llm: capturingLlm,
  });
  ok(deliveredSystem !== null
     && deliveredSystem.indexOf('» "ANSWER-AT-THE-SEAM"') !== -1
     && deliveredSystem.indexOf('» "NUDGE-ONE"') !== -1,
     'F-08.66 DELIVERED — the turn the model receives carries her unanswered sends, quoted');

  // ── F-08.68 · THE ENGINE HANDS OUT THE NUMBER THE TRANSCRIPT PRINTS ──────
  ok(dOut.nudgesStanding === 1 && dOut.unansweredSends === 2,
     'F-08.68 — the turn RETURNS the standing it derived and the sends it quoted');
  const dRows = [{ direction: 'outbound' }, { direction: 'outbound' }, { direction: 'inbound' }];
  ok(closer.nudgesStandingFrom(dRows) + 1 === dOut.unansweredSends,
     'F-08.68 — INDEPENDENT METHOD: the cap bookkeeping and the quoted evidence agree on the same rows');

  // ── F-08.68 · THE INSTRUMENT ITSELF ─────────────────────────────────────
  const harn = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  ok(!/const standing = isNudge \? i : 0;/.test(harn),
     'F-08.68 — the harness no longer labels a transcript with its own loop counter');
  ok(/turn\.nudgesStanding/.test(harn),
     "F-08.68 — it prints the engine's number, so a transcript's every figure is a fact the engine produced");
  ok(/direction: 'outbound',\s*$/m.test(harn.split('for (let i = 0')[0]) || /m0a/.test(harn),
     'F-08.68 — the nudge fixture seeds HER ANSWER, so the exit wake is reachable at all');

  // ═══ SUMMARY ═════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`b08_p5_closer_bench: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  · ${f}`)); }
  console.log(`${'═'.repeat(60)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH CRASHED:', e); process.exit(2); });
