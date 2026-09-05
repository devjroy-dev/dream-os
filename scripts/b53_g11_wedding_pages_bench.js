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
/** Comments stripped before any PROHIBITION is tested. A cell that cannot tell a
 *  rule from its violation is worse than no cell — this bench's own e-4 was that
 *  class, and G1.2's e-5 was it again: four cells convicted the very comments
 *  that explain why a refused call was refused. `b42` has carried this helper
 *  since G1.1 and this file did not; the inline `stripped` at C9 was one cell's
 *  private copy, which is how a fact ends up with two homes and one of them
 *  missing. Hoisted here, one home, used by every prohibition below. */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const MIGRATION = 'db/migrations/0131_wedding_pages.sql';
const LIB       = 'src/lib/vendor/weddings.js';
const SEASON    = 'src/lib/season.js';
const PUBDOOR   = 'src/api/public/weddingPage.js';
const STUDIO    = 'src/api/vendor/studio/weddings.js';
const CREDITS   = 'src/api/credits.js';
const INVITE    = 'src/lib/vendor/creditInvite.js';
// ── G1.2's own subjects ─────────────────────────────────────────────────────
const SIGN      = 'src/lib/cloudinarySign.js';
const CONSENT   = 'src/api/consent.js';
const DOWNLOAD  = 'src/api/public/weddingDownload.js';
const LEADS     = 'src/lib/vendor/leads.js';
const MIG136    = 'db/migrations/0136_consent_attempts.sql';
const MIG133    = 'db/migrations/0133_guest_leads_and_consent.sql';

for (const rel of [MIGRATION, LIB, SEASON, PUBDOOR, STUDIO, CREDITS, INVITE,
                   SIGN, CONSENT, DOWNLOAD, LEADS, MIG133]) {
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
// ── SEALED CELL AMENDED, LABELLED — G1.2 (Meta returned Utility 2026-09-05) ──
// WAS: `isApproved === false` and `gate.approved === false`, under the sentence
// "the send is dark". THE PROPERTY IS UNCHANGED AND THE ASSERTION IS STRONGER.
//
// Meta approved BOTH templates as Utility, founder-witnessed in WhatsApp
// Manager. The old cells proved the send was shut while BOTH gates were shut —
// which cannot distinguish a two-gate design from a one-gate one, because either
// gate alone explained the result. Now that approval has moved, the cell can
// prove the thing the two-gate design was FOR: `approved` is TRUE, the flag is
// FALSE, and the send is STILL SHUT. The second gate is carrying the whole
// weight and this is the first moment that is demonstrable.
//
// Ratify or revert; it lands with the one-line flip that moved it.
sec('C7 \u00b7 approved is not live \u2014 the second gate carries it (F-40.21)');
{
  const t = fresh('src/lib/templates.js');
  ok('wedding_credit is registered', Boolean(t.getTemplate('wedding_credit')));
  ok('and Meta HAS approved it', t.isApproved('wedding_credit') === true);
  ok('it declares exactly four variables',
    JSON.stringify(t.getTemplate('wedding_credit').variables) === JSON.stringify(['owner','role','wedding','link']));
  const inv = fresh(INVITE);
  const gate = inv.sendGate();
  // THE CELL THAT MATTERS NOW: approved, and still shut.
  ok('the send gate is SHUT DESPITE approval', gate.open === false && gate.approved === true);
  ok('the flag is the gate that holds, and it NAMES itself',
    gate.flagOn === false && /WEDDING_CREDIT_SEND_ENABLED/.test(gate.reason));
  ok('claimUrl is live even while the send is dark (the founder pastes it)',
    /\/credits\/8f2c41a9$/.test(inv.claimUrl('8f2c41a9')));

  // ── THE SIXTH TEMPLATE, SAME LAW, ITS OWN FLAG ────────────────────────────
  // A second flag and not a shared one: vendors who were credited and couples
  // who are not on the platform are different audiences, and one switch would
  // mean the founder cannot open the safer one without opening the other.
  ok('wedding_consent is registered and approved', t.isApproved('wedding_consent') === true);
  ok('it declares exactly three variables',
    JSON.stringify(t.getTemplate('wedding_consent').variables) === JSON.stringify(['owner','wedding','link']));
  const cgate = inv.consentSendGate();
  ok('the consent send is SHUT DESPITE approval', cgate.open === false && cgate.approved === true);
  // ⚠ THIS CELL WAS TOO WEAK ON ITS FIRST CUT AND THE MUTATION PASS SAID SO.
  // It asserted only `cgate.reason`, which is a LITERAL string — so a gate that
  // actually read `WEDDING_CREDIT_SEND_ENABLED` while REPORTING the consent name
  // passed it. With both flags unset the two are observationally identical, and
  // the mutation "the consent send borrows the credit flag" stayed GREEN.
  // A mutation that does not bite is a cell that is not testing what its name
  // claims. Now the SOURCE is read: the consent gate must consult its own
  // variable, and the two gates must consult different ones.
  const invSrc = read(INVITE);
  const consentFn = invSrc.slice(invSrc.indexOf('function consentSendGate'),
                                 invSrc.indexOf('async function sendConsentInvite'));
  ok('the consent gate READS its own variable, not the credit one',
    /WEDDING_CONSENT_SEND_ENABLED/.test(consentFn)
    && !/WEDDING_CREDIT_SEND_ENABLED/.test(consentFn));
  ok('and it reports the same one it reads', /WEDDING_CONSENT_SEND_ENABLED/.test(cgate.reason));
  // NO REGISTERED BODY MAY OPEN OR CLOSE ON A VARIABLE — F-40.91. Meta refuses
  // both ("Variables can't be at the start or end of the template"), the founder
  // hit that wall in the Manager, and a census found exactly one violator among
  // eighteen. The estate had never met the rule and had no cell for it.
  const bodies = Object.values(t.TEMPLATES || {}).map((x) => String(x.body || '').trim());
  const bad = bodies.filter((b) => /^\{\{/.test(b) || /\{\{\d+\}\}$/.test(b));
  ok('no registered body opens or closes on a variable (F-40.91)',
    bodies.length > 0 && bad.length === 0, bad.join(' | '));
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
  // ── BASE AMENDED, LABELLED — G1.1c (R-G11c.8 / R-G11c.9, closes F-40.43) ───
  // WAS: `!/couple_consent\s*:/.test(read(STUDIO)) && !/couple_consent\s*:/.test(src)`
  //      — the WHOLE of src/lib/vendor/weddings.js, under the sentence "no door
  //      in this sitting writes couple_consent at all".
  //
  // WHY IT MOVED. G1.1c gives createWedding a consent SEED read from
  // `couples.publish_weddings`, in this same file, so the old assertion reds.
  // It is narrowed to its two TRUE subjects — the studio door whole, and
  // publishWedding's own slice — and its sentence rewritten to say what it
  // actually asserts.
  //
  // WHY THAT IS NOT A LOOSENED DETECTOR. R-G11.10 forbids a vendor door writing
  // consent AS A VENDOR'S CHOICE. The seed is not a choice: it copies the
  // couple's own standing answer off her row, never from a request body. The
  // thing this cell was built to catch — a vendor deciding consent — is still
  // caught, by this cell and by the `publish starts implying consent` mutation
  // below, which must still RED.
  //
  // WHAT NOW CARRIES THE REST. b54_g11c_couple_switch_bench asserts the seed
  // POSITIVELY and both ways: that it reads couples.publish_weddings, that it
  // never comes from req.body, and that removing it or sourcing it from the body
  // both RED. The assertion moved one instrument over; it was not dropped.
  //
  // RATIFY-OR-REVERT. This amendment lands in the SAME delivery as the code that
  // moved it (R-G11c.9) — a bench amendment landing first would be a green about
  // a tree that does not exist yet.
  ok('no VENDOR DOOR writes couple_consent as a choice (R-G11.10)',
    !/couple_consent\s*:/.test(read(STUDIO)) && !/couple_consent\s*:/.test(fn));

  // ── BASE AMENDED A SECOND TIME, LABELLED — G1.2 (R-G12.5, R-G11c.9's fences)
  // The chair's ruling: this cell's sentence becomes THE THREE NAMED WRITERS AND
  // NO VENDOR DOOR, asserted against a declared list. The line above is a
  // NEGATIVE and stays; what follows is the POSITIVE half it never had.
  //
  // WHY A DECLARED LIST AND NOT A GREP FOR WRITES. A bare "count the writes"
  // cell would have to guess at every shape a write can take — an `update({})`,
  // an `rpc`, a plpgsql body, a raw SQL string — and would go quietly vacuous the
  // first time someone invented a fourth. The list is DECLARED here, each entry
  // is proven to exist at its own home, and the cell reds when the count moves in
  // EITHER direction: a fourth writer appearing, or one of the three vanishing.
  //
  // THE THREE, EACH WITH ITS HOME AND WHY IT IS LAWFUL:
  //   1. couple_set_publish()      0132 — the on-platform couple's own switch.
  //   2. createWedding's seed      this LIB — a COPY of her standing answer, read
  //      from her row, never from a request body (R-G11c.8; b54 proves it both ways).
  //   3. wedding_set_consent()     0133 — the OFF-platform couple's token, checked
  //      inside the UPDATE so a bad token and an expired one are one miss.
  // No vendor door is among them. `publishWedding` writes visibility and
  // delivered_at and nothing else, which the line above asserts.
  {
    const m0132 = read('db/migrations/0132_couple_switch.sql');
    const m0133 = read('db/migrations/0133_guest_leads_and_consent.sql');
    const WRITERS = [
      ['couple_set_publish()  (0132)', /SET\s+couple_consent\s*=/.test(m0132)],
      ['createWedding seed    (lib)',  /couple_consent:\s*consentSeed/.test(read(LIB))],
      ['wedding_set_consent() (0133)', /SET\s+couple_consent\s*=/.test(m0133)],
    ];
    for (const [name, present] of WRITERS) {
      ok(`declared writer PRESENT at its home \u2014 ${name}`, present);
    }
    ok('the declared writer set is exactly THREE (R-G12.5 closes it)',
      WRITERS.length === 3);
    // NON-VACUITY, AND THE FENCE THAT MATTERS: the ONLY vendor-lane file allowed
    // to name the column is this LIB, and only through the seed and the rpc call.
    // A studio door growing a `couple_consent` write reds the negative above; a
    // FOURTH function in the lib writing it reds here.
    const libWrites = (read(LIB).match(/couple_consent\s*:/g) || []).length;
    ok('the lib names couple_consent as a written field exactly ONCE (the seed)',
      libWrites === 1, `found ${libWrites}`);
    // The token writer is reached by RPC and never as an update in this process —
    // the predicate must stay in the statement, where two taps cannot both pass.
    ok('the token writer is called through its function, never as an UPDATE',
      /rpc\('wedding_set_consent'/.test(read(LIB))
      && !/from\('weddings'\)[\s\S]{0,200}update\([\s\S]{0,120}couple_consent/.test(read(LIB)));
  }
}

// ── C12 · THE ARCHIVE SIGNER — R-G12.2, and the sort is PERFORMED ───────────
// `signUpload`'s three params are alphabetical BY LUCK (folder < public_id <
// timestamp), which this file's own header says at :44-48 is why all three donor
// sites were correct by construction rather than by care. The archive's are NOT:
// expires_at, mode, public_ids, timestamp, type — and a wrong order yields a 401
// that reads like a credentials problem and is not. So the sort is done, and
// this cell asserts it is done rather than assumed.
sec('C12 \u00b7 the archive signer (R-G12.2)');
{
  const sign = read(SIGN);
  ok('signArchive and archiveUrl are exported from the ONE home',
    /signArchive/.test(sign) && /archiveUrl/.test(sign)
    && /module\.exports[\s\S]*signArchive[\s\S]*archiveUrl/.test(sign));
  ok('the params are SORTED, not assumed alphabetical',
    /Object\.keys\(params\)\.sort\(\)/.test(sign));
  // An expiry is REQUIRED, never defaulted: a download link with no lifetime is
  // a permanent public URL to a couple's whole wedding.
  ok('expiresAt is required, never silently defaulted',
    /expiresAt.*required/.test(sign) && /Number\.isFinite\(expiresAt\)/.test(sign));
  ok('the secret is appended to the signed string, matching signUpload exactly',
    /\.update\(paramsToSign \+ apiSecret\(\)\)/.test(sign));
  // NON-VACUITY: the signer must actually be reachable by the door that needs it.
  ok('C12 is not vacuous \u2014 the download door imports the signer',
    /require\('\.\.\/\.\.\/lib\/cloudinarySign'\)/.test(read(DOWNLOAD)));
}

// ── C13 · THE DELETE DOOR — R-G12.12 ───────────────────────────────────────
// The row goes first and the asset second, and the ORDER is the ruling: a
// destroy that succeeded before a failed row delete leaves a broken <img> on a
// couple's wedding page, visible to every guest. The reverse costs storage and
// nothing else.
sec('C13 \u00b7 the photo delete door (R-G12.12)');
{
  const studio = read(STUDIO);
  ok('the delete door exists at its ruled address',
    /router\.delete\('\/:id\/photos\/:photoId'/.test(studio));
  // THE SCOPE IS THE WHOLE POINT. A bare `.eq('id', photoId)` would let any
  // authenticated vendor delete any vendor's photograph by guessing a uuid.
  ok('deletePhoto is scoped THROUGH the wedding, not by photo id alone',
    /\.eq\('id', photoId\)[\s\S]{0,80}\.eq\('wedding_id', weddingId\)/.test(read(LIB)));
  ok('the destroy uses the STORED public_id, never a parsed URL (F-07.14)',
    /destroyVerified\(photo\.public_id\)/.test(studio));
  // `deleteFromCloudinary` fires and reads nothing back inside a bare catch, so a
  // 401, a 404 and a success are byte-indistinguishable to it — unfit for a
  // report a vendor reads.
  // ⚠ STRIPPED. My first cut tested the RAW source and went RED against a door
  // that is correct — the comment above the call NAMES the legacy function in
  // order to explain why it was refused. A cell that cannot tell a rule from its
  // violation is worse than no cell; this file's own e-4 was the same class and
  // the strip helper existed the whole time (e-5, owned).
  ok('it calls destroyVerified, NOT the fire-and-forget legacy',
    !/deleteFromCloudinary/.test(strip(studio)));
  ok('no reorder door shipped \u2014 R-G12.12 was narrowed (F-40.83)',
    !/photos\/order/.test(studio) && !/reorderPhotos/.test(read(LIB)));
}

// ── C14 · THE CONSENT PAIR — R-G12.4 / R-G12.5, F-40.49 ────────────────────
// The token is the whole credential and the expiry is enforced in TWO places on
// purpose: the read evaluates it so the page renders the same dead sentence, and
// the FUNCTION re-checks it inside its UPDATE so a caller that skipped the read
// cannot write anyway.
sec('C14 \u00b7 the off-platform couple\u2019s consent (R-G12.4/.5)');
{
  const lib = read(LIB), consent = read(CONSENT), m0133 = read(MIG133);
  ok('0133 declares wedding_set_consent', /FUNCTION wedding_set_consent/.test(m0133));
  ok('the token AND the expiry are checked INSIDE the UPDATE, not before it',
    /WHERE w\.id\s*=\s*p_wedding_id[\s\S]{0,220}consent_token\s*=\s*p_token[\s\S]{0,220}consent_sent_at\s*>/.test(m0133));
  // Zero rows must NOT raise: a raise would let a prober tell a wrong token from
  // an expired one by the error it produced.
  ok('zero rows touched is a MISS, never an exception',
    !/IF NOT FOUND[\s\S]{0,120}RAISE EXCEPTION[\s\S]{0,120}consent/i.test(m0133));
  ok('the lib re-checks the 30-day expiry on the read path too',
    /30 \* 24 \* 60 \* 60 \* 1000/.test(lib));
  ok('withdraw stands beside publish \u2014 consent is a switch, not a trapdoor',
    /\/:token\/publish/.test(consent) && /\/:token\/withdraw/.test(consent));
  // The one-action-then-terminal rule of the CLAIM lane must NOT have been copied
  // here: a couple who can say yes and never no has not been given a switch.
  ok('the claim lane\u2019s terminal rule was NOT copied onto consent',
    !/terminal:\s*true/.test(consent));
  ok('the consent phone and token never reach the public wire (R-G11.6)',
    !/consent_phone/.test(strip(consent)) && !/consent_token/.test(strip(consent)));
  // A page whose couple IS on TDW is governed by her switch; two doors to one
  // decision is the disease the writer-set census exists to prevent.
  ok('minting refuses a page whose couple is already on TDW',
    /couple_on_platform/.test(lib) && /couple_on_platform/.test(read(STUDIO)));
}

// ── C15 · THE GUEST LEAD — R-G12.3 / R-G12.11 ──────────────────────────────
// The download is NEVER the opt-in: she gets her photographs whether she ticks
// the box or not. A download withheld until she consents is consent bought with
// a hostage, and "silence never means yes" is worth nothing if the alternative
// to yes is losing the pictures.
sec('C15 \u00b7 the guest lead and the phone that goes nowhere (R-G12.3)');
{
  const dl = read(DOWNLOAD), leads = read(LEADS);
  ok('the lead is written through the ONE home, never a fifth INSERT',
    /createLead\(supabase, owner\.id/.test(dl) && !/from\('leads'\)[\s\S]{0,80}\.insert/.test(dl));
  // THE CELL THAT MATTERS: a `no` must write no digit anywhere.
  ok('a NO writes phone NULL \u2014 the number is held nowhere',
    /phone:\s*mayContact \? phone : null/.test(dl));
  // ⚠ RE-AUTHORED. My first cut compared `indexOf('signArchive')` against
  // `indexOf('mayContact')` — and `signArchive` first appears in the IMPORT at
  // the top of the file, so the cell was measuring a require statement and
  // convicting a correct door. THE REAL PROPERTY is that no branch keyed on her
  // answer can skip the download: an early return on `!mayContact` is the only
  // way this door could hold her photographs hostage, so that is what is asserted.
  ok('the download is not withheld on a NO \u2014 no branch on her answer skips it',
    !/if\s*\(\s*!\s*mayContact\s*\)[\s\S]{0,80}return/.test(strip(dl))
    && /const mayContact/.test(strip(dl)));
  ok('the month becomes the ESTATE\u2019S OWN idiom, not a new column (R-G12.11)',
    /wedding_date_precision:\s*weddingDate \? 'month' : null/.test(dl));
  ok('createLead actually ACCEPTS both, so neither is silently dropped',
    /wedding_id, wedding_date_precision,/.test(leads)
    && /wedding_id:\s+wedding_id\s+\|\| null/.test(leads));
  ok('the source is spelled once and stays free text (R-40.13)',
    (strip(dl).match(/'wedding_guest'/g) || []).length === 1);
  // The page's own three gates must hold here too, or a stranger could probe for
  // weddings the page refuses to show.
  ok('the download door repeats the page\u2019s three misses',
    /visibility !== 'published'/.test(dl) && /couple_consent !== true/.test(dl));
  ok('nothing about the guest is on the response',
    !/phone/.test(dl.slice(dl.indexOf('return res.status(200)'))));
}

// ── C16 · THE ANSWER IS A REDIRECT — F-40.102 (R-G12.17) ───────────────────
// THIS DOOR ANSWERS AN HTML FORM POST, and a browser NAVIGATES to whatever comes
// back. The first cut returned `res.json(...)`, so a guest who tapped Send landed
// on raw JSON: no sentence, no link, and the vetoed G2-done frame unreachable.
// R-G12.10 ruled the answer render and only the leaf's half was built.
sec('C16 \u00b7 the download answers with a redirect, not JSON (F-40.102)');
{
  const dl = strip(read(DOWNLOAD));
  ok('the form POST is answered by a redirect', /res\.redirect\(303/.test(dl));
  // 303 and not 302: after a POST, 303 tells the browser to follow with GET. A
  // 302 leaves the method to the client and a refresh would re-POST her lead.
  ok('it is 303, so a refresh cannot re-write her lead', !/res\.redirect\(302/.test(dl));
  ok('no JSON body survives on the form-POST path',
    !/return res\.status\(200\)\.json\(\{ ok: true, download/.test(dl));
  ok('the redirect carries an OPAQUE token, never the archive URL',
    /sent=1&dl=\$\{encodeURIComponent\(token\)\}/.test(dl)
    && !/archiveDownloadUrl[\s\S]{0,200}redirect/.test(dl));
  // FAIL-CLOSED: mintSigned returns null only when the secret is absent, and a
  // token minted from nothing proves nothing.
  ok('a missing secret sends her to a page that says so, never to a dead link',
    /if \(!token\)[\s\S]{0,300}sent=0/.test(dl));
}

// ── C17 · THE RESOLVE DOOR RE-ANSWERS CONSENT ──────────────────────────────
// A token proves WHICH WEDDING, never that the wedding still serves. A couple
// who withdraws between the form post and the tap must not have her photographs
// handed out on a token minted a minute earlier.
sec('C17 \u00b7 the archive resolve re-checks the three gates');
{
  const dl = strip(read(DOWNLOAD));
  const fn = dl.slice(dl.indexOf("router.get('/:code/:slug/archive/:token'"));
  ok('the resolve door exists', fn.length > 0);
  ok('it re-checks published AND consent, not just the token',
    /visibility !== 'published'/.test(fn) && /couple_consent !== true/.test(fn));
  ok('and the owner\u2019s own switches too',
    /status !== 'active'/.test(fn) && /discover_paused === true/.test(fn));
  ok('a bad, forged or expired token is the SAME miss as an absent page',
    /if \(!code \|\| !slug \|\| !weddingId\) return notFound/.test(fn));
  // The token is bound to the wedding, so one page's token cannot fetch another's.
  ok('the token\u2019s subject scopes the lookup', /\.eq\('id', weddingId\)/.test(fn));
  ok('the archive is signed in DOWNLOAD mode \u2014 a POST is not tappable',
    /mode:\s+'download'/.test(fn));
  // ⚠ `mode` IS INSIDE THE SIGNATURE. If it were appended after signing, swapping
  // it would silently 401 and read as a credentials problem.
  ok('mode is a SIGNED param, not appended after the fact',
    /mode:\s+mode === 'download'/.test(strip(read(SIGN))));
}

// ── C18 · F-40.105 · THE CONSENT TOKEN NEVER REACHES THE VENDOR ────────────
// THE FOUNDER FOUND THIS ON GLASS. The door returned `consent_url` and the room
// printed it, so the VENDOR held the couple's consent link and could answer with
// it — master §2.4's "neither does the counterparty", defeated by the surface
// that mints the token. It arrived as a dark-send fallback and outlived the
// approval that retired its reason.
sec('C18 \u00b7 the consent link is not vendor-facing (F-40.105 / R-G12.18)');
{
  const studio = strip(read(STUDIO));
  ok('the studio door returns NO consent url', !/consent_url/.test(studio));
  ok('and does not even build one', !/consentUrl\(/.test(studio));
  // What she gets instead is four digits she already typed.
  ok('she is told the last four of the number she typed, and nothing more',
    /sent_to_last4: W\.lastFourOf\(phone\)/.test(studio));
  // R-G12.18.2: a resend that took a number would silently redirect a LIVE token.
  ok('the resend takes NO number \u2014 it uses the stored one',
    /consent\/resend/.test(studio)
    && /to: row\.consent_phone/.test(studio)
    && !/consent\/resend[\s\S]{0,900}body[\s\S]{0,40}phone/.test(studio));
  // THE WHOLE-LANE SWEEP: no vendor-facing file may name the token at all.
  // ⚠ MY FIRST CUT ASSERTED THE FILE NEVER *NAMES* THE TOKEN, AND IT CONVICTED
  // A CORRECT DOOR. The resend MUST read `consent_token` server-side — that is
  // how it sends to the stored number without the vendor ever holding it. The
  // property is not "the word is absent", it is "the token never reaches a
  // RESPONSE", and those are different sentences. Narrowed to the true subject;
  // a cell that convicts the right code is not a stricter cell, it is a broken
  // one (this bench's own e-4, and mine at e-5).
  const payloads = [...strip(read(STUDIO)).matchAll(/okRes\(res, \{[\s\S]*?\}\);/g)]
    .map((m) => m[0]).join('\n');
  ok('C18 is not vacuous \u2014 the door\u2019s responses were found', payloads.length > 0);
  ok('no studio RESPONSE carries the consent token',
    !/consent_token/.test(payloads) && !/consent_url/.test(payloads));
}

// ── C19 · THE LAST-FOUR CHECK — R-G12.18.4 ─────────────────────────────────
// A FRICTION CHECK AGAINST A FORWARDED LINK, NOT AN OTP. Nothing is sent and
// nothing is stored; the digits are compared server-side against a number this
// estate never returns, not even masked, anywhere in this lane.
sec('C19 \u00b7 the last-four check gates the switch');
{
  const lib = strip(read(LIB));
  const cons = strip(read(CONSENT));
  const mig = read('db/migrations/0136_consent_attempts.sql');
  ok('0136 adds the counter beside the thing it protects', /consent_attempts/.test(mig));
  // ⚠ THIS CELL WAS TOO WEAK AND THE MUTATION PASS SAID SO. It asserted the
  // substring was PRESENT, so a line that fell back to the caller's own digits
  // when the row had none — `lastFourOf(phone) || digits` — still matched, and
  // the mutation "any four digits pass" stayed GREEN. A mutation that does not
  // bite is a cell that is not testing what its name claims. The property is
  // that `want` comes from the ROW AND NOTHING ELSE, so the line is read whole
  // and the caller's input must not appear on it.
  const wantLine = (lib.match(/const want = .*/) || [''])[0];
  ok('C19 is not vacuous \u2014 the comparison line was found', wantLine.length > 0);
  ok('the expected digits come from the ROW alone, never from the caller',
    /lastFourOf\(wedding\.consent_phone\)/.test(wantLine)
    && !/digits/.test(wantLine) && !/\|\|/.test(wantLine), wantLine);
  // The number must never leave — not whole, not masked, not four digits of it.
  ok('the consent lane returns NO part of her number',
    !/consent_phone/.test(cons.replace(/select\([^)]*\)/g, '')));
  ok('three wrong answers SPEND the token', /attempts >= CONSENT_MAX_ATTEMPTS/.test(lib)
    && /patch\.consent_token = null/.test(lib));
  // Spending is NULL, not a flag — so a spent token reaches the SAME miss as a
  // forged one, enforced by the lookup rather than a branch someone can reorder.
  ok('spending is a NULL token, never a flag', !/consent_spent|is_spent/.test(lib));
  // A correct answer must not forgive earlier guesses.
  ok('a correct answer does not reset the count',
    !/got === want[\s\S]{0,200}consent_attempts: 0/.test(lib));
  // THE PASS IS SERVER-ENFORCED. A leaf that remembers it passed is a suggestion.
  ok('the writing doors require a signed pass, not a client boolean',
    /passHolds\(pass, v\.id\)/.test(cons) && /mintSigned/.test(cons));
  ok('and the pass is bound to THIS wedding', /subject: \[String\(weddingId/.test(cons));
  // One answer for every failure.
  ok('a wrong guess, a spent token and an absent page are ONE miss',
    /if \(!okDigits\) return dead\(res\)/.test(cons));
  // The founder's ask: she sees what she just published.
  ok('a yes returns the page\u2019s own public address', /page_url: v\.pageUrl/.test(cons));
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
    // ── G1.2 · THE ARCHIVE SIGNER ─────────────────────────────────────────────
    // The sort is the ONE thing that separates this signer from `signUpload`,
    // whose params are alphabetical by luck. Remove it and the signature is over
    // a different string than the request carries — a 401 that reads like a
    // credentials problem and is not.
    // ── THE SECOND GATE IS THE ONLY ONE LEFT; PROVE IT CAN STILL RED ─────────
    // With both templates approved, a careless edit that dropped the flag check
    // would open live traffic to real numbers and nothing else would object.
    ['src/lib/vendor/creditInvite.js',
      'the credit send drops its flag gate \u2014 approval alone opens live traffic',
      "  const flagOn   = String(process.env.WEDDING_CREDIT_SEND_ENABLED || '') === '1';",
      "  const flagOn   = true;"],
    ['src/lib/vendor/creditInvite.js',
      'the consent send borrows the credit flag \u2014 one switch opens two audiences',
      "  const flagOn   = String(process.env.WEDDING_CONSENT_SEND_ENABLED || '') === '1';",
      "  const flagOn   = String(process.env.WEDDING_CREDIT_SEND_ENABLED || '') === '1';"],
    // F-40.91: the placement rule the estate met exactly once and had no cell for.
    ['src/lib/templates.js',
      'a registered body opens on a variable again \u2014 Meta refuses it (F-40.91)',
      "      'You\u2019ve been credited on a wedding page. {{1}} credited you as {{2}} on ' +",
      "      '{{1}} credited you as {{2}} on ' +"],

    // ── F-40.105 · THE FOUNDER'S FIND, PROVEN ABLE TO RED ─────────────────────
    [STUDIO, 'the consent link goes back to the vendor \u2014 the counterparty can say yes again',
      "    sent_to_last4: W.lastFourOf(phone),",
      "    consent_url: 'x', sent_to_last4: W.lastFourOf(phone),"],
    // R-G12.18.4: without the check, a forwarded link is a switch.
    [CONSENT, 'the last-four check is skipped \u2014 a forwarded link answers for her',
      "    if (!passHolds(pass, v.id)) return dead(res);",
      "    // check skipped"],
    // The pass must be SERVER-verified; a client boolean is theatre.
    [LIB, 'wrong answers stop spending the token \u2014 a guesser gets unlimited tries',
      "  if (attempts >= CONSENT_MAX_ATTEMPTS) patch.consent_token = null;",
      "  // token never spent"],
    [LIB, 'the check compares against the WRONG field \u2014 any four digits pass',
      "  const want = lastFourOf(wedding.consent_phone);",
      "  const want = lastFourOf(wedding.consent_phone) || String(digits).replace(/\\D/g, '');"],

    // ── R-G12.17 · F-40.102's cure, proven able to red ────────────────────────
    [DOWNLOAD, 'the door answers the form POST with JSON again \u2014 raw JSON on a guest\u2019s screen',
      "  return res.redirect(303,\n    `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}`\n    + `?sent=1&dl=${encodeURIComponent(token)}`);",
      "  return res.status(200).json({ ok: true, download: token, lead: leadWritten });"],
    [DOWNLOAD, 'the resolve door stops re-checking consent \u2014 a withdrawn wedding still hands out its zip',
      "  if (wedding.couple_consent !== true) return notFound(res);\n\n  const photos = await W.photosFor(supabase, wedding.id);\n  if (!photos.length) return notFound(res);",
      "  const photos = await W.photosFor(supabase, wedding.id);\n  if (!photos.length) return notFound(res);"],
    [DOWNLOAD, 'the archive is signed in CREATE mode \u2014 the guest is handed a POST she cannot tap',
      "      mode:      'download',",
      "      mode:      'create',"],

    [SIGN, 'the archive params stop being sorted \u2014 a 401 that looks like bad credentials',
      "  const paramsToSign = Object.keys(params).sort()",
      "  const paramsToSign = Object.keys(params)"],
    [SIGN, 'the archive link loses its expiry \u2014 a permanent public URL to a wedding',
      "  if (!Number.isFinite(expiresAt)) {\n    throw new Error('signArchive: expiresAt (unix seconds) is required.');\n  }",
      "  if (false) { throw new Error('unreachable'); }"],

    // ── G1.2 · THE DELETE DOOR ───────────────────────────────────────────────
    // Without the wedding scope any authenticated vendor deletes any vendor's
    // photograph by guessing a uuid.
    [LIB, 'the delete loses its wedding scope \u2014 any vendor deletes any photograph',
      "    .eq('id', photoId)\n    .eq('wedding_id', weddingId)",
      "    .eq('id', photoId)"],

    // ── G1.2 · THE CONSENT EXPIRY, BOTH WAYS ─────────────────────────────────
    // It is enforced in TWO places on purpose: the read so the page renders the
    // same dead sentence, the FUNCTION so a caller that skipped the read still
    // cannot write. Each half is mutated on its own, because a cure that lives in
    // one place only is the half-cure F-40.80 was minted for.
    [MIG133, 'the FUNCTION stops checking the expiry \u2014 a dead token still writes',
      "     AND w.consent_sent_at IS NOT NULL\n     AND w.consent_sent_at > (now() - interval '30 days');",
      "     AND w.consent_sent_at IS NOT NULL;"],
    [LIB, 'the READ stops checking the expiry \u2014 an expired page renders live',
      "  if (ageMs > 30 * 24 * 60 * 60 * 1000) return null;",
      "  // expiry check removed"],

    // ── G1.2 · THE GUEST'S NO ────────────────────────────────────────────────
    // THE ONE THAT MATTERS. A `no` must write no digit anywhere: not on the lead,
    // not on the wedding, not in a log. This mutation is the whole of R-G12.3.
    [DOWNLOAD, 'a NO starts writing her number anyway \u2014 the opt-out becomes decoration',
      "      phone: mayContact ? phone : null,",
      "      phone: phone,"],
    [DOWNLOAD, 'the month loses its precision \u2014 a first-of-month becomes a claimed day',
      "      wedding_date_precision: weddingDate ? 'month' : null,",
      "      wedding_date_precision: null,"],

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
