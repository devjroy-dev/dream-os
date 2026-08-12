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

// ── CE-31 · BF-1 · LABELLED AMENDMENT TO 10.C's SEALED LAW (ratify-or-revert) ─
// THE LEDGER RECORDS THE WIRE, NOT THE CALLER'S INTENT.
//
// Sealed 10.C hardcoded `provider: 'anthropic'` and took `model` from
// `params.model` — the string the CALL SITE passed. That was true while every
// metered call was Anthropic and the caller's belief and the wire's fact were
// the same sentence. The bride-lane provider flip (BRIDE_LLM_PROVIDER) breaks
// that identity: brideEngine.js:214 still passes MODEL_HAIKU while the adapter
// at lib/brideLlmClient.js sends `deepseek-v4-flash` to api.deepseek.com. Left
// alone, this writer would have recorded provider=anthropic, model=haiku, and
// PRICED IT AT THE HAIKU ROW while DeepSeek rupees left the account — silent
// mis-pricing on the exact lane the meter exists to watch.
//
// The chair that sealed 10.C opened it narrowly for this and nothing else.
// SOLE-WRITER LAW IS PRESERVED: this function remains the only writer of the
// ledger's provider/model columns. It merely stops transcribing a belief when
// a fact is on offer. When the machinery acted, the machinery speaks.
//
// THE FALLBACK IS THE POINT. A client that declares nothing — every raw
// Anthropic client on the couple web lane (api/couple/chat.js, api/couple/muse.js)
// and the bride lane's own OFF state — takes the pre-amendment path BYTE FOR
// BYTE. That is what makes the flip's OFF state pinnable at the byte, and it is
// what meter bench cell 9.2 asserts.
function wireProviderOf(client) {
  const p = client && client.__wireProvider;
  return (typeof p === 'string' && p) ? p : null;
}
function wireModelOf(client, params) {
  const m = client && client.__wireModel;
  if (typeof m === 'string' && m) return m;
  return (params && params.model) || null;
}

// ── Anthropic spend ──────────────────────────────────────────────────────────
// Real tokens through a real price. cost_basis = 'metered'.
async function recordAnthropicCall({ supabase, ctx, kind, model, usage, provider }) {
  const u = usage || {};
  const inTok    = u.input_tokens ?? 0;
  const outTok   = u.output_tokens ?? 0;
  const cacheR   = u.cache_read_input_tokens ?? 0;
  const cacheW   = u.cache_creation_input_tokens ?? 0;
  return writeRow(supabase, {
    ...baseRow(ctx, kind),
    // CE-31 BF-1: the declaration wins when present; absent, this is 10.C's byte.
    provider:      provider || PROVIDER_ANTHROPIC,
    model:         model || null,
    input_tokens:  inTok,
    output_tokens: outTok,
    // ── F-10.117 (0121) — THE ROW NOW CARRIES WHAT PRICED IT ────────────────
    // These two were read and priced from delivery 1 onward and then DROPPED on
    // the floor. The first production row proved the cost: 707 in / 54 out
    // against a stored ₹1.66, where those two columns alone yield ₹0.10. The
    // number was right; the row could not show its work, and the reader who
    // checked it (this seat) had to reconstruct a cache-write from arithmetic.
    // Spend was never wrong — reproducibility was. Persisting them closes it
    // and makes cache-hit economics readable, which is a live cost question on
    // a lane whose static prefix is cached ephemerally (brideEngine.js:227).
    cache_read_tokens:  cacheR,
    cache_write_tokens: cacheW,
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
          // CE-31 BF-1 · the wire's fact over the caller's belief. `client` is
          // the UNWRAPPED client — the adapter itself — so the declaration is
          // read at the one place that knows what actually left the process.
          model:    wireModelOf(client, params),
          provider: wireProviderOf(client),
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


// ═══════════════════════════════════════════════════════════════════════════
// DELIVERY 3 — THE GATE. THE LEDGER NOW HAS A READER.
// ═══════════════════════════════════════════════════════════════════════════
// Deliveries 1 and 2 counted and refused nothing. This is the third act of ⑨'s
// sequence — 「 ledger → meter → refuse at three doors, never in one act 」 —
// and the doors turned out to be eight, not three (⑨'s count was the then-known
// one; the delivery-1 door census found five behind the bride turn alone).
//
// ── THE LAWS THAT BIND EVERY LINE BELOW ────────────────────────────────────
// 1. FAIL-OPEN, ABSOLUTELY (combined_cap §3.4). A broken meter costs an
//    UNMETERED TURN, never a silent agent. Every failure path in this section
//    returns state 'ok'. If the config read throws, if the count throws, if the
//    dial is unparseable — she gets her answer. The bill is the cheaper loss.
// 2. F-10.85 — THE DIAL CAN SAY ZERO. A stored 0 is a DENY, never treated as
//    absent. This is the single most defect-prone line in the whole cure: the
//    natural JS idioms (`Number(v) || fallback`, `if (!cap)`) BOTH swallow zero.
//    A dial the founder set to 0 that silently means "no limit" is the exact
//    inversion of a brake.
// 3. THE UNIT IS THE TURN, NOT THE ROW (G1, R-30.37). COUNT(DISTINCT turn_id)
//    WHERE kind='turn'. Counting rows would price the founder's 20 messages at
//    as few as 4 — see 0120's own index comment.
// 4. ONE BYTE PER REFUSAL EVENT (fork D). Components skipped inside an
//    otherwise-permitted flow are SILENT to the user and SPOKEN TO THE LOG.
// 5. EVERY CAP-CAUSED SKIP LOGS ITSELF BY NAME (forks A and C's rider).
//    F-09.173's lesson is standing law: silence about a dropped capability is
//    the disease. A capped skip must never be forensically confusable with a
//    pipeline fault.

// ── ACCEPTED COPY · FOUNDER-VETOED 2026-08-12 · FROZEN AT THE BYTE ──────────
// APPROVED-COPY-CARRIES-ITS-HASH: these are frozen as BYTES, not as intents. An
// edit — even a comma — needs a fresh veto and may not ride a refactor. The
// bench pins them as literals so a silent drift reddens.
//
// The bytes are condition-SPECIFIC by the founder's choice, vetoed twice over.
// Fork E's preference for condition-agnostic bytes is served by its own
// alternative branch (every variant a separate veto line) — approved copy is
// not reopened to chase a preference, and 「 I'll be right here at midnight 」 is
// a true, specific promise the agnostic form cannot make.
const CAP_BYTES = {
  // Bride, daily window reached.
  bride_daily:   "You've reached today's conversation limit. I'll be right here at midnight.",
  // Bride, monthly window reached.
  bride_monthly: "You've reached this month's conversation limit. I'll be right here on the 1st.",
  // Circle member — NOT the customer. Carries NO upgrade language (⑨ +
  // R-26.15②), and says nothing about the bride's allowance: he should not
  // learn her limits from a refusal, and R-30.35 leaves nothing to upgrade to.
  circle:        "The board's chat is quiet for today — you can still browse and add to it any time.",
  // Dial at 0. Nothing was "reached" — she used nothing — so neither window byte
  // may be spoken here. This is why the zero case needed its own sentence.
  zero:          "Chat is paused right now. Everything you've saved is still here whenever you want it.",
};

// ── ACCEPTED COPY · FOUNDER-VETOED 2026-08-12 at 541b945 · ARMED ───────────
// §0.2-J / relay №4 ruled J1 and the founder's word arrived: 「 YES 」. The
// onboarding surface
// at dial 0 refuses with the TRIMMED byte — the first sentence of the vetoed
// zero byte, nothing added — because a bride mid-signup has saved NOTHING and
// 「 Everything you've saved is still here 」 would promise a state the machine
// does not hold. That is fork E's own law applied to fork B's assignment.
//
// It was a SEPARATE VETO LINE under copy law and it now carries its decision:
// approved verbatim by the founder, 2026-08-12, against tree 541b945. FROZEN AT
// THE BYTE under APPROVED-COPY-CARRIES-ITS-HASH — an edit, even the full stop,
// needs a fresh veto and may not ride a refactor. Cell 8.7 pins it as a literal.
//
// It shipped in D3 present, inert and named rather than absent, so that arming
// it was one line and not a rediscovery of the ruling. This is that line.
const CAP_BYTE_ONBOARDING_ZERO = 'Chat is paused right now.';
const ZERO_ONBOARDING_ARMED = true;

// ── IST WINDOWS ─────────────────────────────────────────────────────────────
// Re-derived at THIS seat's tip (ead0b9b), never transcribed from a relay:
// src/api/vendor-engine/chat.js:2687 `IST_MS`, :2688 `istDayStartUtcISO()`,
// :2692 `istMonthStartUtcISO()`. Same shape, deliberately — a couple and a
// vendor whose caps roll at different midnights is a support ticket nobody can
// answer. Duplicated rather than imported because that module is Express-bound
// vendor-lane machinery and this one is called from the WhatsApp lane.
const IST_MS = 5.5 * 60 * 60 * 1000;
function istDayStartUtcISO() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_MS).toISOString();
}
function istMonthStartUtcISO() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_MS).toISOString();
}

// F-10.85's whole defence, in one function. `Number(v) || d` returns d for "0";
// `v ?? d` returns "" for an empty string. Only an explicit finite check honours
// a stored zero, and a stored zero is a DENY.
function dialValue(raw, fallback) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

// Counts DISTINCT turn_id WHERE kind='turn' since `sinceIso`. Spend rows of
// every other kind are money, not messages, and never appear here (F4).
async function countTurns(supabase, coupleId, sinceIso) {
  const { data, error } = await supabase
    .from('couple_ai_usage')
    .select('turn_id')
    .eq('couple_id', coupleId)
    .eq('kind', 'turn')
    .not('turn_id', 'is', null)
    .gte('created_at', sinceIso);
  if (error) throw new Error(error.message);
  return new Set((data || []).map((r) => r.turn_id)).size;
}

// ── THE READ ────────────────────────────────────────────────────────────────
// Returns { state, dayUsed, monUsed, dayCap, monCap, degraded }.
// state ∈ 'ok' | 'zero' | 'monthly' | 'daily'
//
// PRECEDENCE (fork E): zero > monthly > daily. Most specific truth first. At a
// 0 dial nothing was "reached" and a window byte would claim a consumption that
// never happened.
async function readCoupleCap({ supabase, couple }) {
  const open = (extra) => ({ state: 'ok', dayUsed: null, monUsed: null, dayCap: null, monCap: null, degraded: true, ...extra });
  try {
    if (!supabase || !couple || !couple.id) return open();
    const tier   = couple.tier || 'basic';
    const dayKey = `couple_ai_daily_${tier}`;
    const monKey = `couple_ai_monthly_${tier}`;

    const [{ data: cfg, error: cfgErr }, dayUsed, monUsed] = await Promise.all([
      supabase.from('admin_config').select('key, value').in('key', [dayKey, monKey]),
      countTurns(supabase, couple.id, istDayStartUtcISO()),
      countTurns(supabase, couple.id, istMonthStartUtcISO()),
    ]);
    if (cfgErr) throw new Error(cfgErr.message);

    const byKey = {};
    for (const row of (cfg || [])) byKey[row.key] = row.value;

    // AN ABSENT DIAL IS NOT A ZERO DIAL. If the key does not exist at all, the
    // couple is UNCAPPED (Infinity) — the gate fails open on missing config
    // exactly as it fails open on a thrown read. Only a PRESENT dial reading 0
    // is a deny, which is the distinction F-10.85 exists to protect.
    const dayCap = dialValue(byKey[dayKey], Infinity);
    const monCap = dialValue(byKey[monKey], Infinity);

    let state = 'ok';
    if (dayCap === 0 || monCap === 0)      state = 'zero';
    else if (monUsed >= monCap)            state = 'monthly';
    else if (dayUsed >= dayCap)            state = 'daily';

    return { state, dayUsed, monUsed, dayCap, monCap, degraded: false };
  } catch (e) {
    console.warn('[couple-cap] meter unreadable — FAILING OPEN, the turn proceeds:', e.message);
    return open();
  }
}

// ── THE BYTE ────────────────────────────────────────────────────────────────
// surface ∈ 'bride' | 'circle' | 'onboarding'. Returns null when nothing is
// refused — and null is also what an unarmed pending-veto byte returns, so an
// unvetoed sentence can never reach a human.
// Fork B, as its OWN PREDICATE rather than a branch inside the byte resolver.
// The reason is a bench defect this seat caught in its own mutation sweep:
// while ZERO_ONBOARDING_ARMED is false, `refusalByteFor('daily','onboarding')`
// returns null whether the exemption exists or not — so deleting the exemption
// changed NOTHING observable and no cell could redden. A rule that cannot be
// tested while a byte awaits veto is a rule that will be quietly lost at the
// veto. Exposed here so the exemption has teeth today, unarmed byte and all.
//
// TRUE means this state refuses a bride mid-onboarding. Only the zero dial does:
// she has spent nothing, so a reached-cap refusal is indefensible — but 0 is the
// founder's brake, and a brake that leaves one engine running is not a brake.
function onboardingRefusesAt(state) {
  return state === 'zero';
}

function refusalByteFor(state, surface) {
  if (state === 'ok') return null;
  if (surface === 'circle') return CAP_BYTES.circle;
  if (surface === 'onboarding') {
    if (!onboardingRefusesAt(state)) return null;
    return ZERO_ONBOARDING_ARMED ? CAP_BYTE_ONBOARDING_ZERO : null;
  }
  if (state === 'zero')    return CAP_BYTES.zero;
  if (state === 'monthly') return CAP_BYTES.bride_monthly;
  return CAP_BYTES.bride_daily;
}

// ── WHICH SURFACE IS THIS DOOR? (fork B) ────────────────────────────────────
// The refusal is sited at the DOOR so a capped couple spends nothing behind it
// — but that means the door must know whether the bride behind it is
// ONBOARDING, because fork B exempts onboarding from reached-cap refusal.
//
// ⚠ MECHANISM NAMED IN-COMMENT, per F-06.85. This condition is a COPY of
// src/agent/brideEngine.js:85 —
//     if (couple.onboarding_state && couple.onboarding_state !== 'complete')
// — which is the branch that actually routes a turn to brideOnboarding.js. THE
// TWO ARE ONE FACT. If a sitting changes how the engine decides a bride is
// onboarding and does not change this line, the door and the engine disagree:
// the door refuses a bride the engine would have onboarded, or exempts one it
// would have charged. Whoever moves either must re-read the other.
function surfaceForCouple(couple) {
  if (couple && couple.onboarding_state && couple.onboarding_state !== 'complete') {
    return 'onboarding';
  }
  return 'bride';
}

// ── THE GATE ────────────────────────────────────────────────────────────────
// One call per door. Returns { refuse, byte, state, degraded }.
// The log line is MANDATORY (forks A/C/D's rider): a capped refusal and a capped
// skip must both be greppable, so that a missing reply is never mistaken for a
// transport fault the way F-09.173's eaten photo was.
async function coupleCapGate({ supabase, couple, surface = 'bride', circleMemberId = null }) {
  const cap = await readCoupleCap({ supabase, couple });
  const byte = refusalByteFor(cap.state, surface);
  if (!byte) {
    if (cap.state !== 'ok') {
      console.log(`[couple-cap] state=${cap.state} surface=${surface} couple=${couple && couple.id} — NOT refused at this surface (exempt or byte unarmed)`);
    }
    return { refuse: false, byte: null, state: cap.state, degraded: cap.degraded };
  }
  console.log(`[couple-cap] REFUSED state=${cap.state} surface=${surface} couple=${couple && couple.id}` +
              (circleMemberId ? ` member=${circleMemberId}` : '') +
              ` day=${cap.dayUsed}/${cap.dayCap} month=${cap.monUsed}/${cap.monCap}`);
  return { refuse: true, byte, state: cap.state, degraded: cap.degraded };
}

// Fork A's rider, as its own named function so every cap-caused skip logs
// identically and greps as one family.
function logCapSkip(what, coupleId, state) {
  console.log(`[couple-cap] SKIPPED ${what} — cap state=${state} couple=${coupleId}. ` +
              'This is a cap decision, NOT a pipeline fault.');
}

module.exports = {
  // Delivery 3 — the gate
  readCoupleCap,
  refusalByteFor,
  onboardingRefusesAt,
  surfaceForCouple,
  coupleCapGate,
  logCapSkip,
  CAP_BYTES,
  CAP_BYTE_ONBOARDING_ZERO,
  ZERO_ONBOARDING_ARMED,
  istDayStartUtcISO,
  istMonthStartUtcISO,
  dialValue,
  // Deliveries 1-2 — the meter
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
