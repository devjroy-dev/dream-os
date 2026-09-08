#!/usr/bin/env node
// scripts/b63_mutations.js — the both-ways half of b63. Each mutation edits
// PRODUCTION code in a scratch copy of the tree; the named cell must RED.
//
// M1–M3 are the three ways F-41.46 can be built wrong and still look right:
// falling through to the matrix, caching under the wrong key, and busting
// without the cascade. M6 is the write door's version of the same disease — a
// switch that appears to work and moves nothing.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const MUT = [
  ['M1 the fallback is removed — a wa_vendor miss falls to the matrix', 'src/lib/modelRouter.js',
    "  if (!route && opts.fallbackSurface && opts.fallbackSurface !== surface) {",
    "  if (false && opts.fallbackSurface && opts.fallbackSurface !== surface) {",
    'THE TRAP: a wa_vendor miss must NOT land on the default matrix or the literal'],
  ['M2 the borrowed value caches under the TWIN\'S key, not its own', 'src/lib/modelRouter.js',
    "    cache.set(key, { at: Date.now(), val: lent });\n    return lent;",
    "    return lent;",
    'the borrowed value caches under the PRIMARY key, so a later seed lands'],
  ['M3 the bust stops cascading to the lanes that borrow', 'src/lib/modelRouter.js',
    "    if (dep.fallback_surface === lane.surface && dep.tier === lane.tier) cache.delete(dep.key);",
    "    if (false) cache.delete(dep.key);",
    'bustRouteCache CASCADES: writing the twin drops the borrower too'],
  ['M4 the write REPLACES the row instead of merging (Form A returns)', 'src/api/admin/modelRoutes.js',
    "  const next = { ...base, [pField]: provider, [mField]: model };",
    "  const next = { [pField]: provider, [mField]: model };",
    'a provider flip PRESERVES the nudge split (Form A\'s defect, refused)'],
  ['M5 the merge drops fields it does not understand', 'src/api/admin/modelRoutes.js',
    "  let base = existing ? parseValue(existing.value) : null;",
    "  let base = existing ? (function (v) { const o = parseValue(v) || {}; const k = {}; for (const f of ['provider','model','donna_provider','donna_model','nudge_provider','nudge_model']) if (o[f] != null) k[f] = o[f]; return k; })(existing.value) : null;",
    'an unknown field on the row survives the merge untouched (ruling 4)'],
  ['M6 a first tap writes ONLY the tapped role (the incomplete row)', 'src/api/admin/modelRoutes.js',
    "    for (const f of ['provider', 'model', 'donna_provider', 'donna_model', 'nudge_provider', 'nudge_model']) {\n      if (effective[f] != null) base[f] = effective[f];\n    }",
    "    ;",
    'THE TRAP: a first tap on a lane with NO ROW writes a COMPLETE route'],
  ['M7 free-text models reach the row', 'src/api/admin/modelRoutes.js',
    "  if (body.model != null && String(body.model) !== SWITCHABLE[provider]) {\n    return errRes(res, 400, 'model does not match that provider — no free-text models from the glass.');\n  }\n  const model = SWITCHABLE[provider];",
    "  const model = body.model != null ? String(body.model) : SWITCHABLE[provider];",
    'free-text models are refused'],
  ['M8 the write stops busting the cache', 'src/api/admin/modelRoutes.js',
    "  bustRouteCache(key);",
    "  ;",
    'the write busts the cache — the next read is the new value, not the window'],
  ['M9 the unreachable row becomes writable again', 'src/api/admin/modelRoutes.js',
    "  if (lane.reachable === false) {",
    "  if (false) {",
    'an unknown key, an unreachable row and a role the lane lacks are all refused'],
  // ANCHORS RE-DERIVED AT F1b (c-41.40's class, one repo over): F-41.96 moved the
  // R-41.87 block below the wiring and gave both lines a `transport=` field, so M10,
  // M11, M16 and M16b were all matching zero times. A mutation whose target has
  // vanished proves nothing and says so — the harness prints `??` rather than a
  // pass, which is the only reason this was visible at all.
  ['M10 Donna\'s line is dropped from the walk (R-41.87 half-shipped)', 'src/api/vendor-engine/chat.js',
    "  if (route.donna_provider) {\n    const donnaWire = donnaWiring.donnaTransport",
    "  if (false) {\n    const donnaWire = donnaWiring.donnaTransport",
    'driven: a split route prints BOTH hands with the right providers'],
  ['M11 the donna line prints unconditionally (the absence stops being a record)', 'src/api/vendor-engine/chat.js',
    "  if (route.donna_provider) {\n    const donnaWire",
    "  if (true) {\n    const donnaWire",
    'driven: NO donna line when she follows Victor — the absence is the record'],
  ['M12 the WA door goes back to borrowing silently', 'src/lib/vendorInbound.js',
    "const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId, surface: 'wa_vendor' });",
    "const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId });",
    'vendorInbound passes surface=wa_vendor to the shared builder'],
  ['M13 SWITCHABLE transcribes its model strings instead of deriving them', 'src/lib/modelRouter.js',
    "const SWITCHABLE = Object.freeze({\n  anthropic: HAIKU_CLASS[0],\n  deepseek:  DEEPSEEK_CLASS[0],\n});",
    "const SWITCHABLE = Object.freeze({\n  anthropic: 'claude-haiku-4-5-20251001',\n  deepseek:  'deepseek-v4-flash',\n});",
    'SWITCHABLE is built FROM the F-08.84 classes (no transcription)'],
  ['M14 the tier words are transcribed rather than taken from CANON_TIERS', 'src/lib/modelRouter.js',
    "  return [...CANON_TIERS, 'advisor'].map((tier) => ({",
    "  return ['basic', 'essential', 'signature', 'prestige', 'advisor'].map((tier) => ({",
    'the vendor tiers are DERIVED from CANON_TIERS, not transcribed (R-40.94)'],
  ['M15 the door grows its own copy of a lane key', 'src/api/admin/modelRoutes.js',
    "  const lane = LANE_BY_KEY.get(key);\n  if (!lane) return errRes(res, 400, 'not a model-route key.');",
    "  const lane = LANE_BY_KEY.get(key) || (key === 'model.pwa_vendor.basic' ? { key, surface: 'pwa_vendor', tier: 'basic', roles: ['provider', 'donna'], reachable: true } : null);\n  if (!lane) return errRes(res, 400, 'not a model-route key.');",
    'the door holds NO key, provider or model string of its own (one home)'],
  ['M16 the door grows its OWN actor hash (R-41.88\'s two homes)', 'src/api/admin/modelRoutes.js',
    "  const stampedBy = whoFlipped(req);",
    "  const stampedBy = 'admin:' + require('crypto').createHash('sha256').update(String((req.headers && req.headers.authorization) || '')).digest('hex').slice(0, 8);",
    'R-41.88: the actor fingerprint is IMPORTED from the switchboard, not re-implemented'],
  ['M16b the write stops stamping who moved it', 'src/api/admin/modelRoutes.js',
    "  next.changed_by = stampedBy;",
    "  ;",
    'driven: a write stamps changed_by AND changed_at, and the GET renders them'],
  ['M16c the switchboard stops exporting the fingerprint', 'src/api/admin/capabilities.js',
    "module.exports.whoFlipped = whoFlipped;",
    ";",
    'R-41.88: the actor fingerprint is IMPORTED from the switchboard, not re-implemented'],
  ['M17 0153 seeds the basic tier too (a live behaviour change in a seed)', 'db/migrations/0153_wa_vendor_route_seed.sql',
    "ON CONFLICT (key) DO NOTHING;",
    "  , ('model.wa_vendor.basic', '{\"provider\":\"anthropic\",\"model\":\"claude-haiku-4-5-20251001\",\"donna_provider\":\"deepseek\",\"donna_model\":\"deepseek-v4-flash\"}', 'seeded')\nON CONFLICT (key) DO NOTHING;",
    'it seeds NEITHER basic NOR trial, and says why for both'],
  ['M18 0153 overwrites a value the founder has since chosen', 'db/migrations/0153_wa_vendor_route_seed.sql',
    "ON CONFLICT (key) DO NOTHING;",
    "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
    'it never overwrites a value the founder has since chosen'],
  // ── F1b ────────────────────────────────────────────────────────────────────
  ['M19 F-41.96 reverts: an Anthropic Donna gets no wire and rides Victor\'s', 'src/api/vendor-engine/chat.js',
    "    donnaWiring.donnaTransport = {\n      provider: route.donna_provider,\n      stream: (p) => llmStream(route.donna_provider, p),\n      create: (p) => llmCreate(route.donna_provider, p),\n    };\n    donnaWiring.donnaModelOverride = route.donna_model;",
    "    if (route.donna_provider === 'anthropic') { donnaWiring.donnaTransport = undefined; donnaWiring.donnaModelOverride = undefined; }\n    else { donnaWiring.donnaTransport = { provider: route.donna_provider, stream: (p) => llmStream(route.donna_provider, p), create: (p) => llmCreate(route.donna_provider, p) }; donnaWiring.donnaModelOverride = route.donna_model; }",
    'she gets a transport OBJECT of her own, named anthropic'],
  ['M20 the wiring fires for a same-provider Donna, breaking the native path', 'src/api/vendor-engine/chat.js',
    "  if (route.donna_provider && route.donna_provider !== route.provider) {",
    "  if (route.donna_provider) {",
    'both hands Anthropic: NO transport object for either — the native path, unchanged'],
  ['M21 R-41.87 goes back to naming the route instead of the wire', 'src/api/vendor-engine/chat.js',
    "    + `provider=${route.provider} model=${route.model} transport=${victorWire}`);",
    "    + `provider=${route.provider} model=${route.model}`);",
    'R-41.87 names the WIRE, not the intent'],
  ['M22 F-41.93: the stamp goes back to the row, not the hand', 'src/api/admin/modelRoutes.js',
    "  next[`changed_at_${role}`] = stampedAt;\n  next[`changed_by_${role}`] = stampedBy;",
    "  ;",
    'a donna flip stamps DONNA and leaves Victor unstamped'],
  ['M23 the second flip clears the first hand\'s stamp', 'src/api/admin/modelRoutes.js',
    "  const next = { ...base, [pField]: provider, [mField]: model };",
    "  const next = { ...base, [pField]: provider, [mField]: model, changed_at_donna: undefined, changed_by_donna: undefined };",
    'a second flip on the other hand stamps it WITHOUT clearing the first'],
  ['M24 the stamps read as junk on the glass again', 'src/api/admin/modelRoutes.js',
    "|changed_by|changed_at|changed_(by|at)_(provider|donna|nudge))$/",
    "|changed_by|changed_at)$/",
    'the stamps read as KNOWN fields, never as junk on the glass'],
  ['M25 the bride lane loses its env marker and becomes a routed row', 'src/lib/modelRouter.js',
    "    env: 'BRIDE_LLM_PROVIDER',",
    "    envx: 'BRIDE_LLM_PROVIDER',",
    'it is registered, carries no roles, and names its env var'],
  ['M26 the door re-derives the bride env itself instead of asking the client', 'src/api/admin/modelRoutes.js',
    "      const provider = resolveBrideProvider(process.env);",
    "      const provider = String(process.env['BRIDE_LLM_PROVIDER'] || 'anthropic').trim();",
    'the value is the bride client\'s own answer, not a second copy of it'],
  ['M27 the write door stops refusing the env lane', 'src/api/admin/modelRoutes.js',
    "  if (lane.env) return errRes(res, 409, lane.read_only_because || `this lane is set on the server (${lane.env}).`);",
    "  ;",
    'the write door REFUSES it — there is no row to write'],
  ['M28 c-41.53 reverts: the blank model is served as a value', 'src/api/admin/modelRoutes.js',
    "  return wireModelFor(provider) || SWITCHABLE[provider] || null;",
    "  return wireModelFor(provider);",
    'c-41.53: it never serves a blank model — CONF answers \'\' for anthropic'],
];

let bad = 0;
for (const [id, file, from, to, cellName] of MUT) {
  const scratch = fs.mkdtempSync('/tmp/b63m-');
  execSync(`cp -r ${ROOT}/src ${ROOT}/db ${ROOT}/scripts ${ROOT}/package.json ${scratch}/ && ln -s ${ROOT}/node_modules ${scratch}/node_modules`);
  const p = path.join(scratch, file); const s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) { console.log(`  ??     ${id} — target matched ${n} times`); bad++; fs.rmSync(scratch, { recursive: true, force: true }); continue; }
  fs.writeFileSync(p, s.replace(from, to));
  let out = '';
  try { out = execSync(`B63_ROOT=${scratch} node ${scratch}/scripts/b63_f1_model_routes_bench.js`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  // The named cell must be among the failures. A mutation that reds SOMETHING
  // ELSE has not proven its cell — it has proven the tree is fragile.
  const line = out.split('\n').find(l => l.includes('FAILED:')) || '';
  const hit = line.includes(cellName);
  console.log(`  ${hit ? 'ok   ' : 'MISS '} ${id}`);
  if (!hit) { bad++; console.log(`         expected RED: ${cellName}`); console.log(`         got: ${line.slice(0, 300)}`); }
  fs.rmSync(scratch, { recursive: true, force: true });
}
console.log(`\n  b63_mutations  ${MUT.length - bad}/${MUT.length}`);
process.exit(bad ? 1 : 0);
