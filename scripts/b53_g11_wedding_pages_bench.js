#!/usr/bin/env node
'use strict';
// scripts/b53_g11_wedding_pages_bench.js
// BLOCK 19 · G1.1 · WEDDING PAGES — the sitting's bench.
//
// Every cell asserts a SURFACE or a BEHAVIOUR. None asserts a line number and
// none asserts where a constant lives — the bench-discipline law.
//
// THE MUTATION PASS (--mutate) is the both-ways half: each mutation edits
// PRODUCTION CODE, not test setup, re-runs the cells in a child process, and
// requires RED. A mutation that leaves the bench green is a cell that was
// never testing what its name claims.

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

const MIGRATION = 'db/migrations/0131_wedding_pages.sql';
const LIB       = 'src/lib/vendor/weddings.js';
const SEASON    = 'src/lib/season.js';
const PUBDOOR   = 'src/api/public/weddingPage.js';
const STUDIO    = 'src/api/vendor/studio/weddings.js';
const CREDITS   = 'src/api/credits.js';
const INVITE    = 'src/lib/vendor/creditInvite.js';

for (const rel of [MIGRATION, LIB, SEASON, PUBDOOR, STUDIO, CREDITS, INVITE]) {
  if (!fs.existsSync(P(rel))) {
    console.log('REFUSED \u2014 ' + rel + ' is absent');
    process.exit(3);
  }
}

let pass = 0, fail = 0;
const ok = (n, c, d) => {
  if (c) { pass++; console.log('  ok   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  \u2192 ' + d : '')); }
};
const sec = (t) => console.log('\n' + t);

// Fresh require each run so a mutated file is actually re-read.
const fresh = (rel) => { delete require.cache[P(rel)]; return require(P(rel)); };
const W = fresh(LIB);
const S = fresh(SEASON);

// ── C1 · THE SLUG RULE MATCHES THE RATIFIED FRAMES ──────────────────────────
// The sitting's best catch. A first cut expanded `&` to ` and `, which is the
// tidier rule and would have shipped `priya-and-arjun` while every ratified
// shot draws `priya-arjun`. The mock outranks the tidier rule (R-39.15's class:
// the rendered surface outranks the instrument reasoning about it).
sec('C1 \u00b7 the slug rule against the mock\'s own addresses');
for (const [title, want] of [
  ['Priya & Arjun',     'priya-arjun'],       // W1-page:  /v/DEV440/w/priya-arjun
  ['Ritika & Sameer',   'ritika-sameer'],     // W3-create: .../w/ritika-sameer
  ['Verma - reception', 'verma-reception'],   // the ruled fixture (R-G11.20)
  ['Sharma - sangeet',  'sharma-sangeet'],
]) ok('slugify(' + JSON.stringify(title) + ') = ' + want, W.slugify(title) === want, W.slugify(title));
ok('a non-ascii title still slugs (no empty-string collision under the UNIQUE)',
  W.slugify('Priy\u0101 \u015aarm\u0101') === 'priya-sarma', W.slugify('Priy\u0101 \u015aarm\u0101'));

// ── C2 · THE ROLL'S ORDER IS R-40.7's, NOT ALPHABETICAL ─────────────────────
// Alphabetical would be decor,hair,makeup,... putting the photographer SEVENTH
// on her own page. The order is a ruled anti-feature.
sec('C2 \u00b7 the roll order');
const RULED = ['shot_by','makeup','hair','decor','mehendi','planner','styled_by','wearing','model','venue'];
ok('ROLE_KEYS is R-40.7\'s ten in R-40.7\'s order',
  JSON.stringify(W.ROLE_KEYS) === JSON.stringify(RULED), W.ROLE_KEYS.join(','));
ok('the ruled order is NOT alphabetical (the cell would be vacuous if it were)',
  JSON.stringify(RULED) !== JSON.stringify([...RULED].sort()));
{
  // Sorting behaviour, not just the constant: feed the roll in reversed order.
  const rows = [...RULED].reverse().map((r, i) => ({ role: r, created_at: '2026-01-0' + (i % 9 + 1) }));
  const sorted = rows.sort((a, b) => W.ROLE_INDEX[a.role] - W.ROLE_INDEX[b.role]).map((r) => r.role);
  ok('a reversed roll sorts back into ruled order', JSON.stringify(sorted) === JSON.stringify(RULED));
}

// ── C3 · THE MIGRATION IS THE WITNESS FOR THE ROLE KEYS ─────────────────────
// One home made true rather than asserted: the CHECK is parsed out of the
// migration and compared to the lib. Two lists cannot drift silently.
sec('C3 \u00b7 the CHECK and the lib cannot drift');
{
  const sql = read(MIGRATION);
  const m = sql.match(/wedding_credits_role_check CHECK \(role = ANY \(ARRAY\[([\s\S]*?)\]\)\)/);
  ok('0131 declares wedding_credits_role_check', Boolean(m));
  if (m) {
    const fromSql = [...m[1].matchAll(/'([a-z_]+)'::text/g)].map((x) => x[1]);
    ok('the CHECK\'s ten equal ROLE_KEYS, in order',
      JSON.stringify(fromSql) === JSON.stringify(W.ROLE_KEYS), fromSql.join(','));
  }
  ok('the status CHECK carries exactly tagged|claimed|declined',
    /wedding_credits_status_check[\s\S]*?'tagged'::text[\s\S]*?'claimed'::text[\s\S]*?'declined'::text/.test(sql));
  ok('slug UNIQUE is scoped PER OWNER (R-G11.4), never global',
    /UNIQUE \(owner_vendor_id, slug\)/.test(sql));
  // Whitespace-collapsed before matching: the DDL is column-aligned for reading
  // and an alignment change is not a semantic change. A cell that reddens when
  // someone tidies a space is a cell that trains people to ignore it.
  const flat = sql.replace(/\s+/g, ' ');
  ok('event_id is NULLABLE with ON DELETE SET NULL (R-G11.21)',
    /event_id uuid NULL REFERENCES public\.events \(id\) ON DELETE SET NULL/.test(flat));
  ok('owner_vendor_id is NOT NULL and cascades',
    /owner_vendor_id uuid NOT NULL REFERENCES public\.vendors \(id\) ON DELETE CASCADE/.test(flat));
  ok('0131 stores public_id on the photo plane (F-07.14\'s defect not inherited)',
    /public_id\s+text\s+NOT NULL/.test(sql));
  ok('0131 declares NO season column (R-G11.16)', !/\bseason\b\s+text/.test(sql));
}

// ── C4 · THE MISS LAW — ONE BODY, THREE REASONS, BEFORE THE ASSET READ ──────
sec('C4 \u00b7 the public door\'s miss law (R-G11.5)');
{
  const src = read(PUBDOOR);
  const bodies = [...src.matchAll(/res\.status\(404\)\.json\(([^)]*)\)/g)].map((m) => m[1].trim());
  ok('every 404 on this door shares ONE body', new Set(bodies).size === 1, bodies.join(' | '));
  ok('the miss body is vendorCard.js\'s byte-identical twin',
    bodies.length > 0 && bodies.every((b) => /ok:\s*false,\s*error:\s*'Not found\.'/.test(b)), bodies[0]);
  for (const [name, re] of [
    ['absent wedding returns the miss',      /if \(!wedding\) return notFound\(res\)/],
    ['unpublished returns the SAME miss',    /visibility !== 'published'\) return notFound\(res\)/],
    ['consent-off returns the SAME miss',    /couple_consent !== true\) return notFound\(res\)/],
    ['a paused or inactive owner too',       /status !== 'active' \|\| owner\.discover_paused === true\) return notFound\(res\)/],
  ]) ok(name, re.test(src));

  // THE ORDER IS THE RULING (vendorCard.js:319-322): the photos are never even
  // asked for. Positional, because that is precisely what is being asserted.
  const iConsent = src.indexOf("couple_consent !== true");
  const iPhotos  = src.indexOf('photosFor');
  ok('the consent gate stands BEFORE the photo read', iConsent > -1 && iPhotos > iConsent);
}

// ── C5 · NO PHONE ON THE PUBLIC WIRE (R-G11.6) ──────────────────────────────
sec('C5 \u00b7 phones never reach a guest');
{
  const credits = [
    { role: 'shot_by', vendor_id: 'v1', phone: '+919888294440', name: null, status: 'claimed', claim_token: 'tok-a' },
    { role: 'hair',    vendor_id: null, phone: '+919999999999', name: 'Neha Sharma', status: 'tagged', claim_token: 'tok-b' },
    { role: 'decor',   vendor_id: null, phone: '+918888888888', name: 'Rangoli Events', status: 'declined', claim_token: 'tok-c' },
  ];
  const vendors = { v1: { id: 'v1', business_name: 'Dev Roy Photography', routing_handle: 'DEV440', status: 'active', discover_paused: false } };
  const roll = W.publicRoll(credits, vendors);
  const wire = JSON.stringify(roll);
  ok('no phone digits appear anywhere in the public roll', !/\+?9\d{9}/.test(wire), wire);
  ok('no claim_token appears in the public roll', !/tok-/.test(wire), wire);
  ok('no key named phone or claim_token exists on any roll entry',
    roll.every((r) => !('phone' in r) && !('claim_token' in r)));
  ok('a DECLINED credit is absent from the roll entirely',
    !roll.some((r) => r.name === 'Rangoli Events'), wire);
  ok('a claimed, active vendor is linkable', roll.find((r) => r.role === 'shot_by').handle === 'dev440');
  ok('an unclaimed credit renders name with NO link',
    roll.find((r) => r.role === 'hair').handle === null);
  const paused = W.publicRoll([credits[0]], { v1: { ...vendors.v1, discover_paused: true } });
  ok('a paused vendor\'s credit loses its link (never a URL that would 404)', paused[0].handle === null);
}

// ── C6 · ONE SIGNER IN THE TREE (R-G11.22 / F-40.34) ────────────────────────
sec('C6 \u00b7 the upload signing has one home');
{
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
      if (!e.name.endsWith('.js')) continue;
      const txt = fs.readFileSync(p, 'utf8');
      if (/folder=\$\{folder\}&public_id=\$\{publicId\}&timestamp=/.test(txt)) hits.push(path.relative(ROOT, p));
    }
  };
  walk(P('src'));
  ok('exactly ONE file builds the upload params-to-sign string', hits.length === 1, hits.join(', '));
  ok('and it is the declared home', hits[0] === 'src/lib/cloudinarySign.js', hits[0]);
  // The destroy signing is a DIFFERENT endpoint and R-G11.13 keeps it put.
  ok('the destroy signing is untouched and still lives outside the signer',
    /public_id=\$\{publicId\}&timestamp=/.test(read('src/lib/vendor/portfolio.js')));
}

// ── C7 · THE TEMPLATE IS DARK, ON TWO INDEPENDENT GATES ─────────────────────
sec('C7 \u00b7 the claim send is dark (F-40.21, build-dark law)');
{
  const t = fresh('src/lib/templates.js');
  ok('wedding_credit is registered', Boolean(t.getTemplate('wedding_credit')));
  ok('and is NOT approved', t.isApproved('wedding_credit') === false);
  ok('it declares exactly four variables',
    JSON.stringify(t.getTemplate('wedding_credit').variables) === JSON.stringify(['owner','role','wedding','link']));
  const inv = fresh(INVITE);
  const gate = inv.sendGate();
  ok('the send gate is SHUT', gate.open === false);
  ok('the flag is the first gate and it is named', gate.flagOn === false && /WEDDING_CREDIT_SEND_ENABLED/.test(gate.reason));
  ok('the two gates are independent (approval alone would not open it)', gate.approved === false);
  ok('claimUrl is live even while the send is dark (the founder pastes it)',
    /\/credits\/8f2c41a9$/.test(inv.claimUrl('8f2c41a9')));
}

// ── C8 · THE SEASON MAP (R-40.25) ───────────────────────────────────────────
sec('C8 \u00b7 the four seasons');
{
  ok('exactly four words', S.SEASONS.length === 4, S.SEASONS.join(','));
  ok('the words are the founder\'s',
    JSON.stringify(S.SEASONS) === JSON.stringify(['Winter','Spring','Summer','Monsoon']), S.SEASONS.join(','));
  const bands = { 1:'Winter',2:'Winter',3:'Spring',4:'Spring',5:'Summer',6:'Summer',7:'Summer',8:'Monsoon',9:'Monsoon',10:'Monsoon',11:'Winter',12:'Winter' };
  let bad = [];
  for (let m = 1; m <= 12; m += 1) {
    const d = '2026-' + String(m).padStart(2, '0') + '-15';
    if (S.seasonFor(d) !== bands[m]) bad.push(m + ':' + S.seasonFor(d));
  }
  ok('all twelve months land in R-40.25\'s bands', bad.length === 0, bad.join(','));
  ok('the ruled fixture renders Summer 2026', S.seasonYearFor('2026-07-31') === 'Summer 2026', S.seasonYearFor('2026-07-31'));
  ok('the mock\'s own frame renders Winter 2027', S.seasonYearFor('2027-02-14') === 'Winter 2027');
  ok('a Winter wedding in January carries the JANUARY year (R-40.25)',
    S.seasonYearFor('2026-01-15') === 'Winter 2026');
  // The timezone trap the string parse exists to avoid.
  ok('1 March is Spring regardless of the machine\'s clock', S.seasonFor('2026-03-01') === 'Spring');
  ok('a malformed date yields null, never a guessed season', S.seasonFor('not-a-date') === null);
}

// ── C9 · THE CLAIM TOKEN IS ONE ACTION, THEN TERMINAL (R-G11.14) ────────────
sec('C9 \u00b7 the claim token');
{
  const src = read(LIB);
  ok('settleCredit guards on status in the UPDATE, not in JS',
    /\.eq\('claim_token', token\)[\s\S]{0,200}\.eq\('status', 'tagged'\)/.test(src));
  ok('settleCredit refuses any status but claimed/declined',
    /status !== 'claimed' && status !== 'declined'/.test(src));
  const cr = read(CREDITS);
  ok('a dead token answers 404 information-free (the crew constitution)',
    /res\.status\(404\)\.json\(\{ ok: false, code: 'not_found' \}\)/.test(cr));
  // ⚠ COMMENTS ARE STRIPPED FIRST. The first cut of this cell read the claim
  // lane's own comment — "No localStorage, no sessionStorage anywhere in this
  // lane" — and reported the PROHIBITION as a BREACH. A cell that cannot tell a
  // rule from its violation is worse than no cell. Same class as the b40 census
  // that strips before matching, and the same cure.
  const stripped = cr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('no browser storage anywhere in the claim lane',
    !/localStorage|sessionStorage/.test(stripped));
  ok('0131 makes claim_token UNIQUE', /wedding_credits_claim_token_key UNIQUE \(claim_token\)/.test(read(MIGRATION)));
}

// ── C10 · THE EVENT PICKER FILTERS SOFT-DELETED ROWS (F-40.33) ──────────────
// Derived from the fixture: DEV440's `Blocked` event is soft-deleted and STILL
// reads state='upcoming'. A check keyed on state alone accepts a deleted day.
sec('C10 \u00b7 the create door refuses a deleted event');
{
  const src = read(STUDIO);
  ok('the create door scopes the event to the vendor', /\.eq\('vendor_id', req\.vendor\.id\)/.test(src));
  ok('AND filters deleted_at IS NULL', /\.is\('deleted_at', null\)/.test(src));
  ok('the ownership and liveness checks are ONE query', 
    /\.eq\('vendor_id', req\.vendor\.id\)\s*\n\s*\.is\('deleted_at', null\)/.test(src));
  ok('an event is required by the door even though the column is nullable (R-G11.21)',
    /if \(!eventId\) return errRes\(res, 400/.test(src));
}

// ── C11 · PUBLISH WRITES NO CONSENT BYTE (R-G11.10) ─────────────────────────
sec('C11 \u00b7 publish does not imply consent');
{
  const src = read(LIB);
  const fn = src.slice(src.indexOf('async function publishWedding'), src.indexOf('async function addPhoto'));
  ok('publishWedding exists', fn.length > 0);
  ok('publishWedding sets visibility', /visibility: 'published'/.test(fn));
  ok('publishWedding sets delivered_at (R-G11.20)', /delivered_at:/.test(fn));
  ok('publishWedding writes NO couple_consent byte', !/couple_consent/.test(fn));
  ok('no door in this sitting writes couple_consent at all',
    !/couple_consent\s*:/.test(read(STUDIO)) && !/couple_consent\s*:/.test(src));
}

if (process.argv.includes('--cells-only')) {
  process.exit(fail === 0 ? 0 : 1);
}

// ══════════════════════════════════════════════════════════════════════════════
// THE MUTATION PASS — production bytes, never test setup.
// ══════════════════════════════════════════════════════════════════════════════
if (process.argv.includes('--mutate')) {
  sec('MUTATIONS \u2014 each must turn the cells RED');
  const MUT = [
    [LIB, 'the slug rule expands the ampersand \u2014 every ratified address breaks',
      ".toLowerCase()\n    .replace(/[^a-z0-9]+/g, '-')",
      ".toLowerCase()\n    .replace(/&/g, ' and ')\n    .replace(/[^a-z0-9]+/g, '-')"],
    [LIB, 'the roll is reordered \u2014 the photographer leaves the top',
      "{ key: 'shot_by',   label: 'Shot by'   },\n  { key: 'makeup',    label: 'Makeup'    },",
      "{ key: 'makeup',    label: 'Makeup'    },\n  { key: 'shot_by',   label: 'Shot by'   },"],
    [LIB, 'a phone joins the public roll shape',
      "        handle: linkable ? String(v.routing_handle || '').toLowerCase() : null,",
      "        handle: linkable ? String(v.routing_handle || '').toLowerCase() : null,\n        phone: c.phone,"],
    [PUBDOOR, 'the consent gate is dropped \u2014 an unconsented page serves',
      "    if (wedding.couple_consent !== true) return notFound(res);",
      "    // consent gate removed"],
    [PUBDOOR, 'the miss body differs by reason \u2014 the reason leaks',
      "    if (wedding.visibility !== 'published') return notFound(res);",
      "    if (wedding.visibility !== 'published') return res.status(404).json({ ok: false, error: 'Not published.' });"],
    [STUDIO, 'the create door stops filtering soft-deleted events (F-40.33)',
      "    .is('deleted_at', null)\n", "    "],
    [LIB, 'publish starts implying consent (R-G11.10 broken)',
      "      visibility: 'published',",
      "      visibility: 'published',\n      couple_consent: true,"],
    [SEASON, 'a season band is retuned away from R-40.25',
      "  11: 'Winter',", "  11: 'Monsoon',"],
    [INVITE, 'the dark send loses its flag gate',
      "    open: flagOn && approved,", "    open: approved || true,"],
  ];
  for (const [rel, name, from, to] of MUT) {
    const abs = P(rel);
    const before = fs.readFileSync(abs);
    const txt = before.toString('utf8');
    if (!txt.includes(from)) { ok(name, false, 'mutation site absent \u2014 the code moved'); continue; }
    fs.writeFileSync(abs, txt.replace(from, to));
    const r = spawnSync(process.execPath, [__filename, '--cells-only'], { encoding: 'utf8' });
    fs.writeFileSync(abs, before);
    ok(name + ' \u2192 RED', r.status !== 0, 'exit ' + r.status);
    ok(name + ' \u2192 restored byte-for-byte', Buffer.compare(before, fs.readFileSync(abs)) === 0);
  }
}

// ── THE TAXONOMY EXCLUSION IS PROVEN NON-VACUOUS (R-G11.23 / F-40.36) ───────
// `bOB_taxonomy_bench`'s 6.1 was amended IN THIS SITTING to exclude the credit-
// role namespace, by the code that reddened it. That shape is only honest if the
// pin can actually fire, so these mutations drive bOB rather than b53 and each
// must turn it RED. If they cannot, the exclusion is a loosened detector and the
// amendment was a cover-up with a comment on it.
if (process.argv.includes('--mutate')) {
  sec('MUTATIONS \u00b7 the taxonomy exclusion must still be able to RED');
  const BOB = P('scripts/bOB_taxonomy_bench.js');
  const runBob = () => spawnSync(process.execPath, [BOB], { encoding: 'utf8' }).status;
  const baseline = runBob();
  ok('bOB is GREEN before any mutation', baseline === 0, 'exit ' + baseline);

  const BMUT = [
    [LIB, '6.1d: ROLE_KEYS drifts from 0131\'s CHECK \u2014 the exclusion describes a dead list',
      "  { key: 'venue',     label: 'Venue'     },", ""],
    [PUBDOOR, '6.1e: the wedding lane joins a role to vendors.category',
      "      .select('id, business_name, routing_handle, status, discover_paused')",
      "      .select('id, business_name, category, routing_handle, status, discover_paused')"],
    [LIB, 'the exclusion did NOT broaden the detector \u2014 a real private copy still reds',
      "const CREDIT_STATES = Object.freeze(['tagged', 'claimed', 'declined']);",
      "const CREDIT_STATES = Object.freeze(['tagged', 'claimed', 'declined']);\nconst PRIVATE_TAXONOMY = ['photography', 'jewellery', 'hairstylist', 'performer'];"],
  ];
  for (const [rel, name, from, to] of BMUT) {
    const abs = P(rel);
    const before = fs.readFileSync(abs);
    const txt = before.toString('utf8');
    if (!txt.includes(from)) { ok(name, false, 'mutation site absent \u2014 the code moved'); continue; }
    fs.writeFileSync(abs, txt.replace(from, to));
    const rc = runBob();
    fs.writeFileSync(abs, before);
    ok(name + ' \u2192 bOB RED', rc !== 0, 'exit ' + rc);
    ok(name + ' \u2192 restored byte-for-byte', Buffer.compare(before, fs.readFileSync(abs)) === 0);
  }
}

console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ' \u2014 b53 g11 wedding pages ' +
  pass + '/' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
