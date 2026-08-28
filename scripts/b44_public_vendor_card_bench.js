#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b44_public_vendor_card_bench.js
// TDW_19 P0-B step 4 · THE PUBLIC CARD (R-19.7, CE-38 relay #3).
//
// Bench number: b40–b42 are reserved to P1/P2/P3 by spec §4–§6; b43 is this
// block's doors bench. b44 was named in b43's handover as the next free number
// for this block. Verified free at `b52448f`.
//
// ⚠ NEEDS THE ENGINE BUILT, for the reason F-19.17 named:
//
//     npm ci && npm run build:engine && node scripts/b44_public_vendor_card_bench.js
//
// This bench mounts the FULL api router (to assert the mount and the absence of
// a guard), and that graph reaches `leads.js:39` → `engine/dist/core/donna`,
// which `.gitignore:26` excludes. A fresh clone with only `npm ci` gets
// MODULE_NOT_FOUND before a cell runs — an honest verdict but an illegible one,
// which is exactly the failure b43's header was amended for.
//
// ── WHAT THIS BENCH IS FOR ─────────────────────────────────────────────────
// This is the estate's FIRST unauthenticated per-vendor read. `public.vendors`
// carries 45 columns including `upi_id`, `gstin`, `pin_hash`, `rate_min` and
// `razorpay_subscription_id`. The whole risk of this door is one careless
// `select('*')` away, and it would look completely fine on screen — the page
// renders three fields either way. **A response-only assertion cannot see it.**
//
// SO §3 DIFFS THE SELECT ITSELF (CE-38 relay #3: *diff the SELECT too*, the
// census lesson). The fake RECORDS the column list every query asks for, and the
// cell compares that list against the door's own exported allowlist AND against
// a list written here from the ruling. A `select('*')` reddens on the SELECT
// before it ever reaches a response.
//
// It runs on a dirty tree: reads no floor, mutates nothing at rest.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

process.env.SUPABASE_URL = 'http://127.0.0.1:1/bench-placeholder-not-a-credential';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'bench-placeholder-not-a-credential';

const path    = require('path');
const http    = require('http');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0;
const ok  = (n, why) => { console.log('PASS  ' + n + (why ? '  — ' + why : '')); pass++; };
const no  = (n, why) => { console.log('FAIL  ' + n + '  — ' + why); fail++; };
const chk = (c, n, why) => (c ? ok(n, why) : no(n, why));

// ── FIXTURES ───────────────────────────────────────────────────────────────
// The standing test vendor is 9888294440; its handle is uppercase because that
// is how routing_handle is minted (src/agent/onboarding.js:174-192).
const LIVE   = { business_name: 'Bench Studio', category: 'Photography', city: 'Mumbai',
                 routing_handle: 'DEV550', status: 'active',   discover_paused: false };
const PAUSED = { business_name: 'Quiet Co',     category: 'Decor',       city: 'Delhi',
                 routing_handle: 'QUIET1', status: 'active',   discover_paused: true  };
const OFF    = { business_name: 'Gone Co',      category: 'Catering',    city: 'Pune',
                 routing_handle: 'GONE01', status: 'inactive', discover_paused: false };
const DEMO   = { display_name: 'Demo Films', category: 'Film', city: 'Jaipur',
                 ig_handle: 'demofilms', whatsapp_phone: '919000000000', active: true };

// Every column the door must NEVER put on the wire. Written from
// PUBLIC_SCHEMA.md, not from the door — a cell that reads its expectation out of
// the thing it tests has tested nothing (D-38.1).
const FORBIDDEN = ['upi_id', 'gstin', 'pin_hash', 'pin_hash', 'rate_min', 'rate_max',
                   'razorpay_subscription_id', 'razorpay_subscription_link', 'user_id',
                   'id', 'style_notes', 'about', 'instagram_handle', 'tier',
                   'billing_status', 'invoice_prefix', 'base_fee_min', 'base_fee_max'];

const SELECTS = [];   // every column list the door asked for
let VENDORS = [LIVE, PAUSED, OFF];
let DEMOS   = [DEMO];

function fake() {
  return {
    from(table) {
      const q = { table, filters: [], cols: null };
      q.select = (c) => { q.cols = c; SELECTS.push({ table, cols: c }); return q; };
      q.eq     = (c, v) => { q.filters.push([c, v]); return q; };
      q.maybeSingle = async () => {
        if (table === 'vendors') {
          const f = Object.fromEntries(q.filters);
          const row = VENDORS.find((r) => r.routing_handle === f.routing_handle);
          // The fake returns ONLY the columns that were selected — a permissive
          // fake would hand back the whole row and hide a select('*') entirely.
          if (!row) return { data: null, error: null };
          if (q.cols === '*') return { data: { ...row, upi_id: 'upi@x', gstin: 'GST1', pin_hash: 'HASH' }, error: null };
          const picked = {};
          for (const c of q.cols.split(',').map((s) => s.trim())) picked[c] = row[c];
          return { data: picked, error: null };
        }
        if (table === 'demo_vendors') {
          const f = Object.fromEntries(q.filters);
          const row = DEMOS.find((r) => r.ig_handle === f.ig_handle && (f.active === undefined || r.active === f.active));
          if (!row) return { data: null, error: null };
          if (q.cols === '*') return { data: { ...row }, error: null };
          const picked = {};
          for (const c of q.cols.split(',').map((s) => s.trim())) picked[c] = row[c];
          return { data: picked, error: null };
        }
        throw new Error(`[fake] UNDECLARED TABLE READ: ${table}`);
      };
      return q;
    },
  };
}

const app = express();
app.use(express.json());
app.locals.supabase = fake();
app.use('/api/v2', require(P('src/api/router.js')));

let server, BASE;
const get = (p, headers) => new Promise((resolve, reject) => {
  http.get(BASE + p, { headers: headers || {} }, (res) => {
    let b = '';
    res.on('data', (d) => (b += d));
    res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch {} resolve({ status: res.statusCode, body: j, raw: b }); });
  }).on('error', reject);
});

const B = '/api/v2/public/vendor-card';

(async () => {
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  BASE = 'http://127.0.0.1:' + server.address().port;
  const door = require(P('src/api/public/vendorCard.js'));

  // ═══ §1 · MOUNTED, PUBLIC, AND NOT UNDER /vendor ═════════════════════════
  console.log('\n── §1 · the mount ──');
  {
    const r = await get(`${B}/dev550`);
    chk(r.status !== 404 || (r.body && r.body.ok !== undefined),
        '§1.1 the route is mounted in router.js', `HTTP ${r.status}`);
    chk(r.status === 200, '§1.2 it answers with NO Authorization header at all',
        `HTTP ${r.status} — no session, by design`);
    const under = await get('/api/v2/vendor/public/vendor-card/dev550');
    chk(under.status === 404 || under.status === 401,
        '§1.3 it is NOT reachable under /api/v2/vendor', `HTTP ${under.status}`);
  }

  // ═══ §2 · THE SHAPE IS THE BOUNDARY ══════════════════════════════════════
  console.log('\n── §2 · the response shape, by allowlist ──');
  {
    const r = await get(`${B}/dev550`);
    const c = r.body && r.body.card;
    if (!c) { no('§2.1 a card came back', 'no card in the body'); }
    else {
      const got = Object.keys(c).sort();
      const want = ['business_name', 'category', 'city', 'enquiry_phone', 'handle', 'is_demo'];
      chk(JSON.stringify(got) === JSON.stringify(want),
          '§2.1 exactly the six declared keys, no more no less', got.join(','));
      chk(JSON.stringify(door.CARD_KEYS.slice().sort()) === JSON.stringify(want),
          '§2.2 the door\u2019s exported CARD_KEYS matches the ruling\u2019s list', door.CARD_KEYS.join(','));
      const leaked = FORBIDDEN.filter((k) => k in c);
      chk(leaked.length === 0, '§2.3 no forbidden column reaches the wire',
          leaked.length ? 'LEAKED: ' + leaked.join(', ') : `${FORBIDDEN.length} columns checked absent`);
      chk(c.handle === 'dev550', '§2.4 the handle is lowercased on the wire',
          `stored 'DEV550' \u2192 sent ${JSON.stringify(c.handle)}`);
      chk(c.is_demo === false && c.enquiry_phone === null,
          '§2.5 a real vendor gets no phone and is not flagged demo',
          `is_demo=${c.is_demo} enquiry_phone=${JSON.stringify(c.enquiry_phone)}`);
    }
  }

  // ═══ §3 · THE SELECT ITSELF — the cell a response cannot give you ════════
  console.log('\n── §3 · diff the SELECT (CE-38 relay #3) ──');
  {
    const vs = SELECTS.filter((s) => s.table === 'vendors');
    chk(vs.length > 0, '§3.1 a vendors query was observed', `${vs.length} recorded`);
    const star = vs.filter((s) => s.cols === '*');
    chk(star.length === 0, '§3.2 no select(\u2018*\u2019) on public.vendors, ever',
        star.length ? 'A STAR SELECT REACHED THE PUBLIC DOOR' : 'zero star selects');
    // Written from the ruling, not read from the door.
    const WANT = ['business_name', 'category', 'city', 'discover_paused', 'routing_handle', 'status'];
    const asked = [...new Set(vs.flatMap((s) => s.cols.split(',').map((x) => x.trim())))].sort();
    chk(JSON.stringify(asked) === JSON.stringify(WANT),
        '§3.3 the vendors SELECT is exactly the six allowlisted columns', asked.join(','));
    const forbiddenAsked = asked.filter((c) => FORBIDDEN.includes(c));
    chk(forbiddenAsked.length === 0, '§3.4 no forbidden column is even ASKED FOR',
        forbiddenAsked.length ? 'ASKED: ' + forbiddenAsked.join(', ') : 'the query never sees them');
    chk(door.VENDOR_SELECT.split(',').map((s) => s.trim()).sort().join(',') === WANT.join(','),
        '§3.5 the door\u2019s exported VENDOR_SELECT agrees with the ruling', door.VENDOR_SELECT);
  }

  // ═══ §4 · VISIBILITY IS THE VENDOR'S OWN WORD ════════════════════════════
  console.log('\n── §4 · discover_paused binds this route ──');
  {
    const paused = await get(`${B}/quiet1`);
    chk(paused.status === 404, '§4.1 discover_paused \u2192 not served', `HTTP ${paused.status}`);
    const off = await get(`${B}/gone01`);
    chk(off.status === 404, '§4.2 status != active \u2192 not served', `HTTP ${off.status}`);
    const absent = await get(`${B}/nosuch`);
    chk(absent.status === 404, '§4.3 an absent handle \u2192 404', `HTTP ${absent.status}`);
    // THE ENUMERATION CELL. Three different reasons, one indistinguishable
    // answer — otherwise the route tells a stranger which handles exist.
    const bodies = [paused.raw, off.raw, absent.raw];
    chk(new Set(bodies).size === 1,
        '§4.4 paused, inactive and absent are BYTE-IDENTICAL responses',
        new Set(bodies).size === 1 ? 'one body, no enumeration oracle' : 'THE BODIES DIFFER: ' + JSON.stringify(bodies));
    chk(paused.status === off.status && off.status === absent.status,
        '§4.5 \u2026and the same status code', `all ${paused.status}`);
  }

  // ═══ §5 · DEMO VENDORS (founder ruling 2026-08-28) ═══════════════════════
  console.log('\n── §5 · the demo variant ──');
  {
    const r = await get(`${B}/demofilms`);
    const c = r.body && r.body.card;
    chk(r.status === 200 && !!c, '§5.1 a demo vendor is served', `HTTP ${r.status}`);
    if (c) {
      chk(c.is_demo === true, '§5.2 flagged demo', `is_demo=${c.is_demo}`);
      chk(c.enquiry_phone === '919000000000',
          '§5.3 the enquiry number ships, off demo_vendors.whatsapp_phone', String(c.enquiry_phone));
      chk(JSON.stringify(Object.keys(c).sort()) ===
          JSON.stringify(['business_name', 'category', 'city', 'enquiry_phone', 'handle', 'is_demo']),
          '§5.4 the demo card uses THE SAME six keys \u2014 one shape, one boundary', Object.keys(c).sort().join(','));
      chk(c.business_name === 'Demo Films',
          '§5.5 display_name maps to business_name (demo_vendors has no business_name)', c.business_name);
    }
    const ds = SELECTS.filter((s) => s.table === 'demo_vendors');
    chk(ds.length > 0 && !ds.some((s) => s.cols === '*'),
        '§5.6 no select(\u2018*\u2019) on demo_vendors either', `${ds.length} queries, zero stars`);
  }

  // ═══ §6 · REAL VENDORS WIN THE CODE ══════════════════════════════════════
  // A demo ig_handle that collides with a real routing_handle must resolve to
  // the REAL vendor — she owns her address, and a demo built from her public
  // work must never shadow it.
  console.log('\n── §6 · collision order ──');
  {
    DEMOS = [{ ...DEMO, ig_handle: 'dev550' }];
    const r = await get(`${B}/dev550`);
    chk(r.body && r.body.card && r.body.card.is_demo === false,
        '§6.1 a real vendor wins a colliding code',
        r.body && r.body.card ? `is_demo=${r.body.card.is_demo}, name=${r.body.card.business_name}` : 'no card');
    DEMOS = [DEMO];
  }

  server.close();
  console.log(`\n${pass} PASS \u00b7 ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('BENCH ABORTED —', e && e.stack ? e.stack : e);
  if (server) server.close();
  process.exit(2);
});
