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
  ok('...and hands WEDDING_TEAM_SOURCE to createLead', /source:\s*WEDDING_TEAM_SOURCE/.test(tm));
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
  ok('reel_enabled is NOT just probe.present — the flag still governs (build-dark law)',
    /WEDDING_REEL_ENABLED/.test(sst));
  ok('a missing binary is an ANSWER, never a 500', /not_installed/.test(sst));
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
      [STUDIO, "reel_enabled: String(process.env.WEDDING_REEL_ENABLED || '') === '1' && probe.present === true,",
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
