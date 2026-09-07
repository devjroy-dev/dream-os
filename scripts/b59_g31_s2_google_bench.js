#!/usr/bin/env node
// scripts/b59_g31_s2_google_bench.js
// TDW · BLOCK 19 · G3.1 sitting 2 — THE GOOGLE DOOR, THE VAULT, THE WINDOWS, THE META.
//
// Run: node scripts/b59_g31_s2_google_bench.js        (no network, no DB)
//
// Every cell asks a SURFACE question — what a caller receives — never a path
// question about what a constant contains. The three mutations at the foot
// each name the cells that go RED when the production line is reversed; run
// them by hand (R-40 both-ways law) before claiming the bench proves anything.

'use strict';
const path   = require('path');
const crypto = require('crypto');
const R = (p) => path.join(__dirname, '..', p);

let pass = 0, fail = 0; const fails = [];
function sec(t) { console.log(`\n${t}`); }
function ok(name)      { pass++; console.log(`  GREEN  ${name}`); }
function no(name, why) { fail++; fails.push(`${name} — ${why}`); console.log(`  RED    ${name} — ${why}`); }
function cell(name, fn) { try { const r = fn(); if (r === true) ok(name); else no(name, String(r)); } catch (e) { no(name, e && e.message); } }
async function acell(name, fn) { try { const r = await fn(); if (r === true) ok(name); else no(name, String(r)); } catch (e) { no(name, e && e.message); } }
function fresh(mod) { const p = require.resolve(R(mod)); delete require.cache[p]; return require(p); }

// A supabase double: records writes, answers selects from a tiny store.
function fakeDb(store = {}) {
  const writes = [];
  const q = (table) => {
    const st = { table, op: null, payload: null, filters: [] };
    const chain = {
      select(cols) { st.op = st.op || 'select'; st.cols = cols; return chain; },
      upsert(p, o) { st.op = 'upsert'; st.payload = p; st.opts = o; writes.push({ table, op: 'upsert', payload: p, opts: o }); return chain; },
      update(p)    { st.op = 'update'; st.payload = p; writes.push({ table, op: 'update', payload: p }); return chain; },
      delete()     { st.op = 'delete'; writes.push({ table, op: 'delete' }); return chain; },
      eq(k, v)     { st.filters.push([k, v]); return chain; },
      is(k, v)     { st.filters.push([k, v]); return chain; },
      insert(p)    { st.op = 'insert'; st.payload = p; writes.push({ table, op: 'insert', payload: p }); return chain; },
      order()      { return chain; }, limit() { return chain; },
      maybeSingle() { const row = (store[table] || [])[0] || null; return Promise.resolve({ data: row, error: null }); },
      then(resolve) { resolve({ data: store[table] || [], error: null }); },
    };
    return chain;
  };
  return { from: q, writes };
}

(async () => {

// ═══ §1 · THE VAULT ═══════════════════════════════════════════════════════════
sec('\u00a71 \u00b7 tokenVault \u2014 a grant is never stored in clear');
delete process.env.INTEGRATION_TOKEN_KEY;
let V = fresh('src/lib/vendor/tokenVault.js');
cell('§1.1 no key → not configured', () => V.isConfigured() === false);
cell('§1.2 no key → seal THROWS, it does not fall back to plaintext', () => { try { V.seal('t'); return 'sealed without a key'; } catch { return true; } });
process.env.INTEGRATION_TOKEN_KEY = crypto.randomBytes(20).toString('base64');
V = fresh('src/lib/vendor/tokenVault.js');
cell('§1.3 a 20-byte key is "not configured", not "close enough"', () => V.isConfigured() === false);
process.env.INTEGRATION_TOKEN_KEY = crypto.randomBytes(32).toString('base64');
V = fresh('src/lib/vendor/tokenVault.js');
const SECRET = '1//0g-refresh-token-' + crypto.randomBytes(8).toString('hex');
const sealed = V.seal(SECRET);
cell('§1.4 32-byte base64 key → configured', () => V.isConfigured() === true);
cell('§1.5 the sealed value does not contain the secret', () => !sealed.includes(SECRET) && !sealed.includes(SECRET.slice(4, 20)));
cell('§1.6 the sealed value is versioned v1.iv.tag.ct', () => sealed.split('.').length === 4 && sealed.startsWith('v1.'));
cell('§1.7 open() returns the secret under the same key', () => { const o = V.open(sealed); return o.ok && o.value === SECRET; });
cell('§1.8 two seals of one secret differ (fresh IV)', () => V.seal(SECRET) !== sealed);
cell('§1.9 a flipped ciphertext byte fails to open (GCM tag) — ok:false, no throw', () => {
  const parts = sealed.split('.'); const ct = Buffer.from(parts[3], 'base64url'); ct[0] ^= 0xff; parts[3] = ct.toString('base64url');
  const o = V.open(parts.join('.')); return o.ok === false;
});
process.env.INTEGRATION_TOKEN_KEY = crypto.randomBytes(32).toString('hex');
V = fresh('src/lib/vendor/tokenVault.js');
cell('§1.10 a different (hex) key does not open the old value', () => V.open(sealed).ok === false);
cell('§1.11 a 64-hex key is accepted as 32 bytes', () => V.isConfigured() === true);

// ═══ §2 · THE GATE AND THE STATE ══════════════════════════════════════════════
sec('\u00a72 \u00b7 googleOAuth \u2014 the gate is the redirect path, the state is signed');
delete process.env.GOOGLE_OAUTH_CLIENT_ID; delete process.env.GOOGLE_OAUTH_CLIENT_SECRET; delete process.env.GOOGLE_OAUTH_REDIRECT_URI;
process.env.IG_APP_SECRET = process.env.IG_APP_SECRET || 'bench-ig-secret';
let G = fresh('src/lib/vendor/googleOAuth.js');
cell('§2.1 no keys → closed', () => G.isConfigured() === false);
process.env.GOOGLE_OAUTH_CLIENT_ID = 'id.apps.googleusercontent.com'; process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'GOCSPX-bench';
process.env.GOOGLE_OAUTH_REDIRECT_URI = 'https://dream-os-production.up.railway.app/api/v2/vendor/google/callback';   // the STUB's path, not the mounted one
G = fresh('src/lib/vendor/googleOAuth.js');
cell('§2.2 keys present but the URI path is not the mounted route → closed (F-40.255)', () => G.isConfigured() === false);
process.env.GOOGLE_OAUTH_REDIRECT_URI = 'https://dream-os-production.up.railway.app' + G.GOOGLE_CALLBACK_PATH;
G = fresh('src/lib/vendor/googleOAuth.js');
cell('§2.3 keys + the canonical path → open', () => G.isConfigured() === true);
cell('§2.4 the canonical path is under core.js\u2019s /solutions mount', () => G.GOOGLE_CALLBACK_PATH === '/api/v2/vendor/solutions/google/callback');
const { state, nonce } = G.mintState('v-bench');
const au = new URL(G.authorizeUrl(state));
cell('§2.5 authorize URL is Google\u2019s, offline, consent, both Search Console scopes', () =>
  au.hostname === 'accounts.google.com' && au.searchParams.get('access_type') === 'offline' && au.searchParams.get('prompt') === 'consent'
  && /siteverification/.test(au.searchParams.get('scope')) && /webmasters\.readonly/.test(au.searchParams.get('scope')) && au.searchParams.get('state') === state);
cell('§2.6 the client secret is NOT in the authorize URL', () => !au.toString().includes('GOCSPX'));
cell('§2.7 the state verifies to the vendor and nonce it was minted for', () => { const v = G.verifyState(state); return v.ok && v.vendorId === 'v-bench' && v.nonce === nonce; });
cell('§2.8 a tampered state is refused', () => G.verifyState(state.slice(0, -2) + 'zz').ok === false);

// ═══ §3 · THE DOOR ════════════════════════════════════════════════════════════
sec('\u00a73 \u00b7 the six addresses \u2014 closed → 503, and no token on any wire');
const gc = fresh('src/lib/vendor/googleConnection.js');
cell('§3.1 SAFE_COLUMNS does not name the ciphertext column', () => !gc.SAFE_COLUMNS.split(',').map((s) => s.trim()).includes('refresh_token_enc'));
const routerSrc = require('fs').readFileSync(R('src/api/vendor/solutions/google.js'), 'utf8').replace(/\/\/.*$/gm, '');
cell('§3.2 the callback is a GET (F-40.255)', () => /router\.get\(\s*'\/callback'/.test(routerSrc) && !/router\.post\(\s*'\/callback'/.test(routerSrc));
cell('§3.3 every gated handler tests isConfigured (connect, callback, sync)', () => (routerSrc.match(/isConfigured\(\)/g) || []).length >= 3);
cell('§3.4 no handler ever selects the ciphertext column', () => !/refresh_token_enc/.test(routerSrc));
cell('§3.5 index.js mounts /google AFTER its bare GET /google', () => {
  const idx = require('fs').readFileSync(R('src/api/vendor/solutions/index.js'), 'utf8');
  return idx.indexOf("router.get('/google'") < idx.indexOf("router.use('/google'");
});
// saveGrant seals; the write carries ciphertext only
process.env.INTEGRATION_TOKEN_KEY = crypto.randomBytes(32).toString('base64');
const gc2 = fresh('src/lib/vendor/googleConnection.js');
const db = fakeDb();
await acell('§3.6 saveGrant writes refresh_token_enc, never refresh_token, onConflict vendor_id (0147 §1 UNIQUE)', async () => {
  const r = await gc2.saveGrant(db, 'v1', { sub: 's', email: 'e@x', scope: 'sc', refreshToken: SECRET });
  const w = db.writes[0];
  return r.ok && w.table === 'vendor_google_connections' && w.opts.onConflict === 'vendor_id' && typeof w.payload.refresh_token_enc === 'string'
    && !w.payload.refresh_token_enc.includes(SECRET) && !('refresh_token' in w.payload);
});
await acell('§3.7 getStatus answers null (not a row) when connected_at is absent', async () => {
  const d2 = fakeDb({ vendor_google_connections: [{ vendor_id: 'v1', google_email: 'e@x', connected_at: null }] });
  const st = await gc2.getStatus(d2, 'v1'); return st.ok && st.row === null;
});

// ═══ §3b · THE HOUSE ROW (F-40.261 a) ════════════════════════════════════════
sec('\u00a73b \u00b7 the house grant \u2014 vendor_id NULL, gated by Google\u2019s own sign-in');
cell('§3b.1 HOUSE is null, HOUSE_STATE_ID is not a uuid, the house email and property are one home each', () =>
  gc2.HOUSE === null && G.HOUSE_STATE_ID === 'house' && G.HOUSE_GOOGLE_EMAIL === 'dev@thedreamwedding.in' && G.HOUSE_SC_PROPERTY === 'sc-domain:thedreamwedding.in');
await acell('§3b.2 saveGrant(HOUSE) with no house row INSERTS vendor_id:null (never an onConflict upsert)', async () => {
  const d3 = fakeDb(); const r = await gc2.saveGrant(d3, gc2.HOUSE, { sub: 's', email: G.HOUSE_GOOGLE_EMAIL, scope: 'sc', refreshToken: SECRET });
  const w = d3.writes.find((x) => x.op === 'insert'); return r.ok && w && w.payload.vendor_id === null && !d3.writes.some((x) => x.op === 'upsert');
});
await acell('§3b.3 saveGrant(HOUSE) with a house row UPDATES by id', async () => {
  const d4 = fakeDb({ vendor_google_connections: [{ id: 'h-1' }] }); const r = await gc2.saveGrant(d4, gc2.HOUSE, { sub: 's', email: 'x', scope: 'sc', refreshToken: SECRET });
  const w = d4.writes.find((x) => x.op === 'update'); return r.ok && w && !('vendor_id' in w.payload) && !d4.writes.some((x) => x.op === 'insert');
});
cell('§3b.4 the callback refuses a house state completed by any other account (source: not_house)', () => /not_house/.test(routerSrc) && /HOUSE_GOOGLE_EMAIL/.test(routerSrc));
cell('§3b.5 the consent screen names userinfo.email in full (infra item 13)', () => /auth\/userinfo\.email/.test(G.GOOGLE_SCOPE) && /^openid /.test(G.GOOGLE_SCOPE));
await acell('§3b.6 pull() on the house arm with no house row → no_house, and writes nothing', async () => {
  const SCx = fresh('src/lib/vendor/searchConsole.js'); const d5 = fakeDb();
  const r = await SCx.pull(d5, 'v1', { handle: 'dev440' }); return r.ok === false && r.reason === 'no_house' && d5.writes.length === 0;
});
await acell('§3b.7 pull() on the own arm with no vendor row → not_connected (no_property is gone from the house path)', async () => {
  const SCx = fresh('src/lib/vendor/searchConsole.js'); const d6 = fakeDb();
  const r = await SCx.pull(d6, 'v1', { arm: 'own' }); return r.ok === false && r.reason === 'not_connected';
});

// ═══ §4 · THE TWO NAMED WINDOWS (R-40.123) ════════════════════════════════════
sec('\u00a74 \u00b7 searchConsole.windows \u2014 last_28 and prior_28 are sums, never stored');
const SC = fresh('src/lib/vendor/searchConsole.js');
cell('§4.1 no rows → has_data:false and both windows null (the F-40.138 state)', () => { const w = SC.windows([]); return w.has_data === false && w.last_28 === null && w.prior_28 === null; });
const rows = []; const end = new Date('2026-09-04T00:00:00Z');
for (let i = 0; i < 60; i++) { const d = new Date(end); d.setUTCDate(d.getUTCDate() - i); rows.push({ day: d.toISOString().slice(0, 10), impressions: i < 28 ? 10 : 3, clicks: i < 28 ? 1 : 0 }); }
const w = SC.windows(rows);
cell('§4.2 window_end is the newest day present, not today', () => w.window_end === '2026-09-04');
cell('§4.3 last_28 sums exactly 28 days (280 / 28)', () => w.last_28.impressions === 280 && w.last_28.clicks === 28);
cell('§4.4 prior_28 sums the 28 before, none of the 4 older days (84 / 0)', () => w.prior_28.impressions === 84 && w.prior_28.clicks === 0);
cell('§4.5 the windows are named last_28 / prior_28 — the room\u2019s "the 28 before"', () => 'last_28' in w && 'prior_28' in w && !('last_month' in w));
cell('§4.6 a single day is a window of one, not a crash', () => { const s = SC.windows([{ day: '2026-09-01', impressions: 5, clicks: 2 }]); return s.has_data && s.last_28.impressions === 5 && s.prior_28.impressions === 0; });
cell('§4.7 QUERY_ROWS is five', () => SC.QUERY_ROWS === 5);

// ═══ §5 · WHAT GOOGLE SHOWS — the card's meta (0147 §4) ══════════════════════
sec('\u00a75 \u00b7 vendorCard.metaFor and the emitted card');
const VC = fresh('src/api/public/vendorCard.js');
cell('§5.1 CARD_KEYS names meta', () => VC.CARD_KEYS.includes('meta'));
cell('§5.2 derived title drops empties: no city → "Name · Photographer"', () => VC.metaFor({ business_name: 'Dev Roy Photography', category: 'Photographer', city: null, about: null }).title === 'Dev Roy Photography \u00b7 Photographer');
cell('§5.3 derived description is about cut at 200', () => VC.metaFor({ about: 'x'.repeat(250) }).description.length === 200);
cell('§5.4 her own bytes win over the derivation', () => { const m = VC.metaFor({ business_name: 'N', category: 'C', city: 'D', about: 'a', seo_title: 'My title', seo_description: 'My description' }); return m.title === 'My title' && m.description === 'My description'; });
cell('§5.5 a blank seo_title ("   ") falls back to the derivation, not to a blank (F-40.277: the label, not the key)', () => VC.metaFor({ business_name: 'N', category: 'photography', city: 'D', seo_title: '   ' }).title === 'N \u00b7 Photographer \u00b7 D');
cell('§5.6 card() EMITS meta when given (surface, not path — F-40.169)', () => { const c = VC.card({ handle: 'h', meta: { title: 'T', description: 'D' } }); return c.meta && c.meta.title === 'T' && c.meta.description === 'D'; });
cell('§5.7 card() with no meta emits the derived object, never undefined (F-40.277 amended: label, not key)', () => { const c = VC.card({ handle: 'h', business_name: 'N', category: 'photography' }); return c.meta && c.meta.title === 'N \u00b7 Photographer' && c.meta.description === null; });
cell('§5.8 VENDOR_SELECT asks for seo_title and seo_description', () => /seo_title/.test(VC.VENDOR_SELECT) && /seo_description/.test(VC.VENDOR_SELECT));

// ═══ §6 · THE QR ═══════════════════════════════════════════════════════════════
sec('\u00a76 \u00b7 storefront/qr.png \u2014 one string, one home');
const SF = fresh('src/api/vendor/solutions/storefront.js');
cell('§6.1 the QR encodes the lowercase /v/ address off PWA_BASE_URL', () => SF.storefrontUrl('DEV440').endsWith('/v/dev440'));
cell('§6.2 weddingCardPdf exports qrPng — the storefront door does not draw its own', () => typeof fresh('src/lib/weddingCardPdf.js').qrPng === 'function');
await acell('§6.3 qrPng yields a PNG', async () => { const b = await fresh('src/lib/weddingCardPdf.js').qrPng(SF.storefrontUrl('dev440')); return Buffer.isBuffer(b) && b.slice(1, 4).toString() === 'PNG'; });

// ═══ §7 · THE SITEMAP DOOR (p2) ═══════════════════════════════════════════════
sec('\u00a77 \u00b7 public/sitemap \u2014 the card door\u2019s predicates, three columns, lowercase');
const SM = fresh('src/api/public/sitemap.js');
function smDb() {
  const calls = [];
  const rows = { vendors: [{ id: 'v1', routing_handle: 'DEV440', updated_at: '2026-09-01T00:00:00Z' }, { id: 'v2', routing_handle: null, updated_at: null }],
                 weddings: [{ owner_vendor_id: 'v1', slug: 'verma-event', updated_at: '2026-09-02T00:00:00Z' }] };
  const q = (table) => { const st = { table, eq: [], not: [], in: [] }; calls.push(st);
    const c = { select(cols) { st.cols = cols; return c; }, eq(k, v) { st.eq.push([k, v]); return c; }, not(k, op, v) { st.not.push([k, op, v]); return c; },
                in(k, v) { st.in.push([k, v]); return c; }, then(res) { res({ data: rows[table], error: null }); } };
    return c; };
  return { from: q, calls };
}
await acell('§7.1 vendors are asked with status=active, discover_paused=false, routing_handle not null (vendorCard.js:445)', async () => {
  const d = smDb(); await SM.listPages(d); const v = d.calls.find((c) => c.table === 'vendors');
  return v && JSON.stringify(v.eq) === JSON.stringify([['status', 'active'], ['discover_paused', false]]) && v.not.length === 1 && v.not[0][0] === 'routing_handle';
});
await acell('§7.2 weddings are asked with visibility=published AND couple_consent=true (vendorCard.js:504–508)', async () => {
  const d = smDb(); await SM.listPages(d); const w = d.calls.find((c) => c.table === 'weddings');
  return w && JSON.stringify(w.eq) === JSON.stringify([['visibility', 'published'], ['couple_consent', true]]);
});
await acell('§7.3 handles are lowercased; a vendor with no handle is skipped; the wedding page rides its owner\u2019s handle', async () => {
  const d = smDb(); const r = await SM.listPages(d);
  return r.ok && r.pages.length === 2 && r.pages[0].handle === 'dev440' && r.pages[0].slug === null && r.pages[1].slug === 'verma-event' && r.pages[1].handle === 'dev440';
});
cell('§7.4 the two SELECTs name no phone, no name, no city, no about', () =>
  !/phone|business_name|city|about|whatsapp/.test(SM.VENDOR_COLS + ' ' + SM.WEDDING_COLS));
await acell('§7.5 a page row is exactly { handle, slug, updated_at }', async () => {
  const r = await SM.listPages(smDb()); return r.pages.every((p) => JSON.stringify(Object.keys(p).sort()) === '["handle","slug","updated_at"]');
});

// ═══ §8 · THE NIGHTLY (p2) ════════════════════════════════════════════════════
sec('\u00a78 \u00b7 searchConsoleNightly \u2014 its own minute, its own heartbeat, one read when there is no house');
const cronSrc = require('fs').readFileSync(R('src/cron.js'), 'utf8').replace(/\/\/.*$/gm, '');
cell('§8.1 cron.js registers the pull at 40 3 (IST) and no other daily sits on that minute', () => {
  const mins = [...cronSrc.matchAll(/cron\.schedule\('([^']+)'/g)].map((m) => m[1]);
  return mins.filter((m) => m === '40 3 * * *').length === 1 && mins.filter((m) => /^40 /.test(m)).length === 1;
});
cell('§8.2 the registration is Asia/Kolkata and requires searchConsoleNightly', () => /searchConsoleNightly'\)/.test(cronSrc) && /40 3 \* \* \*'[\s\S]{0,400}timezone: 'Asia\/Kolkata'/.test(cronSrc));
await acell('§8.3 no house row → no_house after ONE read, nothing pulled, nothing written', async () => {
  const N = fresh('src/lib/vendor/searchConsoleNightly.js'); const d = fakeDb();
  const r = await N.runSearchConsoleNightly(d); return r.ok === false && r.reason === 'no_house' && d.writes.length === 0;
});
cell('§8.4 the heartbeat is the house row\u2019s last_synced_at (pull → markSynced(grantOwner))', () => {
  const src = require('fs').readFileSync(R('src/lib/vendor/searchConsole.js'), 'utf8').replace(/\/\/.*$/gm, '');
  return /markSynced\(supabase, grantOwner\)/.test(src);
});

// ═══ §9 · F-40.277 · THE TRADE AS A WORD ═════════════════════════════════════
sec('\u00a79 \u00b7 metaFor \u2014 the profile label, sentence case, never the key');
const VC2 = fresh('src/api/public/vendorCard.js');
cell('§9.1 photography → Photographer in the derived title', () => VC2.metaFor({ business_name: 'Dev Roy Photography', category: 'photography', city: 'Delhi' }).title === 'Dev Roy Photography \u00b7 Photographer \u00b7 Delhi');
cell('§9.2 makeup → Makeup artist', () => VC2.tradeWord('makeup') === 'Makeup artist');
cell('§9.3 the catch-all trade is dropped, not printed as Vendor', () => VC2.metaFor({ business_name: 'N', category: 'other', city: 'D' }).title === 'N \u00b7 D');
cell('§9.4 no category → no trade, no stray dot', () => VC2.metaFor({ business_name: 'N', category: null, city: 'D' }).title === 'N \u00b7 D');

console.log(`\nb59_g31_s2_google_bench  ${pass} GREEN  ${fail} RED`);
if (fail) { console.log(fails.map((f) => '  - ' + f).join('\n')); process.exit(1); }
console.log(`
NON-VACUITY — EIGHT PRODUCTION MUTATIONS, EACH RED ON THE CELLS NAMED (run by hand, then reverse the edit — never \`git checkout --\`, R-40.65):
  1 src/lib/vendor/tokenVault.js   make seal() return String(plain)            → §1.2 §1.5 §1.7 §3.6
  2 src/lib/vendor/googleOAuth.js  drop the pathname === GOOGLE_CALLBACK_PATH test → §2.2
  3 src/lib/vendor/searchConsole.js  WINDOW_DAYS = 30                          → §4.3 §4.4
  4 src/api/public/vendorCard.js   remove \`meta\` from the card() return         → §5.6 §5.7 (and b44 §2.1)`);
})();
