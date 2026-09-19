'use strict';
// scripts/b86_lcv_p2_bench.js · TDW CE-44 · LCV-1 · LC-Victor P2, THE SILENT LISTENER. Rung b86.
//
// WHAT IT HOLDS. R-44.14 and R-44.15 (one listener, no hands), R-44.17 (no advice classification
// anywhere; nothing the vendor reads changes), the chair's accepted P2: the listener is a third
// router role with Donna's split geometry; it is heard AFTER the wire closes on both lanes, never
// awaited, bounded at 15 s; it reads the thread up to but excluding the current exchange; its only
// writes are meta MERGED onto the row runTurn named and one usage row with conversation_id NULL.
// For every outcome of the listener (a request, a failure, a timeout, none at all) the reply sent
// and the content stored are byte-identical to today's. W-1: no engine source, soul or lens path
// moves from base. The rig's home is outside the floor's glob (F-44.41). Four mutations, each of
// which must redden the cell that guards it.
//
// THE EXIT CODE IS THE VERDICT (run-floor.sh reads nothing else).

// The estate's inert pair, as b40:49 and b84:27 set it: nothing here reaches a database.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const path = require('path');
const Module = require('module');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BASE = '0675964ce5a4680ee8ed9a6483e17ef7092b2fd1';
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) {
  if (cond) { pass += 1; console.log(`  PASS  ${name}`); }
  else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); }
}
function src(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function loadMutated(rel, from, to) {
  const file = path.join(ROOT, rel);
  const code = fs.readFileSync(file, 'utf8');
  if (!code.includes(from)) throw new Error(`mutation anchor missing in ${rel}: ${from.slice(0, 60)}`);
  const m = new Module(file, null);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(code.replace(from, to), file);
  return m.exports;
}
function fakeSupabase(rows, opts = {}) {
  const log = { inserts: [], updates: [], selects: [] };
  const tables = { messages: (rows || []).map((x) => ({ ...x })) };
  const q = (schema, table) => {
    const filt = {};
    const b = {
      select(cols) { log.selects.push({ schema, table, cols }); if (opts.throwOnSelect) throw new Error('db down'); return b; },
      in() { return b; }, order() { return b; },
      eq(k, v) { filt[k] = v; return b; },
      limit() {
        const all = (tables[table] || []).filter((x) => !filt.conversation_id || x.conversation_id === filt.conversation_id)
          .sort((a, c) => (a.created_at < c.created_at ? 1 : -1));
        return Promise.resolve({ data: all, error: null });
      },
      maybeSingle() {
        const r = (tables[table] || []).find((x) => Object.entries(filt).every(([k, v]) => x[k] === v));
        return Promise.resolve({ data: r || null, error: null });
      },
      insert(row) { log.inserts.push({ schema, table, row }); return Promise.resolve({ error: null }); },
      update(vals) {
        return { eq(k, v) {
          log.updates.push({ schema, table, vals, k, v });
          const r = (tables[table] || []).find((x) => x[k] === v); if (r) Object.assign(r, vals);
          return Promise.resolve({ error: null });
        } };
      },
    };
    return b;
  };
  return { log, tables, schema: (s) => ({ from: (t) => q(s, t) }), from: (t) => q('public', t) };
}
const goodLlm = (seen) => async (provider, p) => {
  seen.push({ provider, p });
  return { usage: { input_tokens: 900, output_tokens: 120 },
    content: [{ type: 'tool_use', name: 'ear_request', input: { route: 'task', acts: [{ act: 'milestone_paid', client_as_spoken: 'Khanna', amount_rupees: 0, date_as_spoken: '18 September' }] } }] };
};

(async () => {
  delete process.env.LLM_PROVIDER;
  delete process.env.DEEPSEEK_API_KEY;

  // ─── §1 THE ROUTER ───────────────────────────────────────────────────────────────────────────
  console.log('\n§1 the router');
  const router = require(path.join(ROOT, 'src/lib/modelRouter.js'));
  // Working-room vendor lanes: not the advisor tier, and not model.pwa_vendor.trial, which carries
  // no roles by design (modelRouter.js :124 to :133, F-41.46).
  const vendorLanes = router.LANES.filter((l) => (l.surface === 'pwa_vendor' || l.surface === 'wa_vendor') && l.tier !== 'advisor' && (l.roles || []).length);
  T('§1 there are working-room lanes on both surfaces', vendorLanes.some((l) => l.surface === 'pwa_vendor') && vendorLanes.some((l) => l.surface === 'wa_vendor'));
  T('§1 every working-room vendor lane carries the listener role', vendorLanes.every((l) => l.roles.includes('listener') && l.roles.includes('provider') && l.roles.includes('donna')));
  const advisorLane = router.LANE_BY_KEY.get('model.pwa_vendor.advisor');
  T('§1 the advisor lane offers NO listener switch (the listener never runs there)', !!advisorLane && !advisorLane.roles.includes('listener') && advisorLane.roles.includes('provider'));
  T('§1 no non-vendor lane carries it', router.LANES.filter((l) => !/vendor/.test(l.surface)).every((l) => !(l.roles || []).includes('listener')));
  const rowSb = (row) => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { value: JSON.stringify(row) } }) }) }) }) });
  router._resetRouteCache();
  let r = await router.resolveModel(rowSb({ provider: 'anthropic', model: router.HAIKU, listener_provider: 'anthropic', listener_model: router.HAIKU }), 'pwa_vendor', 'signature');
  T('§1 a well-formed listener split survives resolution', r.listener_provider === 'anthropic' && r.listener_model === router.HAIKU);
  router._resetRouteCache();
  r = await router.resolveModel(rowSb({ provider: 'anthropic', model: router.HAIKU, listener_provider: 'nosuch', listener_model: 'x' }), 'pwa_vendor', 'signature');
  T('§1 an unknown listener provider is DROPPED, never guessed', !('listener_provider' in r) && !('listener_model' in r));
  router._resetRouteCache();
  r = await router.resolveModel(rowSb({ provider: 'anthropic', model: router.HAIKU, listener_provider: 'anthropic' }), 'pwa_vendor', 'signature');
  T('§1 a listener provider with no model is dropped', !('listener_provider' in r));
  router._resetRouteCache();
  r = await router.resolveModel(rowSb({ provider: 'anthropic', model: router.HAIKU, listener_provider: 'deepseek', listener_model: 'deepseek-v4-flash', donna_provider: 'deepseek', donna_model: 'deepseek-v4-flash' }), 'pwa_vendor', 'signature');
  T('§1 a KEYLESS listener split is dropped and the listener follows the primary', !('listener_provider' in r) && r.provider === 'anthropic');
  T('§1 and the donna key guard still runs after it (no early return)', !('donna_provider' in r));
  T('§1 the allow-set guard covers listener_model', /\['model', 'nudge_model', 'donna_model', 'listener_model'\]/.test(src('src/lib/modelRouter.js')));

  // ─── §2 THE ADMIN ROUTE ──────────────────────────────────────────────────────────────────────
  console.log('\n§2 the admin route');
  const mr = src('src/api/admin/modelRoutes.js');
  T("§2 ROLE_FIELDS names the listener's two fields", /listener:\s*\['listener_provider', 'listener_model'\]/.test(mr));
  T('§2 the drift filter reads them', /nudge_model\|listener_provider\|listener_model\)\$\//.test(mr));
  T('§2 the unknown-field filter admits them and their stamps', /\/\^\(listener_provider\|listener_model\|changed_\(by\|at\)_listener\)\$\//.test(mr));
  T("§2 b63's M24 anchor is intact, byte for byte", mr.includes("|changed_by|changed_at|changed_(by|at)_(provider|donna|nudge))$/"));

  // ─── §3 THE SCHEMA: tasks and lookups only, no advice (R-44.17) ──────────────────────────────
  console.log('\n§3 the schema');
  const door = require(path.join(ROOT, 'src/lib/vendor/listenerDoor.js'));
  const schemaCell = (d) => !JSON.stringify(d.EAR_TOOL).includes('advice') && !/advice/i.test(d.SYSTEM);
  T('§3 R-44.17: no advice field, word or judgement in the tool or the system line', schemaCell(door));
  T('§3 route is task, search or none', JSON.stringify(door.EAR_TOOL.input_schema.properties.route.enum) === '["task","search","none"]');
  const actProps = door.EAR_TOOL.input_schema.properties.acts.items.properties;
  T('§3 F-44.40 the schema sets amount_rupees minimum 1', actProps.amount_rupees.minimum === 1);
  T('§3 F-44.38 dates are carried as spoken, never as a computed date', 'date_as_spoken' in actProps && !('date' in actProps));
  const zeroCell = (d) => { const q = d.normaliseRequest({ route: 'task', acts: [{ act: 'milestone_paid', amount_rupees: 0 }] }); return !('amount_rupees' in q.acts[0]); };
  T('§3 F-44.40 an amount of 0 is ABSENT, never zero', zeroCell(door));
  T('§3 a malformed route is no request at all', door.normaliseRequest({ route: 'maybe', acts: [] }) === null);
  const m4 = loadMutated('src/lib/vendor/listenerDoor.js',
    "      route: { type: 'string', enum: ['task', 'search', 'none'] },",
    "      route: { type: 'string', enum: ['task', 'search', 'none'] },\n      advice_part: { type: 'boolean' },");
  T('§3 M4 restoring advice_part reddens the R-44.17 cell', schemaCell(m4) === false);

  // ─── §4 HEAR: one forced tool, the thread without the current exchange, failures recorded ────
  console.log('\n§4 hear()');
  const seen = [];
  const thread = [
    { id: 'u1', conversation_id: 'c1', role: 'user', content: 'Raise the invoice for Khanna', meta: null, created_at: '2026-09-19T10:00:00Z' },
    { id: 'a1', conversation_id: 'c1', role: 'assistant', content: 'Invoice raised.', meta: { listener: { request: { route: 'task', acts: [{ act: 'invoice' }] } } }, created_at: '2026-09-19T10:00:05Z' },
    { id: 'u2', conversation_id: 'c1', role: 'user', content: 'Khanna paid the middle payment on 18 September', meta: null, created_at: '2026-09-19T10:05:00Z' },
    { id: 'a2', conversation_id: 'c1', role: 'assistant', content: 'THE CURRENT REPLY', meta: null, created_at: '2026-09-19T10:05:04Z' },
  ];
  let ear = await door.hear({ supabase: fakeSupabase(thread), route: { provider: 'anthropic', model: 'm-primary', listener_provider: 'anthropic', listener_model: 'm-listen' }, message: 'Khanna paid the middle payment on 18 September', conversationId: 'c1', excludeId: 'a2' }, { llmCreate: goodLlm(seen) });
  const heard = seen[0].p.messages[0].content;
  T('§4 the listener seat is the split, not the primary', seen[0].p.model === 'm-listen');
  T('§4 ear_request is the ONLY tool offered, and it is forced', seen[0].p.tools.length === 1 && seen[0].p.tools[0].name === 'ear_request' && seen[0].p.tool_choice.name === 'ear_request');
  T('§4 F-44.39 the prior thread is handed over, oldest first, with its last request', /Vendor: Raise the invoice for Khanna\nAssistant: Invoice raised\. \[understood then:/.test(heard));
  T('§4 the CURRENT exchange is excluded from the thread (heard once, as the new message)', !heard.includes('THE CURRENT REPLY') && heard.split('Khanna paid the middle payment').length === 2 && /New message: Khanna paid the middle payment on 18 September$/.test(heard));
  T('§4 a good call yields the normalised request (a zero amount dropped)', ear.request && ear.request.acts[0].act === 'milestone_paid' && !('amount_rupees' in ear.request.acts[0]) && ear.request.acts[0].date_as_spoken === '18 September');
  seen.length = 0;
  await door.hear({ supabase: fakeSupabase([]), route: { provider: 'deepseek', model: 'm-primary' }, message: 'x', conversationId: 'c1', excludeId: 'z' }, { llmCreate: goodLlm(seen) });
  T('§4 unset, the listener follows the primary', seen[0].provider === 'deepseek' && seen[0].p.model === 'm-primary');
  ear = await door.hear({ supabase: fakeSupabase([]), route: {}, message: 'x', conversationId: 'c1' }, { llmCreate: async () => { throw new Error('401 invalid key'); } });
  T('§4 a provider error is recorded, never thrown', ear.request === null && /401/.test(ear.error));
  ear = await door.hear({ supabase: fakeSupabase([]), route: {}, message: 'x', conversationId: 'c1' }, { llmCreate: () => new Promise(() => {}), timeoutMs: 50 });
  T('§4 a hung call is bounded and recorded', ear.request === null && /timed out/.test(ear.error));
  ear = await door.hear({ supabase: fakeSupabase([]), route: {}, message: 'x', conversationId: 'c1' }, { llmCreate: async () => ({ content: [{ type: 'text', text: 'Sure!' }] }) });
  T('§4 no ear_request call is recorded', ear.request === null && /no ear_request/.test(ear.error));
  T('§4 the bound is 15 seconds', door.LISTEN_TIMEOUT_MS === 15000);

  // ─── §5 THE ONLY WRITES: meta MERGED, one UNCOUNTED usage row, never content ─────────────────
  console.log('\n§5 recordListening()');
  const result = { assistant_message_id: 'a2', conversation_id: 'c1', reply: 'THE CURRENT REPLY' };
  const deps2 = { meter: require(path.join(ROOT, 'src/agent/harvest.js'))._meter };
  const writeCell = async (d, llm, meter) => {
    const dd = { ...deps2, ...(meter ? { meter } : {}) };
    const s = fakeSupabase(thread.map((x) => (x.id === 'a2' ? { ...x, meta: { mode: 'advisor' } } : x)));
    await d.recordListening({ supabase: s, agentId: 'ag', route: {}, message: 'Khanna paid the middle payment on 18 September', result, lane: 'pwa' }, { llmCreate: llm || goodLlm([]), meter: dd.meter });
    const row = s.tables.messages.find((x) => x.id === 'a2');
    const usage = s.log.inserts.filter((i) => i.table === 'usage');
    return { s, row, usage };
  };
  let w = await writeCell(door);
  T('§5 the request lands in meta.listener on the row runTurn named', w.row.meta.listener && w.row.meta.listener.request.acts[0].act === 'milestone_paid' && w.row.meta.listener.lane === 'pwa');
  const mergeOk = (x) => x.row.meta.mode === 'advisor' && !!x.row.meta.listener;
  T('§5 meta is MERGED, never overwritten', mergeOk(w));
  const noContent = (x) => x.row.content === 'THE CURRENT REPLY' && x.s.log.updates.every((u) => Object.keys(u.vals).join() === 'meta');
  T('§5 the stored content is byte-identical: only meta is ever updated', noContent(w));
  const uncounted = (x) => x.usage.length === 1 && x.usage[0].row.conversation_id === null;
  T('§5 ONE usage row, UNCOUNTED (conversation_id NULL): the chain row counts the turn', uncounted(w));
  w = await writeCell(door, async () => { throw new Error('provider down'); });
  T('§5 on failure: the error is recorded in meta, content untouched, no usage row', /provider down/.test(w.row.meta.listener.error) && w.row.meta.listener.request === null && noContent(w) && w.usage.length === 0);
  const sNone = fakeSupabase(thread);
  await door.recordListening({ supabase: sNone, agentId: 'ag', route: {}, message: 'x', result: { conversation_id: 'c1' }, lane: 'pwa' }, { llmCreate: goodLlm([]), meter: deps2.meter });
  T('§5 absent: no named row means nothing is heard and nothing is written', sNone.log.inserts.length === 0 && sNone.log.updates.length === 0);
  let threw = false;
  try { await door.recordListening({ supabase: fakeSupabase([], { throwOnSelect: true }), agentId: 'ag', route: {}, message: 'x', result, lane: 'pwa' }, { llmCreate: goodLlm([]), meter: deps2.meter }); }
  catch (_e) { threw = true; }
  T('§5 it never throws, even when the database does', threw === false);
  const m2 = loadMutated('src/agent/harvest.js', 'conversation_id: null, // NOT a turn', "conversation_id: 'c1', // NOT a turn");
  T('§5 M2 a counted listener row (harvest\'s writer mutated) reddens the usage cell', uncounted(await writeCell(door, null, m2._meter)) === false);
  T('§5 the listener has NO usage-write of its own: the estate keeps two homes (tdw10 3.1)', !/from\('usage'\)/.test(src('src/lib/vendor/listenerDoor.js')));
  const m3 = loadMutated('src/lib/vendor/listenerDoor.js', '{ meta: { ...prior, listener } }', '{ meta: { listener } }');
  T('§5 M3 overwriting meta reddens the merge cell', mergeOk(await writeCell(m3)) === false);

  // ─── §6 THE WIRE: nothing the vendor reads changes, on either lane ───────────────────────────
  console.log('\n§6 the wire');
  let base = BASE;
  try { execSync(`git cat-file -e ${BASE}^{commit}`, { cwd: ROOT, stdio: 'ignore' }); } catch (_e) { base = 'HEAD'; }
  const numstat = (rel) => execSync(`git diff --numstat ${base} -- ${rel}`, { cwd: ROOT }).toString().trim();
  const dels = (rel) => { const l = numstat(rel); return l ? Number(l.split(/\s+/)[1]) : 0; };
  T('§6 chat.js: not one line of today\'s is removed or changed (additions only)', dels('src/api/vendor-engine/chat.js') === 0);
  T('§6 vendorInbound.js: not one line of today\'s is removed or changed (additions only)', dels('src/lib/vendorInbound.js') === 0);
  const cj = src('src/api/vendor-engine/chat.js');
  const orderCell = (text) => {
    const sse = text.indexOf('      listenAfterWire(req, llmWiring, message, result, roomAssert);');
    const sseEnd = text.indexOf('      res.end();\n      fireHarvest(req, message, result);');
    const jsonS2 = text.indexOf("seat: 'pwa_json' });\n      listenAfterWire(");
    const jsonEnd = text.indexOf('\n    listenAfterWire(req, llmWiring, message, result, roomAssert);');
    const jsonHarvest = text.indexOf('\n    fireHarvest(req, message, result);');
    return sseEnd > 0 && sse > sseEnd && jsonS2 > 0 && jsonHarvest > 0 && jsonEnd > jsonHarvest
      && (text.match(/listenAfterWire\(req, llmWiring, message, result, roomAssert\);/g) || []).length === 3;
  };
  T('§6 chat.js: the listener is called only after the reply is sent (SSE) or fully built (JSON), on all three reply paths', orderCell(cj));
  const helper = cj.slice(cj.indexOf('function listenAfterWire('), cj.indexOf("router.post('/', requireAuth"));
  T('§6 chat.js: never awaited: the call is deferred by setImmediate', /setImmediate\(\(\) => \{ listenerDoor\.recordListening\(/.test(helper) && !/await/.test(helper));
  T('§6 chat.js: the advisor room is never heard', /if \(roomAssert === 'advisor' \|\| !result\) return;/.test(helper));
  const moved = cj.replace('      listenAfterWire(req, llmWiring, message, result, roomAssert); // CE-44 LC-Victor P2: after the wire closes\n', '')
    .replace("      const result = await runTurn({", "      listenAfterWire(req, llmWiring, message, result, roomAssert);\n      const result = await runTurn({");
  T('§6 M1 a listener call moved before the reply reddens the order cell', orderCell(moved) === false);
  const vi = src('src/lib/vendorInbound.js');
  const waSend = vi.indexOf('    const twilioMsg = await sendWhatsApp(phone, replyText, []);');
  const waCall = vi.indexOf("setImmediate(() => { require('./vendor/listenerDoor').recordListening(");
  T('§6 WhatsApp: the listener is called only after sendWhatsApp, deferred, never awaited', waSend > 0 && waCall > waSend && (vi.match(/recordListening\(/g) || []).length === 1
    && !/await require\('\.\/vendor\/listenerDoor'\)/.test(vi));

  // ─── §7 W-1 AND THE UNTOUCHED ────────────────────────────────────────────────────────────────
  console.log('\n§7 W-1');
  const changed = execSync(`git diff --name-only ${base}`, { cwd: ROOT }).toString().split('\n')
    .concat(execSync('git ls-files --others --exclude-standard', { cwd: ROOT }).toString().split('\n')).filter(Boolean);
  T(`§7 W-1: no src/engine/src/** path differs from base (${base.slice(0, 7)})`, !changed.some((p) => p.startsWith('src/engine/src/')));
  T('§7 W-1: no soul or lens file differs from base', !changed.some((p) => /soul|lens/i.test(p)));
  T('§7 pwaPaths.js, victorLines.js and src/lib/vendor/relaySeat.js are unchanged from base',
    !['src/lib/pwaPaths.js', 'src/lib/victorLines.js', 'src/lib/vendor/relaySeat.js'].some((p) => changed.includes(p)));
  T('§7 R-44.17: R-44.8\'s bytes enter no file', !fs.existsSync(path.join(ROOT, 'src/lib/vendor/adviceLines.js'))
    && !changed.filter((p) => /^src\//.test(p) && fs.existsSync(path.join(ROOT, p))).some((p) => src(p).includes('For advice, ask Victor')));

  // ─── §8 THE RIG'S HOME (F-44.41) ─────────────────────────────────────────────────────────────
  console.log('\n§8 the rig');
  T('§8 the rig lives at scripts/lib/p1_ear_rig.js', fs.existsSync(path.join(ROOT, 'scripts/lib/p1_ear_rig.js')));
  T('§8 and not at scripts/, where run-floor.sh:226 would collect it', !fs.existsSync(path.join(ROOT, 'scripts/p1_ear_rig.js')));
  T("§8 the floor's own glob does not list it", !/p1_ear_rig/.test(execSync('ls scripts/*.js 2>/dev/null || true', { cwd: ROOT, shell: '/bin/bash' }).toString()));

  console.log(`\nb86 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.log(`b86 CRASHED: ${(e && e.stack) || e}`); process.exit(1); });
