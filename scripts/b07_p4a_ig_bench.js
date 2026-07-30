#!/usr/bin/env node
// scripts/b07_p4a_ig_bench.js
// TDW_07 P4a — THE FLOOR: the OAuth state (signed · single-use · vendor-bound ·
// short-TTL), F3's config assertion, the token round-trip mocked at the seam,
// the refresh-on-use decision, and the SECRETS LAW as an executable property.
//
// Runnable from ANY working directory (Q-SP-5): every path resolves off __dirname.
// Exit code is the verdict; the PASS count is the number.
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.join(__dirname, '..');

// The env must be set BEFORE the modules load: igOAuth reads process.env at call
// time (that is the self-arming property), but a bench that sets them after the
// require would still pass and would be proving nothing about ordering.
process.env.IG_APP_ID       = 'TEST_APP_ID';
process.env.IG_APP_SECRET   = 'TEST_APP_SECRET_VALUE';
process.env.IG_REDIRECT_URI = 'https://dream-os-production.up.railway.app/api/v2/vendor/ig/callback';

const O  = require(path.join(ROOT, 'src/lib/vendor/igOAuth.js'));
const IG = require(path.join(ROOT, 'src/lib/vendor/igImport.js'));

let pass = 0, fail = 0;

// The P3 stripper, carried WITH ITS ORDER RULE (P3 deviation (d)): line comments
// FIRST, block comments SECOND. Stripping blocks first lets a line comment
// containing a `/*`-looking token open a phantom block that swallows live code.
// The `(^|[^:])` guard keeps `https://` out of the line pass.
const codeOf = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
  .split('\n').map(l => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  → ' + detail : '')); }
};
const section = (t) => console.log('\n' + t);

// A fake supabase implementing exactly the shapes igConnection.js uses. It is a
// FIXTURE: no assertion below may be satisfied by editing it — every mutation in
// the ledger at the foot of this file strikes a PRODUCTION source file.
function makeDb(rows = []) {
  const store = { vendor_ig_connections: rows.map(r => ({ ...r })) };
  function builder(table) {
    const st = { op: 'select', filters: [], payload: null, conflict: null };
    const match = (r) => st.filters.every(([c, v]) => r[c] === v);
    const api = {
      select() { if (st.op === 'noop') st.op = 'select'; return api; },
      eq(c, v) { st.filters.push([c, v]); return api; },
      upsert(p, opts) { st.op = 'upsert'; st.payload = p; st.conflict = opts && opts.onConflict; return api; },
      update(p) { st.op = 'update'; st.payload = p; return api; },
      delete()  { st.op = 'delete'; return api; },
      async maybeSingle() {
        const hit = store[table].find(match);
        return { data: hit ? { ...hit } : null, error: null };
      },
      then(res) { return Promise.resolve(run()).then(res); },
    };
    function run() {
      if (st.op === 'upsert') {
        const key = st.conflict || 'vendor_id';
        const i = store[table].findIndex(r => r[key] === st.payload[key]);
        if (i >= 0) store[table][i] = { ...store[table][i], ...st.payload };
        else store[table].push({ ...st.payload });
        return { data: null, error: null };
      }
      if (st.op === 'update') {
        store[table].forEach((r, i) => { if (match(r)) store[table][i] = { ...r, ...st.payload }; });
        return { data: null, error: null };
      }
      if (st.op === 'delete') {
        store[table] = store[table].filter(r => !match(r));
        return { data: null, error: null };
      }
      return { data: null, error: null };
    }
    return api;
  }
  return { from: (t) => builder(t), _store: store };
}

(async () => {

const C = require(path.join(ROOT, 'src/lib/vendor/igConnection.js'));
const VENDOR = '11111111-2222-3333-4444-555555555555';

// ═══════════════════════════════════════════════════════════════════════════
section('§1 · THE STATE — signed, vendor-bound, short-TTL');

{
  const { state, nonce } = O.mintState(VENDOR);
  ok('§1.1 a minted state verifies', O.verifyState(state).ok === true);
  const v = O.verifyState(state);
  ok('§1.2 the state carries the VENDOR — a stolen code cannot cross portfolios',
     v.vendorId === VENDOR, v.vendorId);
  ok('§1.3 the state carries the nonce the store will spend', v.nonce === nonce);
}
{
  // ── §1.4 · RE-AIMED. MY FIRST TAKE WAS VACUOUS AND N-2 CAUGHT IT. ─────────
  // The first version flipped one character of the base64 payload and kept the
  // signature. It greened even with the HMAC comparison DISABLED — because a
  // flipped character also corrupts the JSON, so verifyState refused at
  // "Unreadable state payload" and never reached the signature at all. The cell
  // claimed to prove the signature is checked; it proved the payload parses.
  // Third instance of P3's vacuity family, found by its own mutation.
  //
  // RE-AIMED AT THE ACTUAL ATTACK: a payload that is perfectly well-formed JSON
  // and names a DIFFERENT VENDOR, carrying the signature minted for the real one.
  // This is the whole reason the state is signed — an attacker who can guess a
  // vendor id must not be able to redirect someone else's Instagram into their
  // own portfolio. Nothing but the HMAC stands between those two facts.
  const crypto = require('crypto');
  const b64 = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const { state } = O.mintState(VENDOR);
  const legitMac = state.split('.')[1];
  const forged   = b64(JSON.stringify({ v: '99999999-0000-0000-0000-000000000000', n: 'forged', t: Date.now() }));
  const r = O.verifyState(`${forged}.${legitMac}`);
  ok('§1.4 a well-formed payload naming ANOTHER VENDOR, carrying a real signature, '
     + 'is REFUSED — the signature is what stands between the two', r.ok === false, JSON.stringify(r));
  // The control: the same forged payload with its OWN correct signature verifies.
  // Without this, §1.4 could pass on any refusal at all — including a refusal that
  // had nothing to do with the signature, which is exactly how take one failed.
  const properMac = b64(crypto.createHmac('sha256', process.env.IG_APP_SECRET).update(forged).digest());
  ok('§1.4a …and the SAME payload with its own correct signature verifies — proving '
     + '§1.4\'s refusal is the signature\'s doing and not the payload\'s shape',
     O.verifyState(`${forged}.${properMac}`).ok === true);
}
{
  const { state } = O.mintState(VENDOR);
  ok('§1.5 a state with a truncated signature is refused, NOT a crash',
     O.verifyState(state.split('.')[0] + '.short').ok === false);
  // timingSafeEqual throws on length mismatch; §1.5 exists because a throw here
  // would be a 500 where a 400 is the truth.
  ok('§1.6 garbage is refused, NOT a crash', O.verifyState('nonsense').ok === false);
  ok('§1.7 an absent state is refused', O.verifyState(undefined).ok === false);
}
{
  // TTL. Mint a payload dated past the window and sign it with the real key —
  // this proves EXPIRY is checked, not merely that an unsigned old state fails.
  const crypto = require('crypto');
  const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const old = b64url(JSON.stringify({ v: VENDOR, n: 'x', t: Date.now() - (O.STATE_TTL_MS + 60000) }));
  const mac = b64url(crypto.createHmac('sha256', process.env.IG_APP_SECRET).update(old).digest());
  ok('§1.8 a validly-signed but EXPIRED state is refused', O.verifyState(`${old}.${mac}`).ok === false);
}

// ═══════════════════════════════════════════════════════════════════════════
section('§2 · SINGLE-USE — the property a signature cannot provide');

{
  const db = makeDb();
  const { state, nonce } = O.mintState(VENDOR);
  await C.armState(db, VENDOR, nonce);
  const first = await C.spendState(db, VENDOR, nonce);
  ok('§2.1 the first spend succeeds', first.ok === true, JSON.stringify(first));
  const second = await C.spendState(db, VENDOR, nonce);
  ok('§2.2 THE REPLAY IS REFUSED — the nonce was NULLed, so the same state dies',
     second.ok === false, JSON.stringify(second));
  ok('§2.3 the signature still verifies on the replayed state — proving §2.2 is the '
     + 'STORE\'s work and not the signature\'s', O.verifyState(state).ok === true);
}
{
  const db = makeDb();
  await C.armState(db, VENDOR, 'nonce-A');
  const wrong = await C.spendState(db, VENDOR, 'nonce-B');
  ok('§2.4 a state whose nonce does not match the stored one is refused', wrong.ok === false);
}
{
  const db = makeDb();
  await C.armState(db, VENDOR, 'nonce-1');
  await C.armState(db, VENDOR, 'nonce-2');   // vendor restarts the connect
  const stale = await C.spendState(db, VENDOR, 'nonce-1');
  ok('§2.5 re-authorizing KILLS the earlier state — only the newest attempt can land',
     stale.ok === false);
  ok('§2.6 …and the newest one still can', (await C.spendState(db, VENDOR, 'nonce-2')).ok === true);
}

// ═══════════════════════════════════════════════════════════════════════════
section('§3 · F3 — THE CONFIG ASSERTION (a config that cannot work never arms)');

{
  const real = process.env.IG_REDIRECT_URI;
  ok('§3.1 the canonical redirect arms the entry', IG.isConfigured() === true);

  process.env.IG_REDIRECT_URI = 'https://dream-os-production.up.railway.app/api/v2/vendor/ig/callback/';
  ok('§3.2 a TRAILING SLASH does not arm — Meta matches byte-for-byte',
     IG.isConfigured() === false);

  process.env.IG_REDIRECT_URI = 'https://dream-os-production.up.railway.app/api/v2/vendor/instagram/callback';
  ok('§3.3 a WRONG PATH does not arm', IG.isConfigured() === false);

  process.env.IG_REDIRECT_URI = 'not-a-url';
  ok('§3.4 an unparseable redirect does not arm, and does not throw',
     IG.isConfigured() === false);

  process.env.IG_REDIRECT_URI = real;
  ok('§3.5 …and restoring the canonical value re-arms it — the gate is self-arming, '
     + 'no redeploy', IG.isConfigured() === true);

  const secret = process.env.IG_APP_SECRET;
  delete process.env.IG_APP_SECRET;
  ok('§3.6 a missing app secret does not arm', IG.isConfigured() === false);
  process.env.IG_APP_SECRET = secret;
}
{
  // The mount's arithmetic. If core.js's mount or ig.js's route ever moves, the
  // constant and the reality part company silently — this cell is the tripwire.
  const core = codeOf('src/api/vendor/core.js');
  const igr  = codeOf('src/api/vendor/ig.js');
  ok('§3.7 core.js mounts the router at /ig', /router\.use\(\s*'\/ig'/.test(core));
  ok('§3.8 ig.js serves /callback', /router\.get\(\s*'\/callback'/.test(igr));
  ok('§3.9 the canonical constant equals the mount + the route',
     O.IG_CALLBACK_PATH === '/api/v2/vendor/ig/callback', O.IG_CALLBACK_PATH);
}

// ═══════════════════════════════════════════════════════════════════════════
section('§4 · THE TOKEN ROUND TRIP — mocked at the seam, both legs');

{
  const realFetch = global.fetch;
  const seen = [];
  global.fetch = async (url, init) => {
    seen.push(String(url));
    if (String(url).startsWith(O.TOKEN_URL)) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'SHORT', user_id: 178414 }) };
    }
    return { ok: true, status: 200, json: async () => ({ access_token: 'LONG', expires_in: 5183944 }) };
  };

  const short = await O.exchangeCode('THE-CODE');
  ok('§4.1 the code exchange yields a short-lived token', short.ok && short.shortLivedToken === 'SHORT');
  ok('§4.2 …and the Instagram-scoped user id, as a STRING (it arrives numeric)',
     short.igUserId === '178414', String(short.igUserId));
  ok('§4.3 the code exchange is a POST — the secret rides the body, never a query string',
     seen[0] === O.TOKEN_URL, seen[0]);

  const long = await O.exchangeForLongLived('SHORT');
  ok('§4.4 the long-lived exchange yields a 60-day token', long.ok && long.accessToken === 'LONG');
  {
    const days = (Date.parse(long.expiresAt) - Date.now()) / 86400000;
    ok('§4.5 expires_in becomes an ABSOLUTE expiry ~60 days out', days > 59 && days < 61, String(days));
  }
  ok('§4.6 the long-lived leg calls graph.instagram.com with ig_exchange_token',
     seen[1].startsWith(O.GRAPH_HOST) && seen[1].includes('ig_exchange_token'), seen[1]);

  global.fetch = realFetch;
}
{
  // The incomplete-response case: a 200 that carries no token. Meta does this.
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
  const r = await O.exchangeForLongLived('SHORT');
  ok('§4.7 a 200 with NO token is a refusal, not a saved empty token', r.ok === false);
  global.fetch = realFetch;
}
{
  const db = makeDb();
  await C.saveToken(db, VENDOR, { igUserId: '178414', accessToken: 'LONG', expiresAt: new Date(Date.now() + 60 * 86400000).toISOString() });
  const safe = await C.getConnection(db, VENDOR);
  ok('§4.8 the connection round-trips', safe.ok && safe.connection.ig_user_id === '178414');
  ok('§4.9 THE SECRETS LAW: getConnection\'s column list does not name access_token',
     !C.SAFE_COLUMNS.includes('access_token'), C.SAFE_COLUMNS);
  const tok = await C.readToken(db, VENDOR);
  ok('§4.10 readToken — the ONE function that reads it — does', tok.ok && tok.accessToken === 'LONG');
}
{
  const db = makeDb();
  const t = await C.readToken(db, VENDOR);
  ok('§4.11 an unconnected vendor reads not_connected, never a null token treated as one',
     t.ok === false && t.error === 'not_connected');
}

// ═══════════════════════════════════════════════════════════════════════════
section('§5 · REFRESH-ON-USE (F2) — a pure decision, proven by execution');

{
  const day = 86400000, now = Date.now();
  const at = (d) => new Date(now + d * day).toISOString();
  const born = (d) => new Date(now - d * day).toISOString();

  ok('§5.1 a token 30 days out is left alone',
     O.refreshDecision({ expiresAt: at(30), connectedAt: born(30), now }) === 'ok');
  ok('§5.2 a token 3 days out REFRESHES — inside the ruled 7-day window',
     O.refreshDecision({ expiresAt: at(3), connectedAt: born(57), now }) === 'refresh');
  ok('§5.3 a token exactly at the window edge is left alone (strictly inside refreshes)',
     O.refreshDecision({ expiresAt: at(O.REFRESH_WINDOW_DAYS + 0.01), connectedAt: born(53), now }) === 'ok');
  ok('§5.4 AN EXPIRED TOKEN IS `expired`, NEVER `refresh` — Meta cannot refresh a dead '
     + 'token, and trying would turn H11\'s honest "connect again" into a failure',
     O.refreshDecision({ expiresAt: at(-1), connectedAt: born(61), now }) === 'expired');
  ok('§5.5 a missing expiry is treated as expired, not as fresh',
     O.refreshDecision({ expiresAt: null, connectedAt: born(1), now }) === 'expired');
  ok('§5.6 Meta\'s 24-hour floor is honoured: a token minted minutes ago is not refreshed '
     + 'even if its expiry were somehow near',
     O.refreshDecision({ expiresAt: at(2), connectedAt: new Date(now - 60000).toISOString(), now }) === 'ok');
}

// ═══════════════════════════════════════════════════════════════════════════
section('§6 · THE MEDIA LEG (U-3) — paging, and the never-silent-empty law');

{
  const realFetch = global.fetch;
  let call = 0;
  global.fetch = async () => {
    call++;
    if (call === 1) return { ok: true, status: 200, json: async () => ({
      data: [{ id: '1', media_type: 'IMAGE', media_url: 'https://scontent.cdninstagram.com/a.jpg', caption: 'one', timestamp: 't' }],
      paging: { next: 'https://graph.instagram.com/me/media?after=CURSOR' },
    }) };
    return { ok: true, status: 200, json: async () => ({
      data: [{ id: '2', media_type: 'IMAGE', media_url: 'https://scontent.cdninstagram.com/b.jpg' }],
    }) };
  };
  const r = await IG.listInstagramMedia('TOKEN');
  ok('§6.1 the cursor is FOLLOWED — both pages land', r.ok && r.items.length === 2, JSON.stringify(r.items));
  ok('§6.2 paging stops when `next` is absent', r.pages === 2 && r.truncated === false);
  global.fetch = realFetch;
}
{
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({
    data: [
      { id: 'v', media_type: 'VIDEO', media_url: 'https://x/v.mp4', thumbnail_url: 'https://x/v.jpg' },
      { id: 'n', media_type: 'IMAGE' },
    ],
  }) });
  const r = await IG.listInstagramMedia('TOKEN');
  ok('§6.3 a VIDEO contributes its THUMBNAIL, never the mp4', r.items[0].source_url === 'https://x/v.jpg');
  ok('§6.4 an item with no usable still is SKIPPED, not mirrored as a broken row',
     r.items.length === 1, JSON.stringify(r.items));
  global.fetch = realFetch;
}
{
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ data: [], paging: {} }) });
  const r = await IG.listInstagramMedia('TOKEN');
  ok('§6.5 a genuinely EMPTY account returns ok with zero items — the caller can tell '
     + 'this apart from a refusal, which is the whole point of §8.3',
     r.ok === true && r.items.length === 0);
  global.fetch = realFetch;
}
{
  // The runaway guard. A `next` that never ends must not spin forever.
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({
    data: [{ id: 'x', media_type: 'IMAGE', media_url: 'https://x/x.jpg' }],
    paging: { next: 'https://graph.instagram.com/me/media?after=FOREVER' },
  }) });
  const r = await IG.listInstagramMedia('TOKEN');
  // ── §6.6 · RE-AIMED. TAUTOLOGICAL ON THE FIRST TAKE, CAUGHT BY N-8. ───────
  // It read `r.pages === IG.IG_MAX_PAGES` — a prediction derived from the very
  // constant under test, so raising the ceiling to 100000 moved BOTH sides and
  // the cell stayed green while the runaway guard was effectively gone. P2's
  // §3.4 lesson reproduced one block later, in a bench written by someone who
  // had read that lesson the same afternoon.
  // The bound below is the BENCH'S OWN NUMBER, independent of the source: a
  // portfolio caps at 20 and one page holds 25, so any ceiling above ten pages
  // is not a guard. Raise the constant and this reddens, which is the point.
  ok('§6.6 an endless cursor TERMINATES inside a small bound the bench owns, not one '
     + 'read back from the constant under test', r.pages > 0 && r.pages <= 10, String(r.pages));
  ok('§6.7 …and the truncation is ANNOUNCED, never silent (P3\'s F2-3 law)', r.truncated === true);
  global.fetch = realFetch;
}
{
  const fields = IG.IG_MEDIA_FIELDS;
  ok('§6.8 media_url is requested — omit it and the mirror has nothing to copy, and '
     + 'Meta returns 200 with the field simply absent', fields.includes('media_url'));
  ok('§6.9 thumbnail_url is requested — the still for VIDEO items', fields.includes('thumbnail_url'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§7 · LEAST PRIVILEGE + THE SECRETS LAW, as source properties');

{
  ok('§7.1 exactly ONE scope is requested', O.IG_SCOPE === 'instagram_business_basic', O.IG_SCOPE);
  const url = O.authorizeUrl('STATE');
  // ── §7.2 · RE-AUTHORED. THE CELL WAS ENFORCING MY OWN ERROR (F-07.23). ────
  // It read `api.instagram.com` and cited "chair correction №5". That correction
  // was itself wrong: Meta documents www.instagram.com/oauth/authorize as the
  // authorize endpoint, and api.instagram.com as the TOKEN EXCHANGE host only.
  // The wrong value never failed a test because it 302s to the right place — so
  // the desktop walk passed and only the founder's iOS device exposed it, the
  // extra redirect hop being where the Instagram app hijacked the navigation.
  //
  // A CELL THAT ASSERTS A CONSTANT AGAINST ITSELF CANNOT CATCH A WRONG CONSTANT.
  // §7.2a below is the cell that could have: it names the ONE host that must not
  // appear, sourced from documentation rather than from the source under test.
  ok('§7.2 the authorize URL uses www.instagram.com — Meta\'s documented endpoint',
     url.startsWith('https://www.instagram.com/oauth/authorize?'), url.slice(0, 60));
  ok('§7.2a the authorize URL is NOT api.instagram.com — that host serves the '
     + 'token exchange, and routing authorize through it forces a 302 that iOS '
     + 'hands to the Instagram app (F-07.23)',
     !url.includes('api.instagram.com'), url.slice(0, 60));
  ok('§7.2b the three hosts stay distinct and correctly assigned',
     O.AUTHORIZE_URL.includes('www.instagram.com')
       && O.TOKEN_URL.includes('api.instagram.com')
       && O.GRAPH_HOST.includes('graph.instagram.com'));
  ok('§7.3 the authorize URL carries response_type=code and the state', url.includes('response_type=code') && url.includes('state=STATE'));
  ok('§7.4 THE APP SECRET IS NEVER IN THE AUTHORIZE URL — that URL is a browser '
     + 'navigation and lands in history, referrers and screenshots',
     !url.includes(process.env.IG_APP_SECRET));
}
{
  const oauth = codeOf('src/lib/vendor/igOAuth.js');
  const igsrc = codeOf('src/lib/vendor/igImport.js');
  const conn  = codeOf('src/lib/vendor/igConnection.js');
  const rtr   = codeOf('src/api/vendor/ig.js');
  const all   = oauth + igsrc + conn + rtr;
  // Not a shape assertion: this greps the STRIPPED code for a log/return that
  // names a token or a secret variable. Comments are stripped first, so the
  // paragraphs explaining the law cannot satisfy or break it.
  ok('§7.5 no console line in the IG code prints an access token',
     !/console\.[a-z]+\([^)]*(accessToken|access_token|shortLivedToken)/.test(all));
  ok('§7.6 no console line prints IG_APP_SECRET',
     !/console\.[a-z]+\([^)]*IG_APP_SECRET/.test(all));
  ok('§7.7 the callback logs the vendor and the ig user, and nothing else, on success',
     /console\.log\('\[ig:callback\] connected vendor'/.test(rtr));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§8 · THE CALLBACK\'S ORDERING — the property that is easy to get wrong');

{
  const rtr = codeOf('src/api/vendor/ig.js');
  const spendAt    = rtr.indexOf('spendState');
  const exchangeAt = rtr.indexOf('exchangeCode');
  ok('§8.1 the state is SPENT BEFORE the code is exchanged — so a FAILED exchange '
     + 'still cannot be replayed', spendAt > 0 && exchangeAt > spendAt, `${spendAt} vs ${exchangeAt}`);
  ok('§8.2 the callback carries NO requireAuth — it is a cross-site navigation and '
     + 'the state is the authentication',
     /router\.get\(\s*'\/callback',\s*asyncHandler/.test(rtr));
  ok('§8.3 every OTHER door does carry requireAuth',
     (rtr.match(/requireAuth/g) || []).length >= 5, String((rtr.match(/requireAuth/g) || []).length));
  ok('§8.4 a vendor who cancels on Instagram is sent back with `cancelled`, not an error',
     /ig:\s*'cancelled'/.test(rtr));
  // ── §8.5 · RE-AIMED. VACUOUS ON THE FIRST TAKE, CAUGHT BY N-11. ──────────
  // It read `rtr.indexOf('tokenForCall') < rtr.indexOf('importSelected')` —
  // a FILE-WIDE first-occurrence comparison. `tokenForCall` appears earlier in
  // the file twice over (its own definition, then the /media route), so deleting
  // the check from /import entirely left the cell green. P3's named indexOf
  // class, reproduced: a positional assertion that never scoped itself to the
  // thing it was asserting about.
  // RE-AIMED at the /import HANDLER'S OWN BODY, sliced out by its route marker.
  {
    const start = rtr.indexOf("router.post('/import'");
    const end   = rtr.indexOf("router.delete('/disconnect'");
    const importBody = start >= 0 && end > start ? rtr.slice(start, end) : '';
    ok('§8.5 /import asserts the connection INSIDE ITS OWN HANDLER — without it the '
       + 'door is a server-side fetch of arbitrary URLs, authenticated as a favour',
       importBody.includes('tokenForCall') && importBody.includes('IG_NOT_CONNECTED'),
       `handler ${importBody.length} chars`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
section('§9 · 0103 — the migration as an artifact');

{
  const sql = fs.readFileSync(path.join(ROOT, 'db/migrations/0103_vendor_ig_connections.sql'), 'utf8');
  ok('§9.1 0103 exists and creates the table', /create table if not exists public\.vendor_ig_connections/.test(sql));
  ok('§9.2 vendor_id is UNIQUE — one connection per vendor, and the upserts\' conflict target',
     /vendor_id\s+uuid not null unique/.test(sql));
  ok('§9.3 ON DELETE CASCADE — a deleted vendor leaves no live token behind',
     /on delete cascade/.test(sql));
  ok('§9.4 the readback ships with the file (the settling witness)', /information_schema\.columns/.test(sql));
  ok('§9.5 the file NAMES the missing-0102 divergence rather than papering it',
     /0102/.test(sql) && /ladder/.test(sql));
  // The ladder tail, derived here rather than trusted: no 0102 file exists, and no
  // 0103 existed before this sitting.
  const files = fs.readdirSync(path.join(ROOT, 'db/migrations')).filter(f => /^\d{4}_/.test(f));
  ok('§9.6 db/migrations still has NO 0102 file — the divergence is real, not a '
     + 'misreading', files.filter(f => f.startsWith('0102')).length === 0);
  ok('§9.7 exactly one 0103 exists', files.filter(f => f.startsWith('0103')).length === 1);
}

// ═══════════════════════════════════════════════════════════════════════════
section('§10 · W-1 — zero soul bytes');

{
  const soulish = [
    'src/engine/src/core/donnaSoul.ts',
    'src/engine/src/core/harveySoul.ts',
    'src/engine/src/core/advisorLens.ts',
    'src/engine/src/core/loop.ts',
  ];
  const present = soulish.filter(p => fs.existsSync(path.join(ROOT, p)));
  ok('§10.1 the protected soul files exist to be checked', present.length === soulish.length,
     JSON.stringify(present));
  // This sitting's delivery names its own touched set; the cell asserts the IG code
  // does not reach into the engine at all.
  const all = ['src/lib/vendor/igOAuth.js', 'src/lib/vendor/igConnection.js',
               'src/lib/vendor/igImport.js', 'src/api/vendor/ig.js']
    .map(p => fs.readFileSync(path.join(ROOT, p), 'utf8')).join('\n');
  ok('§10.2 no IG file requires anything from src/engine', !/require\([^)]*engine/.test(all));
  ok('§10.3 no IG file mentions a soul, lens or loop module', !/donnaSoul|harveySoul|advisorLens|loop\.ts/.test(all));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§11 · META\'S signed_request — the only thing authenticating two doors');

{
  const S = require(path.join(ROOT, 'src/lib/vendor/igSignedRequest.js'));
  const crypto = require('crypto');
  const b64 = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const secret = process.env.IG_APP_SECRET;
  const mk = (payloadObj, key = secret) => {
    const p = b64(JSON.stringify(payloadObj));
    const sig = b64(crypto.createHmac('sha256', key).update(p).digest());
    return `${sig}.${p}`;
  };
  const good = { algorithm: 'HMAC-SHA256', user_id: '178414', issued_at: 1 };

  ok('§11.1 a correctly signed request verifies and yields the ig user id',
     (() => { const r = S.parseSignedRequest(mk(good)); return r.ok && r.userId === '178414'; })());

  ok('§11.2 a request signed with the WRONG secret is refused',
     S.parseSignedRequest(mk(good, 'not-the-secret')).ok === false);

  // THE ALGORITHM-CONFUSION ATTACK. The payload names its own algorithm; a
  // verifier that obeys that field lets `none` walk in. This cell is the proof
  // that we read the field only in order to refuse on it.
  ok('§11.3 `algorithm: none` is REFUSED, not honoured — the JWT-family defect',
     S.parseSignedRequest(mk({ ...good, algorithm: 'none' })).ok === false);

  // Signature computed over the DECODED json rather than the encoded payload —
  // the exact mistake the header warns about, from the attacker's side.
  {
    const p = b64(JSON.stringify(good));
    const wrongSig = b64(crypto.createHmac('sha256', secret).update(JSON.stringify(good)).digest());
    ok('§11.4 a signature over the DECODED payload is refused — the HMAC covers '
       + 'the ENCODED string', S.parseSignedRequest(`${wrongSig}.${p}`).ok === false);
  }

  ok('§11.5 a truncated signature is refused, NOT a crash',
     S.parseSignedRequest('abc.' + b64(JSON.stringify(good))).ok === false);
  ok('§11.6 garbage is refused, NOT a crash', S.parseSignedRequest('nonsense').ok === false);
  ok('§11.7 a payload with no user_id is refused',
     S.parseSignedRequest(mk({ algorithm: 'HMAC-SHA256' })).ok === false);
  ok('§11.8 with no app secret configured it refuses rather than verifying nothing',
     S.parseSignedRequest(mk(good), '').ok === false);
}
{
  const db = makeDb();
  await C.saveToken(db, VENDOR, { igUserId: '178414', accessToken: 'LONG', expiresAt: new Date(Date.now() + 60 * 86400000).toISOString() });
  const f = await C.findByIgUserId(db, '178414');
  ok('§11.9 a connection is findable by the IG user id — the only bridge from '
     + 'Meta\'s name for a vendor to ours', f.ok && f.vendorId === VENDOR);
  // ── §11.10 · RE-AIMED. VACUOUS ON THE FIRST TAKE, CAUGHT BY N-16. ────────
  // It read `f.accessToken === undefined` — but findByIgUserId returns
  // { ok, vendorId } and never surfaces a token no matter WHAT it selects. The
  // cell asserted the return shape while claiming to assert the query. Widening
  // the select to pull the secret out of the database left it green.
  // Fourth vacuity of this sitting; re-aimed at the SELECT STRING itself,
  // scoped to this function's own body.
  {
    const conn = codeOf('src/lib/vendor/igConnection.js');
    const a = conn.indexOf('async function findByIgUserId');
    const b = conn.indexOf('module.exports');
    const body = a >= 0 && b > a ? conn.slice(a, b) : '';
    ok('§11.10 findByIgUserId\'s SELECT does not name access_token — a lookup is '
       + 'not a reason to pull a secret out of the database',
       body.length > 0 && !body.includes('access_token'), `${body.length} chars`);
  }
  const miss = await C.findByIgUserId(db, '999999');
  ok('§11.11 an unknown ig user is not_found, never a silent match', miss.ok === false);
}
{
  const rtr = codeOf('src/api/vendor/ig.js');
  ok('§11.12 /deauthorize exists and is unauthenticated by necessity (Meta calls it)',
     /router\.post\(\s*'\/deauthorize',\s*asyncHandler/.test(rtr));
  ok('§11.13 /data-deletion exists and is likewise unauthenticated',
     /router\.post\(\s*'\/data-deletion',\s*asyncHandler/.test(rtr));
  ok('§11.14 /deletion-status exists — the confirmation url must be reachable',
     /router\.get\(\s*'\/deletion-status'/.test(rtr));

  // Each door VERIFIES BEFORE IT ACTS. Sliced per handler, not file-wide —
  // §8.5's tuition applied before the same defect could recur.
  const slice = (start, end) => {
    const a = rtr.indexOf(start), b = end ? rtr.indexOf(end) : rtr.length;
    return a >= 0 && b > a ? rtr.slice(a, b) : '';
  };
  const deauth = slice("router.post('/deauthorize'", "router.post('/data-deletion'");
  const del    = slice("router.post('/data-deletion'", "router.get('/deletion-status'");
  ok('§11.15 /deauthorize verifies the signature BEFORE any delete',
     deauth.indexOf('parseSignedRequest') > 0
       && deauth.indexOf('parseSignedRequest') < deauth.indexOf('disconnect'));
  ok('§11.16 /data-deletion verifies the signature BEFORE any delete',
     del.indexOf('parseSignedRequest') > 0
       && del.indexOf('parseSignedRequest') < del.indexOf('disconnect'));
  ok('§11.17 a refused signature answers 403, never 200 — a 200 tells a prober '
     + 'its guess landed', /status\(parsed\.error === 'not_configured' \? 503 : 403\)/.test(deauth));
  ok('§11.18 /data-deletion returns Meta\'s exact contract: url + confirmation_code',
     /confirmation_code:/.test(del) && /url:/.test(del));
  ok('§11.19 the mirrored photos are NOT deleted by either door — the addendum\'s '
     + 'law: Instagram is a source, never a dependency',
     !/vendor_portfolio/.test(deauth) && !/vendor_portfolio/.test(del));
}

console.log('\n' + '─'.repeat(72));
console.log('  MUTATION LEDGER — every line a PRODUCTION byte, each cmp-restored.');
console.log('    N-1  igOAuth.js     verifyState skips the TTL check         ⇒ §1.8 RED');
console.log('    N-2  igOAuth.js     verifyState skips the HMAC compare      ⇒ §1.4 RED');
console.log('    N-3  igConnection.js spendState stops NULLing the nonce     ⇒ §2.2 RED');
console.log('    N-4  igConnection.js SAFE_COLUMNS gains access_token        ⇒ §4.9 RED');
console.log('    N-5  igImport.js    isConfigured drops the path assertion   ⇒ §3.2/§3.3 RED');
console.log('    N-6  igOAuth.js     refreshDecision returns refresh on dead ⇒ §5.4 RED');
console.log('    N-7  igImport.js    listInstagramMedia ignores paging.next  ⇒ §6.1/§6.2 RED');
console.log('    N-8  igImport.js    IG_MAX_PAGES ceiling removed            ⇒ §6.6 RED');
console.log('    N-9  igOAuth.js     AUTHORIZE_URL back to api.instagram.com ⇒ §7.2/§7.2a RED');
console.log('    N-10 ig.js          spendState moved AFTER exchangeCode     ⇒ §8.1 RED');
console.log('    N-11 ig.js          /import stops asserting the connection  ⇒ §8.5 RED');
console.log('    N-12 igImport.js    a refusal returns { ok:true, items:[] } ⇒ §8.3 of b07_p3 RED');
console.log('    N-13 igSignedRequest  the HMAC compare skipped              ⇒ §11.2/§11.4 RED');
console.log('    N-14 igSignedRequest  the payload\'s own algorithm honoured  ⇒ §11.3 RED');
console.log('    N-15 ig.js          /deauthorize trusts the body unverified ⇒ §11.15 RED');
console.log('    N-16 igConnection.js findByIgUserId also selects the token  ⇒ §11.10 RED');
console.log('─'.repeat(72));

console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ` — b07_p4a_ig_bench ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
})();
