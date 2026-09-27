'use strict';
// scripts/b136b_igd2_meta_refusal_bench.js · TDW CE-46 · IGD-2 · the metaRefusal cut (the chair's ruling after M4's walk refusal).
// WHAT IT HOLDS: at both Meta refusal homes in src/lib/vendor/ig*.js (igOAuth.js's metaRefusal, which every leg shares, and the
// photo list's inline refusal) Meta's error.message, error_subcode and fbtrace_id reach the LOG line; the returned `error` string
// (which can reach the vendor, ig.js :228) is byte-unchanged; no secret, code or token ever reaches the log. fetch is faked; no
// network, no key. `--mutate` compiles each production mutation IN MEMORY (A-45.4) and requires its named cell to redden.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const REL = 'src/lib/vendor/igOAuth.js';
const MUTATE = process.argv.includes('--mutate');

function load(src) { const f = path.join(ROOT, REL); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }

const SECRET = 'SECRET_b136b_never_logged';
const CODE = 'AUTHCODE_b136b_never_logged';
const SHORT = 'SHORTTOKEN_b136b_never_logged';
const LONGTOK = 'IGQVJ' + 'x'.repeat(60);
const META_BODY = { error: { message: `Unsupported request - the account has not accepted its role (${LONGTOK})`, type: 'OAuthException', code: 100, error_subcode: 33, fbtrace_id: 'AxYz_b136b' } };

async function capture(fn) {
  const logs = []; const w = console.warn; const l = console.log; const e = console.error;
  console.warn = (...a) => logs.push(a.join(' ')); console.log = (...a) => logs.push(a.join(' ')); console.error = (...a) => logs.push(a.join(' '));
  try { const r = await fn(); return { r, logs }; } finally { console.warn = w; console.log = l; console.error = e; }
}

async function cells(o) {
  const R = []; const ok = (c, name) => R.push({ name, pass: !!c });
  process.env.IG_APP_SECRET = SECRET; process.env.IG_APP_ID = '3183424141854127'; process.env.IG_REDIRECT_URI = 'https://x/cb';
  global.fetch = async () => ({ ok: false, status: 400, json: async () => META_BODY });

  // 1 · the detail
  const d = o.metaDetail(META_BODY);
  ok(/has not accepted its role/.test(d) && /subcode 33/.test(d) && /fbtrace AxYz_b136b/.test(d), '1.1 the detail carries Meta\u2019s message, subcode and fbtrace');
  ok(!d.includes(LONGTOK) && /\[masked\]/.test(d), '1.2 a token-like run inside Meta\u2019s message is masked');
  ok(o.metaDetail({ error: { message: 'y '.repeat(400) } }).length <= 300 && o.metaDetail(null) === 'no error body', '1.3 the message is cut to 300 characters; no body says so');

  // 2 · the long-lived exchange (M4's refusal)
  let c = await capture(() => o.exchangeForLongLived(SHORT));
  const line2 = c.logs.find((x) => x.startsWith('[ig:meta] token exchange refused (400, 100)')) || '';
  ok(/has not accepted its role/.test(line2) && /subcode 33/.test(line2) && /fbtrace AxYz_b136b/.test(line2), '2.1 the token exchange\u2019s refusal logs Meta\u2019s reason');
  ok(c.r && c.r.ok === false && c.r.error === 'Instagram refused the token exchange (400, 100).' && c.r.http_status === 400, '2.2 the returned error string is byte-unchanged');
  ok(c.logs.every((x) => !x.includes(SECRET) && !x.includes(SHORT) && !x.includes(LONGTOK)), '2.3 no secret or token in any log line');

  // 3 · the sign-in leg (the code exchange)
  c = await capture(() => o.exchangeCode(CODE));
  ok(c.logs.some((x) => x.startsWith('[ig:meta] sign-in refused (400, 100)') && /subcode 33/.test(x)) && c.r.error === 'Instagram refused the sign-in (400, 100).', '3.1 the sign-in refusal logs its reason; its error unchanged');
  ok(c.logs.every((x) => !x.includes(SECRET) && !x.includes(CODE)), '3.2 neither the secret nor the code is logged');

  // 4 · the photo list's own refusal home
  c = await capture(() => o.listInstagramMedia(LONGTOK));
  ok(c.logs.some((x) => x.startsWith('[ig:meta] photo list refused (400, 100)') && /fbtrace AxYz_b136b/.test(x)), '4.1 the photo list\u2019s refusal logs its reason');
  ok(c.r && c.r.error === 'Instagram refused the photo list (400, 100).' && c.logs.every((x) => !x.includes(LONGTOK)), '4.2 its error unchanged; the token (in its URL) never logged');
  return R;
}

const MUTATIONS = [
  { id: 'M1', from: "  logMetaRefusal(where, res.status, code, body);\n  return {", to: '  return {', cell: '2.1' },
  { id: 'M2', from: "      logMetaRefusal('photo list', res.status, code, body);", to: '', cell: '4.1' },
  { id: 'M3', from: ".replace(/[A-Za-z0-9_\\-|.]{40,}/g, '[masked]')", to: '', cell: '1.2' },
  { id: 'M4', from: "error: `Instagram refused the ${where} (${res.status}${code ? `, ${code}` : ''}).`,", to: "error: `Instagram refused the ${where} (${res.status}${code ? `, ${code}` : ''}). ${metaDetail(body)}`,", cell: '2.2' },
  { id: 'M5', from: "const sub = e.error_subcode !== undefined && e.error_subcode !== null ? ` · subcode ${String(e.error_subcode).slice(0, 20)}` : '';", to: "const sub = '';", cell: '1.1' },
];

(async () => {
  const src = fs.readFileSync(path.join(ROOT, REL), 'utf8');
  let fail = 0;
  const base = await cells(load(src));
  console.log('b136b \u00b7 Meta\u2019s refusal reason reaches the log (CE-46 IGD-2)');
  for (const x of base) { console.log(`  ${x.pass ? 'PASS' : 'FAIL'}  ${x.name}`); if (!x.pass) fail += 1; }
  console.log(`\nb136b: ${base.length - fail} passed, ${fail} failed`);
  if (MUTATE) {
    let mf = 0;
    console.log('\nmutations (each must redden its cell; nothing on disk is written)');
    for (const m of MUTATIONS) {
      let red = false; let why = '';
      try {
        if (src.indexOf(m.from) < 0) throw new Error('anchor not found');
        const res = await cells(load(src.replace(m.from, m.to)));
        const c = res.find((x) => x.name.startsWith(`${m.cell} `)); red = !!c && !c.pass;
      } catch (e) { why = e.message; }
      console.log(`  ${red ? 'RED (good)' : 'GREEN (BAD)'}  ${m.id} -> cell ${m.cell}${why ? `  [${why}]` : ''}`);
      if (!red) mf += 1;
    }
    console.log(`\nb136b --mutate: ${MUTATIONS.length - mf} of ${MUTATIONS.length} reddened`);
    fail += mf;
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b136b threw:', e && e.stack); process.exit(1); });
