'use strict';
// scripts/b124_g61_enquiry_srv_bench.js · TDW CE-45 · G6-1 · FE_2's DREAM-OS HALF · rung b124.
//
// WHAT IT HOLDS (§7c; FE_2 read-first FK1, FK2, FK4, FK5 and e-109's ruling (a), 2026-09-24):
//  · /me is her one writer for enquiry_routing and enquiry_phone: 'tdw' and 'own_number' only; 'own_waba' refused
//    until 2b; 'own_number' needs a 10 to 15 digit phone on her row or in the same write; the phone trimmed; both
//    shapes echo the DOOR's answer, coerced so the row never draws a rung the links would not honour.
//  · EVERY real-vendor emitter of enquire_link routes through enquireLinkFor (a census over src, demo emitters
//    named and excluded), each passing its OLD rung-1 expression whole as tdwLink, so rung 1 is byte-identical on
//    every surface by construction (the base's expressions are read from a7e90bf and found verbatim).
//  · every select feeding an emitter names both columns; the previews read '*'.
//  · weddingTeam's ownerEnquireLink is NOT an emitter (called by no surface; b57 alone uses it) and stays as it was.
// /me's PATCH is driven for real (b05_p3d's pattern: compiled with a resolution hook, its final handler called
// with a Postgres-shaped double). Mutations of production code are restored byte for byte, sha re-checked.
// No clock is read by anything this half adds.
// THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const BASE = '90f607d' ; // the base given under R-45.14 (built at a7e90bf; the eight files are byte-identical between the two)
const atBase = (r) => execSync(`git show ${BASE}:${r}`, { cwd: ROOT, maxBuffer: 1 << 26 }).toString();
let pass = 0; let fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const fresh = (r) => { const k = require.resolve(P(r)); delete require.cache[k]; return require(k); };

// ── the sites (file, the base's own rung-1 expression) ─────────────────────────────────────────────
const SITES = [
  ['src/lib/discover/shapeVendor.js', 'handle ? `${ENQUIRE_BASE}${handle}` : null'],
  ['src/api/public/vendorCard.js',    'ENQUIRE_BASE + String(v.routing_handle)'],
  ['src/api/public/weddingPage.js',   "ENQUIRE_BASE + String(owner.routing_handle || '').toUpperCase()"],
  ['src/lib/vendor/weddings.js',      'ENQUIRE_BASE + String(v.routing_handle)'],
  ['src/api/couple/discover.js',      '`${ENQUIRE_BASE}${h.routing_handle}`'],
  ['src/api/couple/discover.js',      '`${ENQUIRE_BASE}${v.routing_handle}`'],
  ['src/api/couple/muse.js',          '`${ENQUIRE_BASE}${s.vendor.routing_handle}`'],
  ['src/api/circle/muse.js',          '`${ENQUIRE_BASE}${s.vendor.routing_handle}`'],
];
// Emitters that are NOT a real vendor's link, named so the census can say so (FE_2 ruling (a)).
const NOT_EMITTERS = [
  ['src/api/public/vendorCard.js', 'enquire_link || null', 'card() copies the link it was handed'],
  ['src/api/public/vendorCard.js', 'd.whatsapp_phone',     'the demo card'],
  ['src/api/demo/vendor.js',       'v.whatsapp_phone',     'the demo vendor'],
  ['src/lib/discover/shapeDemoRow.js', 'null',             'a demo row'],
];

function censusOf(fileText) {
  // every `enquire_link:` with its whole expression (to the first line ending in ',' at depth 0)
  const lines = fileText.split('\n'); const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/enquire_link\s*:\s*(.*)$/);
    if (!m || /^\s*\/\//.test(lines[i])) continue;
    let expr = m[1]; let depth = 0; let j = i;
    const bal = (t) => { for (const ch of t) { if ('([{'.includes(ch)) depth += 1; if (')]}'.includes(ch)) depth -= 1; } };
    bal(expr);
    while (!(depth <= 0 && /,\s*(\/\/.*)?$/.test(lines[j])) && j < i + 6) { j += 1; expr += ' ' + lines[j].trim(); bal(lines[j]); }
    out.push({ line: i + 1, expr });
  }
  return out;
}
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(P(dir), { withFileTypes: true })) {
    const r = path.join(dir, e.name);
    if (e.isDirectory()) { if (r === 'src/engine') continue; walk(r, acc); } else if (r.endsWith('.js')) acc.push(r);
  }
  return acc;
}

// ── the Postgres-shaped double for /me ────────────────────────────────────────────────────────────
function fakePlane(vendorRow) {
  const writes = [];
  const pick = (row, cols) => { const o = {}; for (const c of cols.split(',').map((x) => x.trim())) o[c] = row[c] === undefined ? null : row[c]; return o; };
  const from = (table) => {
    let op = 'select'; let cols = '*'; let payload = null;
    const q = {
      select(c) { cols = c || '*'; return q; }, update(p) { op = 'update'; payload = p; return q; },
      eq() { return q; }, maybeSingle() { return q; },
      then(res, rej) {
        return Promise.resolve((() => {
          if (table === 'users') return { data: { name: 'Dev Roy' }, error: null };
          if (op === 'update') {
            for (const [k, allowed] of [['enquiry_routing', ['tdw', 'own_number', 'own_waba']]]) if (payload[k] !== undefined && !allowed.includes(payload[k])) return { data: null, error: { code: '23514', message: 'violates check constraint' } };
            writes.push({ ...payload }); Object.assign(vendorRow, payload);
          }
          return { data: cols === '*' ? { ...vendorRow } : pick(vendorRow, cols), error: null };
        })()).then(res, rej);
      },
    };
    return q;
  };
  return { from, writes, row: vendorRow };
}
function loadMe(src) {
  const TARGET = P('src/api/vendor/me.js');
  const m = new Module(TARGET, null); m.filename = TARGET; m.paths = Module._nodeModulePaths(path.dirname(TARGET));
  const real = Module._resolveFilename;
  Module._resolveFilename = function (req, ...rest) {
    if (req === '../middleware/requireAuth' || /middleware\/requireAuth$/.test(req)) return require.resolve(P('scripts/_noop_middleware.js'));
    return real.call(this, req, ...rest);
  };
  try { m._compile(src, TARGET); } finally { Module._resolveFilename = real; }
  return m.exports;
}
function handler(router, key) {
  for (const layer of router.stack) {
    const p = layer.route && layer.route.path; if (!p) continue;
    for (const meth of Object.keys(layer.route.methods)) if (`${meth.toUpperCase()} ${p}` === key) { const st = layer.route.stack; return st[st.length - 1].handle; }
  }
  return null;
}
async function patch(router, row, body) {
  const plane = fakePlane(row);
  const req = { app: { locals: { supabase: plane } }, vendor: { user_id: 'u1', ...row }, body };
  let status = 200; let json = null; let err = null;
  const res = { status(s) { status = s; return res; }, json(j) { json = j; return res; } };
  // asyncHandler does not return its promise, so the handler is awaited by its RESPONSE: poll until the
  // route answered or passed an error on, and never read a half-run route as its answer.
  handler(router, 'PATCH /')(req, res, (e) => { err = e; });
  for (let i = 0; i < 200 && json === null && err === null; i += 1) await new Promise((ok) => setImmediate(ok));
  return { status, json, err, writes: plane.writes, row: plane.row };
}
const V0 = () => ({ id: 'v1', user_id: 'u1', business_name: 'Dev Roy Photography', enquiry_routing: 'tdw', enquiry_phone: null, peer_discoverable: true });

(async () => {
  sec('1  the census: every real-vendor enquire_link routes through the resolver');
  const files = walk('src');
  const all = []; for (const f of files) for (const c of censusOf(read(f))) all.push({ f, ...c });
  const routed = all.filter((c) => /enquireLinkFor\(/.test(c.expr));
  const excused = all.filter((c) => !/enquireLinkFor\(/.test(c.expr) && NOT_EMITTERS.some(([f, s]) => f === c.f && c.expr.includes(s)));
  const stray = all.filter((c) => !/enquireLinkFor\(/.test(c.expr) && !excused.includes(c));
  ok(stray.length === 0, '1.1 no enquire_link in src outside the demo emitters is built without enquireLinkFor', stray.map((c) => `${c.f}:${c.line}`).join(' '));
  ok(routed.length === SITES.length, `1.2 exactly ${SITES.length} routed sites (a new emitter must be added here on purpose)`, routed.map((c) => `${c.f}:${c.line}`).join(' '));
  ok(excused.length === NOT_EMITTERS.length, '1.3 each named non-emitter is found once (the demo emitters and the card copy)', excused.map((c) => `${c.f}:${c.line}`).join(' '));
  const wt = read('src/api/public/weddingTeam.js');
  ok(wt === atBase('src/api/public/weddingTeam.js') && !/enquire_link\s*:/.test(wt), '1.4 weddingTeam.js is byte-identical to the base and emits no enquire_link (ownerEnquireLink is not a surface)');

  sec('2  rung 1 is byte-identical on every surface, by construction');
  const bad = SITES.filter(([f, expr]) => !atBase(f).includes(expr) || !read(f).includes(`tdwLink: ${expr},`));
  ok(bad.length === 0, '2.1 each site\u2019s OLD expression (read from a7e90bf) is passed verbatim as tdwLink', bad.map((b) => b.join(' ')).join(' | '));
  const SV = fresh('src/lib/discover/shapeVendor.js');
  const X = ['https://wa.me/917982159047?text=TDW-DEV440', 'https://wa.me/917982159047?text=TDW-', 'https://wa.me/917982159047?text=TDW-null', null];
  const same = X.every((x) => [undefined, 'tdw', 'own_waba', 'bogus', null].every((r) => SV.enquireLinkFor({ tdwLink: x, enquiry_routing: r, enquiry_phone: '+91 87577 88550' }) === x));
  ok(same, '2.2 for tdw, own_waba (until 2b), unknown or absent, the resolver returns the caller\u2019s tdwLink unchanged, even an empty handle\u2019s link and null');
  ok(SV.enquireLinkFor({ tdwLink: X[0], enquiry_routing: 'own_number', enquiry_phone: '+91 87577 88550' }) === 'https://wa.me/918757788550'
    && SV.enquireLinkFor({ tdwLink: X[0], enquiry_routing: 'own_number', enquiry_phone: '12' }) === X[0]
    && SV.enquireLinkFor({ handle: 'DEV440' }) === `${SV.ENQUIRE_BASE}DEV440`,
    '2.3 rung 2 sends to her digits; a non-phone falls back to rung 1; the handle form (2a\u2019s) is unchanged');
  ok(SV.enquireLinkFor({ tdwLink: X[0], enquiry_routing: 'own_number', enquiry_phone: '8757788550' }) === 'https://wa.me/918757788550'
    && /require\('\.\.\/phone'\)/.test(read('src/lib/discover/shapeVendor.js')),
    '2.4 F-44.154: a raw 10-digit value already stored (the founder\u2019s own, from FE2_1\u2019s walk) links with +91, through toE164');

  sec('3  every select feeding an emitter names both columns');
  const has = (f, re) => re.test(read(f));
  const COLS = 'enquiry_routing, enquiry_phone';
  ok(has('src/api/couple/discover.js', new RegExp(`travel_notes, ${COLS}'`)) && has('src/api/couple/discover.js', new RegExp(`'id, business_name, routing_handle, ${COLS}'`))
    && has('src/api/couple/discover.js', /\.select\('routing_handle, enquiry_routing, enquiry_phone'\)\.in\('routing_handle', handles\)/),
    '3.1 the deck, the heroes\u2019 fallback and the heroes\u2019 handle read');
  ok(has('src/api/couple/muse.js', new RegExp(`routing_handle, ${COLS}\\)`)) && has('src/api/circle/muse.js', new RegExp(`routing_handle, ${COLS}\\)`)), '3.2 both muse lists (their nested vendor reads)');
  ok(has('src/api/public/vendorCard.js', new RegExp(`seo_description, ${COLS}'`)) && (read('src/api/public/weddingPage.js').match(new RegExp(`discover_paused, ${COLS}'`, 'g')) || []).length === 2
    && has('src/lib/vendor/weddings.js', new RegExp(`discover_paused, ${COLS}'`)), '3.3 /v/, both wedding-page owner reads, and her weddings');
  ok(/\.from\('vendors'\)\.select\('\*'\)/.test(read('src/api/admin/discover.js')) && /resolveVendor/.test(read('src/api/vendor/discover.js')),
    '3.4 the previews read the whole row (admin select(\'*\'); the vendor\u2019s own via resolveVendor)');

  ok(/enquiry_phone: null,\n(?:.*\n){0,8}?\s*enquire_link:\s+enquireLinkFor\(\{ tdwLink: ENQUIRE_BASE \+ String\(v\.routing_handle\)/.test(read('src/api/public/vendorCard.js')),
    '3.5 FK4: the real-vendor card still passes its own enquiry_phone key as the literal null; her number rides only inside enquire_link');

  sec('4  /me, driven for real');
  const ME = read('src/api/vendor/me.js');
  const router = loadMe(ME);
  const v = router.validateEnquiryRouting;
  ok(typeof v === 'function' && /'enquiry_routing', 'enquiry_phone'\];/.test(ME) && !/LOCKED_FIELDS\s*=\s*\[[^\]]*enquiry/.test(ME), '4.1 both fields are on the one writer\u2019s allowed list, neither is locked');
  let r = await patch(router, V0(), { enquiry_routing: 'own_waba' });
  ok(r.status === 400 && r.json && r.json.code === 'ENQUIRY_ROUTING' && r.writes.length === 0, '4.2 own_waba is refused until 2b, nothing written', JSON.stringify(r.json));
  r = await patch(router, V0(), { enquiry_routing: 'own_number' });
  ok(r.status === 400 && r.writes.length === 0, '4.3 own_number without a phone is refused, nothing written');
  r = await patch(router, V0(), { enquiry_routing: 'own_number', enquiry_phone: '  +91 87577 88550 ' });
  // AMENDED BY LABEL · FE_2b, F-44.154: the phone is stored through toE164 (was: trimmed as typed).
  ok(r.status === 200 && r.writes.length === 1 && r.row.enquiry_phone === '+918757788550' && r.json.vendor.enquiry_routing === 'own_number' && r.json.vendor.enquiry_phone === '+918757788550',
    '4.4 own_number with a phone in the same write: saved through toE164, the DOOR echoes both (FK5)', JSON.stringify(r.json && r.json.vendor));
  // F-44.154 · one cell per form the founder might type: every one lands as the estate's E.164.
  const forms = [['8757788550', '+918757788550'], ['+91 87577 88550', '+918757788550'], ['918757788550', '+918757788550'], ['+1 415 555 0123', '+14155550123']];
  for (const [typed, want] of forms) {
    const x = await patch(router, V0(), { enquiry_routing: 'own_number', enquiry_phone: typed });
    ok(x.status === 200 && x.row.enquiry_phone === want, `4.4.${typed.replace(/\D/g, '').length} "${typed}" is stored as ${want} (toE164, the one home)`, JSON.stringify(x.row.enquiry_phone));
  }
  r = await patch(router, { ...V0(), enquiry_phone: '9888294440' }, { enquiry_routing: 'own_number' });
  ok(r.status === 200 && r.json.vendor.enquiry_routing === 'own_number', '4.5 own_number with the phone already on her row: saved');
  r = await patch(router, { ...V0(), enquiry_routing: 'own_number', enquiry_phone: '9888294440' }, { enquiry_routing: 'tdw' });
  ok(r.status === 200 && r.json.vendor.enquiry_routing === 'tdw', '4.6 back to tdw: immediate, no phone needed');
  r = await patch(router, { ...V0(), enquiry_routing: 'own_number', enquiry_phone: '9888294440' }, { enquiry_phone: '' });
  ok(r.status === 400 && r.writes.length === 0, '4.7 clearing the phone while own_number stands is refused (the link would break)');
  const phones = ['123456789', '1234567890123456', 'abc1234567890', 12345678901];
  const refusals = [];
  for (const p of phones) { const x = await patch(router, V0(), { enquiry_phone: p }); if (x.status !== 400 || x.writes.length) refusals.push(String(p)); }
  ok(refusals.length === 0, '4.8 a phone of 9 or 16 digits, letters, or not text: refused', refusals.join(','));
  r = await patch(router, { ...V0(), enquiry_routing: 'own_waba' }, { business_name: 'Dev Roy Photography' });
  ok(r.status === 200 && r.json.vendor.enquiry_routing === 'tdw', '4.9 a row holding anything but own_number is echoed as tdw (never a rung the links will not honour)');
  ok(/enquiry_routing:\s+vendor\.enquiry_routing === 'own_number' \? 'own_number' : 'tdw',/.test(ME), '4.10 the GET shape coerces the same way');

  sec('5  the schema doc names 0171 (e-107)');
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  ok(/STALE BY A THIRD SINCE 24 SEPTEMBER 2026: `0171_own_number\.sql`/.test(doc) && /vendor_wabas/.test(doc) && /enquiry_routing/.test(doc), '5.1 the staleness note names 0171, its tables and its columns');

  sec('6  mutations of production code (each must turn its cell red; restored by sha)');
  const mutate = async (rel, from, to, stillHolds) => {
    const src = read(rel); const before = sha(src); const m = src.replace(from, to);
    if (m === src) return { applied: false };
    fs.writeFileSync(P(rel), m);
    let red; try { red = !(await stillHolds(m)); } catch (_e) { red = true; } finally { fs.writeFileSync(P(rel), src); }
    return { applied: true, red, restored: sha(read(rel)) === before };
  };
  const res = [];
  res.push(['M1 the validator not called', await mutate('src/api/vendor/me.js', "    const erErr = validateEnquiryRouting(update, vendor);\n    if (erErr) return errRes(res, 400, erErr, 'ENQUIRY_ROUTING');\n", '',
    async (m) => { const x = await patch(loadMe(m), V0(), { enquiry_routing: 'own_waba' }); return x.status === 400; })]);
  res.push(['M2 the resolver ignores tdwLink', await mutate('src/lib/discover/shapeVendor.js', 'const tdw = tdwLink !== undefined ? tdwLink : (handle ? `${ENQUIRE_BASE}${handle}` : null);', 'const tdw = handle ? `${ENQUIRE_BASE}${handle}` : null;',
    async () => fresh('src/lib/discover/shapeVendor.js').enquireLinkFor({ tdwLink: X[1], enquiry_routing: 'tdw' }) === X[1])]);
  res.push(['M3 rung 2 dropped', await mutate('src/lib/discover/shapeVendor.js', "  if (enquiry_routing === 'own_number') { const d = digits(enquiry_phone); return d ? `https://wa.me/${d}` : tdw; }\n", '',
    async () => fresh('src/lib/discover/shapeVendor.js').enquireLinkFor({ tdwLink: X[0], enquiry_routing: 'own_number', enquiry_phone: '+91 87577 88550' }) === 'https://wa.me/918757788550')]);
  res.push(['M4 a muse emitter left unrouted', await mutate('src/api/circle/muse.js', 'enquireLinkFor({ tdwLink: `${ENQUIRE_BASE}${s.vendor.routing_handle}`, enquiry_routing: s.vendor.enquiry_routing, enquiry_phone: s.vendor.enquiry_phone })', '`${ENQUIRE_BASE}${s.vendor.routing_handle}`',
    async () => { const a = []; for (const f of walk('src')) for (const c of censusOf(read(f))) a.push({ f, ...c }); return a.filter((c) => !/enquireLinkFor\(/.test(c.expr) && !NOT_EMITTERS.some(([nf, s]) => nf === c.f && c.expr.includes(s))).length === 0; })]);
  res.push(['M5 the echo trusts the row raw', await mutate('src/api/vendor/me.js', "      enquiry_routing: updated.enquiry_routing === 'own_number' ? 'own_number' : 'tdw',", '      enquiry_routing: updated.enquiry_routing,',
    async (m) => { const x = await patch(loadMe(m), { ...V0(), enquiry_routing: 'own_waba' }, { business_name: 'x' }); return x.json.vendor.enquiry_routing === 'tdw'; })]);
  res.push(['M6 the resolver skips toE164', await mutate('src/lib/discover/shapeVendor.js', "String(toE164(String(p || '').trim()) || '')", "String(p || '')",
    async () => fresh('src/lib/discover/shapeVendor.js').enquireLinkFor({ tdwLink: X[0], enquiry_routing: 'own_number', enquiry_phone: '8757788550' }) === 'https://wa.me/918757788550')]);
  res.push(['M7 the door stores the phone as typed', await mutate('src/api/vendor/me.js', '      update.enquiry_phone = toE164(t);\n', '      update.enquiry_phone = t;\n',
    async (m) => { const x = await patch(loadMe(m), V0(), { enquiry_routing: 'own_number', enquiry_phone: '8757788550' }); return x.row.enquiry_phone === '+918757788550'; })]);
  for (const [name, x] of res) ok(x.applied && x.red && x.restored, `6 ${name}: applies, turns its cell red, restored by sha`, JSON.stringify(x));

  console.log(`\nb124 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.log(`b124 CRASHED: ${(e && e.stack) || e}`); process.exit(1); });
