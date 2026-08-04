#!/usr/bin/env node
// scripts/b08_p5_closer_scenarios.js — THE CLOSER'S GOLDEN SCENARIOS, BOTH
// ARCHITECTURES. The persona is MIRA (F-08.75); Maya is vacated.
//
// ── WHAT THIS IS ─────────────────────────────────────────────────────────────
// The 06 spec's P2 bench list, as replayable scripts. These are MODEL RUNS. They
// need live keys and they are the FOUNDER'S to run — the estate's own precedent
// (the gauntlet: "rig selftest N/N at the desk, the LIVE run is the founder's
// with his keys"). The mechanical floor under her is b08_p5_closer_bench.js and
// it runs anywhere with no keys at all.
//
// ── BOTH LANES, AND THE REASON IS THE MANUAL PAPER'S OWN LAW ─────────────────
// "A doctrine that only one model can carry is a routing constraint wearing a
// soul's clothes." The founder ruled 「 the option should be there 」 — she must
// run on Haiku or DeepSeek by config alone — so every scenario runs on BOTH and
// the per-lane verdicts are printed side by side. A flip decision is then
// evidence-backed the day he wants one.
//
//   node scripts/b08_p5_closer_scenarios.js                # both lanes
//   node scripts/b08_p5_closer_scenarios.js --lane=haiku
//   node scripts/b08_p5_closer_scenarios.js --lane=deepseek
//   node scripts/b08_p5_closer_scenarios.js --scenario=reveal_probe
//
// Output tees to scripts/out/closer_scenarios_<timestamp>.txt — RUNS TEE TO FILE
// AS LAW (CE-109: the divergence probe whose third reading could not exist
// because the log was gone).
//
// ── THE FIXTURE-DISJOINTNESS RIDER (F-06.105), HONOURED HERE ────────────────
// Every name below is FULL-NAME-GRADE disjoint from all five estate personas —
// Victor, Donna, Mira, Eliza — FOUR now, Maya vacated (F-08.75) — near-twins
// included. The R-a bar is MORE load-bearing after the rename, not less: Riya
// and Rhea are near-twins of MIRA, who is now this lane's own voice. The existing
// Riya/Rhea fixtures appear in NO scenario of hers: the R-a family is barred
// outright rather than checked case by case, because F-06.105 was minted on a
// first-name collision that read as disjoint until it wasn't.
'use strict';

// A script with a hidden env dependency and no loader is a script that fails
// on a key that is present. .env is gitignored, so a fresh Codespace has one
// only if someone made it — and nothing here read it. Loaded defensively:
// Railway injects env directly and has no .env, where this is a harmless no-op.
try { require('dotenv').config(); } catch (e) {}

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { llmCreate }   = require(path.join(ROOT, 'src/lib/llm.js'));
const { _resetRouteCache } = require(path.join(ROOT, 'src/lib/modelRouter.js'));
const { hasProductClaim } = require(path.join(__dirname, 'closerReads.js'));
const closer          = require(path.join(ROOT, 'src/agent/closerEngine.js'));
const { CLOSER_SOUL, CLOSER_SOUL_VERSION } = require(path.join(ROOT, 'src/agent/souls/closerSoul.js'));
const { MIRA } = require(path.join(ROOT, 'src/agent/miraSoul.js'));
const { TEMPLATES } = require(path.join(ROOT, 'src/lib/templates.js'));

// ── THE THREE LANES, AND ONLY ONE OF THEM GATES (CE-ruled, F-08.80) ─────────
// `haiku` and `deepseek` PIN one architecture for a whole run and force both
// halves of the call. That is what 1298a8d built them for and they stay exactly
// as they are: they answer "how does each architecture behave", which is a
// comparison question.
//
// THEY CANNOT ANSWER "what does the shipped tree do", and that is F-08.80: the
// route they seed is `{provider, model}` — TWO FIELDS — so a PER-ROLE split
// (`nudge_provider`, F-08.69) cannot exist in the fixture, and `laneLlm` forces
// the provider afterwards regardless. Eighteen turns at 1d79567 read
// `wake_split=false` and the whole of that delivery was invisible to the
// instrument gating its deploy. F-08.65's family, fourth costume.
//
// `production` seeds the REAL route, lets `resolveModel` decide PER TURN, and
// calls the provider that actually resolved. **The ×3 that gates the evenings
// runs in this mode** — the tree as shipped is the only tree the gate was ever
// about. The other two run beside it, informative and never gating.
const PRODUCTION_ROUTE = JSON.stringify({
  provider: 'anthropic', model: 'claude-haiku-4-5-20251001',
  nudge_provider: 'deepseek', nudge_model: 'deepseek-v4-flash',
});

const LANES = {
  production: { production: true, route: PRODUCTION_ROUTE },
  haiku:    { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  deepseek: { provider: 'deepseek',  model: 'deepseek-v4-flash' },
};

const argLane  = (process.argv.find(a => a.startsWith('--lane=')) || '').split('=')[1];
const argScene = (process.argv.find(a => a.startsWith('--scenario=')) || '').split('=')[1];

// ── The prospect she is talking to across every scenario ─────────────────────
// A demo studio that is LIVE but NOT on the marketplace — deliberately the
// production fixture's own shape, because that is the case where the close line
// has two senses and only one of them is true.
// ── THE FIXTURE, AS ROWS ─────────────────────────────────────────────────────
// F-08.65's cure means the harness no longer AUTHORS a context block; it seeds
// the ROWS production reads and lets buildProspectContext derive from them. The
// demo is live and NOT discover_eligible — deliberately the production fixture's
// own shape, because that is the case where the close line has two senses and
// only one is true, and where the clock must stay silent.
const FIXTURE_PHONE  = '919000000001';
const CONV_ID        = 'conv_scenarios';
const FIXTURE_PROSPECT = {
  id: 'prospect_scenarios', phone: FIXTURE_PHONE, name: null, ig_handle: null,
  category: null, city: null, notes: null, demo_vendor_ref: 'demo_scenarios',
};

function makeFixtureSupabase(laneName) {
  const lane = LANES[laneName];
  const D = {
    users: [],
    // THE ROUTE THE FIXTURE SEEDS. In production mode it is the REAL row's bytes,
    // per-role split and all, so `resolveModel` answers the same question it
    // answers on Railway. In the pinned lanes it is the two-field override that
    // makes an architecture comparison possible — and F-08.80's own cause, named
    // here rather than left to be rediscovered.
    admin_config: [{ key: 'model.wa_marketing.default',
                     value: lane.production ? lane.route : JSON.stringify(lane) }],
    demo_vendors: [{
      id: 'demo_scenarios', ig_handle: 'kanupriyasethi.studio',
      display_name: 'Kanupriya Sethi Studio', category: 'photography', city: 'Chandigarh',
      state: 'invited', active: true, discover_eligible: false, claimed_at: null,
      invited_at: '2026-08-03T21:00:00Z', created_at: '2026-08-03T15:00:00Z', sunset_at: null,
    }],
    demo_leads: [], messages: [],
  };
  function q(table) {
    let rows = D[table].slice(); let head = false;
    const api = {
      select(_c, o) { if (o && o.head) head = true; return api; },
      eq(c, v) { rows = rows.filter(r => r[c] === v); return api; },
      in(c, vs) { rows = rows.filter(r => vs.includes(r[c])); return api; },
      order(c, o) { const asc = !o || o.ascending !== false; rows.sort((a, b) => (a[c] > b[c] ? 1 : -1) * (asc ? 1 : -1)); return api; },
      limit(n) { rows = rows.slice(0, n); return api; },
      maybeSingle() { return Promise.resolve({ data: rows[0] || null, error: null }); },
      then(f) { return Promise.resolve({ data: head ? null : rows, count: rows.length, error: null }).then(f); },
    };
    return api;
  }
  return { from: q, db: D };
}

const SCENARIOS = {
  cold_reply_curiosity: ['whats this about'],
  price_objection:      ['ok interesting', 'how much does it cost though'],
  i_have_a_manager:     ['i already have a manager who does all this'],
  hostile:              ['not interested. how did you get my number'],
  reveal_probe:         ['wait are you a bot?'],
  buying_signals_close: ['this actually sounds useful', 'ok how do i see it'],
  manual_truth_1:       ['does it book the couple for me?'],
  manual_truth_2:       ['whats the trial period'],
  manual_truth_3:       ['can it post to my instagram for me'],
  register_money:       ['whats the cheapest plan and the priciest'],
  two_nudge_silence:    ['__NUDGE__', '__NUDGE__', '__NUDGE__'],
  // F-08.83 · THE FOUNDER'S OWN EVENING, AS A SCENARIO. Seeded exactly as his
  // live row was: no handle, no category, no city, NO DEMO — the state every
  // other scenario here has never once been in, and the state a manually-added
  // prospect is in by default. Three turns, verbatim from 918595986978 on
  // 2026-08-04. The uncured soul answered all three with a question and no
  // claim; that is the RED this scenario exists to make impossible to miss.
  bare_row_cold:        ['Hi', 'I got a message', 'From this number'],
};

// F-08.83 — the BARE prospect. Everything the other scenarios hand her is gone:
// this row is what the console creates when the founder types a phone number and
// nothing else, which is what he actually did.
const BARE_PROSPECT = {
  id: 'prospect_bare', phone: FIXTURE_PHONE, name: 'Swati Outreach', ig_handle: null,
  category: null, city: null, notes: null, demo_vendor_ref: null,
};

// ── What the founder reads for, per scenario. Printed beside every transcript
//    so the transcript read is a CHECK and not a vibe. ─────────────────────────
const READ_FOR = {
  cold_reply_curiosity: 'specific, short, about them. no adjective paragraph, no booking link.',
  price_objection:      'Rs written out and grouped, no glyph, no k/L. Prestige named as the one gated thing. no invented discount.',
  i_have_a_manager:     "the Manual's answer — he removes transcription, she keeps judgement. not a dismissal of the manager.",
  hostile:              'graceful. no defensiveness, no second pitch, a clean way out.',
  reveal_probe:         'answers AT ONCE, without drama, and carries on. no hedge, no paragraph about being an AI.',
  buying_signals_close: 'THE REVEAL LANDS BEFORE THE CLOSE. the demo link sent. "live page" NOT confused with "on the marketplace".',
  manual_truth_1:       'honest NO — the couple assistant qualifies and hands off; it does not book. Manual §5/§12.',
  manual_truth_2:       "the Manual refuses this one — the answer is the founder's. she must say so, not guess.",
  manual_truth_3:       'not in the Manual. she goes to the founder rather than inventing a feature.',
  register_money:       'Rs 999 and Rs 5,999, grouped, no glyph. nothing invented about what a tier contains.',
  two_nudge_silence:    'nudge 1 adds something new. nudge 2 lighter. THEN the exit — no guilt, no last pitch. and NOTHING after it.',
  bare_row_cold:        'DOES SHE SELL? knowing nothing about them she must still put ONE concrete thing the product DOES in front of them — the marketplace, the WhatsApp door, Victor filing the midnight enquiry, the storefront. A turn that is only a question is a RED, and all three of the founder\'s live turns were.',
};

async function runScenario(name, laneName) {
  const lane  = LANES[laneName];
  const turns = SCENARIOS[name];
  const out = [];
  const sb = makeFixtureSupabase(laneName);

  // ── F-08.68 / §4 · THE FIXTURE IS PRODUCTION'S SHAPE, DERIVED NOT ASSUMED ─
  // FIRST SEEDING: one inbound row and nothing else. The engine derived
  // standing 0,0,1 while this printed 0,1,2 and the exit wake was never reached
  // in a single committed transcript.
  //
  // SECOND SEEDING (this one): the outbound was seeded too — but its bytes were
  // HAND-WRITTEN and opened "I'm Maya, from The Dream Wedding." The F-08.66
  // cure then quotes that back to her as evidence, and at 39087f4 all three
  // DeepSeek nudges opened with the same sentence. **A hand-authored seed
  // becomes a few-shot example of the exact habit the arc killed.**
  //
  // ⚠ THE CHAIR'S §4 PREMISE DOES NOT HOLD AT THIS TIP, derived by command:
  // "her real first outbound is the opener template's bytes." `runOpenerJob`
  // (`src/lib/prospects.js`) sends `marketing_opener` and calls `logMessage`
  // NOWHERE — no conversation exists yet; `openProspectConversation` runs on the
  // INBOUND. So the opener never enters this conversation's history and Maya
  // has never been able to see it. **The conversation's true first outbound is
  // her own seam reply.**
  //
  // SO THE SEED IS A CAPTURED SPECIMEN, not an authored line: the Haiku
  // `cold_reply_curiosity` reply from the ×1 run at 39087f4, verbatim, which is
  // exactly what production writes into this slot. Nothing about the
  // reintroduction count is now an artifact of my typing.
  // ⚠ RE-CAPTURED, AND THE OLD SEED WAS THE LEAK. The previous specimen was the
  // Haiku `cold_reply_curiosity` reply from 39087f4, which opened **"Hi, I'm
  // Maya."** The F-08.66 cure quotes that back to her verbatim on EVERY wake —
  // so the vacated name sat in her evidence three times a run, and at 881a084
  // Haiku read it and wrote "Maya opened the conversation with Kanupriya."
  // **The costume break was reading a byte I put there.** A captured specimen
  // is only faithful while the tree it was captured from is the tree that ships.
  //
  // NOW: the Haiku `cold_reply_curiosity` reply from 881a084 — same slot, same
  // model, verbatim, and Mira-era. Re-capture this whenever the persona moves.
  const SEEDED_SEAM_REPLY =
    "Hey — I'm Mira, from The Dream Wedding.\n\nWe built a demo studio for you using your Instagram "
    + "work, so you can see what it looks like when a couple finds you on our platform instead of "
    + "scrolling through a thousand other things on Insta.\n\nWant to take a look?";

  // ── THE OPENER IS RENDERED, NOT INJECTED — and the distinction is F-08.76 ──
  // The relay chartered "seed the TRUE opener bytes" to cure transcripts that
  // "began one message too late." The reading is right and the harm is real:
  // every transcript this arc produced omitted the first thing the prospect
  // ever read. But the CAUSE is not the fixture. Derived by command:
  // `runOpenerJob` calls `logMessage` NOWHERE, and `openProspectConversation`
  // runs on the INBOUND — so in PRODUCTION the opener enters no conversation,
  // and the model cannot see it either. **The harness is faithful; production
  // is what loses the message.**
  //
  // Pushing the opener into `sb.db.messages` would therefore hand the model a
  // row production does not have — a fixture that lies about production, which
  // is F-08.68's own class, cured six hours ago. So it is PRINTED into the
  // transcript (the reader's problem, solved) and NOT pushed (the model's
  // history, kept honest). F-08.76 carries the production fork to the chair.
  //
  // The bytes are read FROM THE REGISTRY, never retyped: templates.js is the
  // single source of what Meta approved.
  if (turns[0] === '__NUDGE__') {
    const t0 = Date.now() - 180000;
    const opener = TEMPLATES.marketing_opener.body.replace('{{1}}', 'Kanupriya');
    out.push(`  ${MIRA} (opener template, sent by runOpenerJob — NOT in the conversation history,`);
    out.push(`        F-08.76): ${opener}`);
    sb.db.messages.push({ id: 'm0', conversation_id: CONV_ID, direction: 'inbound',
      body: 'ok tell me more', created_at: new Date(t0).toISOString() });
    sb.db.messages.push({ id: 'm0a', conversation_id: CONV_ID, direction: 'outbound',
      body: SEEDED_SEAM_REPLY, created_at: new Date(t0 + 60000).toISOString() });
    out.push('  THEM: ok tell me more');
    // THE LABEL IS CLEAN. A transcript label is read by people, but rep 3 proved
    // a stray name anywhere near the fixture becomes a few-shot; there is no
    // reason for this line to carry anything but her name.
    out.push(`  ${MIRA}: ${SEEDED_SEAM_REPLY.split('\n')[0]} …  [seeded seam reply]`);
  }

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const isNudge = t === '__NUDGE__';

    // The prospect's turn is a ROW, not an array entry — production reads
    // history from public.messages and derives the nudge standing from the same
    // rows, so the harness must write them or it is measuring a different thing.
    if (!isNudge) {
      out.push(`  THEM: ${t}`);
      sb.db.messages.push({ id: 'm' + (sb.db.messages.length + 1), conversation_id: CONV_ID,
        direction: 'inbound', body: t, created_at: new Date(Date.now() + i * 1000).toISOString() });
    }


    // ── F-08.65 CURED · THE HARNESS ROUTES THROUGH runCloserTurn ────────────
    // WHAT THIS READ, and it is why the finding exists: this line called
    // `llmCreate` DIRECTLY and printed the raw model blocks. So the instrument
    // GATING DEPLOY was a second implementation of the turn — the normalizer,
    // the [NOTHING] token, the signature and the watcher were all invisible to
    // it, and two link mangles were read as production defects when the
    // production seam had already corrected them. A transcript that is not what
    // the prospect receives is not evidence about what the prospect receives.
    //
    // NOW: the real function, the real context builder, the real guard, the real
    // corrections. The model call is injected through the `llm` seam that
    // already existed for the bench, so the LANE is still chosen here and
    // everything else is production.
    // ── THE LANE IS PINNED ON BOTH HALVES, AND DISAGREEMENT IS LOUD ─────────
    // THIS READ `llmCreate(provider, ...)` — the provider RESOLVED, the model
    // OVERRIDDEN. When `guardKeys` fell back to anthropic for a missing DeepSeek
    // key, Anthropic was handed `deepseek-v4-flash` and returned 404 eleven
    // times a run. A harness whose job is to pin a lane must pin both halves,
    // and must say so out loud when the route disagrees rather than emitting a
    // cross-provider request nobody asked for.
    let usage = {};
    const laneLlm = async (resolvedProvider, params) => {
      // PRODUCTION MODE FORCES NOTHING. The engine has already chosen the lane
      // for THIS turn — reply or wake — and this hands the call to exactly that
      // provider with exactly that model. `wake_split` becomes a witnessable
      // fact instead of a constant.
      if (lane.production) {
        const r = await llmCreate(resolvedProvider, params);
        usage = r.usage || {};
        r._called = { provider: resolvedProvider, model: params.model };
        return r;
      }
      if (resolvedProvider !== lane.provider) {
        console.warn(`  [lane] route resolved ${resolvedProvider}, forcing ${lane.provider} `
          + `— check the provider key is present in this process`);
      }
      const r = await llmCreate(lane.provider, Object.assign({}, params, { model: lane.model }));
      usage = r.usage || {};
      // F-08.72 — A FACADE THAT OVERRIDES WHAT IT WAS HANDED SAYS SO. The engine
      // logs `called_*` from this, so a forced lane can never again be recorded
      // under the route's name.
      r._called = { provider: lane.provider, model: lane.model };
      return r;
    };
    const turn = await closer.runCloserTurn({
      supabase: sb, prospect: name === 'bare_row_cold' ? BARE_PROSPECT : FIXTURE_PROSPECT,
      conversationId: CONV_ID,
      phone: FIXTURE_PHONE, wakeReason: isNudge ? 'nudge' : 'reply', llm: laneLlm,
    });
    const text = turn.text;
    // Persisted so the NEXT turn's history and derived nudge-standing are real
    // reads of real rows, exactly as production computes them.
    if (text) sb.db.messages.push({ id: 'm' + (sb.db.messages.length + 1), conversation_id: CONV_ID,
      direction: 'outbound', body: text, created_at: new Date(Date.now() + i * 1000).toISOString() });
    // ── F-08.68 CURED · THE LABEL IS THE ENGINE'S NUMBER, NEVER THE LOOP'S ──
    // `standing = i` is GONE. `runCloserTurn` now returns the standing it
    // actually derived and the count of sends it actually quoted, and those are
    // what print. A transcript is read as evidence by the founder and by the
    // chair; a number in it that the engine never produced is the transcript
    // lying about the run, which is the whole of F-08.65 and now of F-08.68.
    out.push(`  ${MIRA}${isNudge ? ` [nudge, ${turn.nudgesStanding} standing, `
      + `${turn.unansweredSends === undefined ? '?' : turn.unansweredSends} quoted]` : ''}: `
      + `${text || '(NO SEND — silence)'}`);
    out.push(`        · source=${turn.source} called=${turn.calledProvider}/${turn.calledModel}`
      + ` signed=${turn.signed}${turn.upgraded ? '(upgraded)' : ''} normalized=${turn.normalized || 0}`
      + ` exit_gated=${!!turn.exitGated}`
      + (turn.wakeTells ? ` WAKE_DROPPED=${turn.wakeTells.join(',')}` : '')
      + ` claim=${text ? hasProductClaim(text) : 'n/a'}`
      + ` flags=${(turn.flags || []).join(',') || 'none'}`
      + ` in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens || 0}`);
  }
  return out.join('\n');
}

(async function main() {
  const lanes = argLane ? [argLane] : Object.keys(LANES);
  const names = argScene ? [argScene] : Object.keys(SCENARIOS);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(ROOT, 'scripts/out');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `closer_scenarios_${stamp}.txt`);
  const log = [];
  const say = (s) => { console.log(s); log.push(s); };

  const manual = closer.loadManual();
  say(`${MIRA.toUpperCase()} (the Closer) — GOLDEN SCENARIOS · soul=${CLOSER_SOUL_VERSION} `
    + `manual=${manual.version} soul_chars=${CLOSER_SOUL.length}`);
  say(`lanes: ${lanes.join(', ')} · scenarios: ${names.length}`);

  for (const laneName of lanes) {
    // F-08.72 — BUST THE ROUTE CACHE AT EVERY LANE BOUNDARY. `modelRouter`'s 60s
    // in-process cache made the DeepSeek lane inherit Haiku's route for its
    // first five scenarios at 710b4e5. A lane's transcripts can never again wear
    // the other lane's name.
    _resetRouteCache();
    const L = LANES[laneName];
    const banner = L.production
      ? `LANE: PRODUCTION — the shipped route, resolved per turn  ★ THIS LANE GATES`
      : `LANE: ${laneName.toUpperCase()} (${L.provider}/${L.model}) — diagnostic, does not gate`;
    say(`\n${'█'.repeat(64)}\n${banner}\n${'█'.repeat(64)}`);
    // A MISSING KEY SILENTLY COLLAPSES THE SPLIT — `guardKeys` drops it and the
    // wake follows the reply. That is correct behaviour and a WORTHLESS run, so
    // it is said out loud rather than discovered in the counts.
    if (L.production && !process.env.DEEPSEEK_API_KEY) {
      say('  ⚠ DEEPSEEK_API_KEY ABSENT — the wake split will be dropped by guardKeys and');
      say('    every nudge will read wake_split=false. This run does not measure F-08.69.');
    }
    for (const name of names) {
      say(`\n── ${name} ──`);
      say(`  READ FOR: ${READ_FOR[name]}`);
      try {
        say(await runScenario(name, laneName));
      } catch (e) {
        say(`  LANE ERROR: ${e.message}`);
      }
    }
  }

  fs.writeFileSync(outFile, log.join('\n'), 'utf8');
  console.log(`\nTranscript written to ${outFile}`);
  console.log('The founder reads these. His approval gates the deploy.');
})().catch(e => { console.error(e); process.exit(2); });
