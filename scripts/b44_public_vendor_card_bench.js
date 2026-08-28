// scripts/b44_public_vendor_card_bench.js
//
// TDW_19 P0-B step 4 · THE PUBLIC VENDOR CARD DOOR — 25 cells.
// TDW_19 P2-A §3-1 · GROWN TO 39 cells for the enriched door.
//
// ── ⚠ LABELLED AMENDMENT (P2-A, CE-38 relay #1) ──────────────────────────────
// Two amendments, both count-GROWING and both stated rather than slipped in:
//
//   1. `FORBIDDEN` IS SPLIT IN TWO (correction 6). One list carried two laws —
//      *never selected* and *never on the wire* — and P2-A makes them diverge:
//      the door now legitimately SELECTS `id`, `rate_min` and `rate_display`
//      and must never SEND any of them. A single list would have had to lose
//      all three from both laws to compile, which would have deleted the only
//      cell standing between `rate_min` and a public URL.
//
//   2. THE THIRD FIXTURE HANDLE IS `DEV440`, NOT `DEV550`. This file's own
//      header asserted the standing test vendor is 9888294440 and then used
//      `DEV550` — P0-B's spec EXAMPLE — as the literal, so the fixture agreed
//      with a document rather than with a row. The founder's row, run
//      2026-08-28: `DEV440 · active · paused=false · rate_display=true ·
//      rate_min=60000`. Corrected to the witnessed handle.
//
// PREREQUISITE, and it is not optional on a fresh clone: this bench mounts the
// door THROUGH `src/api/router.js`, which loads siblings that require
// `../../engine/dist/core/donna` — excluded by `.gitignore:26`. Run
// `npm ci && npm run build:engine` first or a clean checkout exits 1 before one
// cell runs (F-19.17's lesson, inherited from b43).
//
// ── WHY THIS BENCH DIFFS THE SELECT AND NOT ONLY THE RESPONSE ────────────────
// `public.vendors` has 45 columns including `upi_id`, `gstin`, `pin_hash` and
// `razorpay_subscription_id`. A `select('*')` would publish all of them — AND
// THE PAGE WOULD LOOK IDENTICAL, because it renders named fields either way. A
// response-only assertion cannot see the difference.
//
// SO §3 DIFFS THE SELECT ITSELF (CE-38 relay #3: *diff the SELECT too*, the
// census lesson). The fake RECORDS the column list every query asks for, and the
// cell compares that list against the door's own exported allowlist AND against
// a list written here from the ruling. A `select('*')` reddens on the SELECT
// before it ever reaches a response.
//
// P2-A adds the same treatment to `vendor_portfolio`, plus two cells the
// response cannot give you at all: that `in_carousel` is neither selected nor
// filtered on (F-19.22), and that a PAUSED vendor issues ZERO portfolio queries
// — §2-3's one switch asserted as control flow rather than as an empty array.
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
// The standing test vendor is 9888294440 and its handle is `DEV440`, uppercase
// because that is how routing_handle is minted (src/agent/onboarding.js:174-192).
// Every field below matches the founder's witnessed row except `about`, which
// his row reports absent and the walk fixture seeds.
const LIVE   = { id: 'v-live', business_name: 'Bench Studio', category: 'Photography', city: 'Mumbai',
                 routing_handle: 'DEV440', status: 'active',   discover_paused: false,
                 about: 'Two sentences of prose. The second one.', rate_min: 60000, rate_display: true };
const HIDDEN = { id: 'v-hide', business_name: 'Discreet Co',  category: 'Decor',       city: 'Jaipur',
                 routing_handle: 'HIDE01', status: 'active',   discover_paused: false,
                 about: 'Prices on request.', rate_min: 250000, rate_display: false };
const PAUSED = { id: 'v-paus', business_name: 'Quiet Co',     category: 'Decor',       city: 'Delhi',
                 routing_handle: 'QUIET1', status: 'active',   discover_paused: true,
                 about: 'Should never be read.', rate_min: 1, rate_display: true };
const OFF    = { id: 'v-off',  business_name: 'Gone Co',      category: 'Catering',    city: 'Pune',
                 routing_handle: 'GONE01', status: 'inactive', discover_paused: false,
                 about: 'Should never be read.', rate_min: 1, rate_display: true };
const DEMO   = { display_name: 'Demo Films', category: 'Film', city: 'Jaipur',
                 ig_handle: 'demofilms', whatsapp_phone: '919000000000', active: true,
                 about: 'Built from work published publicly.',
                 // TEXT, not a boolean (:476). Non-empty on purpose: it is the
                 // value a door that wrongly selected this column would coerce.
                 rate_display: 'From Rs 80,000',
                 photos: [{ url: 'https://cdn.example/d1.jpg', is_hero: true },
                          { url: 'https://cdn.example/d2.jpg' },
                          { url: '' }] };

// `vendor_portfolio` rows. THE ORDER HERE IS DELIBERATELY WRONG so that
// position-ordering has something to prove: row `position:0` is declared LAST.
// Six approved rows, to outrun the 12-cap the charter proposed and c-38.33
// struck — a cap would not have shown here, so the cell that proves its absence
// is §7.3, which counts against the FIXTURE's approved total, not a literal.
const PORTFOLIO = [
  { vendor_id: 'v-live', image_url: 'https://cdn.example/p2.jpg', caption: 'Second',  is_hero: false, in_carousel: true,  position: 2, approval_state: 'approved', rejection_reason: null,      reviewed_by_admin: 'admin' },
  { vendor_id: 'v-live', image_url: 'https://cdn.example/px.jpg', caption: 'Pending', is_hero: false, in_carousel: true,  position: 1, approval_state: 'pending',  rejection_reason: null,      reviewed_by_admin: null },
  { vendor_id: 'v-live', image_url: 'https://cdn.example/p1.jpg', caption: 'First',   is_hero: false, in_carousel: true,  position: 1, approval_state: 'approved', rejection_reason: null,      reviewed_by_admin: 'admin' },
  { vendor_id: 'v-live', image_url: 'https://cdn.example/pr.jpg', caption: 'Rejected',is_hero: false, in_carousel: true,  position: 3, approval_state: 'rejected', rejection_reason: 'blurry',  reviewed_by_admin: 'admin' },
  // in_carousel FALSE and approved. Under the charter's first wording this row
  // would have been withheld; under CE-38 relay #1's amendment it ships, because
  // the couple feed does not consult the flag either (F-19.22).
  { vendor_id: 'v-live', image_url: 'https://cdn.example/p4.jpg', caption: 'Off-carousel', is_hero: false, in_carousel: false, position: 4, approval_state: 'approved', rejection_reason: null, reviewed_by_admin: 'admin' },
  { vendor_id: 'v-live', image_url: 'https://cdn.example/p5.jpg', caption: null,      is_hero: false, in_carousel: true,  position: 5, approval_state: 'approved', rejection_reason: null,      reviewed_by_admin: 'admin' },
  { vendor_id: 'v-live', image_url: 'https://cdn.example/p6.jpg', caption: 'Sixth',   is_hero: false, in_carousel: true,  position: 6, approval_state: 'approved', rejection_reason: null,      reviewed_by_admin: 'admin' },
  { vendor_id: 'v-live', image_url: 'https://cdn.example/p0.jpg', caption: 'Hero',    is_hero: true,  in_carousel: true,  position: 0, approval_state: 'approved', rejection_reason: null,      reviewed_by_admin: 'admin' },
  // The paused vendor HAS approved photos. If §2-3 were a filter rather than
  // control flow, this row is what would leak.
  { vendor_id: 'v-paus', image_url: 'https://cdn.example/q1.jpg', caption: 'Quiet',   is_hero: true,  in_carousel: true,  position: 0, approval_state: 'approved', rejection_reason: null,      reviewed_by_admin: 'admin' },
];

// ── THE TWO LAWS, WRITTEN SEPARATELY (P2-A correction 6) ────────────────────
// Both lists are written from PUBLIC_SCHEMA.md, not from the door — a cell that
// reads its expectation out of the thing it tests has tested nothing (D-38.1).

/** NEVER ON THE WIRE. `id`, `rate_min` and `rate_display` are here AND absent
 *  from SELECT_FORBIDDEN below: the door fetches all three and sends none. */
const WIRE_FORBIDDEN = ['upi_id', 'gstin', 'pin_hash', 'rate_min', 'rate_max',
                        'razorpay_subscription_id', 'razorpay_subscription_link', 'user_id',
                        'id', 'style_notes', 'instagram_handle', 'tier',
                        'billing_status', 'invoice_prefix', 'base_fee_min', 'base_fee_max',
                        'rate_display', 'status', 'discover_paused',
                        'approval_state', 'rejection_reason', 'reviewed_by_admin', 'in_carousel'];

/** NEVER EVEN ASKED FOR. Shorter than the list above, and that gap IS the
 *  amendment: a column can be fetched and withheld, and the two facts now have
 *  two assertions instead of one that could only ever be half right. */
const SELECT_FORBIDDEN = ['upi_id', 'gstin', 'pin_hash', 'rate_max',
                          'razorpay_subscription_id', 'razorpay_subscription_link', 'user_id',
                          'style_notes', 'tier', 'billing_status', 'invoice_prefix',
                          'base_fee_min', 'base_fee_max', 'rejection_reason', 'reviewed_by_admin'];

const SELECTS = [];   // every column list the door asked for
const FILTERS = [];   // every filter the door applied, by table
let VENDORS = [LIVE, HIDDEN, PAUSED, OFF];
let DEMOS   = [DEMO];

function pick(row, cols) {
  const out = {};
  for (const c of cols.split(',').map((s) => s.trim())) out[c] = row[c];
  return out;
}

function fake() {
  return {
    from(table) {
      const q = { table, filters: [], orders: [], cols: null };
      q.select = (c) => { q.cols = c; SELECTS.push({ table, cols: c }); return q; };
      q.eq     = (c, v) => { q.filters.push([c, v]); FILTERS.push({ table, col: c }); return q; };
      q.order  = (c, o) => { q.orders.push([c, o && o.ascending === false ? 'desc' : 'asc']); return q; };

      // A LIST READ. `vendor_portfolio` is awaited on the builder itself, with
      // no `.maybeSingle()`, so the builder must be thenable exactly as
      // PostgREST's is. A fake that only answered `.maybeSingle()` would have
      // made the portfolio leg unreachable and every §7 cell vacuous.
      q.then = (resolve, reject) => {
        try {
          if (table !== 'vendor_portfolio') {
            throw new Error(`[fake] UNDECLARED LIST READ: ${table}`);
          }
          const f = Object.fromEntries(q.filters);
          if (q.cols === '*') return resolve({ data: PORTFOLIO.map((r) => ({ ...r })), error: null });
          let rows = PORTFOLIO.filter((r) =>
            Object.entries(f).every(([c, v]) => r[c] === v));
          // Apply the declared orders in sequence, last key first, so the
          // primary key wins — the same semantics PostgREST gives.
          for (let i = q.orders.length - 1; i >= 0; i--) {
            const [c, dir] = q.orders[i];
            rows = rows.slice().sort((a, b) => {
              const av = a[c], bv = b[c];
              if (av === bv) return 0;
              return (av > bv ? 1 : -1) * (dir === 'desc' ? -1 : 1);
            });
          }
          // Only the selected columns come back. A permissive fake would hand
          // back the whole row and hide a select('*') entirely.
          return resolve({ data: rows.map((r) => pick(r, q.cols)), error: null });
        } catch (e) { return reject(e); }
      };

      q.maybeSingle = async () => {
        if (table === 'vendors') {
          const f = Object.fromEntries(q.filters);
          const row = VENDORS.find((r) => r.routing_handle === f.routing_handle);
          if (!row) return { data: null, error: null };
          if (q.cols === '*') return { data: { ...row, upi_id: 'upi@x', gstin: 'GST1', pin_hash: 'HASH' }, error: null };
          return { data: pick(row, q.cols), error: null };
        }
        if (table === 'demo_vendors') {
          const f = Object.fromEntries(q.filters);
          const row = DEMOS.find((r) => r.ig_handle === f.ig_handle && (f.active === undefined || r.active === f.active));
          if (!row) return { data: null, error: null };
          if (q.cols === '*') return { data: { ...row }, error: null };
          return { data: pick(row, q.cols), error: null };
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
const CARD_WANT = ['about', 'business_name', 'category', 'city', 'enquire_link',
                   'enquiry_phone', 'handle', 'is_demo', 'photos', 'starting_price'];

(async () => {
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  BASE = 'http://127.0.0.1:' + server.address().port;
  const door = require(P('src/api/public/vendorCard.js'));

  // ═══ §1 · MOUNTED, PUBLIC, AND NOT UNDER /vendor ═════════════════════════
  console.log('\n── §1 · the mount ──');
  {
    const r = await get(`${B}/dev440`);
    chk(r.status !== 404 || (r.body && r.body.ok !== undefined),
        '§1.1 the route is mounted in router.js', `HTTP ${r.status}`);
    chk(r.status === 200, '§1.2 it answers with NO Authorization header at all',
        `HTTP ${r.status} — no session, by design`);
    const under = await get('/api/v2/vendor/public/vendor-card/dev440');
    chk(under.status === 404 || under.status === 401,
        '§1.3 it is NOT reachable under /api/v2/vendor', `HTTP ${under.status}`);
  }

  // ═══ §2 · THE SHAPE IS THE BOUNDARY ══════════════════════════════════════
  console.log('\n── §2 · the response shape, by allowlist ──');
  {
    const r = await get(`${B}/dev440`);
    const c = r.body && r.body.card;
    if (!c) { no('§2.1 a card came back', 'no card in the body'); }
    else {
      const got = Object.keys(c).sort();
      chk(JSON.stringify(got) === JSON.stringify(CARD_WANT),
          '§2.1 exactly the ten declared keys, no more no less', got.join(','));
      chk(JSON.stringify(door.CARD_KEYS.slice().sort()) === JSON.stringify(CARD_WANT),
          '§2.2 the door\u2019s exported CARD_KEYS matches the ruling\u2019s list', door.CARD_KEYS.join(','));
      const leaked = WIRE_FORBIDDEN.filter((k) => k in c);
      chk(leaked.length === 0, '§2.3 no wire-forbidden column reaches the wire',
          leaked.length ? 'LEAKED: ' + leaked.join(', ') : `${WIRE_FORBIDDEN.length} columns checked absent`);
      chk(c.handle === 'dev440', '§2.4 the handle is lowercased on the wire',
          `stored 'DEV440' \u2192 sent ${JSON.stringify(c.handle)}`);
      chk(c.is_demo === false && c.enquiry_phone === null,
          '§2.5 a real vendor gets no phone and is not flagged demo',
          `is_demo=${c.is_demo} enquiry_phone=${JSON.stringify(c.enquiry_phone)}`);
      chk(c.about === LIVE.about, '§2.6 `about` reaches the wire as authored',
          JSON.stringify(c.about));
      // THE UNIT CELL (c-38.32). 60000 rupees, not 6000000 paise. If this door
      // ever converts, the number below moves by two orders of magnitude and
      // this cell names it — which is the whole reason the field is asserted
      // against the FIXTURE's rupee value and not against `typeof number`.
      chk(c.starting_price === LIVE.rate_min,
          '§2.7 `starting_price` is the RUPEE integer off rate_min, never paise',
          `rate_min=${LIVE.rate_min} \u2192 sent ${c.starting_price}`);
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
    const WANT = ['about', 'business_name', 'category', 'city', 'discover_paused',
                  'id', 'rate_display', 'rate_min', 'routing_handle', 'status'];
    const asked = [...new Set(vs.flatMap((s) => s.cols.split(',').map((x) => x.trim())))].sort();
    chk(JSON.stringify(asked) === JSON.stringify(WANT),
        '§3.3 the vendors SELECT is exactly the ten allowlisted columns', asked.join(','));
    const forbiddenAsked = asked.filter((c) => SELECT_FORBIDDEN.includes(c));
    chk(forbiddenAsked.length === 0, '§3.4 no select-forbidden column is even ASKED FOR',
        forbiddenAsked.length ? 'ASKED: ' + forbiddenAsked.join(', ') : 'the query never sees them');
    chk(door.VENDOR_SELECT.split(',').map((s) => s.trim()).sort().join(',') === WANT.join(','),
        '§3.5 the door\u2019s exported VENDOR_SELECT agrees with the ruling', door.VENDOR_SELECT);

    // ── THE PORTFOLIO SELECT, SAME TREATMENT ──────────────────────────────
    const ps = SELECTS.filter((s) => s.table === 'vendor_portfolio');
    const PWANT = ['caption', 'image_url', 'is_hero', 'position'];
    const pAsked = [...new Set(ps.flatMap((s) => s.cols.split(',').map((x) => x.trim())))].sort();
    chk(ps.length > 0 && JSON.stringify(pAsked) === JSON.stringify(PWANT) &&
        door.PORTFOLIO_SELECT.split(',').map((s) => s.trim()).sort().join(',') === PWANT.join(','),
        '§3.6 the portfolio SELECT is exactly the four allowlisted columns',
        `${ps.length} queries; asked: ${pAsked.join(',')}`);
    chk(ps.every((s) => s.cols !== '*'), '§3.7 no select(\u2018*\u2019) on vendor_portfolio either',
        `${ps.length} queries, zero stars`);
    // F-19.22. The flag is neither fetched nor filtered on, and BOTH halves are
    // asserted — a column dropped from the SELECT but still in a `.eq()` would
    // pass a select-only cell while quietly binding the ruling.
    const carouselAsked   = pAsked.includes('in_carousel');
    const carouselFiltered = FILTERS.some((f) => f.table === 'vendor_portfolio' && f.col === 'in_carousel');
    chk(!carouselAsked && !carouselFiltered,
        '§3.8 `in_carousel` is neither selected nor filtered on (F-19.22)',
        `selected=${carouselAsked} filtered=${carouselFiltered} \u2014 the feed does not consult it either`);
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
    // P2-A re-proves it against the ENRICHED door: a page that now carries
    // photos, prose and a price has three more ways to differ, and the byte
    // comparison is the only cell that can see all of them at once.
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
    const beforeDemo = SELECTS.filter((s) => s.table === 'vendor_portfolio').length;
    const r = await get(`${B}/demofilms`);
    const afterDemo = SELECTS.filter((s) => s.table === 'vendor_portfolio').length;
    const c = r.body && r.body.card;
    chk(r.status === 200 && !!c, '§5.1 a demo vendor is served', `HTTP ${r.status}`);
    if (c) {
      chk(c.is_demo === true, '§5.2 flagged demo', `is_demo=${c.is_demo}`);
      chk(c.enquiry_phone === '919000000000',
          '§5.3 the enquiry number ships, off demo_vendors.whatsapp_phone', String(c.enquiry_phone));
      chk(JSON.stringify(Object.keys(c).sort()) === JSON.stringify(CARD_WANT),
          '§5.4 the demo card uses THE SAME ten keys \u2014 one shape, one boundary', Object.keys(c).sort().join(','));
      chk(c.business_name === 'Demo Films',
          '§5.5 display_name maps to business_name (demo_vendors has no business_name)', c.business_name);
      // The jsonb leg. Two usable rows of three — the empty url is dropped, not
      // sent as a broken image — position is the ARRAY INDEX because the jsonb
      // has no position column, and caption is null rather than invented.
      const okShape = Array.isArray(c.photos) && c.photos.length === 2 &&
                      c.photos[0].url === 'https://cdn.example/d1.jpg' && c.photos[0].hero === true &&
                      c.photos[0].position === 0 && c.photos[0].caption === null &&
                      c.photos[1].position === 1 && c.photos[1].hero === false;
      chk(okShape, '§5.6 demo photos come off the jsonb; index is position, caption is null',
          `${(c.photos || []).length} photos: ${JSON.stringify(c.photos)}`);
      // P2-A correction 5. `demo_vendors.rate_display` is TEXT; reading it as a
      // switch would make every non-empty string truthy — an answer produced by
      // coercion rather than by a ruling.
      //
      // ⚠ THIS CELL'S FIRST CUT WAS VACUOUS AND A MUTATION FOUND IT. It asserted
      // only `starting_price === null`, which is true on this leg no matter what
      // the door does: `rate_display` is not in DEMO_SELECT, so the fake never
      // returns it and `d.rate_display` is `undefined` — falsy — on the mutated
      // door too. The mutation that should have reddened it (reading the string
      // as a switch) passed 40/40. The GUARANTEE is that the column is never
      // ASKED FOR; the null on the wire is that guarantee's consequence, not the
      // guarantee. Both halves are asserted now, and the fixture carries a
      // non-empty `rate_display` string so a door that started selecting it
      // would receive a truthy value rather than an accidental undefined.
      const demoAsked = [...new Set(SELECTS.filter((s) => s.table === 'demo_vendors')
        .flatMap((s) => s.cols.split(',').map((x) => x.trim())))];
      chk(!demoAsked.includes('rate_display') && c.starting_price === null,
          '§5.7 demo_vendors.rate_display is never SELECTED, so it cannot be read as a switch',
          `asked=${demoAsked.includes('rate_display')}, starting_price=${c.starting_price}`);
    }
    const ds = SELECTS.filter((s) => s.table === 'demo_vendors');
    chk(ds.length > 0 && !ds.some((s) => s.cols === '*'),
        '§5.8 no select(\u2018*\u2019) on demo_vendors either', `${ds.length} queries, zero stars`);
    chk(afterDemo === beforeDemo,
        '§5.9 the demo leg issues ZERO vendor_portfolio queries',
        `${afterDemo - beforeDemo} queries \u2014 demo photos are the row\u2019s own jsonb`);
  }

  // ═══ §6 · REAL VENDORS WIN THE CODE ══════════════════════════════════════
  // A demo ig_handle that collides with a real routing_handle must resolve to
  // the REAL vendor — she owns her address, and a demo built from her public
  // work must never shadow it.
  console.log('\n── §6 · collision order ──');
  {
    DEMOS = [{ ...DEMO, ig_handle: 'dev440' }];
    const r = await get(`${B}/dev440`);
    chk(r.body && r.body.card && r.body.card.is_demo === false,
        '§6.1 a real vendor wins a colliding code',
        r.body && r.body.card ? `is_demo=${r.body.card.is_demo}, name=${r.body.card.business_name}` : 'no card');
    DEMOS = [DEMO];
  }

  // ═══ §7 · THE PORTFOLIO (P2-A §3-1) ══════════════════════════════════════
  console.log('\n── §7 · approved photos, position order, one switch ──');
  {
    const r = await get(`${B}/dev440`);
    const c = (r.body && r.body.card) || {};
    const urls = (c.photos || []).map((p) => p.url);

    // THE APPROVAL CELL. `approval_state='approved'` is the consent (third band
    // §4-1); a pending or rejected row on a public URL is the vendor's unshown
    // work published without her.
    const leaked = urls.filter((u) => u.includes('/px.jpg') || u.includes('/pr.jpg'));
    chk(leaked.length === 0, '§7.1 no unapproved photo reaches the wire',
        leaked.length ? 'LEAKED: ' + leaked.join(', ') : 'pending and rejected rows both withheld');

    // The fixture declares position 0 LAST, so array order proving out means
    // the door ordered rather than inherited.
    const positions = (c.photos || []).map((p) => p.position);
    const sorted = positions.slice().sort((a, b) => a - b);
    chk(JSON.stringify(positions) === JSON.stringify(sorted) &&
        c.photos && c.photos[0] && c.photos[0].hero === true && c.photos[0].position === 0,
        '§7.2 position order is honoured and the hero lands first',
        `positions ${positions.join(',')}; first hero=${c.photos && c.photos[0] && c.photos[0].hero}`);

    // c-38.33. Counted against the fixture's approved total, never a literal —
    // a cell asserting `<= 12` would pass on a capped door too.
    const approvedForLive = PORTFOLIO.filter(
      (p) => p.vendor_id === 'v-live' && p.approval_state === 'approved').length;
    chk((c.photos || []).length === approvedForLive,
        '§7.3 EVERY approved row reaches the wire \u2014 no cap (MICRO-2)',
        `${(c.photos || []).length} of ${approvedForLive} approved; the ceiling is the portfolio\u2019s own 20`);

    // The off-carousel row is approved and MUST ship under the amended §2-1.
    chk(urls.includes('https://cdn.example/p4.jpg'),
        '§7.4 an approved row with in_carousel=false still ships (F-19.22)',
        'the feed does not consult the flag; neither does this door');

    // THE STRUCTURAL CELL. §2-3 asserted as control flow: a paused vendor's
    // photos are not withheld, they are never asked for. An empty-array cell
    // would pass on a door that fetched them and dropped them.
    const before = SELECTS.filter((s) => s.table === 'vendor_portfolio').length;
    const paused = await get(`${B}/quiet1`);
    const after  = SELECTS.filter((s) => s.table === 'vendor_portfolio').length;
    chk(after === before && paused.status === 404,
        '§7.5 a paused vendor issues ZERO vendor_portfolio queries',
        `${after - before} queries fired \u2014 one switch, structurally`);

    // The rate switch, on a vendor who set it false.
    const hidden = await get(`${B}/hide01`);
    const hc = hidden.body && hidden.body.card;
    chk(hc && hc.starting_price === null && !('rate_min' in hc),
        '§7.6 rate_display=false nulls the rate and rate_min never reaches the wire',
        hc ? `starting_price=${hc.starting_price}, rate_min present=${'rate_min' in hc}` : 'no card');

    // The photo shape is built field by named field, like the card. An admin's
    // rejection note has no business on a public URL.
    const photoKeys = c.photos && c.photos[0] ? Object.keys(c.photos[0]).sort() : [];
    chk(JSON.stringify(photoKeys) === JSON.stringify(['caption', 'hero', 'position', 'url']),
        '§7.7 a photo is four named fields \u2014 no row is ever spread', photoKeys.join(','));
  }

  // ═══ §8 · THE ENQUIRE LINK (W-1, c-38.37) ═══════════════════════════════
  // The founder walk found a storefront a couple could not act on. The cure is
  // that every real vendor routes through TDW's OWN number — the same one the
  // Frost deck has used since TDW_07 — so no personal number is published and
  // the page still has a purpose.
  console.log('\n── §8 · the enquire link ──');
  {
    const { ENQUIRE_BASE } = require(P('src/lib/discover/shapeVendor.js'));
    const { waNumberFor }  = require(P('src/lib/waNumbers.js'));
    const house = waNumberFor('vendor');

    const r = await get(`${B}/dev440`);
    const c = (r.body && r.body.card) || {};
    // Derived from the shaper's own constant, never from a literal here: a cell
    // carrying its own copy of the house number is the second home
    // `waNumbers.js` exists to prevent.
    chk(c.enquire_link === `${ENQUIRE_BASE}${LIVE.routing_handle}`,
        '§8.1 a real vendor gets the house link, off the deck\u2019s own ENQUIRE_BASE',
        String(c.enquire_link));
    chk(typeof c.enquire_link === 'string' && c.enquire_link.includes(house),
        '§8.2 \u2026and it points at TDW\u2019s number', `house=${house}`);
    // THE CELL THAT MATTERS. A vendor's own number must never reach this wire,
    // by any route, under any key.
    const body = JSON.stringify(c);
    chk(!/9888294440/.test(body),
        '§8.3 no vendor phone number reaches the wire, in any field',
        'the standing test vendor\u2019s number is absent from the whole card');
    // UPPERCASE. Donna parses `TDW-<handle>` out of the message body and the
    // stored byte is uppercase; the wire's `handle` is lowercased for the URL.
    chk(/TDW-DEV440$/.test(String(c.enquire_link)),
        '§8.4 the message body carries the UPPERCASE handle, not the URL\u2019s',
        String(c.enquire_link).slice(-12));

    const d = await get(`${B}/demofilms`);
    const dc = (d.body && d.body.card) || {};
    chk(dc.enquire_link === 'https://wa.me/919000000000',
        '§8.5 a demo vendor deep-links its own published contact \u2014 the asymmetry\u2019s remainder',
        String(dc.enquire_link));
    chk(!String(dc.enquire_link).includes(house),
        '§8.6 \u2026and does NOT route through the house', 'demo keeps its own number');

    const paused = await get(`${B}/quiet1`);
    chk(!/wa\.me/.test(paused.raw),
        '§8.7 a miss offers no link at all', 'the one indistinguishable body is unchanged');
  }

  server.close();
  console.log(`\n${pass} PASS \u00b7 ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('BENCH ABORTED —', e && e.stack ? e.stack : e);
  if (server) server.close();
  process.exit(2);
});
