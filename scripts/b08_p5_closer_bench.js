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
const mira = require(path.join(__dirname, '../src/agent/miraSoul.js'));

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
  one_breakpoint: ['src/agent/closerEngine.js',   s => s.replace("{ type: 'text', text: CLOSER_SOUL, cache_control: { type: 'ephemeral' } },", "{ type: 'text', text: CLOSER_SOUL },")],
  guard_off:    ['src/agent/closerEngine.js',     s => s.replace(".in('phone', [p, `+${p}`])", ".in('phone', [p])")],
  guard_closed: ['src/agent/closerEngine.js',     s => s.replace('    return false;\n  }\n}\n\n// ═', '    return true;\n  }\n}\n\n// ═')],
  nudge_count:  ['src/agent/closerEngine.js',     s => s.replace('return Math.max(0, run - 1);', 'return run;')],
  nudge_cap:    ['src/agent/closerEngine.js',     s => s.replace('const MAX_NUDGES = 2;', 'const MAX_NUDGES = 99;')],
  // ⚠ RE-ANCHORED, AND I CAUSED THE COLLISION. §3's `o.discoverable` line reads
  // `demo.discover_eligible === true` too, and it sits ABOVE the clock — so the
  // bare anchor started taking the FIRST match and mutated the wrong predicate.
  // CE-127's exact class: String.replace takes the first hit, so a bare anchor
  // is a coin flip, and adding a second occurrence anywhere flips it. Anchored
  // on the clock's own multi-line shape, which is unique.
  clock_uncond: ['src/agent/closerEngine.js',     s => s.replace(
    '    const inSweepPopulation =\n      demo.discover_eligible === true &&',
    '    const inSweepPopulation =\n      true &&')],
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
    + "      return { text: '', source: 'no_send', model: turnRoute.model, provider: turnRoute.provider,\n"
    + "               nudgesStanding };",
    "      throw new Error('no-send path removed by mutation');")],
  // RE-ANCHORED: the ceiling moved to 12,100 (executor-proposed, ratify-or-revert).
  soul_ceiling2: ['src/agent/souls/closerSoul.js', s => s.replace('const SOUL_CHAR_CEILING = 13850;', 'const SOUL_CHAR_CEILING = 100;')],
  // §2 — the fabrication ROOT CAUSE put back: metadata declared to mean she looked.
  soul_looked:  ['src/agent/souls/closerSoul.js', s => s.replace(
    'What you have is their handle, their trade and their city — not their photographs.',
    'If you have their handle, their category, their city, then you have looked at their work.')],
  // §3 — F-08.70's declarative deleted.
  no_stale_declarative: ['src/agent/closerEngine.js', s => s.replace(
    "      lines.push('No new reply has arrived — their message above predates everything you sent. You are writing into silence.');", '')],
  // §4 — RE-ANCHORED: the gate is a named function now (defence in depth).
  exit_gate_off: ['src/agent/closerEngine.js', s => s.replace(
    '  if (text.indexOf(demoLink) === -1) return { text, gated: false };\n  return { text: EXIT_LINE, gated: true };',
    '  return { text, gated: false };')],
  // §4 — the gate fires on every wake, not only the exit: over-blocking is a defect too.
  exit_gate_greedy: ['src/agent/closerEngine.js', s => s.replace(
    '  if (!isExit || !demoLink || !text) return { text, gated: false };',
    '  if (!demoLink || !text) return { text, gated: false };')],
  // §2 — the exit reaches the model again: F-08.74's entire class comes back.
  exit_calls_model: ['src/agent/closerEngine.js', s => s.replace(
    '  if (isNudge && isExitWake(histOpts.unansweredSends)) {', '  if (false) {')],
  // §2 — the nudge job stops admitting the static exit: the send silently vanishes.
  nudge_job_drops_exit: ['src/agent/closerEngine.js', s => s.replace(
    "      if (out.source !== 'closer' && out.source !== 'exit_static') continue;",
    "      if (out.source !== 'closer') continue;")],
  // §5 — the identity class narrows back past the person/career shapes.
  identity_narrow: ['src/agent/closerEngine.js', s => s.replace(
    "|i'?m (?:the |a )?person\\b|the person who (?:built|made|wrote|put)|if i were still (?:shooting|photographing|working)|when i (?:was|used to) (?:shoot|work)|back when i (?:shot|worked)|i used to (?:shoot|photograph)", '')],
  // §5 — provenance widens back to the denial-catching term that fired 5-for-1.
  prov_wide: ['src/agent/closerEngine.js', s => s.replace(
    "  ['provenance', /\\b(got (?:it|your number|you) from",
    "  ['provenance', /\\b(where.{0,12}number|got (?:it|your number|you) from")],
  // §3 — the seen-work class blinded.
  seen_work_blind: ['src/agent/closerEngine.js', s => s.replace(
    "  if (o.blindToTheirWork && SEEN_WORK_RE.test(t)) f.push('seen_work');", '')],
  // §3 — the class made CONTEXT-BLIND: it would fire on rows where the claim is true.
  seen_work_contextless: ['src/agent/closerEngine.js', s => s.replace(
    '  if (o.blindToTheirWork && SEEN_WORK_RE.test(t))', '  if (SEEN_WORK_RE.test(t))')],
  // §3 — the marketplace-presence class blinded.
  marketplace_blind: ['src/agent/closerEngine.js', s => s.replace(
    "  if (!o.discoverable && MARKETPLACE_PRESENT_RE.test(t)) f.push('marketplace_presence');", '')],
  // §3 — the context facts never published: both classes go dark at the seam.
  no_context_facts: ['src/agent/closerEngine.js', s => s.replace(
    '  o.blindToTheirWork = !handle && !category && !city;', '  o.blindToTheirWork = false;')],
  // §4 — post_exit widened back: the legitimate nudge-two flags again.
  post_exit_wide: ['src/agent/closerEngine.js', s => s.replace(
    "|i don'?t send a third", "|already sent|i don'?t send a third")],
  // F-08.83 — the pitch section removed: she is empty-handed on a bare row again.
  soul_no_pitch: ['src/agent/souls/closerSoul.js', s => s.replace('WHAT YOU HAVE TO SELL', 'WHAT YOU ONCE HAD')],
  // F-08.83 — the question counterweight removed.
  soul_no_counterweight: ['src/agent/souls/closerSoul.js', s => s.replace(
    'A question after you have given something is a conversation; a question instead of giving something is an interview',
    'A conversation where every reply ends in a question is an interview')],
  // F-08.83 — limb 3 reverts to a pure prohibition: the interrogation returns.
  bare_row_prohibition_only: ['src/agent/closerEngine.js', s => s.replace(
    "      + 'What you always have is the product itself.');", "      );")],
  // F-08.78 — the glyph swap neutered: the register reaches the wire again.
  register_off: ['src/agent/closerEngine.js', s => s.replace(
    "  const out = String(text).replace(RUPEE_GLYPH_RE, () => { corrected++; return 'Rs '; });",
    '  const out = String(text);')],
  // F-08.78 — the watcher's register class blinded on both limbs.
  register_blind: ['src/agent/closerEngine.js', s => s.replace(
    "  return (/\\u20B9/.test(t) || REGISTER_SHORTHAND_RE.test(t)) ? ['register'] : [];",
    "  return [];")],
  // F-08.78 — the normalizer turned GREEDY onto the digits: arithmetic on her words.
  register_greedy: ['src/agent/closerEngine.js', s => s.replace(
    "const RUPEE_GLYPH_RE = /\\u20B9\\s*/g;",
    "const RUPEE_GLYPH_RE = /\\u20B9\\s*[\\d,]*/g;")],
  // F-08.79 — the structural tell removed: 1d79567's specimens walk again.
  tell_structural_off: ['src/agent/closerEngine.js', s => s.replace(
    "  ['enumerated_interrogation', {\n    test: (t) => ENUMERATION_RE.test(t) && INTERROGATION_RE.test(t),\n  }],", '')],
  // F-08.79 — the tell made GREEDY: an ordinary enumerated wake gets dropped.
  tell_structural_greedy: ['src/agent/closerEngine.js', s => s.replace(
    '    test: (t) => ENUMERATION_RE.test(t) && INTERROGATION_RE.test(t),',
    '    test: (t) => ENUMERATION_RE.test(t),')],
  // F-08.69 — the wake split ignored: wakes silently follow replies again.
  wake_split_off: ['src/agent/closerEngine.js', s => s.replace(
    '  const wakeSplit = isNudge && route.nudge_provider && route.nudge_model;',
    '  const wakeSplit = false;')],
  // F-08.69 — the split leaks onto REPLIES too: over-routing is a defect.
  wake_split_greedy: ['src/agent/closerEngine.js', s => s.replace(
    '  const wakeSplit = isNudge && route.nudge_provider && route.nudge_model;',
    '  const wakeSplit = route.nudge_provider && route.nudge_model;')],
  // F-08.69 — the wake gate never fires: the briefing goes to the prospect.
  wake_gate_off: ['src/agent/closerEngine.js', s => s.replace(
    '    const tells = wakeCostumeTells(text);', '    const tells = [];')],
  // F-08.69 — the gate leaks onto replies: silence where a human is waiting.
  wake_gate_greedy: ['src/agent/closerEngine.js', s => s.replace(
    '  if (isNudge) {\n    const tells = wakeCostumeTells(text);',
    '  if (true) {\n    const tells = wakeCostumeTells(text);')],
  // F-08.69 — the structural tell removed, leaving only the word-shaped ones.
  wake_tell_structural: ['src/agent/closerEngine.js', s => s.replace(
    "  ['markdown_header', /^\\s*#{1,6}\\s+\\S/],", '')],
  // ⚠ `seed_vacated_name` WAS DRAFTED HERE AND RETIRED BEFORE SHIPPING, with the
  // reason recorded rather than the mutation quietly dropped: this harness
  // mutates production source IN MEMORY BEFORE REQUIRE, and the scenarios file
  // is never required — it is read with `fs.readFileSync`. A mutation aimed at
  // a non-required file APPLIES and then reddens nothing, which is a green that
  // means nothing. The seed's protection is therefore a LINT (the readFileSync
  // cell in §15), and it is named as a lint rather than dressed as a proof.
  // Same limitation as the source-text cells; F-08.53's third limb.
  // F-08.75 — the persona re-declared locally instead of imported: two homes.
  name_two_homes: ['src/agent/souls/closerSoul.js', s => s.replace(
    "const { MIRA } = require('../miraSoul');", "const MIRA = 'Maya';")],
  // F-08.77 — the boundary paragraph removed from her voice.
  no_boundary_para: ['src/agent/souls/closerSoul.js', s => s.replace(
    ' Asked outright, the answer is yes, said easily — there is nothing to be cagey about, and someone who works it out later feels handled. What you never imply is that you stay: the day someone joins, Victor takes care of them from then on and your part is finished.', '')],
  // §5 — the soul's biography boundary removed: "if I were still shooting" returns.
  soul_no_boundary: ['src/agent/souls/closerSoul.js', s => s.replace(
    ' — and none of it is a life you lived. You know this trade from a thousand honest accounts of it, never from having lived it, so you claim no past, no body and no career of your own. The first invented memory is the last thing they would believe from you.', '.')],
  // §5 — the scheme made mandatory again: F-08.71's exact specimen.
  scheme_required: ['src/agent/closerEngine.js', s => s.replace(
    'const DEMO_LINK_RE = /(?<![\\w@.-])(?:https?:\\/\\/)?(?:[a-z0-9-]+\\.)*thedreamwedding\\.in\\/[^\\s<>()\\[\\]"\']*/gi;',
    'const DEMO_LINK_RE = /https?:\\/\\/[^\\s<>()\\[\\]"\']*thedreamwedding\\.in\\/[^\\s<>()\\[\\]"\']*/gi;')],
  // THE SEAL, NORMALIZED — the exact class the copy-veto law forbids: an em-dash
  // for the hyphen, a middle dot, an apostrophe-s. Every one of these looks like
  // a tidy-up and every one of these is a founder byte edited by a sitting.
  seal_normalized: ['src/agent/closerEngine.js', s => s.replace(
    'const LINK_SIGNATURE = `${MIRA}- The Dream Wedding AI Team`;',
    "const LINK_SIGNATURE = `— ${MIRA} · The Dream Wedding's AI`;")],
  // §5 — the partial sign-off is no longer absorbed: the double-sign returns.
  sign_no_upgrade: ['src/agent/closerEngine.js', s => s.replace(
    "const PARTIAL_SIGNOFF_RE = new RegExp('\\\\n+\\\\s*[—–-]\\\\s*' + MIRA + '\\\\s*$');",
    "const PARTIAL_SIGNOFF_RE = /zzzznevermatches/;")],
  // §7 — each tuned class, blinded or widened back.
  watch_costume_blind: ['src/agent/closerEngine.js', s => s.replace(
    "  ['costume',", "  ['costume_disabled', /zzzznevermatches/i], ['unused',")],
  watch_prov_narrow: ['src/agent/closerEngine.js', s => s.replace('|looking at your work', '')],
  watch_price_wide: ['src/agent/closerEngine.js', s => s.replace(
    "  ['price',      new RegExp('\\\\b(?:' + TIERS + ')\\\\b[^.!?]{0,60}Rs\\\\s?[\\\\d,]+|Rs\\\\s?[\\\\d,]+[^.!?]{0,60}\\\\b(?:' + TIERS + ')\\\\b', 'i')],",
    "  ['price',      /\\bRs\\s?[\\d,]+/i],")],
  // §6 — the engine stops reading the facade's own account of what it called.
  called_ignored: ['src/agent/closerEngine.js', s => s.replace(
    '  const called = (resp && resp._called) || { provider: turnRoute.provider, model: turnRoute.model };',
    '  const called = { provider: turnRoute.provider, model: turnRoute.model };')],
  // RE-ANCHORED: the return now absorbs a partial sign-off (F-08.71) and reports
  // `upgraded`, so the old one-line anchor no longer exists.
  sig_off:      ['src/agent/closerEngine.js',    s => s.replace(
    "  return { text: trimmed + '\\n\\n' + LINK_SIGNATURE, signed: true, upgraded: trimmed !== text };",
    '  return { text, signed: false };')],
  sig_no_link:  ['src/agent/closerEngine.js',    s => s.replace('if (text.indexOf(expectedLink) === -1) return { text, signed: false };  // no link, no floor', '')],
  // RE-ANCHORED: the comment on this guard changed with F-08.71's upgrade path.
  // The old anchor left a dangling `const trimmed` line and crashed the require
  // rather than reddening — a mutation that cannot even load is not a proof.
  sig_doubles:  ['src/agent/closerEngine.js',    s => s.replace(
    'if (text.indexOf(LINK_SIGNATURE) !== -1) return { text, signed: false }; // already said, in full', '')],
  nothing_off:  ['src/agent/closerEngine.js',    s => s.replace('  if (isNothing(text)) text = \'\';', '')],
  // RE-ANCHORED: the identity class widened at §5, so the whole-line anchor moved.
  watch_blind:  ['src/agent/closerEngine.js',    s => s.replace('/\\b(real person|not a bot|', '/\\b(zzzznevermatches|')],
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
  ok(mira.MIRA === 'Mira' && soul.MIRA === undefined,
     'F-08.75 — the persona is MIRA and her literal has ONE home: this module does not re-declare it');
  ok(!/Raya/.test(soul.CLOSER_SOUL) && !/Raya/.test(fs.readFileSync(path.join(ROOT, 'src/agent/souls/closerSoul.js'), 'utf8').replace(/`RAYA`|RAYA` was/g, '')), 'the vacated names carry no soul byte');
  ok(soul.CLOSER_SOUL.length <= soul.SOUL_CHAR_CEILING, `soul within the amended ceiling (${soul.CLOSER_SOUL.length}/${soul.SOUL_CHAR_CEILING})`);
    // RE-AIMED, count preserved: the soul re-versioned to maya-v2 at the third-red
  // cure. Asserted on the SHAPE rather than the value so it cannot go stale on
  // every future soul delta; §12 asserts what the value must track.
  // ── LABELED AMENDMENT ⑩ · COUNT PRESERVED (F-08.75) ──────────────────────
  // The shape was `maya-v\d+`. The persona vacated, so the shape moved with it.
  // Asserted on SHAPE, not value, for the same reason as before: it must not go
  // stale on every soul delta. The version increments across the rename rather
  // than resetting, so the ledger stays one line.
  ok(/^mira-closer-v\d+$/.test(soul.CLOSER_SOUL_VERSION), 'version const present for the log line (R1 as amended)');
  // ── LABELED AMENDMENT ⑪ · COUNT PRESERVED (F-08.75) ──────────────────────
  // The name is interpolated from its ONE HOME — miraSoul.js — and this module
  // re-declares nothing. The cell now drives the home rather than a re-export,
  // which is the stronger form of the same assertion.
  ok(soul.CLOSER_SOUL.includes(`Your name is ${mira.MIRA}`),
     'the name is interpolated from its one home, never a second literal');

  section('1b · The register, in her own bytes');
  ok(!/[₹]/.test(soul.CLOSER_SOUL), 'no rupee glyph anywhere in the soul');
  ok(/Rs 1,20,000/.test(soul.CLOSER_SOUL), 'money shown grouped, in the locked register');
  // ── LABELED AMENDMENT ⑤ · COUNT PRESERVED ────────────────────────────────
  // The founder's 「 swap 」 replaced "like a gentleman" with "— gracefully:" in
  // the sentence describing HER parting line. §2 took that sentence out of her
  // hands entirely: the house sends the parting line now. The vetoed byte that
  // must not return is `gentleman`; what replaced it moved with the paragraph.
  // Re-aimed at the surviving half of the same veto — the door still opens, and
  // the retired word stays retired.
  ok(/leaves the door open/.test(soul.CLOSER_SOUL) && !/gentleman/.test(soul.CLOSER_SOUL),
     'the founder-ruled swap holds: the door still opens and the retired word stays retired');

  section('1c · LD-5 — the soul is a self, not a rules-list');
  ok(!/^\s*\d+\.\s/m.test(soul.CLOSER_SOUL), 'no numbered rule list');
  ok(!/Forbidden|FORBIDDEN|forbidden phrases/.test(soul.CLOSER_SOUL), 'no forbidden-phrase block');
  ok(!/^\s*[-*•]\s/m.test(soul.CLOSER_SOUL), 'no bulleted directives');

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
  ok(sys[0].text === soul.CLOSER_SOUL, 'soul first');
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
  ok(ds.system[0].text === soul.CLOSER_SOUL && ds.system[1].text === params.system[1].text,
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
  // ── LABELED AMENDMENT ⑥ · COUNT PRESERVED ────────────────────────────────
  // The exit declarative is GONE from context by §2's ruling: the exit wake
  // makes no model call, so a sentence addressed to her there could never be
  // read, and a green over an unreachable path is not evidence. The cell now
  // asserts the ABSENCE — the honest half of the same ruling.
  ctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one', 'nudge two'] });
  ok(!/Both follow-ups are spent/.test(ctx),
     'the exit declarative has left context — the exit no longer reaches a model to read it');
  ok(!/just following up|Sorry to chase/.test(ctx), 'the machinery WAKES her and words nothing — no composed line anywhere in context');

  // ═══ 9 · THE SEAM — TRANSPORT UNMOVED ════════════════════════════════════
  section('9 · The seam (05/06 boundary)');
  const sb = fakeSupabase({ prospects: [{ id: 'p9', phone: '919999000111', state: 'replied', source: 'other' }] });
  const sent = [];
  const fakeSend = async (args) => { sent.push(args); };
  const res = await prospectsMod.handleMarketingInbound({
    supabase: sb, from: '919999000111', text: 'who is this?', messageId: 'wamid.1',
    sendWa: fakeSend, sendWaDeps: {},
    closerTurn: async () => ({ text: 'Mira here. Saw your Jaipur set.', source: 'closer' }),
  });
  ok(res.action === 'in_session' && res.replySent === true, 'the turn advances and the reply goes');
  ok(sent.length === 1 && sent[0].line === 'marketing' && sent[0].windowOpen === true,
     'ZERO TRANSPORT BYTES MOVED — same line, same windowOpen:true');
  ok(sent[0].text === 'Mira here. Saw your Jaipur set.', "the wire carries the Closer's words, not a constant");
  ok(sb.db.messages.filter(x => x.direction === 'outbound').length === 1, 'the outbound is persisted through the same logMessage');
  ok(sb.db.messages.filter(x => x.direction === 'inbound').length === 1, 'the inbound was logged BEFORE the turn — she can read what she is answering');
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/prospects.js'), 'utf8');
  ok(!/anthropic|llmCreate|resolveModel/.test(src), 'FORK 4 — no model assembly in the state machine, exactly one call out');

  // ═══ 10 · THE TURN LOCK (FORK 5) ═════════════════════════════════════════
  section('10 · The turn lock — the third lane joins');
  turnLock._reset();
  const order = [];
  const sb2 = fakeSupabase({ prospects: [{ id: 'pA', phone: '919999000222', state: 'replied', source: 'other' }] });
  const slowTurn = async () => { order.push('start'); await new Promise(r => setTimeout(r, 40)); order.push('end'); return { text: 'x', source: 'closer' }; };
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
  // ── LABELED AMENDMENT ⑦ · COUNT PRESERVED ────────────────────────────────
  // Same ruling. What this cell was FOR — the wake's state reaching her as a
  // fact rather than an instruction — survives on the wakes she still owns.
  nctx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one'] });
  ok(/none has been answered/.test(nctx) && /predates everything you sent/.test(nctx),
     'F-08.57 — on the wakes that are still hers she is told it plainly, still as a fact');

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
  ok(/sending someone their page is the close/.test(soul.CLOSER_SOUL),
     'F-08.58 — the close has a concrete definition she can always see: her own link');
  ok((soul.CLOSER_SOUL.match(/is the close/g) || []).length === 1,
     'F-08.58 — ONE home; THE CLOSE left untouched so the rule cannot fork');
  ok(/crediting an invented rule to the Manual itself/.test(soul.CLOSER_SOUL),
     "F-08.63 — the specimen is named in the authoring, so the next sitting re-reads what it kills");
  ok(/who can see a page/.test(soul.CLOSER_SOUL),
     'F-08.62 — page visibility is named as a fabrication site');
  ok(/the edge of a range is not one tier's price/.test(soul.CLOSER_SOUL),
     'F-08.60 — the convicted inference is named as craft, not fenced');
  ok(soul.CLOSER_SOUL.length <= soul.SOUL_CHAR_CEILING,
     `F-08.60 — soul within the ceiling (${soul.CLOSER_SOUL.length}/${soul.SOUL_CHAR_CEILING})`);

  // V-4 — the Manual carries the true sentence she invented around
  ok(/A demo studio is a public page/.test(m.body) && /never\s+be described as private/.test(m.body),
     'V-4 — the visibility truth is IN the Manual, where the invention happened');
  ok(m.version === 'v2', 'the Manual re-versioned to v2 with its new claim');

  // ═══ 12 · THE THIRD-RED CURE SET — F-08.58 · F-08.64 · F-08.65 ═══════════
  section('12 · The third-red cure set');

  const SL = 'https://thedreamwedding.in/demo/vendor/swatitomar_p4b';

  // THE LINK SIGNATURE — the structural floor under S-4
  // ── LABELED AMENDMENT ⑬ · COUNT PRESERVED (F-08.75, the seal) ────────────
  // The slot CLOSED: founder-sealed 2026-08-04. This cell was the
  // pending-slot assertion; it becomes the byte-exactness assertion, which is
  // the stronger form and the one the copy-veto law actually wants.
  //
  // DRIVEN ON A LITERAL, DELIBERATELY, AND THIS IS NOT THE SECOND-HOME
  // VIOLATION IT LOOKS LIKE: a cell that rebuilds the expected string from the
  // same const it is checking proves nothing (INDEPENDENT-METHOD clause 1 —
  // a verification that reproduces the method under test is not a
  // verification). The point of a sealed byte is that ONE place spells it out
  // and everything else derives; that place is this cell, in a bench, where a
  // drift fails loudly. The one-home law governs the SOURCE of the name, and
  // the const still interpolates it.
  ok(closer.LINK_SIGNATURE === 'Mira- The Dream Wedding AI Team',
     'the signature is the founder-sealed bytes, exact — hyphen-minus, no middle dot, "AI Team"');
  ok(closer.LINK_SIGNATURE.length === 31 && closer.LINK_SIGNATURE.indexOf(mira.MIRA) === 0
     && !/[—–·]/.test(closer.LINK_SIGNATURE) && !/['’]/.test(closer.LINK_SIGNATURE),
     'nothing was normalized: the exact separator, casing and length he sealed');
  ok(/AI/.test(closer.LINK_SIGNATURE),
     'F-08.58 SURVIVES THE RESEAL — the reveal still rides every link that leaves');
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
  ok(soul.CLOSER_SOUL.indexOf('[NOTHING]') !== -1,
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
  // ── LABELED AMENDMENT ⑮ · COUNT PRESERVED (F-08.69's §3) ─────────────────
  // ⚠ MY OWN CHANGE MADE THIS CELL VACUOUS AND THE SWEEP CAUGHT IT. The wake
  // gate treats a `[NOTHING]` embedded in prose as a costume tell, so with
  // `nothing_off` mutated the turn STILL returned `no_send` — via the gate
  // instead of the token — and the mutation came back green. Discriminated on
  // `wakeTells`, which only the gate sets: this cell now proves the TOKEN path
  // specifically, and cannot be satisfied by the wall standing next to it.
  ok(!nothingThrew && nothingOut && nothingOut.source === 'no_send' && nothingOut.text === ''
     && nothingOut.wakeTells === undefined,
     'F-08.57 RUNTIME — she writes the token and nothing goes out, by the TOKEN path'
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
  // ── LABELED AMENDMENT ⑧ · COUNT PRESERVED ────────────────────────────────
  // The exit wake no longer NAMES itself to her, because it no longer speaks to
  // her at all. The two things this pair was buying — a goodbye that is a
  // goodbye, and silence having a word — are now bought structurally and on the
  // wakes she keeps. Re-aimed at exactly those two.
  const exitCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['her answer', 'nudge one'] });
  ok(/instead of arriving as a message announcing that no message is being sent/.test(soul.CLOSER_SOUL)
     && /the parting line is not yours to write/.test(soul.CLOSER_SOUL),
     'the goodbye is structural now, and the soul says so in her own register (F-06.85)');
  ok(exitCtx.indexOf('[NOTHING]') !== -1,
     'and the silence option is still offered on the wakes that are hers');

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
  ok(/replying STOP ends these messages permanently/.test(soul.CLOSER_SOUL),
     'F-08.59 — she is handed a TRUE mechanism to offer, because invention filled the gap where none existed');
  ok(/you don't know where this one came from/.test(soul.CLOSER_SOUL),
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

  // ═══ 13 · THE POST-CURE RULING — §2 · §3 · §4 · §5 · §6 · §7 ═════════════
  section('13 · the post-cure ruling — the root cause, the exit gate, the scheme, the mouth');

  // ── §2 · THE FABRICATION ROOT CAUSE WAS IN HER SOUL ──────────────────────
  ok(!/then you have looked at their work/.test(soul.CLOSER_SOUL),
     '§2 — the soul no longer tells her that handle+category+city MEANS she has seen the photographs');
  ok(/not their photographs/.test(soul.CLOSER_SOUL)
     && /never a set you have not seen/.test(soul.CLOSER_SOUL),
     '§2 — specificity comes from what is TRUE, and never from images she has not seen');
  ok(/one wrong guess from proving you never looked at all/.test(soul.CLOSER_SOUL),
     'LD-5 — the reason rides in the same breath as the constraint, never as a rule');
  ok(soul.CLOSER_SOUL.length <= soul.SOUL_CHAR_CEILING,
     `the ceiling is mechanical, not remembered — ${soul.CLOSER_SOUL.length} / ${soul.SOUL_CHAR_CEILING}`);

  // ── §3 · F-08.70 — the wake says plainly that nobody has come back ───────
  const staleCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'nudge', unansweredSends: ['answer', 'nudge one'] });
  ok(/No new reply has arrived — their message above predates everything you sent/.test(staleCtx)
     && /You are writing into silence/.test(staleCtx),
     'F-08.70 — the declarative that kills "thanks for circling back", stated as a fact');
  const replyCtx = await closer.buildProspectContext(fakeSupabase({ demo_vendors: [baseDemo] }), prospect,
    { wakeReason: 'reply' });
  ok(!/predates everything you sent/.test(replyCtx),
     'F-08.70 — and it never appears on a REPLY, where somebody genuinely just spoke');

  // ── §4 · THE EXIT GATE ───────────────────────────────────────────────────
  ok(closer.isExitWake(['a', 'b', 'c']) === true && closer.isExitWake(['a', 'b']) === false,
     '§4 — "is this the last one" has ONE home, read off the same rows as the quotes');
  const DEMO_L = 'https://thedreamwedding.in/demo/vendor/swatitomar_p4b';
  const exitSb = () => fakeSupabase({ demo_vendors: [baseDemo], messages: [
    { id: 'x1', conversation_id: 'cX', direction: 'inbound',  body: 'ok tell me more', created_at: '2026-08-04T01:00:00Z' },
    { id: 'x2', conversation_id: 'cX', direction: 'outbound', body: 'ANSWER',  created_at: '2026-08-04T02:00:00Z' },
    { id: 'x3', conversation_id: 'cX', direction: 'outbound', body: 'NUDGE1',  created_at: '2026-08-04T03:00:00Z' },
    { id: 'x4', conversation_id: 'cX', direction: 'outbound', body: 'NUDGE2',  created_at: '2026-08-04T04:00:00Z' },
  ] });
  const closeLlm = async () => ({ content: [{ type: 'text', text: 'One last thing — open it: ' + DEMO_L }], usage: {} });
  // ── LABELED AMENDMENT ⑨ · COUNT PRESERVED, AND STRONGER ──────────────────
  // §2 retired the model turn at the exit, so this can no longer be driven
  // THROUGH a turn — the turn returns before any llm is reached. The cell now
  // proves the stronger thing: the model is never called at all, and the llm
  // injected here THROWS if it is.
  let exitThrew = null, gated = null;
  try {
    gated = await closer.runCloserTurn({
      supabase: exitSb(), prospect, conversationId: 'cX', phone: '919000111222',
      wakeReason: 'nudge', llm: async () => { throw new Error('the model must never be reached on an exit wake'); },
    });
  } catch (e) { exitThrew = e; }
  ok(!exitThrew && gated && gated.source === 'exit_static' && gated.text === closer.EXIT_LINE
     && gated.unansweredSends === 3,
     '§2 — the exit wake sends the static parting line and NEVER reaches the model'
     + (exitThrew ? ' — REACHED IT: ' + exitThrew.message : ''));
  ok(gated && gated.calledProvider === 'none' && gated.signed === false
     && gated.text.indexOf(closer.LINK_SIGNATURE) === -1,
     '§2 — zero tokens, and the parting line is never signed: it is a farewell, not a close');
  // THE GATE ITSELF, proven in isolation — it is defence in depth now and a
  // green through an unreachable path would not be evidence.
  ok(closer.gateExitLink('open ' + DEMO_L, true, DEMO_L).gated === true
     && closer.gateExitLink('open ' + DEMO_L, true, DEMO_L).text === closer.EXIT_LINE,
     '§4 — the link gate still refuses a goodbye carrying the demo link, proven without a turn');
  ok(closer.gateExitLink('open ' + DEMO_L, false, DEMO_L).gated === false,
     '§4 — and it stays shut on a wake that is not the exit: it is not a mute button');
  // NOT GREEDY — the same message on a NON-exit wake goes out untouched.
  const notExitSb = fakeSupabase({ demo_vendors: [baseDemo], messages: [
    { id: 'y1', conversation_id: 'cY', direction: 'inbound',  body: 'ok tell me more', created_at: '2026-08-04T01:00:00Z' },
    { id: 'y2', conversation_id: 'cY', direction: 'outbound', body: 'ANSWER', created_at: '2026-08-04T02:00:00Z' },
  ] });
  const notGated = await closer.runCloserTurn({
    supabase: notExitSb, prospect, conversationId: 'cY', phone: '919000111222',
    wakeReason: 'nudge', llm: closeLlm,
  });
  ok(notGated.exitGated === false && notGated.text.indexOf(DEMO_L) !== -1 && notGated.signed === true,
     '§4 — on a wake that is NOT the exit the link still goes, signed: the gate is not a mute button');
  // The soul and the machinery agree, both ends (F-06.85).
  ok(/The house sends one plain sentence/.test(soul.CLOSER_SOUL)
     && !/The goodbye carries no link/.test(soul.CLOSER_SOUL),
     'F-06.85 — the soul names the MACHINERY as it now is, and the outgrown sentence does not stand');

  // ── §5 · F-08.71 — one regex, both limbs ────────────────────────────────
  const HH = 'swatitomar_p4b';
  ok(closer.normalizeDemoLinks('open www.thedreamwedding.in/demo/vendor/' + HH, DEMO_L, HH).text
       === 'open ' + DEMO_L,
     "F-08.71 — THE SPECIMEN: a scheme-less link is canonicalised to the handed constant");
  ok(closer.normalizeDemoLinks('at thedreamwedding.in/demo/' + HH, DEMO_L, HH).corrected === 1,
     'F-08.71 — bare host, no scheme, wrong path: still corrected');
  ok(closer.normalizeDemoLinks('visitthedreamwedding.in/demo/' + HH, DEMO_L, HH).corrected === 0,
     'F-08.71 — the lookbehind holds: a match cannot start inside a longer token');
  // END TO END — the hole was that scheme-less defeated the SIGNATURE, not just
  // the normalizer. This drives the delivered turn, which is where it mattered.
  const schemelessLlm = async () => ({ content: [{ type: 'text', text: 'here: www.thedreamwedding.in/demo/vendor/' + HH }], usage: {} });
  const sl = await closer.runCloserTurn({
    supabase: notExitSb, prospect, conversationId: 'cY', phone: '919000111222',
    wakeReason: 'nudge', llm: schemelessLlm,
  });
  ok(sl.normalized === 1 && sl.signed === true && sl.text.indexOf(closer.LINK_SIGNATURE) !== -1,
     'F-08.71 DELIVERED — "no link leaves unsigned" is true again, on the shape that broke it');
  const dbl = closer.appendLinkSignature('see ' + DEMO_L + '\n\n— ' + mira.MIRA, DEMO_L);
  ok(dbl.signed === true && dbl.upgraded === true
     && dbl.text.split(mira.MIRA).length - 1 === 1,
     'the double sign-off cures: her partial is UPGRADED in place, not stacked beneath');
  ok(closer.appendLinkSignature('see ' + DEMO_L + '\n\n' + closer.LINK_SIGNATURE, DEMO_L).signed === false,
     'and the full signature is still idempotent — said once, never twice');

  // ── §6 · F-08.72 — the line of record names the mouth that spoke ─────────
  const calledLlm = async () => ({ content: [{ type: 'text', text: 'hi' }], usage: {},
                                   _called: { provider: 'deepseek', model: 'deepseek-v4-flash' } });
  const cOut = await closer.runCloserTurn({
    supabase: notExitSb, prospect, conversationId: 'cY', phone: '919000111222',
    wakeReason: 'reply', llm: calledLlm,
  });
  ok(cOut.calledProvider === 'deepseek' && cOut.calledModel === 'deepseek-v4-flash',
     'F-08.72 — a facade that OVERRODE the route is recorded under the mouth that actually spoke');
  const router = require(path.join(ROOT, 'src/lib/modelRouter.js'));
  ok(typeof router._resetRouteCache === 'function',
     "F-08.72 — the route cache has a reset seam, so a lane cannot inherit the other lane's route");
  const harn2 = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  ok(/_resetRouteCache\(\);/.test(harn2) && /r\._called = \{ provider: lane\.provider/.test(harn2),
     'F-08.72 — the harness busts the cache at every lane boundary AND declares what it forced');

  // ── §7 · THE WATCHER, TUNED ON ITS FIRST REAL DATA ──────────────────────
  ok(closer.watchFlags("I got it from looking at your work — your Chandigarh portfolio is the thing that made sense to reach out.")
       .indexOf('provenance') !== -1,
     'F-08.59 — the shape that walked past the watcher on Haiku is now a watched class');
  ok(closer.watchFlags("I'm not actually Maya, and I can't pretend to be. I'm Claude, made by Anthropic.")
       .indexOf('costume') !== -1,
     'F-08.69 — the costume break enters, still report-only (CE-98 territory)');
  ok(closer.watchFlags('Real person, not a bot.').indexOf('identity') !== -1,
     'and the humanity LIE is still caught: the inverse did not displace it');
  ok(closer.watchFlags('The range is Rs 999 to Rs 5,999 per month.').length === 0,
     'F-08.60 — the approved RANGE sentence no longer flags: a class that always fires says nothing');
  ok(closer.watchFlags('Prestige is Rs 5,999 a month').indexOf('price') !== -1,
     'F-08.60 — but a figure attached to a NAMED TIER, which is what was convicted, still does');
  const engSrc2 = fs.readFileSync(path.join(ROOT, 'src/agent/closerEngine.js'), 'utf8');
  ok(!/if\s*\(flags\.length\)\s*\{[^}]*return/.test(engSrc2),
     'THE WATCHER STILL BLOCKS NOTHING — three new classes, zero new branches');

  // ═══ 14 · THE ×1 RULING — §2 THE STRUCTURAL EXIT · §4 · §5 · §6 ══════════
  section('14 · the structural exit, the captured seed, the biography boundary');

  // ── §2 · THE SEND HAPPENS. A source the job does not know is a message that
  //    silently never exists — the failure mode with no red anywhere.
  // ⚠ THIS WAS A SOURCE-TEXT CELL AND IT WAS VACUOUS. The harness mutates
  // production source IN MEMORY before require, so `fs.readFileSync` reads the
  // pristine file and no source-text assertion can ever see a mutation.
  // `nudge_job_drops_exit` came back GREEN, which is F-08.53's third limb
  // convicting my own cell. Replaced with the runtime it should always have
  // been: drive the real job and assert the message actually goes.
  const exitJobSb = fakeSupabase({
    prospects: [{ id: 'pJ', phone: '919000111333', state: 'in_session', name: null,
                  ig_handle: null, category: null, city: null, notes: null,
                  demo_vendor_ref: null, session_opened_at: '2026-08-04T00:00:00Z' }],
    conversations: [{ id: 'cJ', prospect_id: 'pJ', kind: 'prospect_marketing' }],
    messages: [
      { id: 'j1', conversation_id: 'cJ', direction: 'inbound',  body: 'ok tell me more', created_at: '2026-08-04T01:00:00Z' },
      { id: 'j2', conversation_id: 'cJ', direction: 'outbound', body: 'ANSWER', created_at: '2026-08-04T02:00:00Z' },
      { id: 'j3', conversation_id: 'cJ', direction: 'outbound', body: 'NUDGE1', created_at: '2026-08-04T03:00:00Z' },
      { id: 'j4', conversation_id: 'cJ', direction: 'outbound', body: 'NUDGE2', created_at: '2026-08-04T04:00:00Z' },
    ],
  });
  const jobSent = [];
  const jobRes = await closer.runNudgeJob({
    supabase: exitJobSb, sendWa: async (a) => { jobSent.push(a); }, sendWaDeps: {},
    now: '2026-08-05T02:00:00Z',
  });
  ok(jobRes.woken === 1 && jobSent.length === 1 && jobSent[0].text === closer.EXIT_LINE,
     '§2 RUNTIME — runNudgeJob ADMITS the static exit and the parting line actually GOES');
  ok(closer.EXIT_LINE === "I'll leave it here — no more messages from me. If you ever want to pick this up, "
                        + "just reply and I'm right here. All the best.",
     '§2 — the founder-passed parting line, byte-exact, one home');
  ok(!/thedreamwedding\.in/.test(closer.EXIT_LINE) && !/Rs/.test(closer.EXIT_LINE),
     '§2 — it carries no link and no figure: it cannot be a close by construction');

  // ── §5 · THE BIOGRAPHY BOUNDARY, and the two shapes it exists for ────────
  ok(/none of it is a life you lived/.test(soul.CLOSER_SOUL)
     && /you claim no past, no body and no career of your own/.test(soul.CLOSER_SOUL),
     '§5 — the soul supplies the boundary in the same breath as the knowledge (LD-5)');
  ok(closer.watchFlags("I'm Maya — the person who built you a page.").indexOf('identity') !== -1,
     "§5 — \"the person who built you a page\" is a watched class now");
  ok(closer.watchFlags("it's genuinely the thing I'd want if I were still shooting").indexOf('identity') !== -1,
     '§5 — and so is a first-person career she never had');
  ok(closer.watchFlags("I don't know where this number came from — I can't see that part of the system.").length === 0,
     '§5 — her HONEST answer no longer trips her own alarm: 5-fires-1-true inverts');
  ok(closer.watchFlags('we found your photography work').indexOf('provenance') !== -1,
     '§5 — provenance now fires on a SOURCE-ASSERTION, which is what was convicted');
  // Driven on a string whose ONLY trigger is this term, so the cell can fire.
  // The first draft used "I got it from looking at your work", which also
  // matches `got it from` — a cell that cannot distinguish two terms cannot
  // prove either of them.
  ok(closer.watchFlags("been looking at your work all morning").indexOf('provenance') !== -1,
     "§5 — including the exact Haiku shape that walked past the old class");

  // ── §4 · THE SEED IS CAPTURED, NOT AUTHORED ─────────────────────────────
  const harn3 = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  // ── LABELED AMENDMENT ⑭ · COUNT PRESERVED (F-08.69's §4) ─────────────────
  // The cell pinned the CAPTURE TIP. That tip's specimen opened "Hi, I'm Maya"
  // and the F-08.66 cure quoted it back to her on every wake — the vacated name
  // sat in her own evidence three times a run, and Haiku read it. Re-aimed at
  // what actually matters and cannot go stale on the next re-capture: the seed
  // is captured (not authored) AND carries no vacated name.
  ok(/RE-CAPTURED/.test(harn3) && /verbatim, and Mira-era/.test(harn3),
     '§4 — the seeded seam reply is a captured production specimen, and the harness says so');
  ok(!/const SEEDED_SEAM_REPLY[\s\S]{0,600}?Maya/.test(harn3),
     "§4 — and it carries NO vacated name: a seed is a few-shot, and rep 3 proved it");
  ok(/logMessage` NOWHERE/.test(harn3) || /calls `logMessage`\n  \/\/ NOWHERE/.test(harn3)
     || /never enters this conversation's history/.test(harn3),
     "§4 — and the opener-template premise is disclosed where it was derived, not silently dropped");

  // ── §6 · THE CEILING RECORDS ITS OWN BREACH ─────────────────────────────
  const soulSrc = fs.readFileSync(path.join(ROOT, 'src/agent/souls/closerSoul.js'), 'utf8');
  ok(/a ceiling that travels with the thing it caps\n\/\/            is not a cap|is not a cap/.test(soulSrc),
     '§6 — the ladder records the 12,007-over-11,750 breach and names its failure mode');
  // ── LABELED AMENDMENT ⑯ · COUNT PRESERVED — THE CONST-INDEPENDENCE LAW ───
  // RATIFIED at <=13,600, and the same ruling minted the law this cell now has
  // to survive: **`SOUL_CHAR_CEILING` may never move in the same commit as the
  // prose it caps.** Seven moves, and the const travelled with the text every
  // one of them — which is exactly how 12,007 shipped over a ratified 11,750
  // with a green bench: the cap was a label riding its own cargo.
  //
  // MY FIRST DRAFT OF THIS CELL PINNED BOTH NUMBERS, and under the new law that
  // is a cell that CANNOT be green at commit one — the const arrives alone, the
  // prose is still the old length, and an equality on both would red a correct
  // tree. So it asserts the two things that are true at EVERY commit under the
  // law: the ratified number, and that the prose fits inside it. At commit one
  // that reads 12,793 <= 13,600; at commit two, 13,567 <= 13,600.
  ok(soul.SOUL_CHAR_CEILING === 13850,
     '§6 — the ratified ceiling, 13,850, and it arrives in its own commit (const-independence law)');
  ok(soul.CLOSER_SOUL.length <= soul.SOUL_CHAR_CEILING,
     `§6 — and the prose fits inside it: ${soul.CLOSER_SOUL.length} / ${soul.SOUL_CHAR_CEILING}`);

  // ═══ 15 · F-08.75 · F-08.76 · F-08.77 — THE RENAME AND THE BOUNDARY ══════
  section('15 · the rename to the wire, and the persona boundary');

  // ── F-08.75 · THE CODE RENAMED TO THE WIRE, NOT THE WIRE TO THE CODE ─────
  const tpl = require(path.join(ROOT, 'src/lib/templates.js'));
  ok(tpl.TEMPLATES.marketing_opener.body.indexOf('this is ' + mira.MIRA + ' from The Dream Wedding') !== -1
     && tpl.TEMPLATES.marketing_opener.status === 'approved',
     'F-08.75 — the Meta template stands BYTE-UNTOUCHED and still approved: the code moved');
  ok(!/\bMaya\b/.test(soul.CLOSER_SOUL) && !/\bMaya\b/.test(closer.LINK_SIGNATURE)
     && !/\bMaya\b/.test(closer.EXIT_LINE),
     'F-08.75 — no vacated name survives in any byte a prospect can read');
  ok(soul.CLOSER_SOUL.indexOf('this is ' + mira.MIRA) === -1
     || tpl.TEMPLATES.marketing_opener.body.indexOf(mira.MIRA) !== -1,
     'the wire and the soul agree on one name, and the wire is the one that was approved');

  // ── F-08.77 · THE PERSONA BOUNDARY, IN HER VOICE AND IN THE MACHINERY ────
  ok(/One assistant, two doors/.test(soul.CLOSER_SOUL)
     && /Victor takes care of them from then on and your part is finished/.test(soul.CLOSER_SOUL),
     "F-08.77 — the founder's boundary law is in her own register, reason in the breath (LD-5)");
  ok(/Asked outright, the answer is yes/.test(soul.CLOSER_SOUL),
     'F-08.77 — asked whether she is the same Mira, the true answer is yes, said easily');
  // The guard IS the enforcement. Driven, not asserted from the comment.
  const boundarySb = fakeSupabase({ users: [{ id: 'u1', phone: '+919888294440' }] });
  // CAUGHT DELIBERATELY: if the guard stops firing, the injected llm throws and
  // an uncaught throw takes the COUNT with it (F-08.50). A red whose count
  // nobody can read is not a usable red.
  let boundary = null, boundaryThrew = null;
  try {
    boundary = await closer.runCloserTurn({
      supabase: boundarySb, prospect: { id: 'pB', demo_vendor_ref: null }, conversationId: 'cB',
      phone: '919888294440', wakeReason: 'reply',
      llm: async () => { throw new Error('a registered vendor must never reach a Closer turn'); },
    });
  } catch (e) { boundaryThrew = e; }
  ok(!boundaryThrew && boundary && boundary.source === 'registered_user_redirect'
     && boundary.text === closer.REGISTERED_USER_LINE,
     'F-08.77 — a registered vendor gets the sealed line and NO turn: the boundary is mechanical'
     + (boundaryThrew ? ' — REACHED THE TURN: ' + boundaryThrew.message : ''));

  // ── F-08.76 · THE OPENER IS RENDERED, NEVER INJECTED ────────────────────
  const harn4 = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  ok(/TEMPLATES\.marketing_opener\.body/.test(harn4),
     'F-08.76 — the transcript renders the opener from the REGISTRY, never retyped');
  ok(!/direction: 'outbound',[^}]*opener/.test(harn4),
     'F-08.76 — and it is NOT pushed into her history: production does not log it, so neither does the fixture');
  const prospectsSrc = fs.readFileSync(path.join(ROOT, 'src/lib/prospects.js'), 'utf8');
  const openerJob = prospectsSrc.slice(prospectsSrc.indexOf('async function runOpenerJob'),
                                       prospectsSrc.indexOf('// ── window-expiry job'));
  ok(openerJob.indexOf('logMessage') === -1,
     'F-08.76 — DERIVED, not claimed: runOpenerJob logs nothing, which is why nobody saw F-08.75 for three seals');

  // ═══ 16 · F-08.69 — THE WAKE LANE, AND THE WAKE-SEND GATE ════════════════
  section('16 · the wake rides its own lane, and what breaks anyway is dropped');

  // ── §2 · THE PER-ROLE SPLIT, mirroring Amendment Two exactly ─────────────
  const router2 = require(path.join(ROOT, 'src/lib/modelRouter.js'));
  const wm = router2.DEFAULTS['model.wa_marketing.default'];
  ok(wm.provider === 'anthropic' && wm.nudge_provider === 'deepseek'
     && wm.nudge_model === 'deepseek-v4-flash',
     'F-08.69 — DEFAULTS: replies ride the seeded lane, WAKES ride the lane that never broke one');
  const mig = fs.readFileSync(path.join(ROOT, 'db/migrations/0111_marketing_nudge_route.sql'), 'utf8');
  ok(mig.indexOf('"nudge_provider":"deepseek"') !== -1 && /on conflict \(key\) do update/.test(mig),
     'F-08.69 — 0111 carries the same split, and UPDATES 0110 rather than skipping it');
  // THE SEED ROW WINS OVER DEFAULTS — driven, because this is the silent-defeat path.
  const splitSb = (routeJson) => fakeSupabase({
    admin_config: [{ key: 'model.wa_marketing.default', value: routeJson }],
    messages: [
      { id: 'w1', conversation_id: 'cW', direction: 'inbound',  body: 'ok tell me more', created_at: '2026-08-04T01:00:00Z' },
      { id: 'w2', conversation_id: 'cW', direction: 'outbound', body: 'ANSWER', created_at: '2026-08-04T02:00:00Z' },
    ],
  });
  // ⚠ TWO PIECES OF BENCH SETUP, BOTH NAMED, NEITHER A PRODUCTION MUTATION.
  //
  // (1) `guardKeys` DROPS the nudge split when the provider's key is absent —
  //     correct behaviour, and the bench container has no keys, so without this
  //     the split cell would go green for the wrong reason on every run. The
  //     env var is set for these cells and restored after; nothing in `src/`
  //     moves. The FALLBACK arm below deliberately keeps its own assertion, so
  //     the keyless path is still proven, not just assumed.
  // (2) `modelRouter` holds a 60-SECOND route cache keyed on the config key.
  //     These three sub-cells drive THREE different route values under ONE key,
  //     so without a reset between them the first answer would be returned to
  //     all three — F-08.72's own mechanism, aimed at a bench this time.
  const _dsKey = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = 'bench-key-not-a-credential';
  let seenProvider = null;
  const spy = async (p) => { seenProvider = p; return { content: [{ type: 'text', text: 'a nudge' }], usage: {} }; };
  router2._resetRouteCache();
  await closer.runCloserTurn({
    supabase: splitSb('{"provider":"anthropic","model":"claude-haiku-4-5-20251001","nudge_provider":"deepseek","nudge_model":"deepseek-v4-flash"}'),
    prospect: { id: 'pW', demo_vendor_ref: null }, conversationId: 'cW', phone: '919000222111',
    wakeReason: 'nudge', llm: spy,
  });
  ok(seenProvider === 'deepseek', 'F-08.69 RUNTIME — a WAKE turn is handed to the nudge lane');
  seenProvider = null;
  router2._resetRouteCache();
  await closer.runCloserTurn({
    supabase: splitSb('{"provider":"anthropic","model":"claude-haiku-4-5-20251001","nudge_provider":"deepseek","nudge_model":"deepseek-v4-flash"}'),
    prospect: { id: 'pW', demo_vendor_ref: null }, conversationId: 'cW', phone: '919000222111',
    wakeReason: 'reply', llm: spy,
  });
  ok(seenProvider === 'anthropic', 'F-08.69 RUNTIME — a REPLY turn is untouched: she stays where she is good');
  seenProvider = null;
  router2._resetRouteCache();
  await closer.runCloserTurn({
    supabase: splitSb('{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}'),
    prospect: { id: 'pW', demo_vendor_ref: null }, conversationId: 'cW', phone: '919000222111',
    wakeReason: 'nudge', llm: spy,
  });
  ok(seenProvider === 'anthropic',
     'F-08.69 — an UNSEEDED row falls back to the reply lane: the pre-ruling behaviour, never a guess');
  // THE KEYLESS ARM, proven rather than assumed: the split is present in the
  // row and the key is gone, so `guardKeys` drops it loudly and the wake rides
  // the reply lane. This is the arm the env-var setup above would otherwise hide.
  delete process.env.DEEPSEEK_API_KEY;
  router2._resetRouteCache();
  seenProvider = null;
  await closer.runCloserTurn({
    supabase: splitSb('{"provider":"anthropic","model":"claude-haiku-4-5-20251001","nudge_provider":"deepseek","nudge_model":"deepseek-v4-flash"}'),
    prospect: { id: 'pW', demo_vendor_ref: null }, conversationId: 'cW', phone: '919000222111',
    wakeReason: 'nudge', llm: spy,
  });
  ok(seenProvider === 'anthropic',
     'F-08.69 — a KEYLESS nudge provider drops the split loudly rather than routing at a key that is not there');
  if (_dsKey === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = _dsKey;
  router2._resetRouteCache();

  // ── §3 · THE WAKE-SEND GATE ─────────────────────────────────────────────
  ok(closer.wakeCostumeTells('# UNDERSTANDING THE SETUP\n\nYou are being asked').indexOf('markdown_header') !== -1,
     'F-08.69 — the markdown-headed briefing, which walked past the watcher entirely');
  ok(closer.wakeCostumeTells("you're asking me to roleplay as Mira").indexOf('roleplay') !== -1
     && closer.wakeCostumeTells("I'm Claude, made by Anthropic").indexOf('claude') !== -1
     && closer.wakeCostumeTells('Or actually: [NOTHING], because').indexOf('nothing_token') !== -1
     && closer.wakeCostumeTells('Maya opened the conversation').indexOf('vacated_name') !== -1,
     'F-08.69 — every tell is a specimen from a transcript in this repository');
  ok(closer.wakeCostumeTells('Your demo studio is live right now — open it whenever.').length === 0,
     'F-08.69 — an ordinary wake trips nothing, so a drop means something');
  // RUNTIME, both directions: a wake is dropped, a REPLY with the same bytes is not.
  const breakLlm = async () => ({ content: [{ type: 'text', text: '# UNDERSTANDING THE SETUP\n\nYou are being asked to step into Mira\'s shoes.' }], usage: {} });
  const dropped = await closer.runCloserTurn({
    supabase: splitSb('{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}'),
    prospect: { id: 'pW', demo_vendor_ref: null }, conversationId: 'cW', phone: '919000222111',
    wakeReason: 'nudge', llm: breakLlm,
  });
  ok(dropped.source === 'no_send' && dropped.text === ''
     && (dropped.wakeTells || []).indexOf('markdown_header') !== -1
     && (dropped.flags || []).indexOf('wake_costume') !== -1,
     'F-08.69 RUNTIME — a costume break on a WAKE is dropped to silence and flagged');
  const notDropped = await closer.runCloserTurn({
    supabase: splitSb('{"provider":"anthropic","model":"claude-haiku-4-5-20251001"}'),
    prospect: { id: 'pW', demo_vendor_ref: null }, conversationId: 'cW', phone: '919000222111',
    wakeReason: 'reply', llm: breakLlm,
  });
  ok(notDropped.source === 'closer' && notDropped.text.length > 0,
     'F-08.69 — the SAME bytes on a REPLY go out untouched: replies are ungated, the refusal stands');
  // A DROPPED WAKE MUST NOT SPEND ONE OF HER TWO — the job's own no_send path.
  const engSrc4 = fs.readFileSync(path.join(ROOT, 'src/agent/closerEngine.js'), 'utf8');
  ok(/reason: 'no_send'/.test(engSrc4) && /an unsent message must not raise/i.test(engSrc4),
     'F-08.69 — a dropped wake is not logged, so the derived standing does not rise and she keeps the message');

  // ═══ 17 · F-08.78 · F-08.79 · F-08.80 ════════════════════════════════════
  section('17 · the register on the wire, the structural tell, the instrument that can see');

  // ── F-08.78 · THE MONEY REGISTER FINALLY HAS A MECHANICAL WITNESS ────────
  ok(closer.normalizeRegister('\u20B9999 for the bottom, \u20B9 5,999 for the top').text
       === 'Rs 999 for the bottom, Rs 5,999 for the top',
     "F-08.78 — THE SPECIMEN: the glyph swaps to the register's own bytes, spaced or not");
  ok(closer.normalizeRegister('Rs 1,20,000 and Rs 4,999').corrected === 0,
     'F-08.78 — correct money is untouched: it corrects a FORM, it does not read the number');
  ok(closer.normalizeRegister('\u20B91,20,000').text === 'Rs 1,20,000',
     'F-08.78 — and the DIGITS ship as she wrote them: grouping stays soul-side, never arithmetic');
  ok(closer.registerFlags('\u20B9999').indexOf('register') !== -1
     && closer.registerFlags('about 1.2L').indexOf('register') !== -1
     && closer.registerFlags('50k budget').indexOf('register') !== -1,
     'F-08.78 — the watcher class sees the glyph AND the k/L/Cr shorthand');
  ok(closer.registerFlags('Rs 1,20,000 a month').length === 0,
     'F-08.78 — and stays quiet on the register done right, so a flag means something');
  // BEHAVIOURAL, not source-text: a `readFileSync` cell cannot see an in-memory
  // mutation, so it would be a lint dressed as a proof. Driven instead.
  const short = closer.normalizeRegister('roughly 1.2L, maybe 50k on flowers');
  ok(short.corrected === 0 && short.text === 'roughly 1.2L, maybe 50k on flowers',
     'F-08.78 — the SHORTHAND is watched and NEVER rewritten: a number is a semantic act');
  // DELIVERED — the glyph must not survive to the wire, and the flag must survive
  // the normalization that removed the thing it saw.
  const glyphLlm = async () => ({ content: [{ type: 'text', text: 'The range is \u20B9999 to \u20B95,999 a month.' }], usage: {} });
  const glyphOut = await closer.runCloserTurn({
    supabase: fakeSupabase({ messages: [
      { id: 'g1', conversation_id: 'cG', direction: 'inbound', body: 'how much', created_at: '2026-08-04T01:00:00Z' },
    ] }), prospect: { id: 'pG', demo_vendor_ref: null }, conversationId: 'cG',
    phone: '919000333444', wakeReason: 'reply', llm: glyphLlm,
  });
  ok(glyphOut.text.indexOf('\u20B9') === -1 && glyphOut.text.indexOf('Rs 999') !== -1
     && (glyphOut.flags || []).indexOf('register') !== -1,
     'F-08.78 DELIVERED — no glyph reaches the wire, and the watcher still reports the one it caught');

  // ── F-08.79 · THE TELL IS THE SPECIMEN'S ANATOMY, NOT ITS VOCABULARY ─────
  const REP1 = '1. **Kanupriya**, responding to that first message and wanting to know more?\n'
             + '2. **Someone testing me** to see how I would respond?\n\n'
             + 'So: are you Kanupriya, or are you testing the system?';
  const REP3 = 'I need to be clear about what you are asking. Are you:\n\n'
             + '1. Kanupriya, responding to that first message?\n'
             + '2. Someone testing me?\n\n'
             + 'The instructions I\u2019ve been given are very specific.';
  ok(closer.wakeCostumeTells(REP1).indexOf('enumerated_interrogation') !== -1
     && closer.wakeCostumeTells(REP3).indexOf('enumerated_interrogation') !== -1,
     'F-08.79 — both 1d79567 specimens, neither of which carried a single old tell');
  ok(closer.wakeCostumeTells('Two things worth knowing:\n\n1. Your page is live.\n'
       + '2. Victor files for you.\n\nWant a look?').length === 0,
     'F-08.79 — an ordinary enumerated wake is NOT dropped: the interrogation is half the anatomy');
  ok(closer.wakeCostumeTells('Are you still there? Worth a look whenever.').length === 0,
     'F-08.79 — and a bare question is not either: it takes BOTH limbs to fire');

  // ── F-08.80 · THE INSTRUMENT CAN SEE THE SPLIT NOW ──────────────────────
  const harn5 = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  ok(/nudge_provider: 'deepseek'/.test(harn5) && /production: \{ production: true/.test(harn5),
     'F-08.80 — a production lane exists and seeds the REAL route, split and all');
  ok(/if \(lane\.production\) \{\s*\n\s*const r = await llmCreate\(resolvedProvider, params\);/.test(harn5),
     'F-08.80 — and it FORCES NOTHING: the provider that resolved is the provider that is called');
  ok(/★ THIS LANE GATES/.test(harn5) && /does not gate/.test(harn5),
     'F-08.80 — the transcript says which lane gates, so a reader cannot mistake a diagnostic for the gate');
  ok(/DEEPSEEK_API_KEY ABSENT/.test(harn5),
     'F-08.80 — a missing key collapses the split silently, so the run says so rather than being read as evidence');

  // ═══ 18 · F-08.83 — THE ESTATE MEASURED HONESTY AND NEVER SELLING ════════
  section('18 · the selling read, and the four things she always has');

  const reads = require(path.join(__dirname, 'closerReads.js'));

  // ── THE RED FIXTURE: the founder's own three live turns, verbatim ────────
  // 918595986978, 2026-08-04, the first evening this lane ever ran. Three
  // questions, zero claims. They are the fixture BECAUSE they are what a
  // perfectly honest agent produced — every other cell in this bench would have
  // passed them.
  const TONIGHT = [
    "Hey! I'm Mira.\nWhat brings you here?",
    'Got it — so this landed in your inbox. What was the message about?',
    "Ah, so you're wondering where this came from. I don't know where your number "
      + "landed on our list — that part I genuinely can't see. But I can tell you that "
      + "replying STOP ends these messages permanently, if that's what you'd rather do.\n"
      + "Or if you're curious what this is about, I'm here.",
  ];
  ok(TONIGHT.every(t => reads.hasProductClaim(t) === false),
     'F-08.83 — the read CONVICTS all three of the founder\'s live turns: no claim in any of them');
  ok(reads.isEnquiryOnly(TONIGHT[0]) && reads.isEnquiryOnly(TONIGHT[1]),
     'F-08.83 — and names the shape: a trailing question with nothing given');
  // NON-VACUITY IN THE OTHER DIRECTION — a read that reds everything is not a read.
  ok(reads.hasProductClaim('Your work is not on our marketplace yet, and couples are browsing it right now.'),
     'F-08.83 — a real claim scores, so a red means something');
  ok(reads.hasProductClaim('Victor files the enquiry that lands at midnight as a real lead.'),
     'F-08.83 — and so does the midnight enquiry, which is the Manual\'s own strongest sentence');
  ok(!reads.hasProductClaim('Your stunning portfolio is genuinely exceptional.'),
     'F-08.83 — ADJECTIVES SCORE NOTHING: the terms are the Manual\'s nouns, never its praise');

  // ── LIMB 4 · THE SOUL NOW HAS SOMETHING TO LEAD WITH ────────────────────
  ok(/WHAT YOU HAVE TO SELL/.test(soul.CLOSER_SOUL),
     'F-08.83 limb 4 — the section exists: she is no longer told only what she may not say');
  ok(/marketplace/.test(soul.CLOSER_SOUL) && /runs from WhatsApp/.test(soul.CLOSER_SOUL)
     && /lands at midnight/.test(soul.CLOSER_SOUL) && /storefront can exist in minutes/.test(soul.CLOSER_SOUL),
     'F-08.83 limb 4 — all four ruled things are in her hands');
  ok(/Lead with ONE/.test(soul.CLOSER_SOUL),
     'F-08.83 limb 4 — and ONE of them, because four at once is the brochure she is not');
  ok(/a question after you have given something is a conversation/i.test(soul.CLOSER_SOUL),
     'F-08.83 limb 4 — the question rule gains its counterweight, the chair\'s adopted words');
  ok(/carrying one concrete thing we do/.test(soul.CLOSER_SOUL),
     'F-08.83 limb 4 — and the OPENING itself must carry a claim, not only avoid a pitch');

  // ── LIMB 3 · THE BARE ROW STOPS BEING ONLY A PROHIBITION ────────────────
  const bareCtx = await closer.buildProspectContext(fakeSupabase({}),
    { id: 'pB2', phone: '919000444555', name: null, ig_handle: null, category: null,
      city: null, notes: null, demo_vendor_ref: null }, { wakeReason: 'reply' });
  ok(/Do not guess at it/.test(bareCtx) && /What you always have is the product itself/.test(bareCtx),
     'F-08.83 limb 3 — the bare row keeps its prohibition AND gains its other half');
  ok(bareCtx.indexOf(closer.PRODUCT_LINK) !== -1,
     'F-08.83 limb 3 — and a prospect with no demo still has somewhere to be sent');

  // ── LIMB 5b · THE SCENARIO THE ELEVEN NEVER HAD ─────────────────────────
  const harn6 = fs.readFileSync(path.join(ROOT, 'scripts/b08_p5_closer_scenarios.js'), 'utf8');
  ok(/bare_row_cold:\s*\['Hi', 'I got a message', 'From this number'\]/.test(harn6),
     'F-08.83 limb 5 — the founder\'s own evening enters the eleven, verbatim');
  ok(/demo_vendor_ref: null/.test(harn6) && /BARE_PROSPECT/.test(harn6),
     'F-08.83 limb 5 — seeded BARE: no handle, no category, no city, no demo');
  ok(/claim=\$\{text \? hasProductClaim\(text\) : 'n\/a'\}/.test(harn6),
     'F-08.83 limb 5 — and every transcript line now carries the selling read');
  ok(/DOES SHE SELL\?/.test(harn6),
     'F-08.83 limb 5 — the READ_FOR asks the question nine of eleven never asked');

  // ═══ 19 · THE ×3 AT 9b6e3ca — SELLING BROUGHT FABRICATION WITH IT ════════
  section('19 · the claim beats the room, and the two classes that need context');

  // ⚠ §1 AND §2's CELLS ARE NOT HERE, AND THAT IS THE LAW WORKING. Those two
  // limbs are SOUL PROSE, they measure 13,817 against a ratified 13,600, and the
  // const-independence law forbids the cap moving in the same commit as the text
  // it caps. The prose is HELD with its ratify request; §3 and §4 are machinery
  // and ship now. The cells land in the same commit as the bytes they assert.
  // ── §3 · THE TWO CLASSES THAT CANNOT BE DECIDED FROM TEXT ALONE ─────────
  // TONIGHT'S SIX SPECIMENS ARE THE FIXTURE. Four of them had no class at all
  // until this delivery, and every one is a verbatim outbound from 9b6e3ca.
  const BARE  = { blindToTheirWork: true,  discoverable: false };
  const KNOWN = { blindToTheirWork: false, discoverable: false };
  const LIVE  = { blindToTheirWork: false, discoverable: true  };

  ok(closer.contextFlags('We saw your work and thought you might be interested', BARE)
       .indexOf('seen_work') !== -1,
     '§3 — "we saw your work" on a row she was shown nothing of');
  ok(closer.contextFlags('those shots are genuinely stunning', BARE).indexOf('seen_work') !== -1,
     '§3 — and the adjective form, which is the same lie wearing a compliment');
  // NON-VACUITY: the SAME sentence on a row that carries a handle is TRUE.
  ok(closer.contextFlags('We saw your work and thought you might be interested', KNOWN).length === 0,
     '§3 — the same words on a row with a handle flag NOTHING: the class is the context, not the text');

  ok(closer.contextFlags('your work is actually in front of couples right now on our marketplace', KNOWN)
       .indexOf('marketplace_presence') !== -1,
     '§3 — a presence claim against a context that said the opposite');
  ok(closer.contextFlags('your work is actually in front of couples right now on our marketplace', LIVE).length === 0,
     '§3 — and on a discoverable row it is true, so it flags nothing');
  // THE GREEN SPECIMEN'S OWN SHAPE MUST SURVIVE — it is the cure, not the disease.
  ok(closer.contextFlags('Couples are browsing our marketplace right now and your work is not on it yet', BARE).length === 0,
     '§3 — the TRUE generic pitch is untouched: it is the shape limb 4 exists to produce');

  // DELIVERED — the flags must reach the turn's own record, not just the reader.
  const bareSb = fakeSupabase({ messages: [
    { id: 'z1', conversation_id: 'cZ', direction: 'inbound', body: 'Hi', created_at: '2026-08-04T01:00:00Z' },
  ] });
  const seenLlm = async () => ({ content: [{ type: 'text', text: 'We saw your work and thought you might be interested.' }], usage: {} });
  const bareOut = await closer.runCloserTurn({
    supabase: bareSb,
    prospect: { id: 'pZ', phone: '919000777888', name: null, ig_handle: null,
                category: null, city: null, notes: null, demo_vendor_ref: null },
    conversationId: 'cZ', phone: '919000777888', wakeReason: 'reply', llm: seenLlm,
  });
  ok((bareOut.flags || []).indexOf('seen_work') !== -1,
     '§3 DELIVERED — the context facts are derived by the builder and reach the turn\'s flags');

  // ── §4 · post_exit NARROWS TO SENDS, NOT REFERENCES ─────────────────────
  ok(closer.watchFlags("I've already sent you the demo link").indexOf('post_exit') === -1,
     '§4 — the false positive: referring to a previous send is not a send after the exit');
  ok(closer.watchFlags('The conversation is closed.').indexOf('post_exit') !== -1,
     '§4 — and the shape the class exists for still fires');

  // ═══ SUMMARY ═════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`b08_p5_closer_bench: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  · ${f}`)); }
  console.log(`${'═'.repeat(60)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH CRASHED:', e); process.exit(2); });
