// src/lib/modelRouter.js — TDW_02 P5: resolveModel(surface, tier) -> {provider, model, escalation_model?}.
// Precedence (spec P5): LLM_PROVIDER env (the force switch, all surfaces) ->
// admin_config `model.<surface>.<tier>` (JSON-in-text — value column is text, D7;
// parsed defensively, junk falls through) -> the DEFAULT matrix below (which equals
// 0073's seeds, so a pre-seed deploy routes identically; the seeds exist to make the
// routes ADMIN-EDITABLE — PATCH cannot create keys, D7).
// Missing provider key -> anthropic fallback + `[provider_misconfigured]` log (spec P5).
// 60s in-process cache. Zero-deploy flips: the admin PATCH lands within one cache window.
'use strict';

const { providerKeyPresent, CONF } = require('./llm');

const HAIKU = 'claude-haiku-4-5-20251001';

// The default matrix == 0073 seeds (spec P5; tier names are PRODUCT tiers, CE-7).
const DEFAULTS = {
  // BENCH VERDICT 2026-07-14 (acceptance 6, live): glm-4.7-flash FAILED the advisory
  // tool-turn bench — false dones (C2/C3) + a fabricated-entity write (C4/Nena
  // Bansal). GLM stays PROVEN for harvest (strict-JSON extraction lane). Trial
  // routes anthropic until block 06 revisits with caching + a re-bench.
  'model.pwa_vendor.trial':     { provider: 'anthropic', model: HAIKU },
  'model.pwa_vendor.essential': { provider: 'deepseek',  model: 'deepseek-v4-flash' },
  'model.pwa_vendor.signature': { provider: 'anthropic', model: HAIKU },
  // TDW_06 economics sitting (founder-ruled NO Sonnet): the dormant escalation_model
  // entry removed — nothing in the estate ever read the field (grep-verified at
  // delivery). The LIVE Sonnet paths (tier-map top start, mid-tier escalate) are a
  // separate finding, filed not touched — see F-04.85 in FINDINGS_LOG.
  'model.pwa_vendor.prestige':  { provider: 'anthropic', model: HAIKU },
  // TDW_06 P6b (F-06.4, CE-ratified): the advisor room routes to deepseek at the door.
  // Keyed by victor_mode='advisor' (not a product tier) — resolved via the tier slot so
  // resolveModel is untouched. Mirrors 0082_advisor_route_seed.sql; a pre-seed deploy
  // routes advisor identically here rather than silently falling to Haiku.
  'model.pwa_vendor.advisor':   { provider: 'deepseek',  model: 'deepseek-v4-flash' },
  // TDW_08 P5 Phase 3 — THE MARKETING LANE'S ROUTE (Maya, the Closer).
  // A PROSPECT HAS NO TIER: they are not vendors and hold no `vendors` row, so
  // the tier slot is `default` and `model.harvest.default` is the structural
  // precedent here, not `pwa_vendor`. Seeded haiku per E-4's unified
  // architecture — every outward Victor-class mouth starts Haiku, cached.
  // Mirrors 0110_marketing_route_seed.sql so a pre-seed deploy routes
  // IDENTICALLY; the seed row exists to make the route admin-editable, because
  // the PATCH door 404s on a key with no row (D7). The founder's flip to
  // DeepSeek and back is that row, 60 seconds, no deploy.
  //
  // F-08.69 — THE WAKE ROLE RIDES A DIFFERENT LANE, AND IT IS AN ASSIGNMENT
  // RATHER THAN A CURE. Haiku wake-turns failed in EVERY build of this arc:
  // 9/9 narration → 7/9 self-reintroduction → 4/9 refusals → 4/9 costume breaks
  // at 881a084, including a markdown-headed briefing to an imagined operator,
  // on the wire. DeepSeek wake-turns: 0/9 that night and effectively clean
  // across the arc's whole history. The frame now works so well that a careful
  // model reads the wake as a brief — and the careful model in this house is
  // Haiku. So: replies stay on the seeded lane; wakes ride the lane that has
  // never broken one. Amendment Two's own geometry, one role over.
  // MIRRORS 0111_marketing_nudge_route.sql. ⚠ THE SEED ROW WINS OVER THIS
  // MATRIX, so 0111 must be run or wakes silently follow replies.
  'model.wa_marketing.default':  { provider: 'anthropic', model: HAIKU,
                                   nudge_provider: 'deepseek', nudge_model: 'deepseek-v4-flash' },
  // TDW_08 P5 Phase 4 — THE COUPLE LANE'S ROUTE (Eliza, the concierge on a
  // vendor's line). A COUPLE HAS NO TIER: she is not a vendor and holds no
  // `vendors` row, so the tier slot is `default` — `wa_marketing` is the
  // structural precedent here, not `pwa_vendor`. Seeded anthropic/haiku, which
  // is the literal this lane carried at `engine.js` since Session 5.5, so the
  // facade join changed the MECHANISM and not one routed byte. MIRRORS
  // `0112_couple_route_and_flag.sql` so a pre-seed deploy routes IDENTICALLY;
  // the seed row exists to make the route admin-editable (the PATCH door 404s
  // on a key with no row, D7).
  'model.wa_couple.default':    { provider: 'anthropic', model: HAIKU },
  'model.harvest.default':      { provider: 'glm',       model: 'glm-4.7-flash' },
};

// ── F-08.84 — THE PER-SURFACE ALLOW-SET ─────────────────────────────────────
// THE FINDING. `guardKeys` below guards PROVIDERS and KEYS. It has never
// guarded MODELS, and nothing else does either. Every wa-lane that joins this
// facade therefore trades a COMPILE-TIME model ceiling for an admin_config row:
// one UPDATE puts Sonnet on a customer-facing wire, with no deploy, no review,
// and no bench able to see it. That is F-05.32 — Sonnet convicted on live bride
// turns at 3x Haiku's rate — re-enabled by the transport of its own cure.
//
// THE HOLE WAS ALREADY LIVE. `model.wa_marketing.default` joined this facade at
// Phase 3 and has been open ever since; the couple lane's join would have been
// the second door, not the first. Minted at F-08.84 — the ledger's next free
// address DERIVED BY COMMAND at bfcb88e (F-08 runs to .83 and stops), never
// taken from a count. The chair's own ".86" was loose arithmetic; opening two
// silent holes on it would have been F-08.56 repeated.
//
// THE CURE, CE-RULED. Each customer-facing surface declares the model FAMILIES
// it admits. A resolved model outside its surface's set is REFUSED LOUDLY and
// the surface falls to its own DEFAULTS entry. The 60-second DeepSeek flip
// survives untouched, because DeepSeek is in the set. Sonnet on a customer wire
// goes back to requiring a code change AND a bench amendment, which is exactly
// the guarantee F-05.32 bought and this facade would otherwise have spent.
//
// A surface with NO entry here is UNCONSTRAINED, deliberately: `pwa_vendor`
// carries Victor's own haiku<->sonnet self-escalation mechanics (S-8), which are
// ruled behaviour and not this finding's business. Silence here means "not
// governed", never "governed by an empty set" — a distinction stated because an
// empty set would refuse every route and fail this lane closed by accident.
const HAIKU_CLASS    = ['claude-haiku-4-5-20251001'];
const DEEPSEEK_CLASS = ['deepseek-v4-flash'];
const SURFACE_ALLOW = {
  wa_couple:    new Set([...HAIKU_CLASS, ...DEEPSEEK_CLASS]),
  wa_marketing: new Set([...HAIKU_CLASS, ...DEEPSEEK_CLASS]),
};

// ── CE-41 F1 (R-41.85) — THE SWITCHABLE SET, BUILT FROM THE CLASSES ABOVE ────
// The founder's panel offers TWO providers per lane and no free text. This is
// that ceiling's ONE home, and it MINTS NO STRING: both values are read out of
// the F-08.84 classes six lines up, so a model name can never be true here and
// stale there. `glm` is absent BY CONSTRUCTION rather than by omission — it is
// in no live path (the harvest row is DeepSeek, founder's SELECT 2026-09-08)
// and no glm class exists above to build it from.
//
// A LIVE VALUE OUTSIDE THIS SET IS NOT REWRITTEN. The write door refuses to
// PUT one; the read door renders one it FINDS read-only, with its real words.
// That distinction is deliberate: a panel that silently re-labels a row it
// cannot express is the hollow green this estate keeps convicting.
const SWITCHABLE = Object.freeze({
  anthropic: HAIKU_CLASS[0],
  deepseek:  DEEPSEEK_CLASS[0],
});

// ── CE-41 F1 — THE LANE REGISTRY (the door's only source of keys) ────────────
// WHY A REGISTRY AND NOT `Object.keys(DEFAULTS)`. The two sets are NOT equal and
// the difference is the whole finding of F0:
//   · `model.pwa_vendor.basic` is in NEITHER the matrix nor the database, yet it
//     is the tier `vendors.tier` DEFAULTS to and the tier 0115 renamed every old
//     `trial` vendor into (0115:104). It resolves on the bare literal at the foot
//     of `resolveModel` with NO donna split, and until this registry nothing in
//     the estate could name it. UNNUMBERED FINDING, F0 §4 — the chair mints.
//   · `model.pwa_vendor.trial` is a LIVE, well-formed row that no code path can
//     ask for: `vendors_tier_check` (0115:118) admits four words and `trial` is
//     not one of them. It is carried here `reachable: false` so the panel can SAY
//     SO rather than offer a switch that moves nothing. F0 §5.
//   · the `wa_vendor` lanes exist here BEFORE any row does — that is F-41.46.
//
// THE TIER WORDS ARE NOT TRANSCRIBED. They come from `CANON_TIERS`, the same
// frozen list the billing flip writes from and the same four words the CHECK
// constraint admits (R-40.94: the set is derived from the source that defines
// it). If a fifth tier is ever added, this registry grows with it and the panel
// grows a row; it cannot silently miss one the way 0115 missed this key.
const { CANON_TIERS } = require('./billing/tierFlip');

// ══════════════════════════════════════════════════════════════════════════
// CE-41 · SEAT G · R-41.104 — THE WHATSAPP LANE'S ROOM, WITH ONE HOME
// ══════════════════════════════════════════════════════════════════════════
// R-39.22 has said since band 7 that advisory lives in the Advisor room alone.
// F-40.3's cure (`vendorInbound.js:1436-1449`) enforced that AT THE WORD — the
// lane refuses to WRITE `advisor` onto the row — and R-41.104 now enforces it
// AT THE READ: a vendor flipped to advisor in the PWA still gets a BUSINESS
// Victor on WhatsApp, because the WhatsApp lane never asks what the row holds.
//
// WHY THE FACT LIVES HERE AND NOT AT EITHER DOOR. The rule has TWO readers that
// must never disagree: the ROUTE (`buildLlmForTurn`, which chose `advisor` as a
// tier slot from `victor_mode`) and the ROOM (`loop.ts:299`, which chose the
// advisory lens, the tool set and `estateInRoom` from the same column). A
// literal `'business'` at each site is two homes for one rule, and the failure
// mode is not hypothetical — it is this seat's own finding: the route was cured
// in isolation once already in draft and the lane came out routing business
// while still LOSING Donna, the estate and every read hand. One function, read
// by both, so the two cannot drift apart.
//
// IT TAKES NO ARGUMENT AND HAS NO BRANCH, deliberately. A `waLaneMode(vendor)`
// would be a switch, and a switch is the thing R-41.104 removes; the founder's
// lever for this lane is the PWA chip, which still works, on the PWA.
function waLaneMode() {
  return 'business';
}

// ══════════════════════════════════════════════════════════════════════════
// CE-41 · SEAT G · G2 · R-41.107 — THE ROOM, RESOLVED ONCE FOR BOTH READERS
// ══════════════════════════════════════════════════════════════════════════
// THE ROOM IS A PROPERTY OF THE ROOM, NOT OF THE VENDOR. That sentence is the
// whole of R-41.107 and it is the founder's, derived from a surface: the Advisor
// page at `/vendor/advisor` is its own shell with its own ask bar, and the shared
// Ask TDW sheet — the same component on `/vendor/rooms` and `/vendor/support` —
// opened on top of it and answered as business inside it. The room was a page and
// a sentence; it had no mechanism. `engine.agents.victor_mode` was the mechanism
// that used to exist, and it is a PERSISTENT COLUMN: the chip that wrote it was
// removed without draining what it wrote, leaving one agent of twenty-seven in a
// room the app has no control to leave (F-41.113, chair-numbered).
//
// SO THE ASSERTION IS PER-TURN AND WRITES NOTHING. A page that knows which room
// it is says so with the turn; nothing persists; there is no state to get stuck
// in. The chair refused the two alternatives on this seat's evidence: a new
// switch is F-40.3 a third time, and an invisible auto on/off needs a write on
// LEAVING, which a PWA cannot promise — tab closed, app killed, signal lost, back
// gesture, memory reclaimed — so it manufactures stranded rows on the commonest
// exits.
//
// WHY THE RESOLUTION LIVES HERE. It has TWO readers that must never disagree: the
// ROUTE (`buildLlmForTurn`, which picks the `advisor` tier slot) and the ROOM
// (`loop.ts:299`, which picks the lens, the tool set and `estateInRoom`). The two
// live in different PACKAGES — `src/engine` is `vendor-suit-engine`, its own
// tsconfig, compiled to `dist` — so a literal one home spanning both is not
// available. THIS IS THE HONEST SECOND-BEST AND IT IS DECLARED, NOT PAPERED: the
// door resolves here; the engine carries the same three-term precedence at :299;
// and `b65` §8 drives BOTH across the full input matrix and asserts they agree on
// every combination. A disagreement is a bench red, not a production surprise.
//
// THE PRECEDENCE, CHAIR-RULED, IN ORDER:
//   1. the SURFACE — `wa_vendor` is `waLaneMode()` and nothing else can speak
//      (R-41.104). An assertion arriving on that lane is not weighed, it is not
//      reachable: the WhatsApp door does not send one and this function would
//      refuse it if it did.
//   2. `modeOverride` — the door saying `business`. Narrow by type ('business'
//      only) so no door can ever push a vendor INTO the advisory room.
//   3. `roomAssert` — the page saying `advisor`. Narrow by type the other way:
//      a page can assert the advisory room and nothing else, so this field can
//      never be used to force someone OUT of a room either.
//   4. the COLUMN — what `engine.agents.victor_mode` holds. Last, and on its way
//      out: it retires in a later packet, and until then it is what keeps the one
//      orphan row's app behaviour unchanged.
//
// THE TWO FIELDS ARE DELIBERATELY NOT ONE. A single `room?: 'business'|'advisor'`
// would be smaller and would walk straight through `b65_mutations` M3, which
// exists to RED exactly that widening. Two fields, two polarities, two intents,
// each unable to express the other's — the asymmetry IS the fence.
function resolveVendorRoom({ surface, modeOverride, roomAssert, columnMode }) {
  if (surface === 'wa_vendor') return waLaneMode();
  if (modeOverride === 'business') return 'business';
  if (roomAssert === 'advisor') return 'advisor';
  return columnMode === 'advisor' ? 'advisor' : 'business';
}

const VENDOR_ROLES = Object.freeze(['provider', 'donna']);
// CE-41 · SEAT G · R-41.104 (Fork C, chair-ruled) — `advisor` IS A PER-SURFACE
// TIER, NOT A UNIVERSAL ONE.
//
// It was minted for every vendor surface, which was right while both surfaces
// had the room. The WhatsApp lane no longer does, and dropping only the ROW
// (`0154`) would have been a cure ONE TAP UNDOES: `admin/modelRoutes.js` builds
// its response from `LANES` (:124, :137) and guards its POST on `LANE_BY_KEY`
// (:182), so the lane would keep appearing on the panel with `has_row: false`
// and the door's read-merge-write would seed the row back from what is live the
// first time the founder touched it. THE REGISTRY IS THE AUTHORITY; the row is
// downstream of it. Removing the lane closes both — the panel stops offering the
// switch and the door refuses the key.
//
// `pwa_vendor` KEEPS IT (R-41.104 §4(d)): the advisor room is reachable in the
// app, it routes to its own model there, and the founder switches it there.
function vendorLanes(surface, extra, opts) {
  const tiers = (opts && opts.advisor === false) ? [...CANON_TIERS] : [...CANON_TIERS, 'advisor'];
  return tiers.map((tier) => ({
    key: `model.${surface}.${tier}`, surface, tier,
    roles: VENDOR_ROLES, reachable: true, ...extra,
  }));
}

const LANES = Object.freeze([
  // Victor and Donna in the app. `advisor` is not a product tier — it is
  // victor_mode, resolved through the tier slot (F-06.4) — and it is switchable
  // like any other lane because the founder chooses who answers in that room too.
  ...vendorLanes('pwa_vendor'),
  // F-41.46 — Victor and Donna on WhatsApp. Same tiers, own rows, and until a
  // row exists each one RESOLVES THROUGH ITS `pwa_vendor` TWIN. Zero behaviour
  // change on the day this ships; a separately switchable lane the moment the
  // founder taps it.
  //
  // R-41.104 (seat G): NO `advisor` LANE. The WhatsApp door cannot reach that
  // tier slot any more — `buildLlmForTurn` routes this surface on `waLaneMode()`
  // and never on `victor_mode` — so a lane here would be a switch the founder
  // could tap that moved nothing, which is exactly what `reachable: false` was
  // invented to prevent (R-40.60). `0154` drops the row this seed left behind.
  ...vendorLanes('wa_vendor', { fallback_surface: 'pwa_vendor' }, { advisor: false }),
  { key: 'model.wa_marketing.default', surface: 'wa_marketing', tier: 'default',
    roles: Object.freeze(['provider', 'nudge']), reachable: true },
  { key: 'model.wa_couple.default', surface: 'wa_couple', tier: 'default',
    roles: Object.freeze(['provider']), reachable: true },
  { key: 'model.harvest.default', surface: 'harvest', tier: 'default',
    roles: Object.freeze(['provider']), reachable: true },
  // ── CE-41 F1b — THE BRIDE APP LANE, READ-ONLY BY CONSTRUCTION ──────────────
  // Eliza in the couple's own app is the one lane in the estate that is NOT a row:
  // `src/lib/brideLlmClient.js` reads `BRIDE_LLM_PROVIDER` off the environment and
  // falls to anthropic when it is unset, empty or unknown. It is carried in this
  // registry so the panel can SHOW it — a lane the founder cannot see is a lane he
  // cannot reason about — and it carries NO ROLES, so the write door refuses it
  // before it can reach a row that does not exist.
  //
  // This is the line seat E's veto sheet §D-34 was reaching for when it marked the
  // COUPLE lane `Set on the server`. `model.wa_couple.default` is a real row and is
  // switchable (R-41.103 ②); this one is the genuine env lane, and it is the only
  // read-only row on the panel that is read-only because of where its value lives.
  { key: 'model.bride_app.default', surface: 'bride_app', tier: 'default',
    roles: Object.freeze([]), reachable: true,
    env: 'BRIDE_LLM_PROVIDER',
    read_only_because: 'this lane is set on the server, not in a row' },
  // Live, well-formed, and asked for by nothing. Read-only on the glass.
  { key: 'model.pwa_vendor.trial', surface: 'pwa_vendor', tier: 'trial',
    roles: Object.freeze([]), reachable: false,
    unreachable_because: 'vendors_tier_check admits basic|essential|signature|prestige (0115); no code path produces this key' },
]);

const LANE_BY_KEY = new Map(LANES.map((l) => [l.key, l]));

// The ONE home of the fallback FACT. `buildLlmForTurn` asks this rather than
// carrying its own `surface === 'wa_vendor' ? 'pwa_vendor' : null`, so the
// borrowing is stated once, in the registry, where the door reads it too.
function fallbackSurfaceFor(surface, tier) {
  const lane = LANE_BY_KEY.get(`model.${surface}.${tier || 'default'}`);
  return (lane && lane.fallback_surface) || null;
}

// Applied to the PRIMARY model and to any role-split model on the same route
// (`nudge_model`, `donna_model`), because a split is a second model reaching the
// same wire and a guard that covers one is F-04.38's class: a cure landing on
// one door while its twin sits one field away.
function enforceAllowSet(surface, route) {
  const allow = SURFACE_ALLOW[surface];
  if (!allow) return route;
  const fallback = DEFAULTS[`model.${surface}.default`] || { provider: 'anthropic', model: HAIKU };
  let out = route;
  for (const field of ['model', 'nudge_model', 'donna_model']) {
    const m = out[field];
    if (m == null) continue;
    if (allow.has(m)) continue;
    console.warn(`[model_refused] ${surface}.${field}="${m}" is outside this surface's allow-set `
      + `(F-08.84) — falling back to ${fallback.model}`);
    out = { ...out, [field]: fallback.model, refused: true };
    if (field === 'model') out.provider = fallback.provider;
  }
  return out;
}

const CACHE_MS = 60_000;
const cache = new Map(); // key -> { at, val }

function parseRoute(text) {
  try {
    const v = JSON.parse(String(text));
    if (v && typeof v === 'object' && v.provider && v.model && CONF[v.provider]) {
      // TDW_02 P7 (Amendment Two): optional per-role split — donna_provider/donna_model
      // route HER hand separately (LD-7: e.g. mid = Victor haiku / Donna deepseek).
      // Invalid split values are dropped, never guessed.
      if (v.donna_provider && !CONF[v.donna_provider]) { delete v.donna_provider; delete v.donna_model; }
      if (v.donna_provider && !v.donna_model) delete v.donna_provider;
      // TDW_08 P5 (F-08.69): the SAME per-role geometry, one role over — a wake
      // turn may ride a different lane from a reply turn. Identical validation,
      // identical drop-rather-than-guess discipline. Read by
      // `src/agent/closerEngine.js`; nothing else has wake turns.
      if (v.nudge_provider && !CONF[v.nudge_provider]) { delete v.nudge_provider; delete v.nudge_model; }
      if (v.nudge_provider && !v.nudge_model) delete v.nudge_provider;
      return v;
    }
  } catch (_e) { /* junk falls through to defaults */ }
  return null;
}

function guardKeys(route) {
  if (route.provider !== 'anthropic' && !providerKeyPresent(route.provider)) {
    console.warn(`[provider_misconfigured] ${route.provider} routed but its key is absent — anthropic fallback`);
    return { provider: 'anthropic', model: HAIKU, misconfigured: true };
  }
  if (route.donna_provider && route.donna_provider !== 'anthropic' && !providerKeyPresent(route.donna_provider)) {
    console.warn(`[provider_misconfigured] donna route ${route.donna_provider} keyless — her split dropped, she follows Victor`);
    const { donna_provider, donna_model, ...rest } = route;
    return rest;
  }
  // F-08.69: the nudge split follows donna's exact failure mode — a keyless
  // provider DROPS the split rather than routing at a key that is not there.
  // The wake then rides the reply lane, which is the pre-ruling behaviour and
  // is loudly logged rather than silently correct.
  if (route.nudge_provider && route.nudge_provider !== 'anthropic' && !providerKeyPresent(route.nudge_provider)) {
    console.warn(`[provider_misconfigured] nudge route ${route.nudge_provider} keyless — the wake split dropped, wakes follow replies`);
    const { nudge_provider, nudge_model, ...rest } = route;
    return rest;
  }
  return route;
}

async function resolveModel(supabase, surface, tier, opts = {}) {
  const key = `model.${surface}.${tier || 'default'}`;

  // 1 — the force switch overrides everything (spec precedence).
  const forced = String(process.env.LLM_PROVIDER || '').trim();
  if (forced && CONF[forced]) {
    const base = DEFAULTS[key] || { model: HAIKU };
    return enforceAllowSet(surface, guardKeys({ provider: forced, model: forced === 'anthropic' ? (base.provider === 'anthropic' ? base.model : HAIKU) : CONF[forced].model(''), forced: true }));
  }

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.val;

  // 2 — admin_config (JSON-in-text, defensive).
  let route = null;
  try {
    const { data } = await supabase.from('admin_config').select('value').eq('key', key).maybeSingle();
    if (data && data.value != null) route = parseRoute(data.value);
  } catch (e) { console.warn('[modelRouter] admin_config read failed (defaults apply):', e.message); }

  // 2b — CE-41 F-41.46 — THE BORROWED LANE, AND THE TRAP INSIDE IT ───────────
  // The WhatsApp vendor door has always routed on `model.pwa_vendor.<tier>`: it
  // called the shared builder and the builder named that surface (chat.js P7b).
  // It now names its OWN surface, and a `wa_vendor` key with no row DELEGATES to
  // its `pwa_vendor` twin rather than falling through.
  //
  // WHY THIS SITS HERE AND NOT AT STEP 3. Step 3 cannot tell "no row" from "no
  // route": `DEFAULTS` holds no `wa_vendor` entry, so a miss would land on the
  // literal below — anthropic/Haiku, NO donna split — and that would silently
  // retire DeepSeek from the essential lane and Donna's split from all four, on
  // the WhatsApp wire, on the day this shipped. The exact opposite of the zero
  // behaviour change F-41.46 promises. Only a GENUINE row miss delegates, and it
  // delegates BEFORE any default can answer for it.
  //
  // THE RESOLVED VALUE CACHES UNDER THE PRIMARY KEY, never the fallback's. Cache
  // it under the twin and a later `wa_vendor` seed is invisible for a window,
  // which is F-08.72's shape one lane over. `bustRouteCache` below cascades for
  // the same reason.
  //
  // THE ALLOW-SET APPLIED IS THE PRIMARY SURFACE'S, because the wire is the
  // WhatsApp lane. Moot today — neither surface has a SURFACE_ALLOW entry (see
  // F-08.84 above: silence means "not governed") — and stated because it will
  // not be moot the day one does.
  if (!route && opts.fallbackSurface && opts.fallbackSurface !== surface) {
    const borrowed = await resolveModel(supabase, opts.fallbackSurface, tier);
    const lent = enforceAllowSet(surface, { ...borrowed });
    cache.set(key, { at: Date.now(), val: lent });
    return lent;
  }

  // 3 — the default matrix.
  if (!route) route = DEFAULTS[key] || { provider: 'anthropic', model: HAIKU };

  const val = enforceAllowSet(surface, guardKeys({ ...route }));
  cache.set(key, { at: Date.now(), val });
  return val;
}

// ── F-08.72's SECOND LIMB (CE-ruled) — A TEST SEAM, NAMED ────────────────────
// The 60s cache above is correct for production: a zero-deploy flip lands within
// one window and the read is cheap. It is WRONG for a two-lane bench run, where
// the second lane inherits the first lane's route until the window expires and
// its transcripts wear the other lane's name. `turnLock._reset()` is the
// estate's own precedent for this shape.
//
// ⚠ CE-41 F1 — THIS COMMENT ONCE ENDED "Production never calls it." IT NO LONGER
// CAN. The founder's panel writes a row and must not make him wait out a window
// to see his own switch land, so production DOES bust the cache now — through
// `bustRouteCache` below, which is a named seam with a named caller, NOT this
// one. `_resetRouteCache` stays exactly what it was: the bench's whole-map
// clear. The sentence is amended in the same breath as the seam that falsified
// it, because a file carrying a sentence its neighbour disproves is how F-06.85
// gets earned twice.
function _resetRouteCache() { cache.clear(); }

// ── CE-41 F1 — THE PRODUCTION BUST, AND WHY IT CASCADES ─────────────────────
// Called by `src/api/admin/modelRoutes.js` the moment a row is written.
//
// THE CASCADE IS NOT TIDINESS. A `wa_vendor` lane with no row of its own caches
// its TWIN'S value under its OWN key (step 2b). Bust only the key the founder
// wrote and the WhatsApp lane keeps serving the pre-flip answer for up to a
// window while the panel shows the new one — the glass and the wire disagreeing,
// which is R-39.15's whole subject. So writing `model.pwa_vendor.essential` also
// drops every lane that borrows from `pwa_vendor` at that tier. Derived from the
// registry, never a hand-kept list.
//
// IN-PROCESS, AND HONEST ABOUT IT. This clears THIS process's map. A second
// Railway instance keeps its own until its window expires, so the founder's
// switch is true "within 60 seconds" and never "instantly", and the panel says
// so in those words.
function bustRouteCache(key) {
  if (!key) { cache.clear(); return; }
  cache.delete(key);
  const lane = LANE_BY_KEY.get(key);
  if (!lane) return;
  for (const dep of LANES) {
    if (dep.fallback_surface === lane.surface && dep.tier === lane.tier) cache.delete(dep.key);
  }
}

module.exports = {
  resolveModel, DEFAULTS, SURFACE_ALLOW, _resetRouteCache,
  // CE-41 F1 (R-41.85): the panel's three constants and the two seams. The door
  // holds no key list, no provider list and no model string of its own.
  SWITCHABLE, LANES, LANE_BY_KEY, fallbackSurfaceFor, bustRouteCache, CACHE_MS, HAIKU,
  // CE-41 seat G (R-41.104): the ONE home of the WhatsApp lane's room. Read by
  // the route (`buildLlmForTurn`) and by the door that hands the engine its room
  // (`vendorInbound.js`, both `runTurn` sites). No third reader.
  waLaneMode,
  // CE-41 seat G · G2 (R-41.107): the room's resolution, read by the ROUTE here
  // and mirrored by the ROOM at `loop.ts:299`. b65 §8 drives both and asserts
  // they agree; the mirror is declared, never assumed.
  resolveVendorRoom,
};
