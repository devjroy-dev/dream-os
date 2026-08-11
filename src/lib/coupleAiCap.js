// src/lib/coupleAiCap.js — THE COUPLE LANE'S METER. ONE WRITER, TEN SITES.
//
// TDW_10.C · DELIVERY 1. F-10.105 / F-10.107 / F-10.112.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS DELIVERY REFUSES NOTHING. IT ONLY COUNTS.
// ═══════════════════════════════════════════════════════════════════════════
// The banked ruling ⑨ sequences this build: 「 ledger → meter → refuse at three
// doors, never in one act 」. This file is acts one and two. There is no cap
// read here, no gate, no refusal byte — deliberately. The dials exist in
// admin_config (0120) with NO READER; delivery 3 gives them one.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE SOLE-WRITER RIDER (⑨'s condition, verbatim in force)
// ═══════════════════════════════════════════════════════════════════════════
// public.couple_ai_usage has EXACTLY ONE writer home, and it is `writeRow`
// below. No call site inserts directly. A sitting that adds a second writer
// breaks the rider and should instead add a `kind` and call through here.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⟶ MUTUAL POINTER, per F-06.85. THE SIBLING LEDGER IS `engine.usage`.
// ═══════════════════════════════════════════════════════════════════════════
// The vendor lane meters into engine.usage, read by `buildMeta` in
// src/api/vendor-engine/chat.js. THE TWO LEDGERS ARE DELIBERATELY NOT ONE
// TABLE, and the reason is the Plane Doctrine (LD-1), not taste:
//   · engine.usage.agent_id is uuid NOT NULL (docs/db/ENGINE_SCHEMA.md,
//     `## engine.usage · 12 columns`, column 2).
//   · The couple lane holds NO agent_id anywhere. engine.agents rows are
//     minted only by the vendor signup path (src/engine/src/core/signup.ts).
//   · Fusing the ledgers therefore means minting sham engine identities for
//     brides — the crossing F-10.107 files.
// The twin of this paragraph lives in db/migrations/0120_couple_ai_ledger.sql.
// A sitting tempted to fuse them must read BOTH before it moves.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS METERS BY WRAPPING THE CLIENT, NOT BY EDITING TEN CALL SITES
// ═══════════════════════════════════════════════════════════════════════════
// The estate has already paid for this lesson and written it down. From
// brideEngine.js:312-318, on the money guard:
//     「 Seating the guard INSIDE the function covers both by construction;
//       seating it at the bride call site would have left the circle door
//       open. 」
// The census that opened this sitting found the same shape: a charter named
// THREE spend sites and the tree held TEN. A meter that must be remembered at
// each new `messages.create` will be forgotten at the eleventh. So the DOOR
// wraps the Anthropic client once, and every call beneath it — including calls
// added by future sittings that never read this file — is metered by
// construction.
//
// The two non-Anthropic sites cannot be covered that way and are recorded
// explicitly: `recordGeminiSearch` (a REST SDK) and `recordVisionCall` (a raw
// fetch to images:annotate).

const crypto = require('crypto');

// ── THE ONE COST HOME, never a second pricing table ─────────────────────────
// harvest.js:38 sets the precedent for reaching the compiled engine artefact
// from plain JS — the same built file, and NOTHING sited inside the engine wall.
//
// LOADED LAZILY AND FAIL-OPEN, and the reason is mechanical: `src/engine/dist/`
// is GITIGNORED (.gitignore:26), so a fresh clone does not have it until
// `npm run build:engine` runs. harvest.js requires it at module load and would
// take the whole process down on an unbuilt tree; this module must not, because
// it now sits in the bride's reply path at ten sites.
//
// WHEN THE COST HOME IS UNREACHABLE THE ROW IS STILL WRITTEN — with
// cost_basis='unpriced' and cost_inr=0, which is precisely what that column
// exists to say. The count survives, the money is honestly marked unknown, and
// nothing invents a price or copies the table. A deployed tree is always built
// (Railway runs `npm run build`), so this degradation is a bench/dev fact, not
// a production one — but it is labelled rather than silent either way.
let _calcCostInr = null;
let _costHomeChecked = false;
function costHome() {
  if (!_costHomeChecked) {
    _costHomeChecked = true;
    try {
      _calcCostInr = require('../engine/dist/core/models').calcCostInr;
    } catch (e) {
      console.warn('[couple-meter] cost home unreachable (unbuilt engine dist) — rows write as unpriced:', e.message);
      _calcCostInr = null;
    }
  }
  return _calcCostInr;
}

// Returns { cost_inr, cost_basis } — the basis DOWNGRADES when the price is
// borrowed or absent, and never the other way.
function priceOf(model, inTok, outTok, cacheR, cacheW, intendedBasis) {
  const calc = costHome();
  if (!calc) return { cost_inr: 0, cost_basis: 'unpriced' };
  return { cost_inr: calc(model, inTok, outTok, cacheR || 0, cacheW || 0), cost_basis: intendedBasis };
}

const KINDS = ['turn', 'fanout', 'onboarding', 'search', 'tagging'];

const PROVIDER_ANTHROPIC = 'anthropic';
const PROVIDER_GEMINI    = 'google-gemini';
const PROVIDER_VISION    = 'google-vision';

// ── Turn identity (G1, R-30.37) ──────────────────────────────────────────────
// Minted at the DOOR, once per inbound message, stamped on every row that
// inbound causes. The meter counts DISTINCT turn_id WHERE kind='turn'; spend
// sums every row regardless.
//
// WHY THIS EXISTS AT ALL: the vendor dial counts engine.usage ROWS and that
// equals counting TURNS only because loop.ts:922-931 writes ONE pre-aggregated
// row per turn. This lane has no aggregation — one bride message is up to FIVE
// calls (brideEngine.js:43), one circle message up to THREE
// (circleEngine.js:35), one image TWO, plus N fan-out calls. Counting rows
// would price the founder's 20 messages/day at as few as 4 real messages.
function newTurnId() {
  return crypto.randomUUID();
}

// ── The one writer ───────────────────────────────────────────────────────────
// FAIL-OPEN, ABSOLUTELY. combined_cap §3.4's law, inherited: a broken meter
// costs an unmetered row, NEVER a silent agent. A bride's reply is never at the
// mercy of a ledger insert. Every failure warns and returns; nothing throws,
// nothing awaits a retry, nothing blocks the turn.
async function writeRow(supabase, row) {
  try {
    if (!supabase) {
      console.warn('[couple-meter] no supabase client — row dropped');
      return false;
    }
    // couple_id is NOT NULL in the table. A row without one is not writable and
    // is dropped loudly rather than silently mangled into a fake identity.
    if (!row || !row.couple_id) {
      console.warn(`[couple-meter] no couple_id for kind=${row && row.kind} — row dropped`);
      return false;
    }
    if (!KINDS.includes(row.kind)) {
      console.warn(`[couple-meter] refusing unknown kind="${row.kind}" — row dropped`);
      return false;
    }
    const { error } = await supabase.from('couple_ai_usage').insert(row);
    if (error) {
      console.warn('[couple-meter] ledger write failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[couple-meter] ledger write threw:', e.message);
    return false;
  }
}

// Normalises whatever a caller hands us into the ledger's shape.
// ctx = { couple_id, circle_member_id, turn_id, kind }
function baseRow(ctx, kind) {
  return {
    couple_id:        (ctx && ctx.couple_id) || null,
    circle_member_id: (ctx && ctx.circle_member_id) || null,
    turn_id:          (ctx && ctx.turn_id) || null,
    kind:             kind || (ctx && ctx.kind) || 'turn',
  };
}

// ── Anthropic spend ──────────────────────────────────────────────────────────
// Real tokens through a real price. cost_basis = 'metered'.
async function recordAnthropicCall({ supabase, ctx, kind, model, usage }) {
  const u = usage || {};
  const inTok    = u.input_tokens ?? 0;
  const outTok   = u.output_tokens ?? 0;
  const cacheR   = u.cache_read_input_tokens ?? 0;
  const cacheW   = u.cache_creation_input_tokens ?? 0;
  return writeRow(supabase, {
    ...baseRow(ctx, kind),
    provider:      PROVIDER_ANTHROPIC,
    model:         model || null,
    input_tokens:  inTok,
    output_tokens: outTok,
    ...priceOf(model, inTok, outTok, cacheR, cacheW, 'metered'),
  });
}

// ── Gemini spend (groundedSearch, kind='search') ─────────────────────────────
// USAGE IS REAL, THE PRICE IS BORROWED — hence 'estimated', and the honesty is
// the whole point of the column.
//
// The token fields were witnessed mechanically rather than recalled: the
// declared dependency @google/genai@^2.2.0 ships its own type declarations
// carrying `GenerateContentResponse.usageMetadata` with `promptTokenCount` and
// `candidatesTokenCount`, both optional — so absence is handled, never assumed.
//
// calcCostInr has NO Gemini entry and falls back to HAIKU rates by its own
// documented law (src/engine/src/core/models.ts:76). That OVER-states, exactly
// as harvest.js:73-77 declares for deepseek/glm: a deliberate conservative
// ceiling, never an invented price. Supply a real Gemini rate to that one cost
// home and this row upgrades to 'metered' without touching this file.
async function recordGeminiSearch({ supabase, ctx, model, raw }) {
  const meta   = (raw && raw.usageMetadata) || {};
  const inTok  = meta.promptTokenCount ?? 0;
  const outTok = meta.candidatesTokenCount ?? 0;
  return writeRow(supabase, {
    ...baseRow(ctx, 'search'),
    provider:      PROVIDER_GEMINI,
    model:         model || null,
    input_tokens:  inTok,
    output_tokens: outTok,
    ...priceOf(model, inTok, outTok, 0, 0, 'estimated'),
  });
}

// ── Vision spend (images:annotate, kind='tagging') ───────────────────────────
// NO TOKENS AND NO RATE. This endpoint bills per image and the estate holds no
// Vision price anywhere.
//
// cost_inr = 0 AND cost_basis = 'unpriced'. The zero is honest ONLY because the
// basis column says what it means. Writing 0 with no marker would be F-10.85's
// disease one abstraction up — the reader unable to tell 「 free 」 from 「 we do
// not know 」, which is exactly the ambiguity a stored zero caused on the vendor
// cap dial.
//
// THE ROW IS STILL WRITTEN, and that is deliberate: the CALL happened, the
// couple caused it, and a forwarded image is F-10.107's cheapest vector. An
// unpriced row proves the volume today and backfills to real money with one
// UPDATE the day a rate exists. Not writing it would lose the count forever.
async function recordVisionCall({ supabase, ctx }) {
  return writeRow(supabase, {
    ...baseRow(ctx, 'tagging'),
    provider:      PROVIDER_VISION,
    model:         'vision.googleapis.com/v1/images:annotate',
    input_tokens:  null,
    output_tokens: null,
    cost_inr:      0,
    cost_basis:    'unpriced',
  });
}

// ── THE WRAPPER ──────────────────────────────────────────────────────────────
// Returns an object that is `messages.create`-compatible with the real client.
// Every call through it writes one ledger row after the response returns.
//
// TRANSPARENT BY CONSTRUCTION:
//   · the second argument (request options — `{ timeout: 8000 }` at
//     circleEngine.js:118 and brideEngine.js:2122) is forwarded untouched;
//   · the response object is returned UNMODIFIED and un-awaited-upon — callers
//     read response.content / response.stop_reason / response.usage exactly as
//     before;
//   · a THROWN model call is re-thrown after no row is written. There was no
//     spend to record and the caller's own catch (circleEngine.js:119,
//     brideEngine.js:2132) must still see the error.
//   · the meter write is awaited but fail-open, so its failure is a warn.
//
// `__unwrap` lets `withKind` re-scope without stacking proxies — a stacked
// proxy would write TWO rows for one call, which is the exact class of
// double-count this ledger exists to prevent.
function meteredAnthropic(anthropic, ctx) {
  if (!anthropic) return anthropic;
  const client = anthropic.__unwrap ? anthropic.__unwrap : anthropic;
  const supabase = ctx && ctx.supabase;
  const kind = (ctx && ctx.kind) || 'turn';

  return {
    __unwrap: client,
    __meterCtx: ctx,
    messages: {
      create: async (params, options) => {
        const response = options === undefined
          ? await client.messages.create(params)
          : await client.messages.create(params, options);
        await recordAnthropicCall({
          supabase,
          ctx,
          kind,
          model: (params && params.model) || null,
          usage: response && response.usage,
        });
        return response;
      },
    },
  };
}

// Re-scope a wrapped client to a different `kind` for a sub-tree of calls.
// The bride turn wraps once as 'turn'; the onboarding hand-off, the fan-out and
// the image path each re-scope so their rows carry the truth about what they
// are. Un-wrapped clients pass through unchanged (fail-open).
function withKind(anthropic, kind, extra) {
  if (!anthropic || !anthropic.__meterCtx) return anthropic;
  // Passes the WRAPPED client deliberately: `meteredAnthropic` normalises via
  // __unwrap, and that is the ONE stacking guard. Unwrapping here as well made
  // both sites redundant and neither provable — a guard nothing can redden is
  // not a guard. Self-caught at the bench's mutation sweep.
  return meteredAnthropic(anthropic, {
    ...anthropic.__meterCtx,
    ...(extra || {}),
    kind,
  });
}

// Read the context back off a wrapped client, for the two explicit recorders
// that sit beside a non-Anthropic call and have no ctx of their own.
function meterCtxOf(anthropic) {
  return (anthropic && anthropic.__meterCtx) || null;
}

module.exports = {
  newTurnId,
  meteredAnthropic,
  withKind,
  meterCtxOf,
  recordAnthropicCall,
  recordGeminiSearch,
  recordVisionCall,
  KINDS,
  PROVIDER_ANTHROPIC,
  PROVIDER_GEMINI,
  PROVIDER_VISION,
};
