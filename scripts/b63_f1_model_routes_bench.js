#!/usr/bin/env node
// scripts/b63_f1_model_routes_bench.js — CE-41 · SEAT F · F1 (`0153`).
//
// F-41.46 the borrowed lane, benched WITH and WITHOUT a `wa_vendor` row ·
// R-41.85 the two doors · R-41.87 the success-path line · the lane registry ·
// the switchable set built from the classes rather than transcribed.
//
// BOTH WAYS: at origin's tree §1–§7 RED (no fallback, no registry, no door, no
// log line); cured, all GREEN. `b63_mutations.js` edits PRODUCTION code in a
// scratch copy; each mutation must RED its named cell (F-40.216).
//
// THE CELLS THAT MATTER MOST are §2 and §5. §2 drives the exact defect that
// makes F-41.46 dangerous rather than merely absent: a `wa_vendor` miss that
// falls to the DEFAULT matrix silently retires DeepSeek from the essential lane
// and Donna's split from all four, on the WhatsApp wire. §5 drives the other
// one: a first tap on a lane with no row writing ONLY the tapped role, producing
// a row `parseRoute` rejects — a switch that looks like it worked and moved
// nothing.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.B63_ROOT ? path.resolve(process.env.B63_ROOT) : path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// R-40.105 — an absence cell reads comment-stripped code. Every §6/§7 assertion
// below that says a token is or is not in a file reads THIS, never the raw text:
// this packet's comments are long and name the very things they cure.
const codeOf = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const req = (rel) => require(path.join(ROOT, rel));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ── PRECONDITION, NAMED (F-38.34's law one lane over) ───────────────────────
// `guardKeys` DROPS a split whose provider has no key in the environment, loudly
// and correctly. A bench run without these set therefore reads every donna and
// nudge split as absent and would convict this packet of losing them — a defect
// costume worn by an empty env. Set here, at the top, where it can be seen.
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'bench-key';
process.env.DEEPSEEK_API_KEY  = process.env.DEEPSEEK_API_KEY  || 'bench-key';
process.env.ZAI_API_KEY       = process.env.ZAI_API_KEY       || 'bench-key';
// `chat.js` builds its supabase client at require time; the driven R-41.87 cells
// import it. These two are never dialled — the bench hands every call its own double.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-key';

let pass = 0, fail = 0; const fails = [];
const sec = (t) => console.log(`\n${t}`);
function ok(name, cond, why) { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; fails.push(name); console.log(`  FAIL ${name}${why ? ' — ' + why : ''}`); } }
async function cell(name, fn) { try { const r = await fn(); r === true ? ok(name, true) : ok(name, false, typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { ok(name, false, (e && e.message) || String(e)); } }

// ── THE DOUBLE — admin_config, and a LOG of every key it was asked for ───────
// The read log is the instrument for "a cell only sees what it looks at": the
// claim "with a row of its own the WhatsApp lane does not consult its twin" is
// only provable by watching which keys were read.
function makeDb(rows = {}) {
  const t = { admin_config: Object.entries(rows).map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value), updated_at: '2026-09-08T00:00:00.000Z' })) };
  const reads = [];
  function from(table) {
    if (!t[table]) t[table] = [];
    const st = { f: [], inList: null, patch: null, ins: null };
    const rows2 = () => t[table].filter(r => st.f.every(([c, v]) => r[c] === v) && (!st.inList || st.inList[1].includes(r[st.inList[0]])));
    const api = {
      select() { return api; }, order() { return api; }, limit() { return api; },
      eq(c, v) { st.f.push([c, v]); if (c === 'key') reads.push(v); return api; },
      in(c, vs) { st.inList = [c, vs]; for (const v of vs) reads.push(v); return api; },
      insert(row) { st.ins = row; return api; },
      update(p) { st.patch = p; return api; },
      async maybeSingle() { return { data: rows2()[0] || null, error: null }; },
      async single() {
        if (st.ins) { t[table].push({ ...st.ins }); return { data: { ...st.ins }, error: null }; }
        if (st.patch) { const r = rows2()[0]; if (!r) return { data: null, error: { message: 'no row' } }; Object.assign(r, st.patch); return { data: { ...r }, error: null }; }
        return { data: rows2()[0] || null, error: null };
      },
      then(res) { return Promise.resolve({ data: rows2(), error: null }).then(res); },
    };
    return api;
  }
  return { from, t, reads };
}

// A minimal express-free driver for the door's two handlers.
//
// IT RESOLVES ON `res.json`, NOT ON THE HANDLER'S RETURN. `asyncHandler` runs the
// route body and swallows its promise (it returns undefined and routes rejections
// to `next`), so awaiting the handler returns BEFORE the door has answered — the
// first draft of this bench read every door cell as a null payload and would have
// convicted a working door. The deferred below is the fix and this note is why.
function driveDoor(routerModule, method, urlKey, body, db) {
  const layer = routerModule.stack.find(l => l.route && l.route.path === (urlKey ? '/:key' : '/') && l.route.methods[method]);
  if (!layer) throw new Error(`no ${method} handler for ${urlKey ? '/:key' : '/'}`);
  const handlers = layer.route.stack.map(s => s.handle);
  const handler = handlers[handlers.length - 1];
  const req2 = { app: { locals: { supabase: db } }, params: urlKey ? { key: urlKey } : {}, body: body || {}, headers: {} };
  return new Promise((resolve, reject) => {
    let status = 200;
    const timer = setTimeout(() => reject(new Error('the door never answered')), 5000);
    const res2 = {
      status(s) { status = s; return res2; },
      json(p) { clearTimeout(timer); resolve({ status, payload: p }); return res2; },
    };
    try { handler(req2, res2, (e) => { clearTimeout(timer); reject(e || new Error('next() with no error')); }); }
    catch (e) { clearTimeout(timer); reject(e); }
  });
}

function capture() {
  const lines = []; const o = console.log, w = console.warn;
  console.log = (...a) => lines.push(a.join(' ')); console.warn = (...a) => lines.push(a.join(' '));
  return { done() { console.log = o; console.warn = w; return lines; } };
}

const LIVE_ESSENTIAL = { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', donna_provider: 'deepseek', donna_model: 'deepseek-v4-flash' };
const LIVE_MARKETING = { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', nudge_provider: 'deepseek', nudge_model: 'deepseek-v4-flash' };

(async () => {

  // ═════ §1 · THE REGISTRY ══════════════════════════════════════════════════
  sec('§1 the lane registry — the door\'s only source of keys');
  // ONE MODULE INSTANCE, DELIBERATELY. An earlier draft re-required the router
  // per cell with the require cache cleared, which handed the bench a DIFFERENT
  // `cache` Map from the one the door holds — so "the write busts the cache" went
  // red against a door that busts it correctly. A bench that cannot see the seam
  // it is judging is F-38.27's shape. State is reset by `_resetRouteCache`, which
  // is what that seam is for.
  const mr = () => req('src/lib/modelRouter.js');

  await cell('LANES exists and carries both vendor surfaces', () => {
    const { LANES } = mr();
    const s = new Set(LANES.map(l => l.surface));
    return ['pwa_vendor', 'wa_vendor', 'wa_marketing', 'wa_couple', 'harvest'].every(x => s.has(x)) || [...s].join(',');
  });

  await cell('the vendor tiers are DERIVED from CANON_TIERS, not transcribed (R-40.94)', () => {
    const { LANES } = mr();
    const { CANON_TIERS } = req('src/lib/billing/tierFlip.js');
    const tiers = LANES.filter(l => l.surface === 'pwa_vendor' && l.reachable !== false).map(l => l.tier).sort();
    const want = [...CANON_TIERS, 'advisor'].sort();
    // BOTH LIMBS, because today the two lists are EQUAL and a result-only cell
    // would stay green over a transcription — vacuous until the day a fifth tier
    // is added, which is precisely the day 0115 taught us this goes wrong.
    const derived = /\[\.\.\.CANON_TIERS, 'advisor'\]/.test(codeOf('src/lib/modelRouter.js'));
    return JSON.stringify(tiers) === JSON.stringify(want) && derived
      ? true : `${tiers} vs ${want}${derived ? '' : ' — and the list is transcribed, not derived'}`;
  });

  await cell('the basic tier IS a lane (F0 §4 — it was in neither the matrix nor the db)', () => {
    const { LANE_BY_KEY, DEFAULTS } = mr();
    const lane = LANE_BY_KEY.get('model.pwa_vendor.basic');
    return !!lane && lane.reachable === true && DEFAULTS['model.pwa_vendor.basic'] === undefined
      ? true : 'the basic lane is missing, or the matrix silently grew an entry for it';
  });

  await cell('the trial row is carried UNREACHABLE with its reason (F0 §5)', () => {
    const { LANE_BY_KEY } = mr();
    const lane = LANE_BY_KEY.get('model.pwa_vendor.trial');
    return !!lane && lane.reachable === false && lane.roles.length === 0 && /vendors_tier_check/.test(lane.unreachable_because || '')
      ? true : JSON.stringify(lane);
  });

  await cell('every wa_vendor lane declares its fallback; no other lane does', () => {
    const { LANES } = mr();
    const withFb = LANES.filter(l => l.fallback_surface);
    return withFb.length > 0 && withFb.every(l => l.surface === 'wa_vendor' && l.fallback_surface === 'pwa_vendor')
      ? true : withFb.map(l => l.key).join(',');
  });

  await cell('fallbackSurfaceFor is the ONE home of the borrowing fact', () => {
    const { fallbackSurfaceFor } = mr();
    return fallbackSurfaceFor('wa_vendor', 'essential') === 'pwa_vendor'
      && fallbackSurfaceFor('pwa_vendor', 'essential') === null
      && fallbackSurfaceFor('harvest', 'default') === null ? true : 'wrong fallback geometry';
  });

  // ═════ §2 · THE FALLBACK, BOTH WAYS ═══════════════════════════════════════
  sec('§2 F-41.46 — the borrowed lane, with and without a row');

  await cell('WITHOUT a wa_vendor row: the WhatsApp lane resolves to its twin, SPLIT AND ALL', async () => {
    const { resolveModel, _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const got = await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    return got.provider === 'anthropic' && got.model === 'claude-haiku-4-5-20251001'
      && got.donna_provider === 'deepseek' && got.donna_model === 'deepseek-v4-flash'
      ? true : JSON.stringify(got);
  });

  await cell('THE TRAP: a wa_vendor miss must NOT land on the default matrix or the literal', async () => {
    const { resolveModel, _resetRouteCache, DEFAULTS } = mr(); _resetRouteCache();
    // The essential DEFAULT is deepseek and the LIVE row is anthropic+split. If the
    // miss fell through to step 3 this returns deepseek with no split — which is
    // exactly the silent retirement F-41.46's cure exists to prevent.
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const got = await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    return got.provider !== DEFAULTS['model.pwa_vendor.essential'].provider || got.donna_provider === 'deepseek'
      ? (got.donna_provider === 'deepseek' ? true : 'the split was lost') : 'fell through to DEFAULTS';
  });

  await cell('WITH a wa_vendor row: that row wins and the twin is NOT consulted', async () => {
    const { resolveModel, _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({
      'model.pwa_vendor.essential': LIVE_ESSENTIAL,
      'model.wa_vendor.essential': { provider: 'deepseek', model: 'deepseek-v4-flash' },
    });
    const got = await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    const readTwin = db.reads.includes('model.pwa_vendor.essential');
    return got.provider === 'deepseek' && !got.donna_provider && !readTwin
      ? true : JSON.stringify({ got, reads: db.reads });
  });

  await cell('the borrowed value caches under the PRIMARY key, so a later seed lands', async () => {
    const { resolveModel, _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    const before = db.reads.length;
    await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    return db.reads.length === before ? true : 'the second call re-read — the primary key is not cached';
  });

  await cell('bustRouteCache CASCADES: writing the twin drops the borrower too', async () => {
    const { resolveModel, _resetRouteCache, bustRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    db.t.admin_config.find(r => r.key === 'model.pwa_vendor.essential').value = JSON.stringify({ provider: 'deepseek', model: 'deepseek-v4-flash' });
    bustRouteCache('model.pwa_vendor.essential');
    const got = await resolveModel(db, 'wa_vendor', 'essential', { fallbackSurface: 'pwa_vendor' });
    return got.provider === 'deepseek' ? true : 'the borrower served a stale twin after the twin was written';
  });

  await cell('a self-referential fallback cannot recurse', async () => {
    const { resolveModel, _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({});
    const got = await resolveModel(db, 'harvest', 'default', { fallbackSurface: 'harvest' });
    return got && got.provider ? true : 'no route';
  });

  // ═════ §3 · THE SWITCHABLE SET ════════════════════════════════════════════
  sec('§3 the two providers — one constant, no minted string');

  await cell('SWITCHABLE is built FROM the F-08.84 classes (no transcription)', () => {
    const src = codeOf('src/lib/modelRouter.js');
    const { SWITCHABLE } = mr();
    const derived = /SWITCHABLE\s*=\s*Object\.freeze\(\{[^}]*HAIKU_CLASS\[0\][^}]*DEEPSEEK_CLASS\[0\][^}]*\}\)/s.test(src);
    return derived && SWITCHABLE.anthropic === 'claude-haiku-4-5-20251001' && SWITCHABLE.deepseek === 'deepseek-v4-flash'
      ? true : 'SWITCHABLE holds its own copies of the model strings';
  });

  await cell('glm is in no switchable set (it is in no live path)', () => {
    const { SWITCHABLE } = mr();
    return SWITCHABLE.glm === undefined && Object.keys(SWITCHABLE).length === 2 ? true : Object.keys(SWITCHABLE).join(',');
  });

  // ═════ §4 · THE READ DOOR ═════════════════════════════════════════════════
  sec('§4 GET /api/v2/admin/model_routes');
  const doorPath = 'src/api/admin/modelRoutes.js';

  await cell('the door exists and is mounted beside the switchboard\'s', () => {
    if (!exists(doorPath)) return 'no door file';
    const r = codeOf('src/api/router.js');
    return /admin\/model_routes'[^\n]*require\('\.\/admin\/modelRoutes'\)/.test(r) ? true : 'not mounted';
  });

  await cell('every lane comes back, with live / code_default / effective / differs', async () => {
    const { _resetRouteCache, LANES } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL, 'model.wa_marketing.default': LIVE_MARKETING });
    const { status, payload } = await driveDoor(req(doorPath), 'get', null, null, db);
    if (status !== 200) return `status ${status}`;
    const byKey = new Map(payload.lanes.map(l => [l.key, l]));
    const ess = byKey.get('model.pwa_vendor.essential');
    return payload.lanes.length === LANES.length
      && ess.has_row === true && ess.live.donna_provider === 'deepseek'
      && ess.code_default.provider === 'deepseek'
      && ess.differs.includes('provider') && ess.differs.includes('donna_provider')
      && payload.switchable.anthropic === 'claude-haiku-4-5-20251001'
      ? true : JSON.stringify({ n: payload.lanes.length, ess });
  });

  await cell('the basic lane is SHOWN with no row and a live effective route (F0 §4)', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const { payload } = await driveDoor(req(doorPath), 'get', null, null, db);
    const basic = payload.lanes.find(l => l.key === 'model.pwa_vendor.basic');
    return basic && basic.has_row === false && basic.code_default === null
      && basic.effective.provider === 'anthropic' && basic.effective.donna_provider === undefined
      ? true : JSON.stringify(basic);
  });

  await cell('a borrowed wa_vendor lane says so', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const { payload } = await driveDoor(req(doorPath), 'get', null, null, db);
    const wa = payload.lanes.find(l => l.key === 'model.wa_vendor.essential');
    return wa && wa.borrowed === true && wa.fallback_surface === 'pwa_vendor'
      && wa.effective.donna_provider === 'deepseek' ? true : JSON.stringify(wa);
  });

  await cell('LLM_PROVIDER comes back as a banner when set', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const prev = process.env.LLM_PROVIDER; process.env.LLM_PROVIDER = 'deepseek';
    try {
      const { payload } = await driveDoor(req(doorPath), 'get', null, null, makeDb({}));
      return payload.forced === 'deepseek' ? true : `forced=${payload.forced}`;
    } finally { if (prev === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = prev; _resetRouteCache(); }
  });

  // ═════ §5 · THE WRITE DOOR ════════════════════════════════════════════════
  sec('§5 POST /api/v2/admin/model_routes/:key');

  await cell('a donna flip PRESERVES Victor and every other field (ruling 2)', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const { status, payload } = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    return status === 200 && payload.value.donna_provider === 'anthropic'
      && payload.value.donna_model === 'claude-haiku-4-5-20251001'
      && payload.value.provider === 'anthropic' && payload.value.model === 'claude-haiku-4-5-20251001'
      ? true : JSON.stringify({ status, v: payload && payload.value });
  });

  await cell('a provider flip PRESERVES the nudge split (Form A\'s defect, refused)', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.wa_marketing.default': LIVE_MARKETING });
    const { payload } = await driveDoor(req(doorPath), 'post', 'model.wa_marketing.default', { role: 'provider', provider: 'deepseek' }, db);
    return payload.value.provider === 'deepseek' && payload.value.nudge_provider === 'deepseek'
      && payload.value.nudge_model === 'deepseek-v4-flash' ? true : JSON.stringify(payload.value);
  });

  await cell('an unknown field on the row survives the merge untouched (ruling 4)', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': { ...LIVE_ESSENTIAL, escalation_model: 'claude-sonnet-4-6' } });
    const { payload } = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    return payload.value.escalation_model === 'claude-sonnet-4-6' ? true : JSON.stringify(payload.value);
  });

  await cell('THE TRAP: a first tap on a lane with NO ROW writes a COMPLETE route', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    // The basic lane has no row anywhere. Writing only {donna_provider, donna_model}
    // yields a row parseRoute REJECTS (it requires provider AND model) — the switch
    // would appear to work and change nothing.
    const db = makeDb({});
    const { payload } = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.basic', { role: 'donna', provider: 'deepseek' }, db);
    const { _resetRouteCache: r2, resolveModel } = mr(); r2();
    const back = await resolveModel(db, 'pwa_vendor', 'basic');
    return payload.created === true && payload.value.provider === 'anthropic' && payload.value.model
      && back.donna_provider === 'deepseek'
      ? true : JSON.stringify({ wrote: payload.value, resolved: back });
  });

  await cell('free-text models are refused', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const a = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'provider', provider: 'anthropic', model: 'claude-sonnet-4-6' }, db);
    const b = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'provider', provider: 'glm' }, db);
    return a.status === 400 && b.status === 400 ? true : `${a.status}/${b.status}`;
  });

  await cell('an unknown key, an unreachable row and a role the lane lacks are all refused', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({});
    const a = await driveDoor(req(doorPath), 'post', 'model.anything.default', { role: 'provider', provider: 'anthropic' }, db);
    const b = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.trial', { role: 'provider', provider: 'anthropic' }, db);
    const c = await driveDoor(req(doorPath), 'post', 'model.wa_couple.default', { role: 'donna', provider: 'anthropic' }, db);
    return a.status === 400 && b.status === 409 && c.status === 400 ? true : `${a.status}/${b.status}/${c.status}`;
  });

  await cell('the write busts the cache — the next read is the new value, not the window', async () => {
    const { _resetRouteCache, resolveModel } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    await resolveModel(db, 'pwa_vendor', 'essential');
    await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'provider', provider: 'deepseek' }, db);
    const got = await resolveModel(db, 'pwa_vendor', 'essential');
    return got.provider === 'deepseek' ? true : 'served a stale cached route after a write';
  });

  await cell('the door holds NO key, provider or model string of its own (one home)', () => {
    const src = codeOf(doorPath);
    const bad = [];
    if (/'model\.(pwa_vendor|wa_vendor|wa_marketing|wa_couple|harvest)\./.test(src)) bad.push('a lane key literal');
    if (/claude-haiku|deepseek-v4-flash|claude-sonnet/.test(src)) bad.push('a model string');
    if (/'(anthropic|deepseek|glm)'/.test(src)) bad.push('a provider literal');
    return bad.length === 0 ? true : bad.join(' · ');
  });

  await cell('R-41.88: the actor fingerprint is IMPORTED from the switchboard, not re-implemented', () => {
    const src = codeOf(doorPath);
    const capsSrc = codeOf('src/api/admin/capabilities.js');
    const imports = /require\('\.\/capabilities'\)/.test(src) && /whoFlipped/.test(src);
    const exported = /module\.exports\.whoFlipped\s*=\s*whoFlipped;/.test(capsSrc);
    // ONE HOME: the door must not contain a hash of its own. `createHash`,
    // `sha256` and the `admin:` prefix all belong to the switchboard's copy.
    const ownHash = /createHash|sha256|'admin:/.test(src);
    return imports && exported && !ownHash
      ? true : `imports=${imports} exported=${exported} ownHash=${ownHash}`;
  });

  await cell('driven: a write stamps changed_by AND changed_at, and the GET renders them', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const { payload } = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    if (!/^admin:[0-9a-f]{8}$/.test(payload.value.changed_by || '')) return `changed_by=${payload.value.changed_by}`;
    if (!payload.value.changed_at) return 'no changed_at';
    const got = await driveDoor(req(doorPath), 'get', null, null, db);
    const lane = got.payload.lanes.find(l => l.key === 'model.pwa_vendor.essential');
    return lane.changed_by === payload.value.changed_by && lane.changed_at === payload.value.changed_at
      ? true : JSON.stringify({ lane: lane.changed_by, wrote: payload.value.changed_by });
  });

  await cell('the stamps do not disturb the router — parseRoute passes them through unread', async () => {
    const { _resetRouteCache, resolveModel } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': { ...LIVE_ESSENTIAL, changed_by: 'admin:deadbeef', changed_at: '2026-09-08T00:00:00.000Z' } });
    const got = await resolveModel(db, 'pwa_vendor', 'essential');
    return got.provider === 'anthropic' && got.donna_provider === 'deepseek' ? true : JSON.stringify(got);
  });

  // ═════ §6 · R-41.87 — THE SUCCESS PATH NAMES THE HAND ═════════════════════
  sec('§6 R-41.87 — the walk\'s witness');

  await cell('the line lives in buildLlmForTurn, ONE home, not at the three call sites', () => {
    const src = codeOf('src/api/vendor-engine/chat.js');
    const n = (src.match(/\[model\] surface=/g) || []).length;
    const inBuilder = /async function buildLlmForTurn[\s\S]{0,3000}\[model\] surface=/.test(src);
    return n === 2 && inBuilder ? true : `${n} occurrences, inBuilder=${inBuilder}`;
  });

  await cell('driven: a split route prints BOTH hands with the right providers', async () => {
    const chat = req('src/api/vendor-engine/chat.js');
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    db.schema = () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { victor_mode: 'business' } }) }) }) }) });
    const c = capture();
    await chat.buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'a1', surface: 'wa_vendor' });
    const lines = c.done();
    return lines.some(l => /\[model\] surface=wa_vendor tier=essential role=victor provider=anthropic/.test(l))
      && lines.some(l => /\[model\] surface=wa_vendor tier=essential role=donna provider=deepseek/.test(l))
      ? true : lines.filter(l => /\[model\]/.test(l)).join(' | ') || 'no [model] lines';
  });

  await cell('driven: NO donna line when she follows Victor — the absence is the record', async () => {
    const chat = req('src/api/vendor-engine/chat.js');
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({});
    db.schema = () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { victor_mode: 'business' } }) }) }) }) });
    const c = capture();
    await chat.buildLlmForTurn({ supabase: db, vendor: { tier: 'basic' }, agentId: 'a1' });
    const lines = c.done().filter(l => /\[model\]/.test(l));
    return lines.length === 1 && /role=victor/.test(lines[0]) && /tier=basic/.test(lines[0])
      ? true : lines.join(' | ');
  });

  // ═════ §7 · THE WA DOOR NAMES ITS OWN SURFACE ═════════════════════════════
  sec('§7 the WhatsApp lane');

  await cell('vendorInbound passes surface=wa_vendor to the shared builder', () => {
    const src = codeOf('src/lib/vendorInbound.js');
    return /buildLlmForTurn\(\{\s*supabase,\s*vendor,\s*agentId,\s*surface:\s*'wa_vendor'\s*\}\)/.test(src)
      ? true : 'the WA door still routes on the default surface';
  });

  await cell('the PWA door is byte-identical — it passes no surface', () => {
    const src = codeOf('src/api/vendor-engine/chat.js');
    const calls = src.match(/await buildLlmForTurn\(\{[^}]*\}\)/g) || [];
    return calls.length === 2 && calls.every(c => !/surface/.test(c)) ? true : calls.join(' | ');
  });

  await cell('the surface argument DEFAULTS to pwa_vendor (the old literal)', () => {
    // ANCHOR RE-DERIVED at CE-41 seat G · G2. This pinned the WHOLE parameter
    // list, so R-41.107 adding `roomAssert` to the signature reddened a cell whose
    // SUBJECT — the surface defaults to the old literal — is untouched and still
    // true. A cell that asserts a default should assert the default; pinning every
    // sibling parameter makes it a tripwire on unrelated growth. Correction number
    // owed; this seat's c-41.45-.49 is spent.
    const src = codeOf('src/api/vendor-engine/chat.js');
    return /async function buildLlmForTurn\(\{[^}]*surface = 'pwa_vendor'/.test(src) ? true : 'no default';
  });

  // ═════ §8 · THE MIGRATION ═════════════════════════════════════════════════
  sec('§8 0153 — the seeds');

  await cell('0153 seeds exactly the four reachable wa_vendor tiers', () => {
    const m = read('db/migrations/0153_wa_vendor_route_seed.sql');
    const keys = [...m.matchAll(/\('(model\.wa_vendor\.[a-z]+)'/g)].map(x => x[1]).sort();
    const want = ['model.wa_vendor.advisor', 'model.wa_vendor.essential', 'model.wa_vendor.prestige', 'model.wa_vendor.signature'];
    return JSON.stringify(keys) === JSON.stringify(want) ? true : keys.join(',');
  });

  await cell('the seeded values are byte copies of the founder\'s live rows', () => {
    const m = read('db/migrations/0153_wa_vendor_route_seed.sql');
    return m.includes('\'{"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}\'')
      && m.includes('\'{"provider":"deepseek","model":"deepseek-v4-flash"}\'') ? true : 'the seeds are not the live values';
  });

  await cell('it never overwrites a value the founder has since chosen', () => {
    const m = read('db/migrations/0153_wa_vendor_route_seed.sql');
    return /ON CONFLICT \(key\) DO NOTHING/.test(m) && !/DO UPDATE/.test(m) ? true : 'a re-run would clobber';
  });

  await cell('it seeds NEITHER basic NOR trial, and says why for both', () => {
    const m = read('db/migrations/0153_wa_vendor_route_seed.sql');
    return !/'model\.wa_vendor\.basic'/.test(m) && !/'model\.wa_vendor\.trial'/.test(m)
      && /vendors_tier_check/.test(m) && /LIVE[\s\S]{0,12}BEHAVIOUR CHANGE/.test(m) ? true : 'an unexplained absence';
  });

  // ═════ §9 · F1b — F-41.96, THE ANTHROPIC DONNA'S OWN WIRE ═════════════════
  sec('§9 F-41.96 — an Anthropic Donna beside a non-Anthropic Victor');

  await cell('she gets a transport OBJECT of her own, named anthropic', async () => {
    const chat = req('src/api/vendor-engine/chat.js');
    const { _resetRouteCache } = mr(); _resetRouteCache();
    // Victor deepseek, Donna anthropic — the exact state the founder walked at 04:37.
    //
    // c-41.49 (CE-41 seat G): THE FIXTURE MOVED, THE SUBJECT DID NOT. This cell
    // drove the 04:37 state through `surface: 'wa_vendor'` and reached the split
    // via the WhatsApp lane's ADVISOR tier — the route read `victor_mode`, got
    // `advisor`, missed `model.wa_vendor.advisor` and borrowed the pwa twin seeded
    // here. R-41.104 removed that path: the WhatsApp lane no longer reads the
    // column and no longer has an advisor tier, so this fixture resolved
    // `wa_vendor.essential` -> `pwa_vendor.essential` -> the DEFAULTS matrix, where
    // Victor is anthropic and there is no split at all. `donnaTransport` was absent
    // because no Donna was ever routed, NOT because F-41.96 regressed.
    //
    // The advisor room and its split still live in the APP, which is where the
    // founder walked them and where R-41.104 §4(d) leaves them. Driven on
    // `pwa_vendor`, this is the same state, the same row, the same assertion.
    // F-41.96's subject is byte-untouched by seat G — verified by reverting seat
    // G's three chat.js edits in a scratch tree: this cell greens on `pwa_vendor`
    // at both trees, and the sibling cell below (essential tier, business room)
    // never depended on the advisor lane and is untouched.
    const db = makeDb({ 'model.pwa_vendor.advisor': { provider: 'deepseek', model: 'deepseek-v4-flash', donna_provider: 'anthropic', donna_model: 'claude-haiku-4-5-20251001' } });
    // FIXTURE RE-DERIVED AT CE-41 SEAT I (R-41.136): the SUBJECT is Donna's own
    // wire in the advisory room — F-41.96 — and it is untouched. The row stub is
    // kept exactly as it was, and is now inert; the room arrives from the Advisor
    // page's assertion, which is the only door to it.
    db.schema = () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { victor_mode: 'advisor' } }) }) }) }) });
    const c = capture();
    const w = await chat.buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'a1', surface: 'pwa_vendor', roomAssert: 'advisor' });
    c.done();
    if (!w.donnaTransport) return 'donnaTransport is absent — the advisor room lost Donna\'s own wire';
    if (w.donnaTransport.provider !== 'anthropic') return `donnaTransport.provider=${w.donnaTransport.provider}`;
    return typeof w.donnaTransport.stream === 'function' && typeof w.donnaTransport.create === 'function'
      ? true : 'the transport carries no stream/create';
  });

  await cell('her wire is NOT Victor\'s — the two objects are distinct providers', async () => {
    const chat = req('src/api/vendor-engine/chat.js');
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': { provider: 'deepseek', model: 'deepseek-v4-flash', donna_provider: 'anthropic', donna_model: 'claude-haiku-4-5-20251001' } });
    db.schema = () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { victor_mode: 'business' } }) }) }) }) });
    const c = capture();
    const w = await chat.buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'a1' });
    c.done();
    return w.transport && w.transport.provider === 'deepseek'
      && w.donnaTransport && w.donnaTransport.provider === 'anthropic' ? true : JSON.stringify({ v: w.transport && w.transport.provider, d: w.donnaTransport && w.donnaTransport.provider });
  });

  await cell('both hands Anthropic: NO transport object for either — the native path, unchanged', async () => {
    const chat = req('src/api/vendor-engine/chat.js');
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', donna_provider: 'anthropic', donna_model: 'claude-haiku-4-5-20251001' } });
    db.schema = () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { victor_mode: 'business' } }) }) }) }) });
    const c = capture();
    const w = await chat.buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'a1' });
    const lines = c.done();
    return !w.transport && !w.donnaTransport
      && lines.some(l => /role=donna .*transport=native/.test(l)) ? true : JSON.stringify({ t: !!w.transport, d: !!w.donnaTransport, lines: lines.filter(l => /\[model\]/.test(l)) });
  });

  await cell('R-41.87 names the WIRE, not the intent', async () => {
    const chat = req('src/api/vendor-engine/chat.js');
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': { provider: 'deepseek', model: 'deepseek-v4-flash', donna_provider: 'anthropic', donna_model: 'claude-haiku-4-5-20251001' } });
    db.schema = () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { victor_mode: 'business' } }) }) }) }) });
    const c = capture();
    await chat.buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'a1', surface: 'wa_vendor' });
    const lines = c.done().filter(l => /\[model\]/.test(l));
    return lines.some(l => /role=victor .*provider=deepseek .*transport=facade/.test(l))
      && lines.some(l => /role=donna .*provider=anthropic .*transport=facade/.test(l))
      ? true : lines.join(' | ');
  });

  await cell('no engine byte moved — the ?? at loop.ts:728 is untouched', () => {
    const src = read('src/engine/src/core/loop.ts');
    return /args\.donnaTransport \?\? \(providerDowngrade \? undefined : \(transport \?\? undefined\)\)/.test(src)
      ? true : 'the engine seam moved — F1b was door-side only';
  });

  // ═════ §10 · F-41.93 — THE STAMP BELONGS TO THE HAND THAT MOVED ═══════════
  sec('§10 F-41.93 — per-role stamps');

  await cell('a donna flip stamps DONNA and leaves Victor unstamped', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    const { payload } = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    const v = payload.value;
    return v.changed_at_donna && v.changed_by_donna && !v.changed_at_provider && !v.changed_by_provider
      ? true : JSON.stringify(v);
  });

  await cell('the GET serves roles_changed, and only for the role that moved', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    const { payload } = await driveDoor(req(doorPath), 'get', null, null, db);
    const lane = payload.lanes.find(l => l.key === 'model.pwa_vendor.essential');
    return lane.roles_changed.donna && /^admin:[0-9a-f]{8}$/.test(lane.roles_changed.donna.by)
      && !lane.roles_changed.provider ? true : JSON.stringify(lane.roles_changed);
  });

  await cell('a second flip on the other hand stamps it WITHOUT clearing the first', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    const { payload } = await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'provider', provider: 'deepseek' }, db);
    return payload.value.changed_at_donna && payload.value.changed_at_provider ? true : JSON.stringify(payload.value);
  });

  await cell('the stamps read as KNOWN fields, never as junk on the glass', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': LIVE_ESSENTIAL });
    await driveDoor(req(doorPath), 'post', 'model.pwa_vendor.essential', { role: 'donna', provider: 'anthropic' }, db);
    const { payload } = await driveDoor(req(doorPath), 'get', null, null, db);
    const lane = payload.lanes.find(l => l.key === 'model.pwa_vendor.essential');
    return lane.unknown_fields.length === 0 ? true : lane.unknown_fields.join(', ');
  });

  await cell('the router still ignores them — six stamps disturb no route', async () => {
    const { _resetRouteCache, resolveModel } = mr(); _resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.essential': { ...LIVE_ESSENTIAL, changed_at_donna: '2026-09-09T00:00:00.000Z', changed_by_donna: 'admin:deadbeef' } });
    const got = await resolveModel(db, 'pwa_vendor', 'essential');
    return got.provider === 'anthropic' && got.donna_provider === 'deepseek' ? true : JSON.stringify(got);
  });

  // ═════ §11 · THE BRIDE APP LANE ═══════════════════════════════════════════
  sec('§11 the one lane that is not a row');

  await cell('it is registered, carries no roles, and names its env var', () => {
    const { LANE_BY_KEY } = mr();
    const lane = LANE_BY_KEY.get('model.bride_app.default');
    return !!lane && lane.roles.length === 0 && lane.env === 'BRIDE_LLM_PROVIDER'
      && /set on the server/.test(lane.read_only_because || '') ? true : JSON.stringify(lane);
  });

  await cell('the GET derives its value from the bride client, with provenance `server`', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const prev = process.env.BRIDE_LLM_PROVIDER; delete process.env.BRIDE_LLM_PROVIDER;
    try {
      const { payload } = await driveDoor(req(doorPath), 'get', null, null, makeDb({}));
      const lane = payload.lanes.find(l => l.key === 'model.bride_app.default');
      return lane && lane.provenance === 'server' && lane.env_set === false
        && lane.effective.provider === 'anthropic' && lane.has_row === false ? true : JSON.stringify(lane);
    } finally { if (prev !== undefined) process.env.BRIDE_LLM_PROVIDER = prev; }
  });

  await cell('set the env and the lane follows it — the panel cannot disagree with the lane', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const prev = process.env.BRIDE_LLM_PROVIDER; process.env.BRIDE_LLM_PROVIDER = 'deepseek';
    try {
      const { payload } = await driveDoor(req(doorPath), 'get', null, null, makeDb({}));
      const lane = payload.lanes.find(l => l.key === 'model.bride_app.default');
      return lane.effective.provider === 'deepseek' && lane.env_set === true ? true : JSON.stringify(lane.effective);
    } finally { if (prev === undefined) delete process.env.BRIDE_LLM_PROVIDER; else process.env.BRIDE_LLM_PROVIDER = prev; }
  });

  await cell('the value is the bride client\'s own answer, not a second copy of it', () => {
    const src = codeOf(doorPath);
    return /require\('\.\.\/\.\.\/lib\/brideLlmClient'\)/.test(src)
      && /resolveBrideProvider\(process\.env\)/.test(src)
      && !/BRIDE_LLM_PROVIDER['"]\s*\]/.test(src) ? true : 'the door re-derives the env itself';
  });

  await cell('c-41.53: it never serves a blank model — CONF answers \'\' for anthropic', async () => {
    const { _resetRouteCache, HAIKU } = mr(); _resetRouteCache();
    const { wireModelFor } = req('src/lib/brideLlmClient.js');
    // THE ASYMMETRY IS REAL AND IS ASSERTED, not assumed: if CONF ever starts
    // answering for anthropic this cell should be revisited, not silently passed.
    if (wireModelFor('anthropic') !== '') return 'CONF no longer answers empty — revisit the fallback';
    const prev = process.env.BRIDE_LLM_PROVIDER; delete process.env.BRIDE_LLM_PROVIDER;
    try {
      const { payload } = await driveDoor(req(doorPath), 'get', null, null, makeDb({}));
      const lane = payload.lanes.find(l => l.key === 'model.bride_app.default');
      return lane.effective.model === HAIKU ? true : `model=${JSON.stringify(lane.effective.model)}`;
    } finally { if (prev !== undefined) process.env.BRIDE_LLM_PROVIDER = prev; }
  });

  await cell('c-41.53: the fallback is a LOOKUP in the served set, not a branch on a name', () => {
    const src = codeOf(doorPath);
    return /wireModelFor\(provider\) \|\| SWITCHABLE\[provider\] \|\| null/.test(src)
      && !/'anthropic'/.test(src) && !/claude-haiku/.test(src)
      ? true : 'the fallback names a provider or a model';
  });

  await cell('the write door REFUSES it — there is no row to write', async () => {
    const { _resetRouteCache } = mr(); _resetRouteCache();
    const db = makeDb({});
    const r = await driveDoor(req(doorPath), 'post', 'model.bride_app.default', { role: 'provider', provider: 'deepseek' }, db);
    return r.status === 409 && /set on the server/.test(r.payload.error || '') && db.t.admin_config.length === 0
      ? true : JSON.stringify(r);
  });

  console.log(`\n  b63_f1_model_routes  ${pass}/${pass + fail}`);
  if (fail) console.log('  FAILED: ' + fails.join(' · '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH ERROR', e); process.exit(1); });
