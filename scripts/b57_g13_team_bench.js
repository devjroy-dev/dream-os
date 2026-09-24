#!/usr/bin/env node
'use strict';
// scripts/b57_g13_team_bench.js
// BLOCK 19 · G1.3 — the door on the roll, Book the same team, the printed card,
// the reel probe.
//
// Every cell asserts a SURFACE or a BEHAVIOUR. None asserts a line number and
// none asserts where a constant lives.
//
// THE MUTATION PASS (--mutate) is the both-ways half: each mutation edits
// PRODUCTION CODE, not test setup, re-runs the cells in a child process, and
// requires RED. A mutation that leaves the bench green is a cell that was never
// testing what its name claims.
//
// ⚠ THE FIXTURE IS THE PRODUCTION ROWS, NOT AN INVENTION. Every credit shape
// below is transcribed from the founder's SELECT of 2026-09-06 (DEV440 /
// `wedding`): four credits, one linkable, one claimed-with-NULL-vendor, one
// nameless. A fixture that drew a tidier roll would prove the code works on a
// wedding nobody has.

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
/** Comments stripped before any PROHIBITION is tested — b53's helper, and its
 *  reason: a cell that cannot tell a rule from its violation is worse than no
 *  cell. This bench needs it hard, because the download door's cured comment
 *  QUOTES the literal it no longer uses. */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const LIB      = 'src/lib/vendor/weddings.js';
const SOURCES  = 'src/lib/vendor/leadSources.js';
const TEAM     = 'src/api/public/weddingTeam.js';
const DOWNLOAD = 'src/api/public/weddingDownload.js';
const CARD     = 'src/lib/weddingCardPdf.js';
const STUDIO   = 'src/api/vendor/studio/weddings.js';
const MIG137   = 'db/migrations/0137_wedding_dates.sql';
const ROUTER   = 'src/api/router.js';

for (const rel of [LIB, SOURCES, TEAM, DOWNLOAD, CARD, STUDIO, MIG137, ROUTER]) {
  if (!fs.existsSync(P(rel))) { console.log('REFUSED \u2014 ' + rel + ' is absent'); process.exit(3); }
}

let pass = 0, fail = 0;
const ok = (n, c, d) => {
  if (c) { pass++; console.log('  ok   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  \u2192 ' + d : '')); }
};
const sec = (t) => console.log('\n' + t);
const fresh = (rel) => { delete require.cache[P(rel)]; return require(P(rel)); };

const W  = fresh(LIB);
const LS = fresh(SOURCES);
const C  = fresh(CARD);

// ── THE PRODUCTION FIXTURE, TRANSCRIBED ─────────────────────────────────────
const OWNER   = { id: 'v-dev440', business_name: 'Dev Roy Photography', routing_handle: 'DEV440', status: 'active', discover_paused: false };
const SWATI   = { id: 'v-swati',  business_name: 'Make Up by Swati Roy', routing_handle: 'MAKEUPBYSWATIROY', status: 'active', discover_paused: false };
const CREDITS = [
  { role: 'makeup',    status: 'claimed', vendor_id: 'v-swati', name: 'Swati', created_at: '2026-09-04T20:14:17Z' },
  { role: 'hair',      status: 'claimed', vendor_id: null,      name: 'Nir',   created_at: '2026-09-04T20:14:46Z' },
  { role: 'styled_by', status: 'tagged',  vendor_id: null,      name: 'SR',    created_at: '2026-09-05T14:21:04Z' },
  { role: 'styled_by', status: 'tagged',  vendor_id: null,      name: null,    created_at: '2026-09-05T16:50:56Z' },
];
const BY_ID = { 'v-dev440': OWNER, 'v-swati': SWATI };

// ── C1 · THE DOOR ON THE ROLL ───────────────────────────────────────────────
sec('C1 \u00b7 the door on the roll (R-G13.3)');
{
  const roll = W.publicRoll(CREDITS, BY_ID);
  ok('the fixture renders THREE rows from four stored credits', roll.length === 3, String(roll.length));
  const makeup = roll.find((r) => r.role === 'makeup');
  const hair   = roll.find((r) => r.role === 'hair');
  ok('the linkable credit carries a door', Boolean(makeup && makeup.enquire_link));
  ok('the door targets the TDW line, never a personal number',
    Boolean(makeup) && /^https:\/\/wa\.me\/\d+\?text=TDW-/.test(makeup.enquire_link), makeup && makeup.enquire_link);
  ok('the door\'s code is UPPERCASE (vendorCard\'s rule), not the wire\'s lowercased handle',
    Boolean(makeup) && makeup.enquire_link.endsWith('TDW-MAKEUPBYSWATIROY'), makeup && makeup.enquire_link);
  ok('and the wire\'s own handle stays lowercase for the /v/ address',
    Boolean(makeup) && makeup.handle === 'makeupbyswatiroy', makeup && makeup.handle);
  ok('a claimed credit with NULL vendor_id gets NO door (credits.js\'s ruling)',
    Boolean(hair) && hair.enquire_link === null, hair && String(hair.enquire_link));
  ok('...and no link either', Boolean(hair) && hair.handle === null);
  ok('EVERY unlinkable row has a null door (the roll is not a directory)',
    roll.filter((r) => r.role !== 'makeup').every((r) => r.enquire_link === null));
  ok('the linkable row prints the REGISTERED name, never the typed one',
    Boolean(makeup) && makeup.name === 'Make Up by Swati Roy', makeup && makeup.name);
  ok('the nameless credit is dropped from the roll entirely',
    !roll.some((r) => r.name === null || r.name === undefined));
}
{
  // A paused vendor loses the door AND the link — printing an address that would
  // itself 404 is an invitation to a dead page.
  const paused = { ...SWATI, discover_paused: true };
  const roll = W.publicRoll(CREDITS, { ...BY_ID, 'v-swati': paused });
  const makeup = roll.find((r) => r.role === 'makeup');
  ok('a PAUSED credited vendor loses her door', Boolean(makeup) && makeup.enquire_link === null);
  const inactive = { ...SWATI, status: 'inactive' };
  const roll2 = W.publicRoll(CREDITS, { ...BY_ID, 'v-swati': inactive });
  ok('an INACTIVE credited vendor loses her door',
    roll2.find((r) => r.role === 'makeup').enquire_link === null);
}

// ── C2 · LINKABILITY IS ONE PREDICATE, TWO READERS ──────────────────────────
sec('C2 \u00b7 isLinkable (R-G13.5/.14)');
ok('claimed + active vendor = linkable', W.isLinkable(CREDITS[0], SWATI) === true);
ok('claimed + NO vendor = NOT linkable', W.isLinkable(CREDITS[1], null) === false);
ok('tagged + active vendor = NOT linkable',
  W.isLinkable({ status: 'tagged', vendor_id: 'v-swati' }, SWATI) === false);
ok('claimed + paused = NOT linkable', W.isLinkable(CREDITS[0], { ...SWATI, discover_paused: true }) === false);
ok('claimed + inactive = NOT linkable', W.isLinkable(CREDITS[0], { ...SWATI, status: 'inactive' }) === false);

// ── C3 · THE TARGET SET ─────────────────────────────────────────────────────
// Driven through the REAL `teamTargets` against a stub whose shape is the
// supabase client's, so the function under test is the shipped one.
sec('C3 \u00b7 teamTargets — the set the sheet names and the door writes (R-G13.5)');
function stubDb({ credits = CREDITS, vendors = [OWNER, SWATI] } = {}) {
  return {
    from(table) {
      const api = {
        _table: table, _ids: null,
        select() { return api; },
        eq() { return api; },
        in(_col, ids) { api._ids = ids; return api; },
        then(res) { return Promise.resolve(api._rows()).then(res); },
        _rows() {
          if (api._table === 'wedding_credits') return { data: credits, error: null };
          if (api._table === 'vendors') return { data: vendors.filter((v) => !api._ids || api._ids.includes(v.id)), error: null };
          return { data: [], error: null };
        },
      };
      return api;
    },
  };
}
{
  const t = require('util').promisify((cb) => {
    W.teamTargets(stubDb(), { weddingId: 'w1', ownerVendorId: 'v-dev440' })
      .then((r) => cb(null, r), (e) => cb(e));
  });
  // Run synchronously enough for a bench: resolve now, assert below.
  const run = (fn) => { let out, err, done = false; fn().then((r) => { out = r; done = true; }, (e) => { err = e; done = true; }); return () => ({ out, err, done }); };
  void t; void run;
}
// Straight async assertions, collected then reported — no promisify gymnastics.
const asyncCells = [];
asyncCells.push(async () => {
  const targets = await W.teamTargets(stubDb(), { weddingId: 'w1', ownerVendorId: 'v-dev440' });
  ok('the fixture\'s team is TWO: the owner and the one linkable credit',
    targets.length === 2, targets.map((t) => t.name).join(' | '));
  ok('the owner is in the set even though she holds NO credit',
    targets.some((t) => t.is_owner === true && t.vendor_id === 'v-dev440'));
  ok('the claimed-but-vendorless credit is NOT a target',
    !targets.some((t) => t.name === 'Nir'));
  ok('names are the REGISTERED ones',
    targets.every((t) => ['Dev Roy Photography', 'Make Up by Swati Roy'].includes(t.name)));
  ok('NO PHONE reaches a target shape (R-G11.6)',
    targets.every((t) => !('phone' in t) && !('consent_phone' in t)));
  ok('the owner comes first, then the roll in ruled order',
    targets[0] && targets[0].is_owner === true);
});
asyncCells.push(async () => {
  // Two credits, ONE vendor — `wedding_credits` has no uniqueness on
  // (wedding_id, vendor_id), so one artist may hold makeup AND hair.
  const doubled = [
    { role: 'makeup', status: 'claimed', vendor_id: 'v-swati', name: 'Swati', created_at: '2026-09-04T20:14:17Z' },
    { role: 'hair',   status: 'claimed', vendor_id: 'v-swati', name: 'Swati', created_at: '2026-09-04T20:14:46Z' },
  ];
  const targets = await W.teamTargets(stubDb({ credits: doubled }), { weddingId: 'w1', ownerVendorId: 'v-dev440' });
  ok('one vendor holding TWO credits is ONE target, not two',
    targets.length === 2 && targets.filter((t) => t.vendor_id === 'v-swati').length === 1,
    targets.map((t) => t.vendor_id).join(','));
});
asyncCells.push(async () => {
  // The owner is ALSO credited — she must not appear twice.
  const selfCredited = [{ role: 'shot_by', status: 'claimed', vendor_id: 'v-dev440', name: 'Dev', created_at: '2026-09-04T20:00:00Z' }];
  const targets = await W.teamTargets(stubDb({ credits: selfCredited }), { weddingId: 'w1', ownerVendorId: 'v-dev440' });
  ok('an owner who credits herself appears ONCE', targets.length === 1, String(targets.length));
  ok('...and is still marked as the owner', targets[0] && targets[0].is_owner === true);
});
asyncCells.push(async () => {
  // A claimed credit on an ACTIVE vendor whose business_name is NULL — the
  // divergence R-G13.14 forbids, reachable through a nullable column.
  const nameless = { ...SWATI, business_name: null };
  const targets = await W.teamTargets(
    stubDb({ vendors: [OWNER, nameless] }), { weddingId: 'w1', ownerVendorId: 'v-dev440' });
  ok('a target with a NULL registered name is dropped, never written nameless',
    !targets.some((t) => !t.name), targets.map((t) => String(t.name)).join(','));
  ok('...and the set shrinks to the owner alone', targets.length === 1, String(targets.length));
});
asyncCells.push(async () => {
  const paused = { ...OWNER, discover_paused: true };
  const targets = await W.teamTargets(
    stubDb({ vendors: [paused, SWATI] }), { weddingId: 'w1', ownerVendorId: 'v-dev440' });
  ok('a PAUSED owner is held to the same liveness test as everyone else',
    !targets.some((t) => t.is_owner), targets.map((t) => t.name).join(','));
});

// ── C3b · THE PAGE SERVES THE TEAM, AND IT IS THE SAME SET ─────────────────
// The roster the guest reads and the set the POST writes must be ONE
// computation, not two that agree. This is the cell that would red if the leaf
// ever went back to calling the team door's GET.
sec('C3b \u00b7 the page payload carries the team (G1.3 rider)');
{
  const pg = strip(read('src/api/public/weddingPage.js'));
  ok('the page door serves a `team` field', /team:\s*W\.teamSet\(/.test(pg));
  ok('...built from the rows it ALREADY holds — no third read',
    /W\.teamSet\(credits, vendorsById, owner\)/.test(pg));
  ok('...and no extra credits/vendors query was added for it',
    (pg.match(/\.from\('wedding_credits'\)/g) || []).length === 0);
  ok('the payload carries names and is_owner only — no id, no handle, no phone',
    /\.map\(\(t\) => \(\{ name: t\.name, is_owner: t\.is_owner \}\)\)/.test(pg));
}
asyncCells.push(async () => {
  // THE TWO PATHS MUST AGREE — driven, not asserted by reading.
  const viaDoor = await W.teamTargets(stubDb(), { weddingId: 'w1', ownerVendorId: 'v-dev440' });
  const viaPage = W.teamSet(CREDITS, BY_ID, OWNER);
  ok('teamTargets and teamSet return the SAME set',
    JSON.stringify(viaDoor) === JSON.stringify(viaPage),
    JSON.stringify(viaDoor) + ' vs ' + JSON.stringify(viaPage));
});

// ── C3c · THE OWNER'S OWN DOOR (F-40.136) ──────────────────────────────────
// THE CELL THAT WAS MISSING. Every G1.3 cell asserted the SET and the WRITES;
// not one asserted that the CONFIRMATION renders a control. The mock drew it
// (frame T4-team-done) and a mock cannot fail, so the hand-off half of R-G13.1
// shipped and never once rendered.
sec('C3c \u00b7 the owner\u2019s door comes from the owner, not from the roll');
{
  const pg = strip(read('src/api/public/weddingPage.js'));
  // AMENDED BY LABEL · CE-45 G6-1 FE_2 (§7c, ruling (a)): the page's link now passes through enquireLinkFor, which
  // is handed the SAME owner-built expression whole as tdwLink (the next cell still pins that expression), so
  // rung 1 is byte-identical. Was: /enquire_link:\s*ENQUIRE_BASE/.
  ok('the page serves owner.enquire_link', /enquire_link:\s*(ENQUIRE_BASE|enquireLinkFor\(\{ tdwLink: ENQUIRE_BASE)/.test(pg));
  ok('...built from the OWNER row, uppercased',
    /ENQUIRE_BASE \+ String\(owner\.routing_handle \|\| ''\)\.toUpperCase\(\)/.test(pg));
  ok('...and ENQUIRE_BASE is imported, never transcribed',
    /require\(.*shapeVendor.*\)/.test(pg) && !/wa\.me/.test(pg));
  // THE DEFAULT FIXTURE IS THE PROOF: DEV440 owns the page and holds NO credit,
  // so a roll lookup finds nothing. The owner's door must survive that.
  const rollHasOwner = W.publicRoll(CREDITS, BY_ID)
    .some((r) => r.name === OWNER.business_name && r.enquire_link);
  ok('the owner is NOT on the fixture roll \u2014 which is why the old lookup failed',
    rollHasOwner === false);
}
{
  const leaf = '../dreamos-pwa/app/v/[code]/w/[slug]/page.tsx';
  const fsx = require('fs');
  if (fsx.existsSync(P(leaf))) {
    const lf = read(leaf);
    ok('the leaf reads owner.enquire_link, not a roll lookup',
      /owner\.enquire_link/.test(lf) && !/data\.roll\.find/.test(lf));
  } else {
    console.log('  REFUSED  sibling pwa absent \u2014 leaf cell not run');
  }
}

// ── C4 · THE SOURCE TOKENS HAVE ONE HOME (F-40.111 / R-G13.2) ──────────────
sec('C4 \u00b7 leadSources');
ok('WEDDING_GUEST_SOURCE is the value the estate already writes',
  LS.WEDDING_GUEST_SOURCE === 'wedding_guest', LS.WEDDING_GUEST_SOURCE);
ok('WEDDING_TEAM_SOURCE is DISTINCT from it (a vendor must tell the two apart)',
  LS.WEDDING_TEAM_SOURCE === 'wedding_team' && LS.WEDDING_TEAM_SOURCE !== LS.WEDDING_GUEST_SOURCE);
ok('WEDDING_SOURCES is frozen', Object.isFrozen(LS.WEDDING_SOURCES));
{
  // THE CURE, ASSERTED AS AN ABSENCE — and comment-stripped, because the cured
  // comment quotes the old literal by design.
  const dl = strip(read(DOWNLOAD));
  ok('the download door no longer SPELLS the guest token in code',
    !/'wedding_guest'/.test(dl));
  ok('...it imports it instead', /require\(.*leadSources.*\)/.test(dl));
  ok('...and hands the CONSTANT to createLead', /source:\s*WEDDING_GUEST_SOURCE/.test(dl));
  const tm = strip(read(TEAM));
  ok('the team door spells no token either', !/'wedding_team'/.test(tm));
  // ⚠ SCOPED TO THE createLead CALL, not the whole file. Rider 5 gave this door a
  // SECOND mention of the constant (the alert row's `source:`), and the loose
  // regex then passed even when the lead itself was written with the wrong
  // token — the mutation pass caught it, which is what it is for.
  {
    const call = tm.slice(tm.indexOf('createLead(supabase, t.vendor_id'), tm.indexOf('written.push'));
    ok('...and hands WEDDING_TEAM_SOURCE to createLead itself',
      /source:\s*WEDDING_TEAM_SOURCE/.test(call), call.slice(0, 0) || 'not in the createLead call');
  }
}

// ── C5 · THE TEAM DOOR'S REFUSALS AND ITS ONE WRITER ────────────────────────
sec('C5 \u00b7 the team door (R-G13.1/.4)');
{
  const tm = strip(read(TEAM));
  ok('createLead is the ONLY lead writer here — no second INSERT',
    !/\.from\(\s*'leads'\s*\)/.test(tm));
  ok('the door never touches vendorInbound (W-1: the intake is out of radius)',
    !/vendorInbound/.test(tm));
  ok('the three page gates are all present',
    /visibility !== 'published'/.test(tm) && /couple_consent !== true/.test(tm) && /discover_paused === true/.test(tm));
  ok('the redirect is 303, never 302 (a re-POST would re-run the fan-out)',
    /redirect\(303/.test(tm) && !/redirect\(302/.test(tm));
  ok('the confirmation is ?team=1 on the SAME leaf, not a new route (R-G13.6)',
    /\?team=1/.test(tm));
  ok('an unticked box writes NOTHING and says so with ?team=0',
    /\?team=0/.test(tm));
  ok('the writes are SEQUENTIAL, never Promise.all (the dedupe reads before it inserts)',
    !/Promise\.all/.test(tm));
  ok('one failed write does not abort the others', /catch\s*\(e\)/.test(tm) && /written\.push/.test(tm));
}
{
  const link = require(P(TEAM)).ownerEnquireLink;
  ok('ownerEnquireLink upper-cases a lowercased handle',
    link('dev440').endsWith('TDW-DEV440'), link('dev440'));
  ok('...and is byte-identical for an already-uppercase one',
    link('dev440') === link('DEV440'));
}

// ── C6 · THE PRINTED UNIT ───────────────────────────────────────────────────
sec('C6 \u00b7 the cards (R-G13.7/.8/.9)');
asyncCells.push(async () => {
  const r = await C.generateWeddingCards({
    title: 'Wedding', studioName: 'Dev Roy Photography',
    pageUrl: 'https://thedreamwedding.in/v/dev440/w/wedding',
  });
  ok('the tent card is a real PDF', Buffer.isBuffer(r.tent) && r.tent.slice(0, 5).toString() === '%PDF-');
  ok('the insert is a real PDF', Buffer.isBuffer(r.insert) && r.insert.slice(0, 5).toString() === '%PDF-');
  ok('they are two DIFFERENT documents, not one rendered twice',
    !r.tent.equals(r.insert));
  // A6 = 297.64 x 420.94 pt; the mock's frame declares 397 x 561 px @96dpi.
  const tentPt = r.tent.toString('latin1').match(/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
  ok('the tent renders at A6 portrait, the vetoed size',
    Boolean(tentPt) && Math.abs(Number(tentPt[1]) - 297.64) < 0.5 && Math.abs(Number(tentPt[2]) - 420.94) < 0.5,
    tentPt && tentPt.slice(1).join(' x '));
  const insPt = r.insert.toString('latin1').match(/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
  ok('the insert renders at 4x6 portrait',
    Boolean(insPt) && Math.abs(Number(insPt[1]) - 288) < 0.5 && Math.abs(Number(insPt[2]) - 432) < 0.5,
    insPt && insPt.slice(1).join(' x '));
});
{
  ok('the renderer is PURE — no supabase, no storage, no fetch',
    !/supabase|storage|fetch\(/.test(strip(read(CARD))));
  ok('...and does not know the site base (siteBase has one home)',
    !/siteBase|thedreamwedding\.in/.test(strip(read(CARD)).replace(/CARD_COPY[\s\S]{0,600}?\}\);/, '')));
  ok('the colophon is byte-identical to the public lane\'s',
    C.CARD_COPY.colophon === 'Created and managed by The Dream Wedding \u00b7 thedreamwedding.in');
  ok('row 24 shipped and 24b did not (the chair chose the neutral register)',
    C.CARD_COPY.insertSay.startsWith('Thank you for being part of the day')
    && !/Dev Roy|photographed this wedding/.test(C.CARD_COPY.insertSay));
  const st = strip(read(STUDIO));
  ok('the card door refuses a page that is not live (a QR to a 404 is permanent)',
    /visibility !== 'published'/.test(st) && /couple_consent !== true/.test(st));
  ok('it answers signed URLs, never PDF bytes on an auth-gated route',
    /card_url/.test(st) && /createSignedUrl/.test(st) && !/res\.type\('application\/pdf'\)/.test(st));
}

// ── C6b · THE DOORS ARE INVOKED, NOT READ (F-40.150) ───────────────────────
// THE CELL THAT WAS MISSING, AND THE REASON THE 500 REACHED PRODUCTION.
// Every other cell in this bench reads SOURCE. Source-reading cannot see an
// undefined free variable: `siteBase()` was called in the card door with no
// import, `node --check` passed it (syntax is fine), the floor passed it (no
// bench loaded the router), and a `grep -n siteBase` printed the CALL SITE which
// the seat read as the import. Three gates and a grep, all green, on a door that
// threw ReferenceError on its first real tap.
//
// So this cell EXECUTES the handler against stubs and asserts it does not throw
// a ReferenceError. It does not care what the door answers — 404, 409 and 500
// are all fine here — only that the code PATH RUNS. A door that cannot resolve
// its own identifiers is broken in a way no amount of reading will show.
sec('C6b \u00b7 the card door runs (F-40.150)');
asyncCells.push(async () => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://stub.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'stub';
  let router;
  try { router = require(P('src/api/vendor/studio/weddings.js')); }
  catch (e) { ok('the studio weddings router loads', false, e.message); return; }
  ok('the studio weddings router loads', true);

  const layer = (router.stack || []).find((l) => l.route && l.route.path === '/:id/cards');
  ok('the card door is mounted at /:id/cards', Boolean(layer));
  if (!layer) return;

  // The LAST handler in the stack is the door itself; the ones before it are
  // auth/tier middleware, which this cell deliberately does not run.
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;

  // A wedding that is live, with an address — so the door gets PAST its 409
  // gates and reaches the line that once threw.
  const wedding = { id: 'w1', slug: 'wedding', title: 'Wedding', visibility: 'published', couple_consent: true };
  const req = {
    params: { id: 'w1' },
    vendor: { id: 'v-dev440', routing_handle: 'DEV440', business_name: 'Dev Roy Photography' },
    app: { locals: { logger: { error() {} }, supabase: {
      from() { return { select() { return this; }, eq() { return this; },
        maybeSingle: async () => ({ data: wedding, error: null }) }; },
      storage: { from() { return {
        upload: async () => ({ error: { message: 'stub-bucket' } }),
        createSignedUrl: async () => ({ data: null }),
      }; } },
    } } },
    body: {},
  };
  let status = null, body = null, threw = null;
  // ⚠ THE DOOR CANNOT BE AWAITED, AND ASSUMING IT COULD IS ITS OWN HOLLOW GREEN.
  // `src/lib/asyncHandler.js` does `Promise.resolve(fn(...)).catch(next)` and
  // RETURNS UNDEFINED — it swallows the promise. So `await handle(...)` awaits
  // `undefined`, resolves on the next tick, and a cell that then read `status`
  // would find `null` for a door that was about to answer perfectly well. The
  // first cut of this cell did exactly that and reported a FAIL on working code.
  //
  // Nor does try/catch help: rejections go to `next`, never to the caller.
  // So the cell waits on the OUTCOME — a response or a `next(err)` — with a
  // deadline, and treats the deadline as a failure rather than a pass.
  const done = new Promise((resolve) => {
    const finish = () => resolve();
    const res0 = {
      status(c) { status = c; return res0; },
      json(b) { body = b; setImmediate(finish); return res0; },
    };
    handle(req, { ...res0, status: res0.status, json: res0.json }, (e) => { threw = e; setImmediate(finish); });
    setTimeout(finish, 3000);
  });
  await done;

  const isRef = threw && threw.name === 'ReferenceError';
  ok('the card door resolves every identifier it calls \u2014 no ReferenceError',
    !isRef, threw ? `${threw.name}: ${threw.message}` : '');
  ok('...and it answered rather than crashed', status !== null || !threw,
    threw ? String(threw.message) : `status ${status}`);
  // The stub refuses the upload, so a RUNNING door must report that refusal —
  // which is only reachable if `siteBase()` resolved on the line above it.
  ok('...reaching the upload, which is past the line that used to throw',
    status === 500 && body && /stub-bucket/.test(String(body.error)),
    `status ${status} body ${JSON.stringify(body)}`);
});

// ── C6c · THE LEAD ALERT (R-40.72) ─────────────────────────────────────────
// Nine leads were written across G1.2 and G1.3 and NOT ONE VENDOR WAS TOLD.
// These cells drive the real module with a stubbed `sendWa`, so what is asserted
// is behaviour and not the presence of a require.
sec('C6c \u00b7 the wedding-lead alert (R-40.72)');
{
  const A = fresh('src/lib/vendor/weddingLeadAlert.js');
  ok('the cap is TEN, and it is a named constant', A.MAX_ALERTS_PER_TAP === 10, String(A.MAX_ALERTS_PER_TAP));
  const src = strip(read('src/lib/vendor/weddingLeadAlert.js'));
  // ── LABELLED AMENDMENT · G1.3 rider 5, F-40.176. COUNT PRESERVED (1 -> 1).
  // It asserted the literal AT THE CALL SITE. Rider 5 hoists it to TEMPLATE_KEY
  // so the Utility re-point is one line, which is the whole point of the hoist —
  // so the cell now asserts the CONSTANT'S VALUE and that the call site reads it.
  // Asserting the literal where it used to be would have pinned the pre-cure
  // shape and reddened the moment the cure landed.
  // ── LABELLED AMENDMENT · F-40.176 CLOSED AT THE REGISTRY. COUNT MOVES +2.
  // It pinned `lead_alert_basic`. Meta returned tdw_lead_alert_utility ACTIVE as
  // UTILITY, so the pointer moved and the cell follows the law rather than the
  // shape it was written against. What it asserts now is the PROPERTY that
  // mattered all along — the alert rides a template the marketing throttle
  // cannot touch — plus the reason the sibling is kept rather than deleted.
  ok('the alert rides the UTILITY template, not the throttled MARKETING one',
    A.TEMPLATE_KEY === 'lead_alert_utility' && /templateKey: TEMPLATE_KEY/.test(src));
  {
    const T = fresh('src/lib/templates.js').TEMPLATES;
    ok('...and the registry agrees it is UTILITY and approved',
      T.lead_alert_utility && T.lead_alert_utility.category === 'UTILITY'
      && T.lead_alert_utility.status === 'approved',
      T.lead_alert_utility ? T.lead_alert_utility.category + '/' + T.lead_alert_utility.status : 'absent');
    // lead_alerts rows written before today name the old key in `template_key`;
    // a registry that forgot it would make its own history unreadable.
    ok('the MARKETING sibling is kept, not deleted \u2014 old rows must stay resolvable',
      Boolean(T.lead_alert_basic));
  }
  ok('UNTIERED \u2014 the paid template is never reached from here',
    !/enquiry_alert_vendor/.test(src));
  ok('not one variable carries the guest\u2019s identity',
    !/bride|guest_name|\bphone\b\s*\]/.test(src.split('vars:')[1].split(']')[0]));
  ok('the month rides monthPhrase\u2019s one home, so a blank month reads "upcoming"',
    /monthPhrase\(weddingDate\)/.test(src) && !/'upcoming'/.test(src));
  ok('the opt-out gate is sendWa\u2019s, not reimplemented',
    !/isOptedOut|opted_out.*=.*await/.test(src) && /WaOptedOutError/.test(src));
  ok('the room\u2019s told state reads wamid only', /wamid/.test(src) && !/body:.*out\./.test(src));
}
{
  // BOTH DOORS CALL IT, AFTER THE WRITE.
  const tm = strip(read(TEAM)), dl = strip(read(DOWNLOAD));
  ok('the team door alerts', /alertWeddingLead\(/.test(tm));
  ok('...with the SAME target set it wrote leads to', /targets, weddingDate/.test(tm));
  ok('...after the writes, before the redirect',
    tm.indexOf('alertWeddingLead(') > tm.indexOf('createLead(')
    && tm.indexOf('alertWeddingLead(') < tm.lastIndexOf('res.redirect(303'));
  ok('the download door alerts the OWNER, one target',
    /alertWeddingLead\(/.test(dl) && /vendor_id: owner\.id/.test(dl));
  ok('...and ONLY when a lead was actually written',
    /if \(leadWritten\)/.test(dl));
  ok('neither door can be turned into a 500 by a failed alert',
    /alerts:threw/.test(tm) && /alert:threw/.test(dl));
}
asyncCells.push(async () => {
  const A = fresh('src/lib/vendor/weddingLeadAlert.js');
  // A stub db that answers the module's two reads, and 12 targets to prove the cap.
  const many = Array.from({ length: 12 }, (_, i) => ({ vendor_id: 'v' + i, name: 'V' + i }));
  const db = { from(t) { const api = { _t: t, _ids: null,
      select() { return api; }, in(_c, ids) { api._ids = ids; return api; },
      then(r) { return Promise.resolve(api._rows()).then(r); },
      _rows() {
        if (api._t === 'vendors') return { data: api._ids.map((id) => ({ id, user_id: 'u' + id, business_name: 'Reg ' + id })) };
        return { data: api._ids.map((id) => ({ id, phone: '+9199' + id })) };
      } }; return api; } };
  let logged = null;
  const out = await A.alertWeddingLead(db, { targets: many, weddingDate: null, logger: { error(k, v) { if (k === 'weddingLeadAlert:capped') logged = v; } } });
  ok('twelve targets attempt TEN sends, never twelve', out.attempted === 10, String(out.attempted));
  ok('...and the two it refused are REPORTED, never silently trimmed',
    out.skipped === 2 && logged && logged.skipped === 2, JSON.stringify(logged));
  const few = await A.alertWeddingLead(db, { targets: [{ vendor_id: 'v1', name: 'A' }], weddingDate: null, logger: null });
  ok('a normal roll is not capped', few.attempted === 1 && few.skipped === 0);
  const none = await A.alertWeddingLead(db, { targets: [], weddingDate: null, logger: null });
  ok('no targets is an answer, not a throw', none.attempted === 0);
});
asyncCells.push(async () => {
  const A = fresh('src/lib/vendor/weddingLeadAlert.js');
  // A vendor with no phone is a FACT about that account, not a failure of ours —
  // and the lead is already written, so refusing would undo nothing.
  const r = await A.alertOne({}, { vendorId: 'v1', vendorName: 'A', userPhone: null, weddingDate: null });
  ok('a vendor with no phone is reported, never thrown',
    r.sent === false && r.reason === 'no_phone');
});

// ── C6d · RIDER 5 · THE ALERT IS RECORDED, THE NUMBER IS E.164 ─────────────
sec('C6d \u00b7 rider 5 (F-40.177 / F-40.179)');
{
  const { toE164 } = fresh('src/lib/phone.js');
  ok('toE164 turns the walk\u2019s bare digits into E.164',
    toE164('8595363978') === '+918595363978', toE164('8595363978'));
  ok('...and is idempotent on an already-normalised number',
    toE164('+918595363978') === '+918595363978');
  const tm = strip(read(TEAM)), dl = strip(read(DOWNLOAD));
  // THE EXTENT, NOT THE SPECIMEN (R-40.64). The finding named the team door;
  // the download door had the identical line and has been writing rows since G1.2.
  ok('the team door normalises before createLead', /toE164\(String\(body\.phone/.test(tm));
  ok('the download door does too \u2014 the extent, not the specimen',
    /toE164\(String\(body\.phone/.test(dl));
  ok('neither door normalises INSIDE createLead (it dedupes on the phone key)',
    !/toE164/.test(strip(read('src/lib/vendor/leads.js'))));
}
{
  const src = strip(read('src/lib/vendor/weddingLeadAlert.js'));
  ok('every outcome writes a lead_alerts row, not just the good one',
    (src.match(/recordAlert\(/g) || []).length >= 4, String((src.match(/recordAlert\(/g) || []).length));
  ok('a failed send still records \u2014 wamid null, status the reason',
    /wamid: null, status: reason/.test(src));
  ok('no_phone is a recorded outcome, not a silent return', /status: 'no_phone'/.test(src));
  // ── LABELLED AMENDMENT · F-40.176. COUNT PRESERVED (1 -> 1).
  // It was named "has ONE home, ready to re-point" and then PINNED THE VALUE of
  // that home — so the first re-point, which is the thing it existed to make
  // safe, is what broke it. A cell that reddens when its own purpose is fulfilled
  // was testing the shape and not the property. It now asserts what its name
  // says: exactly one declaration, no literal at any call site.
  ok('the template has ONE home, ready to re-point (F-40.176)',
    (src.match(/const TEMPLATE_KEY = '/g) || []).length === 1
    && !/templateKey: 'lead_alert/.test(src));
  ok('bookkeeping never throws \u2014 the send already happened',
    /catch \(e\)[\s\S]{0,120}leadAlert:record/.test(src));
  const rs = strip(read('src/lib/vendor/relayStatus.js'));
  ok('the receipt router has a SECOND home for wamids',
    /from\('lead_alerts'\)/.test(rs));
  ok('...checked only on a MISS, so the conversation plane keeps priority',
    rs.indexOf("from('lead_alerts')") > rs.indexOf("from('messages')"));
  ok('...and it is .select()ed, never a blind update (F-06.143)',
    /from\('lead_alerts'\)[\s\S]{0,320}\.select\(/.test(rs));
  ok('the orphan sentence still runs when neither home matches',
    /NO ROW CARRIES THIS SID/.test(rs));
  const sql = read('db/migrations/0141_lead_alerts.sql');
  ok('0141 makes the wamid UNIQUE where present \u2014 the ambiguity refusal needs it',
    /CREATE UNIQUE INDEX[\s\S]{0,120}lead_alerts \(wamid\) WHERE wamid IS NOT NULL/.test(sql));
  ok('...and the plain index is PARTIAL too', /idx_lead_alerts_wamid[\s\S]{0,80}WHERE wamid IS NOT NULL/.test(sql));
  ok('0141 touches public.messages nowhere', !/ALTER TABLE public\.messages|INSERT INTO public\.messages/.test(sql));
}

// ── C6e · THE ALERT ROW IS DRIVEN, NOT READ (F-40.210) ─────────────────────
// THE CELL THAT WAS MISSING, AND THE SEAT NAMED THE HOLE BEFORE IT SHIPPED.
// C6c/C6d assert that `recordAlert(` APPEARS in the module. Appearing is not
// working: this bench's stub had no `.insert`, so every row write in every prior
// run FAILED and was swallowed by the module's own (correct) catch — twelve
// `[leadAlert:record] insert failed` lines scrolled past a green floor, and the
// walk then wrote two production rows with `wamid: null`.
//
// So the stub LEARNS `.insert`, CAPTURES the rows, and these cells assert their
// SHAPE against 0141's columns. "An assertion that reads is not an assertion
// that runs" — R-40.94's second clause, third specimen of the day.
sec('C6e \u00b7 the lead_alerts row, driven (F-40.210)');
function alertStubDb(rows) {
  return {
    from(t) {
      if (t === 'lead_alerts') {
        return { insert: async (r) => { rows.push(r); return { error: null }; } };
      }
      const api = {
        _t: t, _ids: [],
        select() { return api; },
        in(_c, ids) { api._ids = ids || []; return api; },
        then(res) { return Promise.resolve(api._rows()).then(res); },
        _rows() {
          if (api._t === 'vendors') {
            return { data: api._ids.map((id) => ({ id, user_id: 'u' + id, business_name: 'Reg ' + id })) };
          }
          return { data: api._ids.map((id) => ({ id: id, phone: '+919812345678' })) };
        },
      };
      return api;
    },
  };
}
asyncCells.push(async () => {
  // `sendWa` is stubbed at its REAL shape — the one derived Meta-outward through
  // metaCloud.js:156 -> sendWa.js:252 — so the extraction is exercised against
  // exactly what it receives in production. Stubbing `{ wamid }` at the top
  // level would have let the old, broken read pass.
  const sendWaPath = require.resolve(P('src/lib/sendWa.js'));
  const cached = require.cache[sendWaPath];
  require.cache[sendWaPath] = {
    id: sendWaPath, filename: sendWaPath, loaded: true, exports: {
      sendWa: async () => ({
        sent: true, mode: 'template', key: 'lead_alert_utility',
        from: 'f', to: 't', payload: {},
        result: { ok: true, wamid: 'wamid.TEST123', raw: {} },
      }),
    },
  };
  const rows = [];
  let A2;
  try {
    A2 = fresh('src/lib/vendor/weddingLeadAlert.js');
    await A2.alertWeddingLead(alertStubDb(rows), {
      targets: [{ vendor_id: 'v1', name: 'Reg v1' }],
      weddingDate: null, logger: null, source: 'wedding_team',
    });
  } finally {
    if (cached) require.cache[sendWaPath] = cached; else delete require.cache[sendWaPath];
  }

  ok('a successful send writes exactly one lead_alerts row', rows.length === 1, String(rows.length));
  const r = rows[0] || {};
  // ⚠ THE ASSERTION F-40.210 NEEDED. A null here IS the defect: the row exists,
  // the receipt router matches nothing, and the status freezes at `sent` while
  // Meta reports delivered and read to nobody.
  ok('...carrying the wamid from out.result.wamid, never null',
    r.wamid === 'wamid.TEST123', String(r.wamid));
  ok('...with status sent', r.status === 'sent', String(r.status));
  // 0141's columns, by name. A row the table would reject fails SILENTLY,
  // because recordAlert catches and warns by design.
  const COLS = ['vendor_id', 'lead_id', 'source', 'template_key', 'wamid', 'status', 'error_code', 'error_title'];
  ok('...and every key it writes is a column 0141 created',
    Object.keys(r).every((k) => COLS.includes(k)), Object.keys(r).join(','));
  ok('...naming the template actually sent, not one inferred from source',
    r.template_key === 'lead_alert_utility', String(r.template_key));
  ok('...and the source it was told', r.source === 'wedding_team', String(r.source));
});
asyncCells.push(async () => {
  // A vendor with no phone: the row is still written and its wamid is null
  // because META NEVER SAW IT. That null is meaningful; F-40.210's was a bug.
  // The two are indistinguishable in the table, which is why `status` carries
  // the reason and the cell asserts both together.
  const A = fresh('src/lib/vendor/weddingLeadAlert.js');
  const rows = [];
  await A.alertOne(alertStubDb(rows), {
    vendorId: 'v9', vendorName: 'A', userPhone: null, weddingDate: null, source: 'wedding_guest',
  });
  ok('a no_phone outcome is RECORDED, with a meaningful null wamid',
    rows.length === 1 && rows[0].status === 'no_phone' && rows[0].wamid === null,
    JSON.stringify(rows[0] || null));
});

// ── C7 · THE PROBE ──────────────────────────────────────────────────────────
sec('C7 \u00b7 the reel probe (R-G13.10)');
{
  const st = read(STUDIO);
  const probeAt = st.indexOf("router.get('/reel-probe'");
  const idAt    = st.indexOf("router.get('/:id'");
  ok('the probe is declared ABOVE /:id — below it, the literal route is unreachable',
    probeAt > 0 && idAt > 0 && probeAt < idAt, `probe@${probeAt} id@${idAt}`);
  const sst = strip(st);
  ok('the probe reads the RUNNING SERVICE, not a repo file',
    /spawn\('ffmpeg'/.test(sst));
  ok('it carries a timeout (a probe that can hang is a room that can hang)',
    /setTimeout/.test(sst) && /SIGKILL/.test(sst));
  // C1 amendment (labeled): the flag is `flag.wedding_reel` on the switchboard (R-41.38).
  ok('reel_enabled is NOT just probe.present — the flag still governs (build-dark law)',
    /(^|[^.\w])cap\.on\(REEL_CAP_KEY\)/.test(sst) && /'flag\.wedding_reel'/.test(sst));
  ok('a missing binary is an ANSWER, never a 500', /not_installed/.test(sst));
  // ── THE CARRY (the em dash) ──────────────────────────────────────────────
  // The record drew 「—」 until a vendor tapped `Check again`, and forgot again on
  // the next open because it was component state. An honest placeholder that is
  // ALWAYS showing is a worse answer than the answer.
  ok('the probe has ONE reader, called by both doors',
    /async function readFfmpeg\(/.test(sst)
    && (sst.match(/readFfmpeg\(\)/g) || []).length >= 2);
  ok('the list door carries the reel shape, so the record needs no tap',
    /weddings: rows, reel: await reelShape\(await readFfmpeg\(\)\)/.test(sst));
  ok('the flag rule has one home too \u2014 reelShape, not two spellings',
    (sst.match(/cap\.on\(REEL_CAP_KEY\)/g) || []).length === 1);
}

// ── C8 · 0137 AND THE DATE PAIR ─────────────────────────────────────────────
sec('C8 \u00b7 0137 (R-G13.11)');
{
  const sql = read(MIG137);
  const flat = sql.replace(/\s+/g, ' ');
  ok('both columns are added, nullable', /wedding_date date NULL/.test(flat) && /wedding_date_precision text NULL/.test(flat));
  ok('the precision vocabulary is leads\' own three words',
    /weddings_wedding_date_precision_check[\s\S]*?'day'::text, 'month'::text, 'year'::text/.test(flat));
  ok('the PAIR is enforced by the database, not promised in a comment',
    /\(wedding_date IS NULL\) = \(wedding_date_precision IS NULL\)/.test(flat));
  ok('nothing on public.events moves (R-40.11 stands)',
    !/ALTER TABLE public\.events/.test(sql));
  ok('the live partial indexes are not dropped',
    !/DROP INDEX/.test(sql));
  ok('WEDDING_COLS carries the two new columns',
    /wedding_date, wedding_date_precision/.test(W.WEDDING_COLS), W.WEDDING_COLS);
}
{
  // Season derivation: the event wins, the typed date is the fallback, neither
  // is a guess.
  const withEvent = W.publicWedding({ slug: 's', title: 't', venue: null, city: null, wedding_date: '2026-06-01' }, '2026-12-14');
  ok('an event dates the page even when a typed date exists', withEvent.season === 'Winter 2026', withEvent.season);
  const typedOnly = W.publicWedding({ slug: 's', title: 't', venue: null, city: null, wedding_date: '2026-06-01' }, null);
  ok('with no event, the typed date dates it', typedOnly.season === 'Summer 2026', typedOnly.season);
  const neither = W.publicWedding({ slug: 's', title: 't', venue: null, city: null, wedding_date: null }, null);
  ok('with neither, season is null — never a guessed date', neither.season === null, String(neither.season));
}
{
  const st = strip(read(STUDIO));
  ok('the create door refuses NEITHER an event nor a date',
    /An event or a date is required/.test(st));
  ok('...and refuses BOTH (two dates for one wedding is the drift R-G11.16 killed)',
    /not both/.test(st));
}

// ── C9 · THE MOUNT ──────────────────────────────────────────────────────────
sec('C9 \u00b7 the mount');
ok('wedding-team is mounted beside the other public wedding doors',
  /public\/wedding-team.*weddingTeam/.test(read(ROUTER).replace(/\n/g, ' ')));
ok('it is NOT mounted under /vendor (it carries no session)',
  !/vendor.*weddingTeam/.test(read(ROUTER)));

// ── RUN THE ASYNC CELLS, THEN REPORT ────────────────────────────────────────
(async () => {
  for (const cell of asyncCells) await cell();

  console.log('\n' + '\u2500'.repeat(60));
  console.log(`b57_g13_team_bench: ${pass}/${pass + fail}`);
  if (fail) { console.log(`${fail} FAILING`); process.exit(1); }

  if (process.argv.includes('--mutate')) {
    console.log('\n=== MUTATION PASS \u2014 each edits PRODUCTION code and must RED ===');
    const MUTATIONS = [
      // 1 · the door built from the lowercased handle — the exact defect
      //     vendorCard.js warns about, and it "works" today only because the
      //     intake upper-cases.
      [LIB, 'ENQUIRE_BASE + String(v.routing_handle)', 'ENQUIRE_BASE + String(v.routing_handle).toLowerCase()'],
      // 2 · linkability drops the vendor-exists term — the claimed-with-NULL
      //     credit would gain a door to nowhere.
      [LIB, "&& vendor\n    && vendor.status === 'active'", "&& vendor.status === 'active'"],
      // 3 · the target set keyed by credit instead of by vendor.
      [LIB, 'if (out.has(v.id)) continue;', ''],
      // 3b · the page stops serving the team from the rows it holds.
      ['src/api/public/weddingPage.js', 'W.teamSet(credits, vendorsById, owner)', 'W.teamSet(credits, vendorsById, null)'],
      // 3c · the owner's door stops being served — the hand-off dies silently.
      ['src/api/public/weddingPage.js', "enquire_link: ENQUIRE_BASE + String(owner.routing_handle || '').toUpperCase(),", ''],
      // 3d · the card door loses its siteBase import again — F-40.150 restored.
      ['src/api/vendor/studio/weddings.js', 'sendConsentInvite, siteBase }', 'sendConsentInvite }'],
      // 3e · the list stops carrying the probe — the record goes back to the em dash.
      ['src/api/vendor/studio/weddings.js', 'weddings: rows, reel: reelShape(await readFfmpeg())', 'weddings: rows'],
      // 3f · the alert cap is removed — one guest tap could message a whole roll.
      ['src/lib/vendor/weddingLeadAlert.js', 'const MAX_ALERTS_PER_TAP = 10;', 'const MAX_ALERTS_PER_TAP = 9999;'],
      // 3g · the download door alerts even when no lead was written.
      ['src/api/public/weddingDownload.js', 'if (leadWritten) {', 'if (true) {'],
      // 3h · the alert is tiered after all — the distinction with nothing behind it.
      ['src/lib/vendor/weddingLeadAlert.js', "const TEMPLATE_KEY = 'lead_alert_utility';", "const TEMPLATE_KEY = 'lead_alert_basic';"],
      // 3i · the team door stops normalising — F-40.179 restored.
      ['src/api/public/weddingTeam.js', 'toE164(String(body.phone', 'String(body.phone'],
      // 3j · the receipt router loses its second home — F-40.177 restored.
      ['src/lib/vendor/relayStatus.js', ".from('lead_alerts')", ".from('lead_alerts_gone')"],
      // 3k · a failed send stops being recorded.
      ['src/lib/vendor/weddingLeadAlert.js', 'wamid: null, status: reason,', 'wamid: null,'],
      // 3l · the wamid read reverts to the shape that never existed — F-40.210.
      ['src/lib/vendor/weddingLeadAlert.js', '(out.result && out.result.wamid)', '(out.nowhere)'],
      // 3m · the alert row stops carrying the wamid at all.
      ["src/lib/vendor/weddingLeadAlert.js", "template_key: TEMPLATE_KEY, wamid, status: 'sent'", "template_key: TEMPLATE_KEY, wamid: null, status: 'sent'"],
      // 4 · nameless targets no longer dropped.
      [LIB, 'return [...out.values()].filter((t) => t.name);', 'return [...out.values()];'],
      // 5 · the guest token spelled at the door again (F-40.111 restored).
      [DOWNLOAD, 'source: WEDDING_GUEST_SOURCE,', "source: 'wedding_guest',"],
      // 6 · the team token collapsed onto the guest one.
      [TEAM, 'source: WEDDING_TEAM_SOURCE,', 'source: WEDDING_GUEST_SOURCE,'],
      // 7 · 302 instead of 303 — a refresh re-runs the whole fan-out.
      [TEAM, 'return res.redirect(303,\n    `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}?team=1`);',
             'return res.redirect(302,\n    `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}?team=1`);'],
      // 8 · the card door stops refusing an unpublished page.
      [STUDIO, "if (wedding.visibility !== 'published' || wedding.couple_consent !== true) {\n    return errRes(res, 409, 'This page is not live yet.');\n  }", ''],
      // 9 · the pair CHECK removed from 0137.
      [MIG137, '(wedding_date IS NULL) = (wedding_date_precision IS NULL)', 'true'],
      // 10 · the reel flag collapsed onto the probe — an image change would turn
      //      a dark feature on with nobody ruling it.
      [STUDIO, "reel_enabled: cap.on(REEL_CAP_KEY) && probe.present === true,",
               'reel_enabled: probe.present === true,'],
    ];
    let bit = 0;
    for (const [rel, from, to] of MUTATIONS) {
      const orig = read(rel);
      if (!orig.includes(from)) {
        console.log(`  SKIP-REFUSED ${rel}: anchor absent \u2014 the mutation would have matched nothing`);
        fail++; continue;
      }
      fs.writeFileSync(P(rel), orig.replace(from, to));
      const r = spawnSync(process.execPath, [__filename], { encoding: 'utf8' });
      fs.writeFileSync(P(rel), orig);
      const red = r.status !== 0;
      if (red) { bit++; console.log(`  ok   RED on: ${rel} \u00b7 ${from.slice(0, 58).replace(/\n/g, ' ')}\u2026`); }
      else { fail++; console.log(`  FAIL GREEN on: ${rel} \u00b7 ${from.slice(0, 58).replace(/\n/g, ' ')}\u2026`); }
    }
    console.log(`\nmutations biting: ${bit}/${MUTATIONS.length}`);
    if (bit !== MUTATIONS.length) process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
