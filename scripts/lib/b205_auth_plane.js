// scripts/lib/b205_auth_plane.js · CE-47 WEB-4 cut 11 (b205): the in-memory sign-up plane, lifted whole from
// scripts/b05_f059_signup_bench.js (its Meta stub, fake service-role auth client, memory data client and route helpers),
// so b205 drives the real auth doors end to end. Only ROOT, freshRoute's base and the export line differ from the source.
'use strict';
const assert = require('assert');
const path   = require('path');

// ── base env: dummy creds; lanes Meta-live so /send-otp uses the Meta template send ──
process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role';
process.env.TWILIO_ACCOUNT_SID        = 'ACdummy';
process.env.TWILIO_AUTH_TOKEN         = 'dummy';
process.env.BRIDE_PHONE_NUMBER_ID     = 'PNID_BRIDE_123';
process.env.VENDOR_PHONE_NUMBER_ID    = 'PNID_VENDOR_456';

const ROOT = path.resolve(__dirname, '..', '..');

// M2b (CE-62): the twilio module stub is DELETED. It existed so route modules that did
// `require('twilio')` could load without the real SDK. No module requires twilio any more
// and the package is purged from package.json, so require.resolve('twilio') now THROWS —
// the stub had become the only thing in this bench that still needed Twilio to exist.
const CAP = { meta: null, store: null };  // M2b: the `twilio` capture slot died with the stub

// ── stub metaCloud; capture the auth-template send (carries the plaintext code) ──────
const metaPath = require.resolve(path.join(ROOT, 'src/lib/metaCloud.js'));
require.cache[metaPath] = {
  id: metaPath, filename: metaPath, loaded: true,
  exports: {
    sendMetaTemplate: async ({ to, payload }, opts = {}) => {
      CAP.meta = { to, payload, phoneNumberId: opts && opts.phoneNumberId };
      return { ok: true, wamid: 'wamid.fake', raw: null };
    },
  },
};

// ── stub @supabase/supabase-js: the route's module-level service-role authClient ─────
// It exposes exactly the admin surface ensureAuthIdentity + mintSession use, backed by
// CAP.store so the bench can count identities. `.from` is a harmless stub (never used:
// the route reads data through req.app.locals.supabase, not this client).
function fakeAuthClient() {
  const digits = (p) => String(p == null ? '' : p).replace(/[^0-9]/g, '');
  return {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    auth: {
      verifyOtp: async ({ token_hash }) => ({
        data: { session: { access_token: 'access_' + token_hash, refresh_token: 'refresh_' + token_hash } },
        error: null,
      }),
      admin: {
        createUser: async ({ phone, phone_confirm }) => {
          const s = CAP.store;
          s.createCalls++;
          s.lastCreateArgs = { phone, phone_confirm };
          if (s.users.some((u) => digits(u.phone) === digits(phone))) {
            return { data: null, error: { message: 'phone_exists' } };
          }
          const id = 'auth_' + (++s.minted);
          s.users.push({ id, phone });
          return { data: { user: { id, phone } }, error: null };
        },
        listUsers: async ({ page }) => {
          CAP.store.listCalls++;
          return { data: { users: page === 1 ? CAP.store.users.slice() : [] }, error: null };
        },
        updateUserById: async (_id, _attrs) => ({ data: {}, error: null }),
        generateLink: async ({ email }) => ({ data: { properties: { hashed_token: 'hash_' + email } }, error: null }),
      },
    },
  };
}
const sbPath = require.resolve('@supabase/supabase-js');
const realSb = require('@supabase/supabase-js');
require.cache[sbPath] = {
  id: sbPath, filename: sbPath, loaded: true,
  exports: Object.assign({}, realSb, { createClient: () => fakeAuthClient() }),
};

function newStore() { return { users: [], minted: 0, createCalls: 0, listCalls: 0, lastCreateArgs: null }; }

// ── stateful in-memory app data client (public/engine reads+writes) ──────────────────
function memSupabase(db, idc) {
  const rows = (t) => (db[t] = db[t] || []);
  const nid  = (t) => { idc[t] = (idc[t] || 0) + 1; const p = { users: 'u', couples: 'c', vendors: 'v' }[t] || t[0]; return p + idc[t]; };
  function from(table) {
    const st = { op: 'select', cols: '*', filters: [], obj: null, onConflict: null, ran: false, result: null };
    const match = (r) => st.filters.every(([c, v]) => r[c] === v);
    const embed = (row) => {
      if (row && /users!inner/.test(st.cols)) {
        const usr = rows('users').find((u) => u.id === row.user_id);
        return Object.assign({}, row, { users: usr ? { name: usr.name == null ? null : usr.name } : null });
      }
      return row;
    };
    function exec(kind) {
      if (st.ran) return st.result;
      st.ran = true;
      const R = rows(table);
      if (st.op === 'select') {
        const m = R.filter(match);
        if (kind === 'single')     st.result = m.length ? { data: embed(m[0]), error: null } : { data: null, error: { message: 'no rows' } };
        else if (kind === 'maybe') st.result = { data: m.length ? embed(m[0]) : null, error: null };
        else                       st.result = { data: m.map(embed), error: null };
      } else if (st.op === 'insert') {
        const arr = Array.isArray(st.obj) ? st.obj : [st.obj];
        const created = arr.map((o) => { const row = Object.assign({}, o); if (row.id == null) row.id = nid(table); R.push(row); return row; });
        st.result = { data: kind === 'single' ? created[0] : created, error: null };
      } else if (st.op === 'update') {
        const m = R.filter(match); m.forEach((r) => Object.assign(r, st.obj)); st.result = { data: m, error: null };
      } else if (st.op === 'delete') {
        db[table] = R.filter((r) => !match(r)); st.result = { data: null, error: null };
      } else if (st.op === 'upsert') {
        const key = st.onConflict, o = st.obj;
        const idx = key ? R.findIndex((r) => r[key] === o[key]) : -1;
        if (idx >= 0) Object.assign(R[idx], o); else R.push(Object.assign({}, o));
        st.result = { data: null, error: null };
      }
      return st.result;
    }
    const b = {
      select(c) { st.cols = c || '*'; return b; },
      insert(o) { st.op = 'insert'; st.obj = o; return b; },
      update(o) { st.op = 'update'; st.obj = o; return b; },
      delete()  { st.op = 'delete'; return b; },
      upsert(o, opts) { st.op = 'upsert'; st.obj = o; st.onConflict = opts && opts.onConflict; return Promise.resolve(exec('void')); },
      eq(c, v)  { st.filters.push([c, v]); return b; },
      maybeSingle() { return Promise.resolve(exec('maybe')); },
      single()      { return Promise.resolve(exec('single')); },
      then(res, rej) { return Promise.resolve(exec('void')).then(res, rej); },
    };
    return b;
  }
  return { from };
}

// ── route + handler helpers (mirror the sealed bench) ────────────────────────────────
function freshRoute(rel) {
  const abs    = require.resolve(path.join(ROOT, rel));
  const otpAbs = require.resolve(path.join(ROOT, 'src/lib/otpSend.js'));
  delete require.cache[abs];
  delete require.cache[otpAbs];
  return require(abs);
}
function handlerFor(router, routePath) {
  const layer = (router.stack || []).find((l) => l.route && l.route.path === routePath && l.route.methods.post);
  if (!layer) throw new Error(`route not found: POST ${routePath}`);
  const st = layer.route.stack;
  return st[st.length - 1].handle; // last handler — skips requireAuth on /provision
}
function callHandler(handler, body, supabase, extraReq) {
  let resolveDone; const done = new Promise((r) => (resolveDone = r));
  const req = Object.assign({ body, app: { locals: { supabase } } }, extraReq || {});
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; resolveDone(); return this; },
    cookie() { return this; },
  };
  const logs = [];
  const ol = console.log, oe = console.error;
  console.log = (...a) => logs.push(a.map(String).join(' '));
  console.error = (...a) => logs.push(a.map(String).join(' '));
  const p = (async () => {
    handler(req, res, (e) => { if (e) res.json({ __next_err: String(e && e.message) }); });
    await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('handler timed out')), 4000))]);
  })().finally(() => { console.log = ol; console.error = oe; });
  return p.then(() => ({ statusCode: res.statusCode, payload: res.payload, logs }));
}
const codeFromMeta = () => CAP.meta && CAP.meta.payload && CAP.meta.payload.components[0].parameters[0].text;
module.exports = { CAP, ROOT, fakeAuthClient, newStore, memSupabase, freshRoute, handlerFor, callHandler, codeFromMeta };
