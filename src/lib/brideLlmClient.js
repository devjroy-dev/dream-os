// src/lib/brideLlmClient.js — CE-31 · charter BF-1 · ARM A, FULL FLIP, ENV-GATED.
//
// THE BRIDE/CIRCLE LANE'S MODEL CLIENT, CHOSEN BY ENV.
//
// Before this file, brideIndex.js:81 built a RAW `new Anthropic(...)` and the
// bride lane never rode src/lib/llm.js. That meant the lane's two ephemeral
// cache_control blocks (brideEngine.js:235, circleEngine.js:110) would ride
// STRAIGHT ONTO a foreign endpoint the moment anyone pointed a baseURL
// elsewhere — an Anthropic-only field a strict endpoint rejects, which is the
// z law llm.js:56-58 already carries. The founder's ruling (2026-08-12) moves
// this lane to DeepSeek by env var alone; the ruled shape routes it THROUGH
// llm.js's provider table so the strip and the thinking-suppression arrive BY
// CONSTRUCTION rather than by hand at two call sites that would drift apart.
//
// ── THE OFF STATE IS TODAY'S LANE, AT THE BYTE ──────────────────────────────
// BRIDE_LLM_PROVIDER unset, empty, or naming a provider llm.js's CONF does not
// carry ⇒ this returns `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`,
// which is brideIndex.js:81's pre-flip byte. Not "equivalent" — the same
// construction. F-08.56's lane-flag precedent: a flag whose OFF state is a
// different code path is not a flag, it is a fork.
//
// UNRECOGNISED FALLS BACK RATHER THAN THROWING, deliberately. A typo in a
// Railway variable must not take the bride lane down at boot; it must leave her
// exactly where she was. The ledger tells the truth either way, so a silent
// fallback cannot hide spend — the row's provider column reads 'anthropic'
// because the wire WAS anthropic.
//
// ── WHY model:'' AND NOT THE CALLER'S STRING ────────────────────────────────
// llm.js:31 is `(m) => m || env || 'deepseek-v4-flash'` — THE REQUESTED MODEL
// WINS, by that file's own header law (llm.js:7). Every bride call site passes
// MODEL_HAIKU explicitly (brideEngine.js:214, circleEngine.js:103/125/190), so
// routing through the table WITHOUT blanking the model would have sent a Haiku
// string to api.deepseek.com. The table then resolves its own default, and
// `__wireModel` below is computed from THE SAME EXPRESSION, so the string this
// client declares to the meter and the string that goes on the wire cannot
// disagree — they are one call to CONF[p].model('').
//
// ── F-06.85 MECHANISM NOTE — READ BEFORE MOVING THE METER ───────────────────
// `__wireProvider` / `__wireModel` are READ BY src/lib/coupleAiCap.js's ledger
// writer (its CE-31 labelled amendment). They are not decoration. Renaming or
// dropping them here silently returns the ledger to transcribing the CALLER's
// belief — provider=anthropic, model=haiku — while DeepSeek rupees leave the
// account. If you touch these two names, the meter's amendment is your next
// stop, and tools/bench/tdw10c_couple_meter_bench.js §9 is what will catch you.
'use strict';

const Anthropic = require('@anthropic-ai/sdk').default;
const { CONF, clientFor, translateFor, assertToolFidelity, llmCreate } = require('./llm');

const OFF_PROVIDER = 'anthropic';
const ENV_VAR = 'BRIDE_LLM_PROVIDER';

// Unset / empty / unknown ⇒ the OFF state. Case and whitespace forgiving,
// because a Railway variable is typed by a human at 2am.
function resolveBrideProvider(env) {
  const e = env || process.env;
  const raw = String(e[ENV_VAR] || '').trim().toLowerCase();
  if (!raw) return OFF_PROVIDER;
  if (!Object.prototype.hasOwnProperty.call(CONF, raw)) return OFF_PROVIDER;
  return raw;
}

// The exact string the table will put on the wire for this provider, derived
// from the table itself rather than restated here. models.ts's price row is
// keyed on this string; a restated constant that drifted from CONF would price
// the lane at the Haiku ceiling and the ledger would never say so.
function wireModelFor(provider) {
  const c = CONF[provider];
  return (c && typeof c.model === 'function') ? c.model('') : null;
}

// Returns EITHER the raw Anthropic SDK client (OFF) or a client-shaped adapter
// whose only surface is `.messages.create` — derived, not assumed: the bride
// lane's entire SDK surface is three `anthropic.messages.create` sites plus
// `ai.messages.create` at brideIndex.js:309, and no `.messages.stream` anywhere
// (llm.js's pseudo-stream is therefore not wired here; wiring an unused path
// would be an unbenched one).
//
// The adapter carries NO `__unwrap`. coupleAiCap.js's meteredAnthropic uses
// `__unwrap` as its ONE stacking guard — an adapter that carried the field
// would be unwrapped to something that is not a client.
function buildBrideClient(env) {
  const e = env || process.env;
  const provider = resolveBrideProvider(e);

  if (provider === OFF_PROVIDER) {
    return new Anthropic({ apiKey: e.ANTHROPIC_API_KEY });
  }

  const wireModel = wireModelFor(provider);

  return {
    __wireProvider: provider,
    __wireModel: wireModel,
    messages: {
      // ── WHY THIS IS llmCreate's BODY AND NOT A CALL TO IT ─────────────────
      // `llmCreate(provider, params)` takes NO request-options argument, and
      // brideEngine.js:2150 (the circle-summary composer) passes one:
      // `messages.create({…}, { timeout: 8000 })`. Calling llmCreate would have
      // DROPPED that timeout — a foreign endpoint with no deadline is a hang
      // with no symptom, on a path that runs inside a bride's turn. The design
      // note claimed no bride call site passed a second argument; that claim
      // was WRONG and meter bench cell 9.4 reddened on it before a byte shipped.
      // So: llmCreate's three steps, in its order, with the options forwarded.
      // ZERO bytes move in llm.js — a shared facade the vendor engine, the
      // closer, harvest and the gauntlet all ride.
      //
      // F-06.85 MECHANISM NOTE: this duplication is pinned. Meter bench cell
      // 9.6 asserts llmCreate's body is still exactly translateFor → create →
      // assertToolFidelity; the day llmCreate grows a fourth step, that cell
      // reddens and sends its author here.
      create: async (params, options) => {
        const wire = translateFor(provider, { ...(params || {}), model: '' });
        const resp = options === undefined
          ? await clientFor(provider).messages.create(wire)
          : await clientFor(provider).messages.create(wire, options);
        assertToolFidelity(provider, resp);
        return resp;
      },
    },
  };
}

module.exports = { buildBrideClient, resolveBrideProvider, wireModelFor, OFF_PROVIDER, ENV_VAR };
