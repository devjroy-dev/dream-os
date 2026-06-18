// scripts/test-shape.js
//
// Isolated test bench for the Phase 3.5 wedding-shape extractor.
// Runs many phrasings through the real Haiku extractor — no WhatsApp, no DB,
// no couple reset. Repeatable; use it to tune extraction as you find edge cases.
//
// Run from repo root:  node scripts/test-shape.js
// Requires ANTHROPIC_API_KEY in the environment (it's already in your Codespace).

const Anthropic = require('@anthropic-ai/sdk').default;
const { extractWeddingShape } = require('../src/agent/brideOnboarding');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Each case: [message, expected-ish] — "expected" is just a human note, not asserted.
const CASES = [
  ['All of them. Around 4 days',                          '4 functions / 4 days / all four named'],
  ['Everything, over 5 days',                             '4 functions / 5 days / all four named'],
  ['Just the wedding, one day',                           '1 function / 1 day / functions null'],
  ['Mehendi, sangeet and the wedding, over 3 days',       '3 functions / 3 days / those three'],
  ['mehendi haldi sangeet wedding reception, 4 days',     '5 functions / 4 days'],
  ['The works',                                           '4 functions / days null'],
  ['Sangeet and reception only, 2 days',                  '2 functions / 2 days'],
  ['Not sure yet',                                        'all null (dodge-ish)'],
  ['big fat punjabi wedding lol so everything, a week',   '4 functions / 7 days (week)'],
  ['just a court marriage',                               '1 function / 1 day-ish'],
];

(async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set in environment. Run inside your Codespace where the key exists.');
    process.exit(1);
  }
  console.log('Testing extractWeddingShape() across phrasings:\n');
  for (const [msg, note] of CASES) {
    try {
      const out = await extractWeddingShape(msg, anthropic);
      console.log(`MSG : "${msg}"`);
      console.log(`WANT: ${note}`);
      console.log(`GOT : count=${out.function_count}  days=${out.wedding_days}  functions=${out.functions ? `"${out.functions}"` : 'null'}`);
      console.log('');
    } catch (err) {
      console.log(`MSG : "${msg}"  → ERROR: ${err.message}\n`);
    }
  }
  console.log('Done.');
})();
