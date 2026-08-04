#!/usr/bin/env node
// scripts/b08_p5_closer_scenarios.js — MAYA'S GOLDEN SCENARIOS, BOTH ARCHITECTURES.
//
// ── WHAT THIS IS ─────────────────────────────────────────────────────────────
// The 06 spec's P2 bench list, as replayable scripts. These are MODEL RUNS. They
// need live keys and they are the FOUNDER'S to run — the estate's own precedent
// (the gauntlet: "rig selftest N/N at the desk, the LIVE run is the founder's
// with his keys"). The mechanical floor under Maya is b08_p5_closer_bench.js and
// it runs anywhere with no keys at all.
//
// ── BOTH LANES, AND THE REASON IS THE MANUAL PAPER'S OWN LAW ─────────────────
// "A doctrine that only one model can carry is a routing constraint wearing a
// soul's clothes." The founder ruled 「 the option should be there 」 — Maya must
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
// Victor, Donna, Mira, Eliza, Maya — near-twins included. The existing
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
const closer          = require(path.join(ROOT, 'src/agent/closerEngine.js'));
const { MAYA_SOUL, CLOSER_SOUL_VERSION } = require(path.join(ROOT, 'src/agent/souls/closerSoul.js'));

const LANES = {
  haiku:    { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  deepseek: { provider: 'deepseek',  model: 'deepseek-v4-flash' },
};

const argLane  = (process.argv.find(a => a.startsWith('--lane=')) || '').split('=')[1];
const argScene = (process.argv.find(a => a.startsWith('--scenario=')) || '').split('=')[1];

// ── The prospect Maya is talking to across every scenario ────────────────────
// A demo studio that is LIVE but NOT on the marketplace — deliberately the
// production fixture's own shape, because that is the case where the close line
// has two senses and only one of them is true.
const FIXTURE_CONTEXT = [
  'WHO YOU ARE TALKING TO',
  'Name: Kanupriya Sethi Studio',
  'Instagram: kanupriyasethi.studio',
  'Trade: photography',
  'City: Chandigarh',
  '',
  'THEIR DEMO STUDIO',
  'Live and openable right now: https://thedreamwedding.in/demo/vendor/kanupriyasethi.studio',
  'It is NOT on the marketplace where couples browse — it is a page they can open, and nothing more than that. Never imply couples are seeing it.',
  'The page is honestly labelled a demonstration. So are you.',
].join('\n');

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
};

async function runScenario(name, laneName) {
  const lane  = LANES[laneName];
  const turns = SCENARIOS[name];
  const messages = [];
  const out = [];

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const isNudge = t === '__NUDGE__';
    const standing = isNudge ? i : 0;

    let dynamic = FIXTURE_CONTEXT;
    if (isNudge) {
      dynamic += '\n\nNOBODY HAS ANSWERED\n'
        + `Your last ${standing === 1 ? 'message has' : `${standing} messages have`} gone unanswered. Nothing has come back.\n`
        + (standing >= 2
          ? 'This is your last message on this conversation. Leave the door open, gracefully.'
          : 'You may send one more after this if it is still silent, and then you stop.')
        + '\nSay something worth opening, or say goodbye well. Nothing else.';
      messages.push({ role: 'user', content: '(no reply has come. write your next message, or your last one.)' });
    } else {
      out.push(`  THEM: ${t}`);
      messages.push({ role: 'user', content: t });
    }

    const system = closer.buildStaticSystem().concat([{ type: 'text', text: dynamic }]);
    const resp = await llmCreate(lane.provider, { model: lane.model, max_tokens: 700, system, messages });
    const text = (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    messages.push({ role: 'assistant', content: text });
    out.push(`  MAYA${isNudge ? ` [nudge, ${standing} standing]` : ''}: ${text}`);
    const u = resp.usage || {};
    out.push(`        · in=${u.input_tokens} out=${u.output_tokens} cache_read=${u.cache_read_input_tokens || 0} cache_write=${u.cache_creation_input_tokens || 0}`);
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
  say(`MAYA — GOLDEN SCENARIOS · soul=${CLOSER_SOUL_VERSION} manual=${manual.version} soul_chars=${MAYA_SOUL.length}`);
  say(`lanes: ${lanes.join(', ')} · scenarios: ${names.length}`);

  for (const laneName of lanes) {
    say(`\n${'█'.repeat(64)}\nLANE: ${laneName.toUpperCase()} (${LANES[laneName].provider}/${LANES[laneName].model})\n${'█'.repeat(64)}`);
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
