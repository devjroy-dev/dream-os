// src/api/admin/modelRoutes.js — THE MODEL ROUTES DOOR. CE-41 seat F, R-41.85.
//
//   GET  /api/v2/admin/model_routes          every lane the router knows: its live row,
//                                            its code default, whether they differ, and
//                                            what the router would actually return today
//   POST /api/v2/admin/model_routes/:key     { role, provider, model? } → the founder's tap
//
// WHY THIS DOOR EXISTS. Every model lane in the estate is already a row in
// `admin_config`, read by `src/lib/modelRouter.js` with a 60-second cache, and the
// seed rows win over the code matrix by design. There has never been a surface that
// lets the founder SEE them, let alone move one: today it is raw JSON on the Config
// page, and the Config page's PATCH cannot even create a key. He should be able to
// choose who answers — Victor's hand, Donna's hand, Mira's nudge — per lane, from a
// phone, with no shell and no deploy. That is this door.
//
// ── THE FOUR LAWS THIS DOOR IS BUILT ON ─────────────────────────────────────
//
// 1 · IT HOLDS NO LIST OF ITS OWN. Keys, roles, providers, models and the fallback
//     geometry all come from `modelRouter.js` — `LANES`, `SWITCHABLE`. A door with
//     its own copy of the lane names is a second home for the routing map, and the
//     day they disagree the glass lies about the wire.
//
// 2 · READ-MERGE-WRITE, NEVER REPLACE (chair's ruling 2). A row carries more than
//     the role being moved: `model.wa_marketing.default` carries the nudge split,
//     every `pwa_vendor` row carries Donna's. `MAYA_MODEL_FLIP_FORMS.sql` Form A is
//     the standing counter-example — it sets the whole value and drops the sibling
//     split on the floor. Unknown fields are carried through UNTOUCHED, because a
//     field this door does not understand is a field it has no business deleting.
//
// 3 · AN ABSENT ROW IS SEEDED FROM WHAT IS LIVE, NOT FROM THE ROLE ALONE. Two
//     lanes have no row at all (`model.pwa_vendor.basic` — F0 §4 — and every
//     `wa_vendor` lane before its seed). Write only the tapped role into a fresh
//     row and you get `{donna_provider, donna_model}` with NO `provider`, which
//     `parseRoute` rejects wholesale (it requires provider AND model) — so the row
//     would be created, the panel would show it, and the router would ignore it and
//     keep serving the default. A switch that appears to work and changes nothing
//     is the worst outcome available here. So: resolve the lane FIRST, write the
//     effective route as the base, then apply the founder's role on top.
//
// 4 · NO FREE TEXT REACHES A ROW. `provider` must be a key of `SWITCHABLE` and
//     `model`, if sent at all, must equal that provider's model exactly. The glass
//     cannot put Sonnet on a customer wire, which is the guarantee F-05.32 bought
//     and F-08.84 spent a whole finding keeping.
//
// ── WHAT THIS DOOR DOES NOT DO ──────────────────────────────────────────────
// It does not change any lane's live value on its own account, ever. The founder
// switches; this builds the switch. It writes nothing at GET. It touches no key
// outside `LANES`, so it cannot mint `model.anything.anything`.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
// R-41.88 — the actor fingerprint has ONE home and it is the switchboard's door,
// which has written it since C1. Imported, never re-implemented: a second copy of
// a hash is two homes for one identity, and the day they drift the two admin logs
// stop being joinable. `capabilities.js` exports it for this call (c-41.10).
const { whoFlipped } = require('./capabilities');
const {
  LANES, LANE_BY_KEY, SWITCHABLE, DEFAULTS, CACHE_MS,
  resolveModel, fallbackSurfaceFor, bustRouteCache,
} = require('../../lib/modelRouter');
// CE-41 F1b — the bride app lane's value lives in the environment, and its two
// readers are IMPORTED rather than re-derived: `resolveBrideProvider` already
// handles unset, empty, unknown and case, and `wireModelFor` takes the model
// string off `CONF` rather than restating it. A second copy of either here would
// be a second answer to "what is the bride lane on", and the panel would show one
// while the lane ran the other.
const { resolveBrideProvider, wireModelFor, ENV_VAR: BRIDE_ENV } = require('../../lib/brideLlmClient');

const TABLE = 'admin_config';

// The role → field-pair map. `provider` writes the route's own two fields; the two
// splits write theirs. One place, so the merge and the diff cannot disagree about
// what a role IS.
const ROLE_FIELDS = Object.freeze({
  provider: ['provider', 'model'],
  donna:    ['donna_provider', 'donna_model'],
  nudge:    ['nudge_provider', 'nudge_model'],
  listener: ['listener_provider', 'listener_model'], // CE-44 LC-Victor P2 (R-44.14)
});

function parseValue(text) {
  try { const v = JSON.parse(String(text)); return (v && typeof v === 'object') ? v : null; }
  catch (_e) { return null; }
}

// What the code matrix says for this lane, or null. `wa_vendor` and
// `pwa_vendor.basic` have no entry — that ABSENCE is a fact the panel shows, not a
// hole it fills (F0 §4: the basic lane resolves on a bare literal and nothing has
// ever said so out loud).
function codeDefaultFor(key) { return DEFAULTS[key] || null; }

// Every field the two sides disagree on, by name. Not a boolean: the founder should
// see WHICH field drifted, because the answer "a row I could delete would move
// Victor to another provider" is a different sentence from "a row I could delete
// would drop Donna's split". Both are live today (F0 §2a).
function driftFields(live, code) {
  if (!live) return [];
  if (!code) return ['(no code default — this lane resolves on the router\'s literal)'];
  const names = new Set([...Object.keys(live), ...Object.keys(code)]
    .filter((k) => /^(provider|model|donna_provider|donna_model|nudge_provider|nudge_model|listener_provider|listener_model)$/.test(k)));
  return [...names].filter((k) => live[k] !== code[k]).sort();
}

// Fields on a live row this door did not put there and does not understand. Ruling
// 4: shown read-only, never silently dropped by the merge, and named here so the
// chair can file one if it ever appears. (None on any live row at F1's cut.)
function unknownFields(live) {
  if (!live) return [];
  // F-41.93: the per-role stamps join the known set. The row-level pair stays known
  // too — rows written before F1b carry it and must not start reading as junk.
  return Object.keys(live).filter((k) => !/^(provider|model|donna_provider|donna_model|nudge_provider|nudge_model|changed_by|changed_at|changed_(by|at)_(provider|donna|nudge))$/.test(k))
    // CE-44 LC-Victor P2: the listener's two fields and its stamps are known fields too. A separate
    // filter, so the line above stays byte-for-byte what b63's M24 mutates.
    .filter((k) => !/^(listener_provider|listener_model|changed_(by|at)_listener)$/.test(k)).sort();
}

// ── c-41.53 (seat F, self-caught) — THE BRIDE LANE'S BLANK MODEL ────────────
// `wireModelFor` takes the wire string off `CONF`, which is right, and `CONF` is
// ASYMMETRIC: `deepseek.model` is `(m) => m || 'deepseek-v4-flash'` and answers,
// while `anthropic.model` is `(m) => m` and answers the EMPTY STRING when called
// with '' — which is how the bride client calls it. So the read door would have
// served this lane as `{provider: 'anthropic', model: ''}`: the provider true, the
// model blank.
//
// IT WOULD NEVER HAVE BEEN SEEN. The panel renders providers, not models, so the
// blank never reaches the glass, and no cell asked the question because the
// provider — the thing the founder switches — was correct. That is precisely the
// shape of a value that rots quietly: true where anyone looks, empty where nobody
// does. Caught while benching §11, cured here, and given its own cell so the
// asymmetry cannot come back through the same door.
//
// THE FALLBACK NAMES NO PROVIDER AND NO MODEL. A first cut wrote
// `provider === 'anthropic' ? HAIKU : null` and the one-home cell refused it,
// correctly: a provider literal in this door is the first brick of a second
// routing map. `SWITCHABLE` already maps every provider this estate offers to its
// canonical wire string and is built from the router's own classes, so the
// fallback is a LOOKUP rather than a branch — and it answers for any provider the
// set gains tomorrow without this line being touched.
function brideWireModel(provider) {
  return wireModelFor(provider) || SWITCHABLE[provider] || null;
}

// F-41.93 — what each role's own stamp says, or nothing. Read as a map rather than
// six flat fields so the panel loops roles instead of naming them one at a time.
function rolesChanged(live) {
  const out = {};
  if (!live) return out;
  for (const role of Object.keys(ROLE_FIELDS)) {
    const at = live[`changed_at_${role}`] || null;
    const by = live[`changed_by_${role}`] || null;
    if (at || by) out[role] = { at, by };
  }
  return out;
}

// A live value the panel cannot express as one of its two switches. Rendered
// read-only with its real words rather than re-labelled (see SWITCHABLE's comment).
function outsideSwitchable(live) {
  if (!live) return [];
  const out = [];
  for (const [role, [pf, mf]] of Object.entries(ROLE_FIELDS)) {
    const p = live[pf];
    if (p == null) continue;
    if (!SWITCHABLE[p] || (live[mf] != null && live[mf] !== SWITCHABLE[p])) out.push(role);
  }
  return out;
}

// GET / — the whole board.
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const keys = LANES.map((l) => l.key);

  const { data, error } = await supabase
    .from(TABLE).select('key, value, updated_at').in('key', keys);
  if (error) return errRes(res, 500, error.message);
  const rows = new Map((data || []).map((r) => [r.key, r]));

  // THE FORCE SWITCH OVERRIDES EVERY LANE AND EVERY SWITCH ON THIS PANEL. If it is
  // set, the founder's taps still write rows and those rows still do nothing, so
  // the panel says so at the top rather than letting him flip in the dark.
  const forced = String(process.env.LLM_PROVIDER || '').trim() || null;

  const lanes = [];
  for (const lane of LANES) {
    // ── THE ENV LANE (F1b) ────────────────────────────────────────────────────
    // No row, no router call, no switch. Its value is derived by the bride client's
    // own resolver so the panel cannot disagree with the lane, and its provenance is
    // `server` — a fifth word beside default · borrowed · seeded · changed, and the
    // only one that answers "where did this come from" with somewhere that is not a
    // row at all.
    if (lane.env) {
      const provider = resolveBrideProvider(process.env);
      lanes.push({
        key: lane.key, surface: lane.surface, tier: lane.tier,
        roles: lane.roles, reachable: true,
        unreachable_because: null, read_only_because: lane.read_only_because || null,
        env: lane.env, env_set: !!String(process.env[lane.env] || '').trim(),
        fallback_surface: null, has_row: false, live: null, code_default: null,
        effective: { provider, model: brideWireModel(provider) },
        borrowed: false, provenance: 'server',
        differs: [], unknown_fields: [], outside_switchable: [],
        changed_by: null, changed_at: null, roles_changed: {}, updated_at: null,
      });
      continue;
    }
    const row  = rows.get(lane.key) || null;
    const live = row ? parseValue(row.value) : null;
    const code = codeDefaultFor(lane.key);
    // The router's own answer, asked the way the wire asks it — including the
    // F-41.46 fallback, the allow-set and the keyless-provider guards. This is the
    // only cell on the panel that is a WITNESS rather than a reading: it is what
    // the next turn on that lane will actually use.
    const effective = await resolveModel(supabase, lane.surface, lane.tier,
      { fallbackSurface: fallbackSurfaceFor(lane.surface, lane.tier) });
    lanes.push({
      key: lane.key, surface: lane.surface, tier: lane.tier,
      roles: lane.roles, reachable: lane.reachable !== false,
      unreachable_because: lane.unreachable_because || null,
      fallback_surface: lane.fallback_surface || null,
      // `has_row: false` with a live-looking `effective` is the F0 §4 case and it
      // is the single most important thing this panel says.
      has_row: !!row, live, code_default: code, effective,
      borrowed: !!(lane.fallback_surface && !row),
      differs: driftFields(live, code),
      unknown_fields: unknownFields(live),
      outside_switchable: outsideSwitchable(live),
      // F-41.93 — PER-ROLE STAMPS. The row-level pair said only that SOMETHING on
      // this row moved, and the panel rendered it beside every hand: flipping Donna
      // made Victor's line read `changed 9 Sept` too, attributing an edit to a hand
      // that had not moved. Each role now carries its own, and the row-level pair is
      // still served so rows written before F1b keep whatever truth they have.
      changed_by: (live && live.changed_by) || null,
      changed_at: (live && live.changed_at) || null,
      roles_changed: rolesChanged(live),
      provenance: null,   // the panel derives it; only the env lane is served one
      read_only_because: null, env: null, env_set: false,
      updated_at: row ? row.updated_at : null,
    });
  }

  return okRes(res, {
    lanes,
    switchable: SWITCHABLE,
    roles: Object.keys(ROLE_FIELDS),
    forced,
    // The panel says "within 60 seconds", in words, because that is the truth: the
    // bust below clears THIS process's map and a second instance keeps its own.
    cache_ms: CACHE_MS,
  });
}));

// POST /:key — one role, one lane, one tap.
router.post('/:key', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { key }  = req.params;
  const body     = req.body || {};

  const lane = LANE_BY_KEY.get(key);
  if (!lane) return errRes(res, 400, 'not a model-route key.');
  if (lane.reachable === false) {
    return errRes(res, 409, `this row is not reachable by any lane — ${lane.unreachable_because}`);
  }
  // The env lane holds no row to merge into and no role to move. Refused with the
  // reason on the wire, so the glass can say it in the founder's words.
  if (lane.env) return errRes(res, 409, lane.read_only_because || `this lane is set on the server (${lane.env}).`);
  const role = String(body.role || '');
  if (!ROLE_FIELDS[role]) return errRes(res, 400, 'role must be one of: ' + Object.keys(ROLE_FIELDS).join(', '));
  if (!lane.roles.includes(role)) return errRes(res, 400, `this lane has no ${role} role.`);

  const provider = String(body.provider || '');
  if (!SWITCHABLE[provider]) return errRes(res, 400, 'provider is not switchable from here.');
  // `model` is optional and, when sent, must match. It is accepted at all only so
  // the glass can be explicit about what it thinks it is asking for; it can never
  // introduce a string of its own.
  if (body.model != null && String(body.model) !== SWITCHABLE[provider]) {
    return errRes(res, 400, 'model does not match that provider — no free-text models from the glass.');
  }
  const model = SWITCHABLE[provider];

  const { data: existing, error: readErr } = await supabase
    .from(TABLE).select('key, value').eq('key', key).maybeSingle();
  if (readErr) return errRes(res, 500, readErr.message);

  // LAW 3 — the base. An existing row is merged into; an absent one is BORN from
  // what the lane resolves to right now, so the row that lands is complete and the
  // only thing that moved is the role the founder tapped.
  let base = existing ? parseValue(existing.value) : null;
  let seeded_from = 'row';
  if (!base) {
    const effective = await resolveModel(supabase, lane.surface, lane.tier,
      { fallbackSurface: fallbackSurfaceFor(lane.surface, lane.tier) });
    base = {};
    for (const f of ['provider', 'model', 'donna_provider', 'donna_model', 'nudge_provider', 'nudge_model']) {
      if (effective[f] != null) base[f] = effective[f];
    }
    seeded_from = existing ? 'unparseable_row' : (lane.fallback_surface ? 'borrowed_route' : 'effective_route');
  }

  const [pField, mField] = ROLE_FIELDS[role];
  const next = { ...base, [pField]: provider, [mField]: model };
  // ── R-41.88 — WHO MOVED IT, AND WHEN ──────────────────────────────────────
  // The admin session carries no user identity (one founder, one secret), so the
  // row records the same `admin:<8 hex>` fingerprint the switchboard writes — two
  // sessions tellable apart without a token ever touching a row. `admin_config`
  // has no columns for either stamp (four columns: key, value, description,
  // updated_at — PUBLIC_SCHEMA.md:43-49), so both ride inside the value JSON,
  // which is charter (c)'s own instruction. Nothing reads them but the panel.
  // F-41.93 — the stamp belongs to the ROLE that moved, not to the row. The
  // row-level pair is written too, because it is what pre-F1b rows carry and the
  // read door still serves it as a fallback; the per-role pair is what the panel
  // renders beside each hand.
  const stampedAt = new Date().toISOString();
  const stampedBy = whoFlipped(req);
  next.changed_at = stampedAt;
  next.changed_by = stampedBy;
  next[`changed_at_${role}`] = stampedAt;
  next[`changed_by_${role}`] = stampedBy;

  const payload = JSON.stringify(next);
  const now = new Date().toISOString();
  let wrote;
  if (existing) {
    const { data, error } = await supabase.from(TABLE)
      .update({ value: payload, updated_at: now }).eq('key', key)
      .select('key, value, updated_at').single();
    if (error) return errRes(res, 500, error.message);
    wrote = data;
  } else {
    const { data, error } = await supabase.from(TABLE)
      .insert({
        key, value: payload, updated_at: now,
        description: `Model route for ${lane.surface} · ${lane.tier}. Written by the model-routes panel (CE-41 R-41.85).`,
      })
      .select('key, value, updated_at').single();
    if (error) return errRes(res, 500, error.message);
    wrote = data;
  }

  // The founder must not have to wait out a window to see his own switch land on
  // the lane he is walking. Cascades to every lane borrowing this one (F-41.46).
  bustRouteCache(key);

  // Read the route back THROUGH THE ROUTER rather than echoing what we wrote: if a
  // guard refused the value — a keyless provider, an out-of-set model — the panel
  // must show what the wire will do, not what the glass hoped. R-39.15 in an API.
  const effective = await resolveModel(supabase, lane.surface, lane.tier,
    { fallbackSurface: fallbackSurfaceFor(lane.surface, lane.tier) });

  return okRes(res, {
    key, role, seeded_from, created: !existing,
    value: parseValue(wrote.value), updated_at: wrote.updated_at,
    roles_changed: rolesChanged(parseValue(wrote.value)),
    effective,
    forced: String(process.env.LLM_PROVIDER || '').trim() || null,
  });
}));

module.exports = router;
